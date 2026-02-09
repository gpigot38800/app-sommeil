"use client";

import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Trash2, Search, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface ShiftRow {
  shift: {
    id: string;
    startDate: string;
    endDate: string;
    shiftType: string;
    startTime: string;
    endTime: string;
    shiftCode: string | null;
    breakMinutes: number | null;
  };
  employeeFirstName: string;
  employeeLastName: string;
  employeeDepartment: string | null;
}

interface AdminShiftListProps {
  onRefresh: () => void;
}

const typeColors: Record<string, string> = {
  jour: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  soir: "bg-orange-500/20 text-orange-400 border-orange-500/30",
  nuit: "bg-indigo-500/20 text-indigo-400 border-indigo-500/30",
  repos: "bg-green-500/20 text-green-400 border-green-500/30",
  absence: "bg-gray-500/20 text-gray-400 border-gray-500/30",
};

function formatDate(dateStr: string) {
  return new Date(dateStr + "T00:00:00").toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function AdminShiftList({ onRefresh }: AdminShiftListProps) {
  const [shifts, setShifts] = useState<ShiftRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Filters
  const [searchName, setSearchName] = useState("");
  const [filterDepartment, setFilterDepartment] = useState("__all__");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const fetchShifts = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filterDepartment && filterDepartment !== "__all__") {
        params.set("department", filterDepartment);
      }
      if (startDate) params.set("startDate", startDate);
      if (endDate) params.set("endDate", endDate);

      const res = await fetch(`/api/admin/shifts?${params.toString()}`);
      if (!res.ok) throw new Error("Erreur lors du chargement");
      const data = await res.json();
      setShifts(data);
    } catch {
      toast.error("Impossible de charger les shifts");
    } finally {
      setLoading(false);
    }
  }, [filterDepartment, startDate, endDate]);

  useEffect(() => {
    fetchShifts();
  }, [fetchShifts]);

  async function handleDelete() {
    if (!deleteId) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/admin/shifts/${deleteId}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Erreur");
      toast.success("Shift supprime");
      setDeleteId(null);
      fetchShifts();
      onRefresh();
    } catch {
      toast.error("Erreur lors de la suppression");
    } finally {
      setDeleting(false);
    }
  }

  // Get unique departments for filter
  const departments = Array.from(
    new Set(shifts.map((s) => s.employeeDepartment).filter(Boolean))
  ).sort() as string[];

  // Filter by name client-side
  const filteredShifts = shifts.filter((s) => {
    if (!searchName) return true;
    const fullName =
      `${s.employeeFirstName} ${s.employeeLastName}`.toLowerCase();
    return fullName.includes(searchName.toLowerCase());
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Shifts planifies</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Filters */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Rechercher un employe..."
              value={searchName}
              onChange={(e) => setSearchName(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select
            value={filterDepartment}
            onValueChange={setFilterDepartment}
          >
            <SelectTrigger>
              <SelectValue placeholder="Tous les services" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__all__">Tous les services</SelectItem>
              {departments.map((dept) => (
                <SelectItem key={dept} value={dept}>
                  {dept}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            placeholder="Date debut"
          />
          <Input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            placeholder="Date fin"
          />
        </div>

        {/* Shift list */}
        {loading ? (
          <div className="flex items-center justify-center py-8 text-muted-foreground">
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Chargement...
          </div>
        ) : filteredShifts.length === 0 ? (
          <div className="py-8 text-center text-muted-foreground">
            Aucun shift trouve.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left">
                  <th className="px-2 py-2 font-medium">Employe</th>
                  <th className="px-2 py-2 font-medium">Date</th>
                  <th className="px-2 py-2 font-medium">Code / Type</th>
                  <th className="px-2 py-2 font-medium">Horaires</th>
                  <th className="px-2 py-2 font-medium">Pause</th>
                  <th className="px-2 py-2 font-medium w-10"></th>
                </tr>
              </thead>
              <tbody>
                {filteredShifts.map((row) => (
                  <tr key={row.shift.id} className="border-b last:border-0 hover:bg-muted/50">
                    <td className="px-2 py-2">
                      <div className="font-medium">
                        {row.employeeLastName} {row.employeeFirstName}
                      </div>
                      {row.employeeDepartment && (
                        <span className="text-xs text-muted-foreground">
                          {row.employeeDepartment}
                        </span>
                      )}
                    </td>
                    <td className="px-2 py-2 whitespace-nowrap">
                      {formatDate(row.shift.startDate)}
                    </td>
                    <td className="px-2 py-2">
                      <div className="flex items-center gap-1.5">
                        {row.shift.shiftCode && (
                          <Badge variant="outline" className="text-xs">
                            {row.shift.shiftCode}
                          </Badge>
                        )}
                        <Badge
                          variant="outline"
                          className={typeColors[row.shift.shiftType] ?? ""}
                        >
                          {row.shift.shiftType}
                        </Badge>
                      </div>
                    </td>
                    <td className="px-2 py-2 whitespace-nowrap">
                      {row.shift.startTime} - {row.shift.endTime}
                    </td>
                    <td className="px-2 py-2">
                      {row.shift.breakMinutes
                        ? `${row.shift.breakMinutes} min`
                        : "-"}
                    </td>
                    <td className="px-2 py-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-muted-foreground hover:text-destructive"
                        onClick={() => setDeleteId(row.shift.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="text-xs text-muted-foreground">
          {filteredShifts.length} shift{filteredShifts.length !== 1 ? "s" : ""} affiche{filteredShifts.length !== 1 ? "s" : ""}
        </div>
      </CardContent>

      {/* Delete confirmation */}
      <Dialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Supprimer ce shift ?</DialogTitle>
            <DialogDescription>
              Cette action est irreversible. Le shift sera definitivement supprime.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteId(null)}>
              Annuler
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={deleting}
            >
              {deleting ? "Suppression..." : "Supprimer"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
