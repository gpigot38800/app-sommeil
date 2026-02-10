"use client";

import { useFetch } from "./use-fetch";
import type { ShiftCode } from "@/types";

/**
 * Fetch the list of shift codes for the current organization.
 */
export function useShiftCodes() {
  return useFetch<ShiftCode[]>("/api/admin/shift-codes");
}
