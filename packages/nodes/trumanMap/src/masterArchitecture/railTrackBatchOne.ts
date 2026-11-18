import type { ModelPart, Triple } from "../assetModelParts";
import { boxBatch, hardPlan, profileBody } from "./everydayOutdoorSpaceBatchOne";
import { box, design, rail, type ArchitecturePrototype } from "./structures";

const stone = "#b3b6a5", ballast = "#918f7f", steel = "#67777a", railHead = "#adb4ad", dark = "#455258", cream = "#d3cbb1";
const halfGauge = .7525;

// 只参考基础构造，自行绘制静态场景几何；不复刻厂家线路图或新增同段长短、左右款。
// https://www.networkrail.co.uk/our-work/looking-after-the-railway/track/
// https://www.ensco.com/rail/third-rail-measurement-system-trms
// https://www.tracknet-group.ch/site/de/produkte/zahnradbahnen/
// https://nnry.com/not-just-any-old-ash-pit/
// https://www.voestalpine.com/nortrak/en/products/Diamond-Crossings-Double-Slip-Switches-DSS/
export const railTrackBatchOneDesigns: ArchitecturePrototype[] = [
  design("八尖轨外弧复式交分道岔整组", "两条斜交铁路的固定交叉和两条外弧连接线共同形成四端可换路的完整复式交分，八段渐薄导向尖轨接入四组横向联动杆和独立转辙机，交叉处留出轮缘通槽；仅为静态场景设施，不注册方向、长度或开闭状态款式", doubleSlipTrack, "设施", "现代"),
  design("下触供电第三轨无砟线路整段", "两根走行钢轨由成列承轨台固定在完整混凝土轨道板上，外侧供电轨通过独立绝缘支架架起，顶部护罩和两个端部斜入轨保留向下开放的集电靴接触面；不把直曲或轨段长度变化另计主素材", thirdRailTrack, "设施", "现代"),
  design("中央梯齿条登山铁路整段", "两根承重钢轨和中央独立梯齿条共用连续横枕，齿条双侧槽梁承接真实分隔的横齿，齿间留空供机车齿轮啮入，独立短座把纵向牵引力传到横枕；原型包含完整线路而不包含机车", rackRailTrack, "设施", "现代"),
  design("跨坑实柱承轨蒸汽机车落灰地沟", "两条连续钢轨由坑外枕座与坑内独立实柱承托，中央敞口灰坑没有横枕或盖板遮住落灰路线，沟底清灰步道接入端部阶梯和绕过坑端的侧灰场；以沟底为放置基准，布置时让轨顶对齐既有线路", locomotiveAshPit, "设施", "现代"),
];

function railPath(name: string, points: [number, number][], bottom = .27, widthFactors?: number[]): ModelPart[] {
  const outline = (width: number): [number, number][] => {
    const edge = (side: number): [number, number][] => points.map(([x, z], index) => {
      const before = points[Math.max(0, index - 1)]!, after = points[Math.min(points.length - 1, index + 1)]!, dx = after[0] - before[0], dz = after[1] - before[1], length = Math.hypot(dx, dz);
      const half = width * (widthFactors?.[index] ?? 1) / 2;
      return [x + side * dz / length * half, z - side * dx / length * half];
    });
    return [...edge(-1), ...edge(1).reverse()];
  };
  return [hardPlan(`${name}完整底翼缘`, steel, outline(.15), .02, [0, bottom, 0]), hardPlan(`${name}承接轨头的连续薄轨腹`, steel, outline(.018), .12, [0, bottom + .02, 0]), hardPlan(`${name}连续承轮轨头`, railHead, outline(.07), .05, [0, bottom + .14, 0])];
}

function doubleSlipTrack(): ModelPart[] {
  const parts: ModelPart[] = [box("完整承托交叉与双外弧的复式交分道床", 0, .09, 0, 8.5, .18, 26, ballast)];
  const sleepers: Triple[] = [], plates: Triple[] = [];
  for (let index = 0; index < 43; index++) sleepers.push([0, .225, -12.6 + index * .6]);
  parts.push(...boxBatch("交分各路线共用的完整长轨枕", stone, sleepers, [7.9, .09, .23]));
  const slope = .2, lineOffset = halfGauge * Math.hypot(1, slope);
  const curve = (side: number, edge: number, z: number): [number, number] => {
    const derivative = side * z / 40, normal = Math.hypot(1, derivative);
    return [side * (.8 + z * z / 80) + edge * halfGauge / normal, z - edge * halfGauge * derivative / normal];
  };
  // ACT: 本原型只有固定八条轨路；用二分求外弧与直轨的交点，留槽与轮廓共用同一坐标，避免手写近似让轨头重新相交。
  let low = 0, high = 6;
  for (let iteration = 0; iteration < 32; iteration++) {
    const middle = (low + high) / 2, point = curve(-1, 1, middle);
    if (point[0] - slope * point[1] + lineOffset > 0) low = middle; else high = middle;
  }
  const cutParameter = (low + high) / 2, cutPoint = curve(-1, 1, cutParameter), cutZ = cutPoint[1];
  for (const direction of [-1, 1]) for (const edge of [-1, 1]) {
    const cuts = [-direction * edge * lineOffset / slope, 0, -direction * edge * cutZ].sort((a, b) => a - b), limits = [-12, ...cuts.flatMap(z => [z - .11, z + .11]), 12];
    for (let index = 0; index < limits.length; index += 2) {
      const a = limits[index]!, b = limits[index + 1]!;
      parts.push(...railPath("在辙叉处真实断开轮缘槽的斜交走行钢轨", [[direction * slope * a + edge * lineOffset, a], [direction * slope * b + edge * lineOffset, b]]));
    }
  }
  for (const side of [-1, 1]) for (const edge of [-1, 1]) {
    const inner = side * edge < 0, spans = inner ? [[-6.2, -cutParameter - .11], [-cutParameter + .11, cutParameter - .11], [cutParameter + .11, 6.2]] : [[-6.2, 6.2]];
    for (const [a, b] of spans) parts.push(...railPath("在斜交钢轨处留真实轮缘槽的外弧导向钢轨", Array.from({ length: 7 }, (_, index) => curve(side, edge, a! + (b! - a!) * index / 6))));
    for (const end of [-1, 1]) {
      const values = end < 0 ? [-8, -7.4, -6.2] : [6.2, 7.4, 8], factors = end < 0 ? [.045, .46, 1] : [1, .46, .045];
      parts.push(...railPath("实际从基本轨旁渐薄尖端接入外弧的独立导向尖轨", values.map(z => curve(side, edge, z)), .27, factors));
    }
  }
  for (const end of [-1, 1]) for (const side of [-1, 1]) {
    const z = end * 7.4, x = side * (1.48 + .25), machineX = side * 3.5;
    parts.push(box("独立转辙机真正落在长轨枕上的实底座", machineX, .34, z, .65, .2, 1.05, steel), box("四个入口各自独立的封闭转辙电机箱", machineX, .58, z, .55, .34, .9, cream), rail([machineX - side * .24, .255, z], [x - side * .8, .255, z], .045, dark));
    plates.push([side * 1.48, .255, z]);
  }
  parts.push(...boxBatch("两片入口尖轨底翼缘下面接住横向拉杆的低位联动板", dark, plates, [1.72, .035, .22]));
  for (const [x, z] of [[-lineOffset, 0], [lineOffset, 0], [0, -lineOffset / slope], [0, lineOffset / slope]]) parts.push(box("辙叉轮缘通槽下面承接各轨端的整体钢底座", x!, .285, z!, .75, .025, .75, dark));
  return parts;
}

function thirdRailTrack(): ModelPart[] {
  const parts: ModelPart[] = [box("完整承托走行轨与供电轨支座的无砟轨道板", 0, .09, 0, 3.9, .18, 14, stone), box("轨道板旁独立电缆沟底", 2.18, .065, 0, .42, .13, 14, dark)];
  const seats: Triple[] = [], clamps: Triple[] = [], insulators: Triple[] = [];
  for (let index = 0; index < 22; index++) {
    const z = -6.6 + index * .63;
    for (const side of [-1, 1]) {
      seats.push([side * halfGauge, .225, z]);
      for (const edge of [-1, 1]) clamps.push([side * halfGauge + edge * .11, .285, z]);
    }
  }
  parts.push(...boxBatch("两根走行钢轨之下独立落在轨道板上的承轨台", stone, seats, [.48, .09, .3]), ...boxBatch("实际压住走行钢轨底翼缘的独立低位压板", dark, clamps, [.09, .035, .16]));
  for (const side of [-1, 1]) parts.push(...railPath("无砟线路走行钢轨", [[side * halfGauge, -7], [side * halfGauge, 7]]));
  for (const z of [-5.7, -3.8, -1.9, 0, 1.9, 3.8, 5.7]) {
    parts.push(box("供电轨绝缘柱的独立落地安装座", 1.68, .24, z, .36, .12, .32, steel), box("从绝缘柱顶侧向托住供电轨外缘的绝缘短臂", 1.52, .675, z, .46, .08, .16, cream));
    insulators.push([1.7, .47, z]);
  }
  parts.push(...boxBatch("支承供电轨并与接地安装座分离的实体绝缘柱", cream, insulators, [.15, .35, .16]), box("下方留出集电靴接触面的连续带电导电轨", 1.35, .69, 0, .16, .12, 11.8, railHead), box("独立于下触接触面的供电轨顶上防护盖", 1.35, .805, 0, .34, .05, 11.9, cream), box("朝线路外侧下垂的连续绝缘护边", 1.53, .745, 0, .035, .17, 11.9, cream));
  for (const end of [-1, 1]) {
    const low = end < 0 ? [[0, .53], [1.1, .63], [1.1, .75], [0, .65]] : [[0, .63], [1.1, .53], [1.1, .65], [0, .75]], cover = end < 0 ? [[0, .72], [1.1, .78], [1.1, .83], [0, .77]] : [[0, .78], [1.1, .72], [1.1, .77], [0, .83]];
    parts.push(profileBody("独立供电轨端部引导集电靴的连续斜入段", railHead, low as [number, number][], .16, [1.35, 0, end < 0 ? -7 : 5.9], -90), profileBody("随供电轨斜入端部降低的绝缘护盖", cream, cover as [number, number][], .34, [1.35, 0, end < 0 ? -7 : 5.9], -90));
  }
  for (const x of [1.965, 2.395]) parts.push(box("电缆沟两侧保留上部维护开口的独立沟壁", x, .2, 0, .06, .27, 14, stone));
  for (const z of [-5, -1, 3, 6]) parts.push(box("电缆沟内不占据走行限界的独立密封接线匣", 2.18, .18, z, .28, .1, .4, steel));
  return parts;
}

function rackRailTrack(): ModelPart[] {
  const parts: ModelPart[] = [box("梯齿条铁路完整落地道床", 0, .09, 0, 3.2, .18, 12, ballast)];
  const sleepers: Triple[] = [], teeth: Triple[] = [], feet: Triple[] = [], bolts: Triple[] = [];
  for (let index = 0; index < 20; index++) {
    const z = -5.7 + index * .6;
    sleepers.push([0, .225, z]); feet.push([0, .35, z]);
    for (const x of [-halfGauge, halfGauge]) for (const side of [-1, 1]) bolts.push([x + side * .105, .285, z]);
  }
  for (let index = 0; index < 64; index++) teeth.push([0, .52, -5.8275 + index * .185]);
  parts.push(...boxBatch("承接两钢轨与中央齿条牵引力的独立横枕", stone, sleepers, [2.65, .09, .23]), ...boxBatch("将中央齿条底架真正固定到每根横枕上的实体短座", dark, feet, [.42, .17, .14]), ...boxBatch("中央梯齿条留有真实啮合空隙的独立横齿", railHead, teeth, [.28, .08, .055]), ...boxBatch("走行轨底翼缘两侧真正压接横枕的独立扣板", dark, bolts, [.085, .035, .14]));
  for (const side of [-1, 1]) parts.push(...railPath("登山铁路独立承重钢轨", [[side * halfGauge, -6], [side * halfGauge, 6]]), box("实际接住横齿两端的连续齿条侧槽梁", side * .16, .48, 0, .045, .16, 12, steel), box("中央齿条侧槽梁的低位支承底翼缘", side * .16, .41, 0, .09, .035, 12, steel));
  for (const z of [-4.5, -.5, 3.5]) parts.push(box("齿条侧槽梁连接处的独立外侧接续板", -.19, .49, z, .025, .13, .32, dark), box("相对侧槽梁连接处的独立接续板", .19, .49, z, .025, .13, .32, dark));
  return parts;
}

function locomotiveAshPit(): ModelPart[] {
  const parts: ModelPart[] = [box("落灰地沟完整耐火坑底", 0, .1, 0, 4, .2, 15, stone), box("坑端敞口之外真正接通沟底和侧灰场的低位清灰庭", 1.275, .1, 8.25, 6.55, .2, 1.5, ballast), box("灰坑一侧接入低位坑端清灰庭的完整作业场", 2.65, .1, 3.8, 3.8, .2, 7.4, ballast), box("清灰通行路线旁真正接地的耐火灰渣存放坪", 4.05, .24, 5.4, 2, .28, 3.8, dark)];
  const columns: Triple[] = [], shoes: Triple[] = [], anchors: Triple[] = [];
  for (const x of [-halfGauge, halfGauge]) {
    parts.push(box("沿坑边承柱纵向连续并留出中央落灰空口的底座", x, .24, 0, .42, .28, 12.6, stone));
    for (const z of [-6, -3.6, -1.2, 1.2, 3.6, 6]) { columns.push([x, .72, z]); shoes.push([x, 1.17, z]); for (const side of [-1, 1]) anchors.push([x + side * .11, 1.25, z]); }
    parts.push(...railPath("落灰坑之上始终连续的独立承重钢轨", [[x, -7.5], [x, 7.5]], 1.24), box("坑侧沿整段承托柱顶与钢轨的连续钢纵梁", x, 1.105, 0, .16, .23, 12.7, steel));
  }
  parts.push(...boxBatch("灰坑两侧从独立基础接到承轨纵梁的实体短柱", steel, columns, [.14, .96, .18]), ...boxBatch("纵梁上真正接承钢轨底翼缘的独立承轨垫座", dark, shoes, [.38, .16, .28]), ...boxBatch("承轨垫座两侧不占据走行面的独立扣板", steel, anchors, [.09, .04, .16]));
  for (const side of [-1, 1]) {
    parts.push(box("中央落灰坑以外保留敞口的完整低挡墙", side * 1.85, .67, 0, .3, 1.14, 15, stone));
    for (const [a, b] of side < 0 ? [[-7.5, 3.9], [6.3, 7.5]] : [[-7.5, 7.5]]) parts.push(box("实际嵌接坑墙且避开下沟楼梯的独立窄工作步道", side * 1.335, 1.17, (a! + b!) / 2, .8, .14, b! - a!, stone));
    for (const z of [-6.9, 6.9]) parts.push(box("坑端只承接独立钢轨而留空沟底通道的耐火枕座", side * halfGauge, .72, z, .45, 1.04, .65, stone));
    for (const z of [-6.4, -1.5, 3.5, 7]) parts.push(rail([side * 1.98, 1.24, z], [side * 1.98, 2.2, z], .06, steel));
    parts.push(rail([side * 1.98, 2.2, -7.5], [side * 1.98, 2.2, 7.5], .06, steel));
  }
  parts.push(box("灰坑前端与两侧挡墙实接的后围墙", 0, .67, -7.35, 3.7, 1.14, .3, stone), box("沟底沿灰渣落点一侧一直通向坑端清灰庭的独立通道", .2, .23, 2.35, .58, .06, 10.7, stone));
  for (let step = 0; step < 6; step++) parts.push(box("从沟底逐级上升且最上级实接工作步道的独立清灰踏步", -1.3, .2 + (step + 1) * 1.04 / 12, 4.1 + step * .4, .7, (step + 1) * 1.04 / 6, .4, stone));
  parts.push(box("灰渣坪前侧不占据清灰通路的低挡边", 4.05, .57, 3.6, 2, .4, .12, stone), box("灰渣坪外侧实接作业坪的耐火挡墙", 5.01, .57, 5.4, .12, .4, 3.8, stone));
  return parts;
}
