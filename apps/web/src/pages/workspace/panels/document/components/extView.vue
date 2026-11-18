<template>
  <section class="extView" :aria-label="context.resource.label" @keydown.ctrl.s.capture.prevent="save" @keydown.meta.s.capture.prevent="save">
    <div v-if="context.error || runtimeError" class="extError" role="alert">
      <span>{{ context.error || runtimeError }}</span>
      <span class="errorActions">
        <el-button v-if="session.conflict" text size="small" @click="reloadDisk">载入磁盘版本</el-button>
        <el-button v-if="context.dirty && session.extension.text" text size="small" @click="saveCopy">另存副本</el-button>
        <el-button v-if="runtimeError || context.dirty || !session.component" text size="small" @click="retry">重试</el-button>
      </span>
    </div>
    <div v-if="session.extensionChanged" class="extensionNotice" role="status">扩展已更新，关闭该扩展的所有标签后重新打开，以应用新版本。</div>
    <div v-if="session.extensionDisabled" class="extensionNotice" role="status">扩展已停用。未保存内容仍保留，请重试保存、另存副本或重新启用扩展。</div>
    <div v-loading="context.loading && !session.extensionDisabled" class="extContent" :inert="session.extensionDisabled">
      <component v-if="session.component && !runtimeError" :is="session.component" :context="context" />
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, onErrorCaptured, onBeforeUnmount, ref, shallowRef, watch } from "vue";
import type { ExtContext } from "@toonflow/ext-scaffold/runtime";
import { usePluginServerFactory } from "@toonflow/plugin-server/vue";
import { ElMessage, ElMessageBox } from "element-plus";
import type { IDockviewPanelProps } from "dockview-vue";
import type { EditorParams } from "../documentSession";
import { documentError } from "../documentSession";

const props = defineProps<{ params: IDockviewPanelProps<EditorParams> }>();
const session = computed(() => props.params.params.session);
const createServer = usePluginServerFactory();
const server = shallowRef(createServer());
onBeforeUnmount(() => server.value.dispose());
function resetServer() { server.value.dispose(); server.value = createServer(); }
watch(() => [session.value, session.value.component] as const, ([current, component], [previous, previousComponent]) => {
  if (current !== previous || previousComponent && component !== previousComponent) resetServer();
}, { flush: "sync" });
const visible = ref(props.params.api.isVisible);
const visibility = props.params.api.onDidVisibilityChange(event => { visible.value = event.isVisible; });
onBeforeUnmount(() => visibility.dispose());
const context = computed(() => new Proxy(session.value.context, {
  get(target, key, receiver) {
    if (key === "server") return server.value;
    if (key === "location") return props.params.params.view.location;
    if (key === "active") return visible.value && target.active;
    return Reflect.get(target, key, receiver);
  },
}) as ExtContext);
const runtimeError = ref("");
watch(() => session.value.extensionDisabled, disabled => {
  if (disabled) void server.value.stop().catch(error => { runtimeError.value = documentError(error); });
});
onErrorCaptured(error => { server.value.dispose(); runtimeError.value = error instanceof Error ? error.message : String(error); return false; });
function save() { void context.value.flushSave().catch(() => {}); }
function retry() {
  if (runtimeError.value) { resetServer(); runtimeError.value = ""; return; }
  if (context.value.dirty) save();
  else {
    session.value.ready = session.value.load();
    void session.value.ready.catch(() => {});
  }
}
async function reloadDisk() {
  try {
    await ElMessageBox.confirm("将重新读取磁盘中的文件，替换当前内容。未保存的修改会丢失，如需保留，请先另存副本。", "载入磁盘版本", { type: "warning", confirmButtonText: "载入", cancelButtonText: "取消" });
    await session.value.reloadDisk();
  } catch (error) { if (error !== "cancel" && error !== "close") ElMessage.error(documentError(error)); }
}
async function saveCopy() {
  try {
    const path = context.value.resource.path;
    const dot = path.lastIndexOf(".");
    const suggested = dot > path.lastIndexOf("/") ? `${path.slice(0, dot)} 副本${path.slice(dot)}` : `${path} 副本`;
    const { value } = await ElMessageBox.prompt("请输入当前工作区内的相对路径，例如“文件夹/副本.txt”。不会覆盖已有的同名文件。", "另存副本", { inputValue: suggested, inputValidator: value => !!value?.trim() || "请输入文件路径", confirmButtonText: "保存", cancelButtonText: "取消" });
    await context.value.files.write(value.trim(), context.value.text, true);
    ElMessage.success("副本已保存");
  } catch (error) { if (error !== "cancel" && error !== "close") ElMessage.error(documentError(error)); }
}
</script>

<style scoped lang="scss">
.extView {
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;
  min-height: 0;
  background: var(--el-bg-color);
  .extError {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 8px 12px;
    color: var(--el-color-danger);
    background: var(--el-color-danger-light-9);
    font-size: 12px;
    overflow-wrap: anywhere;
    .errorActions { display: flex; flex-shrink: 0; flex-wrap: wrap; }
  }
  .extensionNotice { padding: 6px 12px; color: var(--el-color-warning); font-size: 12px; }
  .extContent { flex: 1; min-width: 0; min-height: 0; overflow: hidden; }
}
</style>
