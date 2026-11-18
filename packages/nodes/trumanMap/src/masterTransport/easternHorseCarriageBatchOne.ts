import { Euler, Quaternion, Vector3 } from "three";
import { part, type ModelPart, type Triple } from "../assetModelParts";
import { combineMeshes, tapered } from "../masterNature/shared";
import { plate, cord, piercedPanel } from "../masterObjects/parts";
import { box, cylinder, strut, surface, transportColors, type TransportDefinition } from "./parts";

// 影视常用完整车辆；本地原创米制构造，不用换马、货物、材色或车轮数量扩充主素材。
// 类型参考：https://dyhhl.cn/Index/show/catid/34/id/295.html

export function woodWheel(x: number, z: number, radius: number): ModelPart[] {
  const spokes = Array.from({ length: 12 }, (_, index) => {
    const a = index * Math.PI / 6;
    return tapered("从中空车毂实接外轮牙的木辐", transportColors.wood, [[x, radius + Math.cos(a) * .105, z + Math.sin(a) * .105], [x, radius + Math.cos(a) * (radius - .055), z + Math.sin(a) * (radius - .055)]], [.022, .017]);
  });
  return [
    part("十二辐之间保持真实通空的闭合木轮牙", "lathe", transportColors.wood, [x, radius, z], [1, 1, 1], [0, 0, 90], { profile: [{ x: radius - .085, y: -.065 }, { x: radius - .012, y: -.065 }, { x: radius - .012, y: .065 }, { x: radius - .085, y: .065 }, { x: radius - .085, y: -.065 }] }),
    part("包紧木轮外缘并接地的完整窄铁箍", "lathe", transportColors.dark, [x, radius, z], [1, 1, 1], [0, 0, 90], { profile: [{ x: radius - .016, y: -.068 }, { x: radius, y: -.068 }, { x: radius, y: .068 }, { x: radius - .016, y: .068 }, { x: radius - .016, y: -.068 }] }),
    part("有贯通穿轴孔而两端加厚的车毂", "lathe", transportColors.wood, [x, radius, z], [1, 1, 1], [0, 0, 90], { profile: [{ x: .052, y: -.12 }, { x: .12, y: -.12 }, { x: .134, y: -.045 }, { x: .134, y: .045 }, { x: .12, y: .12 }, { x: .052, y: .12 }, { x: .052, y: -.12 }] }),
    combineMeshes("一只木车轮完整的十二根承力轮辐", transportColors.wood, spokes),
  ];
}

function cartAxle(z: number, radius: number, halfTrack: number): ModelPart[] {
  return [cylinder("穿过两只轮毂中心孔的完整横向车轴", [0, radius, z], [.09, halfTrack * 2 + .30, .09], transportColors.dark, [0, 0, 90]), ...[-1, 1].flatMap(side => [...woodWheel(side * halfTrack, z, radius), cylinder("阻止木轮从轴端脱出的穿轴立销", [side * (halfTrack + .13), radius, z], [.014, .19, .014], transportColors.dark)])];
}

function axleBearing(x: number, y: number, z: number): ModelPart {
  return part("把车架荷载传到横轴且孔内留转动间隙的闭合轴座", "lathe", transportColors.dark, [x, y, z], [1, 1, 1], [0, 0, 90], { profile: [{ x: .052, y: -.085 }, { x: .13, y: -.085 }, { x: .13, y: .085 }, { x: .052, y: .085 }, { x: .052, y: -.085 }] });
}

function barrelShell(name: string, width: number, height: number, y: number, z: number, length: number, color: string): ModelPart {
  const points: [number, number][] = [];
  for (let index = 0; index <= 12; index++) { const a = index * Math.PI / 12; points.push([Math.cos(a) * width / 2, y + Math.sin(a) * height]); }
  for (let index = 12; index >= 0; index--) { const a = index * Math.PI / 12; points.push([Math.cos(a) * (width / 2 - .025), y + Math.sin(a) * (height - .025)]); }
  return plate(name, [0, 0, z], points, length, color, [0, 0, 0]);
}

export const easternHorseCarriageBatchOne: TransportDefinition[] = [
  { name: "双辕弧篷行旅客车", theme: "中式", tags: ["马车", "影视", "畜力车", "完整传统马车", "真实中空弧篷客舱", "单轴木辐轮", "前置驾座与双曲辕"], create: () => {
    const wood = transportColors.wood, cloth = "#b8aa8a";
    const parts: ModelPart[] = [...cartAxle(.22, .7, .975), box("客舱和前驾座共同使用的完整底板", [0, .99, .06], [1.41, .1, 2.6], wood), barrelShell("不封住前后开口的连续薄壁弧形布篷", 1.36, .64, 1.59, .2, 2.18, cloth), box("前置车夫坐台的完整低座箱", [0, 1.18, -1.055], [1.23, .29, .39], wood), box("驾座上表面软垫", [0, 1.345, -1.055], [1.19, .055, .37], "#796a51"), box("双辕之间供车夫落脚的横踏板", [0, .914, -1.47], [1.1, .055, .40], wood), box("舱内供旅客坐卧的低榻", [0, 1.15, .61], [1.18, .22, .91], wood), box("客榻薄垫", [0, 1.2825, .61], [1.13, .045, .87], "#9e9279")];
    const rear: [number, number][] = [[-.65, 1.04], [.65, 1.04], ...Array.from({ length: 13 }, (_, index): [number, number] => [Math.cos(index * Math.PI / 12) * .65, 1.59 + Math.sin(index * Math.PI / 12) * .64])];
    parts.push(piercedPanel("真实开出后窥窗而不填满舱室的薄后壁", [0, 0, 1.27], rear, [[[-.28, 1.35], [.28, 1.35], [.28, 1.8], [-.28, 1.8]]], .035, cloth, [-90, 0, 0]));
    for (const side of [-1, 1]) {
      parts.push(axleBearing(side * .5, .7, .22), box("轴座上方连续承舱长木梁", [side * .5, .86, .08], [.13, .15, 2.75], wood), box("承住弧篷下沿的舱侧薄木围", [side * .65, 1.315, .2], [.055, .56, 2.1], wood), strut("踏板下方接回长梁的真实前伸承臂", [side * .45, .86, -1.15], [side * .45, .86, -1.65], .07, wood), tapered("从舱梁前端向马身两侧上弯的完整双辕", wood, [[side * .5, .86, -.8], [side * .5, .92, -1.7], [side * .48, 1.1, -3.4]], [.055, .052, .043]), plate("门口向两侧收开的厚布半幅门帘", [0, 0, -.885], [[side * .65, 1.05], [side * .31, 1.05], [side * .31, 2.155], [side * .5, 2.02], [side * .65, 1.75]], .012, cloth, [0, 0, 0]));
    }
    const bows = [-.76, .21, 1.18].map(z => tapered("弧篷外侧从侧木围连续跨顶的弯篷骨", wood, Array.from({ length: 13 }, (_, index): Triple => [Math.cos(index * Math.PI / 12) * .68, 1.59 + Math.sin(index * Math.PI / 12) * .64, z]), Array.from({ length: 13 }, () => .012)));
    parts.push(combineMeshes("同一客车的三道完整承篷木骨", wood, bows));
    return parts;
  } },
  { name: "前驾座后笼双辕囚车", theme: "中式", tags: ["马车", "影视", "畜力车", "完整古装囚车", "真实高笼与后门", "单轴木辐轮", "连杆制动与前驾座"], create: () => {
    const wood = "#896b4d", iron = transportColors.dark;
    const parts: ModelPart[] = [...cartAxle(.3, .74, 1.04), box("从驾座贯通后笼舱的完整车底板", [0, 1.02, .08], [1.45, .12, 2.7], wood), box("后笼上方不压低门洞的厚木顶板", [0, 2.76, .48], [1.5, .1, 1.93], wood), box("笼前独立的车夫座箱", [0, 1.24, -.95], [1.22, .32, .42], wood), box("车夫座箱上实接的低靠板", [0, 1.55, -.724], [1.22, .43, .06], wood), box("车夫前方脚踏底板", [0, .93, -1.4], [1.08, .07, .38], wood)];
    const fixedBars: ModelPart[] = [];
    for (const side of [-1, 1]) {
      parts.push(axleBearing(side * .5, .74, .3), box("囚车底板下与轴座相接的承笼长梁", [side * .5, .9, .04], [.15, .17, 2.85], wood), tapered("从驾座下方前伸上弯的完整囚车双辕", wood, [[side * .49, .9, -.8], [side * .49, 1.02, -2], [side * .46, 1.12, -3.4]], [.06, .055, .045]), strut("脚踏板接回底梁的木托", [side * .44, .9, -1.05], [side * .44, .88, -1.56], .08, wood), box("紧接笼顶和地板的侧上横框", [side * .65, 2.66, .48], [.075, .11, 1.82], wood), box("笼侧下横框", [side * .65, 1.15, .48], [.075, .12, 1.82], wood));
      for (const z of [-.36, 1.32]) parts.push(box("囚笼四角从底板直达顶盖的通高实柱", [side * .64, 1.90, z], [.075, 1.64, .075], wood));
      for (let index = 0; index < 8; index++) fixedBars.push(tapered("侧壁每根独立贯入上下横框的铁笼条", iron, [[side * .65, 1.15, -.25 + index * .21], [side * .65, 2.66, -.25 + index * .21]], [.016, .016]));
    }
    for (let index = 0; index < 7; index++) fixedBars.push(tapered("将后笼与前驾座隔开的独立竖铁条", iron, [[-.54 + index * .18, 1.15, -.36], [-.54 + index * .18, 2.66, -.36]], [.016, .016]));
    parts.push(combineMeshes("完整囚笼三面真正通透的固定铁条", iron, fixedBars), ...[1.15, 2.66].map(y => box("后门上下独立横框", [0, y, 1.37], [1.22, .075, .05], wood)), ...[-1, 1].map(side => box("后门两侧独立立框", [side * .59, 1.905, 1.37], [.055, 1.51, .05], wood)));
    const doorBars = Array.from({ length: 7 }, (_, index) => tapered("封闭后门上贯入门框而不封死视线的铁条", iron, [[-.49 + index * .1633, 1.15, 1.37], [-.49 + index * .1633, 2.66, 1.37]], [.016, .016]));
    parts.push(combineMeshes("一扇完整独立后门的七根竖笼条", iron, doorBars), ...[1.4, 2.42].map(y => cylinder("后门左边与固定角柱共用的短合页轴", [-.62, y, 1.345], [.035, .13, .035], iron)), box("由后门伸入右门柱的完整横门闩", [.39, 1.94, 1.416], [.57, .055, .045], iron), box("承接横门闩且接回固定右柱的闩座", [.655, 1.94, 1.38], [.075, .12, .1], iron), strut("驾座右侧接回底梁的手制动长杆", [.8, .86, .35], [.8, 1.48, -.16], .035, iron), cylinder("手制动长杆的实际横向支点", [.65, .86, .35], [.07, .36, .07], iron, [0, 0, 90]), strut("从制动手杆传到后制动横梁的连杆", [.8, .88, .33], [.8, .8, 1.12], .025, iron), box("两轮之间联接制动木块的完整横梁", [0, .8, 1.12], [2.12, .085, .095], wood));
    for (const side of [-1, 1]) parts.push(box("在轮缘后部制动车轮的木刹块", [side * 1.04, .8, 1.10], [.11, .21, .12], wood), strut("后制动横梁接回车架的短承臂", [side * .5, .9, .88], [side * .8, .8, 1.12], .045, iron));
    return parts;
  } },
  { name: "后铰升斗畜力卸粮车", theme: "中式", tags: ["马车", "影视", "畜力车", "完整传统翻斗货车", "真实空斗与尾闸", "后横铰轴及倾斗撑杆", "单轴双辕"], create: () => {
    const wood = transportColors.wood;
    const parts: ModelPart[] = [...cartAxle(0, .72, 1.05), cylinder("货斗绕其翻转且接在后架上的完整横铰轴", [0, .98, .72], [.07, 1.42, .07], transportColors.dark, [0, 0, 90])];
    for (const side of [-1, 1]) parts.push(axleBearing(side * .54, .72, 0), box("翻斗下方保持不动的完整底梁", [side * .54, .85, -.10], [.16, .16, 2.25], wood), box("从底梁真正承到后横铰轴的独立铰座", [side * .54, .93, .72], [.18, .19, .18], wood), tapered("从固定底梁向前弯出的完整牵引双辕", wood, [[side * .5, .85, -.6], [side * .49, .94, -1.6], [side * .47, 1.08, -3.2]], [.06, .052, .043]));
    const tipping: ModelPart[] = [box("四壁之间真正承粮的整块窄斗底", [0, 1, -.1], [.92, .055, 1.7], wood)];
    for (const side of [-1, 1]) tipping.push(surface("由窄斗底向外张开而有真实厚度的整面斗侧壁", wood, [[side * .46, .99, -.95], [side * .46, .99, .75], [side * .78, 1.83, .98], [side * .78, 1.83, -1.22]], [0, 1, 2, 0, 2, 3]), strut("斗侧上缘连续承受侧向压力的包边木", [side * .78, 1.83, -1.22], [side * .78, 1.83, .98], .065, wood), ...[-.75, .35].map(z => strut("从斗底连到上口的外侧承力斗箍", [side * .47, 1.01, z], [side * .79, 1.83, z], .045, transportColors.dark)));
    tipping.push(surface("从窄斗底向前斜张的完整前挡粮板", wood, [[-.46, .99, -.95], [.46, .99, -.95], [.78, 1.83, -1.22], [-.78, 1.83, -1.22]], [0, 1, 2, 0, 2, 3]), surface("独立接在后口且不填满整个货斗的尾闸板", wood, [[-.46, .99, .75], [.46, .99, .75], [.78, 1.83, .98], [-.78, 1.83, .98]], [0, 1, 2, 0, 2, 3]), cylinder("尾闸板下缘与斗底共用的横向铰轴", [0, .995, .75], [.035, 1.01, .035], transportColors.dark, [0, 0, 90]));
    for (const side of [-1, 1]) tipping.push(strut("两侧锁住尾闸而实际接到斗沿的短扣杆", [side * .73, 1.72, .94], [side * .81, 1.81, .94], .03, transportColors.dark));
    const turn = new Quaternion().setFromEuler(new Euler(14 * Math.PI / 180, 0, 0));
    for (const value of tipping) {
      const p = new Vector3(value.position.x, value.position.y - .98, value.position.z - .72).applyQuaternion(turn);
      value.position = { x: p.x, y: p.y + .98, z: p.z + .72 };
      const local = new Quaternion().setFromEuler(new Euler(value.rotation.x * Math.PI / 180, value.rotation.y * Math.PI / 180, value.rotation.z * Math.PI / 180));
      const facing = new Euler().setFromQuaternion(turn.clone().multiply(local));
      value.rotation = { x: facing.x * 180 / Math.PI, y: facing.y * 180 / Math.PI, z: facing.z * 180 / Math.PI };
    }
    parts.push(...tipping, strut("从固定下架撑住上翻斗底的真实斜撑", [0, .85, -.60], [0, 1.37, -.89], .075, wood), box("将倾斗斜撑下根接到两侧底梁的宽横托", [0, .85, -.6], [1.2, .10, .15], wood), cylinder("翻斗锁销与底梁相接的横销", [0, .92, -.94], [.045, 1.13, .045], transportColors.dark, [0, 0, 90]));
    return parts;
  } },
  { name: "长脊双鞍架运木大车", theme: "中式", tags: ["马车", "影视", "畜力车", "完整畜力运木车", "长脊空载鞍架", "前第五轮转向轴架", "后承重木轴"], create: () => {
    const wood = "#94724f", iron = transportColors.dark;
    const parts: ModelPart[] = [...cartAxle(-1.7, .58, 1), ...cartAxle(2, .77, 1.1), box("前轮轴上承住转盘的完整木枕", [0, .695, -1.7], [1.35, .18, .30], wood), cylinder("穿过上下转盘且接到长脊的真实第五轮立销", [0, .86, -1.7], [.10, .41, .10], iron), part("前轮轴架上固定的下转向承盘", "lathe", iron, [0, .77, -1.7], [1, 1, 1], [0, 0, 0], { profile: [{ x: .055, y: 0 }, { x: .35, y: 0 }, { x: .35, y: .065 }, { x: .055, y: .065 }, { x: .055, y: 0 }] }), part("接住上部双长梁的上转向承盘", "lathe", wood, [0, .84, -1.7], [1, 1, 1], [0, 0, 0], { profile: [{ x: .055, y: 0 }, { x: .35, y: 0 }, { x: .35, y: .06 }, { x: .055, y: .06 }, { x: .055, y: 0 }] }), tapered("与前轴架连为一体而可随第五轮摆转的长曲辕", wood, [[0, .70, -1.7], [0, .83, -2.8], [0, 1.01, -4.25]], [.075, .065, .052]), box("曲辕前方横向系驾承力木", [0, 1.01, -4.18], [1.5, .09, .11], wood)];
    for (const side of [-1, 1]) {
      parts.push(axleBearing(side * .38, .77, 2), box("没有平板货箱的贯通长脊承木梁", [side * .38, .99, .15], [.13, .19, 5], wood), strut("前转轴架与长曲辕根部的对角联系木", [side * .58, .70, -1.7], [0, .78, -2.4], .065, wood));
      for (const z of [-1.55, 2]) parts.push(strut("鞍枕两端上张而可挡住滚木的粗木桩", [side * .7, 1.14, z], [side * .97, 1.72, z], .105, wood), strut("上张木桩下方直接回到车脊的斜撑", [side * .38, 1.04, z - .20], [side * .90, 1.57, z], .07, wood));
    }
    for (const z of [-1.55, 2]) parts.push(box("两端独立承托长木而中间保持通空的横鞍枕", [0, 1.15, z], [1.62, .16, .29], wood), cord("空载时仍系在两侧桩根之间的完整束木索", [[-.9, 1.60, z], [-.5, 1.27, z], [0, 1.19, z], [.5, 1.27, z], [.9, 1.60, z]], .018, "#c1ae88"));
    return parts;
  } },
];
