import { describe, expect, it } from "vitest";
import { annotateUids, computeUid, detectSlides } from "@/core/annotation/uidAnnotation";
import { applyPatches } from "@/core/patches/patches";

const SLIDES_HTML = `<!DOCTYPE html><html><body>
<section class="slide"><h1>Title One</h1><p>Body text</p></section>
<section class="slide"><h1>Title Two</h1></section>
</body></html>`;

function parse(html: string) {
  return new DOMParser().parseFromString(html, "text/html");
}

// ── computeUid ────────────────────────────────────────────────────────────────

describe("computeUid", () => {
  it("is deterministic", () => {
    expect(computeUid(0, [0], "h1", "Title One")).toBe(computeUid(0, [0], "h1", "Title One"));
  });
  it("differs by path", () => {
    expect(computeUid(0, [0], "h1", "x")).not.toBe(computeUid(0, [1], "h1", "x"));
  });
  it("differs by slideIdx", () => {
    expect(computeUid(0, [0], "h1", "x")).not.toBe(computeUid(1, [0], "h1", "x"));
  });
  it("returns e-prefixed 6-char alphanumeric", () => {
    expect(computeUid(0, [0], "h1", "x")).toMatch(/^e[0-9a-z]{6}$/);
  });
});

// ── annotateUids ──────────────────────────────────────────────────────────────

describe("annotateUids", () => {
  it("injects data-eid on text-bearing elements", () => {
    const doc = parse(SLIDES_HTML);
    annotateUids(detectSlides(doc));
    expect(doc.querySelectorAll("[data-eid]").length).toBeGreaterThan(0);
  });

  it("same sourceHtml produces same uids (session restore guarantee)", () => {
    const d1 = parse(SLIDES_HTML);
    const d2 = parse(SLIDES_HTML);
    annotateUids(detectSlides(d1));
    annotateUids(detectSlides(d2));
    const uid1 = d1.querySelector("h1")?.getAttribute("data-eid");
    const uid2 = d2.querySelector("h1")?.getAttribute("data-eid");
    expect(uid1).toBeTruthy();
    expect(uid1).toBe(uid2);
  });

  it("does not annotate script/style/img elements", () => {
    const doc = parse(`<!DOCTYPE html><html><body>
      <section class="slide">
        <h1>Hi</h1><img src="x.png"/><script>alert(1)</script>
      </section></body></html>`);
    annotateUids(detectSlides(doc));
    expect(doc.querySelector("img")?.getAttribute("data-eid")).toBeNull();
    expect(doc.querySelector("script")?.getAttribute("data-eid")).toBeNull();
    expect(doc.querySelector("h1")?.getAttribute("data-eid")).toBeTruthy();
  });
});

// ── applyPatches ──────────────────────────────────────────────────────────────

describe("applyPatches", () => {
  function getUidFor(selector: string): string {
    const doc = parse(SLIDES_HTML);
    annotateUids(detectSlides(doc));
    const uid = doc.querySelector(selector)?.getAttribute("data-eid");
    if (!uid) throw new Error(`no uid for ${selector}`);
    return uid;
  }

  it("applies text patch by uid", () => {
    const uid = getUidFor("section.slide h1");
    const { html, stale } = applyPatches(SLIDES_HTML, [
      { id: "p1", type: "text", target: { uid }, value: "New Title" },
    ]);
    expect(stale).toHaveLength(0);
    expect(html).toContain("New Title");
    expect(html).not.toContain("Title One");
  });

  it("falls back to path when uid not found", () => {
    // indices:[0] = slide.children[0] = <h1>
    const { html, stale } = applyPatches(SLIDES_HTML, [
      { id: "p2", type: "text", target: { uid: "exxxxxx", path: { slideIdx: 0, indices: [0] } }, value: "Via Path" },
    ]);
    expect(stale).toHaveLength(0);
    expect(html).toContain("Via Path");
  });

  it("falls back to htmlId when uid not found", () => {
    const html = `<!DOCTYPE html><html><body>
      <section class="slide"><h1 id="main-title">Hello</h1></section>
    </body></html>`;
    const { html: out, stale } = applyPatches(html, [
      { id: "p3", type: "text", target: { uid: "exxxxxx", htmlId: "main-title" }, value: "Changed" },
    ]);
    expect(stale).toHaveLength(0);
    expect(out).toContain("Changed");
  });

  it("returns stale for fully unresolvable target", () => {
    const { stale } = applyPatches(SLIDES_HTML, [
      { id: "p4", type: "text", target: { uid: "exxxxxx" }, value: "x" },
    ]);
    expect(stale).toHaveLength(1);
    expect(stale[0].id).toBe("p4");
  });

  it("exported html has no data-eid attributes", () => {
    const uid = getUidFor("section.slide h1");
    const { html } = applyPatches(SLIDES_HTML, [
      { id: "p5", type: "text", target: { uid }, value: "x" },
    ]);
    expect(html).not.toContain("data-eid");
  });

  it("exported html strips data-editor-injected scripts", () => {
    const withScript = SLIDES_HTML.replace(
      "</body>",
      '<script data-editor-injected="1">alert(1)</script></body>',
    );
    const { html } = applyPatches(withScript, []);
    expect(html).not.toContain("data-editor-injected");
    expect(html).not.toContain("alert(1)");
  });

  it("applies multiple patches in order", () => {
    const uid0 = getUidFor("section.slide:first-child h1");
    const uid1 = getUidFor("section.slide:last-child h1");
    const { html, stale } = applyPatches(SLIDES_HTML, [
      { id: "a", type: "text", target: { uid: uid0 }, value: "Slide 1" },
      { id: "b", type: "text", target: { uid: uid1 }, value: "Slide 2" },
    ]);
    expect(stale).toHaveLength(0);
    expect(html).toContain("Slide 1");
    expect(html).toContain("Slide 2");
  });
});
