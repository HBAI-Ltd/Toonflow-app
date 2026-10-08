<template>
  <section class="productionPanel" aria-label="生产工作台">
    <header class="panelHeader">
      <div>
        <p class="eyebrow">生产工作台</p>
        <h1>{{ workspace.project?.name || "未命名工作区" }}</h1>
      </div>
      <div class="headerActions">
        <el-button :loading="loading" :icon="IconRefresh" aria-label="刷新生产清单" @click="loadData">刷新</el-button>
        <el-button :loading="syncing" :icon="IconArrowsExchange" @click="sync">同步状态</el-button>
      </div>
    </header>

    <el-alert v-if="error" class="panelError" type="error" :title="error" showIcon closable @close="error = ''" />

    <div class="productionLayout">
      <section class="shotSection">
        <div class="sectionToolbar">
          <div class="toolbarInfo">镜头 {{ manifest?.shots.length || 0 }} 个，已选 {{ selectedShots.length }} 个</div>
          <div class="toolbarActions">
            <el-select v-model="generationProvider" class="providerSelect" placeholder="供应商" aria-label="生成供应商">
              <el-option label="Draw Things" value="drawThings" />
              <el-option label="OpenAI" value="openai" />
            </el-select>
            <el-input v-model="generationModel" class="modelInput" placeholder="模型 ID" aria-label="生成模型" />
            <el-select v-model="generationMediaType" class="mediaSelect" aria-label="媒体类型">
              <el-option label="视频" value="video" />
              <el-option label="图片" value="image" />
              <el-option label="音频" value="audio" />
            </el-select>
            <el-button type="primary" :loading="generating" :disabled="!selectedShots.length || !generationModel.trim()" :icon="IconPlayerPlay" @click="generateSelected">批量生成</el-button>
          </div>
        </div>

        <el-table
          ref="shotTable"
          v-loading="loading"
          class="shotTable"
          :data="manifest?.shots || []"
          rowKey="id"
          highlightCurrentRow
          @selection-change="onSelectionChange"
          @current-change="selectShot">
          <el-table-column type="selection" width="44" />
          <el-table-column label="#" width="54">
            <template #default="{ row }">{{ row.order + 1 }}</template>
          </el-table-column>
          <el-table-column label="镜头" minWidth="170">
            <template #default="{ row }">
              <div class="shotTitle">{{ row.title || "未命名镜头" }}</div>
              <div class="shotPrompt">{{ row.prompt }}</div>
            </template>
          </el-table-column>
          <el-table-column label="模型" minWidth="130">
            <template #default="{ row }">{{ row.modelId || row.model || "未设置" }}</template>
          </el-table-column>
          <el-table-column label="状态" width="110">
            <template #default="{ row }"><el-tag :type="statusType(row.status)" effect="plain">{{ statusLabel(row.status) }}</el-tag></template>
          </el-table-column>
          <el-table-column label="输出" minWidth="160">
            <template #default="{ row }">
              <span v-if="row.outputPath" class="outputPath" :title="row.outputPath">{{ row.outputPath }}</span>
              <span v-else class="muted">未生成</span>
            </template>
          </el-table-column>
          <el-table-column label="任务" width="110">
            <template #default="{ row }">
              <el-button v-if="taskForShot(asShot(row))?.status === 'failed' || taskForShot(asShot(row))?.status === 'cancelled'" text type="danger" :icon="IconRotate" @click.stop="retry(asShot(row))">重试</el-button>
              <span v-else-if="taskForShot(asShot(row))" class="taskStatus">{{ statusLabel(taskForShot(asShot(row))!.status) }}</span>
              <span v-else class="muted">-</span>
            </template>
          </el-table-column>
        </el-table>
      </section>

      <aside class="detailSection">
        <div class="sectionHeading"><span>镜头详情</span><el-button text :disabled="!selectedShot || saving" :loading="saving" :icon="IconDeviceFloppy" @click="saveSelected">保存</el-button></div>
        <template v-if="selectedShot">
          <el-form labelPosition="top" class="shotForm">
            <el-form-item label="标题"><el-input v-model="selectedShot.title" /></el-form-item>
            <el-form-item label="提示词"><el-input v-model="selectedShot.prompt" type="textarea" :rows="6" resize="vertical" /></el-form-item>
            <div class="formGrid">
              <el-form-item label="媒体类型"><el-select v-model="selectedShot.mediaType" class="fullWidth"><el-option label="视频" value="video" /><el-option label="图片" value="image" /><el-option label="音频" value="audio" /></el-select></el-form-item>
              <el-form-item label="时长（秒）"><el-input-number v-model="selectedShot.duration" :min="0.1" :precision="1" controlsPosition="right" class="fullWidth" /></el-form-item>
            </div>
            <el-form-item label="供应商"><el-input v-model="selectedShot.providerId" placeholder="drawThings" /></el-form-item>
            <el-form-item label="模型 ID"><el-input v-model="selectedShot.modelId" placeholder="模型 ID" /></el-form-item>
            <el-form-item label="输出目录"><el-input v-model="selectedShot.outputDirectory" placeholder="assets/production/shot-id" /></el-form-item>
            <el-form-item v-if="taskForShot(selectedShot)?.error" label="任务错误"><el-alert type="error" :title="taskForShot(selectedShot)?.error" :closable="false" showIcon /></el-form-item>
          </el-form>
        </template>
        <el-empty v-else description="选择一个镜头查看详情" :imageSize="72" />

        <div class="exportSection">
          <div class="sectionHeading"><span>导出成片</span><el-tag v-if="exportTask" :type="exportType" effect="plain">{{ statusLabel(exportTask.status) }}</el-tag></div>
          <el-input v-model="exportPath" placeholder="assets/production/final.mp4" aria-label="导出路径" />
          <p class="exportHint">将使用 {{ exportInputs.length }} 个已生成片段，按镜头顺序拼接。</p>
          <el-progress v-if="exportTask && ['queued', 'running'].includes(exportTask.status)" :percentage="Math.round(exportTask.progress)" :status="exportTask.status === 'running' ? undefined : 'warning'" />
          <p v-if="exportTask?.error" class="errorText">{{ exportTask.error }}</p>
          <div class="exportActions">
            <el-button type="primary" :loading="exporting" :disabled="!exportInputs.length || !exportPath.trim() || exporting" :icon="IconDownload" @click="startExport">开始导出</el-button>
            <el-button v-if="exportTask && ['queued', 'running'].includes(exportTask.status)" :icon="IconX" @click="cancelExport">取消</el-button>
          </div>
          <p v-if="exportTask?.status === 'completed'" class="successText">已导出：{{ exportTask.outputPath }}</p>
        </div>
      </aside>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from "vue";
import { ElMessage, type TableInstance } from "element-plus";
import { IconArrowsExchange, IconDeviceFloppy, IconDownload, IconPlayerPlay, IconRefresh, IconRotate, IconX } from "@tabler/icons-vue";
import { useWorkspaceStore } from "@/stores/workspace";
import useProduction, { type ExportTask, type MediaTask, type MediaType, type ProductionManifest, type ProductionShot } from "@/lib/production";

const workspace = useWorkspaceStore();
const manifest = ref<ProductionManifest>();
const selectedShots = ref<ProductionShot[]>([]);
const selectedShot = ref<ProductionShot>();
const mediaTasks = ref<MediaTask[]>([]);
const exportTask = ref<ExportTask>();
const loading = ref(false);
const saving = ref(false);
const syncing = ref(false);
const generating = ref(false);
const exporting = ref(false);
const error = ref("");
const generationProvider = ref("drawThings");
const generationModel = ref("minimax_h3_ref2va_i6x.ckpt");
const generationMediaType = ref<MediaType>("video");
const exportPath = ref("assets/production/final.mp4");
const shotTable = ref<TableInstance>();
let pollTimer: ReturnType<typeof setTimeout> | undefined;
let requestController: AbortController | undefined;

const exportInputs = computed(() => (manifest.value?.shots || []).filter(shot => shot.outputPath).sort((left, right) => left.order - right.order).map(shot => shot.outputPath!));
const exportType = computed(() => exportTask.value?.status === "failed" ? "danger" : exportTask.value?.status === "completed" ? "success" : "info");

function production() { return useProduction(); }
function asShot(value: unknown) { return value as ProductionShot; }
function taskForShot(shot: ProductionShot) { return mediaTasks.value.find(task => task.id === shot.taskId); }
function setManifest(next: ProductionManifest) {
  manifest.value = next;
  if (selectedShot.value) selectedShot.value = next.shots.find(shot => shot.id === selectedShot.value?.id);
}
function statusLabel(status: string) { return ({ draft: "草稿", queued: "排队中", running: "运行中", generating: "生成中", review: "待审核", approved: "已批准", needsRedo: "需重试", completed: "已完成", cancelled: "已取消", failed: "失败" } as Record<string, string>)[status] || status; }
function statusType(status: string) { return ({ draft: "info", queued: "warning", generating: "warning", review: "success", approved: "success", completed: "success", needsRedo: "danger", failed: "danger", cancelled: "info", running: "warning" } as Record<string, "success" | "warning" | "danger" | "info">)[status] || "info"; }
function onSelectionChange(rows: ProductionShot[]) { selectedShots.value = rows; }
function selectShot(row: ProductionShot | null) { selectedShot.value = row || undefined; }
function reportError(reason: unknown) { if (reason instanceof Error && reason.name === "CanceledError") return; error.value = reason instanceof Error ? reason.message : String(reason); }

async function loadData() {
  if (!workspace.project?.directory) return;
  requestController?.abort();
  requestController = new AbortController();
  loading.value = true;
  error.value = "";
  try {
    const api = production();
    const [nextManifest, tasks] = await Promise.all([api.getManifest(requestController.signal), api.listMediaTasks(requestController.signal)]);
    setManifest(nextManifest);
    mediaTasks.value = tasks;
    selectedShot.value = selectedShot.value ? nextManifest.shots.find(shot => shot.id === selectedShot.value?.id) : nextManifest.shots[0];
    if (selectedShot.value) shotTable.value?.setCurrentRow(selectedShot.value);
    schedulePoll();
  } catch (reason) { reportError(reason); }
  finally { loading.value = false; }
}
async function sync() {
  syncing.value = true;
  try { const result = await production().syncShots(); setManifest(result.manifest); await refreshTasks(); }
  catch (reason) { reportError(reason); }
  finally { syncing.value = false; }
}
async function refreshTasks() {
  mediaTasks.value = await production().listMediaTasks();
  schedulePoll();
}
async function generateSelected() {
  generating.value = true;
  try { const result = await production().createShotTasks(selectedShots.value.map(shot => shot.id), generationProvider.value, generationModel.value.trim(), generationMediaType.value); setManifest(result.manifest); await refreshTasks(); ElMessage.success(`已提交 ${result.tasks.length} 个生成任务`); }
  catch (reason) { reportError(reason); }
  finally { generating.value = false; }
}
async function retry(shot: ProductionShot) {
  if (!shot.taskId) return;
  try { await production().retryMediaTask(shot.taskId); await refreshTasks(); }
  catch (reason) { reportError(reason); }
}
async function saveSelected() {
  if (!selectedShot.value) return;
  saving.value = true;
  try { setManifest(await production().updateShot(selectedShot.value)); ElMessage.success("镜头已保存"); }
  catch (reason) { reportError(reason); }
  finally { saving.value = false; }
}
async function startExport() {
  exporting.value = true;
  try { exportTask.value = await production().createExportTask(exportPath.value.trim(), exportInputs.value); schedulePoll(); }
  catch (reason) { reportError(reason); }
  finally { exporting.value = false; }
}
async function cancelExport() {
  if (!exportTask.value) return;
  try { exportTask.value = await production().cancelExportTask(exportTask.value.id); }
  catch (reason) { reportError(reason); }
}
function schedulePoll() {
  clearTimeout(pollTimer);
  const activeMedia = mediaTasks.value.some(task => task.status === "queued" || task.status === "running");
  const activeExport = exportTask.value && ["queued", "running"].includes(exportTask.value.status);
  if (!activeMedia && !activeExport) return;
  pollTimer = setTimeout(async () => {
    try {
      if (activeMedia) {
        await refreshTasks();
        const result = await production().syncShots();
        setManifest(result.manifest);
      }
      if (exportTask.value && ["queued", "running"].includes(exportTask.value.status)) exportTask.value = await production().getExportTask(exportTask.value.id);
      schedulePoll();
    } catch (reason) { reportError(reason); }
  }, 1500);
}
watch(() => workspace.project?.directory, () => { selectedShots.value = []; selectedShot.value = undefined; exportTask.value = undefined; loadData(); });
onMounted(loadData);
onBeforeUnmount(() => { clearTimeout(pollTimer); requestController?.abort(); });
</script>

<style scoped lang="scss">
.productionPanel { width: 100%; height: 100%; padding: 72px 28px 28px; overflow: auto; background: var(--el-bg-color); color: var(--el-text-color-primary); }
.panelHeader, .sectionToolbar, .sectionHeading, .headerActions, .toolbarActions, .exportActions { display: flex; align-items: center; }
.panelHeader { justify-content: space-between; gap: 16px; margin: 0 auto 18px; max-width: 1500px; }
.eyebrow { margin: 0 0 4px; color: var(--el-text-color-secondary); font-size: 12px; letter-spacing: .08em; }
h1 { margin: 0; font-size: 22px; line-height: 1.2; }
.headerActions, .toolbarActions { gap: 8px; }
.panelError { max-width: 1500px; margin: 0 auto 12px; }
.productionLayout { display: grid; grid-template-columns: minmax(0, 1fr) 340px; gap: 18px; max-width: 1500px; margin: 0 auto; }
.shotSection, .detailSection { min-width: 0; border: 1px solid var(--el-border-color-light); border-radius: 8px; background: var(--el-bg-color-overlay); }
.shotSection { overflow: hidden; }
.detailSection { padding: 16px; }
.sectionToolbar { justify-content: space-between; gap: 12px; padding: 12px 14px; border-bottom: 1px solid var(--el-border-color-lighter); }
.toolbarInfo, .exportHint, .muted { color: var(--el-text-color-secondary); font-size: 12px; }
.providerSelect { width: 112px; }
.modelInput { width: 178px; }
.mediaSelect { width: 88px; }
.shotTable { width: 100%; }
.shotTitle { font-weight: 600; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.shotPrompt { margin-top: 3px; color: var(--el-text-color-secondary); font-size: 12px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.outputPath { display: block; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-size: 12px; }
.taskStatus { color: var(--el-text-color-secondary); font-size: 12px; }
.sectionHeading { justify-content: space-between; margin-bottom: 12px; font-weight: 600; }
.shotForm :deep(.el-form-item) { margin-bottom: 12px; }
.formGrid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
.fullWidth { width: 100%; }
.exportSection { margin-top: 24px; padding-top: 18px; border-top: 1px solid var(--el-border-color-lighter); }
.exportHint { margin: 8px 0 12px; }
.exportActions { gap: 8px; margin-top: 12px; }
.successText { color: var(--el-color-success); font-size: 12px; word-break: break-all; }
.errorText { color: var(--el-color-danger); font-size: 12px; }
@media (max-width: 1100px) { .productionLayout { grid-template-columns: 1fr; } .detailSection { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; } .exportSection { margin-top: 0; padding-top: 0; border-top: 0; } }
@media (max-width: 760px) { .productionPanel { padding: 64px 12px 18px; } .panelHeader, .sectionToolbar { align-items: flex-start; flex-direction: column; } .toolbarActions { width: 100%; flex-wrap: wrap; } .modelInput { flex: 1; min-width: 150px; } .detailSection { display: block; } .formGrid { grid-template-columns: 1fr; } }
</style>
