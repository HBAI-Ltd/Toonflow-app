import { part, type ModelPart } from "../assetModelParts";
import { polygon } from "../masterNature/shared";
import { box, cylinder, design, colors } from "./structures";
import { halfRoundWall } from "./spatialShells";
import { doorway } from "./publicSpaceBatchOne";
import { stairFlight } from "./publicSpaceBatchTwo";
import { bankedTrack } from "./publicSpaceBatchFive";
import { boxesMesh, type SolidBox } from "./publicSpaceBatchEight";

const stone = "#b6b4a4", dark = "#50666a", wood = "#ad956d";

export const publicSpaceBatchTwelveDesigns = [
  design("梯台连院坡地学校", "三片落地高差台地各自承住独立教室翼与前庭，左右外阶梯实际接到下一片高台，十二间教室从有顶步廊独立进入，后侧连续窗为每间教室采光", terracedSchool, "建筑", "现代"),
  design("悬谷索顶公共食堂", "两侧高墙锚住向中央下凹的完整长跨谷顶，细肋随屋壳连续下垂，前方公共餐区与后方厨房由工作门和真实服务窗口分开，长桌座台保留纵横通道", cableRoofDiningHall, "建筑", "现代"),
  design("六瓣阶田交响音乐厅", "六片实体阶田观众席环绕中央演奏圆台，瓣间径向阶梯逐级接到三层阶席，外环高位绕行廊连接前后入场阶梯，六边形完整厅壳与独立前厅共同围护", vineyardConcertHall, "建筑", "现代"),
];

function terracedSchool(): ModelPart[] {
  const p: ModelPart[] = [], structure: SolidBox[] = [], desks: SolidBox[] = [], boards: SolidBox[] = [];
  for (let level = 0; level < 3; level++) {
    const y = .3 + level * 2.4, z = (level - 1) * 18;
    p.push(box("三片前后接合且实际落地的阶梯台地", 0, y / 2, z, 42, y, 18, stone), box("每片教室翼与前步廊共同的完整屋盖", 0, y + 3.6, z + 1.5, 36.5, .2, 13, dark), box("教室后侧连续实体窗下墙", 0, y + .5, z + 8, 36, 1, .24, stone), box("教室后侧连续实体窗楣", 0, y + 3.15, z + 8, 36, .7, .24, stone), part("十二间教室各自通向室外的连续后窗", "box", colors.glass, [0, y + 1.9, z + 8], [36, 1.8, .05], [0, 0, 0], { opacity: .24 }));
    for (const x of [-13.5, -4.5, 4.5, 13.5]) {
      p.push(doorway("每间教室通向前步廊的独立真实入口", [x, y, z - 2], 9, 3.5, 1.2, 0, 2.4));
      boards.push({ center: [x, y + 2, z + 7.8], size: [4, 1.5, .08] });
      for (const offset of [0, 2, 4]) {
        desks.push({ center: [x, y + .8, z + offset], size: [6, .12, .6] });
        for (const side of [-1, 1]) desks.push({ center: [x + side * 2.2, y + .37, z + offset], size: [.12, .74, .5] });
      }
    }
    for (const x of [-18, -9, 0, 9, 18]) structure.push({ center: [x, y + 1.75, z + 3], size: [.24, 3.5, 10] });
    for (const x of [-17, 17]) structure.push({ center: [x, y + 1.75, z - 4.8], size: [.2, 3.5, .2] });
    if (level < 2) for (const x of [-19.5, 19.5]) p.push(stairFlight("避开教室翼并实际接到下一高台的室外宽阶梯", x, y, z + 4.8, 1.8, 12, .2, .35));
  }
  for (let start = 0; start < structure.length; start += 18) p.push(boxesMesh("十二教室真实隔墙与有顶步廊承柱", stone, structure.slice(start, start + 18)));
  for (let start = 0; start < desks.length; start += 18) p.push(boxesMesh("各独立教室内实际落地的连续课桌", wood, desks.slice(start, start + 18)));
  p.push(boxesMesh("每间独立教室后侧实际立面教学板", "#637e70", boards));
  return p;
}

function diningEnd(name: string, z: number, opening: number, offset: number): ModelPart {
  const profile = [{ x: -17, y: 0 }, { x: offset - opening / 2, y: 0 }, { x: offset - opening / 2, y: 2.6 }, { x: offset + opening / 2, y: 2.6 }, { x: offset + opening / 2, y: 0 }, { x: 17, y: 0 }];
  for (let index = 0; index <= 14; index++) { const x = 17 - index * 34 / 14; profile.push({ x, y: 3.7 + .008 * x * x }); }
  return part(name, "extrude", stone, [0, .3, z], [1, 1, 1], [0, 0, 0], { depth: .25, profile });
}

function cableRoofDiningHall(): ModelPart[] {
  const edge = 4 + .008 * 17 * 17, lower = Array.from({ length: 15 }, (_, index) => { const x = -17 + index * 34 / 14; return { x, y: 4 + .008 * x * x }; });
  const profile = [...lower, ...[...lower].reverse().map(p => ({ x: p.x, y: p.y + .2 }))];
  const p: ModelPart[] = [box("完整食堂与后厨共同落地地坪", 0, .15, 0, 35, .3, 42, stone), part("两侧高起而中部下凹的完整悬谷长跨薄壳", "extrude", dark, [0, 0, 0], [1, 1, 1], [0, 0, 0], { depth: 40, profile }), diningEnd("沿谷顶曲线封合且有真实主门的前端墙", -20, 3.2, 0), diningEnd("后厨独立工作入口所在的曲线端墙", 20, 1.6, -12), box("后厨独立低顶不接触悬谷屋壳", 0, 3.675, 15, 34, .15, 10, dark), doorway("后厨实际工作人员门洞", [-12, .3, 10], 10, 3.3, 1.4), doorway("后厨取餐窗的实际高位开口", [0, .3, 10], 14, 3.3, 6, 0, 2.2), doorway("后厨回收窗口的实际高位开口", [12, .3, 10], 10, 3.3, 3, 0, 2.2), box("堵住取餐开口下半部的真实服务柜台", 0, .8, 9.7, 6, 1, .6, wood), box("堵住回收开口下半部的真实回收柜台", 12, .8, 9.7, 3, 1, .6, wood)];
  for (const x of [-17, 17]) {
    p.push(box("悬谷食堂两侧锚固墙的实体窗下带", x, .8, 0, .25, 1, 40, stone), box("悬谷食堂两侧锚固墙的连续高梁", x, edge - .35, 0, .35, .7, 40, stone), part("锚固侧墙实际高窗孔中的完整透明玻璃", "box", colors.glass, [x, (1.3 + edge - .7) / 2, 0], [.05, edge - 2, 40], [0, 0, 0], { opacity: .24 }));
    for (const z of [-19.8, 19.8]) p.push(box("高侧墙两端实际落地的屋壳锚柱", x, (edge + .3) / 2, z, .35, edge - .3, .35, dark));
  }
  for (const z of [-13, 0, 13]) p.push({ ...bankedTrack("从一侧高墙连续下垂到另一侧的谷顶细肋", lower.map(value => ({ x: value.x, z, nx: 0, nz: -1, bank: 0, height: value.y, base: value.y - .06 })), .08), color: dark });
  const tables: SolidBox[] = [];
  for (const x of [-11, 0, 11]) for (const z of [-12, -5, 2]) {
    tables.push({ center: [x, 1.05, z], size: [6, .1, 1.4] });
    for (const side of [-1, 1]) {
      tables.push({ center: [x + side * 2.2, .65, z], size: [.12, .7, 1] }, { center: [x, .675, z + side * 1.1], size: [6, .15, .6] });
      for (const foot of [-1, 1]) tables.push({ center: [x + foot * 2.2, .45, z + side * 1.1], size: [.15, .3, .6] });
    }
  }
  for (let start = 0; start < tables.length; start += 18) p.push(boxesMesh("公共食堂长桌与两侧实际落地座台", wood, tables.slice(start, start + 18)));
  p.push(box("后厨独立备餐长工作台", 0, .75, 16, 12, .9, 1.2, "#939f98"));
  return p;
}

function vineyardConcertHall(): ModelPart[] {
  const outline: [number, number][] = [[-22, -20], [22, -20], [26, 0], [18, 24], [-18, 24], [-26, 0]];
  const p: ModelPart[] = [box("六瓣阶席与前后入场阶梯共同落地基础", 0, .15, 0, 64, .3, 64, stone), polygon("包住完整六边音乐厅的连续隔声屋面", dark, outline, .3, [0, 12.8, 0]), cylinder("六瓣阶田观众席围绕的中央演奏圆台", 0, .75, 0, 12, .9, wood), doorway("前厅独立实际公共主入口", [0, .3, -26], 30, 5.5, 4, 0, 2.8), box("导向主厅门洞的完整前厅屋面", 0, 5.95, -23, 30.4, .3, 6.4, dark), halfRoundWall("与最高阶田及径向阶梯齐平的完整外环公共廊", 19, 2.1, 2.1, [0, .3, 0], 0, stone, Math.PI * 2), box("前厅阶梯跨到高位外环廊的实际连接平台", 0, 2.275, -19.7, 3, .25, 1.8, wood), box("高位环廊接向后门外阶梯的实际长平台", 0, 2.275, 21.7, 2.4, .25, 5.8, wood), stairFlight("由地面前厅上行到外环公共廊的实际入场阶梯", 0, .3, -25.4, 3, 12, .175, .4), stairFlight("后门外由地面上行到高位环廊的实际阶梯", 0, .3, 29.4, 2.4, 12, .175, .4, true)];
  for (const x of [-15, 15]) p.push(box("前厅两侧真实封合外墙", x, 3.05, -23, .24, 5.5, 6, stone));
  for (let index = 0; index < outline.length; index++) {
    const a = outline[index]!, b = outline[(index + 1) % outline.length]!, dx = b[0] - a[0], dz = b[1] - a[1];
    const center: [number, number, number] = [(a[0] + b[0]) / 2, .3, (a[1] + b[1]) / 2], yaw = -Math.atan2(dz, dx) * 180 / Math.PI, width = Math.hypot(dx, dz);
    if (index === 0 || index === 3) p.push(doorway("高位公共廊前后两端实际连通的主厅门洞", center, width, 12.5, index ? 2.4 : 3, yaw, 5));
    else p.push(part("六边音乐主厅斜向完整隔声外墙", "box", stone, [center[0], 6.55, center[2]], [width, 12.5, .24], [0, yaw, 0]));
  }
  for (let petal = 0; petal < 6; petal++) {
    const angle = petal * Math.PI / 3, start = angle - Math.PI * 5 / 36;
    for (let row = 0; row < 3; row++) {
      const top = .3 + (row + 1) * .7;
      p.push(halfRoundWall("每瓣真实落地并逐级升高的实体观众阶田", 11 + row * 3, 3, (row + 1) * .7, [0, .3, 0], -start * 180 / Math.PI, stone, Math.PI * 5 / 18), halfRoundWall("各级阶田上实际落地的连续观众座台", 10.6 + row * 3, .65, .45, [0, top, 0], -start * 180 / Math.PI, "#959b8b", Math.PI * 5 / 18));
    }
    const a = angle + Math.PI / 6, stair = stairFlight("瓣间径向阶梯与各层观众阶田逐级齐平", 0, .3, 0, 1.2, 12, .175, .75);
    stair.vertices = stair.vertices!.map(v => { const angle = a - v.x / .6 * Math.PI / 36; return { x: Math.cos(angle) * (8 + v.z), y: v.y, z: Math.sin(angle) * (8 + v.z) }; }); p.push(stair);
  }
  p.push(stairFlight("中央演奏圆台朝前厅方向的实际登台阶梯", 0, .3, -7.2, 2, 4, .225, .325));
  return p;
}
