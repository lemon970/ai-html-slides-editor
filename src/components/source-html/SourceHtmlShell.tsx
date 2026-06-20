"use client";

import { useEffect, useRef, useState } from "react";
import { useSourceHtmlStore, notifyIframe, nextPatchId } from "@/store/useSourceHtmlStore";
import { useDeckStore } from "@/store/useDeckStore";
import { SlideThumbList } from "./SlideThumbList";
import { SourceHtmlPreview } from "./SourceHtmlPreview";
import { runPreflight, type PreflightResult } from "@/core/export/sourcePreflight";
import type { HidePatch, Patch } from "@/core/patches/patches";

type ActiveEdit = {
  uid: string | null; htmlId: string | null;
  path: { slideIdx: number; indices: number[] } | null;
  text: string; tag: string;
  rect: { top: number; left: number; width: number; height: number };
};

type ImageEdit = {
  uid: string | null; htmlId: string | null;
  path: { slideIdx: number; indices: number[] } | null;
  rect: { top: number; left: number; width: number; height: number };
};

const LEVEL_ICON: Record<string, string> = { error: "✕", warning: "⚠", info: "ℹ" };

export function SourceHtmlShell() {
  const fileName = useSourceHtmlStore((s) => s.fileName);
  const notice = useSourceHtmlStore((s) => s.notice);
  const patches = useSourceHtmlStore((s) => s.patches);
  const sourceHtml = useSourceHtmlStore((s) => s.sourceHtml);
  const reset = useSourceHtmlStore((s) => s.reset);
  const appendPatch = useSourceHtmlStore((s) => s.appendPatch);
  const removePatch = useSourceHtmlStore((s) => s.removePatch);
  const setAppMode = useDeckStore((s) => s.setAppMode);

  const [editMode, setEditMode] = useState<"preview" | "revise">("preview");
  const [activeEdit, setActiveEdit] = useState<ActiveEdit | null>(null);
  const [imageEdit, setImageEdit] = useState<ImageEdit | null>(null);
  const [preflight, setPreflight] = useState<PreflightResult | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    notifyIframe({ __sls: 1, type: "setEditMode", enabled: editMode === "revise" });
    if (editMode === "preview") { setActiveEdit(null); setImageEdit(null); }
  }, [editMode]);

  useEffect(() => {
    function handleMessage(e: MessageEvent) {
      const d = e.data;
      if (!d || d.__sls !== 1) return;
      const fr = document.querySelector<HTMLIFrameElement>(".source-html-preview")?.getBoundingClientRect();
      const toScreen = (r: { top: number; left: number; width: number; height: number }) => ({
        top: (fr?.top ?? 0) + r.top, left: (fr?.left ?? 0) + r.left, width: r.width, height: r.height,
      });
      if (d.type === "imageClicked") {
        setActiveEdit(null);
        setImageEdit({ uid: d.eid ?? null, htmlId: d.htmlId ?? null, path: d.path ?? null, rect: toScreen(d.rect) });
        return;
      }
      if (d.type === "elementClicked") {
        setImageEdit(null);
        setActiveEdit({ uid: d.eid ?? null, htmlId: d.htmlId ?? null, path: d.path ?? null, text: d.text ?? "", tag: d.tag ?? "", rect: toScreen(d.rect) });
      }
    }
    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, []);

  useEffect(() => { if (activeEdit) textareaRef.current?.focus(); }, [activeEdit]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") { setActiveEdit(null); setImageEdit(null); setPreflight(null); }
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || (e.target as HTMLElement)?.isContentEditable) return;
      if (e.key === "e" || e.key === "E") setEditMode((m) => (m === "preview" ? "revise" : "preview"));
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  function submitEdit(value: string) {
    if (!activeEdit) return;
    if (value !== activeEdit.text && (activeEdit.uid || activeEdit.path)) {
      const patch: Patch = { id: nextPatchId(), type: "text", target: { uid: activeEdit.uid ?? "", ...(activeEdit.htmlId ? { htmlId: activeEdit.htmlId } : {}), ...(activeEdit.path ? { path: activeEdit.path } : {}) }, value };
      appendPatch(patch);
      notifyIframe({ __sls: 1, type: "applyTextPatch", eid: activeEdit.uid, value });
    }
    setActiveEdit(null);
  }

  function hideActiveEdit() {
    if (!activeEdit?.uid) return;
    const label = `${activeEdit.tag || "el"}: ${activeEdit.text.slice(0, 30)}`;
    const patch: HidePatch = { id: nextPatchId(), type: "hide", target: { uid: activeEdit.uid, ...(activeEdit.path ? { path: activeEdit.path } : {}) }, label };
    appendPatch(patch);
    notifyIframe({ __sls: 1, type: "applyHidePatch", eid: activeEdit.uid });
    setActiveEdit(null);
  }

  function hideImageEdit() {
    if (!imageEdit?.uid) return;
    const patch: HidePatch = { id: nextPatchId(), type: "hide", target: { uid: imageEdit.uid, ...(imageEdit.path ? { path: imageEdit.path } : {}) }, label: "img" };
    appendPatch(patch);
    notifyIframe({ __sls: 1, type: "applyHidePatch", eid: imageEdit.uid });
    setImageEdit(null);
  }

  function handleImgFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !imageEdit) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const dataUrl = ev.target?.result as string;
      if (!dataUrl || !dataUrl.startsWith("data:")) return;
      const patch: Patch = { id: nextPatchId(), type: "imgSrc", target: { uid: imageEdit.uid ?? "", ...(imageEdit.htmlId ? { htmlId: imageEdit.htmlId } : {}), ...(imageEdit.path ? { path: imageEdit.path } : {}) }, value: dataUrl };
      appendPatch(patch);
      notifyIframe({ __sls: 1, type: "applyImgPatch", eid: imageEdit.uid, value: dataUrl });
      setImageEdit(null);
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  }

  function handleExportClick() {
    setPreflight(runPreflight(sourceHtml, patches));
  }

  function confirmExport() {
    if (!preflight) return;
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([preflight.html], { type: "text/html" }));
    a.download = fileName || "slides.html";
    a.click();
    URL.revokeObjectURL(a.href);
    setPreflight(null);
  }

  function handleBack() {
    if (confirm("返回将丢失未导出的修改，确认吗？")) { reset(); setAppMode("idle"); }
  }

  const hiddenPatches = patches.filter((p): p is HidePatch => p.type === "hide");

  return (
    <main className="source-html-shell">
      <header className="source-html-topbar">
        <button type="button" className="source-html-back" onClick={handleBack}>← 返回</button>
        <span className="source-html-filename">{fileName}</span>
        <button type="button" className={`source-html-mode-btn${editMode === "revise" ? " is-active" : ""}`} onClick={() => setEditMode((m) => (m === "preview" ? "revise" : "preview"))} title="切换预览/修订模式 (E)">
          {editMode === "preview" ? "预览模式" : "修订模式"}
        </button>
        <button type="button" className="source-html-export" onClick={handleExportClick}>导出 HTML</button>
      </header>
      <div className="source-html-notice">{notice}</div>
      <div className="source-html-workspace">
        <SlideThumbList />
        <SourceHtmlPreview />
        <aside className="source-html-sidebar">
          <div className="panel-hint">开启修订模式后，点击文字直接编辑。</div>
          {hiddenPatches.length > 0 && (
            <div className="hidden-items-section">
              <div className="panel-heading">已隐藏 ({hiddenPatches.length})</div>
              {hiddenPatches.map((p) => (
                <div key={p.id} className="hidden-item-row">
                  <span className="hidden-item-label">{p.label ?? p.id}</span>
                  <button type="button" className="hidden-item-restore" onClick={() => removePatch(p.id)}>恢复</button>
                </div>
              ))}
            </div>
          )}
        </aside>
      </div>

      {activeEdit && (
        <>
          <div className="text-edit-toolbar" style={{ position: "fixed", zIndex: 10000, top: activeEdit.rect.top - 28, left: activeEdit.rect.left }}>
            <button type="button" className="hide-element-btn" onClick={hideActiveEdit}>隐藏</button>
          </div>
          <textarea ref={textareaRef} className="inline-edit-overlay" defaultValue={activeEdit.text}
            style={{ top: activeEdit.rect.top, left: activeEdit.rect.left, width: Math.max(activeEdit.rect.width, 160), minHeight: Math.max(activeEdit.rect.height, 32) }}
            onBlur={(e) => submitEdit(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Escape") { e.preventDefault(); setActiveEdit(null); }
              if ((e.metaKey || e.ctrlKey) && e.key === "Enter") { e.preventDefault(); submitEdit(e.currentTarget.value); }
            }} />
        </>
      )}

      {imageEdit && (
        <div className="img-replace-overlay" style={{ top: imageEdit.rect.top, left: imageEdit.rect.left }}>
          <label className="img-replace-btn">
            选择图片
            <input type="file" accept="image/*" className="visually-hidden" onChange={handleImgFileChange} />
          </label>
          <button type="button" className="hide-element-btn" onClick={hideImageEdit}>隐藏</button>
          <button type="button" className="img-replace-cancel" onClick={() => setImageEdit(null)}>取消</button>
        </div>
      )}

      {preflight && (
        <div className="preflight-backdrop" onClick={() => setPreflight(null)}>
          <div className="preflight-modal" onClick={(e) => e.stopPropagation()}>
            <div className="preflight-header">
              <span>导出检查</span>
              <button type="button" onClick={() => setPreflight(null)}>✕</button>
            </div>
            <div className="preflight-body">
              {preflight.items.length === 0 ? (
                <div className="preflight-ok">✓ 未发现风险，可安全导出</div>
              ) : (
                preflight.items.map((item, i) => (
                  <div key={i} className={`preflight-item preflight-${item.level}`}>
                    <span className="preflight-icon">{LEVEL_ICON[item.level]}</span>
                    {item.message}
                  </div>
                ))
              )}
            </div>
            <div className="preflight-footer">
              <button type="button" className="source-html-mode-btn" onClick={() => setPreflight(null)}>取消</button>
              <button type="button" className="source-html-export" disabled={preflight.hasError} onClick={confirmExport}>
                {preflight.hasError ? "有错误，无法导出" : preflight.hasWarning ? "忽略警告并导出" : "确认导出"}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
