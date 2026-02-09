"use client";

import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Trash2 } from "lucide-react";
import type { Employee } from "@/types";

interface EmployeeListProps {
  employees: Employee[];
  onDelete?: (id: string) => void;
}

export function EmployeeList({ employees, onDelete }: EmployeeListProps) {
  if (employees.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          Aucun employé enregistré. Ajoutez votre premier employé ou importez un fichier CSV.
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-2">
      {employees.map((emp) => (
        <Card key={emp.id}>
          <CardContent className="flex items-center justify-between py-3">
            <Link
              href={`/admin/employees/${emp.id}`}
              className="flex-1 hover:underline"
            >
              <div className="flex items-center gap-3">
                <div>
                  <p className="font-medium">
                    {emp.firstName} {emp.lastName}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {[emp.position, emp.department].filter(Boolean).join(" — ") || "Non renseigné"}
                  </p>
                </div>
              </div>
            </Link>
            <div className="flex items-center gap-2">
              {emp.matricule && (
                <Badge variant="outline" className="text-xs">
                  {emp.matricule}
                </Badge>
              )}
              {emp.employmentType && (
                <Badge variant="secondary" className="text-xs">
                  {emp.employmentType === "temps_plein"
                    ? "Temps plein"
                    : emp.employmentType === "temps_partiel"
                    ? "Temps partiel"
                    : "Intérimaire"}
                </Badge>
              )}
              {onDelete && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-muted-foreground hover:text-destructive"
                  onClick={() => onDelete(emp.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
