"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { EmployeeForm } from "@/components/forms/employee-form";
import { EmployeeList } from "@/components/forms/employee-list";
import { Plus, Search } from "lucide-react";
import type { EmployeeFormValues } from "@/lib/validators/employee";
import { useEmployees, useMutation } from "@/hooks";

export function EmployeesClient() {
  const { data: employees, loading, refetch } = useEmployees();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [search, setSearch] = useState("");

  const createMutation = useMutation<EmployeeFormValues>({
    url: "/api/admin/employees",
    successMessage: "Employé ajouté",
    errorMessage: "Erreur lors de l'ajout",
    onSuccess: () => {
      setDialogOpen(false);
      refetch();
    },
  });

  const deleteMutation = useMutation<string>({
    url: (id) => `/api/admin/employees/${id}`,
    method: "DELETE",
    successMessage: "Employé désactivé",
    errorMessage: "Erreur lors de la suppression",
    onSuccess: refetch,
  });

  async function handleDelete(id: string) {
    await deleteMutation.mutate(id);
  }

  const filtered = (employees ?? []).filter((e) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      e.firstName.toLowerCase().includes(q) ||
      e.lastName.toLowerCase().includes(q) ||
      (e.department?.toLowerCase().includes(q) ?? false) ||
      (e.matricule?.toLowerCase().includes(q) ?? false)
    );
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Employés</h1>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Ajouter
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Ajouter un employé</DialogTitle>
            </DialogHeader>
            <EmployeeForm
              onSubmit={async (values) => { await createMutation.mutate(values); }}
              onCancel={() => setDialogOpen(false)}
              loading={createMutation.loading}
              submitLabel="Ajouter"
            />
          </DialogContent>
        </Dialog>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Rechercher par nom, service, matricule..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10"
        />
      </div>

      {loading ? (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            Chargement...
          </CardContent>
        </Card>
      ) : (
        <>
          <p className="text-sm text-muted-foreground">
            {filtered.length} employé{filtered.length > 1 ? "s" : ""}
          </p>
          <EmployeeList employees={filtered} onDelete={handleDelete} />
        </>
      )}
    </div>
  );
}
