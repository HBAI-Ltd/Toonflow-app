import { part, crystal, type ModelPart } from "../assetModelParts";
import { polygon } from "../masterNature/shared";
import { helicalFlight } from "../masterTransport/parts";
import { base, box, cylinder, design, rail } from "./structures";
import { barrelRoof, halfRoundWall } from "./spatialShells";

const bone = "#c2c1ac", stone = "#939a91", wood = "#88765b", dark = "#5b6265", roof = "#748785";

export function stairFlight(x: number, z: number, y: number, first: number, count: number, rise: number, run: number): ModelPart {
  const vertices: { x: number; y: number; z: number }[] = [], indices: number[] = [];
  for (let index = first; index < first + count; index++) {
    const bottom = y, top = y + (index + 1) * rise, centerZ = z + index * run;
    const corners = [bottom, top].flatMap(h => [[-1, -1], [1, -1], [1, 1], [-1, 1]].map(([sx, sz]) => ({ x: x + sx! * .72, y: h, z: centerZ + sz! * run / 2 })));
    for (const face of [[0, 1, 2, 3], [4, 7, 6, 5], [0, 4, 5, 1], [1, 5, 6, 2], [2, 6, 7, 3], [3, 7, 4, 0]]) {
      const n = vertices.length; vertices.push(...face.map(i => corners[i]!)); indices.push(n, n + 1, n + 2, n, n + 2, n + 3);
    }
  }
  return part("在连续实承阶体上分出真实步高的登层楼梯", "mesh", wood, [0, 0, 0], [1, 1, 1], [0, 0, 0], { vertices, indices });
}

function dragonAirbase(): ModelPart[] {
  const lowerOutline: [number, number][] = [[-5, -12], [-4.3, -12], [-4.3, -5.6], [-2.5, -5.6], [-2.5, -12], [2.5, -12], [2.5, -5.6], [4.3, -5.6], [4.3, -12], [5, -12], [5, 12], [-5, 12]];
  const upperHoles: [number, number][][] = [-1, 1].map(side => [[side * 3.4 - .9, -9.8], [side * 3.4 + .9, -9.8], [side * 3.4 + .9, -1.6], [side * 3.4 - .9, -1.6]]);
  const parts: ModelPart[] = [base(30, 28), box("龙栖空港中部地面服务大厅地坪", 0, .4, 0, 9, .4, 24, stone),
    polygon("下层服务廊在登层梯顶保留真实开敞梯口", wood, lowerOutline, .3, [0, 7.05, 0]),
    polygon("上层服务廊在两段楼梯上方留贯通梯洞", wood, [[-5, -12], [5, -12], [5, 12], [-5, 12]], .3, [0, 13.05, 0], upperHoles),
    part("跨越两翼栖台的大跨度双坡翼瓦顶", "extrude", roof, [0, 18.4, 0], [1, 1, 1], [0, 0, 0], { depth: 23, profile: [{ x: -14.5, y: 0 }, { x: 0, y: 6.4 }, { x: 14.5, y: 0 }, { x: 14.4, y: -.3 }, { x: 0, y: 6.05 }, { x: -14.4, y: -.3 }] })];
  for (const side of [-1, 1]) {
    for (const z of [-9, 9]) for (const radius of [5, 13]) {
      const top = 24.5 - 6.35 * radius / 14.4;
      parts.push(box("空港翼架从地面实际接到斜屋面下缘的整柱", side * radius, (top + .2) / 2, z, .55, top - .2, .55, wood), box("木柱下宽出的压地石础", side * radius, .45, z, 1.3, .9, 1.3, stone));
    }
    for (const z of [-9, 9]) parts.push(rail([side * 13, 24.5 - 6.35 * 13 / 14.4, z], [0, 24.5, z], .3, wood));
    for (const y of [7.2, 13.2]) {
      parts.push(box("侧开龙栖间承重楼板", side * 9.1, y, 0, 8.5, .3, 18.4, wood));
      for (const z of [-9, 0, 9]) parts.push(box("左右栖间实际分隔的厚墙屏", side * 9.1, y + 2.7, z, 8.5, 5.1, .23, bone));
      for (const z of [-7.3, 0, 7.3]) parts.push(box("内侧服务墙在栖间门口断开", side * 4.95, y + 2.7, z, .22, 5.1, z === 0 ? 5.1 : 3.6, bone));
      for (const z of [-4.5, 4.5]) {
        parts.push(box("从侧开栖间向外伸出的独立起降长舌台", side * 17.7, y, z, 9.2, .34, 6.5, stone),
          rail([side * 13, y - 3.5, Math.sign(z) * 9], [side * 20.5, y - .1, z], .35, wood));
      }
    }
    parts.push(stairFlight(side * 3.4, -14.2, .4, 0, 20, .23, .29), stairFlight(side * 3.4, -14.2, .4, 20, 10, .23, .29),
      stairFlight(side * 3.4, -9.6, 7.35, 0, 20, .22, .3), stairFlight(side * 3.4, -9.6, 7.35, 20, 7, .22, .3));
  }
  parts.push(box("后侧连通两层的独立服务骨脊", 0, 9.1, 10.3, 2.6, 18, 1.1, stone));
  return parts;
}

function memorialGarden(): ModelPart[] {
  const parts: ModelPart[] = [cylinder("整个环坡陵园完整落地庭坪", 0, .18, 0, 33, .36, stone),
    halfRoundWall("正门真实断开的陵园外围矮墙", 15.4, .35, 1.6, [0, .36, 0], 67.5, bone, Math.PI * 7 / 4),
    cylinder("环坡终点中央纪念高台", 0, 1.9, 0, 10, 3, bone), box("环坡末端实际接入纪念台的横桥", -6.5, 3.42, 0, 5.7, .24, 2.4, wood)];
  const ramp = helicalFlight([0, .4, 0], 7, 10, 3, .75, 1, .2);
  ramp.name = "由正门低点连续上升到纪念高台的四分之三环坡"; ramp.rotation.y = 90; ramp.color = wood;
  parts.push(ramp);
  for (let index = 1; index < 8; index++) {
    const t = index / 8, a = t * Math.PI * 1.5, top = .3 + t * 3, height = top - .36;
    parts.push(cylinder("连续环坡下与各自坡高一致的真实落地支柱", Math.sin(a) * 8.5, .36 + height / 2, -Math.cos(a) * 8.5, .4, height, bone));
  }
  for (let index = 0; index < 8; index++) {
    if (index === 6) continue;
    const angle = index * Math.PI / 4, yaw = 90 - index * 45, x = Math.cos(angle) * 13.2, z = Math.sin(angle) * 13.2;
    const bay: ModelPart[] = [box("地上骨龛组后壁", 0, 2.1, .5, 6.1, 3.6, .2, dark)];
    for (const h of [.4, 2.1, 3.8]) bay.push(box("骨龛水平床板及过梁", 0, h, 0, 6.1, .2, 1.2, bone));
    for (const offset of [-3, -1, 1, 3]) bay.push(box("骨龛分隔竖壁真实围出独立开口", offset, 2.1, 0, .18, 3.6, 1.2, bone));
    const a = yaw * Math.PI / 180;
    for (const item of bay) {
      const px = item.position.x, pz = item.position.z;
      item.position.x = x + px * Math.cos(a) + pz * Math.sin(a); item.position.z = z + pz * Math.cos(a) - px * Math.sin(a); item.rotation.y += yaw;
    }
    parts.push(...bay);
  }
  for (const side of [-1, 1]) parts.push(box("庭园大门两侧纪念门柱", side * 5.9, 2.2, -14.2, .75, 4.1, 1.2, bone));
  parts.push(box("高台纪念碑的通长底座", 0, 3.75, 0, 4.6, .5, 2.1, dark),
    part("开敞纪念高台上的分叉纪念碑", "extrude", bone, [0, 4, 0], [1, 1, 1], [0, 0, 0], { depth: .6, profile: [{ x: -1.8, y: 0 }, { x: -1.8, y: 3.2 }, { x: -1.1, y: 4.8 }, { x: -.4, y: 2.1 }, { x: .4, y: 2.1 }, { x: 1.1, y: 4.8 }, { x: 1.8, y: 3.2 }, { x: 1.8, y: 0 }] }));
  return parts;
}

function trapDungeon(): ModelPart[] {
  const outline: [number, number][] = [[-12, -12], [12, -12], [12, 12], [-12, 12]], holes: [number, number][][] = [-1, 1].map(side => [[side * 5.5 - 3.75, -4.25], [side * 5.5 + 3.75, -4.25], [side * 5.5 + 3.75, 4.25], [side * 5.5 - 3.75, 4.25]]);
  const parts: ModelPart[] = [base(25, 27), polygon("双陷井之间保持真空孔的地牢行走层", stone, outline, .24, [0, 2.2, 0], holes),
    box("陷井下低处可见的完整井底", 0, .35, 0, 23.5, .3, 12, dark),
    ...[-1, 1].map(side => box("地牢两边围合的厚墙", side * 12.2, 4.9, 0, .4, 5.4, 24.5, stone)),
    ...[-1, 1].flatMap(side => [box("前入口两侧真正留门洞的墙体", side * 7.2, 4.9, -12.1, 10.1, 5.4, .4, stone), box("后侧逃生甬道两边的围墙", side * 7.2, 4.9, 12.1, 10.1, 5.4, .4, stone)]),
    barrelRoof("后部闸堂的完整薄券罩顶", 12, .3, 7, [0, 7.6, 8.5], stone), box("正门外踏入高层地坪的接踏板", 0, 2.32, -12.25, 2.2, .24, .85, wood),
    stairFlight(0, -16.05, .18, 0, 11, .21, .35)];
  for (const side of [-1, 1]) {
    const centerX = side * 5.5;
    for (const edge of [-1, 1]) parts.push(box("井内左右贯通到低底的竖直内壁", centerX + edge * 3.75, 1.35, 0, .18, 1.8, 8.5, dark),
      box("井内前后承接行走层的内壁", centerX, 1.35, edge * 4.25, 7.5, 1.8, .18, dark));
    for (let index = 0; index < 5; index++) parts.push(crystal("陷井底可见而不冒充运行触发器的固定石牙", bone, [centerX + (index % 2 ? -1 : 1) * 1.2, .75, -2.8 + index * 1.4], [.7, 1, .7]));
  }
  for (const [x, z, width] of [[0, -5.5, 3.4], [-10.5, 1, 2.65], [10.5, -1.5, 2.65]]) {
    for (const side of [-1, 1]) parts.push(box("错位闸间两侧真正承到地面的门柱", x! + side * width! / 2, 5.1, z!, .26, 5.5, .7, bone));
    parts.push(box("闸间顶部跨梁", x!, 7.8, z!, width! + .6, .35, .8, bone));
    for (let index = 0; index < 5; index++) parts.push(box("已升起并保留通人净空的静态落闸栅", x! - width! * .4 + index * width! * .2, 6.1, z!, .12, 2.5, .16, dark));
    parts.push(box("落闸栅横向锁梁", x!, 6.2, z!, width!, .18, .2, dark));
  }
  parts.push(box("后侧逃生甬道接入地牢的连续地板", 0, 2.32, 15, 4, .24, 6.5, wood),
    ...[-1, 1].map(side => box("逃生甬道两侧不封死前后口的薄壁", side * 2, 3.95, 15, .2, 3.1, 6.5, stone)), box("逃生甬道上方的完整承盖板", 0, 5.6, 15, 4.2, .24, 6.5, stone));
  return parts;
}

export const fantasySpaceBatchFiveDesigns = [
  design("飞龙栖台空港", "双层侧开栖间与独立起降长舌台连到后部服务廊，整柱与斜托撑起两层楼板，大跨度翼顶下保留高大栖息空间，端梯实际连接各层；不包含飞行动画或动物模型", dragonAirbase, "建筑", "奇幻"),
  design("骨龛环坡陵园", "围合地上纪念园沿边界布置七组开口龛墙，连续四分之三环坡经横桥接到中央纪念高台，开放前门与偏置龛墙连成环游动线", memorialGarden, "建筑", "奇幻"),
  design("落阱错门地牢", "厚层地坪真正挖空两个落阱，井间分道通过错位抬起的闸间接到后侧逃生甬道，内壁和低井底构成真实深差；这是静态场景主体，不包含触发器或动态落闸", trapDungeon, "建筑", "奇幻"),
];
