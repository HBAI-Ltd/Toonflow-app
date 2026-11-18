import { part, ring, beam, type ModelPart, type Triple } from "../assetModelParts";
import { base, box, cylinder, arch, design, type ArchitecturePrototype } from "./structures";
import { halfRoundWall } from "./spatialShells";
import { polygon } from "../masterNature/shared";
import { combineMeshes } from "../natureParts";
import { Euler, Quaternion, Vector3 } from "three";

const stone = "#b3af98", brick = "#ac8d6c", wood = "#907855", metal = "#5c6b6e", earth = "#a89b7a";

// 原创简化类型，观象设施保留观测构造，不宣称按特定地理纬度完成测量标定。
// https://www.tourism.rajasthan.gov.in/jantar-mantar.html
// https://www.jantarmantar.org/learn/observatories/instruments/rama/index.html
// https://whc.unesco.org/en/list/1624
// https://web.astronomicalheritage.net/index.php/show-entity?identity=51&idsubentity=1
export const historicSpaceBatchFourDesigns: ArchitecturePrototype[] = [
  design("三路柱门前廊", "前后柱廊通过中央三条实际门道相连，侧翼厚石室与宽登台阶围出入口前场，柱上长梁直接承住双坡屋盖", propylaea, "建筑", "欧式"),
  design("U形柱廊大祭坛", "宽正阶登上高石祭台，两侧和后方的连续柱廊围成U形，顶部横梁与檐盖不封住中部露天祭场", pergamonAltar, "建筑", "欧式"),
  design("四壁阶席密仪柱厅", "四面固定石阶席面向中央多柱平面，双入口穿过前壁和低位席区，宽平屋盖由内柱网与周墙共同承托", telesterion, "建筑", "欧式"),
  design("中庭圆亭生鲜市场", "环院柜台面向四边可通行售货廊，货房与中心圆亭分开，圆亭下的实体槽台和中央作业口构成公共售卖空间", macellum, "建筑", "欧式"),
  design("前庭四柱炉心王厅", "前柱廊经独立门厅进入中央炉心大厅，四个内柱围住炉座并承托留有烟孔的屋盖，后厅与入口前庭顺轴相接", megaron, "建筑", "异域"),
  design("长墓道叠涩蜂巢墓", "高石侧壁围出长敞墓道，巨楣低门接入圆形叠涩葬室，墓道尽头的三角减荷孔与逐层内收的室顶相连", tholosTomb, "建筑", "异域"),
  design("三券纪功门", "宽主券和两条较低侧券共同穿过厚石门体，上方统一纪功阁与冠檐接到石墩，三条通路均实际贯通", triumphalArch, "建筑", "欧式"),
  design("四门交街罗马营堡", "四个贯通营门由两条正交通街连接，成列营房分布在道路两侧，后场仪事厅和角塔共同收在低防守围壁内", romanCastrum, "建筑", "欧式"),
  design("巨斜表赤道日晷台", "可登临三角石表的斜边对准两侧倾斜赤道弧盘，两个实心承盘面托住独立弧刻度，长石表下方保留稳定地基", samratYantra, "设施", "异域"),
  design("双井分瓣天球投影台", "两座缺瓣互补的凹面投影井独立保留登降通路，各井口正交细线与中央小环标定投影中心，作为一座配对观象设施", jaiPrakash, "设施", "异域"),
  design("双台中柱环壁地平测位台", "两座互补扇区的测位台各有与环壁同高的中柱，壁段和放射地盘相间布置，水平细刻度位于壁段内侧，空隙作为进出通路", ramaYantra, "设施", "异域"),
  design("十三塔列日界观象场", "固定十三座有双面登顶阶的石塔沿缓曲山脊成列，东西观察点在塔列两侧独立设置，整个遗址作为一座观象设施", chankillo, "设施", "异域"),
];

function door(name: string, width: number, height: number, depth: number, opening: number, position: Triple, color = stone): ModelPart[] {
  const side = (width - opening) / 2, head = height - Math.min(3, height - .6);
  return [...[-1, 1].map(s => box(`${name}两侧石壁`, position[0] + s * (opening + side) / 2, position[1] + height / 2, position[2], side, height, depth, color)), box(`${name}上部石过梁`, position[0], position[1] + height - head / 2, position[2], opening, head, depth, color)];
}
function steps(name: string, count: number, width: number, height: number, run: number, position: Triple): ModelPart[] { return Array.from({ length: count }, (_, i) => box(name, position[0], position[1] + (i + 1) * height / count / 2, position[2] + i * run, width, (i + 1) * height / count, run)); }
function pitched(name: string, width: number, rise: number, depth: number, position: Triple): ModelPart { return part(name, "extrude", "#79837a", position, [1, 1, 1], [0, 0, 0], { depth, profile: [{ x: -width / 2, y: 0 }, { x: 0, y: rise }, { x: width / 2, y: 0 }, { x: width / 2, y: -.2 }, { x: 0, y: rise - .2 }, { x: -width / 2, y: -.2 }] }); }
function circle(radius: number, count = 16): [number, number][] { return Array.from({ length: count }, (_, i) => [Math.cos(i * Math.PI * 2 / count) * radius, Math.sin(i * Math.PI * 2 / count) * radius]); }

function propylaea(): ModelPart[] {
  const p: ModelPart[] = [base(29, 24), box("三路门廊共同高石台", 0, .7, 0, 24, 1.04, 15), ...steps("前廊宽直登台阶", 5, 14, 1.04, .45, [0, .18, -9.3])];
  for (const z of [-5.8, 5.8]) for (const x of [-8, -4.8, -1.6, 1.6, 4.8, 8]) p.push(cylinder("前后两列真正落台石柱", x, 4, z, .55, 5.56, stone), box("石柱宽柱头", x, 6.93, z, .92, .3, .92));
  for (const x of [-9.8, -3.4, 3.4, 9.8]) p.push(box("三路门道之间完整石墩", x, 3.9, 0, 2.2, 5.36, 2));
  p.push(box("三门上方连续厚石横楣", 0, 6.75, 0, 22, .7, 2), ...[-1, 1].map(s => box("柱廊前后连续承檐梁", 0, 7.3, s * 5.8, 19.2, .44, .6)), pitched("三路门廊整片双坡石屋盖", 23, 2.6, 15.7, [0, 7.65, 0]));
  for (const s of [-1, 1]) p.push(box("两翼侧室外厚壁", s * 11.5, 3.9, 1, .5, 5.36, 11), box("侧室后壁", s * 8.2, 3.9, 6.4, 7.2, 5.36, .4));
  return p;
}

function pergamonAltar(): ModelPart[] {
  const p: ModelPart[] = [base(31, 32), box("大祭坛完整厚石高台", 0, 2.07, 3, 25, 3.78, 19), ...steps("穿过两翼正面登台的大石阶", 14, 11, 3.78, .4, [0, .18, -11.9])];
  for (const s of [-1, 1]) {
    p.push(box("正阶两侧连续厚石护墙", s * 8.7, 3, -8.7, 6.6, 5.64, 6.3));
    for (const z of [-5.5, -1, 3.5, 8.5]) p.push(cylinder("U形侧柱廊的落地石柱", s * 10.2, 6, z, .48, 4.08, stone), box("侧柱上方实际承檐石盘", s * 10.2, 8.18, z, .85, .28, .85));
    p.push(box("侧廊柱头上方连续石梁", s * 10.2, 8.55, 1.5, .7, .46, 16), box("侧柱廊完整平石檐顶", s * 10.2, 8.97, 1.5, 4, .38, 17));
  }
  for (const x of [-6.8, -2.3, 2.3, 6.8]) p.push(cylinder("后方横廊独立高石柱", x, 6, 10.4, .48, 4.08, stone), box("后柱承檐盘", x, 8.18, 10.4, .85, .28, .85));
  p.push(box("后方横廊连续石梁", 0, 8.55, 10.4, 21, .46, .7), box("后方横廊完整平石檐顶", 0, 8.97, 10.4, 24, .38, 3.6), box("露天祭场中央独立石祭案", 0, 4.45, 5.5, 3.3, .98, 1.8));
  return p;
}

function telesterion(): ModelPart[] {
  const p: ModelPart[] = [base(31, 31), ...door("前厅左侧真实入口", 14, 7.8, .45, 2.1, [-7, .18, -14]), ...door("前厅右侧真实入口", 14, 7.8, .45, 2.1, [7, .18, -14]), ...[-1, 1].map(s => box("密仪厅两侧连续厚石壁", s * 14, 4.08, 0, .45, 7.8, 28)), box("密仪厅后壁", 0, 4.08, 14, 28, 7.8, .45)];
  for (const x of [-7.5, -2.5, 2.5, 7.5]) for (const z of [-7.5, -2.5, 2.5, 7.5]) p.push(cylinder("中央密柱网的真实承重石柱", x, 4, z, .6, 7.64, stone), box("柱上宽石承顶盘", x, 7.92, z, 1.05, .2, 1.05));
  for (let row = 0; row < 4; row++) {
    const h = .4 + row * .32;
    p.push(...[-1, 1].map(s => box("侧壁连续固定石阶席", s * (10.3 + row * .8), .18 + h / 2, 0, .82, h, 26)), box("后壁连续固定石阶席", 0, .18 + h / 2, 10.3 + row * .8, 19.8, h, .82));
    for (const s of [-1, 1]) p.push(box("前壁避开入口的短石阶席", s * 2.6, .18 + h / 2, -10.3 - row * .8, 4.5, h, .82));
  }
  p.push(box("多柱共同承起的完整宽平石顶", 0, 8.16, 0, 29, .36, 29), box("内场边侧独立仪式石台", 5.6, .55, 4.5, 3.2, .74, 2));
  return p;
}

function macellum(): ModelPart[] {
  const p: ModelPart[] = [base(39, 42), ...door("市场正面中央通行口", 33, 4.7, .5, 3.8, [0, .18, -17]), ...[-1, 1].map(s => box("市场外侧完整厚壁", s * 16.5, 2.53, 0, .5, 4.7, 34)), box("市场后方完整厚壁", 0, 2.53, 17, 33, 4.7, .5), polygon("售货廊屋盖中部保持大露天庭院", stone, [[-17, -17.5], [17, -17.5], [17, 17.5], [-17, 17.5]], .26, [0, 4.88, 0], [[[-10.5, -10.5], [-10.5, 10.5], [10.5, 10.5], [10.5, -10.5]]])];
  for (const s of [-1, 1]) {
    for (const z of [-12, -6, 0, 6, 12]) p.push(box("相邻货房之间的独立隔壁", s * 13.6, 2.53, z, 5.5, 4.7, .25), box("内庭廊屋的落地承重墩", s * 10.5, 2.53, z, .45, 4.7, .45));
    p.push(box("连续售卖石柜台", s * 11.5, .7, 0, 1.5, 1.04, 28), box("后方横向售货长台", 0, .7, s * 12.2, 17.5, 1.04, 1.5));
  }
  p.push(cylinder("中央作业圆亭石铺地台", 0, .35, 0, 8.5, .34, stone), ring("圆亭下保留中央操作口的石槽台", stone, 3.3, .7, .92, .8), ring("承接圆亭各柱并实际托住屋盖的环梁", stone, 4.05, .45, 4.5, .18));
  for (let i = 0; i < 8; i++) { const a = i * Math.PI / 4; p.push(cylinder("中央圆亭独立承檐石柱", Math.cos(a) * 3.8, 2.5, Math.sin(a) * 3.8, .3, 3.96, stone)); }
  p.push(part("中央圆亭完整圆锥薄屋盖", "lathe", "#7c8577", [0, 4.55, 0], [1, 1, 1], [0, 0, 0], { profile: [{ x: 4.4, y: 0 }, { x: 0, y: 1.3 }, { x: 0, y: 1.1 }, { x: 4.3, y: -.12 }, { x: 4.4, y: 0 }] }));
  return p;
}

function megaron(): ModelPart[] {
  const p: ModelPart[] = [base(18, 29), box("前廊门厅与后王厅连续石铺面", 0, .3, 0, 13, .24, 24), ...[-1, 1].map(s => box("主厅厚侧壁", s * 5.8, 3.1, 4.5, .4, 5.36, 12)), box("王厅后部厚封壁", 0, 3.1, 10.3, 12, 5.36, .4), ...door("王厅与前门厅之间的通门", 12, 5.36, .4, 2.3, [0, .42, -1.5]), ...door("前柱廊接入门厅的通门", 12, 5.36, .4, 2.3, [0, .42, -5.7])];
  for (const s of [-1, 1]) p.push(box("门厅侧向连续围壁", s * 5.8, 3.1, -3.6, .4, 5.36, 4.2), box("前廊向前伸出的石侧翼", s * 5.8, 3.1, -8.5, .4, 5.36, 5.6), cylinder("前廊两根独立木承柱", s * 2.5, 3.1, -10.2, .44, 5.36, wood));
  for (const x of [-2.3, 2.3]) for (const z of [2.2, 6.8]) p.push(cylinder("围绕中央炉心的四个真实承屋柱", x, 3.1, z, .48, 5.36, wood));
  p.push(cylinder("四柱之间的中央低圆炉床", 0, .62, 4.5, 2.3, .4, brick), ring("中央炉床有内腔的石围圈", brick, 1.15, .2, .92, .3), box("前门厅完整平木屋盖", 0, 5.95, -3.6, 12.8, .34, 4.8, wood), box("前柱廊直接承托的平展木顶", 0, 5.95, -8.5, 12.8, .34, 6, wood), polygon("四柱王厅屋盖留有真正炉烟上升孔", wood, [[-6.4, -1.8], [6.4, -1.8], [6.4, 10.7], [-6.4, 10.7]], .34, [0, 5.78, 0], [circle(1.05, 12).map(([x, z]) => [x, z + 4.5]) as [number, number][]]));
  return p;
}

function tholosTomb(): ModelPart[] {
  const p: ModelPart[] = [base(24, 39), box("长敞墓道完整行走石面", 0, .3, -9, 3.2, .24, 18), ...[-1, 1].map(s => box("敞墓道两侧高石挡墙", s * 1.8, 2.55, -9, .5, 4.5, 18)), cylinder("圆葬室与墓道相接的同高石地面", 0, .3, 5.3, 10, .24, stone), halfRoundWall("圆葬室前方真实保留入室门", 5.2, .7, 3.3, [0, .42, 5.3], 72, stone, Math.PI * 2 - 36 * Math.PI / 180), box("葬室入门上方巨整石门楣", 0, 3.95, .5, 4.2, .55, 1.4)];
  for (let i = 0; i < 7; i++) { const r = 5.2 - i * .65, value = ring("圆葬室逐层收进的叠涩石盖", stone, r, .72, 4.03 + i * .52, .62); value.position.z = 5.3; p.push(value); }
  p.push(cylinder("叠涩顶上方完整封缝石", 0, 7.61, 5.3, 3.05, .3, stone), box("墓道穿过厚门后同圆葬室地面相接的石铺板", 0, .3, .15, 3.2, .24, .6));
  for (const s of [-1, 1]) p.push(part("巨楣上方三角减荷洞两侧真实斜石", "extrude", stone, [0, 4.22, .5], [1, 1, 1], [0, 0, 0], { depth: 1.4, profile: s < 0 ? [{ x: -2.2, y: 0 }, { x: -1.5, y: 0 }, { x: 0, y: 1.9 }, { x: -.5, y: 2.2 }, { x: -2.2, y: 2.2 }] : [{ x: 1.5, y: 0 }, { x: 2.2, y: 0 }, { x: 2.2, y: 2.2 }, { x: .5, y: 2.2 }, { x: 0, y: 1.9 }] }));
  p.push(box("长葬室后方低安奉石床", 0, .65, 7.3, 2.8, .46, 2.2));
  return p;
}

function spandrel(x: number, radius: number, spring: number, thickness: number): ModelPart {
  const profile = [{ x: -radius - thickness, y: 8.7 }, { x: radius + thickness, y: 8.7 }, { x: radius + thickness, y: spring }];
  for (let i = 1; i <= 12; i++) { const a = i * Math.PI / 12; profile.push({ x: Math.cos(a) * (radius + thickness), y: spring + Math.sin(a) * (radius + thickness) }); }
  return part("券顶同纪功阁之间的完整实心肩墙", "extrude", stone, [x, .18, 0], [1, 1, 1], [0, 0, 0], { depth: 5, profile });
}

function triumphalArch(): ModelPart[] {
  const p: ModelPart[] = [base(25, 10)];
  for (const [x, r, h] of [[0, 2.7, 5], [-7.2, 1.6, 4.2], [7.2, 1.6, 4.2]]) { const value = arch(x!, 0, r!, h!, 5, .65); p.push(value, spandrel(x!, r!, h!, .65)); }
  for (const s of [-1, 1]) p.push(box("主券与侧券之间的完整厚石墩", s * 4.1, 4.53, 0, 1.6, 8.7, 5), box("最外侧纪功门厚石端墩", s * 10.1, 4.53, 0, 1.3, 8.7, 5));
  p.push(box("三条门券之上的统一纪功阁", 0, 10.38, 0, 21.5, 3, 5), box("纪功阁顶端连续冠檐", 0, 12.15, 0, 22.4, .54, 5.7));
  for (const x of [-9.7, -4, 4, 9.7]) p.push(cylinder("正面贴墙且落地的纪功石柱", x, 4.38, -2.7, .45, 8.4, stone), box("正面柱上方独立承檐盘", x, 8.73, -2.7, .8, .3, .8));
  return p;
}

function romanCastrum(): ModelPart[] {
  const p: ModelPart[] = [base(88, 92), box("连接东西营门的连续正交通街", 0, .22, 0, 79, .08, 5.5, earth), box("连接南北营门的连续纵通街", 0, .22, 0, 5.5, .08, 82, earth)];
  for (const s of [-1, 1]) {
    p.push(...door("南北营门真实通行口", 78, 3.2, .65, 4, [0, .18, s * 41]));
    p.push(...door("东西营门真实通行口", 82, 3.2, .65, 4, [0, .18, 0]).map(v => { const x = v.position.x; v.position.x = s * 39; v.position.z = -x; v.rotation.y = 90; return v; }));
    for (const z of [-24, -10, 9]) {
      p.push(...door("营房面向中央街的入室门", 15, 3.1, .25, 1.4, [s * 22, .18, z - 4]), ...[-1, 1].map(edge => box("营房两端厚石墙", s * 22 + edge * 7.4, 1.73, z, .25, 3.1, 8)), box("营房后壁", s * 22, 1.73, z + 4, 15, 3.1, .25), pitched("营房独立双坡屋盖", 16, 1.1, 9, [s * 22, 3.4, z]));
    }
  }
  for (const x of [-1, 1]) for (const z of [-1, 1]) p.push(polygon("四角方塔真实空心围壁", stone, [[-2.4, -2.4], [2.4, -2.4], [2.4, 2.4], [-2.4, 2.4]], 4.8, [x * 39, .18, z * 41], [[[-1.9, -1.9], [-1.9, 1.9], [1.9, 1.9], [1.9, -1.9]]]), box("角塔上部平展石盖", x * 39, 5.13, z * 41, 5.1, .3, 5.1));
  p.push(...door("后场仪事厅入口", 20, 4.3, .35, 2.5, [14, .18, 20]), ...[-1, 1].map(s => box("仪事厅侧壁", 14 + s * 9.8, 2.33, 27, .35, 4.3, 14)), box("仪事厅后壁", 14, 2.33, 34, 20, 4.3, .35), pitched("仪事厅完整双坡屋盖", 21, 1.3, 15, [14, 4.6, 27]));
  return p;
}

function samratYantra(): ModelPart[] {
  const p: ModelPart[] = [base(33, 37), part("赤道日晷完整三角石表", "extrude", brick, [0, .18, 0], [1, 1, 1], [0, 90, 0], { depth: 2.4, profile: [{ x: -12, y: 0 }, { x: 12, y: 0 }, { x: -12, y: 12.2 }] })];
  const angle = 27 * Math.PI / 180, cy = .18 + 20 / 24 * 12.2;
  for (const side of [-1, 1]) {
    const start = side > 0 ? -85 : -175, end = side > 0 ? -5 : -95, edge = Array.from({ length: 13 }, (_, i) => { const a = (start + (end - start) * i / 12) * Math.PI / 180; return { x: Math.cos(a) * 11, y: Math.sin(a) * 11 }; });
    p.push(part("从地基托住倾斜赤道弧盘的整片石身", "extrude", brick, [0, cy, 8], [1, 1, 1], [-27, 0, 0], { depth: .4, profile: [...edge, { x: edge.at(-1)!.x, y: -11.4 }, { x: edge[0]!.x, y: -11.4 }] }));
    const inner = [...edge].reverse().map(v => ({ x: v.x * .96, y: v.y * .96 }));
    p.push(part("承盘石面上独立连续弧形刻度带", "extrude", stone, [0, cy + Math.sin(angle) * .24, 8 + Math.cos(angle) * .24], [1, 1, 1], [-27, 0, 0], { depth: .06, profile: [...edge, ...inner] }));
    for (let i = 0; i <= 12; i++) {
      const a = (start + (end - start) * i / 12) * Math.PI / 180, r = 10.8;
      p.push(part("赤道弧盘上实际分立的径向刻线", "box", metal, [Math.cos(a) * r, cy + Math.sin(a) * r * Math.cos(angle) + Math.sin(angle) * .29, 8 - Math.sin(a) * r * Math.sin(angle) + Math.cos(angle) * .29], [.025, .35, .035], [-27, 0, -a * 180 / Math.PI - 90]));
    }
  }
  for (let i = 0; i < 30; i++) p.push(box("沿三角石表斜边逐级上升的实石踏板", 0, .18 + (i + 1) * 12.2 / 30, -11.6 + i * .8, 1.75, .16, .8));
  return p;
}

function bowlSector(start: number): ModelPart {
  const rows = 6, cols = 4, vertices: { x: number; y: number; z: number }[] = [], faces: number[] = [];
  for (const radius of [5.95, 5.7]) {
    vertices.push({ x: 0, y: -radius, z: 0 });
    for (let row = 1; row <= rows; row++) for (let col = 0; col <= cols; col++) { const phi = row * Math.PI / (rows * 2), a = (start + col * 30 / cols) * Math.PI / 180; vertices.push({ x: Math.sin(phi) * Math.cos(a) * radius, y: -Math.cos(phi) * radius, z: Math.sin(phi) * Math.sin(a) * radius }); }
  }
  const count = vertices.length / 2;
  for (let col = 0; col < cols; col++) faces.push(0, 1 + col, 2 + col);
  for (let row = 0; row < rows - 1; row++) for (let col = 0; col < cols; col++) { const a = 1 + row * (cols + 1) + col, b = a + cols + 1; faces.push(a, b, a + 1, a + 1, b, b + 1); }
  const indices = [...faces], edges = new Map<string, [number, number]>();
  for (let i = 0; i < faces.length; i += 3) {
    indices.push(faces[i]! + count, faces[i + 2]! + count, faces[i + 1]! + count);
    for (let j = 0; j < 3; j++) { const a = faces[i + j]!, b = faces[i + (j + 1) % 3]!; if (!edges.delete(`${b},${a}`)) edges.set(`${a},${b}`, [a, b]); }
  }
  for (const [a, b] of edges.values()) indices.push(a, b + count, b, a, a + count, b + count);
  return part("具有内外表面和切口封边的凹面球壳瓣", "mesh", stone, [0, 5.95, 0], [1, 1, 1], [0, 0, 0], { vertices, indices });
}

function jaiPrakashStation(): ModelPart[] {
  const p: ModelPart[] = [base(18, 18), ...Array.from({ length: 6 }, (_, i) => bowlSector(i * 60)), halfRoundWall("留有登降开口的井口环形承台", 6.35, .45, 5.77, [0, .18, 0], -60, brick, 330 * Math.PI / 180), beam("投影井口东西向悬线", metal, [-6, 5.95, 0], [6, 5.95, 0], .015), beam("投影井口南北向悬线", metal, [0, 5.95, -6], [0, 5.95, 6], .015), part("正交悬线中部真实投影环", "torus", metal, [0, 5.95, 0], [.15, .15, .035], [90, 0, 0])];
  const a = Math.PI / 4;
  for (let i = 0; i < 19; i++) { const r = 6 - i * .32, h = 5.7 - i * .3; p.push(part("缺瓣通路内逐级降到井底的石阶", "box", stone, [Math.cos(a) * r, .18 + h / 2, Math.sin(a) * r], [.75, h, .34], [0, -45, 0])); }
  return p;
}

function ramaStation(): ModelPart[] {
  const p: ModelPart[] = [base(16, 16), cylinder("同环壁等高的中央测位柱", 0, 2.93, 0, .18, 5.5, stone)], marks: ModelPart[] = [];
  for (let i = 0; i < 12; i++) {
    const a = i * Math.PI / 6, b = a + Math.PI / 12;
    p.push(halfRoundWall("与地盘同向分隔的弧形测位壁段", 5.8, .28, 5.5, [0, .18, 0], -i * 30, brick, Math.PI / 12), polygon("壁段前方单独径向石测位地盘", stone, [[Math.cos(a) * .55, Math.sin(a) * .55], [Math.cos(a) * 5.55, Math.sin(a) * 5.55], [Math.cos(b) * 5.55, Math.sin(b) * 5.55], [Math.cos(b) * .55, Math.sin(b) * .55]], .2, [0, .18, 0]));
    for (const y of [1.28, 2.38, 3.48, 4.58]) marks.push(halfRoundWall("壁段上连续水平测位刻度带", 5.54, .025, .025, [0, y, 0], -i * 30, stone, Math.PI / 12));
  }
  // 每条刻带24顶点；16条一批保留全部刻带并满足单mesh 512顶点预算。
  for (let i = 0; i < marks.length; i += 16) p.push(combineMeshes("测位壁内侧分段水平刻度", stone, marks.slice(i, i + 16)));
  return p;
}

function placeStation(parts: ModelPart[], x: number, degrees: number): ModelPart[] {
  const rotation = new Quaternion().setFromAxisAngle(new Vector3(0, 1, 0), degrees * Math.PI / 180);
  for (const value of parts) {
    const point = new Vector3(value.position.x, value.position.y, value.position.z).applyQuaternion(rotation), euler = new Euler().setFromQuaternion(rotation.clone().multiply(new Quaternion().setFromEuler(new Euler(value.rotation.x * Math.PI / 180, value.rotation.y * Math.PI / 180, value.rotation.z * Math.PI / 180))));
    value.position = { x: point.x + x, y: point.y, z: point.z };
    value.rotation = { x: euler.x * 180 / Math.PI, y: euler.y * 180 / Math.PI, z: euler.z * 180 / Math.PI };
  }
  return parts;
}
function jaiPrakash(): ModelPart[] { return [...placeStation(jaiPrakashStation(), -10, 0), ...placeStation(jaiPrakashStation(), 10, -30)]; }
function ramaYantra(): ModelPart[] { return [...placeStation(ramaStation(), -9, 0), ...placeStation(ramaStation(), 9, -15)]; }

function towerStairs(height: number, position: Triple, yaw: number): ModelPart {
  const profile: [number, number][] = [[0, 0]];
  for (let i = 0; i < 14; i++) profile.push([i * .25, height * (i + 1) / 14], [(i + 1) * .25, height * (i + 1) / 14]);
  profile.push([3.5, 0]);
  const value = polygon("标塔一侧实际逐级登顶的固定石阶", brick, profile, .9);
  value.rotation.x = -90; value.position.z = .45;
  placeStation([value], 0, yaw);
  value.position.x += position[0]; value.position.y += position[1]; value.position.z += position[2];
  return value;
}

function chankillo(): ModelPart[] {
  const p: ModelPart[] = [base(88, 86), part("塔列沿线两侧缓降的长山脊基盘", "extrude", earth, [0, .18, -.9], [1, 1, 1], [0, 90, 0], { depth: 77, profile: [{ x: -9, y: 0 }, { x: 9, y: 0 }, { x: 6.7, y: 1.64 }, { x: -6.7, y: 1.64 }] })];
  const heights = [3.2, 3.35, 3.55, 3.8, 4, 4.15, 4.2, 4.1, 3.95, 3.7, 3.55, 3.35, 3.2], offsets = [-1.8, -1.3, -.8, -.4, -.15, 0, .1, .05, -.1, -.35, -.75, -1.2, -1.7];
  for (let i = 0; i < 13; i++) {
    const x = (i - 6) * 5.8, z = offsets[i]!, h = heights[i]!;
    p.push(box("固定塔列内的实心测日标塔", x, 1.82 + h / 2, z, 3.4, h, 4.4, brick), towerStairs(h, [x - 1.6, 1.82, z - 5.6], -90), towerStairs(h, [x + 1.6, 1.82, z + 5.6], 90));
  }
  for (const s of [-1, 1]) p.push(box("东西观察点独立石铺站位", 0, .28, s * 34, 6.3, .2, 5.7), ...[-1, 1].map(edge => box("观察点两侧限定视线的低石界", edge * 2.6, 1.15, s * 34, .4, 1.74, 5.7)), box("观察点后方入口侧石身", 0, .85, s * 36.7, 5.5, 1.14, .4));
  return p;
}
