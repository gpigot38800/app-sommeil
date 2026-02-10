"use client";

import { useState, useCallback } from "react";
import { toast } from "sonner";

interface UseMutationOptions<TInput> {
  url: string | ((input: TInput) => string);
  method?: "POST" | "PUT" | "DELETE" | "PATCH";
  successMessage?: string;
  errorMessage?: string;
  onSuccess?: () => void;
  onError?: (error: string) => void;
}

interface UseMutationReturn<TInput> {
  mutate: (input?: TInput) => Promise<boolean>;
  loading: boolean;
  error: string | null;
}

/**
 * Generic mutation hook for POST/PUT/DELETE operations.
 * Handles loading state, toast notifications, and callbacks.
 */
export function useMutation<TInput = void>(
  options: UseMutationOptions<TInput>
): UseMutationReturn<TInput> {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const mutate = useCallback(
    async (input?: TInput): Promise<boolean> => {
      setLoading(true);
      setError(null);

      const resolvedUrl =
        typeof options.url === "function"
          ? options.url(input as TInput)
          : options.url;

      // When url is a function, the input was consumed for URL routing — don't send as body
      const sendBody =
        typeof options.url === "function" ? false : input !== undefined;

      try {
        const fetchInit: RequestInit = {
          method: options.method ?? "POST",
        };
        if (sendBody) {
          fetchInit.headers = { "Content-Type": "application/json" };
          fetchInit.body = JSON.stringify(input);
        }
        const res = await fetch(resolvedUrl, fetchInit);

        if (!res.ok) {
          let errMsg = options.errorMessage ?? "Une erreur est survenue";
          try {
            const errBody = await res.json();
            if (errBody.error) errMsg = errBody.error;
          } catch {
            // ignore parse error
          }
          setError(errMsg);
          toast.error(errMsg);
          options.onError?.(errMsg);
          return false;
        }

        if (options.successMessage) {
          toast.success(options.successMessage);
        }
        options.onSuccess?.();
        return true;
      } catch (err) {
        const errMsg = err instanceof Error ? err.message : "Erreur réseau";
        setError(errMsg);
        toast.error(options.errorMessage ?? errMsg);
        options.onError?.(errMsg);
        return false;
      } finally {
        setLoading(false);
      }
    },
    [options]
  );

  return { mutate, loading, error };
}
