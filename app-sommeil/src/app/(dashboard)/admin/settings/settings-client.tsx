"use client";

import { ShiftCodesManager } from "@/components/forms/shift-codes-manager";

export function SettingsClient() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Paramètres</h1>
      <ShiftCodesManager />
    </div>
  );
}
