import { Euler, Matrix4, Vector3 } from "three";
import { combineMeshes, design, leaf, lobe, needle, petals, polygon, tapered } from "./shared";
import type { MasterNatureDesign, ModelPart, Triple } from "./shared";
import { flatLeaf } from "./ediblePlants";
import { smallCorolla } from "./gardenPerennials";

const green = "#879b75";
const pale = "#afbc93";
const fertile = "#a89876";
const cream = "#d7d3b8";
const bloom = "#baabba";

export function radialBlade(name: string, color: string, root: Triple, width: number, length: number, tilt: number, heading: number): ModelPart {
  const a = heading * Math.PI / 180, t = tilt * Math.PI / 180;
  const across = new Vector3(-Math.sin(a), 0, Math.cos(a));
  const axis = new Vector3(Math.cos(a) * Math.sin(t), Math.cos(t), Math.sin(a) * Math.sin(t));
  const rotation = new Euler().setFromRotationMatrix(new Matrix4().makeBasis(across, axis, new Vector3().crossVectors(across, axis)));
  const value = leaf(name, color, root, width, length);
  value.rotation = { x: rotation.x * 180 / Math.PI, y: rotation.y * 180 / Math.PI, z: rotation.z * 180 / Math.PI };
  return value;
}

// 形态依据植物志；造型为原创简化，不包含照片或下载网格。
// https://tai2.ntu.edu.tw/species/108%20001%2004%200
// https://plantnet.rbgsyd.nsw.gov.au/cgi-bin/NSWfl.pl?lvl=sp&name=Botrychium~lunaria&page=nswfl
// https://apps.lucidcentral.org/ferns/text/entities/huperzia_serrata.htm
// https://www.iplant.cn/frps/pdf/6%283%29/221a.pdf

function adderTongue(): ModelPart[] {
  const base: Triple = [0, 0.075, 0];
  const parts: ModelPart[] = [tapered("瓶尔小草单一总柄", pale, [[0, 0, 0], base], [0.0018, 0.0013]), flatLeaf("瓶尔小草没有羽裂的单片椭圆营养叶", base, [0.012, 0.12, 0.054], 0.033, "oval", 0.0006), tapered("从营养叶基部长出的独立孢子穗柄", pale, [base, [0, 0.178, 0]], [0.001, 0.0006])];
  const sporangia: ModelPart[] = [];
  for (let i = 0; i < 16; i++) for (const side of [-1, 1]) sporangia.push(lobe("孢子穗两侧沉入轴边的成对孢子囊", pale, [side * 0.0007, 0.147 + i * 0.0018, 0], [0.0011, 0.0021, 0.0014]));
  parts.push(combineMeshes("瓶尔小草两列而非分枝的孢子穗", pale, sporangia));
  return parts;
}

function moonwort(): ModelPart[] {
  const parts: ModelPart[] = [tapered("扇羽阴地蕨总柄与直立孢子叶轴", pale, [[0, 0, 0], [0, 0.075, 0], [0.003, 0.156, 0]], [0.0018, 0.0012, 0.0005])];
  const blades: ModelPart[] = [];
  const fan: [number, number][] = [[0, 0], [-0.44, 0.46], [-0.5, 0.75], [-0.3, 0.94], [0, 1], [0.3, 0.94], [0.5, 0.75], [0.44, 0.46]];
  for (let node = 0; node < 5; node++) for (const side of [-1, 1]) {
    const y = 0.065 + node * 0.009, length = 0.018 - node * 0.0015;
    blades.push(flatLeaf("营养叶成对的半圆扇形羽片", [0, y, 0.002], [side * length, y + 0.007, 0.006], length * 0.9, fan, 0.0005));
  }
  parts.push(combineMeshes("阴地蕨一回羽状而非完整单叶的营养叶", green, blades));
  for (let node = 0; node < 4; node++) for (const side of [-1, 1]) {
    const y = 0.116 + node * 0.01, end: Triple = [side * (0.017 - node * 0.003), y + 0.013, 0];
    const capsules: ModelPart[] = [needle("孢子叶上的独立短分枝", pale, [0.001, y, 0], end, 0.0006)];
    for (let i = 0; i < 5; i++) { const t = (i + 1) / 5; capsules.push(lobe("短分枝上真正独立的无柄孢子囊", fertile, [0.001 + (end[0] - 0.001) * t, y + 0.013 * t, (i % 2 ? 1 : -1) * 0.0011], [0.0019, 0.002, 0.0019])); }
    parts.push(combineMeshes("扇羽阴地蕨葡萄状分枝孢子群", fertile, capsules));
  }
  return parts;
}

function royalFern(): ModelPart[] {
  const parts: ModelPart[] = [];
  for (let frond = 0; frond < 4; frond++) {
    const a = frond * Math.PI / 2, height = 0.62 + frond % 2 * 0.12;
    const tip: Triple = [Math.cos(a) * 0.27, height, Math.sin(a) * 0.27];
    parts.push(tapered("紫萁营养叶直立后斜展的总叶轴", pale, [[0, 0, 0], [tip[0] * 0.38, height * 0.5, tip[2] * 0.38], tip], [0.006, 0.004, 0.001]));
    for (let node = 0; node < 4; node++) for (const side of [-1, 1]) {
      const t = 0.38 + node * 0.145, root: Triple = [tip[0] * (t < 0.5 ? t * 0.76 : 0.38 + (t - 0.5) * 1.24), height * t, tip[2] * (t < 0.5 ? t * 0.76 : 0.38 + (t - 0.5) * 1.24)];
      const direction = a + side * 1.15, length = 0.19 - node * 0.027;
      const end: Triple = [root[0] + Math.cos(direction) * length, root[1] + 0.065, root[2] + Math.sin(direction) * length];
      const pieces: ModelPart[] = [needle("紫萁第一回羽片的承托羽轴", pale, root, end, 0.0018)];
      for (let leaflet = 0; leaflet < 4; leaflet++) for (const edge of [-1, 1]) {
        const u = 0.16 + leaflet * 0.2, start: Triple = [root[0] + (end[0] - root[0]) * u, root[1] + 0.065 * u, root[2] + (end[2] - root[2]) * u];
        const b = direction + edge * 1.15, span = 0.06 - leaflet * 0.008;
        pieces.push(flatLeaf("紫萁第二回分离的阔披针小羽片", start, [start[0] + Math.cos(b) * span, start[1] + 0.012, start[2] + Math.sin(b) * span], 0.018 - leaflet * 0.0015, "oval", 0.0006));
      }
      parts.push(combineMeshes("紫萁一片具有二回分枝的完整侧羽片", green, pieces));
    }
  }
  for (const side of [-1, 1]) {
    const top: Triple = [side * 0.035, 0.65, 0];
    parts.push(tapered("紫萁独立于宽营养叶的狭缩孢子叶", fertile, [[0, 0.004, 0], top], [0.0038, 0.001]));
    const pieces: ModelPart[] = [];
    for (let i = 0; i < 10; i++) for (const direction of [-1, 1]) {
      const y = 0.39 + i * 0.023, x = top[0] * y / top[1], end: Triple = [x + direction * (0.05 - i * 0.003), y + 0.009, 0];
      pieces.push(needle("紫萁孢子叶细长而不具叶肉的小羽轴", fertile, [x, y, 0], end, 0.0026));
      for (let j = 0; j < 3; j++) pieces.push(lobe("狭缩孢子轴上成簇的孢子囊", fertile, [x + (end[0] - x) * (0.3 + j * 0.25), y + 0.009 * (0.3 + j * 0.25), 0], [0.005, 0.005, 0.005]));
    }
    for (let i = 0; i < pieces.length; i += 24) parts.push(combineMeshes("紫萁不带宽叶肉的二型孢子叶枝群", fertile, pieces.slice(i, i + 24)));
  }
  return parts;
}

function ostrichFern(): ModelPart[] {
  const parts: ModelPart[] = [];
  for (let frond = 0; frond < 5; frond++) {
    const a = frond * Math.PI * 0.4, height = 0.95 + frond % 2 * 0.12, tip: Triple = [Math.cos(a) * 0.4, height, Math.sin(a) * 0.4];
    parts.push(tapered("荚果蕨漏斗状叶丛的长营养叶轴", pale, [[0, 0, 0], [tip[0] * 0.24, height * 0.5, tip[2] * 0.24], tip], [0.005, 0.003, 0.0008]));
    const pieces: ModelPart[] = [];
    for (let node = 0; node < 16; node++) for (const side of [-1, 1]) {
      const t = 0.12 + node * 0.053, f = t < 0.5 ? t * 0.48 : 0.24 + (t - 0.5) * 1.52;
      const root: Triple = [tip[0] * f, height * t, tip[2] * f], b = a + side * 1.23, span = Math.sin(t * Math.PI) * 0.155 * Math.min(1, t * 3.4);
      pieces.push(flatLeaf("荚果蕨向基部逐渐缩短的深裂羽片", root, [root[0] + Math.cos(b) * span, root[1] + 0.018, root[2] + Math.sin(b) * span], 0.023, "lobed", 0.0005));
    }
    for (let i = 0; i < pieces.length; i += 12) parts.push(combineMeshes("荚果蕨一回羽状深裂的鸵羽形叶片", green, pieces.slice(i, i + 12)));
  }
  for (const side of [-1, 1]) {
    const x = side * 0.025, pieces: ModelPart[] = [];
    parts.push(tapered("荚果蕨中央短于营养叶的直立孢子叶轴", fertile, [[0, 0.005, 0], [x, 0.48, 0]], [0.0035, 0.001]));
    for (let node = 0; node < 14; node++) for (const edge of [-1, 1]) {
      const y = 0.18 + node * 0.02, width = Math.sin((node + 2) / 17 * Math.PI) * 0.033;
      pieces.push(lobe("荚果蕨强烈内卷而呈串珠状的孢子羽片", fertile, [x * y / 0.48 + edge * width * 0.5, y, 0], [width, 0.008, 0.008]));
    }
    parts.push(combineMeshes("荚果蕨中部褐色串珠孢子叶", fertile, pieces));
  }
  return parts;
}

function hartTongue(): ModelPart[] {
  const parts: ModelPart[] = [];
  const outline: [number, number][] = [[0, 0.035], [-0.25, -0.055], [-0.5, 0.035], [-0.45, 0.2], [-0.5, 0.4], [-0.44, 0.6], [-0.4, 0.8], [0, 1], [0.4, 0.8], [0.44, 0.6], [0.5, 0.4], [0.45, 0.2], [0.5, 0.035], [0.25, -0.055]];
  for (let i = 0; i < 7; i++) {
    const a = i * 2.4, length = 0.28 + i % 3 * 0.05, root: Triple = [Math.cos(a) * 0.025, 0.055, Math.sin(a) * 0.025], end: Triple = [Math.cos(a) * length * 0.72, 0.055 + length * 0.69, Math.sin(a) * length * 0.72];
    parts.push(tapered("鹿舌蕨叶丛下部独立短叶柄", fertile, [[0, 0, 0], root], [0.003, 0.002]), flatLeaf("鹿舌蕨全缘心基的长舌状单叶", root, end, 0.065, outline, 0.001));
    const sori: ModelPart[] = [];
    for (let node = 0; node < 7; node++) for (const side of [-1, 1]) {
      const t = 0.23 + node * 0.085, start: Triple = [root[0] + (end[0] - root[0]) * t, root[1] + (end[1] - root[1]) * t - 0.001, root[2] + (end[2] - root[2]) * t];
      const across = side * 0.022;
      sori.push(needle("叶片背面成对斜列的长条孢子囊群", fertile, start, [start[0] + Math.sin(a) * across + Math.cos(a) * 0.009, start[1] + 0.009, start[2] - Math.cos(a) * across + Math.sin(a) * 0.009], 0.0012));
    }
    parts.push(combineMeshes("鹿舌蕨真实凸起的背面线形孢子囊群", fertile, sori));
  }
  return parts;
}

function climbingFern(): ModelPart[] {
  const path: Triple[] = Array.from({ length: 15 }, (_, i) => { const a = i * 0.57, radius = Math.sin(i / 14 * Math.PI) * 0.075; return [Math.cos(a) * radius, i * 0.07, Math.sin(a) * radius]; });
  const parts: ModelPart[] = [tapered("海金沙继续延伸并缠绕的无限生长叶轴", pale, path, path.map((_, i) => 0.0026 - i * 0.00013))];
  for (let node = 1; node < 13; node++) {
    const p = path[node]!, a = node * 2.4, sideEnd: Triple = [p[0] + Math.cos(a) * 0.16, p[1] + 0.045, p[2] + Math.sin(a) * 0.16], pieces: ModelPart[] = [needle("海金沙总叶轴上向两侧伸出的羽片轴", pale, p, sideEnd, 0.001)];
    for (let tier = 0; tier < 3; tier++) for (const side of [-1, 1]) {
      const t = 0.18 + tier * 0.24, root: Triple = [p[0] + (sideEnd[0] - p[0]) * t, p[1] + 0.045 * t, p[2] + (sideEnd[2] - p[2]) * t], b = a + side * 1.1;
      pieces.push(flatLeaf("海金沙具有长中裂片的掌状分裂小羽片", root, [root[0] + Math.cos(b) * 0.052, root[1] + 0.012, root[2] + Math.sin(b) * 0.052], 0.033, "palm", 0.0005));
    }
    parts.push(combineMeshes("海金沙缠绕叶轴上独立的三角形复羽片", green, pieces));
  }
  return parts;
}

function quillwort(): ModelPart[] {
  const parts: ModelPart[] = [-1, 1].map(side => lobe("中华水韭二裂的肉质球状根茎", fertile, [side * 0.004, 0.005, 0], [0.014, 0.011, 0.016]));
  const capsules: ModelPart[] = [];
  for (let i = 0; i < 22; i++) {
    const a = i * 2.4, length = 0.17 + i % 6 * 0.017, radius = 0.08;
    const holes: [number, number][][] = [];
    for (const x of [-1, 1]) for (const z of [-1, 1]) holes.push(Array.from({ length: 4 }, (_, j) => { const b = Math.PI / 4 + j * Math.PI / 2; return [x * 0.029 + Math.cos(b) * 0.023, z * 0.029 + Math.sin(b) * 0.023]; }));
    const p = polygon("中华水韭具有四条真实纵行气道的锥细线叶", green, Array.from({ length: 12 }, (_, j) => [Math.cos(j * Math.PI / 6) * radius, Math.sin(j * Math.PI / 6) * radius]), 1, [Math.cos(a) * 0.006, 0.009, Math.sin(a) * 0.006], holes);
    // ACT: 毫米气道以厘米局部单位建模后等比回米，保留孔盖三角与真实叶宽。
    p.vertices = p.vertices!.map(v => ({ x: v.x * (1 - v.y * 0.9) + Math.cos(a) * v.y * 4.8, y: v.y * length * 100, z: v.z * (1 - v.y * 0.9) + Math.sin(a) * v.y * 4.8 }));
    p.scale = { x: 0.01, y: 0.01, z: 0.01 };
    parts.push(p);
    capsules.push(lobe("线叶宽鞘基部各自独立的孢子囊", pale, [Math.cos(a) * 0.006, 0.013, Math.sin(a) * 0.006], [0.003, 0.008, 0.002]));
  }
  parts.push(combineMeshes("中华水韭叶鞘内的基生孢子囊环", pale, capsules));
  return parts;
}

function toothedClubmoss(): ModelPart[] {
  const parts: ModelPart[] = [], blades: ModelPart[] = [];
  const tooth: [number, number][] = [[0, 0], [-0.24, 0.25], [-0.45, 0.5], [-0.32, 0.52], [-0.5, 0.69], [-0.3, 0.69], [-0.34, 0.85], [0, 1], [0.34, 0.85], [0.3, 0.69], [0.5, 0.69], [0.32, 0.52], [0.45, 0.5], [0.24, 0.25]];
  const branches: Triple[][] = [[[0, 0, 0], [0, 0.12, 0], [-0.035, 0.24, 0.005]], [[0, 0.12, 0], [0.04, 0.25, 0.01]]];
  for (const path of branches) {
    parts.push(tapered("蛇足石杉二叉分枝而不形成顶端孢子棒的茎", pale, path, path.map((_, i) => 0.0035 - i * 0.0008)));
    for (let node = 0; node < 16; node++) {
      const t = (node + 1) / 17, segment = Math.min(path.length - 2, Math.floor(t * (path.length - 1))), u = t * (path.length - 1) - segment, start = path[segment]!, end = path[segment + 1]!;
      const root: Triple = start.map((v, axis) => v + (end[axis]! - v) * u) as Triple;
      for (let whorl = 0; whorl < 3; whorl++) {
        const a = whorl * Math.PI * 2 / 3 + node * 0.5, span = 0.019 - node % 3 * 0.002;
        blades.push(flatLeaf("蛇足石杉三枚近轮生且上半部有锯齿的小叶", root, [root[0] + Math.cos(a) * span, root[1] + 0.003, root[2] + Math.sin(a) * span], 0.0035, tooth, 0.00035));
      }
    }
  }
  for (let i = 0; i < blades.length; i += 16) parts.push(combineMeshes("蛇足石杉连续螺旋轮生的真实齿叶", green, blades.slice(i, i + 16)));
  const sporangia: ModelPart[] = [];
  for (let i = 0; i < 12; i++) { const a = i * 2.4, y = 0.15 + i % 6 * 0.012, x = (y - 0.12) / 0.12 * -0.035; sporangia.push(lobe("蛇足石杉分散生于叶腋而非顶生穗的孢子囊", fertile, [x + Math.cos(a) * 0.003, y, Math.sin(a) * 0.003], [0.0017, 0.001, 0.0013])); }
  parts.push(combineMeshes("蛇足石杉茎上分散的腋生孢子囊", fertile, sporangia));
  return parts;
}

// 花、叶的部位和连接参考植物志；不按花色或花朵数量扩成多个主项。
// https://www.iplant.cn/foc/pdf/Berberidaceae.pdf
// https://www.iplant.cn/foc/pdf/Kingdonia.pdf
// https://www.efloras.org/florataxon.aspx?flora_id=2&taxon_id=200027599
// https://efloras.org/florataxon.aspx?flora_id=2&taxon_id=200005538

function fawnLily(): ModelPart[] {
  const parts: ModelPart[] = [flatLeaf("猪牙花近地面的一对宽披针叶", [0, 0.004, 0], [-0.084, 0.025, 0.034], 0.034, "oval", 0.0008), flatLeaf("猪牙花另一片相对的大叶", [0, 0.005, 0], [0.075, 0.019, -0.033], 0.039, "oval", 0.0008), tapered("猪牙花顶部弯垂的单花葶", pale, [[0, 0, 0], [0, 0.17, 0], [0.019, 0.215, 0], [0.031, 0.19, 0]], [0.0022, 0.0018, 0.0013, 0.0008])];
  const root: Triple = [0.031, 0.19, 0];
  for (let i = 0; i < 6; i++) {
    const a = i * Math.PI / 3, p = flatLeaf("猪牙花向上反卷而不是平伸的花被片", [0, 0, 0], [0, 0, 1], 0.012, "oval", 0.0005);
    p.vertices = p.vertices!.map(v => { const t = v.z, r = Math.sin(t * Math.PI * 0.8) * 0.035; return { x: root[0] + Math.cos(a) * r + Math.sin(a) * v.x, y: root[1] + v.y - Math.sin(t * Math.PI) * 0.012 + t * t * 0.05, z: root[2] + Math.sin(a) * r - Math.cos(a) * v.x }; });
    p.color = bloom;
    parts.push(p);
  }
  const stamens: ModelPart[] = [];
  for (let i = 0; i < 6; i++) { const a = i * Math.PI / 3, end: Triple = [root[0] + Math.cos(a) * 0.004, root[1] - 0.026, Math.sin(a) * 0.004]; stamens.push(needle("猪牙花向下伸出的离生花丝", cream, root, end, 0.0006), lobe("猪牙花下垂的狭长花药", fertile, end, [0.002, 0.008, 0.002])); }
  parts.push(combineMeshes("猪牙花反卷花被下独立悬垂的六雄蕊", fertile, stamens));
  return parts;
}

function bloodroot(): ModelPart[] {
  const parts: ModelPart[] = [tapered("血根草单片掌裂叶的长叶柄", "#b09b81", [[0, 0, 0], [-0.018, 0.15, 0]], [0.003, 0.002]), flatLeaf("血根草圆轮廓的七裂波缘叶", [-0.018, 0.15, 0], [-0.044, 0.17, 0.15], 0.17, [[0, 0], [-0.27, 0.02], [-0.49, 0.17], [-0.33, 0.27], [-0.55, 0.45], [-0.33, 0.53], [-0.44, 0.72], [-0.2, 0.74], [-0.14, 0.96], [0, 0.84], [0.14, 0.96], [0.2, 0.74], [0.44, 0.72], [0.33, 0.53], [0.55, 0.45], [0.33, 0.27], [0.49, 0.17], [0.27, 0.02]], 0.0008), tapered("血根草独立于叶柄的无叶单花葶", pale, [[0, 0, 0], [0.023, 0.18, -0.015]], [0.002, 0.0012])];
  const root: Triple = [0.023, 0.18, -0.015], corolla: ModelPart[] = [];
  for (let i = 0; i < 8; i++) corolla.push(radialBlade("血根草四长四短相间的八枚花瓣", cream, root, i % 2 ? 0.011 : 0.014, i % 2 ? 0.017 : 0.022, 75, i * 45));
  parts.push(combineMeshes("血根草略呈四方轮廓的八瓣白花", cream, corolla));
  const organs: ModelPart[] = [lobe("血根草中央直立的子房", pale, [root[0], root[1] + 0.006, root[2]], [0.004, 0.009, 0.004])];
  for (let i = 0; i < 18; i++) { const a = i * 2.4, end: Triple = [root[0] + Math.cos(a) * 0.007, root[1] + 0.009, root[2] + Math.sin(a) * 0.007]; organs.push(needle("血根草花盘内的离生雄蕊", fertile, root, end, 0.0007), lobe("血根草细长金色花药", fertile, end, [0.0014, 0.0028, 0.0014])); }
  parts.push(combineMeshes("血根草花杯中一圈真正独立的雄蕊", fertile, organs));
  return parts;
}

function umbrellaLeaf(): ModelPart[] {
  const parts: ModelPart[] = [tapered("南方山荷叶粗壮的直立草茎", pale, [[0, 0, 0], [0, 0.56, 0]], [0.009, 0.004])];
  const outline: [number, number][] = [[0, -0.1], [-0.11, -0.42], [-0.35, -0.36], [-0.47, -0.17], [-0.55, 0], [-0.43, 0.1], [-0.49, 0.28], [-0.26, 0.34], [-0.23, 0.48], [0, 0.41], [0.23, 0.48], [0.26, 0.34], [0.49, 0.28], [0.43, 0.1], [0.55, 0], [0.47, -0.17], [0.35, -0.36], [0.11, -0.42]];
  for (const [side, y, span] of [[-1, 0.28, 0.4], [1, 0.45, 0.31]]) {
    const root: Triple = [side! * 0.1, y! + 0.085, 0];
    parts.push(tapered("从草茎伸到盾状叶下表面的真正长叶柄", pale, [[0, y!, 0], root], [0.004, 0.003]), polygon("南方山荷叶两大裂片再浅裂的不对称盾叶", green, outline.map(([x, z]) => [x * span!, z * span!]), 0.0015, root));
  }
  const hub: Triple = [0, 0.58, 0];
  parts.push(tapered("山荷叶越过上部盾叶的聚伞花序总梗", pale, [[0, 0.5, 0], hub], [0.0025, 0.0015]));
  for (let i = 0; i < 6; i++) {
    const a = i * 2.4, p: Triple = [Math.cos(a) * 0.065, 0.595 + i % 2 * 0.017, Math.sin(a) * 0.065];
    parts.push(tapered("山荷叶聚伞花序各花真正独立的花梗", pale, [hub, p], [0.0013, 0.0007]), petals(6, p, 0.008, 0.014, 75, cream), lobe("山荷叶六瓣花中心的单子房", pale, [p[0], p[1] + 0.004, p[2]], [0.004, 0.007, 0.004]));
  }
  return parts;
}

function mayapple(): ModelPart[] {
  const joint: Triple = [0, 0.33, 0], parts: ModelPart[] = [tapered("盾叶鬼臼在两叶分叉前的单一直立茎", pale, [[0, 0, 0], joint], [0.005, 0.0035])];
  const outline: [number, number][] = [];
  for (let lobe = 0; lobe < 7; lobe++) for (const [offset, r] of [[-0.48, 0.31], [-0.3, 0.83], [0, 1], [0.3, 0.83]]) { const a = (lobe + offset!) * Math.PI * 2 / 7; outline.push([Math.cos(a) * r!, Math.sin(a) * r!]); }
  for (const side of [-1, 1]) {
    const p: Triple = [side * 0.13, 0.43 + side * 0.018, 0];
    parts.push(tapered("盾叶鬼臼一对近对生叶的分叉叶柄", pale, [joint, p], [0.0035, 0.002]), polygon("盾叶鬼臼真正七深裂的伞形叶片", green, outline.map(([x, z]) => [x * (side < 0 ? 0.15 : 0.13), z * (side < 0 ? 0.15 : 0.13)]), 0.0013, p));
  }
  const root: Triple = [0, 0.28, 0.026];
  parts.push(tapered("从两叶夹角内抽出而悬在叶下的单花梗", pale, [joint, [0, 0.318, 0.025], root], [0.0016, 0.0013, 0.0008]), petals(8, root, 0.016, 0.027, 124, cream), lobe("鬼臼下垂白花中央的长圆子房", pale, [0, 0.269, 0.026], [0.009, 0.016, 0.009]));
  const stamens: ModelPart[] = [];
  for (let i = 0; i < 16; i++) { const a = i * Math.PI / 8, end: Triple = [Math.cos(a) * 0.011, 0.264, 0.026 + Math.sin(a) * 0.011]; stamens.push(needle("鬼臼下垂花内的细花丝", cream, root, end, 0.0007), lobe("盾叶鬼臼下垂花药", fertile, end, [0.0018, 0.006, 0.0018])); }
  parts.push(combineMeshes("盾叶鬼臼叶下单花中独立的花药环", fertile, stamens));
  return parts;
}

function kingdonia(): ModelPart[] {
  const root: Triple = [-0.013, 0.095, 0], outline: [number, number][] = [], parts: ModelPart[] = [tapered("独叶草唯一基生叶的细长叶柄", pale, [[0, 0, 0], root], [0.0016, 0.001])];
  for (let lobe = 0; lobe < 5; lobe++) for (const [offset, r] of [[-0.49, 0.16], [-0.32, 0.86], [-0.18, 0.68], [0, 1], [0.18, 0.68], [0.32, 0.86]]) { const a = (lobe + offset!) * Math.PI * 2 / 5; outline.push([Math.cos(a) * r! * 0.034, Math.sin(a) * r! * 0.034]); }
  parts.push(polygon("独叶草五深裂且各裂片末端再三裂的单叶", green, outline, 0.0006, root), tapered("独叶草独立于叶柄且只开一朵花的花葶", pale, [[0, 0, 0], [0.012, 0.12, 0]], [0.0012, 0.0006]), petals(6, [0.012, 0.12, 0], 0.0027, 0.006, 85, pale));
  const organs: ModelPart[] = [];
  for (let i = 0; i < 8; i++) { const a = i * Math.PI / 4, end: Triple = [0.012 + Math.cos(a) * 0.0022, 0.122, Math.sin(a) * 0.0022]; organs.push(needle("独叶草花内棒状退化雄蕊", pale, [0.012, 0.12, 0], end, 0.0004), lobe("独叶草棒状退化雄蕊的头状顶端", pale, end, [0.0006, 0.0006, 0.0006])); }
  const p = combineMeshes("独叶草不具花瓣的单花中心器官", pale, organs);
  p.vertices = p.vertices!.map(v => ({ x: v.x * 10, y: v.y * 10, z: v.z * 10 })); p.scale = { x: 0.1, y: 0.1, z: 0.1 };
  parts.push(p);
  return parts;
}

function twistedStalk(): ModelPart[] {
  const main: Triple[] = [[0, 0, 0], [0.015, 0.17, 0], [-0.012, 0.33, 0], [0.018, 0.49, 0], [-0.012, 0.65, 0], [0.025, 0.79, 0]], parts: ModelPart[] = [tapered("扭柄花沿交互叶腋轻折的主茎", pale, main, [0.005, 0.0042, 0.0038, 0.003, 0.0021, 0.0012])];
  for (let i = 1; i < main.length; i++) {
    const p = main[i]!, side = i % 2 ? -1 : 1, end: Triple = [p[0] + side * (0.17 - i * 0.014), p[1] + 0.03, p[2] + 0.018];
    parts.push(flatLeaf("扭柄花基部抱茎的互生卵状披针叶", p, end, 0.08 - i * 0.005, "heart", 0.0007));
    const root: Triple = [p[0] - side * 0.025, p[1] - 0.032, -0.006], flower: ModelPart[] = [tapered("扭柄花叶下中途急弯扭转的细花柄", pale, [p, [p[0] - side * 0.025, p[1] + 0.012, 0.012], [p[0] - side * 0.037, p[1] - 0.004, 0.008], root], [0.0009, 0.0007, 0.0006, 0.00045])];
    for (let tepal = 0; tepal < 6; tepal++) flower.push(radialBlade("扭柄花单朵下垂花外展的六枚尖花被", cream, root, 0.0028, 0.008, 135, tepal * 60));
    parts.push(combineMeshes("扭柄花由真实扭曲花柄吊起的六被小花", cream, flower));
  }
  const tip: Triple = [0.2, 0.64, -0.02];
  parts.push(tapered("扭柄花中部斜出的完整次级支茎", pale, [main[2]!, [0.11, 0.48, -0.015], tip], [0.0027, 0.0018, 0.0008]), flatLeaf("扭柄花侧支茎上的较小叶", [0.11, 0.48, -0.015], [0.22, 0.51, 0.01], 0.055, "heart", 0.0007), flatLeaf("扭柄花侧支茎顶端叶", tip, [0.26, 0.67, -0.06], 0.041, "heart", 0.0007));
  return parts;
}

function beadLily(): ModelPart[] {
  const parts: ModelPart[] = [];
  for (let i = 0; i < 4; i++) { const a = i * 2.4, root: Triple = [Math.cos(a) * 0.011, 0.006, Math.sin(a) * 0.011]; parts.push(flatLeaf("七筋菇仅在基部成簇的宽倒卵叶", root, [Math.cos(a) * 0.16, 0.065 + i % 2 * 0.018, Math.sin(a) * 0.16], 0.084, "obovate", 0.001)); }
  const hub: Triple = [0, 0.22, 0];
  parts.push(tapered("七筋菇完全无茎叶的直立花葶", pale, [[0, 0, 0], hub], [0.003, 0.0013]));
  for (let i = 0; i < 7; i++) {
    const a = i * 2.4, root: Triple = [Math.cos(a) * 0.029, 0.205 + i * 0.005, Math.sin(a) * 0.029], pieces: ModelPart[] = [needle("七筋菇短总状花序上的独立花梗", pale, [0, 0.18 + i * 0.007, 0], root, 0.0008)];
    for (let tepal = 0; tepal < 6; tepal++) pieces.push(radialBlade("七筋菇六片狭长且离生的白花被", cream, root, 0.0032, 0.01, 65, tepal * 60));
    pieces.push(lobe("七筋菇小花中央的独立子房", pale, [root[0], root[1] + 0.002, root[2]], [0.0025, 0.004, 0.0025]));
    parts.push(combineMeshes("七筋菇无叶花葶顶端独立的六被白花", cream, pieces));
  }
  return parts;
}

function twinleaf(): ModelPart[] {
  const parts: ModelPart[] = [];
  const outline: [number, number][] = [[-0.008, -0.004], [-0.075, -0.045], [-0.1, 0], [-0.08, 0.06], [-0.015, 0.075], [-0.002, 0.004], [0.002, 0.004], [0.015, 0.075], [0.08, 0.06], [0.1, 0], [0.075, -0.045], [0.008, -0.004]];
  for (const side of [-1, 1]) {
    const root: Triple = [side * 0.044, 0.18 + side * 0.015, 0.018];
    parts.push(tapered("二叶鲜黄连从根颈分别抽出的长叶柄", pale, [[0, 0, 0], root], [0.0024, 0.0017]), polygon("二叶鲜黄连一片叶内真正深裂成对的双瓣叶", green, outline, 0.001, root));
  }
  const root: Triple = [0, 0.21, -0.034];
  parts.push(tapered("二叶鲜黄连与叶柄相互独立的单花葶", pale, [[0, 0, 0], root], [0.002, 0.001]), petals(8, root, 0.013, 0.021, 75, cream));
  const organs: ModelPart[] = [lobe("二叶鲜黄连中央较长子房", pale, [root[0], root[1] + 0.005, root[2]], [0.005, 0.011, 0.005])];
  for (let i = 0; i < 8; i++) { const a = i * Math.PI / 4, end: Triple = [root[0] + Math.cos(a) * 0.008, root[1] + 0.008, root[2] + Math.sin(a) * 0.008]; organs.push(needle("二叶鲜黄连与八花瓣对应的八枚花丝", cream, root, end, 0.0006), lobe("二叶鲜黄连八枚独立短花药", fertile, end, [0.0017, 0.003, 0.0017])); }
  parts.push(combineMeshes("二叶鲜黄连单花里的八雄蕊及中央子房", fertile, organs));
  return parts;
}

function houttuynia(): ModelPart[] {
  const parts: ModelPart[] = [tapered("鱼腥草节间连续的贴地匍匐茎", "#a29c7e", [[-0.16, 0.004, 0], [0, 0.005, 0.017], [0.16, 0.004, 0]], [0.003, 0.004, 0.0025])];
  for (let shoot = 0; shoot < 3; shoot++) {
    const x = (shoot - 1) * 0.12, height = 0.22 + shoot % 2 * 0.07, z = 0.014 - Math.abs(shoot - 1) * 0.01;
    parts.push(tapered("鱼腥草由匍匐节点抽出的直立分茎", pale, [[x, 0.004, z], [x, height, z]], [0.003, 0.001]));
    for (let i = 0; i < 4; i++) {
      const a = i * 2.4 + shoot, y = 0.045 + i * (height - 0.08) / 4, end: Triple = [x + Math.cos(a) * 0.025, y + 0.01, z + Math.sin(a) * 0.025];
      parts.push(tapered("鱼腥草互生心形叶的独立叶柄", pale, [[x, y, z], end], [0.001, 0.0006]), flatLeaf("鱼腥草全缘尖头且基部深心形的宽叶", end, [end[0] + Math.cos(a) * 0.075, end[1] + 0.012, end[2] + Math.sin(a) * 0.075], 0.063, "heart", 0.0007));
    }
    const root: Triple = [x, height, z], bracts: ModelPart[] = [];
    for (let i = 0; i < 4; i++) bracts.push(radialBlade("鱼腥草穗基部四片花瓣状白总苞片", cream, root, 0.012, 0.023, 84, i * 90));
    parts.push(combineMeshes("鱼腥草四枚总苞而非单朵四瓣花", cream, bracts));
    const florets: ModelPart[] = [tapered("鱼腥草白总苞中心的短穗轴", pale, [root, [x, height + 0.019, z]], [0.0018, 0.0011])];
    for (let i = 0; i < 24; i++) { const a = i * 2.4; florets.push(lobe("鱼腥草短穗上无花被的小花", pale, [x + Math.cos(a) * 0.0025, height + 0.002 + i / 24 * 0.016, z + Math.sin(a) * 0.0025], [0.0023, 0.0026, 0.0023])); }
    parts.push(combineMeshes("鱼腥草真正由小花组成的柱状短穗", pale, florets));
  }
  return parts;
}

function lizardTail(): ModelPart[] {
  const parts: ModelPart[] = [tapered("三白草粗壮而上部不木质化的直立茎", pale, [[0, 0, 0], [0.015, 0.4, 0], [0, 0.76, 0]], [0.006, 0.0045, 0.0018])];
  for (let i = 0; i < 8; i++) {
    const a = i * 2.4, y = 0.07 + i * 0.08, x = y < 0.4 ? y / 0.4 * 0.015 : 0.015 * (1 - (y - 0.4) / 0.36), end: Triple = [x + Math.cos(a) * 0.023, y + 0.009, Math.sin(a) * 0.023], span = i > 4 ? 0.105 : 0.155;
    parts.push(tapered("三白草近抱茎短鞘外延伸的叶柄", pale, [[x, y, 0], end], [0.0017, 0.001]));
    const blade = flatLeaf("三白草互生宽卵心形叶与顶端三片花期白叶", end, [end[0] + Math.cos(a) * span, end[1] + 0.027, end[2] + Math.sin(a) * span], i > 4 ? 0.062 : 0.092, "heart", 0.0008); if (i > 4) blade.color = cream;
    parts.push(blade);
  }
  for (const side of [-1, 1]) {
    const path: Triple[] = [[0.007, 0.57 + side * 0.035, 0], [side * 0.05, 0.735, 0.01], [side * 0.115, 0.77, 0.018], [side * 0.17, 0.73, 0.02]], pieces: ModelPart[] = [];
    parts.push(tapered("三白草由叶腋抽出并自然弯垂的长总状花序", pale, path, [0.0025, 0.002, 0.0013, 0.0007]));
    for (let i = 0; i < 45; i++) {
      const t = 0.2 + i / 45 * 0.78, section = Math.min(2, Math.floor(t * 3)), u = t * 3 - section, start = path[section]!, end = path[section + 1]!, a = i * 2.4;
      const p: Triple = start.map((v, axis) => v + (end[axis]! - v) * u) as Triple;
      pieces.push(lobe("三白草长穗上独立无花被的微小花", cream, [p[0], p[1] + Math.cos(a) * 0.0025, p[2] + Math.sin(a) * 0.0025], [0.0026, 0.0028, 0.0026]));
    }
    for (let i = 0; i < pieces.length; i += 30) parts.push(combineMeshes("三白草不带鱼腥草四总苞的弯长花穗", cream, pieces.slice(i, i + 30)));
  }
  return parts;
}

function rodgersia(): ModelPart[] {
  const parts: ModelPart[] = [];
  const blade: [number, number][] = [[0, 0], [-0.24, 0.16], [-0.43, 0.42], [-0.49, 0.73], [-0.32, 0.69], [-0.29, 0.96], [-0.1, 0.77], [0, 1], [0.1, 0.77], [0.29, 0.96], [0.32, 0.69], [0.49, 0.73], [0.43, 0.42], [0.24, 0.16]];
  for (let stalk = 0; stalk < 3; stalk++) {
    const a = stalk * 2.4, p: Triple = [Math.cos(a) * 0.1, 0.3 + stalk * 0.035, Math.sin(a) * 0.1], leaves: ModelPart[] = [];
    parts.push(tapered("鬼灯檠三条由根颈抽出的长复叶柄", pale, [[0, 0, 0], p], [0.008, 0.004]));
    for (let i = 0; i < 5; i++) { const b = a + (i - 2) * 0.75, root: Triple = [p[0] + Math.cos(b) * 0.018, p[1] + 0.006, p[2] + Math.sin(b) * 0.018]; leaves.push(needle("鬼灯檠掌状复叶各小叶的真实短柄", pale, p, root, 0.002), flatLeaf("鬼灯檠前端三裂的倒卵形大复叶小片", root, [root[0] + Math.cos(b) * 0.22, root[1] + 0.035, root[2] + Math.sin(b) * 0.22], 0.14, blade, 0.001)); }
    parts.push(combineMeshes("鬼灯檠一片五小叶离生的完整掌状复叶", green, leaves));
  }
  parts.push(tapered("鬼灯檠高过大叶的花序主轴", pale, [[0, 0, 0], [0, 0.84, 0]], [0.006, 0.001]));
  for (let branch = 0; branch < 8; branch++) {
    const a = branch * 2.4, y = 0.59 + branch * 0.026, root: Triple = [0, y, 0], end: Triple = [Math.cos(a) * (0.13 - branch * 0.011), y + 0.04, Math.sin(a) * (0.13 - branch * 0.011)];
    parts.push(tapered("鬼灯檠末端圆锥花序独立侧轴", pale, [root, end], [0.0016, 0.0007]));
    const flowers: ModelPart[] = [];
    for (let flower = 0; flower < 6; flower++) {
      const t = 0.2 + flower * 0.14, p: Triple = [end[0] * t, y + 0.04 * t, end[2] * t];
      for (let sepal = 0; sepal < 5; sepal++) flowers.push(radialBlade("鬼灯檠小花只有五枚白色萼片而没有花瓣", cream, p, 0.0011, 0.0021, 70, sepal * 72));
      flowers.push(lobe("鬼灯檠小花中央的二裂心皮", pale, [p[0], p[1] + 0.0012, p[2]], [0.0013, 0.002, 0.0013]));
    }
    parts.push(combineMeshes("鬼灯檠圆锥花序的一枝无瓣白萼小花", cream, flowers));
  }
  return parts;
}

function bergenia(): ModelPart[] {
  const parts: ModelPart[] = [], leaves: ModelPart[] = [];
  const outline: [number, number][] = [[0, 0], [-0.19, 0.06], [-0.4, 0.21], [-0.46, 0.4], [-0.42, 0.43], [-0.5, 0.58], [-0.44, 0.61], [-0.45, 0.76], [-0.38, 0.79], [-0.25, 0.94], [0, 1], [0.25, 0.94], [0.38, 0.79], [0.45, 0.76], [0.44, 0.61], [0.5, 0.58], [0.42, 0.43], [0.46, 0.4], [0.4, 0.21], [0.19, 0.06]];
  for (let i = 0; i < 7; i++) { const a = i * 2.4; leaves.push(flatLeaf("岩白菜厚革质且带真实钝齿的宽圆基生叶", [Math.cos(a) * 0.018, 0.008, Math.sin(a) * 0.018], [Math.cos(a) * 0.18, 0.045 + i % 3 * 0.02, Math.sin(a) * 0.18], 0.115, outline, 0.0025)); }
  parts.push(combineMeshes("岩白菜无直立茎叶的大圆叶莲座", green, leaves), tapered("岩白菜从基生莲座抽出的粗花葶", "#ac9586", [[0, 0, 0], [0.012, 0.31, 0], [0, 0.38, 0]], [0.005, 0.0035, 0.0015]));
  for (let branch = 0; branch < 4; branch++) {
    const a = branch * 2.4, y = 0.24 + branch * 0.029, end: Triple = [Math.cos(a) * 0.063, y + 0.038, Math.sin(a) * 0.063];
    parts.push(tapered("岩白菜近顶端分出的聚伞花序轴", "#ac9586", [[0.01, y, 0], end], [0.002, 0.001]));
    for (let flower = 0; flower < 4; flower++) {
      const b = a + (flower - 1.5) * 0.55, p: Triple = [end[0] + Math.cos(b) * 0.022, end[1] + 0.006 + flower % 2 * 0.008, end[2] + Math.sin(b) * 0.022], corolla = smallCorolla(p, [Math.cos(b) * 0.4, -0.8, Math.sin(b) * 0.4], 0.011, 0.0033, bloom, false, 5, 8);
      parts.push(combineMeshes("岩白菜细花柄顶端真正下垂的五裂短钟花", bloom, [needle("岩白菜小花相连的细花柄", "#ac9586", end, p, 0.0008), corolla]));
    }
  }
  return parts;
}

export const herbaceousExpansionBatchOneDesigns: MasterNatureDesign[] = [
  design("adderTongueFern", "瓶尔小草", "植物", adderTongue, ["Ophioglossum vulgatum", "单片营养叶与双列孢子穗"]),
  design("moonwortFern", "扇羽阴地蕨", "植物", moonwort, ["Botrychium lunaria", "半月扇形羽片与分枝孢子群"]),
  design("japaneseRoyalFern", "紫萁", "植物", royalFern, ["Osmunda japonica", "二回羽状营养叶与独立狭缩孢子叶"]),
  design("ostrichFern", "荚果蕨", "植物", ostrichFern, ["Matteuccia struthiopteris", "漏斗状深裂营养叶与短串珠孢子叶"]),
  design("hartTongueFern", "鹿舌蕨", "植物", hartTongue, ["Asplenium scolopendrium", "全缘心基长舌叶和背面线形孢子群"]),
  design("japaneseClimbingFern", "海金沙", "植物", climbingFern, ["Lygodium japonicum", "继续缠绕的总叶轴与三角形复羽片"]),
  design("chineseQuillwort", "中华水韭", "植物", quillwort, ["Isoetes sinensis", "二裂根茎与四纵行气道线叶"]),
  design("toothedClubmoss", "蛇足石杉", "植物", toothedClubmoss, ["Huperzia serrata", "近轮生锯齿小叶与分散腋生孢子囊"]),
  design("japaneseFawnLily", "猪牙花", "植物", fawnLily, ["Erythronium japonicum", "一对基生叶与六花被反卷的单朵垂花"]),
  design("canadianBloodroot", "加拿大血根草", "植物", bloodroot, ["Sanguinaria canadensis", "单片圆形掌裂叶与八瓣单花"]),
  design("chineseUmbrellaLeaf", "南方山荷叶", "植物", umbrellaLeaf, ["Diphylleia sinensis", "两片大盾叶与顶生六瓣聚伞花"]),
  design("mayapplePlant", "盾叶鬼臼", "植物", mayapple, ["Podophyllum peltatum", "一对七裂伞形叶与叶下单花"]),
  design("kingdoniaPlant", "独叶草", "植物", kingdonia, ["Kingdonia uniflora", "唯一五深裂基生叶与无瓣独花"]),
  design("twistedStalkPlant", "扭柄花", "植物", twistedStalk, ["Streptopus amplexifolius", "交互抱茎叶与急弯扭转的叶下花柄"]),
  design("clintoniaPlant", "七筋菇", "植物", beadLily, ["Clintonia udensis", "少数宽倒卵基生叶与无叶总状花葶"]),
  design("twinleafPlant", "二叶鲜黄连", "植物", twinleaf, ["Jeffersonia diphylla", "每叶真实深裂为双瓣与八瓣白花"]),
  design("houttuyniaPlant", "鱼腥草", "植物", houttuynia, ["Houttuynia cordata", "匍匐节茎心形叶及四总苞短穗"]),
  design("chineseLizardTail", "三白草", "植物", lizardTail, ["Saururus chinensis", "顶端三片花期白叶与无总苞弯长花穗"]),
  design("rodgersiaPodophylla", "鬼灯檠", "植物", rodgersia, ["Rodgersia podophylla", "五小叶前端三裂的掌状复叶及无瓣白萼圆锥花序"]),
  design("thickLeafBergenia", "岩白菜", "植物", bergenia, ["Bergenia crassifolia", "厚圆钝齿基生叶和分枝下垂钟花"]),
];
