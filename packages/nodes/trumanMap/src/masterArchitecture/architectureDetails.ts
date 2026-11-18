import type { Box3 } from "three";
import type { ModelPart } from "../assetModelParts";
import { addBuildingDetails } from "./buildingDetailing";
import { shade } from "./chineseRoofKit";
import { worldBox } from "./chineseWallDressing";
import { dressColumns } from "./columnStructures";
import { pitchedRoofs } from "./roofRegistry";
import { dressRoundTowers } from "./towerDressing";
import { dressPanels } from "./panelDressing";
import { amphitheaterDetails, crystalHallDetails, speculativeDetails, transitDetails } from "./programDetails";
import { dressVolume, FacadeBuilder, facadeGroups, facadeStyle, type FacadeLook } from "./facadeKit";
import { canHollow, facesOf, findBodies, type Body } from "./legacyBuildings";
import { applyHollows, furnishHollows, type HollowPlan, type ShellInfo } from "./hollowing";
import { bodyHoles } from "./shellRegistry";
import type { Opening } from "./facadeKit";
import { triangles } from "./partMath";

// 程序化建筑族（7 个功能族 × 10 种用途 × 100 种布局）的统一细化：
// 每个体量块补门窗、勒脚、线脚（按功能族取形制），平屋顶补女儿墙和屋顶设备，坡屋顶换成屋面套件。
const BLOCK = /^楼翼\d+主体$|^退台上层房间$/;
const FAMILY_LOOK: FacadeLook[] = ["house", "classical", "shop", "industrial", "modern", "house", "tech"];

export function architectureTheme(design: number): "科幻" | "蒸汽朋克" | "奇幻" | "中式" | undefined {
  const family = Math.floor(design / 1000), program = Math.floor(design / 100) % 10;
  return family === 6 ? program === 0 || program === 4 || program === 8 || program === 9 ? "科幻" : program === 5 ? "蒸汽朋克" : "奇幻" : family === 5 && (program === 2 || program === 4) ? "中式" : undefined;
}

export function refineArchitecture(parts: ModelPart[], design: number, name: string) {
  const family = Math.floor(design / 1000), program = Math.floor(design / 100) % 10, theme = architectureTheme(design);
  const maxParts = 112;
  // 窗带占位片先拿掉：它会被当成玻璃窗、被加上大窗框，也会占住正面窗位；没补成门窗就还回去
  // 屋面换成套件之前先量好每块屋面的外框，立柱按头顶的屋面成组
  const roofBoxes = parts.filter(value => pitchedRoofs.has(value)).map(value => worldBox(value)).filter((box): box is Box3 => !!box);
  const strips = parts.filter(value => value.name === "纵向采光窗带");
  for (const strip of strips) parts.splice(parts.indexOf(strip), 1);
  try { addBuildingDetails(parts, theme, undefined, "建筑", name, maxParts); } catch { /* 保持原样 */ }
  try { parts.push(...dressColumns(parts, theme, maxParts - parts.length - 2, { bases: theme === "中式", rails: family === 5 && program !== 3 && program !== 6, roofs: roofBoxes })); } catch { /* 保持原样 */ }
  try { const glass = facadeStyle(theme, "house", "#999999", 0); parts.push(...dressRoundTowers(parts, theme, maxParts - parts.length - 2, { pane: glass.pane, frame: glass.frame })); } catch { /* 保持原样 */ }
  let dressed = false, plans: HollowPlan[] = [];
  try { const result = dressBlocks(parts, family, program, design, theme, maxParts); dressed = result.dressed; plans = result.plans; } catch { dressed = false; }
  if (!dressed) parts.push(...strips);
  // 体量块改成空壳（墙上开真的门窗洞），室内家具最后摆，用剩下的部件预算
  let shell: ShellInfo | undefined;
  try { shell = applyHollows(parts, plans, theme, maxParts, .2); } catch { shell = undefined; }
  // 交通族的站台、连桥、顶棚；幻想族的巨柱、种植台、菌冠、太空港舱体
  try {
    const room = maxParts - parts.length - 1;
    const extra = family === 4 ? transitDetails(parts, program) : family === 6 ? [...speculativeDetails(parts, program), ...(program === 3 ? crystalHallDetails(parts) : [])] : family === 5 && program === 6 ? amphitheaterDetails(parts) : [];
    for (const value of extra) { if (parts.length >= maxParts - 1 || extra.indexOf(value) >= room) break; parts.push(value); }
  } catch { /* 保持原样 */ }
  // 幻想建筑族的舱体外壳：科幻、蒸汽朋克铺面板和灯带
  if (family === 6) { try { parts.push(...dressPanels(parts, theme, maxParts - parts.length, design, 160)); } catch { /* 保持原样 */ } }
  try { if (shell) furnishHollows(parts, theme, name, maxParts, shell); } catch { /* 保持原样 */ }
}

function dressBlocks(parts: ModelPart[], family: number, program: number, design: number, theme: string | undefined, maxParts: number): { dressed: boolean; plans: HollowPlan[] } {
  const plans: HollowPlan[] = [], none = { dressed: false, plans };
  const blocks = parts.filter(value => value.shape === "box" && BLOCK.test(value.name) && value.rotation.y === 0 && value.rotation.x === 0 && value.rotation.z === 0);
  const named: Body[] = blocks.map(value => ({ part: value, box: worldBox(value) as Box3, vol: { cx: value.position.x, cz: value.position.z, yaw: 0, hx: value.scale.x / 2, hz: value.scale.z / 2, y0: value.position.y - value.scale.y / 2, y1: value.position.y + value.scale.y / 2 } }));
  // 命名体量块之外，舱体、岗亭、站房等实心体量按几何识别
  const bodies: Body[] = [...named, ...findBodies(parts).filter(body => !named.some(other => other.part === body.part))];
  if (!bodies.length) return none;
  const room = maxParts - parts.length;
  let budget = 48000 - parts.reduce((sum, value) => sum + triangles(value), 0);
  if (room < 6 || budget < 6000) return none;
  const seed = design;
  const look: FacadeLook = theme === "科幻" ? "tech" : theme === "蒸汽朋克" ? "classical" : theme === "奇幻" ? "house" : FAMILY_LOOK[family] ?? "house";
  const wall = bodies[0]!.part.color;
  const style = facadeStyle(theme, look, wall, seed);
  const b = new FacadeBuilder();
  facadeGroups(b, style);
  // 体量里的楼层数：数该体量中心上的"可见楼层檐带"
  const bands = parts.filter(value => value.name === "可见楼层檐带");
  const perBody = Math.max(60, Math.floor(room * 16 / bodies.length));
  let any = false;
  for (const body of bodies) {
    const v = body.vol, count = 1 + bands.filter(band => Math.abs(band.position.x - v.cx) < .2 && Math.abs(band.position.z - v.cz) < .2).length;
    const { faces } = facesOf(body, parts, bodies, 0);
    // 体量局部：每块只给一扇门，朝正面
    const local = { ...style, wall: body.part.color, trim: shade(body.part.color, look === "tech" || look === "industrial" ? 1.2 : 1.14), plinth: shade(body.part.color, .7) };
    // 空壳：体量够大、不压住别的体量，部件预算够造墙板；已有的玻璃窗、门贴片（程序化块里没有）按旧库的办法处理
    const storeys = named.includes(body) ? count : Math.max(1, Math.round((v.y1 - v.y0) / style.storey));
    const hollow = canHollow(body, bodies) && room >= 30 + plans.length * 3, collect: Opening[] = [], volume = { ...v, storeys };
    const result = dressVolume(b, volume, faces, local, { door: true, seed, maxBoxes: perBody, hollow, collect });
    if (result.windows + result.doors > 0) any = true;
    if (hollow && collect.length <= 60) { plans.push({ body, storeys, openings: collect, removeParts: [], glassParts: [], style }); bodyHoles.set(body.part, collect); }
  }
  if (!any) return none;
  const made = b.parts();
  let count = 0;
  for (const value of made) {
    if (parts.length >= maxParts || count >= room || triangles(value) > budget - 1500) break;
    parts.push(value); budget -= triangles(value); count++;
  }
  return { dressed: true, plans };
}
