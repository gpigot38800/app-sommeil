"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { ShiftForm } from "./shift-form";
import { toast } from "sonner";

interface Shift {
  id: string;
  shiftType: string;
  startDate: string;
  endDate: string;
  startTime: string;
  endTime: string;
}

interface ShiftListProps {
  shifts: Shift[];
}

const typeLabels: Record<string, string> = {
  jour: "Jour",
  soir: "Soir",
  nuit: "Nuit",
};

const typeColors: Record<string, string> = {
  jour: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  soir: "bg-orange-500/20 text-orange-400 border-orange-500/30",
  nuit: "bg-indigo-500/20 text-indigo-400 border-indigo-500/30",
};

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function ShiftList({ shifts }: ShiftListProps) {
  const router = useRouter();
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [editingShift, setEditingShift] = useState<Shift | null>(null);

  async function handleDelete() {
    if (!deleteId) return;
    setDeleting(true);

    const response = await fetch(`/api/shifts/${deleteId}`, {
      method: "DELETE",
    });

    if (!response.ok) {
      toast.error("Erreur lors de la suppression.");
      setDeleting(false);
      return;
    }

    toast.success("Shift supprimé !");
    setDeleteId(null);
    setDeleting(false);
    router.refresh();
  }

  if (shifts.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <p className="text-lg">Aucun shift enregistré</p>
        <p className="text-sm mt-1">
          Ajoutez votre premier shift pour commencer.
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-3">
        {shifts.map((shift) => (
          <Card key={shift.id}>
            <CardContent className="flex items-center justify-between p-4">
              <div className="flex items-center gap-3">
                <Badge
                  variant="outline"
                  className={typeColors[shift.shiftType] ?? ""}
                >
                  {typeLabels[shift.shiftType] ?? shift.shiftType}
                </Badge>
                <div>
                  <p className="text-sm font-medium">
                    {formatDate(shift.startDate)}
                    {shift.startDate !== shift.endDate &&
                      ` — ${formatDate(shift.endDate)}`}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {shift.startTime} - {shift.endTime}
                  </p>
                </div>
              </div>
              <div className="flex gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setEditingShift(shift)}
                  aria-label="Modifier"
                >
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setDeleteId(shift.id)}
                  aria-label="Supprimer"
                >
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Dialog de confirmation de suppression */}
      <Dialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Supprimer ce shift ?</DialogTitle>
            <DialogDescription>
              Cette action est irréversible. Le shift sera définitivement
              supprimé.
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

      {/* Sheet de modification */}
      <Sheet open={!!editingShift} onOpenChange={() => setEditingShift(null)}>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>Modifier le shift</SheetTitle>
          </SheetHeader>
          <div className="mt-6">
            {editingShift && (
              <ShiftForm
                editingShift={editingShift}
                onSuccess={() => setEditingShift(null)}
              />
            )}
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
