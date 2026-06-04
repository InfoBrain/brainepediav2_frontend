import { cn } from "@/lib/utils";

type HtmlContentProps = {
  html?: string | null;
  fallback?: string;
  className?: string;
};

const ALLOWED_TAGS = new Set([
  "A",
  "B",
  "BLOCKQUOTE",
  "BR",
  "CODE",
  "DIV",
  "EM",
  "H1",
  "H2",
  "H3",
  "H4",
  "I",
  "LI",
  "OL",
  "P",
  "PRE",
  "SPAN",
  "STRONG",
  "U",
  "UL",
]);

function looksLikeHtml(value: string): boolean {
  return /<\/?[a-z][\s\S]*>/i.test(value);
}

function sanitizeHtml(html: string): string {
  if (typeof document === "undefined") return html;
  const template = document.createElement("template");
  template.innerHTML = html;

  const clean = (node: Node) => {
    [...node.childNodes].forEach((child) => {
      if (child.nodeType === Node.ELEMENT_NODE) {
        const element = child as HTMLElement;
        const tagName = element.tagName;
        if (!ALLOWED_TAGS.has(tagName)) {
          element.replaceWith(document.createTextNode(element.textContent || ""));
          return;
        }
        [...element.attributes].forEach((attribute) => {
          const name = attribute.name.toLowerCase();
          const value = attribute.value;
          const isSafeLink = tagName === "A" && name === "href" && !/^javascript:/i.test(value);
          if (isSafeLink) {
            element.setAttribute("target", "_blank");
            element.setAttribute("rel", "noopener noreferrer");
            return;
          }
          if (name !== "target" && name !== "rel") element.removeAttribute(attribute.name);
        });
      }
      clean(child);
    });
  };

  clean(template.content);
  return template.innerHTML;
}

export function HtmlContent({ html, fallback = "No content provided.", className }: HtmlContentProps) {
  const value = (html || "").trim();
  if (!value) {
    return <p className={cn("whitespace-pre-wrap text-muted-foreground", className)}>{fallback}</p>;
  }

  if (!looksLikeHtml(value)) {
    return <p className={cn("whitespace-pre-wrap text-muted-foreground", className)}>{value}</p>;
  }

  return (
    <div
      className={cn(
        "prose prose-invert prose-sm max-w-none text-muted-foreground",
        "prose-a:text-[#00D2FF] prose-blockquote:border-[#00D2FF]/50 prose-code:text-white prose-headings:text-white prose-strong:text-white",
        className
      )}
      dangerouslySetInnerHTML={{ __html: sanitizeHtml(value) }}
    />
  );
}
