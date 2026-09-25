<template>
  <div ref="senderElement" class="promptInput nodrag nopan nowheel" @keydown.capture="handleMentionKey" @click.capture="previewReference" />
  <el-image-viewer v-if="previewUrl" :urlList="[previewUrl]" teleported @close="previewReferenceId = undefined" />
</template>

<script setup lang="ts">
import { computed, ref, watch } from "vue";
import { ElImageViewer, useZIndex } from "element-plus";
import xSender, { type AnyTagProps, type MentionItem } from "x-sender";
import "x-sender/lib/XSender.css";

const props = defineProps<{ references: (MentionItem & { value: string })[] }>();
const model = defineModel<AnyTagProps[][]>({ required: true });
const text = defineModel<string>("text", { default: "" });
const senderElement = ref<HTMLElement>();
const { nextZIndex } = useZIndex();
const previewReferenceId = ref<string>();
const previewUrl = computed(() => String(props.references.find(item => item.id === previewReferenceId.value)?.avatar ?? ""));
let sender: xSender | undefined;
let resetTask: Promise<void> | undefined;

function previewReference(event: MouseEvent) {
  const tag = event.target instanceof Element ? event.target.closest<HTMLElement>(".imageReference[data-reference-id]") : null;
  const reference = props.references.find(item => item.id === tag?.dataset.referenceId);
  if (!reference?.avatar) return;
  event.preventDefault();
  event.stopPropagation();
  sender?.bus.emit(xSender.EventSet.EVENT_COMMON_DIALOG_CLOSE);
  previewReferenceId.value = reference.id;
}

function referenceHtml(reference: MentionItem & { value: string }) {
  const tag = document.createElement("span");
  tag.className = "imageReference";
  tag.dataset.referenceId = reference.id;
  tag.dataset.value = reference.value;
  if (reference.avatar) {
    const image = document.createElement("img");
    image.src = String(reference.avatar);
    image.alt = "";
    image.draggable = false;
    tag.append(image);
  }
  tag.append(document.createTextNode(reference.name));
  return tag.outerHTML;
}

function normalizeModel(value: AnyTagProps[][]): AnyTagProps[][] {
  if (!value.length) return [[{ type: "Write", text: "" }]];
  return value.map(line => {
    const tags = line.flatMap((tag): AnyTagProps[] => {
      if (tag.type === "Write") return tag.text.split(/(\{\{ref \d+\}\})/g).map(text => {
        const reference = props.references.find(item => item.value === text);
        return reference
          ? { type: "Custom", html: `<span style="display: inline-block;">${referenceHtml(reference)}</span>` }
          : { type: "Write", text };
      });
      if (tag.type !== "Custom") return [tag];
      const template = document.createElement("template");
      template.innerHTML = tag.html;
      const id = template.content.querySelector<HTMLElement>(".imageReference[data-reference-id]")?.dataset.referenceId;
      if (!id) return [tag];
      const reference = props.references.find(item => item.id === id);
      if (!reference) return [];
      return [{ type: "Custom", html: `<span style="display: inline-block;">${referenceHtml(reference)}</span>` }];
    });
    const next: AnyTagProps[] = [{ type: "Write", text: "" }];
    for (const tag of tags) {
      const previous = next[next.length - 1];
      if (tag.type === "Write" && previous.type === "Write") previous.text += tag.text;
      else {
        if (tag.type !== "Write" && previous.type !== "Write") next.push({ type: "Write", text: "" });
        next.push(tag);
      }
    }
    if (next[next.length - 1].type !== "Write") next.push({ type: "Write", text: "" });
    return next;
  });
}

function releaseNodeFocus(instance: xSender) {
  // ACT: 1.4.6 的排队输入回调仍会聚焦旧 Write；仅让即将移除的节点失效，库支持取消回调后可移除。
  for (const grid of instance.chatEditor.NODES) {
    for (const node of grid.children) {
      if (node.type === "Write" || node.type === "Input") node.focus = () => {};
    }
  }
}

function syncModel(value = sender?.getModel() ?? model.value) {
  // 输入法组字时只同步文本，等 compositionend 后再替换参考标签，保留正在编辑的 DOM。
  const next = sender?.chatEditor.isComposition ? value : normalizeModel(value);
  if (sender && JSON.stringify(sender.getModel()) !== JSON.stringify(next)) {
    const instance = sender;
    const editor = instance.chatElement.richText;
    const selection = instance.getSelection();
    const focused = document.activeElement === editor;
    const endpoints = focused ? [selection.anchorNode, selection.focusNode].map((node, index) => {
      const gridIndex = instance.chatEditor.NODES.findIndex(grid => grid.$el.contains(node));
      const grid = instance.chatEditor.NODES[gridIndex];
      const childIndex = grid?.children.findIndex(child => child.$el.contains(node)) ?? -1;
      const child = grid?.children[childIndex];
      return {
        gridIndex, childIndex,
        text: child?.type === "Write" || child?.type === "Input" ? child.text : undefined,
        offset: index ? selection.focusOffset : selection.anchorOffset,
      };
    }) : [];
    releaseNodeFocus(instance);
    const task = instance.reset({ chatNode: next, clearHistory: false });
    resetTask = task;
    void task.finally(() => { if (resetTask === task) resetTask = undefined; });
    // ACT: reset 同步重建 DOM，但下一帧会强制移到末尾；在此恢复选区，并在 reset 完成前抑制该次聚焦。
    const last = instance.chatEditor.NODES.at(-1)?.children.at(-1);
    if (last?.type === "Write") {
      Object.assign(instance.getCurrentNode(), { instance: last, node: last.$el.children[0].firstChild, offset: last.text.length || 1 });
    }
    const restored = endpoints.map(endpoint => {
      const target = instance.chatEditor.NODES[endpoint.gridIndex]?.children[endpoint.childIndex];
      if ((target?.type !== "Write" && target?.type !== "Input") || target.text !== endpoint.text) return;
      const node = target.type === "Write" ? target.$el.children[0].firstChild : target.$el.children[0].children[0].firstChild;
      if (node?.nodeType !== Node.TEXT_NODE || endpoint.offset > (node.textContent?.length ?? 0)) return;
      return { target, node, offset: endpoint.offset };
    });
    const [anchor, focus] = restored;
    if (anchor && focus) {
      focus.target.focus(focus.offset);
      selection.setBaseAndExtent(anchor.node, anchor.offset, focus.node, focus.offset);
    } else if (focused && last?.type === "Write") last.focus(-1);
  }
  model.value = next;
  text.value = getPromptText(next);
}

function getPromptText(value: AnyTagProps[][]) {
  return value.map(line => line.map(tag => {
    if (tag.type === "Write") return tag.text;
    if (tag.type === "Input") return tag.text || tag.placeholder;
    if (tag.type !== "Custom") {
      const prefix = tag.type === "Mention" ? "@" : tag.type === "Trigger" ? tag.key : "";
      return prefix + tag.name;
    }
    const content = document.createElement("template");
    content.innerHTML = tag.html;
    for (const reference of content.content.querySelectorAll<HTMLElement>(".imageReference[data-value]")) {
      reference.replaceWith(reference.dataset.value ?? "");
    }
    return content.content.textContent ?? "";
  }).join("")).join("\n");
}

watch(model, (value) => {
  if (sender && JSON.stringify(value) !== JSON.stringify(sender.getModel())) syncModel(value);
}, { deep: true });

watch(() => props.references, async (options) => {
  const instance = sender;
  if (!instance) return;
  instance.bus.emit(xSender.EventSet.EVENT_COMMON_DIALOG_CLOSE);
  instance.updateConfig({ mentionConfig: { dialogTitle: "选择参考", callEvery: false, options } });
  // 等库将本帧的输入 DOM 写回模型后再更新参考，避免用旧文本重建输入框。
  await instance.nextTick();
  if (sender === instance) syncModel();
}, { deep: true });

watch(senderElement, (element, _previous, onCleanup) => {
  if (!element) return;
  const popup = document.createElement("div");
  popup.className = "textNodeMentions nodrag nopan nowheel";
  popup.style.zIndex = String(nextZIndex());
  document.body.appendChild(popup);
  const initialModel: AnyTagProps[][] = model.value.length ? model.value : text.value.split("\n").map(text => [{ type: "Write", text }]);
  const instance = new xSender(element, {
    autoFocus: false,
    placeholder: "描述一下生成风格提示词，输入 @ 引用参考",
    chatStyle: { minHeight: "70px", maxHeight: "180px", fontSize: "14px", lineHeight: "1.6" },
    getPopupContainer: () => popup,
    mentionConfig: { dialogTitle: "选择参考", callEvery: false, options: props.references },
    keyboardSendFun: () => false,
    keyboardWrapFun: event => event.key === "Enter" && !event.isComposing,
  });
  sender = instance;
  const editor = instance.chatElement.richText;
  // ACT: 1.4.6 未检查卸载节点和空 Range 矩形；只适配当前实例，升级到库内修复后可移除。
  const chatEditor = instance.chatEditor as typeof instance.chatEditor & {
    focusFirst(): void;
    focusLast(): void;
    focusMark(): void;
    cursorView(): void;
    insertNodes(nodes: AnyTagProps[][]): Promise<void>;
  };
  for (const method of ["focusFirst", "focusLast", "focusMark"] as const) {
    const focus = chatEditor[method].bind(chatEditor);
    chatEditor[method] = () => {
      if (sender !== instance || !editor.isConnected || !editor.getClientRects().length) return;
      if (method === "focusLast" && resetTask) return;
      if (method === "focusMark" && !editor.contains(instance.getCurrentNode().node)) return chatEditor.focusLast();
      focus();
    };
  }
  const cursorView = chatEditor.cursorView.bind(chatEditor);
  chatEditor.cursorView = () => {
    const selection = instance.getSelection();
    if (sender !== instance || !editor.isConnected || !selection.rangeCount) return;
    const range = selection.getRangeAt(0);
    if (!editor.contains(range.commonAncestorContainer) || !range.getClientRects().length || !editor.parentElement?.getClientRects().length) return;
    cursorView();
  };
  const insertNodes = chatEditor.insertNodes.bind(chatEditor);
  chatEditor.insertNodes = async nodes => {
    // 选区粘贴会先异步删除，再插入；关闭输入框后不再创建并聚焦新节点。
    if (sender === instance && editor.isConnected) await insertNodes(nodes);
  };
  editor.setAttribute("role", "textbox");
  editor.setAttribute("aria-label", "生成提示词");
  editor.setAttribute("aria-multiline", "true");
  instance.bus.on("textPrompt", xSender.EventSet.EVENT_COMMON_CHANGE, () => syncModel());
  syncModel(initialModel);
  // ACT: XSender 1.4.6 默认复制标签名称；复用库截取的选区模型，仅覆盖纯文本，保留富文本粘贴。
  const copyText = (event: ClipboardEvent) => {
    const copied = event.clipboardData?.getData("application/chat-nodes");
    if (copied) event.clipboardData?.setData("text/plain", getPromptText(JSON.parse(copied)));
  };
  editor.addEventListener("copy", copyText);
  editor.addEventListener("cut", copyText);
  const selectReference = (event: MouseEvent) => {
    const item = (event.target as Element).closest<HTMLElement>(".chat-mention-dialog-item");
    if (!item) return;
    event.preventDefault();
    event.stopPropagation();
    const reference = props.references.find(reference => reference.id === item.dataset.id);
    if (reference) void insertReference(reference);
  };
  const closeOutside = (event: PointerEvent) => {
    if (!element.contains(event.target as Node) && !popup.contains(event.target as Node)) {
      instance.bus.emit(xSender.EventSet.EVENT_COMMON_DIALOG_CLOSE);
    }
  };
  // ACT: XSender 1.4.6 的候选默认插入 Mention；捕获选择事件改用公开 setHtml，库支持自定义渲染后可替换。
  popup.addEventListener("click", selectReference, true);
  document.addEventListener("pointerdown", closeOutside, true);
  onCleanup(() => {
    model.value = instance.getModel();
    releaseNodeFocus(instance);
    sender = undefined;
    editor.removeEventListener("copy", copyText);
    editor.removeEventListener("cut", copyText);
    document.removeEventListener("pointerdown", closeOutside, true);
    popup.removeEventListener("click", selectReference, true);
    // ACT: 1.4.6 的 destroy 会删除排队回调仍需用到的字段；先走公开清理事件，库修复后可直接 destroy。
    instance.bus.offKeyEvent("textPrompt");
    instance.bus.emit(xSender.EventSet.EVENT_COMMON_DIALOG_CLOSE);
    instance.updateConfig({ mentionConfig: { dialogTitle: "选择参考", callEvery: false, options: [] } });
    instance.bus.emit(xSender.EventSet.EVENT_COMMON_DESTROY);
    popup.remove();
  });
});

async function insertReference(reference: MentionItem) {
  const instance = sender;
  if (!instance) return;
  const cursor = instance.getCurrentNode();
  const before = cursor.node.textContent?.slice(0, cursor.offset) ?? "";
  const start = before.lastIndexOf("@");
  if (start < 0) return;
  instance.bus.emit(xSender.EventSet.EVENT_COMMON_DIALOG_CLOSE);
  await instance.backspace(start - before.length);
  const current = props.references.find(item => item.id === reference.id);
  if (sender === instance && current) await instance.setHtml(referenceHtml(current));
}

function handleMentionKey(event: KeyboardEvent) {
  if (!sender || event.isComposing || !["ArrowUp", "ArrowDown", "Enter", "Escape"].includes(event.key)) return;
  const dialog = sender.chatElement.dialogRoot.querySelector<HTMLElement>(".chat-mention-dialog-wrap");
  if (!dialog?.getClientRects().length) return;
  event.preventDefault();
  event.stopPropagation();
  if (event.key === "Escape") {
    sender.bus.emit(xSender.EventSet.EVENT_COMMON_DIALOG_CLOSE);
    return;
  }
  // ACT: 1.4.6 的候选键盘监听在 window，会被骨架截断；只适配当前实例，库支持局部键盘 API 后可替换。
  const items = Array.from(dialog.querySelectorAll<HTMLElement>(".chat-mention-dialog-item")).filter(item => item.getClientRects().length);
  if (!items.length) return;
  const active = Math.max(0, items.findIndex(item => item.classList.contains("active")));
  if (event.key === "Enter") {
    items[active]?.click();
    return;
  }
  const next = (active + (event.key === "ArrowDown" ? 1 : -1) + items.length) % items.length;
  items.forEach((item, index) => item.classList.toggle("active", index === next));
  items[next]?.scrollIntoView({ block: "nearest" });
}
</script>

<style scoped>
.promptInput,
:global(.textNodeMentions) {
  --chat-primary: var(--el-color-primary);
  --chat-text: var(--el-text-color-primary);
  --chat-text-secondary: var(--el-text-color-regular);
  --chat-text-placeholder: var(--el-text-color-placeholder);
  --chat-box: var(--el-bg-color-overlay);
  --chat-card: var(--el-fill-color-light);
  --chat-highlight: var(--el-color-primary-light-3);
  --chat-highlight-card: var(--el-fill-color);
  --chat-box-shadow: var(--el-box-shadow-light);
  --chat-rect-padding: 0px;
}

:global(.textNodeMentions) {
  position: fixed;
  inset: 0;
  pointer-events: none;
}

:global(.textNodeMentions .chat-dialog-wrap .chat-mention-dialog-wrap.chat-view-show) {
  animation: none;
}

.promptInput {
  display: block;
  margin: 12px 0 16px;
  cursor: text;
  -webkit-user-select: text;
  user-select: text;

  &:deep(.imageReference) {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    margin: 0 3px;
    padding: 2px 6px 2px 2px;
    border: 1px solid var(--el-border-color-lighter);
    border-radius: var(--el-border-radius-base);
    background: var(--el-fill-color-light);
    color: var(--el-text-color-primary);
    font-size: 12px;
    line-height: 18px;
    white-space: nowrap;
    vertical-align: middle;

    &:has(img) {
      cursor: zoom-in;
    }

    img {
      width: 18px;
      height: 18px;
      flex-shrink: 0;
      object-fit: cover;
      border-radius: 3px;
      pointer-events: none;
    }
  }

  &:deep(.chat-placeholder-wrap) {
    font-style: normal;
  }
}
</style>
