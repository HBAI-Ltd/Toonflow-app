import { part, type ModelPart, type Triple } from "../assetModelParts";
import { box, cylinder, loop, rod, ball, cord, bars, plate, piercedPanel, legs, material, type MasterPrototype } from "./parts";

export function optic(position: Triple, radius: number, length: number): ModelPart[] {
  const [x, y, z] = position;
  return [part("前后通孔的调焦镜筒壁", "lathe", material.dark, position, [1, 1, 1], [90, 0, 0], { profile: [{ x: radius * .83, y: -length / 2 }, { x: radius, y: -length / 2 }, { x: radius, y: length / 2 }, { x: radius * .83, y: length / 2 }, { x: radius * .83, y: -length / 2 }] }), cylinder("内凹在筒中的光学镜片", [x, y, z - length / 2 + .008], [radius * 1.6, .006, radius * 1.6], material.glass, [90, 0, 0])];
}

export function reel(position: Triple, radius: number, flat = false): ModelPart[] {
  const [x, y, z] = position, rotation: Triple = flat ? [0, 0, 0] : [90, 0, 0];
  return [loop("透空胶片盘盘缘", position, radius, radius * .055, rotation), cylinder("胶片盘中间轴套", position, [radius * .23, .028, radius * .23], material.dark, rotation), ...Array.from({ length: 5 }, (_, index) => { const a = index * Math.PI * 2 / 5; return rod("盘缘与轴套之间的实体辐条", position, flat ? [x + Math.cos(a) * radius * .96, y, z + Math.sin(a) * radius * .96] : [x + Math.cos(a) * radius * .96, y + Math.sin(a) * radius * .96, z], radius * .055); })];
}

export function cabinetShell(width: number, height: number, depth: number, baseHeight = 0, includeTop = true): ModelPart[] {
  const result = [box("底部承重台盘", [0, baseHeight + .025, 0], [width, .05, depth]), box("后侧封闭机壁", [0, baseHeight + height / 2, depth / 2 - .015], [width, height, .03], material.dark), ...[-1, 1].map(side => box("左右独立的机柜薄壁", [side * (width / 2 - .015), baseHeight + height / 2, 0], [.03, height, depth]))];
  if (includeTop) result.push(box("机顶连接梁", [0, baseHeight + height - .02, 0], [width, .04, depth], material.dark));
  return result;
}

export const electronicExpansionBatchTwoObjects: MasterPrototype[] = [
  { name: "气动升降底座演播室摄像机", theme: "现代", build: () => [
    ...Array.from({ length: 3 }, (_, index) => { const a = index * Math.PI * 2 / 3; return [rod("底盘三向承力臂", [0, .15, 0], [Math.cos(a) * .48, .12, Math.sin(a) * .48], .08), ball("低位万向轮", [Math.cos(a) * .48, .075, Math.sin(a) * .48], [.14, .15, .14], material.dark)]; }).flat(),
    cylinder("平衡摄像机重量的外气缸", [0, .52, 0], [.2, .86, .2]), cylinder("气动升降内立柱", [0, 1.13, 0], [.12, .65, .12]), loop("操作者可握的环形转向圈", [0, .83, 0], .31, .025, [0, 0, 0], material.dark),
    ...Array.from({ length: 3 }, (_, index) => { const a = index * Math.PI * 2 / 3; return rod("转向圈的三向支辐", [0, .83, 0], [Math.cos(a) * .3, .83, Math.sin(a) * .3], .018); }),
    box("液压云台承台", [0, 1.48, 0], [.27, .09, .24], material.dark), box("带箱式长焦镜头的摄像机主壳", [0, 1.7, -.01], [.28, .35, .46], material.ivory),
    box("前部遮光斗外框上沿", [0, 1.8, -.38], [.33, .035, .23], material.dark), box("前部遮光斗外框下沿", [0, 1.58, -.38], [.33, .035, .23], material.dark),
    ...[-1, 1].map(side => box("遮光斗侧壁", [side * .15, 1.69, -.38], [.03, .2, .23], material.dark)), ...optic([0, 1.69, -.3], .09, .18),
    rod("后置操纵摇臂左杆", [-.14, 1.55, .15], [-.28, 1.45, .57], .025), rod("后置操纵摇臂右杆", [.14, 1.55, .15], [.28, 1.45, .57], .025),
    box("机后大取景监视器", [0, 1.84, .29], [.27, .2, .06], material.dark), box("后向取景屏", [0, 1.84, .323], [.23, .16, .006], material.glass),
  ] },
  { name: "三角桁架配重摄影摇臂", theme: "现代", build: () => [
    ...Array.from({ length: 3 }, (_, index) => { const a = index * Math.PI * 2 / 3; return rod("向外展开的三脚落地支腿", [0, 1.1, 0], [Math.cos(a) * .75, .045, Math.sin(a) * .75], .065); }),
    cylinder("中央偏航回转柱", [0, 1.03, 0], [.15, 1.1, .15], material.dark), cylinder("俯仰轴承座", [0, 1.65, 0], [.17, .4, .17], material.steel, [0, 0, 90]),
    ...[-1, 1].flatMap(side => [rod("前臂桁架两侧下弦", [side * .13, 1.65, -.1], [side * .13, 2.8, -3.3], .043), rod("后臂桁架两侧下弦", [side * .13, 1.65, .1], [side * .13, 1.2, 1.35], .043)]),
    rod("三角桁架上弦", [0, 1.88, -.1], [0, 3.03, -3.3], .043),
    ...Array.from({ length: 5 }, (_, i) => { const t = i / 4, z = -.1 - t * 3.2, y = 1.65 + t * 1.15, advance = i === 4 ? 0 : .22; return [rod("桁架横向连接杆", [-.13, y, z], [.13, y, z], .025), ...[-1, 1].map(side => rod("上弦至下弦的三角腹杆", [0, y + .23, z], [side * .13, y + advance * 1.15 / 3.2, z - advance], .022))]; }).flat(),
    box("后端配重承架", [0, 1.2, 1.35], [.46, .08, .34], material.dark), ...[-1, 1].map(side => box("后臂实体配重块", [side * .13, 1.34, 1.35], [.18, .22, .29], material.dark)),
    rod("末端自平衡悬挂立轴", [0, 2.8, -3.3], [0, 2.48, -3.3], .04), box("末端摄影机承台", [0, 2.45, -3.3], [.27, .035, .28]), box("末端轻型摄像头", [0, 2.54, -3.34], [.18, .15, .25], material.dark), ...optic([0, 2.54, -3.51], .047, .1),
    rod("从后臂到末端的平行保持拉索", [0, 1.42, 1.35], [0, 2.62, -3.3], .008, material.dark),
  ] },
  { name: "帘式自助证件照亭", theme: "现代", itemType: "设施", build: () => [
    box("证件照亭低位地台", [0, .04, 0], [1.4, .08, 1.25], material.dark), box("后方坐席背景壁", [0, 1.23, .59], [1.4, 2.3, .06], material.ivory), box("左侧照相机柜后壁", [-.57, 1.23, 0], [.23, 2.3, 1.18]),
    box("顶部遮光棚", [0, 2.4, 0], [1.4, .08, 1.25], material.dark), box("坐席短凳垫", [.24, .56, .12], [.65, .09, .5], material.dark), ...[-1, 1].map(side => box("坐席承重立板", [.24 + side * .25, .32, .12], [.035, .4, .45])),
    box("面向坐席的摄像机孔台", [-.427, 1.42, .1], [.08, .3, .28], material.dark), cylinder("侧向拍摄镜头", [-.375, 1.43, .1], [.07, .04, .07], material.glass, [0, 0, 90]),
    ...[-1, 1].map(side => box("两侧内置柔光条", [-.417, 1.43 + side * .3, .1], [.025, .12, .36], material.ivory)), box("柜外取照片出口上沿", [-.57, .88, -.615], [.17, .035, .035], material.dark),
    rod("入口遮光帘的横向滑轨", [-.42, 2.28, -.56], [.66, 2.28, -.56], .025),
    ...Array.from({ length: 7 }, (_, i) => box("向右聚拢并留出入口的独立帘褶", [.3 + i * .055, 1.2, -.56 + i % 2 * .03], [.065, 2.08, .025], material.red)),
  ] },
  // 依据胶片扫描机的独立供收卷、压片与光学扫描位置建模，未复制品牌外壳或设备规格。
  // https://www.blackmagicdesign.com/products/cintel/techspecs
  { name: "双盘压片式胶片数字转录机", theme: "现代", build: () => [
    ...legs(1.15, .53, .58, .05), box("立式数字扫描机的底框", [0, .62, 0], [1.5, .09, .55]), box("承载供收卷轴的竖向机板", [0, 1.22, .065], [1.48, 1.12, .11], material.dark),
    ...reel([-.47, 1.28, -.02], .31), ...reel([.47, 1.28, -.02], .31), ...[-1, 1].map(side => cylinder("将卷片盘接到机板的驱动轴", [side * .47, 1.28, .015], [.055, .1, .055], material.steel, [90, 0, 0])), box("中央精密压片门", [0, 1.13, -.018], [.12, .15, .1]),
    box("压片门后置线光源", [0, 1.13, .16], [.17, .22, .1], material.ivory), ...optic([0, 1.13, -.15], .05, .15),
    ...[-1, 1].flatMap(side => [cylinder("片门两侧夹持压片轮", [side * .12, 1.13, -.022], [.06, .055, .06], material.dark, [90, 0, 0]), cylinder("供收片路线上的导向轮", [side * .27, 1.01, -.022], [.055, .05, .055], material.steel, [90, 0, 0])]),
    cord("逐段通过压片门的电影胶片", [[-.47, .99, -.05], [-.27, 1.01, -.05], [-.12, 1.13, -.05], [0, 1.13, -.05], [.12, 1.13, -.05], [.27, 1.01, -.05], [.47, .99, -.05]], .006, material.wood),
    cylinder("扫描头上方精调轮", [0, 1.4, -.025], [.07, .04, .07], material.dark, [90, 0, 0]),
  ] },
  { name: "三层水平电影胶片输片架", theme: "现代", itemType: "设施", build: () => [
    box("输片架中央厚底足", [.65, .04, 0], [.42, .08, .85], material.dark), rod("外伸的前向稳定脚", [.65, .06, 0], [-.55, .06, -.45], .07), rod("外伸的后向稳定脚", [.65, .06, 0], [-.55, .06, .45], .07),
    box("侧置贯穿三层的传动立柱", [.65, .96, 0], [.14, 1.82, .14]),
    ...[.45, 1.0, 1.55].flatMap(y => [rod("从立柱接到盘心的支承臂", [.65, y - .06, 0], [0, y - .06, 0], .07), cylinder("大直径水平输片托盘", [0, y, 0], [1.22, .025, 1.22], material.steel), loop("托盘上的连续胶片卷", [0, y + .025, 0], .46, .035, [0, 0, 0], material.dark), cylinder("可抽出的中心卷芯", [0, y + .045, 0], [.2, .065, .2], material.ivory)]),
    ...[.57, 1.12, 1.67].map(y => cylinder("立柱旁导片立轮", [.63, y, -.13], [.045, .055, .045], material.dark)),
    cord("中层托盘至外部放映机的输片段", [[0, 1.04, -.45], [.39, 1.06, -.45], [.63, 1.12, -.13], [.82, 1.0, -.3]], .006, material.wood),
  ] },
  { name: "竖式胶片检视剪辑机", theme: "现代", build: () => [
    box("带操作者脚踏的底台", [0, .06, 0], [.63, .12, .65], material.dark), box("向上连接检视头的立机柱", [0, .66, .12], [.26, 1.12, .27]),
    box("斜置脚踏速度控制器", [0, .16, -.26], [.3, .06, .21], material.dark, [-12, 0, 0]),
    box("上部投影头的后罩", [0, 1.4, .12], [.39, .43, .34], material.dark), box("向操作者倾斜的小检视屏", [0, 1.43, -.065], [.31, .25, .008], material.ivory, [-12, 0, 0]),
    box("检视屏上遮光眉", [0, 1.59, -.08], [.38, .035, .16], material.dark),
    ...[-1, 1].map(side => box("两侧卷片支臂", [side * .3, 1.04, .06], [.42, .035, .045])), ...reel([-.43, 1.05, -.01], .21), ...reel([.43, 1.05, -.01], .21), ...[-1, 1].map(side => cylinder("卷片盘与承臂之间的短轴", [side * .43, 1.05, .035], [.035, .1, .035], material.steel, [90, 0, 0])),
    box("屏下压片检视门", [0, 1.13, -.08], [.12, .1, .08]), cord("供片到检视门再到收片的胶片", [[-.31, 1.05, -.05], [-.13, 1.13, -.05], [.13, 1.13, -.05], [.31, 1.05, -.05]], .004, material.wood),
    rod("右侧手动进退片曲柄", [.18, 1.22, .04], [.28, 1.22, .04], .015), cylinder("曲柄端手握", [.28, 1.22, -.015], [.025, .1, .025], material.dark, [90, 0, 0]),
  ] },
  { name: "平床胶片剪辑工作台", theme: "现代", build: () => [
    ...legs(1.3, .75, .78, .07), box("四盘剪辑机厚台面", [0, .83, 0], [1.65, .1, 1.02], material.ivory),
    ...[-1, 1].flatMap(side => [-1, 1].flatMap(end => [...reel([side * .53, .901, end * .29], .2, true), cylinder("将平放卷片盘接到台面的主轴", [side * .53, .8975, end * .29], [.035, .035, .035], material.steel)])),
    box("台后分光投影头", [0, 1.12, .32], [.43, .42, .28], material.dark), box("后置立式小银幕", [0, 1.14, .175], [.36, .29, .008], material.ivory), box("中央带有窗口的检片平台", [0, .91, -.12], [.24, .035, .22], material.dark),
    ...[-1, 1].map(side => cylinder("片门两端大驱动滚柱", [side * .18, .93, -.12], [.095, .06, .095])),
    ...[-1, 1].map(side => cord("左右平放且经过片门的胶片", [[side * .53, .925, -.1], [side * .28, .925, -.17], [side * .18, .925, -.12], [0, .925, -.12]], .004, material.wood)),
    ...bars("台前机械功能键", 7, [0, .896, -.42], .5, [.045, .025, .04], 0, material.dark), rod("台前连续调速操纵杆", [.55, .87, -.5], [.55, .98, -.58], .02),
  ] },
  { name: "吊挂曲率线阵列扩声音箱", theme: "现代", build: () => {
    const result: ModelPart[] = [box("悬挂阵列顶部吊梁", [0, 2.54, .03], [.76, .07, .45], material.dark), ...[-1, 1].map(side => loop("吊梁上真实穿索环", [side * .23, 2.62, .03], .045, .013, [90, 0, 0]))];
    for (let i = 0; i < 6; i++) {
      const y = 2.29 - i * .38, z = .015 + i * i * .009, tilt = i * 3;
      const a = tilt * Math.PI / 180;
      result.push(box("相互铰接的独立阵列箱体", [0, y, z], [.7, .34, .42], material.dark, [tilt, 0, 0]), ...[-1, 1].map(side => cylinder("阵列箱内封闭低音振膜", [side * .19, y + Math.sin(a) * .222, z - Math.cos(a) * .222], [.22, .025, .22], material.steel, [90 + tilt, 0, 0])), box("中部线声源高频喉口", [0, y + Math.sin(a) * .225, z - Math.cos(a) * .225], [.045, .24, .015], material.ivory, [tilt, 0, 0]));
      if (i < 5) for (const side of [-1, 1]) result.push(rod("相邻音箱之间的侧向吊接片", [side * .365, y - .13, z + .12], [side * .365, y - .27, z + .14], .025));
    }
    return result;
  } },
  { name: "折叠号筒加载低音音箱", theme: "现代", build: () => [
    box("低音箱厚底板", [0, .025, 0], [.76, .05, .85], material.dark), box("低音箱封闭后板", [0, .51, .4], [.76, 1.02, .05], material.dark), box("低音箱顶板", [0, .995, 0], [.76, .05, .85], material.dark),
    ...[-1, 1].map(side => box("真正围出号筒流道的侧板", [side * .355, .51, 0], [.05, .97, .85], material.dark)),
    box("从后上方向下折返的内隔板", [0, .68, .13], [.66, .04, .5], material.steel, [-18, 0, 0]), box("将后流道引回前口的低位隔板", [0, .32, -.01], [.66, .04, .57], material.steel, [16, 0, 0]),
    box("驱动单元安装承板", [0, .79, .265], [.66, .04, .23], material.dark), cylinder("装在号筒喉部的低音驱动振膜", [0, .758, .265], [.31, .04, .31], material.ivory),
    ...[-1, 1].map(side => box("前口上下保护边", [0, .51 + side * .43, -.405], [.66, .035, .035], material.steel)),
    ...[-1, 1].map(side => rod("前口横向保护立杆", [side * .18, .11, -.42], [side * .18, .91, -.42], .012)),
  ] },
  { name: "落地静电双面振膜音箱", theme: "现代", build: () => [
    box("宽扁的落地配重底座", [0, .055, 0], [.73, .11, .44], material.dark), box("后底座高压变压器盒", [0, .22, .12], [.35, .22, .24], material.dark),
    ...[-1, 1].map(side => box("高挑面板两侧竖框", [side * .31, .96, 0], [.035, 1.65, .055])), ...[-1, 1].map(side => box("上下连接面板的框梁", [0, .96 + side * .807, 0], [.65, .035, .055])),
    { ...box("夹在两面栅板间的导电振膜", [0, .96, 0], [.59, 1.58, .001], material.ivory), opacity: .42 },
    ...[-1, 1].flatMap(side => bars("振膜前后分开的静电定子横栅", 16, [0, .96, side * .012], 1.5, [.59, .007, .005], 1, material.dark)),
    ...[-1, 1].flatMap(side => bars("与横栅相连的定子纵栅", 5, [0, .96, side * .014], .52, [.006, 1.55, .005], 0, material.dark)),
    ...[-1, 1].map(side => rod("面板与底座之间的后倾斜支撑", [side * .25, .15, .18], [side * .25, .55, .015], .022)),
  ] },
  { name: "七槽二次余数声学扩散墙", theme: "现代", itemType: "设施", build: () => [
    ...[-1, 1].map(side => box("扩散墙两侧站立边框", [side * .75, 1.02, .15], [.045, 2.04, .4], material.wood)), ...[-1, 1].map(side => box("上下封闭扩散槽边框", [0, 1.02 + side * .995, .15], [1.5, .05, .4], material.wood)),
    ...Array.from({ length: 8 }, (_, i) => box("把入射声分隔为独立深槽的薄壁", [-.7 + i * .2, 1.02, .15], [.015, 1.93, .4], material.wood)),
    ...[0, 1, 4, 2, 2, 4, 1].map((depth, i) => box("按照二次余数序列变化的实体槽底", [-.6 + i * .2, 1.02, -.035 + depth * .075], [.185, 1.93, .02], material.wood)),
    ...[-1, 1].map(side => box("避免整墙前后倾倒的落地长脚", [side * .59, .035, .15], [.07, .07, .8], material.dark)),
  ] },
  { name: "四面悬吊赛场电子计分屏", theme: "现代", itemType: "设施", build: () => {
    const result: ModelPart[] = [box("悬吊屏顶部中央承重盒", [0, 2.3, 0], [.75, .2, .75], material.dark), ...[-1, 1].flatMap(x => [-1, 1].map(z => rod("屏体四角上吊杆", [x * 1.28, 1.9, z * 1.28], [x * .3, 2.4, z * .3], .055)))];
    for (let face = 0; face < 4; face++) {
      const a = face * Math.PI / 2, values = [box("完整计分屏显示面外壳", [0, .95, -1.37], [2.7, 1.9, .15], material.dark), box("屏体四周内凹显示玻璃", [0, .95, -1.455], [2.48, 1.64, .018], material.glass)];
      for (const side of [-1, 1]) {
        const x = side * .55;
        for (const y of [.56, .94, 1.32]) values.push(box("计分数字的横向发光段", [x, y, -1.471], [.45, .052, .008], material.ivory));
        for (const end of [-1, 1]) for (const y of [.75, 1.13]) values.push(box("计分数字的竖向发光段", [x + end * .23, y, -1.471], [.052, .31, .008], material.ivory));
      }
      for (const value of values) { const { x, z } = value.position; value.position.x = x * Math.cos(a) + z * Math.sin(a); value.position.z = -x * Math.sin(a) + z * Math.cos(a); value.rotation.y += face * 90; result.push(value); }
    }
    return result;
  } },
  { name: "机电翻页航班信息牌", theme: "现代", itemType: "设施", build: () => [
    ...[-1, 1].map(side => box("信息牌落地钢柱", [side * 1.08, .55, 0], [.1, 1.1, .1], material.dark)), ...[-1, 1].map(side => box("钢柱底部稳定长脚", [side * 1.08, .035, 0], [.12, .07, .75], material.dark)),
    box("背部薄机箱", [0, 1.7, .07], [2.65, 1.28, .12], material.dark), ...[-1, 1].map(side => box("显示牌竖向保护侧框", [side * 1.32, 1.7, -.01], [.065, 1.33, .12])),
    ...[-1, 1].map(side => box("显示牌横向保护边框", [0, 1.7 + side * .63, -.01], [2.65, .065, .12])),
    ...Array.from({ length: 3 }, (_, row) => Array.from({ length: 10 }, (_, col) => { const x = (col - 4.5) * .25, y = 1.7 + (1 - row) * .38; return [box("半幅向下翻落的字符上叶", [x, y + .087, -.012], [.232, .163, .014], material.ivory), box("半幅字符下叶", [x, y - .087, -.011], [.232, .163, .014], material.dark)]; }).flat()).flat(),
    ...[1.32, 1.7, 2.08].map(y => rod("整排叶片共同水平枢轴", [-1.27, y, -.027], [1.27, y, -.027], .012, material.steel)),
  ] },
  { name: "曲面LED虚拟拍摄背景墙", theme: "现代", itemType: "设施", build: () => {
    const result: ModelPart[] = [box("与背景墙连续的地面显示基台", [0, .06, 2.45], [5.6, .12, 3.5], material.dark), box("受力基台上表面显示板", [0, .126, 2.45], [5.5, .012, 3.4], material.glass)];
    for (let i = 0; i < 12; i++) {
      const a = (-66 + i * 12) * Math.PI / 180;
      result.push(box("沿弧线拼接的独立LED箱体", [Math.sin(a) * 4, 1.95, Math.cos(a) * 4], [.84, 3.65, .1], material.dark, [0, a * 180 / Math.PI, 0]), box("面向拍摄中心的显示发光面", [Math.sin(a) * 3.94, 1.95, Math.cos(a) * 3.94], [.81, 3.6, .012], material.glass, [0, a * 180 / Math.PI, 0]));
      if (i % 2 === 0) result.push(rod("箱体背面竖向桁架", [Math.sin(a) * 4.1, .1, Math.cos(a) * 4.1], [Math.sin(a) * 4.1, 3.9, Math.cos(a) * 4.1], .07), rod("背面向地脚展开的斜支撑", [Math.sin(a) * 4.1, 2.6, Math.cos(a) * 4.1], [Math.sin(a) * 4.8, .08, Math.cos(a) * 4.8], .06), rod("连接立柱与外地脚的贴底纵梁", [Math.sin(a) * 4.1, .06, Math.cos(a) * 4.1], [Math.sin(a) * 4.8, .06, Math.cos(a) * 4.8], .09), box("斜撑末端实际触地的脚板", [Math.sin(a) * 4.8, .04, Math.cos(a) * 4.8], [.25, .08, .3], material.dark, [0, a * 180 / Math.PI, 0]));
    }
    return result;
  } },
  { name: "剪式升架移动投影幕", theme: "现代", itemType: "器物", build: () => [
    box("内藏幕布卷轴的落地长箱", [0, .13, 0], [2.45, .2, .3], material.dark), ...[-1, 1].map(side => box("可以转出的幕箱稳定横脚", [side * .9, .04, 0], [.1, .08, .9], material.dark)),
    box("上升后的幕布顶横梁", [0, 2.08, 0], [2.4, .05, .08], material.dark), box("真正展开的连续白色投影幕", [0, 1.15, -.012], [2.3, 1.83, .003], material.ivory),
    ...[-1, 1].flatMap(side => [rod("后部交叉升架的下左至上右杆", [side * .92, .23, .08], [side * .92, 1.15, .38], .025), rod("后部交叉升架的下右至上左杆", [side * .92, .23, .38], [side * .92, 1.15, .08], .025), rod("后部上层剪叉的向前杆", [side * .92, 1.15, .38], [side * .92, 2.05, .08], .025), rod("后部上层剪叉的向后杆", [side * .92, 1.15, .08], [side * .92, 2.05, .38], .025), rod("顶梁回接最后剪叉的短臂", [side * .92, 2.05, .38], [side * .92, 2.08, 0], .025)]),
  ] },
  { name: "反射折光背投显示柜", theme: "现代", itemType: "设施", build: () => [
    ...cabinetShell(1.45, 1.68, .8), box("屏前下沿遮光盖", [0, .33, -.39], [1.45, .6, .035], material.dark),
    ...[-1, 1].map(side => box("屏幕的左右遮光边", [side * .695, 1.09, -.4], [.06, .94, .055], material.dark)), box("透射成像的前幕片", [0, 1.09, -.408], [1.33, .87, .006], material.ivory),
    box("柜内从低位向屏幕折转的倾斜反射镜", [0, .68, .15], [1.2, .67, .018], material.glass, [-37, 0, 0]),
    box("底部封闭光学引擎", [0, .2, -.03], [.42, .22, .3], material.dark), cylinder("光引擎向后投射的镜筒", [0, .3, .17], [.12, .17, .12], material.dark, [90, 0, 0]),
    ...bars("下方独立散热百叶", 8, [0, .18, -.414], .4, [.035, .18, .012], 0, material.steel),
  ] },
  { name: "线式雾幕投影喷流设备", theme: "现代", itemType: "设施", build: () => [
    ...[-1, 1].flatMap(side => [box("落地压舱底座", [side * 1.55, .09, .01], [.45, .18, .85], material.dark), box("内含供水管的侧支柱", [side * 1.55, 1.47, .04], [.22, 2.6, .26])]),
    box("横跨入口的长条送风机壳", [0, 2.83, .04], [3.4, .35, .65], material.ivory),
    ...[-1, 1].map(side => box("雾幕两侧的平行气流喷缝上唇", [0, 2.641, side * .2], [2.95, .018, .1], material.dark)),
    ...bars("中央雾化喷口间的独立隔栅", 24, [0, 2.64, .02], 2.8, [.02, .02, .07], 0, material.steel),
    box("一侧底部密封供水箱", [1.55, .36, .08], [.36, .36, .45], material.dark), cylinder("供水箱上方加水口", [1.55, .56, .18], [.1, .04, .1]),
    cord("水箱至上喷头的侧向水管", [[1.55, .42, .3], [1.55, 1.45, .3], [1.55, 2.7, .3], [1.4, 2.8, .12]], .018),
  ] },
  { name: "落地盲文凸点压印机", theme: "现代", itemType: "设施", build: () => [
    ...cabinetShell(.75, .94, .65), box("前方可打开的工作门", [0, .4, -.32], [.68, .72, .025], material.dark), box("凸点压印横梁", [0, 1.09, 0], [.73, .2, .38], material.ivory),
    ...[-1, 1].map(side => box("压印头两侧支架", [side * .325, .94, 0], [.07, .2, .38])), rod("压印模头横向导轨", [-.3, 1.04, -.08], [.3, 1.04, -.08], .018),
    ...bars("真实并排的电磁压针驱动头", 12, [0, 1.06, -.09], .52, [.027, .09, .04], 0, material.dark), cylinder("下方反压胶辊", [0, .97, -.09], [.07, .59, .07], material.steel, [0, 0, 90]),
    box("从后上方送入的纸张导板", [0, 1.22, .24], [.58, .014, .42], material.ivory, [-40, 0, 0]), box("向前接出的纸托", [0, .94, -.47], [.58, .014, .36]),
    box("已压印的连续纸张", [0, .952, -.35], [.46, .002, .4], material.ivory),
    ...Array.from({ length: 5 }, (_, cell) => Array.from({ length: 6 }, (_, dot) => ball("实际凸起的六点盲文触点", [(cell - 2) * .052 + (dot % 2 - .5) * .014, .9545, -.35 + (Math.floor(dot / 2) - 1) * .025], [.007, .006, .007], material.ivory))).flat(),
  ] },
  { name: "拖孔纸高速行式打印机", theme: "现代", itemType: "设施", build: () => [
    ...cabinetShell(1.08, .94, .75), box("打印机上方真正开放的纸路槽底", [0, .955, -.04], [.92, .035, .56], material.dark),
    ...[-1, 1].map(side => box("纸路两侧驱动仓", [side * .485, 1.08, -.01], [.11, .22, .63], material.ivory)),
    rod("摆锤行打印头的横导杆", [-.42, 1.17, -.12], [.42, 1.17, -.12], .022), ...bars("与纸宽对应的往复锤组", 14, [0, 1.13, -.14], .78, [.034, .075, .028], 0, material.steel),
    cylinder("跨过全纸宽的压纸胶辊", [0, 1.04, .02], [.07, .88, .07], material.dark, [0, 0, 90]),
    ...[-1, 1].flatMap(side => [cylinder("驱动边孔纸的拖纸轮", [side * .405, 1.048, .12], [.08, .035, .08], material.dark, [0, 0, 90]), ...Array.from({ length: 4 }, (_, i) => { const a = i * Math.PI / 2; return rod("从轮缘穿入实际纸孔的拖纸销", [side * .405, 1.048 + Math.cos(a) * .038, .12 + Math.sin(a) * .038], [side * .405, 1.048 + Math.cos(a) * .052, .12 + Math.sin(a) * .052], .005, material.steel); })]),
    piercedPanel("两侧具有实际拖孔的连续纸", [0, 1.09, .055], [[-.42, -.155], [.42, -.155], [.42, .155], [-.42, .155]], [-1, 1].flatMap(side => Array.from({ length: 10 }, (_, i) => { const x = side * .405, z = -.145 + i * .03; return [[x - .0045, z - .006], [x - .0045, z + .006], [x + .0045, z + .006], [x + .0045, z - .006]] as [number, number][]; })), .002, material.ivory),
    ...Array.from({ length: 5 }, (_, i) => box("前下方叠放的折页纸", [0, .17 + i * .018, -.47 - i % 2 * .015], [.84, .009, .37], material.ivory)),
    ...[-1, 1].map(side => rod("前方接纸架外伸支杆", [side * .38, .15, -.3], [side * .38, .15, -.64], .018)),
  ] },
  { name: "V形书托双页书刊扫描台", theme: "现代", itemType: "设施", build: () => [
    ...legs(.94, .7, .75, .06), box("扫描书台支承底框", [0, .78, 0], [1.1, .08, .85], material.dark),
    ...[-1, 1].map(side => box("沿书脊下沉的两页V形承托板", [side * .23, .94, 0], [.49, .025, .58], material.ivory, [0, 0, side * 25])),
    ...[-1, 1].map(side => box("与V形书托贴合的真实书页叠", [side * (.23 - Math.sin(25 * Math.PI / 180) * .025), .94 + Math.cos(25 * Math.PI / 180) * .025, 0], [.46, .025, .54], material.ivory, [0, 0, side * 25])),
    ...[-1, 1].map(side => ({ ...box("真正压在书页表面的玻璃", [side * (.23 - Math.sin(25 * Math.PI / 180) * .0405), .94 + Math.cos(25 * Math.PI / 180) * .0405, 0], [.455, .006, .54], material.glass, [0, 0, side * 25]), opacity: .28 })),
    box("沿两页之间连接的书脊", [0, .851, 0], [.02, .035, .54], material.wood),
    ...[-1, 1].map(side => rod("书托下方倾斜承力杆", [side * .45, .79, .2], [side * .23, .9, .2], .025)),
    ...[-1, 1].map(side => rod("后方双相机龙门立柱", [side * .5, .79, .35], [side * .5, 2.04, .35], .045)), rod("龙门架上方横梁", [-.5, 2.04, .35], [.5, 2.04, .35], .055),
    ...[-1, 1].flatMap(side => [rod("从横梁伸到书面上方的摄像悬臂", [side * .27, 2.04, .35], [side * .27, 2.04, 0], .03), box("独立左右页拍摄相机", [side * .27, 1.98, 0], [.13, .08, .13], material.dark), cylinder("朝向书页的镜筒", [side * .27, 1.91, 0], [.08, .08, .08], material.dark), cylinder("镜筒内光学玻璃", [side * .27, 1.868, 0], [.062, .005, .062], material.glass)]),
    ...[-1, 1].map(side => box("与拍摄镜头分开的侧向柔光板", [side * .48, 1.6, .04], [.03, .35, .42], material.ivory, [0, 0, side * 20])),
  ] },
  { name: "外鼓式印版激光制版机", theme: "现代", itemType: "设施", build: () => [
    ...cabinetShell(1.6, .55, 1.0), ...[-1, 1].map(side => box("承载外鼓两端轴承的立颊", [side * .65, .875, .04], [.16, .65, .72], material.ivory)),
    cylinder("印版吸附的水平回转外鼓", [0, .94, .02], [.72, 1.18, .72], material.dark, [0, 0, 90]), rod("外鼓上固定印版前缘的长夹条", [-.56, 1.29, .02], [.56, 1.29, .02], .025),
    rod("沿外鼓轴向行进的激光头导轨", [-.62, 1.02, -.44], [.62, 1.02, -.44], .035), box("在导轨上滑动的曝光头", [.16, 1.04, -.44], [.18, .17, .15], material.steel), cylinder("曝光头朝向外鼓的短镜头", [.16, 1.04, -.335], [.06, .08, .06], material.dark, [90, 0, 0]),
    box("前端宽幅进版托台", [0, .73, -.83], [1.24, .025, .7], material.ivory, [-9, 0, 0]), ...[-1, 1].map(side => rod("进版托台前下支撑", [side * .5, .25, -.45], [side * .5, .66, -1.1], .035)),
    ...[-1, 1].map(side => rod("将防护盖后铰轴接回机颊的支耳", [side * .65, 1.15, .48], [side * .65, 1.35, .48], .03)),
    box("绕后侧铰轴向上掀起的光学防护罩", [0, 1.7186, .2219], [1.6, .025, .9], material.dark, [55, 0, 0]),
  ] },
  { name: "键盘纸页电传打字机", theme: "现代", build: () => [
    ...cabinetShell(.76, .65, .65), box("电传机电驱动主壳", [0, .8, .04], [.72, .3, .52], material.ivory),
    box("前置倾斜字符键盘底", [0, .76, -.33], [.68, .07, .28], material.dark, [-9, 0, 0]),
    ...Array.from({ length: 4 }, (_, row) => bars("机电编码字符键", 9, [0, .79 + row * .008, -.42 + row * .053], .58, [.047, .018, .037], 0, material.ivory)).flat(),
    cylinder("纸页印字横向胶辊", [0, 1.01, .12], [.09, .6, .09], material.dark, [0, 0, 90]), box("离开打印行的连续电传纸页", [0, 1.2, .155], [.5, .35, .003], material.ivory, [9, 0, 0]),
    rod("打印小车横向移动导杆", [-.29, 1.01, .035], [.29, 1.01, .035], .018), box("接收电报码后选字的机电打印头", [.06, 1.04, .035], [.09, .08, .08], material.steel),
    ...[-1, 1].map(side => cylinder("纸辊端部手动进纸钮", [side * .34, 1.01, .12], [.065, .035, .065], material.dark, [0, 0, 90])),
    box("接入线路的侧面接线盒", [.39, .53, .13], [.07, .16, .2], material.dark),
  ] },
  { name: "落地电视导播切换控制台", theme: "现代", itemType: "设施", build: () => [
    ...[-1, 1].map(side => box("承受整面切换键盘的侧机腿", [side * .77, .38, 0], [.13, .76, .76], material.dark)), box("后方连接两腿的承重机背", [0, .48, .33], [1.5, .38, .08], material.dark),
    plate("向操作者下倾的控制台机壳", [0, .76, 0], [[-.4, 0], [.4, 0], [.4, .17], [-.4, .04]], 1.7, material.steel, [0, 90, 0]),
    ...Array.from({ length: 3 }, (_, row) => bars("多排独立总线切换大按键", 12, [-.18, .9 - row * .014, -.16 + row * .085], 1.13, [.07, .027, .048], 0, row === 2 ? material.red : material.ivory)).flat(),
    rod("图像渐变T杆的下方转轴", [.51, .86, -.07], [.71, .86, -.07], .028, material.dark), rod("图像渐变T杆左支臂", [.55, .86, -.07], [.55, 1.05, -.15], .025), rod("图像渐变T杆右支臂", [.67, .86, -.07], [.67, 1.05, -.15], .025),
    rod("可双手推动的T杆横握把", [.52, 1.05, -.15], [.7, 1.05, -.15], .045, material.dark),
    ...bars("上方独立旋钮编码器", 6, [-.3, .853, .18], .9, [.045, .035, .045], 0, material.dark),
    box("顶部状态返回小屏", [.51, .834, .23], [.3, .012, .13], material.glass, [9.23, 0, 0]),
  ] },
  // 两个恒星球与独立行星支架对应传统哑铃形光机布局，保留原创外形与普通教学尺寸。
  // https://www.zeiss.com/planetariums/us/about-us/planetarium-models.html
  { name: "双恒星球天幕光学投影仪", theme: "现代", itemType: "设施", build: () => {
    const result: ModelPart[] = [cylinder("落地配重圆盘", [0, .07, 0], [1.0, .14, 1.0], material.dark), cylinder("回转赤道仪支柱", [0, .66, 0], [.24, 1.1, .24]), ...[-1, 1].map(side => rod("托起双球主轴的倾斜叉臂", [0, 1.16, 0], [0, 1.7, side * .38], .09)), rod("横向穿过双叉的俯仰轴", [0, 1.7, -.42], [0, 1.7, .42], .11), rod("连接南北恒星球的主干", [-.9, 2.1, 0], [.9, 2.1, 0], .13), rod("主干下方与俯仰轴的接杆", [0, 1.7, 0], [0, 2.1, 0], .1)];
    for (const side of [-1, 1]) {
      result.push(ball("真正独立的恒星投影球体", [side * .92, 2.1, 0], [.65, .65, .65], material.dark));
      for (let i = 0; i < 8; i++) {
        const a = i * Math.PI / 4, dx = Math.cos(a) * .22, dy = Math.sin(a) * .22, z = i % 2 ? .2 : -.2;
        result.push(rod("球面向外独立的星场投影镜筒", [side * .92 + dx * .85, 2.1 + dy * .85, z * .85], [side * .92 + dx * 1.4, 2.1 + dy * 1.4, z * 1.4], .055), ball("镜筒前端的独立光学玻璃", [side * .92 + dx * 1.4, 2.1 + dy * 1.4, z * 1.4], [.045, .045, .045], material.glass));
      }
      result.push(loop("围绕主轴的行星投影支架环", [side * .35, 2.1, 0], .29, .017, [0, 0, 90]));
      for (let i = 0; i < 3; i++) { const a = i * Math.PI * 2 / 3; result.push(rod("支架环上的行星投影模块", [side * .35, 2.1 + Math.cos(a) * .25, Math.sin(a) * .25], [side * .35, 2.1 + Math.cos(a) * .37, Math.sin(a) * .37], .055)); }
    }
    return result;
  } },
  { name: "自动装盘光盘复制机器人柜", theme: "现代", itemType: "设施", build: () => [
    ...cabinetShell(.86, 1.62, .7), box("底部封闭控制与驱动电源舱", [0, .24, 0], [.8, .4, .63], material.dark),
    ...[-1, 1].flatMap(side => [cylinder("输入与输出的独立光盘料柱", [side * .23, .79, -.03], [.23, .46, .23], material.steel), rod("穿过光盘中心的料柱导芯", [side * .23, .54, -.03], [side * .23, 1.08, -.03], .016, material.dark), loop("料柱顶部真正中孔的光盘", [side * .23, 1.023, -.03], .112, .09, [0, 0, 0], material.ivory)]),
    rod("装盘头的左右横移导轨", [-.35, 1.44, -.08], [.35, 1.44, -.08], .025), box("横移机械小车", [0, 1.44, -.08], [.16, .07, .13], material.dark),
    rod("吸盘头独立升降导柱", [0, 1.02, -.08], [0, 1.46, -.08], .022),
    part("末端贯通的真空吸盘", "lathe", material.dark, [0, 1.0, -.08], [1, 1, 1], [0, 0, 0], { profile: [{ x: .003, y: .025 }, { x: .0015, y: .025 }, { x: .03, y: 0 }, { x: .035, y: 0 }, { x: .003, y: .025 }] }),
    box("后方双光驱的安装仓", [0, .93, .23], [.5, .29, .2], material.dark), ...[-1, 1].map(side => box("伸出的光盘刻录承托盘", [0, .93 + side * .075, .025], [.24, .015, .3], material.steel)),
    { ...box("从外部看得到装盘机构的前防护门", [0, .99, -.36], [.8, 1.16, .008], material.glass), opacity: .22 }, box("右侧防护门把手", [.32, .98, -.376], [.024, .25, .025], material.dark),
  ] },
];
