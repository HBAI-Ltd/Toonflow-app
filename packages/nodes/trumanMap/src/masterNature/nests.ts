import { beam, cap, combineMeshes, design, leaf, lobe, needle, part, polygon, sweptProfile, tapered, tube } from "./shared";
import type { MasterNatureDesign, ModelPart, Triple } from "./shared";

const straw = "#b5aa82";
const mud = "#b4aa8d";
const leafColor = "#a2b48b";

function cup(name: string, radius: number, height: number, half = false): ModelPart {
  const result = sweptProfile(name, mud, [[0, 0], [radius * 0.5, height * 0.05], [radius * 0.9, height * 0.5], [radius, height], [radius * 0.88, height], [radius * 0.78, height * 0.5], [radius * 0.45, height * 0.16], [0, height * 0.13]], half ? Math.PI : Math.PI * 2);
  return result;
}

function hexRing(root: Triple, radius: number, height: number): ModelPart {
  return polygon("独立六角巢室壁", "#c5bea0", Array.from({ length: 6 }, (_, i) => [Math.cos(i * Math.PI / 3) * radius, Math.sin(i * Math.PI / 3) * radius] as [number, number]), height, root, [Array.from({ length: 6 }, (_, i) => [Math.cos(i * Math.PI / 3) * radius * 0.78, Math.sin(i * Math.PI / 3) * radius * 0.78] as [number, number])]);
}

function nest(kind: number): ModelPart[] {
  const parts: ModelPart[] = [];
  if (kind === 0) { parts.push(part("织布鸟封闭梨状巢室", "lathe", straw, [0, 0.13, 0], [1, 1, 1], [0, 0, 0], { profile: [{ x: 0.035, y: 0 }, { x: 0.16, y: 0.12 }, { x: 0.18, y: 0.28 }, { x: 0.12, y: 0.43 }, { x: 0, y: 0.47 }, { x: 0, y: 0.45 }, { x: 0.1, y: 0.41 }, { x: 0.16, y: 0.28 }, { x: 0.14, y: 0.13 }, { x: 0.025, y: 0 }] }), part("向下开口的出入长颈", "lathe", "#a6a17a", [0, 0, 0], [1, 1, 1], [0, 0, 0], { profile: [{ x: 0.035, y: 0 }, { x: 0.04, y: 0.15 }, { x: 0.028, y: 0.15 }, { x: 0.025, y: 0 }] }), tube("巢顶悬挂编织带", "#bdb592", [[0, 0.6, 0], [0.02, 0.8, 0], [0.09, 0.88, 0]], 0.016)); for (let i = 0; i < 5; i++) parts.push(part("横向草纤维编织带", "torus", "#cec5a2", [0, 0.24 + i * 0.055, 0], [0.31 - Math.abs(i - 2) * 0.035, 0.31 - Math.abs(i - 2) * 0.035, 0.02], [90, 0, 0])); }
  else if (kind === 1) { parts.push(cup("黄鹂深兜状吊巢", 0.15, 0.4)); for (const side of [-1, 1]) parts.push(tube("缠绕枝杈的编织悬吊带", straw, [[side * 0.13, 0.38, 0], [side * 0.2, 0.64, 0], [side * 0.32, 0.69, 0.03]], 0.012)); for (let i = 0; i < 9; i++) parts.push(beam("巢室垂直草茎", "#c5ba94", [Math.sin(i) * 0.08, 0.05, Math.cos(i) * 0.08], [Math.sin(i) * 0.14, 0.39, Math.cos(i) * 0.14], 0.006)); }
  else if (kind === 2) { parts.push(cup("家燕半杯状泥巢", 0.18, 0.15, true)); for (let i = 0; i < 20; i++) { const a = i / 19 * Math.PI; parts.push(lobe("巢壁泥丸", "#c1b79b", [Math.cos(a) * 0.15, 0.04 + i % 3 * 0.034, Math.sin(a) * 0.15], [0.045, 0.035, 0.04])); } }
  else if (kind === 3) { const shell = sweptProfile("毛脚燕封闭半球泥巢", mud, [[0, 0], [0.15, 0.04], [0.19, 0.15], [0.16, 0.28], [0.06, 0.34], [0.05, 0.33], [0.145, 0.26], [0.17, 0.15], [0.13, 0.06], [0, 0.02]], Math.PI); parts.push(shell, tube("巢口突出的短泥唇", "#c4ba9d", [[-0.04, 0.32, 0], [0, 0.31, 0.04], [0.04, 0.32, 0]], 0.014)); }
  else if (kind === 4) { parts.push(sweptProfile("灶鸟厚壁泥烤炉巢", "#b5a487", [[0, 0], [0.22, 0], [0.28, 0.17], [0.22, 0.36], [0, 0.41], [0, 0.38], [0.19, 0.33], [0.24, 0.17], [0.19, 0.03], [0, 0.03]], Math.PI * 1.7), part("巢室内弯曲隔墙", "box", "#c1b295", [0.06, 0.17, -0.04], [0.025, 0.28, 0.25], [0, 30, 0]), cap("隔墙后育雏草垫", straw, [-0.09, 0.025, 0.05], 0.1, 0.03, 2)); }
  else if (kind === 5) { for (const side of [-1, 1]) parts.push(leaf("裁缝鸟卷合阔叶", leafColor, [side * 0.045, 0, 0], 0.18, 0.34, [0, side * 20, -side * 15])); for (let i = 0; i < 8; i++) parts.push(beam("缝合叶缘的纤维横线", "#d6d2b4", [-0.025, 0.045 + i * 0.032, 0.018], [0.025, 0.045 + i * 0.032, 0.018], 0.002)); parts.push(cap("叶袋内巢杯", straw, [0, 0.06, 0], 0.065, 0.12, 3)); }
  else if (kind === 6) { for (let segment = 0; segment < 5; segment++) { parts.push(part("切叶蜂卷叶育幼囊", "lathe", leafColor, [0, segment * 0.05, 0], [1, 1, 1], [0, 0, 0], { profile: [{ x: 0, y: 0 }, { x: 0.035, y: 0 }, { x: 0.035, y: 0.055 }, { x: 0.03, y: 0.055 }, { x: 0.03, y: 0.005 }, { x: 0, y: 0.005 }] }), part("叶片圆形封盖", "cylinder", "#c0c89f", [0, segment * 0.05 + 0.05, 0], [0.063, 0.002, 0.063])); } }
  else if (kind === 7) { parts.push(part("壁蜂空心芦苇管", "lathe", "#c2b993", [0, 0, 0], [1, 1, 1], [0, 0, 0], { profile: [{ x: 0.026, y: 0 }, { x: 0.03, y: 0 }, { x: 0.03, y: 0.35 }, { x: 0.026, y: 0.35 }, { x: 0.026, y: 0 }] })); for (let i = 0; i < 5; i++) parts.push(part("泥质育幼室隔板", "cylinder", mud, [0, 0.03 + i * 0.06, 0], [0.052, 0.007, 0.052])); }
  else if (kind === 8) parts.push(part("蜾蠃陶壶状泥巢", "lathe", mud, [0, 0, 0], [1, 1, 1], [0, 0, 0], { profile: [{ x: 0, y: 0 }, { x: 0.06, y: 0.015 }, { x: 0.075, y: 0.07 }, { x: 0.04, y: 0.13 }, { x: 0.02, y: 0.16 }, { x: 0.03, y: 0.18 }, { x: 0.024, y: 0.18 }, { x: 0.014, y: 0.16 }, { x: 0.034, y: 0.13 }, { x: 0.066, y: 0.07 }, { x: 0.052, y: 0.02 }, { x: 0, y: 0.01 }] }));
  else if (kind === 9) { parts.push(beam("长脚胡蜂单根巢柄", "#aaa180", [0, 0.1, 0], [0, 0.24, 0], 0.008)); for (let row = 0; row < 3; row++) for (let i = 0; i < 5 - Math.abs(row - 1); i++) parts.push(hexRing([(i - 1.5 - (row === 1 ? 0.5 : 0)) * 0.027, 0, (row - 1) * 0.024], 0.016, 0.09 + i % 2 * 0.01)); }
  else if (kind === 10) { parts.push(lobe("白蚁丘共同土丘基座", "#b6a78b", [0, 0.18, 0], [1.8, 0.36, 1.5])); for (let i = 0; i < 7; i++) { const a = i * 2.4; const p: Triple = [Math.cos(a) * 0.45, 0.1, Math.sin(a) * 0.4]; parts.push(tapered("通气泥土烟囱脊", "#c1b398", [p, [p[0] * 0.8, 0.8 + i % 3 * 0.2, p[2] * 0.8], [p[0] * 0.5, 1.5 + i % 3 * 0.25, p[2] * 0.5]], [0.25, 0.14, 0.025])); } }
  else if (kind === 11) {
    const centers: [number, number][] = [[-0.28, -0.23], [0, -0.23], [0.28, -0.23], [0.28, 0], [0, 0], [-0.28, 0], [-0.28, 0.23], [0, 0.23], [0.28, 0.23]];
    const path: { x: number; z: number; r: number }[] = [];
    for (let i = 0; i < centers.length - 1; i++) for (let j = 0; j < 4; j++) { const t = j / 4; const a = centers[i]!, b = centers[i + 1]!; path.push({ x: a[0] + (b[0] - a[0]) * t, z: a[1] + (b[1] - a[1]) * t, r: 0.016 + 0.044 * Math.cos(t * Math.PI) ** 2 }); }
    path.push({ x: 0.28, z: 0.23, r: 0.06 });
    const edge = (side: number): [number, number][] => path.map((p, i) => { const a = path[Math.max(0, i - 1)]!, b = path[Math.min(path.length - 1, i + 1)]!; const length = Math.hypot(b.x - a.x, b.z - a.z); return [p.x - (b.z - a.z) / length * p.r * side, p.z + (b.x - a.x) / length * p.r * side]; });
    const soil = polygon("具有贯通巢室与相连通道的土层剖面", "#b9aa89", [[-0.45, -0.35], [0.45, -0.35], [0.45, 0.35], [-0.45, 0.35]], 0.08, [0, 0.35, 0], [[...edge(1), ...edge(-1).reverse()]]);
    soil.rotation.x = 90; parts.push(soil);
  }
  else if (kind === 12 || kind === 13) { const beams: ModelPart[] = []; for (let i = 0; i < 35; i++) { const a = i * 2.4; const r = kind === 12 ? 0.8 : 1; const p: Triple = kind === 12 ? [Math.cos(a) * r, 0.03 + i % 5 * 0.1, Math.sin(a) * r] : [(i % 7 - 3) * 0.3, 0.04 + Math.floor(i / 7) * 0.14, Math.sin(a) * 0.28]; const q: Triple = kind === 12 ? [Math.cos(a + 2) * r, 0.1 + i % 5 * 0.12, Math.sin(a + 2) * r] : [p[0] + Math.cos(a) * 0.7, p[1] + 0.1, p[2] + Math.sin(a) * 0.35]; beams.push(beam("交锁啃断木枝", "#a79878", p, q, 0.055)); } parts.push(...beams); if (kind === 12) parts.push(cap("海狸巢内部土草室", "#b8b08d", [0, 0.1, 0], 0.55, 0.5, 3)); else parts.push(beam("坝体横向骨干木", "#b9aa89", [-1.1, 0.12, 0.03], [1.1, 0.12, 0.03], 0.14)); }
  else if (kind === 14) { for (const side of [-1, 1]) for (let i = 0; i < 18; i++) parts.push(beam("园丁鸟并列展示墙枝", "#b6ab89", [side * 0.22, 0, (i - 8.5) * 0.035], [side * (0.16 + i % 3 * 0.025), 0.45 + i % 4 * 0.04, (i - 8.5) * 0.035], 0.009)); parts.push(part("展示通道草垫", "box", "#c3bb96", [0, 0.01, 0], [0.4, 0.02, 0.72])); }
  else if (kind === 15) { parts.push(tapered("园丁鸟展示中央枝柱", "#a69a7b", [[0, 0, 0], [0.04, 0.8, 0]], [0.025, 0.015])); for (let i = 0; i < 30; i++) { const a = i * Math.PI / 15; parts.push(beam("围绕枝柱编排的锥形枝塔", "#beb28f", [Math.cos(a) * 0.28, 0.02, Math.sin(a) * 0.28], [Math.cos(a) * 0.03, 0.6, Math.sin(a) * 0.03], 0.009)); } }
  else if (kind === 16) { parts.push(part("石蛾幼虫贯通管巢", "lathe", "#9baa91", [0, 0.035, 0], [1, 1, 1], [90, 0, 0], { profile: [{ x: 0.018, y: -0.09 }, { x: 0.026, y: -0.09 }, { x: 0.031, y: 0.09 }, { x: 0.022, y: 0.09 }, { x: 0.018, y: -0.09 }] })); for (let i = 0; i < 24; i++) { const a = i * 2.4; parts.push(lobe("胶接细砾石", "#b9bba0", [Math.cos(a) * 0.027, 0.035 + Math.sin(a) * 0.027, -0.075 + i % 8 * 0.022], [0.018, 0.015, 0.022])); } }
  else if (kind === 17) { parts.push(cap("蓑蛾幼虫丝质纺锤囊", "#a8a684", [0, 0, 0], 0.035, 0.2, 5)); for (let i = 0; i < 22; i++) { const a = i * 2.4; const p: Triple = [Math.cos(a) * 0.027, 0.015 + i % 6 * 0.026, Math.sin(a) * 0.027]; parts.push(beam("纵向覆贴小枯枝", "#bbad8a", p, [p[0], p[1] + 0.07, p[2]], 0.006)); } }
  else if (kind === 18) { parts.push(lobe("螳螂泡沫状卵鞘本体", "#c6ba99", [0, 0.035, 0], [0.1, 0.07, 0.14])); for (let i = 0; i < 12; i++) parts.push(beam("卵鞘密排蜂窝隔棱", "#d6caaa", [-0.035, 0.06, -0.055 + i * 0.01], [0.035, 0.06, -0.055 + i * 0.01], 0.006)); parts.push(beam("卵鞘附着枯枝", "#aa9c7a", [0, 0, -0.12], [0, 0, 0.13], 0.014)); }
  else { for (let i = 0; i < 16; i++) { const a = i * Math.PI / 8; parts.push(beam("圆网放射辐丝", "#d0d7bf", [0, 0.28, 0], [Math.cos(a) * 0.3, 0.28 + Math.sin(a) * 0.3, 0], 0.001)); } parts.push(tube("连续螺旋捕捉丝", "#d8ddca", Array.from({ length: 64 }, (_, i) => { const a = i * Math.PI / 4; const r = 0.008 + i / 63 * 0.28; return [Math.cos(a) * r, 0.28 + Math.sin(a) * r, 0] as Triple; }), 0.001)); }
  return parts;
}

const names = [["weaverNest", "织布鸟瓶状巢"], ["orioleNest", "黄鹂兜状吊巢"], ["swallowNest", "家燕半杯泥巢"], ["houseMartinNest", "毛脚燕封闭泥巢"], ["ovenbirdNest", "灶鸟炉状巢"], ["tailorbirdNest", "裁缝鸟缝叶巢"], ["leafCutterBeeNest", "切叶蜂卷叶巢"], ["masonBeeNest", "壁蜂泥隔管巢"], ["potterWaspNest", "蜾蠃陶壶泥巢"], ["paperWaspNest", "长脚胡蜂开放巢盘"], ["termiteMound", "白蚁丘"], ["antColony", "蚁巢"], ["beaverLodge", "海狸巢屋"], ["beaverDam", "海狸坝"], ["bowerbirdAvenue", "园丁鸟双墙展示道"], ["bowerbirdMaypole", "园丁鸟枝塔"], ["caddisflyCase", "石蛾幼虫砾石管巢"], ["bagwormCase", "蓑蛾枯枝囊"], ["mantisOotheca", "螳螂卵鞘"], ["spiderOrbWeb", "蜘蛛圆网"]];

export const nestDesigns: MasterNatureDesign[] = names.map(([key, name], index) => design(key!, name!, "器物", () => nest(index), ["动物巢与栖居构造"]));
