"use client";

import { useRef, useState, type DragEvent, type ChangeEvent } from "react";
import { detectEditorMode } from "@/core/import/detectSourceHtmlMode";
import { parseConstrainedHtml } from "@/core/import/parseConstrainedHtml";
import { useDeckStore } from "@/store/useDeckStore";
import { useSourceHtmlStore } from "@/store/useSourceHtmlStore";

const PROMPT_TEMPLATE = `请生成一份关于「[在此填写主题]」的 HTML 演示文稿。

严格遵循以下结构，不要偏离：

<!DOCTYPE html>
<html lang="zh-CN">
<head><meta charset="utf-8"><title>[标题]</title></head>
<body>
<div data-deck id="my-deck" style="--deck-width:1600;--deck-height:900">

  <section data-slide id="slide-1"
           style="width:1600px;height:900px;position:relative;background:#1e293b;">
    <div data-element data-element-id="title-1" data-type="text"
         style="position:absolute;left:200px;top:200px;width:900px;height:80px;
                font-size:56px;color:#f8fafc;font-weight:700;">
      标题文字
    </div>
    <div data-element data-element-id="body-1" data-type="text"
         style="position:absolute;left:200px;top:320px;width:900px;height:200px;
                font-size:24px;color:#cbd5e1;line-height:1.6;">
      正文内容
    </div>
  </section>

  <!-- 每增加一页，复制一个 section，修改 id 和内容 -->

</div>
<script>window.__DECK_JSON__ = null;</script>
</body>
</html>

约束：
- section 固定 1600×900px，背景写在 style
- 每个元素必须有 data-element、data-element-id（全局唯一）、data-type（text/image/shape）
- 坐标和尺寸用 px，position:absolute
- 不要加 JS 动画`;

export function ImportLanding() {
  const loadDeck = useDeckStore((s) => s.loadDeck);
  const setAppMode = useDeckStore((s) => s.setAppMode);
  const loadSource = useSourceHtmlStore((s) => s.load);
  const [dragging, setDragging] = useState(false);
  const [showPrompt, setShowPrompt] = useState(false);
  const [copied, setCopied] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleHtml(html: string, fileName: string) {
    const mode = detectEditorMode(html);
    if (mode === "json") {
      loadDeck(parseConstrainedHtml(html));
    } else {
      loadSource(html, fileName);
      setAppMode("source-html");
    }
  }

  async function handleFile(file: File) {
    const html = await file.text();
    handleHtml(html, file.name);
  }

  function onDrop(e: DragEvent) {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }

  function onFileChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
    e.target.value = "";
  }

  function copyPrompt() {
    navigator.clipboard.writeText(PROMPT_TEMPLATE);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="import-landing">
      <div className="import-landing-center">
        <div className="import-landing-logo">AI HTML Slides Editor</div>
        <h1 className="import-landing-title">导入 AI 生成的 HTML 演示文稿</h1>
        <p className="import-landing-sub">支持任意 AI HTML PPT · 自有结构 HTML · deck.json</p>

        <div
          className={`import-dropzone ${dragging ? "is-dragging" : ""}`}
          onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={onDrop}
          onClick={() => inputRef.current?.click()}
        >
          <span className="import-dropzone-icon">↑</span>
          <span>拖放 HTML 文件，或点击选择</span>
          <input ref={inputRef} type="file" accept=".html,text/html" className="visually-hidden" onChange={onFileChange} />
        </div>

        <div className="import-actions">
          <button type="button" className="import-btn-secondary" onClick={() => { loadDeck(useDeckStore.getState().deck); useDeckStore.getState().setAppMode("json"); }}>
            使用示例演示
          </button>
          <button type="button" className="import-btn-primary" onClick={() => setShowPrompt(true)}>
            用 AI 新建 →
          </button>
        </div>

        {showPrompt && (
          <div className="prompt-modal-overlay" onClick={() => setShowPrompt(false)}>
            <div className="prompt-modal" onClick={(e) => e.stopPropagation()}>
              <div className="prompt-modal-header">
                <span>AI 生成提示词模板</span>
                <button type="button" onClick={() => setShowPrompt(false)}>✕</button>
              </div>
              <p className="prompt-modal-desc">复制以下提示词，发给 Claude / ChatGPT，生成的 HTML 可直接导入完整编辑。</p>
              <pre className="prompt-modal-code">{PROMPT_TEMPLATE}</pre>
              <button type="button" className="import-btn-primary" onClick={copyPrompt}>
                {copied ? "已复制！" : "复制提示词"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
