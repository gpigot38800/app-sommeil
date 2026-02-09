"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { employeeSchema, type EmployeeFormValues } from "@/lib/validators/employee";
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

interface EmployeeFormProps {
  defaultValues?: Partial<EmployeeFormValues>;
  onSubmit: (values: EmployeeFormValues) => Promise<void>;
  onCancel?: () => void;
  loading?: boolean;
  submitLabel?: string;
}

export function EmployeeForm({
  defaultValues,
  onSubmit,
  onCancel,
  loading = false,
  submitLabel = "Ajouter",
}: EmployeeFormProps) {
  const form = useForm<EmployeeFormValues>({
    resolver: zodResolver(employeeSchema),
    defaultValues: {
      matricule: "",
      firstName: "",
      lastName: "",
      department: "",
      position: "",
      employmentType: "temps_plein",
      contractHoursPerWeek: "35",
      habitualSleepTime: "23:00",
      habitualWakeTime: "07:00",
      ...defaultValues,
    },
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <FormField
            control={form.control}
            name="firstName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Prénom *</FormLabel>
                <FormControl>
                  <Input placeholder="Marie" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="lastName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nom *</FormLabel>
                <FormControl>
                  <Input placeholder="Dupont" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <FormField
            control={form.control}
            name="matricule"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Matricule</FormLabel>
                <FormControl>
                  <Input placeholder="12345" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="department"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Service</FormLabel>
                <FormControl>
                  <Input placeholder="Urgences" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <FormField
            control={form.control}
            name="position"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Poste</FormLabel>
                <FormControl>
                  <Input placeholder="IDE" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="employmentType"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Type de contrat</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="temps_plein">Temps plein</SelectItem>
                    <SelectItem value="temps_partiel">Temps partiel</SelectItem>
                    <SelectItem value="interimaire">Intérimaire</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <FormField
            control={form.control}
            name="contractHoursPerWeek"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Heures/semaine</FormLabel>
                <FormControl>
                  <Input placeholder="35" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="habitualSleepTime"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Heure coucher</FormLabel>
                <FormControl>
                  <Input type="time" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="habitualWakeTime"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Heure lever</FormLabel>
                <FormControl>
                  <Input type="time" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="flex gap-2 pt-2">
          <Button type="submit" disabled={loading}>
            {loading ? "En cours..." : submitLabel}
          </Button>
          {onCancel && (
            <Button type="button" variant="outline" onClick={onCancel}>
              Annuler
            </Button>
          )}
        </div>
      </form>
    </Form>
  );
}
