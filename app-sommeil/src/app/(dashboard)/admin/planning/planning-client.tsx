"use client";

import { useState, useCallback, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Trash2, Plus, Search, CalendarDays, List, ChevronLeft, ChevronRight } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { CalendarGrid, type ShiftRow } from "@/components/planning/calendar-grid";
import { ShiftCellDialog } from "@/components/planning/shift-cell-dialog";
import {
  getWeekStart,
  getWeekEnd,
  addWeeks,
  formatDateISO,
  formatWeekRange,
} from "@/lib/date-utils";
import {
  useEmployees,
  useShiftCodes,
  useComplianceViolations,
  useFetch,
  useMutation,
} from "@/hooks";

export function PlanningClient() {
  const [search, setSearch] = useState("");
  const [filterDept, setFilterDept] = useState("all");

  // View mode
  const [viewMode, setViewMode] = useState<"list" | "calendar">("calendar");

  // Week navigation
  const [weekStart, setWeekStart] = useState(() => getWeekStart(new Date()));

  // List-view dialog
  const [dialogOpen, setDialogOpen] = useState(false);
  const [formEmployeeId, setFormEmployeeId] = useState("");
  const [formDate, setFormDate] = useState("");
  const [formCode, setFormCode] = useState("");
  const [formStartTime, setFormStartTime] = useState("");
  const [formEndTime, setFormEndTime] = useState("");
  const [formBreak, setFormBreak] = useState("0");

  // Cell dialog (calendar view)
  const [cellDialogOpen, setCellDialogOpen] = useState(false);
  const [cellDialogProps, setCellDialogProps] = useState<{
    employeeId: string;
    employeeName: string;
    date: string;
    existingShift?: ShiftRow;
  } | null>(null);

  // Computed URLs
  const weekEnd = getWeekEnd(weekStart);
  const startDate = formatDateISO(weekStart);
  const endDate = formatDateISO(weekEnd);

  const shiftsUrl = useMemo(
    () =>
      viewMode === "calendar"
        ? `/api/admin/shifts?startDate=${startDate}&endDate=${endDate}`
        : "/api/admin/shifts",
    [viewMode, startDate, endDate]
  );

  const complianceUrl = useMemo(
    () =>
      viewMode === "calendar"
        ? `/api/admin/compliance?startDate=${startDate}&endDate=${endDate}`
        : null,
    [viewMode, startDate, endDate]
  );

  // Hooks
  const { data: employees, refetch: refetchEmployees } = useEmployees();
  const { data: shiftCodes } = useShiftCodes();
  const { data: shiftRows, loading: shiftsLoading, refetch: refetchShifts } = useFetch<ShiftRow[]>(shiftsUrl);
  const { violations, refetch: refetchCompliance } = useComplianceViolations(complianceUrl);

  const loading = shiftsLoading;

  const refetchAll = useCallback(() => {
    refetchShifts();
    refetchEmployees();
    refetchCompliance();
  }, [refetchShifts, refetchEmployees, refetchCompliance]);

  const createShiftMutation = useMutation<Record<string, unknown>>({
    url: "/api/admin/shifts",
    successMessage: "Shift ajoute",
    errorMessage: "Erreur lors de l'ajout",
    onSuccess: () => {
      setDialogOpen(false);
      refetchAll();
    },
  });

  const deleteShiftMutation = useMutation<string>({
    url: (id) => `/api/admin/shifts/${id}`,
    method: "DELETE",
    successMessage: "Shift supprime",
    onSuccess: refetchAll,
  });

  function handleCodeChange(code: string) {
    setFormCode(code);
    const sc = (shiftCodes ?? []).find((c) => c.code === code);
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
    const sc = (shiftCodes ?? []).find((c) => c.code === formCode);
    await createShiftMutation.mutate({
      employeeId: formEmployeeId,
      startDate: formDate,
      endDate: formDate,
      shiftType: sc?.shiftCategory ?? "jour",
      startTime: formStartTime,
      endTime: formEndTime,
      shiftCode: formCode || null,
      breakMinutes: Number(formBreak) || 0,
    });
  }

  async function handleDelete(id: string) {
    await deleteShiftMutation.mutate(id);
  }

  function handleCellClick(employeeId: string, date: string, existingShift?: ShiftRow) {
    const emp = (employees ?? []).find((e) => e.id === employeeId);
    const name = emp ? `${emp.lastName} ${emp.firstName}` : "";
    setCellDialogProps({ employeeId, employeeName: name, date, existingShift });
    setCellDialogOpen(true);
  }

  const departments = [
    ...new Set(
      viewMode === "calendar"
        ? (employees ?? []).map((e) => e.department).filter(Boolean)
        : (shiftRows ?? []).map((r) => r.employeeDepartment).filter(Boolean)
    ),
  ];

  // Filter for calendar
  const filteredEmployees = (employees ?? []).filter((e) => {
    if (!e.isActive) return false;
    if (filterDept !== "all" && e.department !== filterDept) return false;
    if (search) {
      const q = search.toLowerCase();
      if (!`${e.firstName} ${e.lastName}`.toLowerCase().includes(q)) return false;
    }
    return true;
  });

  // Filter for list
  const filteredShifts = (shiftRows ?? []).filter((r) => {
    if (filterDept !== "all" && r.employeeDepartment !== filterDept) return false;
    if (search) {
      const q = search.toLowerCase();
      if (!`${r.employeeFirstName} ${r.employeeLastName}`.toLowerCase().includes(q))
        return false;
    }
    return true;
  });

  if (loading) {
    return <div className="py-12 text-center text-muted-foreground">Chargement...</div>;
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold">Planning</h1>

        <div className="flex items-center gap-2">
          {/* Toggle view */}
          <div className="flex rounded-lg border p-0.5">
            <Button
              variant={viewMode === "calendar" ? "default" : "ghost"}
              size="sm"
              onClick={() => setViewMode("calendar")}
              className="h-8 px-2.5"
            >
              <CalendarDays className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === "list" ? "default" : "ghost"}
              size="sm"
              onClick={() => setViewMode("list")}
              className="h-8 px-2.5"
            >
              <List className="h-4 w-4" />
            </Button>
          </div>

          {/* Add shift (list mode) */}
          {viewMode === "list" && (
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button size="sm">
                  <Plus className="mr-1 h-4 w-4" />
                  Ajouter
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Nouveau shift</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium">Employe *</label>
                    <Select onValueChange={setFormEmployeeId}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selectionner..." />
                      </SelectTrigger>
                      <SelectContent>
                        {(employees ?? []).map((e) => (
                          <SelectItem key={e.id} value={e.id}>
                            {e.firstName} {e.lastName}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Date *</label>
                    <Input
                      type="date"
                      value={formDate}
                      onChange={(e) => setFormDate(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Code vacation</label>
                    <Select onValueChange={handleCodeChange}>
                      <SelectTrigger>
                        <SelectValue placeholder="Choisir..." />
                      </SelectTrigger>
                      <SelectContent>
                        {(shiftCodes ?? [])
                          .filter((c) => c.isWorkShift)
                          .map((c) => (
                            <SelectItem key={c.id} value={c.code}>
                              {c.code} — {c.label}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium">Debut *</label>
                      <Input
                        type="time"
                        value={formStartTime}
                        onChange={(e) => setFormStartTime(e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium">Fin *</label>
                      <Input
                        type="time"
                        value={formEndTime}
                        onChange={(e) => setFormEndTime(e.target.value)}
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Pause (min)</label>
                    <Input
                      type="number"
                      value={formBreak}
                      onChange={(e) => setFormBreak(e.target.value)}
                    />
                  </div>
                  <Button onClick={handleCreateShift} className="w-full">
                    Ajouter
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </div>

      {/* Week navigation (calendar mode) */}
      {viewMode === "calendar" && (
        <div className="flex items-center justify-between rounded-lg border bg-card px-3 py-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setWeekStart(addWeeks(weekStart, -1))}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setWeekStart(getWeekStart(new Date()))}
            >
              Aujourd&apos;hui
            </Button>
            <span className="text-sm font-medium">
              {formatWeekRange(weekStart, weekEnd)}
            </span>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setWeekStart(addWeeks(weekStart, 1))}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}

      {/* Search + filter */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Rechercher..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={filterDept} onValueChange={setFilterDept}>
          <SelectTrigger className="w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous les services</SelectItem>
            {departments.map((d) => (
              <SelectItem key={d} value={d!}>
                {d}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Calendar view */}
      {viewMode === "calendar" && (
        <>
          <CalendarGrid
            employees={filteredEmployees}
            shiftRows={shiftRows ?? []}
            shiftCodes={shiftCodes ?? []}
            weekStart={weekStart}
            onCellClick={handleCellClick}
            violations={violations}
          />
          {cellDialogProps && (
            <ShiftCellDialog
              open={cellDialogOpen}
              onOpenChange={setCellDialogOpen}
              employeeName={cellDialogProps.employeeName}
              employeeId={cellDialogProps.employeeId}
              date={cellDialogProps.date}
              existingShift={cellDialogProps.existingShift}
              shiftCodes={shiftCodes ?? []}
              onSaved={refetchAll}
              allShiftRows={shiftRows ?? []}
            />
          )}
        </>
      )}

      {/* List view */}
      {viewMode === "list" && (
        <>
          <p className="text-sm text-muted-foreground">
            {filteredShifts.length} shift{filteredShifts.length > 1 ? "s" : ""}
          </p>

          {filteredShifts.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                Aucun shift trouve. Ajoutez des shifts manuellement ou importez un fichier
                CSV.
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-2">
              {filteredShifts.map((row) => {
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
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(s.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
}
