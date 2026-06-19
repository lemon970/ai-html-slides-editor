# 第九轮迭代计划：演示与动效收口（动画系统 + 转场 + 演讲者备注 + 演示增强）

日期：2026-06-18  
分支基准：`codex/practical-usability-task-1-4`（commit `dc50085`）

---

## 一、定位

第八轮完成了可靠性收口：安全渲染、草稿不破坏数据、Source HTML 容错、媒体资源库第一版。验证链路已恢复，`pnpm test` / `pnpm build` 全绿。

第八轮文档第五节原计划"第九轮进入媒体能力扩展"。本轮对路线顺序做一次微调，**先补"演示与动效"这条体验主线，媒体扩展顺延第十轮**。理由：

- 动画、转场、演讲者备注都是纯 CSS / 纯 UI 改动，**不引入任何二进制资产**，与第八轮刚加固的草稿安全（4MB 体积限制、图片省略策略）零冲突。
- 媒体扩展里的字体嵌入会把字体二进制塞进 deck，直接加剧草稿体积问题。宜等存储层（localStorage → IndexedDB）升级后再做，避免第八轮的省略逻辑被反复打补丁。
- 演讲者备注的 `notes` 字段在 schema 早已存在（`deck.ts:130`），但全代码库无任何 UI 使用——这是 gap backlog 里明确的"留下轮"欠债，本轮零成本接线补齐。
- 项目的核心路径是"AI 生成 → 导入 → 编辑 → 导出 → 演示"。前四段已通，**演示段目前只有翻页，没有备注、计时、动画**，是闭环上最薄的一环。

本轮目标：让导出的 HTML 能动起来，让演示模式像样，把动画作为新的可编辑能力纳入 schema。

---

## 二、本轮范围

### A. 元素动画系统

#### A1 schema 扩展

在 `baseElementSchema` 增加可选 `animations` 字段，不动现有字段语义。

```ts
// deck.ts 扩展
const animationTypeSchema = z.enum([
  "fade",        // 淡入/淡出
  "slide-up",    // 从下上方滑入
  "slide-down",
  "slide-left",
  "slide-right",
  "scale",       // 缩放放大
  "zoom-in",     // 从小到大
  "spin",        // 旋转入场
]);

const animationDefSchema = z.object({
  type: animationTypeSchema,
  duration: z.number().positive().default(0.6),   // 秒
  delay: z.number().min(0).default(0),            // 秒
  easing: z.enum(["ease", "ease-in", "ease-out", "ease-in-out", "linear"]).default("ease-out"),
});

const elementAnimationsSchema = z.object({
  entrance: animationDefSchema.optional(),
  exit: animationDefSchema.optional(),
  emphasis: animationDefSchema.optional(),        // 强调，演示时点击触发
});

// baseElementSchema.extend({ animations: elementAnimationsSchema.optional() })
```

`deckSchema.version` 保持 `"0.1"`。新增字段全部 optional，旧 deck 无需迁移即可加载。

#### A2 渲染层

动画的渲染分两种场景，行为不同：

| 场景 | 行为 |
|---|---|
| 编辑器内 | **不自动播放**。仅当用户在动画面板点"预览"时，临时给元素加 class 播放一次。避免编辑时元素乱跳。 |
| 导出 HTML | entrance 自动播放（页面加载 / 翻到该页时）；emphasis 绑定点击触发；exit 暂不在导出触发（留下轮做顺序编排）。 |

实现：

- `src/core/render/renderDeckHtml.ts` 导出时，若任一元素含 `animations`，在 `<style>` 注入 keyframes 与工具 class（`anim-fade`、`anim-slide-up` 等），并给元素加 `data-anim-entrance` 等属性。
- 入场触发：用极简内联 JS（`<script>` 由 safeHtml 之外、deck 自身的播放脚本注入，**不经过元素 html 字段**，因此不受净化影响）监听翻页，给当前页元素加 `is-visible` class 触发 animation。
- 编辑器内预览：`ElementRenderer` 读取 `animations.entrance`，在"预览"动作下临时挂 class，`animationend` 后移除。

#### A3 动画面板

属性面板新增"动画"分区（仅当选中元素时显示）：

- 三个开关：入场 / 退场 / 强调（择一配置即可，不强制互斥）
- 每个开关下：类型下拉、时长、延迟、缓动
- "预览"按钮：在画布上播放一次当前配置
- 清除按钮

#### A4 文件改动

- `src/core/schema/deck.ts` — 增加 `animationDefSchema` / `elementAnimationsSchema`，扩展 `baseElementSchema`
- `src/core/render/renderDeckHtml.ts` — 注入 keyframes + 动画触发脚本
- `src/core/render/animationStyles.ts`（新建）— 纯函数：由 `ElementAnimations` 生成 class 名与内联 CSS
- `src/components/editor/ElementRenderer.tsx` — 预览动画的临时 class 挂载
- `src/components/editor/PropertyPanel.tsx`（或新建 `AnimationPanel.tsx`）— 动画编辑 UI
- `src/core/commands/editorCommands.ts` — 新增 `set-element-animations` 命令
- `src/styles/editor.css` — 动画面板样式

---

### B. 页面转场

#### B1 schema 扩展

`slideSchema` 增加可选 `transition`：

```ts
const slideTransitionSchema = z.object({
  type: z.enum(["none", "fade", "slide", "push"]).default("fade"),
  duration: z.number().positive().default(0.4),
});
// slideSchema.extend({ transition: slideTransitionSchema.optional() })
```

#### B2 渲染与触发

- 导出 HTML：翻页时对即将显示的页容器应用 transition class（`trans-fade` / `trans-slide` / `trans-push`）。
- 演示模式：`PresentationMode` 翻页时给页面容器加 transition class，CSS 动画完成后清除。
- 编辑器内不应用转场（避免切换页面视觉抖动影响编辑）。

#### B3 文件改动

- `src/core/schema/deck.ts` — `slideTransitionSchema`
- `src/core/render/renderDeckHtml.ts` — 转场 class 注入
- `src/components/editor/PresentationMode.tsx` — 翻页转场
- `src/components/editor/PropertyPanel.tsx` — 页面级"转场"设置（选中页面而非元素时显示）

---

### C. 演讲者备注（schema 接线）

#### C1 现状

`slideSchema.notes` 已存在（`deck.ts:130`），但全代码库无任何读写 UI。

#### C2 编辑入口

属性面板在"选中页面"状态下，显示一个 `notes` 文本域（多行）。保存到 `slide.notes`。

#### C3 演示模式显示

`PresentationMode` 增加"演讲者备注"开关（默认关）：

- 开启时，在全屏画布旁/下方显示当前页 `notes`（半透明浮层，仅演讲者视角，不影响投屏内容若用双屏）。
- MVP 不做双屏分离（投影仪 + 备注屏），单屏浮层即可。

#### C4 文件改动

- `src/components/editor/PropertyPanel.tsx` — 页面 notes 文本域
- `src/core/commands/editorCommands.ts` — `set-slide-notes` 命令
- `src/components/editor/PresentationMode.tsx` — 备注浮层 + 开关
- `src/styles/editor.css` — 备注浮层样式

---

### D. 演示模式增强

#### D1 页码

底部 HUD 显示 `当前页 / 总页数`（如 `3 / 12`）。

#### D2 计时器

进入演示模式时开始计时，HUD 显示 `mm:ss`。退出时停止。纯 `useState` + `setInterval`，不持久化。

#### D3 进度条（可选）

HUD 顶部一条细进度条，宽度 = `当前页 / 总页数`。

#### D4 文件改动

- `src/components/editor/PresentationMode.tsx` — 页码、计时器、进度条
- `src/styles/editor.css` — HUD 样式

---

### E. 桌面化资源目录预研（纯文档）

第八轮已为媒体资源库打下 `deck.assets` 地基。本轮产出一篇预研文档，不动代码：

- Tauri vs Electron 选型对比（体积、更新、原生菜单、文件系统访问）。
- 资源目录方案：deck.json + 同级 `assets/` 文件夹，图片用相对路径引用而非 Data URL（解决草稿体积问题的根本方向）。
- 与现有 Data URL 模型的迁移路径。
- 字体离线策略与桌面打包的关系。

#### E1 文件改动

- `docs/desktop-bundling-research.md`（新建）

---

## 三、不做（本轮）

- **不接 AI API**（留后续）。
- **不做 PPTX 导出**。
- **不做 EXE 打包**（E 仅预研文档）。
- **不做视频 / 音频 / iframe 元素**（顺延第十轮媒体扩展）。
- **不做字体嵌入 / 字体资产**（顺延第十轮，待存储层升级）。
- **不做图片裁切 / 蒙版 / 形状填充**（顺延第十轮）。
- **不做动画顺序编排 UI / 时间轴编辑器**。动画只支持 per-element 三类（入场/退场/强调），不引入全局顺序与触发序列编辑。
- **不做双屏演示（投影 + 备注屏分离）**。备注浮层单屏即可。
- **不引入新运行时依赖**。动画用 CSS keyframes，转场用 CSS，计时器用原生 `setInterval`，全部零新增依赖。

---

## 四、验收标准

### 动画

- 给文本元素设置入场动画 `fade / 0.6s / delay 0`，导出 HTML 后打开该页，元素淡入一次。
- 编辑器内点"预览"，画布上元素播放一次当前动画，播放完恢复，不影响后续编辑。
- 代码块元素（`html` + `codeConfig`）设置动画后，导出 HTML 中动画与语法高亮同时生效，且 `<script>alert(1)</script>` 仍只作为文本显示（第八轮安全渲染不被破坏）。
- 动画字段导出 JSON 后重新导入，配置完整还原（round-trip）。
- 不含动画的旧 deck 加载正常，无报错（向后兼容）。

### 转场

- 页面设置转场 `slide`，演示模式翻页时页面有滑动过渡。
- 导出 HTML 翻页时同样有转场效果。
- 转场字段 round-trip 一致。

### 演讲者备注

- 选中页面，在属性面板 notes 文本域输入文字，保存后切换页面再切回，内容仍在。
- 演示模式开启"演讲者备注"开关，当前页 notes 显示在浮层。
- notes 导出 JSON 后重新导入保留。

### 演示增强

- 演示模式 HUD 显示 `3 / 12` 页码，随翻页更新。
- 进入演示后计时器开始走，退出停止。
- ESC 退出，回到编辑器当前页不变。

### 工程

- `pnpm test` 通过（含新增动画 schema / 渲染 / round-trip 单测）。
- `pnpm build` 通过。
- `pnpm exec tsc --noEmit` 通过。

---

## 五、任务顺序与依赖

```
Task 1：动画 schema（deck.ts 扩展，独立）
Task 2：animationStyles.ts 纯函数（依赖 Task 1）
Task 3：renderDeckHtml 注入 keyframes + 触发脚本（依赖 Task 2）
Task 4：ElementRenderer 编辑器内预览（依赖 Task 2）
Task 5：动画面板 UI + set-element-animations 命令（依赖 Task 1）

Task 6：转场 schema + 渲染（独立）
Task 7：PresentationMode 转场（依赖 Task 6）

Task 8：notes 接线（属性面板 + set-slide-notes 命令，独立）
Task 9：PresentationMode 备注浮层（依赖 Task 8）

Task 10：演示 HUD 页码/计时/进度（独立）

Task 11：桌面化预研文档（独立，纯文档）
```

并行分组：

- **组 1**：Task 1 / 6 / 8 / 10 / 11 可同时开始
- **组 2**：Task 2 / 7 / 9 依赖组 1 对应任务
- **组 3**：Task 3 / 4 / 5 依赖组 2

---

## 六、风险与缓解

| 风险 | 缓解 |
|---|---|
| 导出 HTML 注入动画触发脚本，被误判为破坏安全渲染 | 触发脚本由 `renderDeckHtml` 在 deck 层注入，**不经过元素的 `html` 字段**，不进入 `safeHtml` 净化路径；元素的 `html` 字段仍按第八轮规则净化。在测试中显式断言"代码块内 `<script>` 仍被转义"。 |
| 动画在编辑器内自动播放干扰编辑 | 编辑器内默认不播放，仅"预览"按钮手动触发一次。 |
| 转场在编辑器内造成页面切换抖动 | 转场只在演示模式与导出 HTML 生效，编辑器内切换页面无转场。 |
| 草稿体积因动画字段略增 | 动画字段是少量枚举 + 数字，体积可忽略；不触及图片 DataURL 这个体积大头。 |

---

## 七、与长期路线的关系

```
轮次 8（完成）：可靠性收口 + 导出安全 + 媒体资源地基
轮次 9（本轮）：动画系统 + 转场 + 演讲者备注 + 演示增强  →  演示与动效主线补齐
轮次 10：媒体能力扩展（视频/音频/字体/裁切蒙版），待存储层升级  →  资产管理深化
轮次 11：桌面化 / Tauri 打包（依据本轮 E 预研）  →  EXE 分发
```

本轮把第八轮原定"第九轮媒体扩展"顺延一格，先用零依赖、零二进石的动效与演示能力把闭环补全；媒体扩展留到存储层（IndexedDB）就绪后推进，避免反复在草稿省略逻辑上打补丁。
