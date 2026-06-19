import { beforeEach, describe, expect, it } from "vitest";
import { demoDeck } from "@/data/demoDeck";
import { clearDraft, loadDraft, saveDraft } from "@/core/persistence/draft";

describe("draft persistence", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("loads valid drafts through the deck schema", async () => {
    const deck = structuredClone(demoDeck);
    await saveDraft(deck, deck.slides[0].id);

    const draft = await loadDraft();

    expect(draft?.deck.id).toBe(deck.id);
    expect(draft?.currentSlideId).toBe(deck.slides[0].id);
  });

  it("returns null for invalid draft data", async () => {
    localStorage.setItem("htmlppts_draft", JSON.stringify({
      savedAt: new Date().toISOString(),
      currentSlideId: "slide-1",
      deck: { version: "0.1", slides: [] },
    }));

    expect(await loadDraft()).toBeNull();
  });

  it("saves deck content without size-based omission", async () => {
    const deck = structuredClone(demoDeck);
    const longSrc = `data:image/png;base64,${"a".repeat(2048)}`;
    deck.slides[0].elements.push({
      id: "large-image",
      type: "image",
      src: longSrc,
      x: 0, y: 0, w: 100, h: 100,
      style: {},
    });

    await saveDraft(deck, deck.slides[0].id);
    const draft = await loadDraft();
    const image = draft?.deck.slides[0].elements.find((el) => el.id === "large-image");

    expect(image).toBeDefined();
    expect(image?.type === "image" ? image.src : "").toBe(longSrc);
  });

  it("clears drafts", async () => {
    await saveDraft(demoDeck, demoDeck.slides[0].id);
    await clearDraft();

    expect(await loadDraft()).toBeNull();
  });
});
