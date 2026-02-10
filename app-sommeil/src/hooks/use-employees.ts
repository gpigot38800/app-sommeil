"use client";

import { useFetch } from "./use-fetch";
import type { Employee } from "@/types";

/**
 * Fetch the list of employees for the current organization.
 */
export function useEmployees() {
  return useFetch<Employee[]>("/api/admin/employees");
}
