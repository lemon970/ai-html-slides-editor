"use client";

import { useEffect, useState } from "react";
import { SlideNavigator } from "./SlideNavigator";
import { SlideViewport } from "./SlideViewport";
import { PropertyPanel } from "./PropertyPanel";
import { Toolbar } from "./Toolbar";
import { ContextBar } from "./ContextBar";
import { LayersPanel } from "./LayersPanel";
import { PresentationMode } from "./PresentationMode";
import { editorShortcutFromKey, isEditableTarget } from "@/core/keyboard/editorShortcuts";
import { sortElements } from "@/core/ops/deckOperations";
import { useDeckStore } from "@/store/useDeckStore";

export function AppShell() {
  const title = useDeckStore((state) => state.deck.title);
  const deck = useDeckStore((state) => state.deck);
  const currentSlideId = useDeckStore((state) => state.currentSlideId);
  const error = useDeckStore((state) => state.error);
  const clearSelection = useDeckStore((state) => state.clearSelection);
  const deleteSelectedElements = useDeckStore((state) => state.deleteSelectedElements);
  const copySelectedElements = useDeckStore((state) => state.copySelectedElements);
  const pasteElements = useDeckStore((state) => state.pasteElements);
  const duplicateSelectedElements = useDeckStore((state) => state.duplicateSelectedElements);
  const groupSelectedElements = useDeckStore((state) => state.groupSelectedElements);
  const ungroupSelectedElements = useDeckStore((state) => state.ungroupSelectedElements);
  const nudgeSelectedElements = useDeckStore((state) => state.nudgeSelectedElements);
  const [presenting, setPresenting] = useState(false);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (isEditableTarget(event.target)) return;
      const shortcut = editorShortcutFromKey(event);
      if (!shortcut) return;
      event.preventDefault();
      if (shortcut.type === "clear-selection") { clearSelection(); return; }
      if (shortcut.type === "delete") { deleteSelectedElements(); return; }
      if (shortcut.type === "copy") { copySelectedElements(); return; }
      if (shortcut.type === "paste") { pasteElements(); return; }
      if (shortcut.type === "duplicate") { duplicateSelectedElements(); return; }
      if (shortcut.type === "group") { groupSelectedElements(); return; }
      if (shortcut.type === "ungroup") { ungroupSelectedElements(); return; }
      if (shortcut.type === "cycle-element") {
        const state = useDeckStore.getState();
        const slide = state.deck.slides.find((s) => s.id === state.currentSlideId);
        if (!slide) return;
        const candidates = sortElements(slide.elements).filter((e) => !e.hidden && !e.locked);
        if (candidates.length === 0) return;
        const idx = candidates.findIndex((e) => e.id === state.selectedElementId);
        state.selectElement(candidates[(idx + shortcut.direction + candidates.length) % candidates.length].id);
        return;
      }
      nudgeSelectedElements(shortcut.delta);
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [
    clearSelection, copySelectedElements, deleteSelectedElements,
    duplicateSelectedElements, groupSelectedElements, nudgeSelectedElements,
    pasteElements, ungroupSelectedElements,
  ]);

  useEffect(() => {
    function onBeforeUnload(e: BeforeUnloadEvent) {
      const state = useDeckStore.getState();
      if (state.history.past.length > 0) {
        e.preventDefault();
      }
    }
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, []);

  return (
    <main className="editor-shell">
      <header className="editor-topbar">
        <div className="app-brand">
          <span className="app-kicker">AI Slides</span>
          <h1 className="app-title">{title}</h1>
        </div>
        <Toolbar onPresent={() => setPresenting(true)} />
      </header>
      <ContextBar />
      {error ? <div className="editor-error">{error}</div> : null}
      <section className="editor-workspace">
        <SlideNavigator />
        <SlideViewport />
        <aside className="right-sidebar">
          <LayersPanel />
          <PropertyPanel />
        </aside>
      </section>
      {presenting && (
        <PresentationMode
          deck={deck}
          startSlideId={currentSlideId}
          onClose={() => setPresenting(false)}
        />
      )}
    </main>
  );
}


