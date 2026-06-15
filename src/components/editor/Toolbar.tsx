"use client";

import { ChangeEvent, useRef } from "react";
import { parseConstrainedHtml } from "@/core/import/parseConstrainedHtml";
import { downloadHtml } from "@/core/export/downloadHtml";
import { downloadJson } from "@/core/export/downloadJson";
import { useDeckStore } from "@/store/useDeckStore";

export function Toolbar() {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const deck = useDeckStore((state) => state.deck);
  const loadDeck = useDeckStore((state) => state.loadDeck);
  const undo = useDeckStore((state) => state.undo);
  const redo = useDeckStore((state) => state.redo);
  const setError = useDeckStore((state) => state.setError);
  const canUndo = useDeckStore((state) => state.history.past.length > 0);
  const canRedo = useDeckStore((state) => state.history.future.length > 0);

  async function handleImport(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) {
      return;
    }

    try {
      const html = await file.text();
      loadDeck(parseConstrainedHtml(html));
    } catch (error) {
      setError(error instanceof Error ? error.message : "导入 HTML 失败。");
    }
  }

  return (
    <div className="toolbar" aria-label="Editor actions">
      <button type="button" onClick={undo} disabled={!canUndo}>
        撤销
      </button>
      <button type="button" onClick={redo} disabled={!canRedo}>
        重做
      </button>
      <span className="toolbar-divider" />
      <button type="button" onClick={() => inputRef.current?.click()}>
        导入 HTML
      </button>
      <button type="button" onClick={() => downloadJson(deck)}>
        保存 JSON
      </button>
      <button type="button" className="primary-button" onClick={() => downloadHtml(deck)}>
        导出 HTML
      </button>
      <input
        ref={inputRef}
        type="file"
        accept=".html,text/html"
        className="visually-hidden"
        onChange={handleImport}
      />
    </div>
  );
}
