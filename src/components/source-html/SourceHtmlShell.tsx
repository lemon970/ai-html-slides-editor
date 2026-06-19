"use client";

import { useEffect, useRef, useState } from "react";
import { useSourceHtmlStore, notifyIframe, nextPatchId } from "@/store/useSourceHtmlStore";
import { useDeckStore } from "@/store/useDeckStore";
import { SlideThumbList } from "./SlideThumbList";
import { SourceHtmlPreview } from "./SourceHtmlPreview";
import { TextEditPanel } from "./TextEditPanel";
import { ThemeVarPanel } from "./ThemeVarPanel";
import type { Patch } from "@/core/patches/patches";

type ActiveEdit = {
  uid: string | null;
  htmlId: string | null;
  path: { slideIdx: number; indices: number[] } | null;
  text: string;
  rect: { top: number; left: number; width: number; height: number };
};

export function SourceHtmlShell() {
  const fileName = useSourceHtmlStore((s) => s.fileName);
  const notice = useSourceHtmlStore((s) => s.notice);
  const serialize = useSourceHtmlStore((s) => s.serialize);
  const reset = useSourceHtmlStore((s) => s.reset);
  const appendPatch = useSourceHtmlStore((s) => s.appendPatch);
  const setAppMode = useDeckStore((s) => s.setAppMode);

  const [editMode, setEditMode] = useState<"preview" | "revise">("preview");
  const [activeEdit, setActiveEdit] = useState<ActiveEdit | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    notifyIframe({ __sls: 1, type: "setEditMode", enabled: editMode === "revise" });
    if (editMode === "preview") setActiveEdit(null);
  }, [editMode]);

  useEffect(() => {
    function handleMessage(e: MessageEvent) {
      const d = e.data;
      if (!d || d.__sls !== 1 || d.type !== "elementClicked") return;
      const iframeEl = document.querySelector<HTMLIFrameElement>(".source-html-preview");
      const fr = iframeEl?.getBoundingClientRect();
      setActiveEdit({
        uid: d.eid ?? null,
        htmlId: d.htmlId ?? null,
        path: d.path ?? null,
        text: d.text ?? "",
        rect: {
          top: (fr?.top ?? 0) + d.rect.top,
          left: (fr?.left ?? 0) + d.rect.left,
          width: d.rect.width,
          height: d.rect.height,
        },
      });
    }
    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, []);

  useEffect(() => {
    if (activeEdit) textareaRef.current?.focus();
  }, [activeEdit]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
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
      const patch: Patch = {
        id: nextPatchId(),
        type: "text",
        target: {
          uid: activeEdit.uid ?? "",
          ...(activeEdit.htmlId ? { htmlId: activeEdit.htmlId } : {}),
          ...(activeEdit.path ? { path: activeEdit.path } : {}),
        },
        value,
      };
      appendPatch(patch);
      notifyIframe({ __sls: 1, type: "applyTextPatch", eid: activeEdit.uid, value });
    }
    setActiveEdit(null);
  }

  function handleExport() {
    const html = serialize();
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([html], { type: "text/html" }));
    a.download = fileName || "slides.html";
    a.click();
    URL.revokeObjectURL(a.href);
  }

  function handleBack() {
    if (confirm("返回将丢失未导出的修改，确认吗？")) {
      reset();
      setAppMode("idle");
    }
  }

  return (
    <main className="source-html-shell">
      <header className="source-html-topbar">
        <button type="button" className="source-html-back" onClick={handleBack}>← 返回</button>
        <span className="source-html-filename">{fileName}</span>
        <button
          type="button"
          className={`source-html-mode-btn${editMode === "revise" ? " is-active" : ""}`}
          onClick={() => setEditMode((m) => (m === "preview" ? "revise" : "preview"))}
          title="切换预览/修订模式 (E)"
        >
          {editMode === "preview" ? "预览模式" : "修订模式"}
        </button>
        <button type="button" className="source-html-export" onClick={handleExport}>导出 HTML</button>
      </header>
      {notice ? <div className="source-html-notice">{notice}</div> : null}
      <div className="source-html-workspace">
        <SlideThumbList />
        <SourceHtmlPreview />
        <aside className="source-html-sidebar">
          <div className="panel-heading">文本编辑</div>
          <TextEditPanel />
          <ThemeVarPanel />
        </aside>
      </div>

      {activeEdit && (
        <textarea
          ref={textareaRef}
          className="inline-edit-overlay"
          defaultValue={activeEdit.text}
          style={{
            top: activeEdit.rect.top,
            left: activeEdit.rect.left,
            width: Math.max(activeEdit.rect.width, 160),
            minHeight: Math.max(activeEdit.rect.height, 32),
          }}
          onBlur={(e) => submitEdit(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Escape") { e.preventDefault(); setActiveEdit(null); }
            if ((e.metaKey || e.ctrlKey) && e.key === "Enter") { e.preventDefault(); submitEdit(e.currentTarget.value); }
          }}
        />
      )}
    </main>
  );
}
