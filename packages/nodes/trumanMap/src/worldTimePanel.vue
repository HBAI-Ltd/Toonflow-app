<template>
  <div class="worldTimePanel">
    <section class="timeSection">
      <div class="clockHeading">
        <label class="clockField"><span>时间</span><input type="time" :value="clockDraft ?? clockLabel" step="60" :disabled="disabled" aria-label="时间，小时与分钟" @focus="clockDraft = clockLabel" @input="clockDraft = ($event.target as HTMLInputElement).value" @change="changeClock" @blur="clockDraft = null" /></label>
        <button class="playButton" type="button" :disabled="disabled" :aria-pressed="!modelValue.paused" :aria-label="modelValue.paused ? '播放世界时间' : '暂停世界时间'" @click="update({ paused: !modelValue.paused })"><svg viewBox="0 0 20 20" aria-hidden="true"><path v-if="modelValue.paused" d="M7 4.5 15 10l-8 5.5Z" /><path v-else d="M6.5 4.5v11m7-11v11" /></svg><span>{{ modelValue.paused ? '播放' : '暂停' }}</span></button>
      </div>
      <div class="hourSlider" @pointerdown.capture="beginEdit" @keydown.capture="beginEdit"><el-slider :modelValue="modelValue.hour" :min="0" :max="1439 / 60" :step="1 / 60" :disabled="disabled" :showTooltip="false" :formatValueText="formatHour" aria-label="一天中的时间，精确到分钟" @update:modelValue="value => previewNumber('hour', value)" @change="commitEdit" /></div>
      <div class="timeScale" aria-hidden="true"><span>00:00</span><span>06:00</span><span>12:00</span><span>18:00</span><span>23:59</span></div>
      <div class="quickChoices sunChoices" role="group" aria-label="一天中的时段"><button v-for="moment in sunMoments" :key="moment.name" type="button" :disabled="disabled || moment.hour === null" :title="moment.hour === null ? '此地点当天没有日出或日落' : formatHour(moment.hour)" @click="setHour(moment.hour)">{{ moment.name }}</button></div>
      <p v-if="sunTimes.polarDay || sunTimes.polarNight" class="timeHint">此地点当天没有日出或日落，可以换个地点或季节。</p>
      <div class="seasonControl"><span>季节</span><div class="quickChoices" role="group" aria-label="选择季节"><button v-for="(season, index) in seasons" :key="season.name" type="button" :class="{ active: seasonIndex === index }" :aria-pressed="seasonIndex === index" :disabled="disabled" @click="changeSeason(season.month)">{{ season.name }}</button></div></div>
      <label class="selectField"><span>时间流速</span><select :value="modelValue.speed" :disabled="disabled" aria-label="时间流速" @change="update({ speed: Number(($event.target as HTMLSelectElement).value) })"><option v-for="speed in speedOptions" :key="speed.value" :value="speed.value">{{ speed.label }}</option></select></label>
      <div class="clockFooter"><span>{{ dayDuration }}</span><button type="button" :disabled="disabled" title="使用电脑现在的日期和时间" @click="useComputerTime">电脑时间</button></div>
    </section>

    <section class="timeSection">
      <div class="sectionHeading"><h3>月亮</h3><span>{{ automaticPhase ? '跟随日期变化' : '自定义' }}</span></div>
      <div class="quickChoices" role="group" aria-label="月亮的形状"><button v-for="phase in phaseChoices" :key="phase.name" type="button" :class="{ active: isPhaseSelected(phase.value) }" :aria-pressed="isPhaseSelected(phase.value)" :disabled="disabled" @click="update({ moonPhase: phase.value })">{{ phase.name }}</button></div>
    </section>

    <details class="celestialDetails">
      <summary>更多设置</summary>
      <div class="detailBody">
        <label class="selectField"><span>地点</span><select :value="selectedCity" :disabled="disabled" aria-label="选择场景所在地点" @change="changeCity"><option v-for="city in cities" :key="city.name" :value="city.name">{{ city.name }}</option><option v-if="!locationCity" value="custom" disabled>当前场景</option></select></label>
        <p class="timeHint">地点影响日出和日落。</p>
        <label class="dateField"><span>日期</span><input type="date" :value="modelValue.date" min="1900-01-01" max="2200-12-31" required :disabled="disabled" aria-label="场景日期" @change="changeDate" /></label>
        <label class="rangeField" @pointerdown.capture="beginEdit" @keydown.capture="beginEdit"><span>月光</span><el-slider :modelValue="modelValue.moonIntensity" :min="0" :max="2" :step="0.05" :disabled="disabled" :showTooltip="false" aria-label="月光亮度" @update:modelValue="value => previewNumber('moonIntensity', value)" @change="commitEdit" /><output>{{ Math.round(modelValue.moonIntensity * 100) }}<small>%</small></output></label>
        <label class="rangeField" @pointerdown.capture="beginEdit" @keydown.capture="beginEdit"><span>星光</span><el-slider :modelValue="modelValue.starIntensity" :min="0" :max="2" :step="0.05" :disabled="disabled" :showTooltip="false" aria-label="星光亮度" @update:modelValue="value => previewNumber('starIntensity', value)" @change="commitEdit" /><output>{{ Math.round(modelValue.starIntensity * 100) }}<small>%</small></output></label>
      </div>
    </details>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from "vue";
import { ElSlider } from "element-plus";
import type { SceneTime } from "./sceneDocument";
import { getCelestialState, getSunTimes } from "./worldTime";

const props = defineProps<{ modelValue: SceneTime; disabled?: boolean }>();
const emit = defineEmits<{ begin: []; preview: [patch: Partial<SceneTime>]; commit: []; update: [patch: Partial<SceneTime>] }>();
type NumericTimeField = "hour" | "moonIntensity" | "starIntensity";
type SceneCity = { name: string; latitude: number; longitude: number; utcOffset: number; timeZone: string };
const clockDraft = ref<string | null>(null);
const celestial = computed(() => getCelestialState(props.modelValue));
const sunTimes = computed(() => getSunTimes(props.modelValue));
const automaticPhase = computed(() => props.modelValue.moonPhase === undefined);
const clockLabel = computed(() => formatHour(props.modelValue.hour));
const cities: SceneCity[] = [
  { name: "北京", latitude: 39.9042, longitude: 116.4074, utcOffset: 8, timeZone: "Asia/Shanghai" },
  { name: "上海", latitude: 31.2304, longitude: 121.4737, utcOffset: 8, timeZone: "Asia/Shanghai" },
  { name: "伦敦", latitude: 51.5074, longitude: -0.1278, utcOffset: 0, timeZone: "Europe/London" },
  { name: "纽约", latitude: 40.7128, longitude: -74.006, utcOffset: -5, timeZone: "America/New_York" },
  { name: "悉尼", latitude: -33.8688, longitude: 151.2093, utcOffset: 10, timeZone: "Australia/Sydney" },
];
const locationCity = computed(() => cities.find(city => Math.abs(city.latitude - props.modelValue.latitude) < 0.0001 && Math.abs(city.longitude - (props.modelValue.longitude ?? 120)) < 0.0001));
const selectedCity = computed(() => locationCity.value?.name ?? "custom");
const speedOptions = computed(() => {
  const options = [{ value: 1, label: "正常" }, { value: 24, label: "加快" }, { value: 144, label: "快速" }, { value: 1440, label: "昼夜循环" }];
  if (!options.some(option => option.value === props.modelValue.speed)) options.push({ value: props.modelValue.speed, label: "自定义" });
  return options;
});
const dayDuration = computed(() => props.modelValue.speed === 1 ? "与现实时间同步" : props.modelValue.speed === 24 ? "一天约 1 小时" : "一天约 " + Number((1440 / props.modelValue.speed).toFixed(1)) + " 分钟");
const sunMoments = computed(() => [{ name: "清晨", hour: sunTimes.value.sunrise }, { name: "白天", hour: sunTimes.value.noon }, { name: "傍晚", hour: sunTimes.value.sunset }, { name: "深夜", hour: 0 }]);
const seasons = computed(() => [
  { name: "春", month: props.modelValue.latitude < 0 ? "09" : "03" },
  { name: "夏", month: props.modelValue.latitude < 0 ? "12" : "06" },
  { name: "秋", month: props.modelValue.latitude < 0 ? "03" : "09" },
  { name: "冬", month: props.modelValue.latitude < 0 ? "06" : "12" },
]);
const seasonIndex = computed(() => {
  const monthDay = props.modelValue.date.slice(5);
  const index = monthDay < "03-21" || monthDay >= "12-21" ? 3 : monthDay < "06-21" ? 0 : monthDay < "09-21" ? 1 : 2;
  return props.modelValue.latitude < 0 ? (index + 2) % 4 : index;
});
const phaseChoices: { value?: number; name: string }[] = [{ name: "自然" }, { value: 0.125, name: "弯月" }, { value: 0.25, name: "半月" }, { value: 0.5, name: "满月" }];

function isPhaseSelected(value: number | undefined) {
  if (value === undefined) return automaticPhase.value;
  return !automaticPhase.value && Math.abs(Math.min(celestial.value.moonPhase, 1 - celestial.value.moonPhase) - value) < 0.02;
}
function formatHour(hour: number) {
  const minutes = Math.min(1439, Math.max(0, Math.floor(hour * 60 + 0.00001)));
  return String(Math.floor(minutes / 60)).padStart(2, "0") + ":" + String(minutes % 60).padStart(2, "0");
}
function setHour(hour: number | null) {
  if (hour !== null && Number.isFinite(hour)) update({ hour: Math.min(1439, Math.max(0, Math.round(hour * 60))) / 60 });
}
function changeClock(event: Event) {
  const input = event.target as HTMLInputElement;
  if (!/^\d{2}:\d{2}$/.test(input.value) || !input.checkValidity()) { clockDraft.value = clockLabel.value; return; }
  const [hour, minute] = input.value.split(":").map(Number);
  update({ hour: hour + minute / 60 });
}
function useComputerTime() {
  const date = new Date();
  const dateLabel = date.getFullYear() + "-" + String(date.getMonth() + 1).padStart(2, "0") + "-" + String(date.getDate()).padStart(2, "0");
  update({ date: dateLabel, hour: date.getHours() + date.getMinutes() / 60 + date.getSeconds() / 3600, utcOffset: -date.getTimezoneOffset() / 60 });
}
function beginEdit(event: Event) {
  if (props.disabled) return;
  if (event.type === "keydown") {
    const key = event as KeyboardEvent;
    if (key.key === "Escape" || key.key === "Tab" || key.ctrlKey || key.metaKey || key.altKey) return;
  }
  emit("begin");
}
function previewNumber(field: NumericTimeField, value: number | number[]) {
  if (!props.disabled && typeof value === "number" && Number.isFinite(value)) emit("preview", { [field]: field === "hour" ? Math.round(value * 60) / 60 : value });
}
function commitEdit() { if (!props.disabled) emit("commit"); }
function update(patch: Partial<SceneTime>) { if (!props.disabled) emit("update", patch); }
function cityOffset(city: SceneCity, date: string) {
  try {
    const zone = new Intl.DateTimeFormat("en-US", { timeZone: city.timeZone, timeZoneName: "shortOffset" }).formatToParts(new Date(date + "T12:00:00Z")).find(part => part.type === "timeZoneName")?.value;
    if (zone === "GMT") return 0;
    const match = zone?.match(/^GMT([+-])(\d{1,2})(?::(\d{2}))?$/);
    if (match) return (match[1] === "-" ? -1 : 1) * (Number(match[2]) + Number(match[3] ?? 0) / 60);
  } catch {}
  return city.utcOffset;
}
function updateDate(date: string) {
  const city = locationCity.value;
  update(city ? { date, utcOffset: cityOffset(city, date) } : { date });
}
function changeSeason(month: string) { updateDate(props.modelValue.date.slice(0, 4) + "-" + month + "-21"); }
function changeDate(event: Event) {
  const input = event.target as HTMLInputElement;
  if (props.disabled || !input.value || !input.checkValidity()) { input.value = props.modelValue.date; return; }
  updateDate(input.value);
}
function changeCity(event: Event) {
  const name = (event.target as HTMLSelectElement).value;
  const city = cities.find(value => value.name === name);
  if (city) update({ latitude: city.latitude, longitude: city.longitude, utcOffset: cityOffset(city, props.modelValue.date) });
}
</script>

<style scoped lang="scss">
.worldTimePanel {
  min-width: 0;
  color: var(--el-text-color-primary);
  font: inherit;
  font-size: 12px;
  h3, p { margin: 0; }
  input, select, button { font: inherit; color: inherit; }
  input, select { min-width: 0; min-height: 34px; padding: 5px 8px; border: 1px solid var(--studioBorderColor, var(--el-border-color-light)); border-radius: var(--el-border-radius-base); background: var(--studioControlBackground); caret-color: var(--el-color-primary); font-variant-numeric: tabular-nums; }
  button { min-height: 32px; padding: 5px 8px; border: 0; border-radius: var(--el-border-radius-base); background: var(--studioControlBackground); cursor: pointer; &:hover:not(:disabled) { background: var(--studioHoverBackground); } &.active { background: var(--studioActiveBackground); color: var(--studioActiveText); } }
  input:disabled, select:disabled, button:disabled { opacity: 0.45; cursor: default; }
  input:focus-visible, select:focus-visible, button:focus-visible, summary:focus-visible { outline: 2px solid var(--el-color-primary); outline-offset: 2px; }
  .timeSection { padding-block: 16px; border-bottom: 1px solid var(--el-border-color-lighter); }
  .clockHeading { display: flex; align-items: flex-end; justify-content: space-between; gap: 10px; .clockField { display: flex; flex-direction: column; gap: 6px; min-width: 0; color: var(--el-text-color-regular); input { width: 132px; max-width: 100%; box-sizing: border-box; min-height: 42px; padding: 4px 8px; color: var(--el-text-color-primary); font-size: 22px; font-weight: 500; line-height: 1.3; } } .playButton { display: inline-flex; align-items: center; justify-content: center; gap: 5px; min-height: 38px; flex-shrink: 0; svg { width: 16px; height: 16px; fill: none; stroke: currentColor; stroke-width: 1.6; stroke-linejoin: round; } } }
  .hourSlider { padding-inline: 4px; margin-top: 6px; .el-slider { height: 32px; --el-slider-height: 4px; --el-slider-button-size: 12px; } }
  .timeScale { display: flex; justify-content: space-between; gap: 4px; margin: 0 0 12px; color: var(--el-text-color-regular); font-size: 10px; font-variant-numeric: tabular-nums; }
  .quickChoices { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 4px; > button { min-width: 0; padding-inline: 4px; font-size: 11px; } }
  .seasonControl { display: grid; grid-template-columns: auto minmax(0, 1fr); align-items: center; gap: 12px; margin-top: 12px; > span { color: var(--el-text-color-regular); } }
  .selectField, .dateField { display: flex; align-items: center; justify-content: space-between; gap: 10px; min-height: 34px; margin-top: 10px; color: var(--el-text-color-regular); input, select { width: 158px; max-width: 66%; box-sizing: border-box; color: var(--el-text-color-primary); option { background: var(--el-bg-color-overlay); } } }
  .clockFooter { display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 6px 10px; margin-top: 8px; > span { color: var(--el-text-color-regular); font-size: 11px; } > button { min-height: 28px; font-size: 11px; } }
  .sectionHeading { display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 6px 10px; margin-bottom: 10px; h3 { font-size: 12px; font-weight: 600; } > span { color: var(--el-text-color-regular); font-size: 11px; } }
  .celestialDetails { padding-block: 14px; summary { width: fit-content; cursor: pointer; font-weight: 600; line-height: 24px; &::marker { color: var(--el-text-color-regular); } } .detailBody { padding-top: 6px; } }
  .rangeField { display: grid; grid-template-columns: 44px minmax(0, 1fr) 44px; align-items: center; gap: 8px; min-height: 34px; margin-top: 8px; color: var(--el-text-color-regular); > .el-slider { min-width: 0; height: 30px; padding-inline: 4px; --el-slider-height: 4px; --el-slider-button-size: 12px; } > output { text-align: right; color: var(--el-text-color-primary); font-variant-numeric: tabular-nums; small { margin-left: 2px; color: var(--el-text-color-regular); font-size: 10px; } } }
  .timeHint { margin-top: 8px; color: var(--el-text-color-regular); font-size: 11px; line-height: 1.7; overflow-wrap: anywhere; }
}
</style>
