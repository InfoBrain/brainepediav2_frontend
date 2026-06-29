import { QueryClient } from "@tanstack/react-query";
import { getApiErrorMessage } from "./apiErrorHandler";

export function createAppQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 60_000,
        gcTime: 5 * 60_000,
        retry: (failureCount, error) => {
          const status = (error as { status?: number })?.status;
          if (status === 401 || status === 403 || status === 404) return false;
          return failureCount < 2;
        },
        refetchOnWindowFocus: false,
      },
      mutations: {
        retry: false,
      },
    },
  });
}

export function queryErrorMessage(error: unknown): string {
  if (!error) return "Something unexpected happened. Please try again.";
  if (typeof error === "string") return error;
  if (error instanceof Error) {
    return getApiErrorMessage({ error });
  }
  const maybe = error as { status?: number; data?: unknown; message?: string };
  if (maybe.message) return maybe.message;
  return getApiErrorMessage({ status: maybe.status, data: maybe.data, error });
}
