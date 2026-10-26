<template>
  <div class="messageInput" :class="{ draggingAttachments, voiceActive }" @dragenter.capture="dragEnterAttachments" @dragover.capture="dragOverAttachments" @dragleave.capture="dragLeaveAttachments" @drop.capture="dropAttachments">
    <div v-if="draggingAttachments" class="attachmentDropHint" role="status">
      <icon-paperclip :size="20" aria-hidden="true" />
      <span>松开添加附件</span>
      <small>图片、视频、文档或代码文件</small>
    </div>
    <div v-if="editingId" class="editingBanner"><span>编辑消息</span><el-button text size="small" :disabled="busy || voiceActive" @click="cancelEdit">取消</el-button></div>
    <div
      class="senderResizeHandle"
      role="separator"
      aria-orientation="horizontal"
      aria-label="调整输入框高度"
      aria-valuemin="44"
      :aria-valuemax="senderMaxHeight"
      :aria-valuenow="senderHeight"
      tabindex="0"
      title="拖动调整输入框高度"
      @focus="senderHeight = sender?.chatElement.rollBox.clientHeight ?? 44"
      @pointerdown="startSenderResize"
      @pointermove="moveSenderResize"
      @pointerup="stopSenderResize"
      @pointercancel="stopSenderResize"
      @lostpointercapture="stopSenderResize"
      @keydown.up.prevent="setSenderHeight((sender?.chatElement.rollBox.clientHeight ?? 44) + 16)"
      @keydown.down.prevent="setSenderHeight((sender?.chatElement.rollBox.clientHeight ?? 44) - 16)" />
    <attachmentList v-if="draftAttachments.length" class="draftAttachments" :attachments="draftAttachments" :directory="directory" removable restorable :disabled="locked" @remove="draftAttachments.splice($event, 1)" @restore="restoreTextAttachment" />
    <div class="senderInput" @pointerdown.capture="armVoiceInput" @contextmenu="voiceActive && $event.preventDefault()" @dragstart="voiceActive && $event.preventDefault()">
      <div ref="senderElement" class="senderEditor" @keydown.capture="handleSenderKeydown"></div>
      <div v-if="voiceActive" class="voiceOverlay" role="status" aria-live="polite">
        <div class="voiceFeedback">
          <span class="voiceWave" aria-hidden="true"><span v-for="(level, index) in voiceBars" :key="index" :style="{ height: `${3 + level * 21}px` }" /></span>
          <span>{{ voiceState === 'starting' ? '正在启动语音识别…' : voiceState === 'listening' ? '开始说话，松开结束' : '正在识别…' }}</span>
        </div>
        <div v-if="voiceText" class="voiceTranscript">{{ voiceText }}</div>
      </div>
    </div>
    <teleport v-for="target in draftMentionTargets" :key="target.key" :to="target.element"><mentionThumbnail v-bind="mentionThumbnailProps(target.mention)" :directory="directory"><icon-photo :size="14" /></mentionThumbnail></teleport>
    <mentionContent ref="draftMentionPreview" :mentions="draftMentions" :directory="directory" removable @remove="removeDraftMention" />
    <div class="senderActions">
      <modelPopover v-model="selectedModel" v-model:reasoningEffort="reasoningEffort" :active="active" :disabled="disabled || voiceActive" />
      <input ref="attachmentInput" type="file" :accept="attachmentAccept" multiple hidden :disabled="locked" @change="selectAttachments" />
      <el-button text circle :disabled="locked" aria-label="添加附件" title="添加附件" @click="attachmentInput?.click()"><icon-paperclip :size="16" /></el-button>
      <mentionMenu ref="mentionMenuRef" :directory="directory" :active="active" :disabled="locked || !directory" :query="mentionQuery" :editor="senderElement" :currentCanvasId="createCanvasContext?.()?.id" @open="captureMentionPosition" @select="insertMentions" @dismiss="mentionQuery = undefined" />
      <skillMenu ref="skillMenuRef" :directory="directory" :active="active" :disabled="locked || !directory" :query="skillQuery" :editor="senderElement" @select="selectSkill" @dismiss="skillQuery = undefined" />
      <el-button class="voiceButton" :class="{ voiceActive }" text circle :disabled="!voiceSupported || (!voiceActive && locked)" :aria-label="voiceButtonLabel" :aria-pressed="voiceActive" :title="voiceButtonLabel" @click="voiceActive ? cancelVoiceInput() : startVoiceInput()"><icon-microphone :size="18" /></el-button>
      <contextUsagePopover v-model:visible="contextMenuVisible" :usage="contextUsage" :stats="stats" :contextWindow="contextWindow" :disabled="voiceActive" />
      <el-button class="sendButton" type="primary" circle :disabled="stopping || (!busy && locked)" :loading="stopping" :aria-label="stopping ? '正在停止' : busy ? '停止生成' : editingId ? '重发消息' : '发送消息'" :title="stopping ? '正在停止' : busy ? '停止生成' : editingId ? '重发消息' : '发送消息'" @click="busy ? emit('stop') : emit('submit')">
        <icon-player-stop-filled v-if="busy" :size="14" />
        <icon-arrow-up v-else :size="16" />
      </el-button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { locale, t, translate } from "@toonflow/i18n/vue";
import { computed, inject, ref, shallowRef, watch } from "vue";
import { IconArrowUp, IconMicrophone, IconPaperclip, IconPhoto, IconPlayerStopFilled } from "@tabler/icons-vue";
import { ElMessage } from "element-plus";
import { getReadableFileMimeType, readableFileAccept } from "@toonflow/server/documentFormats";
import type { AgentContext, AgentMention, AgentStats } from "@toonflow/server/agent/types";
import type { CanvasContext } from "@toonflow/tool-canvas/runtime";
import modelPopover from "@/components/modelPopover.vue";
import skillMenu from "../skillMenu.vue";
import mentionMenu from "../mentionMenu.vue";
import mentionContent from "../mentionContent.vue";
import mentionThumbnail from "../mentionThumbnail.vue";
import { mentionName, mentionParts, mentionThumbnailProps } from "../mentionText";
import attachmentList from "../attachmentList.vue";
import { createPastedTextFile, readTextAttachment } from "../textAttachments";
import type { AgentAttachment, AgentMessage } from "../types";
import contextUsagePopover from "./contextUsage.vue";
import useVoiceInput from "./useVoiceInput";
import xSender, { type AnyTagProps } from "x-sender";
import "x-sender/lib/XSender.css";

const props = defineProps<{ active: boolean; disabled: boolean; busy: boolean; stopping?: boolean; remoteRunning: boolean; deletingId?: string; directory?: string; contextUsage?: AgentContext; stats?: AgentStats; contextWindow: number }>();
const emit = defineEmits<{ submit: []; stop: [] }>();
const selectedModel = defineModel<string>("selectedModel", { required: true });
const reasoningEffort = defineModel<string>("reasoningEffort", { required: true });
const editingId = defineModel<string>("editingId");
const recording = defineModel<boolean>("voiceActive", { default: false });
const restoringAttachment = defineModel<boolean>("restoringAttachment", { default: false });
const createCanvasContext = inject<(() => CanvasContext | undefined) | undefined>("canvas", undefined);
const draftAttachments = ref<AgentAttachment[]>([]);
const attachmentInput = ref<HTMLInputElement>();
const draggingAttachments = ref(false);
let attachmentDragDepth = 0;
const attachmentAccept = `image/*,video/*,${readableFileAccept}`;
const draftMentions = ref<AgentMention[]>([]);
const draftMentionTargets = shallowRef<{ key: symbol; element: HTMLElement; mention: AgentMention }[]>([]);
const draftMentionPreview = ref<InstanceType<typeof mentionContent>>();
let editDraft: { model: AnyTagProps[][]; mentions: AgentMention[]; attachments: AgentAttachment[] } | undefined;
let sender: xSender | undefined;
const senderElement = ref<HTMLElement>();
const skillMenuRef = ref<InstanceType<typeof skillMenu>>();
const skillQuery = ref<string>();
const mentionMenuRef = ref<InstanceType<typeof mentionMenu>>();
const mentionQuery = ref<string>();
let mentionPosition: { node: ReturnType<xSender["getCurrentNode"]>; remove: number } | undefined;
let insertingMentions = false;
const senderHeight = ref(44);
const senderMaxHeight = ref(Math.max(44, window.innerHeight / 2));
let senderResize: { pointerId: number; y: number; height: number } | undefined;
const contextMenuVisible = ref(false);
const locked = computed(() => props.disabled || props.busy || props.stopping || props.deletingId !== undefined || restoringAttachment.value || voiceActive.value);
const { voiceSupported, voiceState, voiceText, voiceActive, voiceButtonLabel, voiceLevel, armVoiceInput, startVoiceInput, clearVoicePress, cancelVoiceInput } = useVoiceInput({
  getSender: () => sender,
  active: () => props.active,
  disabled: () => props.disabled,
  locked: () => locked.value,
  onStart() {
    mentionQuery.value = undefined;
    skillQuery.value = undefined;
    contextMenuVisible.value = false;
  },
});
const voiceBars = computed(() => [0.35, 0.65, 0.85, 1, 0.85, 0.65, 0.35].map(weight => voiceLevel.value * weight));
watch(voiceActive, value => { recording.value = value; }, { flush: "sync" });
watch(locale, () => {
  if (!sender) return;
  sender.updateConfig({ placeholder: translate(voiceSupported ? "输入消息，长按语音输入，@ 提及节点输出或全局素材…" : "输入消息，@ 提及节点输出或全局素材…") });
  sender.chatElement.richText.setAttribute("aria-label", translate("消息"));
  for (const line of sender.chatEditor.NODES) for (const tag of line.children) {
    if (tag.type === "Mention") tag.$el.setAttribute("aria-label", t`预览 ${tag.name}`);
  }
});
watch([locked, () => props.active], ([locked, active]) => {
  if (!active || locked) resetAttachmentDrag();
  if (!active || locked) sender?.disable();
  else sender?.enable();
});
watch(() => props.active, active => {
  if (!active) contextMenuVisible.value = false;
}, { flush: "sync" });

function getDraftContent() {
  return sender?.getModel().map((line, lineIndex) => line.map((tag, tagIndex) => {
    if (tag.type === "Mention") return `{{mention:${tag.id}}}`;
    if (tag.type === "Write") return tag.text;
    return sender?.chatEditor.NODES[lineIndex]?.children[tagIndex]?.$el.textContent ?? "";
  }).join("")).join("\n").replace(/[\ufeff\u200b]/g, "") ?? "";
}

function captureMentionPosition() {
  const node = sender?.getCurrentNode();
  mentionPosition = node?.instance?.$el.isConnected ? { node: { ...node }, remove: mentionQuery.value === undefined ? 0 : mentionQuery.value.length + 1 } : undefined;
  skillQuery.value = undefined;
}

function updateMentionQuery() {
  if (!sender || insertingMentions || sender.chatEditor.isComposition || !sender.chatElement.richText.contains(sender.getSelection().anchorNode)) return;
  const current = sender.getCurrentNode();
  const before = current?.instance?.type === "Write" ? current.instance.text.slice(0, current.offset) : "";
  mentionQuery.value = /(?:^|[^\w@])@([^\s@]*)$/.exec(before)?.[1];
  if (mentionQuery.value !== undefined) captureMentionPosition();
}

function handleSenderKeydown(event: KeyboardEvent) {
  const id = event.target instanceof HTMLElement ? event.target.closest<HTMLElement>("[data-agent-mention]")?.dataset.agentMention : undefined;
  if (id && ["Enter", " "].includes(event.key)) {
    event.preventDefault();
    event.stopPropagation();
    draftMentionPreview.value?.preview(id);
    return;
  }
  if (mentionMenuRef.value?.handleKeydown(event)) return;
  skillMenuRef.value?.handleKeydown(event);
}

async function insertMentions(mentions: AgentMention[]) {
  const instance = sender;
  if (!instance || locked.value || !props.active) return;
  const currentIds = new Set(instance.getTagData().mention.map(item => item.id));
  if (currentIds.size + mentions.length > 20) return ElMessage.warning("每条消息最多提及 20 个输出或素材");
  insertingMentions = true;
  try {
    if (mentionPosition?.node.instance.$el.isConnected) mentionPosition.node.instance.focus(mentionPosition.node.offset);
    else instance.focus("last");
    if (mentionPosition?.remove) await instance.backspace(-mentionPosition.remove);
    for (const mention of mentions) {
      if (sender !== instance || !props.active) break;
      draftMentions.value.push(mention);
      await instance.setMention({ id: mention.id, name: mentionName(mention) });
    }
  } catch (error) {
    ElMessage.error(error instanceof Error ? error.message : "添加提及失败");
  } finally {
    mentionQuery.value = undefined;
    mentionPosition = undefined;
    insertingMentions = false;
  }
}

async function removeDraftMention(id: string) {
  if (!locked.value) await sender?.removeMention([id]);
}

async function selectSkill(name: string) {
  const instance = sender;
  if (!instance || locked.value) return;
  const model = instance.getModel();
  const first = model[0]?.[0];
  if (first?.type === "Write") first.text = `/skill:${name} ${first.text.replace(skillQuery.value !== undefined ? /^\/\S*/ : /^\s*\/skill:\S+(?:\s+|$)/, "")}`;
  if (!model.length) model.push([]);
  if (first?.type !== "Write") model[0]!.unshift({ type: "Write", text: `/skill:${name} ` });
  skillQuery.value = undefined;
  mentionMenuRef.value?.closeMenu();
  await instance.reset({ clearHistory: false, chatNode: model });
  if (sender === instance) instance.focus("last");
}

async function fillPrompt(prompt: string, attachments?: AgentAttachment[]) {
  const instance = sender;
  if (!instance || locked.value) return;
  draftMentions.value = [];
  if (attachments) draftAttachments.value = [...attachments];
  await instance.reset({ clearHistory: false, chatNode: [[{ type: "Write", text: prompt }]] });
  if (sender === instance) instance.focus("last");
}

async function editMessage(item: AgentMessage) {
  const instance = sender;
  if (!instance || locked.value || props.remoteRunning || item.role !== "user") return;
  if (!editingId.value) editDraft = { model: instance.getModel(), mentions: [...draftMentions.value], attachments: [...draftAttachments.value] };
  editingId.value = item.id;
  draftMentions.value = [...item.mentions ?? []];
  draftAttachments.value = [...item.attachments ?? []];
  mentionMenuRef.value?.closeMenu();
  const model: AnyTagProps[][] = item.content.split("\n").map(line => mentionParts(line, item.mentions).map(part => part.mention
    ? { type: "Mention", id: part.mention.id, name: mentionName(part.mention) } : { type: "Write", text: part.text }));
  await instance.reset({ chatNode: model });
  if (sender === instance) instance.focus("last");
}

async function restoreEditingDraft() {
  const draft = editDraft;
  editDraft = undefined;
  editingId.value = undefined;
  draftMentions.value = draft?.mentions ?? [];
  draftAttachments.value = draft?.attachments ?? [];
  await sender?.reset({ chatNode: draft?.model });
}

async function cancelEdit() {
  if (props.busy || props.deletingId !== undefined || voiceActive.value) return;
  clearVoicePress();
  await restoreEditingDraft();
}

function setSenderHeight(height: number) {
  if (!sender) return;
  senderMaxHeight.value = Math.max(44, window.innerHeight / 2);
  senderHeight.value = Math.max(44, Math.min(senderMaxHeight.value, Math.round(height)));
  sender.chatElement.rollBox.style.height = `${senderHeight.value}px`;
}

function startSenderResize(event: PointerEvent) {
  if (event.button !== 0 || senderResize || !sender || voiceActive.value) return;
  event.preventDefault();
  senderResize = { pointerId: event.pointerId, y: event.clientY, height: sender.chatElement.rollBox.getBoundingClientRect().height };
  senderHeight.value = senderResize.height;
  (event.currentTarget as HTMLElement).setPointerCapture(event.pointerId);
}

function moveSenderResize(event: PointerEvent) {
  if (senderResize?.pointerId !== event.pointerId) return;
  setSenderHeight(senderResize.height + senderResize.y - event.clientY);
}

function stopSenderResize(event: PointerEvent) {
  if (senderResize?.pointerId === event.pointerId) senderResize = undefined;
}

async function restoreTextAttachment(index: number) {
  const instance = sender;
  const attachment = draftAttachments.value[index];
  if (!instance || locked.value || !props.active || attachment?.mimeType !== "text/plain") return;
  restoringAttachment.value = true;
  try {
    const text = await readTextAttachment(attachment, props.directory);
    if (sender !== instance || !props.active || props.disabled || !draftAttachments.value.includes(attachment)) return;
    instance.focus("last");
    await instance.setText(`${instance.isEmpty(false) ? "" : "\n"}${text}`);
    if (sender === instance) draftAttachments.value = draftAttachments.value.filter(item => item !== attachment);
  } catch (error) {
    ElMessage.error(error instanceof Error ? error.message : "还原文本附件失败，请重试");
  } finally {
    restoringAttachment.value = false;
  }
}

function pasteAttachments(event: ClipboardEvent) {
  const files = Array.from(event.clipboardData?.files ?? []);
  if (!files.length) {
    try {
      const file = createPastedTextFile(event.clipboardData?.getData("text/plain") ?? "");
      if (file) files.push(file);
    } catch (error) {
      event.preventDefault();
      event.stopImmediatePropagation();
      ElMessage.warning(error instanceof Error ? error.message : "无法添加文本附件");
      return;
    }
  }
  if (!files.length) return;
  event.preventDefault();
  event.stopImmediatePropagation();
  addAttachments(files);
}

function selectAttachments(event: Event) {
  const input = event.target as HTMLInputElement;
  addAttachments(Array.from(input.files ?? []));
  input.value = "";
}

function resetAttachmentDrag() {
  attachmentDragDepth = 0;
  draggingAttachments.value = false;
}

function dragEnterAttachments(event: DragEvent) {
  if (!event.dataTransfer?.types.includes("Files")) return;
  attachmentDragDepth++;
  dragOverAttachments(event);
}

function dragOverAttachments(event: DragEvent) {
  if (!event.dataTransfer?.types.includes("Files")) return;
  event.preventDefault();
  event.stopPropagation();
  draggingAttachments.value = !locked.value && props.active;
  if (draggingAttachments.value) attachmentDragDepth = Math.max(1, attachmentDragDepth);
  event.dataTransfer.dropEffect = draggingAttachments.value ? "copy" : "none";
}

function dragLeaveAttachments(event: DragEvent) {
  if (!attachmentDragDepth) return;
  event.stopPropagation();
  if (--attachmentDragDepth === 0) resetAttachmentDrag();
}

function dropAttachments(event: DragEvent) {
  resetAttachmentDrag();
  const files = Array.from(event.dataTransfer?.files ?? []);
  if (!files.length) return;
  event.preventDefault();
  event.stopPropagation();
  addAttachments(files);
}

function addAttachments(files: File[]) {
  if (locked.value) return;
  for (const file of files) {
    const readableMimeType = getReadableFileMimeType(file.name, file.type);
    const mimeType = readableMimeType ?? file.type.split(";")[0]!.trim().toLowerCase();
    if (!readableMimeType && !/^(image|video)\//.test(mimeType)) {
      ElMessage.warning("只支持图片、视频和受支持的文本或文档文件");
      continue;
    }
    if (!file.size || file.size > 100 * 1024 * 1024) {
      ElMessage.warning("附件不能为空且不能超过 100 MB");
      continue;
    }
    if (mimeType === "text/plain" && file.size > 400000) {
      ElMessage.warning("文本附件不能超过 400000 字节");
      continue;
    }
    if (draftAttachments.value.length >= 20) {
      ElMessage.warning("每条消息最多添加 20 个附件");
      break;
    }
    draftAttachments.value.push({ name: file.name, path: "", mimeType, file });
  }
}

watch(senderElement, (element, _previous, onCleanup) => {
  if (!element) return;
  const instance = new xSender(element, {
    autoFocus: props.active,
    placeholder: translate(voiceSupported ? "输入消息，长按语音输入，@ 提及节点输出或全局素材…" : "输入消息，@ 提及节点输出或全局素材…"),
    chatStyle: { minHeight: "44px", maxHeight: "50vh", fontSize: "14px", lineHeight: "24px" },
    keyboardSendFun: event => event.key === "Enter" && !event.shiftKey && !event.isComposing,
    keyboardWrapFun: event => event.key === "Enter" && event.shiftKey && !event.isComposing,
  });
  sender = instance;
  if (!props.active || locked.value) instance.disable();
  instance.bus.on("agentConversation", xSender.EventSet.EVENT_COMMON_SEND, () => emit("submit"));
  instance.bus.on("agentConversation", xSender.EventSet.EVENT_COMMON_CHANGE, () => {
    skillQuery.value = /^\/([^\s/]*)$/.exec(instance.getText())?.[1];
    const targets: typeof draftMentionTargets.value = [];
    for (const line of instance.chatEditor.NODES) for (const tag of line.children) {
      if (tag.type !== "Mention") continue;
      tag.$el.dataset.agentMention = tag.id;
      tag.$el.setAttribute("role", "button");
      tag.$el.setAttribute("tabindex", "0");
      tag.$el.setAttribute("aria-label", t`预览 ${tag.name}`);
      const mention = draftMentions.value.find(item => item.id === tag.id);
      if (!mention || !mentionThumbnailProps(mention).thumbnail) continue;
      const content = tag.$el.querySelector<HTMLElement>(".chat-tag-mention");
      if (!content) continue;
      let element = content.querySelector<HTMLElement>(".agentMentionThumbnail");
      if (!element) {
        element = document.createElement("span");
        element.className = "agentMentionThumbnail";
        const label = document.createElement("span");
        label.className = "agentMentionLabel";
        label.textContent = content.textContent;
        content.replaceChildren(element, label);
      }
      targets.push({ key: draftMentionTargets.value.find(target => target.element === element)?.key ?? Symbol(), element, mention });
    }
    draftMentionTargets.value = targets;
    void instance.nextTick(() => { if (sender === instance) updateMentionQuery(); });
  });
  instance.bus.on("agentConversation", xSender.EventSet.EVENT_COMMON_TAG_CLICK, (tag: { type: string; id?: string }) => {
    if (tag.type === "Mention" && tag.id) draftMentionPreview.value?.preview(tag.id);
  });
  const editor = instance.chatElement.richText;
  const nextTick = instance.nextTick.bind(instance);
  instance.nextTick = callback => nextTick(() => { if (sender === instance && editor.isConnected) return typeof callback === "function" ? callback() : callback; });
  const chatEditor = instance.chatEditor as typeof instance.chatEditor & { insertNodes(nodes: AnyTagProps[][]): Promise<void> };
  const insertNodes = chatEditor.insertNodes.bind(chatEditor);
  chatEditor.insertNodes = async nodes => {
    // 异步粘贴和输入法回调在编辑器卸载后不再新建输入节点。
    if (sender === instance && editor.isConnected) await insertNodes(nodes);
  };
  editor.setAttribute("role", "textbox");
  editor.setAttribute("aria-label", translate("消息"));
  editor.setAttribute("aria-multiline", "true");
  element.addEventListener("paste", pasteAttachments, true);
  window.addEventListener("dragend", resetAttachmentDrag, true);
  window.addEventListener("drop", resetAttachmentDrag, true);
  window.addEventListener("blur", resetAttachmentDrag);
  const updateCursor = (event: Event) => { if (!(event instanceof KeyboardEvent) || event.key !== "Escape") updateMentionQuery(); };
  editor.addEventListener("keyup", updateCursor);
  editor.addEventListener("compositionend", updateCursor);
  onCleanup(() => {
    cancelVoiceInput();
    draftMentionTargets.value = [];
    sender = undefined;
    senderResize = undefined;
    element.removeEventListener("paste", pasteAttachments, true);
    window.removeEventListener("dragend", resetAttachmentDrag, true);
    window.removeEventListener("drop", resetAttachmentDrag, true);
    window.removeEventListener("blur", resetAttachmentDrag);
    resetAttachmentDrag();
    editor.removeEventListener("keyup", updateCursor);
    editor.removeEventListener("compositionend", updateCursor);
    // ACT: XSender 1.4.6 的排队聚焦不会随 destroy 取消；保留回调所需字段，库修复后可恢复直接销毁。
    Object.assign(instance.chatEditor, { focusFirst: () => {}, focusLast: () => {}, focusMark: () => {}, cursorView: () => {} });
    for (const line of instance.chatEditor.NODES) for (const tag of line.children) {
      if (tag.type === "Write" || tag.type === "Input") tag.focus = () => {};
    }
    instance.bus.offKeyEvent("agentConversation");
    instance.bus.emit(xSender.EventSet.EVENT_COMMON_DESTROY);
  });
});


function getDraft() {
  return { prompt: getDraftContent(), attachments: draftAttachments.value, mentions: draftMentions.value, mentionedIds: sender?.getTagData().mention.map(mention => mention.id) ?? [] };
}

async function clearDraft() {
  draftAttachments.value = [];
  draftMentions.value = [];
  await sender?.reset();
}

defineExpose({ getDraft, clearDraft, fillPrompt, editMessage, cancelEdit, restoreEditingDraft });
</script>

<style lang="scss">
.agentConversation {
  .messageInput {
    --chat-text: var(--el-text-color-primary);
    --chat-text-placeholder: var(--el-text-color-placeholder);
    --chat-rect-padding: 12px;
    --chat-mention-text: var(--el-color-primary);
    position: relative;
    flex-shrink: 0;
    margin: 0 12px 8px;
    border: 1px solid var(--el-border-color-light);
    border-radius: calc(var(--ui-radius) * 2.75);
    background: var(--el-bg-color);
    box-shadow: 0 4px 16px rgb(0 0 0 / 8%);

    &:focus-within {
      border-color: var(--el-color-primary-light-5);
    }

    &.draggingAttachments {
      border-color: var(--el-color-primary-light-5);
    }

    &.voiceActive {
      border-color: var(--el-color-primary);
      box-shadow: 0 0 0 2px var(--el-color-primary-light-9);

      .senderInput {
        min-height: 100px;
        touch-action: none;
        user-select: none;
      }
    }

    .senderInput {
      position: relative;

      .voiceOverlay {
        position: absolute;
        inset: 0;
        z-index: 12;
        overflow: auto;
        padding: 12px;
        border-radius: calc(var(--ui-radius) * 2.75);
        background: var(--el-bg-color);
        color: var(--el-text-color-placeholder);
        font-size: 14px;
        line-height: 24px;
        white-space: pre-wrap;
        overflow-wrap: anywhere;
        pointer-events: none;

        .voiceFeedback {
          display: flex;
          align-items: center;
          gap: 10px;
          min-height: 24px;
          color: var(--el-color-primary);

          .voiceWave {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            gap: 3px;
            height: 24px;
            flex-shrink: 0;

            > span {
              width: 3px;
              min-height: 3px;
              border-radius: 3px;
              background: currentColor;
              transition: height 60ms linear;
            }
          }
        }

        .voiceTranscript { color: var(--el-text-color-primary); }

        @media (prefers-reduced-motion: reduce) {
          .voiceFeedback .voiceWave > span { transition: none; }
        }
      }
    }

    .attachmentDropHint {
      position: absolute;
      inset: 0;
      z-index: 13;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 4px;
      border-radius: inherit;
      background: var(--el-bg-color);
      color: var(--el-text-color-primary);
      font-size: 14px;
      font-weight: 500;
      pointer-events: none;

      > svg {
        color: var(--el-text-color-secondary);
      }

      small {
        color: var(--el-text-color-secondary);
        font-size: 12px;
        font-weight: 400;
      }
    }

    .senderResizeHandle {
      position: absolute;
      z-index: 12;
      top: -4px;
      right: 12px;
      left: 12px;
      height: 8px;
      border-radius: 4px;
      cursor: ns-resize;
      touch-action: none;
      user-select: none;

      &:focus-visible {
        outline: 2px solid var(--el-color-primary);
        outline-offset: 2px;
      }
    }

    .draftAttachments {
      padding: 12px 12px 0;
    }

    .senderEditor .chat-placeholder-wrap {
      font-size: 14px;
      font-style: normal;
      line-height: 24px;
    }

    .editingBanner {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 3px 12px;
      border-bottom: 1px solid var(--el-border-color-lighter);
      color: var(--el-text-color-secondary);
      font-size: 12px;
    }

    .senderEditor .chat-tag-mention {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      max-width: 100%;
      vertical-align: middle;
      border-radius: var(--el-border-radius-small);
      background: var(--el-color-primary-light-9);
      color: var(--el-color-primary);
      white-space: normal;
      overflow-wrap: anywhere;
      cursor: pointer;

      .agentMentionThumbnail {
        display: inline-flex;
        flex-shrink: 0;

        .mentionThumbnail { width: 24px; height: 24px; border-radius: 3px; }
      }
      .agentMentionLabel { min-width: 0; }
    }

    .senderActions {
      display: flex;
      justify-content: flex-end;
      align-items: center;
      gap: 12px;
      padding: 2px 8px 6px;

      > .el-button {
        margin-left: 0;
      }

      .modelPopover {
        flex: 1;
        margin-right: auto;
      }

      .contextButton {
        width: 24px;
        height: 24px;
        flex-shrink: 0;
        margin: 0;
        padding: 0;

        &.is-text {
          background-color: transparent;
        }
      }

      .voiceButton {
        width: 28px;
        height: 28px;
        flex-shrink: 0;
        padding: 0;
        color: var(--el-text-color-secondary);

        &.voiceActive {
          background-color: var(--el-color-primary);
          color: white;
          box-shadow: 0 0 0 4px var(--el-color-primary-light-8);
        }
      }

      .sendButton {
        width: 34px;
        height: 34px;
        border: none;
        transform: translateY(-2px);
      }
    }
  }
}
</style>
