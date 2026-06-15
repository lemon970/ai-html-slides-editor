# AI HTML Slides 可视化编辑器调研与 MVP 方案

日期：2026-06-15

## 1. 项目一句话定位

一个面向 AI 生成 HTML Slides 的结构化可视化编辑器：AI 负责生成表达力强的 HTML/JSON，用户用类似 PPT/Figma 的 UI 编辑，系统再稳定导出 HTML，并预留 PPTX 与 AI 二次修改能力。

## 2. 目标用户

- 使用 AI 高频制作演示文稿的人：学生、教师、产品经理、咨询顾问、开发者布道、研究员、内容创作者。
- 典型场景是：AI 先生成一版漂亮 HTML slides，用户需要后续改字、改图、调排版、导出分享。

## 3. 用户痛点

- AI 生成 HTML slides 的表达能力强，但人工修改 HTML/CSS 成本高。
- PPT 容易改，但复杂布局、交互、网页式视觉和自动化生成能力弱于 HTML。
- 现有工具要么偏代码，要么偏传统 PPT，要么是网页搭建器，缺少“AI HTML Slides -> 人类可编辑结构 -> 可继续被 AI 理解”的桥梁。

## 4. 竞品与相关技术调研

### HTML 演示文稿框架

#### reveal.js

- 适合作为 HTML 演示运行时。
- 官方定位是开放 Web 技术的 HTML presentation framework，支持 nested slides、Markdown、PDF export、speaker notes、JS API 等。
- 它本身不是结构化可视化编辑器。
- Slides.com 是 reveal.js 作者的视觉编辑平台，可作为竞品参考，但不是本地 AI HTML 导入编辑桥梁。
- 资料：[reveal.js](https://revealjs.com/)

#### Slidev

- 适合开发者写 Markdown + Vue 组件。
- 官方强调 Markdown、Vue、Vite、交互 demo。
- 问题是导入后结构可能包含 Vue 组件、运行时状态、构建产物，不适合 MVP 做任意可视化编辑。
- 资料：[Slidev Guide](https://sli.dev/guide/)

#### Marp

- 适合 Markdown 到 HTML/PDF/PPTX，转换链清晰。
- 官方支持导出 HTML、PDF、PowerPoint。
- 自由布局和复杂交互弱于 HTML slides。
- 适合作为文本型 slide 输入源，不适合作为主编辑模型。
- 资料：[Marp](https://marp.app/)

#### 纯 HTML/CSS/JS slides

- 自由度最高，也最难解析。
- MVP 适合定义自己的受约束 HTML schema，而不是接收任意网页。

### 可视化 HTML 编辑器 / Web Builder

#### GrapesJS

- 组件、块、样式管理都成熟。
- 官方 Component 是 template 的基础元素，Style Manager 负责编辑组件样式。
- 更像网页、邮件、landing page builder。
- 默认不面向固定比例、分页、z-index 图层、演示缩略图与 PPT 式对象操作。
- 可借鉴组件模型和属性面板，不建议直接作为核心。
- 资料：[GrapesJS Components](https://grapesjs.com/docs/modules/Components.html)、[GrapesJS Style Manager](https://grapesjs.com/docs/modules/Style-manager.html)

#### Craft.js

- React page editor 框架，有拖拽和组件编辑能力。
- 偏 React 页面搭建，不解决 HTML slides 的导入、视觉保真和导出问题。
- 资料：[Craft.js Overview](https://craft.js.org/docs/overview)

### 画布编辑器 / 白板 SDK

#### tldraw

- 交互能力强，支持 shape records、undo/redo、自定义 shapes。
- 适合白板和无限画布。
- 对 PPT 式固定页面可用但偏重。
- SDK 生产使用需要 license key，不是完全宽松开源。
- 资料：[tldraw SDK](https://tldraw.dev/)、[tldraw Shapes](https://tldraw.dev/sdk-features/shapes)、[tldraw License](https://tldraw.dev/community/license)

#### Fabric.js / Konva

- 适合 Canvas 对象编辑、拖拽、缩放、旋转。
- Fabric 有对象模型和序列化。
- Konva/react-konva 有 React 绑定和 Transformer。
- 缺点是 HTML/CSS 视觉会被“画布对象化”，DOM 文本、CSS、交互和 iframe 内容难保真。
- 资料：[Fabric.js](https://fabricjs.com/)、[react-konva](https://konvajs.org/docs/react/index.html)、[Konva Transformer](https://konvajs.org/docs/select_and_transform/Transform_Events.html)

#### Excalidraw

- 适合手绘风白板。
- 不适合 PPT 级视觉保真。
- Next.js 集成需要处理 client-only。
- 资料：[Excalidraw Integration](https://docs.excalidraw.com/docs/%40excalidraw/excalidraw/integration)

### PPTX 导入 / 导出

#### PptxGenJS

- 适合从结构化 JSON 生成 PPTX。
- 支持文本、图片、形状、表格、图表等。
- HTML-to-PPTX 官方能力主要是 `tableToSlides`，不是任意 HTML slide 转可编辑 PPTX。
- 资料：[PptxGenJS Introduction](https://gitbrent.github.io/PptxGenJS/docs/introduction/)、[HTML to PowerPoint](https://gitbrent.github.io/PptxGenJS/html2pptx/)

#### PPTX to HTML

- PPTX 本身是 PresentationML/OpenXML 包。
- 包含 slide、master、layout、theme、shape、picture、table、animation 等多个 part。
- 可以解析，但完整还原复杂。
- 适合后续做“有限导入”，不适合 MVP 承诺高保真双向转换。
- 资料：[Microsoft PresentationML](https://learn.microsoft.com/en-us/office/open-xml/presentation/structure-of-a-presentationml-document)、[Shape Class](https://learn.microsoft.com/en-us/dotnet/api/documentformat.openxml.presentation.shape)

## 5. 推荐技术架构

推荐路线：方案 B + 方案 C，方案 A 只做降级导入。

- 内部主模型用 `deck.json`。
- AI 生成时要求输出受约束 HTML 或直接输出 JSON。
- 编辑器只完整支持受约束结构：`data-deck`、`data-slide`、`data-element`、固定 16:9、绝对定位元素。
- 任意 HTML 导入不承诺完整可编辑：先渲染成锁定背景，再允许用户在上面添加和编辑新元素。
- iframe 用来预览和点击选择同源 `srcDoc`，但编辑结果写入 JSON，不直接把 DOM 当源数据。
- HTML 导出由 JSON 确定性生成，保证可重复、可 diff、可被 AI 继续读。

推荐技术栈：

- Next.js / React / TypeScript。
- Zustand 或 Jotai 做编辑状态。
- Zod 做 schema 校验。
- `react-moveable` 做拖拽、缩放、旋转、辅助线。
- DOMPurify + sandbox iframe 做 HTML 安全处理。
- JSON Patch 或自定义 deck operations 做 AI 协作接口。

## 6. 数据结构设计

核心 schema 建议保持小而稳定：

```ts
type Deck = {
  version: "0.1";
  id: string;
  title: string;
  size: { width: 1600; height: 900 };
  theme: Theme;
  slides: Slide[];
};

type Slide = {
  id: string;
  name?: string;
  background: Fill;
  elements: SlideElement[];
  notes?: string;
};

type SlideElement =
  | TextElement
  | ImageElement
  | ShapeElement
  | HtmlElement;

type BaseElement = {
  id: string;
  type: "text" | "image" | "shape" | "html";
  x: number;
  y: number;
  w: number;
  h: number;
  rotation?: number;
  opacity?: number;
  locked?: boolean;
  zIndex?: number;
};

type TextElement = BaseElement & {
  type: "text";
  content: string;
  style: {
    fontFamily?: string;
    fontSize?: number;
    fontWeight?: number | "bold";
    color?: string;
    lineHeight?: number;
    textAlign?: "left" | "center" | "right";
    background?: string;
    padding?: number;
    borderRadius?: number;
    shadow?: string;
  };
};

type HtmlElement = BaseElement & {
  type: "html";
  html: string;
  editable: false;
};
```

## 7. MVP 功能范围

- 打开本地 demo deck。
- 左侧 slide 缩略图。
- 点击切换当前页。
- 中间 16:9 iframe/画布预览。
- 点击选择元素。
- 文本编辑。
- 拖动元素。
- 修改字号、颜色、背景。
- 保存为 JSON。
- 导出单文件 HTML。
- 只完整支持受约束 HTML 导入。

## 8. 非 MVP 功能

暂时不要做：

- 任意 HTML 完整可编辑。
- Slidev/Vue 组件反向结构化。
- reveal.js/Marp 全量导入。
- PPTX 导入。
- 可编辑 PPTX 高保真导出。
- 动画时间轴。
- 图表编辑器。
- 协同编辑。
- 母版、主题设计系统、组件库市场。
- 任意 JS 交互的可视化编辑。
- 自动排版 AI agent。

## 9. 技术难点与风险

- 任意 HTML 解析成可编辑结构不可控：CSS cascade、flex/grid、transform、媒体查询、JS 运行时都会影响最终视觉。
- 不破坏视觉效果的关键不是直接改 DOM，而是限制元素模型、固定画布尺寸、只支持明确样式子集。
- 同步回 HTML 要靠 JSON -> HTML serializer，不要靠 DOM diff。
- AI 后续理解要读 JSON 和 operations，不要让 AI 读最终 HTML。
- iframe 编辑要处理坐标映射：iframe 内元素 `getBoundingClientRect()` 到父层 overlay 坐标。
- 字体和图片资产会影响还原。
- 导出单文件 HTML 时应内联 CSS，可选内联图片为 base64。
- HTML 截图用于缩略图或锁定背景时，要注意跨域图片和 CORS。
- PPTX 导出只能分层实现：文本、图片、基础形状可编辑导出，复杂 HTML 只能截图导出。

## 10. 推荐开源库

- UI：Next.js、React、TypeScript、Tailwind CSS。
- 状态：Zustand。
- Schema：Zod。
- 拖拽缩放旋转：`react-moveable`。
- 备选交互：`interact.js`。
- 列表排序：dnd-kit。
- HTML 安全：DOMPurify。
- 缩略图：html2canvas 或 html-to-image。
- 导出下载：file-saver。
- PPTX 后续：PptxGenJS。
- 富文本后续：Tiptap/ProseMirror，只用于文本框内部，不用于整个 slide。

## 11. 文件结构建议

```txt
src/
  app/
    page.tsx
    layout.tsx
  components/
    editor/AppShell.tsx
    editor/SlideNavigator.tsx
    editor/SlideViewport.tsx
    editor/SlideIframe.tsx
    editor/SelectionOverlay.tsx
    editor/PropertyPanel.tsx
    editor/Toolbar.tsx
  core/
    schema/deck.ts
    schema/validators.ts
    render/renderDeckHtml.ts
    import/parseConstrainedHtml.ts
    import/htmlSanitize.ts
    export/exportJson.ts
    export/exportSingleFileHtml.ts
    ops/deckOperations.ts
    ops/history.ts
  store/
    useDeckStore.ts
  data/
    demoDeck.ts
  styles/
    editor.css
```

## 12. 核心组件设计

- `AppShell`：三栏布局。
- `SlideNavigator`：展示缩略图、切页、复制/删除 slide。
- `SlideViewport`：负责缩放 16:9 画布、承载 iframe 和 overlay。
- `SlideIframe`：用 `srcDoc` 渲染当前 slide 或全 deck HTML。
- `SelectionOverlay`：读取选中元素坐标，显示边框和控制点。
- `MoveableControls`：绑定当前元素 DOM，拖动、缩放、旋转后提交 JSON patch。
- `PropertyPanel`：编辑文本、字号、颜色、背景、边框、阴影。
- `deckOperations`：统一处理 `updateElement`、`moveElement`、`duplicateElement`、`deleteElement`，给 undo/redo 和 AI 共用。

## 13. 导入流程设计

1. 用户选择 HTML。
2. DOMPurify 清洗，禁用脚本执行。
3. 用 `DOMParser` 找 `[data-deck]`。
4. 找所有 `[data-slide]`。
5. 找每页 `[data-element]`。
6. 读取 `data-type`、`id`、inline style。
7. 将 `left/top/width/height/transform/font-size/color/background` 映射到 JSON。
8. Zod 校验。
9. 不符合 schema 的节点转为 `HtmlElement locked`，或整页转为锁定背景。
10. 生成 `deck.json`，进入编辑器。

MVP 约束：

- 元素必须是 `position:absolute`。
- slide 必须固定 `width:1600px;height:900px`，或可等比换算。

## 14. 编辑流程设计

- 点击 iframe 内 `[data-element]`，通过 `postMessage` 或同源 iframe DOM 事件通知父页面。
- 父页面设置 `selectedElementId`。
- overlay 根据元素 JSON 坐标显示选框。
- 拖动时临时更新 transform，拖动结束提交 `updateElement({ x, y })`。
- 属性面板直接改 JSON。
- iframe 由 JSON 重新渲染，或对当前元素做局部 style patch。
- undo/redo 存 operation，不存整份 HTML。

## 15. 导出流程设计

### JSON 导出

直接下载 `deck.json`。

### HTML 导出

`renderDeckHtml(deck)` 生成单文件：

- 内联基础 CSS。
- 每页输出 `<section data-slide>`。
- 每个元素输出 `<div data-element data-type="...">`。
- 保留 `window.__DECK_JSON__`，方便再次导入。

### PPTX 后续导出

- text -> `slide.addText`
- image -> `slide.addImage`
- shape -> `slide.addShape`
- 复杂 html -> 先 rasterize 成图片
- px 换算到 16:9 PPT 宽屏尺寸，例如 13.333 x 7.5 inches。

## 16. AI 协作流程设计

AI 不直接修改 HTML，而是输出操作：

```json
[
  {
    "op": "replace",
    "path": "/slides/2/elements/0/style/fontSize",
    "value": 56
  }
]
```

或更友好的领域操作：

```json
{
  "type": "updateElement",
  "slideId": "slide-3",
  "elementId": "title",
  "patch": { "style": { "fontSize": 56 } }
}
```

流程：

1. 用户说“把第三页标题调大一点”。
2. 系统给 AI 当前 `deck.json` 的压缩上下文。
3. AI 返回 JSON Patch 或 deck operation。
4. Zod 校验。
5. 应用 patch。
6. 重新渲染预览。
7. 保存操作历史，便于撤销和审计。

## 17. 第一版开发计划

1. 搭 Next.js 项目，做三栏编辑器壳。
2. 定义 `Deck` schema、demoDeck、Zod validator。
3. 实现 JSON -> HTML renderer，并用 iframe `srcDoc` 预览。
4. 实现左侧缩略图和 slide 切换。
5. 实现 iframe 元素点击选择。
6. 接入 `react-moveable`，支持拖动元素。
7. 实现右侧属性面板，支持文本、字号、颜色、背景。
8. 实现保存 JSON。
9. 实现导出单文件 HTML。
10. 实现受约束 HTML 导入。
11. 补基础测试：schema parse、HTML import、HTML export snapshot。
12. 用 demo deck 手动验收完整流程。

## 18. 最小可运行原型代码方案

```bash
pnpm create next-app ai-html-slides-editor --ts --app
cd ai-html-slides-editor
pnpm add zod zustand react-moveable dompurify nanoid file-saver
pnpm dev
```

第一版只需要 5 个核心模块：

- `demoDeck.ts`：内置 3 页 demo。
- `deck.ts`：定义 schema 和类型。
- `renderDeckHtml.ts`：把 JSON 渲染成单文件 HTML 字符串。
- `SlideIframe.tsx`：用 iframe 展示当前 slide。
- `PropertyPanel.tsx` + `useDeckStore.ts`：修改 JSON 并触发预览刷新。

验收标准：

- 可以打开 demo deck。
- 左侧显示 slide 缩略图。
- 点击 slide 可以切换当前页。
- 中间显示当前 slide。
- 可以点击选择元素。
- 可以编辑文本。
- 可以拖动元素。
- 可以修改字号、颜色、背景。
- 可以保存为 JSON。
- 可以导出为单文件 HTML。

## 19. 当前结论

MVP 不应该做普通 HTML 编辑器。它应该先成为一个受约束 HTML Slides + JSON schema 编辑器。

任意 HTML 只作为导入素材或锁定背景处理。这样才能同时解决可视化编辑、稳定导出、AI 后续理解这三个问题。

## 20. 补充判断：Agent 适配、人工编辑与 PPT-like 能力

### Agent skills 适配

格式化 HTML / 受约束 HTML 的创建可以适配 Codex、Claude Code、Cursor、Windsurf、Continue 等主流 agent，但核心不应绑定某个 agent 的 skill 格式。

推荐把项目规范拆成 agent 无关的公共协议：

- `deck.schema.json`：中间 JSON schema。
- `constrained-html-spec.md`：受约束 HTML 生成规范。
- `examples/`：合格 deck 的 JSON 与 HTML 示例。
- `validator`：校验 AI 生成结果是否符合规范。
- `renderer`：JSON -> HTML 的确定性渲染器。
- `AGENTS.md`、`CLAUDE.md`、`SKILL.md`：面向不同 agent 的指令包装。

这样不同 agent 只是接入方式不同，产物仍然进入同一套 schema、校验器和渲染器。

### 无 AI 接入时的人工编辑能力

项目不依赖 AI 才能使用。AI 只是生成初稿和辅助修改的入口，编辑器本体应该完整支持人工调整。

无 AI 接入时，用户仍应能完成：

- 打开 demo deck 或导入受约束 HTML。
- 切换页面。
- 选择元素。
- 编辑文本。
- 拖动、缩放、旋转。
- 修改字体、字号、颜色、背景、边框、阴影。
- 替换图片。
- 保存 JSON。
- 导出 HTML。

因此产品定位应是“可视化 slides 编辑器 + AI 友好的结构层”，不是“必须联网调用 AI 的生成工具”。

### PPT-like 能力边界

项目可以逐步做到类似 PPT 的能力，但要分阶段处理。

MVP 应支持：

- 文本。
- 图片。
- 基础形状。
- 背景。
- 拖拽、缩放、旋转。
- 图层顺序。
- HTML 导出。

第二阶段可支持：

- 视频、音频、iframe 等媒体嵌入。
- 字体管理与 `@font-face` 嵌入。
- SVG 形状、箭头、线条。
- 基础进入/退出动画。
- 图层面板和对齐辅助线。

第三阶段再考虑：

- PPTX 导出。
- PPT-like 动画时间轴。
- 母版、主题、版式系统。
- 高级图表和复杂交互组件。

HTML 端实现这些能力并不困难，难点在于把它们做成稳定可编辑、可导出、可被 AI 理解的结构。因此仍应以 JSON schema 为主模型，HTML 作为渲染和发布结果。
