import { Monitor, Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";

const OPTIONS = [
  { value: "system", label: "System", icon: Monitor },
  { value: "light", label: "Light", icon: Sun },
  { value: "dark", label: "Dark", icon: Moon },
];

export function ThemeToggle() {
  const { theme = "system", setTheme } = useTheme();
  const active = OPTIONS.find((option) => option.value === theme) ?? OPTIONS[0];
  const ActiveIcon = active.icon;

  return (
    <label className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-card/80 px-2.5 py-1.5 text-xs text-muted-foreground shadow-sm transition-colors">
      <ActiveIcon className="h-3.5 w-3.5 text-primary" />
      <span className="sr-only">Theme</span>
      <select
        value={theme}
        onChange={(event) => setTheme(event.target.value)}
        className="bg-transparent text-xs font-mono uppercase tracking-wider text-foreground outline-none"
        aria-label="Theme preference"
      >
        {OPTIONS.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}
