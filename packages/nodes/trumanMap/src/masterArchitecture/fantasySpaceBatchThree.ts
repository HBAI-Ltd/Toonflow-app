import { part, crystal, ring, type ModelPart, type Triple } from "../assetModelParts";
import { polygon } from "../masterNature/shared";
import { base, box, colors, cylinder, design, rail, stairs } from "./structures";
import { barrelRoof, halfRoundWall } from "./spatialShells";

const cloth = "#b2a78f", wood = "#86755d", bone = "#c6c5b0", stone = "#929c96", mirror = "#b3c4c6";

function tube(name: string, color: string, path: Triple[], radius: number): ModelPart {
  return part(name, "tube", color, [0, 0, 0], [1, 1, 1], [0, 0, 0], { radius, path: path.map(([x, y, z]) => ({ x, y, z })) });
}

function saddleCanopy(): ModelPart {
  const n = 9, count = n * n, vertices: { x: number; y: number; z: number }[] = [], indices: number[] = [];
  for (const down of [0, .12]) for (let row = 0; row < n; row++) for (let column = 0; column < n; column++) {
    const x = column / (n - 1) * 16 - 8, z = row / (n - 1) * 18 - 9;
    vertices.push({ x, y: 9.3 + 2 * (x / 8) ** 2 - 2 * (z / 9) ** 2 - down, z });
  }
  const edges = new Map<string, [number, number]>();
  for (let row = 0; row < n - 1; row++) for (let column = 0; column < n - 1; column++) {
    const a = row * n + column, b = a + 1, c = a + n, d = c + 1;
    for (const tri of [[a, c, b], [b, c, d]]) {
      indices.push(...tri, tri[2]! + count, tri[1]! + count, tri[0]! + count);
      for (let edge = 0; edge < 3; edge++) { const from = tri[edge]!, to = tri[(edge + 1) % 3]!; if (!edges.delete(`${to},${from}`)) edges.set(`${from},${to}`, [from, to]); }
    }
  }
  for (const [a, b] of edges.values()) indices.push(a, b + count, b, a, a + count, b + count);
  return part("交叉高低边形成的连续鞍形翼膜薄壳", "mesh", cloth, [0, 0, 0], [1, 1, 1], [0, 0, 0], { vertices, indices });
}

function kitePalace(): ModelPart[] {
  const parts: ModelPart[] = [base(19, 21), saddleCanopy(), cylinder("汗宫中央撑膜主桅", 0, 4.7, 0, .38, 9.3, wood),
    ...[-1, 1].map(side => cylinder("鞍膜两侧最高边的高桅", side * 8, 5.7, 0, .3, 11.3, wood)), box("主帐后部高置会见地毯台", 0, .55, 5, 8, .4, 4, wood)];
  for (const x of [-1, 1]) for (const z of [-1, 1]) parts.push(cylinder("四角翼膜边缘撑柱", x * 8, 4.7, z * 9, .25, 9.3, wood),
    rail([x * 8, 9.3, z * 9], [x * 11, .2, z * 12], .065, wood), box("帐外绷索的落地重锚", x * 11, .2, z * 12, 1.2, .4, 1.2, stone));
  for (const side of [-1, 1]) for (let index = 0; index < 5; index++) parts.push(box("高膜下独立留通风缝的软壁屏", side * 7.7, 3.05, -6.7 + index * 3.3, .14, 5.7, 2.9, cloth));
  for (const side of [-1, 1]) parts.push(box("帐门两侧收起的厚帘边", side * 5.2, 3.1, -8.7, 5.2, 5.8, .15, cloth), box("后侧隔风的软幕", side * 3.9, 3.1, 8.7, 7.5, 5.8, .15, cloth));
  for (const x of [-4, 0, 4]) parts.push(tube("与鞍膜曲率一致并连续贴合的纵向撑肋", wood, Array.from({ length: 9 }, (_, index): Triple => { const z = -9 + index * 2.25; return [x, 9.3 + 2 * (x / 8) ** 2 - 2 * (z / 9) ** 2, z]; }), .06));
  return parts;
}

function floatingDock(): ModelPart[] {
  const parts: ModelPart[] = [];
  for (const [x, z, w, d] of [[-8, 1, 5, 18], [8, 1, 5, 18], [0, 10, 20, 5]]) {
    parts.push(crystal("悬岩下方倒锥承台岩体", stone, [x!, 4.1, z!], [w! * 1.1, 4.1, d! * .8], { rotation: { x: 180, y: 0, z: 0 } }), box("三岛连成开放U形泊位的连续坞岸", x!, 6.15, z!, w!, .5, d!, wood));
  }
  for (const side of [-1, 1]) {
    parts.push(box("泊槽内侧连续靠泊护舷", side * 5.6, 6.7, 0, .22, .6, 16, bone), box("上坞岸载物平层", side * 8, 6.8, 7.5, 4.3, .28, 3, wood));
    for (const z of [-6, 12]) parts.push(box("地面悬岛承缆岩锚", side * 13, .6, z, 2, 1.2, 2, stone), tube("从重岩地锚斜拉到浮岛坞岸的绷紧承缆", wood, [[side * 13, 1.2, z], [side * 8.7, 6.15, z > 0 ? 8 : -5]], .12));
    for (let index = 0; index < 5; index++) parts.push(cylinder("沿两侧长坞岸排列的系缆墩", side * 6.1, 6.9, -5.5 + index * 3.1, .3, .75, bone));
  }
  parts.push(cylinder("后岛旋臂装卸桅底座", 0, 6.8, 10, 1.4, .8, bone), cylinder("装卸桅的竖直回转柱", 0, 9.4, 10, .45, 5.2, wood), rail([0, 12, 10], [0, 10.7, 1.8], .32, wood),
    rail([0, 8, 10], [0, 10.7, 1.8], .19, bone), rail([0, 10.7, 1.8], [0, 7, 1.8], .055, wood), ring("坞岸装卸索末端真实吊环", bone, .4, .08, 0, .1, { position: { x: 0, y: 6.8, z: 1.8 }, rotation: { x: 90, y: 0, z: 0 } }));
  return parts;
}

function springSanctuary(): ModelPart[] {
  const parts: ModelPart[] = [base(20, 24), box("泉幕后完整礼拜空间的抬升地坪", 0, .7, 5.5, 12, .5, 12, bone),
    barrelRoof("泉幕后礼拜堂独立薄券屋顶", 5.5, .25, 10, [0, 4.4, 6], stone),
    halfRoundWall("礼拜空间后侧圆弧实承围壁", 5.5, .3, 4, [0, .95, 9], 0, stone),
    box("泉幕前不会被水槽堵住的横向通行廊", 0, .55, -2, 17, .3, 2, wood)];
  for (const side of [-1, 1]) {
    parts.push(box("承拱侧墙实际落到礼拜地坪", side * 5.5, 2.75, 5.8, .35, 3.5, 9.5, bone), ...stairs(side * 7.5, -5.2, 1.8, 4, .2, .55));
    for (let index = 0; index < 4; index++) parts.push(cylinder("临泉廊独立落地承柱", side * 7.5, 3.5, -1 + index * 3.7, .4, 6.7, stone));
    parts.push(box("临泉廊的通长承盖梁", side * 7.5, 6.8, 4.5, .6, .4, 13, wood));
  }
  for (const x of [-3.5, 0, 3.5]) {
    parts.push(box("礼拜堂前分开的逐级泉槽承重背板", x, 4.35, 3.1, 2.3, 7.8, .35, stone));
    for (let index = 0; index < 4; index++) {
      const y = 1.2 + index * 1.75, z = .7 + index * .45;
      parts.push(box("逐级向前错位的真正蓄水槽底", x, y, z, 2.25, .18, .85, bone),
        ...[-1, 1].map(side => box("每个小水槽两边的封闭侧壁", x + side * 1.05, y + .21, z, .15, .4, .85, bone)),
        box("槽内静态浅水面", x, y + .22, z, 1.95, .04, .7, colors.water),
        box("每层泉槽底部真正接到后墙的悬臂", x, y - .15, (3.1 + z) / 2, 1.55, .2, 3.1 - z + .1, stone));
      if (index) parts.push(part("上槽溢流唇落向下槽的静态泉帘", "box", colors.water, [x, y - .6, z - .39], [1.85, 1.65, .055], [0, 0, 0], { opacity: .5, roughness: .2 }));
    }
  }
  parts.push(box("泉幕之间保留通人的正门口地板", 1.75, .8, 0, 1.2, .3, 3.5, wood));
  return parts;
}

function mirrorLabyrinth(): ModelPart[] {
  const parts: ModelPart[] = [base(23, 23), box("迷宫入口外置缓冲台", 0, .3, -12, 3, .24, 3, wood)];
  const wall = (x: number, z: number, w: number, d: number) => part("两侧均可见的实薄镜面路径墙", "box", mirror, [x, 2.3, z], [w, 4.2, d], [0, 0, 0], { metalness: .9, roughness: .08 });
  parts.push(wall(-10.5, 0, .18, 21), wall(10.5, 0, .18, 21), wall(-6.1, -10.5, 8.8, .18), wall(6.1, -10.5, 8.8, .18), wall(-2.8, 10.5, 15.4, .18), wall(9.45, 10.5, 2.1, .18));
  const segments = [[-7.5, -1.5, .18, 15], [-.5, 6, 14, .18], [6.5, 1.5, .18, 9], [1.1, -5.9, 12, .18], [-4.7, -.7, .18, 8.5], [0, 3.5, 9.4, .18], [4.6, -.4, .18, 7.8], [.3, -4.2, 6.2, .18], [-2.7, -.7, .18, 4.9], [.6, 1.7, 6.5, .18], [3.8, -.1, .18, 3.5]];
  for (const [x, z, w, d] of segments) parts.push(wall(x!, z!, w!, d!));
  for (const [x, z] of [[-10.5, -10.5], [10.5, -10.5], [-10.5, 10.5], [10.5, 10.5]]) parts.push(cylinder("整座镜院四角高锚柱", x!, 3.4, z!, .55, 6.5, bone));
  parts.push(part("高于镜墙并标记唯一出口的竖向裂晶", "extrude", bone, [8.4, 4.3, 10.5], [1, 1, 1], [0, 0, 0], { depth: .3, profile: [{ x: -.5, y: 0 }, { x: .1, y: 3.1 }, { x: .5, y: 0 }] }));
  return parts;
}

function stairMesh(start: number, count: number): ModelPart {
  const vertices: { x: number; y: number; z: number }[] = [], indices: number[] = [];
  for (let step = start; step < start + count; step++) {
    const angle = step * Math.PI / 8, y = .6 + step * .2, centerX = y * .22, corners: { x: number; y: number; z: number }[] = [];
    for (const h of [y - .06, y + .06]) for (const [radius, a] of [[1.25, angle], [2.65, angle], [2.65, angle + Math.PI / 8], [1.25, angle + Math.PI / 8]]) corners.push({ x: centerX + radius! * Math.cos(a!), y: h, z: radius! * Math.sin(a!) });
    for (const face of [[0, 1, 2, 3], [4, 7, 6, 5], [0, 4, 5, 1], [1, 5, 6, 2], [2, 6, 7, 3], [3, 7, 4, 0]]) {
      const n = vertices.length;
      vertices.push(...face.map(index => corners[index]!)); indices.push(n, n + 1, n + 2, n, n + 2, n + 3);
    }
  }
  return part("沿倾斜骨干上行且硬面分顶点的连续旋梯", "mesh", wood, [0, 0, 0], [1, 1, 1], [0, 0, 0], { vertices, indices });
}

function boneWatchtower(): ModelPart[] {
  const parts: ModelPart[] = [cylinder("斜挑骨塔的落地岩础", 0, .35, 0, 8, .7, stone),
    tube("整座观潮塔连续倾斜的巨骨主干", bone, [[0, .6, 0], [1, 5, 0], [2.3, 10, 0], [3.2, 14.2, 0]], .67),
    part("最高处与骨干真实连接的膨大骨节", "sphere", bone, [3.1, 13.5, 0], [2.3, 2.5, 2.3]), stairMesh(0, 20), stairMesh(20, 20), stairMesh(40, 13)];
  for (const y of [5, 8, 11]) {
    const x = y * .22;
    parts.push(ring("沿斜骨外圈开旋梯孔的观潮环台", wood, 4.4, 1.8, 0, .2, { position: { x, y: y + .1, z: 0 } }),
      box("观潮环台向海侧真正悬挑的平层", x + 4.7, y + .1, 0, 4.4, .2, 3.5, wood),
      tube("从骨干伸到悬台底的整体斜托肋", bone, [[x - .3, y - 2.2, .3], [x + 2.3, y - 1, .7], [x + 6.4, y, .7]], .22),
      box("向海悬台末端的通长护栏", x + 6.8, y + .7, 0, .13, 1.1, 3.5, bone));
  }
  for (let step = 0; step < 53; step += 2) {
    const a = (step + 1) * Math.PI / 8, y = .6 + step * .2;
    parts.push(rail([y * .22 + Math.cos(a) * 2.6, y, Math.sin(a) * 2.6], [y * .22 + Math.cos(a) * 2.6, y + .85, Math.sin(a) * 2.6], .045, bone));
  }
  return parts;
}

export const fantasySpaceBatchThreeDesigns = [
  design("翼膜风筝汗宫", "交叉高低边的连续鞍形薄膜由中央桅、边桅与帐外地锚共同撑起，软壁之间留门口和通风缝，内部是可进入的大跨度会见帐宫", kitePalace, "建筑", "奇幻"),
  design("三浮岩连锁船坞", "三座悬岩上的坞岸连成前方完全开放的U形泊槽，地面重岩以真实绷缆锚固，后岛装卸桅的斜托臂与吊环伸入泊区", floatingDock, "建筑", "奇幻"),
  design("分流泉帘礼拜堂", "完整薄券礼拜空间位于分开的溢流泉墙后，独立侧柱支廊和水槽侧壁保留通人路径；泉帘仅为静态造型，不宣称运行流体求解", springSanctuary, "建筑", "奇幻"),
  design("双面对镜回环迷宫", "固定双面镜墙围出连续折返与环行通道，独立前入口和偏置后出口真实开口，四角高锚柱统一支承整座无顶镜院；镜面为静态材质表现", mirrorLabyrinth, "建筑", "奇幻"),
  design("斜挑巨骨观潮塔", "倾斜巨骨主干承托三层开孔观潮环台和向海悬台，外侧连续旋梯沿骨干逐级上行，骨肋接到悬台底，末端护栏围住观海侧", boneWatchtower, "建筑", "奇幻"),
];
