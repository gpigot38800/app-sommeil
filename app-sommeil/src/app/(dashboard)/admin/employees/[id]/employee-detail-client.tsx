"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { EmployeeForm } from "@/components/forms/employee-form";
import { ArrowLeft } from "lucide-react";
import type { Employee } from "@/types";
import type { EmployeeFormValues } from "@/lib/validators/employee";
import { toast } from "sonner";

interface EmployeeDetailClientProps {
  employeeId: string;
}

export function EmployeeDetailClient({ employeeId }: EmployeeDetailClientProps) {
  const router = useRouter();
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const fetchEmployee = useCallback(async () => {
    try {
      const res = await fetch(`/api/admin/employees/${employeeId}`);
      if (res.ok) {
        setEmployee(await res.json());
      }
    } finally {
      setLoading(false);
    }
  }, [employeeId]);

  useEffect(() => {
    fetchEmployee();
  }, [fetchEmployee]);

  async function handleUpdate(values: EmployeeFormValues) {
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/employees/${employeeId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      if (res.ok) {
        toast.success("Employé mis à jour");
        fetchEmployee();
      } else {
        toast.error("Erreur lors de la mise à jour");
      }
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          Chargement...
        </CardContent>
      </Card>
    );
  }

  if (!employee) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          Employé non trouvé
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Button
        variant="ghost"
        onClick={() => router.push("/admin/employees")}
        className="mb-2"
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Retour
      </Button>

      <Card>
        <CardHeader>
          <CardTitle>
            {employee.firstName} {employee.lastName}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <EmployeeForm
            defaultValues={{
              matricule: employee.matricule ?? "",
              firstName: employee.firstName,
              lastName: employee.lastName,
              department: employee.department ?? "",
              position: employee.position ?? "",
              employmentType: (employee.employmentType as "temps_plein" | "temps_partiel" | "interimaire") ?? "temps_plein",
              contractHoursPerWeek: employee.contractHoursPerWeek ?? "35",
              habitualSleepTime: employee.habitualSleepTime ?? "23:00",
              habitualWakeTime: employee.habitualWakeTime ?? "07:00",
            }}
            onSubmit={handleUpdate}
            loading={saving}
            submitLabel="Enregistrer"
          />
        </CardContent>
      </Card>
    </div>
  );
}
