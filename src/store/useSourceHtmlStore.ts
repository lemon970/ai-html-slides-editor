"use client";

import { create } from "zustand";

// Module-level callback so iframe can receive updates without React state round-trips
let _iframeNotify: ((msg: object) => void) | null = null;
export function registerIframeNotify(fn: (msg: object) => void) { _iframeNotify = fn; }
export function unregisterIframeNotify() { _iframeNotify = null; }

function notify(msg: object) { _iframeNotify?.(msg); }

function parseCssColorVars(html: string): Record<string, string> {
  const match = html.match(/:root\s*\{([^}]{0,3000})\}/);
  if (!match) return {};
  return Object.fromEntries(
    [...match[1].matchAll(/(--[a-z][a-z0-9-]*)\s*:\s*([^;]+)/g)]
      .map((m) => [m[1].trim(), m[2].trim()] as [string, string])
      .filter(([, v]) => v.startsWith("#") || v.startsWith("rgb")),
  );
}

function detectSlides(doc: Document): HTMLElement[] {
  for (const sel of ["section.slide", ".slide", "[data-slide]", "section"]) {
    const els = [...doc.querySelectorAll<HTMLElement>(sel)];
    if (els.length > 0) return els;
  }
  return [];
}

function injectListener(html: string): string {
  const script = `<script>(function(){window.addEventListener('message',function(e){if(!e.data||e.data.__sls!==1)return;var d=e.data;if(d.type==='navigate'&&window.__goTo)window.__goTo(d.index);if(d.type==='updateText'){var slides=document.querySelectorAll('section.slide,.slide,[data-slide]');var slide=slides[d.si];if(!slide)return;var node=slide;for(var i=0;i<d.path.length;i++){var c=node.children[d.path[i]];if(!c)return;node=c;}node.textContent=d.value;}if(d.type==='updateVar'){document.documentElement.style.setProperty(d.name,d.value);}});})();<\/script>`;
  return html.includes("</body>") ? html.replace("</body>", script + "</body>") : html + script;
}

type SourceHtmlStore = {
  fileName: string;
  injectedHtml: string;
  doc: Document | null;
  slideElements: HTMLElement[];
  currentIndex: number;
  cssVars: Record<string, string>;
  load: (html: string, fileName: string) => void;
  setCurrentIndex: (i: number) => void;
  updateText: (slideIndex: number, path: number[], value: string) => void;
  updateCssVar: (name: string, value: string) => void;
  serialize: () => string;
  reset: () => void;
};

export const useSourceHtmlStore = create<SourceHtmlStore>()((set, get) => ({
  fileName: "",
  injectedHtml: "",
  doc: null,
  slideElements: [],
  currentIndex: 0,
  cssVars: {},

  load: (html, fileName) => {
    const injectedHtml = injectListener(html);
    const doc =
      typeof window !== "undefined" ? new DOMParser().parseFromString(html, "text/html") : null;
    const slideElements = doc ? detectSlides(doc) : [];
    const cssVars = parseCssColorVars(html);
    set({ fileName, injectedHtml, doc, slideElements, currentIndex: 0, cssVars });
  },

  setCurrentIndex: (i) => {
    set({ currentIndex: i });
    notify({ __sls: 1, type: "navigate", index: i });
  },

  updateText: (slideIndex, path, value) => {
    const { doc, slideElements } = get();
    if (!doc) return;
    const slide = slideElements[slideIndex];
    if (!slide) return;
    let node: Element = slide;
    for (const idx of path) {
      const child = node.children[idx];
      if (!child) return;
      node = child;
    }
    node.textContent = value;
    notify({ __sls: 1, type: "updateText", si: slideIndex, path, value });
  },

  updateCssVar: (name, value) => {
    const { doc } = get();
    if (!doc) return;
    const re = new RegExp(`(${name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\s*:\\s*)[^;]+`);
    for (const el of doc.querySelectorAll("style")) {
      const t = el.textContent ?? "";
      if (re.test(t)) { el.textContent = t.replace(re, `$1${value}`); break; }
    }
    set((s) => ({ cssVars: { ...s.cssVars, [name]: value } }));
    notify({ __sls: 1, type: "updateVar", name, value });
  },

  serialize: () => {
    const { doc } = get();
    return doc ? "<!DOCTYPE html>\n" + doc.documentElement.outerHTML : "";
  },

  reset: () => set({ fileName: "", injectedHtml: "", doc: null, slideElements: [], currentIndex: 0, cssVars: {} }),
}));
