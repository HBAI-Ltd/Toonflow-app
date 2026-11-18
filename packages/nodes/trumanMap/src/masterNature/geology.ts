import { beam, cap, combineMeshes, design, lobe, needle, part, tube } from "./shared";
import type { MasterNatureDesign, ModelPart, Triple } from "./shared";

function hexPrism(name: string, position: Triple, radius: number, height: number): ModelPart {
  return part(name, "extrude", "#8f9c94", position, [1, 1, 1], [-90, 0, 0], { depth: height, profile: Array.from({ length: 6 }, (_, index) => ({ x: Math.cos(index * Math.PI / 3) * radius, y: Math.sin(index * Math.PI / 3) * radius })) });
}

function crystalCluster(shape: "quartz" | "calcite" | "pyrite"): ModelPart[] {
  const parts: ModelPart[] = [];
  for (let index = 0; index < 7; index++) {
    const a = index * 2.4; const x = Math.cos(a) * (index ? 0.17 : 0); const z = Math.sin(a) * (index ? 0.17 : 0); const h = index ? 0.25 + index % 3 * 0.09 : 0.58;
    if (shape === "pyrite") parts.push(part("黄铁矿立方晶", "box", "#b5a877", [x, h / 2, z], [h, h, h], [index % 2 * 15, index * 31, 0], { metalness: 0.45, roughness: 0.4 }));
    else if (shape === "quartz") { parts.push(hexPrism("六棱水晶柱", [x, h / 2, z], 0.075, h), needle("水晶锥面", "#b8d1c7", [x, h, z], [x, h + 0.16, z], 0.15)); }
    else parts.push(needle("犬牙状方解石晶", "#cad2bb", [x, 0, z], [x * 1.3, h, z * 1.3], 0.18), needle("反向锥晶根", "#cad2bb", [x, h * 0.32, z], [x, -0.05, z], 0.12));
  }
  return parts;
}

export const geologyDesigns: MasterNatureDesign[] = [
  design("granite", "花岗岩巨石", "岩石", () => [lobe("整体花岗岩", "#a2a58e", [0, 0.55, 0], [1.55, 1.2, 1.25]), ...Array.from({ length: 9 }, (_, index) => lobe("表面矿物颗粒", "#b4b59e", [Math.cos(index * 2.4) * 0.59, 0.25 + index % 3 * 0.22, Math.sin(index * 2.4) * 0.45], [0.13, 0.09, 0.1]))]),
  design("shale", "层理页岩", "岩石", () => Array.from({ length: 7 }, (_, layer) => part("薄层页岩", "box", layer % 2 ? "#999e8d" : "#adb09a", [layer * 0.045, 0.04 + layer * 0.075, 0], [1.2 - layer * 0.07, 0.07, 0.8 - layer % 3 * 0.06], [0, layer % 2 * 7, -3]))),
  design("basaltColumns", "六棱玄武岩柱", "岩石", () => Array.from({ length: 7 }, (_, index) => { const a = index * Math.PI / 3; const h = index ? 0.7 + index % 3 * 0.2 : 1.4; return hexPrism("相接六棱玄武柱", [index ? Math.cos(a) * 0.31 : 0, h / 2, index ? Math.sin(a) * 0.31 : 0], 0.19, h); })),
  design("stalactite", "洞顶钟乳石", "岩石", () => [part("洞顶岩板", "box", "#b2ad94", [0, 1.3, 0], [1.45, 0.26, 0.9]), ...Array.from({ length: 6 }, (_, index) => needle("向下生长钟乳石", "#bcb69b", [(index - 2.5) * 0.2, 1.22, index % 2 * 0.2], [(index - 2.5) * 0.2 + 0.03, 0.15 + index % 3 * 0.16, index % 2 * 0.2], 0.22))]),
  design("stalagmite", "地面石笋", "岩石", () => [part("层积石笋", "lathe", "#b4b198", [0, 0, 0], [1, 1, 1], [0, 0, 0], { profile: [{ x: 0, y: 0 }, { x: 0.28, y: 0 }, { x: 0.24, y: 0.2 }, { x: 0.19, y: 0.3 }, { x: 0.2, y: 0.45 }, { x: 0.13, y: 0.6 }, { x: 0.1, y: 0.9 }, { x: 0, y: 1.25 }] })]),
  design("quartz", "石英水晶簇", "岩石", () => crystalCluster("quartz")),
  design("calcite", "犬牙方解石簇", "岩石", () => crystalCluster("calcite")),
  design("pyrite", "黄铁矿立方晶簇", "岩石", () => crystalCluster("pyrite")),
  design("saltCrystal", "阶梯盐晶", "岩石", () => { const parts: ModelPart[] = []; for (let layer = 0; layer < 5; layer++) for (const side of [-1, 1]) parts.push(part("漏斗阶梯晶壁", "box", "#d2d8c1", [side * (0.3 - layer * 0.035), layer * 0.09, 0], [0.07, 0.08, 0.6 - layer * 0.07]), part("漏斗阶梯晶壁", "box", "#d2d8c1", [0, layer * 0.09, side * (0.3 - layer * 0.035)], [0.6 - layer * 0.07, 0.08, 0.07])); return parts; }),
  design("obsidian", "黑曜石贝壳状断口", "岩石", () => [part("玻璃质岩体", "extrude", "#66776f", [0, 0, 0], [1, 1, 1], [0, 0, 0], { depth: 0.5, profile: [{ x: -0.45, y: 0 }, { x: 0.4, y: 0 }, { x: 0.25, y: 0.68 }, { x: 0, y: 0.88 }, { x: -0.35, y: 0.51 }] }), ...Array.from({ length: 5 }, (_, index) => part("弧形断裂台阶", "torus", "#829088", [0, 0.4, 0.26 + index * 0.008], [0.45 + index * 0.1, 0.38 + index * 0.07, 0.03], [0, 0, 0]))]),
  design("tafoni", "蜂窝风蚀岩", "岩石", () => { const parts = [lobe("风蚀岩基", "#b6ac8d", [0, 0.18, 0], [1.2, 0.4, 0.9])]; for (let row = 0; row < 3; row++) for (let column = 0; column < 4; column++) parts.push(part("贯穿蜂窝孔壁", "torus", "#b8ad8b", [(column - 1.5) * 0.24 + row % 2 * 0.1, 0.3 + row * 0.2, 0], [0.3, 0.28, 0.38])); return parts; }),
  design("mushroomRock", "蘑菇风蚀岩", "岩石", () => [lobe("抗蚀岩帽", "#a7a48e", [0, 1.15, 0], [1.8, 0.6, 1.5]), part("收腰风蚀岩柱", "lathe", "#b2a687", [0, 0, 0], [1, 1, 1], [0, 0, 0], { profile: [{ x: 0, y: 0 }, { x: 0.5, y: 0 }, { x: 0.23, y: 0.35 }, { x: 0.2, y: 0.7 }, { x: 0.5, y: 1.05 }, { x: 0, y: 1.05 }] })]),
  design("naturalArch", "天然石拱门", "岩石", () => { const outer = Array.from({ length: 9 }, (_, i) => ({ x: Math.cos(Math.PI - i * Math.PI / 8) * 1.6, y: 0.3 + Math.sin(i * Math.PI / 8) * 1.8 })); const inner = Array.from({ length: 9 }, (_, i) => ({ x: Math.cos(i * Math.PI / 8) * 1.05, y: Math.sin(i * Math.PI / 8) * 1.25 })); return [part("完整镂空石拱", "extrude", "#b2ad92", [0, 0, 0], [1, 1, 1], [0, 0, 0], { depth: 0.9, profile: [...outer, ...inner] })]; }),
  design("riverPebble", "河磨卵石", "岩石", () => [lobe("圆磨卵石主体", "#a6ad9b", [0, 0.15, 0], [0.65, 0.3, 0.44]), tube("石英脉", "#d1d0b4", [[-0.25, 0.2, 0.04], [-0.1, 0.29, 0.03], [0.1, 0.28, -0.01], [0.26, 0.18, -0.03]], 0.012)]),
  design("pumice", "多孔浮石", "岩石", () => { const parts: ModelPart[] = []; for (let index = 0; index < 11; index++) { const a = index * 2.4; parts.push(part("浮石气孔壁", "torus", "#b8b69e", [Math.cos(a) * 0.17, 0.12 + index % 3 * 0.09, Math.sin(a) * 0.14], [0.2, 0.18, 0.16], [index * 27, index * 39, 0])); } return parts; }),
  design("volcanoCrater", "火山口", "岩石", () => [part("环形火山锥", "lathe", "#939985", [0, 0, 0], [1, 1, 1], [0, 0, 0], { profile: [{ x: 1.7, y: 0 }, { x: 0.7, y: 1.25 }, { x: 0.5, y: 1.2 }, { x: 0.25, y: 0.7 }, { x: 0, y: 0.63 }, { x: 0, y: 0 }] }), lobe("凝固岩浆塞", "#8b8e7d", [0, 0.66, 0], [0.55, 0.08, 0.55])]),
  design("lavaFlow", "凝固绳状熔岩", "岩石", () => Array.from({ length: 6 }, (_, index) => tube("绳状熔岩脊", "#838d7c", [[-0.9, 0.1, (index - 2.5) * 0.19], [-0.45, 0.15, (index - 2.5) * 0.19 + 0.1], [0, 0.12, (index - 2.5) * 0.19 - 0.08], [0.5, 0.1, (index - 2.5) * 0.19 + 0.08], [1, 0.07, (index - 2.5) * 0.19]], 0.12))),
  design("sandDune", "新月形沙丘", "岩石", () => { const points = Array.from({ length: 13 }, (_, index) => { const a = index / 12 * Math.PI; return [Math.cos(a) * 1.4, Math.sin(a) * 0.55, Math.sin(a) * 0.7] as Triple; }); const vertices = points.flatMap(([x, y, z]) => [{ x, y, z }, { x, y: 0, z: z + 0.7 }, { x, y: 0, z: z - 0.18 }]); const indices: number[] = []; for (let i = 0; i < 12; i++) { const a = i * 3; const b = a + 3; indices.push(a, b, b + 1, a, b + 1, a + 1, a, a + 2, b + 2, a, b + 2, b); } return [part("连续月牙沙丘脊", "mesh", "#c4b58c", [0, 0, 0], [1, 1, 1], [0, 0, 0], { vertices, indices })]; }),
  design("iceberg", "冰山", "岩石", () => [needle("主冰峰", "#bfd9d0", [-0.2, 0, 0], [-0.35, 2.1, 0.1], 2.1), needle("侧冰脊", "#aecdc8", [0.6, 0, 0.1], [0.9, 1.15, 0.1], 1.5), lobe("冰山水线基部", "#c6ded2", [0, 0.13, 0], [2.5, 0.35, 1.8])]),
  design("icicles", "檐下冰柱", "岩石", () => [part("冰檐连接板", "box", "#c1d8ce", [0, 0.75, 0], [1.25, 0.14, 0.3]), ...Array.from({ length: 8 }, (_, index) => needle("向下冰柱", "#c8dfd6", [(index - 3.5) * 0.15, 0.73, 0], [(index - 3.5) * 0.15, 0.1 + index % 3 * 0.1, 0], 0.1))]),
  design("snowCornice", "悬挑雪檐", "岩石", () => [lobe("承托山崖", "#8c9785", [0, 0.65, -0.3], [1.3, 1.4, 0.95]), part("悬挑积雪檐", "extrude", "#d7e0d2", [0, 1.2, 0], [1, 1, 1], [0, 90, 0], { depth: 1.5, profile: [{ x: -0.5, y: 0 }, { x: 0.65, y: 0.08 }, { x: 0.8, y: 0.32 }, { x: 0.3, y: 0.45 }, { x: -0.5, y: 0.3 }] })]),
  design("ammoniteFossil", "菊石化石", "岩石", () => [lobe("化石基岩", "#aaa88e", [0, 0.1, 0], [0.8, 0.22, 0.65]), tube("菊石螺旋壳印", "#c1b894", Array.from({ length: 33 }, (_, i) => { const a = i / 32 * Math.PI * 5; const r = 0.025 + i / 32 * 0.23; return [Math.cos(a) * r, 0.215, Math.sin(a) * r] as Triple; }), 0.022)]),
  design("meteorite", "熔壳陨石", "岩石", () => { const parts = [lobe("陨石主体", "#808e7f", [0, 0.24, 0], [0.7, 0.55, 0.62])]; for (let index = 0; index < 6; index++) { const a = index * Math.PI / 3; parts.push(cap("熔蚀气印", "#677b6c", [Math.cos(a) * 0.2, 0.35 + index % 2 * 0.06, Math.sin(a) * 0.18], 0.065, 0.04, 3)); } return parts; }),
  design("crackedClay", "龟裂泥地", "岩石", () => Array.from({ length: 9 }, (_, index) => part("独立翘边泥片", "extrude", "#b3a889", [(index % 3 - 1) * 0.35, 0.025, (Math.floor(index / 3) - 1) * 0.31], [1, 1, 1], [-90, 0, index % 2 * 10], { depth: 0.05, profile: [{ x: -0.16, y: -0.13 }, { x: 0.14, y: -0.14 }, { x: 0.18, y: 0.02 }, { x: 0.07, y: 0.16 }, { x: -0.15, y: 0.11 }] }))),
  design("caveColumn", "洞穴石柱", "岩石", () => [part("钟乳石笋融合柱", "lathe", "#b4b49b", [0, 0, 0], [1, 1, 1], [0, 0, 0], { profile: [{ x: 0, y: 0 }, { x: 0.5, y: 0 }, { x: 0.31, y: 0.4 }, { x: 0.19, y: 1 }, { x: 0.22, y: 1.6 }, { x: 0.4, y: 2.2 }, { x: 0.65, y: 2.5 }, { x: 0, y: 2.5 }] })]),
];
