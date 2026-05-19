"use client";

import { useCallback, useState } from "react";
import { normalizeError, type AppError } from "@/lib/errors";

interface ActionState<T> {
  data: T | null;
  error: AppError | null;
  isLoading: boolean;
}

interface UseActionReturn<TArgs, TResult> {
  execute: (args: TArgs) => Promise<TResult | null>;
  data: TResult | null;
  error: AppError | null;
  isLoading: boolean;
  reset: () => void;
}

export function useAction<TArgs, TResult>(
  fn: (args: TArgs) => Promise<TResult>,
): UseActionReturn<TArgs, TResult> {
  const [state, setState] = useState<ActionState<TResult>>({
    data: null,
    error: null,
    isLoading: false,
  });

  const execute = useCallback(
    async (args: TArgs): Promise<TResult | null> => {
      setState({ data: null, error: null, isLoading: true });
      try {
        const result = await fn(args);
        setState({ data: result, error: null, isLoading: false });
        return result;
      } catch (err) {
        const normalized = normalizeError(err);
        setState({ data: null, error: normalized, isLoading: false });
        return null;
      }
    },
    [fn],
  );

  const reset = useCallback(() => {
    setState({ data: null, error: null, isLoading: false });
  }, []);

  return { execute, ...state, reset };
}
