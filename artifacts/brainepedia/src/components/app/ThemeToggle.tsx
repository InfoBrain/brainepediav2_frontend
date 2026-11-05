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
    <label className="relative inline-flex items-center gap-1.5 rounded-[10px] border border-[#e6e8ef] bg-white px-2 py-1.5 text-xs font-bold text-[#667084] dark:border-border dark:bg-card">
      <ActiveIcon className="h-3.5 w-3.5 text-primary" />
      <span className="sr-only">Theme</span>
      <select
        value={theme}
        onChange={(event) => setTheme(event.target.value)}
        className="absolute inset-0 cursor-pointer opacity-0 sm:static sm:w-auto sm:bg-transparent sm:text-xs sm:font-mono sm:uppercase sm:tracking-wider sm:text-foreground sm:opacity-100 sm:outline-none"
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
