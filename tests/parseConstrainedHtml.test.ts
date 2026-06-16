import { describe, expect, it } from "vitest";
import { demoDeck } from "@/data/demoDeck";
import { parseConstrainedHtml } from "@/core/import/parseConstrainedHtml";
import { renderDeckHtml } from "@/core/render/renderDeckHtml";

describe("parseConstrainedHtml", () => {
  it("restores decks from embedded JSON", () => {
    const parsed = parseConstrainedHtml(renderDeckHtml(demoDeck));

    expect(parsed.id).toBe(demoDeck.id);
    expect(parsed.slides).toHaveLength(demoDeck.slides.length);
    expect(parsed.slides[0].elements[0].id).toBe(demoDeck.slides[0].elements[0].id);
  });

  it("throws a clear error without a deck root", () => {
    expect(() => parseConstrainedHtml("<main></main>")).toThrow("No [data-deck]");
  });

  it("parses constrained image backgrounds without embedded JSON", () => {
    const parsed = parseConstrainedHtml(`
      <html><head><title>Manual</title></head><body>
        <main data-deck style="--deck-width:1600;--deck-height:900;">
          <section data-slide id="slide-1" style="background-image:url('/bg.png');background-size:contain;background-position:top;">
            <div data-element data-element-id="el-1" data-type="text" style="position:absolute;left:10px;top:20px;width:300px;height:80px;font-size:30px;font-style:italic;letter-spacing:2px;">Hello</div>
          </section>
        </main>
      </body></html>
    `);

    expect(parsed.slides[0].background).toMatchObject({
      type: "image",
      src: "/bg.png",
      fit: "contain",
      position: "top",
    });
    expect(parsed.slides[0].elements[0]).toMatchObject({
      type: "text",
      style: {
        fontSize: 30,
        fontStyle: "italic",
        letterSpacing: 2,
      },
    });
  });
});
