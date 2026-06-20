import { describe, it, expect } from "vitest";
import { isTextTarget } from "@/core/annotation/isTextTarget";

function make(tag: string, text = ""): Element {
  const el = document.createElement(tag);
  if (text) el.textContent = text;
  return el;
}

describe("isTextTarget", () => {
  it("h1 with text → true", () => expect(isTextTarget(make("h1", "Title"))).toBe(true));
  it("p with text → true", () => expect(isTextTarget(make("p", "Body"))).toBe(true));
  it("button with text → true", () => expect(isTextTarget(make("button", "Next →"))).toBe(true));
  it("td with text → true", () => expect(isTextTarget(make("td", "Value"))).toBe(true));
  it("span with text → true", () => expect(isTextTarget(make("span", "label"))).toBe(true));

  it("empty button → false", () => expect(isTextTarget(make("button"))).toBe(false));
  it("empty span → false", () => expect(isTextTarget(make("span"))).toBe(false));
  it("whitespace-only p → false", () => expect(isTextTarget(make("p", "   "))).toBe(false));

  it("img → false", () => expect(isTextTarget(make("img"))).toBe(false));
  it("svg → false", () => expect(isTextTarget(make("svg"))).toBe(false));
  it("canvas → false", () => expect(isTextTarget(make("canvas"))).toBe(false));

  it("div with direct text → true", () => {
    const el = document.createElement("div");
    el.appendChild(document.createTextNode("hello"));
    expect(isTextTarget(el)).toBe(true);
  });
  it("div with only child elements (no direct text) → false", () => {
    const el = document.createElement("div");
    const span = document.createElement("span");
    span.textContent = "text";
    el.appendChild(span);
    expect(isTextTarget(el)).toBe(false);
  });

  it("code with text → true", () => expect(isTextTarget(make("code", "const x = 1"))).toBe(true));
  it("pre with text → true", () => expect(isTextTarget(make("pre", "line1\nline2"))).toBe(true));
  it("empty code → false", () => expect(isTextTarget(make("code"))).toBe(false));
});
