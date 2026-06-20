import { annotateUids, detectSlides } from "@/core/annotation/uidAnnotation";

export type PatchTarget = {
  uid: string;
  htmlId?: string;
  selector?: string;
  path?: { slideIdx: number; indices: number[] };
  fingerprint?: string;
};

export type TextPatch = { id: string; type: "text"; target: PatchTarget; value: string };
export type ImgSrcPatch = { id: string; type: "imgSrc"; target: PatchTarget; value: string };
export type HidePatch = { id: string; type: "hide"; target: PatchTarget; label?: string };

export type Patch = TextPatch | ImgSrcPatch | HidePatch;

export type StaleInfo = { id: string; reason: string };

function resolveTarget(target: PatchTarget, doc: Document, slides: Element[]): Element | null {
  if (target.uid) {
    const el = doc.querySelector(`[data-eid="${target.uid}"]`);
    if (el) return el;
  }
  if (target.htmlId) {
    const el = doc.getElementById(target.htmlId);
    if (el) return el;
  }
  if (target.selector) {
    try {
      const el = doc.querySelector(target.selector);
      if (el) return el;
    } catch { /* invalid selector */ }
  }
  if (target.path) {
    const { slideIdx, indices } = target.path;
    let el: Element | null = slides[slideIdx] ?? null;
    for (const i of indices) {
      if (!el) break;
      el = el.children[i] ?? null;
    }
    if (el) return el;
  }
  return null;
}

export function applyPatches(
  sourceHtml: string,
  patches: Patch[],
): { html: string; stale: StaleInfo[] } {
  const doc = new DOMParser().parseFromString(sourceHtml, "text/html");
  const slides = detectSlides(doc);
  annotateUids(slides.length > 0 ? slides : (doc.body ? [doc.body] : []));

  const stale: StaleInfo[] = [];

  for (const patch of patches) {
    const el = resolveTarget(patch.target, doc, slides);
    if (!el) { stale.push({ id: patch.id, reason: "target not found" }); continue; }
    if (patch.type === "text") el.textContent = patch.value;
    if (patch.type === "imgSrc") el.setAttribute("src", patch.value);
    if (patch.type === "hide") (el as HTMLElement).style.setProperty("display", "none", "important");
  }

  doc.querySelectorAll("[data-eid]").forEach((el) => el.removeAttribute("data-eid"));
  doc.querySelectorAll("[data-editor-injected]").forEach((el) => el.remove());

  return { html: "<!DOCTYPE html>\n" + doc.documentElement.outerHTML, stale };
}
