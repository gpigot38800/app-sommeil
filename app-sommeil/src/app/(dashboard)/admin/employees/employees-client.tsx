"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import type { Employee } from "@/types";
import type { EmployeeFormValues } from "@/lib/validators/employee";
import { toast } from "sonner";

export function EmployeesClient() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  const [search, setSearch] = useState("");

  const fetchEmployees = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/employees");
      if (res.ok) {
        const data = await res.json();
        setEmployees(data);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchEmployees();
  }, [fetchEmployees]);

  async function handleCreate(values: EmployeeFormValues) {
    setFormLoading(true);
    try {
      const res = await fetch("/api/admin/employees", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      if (res.ok) {
        toast.success("Employé ajouté");
        setDialogOpen(false);
        fetchEmployees();
      } else {
        toast.error("Erreur lors de l'ajout");
      }
    } finally {
      setFormLoading(false);
    }
  }

  async function handleDelete(id: string) {
    const res = await fetch(`/api/admin/employees/${id}`, {
      method: "DELETE",
    });
    if (res.ok) {
      toast.success("Employé désactivé");
      fetchEmployees();
    } else {
      toast.error("Erreur lors de la suppression");
    }
  }

  const filtered = employees.filter((e) => {
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
              onSubmit={handleCreate}
              onCancel={() => setDialogOpen(false)}
              loading={formLoading}
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
