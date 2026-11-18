import { combineMeshes, design, lobe, needle, part, tapered } from "./shared";
import type { MasterNatureDesign, ModelPart, Triple } from "./shared";
import { flatLeaf } from "./ediblePlants";
import { smallCorolla } from "./gardenPerennials";
import { radialBlade } from "./herbaceousExpansionBatchOne";

const green = "#80976c";
const pale = "#b2bc95";
const brown = "#988a6c";
const cream = "#d5ceb1";

export function thinLeaf(value: ModelPart): ModelPart {
  const count = value.vertices!.length / 2, indices: number[] = [];
  // ACT: 巨蕨的亚毫米小羽片保留全齿缘和独立正反面，省略叶缘侧墙。
  // 近观需要叶缘厚度时可沿原轮廓恢复闭合挤片，不改叶序或删羽片。
  for (let i = 0; i < value.indices!.length; i += 3) {
    const triangle = value.indices!.slice(i, i + 3);
    if (triangle.every(index => index < count) || triangle.every(index => index >= count)) indices.push(...triangle);
  }
  value.indices = indices;
  return value;
}

// 原创米制林下巨蕨与湿地整株，不是同一种蕨的比例/花色变体。
// https://www.rhs.org.uk/plants/5794/dicksonia-antarctica/details
// https://www.worldfloraonline.org/taxon/wfo-0001122823
// https://tai2.ntu.edu.tw/species/113%20001%2001%200
// https://www.iplant.cn/fsz/info/Blechnum%20orientale

function dividedPinna(root: Triple, heading: number, length: number, pairs: number, deeplyCut: boolean): ModelPart {
  const tip: Triple = [root[0] + Math.cos(heading) * length, root[1] + length * 0.12, root[2] + Math.sin(heading) * length];
  const pieces: ModelPart[] = [needle("蕨叶次级羽片承托各小羽片的细羽轴", pale, root, tip, 0.002)];
  for (let node = 0; node < pairs; node++) for (const side of [-1, 1]) {
    const t = 0.13 + node / pairs * 0.75, p: Triple = [root[0] + (tip[0] - root[0]) * t, root[1] + length * 0.12 * t, root[2] + (tip[2] - root[2]) * t], a = heading + side * 1.17, span = length * 0.26 * (1 - t * 0.5);
    pieces.push(thinLeaf(flatLeaf(deeplyCut ? "末级又深裂成多个齿段的小羽片" : "羽轴两侧分离的狭披针小羽片", p, [p[0] + Math.cos(a) * span, p[1] + 0.012, p[2] + Math.sin(a) * span], span * 0.38, deeplyCut ? "lobed" : "oval", 0.0007)));
  }
  return combineMeshes("一片真正有轴有分离小羽片的次级蕨羽", green, pieces);
}

function softTreeFern(): ModelPart[] {
  const parts: ModelPart[] = [part("软树蕨由纤维根披覆的直立根茎主芯", "lathe", brown, [0, 0, 0], [1, 1, 1], [0, 0, 0], { profile: [{ x: 0, y: 0 }, { x: 0.24, y: 0 }, { x: 0.2, y: 0.2 }, { x: 0.17, y: 1.96 }, { x: 0.21, y: 2.1 }, { x: 0, y: 2.1 }] })];
  const fibers: ModelPart[] = [];
  for (let i = 0; i < 48; i++) {
    const a = i * 2.4, top = 1.85 + i % 4 * 0.055;
    fibers.push(tapered("软树蕨从冠下贴干延伸至地面的真实弯曲纤维根", "#a09174", [[Math.cos(a) * 0.25, 0, Math.sin(a) * 0.25], [Math.cos(a + 0.12) * 0.192, 0.88, Math.sin(a + 0.12) * 0.192], [Math.cos(a + 0.21) * 0.19, top, Math.sin(a + 0.21) * 0.19]], [0.006, 0.004, 0.003]));
  }
  for (let i = 0; i < fibers.length; i += 16) parts.push(combineMeshes("软树蕨根茎外实际立体披覆的纤维根帘", "#a09174", fibers.slice(i, i + 16)));
  for (let frond = 0; frond < 5; frond++) {
    const a = frond * Math.PI * 0.4, hub: Triple = [Math.cos(a) * 0.32, 2.48, Math.sin(a) * 0.32], tip: Triple = [Math.cos(a) * 1.78, 2.74 + frond % 2 * 0.15, Math.sin(a) * 1.78];
    parts.push(tapered("软树蕨冠顶无鳞的弧展大叶柄与主轴", pale, [[Math.cos(a) * 0.11, 2.07, Math.sin(a) * 0.11], hub, tip], [0.027, 0.016, 0.002]));
    for (let node = 0; node < 6; node++) for (const side of [-1, 1]) {
      const t = 0.1 + node * 0.15, root: Triple = hub.map((v, axis) => v + (tip[axis]! - v) * t) as Triple, span = Math.sin((t * 0.75 + 0.12) * Math.PI) * 0.53;
      parts.push(dividedPinna(root, a + side * 1.08, span, 4, true));
    }
  }
  return parts;
}

function bracken(): ModelPart[] {
  const parts: ModelPart[] = [];
  for (let frond = 0; frond < 2; frond++) {
    const a = frond * 2.4, root: Triple = [Math.cos(a) * 0.08, 1.01 + frond * 0.14, Math.sin(a) * 0.08];
    parts.push(tapered("蕨菜叶片以下长而裸露的硬直叶柄", "#a6987e", [[0, 0, 0], root], [0.008, 0.0045]));
    for (let arm = 0; arm < 3; arm++) {
      const b = a + (arm - 1) * 1.18, span = arm === 1 ? 0.9 : 0.72, tip: Triple = [root[0] + Math.cos(b) * span, root[1] + (arm === 1 ? 0.38 : 0.2), root[2] + Math.sin(b) * span];
      parts.push(tapered("蕨菜大型三角叶的三组展开羽片主轴", pale, [root, tip], [0.004, 0.001]));
      for (let node = 0; node < 4; node++) for (const side of [-1, 1]) {
        const t = 0.14 + node * 0.21, p: Triple = root.map((v, axis) => v + (tip[axis]! - v) * t) as Triple;
        parts.push(dividedPinna(p, b + side * 1.16, (1 - t) * 0.36 + 0.05, 4, false));
      }
    }
  }
  return parts;
}

function forkedFern(): ModelPart[] {
  const parts: ModelPart[] = [];
  for (let frond = 0; frond < 3; frond++) {
    const a = frond * 2.4, fork: Triple = [Math.cos(a) * 0.08, 0.8 + frond * 0.09, Math.sin(a) * 0.08];
    parts.push(tapered("芒萁在首次二叉前的细长共同叶柄", brown, [[0, 0, 0], fork], [0.004, 0.0025]));
    for (const side of [-1, 1]) {
      const b = a + side * 0.8, joint: Triple = [fork[0] + Math.cos(b) * 0.3, fork[1] + 0.18, fork[2] + Math.sin(b) * 0.3];
      parts.push(needle("芒萁第一次真实二叉分出的叶轴", pale, fork, joint, 0.003), lobe("芒萁两叉之间保留的休眠顶芽", brown, joint, [0.009, 0.015, 0.009]));
      for (const edge of [-1, 1]) {
        const c = b + edge * 0.63, tip: Triple = [joint[0] + Math.cos(c) * 0.43, joint[1] + 0.075, joint[2] + Math.sin(c) * 0.43], blades: ModelPart[] = [needle("芒萁再次二叉后的终端羽状叶轴", pale, joint, tip, 0.0018)];
        for (let node = 0; node < 18; node++) for (const leaf of [-1, 1]) { const t = 0.08 + node * 0.05, p: Triple = joint.map((v, axis) => v + (tip[axis]! - v) * t) as Triple, d = c + leaf * 1.3, span = 0.065 * Math.sin((t * 0.8 + 0.1) * Math.PI); blades.push(thinLeaf(flatLeaf("芒萁终端叶轴两侧整齐而分离的线形羽片", p, [p[0] + Math.cos(d) * span, p[1] + 0.008, p[2] + Math.sin(d) * span], 0.009, "oval", 0.00045))); }
        for (let i = 0; i < blades.length; i += 18) parts.push(combineMeshes("芒萁反复二叉叶末端的完整羽片列", green, blades.slice(i, i + 18)));
      }
    }
  }
  return parts;
}

function brainea(): ModelPart[] {
  const parts: ModelPart[] = [part("苏铁蕨短粗直立而没有苏铁球花的根茎", "lathe", "#8f866e", [0, 0, 0], [1, 1, 1], [0, 0, 0], { profile: [{ x: 0, y: 0 }, { x: 0.12, y: 0 }, { x: 0.11, y: 0.59 }, { x: 0.08, y: 0.72 }, { x: 0, y: 0.72 }] })];
  const scales: ModelPart[] = [];
  for (let i = 0; i < 40; i++) { const a = i * 2.4; scales.push(radialBlade("苏铁蕨根茎上实际覆叠的旧叶柄鳞基", brown, [Math.cos(a) * 0.098, 0.04 + i % 10 * 0.059, Math.sin(a) * 0.098], 0.025, 0.055, 160, a * 180 / Math.PI)); }
  parts.push(combineMeshes("苏铁蕨根茎外旧叶柄基的立体鳞列", brown, scales));
  for (let frond = 0; frond < 7; frond++) {
    const a = frond * 2.4, root: Triple = [Math.cos(a) * 0.16, 0.92, Math.sin(a) * 0.16], tip: Triple = [Math.cos(a) * 0.85, 1.32 + frond % 3 * 0.11, Math.sin(a) * 0.85], pieces: ModelPart[] = [];
    parts.push(tapered("苏铁蕨短叶柄与革质一回羽状叶轴", pale, [[0, 0.7, 0], root, tip], [0.01, 0.005, 0.001]));
    for (let node = 0; node < 30; node++) for (const side of [-1, 1]) {
      const t = 0.04 + node * 0.031, p: Triple = root.map((v, axis) => v + (tip[axis]! - v) * t) as Triple, b = a + side * 1.28, length = 0.145 * Math.sin((t * 0.81 + 0.09) * Math.PI);
      pieces.push(thinLeaf(flatLeaf("苏铁蕨密列而基部略偏斜的线状革质羽片", p, [p[0] + Math.cos(b) * length, p[1] + 0.013, p[2] + Math.sin(b) * length], 0.011, "oval", 0.0008)));
    }
    for (let i = 0; i < pieces.length; i += 20) parts.push(combineMeshes("苏铁蕨不再二回分裂的窄线形羽片列", green, pieces.slice(i, i + 20)));
  }
  return parts;
}

function goldenDogFern(): ModelPart[] {
  const rhizome = lobe("狗脊近地面膨大的短横卧根茎", "#a59771", [0, 0.2, 0], [0.58, 0.41, 0.45]);
  const parts: ModelPart[] = [rhizome];
  const hairs: ModelPart[] = [];
  for (let i = 0; i < 60; i++) {
    const face = i % 20, weights = [0.2, 0.2, 0.2]; weights[Math.floor(i / 20)] = 0.6;
    const p = rhizome.indices!.slice(face * 3, face * 3 + 3).map(index => rhizome.vertices![index]!);
    const root: Triple = [p.reduce((sum, v, j) => sum + v.x * weights[j]!, 0) * 0.58, 0.2 + p.reduce((sum, v, j) => sum + v.y * weights[j]!, 0) * 0.41, p.reduce((sum, v, j) => sum + v.z * weights[j]!, 0) * 0.45];
    const length = Math.hypot(root[0], root[1] - 0.2, root[2]);
    hairs.push(needle("狗脊从根茎实际三角面长出的金黄绒毛", "#b5a67f", root, [root[0] + root[0] / length * 0.022, root[1] + (root[1] - 0.2) / length * 0.022 + 0.006, root[2] + root[2] / length * 0.022], 0.0015));
  }
  parts.push(combineMeshes("狗脊低矮根茎上离散而非贴图的金黄根毛", "#b5a67f", hairs));
  for (let frond = 0; frond < 5; frond++) {
    const a = frond * 2.4, root: Triple = [Math.cos(a) * 0.3, 1.12, Math.sin(a) * 0.3], tip: Triple = [Math.cos(a) * 1.65, 1.92 + frond % 2 * 0.2, Math.sin(a) * 1.65];
    parts.push(tapered("狗脊从毛根茎上抽出的长裸叶柄与大叶轴", pale, [[Math.cos(a) * 0.06, 0.28, Math.sin(a) * 0.06], root, tip], [0.025, 0.016, 0.002]));
    for (let node = 0; node < 5; node++) for (const side of [-1, 1]) {
      const t = 0.09 + node * 0.19, p: Triple = root.map((v, axis) => v + (tip[axis]! - v) * t) as Triple;
      parts.push(dividedPinna(p, a + side * 1.06, Math.sin((t * 0.75 + 0.12) * Math.PI) * 0.58, 4, true));
    }
  }
  return parts;
}

function bambooFern(): ModelPart[] {
  const parts: ModelPart[] = [];
  const serrate: [number, number][] = [[0, 0], [-0.3, 0.08], [-0.5, 0.29], [-0.4, 0.34], [-0.5, 0.53], [-0.37, 0.58], [-0.3, 0.8], [0, 1], [0.3, 0.8], [0.37, 0.58], [0.5, 0.53], [0.4, 0.34], [0.5, 0.29], [0.3, 0.08]];
  for (let frond = 0; frond < 4; frond++) {
    const a = frond * 2.4, root: Triple = [Math.cos(a) * 0.18, 0.93, Math.sin(a) * 0.18], tip: Triple = [Math.cos(a) * 0.78, 1.77, Math.sin(a) * 0.78];
    parts.push(tapered("凤丫蕨高叶柄上展开二回羽状大叶的主轴", pale, [[0, 0, 0], root, tip], [0.009, 0.006, 0.001]));
    for (let node = 0; node < 3; node++) for (const side of [-1, 1]) {
      const t = 0.13 + node * 0.28, p: Triple = root.map((v, axis) => v + (tip[axis]! - v) * t) as Triple, b = a + side * 1.05, span = 0.51 - node * 0.1, end: Triple = [p[0] + Math.cos(b) * span, p[1] + 0.08, p[2] + Math.sin(b) * span], pieces: ModelPart[] = [needle("凤丫蕨承托宽羽片的独立副叶轴", pale, p, end, 0.0025)];
      for (let leaflet = 0; leaflet < 8; leaflet++) for (const edge of [-1, 1]) { const u = 0.1 + leaflet * 0.11, leafRoot: Triple = p.map((v, axis) => v + (end[axis]! - v) * u) as Triple, c = b + edge * 1.17, length = 0.115 - leaflet * 0.007; pieces.push(thinLeaf(flatLeaf("凤丫蕨近截形叶基并有粗齿的宽披针小羽片", leafRoot, [leafRoot[0] + Math.cos(c) * length, leafRoot[1] + 0.017, leafRoot[2] + Math.sin(c) * length], 0.031, serrate, 0.0008))); }
      parts.push(combineMeshes("凤丫蕨具有宽大粗齿小羽片的完整二回羽片", green, pieces));
    }
  }
  return parts;
}

function orientalBlechnum(): ModelPart[] {
  const parts: ModelPart[] = [lobe("乌毛蕨近地面粗壮而不形成长干的根茎", brown, [0, 0.035, 0], [0.18, 0.08, 0.18])];
  for (let frond = 0; frond < 7; frond++) {
    const a = frond * 2.4, hub: Triple = [Math.cos(a) * 0.09, 0.38, Math.sin(a) * 0.09], tip: Triple = [Math.cos(a) * 0.57, 1.32 + frond % 2 * 0.1, Math.sin(a) * 0.57], pieces: ModelPart[] = [];
    parts.push(tapered("乌毛蕨下部带退化耳羽的长叶柄及羽轴", pale, [[0, 0.03, 0], hub, tip], [0.008, 0.004, 0.001]));
    for (let node = 0; node < 23; node++) for (const side of [-1, 1]) {
      const t = 0.05 + node * 0.04, root: Triple = hub.map((v, axis) => v + (tip[axis]! - v) * t) as Triple, b = a + side * 1.27, span = 0.205 * Math.sin((t * 0.84 + 0.08) * Math.PI);
      pieces.push(thinLeaf(flatLeaf("乌毛蕨一回羽状而不再分裂的渐尖长羽片", root, [root[0] + Math.cos(b) * span, root[1] + 0.013, root[2] + Math.sin(b) * span], 0.021, "oval", 0.0007)));
    }
    for (let node = 0; node < 10; node++) for (const side of [-1, 1]) { const t = 0.1 + node * 0.085, root: Triple = [hub[0] * t, 0.03 + (hub[1] - 0.03) * t, hub[2] * t], b = a + side * Math.PI / 2; pieces.push(lobe("乌毛蕨沿叶柄基部连续分布的退化耳状小羽片", green, [root[0] + Math.cos(b) * 0.003, root[1], root[2] + Math.sin(b) * 0.003], [0.004, 0.006, 0.004])); }
    for (let i = 0; i < pieces.length; i += 20) parts.push(combineMeshes("乌毛蕨上部长羽片及下部真实耳状退化羽片", green, pieces.slice(i, i + 20)));
  }
  return parts;
}

function tuberSwordFern(): ModelPart[] {
  const parts: ModelPart[] = [];
  const auricle: [number, number][] = [[0, 0], [-0.3, -0.06], [-0.5, 0.22], [-0.43, 0.65], [-0.2, 0.9], [0, 1], [0.22, 0.88], [0.4, 0.58], [0.35, 0.12]];
  for (let frond = 0; frond < 8; frond++) {
    const a = frond * 2.4, root: Triple = [Math.cos(a) * 0.12, 0.45, Math.sin(a) * 0.12], tip: Triple = [Math.cos(a) * 0.7, 0.78 + frond % 3 * 0.12, Math.sin(a) * 0.7];
    parts.push(tapered("肾蕨密叶丛中直立后弧展的独立叶轴", pale, [[0, 0, 0], root, tip], [0.004, 0.002, 0.0006]));
    const blades: ModelPart[] = [];
    for (let node = 0; node < 29; node++) for (const side of [-1, 1]) { const t = 0.04 + node * 0.032, p: Triple = root.map((v, axis) => v + (tip[axis]! - v) * t) as Triple, b = a + side * 1.23, span = Math.sin((t * 0.8 + 0.1) * Math.PI) * 0.067; blades.push(thinLeaf(flatLeaf("肾蕨基部带偏心耳片并紧密覆盖叶轴的小羽片", p, [p[0] + Math.cos(b) * span, p[1] + 0.007, p[2] + Math.sin(b) * span], 0.016, auricle, 0.0006))); }
    for (let i = 0; i < blades.length; i += 24) parts.push(combineMeshes("肾蕨密排的具耳小羽片形成的完整狭长叶", green, blades.slice(i, i + 24)));
  }
  return parts;
}

function purpleLoosestrife(): ModelPart[] {
  const parts: ModelPart[] = [];
  for (let stem = 0; stem < 3; stem++) {
    const x = (stem - 1) * 0.075, height = 1.47 + stem % 2 * 0.22;
    parts.push(part("千屈菜真正四棱的直立高秆", "box", pale, [x, height / 2, 0], [0.009, height, 0.009]));
    for (let node = 0; node < 7; node++) {
      const y = 0.1 + node * 0.15, pieces: ModelPart[] = [];
      for (let blade = 0; blade < 3; blade++) { const a = blade * Math.PI * 2 / 3 + node * 0.5, span = 0.105 - node * 0.006; pieces.push(flatLeaf("千屈菜同节三枚轮生而近无柄的狭披针叶", [x, y, 0], [x + Math.cos(a) * span, y + 0.013, Math.sin(a) * span], 0.022, "oval", 0.0007)); }
      parts.push(combineMeshes("千屈菜细高茎上每节实际轮生的三叶", green, pieces));
    }
    const flowers: ModelPart[] = [];
    for (let flower = 0; flower < 18; flower++) { const y = 0.99 + flower / 17 * (height - 1.01), a = flower * 2.4, root: Triple = [x + Math.cos(a) * 0.004, y, Math.sin(a) * 0.004]; flowers.push(smallCorolla(root, [Math.cos(a), 0.2, Math.sin(a)], 0.009, 0.006, "#b3a0b6", false, 6, 8)); }
    for (let i = 0; i < flowers.length; i += 3) parts.push(combineMeshes("千屈菜上部叶腋密排的六瓣紫色长花穗", "#b3a0b6", flowers.slice(i, i + 3)));
  }
  return parts;
}

function foxnutPlant(): ModelPart[] {
  const parts: ModelPart[] = [];
  for (let blade = 0; blade < 4; blade++) {
    const a = blade * 2.4, root: Triple = [Math.cos(a) * 0.57, 0.07 + blade % 2 * 0.018, Math.sin(a) * 0.57], radius = 0.47 + blade % 2 * 0.12;
    parts.push(tapered("芡实从根颈伸到叶盘下中央的粗刺叶柄", pale, [[0, 0, 0], root], [0.014, 0.01]));
    const top: { x: number; y: number; z: number }[] = [{ x: 0, y: 0.006, z: 0 }], faces: number[] = [];
    for (let ring = 1; ring <= 3; ring++) for (let i = 0; i < 40; i++) {
      const angle = i * Math.PI / 20, r = radius * ring / 3 * (1 + Math.sin(angle * 9) * 0.02), x = Math.cos(angle) * r, z = Math.sin(angle) * r;
      top.push({ x, y: 0.006 + (Math.cos(x * 15) * Math.cos(z * 13) - 1) * 0.009, z });
    }
    for (let i = 0; i < 40; i++) faces.push(0, 1 + (i + 1) % 40, 1 + i);
    for (let ring = 0; ring < 2; ring++) for (let i = 0; i < 40; i++) { const a = 1 + ring * 40 + i, b = 1 + ring * 40 + (i + 1) % 40, c = a + 40, d = b + 40; faces.push(a, b, c, b, d, c); }
    const count = top.length, vertices = [...top, ...top.map(p => ({ ...p, y: p.y - 0.006 }))], indices = [...faces];
    for (let i = 0; i < faces.length; i += 3) indices.push(faces[i]! + count, faces[i + 2]! + count, faces[i + 1]! + count);
    for (let i = 0; i < 40; i++) { const a = 81 + i, b = 81 + (i + 1) % 40; indices.push(a, b, b + count, a, b + count, a + count); }
    parts.push(part("芡实具有内部起伏网格而无直立围边的巨圆叶盘", "mesh", green, root, [1, 1, 1], [0, 0, 0], { vertices, indices }));
    const spines: ModelPart[] = [];
    for (let i = 0; i < 26; i++) {
      const p = top[1 + i % 3 * 40 + i * 17 % 40]!;
      spines.push(needle("芡实从叶盘实际网格顶点长出的短尖刺", pale, [root[0] + p.x, root[1] + p.y, root[2] + p.z], [root[0] + p.x, root[1] + p.y + 0.017, root[2] + p.z], 0.0018));
    }
    parts.push(combineMeshes("芡实巨叶盘顶面离散的真实立体叶刺", pale, spines));
  }
  const fruitRoot: Triple = [0.12, 0.09, -0.13], fruit = lobe("芡实花下独立的卵形刺果托", green, fruitRoot, [0.12, 0.13, 0.12]);
  parts.push(tapered("芡实短花梗支撑刺果托和紫花", pale, [[0, 0, 0], fruitRoot], [0.012, 0.007]), fruit);
  const spines: ModelPart[] = [];
  for (const v of fruit.vertices!) { const p: Triple = [fruitRoot[0] + v.x * fruit.scale.x, fruitRoot[1] + v.y * fruit.scale.y, fruitRoot[2] + v.z * fruit.scale.z]; spines.push(needle("芡实果托从实际外壳顶点伸出的硬刺", pale, p, [p[0] + v.x * 0.035, p[1] + v.y * 0.035, p[2] + v.z * 0.035], 0.002)); }
  parts.push(combineMeshes("芡实花下刺果托上真正接壳的放射硬刺", pale, spines));
  const petals: ModelPart[] = [], flower: Triple = [fruitRoot[0], fruitRoot[1] + 0.048, fruitRoot[2]];
  for (let ring = 0; ring < 2; ring++) for (let i = 0; i < 8; i++) petals.push(radialBlade("芡实果托顶端开放的狭长紫色花瓣", "#baa9b8", flower, ring ? 0.012 : 0.015, ring ? 0.038 : 0.055, ring ? 43 : 66, i * 45 + ring * 22.5));
  parts.push(combineMeshes("芡实宽刺叶之间低于莲花的独立紫色花冠", "#baa9b8", petals), lobe("芡实紫花内独立的浅色花心", cream, [flower[0], flower[1] + 0.012, flower[2]], [0.025, 0.025, 0.025]));
  return parts;
}

export const herbaceousExpansionBatchSixDesigns: MasterNatureDesign[] = [
  design("softTreeFernPlant", "南极软树蕨", "植物", softTreeFern, ["Dicksonia antarctica", "真实纤维根披干及三回深裂的大冠叶"]),
  design("brackenFernPlant", "蕨菜", "植物", bracken, ["Pteridium aquilinum", "长裸叶柄与三向展开的大三角复叶"]),
  design("forkedFernPlant", "芒萁", "植物", forkedFern, ["Dicranopteris pedata", "Dicranopteris dichotoma", "反复二叉叶轴与叉间休眠芽及终端羽片列"]),
  design("braineaFernPlant", "苏铁蕨", "植物", brainea, ["Brainea insignis", "短粗鳞基根茎与密列窄线羽片而无苏铁球花"]),
  design("goldenDogFernPlant", "狗脊", "植物", goldenDogFern, ["Cibotium barometz", "低根茎金黄长毛与长叶柄三回深裂大叶"]),
  design("bambooFernPlant", "凤丫蕨", "植物", bambooFern, ["Coniogramme japonica", "高叶柄二回羽状叶上的宽粗齿羽片"]),
  design("orientalBlechnumPlant", "乌毛蕨", "植物", orientalBlechnum, ["Blechnopsis orientalis", "Blechnum orientale", "长叶柄下段退化耳羽与上部不再分裂的长羽片"]),
  design("tuberSwordFernPlant", "肾蕨", "植物", tuberSwordFern, ["Nephrolepis cordifolia", "密丛叶轴及带偏心耳基的紧排小羽片"]),
  design("purpleLoosestrifePlant", "千屈菜", "植物", purpleLoosestrife, ["Lythrum salicaria", "四棱秆三轮生狭叶和六瓣紫色长花穗"]),
  design("foxnutPlant", "芡实植株", "植物", foxnutPlant, ["Euryale ferox", "巨幅凹凸刺叶盘及真正带硬刺果托的低紫花"]),
];
