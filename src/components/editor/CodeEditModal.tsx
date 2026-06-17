"use client";

import { useEffect, useRef } from "react";

const LANGUAGES = ["typescript", "javascript", "python", "bash", "json", "html", "css", "plaintext"];

type Props = {
  code: string;
  language: string;
  onSave: (code: string, language: string) => void;
  onClose: () => void;
};

export function CodeEditModal({ code, language, onSave, onClose }: Props) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const langRef = useRef<HTMLSelectElement>(null);

  useEffect(() => { textareaRef.current?.focus(); }, []);

  function handleSave() {
    onSave(textareaRef.current?.value ?? code, langRef.current?.value ?? language);
  }

  return (
    <div className="code-edit-overlay" onClick={onClose}>
      <div className="code-edit-modal" onClick={(e) => e.stopPropagation()}>
        <div className="code-edit-header">
          <select ref={langRef} defaultValue={language} className="code-lang-select">
            {LANGUAGES.map((l) => <option key={l} value={l}>{l}</option>)}
          </select>
          <button type="button" className="import-btn-primary" onClick={handleSave}>保存</button>
          <button type="button" onClick={onClose}>✕</button>
        </div>
        <textarea
          ref={textareaRef}
          defaultValue={code}
          className="code-edit-textarea"
          spellCheck={false}
          onKeyDown={(e) => {
            if (e.key === "Tab") {
              e.preventDefault();
              const s = e.currentTarget;
              const start = s.selectionStart;
              s.value = s.value.substring(0, start) + "  " + s.value.substring(s.selectionEnd);
              s.selectionStart = s.selectionEnd = start + 2;
            }
            if (e.key === "Escape") { e.stopPropagation(); onClose(); }
          }}
        />
      </div>
    </div>
  );
}
