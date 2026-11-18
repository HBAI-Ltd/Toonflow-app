import { part, ring, type ModelPart, type Triple } from "../assetModelParts";
import { base, box, colors, cylinder, design, pipe, rail, slats } from "./structures";
import { tapered } from "../masterNature/shared";

// 构造参照：National Trust 的 ha-ha 说明、FHWA Std619 牛栅和 RHS 活柳构筑指南。
// https://www.nationaltrust.org.uk/discover/history/gardens-landscapes/what-is-a-ha-ha
// https://highways.dot.gov/federal-lands/std-drawings/Std619.pdf
// https://www.rhs.org.uk/garden-features/living-willow
// 以下均为原创米制场景构件，不是结构施工图，也不内置水流/植物生长模拟。
const willow = "#7f8259", brick = "#ae8467", foliage = "#809064";

function pathTube(name: string, points: Triple[], radius: number, color = colors.wood): ModelPart {
  return part(name, "tube", color, [0, 0, 0], [1, 1, 1], [0, 0, 0], { radius, path: points.map(([x, y, z]) => ({ x, y, z })) });
}

function planBlock(name: string, outline: [number, number][], height: number, y: number, color = colors.stone): ModelPart {
  return part(name, "extrude", color, [0, y + height / 2, 0], [1, 1, 1], [-90, 0, 0], { depth: height, profile: outline.map(([x, z]) => ({ x, y: -z })) });
}

function guardRail(x: number, z0: number, z1: number, floor: number): ModelPart[] {
  return [pipe("栏杆连续上扶手", [x, floor + 1.1, z0], [x, floor + 1.1, z1], .055), ...[0, .5, 1].map(t => pipe("承接扶手的独立立柱", [x, floor, z0 + (z1 - z0) * t], [x, floor + 1.1, z0 + (z1 - z0) * t], .055)), ...[.38, .72].map(h => pipe("栏内水平护杆", [x, floor + h, z0], [x, floor + h, z1], .025))];
}

export const landscapeSpaceBatchOneDesigns = [
  design("干砌石墙跨墙石蹬", "交错伸出的长踏石贯穿墙身，左右各有独立石级，供人跨墙而不为牲畜留门洞", () => [
    ...Array.from({ length: 4 }, (_, row) => Array.from({ length: row % 2 ? 5 : 4 }, (_, i) => box("错缝砌筑墙石", (i - (row % 2 ? 2 : 1.5)) * .65, .15 + row * .3, 0, .62, .3, .48, colors.stone))).flat(),
    ...[0, 1, 2].map(i => box("穿透墙体并向两边悬挑的踏石", 0, .25 + i * .35, 0, .66, .1, 1.6 - i * .24)),
    ...[-1, 1].map(s => box("墙外独立起步石", 0, .08, s * 1.05, .72, .16, .45)),
    cylinder("供跨越时握持的单根木桩", -.58, .86, 0, .12, 1.72, colors.wood),
  ], "设施", "欧式"),
  design("环转防畜便门", "半圆固定围栏包住一扇径向摆门，人在弧内换位后开另一侧出口，通道不直接贯通供牲畜冲出", () => {
    const radius = 1.05;
    return [
      ...[0, 1, 2, 3, 4, 5, 6].map(i => cylinder("半圆固定围栏立柱", Math.cos(i * Math.PI / 6) * radius, .65, Math.sin(i * Math.PI / 6) * radius, .085, 1.3, colors.metal)),
      ...[.35, .7, 1.1].map(y => pathTube("半圆围合连续横杆", Array.from({ length: 13 }, (_, i) => [Math.cos(i * Math.PI / 12) * radius, y, Math.sin(i * Math.PI / 12) * radius] as Triple), .025, colors.metal)),
      cylinder("摆门独立铰轴", 0, .67, 0, .1, 1.34, colors.metal),
      ...[.22, .65, 1.08].map(y => pipe("活动门径向横档", [0, y, 0], [.96, y, 0], .04)),
      ...[.32, .64, .96].map(x => pipe("活动门竖档", [x, .22, 0], [x, 1.08, 0], .03)),
      ...[-1, 1].map(s => box("弧栏端部固定门止", s * 1.08, .9, 0, .1, .18, .12, colors.metal)),
    ];
  }, "设施", "现代"),
  design("牲畜隔离格栅沟", "间隔横钢轨跨在真实下凹沟口上，车辆可通过而牲畜缺少连续踏足面，端翼把围栏引至栅边", () => [
    box("牛栅沟槽底板", 0, .06, 0, 3.6, .12, 2.4),
    ...[-1, 1].map(s => box("承托横格的边墙", s * 1.72, .33, 0, .16, .54, 2.4)),
    ...[-1, 1].map(s => box("牛栅前后端承台", 0, .32, s * 1.17, 3.6, .52, .16)),
    ...Array.from({ length: 12 }, (_, i) => cylinder("实际搭在纵向托梁上并保留踏空间隙的横钢轨", 0, .65, -1.05 + i * .19, .105, 3.4, colors.metal, [0, 0, 90])),
    ...[-1, 1].map(s => box("横轨下方纵向托梁", s * 1.05, .54, 0, .12, .12, 2.3, colors.metal)),
    ...[-1, 1].flatMap(s => [pipe("围栏端翼下弦", [s * 1.8, .65, -.95], [s * 2.35, .65, -1.5], .07), pipe("围栏端翼上弦", [s * 1.8, 1.8, -.95], [s * 2.35, .65, -1.5], .07), cylinder("端翼内侧立柱", s * 1.8, 1.22, -.95, .085, 1.15)]),
  ], "设施", "现代"),
  design("沉降挡牧景观壕", "一侧垂直挡土墙接高草坪，另一侧连续斜坡从低沟底回到同高草地，形成不高出视线的防畜边界", () => [
    box("高侧草坪下完整土层", 0, .75, -1.9, 6, 1.5, 1.8, colors.earth),
    box("高侧草坪表层", 0, 1.53, -1.9, 6, .06, 1.8, foliage),
    box("垂直挡牧石墙", 0, .8, -.94, 6, 1.6, .22),
    box("暴露的低沟底", 0, .06, -.35, 6, .12, .95, colors.earth),
    part("逐渐回升的完整草坡土体", "extrude", colors.earth, [0, 0, 0], [1, 1, 1], [0, 90, 0], { depth: 6, profile: [{ x: -.1, y: 0 }, { x: -2.7, y: 0 }, { x: -2.7, y: 1.5 }, { x: -.1, y: .12 }] }),
    part("坡面连续薄草层", "box", foliage, [0, .84, 1.4], [6, .055, 2.94], [-28, 0, 0]),
    box("低侧平齐草坪", 0, 1.53, 3.2, 6, .06, 1),
    box("低侧草坪下土层", 0, .75, 3.2, 6, 1.5, 1, colors.earth),
  ], "设施", "欧式"),
  design("曲折自稳单砖花墙", "薄砖墙沿蛇形平面连续弯曲，自身波形扩大侧向稳定宽度，区别于直墙添加扶壁或贴蛇形花纹", () => {
    const outline: [number, number][] = Array.from({ length: 15 }, (_, i) => [-3 + i * 6 / 14, Math.sin(i * Math.PI / 7) * .55 + .065]);
    outline.push(...Array.from({ length: 15 }, (_, i): [number, number] => { const t = 14 - i; return [-3 + t * 6 / 14, Math.sin(t * Math.PI / 7) * .55 - .065]; }));
    return [planBlock("真实贯通弯曲平面的单砖厚墙", outline, 1.6, 0, brick), planBlock("与墙身同路径的连续压顶", outline.map(([x, z]) => [x, z * 1.07]), .08, 1.6, "#c19977")];
  }, "构件", "欧式"),
  design("双股交织柳枝栅垣", "柔柳横枝交替穿过独立木桩，前后起伏在交点可见，通孔保持开放，不是已覆泥墙的颜色版本", () => [
    ...Array.from({ length: 7 }, (_, i) => cylinder("插入地面的柳篱木桩", -1.5 + i * .5, .65, 0, .055, 1.3, colors.wood)),
    ...Array.from({ length: 14 }, (_, row) => tapered("交替绕过前后桩面的连续编枝", willow, Array.from({ length: 25 }, (_, i) => [-1.5 + i * 3 / 24, .1 + row * .08, Math.cos(i * Math.PI / 2 + row * Math.PI) * .055] as Triple), Array(25).fill(.018))),
    ...[-1, 1].map(s => pathTube("边端绕桩锁住的回折枝", [[s * 1.5, .13, -.055], [s * 1.58, .16, 0], [s * 1.5, .2, .055]], .014, willow)),
  ], "构件", "欧式"),
  design("开孔树池格栅围椅", "四向坐面跨在围合框架上，中间为真实通土树穴，细格栅连接坐面与树根区但没有一块堵住树穴的底盘", () => [
    ...[-1, 1].flatMap(s => [box("环树长坐面", s * 1.2, .47, 0, .46, .07, 2.9, colors.wood), box("环树短坐面", 0, .47, s * 1.2, 1.95, .07, .46, colors.wood)]),
    ...[-1, 1].flatMap(x => [-1, 1].map(z => box("椅框四角落地承脚", x * 1.18, .22, z * 1.18, .09, .44, .09, colors.metal))),
    ...[-1, 1].flatMap(s => [box("坐面下纵向承重梁", s * 1.2, .4, 0, .08, .08, 2.55, colors.metal), box("坐面下横向承重梁", 0, .4, s * 1.2, 2.55, .08, .08, colors.metal)]),
    ...[-1, 1].flatMap(s => [box("低格栅外缘实际落地的连续承载框", s * 1.02, .04625, 0, .07, .0925, 2.11, colors.metal), box("低格栅外缘前后连续承载框", 0, .04625, s * 1.02, 2.11, .0925, .07, colors.metal), box("树穴内缘保留真实通土空孔的承载框", s * .56, .04625, 0, .06, .0925, 1.18, colors.metal), box("树穴内缘前后独立承载框", 0, .04625, s * .56, 1.18, .0925, .06, colors.metal)]),
    ...[-1, 1].flatMap(s => Array.from({ length: 9 }, (_, i) => box("不封住中央树穴的放射格栅", s * .79, .07, -.9 + i * .225, .42, .045, .035, colors.metal))),
    ...[-1, 1].flatMap(s => Array.from({ length: 5 }, (_, i) => box("另两侧格栅短肋", -.45 + i * .225, .07, s * .79, .035, .045, .42, colors.metal))),
  ], "家具", "现代"),
  design("岸边斜撑悬臂观景台", "两侧锚固桩承接向水面挑出的三角支架，木平台前缘不设落水立柱，栏杆围住外挑端并保留后侧入口", () => [
    ...[-1, 1].map(s => box("岸侧独立混凝土锚基", s * 1.25, .6, 1.35, .65, 1.2, .7)),
    ...[-1, 1].flatMap(s => [rail([s * 1.25, 1.45, 1.55], [s * 1.25, 1.45, -2.3], .14), rail([s * 1.25, .3, 1.4], [s * 1.25, 1.45, -1.85], .14)]),
    ...slats("横铺实木观景面板", 16, [0, 1.57, -2.2], [0, 0, .24], [3.1, .1, .22], colors.wood),
    ...guardRail(-1.48, -2.3, 1.3, 1.62), ...guardRail(1.48, -2.3, 1.3, 1.62),
    ...[.38, .72, 1.1].map(h => pipe("外挑端完整横护栏", [-1.48, 1.62 + h, -2.3], [1.48, 1.62 + h, -2.3], h === 1.1 ? .055 : .025)),
  ], "设施", "现代"),
  design("溢流薄膜水墙", "顶端通长窄槽让水膜沿立板落入下方开放回收槽，水膜只是静态半透明薄层，内藏泵不冒充真实流体", () => [
    ...[-1, 1].map(s => box("水墙落地侧墩", s * 1.55, 1.5, 0, .2, 3, .45)),
    box("薄膜背衬石墙", 0, 1.5, .11, 3, 2.85, .16),
    box("顶端溢流槽底", 0, 2.98, -.03, 3.1, .08, .36, colors.metal),
    box("顶槽后挡板", 0, 3.09, .13, 3.1, .16, .045, colors.metal),
    ...[-1, 1].map(s => box("顶槽端封板", s * 1.53, 3.09, -.03, .045, .16, .36, colors.metal)),
    part("沿墙落下的静态连续水膜", "box", colors.water, [0, 1.65, -.04], [2.95, 2.6, .012], [0, 0, 0], { opacity: .43, roughness: .1 }),
    box("回收槽完整底板", 0, .06, -.18, 3.4, .12, 1.05),
    ...[-1, 1].map(s => box("下槽前后挡水边", 0, .25, -.18 + s * .48, 3.4, .38, .09)),
    ...[-1, 1].map(s => box("下槽左右端壁", s * 1.66, .25, -.18, .09, .38, 1.05)),
    box("下槽浅水面", 0, .31, -.2, 3.2, .015, .85, colors.water),
  ], "设施", "现代"),
  design("中心通孔涌泉石球", "球形石壳内保留纵向水孔，下部泵管通向球顶小口，涌水在底部浅盘收集，区别于柱上多层喷泉盆", () => {
    const profile = Array.from({ length: 17 }, (_, i) => { const a = (10 + i * 10) * Math.PI / 180; return { x: Math.sin(a) * .52, y: .58 + Math.cos(a) * .52 }; });
    profile.push({ x: .045, y: profile.at(-1)!.y }, { x: .045, y: profile[0]!.y });
    return [cylinder("石球涌泉浅盘底", 0, .055, 0, 1.6, .11), ring("浅盘完整挡水沿", colors.stone, .8, .07, .2, .26), cylinder("浅盘静态回流水面", 0, .25, 0, 1.42, .015, colors.water), part("中间真实通水孔的球形石体", "lathe", colors.stone, [0, .22, 0], [1, 1, 1], [0, 0, 0], { profile }), ring("球底独立支承圈", colors.stone, .2, .055, .29, .15), cylinder("穿过石球内孔的供水管", 0, .81, 0, .05, 1.1, colors.metal), part("球顶短涌水柱", "cylinder", colors.water, [0, 1.36, 0], [.035, .13, .035], [0, 0, 0], { opacity: .6, roughness: .08 })];
  }, "设施", "现代"),
  design("石板梁墩浅溪汀桥", "大石板横跨一列矮墩，板下是连续分孔净空，荷载经石板弯曲传给矮墩而非拱券或悬索", () => [
    ...[-2.4, -1.2, 0, 1.2, 2.4].map(x => box("落在溪床的矮石墩", x, .3, 0, .38, .6, 1.35)),
    ...[-1.8, -.6, .6, 1.8].map(x => box("跨过两个矮墩的整块石板梁", x, .7, 0, 1.3, .2, 1.22)),
    ...[-1, 1].map(s => box("桥头接岸整块踏台", s * 2.8, .2, 0, .45, .4, 1.55)),
  ], "设施", "欧式"),
  design("交叠木框格室挡土台", "纵横短木错层咬合成开口格室，格内土料与粗骨料共同形成可排水的重力挡土体，正面留出真实格口", () => [
    ...[0, 1, 2, 3].flatMap(row => [-1, 1].map(s => box("沿挡土面横向通长木条", 0, .12 + row * .32, s * .64, 4.6, .16, .18, colors.wood))),
    ...[0, 1, 2, 3].flatMap(row => [-1.95, -.65, .65, 1.95].map(x => box("咬合在横木之间的伸入土体短木", x, .28 + row * .32, 0, .18, .16, 1.55, colors.wood))),
    ...[-1.3, 0, 1.3].map(x => box("格室内真实落底且不封住面孔的回填土", x, .5, .14, 1.04, .92, .75, colors.earth)),
    ...[-1.45, -.35, .8, 1.65].map((x, i) => part("木框前缘透排水块石", "sphere", colors.stone, [x, .19 + i % 2 * .12, -.48], [.4, .27, .32])),
  ], "设施"),
  design("护岸锚桩编枝柴排", "交错枝束形成贴岸透水软排，上下双行木桩与绑索锁住连续柴捆，底部留多孔粗料而不是砌实石堤", () => [
    ...Array.from({ length: 6 }, (_, i) => [-1, 1].map(s => cylinder("把软排固定到岸床的双行木桩", -2.5 + i, .5, s * .6, .09, 1, colors.wood))).flat(),
    ...Array.from({ length: 9 }, (_, row) => ({ ...pipe("顺岸叠紧并与横枝实际咬接的连续枝束", [-2.85, .2 + row % 3 * .06, -.36 + Math.floor(row / 3) * .36], [2.85, .2 + row % 3 * .06, -.36 + Math.floor(row / 3) * .36], .065), color: colors.wood })),
    ...Array.from({ length: 6 }, (_, i) => ({ ...pipe("两端接入木桩并实际托住三列枝束的横向连枝", [-2.5 + i, .14, -.6], [-2.5 + i, .14, .6], .065), color: colors.wood })),
    ...Array.from({ length: 6 }, (_, i) => pathTube("穿过桩头后实际压住整幅枝排的锚缚绳", [[-2.5 + i, .7, -.6], [-2.5 + i, .36, -.36], [-2.5 + i, .36, .36], [-2.5 + i, .7, .6]], .018, colors.metal)),
    ...Array.from({ length: 5 }, (_, i) => part("柴排下方与枝束接触的间隔护脚石", "sphere", colors.stone, [-2 + i, .1, 0], [.55, .2, .35])),
  ], "设施"),
  design("螺旋香草石垄", "可绕行的石砌螺旋垄从外圈低位升向中心高位，升高的是连续种植带，不以盆栽数量或植物品种扩目录", () => {
    const parts: ModelPart[] = [];
    for (let i = 0; i < 28; i++) {
      const a = i / 27 * Math.PI * 3.3, r = 1.9 - i / 27 * 1.55, y = .15 + i / 27 * 1.15;
      parts.push(part("沿螺旋逐渐升高的石砌竖垄", "box", colors.stone, [Math.cos(a) * r, y / 2, Math.sin(a) * r], [.4, y, .2], [0, -a * 180 / Math.PI + 90, 0]));
      if (i % 2 === 0) parts.push(part("各标高内侧连成种植带的土块", "box", colors.earth, [Math.cos(a) * (r - .17), y * .475, Math.sin(a) * (r - .17)], [.38, y * .95, .24], [0, -a * 180 / Math.PI + 90, 0]));
    }
    return parts;
  }, "设施"),
  design("钥匙孔堆肥种植床", "圆床中留可进入中心的狭窄径口，中心透孔堆肥篮与周围种植土相接，截面不是整圆实心花盆", () => {
    const outer: [number, number][] = Array.from({ length: 19 }, (_, i) => { const a = (.17 + i / 18 * 1.66) * Math.PI; return [Math.sin(a) * 1.6, -Math.cos(a) * 1.6]; });
    outer.push([-.28, -.12], [.28, -.12]);
    return [planBlock("带径口的真实马蹄形种植土床", outer, .62, 0, colors.earth), ...Array.from({ length: 18 }, (_, i) => { const a = (.17 + i / 17 * 1.66) * Math.PI; return part("外环独立挡土砌石", "box", colors.stone, [Math.sin(a) * 1.64, .34, -Math.cos(a) * 1.64], [.46, .68, .16], [0, -a * 180 / Math.PI, 0]); }), ...[-1, 1].map(s => box("通向中心的径口侧边挡板", s * .29, .32, -.83, .075, .64, 1.4, colors.wood)), ...Array.from({ length: 12 }, (_, i) => { const a = i * Math.PI / 6; return cylinder("中心堆肥篮透孔竖枝", Math.cos(a) * .25, .48, Math.sin(a) * .25 + .05, .025, .96, colors.wood); }), ...[.1, .42, .75, .93].map(y => { const p = ring("堆肥篮编织固定环", colors.wood, .27, .018, y, .025); p.position.z = .05; return p; })];
  }, "设施"),
  design("下凹树池可拆护盖", "方形人行侧板围住可见的下凹种植空腔，中央树孔与进水边沟均真实留空，雨水从路边缺口进入根区", () => [
    ...[-1, 1].flatMap(s => [box("树穴左右完整支承边梁", s * 1.13, .3, 0, .18, .6, 2.4), box("树穴前后完整支承边梁", 0, .3, s * 1.13, 2.4, .6, .18)]),
    box("根系区低位种植土面", 0, .1, 0, 2.05, .2, 2.05, colors.earth),
    ...[-1, 1].flatMap(s => Array.from({ length: 9 }, (_, i) => box("可拆护盖左右实际搭入外边梁的承载格肋", s * .79, .6275, -.98 + i * .245, .54, .055, .035, colors.metal))),
    ...[-1, 1].flatMap(s => Array.from({ length: 5 }, (_, i) => box("避开中央树孔并实际搭入前后边梁的短格肋", -.48 + i * .24, .6275, s * .79, .035, .055, .54, colors.metal))),
    ...[-1, 1].map(s => box("真实落在前梁上并向内导流的短口边", s * .68, .69, -1.26, .86, .18, .15)),
    ...[-1, 1].map(s => box("树孔内侧不接触树干的框条", s * .5, .63, 0, .045, .055, 1.02, colors.metal)),
    ...[-1, 1].map(s => box("树孔内侧完整横框条", 0, .63, s * .5, 1.02, .055, .045, colors.metal)),
  ], "设施", "现代"),
  design("分舱传粉昆虫旅馆", "独立屋形框分成泥砖孔、竹筒、层叠木缝与干枝格，所有通孔和巢缝可见，不把孔洞画成黑点", () => {
    const parts: ModelPart[] = [box("昆虫旅馆后背板", 0, .85, .2, 1.2, 1.5, .055, colors.wood), ...[-1, 1].map(s => box("巢箱外侧承边", s * .58, .85, 0, .075, 1.5, .45, colors.wood)), ...[.1, .6, 1.05, 1.6].map(y => box("巢室水平承板", 0, y, 0, 1.2, .055, .45, colors.wood)), ...[-1, 1].map(s => part("保护巢室的斜屋盖", "box", colors.roof, [s * .34, 1.75, 0], [.8, .055, .6], [0, 0, -s * 27])), ...[-1, 1].map(s => box("旅馆落地短腿", s * .48, .07, .08, .09, .14, .28, colors.wood))];
    for (let i = 0; i < 15; i++) { const p = ring("后端实际固定到背板且前方开放的竹筒巢孔", willow, .05, .009, 0, .34); p.position = { x: -.43 + i % 5 * .215, y: .19 + Math.floor(i / 5) * .12, z: .02 }; p.rotation.x = 90; parts.push(p); }
    parts.push(...Array.from({ length: 5 }, (_, i) => box("两侧及后端实际固定到箱框且留窄巢缝的木片", 0, .66 + i * .075, 0, 1.12, .035, .4, colors.wood)));
    for (let i = 0; i < 10; i++) { const p = ring("后端固定到背板且前方保留内孔的泥管巢孔", brick, .065, .025, 0, .32); p.position = { x: -.42 + i % 5 * .21, y: 1.2 + Math.floor(i / 5) * .18, z: .02 }; p.rotation.x = 90; parts.push(p); }
    return parts;
  }, "设施"),
  design("轮椅泊位钓鱼平台", "连续低坡板通到水边转身甲板，前缘留较低钓竿托口和下轮挡边，侧面护栏保留轮椅就位净空", () => [
    ...[-1, 1].flatMap(x => [-1, 1].map(z => cylinder("钓台独立水边承桩", x * 1.7, .4, z * 1.3, .17, .8, colors.wood))),
    ...[-1, 1].map(s => box("横向承托甲板的边梁", 0, .78, s * 1.3, 3.8, .16, .15, colors.wood)),
    ...[-1, 1].map(s => box("逐块实际承托整个甲板并搭在承桩上的纵向梁", s * 1.65, .78, 0, .15, .16, 2.95, colors.wood)),
    ...slats("无缝靠接可转身木甲板", 15, [0, .9, -1.4], [0, 0, .2], [3.8, .1, .185], colors.wood),
    part("低坡连续进入板", "box", colors.wood, [0, .48, 3.2], [1.5, .1, 3.7], [13, 0, 0]),
    box("入口坡板远端真实接地的低位托脚", 0, .045, 4.92, 1.5, .09, .25, colors.wood),
    ...[-1, 1].map(s => box("坡道两侧防滑落小挡边", s * .72, .53, 3.2, .055, .1, 3.7, colors.wood)).map(p => ({ ...p, rotation: { x: 13, y: 0, z: 0 } })),
    ...guardRail(-1.85, -1.4, 1.4, .95), ...guardRail(1.85, -1.4, 1.4, .95),
    ...[-1, 1].map(s => box("前缘低位轮挡", s * 1.1, 1.025, -1.48, 1.45, .15, .08, colors.wood)),
    ...[-1, 1].flatMap(s => [pipe("竿托独立支柱", [s * .7, .95, -1.48], [s * .7, 1.45, -1.48], .04), tapered("开放U形钓竿托", colors.metal, [[s * .7 - .07, 1.52, -1.48], [s * .7 - .05, 1.43, -1.48], [s * .7 + .05, 1.43, -1.48], [s * .7 + .07, 1.52, -1.48]], [.015, .015, .015, .015])]),
  ], "设施", "现代"),
  design("缆索张弦攀援幕架", "离墙两端立柱通过交叉预张钢索构成轻透攀援面，底部旋索器与独立锚脚形成实际拉力闭合路径", () => [
    ...[-1, 1].map(s => box("幕架地面独立锚块", s * 1.6, .1, 0, .45, .2, .6)),
    ...[-1, 1].map(s => pipe("两侧悬起攀援面的立柱", [s * 1.6, .2, 0], [s * 1.6, 3, 0], .07)),
    pipe("幕架上端横向压杆", [-1.6, 3, 0], [1.6, 3, 0], .07),
    ...Array.from({ length: 7 }, (_, i) => pipe("纵向张紧钢丝", [-1.5 + i * .5, .3, 0], [-1.5 + i * .5, 3, 0], .012)),
    ...Array.from({ length: 6 }, (_, i) => pipe("横向攀援细索", [-1.6, .5 + i * .48, .012], [1.6, .5 + i * .48, .012], .012)),
    ...[-1, 1].map(s => pipe("对角预张斜索", [s * 1.6, .3, -.02], [-s * 1.6, 3, -.02], .016)),
    ...[-1, 1].flatMap(s => [pipe("后侧独立稳定拉索", [s * 1.6, 2.7, 0], [s * 2, .15, .9], .016), box("后拉索地锚", s * 2, .075, .9, .22, .15, .3), cylinder("竖索下端旋紧器", s * 1.5, .35, 0, .045, .2, colors.metal)]),
  ], "设施", "现代"),
  design("活柳交织穹室", "柔柳长枝从周边插地交错弯向上部，枝拱在顶部真实相连，一面留下人的入口而非把普通树冠挖门", () => {
    const parts: ModelPart[] = [];
    for (let i = 0; i < 10; i++) {
      if (i === 0) continue;
      const a = i / 10 * Math.PI * 2;
      parts.push(pathTube("从周边土地连续弯到穹顶的活柳主枝", [[Math.cos(a) * 1.7, 0, Math.sin(a) * 1.7], [Math.cos(a) * 1.55, 1.15, Math.sin(a) * 1.55], [Math.cos(a + .2) * 1.1, 2.1, Math.sin(a + .2) * 1.1], [Math.cos(a + .35) * .25, 2.65, Math.sin(a + .35) * .25]], .035, willow));
    }
    for (const [y, r] of [[.65, 1.62], [1.3, 1.5], [1.95, 1.22], [2.43, .7]]) {
      parts.push(pathTube("避开入口的交织环向活枝", Array.from({ length: 9 }, (_, i) => { const a = Math.PI * .2 + i / 8 * Math.PI * 1.6; return [Math.cos(a) * r!, y!, Math.sin(a) * r!] as Triple; }), .023, willow));
    }
    parts.push(pathTube("入口上方独立弯枝门弓", [[1.5, 0, -.63], [1.65, 1.35, -.58], [1.65, 1.95, 0], [1.65, 1.35, .58], [1.5, 0, .63]], .035, willow));
    parts.push(ring("穹顶交织固定小环", willow, .25, .035, 2.64, .06));
    return parts;
  }, "建筑", "欧式"),
];
