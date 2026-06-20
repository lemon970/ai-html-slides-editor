const SKIP = new Set(["SCRIPT", "STYLE", "CANVAS", "IMG", "SVG", "NOSCRIPT", "TEMPLATE"]);

function djb2(s: string): number {
  let h = 5381;
  for (let i = 0; i < s.length; i++) h = ((h << 5) + h) ^ s.charCodeAt(i);
  return h >>> 0;
}

export function computeUid(slideIdx: number, path: number[], tag: string, text: string): string {
  const key = `${slideIdx}/${path.join(".")}/${tag}/${text.slice(0, 40).trim()}`;
  return "e" + djb2(key).toString(36).slice(-6).padStart(6, "0");
}

function walkAnnotate(el: Element, slideIdx: number, path: number[]): void {
  if (SKIP.has(el.tagName)) return;

  const allChildren = [...el.children];
  const nonSkip = allChildren.filter((c) => !SKIP.has(c.tagName));

  const hasDirectText = [...el.childNodes].some(
    (n) => n.nodeType === 3 && (n.textContent?.trim().length ?? 0) > 0,
  );

  if (nonSkip.length === 0 || hasDirectText) {
    const text = el.textContent?.trim() ?? "";
    if (text) el.setAttribute("data-eid", computeUid(slideIdx, path, el.tagName.toLowerCase(), text));
    return;
  }

  allChildren.forEach((child, i) => {
    if (!SKIP.has(child.tagName)) walkAnnotate(child, slideIdx, [...path, i]);
  });
}

function buildPathFromSlide(el: Element, slideRoot: Element): number[] {
  const indices: number[] = [];
  let node: Element = el;
  while (node !== slideRoot) {
    const parent = node.parentElement;
    if (!parent) return [];
    indices.unshift(Array.from(parent.children).indexOf(node));
    node = parent;
  }
  return indices;
}

export function annotateUids(slideElements: Element[]): void {
  slideElements.forEach((slide, slideIdx) => {
    [...slide.children].forEach((child, i) => walkAnnotate(child, slideIdx, [i]));
    slide.querySelectorAll("img").forEach((img) => {
      if (!img.getAttribute("data-eid")) {
        const path = buildPathFromSlide(img, slide);
        const src = img.getAttribute("src")?.slice(-20) ?? "";
        img.setAttribute("data-eid", computeUid(slideIdx, path, "img", src));
      }
    });
  });
}

export function detectSlides(doc: Document): HTMLElement[] {
  for (const sel of ["section.slide", ".slide", "[data-slide]", "section"]) {
    const els = [...doc.querySelectorAll<HTMLElement>(sel)];
    if (els.length > 0) return els;
  }
  return [];
}
