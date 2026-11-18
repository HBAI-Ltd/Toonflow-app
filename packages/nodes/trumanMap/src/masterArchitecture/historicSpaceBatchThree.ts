import { part, ring, beam, type ModelPart, type Triple } from "../assetModelParts";
import { box, base, cylinder, arch, design, type ArchitecturePrototype } from "./structures";
import { barrelRoof, halfRoundWall, rectangularFlue } from "./spatialShells";
import { polygon } from "../masterNature/shared";

const stone = "#afac99", brick = "#a08468", earth = "#9e9278", wood = "#927552", iron = "#50606a", water = "#80a6ac";

// 原创简化建筑类型；不将同堡的大小、损坏状态或塔数排列登记为另一主素材。
// https://historicengland.org.uk/listing/the-list/list-entry/1284281
// https://www.english-heritage.org.uk/castles/castles-through-time/
// https://whc.unesco.org/en/list/398/
// https://www.patrimoinedetunisie.com.tn/en/monuments/ribat-of-monastir/overview/
// https://whc.unesco.org/en/list/1668/
// https://www.metmuseum.org/art/collection/search/587738
// https://whc.unesco.org/en/list/87
// https://www.turismoroma.it/it/node/1021
export const historicSpaceBatchThreeDesigns: ArchitecturePrototype[] = [
  design("中央承柱马泰洛炮塔", "厚圆炮塔由中央柱和放射承托架支住露天炮层，抬高入口通过外梯进入，内阶经真实甲板孔登上炮位", martelloTower, "建筑", "欧式"),
  design("双圈高低城垣同心堡", "低外幕墙与更高的内幕墙围出两层可走防御区，两道真实门洞通向内院，外部圆塔与内侧方塔共同守备", concentricCastle, "建筑", "欧式"),
  design("八角内庭角塔石堡", "八角外壁和八角内庭之间保留分间房环，八处外角另设八边角塔，环形上层楼板在中央庭院留出真孔", octagonalCastle, "建筑", "欧式"),
  design("双层房廊里巴特守备院", "厚石围壁包住双层修行房廊和露天内庭，独立高观察塔与可步行上层防守平台接合", ribatFort, "建筑", "异域"),
  design("壕沟射廊多边炮堡", "折线夯土炮垒护住内侧连续券室，前方封顶侧射廊突出干壕，后门与内场坡道连接", polygonalFort, "建筑", "欧式"),
  design("单门内庭商队驿院", "狭长入口券道通入方庭，院侧旅客房与后环畜厩有独立通道，低门廊与货物卸载高台构成完整商旅停驻空间", caravanserai, "建筑", "异域"),
  design("双层凹龛宁芙壁泉宫", "高凹面壁泉立面以分层柱列框出真实深龛，下方长池接住中龛溢水，侧翼展开围出可走石铺前场", nymphaeum, "建筑", "欧式"),
  design("连坡柱廊阶台陵庙", "叠高的开放前庭经连续正坡相连，各层高台前有实际承盖柱廊，最高层内圣室嵌入后壁", terraceMortuaryTemple, "建筑", "异域"),
  design("竖井接室马斯塔巴陵屋", "平顶斜壁长方陵屋内的祭室与深竖井分开，竖井通到下方独立墓室，剖示边保留真实空腔", mastabaTomb, "建筑", "异域"),
  design("断山花双层岩凿墓殿", "岩壁内有真实墓室入口，外立面下层三角山花和上层断开山花之间保留中央圆龛塔，柱列同岩体实际接合", rockFacadeTomb, "建筑", "异域"),
  design("下沉阶道圆井圣泉室", "狭窄直阶从上部开敞入口下到圆井，独立圆井室的叠涩石顶和连续矩形阶廊同时保留真实空腔", sacredWell, "建筑", "异域"),
  design("内螺旋梯圆柱纪功塔", "门座内的螺旋石梯沿中空圆柱升到上平台，平台留有实际出梯孔，柱外浅旋带与顶上人像属于完整纪功塔", victoryColumn, "建筑", "欧式"),
];

function frontDoor(name: string, width: number, height: number, depth: number, gap: number, position: Triple, color = stone): ModelPart[] {
  const side = (width - gap) / 2, head = height - Math.min(3.2, height - .6);
  return [...[-1, 1].map(s => box(`${name}门侧厚身`, position[0] + s * (gap + side) / 2, position[1] + height / 2, position[2], side, height, depth, color)), box(`${name}洞顶横梁`, position[0], position[1] + height - head / 2, position[2], gap, head, depth, color)];
}

function flatWall(name: string, a: [number, number], b: [number, number], height: number, y: number, thickness = .5, color = stone): ModelPart {
  return part(name, "box", color, [(a[0] + b[0]) / 2, y + height / 2, (a[1] + b[1]) / 2], [Math.hypot(b[0] - a[0], b[1] - a[1]), height, thickness], [0, -Math.atan2(b[1] - a[1], b[0] - a[0]) * 180 / Math.PI, 0]);
}

function circle(radius: number, count = 16): [number, number][] { return Array.from({ length: count }, (_, i) => [Math.cos(i * Math.PI * 2 / count) * radius, Math.sin(i * Math.PI * 2 / count) * radius]); }
function translatedRing(name: string, r: number, t: number, h: number, position: Triple, color = stone): ModelPart { const value = ring(name, color, r, t, position[1], h); value.position.x = position[0]; value.position.z = position[2]; return value; }
function stairs(name: string, count: number, width: number, rise: number, run: number, position: Triple): ModelPart[] { return Array.from({ length: count }, (_, i) => box(name, position[0], position[1] + (i + 1) * rise / 2, position[2] + i * run, width, (i + 1) * rise, run)); }
function ramp(name: string, width: number, length: number, height: number, position: Triple, color = stone): ModelPart { return part(name, "extrude", color, position, [1, 1, 1], [0, 90, 0], { depth: width, profile: [{ x: -length / 2, y: 0 }, { x: length / 2, y: 0 }, { x: -length / 2, y: height }] }); }

function roundTower(x: number, z: number, radius: number, height: number, yaw: number): ModelPart[] {
  return [halfRoundWall("圆塔低层朝内的真实入口", radius, .45, 2.4, [x, .18, z], yaw, stone, Math.PI * 2 - .65), translatedRing("圆塔上部空心厚墙", radius, .45, height - 2.4, [x, .18 + 2.4 + (height - 2.4) / 2, z]), translatedRing("塔顶可踏环形步道", radius - .3, .75, .24, [x, height + .18, z]), translatedRing("圆塔露天顶部防护沿", radius, .3, .9, [x, height + .7, z])];
}

function martelloTower(): ModelPart[] {
  const p: ModelPart[] = [base(17, 20), translatedRing("塔底完整厚圆壁", 4.8, .7, 3.2, [0, 1.78, 0]), halfRoundWall("高于地面的真实入塔门洞", 4.8, .7, 2.2, [0, 3.38, 0], 82.5, stone, Math.PI * 2 - 15 * Math.PI / 180), translatedRing("高门以上完整厚石围壁", 4.8, .7, 2.4, [0, 6.78, 0]), cylinder("从基础支到承顶架的中央石墩", 0, 3.6, 0, 1.8, 6.84, stone), ...stairs("登上高门的外部实心石梯", 16, 1.7, .2, .3, [0, .18, -9.4])];
  for (let i = 0; i < 6; i++) { const a = i * Math.PI / 3; p.push(beam("中央墩向圆壁传力的放射石承托", stone, [Math.cos(a) * .7, 6.95, Math.sin(a) * .7], [Math.cos(a) * 4.1, 7.92, Math.sin(a) * 4.1], .48)); }
  const holeCenter: [number, number] = [Math.cos(204 * Math.PI / 180) * 2.6, Math.sin(204 * Math.PI / 180) * 2.6], hole = circle(.78, 10).map(([x, z]) => [x + holeCenter[0], z + holeCenter[1]] as [number, number]);
  p.push(box("高门到内螺旋梯之间的实际承重落脚平台", 0, 3.36, -3.6, 1.4, .18, 2.5));
  p.push(polygon("炮层甲板保留真实内部登梯孔", stone, circle(4.8, 24), .2, [0, 7.98, 0], [hole]), translatedRing("塔顶遮护炮位的连续厚胸墙", 4.8, .5, 1, [0, 8.68, 0]), cylinder("中央炮位回转座", 0, 8.55, 0, 2.3, .74, iron), box("回转座上的独立炮架", 0, 9.17, 0, 1.5, .55, 1.8, wood), cylinder("面向海面的主炮管", 0, 9.6, -1.3, .45, 3.8, iron, [90, 0, 0]));
  for (let i = 0; i < 22; i++) { const a = (-90 + i * 14) * Math.PI / 180; p.push(part("圆塔内壁真实逐级升高的短石梯", "box", stone, [Math.cos(a) * 2.6, 3.48 + i * .21, Math.sin(a) * 2.6], [.95, .18, .67], [0, -a * 180 / Math.PI, 0])); }
  return p;
}

function concentricCastle(): ModelPart[] {
  const p: ModelPart[] = [base(58, 64), ...frontDoor("外幕墙贯通城门", 37, 5, 1, 4, [0, .18, -25]), ...[-1, 1].map(s => box("低外幕墙两侧长墙", s * 22, 2.68, 0, 1, 5, 43)), box("低外幕墙后墙", 0, 2.68, 25, 37, 5, 1)];
  for (const x of [-1, 1]) for (const z of [-1, 1]) p.push(...roundTower(x * 22, z * 25, 3.5, 6.4, -(Math.atan2(-z, -x) + .325) * 180 / Math.PI));
  p.push(...frontDoor("高内幕墙中央城门", 21.5, 8.4, .85, 3.1, [0, .18, -14.3]), ...[-1, 1].map(s => box("内幕墙两侧高墙", s * 13, 4.38, 0, .85, 8.4, 24.4)), box("内幕墙后部高墙", 0, 4.38, 14.3, 21.5, 8.4, .85));
  for (const x of [-1, 1]) for (const z of [-1, 1]) {
    p.push(...frontDoor("方角塔朝内通行门", 4.5, 10.8, .45, 1.3, [x * 13, .18, z * (14.3 - 2.1)]), ...[-1, 1].map(s => box("方角塔两侧空心围壁", x * 13 + s * 2.1, 5.58, z * 14.3, .3, 10.8, 4.5)), box("方角塔后壁", x * 13, 5.58, z * (14.3 + 2.1), 4.5, 10.8, .3), box("方角塔顶部踏板", x * 13, 11.1, z * 14.3, 4.6, .24, 4.6));
  }
  for (const s of [-1, 1]) p.push(box("高内墙顶可踏的侧防守步道", s * 12.4, 8.45, 0, 1.5, .26, 25), box("低外墙顶可踏的侧步道", s * 21.4, 5.05, 0, 1.5, .26, 45));
  p.push(box("内场完整礼仪大厅地板", 0, .3, 8, 12, .24, 7), ...frontDoor("内场大厅入口", 12, 4.6, .35, 2.2, [0, .42, 4.5]), ...[-1, 1].map(s => box("大厅侧墙", s * 5.8, 2.72, 8, .4, 4.6, 7)), box("大厅后墙", 0, 2.72, 11.5, 12, 4.6, .4), box("大厅完整平屋盖", 0, 5.17, 8, 12.7, .3, 7.6));
  return p;
}

function octagonalCastle(): ModelPart[] {
  const outside = circle(14, 8), inside = circle(6.8, 8), p: ModelPart[] = [polygon("八角内庭城堡完整地面", stone, outside, .22), polygon("分间房环中央留出露天庭院的上层楼板", stone, outside, .25, [0, 4.8, 0], [inside]), polygon("八角房环完整平屋盖", stone, outside, .25, [0, 9.4, 0], [inside])];
  for (let i = 0; i < 8; i++) {
    const a = outside[i]!, b = outside[(i + 1) % 8]!, c = inside[i]!, d = inside[(i + 1) % 8]!;
    if (i === 5) {
      const wall = frontDoor("外堡主入口", Math.hypot(b[0] - a[0], b[1] - a[1]), 9.18, .5, 2.4, [0, .22, 0]);
      const angle = -Math.atan2(b[1] - a[1], b[0] - a[0]);
      for (const value of wall) { const x = value.position.x; value.position.x = (a[0] + b[0]) / 2 + Math.cos(angle) * x; value.position.z = (a[1] + b[1]) / 2 - Math.sin(angle) * x; value.rotation.y = angle * 180 / Math.PI; } p.push(...wall);
    } else p.push(flatWall("八角外堡连续厚壁", a, b, 9.18, .22, .5));
    const roomDoor = frontDoor("内庭通向环室的真门", Math.hypot(d[0] - c[0], d[1] - c[1]), 4.58, .35, 1.35, [0, .22, 0]), angle = -Math.atan2(d[1] - c[1], d[0] - c[0]);
    for (const value of roomDoor) { const x = value.position.x; value.position.x = (c[0] + d[0]) / 2 + Math.cos(angle) * x; value.position.z = (c[1] + d[1]) / 2 - Math.sin(angle) * x; value.rotation.y = angle * 180 / Math.PI; } p.push(...roomDoor, flatWall("八个环室之间真正的放射分隔墙", a, c, 9.18, .22, .3));
    p.push(polygon("独立八角角塔的真实空心石壁", stone, circle(2.5, 8), 10.5, [a[0], .22, a[1]], [circle(2.1, 8)]), polygon("角塔顶部封闭石盖", stone, circle(2.7, 8), .25, [a[0], 10.72, a[1]]));
  }
  return p;
}

function ribatFort(): ModelPart[] {
  const p: ModelPart[] = [base(34, 40), ...frontDoor("守备修院唯一正门", 28, 7.6, .7, 2.4, [0, .18, -16]), ...[-1, 1].map(s => box("修院两侧完整厚防守墙", s * 14, 3.98, 0, .7, 7.6, 32)), box("修院后部完整厚墙", 0, 3.98, 16, 28, 7.6, .7), polygon("双层房廊之间真正空着的内庭楼板", stone, [[-13.7, -15.7], [13.7, -15.7], [13.7, 15.7], [-13.7, 15.7]], .24, [0, 3.98, 0], [[[-7.2, -9], [-7.2, 9], [7.2, 9], [7.2, -9]]]), polygon("内庭上方开放的环状防守屋盖", stone, [[-14.2, -16.2], [14.2, -16.2], [14.2, 16.2], [-14.2, 16.2]], .25, [0, 7.78, 0], [[[-7.2, -9], [-7.2, 9], [7.2, 9], [7.2, -9]]])];
  for (const s of [-1, 1]) {
    for (const z of [-11, -5.5, 0, 5.5, 11]) p.push(box("两层修行房之间连续厚隔墙", s * 10.6, 3.98, z, 6.1, 7.6, .25), box("下层廊面固定落地墩", s * 7.2, 2.08, z, .45, 3.8, .55), box("上层廊面固定落地墩", s * 7.2, 5.99, z, .45, 3.54, .55));
    for (const y of [.45, 4.45]) p.push(box("修行房内连续坐卧低台", s * 12.5, y, 0, 2, .5, 27));
    p.push(box("后侧横廊朝内的承重方柱", s * 4, 3.98, 9, .6, 7.6, .6));
  }
  p.push(...roundTower(-13, -15, 2.5, 13.5, -67.7), translatedRing("高观察塔顶额外狭窄瞭望沿", 2.6, .3, .7, [-13, 14.75, -15]), ...stairs("内院登上环廊的实心短梯", 14, 1.65, 3.8 / 14, .32, [5.9, .18, 3.8]));
  return p;
}

function fortBank(name: string, from: [number, number], to: [number, number]): ModelPart {
  return part(name, "extrude", earth, [(from[0] + to[0]) / 2, .18, (from[1] + to[1]) / 2], [1, 1, 1], [0, Math.atan2(to[0] - from[0], to[1] - from[1]) * 180 / Math.PI, 0], { depth: Math.hypot(to[0] - from[0], to[1] - from[1]), profile: [{ x: -5, y: 0 }, { x: 5, y: 0 }, { x: 2, y: 5.2 }, { x: -2, y: 5.2 }] });
}

function polygonalFort(): ModelPart[] {
  const p: ModelPart[] = [base(66, 72), fortBank("前左折面夯土炮堤", [-24, -6], [-6.5, -19.125]), fortBank("前右折面夯土炮堤", [6.5, -19.125], [24, -6]), fortBank("炮堡左侧厚土堤", [-24, -6], [-24, 23]), fortBank("炮堡右侧厚土堤", [24, -6], [24, 23]), ...frontDoor("炮堡后部真实车辆入口", 48, 5, 1, 4.4, [0, .18, 23]), box("在侧射廊上方连接两前斜堤的厚土石桥座", 0, 5, -20, 14, .8, 5.5, earth)];
  for (const s of [-1, 1]) {
    p.push(box("侧面连续券室的外背墙", s * 20.2, 2.15, 6.8, .5, 3.94, 27));
    for (let i = 0; i < 5; i++) {
      const vault = arch(0, 0, 1.5, 1.55, 6.5, .35), z = -4 + i * 5.4; vault.position.x = s * 17; vault.position.z = z; vault.rotation.y = 90; p.push(vault);
      p.push(box("券室之间落地承重分隔厚墙", s * 17, 2.05, z + 2.4, 6.5, 3.74, .45));
    }
    p.push(ramp("通往高炮堤的宽内场实心坡", 3.8, 12, 5.2, [s * 15, .18, 16.5], earth));
  }
  p.push(box("前方干壕可见的低槽底", 0, .25, -29.2, 12, .14, 8.8, earth), box("从干壕连续通回内场的廊室石铺地面", 0, .3, -24.5, 4.4, .24, 16, stone), barrelRoof("伸出炮堤前方的封顶侧射廊", 2.2, .45, 16, [0, 2.2, -24.5], stone));
  for (const s of [-1, 1]) {
    p.push(box("侧射廊射口下部连续胸壁", s * 2.1, 1.05, -24.5, .45, 1.6, 16), box("侧射廊射口上方承券长梁", s * 2.1, 2.1, -24.5, .45, .2, 16));
    for (const z of [-31.8, -28.1, -24.4, -20.7, -17.1]) p.push(box("侧射真孔之间的短竖石墩", s * 2.1, 1.91, z, .45, .22, .65));
  }
  return p;
}

function caravanserai(): ModelPart[] {
  const p: ModelPart[] = [base(48, 54), ...frontDoor("驿院主入口宽阔门楼", 42, 5.8, .65, 3.5, [0, .18, -23]), ...[-1, 1].map(s => box("驿院外侧完整围墙", s * 21, 3.08, 0, .65, 5.8, 46)), box("驿院后围墙", 0, 3.08, 23, 42, 5.8, .65), polygon("客房与厩舍上方露天内庭的环形平盖", brick, [[-21.4, -23.4], [21.4, -23.4], [21.4, 23.4], [-21.4, 23.4]], .3, [0, 5.98, 0], [[[-12.5, -14], [-12.5, 14], [12.5, 14], [12.5, -14]]]), barrelRoof("穿门楼进入内庭的长入口券道", 1.8, .3, 9, [0, 3, -18.8], brick)];
  for (const s of [-1, 1]) {
    for (const z of [-13, -6.5, 0, 6.5, 13]) {
      p.push(box("客房之间真正隔开的石隔墙", s * 15.3, 3.08, z, 5.6, 5.8, .3), box("内庭客房门廊承重墩", s * 12.5, 2.18, z, .5, 4, .6));
      const q = arch(0, 0, 2.7, 1, .5, .25); q.position.x = s * 12.5; q.position.z = z + 3.1; q.rotation.y = 90; p.push(q);
    }
    p.push(box("客房后方通往环厩的内隔壁", s * 18.1, 3.08, 0, .35, 5.8, 35), box("后环厩舍的低饲槽外壁", s * 20.1, .8, 0, .35, 1.24, 35), box("货物在门侧卸载的抬高石台", s * 7, .6, -13.2, 8.5, .84, 3.8));
  }
  p.push(box("主院旅客取水的低石池底", 0, .35, 0, 5, .34, 5), translatedRing("取水池真正空心的挡水壁", 2.5, .25, .6, [0, .82, 0]), cylinder("驿院水池独立静态水面", 0, .7, 0, 4.4, .03, water));
  return p;
}

function nymphaeum(): ModelPart[] {
  const p: ModelPart[] = [base(32, 21), halfRoundWall("凹面壁泉后方实际连续石壳", 9.4, .6, 10.8, [0, .18, 2.5], 0, stone), box("壁泉前方宽长承水池底", 0, .35, -1.7, 21, .34, 5.2), ...[-1, 1].map(s => box("承水长池两侧挡水壁", s * 10.3, .85, -1.7, .4, .66, 5.2)), box("承水长池前方连续池壁", 0, .85, -4.2, 21, .66, .4), part("池内独立静态水面", "box", water, [0, .83, -1.7], [20.2, .035, 4.4], [0, 0, 0], { opacity: .7, roughness: .22 })];
  for (let i = 0; i < 7; i++) {
    const a = (15 + i * 25) * Math.PI / 180, x = Math.cos(a) * 8.2, z = 2.5 + Math.sin(a) * 8.2;
    p.push(cylinder("下层凹面柱列的独立石柱", x, 2.665, z, .45, 4.97, stone), cylinder("上层凹面柱列的独立石柱", x, 7.8, z, .38, 4.6, stone));
  }
  p.push(halfRoundWall("两层柱列之间连续弧形额枋", 9.4, 1.8, .35, [0, 5.15, 2.5], 0, stone), halfRoundWall("高柱廊顶上的连续弧形冠檐", 9.4, 1.8, .4, [0, 10.1, 2.5], 0, stone), translatedRing("中部龛内真正中空的蓄水钵", 1.5, .2, .55, [0, 3.25, 9.1]), cylinder("高位蓄水钵完整池底", 0, 3.01, 9.1, 3, .1, stone), box("高位蓄水钵实际落地石托柱", 0, 1.58, 9.1, 1.3, 2.8, 1.3), box("把中龛水钵接到长池的开放石槽底", 0, 1.2, 3.7, 1.1, .2, 10), ...[-1, 1].map(s => box("开放承水槽两旁实际挡水壁", s * .5, 1.6, 3.7, .12, .6, 10)), part("中龛落入承槽的静态薄水幕", "box", water, [0, 2.38, 8.3], [.55, 1.36, .035], [0, 0, 0], { opacity: .6, roughness: .2 }));
  for (const s of [-1, 1]) p.push(box("壁泉向前展开的两侧厚翼墙", s * 12.3, 3.5, 2.2, .6, 6.64, 10), box("侧翼前端独立柱础", s * 12.3, .45, -3, 1.1, .54, 1.1), cylinder("侧翼前端高石柱", s * 12.3, 3.5, -3, .55, 5.56, stone));
  return p;
}

function terraceMortuaryTemple(): ModelPart[] {
  const p: ModelPart[] = [base(58, 68)];
  for (let level = 0; level < 3; level++) {
    const front = -23 + level * 14, width = 49 - level * 6, floor = .18 + level * 5.8, depth = level === 2 ? 23 : 17;
    p.push(box("叠高陵庙宽阔开放前庭的实心石台", 0, .18 + (level * 5.8 + .6) / 2, front + depth / 2, width, level * 5.8 + .6, depth), ...[-1, 1].map(s => box("前庭左右连续厚石护壁", s * (width / 2 - .2), floor + 2.65, front + depth / 2, .5, 5.3, depth)));
    for (const x of [-17, -11.3, -5.7, 5.7, 11.3, 17]) p.push(box("高台前方柱廊的真实落地石柱", x * (1 - level * .11), floor + 2.95, front + 1.8, .85, 4.7, .85), box("石柱上方宽承檐盘", x * (1 - level * .11), floor + 5.45, front + 1.8, 1.2, .3, 1.2));
    p.push(box("完整柱廊前部平石檐盖", 0, floor + 5.78, front + 1.8, width - .5, .36, 4.8));
    if (level < 2) p.push(ramp("两层开放前庭之间真正连续的中央正坡", 4.2, 11, 5.8, [0, floor + .6, front + 8.5]));
  }
  p.push(box("最高层嵌崖圣室后石壁", 0, 15.93, 27.3, 35, 7.1, .7), ...frontDoor("最高圣室中央真实门洞", 12, 5.4, .6, 2.6, [0, 12.38, 25]), ...[-1, 1].map(s => box("最高圣室两侧厚壁", s * 5.8, 15.08, 26.2, .4, 5.4, 2.6)), box("最高圣室的完整平石盖", 0, 17.93, 26.2, 12.5, .3, 3.2), ...[-1, 1].map(s => box("后方岩壁两旁的天然崖面简化体", s * 22.5, 10.9, 27.5, 9, 21.44, 8, earth)));
  return p;
}

function mastabaTomb(): ModelPart[] {
  const p: ModelPart[] = [base(19, 26), box("下部真实墓室的完整石地面", 0, .3, 5, 9, .24, 8), ...[-1, 1].map(s => box("墓室两侧承顶厚壁", s * 4.3, 1.7, 5, .4, 2.56, 8)), box("下部墓室后封壁", 0, 1.7, 8.9, 9, 2.56, .4), ...frontDoor("竖井接到墓室的低通道", 9, 2.56, .4, 1.6, [0, .42, 1.1]), box("墓室石棺底床", 0, .8, 5.2, 2.8, 1, 4.3), polygon("墓室顶板保留竖井真正通孔", stone, [[-4.6, 1], [4.6, 1], [4.6, 9], [-4.6, 9]], .3, [0, 3, 0], [[[-1, 1.5], [-1, 3.3], [1, 3.3], [1, 1.5]]])];
  const shaft = rectangularFlue("由平顶向下通到墓室的真实空竖井", 2.2, 2, 6.6, .2, [0, 3.3, 2.4], stone); p.push(shaft);
  for (const s of [-1, 1]) p.push(box("剖示墓室两侧实际承托陵屋的完整岩土", s * 6.3, 1.74, 1, 4.4, 3.12, 23.4, earth), box("祭室入口下方实际落地的前部岩柱", s * 3.3, 1.74, -10.5, 2.4, 3.12, 2.3, earth));
  for (const s of [-1, 1]) p.push(part("陵屋外侧真实向内倾斜的厚长壁", "extrude", brick, [s * 6.2, 3.3, 0], [1, 1, 1], [0, 0, 0], { depth: 21, profile: s < 0 ? [{ x: -1.3, y: 0 }, { x: 1.3, y: 0 }, { x: 1.3, y: 6.6 }, { x: -.2, y: 6.6 }] : [{ x: -1.3, y: 0 }, { x: 1.3, y: 0 }, { x: .2, y: 6.6 }, { x: -1.3, y: 6.6 }] }));
  p.push(...frontDoor("祭祀室从外侧真正进入的正门", 12.4, 6.6, .7, 1.8, [0, 3.3, -10.5], brick), box("陵屋后端厚封壁", 0, 6.6, 10.1, 12.4, 6.6, .8, brick), polygon("平顶陵屋保留可见竖井口的厚石顶", brick, [[-6.5, -10.8], [6.5, -10.8], [6.5, 10.5], [-6.5, 10.5]], .32, [0, 9.9, 0], [[[-1.1, 1.4], [-1.1, 3.4], [1.1, 3.4], [1.1, 1.4]]]), box("同竖井分离的祭室独立供台", -3.4, 4, -3.5, 1.1, 1.4, 2.6), box("祭室同竖井之间保留隔绝的厚壁", -1.6, 5.3, 0, .45, 4, 12));
  return p;
}

function rockFacadeTomb(): ModelPart[] {
  const p: ModelPart[] = [base(28, 23), ...[-1, 1].map(s => box("墓室两侧真实凿入岩壁", s * 6.8, 5.2, 3.5, 1.2, 10.04, 11, brick)), box("岩凿墓室后方完整岩壁", 0, 5.2, 8.4, 14.8, 10.04, 1.2, brick), box("墓室上方连续岩石顶盖", 0, 10.4, 3.5, 14.8, .4, 11, brick), ...frontDoor("凿入大岩体的真实墓门", 12.5, 7.4, .7, 2.9, [0, .18, -2], brick)];
  for (const x of [-9, -5.4, 5.4, 9]) p.push(cylinder("下层立面承山花的高石柱", x, 4.75, -3.5, .7, 9.14, brick), box("下层石柱宽柱头", x, 9.46, -3.5, 1.1, .28, 1.1, brick));
  p.push(box("下层柱廊连续石额枋", 0, 9.95, -3.5, 20.5, .7, 1.8, brick), part("下层三角山花中央高顶", "extrude", brick, [0, 10.3, -3.5], [1, 1, 1], [0, 0, 0], { depth: 1.4, profile: [{ x: -10, y: 0 }, { x: 10, y: 0 }, { x: 0, y: 2.8 }] }), box("承起上层立面的长石平台", 0, 13.3, -2.8, 21.6, .4, 3.4, brick));
  for (const s of [-1, 1]) p.push(cylinder("上层断山花侧翼的前石柱", s * 8.2, 16.2, -3.6, .6, 5.4, brick), part("向中央断开的左右石山花", "extrude", brick, [s * 6.9, 18.9, -3.4], [1, 1, 1], [0, 0, 0], { depth: 1.2, profile: s < 0 ? [{ x: -3.4, y: 0 }, { x: 2.6, y: 0 }, { x: 2.6, y: 2.6 }, { x: -3.4, y: .2 }] : [{ x: -2.6, y: 0 }, { x: 3.4, y: 0 }, { x: 3.4, y: .2 }, { x: -2.6, y: 2.6 }] }));
  p.push(translatedRing("上层中央圆龛塔的真实空心柱廊额环", 2.5, .4, .35, [0, 19.075, -2.5], brick));
  for (let i = 0; i < 6; i++) { const a = i * Math.PI / 3; p.push(cylinder("中央圆龛塔独立承檐石柱", Math.cos(a) * 2.2, 16.2, -2.5 + Math.sin(a) * 2.2, .4, 5.4, brick)); }
  p.push(part("圆龛塔上方尖收的小冠顶", "lathe", brick, [0, 19.25, -2.5], [1, 1, 1], [0, 0, 0], { profile: [{ x: 0, y: 0 }, { x: 2.8, y: 0 }, { x: .4, y: 2.3 }, { x: 0, y: 2.5 }] }), ...[-1, 1].map(s => box("高立面外侧连续接到山体的岩石翼", s * 11.7, 11.1, 0, 3, 21.84, 9, brick)));
  return p;
}

function sacredWell(): ModelPart[] {
  const p: ModelPart[] = [base(18, 24), cylinder("井室下方完整承水石底", 0, .3, 5, 5.4, .24, stone), translatedRing("下沉圆井低于通道的承水矮壁", 2.6, .45, .3, [0, .57, 5]), part("圆井内部独立静态水面", "cylinder", water, [0, .7, 5], [4.2, .025, 4.2], [0, 0, 0], { opacity: .72, roughness: .2 }), halfRoundWall("井室朝向阶道的真实低门口", 2.7, .4, 2.2, [0, .42, 5], 72, stone, Math.PI * 2 - 36 * Math.PI / 180)];
  for (let i = 0; i < 5; i++) p.push(translatedRing("井室顶上逐层收进而不填满室内的叠涩石环", 2.7 - i * .43, .48, .55, [0, 2.72 + i * .46, 5]));
  for (const s of [-1, 1]) p.push(box("下沉直阶两侧完整厚石护墙", s * 1.3, 2.55, -3.6, .5, 4.74, 12.5), box("上部入口两旁独立落地石墩", s * 2.4, 2.55, -10.3, 2.7, 4.74, 1.3));
  for (let i = 0; i < 16; i++) p.push(box("从上部地面向井室逐级下降的真实石阶", 0, .42 + (16 - i) * .27 / 2, -9.7 + i * .65, 2.1, (16 - i) * .27, .67));
  p.push(box("阶道低端同井室相接的石铺面", 0, .64, 1.35, 2.1, .1, 2.4), box("上部入口完整高台横铺面", 0, 4.89, -11.9, 7.4, .24, 2.5));
  return p;
}

function victoryColumn(): ModelPart[] {
  const p: ModelPart[] = [base(10, 10), ...frontDoor("纪功塔基台真实入塔小门", 5.1, 2.5, .4, 1.2, [0, .18, -2.3]), ...[-1, 1].map(s => box("基台两侧空心围壁", s * 2.35, 1.43, 0, .4, 2.5, 5)), box("基台后方封壁", 0, 1.43, 2.3, 5.1, 2.5, .4), translatedRing("圆柱石壳内侧保留真正连续楼梯空间", 1.8, .38, 18, [0, 11.68, 0]), cylinder("内螺旋梯实际中央承柱", 0, 10.43, 0, .36, 20.5, stone)];
  p.push(polygon("门座承托中空圆柱的石顶板", stone, [[-2.55, -2.55], [2.55, -2.55], [2.55, 2.55], [-2.55, 2.55]], .2, [0, 2.48, 0], [circle(1.43, 12)]));
  for (let i = 0; i < 64; i++) { const a = (-90 + i * 1080 / 63) * Math.PI / 180; p.push(part("柱内沿中心逐级升高的真实石踏板", "box", stone, [Math.cos(a) * .95, .27 + i * 20.48 / 63, Math.sin(a) * .95], [.86, .18, .36], [0, -a * 180 / Math.PI, 0])); }
  const exit = circle(.6, 10).map(([x, z]) => [x, z - .95] as [number, number]);
  p.push(polygon("顶部实际保留出梯孔的瞭望平台", stone, circle(2.6, 20), .2, [0, 20.68, 0], [exit]), translatedRing("瞭望平台边缘安全矮栏", 2.6, .18, .75, [0, 21.25, 0]), part("柱外贴合的连续浅螺旋叙事带", "tube", "#a39d85", [0, 0, 0], [1, 1, 1], [0, 0, 0], { radius: .045, path: Array.from({ length: 64 }, (_, i) => { const a = i * Math.PI / 10.5; return { x: Math.cos(a) * 1.81, y: 2.85 + i * .27, z: Math.sin(a) * 1.81 }; }) }), box("顶部人像的独立方石基", 0, 21.25, 0, 1.05, .74, 1.05), part("顶像长袍整体身躯", "capsule", stone, [0, 22.48, 0], [1, 1.75, .8]), part("顶像头部", "sphere", stone, [0, 23.62, 0], [.48, .56, .48]), ...[-1, 1].map(s => beam("顶像双臂同躯体真实相连", stone, [s * .35, 23, 0], [s * .62, 22.3, -.1], .2)));
  return p;
}
