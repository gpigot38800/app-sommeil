"use client";

import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { AlertTriangle } from "lucide-react";
import type { ComplianceViolation } from "@/lib/compliance-engine/types";

interface ComplianceIndicatorProps {
  violations: ComplianceViolation[];
}

export function ComplianceIndicator({ violations }: ComplianceIndicatorProps) {
  if (violations.length === 0) return null;

  const hasCritical = violations.some((v) => v.severity === "critical");
  const hasViolation = violations.some((v) => v.severity === "violation");

  const dotColor = hasCritical || hasViolation
    ? "bg-red-500"
    : "bg-orange-400";

  const iconColor = hasCritical || hasViolation
    ? "text-red-600 dark:text-red-400"
    : "text-orange-500 dark:text-orange-400";

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            type="button"
            className="absolute -top-1 -right-1 z-10 flex items-center justify-center"
            onClick={(e) => e.stopPropagation()}
          >
            <span
              className={`block h-3 w-3 rounded-full ${dotColor} ${
                hasCritical ? "animate-pulse" : ""
              } ring-2 ring-background`}
            />
          </button>
        </TooltipTrigger>
        <TooltipContent
          side="top"
          className="max-w-xs bg-background text-foreground border shadow-lg p-3"
        >
          <div className="space-y-1.5">
            <div className="flex items-center gap-1.5 font-semibold text-sm">
              <AlertTriangle className={`h-3.5 w-3.5 ${iconColor}`} />
              {violations.length} violation{violations.length > 1 ? "s" : ""} reglementaire{violations.length > 1 ? "s" : ""}
            </div>
            {violations.map((v, i) => (
              <div key={i} className="text-xs text-muted-foreground">
                <span
                  className={`inline-block mr-1 h-1.5 w-1.5 rounded-full ${
                    v.severity === "critical"
                      ? "bg-red-500"
                      : v.severity === "violation"
                        ? "bg-red-400"
                        : "bg-orange-400"
                  }`}
                />
                {v.message}
              </div>
            ))}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
