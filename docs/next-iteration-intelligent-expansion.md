# 下一轮迭代资料收集与目标撰写：智能化 Canva-like 创作系统

日期：2026-06-16

关联文档：

- `docs/ai-html-slides-editor-research.md`
- `docs/mvp-implementation-roadmap.md`
- `docs/refinement-system-roadmap.md`

## 1. 当前判断

当前项目已经从 MVP 进入“可编辑 HTML slides”的阶段，第二阶段补齐了文本框缩放、背景编辑、字体排版、图片替换、基础图层对齐和 HTML 导入导出一致性。

下一轮不应继续只补单点控件，而应把产品方向推进为：

> 一个面向 AI HTML Slides 的 Canva-like 智能演示创作工作台。

这里的 Canva-like 不是复刻 Canva / 可画，而是参考它的产品结构：用户用直接操控完成精细编辑，用素材和模板快速搭建，用品牌系统保持一致，用 AI/智能操作降低重复劳动。

## 2. 资料收集

### Canva / 可画

参考点：

- Canva AI 支持把 AI 设计变成可编辑布局、在编辑器中生成元素、把设计和 AI 放在同一个工作流中。
- Canva 的演示文稿产品强调模板、媒体库、拖拽编辑、演示交付。
- Canva Brand Kit 把品牌 logo、颜色、字体和素材集中管理，用于团队设计一致性。
- Canva 支持元素分层、组合、对齐、位置调整。
- Canva 动画能力以页面或元素为对象，通过编辑器工具栏应用、修改或移除动画。

资料：

- Canva AI: https://www.canva.com/canva-ai/
- Canva AI 创建演示文稿: https://www.canva.com/create/ai-presentations/
- Canva 可画 PPT 制作: https://www.canva.cn/presentations/
- Canva Brand Kit: https://www.canva.com/help/brand-kit/
- Canva 图层、组合、对齐: https://www.canva.com/help/layer-group-align/
- Canva 动画: https://www.canva.com/help/animate-designs/

### Figma / Figma Slides

参考点：

- Figma Slides 已经把 AI 放入演示工作流，包括 AI 搜索、扩展图片、分离图像对象等。
- Figma Make 强调 AI 生成后仍可直接编辑、调整 copy、替换图片、修改 padding/margin，并可复制为设计图层继续迭代。
- Figma 变量和设计系统用于管理可复用的颜色、字体、间距等 token。

资料：

- Figma Slides AI: https://help.figma.com/hc/en-us/articles/31433930664215-Use-AI-Tools-in-Figma-Slides
- Figma Make: https://www.figma.com/make/
- Figma Variables: https://help.figma.com/hc/en-us/articles/15339657135383-Guide-to-variables-in-Figma
- Figma Design Systems: https://www.figma.com/design-systems/

### tldraw / Excalidraw

参考点：

- tldraw 提供完整 canvas app 基础，可自定义 shapes、tools、bindings 和 UI。
- tldraw 的 asset store 思路适合后续管理图片、视频、字体等大资源。
- Excalidraw 的 element skeleton / customData 思路适合简化程序化创建元素，并为元素保留扩展数据。
- Excalidraw Libraries 说明“可复用素材库”对用户创作效率很重要。

资料：

- tldraw SDK: https://github.com/tldraw/tldraw
- tldraw Assets: https://tldraw.dev/releases/v2.4.0
- Excalidraw Element Skeleton: https://docs.excalidraw.com/docs/%40excalidraw/excalidraw/api/excalidraw-element-skeleton
- Excalidraw customData: https://docs.excalidraw.com/docs/%40excalidraw/excalidraw/api/props
- Excalidraw Libraries: https://libraries.excalidraw.com/

### 动画与媒体

参考点：

- Lottie 是 JSON 向量动画格式，适合轻量嵌入 HTML slides。
- Rive 的 state machine 面向交互动画，适合长期做更强的互动演示组件。
- PptxGenJS 支持 JavaScript 生成 PPTX，文本、图片、形状、表格、图表、媒体等可以按结构化 JSON 映射。

资料：

- LottieFiles Web Player: https://lottiefiles.com/tools/web-player
- Lottie format docs: https://lottiefiles.github.io/lottie-docs/
- Rive State Machine: https://rive.app/docs/editor/state-machine
- PptxGenJS: https://gitbrent.github.io/PptxGenJS/docs/introduction/

## 3. 下一轮产品定位

下一轮目标：

> 从“可视化编辑器”升级为“智能演示创作工作台”：用户可以像 Canva / 可画一样管理页面、素材、模板、图层和品牌样式，同时能通过 AI-friendly JSON operations 完成智能修改。

重点变化：

- 从单元素编辑，升级到多对象工作流。
- 从手动调属性，升级到“属性面板 + 快捷操作 + 智能建议”。
- 从 demo deck，升级到模板、素材、品牌和组件体系。
- 从 HTML 导出，升级到多格式导出和可复用工程结构。
- 从“AI 可接入”，升级到“AI 能稳定理解并执行编辑意图”。

## 4. 本轮核心目标

### 目标 1：提升画布编辑效率

需要实现：

- 多选。
- 框选。
- 组合 / 取消组合。
- 锁定 / 解锁。
- 复制 / 粘贴 / 删除。
- 键盘快捷键。
- 对齐参考线。
- 吸附到画布、元素、中心线。
- 图层面板。
- 页面缩放和适应窗口。

判断标准：

- 用户不依赖右侧输入框，也能完成大部分排版。
- 多个元素的移动、对齐、组合足够顺手。
- 编辑体验接近轻量 Canva / Figma，而不是表单编辑器。

### 目标 2：建立素材与模板系统

需要实现：

- 左侧从单一 slide 缩略图升级为多 tab：页面、素材、模板、组件。
- 内置基础素材：文本块、图片、形状、线条、图标、卡片、按钮、标签。
- 模板插入：封面页、目录页、图文页、三卡片页、时间线页、数据页、总结页。
- 元素 presets：标题、正文、quote、badge、image card、stat card。
- 用户可以把当前元素或页面保存为组件/模板。

判断标准：

- 用户不用从空白页开始搭建。
- AI 生成的结构可以和模板/组件复用。
- 后续可以把模板库作为 agent skills 的输出约束。

### 目标 3：建立品牌与主题系统

需要实现：

- Brand Kit / Theme Tokens。
- 颜色 token：primary、secondary、accent、background、text、muted。
- 字体 token：headingFont、bodyFont、monoFont。
- 间距、圆角、阴影 token。
- 一键应用主题到 deck。
- 一键替换品牌色。
- 检测未使用 token 的“游离样式”。

判断标准：

- 用户可以让一套 slides 保持统一风格。
- AI 后续修改时优先使用 token，而不是随意写 hex 和 fontFamily。
- 导出 HTML 仍保留 token 信息。

### 目标 4：接入智能编辑操作层

不一定马上接真实 AI API，但要先做智能操作接口。

需要实现：

- Command Palette。
- Operation schema。
- Intent -> Operation 的本地规则引擎。
- 自然语言操作预留入口。
- 操作预览 / 应用 / 撤销。
- 智能选择：选择当前页标题、选择所有图片、选择所有同色元素。
- 批量修改：统一改标题字号、统一替换主题色、统一添加阴影。
- Design Checker：检查文本溢出、对齐不一致、颜色过多、字体过多、低对比度。

判断标准：

- 用户说“把所有标题调大一点”时，系统有明确 operation 目标。
- 即使不接 AI，也能用规则和命令面板完成批量智能操作。
- 接 AI 后，只需要让 AI 生成 operations，不让 AI 直接改 DOM。

### 目标 5：扩展媒体和动效能力

需要实现：

- video 元素。
- audio 元素。
- iframe/embed 元素。
- Lottie 元素。
- 页面转场。
- 元素入场 / 强调 / 退场动画。
- 简单动画面板：类型、时长、延迟、触发方式。
- 演示播放模式。

判断标准：

- HTML 端可以表达比 PPT 更强的互动内容。
- 动画配置进入 JSON，而不是散落在 CSS class。
- 导出 HTML 可独立播放。

### 目标 6：增强导出与工程化

需要实现：

- 导出单文件 HTML。
- 导出 project package：`deck.json` + assets + HTML renderer。
- 导出 PNG/PDF。
- 初步 PPTX 导出。
- 导出前检查。
- 资源体积报告。
- 缺失字体 / 缺失图片提示。

判断标准：

- 用户知道导出物是否可靠。
- 大文件和 Data URL 不再不可控。
- PPTX 不追求全量高保真，先支持文本、图片、基础形状、背景图。

## 5. 推荐优先级

下一轮不要一次做完所有目标。建议按以下顺序：

### Phase A：画布效率基础

优先级最高。

任务：

- 多选和框选。
- 组合 / 取消组合。
- 键盘快捷键。
- 图层面板。
- 对齐参考线和吸附。

原因：

- 这些能力是 Canva / Figma 类编辑器的基础。
- 没有多选和图层，后续模板、组件、智能批量操作都会受限。

### Phase B：素材和模板系统

任务：

- 左侧面板 tab 化。
- 基础元素插入。
- 页面模板插入。
- 元素 presets。
- 保存为组件。

原因：

- 用户体验会明显从“编辑已有内容”变成“创作新内容”。
- 模板系统也能反向约束 AI 输出。

### Phase C：主题和品牌系统

任务：

- theme tokens。
- Brand Kit UI。
- 一键套用主题。
- 游离样式检测。

原因：

- 演示文稿最容易出现风格不统一。
- 主题系统是智能化修改的稳定基础。

### Phase D：智能操作层

任务：

- Command Palette。
- Operation schema。
- 本地规则操作。
- Design Checker。
- AI 编辑入口预留。

原因：

- 先做可验证的本地智能操作，再接 AI。
- 避免直接接模型导致结果不可控。

### Phase E：媒体、动画和导出增强

任务：

- video/audio/iframe/Lottie。
- 动画 schema。
- 播放模式。
- PNG/PDF/PPTX 初步导出。

原因：

- 这些功能价值高，但依赖前面的 schema、资产和导出系统。

## 6. 下一轮建议实际落地范围

建议下一轮只做到 Phase A + Phase B 的基础版。

交付目标：

- 画布体验明显更像 Canva / 可画。
- 用户能从素材和模板开始创建 slide。
- 多元素编辑不再痛苦。
- 为智能操作和品牌系统打基础。

不建议下一轮就做：

- 真 AI API 接入。
- 完整 PPTX 导出。
- 协同编辑。
- 复杂动画时间轴。
- 云端素材库。

## 7. 数据结构升级建议

### GroupElement

```ts
type GroupElement = BaseElement & {
  type: "group";
  children: SlideElement[];
};
```

短期可以先不做嵌套 group，而是使用：

```ts
groupId?: string;
```

这样更容易和现有 flat elements 兼容。

### Asset

```ts
type Asset = {
  id: string;
  type: "image" | "video" | "audio" | "font" | "lottie";
  name: string;
  src: string;
  size?: number;
  mimeType?: string;
};
```

### Template

```ts
type Template = {
  id: string;
  name: string;
  category: "cover" | "content" | "data" | "timeline" | "closing";
  slide: Slide;
};
```

### Theme Tokens

```ts
type ThemeTokens = {
  colors: Record<string, string>;
  fonts: Record<string, string>;
  spacing: Record<string, number>;
  radii: Record<string, number>;
  shadows: Record<string, string>;
};
```

### Operation

```ts
type DeckOperation =
  | { type: "selectElements"; slideId: string; elementIds: string[] }
  | { type: "alignElements"; slideId: string; elementIds: string[]; mode: "left" | "center" | "right" | "top" | "middle" | "bottom" }
  | { type: "groupElements"; slideId: string; elementIds: string[]; groupId: string }
  | { type: "applyTheme"; themeId: string }
  | { type: "replaceStyleToken"; token: string; value: string }
  | { type: "insertTemplate"; afterSlideId: string; templateId: string };
```

## 8. 下一轮任务拆分

## Task 1：定义多选和 selection state

**Description:** 把当前单选 `selectedElementId` 升级为 `selectedElementIds`，保留单选兼容。

**Acceptance criteria:**

- [ ] 点击元素可单选。
- [ ] Shift/Ctrl 点击可多选。
- [ ] 点击空白取消选择。
- [ ] 属性面板能区分未选、单选、多选。

**Verification:**

- [ ] 单元测试 selection reducer。
- [ ] 浏览器手动验证多选。

## Task 2：实现框选

**Description:** 在画布空白区域拖动时显示 selection marquee，选中落入矩形范围的元素。

**Acceptance criteria:**

- [ ] 拖动空白区域出现框选矩形。
- [ ] 松手后选中框内元素。
- [ ] 缩略图不触发框选。

**Verification:**

- [ ] 浏览器手动验证不同缩放比例下框选准确。

## Task 3：实现多元素 TransformBox

**Description:** 多选后显示整体 bounding box，可整体拖动和缩放。

**Acceptance criteria:**

- [ ] 多选元素显示统一外框。
- [ ] 拖动外框移动全部元素。
- [ ] 缩放外框按比例更新全部元素。

**Verification:**

- [ ] 几何测试覆盖多元素 bounds。
- [ ] 浏览器手动验证。

## Task 4：实现组合 / 取消组合

**Description:** 先使用 flat `groupId` 实现组，不做 nested group。

**Acceptance criteria:**

- [ ] 多选后可组合。
- [ ] 选择组时可整体移动。
- [ ] 可取消组合。
- [ ] 导出 HTML 保持视觉一致。

**Verification:**

- [ ] 单元测试 group operations。
- [ ] 浏览器手动验证。

## Task 5：实现图层面板

**Description:** 右侧或左侧新增 Layers panel，显示当前 slide 元素列表。

**Acceptance criteria:**

- [ ] 显示元素名称、类型、可见性、锁定状态。
- [ ] 点击图层可选中元素。
- [ ] 可拖动调整 zIndex。
- [ ] 可锁定 / 解锁。

**Verification:**

- [ ] 浏览器手动验证图层选择、排序、锁定。

## Task 6：实现快捷键

**Description:** 补齐基础编辑快捷键。

**Acceptance criteria:**

- [ ] Delete 删除。
- [ ] Ctrl/Cmd + C 复制。
- [ ] Ctrl/Cmd + V 粘贴。
- [ ] Ctrl/Cmd + D 复制并偏移。
- [ ] Arrow 微调位置。
- [ ] Shift + Arrow 大步移动。
- [ ] Ctrl/Cmd + G 组合。
- [ ] Ctrl/Cmd + Shift + G 取消组合。

**Verification:**

- [ ] 浏览器手动验证快捷键。

## Task 7：实现对齐参考线和吸附

**Description:** 拖动和缩放时显示参考线，并吸附到 slide 中心线、边缘和其他元素边缘。

**Acceptance criteria:**

- [ ] 显示水平 / 垂直参考线。
- [ ] 吸附到画布中心和边缘。
- [ ] 吸附到其他元素边缘和中心。
- [ ] 可通过 Alt 暂时关闭吸附。

**Verification:**

- [ ] 几何测试覆盖 snap 计算。
- [ ] 浏览器手动验证。

## Task 8：左侧面板 tab 化

**Description:** 左侧从单一 slide list 变成 Pages / Templates / Elements / Assets。

**Acceptance criteria:**

- [ ] Pages 保留当前缩略图。
- [ ] Templates 显示内置页面模板。
- [ ] Elements 显示基础元素。
- [ ] Assets 显示用户导入资源。

**Verification:**

- [ ] 浏览器手动切换 tab。

## Task 9：实现基础元素插入

**Description:** 支持从 Elements 插入文本、图片占位、矩形、圆形、线条、标签、卡片。

**Acceptance criteria:**

- [ ] 点击元素 preset 插入当前 slide。
- [ ] 插入元素自动选中。
- [ ] 插入位置合理，不覆盖中心主体过多。

**Verification:**

- [ ] 单元测试 addElement operation。
- [ ] 浏览器手动验证。

## Task 10：实现页面模板插入

**Description:** 内置 6-8 个页面模板，插入后成为新 slide。

**Acceptance criteria:**

- [ ] 支持封面、目录、图文、三卡片、时间线、数据、总结模板。
- [ ] 插入模板后可继续编辑所有元素。
- [ ] 模板使用 theme tokens。

**Verification:**

- [ ] schema 校验模板。
- [ ] 浏览器手动插入模板。

## Task 11：实现资产面板基础版

**Description:** 管理当前 deck 的本地图片资源。

**Acceptance criteria:**

- [ ] 可上传图片。
- [ ] 图片进入 assets 列表。
- [ ] 可拖入或点击插入 slide。
- [ ] 导出 HTML 可正常显示图片。

**Verification:**

- [ ] 浏览器手动上传和插入。

## Task 12：更新导出和导入

**Description:** 让新增多选、groupId、assets、templates 不破坏导出导入。

**Acceptance criteria:**

- [ ] `window.__DECK_JSON__` 包含新增字段。
- [ ] 导出 HTML 可独立打开。
- [ ] 再导入后 selection 相关临时状态不进入 deck。

**Verification:**

- [ ] `pnpm test`
- [ ] `pnpm build`
- [ ] 浏览器导出再导入。

## 9. 验收标准

下一轮完成时，至少满足：

- 用户可以多选、框选、组合、锁定元素。
- 用户可以通过图层面板管理复杂页面。
- 用户可以用快捷键完成复制、粘贴、删除、微调、组合。
- 拖动时有参考线和吸附。
- 用户可以从左侧插入基础元素和页面模板。
- 用户可以上传图片资源并复用。
- 导出 HTML 和再导入不丢主要结构。
- 自动化测试和生产构建通过。

## 10. 风险和取舍

| 风险 | 影响 | 处理 |
| --- | --- | --- |
| 过早做 AI API | 结果不可控，调试困难 | 先做 operation schema 和本地命令 |
| 直接做 nested group | 数据结构复杂，导出导入困难 | 先做 flat `groupId` |
| 模板库过大 | 变成设计素材工程 | 先内置 6-8 个高频模板 |
| 吸附逻辑影响拖动手感 | 用户感觉卡顿 | 提供 Alt 暂停吸附 |
| Data URL 资源过大 | HTML 体积失控 | assets 面板显示大小，后续支持 package 导出 |
| 功能堆叠导致 UI 杂乱 | 体验下降 | 左侧 tab + 右侧 inspector + 顶部快捷工具分区 |

## 11. 推荐下一步

下一步先做 Phase A：

1. `selectedElementIds` 多选状态。
2. 框选。
3. 多元素 transform。
4. groupId 组合。
5. 图层面板。
6. 快捷键。
7. 吸附和参考线。

做完 Phase A 后，编辑体验会明显接近 Canva / Figma 类工具。再进入模板、素材和智能操作层，收益更稳定。
