"use client";

import { useSourceHtmlStore } from "@/store/useSourceHtmlStore";

const VAR_LABELS: Record<string, string> = {
  "--ink": "深色（文字/背景）",
  "--paper": "浅色（背景/文字）",
  "--paper-tint": "浅色变体",
  "--ink-tint": "深色变体",
  "--accent": "强调色",
  "--primary": "主色",
  "--secondary": "辅色",
};

export function ThemeVarPanel() {
  const cssVars = useSourceHtmlStore((s) => s.cssVars);
  const updateCssVar = useSourceHtmlStore((s) => s.updateCssVar);

  const entries = Object.entries(cssVars).filter(([, v]) => v.startsWith("#"));
  if (entries.length === 0) return null;

  return (
    <div className="theme-var-panel">
      <div className="panel-heading">主题色</div>
      {entries.map(([name, value]) => (
        <div key={name} className="theme-var-row">
          <input
            type="color"
            value={value.slice(0, 7)}
            onChange={(e) => updateCssVar(name, e.target.value)}
            title={name}
          />
          <span className="theme-var-label">{VAR_LABELS[name] ?? name}</span>
          <code className="theme-var-value">{value}</code>
        </div>
      ))}
    </div>
  );
}
