const SKIP = new Set(["SCRIPT", "STYLE", "CANVAS", "IMG", "SVG", "NOSCRIPT", "TEMPLATE"]);

export type TextNode = {
  path: number[];
  tag: string;
  className: string;
  text: string;
};

function walk(el: Element, path: number[], out: TextNode[]) {
  if (SKIP.has(el.tagName) || out.length >= 30) return;

  const visibleChildren = [...el.children].filter((c) => !SKIP.has(c.tagName));

  if (visibleChildren.length === 0) {
    const text = el.textContent?.trim() ?? "";
    if (text) out.push({ path, tag: el.tagName.toLowerCase(), className: el.className, text });
    return;
  }

  const hasDirectText = [...el.childNodes].some(
    (n) => n.nodeType === Node.TEXT_NODE && (n.textContent?.trim().length ?? 0) > 0,
  );
  if (hasDirectText) {
    const text = el.textContent?.trim() ?? "";
    if (text) { out.push({ path, tag: el.tagName.toLowerCase(), className: el.className, text }); return; }
  }

  visibleChildren.forEach((child, i) => walk(child, [...path, i], out));
}

export function extractTextNodes(slideEl: HTMLElement): TextNode[] {
  const out: TextNode[] = [];
  [...slideEl.children].forEach((child, i) => walk(child, [i], out));
  return out;
}
