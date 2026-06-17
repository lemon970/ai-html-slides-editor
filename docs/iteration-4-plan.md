# 第四轮迭代计划：AI HTML 源码直编模式

日期：2026-06-17  
分支基准：`codex/practical-usability-task-1-4`（commit `4ed07a0`）

---

## 一、核心发现：实际 AI HTML 与已有编辑器完全不兼容

通过分析两份真实 AI 生成的 HTML PPT（贪心算法课件、食堂仿真展示），发现其结构特征：

| 特征 | 实际 AI HTML | 我们的 JSON schema |
|---|---|---|
| 幻灯片容器 | `<section class="slide dark/light">` | `[data-slide]` 标记 |
| 内部布局 | Flexbox / CSS Grid | `position:absolute` + px 坐标 |
| 字号单位 | `vw`、`vh`、`max(15px, 1.2vw)` | 固定 px |
| 配色系统 | CSS 变量 `--ink`、`--paper` | JSON 属性 |
| 翻页机制 | JS `deck.style.transform=translateX(...)` | 无（我们渲染静态列表） |
| 图片 | base64 内联 | URL 引用 |

**结论：现有解析器（`parseConstrainedHtml`）对这类文件报错、无法导入；即使强行导入，重新渲染后视觉效果会完全破坏，无法使用。**

---

## 二、方向修正：双轨道架构

不强迫所有 HTML 统一进入 JSON schema，而是区分两种模式：

```
导入文件
  ├─ 含 window.__DECK_JSON__  →  JSON Schema 模式（现有功能完整保留）
  ├─ 含 [data-deck]/[data-slide]  →  JSON Schema 模式（现有功能）
  └─ 其他 AI HTML（如上述两类文件）  →  Source HTML 模式（本轮新增）
```

**Source HTML 模式的核心原则：**
- 不转换、不重渲染，原始 HTML 始终是唯一数据源
- 用 iframe 展示真实视觉效果（WebGL 背景、CSS 动画全部保留）
- 文字修改直接操作 DOM，不经过 JSON
- 导出 = 把修改后的 DOM 序列化回 HTML 字符串

---

## 三、验收标准

| 场景 | 期望行为 |
|---|---|
| 打开 app | 显示导入引导页（拖放 / 点击选文件），不默认进入 demo deck |
| 拖入任意 AI HTML | 自动检测模式，显示幻灯片列表和第一页预览 |
| Source HTML 模式下查看幻灯片 | iframe 渲染原始效果，WebGL/动画/字体全部正常 |
| 点击左侧缩略图 | 切换到对应 slide，右侧显示该 slide 的文本列表 |
| 在文本面板修改某段文字 | 内容即时更新到 iframe，导出后文件也反映修改 |
| 修改主题色 | 实时更新 CSS 变量，iframe 刷新 |
| 导出 | 下载修改后的完整 HTML，在浏览器直接打开效果正确 |
| 导入自己格式的 HTML | 走 JSON Schema 模式，现有编辑功能不受影响 |

---

## 四、任务详解

### 任务 0：入口重构（Import Landing Page）

**问题**：应用启动直接进入 demo deck，不符合"拿到 AI HTML 就要能用"的主流程。

**方案**：`page.tsx` 判断 `useDeckStore` 的 `mode` 字段：
- `mode === "idle"` → 显示 `ImportLanding` 组件
- `mode === "json"` → 显示现有 `AppShell`
- `mode === "source-html"` → 显示新的 `SourceHtmlShell`

`ImportLanding` 组件（`src/components/ImportLanding.tsx`）：
- 全屏拖放区域（`ondragover`、`ondrop`）
- "选择文件"按钮
- "使用示例演示"链接（直接进入 JSON 模式的 demo deck）
- 支持格式说明：AI HTML / 我们导出的 HTML / JSON

**改动文件**：
- `src/app/page.tsx`
- `src/components/ImportLanding.tsx`（新建）
- `src/store/useDeckStore.ts` — 增加 `mode: "idle" | "json" | "source-html"` 字段及 `loadSourceHtml` action

---

### 任务 1：Source HTML 模式 — 核心 store

**新增 `useSourceHtmlStore`（`src/store/useSourceHtmlStore.ts`）：**

```ts
type SourceHtmlStore = {
  fileName: string;
  rawHtml: string;              // 原始 HTML 字符串（不可变，用于 reset）
  doc: Document;                // 当前可编辑的 DOM（DOMParser 解析，修改都在这里）
  slideElements: HTMLElement[]; // 所有 section.slide 元素的引用
  currentIndex: number;         // 当前幻灯片下标
  cssVars: Record<string, string>;  // 解析出的 :root CSS 变量
  
  load: (html: string, fileName: string) => void;
  setCurrentIndex: (i: number) => void;
  updateText: (path: SlideTextPath, value: string) => void;
  updateCssVar: (name: string, value: string) => void;
  serialize: () => string;      // 导出 HTML 字符串
};
```

**`load` 实现**：
```ts
load: (html, fileName) => {
  const doc = new DOMParser().parseFromString(html, "text/html");
  const slideElements = [...doc.querySelectorAll<HTMLElement>("section.slide, .slide")];
  const cssVars = parseCssVars(doc);
  set({ fileName, rawHtml: html, doc, slideElements, currentIndex: 0, cssVars });
}
```

**`parseCssVars`**：
```ts
// 提取 :root { --ink: #0a1f3d; --paper: #f1f3f5; ... }
function parseCssVars(doc: Document): Record<string, string> {
  const style = [...doc.querySelectorAll("style")]
    .map(s => s.textContent ?? "").join("\n");
  const match = style.match(/:root\s*\{([^}]*)\}/);
  if (!match) return {};
  return Object.fromEntries(
    [...match[1].matchAll(/--([a-z-]+)\s*:\s*([^;]+)/g)]
      .map(m => [`--${m[1].trim()}`, m[2].trim()])
  );
}
```

**`serialize` 实现**：
```ts
serialize: () => {
  const { doc } = get();
  return "<!DOCTYPE html>\n" + doc.documentElement.outerHTML;
}
```

**改动文件**：
- `src/store/useSourceHtmlStore.ts`（新建）
- `src/core/import/detectSourceHtmlMode.ts`（新建）— 判断 HTML 是 JSON 模式还是 Source HTML 模式

---

### 任务 2：Source HTML Shell — 幻灯片导航与 iframe 预览

**`SourceHtmlShell.tsx`**（`src/components/source-html/SourceHtmlShell.tsx`）：

布局：
```
┌─────────────────────────────────────────────────────┐
│  topbar：文件名 + [预览] [导出] [返回]按钮             │
├──────────┬──────────────────────────┬───────────────┤
│ 幻灯片   │                          │  文本编辑面板  │
│ 缩略图   │   iframe（当前幻灯片）    │  + 主题色面板  │
│ 导航栏   │                          │               │
└──────────┴──────────────────────────┴───────────────┘
```

**幻灯片缩略图**（`SlideThumbList.tsx`）：
- 用 `<iframe>` 渲染每个 slide HTML 片段作为缩略图（或截图备用）
- 简化方案：为每个 slide 生成一个缩略图 iframe，使用相同的 CSS，scale 到小尺寸

**主预览区** (`SourceHtmlPreview.tsx`)：
- `<iframe>` 的 `srcDoc` = `serialize()` 完整 HTML
- 每次用户修改文本或 CSS 变量后，通过 `postMessage` 或直接更新 `srcDoc` 刷新
- 问题：每次重建 iframe 会丢失 WebGL 背景状态 → **优化方案**：iframe 内用 JS bridge 热更新 DOM，只在必要时重建

实现方案（轻量）：
```
预览 iframe 加载完成后：
  window.addEventListener("message", e => {
    if (e.data.type === "updateText") {
      // 找到对应 DOM 节点更新 textContent
    }
    if (e.data.type === "updateVar") {
      document.documentElement.style.setProperty(e.data.name, e.data.value);
    }
  });
```

父组件通过 `iframe.contentWindow.postMessage` 发送更新，避免重建 iframe。

**改动文件**：
- `src/components/source-html/SourceHtmlShell.tsx`（新建）
- `src/components/source-html/SourceHtmlPreview.tsx`（新建）
- `src/components/source-html/SlideThumbList.tsx`（新建）

---

### 任务 3：文本提取与快速编辑面板

**文本提取算法**（`src/core/source-html/extractText.ts`）：

目标：从单个 `<section class="slide">` 元素中提取所有可编辑文本节点：
```ts
type SlideTextNode = {
  path: number[];        // 在 slide DOM 中的访问路径
  tagName: string;       // 元素标签
  className: string;     // 元素 CSS 类
  text: string;          // 当前文本内容
  isLeaf: boolean;       // 是否是纯文本叶节点
};

function extractTextNodes(slideEl: HTMLElement): SlideTextNode[]
```

过滤规则：
- 跳过 `<canvas>`、`<script>`、`<style>`、`<img>` 和纯空白节点
- 只提取 `textContent.trim().length > 0` 的叶节点
- `<pre>`、`<code>` 块单独作为一个条目（整体编辑）

**TextEditPanel 组件**（`src/components/source-html/TextEditPanel.tsx`）：

```tsx
function TextEditPanel() {
  const { slideElements, currentIndex, updateText } = useSourceHtmlStore();
  const slide = slideElements[currentIndex];
  const textNodes = useMemo(() => extractTextNodes(slide), [slide]);
  
  return (
    <div className="text-edit-panel">
      {textNodes.map((node, i) => (
        <div key={i} className="text-edit-row">
          <span className="text-edit-tag">{node.className || node.tagName}</span>
          <textarea
            defaultValue={node.text}
            onBlur={e => updateText(node.path, e.target.value)}
          />
        </div>
      ))}
    </div>
  );
}
```

**`updateText` store action**：
```ts
updateText: (path, value) => {
  const { doc, slideElements, currentIndex } = get();
  const slide = slideElements[currentIndex];
  let node: Element = slide;
  for (const idx of path) node = node.children[idx] as Element;
  node.textContent = value;
  // 触发 iframe postMessage 更新
  get().notifyIframe({ type: "updateText", path, slideIndex: currentIndex, value });
}
```

**改动文件**：
- `src/core/source-html/extractText.ts`（新建）
- `src/components/source-html/TextEditPanel.tsx`（新建）

---

### 任务 4：CSS 变量主题编辑器

**目标**：让用户快速调整 AI HTML 的主题配色，不需要改代码。

两个 AI HTML 的主题关键变量：
```css
--ink: #0a1f3d;        /* 深色文字/背景 */
--paper: #f1f3f5;      /* 浅色文字/背景 */
--paper-tint: #e4e8ec; /* 浅色变体 */
--ink-tint: #152a4a;   /* 深色变体 */
```

**ThemeVarPanel 组件**（`src/components/source-html/ThemeVarPanel.tsx`）：
- 过滤出 `cssVars` 中以颜色值开头的变量（`#` 开头）
- 每个变量显示颜色选择器 + 文字名称
- `onChange` → `updateCssVar` → `postMessage` 到 iframe 实时预览
- 只显示主要变量（ink、paper 及其变体），不展示 `--mono`、`--serif-zh` 等字体变量

**`updateCssVar` store action**：
```ts
updateCssVar: (name, value) => {
  const { doc } = get();
  // 修改 doc 中 :root 的 CSS 变量值
  const styleEls = [...doc.querySelectorAll("style")];
  for (const el of styleEls) {
    const current = el.textContent ?? "";
    const updated = current.replace(
      new RegExp(`(${name.replace("--", "--")}\\s*:\\s*)[^;]+`),
      `$1${value}`
    );
    if (updated !== current) { el.textContent = updated; break; }
  }
  // 通知 iframe
  get().notifyIframe({ type: "updateVar", name, value });
  set({ cssVars: { ...get().cssVars, [name]: value } });
}
```

**改动文件**：
- `src/components/source-html/ThemeVarPanel.tsx`（新建）

---

### 任务 5：导出与返回

**导出**：
- Toolbar "导出 HTML" → `useSourceHtmlStore.getState().serialize()` → 下载
- 文件名：原文件名（去除路径）

**返回**：
- Toolbar "返回" → `useDeckStore` 重置 `mode` 为 `"idle"` → 回到导入页
- 提示确认（修改会丢失）

---

## 五、需要注意的边界情况

| 场景 | 处理方式 |
|---|---|
| base64 图片（文件几十 MB） | 直接传给 iframe 即可，不解析图片，性能由浏览器处理 |
| WebGL canvas 背景 | iframe 里 JS 正常运行，不干预 |
| `<pre class="deck-code">` 代码块 | 提取为整体文本节点，警告用户编辑可能破坏代码格式 |
| 同一 slide 内文本节点数量很多 | TextEditPanel 只展示直接文本子元素（不递归所有子孙），超过 20 条显示折叠按钮 |
| iframe 跨域限制 | srcDoc 方案同源，不存在跨域问题 |
| slide 不用 `section.slide` 而用其他选择器 | 检测降级：尝试 `.slide`、`[data-slide]`、`section` 等，选最多匹配数的方案 |

---

---

### 任务 A（顺带，低成本）：内置 AI 生成提示词模板

**背景**：对于从零新建演示文稿的场景，最高效的路径是让 AI 直接按我们的受约束结构生成 HTML，生成结果可以无损导入 JSON Schema 模式，获得完整编辑能力，而不需要 Source HTML 模式的有限编辑。

**方案**：在 `ImportLanding` 页面增加"用 AI 新建"入口，点击后显示一个弹窗，内含可复制的提示词模板。

**提示词模板内容**：
```
请生成一份关于「[在此填写主题]」的 HTML 演示文稿。

严格遵循以下结构，不要偏离：

<!DOCTYPE html>
<html lang="zh-CN">
<head><meta charset="utf-8"><title>[标题]</title></head>
<body>
<div data-deck id="[deck-id]" style="--deck-width:1600;--deck-height:900">

  <section data-slide id="slide-1" style="width:1600px;height:900px;position:relative;background:#ffffff;">
    <div data-element data-element-id="[唯一ID]" data-type="text"
         style="position:absolute;left:Xpx;top:Ypx;width:Wpx;height:Hpx;
                font-size:Npx;color:#000000;font-weight:bold;">
      标题文字
    </div>
    <!-- 更多元素 -->
  </section>

  <!-- 更多页面，每页重复 section 结构 -->

</div>
<script>window.__DECK_JSON__ = null;</script>
</body>
</html>

约束说明：
- 每个 section 固定 1600×900px，背景写在 style 里
- 每个元素必须有 data-element、data-element-id（全局唯一）、data-type（text/image/shape）
- 所有坐标和尺寸用 px，position:absolute
- 图片用 data-type="image"，内部放 <img src="..." />
- 形状用 data-type="shape"，加 data-shape="rect" 或 "ellipse"
- 不要加任何 JavaScript 动画或交互
```

**涉及文件**：
- `src/components/ImportLanding.tsx` — 增加"用 AI 新建"按钮和提示词弹窗
- `src/components/PromptModal.tsx`（新建，可选）— 可复制提示词的对话框

**验收**：点击"用 AI 新建" → 弹窗显示提示词 → 点击复制 → 关闭弹窗

---

## 六、不做（本轮延后）

- Source HTML 模式下的幻灯片拖拽重排（缩略图点击已够用）
- 代码块（`.deck-code`）的语法高亮编辑
- CSS 类名批量替换（改字体、间距等）
- AI 接口（发给 Claude 修改）
- Source HTML 与 JSON Schema 模式互转
- `--ink-rgb`、`--paper-rgb` 的自动同步（用户修改 `--ink` 后自动计算 rgb 分量）

---

## 七、执行顺序

```
任务0（ImportLanding）
  → 任务1（useSourceHtmlStore + 模式检测）
  → 任务2（SourceHtmlShell + iframe 预览）
  → 任务3（文本提取 + TextEditPanel）
  → 任务4（CSS 变量主题编辑）
  → 任务5（导出 + 返回）
```

每个任务完成后可独立验证：
- 任务 0+1：能导入文件并显示 Shell
- 任务 2：iframe 正确渲染 AI HTML
- 任务 3：右侧面板列出文字，修改后 iframe 刷新
- 任务 4：改颜色实时生效
- 任务 5：导出文件在浏览器打开后修改已生效
