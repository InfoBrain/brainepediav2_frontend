import { useEffect, useState } from "react";
import { Loader2, Rss, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { DEFAULT_FEED_SETTINGS, getFeedSettings, updateFeedSettings } from "@/lib/feedSettingsService";
import type { FeedSettingsDto } from "@/lib/types/socialFeed";

const CONTROLS: Array<{ key: keyof FeedSettingsDto; label: string; hint: string }> = [
  {
    key: "shareXpProgress",
    label: "Share XP progress",
    hint: "When enabled, eligible XP progress can appear on the public feed. Private XP stays off the feed until you turn this on.",
  },
  {
    key: "shareMissionResults",
    label: "Share mission results",
    hint: "When enabled, eligible mission results can appear on the public feed. Scores appear only when your public-score setting also allows them.",
  },
  {
    key: "sharePortfolioUpdates",
    label: "Share portfolio updates",
    hint: "This preference is saved for a later portfolio card. Turning it on does not publish a portfolio card yet.",
  },
];

export function FeedSharingSection() {
  const { toast } = useToast();
  const [settings, setSettings] = useState<FeedSettingsDto>(DEFAULT_FEED_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      const res = await getFeedSettings();
      if (cancelled) return;
      setLoading(false);
      if (!res.ok || !res.data) {
        setError(res.status === 401 ? "Your session has expired. Please log in again." : (res.error || "Unable to load feed sharing preferences."));
        return;
      }
      setSettings(res.data);
    })();
    return () => { cancelled = true; };
  }, []);

  const save = async () => {
    setSaving(true);
    const res = await updateFeedSettings(settings);
    setSaving(false);
    if (!res.ok || !res.data) {
      toast({ title: "Feed sharing was not saved", description: res.error || "Please try again.", variant: "destructive" });
      return;
    }
    setSettings(res.data);
    toast({ title: "Feed sharing saved", description: "Brainepedia will use these preferences when deciding what can appear on the public feed." });
  };

  return (
    <section className="rounded-2xl border border-white/5 bg-[#0d1119] p-6">
      <div className="mb-4 flex items-center gap-3">
        <Rss className="h-6 w-6 text-[#A78BFA]" />
        <div>
          <h2 className="text-xl font-bold">Feed Sharing Preferences</h2>
          <p className="text-sm text-muted-foreground">
            These choices are separate from your public dossier. All three stay off until you save them. Enabling a setting allows the matching eligible activity to appear in the public feed. Brainepedia decides when a card is created.
          </p>
        </div>
      </div>
      {loading ? (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin text-[#00D2FF]" /> Loading feed sharing preferences…
        </div>
      ) : error ? (
        <p className="rounded-xl border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">{error}</p>
      ) : (
        <div className="space-y-4">
          {CONTROLS.map((control) => (
            <div key={control.key} className="flex items-start justify-between gap-4 rounded-xl border border-white/5 bg-white/[0.03] p-4">
              <div>
                <Label htmlFor={control.key} className="text-sm font-semibold">{control.label}</Label>
                <p className="mt-1 text-xs leading-5 text-muted-foreground">{control.hint}</p>
              </div>
              <Switch
                id={control.key}
                checked={settings[control.key]}
                onCheckedChange={(checked) => setSettings((current) => ({ ...current, [control.key]: checked }))}
                aria-label={control.label}
              />
            </div>
          ))}
          <Button onClick={() => void save()} disabled={saving} className="bg-[#7C3AED] font-bold text-white hover:bg-[#6D28D9]">
            {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
            Save feed sharing
          </Button>
        </div>
      )}
    </section>
  );
}
