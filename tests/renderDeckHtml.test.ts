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

  it("exports image backgrounds and detailed text styles", () => {
    const deck = structuredClone(demoDeck);
    deck.slides[0].background = {
      type: "image",
      src: "data:image/png;base64,abc",
      fit: "cover",
      position: "center",
    };
    const element = deck.slides[0].elements.find((item) => item.id === "cover-title");
    if (element?.type !== "text") {
      throw new Error("Expected cover title text element.");
    }
    element.style.fontStyle = "italic";
    element.style.letterSpacing = 1.5;
    element.style.verticalAlign = "middle";

    const html = renderDeckHtml(deck);
    expect(html).toContain("background-image:url");
    expect(html).toContain("font-style:italic");
    expect(html).toContain("letter-spacing:1.5px");
    expect(html).toContain("justify-content:center");
  });

  it("does not export hidden elements", () => {
    const deck = structuredClone(demoDeck);
    const element = deck.slides[0].elements.find((item) => item.id === "cover-title");
    if (!element) {
      throw new Error("Expected cover title element.");
    }
    element.hidden = true;

    const html = renderDeckHtml(deck);

    expect(html).not.toContain('data-element-id="cover-title"');
    expect(html).toContain('"hidden":true');
  });
});
