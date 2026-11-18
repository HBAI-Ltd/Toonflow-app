<template>
  <svg class="stageScene" :viewBox="`0 0 ${width} ${height}`" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
    <line v-for="(line, index) in render.grid" :key="`grid${index}`" class="gridLine" :x1="line[0]" :y1="line[1]" :x2="line[2]" :y2="line[3]" :style="{ strokeOpacity: line[4] }" />
    <polygon v-for="(face, index) in render.ground" :key="`ground${index}`" :points="face.points" :style="{ fill: face.fill, stroke: face.fill }" />
    <g class="shadows">
      <polygon v-for="(points, index) in render.shadows" :key="index" :points="points" />
    </g>
    <polygon v-if="render.fieldOfView" class="fieldOfView" :points="render.fieldOfView" />
    <template v-for="(face, index) in render.faces" :key="index">
      <polygon :points="face.points" :style="{ fill: face.fill, stroke: face.fill }" />
      <path v-if="face.glass" :d="face.glass" :style="{ fill: face.glassFill }" />
      <path v-if="face.lit" class="litWindow" :d="face.lit" />
    </template>
  </svg>
</template>

<script setup lang="ts">
import { computed } from "vue";

type Vec = [number, number, number];
type Tone = "clay" | "road" | "paint" | "glass" | "rail" | "lamp" | "accent";
type Box = { x: number; y: number; z?: number; w: number; d: number; h: number; tone?: Tone; layer?: number; windows?: boolean };

// ACT: 装饰用的极简 SVG 白模渲染：透视投影、背面剔除、按法线打光、近裁剪面，按占地中心远近排序作画家算法；
// 只适用于互不穿插的轴对齐方块，场景变复杂或需要交互时应换成真正的 3D 引擎。
const props = defineProps<{ shot: { target: Vec; distance: number; elevation: number; azimuth: number; focal: number; rig?: boolean } }>();
const width = 320;
const height = 180;
const light = normalize([-0.5, 0.3, 0.86]);
const tones: Record<Tone, (shade: number) => string> = {
  clay: shade => `hsl(220 8% ${Math.round(30 + 64 * shade)}%)`,
  road: shade => `hsl(220 6% ${Math.round(26 + 34 * shade)}%)`,
  paint: shade => `hsl(0 0% ${Math.round(62 + 36 * shade)}%)`,
  glass: shade => `hsl(214 18% ${Math.round(16 + 26 * shade)}%)`,
  rail: shade => `hsl(220 6% ${Math.round(20 + 30 * shade)}%)`,
  lamp: () => "hsl(44 100% 84%)",
  accent: shade => `color-mix(in srgb, var(--el-color-primary) ${Math.round(40 + 60 * shade)}%, #000)`,
};

// 场景单位约为 0.1 米：x 向东、y 向南、z 向上；人物约 18 高，一层楼 30 高。
function person(x: number, y: number, z: number, shoulders: "x" | "y", tone: Tone = "clay"): Box[] {
  const parts = [[-3, -1.3, 0, 2.6, 2.6, 9], [0.4, -1.3, 0, 2.6, 2.6, 9], [-3.2, -1.8, 9, 6.4, 3.6, 7.5], [-5.2, -1, 9.6, 1.8, 2, 7], [3.4, -1, 9.6, 1.8, 2, 7], [-1.8, -1.8, 16.8, 3.6, 3.6, 3.6]];
  return parts.map(([u, v, lift, across, depth, tall]) => shoulders === "x"
    ? { x: x + u!, y: y + v!, z: z + lift!, w: across!, d: depth!, h: tall!, tone }
    : { x: x + v!, y: y + u!, z: z + lift!, w: depth!, d: across!, h: tall!, tone });
}
function streetLamp(x: number, y: number): Box[] {
  return [
    { x: x - 1.2, y: y - 1.2, z: 4, w: 2.4, d: 2.4, h: 62, tone: "rail" },
    { x: x - 1, y: y - 1, z: 64, w: 2, d: 18, h: 2, tone: "rail" },
    { x: x - 3, y: y + 12, z: 60, w: 6, d: 7, h: 4, tone: "lamp" },
  ];
}
function tree(x: number, y: number): Box[] {
  return [
    { x: x - 1.5, y: y - 1.5, z: 4, w: 3, d: 3, h: 16 },
    { x: x - 10, y: y - 10, z: 18, w: 20, d: 20, h: 14 },
    { x: x - 6, y: y - 6, z: 32, w: 12, d: 12, h: 9 },
  ];
}
function car(x: number, y: number): Box[] {
  return [
    { x, y, z: 2, w: 46, d: 19, h: 9 },
    { x: x + 10, y: y + 1, z: 11, w: 24, d: 17, h: 7, tone: "glass" },
  ];
}
const scene: Box[] = [
  { x: 100, y: 760, w: 1040, d: 120, h: 2, tone: "road", layer: 0 },
  { x: 100, y: 700, w: 1040, d: 60, h: 4, layer: 1 },
  { x: 100, y: 880, w: 1040, d: 50, h: 4, layer: 1 },
  ...Array.from({ length: 6 }, (_, index): Box => ({ x: 612, y: 765 + index * 19, z: 2, w: 64, d: 9, h: 0.4, tone: "paint", layer: 1 })),
  ...Array.from({ length: 16 }, (_, index) => 116 + index * 64).filter(x => x < 572 || x > 690).map((x): Box => ({ x, y: 818, z: 2, w: 32, d: 3, h: 0.3, tone: "paint", layer: 1 })),
  { x: 250, y: 520, w: 160, d: 170, h: 180, windows: true },
  { x: 270, y: 540, z: 180, w: 120, d: 120, h: 30 },
  { x: 290, y: 560, z: 210, w: 30, d: 24, h: 10 },
  { x: 440, y: 600, w: 230, d: 90, h: 90, windows: true },
  { x: 452, y: 690, z: 34, w: 206, d: 14, h: 2 },
  { x: 700, y: 560, w: 90, d: 110, h: 240, windows: true },
  { x: 712, y: 572, z: 240, w: 66, d: 86, h: 14 },
  { x: 820, y: 590, w: 170, d: 100, h: 70, windows: true },
  { x: 160, y: 950, w: 300, d: 10, h: 14 },
  { x: 820, y: 940, w: 50, d: 40, h: 28 },
  { x: 814, y: 934, z: 28, w: 62, d: 52, h: 3 },
  { x: 836, y: 706, z: 4, w: 12, d: 12, h: 10 },
  { x: 851, y: 709, z: 4, w: 9, d: 9, h: 7 },
  { x: 596, y: 740, z: 4, w: 26, d: 6, h: 4 },
  ...streetLamp(540, 744),
  ...streetLamp(900, 744),
  ...tree(420, 728),
  ...tree(1010, 728),
  ...car(830, 774),
  ...car(300, 846),
  ...person(632, 812, 2.4, "y", "accent"),
  ...person(670, 826, 2.4, "y"),
  ...person(482, 730, 4, "x"),
  ...person(960, 905, 4, "x"),
];
// 摄影机组：轨道、轨道车、立柱与摄影机，镜头朝北对着两位演员。
const rigBoxes: Box[] = [
  { x: 548, y: 1000, w: 130, d: 1.6, h: 1.2, tone: "rail", layer: 1 },
  { x: 548, y: 1009, w: 130, d: 1.6, h: 1.2, tone: "rail", layer: 1 },
  { x: 604, y: 1001, z: 1.2, w: 14, d: 10, h: 3, tone: "rail" },
  { x: 610, y: 1005, z: 4.2, w: 2, d: 2, h: 12, tone: "rail" },
  { x: 605, y: 1000, z: 16, w: 12, d: 8, h: 7, tone: "accent" },
  { x: 609, y: 994, z: 17, w: 4, d: 6, h: 5, tone: "accent" },
];

function sub(a: Vec, b: Vec): Vec { return [a[0] - b[0], a[1] - b[1], a[2] - b[2]]; }
function dot(a: Vec, b: Vec) { return a[0] * b[0] + a[1] * b[1] + a[2] * b[2]; }
function cross(a: Vec, b: Vec): Vec { return [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]]; }
function normalize(v: Vec): Vec { const length = Math.hypot(...v); return [v[0] / length, v[1] / length, v[2] / length]; }
function hull(points: [number, number][]) {
  const sorted = [...points].sort((a, b) => a[0] - b[0] || a[1] - b[1]);
  const turn = (o: [number, number], a: [number, number], b: [number, number]) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
  const chain = (list: [number, number][]) => list.reduce<[number, number][]>((result, point) => {
    while (result.length >= 2 && turn(result[result.length - 2]!, result[result.length - 1]!, point) <= 0) result.pop();
    result.push(point);
    return result;
  }, []);
  const lower = chain(sorted);
  const upper = chain([...sorted].reverse());
  return [...lower.slice(0, -1), ...upper.slice(0, -1)];
}

const render = computed(() => {
  const { target, distance, elevation, azimuth, focal, rig } = props.shot;
  const pitch = elevation * Math.PI / 180;
  const yaw = azimuth * Math.PI / 180;
  const camera: Vec = [target[0] + Math.sin(yaw) * Math.cos(pitch) * distance, target[1] + Math.cos(yaw) * Math.cos(pitch) * distance, target[2] + Math.sin(pitch) * distance];
  const forward = normalize(sub(target, camera));
  const right = normalize(cross([0, 0, 1], forward));
  const up = cross(forward, right);
  const lens = focal * width / 2;
  const toView = (point: Vec): Vec => { const offset = sub(point, camera); return [dot(offset, right), dot(offset, up), dot(offset, forward)]; };
  const toScreen = ([x, y, z]: Vec) => `${(width / 2 + lens * x / z).toFixed(1)},${(height / 2 - lens * y / z).toFixed(1)}`;
  // 多边形先在相机空间裁掉镜头背后的部分，再投影到画面。
  const project = (points: Vec[]) => {
    const view = points.map(toView);
    const clipped: Vec[] = [];
    view.forEach((current, index) => {
      const previous = view[(index + view.length - 1) % view.length]!;
      if ((current[2] >= 1) !== (previous[2] >= 1)) {
        const t = (1 - previous[2]) / (current[2] - previous[2]);
        clipped.push([previous[0] + (current[0] - previous[0]) * t, previous[1] + (current[1] - previous[1]) * t, 1]);
      }
      if (current[2] >= 1) clipped.push(current);
    });
    return clipped.length >= 3 ? clipped.map(toScreen) : [];
  };

  const center: [number, number] = [620, 790];
  const radius = 560;
  const grid: number[][] = [];
  for (let offset = -radius; offset <= radius; offset += 40) {
    const half = Math.sqrt(radius * radius - offset * offset);
    for (const [a, b] of [[[center[0] + offset, center[1] - half, 0], [center[0] + offset, center[1] + half, 0]], [[center[0] - half, center[1] + offset, 0], [center[0] + half, center[1] + offset, 0]]] as [Vec, Vec][]) {
      let start = toView(a);
      let end = toView(b);
      if (start[2] < 1 && end[2] < 1) continue;
      if (start[2] < 1) start = [end[0] + (start[0] - end[0]) * (end[2] - 1) / (end[2] - start[2]), end[1] + (start[1] - end[1]) * (end[2] - 1) / (end[2] - start[2]), 1];
      if (end[2] < 1) end = [start[0] + (end[0] - start[0]) * (start[2] - 1) / (start[2] - end[2]), start[1] + (end[1] - start[1]) * (start[2] - 1) / (start[2] - end[2]), 1];
      const [x1, y1] = toScreen(start).split(",").map(Number);
      const [x2, y2] = toScreen(end).split(",").map(Number);
      grid.push([x1!, y1!, x2!, y2!, 0.22 * (1 - Math.abs(offset) / radius)]);
    }
  }

  const boxes = rig ? [...scene, ...rigBoxes] : scene;
  const reach = (box: Box) => Math.hypot(box.x + box.w / 2 - camera[0], box.y + box.d / 2 - camera[1]);
  const ordered = boxes.map((box, index) => ({ box, index })).sort((left, right) => {
    const layer = (left.box.layer ?? 2) - (right.box.layer ?? 2);
    if (layer || (left.box.layer ?? 2) < 2) return layer || left.index - right.index;
    return reach(right.box) - reach(left.box) || (left.box.z ?? 0) - (right.box.z ?? 0);
  });

  type Face = { points: string; fill: string; glass?: string; glassFill?: string; lit?: string };
  const ground: Face[] = [];
  const faces: Face[] = [];
  for (const { box, index: boxIndex } of ordered) {
    const x0 = box.x, x1 = box.x + box.w, y0 = box.y, y1 = box.y + box.d, z0 = box.z ?? 0, z1 = z0 + box.h;
    const sides: { normal: Vec; corners: Vec[] }[] = [
      { normal: [0, 0, 1], corners: [[x0, y0, z1], [x1, y0, z1], [x1, y1, z1], [x0, y1, z1]] },
      { normal: [0, 1, 0], corners: [[x0, y1, z0], [x1, y1, z0], [x1, y1, z1], [x0, y1, z1]] },
      { normal: [0, -1, 0], corners: [[x1, y0, z0], [x0, y0, z0], [x0, y0, z1], [x1, y0, z1]] },
      { normal: [1, 0, 0], corners: [[x1, y1, z0], [x1, y0, z0], [x1, y0, z1], [x1, y1, z1]] },
      { normal: [-1, 0, 0], corners: [[x0, y0, z0], [x0, y1, z0], [x0, y1, z1], [x0, y0, z1]] },
    ];
    for (const side of sides) {
      if (dot(side.normal, sub(camera, side.corners[0]!)) <= 0) continue;
      const projected = project(side.corners);
      if (!projected.length) continue;
      const shade = 0.3 + 0.7 * Math.max(0, dot(side.normal, light));
      const face: Face = { points: projected.join(" "), fill: tones[box.tone ?? "clay"](shade) };
      if (box.windows && !side.normal[2]) {
        // 立面窗格：每层一排，约 6% 的窗户亮灯。
        const origin = side.corners[0]!;
        const along = sub(side.corners[1]!, origin);
        const length = Math.hypot(...along);
        const direction = normalize(along);
        const columns = Math.floor((length - 8) / 22);
        const start = (length - (columns * 22 - 12)) / 2;
        const glass: string[] = [];
        const lit: string[] = [];
        let row = 0;
        for (let bottom = z0 + 9; bottom + 12 <= z1 - 5; bottom += 30, row++) {
          for (let column = 0; column < columns; column++) {
            const left = start + column * 22;
            const corner = (u: number, z: number): Vec => [origin[0] + direction[0] * u + side.normal[0] * 0.3, origin[1] + direction[1] * u + side.normal[1] * 0.3, z];
            const pane = project([corner(left, bottom), corner(left + 10, bottom), corner(left + 10, bottom + 12), corner(left, bottom + 12)]);
            if (!pane.length) continue;
            ((row * 7 + column * 13 + boxIndex * 5) % 17 === 0 ? lit : glass).push(`M${pane.join("L")}Z`);
          }
        }
        face.glass = glass.join("");
        face.glassFill = tones.glass(shade);
        face.lit = lit.join("");
      }
      ((box.layer ?? 2) < 2 ? ground : faces).push(face);
    }
  }

  const shadowStep = [-light[0] / light[2], -light[1] / light[2]];
  const shadows = ordered.filter(({ box }) => (box.layer ?? 2) === 2 && box.h >= 2).map(({ box }) => {
    const z0 = box.z ?? 0;
    const footprint: [number, number][] = [[box.x, box.y], [box.x + box.w, box.y], [box.x + box.w, box.y + box.d], [box.x, box.y + box.d]];
    const cast = [z0, z0 + box.h].flatMap(z => footprint.map(([x, y]): [number, number] => [x + shadowStep[0]! * z, y + shadowStep[1]! * z]));
    return project(hull(cast).map(([x, y]): Vec => [x, y, 0.2])).join(" ");
  }).filter(Boolean);
  const fieldOfView = rig ? project([[611, 994, 2.4], [540, 790, 2.4], [720, 790, 2.4]]).join(" ") : "";
  return { grid, ground, shadows, fieldOfView, faces };
});
</script>

<style lang="scss" scoped>
.stageScene {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;

  polygon { stroke-width: 0.4; stroke-linejoin: round; }

  .gridLine { stroke: var(--el-text-color-primary); stroke-width: 0.5; }
  .shadows { opacity: 0.26; fill: #0b0d12; }
  .fieldOfView { fill: color-mix(in srgb, var(--el-color-primary) 24%, transparent); stroke: none; }
  .litWindow { fill: hsl(40 92% 70%); }
}
</style>
