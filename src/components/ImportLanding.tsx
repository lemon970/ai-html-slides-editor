"use client";

import { useRef, useState, useEffect, type DragEvent, type ChangeEvent } from "react";
import { detectEditorMode } from "@/core/import/detectSourceHtmlMode";
import { parseConstrainedHtml } from "@/core/import/parseConstrainedHtml";
import { PROMPT_TO_JSON_SCHEMA, PROMPT_TO_SOURCE_HTML } from "@/core/import/convertPrompts";
import { deckSchema } from "@/core/schema/deck";
import { loadDraft, clearDraft } from "@/core/persistence/draft";
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

function relativeTime(iso: string) {
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (diff < 60) return `${diff} 秒前`;
  if (diff < 3600) return `${Math.floor(diff / 60)} 分钟前`;
  return `${Math.floor(diff / 3600)} 小时前`;
}

export function ImportLanding() {
  const loadDeck = useDeckStore((s) => s.loadDeck);
  const setAppMode = useDeckStore((s) => s.setAppMode);
  const loadSource = useSourceHtmlStore((s) => s.load);
  const [dragging, setDragging] = useState(false);
  const [showPrompt, setShowPrompt] = useState(false);
  const [copied, setCopied] = useState(false);
  const [pending, setPending] = useState<{ html: string; name: string } | null>(null);
  const [showConvert, setShowConvert] = useState(false);
  const [convertTab, setConvertTab] = useState<"json" | "source">("json");
  const [copiedConvert, setCopiedConvert] = useState(false);
  const [draft, setDraft] = useState<ReturnType<typeof loadDraft>>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const jsonInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setDraft(loadDraft());
  }, []);

  async function handleHtml(html: string, fileName: string) {
    const mode = detectEditorMode(html);
    if (mode === "json") {
      loadDeck(parseConstrainedHtml(html));
    } else if (mode === "source-html") {
      loadSource(html, fileName);
      setAppMode("source-html");
    } else {
      setPending({ html, name: fileName });
      setShowConvert(true);
    }
  }

  function copyConvert() {
    const prompt = convertTab === "json" ? PROMPT_TO_JSON_SCHEMA : PROMPT_TO_SOURCE_HTML;
    const text = pending ? `${prompt}\n\n---\n以下是需要转换的 HTML 文件：\n\n${pending.html}` : prompt;
    navigator.clipboard.writeText(text);
    setCopiedConvert(true);
    setTimeout(() => setCopiedConvert(false), 2000);
  }

  async function handleFile(file: File) {
    const html = await file.text();
    handleHtml(html, file.name);
  }

  async function handleJsonFile(file: File) {
    try {
      const text = await file.text();
      const result = deckSchema.safeParse(JSON.parse(text));
      if (!result.success) {
        alert("JSON 格式不匹配，无法导入。");
        return;
      }
      loadDeck(result.data);
    } catch {
      alert("读取 JSON 文件失败。");
    }
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

  function onJsonChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) handleJsonFile(file);
    e.target.value = "";
  }

  function copyPrompt() {
    navigator.clipboard.writeText(PROMPT_TEMPLATE);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="import-landing">
      {draft && (
        <div className="draft-banner">
          <span>发现草稿（保存于 {relativeTime(draft.savedAt)}）</span>
          <div className="draft-banner-actions">
            <button
              type="button"
              className="import-btn-primary"
              onClick={() => { loadDeck(draft.deck); }}
            >
              恢复
            </button>
            <button
              type="button"
              className="import-btn-secondary"
              onClick={() => { clearDraft(); setDraft(null); }}
            >
              忽略
            </button>
          </div>
        </div>
      )}
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
          <button type="button" className="import-btn-secondary" onClick={() => jsonInputRef.current?.click()}>
            打开 JSON
          </button>
          <button type="button" className="import-btn-primary" onClick={() => setShowPrompt(true)}>
            用 AI 新建 →
          </button>
        </div>
        <input ref={jsonInputRef} type="file" accept=".json,application/json" className="visually-hidden" onChange={onJsonChange} />

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

        {showConvert && pending && (
          <div className="prompt-modal-overlay" onClick={() => setShowConvert(false)}>
            <div className="prompt-modal" onClick={(e) => e.stopPropagation()}>
              <div className="prompt-modal-header">
                <span>格式不匹配 — 用 AI 转换后重新导入</span>
                <button type="button" onClick={() => setShowConvert(false)}>✕</button>
              </div>
              <p className="prompt-modal-desc">
                此文件格式无法直接完整编辑。复制提示词，连同原 HTML 一起发给 AI，
                转换后重新导入即可获得完整拖拽、图层等编辑能力。
              </p>
              <div className="convert-tabs">
                <button
                  type="button"
                  className={`convert-tab${convertTab === "json" ? " active" : ""}`}
                  onClick={() => setConvertTab("json")}
                >
                  转为 JSON Schema（完整编辑）
                </button>
                <button
                  type="button"
                  className={`convert-tab${convertTab === "source" ? " active" : ""}`}
                  onClick={() => setConvertTab("source")}
                >
                  转为 Source HTML（保留特效）
                </button>
              </div>
              <pre className="prompt-modal-code">
                {convertTab === "json" ? PROMPT_TO_JSON_SCHEMA : PROMPT_TO_SOURCE_HTML}
              </pre>
              <div className="convert-actions">
                <button type="button" className="import-btn-primary" onClick={copyConvert}>
                  {copiedConvert ? "已复制！" : "复制提示词"}
                </button>
                <button
                  type="button"
                  className="import-btn-secondary"
                  onClick={() => {
                    loadSource(pending.html, pending.name);
                    setAppMode("source-html");
                    setShowConvert(false);
                  }}
                >
                  先以预览模式打开
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
