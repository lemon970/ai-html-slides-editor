import { describe, expect, it } from "vitest";
import { demoDeck } from "@/data/demoDeck";
import { renderDeckHtml } from "@/core/render/renderDeckHtml";

describe("renderDeckHtml", () => {
  it("renders a full constrained HTML document", () => {
    const html = renderDeckHtml(demoDeck);

    expect(html).toContain("<!doctype html>");
    expect(html).toContain("data-deck");
    expect(html).toContain("data-slide");
    expect(html).toContain("data-element");
    expect(html).toContain("window.__DECK_JSON__");
  });

  it("escapes text content", () => {
    const deck = structuredClone(demoDeck);
    const element = deck.slides[0].elements.find((item) => item.id === "cover-title");
    if (element?.type !== "text") {
      throw new Error("Expected cover title text element.");
    }
    element.content = "<script>alert(1)</script>";

    const html = renderDeckHtml(deck);
    expect(html).toContain("&lt;script&gt;alert(1)&lt;/script&gt;");
    expect(html).not.toContain("<script>alert(1)</script></div>");
  });
});
