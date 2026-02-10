"use client";

import { useState, useEffect, useCallback, useRef } from "react";

interface UseFetchOptions {
  /** Skip initial fetch (useful for conditional fetching) */
  skip?: boolean;
}

interface UseFetchReturn<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

/**
 * Generic data-fetching hook.
 * Pass `url = null` to disable fetching (conditional fetch).
 * Re-fetches automatically when the URL changes.
 */
export function useFetch<T>(
  url: string | null,
  options?: UseFetchOptions
): UseFetchReturn<T> {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(url !== null && !options?.skip);
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
      const json = await res.json();
      if (!controller.signal.aborted) {
        setData(json);
      }
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") return;
      if (!controller.signal.aborted) {
        setError(err instanceof Error ? err.message : "Erreur inconnue");
      }
    } finally {
      if (!controller.signal.aborted) {
        setLoading(false);
      }
    }
  }, [url]);

  useEffect(() => {
    if (options?.skip || url === null) {
      setLoading(false);
      return;
    }
    fetchData();
    return () => controllerRef.current?.abort();
  }, [fetchData, options?.skip, url]);

  return { data, loading, error, refetch: fetchData };
}
