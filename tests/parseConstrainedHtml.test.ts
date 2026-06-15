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
});
