import { Euler, Quaternion } from "three";
import { combineMeshes } from "../masterNature/shared";
import { part, type ModelPart, type Triple } from "../assetModelParts";
import { box, cylinder, design, pipe, rail } from "./structures";
import { boxBatch, hardPlan, profileBody, riseSteps } from "./everydayOutdoorSpaceBatchOne";

const paving = "#b9b6a3", grass = "#8da27f", stone = "#a9afa2", metal = "#70857c", white = "#d9dcc7", flagColor = "#b88667";

// 原创场景几何采用105×68米名义比赛地面，区域线与球门参数按IFAB Law 1。
// https://www.theifab.com/laws/latest/the-field-of-play/
function circle(radius: number): [number, number][] { return Array.from({ length: 40 }, (_, i) => { const a = i * Math.PI / 20; return [Math.cos(a) * radius, Math.sin(a) * radius]; }); }

function paintedArc(name: string, x: number, z: number, radius: number, start: number, sweep: number, mirrorZ = 1): ModelPart {
  const outside = Array.from({ length: 21 }, (_, i): [number, number] => { const a = start + sweep * i / 20; return [x + Math.sin(a) * radius, z + mirrorZ * Math.cos(a) * radius]; }), inside = Array.from({ length: 21 }, (_, i): [number, number] => { const a = start + sweep * (20 - i) / 20; return [x + Math.sin(a) * (radius - .12), z + mirrorZ * Math.cos(a) * (radius - .12)]; });
  return hardPlan(name, white, [...outside, ...inside], .005, [0, .24, 0]);
}

function goal(): ModelPart[] {
  const front = 0, top = 2.74, bottom = .26, rearTop = .8, rearBottom = 2.2, parts: ModelPart[] = [], strings: ModelPart[] = [];
  const corners = Array.from({ length: 4 }, (_, i) => { const a = i * Math.PI / 2; return { x: Math.cos(a) / 2, z: Math.sin(a) / 2 }; }), vertices = [-.5, .5, -.5, .5].flatMap(y => corners.map(p => ({ ...p, y }))), indices: number[] = [8, 9, 10, 8, 10, 11, 12, 14, 13, 12, 15, 14];
  for (let i = 0; i < 4; i++) { const j = (i + 1) % 4; indices.push(i, i + 4, j + 4, i, j + 4, j); }
  const template = part("球门网绳完整四面闭合细棱柱", "mesh", white, [0, 0, 0], [1, 1, 1], [0, 0, 0], { vertices, indices });
  const cord = (a: Triple, b: Triple) => { const frame = rail(a, b, .008, white); strings.push({ ...template, position: frame.position, rotation: frame.rotation, scale: frame.scale }); };
  for (const side of [-1, 1]) {
    parts.push(cylinder("与门楣同截面且保持真实净宽的球门立柱", side * 3.72, 1.49, front, .12, 2.5, white), pipe("球门上角至后上网框的独立撑杆", [side * 3.72, top, front], [side * 3.72, top, rearTop], .04), pipe("球网后框真正落到地面的斜向撑杆", [side * 3.72, top, rearTop], [side * 3.72, bottom, rearBottom], .04), pipe("球门侧面真实接地的下网框", [side * 3.72, bottom, front], [side * 3.72, bottom, rearBottom], .04));
    for (let i = 0; i <= 14; i++) { const t = i / 14, y = bottom + (top - bottom) * t; cord([side * 3.72, y, front], [side * 3.72, y, 2.2 - 1.4 * t]); }
    for (let i = 1; i <= 10; i++) { const depth = i * .2, y = bottom + (top - bottom) * Math.min(1, (2.2 - depth) / 1.4); cord([side * 3.72, bottom, depth], [side * 3.72, y, depth]); }
  }
  const crossbar = pipe("门内净高2.44米并真实跨接两立柱的球门横梁", [-3.72, top, front], [3.72, top, front], .12); crossbar.color = white;
  parts.push(crossbar, { ...pipe("后上网框完整横撑", [-3.72, top, rearTop], [3.72, top, rearTop], .04), color: white }, { ...pipe("地面后网框完整横撑", [-3.72, bottom, rearBottom], [3.72, bottom, rearBottom], .04), color: white });
  for (let i = 0; i <= 32; i++) { const x = -3.72 + i * 7.44 / 32; cord([x, top, rearTop], [x, bottom, rearBottom]); cord([x, top, front], [x, top, rearTop]); }
  for (let i = 0; i <= 14; i++) { const t = i / 14, y = bottom + (top - bottom) * t, z = 2.2 - 1.4 * t; cord([-3.72, y, z], [3.72, y, z]); }
  for (let i = 0; i <= 4; i++) { const z = i * .2; cord([-3.72, top, z], [3.72, top, z]); }
  // ACT: 保留全部网孔，每根细绳使用完整四侧面和独立端帽；30根一组480顶点，减少端帽重复与细面开销。
  for (let offset = 0; offset < strings.length; offset += 30) parts.push(combineMeshes("球门后网侧网及顶网真实细绳合批", white, strings.slice(offset, offset + 30)));
  return parts;
}

function placeGoal(parts: ModelPart[], end: number): ModelPart[] {
  const turn = new Quaternion().setFromEuler(new Euler(0, end < 0 ? Math.PI : 0, 0));
  // ACT: 两端使用同一局部球网几何，旋转整体再移到门线上，导出时可复用同一缓冲。
  return parts.map(value => { const current = new Euler(value.rotation.x * Math.PI / 180, value.rotation.y * Math.PI / 180, value.rotation.z * Math.PI / 180), rotation = new Euler().setFromQuaternion(turn.clone().multiply(new Quaternion().setFromEuler(current))); return { ...value, position: { x: end * value.position.x, y: value.position.y, z: end * (52.44 + value.position.z) }, rotation: { x: rotation.x * 180 / Math.PI, y: rotation.y * 180 / Math.PI, z: rotation.z * 180 / Math.PI } }; });
}

export const everydayOutdoorSpaceBatchEightDesigns = [
  design("完整十一人制足球比赛场", "105×68米比赛地面带完整边线、中圈、禁区和罚球弧，两端球门保留7.32米净宽与2.44米净高及真实网孔，两侧分段阶席和正常步高观众通路与场外公共步带相连，四角独立旗杆标出场界", () => {
    const outer: [number, number][] = [[-47, -67], [47, -67], [47, 67], [-47, 67]], turf: [number, number][] = [[-39, -59], [39, -59], [39, 59], [-39, 59]], parts: ModelPart[] = [hardPlan("完整比赛场与两侧观众路线共用落地基础", stone, outer, .2), hardPlan("超出边线并保留安全退距的完整比赛草坪", grass, turf, .04, [0, .2, 0]), hardPlan("沿草坪外围连续贯通的公共步行带", paving, outer, .02, [0, .2, 0], [turf])], longLines: Triple[] = [[-33.94, .2425, 0], [33.94, .2425, 0]], acrossLines: Triple[] = [[0, .2425, -52.44], [0, .2425, 0], [0, .2425, 52.44]], penaltySides: Triple[] = [], penaltyFronts: Triple[] = [], goalSides: Triple[] = [], goalFronts: Triple[] = [];
    const goalParts = goal();
    for (const end of [-1, 1]) {
      for (const side of [-1, 1]) { penaltySides.push([side * 20.1, .2425, end * 44.25]); goalSides.push([side * 9.1, .2425, end * 49.75]); }
      penaltyFronts.push([0, .2425, end * 36.06]); goalFronts.push([0, .2425, end * 47.06]);
      const angle = Math.acos(5.5 / 9.15); parts.push(paintedArc("仅位于禁区外部且接到禁区前线的罚球弧", 0, end * 41.5, 9.15, -angle, angle * 2, -end), cylinder("距球门线背缘十一米的独立罚球标点", 0, .2425, end * 41.5, .18, .005, white), ...placeGoal(goalParts, end));
    }
    parts.push(...boxBatch("完整比赛场两条连续边线", white, longLines, [.12, .005, 105]), ...boxBatch("完整两球门线与中央分场线", white, acrossLines, [68, .005, .12]), ...boxBatch("两禁区实际独立的纵向边线", white, penaltySides, [.12, .005, 16.5]), ...boxBatch("两禁区前方完整横向边线", white, penaltyFronts, [40.32, .005, .12]), ...boxBatch("两球门区独立纵向边线", white, goalSides, [.12, .005, 5.5]), ...boxBatch("两球门区完整横向边线", white, goalFronts, [18.32, .005, .12]), hardPlan("以真实开孔环带形成的完整九点一五米中圈", white, circle(9.15), .005, [0, .24, 0], [circle(9.03)]), cylinder("完整比赛地面的中央开球点", 0, .2425, 0, .18, .005, white));
    for (const side of [-1, 1]) for (const end of [-1, 1]) {
      const x = side * 34, z = end * 52.5, corner: [number, number][] = [];
      for (let i = 0; i <= 8; i++) { const a = i * Math.PI / 16; corner.push([x - side * Math.cos(a), z - end * Math.sin(a)]); }
      for (let i = 8; i >= 0; i--) { const a = i * Math.PI / 16; corner.push([x - side * .88 * Math.cos(a), z - end * .88 * Math.sin(a)]); }
      parts.push(hardPlan("完整球场四角位于场内的一米四分之一角球弧", white, corner, .005, [0, .24, 0]), cylinder("球场角点真实接地且非尖顶的独立旗杆", x, .99, z, .04, 1.5, white), profileBody("直接接到角旗杆上部的独立三角布旗", flagColor, [[0, 0], [.45, -.12], [0, -.35]], .008, [x, 1.74, z], side > 0 ? 0 : 180));
    }
    const terrace: [number, number][] = [[0, .2]], lowerGuard: [number, number][] = [];
    for (let row = 0; row < 5; row++) { const y = .55 + row * .35; terrace.push([row * .9, y], [(row + 1) * .9, y]); lowerGuard.push([row * .9, y], [(row + 1) * .9, y]); }
    terrace.push([4.5, .2]); const guard = [...lowerGuard, ...lowerGuard.slice().reverse().map(([x, y]): [number, number] => [x, y + 1.1])];
    for (const side of [-1, 1]) {
      for (const [low, high] of [[-45, -17], [-13, 13], [17, 45]]) parts.push(profileBody("两侧分段看台真正落地且整体成形的连续阶席", stone, terrace, high! - low!, [side * 40.05, 0, (low! + high!) / 2], side > 0 ? 0 : 180));
      for (const z of [-15, 15]) { const stair = riseSteps("观众由前方公共步道正常步高接入各排阶席的横向登阶", .2, 1.95, 10, .45, 2.8, [side * 40.05, 0, z]); stair.rotation.y = side > 0 ? 0 : 180; parts.push(stair); }
      parts.push(box("看台背缘真实落地并高出末排的连续防护墙", side * 44.55, 1.625, 0, .15, 2.85, 90, metal));
      for (const z of [-45, 45]) parts.push(profileBody("看台尽端随各排标高升起且不封中部登阶的完整护边", metal, guard, .1, [side * 40.05, 0, z], side > 0 ? 0 : 180));
    }
    return parts;
  }, "设施", "现代"),
];
