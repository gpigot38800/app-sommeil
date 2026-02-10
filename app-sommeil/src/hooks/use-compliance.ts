"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import type { ComplianceViolation } from "@/lib/compliance-engine/types";

export interface ComplianceEntry {
  employeeId: string;
  employeeName: string;
  department: string | null;
  violations: ComplianceViolation[];
}

interface UseComplianceReturn {
  /** Map keyed by "employeeId:date" → violations for that cell */
  violations: Map<string, ComplianceViolation[]>;
  /** Raw compliance data from API */
  rawData: ComplianceEntry[];
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

/**
 * Fetch compliance violations and build a Map<"employeeId:date", violations[]>.
 * Pass `url = null` to disable fetching.
 */
export function useComplianceViolations(url: string | null): UseComplianceReturn {
  const [violations, setViolations] = useState<Map<string, ComplianceViolation[]>>(new Map());
  const [rawData, setRawData] = useState<ComplianceEntry[]>([]);
  const [loading, setLoading] = useState(url !== null);
  const [error, setError] = useState<string | null>(null);
  const controllerRef = useRef<AbortController | null>(null);

  const fetchData = useCallback(async () => {
    if (!url) return;

    controllerRef.current?.abort();
    const controller = new AbortController();
    controllerRef.current = controller;

    setLoading(true);
    setError(null);

    try {
      const res = await fetch(url, { signal: controller.signal });
      if (!res.ok) throw new Error(`Erreur ${res.status}`);
      const data: ComplianceEntry[] = await res.json();

      if (!controller.signal.aborted) {
        setRawData(data);
        const map = new Map<string, ComplianceViolation[]>();
        for (const entry of data) {
          for (const v of entry.violations) {
            const key = `${entry.employeeId}:${v.date}`;
            const existing = map.get(key) || [];
            existing.push(v);
            map.set(key, existing);
          }
        }
        setViolations(map);
      }
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") return;
      if (!controller.signal.aborted) {
        setError(err instanceof Error ? err.message : "Erreur inconnue");
        setViolations(new Map());
        setRawData([]);
      }
    } finally {
      if (!controller.signal.aborted) {
        setLoading(false);
      }
    }
  }, [url]);

  useEffect(() => {
    if (url === null) {
      setLoading(false);
      setViolations(new Map());
      setRawData([]);
      return;
    }
    fetchData();
    return () => controllerRef.current?.abort();
  }, [fetchData, url]);

  return { violations, rawData, loading, error, refetch: fetchData };
}
