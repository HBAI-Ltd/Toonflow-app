import { t } from "@/lib/i18n";

const isMac = globalThis.navigator?.platform?.includes("Mac") ?? false;
const primaryModifier = isMac ? "Meta" : "Ctrl";
const modifiers = ["Ctrl", "Alt", "Shift", "Meta"];

export const defaultCanvasShortcuts = {
  group: `${primaryModifier}+KeyG / Alt+KeyG`,
  mergeGroup: isMac ? "Alt+Meta+KeyG" : "Ctrl+Alt+KeyG",
  ungroup: isMac ? "Shift+Meta+KeyG / Alt+Shift+KeyG" : "Ctrl+Shift+KeyG / Alt+Shift+KeyG",
  addNode: "Tab",
  copyOnDrag: "Alt",
  duplicateOnDrag: isMac ? "Alt+Meta" : "Ctrl+Alt",
  pan: "Space",
  zoom: "Ctrl",
  moveTool: "KeyV",
  handTool: "KeyH",
  arrange: "Alt+Shift+KeyF",
  search: `${primaryModifier}+KeyF`,
  delete: "Backspace",
  paste: `${primaryModifier}+KeyV`,
  undo: `${primaryModifier}+KeyZ`,
  redo: isMac ? "Shift+Meta+KeyZ" : "Ctrl+Shift+KeyZ",
  zoomIn: isMac ? "Meta+Equal / Shift+Meta+Equal" : "Ctrl+Equal / Ctrl+Shift+Equal",
  zoomOut: `${primaryModifier}+Minus`,
  fitView: `${primaryModifier}+Digit0`,
};
export type CanvasShortcutAction = keyof typeof defaultCanvasShortcuts;
export type CanvasShortcuts = Record<CanvasShortcutAction, string>;

export const canvasShortcutFields: {
  id: CanvasShortcutAction;
  label: string;
  hold?: boolean;
  gesture?: "drag" | "wheel";
}[] = [
  { id: "group", get label() { return t("shortcut.group"); } },
  { id: "mergeGroup", get label() { return t("shortcut.mergeGroup"); } },
  { id: "ungroup", get label() { return t("shortcut.ungroup"); } },
  { id: "addNode", get label() { return t("shortcut.addNode"); } },
  { id: "copyOnDrag", get label() { return t("shortcut.copyOnDrag"); }, hold: true, gesture: "drag" },
  { id: "duplicateOnDrag", get label() { return t("shortcut.duplicateOnDrag"); }, hold: true, gesture: "drag" },
  { id: "zoomIn", get label() { return t("shortcut.zoomIn"); } },
  { id: "zoomOut", get label() { return t("shortcut.zoomOut"); } },
  { id: "fitView", get label() { return t("shortcut.fitView"); } },
  { id: "zoom", get label() { return t("shortcut.zoom"); }, hold: true, gesture: "wheel" },
  { id: "pan", get label() { return t("shortcut.pan"); }, hold: true },
  { id: "moveTool", get label() { return t("shortcut.moveTool"); } },
  { id: "handTool", get label() { return t("shortcut.handTool"); } },
  { id: "arrange", get label() { return t("shortcut.arrange"); } },
  { id: "undo", get label() { return t("shortcut.undo"); } },
  { id: "redo", get label() { return t("shortcut.redo"); } },
  { id: "search", get label() { return t("shortcut.search"); } },
  { id: "delete", get label() { return t("shortcut.delete"); } },
  { id: "paste", get label() { return t("shortcut.paste"); } },
];

const keyLabels: Record<string, string> = {
  Ctrl: "Ctrl", Alt: "Alt", Shift: "Shift", Meta: isMac ? "⌘" : "Win",
  ArrowLeft: "←", ArrowRight: "→", ArrowUp: "↑", ArrowDown: "↓",
  Minus: "−", Equal: "+", BracketLeft: "[", BracketRight: "]", Backslash: "\\",
  Semicolon: ";", Quote: "'", Comma: ",", Period: ".", Slash: "/", Backquote: "`",
};
const keyLabelKeys: Record<string, string> = {
  Space: "shortcut.key.space", Escape: "shortcut.key.escape", Enter: "shortcut.key.enter", Tab: "shortcut.key.tab",
  Backspace: "shortcut.key.backspace", Delete: "shortcut.key.delete",
  Home: "shortcut.key.home", End: "shortcut.key.end", PageUp: "shortcut.key.pageUp", PageDown: "shortcut.key.pageDown", Insert: "shortcut.key.insert",
  CapsLock: "shortcut.key.capsLock", NumLock: "shortcut.key.numLock", ScrollLock: "shortcut.key.scrollLock",
  Pause: "shortcut.key.pause", PrintScreen: "shortcut.key.printScreen",
};
const numpadKeyLabels: Record<string, string> = {
  NumpadAdd: "+", NumpadSubtract: "-", NumpadMultiply: "*", NumpadDivide: "/",
  NumpadDecimal: ".", NumpadEnter: "Enter", NumpadEqual: "=",
};

export function normalizeShortcut(value: string): string | undefined {
  if (!value.trim()) return "";
  const bindings = value.split("/").map(normalizeBinding);
  if (bindings.some(binding => binding === undefined)) return;
  return [...new Set(bindings)].join(" / ");
}

function normalizeBinding(value: string): string | undefined {
  const parts = value.split("+").map(part => part.trim());
  if (new Set(parts).size !== parts.length) return;
  const keys = parts.filter(part => !modifiers.includes(part));
  if (keys.length > 1 || keys.some(key => !Object.hasOwn(keyLabels, key) && !Object.hasOwn(keyLabelKeys, key) && !Object.hasOwn(numpadKeyLabels, key)
    && !/^(?:Key[A-Z]|Digit\d|Numpad\d|F(?:[1-9]|1\d|2[0-4]))$/.test(key))) return;
  return [...modifiers.filter(modifier => parts.includes(modifier)), ...keys].join("+");
}

export function getShortcutBindings(binding: string) {
  return binding.split("/").map(value => value.trim()).filter(Boolean);
}

export function isModifierShortcut(binding: string) {
  return !!binding && binding.split("+").every(part => modifiers.includes(part));
}

export function isShortcutAllowed(field: typeof canvasShortcutFields[number], binding: string) {
  return getShortcutBindings(binding).every(value => field.gesture === "drag"
    ? isModifierShortcut(value) : field.hold || !isModifierShortcut(value));
}

export function shortcutFromEvent(event: KeyboardEvent) {
  const modifier = ["Control", "Alt", "Shift", "Meta"].includes(event.key);
  return [event.ctrlKey && "Ctrl", event.altKey && "Alt", event.shiftKey && "Shift", event.metaKey && "Meta", !modifier && event.code]
    .filter(Boolean).join("+");
}

export function shortcutMatches(event: KeyboardEvent, binding: string) {
  return !!binding && event.type !== "keyup" && getShortcutBindings(binding).includes(shortcutFromEvent(event));
}

export function shortcutPressed(event: Pick<KeyboardEvent, "ctrlKey" | "altKey" | "shiftKey" | "metaKey">, binding: string, pressedCodes: ReadonlySet<string>) {
  return getShortcutBindings(binding).some(value => {
    const parts = value.split("+");
    if (event.ctrlKey !== parts.includes("Ctrl") || event.altKey !== parts.includes("Alt")
      || event.shiftKey !== parts.includes("Shift") || event.metaKey !== parts.includes("Meta")) return false;
    const key = parts.find(part => !modifiers.includes(part));
    return !key || pressedCodes.has(key);
  });
}

export function shortcutLabel(binding: string) {
  return getShortcutBindings(binding).map(value => value.split("+")
    .map(part => keyLabels[part] ?? (keyLabelKeys[part] ? t(keyLabelKeys[part])
      : part.startsWith("Numpad") ? t("shortcut.key.numpad", { key: numpadKeyLabels[part] ?? part.slice(6) }) : part.replace(/^(?:Key|Digit)/, "")))
    .join(" + ")).join(" / ");
}
