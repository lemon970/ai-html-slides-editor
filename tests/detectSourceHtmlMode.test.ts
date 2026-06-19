import { describe, expect, it } from "vitest";
import { detectEditorMode } from "@/core/import/detectSourceHtmlMode";

describe("detectEditorMode", () => {
  it("prioritizes embedded deck JSON", () => {
    expect(detectEditorMode("<script>window.__DECK_JSON__ = {}</script>")).toBe("json");
  });

  it("detects constrained editable html only when deck, slide, and element markers exist", () => {
    expect(detectEditorMode("<div data-deck><section data-slide><div data-element></div></section></div>")).toBe("json");
  });

  it("falls back to source-html for slide frameworks that also use data-deck", () => {
    expect(detectEditorMode(`<main data-deck><section class="slide">Hello</section></main>`)).toBe("source-html");
  });

  it("returns unknown for unrelated html", () => {
    expect(detectEditorMode("<main>Hello</main>")).toBe("unknown");
  });
});
