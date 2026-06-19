import { describe, expect, it } from "vitest";
import { deckSchema, animationDefSchema, elementAnimationsSchema, slideTransitionSchema } from "@/core/schema/deck";
import { demoDeck } from "@/data/demoDeck";

describe("animation schema", () => {
  it("accepts valid animation def", () => {
    const def = animationDefSchema.parse({ type: "fade" });
    expect(def.duration).toBe(0.6);
    expect(def.easing).toBe("ease-out");
  });

  it("rejects unknown animation type", () => {
    expect(animationDefSchema.safeParse({ type: "spin-unknown" }).success).toBe(false);
  });

  it("accepts elementAnimations with only entrance set", () => {
    const anims = elementAnimationsSchema.parse({
      entrance: { type: "slide-up", duration: 0.5, delay: 0.1, easing: "linear" },
    });
    expect(anims.entrance?.type).toBe("slide-up");
    expect(anims.exit).toBeUndefined();
  });

  it("accepts slideTransition", () => {
    const t = slideTransitionSchema.parse({ type: "fade" });
    expect(t.duration).toBe(0.4);
  });

  it("rejects unknown transition type", () => {
    expect(slideTransitionSchema.safeParse({ type: "wipe" }).success).toBe(false);
  });
});

describe("deck schema round-trip with animations and notes", () => {
  it("preserves element animations through schema parse", () => {
    const deck = structuredClone(demoDeck);
    deck.slides[0].elements[0].animations = {
      entrance: { type: "zoom-in", duration: 1, delay: 0.2, easing: "ease-in-out" },
    };

    const parsed = deckSchema.parse(deck);
    expect(parsed.slides[0].elements[0].animations?.entrance?.type).toBe("zoom-in");
    expect(parsed.slides[0].elements[0].animations?.entrance?.delay).toBe(0.2);
  });

  it("preserves slide notes through schema parse", () => {
    const deck = structuredClone(demoDeck);
    deck.slides[0].notes = "这是第一页的演讲者备注。";

    const parsed = deckSchema.parse(deck);
    expect(parsed.slides[0].notes).toBe("这是第一页的演讲者备注。");
  });

  it("preserves slide transition through schema parse", () => {
    const deck = structuredClone(demoDeck);
    deck.slides[1].transition = { type: "slide", duration: 0.5 };

    const parsed = deckSchema.parse(deck);
    expect(parsed.slides[1].transition?.type).toBe("slide");
  });

  it("accepts deck without animations or transitions (backward compat)", () => {
    const parsed = deckSchema.parse(demoDeck);
    expect(parsed.slides[0].elements[0].animations).toBeUndefined();
    expect(parsed.slides[0].transition).toBeUndefined();
  });
});
