"use client";

import { AlertTriangle } from "lucide-react";

interface AlertBannerProps {
  criticalCount: number;
  highCount: number;
}

export function AlertBanner({ criticalCount, highCount }: AlertBannerProps) {
  if (criticalCount === 0 && highCount === 0) return null;

  return (
    <div
      className={
        criticalCount > 0
          ? "rounded-lg border border-red-300 bg-red-50 p-4 dark:border-red-800 dark:bg-red-950/50"
          : "rounded-lg border border-orange-300 bg-orange-50 p-4 dark:border-orange-800 dark:bg-orange-950/50"
      }
    >
      <div className="flex items-center gap-3">
        <AlertTriangle
          className={
            criticalCount > 0
              ? "h-5 w-5 text-red-600 dark:text-red-400"
              : "h-5 w-5 text-orange-600 dark:text-orange-400"
          }
        />
        <div>
          {criticalCount > 0 && (
            <p className="font-semibold text-red-800 dark:text-red-300">
              {criticalCount} employé{criticalCount > 1 ? "s" : ""} en situation critique
            </p>
          )}
          {highCount > 0 && (
            <p className="text-sm text-orange-800 dark:text-orange-300">
              {highCount} employé{highCount > 1 ? "s" : ""} en alerte élevée
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
