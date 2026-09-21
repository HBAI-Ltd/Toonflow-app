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
  { id: "group", label: "成组" },
  { id: "mergeGroup", label: "合并分组" },
  { id: "ungroup", label: "解组" },
  { id: "addNode", label: "新建节点" },
  { id: "copyOnDrag", label: "节点复制", hold: true, gesture: "drag" },
  { id: "duplicateOnDrag", label: "创建副本", hold: true, gesture: "drag" },
  { id: "zoomIn", label: "放大" },
  { id: "zoomOut", label: "缩小" },
  { id: "fitView", label: "适应画布" },
  { id: "zoom", label: "鼠标滚轮", hold: true, gesture: "wheel" },
  { id: "pan", label: "键盘与鼠标", hold: true },
  { id: "moveTool", label: "移动" },
  { id: "handTool", label: "抓手工具" },
  { id: "arrange", label: "整理画布" },
  { id: "undo", label: "撤销" },
  { id: "redo", label: "重做" },
  { id: "search", label: "画布节点搜索" },
  { id: "delete", label: "删除" },
  { id: "paste", label: "粘贴节点" },
];

const keyLabels: Record<string, string> = {
  Ctrl: "Ctrl", Alt: "Alt", Shift: "Shift", Meta: isMac ? "⌘" : "Win",
  Space: "Space", Escape: "Esc", Enter: "Enter", Tab: "Tab", Backspace: "⌫", Delete: "Delete",
  ArrowLeft: "←", ArrowRight: "→", ArrowUp: "↑", ArrowDown: "↓",
  Home: "Home", End: "End", PageUp: "PageUp", PageDown: "PageDown", Insert: "Insert",
  Minus: "−", Equal: "+", BracketLeft: "[", BracketRight: "]", Backslash: "\\",
  Semicolon: ";", Quote: "'", Comma: ",", Period: ".", Slash: "/", Backquote: "`",
  CapsLock: "CapsLock", NumLock: "NumLock", ScrollLock: "ScrollLock", Pause: "Pause", PrintScreen: "PrintScreen",
  NumpadAdd: "小键盘 +", NumpadSubtract: "小键盘 -", NumpadMultiply: "小键盘 *", NumpadDivide: "小键盘 /",
  NumpadDecimal: "小键盘 .", NumpadEnter: "小键盘 Enter", NumpadEqual: "小键盘 =",
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
  if (keys.length > 1 || keys.some(key => !Object.hasOwn(keyLabels, key) && !/^(?:Key[A-Z]|Digit\d|Numpad\d|F(?:[1-9]|1\d|2[0-4]))$/.test(key))) return;
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
    .map(part => keyLabels[part] ?? part.replace(/^(?:Key|Digit)/, "").replace(/^Numpad/, "小键盘 ")).join(" + ")).join(" / ");
}
