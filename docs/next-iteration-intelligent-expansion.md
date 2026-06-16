# 下一轮迭代资料收集与目标撰写：个人可部署的 Canva-like HTML Slides 编辑工具

日期：2026-06-16

关联文档：

- `docs/ai-html-slides-editor-research.md`
- `docs/mvp-implementation-roadmap.md`
- `docs/refinement-system-roadmap.md`

## 1. 当前方向调整

下一轮不做 AI API 接入、不做自然语言编辑、不做云端协作，也不把“智能生成”作为产品主线。

当前目标调整为：

> 做成一个个人可部署、可长期使用的本地 HTML Slides 可视化编辑工具。用户可以导入 AI 或其他工具生成的受约束 HTML slides，也可以直接手动创建和编辑 slides，最终导出 JSON / HTML；长期目标是打包为 EXE 安装程序。

这里的“AI HTML Slides”只表示内容来源之一，不表示本工具本轮要接入模型。工具本身应先具备完整的人为编辑能力：页面管理、画布编辑、素材插入、模板复用、图层管理、样式调整、媒体嵌入、动画配置、导出检查。

本轮判断：

- 先把产品做成可靠的个人工具，再考虑 AI 自动化。
- 先把手动编辑体验做好，再做命令化、自动化或智能化。
- 先保证 JSON schema 稳定，再扩展导入导出。
- 先保证 Web 版本地可用，再预留桌面 EXE 打包路径。

## 2. 资料收集结论

### Canva / 可画

参考点：

- 可画的价值不只在 AI，而在于低门槛编辑：模板、素材、拖拽、图层、组合、对齐、动画、演示播放。
- Brand Kit / 品牌套件适合长期作为主题系统参考，但本轮不必做完整品牌管理。
- 图层、组合、对齐、锁定、动画是 PPT-like / Canva-like 工具的基础能力，不依赖 AI。
- 媒体库和模板库可以显著降低从空白页开始创作的成本。

资料：

- Canva 可画 PPT 制作: https://www.canva.cn/presentations/
- Canva Brand Kit: https://www.canva.com/help/brand-kit/
- Canva 图层、组合、对齐: https://www.canva.com/help/layer-group-align/
- Canva 动画: https://www.canva.com/help/animate-designs/

### Figma / Figma Slides

参考点：

- Figma 的优势是图层、组件、样式 token、直接操控和属性面板之间的配合。
- Figma Slides 的方向说明演示文稿也可以使用设计工具式工作流。
- 变量和设计系统适合作为后续主题 token、组件 preset 的参考。

资料：

- Figma Slides: https://www.figma.com/slides/
- Figma Variables: https://help.figma.com/hc/en-us/articles/15339657135383-Guide-to-variables-in-Figma
- Figma Design Systems: https://www.figma.com/design-systems/

### tldraw / Excalidraw

参考点：

- tldraw / Excalidraw 的 canvas 交互经验适合参考：选择、框选、缩放、拖拽、工具模式、快捷键、资产管理。
- 当前项目已经有固定 16:9 slide schema，不建议中途切换成 tldraw 内核。
- 可以借鉴它们的能力边界和交互模型，而不是直接替换现有编辑器。

资料：

- tldraw SDK: https://github.com/tldraw/tldraw
- tldraw Assets: https://tldraw.dev/releases/v2.4.0
- Excalidraw Element Skeleton: https://docs.excalidraw.com/docs/%40excalidraw/excalidraw/api/excalidraw-element-skeleton
- Excalidraw Libraries: https://libraries.excalidraw.com/

### 媒体、动画与导出

参考点：

- HTML slides 的优势是天然支持 video、audio、iframe、Lottie、CSS animation 等内容。
- 媒体和动画不应散落在 HTML/CSS 中，应进入 JSON schema，导出时统一渲染。
- PPTX 导出可以作为后续能力，但不应成为本轮主线；HTML 高保真导出优先。

资料：

- LottieFiles Web Player: https://lottiefiles.com/tools/web-player
- Lottie format docs: https://lottiefiles.github.io/lottie-docs/
- Rive State Machine: https://rive.app/docs/editor/state-machine
- PptxGenJS: https://gitbrent.github.io/PptxGenJS/docs/introduction/

### 桌面 EXE 打包

参考点：

- 本轮不实现 EXE，但从现在开始应避免把项目写死为纯浏览器 demo。
- 后续可选 Electron 或 Tauri：
  - Electron：生态成熟，适合 Next.js 桌面壳，体积较大。
  - Tauri：体积小，系统 WebView，文件系统能力需要通过 Tauri API 接入。
- 为了后续平滑打包，应提前抽象文件读写、资产路径和导出逻辑，避免业务代码直接依赖浏览器临时状态。

## 3. 下一轮产品定位

下一轮定位：

> 一个本地优先的 HTML Slides 编辑器：提供接近 PPT / Canva / 可画的手动编辑体验，支持导入受约束 HTML、编辑结构化 JSON、管理素材和模板，并导出可独立播放的单文件 HTML。

产品重点：

- 手动编辑优先，而不是 AI 自动改稿。
- 本地项目优先，而不是云端账户体系。
- 结构化 JSON 优先，而不是直接操作任意 DOM。
- HTML 高保真导出优先，而不是完整 PPTX 兼容。
- Web 版先稳定，EXE 打包后置。

## 4. 本轮核心目标

### 目标 1：把画布编辑做成可日常使用

需要实现：

- 多选。
- 框选。
- 组合 / 取消组合。
- 锁定 / 解锁。
- 复制 / 粘贴 / 删除。
- 键盘快捷键。
- 图层面板。
- 对齐参考线。
- 吸附到画布边缘、中心线和其他元素。
- 页面缩放、适应窗口。

验收标准：

- 用户可以不依赖右侧数值输入完成常见排版。
- 多个元素可以整体移动、缩放、对齐、组合。
- 复杂页面可以通过图层面板定位和管理元素。

### 目标 2：补齐内容创建能力

需要实现：

- 左侧面板 tab 化：Pages / Elements / Templates / Assets。
- 基础元素插入：文本、图片占位、矩形、圆形、线条、标签、卡片。
- 页面模板插入：封面、目录、图文、三卡片、时间线、数据页、总结页。
- 图片资源上传、复用、替换。
- 背景设置：纯色、渐变、图片。
- 保存当前元素或页面为本地模板，至少预留数据结构。

验收标准：

- 用户可以从空白页直接创建一页 slide。
- 用户可以从模板快速插入新页面。
- 用户上传的图片能作为元素图片或页面背景使用。

### 目标 3：增强样式和主题基础

需要实现：

- 更完整的文字样式：字体、字号、字重、斜体、颜色、对齐、行高、字距、内边距。
- 填充、边框、圆角、阴影。
- 页面背景和元素背景统一编辑。
- 初步 theme tokens：颜色、字体、圆角、阴影。
- 一键把当前样式保存为 preset，后续可复用。

验收标准：

- 常见 PPT 样式调整不需要改代码。
- 导出 HTML 和重新导入后，样式不丢失。
- 新增模板和元素可以复用基础 token。

### 目标 4：扩展媒体和动画基础能力

本轮做基础，不做复杂时间轴。

需要实现：

- video 元素。
- audio 元素。
- iframe/embed 元素。
- Lottie 元素的 schema 预留，视复杂度决定是否实现渲染。
- 元素动画 schema：入场、强调、退场。
- 简单动画属性：类型、时长、延迟。
- 播放模式基础版：按页预览导出的演示效果。

验收标准：

- HTML 导出可以播放基础媒体。
- 动画配置进入 JSON，而不是只写死在 CSS class。
- 不做复杂关键帧编辑，不做完整时间轴。

### 目标 5：让项目真正适合个人部署和使用

需要实现：

- 明确的本地项目文件格式：`deck.json`。
- 支持打开 / 保存 JSON。
- 支持导出单文件 HTML。
- 支持导出 project package 的结构预留：`deck.json` + assets + renderer。
- 导出前检查：缺失图片、文本溢出、资源过大、外链资源提示。
- README 补充个人部署和使用说明。
- 预留桌面壳适配层：文件系统、资源路径、导出目录不要散落在组件里。

验收标准：

- 不接任何云服务也能完整使用。
- 用户可以保存工程、重新打开继续编辑。
- 导出的 HTML 能独立打开和演示。
- 后续接 Electron / Tauri 时不需要重写核心编辑器。

## 5. 明确不做的内容

下一轮不做：

- AI API 接入。
- 自然语言编辑。
- Agent 自动改稿。
- 云端账号、云端素材库、协同编辑。
- 完整 PPTX 导入导出。
- 复杂动画时间轴。
- 桌面 EXE 安装包。
- 插件市场或在线模板市场。

这些能力可以保留架构入口，但不进入本轮验收。

## 6. 推荐优先级

### Phase A：编辑器基础交互

优先级最高。

任务：

- 多选和框选。
- 多元素 TransformBox。
- 组合 / 取消组合。
- 图层面板。
- 快捷键。
- 对齐参考线和吸附。

原因：

- 这是所有手动编辑体验的基础。
- 没有多选、图层和快捷键，工具仍然只是属性表单编辑器。

### Phase B：素材、模板和资产

任务：

- 左侧面板 tab 化。
- 基础元素插入。
- 页面模板插入。
- 图片资源上传和复用。
- 图片背景编辑。

原因：

- 让用户能从零创建内容，而不是只能修改已有 demo。
- 为后续媒体、动画和主题系统准备入口。

### Phase C：项目文件和导出可靠性

任务：

- `deck.json` 打开 / 保存。
- 单文件 HTML 导出增强。
- project package 数据结构预留。
- 导出前检查。
- README 使用说明更新。

原因：

- 个人可部署工具必须先解决保存、打开、导出和回退。
- 后续桌面 EXE 本质上也是围绕这些文件能力包装。

### Phase D：媒体和动画基础

任务：

- video/audio/iframe 元素。
- animation schema。
- 简单动画面板。
- 播放模式基础版。

原因：

- HTML slides 相比 PPT 的优势在这里。
- 本轮只做基础配置，不做复杂时间轴。

### Phase E：主题和 preset

任务：

- theme tokens。
- 样式 preset。
- 一键应用基础主题。

原因：

- 可以提升多页一致性。
- 不必做完整 Brand Kit，先做个人使用够用的主题功能。

## 7. 数据结构升级建议

### Deck

```ts
type Deck = {
  version: string;
  id: string;
  title: string;
  size: {
    width: number;
    height: number;
  };
  slides: Slide[];
  assets?: Asset[];
  theme?: ThemeTokens;
  templates?: Template[];
  metadata?: {
    createdAt?: string;
    updatedAt?: string;
    source?: "manual" | "constrained-html" | "json";
  };
};
```

### SelectionState

选择状态不进入 `deck.json`，只存在编辑器运行态。

```ts
type SelectionState = {
  slideId: string;
  selectedElementIds: string[];
  activeGroupId?: string;
};
```

### Group

短期继续使用 flat 结构，不做嵌套 group。

```ts
type SlideElement = BaseElement & {
  groupId?: string;
  locked?: boolean;
  hidden?: boolean;
};
```

后续如需嵌套组，再引入 `GroupElement`。

### Asset

```ts
type Asset = {
  id: string;
  type: "image" | "video" | "audio" | "font" | "lottie";
  name: string;
  src: string;
  storage: "data-url" | "external-url" | "project-file";
  size?: number;
  mimeType?: string;
  width?: number;
  height?: number;
};
```

### MediaElement

```ts
type MediaElement = BaseElement & {
  type: "video" | "audio" | "embed" | "lottie";
  src: string;
  autoplay?: boolean;
  controls?: boolean;
  loop?: boolean;
  muted?: boolean;
};
```

### Animation

```ts
type Animation = {
  id: string;
  targetId: string;
  phase: "enter" | "emphasis" | "exit";
  preset: "fade" | "slide" | "zoom" | "wipe";
  durationMs: number;
  delayMs: number;
  easing?: "linear" | "ease" | "ease-in" | "ease-out" | "ease-in-out";
};
```

### ThemeTokens

```ts
type ThemeTokens = {
  colors: Record<string, string>;
  fonts: Record<string, string>;
  radii: Record<string, number>;
  shadows: Record<string, string>;
};
```

## 8. 下一轮任务拆分

### Task 1：升级 selection state

**Description:** 把当前单选 `selectedElementId` 升级为 `selectedElementIds`，保留单选交互。

**Acceptance criteria:**

- [ ] 点击元素可单选。
- [ ] Shift/Ctrl 点击可多选。
- [ ] 点击空白取消选择。
- [ ] 属性面板能区分未选、单选、多选。

**Verification:**

- [ ] 单元测试 selection reducer。
- [ ] 浏览器手动验证单选和多选。

### Task 2：实现框选

**Description:** 在画布空白区域拖动时显示 selection marquee，选中落入矩形范围的元素。

**Acceptance criteria:**

- [ ] 拖动空白区域出现框选矩形。
- [ ] 松手后选中框内元素。
- [ ] 不影响拖动元素和缩放元素。

**Verification:**

- [ ] 浏览器验证不同缩放比例下框选准确。

### Task 3：实现多元素 TransformBox

**Description:** 多选后显示整体 bounding box，支持整体拖动和缩放。

**Acceptance criteria:**

- [ ] 多选元素显示统一外框。
- [ ] 拖动外框移动全部元素。
- [ ] 缩放外框按比例更新全部元素。
- [ ] 锁定元素不参与变换。

**Verification:**

- [ ] 几何测试覆盖多元素 bounds。
- [ ] 浏览器手动验证移动和缩放。

### Task 4：实现组合 / 取消组合

**Description:** 使用 flat `groupId` 实现基础组合，不做 nested group。

**Acceptance criteria:**

- [ ] 多选后可组合。
- [ ] 选择组合内任意元素时可识别组。
- [ ] 可整体移动组。
- [ ] 可取消组合。
- [ ] 导出 HTML 保持视觉一致。

**Verification:**

- [ ] 单元测试 group operations。
- [ ] 浏览器手动验证组合、移动、取消组合。

### Task 5：实现图层面板

**Description:** 新增 Layers panel，显示当前 slide 的元素列表。

**Acceptance criteria:**

- [ ] 显示元素名称、类型、可见性、锁定状态。
- [ ] 点击图层可选中元素。
- [ ] 可调整 zIndex。
- [ ] 可锁定 / 解锁。
- [ ] 可隐藏 / 显示。

**Verification:**

- [ ] 浏览器验证图层选择、排序、锁定、隐藏。

### Task 6：实现快捷键

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

### Task 7：实现对齐参考线和吸附

**Description:** 拖动和缩放时显示参考线，并吸附到 slide 中心线、边缘和其他元素边缘。

**Acceptance criteria:**

- [ ] 显示水平 / 垂直参考线。
- [ ] 吸附到画布中心和边缘。
- [ ] 吸附到其他元素边缘和中心。
- [ ] 可通过 Alt 暂时关闭吸附。

**Verification:**

- [ ] 几何测试覆盖 snap 计算。
- [ ] 浏览器手动验证吸附手感。

### Task 8：左侧面板 tab 化

**Description:** 左侧从单一 slide list 变成 Pages / Elements / Templates / Assets。

**Acceptance criteria:**

- [ ] Pages 保留当前缩略图。
- [ ] Elements 显示基础元素。
- [ ] Templates 显示内置页面模板。
- [ ] Assets 显示用户导入资源。

**Verification:**

- [ ] 浏览器手动切换 tab。

### Task 9：实现基础元素插入

**Description:** 支持从 Elements 插入文本、图片占位、矩形、圆形、线条、标签、卡片。

**Acceptance criteria:**

- [ ] 点击元素 preset 插入当前 slide。
- [ ] 插入元素自动选中。
- [ ] 插入位置合理。
- [ ] 新元素可继续编辑样式。

**Verification:**

- [ ] 单元测试 addElement operation。
- [ ] 浏览器手动验证插入和编辑。

### Task 10：实现页面模板插入

**Description:** 内置 6-8 个页面模板，插入后成为新 slide。

**Acceptance criteria:**

- [ ] 支持封面、目录、图文、三卡片、时间线、数据、总结模板。
- [ ] 插入模板后可继续编辑所有元素。
- [ ] 模板使用基础 theme tokens。

**Verification:**

- [ ] schema 校验模板。
- [ ] 浏览器手动插入模板。

### Task 11：实现资产面板基础版

**Description:** 管理当前 deck 的本地图片资源，并为媒体扩展预留字段。

**Acceptance criteria:**

- [ ] 可上传图片。
- [ ] 图片进入 assets 列表。
- [ ] 可插入为图片元素。
- [ ] 可设置为 slide 背景。
- [ ] 导出 HTML 可正常显示图片。

**Verification:**

- [ ] 浏览器手动上传、插入、设为背景、导出。

### Task 12：实现本地工程打开 / 保存

**Description:** 让用户可以保存 `deck.json`，后续重新打开继续编辑。

**Acceptance criteria:**

- [ ] 可保存当前 deck 为 JSON。
- [ ] 可打开本地 JSON。
- [ ] 打开后页面、元素、资产、主题信息保留。
- [ ] 运行态 selection 不写入 JSON。

**Verification:**

- [ ] 保存 JSON 后重新导入，内容一致。
- [ ] `pnpm test`。

### Task 13：增强 HTML 导出和导出前检查

**Description:** 在导出前检测常见问题，并保证单文件 HTML 可独立播放。

**Acceptance criteria:**

- [ ] 导出前提示文本溢出。
- [ ] 提示缺失图片或外链资源。
- [ ] 提示资源体积过大。
- [ ] 导出 HTML 包含 `window.__DECK_JSON__`。
- [ ] 导出 HTML 可独立打开。

**Verification:**

- [ ] 浏览器导出再打开。
- [ ] 导出 HTML 再导入。
- [ ] `pnpm build`。

### Task 14：媒体和动画 schema 基础

**Description:** 增加 video/audio/embed 和 animation schema，并先实现最小渲染。

**Acceptance criteria:**

- [ ] 可插入 video/audio/embed 元素。
- [ ] 导出 HTML 能渲染媒体元素。
- [ ] 元素可配置基础动画 preset。
- [ ] 动画配置进入 JSON。

**Verification:**

- [ ] 浏览器播放导出的媒体。
- [ ] 导出后动画配置仍存在。

### Task 15：桌面打包预留层

**Description:** 不做 EXE，但把文件和导出逻辑整理成后续可被 Electron / Tauri 调用的接口。

**Acceptance criteria:**

- [ ] 文件打开、保存、导出逻辑不散落在 React 组件中。
- [ ] 有 `core/project` 或类似目录封装 project IO。
- [ ] README 记录未来桌面打包路线。
- [ ] 不引入桌面运行时依赖。

**Verification:**

- [ ] `pnpm test`。
- [ ] `pnpm build`。
- [ ] 手动验证 Web 版行为不变。

## 9. 验收标准

下一轮完成时，至少满足：

- 用户可以多选、框选、组合、锁定、隐藏元素。
- 用户可以通过图层面板管理复杂页面。
- 用户可以用快捷键完成复制、粘贴、删除、微调、组合。
- 拖动时有参考线和吸附。
- 用户可以从左侧插入基础元素和页面模板。
- 用户可以上传图片资源、替换图片、设置背景图。
- 用户可以保存 `deck.json`，重新打开继续编辑。
- 用户可以导出单文件 HTML，并独立打开播放。
- 不需要 AI API、不需要登录、不需要云服务。
- 自动化测试和生产构建通过。

## 10. 风险和取舍

| 风险 | 影响 | 处理 |
| --- | --- | --- |
| 过早做 AI 接入 | 调试不可控，产品主线发散 | 本轮不做 AI，只保留结构化 JSON |
| 一次做完整桌面 EXE | 打包、文件权限、资源路径问题会拖慢主线 | 本轮只做 Web 工具和桌面预留层 |
| 直接做 nested group | 数据结构复杂，导出导入困难 | 先做 flat `groupId` |
| 模板库过大 | 变成素材工程，影响编辑器主线 | 先内置 6-8 个高频模板 |
| 吸附逻辑影响拖动手感 | 用户感觉卡顿 | 提供 Alt 暂停吸附 |
| Data URL 资源过大 | HTML 体积失控 | assets 面板显示大小，导出前检查 |
| 媒体格式过多 | 渲染和导出兼容性复杂 | 本轮先做 video/audio/embed，Lottie 可预留 |
| 功能堆叠导致 UI 杂乱 | 体验下降 | 左侧 tab、右侧 inspector、顶部工具栏分区 |

## 11. 最终 EXE 路线

EXE 不是本轮目标，但最终路线建议如下：

### Stage 1：本地 Web 工具

- Next.js / React / TypeScript。
- 浏览器中完成编辑、保存 JSON、导出 HTML。
- 适合开发和早期个人使用。

### Stage 2：本地项目模式

- 明确 `.deck.json` / assets / export 的工程结构。
- 所有文件读写通过项目服务层封装。
- Web 版仍可用。

### Stage 3：桌面壳

- 选择 Electron 或 Tauri。
- React 编辑器继续复用。
- 桌面壳只负责窗口、菜单、文件系统、最近项目、导出目录。

### Stage 4：安装包

- Windows EXE 安装包。
- 本地配置目录。
- 最近打开项目。
- 可选自动更新。

当前开发时需要遵守：

- 不把业务逻辑写进浏览器下载按钮里。
- 不把资产路径假设为永久 Data URL。
- 不把编辑器状态和项目文件混在一起。
- 不引入必须联网的功能作为主流程。

## 12. 推荐下一步

下一步先做 Phase A + Phase C 的最小闭环：

1. `selectedElementIds` 多选状态。
2. 框选。
3. 多元素 transform。
4. groupId 组合。
5. 图层面板。
6. 快捷键。
7. 吸附和参考线。
8. `deck.json` 打开 / 保存。
9. 导出前检查。

这条路线完成后，工具会从“可编辑 demo”变成“个人可用的本地编辑器”。随后再进入 Elements / Templates / Assets / Media / Animation，会更容易控制范围。
