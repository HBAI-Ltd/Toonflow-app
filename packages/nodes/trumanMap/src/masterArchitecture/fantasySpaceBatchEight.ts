import { ShapeUtils, Vector2 } from "three";
import { part, type ModelPart, type Triple } from "../assetModelParts";
import { polygon } from "../masterNature/shared";
import { box, design, rail } from "./structures";
import { stairFlight } from "./fantasySpaceBatchFive";

const stone = "#a7b4a7", rib = "#c0c6b0", floor = "#919e8f";
export type VaultFrame = { x: number; z: number; height: number; nx: number; nz: number; yaw: number };

export function vaultFrames(path: [number, number, number][]): VaultFrame[] {
  return path.map(([x, z, height], index) => {
    const a = path[Math.max(0, index - 1)]!, b = path[Math.min(path.length - 1, index + 1)]!, dx = b[0] - a[0], dz = b[1] - a[1], length = Math.hypot(dx, dz);
    return { x, z, height, nx: dz / length, nz: -dx / length, yaw: Math.atan2(dx, dz) * 180 / Math.PI };
  });
}

export function sectionLoft(name: string, color: string, frames: VaultFrame[], section: (height: number) => [number, number][]): ModelPart {
  const profiles = frames.map(frame => {
    const profile = section(frame.height);
    return ShapeUtils.isClockWise(profile.map(([x, y]) => new Vector2(x, y))) ? profile : profile.reverse();
  });
  const points = frames.map((frame, row) => profiles[row]!.map(([x, y]) => ({ x: frame.x + x * frame.nx, y, z: frame.z + x * frame.nz })));
  const vertices: { x: number; y: number; z: number }[] = [], indices: number[] = [];
  // 同一片墙或屋面内部连成四边面，各个折脊面分顶点，保持硬边而不混入邻面法线。
  for (let row = 0; row < frames.length - 1; row++) for (let edge = 0; edge < profiles[row]!.length; edge++) {
    const next = (edge + 1) % profiles[row]!.length, start = vertices.length;
    vertices.push(points[row]![edge]!, points[row + 1]![edge]!, points[row + 1]![next]!, points[row]![next]!);
    indices.push(start, start + 1, start + 2, start, start + 2, start + 3);
  }
  for (const row of [0, frames.length - 1]) {
    const profile = profiles[row]!;
    for (const face of ShapeUtils.triangulateShape(profile.map(([x, y]) => new Vector2(x, y)), [])) {
      const [a, b, c] = face.map(index => profile[index!]!) as [[number, number], [number, number], [number, number]], cross = (b[0] - a[0]) * (c[1] - a[1]) - (b[1] - a[1]) * (c[0] - a[0]);
      const order = (cross > 0) === (row === 0) ? [face[0]!, face[2]!, face[1]!] : face;
      const start = vertices.length;
      vertices.push(...order.map(index => points[row]![index!]!)); indices.push(start, start + 1, start + 2);
    }
  }
  return part(name, "mesh", color, [0, .35, 0], [1, 1, 1], [0, 0, 0], { vertices, indices });
}

function crystalReturnPalace(): ModelPart[] {
  const frames = vaultFrames([[-18, -15, 9.5], [-18, 0, 11.5], [-8, 12, 14], [6, 12, 14.5], [18, 0, 11], [18, -15, 9]]);
  const section = (height: number): [number, number][] => [[-6, 0], [-6, height * .38], [-3.8, height * .72], [0, height], [3.8, height * .72], [6, height * .38], [6, 0], [5.6, 0], [5.6, height * .38 - .12], [3.53, height * .72 - .28], [0, height - .48], [-3.53, height * .72 - .28], [-5.6, height * .38 - .12], [-5.6, 0]];
  const parts: ModelPart[] = [sectionLoft("沿连续折返中轴连成的完整厚壁折脊宫壳", stone, frames, section),
    sectionLoft("与宫壳共用真实截面边界的连续落地地坪", floor, frames, () => [[-6, 0], [6, 0], [6, -.35], [-6, -.35]])];
  for (const frame of frames) {
    const height = frame.height;
    parts.push(part("从左右落地厚墙连过折脊的完整内拱肋", "extrude", rib, [frame.x, .35, frame.z], [1, 1, 1], [0, frame.yaw, 0], { depth: .28, profile: [{ x: -6, y: 0 }, { x: -6, y: height * .38 }, { x: -3.8, y: height * .72 }, { x: 0, y: height }, { x: 3.8, y: height * .72 }, { x: 6, y: height * .38 }, { x: 6, y: 0 }, { x: 5.4, y: 0 }, { x: 5.4, y: height * .38 - .18 }, { x: 3.4, y: height * .72 - .4 }, { x: 0, y: height - .7 }, { x: -3.4, y: height * .72 - .4 }, { x: -5.4, y: height * .38 - .18 }, { x: -5.4, y: 0 }] }));
  }
  for (const x of [-18, 18]) parts.push(box("两端高门洞外侧低一级的落地入口踏台", x, .0875, -15.75, 12, .175, .5, floor), box("高门洞内沿与连续地坪齐平的上一级踏台", x, .175, -15.25, 12, .35, .5, floor));
  return parts;
}

function canyonRidgeResidence(): ModelPart[] {
  const frames = vaultFrames([[0, -20, 13], [0, -7, 13], [5, 5, 13], [0, 17, 13], [0, 26, 13]]), wood = "#8a8065";
  const left: [number, number][] = [[-3, -.35], [-11, -.35], [-11, 6], [-8, 13], [-3, 10], [-3, 9.6], [-7.7, 12.3], [-10.4, 5.9], [-10.4, 0], [-3, 0]];
  const right: [number, number][] = [[3, -.35], [11, -.35], [11, 8], [8, 15], [3, 12], [3, 11.6], [7.7, 14.3], [10.4, 7.9], [10.4, 0], [3, 0]];
  const parts: ModelPart[] = [sectionLoft("岩脊左半连续斜厚外壁与向峡厅挑出的整片岩檐", stone, frames, () => [...left]),
    sectionLoft("岩脊右半高出左翼并形成完整窟廊的厚壳", stone, frames, () => [...right]),
    sectionLoft("两端贯穿折线峡厅的连续落地通行地坪", floor, frames, () => [[-3, 0], [3, 0], [3, -.35], [-3, -.35]])];
  for (const side of [-1, 1]) {
    const top = side < 0 ? 4.2 : 6, bottom = top - .35, x = side * 5.95, rise = (top - .35) / (side < 0 ? 19 : 28), count = side < 0 ? 19 : 28;
    const minX = side < 0 ? -10.4 : 3, maxX = side < 0 ? -3 : 10.4, holeEnd = -18.7 + (count - 1) * .3 + .15;
    parts.push(polygon("首段上层窟廊楼板在完整登层楼梯上方留真实梯洞", wood, [[minX, -20], [maxX, -20], [maxX, -7], [minX, -7]], .35, [0, bottom, 0], [[[x - .85, -18.85], [x + .85, -18.85], [x + .85, holeEnd], [x - .85, holeEnd]]]),
      sectionLoft("沿岩脊折线连续接向后端的上层居廊地板", wood, frames.slice(1), () => side < 0 ? [[-10.4, top - .35], [-3, top - .35], [-3, bottom - .35], [-10.4, bottom - .35]] : [[3, top - .35], [10.4, top - .35], [10.4, bottom - .35], [3, bottom - .35]]),
      stairFlight(x, -18.7, .35, 0, Math.min(count, 20), rise, .3));
    if (count > 20) parts.push(stairFlight(x, -18.7, .35, 20, count - 20, rise, .3));
    for (let index = 0; index < frames.length; index++) {
      const frame = frames[index]!, at = (offset: number, y: number): Triple => [frame.x + offset * frame.nx, y, frame.z + offset * frame.nz];
      const support = rail(at(side * 9.8, .35), at(side * 3.2, bottom), .38, rib); support.name = "岩壁底部连接居廊内缘的真实斜承肋"; parts.push(support);
      if (index > 0 && index < frames.length - 1) {
        const lower = side < 0 ? [[-10.4, 0], [-5, 0], [-5, bottom - .35], [-10.4, bottom - .35]] : [[5, 0], [10.4, 0], [10.4, bottom - .35], [5, bottom - .35]];
        const upper = side < 0 ? [[-10.4, top - .35], [-5, top - .35], [-5, 10.65], [-7.7, 12.2], [-10.4, 5.8]] : [[5, top - .35], [10.4, top - .35], [10.4, 7.8], [7.7, 14.2], [5, 12.65]];
        parts.push(part("下层窟居横隔墙在峡边保留连续公共廊", "extrude", stone, [frame.x, .35, frame.z], [1, 1, 1], [0, frame.yaw, 0], { depth: .22, profile: lower.map(([x, y]) => ({ x: x!, y: y! })) }),
          part("上层窟居横隔墙实际承接斜屋壳并让出前廊", "extrude", stone, [frame.x, .35, frame.z], [1, 1, 1], [0, frame.yaw, 0], { depth: .22, profile: upper.map(([x, y]) => ({ x: x!, y: y! })) }));
      }
    }
    for (let index = 0; index < frames.length - 1; index++) {
      const a = frames[index]!, b = frames[index + 1]!, start: Triple = [a.x + side * 3 * a.nx, top + .95, a.z + side * 3 * a.nz], end: Triple = [b.x + side * 3 * b.nx, top + .95, b.z + side * 3 * b.nz];
      const dx = end[0] - start[0], dz = end[2] - start[2], length = Math.hypot(dx, dz);
      if (index === 2) { start[0] += dx / length; start[2] += dz / length; }
      if (index + 1 === 2) { end[0] -= dx / length; end[2] -= dz / length; }
      const guard = rail(start, end, .07, wood); guard.name = "上层居廊沿峡厅空腔设置且在过桥处断开的护栏"; parts.push(guard);
      for (const p of [...(index === 0 || index === 2 ? [start] : []), end]) { const post = rail([p[0], top, p[2]], p, .055, wood); post.name = "与上层地板实际相接的护栏短柱"; parts.push(post); }
    }
    for (const frame of [frames[0]!, frames.at(-1)!]) {
      const p: Triple = [frame.x + side * 3 * frame.nx, top, frame.z + side * 3 * frame.nz], q: Triple = [frame.x + side * 10.4 * frame.nx, top + .95, frame.z + side * 10.4 * frame.nz];
      const guard = rail([p[0], top + .95, p[2]], q, .07, wood); guard.name = "居廊端部从外岩壁连向峡边的临空护栏"; parts.push(guard);
      const post = rail(p, [p[0], top + .95, p[2]], .055, wood); post.name = "端部护栏与居廊地板相接的短柱"; parts.push(post);
    }
  }
  const crossing = frames[2]!, at = (x: number, y: number, z = 0): Triple => [crossing.x + x * crossing.nx + z * Math.sin(crossing.yaw * Math.PI / 180), y, crossing.z + x * crossing.nz + z * Math.cos(crossing.yaw * Math.PI / 180)], run = 6.2 / 9;
  const bridge = stairFlight(0, 0, 4.2, 0, 9, .2, run), start = at(-3.1 + run / 2, 0);
  bridge.position.x = start[0]; bridge.position.z = start[2]; bridge.rotation.y = crossing.yaw + 90; bridge.name = "横跨峡厅并从左层逐级接入右层的实承阶桥"; parts.push(bridge);
  const beam = rail(at(-3.2, 4.05), at(3.2, 4.05), .3, rib); beam.name = "整段阶桥下方与两端斜承相接的横梁"; parts.push(beam);
  for (const side of [-1, 1]) {
    const brace = rail(at(side * 2.9, .35), at(side * 2.2, 4.05), .32, rib); brace.name = "由峡厅地坪承托阶桥横梁的独立斜柱"; parts.push(brace);
    const guard = rail(at(-3.1, 5.15, side * .68), at(3.1, 6.95, side * .68), .07, wood); guard.name = "随阶桥坡度连续抬高的两侧扶栏"; parts.push(guard);
    for (const step of [0, 3, 6, 9]) { const y = 4.2 + step * .2, p = -3.1 + step * run, post = rail(at(p, y, side * .68), at(p, y + .95, side * .68), .055, wood); post.name = "阶桥踏面上真实落座的扶栏短柱"; parts.push(post); }
  }
  for (const [z, direction] of [[-20, -1], [26, 1]]) parts.push(box("峡厅两端低一级的落地入口踏台", 0, .0875, z! + direction! * .75, 6, .175, .5, floor), box("峡厅入口踏台与室内连续地坪齐平的高一级", 0, .175, z! + direction! * .25, 6, .35, .5, floor));
  return parts;
}

export const fantasySpaceBatchEightDesigns = [
  design("折返晶谷长宫", "连续厚壁折脊宫壳随U形地坪转入中央长厅，两端完整高门洞面向前庭，渐升截面在后部形成高耸会居空间，内拱肋从地坪两边连过整条屋脊", crystalReturnPalace, "建筑", "奇幻"),
  design("剖腹岩脊阶居", "左右高低岩壳沿折线峡厅围出上下窟居与公共廊，首段实承长梯穿过真实楼板洞口登层，中央阶桥跨越空腔并接入两侧不同标高居廊，斜承肋连接落地岩壁与廊板内缘", canyonRidgeResidence, "建筑", "奇幻"),
];
