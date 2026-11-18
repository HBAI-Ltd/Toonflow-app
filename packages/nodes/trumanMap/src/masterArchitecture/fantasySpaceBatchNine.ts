import { part, type ModelPart, type Triple } from "../assetModelParts";
import { tapered } from "../masterNature/shared";
import { box, cylinder, design, rail } from "./structures";
import { stairFlight } from "./fantasySpaceBatchFive";
import { sectionLoft, vaultFrames } from "./fantasySpaceBatchEight";
import { hardFloor } from "./vernacularWorldBatchSix";
import { combineMeshes } from "../natureParts";
import { meshBeam } from "./vernacularWorldBatchFive";

const bone = "#c2c8b0", membrane = "#9eb5a5", stone = "#919f91", wood = "#8b8064";

function ribBoatAssemblyHall(): ModelPart[] {
  const frames = vaultFrames([[0, -26, 10], [0, -18, 14], [0, -8, 18], [0, 4, 18], [0, 16, 14], [0, 25, 10]]), width = (height: number) => height * .6 + .5;
  const parts: ModelPart[] = [sectionLoft("收尖舟形平面上从撑脚升至长脊的完整厚膜围护", membrane, frames, height => {
    const w = width(height);
    return [[-w, 0], [-w * .85, height * .35], [-w * .5, height * .75], [0, height], [w * .5, height * .75], [w * .85, height * .35], [w, 0], [w - .24, 0], [w * .85 - .2, height * .35 - .1], [w * .5 - .16, height * .75 - .18], [0, height - .3], [-w * .5 + .16, height * .75 - .18], [-w * .85 + .2, height * .35 - .1], [-w + .24, 0]];
  }), sectionLoft("大厅从两端高门厅连过中部会场的完整落地地坪", stone, frames, height => { const w = width(height); return [[-w, 0], [w, 0], [w, -.35], [-w, -.35]]; })];
  for (const frame of frames) {
    const h = frame.height, w = width(h);
    parts.push(tapered("由两侧宽撑脚连续跨过大厅内腔并接入长脊的完整巨肋", bone, [[-w, .35, frame.z], [-w * .85, .35 + h * .35, frame.z], [-w * .5, .35 + h * .75, frame.z], [0, .35 + h, frame.z], [w * .5, .35 + h * .75, frame.z], [w * .85, .35 + h * .35, frame.z], [w, .35, frame.z]], [.38, .34, .29, .24, .29, .34, .38]));
    for (const side of [-1, 1]) parts.push(cylinder("弯肋下方与地面实际接触的宽撑脚石座", side * w, .3, frame.z, 1.2, .6, stone));
  }
  parts.push(tapered("沿全部巨肋顶点连续相接的通长骨脊", bone, frames.map(frame => [0, frame.height + .35, frame.z] as Triple), frames.map(() => .32)));
  for (const side of [-1, 1]) {
    parts.push(sectionLoft("大厅侧边沿收尖壳腹连成的低位步行廊台", wood, frames.slice(1, 5), height => { const w = width(height); return side < 0 ? [[-w + 1.5, .75], [-w + 3.5, .75], [-w + 3.5, 0], [-w + 1.5, 0]] : [[w - 3.5, .75], [w - 1.5, .75], [w - 1.5, 0], [w - 3.5, 0]]; }));
    const frontStair = stairFlight(side * 6.4, -18.75, .35, 0, 3, .25, .3), rearStair = stairFlight(0, 0, .35, 0, 3, .25, .3);
    frontStair.name = "前门厅从大厅平地登上侧边廊台的三步实阶"; rearStair.name = "后门厅朝向侧廊终点反向登临的三步实阶";
    rearStair.position.x = side * 6.4; rearStair.position.z = 16.75; rearStair.rotation.y = 180; parts.push(frontStair, rearStair);
    for (let index = 1; index < 4; index++) {
      const a = frames[index]!, b = frames[index + 1]!, x0 = side * (width(a.height) - 3.5), x1 = side * (width(b.height) - 3.5), guard = rail([x0, 2.05, a.z], [x1, 2.05, b.z], .065, bone);
      guard.name = "低位侧廊面向大厅的连续临空扶栏"; parts.push(guard);
      const post = rail([x0, 1.1, a.z], [x0, 2.05, a.z], .055, bone); post.name = "侧廊扶栏与木廊台实际相接的短柱"; parts.push(post);
      if (index === 3) { const endPost = rail([x1, 1.1, b.z], [x1, 2.05, b.z], .055, bone); endPost.name = "侧廊尾端与廊台相连的护栏短柱"; parts.push(endPost); }
    }
  }
  for (const [z, direction, span] of [[-26, -1, 13], [25, 1, 13]]) parts.push(box("大会堂高门厅前低一级的落地踏台", 0, .0875, z! + direction! * .75, span!, .175, .5, stone), box("高门厅踏台与室内地坪齐平的高一级", 0, .175, z! + direction! * .25, span!, .35, .5, stone));
  return parts;
}

function ellipsePoint(rx: number, ry: number, angle: number, bottom = -100): [number, number] {
  return [Math.cos(angle) * rx, Math.max(bottom, 22 + Math.sin(angle) * ry)];
}

function ellipseWidth(rx: number, ry: number, y: number, bottom = -100): number {
  const points = Array.from({ length: 13 }, (_, index) => ellipsePoint(rx, ry, -Math.PI / 2 + index * Math.PI / 12, bottom));
  let width = 0;
  for (let index = 0; index < points.length - 1; index++) {
    const a = points[index]!, b = points[index + 1]!;
    if (y < Math.min(a[1], b[1]) - 1e-8 || y > Math.max(a[1], b[1]) + 1e-8) continue;
    if (Math.abs(a[1] - b[1]) < 1e-8) width = Math.max(width, a[0], b[0]);
    else width = Math.max(width, a[0] + (b[0] - a[0]) * (y - a[1]) / (b[1] - a[1]));
  }
  return width;
}

function ellipseWall(name: string, outer: [number, number, number], inner: [number, number, number]): ModelPart {
  const vertices: { x: number; y: number; z: number }[] = [], indices: number[] = [];
  const at = (curve: [number, number, number], angle: number, z: number) => { const [x, y] = ellipsePoint(curve[0], curve[1], angle, curve[2]); return { x, y, z }; };
  for (let index = 0; index < 24; index++) {
    const a = index * Math.PI / 12, b = (index + 1) * Math.PI / 12, of = at(outer, a, -5.3), ob = at(outer, a, 5.3), nf = at(outer, b, -5.3), nb = at(outer, b, 5.3), inf = at(inner, a, -5.3), inb = at(inner, a, 5.3), nnf = at(inner, b, -5.3), nnb = at(inner, b, 5.3);
    for (const face of [[of, nf, nb, ob], [inf, inb, nnb, nnf], [of, inf, nnf, nf], [ob, nb, nnb, inb]]) { const start = vertices.length; vertices.push(...face); indices.push(start, start + 1, start + 2, start, start + 2, start + 3); }
  }
  return part(name, "mesh", bone, [0, 0, 0], [1, 1, 1], [0, 0, 0], { vertices, indices });
}

function verticalMoonHouse(): ModelPart[] {
  const parts: ModelPart[] = [ellipseWall("竖月会馆从平底宽脚绕到穹顶的连续外圈厚壁", [18, 24, 0], [17.65, 23.65, .35]), ellipseWall("环腹通天空腔与会居厅之间的完整内圈厚壁", [11.35, 15.35, -100], [11, 15, -100])];
  const sectors = [[-135, -45], [-45, 0], [0, 45], [45, 90], [90, 135], [135, 180], [180, 225]];
  const rect = (x: number, y: number, w: number, h: number): [number, number][] => [[x - w / 2, y], [x + w / 2, y], [x + w / 2, y + h], [x - w / 2, y + h]];
  for (const z of [-4.7, 5.3]) for (let index = 0; index < sectors.length; index++) {
    const [from, to] = sectors[index]!, count = (to! - from!) / 15, outer = Array.from({ length: count + 1 }, (_, step) => ellipsePoint(18, 24, (from! + step * 15) * Math.PI / 180, 0)), inner = Array.from({ length: count + 1 }, (_, step) => ellipsePoint(11, 15, (to! - step * 15) * Math.PI / 180));
    const holes: [number, number][][] = index === 0 ? [rect(0, .35, 2.4, 2.8), rect(-6.5, 4.5, 1.8, 1.5), rect(6.5, 4.5, 1.8, 1.5)] : [rect([0, 12.5, 14, 6, -6, -14, -12.5][index]!, [0, 13.3, 28.2, 39.2, 39.2, 28.2, 13.3][index]!, 1.8, 1.6)];
    const facade = hardFloor("椭环前后立面保留真实门窗和中央大空腔的厚壁扇段", stone, [...outer, ...inner], .6, [0, 0, z], holes); facade.rotation.x = -90; parts.push(facade);
  }
  const groundHoleEnd = -3.6 + 16 * .35 + .175;
  const holesAt = (level: number, side: number): [number, number][][] => level === 3.8 ? [rect(side * 1.5, -3.775, 1.5, groundHoleEnd + 3.775)] : level === 12 ? [rect(side * 9.5, -2.55, 1.5, 6)] : level === 27.5 ? [rect(side * 12.5, -1.95, 1.5, 5.4)] : level === 38.5 ? [rect(side * 8.5, -3.75, 1.5, 4.5)] : [];
  for (const level of [.35, 3.8, 12, 27.5, 38.5]) {
    const bottom = level - .3, outside = Math.min(ellipseWidth(17.65, 23.65, level, .35), ellipseWidth(17.65, 23.65, Math.max(bottom, .35), .35)) - .015, inside = Math.max(ellipseWidth(11.35, 15.35, level), ellipseWidth(11.35, 15.35, bottom));
    if (inside < .01) parts.push(hardFloor("会馆下弦或上弦连续公共厅的完整楼板与真实梯口", wood, [[-outside, -4.7], [outside, -4.7], [outside, 4.7], [-outside, 4.7]], .3, [0, bottom, 0], [...holesAt(level, -1), ...holesAt(level, 1)]));
    else for (const side of [-1, 1]) {
      const from = side < 0 ? -outside : inside + .015, to = side < 0 ? -inside - .015 : outside;
      parts.push(hardFloor("竖月左右侧腹会居厅避开中央空腔的水平楼板", wood, [[from, -4.7], [to, -4.7], [to, 4.7], [from, 4.7]], .3, [0, bottom, 0], holesAt(level, side)));
    }
  }
  const flight = (x: number, z: number, y: number, count: number, rise: number, reverse = false, run = .3) => {
    for (let first = 0; first < count; first += 20) {
      const value = stairFlight(0, 0, y, first, Math.min(20, count - first), rise, run);
      value.position.x = x; value.position.z = z; value.rotation.y = reverse ? 180 : 0; value.name = "椭环侧腹各自完整保留步高的连续实承楼梯"; parts.push(value);
    }
  };
  for (const side of [-1, 1]) {
    flight(side * 1.5, -3.6, .35, 17, 3.45 / 17, false, .35);
    flight(side * 9.5, -3.6, 3.8, 21, .2); flight(side * 9.5, 3.3, 8, 20, .2, true);
    parts.push(box("下弦厅至侧腹厅长梯的完整换向平台", side * 9.5, 7.9, 3.15, 1.7, .2, 1.2, wood), cylinder("换向平台下实际落在公共厅楼板的承柱", side * 9.5, 5.8, 3.15, .3, 4, bone));
    let done = 0;
    for (const [index, count] of [20, 20, 20, 18].entries()) {
      const y = 12 + done * 15.5 / 78; flight(side * 12.5, index % 2 ? 3.3 : -3.6, y, count, 15.5 / 78, index % 2 === 1); done += count;
      if (index < 3) {
        const top = 12 + done * 15.5 / 78, z = index % 2 ? -3.25 : 2.95;
        parts.push(box("侧腹长梯在会馆厚壳内完整换向的独立平台", side * 12.5, top - .1, z, 1.7, .2, 1.4, wood), cylinder("平台下由侧腹主楼板落地承起的长立柱", side * 12.5, (12 + top - .2) / 2, z, .3, top - .2 - 12, bone));
      }
    }
    done = 0;
    for (const [index, count] of [20, 20, 15].entries()) {
      const x = side * (11.5 - index * 1.5), y = 27.5 + done * .2; flight(x, index % 2 ? 3.3 : -3.6, y, count, .2, index % 2 === 1); done += count;
      if (index < 2) {
        const top = 27.5 + done * .2, z = index % 2 ? -3.25 : 2.95, center = side * (10.75 - index * 1.5), brace = rail([side * 14.5, 27.5, z], [center, top - .2, z], .3, bone);
        brace.name = "上弦换梯平台向侧腹主楼板斜接的真实承肋";
        parts.push(box("逐次向上弦内收的完整跨步换梯台", center, top - .1, z, 3.2, .2, 1.4, wood), brace);
      }
    }
  }
  for (const side of [-1, 1]) parts.push(box("会馆下弦前后门的低位落地入口踏台", 0, .0875, side * 5.65, 2.4, .175, .7, stone), box("穿过下弦门洞且接到室内地坪的上一级踏台", 0, .175, side * 5, 2.4, .35, .6, stone));
  return parts;
}

function funnelCourtPalace(): ModelPart[] {
  const parts: ModelPart[] = [box("倒斗宫与四面入口相连的完整落地厚基", 0, .175, 0, 49.2, .35, 49.2, stone)];
  const innerAt = (y: number) => 5 + (y - .35) * .45, outerAt = (y: number) => 24 - (y - .35) / 8;
  const rect = (x: number, y: number, w: number, h: number): [number, number][] => [[x - w / 2, y], [x + w / 2, y], [x + w / 2, y + h], [x - w / 2, y + h]];
  const turn = (value: ModelPart, quarter: number) => {
    const c = Math.cos(quarter * Math.PI / 2), s = Math.sin(quarter * Math.PI / 2);
    value.vertices = value.vertices!.map(v => ({ x: v.x * c + v.z * s, y: v.y, z: -v.x * s + v.z * c })); return value;
  };
  const wall = (name: string, quarter: number, y0: number, y1: number, radius: (y: number) => number, holes: [number, number][][], color: string) => {
    const r0 = radius(y0), r1 = radius(y1), slope = (r1 - r0) / (y1 - y0), length = Math.hypot(1, slope), height = (y1 - y0) * length;
    const value = hardFloor(name, color, [[-r0 - .45, 0], [r0 + .45, 0], [r1 + .45, height], [-r1 - .45, height]], .5, [0, 0, 0], holes.map(hole => hole.map(([x, y]) => [x, (y - y0) * length])));
    value.vertices = value.vertices!.map(v => ({ x: v.x, y: y0 + v.z / length - slope * v.y / length, z: -r0 - slope * v.z / length - v.y / length })); return turn(value, quarter);
  };
  const landingFrames: ModelPart[] = [];
  for (let level = 0; level < 4; level++) {
    const y = .35 + level * 6, upper = y + 6, inside = innerAt(y), divisions: ModelPart[] = [];
    for (let quarter = 0; quarter < 4; quarter++) {
      parts.push(wall("逐层外展的倒斗内庭斜壁及三座真实房门", quarter, y - .05, upper, innerAt, [-.6, 0, .6].map(offset => rect(offset * inside, y, 2, 3.2)), bone));
      const openings = [-14, -7, 0, 7, 14].map(x => rect(x, y + (level === 0 && x === 0 ? 0 : 1.2), level === 0 && x === 0 ? 2.8 : 2.2, level === 0 && x === 0 ? 3.3 : 2.7));
      parts.push(wall("自落地基脚向上收分并保留房窗及底层通门的外护壁", quarter, y - .05, upper, outerAt, openings, membrane));
      for (const side of [-1, 1]) {
        const top = upper - .3, divider = hardFloor("后侧留出连续服务廊的独立居室分隔", stone, [[-innerAt(y) - .35, y], [-outerAt(y) + 1.8, y], [-outerAt(top) + 1.8, top], [-innerAt(top) - .35, top]], .18, [0, 0, 0]);
        divider.vertices = divider.vertices!.map(v => ({ x: side * inside * .3 - .09 + v.y, y: v.z, z: v.x })); divisions.push(turn(divider, quarter));
      }
      const low = box("四面门前从地面接入厚基的低踏台", 0, .0875, -24.95, 3, .175, .7, stone), high = box("门前上一级踏台与厚基地坪连续相接", 0, .175, -24.55, 3, .35, .3, stone);
      if (level === 0) for (const entry of [low, high]) { const z = entry.position.z; entry.position.x = z * Math.sin(quarter * Math.PI / 2); entry.position.z = z * Math.cos(quarter * Math.PI / 2); entry.rotation.y = quarter * 90; parts.push(entry); }
    }
    parts.push(combineMeshes("同层全部独立房隔与后廊开口的完整分室墙组", stone, divisions));
    const half = innerAt(upper) - 2, outside = outerAt(upper) + .15;
    parts.push(hardFloor("倒斗宫环庭回廊及避开双角内梯的整层楼板", wood, [[-outside, -outside], [outside, -outside], [outside, outside], [-outside, outside]], .3, [0, upper - .3, 0], [rect(0, -half, half * 2, half * 2), rect(-18.75, 14.45, 3, 4.5), rect(18.75, 14.45, 3, 4.5)]));
    const guards: ModelPart[] = [], braces: ModelPart[] = [];
    const edge = half + .06;
    for (let quarter = 0; quarter < 4; quarter++) {
      const a = quarter * Math.PI / 2, c = Math.cos(a), s = Math.sin(a), at = (x: number, py: number, z: number): Triple => [x * c + z * s, py, -x * s + z * c];
      guards.push(meshBeam("环庭回廊临空边连续相接的扶栏", at(-edge, upper + 1, -edge), at(edge, upper + 1, -edge), .08, bone));
      for (const x of [-edge, 0]) guards.push(meshBeam("回廊扶栏实际落在楼板上的立柱", at(x, upper, -edge), at(x, upper + 1, -edge), .08, bone));
      for (const x of [-inside * .5, 0, inside * .5]) braces.push(meshBeam("内庭斜壁向外挑回廊底部接承的短斜撑", at(x, upper - 1.4, -innerAt(upper - 1.4)), at(x, upper - .3, -half - .12), .2, bone));
      if (level === 3) {
        const outer = outerAt(upper) - .12;
        guards.push(meshBeam("顶层屋面外缘连续闭合的露台护栏", at(-outer, upper + 1, -outer), at(outer, upper + 1, -outer), .08, bone));
        for (const x of [-outer, 0]) guards.push(meshBeam("顶层外缘护栏与屋面接触的支柱", at(x, upper, -outer), at(x, upper + 1, -outer), .08, bone));
      }
    }
    for (let first = 0; first < guards.length; first += 16) parts.push(combineMeshes("保留回廊及屋面每条实际临空边的完整栏架", bone, guards.slice(first, first + 16)));
    parts.push(combineMeshes("倒斗四壁与本层回廊之间全部接合的斜承组", bone, braces));
    for (const side of [-1, 1]) {
      const first = stairFlight(0, 0, y, 0, 15, .2, .3), second = stairFlight(0, 0, y + 3, 0, 15, .2, .3);
      first.position.x = side * 18; first.position.z = 14; second.position.x = side * 19.5; second.position.z = 18.8; second.rotation.y = 180;
      first.name = "角部梯厅由主层走向后墙的十五级实阶"; second.name = "角部梯厅换向后穿过上层真实开口的实阶"; parts.push(first, second);
      landingFrames.push(hardFloor("双角楼梯连接两趟梯段的完整换向台", bone, [[side * 18.75 - 1.5, 18.35], [side * 18.75 + 1.5, 18.35], [side * 18.75 + 1.5, 18.95], [side * 18.75 - 1.5, 18.95]], .2, [0, y + 2.8, 0]), meshBeam("换向台下端接到基础或下层完整平台的连续承柱", [side * 18.75, level === 0 ? y : y - 3, 18.65], [side * 18.75, y + 2.8, 18.65], .3, bone));
    }
  }
  parts.push(combineMeshes("八处双角换梯平台与全部落地承柱的连接骨架", bone, landingFrames));
  return parts;
}

export const fantasySpaceBatchNineDesigns = [
  design("肋舟贯脊大会堂", "收尖长舟地坪贯穿两端高门厅，完整弯肋从宽撑脚跨过通高会场接入连续长脊，肋间厚膜围护随壳腹收分，低位侧廊与前后实阶让环行通道面向中央大厅", ribBoatAssemblyHall, "建筑", "奇幻"),
  design("竖月环腔会馆", "巨大竖向椭环厚壳围出贯穿前后的通天空腔，下弦公共厅通过侧腹实阶连至高位会居厅与上弦长厅，所有换梯平台有独立承托，前后立面保留真实门窗及各层登临梯口", verticalMoonHouse, "建筑", "奇幻"),
  design("倒斗天井宫", "宽脚外护壁围住上宽下窄的通天方庭，四层斜壁房门面向逐级外展的回廊，双角折返实阶贯通各层及露台，居室分隔后留连续服务廊，回廊下短斜撑真实接入斜壁", funnelCourtPalace, "建筑", "奇幻"),
];
