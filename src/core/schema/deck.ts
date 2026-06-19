import { z } from "zod";

export const deckSizeSchema = z.object({
  width: z.number().positive(),
  height: z.number().positive(),
});

export const fillSchema = z.object({
  type: z.literal("solid"),
  color: z.string().min(1),
});

export const gradientFillSchema = z.object({
  type: z.literal("gradient"),
  from: z.string().min(1),
  to: z.string().min(1),
  angle: z.number(),
});

export const imageFillSchema = z.object({
  type: z.literal("image"),
  src: z.string(),
  fit: z.enum(["cover", "contain", "fill"]).default("cover"),
  position: z.enum(["center", "top", "bottom", "left", "right"]).default("center"),
  overlay: z.string().optional(),
});

export const slideBackgroundSchema = z.discriminatedUnion("type", [
  fillSchema,
  gradientFillSchema,
  imageFillSchema,
]);

export const textStyleSchema = z.object({
  fontFamily: z.string().optional(),
  fontSize: z.number().positive().optional(),
  fontWeight: z.union([z.number(), z.literal("bold"), z.literal("normal")]).optional(),
  fontStyle: z.enum(["normal", "italic"]).optional(),
  color: z.string().optional(),
  lineHeight: z.number().positive().optional(),
  letterSpacing: z.number().optional(),
  textAlign: z.enum(["left", "center", "right", "justify"]).optional(),
  verticalAlign: z.enum(["top", "middle", "bottom"]).optional(),
  background: z.string().optional(),
  padding: z.number().min(0).optional(),
  borderRadius: z.number().min(0).optional(),
  shadow: z.string().optional(),
  overflow: z.enum(["visible", "hidden", "fit"]).optional(),
});

export const shapeStyleSchema = z.object({
  fill: z.string().optional(),
  stroke: z.string().optional(),
  strokeWidth: z.number().min(0).optional(),
  borderRadius: z.number().min(0).optional(),
  shadow: z.string().optional(),
});

// ── Animation schemas ──────────────────────────────────────────────────────

export const animationTypeSchema = z.enum([
  "fade", "slide-up", "slide-down", "slide-left", "slide-right", "scale", "zoom-in", "spin",
]);

export const animationDefSchema = z.object({
  type: animationTypeSchema,
  duration: z.number().positive().default(0.6),
  delay: z.number().min(0).default(0),
  easing: z.enum(["ease", "ease-in", "ease-out", "ease-in-out", "linear"]).default("ease-out"),
});

export const elementAnimationsSchema = z.object({
  entrance: animationDefSchema.optional(),
  exit: animationDefSchema.optional(),
  emphasis: animationDefSchema.optional(),
});

// ── Transition schema ──────────────────────────────────────────────────────

export const slideTransitionSchema = z.object({
  type: z.enum(["none", "fade", "slide", "push"]).default("fade"),
  duration: z.number().positive().default(0.4),
});

// ── Element schemas ────────────────────────────────────────────────────────

const baseElementSchema = z.object({
  id: z.string().min(1),
  name: z.string().optional(),
  x: z.number(),
  y: z.number(),
  w: z.number().positive(),
  h: z.number().positive(),
  rotation: z.number().optional(),
  opacity: z.number().min(0).max(1).optional(),
  locked: z.boolean().optional(),
  hidden: z.boolean().optional(),
  groupId: z.string().optional(),
  zIndex: z.number().optional(),
  minW: z.number().positive().optional(),
  minH: z.number().positive().optional(),
  animations: elementAnimationsSchema.optional(),
});

export const textElementSchema = baseElementSchema.extend({
  type: z.literal("text"),
  content: z.string(),
  style: textStyleSchema.default({}),
});

export const imageElementSchema = baseElementSchema.extend({
  type: z.literal("image"),
  src: z.string().min(1),
  assetId: z.string().optional(),
  assetStatus: z.enum(["omitted"]).optional(),
  alt: z.string().optional(),
  objectFit: z.enum(["cover", "contain", "fill"]).optional(),
  style: z
    .object({
      borderRadius: z.number().min(0).optional(),
      shadow: z.string().optional(),
      background: z.string().optional(),
    })
    .optional()
    .default({}),
});

export const shapeElementSchema = baseElementSchema.extend({
  type: z.literal("shape"),
  shape: z.enum(["rect", "ellipse"]).optional(),
  style: shapeStyleSchema.default({}),
});

export const htmlElementSchema = baseElementSchema.extend({
  type: z.literal("html"),
  html: z.string(),
  editable: z.literal(false).optional(),
  trustedHtml: z.boolean().optional(),
  codeConfig: z
    .object({
      language: z.string().default("plaintext"),
      theme: z.enum(["dark", "light"]).default("dark"),
    })
    .optional(),
});

export const slideElementSchema = z.discriminatedUnion("type", [
  textElementSchema,
  imageElementSchema,
  shapeElementSchema,
  htmlElementSchema,
]);

export const slideSchema = z.object({
  id: z.string().min(1),
  name: z.string().optional(),
  background: slideBackgroundSchema,
  elements: z.array(slideElementSchema),
  notes: z.string().optional(),
  transition: slideTransitionSchema.optional(),
});

export const themeSchema = z.object({
  fontFamily: z.string(),
  accentColor: z.string(),
});

export const deckAssetSchema = z.object({
  id: z.string().min(1),
  type: z.literal("image"),
  name: z.string(),
  src: z.string().min(1),
  mimeType: z.string().optional(),
  width: z.number().positive().optional(),
  height: z.number().positive().optional(),
  createdAt: z.string().optional(),
});

export const deckSchema = z.object({
  version: z.literal("0.1"),
  id: z.string().min(1),
  title: z.string(),
  size: deckSizeSchema,
  theme: themeSchema,
  slides: z.array(slideSchema).min(1),
  assets: z.array(deckAssetSchema).optional(),
});

export type Deck = z.infer<typeof deckSchema>;
export type DeckAsset = z.infer<typeof deckAssetSchema>;
export type Slide = z.infer<typeof slideSchema>;
export type SlideBackground = z.infer<typeof slideBackgroundSchema>;
export type SlideElement = z.infer<typeof slideElementSchema>;
export type TextElement = z.infer<typeof textElementSchema>;
export type ImageElement = z.infer<typeof imageElementSchema>;
export type ShapeElement = z.infer<typeof shapeElementSchema>;
export type HtmlElement = z.infer<typeof htmlElementSchema>;
export type ElementType = SlideElement["type"];
export type ElementPatch = Partial<SlideElement> & {
  style?: Record<string, unknown>;
};
export type AnimationDef = z.infer<typeof animationDefSchema>;
export type ElementAnimations = z.infer<typeof elementAnimationsSchema>;
export type SlideTransition = z.infer<typeof slideTransitionSchema>;
