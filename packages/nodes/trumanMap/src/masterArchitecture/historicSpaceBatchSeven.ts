import { part, type ModelPart, type Triple } from "../assetModelParts";
import { base, box, cylinder, design, type ArchitecturePrototype } from "./structures";
import { barrelRoof, halfDomeRoof } from "./spatialShells";
import { polygon, sweptProfile } from "../masterNature/shared";
import { Euler, Quaternion, Vector3 } from "three";

const stone = "#aaa897", darkStone = "#858b7e", brick = "#ac8b6c", wood = "#937754", roofColor = "#828773";

// 原创布景空间按真实建筑类型组织，保留负空间、承重和可见动线，不作遗址测绘复原。
// https://culture.gov.in/ellora-caves
// https://whc.unesco.org/en/list/592
// https://whc.unesco.org/en/list/668
// https://whc.unesco.org/en/decisions/8419
// https://culture.gov.in/fatehpur-sikri
export const historicSpaceBatchSevenDesigns: ArchitecturePrototype[] = [
  design("高桥串联独石殿岩凿院", "三面厚岩壁中留出独立高石殿，岩廊围住开敞庭院，前门上层经两段石桥依次穿过独立亭殿到主殿高台", kailasaCourt, "建筑", "异域"),
  design("方廊圆坛曼荼罗佛塔山", "五层折角方坛保留围绕上层台体的环行石廊，再转成三层圆坛和中央大钟塔，四个方向的逐级石阶穿过真实栏壁缺口", mandalaStupaMountain, "建筑", "异域"),
  design("三重环廊五峰塔山寺", "三层抬高的矩形环廊围出逐级内庭，内缘连续透空拱墙承住筒券屋盖，中央高圣室与四角上峰共同构成五峰轮廓", khmerGalleryMountain, "建筑", "异域"),
  design("星形三殿连柱厅圣所", "三座折角星形圣室以短颈廊连到开放柱厅，星形外墙和多层收分石顶保持统一折线，三处入口朝向共同大厅真实贯通", stellateTripleSanctuary, "建筑", "异域"),
  design("五级敞柱收分观风宫", "五级开放柱层逐级收分，每层宽柱帽实际接承上方楼板，四段连续石阶穿过专门楼板孔到达顶层四柱圆亭", panchMahal, "建筑", "异域"),
  design("中央莲柱四桥议事宫", "中央扩肩石柱承住高圆平台，四条水平对角石桥通到上层环廊，外壁上层保留真实透空窗，侧边内阶与四座屋顶角亭构成完整宫室", diwanKhas, "建筑", "异域"),
];

export function turn(parts: ModelPart[], yaw: number, position: Triple): ModelPart[] {
  const q = new Quaternion().setFromAxisAngle(new Vector3(0, 1, 0), yaw * Math.PI / 180);
  for (const value of parts) {
    const p = new Vector3(value.position.x, value.position.y, value.position.z).applyQuaternion(q), e = new Euler().setFromQuaternion(q.clone().multiply(new Quaternion().setFromEuler(new Euler(value.rotation.x * Math.PI / 180, value.rotation.y * Math.PI / 180, value.rotation.z * Math.PI / 180))));
    value.position = { x: p.x + position[0], y: p.y + position[1], z: p.z + position[2] }; value.rotation = { x: e.x * 180 / Math.PI, y: e.y * 180 / Math.PI, z: e.z * 180 / Math.PI };
  }
  return parts;
}
export function door(name: string, width: number, height: number, depth: number, opening: number, position: Triple, openingHeight = 3, color = stone): ModelPart[] {
  const side = (width - opening) / 2, head = height - openingHeight;
  return [...[-1, 1].map(s => box(`${name}两侧完整厚壁`, position[0] + s * (opening + side) / 2, position[1] + height / 2, position[2], side, height, depth, color)), box(`${name}上方实心过梁壁`, position[0], position[1] + height - head / 2, position[2], opening, head, depth, color)];
}
function circle(radius: number, count = 24): [number, number][] { return Array.from({ length: count }, (_, i) => [Math.cos(i * Math.PI * 2 / count) * radius, Math.sin(i * Math.PI * 2 / count) * radius]); }
function rectangle(width: number, depth: number): [number, number][] { return [[-width / 2, -depth / 2], [width / 2, -depth / 2], [width / 2, depth / 2], [-width / 2, depth / 2]]; }
export function stairFlight(name: string, count: number, width: number, rise: number, run: number, baseHeight: number, position: Triple, yaw: number, openBelow = false): ModelPart {
  const outline: [number, number][] = [[0, openBelow ? baseHeight - .35 : 0]];
  for (let i = 0; i < count; i++) outline.push([i * run, baseHeight + (i + 1) * rise / count], [(i + 1) * run, baseHeight + (i + 1) * rise / count]);
  outline.push([count * run, openBelow ? baseHeight + rise - .35 : 0]); const value = polygon(name, stone, outline, width); value.rotation.x = -90; value.position.z = width / 2;
  return turn([value], yaw, position)[0]!;
}
export function tower(name: string, outline: [number, number][], levels: [number, number][], position: Triple, color = stone): ModelPart {
  const width = outline.length, vertices = levels.flatMap(([scale, y]) => outline.map(([x, z]) => ({ x: x * scale, y, z: z * scale }))), indices: number[] = [];
  for (let row = 0; row < levels.length - 1; row++) for (let i = 0; i < width; i++) { const a = row * width + i, b = a + width, c = row * width + (i + 1) % width, d = c + width; indices.push(a, b, c, c, b, d); }
  const bottom = vertices.length, top = bottom + 1; vertices.push({ x: 0, y: levels[0]![1], z: 0 }, { x: 0, y: levels.at(-1)![1], z: 0 });
  for (let i = 0; i < width; i++) { const j = (i + 1) % width, offset = (levels.length - 1) * width; indices.push(bottom, i, j, top, offset + j, offset + i); }
  return part(name, "mesh", color, position, [1, 1, 1], [0, 0, 0], { vertices, indices });
}
export function dome(name: string, radius: number, position: Triple, color = roofColor): ModelPart[] { return [halfDomeRoof(`${name}前半石壳`, radius, .24, position, 0, color), halfDomeRoof(`${name}后半石壳`, radius, .24, position, 180, color)]; }
export function cappedColumn(name: string, x: number, z: number, y: number, height: number, color = stone): ModelPart {
  const value = sweptProfile(name, color, [[0, 0], [.36, 0], [.36, .18], [.24, .24], [.24, height - .45], [.52, height - .26], [.52, height], [0, height]], Math.PI * 2, 12);
  value.position = { x, y, z }; return value;
}
export function arcadeWall(name: string, length: number, height: number, position: Triple, yaw: number): ModelPart {
  const count = Math.min(14, Math.max(1, Math.floor(length / 4.5))), pitch = length / count, radius = Math.min(1.5, (pitch - .8) / 2), spring = height - radius - .3, holes: [number, number][][] = [];
  for (let i = 0; i < count; i++) {
    const center = -length / 2 + pitch * (i + .5), hole: [number, number][] = [[center - radius, .035], [center - radius, spring]];
    for (let step = 1; step <= 10; step++) { const angle = Math.PI - step * Math.PI / 10; hole.push([center + Math.cos(angle) * radius, spring + Math.sin(angle) * radius]); }
    hole.push([center + radius, .035]); holes.push(hole);
  }
  const value = polygon(name, stone, [[-length / 2, 0], [length / 2, 0], [length / 2, height], [-length / 2, height]], .45, [0, 0, 0], holes); value.rotation.x = -90; value.position.z = .225;
  return turn([value], yaw, position)[0]!;
}

function kailasaCourt(): ModelPart[] {
  const p: ModelPart[] = [base(74, 94), box("独石殿四周整体开敞的岩院石地面", 0, .3, 0, 60, .24, 82), box("岩院后方保留的高厚天然石壁", 0, 13.4, 39, 70, 26.44, 8, darkStone)];
  for (const s of [-1, 1]) {
    p.push(part("独石院两侧带起伏顶缘的高厚母岩", "extrude", darkStone, [s * 31.5, .18, 0], [1, 1, 1], [0, 0, 0], { depth: 80, profile: [{ x: -3.5, y: 0 }, { x: 3.5, y: 0 }, { x: 3.5, y: 23.2 }, { x: 1.8, y: 25 }, { x: -.7, y: 24.1 }, { x: -3.5, y: 25.6 }] }), box("岩廊与母岩连续连接的厚石顶", s * 25, 7.5, 0, 8, 1, 70), box("前门厚石身两侧接母岩的宽壁", s * 16.5, 5.68, -38, 27, 11, 3));
    for (const z of [-30, -18, -6, 6, 18, 30]) p.push(box("两侧岩廊保留的真实方石承顶柱", s * 22, 3.71, z, .8, 6.58, .8));
  }
  p.push(box("后岩廊连到整片母岩的厚石屋盖", 0, 7.5, 32, 44, 1, 7.5));
  for (const x of [-18, -9, 0, 9, 18]) p.push(box("后岩廊真正落地的方石柱", x, 3.71, 29, .8, 6.58, .8));
  for (const z of [-39.2, -34.8]) {
    p.push(box("两层门楼低门与上层孔之间承重石梁", 0, 5.59, z, 6, .82, .8), box("两层门楼上层桥口上方完整石门头", 0, 10.49, z, 6, 1.38, .8));
  }
  for (const s of [-1, 1]) p.push(box("前门楼后方与上下门梁相接的真实厚壁", s * 7.75, 5.68, -34.8, 9.5, 11, .8));
  p.push(box("前门楼真正与侧缘阶衔接的上层石楼板", 0, 5.8, -37, 25, .4, 6), box("前门楼覆盖上层真实通行空间的石平顶", 0, 11.38, -37, 26, .4, 7.5), stairFlight("从岩院侧缘登到门楼上层的真石阶", 18, 1.2, 5.58, .4, 0, [-19.7, .42, -35.9], 0), box("从门楼跨到独立前亭的石桥", 0, 5.8, -27.5, 2.5, .4, 15), box("从独立前亭跨到主殿的后石桥", 0, 5.8, -7.8, 2.5, .4, 5.4));
  for (const x of [-3.6, 3.6]) for (const z of [-18.6, -11.4]) p.push(box("独立前亭下方真正落地的石墩", x, 3.01, z, .85, 5.18, .85), cappedColumn("前亭高楼板上实际承顶石柱", x, z, 6, 5.4));
  p.push(box("独立前亭四墩共托的高石楼板", 0, 5.8, -15, 10, .4, 10), box("前亭四柱共托的完整石屋盖", 0, 11.6, -15, 10.8, .4, 10.8), box("独石主殿下完整高承台", 0, 3.09, 10, 24, 5.82, 32));
  for (const x of [-6, 6]) for (const z of [-3, 3, 9]) p.push(cappedColumn("主殿高台上开放大厅的真实承重石柱", x, z, 6, 5.4));
  p.push(box("主殿柱厅完整薄石屋盖", 0, 11.6, 3, 16, .4, 14), ...door("主圣室朝向柱厅的真实石门", 10, 5.4, .8, 2.5, [0, 6, 12], 3.5), ...[-1, 1].map(s => box("主圣室真正两侧厚石壁", s * 4.6, 8.7, 18, .8, 5.4, 12)), box("主圣室后端完整厚壁", 0, 8.7, 24, 10, 5.4, .8), tower("主圣室上同独石身连成一体的收分层顶", rectangle(2, 2), [[5.5, 0], [5.8, .5], [4.7, 1], [4.7, 3], [5.1, 3.5], [3.6, 4], [3.6, 6], [4, 6.5], [2.4, 7], [2.4, 9], [2.7, 9.5], [.2, 12]], [0, 11.4, 18]));
  p.push(box("柱厅进入圣室前短颈廊的完整石顶", 0, 11.6, 11, 3.4, .4, 2.8), ...[-1, 1].map(s => box("柱厅到圣室短颈廊的实际侧壁", s * 1.55, 8.7, 11, .35, 5.4, 2.8)));
  return p;
}

function redentedSquare(radius: number, inset: number): [number, number][] { return [[-radius, -radius + inset], [-radius + inset, -radius + inset], [-radius + inset, -radius], [radius - inset, -radius], [radius - inset, -radius + inset], [radius, -radius + inset], [radius, radius - inset], [radius - inset, radius - inset], [radius - inset, radius], [-radius + inset, radius], [-radius + inset, radius - inset], [-radius, radius - inset]]; }
function bellStupa(name: string, radius: number, height: number, position: Triple): ModelPart {
  const value = sweptProfile(name, darkStone, [[0, 0], [radius, 0], [radius, height * .1], [radius * .85, height * .14], [radius * .82, height * .4], [radius * .6, height * .6], [radius * .2, height * .68], [radius * .18, height * .8], [.025, height], [0, height]], Math.PI * 2, radius > 2 ? 24 : 12);
  value.position = { x: position[0], y: position[1], z: position[2] }; return value;
}
function mandalaStupaMountain(): ModelPart[] {
  const p: ModelPart[] = [base(87, 87), polygon("所有方形环廊共同承托的大石山基座", darkStone, redentedSquare(39, 4), .5, [0, .18, 0])];
  for (let level = 0; level < 5; level++) {
    const radius = 34 - level * 4, top = 2.2 + level * 2.2, previous = level === 0 ? .68 : top - 2.2, gap = 1.45, inset = 3;
    p.push(polygon("逐层缩入的折角方形实承石坛", darkStone, redentedSquare(radius, inset), top - .18, [0, .18, 0]));
    const corner: [number, number][] = [[gap, -radius], [radius - inset, -radius], [radius - inset, -radius + inset], [radius, -radius + inset], [radius, -gap], [radius - .55, -gap], [radius - .55, -radius + inset + .55], [radius - inset - .55, -radius + inset + .55], [radius - inset - .55, -radius + .55], [gap, -radius + .55]];
    for (let side = 0; side < 4; side++) p.push(...turn([polygon("保留四向阶口的折角环廊外栏壁", stone, corner, 1.5, [0, top, 0]), stairFlight("逐级准确接入每层方形石坛的轴向石阶", 10, 2.6, top - previous, .4, previous - .18, [0, .18, -radius - 4], -90)], side * 90, [0, 0, 0]));
  }
  for (let level = 0; level < 3; level++) {
    const radius = 14 - level * 4, top = 12.4 + level * 1.4, previous = top - 1.4;
    p.push(cylinder("方形环廊上方真正连续承地的圆形坛台", 0, (top + .18) / 2, 0, radius * 2, top - .18, darkStone));
    for (let side = 0; side < 4; side++) p.push(...turn([stairFlight("三层圆坛之间的四向实承石阶", 7, 2.5, 1.4, 4 / 7, previous - .18, [0, .18, -radius - 4], -90)], side * 90, [0, 0, 0]));
    const count = 12 - level * 4;
    for (let i = 0; i < count; i++) { const angle = (i + .5) * Math.PI * 2 / count; p.push(bellStupa("圆坛上一整圈独立小钟形佛塔", .75, 2.4, [Math.cos(angle) * (radius - 1.8), top, Math.sin(angle) * (radius - 1.8)])); }
  }
  p.push(bellStupa("整座曼荼罗石山中央大钟形佛塔", 2.5, 5.6, [0, 15.2, 0]));
  return p;
}

function khmerGalleryMountain(): ModelPart[] {
  const p: ModelPart[] = [base(78, 70)], levels = [[64, 56, 1.18], [44, 38, 4.18], [24, 22, 8.18]];
  for (let level = 0; level < levels.length; level++) {
    const [width, depth, top] = levels[level]! as [number, number, number], previous = level === 0 ? .18 : levels[level - 1]![2]!;
    p.push(box("三重环廊每层独立实心高台", 0, (top + .18) / 2, 0, width, top - .18, depth));
    for (const s of [-1, 1]) {
      p.push(...door("长边廊外壁真正中央通门", width, 3, .5, 3, [0, top, s * depth / 2], 2.6), ...turn(door("短边廊外壁真正中央通门", depth, 3, .5, 3, [0, top, 0], 2.6), 90, [s * width / 2, 0, 0]), arcadeWall("环廊内侧可见贯通券孔的完整长拱墙", width - 8, 3, [0, top, s * (depth / 2 - 4)], 0), arcadeWall("环廊内侧可见贯通券孔的完整短拱墙", depth - 8, 3, [s * (width / 2 - 4), top, 0], 90), ...turn([barrelRoof("沿长边连续覆盖步行廊的石筒券", 2, .25, width, [0, top + 3, 0], darkStone)], 90, [0, 0, s * (depth / 2 - 2)]), barrelRoof("沿短边连续覆盖步行廊的石筒券", 2, .25, depth - 8, [s * (width / 2 - 2), top + 3, 0], darkStone));
    }
    for (let side = 0; side < 4; side++) {
      const edge = side % 2 === 0 ? depth / 2 : width / 2, priorEdge = level === 0 ? edge + 5 : levels[level - 1]![side % 2 === 0 ? 1 : 0]! / 2, run = (priorEdge - edge) / 12;
      p.push(...turn([stairFlight("各重环廊之间独立接平的主轴登临石阶", 12, 2.6, top - previous, run, previous - .18, [0, .18, -priorEdge], -90)], side * 90, [0, 0, 0]));
    }
  }
  for (const s of [-1, 1]) p.push(...door("中央高圣室前后贯通石门", 7, 5.2, .55, 1.8, [0, 8.18, s * 3.5], 3), ...turn(door("中央高圣室左右贯通石门", 7, 5.2, .55, 1.8, [0, 8.18, 0], 3), 90, [s * 3.5, 0, 0]));
  const outline = circle(1, 8);
  p.push(tower("中央高圣室上方收瓣主塔峰", outline, [[4.5, 0], [4.8, .5], [3.9, 1], [3.7, 3], [3, 5], [2.3, 7.3], [1.5, 9.4], [.12, 12]], [0, 13.38, 0], darkStone));
  for (const x of [-10, 10]) for (const z of [-9, 9]) p.push(box("角峰底部接承两面廊壁的完整高券肩石", x, 12.305, z, 4, 2.25, 4), tower("上环廊角部与厚券肩共承的小塔峰", outline, [[2.1, 0], [2.35, .4], [1.8, .8], [1.6, 2.8], [.9, 4.7], [.1, 6.5]], [x, 13.43, z], darkStone));
  return p;
}

function star(radius: number): [number, number][] { return Array.from({ length: 16 }, (_, i) => [Math.cos(i * Math.PI / 8) * radius * (i % 2 ? .77 : 1), Math.sin(i * Math.PI / 8) * radius * (i % 2 ? .77 : 1)]); }
function stellateTripleSanctuary(): ModelPart[] {
  const hall = star(8.5), p: ModelPart[] = [base(46, 57), polygon("三殿共用多折角柱厅完整星形石地面", stone, hall, .24, [0, .18, 0]), polygon("中央柱厅同折角平面吻合的完整石屋盖", stone, hall, .32, [0, 5.4, 0])];
  for (let i = 0; i < 12; i++) { const a = i * Math.PI / 6; p.push(cappedColumn("星形开放柱厅内部独立车旋石柱", Math.cos(a) * 5.8, Math.sin(a) * 5.8, .42, 4.98, darkStone)); }
  for (const [x, z] of [[-14, 5], [14, 5], [0, 18]]) {
    const outline = star(6), inner = outline.map(([x, z]) => [x * .78, z * .78] as [number, number]), order = Array.from({ length: 15 }, (_, i) => (13 + i) % 16), lower = [...order.map(i => outline[i]!), ...order.slice().reverse().map(i => inner[i]!)], yaw = Math.atan2(x!, z!) * 180 / Math.PI, local: ModelPart[] = [polygon("独立星形圣室完整石铺地面", stone, outline, .24, [0, .18, 0]), polygon("星形外壁真实切开朝柱厅入口的下层石身", darkStone, lower, 3, [0, .42, 0]), polygon("圣室门口上方闭合连续的星形厚石身", darkStone, outline, 1.8, [0, 3.42, 0], [inner]), tower("折角星形圣室上逐级收分的完整石顶", star(1), [[6.3, 0], [6.5, .4], [5.2, .8], [5.2, 2], [5.6, 2.4], [4, 2.9], [4, 4], [4.4, 4.4], [2.5, 5], [2.5, 6.2], [2.8, 6.6], [.2, 8]], [0, 5.22, 0])];
    p.push(...turn(local, yaw, [x!, 0, z!]));
    const distance = Math.hypot(x!, z!), start = 7.7, end = distance - 4.05, length = end - start, direction = Math.atan2(x!, z!) * 180 / Math.PI;
    p.push(...turn([box("柱厅与星形圣室之间的真实短颈廊地面", 0, .3, 0, 3.1, .24, length), box("短颈廊连接双方屋盖的完整石顶", 0, 5.4, 0, 3.7, .36, length), ...[-1, 1].map(s => box("短颈廊两侧实际厚壁", s * 1.55, 2.82, 0, .35, 4.8, length))], direction, [x! / distance * (start + end) / 2, 0, z! / distance * (start + end) / 2]));
  }
  return p;
}

function panchMahal(): ModelPart[] {
  const levels = [[22, 18, 4, 4], [18, 14, 3, 3], [13, 10, 2, 2], [8, 6, 2, 2], [4, 4, 2, 2]], stair = [[-4.7, -5.8], [2.8, -4.5], [-1.2, -2.8], [.15, -1.8]], p: ModelPart[] = [base(29, 25)];
  for (let level = 0; level < levels.length; level++) {
    const [width, depth, nx, nz] = levels[level]! as [number, number, number, number], top = .42 + level * 3.24, holes: [number, number][][] = [];
    if (level > 0) { const [x, z] = stair[level - 1]!; holes.push([[x! - .7, z!], [x! + .7, z!], [x! + .7, z! + 3.6], [x! - .7, z! + 3.6]]); }
    p.push(polygon("五级柱楼真实保留前段阶孔的石楼板", brick, rectangle(width, depth), .24, [0, top - .24, 0], holes));
    for (let ix = 0; ix < nx; ix++) for (let iz = 0; iz < nz; iz++) { const margin = level === 4 ? 1 : 3, x = (ix / (nx - 1) - .5) * (width - margin), z = (iz / (nz - 1) - .5) * (depth - margin); p.push(cappedColumn("每级敞层真正接承上一石楼板的宽帽柱", x, z, top, 3, brick)); }
    if (level < levels.length - 1) { const [x, z] = stair[level]!; p.push(stairFlight("逐级敞柱楼之间两端接楼板且下方通空的连续登阶", 12, 1.2, 3.24, .3, 0, [x!, top, z!], -90, true)); }
  }
  const y = .42 + 4 * 3.24 + 3;
  p.push(polygon("最上四柱亭承圆顶的完整方角石板", brick, rectangle(5, 5), .3, [0, y, 0], [circle(2)]), ...dome("最高开放四柱亭完整圆顶", 2.8, [0, y + .3, 0], brick));
  return p;
}

function flatBridge(name: string, start: [number, number], end: [number, number], y: number, width: number): ModelPart {
  const value = box(name, (start[0] + end[0]) / 2, y - .15, (start[1] + end[1]) / 2, Math.hypot(end[0] - start[0], end[1] - start[1]), .3, width); value.rotation.y = -Math.atan2(end[1] - start[1], end[0] - start[0]) * 180 / Math.PI; return value;
}
function diwanKhas(): ModelPart[] {
  const hole: [number, number][] = [[-6, -6], [-6, -3.3], [-7.6, -3.3], [-7.6, 3.3], [-6, 3.3], [-6, 6], [6, 6], [6, -6]], p: ModelPart[] = [base(23, 23), box("议事宫完整石铺地面", 0, .3, 0, 16, .24, 16), polygon("围住中央高平台并保留侧阶通口的上层环廊", brick, rectangle(16, 16), .3, [0, 6.7, 0], [hole]), cylinder("中央石柱实际接承的下部高柱干", 0, 2.62, 0, 2.2, 4.4, brick), part("中央石柱向上展开承平台的莲瓣式扩肩", "lathe", brick, [0, 4.82, 0], [1, 1, 1], [0, 0, 0], { profile: [{ x: 0, y: 0 }, { x: 1.1, y: 0 }, { x: 1.12, y: .4 }, { x: 1.5, y: 1.1 }, { x: 2.1, y: 1.88 }, { x: 0, y: 1.88 }] }), cylinder("中央莲柱上真实可站立的高圆平台", 0, 6.85, 0, 4.4, .3, brick), stairFlight("侧边从下殿连续升到高环廊的真阶", 22, 1.35, 6.58, .3, 0, [-6.8, .42, -3.3], -90), box("高宫室四壁共承的整片石平屋盖", 0, 11.92, 0, 17, .4, 17, brick)];
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) p.push(flatBridge("中央高圆平台到上层四角的真正水平斜桥", [sx * 1.25, sz * 1.25], [sx * 6.6, sz * 6.6], 7, 1.05));
  for (const s of [-1, 1]) p.push(...door("议事宫前后真正大门", 16, 6.28, .5, 3, [0, .42, s * 8], 4, brick), ...turn(door("议事宫左右真正大门", 16, 6.28, .5, 3, [0, .42, 0], 4, brick), 90, [s * 8, 0, 0]), arcadeWall("上层环廊前后真实透空大窗", 16, 4.72, [0, 7, s * 8], 0), arcadeWall("上层环廊左右真实透空大窗", 16, 4.72, [s * 8, 7, 0], 90));
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
    const x = sx * 6, z = sz * 6;
    for (const dx of [-1, 1]) for (const dz of [-1, 1]) p.push(cappedColumn("屋顶角亭上真正承顶的独立小石柱", x + dx * 1.2, z + dz * 1.2, 12.12, 2.4, brick));
    p.push(polygon("屋顶角亭四柱共托的方角承顶石", brick, rectangle(3.5, 3.5), .25, [x, 14.52, z], [circle(1.35, 16)]), ...dome("屋顶四角独立小亭圆顶", 1.8, [x, 14.77, z], brick));
  }
  return p;
}
