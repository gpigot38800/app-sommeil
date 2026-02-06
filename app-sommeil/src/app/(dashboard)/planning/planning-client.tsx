"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { ShiftForm } from "@/components/forms/shift-form";
import { ShiftList } from "@/components/forms/shift-list";

interface Shift {
  id: string;
  shiftType: string;
  startDate: string;
  endDate: string;
  startTime: string;
  endTime: string;
}

interface PlanningClientProps {
  shifts: Shift[];
}

export function PlanningClient({ shifts }: PlanningClientProps) {
  const [sheetOpen, setSheetOpen] = useState(false);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Planning</h1>
          <p className="text-sm text-muted-foreground">
            Gérez vos shifts de travail
          </p>
        </div>
        <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
          <SheetTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Ajouter un shift
            </Button>
          </SheetTrigger>
          <SheetContent>
            <SheetHeader>
              <SheetTitle>Nouveau shift</SheetTitle>
            </SheetHeader>
            <div className="mt-6">
              <ShiftForm onSuccess={() => setSheetOpen(false)} />
            </div>
          </SheetContent>
        </Sheet>
      </div>

      <ShiftList shifts={shifts} />
    </div>
  );
}
