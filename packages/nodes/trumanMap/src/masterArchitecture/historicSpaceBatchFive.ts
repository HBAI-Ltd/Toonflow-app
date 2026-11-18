import { part, ring, pitchedRoof, type ModelPart, type Triple } from "../assetModelParts";
import { base, box, cylinder, arch, design, type ArchitecturePrototype } from "./structures";
import { halfDomeRoof, halfRoundWall, barrelRoof, rectangularFlue } from "./spatialShells";
import { polygon } from "../masterNature/shared";
import { Euler, Quaternion, Vector3 } from "three";

const stone = "#b4b09a", brick = "#ad8b6b", wood = "#947754", roofColor = "#77817a", red = "#9b6c58", water = "#7fa6a8";

// 原创简化空间类型，尺度用于布景，不表示某一遗产现场的测绘复原。
// https://whc.unesco.org/en/tentativelists/5695/
// https://whc.unesco.org/document/152488
// https://kulturportali.gov.tr/turkiye/edirne/kulturenvanteri/kum-kasri-hamami
// https://www.iranicaonline.org/articles/ab-anbar-i-history/
export const historicSpaceBatchFiveDesigns: ArchitecturePrototype[] = [
  design("双半穹中央大殿", "四片球面帆拱承起中央高圆顶，前后半穹沿长轴延展大厅，两侧低柱廊可通行，正门穿过前弧壁进入中厅", doubleSemiDomeHall, "建筑", "欧式"),
  design("四瓣半穹连穹祈祷堂", "四角石墩与帆拱托住中央圆穹顶，四个方向的半穹扩出等宽祈祷臂，前方弧壁保留真实入堂门", quatrefoilDomeHall, "建筑", "异域"),
  design("高墙中轴院落宗堡", "收分厚外围房环围出两个石铺庭院，中轴高乌策塔和横向房翼分隔前后庭，高低木檐屋盖按房翼与主塔层级连接", dzongComplex, "建筑", "异域"),
  design("三进院界露天石祠院", "连续院界分出三进露天石庭，三处门道沿轴互通，后院高台祠亭与侧面开放会亭分别保持独立支承", puraComplex, "建筑", "异域"),
  design("对称折返登阶圣池", "五层四面石台围住低位方池，各层窄踏阶交错换位并接到环形行走面，四侧路径可逐级走到池边", steppedTempleTank, "建筑", "异域"),
  design("三室连穹净浴馆", "更衣冷室经窄门过渡温室再到后方热室，三种大小的圆穹顶对应各室，热室中央暖石台与角侧独立浴位分开", hammam, "建筑", "异域"),
  design("方围多穹顶封闭市集", "四面门道穿进完整封闭市集，内柱网托住六座平接圆顶，沿周边柜台与中央通行区互不阻挡", bedesten, "建筑", "异域"),
  design("高罩顶下沉训练坑馆", "低位八角训练坑被高一层的观礼地面围住，固定石梯进入坑内，旁侧领诵台与高穹顶保持独立可见空间", zurkhaneh, "建筑", "异域"),
  design("风塔覆穹水库取水院", "封闭圆库由薄壳圆顶覆盖，两座中空风塔通到库侧，外阶下到独立取水室，公共取水动线与储水空间分开", abAnbar, "建筑", "异域"),
  design("岩凿方厅侧室僧院", "中央方形多柱岩厅的三侧独立小室朝内开门，前廊接通主入口，整片厚岩顶连续覆盖主厅与小室", vihara, "建筑", "异域"),
];

function door(name: string, width: number, height: number, depth: number, opening: number, position: Triple, color = stone): ModelPart[] {
  const side = (width - opening) / 2, head = height - Math.min(3, height - .5);
  return [...[-1, 1].map(s => box(`${name}两侧厚壁`, position[0] + s * (opening + side) / 2, position[1] + height / 2, position[2], side, height, depth, color)), box(`${name}上部完整过梁`, position[0], position[1] + height - head / 2, position[2], opening, head, depth, color)];
}
function circle(radius: number, count = 16, phase = 0): [number, number][] { return Array.from({ length: count }, (_, i) => [Math.cos(i * Math.PI * 2 / count + phase) * radius, Math.sin(i * Math.PI * 2 / count + phase) * radius]); }
function placedRing(name: string, radius: number, thickness: number, height: number, position: Triple, color = stone): ModelPart { const value = ring(name, color, radius, thickness, position[1], height); value.position.x = position[0]; value.position.z = position[2]; return value; }
function dome(name: string, radius: number, position: Triple, color = roofColor): ModelPart[] { return [halfDomeRoof(`${name}前半薄壳`, radius, .25, position, 0, color), halfDomeRoof(`${name}后半薄壳`, radius, .25, position, 180, color)]; }
function sweptCover(name: string, width: number, depth: number, position: Triple): ModelPart { const value = pitchedRoof(name, roofColor, width, depth, position[1], true); value.position.x = position[0]; value.position.z = position[2]; for (const point of value.profile!) point.y *= 2.5; return value; }
function turn(parts: ModelPart[], yaw: number, position: Triple): ModelPart[] {
  const q = new Quaternion().setFromAxisAngle(new Vector3(0, 1, 0), yaw * Math.PI / 180);
  for (const value of parts) {
    const point = new Vector3(value.position.x, value.position.y, value.position.z).applyQuaternion(q), euler = new Euler().setFromQuaternion(q.clone().multiply(new Quaternion().setFromEuler(new Euler(value.rotation.x * Math.PI / 180, value.rotation.y * Math.PI / 180, value.rotation.z * Math.PI / 180))));
    value.position = { x: point.x + position[0], y: point.y + position[1], z: point.z + position[2] }; value.rotation = { x: euler.x * 180 / Math.PI, y: euler.y * 180 / Math.PI, z: euler.z * 180 / Math.PI };
  }
  return parts;
}

function pendentive(a: number, spring: number, yaw: number): ModelPart {
  const radius = Math.SQRT2 * a, vertices: { x: number; y: number; z: number }[] = [], indices: number[] = [], rows: number[] = [];
  for (let row = 0; row <= 12; row++) {
    rows.push(vertices.length); const angle = row * Math.PI / 24, outer = Math.min(Math.abs(Math.cos(angle)) < 1e-8 ? Infinity : a / Math.cos(angle), Math.abs(Math.sin(angle)) < 1e-8 ? Infinity : a / Math.sin(angle)), count = row === 0 || row === 12 ? 1 : 3;
    for (let i = 0; i < count; i++) { const r = count === 1 ? a : a + (outer - a) * i / 2; vertices.push({ x: Math.cos(angle) * r, y: Math.sqrt(Math.max(0, radius * radius - r * r)), z: Math.sin(angle) * r }); }
  }
  const count = vertices.length; vertices.push(...vertices.map(p => ({ ...p, y: p.y - .24 })));
  for (let row = 0; row < 12; row++) {
    const a = rows[row]!, b = rows[row + 1]!, faces = row === 0 ? [a, b, b + 1, a, b + 1, b + 2] : row === 11 ? [a, b, a + 1, a + 1, b, a + 2] : [a, b, a + 1, a + 1, b, b + 1, a + 1, b + 1, a + 2, a + 2, b + 1, b + 2];
    indices.push(...faces); for (let i = 0; i < faces.length; i += 3) indices.push(faces[i]! + count, faces[i + 2]! + count, faces[i + 1]! + count);
  }
  const boundary = [...rows, ...rows.slice(1, -1).reverse().map(v => v + 2)];
  for (let i = 0; i < boundary.length; i++) { const a = boundary[i]!, b = boundary[(i + 1) % boundary.length]!; indices.push(a, b + count, b, a, a + count, b + count); }
  return part("从方角高券连续过渡到圆顶承圈的球面帆拱", "mesh", stone, [0, spring, 0], [1, 1, 1], [0, yaw, 0], { vertices, indices });
}

function domeCrossing(a: number, spring: number): ModelPart[] {
  const p: ModelPart[] = [];
  for (const x of [-1, 1]) for (const z of [-1, 1]) p.push(box("中央圆顶下四个实际落地大石墩", x * a, (.18 + spring) / 2, z * a, 1.2, spring - .18, 1.2));
  for (let i = 0; i < 4; i++) { const angle = i * Math.PI / 2, value = arch(Math.sin(angle) * a, Math.cos(angle) * a, a, spring - .18, .6, .35); value.rotation.y = i * 90; p.push(value, pendentive(a, spring, i * 90)); }
  p.push(placedRing("四片帆拱上方连续圆顶承圈", a + .12, .4, .24, [0, spring + a, 0]), ...dome("中央高圆穹顶", a + .1, [0, spring + a + .12, 0]));
  return p;
}

function frontApse(radius: number, height: number, centerZ: number): ModelPart[] {
  return [halfRoundWall("前弧壁左半部", radius, .45, height, [0, .18, centerZ], 180, stone, 80 * Math.PI / 180), halfRoundWall("前弧壁右半部", radius, .45, height, [0, .18, centerZ], 80, stone, 80 * Math.PI / 180), halfRoundWall("前弧门上方闭合的石壁", radius, .45, height - 3.2, [0, 3.38, centerZ], 100, stone, 20 * Math.PI / 180)];
}

function doubleSemiDomeHall(): ModelPart[] {
  const a = 6.5, p: ModelPart[] = [base(28, 37), ...domeCrossing(a, 6.5), halfDomeRoof("前方沿长轴延展的半圆穹顶", a, .25, [0, 6.5, -a], 180, roofColor), halfDomeRoof("后方沿长轴延展的半圆穹顶", a, .25, [0, 6.5, a], 0, roofColor), ...frontApse(a, 6.32, -a), halfRoundWall("后半穹下方连续半圆石壁", a, .45, 6.32, [0, .18, a], 0, stone)];
  for (const s of [-1, 1]) {
    p.push(box("长殿低侧廊外侧厚墙", s * 10, 3.1, 0, .5, 5.84, 27), box("低侧廊完整平石屋盖", s * 8.3, 6.1, 0, 3.5, .3, 27));
    for (const z of [-11, -7, -3, 1, 5, 9, 12]) p.push(cylinder("低侧廊内侧连续落地石柱", s * 6.8, 3.05, z, .4, 5.74, stone), box("低侧柱上部承托平盖的石柱头", s * 6.8, 5.97, z, .7, .1, .7));
    for (const z of [-13.4, 13.4]) p.push(box("两侧廊前后端封合短墙", s * 8.35, 3.1, z, 3.8, 5.84, .4));
  }
  p.push(...door("高殿真正主入口", 3, 4.2, .7, 2.1, [0, .18, -13]), box("后半穹中独立低礼仪台", 0, .65, 9.8, 3.3, .94, 1.7));
  return p;
}

function quatrefoilDomeHall(): ModelPart[] {
  const a = 5.5, p: ModelPart[] = [base(28, 29), ...domeCrossing(a, 6.5), ...frontApse(a, 6.32, -a)];
  for (let i = 0; i < 4; i++) { const yaw = i * 90, angle = yaw * Math.PI / 180, position: Triple = [Math.sin(angle) * a, 6.5, Math.cos(angle) * a]; p.push(halfDomeRoof("中央圆顶四向扩出的等宽半穹", a, .25, position, yaw, roofColor)); if (i !== 2) p.push(halfRoundWall("半穹下方连续厚弧壁", a, .45, 6.32, [position[0], .18, position[2]], yaw, stone)); }
  p.push(...door("四瓣堂前端真实入门", 2.7, 4.2, .7, 1.9, [0, .18, -11]));
  for (const s of [-1, 1]) p.push(box("后半穹礼拜方向短石龛侧壁", s * .9, 2.3, 10, .25, 4.24, .9));
  p.push(box("礼拜方向凹龛后石壁", 0, 2.3, 10.55, 2.1, 4.24, .25));
  return p;
}

function dzongComplex(): ModelPart[] {
  const p: ModelPart[] = [base(45, 65), ...door("宗堡前院石门", 37, 8.5, .9, 3, [0, .18, -27]), ...door("前后庭之间真正的横向通门", 37, 8.5, .75, 3, [0, .18, 4]), box("后院完整厚石围壁", 0, 4.43, 27, 37, 8.5, .9), polygon("外围房环上层楼板保持两院开放", wood, [[-18.5, -27], [18.5, -27], [18.5, 27], [-18.5, 27]], .25, [0, 4.4, 0], [[[-12.6, -20.5], [-12.6, -1.5], [12.6, -1.5], [12.6, -20.5]], [[-12.6, 9.5], [-12.6, 21], [12.6, 21], [12.6, 9.5]]])];
  for (const s of [-1, 1]) {
    p.push(part("外围房翼向内收分的厚石外壁", "extrude", stone, [s * 18.1, .18, 0], [1, 1, 1], [0, 0, 0], { depth: 54, profile: s < 0 ? [{ x: -.75, y: 0 }, { x: .75, y: 0 }, { x: .75, y: 8.5 }, { x: -.2, y: 8.5 }] : [{ x: -.75, y: 0 }, { x: .75, y: 0 }, { x: .2, y: 8.5 }, { x: -.75, y: 8.5 }] }), box("房翼内侧朝院木围面", s * 12.8, 5.5, 0, .25, 6.36, 51, wood), box("高墙上部连续赭红护带", s * 18.1, 8.2, 0, 1.25, .8, 54, red), sweptCover("长房翼完整出挑木檐顶", 6.8, 55.5, [s * 15.5, 8.75, 0]));
    for (const edge of [-1, 1]) p.push(box("长房翼墙头实际承住弧檐的纵木枋", s * 15.5 + edge * 2.6, 8.8, 0, .25, .3, 54, wood));
    for (const z of [-18, -10, -2, 12, 20]) p.push(box("内庭底层走廊的落地木柱", s * 12.7, 2.25, z, .22, 4.14, .22, wood));
  }
  p.push(...door("乌策塔真实入室门", 10, 14.5, .7, 2, [0, .18, .2]), ...[-1, 1].map(s => box("中央乌策塔两侧厚壁", s * 4.7, 7.43, 5, .6, 14.5, 10)), box("中央乌策塔后方厚壁", 0, 7.43, 9.7, 10, 14.5, .6), box("乌策塔顶完整赭红承檐带", 0, 14.45, 5, 10.6, .7, 10.6, red), sweptCover("乌策塔高位主木檐盖", 13, 13, [0, 14.8, 5]), box("高主檐内侧小屋身", 0, 16.35, 5, 5.7, .7, 5.7, wood), sweptCover("乌策塔最上方小木檐顶", 7.2, 7.2, [0, 16.7, 5]));
  for (const [z, width] of [[-24, 7.7], [5.7, 6.7]]) {
    p.push(...turn([sweptCover("横房翼沿长轴连续延伸的木檐屋盖", width!, 38.5, [0, 8.75, 0])], 90, [0, 0, z!]));
    for (const edge of [-1, 1]) p.push(box("横房翼木檐下连续承重横枋", 0, 8.9, z! + edge * (width! / 2 - .85), 37, .5, .35, wood));
    for (const x of [-10, -5, 0, 5, 10]) p.push(box("横房翼内侧开敞柱廊实际落地柱", x, 4.43, z! + width! / 2 - .85, .3, 8.5, .3, wood));
  }
  p.push(...[-1, 1].map(s => box("乌策主塔墙头实际承弧檐的木枋", s * 4.7, 14.87, 5, .3, .3, 11, wood)), box("小屋身与上木檐之间的承托方枋盘", 0, 16.78, 5, 5.9, .16, 5.9, wood));
  return p;
}

function puraComplex(): ModelPart[] {
  const p: ModelPart[] = [base(38, 66), ...[-1, 1].map(s => box("三进院界两侧连续石墙", s * 16, 1.35, 0, .5, 2.34, 60, brick)), box("后院围护石墙", 0, 1.35, 30, 32, 2.34, .5, brick)];
  for (const z of [-30, -9, 11]) { p.push(...door("三进院界中央真实通行门", 32, 3.6, .5, 2.2, [0, .18, z], brick)); for (const s of [-1, 1]) p.push(box("院门两侧独立高石门身", s * 1.5, 2.4, z, .75, 4.44, 1.3, brick)); p.push(box("门身间实际跨接的横向石门楣", 0, 4.75, z, 3.8, .26, 1.6, brick)); }
  p.push(box("最内祠亭抬高的完整石台", 0, .8, 23, 10.5, 1.24, 10.5, brick), ...stepsFromBase(6, 2.3, 1.24, .4, [0, .18, 15.6]));
  for (const x of [-1, 1]) for (const z of [-1, 1]) p.push(box("高台祠亭真实承檐木柱", x * 3.7, 3.3, 23 + z * 3.7, .3, 3.76, .3, wood));
  p.push(box("祠亭后方独立小龛背壁", 0, 2.5, 26.2, 6.5, 2.16, .3, brick), sweptCover("后院祠亭独立木檐盖", 10.5, 10.5, [0, 5.18, 23]));
  for (const s of [-1, 1]) p.push(box("祠亭柱头实际承住弧顶的纵木梁", s * 3.7, 5.3, 23, .28, .4, 8.2, wood));
  for (const x of [-1, 1]) for (const z of [-1, 1]) p.push(box("外院会亭四个真实落地柱", -8 + x * 2.5, 1.85, -18 + z * 3, .22, 3.34, .22, wood));
  p.push(sweptCover("外院开放会亭独立木檐盖", 6.4, 7.4, [-8, 3.6, -18]), box("中院临时供物的低石长案", 8.3, .6, 2, 5.5, .84, 1.4, brick));
  for (const s of [-1, 1]) p.push(box("会亭立柱与木檐之间连续纵梁", -8 + s * 2.5, 3.6, -18, .25, .3, 6.8, wood));
  return p;
}

function stepsFromBase(count: number, width: number, height: number, run: number, position: Triple): ModelPart[] { return Array.from({ length: count }, (_, i) => box("固定登台石阶", position[0], position[1] + (i + 1) * height / count / 2, position[2] + i * run, width, (i + 1) * height / count, Math.abs(run))); }
function profileFlight(width: number, height: number, baseHeight: number, position: Triple, yaw: number): ModelPart {
  const profile: [number, number][] = [[0, 0]];
  for (let i = 0; i < 6; i++) profile.push([i * 1.4 / 6, baseHeight + (i + 1) * height / 6], [(i + 1) * 1.4 / 6, baseHeight + (i + 1) * height / 6]);
  profile.push([1.4, 0]); const value = polygon("每层交错换位且连续登高的六级窄石阶", stone, profile, width); value.rotation.x = -90; value.position.z = width / 2;
  return turn([value], yaw, position)[0]!;
}

function steppedTempleTank(): ModelPart[] {
  const p: ModelPart[] = [base(26, 26), box("方圣池完整承水底石", 0, .3, 0, 7.6, .24, 7.6), part("方圣池内独立静态水面", "box", water, [0, .65, 0], [7.2, .035, 7.2], [0, 0, 0], { opacity: .7, roughness: .22 })];
  for (let level = 0; level < 5; level++) {
    const r = 5.2 + level * 1.4, inner = r - 1.4, h = (level + 1) * .9, t = (level % 2 ? -1 : 1) * r * .4, halfGap = .8;
    for (let side = 0; side < 4; side++) {
      const span = side % 2 === 0 ? r : inner, parts: ModelPart[] = [];
      for (const [a, b] of [[-span, t - halfGap], [t + halfGap, span]]) parts.push(box("石台在窄阶两侧保留连续环走面", (a! + b!) / 2, .18 + h / 2, (r + inner) / 2, b! - a!, h, 1.4));
      p.push(...turn(parts, side * 90, [0, 0, 0]), ...turn([profileFlight(1.5, .9, level * .9, [t, .18, inner], -90)], side * 90, [0, 0, 0]));
    }
  }
  return p;
}

function squareDome(size: number, position: Triple): ModelPart[] {
  const outline: [number, number][] = [[-size / 2, -size / 2], [size / 2, -size / 2], [size / 2, size / 2], [-size / 2, size / 2]];
  return [polygon("方室四角接到圆顶的真实承顶角板", stone, outline, .24, position, [circle(size / 2 - .3, 20)]), ...dome("方室完整圆穹顶", size / 2 - .05, [position[0], position[1] + .24, position[2]])];
}

function hammam(): ModelPart[] {
  const p: ModelPart[] = [base(25, 38)];
  for (const [size, z] of [[10, -11], [6, -3], [12, 6]]) {
    p.push(box("各室同高且实际连通的石地坪", 0, .3, z!, size!, .24, size!), ...[-1, 1].map(s => box("各室外侧实际厚围壁", s * size! / 2, 2.4, z!, .4, 3.96, size!)), ...squareDome(size! + .4, [0, 4.38, z!]));
  }
  p.push(...door("更衣冷室入口", 10, 4.2, .4, 2.1, [0, .18, -16]), ...door("冷室进入温室的窄门", 10, 4.2, .4, 1.4, [0, .18, -6]), ...door("温室进入热室的窄门", 12, 4.2, .4, 1.25, [0, .18, 0]), box("热室后方厚石围壁", 0, 2.4, 12, 12, 3.96, .4), cylinder("热室中央独立暖石台", 0, .7, 5.7, 3.4, .56, stone), placedRing("更衣冷室中独立小水池", 1.2, .2, .45, [0, .7, -11]), cylinder("冷室池底", 0, .52, -11, 2.2, .2, stone));
  for (const s of [-1, 1]) p.push(box("后方角浴位同中央热室分开的短侧壁", s * 3, 1.8, 9.7, .25, 2.76, 4.1), box("角浴位朝向中室开口的后横壁", s * 4.4, 1.8, 8.1, 2.8, 2.76, .25), placedRing("角浴位独立敞口石浴钵", .65, .15, .5, [s * 4.4, .72, 10]), cylinder("浴钵完整承水底", s * 4.4, .49, 10, 1.15, .14, stone));
  return p;
}

function bedesten(): ModelPart[] {
  const p: ModelPart[] = [base(30, 24), ...door("封闭市集前后出入门", 24, 4.4, .5, 2.6, [0, .18, -8]), ...door("封闭市集后出入门", 24, 4.4, .5, 2.6, [0, .18, 8])];
  for (const s of [-1, 1]) p.push(...turn(door("市集两端侧门", 16, 4.4, .5, 2.2, [0, .18, 0]), 90, [s * 12, 0, 0]));
  for (const x of [-8, 0, 8]) for (const z of [-4, 4]) p.push(...squareDome(8, [x, 4.58, z]));
  for (const x of [-4, 4]) p.push(box("六圆顶之间真正落地的内石墩", x, 2.38, 0, .8, 4.4, .8));
  for (const s of [-1, 1]) p.push(box("市场长边靠壁连续石柜台", 0, .65, s * 6.6, 20.5, .94, 1.25), box("市集短边靠壁石柜台", s * 10.4, .65, 0, 1.25, .94, 11));
  return p;
}

function zurkhaneh(): ModelPart[] {
  const outside = circle(8.2, 8, Math.PI / 8), pit = circle(4.4, 8, Math.PI / 8), p: ModelPart[] = [polygon("训练坑最低处完整八角石地面", brick, outside, .18), polygon("围住训练坑的高一层观礼地坪", stone, outside, 1, [0, .18, 0], [pit])];
  for (let i = 0; i < 8; i++) {
    const a = outside[i]!, b = outside[(i + 1) % 8]!, width = Math.hypot(b[0] - a[0], b[1] - a[1]), yaw = -Math.atan2(b[1] - a[1], b[0] - a[0]) * 180 / Math.PI, position: Triple = [(a[0] + b[0]) / 2, 1.18, (a[1] + b[1]) / 2];
    p.push(...turn(i === 5 ? door("训练馆实际入门", width, 5.2, .4, 1.5, [0, 0, 0]) : [box("八角训练馆完整厚围壁", 0, 2.6, 0, width, 5.2, .4)], yaw, position));
  }
  p.push(polygon("高穹顶下方连续八角承压角板", stone, outside, .24, [0, 6.38, 0], [circle(7.2, 24)]), ...dome("训练馆完整高圆穹顶", 7.4, [0, 6.62, 0]), box("高于训练坑的独立领诵平台", 5.5, 1.55, 0, 2.2, .74, 2.6));
  const step = profileFlight(1.4, 1, 0, [0, .18, -2.66], 90); p.push(step);
  return p;
}

function abAnbar(): ModelPart[] {
  const p: ModelPart[] = [base(27, 37), cylinder("封闭圆形水库完整承水底石", 0, .3, 4.5, 13.2, .24, stone), placedRing("储水库通气口以下的完整圆库壁", 6.6, .55, 3.48, [0, 2.16, 4.5], brick), placedRing("储水库通气口以上的完整圆库壁", 6.6, .55, .92, [0, 5.16, 4.5], brick), halfRoundWall("两侧真实通气口之间的前弧库壁", 6.6, .55, .8, [0, 3.9, 4.5], -18, brick, 144 * Math.PI / 180), halfRoundWall("绕后方连接两侧通气口的长弧库壁", 6.6, .55, .8, [0, 3.9, 4.5], -172, brick, 196 * Math.PI / 180), part("封闭水库内部独立静态水面", "cylinder", water, [0, 2.2, 4.5], [11.9, .035, 11.9], [0, 0, 0], { opacity: .7, roughness: .22 }), ...dome("覆住蓄水库的完整圆穹顶", 6.6, [0, 5.62, 4.5], brick), ...[-1, 1].map(s => box("取水室两侧真正厚石墙", s * 1.8, 1.9, -7.7, .4, 3.44, 4.6)), ...door("外阶下到取水室的独立入口", 4, 3.44, .5, 1.6, [0, .18, -10]), barrelRoof("取水室低筒券薄屋盖", 1.8, .3, 4.6, [0, 3.62, -7.7], brick)];
  for (const s of [-1, 1]) {
    p.push(box("风塔远离库体一侧完整厚壁", s * 8.4, 4.83, 6, .3, 9.3, 2.1, brick), ...[-1, 1].map(edge => box("风塔前后完整厚壁", s * 7.5, 4.83, 6 + edge * .9, 2.1, 9.3, .3, brick)), box("内侧风塔壁通气口下段", s * 6.6, 2.04, 6, .3, 3.72, 2.1, brick), box("内侧风塔壁通气口上段", s * 6.6, 7.09, 6, .3, 4.78, 2.1, brick), ...[-1, 1].map(edge => box("真实通气口两侧的窄石壁", s * 6.6, 4.3, 6 + edge * .6875, .3, .8, .725, brick)), box("风塔上方遮雨平盖", s * 7.5, 11.25, 6, 2.5, .25, 2.5));
    for (const x of [-1, 1]) for (const z of [-1, 1]) p.push(box("风塔进风口四角实际立柱", s * 7.5 + x * .9, 10.3, 6 + z * .9, .2, 1.64, .2, brick));
    const neck = rectangularFlue("风塔经库壁开孔接入上部空气层的中空连接颈", .65, .65, 2, .1, [s * 5.5, 4.3, 6], brick); neck.rotation.z = -s * 90; p.push(neck);
  }
  p.push(...stepsFromBase(18, 1.8, 4.5, -.4, [0, .18, -10.4]), placedRing("取水室内独立集水石钵", .65, .15, .5, [0, .7, -7]), cylinder("集水钵底石", 0, .49, -7, 1.2, .14, stone), box("储水侧进入取水室的密闭后墙", 0, 1.9, -5.3, 4, 3.44, .4, brick), part("储水库穿向取水石钵的短出水管", "tube", "#6d7b7d", [0, 0, 0], [1, 1, 1], [0, 0, 0], { radius: .08, path: [{ x: 0, y: 1.3, z: -2 }, { x: 0, y: 1.3, z: -6.6 }, { x: 0, y: 1.1, z: -6.9 }] }));
  return p;
}

function vihara(): ModelPart[] {
  const p: ModelPart[] = [base(31, 29), box("方厅与三侧小室共同的石铺地面", 0, .3, 0, 26, .24, 23), ...door("岩厅前方实际主入口", 25.6, 5.07, .55, 3.2, [0, .18, -10.8]), ...[-1, 1].map(s => box("岩凿僧院两侧完整厚外岩壁", s * 12.8, 2.715, 0, .55, 5.07, 22)), box("僧院后方完整厚岩壁", 0, 2.715, 11.2, 25.6, 5.07, .55), box("连续覆盖岩厅与僧房的厚石岩顶", 0, 5.8, .1, 27.4, 1.1, 23.5)];
  for (const x of [-4.5, 4.5]) for (const z of [-4.5, 3.8]) p.push(box("中央方厅托住厚岩顶的独立方柱", x, 2.835, z, .65, 4.83, .65));
  for (const s of [-1, 1]) {
    for (const z of [-7.2, -3.6, 0, 3.6, 7.2]) p.push(...turn(door("独立侧僧房朝向方厅的小门", 3.6, 5.07, .3, 1.1, [0, .18, 0]), s * 90, [s * 8.7, 0, z]));
    for (const z of [-9, -5.4, -1.8, 1.8, 5.4, 9]) p.push(box("僧房之间实际分开的厚岩隔壁", s * 10.6, 2.715, z, 4, 5.07, .3));
  }
  for (const x of [-5.6, 0, 5.6]) p.push(...door("后排僧室朝向方厅的真门", 5.6, 5.07, .3, 1.15, [x, .18, 7.8]));
  for (const x of [-8.5, -2.8, 2.8, 8.5]) p.push(box("后排独立僧室之间厚岩分隔", x, 2.715, 9.5, .3, 5.07, 3.4));
  p.push(box("后方中央独立礼仪石座", 0, .85, 9.5, 1.8, 1.1, 1.5));
  return p;
}
