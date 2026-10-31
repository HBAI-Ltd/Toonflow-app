<template>
  <div
    class="accountChart"
    role="group"
    :aria-label="label"
    :aria-busy="loading"
    :aria-describedby="hintId"
    :tabindex="hasData && !loading ? 0 : undefined"
    @focus="focusChart"
    @blur="hideTooltip"
    @keydown="selectKey">
    <div ref="chartElement" class="chartCanvas" />
    <div v-if="loading" class="chartPlaceholder" role="status">正在加载图表…</div>
    <span :id="hintId" class="chartAccessible">{{ hasData ? '使用左右方向键查看每日金额，Home 和 End 跳转首尾日期，Escape 关闭提示。' : '暂无消费数据' }}</span>
    <span class="chartAccessible" aria-live="polite">{{ activeDescription }}</span>
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, useId, watch } from "vue";
import { color, init, use, type EChartsType } from "echarts/core";
import { BarChart, LineChart } from "echarts/charts";
import { AriaComponent, GridComponent, TooltipComponent } from "echarts/components";
import { SVGRenderer } from "echarts/renderers";
import type { EChartsOption } from "echarts";

use([BarChart, LineChart, AriaComponent, GridComponent, TooltipComponent, SVGRenderer]);

const props = defineProps<{
  kind: "bar" | "line";
  dates: string[];
  series: { name: string; data: (number | null)[] }[];
  label: string;
  loading?: boolean;
}>();
const chartElement = ref<HTMLElement>();
const hintId = useId();
const activeIndex = ref<number | null>(null);
const moneyFormat = new Intl.NumberFormat("zh-CN", { style: "currency", currency: "CNY", minimumFractionDigits: 2, maximumFractionDigits: 5 });
const axisFormat = new Intl.NumberFormat("zh-CN", { notation: "compact", maximumFractionDigits: 5 });
const chartSeries = computed(() => props.kind === "line" ? props.series.slice(0, 1) : props.series);
const hasData = computed(() => props.dates.some((_, index) => chartSeries.value.some(series => typeof series.data[index] === "number" && Number.isFinite(series.data[index]))));
const activeDescription = computed(() => {
  if (activeIndex.value === null) return "";
  return props.dates[activeIndex.value] + "，" + chartSeries.value.flatMap(series => {
    const amount = series.data[activeIndex.value!];
    return amount == null ? [] : [series.name + " " + moneyFormat.format(amount)];
  }).join("，");
});
let chart: EChartsType | undefined;
let resizeObserver: ResizeObserver | undefined;
let themeObserver: MutationObserver | undefined;

function renderChart() {
  if (!chartElement.value?.clientWidth) return;
  chart ??= init(chartElement.value, undefined, { renderer: "svg" });
  activeIndex.value = null;
  if (props.loading || !hasData.value) {
    chart.clear();
    return;
  }
  const style = getComputedStyle(chartElement.value);
  const primary = style.getPropertyValue("--el-color-primary").trim() || "#3478f6";
  const text = style.getPropertyValue("--el-text-color-secondary").trim() || "#8a8f99";
  const border = style.getPropertyValue("--el-border-color-lighter").trim() || "#e5e7eb";
  const options: EChartsOption = {
    animation: false,
    color: [primary, "#12b8a6", "#f6aa36", "#9867e8", "#ed7185", "#4db5dc", "#a3af3e", "#c17f49"],
    aria: { enabled: true, label: { description: props.label } },
    grid: { left: 8, right: 16, top: 18, bottom: 16, containLabel: true },
    tooltip: {
      trigger: "axis",
      renderMode: "richText",
      confine: true,
      backgroundColor: style.getPropertyValue("--el-bg-color-overlay").trim() || "#fff",
      borderColor: border,
      textStyle: { color: style.getPropertyValue("--el-text-color-regular").trim() || text, fontSize: 12 },
      valueFormatter: value => typeof value === "number" ? moneyFormat.format(value) : "",
      axisPointer: { type: "line", lineStyle: { color: text, type: "dashed" } },
    },
    xAxis: {
      type: "category",
      data: props.dates,
      boundaryGap: props.kind === "bar" || props.dates.length === 1,
      axisLine: { lineStyle: { color: border } },
      axisTick: { alignWithLabel: true },
      axisLabel: {
        color: text,
        fontSize: 11,
        hideOverlap: true,
        formatter: value => props.dates.length === 1 ? value : value.slice(5),
      },
    },
    yAxis: {
      type: "value",
      min: 0,
      splitNumber: 5,
      axisLabel: { color: text, fontSize: 11, formatter: value => axisFormat.format(value) },
      splitLine: { lineStyle: { color: border } },
    },
    series: chartSeries.value.map(series => props.kind === "bar" ? {
      type: "bar",
      name: series.name,
      data: series.data,
      stack: "consumption",
      barMaxWidth: 38,
    } : {
      type: "line",
      name: series.name,
      data: series.data,
      smooth: 0.3,
      smoothMonotone: "x",
      connectNulls: false,
      showSymbol: props.dates.length === 1,
      symbolSize: 6,
      lineStyle: { width: 2.5 },
      areaStyle: {
        color: {
          type: "linear", x: 0, y: 0, x2: 0, y2: 1,
          colorStops: [
            { offset: 0, color: color.modifyAlpha(primary, 0.3) },
            { offset: 1, color: color.modifyAlpha(primary, 0.025) },
          ],
        },
      },
    }),
  };
  chart.setOption(options, { notMerge: true });
}

function showTooltip(index: number) {
  if (props.loading || !hasData.value) return;
  activeIndex.value = index;
  const seriesIndex = chartSeries.value.findIndex(series => series.data[index] != null);
  chart?.dispatchAction(seriesIndex < 0 ? { type: "hideTip" } : { type: "showTip", seriesIndex, dataIndex: index });
}

function hideTooltip() {
  activeIndex.value = null;
  chart?.dispatchAction({ type: "hideTip" });
}

function focusChart(event: FocusEvent) {
  if ((event.currentTarget as HTMLElement).matches(":focus-visible")) showTooltip(0);
}

function selectKey(event: KeyboardEvent) {
  if (props.loading || !hasData.value || !["ArrowLeft", "ArrowRight", "Home", "End", "Escape"].includes(event.key)) return;
  event.preventDefault();
  if (event.key === "Escape") hideTooltip();
  else if (event.key === "Home") showTooltip(0);
  else if (event.key === "End") showTooltip(props.dates.length - 1);
  else showTooltip(Math.max(0, Math.min(props.dates.length - 1, (activeIndex.value ?? 0) + (event.key === "ArrowRight" ? 1 : -1))));
}

watch(() => [props.dates, props.series, props.kind, props.label, props.loading], renderChart, { flush: "post" });
onMounted(() => {
  renderChart();
  resizeObserver = new ResizeObserver(() => {
    if (!chart) renderChart();
    else chart.resize();
  });
  if (chartElement.value) resizeObserver.observe(chartElement.value);
  themeObserver = new MutationObserver(renderChart);
  themeObserver.observe(document.documentElement, { attributes: true, attributeFilter: ["class", "style"] });
});
onBeforeUnmount(() => {
  resizeObserver?.disconnect();
  themeObserver?.disconnect();
  chart?.dispose();
});
</script>

<style lang="scss" scoped>
.accountChart {
  position: relative;
  width: 100%;
  min-width: 0;
  border-radius: var(--el-border-radius-base);

  &:focus-visible { outline: 2px solid var(--el-color-primary); outline-offset: 3px; }
  .chartCanvas { width: 100%; height: 236px; }
  .chartPlaceholder {
    position: absolute;
    inset: 0;
    display: grid;
    place-items: center;
    color: var(--el-text-color-secondary);
    font-size: 12px;
  }
  .chartAccessible {
    position: absolute;
    width: 1px;
    height: 1px;
    padding: 0;
    overflow: hidden;
    clip-path: inset(50%);
    white-space: nowrap;
  }
}
</style>
