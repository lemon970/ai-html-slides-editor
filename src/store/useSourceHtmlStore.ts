"use client";

import { create } from "zustand";
import { annotateUids, detectSlides } from "@/core/annotation/uidAnnotation";
import { applyPatches, type Patch } from "@/core/patches/patches";

let _iframeNotify: ((msg: object) => void) | null = null;
export function registerIframeNotify(fn: (msg: object) => void) { _iframeNotify = fn; }
export function unregisterIframeNotify() { _iframeNotify = null; }
export function notifyIframe(msg: object) { _iframeNotify?.(msg); }

let _patchCounter = 0;
export function nextPatchId() { return "p" + (++_patchCounter).toString(36); }

function parseCssColorVars(html: string): Record<string, string> {
  const match = html.match(/:root\s*\{([^}]{0,3000})\}/);
  if (!match) return {};
  return Object.fromEntries(
    [...match[1].matchAll(/(--[a-z][a-z0-9-]*)\s*:\s*([^;]+)/g)]
      .map((m) => [m[1].trim(), m[2].trim()] as [string, string])
      .filter(([, v]) => v.startsWith("#") || v.startsWith("rgb")),
  );
}

function injectListener(html: string): string {
  const script = `<script data-editor-injected="1">(function(){
var __editMode=false;
var TT={H1:1,H2:1,H3:1,H4:1,H5:1,H6:1,P:1,LI:1,SPAN:1,A:1,BUTTON:1,TD:1,TH:1};
var EX={SCRIPT:1,STYLE:1,SVG:1,CANVAS:1,IMG:1,INPUT:1,TEXTAREA:1,VIDEO:1,SELECT:1};
function isTextTarget(el){var t=el&&el.tagName;if(!t||EX[t])return false;if(TT[t])return true;if(t==='DIV'){var ns=el.childNodes;for(var i=0;i<ns.length;i++)if(ns[i].nodeType===3&&ns[i].textContent.trim())return true;}return false;}
function buildPath(el){var slides=document.querySelectorAll('section.slide,.slide,[data-slide],section');var si=-1,se=null;for(var i=0;i<slides.length;i++){if(slides[i].contains(el)){si=i;se=slides[i];break;}}if(si===-1)return null;var idx=[],node=el;while(node!==se){var p=node.parentElement;if(!p)return null;idx.unshift(Array.prototype.indexOf.call(p.children,node));node=p;}return{slideIdx:si,indices:idx};}
window.addEventListener('message',function(e){
  var d=e.data;if(!d||d.__sls!==1||typeof d.type!=='string')return;
  if(d.type==='navigate'){var i=Number(d.index);if(!Number.isFinite(i)||i<0)return;var ss=document.querySelectorAll('section.slide,.slide,[data-slide]');var n=ss.length;if(!n)return;if(window.__goTo){window.__goTo(i);}else{var dk=document.getElementById('deck')||ss[0]&&ss[0].parentElement;if(dk)dk.style.transform='translateX('+(-(i*100/n))+'%)';}window.__currentSlideIndex=i;return;}
  if(d.type==='setEditMode'){__editMode=!!d.enabled;return;}
  if(d.type==='applyTextPatch'){var el=d.eid?document.querySelector('[data-eid="'+d.eid+'"]'):null;if(el)el.textContent=d.value;return;}
  if(d.type==='updateVar'){if(typeof d.name!=='string'||!/^--[a-z][a-z0-9-]*$/.test(d.name)||typeof d.value!=='string')return;document.documentElement.style.setProperty(d.name,d.value);return;}
});
document.addEventListener('click',function(e){
  if(!__editMode)return;
  var el=e.target;if(!el||!isTextTarget(el))return;
  e.preventDefault();e.stopImmediatePropagation();
  var path=buildPath(el);var r=el.getBoundingClientRect();
  window.parent.postMessage({__sls:1,type:'elementClicked',eid:el.getAttribute('data-eid')||null,htmlId:el.id||null,tag:el.tagName.toLowerCase(),text:el.textContent||'',path:path,rect:{top:r.top,left:r.left,width:r.width,height:r.height}},'*');
},true);
})();<\/script>`;
  return html.includes("</body>") ? html.replace("</body>", script + "</body>") : html + script;
}

type SourceHtmlStore = {
  fileName: string;
  notice: string | null;
  sourceHtml: string;
  injectedHtml: string;
  doc: Document | null;
  slideElements: HTMLElement[];
  currentIndex: number;
  cssVars: Record<string, string>;
  patches: Patch[];
  load: (html: string, fileName: string, notice?: string | null) => void;
  setCurrentIndex: (i: number) => void;
  appendPatch: (patch: Patch) => void;
  updateText: (slideIndex: number, pathIndices: number[], value: string) => void;
  updateCssVar: (name: string, value: string) => void;
  serialize: () => string;
  reset: () => void;
};

export const useSourceHtmlStore = create<SourceHtmlStore>()((set, get) => ({
  fileName: "",
  notice: null,
  sourceHtml: "",
  injectedHtml: "",
  doc: null,
  slideElements: [],
  currentIndex: 0,
  cssVars: {},
  patches: [],

  load: (html, fileName, notice = null) => {
    const doc =
      typeof window !== "undefined" ? new DOMParser().parseFromString(html, "text/html") : null;
    const slideElements = doc ? detectSlides(doc) : [];
    if (doc) annotateUids(slideElements);
    const cssVars = parseCssColorVars(html);
    const annotatedHtml = doc ? "<!DOCTYPE html>\n" + doc.documentElement.outerHTML : html;
    const injectedHtml = injectListener(annotatedHtml);
    set({ fileName, notice, sourceHtml: html, injectedHtml, doc, slideElements, currentIndex: 0, cssVars, patches: [] });
  },

  setCurrentIndex: (i) => {
    set({ currentIndex: i });
    notifyIframe({ __sls: 1, type: "navigate", index: i });
  },

  appendPatch: (patch) => set((s) => ({ patches: [...s.patches, patch] })),

  updateText: (slideIndex, pathIndices, value) => {
    const { slideElements } = get();
    let el: Element | null = slideElements[slideIndex] ?? null;
    for (const i of pathIndices) { if (!el) break; el = el.children[i] ?? null; }
    const eid = el?.getAttribute("data-eid") ?? null;
    const patch: Patch = {
      id: nextPatchId(),
      type: "text",
      target: { uid: eid ?? "", path: { slideIdx: slideIndex, indices: pathIndices } },
      value,
    };
    get().appendPatch(patch);
    if (eid) notifyIframe({ __sls: 1, type: "applyTextPatch", eid, value });
    if (el) el.textContent = value;
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
    notifyIframe({ __sls: 1, type: "updateVar", name, value });
  },

  serialize: () => {
    const { sourceHtml, patches } = get();
    return applyPatches(sourceHtml, patches).html;
  },

  reset: () => {
    _patchCounter = 0;
    set({ fileName: "", notice: null, sourceHtml: "", injectedHtml: "", doc: null, slideElements: [], currentIndex: 0, cssVars: {}, patches: [] });
  },
}));
