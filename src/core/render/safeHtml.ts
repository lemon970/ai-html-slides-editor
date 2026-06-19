import DOMPurify from "dompurify";

export function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function fallbackSanitizeHtml(value: string) {
  return value
    .replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, "")
    .replace(/\son[a-z]+\s*=\s*(['"]).*?\1/gi, "")
    .replace(/\son[a-z]+\s*=\s*[^\s>]+/gi, "")
    .replace(/javascript:/gi, "");
}

export function sanitizeHtml(value: string) {
  if (typeof window === "undefined") {
    return fallbackSanitizeHtml(value);
  }

  return DOMPurify.sanitize(value, {
    USE_PROFILES: { html: true },
    FORBID_TAGS: ["script", "iframe", "object", "embed"],
    FORBID_ATTR: ["srcdoc"],
  });
}

export function renderCodeFallback(code: string) {
  return `<pre style="margin:0;padding:12px;white-space:pre-wrap;tab-size:2;"><code>${escapeHtml(code)}</code></pre>`;
}
