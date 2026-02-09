import { cn } from "@/lib/utils";
import type { ShiftCategory } from "@/types";

interface ShiftCategoryBadgeProps {
  code: string;
  category: ShiftCategory;
  className?: string;
  onClick?: () => void;
}

const categoryConfig: Record<ShiftCategory, string> = {
  jour: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
  soir: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400",
  nuit: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400",
  repos: "bg-gray-100 text-gray-600 dark:bg-gray-800/30 dark:text-gray-400",
  absence: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
};

export function ShiftCategoryBadge({ code, category, className, onClick }: ShiftCategoryBadgeProps) {
  return (
    <span
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
      onClick={onClick}
      onKeyDown={onClick ? (e) => { if (e.key === "Enter" || e.key === " ") onClick(); } : undefined}
      className={cn(
        "inline-flex items-center rounded px-1.5 py-0.5 text-xs font-semibold",
        categoryConfig[category],
        onClick && "cursor-pointer hover:opacity-80",
        className
      )}
    >
      {code}
    </span>
  );
}
