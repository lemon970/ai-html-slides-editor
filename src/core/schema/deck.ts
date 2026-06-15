import { z } from "zod";

export const deckSizeSchema = z.object({
  width: z.number().positive(),
  height: z.number().positive(),
});

export const fillSchema = z.object({
  type: z.literal("solid"),
  color: z.string().min(1),
});

export const textStyleSchema = z.object({
  fontFamily: z.string().optional(),
  fontSize: z.number().positive().optional(),
  fontWeight: z.union([z.number(), z.literal("bold"), z.literal("normal")]).optional(),
  color: z.string().optional(),
  lineHeight: z.number().positive().optional(),
  textAlign: z.enum(["left", "center", "right"]).optional(),
  background: z.string().optional(),
  padding: z.number().min(0).optional(),
  borderRadius: z.number().min(0).optional(),
  shadow: z.string().optional(),
});

export const shapeStyleSchema = z.object({
  fill: z.string().optional(),
  stroke: z.string().optional(),
  strokeWidth: z.number().min(0).optional(),
  borderRadius: z.number().min(0).optional(),
  shadow: z.string().optional(),
});

const baseElementSchema = z.object({
  id: z.string().min(1),
  x: z.number(),
  y: z.number(),
  w: z.number().positive(),
  h: z.number().positive(),
  rotation: z.number().optional(),
  opacity: z.number().min(0).max(1).optional(),
  locked: z.boolean().optional(),
  zIndex: z.number().optional(),
});

export const textElementSchema = baseElementSchema.extend({
  type: z.literal("text"),
  content: z.string(),
  style: textStyleSchema.default({}),
});

export const imageElementSchema = baseElementSchema.extend({
  type: z.literal("image"),
  src: z.string().min(1),
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
  background: fillSchema,
  elements: z.array(slideElementSchema),
  notes: z.string().optional(),
});

export const themeSchema = z.object({
  fontFamily: z.string(),
  accentColor: z.string(),
});

export const deckSchema = z.object({
  version: z.literal("0.1"),
  id: z.string().min(1),
  title: z.string(),
  size: deckSizeSchema,
  theme: themeSchema,
  slides: z.array(slideSchema).min(1),
});

export type Deck = z.infer<typeof deckSchema>;
export type Slide = z.infer<typeof slideSchema>;
export type SlideElement = z.infer<typeof slideElementSchema>;
export type TextElement = z.infer<typeof textElementSchema>;
export type ImageElement = z.infer<typeof imageElementSchema>;
export type ShapeElement = z.infer<typeof shapeElementSchema>;
export type HtmlElement = z.infer<typeof htmlElementSchema>;
export type ElementType = SlideElement["type"];
export type ElementPatch = Partial<SlideElement> & {
  style?: Record<string, unknown>;
};
