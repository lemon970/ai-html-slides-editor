"use client";

import { ImportLanding } from "@/components/ImportLanding";
import { AppShell } from "@/components/editor/AppShell";
import { SourceHtmlShell } from "@/components/source-html/SourceHtmlShell";
import { useDeckStore } from "@/store/useDeckStore";

export default function Home() {
  const appMode = useDeckStore((s) => s.appMode);
  if (appMode === "source-html") return <SourceHtmlShell />;
  if (appMode === "json") return <AppShell />;
  return <ImportLanding />;
}
