import type { Deck, Slide, SlideElement } from "@/core/schema/deck";
import { sortElements, visibleElements } from "@/core/ops/deckOperations";
import { escapeHtml, renderCodeFallback, sanitizeHtml } from "@/core/render/safeHtml";
import { slideBackgroundHtmlStyle, textHtmlStyle } from "@/core/style/css";
import { collectKeyframes, entranceInlineStyle } from "@/core/render/animationStyles";

function styleToString(style: Record<string, string | number | undefined>) {
  return Object.entries(style)
    .filter(([, value]) => value !== undefined && value !== "")
    .map(([key, value]) => `${key}:${value}`)
    .join(";");
}

function baseElementStyle(element: SlideElement) {
  return {
    position: "absolute",
    left: `${element.x}px`,
    top: `${element.y}px`,
    width: `${element.w}px`,
    height: `${element.h}px`,
    opacity: element.opacity ?? 1,
    "z-index": element.zIndex ?? 0,
    transform: `rotate(${element.rotation ?? 0}deg)`,
    "transform-origin": "center center",
  };
}

function renderElement(element: SlideElement): string {
  const entrance = element.animations?.entrance;
  const emphasis = element.animations?.emphasis;
  const animAttr = entrance ? ` data-anim-entrance` : "";
  const emphAttr = emphasis ? ` data-anim-emphasis data-anim-emphasis-def="${emphasis.type},${emphasis.duration},${emphasis.delay},${emphasis.easing}"` : "";
  const animStyle = entrance ? `;${entranceInlineStyle(entrance)}` : "";
  const dataAttrs = `data-element data-element-id="${escapeHtml(element.id)}" data-type="${element.type}"${animAttr}${emphAttr}`;

  if (element.type === "text") {
    const style = styleToString(textHtmlStyle(element));
    return `<div ${dataAttrs} style="${style}${animStyle}">${escapeHtml(element.content)}</div>`;
  }

  if (element.type === "image") {
    const c = element.style.clip;
    const clipPath = c && (c.top || c.right || c.bottom || c.left) ? `inset(${c.top}% ${c.right}% ${c.bottom}% ${c.left}%)` : undefined;
    const style = styleToString({
      ...baseElementStyle(element),
      background: element.style.background,
      "border-radius": element.style.borderRadius ? `${element.style.borderRadius}px` : undefined,
      "box-shadow": element.style.shadow,
      "clip-path": clipPath,
      overflow: "hidden",
    });
    return `<div ${dataAttrs} style="${style}${animStyle}"><img src="${escapeHtml(element.src)}" alt="${escapeHtml(element.alt ?? "")}" style="width:100%;height:100%;object-fit:${element.objectFit ?? "cover"};display:block;" /></div>`;
  }

  if (element.type === "shape") {
    const style = styleToString({
      ...baseElementStyle(element),
      background: element.style.fill,
      border: element.style.stroke ? `${element.style.strokeWidth ?? 1}px solid ${element.style.stroke}` : undefined,
      "border-radius": element.shape === "ellipse" ? "9999px" : element.style.borderRadius ? `${element.style.borderRadius}px` : undefined,
      "box-shadow": element.style.shadow,
    });
    return `<div ${dataAttrs} data-shape="${element.shape}" style="${style}${animStyle}"></div>`;
  }

  const style = styleToString(baseElementStyle(element));
  const html = element.codeConfig
    ? renderCodeFallback(element.html)
    : element.trustedHtml
      ? element.html
      : sanitizeHtml(element.html);
  return `<div ${dataAttrs} style="${style}${animStyle}">${html}</div>`;
}

function renderSlide(slide: Slide, index: number) {
  const elements = sortElements(visibleElements(slide.elements)).map(renderElement).join("\n");
  return `<section class="slide" data-slide id="${escapeHtml(slide.id)}" data-slide-index="${index}" style="${styleToString(slideBackgroundHtmlStyle(slide.background))}">${elements}</section>`;
}

export function renderSlideForExport(slide: Slide): { innerHtml: string; backgroundStyle: Record<string, string | number | undefined> } {
  const innerHtml = sortElements(visibleElements(slide.elements)).map(renderElement).join("\n");
  return { innerHtml, backgroundStyle: slideBackgroundHtmlStyle(slide.background) };
}

export function renderDeckHtml(deck: Deck) {
  const slides = deck.slides.map(renderSlide).join("\n");
  const deckJson = JSON.stringify(deck).replaceAll("<", "\\u003c");

  // Collect animation keyframe types (entrance + emphasis share the same keyframes)
  const animTypes: string[] = [];
  for (const slide of deck.slides) {
    for (const el of slide.elements) {
      if (el.animations?.entrance) animTypes.push(el.animations.entrance.type);
      if (el.animations?.emphasis) animTypes.push(el.animations.emphasis.type);
    }
  }
  const keyframesCSS = animTypes.length > 0 ? `\n    ${collectKeyframes(animTypes)}` : "";

  const hasEntrance = animTypes.length > 0;
  const hasEmphasis = deck.slides.some((s) => s.elements.some((e) => e.animations?.emphasis));

  // IntersectionObserver: play entrance animations when slide scrolls into view
  const entranceScript = hasEntrance
    ? `\n  <script>(function(){var io=new IntersectionObserver(function(entries){entries.forEach(function(e){if(!e.isIntersecting)return;e.target.querySelectorAll('[data-anim-entrance]').forEach(function(el){el.style.animationPlayState='running';});});},{threshold:0.2});document.querySelectorAll('.slide[data-slide]').forEach(function(s){io.observe(s);});})();</script>`
    : "";

  // Emphasis: click to replay animation
  const emphasisScript = hasEmphasis
    ? `\n  <script>(function(){document.querySelectorAll('[data-anim-emphasis]').forEach(function(el){el.addEventListener('click',function(){var p=el.dataset.animEmphasisDef.split(',');el.style.animation='none';el.offsetWidth;el.style.animation='anim-'+p[0]+' '+p[1]+'s '+p[3]+' '+p[2]+'s both';});});})();</script>`
    : "";

  // Presentation mode: fullscreen slide-by-slide navigation
  const W = deck.size.width;
  const H = deck.size.height;
  const presScript = `\n  <script>(function(){var slides=Array.from(document.querySelectorAll('.slide[data-slide]')),idx=0,W=${W},H=${H};var ov=document.createElement('div');ov.style.cssText='display:none;position:fixed;inset:0;background:#000;z-index:9999;';var stage=document.createElement('div');stage.style.cssText='position:absolute;transform-origin:top left;';var hud=document.createElement('div');hud.style.cssText='position:fixed;bottom:16px;left:50%;transform:translateX(-50%);color:#fff;background:rgba(0,0,0,.6);padding:4px 12px;border-radius:20px;font:14px/2 sans-serif;pointer-events:none;';ov.append(stage,hud);document.body.appendChild(ov);var btn=document.createElement('button');btn.textContent='▶ 演示';btn.style.cssText='position:fixed;bottom:16px;right:16px;background:#1f2937;color:#fff;border:none;padding:8px 16px;border-radius:8px;cursor:pointer;font:14px sans-serif;z-index:1000;';document.body.appendChild(btn);function resize(){var s=Math.min(innerWidth/W,innerHeight/H);stage.style.cssText='position:absolute;transform-origin:top left;width:'+W+'px;height:'+H+'px;transform:scale('+s+');left:'+((innerWidth-W*s)/2)+'px;top:'+((innerHeight-H*s)/2)+'px;';}function go(i){idx=Math.max(0,Math.min(i,slides.length-1));stage.innerHTML='';var cl=slides[idx].cloneNode(true);cl.style.cssText='position:relative;width:'+W+'px;height:'+H+'px;overflow:hidden;';stage.appendChild(cl);cl.querySelectorAll('[data-anim-entrance]').forEach(function(el){el.style.animationPlayState='running';});cl.querySelectorAll('[data-anim-emphasis]').forEach(function(el){el.addEventListener('click',function(){var p=el.dataset.animEmphasisDef.split(',');el.style.animation='none';el.offsetWidth;el.style.animation='anim-'+p[0]+' '+p[1]+'s '+p[3]+' '+p[2]+'s both';});});hud.textContent=(idx+1)+' / '+slides.length;resize();}function enter(){ov.style.display='block';go(0);document.documentElement.requestFullscreen&&document.documentElement.requestFullscreen().catch(function(){});}function exit(){ov.style.display='none';if(document.fullscreenElement)document.exitFullscreen().catch(function(){});}btn.onclick=enter;window.addEventListener('resize',function(){if(ov.style.display!='none')resize();});document.addEventListener('fullscreenchange',function(){if(!document.fullscreenElement&&ov.style.display!='none')exit();});document.addEventListener('keydown',function(e){if(ov.style.display=='none'){if(e.key=='p'||e.key=='P'){e.preventDefault();enter();}return;}if(e.key=='Escape')exit();else if(e.key=='ArrowRight'||e.key==' '||e.key=='PageDown')go(idx+1);else if(e.key=='ArrowLeft'||e.key=='PageUp')go(idx-1);});})();</script>`;

  return `<!doctype html>
<html lang="zh-CN">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${escapeHtml(deck.title)}</title>
  <style>
    :root { color-scheme: light; }
    * { box-sizing: border-box; }
    body { margin: 0; background: #111827; font-family: ${deck.theme.fontFamily}; }
    .deck[data-deck] { width: 100vw; min-height: 100vh; display: grid; place-items: center; gap: 48px; padding: 48px; }
    .slide[data-slide] { position: relative; width: ${deck.size.width}px; height: ${deck.size.height}px; overflow: hidden; flex: 0 0 auto; box-shadow: 0 30px 90px rgba(0,0,0,.28); }
    @media (max-width: 1700px) {
      .slide[data-slide] { width: min(94vw, ${deck.size.width}px); height: auto; aspect-ratio: ${deck.size.width} / ${deck.size.height}; }
      .slide[data-slide] > [data-element] { transform-origin: top left; }
    }
    img { max-width: 100%; }${keyframesCSS}
  </style>
</head>
<body>
  <main class="deck" data-deck data-version="${deck.version}" style="--deck-width:${deck.size.width};--deck-height:${deck.size.height};">
${slides}
  </main>
  <script>
    window.__DECK_JSON__ = ${deckJson};
  </script>${entranceScript}${emphasisScript}${presScript}
</body>
</html>`;
}
