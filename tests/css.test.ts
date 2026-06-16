import { describe, expect, it } from "vitest";
import { slideBackgroundHtmlStyle, styleToString, textHtmlStyle } from "@/core/style/css";
import type { SlideElement } from "@/core/schema/deck";

describe("css style utilities", () => {
  it("renders image backgrounds for slides", () => {
    const style = slideBackgroundHtmlStyle({
      type: "image",
      src: "data:image/png;base64,abc",
      fit: "cover",
      position: "center",
      overlay: "rgba(0,0,0,.2)",
    });

    expect(styleToString(style)).toContain("background-image:linear-gradient");
    expect(styleToString(style)).toContain("background-size:cover");
  });

  it("renders detailed text styles", () => {
    const element: SlideElement = {
      id: "title",
      type: "text",
      x: 10,
      y: 20,
      w: 300,
      h: 120,
      content: "Hello",
      style: {
        fontFamily: "Inter",
        fontSize: 48,
        fontWeight: 700,
        fontStyle: "italic",
        letterSpacing: 1.5,
        verticalAlign: "middle",
      },
    };

    const css = styleToString(textHtmlStyle(element));
    expect(css).toContain("font-style:italic");
    expect(css).toContain("letter-spacing:1.5px");
    expect(css).toContain("justify-content:center");
  });
});
