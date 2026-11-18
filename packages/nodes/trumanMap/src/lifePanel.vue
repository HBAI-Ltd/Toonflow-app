<template>
  <section class="lifePanel" aria-label="演绎" @focusin="editInput" @input="editInput" @focusout="finishInput" @keydown="inputKeyDown">
    <div class="playbackRow">
      <button type="button" class="playAction" :disabled="disabled || planning || drawing || !tracks.length" @click="emit('togglePlayback')"><component :is="running && !completed ? IconPlayerPause : IconPlayerPlay" :size="16" />{{ completed ? '重新播放' : running ? '暂停' : '播放' }}</button>
      <button type="button" class="addAction" :disabled="disabled || planning || drawing || !aiAvailable" :aria-busy="!!planning" @click="emit('activate')"><icon-sparkles :size="15" />{{ planning ? '正在安排…' : 'AI 安排' }}</button>
      <button v-if="tracks.length" type="button" class="iconAction" :disabled="disabled || planning || drawing" aria-label="从头播放演绎" title="从头播放" @click="emit('reset')"><icon-refresh :size="15" /></button>
    </div>
    <p v-if="planning" class="panelHint" role="status">动线正在逐个加入场景</p>
    <p v-if="message || conversion.error" class="panelHint" role="alert">{{ message || conversion.error }}</p>
    <section v-if="selectedObject" class="trackEditor" :aria-label="`编辑${selectedObjectName}的演绎`">
      <div class="objectHeading">
        <input v-if="selected" :key="selected.id" class="nameField" name="name" :value="inputValue('name', trackName(selected))" maxlength="160" :disabled="disabled || planning || drawing" aria-label="演绎名称" />
        <strong v-else>{{ selectedObjectName }}</strong>
        <button type="button" class="iconAction" :disabled="disabled || planning || drawing || !aiAvailable" :aria-label="`让 AI 安排${selectedObjectName}`" title="让 AI 安排此物体" @click="emit('aiObject', selectedObject.id)"><icon-sparkles :size="16" /></button>
      </div>
      <section v-if="selected && selectedClip && !drawing" class="clipEditor" aria-label="所选片段">
        <div class="eventHeading"><strong>所选片段</strong><button type="button" :disabled="disabled || planning" title="删除片段（Delete），保留主体" @click="emit('removeClip', selected.id, selectedClip.id)"><icon-trash :size="15" />删除片段</button></div>
        <label><span>名称</span><input :key="selectedClip.id + ':name'" :value="selectedClip.name" maxlength="160" :disabled="disabled || planning" aria-label="片段名称" @change="changeClipName" /></label>
        <div class="clipTiming">
          <label><span>{{ selectedClip.trigger ? '触发后延迟（秒）' : '开始（秒）' }}</span><input :key="selectedClip.id + ':start'" type="number" :value="selectedClip.start" min="0" max="86400" step="0.1" :disabled="disabled || planning" aria-label="片段开始秒数" @change="changeClipNumber('start', $event)" /></label>
          <label><span>持续时间（秒）</span><input :key="selectedClip.id + ':duration'" type="number" :value="Number(getPerformanceClipDuration(selectedClip).toFixed(3))" :min="(selectedClip.sourceOut - selectedClip.sourceIn) / 8" :max="(selectedClip.sourceOut - selectedClip.sourceIn) / 0.1" step="any" :disabled="disabled || planning" aria-label="片段持续时间秒数" @change="changeClipNumber('duration', $event)" /></label>
          <label><span>播放倍率</span><input :key="selectedClip.id + ':rate'" type="number" :value="Number(selectedClip.rate.toFixed(3))" min="0.1" max="8" step="any" :disabled="disabled || planning" aria-label="片段播放倍率，0.1到8倍" @change="changeClipNumber('rate', $event)" /></label>
        </div>
        <label v-if="selectedClip.kind === 'pose' && hasBoneAnimation"><span>动作库</span><select :value="selectedClip.animation ?? ''" :disabled="disabled || planning" aria-label="片段骨骼动作库" @change="changeClipAnimation"><option value="">{{ selectedClip.motion ? '自定义骨骼编排' : '基础动作' }}</option><option v-for="animation in characterAnimationCatalog" :key="animation.id" :value="animation.id">{{ animation.name }} · {{ animation.duration.toFixed(1) }}秒</option></select></label>
        <p v-if="selectedClip.kind === 'pose' && selectedClip.motion && selectedClip.animation" class="panelHint">动作库上保留当前骨骼编排。</p>
        <details class="sourceSettings"><summary>源区间</summary><div class="clipTiming"><label><span>入点（秒）</span><input type="number" :value="selectedClip.sourceIn" min="0" :max="selectedClip.sourceOut - 0.001" step="any" :disabled="disabled || planning" aria-label="源素材入点" @change="changeClipNumber('sourceIn', $event)" /></label><label><span>出点（秒）</span><input type="number" :value="selectedClip.sourceOut" :min="selectedClip.sourceIn + 0.001" :max="selectedClip.sourceDuration" step="any" :disabled="disabled || planning" aria-label="源素材出点" @change="changeClipNumber('sourceOut', $event)" /></label></div></details>
        <p v-if="selectedClip.trigger" class="panelHint">触发：{{ triggerLabel(selectedClip) }}</p>
        <label class="clipEnabled"><input type="checkbox" :checked="selectedClip.enabled !== false" :disabled="disabled || planning" @change="changeClipEnabled" /><span>{{ selectedClip.enabled === false ? '片段已停用' : '启用片段' }}</span></label>
      </section>
      <div v-if="!drawing" class="objectActions">
        <select value="" :disabled="disabled || planning" aria-label="添加效果" @change="addEffect"><option value="" disabled>添加效果</option><option value="fire">火焰</option><option value="smoke">烟雾</option><option value="explosion">爆炸</option></select>
      </div>
      <div v-else class="drawingControls">
        <div class="drawingStatus" role="status"><span><icon-route :size="15" />正在画路线</span><span>{{ draftPointCount ?? 0 }} 点</span></div>
        <div class="drawingActions">
          <button type="button" class="finishAction" :disabled="disabled || planning || (draftPointCount ?? 0) < 2" title="完成路线（Enter）" @click="emit('finishRoute')"><icon-check :size="15" />完成</button>
          <button type="button" :disabled="disabled || planning || (draftPointCount ?? 0) < 2" @click="emit('undoRoutePoint')"><icon-arrow-back-up :size="15" />撤回一点</button>
          <button type="button" :disabled="disabled || planning" title="取消绘线（Esc）" @click="emit('cancelRoute')">取消</button>
        </div>
      </div>
      <p v-if="selectedStatus?.blocked || selectedStatus?.activity" class="panelHint" role="status">{{ selectedStatus.blocked || selectedStatus.activity }}</p>
      <p v-if="drawing" class="panelHint">连续点地面画路线，点起点闭合；Enter 完成，Esc 取消。</p>
      <div v-if="effectClips.length && !drawing" class="effectClips" aria-label="效果片段">
        <section v-for="clip in effectClips" :key="clip.id" class="effectClip">
          <div class="eventHeading"><strong>效果参数</strong></div>
          <label><span>效果</span><select :value="clip.effect" :disabled="disabled || planning" :aria-label="`${clip.name}效果类型`" @change="changeEffectKind(clip, $event)"><option value="fire">火焰</option><option value="smoke">烟雾</option><option value="explosion">爆炸</option></select></label>
          <label><span>强度</span><input type="number" :value="clip.intensity ?? 1" min="0.1" max="3" step="0.1" :disabled="disabled || planning" :aria-label="`${clip.name}强度`" @change="changeEffectNumber(clip, 'intensity', $event)" /></label>
          <template v-if="clip.effect === 'explosion'">
            <label><span>飞散力度（m/s）</span><input type="number" :value="clip.strength ?? 7" min="0.1" max="30" step="0.5" :disabled="disabled || planning" aria-label="爆炸部件飞散力度" @change="changeEffectNumber(clip, 'strength', $event)" /></label>
            <fieldset v-if="effectParts?.length" class="effectParts"><legend>飞散部件</legend><label v-for="part in effectParts" :key="part.id"><input type="checkbox" :checked="clip.parts?.includes(part.id)" :disabled="disabled || planning || !clip.parts?.includes(part.id) && (clip.parts?.length ?? 0) >= 32" :aria-label="`飞散${part.name}`" @change="changeEffectPart(clip, part.id, $event)" /><span>{{ part.name }}</span></label></fieldset>
            <p class="panelHint">仅飞散勾选的已有部件；未选时播放爆炸火烟与冲击。</p>
          </template>
        </section>
      </div>
      <details v-if="selected?.controller !== 'object' && !drawing" class="trackSettings" :open="pointIndex !== undefined && !selectedClip"><summary>路线编辑</summary><button type="button" :disabled="disabled || planning" title="重新绘制将替换当前路线与事件" @click="emit('drawRoute')"><icon-route :size="15" />{{ selected ? '重新绘制路线' : '画路线' }}</button>
      <div v-if="selected && !selected.clips && pointIndex !== undefined" class="eventEditor">
        <div class="eventHeading"><span>路径点 {{ pointIndex + 1 }}</span><button type="button" :disabled="disabled || planning || selected.points.length === 1" aria-label="删除当前路径点" title="删除此点（Delete）" @click="removePoint(pointIndex)"><icon-trash :size="14" />删除此点</button></div>
        <template v-if="nextPointIndex !== undefined">
          <label class="durationField"><span>{{ nextPointIndex === 0 ? '回到起点用时' : `到点 ${nextPointIndex + 1} 用时` }}</span><span class="valueField"><input :key="selected.id + ':segment:' + pointIndex" name="segment" type="number" :value="inputValue('segment', selected.segmentSeconds?.[pointIndex] ?? 0)" min="0" max="86400" step="0.1" :disabled="disabled || planning" aria-label="下一段移动用时（秒，0按默认速度）" /><small>秒</small></span></label>
          <p class="segmentHint">按世界秒计时，0 按默认速度；避障可能延长用时。</p>
        </template>
        <label><span>到达后发生什么</span><input :key="selected.id + ':' + pointIndex" name="event" :value="inputValue('event', eventAt(pointIndex)?.text ?? '')" maxlength="160" :disabled="disabled || planning" aria-label="关键事件内容" /></label>
        <label v-if="hasBoneAnimation && eventAt(pointIndex)">
          <span>骨骼动作</span>
          <select :key="selected.id + ':action:' + pointIndex" :value="eventAt(pointIndex)?.motion ? 'custom' : eventAt(pointIndex)?.action ?? (eventAt(pointIndex)?.target ? 'interact' : 'wait')" :disabled="disabled || planning" aria-label="关键事件骨骼动作" @change="changeEventAction">
            <option v-if="eventAt(pointIndex)?.motion" value="custom">AI 编排动作</option>
            <option value="wait">待机</option>
            <option value="interact">互动</option>
            <option value="work">工作</option>
            <option value="rest">休息</option>
            <option value="observe">观察</option>
            <option value="graze">进食</option>
          </select>
        </label>
        <label v-if="eventAt(pointIndex)" class="durationField"><span>停留</span><span class="valueField"><input name="duration" type="number" :value="inputValue('duration', getPerformanceEventDuration(eventAt(pointIndex)!))" min="0" max="300" step="0.5" :disabled="disabled || planning" aria-label="事件停留秒数" /><small>秒</small></span></label>
      </div>
      </details>
      <details v-if="selected && !drawing" :key="selected.id" class="trackSettings">
        <summary>轨道设置</summary>
        <div v-if="selected.controller !== 'object'" class="routeMode" role="group" aria-label="轨道运行方式"><button type="button" :class="{ active: selected.loop !== true }" :aria-pressed="selected.loop !== true" :disabled="disabled || planning" @click="changeTrack(selected.id, { loop: false })"><icon-player-play :size="14" />一次</button><button type="button" :class="{ active: selected.loop === true }" :aria-pressed="selected.loop === true" :disabled="disabled || planning" @click="changeTrack(selected.id, { loop: true })"><icon-repeat :size="14" />循环</button></div>
        <label class="startField"><span>开始的世界时刻</span><input name="start" type="time" :value="inputValue('start', startTime)" min="00:00:00" max="23:59:59" step="1" :disabled="disabled || planning" aria-label="开始的世界时刻，留空立即开始" /></label>
        <p class="startHint">留空立即开始；已过的世界时刻次日启动。</p>
        <div v-if="selected.controller !== 'object'" class="settingsRow"><label class="speedField"><span>默认移动速度</span><span class="valueField"><input name="speed" type="number" :value="inputValue('speed', trackSpeed(selected))" min="0.1" max="30" step="0.1" :disabled="disabled || planning" aria-label="物体移动速度" /><small>m/s</small></span></label></div>
      <div class="objectActions"><button type="button" :disabled="disabled || planning" @click="changeTrack(selected.id, { enabled: !trackEnabled(selected) })"><component :is="trackEnabled(selected) ? IconPlayerPause : IconPlayerPlay" :size="15" />{{ trackEnabled(selected) ? '停用轨道' : '启用轨道' }}</button><button type="button" class="removeAction" :disabled="disabled || planning" title="删除轨道，保留场景物体" @click="emit('remove', selected.id)"><icon-trash :size="15" />删除轨道</button></div>
      </details>
    </section>
    <p v-else class="panelHint">先点选场景物体，再点击「画路线」。</p>
    <div v-if="tracks.length" class="trackList" aria-label="已安排的物体">
      <div class="listHeading">已安排<span>{{ tracks.length }}</span></div>
      <div v-for="track in tracks" :key="track.id" class="trackRow" :class="{ selected: selected?.id === track.id }">
        <button type="button" class="trackSelect" :disabled="disabled || planning || drawing" :aria-pressed="selected?.id === track.id" @click="emit('selectTrack', track.id)"><i :style="{ backgroundColor: trackEnabled(track) ? performanceColor(track.id) : 'var(--el-text-color-placeholder)' }" /><span>{{ trackName(track) }}</span><small>{{ trackEnabled(track) ? track.clips ? `${track.clips.length} 片段` : `${track.points.length} 点` : '已停用' }}</small></button>
        <button type="button" class="iconAction" :aria-label="`聚焦${trackName(track)}`" title="聚焦" @click="emit('focusTrack', track.id)"><icon-focus-centered :size="14" /></button>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, ref, shallowRef } from "vue";
import { IconPlayerPause, IconPlayerPlay, IconSparkles, IconRoute, IconTrash, IconRefresh, IconFocusCentered, IconCheck, IconArrowBackUp, IconRepeat } from "@tabler/icons-vue";
import { getSceneLife, sceneLifeSchema, type SceneLife, type LifeStatus } from "./lifeDocument";
import { getPerformanceEventDuration, getPerformanceObjectIds, getPerformanceTracks, mergePerformanceTracks, type PerformanceTrack, type PerformanceEvent } from "./performanceDocument";
import { performanceColor } from "./performanceOverlay";
import { getPerformanceClips, getPerformanceClipDuration, performanceClipSchema, type PerformanceClip, type PerformanceEffectClip } from "./performanceClips";
import { characterAnimationCatalog, getCharacterAnimation } from "./characterAnimations";
import type { SceneObject, SceneObjectGroup } from "./sceneDocument";

const props = defineProps<{ modelValue?: SceneLife; objects?: SceneObject[]; groups?: SceneObjectGroup[]; effectParts?: { id: string; name: string }[]; worldSeconds?: number; selectedObjectId?: string; selectedTrackId?: string; selectedPoint?: number; selectedClipId?: string; disabled?: boolean; status?: LifeStatus; planning?: boolean; aiAvailable?: boolean; aiModelSelected?: boolean; drawing?: boolean; draftPointCount?: number; running?: boolean; completed?: boolean }>();
const emit = defineEmits<{ "update:modelValue": [value: SceneLife]; remove: [id: string]; selectClip: [id: string, clipId: string]; changeClip: [id: string, clipId: string, patch: Partial<PerformanceClip>]; removeClip: [id: string, clipId: string]; reset: []; activate: []; togglePlayback: []; selectTrack: [id: string]; selectPoint: [index: number]; focusTrack: [id: string]; selectObject: [id: string]; aiObject: [id: string]; drawRoute: []; finishRoute: []; cancelRoute: []; undoRoutePoint: [] }>();
const message = ref("");
const inputDraft = shallowRef<{ input: HTMLInputElement; key: string; initial: string; value: string }>();
const inputHandlers: Record<string, (event: Event) => void> = { name: renameTrack, start: changeStartAt, segment: changeSegmentSeconds, event: changeEventText, duration: changeDuration, speed: changeSpeed };
const settings = computed(() => getSceneLife(props.modelValue));
const conversion = computed(() => {
  try { return { tracks: getPerformanceTracks(props.modelValue, props.objects, props.groups), error: "" }; }
  catch (error) { return { tracks: [] as PerformanceTrack[], error: error instanceof Error ? error.message : "原有活动暂时无法转为独立动线" }; }
});
const tracks = computed(() => conversion.value.tracks);
const clips = computed(() => selected.value && selectedObject.value ? getPerformanceClips(selected.value, selectedObject.value) : []);
const selectedClip = computed(() => clips.value.find(clip => clip.id === props.selectedClipId));
const effectClips = computed(() => selectedClip.value?.kind === "effect" ? [selectedClip.value] : []);
const objectsById = computed(() => new Map(props.objects?.map(object => [object.id, object])));
const objectNames = computed(() => {
  const names = new Map(props.objects?.map(object => [object.id, object.name]));
  for (const group of props.groups ?? []) for (const id of group.objectIds) names.set(id, group.name);
  return names;
});
const selected = computed(() => {
  const track = tracks.value.find(track => track.id === props.selectedTrackId);
  if (track) return track;
  const ids = getPerformanceObjectIds(props.selectedObjectId ?? "", props.groups);
  return tracks.value.find(track => track.controller === "object" && track.objectId === props.selectedObjectId) ?? tracks.value.find(track => track.controller !== "object" && ids.includes(track.objectId));
});
const startTime = computed(() => {
  const value = selected.value?.startAt;
  return value === undefined ? "" : [Math.floor(value / 3600), Math.floor(value / 60) % 60, Math.floor(value % 60)].map(part => String(part).padStart(2, "0")).join(":");
});
const selectedObject = computed(() => objectsById.value.get(selected.value?.objectId || props.selectedObjectId || ""));
const hasBoneAnimation = computed(() => !!selectedObject.value && getPerformanceObjectIds(selectedObject.value.id, props.groups).some(id => objectsById.value.get(id)?.asset.shape === "riggedPerson"));
const selectedObjectName = computed(() => selectedObject.value && objectNames.value.get(selectedObject.value.id));
const selectedStatus = computed(() => props.status?.groups?.find(group => group.id === selected.value?.id));
const pointIndex = computed(() => selected.value && props.selectedPoint !== undefined && selected.value.points[props.selectedPoint] ? props.selectedPoint : undefined);
const nextPointIndex = computed(() => {
  if (!selected.value || pointIndex.value === undefined || selected.value.points.length < 2) return undefined;
  if (pointIndex.value + 1 < selected.value.points.length) return pointIndex.value + 1;
  return selected.value.loop === true ? 0 : undefined;
});
function inputKey(name: string) { return `${selected.value?.id}:${['segment', 'event', 'duration'].includes(name) ? pointIndex.value : ''}:${name}`; }
function inputValue(name: string, value: string | number) { return inputDraft.value?.key === inputKey(name) ? inputDraft.value.value : value; }
function editInput(event: Event) {
  const input = event.target;
  if (!(input instanceof HTMLInputElement) || !inputHandlers[input.name]) return;
  const draft = inputDraft.value;
  inputDraft.value = { input, key: inputKey(input.name), initial: draft?.input === input ? draft.initial : input.value, value: input.value };
}
function finishInput(event: FocusEvent) {
  const draft = inputDraft.value;
  if (!draft || event.target !== draft.input) return;
  inputDraft.value = undefined;
  if (draft.key === inputKey(draft.input.name) && draft.input.value !== draft.initial) inputHandlers[draft.input.name]?.(event);
}
function inputKeyDown(event: KeyboardEvent) {
  const draft = inputDraft.value;
  if (!draft || event.target !== draft.input || event.isComposing || !['Enter', 'Escape'].includes(event.key)) return;
  event.preventDefault(); event.stopPropagation();
  if (event.key === 'Escape') { inputDraft.value = undefined; draft.input.value = draft.initial; }
  draft.input.blur();
}
function trackName(track: PerformanceTrack) { return track.name ?? (track.controller === "object" ? objectsById.value.get(track.objectId)?.name : objectNames.value.get(track.objectId)) ?? "场景物体"; }
function trackSpeed(track: PerformanceTrack) { return track.speed ?? (track.mode === "road" ? 5.5 : 1.35); }
function trackEnabled(track: PerformanceTrack) { return track.enabled !== false; }
function eventAt(index: number) { return selected.value?.events?.find(event => event.at === index); }
function save(patch: Partial<Omit<SceneLife, "tracks">> & { tracks?: PerformanceTrack[] }) {
  if (props.disabled || props.planning || props.drawing || conversion.value.error) return false;
  const result = sceneLifeSchema.safeParse(getSceneLife({ ...settings.value, ...patch, ...(patch.tracks ? { tracks: mergePerformanceTracks(props.modelValue, patch.tracks, props.objects ?? []) } : {}) }));
  if (!result.success) { message.value = result.error.issues[0]?.message ?? "动线未保存，请检查输入"; return false; }
  message.value = "";
  emit("update:modelValue", result.data);
  return true;
}
function changeTrack(id: string, patch: Partial<PerformanceTrack>) { return save({ tracks: tracks.value.map(track => track.id === id ? { ...track, ...patch } : track) }); }
function changeClip(patch: Partial<PerformanceClip>) {
  if (!selected.value || !selectedClip.value || props.disabled || props.planning || props.drawing) return false;
  const parsed = performanceClipSchema.safeParse({ ...selectedClip.value, ...patch });
  if (!parsed.success) { message.value = parsed.error.issues[0]?.message ?? "片段设置无效"; return false; }
  message.value = "";
  emit("changeClip", selected.value.id, selectedClip.value.id, patch);
  return true;
}
function changeClipNumber(field: "start" | "duration" | "rate" | "sourceIn" | "sourceOut", event: Event) {
  const input = event.target as HTMLInputElement;
  const clip = selectedClip.value;
  if (!clip) return;
  const previous = field === "duration" ? getPerformanceClipDuration(clip) : clip[field];
  const value = input.valueAsNumber;
  const patch = field === "duration" ? { rate: (clip.sourceOut - clip.sourceIn) / value } : { [field]: value };
  if (!input.checkValidity() || !Number.isFinite(value) || !changeClip(patch)) input.value = String(previous);
}
function changeClipName(event: Event) {
  const input = event.target as HTMLInputElement;
  if (!changeClip({ name: input.value.trim() })) input.value = selectedClip.value?.name ?? "";
}
function changeClipEnabled(event: Event) {
  const input = event.target as HTMLInputElement;
  const enabled = input.checked;
  input.checked = selectedClip.value?.enabled !== false;
  changeClip({ enabled });
}
function changeClipAnimation(event: Event) {
  const input = event.target as HTMLSelectElement;
  const clip = selectedClip.value;
  if (clip?.kind !== "pose") return;
  const animation = input.value ? getCharacterAnimation(input.value) : undefined;
  if (input.value && !animation) return;
  const duration = animation?.duration ?? clip.motion?.keyframes.at(-1)?.time ?? clip.sourceDuration;
  if (!changeClip({ animation: animation?.id, sourceDuration: duration, sourceIn: 0, sourceOut: duration })) input.value = clip.animation ?? "";
}
function triggerLabel(clip: PerformanceClip) {
  const source = tracks.value.find(track => track.id === clip.trigger?.trackId);
  const object = source && objectsById.value.get(source.objectId);
  const trigger = source && object && getPerformanceClips(source, object).find(item => item.id === clip.trigger?.clipId);
  return source && trigger ? `${trackName(source)} · ${trigger.name}` : "源片段已移除";
}
function addEffect(event: Event) {
  const input = event.target as HTMLSelectElement;
  const effect = input.value;
  input.value = "";
  if (!["fire", "smoke", "explosion"].includes(effect) || !selectedObject.value) return;
  if (selected.value && selected.value.controller !== "object") { message.value = "此物体已有移动或人物动线，请先删除该动线，再添加物件效果。"; return; }
  const object = selectedObject.value;
  const names = { fire: "火焰", smoke: "烟雾", explosion: "爆炸" };
  const start = Math.max(0, (props.worldSeconds ?? 0) - (selectedStatus.value?.startTime ?? props.worldSeconds ?? 0));
  const clip: PerformanceEffectClip = { id: crypto.randomUUID(), name: names[effect as keyof typeof names], kind: "effect", effect: effect as PerformanceEffectClip["effect"], start, sourceDuration: 3, sourceIn: 0, sourceOut: 3, rate: 1 };
  const track: PerformanceTrack = { ...selected.value, id: selected.value?.id ?? crypto.randomUUID(), objectId: object.id, controller: "object", enabled: true, points: selected.value?.points ?? [[object.position.x, object.position.y, object.position.z]], clips: [...selected.value?.clips ?? [], clip] };
  const tracks = selected.value ? conversion.value.tracks.map(item => item.id === track.id ? track : item) : [...conversion.value.tracks, track];
  if (save({ enabled: true, running: true, tracks })) emit("selectClip", track.id, clip.id);
}
function changeEffectNumber(clip: PerformanceEffectClip, field: "intensity" | "strength", event: Event) {
  const input = event.target as HTMLInputElement;
  const previous = field === "intensity" ? clip.intensity ?? 1 : clip.strength ?? 7;
  const value = input.valueAsNumber;
  if (!selected.value || !input.checkValidity() || !Number.isFinite(value)) { input.value = String(previous); return; }
  const patch = { [field]: value };
  if (!changeTrack(selected.value.id, { clips: selected.value.clips!.map(item => item.id === clip.id ? { ...item, ...patch } : item) })) input.value = String(previous);
}
function changeEffectKind(clip: PerformanceEffectClip, event: Event) {
  const input = event.target as HTMLSelectElement;
  if (!selected.value || !["fire", "smoke", "explosion"].includes(input.value)) return;
  const { parts, strength, ...base } = clip;
  const next: PerformanceEffectClip = { ...base, effect: input.value as PerformanceEffectClip["effect"], ...(input.value === "explosion" ? { parts, strength } : {}) };
  if (!changeTrack(selected.value.id, { clips: selected.value.clips!.map(item => item.id === clip.id ? next : item) })) input.value = clip.effect;
}
function changeEffectPart(clip: PerformanceEffectClip, id: string, event: Event) {
  if (!selected.value) return;
  const input = event.target as HTMLInputElement;
  const parts = new Set(clip.parts);
  input.checked ? parts.add(id) : parts.delete(id);
  if (!changeTrack(selected.value.id, { clips: selected.value.clips!.map(item => item.id === clip.id ? { ...item, parts: parts.size ? [...parts] : undefined } : item) })) input.checked = clip.parts?.includes(id) ?? false;
}
function renameTrack(event: Event) {
  const input = event.target as HTMLInputElement;
  if (!selected.value || !changeTrack(selected.value.id, { name: input.value.trim() })) input.value = selected.value ? trackName(selected.value) : "";
}
function changeSpeed(event: Event) {
  const input = event.target as HTMLInputElement;
  if (!selected.value) return;
  if (!input.checkValidity() || !Number.isFinite(input.valueAsNumber) || !changeTrack(selected.value.id, { speed: input.valueAsNumber })) input.value = String(trackSpeed(selected.value));
}
function changeStartAt(event: Event) {
  const input = event.target as HTMLInputElement;
  if (!selected.value) return;
  const startAt = input.value ? input.valueAsNumber / 1000 : undefined;
  if (!input.checkValidity() || startAt !== undefined && !Number.isFinite(startAt) || !changeTrack(selected.value.id, { startAt })) input.value = startTime.value;
}
function changeSegmentSeconds(event: Event) {
  if (!selected.value || pointIndex.value === undefined || nextPointIndex.value === undefined) return;
  const input = event.target as HTMLInputElement;
  const previous = selected.value.segmentSeconds?.[pointIndex.value] ?? 0;
  const segmentSeconds = Array.from({ length: Math.max(selected.value.segmentSeconds?.length ?? 0, pointIndex.value + 1) }, (_, index) => index === pointIndex.value ? input.valueAsNumber : selected.value!.segmentSeconds?.[index] ?? 0);
  if (!input.checkValidity() || !Number.isFinite(input.valueAsNumber) || !changeTrack(selected.value.id, { segmentSeconds })) input.value = String(previous);
}
function changeEventText(event: Event) {
  if (!selected.value || pointIndex.value === undefined) return;
  const input = event.target as HTMLInputElement;
  const previous = eventAt(pointIndex.value);
  const text = input.value.trim();
  const events = selected.value.events?.filter(event => event.at !== pointIndex.value) ?? [];
  if (text) events.push({ ...previous, at: pointIndex.value, text });
  if (!changeTrack(selected.value.id, { events: events.sort((a, b) => a.at - b.at) })) input.value = previous?.text ?? "";
}
function changeDuration(event: Event) {
  if (!selected.value || pointIndex.value === undefined) return;
  const input = event.target as HTMLInputElement;
  const previous = eventAt(pointIndex.value);
  if (!previous) return;
  const events: PerformanceEvent[] = selected.value.events!.map(item => item.at === pointIndex.value ? { ...item, seconds: input.valueAsNumber } : item);
  if (!input.checkValidity() || !Number.isFinite(input.valueAsNumber) || !changeTrack(selected.value.id, { events })) input.value = String(getPerformanceEventDuration(previous));
}
function changeEventAction(event: Event) {
  if (!selected.value || pointIndex.value === undefined) return;
  const input = event.target as HTMLSelectElement;
  const previous = eventAt(pointIndex.value);
  if (!previous || input.value === "custom") return;
  const events = selected.value.events!.map(item => {
    if (item.at !== pointIndex.value) return item;
    const { motion, ...event } = item;
    return { ...event, action: input.value as PerformanceEvent["action"] };
  });
  if (!changeTrack(selected.value.id, { events })) input.value = previous.motion ? "custom" : previous.action ?? (previous.target ? "interact" : "wait");
}
function removePoint(index: number) {
  if (!selected.value?.points[index] || selected.value.points.length === 1) return;
  const track = selected.value;
  const points = track.points.filter((_, pointIndex) => pointIndex !== index);
  const events = track.events?.filter(event => event.at !== index).map(event => ({ ...event, at: event.at > index ? event.at - 1 : event.at }));
  // ACT: 删除节点合并的两段恢复自动速度，其余用时继续绑定原段起点，避免把旧用时套给新段。
  const incoming = (index + track.points.length - 1) % track.points.length;
  const segmentSeconds = track.segmentSeconds && track.points.flatMap((_, pointIndex) => pointIndex === index ? [] : [pointIndex === incoming ? 0 : track.segmentSeconds?.[pointIndex] ?? 0]);
  if (changeTrack(track.id, { points, events, segmentSeconds })) emit("selectPoint", Math.min(index, points.length - 1));
}
defineExpose({ removePoint });
</script>

<style scoped lang="scss">
.lifePanel {
  color: var(--el-text-color-primary);
  font: inherit;
  button, input, select { color: inherit; font: inherit; }
  button { display: inline-flex; align-items: center; justify-content: center; gap: 6px; border: 0; border-radius: 6px; background: transparent; cursor: pointer; transition: background-color 140ms ease; &:hover:not(:disabled) { background: var(--studioHoverBackground); } &:disabled { opacity: 0.45; cursor: default; } &:focus-visible { outline: 2px solid var(--el-color-primary); outline-offset: -2px; } }
  input, select { min-width: 0; box-sizing: border-box; border: 1px solid var(--el-border-color); border-radius: 7px; background: var(--studioControlBackground); padding: 8px 10px; &:focus-visible { outline: 2px solid var(--el-color-primary); outline-offset: -2px; } &:disabled { opacity: 0.5; } }
  .iconAction { flex-shrink: 0; width: 28px; height: 28px; padding: 5px; color: var(--el-text-color-regular); }
  .playbackRow { display: flex; gap: 6px; padding: 0 0 12px; align-items: center; .playAction { flex: 1; min-height: 34px; padding: 7px; background: var(--studioControlBackground); font-size: 12px; } .addAction { flex: 1; min-height: 34px; padding: 7px; color: var(--studioActiveText); background: var(--studioActiveBackground); font-size: 12px; } }
  .panelHint { margin: 8px 0 12px; color: var(--el-text-color-regular); font-size: 12px; line-height: 1.65; overflow-wrap: anywhere; }
  .trackList { max-height: 210px; overflow-y: auto; padding-top: 10px; border-top: 1px solid var(--el-border-color-lighter); scrollbar-width: thin;
    .listHeading { display: flex; align-items: center; gap: 7px; margin: 0 6px 7px; color: var(--el-text-color-regular); font-size: 12px; > span { font-variant-numeric: tabular-nums; } }
    .trackRow { display: flex; align-items: center; gap: 5px; padding: 2px 5px; border-radius: 7px; &.selected { background: var(--studioActiveBackground); } .trackSelect { justify-content: flex-start; flex: 1; min-width: 0; min-height: 32px; padding: 3px 0; text-align: left; > i { flex-shrink: 0; width: 7px; height: 7px; border-radius: 50%; } > span { flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-size: 13px; } > small { color: var(--el-text-color-regular); font-size: 12px; white-space: nowrap; } } }
  }
  .trackEditor { padding: 10px 0 12px; border-top: 1px solid var(--el-border-color-lighter);
    label { font-size: 12px; color: var(--el-text-color-regular); }
    .clipEditor { display: grid; gap: 12px; margin: 6px 0 18px; padding-bottom: 16px; border-bottom: 1px solid var(--el-border-color-lighter);
      .eventHeading { display: flex; justify-content: space-between; align-items: center; gap: 8px; font-size: 12px; > button { min-height: 28px; color: var(--el-text-color-regular); &:hover:not(:disabled) { color: var(--el-color-danger); } } }
      > label, .clipTiming > label { display: grid; gap: 6px; > input, > select { width: 100%; color: var(--el-text-color-primary); font-variant-numeric: tabular-nums; } }
      .clipTiming { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 10px; > label:last-child:nth-child(odd) { grid-column: 1 / -1; } }
      .sourceSettings { summary { padding: 4px 0 8px; cursor: pointer; font-size: 12px; color: var(--el-text-color-regular); } }
      .clipEnabled { display: flex; align-items: center; gap: 7px; input { width: 15px; height: 15px; margin: 0; accent-color: var(--el-color-primary); } }
      .panelHint { margin: 0; }
    }
    .objectHeading { display: flex; align-items: center; gap: 6px; margin-bottom: 10px; > strong { flex: 1; min-width: 0; padding: 5px 0; font-size: 13px; font-weight: 500; overflow-wrap: anywhere; } .nameField { flex: 1; width: 0; border-color: transparent; background: transparent; padding: 5px 0; font-size: 13px; font-weight: 500; &:hover, &:focus-visible { background: var(--studioControlBackground); } } }
    .objectActions { display: flex; flex-wrap: wrap; gap: 6px; button, select { flex: 1 0 auto; min-height: 32px; padding: 5px; background: var(--studioControlBackground); font-size: 12px; white-space: nowrap; &:first-child { color: var(--studioActiveText); background: var(--studioActiveBackground); } } .removeAction:hover:not(:disabled) { color: var(--el-color-danger); } }
    .effectClips { display: grid; gap: 10px; margin-top: 12px;
      .effectClip { display: grid; gap: 8px; padding-top: 10px; border-top: 1px solid var(--el-border-color-lighter);
        .eventHeading { display: flex; align-items: center; justify-content: space-between; font-size: 13px; > strong { font-weight: 500; } > button { width: 28px; height: 28px; } }
        > label { display: flex; align-items: center; justify-content: space-between; gap: 8px; > input, > select { width: 94px; font-variant-numeric: tabular-nums; } }
        .effectParts { display: grid; gap: 6px; max-height: 160px; margin: 0; padding: 7px 0 0; overflow-y: auto; border: 0; scrollbar-width: thin; > legend { padding: 0; color: var(--el-text-color-regular); font-size: 12px; } > label { display: flex; align-items: center; gap: 7px; > input { flex-shrink: 0; margin: 0; accent-color: var(--el-color-primary); } > span { min-width: 0; overflow-wrap: anywhere; } } }
        > .panelHint { margin: 0; }
      }
    }
    .drawingControls { .drawingStatus { display: flex; align-items: center; justify-content: space-between; gap: 8px; margin-bottom: 8px; font-size: 12px; > span:first-child { display: inline-flex; align-items: center; gap: 6px; } > span:last-child { color: var(--el-text-color-regular); font-variant-numeric: tabular-nums; } } .drawingActions { display: flex; gap: 5px; button { min-height: 34px; padding: 6px 8px; font-size: 12px; white-space: nowrap; background: var(--studioControlBackground); } .finishAction { flex: 1; background: var(--studioActiveBackground); color: var(--studioActiveText); } } }
    .routeMode { display: flex; align-items: center; gap: 3px; margin-top: 8px; padding: 3px; border-radius: 7px; background: var(--studioControlBackground); button { flex: 1; min-height: 30px; padding: 5px 8px; color: var(--el-text-color-regular); font-size: 12px; &.active { color: var(--studioActiveText); background: var(--studioActiveBackground); } } }
    .startField { display: flex; align-items: center; justify-content: space-between; gap: 8px; margin-top: 10px; input { width: 148px; color: var(--el-text-color-primary); font-size: 13px; font-variant-numeric: tabular-nums; } }
    .startHint { margin: 5px 0 0; color: var(--el-text-color-regular); font-size: 12px; line-height: 1.6; }
    .trackSettings { margin-top: 10px; summary { width: fit-content; padding: 4px 0; color: var(--el-text-color-regular); font-size: 12px; cursor: pointer; &:focus-visible { outline: 2px solid var(--el-color-primary); outline-offset: 3px; } } .settingsRow { display: flex; align-items: center; gap: 12px; margin-top: 9px; .speedField { display: flex; align-items: center; gap: 8px; flex: 1; } } }
    .valueField { display: flex; align-items: center; gap: 5px; input { width: 76px; color: var(--el-text-color-primary); font-size: 13px; font-variant-numeric: tabular-nums; } small { font-size: 12px; white-space: nowrap; } }
    .eventEditor { display: grid; gap: 9px; margin-top: 12px; padding-top: 8px; border-top: 1px solid var(--el-border-color-lighter); .eventHeading { display: flex; align-items: center; justify-content: space-between; font-size: 12px; font-variant-numeric: tabular-nums; button { min-height: 28px; } } > label { display: grid; gap: 7px; > input, > select { width: 100%; color: var(--el-text-color-primary); font-size: 13px; } } .durationField { display: flex; align-items: center; justify-content: space-between; gap: 8px; .valueField input { width: 96px; } } .segmentHint { margin: -4px 0 0; color: var(--el-text-color-regular); font-size: 12px; line-height: 1.6; } }
  }
  @media (prefers-reduced-motion: reduce) { button { transition: none; } }
}
</style>
