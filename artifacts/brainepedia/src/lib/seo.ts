export function plainText(value: unknown): string {
  if (value === null || value === undefined) return "";
  const withoutTags = String(value).replace(/<[^>]*>/g, " ");
  return withoutTags.replace(/\s+/g, " ").trim();
}

export function truncateDescription(value: unknown, maxLength = 160): string {
  const clean = plainText(value);
  if (clean.length <= maxLength) return clean;
  return `${clean.slice(0, maxLength - 1).trimEnd()}...`;
}

export function setPageMeta({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  if (title) document.title = title;
  const metaDescription = truncateDescription(description);
  setMeta("description", metaDescription);
  setMeta("og:title", title, "property");
  setMeta("og:description", metaDescription, "property");
  setMeta("og:type", "website", "property");
  setMeta("og:url", window.location.href, "property");
  setMeta("twitter:card", "summary_large_image");
  setMeta("twitter:title", title);
  setMeta("twitter:description", metaDescription);
}

function setMeta(name: string, content: string, attr: "name" | "property" = "name") {
  if (!content) return;
  let meta = document.querySelector<HTMLMetaElement>(`meta[${attr}="${name}"]`);
  if (!meta) {
    meta = document.createElement("meta");
    meta.setAttribute(attr, name);
    document.head.appendChild(meta);
  }
  meta.setAttribute("content", content);
}
