import { beforeEach, describe, expect, it, vi } from "vitest";
import { demoDeck } from "@/data/demoDeck";
import { clearDraft, loadDraft, saveDraft } from "@/core/persistence/draft";

describe("draft persistence", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it("loads valid drafts through the deck schema", () => {
    const deck = structuredClone(demoDeck);
    saveDraft(deck, deck.slides[0].id);

    const draft = loadDraft();

    expect(draft?.deck.id).toBe(deck.id);
    expect(draft?.currentSlideId).toBe(deck.slides[0].id);
  });

  it("returns null for invalid draft data", () => {
    localStorage.setItem("htmlppts_draft", JSON.stringify({
      savedAt: new Date().toISOString(),
      currentSlideId: "slide-1",
      deck: { version: "0.1", slides: [] },
    }));

    expect(loadDraft()).toBeNull();
  });

  it("marks omitted image assets instead of writing a fake normal src", () => {
    const realStringify = JSON.stringify;
    const deck = structuredClone(demoDeck);
    deck.slides[0].elements.push({
      id: "large-image",
      type: "image",
      src: `data:image/png;base64,${"a".repeat(1024)}`,
      x: 0,
      y: 0,
      w: 100,
      h: 100,
      style: {},
    });
    vi.spyOn(JSON, "stringify")
      .mockReturnValueOnce("x".repeat(4 * 1024 * 1024 + 1))
      .mockImplementation((value) => realStringify(value));

    saveDraft(deck, deck.slides[0].id);
    const draft = loadDraft();
    const image = draft?.deck.slides[0].elements.find((el) => el.id === "large-image");

    expect(draft?.assetStatus).toBe("omitted");
    expect(draft?.omittedAssetCount).toBeGreaterThan(0);
    expect(image).toMatchObject({ type: "image", assetStatus: "omitted" });
    expect(image && image.type === "image" ? image.src : "").not.toBe("[omitted]");
  });

  it("clears drafts", () => {
    saveDraft(demoDeck, demoDeck.slides[0].id);
    clearDraft();

    expect(loadDraft()).toBeNull();
  });
});
