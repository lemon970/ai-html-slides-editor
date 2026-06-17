export type EditorShortcut =
  | { type: "delete" }
  | { type: "copy" }
  | { type: "paste" }
  | { type: "duplicate" }
  | { type: "group" }
  | { type: "ungroup" }
  | { type: "clear-selection" }
  | { type: "nudge"; delta: { x: number; y: number } }
  | { type: "cycle-element"; direction: 1 | -1 };

export type EditorShortcutInput = {
  key: string;
  ctrlKey?: boolean;
  metaKey?: boolean;
  shiftKey?: boolean;
  altKey?: boolean;
};

export function editorShortcutFromKey(input: EditorShortcutInput): EditorShortcut | null {
  const commandKey = Boolean(input.ctrlKey || input.metaKey);
  const key = input.key.toLowerCase();

  if (key === "escape") {
    return { type: "clear-selection" };
  }

  if (key === "tab") {
    return { type: "cycle-element", direction: input.shiftKey ? -1 : 1 };
  }

  if (!commandKey && !input.altKey) {
    const step = input.shiftKey ? 10 : 1;
    if (key === "arrowleft") {
      return { type: "nudge", delta: { x: -step, y: 0 } };
    }
    if (key === "arrowright") {
      return { type: "nudge", delta: { x: step, y: 0 } };
    }
    if (key === "arrowup") {
      return { type: "nudge", delta: { x: 0, y: -step } };
    }
    if (key === "arrowdown") {
      return { type: "nudge", delta: { x: 0, y: step } };
    }
  }

  if (key === "delete" || key === "backspace") {
    return { type: "delete" };
  }

  if (!commandKey || input.altKey) {
    return null;
  }

  if (key === "c") {
    return { type: "copy" };
  }
  if (key === "v") {
    return { type: "paste" };
  }
  if (key === "d") {
    return { type: "duplicate" };
  }
  if (key === "g" && input.shiftKey) {
    return { type: "ungroup" };
  }
  if (key === "g") {
    return { type: "group" };
  }

  return null;
}

export function isEditableTarget(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) {
    return false;
  }

  const tagName = target.tagName.toLowerCase();
  return (
    target.isContentEditable ||
    tagName === "input" ||
    tagName === "textarea" ||
    tagName === "select"
  );
}
