import { describe, expect, it } from "vitest";
import { demoDeck } from "@/data/demoDeck";
import { deckSchema } from "@/core/schema/deck";

describe("deck schema", () => {
  it("accepts the demo deck", () => {
    expect(deckSchema.parse(demoDeck).slides).toHaveLength(3);
  });

  it("rejects decks without slides", () => {
    const result = deckSchema.safeParse({
      ...demoDeck,
      slides: [],
    });

    expect(result.success).toBe(false);
  });

  it("rejects elements without required dimensions", () => {
    const invalidDeck = structuredClone(demoDeck);
    delete (invalidDeck.slides[0].elements[0] as Record<string, unknown>).w;

    expect(deckSchema.safeParse(invalidDeck).success).toBe(false);
  });
});
