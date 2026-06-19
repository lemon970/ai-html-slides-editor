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

  it("escapes code blocks as source text during export", () => {
    const deck = structuredClone(demoDeck);
    deck.slides[0].elements.push({
      id: "code-danger",
      type: "html",
      html: "</code><script>alert(1)</script>",
      codeConfig: { language: "html", theme: "dark" },
      x: 0,
      y: 0,
      w: 400,
      h: 200,
    });

    const html = renderDeckHtml(deck);

    expect(html).toContain("&lt;script&gt;alert(1)&lt;/script&gt;");
    expect(html).not.toContain("</code><script>alert(1)</script>");
  });

  it("sanitizes untrusted html elements during export", () => {
    const deck = structuredClone(demoDeck);
    deck.slides[0].elements.push({
      id: "html-danger",
      type: "html",
      html: `<img src="x" onerror="alert(1)"><script>alert(2)</script>`,
      x: 0,
      y: 0,
      w: 400,
      h: 200,
    });

    const html = renderDeckHtml(deck);

    expect(html).toContain("<img");
    expect(html).not.toContain(`<img src="x" onerror`);
    expect(html).not.toContain("<script>alert(2)</script>");
  });

  it("injects entrance animation keyframes when elements have animations", () => {
    const deck = structuredClone(demoDeck);
    deck.slides[0].elements[0].animations = {
      entrance: { type: "fade", duration: 0.6, delay: 0, easing: "ease-out" },
    };

    const html = renderDeckHtml(deck);

    expect(html).toContain("@keyframes anim-fade");
    expect(html).toContain("data-anim-entrance");
    expect(html).toContain("animation-name:anim-fade");
    expect(html).toContain("animation-play-state:paused");
    // IntersectionObserver script injected
    expect(html).toContain("IntersectionObserver");
    expect(html).toContain("animationPlayState");
  });

  it("does not inject animation script when no elements have animations", () => {
    const html = renderDeckHtml(demoDeck);
    expect(html).not.toContain("IntersectionObserver");
    expect(html).not.toContain("data-anim-entrance");
  });

  it("keeps entrance animation and security isolation independent", () => {
    const deck = structuredClone(demoDeck);
    // Add animated code element
    deck.slides[0].elements.push({
      id: "code-anim",
      type: "html",
      html: "<script>alert(1)</script>",
      codeConfig: { language: "html", theme: "dark" },
      x: 0, y: 0, w: 400, h: 200,
      animations: { entrance: { type: "slide-up", duration: 0.5, delay: 0.1, easing: "ease" } },
    });

    const html = renderDeckHtml(deck);

    // Animation injected
    expect(html).toContain("@keyframes anim-slide-up");
    // Code still escaped
    expect(html).toContain("&lt;script&gt;alert(1)&lt;/script&gt;");
    expect(html).not.toContain("<script>alert(1)</script>");
  });
});
