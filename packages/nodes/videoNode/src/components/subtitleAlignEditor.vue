<template>
  <div class="timingEditor">
    <videoPlayer :src="src" readOnly label="字幕校时预览" @loadedmetadata="video = $event.target as HTMLVideoElement" @ready="playable = $event">
      <template #frameOverlay><span v-if="visibleCue" class="cueOverlay">{{ visibleCue }}</span></template>
    </videoPlayer>
    <div v-if="cues.length" class="markers">
      <subtitleCuePicker :cues="cues" :modelValue="selected" label="选择字幕句子" @choose="index => selectCue('A', index)" />
      <small>播放到这句开始的位置，再点击对齐。</small>
      <div class="marker">
        <el-button size="small" :disabled="!playable" @click="mark('A')">把这句对齐到这里</el-button>
        <output v-if="Number(values.sourceA) >= 0">{{ timestamp(Number(values.sourceA)) }} → {{ timestamp(Number(values.targetA)) }}</output>
      </div>
      <label v-if="Number(values.sourceA) >= 0 && laterCues.length" class="driftOption">
        <input type="checkbox" :checked="correctDrift" @change="setDrift(($event.target as HTMLInputElement).checked)" />字幕越往后越不同步
      </label>
      <template v-if="correctDrift && laterCues.length">
        <subtitleCuePicker :cues="cues" :after="Number(values.sourceA)" :modelValue="selectedLater" label="再对齐后面的一句"
          @choose="index => selectCue('B', index)" />
        <div class="marker">
          <el-button size="small" :disabled="!playable" @click="mark('B')">把这句对齐到这里</el-button>
          <output v-if="Number(values.sourceB) >= 0">{{ timestamp(Number(values.sourceB)) }} → {{ timestamp(Number(values.targetB)) }}</output>
        </div>
      </template>
    </div>
    <span v-if="error" role="alert">{{ error }}</span>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, shallowRef, watch } from "vue";
import { ElButton } from "element-plus";
import { useNodeFiles } from "@toonflow/nodes-scaffold/runtime";
import type { MediaToolAttachment } from "@toonflow/node-shared/mediaTools";
import { readSubtitleCues, timestamp } from "../videoSubtitleTiming";
import videoPlayer from "./videoPlayer.vue";
import subtitleCuePicker from "./subtitleCuePicker.vue";
const props = defineProps<{ src: string; values: Record<string, string | number>; attachments: MediaToolAttachment[] }>();
const emit = defineEmits<{ updateValues: [values: Record<string, number>]; ready: [value: boolean] }>();
const files = useNodeFiles(), video = shallowRef<HTMLVideoElement>(), playable = ref(false), error = ref(""), selected = ref(0);
const cues = shallowRef<ReturnType<typeof readSubtitleCues>>([]);
const correctDrift = ref(false), selectedLater = ref(0);
const activeSide = ref<"A" | "B">("A"), currentTime = ref(0);
const laterCues = computed(() => cues.value.map((cue, index) => ({ ...cue, index })).filter(cue => cue.start > Number(props.values.sourceA)));
function alignedTime(time: number) {
  const { sourceA, targetA, sourceB, targetB } = props.values;
  if (!(Number(sourceA) >= 0 && Number(targetA) >= 0)) return time;
  const rate = Number(sourceB) > Number(sourceA) && Number(targetB) > Number(targetA)
    ? (Number(targetB) - Number(targetA)) / (Number(sourceB) - Number(sourceA)) : 1;
  return Number(targetA) + (time - Number(sourceA)) * rate;
}
const visibleCue = computed(() => {
  const cue = cues.value[activeSide.value === "A" ? selected.value : selectedLater.value];
  return cue && currentTime.value + .001 >= alignedTime(cue.start) && currentTime.value < alignedTime(cue.end) ? cue.text : "";
});
watch(video, (el, _, cleanup) => {
  if (!el) return;
  const sync = () => { currentTime.value = el.currentTime; };
  sync();
  el.addEventListener("timeupdate", sync);
  el.addEventListener("seeked", sync);
  cleanup(() => { el.removeEventListener("timeupdate", sync); el.removeEventListener("seeked", sync); });
});
watch(() => props.attachments[0], async (item, _, invalidate) => {
  let current = true;
  invalidate(() => { current = false; });
  cues.value = []; error.value = ""; selected.value = 0; activeSide.value = "A"; correctDrift.value = false;
  emit("updateValues", { sourceA: -1, sourceB: -1, targetA: -1, targetB: -1 });
  if (!item) return;
  try {
    const bytes = item instanceof File ? await item.arrayBuffer() : await files.getWorkspaceFiles().read(item.path);
    if (bytes.byteLength > 8 * 1024 * 1024) throw new Error("字幕文件不能超过 8 MB");
    const parsed = readSubtitleCues(new TextDecoder().decode(bytes));
    if (current) cues.value = parsed;
  } catch (cause) { if (current) error.value = cause instanceof Error ? cause.message : "字幕读取失败"; }
}, { immediate: true });
function seekCue(time: number) {
  const el = video.value;
  if (!el || !Number.isFinite(el.duration)) return;
  el.pause();
  el.currentTime = Math.max(0, Math.min(time, el.duration - .001));
}
watch([video, cues], ([el, list]) => { if (el && list.length) seekCue(list[0]!.start); });
function setDrift(enabled: boolean) {
  correctDrift.value = enabled;
  selectedLater.value = laterCues.value.at(-1)?.index ?? 0;
  error.value = "";
  if (enabled) selectCue("B", selectedLater.value);
  else { activeSide.value = "A"; emit("updateValues", { sourceB: -1, targetB: -1 }); }
}
function selectCue(side: "A" | "B", index: number) {
  error.value = "";
  activeSide.value = side;
  const cue = cues.value[index];
  if (!cue) return;
  if (side === "A" && selected.value !== index) {
    selected.value = index;
    correctDrift.value = false;
    emit("updateValues", { sourceA: -1, targetA: -1, sourceB: -1, targetB: -1 });
    seekCue(cue.start);
  } else if (side === "B" && selectedLater.value !== index) {
    selectedLater.value = index;
    emit("updateValues", { sourceB: -1, targetB: -1 });
    seekCue(cue.start + Number(props.values.targetA) - Number(props.values.sourceA));
  } else seekCue(alignedTime(cue.start));
}
function mark(side: "A" | "B") {
  const el = video.value, cue = cues.value[side === "A" ? selected.value : selectedLater.value];
  if (!el || el.seeking || !cue) return;
  el.pause();
  if (el.currentTime >= el.duration || (side === "B" && el.currentTime <= Number(props.values.targetA))) {
    error.value = "请按对白顺序对齐，第二句应在第一句之后。";
    return;
  }
  error.value = "";
  if (side === "A" && correctDrift.value) setDrift(false);
  emit("updateValues", { ["source" + side]: cue.start, ["target" + side]: el.currentTime });
}
watch(() => playable.value && cues.value.length > 0 && Number(props.values.sourceA) >= 0 && Number(props.values.targetA) >= 0 &&
  (!correctDrift.value || Number(props.values.sourceB) > Number(props.values.sourceA) && Number(props.values.targetB) > Number(props.values.targetA)),
  valid => emit("ready", valid), { immediate: true });
</script>

<style scoped lang="scss">
.timingEditor {
  display: grid; gap: 10px;
  .cueOverlay {
    position: absolute; bottom: 6%; left: 50%; transform: translateX(-50%); width: max-content; max-width: 90%;
    padding: 2px 8px; background: #000b; color: white; line-height: 1.4; text-align: center; white-space: pre-line;
    overflow-wrap: anywhere; pointer-events: none;
  }
  .markers { display: grid; gap: 8px; small { color: var(--el-text-color-secondary); } }
  .driftOption { display: flex; align-items: center; gap: 6px; cursor: pointer; }
  .marker { display: flex; flex-wrap: wrap; align-items: center; gap: 8px; }
  [role="alert"] { color: var(--el-color-danger); }
}
</style>
