"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Trash2, Plus, Search } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import type { Employee, ShiftCode } from "@/types";

interface ShiftRow {
  shift: {
    id: string;
    employeeId: string;
    startDate: string;
    shiftType: string;
    startTime: string;
    endTime: string;
    shiftCode: string | null;
    breakMinutes: number;
  };
  employeeFirstName: string;
  employeeLastName: string;
  employeeDepartment: string | null;
}

export function PlanningClient() {
  const [shiftRows, setShiftRows] = useState<ShiftRow[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [shiftCodes, setShiftCodes] = useState<ShiftCode[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [filterDept, setFilterDept] = useState("all");

  // Form state
  const [formEmployeeId, setFormEmployeeId] = useState("");
  const [formDate, setFormDate] = useState("");
  const [formCode, setFormCode] = useState("");
  const [formStartTime, setFormStartTime] = useState("");
  const [formEndTime, setFormEndTime] = useState("");
  const [formBreak, setFormBreak] = useState("0");

  const fetchData = useCallback(async () => {
    try {
      const [shiftsRes, empRes, codesRes] = await Promise.all([
        fetch("/api/admin/shifts"),
        fetch("/api/admin/employees"),
        fetch("/api/admin/shift-codes"),
      ]);
      if (shiftsRes.ok) setShiftRows(await shiftsRes.json());
      if (empRes.ok) setEmployees(await empRes.json());
      if (codesRes.ok) setShiftCodes(await codesRes.json());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  function handleCodeChange(code: string) {
    setFormCode(code);
    const sc = shiftCodes.find((c) => c.code === code);
    if (sc) {
      if (sc.defaultStartTime) setFormStartTime(sc.defaultStartTime);
      if (sc.defaultEndTime) setFormEndTime(sc.defaultEndTime);
      if (sc.includesBreakMinutes) setFormBreak(String(sc.includesBreakMinutes));
    }
  }

  async function handleCreateShift() {
    if (!formEmployeeId || !formDate || !formStartTime || !formEndTime) {
      toast.error("Veuillez remplir tous les champs obligatoires");
      return;
    }
    const sc = shiftCodes.find((c) => c.code === formCode);
    const res = await fetch("/api/admin/shifts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        employeeId: formEmployeeId,
        startDate: formDate,
        endDate: formDate,
        shiftType: sc?.shiftCategory ?? "jour",
        startTime: formStartTime,
        endTime: formEndTime,
        shiftCode: formCode || null,
        breakMinutes: Number(formBreak) || 0,
      }),
    });
    if (res.ok) {
      toast.success("Shift ajouté");
      setDialogOpen(false);
      fetchData();
    } else {
      toast.error("Erreur lors de l'ajout");
    }
  }

  async function handleDelete(id: string) {
    const res = await fetch(`/api/admin/shifts/${id}`, { method: "DELETE" });
    if (res.ok) {
      toast.success("Shift supprimé");
      fetchData();
    }
  }

  const departments = [...new Set(shiftRows.map((r) => r.employeeDepartment).filter(Boolean))];

  const filtered = shiftRows.filter((r) => {
    if (filterDept !== "all" && r.employeeDepartment !== filterDept) return false;
    if (search) {
      const q = search.toLowerCase();
      const nameMatch = `${r.employeeFirstName} ${r.employeeLastName}`.toLowerCase().includes(q);
      if (!nameMatch) return false;
    }
    return true;
  });

  if (loading) {
    return <div className="py-12 text-center text-muted-foreground">Chargement...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Planning</h1>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Ajouter un shift
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Nouveau shift</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Employé *</label>
                <Select onValueChange={setFormEmployeeId}>
                  <SelectTrigger><SelectValue placeholder="Sélectionner..." /></SelectTrigger>
                  <SelectContent>
                    {employees.map((e) => (
                      <SelectItem key={e.id} value={e.id}>
                        {e.firstName} {e.lastName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium">Date *</label>
                <Input type="date" value={formDate} onChange={(e) => setFormDate(e.target.value)} />
              </div>
              <div>
                <label className="text-sm font-medium">Code vacation</label>
                <Select onValueChange={handleCodeChange}>
                  <SelectTrigger><SelectValue placeholder="Choisir..." /></SelectTrigger>
                  <SelectContent>
                    {shiftCodes.filter((c) => c.isWorkShift).map((c) => (
                      <SelectItem key={c.id} value={c.code}>
                        {c.code} — {c.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Début *</label>
                  <Input type="time" value={formStartTime} onChange={(e) => setFormStartTime(e.target.value)} />
                </div>
                <div>
                  <label className="text-sm font-medium">Fin *</label>
                  <Input type="time" value={formEndTime} onChange={(e) => setFormEndTime(e.target.value)} />
                </div>
              </div>
              <div>
                <label className="text-sm font-medium">Pause (min)</label>
                <Input type="number" value={formBreak} onChange={(e) => setFormBreak(e.target.value)} />
              </div>
              <Button onClick={handleCreateShift} className="w-full">Ajouter</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Rechercher..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10" />
        </div>
        <Select value={filterDept} onValueChange={setFilterDept}>
          <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous les services</SelectItem>
            {departments.map((d) => (
              <SelectItem key={d} value={d!}>{d}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <p className="text-sm text-muted-foreground">{filtered.length} shift{filtered.length > 1 ? "s" : ""}</p>

      {filtered.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            Aucun shift trouvé. Ajoutez des shifts manuellement ou importez un fichier CSV.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {filtered.map((row) => {
            const s = row.shift;
            return (
              <Card key={s.id}>
                <CardContent className="flex items-center justify-between py-3">
                  <div>
                    <p className="font-medium">
                      {row.employeeFirstName} {row.employeeLastName}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {s.startDate} — {s.startTime} → {s.endTime}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {s.shiftCode && <Badge variant="outline">{s.shiftCode}</Badge>}
                    <Badge variant="secondary">{s.shiftType}</Badge>
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(s.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
