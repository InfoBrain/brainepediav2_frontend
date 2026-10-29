import { useEffect, useState } from "react";
import { Loader2, Save, Shield } from "lucide-react";
import { api } from "@/lib/api";
import { DEFAULT_PRIVACY_SETTINGS, normalizePrivacySettings, privacySettingsPayload } from "@/lib/privacySettings";
import type { ProfilePrivacySettingsDto } from "@/lib/types/billingCredits";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";

const CONTROLS: Array<{
  key: keyof ProfilePrivacySettingsDto;
  label: string;
  hint: string;
}> = [
  {
    key: "isPublicDossierEnabled",
    label: "Public dossier enabled",
    hint: "If this is disabled, the public dossier will not be available.",
  },
  {
    key: "allowPublicMissionResults",
    label: "Show completed mission results publicly",
    hint: "If this is disabled, completed missions will not appear on the public dossier.",
  },
  {
    key: "allowPublicMissionScores",
    label: "Show numeric mission scores publicly",
    hint: "If this is disabled, public viewers may see pass/fail status without numeric scores.",
  },
  {
    key: "allowMlTraining",
    label: "Allow anonymized ML training capture",
    hint: "This only controls backend capture. The app does not train models in the browser.",
  },
  {
    key: "emailNotificationsEnabled",
    label: "Receive profile and mission reminder emails",
    hint: "Reminder emails are scheduled by the server when this setting is enabled.",
  },
];

export function PrivacySettingsSection() {
  const { toast } = useToast();
  const [settings, setSettings] = useState<ProfilePrivacySettingsDto>(DEFAULT_PRIVACY_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const load = async () => {
    setLoading(true);
    setError("");
    const res = await api.profiles.getPrivacySettings();
    setLoading(false);
    if (!res.ok) {
      if (res.status === 401) setError("Your session has expired. Please log in again.");
      else if (res.status === 404) setError("Privacy settings were not found for this account.");
      else setError(res.error || "Unable to load privacy settings.");
      return;
    }
    setSettings(normalizePrivacySettings(res.data));
  };

  useEffect(() => {
    void load();
  }, []);

  const save = async () => {
    setSaving(true);
    const payload = privacySettingsPayload(settings);
    const res = await api.profiles.updatePrivacySettings(payload);
    setSaving(false);
    if (!res.ok) {
      toast({
        title: "Privacy settings were not saved",
        description: res.error || "Please try again.",
        variant: "destructive",
      });
      return;
    }
    setSettings(normalizePrivacySettings(res.data ?? payload));
    toast({ title: "Privacy settings saved", description: "Your visibility and notification preferences are now in effect." });
  };

  return (
    <section className="rounded-2xl border border-white/5 bg-[#0d1119] p-6">
      <div className="mb-6 flex items-center gap-3">
        <Shield className="h-6 w-6 text-[#00D2FF]" />
        <div>
          <h2 className="text-xl font-bold">Privacy and Notifications</h2>
          <p className="text-sm text-muted-foreground">Control public dossier visibility, mission results, and reminder emails for your own account.</p>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin text-[#00D2FF]" /> Loading privacy settings…
        </div>
      ) : error ? (
        <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">{error}</div>
      ) : (
        <div className="space-y-4">
          {CONTROLS.map((control) => (
            <div key={control.key} className="flex items-start justify-between gap-4 rounded-xl border border-white/5 bg-white/[0.03] p-4">
              <div className="min-w-0">
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
          <Button onClick={() => void save()} disabled={saving} className="bg-[#00D2FF] font-bold text-black hover:bg-[#00B8DD]">
            {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
            Save privacy settings
          </Button>
        </div>
      )}
    </section>
  );
}
