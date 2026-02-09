"use client";

import { CsvImporter } from "@/components/forms/csv-importer";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

export function ImportClient() {
  const router = useRouter();

  function handleImportComplete() {
    toast.success("Import terminé ! Recalcul de la fatigue en cours...");
    // Trigger fatigue recalculation
    fetch("/api/admin/fatigue/calculate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ windowDays: 7 }),
    }).then(() => {
      router.push("/admin/dashboard");
    });
  }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Import CSV</h1>
      <CsvImporter onImportComplete={handleImportComplete} />
    </div>
  );
}
