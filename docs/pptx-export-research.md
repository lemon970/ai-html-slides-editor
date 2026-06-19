# PPTX 导出预研

日期：2026-06-19

---

## 一、库选型

前端唯一成熟的纯 JS PPTX 生成库是 **pptxgenjs**（`pptxgenjs`，MIT）。

| 指标 | 数值 |
|---|---|
| npm 包体积（gzip） | ~220 KB |
| 最新版本 | 3.x |
| 维护状态 | 活跃（2024 仍有发布） |
| 依赖数量 | 0 运行时依赖 |
| 浏览器支持 | 是（生成 Blob 下载） |

引入成本：一个新运行时依赖，bundle 增加 ~220 KB gzip。

---

## 二、deck → PPTX 映射完整度

| deck 字段 | pptxgenjs 支持 | 备注 |
|---|---|---|
| 文本元素（位置/尺寸） | ✅ `slide.addText` | 坐标单位需从 px 换算为 inch（÷ 96） |
| 文本样式（字号/颜色/粗体/斜体） | ✅ | 完整支持 |
| 文本对齐（水平/垂直） | ✅ | `valign`, `align` |
| 图片元素（Data URL / remote URL） | ✅ `slide.addImage` | Data URL 直接传 base64 |
| 矩形/椭圆形状 | ✅ `slide.addShape` | `pptxgen.ShapeType.rect/ellipse` |
| 形状填充色 | ✅ | `fill.color`（需去掉 `#`）|
| 旋转 | ✅ | `rotate` 字段 |
| 透明度 | ✅ | `transparency`（0-100）|
| 背景纯色 | ✅ `slide.background` | |
| 背景渐变 | ⚠️ 部分 | pptxgenjs 支持线性渐变但参数格式不同 |
| 背景图片 | ✅ | `slide.background.data` |
| HTML 元素（代码块）| ❌ 不支持 | PPTX 无法内嵌 HTML，只能降级为纯文本 |
| CSS 动画 | ❌ | PPTX 有自己的动画模型（ms-ooxml），不互通 |
| 页面转场 | ⚠️ | pptxgenjs 支持基础转场，但类型映射需手动 |
| 演讲者备注 | ✅ `slide.addNotes` | |
| clip-path 裁切 | ❌ | PPTX 无 clip-path 概念，需转换为裁切框 |

**结论**：文本 + 图片 + 形状的基础映射可行；代码块、CSS 动画不支持；渐变背景需额外处理。

---

## 三、核心转换挑战

**3.1 坐标系**

deck 使用 px（1600×900）；pptxgenjs 使用 inch（默认 10×7.5）。
转换：`x_inch = x_px / deck.width * prs_width_inch`。

**3.2 字体**

导出 PPTX 中的字体名称若用户机器上没有安装，会被替换为系统默认字体。目前 deck 使用 `Inter`，PPTX 环境可能降级为 `Calibri`。

**3.3 HTML 元素降级**

代码块（`html` 类型）无法导出为真实代码高亮。选项：
- 降级为等宽字体纯文本，保留内容
- 跳过，在导出提示里告知用户

**3.4 文件大小**

含多张 Data URL 图片的 deck，PPTX 体积会较大（每张图独立存储）。

---

## 四、建议实现路径（若决定引入）

```
Step 1：仅导出文本 + 形状 + 纯色背景（最小 MVP）
Step 2：加入图片导出
Step 3：演讲者备注
Step 4：渐变背景、转场
Step 5：HTML 元素降级策略
```

---

## 五、结论与建议

**本轮（iter-10）不引入 pptxgenjs。**

原因：
1. 基础映射可行但完整度有限（代码块、动画无法映射），会造成用户预期落差。
2. ~220 KB 新依赖，相对项目当前体积偏大。
3. iter-10 主线是存储升级和导出演示完整化，PPTX 是独立大功能。

**建议 iter-11 或之后单独做一轮 PPTX 导出**，实现 Step 1-3，发布时明确说明"不含代码块高亮和 CSS 动画"，管理用户预期。
