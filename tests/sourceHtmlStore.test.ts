import { describe, it, expect, beforeEach } from "vitest";
import { useSourceHtmlStore } from "@/store/useSourceHtmlStore";
import { annotateUids, detectSlides } from "@/core/annotation/uidAnnotation";

const SIMPLE_HTML = `<!DOCTYPE html><html><body>
<section class="slide"><h1>Original Title</h1><p>Body text here</p></section>
<section class="slide"><h1>Slide Two</h1></section>
</body></html>`;

function getUid(html: string, selector: string): string {
  const doc = new DOMParser().parseFromString(html, "text/html");
  annotateUids(detectSlides(doc));
  const uid = doc.querySelector(selector)?.getAttribute("data-eid");
  if (!uid) throw new Error(`no uid for ${selector}`);
  return uid;
}

describe("Step C: export cleanup integration", () => {
  beforeEach(() => useSourceHtmlStore.getState().reset());

  it("serialize returns modified text with no editor artifacts", () => {
    const store = useSourceHtmlStore.getState();
    store.load(SIMPLE_HTML, "test.html");

    const uid = getUid(SIMPLE_HTML, "section.slide h1");
    store.appendPatch({ id: "p1", type: "text", target: { uid }, value: "New Title" });

    const html = store.serialize();

    expect(html).toContain("New Title");
    expect(html).not.toContain("Original Title");
    expect(html).not.toContain("data-eid");
    expect(html).not.toContain("data-editor-injected");
  });

  it("sourceHtml is immutable after patch", () => {
    const store = useSourceHtmlStore.getState();
    store.load(SIMPLE_HTML, "test.html");

    const uid = getUid(SIMPLE_HTML, "section.slide h1");
    store.appendPatch({ id: "p2", type: "text", target: { uid }, value: "Changed" });

    expect(useSourceHtmlStore.getState().sourceHtml).toContain("Original Title");
  });

  it("multiple patches applied in order", () => {
    const store = useSourceHtmlStore.getState();
    store.load(SIMPLE_HTML, "test.html");

    const uid1 = getUid(SIMPLE_HTML, "section.slide:first-of-type h1");
    const uid2 = getUid(SIMPLE_HTML, "section.slide:last-of-type h1");
    store.appendPatch({ id: "a", type: "text", target: { uid: uid1 }, value: "First" });
    store.appendPatch({ id: "b", type: "text", target: { uid: uid2 }, value: "Second" });

    const html = store.serialize();
    expect(html).toContain("First");
    expect(html).toContain("Second");
    expect(html).not.toContain("data-eid");
  });

  it("injected listener script is stripped from export", () => {
    const store = useSourceHtmlStore.getState();
    store.load(SIMPLE_HTML, "test.html");
    const html = store.serialize();
    expect(html).not.toContain("data-editor-injected");
    expect(html).not.toContain("__editMode");
  });
});
