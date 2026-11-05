import { useTheme } from "next-themes";

/**
 * Legacy pages pass neon hex colors through inline styles, which the light-theme
 * CSS bridge cannot reach. In light mode those resolve to the V3 palette: purple
 * for accents, and blue/green/orange/red only where the color carries status.
 */
const LIGHT_TONES: Record<string, string> = {
  "#00d2ff": "#7d4ccc",
  "#00b8dd": "#7d4ccc",
  "#ffd700": "#7d4ccc",
  "#f3c800": "#7d4ccc",
  "#9d4edd": "#7d4ccc",
  "#7c3aed": "#7d4ccc",
  "#a78bfa": "#7d4ccc",
  "#c084fc": "#7d4ccc",
  "#6366f1": "#7d4ccc",
  "#f97316": "#b87412",
  "#f59e0b": "#b87412",
  "#fbbf24": "#b87412",
  "#22c55e": "#168a68",
  "#10b981": "#168a68",
  "#34d399": "#168a68",
  "#3b82f6": "#276ef1",
  "#60a5fa": "#276ef1",
  "#f87171": "#d34d62",
  "#ef4444": "#d34d62",
  "#ff6b6b": "#d34d62",
};

export function lightTone(color: string): string {
  return LIGHT_TONES[color.toLowerCase()] ?? color;
}

export function useBrandTone(): (color: string) => string {
  const { resolvedTheme } = useTheme();
  return resolvedTheme === "dark" ? (color) => color : lightTone;
}
