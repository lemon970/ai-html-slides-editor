"use client";

import { ChangeEvent, useRef } from "react";
import { downloadHtml } from "@/core/export/downloadHtml";
import { downloadJson } from "@/core/export/downloadJson";
import { parseConstrainedHtml } from "@/core/import/parseConstrainedHtml";
import { selectedGroupId } from "@/core/selection/groupOperations";
import { useDeckStore } from "@/store/useDeckStore";

export function Toolbar() {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const deck = useDeckStore((state) => state.deck);
  const currentSlideId = useDeckStore((state) => state.currentSlideId);
  const selectedElementIds = useDeckStore((state) => state.selectedElementIds);
  const loadDeck = useDeckStore((state) => state.loadDeck);
  const undo = useDeckStore((state) => state.undo);
  const redo = useDeckStore((state) => state.redo);
  const groupSelectedElements = useDeckStore((state) => state.groupSelectedElements);
  const ungroupSelectedElements = useDeckStore((state) => state.ungroupSelectedElements);
  const deleteSelectedElements = useDeckStore((state) => state.deleteSelectedElements);
  const duplicateSelectedElements = useDeckStore((state) => state.duplicateSelectedElements);
  const setError = useDeckStore((state) => state.setError);
  const canUndo = useDeckStore((state) => state.history.past.length > 0);
  const canRedo = useDeckStore((state) => state.history.future.length > 0);
  const currentSlide = deck.slides.find((slide) => slide.id === currentSlideId);
  const activeGroupId = currentSlide
    ? selectedGroupId(currentSlide.elements, selectedElementIds)
    : null;

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
      <button
        type="button"
        onClick={groupSelectedElements}
        disabled={selectedElementIds.length < 2}
      >
        组合
      </button>
      <button type="button" onClick={ungroupSelectedElements} disabled={!activeGroupId}>
        取消组合
      </button>
      <button
        type="button"
        onClick={duplicateSelectedElements}
        disabled={selectedElementIds.length === 0}
      >
        复制
      </button>
      <button
        type="button"
        onClick={deleteSelectedElements}
        disabled={selectedElementIds.length === 0}
      >
        删除
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
