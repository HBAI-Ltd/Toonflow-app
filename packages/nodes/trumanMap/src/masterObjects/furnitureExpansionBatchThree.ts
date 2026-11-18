import { part, type ModelPart } from "../assetModelParts";
import { sweptProfile } from "../masterNature/shared";
import { box, cylinder, ball, rod, loop, cord, plate, piercedPanel, bars, legs, material, type MasterPrototype } from "./parts";

function caster(x: number, z: number): ModelPart[] {
  return [cylinder("承重脚轮", [x, .065, z], [.13, .04, .13], material.dark, [0, 0, 90]), rod("脚轮回转立颈", [x, .065, z], [x, .15, z], .026), box("轮颈叉耳", [x, .075, z + .02], [.065, .055, .018])];
}

function drawerHandle(x: number, y: number, z: number): ModelPart {
  return rod("抽斗前侧横拉手", [x - .075, y, z], [x + .075, y, z], .014);
}

function cabinetBody(width: number, height: number, depth: number, base = .08): ModelPart[] {
  return [box("整体底框板", [0, base, 0], [width, .035, depth], material.wood), box("上方闭合台板", [0, height, 0], [width, .035, depth], material.wood), ...[-1, 1].map(side => box("两边主承重立板", [side * (width / 2 - .018), (height + base) / 2, 0], [.036, height - base, depth], material.wood))];
}

export const furnitureExpansionBatchThreeObjects: MasterPrototype[] = [
  { name: "四索悬台双人床", theme: "现代", itemType: "家具", build: () => [
    ...[-1, 1].flatMap(side => [box("独立吊床架顶部的两根主梁", [side * .86, 2.3, 0], [.11, .12, 2.22]), box("把两侧主梁锁成框的吊索横梁", [0, 2.3, side * .98], [1.84, .12, .1]), ...[-1, 1].flatMap(z => [box("不接触床面的独立落地吊架柱", [side * .86, 1.15, z * 1.02], [.09, 2.3, .09]), rod("承托四个床角的绞合悬索", [side * .72, .54, z * .98], [side * .72, 2.25, z * .98], .012)])]),
    ...[-1, 1].map(side => box("悬索直接托起的床边长梁", [side * .75, .48, 0], [.075, .14, 2.13], material.wood)),
    ...[-1, 1].map(side => box("贯穿床角的端头横梁", [0, .48, side * 1.02], [1.58, .14, .075], material.wood)),
    ...bars("长梁之间真实承重的弹性排骨条", 12, [0, .51, 0], 1.86, [1.44, .025, .065], 2, material.wood),
    box("厚褥软垫", [0, .635, 0], [1.43, .23, 1.95], material.ivory), ...[-1, 1].map(side => box("床头独立软枕", [side * .37, .79, .66], [.61, .11, .4], material.red)),
    ...[-1, 1].flatMap(x => [-1, 1].map(z => loop("床角悬索下端的承载吊环", [x * .72, .54, z * .98], .034, .008, [90, 0, 0]))),
  ] },
  { name: "贯梁阁楼床工作架", theme: "现代", itemType: "家具", build: () => [
    ...[-1, 1].flatMap(x => [-1, 1].map(z => box("贯通床架与下部工位的整根承重柱", [x * .53, 1.04, z * 1.04], [.075, 2.08, .075]))),
    ...[-1, 1].map(side => box("在高位连成整体的床边扭矩梁", [side * .53, 1.51, 0], [.075, .15, 2.13])),
    ...[-1, 1].map(side => box("床头床尾贯穿横梁", [0, 1.51, side * 1.04], [1.12, .15, .075])),
    ...bars("上床独立排骨条", 12, [0, 1.56, 0], 1.91, [1.01, .025, .075], 2, material.wood), box("高位床褥", [0, 1.67, 0], [.99, .19, 1.96], material.ivory),
    ...[-1, 1].map(side => box("上层护栏纵梁", [side * .53, 1.98, 0], [.035, .045, 2.1])),
    ...[-1, 1].flatMap(side => [-.75, 0, .75].map(z => rod("护栏竖直细柱", [side * .53, 1.6, z], [side * .53, 1.98, z], .02))),
    box("与四柱直接锁固的下部工作拉梁面", [0, .76, .65], [1.09, .05, .76], material.wood), rod("下部工位后侧抗扭斜撑", [-.53, .08, 1.04], [.53, 1.47, 1.04], .025),
    ...[-1, 1].map(side => plate("同时支撑入床踏阶的整幅梯侧板", [.57 + side * .18, 0, -.76], [[-.37, 0], [-.27, 0], [.39, 1.57], [.29, 1.57]], .035, material.wood, [0, 90, 0])),
    ...Array.from({ length: 6 }, (_, index) => box("连接两梯侧板的宽踏步", [.57, .15 + index * .25, -.41 - index * .11], [.4, .035, .15], material.wood)),
    rod("踏阶外侧独立扶手", [.79, .58, -.39], [.79, 1.96, -1.08], .027),
  ] },
  { name: "三段电动护理病床", theme: "现代", itemType: "家具", build: () => [
    ...[-1, 1].flatMap(x => [-1, 1].flatMap(z => caster(x * .4, z * .86))),
    box("床下承重底架", [0, .19, 0], [.88, .095, 1.83]), ...[-1, 1].map(side => rod("床面升降的斜交撑杆", [side * .34, .23, -.63], [side * .34, .54, .53], .035)),
    box("平直臀部承托节", [0, .58, -.09], [.87, .055, .55]), box("可以向上抬起的背部承托节", [0, .82, .57], [.87, .055, .96], material.steel, [-30, 0, 0]), box("膝下折起的腿部承托节", [0, .64, -.69], [.87, .055, .66], material.steel, [13, 0, 0]),
    box("臀部独立软垫", [0, .65, -.09], [.84, .11, .54], material.ivory), box("背部独立软垫", [0, .9, .6], [.84, .11, .94], material.ivory, [-30, 0, 0]), box("腿部独立软垫", [0, .71, -.68], [.84, .11, .64], material.ivory, [13, 0, 0]),
    ...[-1, 1].flatMap(side => [box("床头床尾端挡板", [0, .73, side * 1.075], [.96, .45, .065], material.ivory), ...[-.56, .5].flatMap(z => [rod("可降护栏上边", [side * .485, .91, z - .3], [side * .485, .91, z + .3], .022), ...[-1, 1].map(edge => rod("护栏的斜交下翻连杆", [side * .485, .56, z + edge * .21], [side * .485, .91, z + edge * .29], .02))])]),
    cylinder("床下背节驱动推杆电机", [0, .44, .28], [.095, .22, .095], material.dark, [55, 0, 0]), rod("推杆接到背节下方的升背臂", [0, .43, .28], [0, .79, .62], .027),
    box("端挡板嵌入的有线控制器", [.28, .81, -1.115], [.17, .08, .025], material.dark),
  ] },
  { name: "圆盘回转展示床", theme: "现代", itemType: "家具", build: () => [
    cylinder("固定于地面的低圆底盘", [0, .07, 0], [1.98, .14, 1.98], material.dark), loop("固定底盘上的承转滚道", [0, .17, 0], .86, .045), cylinder("与滚道相接的上回转承台", [0, .24, 0], [2.19, .1, 2.19], material.wood),
    cylinder("完整圆形厚床褥", [0, .4, 0], [2.08, .25, 2.08], material.ivory),
    ...[-1, 1].map(side => box("圆床后沿的独立软枕", [side * .4, .59, .59], [.68, .13, .38], material.red, [0, -side * 16, 0])),
    ...[-1, 1].map(side => box("曲线床头的两片软包背翼", [side * .52, .7, .92], [.96, .64, .13], material.red, [0, -side * 23, 0])),
    cylinder("沿底盘侧缘驱动的摩擦滚轮", [.96, .14, 0], [.1, .11, .1], material.dark, [0, 0, 90]), box("低置回转减速电机罩", [.79, .13, 0], [.25, .16, .18], material.steel),
  ] },
  { name: "底舱整幅升面的榻台床", theme: "现代", itemType: "家具", build: () => [
    box("整体储物底舱的封底", [0, .045, 0], [1.86, .055, 2.14], material.wood),
    ...[-1, 1].map(side => box("底舱长侧壁", [side * .91, .23, 0], [.04, .37, 2.14], material.wood)), ...[-1, 1].map(side => box("底舱端壁", [0, .23, side * 1.05], [1.78, .37, .04], material.wood)),
    ...[-.3, .3].map(x => box("储物区承担上床荷载的长隔板", [x, .215, 0], [.025, .34, 2.04], material.wood)),
    rod("床头整幅抬升的贯通铰轴", [-.9, .43, 1.04], [.9, .43, 1.04], .025),
    box("从底舱整体掀起的床面硬台", [0, .83, .07], [1.83, .055, 2.1], material.wood, [23, 0, 0]), box("固定在抬升床面上的薄褥", [0, .91, .035], [1.73, .13, 2.01], material.ivory, [23, 0, 0]),
    ...[-1, 1].flatMap(side => [cylinder("抬床用平衡气撑外筒", [side * .84, .46, -.19], [.045, .42, .045], material.dark, [48, 0, 0]), rod("接到床面下方的气撑活塞", [side * .84, .57, -.36], [side * .84, .9, -.57], .02)]),
    cord("床尾可提起的织物拉带", [[-.08, 1.18, -.89], [-.08, 1.25, -.92], [.08, 1.25, -.92], [.08, 1.18, -.89]], .008, material.dark),
  ] },
  { name: "围柱环形公共沙发", theme: "现代", itemType: "家具", build: () => [
    part("留有中央柱洞的连续承坐底环", "lathe", material.dark, [0, .03, 0], [1, 1, 1], [0, 0, 0], { profile: [{ x: .39, y: 0 }, { x: 1.24, y: 0 }, { x: 1.24, y: .3 }, { x: .39, y: .3 }, { x: .39, y: 0 }] }),
    part("完整环状厚软座垫", "lathe", material.red, [0, .3, 0], [1, 1, 1], [0, 0, 0], { profile: [{ x: .43, y: 0 }, { x: 1.2, y: 0 }, { x: 1.26, y: .045 }, { x: 1.26, y: .13 }, { x: 1.18, y: .18 }, { x: .43, y: .18 }, { x: .43, y: 0 }] }),
    part("中央围柱并向四方承靠的软背环", "lathe", material.ivory, [0, .42, 0], [1, 1, 1], [0, 0, 0], { profile: [{ x: .38, y: 0 }, { x: .69, y: 0 }, { x: .64, y: .2 }, { x: .58, y: .51 }, { x: .48, y: .58 }, { x: .39, y: .58 }, { x: .38, y: 0 }] }),
    ...Array.from({ length: 8 }, (_, index) => { const angle = index * Math.PI / 4; return box("坐垫径向缝合压线", [Math.cos(angle) * .98, .48, Math.sin(angle) * .98], [.5, .006, .008], material.dark, [0, -index * 45, 0]); }),
  ] },
  { name: "无骨折垫地板沙发", theme: "现代", itemType: "家具", build: () => [
    box("落地的整幅厚折垫底层", [0, .11, -.08], [1.72, .22, 1.06], material.dark), box("翻向前方形成坐面的第二折垫", [0, .3, -.22], [1.69, .18, .81], material.red),
    box("靠墙保持倾角的第三折背垫", [0, .69, .34], [1.69, .69, .18], material.red, [-14, 0, 0]),
    ...[-1, 1].map(side => box("两端可分离的厚软包扶枕", [side * .72, .58, -.14], [.24, .32, .65], material.ivory)),
    ...[-1, 1].map(side => cord("相邻折垫之间的柔性布铰带", [[side * .78, .26, .16], [side * .78, .38, .25], [side * .78, .46, .28]], .012, material.dark)),
    ...[-1, 1].map(side => box("底层两侧拎提织带", [side * .868, .17, -.1], [.012, .12, .22], material.ivory)),
  ] },
  { name: "环轨旋转衣柜", theme: "现代", itemType: "家具", build: () => {
    const parts: ModelPart[] = [cylinder("环形衣柜的圆脚底台", [0, .06, 0], [1.58, .12, 1.58], material.wood), cylinder("顶端固定吊轨的圆盘帽", [0, 1.99, 0], [1.65, .07, 1.65], material.wood), cylinder("中央承重立柱", [0, 1.02, 0], [.12, 1.94, .12]), loop("衣物架真正沿其运行的环形吊轨", [0, 1.88, 0], .62, .018), cylinder("上方回转驱动头", [0, 1.91, 0], [.24, .12, .24], material.dark)];
    for (let index = 0; index < 8; index++) {
      const angle = index * Math.PI / 4, x = Math.cos(angle), z = Math.sin(angle);
      parts.push(rod("从回转柱连接吊轨滑车的径向传动臂", [0, 1.9, 0], [x * .62, 1.9, z * .62], .016), cylinder("跑在吊轨上的小滑轮", [x * .62, 1.91, z * .62], [.045, .015, .045], material.dark, [90, -index * 45, 0]), rod("下垂的挂衣吊颈", [x * .62, 1.86, z * .62], [x * .62, 1.67, z * .62], .012), rod("各衣位独立的横向挂衣撑", [x * .62 - z * .22, 1.67, z * .62 + x * .22], [x * .62 + z * .22, 1.67, z * .62 - x * .22], .018, material.wood));
    }
    for (const angle of [45, 135, 225]) parts.push(box("为前方取衣保留敞口的弧向外护板", [Math.cos(angle * Math.PI / 180) * .75, 1.03, Math.sin(angle * Math.PI / 180) * .75], [.035, 1.83, 1.05], material.wood, [0, -angle, 0]));
    return parts;
  } },
  { name: "立式循环吊篮储衣柜", theme: "现代", itemType: "家具", build: () => {
    const parts: ModelPart[] = [...cabinetBody(1.66, 2.29, .64), box("防触碰的薄背壁", [0, 1.18, .312], [1.59, 2.16, .018], material.wood)];
    for (const z of [-.22, .22]) parts.push(cord("围绕上下链轮闭合运行的传动带", [[-.57, .39, z], [-.57, 1.94, z], [-.4, 2.16, z], [.4, 2.16, z], [.57, 1.94, z], [.57, .39, z], [.4, .19, z], [-.4, .19, z], [-.57, .39, z]], .014, material.dark));
    for (const y of [.36, 2.01]) for (const x of [-.45, .45]) parts.push(cylinder("循环带的上下导轮", [x, y, 0], [.24, .48, .24], material.steel, [90, 0, 0]));
    for (const side of [-1, 1]) for (let tier = 0; tier < 4; tier++) {
      const x = side * .53, y = .44 + tier * .43;
      parts.push(box("随循环吊点保持水平的衣物篮底", [x, y, 0], [.43, .025, .49], material.ivory), ...[-1, 1].map(edge => box("独立衣物篮的侧壁", [x + edge * .207, y + .1, 0], [.016, .2, .49], material.ivory)), box("衣物篮后侧挡板", [x, y + .1, .235], [.43, .2, .018], material.ivory), rod("篮体悬在循环带上的通长铰轴", [x, y + .16, -.245], [x, y + .16, .245], .012));
    }
    parts.push(box("前侧低位抽取口的承托下边框", [0, .31, -.33], [1.6, .12, .035], material.dark));
    return parts;
  } },
  { name: "水平转鼓档案柜", theme: "现代", itemType: "家具", build: () => [
    ...[-1, 1].map(side => plate("承托横向文件转鼓的三角端架", [side * .64, 0, 0], [[-.52, .04], [.52, .04], [.2, 1.27], [-.2, 1.27]], .06, material.wood, [0, 90, 0])),
    cylinder("从两个端架穿过的横向主轴", [0, .9, 0], [.065, 1.4, .065], material.steel, [0, 0, 90]),
    ...[-1, 1].map(side => loop("文件转鼓端部外轮缘", [side * .55, .9, 0], .58, .025, [0, 0, 90])),
    ...Array.from({ length: 8 }, (_, index) => { const a = index * Math.PI / 4, y = .9 + Math.cos(a) * .43, z = Math.sin(a) * .43; return [box("各档案格独立的长向背槽", [0, y, z], [1.08, .025, .29], material.wood, [index * 45, 0, 0]), ...[-1, 1].map(side => rod("把档案格固定在横轴的轮辐", [side * .52, .9, 0], [side * .52, y, z], .025)), box("文件不会从格边滑出的挡条", [0, y + Math.sin(a) * .13, z - Math.cos(a) * .13], [1.06, .04, .018], material.dark, [index * 45, 0, 0])]; }).flat(),
    loop("柜侧操作转鼓的手轮", [.74, .9, 0], .15, .016, [0, 0, 90]), rod("侧手轮偏置旋柄", [.74, 1.04, 0], [.82, 1.04, 0], .018, material.dark),
  ] },
  { name: "双面蝶开展示柜", theme: "现代", itemType: "家具", build: () => {
    const parts: ModelPart[] = [box("中部竖直固定铰接脊", [0, 1.01, .2], [.12, 1.96, .16], material.dark), ...[-1, 1].flatMap(side => caster(side * .48, .2))];
    for (const side of [-1, 1]) {
      const angle = side * 25, a = angle * Math.PI / 180, x = side * .46, z = .02;
      parts.push(box("整面展开的展示柜背框", [x, 1.03, z], [.91, 1.85, .035], material.wood, [0, angle, 0]), ...[.15, .7, 1.25, 1.8].map(y => ({ ...box("展开柜翼独立的透明陈列层", [x - Math.sin(a) * .16, y, z - Math.cos(a) * .16], [.87, .018, .3], material.glass, [0, angle, 0]), opacity: .28 })), ...[-1, 1].map(edge => box("柜翼两端的立框", [x + edge * Math.cos(a) * .44 - Math.sin(a) * .15, 1.03, z - edge * Math.sin(a) * .44 - Math.cos(a) * .15], [.025, 1.85, .32], material.wood, [0, angle, 0])), { ...box("可看透翼内陈列的玻璃前门", [x - Math.sin(a) * .32, 1.03, z - Math.cos(a) * .32], [.86, 1.8, .009], material.glass, [0, angle, 0]), opacity: .18 });
    }
    parts.push(...[-1, 1].map(side => rod("柜翼背侧锁定展开角度的撑臂", [0, .55, .2], [side * .63, .55, .11], .022)), ...[-1, 1].flatMap(side => caster(side * .78, -.32)));
    return parts;
  } },
  { name: "双折移动隔断储物墙", theme: "现代", itemType: "家具", build: () => {
    const parts: ModelPart[] = [];
    for (const side of [-1, 1]) {
      const angle = side * 19, a = angle * Math.PI / 180, x = side * .56;
      for (const y of [.18, .76, 1.34, 1.92]) parts.push(box("既分隔房间又能承物的贯通层板", [x, y, 0], [1.08, .035, .3], material.wood, [0, angle, 0]));
      for (const edge of [-1, 1]) parts.push(box("整幅折翼的两根承重侧板", [x + edge * Math.cos(a) * .52, 1.05, -edge * Math.sin(a) * .52], [.035, 1.77, .3], material.wood, [0, angle, 0]), ...caster(x + edge * Math.cos(a) * .45, -edge * Math.sin(a) * .45));
      parts.push(box("防侧向摇摆的错位竖隔片", [x, 1.05, .08], [.025, 1.72, .13], material.wood, [0, angle, 0]));
    }
    parts.push(rod("两幅储物墙共同连接的折合竖铰轴", [0, .16, .18], [0, 1.94, .18], .018), ...[.28, 1.71].map(y => cylinder("共同铰轴的限角锁套", [0, y, .18], [.045, .06, .045], material.dark)));
    return parts;
  } },
  { name: "分高无障碍前台接待柜", theme: "现代", itemType: "家具", build: () => [
    box("主柜抬高的服务台面", [-.37, 1.12, 0], [1.67, .055, .7], material.wood), box("轮椅可伸入的低服务台面", [.96, .77, -.04], [.95, .045, .62], material.wood),
    box("遮挡内部资料的前曲折封壁", [-.37, .58, -.29], [1.61, 1.05, .04], material.wood), ...[-1, 1].map(side => box("主柜两端整幅承重板", [-.37 + side * .8, .58, .02], [.04, 1.05, .62], material.wood)),
    box("低位服务台外端的整幅支脚", [1.41, .39, -.04], [.045, .73, .62], material.wood),
    box("内侧下沉工作面", [-.37, .76, .09], [1.5, .035, .47], material.ivory),
    ...[-.7, -.03].flatMap(x => [box("内侧资料屉的侧板", [x, .43, .16], [.025, .62, .4], material.wood), ...[.25, .46, .65].map(y => box("内部独立抽斗面", [x + .19, y, .376], [.34, .16, .02], material.wood))]),
    box("低位侧支承与主柜相接的横向承梁", [.95, .69, .14], [.93, .055, .055], material.steel),
  ] },
  { name: "洗头盆一体理容躺床", theme: "现代", itemType: "家具", build: () => [
    box("承接座背与洗头盆的共同长底台", [0, .095, .07], [.77, .19, 1.79], material.dark), box("座面下的承重台柱", [0, .32, -.19], [.55, .32, .58], material.ivory),
    box("倾斜躺靠的上身软垫", [0, .69, .26], [.58, .13, .83], material.red, [-36, 0, 0]), box("前方坐垫", [0, .51, -.27], [.58, .14, .51], material.red),
    box("前伸的腿部软垫", [0, .36, -.71], [.56, .12, .48], material.red, [30, 0, 0]),
    ...[-1, 1].map(side => cord("整幅两侧扶手框", [[side * .33, .27, -.43], [side * .33, .73, -.43], [side * .33, .75, .2], [side * .33, .44, .27]], .028)),
    cylinder("洗头盆下方通向底台的排水立颈", [0, .57, .77], [.18, .85, .18], material.ivory),
    part("低于颈口的真正盛水盆腹", "lathe", material.ivory, [0, .93, .76], [1, 1, 1], [0, 0, 0], { profile: [{ x: 0, y: -.16 }, { x: .16, y: -.16 }, { x: .28, y: -.06 }, { x: .32, y: .035 }, { x: .295, y: .035 }, { x: .255, y: -.055 }, { x: .14, y: -.135 }, { x: .015, y: -.135 }, { x: .015, y: -.16 }] }),
    { ...sweptProfile("只有前侧低颈口敞开的抬高盆沿", material.ivory, [[.295, .035], [.32, .035], [.32, .13], [.305, .15], [.28, .13], [.295, .035]], Math.PI * 5 / 3, 20), position: { x: 0, y: .93, z: .76 }, rotation: { x: 0, y: 120, z: 0 } },
    ...[-1, 1].map(side => ball("颈口两侧的软胶承颈垫", [side * .115, .98, .48], [.1, .05, .1], material.dark)),
    cord("可拉出的手持冲水喷头软管", [[.22, 1.02, .88], [.38, .8, .93], [.32, 1.11, .91]], .012, material.dark), box("盆边控制混水的扳柄", [-.22, 1.08, .87], [.08, .025, .035], material.steel),
  ] },
  { name: "贯通管线理发镜台", theme: "现代", itemType: "家具", build: () => [
    ...[-1, 1].map(side => box("连接地面与镜架的承重端箱", [side * .7, .46, .05], [.27, .86, .47], material.wood)), box("便于理发用具沿线摆放的整幅台面", [0, .91, 0], [1.78, .045, .62], material.wood),
    box("背后穿线的高位公共管线脊", [0, 1.44, .24], [1.74, 1.01, .09], material.wood), { ...box("平整可照面的整幅镜片", [0, 1.46, .185], [1.55, .88, .012], material.glass), metalness: .7, roughness: .1 },
    ...[-1, 1].flatMap(side => [box("端箱上方的窄抽屉面", [side * .7, .74, -.2], [.24, .19, .025], material.wood), drawerHandle(side * .7, .74, -.228), box("端箱可开下柜门", [side * .7, .35, -.2], [.24, .51, .025], material.wood)]),
    ...[-.42, .1, .4].map(x => loop("真正可插入吹风机的悬托圈", [x, .87, -.37], .055, .012)),
    ...[-.42, .1, .4].map(x => rod("吹风机托圈回接台下梁的短臂", [x, .865, -.35], [x, .84, -.23], .016)),
    box("藏在镜后下沿的公共理线槽底", [0, .97, .245], [1.31, .025, .065], material.dark),
  ] },
  { name: "双面互锁对穿更衣柜", theme: "现代", itemType: "家具", build: () => [
    ...cabinetBody(1.45, 1.9, .59), ...[-.23, .23].map(x => box("两侧共用而不封闭前后的隔仓壁", [x, .98, 0], [.025, 1.79, .55], material.wood)),
    box("把上下对穿仓分开的整幅层板", [0, .99, 0], [1.37, .025, .56], material.wood),
    ...[-.465, 0, .465].flatMap(x => [.54, 1.45].flatMap(y => [-1, 1].flatMap(side => [box("前后均可打开的独立薄仓门", [x, y, side * .305], [.435, .85, .025], material.ivory), cylinder("对穿仓单侧旋钮锁", [x + .15, y, side * .325], [.026, .015, .026], material.dark, [90, 0, 0])]))),
    ...[-.465, 0, .465].flatMap(x => [.54, 1.45].map(y => rod("两门互锁机构的横穿仓传动细轴", [x + .16, y, -.28], [x + .16, y, .28], .009))),
    ...legs(1.25, .43, .065, .065),
  ] },
  { name: "体育更衣座仓一体柜", theme: "现代", itemType: "家具", build: () => [
    ...[-.84, -.28, .28, .84].map(x => box("直接从地面支撑顶帽的贯通分仓侧板", [x, 1.05, .12], [.035, 2.04, .49], material.wood)),
    box("各仓共用的顶帽", [0, 2.08, .12], [1.74, .045, .53], material.wood), box("整幅防摇背板", [0, 1.06, .355], [1.69, 2.01, .025], material.wood),
    box("与分仓板榫接的长承坐板", [0, .46, -.16], [1.75, .065, .7], material.wood),
    ...[-.56, 0, .56].flatMap(x => [box("开放更衣仓的顶储物层", [x, 1.73, .12], [.52, .025, .47], material.wood), rod("每仓可挂衣服的横向短杆", [x - .2, 1.56, .16], [x + .2, 1.56, .16], .018), ...bars("坐面下方通气鞋架", 5, [x, .16, -.13], .5, [.42, .015, .018], 2), ...[-1, 1].map(side => rod("背板前方的独立挂衣双钩", [x + side * .15, 1.34, .32], [x + side * .15, 1.39, .23], .014))]),
    ...[-1, 1].map(side => box("宽坐面的外侧落地前脚", [side * .82, .22, -.41], [.065, .4, .065], material.wood)),
  ] },
  { name: "前陈列绘本斜槽书台", theme: "现代", itemType: "家具", build: () => [
    ...[-1, 1].map(side => plate("阶梯书台完整的侧承重板", [side * .52, 0, 0], [[-.47, .02], [.48, .02], [.48, 1.15], [.2, 1.15], [.2, .84], [-.08, .84], [-.08, .53], [-.47, .53]], .035, material.wood, [0, 90, 0])),
    ...Array.from({ length: 3 }, (_, index) => { const y = .3 + index * .31, z = -.34 + index * .28; return [box("绘本封面向前的独立斜托底", [0, y, z], [1.02, .025, .3], material.wood, [-16, 0, 0]), box("书不从斜底滑出的通长前挡", [0, y + .08, z - .14], [1.02, .16, .025], material.wood), box("每槽后靠的倾斜支书板", [0, y + .18, z + .12], [1.02, .36, .025], material.wood, [-12, 0, 0])]; }).flat(),
    ...bars("下方开放宽格的承书底条", 5, [0, .11, 0], .72, [.99, .02, .04], 2, material.wood),
    rod("两端侧板下部的抗侧翻拉杆", [-.52, .15, .38], [.52, .15, .38], .035, material.wood),
  ] },
  { name: "双悬臂龙骨会议长台", theme: "现代", itemType: "家具", build: () => [
    ...[-1, 1].map(side => box("落地宽脚的横向压重梁", [side * 1.02, .035, 0], [.13, .07, 1.08], material.dark)),
    ...[-1, 1].flatMap(side => [box("与地脚刚接的中央箱形桥墩", [side * 1.02, .38, 0], [.12, .64, .12]), ...[-1, 1].map(edge => rod("从中央墩斜挑到宽桌翼的下撑", [side * 1.02, .42, 0], [side * 1.02, .715, edge * .52], .055))]),
    box("连接两桥墩的连续抗弯龙骨", [0, .68, 0], [2.23, .12, .12]),
    ...[-1, 1].map(side => box("在龙骨两侧悬出的整幅宽桌翼", [0, .76, side * .33], [3.02, .055, .64], material.wood)),
    ...[-1, 1].map(side => rod("龙骨内侧的预张拉斜索", [-1.02, .4, 0], [1.02, .69, side * .06], .006, material.dark)),
    ...[-1, 1].map(side => box("两侧桌翼之间可掀开的中脊盖", [side * .77, .76, 0], [1.48, .025, .04], material.wood)),
  ] },
  { name: "重锤平衡调高工作台", theme: "现代", itemType: "家具", build: () => [
    ...[-1, 1].flatMap(side => [box("宽长防倾底脚", [side * .59, .035, 0], [.11, .07, .87], material.dark), ...[-1, 1].map(edge => rod("每个柱位的双根垂直导向杆", [side * .59, .1, edge * .06], [side * .59, 1.19, edge * .06], .024)), cylinder("顶部改变配重索走向的滑轮", [side * .59, 1.15, 0], [.14, .05, .14], material.steel, [0, 0, 90]), box("上下移动的完整铸铁平衡重", [side * .59, .46, .15], [.13, .38, .11], material.dark), cord("从升降托台绕过柱顶滑轮到重锤的闭合工作索", [[side * .59, .84, -.07], [side * .59, 1.15, -.07], [side * .59, 1.22, 0], [side * .59, 1.15, .07], [side * .59, .65, .15]], .005)]),
    box("可沿双柱调高的完整工作台面", [0, .88, -.08], [1.48, .045, .73], material.wood),
    ...[-1, 1].map(side => box("托住台面并在导杆上滑行的承重桥", [side * .59, .82, -.08], [.16, .08, .62])), rod("两移动托桥之间的抗扭横梁", [-.59, .79, -.02], [.59, .79, -.02], .035),
    rod("台下释放卡钳的横向拉杆", [-.18, .82, -.37], [.18, .82, -.37], .014, material.dark),
  ] },
  { name: "抬机翻台一体缝纫柜", theme: "现代", itemType: "家具", build: () => [
    ...cabinetBody(1.08, .75, .57), box("固定后背的抗扭板", [0, .4, .27], [1.01, .64, .025], material.wood),
    ...[-1, 1].map(side => box("向外展开的完整延长工作面", [side * .8, .75, 0], [.49, .035, .57], material.wood)),
    ...[-1, 1].flatMap(side => [box("可从下柜旋出的延长板承重侧脚", [side * .82, .36, .19], [.035, .69, .42], material.wood, [0, side * 28, 0]), rod("台翼到侧脚的折合支承", [side * .51, .72, .2], [side * .89, .52, .2], .018)]),
    piercedPanel("围住缝纫机底座且真正留孔的中央操作面", [0, .731, 0], [[-.53, -.285], [.53, -.285], [.53, .285], [-.53, .285]], [[[-.2, -.12], [-.2, .13], [.25, .13], [.25, -.12]]], .035, material.wood),
    box("随双臂上升托住机头的独立机座台", [.025, .72, .005], [.43, .035, .24], material.steel),
    ...[-1, 1].flatMap(side => [rod("抬机平台的第一条平行臂", [side * .19, .31, .16], [side * .19, .7, -.07], .022), rod("抬机平台的第二条平行臂", [side * .19, .3, .23], [side * .19, .7, 0], .022)]),
    box("下柜前侧可合起的储物门", [-.28, .39, -.3], [.49, .6, .025], material.wood), drawerHandle(-.28, .4, -.327), ...legs(.87, .39, .065, .055),
  ] },
  { name: "滚轮中折排骨客床", theme: "现代", itemType: "家具", build: () => [
    ...[-1, 1].flatMap(side => caster(side * .4, 0)),
    box("中间可推动的双轮承载横架", [0, .19, 0], [.91, .075, .16]),
    ...[-1, 1].flatMap(side => [rod("床边分为两段的长承梁", [side * .43, .48, -1], [side * .43, .48, 1], .035), ...[-1, 1].map(z => rod("床两端独立折起的U形脚", [side * .39, .035, z * .77], [side * .39, .46, z * .84], .025))]),
    ...[-1, 1].map(side => rod("折合端脚之间的贯通地脚横联", [-.39, .035, side * .77], [.39, .035, side * .77], .025)),
    ...bars("床架中真正横跨的弹性排骨条", 16, [0, .49, 0], 1.9, [.84, .015, .045], 2, material.wood),
    ...[-1, 1].map(side => box("与中折分界对应的独立床垫块", [0, .58, side * .49], [.83, .15, .96], material.ivory)),
    ...[-1, 1].map(side => cylinder("床边中折枢轴", [side * .44, .48, 0], [.065, .045, .065], material.dark, [0, 0, 90])),
    cord("床头能握住推动整床的U形把手", [[-.42, .48, .99], [-.42, .74, .99], [.42, .74, .99], [.42, .48, .99]], .022),
  ] },
  { name: "拉出同平剪叉双床套架", theme: "现代", itemType: "家具", build: () => [
    ...[-1, 1].map(side => box("主床的贯通长侧框", [side * .49 - .44, .45, 0], [.05, .19, 2.05], material.wood)),
    ...[-1, 1].map(side => box("主床头尾承重立板", [-.44, .45, side * 1], [1.04, .86, .055], material.wood)),
    box("主床床褥", [-.44, .59, 0], [.94, .16, 1.94], material.ivory),
    ...[-1, 1].map(side => box("抽出床的纵向钢边梁", [.63 + side * .45, .46, 0], [.035, .055, 1.97])),
    ...bars("抽出床的完整排骨条", 12, [.63, .47, 0], 1.83, [.86, .018, .055], 2, material.wood), box("抬起后与主床同高的副床软垫", [.63, .58, 0], [.86, .17, 1.91], material.ivory),
    ...[-1, 1].flatMap(side => [rod("副床从低位抬起的第一剪叉脚", [.24, .09, side * .76], [1.03, .44, side * .76], .025), rod("副床从低位抬起的反向剪叉脚", [1.03, .09, side * .76], [.24, .44, side * .76], .025), cylinder("副床脚叉中铰盘", [.635, .265, side * .76], [.045, .025, .045], material.dark, [90, 0, 0]), ...caster(.25, side * .76), ...caster(1.02, side * .76)]),
  ] },
  { name: "卷帘展面伸缩餐台", theme: "现代", itemType: "家具", build: () => [
    ...cabinetBody(.96, .79, .42), box("收起台面时卷帘盘的后护板", [0, .46, .2], [.89, .6, .025], material.wood),
    ...[-1, 1].flatMap(side => [box("从台柜中向前伸出的方形主轨", [side * .38, .74, -.76], [.045, .055, 1.93]), box("可推回柜内的内层伸缩方轨", [side * .38, .74, -1.37], [.028, .035, 1.05], material.steel), rod("活动台尾的独立支脚", [side * .38, .035, -1.8], [side * .38, .73, -1.8], .035)]),
    ...Array.from({ length: 20 }, (_, index) => box("连续相连并可卷回柜内的横向实木台条", [0, .79, -.23 - index * .078], [.91, .025, .074], material.wood)),
    ...Array.from({ length: 7 }, (_, index) => { const angle = index / 6 * Math.PI / 2; return box("柜内卷起部分的连续弧排木条", [0, .62 + Math.cos(angle) * .16, .03 + Math.sin(angle) * .16], [.91, .025, .07], material.wood, [-index * 15, 0, 0]); }),
    rod("活动支脚之间的低位抗扭横撑", [-.38, .17, -1.8], [.38, .17, -1.8], .025), cylinder("柜内收卷台条的横轴", [0, .62, .03], [.16, .86, .16], material.dark, [0, 0, 90]),
  ] },
  { name: "分仓水囊浮力床", theme: "现代", itemType: "家具", build: () => [
    box("共同承受液体重量的低位整幅底座", [0, .12, 0], [1.84, .24, 2.14], material.wood),
    ...[-1, 1].map(side => box("水囊外侧的防漏围框长壁", [side * .9, .37, 0], [.04, .3, 2.14], material.wood)), ...[-1, 1].map(side => box("防漏围框前后壁", [0, .37, side * 1.05], [1.8, .3, .04], material.wood)),
    ...Array.from({ length: 4 }, (_, index) => ({ ...box("抑制横向晃动的独立长水囊", [(index - 1.5) * .43, .385, 0], [.42, .26, 2.01], material.glass), opacity: .52 })),
    ...[-.62, 0, .62].map(z => box("透过囊壁可见的内部阻浪隔片", [0, .375, z], [1.67, .19, .009], material.ivory)),
    box("薄柔性共面承卧覆层", [0, .535, 0], [1.73, .04, 2.03], material.ivory),
    ...[-1, 1].map(side => box("水床头部独立枕垫", [side * .41, .64, .72], [.68, .15, .39], material.red)),
    cylinder("隐藏在床尾侧的注水封口", [.65, .54, -.95], [.055, .035, .055], material.dark),
  ] },
];
