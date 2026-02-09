import { cn } from "@/lib/utils";
import type { RiskLevel } from "@/types";

interface FatigueBadgeProps {
  riskLevel: RiskLevel;
  className?: string;
}

const riskConfig: Record<RiskLevel, { label: string; className: string }> = {
  low: {
    label: "Normal",
    className: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  },
  medium: {
    label: "Vigilance",
    className: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400",
  },
  high: {
    label: "Alerte",
    className: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
  },
  critical: {
    label: "Critique",
    className: "bg-red-200 text-red-900 dark:bg-red-900/50 dark:text-red-300 animate-pulse",
  },
};

export function FatigueBadge({ riskLevel, className }: FatigueBadgeProps) {
  const config = riskConfig[riskLevel];
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
        config.className,
        className
      )}
    >
      {config.label}
    </span>
  );
}
