"use client";

import { useSourceHtmlStore } from "@/store/useSourceHtmlStore";
import { useDeckStore } from "@/store/useDeckStore";
import { SlideThumbList } from "./SlideThumbList";
import { SourceHtmlPreview } from "./SourceHtmlPreview";
import { TextEditPanel } from "./TextEditPanel";
import { ThemeVarPanel } from "./ThemeVarPanel";

export function SourceHtmlShell() {
  const fileName = useSourceHtmlStore((s) => s.fileName);
  const serialize = useSourceHtmlStore((s) => s.serialize);
  const reset = useSourceHtmlStore((s) => s.reset);
  const setAppMode = useDeckStore((s) => s.setAppMode);

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
        <button type="button" className="source-html-export" onClick={handleExport}>导出 HTML</button>
      </header>
      <div className="source-html-workspace">
        <SlideThumbList />
        <SourceHtmlPreview />
        <aside className="source-html-sidebar">
          <div className="panel-heading">文本编辑</div>
          <TextEditPanel />
          <ThemeVarPanel />
        </aside>
      </div>
    </main>
  );
}
