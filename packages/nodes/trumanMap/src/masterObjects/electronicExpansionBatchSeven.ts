import { part, type ModelPart, type Triple } from "../assetModelParts";
import { polygon } from "../masterNature/shared";
import { box, cylinder, loop, rod, ball, cord, bars, plate, cone, material, type MasterPrototype } from "./parts";
import { cabinetShell, optic, reel } from "./electronicExpansionBatchTwo";
import { Euler, Matrix4, Vector3 } from "three";

function keys(position: Triple, width: number, depth: number, rows: number, columns: number, tilt = 0): ModelPart[] {
  const angle = tilt * Math.PI / 180;
  return Array.from({ length: rows }, (_, row) => { const z = (row / Math.max(1, rows - 1) - .5) * depth; return bars("可单独按压的实际键帽", columns, [position[0], position[1] - Math.sin(angle) * z, position[2] + Math.cos(angle) * z], width, [width / columns * .76, .007, depth / rows * .7], 0, material.ivory).map(value => ({ ...value, rotation: { x: tilt, y: 0, z: 0 } })); }).flat();
}

function frontPanel(name: string, color: string, position: Triple, outline: [number, number][], holes: [number, number][][], depth: number): ModelPart {
  return { ...polygon(name, color, outline, depth, position, holes), rotation: { x: -90, y: 0, z: 0 } };
}

export const electronicExpansionBatchSevenObjects: MasterPrototype[] = [
  { name: "手提箱式显像管便携计算机", theme: "现代", build: () => [
    ...cabinetShell(.52, .34, .35), frontPanel("带屏口和两驱动器口的便携电脑实际前框", material.ivory, [0, 0, -.175], [[-.26, 0], [.26, 0], [.26, .34], [-.26, .34]], [[[-.195, .105], [-.195, .27], [-.025, .27], [-.025, .105]], [[.035, .23], [.035, .28], [.22, .28], [.22, .23]], [[.035, .105], [.035, .155], [.22, .155], [.22, .105]]], .014),
    box("左侧独立的内凹小显像屏", [-.11, .1875, -.181], [.177, .17, .014], material.glass), ...[.13, .255].map(y => box("两个软盘驱动器的实际进盘口", [.128, y, -.162], [.19, .045, .05], material.dark)), ...[.13, .255].map(y => rod("软盘口外侧可转动的锁盘拨片", [.19, y + .017, -.19], [.215, y - .012, -.19], .009, material.steel)),
    box("打开后铺在前方的可拆键盘盖", [0, .035, -.335], [.52, .03, .32], material.dark), ...keys([0, .0535, -.34], .43, .23, 4, 10), rod("键盘盖在机身下缘的真实铰接轴", [-.24, .035, -.175], [.24, .035, -.175], .01),
    ...[-1, 1].map(side => rod("手提箱顶把的两端支耳", [side * .11, .34, 0], [side * .11, .39, 0], .015)), rod("方便搬运整机的上提把", [-.11, .39, 0], [.11, .39, 0], .022, material.dark),
    ...bars("机身侧壁实际分开的散热片", 5, [.269, .2, .03], .18, [.014, .1, .015], 2, material.dark),
  ] },
  { name: "楔面键盘一体家用计算机", theme: "现代", build: () => [
    plate("键盘与主板共处的连续楔形电脑本体", [0, 0, 0], [[-.13, 0], [.13, 0], [.13, .035], [-.13, .105]], .46, material.dark, [0, 90, 0]), ...keys([0, .07, -.015], .4, .17, 4, 10, -15),
    box("键盘后缘独立的长条功能键区", [0, .101, .105], [.42, .009, .026], material.steel), ...bars("整机后侧的真实扩展接口", 4, [0, .047, .136], .34, [.052, .022, .014], 0, material.steel), box("主板从侧面伸出的长卡带插槽", [.235, .056, .045], [.014, .014, .075], material.wood),
    ...[-1, 1].map(side => cylinder("侧边的电源及复位小旋钮", [side * .2345, .035, -.07], [.017, .01, .017], material.steel, [0, 0, 90])),
  ] },
  { name: "弧背显像管一体电脑", theme: "现代", build: () => [
    plate("把主机和显像管收在同体内的弧背厚壳", [0, 0, 0], [[.19, .045], [.19, .44], [.08, .48], [-.12, .46], [-.23, .34], [-.24, .12], [-.16, .045]], .4, material.ivory, [0, 90, 0]), box("电脑底下分开的宽承脚", [0, .025, .01], [.34, .05, .3], material.dark),
    box("前上方带厚玻璃的显像管电脑屏面", [0, .302, -.199], [.314, .245, .018], material.glass), box("屏下内置的软盘驱动器口", [0, .117, -.2], [.185, .018, .025], material.dark), cylinder("驱动器右侧实际的弹盘按钮", [.12, .117, -.214], [.018, .009, .018], material.steel, [90, 0, 0]),
    box("独立于一体机前方的有线键盘底壳", [0, .016, -.33], [.4, .032, .17], material.dark), ...keys([0, .0355, -.33], .35, .12, 4, 10), cord("键盘接回一体电脑的短连接线", [[.19, .017, -.3], [.25, .012, -.21], [.18, .09, .17]], .005, material.steel),
    ...bars("一体机后上缘的实际通风条", 5, [0, .446, .13], .27, [.012, .016, .035], 0, material.dark),
  ] },
  { name: "半球底座铰臂一体电脑", theme: "现代", build: () => [
    part("把主板与光驱收在半球内的电脑底座", "lathe", material.ivory, [0, 0, 0], [1, 1, 1], [0, 0, 0], { profile: [{ x: 0, y: 0 }, { x: .16, y: 0 }, { x: .16, y: .025 }, { x: .145, y: .078 }, { x: .105, y: .12 }, { x: .045, y: .146 }, { x: 0, y: .146 }] }), cylinder("底座内沿的稳固橡胶圈", [0, .008, 0], [.325, .016, .325], material.dark),
    ball("底座顶端实际的第一球形铰接", [0, .148, 0], [.07, .07, .07], material.steel), rod("从半球底座升起的承重金属臂", [0, .148, 0], [0, .36, .055], .043), ball("承重臂顶端的屏幕万向关节", [0, .36, .055], [.064, .064, .064], material.steel), rod("万向关节与屏背的短接颈", [0, .36, .055], [0, .425, -.025], .033),
    box("悬在半球底座上方的薄一体屏", [0, .465, -.044], [.41, .3, .038], material.ivory), box("面向操作者的液晶显示面", [0, .465, -.066], [.365, .245, .006], material.glass), box("半球前方真实的吸入式光驱口", [0, .055, -.151], [.117, .009, .02], material.dark),
    box("放在前方的低卧键盘", [0, .013, -.29], [.365, .026, .14], material.steel), ...keys([0, .0295, -.29], .325, .096, 4, 10),
  ] },
  { name: "平行四杆下沉屏绘画工作站", theme: "现代", build: () => [
    box("包含运算主机的低卧重底座", [0, .021, .075], [.29, .042, .23], material.dark), ...[-1, 1].flatMap(side => [box("把高低两底铰固定回主机的实际支耳座", [side * .105, .077, .085], [.055, .07, .12], material.dark), rod("下沉屏幕左后平行支链", [side * .105, .042, .12], [side * .105, .36, -.025], .024, material.steel), rod("下沉屏幕左前平行支链", [side * .105, .0965, .045], [side * .105, .4145, -.1], .024, material.steel), rod("双支链末端保持平行的短连杆", [side * .105, .36, -.025], [side * .105, .4145, -.1], .026), cylinder("支链下端的独立回转铰轴", [side * .105, .045, .085], [.065, .055, .065], material.steel, [0, 0, 90])]),
    box("能下沉到绘画角度的宽触控屏本体", [0, .43, -.15], [.665, .46, .035], material.dark, [-55, 0, 0]), box("倾向操作者的实际绘画玻璃面", [0, .4144, -.1609], [.62, .415, .004], material.glass, [-55, 0, 0]),
    rod("吸附在屏侧边的独立绘画笔", [.336, .398, -.137], [.336, .528, -.323], .009, material.steel), ...bars("低卧主机前缘实际的散热口格条", 7, [0, .022, -.044], .22, [.011, .013, .009], 0, material.steel),
  ] },
  { name: "滚纸横梁笔式绘图机", theme: "现代", itemType: "设施", build: () => [
    ...[-1, 1].flatMap(side => [box("滚纸绘图机侧脚的长落地踏座", [side * .64, .035, .01], [.18, .07, .71], material.dark), box("侧脚升至绘图主梁的立柱", [side * .64, .48, .06], [.12, .82, .25], material.steel), box("连接驱纸辊与横梁的侧机壳", [side * .64, .98, .02], [.2, .28, .43], material.ivory)]),
    cylinder("使整页绘图纸前后往复的驱动长辊", [0, .92, 0], [.2, 1.13, .2], material.dark, [0, 0, 90]), rod("在纸宽方向移动笔夹的横向导杆", [-.64, 1.105, -.02], [.64, 1.105, -.02], .035), box("在横向导杆上移动的独立笔夹", [.21, 1.105, -.02], [.11, .09, .1], material.steel), rod("夹持并落到纸面的独立绘图笔", [.21, 1.02, -.065], [.21, 1.23, -.065], .009, material.dark),
    box("横过驱纸辊顶部的实际图纸", [0, 1.022, .045], [1.09, .002, .29], material.ivory), box("从机前垂下的连续图纸", [0, .77, -.101], [1.09, .505, .002], material.ivory), ...[-1, 1].map(side => cylinder("压住纸边且留出笔路的独立压轮", [side * .48, 1.045, 0], [.05, .025, .05], material.steel, [0, 0, 90])),
    box("把换笔盒实际接回左机壳的横向承托座", [-.485, 1.07, .13], [.43, .015, .08], material.steel), ...bars("可以自动换用的独立笔位盒", 6, [-.44, 1.115, .13], .18, [.018, .075, .035], 0, material.dark), ...bars("右侧驱纸与坐标控制键", 3, [.65, 1.127, .03], .2, [.11, .014, .035], 2, material.dark),
  ] },
  // https://files.support.epson.com/docid/cpd5/cpd51065.pdf
  { name: "卷对卷横移喷头宽幅喷墨打印机", theme: "现代", itemType: "设施", build: () => [
    ...[-1, 1].flatMap(side => [box("宽幅喷墨机实际的长条落地脚", [side * .85, .04, 0], [.2, .08, .75], material.dark), box("支承横向打印机身的两根立脚", [side * .85, .5, 0], [.13, .84, .22], material.steel)]), box("跨越工作室纸幅的连续下承梁", [0, .94, .05], [2.14, .2, .4], material.ivory), box("实际托住打印纸面的窄平台", [0, 1.053, -.01], [1.78, .026, .32], material.dark),
    ...[-1, 1].map(side => box("打印机两端的驱动与墨路服务舱", [side * .955, 1.12, .03], [.23, .43, .51], material.ivory)), rod("带动打印滑车横向扫描的独立长导轨", [-.85, 1.24, .015], [.85, 1.24, .015], .025), box("沿纸宽方向行进的独立喷墨滑车", [.27, 1.195, .015], [.25, .13, .21], material.dark), box("滑车下方实际朝向纸面的打印喷嘴排", [.27, 1.117, -.025], [.18, .026, .1], material.steel),
    cylinder("打印机后方的实际原纸放卷", [0, .92, .26], [.22, 1.64, .22], material.ivory, [0, 0, 90]), cylinder("机架前下方主动收卷的纸卷", [0, .31, -.22], [.17, 1.64, .17], material.ivory, [0, 0, 90]), ...[-1, 1].map(side => rod("收纸轴两端实际接到侧立脚的承臂", [side * .85, .31, 0], [side * .85, .31, -.22], .03)),
    plate("从打印平台前缘实际连到收纸卷切点的薄纸", [0, 0, 0], [[.173, 1.068], [.135, .31], [.1335, .31], [.1715, 1.068]], 1.59, material.ivory, [0, 90, 0]), box("实际平铺在打印工作区的连续纸面", [0, 1.068, .017], [1.59, .002, .38], material.ivory), plate("从后纸卷顶切点接入打印工作区的薄纸", [0, 0, 0], [[-.26, 1.03], [-.207, 1.068], [-.207, 1.0665], [-.26, 1.0285]], 1.59, material.ivory, [0, 90, 0]),
    ...Array.from({ length: 4 }, (_, i) => cylinder("在右服务舱中独立竖置的墨盒", [1.045, 1.13, -.12 + i * .09], [.1, .26, .1], [material.dark, material.red, material.wood, material.glass][i]!)), cord("从服务舱向移动喷头供墨的实际软管束", [[.92, 1.24, .18], [.6, 1.38, .18], [.27, 1.24, .09]], .018, material.dark),
  ] },
  // https://www.rolanddg.com/products/printers/versaobject-mo-series
  { name: "真空台面平床紫外喷墨打印机", theme: "现代", itemType: "设施", build: () => [
    ...[-1, 1].flatMap(x => [-1, 1].map(z => box("平床紫外打印机四根独立接地柱脚", [x * 1.15, .38, z * .66], [.14, .76, .14], material.dark))), box("真空床下方连续承载和抽气底盘", [0, .77, 0], [2.55, .06, 1.58], material.steel),
    ...[-1, 1].map(side => box("真空床两边封闭的薄侧壁", [side * 1.26, .82, 0], [.03, .04, 1.58], material.dark)), ...[-1, 1].map(end => box("真空床前后端封闭薄壁", [0, .82, end * .775], [2.55, .04, .03], material.dark)),
    polygon("真正带有吸附小孔且下方连通气腔的平床台面", material.ivory, [[-1.275, -.79], [1.275, -.79], [1.275, .79], [-1.275, .79]], .035, [0, .84, 0], Array.from({ length: 24 }, (_, i): [number, number][] => { const x = (i % 6 - 2.5) * .4, z = (Math.floor(i / 6) - 1.5) * .38; return [[x - .015, z - .015], [x - .015, z + .015], [x + .015, z + .015], [x + .015, z - .015]]; })),
    ...[-1, 1].map(side => rod("供整座打印桥沿床长行进的纵向轨", [side * 1.31, .88, -.75], [side * 1.31, .88, .75], .045)), ...[-1, 1].map(side => box("跨床打印桥两端独立的行进立座", [side * 1.31, 1.075, .13], [.14, .39, .26], material.dark)), box("横跨全床的移动喷印桥梁", [0, 1.27, .13], [2.76, .18, .25], material.ivory), rod("喷印滑车在桥梁前面的水平导杆", [-1.2, 1.22, -.02], [1.2, 1.22, -.02], .025), box("实际面向材料表面的打印头滑车", [.3, 1.15, -.02], [.3, .18, .26], material.dark),
    ...[-1, 1].map(side => rod("把紫外灯模块实际接到滑车两侧的短承臂", [.3 + side * .14, 1.12, -.02], [.3 + side * .22, 1.12, -.02], .025)), ...[-1, 1].map(side => box("喷头两旁实际的紫外固化灯模块", [.3 + side * .22, 1.12, -.02], [.1, .12, .29], material.steel)), ...[-1, 1].map(side => ({ ...box("朝下的紫外固化灯出光面", [.3 + side * .22, 1.057, -.02], [.075, .006, .25], material.glass), emissive: material.glass, emissiveIntensity: .25 })),
    box("床底独立的真空抽气泵盒", [.65, .38, .2], [.52, .49, .47], material.dark), ...[-1, 1].map(side => box("抽气泵盒独立接地的减振长支脚", [.65 + side * .18, .0675, .2], [.065, .135, .36], material.steel)), cord("泵盒与台下气腔相通的实际粗管", [[.65, .625, .2], [.79, .69, .2], [.79, .8, .2]], .04, material.steel),
  ] },
  // 45度框架与循环构建带改变整机的运动链，没有把普通床式FDM只换喷头。
  // https://www.creality.com/products/creality-cr-30-3d-printer
  { name: "倾斜连续带熔丝三维打印机", theme: "现代", build: () => [
    box("连续带打印机完整的落地低机床", [0, .05, 0], [.52, .1, .88], material.dark), ...[-1, 1].map(end => cylinder("循环构建带两端真实驱动辊", [0, .13, end * .37], [.12, .39, .12], material.steel, [0, 0, 90])), box("支承长打印件的上层循环构建带", [0, .192, 0], [.36, .004, .74], material.wood), box("从机床下方返回的连续带底面", [0, .068, 0], [.36, .004, .74], material.wood),
    ...[-1, 1].flatMap(side => [rod("以四十五度上升的两根实际打印门架", [side * .22, .14, .3], [side * .22, .76, -.32], .035, material.steel), rod("门架后方独立的稳定斜撑", [side * .22, .1, -.38], [side * .22, .76, -.32], .025), box("在斜门架上行进的独立横梁滑座", [side * .22, .53, -.09], [.06, .075, .075], material.dark)]), rod("斜架左右滑座之间的喷头扫描横梁", [-.22, .53, -.09], [.22, .53, -.09], .03),
    box("横梁上的熔丝挤出头", [.06, .49, -.05], [.09, .1, .09], material.ivory), cone("朝向构建带的斜置热端喷嘴", [.06, .425, .015], [.025, .035, .025], material.steel, [135, 0, 0]),
    part("轴向真实对准侧横轴的完整带边耗材盘", "lathe", material.steel, [.32, .26, .15], [1, 1, 1], [0, 0, 90], { profile: [{ x: .0085, y: -.025 }, { x: .12, y: -.025 }, { x: .12, y: -.015 }, { x: .06, y: -.015 }, { x: .06, y: .015 }, { x: .12, y: .015 }, { x: .12, y: .025 }, { x: .0085, y: .025 }, { x: .0085, y: -.025 }] }), cylinder("盘边之间实际绕成的熔丝耗材", [.32, .26, .15], [.18, .027, .18], material.dark, [0, 0, 90]), rod("打印机侧边支承耗材盘的实际横轴", [.22, .26, .15], [.32, .26, .15], .018), cord("从侧方耗材盘进入挤出头的送丝管", [[.32, .35, .15], [.3, .68, .1], [.06, .55, -.05]], .0045, material.glass),
  ] },
  // https://www.klipper3d.org/Kinematics.html
  { name: "三塔并联臂熔丝三维打印机", theme: "现代", build: () => {
    const points = Array.from({ length: 3 }, (_, i): [number, number] => { const a = i * Math.PI * 2 / 3; return [Math.cos(a) * .31, Math.sin(a) * .31]; });
    const result: ModelPart[] = [polygon("三塔打印机完整三角形落地机舱", material.dark, points, .11), polygon("三座竖塔共同相连的三角顶框", material.steel, points, .035, [0, .91, 0]), cylinder("中央可直接接近的圆形打印热床", [0, .1225, 0], [.38, .025, .38], material.ivory), cylinder("三条并联臂共同支承的活动打印平台", [0, .36, 0], [.12, .035, .12], material.dark), box("活动平台下实际的熔丝打印头", [0, .32, 0], [.055, .045, .055], material.steel), cone("朝下的细热端喷嘴", [0, .285, 0], [.022, .025, .022], material.wood, [180, 0, 0])];
    for (let i = 0; i < 3; i++) { const a = i * Math.PI * 2 / 3, x = Math.cos(a), z = Math.sin(a); result.push(box("实际分开的三根垂直导向塔", [x * .25, .51, z * .25], [.045, .8, .045], material.steel), box("沿导向塔升降的独立滑车", [x * .25, .68, z * .25], [.075, .1, .075], material.dark), ...[-1, 1].map(side => rod("保持中央打印平台姿态的成对并联连杆", [x * .25 + z * side * .022, .68, z * .25 - x * side * .022], [x * .052 + z * side * .022, .3775, z * .052 - x * side * .022], .012, material.ivory))); }
    result.push(cord("从顶部进入活动喷头的独立送丝管", [[0, .945, 0], [.08, .74, .08], [0, .38, 0]], .005, material.glass));
    return result;
  } },
  // https://www.elegoo.com/pages/elegoo-saturn-4-ultra
  { name: "液槽翻板光固化三维打印机", theme: "现代", build: () => [
    box("光固化打印机的独立低卧光机底座", [0, .075, 0], [.37, .15, .39], material.dark), ...[-1, 1].map(side => box("翻槽铰轴实际固定回光机底座的轴耳", [side * .17, .168, -.04], [.025, .036, .035], material.steel)), ...[-1, 1].map(side => rod("树脂槽两侧真实的翻槽铰接轴", [side * .17, .18, -.04], [side * .13, .18, -.04], .012)), box("槽下真正向上透光的液晶曝光屏", [0, .16175, -.04], [.26, .0235, .18], material.glass),
    { ...box("盛液槽底部实际的透明离型薄膜", [0, .175, -.04], [.28, .003, .2], material.glass), opacity: .3 }, ...[-1, 1].map(side => box("实际可绕侧轴翻动的树脂槽侧壁", [side * .14, .201, -.04], [.016, .055, .21], material.steel)), ...[-1, 1].map(end => box("树脂槽前后密封端壁", [0, .201, -.04 + end * .1], [.29, .055, .016], material.steel)), { ...box("槽内薄层的光敏树脂液面", [0, .193, -.04], [.265, .008, .185], material.wood), opacity: .6 },
    box("打印机后方实际的独立升降竖轨", [0, .4025, .15], [.07, .505, .055], material.steel), box("沿后竖轨升降的实际构建平台滑座", [0, .43, .15], [.11, .095, .09], material.dark), rod("从后滑座悬至构建平台中部的实际承臂", [0, .43, .15], [0, .43, -.04], .035), rod("承臂下降连接构建台的独立细杆", [0, .43, -.04], [0, .365, -.04], .025), box("从树脂槽向上提升的实际构建板", [0, .3525, -.04], [.25, .025, .17], material.steel),
    { ...box("罩住构建区而保留实际机构可见性的透明防护罩", [0, .402, 0], [.365, .5, .385], material.glass), opacity: .14 }, box("基座前方实际的程序控制窗", [0, .075, -.201], [.17, .065, .012], material.glass),
  ] },
  { name: "影院长灯箱落地胶片放映机", theme: "现代", itemType: "设施", build: () => [
    box("影院放映机抗振落地底盘", [0, .07, .15], [.67, .14, .83], material.dark), box("内有传动电机的高放映机柱", [0, .65, .19], [.4, 1.16, .54], material.steel), box("带片门与间歇机构的实际前机头", [0, 1.39, -.06], [.36, .49, .31], material.dark),
    part("向后延伸且外形完整的长弧光灯箱", "lathe", material.ivory, [0, 1.42, .4], [1, 1, 1], [90, 0, 0], { profile: [{ x: .09, y: -.33 }, { x: .22, y: -.27 }, { x: .26, y: -.13 }, { x: .26, y: .22 }, { x: .19, y: .33 }, { x: .09, y: .33 }, { x: .08, y: .3 }, { x: .17, y: .3 }, { x: .23, y: .2 }, { x: .23, y: -.13 }, { x: .2, y: -.25 }, { x: .08, y: -.3 }, { x: .09, y: -.33 }] }),
    ...optic([0, 1.42, -.33], .09, .25), ...[-1, 1].flatMap(side => [rod("上供片与下收片盘的独立长承臂", [0, 1.39 + side * .17, -.14], [0, 1.39 + side * .58, -.3], .045), ...reel([0, 1.39 + side * .58, -.32], .23)]),
    cord("从上供片盘穿过片门到下收片盘的实际带路", [[0, 1.89, -.31], [.13, 1.67, -.31], [.05, 1.49, -.31], [.05, 1.32, -.31], [.13, 1.12, -.31], [0, .9, -.31]], .009, material.wood), ...[1.64, 1.15].map(y => cylinder("放映片门前后独立的有齿送片轮", [.13, y, -.31], [.07, .035, .07], material.steel, [90, 0, 0])),
    cylinder("机头侧边可以手动盘车的完整手轮", [.205, 1.36, .0], [.15, .035, .15], material.steel, [0, 0, 90]), box("从灯箱后部向上排热的实际烟道", [0, 1.78, .5], [.2, .3, .2], material.dark),
  ] },
  // 片幅横向通过带滚环转子的片门，机器保留实际水平转子与长灯箱。
  // https://collection.sciencemuseumgroup.org.uk/objects/co8090394/imax-rolling-loop-cine-projector-1982
  { name: "横向滚环大画幅影院放映机", theme: "现代", itemType: "设施", build: () => [
    box("横滚环放映机完整落地宽底盘", [0, .07, .12], [1.14, .14, 1.54], material.dark), ...[-1, 1].map(side => box("支承重型滚环片门的两侧承重柜", [side * .38, .51, .08], [.3, .88, 1.18], material.steel)), box("滚环与真空片门共用的精密机床", [0, .99, .03], [1.11, .12, .99], material.ivory),
    cylinder("在水平面运转并连续推出胶片滚环的实际转子", [.12, 1.13, .0], [.46, .15, .46], material.dark), cylinder("转子中心实际的竖直驱动轴毂", [.12, 1.25, .0], [.12, .11, .12], material.steel),
    polygon("沿转子外侧绕行且保留出入缺口的真实胶片带", material.wood, [...Array.from({ length: 14 }, (_, i): [number, number] => { const a = (-130 + i * 20) * Math.PI / 180; return [.12 + Math.sin(a) * .252, Math.cos(a) * .252]; }), ...Array.from({ length: 14 }, (_, i): [number, number] => { const a = (130 - i * 20) * Math.PI / 180; return [.12 + Math.sin(a) * .25, Math.cos(a) * .25]; })], .07, [0, 1.13, 0]),
    ...[-1, 1].flatMap(side => [cylinder("横向片带进出主片门的独立导片轮", [side * .38, 1.17, -.15], [.09, .08, .09], material.steel), box("导片轮实际固定回机床的短轴座", [side * .38, 1.0875, -.15], [.1, .075, .1], material.dark)]),
    box("转子左切线方向的真空吸附精密片门", [-.14, 1.1825, -.05], [.07, .265, .3], material.steel), ...optic([-.14, 1.2, -.48], .11, .37), box("托住前方长物镜的实际镜座", [-.14, 1.045, -.49], [.21, .09, .33], material.steel),
    box("沿横向片门后方布置的独立长弧光灯舱", [-.14, 1.2, .64], [.68, .43, .71], material.ivory), cylinder("灯舱后方独立的排热风管", [-.14, 1.6, .75], [.2, .37, .2], material.dark), box("机柱前方放映控制程序窗", [.38, .78, -.527], [.22, .17, .04], material.glass),
  ] },
  { name: "三镜头转塔显像管电视摄像机", theme: "现代", itemType: "设施", build: () => [
    ...Array.from({ length: 3 }, (_, i) => { const a = i * Math.PI * 2 / 3; return rod("老式电视摄影头实际的落地三脚支腿", [0, .93, .03], [Math.cos(a) * .45, .025, .03 + Math.sin(a) * .45], .05, material.dark); }), cylinder("三脚架上升到俯仰头的中心柱", [0, 1.07, .03], [.09, .53, .09], material.steel), box("支承摄像机头的俯仰齿轮座", [0, 1.37, .03], [.23, .24, .26], material.dark),
    plate("内置长成像管的整体厚摄像机身", [0, 1.62, .0], [[-.37, -.13], [.31, -.13], [.31, .13], [.2, .19], [-.26, .19], [-.37, .08]], .34, material.ivory, [0, 90, 0]),
    frontPanel("转塔上三处真实通光孔的厚转盘", material.dark, [0, 1.62, -.31], Array.from({ length: 18 }, (_, i): [number, number] => [Math.cos(i * Math.PI / 9) * .19, Math.sin(i * Math.PI / 9) * .19]), Array.from({ length: 3 }, (_, i): [number, number][] => { const a = i * Math.PI * 2 / 3; return Array.from({ length: 10 }, (_, j): [number, number] => [Math.cos(a) * .105 + Math.cos(-j * Math.PI / 5) * .048, Math.sin(a) * .105 + Math.sin(-j * Math.PI / 5) * .048]); }), .025),
    ...Array.from({ length: 3 }, (_, i) => { const a = i * Math.PI * 2 / 3, length = [.13, .22, .3][i]!; return optic([Math.cos(a) * .105, 1.62 + Math.sin(a) * .105, -.335 - length / 2], .052, length); }).flat(), cylinder("切换物镜转塔的真实中心轴帽", [0, 1.62, -.355], [.045, .04, .045], material.steel, [90, 0, 0]),
    box("机身后方独立的小取景器", [0, 1.84, .26], [.16, .11, .15], material.dark), cylinder("取景器后端的真实观察眼杯", [0, 1.84, .357], [.075, .045, .075], material.dark, [90, 0, 0]), rod("从俯仰头延伸到操作者的长摇把", [.09, 1.37, .15], [.2, 1.23, .64], .022, material.dark),
  ] },
  // 三条胶片由两条光路曝光：一路单片，另一路红蓝叠片，不把三片误画成三个分色片门。
  // https://www.eastman.org/technicolor/technology/three-strip-camera
  { name: "分色棱镜三片彩色电影摄影机", theme: "现代", itemType: "设施", build: () => [
    ...Array.from({ length: 3 }, (_, i) => { const a = i * Math.PI * 2 / 3; return rod("承托重型分色摄影机的真实三脚支腿", [0, 1.13, .04], [Math.cos(a) * .49, .03, .04 + Math.sin(a) * .49], .065, material.dark); }), cylinder("摄影三脚架的短升降中柱", [0, 1.22, .04], [.11, .46, .11]), box("三片分色摄影头的宽云台承板", [0, 1.5, .04], [.49, .1, .44], material.dark),
    box("三片分色摄影机底部整体承床", [0, 1.58, .01], [.61, .06, .54], material.steel), box("分色摄影头真实的后机壁", [0, 1.8, .26], [.61, .44, .04], material.ivory), ...[-1, 1].map(side => box("左右独立机翼保留内部光路空间的侧壁", [side * .29, 1.8, .01], [.03, .44, .54], material.ivory)),
    plate("位于入光主轴且把光路折向侧片门的分色棱镜", [0, 1.78, -.03], [[-.055, -.055], [.055, -.055], [0, .055]], .12, material.glass, [-90, 0, 0]), { ...box("棱镜内部把一部分光折向侧面的实际半反射面", [0, 1.78, -.03], [.002, .11, .14], material.glass, [0, 45, 0]), opacity: .4 }, rod("分色棱镜实际固定回底床的下承座", [0, 1.61, -.03], [0, 1.72, -.03], .025), frontPanel("把主镜筒固定回机床且真实通光的前标准架", material.ivory, [0, 1.61, -.26], [[-.14, 0], [.14, 0], [.14, .34], [-.14, .34]], [Array.from({ length: 12 }, (_, i): [number, number] => [Math.cos(-i * Math.PI / 6) * .075, .17 + Math.sin(-i * Math.PI / 6) * .075])], .028), ...optic([0, 1.78, -.408], .085, .24),
    box("直通主光轴后方的单片曝光片门", [0, 1.78, .13], [.13, .2, .035], material.dark), rod("单片门实际接回底床的固定支柱", [0, 1.61, .13], [0, 1.78, .13], .025), box("折转光路上承载叠片的唯一侧片门", [.18, 1.78, -.03], [.035, .2, .15], material.dark), rod("侧叠片门实际接回底床的固定支柱", [.18, 1.61, -.03], [.18, 1.78, -.03], .025), box("后单片门前实际通过的独立感光胶片", [0, 1.78, .112], [.035, .13, .0015], material.wood), ...[.1605, .162].map(x => box("在同一侧片门内贴合通过的两层真实叠片", [x, 1.78, -.03], [.0015, .13, .035], material.wood)),
    ...[-.2, 0, .2].flatMap(x => [cylinder("上方整片仓内独立的供片大卷筒", [x, 2.12, .04], [.32, .15, .32], material.dark, [0, 0, 90]), rod("片仓实际固定回底床的独立短承架", [x, 1.61, .15], [x, 2.12, .04], .025), cord("由片仓进入单片或叠片门的独立胶片段", [[x, 2.0, -.06], [x, 1.92, -.13], x === 0 ? [0, 1.78, .112] : [x < 0 ? .162 : .1605, 1.78, -.03]], .009, material.wood)]),
    rod("摄影机右侧独立的手动盘车曲柄", [.31, 1.8, .04], [.43, 1.8, .04], .019), rod("盘车曲柄的偏心握柄", [.43, 1.8, .04], [.43, 1.92, .04], .019, material.dark),
  ] },
  { name: "抛物面拾音落地架", theme: "现代", itemType: "设施", build: () => [
    ...Array.from({ length: 3 }, (_, i) => { const a = i * Math.PI * 2 / 3; return rod("抛物面拾音器稳定的落地三脚", [0, .7, .05], [Math.cos(a) * .35, .018, .05 + Math.sin(a) * .35], .032, material.dark); }), rod("从三脚中心升起的拾音反射盘支柱", [0, .5, .05], [0, 1.05, .05], .035),
    rod("反射盘背后实际连接竖柱的安装短颈", [0, 1.05, .05], [0, 1.05, 0], .03), part("把前方声音汇向焦点的真实凹形薄反射盘", "lathe", material.ivory, [0, 1.05, 0], [1, 1, 1], [-90, 0, 0], { profile: [{ x: 0, y: 0 }, { x: .1, y: .01 }, { x: .2, y: .04 }, { x: .3, y: .09 }, { x: .37, y: .14 }, { x: .37, y: .151 }, { x: .296, y: .101 }, { x: .196, y: .051 }, { x: .096, y: .021 }, { x: 0, y: .011 }] }),
    ...Array.from({ length: 3 }, (_, i) => { const a = i * Math.PI * 2 / 3; return rod("反射盘边缘指向焦点的独立薄支条", [Math.cos(a) * .3, 1.05 + Math.sin(a) * .3, -.1], [0, 1.05, -.244], .009, material.dark); }), cylinder("恰处在反射盘前方焦点的实际拾音胶囊", [0, 1.05, -.247], [.04, .08, .04], material.dark, [90, 0, 0]), cord("拾音胶囊沿支架向下的真实信号线", [[0, 1.05, -.25], [.16, .85, -.12], [0, .72, .05], [0, .15, .05]], .005, material.dark),
  ] },
  { name: "球形十二面全向扬声器架", theme: "现代", itemType: "设施", build: () => {
    const result: ModelPart[] = [cylinder("十二面扬声器架实际的宽落地盘", [0, .035, 0], [.53, .07, .53], material.dark), rod("扬声器球体下方真实的升降支柱", [0, .07, 0], [0, 1.12, 0], .045, material.steel)];
    const phi = (1 + Math.sqrt(5)) / 2, scale = .27 / Math.sqrt(3);
    const vertices: Vector3[] = [-1, 1].flatMap(x => [-1, 1].flatMap(y => [-1, 1].map(z => new Vector3(x, y, z))));
    for (const a of [-1, 1]) for (const b of [-1, 1]) vertices.push(new Vector3(0, a / phi, b * phi), new Vector3(a / phi, b * phi, 0), new Vector3(a * phi, 0, b / phi));
    const normals = [-1, 1].flatMap(a => [-1, 1].flatMap(b => [new Vector3(0, a * phi, b), new Vector3(a, 0, b * phi), new Vector3(a * phi, b, 0)]));
    for (const normal of normals) {
      normal.normalize(); const distance = Math.max(...vertices.map(v => v.dot(normal))), points = vertices.filter(v => Math.abs(v.dot(normal) - distance) < 1e-8), center = normal.clone().multiplyScalar(distance * scale), u = points[0]!.clone().multiplyScalar(scale).sub(center).normalize(), v = u.clone().cross(normal), local = points.map(p => p.clone().multiplyScalar(scale).sub(center)).map(p => [p.dot(u), p.dot(v)] as [number, number]);
      local.sort((a, b) => Math.atan2(a[1], a[0]) - Math.atan2(b[1], b[0])); const euler = new Euler().setFromRotationMatrix(new Matrix4().makeBasis(u, normal, v)), rotation: Triple = [euler.x, euler.y, euler.z].map(value => value * 180 / Math.PI) as Triple, position: Triple = [center.x, 1.37 + center.y, center.z];
      const frame = polygon("十二面球体每一面真正通孔的五边形音箱壳", material.steel, local, .009, position, [Array.from({ length: 12 }, (_, i): [number, number] => [Math.cos(-i * Math.PI / 6) * .09, Math.sin(-i * Math.PI / 6) * .09])]); frame.rotation = { x: rotation[0], y: rotation[1], z: rotation[2] };
      result.push(frame, part("每个五边形中独立朝外的扬声器锥盆", "lathe", material.dark, position, [1, 1, 1], rotation, { profile: [{ x: 0, y: -.014 }, { x: .035, y: -.014 }, { x: .087, y: .006 }, { x: .098, y: .006 }, { x: .098, y: .014 }, { x: .087, y: .014 }, { x: .033, y: -.006 }, { x: 0, y: -.006 }] }));
    }
    return result;
  } },
  // https://www.lansche-audio.com/products/plasmatweeter/
  { name: "等离子离子高音扬声器", theme: "现代", build: () => [
    box("等离子高音扬声器独立的高频电源底舱", [0, .12, .02], [.32, .24, .37], material.dark), box("从电源箱上升的放电头陶瓷承座", [0, .29, .04], [.13, .1, .16], material.ivory),
    { ...part("放电声源周围真正空心的石英小腔", "lathe", material.glass, [0, .36, .04], [1, 1, 1], [90, 0, 0], { profile: [{ x: .023, y: -.07 }, { x: .032, y: -.07 }, { x: .032, y: .07 }, { x: .023, y: .07 }, { x: .023, y: -.07 }] }), opacity: .3 }, ...[-1, 1].map(side => rod("朝向放电区域且中间留出间隙的双电极", [side * .055, .36, .04], [side * .007, .36, .04], .005, material.steel)),
    part("在放电声源前方真实向外渐扩的短高音号筒", "lathe", material.wood, [0, .36, -.03], [1, 1, 1], [-90, 0, 0], { profile: [{ x: .024, y: 0 }, { x: .033, y: 0 }, { x: .047, y: .06 }, { x: .085, y: .12 }, { x: .14, y: .19 }, { x: .14, y: .2 }, { x: .078, y: .128 }, { x: .04, y: .064 }, { x: .024, y: 0 }] }),
    ...[-1, 1].map(side => cord("放电头两端实际接回底舱的高压绝缘线", [[side * .055, .36, .04], [side * .08, .31, .14], [side * .08, .24, .14]], .008, material.dark)), ...bars("电源机壳后部真实的散热片", 7, [0, .12, .215], .25, [.018, .18, .025], 0, material.steel),
  ] },
  { name: "阶梯开放挡板音箱", theme: "现代", itemType: "设施", build: () => [
    frontPanel("没有封闭后腔且具有真实单元孔的阶梯挡板", material.wood, [0, 0, 0], [[-.34, 0], [.34, 0], [.34, .64], [.24, .64], [.24, 1.0], [.12, 1.0], [.12, 1.27], [-.12, 1.27], [-.12, 1.0], [-.24, 1.0], [-.24, .64], [-.34, .64]], [Array.from({ length: 16 }, (_, i): [number, number] => [Math.cos(-i * Math.PI / 8) * .21, .34 + Math.sin(-i * Math.PI / 8) * .21]), Array.from({ length: 12 }, (_, i): [number, number] => [Math.cos(-i * Math.PI / 6) * .12, .82 + Math.sin(-i * Math.PI / 6) * .12]), Array.from({ length: 10 }, (_, i): [number, number] => [Math.cos(-i * Math.PI / 5) * .062, 1.13 + Math.sin(-i * Math.PI / 5) * .062])], .037),
    ...[[.34, .217], [.82, .127], [1.13, .068]].map(([y, r]) => part("独立装在开放挡板上的真实扬声器单元", "lathe", material.dark, [0, y!, -.04], [1, 1, 1], [90, 0, 0], { profile: [{ x: 0, y: -.01 }, { x: r! * .23, y: -.01 }, { x: r! * .91, y: .035 }, { x: r!, y: .035 }, { x: r!, y: .045 }, { x: r! * .91, y: .045 }, { x: r! * .23, y: 0 }, { x: 0, y: 0 }] })),
    ...[-1, 1].map(side => plate("开放挡板后方完整的三角抗倾支脚", [side * .26, .0, .14], [[-.16, 0], [.17, 0], [-.13, .45]], .045, material.dark, [0, 90, 0])), cord("挡板背后实际连到低音单元的独立音箱线", [[0, .34, .035], [.1, .2, .13], [0, .03, .2]], .006, material.dark),
  ] },
  { name: "单镜头反光照相机", theme: "现代", build: () => [
    box("单反相机主体的薄金属机身", [0, .045, .012], [.143, .09, .052], material.dark), plate("顶部独立的五棱镜取景隆起", [0, .09, .005], [[-.03, 0], [.03, 0], [.023, .025], [0, .04], [-.023, .025]], .05, material.dark, [0, 0, 0]), box("相机右手握持的前凸手柄", [.06, .045, -.018], [.035, .09, .055], material.dark),
    ...optic([-.007, .049, -.0665], .034, .105), loop("镜头前端独立的调焦橡胶环", [-.007, .049, -.096], .035, .005, [90, 0, 0], material.steel), cylinder("顶部模式转盘", [-.049, .096, .008], [.027, .012, .027], material.steel), cylinder("握柄顶端的实际快门钮", [.058, .096, -.024], [.015, .009, .015], material.steel),
    box("机背的实际查看图像屏", [0, .04, .042], [.09, .057, .008], material.glass), box("位于棱镜后端的独立光学眼窗", [0, .103, .035], [.035, .022, .016], material.glass), ...bars("机背侧边分开的实体操作钮", 4, [.059, .046, .045], .052, [.009, .009, .007], 1, material.steel),
  ] },
  { name: "旁轴联动测距胶片相机", theme: "现代", build: () => [
    box("没有反光棱镜隆起的长条胶片机身", [0, .04, 0], [.139, .08, .041], material.wood), box("长条机身上方连续的金属测距顶盖", [0, .084, 0], [.142, .017, .044], material.steel), ...optic([0, .043, -.051], .025, .064),
    box("独立于拍摄镜头的主取景窗", [-.045, .074, -.026], [.028, .018, .008], material.glass), box("长基线另一端实际的测距入光窗", [.047, .074, -.026], [.017, .013, .008], material.glass), box("在中部接收亮框光的独立磨砂窗", [-.007, .075, -.026], [.025, .014, .008], material.ivory),
    cylinder("卷片杆转轴及快门按钮", [.047, .098, 0], [.021, .013, .021], material.dark), rod("沿顶盖转动的真实卷片拨杆", [.047, .098, 0], [.067, .098, .027], .009, material.steel), cylinder("顶盖左侧实际的胶片回卷盘", [-.049, .097, 0], [.027, .01, .027], material.dark),
    ...[-1, 1].map(side => loop("机身左右实际装接的肩带小环", [side * .071, .074, 0], .007, .002, [0, 0, 90], material.steel)), box("从后方实际接近的目镜窗", [-.045, .074, .025], [.023, .017, .008], material.glass),
  ] },
  { name: "腰平取景中画幅单反相机", theme: "现代", build: () => [
    box("带翻转反光镜的中画幅立方机身", [0, .055, 0], [.104, .11, .103], material.dark), box("与机身后方相接的完整卷片后背", [0, .055, .07], [.106, .112, .04], material.steel), ...optic([0, .054, -.095], .036, .087),
    box("机身顶面实际朝上的磨砂取景屏", [0, .113, 0], [.081, .006, .077], material.glass), ...[-1, 1].map(side => box("腰平取景罩实际的两片侧挡板", [side * .045, .144, 0], [.007, .06, .09], material.dark)), box("取景罩前方抬起的遮光板", [0, .151, -.045], [.097, .073, .007], material.dark), box("取景罩后方抬起的薄挡板", [0, .133, .045], [.097, .037, .007], material.dark),
    cylinder("右侧实际的大卷片及上弦手轮", [.061, .062, .01], [.04, .018, .04], material.steel, [0, 0, 90]), cylinder("拍摄镜头下方的独立机械快门钮", [.039, .03, -.057], [.013, .011, .013], material.steel, [90, 0, 0]),
  ] },
  { name: "枪柄超八毫米电影摄影机", theme: "现代", build: () => [
    plate("内置一体胶片盒的扁平超八摄影机身", [0, .19, 0], [[-.1, -.065], [.085, -.065], [.1, .015], [.065, .095], [-.08, .095]], .063, material.ivory, [0, 90, 0]), plate("可以由掌心稳持的后倾枪式握柄", [0, .08, .038], [[-.025, -.08], [.025, -.08], [.04, .082], [-.015, .082]], .042, material.dark, [0, 90, 0]),
    ...optic([0, .202, -.147], .029, .125), cylinder("机身上部实际的长目镜筒", [.047, .259, .056], [.032, .112, .032], material.dark, [90, 0, 0]), cylinder("目镜后端的柔软遮光眼杯", [.047, .259, .119], [.045, .022, .045], material.dark, [90, 0, 0]),
    box("实际靠近食指的拍摄扳机", [0, .124, -.003], [.027, .045, .016], material.red), cylinder("胶片盒侧面的实际剩余长度观察窗", [.035, .203, .015], [.038, .007, .038], material.glass, [0, 0, 90]), ...[-1, 1].map(side => rod("顶部提把实际装接到机顶的独立短支耳", [side * .02, .285, .023], [side * .02, .315, .023], .01)), rod("机身顶面实际的提握短把", [-.02, .315, .023], [.02, .315, .023], .012, material.dark),
  ] },
  { name: "球罩云台监控摄像机", theme: "现代", build: () => [
    cylinder("用于固定到天花或悬臂的真实圆形机盘", [0, .2, 0], [.23, .047, .23], material.ivory), part("向下包住双轴摄像头的空心透明半球罩", "lathe", material.glass, [0, .177, 0], [1, 1, 1], [0, 0, 0], { opacity: .2, profile: [{ x: .096, y: 0 }, { x: .096, y: -.042 }, { x: .076, y: -.087 }, { x: .041, y: -.117 }, { x: 0, y: -.136 }, { x: .045, y: -.125 }, { x: .083, y: -.094 }, { x: .105, y: -.045 }, { x: .105, y: 0 }] }),
    cylinder("从上盘下降的实际方位转轴", [0, .153, 0], [.055, .05, .055], material.dark), rod("把左右俯仰叉架接到方位轴的真实顶横杆", [-.046, .151, 0], [.046, .151, 0], .016), ...[-1, 1].map(side => rod("摄像机俯仰轴两侧的独立叉架", [side * .046, .15, .0], [side * .046, .112, 0], .014)), rod("横贯摄像头实际的俯仰短轴", [-.046, .112, 0], [.046, .112, 0], .013), ball("云台内部可转向的摄像机球头", [0, .112, 0], [.082, .082, .082], material.dark), ...optic([0, .106, -.048], .022, .035),
    ...[-1, 1].map(side => ball("实际位于物镜两侧的红外照明窗", [side * .03, .104, -.036], [.013, .013, .006], material.red)),
  ] },
  { name: "声学耦合调制解调器", theme: "现代", build: () => [
    box("独立声耦合调制解调器实际的低卧电路机箱", [0, .025, 0], [.26, .05, .15], material.wood), ...[-1, 1].map(side => part("可以容纳电话听筒端部且真正开口的橡胶声耦合杯", "lathe", material.dark, [side * .082, .05, -.01], [1, 1, 1], [0, 0, 0], { profile: [{ x: 0, y: 0 }, { x: .04, y: 0 }, { x: .045, y: .046 }, { x: .036, y: .046 }, { x: .03, y: .013 }, { x: 0, y: .013 }] })),
    ...[-1, 1].map(side => cylinder("声耦合杯底部真实分开的发声与拾音小单元", [side * .082, .065, -.01], [.045, .007, .045], material.steel)), box("机箱后方实际的工作指示斜台", [0, .057, .058], [.23, .035, .025], material.steel), ...bars("调制解调器载波与数据状态灯", 4, [0, .078, .058], .14, [.014, .007, .01], 0, material.glass),
    cord("声耦合调制解调器后方实际的数据连接尾线", [[.08, .025, .075], [.11, .013, .15], [.19, .013, .15]], .0045, material.dark), box("尾线末端实际的串行数据接头", [.21, .013, .15], [.04, .022, .037], material.steel),
  ] },
];
