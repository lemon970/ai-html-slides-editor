# Phase 1 — sourceHtml + patches-first MVP

**Tag:** `phase-1`  
**Date:** 2026-06-20  
**Branch:** main (`7c068b6`)

---

## 已支持能力

- **导入任意 HTML** — 拖放或点击选择，识别 slide 结构（section、data-slide、reveal 等常见模式）自动进入修订视图
- **页导航** — 有 slide 结构时，侧栏提供缩略图列表，键盘左右/空格翻页
- **inline 文本修订** — 修订模式下点击文字直接编辑，blur / Ctrl+Enter 提交；修改以 `TextPatch` 写入，不破坏 `sourceHtml`
- **图片替换** — 修订模式下点击图片，选择本地文件以 data URL 写入 `ImgSrcPatch`
- **元素隐藏 / 恢复** — 文字和图片均可隐藏（`HidePatch`），侧栏"已隐藏"区随时恢复
- **自动保存草稿** — 每次修改 debounce 1 s 后写入 IndexedDB；`sourceHtml` + `patches[]` 分开存储，不保存渲染结果
- **草稿恢复** — 导入页列出最近草稿，打开后重建 uid 并向 iframe replay patches
- **导出前 preflight** — 检查 stale patches / 残留 data-eid / blob: 图片 / 外链图片 / 无结构；error 级别阻断导出，warning 可忽略
- **导出干净 HTML** — `applyPatches(sourceHtml, patches)` 纯函数输出，自动剥离 `data-eid` 和注入脚本

---

## 明确不做（本阶段）

- 从零排版 / 创作 PPT（不是 Canva / Figma）
- `deck.json` 编辑器继续迭代（代码保留，入口已隐藏）
- 拖拽 / 缩放 / 动画时间轴
- CSS var 持久调色（ThemeVarPanel 已隐藏，等 Phase 2）
- PPTX 导入导出

---

## 已知限制

| 限制 | 说明 |
|---|---|
| 无结构 HTML | 可打开、可编辑、可导出，但无 slide 导航和缩略图 |
| 复杂 JS / canvas / SVG | 保留原样，不可结构化编辑 |
| CSS var 调色 | 仅本次预览临时生效，不写入 patch，不导出 |
| patch 延续 | 导出后再导入同一 HTML，现有 patch 不会自动延续 |
| overlay 定位 | iframe 内容滚动时覆盖层位置可能偏移 |
| `<br>` 换行 | inline 编辑提交后换行转为空格（textarea 限制） |

---

## 下一轮候选方向

1. **CSS var patch 化** — `CssVarPatch` 类型，`applyPatches` 处理 `:root` 内联变量，彻底接管 ThemeVarPanel
2. **可编辑区域提示** — 修订模式下高亮可点击元素，降低首次使用摸索成本
3. **多样本保真回归测试** — 5 个 fixture HTML 的 patch 快照测试，防止 annotateUids / resolveTarget 回归
4. **patch 冲突/失效恢复** — stale patch 提供"自动丢弃"或"手动确认"流程，而非仅在 preflight 时报错
