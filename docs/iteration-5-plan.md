# 第五轮迭代计划：拓展 JSON Schema 编辑器的可编辑范围

日期：2026-06-17  
分支基准：`codex/practical-usability-task-1-4`（commit `799d74a`）

---

## 一、重新定位：Source HTML 是兼容层，不是目标

项目的终极目标（见 `ai-html-slides-editor-research.md`）：

> 一个面向 AI 生成 HTML Slides 的结构化可视化编辑器：AI 负责生成表达力强的 HTML/JSON，用户用类似 PPT/Figma 的 UI 编辑，系统再稳定导出 HTML，并预留 PPTX 与 AI 二次修改能力。

**两条轨道的定位**：

| 轨道 | 作用 | 发展方向 |
|---|---|---|
| JSON Schema 编辑器 | 核心产品：完整拖拽、属性编辑、图层、导出 | 持续投入，做成 Canva-like |
| Source HTML 模式 | 兼容层：渲染复杂 AI HTML，提供基础文字/颜色编辑 | 维持现状，不再扩展深度 |

**当前 Source HTML 模式的天花板**：每新增一个编辑功能都要独立实现（布局、添加元素、动画……），永远追不上 JSON Schema 编辑器的完整性。

**正确路径**：用 AI 一次性把任意 HTML 转换为 JSON Schema 格式，然后所有编辑在 JSON Schema 编辑器里完成。编辑器边界通过扩展 JSON Schema 能力来拓展，而不是靠 Source HTML 模式一个功能一个功能地堆砌。

---

## 二、核心机制：AI 作为导入预处理器

```
用户拿到任意 HTML（AI 生成 / 其他工具 / 自己写的）
  ↓
从项目获取"转换提示词"（一次操作）
  ↓
交给自己的 AI（Claude / GPT 等），AI 输出 JSON Schema 格式 HTML
  ↓
导入项目 → 进入完整 JSON Schema 编辑器
  ↓
所有后续编辑都在 JSON Schema 编辑器里完成（拖拽、图层、属性面板……）
```

用户只需操作一次（转换），之后完全在我们的编辑器里工作，不需要反复借助外部 AI。

---

## 三、两类转换目标

### 目标 A：JSON Schema 格式（主推）

进入完整编辑器，获得全部已有和未来的编辑能力。

目标 HTML 结构：
```html
<!DOCTYPE html>
<html>
<body>
<div data-deck id="deck-1" style="--deck-width:1600;--deck-height:900">

  <section data-slide id="slide-1"
           style="width:1600px;height:900px;position:relative;background:#1a1a2e;">

    <div data-element data-element-id="el-1-1" data-type="text"
         style="position:absolute;left:120px;top:80px;width:1000px;height:120px;
                font-size:56px;font-weight:bold;color:#e0e0e0;">
      标题文字
    </div>

    <div data-element data-element-id="el-1-2" data-type="text"
         style="position:absolute;left:120px;top:240px;width:1200px;height:400px;
                font-size:28px;color:#aaa;line-height:1.6;">
      正文内容
    </div>

    <!-- 图片元素 -->
    <div data-element data-element-id="el-1-3" data-type="image"
         style="position:absolute;left:900px;top:100px;width:500px;height:350px;">
      <img src="..." style="width:100%;height:100%;object-fit:cover;" />
    </div>

  </section>

</div>
<script>window.__DECK_JSON__ = null;</script>
</body>
</html>
```

约束（AI 必须遵守）：
- 每页固定 1600×900px，`position:relative`
- 每个可编辑元素有 `data-element`、全局唯一 `data-element-id`、`data-type`（text/image/shape）
- 所有坐标和尺寸用 px，`position:absolute`
- 不保留任何 JS 动画（可保留 CSS transition/animation）
- 结尾加 `<script>window.__DECK_JSON__ = null;</script>`

### 目标 B：Source HTML 格式（保底方案）

当原始 HTML 有复杂 WebGL / Canvas 背景或高度定制 CSS 动画，转换为 JSON Schema 会丢失效果时使用。用户进入 Source HTML 模式，能做文字/颜色编辑。

这是降级路径，不是主推方向。

---

## 四、转换提示词设计（核心交付物）

### 提示词 A-1：通用结构转换（任意 HTML → JSON Schema）

```
你是一个 HTML 演示文稿格式转换工具。
将下方的 HTML 转换为以下指定格式，只返回完整 HTML，不要任何解释。

目标格式规则：
1. 根容器：<div data-deck id="deck-1" style="--deck-width:1600;--deck-height:900">
2. 每页：<section data-slide id="slide-N" style="width:1600px;height:900px;position:relative;background:[背景色]">
3. 每个视觉元素：<div data-element data-element-id="el-页号-序号" data-type="text|image|shape" style="position:absolute;left:Xpx;top:Ypx;width:Wpx;height:Hpx;[样式]">内容</div>
4. 结尾：<script>window.__DECK_JSON__ = null;</script>
5. 坐标单位全部用 px，不用 vw/vh/%/em
6. 每个 data-element-id 在全文中唯一
7. 不保留任何 JavaScript 动画，但保留 CSS 动画（@keyframes、transition）

原 HTML：
[粘贴你的 HTML]
```

---

### 提示词 A-2：Reveal.js / Slidev / Marp 导出 HTML 转换

```
你是一个 HTML 演示文稿格式转换工具。
下方是一个 [Reveal.js/Slidev/Marp] 导出的 HTML 演示文稿。
将它转换为以下格式，只返回完整 HTML，不要任何解释。

目标格式：
- <div data-deck id="deck-1" style="--deck-width:1600;--deck-height:900"> 作为根
- 每页 <section data-slide id="slide-N" style="width:1600px;height:900px;position:relative;">
- 每个可编辑元素 <div data-element data-element-id="唯一ID" data-type="text|image|shape" style="position:absolute;left:Xpx;top:Ypx;width:Wpx;height:Hpx;">
- 结尾 <script>window.__DECK_JSON__ = null;</script>
- 所有坐标转换为 px，绝对定位
- 保留原有配色和字体

原 HTML：
[粘贴你的 HTML]
```

---

### 提示词 B：保留视觉效果的 Source HTML 格式转换

```
你是一个 HTML 演示文稿格式转换工具。
下方的 HTML 有复杂动画/特效，转换时保留所有视觉效果。
只将幻灯片容器结构规范化，返回完整 HTML，不要任何解释。

目标格式：
- 所有颜色值移到 :root { } CSS 变量（--ink、--paper 等语义命名）
- 每页用 <section class="slide"> 包裹
- 所有 section.slide 放在 <div id="deck"> 内
- 添加翻页函数：
  var total=document.querySelectorAll('.slide').length;
  function goTo(i){document.getElementById('deck').style.transform='translateX('+(-(i*100/total))+'%)';}
  window.__goTo=goTo;
- 保留所有 CSS 动画、背景效果、字体、JavaScript 交互

原 HTML：
[粘贴你的 HTML]
```

---

### 提示词 C：从零生成 JSON Schema 格式新 PPT

```
生成一份关于「[主题]」的 HTML 演示文稿，共 [N] 页，风格 [简约/科技/学术/商务]。

严格遵循以下格式：

<div data-deck id="deck-1" style="--deck-width:1600;--deck-height:900">
  <section data-slide id="slide-1" style="width:1600px;height:900px;position:relative;background:#fff;">
    <div data-element data-element-id="el-1-1" data-type="text"
         style="position:absolute;left:120px;top:80px;width:1000px;height:100px;
                font-size:56px;font-weight:bold;color:#1a1a1a;">标题</div>
  </section>
</div>
<script>window.__DECK_JSON__ = null;</script>

规则：
- data-element-id 格式为 el-页号-序号，全局唯一
- 所有尺寸用 px，position:absolute
- 不加 JavaScript 动画
- 每页至少包含标题和内容元素
- 直接返回 HTML，不要解释
```

---

## 五、项目配合工作

### 5.1 格式检测 + 转换引导（ImportLanding）

当前 `detectSourceHtmlMode` 只检测是否是 JSON Schema 或 Source HTML。

扩展逻辑：
```
导入 HTML
  ├─ 含 window.__DECK_JSON__ 或 data-deck  →  JSON Schema 模式
  ├─ 含 section.slide + window.__goTo      →  Source HTML 模式
  └─ 其他格式                              →  显示"格式转换引导"弹窗
       ├─ Tab A：转换为 JSON Schema（推荐，获得完整编辑能力）
       └─ Tab B：转换为 Source HTML（保留视觉效果，编辑有限）
       每个 Tab 显示对应提示词，一键复制
       底部："已转换，重新导入"按钮
```

### 5.2 ImportLanding 增加"用 AI 新建"入口

显示提示词 C，让用户不需要有已有文档也能开始。

### 5.3 Source HTML 模式增加"升级到完整编辑器"工具

在 `SourceHtmlShell` 工具栏增加按钮：显示提示词 A-1（以当前文件为上下文），引导用户把 Source HTML 转换为 JSON Schema 格式，再重新导入获得完整编辑能力。

---

## 六、任务拆分

### Task 1：格式检测扩展 + 转换引导弹窗

**文件**：`src/core/import/detectSourceHtmlMode.ts`（扩展三分支逻辑）、`src/components/ImportLanding.tsx`

**验收**：
- 导入不符合任何已知格式的 HTML 时弹出引导弹窗
- 弹窗含提示词 A-1 和提示词 B，可切换，可一键复制
- "重新导入"按钮可用

**范围**：Small-Medium

---

### Task 2：ImportLanding "用 AI 新建"弹窗

**文件**：`src/components/ImportLanding.tsx`

**验收**：
- 点击"用 AI 新建" → 弹窗显示提示词 C
- 一键复制
- 关闭后回到导入页

**范围**：Small

---

### Task 3：Source HTML 模式"升级到完整编辑器"

**文件**：`src/components/source-html/SourceHtmlShell.tsx`

**验收**：
- 工具栏有"升级为可编辑格式"按钮
- 点击显示提示词 A-1（含使用说明）
- 一键复制

**范围**：Small

---

## 七、不做（本轮）

- 项目内接任何 AI API
- 自动解析任意 HTML 格式（不可控）
- Source HTML 模式新增编辑功能（止步于当前能力）
- PPTX 导入

---

## 八、与长期路线的关系

本轮工作是长期目标的输入扩展层：

```
[任意 HTML]
    ↓ AI 转换（本轮提示词）
[JSON Schema HTML]
    ↓ 导入
[JSON Schema 编辑器]（第三、四、五轮持续建设中）
    ↓
[完整 Canva-like 编辑体验]（终极目标）
```

所有编辑器能力的投入都集中在 JSON Schema 编辑器这一条线上，Source HTML 模式不再是发展方向。
