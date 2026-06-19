export const PROMPT_TO_JSON_SCHEMA = `你是一个 HTML 演示文稿格式转换工具。
将下方的 HTML 转换为以下指定格式，只返回完整 HTML，不要任何解释。

目标格式规则：
1. 根容器：<div data-deck id="deck-1" style="--deck-width:1600;--deck-height:900">
2. 每页：<section data-slide id="slide-N" style="width:1600px;height:900px;position:relative;background:[背景色]">
3. 每个视觉元素：<div data-element data-element-id="el-页号-序号" data-type="text|image|shape" style="position:absolute;left:Xpx;top:Ypx;width:Wpx;height:Hpx;[样式]">内容</div>
4. 结尾：<script>window.__DECK_JSON__ = null;</script>
5. 坐标单位全部用 px，不用 vw/vh/%/em
6. 每个 data-element-id 在全文中唯一
7. 不保留 JavaScript 动画，但保留 CSS 动画（@keyframes、transition）

原 HTML：
[粘贴你的 HTML]`;

export const PROMPT_TO_SOURCE_HTML = `你是一个 HTML 演示文稿格式转换工具。
将下方的 HTML 的幻灯片容器结构规范化，保留所有视觉效果，只返回完整 HTML，不要任何解释。

目标格式：
1. 所有颜色值移到 :root { } CSS 变量（--ink、--paper 等语义命名）
2. 每页用 <section class="slide"> 包裹
3. 所有 section 放在 <div id="deck"> 内
4. 添加翻页函数：
   var ss=document.querySelectorAll('.slide');
   function goTo(i){document.getElementById('deck').style.transform='translateX('+(-(i*100/ss.length))+'%)';}
   window.__goTo=goTo;
5. 保留所有 CSS 动画、背景效果、字体

原 HTML：
[粘贴你的 HTML]`;
