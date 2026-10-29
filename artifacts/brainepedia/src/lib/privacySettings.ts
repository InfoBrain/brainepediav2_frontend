import { unwrapApiData, readBoolean } from "./aiCredits";
import type { ProfilePrivacySettingsDto } from "./types/billingCredits";

export const DEFAULT_PRIVACY_SETTINGS: ProfilePrivacySettingsDto = {
  isPublicDossierEnabled: false,
  allowPublicMissionResults: false,
  allowPublicMissionScores: false,
  allowMlTraining: false,
  emailNotificationsEnabled: false,
};

export function normalizePrivacySettings(payload: unknown): ProfilePrivacySettingsDto {
  const root = unwrapApiData<Record<string, unknown>>(payload) ?? {};
  return {
    isPublicDossierEnabled: readBoolean(root.isPublicDossierEnabled ?? root.IsPublicDossierEnabled) ?? false,
    allowPublicMissionResults: readBoolean(root.allowPublicMissionResults ?? root.AllowPublicMissionResults) ?? false,
    allowPublicMissionScores: readBoolean(root.allowPublicMissionScores ?? root.AllowPublicMissionScores) ?? false,
    allowMlTraining: readBoolean(root.allowMlTraining ?? root.AllowMlTraining) ?? false,
    emailNotificationsEnabled: readBoolean(root.emailNotificationsEnabled ?? root.EmailNotificationsEnabled) ?? false,
  };
}

export function privacySettingsPayload(settings: ProfilePrivacySettingsDto): ProfilePrivacySettingsDto {
  return {
    isPublicDossierEnabled: Boolean(settings.isPublicDossierEnabled),
    allowPublicMissionResults: Boolean(settings.allowPublicMissionResults),
    allowPublicMissionScores: Boolean(settings.allowPublicMissionScores),
    allowMlTraining: Boolean(settings.allowMlTraining),
    emailNotificationsEnabled: Boolean(settings.emailNotificationsEnabled),
  };
}
