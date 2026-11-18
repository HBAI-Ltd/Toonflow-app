import { part, ring, beam, type ModelPart, type Triple } from "../assetModelParts";
import { base, box, cylinder, design, type ArchitecturePrototype } from "./structures";
import { halfRoundFloor, halfRoundWall, barrelRoof } from "./spatialShells";
import { polygon } from "../masterNature/shared";

const stone = "#b6b19a", sand = "#b4a07c", brick = "#a78367", wood = "#927354", slate = "#727e7b";

// 依据公开构造类型原创简化，不复制遗产测绘或远端模型，也不按同一建筑的层数扩主。
// https://whc.unesco.org/en/list/240
// https://whc.unesco.org/en/list/250
// https://whc.unesco.org/en/list/114
// https://www.turismoroma.it/it/luoghi/circo-massimo
// https://www.argolisculture.gr/en/list-of-monuments/ancient-theatre-of-epidavros/
// https://www.aachenerdom.de/en/a-place-of-history/architecture-and-history-of-the-building/
export const historicSpaceBatchTwoDesigns: ArchitecturePrototype[] = [
  design("曲线方塔顶连殿圣所", "入口柱廊、集会前殿、窄前室和后圣室顺轴互通，后圣室上方的曲线方塔以真实折面轮廓向顶端收束", nagaraTemple, "建筑", "异域"),
  design("层台维摩那连殿", "方形内圣室托住逐层收进的横檐台体，上部八角冠顶与前面的低柱厅形成高低关系", dravidaTemple, "建筑", "异域"),
  design("横长鞍顶高门塔", "高宽门道上承横向宽、纵深窄的收分多层塔身，顶端长筒形鞍盖与两端封头对应穿门轴线", gopuramGate, "建筑", "异域"),
  design("莲苞石塔四向圣殿", "陡阶高台上四向突出前廊接入中央圣室，上部多重退进塔圈与尖收莲苞共同形成高棉塔殿轮廓", khmerSanctuary, "建筑", "异域"),
  design("有顶折墙内院神门", "台阶通进贯穿石门的窄通道，上方完整山形覆顶连接两侧厚门身并接到外展矮墙，有别于上方断开的分体石门", paduraksaGate, "建筑", "异域"),
  design("三路登台层台神塔", "宽直梯与左右斜行侧梯会合于主平台，三重实心矩形大台逐层缩进，顶部独立开放门圣室与下部台体分离", ziggurat, "建筑", "异域"),
  design("双牛柱头宽台迎宾殿", "双向登台阶接入宽台柱厅，细长柱上的双兽前躯柱头夹住木梁，柱梁共同接承轻屋盖", apadanaHall, "建筑", "异域"),
  design("矩形外周柱廊神庙", "四周独立石柱托住完整外檐，两端三角山花覆盖有真实门口的长方内圣室，内室外保留连续可走柱廊", peripteralTemple, "建筑", "欧式"),
  design("天顶圆孔厚鼓圆殿", "高厚圆鼓的真实入口连到前柱廊，半球薄壳穹顶顶部保留穿天圆孔，内部保留完整无柱圆厅", oculusRotunda, "建筑", "欧式"),
  design("八角围廊浸洗礼堂", "八角围护把有门洞的中心浸洗池和环行围廊收在同一堂内，八边棱线屋盖与八个落地承柱相连", octagonalBaptistery, "建筑", "欧式"),
  design("中央脊墙U形战车竞技场", "狭长双向赛道绕过中央脊墙，半圆转弯端看台与另一端成列车闸相对", circusArena, "建筑", "欧式"),
  design("分径阶道扇形古剧场", "完整半圆分阶席圈绕圆形歌队场展开，放射阶道把观众席切为楔区，直线舞台建筑同侧入口相接", greekTheatre, "建筑", "欧式"),
  design("十字耳堂飞扶壁主教座堂", "高主廊与低侧廊被真实横向耳堂贯通，外置飞扶壁跨过侧廊回传高墙侧推，双前塔与高后龛共同围合十字主殿", gothicCathedral, "建筑", "欧式"),
  design("双层内廊八角宫廷礼拜堂", "八角中央高室被两层环行廊包围，地面与高廊各自连到落地墩和上层拱券，中央不被上层楼板填死", palatineChapel, "建筑", "欧式"),
  design("三廊矮券地下礼拜室", "密柱网把低位地下空间分为三个平行券廊，正交横券在柱头接合，后部祭室与中廊连续", vaultedCrypt, "建筑", "欧式"),
  design("内马蹄三石门巨石礼仪圈", "外圈竖石与闭合石楣包围内侧马蹄形三石门组，开放朝向连接前方仪式通路", trilithonCircle, "建筑", "异域"),
  design("舟形列石墓坛", "两列向首尾会合的高立石形成长舟轮廓，尖端标石较高，中央低葬坛与外部行走面分开且没有实体船壳", stoneShip, "设施", "异域"),
  design("长横祭台玛拉埃礼仪院", "宽阔石铺前庭正对后方长横高祭台，独立背石、围地低墙和侧向通路共同构成露天礼仪院", maraeCourt, "建筑", "异域"),
];

function wallOpening(name: string, x: number, z: number, width: number, height: number, depth: number, gap: number, y = .18, color = stone): ModelPart[] {
  const side = (width - gap) / 2;
  return [...[-1, 1].map(s => box(`${name}两侧厚壁`, x + s * (gap + side) / 2, y + height / 2, z, side, height, depth, color)), box(`${name}洞顶过梁`, x, y + height - .32, z, gap, .64, depth, color)];
}

function loft(name: string, outline: [number, number][], levels: [number, number][], position: Triple, color = stone): ModelPart {
  const vertices: { x: number; y: number; z: number }[] = [], indices: number[] = [], n = outline.length;
  for (let side = 0; side < n; side++) {
    const start = vertices.length, a = outline[side]!, b = outline[(side + 1) % n]!;
    for (const [r, y] of levels) vertices.push({ x: a[0] * r, y, z: a[1] * r }, { x: b[0] * r, y, z: b[1] * r });
    for (let row = 0; row < levels.length - 1; row++) { const k = start + row * 2; indices.push(k, k + 2, k + 1, k + 1, k + 2, k + 3); }
  }
  for (const end of [0, levels.length - 1]) {
    const [r, y] = levels[end]!, start = vertices.length;
    vertices.push({ x: 0, y, z: 0 }, ...outline.map(([x, z]) => ({ x: x * r, y, z: z * r })));
    for (let i = 0; i < n; i++) { const a = start + i + 1, b = start + (i + 1) % n + 1; indices.push(...(end === 0 ? [start, a, b] : [start, b, a])); }
  }
  return part(name, "mesh", color, position, [1, 1, 1], [0, 0, 0], { vertices, indices });
}

function squareOutline(): [number, number][] { return [[1, 1], [-1, 1], [-1, -1], [1, -1]]; }
function octagon(radius: number): [number, number][] { return Array.from({ length: 8 }, (_, i) => { const a = Math.PI / 8 + i * Math.PI / 4; return [Math.cos(a) * radius, Math.sin(a) * radius]; }); }
function circleRing(name: string, r: number, t: number, y: number, h: number, color = stone): ModelPart { return ring(name, color, r, t, y, h); }
function straightWall(name: string, a: [number, number], b: [number, number], height: number, bottom: number, thickness = .4): ModelPart {
  return part(name, "box", stone, [(a[0] + b[0]) / 2, bottom + height / 2, (a[1] + b[1]) / 2], [Math.hypot(b[0] - a[0], b[1] - a[1]), height, thickness], [0, -Math.atan2(b[1] - a[1], b[0] - a[0]) * 180 / Math.PI, 0]);
}
function pitchedCover(name: string, width: number, rise: number, depth: number, position: Triple): ModelPart {
  return part(name, "extrude", slate, position, [1, 1, 1], [0, 0, 0], { depth, profile: [{ x: -width / 2, y: 0 }, { x: 0, y: rise }, { x: width / 2, y: 0 }, { x: width / 2, y: -.2 }, { x: 0, y: rise - .2 }, { x: -width / 2, y: -.2 }] });
}
function stepFlight(name: string, count: number, width: number, run: number, rise: number, position: Triple, yaw = 0): ModelPart[] {
  const a = yaw * Math.PI / 180;
  return Array.from({ length: count }, (_, i) => box(name, position[0] + Math.sin(a) * i * run, position[1] + (i + 1) * rise / 2, position[2] + Math.cos(a) * i * run, width, (i + 1) * rise, run)).map(p => { p.rotation.y = yaw; return p; });
}

function nagaraTemple(): ModelPart[] {
  const p: ModelPart[] = [base(17, 29), box("高台主祭轴石基", 0, .75, 0, 11.4, 1.14, 23.5), ...stepFlight("进入前殿的真正登台阶", 6, 3.4, .45, .19, [0, .18, -14.2])];
  for (const s of [-1, 1]) p.push(box("后圣室厚侧壁", s * 3.2, 3.42, 5.2, .6, 4.2, 7.2), box("窄前室厚侧壁", s * 1.5, 3.2, -.2, .5, 3.76, 3.7), box("前殿开窗下方矮围壁", s * 3.7, 2.1, -5.3, .35, 1.56, 6.3));
  p.push(box("后圣室封壁", 0, 3.42, 8.55, 6.4, 4.2, .6), ...wallOpening("后圣室真实入口", 0, 1.75, 6.4, 4.2, .55, 2.5, 1.32), box("窄前室连续低顶", 0, 5.15, -.2, 3.6, .3, 3.7), ...wallOpening("前殿与窄前室相通门", 0, -2, 7.6, 3.76, .45, 3, 1.32));
  for (const x of [-2.8, 2.8]) for (const z of [-8.4, -5.3, -2.3]) p.push(cylinder("前殿长石承柱", x, 3.2, z, .38, 3.76, stone), box("前殿承柱上方石托", x, 5.2, z, .7, .28, .7));
  p.push(loft("前殿独立四坡低顶", squareOutline(), [[4.1, 0], [3.5, .65], [2.5, 1.5], [.6, 2.35]], [0, 5.34, -5.3], slate), loft("后圣室上方弧线收分的方塔", [[1, 1], [.35, 1], [.35, 1.14], [-.35, 1.14], [-.35, 1], [-1, 1], [-1, -1], [-.35, -1], [-.35, -1.14], [.35, -1.14], [.35, -1], [1, -1]], [[3.6, 0], [3.5, 1.9], [3.22, 3.9], [2.75, 6], [2.12, 8], [1.38, 9.6], [.65, 10.8]], [0, 5.52, 5.2]));
  const cap = part("塔顶扁圆阿摩罗果形冠石", "lathe", stone, [0, 16.32, 5.2], [1, 1, 1], [0, 0, 0], { profile: [{ x: 0, y: 0 }, { x: .95, y: .05 }, { x: 1.2, y: .3 }, { x: .95, y: .6 }, { x: 0, y: .65 }] });
  p.push(cap, cylinder("冠石之上短瓶顶", 0, 17.14, 5.2, .45, .7, stone), box("圣室中央低礼仪台", 0, 1.65, 5.2, 1.4, .66, 1.4));
  return p;
}

function dravidaTemple(): ModelPart[] {
  const p: ModelPart[] = [base(20, 29), box("方殿与前厅共用高台", 0, .7, 0, 13.5, 1.04, 24.5), ...stepFlight("通向低前厅的宽正阶", 5, 4, .5, .208, [0, .18, -14.5]), ...wallOpening("内圣室前方敞开门洞", 0, 1.6, 8.4, 4.7, .6, 2.8, 1.22)];
  for (const s of [-1, 1]) p.push(box("方圣室厚侧壁", s * 3.9, 3.57, 5.5, .6, 4.7, 8.4));
  p.push(box("圣室后方封闭厚壁", 0, 3.57, 9.4, 8.4, 4.7, .6), box("承塔石顶跨于圣室墙头", 0, 6.08, 5.5, 8.9, .32, 8.9));
  for (let i = 0; i < 6; i++) {
    const w = 9 - i * 1.22, y = 6.24 + i * 1.38;
    p.push(loft("内收塔层的斜石身", squareOutline(), [[w / 2, 0], [(w - .65) / 2, 1.28]], [0, y, 5.5]), box("塔层外伸连续石檐", 0, y + 1.28, 5.5, w + .2, .2, w + .2));
  }
  p.push(loft("最上层八角冠顶", octagon(1), [[1.32, 0], [1.5, .3], [.8, 1.4], [.18, 1.65]], [0, 14.5, 5.5]), cylinder("八角顶上的瓶形短顶", 0, 16.5, 5.5, .38, .7, stone));
  for (const x of [-4, -1.4, 1.4, 4]) for (const z of [-9.4, -5.5, -1.6]) p.push(box("前厅方石落地承柱", x, 3.25, z, .48, 4.06, .48), box("方柱宽石柱头", x, 5.42, z, .85, .28, .85));
  p.push(box("低柱厅的完整平石盖", 0, 5.72, -5.5, 10.1, .32, 12.3));
  return p;
}

function gopuramGate(): ModelPart[] {
  const p: ModelPart[] = [base(18, 12), ...wallOpening("高门塔落地贯通门道", 0, 0, 13, 7, 6.4, 3.7), box("门道上方整片承塔石台", 0, 7.3, 0, 14, .5, 7.3)];
  for (let i = 0; i < 7; i++) {
    const w = 13.6 - i * 1.28, d = 6.9 - i * .55, y = 7.55 + i * 1.55;
    p.push(part("横向较宽而纵深较窄的收分塔层", "extrude", stone, [0, y, 0], [1, 1, 1], [0, 0, 0], { depth: d, profile: [{ x: -w / 2, y: 0 }, { x: w / 2, y: 0 }, { x: (w - .65) / 2, y: 1.4 }, { x: -(w - .65) / 2, y: 1.4 }] }), box("塔层横向连续檐带", 0, y + 1.45, 0, w + .3, .2, d + .3));
  }
  const profile: { x: number; y: number }[] = [{ x: -1.65, y: 0 }];
  for (let i = 1; i <= 12; i++) { const a = Math.PI - i * Math.PI / 12; profile.push({ x: Math.cos(a) * 1.65, y: Math.sin(a) * 1.65 }); }
  p.push(part("纵向门轴上方横长的鞍筒冠盖", "extrude", slate, [0, 18.4, 0], [1, 1, 1], [0, 90, 0], { profile, depth: 5.6 }));
  for (const x of [-2, -1, 0, 1, 2]) p.push(cylinder("鞍筒冠脊上的独立小瓶顶", x, 20.3, 0, .22, .55, stone));
  return p;
}

function khmerSanctuary(): ModelPart[] {
  const p: ModelPart[] = [base(20, 24)];
  for (let i = 0; i < 3; i++) p.push(box("陡阶圣殿逐层高起的台基", 0, .18 + (i + 1) * .54, 1, 14 - i * 2.6, (i + 1) * 1.08, 14 - i * 2.6));
  p.push(...stepFlight("进入中央塔殿的陡直正阶", 12, 2.8, .38, .27, [0, .18, -9.4]));
  for (const s of [-1, 1]) {
    p.push(box("中央圣室实际落地的厚侧壁", s * 2.5, 5.3, 1, .6, 3.76, 5.6), ...wallOpening("中央塔殿前后真正门洞", 0, 1 + s * 2.5, 5.6, 3.76, .6, 1.8, 3.42));
    const wall = wallOpening("横向前廊外端门框", 0, 0, 2.7, 3.2, .4, 1.4, 3.42);
    for (const value of wall) { const x = value.position.x, z = value.position.z; value.position.x = s * 4.1 + z; value.position.z = 1 - s * x; value.rotation.y = s * 90; } p.push(...wall);
    p.push(box("横向前廊上方连续石盖", s * 3.4, 6.7, 1, 3.2, .26, 3), box("前后门廊的侧向石柱", s * 1.2, 5.05, -2.8, .3, 3.26, .3));
  }
  p.push(box("前廊小石盖", 0, 6.78, -2.7, 3.2, .2, 3), loft("方塔向上退进的主石身", [[1, 1], [.4, 1], [.4, 1.18], [-.4, 1.18], [-.4, 1], [-1, 1], [-1, -1], [1, -1]], [[3.05, 0], [2.9, 1.2], [2.6, 2.6], [2.3, 4], [1.9, 5.4], [1.5, 6.7], [1.1, 7.8], [.8, 8.6]], [0, 7.05, 1]));
  for (let i = 0; i < 4; i++) { const crown = circleRing("塔顶层叠莲瓣冠环", 1.55 - i * .28, .26, 15.6 + i * .53, .35); crown.position.z = 1; p.push(crown); }
  p.push(part("上部尖收的莲苞实体冠顶", "lathe", stone, [0, 17.25, 1], [1, 1, 1], [0, 0, 0], { profile: [{ x: 0, y: 0 }, { x: .45, y: 0 }, { x: .62, y: .5 }, { x: .43, y: 1 }, { x: .18, y: 1.5 }, { x: 0, y: 1.9 }] }));
  return p;
}

function paduraksaGate(): ModelPart[] {
  const p: ModelPart[] = [base(18, 12), box("登门石台", 0, .65, 0, 7.5, .94, 6.2), ...stepFlight("内院神门外侧登阶", 5, 2.8, .42, .188, [0, .18, -4.9]), ...wallOpening("内院窄门实际贯通的厚门身", 0, 0, 6.6, 4.4, 2.7, 1.8, 1.12)];
  const gateRoof = loft("连接两侧门身的完整山形神门顶", squareOutline(), [[3.9, 0], [3.8, .35], [3.05, 1.25], [2.6, 2.2], [1.8, 3.25], [.8, 4.15], [.12, 4.8]], [0, 5.52, 0], brick); gateRoof.scale.z = .45; p.push(gateRoof);
  for (const s of [-1, 1]) {
    p.push(box("门身两侧接到院界的低墙", s * 5.6, 1.18, .8, 5, 2, .5, brick), box("低墙端头加厚院界立柱", s * 8.1, 1.5, .8, .8, 2.64, .8, brick), loft("石门侧面连续上卷的独立翼石", [[1, 1], [-1, 1], [-1, -1], [1, -1]], [[.8, 0], [1.15, .7], [1.05, 1.6], [.68, 2.5], [.1, 3.3]], [s * 3.5, 2.4, 0], brick));
  }
  return p;
}

function ziggurat(): ModelPart[] {
  const p: ModelPart[] = [base(40, 42)];
  for (let i = 0; i < 3; i++) p.push(box("独立矩形夯砖层台", 0, .18 + (i + 1) * 1.6, 4, 31 - i * 12, (i + 1) * 3.2, 29 - i * 12, brick));
  p.push(...stepFlight("正面登上首层平台的宽直石阶", 16, 4.2, .45, .2, [0, .18, -17.45]));
  for (const s of [-1, 1]) {
    p.push(...stepFlight("正面左右会合到首台的斜行侧梯", 16, 2.8, .57, .2, [s * 15.2, .18, -10.9], s < 0 ? 90 : -90));
    p.push(box("首层正面转折平台的护栏", s * 3.25, 3.82, -10.3, 2.6, .7, .35, brick));
  }
  p.push(...stepFlight("首层转上第二层的中央石阶", 12, 3.4, .42, 3.2 / 12, [0, 3.38, -9.33]), ...stepFlight("第二层接到顶部圣室平台的石阶", 12, 3, .42, 3.2 / 12, [0, 6.58, -3.33]), ...wallOpening("塔顶独立小圣室正门", 0, 2.2, 6.5, 3.6, .4, 1.9, 9.78, sand), ...[-1, 1].map(s => box("塔顶圣室侧壁", s * 3.05, 11.58, 4.1, .4, 3.6, 4.2, sand)), box("塔顶圣室后壁", 0, 11.58, 6.2, 6.5, 3.6, .4, sand), box("塔顶平展石屋盖", 0, 13.56, 4.1, 6.9, .36, 4.8, sand));
  return p;
}

function apadanaHall(): ModelPart[] {
  const p: ModelPart[] = [base(30, 32), box("迎宾大殿抬高的宽石台", 0, 1.32, 1, 27, 2.28, 26)];
  for (const s of [-1, 1]) p.push(...stepFlight("左右相向登台的宽石阶", 12, 3.1, .6, .19, [s * 11.6, .18, -13.5], s < 0 ? 90 : -90));
  const columns: [number, number][] = [];
  for (const x of [-8, 0, 8]) for (const z of [-7, 1, 9]) columns.push([x, z]);
  for (const x of [-8, -2.7, 2.7, 8]) columns.push([x, -10.7]);
  for (const [x, z] of columns) {
    p.push(cylinder("迎宾殿细长石柱身", x, 6.1, z, .65, 7.28, stone), cylinder("柱下独立宽盘柱础", x, 2.63, z, 1.3, .34, stone), part("成对背向兽首夹住上梁的柱头", "extrude", stone, [x, 9.67, z], [1, 1, 1], [0, 0, 0], { depth: .65, profile: [{ x: -1.2, y: .25 }, { x: -1.35, y: .55 }, { x: -1.3, y: .9 }, { x: -1.2, y: .94 }, { x: -1.2, y: 1.2 }, { x: -1.12, y: 1.2 }, { x: -1.05, y: .88 }, { x: -.65, y: .8 }, { x: -.55, y: .45 }, { x: .55, y: .45 }, { x: .65, y: .8 }, { x: 1.05, y: .88 }, { x: 1.12, y: 1.2 }, { x: 1.2, y: 1.2 }, { x: 1.2, y: .94 }, { x: 1.3, y: .9 }, { x: 1.35, y: .55 }, { x: 1.2, y: .25 }, { x: .6, y: .1 }, { x: .6, y: 0 }, { x: -.6, y: 0 }, { x: -.6, y: .1 }] }));
  }
  for (const x of [-8, 0, 8]) p.push(box("双兽柱头间承放的连续纵向木梁", x, 10.28, 1, .62, .4, 24.4, wood));
  for (const z of [-10.7, -7, 1, 9]) p.push(box("纵梁上方横跨柱列的木梁", 0, 10.67, z, 19, .38, .5, wood));
  p.push(box("不采用沉重拱顶的轻质平屋盖", 0, 11.07, .2, 24.8, .42, 25.7, wood), box("后侧独立围护高墙", 0, 6.2, 12.5, 24, 7.48, .65), ...[-1, 1].map(s => box("柱厅两旁的厚围壁", s * 12, 6.2, 2.7, .65, 7.48, 20.2)));
  return p;
}

function peripteralTemple(): ModelPart[] {
  const p: ModelPart[] = [base(17, 32), box("连续第二层登临石阶", 0, .36, 0, 16.3, .36, 31.3), box("支承全部柱廊的上层石台", 0, .7, 0, 15.6, .32, 30.6), ...wallOpening("内圣室长方前门", 0, -8, 7.8, 5.5, .45, 2.6, .86), ...[-1, 1].map(s => box("内圣室完整厚侧壁", s * 3.68, 3.61, 1.2, .45, 5.5, 18.4)), box("内圣室后方封壁", 0, 3.61, 10.2, 7.8, 5.5, .45)];
  const columns: [number, number][] = [];
  for (const x of [-6, -3.6, -1.2, 1.2, 3.6, 6]) for (const z of [-13.5, 13.5]) columns.push([x, z]);
  for (const x of [-6, 6]) for (const z of [-10.5, -7.5, -4.5, -1.5, 1.5, 4.5, 7.5, 10.5]) columns.push([x, z]);
  for (const [x, z] of columns) p.push(cylinder("外周柱廊独立石柱身", x, 3.75, z, .58, 5.78, stone), box("柱身上方方形承檐盘", x, 6.78, z, .88, .28, .88));
  for (const s of [-1, 1]) p.push(box("外周柱列上的连续纵向额枋", s * 6, 7.2, 0, .8, .56, 28.1), box("前后柱列上的连续横向额枋", 0, 7.2, s * 13.5, 12.8, .56, .8));
  p.push(pitchedCover("外檐柱列承住的连续双坡屋面", 14.6, 2.65, 29.2, [0, 7.6, 0]));
  for (const s of [-1, 1]) p.push(part("屋面两端封闭三角山花", "extrude", stone, [0, 7.45, s * 14.1], [1, 1, 1], [0, 0, 0], { depth: .3, profile: [{ x: -7.25, y: 0 }, { x: 7.25, y: 0 }, { x: 0, y: 2.65 }] }));
  return p;
}

function oculusRotunda(): ModelPart[] {
  const p: ModelPart[] = [cylinder("圆殿完整无柱石地面", 0, .18, 0, 25.2, .36, stone), halfRoundWall("厚鼓墙在前方真实留出入口", 11.6, 1.35, 11.2, [0, .36, 0], 78, stone, 336 * Math.PI / 180), halfRoundWall("门头上方才闭合的厚鼓前壁", 11.6, 1.35, 6.2, [0, 5.36, 0], 102, stone, 24 * Math.PI / 180)];
  const profile: { x: number; y: number }[] = [], angle = Math.acos(2 / 11.7);
  for (let i = 0; i <= 12; i++) { const a = i * angle / 12; profile.push({ x: Math.cos(a) * 11.7, y: Math.sin(a) * 11.7 }); }
  for (let i = 12; i >= 0; i--) { const a = i * angle / 12; profile.push({ x: Math.cos(a) * 10.85, y: Math.sin(a) * 10.85 }); }
  profile.push({ x: 11.7, y: 0 });
  p.push(part("顶部圆孔真正穿透的厚半球穹顶", "lathe", stone, [0, 11.56, 0], [1, 1, 1], [0, 0, 0], { profile }), box("前柱廊独立基台", 0, .3, -14.5, 11.5, .6, 9), ...wallOpening("前柱廊同圆鼓相连的门框", 0, -11, 5.2, 5.2, 1.2, 3.5, .36));
  for (const x of [-4.6, -2.3, 0, 2.3, 4.6]) p.push(cylinder("前柱廊落地石柱", x, 3.25, -17.6, .55, 5.3, stone), box("前柱廊宽石柱头", x, 6.05, -17.6, .9, .3, .9));
  p.push(box("柱廊实际托住的前额枋", 0, 6.42, -17.6, 11.3, .44, .7), pitchedCover("柱廊前端与厚鼓相接的双坡屋盖", 12.4, 2.2, 9.5, [0, 6.7, -14.5]));
  return p;
}

function octagonalBaptistery(): ModelPart[] {
  const outline = octagon(7.5), p: ModelPart[] = [polygon("八角礼堂同高石铺地面", stone, outline, .24)];
  for (let i = 0; i < 8; i++) {
    const a = outline[i]!, b = outline[(i + 1) % 8]!, x = (a[0] + b[0]) / 2, z = (a[1] + b[1]) / 2, length = Math.hypot(b[0] - a[0], b[1] - a[1]), yaw = Math.atan2(b[0] - a[0], b[1] - a[1]) * 180 / Math.PI;
    if (i === 5) {
      const doors = wallOpening("八角堂入口", 0, 0, length, 6.5, .4, 2.2, .24);
      for (const value of doors) { const localX = value.position.x; value.position.x = x + Math.sin(yaw * Math.PI / 180) * localX; value.position.z = z + Math.cos(yaw * Math.PI / 180) * localX; value.rotation.y = yaw - 90; } p.push(...doors);
    } else p.push(straightWall("八角礼堂完整外侧墙", a, b, 6.5, .24, .42));
    const angle = Math.PI / 8 + i * Math.PI / 4;
    p.push(cylinder("环行内廊的落地石柱", Math.cos(angle) * 4.4, 3.49, Math.sin(angle) * 4.4, .38, 6.5, stone));
  }
  p.push(loft("八条棱线朝中央抬起的礼堂屋盖", octagon(1), [[7.9, 0], [4.1, 2.6], [1.1, 4.15], [.1, 4.5]], [0, 6.74, 0], slate), circleRing("中心浸洗池真正环形矮壁", 1.8, .25, .55, .62), cylinder("浸洗池底面", 0, .31, 0, 3.4, .14, stone), part("浸洗池内单独水面", "cylinder", "#82a7aa", [0, .58, 0], [3.05, .025, 3.05], [0, 0, 0], { opacity: .7, roughness: .18 }));
  return p;
}

function circusArena(): ModelPart[] {
  const p: ModelPart[] = [box("战车场南半连续地基", 0, .09, -29, 44, .18, 58, sand), box("战车场北半连续地基", 0, .09, 29, 44, .18, 58, sand), box("长直双向赛道地面", 0, .25, 0, 25, .14, 80, sand), halfRoundFloor("赛道完整半圆转弯端", 12.5, .14, [0, .18, 40], 0, sand), box("分隔双向赛道的中央长脊墙", 0, .65, 0, 2.1, .8, 62), ...[-1, 1].map(s => cylinder("中央脊墙两端实际转弯标台", 0, .9, s * 31, 3, 1.2, stone))];
  for (let i = 0; i < 6; i++) {
    const r = 13.3 + i * .72, h = .8 + i * .5;
    p.push(...[-1, 1].map(s => box("赛道长边成排石座阶", s * (r - .36), .18 + h / 2, 0, .74, h, 80)), halfRoundWall("转弯端连续弧形石看台", r, .74, h, [0, .18, 40], 0, stone));
  }
  for (let i = 0; i <= 8; i++) { p.push(box("出发车闸之间的独立分隔柱", -12.4 + i * 3.1, 1.55, -40.7, .35, 2.74, 3.2)); if (i < 8) p.push(box("闸前横向抬起的发令梁", -10.85 + i * 3.1, 2.9, -41.2, 2.75, .25, .3, wood)); }
  p.push(box("车闸后方连续供车通路", 0, .28, -44.5, 28, .2, 4.2));
  return p;
}

function greekTheatre(): ModelPart[] {
  const p: ModelPart[] = [cylinder("石铺圆形歌队表演场", 0, .15, 0, 11, .3, sand), box("歌队场后方直线舞台地基", 0, .4, -7.8, 22, .8, 5.5), ...wallOpening("舞台后景壁中央真正出入门", 0, -10.3, 21, 4.8, .5, 2, .8)];
  for (let row = 0; row < 10; row++) {
    const r = 6.3 + row * .8, h = .55 + row * .42;
    for (let sector = 0; sector < 5; sector++) p.push(halfRoundWall("放射阶道之间完整楔区石座", r, .8, h, [0, .18, 0], -sector * 36 - 2.5, stone, 31 * Math.PI / 180));
  }
  for (let aisle = 1; aisle < 5; aisle++) {
    const a = aisle * Math.PI / 5, profile = [{ x: 0, y: 0 }];
    for (let i = 0; i < 10; i++) profile.push({ x: i * .8, y: .55 + i * .42 }, { x: (i + 1) * .8, y: .55 + i * .42 });
    profile.push({ x: 8, y: 0 });
    p.push(part("在席区之间真正逐级登高的放射石阶", "extrude", stone, [Math.cos(a) * 5.5, .18, Math.sin(a) * 5.5], [1, 1, 1], [0, -a * 180 / Math.PI, 0], { profile, depth: .45 }));
  }
  for (const s of [-1, 1]) p.push(box("舞台两侧保留步行侧入口的矮翼台", s * 9.1, 1.1, -5.6, 3.8, 1.4, 2.5), box("景壁两端独立承檐墩", s * 10.3, 3.2, -10.2, .65, 4.8, 1.2));
  p.push(box("后景壁上方连续横石檐", 0, 5.78, -10.2, 22.4, .36, .9));
  return p;
}

function pointedRoof(name: string, r: number, h: number, depth: number, position: Triple, yaw = 0): ModelPart {
  const outline: [number, number][] = [[-r, 0], [-r * .82, h * .43], [-r * .45, h * .78], [0, h], [r * .45, h * .78], [r * .82, h * .43], [r, 0], [r - .22, -.02], [(r - .22) * .82, h * .43 - .18], [(r - .22) * .45, h * .78 - .18], [0, h - .2], [-(r - .22) * .45, h * .78 - .18], [-(r - .22) * .82, h * .43 - .18], [-r + .22, -.02]];
  return part(name, "extrude", slate, position, [1, 1, 1], [0, yaw, 0], { depth, profile: outline.map(([x, y]) => ({ x, y })) });
}

function gothicCathedral(): ModelPart[] {
  const p: ModelPart[] = [base(30, 42), box("连续长主廊石铺地面", 0, .28, 0, 15, .2, 35), box("与主廊贯通的横向耳堂地面", 0, .28, 6.5, 26, .2, 7.5), pointedRoof("高主廊交叉区前方完整尖券", 3.5, 3.9, 20.4, [0, 10.9, -7.2]), pointedRoof("高主廊交叉区后方完整尖券", 3.5, 3.9, 7.4, [0, 10.9, 13.7]), ...[-1, 1].map(s => pointedRoof("横耳堂交叉区之外的高尖券", 3.5, 3.9, 9.4, [s * 8.2, 10.9, 6.5], 90)), crossVault([0, 10.9, 6.5], 3.5, 3.5, 3.9, true)];
  for (const s of [-1, 1]) {
    for (const z of [-14, -8.3, -2.6, 11.6, 16.3]) {
      p.push(box("把高主廊与低侧廊分开的束柱", s * 3.5, 4.64, z, .6, 8.72, .6), box("高侧窗之间的上壁石墩", s * 3.5, 9.8, z, .4, 1.6, .6), box("侧廊最外侧独立落地扶壁墩", s * 8.2, 3.1, z, 1.3, 5.64, 1.2), beam("跨过侧廊把高墙侧推交给外墩的飞扶壁", stone, [s * 3.5, 10.2, z], [s * 8.2, 5.5, z], .35, .6));
    }
    p.push(box("高侧窗上方连续承券石梁", s * 3.5, 10.75, 0, .55, .3, 34.8), box("低侧廊外侧前半石墙", s * 7.3, 2.7, -7, .45, 4.84, 19), box("低侧廊外侧后段石墙", s * 7.3, 2.7, 13.6, .45, 4.84, 6), pointedRoof("被外扶壁跨越的前侧廊尖顶", 1.9, 2.3, 19.2, [s * 5.4, 5.12, -7]), pointedRoof("后部短侧廊尖顶", 1.9, 2.3, 6.2, [s * 5.4, 5.12, 13.6]));
    p.push(...wallOpening("横耳堂端头真正高门洞", 0, 0, 7.5, 10.62, .5, 2.4, .28).map(v => { const x = v.position.x; v.position.x = s * 12.8; v.position.z = 6.5 - s * x; v.rotation.y = s * 90; return v; }));
    for (const z of [2.8, 10.2]) p.push(box("横耳堂外侧厚围壁", s * 9.85, 5.59, z, 6.35, 10.62, .5), box("横耳堂与主廊交界的落地角墩", s * 3.5, 5.59, z, .75, 10.62, .75));
    p.push(...wallOpening("前端双高塔的入口", s * 5.4, -17.2, 4.2, 11.5, 4.6, 1.7, .28), loft("前塔四坡尖收石顶", squareOutline(), [[2.4, 0], [1.8, 1.8], [.1, 6.2]], [s * 5.4, 11.78, -17.2], slate));
  }
  p.push(...wallOpening("正中主门户", 0, -17.2, 6.7, 8.72, .6, 2.6, .28), halfRoundFloor("后龛同主廊接通的半圆石地面", 3.5, .2, [0, .18, 17.4], 0, stone), halfRoundWall("后龛真正连续半圆厚墙", 3.5, .45, 8.72, [0, .38, 17.4], 0, stone), loft("后龛独立多棱高屋盖", octagon(1), [[3.9, 0], [.1, 3.2]], [0, 9.1, 17.4], slate));
  return p;
}

function palatineChapel(): ModelPart[] {
  const outside = octagon(9), inside = octagon(4.6), p: ModelPart[] = [polygon("八角核心与外廊共用石地面", stone, outside, .25), polygon("上层内廊楼板中央保持真正贯通孔", stone, outside, .3, [0, 4.25, 0], [inside]), loft("中央八角高室棱脊屋盖", octagon(1), [[4.9, 0], [4.2, 2.6], [2.5, 4.6], [.25, 5.5]], [0, 10, 0], slate)];
  for (let i = 0; i < 8; i++) {
    const a = Math.PI / 8 + i * Math.PI / 4, x = Math.cos(a) * 4.6, z = Math.sin(a) * 4.6;
    p.push(box("两层内廊共用的下层石墩", x, 2.25, z, .8, 4, .8), box("高廊上方再次支承高室的上层石墩", x, 6.4, z, .7, 3.7, .7));
    const next = inside[(i + 1) % 8]!, point = inside[i]!, length = Math.hypot(next[0] - point[0], next[1] - point[1]), mid: Triple = [(point[0] + next[0]) / 2, 8.25, (point[1] + next[1]) / 2];
    const archPart = barrelRoof("高廊内侧向中央开放的窄券", length / 2, .18, .55, mid, stone); archPart.rotation.y = -Math.atan2(next[1] - point[1], next[0] - point[0]) * 180 / Math.PI; p.push(archPart);
    const outer = outside[i]!, outerNext = outside[(i + 1) % 8]!;
    if (i === 5) {
      const length = Math.hypot(outerNext[0] - outer[0], outerNext[1] - outer[1]), yaw = Math.atan2(outerNext[0] - outer[0], outerNext[1] - outer[1]);
      p.push(...wallOpening("下层内廊外侧入口", 0, 0, length, 7.3, .4, 2.4, .25).map(v => { const localX = v.position.x; v.position.x = (outer[0] + outerNext[0]) / 2 + Math.sin(yaw) * localX; v.position.z = (outer[1] + outerNext[1]) / 2 + Math.cos(yaw) * localX; v.rotation.y = yaw * 180 / Math.PI - 90; return v; }));
    } else p.push(straightWall("外廊连续的八角围护墙", outer, outerNext, 7.3, .25));
  }
  p.push(polygon("外环廊上方带八角核心孔的薄石屋盖", slate, outside, .28, [0, 7.55, 0], [inside]));
  for (const s of [-1, 1]) p.push(box("中央高室前后两段高窗承墙", 0, 8.8, s * 4.3, 3.2, 2.4, .3));
  return p;
}

function vaultedCrypt(): ModelPart[] {
  const p: ModelPart[] = [base(17, 23), ...wallOpening("地下礼拜室前方入口", 0, -10.5, 15.2, 3.4, .6, 2.4), box("后部祭室封壁", 0, 1.88, 10.5, 15.2, 3.4, .6)];
  for (const s of [-1, 1]) p.push(box("两侧真正连续地下石围壁", s * 7.3, 1.88, 0, .6, 3.4, 21));
  for (const x of [-4.8, 0, 4.8]) for (const z of [-8.5, -4.25, 0, 4.25, 8.5]) p.push(crossVault([x, 3.58, z]));
  for (const x of [-2.4, 2.4]) for (const z of [-6.375, -2.125, 2.125, 6.375]) p.push(cylinder("地下多廊真正落地石柱", x, 1.83, z, .55, 3.3, stone), box("连接纵横券脚的宽石柱头", x, 3.5, z, .95, .2, .95));
  p.push(box("后方独立低礼仪石案", 0, .85, 8.2, 2.5, 1.34, 1.3));
  return p;
}

function crossVault(position: Triple, radiusX = 2.4, radiusZ = 2.125, rise = 2.4, pointed = false): ModelPart {
  const steps = pointed ? [-1, -.82, -.45, 0, .45, .82, 1] : Array.from({ length: 9 }, (_, i) => i / 4 - 1), n = steps.length - 1, stride = n + 1, count = stride * stride, vertices: { x: number; y: number; z: number }[] = [], indices: number[] = [];
  const heightAt = (u: number) => pointed ? rise * (u < .45 ? 1 - u * .22 / .45 : u < .82 ? .78 - (u - .45) * .35 / .37 : .43 - (u - .82) * .43 / .18) : rise * Math.sqrt(Math.max(0, 1 - u * u));
  for (const thickness of pointed ? [0, -.2] : [.24, 0]) for (let z = 0; z <= n; z++) for (let x = 0; x <= n; x++) {
    const u = steps[x]!, v = steps[z]!;
    vertices.push({ x: u * radiusX, y: heightAt(Math.min(Math.abs(u), Math.abs(v))) + thickness, z: v * radiusZ });
  }
  for (let z = 0; z < n; z++) for (let x = 0; x < n; x++) {
    const a = z * stride + x, b = a + stride;
    indices.push(a, b, a + 1, a + 1, b, b + 1, a + count, a + 1 + count, b + count, a + 1 + count, b + 1 + count, b + count);
  }
  const boundary = [...Array.from({ length: stride }, (_, x) => x), ...Array.from({ length: n }, (_, z) => (z + 1) * stride + n), ...Array.from({ length: n }, (_, x) => n * stride + n - x - 1), ...Array.from({ length: n - 1 }, (_, z) => (n - z - 1) * stride)];
  for (let i = 0; i < boundary.length; i++) { const a = boundary[i]!, b = boundary[(i + 1) % boundary.length]!; indices.push(a, b, b + count, a, b + count, a + count); }
  return part(pointed ? "四臂尖券之间无内置交叉墙的连续尖交叉券" : "由四角柱承起且无内置交叉墙的连续交叉券", "mesh", stone, position, [1, 1, 1], [0, 0, 0], { vertices, indices });
}

function trilithonCircle(): ModelPart[] {
  const p: ModelPart[] = [cylinder("完整巨石礼仪场的低地盘", 0, .1, 0, 30, .2, sand)];
  for (let i = 0; i < 16; i++) {
    const a = i * Math.PI / 8, next = (i + 1) * Math.PI / 8;
    if (i === 12) continue;
    p.push(part("外圈真实承楣的高立石", "box", stone, [Math.cos(a) * 10.2, 2.35, Math.sin(a) * 10.2], [1.05, 4.3, 1.35], [0, 90 - a * 180 / Math.PI, 0]));
    if (i !== 11) p.push(straightWall("相邻外圈高立石之间的石楣", [Math.cos(a) * 10.2, Math.sin(a) * 10.2], [Math.cos(next) * 10.2, Math.sin(next) * 10.2], .7, 4.5, 1.4));
  }
  for (let i = 0; i < 5; i++) {
    const a = (20 + i * 35) * Math.PI / 180, x = Math.cos(a) * 5.5, z = Math.sin(a) * 5.5, yaw = 90 - a * 180 / Math.PI;
    for (const s of [-1, 1]) p.push(part("内马蹄三石门的双立石", "box", stone, [x + Math.sin(a) * s * 1.05, 2.9, z - Math.cos(a) * s * 1.05], [.9, 5.4, 1.4], [0, yaw, 0]));
    p.push(part("内马蹄三石门的整片横楣", "box", stone, [x, 5.85, z], [3.15, .5, 1.6], [0, yaw, 0]));
  }
  p.push(box("礼仪圈开放朝向连接的铺石前道", 0, .12, -16, 4.5, .24, 6, stone));
  return p;
}

function stoneShip(): ModelPart[] {
  const p: ModelPart[] = [box("船形葬坛内侧独立的低砂床", 0, .1, 0, 6, .2, 27, sand), box("内侧低位葬石台", 0, .37, 0, 1.6, .54, 3.8)];
  for (const s of [-1, 1]) for (let i = 1; i < 12; i++) {
    const z = -15 + i * 2.5, x = s * Math.sin(i * Math.PI / 12) * 4.5, h = 1.3 + Math.abs(z) * .045;
    p.push(part("两列向船首尾相接的独立高石", "extrude", stone, [x, .18, z], [1, 1, 1], [0, s * z * 2.3, 0], { depth: .55, profile: [{ x: -.4, y: 0 }, { x: .45, y: 0 }, { x: .28, y: h }, { x: -.12, y: h + .18 }, { x: -.35, y: h * .72 }] }));
  }
  for (const z of [-15, 15]) p.push(part("船形首尾独立的尖收标石", "extrude", stone, [0, .18, z], [1, 1, 1], [0, 0, 0], { depth: .75, profile: [{ x: -.55, y: 0 }, { x: .55, y: 0 }, { x: .24, y: 2.95 }, { x: -.1, y: 3.2 }, { x: -.43, y: 2.3 }] }));
  return p;
}

function maraeCourt(): ModelPart[] {
  const p: ModelPart[] = [base(27, 37), box("前庭完整石铺礼仪地面", 0, .28, -1, 24, .2, 30), box("后方长横高祭台下层", 0, .6, 13, 23, .84, 5), box("长横祭台上层实际台面", 0, 1.25, 13.6, 21.8, .46, 3.8)];
  for (const s of [-1, 1]) p.push(box("礼仪院两侧完整低界墙", s * 12.2, .7, -.5, .55, 1.04, 31), box("前庭入口两旁低界墙", s * 7.1, .7, -16, 10.2, 1.04, .55));
  for (const x of [-8.5, -4.2, 0, 4.2, 8.5]) p.push(part("高台背后独立的仪式立石", "extrude", stone, [x, 1.48, 15.1], [1, 1, 1], [0, 0, 0], { depth: .3, profile: [{ x: -.65, y: 0 }, { x: .65, y: 0 }, { x: .55, y: 2.05 }, { x: .1, y: 2.35 }, { x: -.5, y: 2.1 }] }));
  p.push(...stepFlight("接到长横祭台一端的侧阶", 5, 2.2, .4, .26, [-12.6, .18, 13.6], 90));
  return p;
}
