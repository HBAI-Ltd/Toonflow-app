import { part, type ModelPart, type Triple } from "../assetModelParts";
import { base, box, colors, cylinder, design, pipe, rail } from "./structures";
import { barrelRoof } from "./spatialShells";

// 完整大型空间，复用原语而不组合已有完整资产计主。
// 生态桥构造依据 FHWA Wildlife Crossing Structures Handbook：连续土层、遮光边界与导向围护。
// https://www.fhwa.dot.gov/clas/ctip/wildlife_crossing_structures/appendices.aspx
// 浮码头的连续登乘通路参考 https://www.access-board.gov/ada/guides/chapter-10-boating-facilities/
// 原创简化场景模型，不作为工程规格或无障碍验收依据。
const grass = "#8c9a70", dark = "#536664";

function tube(name: string, points: Triple[], radius: number, color = colors.metal): ModelPart {
  return part(name, "tube", color, [0, 0, 0], [1, 1, 1], [0, 0, 0], { radius, path: points.map(([x, y, z]) => ({ x, y, z })) });
}

function edgeRails(x: number, start: number, end: number, floor: number): ModelPart[] {
  return [...[.45, .85, 1.2].map(h => pipe("完整连续步行桥护栏", [x, floor + h, start], [x, floor + h, end], h === 1.2 ? .07 : .035)), ...Array.from({ length: 9 }, (_, i) => pipe("桥面护栏落地立柱", [x, floor, start + (end - start) * i / 8], [x, floor + 1.2, start + (end - start) * i / 8], .06))];
}

function section(name: string, points: [number, number][], width: number, x: number, color: string): ModelPart {
  return part(name, "extrude", color, [x, 0, 0], [1, 1, 1], [0, 90, 0], { depth: width, profile: points.map(([z, y]) => ({ x: -z, y })) });
}

export const landscapeSpaceBatchTwoDesigns = [
  design("覆土导向式生态跨线桥", "宽阔连续原土桥面跨过下方两条真实通车净空，厚土层与两侧遮光墙保护动物通行，桥面没有公共游览设施", () => [
    ...[-1, 1].map(s => box("桥端完整承土桥台", s * 18, 3.8, 0, 2, 7.6, 70)),
    box("中间双孔分界承墩", 0, 3.8, 0, 1.3, 7.6, 70),
    box("跨过两孔的厚桥面承重板", 0, 8.15, 0, 38, 1.1, 70),
    box("连续跨线的两米深原土层", 0, 9.7, 0, 38, 2, 70, colors.earth),
    box("动物过桥的连续低草层", 0, 10.75, 0, 38, .1, 70, grass),
    ...[-1, 1].map(s => box("桥面外缘连续遮光挡噪墙", 0, 11.9, s * 34.8, 38, 2.4, .4, colors.wood)),
    ...[-1, 1].map(s => part("连接地形的整块缓坡土体", "extrude", colors.earth, [s * 29, 0, 0], [1, 1, 1], [0, 0, 0], { depth: 70, profile: s === 1 ? [{ x: -10, y: 0 }, { x: 10, y: 0 }, { x: -10, y: 10.7 }] : [{ x: -10, y: 0 }, { x: 10, y: 0 }, { x: 10, y: 10.7 }] })),
    ...[-1, 1].map(s => part("沿坡连接两端地面的草皮", "box", grass, [s * 29, 5.4, 0], [22.7, .1, 70], [0, 0, -s * 28.15])),
    ...[-1, 1].flatMap(s => [-1, 1].map(z => rail([s * 19, 11.3, z * 34.8], [s * 38.5, .8, z * 40], .15, colors.wood))),
    ...[-1, 1].flatMap(s => [-1, 1].map(z => box("导向围护远端入土锚柱", s * 38.5, .8, z * 40, .22, 1.6, .22, colors.wood))),
    ...[-1, 1].map(s => part("桥面边侧连接原土的粗木隐蔽条", "cylinder", colors.wood, [s * 10, 11, s * 26], [.6, 9, .6], [0, 0, 90])),
  ], "建筑", "现代"),
  design("双塔扇索斜拉观景步桥", "两座A形主塔通过独立斜拉索直接托住刚性步行桥面，桥面两侧箱梁闭合刚度，区别于主缆抛物线的悬索桥", () => {
    const parts: ModelPart[] = [box("贯通两岸的步行桥面", 0, 5.2, 0, 5.2, .4, 50), ...[-1, 1].map(s => box("桥面下连续侧箱梁", s * 2.3, 4.85, 0, .45, .65, 50, colors.metal)), ...edgeRails(-2.5, -25, 25, 5.4), ...edgeRails(2.5, -25, 25, 5.4)];
    for (const z of [-12, 12]) {
      parts.push(...[-1, 1].map(s => box("A塔两侧独立基础", s * 4, .5, z, 1.8, 1, 2)), ...[-1, 1].map(s => rail([s * 4, 1, z], [0, 17, z], .45, colors.metal)), box("A塔在桥面下的横向联梁", 0, 4.6, z, 6.5, .4, .55, colors.metal));
      for (const direction of [-1, 1]) for (const offset of [3, 6.5, 10]) for (const s of [-1, 1]) parts.push(pipe("独立承托刚性桥面的扇形斜拉索", [0, 16.6, z], [s * 2.3, 5.4, z + direction * offset], .055));
    }
    parts.push(...[-1, 1].map(s => box("两岸桥头竖向支墩", 0, 2.4, s * 24.3, 6, 4.8, 1.4)), ...[-1, 1].map(s => cylinder("桥头横向位移转动支承", 0, 4.9, s * 24.3, .28, 4, colors.metal, [0, 0, 90])));
    return parts;
  }, "建筑", "现代"),
  design("双层湿地观鸟隐蔽楼", "上下两层观察室以前低后高的狭长窥视槽观察湿地，侧置折返楼梯连接高层而非把普通瞭望塔换皮", () => {
    const parts: ModelPart[] = [base(10, 7, .3), box("上层观鸟室完整楼板", 0, 3.2, 0, 9, .2, 6, colors.wood), box("顶部连续平顶防雨层", 0, 6, 0, 9.8, .18, 6.8, colors.roof)];
    for (const floor of [.3, 3.3]) {
      parts.push(box("面对湿地的下部遮蔽实墙", 0, floor + .55, -3, 9, 1.1, .16, colors.wood), box("窥视槽上方遮蔽墙", 0, floor + 2.1, -3, 9, 1.2, .16, colors.wood), box("窥视槽内侧宽托肘板", 0, floor + 1.13, -2.8, 8.6, .06, .42, colors.wood));
      parts.push(...[-1, 1].map(s => box("观察室两端完整侧墙", s * 4.4, floor + 1.35, 0, .18, 2.7, 6, colors.wood)), ...[-1, 1].map(s => box("背墙避开中央出入门的实墙", s * 2.8, floor + 1.35, 3, 3.4, 2.7, .16, colors.wood)), box("背部出入门上方门楣", 0, floor + 2.5, 3, 2.2, .4, .16, colors.wood));
      parts.push(...[-2.6, 0, 2.6].flatMap(x => [box("观察长凳座面", x, floor + .47, -1.8, 2.2, .08, .42, colors.wood), ...[-1, 1].map(s => box("观察凳支脚", x + s * .8, floor + .22, -1.8, .08, .44, .32, colors.wood))]));
    }
    parts.push(box("外部折返梯中段平台", 2, 1.8, 4.6, 4.2, .2, 1.4, colors.wood), ...[-1, 1].flatMap(x => [-1, 1].map(z => box("折返梯平台落地承柱", 2 + x * 1.8, .85, 4.6 + z * .5, .12, 1.7, .12, colors.wood))));
    for (let i = 0; i < 8; i++) parts.push(box("下段独立上升楼梯踏步", 3, (.3 + (i + 1) * .1875) / 2, 6.9 - i * .25, 1.2, .3 + (i + 1) * .1875, .27, colors.wood), box("上段折返上升楼梯踏步", 1, 1.9 + (i + 1) * .175 / 2, 4.9 - i * .25, 1.2, (i + 1) * .175, .27, colors.wood));
    parts.push(...[-1, 1].map(s => rail([1 + s * .45, 1.9, 5], [1 + s * .45, 3.15, 3.1], .12, colors.wood)));
    parts.push(rail([3.66, 1.2, 7], [3.66, 2.7, 5.15], .065, colors.wood), rail([.34, 2.8, 5], [.34, 4.2, 3.05], .065, colors.wood));
    return parts;
  }, "建筑", "现代"),
  design("移乘滚道式皮艇下水浮码头", "U形浮台中央保留皮艇水道，侧移乘台和双扶杆把人从轮椅高度转到艇内，岸侧宽跳板接到连续浮台", () => {
    const parts: ModelPart[] = [box("浮台后部连续转身平台", 0, .9, 3.8, 7, .2, 3, colors.wood), ...[-1, 1].map(s => box("中央下水槽两侧步行指廊", s * 2.45, .9, -.1, 2.1, .2, 5, colors.wood)), ...[-1, 1].map(s => part("支撑指廊的封闭浮力筒", "cylinder", dark, [s * 2.45, .38, .5], [.72, 8, .72], [90, 0, 0])), ...[-1, 1].map(s => box("浮台下贯通横向承梁", 0, .72, s * 2.2 + 1, 6.5, .16, .18, colors.metal))];
    parts.push(box("侧移乘台抬高平座", 1.24, 1.22, .1, .85, .12, 1.6, colors.wood), ...[-.55, .55].map(z => tube("移乘座旁完整U形抓扶杆", [[1.5, 1, z], [1.5, 1.8, z], [.85, 1.8, z], [.85, 1.28, z]], .035)), ...[-1, 1].map(s => box("移乘台实际底部支承", 1.6, 1.07, s * .55, .1, .25, .15, colors.metal)));
    for (let i = 0; i < 7; i++) parts.push(cylinder("沿下水方向滚动的低位托艇辊", 0, .66 - i * .045, 1.5 - i * .6, .16, 1.2, colors.metal, [0, 0, 90]));
    parts.push(...[-1, 1].map(s => rail([s * .59, .68, 1.5], [s * .59, .4, -2.1], .09)), ...[-1, 1].map(s => box("防浮台横移的导向套柱", s * 3.8, 1.35, 3.6, .16, 2.7, .16, colors.metal)), ...[-1, 1].map(s => box("接到导向套柱的浮台侧耳", s * 3.55, .9, 3.6, .6, .18, .3, colors.metal)));
    parts.push(part("接岸连续宽跳板", "box", colors.wood, [0, 1.35, 9], [2, .13, 7.7], [-6.7, 0, 0]), ...[-1, 1].map(s => rail([s * .94, 2.02, 5.2], [s * .94, 2.92, 12.8], .06)), ...[-1, 1].map(s => box("跳板岸端独立锚台", s * .75, .9, 12.7, .5, 1.8, .75)));
    parts.push(...[-1, 1].flatMap(s => [[5.2, .94], [12.8, 1.84]].map(([z, y]) => pipe("跳板扶手两端立柱", [s * .94, y!, z!], [s * .94, y! + 1.08, z!], .05))));
    return parts;
  }, "建筑", "现代"),
  design("地下三券柱廊蓄水室", "厚壁蓄水槽上方是三道连续筒券和两列承柱，抬高检修廊从高于蓄水线的门洞进入，室内真实贯通而非实心地下盒子", () => {
    const parts: ModelPart[] = [base(11, 19, .35), box("蓄水室两米以下的静态水面", 0, 1.35, 0, 10, .035, 17.7, colors.water), ...[-1, 1].map(s => box("蓄水室纵向完整厚墙", s * 5.15, 2.78, 0, .4, 4.85, 18.5)), box("蓄水室后侧封闭厚墙", 0, 2.78, 9.1, 10.7, 4.85, .4), box("前侧低于检修门的连续挡水墙", 0, .95, -9.1, 10.7, 1.2, .4)];
    parts.push(...[-1, 1].map(s => box("前侧检修门两边厚墙", s * 3.2, 3.4, -9.1, 4.25, 3.6, .4)), box("检修门上方完整石楣", 0, 4.95, -9.1, 2.2, .5, .4));
    for (const x of [-1.72, 1.72]) for (const z of [-7.2, -3.6, 0, 3.6, 7.2]) parts.push(cylinder("柱脚承压石础", x, .55, z, .9, .4), cylinder("直接承接筒券的通高石柱", x, 2.95, z, .43, 4.4), box("横向分散券脚压力的柱头", x, 5.05, z, .9, .3, .9));
    for (const x of [-3.44, 0, 3.44]) parts.push(barrelRoof("沿室长贯通的独立石砌筒券", 1.72, .22, 18.5, [x, 5.2, 0], colors.stone));
    parts.push(box("水线上方横向检修廊板", 0, 2.13, -8.5, 9.8, .14, .8, colors.wood), pipe("检修廊内侧连续扶手", [-4.7, 3.2, -8.05], [4.7, 3.2, -8.05], .055));
    parts.push(...[-4.7, 0, 4.7].map(x => pipe("检修廊护栏实际立柱", [x, 2.2, -8.05], [x, 3.2, -8.05], .05)));
    for (let i = 0; i < 7; i++) parts.push(box("从室外上升到高位检修门的石阶", 0, (i + 1) * .3 / 2, -12.7 + i * .5, 1.9, (i + 1) * .3, .52));
    parts.push(box("检修门与内部廊板连续连接台", 0, 2.12, -9.28, 1.9, .16, 1.2, colors.wood));
    return parts;
  }, "建筑", "欧式"),
  design("两级折向溢洪消力坡", "高位入口先沿短阶梯泄流，在中间宽池折向后再次跌落，末端深消力池和错列消力墩吸收水流能量，水面仅为静态示意", () => {
    const parts: ModelPart[] = [];
    const upper: [number, number][] = [[-12.65, 0], [-12.65, 11.1], [-2.25, 6.7], [-2.25, 0]];
    for (let i = 0; i < 8; i++) {
      const z = -12 + i * 1.3, h = 10 - i * .55;
      parts.push(box("第一段逐级下降的完整混凝土阶床", 0, h / 2, z, 6, h, 1.32), box("第一段各阶面静态浅水", 0, h + .04, z, 5.55, .035, 1.3, colors.water));
    }
    parts.push(section("上段左侧连续斜顶挡水墙", upper, .22, -3, colors.stone), section("上段右侧连续斜顶挡水墙", upper, .22, 3, colors.stone));
    parts.push(box("中间折流池完整承台", 0, 2.95, 0, 6.2, 5.9, 4.6), box("折流池上方开放水面", 0, 5.97, 0, 5.7, .035, 4.1, colors.water), box("折流池封住正向的撞水端墙", 0, 6.35, 2.2, 6.2, 1, .25), box("折流池背向侧墙", -3, 6.35, .1, .25, 1, 4.6));
    const lower: [number, number][] = [[2.8, 0], [2.8, 6.8], [12.7, 2.5], [12.7, 0]];
    for (let i = 0; i < 7; i++) {
      const x = 3.6 + i * 1.4, h = 5.7 - i * .65;
      parts.push(box("转向后第二段逐级下落的阶床", x, h / 2, 0, 1.42, h, 4), box("第二段各阶面静态浅水", x, h + .04, 0, 1.4, .035, 3.55, colors.water));
    }
    for (const s of [-1, 1]) { const p = section("下段两侧连续斜顶挡水墙", lower, .22, 0, colors.stone); p.rotation.y = 180; p.position.z = s * 2; parts.push(p); }
    parts.push(box("末端深消力池连续底板", 16, .12, 0, 6.2, .24, 6), ...[-1, 1].map(s => box("消力池两侧完整护墙", 16, 1.05, s * 2.9, 6.2, 1.86, .2)), box("末端排水低堰", 19, .53, 0, .2, .82, 6), box("深池内静态水面", 16, 1.15, 0, 5.8, .035, 5.55, colors.water), ...[-1, 1].map(s => box("池内独立错列消力墩", 14.7 + s * .3, .7, s * 1.15, .65, 1.1, .7)));
    return parts;
  }, "建筑", "现代"),
];
