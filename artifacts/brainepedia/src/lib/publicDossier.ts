/** Open the redesigned public portfolio dossier in a new browser tab. */
export function openPublicDossier(userId: string): void {
  if (!userId) return;
  const url = `${window.location.origin}/public-profile/${encodeURIComponent(userId)}`;
  window.open(url, "_blank", "noopener,noreferrer");
}
