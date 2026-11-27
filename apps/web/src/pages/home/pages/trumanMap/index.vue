<template>
  <section class="trumanMap" aria-labelledby="trumanMapTitle">
    <!-- ACT: 顶部是同一处白模片场的多机位镜头条，纯装饰；中间一格为当前镜头。 -->
    <div class="shotReel" aria-hidden="true">
      <div class="shotTrack">
        <div v-for="(shot, index) in shots" :key="shot.name" class="shotCard" :class="{ active: index === activeShot }">
          <stageScene :shot="shot" />
          <span class="shotLabel">{{ String(index + 1).padStart(2, "0") }}&nbsp;&nbsp;{{ shot.name }}</span>
          <span v-if="index === activeShot" class="shotRecording"><span class="recordingDot" />REC</span>
        </div>
      </div>
      <div class="timeline">
        <span class="timelineTicks" />
        <span class="playhead">00:00:12:08</span>
      </div>
    </div>

    <div class="intro">
      <h1 id="trumanMapTitle">白模预演<span class="titleLatin">TrumanMap</span></h1>
      <p class="introDescription">一句话搭出白模场景，排好人物走位和镜头路线，开拍前先把整场戏走一遍。</p>
    </div>

    <sceneComposer ref="composer" v-model="prompt" v-model:directory="sceneDirectory" v-model:selectedModel="selectedModel" v-model:reasoningEffort="reasoningEffort"
      v-model:aspectRatio="aspectRatio" v-model:duration="duration" :busy="busy" :canGenerate="canGenerate" :generating="generating" :attachments="imagePreviews"
      @paste="pasteImages" @remove="images.splice($event, 1)" @generate="generate" />
    <p v-if="!sceneDirectory" class="folderHint" role="status">请先选择一个空文件夹，白模场景和导出的素材会保存在这里。</p>

    <div class="suggestions" role="group" aria-label="示例描述">
      <button v-for="option in suggestionOptions" :key="option.label" class="suggestion" type="button" @click="prompt = translate(option.label)">
        <span>{{ translate(option.label) }}</span>
        <icon-arrow-up-right :size="14" aria-hidden="true" />
      </button>
    </div>

    <section class="sceneList" aria-labelledby="trumanMapScenesTitle">
      <h2 id="trumanMapScenesTitle">我的白模场景</h2>
      <div class="sceneGrid">
        <button v-loading="creating" class="sceneCreate" type="button" :disabled="!!projectDirectory || picker?.selecting" :aria-busy="creating" @click="createScene">
          <span class="createFloor" aria-hidden="true" />
          <span class="createIcon"><icon-plus :size="22" aria-hidden="true" /></span>
          <span class="createTitle">新建场景</span>
        </button>
        <projectCard v-for="scene in workspaceStore.sceneList" :key="scene.directory" :project="scene" :disabled="!!projectDirectory || picker?.selecting" @select="projectDirectory = scene.directory">
          <template #actions>
            <el-dropdown-item :icon="IconEdit" @click="renameScene(scene)">重命名</el-dropdown-item>
            <el-dropdown-item class="removeAction" :icon="IconTrash" divided title="从列表移除，不删除文件" @click="workspaceStore.removeScene(scene.directory)">移除场景</el-dropdown-item>
          </template>
        </projectCard>
      </div>
    </section>
    <workspacePicker ref="picker" hideTrigger />
    <sceneProject v-if="projectDirectory" :directory="projectDirectory" :request="sceneRequest" @close="projectDirectory = ''; sceneRequest = undefined; creating = false" />
  </section>
</template>

<script setup lang="ts">
import { markMessages, translate } from "@toonflow/i18n/vue";
import { getMediaMimeType } from "@toonflow/node-shared/mediaTypes";
import { imageTypes, validatePromptImages } from "@toonflow/node-truman-map/promptImages";
import axios from "axios";
import { computed, defineAsyncComponent, ref } from "vue";
import { ElMessage, ElMessageBox } from "element-plus";
import { IconEdit, IconTrash } from "@tabler/icons-vue";
import sceneComposer, { durationOptions } from "./sceneComposer.vue";
import { getClipboardFiles } from "@/lib/clipboard";
import useWorkspaceFiles from "@/lib/workspaceFiles";
import { useWorkspaceStore, type Project } from "@/stores/workspace";
import workspacePicker from "../../workspacePicker.vue";
import projectCard from "../projects/projectCard.vue";
import stageScene from "./stageScene.vue";
import type { SceneRequest } from "./sceneProject.vue";

// 承载 TrumanMap 时要加载 three 等节点运行时，打开场景时才载入。
const sceneProject = defineAsyncComponent(() => import("./sceneProject.vue"));
const workspaceStore = useWorkspaceStore();
const picker = ref<InstanceType<typeof workspacePicker>>();
// 正在打开的场景文件夹；有值时承载 TrumanMap 场景编辑器，退出后清空。打开成功的场景记入“我的白模场景”。
const projectDirectory = ref("");
// 只有从“新建场景”进入时在该卡片上转圈，点已有场景卡片打开时不转。
const creating = ref(false);

async function createScene() {
  const directory = await picker.value?.chooseDirectory();
  if (!directory) return;
  creating.value = true;
  projectDirectory.value = directory;
}

// 只改列表里显示的名称，不改文件夹名。
async function renameScene(scene: Project) {
  const result = await ElMessageBox.prompt("请输入名称", "重命名场景", {
    inputValue: scene.name, confirmButtonText: "保存", cancelButtonText: "取消",
    inputValidator: value => !!value?.trim() || "场景名称不能为空",
  }).catch(() => null);
  if (result) workspaceStore.renameScene(scene.directory, result.value);
}

const prompt = ref("");
const images = ref<File[]>([]);
const imagePreviews = computed(() => images.value.map(file => ({ name: file.name, path: "", mimeType: file.type, file })));
const pendingPastes = ref(0);
const selectedModel = ref("");
const reasoningEffort = ref("");
const composer = ref<InstanceType<typeof sceneComposer>>();
// 首页输入框选的场景文件夹；“生成预演”在这里新建场景并把描述发给内置 Agent。
const sceneDirectory = ref("");
const sceneRequest = ref<SceneRequest>();
const generating = ref(false);
const busy = computed(() => generating.value || !!projectDirectory.value || !!picker.value?.selecting || !!composer.value?.selecting);
const canGenerate = computed(() => !busy.value && !pendingPastes.value && (!!prompt.value.trim() || !!images.value.length));

// 首页在插件载入前就显示这些校验提示，宿主字典也要收录。
markMessages([
  "每轮最多添加 4 张图片，请移除部分图片后重试。",
  "请选择 PNG、JPEG、WebP 或 GIF 图片。",
  "图片“{0}”为空或超过 10 MB，请换一张图片。",
  "本轮图片总计不能超过 20 MB，请减少图片或缩小文件后重试。",
]);

async function pasteImages(event: ClipboardEvent) {
  if (busy.value) return;
  const pending = getClipboardFiles(event);
  if (!pending) return;
  event.preventDefault();
  pendingPastes.value++;
  try {
    const added: File[] = [];
    for (const file of await pending) {
      const type = getMediaMimeType(file);
      if (!type.startsWith("image/")) continue;
      // 节点按工作区文件后缀识图，截图可能只有 MIME 类型。
      const extension = file.name.match(/\.([a-z0-9]+)$/i)?.[1]?.toLowerCase();
      const name = extension && imageTypes[extension] === type ? file.name : `${file.name || "image"}.${type.slice(6)}`;
      added.push(file.type === type && file.name === name ? file : new File([file], name, { type }));
    }
    if (!added.length) return;
    validatePromptImages(added, images.value.map(file => file.size));
    images.value.push(...added);
  } catch (error) {
    ElMessage.error(error instanceof Error ? error.message : "添加附件失败，请重试");
  } finally {
    pendingPastes.value--;
  }
}

// 和首页新建项目一致：只用空文件夹新建，已有场景从“我的白模场景”打开。
async function generate() {
  if (!canGenerate.value) return;
  generating.value = true;
  try {
    const { empty, directory } = await useWorkspaceFiles(sceneDirectory.value).list();
    if (!empty) return void ElMessage.warning("该文件夹不为空，请重新选择空文件夹；已有场景请在“我的白模场景”里打开。");
    const seconds = durationOptions.find(option => option.value === duration.value && option.value !== "auto");
    const description = prompt.value.trim() || "请参考附图搭建白模场景。";
    sceneRequest.value = {
      prompt: seconds ? `${description}\n\n预演时长：约${seconds.value}秒。` : description,
      images: [...images.value],
      model: selectedModel.value, reasoningEffort: reasoningEffort.value, format: aspectRatio.value,
    };
    projectDirectory.value = directory;
  } catch (error) {
    ElMessage.error(axios.isAxiosError<{ message?: string }>(error) ? error.response?.data?.message || "无法读取文件夹，请重试" : error instanceof Error ? error.message : "无法读取文件夹，请重试");
  } finally {
    generating.value = false;
  }
}
const aspectRatio = ref("16:9");
const duration = ref("auto");
const suggestionOptions = [
  { label: "雨夜巷口两人对峙，镜头从背后缓慢推近" },
  { label: "地铁站台追逐戏，手持跟拍穿过人群" },
  { label: "黄昏屋顶告别，镜头环绕一圈后拉到全景" },
];
// 同一处片场的不同机位：target 为对准点，distance 为距离，elevation 为俯仰角，azimuth 为水平方位（0 在南、90 在东），focal 越大视角越窄。
const shots: { name: string; target: [number, number, number]; distance: number; elevation: number; azimuth: number; focal: number; rig?: boolean }[] = [
  { name: "TOP", target: [640, 820, 0], distance: 640, elevation: 84, azimuth: 0, focal: 1.4, rig: true },
  { name: "MEDIUM", target: [650, 818, 10], distance: 200, elevation: 12, azimuth: 30, focal: 1.5 },
  { name: "CLOSE", target: [636, 812, 15], distance: 56, elevation: 6, azimuth: -35, focal: 1.7 },
  { name: "WIDE", target: [620, 770, 40], distance: 1000, elevation: 28, azimuth: 30, focal: 1.5, rig: true },
  { name: "LOW", target: [700, 640, 110], distance: 330, elevation: -18, azimuth: 20, focal: 1.4 },
  { name: "TRACK", target: [650, 820, 10], distance: 260, elevation: 8, azimuth: 90, focal: 1.5 },
  { name: "OVER", target: [631, 813, 14], distance: 85, elevation: 8, azimuth: 60, focal: 1.5 },
];
const activeShot = 3;
</script>

<style lang="scss" scoped>
.trumanMap {
  container-type: inline-size;
  max-width: 1080px;
  margin: 0 auto;

  .shotReel {
    position: relative;
    margin: 4px 0 22px;

    .shotTrack {
      display: flex;
      justify-content: center;
      align-items: center;
      gap: 12px;
      overflow: hidden;
      padding: 8px 0 18px;
      -webkit-mask-image: linear-gradient(90deg, transparent, #000 14%, #000 86%, transparent);
      mask-image: linear-gradient(90deg, transparent, #000 14%, #000 86%, transparent);

      .shotCard {
        --frameBg: linear-gradient(#c6cdd8, #eef1f5 70%);
        position: relative;
        flex-shrink: 0;
        width: 176px;
        aspect-ratio: 16 / 9;
        overflow: hidden;
        border: 1px solid color-mix(in srgb, var(--el-text-color-primary) 10%, transparent);
        border-radius: 10px;
        background: var(--frameBg);
        opacity: 0.72;

        .dark & { --frameBg: linear-gradient(#0f1115, #262a31 70%); }

        &.active {
          width: 224px;
          border-color: color-mix(in srgb, var(--el-color-primary) 70%, transparent);
          box-shadow: 0 0 0 3px color-mix(in srgb, var(--el-color-primary) 18%, transparent), 0 14px 30px -14px color-mix(in srgb, var(--el-color-primary) 60%, transparent);
          opacity: 1;
        }

        .shotLabel,
        .shotRecording {
          position: absolute;
          display: inline-flex;
          align-items: center;
          gap: 5px;
          padding: 2px 6px;
          border-radius: 4px;
          background: rgb(0 0 0 / 45%);
          color: rgb(255 255 255 / 85%);
          font-size: 10px;
          font-weight: 600;
          font-variant-numeric: tabular-nums;
          letter-spacing: 0.08em;
          line-height: 1.4;
        }

        .shotLabel { bottom: 6px; left: 6px; }

        .shotRecording {
          top: 6px;
          left: 6px;

          .recordingDot {
            width: 6px;
            height: 6px;
            border-radius: 50%;
            background: #ff4d4f;
            animation: recordingBlink 1.2s steps(2, jump-none) infinite;

            @media (prefers-reduced-motion: reduce) { animation: none; }
          }
        }
      }
    }

    // 刻度单独渐隐，播放头不在遮罩内，避免时间码被裁掉。
    .timeline {
      position: relative;
      height: 34px;
      margin-top: -8px;

      .timelineTicks {
        position: absolute;
        inset: 0 0 auto;
        height: 10px;
        background:
          repeating-linear-gradient(90deg, color-mix(in srgb, var(--el-text-color-primary) 30%, transparent) 0 1px, transparent 1px 48px) left top / 100% 10px no-repeat,
          repeating-linear-gradient(90deg, color-mix(in srgb, var(--el-text-color-primary) 16%, transparent) 0 1px, transparent 1px 12px) left top / 100% 5px no-repeat;
        -webkit-mask-image: linear-gradient(90deg, transparent, #000 14%, #000 86%, transparent);
        mask-image: linear-gradient(90deg, transparent, #000 14%, #000 86%, transparent);
      }

      .playhead {
        position: absolute;
        top: 14px;
        left: 50%;
        padding: 1px 8px;
        border-radius: 999px;
        background: var(--el-color-primary);
        color: #fff;
        font-size: 10px;
        font-weight: 600;
        font-variant-numeric: tabular-nums;
        letter-spacing: 0.04em;
        line-height: 1.6;
        white-space: nowrap;
        transform: translateX(-50%);

        &::before {
          position: absolute;
          bottom: 100%;
          left: 50%;
          width: 2px;
          height: 22px;
          margin-left: -1px;
          background: var(--el-color-primary);
          content: "";
        }
      }
    }
  }

  .intro {
    text-align: center;

    h1 {
      margin: 0;
      background: linear-gradient(180deg, var(--el-text-color-primary) 35%, color-mix(in srgb, var(--el-text-color-primary) 60%, transparent));
      -webkit-background-clip: text;
      background-clip: text;
      color: transparent;
      font-size: clamp(28px, 3.4vw, 38px);
      font-weight: 700;
      line-height: 1.25;
      letter-spacing: -0.01em;

      .titleLatin {
        margin-inline-start: 12px;
        color: var(--el-text-color-secondary);
        font-weight: 300;
        letter-spacing: 0.02em;
      }
    }

    .introDescription {
      max-width: 560px;
      margin: 10px auto 0;
      color: var(--el-text-color-secondary);
      font-size: 14px;
      line-height: 1.8;
    }
  }

  .composer { margin-top: 24px; }

  .folderHint {
    max-width: 800px;
    margin: 10px auto 0;
    padding: 0 18px;
    color: var(--el-text-color-secondary);
    font-size: 12px;
    line-height: 1.7;
  }

  .suggestions {
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    gap: 8px;
    max-width: 800px;
    margin: 16px auto 0;

    .suggestion {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      max-width: 100%;
      padding: 7px 12px 7px 14px;
      border: 1px solid color-mix(in srgb, var(--el-text-color-primary) 10%, transparent);
      border-radius: 999px;
      background: color-mix(in srgb, var(--el-bg-color-overlay) 45%, transparent);
      color: var(--el-text-color-secondary);
      font: inherit;
      font-size: 13px;
      line-height: 1.5;
      cursor: pointer;
      transition: color 0.2s, border-color 0.2s;

      span { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
      svg { flex-shrink: 0; opacity: 0.6; }

      &:hover { border-color: color-mix(in srgb, var(--el-text-color-primary) 26%, transparent); color: var(--el-text-color-primary); }
      &:focus-visible { outline: 2px solid var(--el-color-primary); outline-offset: 2px; }

      @media (prefers-reduced-motion: reduce) { transition: none; }
    }
  }

  .sceneList {
    margin: 56px 0 40px;

    h2 {
      margin: 0 0 16px;
      font-size: 18px;
      font-weight: 600;
      line-height: 1.5;
    }

    .sceneGrid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(min(100%, 260px), 1fr));
      gap: 16px;

      .sceneCreate {
        position: relative;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: 12px;
        aspect-ratio: 16 / 10;
        // 有比例的网格项默认不拉伸；宽高都拉满网格，与同行的场景卡片等高，单独一张时仍按比例定高。
        place-self: stretch;
        overflow: hidden;
        border: 1px solid color-mix(in srgb, var(--el-text-color-primary) 10%, transparent);
        border-radius: 18px;
        background: color-mix(in srgb, var(--el-bg-color-overlay) 55%, transparent);
        color: var(--el-text-color-regular);
        font: inherit;
        cursor: pointer;
        transition: border-color 0.2s, color 0.2s;

        .createFloor {
          position: absolute;
          inset: 46% -40% -50%;
          background-image:
            linear-gradient(color-mix(in srgb, var(--el-text-color-primary) 12%, transparent) 1px, transparent 1px),
            linear-gradient(90deg, color-mix(in srgb, var(--el-text-color-primary) 12%, transparent) 1px, transparent 1px);
          background-size: 32px 32px;
          transform: perspective(360px) rotateX(58deg);
          transform-origin: top;
          -webkit-mask-image: linear-gradient(transparent, #000 30%);
          mask-image: linear-gradient(transparent, #000 30%);
        }

        .createIcon {
          position: relative;
          display: grid;
          place-items: center;
          width: 52px;
          height: 52px;
          border: 1px solid color-mix(in srgb, var(--el-text-color-primary) 16%, transparent);
          border-radius: 50%;
          background: color-mix(in srgb, var(--el-bg-color-overlay) 80%, transparent);
          backdrop-filter: blur(6px);
          transition: transform 0.2s, background-color 0.2s, color 0.2s;
        }

        .createTitle { position: relative; font-size: 14px; font-weight: 500; }

        &:hover {
          border-color: color-mix(in srgb, var(--el-color-primary) 45%, transparent);
          color: var(--el-text-color-primary);

          .createIcon { transform: scale(1.06); background: var(--el-color-primary); color: #fff; }
        }

        &:focus-visible { outline: 2px solid var(--el-color-primary); outline-offset: 3px; }

        @media (prefers-reduced-motion: reduce) {
          transition: none;

          .createIcon { transition: none; }
        }
      }
    }
  }

  @container (max-width: 640px) {
    .shotReel .shotTrack .shotCard { width: 140px; &.active { width: 176px; } }
  }
}

@keyframes recordingBlink {
  50% { opacity: 0.2; }
}
</style>
