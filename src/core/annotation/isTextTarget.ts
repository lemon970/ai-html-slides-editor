const TEXT_TAGS = new Set(["H1","H2","H3","H4","H5","H6","P","LI","SPAN","A","BUTTON","TD","TH"]);
const EXCL_TAGS = new Set(["SCRIPT","STYLE","SVG","CANVAS","IMG","INPUT","TEXTAREA","VIDEO","SELECT"]);

export function isTextTarget(el: Element): boolean {
  const tag = el.tagName;
  if (!tag || EXCL_TAGS.has(tag)) return false;
  if (TEXT_TAGS.has(tag)) return !!el.textContent?.trim();
  if (tag === "DIV") {
    return [...el.childNodes].some(
      (n) => n.nodeType === 3 && (n.textContent?.trim().length ?? 0) > 0,
    );
  }
  return false;
}
