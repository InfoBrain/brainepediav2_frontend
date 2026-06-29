/**
 * Centralized API error handling for Brainepedia.
 * Extracts backend messages and maps HTTP/network conditions to user-friendly copy.
 */

export type ApiErrorKind =
  | "bad_request"
  | "unauthorized"
  | "forbidden"
  | "not_found"
  | "conflict"
  | "validation"
  | "rate_limit"
  | "server"
  | "timeout"
  | "offline"
  | "cancelled"
  | "network"
  | "unknown";

export type ParsedApiError = {
  kind: ApiErrorKind;
  status?: number;
  message: string;
  raw?: unknown;
  cancelled?: boolean;
};

const STATUS_MESSAGES: Partial<Record<number, string>> = {
  400: "The request could not be processed. Please check your input and try again.",
  401: "Your session has expired. Please log in again.",
  403: "Access restricted. Upgrade your subscription to unlock this feature.",
  404: "The requested resource was not found.",
  409: "This action conflicts with the current state. Please refresh and try again.",
  422: "Some fields need attention before we can continue.",
  429: "Too many requests. Please wait a moment and try again.",
  500: "Server error. Please try again later.",
  502: "The service is temporarily unavailable. Please try again shortly.",
  503: "The service is temporarily unavailable. Please try again shortly.",
};

export function extractApiMessage(data: unknown): string {
  if (!data) return "";
  if (typeof data === "string") {
    const trimmed = data.trim();
    const isHtml = trimmed.startsWith("<") || /<!doctype/i.test(trimmed);
    if (!isHtml && (trimmed.startsWith("{") || trimmed.startsWith("["))) {
      try {
        return extractApiMessage(JSON.parse(trimmed));
      } catch {
        // Fall through.
      }
    }
    return isHtml ? "" : trimmed;
  }
  if (typeof data !== "object") return "";

  const record = data as Record<string, unknown>;
  const message = record.Message ?? record.message;
  if (message) return String(message);

  const status = record.Status ?? record.status;
  if (typeof status === "string" && status.toLowerCase() === "error" && message) {
    return String(message);
  }

  const nested = record.data as Record<string, unknown> | undefined;
  const direct =
    nested?.Message ??
    nested?.message ??
    record.error ??
    record.Error ??
    record.detail ??
    record.Detail ??
    record.title ??
    record.Title;
  if (direct) return String(direct);

  const errors = record.errors ?? record.Errors;
  if (typeof errors === "string") return errors;
  if (Array.isArray(errors)) return errors.map(String).join(" ");
  if (errors && typeof errors === "object") {
    const first = Object.values(errors).flat().filter(Boolean).map(String);
    if (first.length) return first.join(" ");
  }
  return "";
}

export function isAbortError(error: unknown): boolean {
  if (!error) return false;
  if (typeof DOMException !== "undefined" && error instanceof DOMException && error.name === "AbortError") {
    return true;
  }
  if (error instanceof Error) {
    return error.name === "AbortError" || /aborted|cancel/i.test(error.message);
  }
  return false;
}

export function isOfflineError(error: unknown): boolean {
  if (typeof navigator !== "undefined" && navigator.onLine === false) return true;
  if (error instanceof TypeError) {
    const msg = error.message.toLowerCase();
    return msg.includes("failed to fetch") || msg.includes("networkerror") || msg.includes("network request failed");
  }
  return false;
}

export function isTimeoutError(error: unknown): boolean {
  if (error instanceof Error) {
    const msg = error.message.toLowerCase();
    return msg.includes("timeout") || msg.includes("timed out");
  }
  return false;
}

function kindFromStatus(status: number): ApiErrorKind {
  if (status === 400) return "bad_request";
  if (status === 401) return "unauthorized";
  if (status === 403) return "forbidden";
  if (status === 404) return "not_found";
  if (status === 409) return "conflict";
  if (status === 422) return "validation";
  if (status === 429) return "rate_limit";
  if (status >= 500) return "server";
  return "unknown";
}

export function parseApiError(input: {
  status?: number;
  data?: unknown;
  error?: unknown;
  cancelled?: boolean;
}): ParsedApiError {
  if (input.cancelled || isAbortError(input.error)) {
    return {
      kind: "cancelled",
      message: "Request cancelled.",
      cancelled: true,
      raw: input.error ?? input.data,
    };
  }

  if (isOfflineError(input.error)) {
    return {
      kind: "offline",
      message: "You appear to be offline. Check your connection and try again.",
      raw: input.error,
    };
  }

  if (isTimeoutError(input.error)) {
    return {
      kind: "timeout",
      message: "The request timed out. Please try again.",
      raw: input.error,
    };
  }

  const status = input.status;
  const backendMessage = extractApiMessage(input.data ?? input.error);
  if (backendMessage) {
    return {
      kind: status ? kindFromStatus(status) : "unknown",
      status,
      message: backendMessage,
      raw: input.data ?? input.error,
    };
  }

  if (status) {
    return {
      kind: kindFromStatus(status),
      status,
      message: STATUS_MESSAGES[status] ?? `Request failed (${status}). Please try again.`,
      raw: input.data,
    };
  }

  if (input.error instanceof Error && input.error.message) {
    const msg = input.error.message;
    if (/network/i.test(msg)) {
      return { kind: "network", message: "Network error. Please check your connection and try again.", raw: input.error };
    }
    return { kind: "unknown", message: msg, raw: input.error };
  }

  return {
    kind: "unknown",
    message: "Something unexpected happened. Please try again.",
    raw: input.data ?? input.error,
  };
}

export function getApiErrorMessage(input: Parameters<typeof parseApiError>[0]): string {
  return parseApiError(input).message;
}

/** Never expose stack traces or internal diagnostics to end users. */
export function sanitizeErrorForDisplay(message: string): string {
  if (!message) return "Something unexpected happened. Please try again.";
  if (/stack trace|at \w+\.|\.tsx?:\d+|\.js:\d+/i.test(message)) {
    return "Something unexpected happened. Please try again.";
  }
  return message;
}
