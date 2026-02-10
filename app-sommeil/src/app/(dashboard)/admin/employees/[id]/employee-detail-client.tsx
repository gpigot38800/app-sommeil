"use client";

import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { EmployeeForm } from "@/components/forms/employee-form";
import { ArrowLeft } from "lucide-react";
import type { Employee } from "@/types";
import type { EmployeeFormValues } from "@/lib/validators/employee";
import { useFetch, useMutation } from "@/hooks";

interface EmployeeDetailClientProps {
  employeeId: string;
}

export function EmployeeDetailClient({ employeeId }: EmployeeDetailClientProps) {
  const router = useRouter();
  const { data: employee, loading, refetch } = useFetch<Employee>(
    `/api/admin/employees/${employeeId}`
  );

  const updateMutation = useMutation<EmployeeFormValues>({
    url: `/api/admin/employees/${employeeId}`,
    method: "PUT",
    successMessage: "Employé mis à jour",
    errorMessage: "Erreur lors de la mise à jour",
    onSuccess: refetch,
  });

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
            onSubmit={async (values) => { await updateMutation.mutate(values); }}
            loading={updateMutation.loading}
            submitLabel="Enregistrer"
          />
        </CardContent>
      </Card>
    </div>
  );
}
