"use client";

import { useState } from "react";
import { useSourceHtmlStore } from "@/store/useSourceHtmlStore";
import { useDeckStore } from "@/store/useDeckStore";
import { PROMPT_TO_JSON_SCHEMA } from "@/core/import/convertPrompts";
import { SlideThumbList } from "./SlideThumbList";
import { SourceHtmlPreview } from "./SourceHtmlPreview";
import { TextEditPanel } from "./TextEditPanel";
import { ThemeVarPanel } from "./ThemeVarPanel";

export function SourceHtmlShell() {
  const fileName = useSourceHtmlStore((s) => s.fileName);
  const serialize = useSourceHtmlStore((s) => s.serialize);
  const reset = useSourceHtmlStore((s) => s.reset);
  const setAppMode = useDeckStore((s) => s.setAppMode);
  const [showUpgrade, setShowUpgrade] = useState(false);
  const [copiedUpgrade, setCopiedUpgrade] = useState(false);

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

  function copyUpgrade() {
    const html = serialize();
    navigator.clipboard.writeText(`${PROMPT_TO_JSON_SCHEMA}\n\n---\n以下是需要转换的 HTML 文件：\n\n${html}`);
    setCopiedUpgrade(true);
    setTimeout(() => setCopiedUpgrade(false), 2000);
  }

  return (
    <main className="source-html-shell">
      <header className="source-html-topbar">
        <button type="button" className="source-html-back" onClick={handleBack}>← 返回</button>
        <span className="source-html-filename">{fileName}</span>
        <button type="button" className="source-html-upgrade" onClick={() => setShowUpgrade(true)}>升级为完整编辑</button>
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

      {showUpgrade && (
        <div className="prompt-modal-overlay" onClick={() => setShowUpgrade(false)}>
          <div className="prompt-modal" onClick={(e) => e.stopPropagation()}>
            <div className="prompt-modal-header">
              <span>升级为完整可编辑格式</span>
              <button type="button" onClick={() => setShowUpgrade(false)}>✕</button>
            </div>
            <p className="prompt-modal-desc">
              复制以下提示词，连同当前 HTML 文件一起发给 AI，
              转换后重新导入即可获得完整拖拽、图层、属性编辑等能力。
            </p>
            <pre className="prompt-modal-code">{PROMPT_TO_JSON_SCHEMA}</pre>
            <button type="button" className="import-btn-primary" onClick={copyUpgrade}>
              {copiedUpgrade ? "已复制！" : "复制提示词"}
            </button>
          </div>
        </div>
      )}
    </main>
  );
}
