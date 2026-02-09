"use client";

import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { Plus, Pencil, Trash2, Loader2, Save, X } from "lucide-react";
import { toast } from "sonner";
import type { ShiftCode, ShiftCategory } from "@/types";

type EditableCode = Omit<ShiftCode, "id" | "organizationId"> & { id?: string };

const CATEGORIES: { value: ShiftCategory; label: string }[] = [
  { value: "jour", label: "Jour" },
  { value: "soir", label: "Soir" },
  { value: "nuit", label: "Nuit" },
  { value: "repos", label: "Repos" },
  { value: "absence", label: "Absence" },
];

const categoryColors: Record<string, string> = {
  jour: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  soir: "bg-orange-500/20 text-orange-400 border-orange-500/30",
  nuit: "bg-indigo-500/20 text-indigo-400 border-indigo-500/30",
  repos: "bg-green-500/20 text-green-400 border-green-500/30",
  absence: "bg-gray-500/20 text-gray-400 border-gray-500/30",
};

const emptyCode: EditableCode = {
  code: "",
  label: "",
  shiftCategory: "jour",
  defaultStartTime: "",
  defaultEndTime: "",
  defaultDurationMinutes: null,
  includesBreakMinutes: 0,
  isWorkShift: true,
};

export function ShiftCodesManager() {
  const [codes, setCodes] = useState<ShiftCode[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Inline editing
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<EditableCode>(emptyCode);

  // New code form
  const [showAdd, setShowAdd] = useState(false);
  const [addForm, setAddForm] = useState<EditableCode>({ ...emptyCode });

  // Delete confirmation
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleteDeleting, setDeleteDeleting] = useState(false);

  const fetchCodes = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/shift-codes");
      if (!res.ok) throw new Error("Erreur");
      const data = await res.json();
      setCodes(data);
    } catch {
      toast.error("Impossible de charger les codes vacation");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCodes();
  }, [fetchCodes]);

  // --- Add ---
  async function handleAdd() {
    if (!addForm.code || !addForm.shiftCategory) {
      toast.error("Le code et la categorie sont requis");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/admin/shift-codes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: addForm.code,
          label: addForm.label || null,
          shiftCategory: addForm.shiftCategory,
          defaultStartTime: addForm.defaultStartTime || null,
          defaultEndTime: addForm.defaultEndTime || null,
          defaultDurationMinutes: addForm.defaultDurationMinutes || null,
          includesBreakMinutes: addForm.includesBreakMinutes || 0,
          isWorkShift: addForm.isWorkShift,
        }),
      });
      if (!res.ok) {
        const err = await res.json();
        toast.error(err.error || "Erreur lors de la creation");
        return;
      }
      toast.success("Code vacation cree");
      setShowAdd(false);
      setAddForm({ ...emptyCode });
      fetchCodes();
    } catch {
      toast.error("Erreur lors de la creation");
    } finally {
      setSaving(false);
    }
  }

  // --- Edit ---
  function startEdit(code: ShiftCode) {
    setEditingId(code.id);
    setEditForm({
      code: code.code,
      label: code.label ?? "",
      shiftCategory: code.shiftCategory as ShiftCategory,
      defaultStartTime: code.defaultStartTime ?? "",
      defaultEndTime: code.defaultEndTime ?? "",
      defaultDurationMinutes: code.defaultDurationMinutes,
      includesBreakMinutes: code.includesBreakMinutes ?? 0,
      isWorkShift: code.isWorkShift,
    });
  }

  async function handleSaveEdit() {
    if (!editingId || !editForm.code) return;
    setSaving(true);
    try {
      const res = await fetch("/api/admin/shift-codes", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: editingId,
          code: editForm.code,
          label: editForm.label || null,
          shiftCategory: editForm.shiftCategory,
          defaultStartTime: editForm.defaultStartTime || null,
          defaultEndTime: editForm.defaultEndTime || null,
          defaultDurationMinutes: editForm.defaultDurationMinutes || null,
          includesBreakMinutes: editForm.includesBreakMinutes || 0,
          isWorkShift: editForm.isWorkShift,
        }),
      });
      if (!res.ok) {
        const err = await res.json();
        toast.error(err.error || "Erreur lors de la mise a jour");
        return;
      }
      toast.success("Code mis a jour");
      setEditingId(null);
      fetchCodes();
    } catch {
      toast.error("Erreur lors de la mise a jour");
    } finally {
      setSaving(false);
    }
  }

  // --- Delete ---
  async function handleDelete() {
    if (!deleteId) return;
    setDeleteDeleting(true);
    try {
      const res = await fetch("/api/admin/shift-codes", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: deleteId }),
      });
      if (!res.ok) throw new Error("Erreur");
      toast.success("Code vacation supprime");
      setDeleteId(null);
      fetchCodes();
    } catch {
      toast.error("Erreur lors de la suppression");
    } finally {
      setDeleteDeleting(false);
    }
  }

  // --- Inline form helper ---
  function CodeFormRow({
    form,
    setForm,
    isNew,
  }: {
    form: EditableCode;
    setForm: (fn: (prev: EditableCode) => EditableCode) => void;
    isNew?: boolean;
  }) {
    return (
      <tr className="border-b bg-muted/30">
        <td className="px-2 py-1.5">
          <Input
            className="h-7 text-xs w-16"
            value={form.code}
            onChange={(e) => setForm((prev) => ({ ...prev, code: e.target.value }))}
            placeholder="M"
          />
        </td>
        <td className="px-2 py-1.5">
          <Input
            className="h-7 text-xs w-24"
            value={form.label ?? ""}
            onChange={(e) => setForm((prev) => ({ ...prev, label: e.target.value }))}
            placeholder="Matin"
          />
        </td>
        <td className="px-2 py-1.5">
          <Select
            value={form.shiftCategory}
            onValueChange={(v) =>
              setForm((prev) => ({ ...prev, shiftCategory: v as ShiftCategory }))
            }
          >
            <SelectTrigger className="h-7 text-xs w-24">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {CATEGORIES.map((cat) => (
                <SelectItem key={cat.value} value={cat.value}>
                  {cat.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </td>
        <td className="px-2 py-1.5">
          <Input
            className="h-7 text-xs w-20"
            type="time"
            value={form.defaultStartTime ?? ""}
            onChange={(e) =>
              setForm((prev) => ({ ...prev, defaultStartTime: e.target.value }))
            }
          />
        </td>
        <td className="px-2 py-1.5">
          <Input
            className="h-7 text-xs w-20"
            type="time"
            value={form.defaultEndTime ?? ""}
            onChange={(e) =>
              setForm((prev) => ({ ...prev, defaultEndTime: e.target.value }))
            }
          />
        </td>
        <td className="px-2 py-1.5">
          <Input
            className="h-7 text-xs w-16"
            type="number"
            value={form.defaultDurationMinutes ?? ""}
            onChange={(e) =>
              setForm((prev) => ({
                ...prev,
                defaultDurationMinutes: e.target.value ? Number(e.target.value) : null,
              }))
            }
            placeholder="min"
          />
        </td>
        <td className="px-2 py-1.5">
          <Input
            className="h-7 text-xs w-14"
            type="number"
            value={form.includesBreakMinutes ?? 0}
            onChange={(e) =>
              setForm((prev) => ({
                ...prev,
                includesBreakMinutes: Number(e.target.value),
              }))
            }
          />
        </td>
        <td className="px-2 py-1.5 text-center">
          <button
            type="button"
            className={`h-4 w-4 rounded border inline-flex items-center justify-center ${
              form.isWorkShift
                ? "bg-primary border-primary text-primary-foreground"
                : "border-input"
            }`}
            onClick={() =>
              setForm((prev) => ({ ...prev, isWorkShift: !prev.isWorkShift }))
            }
          >
            {form.isWorkShift && (
              <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                <path
                  d="M1.5 5L4 7.5L8.5 2.5"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            )}
          </button>
        </td>
        <td className="px-2 py-1.5">
          <div className="flex gap-1">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={isNew ? handleAdd : handleSaveEdit}
              disabled={saving}
            >
              <Save className="h-3 w-3" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={() => {
                if (isNew) {
                  setShowAdd(false);
                  setAddForm({ ...emptyCode });
                } else {
                  setEditingId(null);
                }
              }}
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
        </td>
      </tr>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Codes vacation</CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              Gerez les codes de shifts de votre organisation
            </p>
          </div>
          <Button
            size="sm"
            onClick={() => {
              setShowAdd(true);
              setAddForm({ ...emptyCode });
            }}
            disabled={showAdd}
          >
            <Plus className="mr-1 h-3 w-3" />
            Nouveau code
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center py-8 text-muted-foreground">
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Chargement...
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left">
                  <th className="px-2 py-2 font-medium text-xs">Code</th>
                  <th className="px-2 py-2 font-medium text-xs">Label</th>
                  <th className="px-2 py-2 font-medium text-xs">Categorie</th>
                  <th className="px-2 py-2 font-medium text-xs">Debut</th>
                  <th className="px-2 py-2 font-medium text-xs">Fin</th>
                  <th className="px-2 py-2 font-medium text-xs">Duree</th>
                  <th className="px-2 py-2 font-medium text-xs">Pause</th>
                  <th className="px-2 py-2 font-medium text-xs text-center">
                    Travail
                  </th>
                  <th className="px-2 py-2 font-medium text-xs w-20"></th>
                </tr>
              </thead>
              <tbody>
                {/* Add new row */}
                {showAdd && (
                  <CodeFormRow
                    form={addForm}
                    setForm={setAddForm as (fn: (prev: EditableCode) => EditableCode) => void}
                    isNew
                  />
                )}

                {codes.map((code) => {
                  if (editingId === code.id) {
                    return (
                      <CodeFormRow
                        key={code.id}
                        form={editForm}
                        setForm={setEditForm as (fn: (prev: EditableCode) => EditableCode) => void}
                      />
                    );
                  }

                  return (
                    <tr
                      key={code.id}
                      className="border-b last:border-0 hover:bg-muted/50"
                    >
                      <td className="px-2 py-2 font-mono font-medium">
                        {code.code}
                      </td>
                      <td className="px-2 py-2 text-muted-foreground">
                        {code.label ?? "-"}
                      </td>
                      <td className="px-2 py-2">
                        <Badge
                          variant="outline"
                          className={categoryColors[code.shiftCategory] ?? ""}
                        >
                          {code.shiftCategory}
                        </Badge>
                      </td>
                      <td className="px-2 py-2">
                        {code.defaultStartTime ?? "-"}
                      </td>
                      <td className="px-2 py-2">
                        {code.defaultEndTime ?? "-"}
                      </td>
                      <td className="px-2 py-2">
                        {code.defaultDurationMinutes
                          ? `${code.defaultDurationMinutes} min`
                          : "-"}
                      </td>
                      <td className="px-2 py-2">
                        {code.includesBreakMinutes
                          ? `${code.includesBreakMinutes} min`
                          : "-"}
                      </td>
                      <td className="px-2 py-2 text-center">
                        {code.isWorkShift ? (
                          <Badge variant="secondary" className="text-[10px]">
                            Oui
                          </Badge>
                        ) : (
                          <span className="text-xs text-muted-foreground">
                            Non
                          </span>
                        )}
                      </td>
                      <td className="px-2 py-2">
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            onClick={() => startEdit(code)}
                          >
                            <Pencil className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-muted-foreground hover:text-destructive"
                            onClick={() => setDeleteId(code.id)}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {!loading && codes.length === 0 && !showAdd && (
          <div className="py-8 text-center text-muted-foreground">
            Aucun code vacation. Cliquez sur &quot;Nouveau code&quot; pour
            commencer.
          </div>
        )}
      </CardContent>

      {/* Delete confirmation */}
      <Dialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Supprimer ce code vacation ?</DialogTitle>
            <DialogDescription>
              Cette action est irreversible. Les shifts existants utilisant ce
              code ne seront pas modifies.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteId(null)}>
              Annuler
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={deleteDeleting}
            >
              {deleteDeleting ? "Suppression..." : "Supprimer"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
