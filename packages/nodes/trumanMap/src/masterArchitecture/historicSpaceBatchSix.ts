import { part, beam, type ModelPart, type Triple } from "../assetModelParts";
import { base, box, cylinder, design, type ArchitecturePrototype } from "./structures";
import { barrelRoof, halfDomeRoof, halfRoundWall, halfRoundFloor } from "./spatialShells";
import { polygon } from "../masterNature/shared";
import { Euler, Quaternion, Vector3 } from "three";

const stone = "#b6b19b", brick = "#ad9070", wood = "#937655", tile = "#827f6d", earth = "#b39873", red = "#a36954";

// 原创空间类型保留承重、真实开口与高低动线；并非特定遗址的测绘复原。
// https://www.turismoroma.it/it/luoghi/basilica-di-massenzio
// https://www.theacropolismuseum.gr/en/node/16472
// https://www.getty.edu/publications/resources/virtuallibrary/0892364211.pdf
// https://www.man.es/man/exposiciones/recorridos-tematicos/tocar-historia/decoracion-andalusi.html
// https://www.archnet.org/sites/6395
// https://whc.unesco.org/en/list/364
// https://patrimoniomundial.cultura.pe/sitiosdelpatrimoniomundial/sitio-arqueol%C3%B3gico-chav%C3%ADn
// https://whc.unesco.org/en/list/1568/
// https://www.hh.gr/en/destinations/knossos/
export const historicSpaceBatchSixDesigns: ArchitecturePrototype[] = [
  design("交叉高券横舱巨型公会堂", "三跨巨型交叉券沿中厅连续相接，两边横向筒券舱由厚隔墩支承，后端半圆龛和前端宽门廊直接接入主轴", vaultedBasilica, "建筑", "欧式"),
  design("高低双殿偏置女柱廊神庙", "高位前殿与低位后殿共用主屋盖，偏置低柱廊从侧面进入，另一侧女像承柱亭由内阶连到高位石台", splitLevelTemple, "建筑", "欧式"),
  design("深前廊后三内殿高台神庙", "单向正阶登上完整高台，深柱廊占据前半部，后半部三座并列内殿各有真门，宽木梁与山花共同承住大出檐屋盖", tuscanTemple, "建筑", "欧式"),
  design("双层马蹄拱柱网祈祷院", "矮柱上的马蹄拱与更高的承顶拱墙分层连接，纵向柱网把祈祷厅分成通行廊，开放前庭经门道接入，后龛可见真实凹室", doubleArcadePrayerCourt, "建筑", "异域"),
  design("土扶壁木榫高墙祈祷大院", "抬高石台上前庭连接密墩祈祷厅，厚土外壁由收分扶壁和三处高附壁体加固，外伸木榫与完整平土屋盖保持实际连接", mudButtressMosque, "建筑", "异域"),
  design("平行曲道圆锥塔大围场", "收分椭圆石壁围住大场，内侧弧墙与外壁夹出狭长平行通道，通道终端靠近独立实心圆锥石塔，内场另有低位分区", greatEnclosure, "建筑", "异域"),
  design("U形内廊高台凹圆祭场石庙", "厚石台三翼围住下沉圆形祭场，内部折行廊与前端真门相通，两侧登台阶避开中央廊口并接到高台顶层", chavinTemple, "建筑", "异域"),
  design("前伊万横列三穹内庭宫", "正面高筒券伊万接入横向三座连通穹室，后方开敞内庭由两侧房翼和后室围合，宫内各段沿前后主轴连续通行", firuzabadPalace, "建筑", "异域"),
  design("悬链高券双翼觐见宫", "从地面升起的高悬链筒券形成正面敞开的大觐见厅，两侧完整房翼含独立入口和分室，深凹券廊立面接入厚侧壁", catenaryAudiencePalace, "建筑", "异域"),
  design("多层光井柱门中央庭宫", "四个不等高房翼围住长中央石庭，西翼长室接柱廊，东翼两层房体内有贯通光井和折返大阶，门柱与楼板保持实际支承", minoanCourtPalace, "建筑", "异域"),
];

function door(name: string, width: number, height: number, depth: number, opening: number, position: Triple, color = stone, openingHeight = 3): ModelPart[] {
  const side = (width - opening) / 2, head = height - openingHeight;
  return [...[-1, 1].map(s => box(`${name}门洞两侧厚壁`, position[0] + s * (opening + side) / 2, position[1] + height / 2, position[2], side, height, depth, color)), box(`${name}门洞上方过梁壁`, position[0], position[1] + height - head / 2, position[2], opening, head, depth, color)];
}
function turn(parts: ModelPart[], yaw: number, position: Triple): ModelPart[] {
  const q = new Quaternion().setFromAxisAngle(new Vector3(0, 1, 0), yaw * Math.PI / 180);
  for (const value of parts) {
    const point = new Vector3(value.position.x, value.position.y, value.position.z).applyQuaternion(q), e = new Euler().setFromQuaternion(q.clone().multiply(new Quaternion().setFromEuler(new Euler(value.rotation.x * Math.PI / 180, value.rotation.y * Math.PI / 180, value.rotation.z * Math.PI / 180))));
    value.position = { x: point.x + position[0], y: point.y + position[1], z: point.z + position[2] }; value.rotation = { x: e.x * 180 / Math.PI, y: e.y * 180 / Math.PI, z: e.z * 180 / Math.PI };
  }
  return parts;
}
function pitched(name: string, width: number, rise: number, depth: number, position: Triple): ModelPart {
  return part(name, "extrude", tile, position, [1, 1, 1], [0, 0, 0], { depth, profile: [{ x: -width / 2, y: 0 }, { x: 0, y: rise }, { x: width / 2, y: 0 }, { x: width / 2, y: -.2 }, { x: 0, y: rise - .2 }, { x: -width / 2, y: -.2 }] });
}
function circle(radius: number, x = 0, z = 0): [number, number][] { return Array.from({ length: 24 }, (_, i) => [x + Math.cos(i * Math.PI / 12) * radius, z + Math.sin(i * Math.PI / 12) * radius]); }
function dome(name: string, radius: number, position: Triple, color = tile): ModelPart[] { return [halfDomeRoof(`${name}前半薄壳`, radius, .3, position, 0, color), halfDomeRoof(`${name}后半薄壳`, radius, .3, position, 180, color)]; }
function stairFlight(name: string, count: number, width: number, rise: number, run: number, baseHeight: number, position: Triple, yaw: number): ModelPart {
  const outline: [number, number][] = [[0, 0]];
  for (let i = 0; i < count; i++) outline.push([i * run, baseHeight + rise * (i + 1) / count], [(i + 1) * run, baseHeight + rise * (i + 1) / count]);
  outline.push([count * run, 0]);
  const value = polygon(name, stone, outline, width); value.rotation.x = -90; value.position.z = width / 2;
  return turn([value], yaw, position)[0]!;
}

export function crossingVault(position: Triple, radius: number, rise: number): ModelPart {
  const steps = 10, stride = steps + 1, layer = stride * stride, vertices: { x: number; y: number; z: number }[] = [], indices: number[] = [];
  for (const lower of [false, true]) for (let z = 0; z <= steps; z++) for (let x = 0; x <= steps; x++) {
    const px = (x / steps * 2 - 1) * radius, pz = (z / steps * 2 - 1) * radius;
    vertices.push({ x: px, y: Math.max(Math.sqrt(Math.max(0, 1 - (px / radius) ** 2)), Math.sqrt(Math.max(0, 1 - (pz / radius) ** 2))) * rise - (lower ? .4 : 0), z: pz });
  }
  for (let z = 0; z < steps; z++) for (let x = 0; x < steps; x++) { const a = z * stride + x, b = a + stride; indices.push(a, b, a + 1, a + 1, b, b + 1, a + layer, a + 1 + layer, b + layer, a + 1 + layer, b + 1 + layer, b + layer); }
  const edge = [...Array.from({ length: steps }, (_, i) => i), ...Array.from({ length: steps }, (_, i) => i * stride + steps), ...Array.from({ length: steps }, (_, i) => layer - 1 - i), ...Array.from({ length: steps }, (_, i) => (steps - i) * stride)];
  for (let i = 0; i < edge.length; i++) { const a = edge[i]!, b = edge[(i + 1) % edge.length]!; indices.push(a, b, a + layer, b, b + layer, a + layer); }
  return part("连续接到四角石墩的交叉薄券", "mesh", brick, position, [1, 1, 1], [0, 0, 0], { vertices, indices });
}

function vaultedEndWall(radius: number, rise: number, position: Triple, yaw: number): ModelPart {
  const outline: [number, number][] = Array.from({ length: 15 }, (_, i) => [Math.cos(Math.PI - i * Math.PI / 14) * radius, Math.sin(i * Math.PI / 14) * rise]), holes: [number, number][][] = [-.5, 0, .5].map(s => { const x = s * radius, h = rise * (s === 0 ? .72 : .55); return [[x - radius * .075, 1], [x + radius * .075, 1], [x + radius * .075, h], [x - radius * .075, h]]; });
  const value = polygon("侧舱或主厅端头实际接顶并穿出高窗的半圆石壁", brick, outline, .65, [0, 0, 0], holes); value.rotation.x = -90; value.position.z = .325;
  return turn([value], yaw, position)[0]!;
}

function raisedVaultBand(position: Triple): ModelPart {
  const outline: [number, number][] = [];
  for (let i = 0; i <= 14; i++) { const x = -9 + i * 18 / 14; outline.push([x, 15.55 + Math.sqrt(Math.max(0, 81 - x * x))]); }
  for (let i = 0; i <= 14; i++) { const x = 9 - i * 18 / 14; outline.push([x, 10.4 + Math.sqrt(Math.max(0, 9.45 ** 2 - x * x))]); }
  const holes: [number, number][][] = [-4.5, 0, 4.5].map(x => [[x - .6, x === 0 ? 21 : 19.7], [x + .6, x === 0 ? 21 : 19.7], [x + .6, x === 0 ? 23.2 : 21.8], [x - .6, x === 0 ? 23.2 : 21.8]]), value = polygon("高交叉券与低横筒券之间实际封合的真高窗带壁", brick, outline, .65, [0, 0, 0], holes); value.rotation.x = -90; value.position.z = .325;
  return turn([value], 90, position)[0]!;
}

function vaultedBasilica(): ModelPart[] {
  const p: ModelPart[] = [base(52, 81), box("巨型公会堂中厅与六横舱完整地坪", 0, .3, 0, 41, .24, 62)];
  for (const z of [-18, 0, 18]) p.push(crossingVault([0, 15.5, z], 9, 9));
  for (const s of [-1, 1]) {
    for (const z of [-27, -9, 9, 27]) p.push(box("高交叉券四角实际落地巨墩", s * 9, 7.96, z, 1.5, 15.08, 2.2), ...door("横舱间可通行的厚横隔壁", 10.7, 10.08, .9, 3, [s * 14.35, .42, z], brick));
    for (const z of [-18, 0, 18]) p.push(...turn([barrelRoof("巨殿两侧垂直主轴的完整横筒券", 9, .45, 10.7, [0, 10.5, 0], brick)], 90, [s * 14.35, 0, z]), raisedVaultBand([s * 9, 0, z]), vaultedEndWall(9.45, 9.45, [s * 19.7, 10.5, z], 90));
    p.push(box("横舱外侧实际封合厚石壁", s * 20.1, 5.46, 0, .8, 10.08, 55));
  }
  p.push(halfRoundFloor("主轴后方半圆公会龛完整石地面", 9, .24, [0, .18, 27], 0, stone), halfRoundWall("公会后龛真实半圆厚壁", 9, .8, 15.08, [0, .42, 27], 0, brick), halfDomeRoof("后龛同中厅相接的大半穹", 9, .4, [0, 15.5, 27], 0, brick), ...door("高公会堂前端真实宽入口", 18, 15.08, 1, 6, [0, .42, -27], brick, 7), box("主入口外连通的低宽门廊屋盖", 0, 7.75, -31, 31, .4, 6));
  p.push(vaultedEndWall(9, 9, [0, 15.5, -27], 0));
  for (const x of [-13, -8, -3, 3, 8, 13]) p.push(cylinder("门廊真正落地高石柱", x, 3.99, -33, .65, 7.14, stone));
  return p;
}

function splitLevelTemple(): ModelPart[] {
  const p: ModelPart[] = [base(34, 38), box("高位前殿完整厚石台", 0, 1.09, -5, 12, 1.82, 10), box("低位后殿完整石地面", 0, .3, 5, 12, .24, 10), ...door("高位前殿中央入口", 12, 6.6, .45, 2, [0, 2, -10]), ...door("高低两殿之间的真门", 12, 6.6, .4, 2, [0, 2, 0]), box("低殿后方完整高厚壁", 0, 4.51, 10, 12, 8.18, .45), box("高低前殿连通石门下方支承", 0, 1.21, 0, 12, 1.58, .4), pitched("高低双殿共用完整双坡石屋盖", 13.2, 2.4, 21.5, [0, 8.8, 0]), box("高位前廊完整石台", 0, 1.09, -13, 13.6, 1.82, 6), stairFlight("主前廊单向连续登台阶", 7, 8.5, 1.82, .35, 0, [0, .18, -18.4], -90)];
  p.push(box("低位侧门前方完整主殿侧壁", -6, 4.51, -4.075, .45, 8.18, 11.85), box("低位侧门后方完整主殿侧壁", -6, 4.51, 7.075, .45, 8.18, 5.85), box("偏置侧门上方实际承顶过梁壁", -6, 6.01, 3, .45, 5.18, 2.3));
  for (const [z, length] of [[-3, 14], [9, 2]]) p.push(box("女柱亭一侧主殿完整外壁", 6, 4.51, z!, .45, 8.18, length!));
  p.push(...turn(door("女柱亭高位侧门", 4, 6.6, .45, 1.6, [0, 2, 0]), 90, [6, 0, 6]), box("侧门下方完整石门槛台", 6, 1.21, 6, .45, 1.58, 4), stairFlight("后殿登向高位前殿的内部真阶", 6, 2, 1.58, .35, 0, [-2.7, .42, 2.1], 90), stairFlight("低后殿通向女柱亭的内部横阶", 6, 1.6, 1.58, .35, 0, [3.8, .42, 6], 0));
  for (const x of [-5, -3, -1, 1, 3, 5]) p.push(cylinder("高前廊连续承檐石柱", x, 5.25, -14.6, .4, 6.5, stone));
  p.push(box("高前廊上方完整承顶石梁", 0, 8.6, -14.6, 12, .2, .6), pitched("主入口高前廊双坡屋盖", 14, 2.4, 6.8, [0, 8.8, -13]));
  for (const z of [-10.2, 10.2]) p.push(part("主殿两端实际接到双坡屋盖的三角山花", "extrude", stone, [0, 8.8, z], [1, 1, 1], [0, 0, 0], { depth: .4, profile: [{ x: -6.6, y: -.2 }, { x: 6.6, y: -.2 }, { x: 0, y: 2.2 }] }));
  for (const s of [-1, 1]) p.push(box("主殿两边墙头实际承住出檐的纵石梁", s * 6, 8.71, 0, .4, .25, 20.5));
  p.push(part("高前柱廊端头由石横梁承住的完整山花", "extrude", stone, [0, 8.8, -14.6], [1, 1, 1], [0, 0, 0], { depth: .4, profile: [{ x: -7, y: -.2 }, { x: 7, y: -.2 }, { x: 0, y: 2.2 }] }));
  p.push(box("偏置低柱廊石铺地坪", -9.8, .3, 3, 8, .24, 9));
  for (const x of [-13, -7]) for (const z of [-.5, 3, 6.5]) p.push(cylinder("低位侧廊真正落地石柱", x, 3.41, z, .4, 5.98, stone));
  p.push(...turn([pitched("偏置低侧廊完整双坡屋盖", 9.5, 1.8, 8.6, [0, 6.6, 0])], 90, [-9.8, 0, 3]));
  for (const x of [-13, -7]) p.push(...turn([part("低侧廊柱头实际承托的三角山花", "extrude", stone, [0, 6.6, 0], [1, 1, 1], [0, 0, 0], { depth: .4, profile: [{ x: -4.75, y: -.2 }, { x: 4.75, y: -.2 }, { x: 0, y: 1.6 }] })], 90, [x, 0, 3]));
  p.push(box("偏置女柱亭完整抬高石台", 9, 1.21, 6, 6, 1.58, 6));
  for (const [x, z] of [[11.5, 3.5], [11.5, 5.16], [11.5, 6.83], [11.5, 8.5], [6.5, 3.5], [6.5, 8.5]]) {
    p.push(part("真正承托亭顶的女像裙身与肩部", "lathe", stone, [x!, 2, z!], [1, 1, 1], [0, 0, 0], { profile: [{ x: 0, y: 0 }, { x: .28, y: 0 }, { x: .25, y: 1.55 }, { x: .18, y: 2.35 }, { x: .32, y: 2.8 }, { x: .15, y: 3 }, { x: 0, y: 3 }] }), part("女像承柱独立头部", "sphere", stone, [x!, 5.2, z!], [.4, .5, .42]), box("女像头上接到屋盖的承重方帽", x!, 5.57, z!, .68, .24, .68));
  }
  p.push(box("六女柱实际共托的石亭屋盖", 9, 5.85, 6, 6.8, .32, 6.8));
  return p;
}

function tuscanTemple(): ModelPart[] {
  const p: ModelPart[] = [base(29, 36), box("三内殿与深前廊共用高石台", 0, 1.08, 0, 21, 1.8, 25), stairFlight("高台正前方唯一宽登台阶", 7, 10, 1.8, .4, 0, [0, .18, -15.3], -90)];
  for (const x of [-7.5, -2.5, 2.5, 7.5]) for (const z of [-10, -5]) p.push(cylinder("深前廊独立木石承顶柱", x, 5.08, z, .58, 6.2, wood), box("前廊柱头宽木枋", x, 8.28, z, .9, .2, .9, wood));
  for (const x of [-6, 0, 6]) p.push(...door("三座内殿各自朝前廊的真门", 6, 6.4, .35, 1.8, [x, 1.98, .2], brick));
  for (const x of [-9, -3, 3, 9]) p.push(box("并排内殿侧边与内部完整分隔厚壁", x, 5.18, 6, .4, 6.4, 12, brick));
  p.push(box("后三内殿统一完整后壁", 0, 5.18, 12, 18.4, 6.4, .4, brick), pitched("高台神庙宽大出檐双坡木屋盖", 23, 3.2, 27.5, [0, 8.58, 0]));
  for (const z of [-10, -5, .2, 12]) p.push(box("柱廊与殿壁上方横向承顶长木梁", 0, 8.43, z, 19, .3, .5, wood));
  for (const s of [-1, 1]) p.push(box("侧边长木梁实际接到屋面下缘", s * 9, 8.78, 0, .5, .8, 24, wood));
  for (const z of [-10, 12]) for (const s of [-1, 1]) p.push(beam("宽跨柱廊内部真正承托屋盖的斜木椽", wood, [s * 11.5, 8.38, z], [0, 11.58, z], .25));
  for (const z of [-12.3, 12.3]) p.push(part("前后屋端真实三角山花填壁", "extrude", brick, [0, 8.58, z], [1, 1, 1], [0, 0, 0], { depth: .35, profile: [{ x: -11.5, y: -.2 }, { x: 11.5, y: -.2 }, { x: 0, y: 3 }] }));
  return p;
}

function horseshoe(position: Triple): ModelPart {
  const radius = 1.81, profile: { x: number; y: number }[] = [];
  for (const [r, reverse] of [[radius + .18, false], [radius, true]] as const) for (let i = 0; i <= 14; i++) { const angle = (200 - (reverse ? 14 - i : i) * 220 / 14) * Math.PI / 180; profile.push({ x: Math.cos(angle) * r, y: Math.sin(angle) * r }); }
  return part("矮柱间下层真正超过半圆的马蹄拱", "extrude", red, position, [1, 1, 1], [0, 90, 0], { depth: .4, profile });
}
function upperArcade(position: Triple): ModelPart {
  const profile = [{ x: -2, y: 0 }, { x: -2, y: 5.4 }, { x: 2, y: 5.4 }, { x: 2, y: 0 }, { x: 1.7, y: 0 }, { x: 1.7, y: 3 }];
  for (let i = 1; i <= 12; i++) { const a = i * Math.PI / 12; profile.push({ x: Math.cos(a) * 1.7, y: 3 + Math.sin(a) * 1.7 }); }
  profile.push({ x: -1.7, y: 0 }); return part("上层半圆拱与平直承顶壁合为真实透空拱墙", "extrude", stone, position, [1, 1, 1], [0, 90, 0], { depth: .4, profile });
}
function doubleArcadePrayerCourt(): ModelPart[] {
  const p: ModelPart[] = [base(27, 45), box("柱网祈祷厅与前庭共用完整地坪", 0, .3, 0, 20.8, .24, 36.8)];
  for (const x of [-6, -2, 2, 6]) for (const z of [0, 4, 8, 12, 16]) p.push(cylinder("双层拱墙下方独立矮石柱", x, 1.11, z, .38, 1.38, stone), box("矮柱上宽承拱柱头", x, 1.9, z, .62, .2, .62));
  for (const x of [-6, -2, 2, 6]) for (const z of [2, 6, 10, 14]) p.push(horseshoe([x, 2 - Math.sin(200 * Math.PI / 180) * 1.81, z]), upperArcade([x, 2, z]));
  p.push(box("纵向拱墙真正共同承住的平土木屋盖", 0, 7.57, 7.5, 20.8, .34, 21.8), ...door("后龛前真实穿壁口", 20, 6.98, .5, 2, [0, .42, 18]), halfRoundWall("背壁外侧真正凹出的礼仪小龛", 1.1, .25, 3.3, [0, .42, 18], 0, stone), halfDomeRoof("后龛连续半圆薄顶", 1.1, .2, [0, 3.72, 18], 0, tile), halfRoundFloor("后龛独立半圆石地坪", 1.1, .24, [0, .18, 18], 0, stone));
  for (const s of [-1, 1]) p.push(box("祈祷厅实际外侧高墙", s * 10, 3.91, 7.5, .5, 6.98, 21), box("前庭两边实际低围壁", s * 10, 2.02, -10.5, .5, 3.2, 15));
  p.push(...door("前庭中央真实外门", 20, 3.2, .5, 2.6, [0, .42, -18], stone, 2.7));
  return p;
}

function mudButtressMosque(): ModelPart[] {
  const p: ModelPart[] = [base(47, 53), box("整座土构祈祷院统一抬高防水石台", 0, .48, -2, 39, .6, 41), stairFlight("前庭高台外侧宽登台阶", 3, 8, .6, .4, 0, [0, .18, -23.7], -90)];
  for (const x of [-12, 0, 12]) p.push(...door("土祈祷厅前端三处独立入口", 12, 8.4, .8, 2.6, [x, .78, -4], earth));
  for (const s of [-1, 1]) p.push(box("厚土祈祷厅完整侧壁", s * 18, 4.98, 6, .8, 8.4, 20, earth), box("露天前院连续土围壁", s * 18, 2.38, -13, .8, 3.2, 18, earth));
  p.push(...door("面向前庭的外门", 36, 3.2, .8, 3, [0, .78, -22], earth, 2.7), ...door("后壁中央真实浅龛开口", 36, 8.4, .8, 1.8, [0, .78, 16], earth), halfRoundWall("中央附壁体内真正凹出的小龛", 1.1, .3, 3.3, [0, .78, 16], 0, earth), box("小龛上方实际连接高附壁体的平顶", 0, 4.15, 16.6, 2.2, .14, 1.4, earth), box("密墩上真正连续平铺的厚土木屋盖", 0, 9.4, 6, 37, .44, 21, earth));
  for (const x of [-12, -4, 4, 12]) for (const z of [0, 6, 12]) p.push(part("平土屋盖下上收的实际厚土承墩", "extrude", earth, [x, .78, z], [1, 1, 1], [0, 0, 0], { depth: 1.3, profile: [{ x: -.8, y: 0 }, { x: .8, y: 0 }, { x: .5, y: 8.4 }, { x: -.5, y: 8.4 }] }));
  for (const x of [-14, 0, 14]) {
    const h = x === 0 ? 14.6 : 12;
    if (x === 0) {
      p.push(...[-1, 1].map(s => box("中央高附壁体在真龛两旁的落地厚壁", s * 1.5, 2.43, 16.7, 1, 3.3, 2.6, earth)), box("中央高附壁体在真龛后方的厚壁", 0, 2.43, 17.85, 4, 3.3, .3, earth), part("真龛上方连续收分的高附壁体", "extrude", earth, [0, 4.08, 16.7], [1, 1, 1], [0, 0, 0], { depth: 2.6, profile: [{ x: -1.75, y: 0 }, { x: 1.75, y: 0 }, { x: .9, y: h - 3.3 }, { x: -.9, y: h - 3.3 }] }));
    } else p.push(part("与厚后壁连成一体的高收分附壁体", "extrude", earth, [x, .78, 16.7], [1, 1, 1], [0, 0, 0], { depth: 2.6, profile: [{ x: -2, y: 0 }, { x: 2, y: 0 }, { x: .9, y: h }, { x: -.9, y: h }] }));
    for (const y of [3, 6, 9]) p.push(box("嵌入厚土壁并向外出挑的真实木榫束", x, y + .78, 18.1, .2, .16, 1.5, wood));
  }
  for (const x of [-16, -10, -6, 6, 10, 16]) p.push(part("高墙之间从地面收向墙头的土扶壁", "extrude", earth, [x, .78, 17.3], [1, 1, 1], [0, 90, 0], { depth: .7, profile: [{ x: -1.4, y: 0 }, { x: 1, y: 0 }, { x: .4, y: 9.7 }, { x: -.4, y: 9.7 }] }));
  return p;
}

export function ellipseWall(name: string, rx: number, rz: number, thickness: number, height: number, start: number, span: number, color = stone): ModelPart {
  const count = Math.ceil(span / 10) + 1, vertices: { x: number; y: number; z: number }[] = [], indices: number[] = [], layers = [[rx, rz, .18], [rx - .65, rz - .45, .18 + height], [rx - thickness, rz - thickness, .18], [rx - thickness + .3, rz - thickness + .3, .18 + height]];
  for (const [a, b, reverse] of [[0, 1, false], [2, 3, true], [0, 2, true], [1, 3, false]] as const) {
    const offset = vertices.length;
    for (const index of [a, b]) for (let i = 0; i < count; i++) { const angle = (start + span * i / (count - 1)) * Math.PI / 180, layer = layers[index]!; vertices.push({ x: Math.cos(angle) * layer[0]!, y: layer[2]!, z: Math.sin(angle) * layer[1]! }); }
    for (let i = 0; i < count - 1; i++) { const a = offset + i, b = a + count, c = a + 1, d = b + 1; indices.push(...(reverse ? [a, c, b, c, d, b] : [a, b, c, c, b, d])); }
  }
  for (const [angle, order] of [[start, [0, 2, 3, 1]], [start + span, [0, 1, 3, 2]]] as const) { const offset = vertices.length, a = angle * Math.PI / 180; for (const index of order) { const layer = layers[index]!; vertices.push({ x: Math.cos(a) * layer[0]!, y: layer[2]!, z: Math.sin(a) * layer[1]! }); } indices.push(offset, offset + 1, offset + 2, offset, offset + 2, offset + 3); }
  return part(name, "mesh", color, [0, 0, 0], [1, 1, 1], [0, 0, 0], { vertices, indices });
}
function greatEnclosure(): ModelPart[] {
  const p: ModelPart[] = [base(60, 50), ellipseWall("带真实窄入口的收分椭圆外石壁", 25, 19, 1.9, 9, -86, 352), ellipseWall("与外壁形成独立平行通道的内曲墙", 21, 15.2, 1.3, 6.8, -58, 222), part("狭长通道尽端独立实心圆锥石塔", "lathe", stone, [10.7, .18, -8.6], [1, 1, 1], [0, 0, 0], { profile: [{ x: 0, y: 0 }, { x: 2.6, y: 0 }, { x: 2.4, y: 2.5 }, { x: 1.6, y: 7 }, { x: .8, y: 10 }, { x: 0, y: 10 }] }), box("窄外门连接内部平行曲道的石铺路", 0, .28, -17.2, 2.5, .2, 5)];
  for (const [x, z, radius, yaw, span] of [[-9, -5, 6, 140, 220], [-7, 6, 5, -15, 210], [6, 6, 5.6, -100, 190]]) p.push(halfRoundWall("大围场内另行分开的低位弧形石院壁", radius!, .65, 2.1, [x!, .18, z!], yaw!, stone, span! * Math.PI / 180));
  return p;
}

function chavinTemple(): ModelPart[] {
  const plaza: [number, number][] = [[-16, -16], [16, -16], [16, 8], [-16, 8]], p: ModelPart[] = [base(64, 59), polygon("圆形祭场外完整高石铺广场", stone, plaza, 2.02, [0, .18, 0], [circle(7.2, 0, -4)]), cylinder("下沉圆祭场完整低位石铺地坪", 0, .3, -4, 14.4, .24, stone)];
  for (const yaw of [80, -100]) p.push(halfRoundWall("留出双向真阶道的圆祭场厚边壁", 7.2, .4, 1.78, [0, .42, -4], yaw, stone, 160 * Math.PI / 180));
  p.push(stairFlight("圆祭场前方接入高广场的完整石阶", 8, 2.3, 1.78, .3, 0, [0, .42, -8.8], 90), stairFlight("圆祭场后方接入高广场的完整石阶", 8, 2.3, 1.78, .3, 0, [0, .42, .8], -90));
  for (const s of [-1, 1]) {
    p.push(box("U形侧翼外边完整厚岩石壁", s * 28, 4.91, 4, 1, 9.46, 32), box("U形侧翼朝向凹祭场的厚石壁", s * 16, 4.91, 4, 1, 9.46, 32), box("侧翼内部可通行石铺廊地面", s * 22, .3, 4, 11, .24, 32), box("厚高台侧翼实际覆盖内廊的顶石", s * 22, 9.9, 4, 13, .52, 32), ...door("侧翼前端真实廊道入口", 12, 9.46, 1, 2.4, [s * 22, .18, -12], brick), box("侧翼后端完整石壁", s * 22, 4.91, 20, 12, 9.46, 1));
    for (const z of [-4, 8]) p.push(...door("侧翼内部折行石廊分隔真门", 11, 9.2, .7, 2.2, [s * 22, .42, z], brick));
    p.push(stairFlight("中央真廊门两旁的高台登顶石阶", 18, 2.7, 7.96, .4, 2.02, [s * 10, .18, .3], -90));
  }
  p.push(...door("U形后殿正面中央真实内廊入口", 32, 9.46, 1, 2.4, [0, .18, 8], brick), box("U形后殿完整后厚石壁", 0, 4.91, 20, 32, 9.46, 1, brick), box("后殿内部完整长廊石铺地面", 0, .3, 14, 32, .24, 12), box("后殿长廊实际覆盖的厚顶石", 0, 9.9, 14, 32, .52, 13), box("内廊纵向折行隔壁", 5.5, 4.91, 14, .7, 9.46, 7, brick), box("同折行壁留出转弯通路的横石壁", -3, 4.91, 15.7, 9, 9.46, .7, brick));
  return p;
}

function firuzabadPalace(): ModelPart[] {
  const p: ModelPart[] = [base(46, 88), box("前伊万与三穹室共用石铺地面", 0, .3, -16, 37, .24, 35), ...[-1, 1].map(s => box("前伊万从地面直接承高券的厚侧壁", s * 5.5, 4.4, -22, 1, 7.96, 22, brick)), barrelRoof("宫前正面敞开的高伊万筒券", 5, .5, 22, [0, 8.38, -22], brick)];
  for (const x of [-12, 0, 12]) {
    p.push(...door("横列穹室前方各自真实通门", 12, 7.96, .6, x === 0 ? 9.8 : 2.2, [x, .42, -11], brick, x === 0 ? 7 : 3), ...door("横列穹室通往后内庭的真门", 12, 7.96, .6, 2.6, [x, .42, 1], brick), polygon("各方穹室四角真正承顶的厚角板", brick, [[-6, -6], [6, -6], [6, 6], [-6, 6]], .3, [x, 8.38, -5], [circle(5.55)]), ...dome("横列方厅上完整大穹顶", 5.9, [x, 8.68, -5], brick));
  }
  for (const s of [-1, 1]) {
    p.push(box("穹室最外侧连续厚围壁", s * 18, 4.4, -5, .7, 7.96, 12, brick), ...turn(door("三穹室之间真实横向连通门", 12, 7.96, .7, 2.3, [0, .42, 0], brick), 90, [s * 6, 0, -5]), box("内庭长房翼外侧完整厚壁", s * 18, 4.4, 20.5, .7, 7.96, 39, brick), box("内庭两边房翼完整石地坪", s * 15, .3, 20.5, 6, .24, 39), box("长房翼实际覆盖房间的完整平屋盖", s * 15, 8.55, 20.5, 6.7, .34, 39, brick));
    for (const z of [7, 19, 31]) p.push(...turn(door("长房翼朝内庭各自真实房门", 12, 7.96, .5, 2.1, [0, .42, 0], brick), 90, [s * 12, 0, z]));
    for (const z of [13, 25]) p.push(box("侧房间实际分隔厚壁", s * 15, 4.4, z, 6, 7.96, .45, brick));
  }
  p.push(...door("后横房朝向内庭的实际入口", 36, 7.96, .6, 3, [0, .42, 35], brick), box("宫后完整横向外厚壁", 0, 4.4, 40, 36.7, 7.96, .7, brick), box("后横房完整平石屋盖", 0, 8.55, 37.5, 36.7, .34, 5.7, brick), box("后横房接平其他宫室的完整地面", 0, .3, 37.5, 36, .24, 5), box("长内庭完整石铺地面", 0, .3, 18, 24, .24, 34));
  return p;
}

function catenaryVault(name: string, depth: number, position: Triple, filled = false): ModelPart {
  const profile: { x: number; y: number }[] = [], height = (w: number, a: number, x: number) => a * (Math.cosh(w / a) - Math.cosh(x / a));
  for (let i = 0; i <= 14; i++) { const x = -14 + i * 2; profile.push({ x, y: height(14, 5.7, x) }); }
  if (!filled) for (let i = 0; i <= 14; i++) { const x = 13 - i * 26 / 14; profile.push({ x, y: height(13, 5.3, x) }); }
  return part(name, "extrude", brick, position, [1, 1, 1], [0, 0, 0], { depth, profile });
}
function catenaryAudiencePalace(): ModelPart[] {
  const p: ModelPart[] = [base(79, 61), box("大觐见厅完整石铺地坪", 0, .3, 6, 28, .24, 44), catenaryVault("从地面连续升起的高悬链空筒券", 44, [0, .42, 6]), catenaryVault("同大筒券轮廓连接的完整后端厚壁", .8, [0, .42, 28], true)];
  for (const s of [-1, 1]) {
    p.push(box("觐见宫侧翼内边完整厚围壁", s * 14.4, 9.21, 5, .8, 17.58, 42, brick), box("觐见宫侧翼外边厚围壁", s * 33, 9.21, 5, 1, 17.58, 42, brick), box("两侧宫翼完整地面", s * 23.7, .3, 5, 19, .24, 42), ...door("宫翼正面真正独立高入口", 19, 17.58, .8, 3.2, [s * 23.7, .42, -16], brick, 5), box("宫翼后端完整厚石壁", s * 23.7, 9.21, 26, 19.4, 17.58, .8, brick), box("宫翼完整高平石屋盖", s * 23.7, 18.25, 5, 19.4, .5, 42, brick));
    for (const z of [-2, 12]) p.push(...door("宫翼内部可连续通行的厚分室壁", 18, 17.58, .6, 2.5, [s * 23.7, .42, z], brick));
    for (const x of [-6, 0, 6]) for (const y of [6.1, 12.1]) p.push(barrelRoof("宫翼立面向厚后壁凹入的真实短券", 1.5, .3, .7, [s * 23.7 + x, y, -16.7], brick), ...[-1, 1].map(edge => box("深凹券两旁实际接承的竖直壁墩", s * 23.7 + x + edge * 1.65, y - 1.8, -16.7, .3, 3.6, .7, brick)));
    const height = (x: number) => 5.7 * (Math.cosh(14 / 5.7) - Math.cosh(x / 5.7)), start = 5.7 * Math.acosh(Math.cosh(14 / 5.7) - 18 / 5.7), profile = [{ x: s * 14, y: 0 }, { x: s * 14, y: 18 }, { x: s * start, y: 18 }];
    for (let i = 1; i < 8; i++) { const x = start + (14 - start) * i / 8; profile.push({ x: s * x, y: height(x) }); }
    p.push(part("大券外侧与双翼相接的真实曲边厚券肩", "extrude", brick, [0, .42, -16], [1, 1, 1], [0, 0, 0], { depth: 1, profile }));
  }
  return p;
}

function minoanColumn(x: number, z: number, y: number, height: number): ModelPart {
  return part("上粗下细并含宽柱帽的实际承重木柱", "lathe", red, [x, y, z], [1, 1, 1], [0, 0, 0], { profile: [{ x: 0, y: 0 }, { x: .25, y: 0 }, { x: .27, y: .22 }, { x: .42, y: height - .25 }, { x: .58, y: height - .22 }, { x: .58, y: height }, { x: 0, y: height }] });
}
function minoanCourtPalace(): ModelPart[] {
  const east: [number, number][] = [[10, -24], [26, -24], [26, 24], [10, 24]], stairHole: [number, number][] = [[13, -17], [19, -17], [19, -7], [13, -7]], lightHole: [number, number][] = [[20, 2], [24.5, 2], [24.5, 11], [20, 11]], p: ModelPart[] = [base(67, 68), box("四房翼之间连续长中央石庭", 0, .3, 0, 20, .24, 36), box("西翼房室与柱廊共同完整地坪", -17.5, .3, 0, 15, .24, 48), box("东翼两层房体共同完整地坪", 18, .3, 0, 16, .24, 48), polygon("东翼上层真实保留大阶和光井的楼板", wood, east, .3, [0, 4.7, 0], [stairHole, lightHole]), polygon("东翼屋盖让两处光井直通天空", tile, east, .3, [0, 9.3, 0], [stairHole, lightHole]), box("东翼外侧从地面贯通到屋盖的厚石壁", 26, 4.86, 0, .55, 8.88, 48, brick), box("西翼最外边连续厚石壁", -25, 2.66, 0, .55, 4.48, 48, brick), box("西翼长室实际覆盖的平屋盖", -19, 5.08, 0, 12, .36, 48, tile), box("西翼柱廊上方连续窄平屋盖", -11.5, 5.08, 0, 3.6, .36, 48, tile)];
  for (const z of [-18, -6, 6, 18]) {
    p.push(...turn(door("西翼储藏长室朝柱廊的真门", 12, 4.48, .45, 1.6, [0, .42, 0], brick), 90, [-13, 0, z]), ...turn(door("东翼底层房室朝中央庭的真门", 12, 4.28, .45, 2, [0, .42, 0], brick), 90, [10, 0, z]));
  }
  for (const z of [-24, -12, 0, 12, 24]) p.push(box("西翼各长室之间实际厚石分隔", -19, 2.66, z, 12, 4.48, .4, brick));
  for (const z of [-24, 0, 14, 24]) p.push(box("东翼底层房室真实石隔壁", 18, 2.56, z, 16, 4.28, .4, brick));
  for (const x of [11.4, 24.6]) for (const z of [-21, -3, 13, 21]) p.push(minoanColumn(x, z, .42, 4.28), minoanColumn(x, z, 5, 4.3));
  for (const z of [-20, -10, 0, 10, 20]) p.push(minoanColumn(-10.5, z, .42, 4.48));
  p.push(box("东翼上廊朝中央庭的低防护墙", 10.3, 5.55, 0, .25, 1.1, 48, brick), stairFlight("光井中由下层登向中间转台的大阶", 12, 2.1, 2.29, .4, 0, [14.3, .42, -17], -90), box("折返大阶中间完整转向石台", 16, 2.56, -12, 5.7, .3, 1.4), stairFlight("中间转台折返接到上层的完整大阶", 12, 2.1, 2.29, .4, 2.29, [17.6, .42, -12.1], 90), box("大阶上端真实接到楼板的短平台", 16, 4.85, -16.9, 5.7, .3, 1));
  p.push(box("北横翼完整石铺地面", 0, .3, -24.5, 50, .24, 13), ...door("北横翼进入中央庭的偏置真门", 50, 5.6, .5, 2.8, [0, .42, -18], brick), ...door("北横翼外侧实际贯通的大门", 50, 5.6, .5, 3, [0, .42, -31], brick), box("北横翼实际覆盖的完整平屋盖", 0, 6.2, -24.5, 50.6, .36, 13.6, tile));
  for (const s of [-1, 1]) p.push(box("北横翼两端完整封合石壁", s * 25, 3.22, -24.5, .55, 5.6, 13, brick));
  p.push(box("南翼开放柱门厅完整地坪", 0, .3, 24, 39, .24, 12), box("南翼后方完整厚外石壁", 0, 2.66, 30, 39, 4.48, .5, brick), box("南翼柱门厅真正完整平屋盖", 0, 5.08, 24, 39.6, .36, 12.6, tile));
  for (const x of [-17, -9, 0, 9, 17]) p.push(minoanColumn(x, 18.5, .42, 4.48));
  for (const s of [-1, 1]) p.push(box("南翼两端接到房翼的厚侧壁", s * 19.5, 2.66, 24, .5, 4.48, 12, brick));
  return p;
}
