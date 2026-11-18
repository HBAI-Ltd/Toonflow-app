import { part, beam, ring, type ModelPart, type Triple } from "../assetModelParts";
import { slopeRoofs } from "../roofRegistry";
import { box, cylinder, design } from "./structures";
import { halfRoundWall } from "./spatialShells";
import { polygon } from "../masterNature/shared";

const stone = "#aba897", wood = "#8e7150", earth = "#9d8b6c", thatch = "#a69970", turf = "#78846b", lime = "#d5d0bd";

// 类型依据为公开保护机构的构造描述；顶点、尺寸与装配均在本地原创，不含远端模型。
// https://whc.unesco.org/en/list/787/
// https://www.historicenvironment.scot/visit/all/blackhouse-arnol/history-and-stories/
// https://www.nts.org.uk/stories/from-the-edge-of-the-world-2021-part-6
// https://www.nps.gov/places/eisenhower-bank-barn.htm
export const vernacularWorldBatchOneDesigns = [
  design("方室角承干砌锥顶石舍", "方形厚壁内室以四角短斜承过渡到双皮锥顶，石片叠成防雨外坡，低入口和侧窗贯通内室", trulloHouse, "建筑", "欧式"),
  design("椭圆低墙茅锥共居屋", "椭圆矮石墙承住厚茅锥盖，内部低隔墙区分火塘起居与畜栏，畜栏上架半层干草阁板", pallozaHouse, "建筑", "欧式"),
  design("双壁石绳压茅人畜共屋", "圆角双皮石墙夹土，窄长无烟囱空间共用起居火塘和低畜区；低四坡厚茅顶以过脊绳和垂石固定，围护和内部地坪均保留", blackhouse, "建筑", "欧式"),
  design("透缝叠石覆草贮藏室", "短小长室的厚干石侧壁错缝留通风孔，内收上层石条承接石板顶和覆草帽，狭窄入口直通空贮藏室", cleitStore, "建筑", "欧式"),
  design("双壳壁内盘梯石居塔", "向上收分的外石壳与独立内壳夹出壁内通道，窄入口贯通两壳，楼梯在环隙内升至上廊", brochDwelling, "建筑", "欧式"),
  design("连续叉曲柱承屋打谷仓", "三榀整根叉曲木柱从石脚跨至屋脊，低围板位于承屋柱外，中央打谷道两端开大门，左右为干草贮位", cruckBarn, "建筑", "欧式"),
  design("双列内柱三通道谷仓", "高中央通道由两列内柱和横系梁承担大屋盖，左右低侧廊分隔贮谷，中央大门与低侧墙独立，整仓具有可通行内室", aisledBarn, "建筑", "欧式"),
  design("坡桥进仓悬廊畜棚谷仓", "上层干草和车道由后方土坡桥进入，下层石墙畜棚从前方进出；上仓外挑成前畜棚遮檐，两个交通高度都是真实空间", bankBarn, "建筑", "欧式"),
  design("蘑菇石帽透棂架空粮仓", "六石柱和外挑防鼠石帽支起窄长通风粮室，侧壁透棂而非黑色纹样；端门与独立短梯间留防鼠断口", horreoGranary, "建筑", "欧式"),
  design("四导柱插销升降茅盖草棚", "四根通高木导柱穿过四坡草盖承框，木销在贯通柱孔中定位，草垛四周敞开通风", hayBarrack, "建筑", "欧式"),
];

export function slopePanel(name: string, top: Triple[], thickness: number, color: string): ModelPart {
  const area = top.reduce((sum, p, i) => { const q = top[(i + 1) % top.length]!; return sum + p[0] * q[2] - q[0] * p[2]; }, 0);
  const ordered = area > 0 ? [...top].reverse() : top;
  const bottom = ordered.map(([x, y, z]) => [x, y - thickness, z] as Triple);
  const faces: Triple[][] = [ordered, [...bottom].reverse()];
  for (let i = 0; i < ordered.length; i++) { const j = (i + 1) % ordered.length; faces.push([ordered[i]!, bottom[i]!, bottom[j]!, ordered[j]!]); }
  const vertices: { x: number; y: number; z: number }[] = [], indices: number[] = [];
  for (const face of faces) { const offset = vertices.length; vertices.push(...face.map(([x, y, z]) => ({ x, y, z }))); for (let i = 1; i < face.length - 1; i++) indices.push(offset, offset + i, offset + i + 1); }
  return part(name, "mesh", color, [0, 0, 0], [1, 1, 1], [0, 0, 0], { vertices, indices });
}

export function doorWall(name: string, x: number, z: number, width: number, height: number, thickness: number, doorWidth: number, doorHeight: number, color: string, floor = 0): ModelPart[] {
  return [-1, 1].map(side => box(`${name}洞旁墙`, x + side * (width + doorWidth) / 4, floor + height / 2, z, (width - doorWidth) / 2, height, thickness, color)).concat(box(`${name}门洞上楣`, x, floor + (height + doorHeight) / 2, z, doorWidth, height - doorHeight, thickness, color));
}

export function gableCover(name: string, width: number, length: number, eave: number, rise: number, color: string, centerX = 0, centerZ = 0): ModelPart[] {
  const panels = [-1, 1].map(side => slopePanel(name, [[centerX + side * width / 2, eave, centerZ - length / 2], [centerX, eave + rise, centerZ - length / 2], [centerX, eave + rise, centerZ + length / 2], [centerX + side * width / 2, eave, centerZ + length / 2]], .16, color));
  const spec = { width, length, eave, rise, centerX, centerZ, color };
  for (const panel of panels) slopeRoofs.set(panel, spec);
  return panels;
}

function trulloHouse(): ModelPart[] {
  const p: ModelPart[] = [box("方形内室完整石地台", 0, .1, 0, 5.4, .2, 5.4, stone), ...doorWall("厚石前立面", 0, -2.4, 5.2, 2.55, .6, 1.05, 1.85, lime, .2), box("方室后墙", 0, 1.475, 2.4, 5.2, 2.55, .6, lime), box("无窗侧厚墙", -2.4, 1.475, 0, .6, 2.55, 4.2, lime), box("窗下侧厚墙", 2.4, .8, 0, .6, 1.2, 4.2, lime), box("窗上侧厚墙", 2.4, 2.4, 0, .6, .7, 4.2, lime)];
  for (const side of [-1, 1]) p.push(box("小窗两端厚石壁", 2.4, 1.725, side * 1.25, .6, .65, 1.7, lime));
  for (const x of [-1, 1]) for (const z of [-1, 1]) p.push(beam("方室四角过渡短斜角承", stone, [x * 2.13, 2.68, z * 1.2], [x * 1.2, 2.68, z * 2.13], .24, .5));
  const profile = [{ x: 3.12, y: 2.7 }, { x: 3.12, y: 2.85 }];
  for (let i = 1; i <= 7; i++) { const radius = 3.12 - i * .405, y = 2.85 + i * .36; profile.push({ x: radius + .065, y }, { x: radius, y }); }
  profile.push({ x: 0, y: 5.56 }, { x: 0, y: 5.29 }, { x: 2.72, y: 2.7 }, { x: 3.12, y: 2.7 });
  p.push(part("石片叠涩外锥和连续内穹的真实双皮厚屋壳", "lathe", stone, [0, 0, 0], [1, 1, 1], [0, 0, 0], { profile }), cylinder("屋尖稳压石座", 0, 5.6, 0, .32, .18, lime), part("锥顶小石尖", "sphere", lime, [0, 5.79, 0], [.24, .26, .24]), box("内室石坐台", -1.5, .42, 1.3, .75, .44, 1.6, stone));
  return p;
}

function pallozaHouse(): ModelPart[] {
  const p: ModelPart[] = [cylinder("椭圆内室连贯落地石坪", 0, .1, 0, 8.4, .2, stone)]; p[0]!.scale.z = 6.4;
  for (let i = 0; i < 20; i++) {
    if (i === 14 || i === 15) continue;
    const a = i * Math.PI / 10, b = (i + 1) * Math.PI / 10;
    const x0 = Math.cos(a) * 4, z0 = Math.sin(a) * 3, x1 = Math.cos(b) * 4, z1 = Math.sin(b) * 3;
    p.push(part("沿椭圆接续的低厚石墙", "box", stone, [(x0 + x1) / 2, 1.16, (z0 + z1) / 2], [.5, 1.92, Math.hypot(x1 - x0, z1 - z0) + .07], [0, Math.atan2(x1 - x0, z1 - z0) * 180 / Math.PI, 0]));
  }
  p.push(box("南侧低门上石楣", 0, 2.03, -2.98, 2.55, .2, .5, stone), part("内外连续且底部敞开的椭圆厚茅锥盖", "lathe", thatch, [0, 0, 0], [1, 1, .76], [0, 0, 0], { profile: [{ x: 4.46, y: 1.97 }, { x: 3.1, y: 3.8 }, { x: .18, y: 5.75 }, { x: 0, y: 5.78 }, { x: 0, y: 5.53 }, { x: 2.95, y: 3.59 }, { x: 4.17, y: 1.97 }, { x: 4.46, y: 1.97 }] }), ...doorWall("起居和畜栏间不过顶隔墙", 0, .8, 6.9, 1.65, .16, .85, 1.5, wood, .2), box("后畜区上方半层干草阁板", 0, 2.05, 1.75, 5.2, .15, 1.8, wood), box("火塘不燃石床", -1.4, .26, -.7, 1.2, .12, 1, stone), cylinder("屋顶中央承重点木柱", 0, 2.74, .6, .2, 5.08, wood));
  for (const side of [-1, 1]) p.push(beam("通到阁板的木梯边杆", wood, [2.4 + side * .3, .2, .5], [2.4 + side * .3, 2.1, 1.4], .08));
  for (let i = 0; i < 5; i++) p.push(box("干草阁木梯踏档", 2.4, .45 + i * .36, .62 + i * .17, .65, .07, .08, wood));
  return p;
}

function blackhouse(): ModelPart[] {
  const p: ModelPart[] = [box("人畜共屋连续落地基坪", 0, .09, 0, 5.3, .18, 14.5, stone)];
  for (const [x, t, color] of [[1.91, .3, stone], [2.19, .3, earth], [2.48, .28, stone]] as const) {
    p.push(box("无窗长墙内外石皮与土芯", x, 1.1, 0, t, 1.84, 9.2, color), box("低门前方墙皮与土芯", -x, 1.1, -3.2, t, 1.84, 2.8, color), box("低门后方墙皮与土芯", -x, 1.1, 2.1, t, 1.84, 5, color), box("低门上方连续石楣与土芯", -x, 1.93, -1.3, t, .18, 1, color));
  }
  for (const end of [-1, 1]) { const wall = halfRoundWall("圆角端部双厚石墙", 2.62, .85, 1.84, [0, .18, end * 4.6], end < 0 ? 180 : 0, stone); p.push(wall); }
  for (const side of [-1, 1]) p.push(slopePanel("低缓厚茅主坡", [[side * 2.25, 2.14, -4.6], [0, 3.42, -3.2], [0, 3.42, 3.2], [side * 2.25, 2.14, 4.6]], .22, thatch));
  for (const end of [-1, 1]) for (let i = 0; i < 6; i++) { const a = i * Math.PI / 6, b = (i + 1) * Math.PI / 6; p.push(slopePanel("顺圆角端墙收拢的厚茅髋坡", [[Math.cos(a) * 2.25, 2.14, end * (4.6 + Math.sin(a) * 2.25)], [Math.cos(b) * 2.25, 2.14, end * (4.6 + Math.sin(b) * 2.25)], [0, 3.42, end * 3.2]], .22, thatch)); }
  p.push(box("起居火塘石底", 0, .24, -2.5, 1.2, .12, 1, stone), box("后半畜区较低泥土地坪", 0, .2, 2.4, 3.55, .04, 3.6, earth), box("起居畜区分界石槛", 0, .3, .3, 3.55, .24, .18, stone));
  for (const z of [-2.7, -.9, .9, 2.7]) for (const side of [-1, 1]) p.push(beam("过脊压茅拉绳", "#77715e", [0, 3.48, z], [side * 2.4, 1.85, z], .035), part("压绳垂挂石坠", "sphere", stone, [side * 2.4, 1.77, z], [.22, .27, .2]));
  return p;
}

function cleitStore(): ModelPart[] {
  const p: ModelPart[] = [box("窄贮室平整石底", 0, .09, 0, 2.7, .18, 4.8, stone)];
  for (const side of [-1, 1]) for (let row = 0; row < 4; row++) for (let col = 0; col < 5; col++) p.push(box("错位留风缝的厚干砌边石", side * (1.12 - row * .075), .38 + row * .41, -1.83 + col * .9 + (row % 2 ? .12 : 0), .49, .35, .77, stone));
  p.push(box("贮室后壁", 0, .92, 2.15, 2.05, 1.48, .4, stone), ...doorWall("无门扇窄入口", 0, -2.15, 2.45, 1.48, .4, .66, 1.23, stone, .18));
  for (let i = 0; i < 5; i++) p.push(box("两侧内收顶石上的跨室大石板", 0, 1.83, -1.8 + i * .9, 2.23, .28, .94, stone));
  p.push(slopePanel("覆土草帽前缓坡", [[-1.38, 1.88, -2.42], [1.38, 1.88, -2.42], [1.1, 2.2, -1.75], [-1.1, 2.2, -1.75]], .16, turf), box("连续厚覆草顶帽", 0, 2.12, .15, 2.45, .28, 3.8, turf), slopePanel("覆土草帽后缓坡", [[-1.1, 2.2, 2.05], [1.1, 2.2, 2.05], [1.38, 1.88, 2.42], [-1.38, 1.88, 2.42]], .16, turf));
  return p;
}

function brochDwelling(): ModelPart[] {
  const p: ModelPart[] = [cylinder("空室下方完整石地坪", 0, .1, 0, 11.6, .2, stone)];
  for (const [r, t, taper, gap] of [[5.7, .75, .55, 12], [3.9, .7, .45, 20]]) p.push(halfRoundWall("双壳下层避入口连续弧墙", r!, t!, 2, [0, .2, 0], 90 - gap! / 2, stone, Math.PI * (360 - gap!) / 180), part("门顶以上向内收分的完整石壳", "lathe", stone, [0, 0, 0], [1, 1, 1], [0, 0, 0], { profile: [{ x: r!, y: 2.2 }, { x: r! - taper!, y: 8 }, { x: r! - taper! - t!, y: 8 }, { x: r! - t!, y: 2.2 }, { x: r!, y: 2.2 }] }));
  // 外壳与内壳门缝随半径调整角宽，两者都接到同一条前向(-Z)窄门廊。
  for (const side of [-1, 1]) p.push(box("内外壁之间的窄入口侧石墙", side * .68, 1.2, -4.6, .36, 2, 2.4, stone));
  p.push(box("入口上方连结双壳的石楣", 0, 2.13, -4.6, 1.72, .26, 2.4, stone));
  for (let i = 0; i < 28; i++) { const a = (-55 + i * 9) * Math.PI / 180, y = .31 + i * .19, radius = 4.43 - Math.max(0, y - 2.2) * .08; p.push(part("壁内环隙逐级升高的独立石踏板", "box", stone, [Math.cos(a) * radius, y, Math.sin(a) * radius], [.62, .2, 1.1], [0, -a * 180 / Math.PI, 0])); }
  for (let i = 0; i < 12; i++) { const a = i * Math.PI / 6; p.push(beam("上廊连结两道石壳的径向石楣", stone, [Math.cos(a) * 3.7, 6.3, Math.sin(a) * 3.7], [Math.cos(a) * 5.05, 6.3, Math.sin(a) * 5.05], .24, .4)); }
  const ledge = ring("内室高处完整搁梁石台缘", stone, 3.3, .3, 3.8, .25); p.push(ledge, box("中央石围火床", 0, .28, 0, 1.6, .16, 1.6, earth));
  return p;
}

function cruckBarn(): ModelPart[] {
  const p: ModelPart[] = [box("中央打谷与两侧堆草连续地台", 0, .1, 0, 8.4, .2, 13, stone), ...gableCover("叉曲柱所承完整双坡仓盖", 8.8, 13.5, 3.1, 3.4, "#737b69")];
  for (const z of [-5.4, 0, 5.4]) { for (const side of [-1, 1]) p.push(part("从地石脚弯至高屋脊的连续叉曲柱", "tube", wood, [0, 0, 0], [1, 1, 1], [0, 0, 0], { radius: .16, path: [{ x: side * 3.4, y: .2, z }, { x: side * 3.3, y: 2.5, z }, { x: side * 2.3, y: 4.4, z }, { x: 0, y: 6.37, z }] })); p.push(box("叉曲柱之间的低横系梁", 0, 2.8, z, 6.7, .22, .22, wood), box("高叉口下的短系木", 0, 5.18, z, 2.6, .18, .2, wood)); }
  for (const side of [-1, 1]) { p.push(box("叉柱外侧不承重连续低围板", side * 4, 1.45, 0, .12, 2.5, 13, wood), beam("同侧曲柱之间通长承坡檩", wood, [side * 2.55, 4.18, -6.5], [side * 2.55, 4.18, 6.5], .2)); for (const end of [-1, 1]) p.push(box("打谷大门两旁端墙", side * 2.85, 1.65, end * 6.5, 2.3, 2.9, .12, wood)); }
  for (const end of [-1, 1]) p.push(box("打谷大门上方横楣", 0, 3.04, end * 6.5, 8.1, .22, .2, wood), part("屋脊下端面三角封板", "extrude", wood, [0, 0, end * 6.5], [1, 1, 1], [0, 0, 0], { depth: .1, profile: [{ x: -4.2, y: 3.1 }, { x: 4.2, y: 3.1 }, { x: 0, y: 6.35 }] }));
  for (const z of [-3.4, 3.4]) p.push(box("分列于打谷道两侧的矮木贮草围槛", 0, .5, z, 7.75, .6, .14, wood));
  return p;
}

function aisledBarn(): ModelPart[] {
  const p: ModelPart[] = [box("三通道谷仓完整耐磨地坪", 0, .12, 0, 12, .24, 15.5, stone), ...gableCover("跨越中央与两侧通道的大双坡顶", 12.6, 16, 2.9, 4, "#87836d")];
  for (const side of [-1, 1]) { p.push(box("低外侧围墙", side * 5.8, 1.52, 0, .2, 2.56, 15.5, wood), box("内柱列通长纵枋", side * 2.55, 4.96, 0, .24, .28, 15, wood)); for (const z of [-6.7, -2.2, 2.2, 6.7]) p.push(box("两列高内柱的防潮石础", side * 2.55, .36, z, .6, .24, .6, stone), box("两列高内柱独立承屋", side * 2.55, 2.7, z, .25, 4.5, .25, wood), beam("内柱外倾到低侧墙的斜梁", wood, [side * 2.55, 4.96, z], [side * 5.8, 2.74, z], .2), beam("高柱横向短斜撑", wood, [side * 2.55, 3.9, z], [side * 1.65, 4.96, z], .14)); }
  for (const z of [-6.7, -2.2, 2.2, 6.7]) p.push(box("高内柱之间的完整横系梁", 0, 4.96, z, 5.35, .25, .25, wood), ...[-1, 1].map(side => beam("中央厅屋脊两侧斜椽", wood, [side * 2.55, 4.96, z], [0, 6.72, z], .18)));
  for (const end of [-1, 1]) p.push(...doorWall("中央通道高门洞端墙", 0, end * 7.75, 11.6, 2.66, .14, 3.1, 2.5, wood, .24), part("高谷仓屋盖下的三角端围板", "extrude", wood, [0, 0, end * 7.75], [1, 1, 1], [0, 0, 0], { depth: .12, profile: [{ x: -5.8, y: 2.9 }, { x: 5.8, y: 2.9 }, { x: 0, y: 6.72 }] }));
  for (const side of [-1, 1]) for (const z of [-4.4, 4.4]) p.push(box("侧廊低贮位横隔板", side * 4.2, .7, z, 2.9, .92, .12, wood));
  return p;
}

function bankBarn(): ModelPart[] {
  const p: ModelPart[] = [box("下层畜棚整体石地坪", 0, .1, 0, 10.4, .2, 15, stone), ...[-1, 1].map(side => box("下层左右厚石承墙", side * 4.9, 1.45, 0, .5, 2.5, 14.7, stone)), box("后坡下厚石挡墙", 0, 1.45, 7.1, 9.5, 2.5, .6, stone), box("越过下层前墙外挑的木楼板", 0, 2.9, -.6, 10.3, .3, 16.1, wood), ...gableCover("上层谷草仓完整屋盖", 10.9, 16.6, 6.25, 2.6, "#81695b", 0, -.6)];
  for (const side of [-1, 1]) p.push(box("上层干草仓侧围板", side * 5, 4.65, -.6, .18, 3.2, 16.1, wood));
  p.push(...doorWall("前悬廊上层封板", 0, -8.65, 10.3, 3.2, .15, 1.2, 2.2, wood, 3.05), ...doorWall("后坡桥车道大门", 0, 7.45, 10.3, 3.2, .15, 3.5, 2.85, wood, 3.05));
  for (const end of [-1, 1]) p.push(part("谷仓双坡端山板", "extrude", wood, [0, 0, -.6 + end * 8.05], [1, 1, 1], [0, 0, 0], { depth: .12, profile: [{ x: -5, y: 6.25 }, { x: 5, y: 6.25 }, { x: 0, y: 8.62 }] }));
  for (const x of [-4.5, -1.5, 1.5, 4.5]) p.push(box("下层前石墙上的独立畜栏承墩", x, 1.45, -6.9, .45, 2.5, .65, stone));
  p.push(box("牲畜门上承重前石梁", 0, 2.57, -6.9, 9.8, .25, .7, stone), part("从地面填实至二楼车道的连续楔形土坡", "extrude", earth, [0, 0, 15], [1, 1, 1], [0, 90, 0], { depth: 4.2, profile: [{ x: 0, y: 0 }, { x: 6.4, y: 0 }, { x: 6.4, y: 3.05 }, { x: 0, y: .05 }] }), box("土坡与楼板间跨过排水缝的平短桥", 0, 2.98, 8, 4.2, .14, 1.2, wood));
  for (const x of [-3, 0, 3]) p.push(box("下层牲畜隔栏长围板", x, .92, .5, .1, 1.44, 10.8, wood));
  for (const z of [-3.5, 3.5]) p.push(box("上层车道两旁干草堆位隔槛", 0, 3.38, z, 9.4, .65, .12, wood));
  return p;
}

function horreoGranary(): ModelPart[] {
  const p: ModelPart[] = [];
  for (const x of [-.68, .68]) for (const z of [-2.5, 0, 2.5]) p.push(cylinder("架空粮仓落地石脚", x, .12, z, .6, .24, stone), cylinder("阻隔土湿的独立石柱", x, .85, z, .34, 1.22, stone), cylinder("外缘凸出石柱的防鼠帽", x, 1.54, z, .82, .16, stone));
  p.push(box("六柱之上的完整粮仓底板", 0, 1.73, 0, 1.92, .22, 6.2, wood), ...gableCover("窄长通风粮仓石片双坡盖", 2.4, 6.7, 3.66, .75, "#79847d"));
  for (const side of [-1, 1]) { p.push(box("透棂侧壁上下连枋", side * .91, 1.94, 0, .14, .18, 6.15, wood), box("透棂侧壁上枋", side * .91, 3.55, 0, .14, .18, 6.15, wood)); for (let i = 0; i < 17; i++) p.push(box("彼此留真通风缝的竖直窄棂", side * .91, 2.75, -2.9 + i * .36, .11, 1.46, .24, wood)); }
  for (const z of [-3.05, 0, 3.05]) for (const side of [-1, 1]) p.push(box("穿接底枋与屋盖的石框立柱", side * .91, 2.73, z, .16, 2.02, .18, stone));
  p.push(box("粮室后端封板", 0, 2.75, 3.05, 1.68, 1.8, .12, wood), ...doorWall("粮室前端门框", 0, -3.05, 1.68, 1.8, .12, .66, 1.55, wood, 1.84));
  for (let i = 0; i < 4; i++) p.push(box("与仓口保持断缝的独立石阶", 0, .2 + i * .21, -4.9 + i * .35, .8, .4 + i * .42, .35, stone));
  return p;
}

function hayBarrack(): ModelPart[] {
  const p: ModelPart[] = [box("草棚透气抬高木垫台", 0, .14, 0, 6.1, .28, 6.1, wood), box("贮藏松草垛本体", 0, 1.57, 0, 5.2, 2.6, 5.2, thatch)];
  for (const x of [-1, 1]) for (const z of [-1, 1]) {
    const post = polygon("带真实贯通定位销孔的木导柱", wood, [[-.09, 0], [.09, 0], [.09, 7], [-.09, 7]], .18, [x * 2.6, 0, z * 2.6 + .09], [4, 4.6, 5.25, 5.9].map(y => [[-.04, y - .05], [.04, y - .05], [.04, y + .05], [-.04, y + .05]])); post.rotation.x = -90;
    p.push(post, cylinder("承框下方贯穿导柱的水平定位销", x * 2.6, 4, z * 2.6, .07, .72, "#645b48", [90, 0, 0]));
  }
  for (const side of [-1, 1]) p.push(box("可升降草盖承框长边梁", side * 2.5, 4.14, 0, .2, .24, 5.45, wood), box("可升降草盖承框横边梁", 0, 4.14, side * 2.5, 5.45, .24, .2, wood));
  for (let i = 0; i < 4; i++) {
    const a = i * Math.PI / 2, points = [[-2.5, -3.1], [2.5, -3.1], [2.5, -2.5], [0, 0], [-2.5, -2.5]].map(([x, z]) => [x! * Math.cos(a) - z! * Math.sin(a), 4.35 + (1 - Math.abs(z!) / 3.1) * 2.35, x! * Math.sin(a) + z! * Math.cos(a)] as Triple);
    p.push(slopePanel("四角切出导柱避让口的可升降厚茅盖", points, .2, thatch), beam("草盖内侧承椽", wood, [0, 6.5, 0], [Math.sin(a) * 2.5, 4.55, -Math.cos(a) * 2.5], .15));
  }
  return p;
}
