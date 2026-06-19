"use client";

import { ChangeEvent, useEffect, useRef, useState } from "react";
import { fileToDataUrl, imageAccept } from "@/core/assets/imageDataUrl";
import { downloadHtml } from "@/core/export/downloadHtml";
import { downloadJson } from "@/core/export/downloadJson";
import { clearDraft } from "@/core/persistence/draft";
import { parseConstrainedHtml } from "@/core/import/parseConstrainedHtml";
import { renderDeckHtml } from "@/core/render/renderDeckHtml";
import { useDeckStore } from "@/store/useDeckStore";
import { useSourceHtmlStore } from "@/store/useSourceHtmlStore";

export function Toolbar({ onPresent }: { onPresent: () => void }) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const imageInputRef = useRef<HTMLInputElement | null>(null);
  const exportRef = useRef<HTMLDivElement | null>(null);
  const [exportOpen, setExportOpen] = useState(false);
  const [exportProgress, setExportProgress] = useState<string | null>(null);

  const deck = useDeckStore((s) => s.deck);
  const currentSlideId = useDeckStore((s) => s.currentSlideId);
  const undo = useDeckStore((s) => s.undo);
  const redo = useDeckStore((s) => s.redo);
  const canUndo = useDeckStore((s) => s.history.past.length > 0);
  const canRedo = useDeckStore((s) => s.history.future.length > 0);
  const addImageElement = useDeckStore((s) => s.addImageElement);
  const addTextElement = useDeckStore((s) => s.addTextElement);
  const addShapeElement = useDeckStore((s) => s.addShapeElement);
  const addCodeElement = useDeckStore((s) => s.addCodeElement);
  const showGrid = useDeckStore((s) => s.showGrid);
  const toggleGrid = useDeckStore((s) => s.toggleGrid);
  const setAppMode = useDeckStore((s) => s.setAppMode);
  const setError = useDeckStore((s) => s.setError);
  const loadDeck = useDeckStore((s) => s.loadDeck);
  const loadSource = useSourceHtmlStore((s) => s.load);

  useEffect(() => {
    if (!exportOpen) return;
    function handleClick(e: MouseEvent) {
      if (exportRef.current && !exportRef.current.contains(e.target as Node)) {
        setExportOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [exportOpen]);

  async function handleImport(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    try { loadDeck(parseConstrainedHtml(await file.text())); }
    catch (error) { setError(error instanceof Error ? error.message : "导入 HTML 失败。"); }
  }

  async function handleImageImport(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    try { addImageElement(await fileToDataUrl(file), file.name, file.type); }
    catch (error) { setError(error instanceof Error ? error.message : "导入图片失败。"); }
  }

  async function handleExportPng(all: boolean) {
    try {
      setExportProgress("渲染中…");
      setExportOpen(false);
      if (all) {
        const { exportDeckAsPng } = await import("@/core/export/exportPng");
        await exportDeckAsPng(deck, (cur, total) => setExportProgress(`${cur}/${total}`));
      } else {
        const slide = deck.slides.find((s) => s.id === currentSlideId);
        if (slide) {
          const { exportSlideAsPng } = await import("@/core/export/exportPng");
          await exportSlideAsPng(slide, deck, "slide.png");
        }
      }
    } catch { setError("PNG 导出失败。"); }
    finally { setExportProgress(null); }
  }

  async function handleExportPdf() {
    try {
      setExportProgress("生成 PDF…");
      setExportOpen(false);
      const { exportDeckAsPdf } = await import("@/core/export/exportPdf");
      await exportDeckAsPdf(deck, (cur, total) => setExportProgress(`PDF ${cur}/${total}`));
    } catch { setError("PDF 导出失败。"); }
    finally { setExportProgress(null); }
  }

  function handleSourcePreview() {
    loadSource(renderDeckHtml(deck), `${deck.title || "preview"}.html`);
    setAppMode("source-html");
    setExportOpen(false);
  }

  function closeAndRun(fn: () => void) {
    setExportOpen(false);
    fn();
  }

  return (
    <nav className="toolbar" aria-label="编辑工具栏">
      {/* ── 历史 ── */}
      <div className="tb-group">
        <button type="button" className="tb-btn" onClick={undo} disabled={!canUndo} title="撤销 ⌘Z">↩</button>
        <button type="button" className="tb-btn" onClick={redo} disabled={!canRedo} title="重做 ⌘⇧Z">↪</button>
      </div>

      <span className="tb-sep" />

      {/* ── 插入 ── */}
      <div className="tb-group">
        <span className="tb-label">插入</span>
        <button type="button" className="tb-btn" onClick={addTextElement} title="插入文本">文本</button>
        <button type="button" className="tb-btn" onClick={() => addShapeElement("rect")} title="插入矩形">矩形</button>
        <button type="button" className="tb-btn" onClick={() => addShapeElement("ellipse")} title="插入椭圆">椭圆</button>
        <button type="button" className="tb-btn" onClick={() => addCodeElement()} title="插入代码块">代码</button>
        <button type="button" className="tb-btn" onClick={() => imageInputRef.current?.click()} title="插入图片">图片</button>
      </div>

      <span className="tb-sep" />

      {/* ── 视图 ── */}
      <button type="button" className={`tb-btn tb-btn-icon${showGrid ? " is-active" : ""}`}
        onClick={toggleGrid} title="切换网格">⊞</button>

      {/* ── 右侧操作 ── */}
      <div className="tb-end">
        <button type="button" className="tb-btn" onClick={handleSourcePreview} title="在 Source HTML 模式预览">
          预览 HTML
        </button>
        <button type="button" className="tb-btn tb-btn-present" onClick={onPresent}>
          演示 ▶
        </button>

        <div className="tb-export-wrap" ref={exportRef}>
          <button type="button" className="tb-btn tb-btn-primary"
            onClick={() => setExportOpen((v) => !v)} disabled={!!exportProgress}>
            {exportProgress ?? "导出 ▾"}
          </button>
          {exportOpen && (
            <div className="tb-export-menu" role="menu">
              <button type="button" role="menuitem" onClick={() => closeAndRun(() => downloadHtml(deck))}>
                导出 HTML
              </button>
              <button type="button" role="menuitem" onClick={() => handleExportPdf()}>
                导出 PDF
              </button>
              <button type="button" role="menuitem" onClick={() => handleExportPng(false)}>
                导出 PNG（当前页）
              </button>
              <button type="button" role="menuitem" onClick={() => handleExportPng(true)}>
                导出全部 PNG（zip）
              </button>
              <div className="tb-menu-divider" />
              <button type="button" role="menuitem"
                onClick={() => closeAndRun(() => { clearDraft(); downloadJson(deck); })}>
                保存 JSON
              </button>
              <button type="button" role="menuitem" onClick={() => { inputRef.current?.click(); setExportOpen(false); }}>
                导入 HTML
              </button>
              <button type="button" role="menuitem" onClick={() => { imageInputRef.current?.click(); setExportOpen(false); }}>
                导入图片
              </button>
            </div>
          )}
        </div>
      </div>

      <input ref={inputRef} type="file" accept=".html,text/html" aria-label="选择 HTML 文件"
        tabIndex={-1} className="visually-hidden" onChange={handleImport} />
      <input ref={imageInputRef} type="file" accept={imageAccept} aria-label="选择图片文件"
        tabIndex={-1} className="visually-hidden" onChange={handleImageImport} />
    </nav>
  );
}
