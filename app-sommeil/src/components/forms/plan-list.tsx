"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, Trash2 } from "lucide-react";
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
import { toast } from "sonner";

interface TransitionPlan {
  id: string;
  fromShift: string;
  toShift: string;
  startDate: string;
  daysCount: number;
  totalDeficitMinutes: number | null;
  createdAt: string;
}

interface PlanListProps {
  plans: TransitionPlan[];
  onSelectPlan: (planId: string) => void;
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

function formatDeficit(minutes: number | null): string {
  if (!minutes || minutes === 0) return "0h";
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m}min`;
  if (m === 0) return `${h}h`;
  return `${h}h${m}`;
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function PlanList({ plans, onSelectPlan }: PlanListProps) {
  const router = useRouter();
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  async function handleDelete() {
    if (!deleteId) return;
    setDeleting(true);

    const response = await fetch(`/api/transition-plans/${deleteId}`, {
      method: "DELETE",
    });

    if (!response.ok) {
      toast.error("Erreur lors de la suppression.");
      setDeleting(false);
      return;
    }

    toast.success("Plan supprimé !");
    setDeleteId(null);
    setDeleting(false);
    router.refresh();
  }

  if (plans.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          <p>Aucun plan de transition généré</p>
          <p className="text-sm mt-1">
            Utilisez le formulaire ci-dessus pour créer votre premier plan.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Mes plans de transition</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {plans.map((plan) => (
            <div
              key={plan.id}
              className="flex items-center justify-between rounded-lg border p-3"
            >
              <div className="flex items-center gap-3 flex-wrap">
                <div className="flex items-center gap-1.5">
                  <Badge
                    variant="outline"
                    className={typeColors[plan.fromShift] ?? ""}
                  >
                    {typeLabels[plan.fromShift] ?? plan.fromShift}
                  </Badge>
                  <span className="text-muted-foreground text-xs">→</span>
                  <Badge
                    variant="outline"
                    className={typeColors[plan.toShift] ?? ""}
                  >
                    {typeLabels[plan.toShift] ?? plan.toShift}
                  </Badge>
                </div>
                <div className="text-sm">
                  <span className="text-muted-foreground">
                    {formatDate(plan.startDate)} - {plan.daysCount}j
                  </span>
                  {(plan.totalDeficitMinutes ?? 0) > 0 && (
                    <span className="ml-2 text-amber-500">
                      Deficit: {formatDeficit(plan.totalDeficitMinutes)}
                    </span>
                  )}
                </div>
              </div>
              <div className="flex gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => onSelectPlan(plan.id)}
                  aria-label="Voir le détail"
                >
                  <Eye className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setDeleteId(plan.id)}
                  aria-label="Supprimer"
                >
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <Dialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Supprimer ce plan ?</DialogTitle>
            <DialogDescription>
              Cette action est irréversible. Le plan et tous ses jours seront
              définitivement supprimés.
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
    </>
  );
}
