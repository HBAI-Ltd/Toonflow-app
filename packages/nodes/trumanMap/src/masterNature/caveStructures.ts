import { combineMeshes, design, lobe, polygon } from "./shared";
import type { MasterNatureDesign, ModelPart, Triple } from "./shared";
import { pointed } from "./insectForms";
import { hollowPipe, strip } from "./shapedFoods";
import { gillWall } from "./hymeniumFungi";

const calcite = "#c8c7ae";
const bright = "#d4d0b9";
const rock = "#a0a58f";

function sodaStraw(): ModelPart[] {
  const tube = hollowPipe("鹅管钟乳石直径近乎不变且从顶到底真正贯通的薄壁管", [[0, 0, 0], [0.0007, 0.32, 0.0002], [0, 0.68, 0]], 0.0035, 0.0026); tube.color = calcite;
  return [tube, lobe("鹅管在洞顶滴水裂隙处相接的小片钙质基底", rock, [0, 0.684, 0], [0.028, 0.016, 0.025])];
}

function helictite(): ModelPart[] {
  const paths: Triple[][] = [[[0, 0.006, 0], [0, 0.033, 0], [0.021, 0.047, 0.001], [0.034, 0.032, 0.004], [0.029, 0.018, 0.012], [0.019, 0.026, 0.024]], [[0.003, 0.038, 0], [-0.018, 0.054, 0.003], [-0.028, 0.043, 0.018], [-0.016, 0.035, 0.032], [0, 0.042, 0.036]], [[-0.016, 0.053, 0.003], [-0.026, 0.078, -0.003], [-0.01, 0.091, -0.012], [0.006, 0.083, -0.015]], [[0.025, 0.043, 0.003], [0.047, 0.062, -0.009], [0.051, 0.08, -0.019], [0.038, 0.09, -0.022]], [[0, 0.029, 0], [-0.006, 0.044, -0.026], [0.008, 0.062, -0.04], [0.019, 0.057, -0.037]]], parts: ModelPart[] = [lobe("偏心石在母岩上相连的钙质生长基底", rock, [0, 0.006, 0], [0.042, 0.012, 0.037])];
  for (const path of paths) { const p = hollowPipe("偏心石逆重力转向且内部保留真实毛细水道的弯管", path, 0.0025, 0.0003); p.color = bright; parts.push(p); } return parts;
}

function frostwork(): ModelPart[] {
  const parts: ModelPart[] = [lobe("霜状石文石针簇共用的钙质小结核", calcite, [0, 0.008, 0], [0.035, 0.016, 0.032])], needles: ModelPart[] = [];
  for (let branch = 0; branch < 7; branch++) { const a = branch * 2.4, root: Triple = [Math.cos(a) * 0.009, 0.01, Math.sin(a) * 0.009], tip: Triple = [Math.cos(a) * 0.035, 0.035 + branch % 3 * 0.017, Math.sin(a) * 0.035]; parts.push(pointed("霜状石从同一结核发出的细长主晶针", bright, [root, tip], [0.0018, 0]));
    for (let i = 1; i <= 8; i++) { const t = i / 10, p: Triple = [root[0] + (tip[0] - root[0]) * t, root[1] + (tip[1] - root[1]) * t, root[2] + (tip[2] - root[2]) * t]; for (const side of [-1, 1]) needles.push(pointed("霜状石主针侧面真实分枝的放射状文石细晶", bright, [p, [p[0] + Math.cos(a + side) * (0.017 - t * 0.01), p[1] + 0.012 * (1 - t * 0.5), p[2] + Math.sin(a + side) * (0.017 - t * 0.01)]], [0.0005, 0])); }
  }
  for (let i = 0; i < needles.length; i += 25) parts.push(combineMeshes("霜状石彼此分开的文石刺针分枝", bright, needles.slice(i, i + 25))); return parts;
}

function caveShield(): ModelPart[] {
  const outline: [number, number][] = Array.from({ length: 40 }, (_, i) => { const a = i * Math.PI / 20, r = 1 + Math.sin(a * 5) * 0.025; return [Math.cos(a) * 0.25 * r, Math.sin(a) * 0.225 * r]; }), parts: ModelPart[] = [lobe("石盾在洞壁裂隙处相接的实体母岩", rock, [0, 0.17, -0.069], [0.17, 0.34, 0.17])];
  for (const z of [-0.0123, 0.0003]) { const p = polygon("石盾两片相对平行而中央真正留毛细狭缝的钙质圆板", calcite, outline, 0.012, [0, 0.35, z]); p.rotation.x = 90; parts.push(p); }
  for (let i = 0; i < 9; i++) { const x = (i - 4) * 0.038, edgeY = 0.35 - Math.sqrt(1 - (x / 0.25) ** 2) * 0.225, path: Triple[] = [[x, edgeY + 0.009, 0.009], [x + 0.003, edgeY - 0.045, 0.01], [x + 0.004, edgeY - 0.095 + i % 3 * 0.015, 0.013]], p = hollowPipe("石盾下缘由板间渗水形成且中空的小滴管", path, 0.0045, 0.002); p.color = bright; parts.push(p); } return parts;
}

function boxwork(): ModelPart[] {
  const base = polygon("箱状网脉仍相连的残余母岩板", rock, [[-0.33, -0.23], [-0.32, 0.23], [0.34, 0.22], [0.33, -0.23]], 0.03), parts: ModelPart[] = [base], fins: ModelPart[] = [], nodes: Triple[][] = Array.from({ length: 5 }, (_, row) => Array.from({ length: 6 }, (_, col) => [-0.30 + col * 0.12 + Math.sin(row * 2 + col) * 0.012, 0.23 + Math.sin(row + col * 1.4) * 0.065, -0.2 + row * 0.1 + Math.cos(row * 1.7 + col) * 0.013]));
  for (let row = 0; row < 5; row++) for (let col = 0; col < 6; col++) for (const along of [false, true]) { if (along ? row === 4 : col === 5) continue; const a = nodes[row]![col]!, b = along ? nodes[row + 1]![col]! : nodes[row]![col + 1]!, p = gillWall("箱状网脉沿原裂缝延伸且两侧真正空出的薄方解石脉板", bright, [a, b], 0.004, 0.23); p.vertices = p.vertices!.map((v, index) => ({ ...v, y: index % 4 >= 2 ? 0.023 : v.y })); fins.push(p); }
  for (let i = 0; i < fins.length; i += 25) parts.push(combineMeshes("箱状网脉母岩溶失后保留的连续交错晶质薄鳍网络", bright, fins.slice(i, i + 25))); return parts;
}

function flowstone(): ModelPart[] {
  const parts: ModelPart[] = [polygon("流石瀑布底部相连的钙质趾缘底板", rock, [[-0.43, -0.05], [-0.44, 0.21], [0.45, 0.23], [0.43, -0.04]], 0.035)];
  for (let channel = 0; channel < 9; channel++) { const x = (channel - 4) * 0.093, bend = Math.sin(channel * 1.1) * 0.032, path: Triple[] = [[x, 1.16, 0], [x + bend, 0.98, 0.024], [x + bend * 0.7, 0.8, 0.058], [x - bend * 0.2, 0.67, 0.07], [x - bend * 0.4, 0.5, 0.12], [x + bend * 0.1, 0.34, 0.14], [x, 0.16, 0.18], [x, 0.04, 0.2]]; parts.push(strip("流石瀑布连续流下并互相搭接的宽厚钙质叠流层", channel % 3 ? calcite : bright, path, 0.112, 0.035)); }
  return parts;
}

function calciteRaft(): ModelPart[] {
  const outline: [number, number][] = [[-0.085, -0.025], [-0.061, -0.067], [-0.019, -0.081], [0.012, -0.069], [0.056, -0.075], [0.083, -0.032], [0.071, 0.013], [0.082, 0.042], [0.036, 0.067], [-0.004, 0.059], [-0.048, 0.073], [-0.08, 0.038]], parts: ModelPart[] = [polygon("方解石漂筏在水面长成的连续薄片与不规则破缘", calcite, outline, 0.0028, [0, 0.025, 0])], crystals: ModelPart[] = [];
  for (let i = 0; i < 34; i++) { const a = i * 2.4, r = Math.sqrt(i / 34) * 0.06, p: Triple = [Math.cos(a) * r, 0.0256, Math.sin(a) * r], end: Triple = [p[0] + Math.cos(a) * 0.004, 0.004 + i % 4 * 0.003, p[2] + Math.sin(a) * 0.004]; crystals.push(pointed("方解石漂筏下表面自然向下生长的独立短晶齿", bright, [p, end], [0.0024, 0])); }
  for (let i = 0; i < crystals.length; i += 25) parts.push(combineMeshes("方解石漂筏真实薄片下面相连的晶质底齿", bright, crystals.slice(i, i + 25))); return parts;
}

export const caveStructureDesigns: MasterNatureDesign[] = [
  design("sodaStraw", "鹅管钟乳石", "岩石", sodaStraw, ["Soda straw", "近恒定直径薄管与真实贯通水道"]),
  design("helictite", "偏心石", "岩石", helictite, ["Helictite", "多向弯曲分枝和真实毛细内腔"]),
  design("frostwork", "霜状石", "岩石", frostwork, ["Frostwork", "结核上真实分枝的文石针簇"]),
  design("caveShield", "洞穴石盾", "岩石", caveShield, ["Cave shield", "相对平行圆板板间真狭缝与缘滴管"]),
  design("calciteBoxwork", "箱状方解石网脉", "岩石", boxwork, ["Calcite boxwork", "母岩溶失后真实空出的交错晶质薄鳍网"]),
  design("flowstone", "洞穴流石瀑布", "岩石", flowstone, ["Flowstone cascade", "连续搭接的厚叠流层与底趾缘"]),
  design("calciteRaft", "方解石漂筏", "岩石", calciteRaft, ["Calcite raft", "不规则水面薄片及真实底面晶齿"]),
];
