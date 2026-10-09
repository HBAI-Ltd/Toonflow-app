<template>
  <section v-if="tools.length" class="browserPanel" aria-label="浏览器画面">
      <header class="browserHeader">
        <icon-browser :size="14" aria-hidden="true" />
        <span class="browserTitle" :title="session?.url || session?.title">{{ browserAddress || session?.title || "网页浏览器" }}</span>
        <el-button text size="small" :disabled="!frame" @click="expanded = true"><icon-maximize :size="12" aria-hidden="true" /><span>放大</span></el-button>
      </header>
    <teleport :to="dialogScreenTarget || 'body'" :disabled="!expanded || !dialogScreenTarget">
      <div class="browserPanelScreen" :class="{ expandedScreen: expanded }" :aria-busy="status === 'connecting' || status === 'waiting'" @pointerdown="capturePointer" @mousedown.prevent="downScreen" @pointermove="moveScreen" @pointerup="upScreen" @mouseup="upScreen" @pointercancel="resetInput" @lostpointercapture="lostPointer" @pointerleave="leaveScreen" @click.prevent @auxclick.prevent @contextmenu.prevent @wheel.prevent="wheelScreen">
        <img v-if="frame" ref="frameImage" class="browserFrame" :src="frame" :alt="session?.title ? `${session.title}的浏览器画面` : '浏览器实时画面'" draggable="false" @error="frameError" />
        <div v-if="status !== 'live' && !(status === 'paused' && frame)" class="browserNotice" role="status" aria-live="polite">
          <icon-loader-2 v-if="status === 'connecting' || status === 'waiting'" class="is-loading" :size="22" aria-hidden="true" />
          <icon-alert-circle v-else-if="status === 'error'" :size="22" aria-hidden="true" />
          <icon-browser v-else :size="22" aria-hidden="true" />
          <span>{{ connectionMessage || statusLabel }}</span>
        </div>
        <textarea ref="keyboardInput" class="browserKeyboardInput" aria-label="输入到网页" autocomplete="off" autocapitalize="off" spellcheck="false" :disabled="!canInteract" @keydown="keyScreen" @keyup="keyScreen" @blur="resetInput" @input="textScreen" @compositionstart="composing = true" @compositionend="commitComposition" />
      </div>
    </teleport>
    <footer class="browserFooter">
      <span class="browserOperation" role="status">{{ toolError ? "操作未完成" : operationLabel || "网页浏览器" }}</span>
      <span class="browserStatus" :class="{ liveStatus: status === 'live' }" role="status"><span class="statusDot" aria-hidden="true" />{{ statusLabel }}</span>
    </footer>
    <p v-if="toolError || inputError" class="browserToolError" role="alert">{{ inputError || toolError }}</p>
    <el-dialog v-model="expanded" class="browserPanelDialog" title="浏览器画面" width="80%" alignCenter appendToBody destroyOnClose :showClose="false" :closeOnClickModal="false" :closeOnPressEscape="false" @closed="keyboardInput?.blur()">
      <template #header>
        <div class="browserHeader"><icon-browser :size="16" aria-hidden="true" /><span class="browserTitle" :title="session?.url">{{ session?.title || browserAddress || "网页浏览器" }}</span><el-button text size="small" @click="expanded = false"><icon-x :size="15" aria-hidden="true" /><span>关闭</span></el-button></div>
        <nav class="browserNavigation" aria-label="网页导航">
          <el-button text size="small" :disabled="!canNavigate || !session?.canGoBack" @click="navigateBrowser({ type: 'back' })"><icon-arrow-left :size="14" aria-hidden="true" /><span>返回</span></el-button>
          <el-button text size="small" :disabled="!canNavigate || !session?.canGoForward" @click="navigateBrowser({ type: 'forward' })"><icon-arrow-right :size="14" aria-hidden="true" /><span>前进</span></el-button>
          <el-button text size="small" :disabled="!canNavigate" :loading="navigationPending" @click="navigateBrowser({ type: 'reload' })"><icon-refresh v-if="!navigationPending" :size="14" aria-hidden="true" /><span>刷新</span></el-button>
          <el-input ref="addressInput" v-model="addressDraft" class="browserAddressInput" size="small" aria-label="网页地址" placeholder="输入网址，按 Enter 访问" :disabled="!canNavigate" @blur="finishAddressEdit" @keydown.enter="navigateAddress" />
        </nav>
      </template>
      <p v-if="inputError || toolError" class="browserNavigationError" role="alert">{{ inputError || toolError }}</p>
      <div ref="dialogScreenTarget" />
    </el-dialog>
  </section>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, shallowRef, watch } from "vue";
import { ElButton, ElDialog, ElInput } from "element-plus";
import { IconAlertCircle, IconArrowLeft, IconArrowRight, IconBrowser, IconLoader2, IconMaximize, IconRefresh, IconX } from "@tabler/icons-vue";
import "element-plus/es/components/base/style/css";
import "element-plus/es/components/button/style/css";
import "element-plus/es/components/dialog/style/css";
import "element-plus/es/components/input/style/css";
import type { ToolCall } from "@toonflow/tools-scaffold/runtime";
import type { BrowserInput, BrowserSessionState, BrowserStreamEvent } from "./protocol";

type PanelSession = Pick<BrowserSessionState, "browserSessionId"> & Partial<Omit<BrowserSessionState, "browserSessionId">>;
const props = withDefaults(defineProps<{ tools: ToolCall[]; directory?: string; toolSessionId?: string; active: boolean; live?: boolean; interactive?: boolean }>(), { interactive: true });
type BrowserScope = { directory: string } | { toolSessionId: string };
const browserScope = computed<BrowserScope | undefined>(() => props.toolSessionId ? { toolSessionId: props.toolSessionId } : props.directory ? { directory: props.directory } : undefined);
const latestTool = computed(() => props.tools.at(-1));
const session = shallowRef<PanelSession>();
const frame = ref("");
const expanded = ref(false);
const dialogScreenTarget = ref<HTMLElement>();
const frameImage = ref<HTMLImageElement>();
const keyboardInput = ref<HTMLTextAreaElement>();
const frameViewport = ref({ width: 0, height: 0 });
const inputError = ref("");
const addressDraft = ref("");
const addressInput = ref<InstanceType<typeof ElInput>>();
const navigationPending = ref(false);
const canInteract = computed(() => props.interactive && props.active && props.live !== false && status.value === "live");
const canNavigate = computed(() => canInteract.value && session.value?.status === "running" && !!session.value.tabId && !!browserScope.value && !navigationPending.value);
const composing = ref(false);
type InputTarget = BrowserScope & { sessionId: string; tabId: string };
let inputTarget: InputTarget | undefined;
let inputController = new AbortController();
let releasePending = Promise.resolve();
const inputQueue: { input: BrowserInput; target: InputTarget; controller: AbortController }[] = [];
let sendingInput = false;
const pressedKeys = new Map<string, string>();
const pressedButtons = new Map<number, 1 | 2>();
let capturedPointer: { element: HTMLElement; id: number } | undefined;
let moveTimer: ReturnType<typeof setTimeout> | undefined;
let pendingMove: BrowserInput | undefined;
let wheelTimer: ReturnType<typeof setTimeout> | undefined;
let pendingWheel: Extract<BrowserInput, { type: "wheel" }> | undefined;
const status = ref<"waiting" | "connecting" | "live" | "paused" | "ended" | "error">("waiting");
const connectionMessage = ref("");
const browserAddress = computed(() => {
  const url = session.value?.url || "";
  try { return new URL(url).host || url; } catch { return url; }
});
const statusLabel = computed(() => ({
  waiting: session.value ? "等待画面…" : latestTool.value?.status === "running" ? "正在启动浏览器…" : "暂无浏览器画面",
  connecting: "正在连接…", live: "实时画面", paused: "已暂停观看", ended: "会话已结束", error: "画面连接失败",
})[status.value]);
const toolError = computed(() => {
  const tool = latestTool.value;
  if (tool?.status === "interrupted") return "浏览器操作已中断";
  if (tool?.status !== "error") return "";
  try {
    const result: unknown = JSON.parse(tool.result ?? "null");
    if (result && typeof result === "object" && "error" in result && typeof result.error === "string") return result.error;
  } catch { /* 工具失败也可能返回普通文本。 */ }
  return tool.result?.trim() || "浏览器操作失败";
});
const operationLabel = computed(() => {
  const tool = latestTool.value;
  if (!tool || tool.status === "error" || tool.status === "interrupted") return "";
  const labels: Record<string, string> = { open: "打开网页", navigate: "访问网页", snapshot: "读取页面快照", read: "读取正文", hover: "悬停页面", click: "点击页面", type: "填写内容", pressKey: "发送按键", scroll: "滚动页面", screenshot: "截取画面", tabs: "查看标签页", newTab: "打开标签页", selectTab: "切换标签页", closeTab: "关闭标签页", close: "关闭浏览器" };
  const label = typeof tool.args?.action === "string" ? labels[tool.args.action] : undefined;
  return label ? `${label}${tool.status === "running" ? "…" : "完成"}` : "";
});
let streamController: AbortController | undefined;
let sessionIdentity = "";
let sessionEnded = false;

function readSession(tool: ToolCall): PanelSession | undefined {
  try {
    // 截图结果的图片块会追加为 [image]，会话信息始终位于首行 JSON。
    const value: unknown = JSON.parse((tool.result ?? "null").trimStart().split("\n", 1)[0]!);
    if (!value || typeof value !== "object" || !("browserSessionId" in value) || typeof value.browserSessionId !== "string" || !value.browserSessionId.trim()) return;
    const data = value as Record<string, unknown>;
    if (data.status !== "running" && data.status !== "closed") return;
    return { browserSessionId: value.browserSessionId, status: data.status, tabId: typeof data.tabId === "string" ? data.tabId : undefined, title: typeof data.title === "string" ? data.title : undefined, url: typeof data.url === "string" ? data.url : undefined, canGoBack: typeof data.canGoBack === "boolean" ? data.canGoBack : undefined, canGoForward: typeof data.canGoForward === "boolean" ? data.canGoForward : undefined };
  } catch { return; }
}

watch(() => [latestTool.value?.id, latestTool.value?.result, latestTool.value?.status, latestTool.value?.args?.browserSessionId, props.tools.length] as const, (current, previous) => {
  const tool = latestTool.value;
  if (!tool) { session.value = undefined; return; }
  let next = readSession(tool);
  const requestedId = tool.args?.browserSessionId;
  if (!next && typeof requestedId === "string" && requestedId.trim()) {
    next = session.value?.browserSessionId === requestedId ? session.value : { browserSessionId: requestedId };
    for (let index = props.tools.length - 2; index >= 0; index--) {
      const candidate = readSession(props.tools[index]!);
      if (candidate?.browserSessionId === requestedId) { next = candidate; break; }
    }
  }
  if (!next && current[0] !== previous?.[0]) {
    for (let index = props.tools.length - 2; index >= 0; index--) {
      next = readSession(props.tools[index]!);
      if (next) break;
    }
  }
  if (next) session.value = next.browserSessionId === session.value?.browserSessionId ? { ...session.value, ...next } : next;
}, { immediate: true });

watch(() => session.value?.url, url => {
  if (document.activeElement !== addressInput.value?.input) addressDraft.value = url || "";
}, { immediate: true });

function finishAddressEdit() {
  if (document.activeElement === addressInput.value?.input) return;
  addressDraft.value = session.value?.url || "";
}

function navigateAddress(event: Event | KeyboardEvent) {
  if (event instanceof KeyboardEvent && event.isComposing) return;
  event.preventDefault();
  if (!canNavigate.value) return;
  try {
    const url = new URL(addressDraft.value.trim());
    if (!["http:", "https:"].includes(url.protocol) || url.username || url.password) throw new Error();
    navigateBrowser({ type: "navigate", url: url.href });
  } catch { inputError.value = "请输入不含账号密码的有效 HTTP/HTTPS 网页地址"; }
}

function navigateBrowser(input: Extract<BrowserInput, { type: "navigate" | "back" | "forward" | "reload" }>) {
  if (!canNavigate.value) return;
  resetInput();
  inputError.value = "";
  navigationPending.value = true;
  sendInput(input);
}

function resetInput() {
  navigationPending.value = false;
  const target = inputTarget;
  inputTarget = undefined;
  inputController.abort();
  inputController = new AbortController();
  inputQueue.length = 0;
  clearTimeout(moveTimer);
  moveTimer = undefined;
  pendingMove = undefined;
  clearTimeout(wheelTimer);
  wheelTimer = undefined;
  pendingWheel = undefined;
  pressedKeys.clear();
  pressedButtons.clear();
  const pointer = capturedPointer;
  capturedPointer = undefined;
  if (pointer?.element.hasPointerCapture(pointer.id)) pointer.element.releasePointerCapture(pointer.id);
  composing.value = false;
  if (keyboardInput.value) keyboardInput.value.value = "";
  keyboardInput.value?.blur();
  // ACT: 释放必须排在已开始的输入之后，不能随观看流一起取消，否则远端会留下按住的键或鼠标。
  if (target) releasePending = releasePending.then(() => fetch("/api/browser/input", { method: "POST", headers: { "Content-Type": "application/json", "x-toonflow-workspace": "1" }, body: JSON.stringify({ ...target, input: { type: "release" } }), keepalive: true, signal: AbortSignal.timeout(5000) })).then(() => {}, () => {});
}

watch(expanded, resetInput);
watch(() => props.interactive, interactive => { if (!interactive) resetInput(); }, { flush: "sync" });

function stopStream() {
  resetInput();
  streamController?.abort();
  streamController = undefined;
}

function endSession(message = "该浏览器会话已结束，无法继续观看") {
  resetInput();
  sessionEnded = true;
  status.value = "ended";
  connectionMessage.value = message;
}

watch([() => props.active, browserScope, () => session.value?.browserSessionId, () => session.value?.status === "closed", () => props.live] as const, ([active, scope, sessionId, closed, live]) => {
  stopStream();
  const identity = scope && sessionId ? JSON.stringify([scope, sessionId]) : "";
  if (identity !== sessionIdentity) {
    sessionIdentity = identity;
    sessionEnded = false;
    frame.value = "";
    connectionMessage.value = "";
  }
  if (!active) { expanded.value = false; status.value = "paused"; return; }
  // ACT: 同一浏览器可跨轮复用；旧轮只保留已收到的末帧，不重连获取后续轮次的画面。
  if (live === false) { expanded.value = false; status.value = "paused"; connectionMessage.value = ""; return; }
  if (closed || sessionEnded) { endSession(); return; }
  if (!scope || !sessionId) { status.value = "waiting"; return; }
  status.value = "connecting";
  connectionMessage.value = "";
  const controller = new AbortController();
  streamController = controller;
  void connect(scope, sessionId, controller);
}, { immediate: true });

function receiveEvent(event: BrowserStreamEvent, sessionId: string) {
  if (event.type === "state") {
    const state = event.session;
    if (!state || state.browserSessionId !== sessionId || typeof state.tabId !== "string" || typeof state.url !== "string" || typeof state.title !== "string" || !["running", "closed"].includes(state.status)) throw new Error("浏览器状态无效");
    if (state.tabId !== session.value?.tabId) { frame.value = ""; resetInput(); }
    session.value = state;
    if (state.status === "closed") { endSession(); return false; }
    status.value = frame.value ? "live" : "waiting";
  }
  if (event.type === "frame") {
    if (event.sessionId !== sessionId || event.tabId !== session.value?.tabId) return true;
    if (event.mimeType !== "image/jpeg" || typeof event.data !== "string" || !event.data) throw new Error("浏览器画面无效");
    frameViewport.value = { width: event.width, height: event.height };
    frame.value = `data:image/jpeg;base64,${event.data}`;
    connectionMessage.value = "";
    status.value = "live";
  }
  if (event.type === "closed" && event.sessionId === sessionId) { endSession(); return false; }
  if (event.type === "error") throw new Error(typeof event.message === "string" ? event.message : "浏览器画面连接失败");
  return true;
}

async function connect(scope: BrowserScope, sessionId: string, controller: AbortController) {
  let reader: ReadableStreamDefaultReader<string> | undefined;
  try {
    const query = new URLSearchParams({ ...scope, sessionId });
    const response = await fetch(`/api/browser/stream?${query}`, { headers: { "x-toonflow-workspace": "1" }, signal: controller.signal });
    controller.signal.throwIfAborted();
    if (streamController !== controller) return;
    if (response.status === 404) { endSession(); return; }
    if (!response.ok) {
      const result = await response.json().catch(() => null);
      throw new Error(result?.message || `浏览器画面请求失败（${response.status}）`);
    }
    if (!response.body || !response.headers.get("content-type")?.includes("application/x-ndjson")) throw new Error("未收到浏览器画面流");
    reader = response.body.pipeThrough(new TextDecoderStream()).getReader();
    let pending = "";
    while (true) {
      const { value, done } = await reader.read();
      controller.signal.throwIfAborted();
      pending += value ?? "";
      const lines = pending.split("\n");
      pending = lines.pop() ?? "";
      if (done) lines.push(pending);
      for (const line of lines) {
        if (!line.trim()) continue;
        const event: unknown = JSON.parse(line);
        if (!event || typeof event !== "object" || !("type" in event)) throw new Error("浏览器画面事件无效");
        if (!receiveEvent(event as BrowserStreamEvent, sessionId)) return;
      }
      if (done) throw new Error("浏览器画面连接已中断");
    }
  } catch (error) {
    if (controller.signal.aborted || streamController !== controller) return;
    resetInput();
    status.value = "error";
    connectionMessage.value = error instanceof Error ? error.message : "浏览器画面连接失败";
  } finally {
    await reader?.cancel().catch(() => {});
    reader?.releaseLock();
    if (streamController === controller) streamController = undefined;
  }
}

function frameError() {
  resetInput();
  status.value = "error";
  connectionMessage.value = "浏览器画面读取失败";
}

function focusInput() {
  if (canInteract.value) keyboardInput.value?.focus({ preventScroll: true });
}

function screenPoint(event: MouseEvent, outside = false) {
  const image = frameImage.value;
  if (!canInteract.value || !image?.naturalWidth || !image.naturalHeight || !frameViewport.value.width || !frameViewport.value.height) return;
  const rect = image.getBoundingClientRect();
  const scale = Math.min(rect.width / image.naturalWidth, rect.height / image.naturalHeight);
  const width = image.naturalWidth * scale;
  const height = image.naturalHeight * scale;
  const x = event.clientX - rect.left - (rect.width - width) / 2;
  const y = event.clientY - rect.top - (rect.height - height) / 2;
  if (!outside && (x < 0 || y < 0 || x >= width || y >= height)) return;
  return { x: x / width * frameViewport.value.width, y: y / height * frameViewport.value.height };
}

function sendInput(input: BrowserInput) {
  const current = session.value;
  const scope = browserScope.value;
  if (!canInteract.value || !current?.tabId || !scope || !streamController) return;
  if (navigationPending.value && !["navigate", "back", "forward", "reload"].includes(input.type)) return;
  const target = { ...scope, sessionId: current.browserSessionId, tabId: current.tabId };
  inputTarget = target;
  const queued = { input, target, controller: inputController };
  // ACT: HTTP 慢于指针移动时只保留尚未发送的最新位置；按下、抬起和键盘事件仍严格排序。
  const previous = inputQueue.at(-1);
  if (input.type === "mouse" && input.event === "move" && previous?.input.type === "mouse" && previous.input.event === "move") inputQueue[inputQueue.length - 1] = queued;
  else inputQueue.push(queued);
  void drainInput();
}

async function drainInput() {
  if (sendingInput) return;
  sendingInput = true;
  while (inputQueue.length) {
    const { input, target, controller } = inputQueue.shift()!;
    await releasePending;
    if (controller.signal.aborted) continue;
    try {
      const response = await fetch("/api/browser/input", { method: "POST", headers: { "Content-Type": "application/json", "x-toonflow-workspace": "1" }, body: JSON.stringify({ ...target, input }), signal: controller.signal });
      const result = await response.json();
      if (controller.signal.aborted) continue;
      if (response.status === 404) { endSession(result.message); continue; }
      if (!response.ok || result.code !== 200) throw new Error(result.message || "网页操作失败");
      if (["navigate", "back", "forward", "reload"].includes(input.type)) receiveEvent({ type: "state", session: result.data }, target.sessionId);
      inputError.value = "";
    } catch (error) {
      if (!controller.signal.aborted) {
        inputError.value = error instanceof Error ? error.message : "网页操作失败";
        resetInput();
      }
    } finally {
      if (controller === inputController && ["navigate", "back", "forward", "reload"].includes(input.type)) navigationPending.value = false;
    }
  }
  sendingInput = false;
}

function inputModifiers(event: MouseEvent | KeyboardEvent): ("Alt" | "Control" | "Meta" | "Shift")[] {
  return [event.altKey ? "Alt" : "", event.ctrlKey ? "Control" : "", event.metaKey ? "Meta" : "", event.shiftKey ? "Shift" : ""].filter(Boolean) as ("Alt" | "Control" | "Meta" | "Shift")[];
}

function mouseButton(button: number) {
  return button === 2 ? "right" : button === 1 ? "middle" : "left";
}

function capturePointer(event: PointerEvent) {
  if (event.pointerType === "touch" || event.button > 2 || !screenPoint(event)) return;
  const element = event.currentTarget as HTMLElement;
  capturedPointer = { element, id: event.pointerId };
  element.setPointerCapture(event.pointerId);
}

function downScreen(event: MouseEvent) {
  if (event.button > 2) return;
  const point = screenPoint(event);
  if (!point) return;
  focusInput();
  flushMove();
  flushWheel();
  const clickCount = event.detail > 1 ? 2 : 1;
  pressedButtons.set(event.button, clickCount);
  sendInput({ type: "mouse", event: "down", ...point, button: mouseButton(event.button), clickCount, modifiers: inputModifiers(event) });
}

function moveScreen(event: PointerEvent) {
  if (!canInteract.value || event.pointerType === "touch") return;
  const point = screenPoint(event, pressedButtons.size > 0);
  pendingMove = { type: "mouse", event: "move", ...(point || { x: -1, y: -1 }), modifiers: inputModifiers(event) };
  if (!moveTimer) moveTimer = setTimeout(flushMove, 32);
}

function flushMove() {
  clearTimeout(moveTimer);
  moveTimer = undefined;
  if (pendingMove) sendInput(pendingMove);
  pendingMove = undefined;
}

function upScreen(event: MouseEvent) {
  const clickCount = pressedButtons.get(event.button);
  if (!clickCount) return;
  flushMove();
  const point = screenPoint(event, true);
  if (point) sendInput({ type: "mouse", event: "up", ...point, button: mouseButton(event.button), clickCount, modifiers: inputModifiers(event) });
  pressedButtons.delete(event.button);
  if (!pressedButtons.size) capturedPointer = undefined;
}

function lostPointer(event: PointerEvent) {
  if (capturedPointer?.id === event.pointerId) resetInput();
}

function leaveScreen(event: PointerEvent) {
  if (pressedButtons.size) return;
  flushMove();
  sendInput({ type: "mouse", event: "move", x: -1, y: -1, modifiers: inputModifiers(event) });
}

function wheelScreen(event: WheelEvent) {
  const point = screenPoint(event);
  if (!point) return;
  const unit = event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? frameViewport.value.height : 1;
  pendingWheel = { type: "wheel", ...point, modifiers: inputModifiers(event), deltaX: (pendingWheel?.deltaX || 0) + event.deltaX * unit, deltaY: (pendingWheel?.deltaY || 0) + event.deltaY * unit };
  if (wheelTimer) return;
  wheelTimer = setTimeout(flushWheel, 80);
}

function flushWheel() {
  clearTimeout(wheelTimer);
  wheelTimer = undefined;
  if (pendingWheel) sendInput({ ...pendingWheel, deltaX: Math.max(-10000, Math.min(10000, pendingWheel.deltaX)), deltaY: Math.max(-10000, Math.min(10000, pendingWheel.deltaY)) });
  pendingWheel = undefined;
}

function keyScreen(event: KeyboardEvent) {
  if (!canInteract.value) return;
  const code = event.code || event.key;
  if (event.type === "keyup") {
    const key = pressedKeys.get(code);
    if (!key) return;
    pressedKeys.delete(code);
    sendInput({ type: "key", event: "up", key, modifiers: inputModifiers(event) });
    return;
  }
  if (event.isComposing || composing.value || event.keyCode === 229 || ["Process", "Dead", "Unidentified", "AltGraph"].includes(event.key) || event.getModifierState("AltGraph")) return;
  if (((event.ctrlKey || event.metaKey) && !event.altKey && event.key.toLowerCase() === "v") || (event.shiftKey && !event.ctrlKey && !event.metaKey && !event.altKey && event.key === "Insert")) return;
  const clipboard = (event.ctrlKey || event.metaKey) && !event.altKey && !event.shiftKey && ["c", "v", "x"].includes(event.key.toLowerCase());
  // 非拉丁键盘及 IME 由原生 textarea 的新增文本输入，避免按 US 键位猜测字符。
  if (event.key.length === 1 && event.key.charCodeAt(0) > 126 && !event.ctrlKey && !event.metaKey && !event.altKey) return;
  if (!clipboard) event.preventDefault();
  const key = pressedKeys.get(code) || (event.key === " " ? "Space" : event.key);
  pressedKeys.set(code, key);
  sendInput({ type: "key", event: "down", key, modifiers: inputModifiers(event) });
}

function textScreen(event?: Event) {
  if (!canInteract.value || composing.value || (event instanceof InputEvent && event.isComposing) || !keyboardInput.value || document.activeElement !== keyboardInput.value) return;
  const text = keyboardInput.value.value;
  keyboardInput.value.value = "";
  for (let offset = 0; offset < text.length; offset += 20000) sendInput({ type: "text", text: text.slice(offset, offset + 20000) });
}

function commitComposition() {
  if (!composing.value) return;
  composing.value = false;
  textScreen();
}

function visibilityChanged() {
  if (document.hidden) resetInput();
}

onMounted(() => {
  window.addEventListener("blur", resetInput);
  document.addEventListener("visibilitychange", visibilityChanged);
});
onBeforeUnmount(() => {
  stopStream();
  window.removeEventListener("blur", resetInput);
  document.removeEventListener("visibilitychange", visibilityChanged);
});
</script>

<style lang="scss">
.browserPanel,
.browserPanelDialog {
  .browserHeader {
    display: flex;
    align-items: center;
    gap: 7px;
    min-width: 0;
    > svg { flex-shrink: 0; color: var(--el-text-color-secondary); }
    .browserTitle {
      flex: 1;
      min-width: 0;
      overflow: hidden;
      color: var(--el-text-color-regular);
      font-size: 12px;
      font-weight: 500;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .el-button { flex-shrink: 0; height: 24px; margin: 0; padding: 4px 6px; color: var(--el-text-color-secondary); font-size: 11px; }
  }
  .el-button > span { display: inline-flex; align-items: center; gap: 4px; }
}
.browserPanel {
  position: relative;
  display: flex;
  flex-direction: column;
  width: min(100%, 240px);
  min-width: 0;
  min-height: 0;
  overflow: hidden;
  box-sizing: border-box;
  border: 1px solid var(--el-border-color-light);
  border-radius: 10px;
  background: var(--el-bg-color-overlay);
  box-shadow: 0 1px 2px color-mix(in srgb, var(--el-text-color-primary) 4%, transparent);
  .browserHeader { flex-shrink: 0; height: 30px; padding: 0 6px 0 8px; }
  .browserFooter {
    display: flex;
    flex-shrink: 0;
    align-items: center;
    gap: 8px;
    min-height: 22px;
    padding: 3px 8px;
    border-top: 1px solid var(--el-border-color-extra-light);
    color: var(--el-text-color-secondary);
    font-size: 10px;
    line-height: 16px;
    .browserOperation { flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .browserStatus {
      display: inline-flex;
      flex-shrink: 0;
      align-items: center;
      gap: 5px;
      .statusDot { width: 5px; height: 5px; border-radius: 50%; background: var(--el-text-color-placeholder); }
      &.liveStatus .statusDot { background: var(--el-color-success); }
    }
  }
  .browserToolError {
    flex-shrink: 0;
    max-height: 120px;
    margin: 0;
    padding: 9px 11px;
    overflow: auto;
    border-top: 1px solid var(--el-border-color-extra-light);
    color: var(--el-color-danger);
    background: var(--el-color-danger-light-9);
    font-size: 12px;
    line-height: 1.5;
    white-space: pre-wrap;
    overflow-wrap: anywhere;
  }
}
.browserPanelScreen {
  position: relative;
  display: flex;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  width: 100%;
  min-height: 0;
  aspect-ratio: 1280 / 800;
  max-height: 140px;
  overflow: hidden;
  user-select: none;
  touch-action: none;
  background: var(--el-fill-color-light);
  &.expandedScreen { aspect-ratio: auto; height: min(72vh, calc(100dvh - 130px)); max-height: none; border-radius: 6px; }
  .browserFrame { display: block; width: 100%; height: 100%; object-fit: contain; }
  .browserKeyboardInput { position: absolute; bottom: 8px; left: 8px; width: 1px; height: 1px; padding: 0; border: 0; opacity: 0; pointer-events: none; }
  .browserNotice {
    position: absolute;
    inset: 0;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 10px;
    padding: 16px;
    color: var(--el-text-color-regular);
    background: color-mix(in srgb, var(--el-bg-color-overlay) 92%, transparent);
    font-size: 12px;
    text-align: center;
    overflow-wrap: anywhere;
  }
}
.browserPanelDialog.el-dialog {
  padding: 12px;
  border-radius: 10px;
  .el-dialog__header { margin: 0; padding: 0 0 10px; }
  .el-dialog__body { padding: 0; }
  .browserNavigation {
    display: flex;
    align-items: center;
    gap: 6px;
    margin-top: 10px;
    .el-button { flex-shrink: 0; height: 28px; margin: 0; padding: 4px 7px; font-size: 12px; }
    .browserAddressInput { flex: 1; min-width: 0; }
  }
  .browserNavigationError { margin: 0 0 8px; color: var(--el-color-danger); font-size: 12px; overflow-wrap: anywhere; }
  @media (max-width: 600px) {
    .browserNavigation { flex-wrap: wrap; .browserAddressInput { flex-basis: 100%; } }
  }
}
</style>
