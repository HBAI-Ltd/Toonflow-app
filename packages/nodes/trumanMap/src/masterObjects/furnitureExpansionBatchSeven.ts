import { part, type ModelPart, type Triple } from "../assetModelParts";
import { box, cylinder, ball, rod, loop, cord, legs, material, type MasterPrototype } from "./parts";
import { curvedBand } from "./furnitureExpansionBatchSix";

export function sweptSeat(name: string, points: [number, number, number][], thickness: number, color: string): ModelPart {
  const vertices: { x: number; y: number; z: number }[] = [], indices: number[] = [], count = points.length;
  const edge = points.map(([z, y, width], index) => {
    const previous = points[Math.max(0, index - 1)]!, next = points[Math.min(count - 1, index + 1)]!, dz = next[0] - previous[0], dy = next[1] - previous[1], factor = thickness / (2 * Math.hypot(dz, dy));
    return [-1, 1].flatMap(side => [-1, 1].map(x => ({ x: x * width, y: y + side * dz * factor, z: z - side * dy * factor })));
  });
  for (const side of [1, 0]) for (const entry of edge) vertices.push(entry[side * 2]!, entry[side * 2 + 1]!);
  for (let row = 0; row < count - 1; row++) { const a = row * 2, b = a + 2, low = count * 2; indices.push(a, b, b + 1, a, b + 1, a + 1, a + low, b + 1 + low, b + low, a + low, a + 1 + low, b + 1 + low); }
  for (const side of [0, 1]) {
    const start = vertices.length;
    for (const entry of edge) vertices.push(entry[2 + side]!, entry[side]!);
    for (let row = 0; row < count - 1; row++) { const a = start + row * 2, b = a + 2; indices.push(...(side ? [a, b, b + 1, a, b + 1, a + 1] : [a, a + 1, b + 1, a, b + 1, b])); }
  }
  for (const [row, reverse] of [[0, false], [count - 1, true]] as const) {
    const start = vertices.length, entry = edge[row]!;
    vertices.push(entry[2]!, entry[3]!, entry[1]!, entry[0]!);
    indices.push(...(reverse ? [start, start + 3, start + 2, start, start + 2, start + 1] : [start, start + 1, start + 2, start, start + 2, start + 3]));
  }
  return part(name, "mesh", color, [0, 0, 0], [1, 1, 1], [0, 0, 0], { vertices, indices });
}

export function bowlShell(name: string, center: Triple, rim: Triple[], thickness: number, color: string): ModelPart {
  const vertices = [center, ...rim, [center[0], center[1] - thickness, center[2]] as Triple, ...rim.map(([x, y, z]): Triple => [x, y - thickness, z])].map(([x, y, z]) => ({ x, y, z })), indices: number[] = [], n = rim.length, lower = n + 1;
  for (let index = 0; index < n; index++) { const a = index + 1, b = (index + 1) % n + 1; indices.push(0, b, a, lower, lower + a, lower + b); }
  const wall = vertices.length;
  for (const [x, y, z] of rim) vertices.push({ x, y, z }, { x, y: y - thickness, z });
  for (let index = 0; index < n; index++) { const a = wall + index * 2, b = wall + (index + 1) % n * 2; indices.push(a, b, b + 1, a, b + 1, a + 1); }
  return part(name, "mesh", color, [0, 0, 0], [1, 1, 1], [0, 0, 0], { vertices, indices });
}

export const furnitureExpansionBatchSevenObjects: MasterPrototype[] = [
  { name: "离散圆垫网架长沙发", theme: "现代", itemType: "家具", build: () => [
    ...legs(1.52, .54, .29, .035),
    ...[-1, 1].map(side => rod("在座面下托起全部圆垫的通长框边", [-.87, .35, side * .25], [.87, .35, side * .25], .025)),
    ...[-.72, -.36, 0, .36, .72].flatMap(x => [rod("从后框立起承托背部圆垫的斜柱", [x, .35, .22], [x, .88, .32], .018), ...[-.17, .17].map(z => ball("单独锁在金属框上的完整圆坐垫", [x, .43, z], [.31, .12, .31], material.red)), ...[.64, .91].map(y => ({ ...cylinder("靠背各自独立的完整圆垫", [x, y, .28 + (y - .64) * .16], [.31, .11, .31], material.ivory, [80, 0, 0]), roughness: .9 }))]),
  ] },
  { name: "套筒空腔组合躺椅", theme: "现代", itemType: "家具", build: () => {
    const parts: ModelPart[] = [];
    for (const [y, z, radius] of [[.25, -.3, .24], [.54, .1, .29], [.78, .43, .2], [.16, .45, .14]]) parts.push(part("真实贯通并以夹扣互联的厚软包套筒", "lathe", material.red, [0, y!, z!], [1, 1, 1], [0, 0, 90], { profile: [{ x: radius! - .06, y: -.33 }, { x: radius!, y: -.33 }, { x: radius!, y: .33 }, { x: radius! - .06, y: .33 }, { x: radius! - .06, y: -.33 }] }));
    parts.push(...[-1, 1].flatMap(side => [rod("把前筒和中筒扣合的端部连片", [side * .34, .26, -.3], [side * .34, .54, .1], .025, material.dark), rod("把中筒和背筒扣合的端部连片", [side * .34, .54, .1], [side * .34, .78, .43], .025, material.dark), rod("从背筒回接落地后筒的端部连片", [side * .34, .78, .43], [side * .34, .16, .45], .025, material.dark)]));
    return parts;
  } },
  { name: "双波嵌合泡棉地榻", theme: "现代", itemType: "家具", build: () => [
    curvedBand("从地面弧起成厚长坐面的下波块", [[-.79, .14], [-.57, .17], [-.23, .28], [.16, .39], [.51, .36], [.79, .21]], 1.21, [0, 0, 0], .25, material.red),
    curvedBand("与下波错开并直接落地承背的上波块", [[-.37, .18], [-.15, .4], [.17, .56], [.48, .76], [.69, .79], [.8, .61]], 1.21, [0, 0, 0], .25, material.ivory),
    ...[-1, 1].flatMap(side => [box("在下波低端隐藏的软胶止滑垫", [side * .45, .013, .75], [.12, .026, .12], material.dark), box("在下波另一端承托整体的短软胶脚", [side * .45, .05, -.78], [.12, .1, .12], material.dark)]),
  ] },
  { name: "多层凹窝软包坐塔", theme: "现代", itemType: "家具", build: () => [
    box("把全部凹窝锁在一起的宽低位底台", [0, .08, 0], [2.02, .16, .85], material.dark),
    ...[-1, 1].map(side => curvedBand("形成通高侧壁而不是贴面的整块软曲梁", [[-.28, .13], [-.34, .53], [-.12, .91], [-.25, 1.34], [-.2, 1.79], [.12, 2.09]], .19, [side * .86, 0, 0], .23, material.red)),
    curvedBand("在底层向内下凹的整体承躺面", [[-.33, .43], [-.16, .31], [.08, .32], [.31, .48]], 1.62, [0, 0, 0], .15, material.red),
    curvedBand("供上层休憩的独立内凹跨梁", [[-.33, 1.23], [-.13, 1.09], [.13, 1.11], [.32, 1.29]], 1.5, [0, 0, 0], .17, material.ivory),
    ...[-1, 1].map(side => box("后方不挡出入而承受上下层的竖直脊板", [side * .61, 1.09, .33], [.13, 1.96, .1], material.dark)),
    rod("最上方连接两侧曲梁的共同框梁", [-.86, 2.04, -.05], [.86, 2.04, -.05], .09, material.red),
  ] },
  { name: "插销调高开环玻璃边桌", theme: "现代", itemType: "家具", build: () => [
    cord("可伸入座椅下方且保留前侧缺口的半圆地脚", Array.from({ length: 17 }, (_, index): Triple => { const a = (35 + index * 18.125) * Math.PI / 180; return [Math.cos(a) * .27, .02, Math.sin(a) * .27]; }), .018),
    ...[-1, 1].map(side => cylinder("紧靠桌缘成对设置的固定外立管", [side * .045, .31, .25], [.025, .58, .025])),
    ...[-1, 1].map(side => cylinder("从外立管滑出的双内升降管", [side * .045, .68, .25], [.016, .33, .016])),
    ...[-1, 1].map(side => rod("将升降管接到玻璃托环的短桥臂", [side * .045, .837, .25], [side * .045, .837, .276], .012)),
    loop("完整环形托边承住玻璃而非悬空贴片", [0, .84, 0], .28, .012), { ...cylinder("嵌在圆环里的可透玻璃圆桌面", [0, .842, 0], [.53, .012, .53], material.glass), opacity: .25 },
    rod("穿过升降管横向锁高的真实插销", [-.08, .57, .25], [.08, .57, .25], .008, material.dark), cord("防止锁销丢失的短系链", [[.08, .57, .25], [.12, .51, .26], [.045, .48, .25]], .003),
  ] },
  { name: "滑弧托架连续调角躺椅", theme: "现代", itemType: "家具", build: () => [
    ...[-1, 1].map(side => cord("以曲面滚动改变整床角度的连续钢弧", [[side * .28, .52, -.91], [side * .28, .34, -.5], [side * .28, .31, .03], [side * .28, .49, .61], [side * .28, .8, .87]], .025)),
    sweptSeat("跟随钢弧并将腿背联成一体的柔软躺面", [[-.89, .56, .3], [-.52, .49, .3], [-.1, .51, .3], [.27, .63, .3], [.63, .91, .3], [.81, 1.08, .27]], .08, material.dark),
    ...[-1, 1].flatMap(side => [[-.5, .34, .46], [.03, .31, .52], [.61, .8, .875]].map(([z, start, end]) => rod("把上层躺面实际锁到下方调角钢弧的短立撑", [side * .28, start!, z!], [side * .28, end!, z!], .025))),
    ...[-1, 1].flatMap(side => [box("承接可调钢弧的固定长地脚", [side * .27, .035, 0], [.1, .07, 1.07], material.dark), rod("底台前侧托轮支柱", [side * .27, .07, -.33], [side * .27, .26, -.33], .035), rod("底台后侧托轮支柱", [side * .27, .07, .29], [side * .27, .32, .29], .035), ...[-.33, .29].map(z => cylinder("钢弧在其上滑行的软滚轮", [side * .27, z < 0 ? .27 : .33, z], [.085, .055, .085], material.dark, [0, 0, 90]))]),
    cylinder("承托头部的低圆枕", [0, 1.055, .68], [.15, .55, .15], material.ivory, [0, 0, 90]),
    ...[[-.5, .34], [.61, .8]].map(([z, y]) => rod("两侧曲弧之间的抗扭联梁", [-.28, y!, z!], [.28, y!, z!], .025)),
  ] },
  { name: "收腰整片胶合壳椅", theme: "现代", itemType: "家具", build: () => [
    sweptSeat("从宽座面收成窄腰再展开背翼的同一片曲壳", [[-.3, .45, .27], [-.13, .42, .29], [.04, .44, .25], [.15, .58, .085], [.25, .79, .27], [.29, .96, .3]], .023, material.wood),
    ...[-1, 1].flatMap(side => [rod("从座下外展至地面的前支腿", [side * .19, .42, -.15], [side * .29, .018, -.28], .018), rod("从座下反向张开的后支腿", [side * .19, .46, .06], [side * .26, .018, .3], .018)]),
    ...[-1, 1].map(side => rod("把前后两腿连到座壳下方的侧框", [side * .19, .425, -.15], [side * .19, .425, .06], .018)),
  ] },
  { name: "铰脊折板躺榻", theme: "现代", itemType: "家具", build: () => [
    ...[-1, 1].flatMap(side => [box("可折合躺榻的两端承脚", [side * .3, .17, -.18], [.075, .34, 1.07], material.dark), rod("每侧连接各板铰点的脊梁", [side * .3, .37, -.95], [side * .3, .37, .5], .028)]),
    ...[[-.66, .4, .57, 0], [-.18, .43, .38, -9], [.2, .58, .5, -28], [.6, .84, .43, -38]].map(([z, y, depth, angle]) => box("四块独立铰接的厚软躺板", [0, y!, z!], [.65, .1, depth!], material.red, [angle!, 0, 0])),
    ...[-.39, .025, .41].map(z => rod("软板底部横向贯通的真实铰轴", [-.34, .43 + Math.max(0, z) * .67, z], [.34, .43 + Math.max(0, z) * .67, z], .02)),
    ...[-1, 1].map(side => rod("背板后方能够锁住倾角的斜撑", [side * .27, .2, .32], [side * .27, .8, .57], .025)),
  ] },
  { name: "双大软环回包扶手椅", theme: "现代", itemType: "家具", build: () => [
    cylinder("稳定软环椅的低位圆底台", [0, .08, .04], [.65, .16, .65], material.dark), cylinder("隐藏在座垫下的承载短柱", [0, .26, .04], [.14, .24, .14]), ball("整圆厚坐垫", [0, .44, -.05], [.66, .17, .63], material.ivory),
    ...[.62, .87].map(y => cord("从左扶手绕过背后再回到右扶手的巨大封闭软包管", [[-.39, y, -.25], [-.43, y, .04], [-.31, y, .31], [0, y, .39], [.31, y, .31], [.43, y, .04], [.39, y, -.25]], .115, material.red)),
    ...[.62, .87].flatMap(y => [-1, 1].map(side => ball("将两端真正封住的软管圆头", [side * .39, y, -.25], [.23, .23, .23], material.red))),
    ...[-1, 1].map(side => rod("软环中部承接到底台的隐蔽立柱", [side * .28, .25, .16], [side * .28, .84, .25], .03)),
  ] },
  { name: "外框吊革翼背躺椅", theme: "现代", itemType: "家具", build: () => [
    ...[-1, 1].flatMap(side => [curvedBand("从前脚连续弯向后方头靠的外承木框", [[.75, .025], [.59, .46], [.03, .42], [-.32, .6], [-.59, .84]], .05, [side * .34, 0, 0], .07, material.wood), rod("木框后部直接落地的完整斜脚", [side * .34, .025, .54], [side * .34, .6, .32], .045, material.wood), box("外框上方平直的宽扶手", [side * .34, .64, -.1], [.08, .035, .84], material.wood), rod("扶手前端回接外承木框的短立柱", [side * .34, .45, -.49], [side * .34, .63, -.49], .03, material.wood)]),
    sweptSeat("只在外框端头吊紧而不落地的整幅厚皮躺带", [[-.59, .46, .28], [-.32, .37, .28], [.03, .39, .28], [.32, .6, .28], [.59, .84, .26]], .018, material.dark),
    ...[-1, 1].map(side => rod("将悬革张力传入两侧外框的端梁", [-.34, side < 0 ? .46 : .84, side < 0 ? -.59 : .59], [.34, side < 0 ? .46 : .84, side < 0 ? -.59 : .59], .025)),
    cylinder("背框顶端独立悬挂的头颈软卷", [0, .86, .54], [.13, .52, .13], material.ivory, [0, 0, 90]),
  ] },
  { name: "带扣双垫折合地椅", theme: "现代", itemType: "家具", build: () => [
    box("直接着地的厚前坐垫", [0, .11, -.16], [.64, .22, .66], material.red), box("由双侧带扣保持角度的后背厚垫", [0, .53, .27], [.64, .72, .17], material.red, [-18, 0, 0]),
    ...[-1, 1].flatMap(side => [cord("连接两垫侧面的承重织带", [[side * .3, .1, -.37], [side * .3, .56, .2], [side * .3, .19, .16]], .012, material.dark), box("可以调整后背角度的独立带扣", [side * .315, .33, -.1], [.025, .075, .045], material.steel)]),
    rod("厚垫内部连接软布铰脊的横轴", [-.29, .19, .16], [.29, .19, .16], .02, material.dark),
  ] },
  { name: "三角深凹壳三脚躺椅", theme: "现代", itemType: "家具", build: () => [
    bowlShell("中央深陷且三个壳角连续上翘的整片坐壳", [0, .39, -.015], [[-.42, .78, .3], [-.23, .52, -.24], [0, .53, -.48], [.23, .52, -.24], [.42, .78, .3], [0, .89, .38]], .045, material.ivory),
    ...[-1, 1].map(side => rod("从前方两角斜撑到地面的钢脚", [side * .31, .023, -.27], [side * .27, .5, -.16], .025)), rod("后背中线的单支后钢脚", [0, .023, .37], [0, .56, .23], .03),
    ...[-1, 1].map(side => rod("三脚之间的低位抗扭联杆", [side * .31, .12, -.27], [0, .12, .37], .018)), ball("深凹中央的低软坐垫", [0, .43, -.02], [.45, .075, .43], material.red),
  ] },
  { name: "倾置圆锥坐壳椅", theme: "现代", itemType: "家具", build: () => [
    cylinder("四臂低转架的中心立柱", [0, .22, 0], [.085, .36, .085]),
    ...Array.from({ length: 4 }, (_, index) => { const a = index * Math.PI / 2; return rod("低转架放射到地面的稳定脚", [0, .12, 0], [Math.cos(a) * .34, .025, Math.sin(a) * .34], .03); }),
    part("整体向后倾而前沿降低的真实空心坐锥", "lathe", material.red, [0, .39, 0], [1, 1, 1], [-19, 0, 0], { profile: [{ x: .035, y: 0 }, { x: .085, y: .04 }, { x: .45, y: .55 }, { x: .43, y: .57 }, { x: .38, y: .5 }, { x: .08, y: .095 }, { x: .025, y: .07 }, { x: .035, y: 0 }] }),
    ball("锥壳内部不遮挡前口的柔软坐垫", [0, .63, -.045], [.46, .12, .4], material.ivory),
  ] },
  { name: "板簧承座摇摆椅", theme: "现代", itemType: "家具", build: () => [
    box("始终贴地而不随坐面摇动的固定底台", [0, .035, 0], [.69, .07, .75], material.dark),
    ...[-1, 1].map(side => curvedBand("从后部夹固并向前回弯的真正宽板簧", [[-.27, .075], [-.35, .17], [-.31, .3], [-.13, .4], [.15, .43], [.27, .45]], .07, [side * .24, 0, 0], .018, material.steel)),
    sweptSeat("由双板簧共同托起的连座靠背壳", [[-.31, .46, .3], [-.12, .43, .3], [.13, .46, .29], [.29, .68, .27], [.35, .91, .27]], .04, material.wood),
    ...[-1, 1].map(side => box("底台后端实际压住板簧的夹板", [side * .24, .09, .27], [.09, .035, .16], material.steel)),
    ball("悬座中的薄软垫", [0, .49, -.04], [.49, .06, .43], material.red),
  ] },
  { name: "梯座折线公共软榻", theme: "现代", itemType: "家具", build: () => [
    ...Array.from({ length: 4 }, (_, index) => { const x = (index - 1.5) * .55, y = .19 + index * .11; return [box("沿整体斜梁逐级升高的独立厚坐块", [x, y, -.02], [.59, .27, .91], material.red), box("与各坐块一体的低软靠块", [x, y + .25, .36], [.59, .49, .17], material.ivory)]; }).flat(),
    ...[-1, 1].map(side => box("贯穿四层软坐块的整幅斜向钢梁", [0, .22, side * .31], [2.12, .075, .055], material.dark, [0, 0, 11])),
    ...[-1, 1].map(side => box("整体梯座两端落地支脚", [side * .91, side < 0 ? .085 : .25, .04], [.1, side < 0 ? .17 : .5, .58], material.dark)),
  ] },
  { name: "自立框悬索秋千沙发", theme: "现代", itemType: "家具", build: () => [
    ...[-1, 1].flatMap(side => [...[-1, 1].map(z => rod("从两侧地面支起高横梁的A形门架腿", [side * 1.08, .025, z * .62], [side * 1.08, 2.02, 0], .065)), rod("A架两脚之间的限角横拉杆", [side * 1.08, .44, -.49], [side * 1.08, .44, .49], .035)]),
    rod("独立门架顶部完整承重横轴", [-1.18, 2.02, 0], [1.18, 2.02, 0], .075),
    ...[-1, 1].flatMap(side => [-1, 1].map(z => rod("把沙发座架悬起的四根活动吊索", [side * .76, .54, z * .3], [side * .84, 1.99, 0], .009))),
    box("悬在门架中的整幅承坐钢框", [0, .49, 0], [1.7, .065, .68]), box("独立长坐软垫", [0, .58, -.03], [1.6, .13, .59], material.red), box("长背部软垫", [0, .89, .31], [1.6, .59, .14], material.red, [-10, 0, 0]),
    ...[-1, 1].map(side => cord("座架上方独立扶肘框", [[side * .82, .5, -.3], [side * .82, .79, -.3], [side * .82, .79, .28], [side * .82, .5, .28]], .025)),
  ] },
  { name: "折T脚便携宴会长台", theme: "现代", itemType: "家具", build: () => [
    box("闭合后仍为整幅平面的轻型宴会桌板", [0, .75, 0], [1.84, .045, .76], material.wood),
    ...[-1, 1].flatMap(side => [rod("从桌底折合横轴落下的T形主脚", [side * .61, .71, 0], [side * .61, .06, 0], .045), rod("T脚下方前后展开的通长地足", [side * .61, .035, -.31], [side * .61, .035, .31], .045), rod("桌面下方的折脚通长铰轴", [side * .61, .71, -.27], [side * .61, .71, .27], .028), rod("折脚展开后锁住的肘形斜撑", [side * .32, .69, 0], [side * .61, .43, 0], .02)]),
    ...[-1, 1].map(side => box("沿桌底边缘完整延伸的抗弯槽梁", [0, .695, side * .29], [1.72, .055, .025], material.steel)),
  ] },
  { name: "悬杆错位立方书架", theme: "现代", itemType: "家具", build: () => {
    const parts: ModelPart[] = [box("抵抗悬臂偏重的完整低位地台", [0, .04, .03], [1.54, .08, .69], material.dark), ...[-1, 1].map(side => rod("支持错位盒仓的双主立柱", [side * .32, .08, .19], [side * .32, 1.96, .19], .035))];
    for (let index = 0; index < 5; index++) { const x = index % 2 ? .29 : -.29, y = .35 + index * .34; parts.push(box("从立杆挑出的独立盒仓底", [x, y, -.02], [.77, .025, .43], material.wood), box("每盒顶端整体薄板", [x, y + .28, -.02], [.77, .025, .43], material.wood), ...[-1, 1].map(side => box("每盒两侧的完整承重板", [x + side * .372, y + .14, -.02], [.025, .28, .43], material.wood)), rod("把盒仓后部锁回立柱的横向托杆", [x - .36, y - .02, .18], [x + .36, y - .02, .18], .025)); }
    return parts;
  } },
  { name: "外摆回转抽屉塔", theme: "现代", itemType: "家具", build: () => [
    cylinder("外摆抽屉塔的低位配重底座", [0, .055, .02], [.79, .11, .79], material.dark), cylinder("不随抽斗摆动的贯通竖直转轴", [-.23, 1.05, .18], [.04, 1.94, .04]),
    ...Array.from({ length: 8 }, (_, index) => { const y = .21 + index * .22, angle = index === 4 ? -27 : index === 6 ? 21 : 0, a = angle * Math.PI / 180, x = -.23 + Math.cos(a) * .24 - Math.sin(a) * .19, z = .18 - Math.sin(a) * .24 - Math.cos(a) * .19; return [box("每个抽斗都能独立绕角轴外摆的完整底", [x, y, z], [.54, .018, .43], material.wood, [0, angle, 0]), ...[-1, 1].map(side => box("回转抽斗的两片薄侧壁", [x + Math.cos(a) * side * .26, y + .08, z - Math.sin(a) * side * .26], [.018, .16, .43], material.wood, [0, angle, 0])), ...[-1, 1].map(side => box("回转抽斗的前后薄壁", [x + Math.sin(a) * side * .205, y + .08, z + Math.cos(a) * side * .205], [.54, .16, .018], material.wood, [0, angle, 0])), loop("每层在固定角轴上回转的独立轴环", [-.23, y + .06, .18], .032, .008)]; }).flat(),
  ] },
  { name: "分块回转砖屏", theme: "现代", itemType: "家具", build: () => [
    box("整幅砖屏低位防倾底座", [0, .055, 0], [1.8, .11, .48], material.dark),
    ...[-.63, 0, .63].map(x => rod("串起多块独立砖板的竖直细轴", [x, .11, 0], [x, 1.94, 0], .02)),
    ...[-.63, 0, .63].flatMap((x, col) => Array.from({ length: 7 }, (_, row) => box("可以独立回转并形成透景缺口的整块屏砖", [x, .25 + row * .255, 0], [.59, .22, .055], material.wood, [0, (row + col) % 3 === 0 ? 31 : (row + col) % 3 === 1 ? -17 : 0, 0]))),
    ...[-1, 1].map(side => box("底座两端加宽而不遮挡砖板的短脚", [side * .72, .035, 0], [.1, .07, .69], material.dark)),
  ] },
  { name: "轴串球节衣帽架", theme: "现代", itemType: "家具", build: () => [
    cylinder("可承受偏心挂衣重量的加重圆脚盘", [0, .045, 0], [.58, .09, .58], material.dark),
    ...Array.from({ length: 4 }, (_, index) => { const y = .35 + index * .39, a = index * Math.PI / 2, x = Math.cos(a) * .06, z = Math.sin(a) * .06; return [rod("在球节之间连续承重的短中柱", [index ? Math.cos(a - Math.PI / 2) * .06 : 0, y - .34, index ? Math.sin(a - Math.PI / 2) * .06 : 0], [x, y, z], .04), ball("串联承柱与外摆挂臂的完整球形接头", [x, y, z], [.1, .1, .1], material.steel), rod("从球节独立挑出的可转挂衣臂", [x, y, z], [x + Math.cos(a) * .32, y + .14, z + Math.sin(a) * .32], .025), ball("挂衣臂末端的防脱大圆头", [x + Math.cos(a) * .32, y + .14, z + Math.sin(a) * .32], [.065, .065, .065], material.wood)]; }).flat(),
  ] },
  { name: "连续卷带壁书架", theme: "现代", itemType: "家具", build: () => [
    { ...curvedBand("一整条连续卷曲而每段可承书的厚书脊带", [[-.8, .14], [-.55, .33], [-.28, .34], [-.09, .15], [.12, .13], [.34, .34], [.55, .59], [.75, .74], [.86, .65]], .25, [0, 0, 0], .035, material.steel), rotation: { x: 0, y: 0, z: 0 } },
    ...[-.55, -.28, .12, .34, .55].map((x, index) => box("卷带不同坡面上独立的止书隔片", [x, [.43, .44, .23, .44, .69][index]!, 0], [.018, .17, .25], material.wood)),
    ...[-1, 1].map(side => box("把连续书带锁回墙面的端部固定脚", [side < 0 ? -.78 : .85, side < 0 ? .16 : .65, 0], [.08, .08, .35], material.dark)),
  ] },
  { name: "树叉斜格双面书架", theme: "现代", itemType: "家具", build: () => [
    box("树叉书架独立的宽扁地台", [0, .045, 0], [1.29, .09, .65], material.dark), box("由地面贯通全部枝叉的中央主脊板", [0, 1.06, 0], [.065, 1.99, .4], material.wood),
    ...[-1, 1].flatMap(side => [box("下部向两侧分出的长斜叉板", [side * .34, .65, 0], [.06, 1.09, .4], material.wood, [0, 0, -side * 47]), box("上部向两侧分出的短斜叉板", [side * .27, 1.45, 0], [.055, .9, .4], material.wood, [0, 0, -side * 39]), box("下枝末端让书脊靠住的短分叉", [side * .63, .99, 0], [.055, .43, .4], material.wood, [0, 0, side * 37])]),
    ...[-1, 1].flatMap(side => [rod("倾斜承书格下方的外沿止滑边", [side * .09, .432, -.205], [side * .65, .954, -.205], .014), rod("另一面同格的外沿止滑边", [side * .09, .432, .205], [side * .65, .954, .205], .014)]),
  ] },
  { name: "放射肋深皿壳椅", theme: "现代", itemType: "家具", build: () => {
    const rim = Array.from({ length: 16 }, (_, index): Triple => { const a = index * Math.PI / 8; return [Math.cos(a) * .35, .62 + Math.sin(a) * .19, Math.sin(a) * .36]; });
    const parts: ModelPart[] = [bowlShell("前低后高且中央深凹的整片椭圆壳", [0, .42, -.03], rim, .025, material.ivory)];
    for (let index = 0; index < 12; index++) { const a = index * Math.PI / 6; parts.push(rod("从座心向外缘分散载荷的背面压肋", [0, .39, -.03], [Math.cos(a) * .31, .59 + Math.sin(a) * .17, Math.sin(a) * .32], .012, material.steel)); }
    parts.push(...[-1, 1].flatMap(side => [rod("前侧向外张开的钢腿", [side * .17, .4, -.1], [side * .27, .02, -.27], .02), rod("后侧向外张开的钢腿", [side * .17, .42, .12], [side * .27, .02, .27], .02)]));
    return parts;
  } },
  { name: "陀螺自摇深座凳", theme: "现代", itemType: "家具", build: () => [
    part("从窄圆底伸展到宽深坐沿的完整陀螺厚壳", "lathe", material.red, [0, 0, 0], [1, 1, 1], [0, 0, 0], { profile: [{ x: 0, y: .015 }, { x: .07, y: 0 }, { x: .16, y: .045 }, { x: .24, y: .16 }, { x: .29, y: .39 }, { x: .43, y: .54 }, { x: .45, y: .58 }, { x: .42, y: .61 }, { x: .37, y: .57 }, { x: .22, y: .42 }, { x: .15, y: .28 }, { x: 0, y: .24 }] }),
    ball("深座中心贴合人体的低软垫", [0, .3, 0], [.35, .065, .35], material.ivory),
  ] },
];
