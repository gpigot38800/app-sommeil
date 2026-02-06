"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { shiftSchema, type ShiftFormValues } from "@/lib/validators/shift";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { toast } from "sonner";

const shiftDefaults: Record<string, { startTime: string; endTime: string }> = {
  jour: { startTime: "07:00", endTime: "15:00" },
  soir: { startTime: "15:00", endTime: "23:00" },
  nuit: { startTime: "21:00", endTime: "07:00" },
};

interface ShiftFormProps {
  editingShift?: {
    id: string;
    shiftType: string;
    startDate: string;
    endDate: string;
    startTime: string;
    endTime: string;
  };
  onSuccess?: () => void;
}

export function ShiftForm({ editingShift, onSuccess }: ShiftFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const form = useForm<ShiftFormValues>({
    resolver: zodResolver(shiftSchema),
    defaultValues: editingShift
      ? {
          shiftType: editingShift.shiftType as "jour" | "soir" | "nuit",
          startDate: editingShift.startDate,
          endDate: editingShift.endDate,
          startTime: editingShift.startTime,
          endTime: editingShift.endTime,
        }
      : {
          shiftType: undefined,
          startDate: "",
          endDate: "",
          startTime: "",
          endTime: "",
        },
  });

  function handleTypeChange(value: string) {
    form.setValue("shiftType", value as "jour" | "soir" | "nuit");
    const defaults = shiftDefaults[value];
    if (defaults) {
      form.setValue("startTime", defaults.startTime);
      form.setValue("endTime", defaults.endTime);
    }
  }

  async function onSubmit(values: ShiftFormValues) {
    setLoading(true);

    const isEditing = !!editingShift;
    const url = isEditing ? `/api/shifts/${editingShift.id}` : "/api/shifts";
    const method = isEditing ? "PUT" : "POST";

    const response = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values),
    });

    if (!response.ok) {
      toast.error("Erreur lors de la sauvegarde du shift.");
      setLoading(false);
      return;
    }

    toast.success(isEditing ? "Shift modifié !" : "Shift ajouté !");
    router.refresh();
    onSuccess?.();
    setLoading(false);
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="shiftType"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Type de shift *</FormLabel>
              <Select
                onValueChange={handleTypeChange}
                defaultValue={field.value}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner le type" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="jour">Jour</SelectItem>
                  <SelectItem value="soir">Soir</SelectItem>
                  <SelectItem value="nuit">Nuit</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid gap-4 sm:grid-cols-2">
          <FormField
            control={form.control}
            name="startDate"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Date de début *</FormLabel>
                <FormControl>
                  <Input type="date" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="endDate"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Date de fin *</FormLabel>
                <FormControl>
                  <Input type="date" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <FormField
            control={form.control}
            name="startTime"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Heure de début *</FormLabel>
                <FormControl>
                  <Input type="time" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="endTime"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Heure de fin *</FormLabel>
                <FormControl>
                  <Input type="time" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <Button type="submit" className="w-full" disabled={loading}>
          {loading
            ? "Sauvegarde..."
            : editingShift
              ? "Modifier le shift"
              : "Ajouter le shift"}
        </Button>
      </form>
    </Form>
  );
}
