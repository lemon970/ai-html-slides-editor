"use client";

import { SlideNavigator } from "./SlideNavigator";
import { SlideViewport } from "./SlideViewport";
import { PropertyPanel } from "./PropertyPanel";
import { Toolbar } from "./Toolbar";
import { useDeckStore } from "@/store/useDeckStore";

export function AppShell() {
  const title = useDeckStore((state) => state.deck.title);
  const error = useDeckStore((state) => state.error);

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
        <PropertyPanel />
      </section>
    </main>
  );
}
