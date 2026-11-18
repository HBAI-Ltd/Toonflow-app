import { Quaternion, Vector3 } from "three";
import { combineMeshes, design, lobe, part, polygon, sweptProfile, tapered } from "./shared";
import type { MasterNatureDesign, ModelPart, Triple } from "./shared";
import { convexValve } from "./bivalveArchitectures";

const tissue = "#c3c8b2";
const pale = "#d3d5be";
const warm = "#bd9a86";
const deep = "#a17d76";

function fineFilament(name: string, path: Triple[], radii: number[], color = tissue): ModelPart {
  const vertices: { x: number; y: number; z: number }[] = [], indices: number[] = [];
  for (let i = 0; i < path.length; i++) {
    const rotation = new Quaternion().setFromUnitVectors(new Vector3(0, 1, 0), new Vector3(...path[Math.min(i + 1, path.length - 1)]!).sub(new Vector3(...path[Math.max(0, i - 1)]!)).normalize());
    for (let j = 0; j < 3; j++) { const a = j * Math.PI * 2 / 3, p = new Vector3(Math.cos(a) * radii[i]!, 0, Math.sin(a) * radii[i]!).applyQuaternion(rotation).add(new Vector3(...path[i]!)); vertices.push({ x: p.x, y: p.y, z: p.z }); }
    if (i) for (let j = 0; j < 3; j++) { const a = (i - 1) * 3 + j, b = (i - 1) * 3 + (j + 1) % 3; indices.push(a, a + 3, b, b, a + 3, b + 3); }
  }
  const start = vertices.length, end = start + 1, a = path[0]!, b = path.at(-1)!, offset = (path.length - 1) * 3; vertices.push({ x: a[0], y: a[1], z: a[2] }, { x: b[0], y: b[1], z: b[2] });
  for (let j = 0; j < 3; j++) indices.push(start, j, (j + 1) % 3, end, offset + (j + 1) % 3, offset + j);
  return part(name, "mesh", color, [0, 0, 0], [1, 1, 1], [0, 0, 0], { vertices, indices });
}

function ribbonArm(name: string, path: Triple[], widths: number[], yaw: number, color: string, frill = 0): ModelPart {
  const vertices: { x: number; y: number; z: number }[] = [], indices: number[] = [];
  for (let i = 0; i < path.length; i++) for (const side of [-1, 1]) { const p = path[i]!, w = widths[i]! * (1 + Math.sin(i * 2.2) * frill); vertices.push({ x: p[0] + Math.cos(yaw) * w * side, y: p[1] + Math.sin(i * 2.6 + side) * w * frill, z: p[2] + Math.sin(yaw) * w * side }); }
  const count = vertices.length; vertices.push(...vertices.map(p => ({ ...p })));
  for (let i = 0; i < path.length - 1; i++) { const a = i * 2, b = a + 2; indices.push(a, b, a + 1, a + 1, b, b + 1, count + a, count + a + 1, count + b, count + a + 1, count + b + 1, count + b); }
  return part(name, "mesh", color, [0, 0, 0], [1, 1, 1], [0, 0, 0], { vertices, indices });
}

function bell(name: string, radius: number, base: number, height: number, color: string, lobes = 0): ModelPart {
  const thickness = Math.max(.004, radius * .032), profile: [number, number][] = [[0, base + height], [radius * .34, base + height * .94], [radius * .69, base + height * .68], [radius * .91, base + height * .28], [radius, base], [radius - thickness, base], [radius * .88, base + height * .25], [radius * .66, base + height * .61], [radius * .32, base + height * .86], [0, base + height - thickness]];
  const result = sweptProfile(name, color, profile, Math.PI * 2, 32);
  if (lobes) for (const p of result.vertices!) { const angle = Math.atan2(p.z, p.x), low = Math.max(0, 1 - (p.y - base) / (height * .45)), swell = 1 + Math.cos(angle * lobes) * .065 * low; p.x *= swell; p.z *= swell; p.y += Math.cos(angle * lobes) * radius * .025 * low; }
  return result;
}

// https://www.mbari.org/animal/giant-phantom-jelly/
function giantPhantomJelly(): ModelPart[] {
  const parts: ModelPart[] = [bell("冥河水母没有边缘触须的大而平缓伞体", .6, 4.66, .45, deep)];
  for (let arm = 0; arm < 4; arm++) {
    const a = arm * Math.PI / 2, path: Triple[] = Array.from({ length: 17 }, (_, i) => { const t = i / 16, wave = Math.sin(t * Math.PI * 2.4 + arm) * .25 * t; return [Math.cos(a) * (.13 + wave), 4.72 - t * (4.53 - arm * .045), Math.sin(a) * (.13 + wave) + Math.cos(t * Math.PI * 2.1 + arm) * .1 * t]; }), widths = path.map((_, i) => .075 + Math.sin(i / 16 * Math.PI) * .09 - i / 16 * .025);
    parts.push(ribbonArm("冥河水母四条直接接在伞下的宽长口腕带", path, widths, a + Math.PI / 2, deep));
  }
  return parts;
}

// https://www.marlin.ac.uk/species/detail/2090/1000
function lionsManeJelly(): ModelPart[] {
  const parts: ModelPart[] = [bell("狮鬃水母有八个伞缘组区的宽扁伞", .82, 3.7, .44, warm, 8)], hairs: ModelPart[] = [];
  for (let group = 0; group < 8; group++) for (let i = 0; i < 70; i++) {
    const a = group * Math.PI / 4 + (i % 10 - 4.5) * .018, radius = .65 + Math.floor(i / 10) * .014, length = 2.5 + (i * 7 % 19) * .05 + group % 3 * .13, root: Triple = [Math.cos(a) * radius, 3.73, Math.sin(a) * radius], drift = Math.sin(i * 2.4 + group) * .1;
    hairs.push(fineFilament("狮鬃水母八组中每组七十根独立的细长缘下触须", [root, [root[0] + drift, 3.73 - length * .51, root[2] + Math.cos(i) * .1], [root[0] + drift * 1.8, 3.73 - length, root[2] + Math.cos(i + .2) * .17]], [.0019, .0012, .00025], warm));
  }
  for (let i = 0; i < hairs.length; i += 42) parts.push(combineMeshes("狮鬃水母保留八簇真实分组的密集独立细须", warm, hairs.slice(i, i + 42)));
  for (let arm = 0; arm < 4; arm++) { const a = arm * Math.PI / 2, path: Triple[] = Array.from({ length: 14 }, (_, i) => { const t = i / 13; return [Math.cos(a) * (.11 + t * .16) + Math.sin(t * 10 + arm) * .07, 3.75 - t * 1.55, Math.sin(a) * (.11 + t * .16)]; }); parts.push(ribbonArm("狮鬃水母与细缘须分开的四条厚褶口腕", path, path.map((_, i) => .14 - i / 13 * .065), a + Math.PI / 2, tissue, .8)); }
  return parts;
}

// https://kuroshio.or.jp/creature/エチゼンクラゲ/
function nomurasJelly(): ModelPart[] {
  const parts: ModelPart[] = [bell("越前水母无缘须而厚大的圆钟", .91, 1.41, .7, tissue, 16)], folds: ModelPart[] = [];
  for (let arm = 0; arm < 8; arm++) {
    const a = arm * Math.PI / 4, root: Triple = [Math.cos(a) * .12, 1.53, Math.sin(a) * .12], joint: Triple = [Math.cos(a) * .25, .92, Math.sin(a) * .25]; parts.push(tapered("越前水母八条粗壮下垂口腕的主轴", tissue, [root, joint], [.09, .075]));
    for (const side of [-1, 1]) { const angle = a + side * .24, end: Triple = [Math.cos(angle) * .42, .24 + arm % 3 * .055, Math.sin(angle) * .42]; parts.push(tapered("越前水母口腕真正分叉的两个长分枝", tissue, [joint, [Math.cos(angle) * .36, .61, Math.sin(angle) * .36], end], [.073, .055, .005])); for (let i = 0; i < 6; i++) { const t = i / 5; folds.push(lobe("越前水母口腕分枝上的菜花状密褶", pale, [joint[0] + (end[0] - joint[0]) * t + Math.sin(i * 2) * .04, .88 - t * .55, joint[2] + (end[2] - joint[2]) * t], [.14 + i % 2 * .04, .14, .14 + (i + 1) % 2 * .04])); } }
  }
  for (let i = 0; i < folds.length; i += 32) parts.push(combineMeshes("越前水母八叉口腕上的真实厚褶组织", pale, folds.slice(i, i + 32))); return parts;
}

// https://www.mbari.org/news/gulf-of-california-2015-leg-2-midwater-ecology-log-6/
function deepstaria(): ModelPart[] {
  const bag = sweptProfile("袋水母底部完全敞开且没有触须口腕的薄袋伞", tissue, [[0, .85], [.18, .84], [.34, .76], [.42, .55], [.47, .23], [.4, .05], [.394, .05], [.464, .23], [.414, .55], [.334, .754], [.18, .834], [0, .844]], Math.PI * 2, 32); bag.opacity = .46;
  for (const p of bag.vertices!) { const a = Math.atan2(p.z, p.x), t = Math.max(0, Math.min(1, (.85 - p.y) / .8)); p.y += Math.sin(a * 3 + t * 3.5) * .038 * t; }
  const parts: ModelPart[] = [bag], canals: ModelPart[] = [];
  const shellRadii = [[0, 0], [.0125, .18], [.1125, .34], [.375, .42], [.775, .47], [1, .4]];
  const surface = (t: number, angle: number): Triple => { let i = 1; while (shellRadii[i]![0]! < t) i++; const a = shellRadii[i - 1]!, b = shellRadii[i]!, r = a[1]! + (b[1]! - a[1]!) * (t - a[0]!) / (b[0]! - a[0]!), y = .85 - t * .8; return [Math.cos(angle) * (r + .001), y + Math.sin(angle * 3 + t * 3.5) * .038 * t, Math.sin(angle) * (r + .001)]; };
  for (let meridian = 0; meridian < 16; meridian++) { const a = meridian * Math.PI / 8; for (let row = 0; row < 5; row++) { const t = .11 + row * .17; canals.push(fineFilament("袋水母组织内真实相连的纵向胃循环管", [surface(t, a), surface(t + .085, a + .035), surface(t + .17, a)], [.0013, .0013, .0013], pale)); if (row < 4) canals.push(fineFilament("袋伞上互相连通的横向网状胃管", [surface(t + .085, a), surface(t + .085, a + Math.PI / 16), surface(t + .085, a + Math.PI / 8)], [.0013, .0013, .0013], pale)); } }
  for (let i = 0; i < canals.length; i += 42) parts.push(combineMeshes("薄袋伞表面可见且每条相接的网状胃循环管", pale, canals.slice(i, i + 42))); return parts;
}

// https://www.mbari.org/animal/big-red-jelly/
function bigRedJelly(): ModelPart[] {
  const parts: ModelPart[] = [bell("大红水母不具细缘须的高厚半球伞", .47, .55, .39, deep)];
  for (let i = 0; i < 6; i++) { const a = i * Math.PI / 3, end: Triple = [Math.cos(a) * .19, .08 + i % 2 * .065, Math.sin(a) * .19]; parts.push(tapered("大红水母伞下粗短且不分细须的指状口腕", deep, [[Math.cos(a) * .075, .64, Math.sin(a) * .075], [Math.cos(a) * .18, .34, Math.sin(a) * .18], end], [.073, .062, .035]), lobe("大红水母指状口腕圆钝的末端", deep, end, [.082, .087, .082])); }
  return parts;
}

// https://australian.museum/learn/animals/jellyfish/boxjellyfish/
function australianBoxJelly(): ModelPart[] {
  const outline: [number, number][] = [[-.1, -.08], [-.08, -.1], [.08, -.1], [.1, -.08], [.1, .08], [.08, .1], [-.08, .1], [-.1, .08]], inner = outline.map(([x, z]) => [x * .93, z * .93] as [number, number]);
  const walls = polygon("澳洲箱水母真实中空的四壁圆角方钟", tissue, outline, .22, [0, 2.46, 0], [inner]); walls.opacity = .4;
  const roof = convexValve("方钟顶端与四壁连续相接的透明圆顶", outline, .04, .006); roof.position.y = 2.675; roof.color = tissue; roof.opacity = .4;
  const parts: ModelPart[] = [walls, roof], tentacles: ModelPart[] = [];
  for (const x of [-1, 1]) for (const z of [-1, 1]) {
    parts.push(tapered("箱水母四个角上独立而非伞中心的肉质手基", tissue, [[x * .085, 2.485, z * .085], [x * .13, 2.41, z * .13], [x * .115, 2.35, z * .115]], [.013, .019, .011]));
    for (let i = 0; i < 15; i++) { const offset = (i - 7) * .0024, root: Triple = [x * .115 + offset, 2.36, z * .115 - offset], length = 1.6 + (i % 5) * .14, drift = Math.sin(i * 2.4) * .045; tentacles.push(fineFilament("每个角手基分出十五根可辨且各自连接的长触须", [root, [root[0] + drift, 2.36 - length * .48, root[2] + Math.cos(i) * .04], [root[0] + drift * 2, 2.36 - length, root[2] + Math.cos(i + .2) * .07]], [.0017, .0012, .00025], tissue)); }
  }
  for (let i = 0; i < tentacles.length; i += 42) parts.push(combineMeshes("澳洲箱水母按四手基分开的六十根独立触须", tissue, tentacles.slice(i, i + 42))); return parts;
}

// https://actiniaria.com/metridium_farcimen.php
function giantPlumoseAnemone(): ModelPart[] {
  const column = sweptProfile("巨羽海葵窄长平滑的伸展柱及宽附着足盘", tissue, [[0, 0], [.135, 0], [.15, .025], [.11, .08], [.092, .29], [.1, .57], [.14, .73], [.17, .76], [.115, .77], [.07, .72], [0, .71]], Math.PI * 2, 28);
  const disc = sweptProfile("巨羽海葵带真实中央口孔的深褶多瓣口盘", pale, [[.02, .727], [.045, .75], [.13, .77], [.235, .78], [.245, .792], [.13, .783], [.045, .763], [.02, .745]], Math.PI * 2, 32);
  for (const p of disc.vertices!) { const a = Math.atan2(p.z, p.x), r = Math.hypot(p.x, p.z), edge = Math.max(0, (r - .05) / .195), swell = 1 + Math.cos(a * 8) * .11 * edge; p.x *= swell; p.z *= swell; p.y += Math.sin(a * 8) * .037 * edge; }
  const parts: ModelPart[] = [column, disc], tentacles: ModelPart[] = [];
  for (let i = 0; i < 288; i++) { const a = i * 2.39996323, r = .07 + Math.sqrt((i + .5) / 288) * .16, fold = Math.sin(a * 8) * .037 * (r - .05) / .195, root: Triple = [Math.cos(a) * r, .78 + fold, Math.sin(a) * r], end: Triple = [Math.cos(a) * (r + .025), .87 + fold + i % 4 * .012, Math.sin(a) * (r + .025)]; tentacles.push(fineFilament("多褶口盘上密生但不分枝的独立细短触手", [root, [root[0] * 1.05, .842 + fold, root[2] * 1.05], end], [.0017, .0011, .0002], pale)); }
  for (let i = 0; i < tentacles.length; i += 42) parts.push(combineMeshes("巨羽海葵真实密冠而不是十六根粗环须的单触手", pale, tentacles.slice(i, i + 42))); return parts;
}

// https://www.tmsi.nus.edu.sg/wp-content/uploads/05_Lim_Pg%2049-56.pdf
function neptunesCupSponge(): ModelPart[] {
  const cup = sweptProfile("海神杯海绵狭长支茎到宽薄壁巨杯连续的完整活体", tissue, [[0, 0], [.19, 0], [.16, .07], [.09, .44], [.11, .61], [.31, .81], [.58, 1.14], [.69, 1.45], [.663, 1.46], [.553, 1.155], [.285, .84], [.087, .656], [0, .62]], Math.PI * 2, 32);
  for (const p of cup.vertices!) { if (p.y < .62) continue; const a = Math.atan2(p.z, p.x), t = (p.y - .62) / .84; p.y += Math.sin(a * 3 + 1) * .025 * t; const swell = 1 + Math.sin(a * 7 + t * 4) * .012; p.x *= swell; p.z *= swell; }
  return [cup];
}

export const aquaticExpansionBatchTenDesigns: MasterNatureDesign[] = [
  design("giantPhantomJelly", "冥河水母", "动物", giantPhantomJelly, ["Stygiomedusa gigantea", "无缘须大伞及四条宽长带状口腕"]),
  design("lionsManeJelly", "狮鬃水母", "动物", lionsManeJelly, ["Cyanea capillata", "八簇各七十细须与四条厚褶口腕"]),
  design("nomurasJelly", "越前水母", "动物", nomurasJelly, ["Nemopilema nomurai", "无缘须厚钟及八条分枝密褶口腕"]),
  design("deepstaria", "袋水母", "动物", deepstaria, ["Deepstaria enigmatica", "薄壁大开袋与相连网状胃循环管"]),
  design("bigRedJelly", "大红水母", "动物", bigRedJelly, ["Tiburonia granrojo", "高厚无须伞及圆端粗指状口腕"]),
  design("australianBoxJelly", "澳洲箱水母", "动物", australianBoxJelly, ["Chironex fleckeri", "真实小方钟与四角手基六十长触须"]),
  design("giantPlumoseAnemone", "巨羽海葵", "动物", giantPlumoseAnemone, ["Metridium farcimen", "窄高平滑柱真口孔多褶口盘及密冠短须"]),
  design("neptunesCupSponge", "海神杯海绵", "动物", neptunesCupSponge, ["Cliona patera", "狭茎接宽薄杯且有连续真实大腔"]),
];
