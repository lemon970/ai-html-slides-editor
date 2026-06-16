"use client";

import { useEffect } from "react";
import { SlideNavigator } from "./SlideNavigator";
import { SlideViewport } from "./SlideViewport";
import { PropertyPanel } from "./PropertyPanel";
import { Toolbar } from "./Toolbar";
import { LayersPanel } from "./LayersPanel";
import { editorShortcutFromKey, isEditableTarget } from "@/core/keyboard/editorShortcuts";
import { useDeckStore } from "@/store/useDeckStore";

export function AppShell() {
  const title = useDeckStore((state) => state.deck.title);
  const error = useDeckStore((state) => state.error);
  const clearSelection = useDeckStore((state) => state.clearSelection);
  const deleteSelectedElements = useDeckStore((state) => state.deleteSelectedElements);
  const copySelectedElements = useDeckStore((state) => state.copySelectedElements);
  const pasteElements = useDeckStore((state) => state.pasteElements);
  const duplicateSelectedElements = useDeckStore((state) => state.duplicateSelectedElements);
  const groupSelectedElements = useDeckStore((state) => state.groupSelectedElements);
  const ungroupSelectedElements = useDeckStore((state) => state.ungroupSelectedElements);
  const nudgeSelectedElements = useDeckStore((state) => state.nudgeSelectedElements);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (isEditableTarget(event.target)) {
        return;
      }

      const shortcut = editorShortcutFromKey(event);
      if (!shortcut) {
        return;
      }

      event.preventDefault();
      if (shortcut.type === "clear-selection") {
        clearSelection();
        return;
      }
      if (shortcut.type === "delete") {
        deleteSelectedElements();
        return;
      }
      if (shortcut.type === "copy") {
        copySelectedElements();
        return;
      }
      if (shortcut.type === "paste") {
        pasteElements();
        return;
      }
      if (shortcut.type === "duplicate") {
        duplicateSelectedElements();
        return;
      }
      if (shortcut.type === "group") {
        groupSelectedElements();
        return;
      }
      if (shortcut.type === "ungroup") {
        ungroupSelectedElements();
        return;
      }
      nudgeSelectedElements(shortcut.delta);
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [
    clearSelection,
    copySelectedElements,
    deleteSelectedElements,
    duplicateSelectedElements,
    groupSelectedElements,
    nudgeSelectedElements,
    pasteElements,
    ungroupSelectedElements,
  ]);

  return (
    <main className="editor-shell">
      <header className="editor-topbar">
        <div>
          <div className="app-kicker">AI HTML Slides Editor</div>
          <h1>{title}</h1>
        </div>
        <Toolbar />
      </header>
      {error ? <div className="editor-error">{error}</div> : null}
      <section className="editor-workspace">
        <SlideNavigator />
        <SlideViewport />
        <aside className="right-sidebar">
          <LayersPanel />
          <PropertyPanel />
        </aside>
      </section>
    </main>
  );
}
