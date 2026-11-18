import type { ModelPart, Triple } from "../assetModelParts";
import { box, cylinder, ball, rod, loop, cord, plate, piercedPanel, bars, legs, material, type MasterPrototype } from "./parts";

function squareFrame(name: string, center: Triple, width: number, depth: number, diameter = .025, color = material.steel): ModelPart[] {
  const [x, y, z] = center;
  return [...[-1, 1].map(side => rod(name, [x - width / 2, y, z + side * depth / 2], [x + width / 2, y, z + side * depth / 2], diameter, color)), ...[-1, 1].map(side => rod(name, [x + side * width / 2, y, z - depth / 2], [x + side * width / 2, y, z + depth / 2], diameter, color))];
}

function bowProfile(points: [number, number][], halfWidth: number): [number, number][] {
  const sides = points.map((point, index) => {
    const previous = points[Math.max(0, index - 1)]!, next = points[Math.min(points.length - 1, index + 1)]!, dx = next[0] - previous[0], dy = next[1] - previous[1], factor = halfWidth / Math.hypot(dx, dy);
    return [[point[0] - dy * factor, point[1] + dx * factor], [point[0] + dy * factor, point[1] - dx * factor]] as [[number, number], [number, number]];
  });
  return [...sides.map(side => side[0]), ...sides.toReversed().map(side => side[1])];
}

export const furnitureExpansionBatchTwoObjects: MasterPrototype[] = [
  { name: "钢丝网菱角壳椅", theme: "现代", itemType: "家具", build: () => {
    const point = (u: number, v: number): Triple => [u * .38 * (1 - .17 * v * v), .45 + .18 * u * u + .24 * v * v + .19 * v, .36 * v];
    const parts: ModelPart[] = [];
    for (let index = 0; index < 7; index++) { const fixed = -1 + index / 3; parts.push(cord("纵向弧形承坐钢丝", Array.from({ length: 5 }, (_, step) => point(fixed, step / 2 - 1)), .0045), cord("横向交叉承坐钢丝", Array.from({ length: 5 }, (_, step) => point(step / 2 - 1, fixed)), .0045)); }
    for (const side of [-1, 1]) parts.push(cord("外缘连续承力框", Array.from({ length: 5 }, (_, step) => point(side, step / 2 - 1)), .013), cord("前后缘闭合承力框", Array.from({ length: 5 }, (_, step) => point(step / 2 - 1, side)), .013));
    for (const side of [-1, 1]) parts.push(rod("前部斜向承重腿", [side * .27, .025, -.24], [side * .22, .47, -.16], .02), rod("后侧向外展开支腿", [side * .28, .025, .29], [side * .22, .52, .18], .02), rod("侧面连接腿与壳框的撑杆", [side * .22, .5, -.05], [side * .35, .62, .08], .016));
    parts.push(rod("脚间低位抗扭联杆", [-.27, .1, -.21], [.27, .1, -.21], .016));
    return parts;
  } },
  { name: "整体S曲面悬臂椅", theme: "现代", itemType: "家具", build: () => [
    plate("从地面底板连续回折为座背的整体厚壳", [0, 0, 0], bowProfile([[-.2, .025], [.15, .025], [.29, .07], [.3, .2], [.2, .34], [.13, .41], [-.1, .43], [-.27, .49], [-.32, .65], [-.34, .87], [-.25, .97]], .018), .47, material.ivory, [0, 90, 0]),
    ...[-1, 1].map(side => box("底面不可见的防滑胶条", [side * .19, .003, -.02], [.045, .006, .32], material.dark)),
  ] },
  { name: "旋升油压理发椅", theme: "现代", itemType: "家具", build: () => [
    cylinder("承受偏载的加重圆盘底座", [0, .045, .04], [.71, .09, .71]), cylinder("液压升降外柱", [0, .22, .04], [.16, .34, .16], material.dark), cylinder("座架回转活塞", [0, .4, .04], [.095, .22, .095]),
    box("独立厚坐垫", [0, .55, -.02], [.55, .13, .51], material.dark), box("可倾高靠背", [0, .85, .23], [.54, .57, .13], material.red, [-9, 0, 0]),
    ...[-1, 1].flatMap(side => [rod("座侧扶手前支柱", [side * .31, .48, -.19], [side * .31, .73, -.19], .028), rod("座侧扶手后接柱", [side * .31, .48, .18], [side * .31, .73, .18], .028), box("独立软包扶手", [side * .31, .76, -.01], [.085, .065, .44], material.dark)]),
    ...[-1, 1].map(side => rod("脚踏板外伸弯托", [side * .24, .45, -.2], [side * .24, .22, -.62], .028)),
    box("前伸支脚踏板", [0, .22, -.62], [.54, .035, .24], material.steel, [10, 0, 0]),
    ...bars("踏板止滑凸条", 7, [0, .245, -.62], .42, [.018, .008, .22], 0, material.dark),
    rod("头枕伸缩支杆", [0, 1.05, .24], [0, 1.28, .29], .018), box("两侧托住颈部的软枕", [0, 1.265, .275], [.26, .115, .13], material.dark),
    rod("底部脚踩液压泵杆", [.12, .16, .04], [.35, .09, .1], .022), box("液压升降脚踏", [.35, .095, .1], [.13, .025, .1], material.dark),
  ] },
  { name: "分段滚轮包裹按摩椅", theme: "现代", itemType: "家具", build: () => [
    box("承载靠背导轨的低位底座", [0, .15, .08], [.79, .24, 1.01], material.dark), box("人体臀部承坐软垫", [0, .43, -.04], [.59, .16, .57], material.red),
    ...[-1, 1].map(side => plate("包裹手臂的弧形高侧壳", [side * .36, 0, 0], [[-.59, .18], [-.52, .63], [-.28, .78], [.25, .8], [.43, .51], [.43, .18]], .08, material.ivory, [0, 90, 0])),
    box("背部后仰承重骨架", [0, .93, .34], [.61, .92, .11], material.dark, [-23, 0, 0]),
    ...Array.from({ length: 6 }, (_, index) => { const y = .64 + index * .12, z = .17 + index * .048; return [...[-1, 1].map(side => ball("沿脊柱两侧排列的独立按摩软滚轮", [side * .12, y, z], [.2, .16, .095], material.red)), rod("两滚轮共用的横向行走轴", [-.2, y, z + .055], [.2, y, z + .055], .018)]; }).flat(),
    ...[-1, 1].map(side => box("包裹前臂的独立软槽", [side * .33, .65, -.11], [.13, .13, .56], material.dark)),
    ...[-1, 1].flatMap(side => [plate("小腿按摩器两侧包裹壁", [side * .27, .13, -.57], [[-.13, 0], [.13, 0], [.13, .4], [-.08, .48], [-.13, .4]], .04, material.ivory, [0, 0, 0]), box("每条小腿的独立软滚面", [side * .14, .29, -.62], [.17, .34, .1], material.red, [-12, 0, 0]), box("脚底独立按摩踏托", [side * .14, .135, -.76], [.22, .09, .26], material.dark)]),
    rod("后背两侧的导轨横联", [-.27, .54, .37], [.27, .54, .37], .035),
  ] },
  { name: "三足折合手杖凳", theme: "现代", itemType: "家具", build: () => [
    rod("落地手杖主杆", [0, .02, .17], [0, .84, .17], .024), cord("可握持的回弯杖柄", [[0, .84, .17], [0, .9, .15], [0, .92, .07], [0, .88, .025]], .016, material.wood),
    ...[-1, 1].map(side => rod("从主杆中部向前展开的折合脚", [0, .48, .16], [side * .23, .02, -.19], .024)),
    plate("三点支撑的轻薄承坐板", [0, .54, .01], [[-.25, -.2], [.25, -.2], [.12, .2], [-.12, .2]], .027, material.wood),
    ...[-1, 1].map(side => rod("坐面前侧到脚杆的短斜撑", [side * .2, .53, -.15], [side * .12, .25, -.02], .016)),
    ...[[0, .02, .17], [-.23, .02, -.19], [.23, .02, -.19]].map(position => ball("可抓地的软胶杖脚", position as Triple, [.043, .038, .043], material.dark)),
    cylinder("展开后锁住两脚的横铰盘", [0, .48, .17], [.07, .045, .07], material.dark, [90, 0, 0]),
  ] },
  { name: "弹簧弧脚婴儿躺椅", theme: "现代", itemType: "家具", build: () => [
    ...[-1, 1].map(side => cord("从地面连续回折为躺背的弹性框", [[side * .21, .025, .32], [side * .21, .018, -.34], [side * .21, .07, -.4], [side * .21, .22, -.27], [side * .21, .43, .06], [side * .21, .69, .32]], .012)),
    ...[-1, 1].map(side => rod("前后框间横向联杆", [-.21, side < 0 ? .023 : .68, side < 0 ? -.34 : .32], [.21, side < 0 ? .023 : .68, side < 0 ? -.34 : .32], .012)),
    box("倾斜悬挂的柔性躺面", [0, .41, .03], [.39, .035, .75], material.red, [-40, 0, 0]),
    box("腰部三点束护带", [0, .36, -.05], [.35, .012, .07], material.ivory), box("胯部防滑落束带", [0, .3, -.15], [.07, .02, .16], material.ivory, [-40, 0, 0]),
    ...[-1, 1].map(side => rod("翻到后方的防摇止动脚", [side * .21, .05, .25], [side * .21, .02, .39], .018, material.dark)),
    box("头枕承托垫", [0, .615, .26], [.31, .065, .17], material.ivory, [-40, 0, 0]),
  ] },
  { name: "内折铰链婴儿游戏围栏", theme: "现代", itemType: "家具", build: () => {
    const parts: ModelPart[] = [box("柔软防滑的独立地垫", [0, .012, 0], [1.34, .024, 1.34], material.ivory)];
    for (const side of [-1, 1]) for (const axis of [0, 2] as const) {
      for (const offset of [-.66, 0, .66]) { const p: Triple = [0, .36, 0]; p[axis] = offset; p[axis === 0 ? 2 : 0] = side * .66; parts.push(cylinder("连接折栏的竖铰柱", p, [.035, .72, .035], material.wood)); }
      for (const y of [.08, .68]) { const a: Triple = [0, y, 0], b: Triple = [0, y, 0]; a[axis] = -.66; b[axis] = .66; a[axis === 0 ? 2 : 0] = b[axis === 0 ? 2 : 0] = side * .66; parts.push(rod("可从中央向内收折的框边", a, b, .025, material.wood)); }
      for (let index = 0; index < 11; index++) { const p: Triple = [0, .38, 0]; p[axis] = -.58 + index * .116; p[axis === 0 ? 2 : 0] = side * .66; parts.push(cylinder("可看穿的防钻出竖栏", p, [.014, .58, .014], material.wood)); }
    }
    parts.push(box("双动作门闩的搭接桥", [.66, .67, .03], [.055, .045, .16], material.dark), cylinder("门闩上提按钮", [.66, .707, .03], [.03, .03, .03], material.red));
    return parts;
  } },
  { name: "站台倾斜倚靠座", theme: "现代", itemType: "家具", build: () => [
    ...[-1, 1].flatMap(side => [box("落地固定脚板", [side * .58, .015, .03], [.19, .03, .33]), rod("倾向乘客臀部的支柱", [side * .58, .035, .06], [side * .58, .79, 0], .06), ...[-1, 1].map(z => cylinder("脚板四角固定螺帽", [side * .58, .035, .03 + z * .11], [.022, .014, .022], material.dark))]),
    box("只供短暂停靠的窄倾斜托臀板", [0, .83, 0], [1.45, .055, .23], material.wood, [21, 0, 0]),
    rod("两支柱之间的通长承力梁", [-.6, .76, .03], [.6, .76, .03], .05),
    ...bars("倚靠面上的止滑横筋", 9, [0, .865, -.035], 1.2, [.015, .009, .19], 0, material.dark),
  ] },
  { name: "可叠合三件套几", theme: "现代", itemType: "家具", build: () => {
    const parts: ModelPart[] = [];
    for (let index = 0; index < 3; index++) {
      const width = .66 - index * .13, depth = .46 - index * .08, height = .58 - index * .11, x = index * .14;
      parts.push(box("能从大桌下完整抽出的独立桌面", [x, height, 0], [width, .027, depth], material.wood));
      for (const side of [-1, 1]) parts.push(rod("前侧承重细腿", [x + side * (width / 2 - .025), .015, -.19 - index * .012], [x + side * (width / 2 - .025), height - .015, -depth / 2 + .025], .025), rod("后侧承重细腿", [x + side * (width / 2 - .025), .015, depth / 2 - .025], [x + side * (width / 2 - .025), height - .015, depth / 2 - .025], .025));
      parts.push(rod("仅在后侧连接的套叠避让拉梁", [x - width / 2 + .025, .12, depth / 2 - .025], [x + width / 2 - .025, .12, depth / 2 - .025], .018));
    }
    return parts;
  } },
  { name: "C形伸入沙发边几", theme: "现代", itemType: "家具", build: () => [
    box("可伸入沙发下方的低扁底脚", [0, .018, 0], [.36, .035, .5], material.dark), box("位于一侧而不挡腿的连续立板", [0, .3, .22], [.33, .56, .035], material.dark),
    box("越过坐面上方的悬挑台板", [0, .59, -.015], [.44, .035, .54], material.wood),
    ...[-1, 1].map(side => box("台板与立板之间的短三角加强肋", [side * .13, .53, .15], [.02, .09, .14], material.steel, [-18, 0, 0])),
    ...[-1, 1].map(side => box("底板软胶防刮条", [side * .14, .002, 0], [.035, .004, .42], material.dark)),
  ] },
  { name: "夹装扶手托盘桌", theme: "现代", itemType: "家具", build: () => [
    box("放在座椅扶手上的浅托盘底", [0, .24, 0], [.34, .018, .44], material.wood),
    ...[-1, 1].map(side => box("托盘长边防滚挡唇", [side * .165, .265, 0], [.014, .04, .44], material.wood)),
    ...[-1, 1].map(side => box("托盘前后短挡唇", [0, .265, side * .213], [.33, .04, .014], material.wood)),
    ...[-1, 1].flatMap(side => [box("夹住软包扶手两侧的长夹板", [side * .11, .145, 0], [.018, .18, .33], material.wood), box("夹板内侧软胶垫", [side * .097, .145, 0], [.009, .14, .28], material.dark), cylinder("夹板顶部可转铰轴", [side * .11, .236, 0], [.018, .33, .018], material.steel, [90, 0, 0])]),
    ...[-1, 1].map(side => rod("两夹板之间的横向弹簧轴", [-.11, .195, side * .13], [.11, .195, side * .13], .012)),
  ] },
  { name: "顶挂钢索升降储物架", theme: "现代", itemType: "家具", build: () => [
    ...squareFrame("吊装平台的四边主梁", [0, .2, 0], 1.24, .86, .035),
    ...bars("承物平台的透空横向格条", 9, [0, .2, 0], .79, [1.22, .018, .018], 2),
    ...[-1, 1].flatMap(x => [-1, 1].map(z => rod("保持平台水平的四角钢索", [x * .62, .22, z * .43], [x * .62, 1.66, z * .43], .004))),
    ...[-1, 1].flatMap(side => [box("固定在天花的双索承重梁", [side * .62, 1.7, 0], [.075, .06, 1.02]), ...[-1, 1].map(z => cylinder("顶部改变钢索走向的滑轮", [side * .62, 1.66, z * .43], [.065, .025, .065], material.dark, [0, 0, 90]))]),
    cylinder("同步卷起四根钢索的横向卷轴", [0, 1.72, .43], [.075, 1.3, .075], material.dark, [0, 0, 90]), box("卷索轴端的减速驱动盒", [.73, 1.72, .43], [.17, .14, .16], material.ivory),
    ...[-1, 1].map(side => rod("两侧天花梁之间的固定联杆", [-.62, 1.7, side * .43], [.62, 1.7, side * .43], .025)),
  ] },
  { name: "四角卷索天花晾衣台", theme: "现代", itemType: "家具", build: () => [
    ...[-1, 1].map(side => rod("整幅晾衣台的两根长挂杆", [-.79, .24, side * .24], [.79, .24, side * .24], .02)),
    ...[-1, 1].map(side => rod("挂杆端部连接横撑", [side * .79, .24, -.24], [side * .79, .24, .24], .02)),
    ...bars("可平放织物的中间横撑", 7, [0, .24, 0], 1.25, [.014, .014, .48], 0),
    ...[-1, 1].flatMap(x => [-1, 1].map(z => rod("四角同步升降拉索", [x * .7, .25, z * .24], [x * .7, 1.61, z * .24], .003))),
    box("顶装长形卷索机体", [0, 1.66, 0], [1.35, .1, .21], material.ivory),
    ...[-1, 1].flatMap(side => [-1, 1].map(z => cylinder("机体两端独立导向索轮", [side * .7, 1.625, z * .24], [.05, .02, .05], material.dark, [0, 0, 90]))),
    ...[-1, 1].flatMap(side => [-1, 1].map(z => rod("机体到边轮的刚性撑臂", [side * .59, 1.65, 0], [side * .7, 1.625, z * .24], .016))),
    ...Array.from({ length: 8 }, (_, index) => loop("衣架不会滑走的独立限位小环", [-.62 + index * .177, .22, -.24], .015, .004, [90, 0, 0])),
  ] },
  { name: "折伸风琴挂墙衣钩架", theme: "现代", itemType: "家具", build: () => {
    const parts: ModelPart[] = [];
    for (let index = 0; index < 7; index++) {
      const x = -.54 + index * .18;
      if (index < 6) parts.push(rod("前层连续剪叉木条", [x, .08, 0], [x + .18, .34, 0], .028, material.wood), rod("后层交叉反向木条", [x, .34, .024], [x + .18, .08, .024], .028, material.wood));
      parts.push(cylinder("上下剪叉铰点的承重木钩", [x, index % 2 ? .34 : .08, -.035], [.035, .095, .035], material.wood, [90, 0, 0]), ball("挂钩末端防脱球头", [x, index % 2 ? .34 : .08, -.09], [.046, .046, .046], material.wood));
    }
    parts.push(...[-1, 1].map(side => loop("背面挂墙的固定眼", [side * .54, .39, .025], .025, .006, [90, 0, 0])));
    return parts;
  } },
  { name: "垂直转盘双面鞋塔", theme: "现代", itemType: "家具", build: () => {
    const parts: ModelPart[] = [cylinder("加重转塔底盘", [0, .035, 0], [.62, .07, .62], material.dark), cylinder("中央通长回转立轴", [0, .85, 0], [.065, 1.62, .065]), loop("底部承受转动的滚动环", [0, .09, 0], .18, .016)];
    for (let tier = 0; tier < 4; tier++) {
      const y = .2 + tier * .36;
      parts.push(box("每层鞋靴背靠的竖直中心分隔板", [0, y + .12, 0], [.46, .25, .025], material.wood), ...[-1, 1].map(side => box("向外倾斜并可从两面取鞋的托板", [0, y, side * .15], [.5, .025, .27], material.wood, [side * 12, 0, 0])), ...[-1, 1].map(side => rod("避免鞋尖滑落的前沿挡杆", [-.24, y - .01, side * .28], [.24, y - .01, side * .28], .016)));
    }
    parts.push(cylinder("转轴顶端防脱圆帽", [0, 1.69, 0], [.11, .035, .11], material.dark));
    return parts;
  } },
  { name: "偏轴翻折壁藏熨衣柜", theme: "现代", itemType: "家具", build: () => [
    box("壁装柜背板", [0, .78, .14], [.41, 1.5, .025], material.wood),
    ...[-1, 1].map(side => box("熨衣柜两侧承重板", [side * .21, .78, .04], [.025, 1.5, .23], material.wood)), box("柜顶封板", [0, 1.53, .04], [.445, .025, .23], material.wood),
    plate("能翻入狭柜的长圆头熨衣板", [0, .81, -.63], [[-.15, -.61], [.15, -.61], [.15, .33], [.11, .46], [0, .5], [-.11, .46], [-.15, .33]], .035, material.ivory),
    rod("熨衣板根部横向翻折轴", [-.17, .805, -.13], [.17, .805, -.13], .025),
    ...[-1, 1].map(side => rod("从柜内下方支撑板面的折臂", [side * .15, .39, .01], [side * .15, .815, -.59], .018)),
    box("打开后贴到侧面的狭柜门", [.38, .78, .02], [.36, 1.45, .02], material.wood, [0, -95, 0]),
    ...[1.15, 1.39].map(y => box("柜内熨斗及喷水瓶搁板", [0, y, .035], [.39, .018, .19], material.wood)),
    box("柜门侧的短拉手", [.38, .84, -.18], [.022, .14, .025], material.dark),
  ] },
  { name: "台下垃圾分拣抽架", theme: "现代", itemType: "家具", build: () => [
    ...squareFrame("可从橱柜内滑出的底架", [0, .08, -.19], .46, .65, .025),
    ...[-1, 1].map(side => rod("柜内纵向固定滑轨", [side * .245, .07, -.56], [side * .245, .07, .43], .02)),
    ...[-1, 1].map(side => box("夹住垃圾桶提沿的顶部长托条", [side * .22, .59, -.19], [.035, .025, .65])),
    ...[-.35, -.03].flatMap(z => [box("可独立取出的分拣桶底", [0, .13, z], [.38, .02, .28], material.ivory), ...[-1, 1].map(side => box("分拣桶左右薄壁", [side * .19, .34, z], [.018, .42, .28], material.ivory)), ...[-1, 1].map(side => box("分拣桶前后薄壁", [0, .34, z + side * .14], [.38, .42, .018], material.ivory)), ...[-1, 1].map(side => rod("可上提桶沿的提柄铰轴", [side * .2, .53, z - .045], [side * .2, .53, z + .045], .012))]),
    ...[-1, 1].map(side => rod("上托条与下滑架的立柱", [side * .22, .09, -.48], [side * .22, .58, -.48], .022)),
    box("与抽架联动的橱柜门面", [0, .35, -.55], [.51, .63, .025], material.wood), rod("拉出整幅分拣架的横把", [-.095, .6, -.58], [.095, .6, -.58], .014),
  ] },
  { name: "转角双篮联动拉柜架", theme: "现代", itemType: "家具", build: () => [
    ...[-1, 1].map(side => rod("柜底固定导轨", [-.46, .08, side * .2], [.45, .08, side * .2], .025)),
    box("拉篮导轨安装底板", [0, .04, .04], [.98, .045, .52], material.steel),
    ...[-.28, .32].flatMap((x, index) => [box("在柜角不同深度的拉篮底板", [x, .19 + index * .3, index ? .12 : -.24], [.48, .018, .39], material.steel), ...squareFrame("篮筐保持器物不滑出的上沿", [x, .33 + index * .3, index ? .12 : -.24], .47, .38, .014), ...[-1, 1].flatMap(side => [-1, 1].map(z => rod("拉篮底面与上缘的竖丝", [x + side * .235, .2 + index * .3, (index ? .12 : -.24) + z * .19], [x + side * .235, .33 + index * .3, (index ? .12 : -.24) + z * .19], .008)))]),
    ...[-1, 1].map(side => rod("拉出前篮时带动后篮的平面连杆", [-.3, .14, side * .12], [.32, .44, side * .12 + .09], .02)),
    cylinder("后篮从柜角回转的竖直铰轴", [.32, .31, .25], [.055, .5, .055]), box("可与柜门相连的前拉安装板", [-.52, .33, -.24], [.025, .52, .4], material.wood),
  ] },
  { name: "门后折挂清洁工具柜", theme: "现代", itemType: "家具", build: () => [
    box("狭深柜的贴墙背板", [0, .93, .08], [.54, 1.79, .025], material.wood), ...[-1, 1].map(side => box("两侧狭深立板", [side * .28, .93, -.015], [.025, 1.79, .23], material.wood)),
    ...[.06, 1.82].map(y => box("狭柜上下封板", [0, y, -.015], [.58, .025, .23], material.wood)),
    box("翻开后仍可挂工具的柜门背板", [.5, .93, -.06], [.48, 1.73, .025], material.wood, [0, -35, 0]),
    ...[.65, 1.22].map(y => rod("门背挂具的水平承载条", [.32, y, -.17], [.69, y, .09], .02)),
    ...Array.from({ length: 4 }, (_, index) => cord("夹住长柄工具的独立弹性挂钩", [[-.19 + index * .125, 1.48, .035], [-.19 + index * .125, 1.45, -.04], [-.16 + index * .125, 1.41, -.04], [-.13 + index * .125, 1.45, -.04]], .007)),
    box("底端防滴水的承接浅盘", [0, .14, -.015], [.5, .02, .18], material.ivory), ...[-1, 1].map(side => box("承水盘左右挡边", [side * .245, .17, -.015], [.012, .06, .18], material.ivory)),
    ...[.18, 1.68].map(y => cylinder("柜门两端铰轴", [.278, y, -.115], [.018, .07, .018], material.dark)),
  ] },
  { name: "逐层回转画纸存放架", theme: "现代", itemType: "家具", build: () => [
    ...[-1, 1].map(side => box("可移动落地底梁", [side * .35, .08, .02], [.08, .06, .78], material.dark)),
    ...[-1, 1].map(side => rod("前高后低的纸架承重侧柱", [side * .35, .1, .33], [side * .35, 1.32, .33], .035)),
    ...Array.from({ length: 8 }, (_, index) => { const y = .24 + index * .135, angle = index > 5 ? -24 : 0; return [rod("每层纸架的独立后铰轴", [-.35, y, .33], [.35, y, .33], .012), box("逐层可掀起的薄网承纸面", [0, y + (angle ? .13 : 0), 0], [.68, .012, .66], material.ivory, [angle, 0, 0]), ...[-1, 1].map(side => rod("纸架两侧的细框加强边", [side * .34, y, .33], [side * .34, y + (angle ? .268 : 0), -.33], .009))]; }).flat(),
    rod("两立柱顶部的抗扭横撑", [-.35, 1.32, .33], [.35, 1.32, .33], .025),
    ...[-1, 1].flatMap(side => [-1, 1].map(z => cylinder("底梁四角的小移动轮", [side * .35, .045, z * .31], [.085, .035, .085], material.dark, [0, 0, 90]))),
  ] },
  { name: "单柱螺旋托片玻璃陈列架", theme: "现代", itemType: "家具", build: () => [
    cylinder("加重锥形低底座", [0, .035, 0], [.59, .07, .59], material.dark), cylinder("带多高度夹箍的中心立柱", [0, .91, 0], [.055, 1.76, .055]),
    ...Array.from({ length: 5 }, (_, index) => { const angle = index * 137.5 * Math.PI / 180, x = Math.cos(angle) * .19, z = Math.sin(angle) * .19, y = .35 + index * .3; return [loop("夹住立柱的可调紧固箍", [0, y - .04, 0], .038, .009), rod("从中心挑出承托片的横臂", [0, y - .04, 0], [x, y - .04, z], .016), { ...cylinder("无边框透明圆形陈列托片", [x, y, z], [.34, .012, .34], material.glass), opacity: .28 }, ball("托片下方软垫", [x, y - .017, z], [.045, .015, .045], material.dark)]; }).flat(),
    cylinder("立柱顶端圆帽", [0, 1.82, 0], [.07, .03, .07], material.steel),
  ] },
  { name: "翻盖通仓软垫储物凳", theme: "现代", itemType: "家具", build: () => [
    box("储物凳底部承重板", [0, .11, 0], [.84, .035, .4], material.wood), ...[-1, 1].map(side => box("完整箱仓的左右端板", [side * .407, .29, 0], [.025, .36, .4], material.wood)),
    ...[-1, 1].map(side => box("完整箱仓的前后壁板", [0, .29, side * .187], [.79, .36, .025], material.wood)),
    box("绕后边翻开的整幅软坐垫", [0, .6473, .0534], [.87, .085, .43], material.red, [47, 0, 0]),
    rod("坐垫后侧的通长翻转铰轴", [-.4, .49, .2], [.4, .49, .2], .016),
    ...[-1, 1].map(side => rod("防止盖板突然落下的限位撑", [side * .34, .28, .1], [side * .34, .74, -.03], .012)),
    ...legs(.67, .29, .095, .055),
  ] },
  { name: "双扇抽扩手工工作台", theme: "现代", itemType: "家具", build: () => [
    piercedPanel("中央固定台板真正贯通的两条夹持槽", [0, .7925, 0], [[-.39, -.335], [.39, -.335], [.39, .335], [-.39, .335]], [-1, 1].map(side => [[side * .18 - .0125, -.285], [side * .18 - .0125, .285], [side * .18 + .0125, .285], [side * .18 + .0125, -.285]] as [number, number][]), .055, material.wood), ...legs(.65, .52, .79, .06),
    ...[-1, 1].flatMap(side => [box("抽出后与中央台平齐的扩展板", [side * .7, .82, 0], [.6, .055, .67], material.wood), ...[-1, 1].map(z => rod("沿台板下方滑出的成对方导杆", [side * .1, .765, z * .23], [side * .91, .765, z * .23], .03)), rod("扩展板外缘展开的支脚", [side * .94, .02, .24], [side * .94, .79, .24], .04), rod("展开支脚到主架的折合斜撑", [side * .94, .39, .24], [side * .32, .62, .24], .02)]),
    box("主架下方的整幅工具层板", [0, .25, 0], [.69, .025, .54], material.wood),
  ] },
  { name: "可抽出阶梯储物踏凳", theme: "现代", itemType: "家具", build: () => [
    ...[-1, 1].map(side => plate("承托最高踏面的侧箱板", [side * .22, 0, 0], [[-.22, .02], [.2, .02], [.2, .46], [-.22, .46]], .025, material.wood, [0, 90, 0])),
    piercedPanel("最高坐踏平台带真正贯通的手提孔", [0, .4525, 0], [[-.24, -.225], [.24, -.225], [.24, .225], [-.24, .225]], [[[-.065, -.012], [-.065, .012], [.065, .012], [.065, -.012]]], .035, material.wood),
    piercedPanel("可拉出的低踏板带真正贯通的手提孔", [0, .225, -.39], [[-.2, -.165], [.2, -.165], [.2, .165], [-.2, .165]], [[[-.065, -.012], [-.065, .012], [.065, .012], [.065, -.012]]], .03, material.wood),
    ...[-1, 1].map(side => box("低踏板两侧的落地承重脚", [side * .185, .12, -.4], [.025, .22, .31], material.wood)),
    ...[-1, 1].map(side => rod("让低踏板沿箱内滑出的纵向导轨", [side * .19, .22, -.51], [side * .19, .22, .13], .016)),
    box("侧箱后方的封板", [0, .245, .2], [.44, .43, .025], material.wood),
    box("上台内独立抽斗面", [0, .36, -.23], [.38, .14, .018], material.wood), rod("抽斗前部指拉手", [-.055, .36, -.255], [.055, .36, -.255], .012),
  ] },
  { name: "栅扇滑叠室内宠物门", theme: "现代", itemType: "家具", build: () => [
    ...[-1, 1].flatMap(side => [box("抵住门洞两边的竖直压紧柱", [side * .6, .46, 0], [.045, .9, .06], material.ivory), ...[.17, .73].map(y => rod("压紧柱的横向调宽螺杆", [side * .6, y, 0], [side * .69, y, 0], .012)), ...[.17, .73].map(y => cylinder("螺杆末端墙面软压盘", [side * .7, y, 0], [.055, .018, .055], material.dark, [0, 0, 90]))]),
    ...[-.28, .22].flatMap((x, index) => [box("滑叠门扇上框", [x, .86, index * .045], [.66, .025, .025], material.ivory), box("滑叠门扇下框", [x, .08, index * .045], [.66, .025, .025], material.ivory), ...[-1, 1].map(side => rod("独立门扇两边立框", [x + side * .32, .08, index * .045], [x + side * .32, .86, index * .045], .022, material.ivory)), ...bars("滑叠扇真实透空的竖栏", 7, [x, .47, index * .045], .54, [.013, .75, .013], 0, material.ivory)]),
    rod("下部双扇错层行走导轨", [-.6, .055, .022], [.6, .055, .022], .018), box("重叠区域顶部双动作门扣", [.04, .885, .02], [.09, .06, .08], material.dark),
  ] },
];
