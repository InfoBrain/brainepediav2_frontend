const GUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function isAbsoluteHttpUrl(value: string | null | undefined): boolean {
  if (!value || !value.trim()) return false;
  try {
    const url = new URL(value.trim());
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

export function safeHttpUrl(value: string | null | undefined): string | null {
  if (!isAbsoluteHttpUrl(value)) return null;
  return value!.trim();
}

export function isGuid(value: string | null | undefined): boolean {
  return Boolean(value && GUID_PATTERN.test(value.trim()));
}

/** Redacts contact details the public feed is not allowed to show. */
export function publicFeedText(value: string | null | undefined): string {
  if (!value) return "";
  return value
    .replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi, "[private]")
    .replace(/(?:\+?\d[\d\s().-]{7,}\d)/g, "[private]");
}

export function clampPageSize(size?: number): number {
  const n = size ?? 20;
  if (!Number.isFinite(n)) return 20;
  return Math.min(50, Math.max(1, Math.trunc(n)));
}

export function formatFeedDate(value: string | null | undefined): string {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });
}

export function employmentLabel(value: string | null | undefined): string {
  const labels: Record<string, string> = {
    FullTime: "Full time",
    PartTime: "Part time",
    Contract: "Contract",
    Internship: "Internship",
    Freelance: "Freelance",
  };
  if (!value) return "";
  return labels[value] ?? value;
}

export function experienceLabel(value: string | null | undefined): string {
  const labels: Record<string, string> = {
    Entry: "Entry",
    Junior: "Junior",
    Mid: "Mid",
    Senior: "Senior",
    Lead: "Lead",
  };
  if (!value) return "";
  return labels[value] ?? value;
}

export function compatibilityLevelLabel(value: string | null | undefined): string {
  const labels: Record<string, string> = {
    NeedsDevelopment: "Needs development",
    PartiallyCompatible: "Partially compatible",
    Compatible: "Compatible",
    HighlyCompatible: "Highly compatible",
  };
  if (!value) return "";
  return labels[value] ?? value;
}
