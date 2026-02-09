"use client";

import { useCallback, useRef, useState } from "react";
import Papa from "papaparse";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Upload,
  FileSpreadsheet,
  Loader2,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
} from "lucide-react";
import { toast } from "sonner";
import { ColumnMapper } from "./column-mapper";
import type { Employee, ShiftCode } from "@/types";

// ─── Column auto-mapping dictionary ──────────────────────────────────────
const COLUMN_MAPPING: Record<string, string[]> = {
  matricule: ["Matricule", "Employee ID", "Emp ID", "Badge", "ID", "N Matricule", "Numero"],
  lastName: ["Nom", "Last Name", "LastName", "Surname", "Name"],
  firstName: ["Prenom", "Prénom", "First Name", "FirstName"],
  department: ["Service", "Unite", "Unité", "Department", "Dept", "Unit", "Cost Center"],
  position: ["Poste", "Fonction", "Position", "Job", "Role", "Grade"],
  date: ["Date", "Jour", "Day"],
  shiftCode: ["Code", "Code Vacation", "Vacation", "Shift", "Shift Code", "Type", "Code Horaire"],
  startTime: ["Heure Debut", "Heure début", "Debut", "Start", "Start Time", "HD", "From"],
  endTime: ["Heure Fin", "Fin", "End", "End Time", "HF", "To"],
  duration: ["Duree", "Durée", "Hours", "Heures", "Duration", "Total"],
  breakDuration: ["Pause", "Coupure", "Break", "Break Duration"],
};

// ─── Step definitions ─────────────────────────────────────────────────────
type Step =
  | "upload"
  | "parse"
  | "mapping"
  | "employees"
  | "shiftCodes"
  | "preview"
  | "confirm";

const STEP_LABELS: Record<Step, string> = {
  upload: "Fichier",
  parse: "Analyse",
  mapping: "Colonnes",
  employees: "Employes",
  shiftCodes: "Codes",
  preview: "Apercu",
  confirm: "Import",
};

const STEPS: Step[] = [
  "upload",
  "parse",
  "mapping",
  "employees",
  "shiftCodes",
  "preview",
  "confirm",
];

// ─── Row status for preview ──────────────────────────────────────────────
type RowStatus = "valid" | "warning" | "error";

interface ProcessedRow {
  rowIndex: number;
  raw: Record<string, string>;
  status: RowStatus;
  statusMessage: string;
  // Resolved data
  employeeId: string | null;
  newEmployeeKey: string | null; // cle pour les employes a auto-creer
  employeeName: string;
  date: string;
  shiftCode: string;
  shiftCategory: string;
  startTime: string;
  endTime: string;
  breakMinutes: number;
}

// ─── Date format detection ───────────────────────────────────────────────
function detectDateFormat(samples: string[]): string {
  const formats = [
    { regex: /^\d{2}\/\d{2}\/\d{4}$/, format: "DD/MM/YYYY" },
    { regex: /^\d{4}-\d{2}-\d{2}$/, format: "YYYY-MM-DD" },
    { regex: /^\d{2}\/\d{2}\/\d{4}$/, format: "MM/DD/YYYY" },
  ];

  for (const f of formats) {
    if (samples.every((s) => f.regex.test(s.trim()))) {
      return f.format;
    }
  }
  return "DD/MM/YYYY"; // default
}

function parseDate(value: string, format: string): string {
  const v = value.trim();
  if (format === "YYYY-MM-DD") return v;

  const parts = v.split("/");
  if (parts.length !== 3) return v;

  if (format === "DD/MM/YYYY") {
    return `${parts[2]}-${parts[1].padStart(2, "0")}-${parts[0].padStart(2, "0")}`;
  }
  if (format === "MM/DD/YYYY") {
    return `${parts[2]}-${parts[0].padStart(2, "0")}-${parts[1].padStart(2, "0")}`;
  }
  return v;
}

function normalizeTime(value: string): string {
  const v = value.trim();
  // Already HH:MM
  if (/^\d{2}:\d{2}$/.test(v)) return v;
  // H:MM
  if (/^\d{1}:\d{2}$/.test(v)) return `0${v}`;
  // HHMM
  if (/^\d{4}$/.test(v)) return `${v.slice(0, 2)}:${v.slice(2)}`;
  // HhMM (french)
  const hMatch = v.match(/^(\d{1,2})[hH](\d{2})$/);
  if (hMatch) return `${hMatch[1].padStart(2, "0")}:${hMatch[2]}`;
  return v;
}

// ─── Component ───────────────────────────────────────────────────────────
interface CsvImporterProps {
  onImportComplete: () => void;
}

export function CsvImporter({ onImportComplete }: CsvImporterProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Wizard state
  const [step, setStep] = useState<Step>("upload");
  const [processing, setProcessing] = useState(false);

  // Data state
  const [fileName, setFileName] = useState("");
  const [rawHeaders, setRawHeaders] = useState<string[]>([]);
  const [rawRows, setRawRows] = useState<string[][]>([]);
  const [separator, setSeparator] = useState("");
  const [detectedDateFormat, setDetectedDateFormat] = useState("DD/MM/YYYY");
  const [columnMapping, setColumnMapping] = useState<Record<string, string>>({});

  // Employee/shift code data
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [shiftCodes, setShiftCodes] = useState<ShiftCode[]>([]);

  // Processed rows
  const [processedRows, setProcessedRows] = useState<ProcessedRow[]>([]);
  const [unknownCodes, setUnknownCodes] = useState<string[]>([]);

  // Auto-create employees
  const [newEmployeesFromCsv, setNewEmployeesFromCsv] = useState<
    { key: string; matricule?: string; firstName: string; lastName: string; department?: string; position?: string }[]
  >([]);

  // Import result
  const [importResult, setImportResult] = useState<{
    inserted: number;
    total: number;
    skipped: number;
    duplicatesSkipped: number;
    employeesCreated: number;
  } | null>(null);

  // ── Helpers ──────────────────────────────────────────────────────────

  const currentStepIndex = STEPS.indexOf(step);

  function canGoNext(): boolean {
    switch (step) {
      case "upload":
        return rawRows.length > 0;
      case "parse":
        return rawHeaders.length > 0;
      case "mapping": {
        const mappedFields = new Set(Object.values(columnMapping));
        return mappedFields.has("date") && mappedFields.has("shiftCode") &&
          (mappedFields.has("matricule") || (mappedFields.has("firstName") && mappedFields.has("lastName")));
      }
      case "employees":
        return employees.length > 0;
      case "shiftCodes":
        return true;
      case "preview":
        return processedRows.some((r) => r.status !== "error");
      default:
        return false;
    }
  }

  function goBack() {
    const idx = currentStepIndex;
    if (idx > 0) setStep(STEPS[idx - 1]);
  }

  // ── Auto-map columns ────────────────────────────────────────────────

  function autoMapColumns(headers: string[]): Record<string, string> {
    const mapping: Record<string, string> = {};
    const used = new Set<string>();

    for (const header of headers) {
      const normalizedHeader = header.trim().toLowerCase().replace(/[_\-\s]+/g, " ");

      for (const [field, aliases] of Object.entries(COLUMN_MAPPING)) {
        if (used.has(field)) continue;

        const match = aliases.some(
          (alias) => alias.toLowerCase().replace(/[_\-\s]+/g, " ") === normalizedHeader
        );

        if (match) {
          mapping[header] = field;
          used.add(field);
          break;
        }
      }

      if (!mapping[header]) {
        mapping[header] = "__ignore__";
      }
    }

    return mapping;
  }

  // ── Step 1: Upload ──────────────────────────────────────────────────

  function handleFile(file: File) {
    setFileName(file.name);
    setProcessing(true);

    Papa.parse(file, {
      skipEmptyLines: true,
      encoding: "UTF-8",
      complete(results) {
        const data = results.data as string[][];

        if (data.length < 2) {
          toast.error("Le fichier est vide ou ne contient qu'une ligne d'entete");
          setProcessing(false);
          return;
        }

        // Detect separator
        const meta = results.meta;
        const detectedSeparator = meta.delimiter ?? ",";
        setSeparator(detectedSeparator);

        const headers = data[0].map((h) => h.trim());
        const rows = data.slice(1);

        setRawHeaders(headers);
        setRawRows(rows);

        // Auto-detect date format
        const dateMapping = autoMapColumns(headers);
        const dateField = Object.keys(dateMapping).find(
          (k) => dateMapping[k] === "date"
        );
        if (dateField) {
          const dateColIdx = headers.indexOf(dateField);
          if (dateColIdx >= 0) {
            const dateSamples = rows
              .slice(0, 20)
              .map((r) => r[dateColIdx])
              .filter(Boolean);
            const fmt = detectDateFormat(dateSamples);
            setDetectedDateFormat(fmt);
          }
        }

        // Auto-map columns
        setColumnMapping(dateMapping);

        setProcessing(false);
        setStep("parse");
      },
      error(error) {
        toast.error(`Erreur de lecture : ${error.message}`);
        setProcessing(false);
      },
    });
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file && (file.name.endsWith(".csv") || file.name.endsWith(".txt"))) {
      handleFile(file);
    } else {
      toast.error("Veuillez deposer un fichier CSV");
    }
  }

  function handleFileInput(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  }

  // ── Step 4: Employee matching ───────────────────────────────────────

  const fetchEmployees = useCallback(async () => {
    setProcessing(true);
    try {
      const res = await fetch("/api/admin/employees");
      if (!res.ok) throw new Error("Erreur");
      const data: Employee[] = await res.json();
      setEmployees(data);
    } catch {
      toast.error("Impossible de charger les employes");
    } finally {
      setProcessing(false);
    }
  }, []);

  // ── Step 5: Shift code resolution ──────────────────────────────────

  const fetchShiftCodes = useCallback(async () => {
    setProcessing(true);
    try {
      const res = await fetch("/api/admin/shift-codes");
      if (!res.ok) throw new Error("Erreur");
      const data: ShiftCode[] = await res.json();
      setShiftCodes(data);
    } catch {
      toast.error("Impossible de charger les codes vacation");
    } finally {
      setProcessing(false);
    }
  }, []);

  // ── Process rows: match employees + resolve codes ──────────────────

  function processAllRows() {
    const headerIndexMap: Record<string, number> = {};
    for (const [header, field] of Object.entries(columnMapping)) {
      if (field !== "__ignore__") {
        headerIndexMap[field] = rawHeaders.indexOf(header);
      }
    }

    function getVal(row: string[], field: string): string {
      const idx = headerIndexMap[field];
      if (idx === undefined || idx < 0) return "";
      return (row[idx] ?? "").trim();
    }

    // Build employee lookup maps
    const empByMatricule = new Map<string, Employee>();
    const empByName = new Map<string, Employee>();
    for (const emp of employees) {
      if (emp.matricule) {
        empByMatricule.set(emp.matricule.toLowerCase(), emp);
      }
      const key = `${emp.firstName.toLowerCase()}|${emp.lastName.toLowerCase()}`;
      empByName.set(key, emp);
    }

    // Build shift code lookup
    const codeMap = new Map<string, ShiftCode>();
    for (const sc of shiftCodes) {
      codeMap.set(sc.code.toLowerCase(), sc);
    }

    const unknowns = new Set<string>();
    const rows: ProcessedRow[] = [];
    const newEmployeesMap = new Map<string, { key: string; matricule?: string; firstName: string; lastName: string; department?: string; position?: string }>();

    for (let i = 0; i < rawRows.length; i++) {
      const raw = rawRows[i];
      const rawObj: Record<string, string> = {};
      rawHeaders.forEach((h, idx) => {
        rawObj[h] = raw[idx] ?? "";
      });

      // 1. Match employee
      let matchedEmployee: Employee | undefined;
      const matriculeVal = getVal(raw, "matricule");
      const firstNameVal = getVal(raw, "firstName");
      const lastNameVal = getVal(raw, "lastName");
      const departmentVal = getVal(raw, "department");
      const positionVal = getVal(raw, "position");

      if (matriculeVal) {
        matchedEmployee = empByMatricule.get(matriculeVal.toLowerCase());
      }
      if (!matchedEmployee && firstNameVal && lastNameVal) {
        matchedEmployee = empByName.get(
          `${firstNameVal.toLowerCase()}|${lastNameVal.toLowerCase()}`
        );
      }

      // Si non trouve, preparer l'auto-creation
      let newEmployeeKey: string | null = null;
      if (!matchedEmployee && (firstNameVal || matriculeVal)) {
        newEmployeeKey = matriculeVal
          ? `mat:${matriculeVal.toLowerCase()}`
          : `name:${firstNameVal.toLowerCase()}|${lastNameVal.toLowerCase()}`;

        if (!newEmployeesMap.has(newEmployeeKey)) {
          newEmployeesMap.set(newEmployeeKey, {
            key: newEmployeeKey,
            matricule: matriculeVal || undefined,
            firstName: firstNameVal,
            lastName: lastNameVal,
            department: departmentVal || undefined,
            position: positionVal || undefined,
          });
        }
      }

      // 2. Resolve shift code
      const codeVal = getVal(raw, "shiftCode");
      const matchedCode = codeVal ? codeMap.get(codeVal.toLowerCase()) : undefined;

      if (codeVal && !matchedCode) {
        unknowns.add(codeVal);
      }

      // 3. Parse date
      const dateVal = getVal(raw, "date");
      const parsedDate = dateVal ? parseDate(dateVal, detectedDateFormat) : "";

      // 4. Parse times
      let startTimeVal = getVal(raw, "startTime");
      let endTimeVal = getVal(raw, "endTime");

      if (startTimeVal) startTimeVal = normalizeTime(startTimeVal);
      if (endTimeVal) endTimeVal = normalizeTime(endTimeVal);

      // Auto-fill from code if missing
      if (matchedCode) {
        if (!startTimeVal && matchedCode.defaultStartTime) {
          startTimeVal = matchedCode.defaultStartTime;
        }
        if (!endTimeVal && matchedCode.defaultEndTime) {
          endTimeVal = matchedCode.defaultEndTime;
        }
      }

      // 5. Break
      const breakVal = getVal(raw, "breakDuration");
      let breakMinutes = breakVal ? parseInt(breakVal, 10) : 0;
      if (isNaN(breakMinutes)) breakMinutes = 0;
      if (!breakMinutes && matchedCode?.includesBreakMinutes) {
        breakMinutes = matchedCode.includesBreakMinutes;
      }

      // 6. Determine status
      let status: RowStatus = "valid";
      let statusMessage = "";

      if (!matchedEmployee && !newEmployeeKey) {
        // Pas assez d'info pour identifier l'employe
        status = "error";
        statusMessage = "Impossible d'identifier l'employe (pas de matricule ni nom/prenom)";
      } else if (!matchedEmployee && newEmployeeKey) {
        // Auto-creation possible
        status = "valid";
        statusMessage = "Nouvel employe (creation auto)";
      } else if (!parsedDate) {
        status = "error";
        statusMessage = "Date manquante ou invalide";
      } else if (!codeVal) {
        status = "error";
        statusMessage = "Code vacation manquant";
      } else if (!matchedCode) {
        status = "warning";
        statusMessage = `Code '${codeVal}' inconnu — sera importe tel quel`;
      } else if (!startTimeVal && !endTimeVal && matchedCode.isWorkShift) {
        status = "warning";
        statusMessage = "Horaires manquants pour un shift de travail";
      }

      rows.push({
        rowIndex: i + 1,
        raw: rawObj,
        status,
        statusMessage,
        employeeId: matchedEmployee?.id ?? null,
        newEmployeeKey,
        employeeName: matchedEmployee
          ? `${matchedEmployee.lastName} ${matchedEmployee.firstName}`
          : firstNameVal && lastNameVal
          ? `${lastNameVal} ${firstNameVal}`
          : matriculeVal || `Ligne ${i + 1}`,
        date: parsedDate,
        shiftCode: codeVal,
        shiftCategory: matchedCode?.shiftCategory ?? "jour",
        startTime: startTimeVal || "00:00",
        endTime: endTimeVal || "00:00",
        breakMinutes,
      });
    }

    setProcessedRows(rows);
    setUnknownCodes(Array.from(unknowns));
    setNewEmployeesFromCsv(Array.from(newEmployeesMap.values()));
  }

  // ── Step 7: Import ─────────────────────────────────────────────────

  async function handleImport() {
    const validRows = processedRows.filter((r) => r.status !== "error");

    if (validRows.length === 0) {
      toast.error("Aucune ligne valide a importer");
      return;
    }

    setProcessing(true);
    try {
      const importRows = validRows.map((r) => ({
        employeeId: r.employeeId || undefined,
        newEmployeeKey: r.newEmployeeKey || undefined,
        startDate: r.date,
        shiftType: r.shiftCategory,
        startTime: r.startTime,
        endTime: r.endTime,
        shiftCode: r.shiftCode,
        breakMinutes: r.breakMinutes,
      }));

      const res = await fetch("/api/admin/shifts/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rows: importRows,
          newEmployees: newEmployeesFromCsv,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        toast.error(err.error || "Erreur lors de l'import");
        return;
      }

      const data = await res.json();
      const dupMsg = data.duplicatesSkipped > 0
        ? `, ${data.duplicatesSkipped} doublon(s) ignore(s)`
        : "";
      const empMsg = data.employeesCreated > 0
        ? `, ${data.employeesCreated} employe(s) cree(s)`
        : "";
      const errorRows = processedRows.filter((r) => r.status === "error").length;
      setImportResult({
        inserted: data.inserted,
        total: processedRows.length,
        skipped: errorRows,
        duplicatesSkipped: data.duplicatesSkipped ?? 0,
        employeesCreated: data.employeesCreated ?? 0,
      });
      setStep("confirm");
      toast.success(`${data.inserted} shift(s) importes avec succes${empMsg}${dupMsg}`);
    } catch {
      toast.error("Erreur lors de l'import");
    } finally {
      setProcessing(false);
    }
  }

  // ── Navigation handlers ────────────────────────────────────────────

  async function goNext() {
    const nextIdx = currentStepIndex + 1;
    if (nextIdx >= STEPS.length) return;

    const nextStep = STEPS[nextIdx];

    // Pre-fetch data for certain steps
    if (nextStep === "employees") {
      await fetchEmployees();
    } else if (nextStep === "shiftCodes") {
      await fetchShiftCodes();
    } else if (nextStep === "preview") {
      processAllRows();
    }

    setStep(nextStep);
  }

  // ── Step indicator ─────────────────────────────────────────────────

  function StepIndicator() {
    return (
      <div className="flex items-center gap-1 mb-6 overflow-x-auto pb-2">
        {STEPS.map((s, i) => {
          const isActive = s === step;
          const isDone = i < currentStepIndex;

          return (
            <div key={s} className="flex items-center gap-1">
              {i > 0 && (
                <div
                  className={`h-px w-4 sm:w-8 ${
                    isDone ? "bg-primary" : "bg-border"
                  }`}
                />
              )}
              <div
                className={`flex items-center gap-1 px-2 py-1 rounded-md text-xs whitespace-nowrap ${
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : isDone
                    ? "bg-primary/20 text-primary"
                    : "text-muted-foreground"
                }`}
              >
                <span className="font-medium">{i + 1}</span>
                <span className="hidden sm:inline">{STEP_LABELS[s]}</span>
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  // ── Render steps ───────────────────────────────────────────────────

  function renderUpload() {
    return (
      <div
        className="border-2 border-dashed rounded-lg p-8 sm:p-12 text-center cursor-pointer hover:border-primary/50 transition-colors"
        onDragOver={(e) => e.preventDefault()}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv,.txt"
          className="hidden"
          onChange={handleFileInput}
        />
        {processing ? (
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">Lecture du fichier...</p>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-3">
            <Upload className="h-10 w-10 text-muted-foreground" />
            <div>
              <p className="font-medium">Deposez votre fichier CSV ici</p>
              <p className="text-sm text-muted-foreground mt-1">
                ou cliquez pour selectionner un fichier
              </p>
            </div>
            <p className="text-xs text-muted-foreground">
              Formats acceptes : .csv, .txt
            </p>
          </div>
        )}
      </div>
    );
  }

  function renderParse() {
    return (
      <div className="space-y-4">
        <Card>
          <CardContent className="pt-4">
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              <div>
                <p className="text-xs text-muted-foreground">Fichier</p>
                <div className="flex items-center gap-1 mt-1">
                  <FileSpreadsheet className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium truncate">{fileName}</span>
                </div>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Separateur</p>
                <p className="text-sm font-medium mt-1">
                  {separator === "," ? "Virgule (,)" : separator === ";" ? "Point-virgule (;)" : separator === "\t" ? "Tabulation" : separator}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Colonnes</p>
                <p className="text-sm font-medium mt-1">{rawHeaders.length}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Lignes de donnees</p>
                <p className="text-sm font-medium mt-1">{rawRows.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Format de date detecte</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2">
              {["DD/MM/YYYY", "YYYY-MM-DD", "MM/DD/YYYY"].map((fmt) => (
                <Button
                  key={fmt}
                  variant={detectedDateFormat === fmt ? "default" : "outline"}
                  size="sm"
                  onClick={() => setDetectedDateFormat(fmt)}
                >
                  {fmt}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  function renderMapping() {
    return (
      <ColumnMapper
        headers={rawHeaders}
        sampleRows={rawRows.slice(0, 5)}
        mapping={columnMapping}
        onMappingChange={setColumnMapping}
      />
    );
  }

  function renderEmployees() {
    // Show matching stats
    const headerIndexMap: Record<string, number> = {};
    for (const [header, field] of Object.entries(columnMapping)) {
      if (field !== "__ignore__") {
        headerIndexMap[field] = rawHeaders.indexOf(header);
      }
    }

    function getVal(row: string[], field: string): string {
      const idx = headerIndexMap[field];
      if (idx === undefined || idx < 0) return "";
      return (row[idx] ?? "").trim();
    }

    const empByMatricule = new Map<string, Employee>();
    const empByName = new Map<string, Employee>();
    for (const emp of employees) {
      if (emp.matricule) {
        empByMatricule.set(emp.matricule.toLowerCase(), emp);
      }
      empByName.set(`${emp.firstName.toLowerCase()}|${emp.lastName.toLowerCase()}`, emp);
    }

    let matched = 0;
    let autoCreate = 0;
    const autoCreateEmployees = new Map<string, { name: string; matricule?: string; department?: string }>();

    for (const row of rawRows) {
      const mat = getVal(row, "matricule");
      const fn = getVal(row, "firstName");
      const ln = getVal(row, "lastName");
      const dept = getVal(row, "department");

      let found = false;
      if (mat && empByMatricule.has(mat.toLowerCase())) found = true;
      if (!found && fn && ln && empByName.has(`${fn.toLowerCase()}|${ln.toLowerCase()}`)) found = true;

      if (found) {
        matched++;
      } else {
        autoCreate++;
        const key = mat ? `mat:${mat}` : `name:${fn}|${ln}`;
        if (!autoCreateEmployees.has(key)) {
          autoCreateEmployees.set(key, {
            name: `${fn} ${ln}`,
            matricule: mat || undefined,
            department: dept || undefined,
          });
        }
      }
    }

    const newEmpCount = autoCreateEmployees.size;

    return (
      <div className="space-y-4">
        <Card>
          <CardContent className="pt-4">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-2xl font-bold">{employees.length}</p>
                <p className="text-xs text-muted-foreground">Employes existants</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-green-500">{matched}</p>
                <p className="text-xs text-muted-foreground">Lignes deja matchees</p>
              </div>
              <div>
                <p className={`text-2xl font-bold ${newEmpCount > 0 ? "text-blue-500" : ""}`}>
                  {newEmpCount}
                </p>
                <p className="text-xs text-muted-foreground">Nouveaux employes</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {newEmpCount > 0 && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-blue-500" />
                {newEmpCount} employe(s) seront crees automatiquement
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-1.5">
                {Array.from(autoCreateEmployees.values()).map((emp, i) => (
                  <div key={i} className="flex items-center gap-2 text-sm">
                    <Badge variant="outline" className="text-blue-500 border-blue-500/50">nouveau</Badge>
                    <span>{emp.name}</span>
                    {emp.matricule && (
                      <span className="text-xs text-muted-foreground">#{emp.matricule}</span>
                    )}
                    {emp.department && (
                      <Badge variant="secondary" className="text-xs">{emp.department}</Badge>
                    )}
                  </div>
                ))}
              </div>
              <p className="text-xs text-muted-foreground mt-3">
                Ces employes seront ajoutes a votre organisation lors de l&apos;import.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    );
  }

  function renderShiftCodes() {
    // Detect unique codes from CSV
    const headerIndexMap: Record<string, number> = {};
    for (const [header, field] of Object.entries(columnMapping)) {
      if (field !== "__ignore__") {
        headerIndexMap[field] = rawHeaders.indexOf(header);
      }
    }

    const codeColIdx = headerIndexMap["shiftCode"];
    const csvCodes = new Set<string>();
    if (codeColIdx !== undefined && codeColIdx >= 0) {
      for (const row of rawRows) {
        const val = (row[codeColIdx] ?? "").trim();
        if (val) csvCodes.add(val);
      }
    }

    const codeMap = new Map<string, ShiftCode>();
    for (const sc of shiftCodes) {
      codeMap.set(sc.code.toLowerCase(), sc);
    }

    const resolvedCodes: { code: string; resolved: boolean; shiftCode?: ShiftCode }[] = [];
    for (const code of csvCodes) {
      const sc = codeMap.get(code.toLowerCase());
      resolvedCodes.push({ code, resolved: !!sc, shiftCode: sc });
    }

    // Sort: unresolved first
    resolvedCodes.sort((a, b) => {
      if (a.resolved === b.resolved) return a.code.localeCompare(b.code);
      return a.resolved ? 1 : -1;
    });

    const unresolvedCount = resolvedCodes.filter((c) => !c.resolved).length;

    return (
      <div className="space-y-4">
        <Card>
          <CardContent className="pt-4">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-2xl font-bold">{csvCodes.size}</p>
                <p className="text-xs text-muted-foreground">Codes dans le CSV</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-green-500">
                  {csvCodes.size - unresolvedCount}
                </p>
                <p className="text-xs text-muted-foreground">Codes resolus</p>
              </div>
              <div>
                <p className={`text-2xl font-bold ${unresolvedCount > 0 ? "text-orange-500" : ""}`}>
                  {unresolvedCount}
                </p>
                <p className="text-xs text-muted-foreground">Codes inconnus</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Resolution des codes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {resolvedCodes.map((item) => (
                <div
                  key={item.code}
                  className="flex items-center justify-between py-1.5 px-2 rounded-md hover:bg-muted/50"
                >
                  <div className="flex items-center gap-2">
                    <Badge
                      variant="outline"
                      className={`font-mono ${
                        item.resolved ? "" : "border-orange-500/50 text-orange-500"
                      }`}
                    >
                      {item.code}
                    </Badge>
                    {item.shiftCode && (
                      <span className="text-sm text-muted-foreground">
                        {item.shiftCode.label ?? item.shiftCode.shiftCategory}
                      </span>
                    )}
                  </div>
                  {item.resolved ? (
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                  ) : (
                    <AlertTriangle className="h-4 w-4 text-orange-500" />
                  )}
                </div>
              ))}
            </div>
            {unresolvedCount > 0 && (
              <p className="text-xs text-muted-foreground mt-3">
                Les codes inconnus seront importes tels quels avec la categorie &quot;jour&quot; par defaut.
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  function renderPreview() {
    const validCount = processedRows.filter((r) => r.status === "valid").length;
    const warningCount = processedRows.filter((r) => r.status === "warning").length;
    const errorCount = processedRows.filter((r) => r.status === "error").length;

    const statusIcon: Record<RowStatus, React.ReactNode> = {
      valid: <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />,
      warning: <AlertTriangle className="h-3.5 w-3.5 text-orange-500" />,
      error: <AlertCircle className="h-3.5 w-3.5 text-red-500" />,
    };

    return (
      <div className="space-y-4">
        <Card>
          <CardContent className="pt-4">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-2xl font-bold text-green-500">{validCount}</p>
                <p className="text-xs text-muted-foreground">Valides</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-orange-500">{warningCount}</p>
                <p className="text-xs text-muted-foreground">Avertissements</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-red-500">{errorCount}</p>
                <p className="text-xs text-muted-foreground">Erreurs (ignores)</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {unknownCodes.length > 0 && (
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="h-4 w-4 text-orange-500" />
                <span className="text-sm font-medium">Codes inconnus</span>
              </div>
              <div className="flex flex-wrap gap-1">
                {unknownCodes.map((code) => (
                  <Badge
                    key={code}
                    variant="outline"
                    className="border-orange-500/50 text-orange-500"
                  >
                    {code}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardContent className="pt-4">
            <div className="overflow-x-auto max-h-96 overflow-y-auto">
              <table className="w-full text-sm">
                <thead className="sticky top-0 bg-card">
                  <tr className="border-b text-left">
                    <th className="px-2 py-1.5 font-medium text-xs w-8">#</th>
                    <th className="px-2 py-1.5 font-medium text-xs w-8"></th>
                    <th className="px-2 py-1.5 font-medium text-xs">Employe</th>
                    <th className="px-2 py-1.5 font-medium text-xs">Date</th>
                    <th className="px-2 py-1.5 font-medium text-xs">Code</th>
                    <th className="px-2 py-1.5 font-medium text-xs">Horaires</th>
                    <th className="px-2 py-1.5 font-medium text-xs">Message</th>
                  </tr>
                </thead>
                <tbody>
                  {processedRows.map((row) => (
                    <tr
                      key={row.rowIndex}
                      className={`border-b last:border-0 ${
                        row.status === "error"
                          ? "bg-red-500/5"
                          : row.status === "warning"
                          ? "bg-orange-500/5"
                          : ""
                      }`}
                    >
                      <td className="px-2 py-1.5 text-xs text-muted-foreground">
                        {row.rowIndex}
                      </td>
                      <td className="px-2 py-1.5">{statusIcon[row.status]}</td>
                      <td className="px-2 py-1.5 whitespace-nowrap">
                        {row.employeeName}
                      </td>
                      <td className="px-2 py-1.5 whitespace-nowrap">
                        {row.date || "-"}
                      </td>
                      <td className="px-2 py-1.5">
                        <Badge variant="outline" className="text-xs">
                          {row.shiftCode || "-"}
                        </Badge>
                      </td>
                      <td className="px-2 py-1.5 whitespace-nowrap">
                        {row.startTime} - {row.endTime}
                      </td>
                      <td className="px-2 py-1.5 text-xs text-muted-foreground max-w-[200px] truncate">
                        {row.statusMessage}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  function renderConfirm() {
    if (!importResult) return null;

    return (
      <div className="space-y-4">
        <Card>
          <CardContent className="pt-6 text-center">
            <CheckCircle2 className="h-12 w-12 text-green-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Import termine</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mt-6">
              <div>
                <p className="text-2xl font-bold">{importResult.total}</p>
                <p className="text-xs text-muted-foreground">Lignes totales</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-green-500">
                  {importResult.inserted}
                </p>
                <p className="text-xs text-muted-foreground">Shifts importes</p>
              </div>
              {importResult.employeesCreated > 0 && (
                <div>
                  <p className="text-2xl font-bold text-blue-500">
                    {importResult.employeesCreated}
                  </p>
                  <p className="text-xs text-muted-foreground">Employes crees</p>
                </div>
              )}
              {importResult.duplicatesSkipped > 0 && (
                <div>
                  <p className="text-2xl font-bold text-yellow-500">
                    {importResult.duplicatesSkipped}
                  </p>
                  <p className="text-xs text-muted-foreground">Doublons ignores</p>
                </div>
              )}
              {importResult.skipped > 0 && (
                <div>
                  <p className="text-2xl font-bold text-muted-foreground">
                    {importResult.skipped}
                  </p>
                  <p className="text-xs text-muted-foreground">Erreurs ignorees</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Button className="w-full" onClick={onImportComplete}>
          Fermer
        </Button>
      </div>
    );
  }

  // ── Main render ────────────────────────────────────────────────────

  return (
    <div className="space-y-4">
      <StepIndicator />

      {step === "upload" && renderUpload()}
      {step === "parse" && renderParse()}
      {step === "mapping" && renderMapping()}
      {step === "employees" && renderEmployees()}
      {step === "shiftCodes" && renderShiftCodes()}
      {step === "preview" && renderPreview()}
      {step === "confirm" && renderConfirm()}

      {/* Navigation buttons */}
      {step !== "confirm" && (
        <div className="flex justify-between pt-2">
          <Button
            variant="outline"
            onClick={goBack}
            disabled={currentStepIndex === 0 || processing}
          >
            <ArrowLeft className="mr-1 h-4 w-4" />
            Precedent
          </Button>

          {step === "preview" ? (
            <Button
              onClick={handleImport}
              disabled={
                processing || !processedRows.some((r) => r.status !== "error")
              }
            >
              {processing ? (
                <>
                  <Loader2 className="mr-1 h-4 w-4 animate-spin" />
                  Import en cours...
                </>
              ) : (
                <>
                  Importer{" "}
                  {processedRows.filter((r) => r.status !== "error").length} ligne(s)
                </>
              )}
            </Button>
          ) : (
            <Button
              onClick={goNext}
              disabled={!canGoNext() || processing}
            >
              {processing ? (
                <>
                  <Loader2 className="mr-1 h-4 w-4 animate-spin" />
                  Chargement...
                </>
              ) : (
                <>
                  Suivant
                  <ArrowRight className="ml-1 h-4 w-4" />
                </>
              )}
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
