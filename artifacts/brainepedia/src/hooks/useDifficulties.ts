import { useQuery } from "@tanstack/react-query";
import type { CSSProperties } from "react";
import { api } from "@/lib/api";

export type DifficultyMeta = {
  id: string;
  name: string;
  rankColorHex: string;
};

function normDifficulties(d: any): DifficultyMeta[] {
  const arr = Array.isArray(d) ? d : d?.data || [];
  return arr.map((x: any) => ({
    id: String(x.id ?? x.difficultyId ?? ""),
    name: x.levelName || x.name || x.difficultyName || `Level ${x.level ?? ""}`,
    rankColorHex: x.rankColorHex || x.colorHex || x.color || "",
  }));
}

export function useDifficulties() {
  return useQuery<DifficultyMeta[]>({
    queryKey: ["difficulties"],
    queryFn: async () => {
      const res = await api.difficulties.list();
      if (!res.ok) return [];
      return normDifficulties(res.data);
    },
    staleTime: 10 * 60 * 1000,
    retry: false,
  });
}

export function buildDifficultyLookup(difficulties: DifficultyMeta[] | undefined): Record<string, DifficultyMeta> {
  if (!difficulties) return {};
  return Object.fromEntries(difficulties.map(d => [d.id, d]));
}

const AMBER_FALLBACK: CSSProperties = {
  color: "#f59e0b",
  borderColor: "rgba(245,158,11,0.3)",
  backgroundColor: "rgba(245,158,11,0.1)",
};

const HEX_RE = /^#?([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/;

function expandHex(h: string): string {
  if (h.length === 3) return h[0]+h[0]+h[1]+h[1]+h[2]+h[2];
  return h;
}

function hexToRgb(hex: string): [number, number, number] | null {
  const m = hex.match(/^([0-9A-Fa-f]{2})([0-9A-Fa-f]{2})([0-9A-Fa-f]{2})$/);
  if (!m) return null;
  return [parseInt(m[1], 16), parseInt(m[2], 16), parseInt(m[3], 16)];
}

export function getDifficultyStyle(rankColorHex: string): CSSProperties {
  if (!rankColorHex) return AMBER_FALLBACK;
  const raw = rankColorHex.startsWith("#") ? rankColorHex.slice(1) : rankColorHex;
  if (!HEX_RE.test(`#${raw}`)) return AMBER_FALLBACK;
  const normalized = `#${expandHex(raw)}`;
  const rgb = hexToRgb(expandHex(raw));
  if (!rgb) return AMBER_FALLBACK;
  const [r, g, b] = rgb;
  return {
    color: normalized,
    borderColor: `rgba(${r},${g},${b},0.30)`,
    backgroundColor: `rgba(${r},${g},${b},0.10)`,
  };
}
