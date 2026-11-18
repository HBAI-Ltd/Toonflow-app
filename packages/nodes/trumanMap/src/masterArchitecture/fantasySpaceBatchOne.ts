import { part, ring, type ModelPart, type Triple } from "../assetModelParts";
import { polygon } from "../masterNature/shared";
import { base, box, cylinder, design, rail, stairs } from "./structures";
import { halfRoundWall } from "./spatialShells";

const bark = "#8b795c", ivory = "#d4c7a8", moss = "#8eaa84", membrane = "#aa9eb8";
type Vertex = { x: number; y: number; z: number };

function shell(name: string, center: Triple, radii: Triple, from: number, to: number, rise: number, color: string): ModelPart {
  const columns = 16, rows = 7, closed = Math.abs(to - from - Math.PI * 2) < 1e-8, stride = closed ? columns : columns + 1, count = stride * (rows + 1);
  const vertices: Vertex[] = [], indices: number[] = [];
  for (const inset of [0, .14]) for (let row = 0; row <= rows; row++) {
    const phi = row / rows * rise;
    for (let column = 0; column < stride; column++) {
      const theta = from + (to - from) * column / columns;
      vertices.push({ x: center[0] + (radii[0] - inset) * Math.cos(theta) * Math.cos(phi), y: center[1] + (radii[1] - inset) * Math.sin(phi), z: center[2] + (radii[2] - inset) * Math.sin(theta) * Math.cos(phi) });
    }
  }
  const edges = new Map<string, [number, number]>();
  for (let row = 0; row < rows; row++) for (let column = 0; column < columns; column++) {
    const a = row * stride + column, b = row * stride + (column + 1) % stride, c = a + stride, d = b + stride;
    for (const triangle of [[a, c, b], [b, c, d]]) {
      indices.push(...triangle, triangle[2]! + count, triangle[1]! + count, triangle[0]! + count);
      for (let edge = 0; edge < 3; edge++) {
        const start = triangle[edge]!, end = triangle[(edge + 1) % 3]!;
        if (!edges.delete(`${end},${start}`)) edges.set(`${start},${end}`, [start, end]);
      }
    }
  }
  for (const [a, b] of edges.values()) indices.push(a, b + count, b, a, a + count, b + count);
  return part(name, "mesh", color, [0, 0, 0], [1, 1, 1], [0, 0, 0], { vertices, indices });
}

function tube(name: string, color: string, path: Triple[], radius: number): ModelPart {
  return part(name, "tube", color, [0, 0, 0], [1, 1, 1], [0, 0, 0], { radius, path: path.map(([x, y, z]) => ({ x, y, z })) });
}

function plate(name: string, outline: [number, number][], depth: number, position: Triple, color: string, rotation: Triple = [0, 0, 0]): ModelPart {
  return part(name, "extrude", color, position, [1, 1, 1], rotation, { depth, profile: outline.map(([x, y]) => ({ x, y })) });
}

function round(count: number, radius: number, x = 0, z = 0): [number, number][] {
  return Array.from({ length: count }, (_, index) => { const angle = index * Math.PI * 2 / count; return [x + Math.cos(angle) * radius, z + Math.sin(angle) * radius]; });
}

function mushroomLodge(): ModelPart[] {
  const parts: ModelPart[] = [cylinder("菌柄旅舍落地木基", 0, .18, 0, 4.8, .36, bark), halfRoundWall("菌柄真实门洞两边的空心居住壁", 2.1, .2, 5.9, [0, .36, 0], 60, ivory, Math.PI * 5 / 3),
    part("菌盖外坡与拱起内表面围成的连续薄壳屋面", "lathe", moss, [0, 0, 0], [1, 1, 1], [0, 0, 0], { profile: [{ x: 0, y: 8.75 }, { x: 1.8, y: 8.6 }, { x: 3.5, y: 8.05 }, { x: 5.8, y: 6.7 }, { x: 6, y: 6.85 }, { x: 3.6, y: 8.25 }, { x: 1.8, y: 8.8 }, { x: 0, y: 8.95 }] }),
    ring("菌盖下可走动环廊", bark, 4.4, 2.45, 6.1, .24), cylinder("菌柄内卧层楼板", 0, 3.3, 0, 3.9, .16, bark), ...stairs(0, -3.35, 1.65, 3, .12, .42)];
  for (let index = 0; index < 12; index++) {
    const angle = index * Math.PI / 6;
    parts.push(plate("菌盖底面真正立起的放射菌褶承肋", [[1.95, 6.22], [5.6, 6.7], [3.45, 7.92], [1.95, 8.34]], .075, [0, 0, 0], ivory, [0, -index * 30, 0]), rail([Math.cos(angle) * 2, 5.7, Math.sin(angle) * 2], [Math.cos(angle) * 4.05, 6.1, Math.sin(angle) * 4.05], .16, bark));
  }
  for (let index = 0; index < 12; index++) {
    const angle = index * Math.PI / 6;
    parts.push(rail([Math.cos(angle) * 4.25, 6.2, Math.sin(angle) * 4.25], [Math.cos(angle) * 4.25, 7.1, Math.sin(angle) * 4.25], .055, bark));
  }
  parts.push(ring("屋檐环廊细扶手", bark, 4.28, .06, 7.12, .08));
  for (let index = 0; index < 19; index++) {
    const angle = index * Math.PI / 9, y = .5 + index * .3;
    parts.push(part("沿菌柄外侧接到环廊的旋梯踏板", "box", bark, [Math.cos(angle) * 2.45, y, Math.sin(angle) * 2.45], [1.15, .12, .72], [0, -angle * 180 / Math.PI, 0]));
  }
  return parts;
}

function splitPodStore(): ModelPart[] {
  const parts: ModelPart[] = [base(10.5, 13), box("果荚中缝贯通木栈道", 0, 1.3, 0, 1.6, .22, 11, bark),
    shell("向左裂开的真空心果荚仓瓣", [-1.15, .4, 0], [3.6, 5, 5.7], Math.PI / 2, Math.PI * 3 / 2, 1.5, moss),
    shell("向右裂开的真空心果荚仓瓣", [1.15, .4, 0], [3.6, 5, 5.7], -Math.PI / 2, Math.PI / 2, 1.5, moss),
    ...[-1, 1].map(side => box("沿裂缝保留独立通行门槛", side * 2.25, 1.3, 0, 2.9, .2, 9.6, bark))];
  for (const side of [-1, 1]) for (let index = 0; index < 5; index++) {
    const z = -4 + index * 2;
    parts.push(box("果荚内分开的谷料立仓", side * 2.6, 2, z, 1.5, 1.2, 1.45, ivory), rail([side * 4.15, .2, z], [side * 2.55, 4.1, z], .14, bark));
  }
  for (const z of [-5.15, 5.15]) parts.push(tube("跨过裂荚口的弧形承索", bark, [[-3.8, .35, z], [-3.2, 3.4, z], [0, 6.1, z], [3.2, 3.4, z], [3.8, .35, z]], .12));
  parts.push(...stairs(0, -6.8, 1.6, 5, .23, .38));
  return parts;
}

function lotusGuesthouse(): ModelPart[] {
  const holes: [number, number][][] = [round(12, 1.1)];
  const parts: ModelPart[] = [cylinder("莲蓬下单柱承托的落地根盘", 0, .22, 0, 4, .44, bark), cylinder("蓬托中央短茎", 0, 1.2, 0, 1.3, 2.1, bark),
    part("莲蓬底向外舒展的真实空心承杯", "lathe", moss, [0, 0, 0], [1, 1, 1], [0, 0, 0], { profile: [{ x: .6, y: 1 }, { x: 2.7, y: 1.35 }, { x: 5.25, y: 2.7 }, { x: 5.2, y: 2.9 }, { x: 2.65, y: 1.56 }, { x: .6, y: 1.25 }, { x: .6, y: 1 }] })];
  for (let index = 0; index < 6; index++) {
    const angle = index * Math.PI / 3, x = Math.cos(angle) * 3.2, z = Math.sin(angle) * 3.2;
    holes.push(round(10, .85, x, z));
    parts.push(halfRoundWall("每个莲穴独立开口客室壁", 1.15, .16, 2.3, [x, 2.85, z], 60 - index * 60, ivory, Math.PI * 5 / 3),
      shell("莲穴上的空心种籽形覆顶", [x, 5.15, z], [1.27, .85, 1.27], 0, Math.PI * 2, 1.4, moss));
    const deck = polygon("从中央公共环道走进莲穴的窄接桥", bark, [[-.5, -1.3], [.5, -1.3], [.5, 1.3], [-.5, 1.3]], .13, [0, 2.84, 0]);
    deck.position.x = Math.cos(angle) * 1.8; deck.position.z = Math.sin(angle) * 1.8; deck.rotation.y = 90 - index * 60;
    parts.push(deck);
  }
  parts.push(polygon("客室脚下只保留中央天井孔的公共楼板", bark, round(28, 5.2), .16, [0, 2.7, 0], [round(12, 1.1)]),
    polygon("蓬盘屋面七个真正贯通的莲穴采光口", moss, round(28, 5.2), .18, [0, 5.15, 0], holes), ring("中心通光天井围栏", bark, 1.18, .08, 3.4, .85), ...stairs(0, -5.7, 1.5, 11, .245, .3));
  return parts;
}

function shellSongPavilion(): ModelPart[] {
  const parts: ModelPart[] = [cylinder("海唱亭浅盘台基", 0, .3, 0, 11, .6, ivory),
    shell("侧开扇贝上瓣的连续空腔壳", [0, .6, 1.9], [5.3, 6.2, 4.2], 0, Math.PI, 1.48, ivory),
    box("后缘贝壳铰接根梁", 0, .8, 2.05, 9.2, .42, .6, bark), cylinder("贝壳前中央声台", 0, .86, -1.1, 3.4, .42, bark)];
  for (let index = 0; index < 11; index++) {
    const theta = index * Math.PI / 10;
    parts.push(tube("随上壳拱起并落到后缘的放射贝肋", bark, Array.from({ length: 7 }, (_, step) => {
      const phi = step / 6 * 1.48;
      return [Math.cos(theta) * 5.3 * Math.cos(phi), .6 + 6.2 * Math.sin(phi), 1.9 + Math.sin(theta) * 4.2 * Math.cos(phi)];
    }), .055));
  }
  for (const side of [-1, 1]) for (let row = 0; row < 3; row++) parts.push(part("面对开口声台的弧扇听席", "box", bark, [side * (2.2 + row * .45), 1.05 + row * .3, -.3 + row * .8], [2.4, .3, .65], [0, side * 24, 0]));
  parts.push(...stairs(0, -5.7, 2.6, 3, .2, .5));
  return parts;
}

function cocoonClinic(): ModelPart[] {
  const halves = [shell("两端开口的半椭圆茧室薄壳", [0, .25, 0], [6, 4.8, 3.8], .14, Math.PI - .14, 1.46, ivory),
    shell("与前半壳错口相接的后侧茧室薄壳", [0, .25, 0], [6, 4.8, 3.8], Math.PI + .14, Math.PI * 2 - .14, 1.46, ivory)];
  for (const half of halves) half.rotation.y = 90;
  const parts: ModelPart[] = [base(10, 14), ...halves,
    box("贯通两端门洞的茧室地板", 0, .4, 0, 6.4, .22, 11, bark)];
  for (const z of [-3.9, -1.3, 1.3, 3.9]) {
    const scale = Math.sqrt(1 - z * z / 36);
    parts.push(tube("完整跨过顶脊的茧脉编拱", bark, Array.from({ length: 11 }, (_, index) => { const angle = index * Math.PI / 10; return [Math.cos(angle) * 3.8 * scale, .25 + Math.sin(angle) * 4.8 * scale, z]; }), .075));
    for (const side of [-1, 1]) parts.push(box("中央护理通道两边独立卧榻", side * 1.85, .95, z, 1.3, .65, 2, ivory));
  }
  parts.push(...[-1, 1].map(side => tube("沿壳面编成的连续侧向茧筋", bark, [[side * .35, 1.4, -5.9], [side * 2.6, 2.3, -4], [side * 3.35, 2.4, 0], [side * 2.6, 2.3, 4], [side * .35, 1.4, 5.9]], .07)));
  return parts;
}

function armMarket(): ModelPart[] {
  const parts: ModelPart[] = [cylinder("腕柱厅贯通圆形公共地台", 0, .2, 0, 14.8, .4, ivory),
    part("八腕托起的低圆薄壳市厅顶", "lathe", moss, [0, 0, 0], [1, 1, 1], [0, 0, 0], { profile: [{ x: .85, y: 7.8 }, { x: 3, y: 7.35 }, { x: 6.7, y: 6.3 }, { x: 6.75, y: 6.5 }, { x: 3, y: 7.55 }, { x: .85, y: 8 }, { x: .85, y: 7.8 }] }), ring("厅心开敞排光孔", bark, 1, .16, 7.85, .2)];
  for (let index = 0; index < 8; index++) {
    const a = index * Math.PI / 4, c = Math.cos(a), s = Math.sin(a);
    parts.push(tube("从地面盘曲上举再托住屋顶的整根腕柱", bark, [[c * 7, .4, s * 7], [c * 7.25 - s * .8, 1.1, s * 7.25 + c * .8], [c * 6.9 - s, 2.7, s * 6.9 + c], [c * 5.9, 4.3, s * 5.9], [c * 4.5, 6.1, s * 4.5], [c * 3.2, 7.4, s * 3.2]], .26),
      part("腕柱之间的独立弧形摊案", "box", bark, [Math.cos(a + Math.PI / 8) * 4.5, 1, Math.sin(a + Math.PI / 8) * 4.5], [2.4, .85, .9], [0, 67.5 - index * 45, 0]));
    for (const r of [5, 6.1]) parts.push(rail([c * r, .4, s * r], [c * r, 1.15, s * r], .16, bark));
  }
  return parts;
}

function skullBunker(): ModelPart[] {
  const parts: ModelPart[] = [base(12, 14), shell("巨颅后脑可进入的连续半穹壳", [0, .2, 1.8], [5, 6.8, 5.3], 0, Math.PI, 1.48, ivory),
    box("脑室内部平整地坪", 0, .32, 1.9, 8.7, .28, 7, bark),
    ...[-1, 1].map(side => ring("左右眼眶的贯通孔和完整骨缘", ivory, 1.65, .4, 0, .5, { position: { x: side * 2.3, y: 3.55, z: -1.8 }, rotation: { x: 90, y: 0, z: 0 } })),
    plate("鼻梁两侧贯通鼻孔的拱顶", [[-1.25, 0], [-1.25, 1.25], [0, 3], [1.25, 1.25], [1.25, 0], [.83, 0], [.83, 1.15], [0, 2.25], [-.83, 1.15], [-.83, 0]], .65, [0, .4, -2.25], ivory),
    box("上齿槽跨过低位嘴部入口", 0, 2.05, -2.35, 8, .5, .85, ivory)];
  for (const side of [-1, 1]) parts.push(tube("承到地面的颧弓侧梁", ivory, [[side * 1.2, 4.9, -2.3], [side * 4.1, 4.5, -2.2], [side * 4.7, 3.1, -1.5], [side * 4.3, .2, -.6]], .44),
    box("嘴口两侧厚重颌支", side * 4, 1.1, -2.1, .7, 1.8, 1.4, ivory));
  for (const x of [-3.1, -2.3, -1.5, 1.5, 2.3, 3.1]) parts.push(plate("嘴部上垂但保留中央通行净空的实齿", [[-.26, 0], [.26, 0], [.19, -.7], [-.19, -.7]], .4, [x, 1.95, -2.65], ivory));
  parts.push(...stairs(0, -4.6, 2.4, 2, .15, .5));
  return parts;
}

function membranePost(): ModelPart[] {
  const parts: ModelPart[] = [base(17, 10), box("信使站中央纵向登陆步道", 0, .4, 0, 3, .4, 9, bark),
    ...[-1, 1].map(side => rail([side * .95, .4, 2.8], [side * .95, 6.5, 2.8], .25, bark))];
  for (const side of [-1, 1]) {
    const wing = plate("有真正指骨凹口的整片膜翼雨棚", [[.8, 4.2], [1.3, 6.7], [4.3, 7.9], [7.9, 5.2], [5.9, 4.9], [5, 5.6], [3.9, 4.25], [3.2, 5], [2.1, 3.8]], 4.6, [0, 0, .2], membrane);
    if (side < 0) { wing.rotation.y = 180; wing.position.z = .2; }
    parts.push(wing);
    for (const [x, y] of [[7.9, 5.2], [5, 5.6], [3.2, 5], [2.1, 3.8]]) parts.push(rail([side * 1.3, 6.7, 2.5], [side * x!, y!, -2.1], .12, bark));
    parts.push(rail([side * 1.3, 6.7, 2.5], [side * 4.3, 7.9, 2.5], .23, bark), rail([side * 4.3, 7.9, 2.5], [side * 7.9, 5.2, 2.5], .2, bark),
      box("两翼下分离信包整理长案", side * 4.6, 1.2, .5, 4.8, .24, 1, bark), ...[-1, 1].map(z => rail([side * 4.6, .18, .5 + z * .35], [side * 4.6, 1.2, .5 + z * .35], .14, bark)));
  }
  parts.push(box("后侧独立垂直信格墙", 0, 2.8, 3.9, 2.7, 4.3, .35, bark));
  for (let row = 0; row < 5; row++) parts.push(box("横向分层信格层板", 0, .9 + row * .65, 3.5, 2.6, .08, .65, ivory));
  return parts;
}

export const fantasySpaceBatchOneDesigns = [
  design("菌褶环廊蘑菇旅舍", "空心菌柄具有落地门洞，外旋梯接入菌盖下的环廊，放射菌褶承托连续薄壳，内层楼板提供卧居空间", mushroomLodge, "建筑", "奇幻"),
  design("裂荚悬索仓屋", "成对开裂的半椭圆果荚壳罩住左右谷仓，两端弧索跨过中央通行中缝，门外台阶接上高置栈道", splitPodStore, "建筑", "奇幻"),
  design("莲蓬穴室客舍", "向外舒展蓬托承起带七个真实通孔的蓬盘，六间独立莲穴小室环绕公共天井并以短桥相连", lotusGuesthouse, "建筑", "奇幻"),
  design("侧开贝扇海唱亭", "半面扇贝薄壳从后缘铰梁拱起，开放声台面对前侧听席；壳内放射贝肋连续落到根梁", shellSongPavilion, "建筑", "奇幻"),
  design("茧脉编拱疗愈舱", "两片开口茧壳与完整横向编拱围合长舱，正反端裂口连接中央护理通道，两列卧榻留出通行净宽", cocoonClinic, "建筑", "奇幻"),
  design("章鱼腕柱市厅", "八根连续盘曲腕柱从外圈落地后向心上举，承起带排光孔的低圆薄壳，摊案位于独立腕柱之间", armMarket, "建筑", "奇幻"),
  design("巨颅穹腔地堡", "巨颅后脑是真空腔穹壳，独立眼眶和鼻拱构成贯通孔洞，下颌嘴口留中央入口并接内部平整地坪", skullBunker, "建筑", "奇幻"),
  design("双翅折膜信使站", "中央后柱分出两片指骨凹口翼膜雨棚，根梁与指骨共同承重，两翼下整理案和后侧分格信墙服务开放登陆步道", membranePost, "建筑", "奇幻"),
];
