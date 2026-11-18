import { part, ring, type ModelPart, type Triple } from "../assetModelParts";
import { box, cylinder, cup, loop, rod, ball, bars, cord, plate, piercedPanel, legs, material, type MasterPrototype } from "./parts";

export function openTray(name: string, position: Triple, width: number, depth: number, height: number, color = material.steel): ModelPart[] {
  const [x, y, z] = position;
  return [box(`${name}底板`, [x, y + .006, z], [width, .012, depth], color), ...[-1, 1].flatMap(side => [box(`${name}长侧壁`, [x, y + height / 2, z + side * (depth - .012) / 2], [width, height, .012], color), box(`${name}短侧壁`, [x + side * (width - .012) / 2, y + height / 2, z], [.012, height, depth - .024], color)])];
}

export function openNeck(name: string, position: Triple, radius: number, height: number, wall = .006, color = material.steel, rotation: Triple = [0, 0, 0]): ModelPart {
  return part(name, "lathe", color, position, [1, 1, 1], rotation, { profile: [{ x: radius, y: 0 }, { x: radius, y: height }, { x: radius - wall, y: height }, { x: radius - wall, y: 0 }, { x: radius, y: 0 }] });
}

// 只借鉴公开设备类别的机构关系，自制简化造型，不包含品牌、下载网格或制造规格。
// https://www.clevelandrange.com/steam-jacketed-kettles/
// https://www.robot-coupe.com/robot-coupe-global/
// https://www.belshaw.com/products/type-k-donut-depositor
export const culinaryExpansionBatchOneObjects: MasterPrototype[] = [
  { name: "可倾夹层蒸汽汤锅", theme: "现代", itemType: "设施", build: () => [
    ...legs(.82, .6, .48, .065), ...[-1, 1].map(side => box("倾轴立座", [side * .41, .61, 0], [.1, .44, .22])),
    part("内外双层加热锅腔", "lathe", material.steel, [0, .47, 0], [1, 1, 1], [0, 0, 0], { profile: [{ x: 0, y: 0 }, { x: .13, y: 0 }, { x: .27, y: .09 }, { x: .34, y: .23 }, { x: .35, y: .52 }, { x: .32, y: .52 }, { x: .31, y: .24 }, { x: .25, y: .13 }, { x: .12, y: .05 }, { x: 0, y: .05 }] }),
    ...[-1, 1].map(side => rod("锅壁横向倾转耳轴", [side * .32, .76, 0], [side * .46, .76, 0], .07)),
    box("蜗轮倾转箱", [.51, .76, 0], [.12, .18, .18], material.dark), loop("侧面倾转手轮", [.61, .76, 0], .16, .018, [0, 0, 90]),
    ...[0, 120, 240].map(angle => { const a = angle * Math.PI / 180; return rod("手轮径向辐条", [.61, .76, 0], [.61, .76 + Math.cos(a) * .145, Math.sin(a) * .145], .014); }),
    rod("夹层蒸汽输入管", [-.46, .58, .15], [-.33, .61, .15], .035), rod("夹层底部冷凝排出口", [0, .48, .12], [0, .34, .12], .03), cylinder("排凝阀横柄", [0, .36, .12], [.1, .018, .018], material.red, [0, 0, 90]),
    box("锅后控制柱", [-.43, .94, .2], [.13, .22, .12], material.dark), cylinder("夹层压力表", [-.43, 1.065, .13], [.075, .025, .075], material.ivory, [90, 0, 0]),
    ...openTray("前接料托沿", [0, .945, -.345], .2, .13, .045),
  ] },
  { name: "浸篮电热油炸炉", theme: "现代", itemType: "设施", build: () => {
    const parts: ModelPart[] = [...legs(.38, .46, .12, .035), ...openTray("开放深油槽", [0, .12, 0], .44, .52, .32), box("后置温控电器头", [0, .45, .25], [.44, .18, .11], material.dark), cylinder("温控旋钮", [-.1, .46, .185], [.055, .025, .055], material.ivory, [90, 0, 0]), cord("浸入槽内的蛇形加热管", [[-.13, .49, .2], [-.13, .18, .17], [-.13, .18, -.17], [0, .18, -.17], [0, .18, .16], [.13, .18, .16], [.13, .18, -.17]], .009), ...[-1, 1].map(side => box("槽口篮托边", [side * .19, .44, -.02], [.025, .015, .43]))];
    for (const side of [-1, 1]) parts.push(rod("篮口纵向边框", [side * .15, .39, -.2], [side * .15, .39, .16], .008), rod("篮底纵向边框", [side * .13, .22, -.18], [side * .13, .22, .14], .006), rod("篮口横向边框", [-.15, .39, -.02 + side * .18], [.15, .39, -.02 + side * .18], .008));
    for (let i = 0; i < 9; i++) { const x = (i - 4) * .032; parts.push(rod("穿孔篮底网丝", [x, .22, -.18], [x, .22, .14], .003), rod("篮前通透网丝", [x, .22, -.18], [x * 1.15, .39, -.2], .003), rod("篮后通透网丝", [x, .22, .14], [x * 1.15, .39, .16], .003)); }
    parts.push(...[-1, 1].flatMap(side => [rod("侧篮斜丝", [side * .13, .22, -.18], [side * .15, .39, .16], .004), rod("侧篮反斜丝", [side * .13, .22, .14], [side * .15, .39, -.2], .004)]), cord("篮外长握柄支架", [[-.055, .39, -.2], [-.055, .46, -.36], [.055, .46, -.36], [.055, .39, -.2]], .008), box("防烫横握柄", [0, .46, -.36], [.15, .032, .045], material.dark), openNeck("前部贯通放油嘴", [0, .16, -.26], .018, .07, .004, material.steel, [90, 0, 0]));
    return parts;
  } },
  { name: "立轴弯刀斩拌盆机", theme: "现代", itemType: "设施", build: () => [
    cylinder("低位驱动电机基座", [0, .16, 0], [.48, .32, .48], material.dark), cup("上方宽口斩拌盆", [0, .32, 0], .29, .22), cylinder("中心驱动刀轴", [0, .47, 0], [.035, .28, .035]),
    ...[-1, 1].map(side => plate("双向弯曲切料刀", [0, .355 + (side + 1) * .018, 0], [[0, -.018], [side * .17, -.09], [side * .245, -.06], [side * .235, -.035], [side * .14, -.025], [0, .018]], .004, material.steel)),
    rod("上盖后方铰轴", [-.16, .56, .245], [.16, .56, .245], .022), box("上盖开合连接臂", [0, .67, .24], [.045, .24, .03], material.dark),
    piercedPanel("打开的带投料孔透明盖", [0, .61, .245], [[-.29, 0], [.29, 0], [.29, .42], [0, .57], [-.29, .42]], [[[-.05, .14], [-.05, .24], [.05, .24], [.05, .14]]], .012, material.glass, [-90, 0, 0]),
    ...[-1, 1].map(side => rod("盆外握耳", [side * .26, .48, 0], [side * .36, .48, 0], .025, material.dark)), box("电机前操作键面", [0, .19, -.245], [.18, .08, .02], material.steel), cylinder("启停按钮", [-.045, .19, -.26], [.028, .014, .028], material.red, [90, 0, 0]),
  ] },
  { name: "卧筒真空肉料滚揉机", theme: "现代", itemType: "设施", build: () => [
    ...legs(.84, .82, .32, .065), ...[-1, 1].map(side => box("滚筒托轮横梁", [0, .34, side * .35], [.95, .08, .1])),
    part("前开口水平滚揉筒", "lathe", material.steel, [0, .85, 0], [1, 1, 1], [90, 0, 0], { profile: [{ x: 0, y: -.54 }, { x: .35, y: -.54 }, { x: .43, y: -.4 }, { x: .43, y: .35 }, { x: .29, y: .53 }, { x: .29, y: .58 }, { x: .265, y: .58 }, { x: .265, y: .52 }, { x: .405, y: .34 }, { x: .405, y: -.39 }, { x: .335, y: -.515 }, { x: 0, y: -.515 }] }),
    ...[-1, 1].map(side => ring("筒身外侧滚动轨圈", material.dark, .455, .025, 0, .045, { position: { x: 0, y: .85, z: side * .32 }, rotation: { x: 90, y: 0, z: 0 } })),
    ...[-1, 1].flatMap(side => [-1, 1].map(end => cylinder("成对承筒托轮", [side * .28, .465, end * .32], [.17, .08, .17], material.dark, [90, 0, 0]))),
    ...[0, 120, 240].map(angle => { const a = angle * Math.PI / 180; return box("筒内提升拌料板", [Math.cos(a) * .345, .85 + Math.sin(a) * .345, 0], [.1, .025, .7], material.steel, [0, 0, angle + 90]); }),
    cylinder("取下后挂在侧面的密封盖", [.58, .85, -.34], [.56, .035, .56], material.steel, [90, 0, 0]), rod("封盖挂接铰臂", [.27, .85, -.52], [.58, .85, -.34], .025), box("滚动减速电机", [.48, .43, .25], [.22, .24, .32], material.dark),
    cord("轴端真空抽气软管", [[0, .85, .55], [0, .85, .75], [.5, .7, .75], [.5, .4, .55]], .018, material.dark), cylinder("底架真空泵", [.5, .32, .5], [.18, .3, .18], material.dark, [90, 0, 0]),
  ] },
  { name: "立签辐射烤肉炉", theme: "现代", itemType: "设施", build: () => [
    ...openTray("滴油承接盘", [0, .06, 0], .55, .52, .065), ...legs(.44, .4, .06, .035), box("后立式隔热炉壁", [0, .72, .2], [.49, 1.15, .09], material.dark),
    ...[0, 1, 2].map(i => box("独立陶瓷辐射火排", [0, .39 + i * .29, .14], [.37, .24, .025], material.red)), ...[-1, 1].map(side => box("左右反射翼", [side * .245, .73, .08], [.025, 1.14, .22], material.steel, [0, side * 18, 0])),
    rod("中央可卸竖签", [0, .13, -.08], [0, 1.25, -.08], .016), cylinder("底部旋肉托盘", [0, .15, -.08], [.29, .018, .29]),
    box("上方回转电机架", [0, 1.29, .055], [.22, .075, .35]), cylinder("竖签上驱动电机", [0, 1.37, -.08], [.11, .13, .11], material.dark),
    ...[-1, 1].map(side => rod("长签定位叉", [0, .22, -.08], [side * .08, .29, -.08], .008)), ...[0, 1, 2].map(i => cylinder("侧面火排阀钮", [.285, .39 + i * .29, .16], [.05, .035, .05], material.dark, [0, 0, 90])),
    openNeck("接油盘排放口", [.2, .085, -.26], .012, .06, .003, material.steel, [90, 0, 0]),
  ] },
  { name: "多屉滑盘肠粉蒸炉", theme: "中式", itemType: "设施", build: () => {
    const parts: ModelPart[] = [...legs(.52, .57, .18, .045), ...openTray("底部沸水蒸汽槽", [0, .18, 0], .6, .65, .16), box("蒸室背壁", [0, .65, .32], [.6, .62, .025]), ...[-1, 1].map(side => box("蒸室侧壁", [side * .29, .65, 0], [.025, .62, .64])), box("蒸室顶板", [0, .975, 0], [.6, .025, .65])];
    for (let i = 0; i < 4; i++) {
      const y = .4 + i * .14, z = i === 2 ? -.22 : 0;
      parts.push(...[-1, 1].map(side => box("滑盘侧导轨", [side * .257, y, 0], [.025, .012, .59])), ...openTray("可抽蒸粉浅盘", [0, y + .012, z], .49, .6, .025), rod("抽盘前方握柄", [-.08, y + .055, z - .34], [.08, y + .055, z - .34], .02, material.dark), ...[-1, 1].map(side => rod("浅盘握柄支脚", [side * .08, y + .03, z - .29], [side * .08, y + .055, z - .34], .012)));
    }
    parts.push(openNeck("炉顶排汽短管", [.21, .987, .18], .035, .13, .006), openNeck("水槽补水口", [-.3, .27, .15], .02, .07, .004, material.steel, [0, 0, 90]), cylinder("前方加热控制钮", [.16, .25, -.34], [.06, .025, .06], material.dark, [90, 0, 0]));
    return parts;
  } },
  { name: "旋碗螺旋和面机", theme: "现代", itemType: "设施", build: () => [
    box("下部旋碗驱动底台", [0, .1, 0], [.64, .2, .84], material.ivory), box("后方皮带传动立柱", [0, .53, .28], [.28, .78, .25], material.dark), cup("偏前旋转面缸", [0, .2, -.13], .29, .39),
    box("向缸口伸出的螺旋轴机头", [0, .96, .08], [.32, .2, .56], material.ivory), cylinder("偏置螺旋轴", [.09, .75, -.16], [.045, .32, .045]),
    cord("向缸底弯曲的螺旋揉面钩", Array.from({ length: 19 }, (_, i): Triple => { const a = i * Math.PI / 6; return [.09 + Math.cos(a) * .075, .63 - i * .018, -.16 + Math.sin(a) * .075]; }), .017),
    rod("缸内固定挡面杆", [-.095, .37, -.1], [-.095, .78, -.1], .027), rod("挡面杆上方连接", [-.095, .78, -.1], [-.095, .86, .05], .027),
    ...Array.from({ length: 7 }, (_, i) => { const x = (i - 3) * .07, d = Math.sqrt(.27 ** 2 - x ** 2); return rod("缸口可见护罩钢条", [x, .65, -.13 - d], [x, .65, -.13 + d], .006); }),
    loop("圆弧护罩外框", [0, .65, -.13], .28, .008), cylinder("前方启停按钮", [-.13, .91, -.21], [.035, .02, .035], material.red, [90, 0, 0]),
  ] },
  { name: "锥台环槽面团滚圆机", theme: "现代", itemType: "设施", build: () => {
    const profile = [{ x: .38, y: 0 }, { x: .17, y: .68 }, { x: .12, y: .68 }, { x: .32, y: 0 }, { x: .38, y: 0 }];
    const vertices: { x: number; y: number; z: number }[] = [], indices: number[] = [];
    for (let i = 0; i <= 30; i++) {
      const y = i * .02, a = i * Math.PI / 5, inner = .36 - y * .29, outer = .45 - y * .29;
      for (const [r, h] of [[inner, 0], [outer, 0], [outer, .09], [outer - .012, .09], [outer - .012, .012], [inner, .012]]) vertices.push({ x: Math.cos(a) * r!, y: .355 + y + h!, z: Math.sin(a) * r! });
      if (i) for (let j = 0; j < 6; j++) { const a = (i - 1) * 6 + j, b = i * 6 + j, c = (i - 1) * 6 + (j + 1) % 6, d = i * 6 + (j + 1) % 6; indices.push(a, c, b, c, d, b); }
    }
    for (const [a, b, c] of [[0, 1, 4], [0, 4, 5], [1, 2, 3], [1, 3, 4]]) indices.push(c!, b!, a!, 180 + a!, 180 + b!, 180 + c!);
    return [box("滚圆机驱动底座", [0, .16, 0], [.84, .32, .84], material.ivory), part("中空回转锥台", "lathe", material.steel, [0, .33, 0], [1, 1, 1], [0, 0, 0], { profile }),
      part("有连续底板与外壁的上升滚圆槽", "mesh", material.steel, [0, 0, 0], [1, 1, 1], [0, 0, 0], { vertices, indices }),
      ...[0, 120, 240].map(angle => { const a = angle * Math.PI / 180; return rod("固定螺旋槽外立支杆", [Math.cos(a) * .43, .32, Math.sin(a) * .43], [Math.cos(a) * .43, .96, Math.sin(a) * .43], .025); }),
      ...openTray("高位出料接槽", [.29, .91, 0], .29, .15, .04), cylinder("调速旋钮", [0, .18, -.43], [.06, .025, .06], material.dark, [90, 0, 0])];
  } },
  { name: "穿布压板豆腐箱", theme: "中式", build: () => [
    ...[-1, 1].flatMap(side => [box("木箱口长侧边框", [0, .23, side * .144], [.36, .025, .024], material.wood), box("木箱口短侧边框", [side * .174, .23, 0], [.024, .025, .3], material.wood), ...bars("长侧排乳清木条", 7, [0, .14, side * .144], .3, [.043, .18, .012], 0, material.wood), ...bars("短侧排乳清木条", 5, [side * .174, .14, 0], .24, [.012, .18, .043], 2, material.wood)]),
    ...bars("底部排乳清间隔条", 8, [0, .038, 0], .3, [.024, .025, .29], 0, material.wood),
    ...[-1, 1].flatMap(side => [box("向外垂下的滤布边", [side * .184, .2, 0], [.003, .22, .27], material.ivory, [0, 0, side * 13]), box("前后翻起的滤布边", [0, .2, side * .154], [.33, .22, .003], material.ivory, [-side * 13, 0, 0])]),
    box("箱内下压木盖", [0, .19, 0], [.32, .035, .26], material.wood), ...[-1, 1].map(side => rod("上方压梁的侧立柱", [side * .23, .015, 0], [side * .23, .52, 0], .035, material.wood)),
    box("压梁", [0, .5, 0], [.53, .055, .07], material.wood), cylinder("压盖竖向螺杆", [0, .365, 0], [.025, .36, .025]), rod("螺杆顶部加力横柄", [-.12, .56, 0], [.12, .56, 0], .02, material.wood), cylinder("木盖受压垫", [0, .22, 0], [.09, .025, .09]),
    ...openTray("底部乳清接盘", [0, 0, 0], .54, .41, .025),
  ] },
  { name: "弓架钢线奶酪切块器", theme: "现代", build: () => [
    box("奶酪切块基板", [0, .025, 0], [.36, .05, .23], material.wood), ...[-1, 1].map(side => box("底板防滑脚", [side * .13, .009, 0], [.04, .018, .17], material.dark)),
    rod("后端摆动铰轴", [-.19, .055, .09], [.19, .055, .09], .015), cord("抬起的U形切线弓架", [[-.17, .055, .09], [-.17, .26, -.12], [.17, .26, -.12], [.17, .055, .09]], .012),
    rod("弓架中间的拉紧切酪钢线", [-.17, .155, -.015], [.17, .155, -.015], .001), box("弓顶木制握柄", [0, .26, -.12], [.14, .028, .035], material.wood),
    ...[-1, 1].map(side => cylinder("钢线端部张紧螺母", [side * .18, .155, -.015], [.015, .025, .015], material.steel, [0, 0, 90])),
    ...bars("底板出线槽的分体端条", 2, [0, .055, -.02], .022, [.32, .008, .006], 2, material.dark),
  ] },
  { name: "水封沟槽泡菜坛", theme: "中式", build: () => [
    part("鼓腹收颈厚陶坛", "lathe", material.red, [0, 0, 0], [1, 1, 1], [0, 0, 0], { profile: [{ x: 0, y: 0 }, { x: .12, y: 0 }, { x: .21, y: .1 }, { x: .225, y: .26 }, { x: .19, y: .38 }, { x: .12, y: .43 }, { x: .12, y: .49 }, { x: .1, y: .49 }, { x: .1, y: .42 }, { x: .17, y: .36 }, { x: .205, y: .255 }, { x: .19, y: .11 }, { x: .11, y: .025 }, { x: 0, y: .025 }] }),
    part("颈外真实环形注水沟", "lathe", material.red, [0, .405, 0], [1, 1, 1], [0, 0, 0], { profile: [{ x: .118, y: 0 }, { x: .185, y: 0 }, { x: .185, y: .065 }, { x: .171, y: .065 }, { x: .171, y: .014 }, { x: .13, y: .014 }, { x: .13, y: .065 }, { x: .118, y: .065 }, { x: .118, y: 0 }] }),
    part("倒扣入水沟的中空钟形盖", "lathe", material.red, [0, .437, 0], [1, 1, 1], [0, 0, 0], { profile: [{ x: .154, y: 0 }, { x: .154, y: .07 }, { x: .09, y: .105 }, { x: 0, y: .105 }, { x: 0, y: .09 }, { x: .085, y: .09 }, { x: .14, y: .06 }, { x: .14, y: 0 }, { x: .154, y: 0 }] }),
    ball("泡菜坛盖抓钮", [0, .565, 0], [.06, .055, .06], material.red), ...[-1, 1].map(side => cord("肩部相连陶耳", [[side * .19, .34, -.035], [side * .26, .32, 0], [side * .19, .28, .035]], .016, material.red)),
  ] },
  { name: "网板手压奶泡壶", theme: "现代", build: () => {
    const holes = Array.from({ length: 12 }, (_, i): [number, number][] => { const a = i * Math.PI / 6, x = Math.cos(a) * .04, z = Math.sin(a) * .04; return [[x - .004, z - .004], [x - .004, z + .004], [x + .004, z + .004], [x + .004, z - .004]]; });
    return [cup("窄口玻璃奶泡壶", [0, .01, 0], .072, .18, material.glass), ring("中央贯通活塞导向孔的壶盖", material.dark, .075, .071, .197, .018), rod("穿过盖中心的上下压杆", [0, .07, 0], [0, .32, 0], .006),
      piercedPanel("有真实网孔的压泡板", [0, .074, 0], Array.from({ length: 16 }, (_, i): [number, number] => [Math.cos(i * Math.PI / 8) * .06, Math.sin(i * Math.PI / 8) * .06]), holes, .003), ball("压杆上端握钮", [0, .335, 0], [.045, .03, .045], material.dark),
      cord("玻璃壶外侧U形持柄", [[.062, .16, 0], [.125, .17, 0], [.13, .065, 0], [.058, .055, 0]], .012, material.dark), loop("下部防撞底圈", [0, .016, 0], .069, .008),
    ];
  } },
  { name: "挂袋滤乳架", theme: "现代", build: () => [
    ...[-1, 1].map(side => rod("落地展开支脚", [side * .24, 0, -.16], [side * .17, .68, 0], .022)), ...[-1, 1].map(side => rod("后方平衡斜支脚", [side * .24, 0, .16], [side * .17, .68, 0], .022)), rod("顶部滤袋挂梁", [-.17, .68, 0], [.17, .68, 0], .025),
    cord("滤袋束口挂带", [[-.05, .5, 0], [-.035, .68, 0], [.035, .68, 0], [.05, .5, 0]], .005, material.ivory),
    part("向下收尖的封闭滤乳布袋", "lathe", material.ivory, [0, .24, 0], [1, 1, 1], [0, 0, 0], { profile: [{ x: 0, y: 0 }, { x: .025, y: .015 }, { x: .095, y: .12 }, { x: .1, y: .22 }, { x: .045, y: .27 }, { x: .018, y: .275 }, { x: 0, y: .275 }] }),
    cup("架下接乳清盆", [0, .01, 0], .17, .12, material.glass), ...[-1, 1].map(side => rod("左右脚底联梁", [side * .24, .025, -.16], [side * .24, .025, .16], .018)),
  ] },
  { name: "环隙落料甜甜圈浇注器", theme: "现代", build: () => [
    part("开放倒锥形面浆料斗", "lathe", material.steel, [0, .1, 0], [1, 1, 1], [0, 0, 0], { profile: [{ x: .031, y: 0 }, { x: .115, y: .2 }, { x: .115, y: .28 }, { x: .109, y: .28 }, { x: .109, y: .2 }, { x: .025, y: 0 }, { x: .031, y: 0 }] }),
    openNeck("底部圆环出料口", [0, .065, 0], .031, .045, .006), cylinder("位于出口中央的蘑菇阀帽", [0, .058, 0], [.035, .012, .035]), rod("贯穿料斗的中央提阀杆", [0, .065, 0], [0, .47, 0], .007),
    rod("料斗口固定T形横梁", [-.16, .395, 0], [.16, .395, 0], .018), ...[-1, 1].map(side => rod("横梁接到斗沿的短柱", [side * .09, .38, 0], [side * .09, .395, 0], .015)),
    box("提阀扳柄", [0, .47, 0], [.18, .018, .035], material.dark), cord("扳柄复位弹簧", Array.from({ length: 17 }, (_, i): Triple => [Math.cos(i * Math.PI / 2) * .013, .4 + i * .0035, Math.sin(i * Math.PI / 2) * .013]), .0015),
    ...[-1, 1].map(side => rod("放置用的细支脚", [side * .11, 0, -.06], [side * .11, .27, -.06], .012)), rod("前方第三只稳固支脚", [0, 0, .13], [0, .27, .13], .012), ring("外抱料斗并连接三脚的支承环", material.steel, .127, .028, .27, .018),
  ] },
  { name: "回转刮臂摊薄饼机", theme: "现代", itemType: "设施", build: () => [
    cylinder("圆形隔热机座", [0, .075, 0], [.56, .15, .56], material.dark), cylinder("整幅平滑热烙盘", [0, .16, 0], [.53, .025, .53], material.steel),
    box("后置刮臂驱动立柱", [0, .25, .29], [.1, .4, .1], material.ivory), rod("悬向饼心的支承横臂", [0, .44, .29], [0, .44, 0], .027), cylinder("饼心短回转轴", [0, .32, 0], [.026, .24, .026]),
    rod("径向摊浆旋转臂", [0, .2, 0], [.22, .2, 0], .013), box("贴近烙面的刮浆木刃", [.13, .18, 0], [.24, .015, .015], material.wood),
    ...[-1, 1].map(side => cylinder("隔热底脚", [side * .17, .015, 0], [.05, .03, .05], material.dark)), cylinder("热盘温控旋钮", [0, .08, -.288], [.055, .027, .055], material.ivory, [90, 0, 0]),
  ] },
  { name: "渐缩辊牛角面包卷制机", theme: "现代", itemType: "设施", build: () => [
    ...legs(.48, .85, .65, .045), ...[-1, 1].map(side => box("卷制机长边框", [side * .26, .71, 0], [.07, .14, 1.05], material.ivory)),
    ...[-1, 1].map(side => cylinder("输送带端辊", [0, .71, side * .47], [.09, .48, .09], material.dark, [0, 0, 90])), box("上层输送皮带", [0, .765, 0], [.47, .015, .94], material.dark), box("下层返程皮带", [0, .657, 0], [.47, .015, .94], material.dark),
    part("带沟隙的渐缩卷制圆锥辊", "lathe", material.steel, [0, .89, -.14], [1, 1, 1], [0, 0, 90], { profile: [{ x: 0, y: -.22 }, { x: .04, y: -.22 }, { x: .09, y: .2 }, { x: 0, y: .2 }] }),
    ...[-1, 1].map(side => box("卷辊轴承侧座", [side * .25, .86, -.14], [.05, .2, .11])), rod("卷辊穿轴", [-.29, .89, -.14], [.29, .89, -.14], .024),
    ...bars("上方柔性卷面压条", 8, [0, .81, .12], .4, [.02, .012, .35], 0, material.steel), rod("压条的后固定横杆", [-.24, .84, .3], [.24, .84, .3], .022),
    ...openTray("完成后落料斜口", [0, .6, .58], .49, .24, .04), box("侧面减速电机", [.36, .72, -.18], [.15, .22, .28], material.dark),
  ] },
  { name: "双卧轴叶片拌馅机", theme: "现代", itemType: "设施", build: () => {
    const parts: ModelPart[] = [...legs(.57, .75, .43, .05), ...openTray("开放拌馅槽", [0, .44, 0], .68, .82, .39), ...[-1, 1].map(side => cylinder("横向长拌馅轴", [side * .15, .61, 0], [.035, .92, .035], material.steel, [90, 0, 0])), box("双轴同步传动箱", [0, .63, .49], [.63, .31, .18], material.dark)];
    for (const side of [-1, 1]) for (let i = 0; i < 4; i++) { const a = (i % 2 ? 1 : -1) * side * Math.PI / 4, z = -.28 + i * .18; parts.push(rod("从拌料轴伸出的短桨臂", [side * .15, .61, z], [side * .15 + Math.cos(a) * .115, .61 + Math.sin(a) * .115, z], .018), box("交错斜置拌料桨叶", [side * .15 + Math.cos(a) * .115, .61 + Math.sin(a) * .115, z], [.1, .035, .13], material.steel, [0, side * 25, a * 180 / Math.PI])); }
    parts.push(cylinder("槽前下方卸料轴", [0, .49, -.43], [.04, .5, .04], material.dark, [0, 0, 90]), box("前卸料门板", [0, .6, -.42], [.42, .23, .015]), rod("卸料门加力柄", [.28, .49, -.43], [.28, .75, -.43], .02), box("操作键盒", [.4, .76, .32], [.12, .16, .14], material.ivory));
    return parts;
  } },
  { name: "旋架台车热风烘焙炉", theme: "现代", itemType: "设施", build: () => {
    const parts: ModelPart[] = [box("落地隔热底台", [0, .075, 0], [1.46, .15, 1.3], material.dark), box("可推车进入的炉底", [0, .16, 0], [1.32, .04, 1.2]), box("保温炉背壁", [0, 1.14, .61], [1.46, 1.98, .08]), ...[-1, 1].map(side => box("独立保温炉侧壁", [side * .69, 1.14, 0], [.08, 1.98, 1.3])), box("炉室上顶", [0, 2.17, 0], [1.46, .08, 1.3]),
      ...[-1, 1].flatMap(side => [-1, 1].map(end => rod("可卸烤盘车四角立柱", [side * .4, .3, end * .39], [side * .4, 1.94, end * .39], .022))),
      ...[-1, 1].flatMap(side => [box("台车下层纵梁", [side * .4, .3, 0], [.035, .035, .82]), box("台车顶层纵梁", [side * .4, 1.93, 0], [.035, .035, .82]), box("台车下层横梁", [0, .3, side * .39], [.82, .035, .035]), box("台车顶层横梁", [0, 1.93, side * .39], [.82, .035, .035])]),
      ...[-1, 1].flatMap(side => [-1, 1].flatMap(end => [cylinder("台车耐温脚轮", [side * .4, .24, end * .39], [.12, .035, .12], material.dark, [0, 0, 90]), rod("脚轮接到车底的固定杆", [side * .4, .24, end * .39], [side * .4, .3, end * .39], .018)])),
      cylinder("台车顶部回转连接轴", [0, 2.04, 0], [.05, .2, .05]), box("回转轴与车顶连接横梁", [0, 1.94, 0], [.82, .035, .04]), box("炉顶旋架驱动电机", [0, 2.28, 0], [.24, .18, .29], material.dark),
      cylinder("后壁循环风机圆盘", [0, 1.8, .56], [.35, .04, .35], material.dark, [90, 0, 0]), ...[0, 90, 180, 270].map(angle => box("可见循环风扇叶", [Math.cos(angle * Math.PI / 180) * .08, 1.8 + Math.sin(angle * Math.PI / 180) * .08, .53], [.14, .055, .012], material.steel, [0, 0, angle + 25])), box("侧列温控操作板", [.64, 1.5, -.67], [.13, .49, .035], material.dark), cylinder("温度调节钮", [.64, 1.4, -.7], [.055, .025, .055], material.ivory, [90, 0, 0])];
    for (let i = 0; i < 10; i++) parts.push(box("独立烘焙盘底", [0, .42 + i * .14, 0], [.75, .012, .76]), ...[-1, 1].map(side => box("盘前后挡边", [0, .435 + i * .14, side * .37], [.75, .025, .012])));
    const angle = -65 * Math.PI / 180;
    const door = [box("门框上边", [-.59, 2.04, 0], [1.18, .065, .06]), box("门框下边", [-.59, .22, 0], [1.18, .065, .06]), ...[-1, 1].map(side => box("门框立边", [-.59 + side * .56, 1.13, 0], [.065, 1.82, .06])), part("真正嵌入门框的透明观察玻璃", "box", material.glass, [-.59, 1.13, 0], [1.07, 1.75, .025], [0, 0, 0], { opacity: .35 }), rod("门侧隔热竖把", [-1.04, .95, -.07], [-1.04, 1.3, -.07], .025, material.dark)];
    for (const value of door) { const x = value.position.x, z = value.position.z; value.position.x = .59 + x * Math.cos(angle) + z * Math.sin(angle); value.position.z = -.65 - x * Math.sin(angle) + z * Math.cos(angle); value.rotation.y += -65; parts.push(value); }
    parts.push(...[.42, 1.85].map(y => cylinder("炉门侧铰链", [.59, y, -.65], [.04, .15, .04])));
    return parts;
  } },
  { name: "螺旋雪泥冷饮机", theme: "现代", itemType: "设施", build: () => [
    box("压缩机制冷底座", [0, .16, .035], [.3, .32, .39], material.dark), part("透明卧式雪泥筒", "lathe", material.glass, [0, .46, .03], [1, 1, 1], [90, 0, 0], { profile: [{ x: 0, y: -.17 }, { x: .14, y: -.17 }, { x: .14, y: .17 }, { x: .13, y: .17 }, { x: .13, y: -.16 }, { x: 0, y: -.16 }] }),
    cylinder("位于杯内的独立蒸发冷筒", [0, .46, .035], [.13, .31, .13], material.steel, [90, 0, 0]),
    cord("绕过冷筒的螺旋刮冰输送杆", Array.from({ length: 33 }, (_, i): Triple => { const a = i * Math.PI / 4; return [Math.cos(a) * .108, .46 + Math.sin(a) * .108, -.12 + i * .009]; }), .008, material.ivory),
    cylinder("透明筒后驱动头", [0, .46, .25], [.2, .12, .2], material.dark, [90, 0, 0]), openNeck("前端向下出雪泥嘴", [0, .28, -.12], .019, .11, .005), rod("抽拉放料手柄", [-.06, .35, -.17], [.06, .35, -.17], .018, material.red),
    ...openTray("前置滴水盘", [0, .015, -.25], .27, .2, .025), cylinder("上部加料口颈", [0, .6, .04], [.09, .06, .09], material.ivory), cylinder("加料口盖", [0, .637, .04], [.11, .015, .11], material.dark),
  ] },
  { name: "辊筒面团排气刺轮", theme: "现代", build: () => {
    const parts: ModelPart[] = [cylinder("滚动针筒主体", [0, .06, -.055], [.075, .16, .075], material.ivory, [0, 0, 90]), rod("横向贯通轮轴", [-.105, .06, -.055], [.105, .06, -.055], .009), ...[-1, 1].map(side => rod("左右持轮叉臂", [side * .105, .06, -.055], [side * .035, .06, .08], .01)), box("握持手柄", [0, .06, .15], [.04, .035, .17], material.dark)];
    for (let row = 0; row < 5; row++) for (let i = 0; i < 10; i++) { const a = i * Math.PI / 5; parts.push(rod("贯入面团的短钝针", [(row - 2) * .032, .06 + Math.cos(a) * .035, -.055 + Math.sin(a) * .035], [(row - 2) * .032, .06 + Math.cos(a) * .057, -.055 + Math.sin(a) * .057], .0035, material.ivory)); }
    return parts;
  } },
  { name: "弧柄面包划纹刀", theme: "现代", build: () => [
    plate("双尖弧形薄划纹刃", [0, .025, -.07], [[-.012, -.05], [.009, -.04], [.018, .025], [.006, .055], [-.005, .045], [.004, .018], [.001, -.025]], .0015, material.steel, [-90, 0, 0]),
    cord("让手远离划纹面的弧形钢颈", [[0, .025, -.035], [0, .045, 0], [0, .065, .025]], .003), ball("纺锤形木握柄", [0, .065, .085], [.026, .027, .13], material.wood), cylinder("刀片固定小螺丝", [0, .028, -.065], [.008, .004, .008]),
  ] },
  { name: "纵横格栅凝乳切刀", theme: "现代", build: () => {
    const parts: ModelPart[] = [...[-1, 1].flatMap(side => [rod("矩形切乳框长边", [side * .105, .015, -.17], [side * .105, .015, .17], .009), rod("矩形切乳框短边", [-.105, .015, side * .17], [.105, .015, side * .17], .009)]), rod("框外持握长柄", [0, .015, .17], [0, .015, .44], .018), box("握柄末端隔热套", [0, .015, .4], [.03, .027, .14], material.dark)];
    for (let i = 0; i < 5; i++) parts.push(rod("横向拉紧切凝乳钢线", [-.105, .015, -.12 + i * .06], [.105, .015, -.12 + i * .06], .001));
    for (let i = 0; i < 4; i++) parts.push(rod("纵向拉紧切凝乳钢线", [-.075 + i * .05, .015, -.17], [-.075 + i * .05, .015, .17], .001));
    return parts;
  } },
  { name: "深筒捞面篓", theme: "中式", build: () => {
    const parts: ModelPart[] = [loop("敞口圆形筐沿", [0, .2, 0], .07, .005), loop("底部圆形筐沿", [0, .012, 0], .052, .004), loop("筐身中腰加强圈", [0, .1, 0], .061, .003), ...[-1, 1].map(side => rod("上口持篓夹耳", [side * .025, .195, .065], [side * .025, .24, .11], .006)), rod("夹耳中部柄颈", [-.025, .24, .11], [.025, .24, .11], .006), rod("长柄骨杆", [0, .24, .11], [0, .46, .25], .01), rod("柄末防烫竹握", [0, .36, .185], [0, .49, .27], .024, material.wood)];
    for (let i = 0; i < 18; i++) { const a = i * Math.PI / 9; parts.push(rod("侧壁独立通透网丝", [Math.cos(a) * .052, .012, Math.sin(a) * .052], [Math.cos(a) * .07, .2, Math.sin(a) * .07], .002)); }
    for (let i = -3; i <= 3; i++) { const x = i * .013, d = Math.sqrt(.052 ** 2 - x ** 2); parts.push(rod("篓底横向透水网丝", [-d, .012, x], [d, .012, x], .002), rod("篓底纵向透水网丝", [x, .012, -d], [x, .012, d], .002)); }
    return parts;
  } },
  { name: "双弧分瓣芒果切核器", theme: "现代", build: () => [
    part("前后合拢成椭圆孔的薄壁切核刃", "lathe", material.steel, [0, .004, 0], [.52, 1, 1], [0, 0, 0], { profile: [{ x: .055, y: 0 }, { x: .055, y: .018 }, { x: .052, y: .018 }, { x: .052, y: 0 }, { x: .055, y: 0 }] }),
    ...[-1, 1].map(side => box("两侧大拇指下压握柄", [side * .125, .018, 0], [.07, .03, .055], material.dark)), ...[-1, 1].map(side => box("刃环与握柄之间的扁平连接桥", [side * .065, .018, 0], [.077, .012, .02])),
  ] },
  { name: "杠杆网格薯条切割机", theme: "现代", build: () => {
    const holes = Array.from({ length: 25 }, (_, i): [number, number][] => { const x = (i % 5 - 2) * .016, z = (Math.floor(i / 5) - 2) * .016; return [[x - .0065, z - .0065], [x - .0065, z + .0065], [x + .0065, z + .0065], [x + .0065, z - .0065]]; });
    return [box("稳固长底板", [0, .025, 0], [.18, .05, .4]), ...[-1, 1].map(side => cylinder("吸盘固定底脚", [side * .06, .012, .04], [.06, .024, .06], material.dark)),
      piercedPanel("正面真孔刀格板", [0, .15, -.15], [[-.06, -.06], [.06, -.06], [.06, .06], [-.06, .06]], holes, .012, material.steel, [90, 0, 0]),
      ...[-1, 1].map(side => rod("刀格板侧承柱", [side * .066, .05, -.15], [side * .066, .23, -.15], .025)),
      ...[-1, 1].map(side => rod("沿底板的平行压板导轨", [side * .065, .15, -.14], [side * .065, .15, .15], .009)), box("沿轨推进的带齿推板", [0, .15, .07], [.095, .095, .018], material.ivory),
      ...Array.from({ length: 25 }, (_, i) => box("对应刀格孔的独立顶齿", [(i % 5 - 2) * .016, .15 + (Math.floor(i / 5) - 2) * .016, .05], [.011, .011, .025], material.ivory)),
      rod("两侧共同杠杆铰轴", [-.09, .12, .16], [.09, .12, .16], .015), ...[-1, 1].map(side => rod("抬起的长压杆侧臂", [side * .08, .12, .16], [side * .08, .4, -.2], .016)), rod("压杆最前端横握柄", [-.1, .4, -.2], [.1, .4, -.2], .03, material.dark),
      ...[-1, 1].map(side => rod("杠杆推动压板的双连杆", [side * .07, .25, -.005], [side * .045, .15, .075], .012)),
    ];
  } },
];
