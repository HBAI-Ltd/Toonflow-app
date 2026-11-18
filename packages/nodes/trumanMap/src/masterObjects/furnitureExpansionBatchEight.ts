import { part, type ModelPart, type Triple } from "../assetModelParts";
import { box, cylinder, rod, loop, cord, plate, piercedPanel, bars, legs, material, type MasterPrototype } from "./parts";
import { curvedBand } from "./furnitureExpansionBatchSix";

function trough(name: string, center: Triple, width: number, depth: number, height: number, color = material.wood, overflowHeight?: number): ModelPart[] {
  const [x, y, z] = center;
  const parts = [box(`${name}封底`, [x, y + .015, z], [width, .03, depth], color), ...[-1, 1].map(side => box(`${name}长侧壁`, [x, y + (height + .03) / 2, z + side * (depth / 2 - .0175)], [width - .07, height - .03, .035], color))];
  for (const side of [-1, 1]) {
    if (side < 0 || overflowHeight === undefined) parts.push(box(`${name}封端`, [x + side * (width / 2 - .0175), y + (height + .03) / 2, z], [.035, height - .03, depth], color));
    else parts.push(box(`${name}出水缺口下方的低端壁`, [x + width / 2 - .0175, y + (overflowHeight + .03) / 2, z], [.035, overflowHeight - .03, depth], color), ...[-1, 1].map(edge => box(`${name}真正出水缺口两侧的完整高壁`, [x + width / 2 - .0175, y + (height + overflowHeight) / 2, z + edge * (depth / 4 + .0375)], [.035, height - overflowHeight, (depth - .15) / 2], color)));
  }
  return parts;
}

function frontBand(name: string, points: [number, number][], depth: number, center: Triple, thickness: number, color = material.wood): ModelPart {
  return { ...curvedBand(name, points, depth, center, thickness, color), rotation: { x: 0, y: 0, z: 0 } };
}

function pot(name: string, center: Triple, radius: number, height: number, color = material.ivory): ModelPart {
  return part(name, "lathe", color, center, [1, 1, 1], [0, 0, 0], { profile: [{ x: 0, y: 0 }, { x: radius * .75, y: 0 }, { x: radius, y: height }, { x: radius - .024, y: height }, { x: radius * .75 - .024, y: .025 }, { x: 0, y: .025 }] });
}

function wheelParts(x: number, z: number): ModelPart[] {
  return [cylinder("园艺架回转小轮", [x, .055, z], [.11, .035, .11], material.dark, [0, 0, 90]), rod("轮叉与底架之间的竖颈", [x, .055, z], [x, .14, z], .025)];
}

export const furnitureExpansionBatchEightObjects: MasterPrototype[] = [
  { name: "折合A形盆栽阶架", theme: "现代", itemType: "家具", build: () => [
    ...[-1, 1].flatMap(side => [rod("可从顶铰合拢的前斜支腿", [side * .55, .02, -.45], [side * .55, 1.41, 0], .045, material.wood), rod("可从顶铰合拢的后斜支腿", [side * .55, .02, .45], [side * .55, 1.41, 0], .045, material.wood), cylinder("A架顶部横向铰盘", [side * .55, 1.4, 0], [.07, .06, .07], material.dark, [0, 0, 90])]),
    ...[[.3, .73], [.72, .49], [1.14, .25]].flatMap(([y, depth]) => [box("跨接斜腿并能随架合拢的完整承盆层板", [0, y!, 0], [1.14, .03, depth!], material.wood), ...[-1, 1].map(side => box("层板前后避免花盆滑落的低挡边", [0, y! + .035, side * (depth! / 2 - .012)], [1.14, .04, .018], material.wood))]),
    ...[-1, 1].map(side => rod("锁住两侧支腿开角的折合限位拉条", [side * .55, .43, -.31], [side * .55, .43, .31], .014)),
  ] },
  { name: "扇面壁挂盆托", theme: "现代", itemType: "家具", build: () => [
    box("扇面共同锁定墙面的狭长背脊", [0, .59, .16], [.13, 1.14, .045], material.dark),
    ...[-1, 1].flatMap(side => [rod("从下部背脊向上外展的长扇肋", [0, .13, .14], [side * .64, 1.03, -.04], .025), rod("扇肋之间的高位横向联杆", [0, .94, .14], [side * .64, 1.03, -.04], .018)]),
    ...[[-.49, .8], [0, .49], [.49, .8]].flatMap(([x, y]) => [loop("可实际放入盆底的水平承盆环", [x!, y!, -.16], .145, .014), rod("盆环回接扇肋的短支臂", [x!, y!, -.03], [x!, y!, -.17], .02), rod("盆环下方抵抗下垂的斜撑", [x! * .72, y! - .16, .08], [x!, y!, -.2], .018)]),
    ...[.13, 1.03].map(y => cylinder("背脊上露出的壁装螺帽", [0, y, .132], [.028, .014, .028], material.steel, [90, 0, 0])),
  ] },
  { name: "双侧轮式育苗工作台", theme: "现代", itemType: "家具", build: () => [
    ...[-1, 1].flatMap(x => [-1, 1].flatMap(z => [...wheelParts(x * .64, z * .37), rod("由轮架贯通苗台的四根立柱", [x * .64, .13, z * .37], [x * .64, 1.04, z * .37], .035)])),
    ...[-1, 1].flatMap(side => trough("两侧独立苗盘承槽", [0, .82, side * .23], 1.39, .43, .13, material.steel)),
    ...bars("下层可沥水的透空苗盘格档", 9, [0, .29, 0], .65, [1.29, .02, .035], 2),
    ...[-1, 1].map(side => rod("将下层全部格档接回四角立柱的纵向托梁", [side * .64, .275, -.37], [side * .64, .275, .37], .035)),
    ...[-1, 1].map(side => rod("上层苗槽之间的纵向支承梁", [-.64, .8, side * .3], [.64, .8, side * .3], .035)),
    cord("侧边推行时可抓住的高U形握框", [[.68, .85, -.3], [.68, 1.09, -.3], [.68, 1.09, .3], [.68, .85, .3]], .022),
  ] },
  { name: "连框花池长凳", theme: "现代", itemType: "家具", build: () => [
    ...[-1, 1].flatMap(side => trough("与座梁同框承重的端花池", [side * 1.08, .055, 0], .57, .69, .62, material.wood)),
    ...[-1, 1].map(side => box("穿过两端花池侧壁的完整承座长梁", [0, .39, side * .22], [2.46, .07, .065], material.dark)),
    ...bars("不与盆土混合的中部独立坐板", 4, [0, .465, 0], .41, [1.57, .055, .095], 2, material.wood),
    ...[-1, 1].map(side => box("两端花池底面防腐低脚", [side * 1.08, .025, 0], [.49, .05, .6], material.dark)),
    ...[-1, 1].map(side => box("座端接入花池下方的抗扭肋", [side * .79, .28, 0], [.035, .27, .51], material.wood)),
  ] },
  { name: "自立拱顶攀藤门架", theme: "现代", itemType: "家具", build: () => [
    ...[-1, 1].map(side => frontBand("从两侧整根弯起而无顶部断开的拱门梁", [[-.67, .07], [-.67, 1.47], [-.55, 1.83], [-.31, 2.08], [0, 2.18], [.31, 2.08], [.55, 1.83], [.67, 1.47], [.67, .07]], .065, [0, 0, side * .31], .05, material.wood)),
    ...[-1, 1].flatMap(side => [box("门架下方宽而可搬移的落地脚", [side * .67, .035, 0], [.17, .07, .99], material.dark), ...[.4, .9, 1.4].map(y => rod("前后拱梁间的侧向横档", [side * .67, y, -.31], [side * .67, y, .31], .025, material.wood)), ...[-1, 1].map(z => rod("侧面供藤枝攀附的交叉细格条", [side * .67, .22, z * .24], [side * .67, 1.43, -z * .24], .014, material.wood))]),
    ...[-.42, 0, .42].map(x => rod("顶部连接两根拱梁的短横档", [x, 2.18 - Math.abs(x) * .55, -.31], [x, 2.18 - Math.abs(x) * .55, .31], .025, material.wood)),
  ] },
  { name: "偏心缆索盆栽展架", theme: "现代", itemType: "家具", build: () => [
    box("抵抗偏心花盆重量的宽底台", [0, .055, .06], [.85, .11, .87], material.dark), rod("向后倾斜但从底台贯通顶端的主桅", [0, .11, .25], [0, 1.89, .05], .065),
    ...[[-.32, .6, -.24], [.35, 1.03, -.21], [-.22, 1.46, -.17]].flatMap(([x, y, z]) => [rod("从主桅悬挑到盆托下方的刚性承臂", [0, y! - .07, .25 - (y! - .18) / 1.78 * .2], [x!, y! - .008, z! - .17], .025), loop("每只盆托独立而不中断拉索的水平圆环", [x!, y!, z!], .18, .018), rod("盆托外缘回接桅顶的细张索", [x!, y!, z! - .18], [0, 1.87, .05], .004)]),
    rod("向后方地脚拉紧的平衡索", [0, .105, .4], [0, 1.88, .05], .005),
  ] },
  { name: "轮框立体花墙", theme: "现代", itemType: "家具", build: () => [
    ...[-1, 1].flatMap(side => [box("花墙两侧的前后宽底梁", [side * .67, .16, 0], [.08, .06, .71]), ...[-1, 1].flatMap(z => wheelParts(side * .67, z * .29)), rod("直立而不依靠墙面的两根钢框柱", [side * .67, .18, .13], [side * .67, 1.88, .13], .035)]),
    ...[.23, .79, 1.35, 1.87].map(y => rod("可挂接盆槽的整幅横框", [-.67, y, .13], [.67, y, .13], .03)),
    ...[.29, .85, 1.41].flatMap(y => trough("可取下的前挂长种植槽", [0, y, -.06], 1.28, .31, .27, material.ivory)),
    ...[-1, 1].flatMap(side => [.31, .87, 1.43].map(y => rod("将各槽底接回直立框的短斜撑", [side * .56, y - .07, .13], [side * .56, y + .015, -.15], .02))),
  ] },
  { name: "雨链接水盆台", theme: "现代", itemType: "家具", build: () => [
    ...[-1, 1].map(side => box("承接雨链的双落地长脚", [side * .43, .035, 0], [.09, .07, .7], material.dark)),
    ...[-1, 1].map(side => rod("接水台上方的双侧立柱", [side * .43, .07, .11], [side * .43, 2.03, .11], .03)), rod("悬吊整串接水杯的顶部横杆", [-.43, 2.03, .11], [.43, 2.03, .11], .03),
    pot("落地接住整串来水的开放大盆", [0, .14, 0], .38, .28, material.steel),
    ...Array.from({ length: 5 }, (_, index) => { const y = .59 + index * .27; return [part("中心真正贯通的锥形导水杯", "lathe", material.steel, [0, y, 0], [1, 1, 1], [0, 0, 0], { profile: [{ x: .024, y: 0 }, { x: .13, y: .16 }, { x: .12, y: .16 }, { x: .018, y: .005 }, { x: .024, y: 0 }] }), rod("接水杯之间连续串联的细链节", [0, y - .003, 0], [0, y + .27, 0], .005, material.dark), rod("在杯底实际承接杯体并锁到链节的短十字托", [-.024, y + .004, 0], [.024, y + .004, 0], .003, material.dark)]; }).flat(),
    rod("最后一杯到顶横梁的真实吊颈", [0, 1.93, 0], [0, 2.03, .11], .006),
    ...[-1, 1].map(side => rod("接水大盆下方横托梁", [-.43, .13, side * .22], [.43, .13, side * .22], .025)),
  ] },
  { name: "双曲编带篮式花器", theme: "现代", itemType: "家具", build: () => {
    const parts: ModelPart[] = [pot("不漏土的独立内衬盆", [0, .07, 0], .39, .51, material.dark), ...[.12, .54].map(y => loop("把全部编带锁在一起的上下承重环", [0, y, 0], y < .2 ? .31 : .41, .02, [0, 0, 0], material.wood))];
    for (let index = 0; index < 12; index++) { const a = index * Math.PI / 6; parts.push(cord("从底圈鼓起再收回口圈的完整竖编带", [[Math.cos(a) * .31, .12, Math.sin(a) * .31], [Math.cos(a) * .46, .3, Math.sin(a) * .46], [Math.cos(a) * .41, .54, Math.sin(a) * .41]], .012, material.wood)); }
    for (const y of [.21, .31, .41]) parts.push(loop("与竖带交编的整圈横向藤带", [0, y, 0], y === .31 ? .46 : .435, .009, [0, 0, 0], material.wood));
    parts.push(...Array.from({ length: 3 }, (_, index) => { const a = index * Math.PI * 2 / 3; return cylinder("篮脚下的短防潮足", [Math.cos(a) * .27, .045, Math.sin(a) * .27], [.055, .09, .055], material.dark); }));
    return parts;
  } },
  { name: "环托悬吊花篮架", theme: "现代", itemType: "家具", build: () => [
    ...[-1, 1].flatMap(side => [box("花篮架外张地脚", [side * .43, .03, 0], [.09, .06, .82], material.dark), frontBand("整根从地面弧起的半拱悬篮立臂", [[0, .06], [0, 1.35], [-.13, 1.66], [-.4, 1.84]], .04, [side * .43, 0, 0], .045, material.steel)]),
    rod("两侧弧臂共同承接吊篮的顶横轴", [-.83, 1.84, 0], [.03, 1.84, 0], .03),
    ...[-1, 1].flatMap(side => [pot("两只从独立三点吊索悬起的篮盆", [side * .25 - .4, .68, 0], .23, .28, material.ivory), ...Array.from({ length: 3 }, (_, index) => { const a = index * Math.PI * 2 / 3; return rod("篮盆口沿到同一吊点的承重细索", [side * .25 - .4 + Math.cos(a) * .21, .94, Math.sin(a) * .21], [side * .25 - .4, 1.84, 0], .004); })]),
    rod("前后两地脚之间的共同抗扭横联", [-.43, .13, .15], [.43, .13, .15], .025),
  ] },
  { name: "沥水槽园艺操作台", theme: "现代", itemType: "家具", build: () => [
    ...legs(1.21, .61, .83, .055),
    piercedPanel("操作面实际嵌入盆槽的贯通台面", [0, .84, 0], [[-.74, -.39], [.74, -.39], [.74, .39], [-.74, .39]], [[[-.6, -.26], [-.6, .23], [-.08, .23], [-.08, -.26]]], .035, material.wood),
    ...trough("台面左侧下沉接土接水槽", [-.34, .58, -.015], .54, .51, .3, material.steel),
    ...bars("下方储放空盆的透空格档", 8, [0, .23, 0], .53, [1.24, .025, .04], 2, material.wood),
    ...[-1, 1].map(side => rod("上方工具栏的后立柱", [side * .64, .83, .34], [side * .64, 1.54, .34], .035, material.wood)),
    ...[1.05, 1.48].map(y => box("后方挡住散土的细工具背条", [0, y, .34], [1.31, .085, .025], material.wood)),
    ...[-.45, -.15, .15, .45].map(x => rod("可挂小铲而不封闭工具栏的短钩", [x, 1.45, .32], [x, 1.4, .24], .009)),
  ] },
  { name: "帆布承槽高脚花床", theme: "现代", itemType: "家具", build: () => [
    ...[-1, 1].flatMap(side => [...[-1, 1].map(z => rod("折展高脚床的四根外斜支腿", [side * .76, .025, z * .42], [side * .64, .85, z * .31], .035)), rod("每侧支脚上方的通长托槽梁", [side * .64, .85, -.34], [side * .64, .85, .34], .035)]),
    ...[-1, 1].map(side => rod("挂住帆布长边的整幅横梁", [-.66, .86, side * .31], [.66, .86, side * .31], .03)),
    ...trough("整幅柔性种植帆布槽", [0, .58, 0], 1.25, .6, .28, material.dark),
    ...[-1, 1].flatMap(side => [-.48, -.16, .16, .48].map(x => cord("帆布槽边逐只绕过上横梁的织带", [[x, .8, side * .29], [x, .88, side * .31], [x, .81, side * .34]], .006, material.wood))),
    rod("床架下方的通长防张开细撑", [-.71, .37, 0], [.71, .37, 0], .025),
  ] },
  { name: "双环回转阳台悬篮", theme: "现代", itemType: "家具", build: () => [
    box("使悬篮独立站立的宽底台", [0, .045, 0], [.75, .09, .7], material.dark),
    ...[-1, 1].map(side => rod("两侧直接托起外环轴的竖直立柱", [side * .34, .09, 0], [side * .34, 1.2, 0], .03)),
    loop("可以绕水平轴摆动的完整外承环", [0, 1.2, 0], .37, .018, [0, 0, 0]),
    loop("与外环正交而保持篮盆方向的内承环", [0, 1.2, 0], .31, .016, [0, 0, 0]),
    ...[-1, 1].map(side => cylinder("外环与立柱之间的横向轴销", [side * .35, 1.2, 0], [.045, .08, .045], material.steel, [0, 0, 90])),
    ...[-1, 1].map(side => cylinder("内外环之间另一方向的正交铰销", [0, 1.2, side * .34], [.04, .12, .04], material.steel, [90, 0, 0])),
    pot("口沿真正挂在内承环上的独立盆篮", [0, .86, 0], .305, .34, material.ivory),
  ] },
  { name: "折臂栏杆盆架", theme: "现代", itemType: "家具", build: () => [
    ...[-1, 1].flatMap(side => [plate("可以扣过阳台横栏的U形安装背钩", [side * .43, .07, .18], [[-.08, 0], [-.08, .53], [.09, .53], [.09, .4], [.055, .4], [.055, .49], [-.045, .49], [-.045, 0]], .045, material.steel, [0, 90, 0]), rod("从背钩向前打开的水平承盆臂", [side * .43, .265, .245], [side * .43, .265, -.31], .025), rod("支臂下方可折合的三角撑", [side * .43, .08, .245], [side * .43, .265, -.27], .02)]),
    ...trough("整体放在两折臂上的长口花盆", [0, .27, -.12], .97, .43, .28, material.ivory),
    ...[-1, 1].map(side => cylinder("背钩下方抵紧栏杆的调节夹杆", [side * .43, .41, .16], [.014, .19, .014], material.dark, [90, 0, 0])),
  ] },
  { name: "钢环穹罩日光休闲床", theme: "现代", itemType: "家具", build: () => [
    cylinder("完整独立的低位圆形休憩地台", [0, .08, 0], [2.04, .16, 2.04], material.dark), cylinder("地台上整幅圆形软卧垫", [0, .245, 0], [1.94, .17, 1.94], material.ivory),
    ...Array.from({ length: 5 }, (_, index) => ({ ...cord("在地台两侧落脚并穹合头顶的整根钢环骨", Array.from({ length: 9 }, (_, step): Triple => { const a = step * Math.PI / 8; return [Math.cos(a), .16 + Math.sin(a) * 1.45, 0]; }), .022), rotation: { x: 0, y: -35 - index * 37.5, z: 0 } })),
    ...[-1, 1].map(side => box("圆床后沿独立的半躺靠枕", [side * .42, .51, .59], [.69, .37, .18], material.red, [-14, -side * 15, 0])),
    cord("在相同高度连续连接五根钢骨的后半周横箍", Array.from({ length: 9 }, (_, index): Triple => { const a = (35 + index * 18.75) * Math.PI / 180; return [Math.cos(a) * .981, .44, Math.sin(a) * .981]; }), .012),
  ] },
  { name: "波肋条栅庭院躺台", theme: "现代", itemType: "家具", build: () => [
    ...Array.from({ length: 9 }, (_, index) => curvedBand("每片本身从地面承重并连贯上翻成躺面的独立木肋", [[.91, .03], [.69, .22], [.38, .39], [.03, .41], [-.26, .59], [-.61, .83], [-.87, .78]], .045, [(index - 4) * .078, 0, 0], .08, material.wood)),
    ...[[-.65, .235], [.61, .83]].map(([z, y]) => rod("穿过全部九片肋梁的通长横联", [-.35, y!, z!], [.35, y!, z!], .03, material.dark)),
    ...[-1, 1].flatMap(side => [rod("躺台后侧实际落地的细支脚", [side * .29, .025, .69], [side * .29, .795, .69], .03, material.dark), cylinder("后支脚与地面之间的防潮脚垫", [side * .29, .015, .69], [.06, .03, .06], material.dark)]),
  ] },
  { name: "藤带交编钢框长椅", theme: "现代", itemType: "家具", build: () => [
    ...[-1, 1].map(side => cord("从前地脚连续包成扶手和后脚的外钢框", [[side * .82, .025, -.32], [side * .82, .68, -.32], [side * .82, .71, .29], [side * .82, .025, .34]], .025)),
    ...[-1, 1].map(side => rod("两端钢框之间通长的张带承梁", [-.82, .43, side * .29], [.82, .43, side * .29], .03)),
    ...Array.from({ length: 15 }, (_, index) => cord("沿坐面下沉再向背部升起的连续竖编藤带", [[-.73 + index * .104, .44, -.28], [-.73 + index * .104, .41, .03], [-.73 + index * .104, .5, .27], [-.73 + index * .104, .88, .34]], .009, material.wood)),
    ...[.58, .73, .87].map(y => rod("与竖带交编而贯通全背的细藤条", [-.75, y, .29 + (y - .58) * .17], [.75, y, .29 + (y - .58) * .17], .012, material.wood)),
    ...[-1, 1].map(side => rod("承接背编带顶缘的斜向钢脊", [side * .78, .44, .29], [side * .78, .89, .34], .025)),
    rod("将全部编带顶端锁到两根钢脊上的通长横框", [-.78, .89, .34], [.78, .89, .34], .025),
  ] },
  { name: "斜撑遮阳候坐亭凳", theme: "现代", itemType: "家具", build: () => [
    ...[-1, 1].map(side => box("前后宽展的低位防倾脚", [side * .8, .035, .06], [.13, .07, 1.13], material.dark)),
    ...[-1, 1].map(side => rod("从后脚斜挑到棚顶的完整主支柱", [side * .8, .07, .44], [side * .8, 1.94, .17], .065)),
    box("与两侧主支柱榫接的整幅坐板", [0, .47, -.03], [1.85, .055, .63], material.wood),
    ...[-1, 1].map(side => rod("坐板前沿回接主柱的三角斜托", [side * .8, .19, .42], [side * .8, .44, -.26], .035)),
    box("作为抗扭梁同时提供背靠的整幅薄板", [0, .86, .28], [1.76, .39, .04], material.wood, [-8, 0, 0]),
    ...[-1, 1].map(side => rod("向前悬挑整幅遮阳顶的刚性横臂", [side * .8, 1.9, .3], [side * .8, 2.03, -.63], .045)),
    box("前高后低并真实落在悬臂上的整幅薄棚", [0, 1.99, -.14], [2.05, .04, 1.11], material.ivory, [8, 0, 0]),
  ] },
  { name: "八面玻璃植物生态塔", theme: "现代", itemType: "家具", build: () => [
    cylinder("与八面围壁一致的低位承重底座", [0, .095, 0], [.96, .19, .96], material.dark),
    ...Array.from({ length: 8 }, (_, index) => { const a = index * Math.PI / 4; return [rod("八角立框的整根竖脊", [Math.cos(a) * .43, .18, Math.sin(a) * .43], [Math.cos(a) * .43, 1.85, Math.sin(a) * .43], .02), { ...box("围成真实空腔的整面透明玻璃片", [Math.cos(a + Math.PI / 8) * .397, 1.015, Math.sin(a + Math.PI / 8) * .397], [.328, 1.64, .008], material.glass, [0, 67.5 - index * 45, 0]), opacity: .23 }]; }).flat(),
    ...[.19, 1.86].map(y => loop("八面围壁上下相接的圆周压框", [0, y, 0], .43, .018)),
    ...[.35, .91, 1.47].map(y => cylinder("内部种植盘的独立接水台", [0, y, 0], [.69, .025, .69], material.steel)),
    rod("内部三层托盘的共同竖承柱", [0, .2, 0], [0, 1.5, 0], .035),
    cylinder("封顶并隐藏供水小腔的圆帽", [0, 1.9, 0], [.92, .06, .92], material.wood),
  ] },
  { name: "深槽窗台种植柜", theme: "现代", itemType: "家具", build: () => [
    ...[-1, 1].map(side => box("可独立落地的薄高侧框", [side * .61, .59, .04], [.045, 1.14, .61], material.wood)),
    ...trough("高出柜体的整幅深种植槽", [0, .81, .04], 1.27, .65, .37, material.wood),
    box("底层放置空盆的通长开口底板", [0, .17, .04], [1.2, .035, .58], material.wood),
    ...[-.39, 0, .39].map(x => box("底层开放格的窄竖隔片", [x, .48, .18], [.025, .59, .3], material.wood)),
    box("面向室内的一块宽半高背片", [0, .47, .33], [1.2, .6, .025], material.wood),
    ...[-1, 1].map(side => box("将深槽重量分摊到地面的前后长脚", [side * .61, .035, .04], [.11, .07, .76], material.dark)),
  ] },
  { name: "卵形攀藤骨架", theme: "现代", itemType: "家具", build: () => [
    loop("卵形骨架整体站立的低位圆脚环", [0, .06, 0], .7, .04),
    ...Array.from({ length: 8 }, (_, index) => { const a = index * Math.PI / 4; return cord("从底环同一根向上收合成顶点的卵形纵肋", [[Math.cos(a) * .7, .06, Math.sin(a) * .7], [Math.cos(a) * .85, .65, Math.sin(a) * .85], [Math.cos(a) * .74, 1.36, Math.sin(a) * .74], [Math.cos(a) * .43, 1.96, Math.sin(a) * .43], [0, 2.22, 0]], .018); }),
    ...[[.62, .85], [1.32, .75], [1.94, .44]].map(([y, radius]) => loop("将所有纵肋相互锁住的水平攀藤细环", [0, y!, 0], radius!, .014)),
    ...[-1, 1].flatMap(x => [-1, 1].map(z => cylinder("底环下方的独立防潮小足", [x * .45, .025, z * .45], [.06, .05, .06], material.dark))),
  ] },
  { name: "交锁三瓣折壁花箱", theme: "现代", itemType: "家具", build: () => {
    const outline = Array.from({ length: 18 }, (_, index): [number, number] => { const a = index * Math.PI / 9, r = .38 + Math.cos(a * 3) * .065; return [Math.cos(a) * r, Math.sin(a) * r]; });
    const inside = outline.map(([x, z]) => { const r = Math.hypot(x, z), factor = (r - .035) / r; return [x * factor, z * factor] as [number, number]; }).reverse();
    return [piercedPanel("一整圈三瓣折面围成的真实开放种植腔", [0, .14, 0], outline, [inside], .53, material.ivory), plate("与折面外形相同而完全封闭的三瓣底板", [0, .14, 0], outline, .035, material.ivory), ...Array.from({ length: 3 }, (_, index) => plate("交接在中芯并实际承托底板的三折脚", [0, 0, 0], [[0, .03], [.16, 0], [.24, .13], [.16, .15], [.05, .15]], .055, material.wood, [0, index * 120, 0]))];
  } },
  { name: "三拱连座藤亭", theme: "现代", itemType: "家具", build: () => [
    ...Array.from({ length: 3 }, (_, index) => ({ ...frontBand("在三向地脚之间交拱并共托藤冠的完整木弓", [[-1.18, .09], [-1.13, 1.4], [-.74, 2.08], [0, 2.42], [.74, 2.08], [1.13, 1.4], [1.18, .09]], .075, [0, 0, 0], .065, material.wood), rotation: { x: 0, y: index * 120, z: 0 } })),
    loop("在肩高处将三木拱锁成整体的横向箍", [0, 1.43, 0], 1.12, .025, [0, 0, 0], material.wood),
    ...Array.from({ length: 3 }, (_, index) => { const a = (index * 120 + 30) * Math.PI / 180; return [box("与拱脚同一框架承重的短休憩坐面", [Math.cos(a) * .83, .49, Math.sin(a) * .83], [.96, .055, .36], material.wood, [0, 60 - index * 120, 0]), ...[-1, 1].map(side => rod("坐面下方回接邻近拱脚的斜托", [Math.cos(a + side * Math.PI / 6) * 1.18, .13, Math.sin(a + side * Math.PI / 6) * 1.18], [Math.cos(a) * .83, .46, Math.sin(a) * .83], .035, material.wood))]; }).flat(),
    ...Array.from({ length: 6 }, (_, index) => { const a = index * Math.PI / 3; return cylinder("三拱末端各自落地的防潮小靴", [Math.cos(a) * 1.18, .045, Math.sin(a) * 1.18], [.15, .09, .15], material.dark); }),
  ] },
  { name: "折面石景休憩长座", theme: "现代", itemType: "家具", build: () => [
    plate("从地面脚带折起成通长坐面的整体石质厚壳", [0, 0, 0], [[-.35, .03], [.28, .03], [.38, .14], [.36, .43], [.23, .51], [-.31, .51], [-.36, .43], [-.3, .35], [.2, .35], [.22, .18], [-.35, .18]], 2.06, material.ivory, [0, 90, 0]),
    ...[-1, 1].map(side => box("石质折壳底部不可见的软防刮条", [side * .73, .015, -.02], [.12, .03, .53], material.dark)),
    ...[-1, 1].map(side => box("座面两端供坐靠的独立低软垫", [side * .49, .535, 0], [.81, .06, .43], material.red)),
  ] },
  { name: "分舱雨水花园矮柜", theme: "现代", itemType: "家具", build: () => [
    ...trough("最高处接入来水的独立开放上槽", [-.57, .62, .02], .62, .61, .25, material.steel, .17),
    ...trough("中部可沉降并与上下槽错高的中槽", [.04, .4, .02], .55, .61, .25, material.steel, .17),
    ...trough("低位收集余水的独立末槽", [.6, .19, .02], .55, .61, .25, material.steel),
    box("连成整体并承担三槽重量的低柜底台", [0, .07, .02], [1.83, .14, .73], material.dark),
    ...[-.57, .04, .6].map((x, index) => box("分别抵达各槽下方的承重竖隔板", [x, [.39, .28, .18][index]!, .02], [.045, [.48, .26, .08][index]!, .57], material.wood)),
    ...[[-.26, .79], [.315, .57]].flatMap(([x, y]) => [box("跨过槽壁上沿而向下一级导流的U槽底", [x!, y!, .02], [.13, .018, .15], material.steel), ...[-1, 1].map(side => box("小导流槽两侧实际挡水的薄唇", [x!, y! + .027, .02 + side * .07], [.13, .045, .01], material.steel))]),
  ] },
];
