import { part, type ModelPart, type Triple } from "../assetModelParts";
import { box, cylinder, ball, loop, rod, cord, cup, material, type MasterPrototype } from "./parts";
import { createMarinePropellerParts } from "../masterTransport/marineEquipmentModels";
import { Euler, Quaternion, Vector3 } from "three";
import { sweptProfile } from "../masterNature/shared";

export function openPipe(name: string, start: Triple, end: Triple, radius: number, wall = .006): ModelPart {
  const value: ModelPart = rod(name, start, end, radius * 2);
  const half = Math.hypot(end[0] - start[0], end[1] - start[1], end[2] - start[2]) / 2;
  value.shape = "lathe";
  value.scale = { x: 1, y: 1, z: 1 };
  value.profile = [{ x: radius, y: -half }, { x: radius, y: half }, { x: radius - wall, y: half }, { x: radius - wall, y: -half }, { x: radius, y: -half }];
  return value;
}

function floatPair(width: number, length: number): ModelPart[] {
  return [-1, 1].flatMap(side => [box("封闭独立浮筒中段", [side * width / 2, .24, 0], [.34, .35, length], material.glass), ...[-1, 1].map(end => ball("浮筒前后圆钝密封端", [side * width / 2, .24, end * length / 2], [.34, .35, .32], material.glass))]);
}

function hopper(name: string, position: Triple, radius: number, height: number): ModelPart {
  return part(name, "lathe", material.steel, position, [1, 1, 1], [0, 0, 0], { profile: [{ x: .065, y: 0 }, { x: radius, y: height * .5 }, { x: radius, y: height }, { x: radius - .008, y: height }, { x: radius - .008, y: height * .5 + .004 }, { x: .057, y: .008 }, { x: .057, y: 0 }, { x: .065, y: 0 }] });
}

// 原创设备造型，仅参照通用机构：FAO养殖增氧章节、Faivre活鱼分级/输送设备与Lely自动挤奶说明。
// https://www.fao.org/4/x5744e/x5744e0m.htm
// https://www.faivre-aqua.fr/en/packs/standard-grading-pack-series-60/
// https://www.lelyna.com/us/solutions/milking/astronaut/
export const husbandryEquipmentBatchOneObjects: MasterPrototype[] = [
  { name: "双浮筒横轴水车式养殖增氧机", build: () => {
    const parts: ModelPart[] = [...floatPair(1.96, 1.62), ...[-1, 1].map(side => rod("跨在双浮筒上方的横向主机承梁", [-1.03, .43, side * .43], [1.03, .43, side * .43], .06)), rod("贯穿左右水车叶轮的共同横轴", [-1.07, .46, 0], [1.07, .46, 0], .045), box("中央封闭减速齿轮箱", [0, .6, 0], [.33, .3, .32], material.steel), cylinder("安装在减速箱上的直立驱动电机", [0, .87, 0], [.25, .27, .25], material.dark), ...[-1, 1].map(side => box("横轴两端独立密封轴承座", [side * .99, .46, 0], [.13, .11, .16]))];
    for (const side of [-1, 1]) {
      parts.push(loop("水车桨片的透空承力圈", [side * .57, .46, 0], .24, .021, [0, 0, 90], material.steel));
      for (let i = 0; i < 6; i++) { const a = i * Math.PI / 3; parts.push(rod("桨片从主轴伸出的径向支臂", [side * .57, .46, 0], [side * .57, .46 + Math.cos(a) * .33, Math.sin(a) * .33], .018), box("部分浸入水面的独立拨水桨片", [side * .57, .46 + Math.cos(a) * .34, Math.sin(a) * .34], [.26, .15, .2], material.ivory, [i * 60, 0, 0])); }
    }
    return parts;
  } },
  { name: "三浮球立轴提水叶轮增氧机", build: () => {
    const parts: ModelPart[] = [cylinder("中央封闭直立电机", [0, .88, 0], [.26, .41, .26], material.dark), cylinder("电机底部减速与密封座", [0, .58, 0], [.32, .2, .32], material.steel), rod("从电机垂下的工作主轴", [0, .52, 0], [0, .16, 0], .035), part("向上外缘甩水的开放锥盘", "lathe", material.steel, [0, .2, 0], [1, 1, 1], [0, 0, 0], { profile: [{ x: .09, y: .03 }, { x: .4, y: -.06 }, { x: .4, y: -.085 }, { x: .09, y: .005 }, { x: .09, y: .03 }] })];
    for (let i = 0; i < 3; i++) { const a = i * Math.PI * 2 / 3; parts.push(ball("环绕电机分置的独立浮球", [Math.cos(a) * .79, .22, Math.sin(a) * .79], [.46, .4, .46], material.glass), rod("从主机座伸到浮球的三角承臂", [0, .54, 0], [Math.cos(a) * .79, .36, Math.sin(a) * .79], .04)); }
    for (let i = 0; i < 8; i++) { const a = i * Math.PI / 4; parts.push(box("锥盘上部径向提水导叶", [Math.cos(a) * .27, .19, Math.sin(a) * .27], [.25, .09, .025], material.ivory, [0, -i * 45, 0])); }
    return parts;
  } },
  { name: "斜轴自吸式浮架射流增氧机", build: () => {
    const parts: ModelPart[] = [...floatPair(1.17, 1.3), ...[-1, 1].map(side => rod("跨过左右浮筒的横向联梁", [-.64, .44, side * .37], [.64, .44, side * .37], .05)), box("斜轴电机的固定回转基座", [0, .5, -.36], [.36, .13, .34]), cylinder("高于水面的斜向电动主机", [0, .79, -.52], [.26, .48, .26], material.dark, [62, 0, 0]), openPipe("将空气导入水中的连续中空轴套", [0, .66, -.36], [0, .15, .72], .045), openPipe("轴套上方独立吸气口", [0, .61, -.26], [0, 1.09, -.26], .035), loop("吸气口上端防溅敞开口圈", [0, 1.09, -.26], .041, .008), openPipe("包住水下叶轮且两端开放的导流筒", [0, .16, .61], [0, .06, .88], .18, .014), ...[-1, 1].map(side => rod("将水下筒支到浮架的斜撑", [side * .5, .4, .3], [side * .13, .13, .76], .022))];
    const rotor = createMarinePropellerParts();
    const tilt = new Quaternion().setFromAxisAngle(new Vector3(1, 0, 0), Math.atan2(.1, .27));
    for (const value of rotor) {
      const position = new Vector3(value.position.x, value.position.y - 4, value.position.z).multiplyScalar(.033).applyQuaternion(tilt).add(new Vector3(0, .11, .745));
      value.position = { x: position.x, y: position.y, z: position.z };
      const rotation = new Euler().setFromQuaternion(new Quaternion().setFromEuler(new Euler(value.rotation.x * Math.PI / 180, value.rotation.y * Math.PI / 180, value.rotation.z * Math.PI / 180)).premultiply(tilt));
      value.rotation = { x: rotation.x * 180 / Math.PI, y: rotation.y * 180 / Math.PI, z: rotation.z * 180 / Math.PI };
      for (const axis of ["x", "y", "z"] as const) value.scale[axis] *= .033;
    }
    parts.push(...rotor);
    return parts;
  } },
  { name: "池边气送旋盘定量投饵机", build: () => [box("池边固定机架的底座", [0, .07, 0], [1.03, .14, .87], material.dark), ...[-1, 1].flatMap(x => [-1, 1].map(z => rod("承托开放料斗的四角支柱", [x * .36, .14, z * .29], [x * .36, .9, z * .29], .04))), hopper("上口开放的干饲料储料斗", [0, .68, 0], .43, .84), cylinder("料斗底部旋转计量盘", [0, .65, 0], [.24, .08, .24], material.dark), box("计量盘下方的封闭空气混料喉", [0, .5, 0], [.3, .2, .29]), cylinder("侧置高压送风机圆壳", [.55, .43, .12], [.36, .19, .36], material.steel, [90, 0, 0]), openPipe("鼓风机连入混料喉的空气管", [.55, .44, .12], [.12, .44, .12], .055), openPipe("从混料喉伸向池面的开放投饵管", [0, .5, -.13], [0, .7, -.85], .07), loop("出料端防磨开放接圈", [0, .7, -.85], .08, .012, [90, 0, 0]), box("池边定时投料控制匣", [.54, .87, .17], [.24, .33, .16], material.dark), rod("控制匣与储料斗架连接支臂", [.36, .87, .17], [.54, .87, .17], .025)] },
  { name: "四蹄悬托牛蹄修剪保定台", build: () => {
    const parts: ModelPart[] = [box("供牛体站立的防滑长底板", [0, .1, 0], [1.05, .2, 2.3], material.dark), ...[-1, 1].flatMap(x => [-1, 1].map(z => rod("四角保定台承重立柱", [x * .51, .2, z * 1.02], [x * .51, 1.83, z * 1.02], .06))), ...[-1, 1].map(side => rod("两侧顶部纵向承载梁", [side * .51, 1.83, -1.02], [side * .51, 1.83, 1.02], .06)), ...[-1, 1].map(side => rod("前后顶部连接横梁", [-.51, 1.83, side * 1.02], [.51, 1.83, side * 1.02], .06)), ...[-1, 1].map(side => cord("前端保持头颈开口的夹颈曲杆", [[side * .39, .29, -.98], [side * .13, 1.02, -.98], [side * .22, 1.57, -.98]], .025, material.steel)), cylinder("夹颈架上方同步回转横轴", [0, 1.66, -.98], [.05, 1.13, .05], material.steel, [0, 0, 90])];
    for (const z of [-.48, .44]) parts.push(cord("托住腹部且中部下弯的整条宽吊带", [[-.51, 1.43, z], [-.39, .89, z], [0, .65, z], [.39, .89, z], [.51, 1.43, z]], .038, material.wood), rod("腹带绞轴到吊带上缘的固定承杆", [-.51, 1.43, z], [.51, 1.43, z], .026), loop("用于提升腹带的侧手轮", [.59, 1.43, z], .15, .015, [0, 0, 90], material.dark));
    for (const x of [-1, 1]) for (const z of [-1, 1]) parts.push(rod("四蹄分别向外支起的可调托杆", [x * .49, .53, z * .71], [x * .76, .64, z * .71], .032), box("单只蹄部可落上的独立软托板", [x * .76, .68, z * .71], [.23, .06, .22], material.dark), cord("绕过独立蹄托的锁定窄带", [[x * .86, .72, z * .71], [x * .76, .84, z * .71], [x * .66, .72, z * .71]], .009, material.wood));
    parts.push(box("后侧开放出入门下横梁", [0, .42, 1.02], [.97, .055, .055]), ...[-1, 1].map(side => rod("后侧入台门的竖向边框", [side * .43, .42, 1.02], [side * .43, 1.5, 1.02], .028)), box("侧面升降绞盘驱动与止回盒", [.61, 1.44, .02], [.18, .28, .31], material.steel));
    return parts;
  } },
  { name: "同步摇臂自锁颈枷饲喂栏", build: () => {
    const parts: ModelPart[] = [rod("贯穿各采食位的上固定横梁", [-2.1, 1.72, 0], [2.1, 1.72, 0], .06), rod("离地的下固定横梁", [-2.1, .36, 0], [2.1, .36, 0], .06), rod("在栏顶独立转动的统一锁定长轴", [-2.16, 1.9, 0], [2.16, 1.9, 0], .025)];
    for (const x of [-2.1, -.7, .7, 2.1]) parts.push(rod("把颈枷固定在地面的分格立柱", [x, .04, 0], [x, 1.76, 0], .06), box("与地面连接的独立固定脚板", [x, .025, 0], [.22, .05, .35], material.dark));
    for (const x of [-1.4, 0, 1.4]) parts.push(rod("每格保持开口左边界的固定斜栏", [x - .36, .39, 0], [x - .23, 1.7, 0], .042), rod("动物低头后可摆回的活动颈杆", [x + .11, .4, 0], [x + .43, 1.68, 0], .042), cylinder("活动颈杆底部真正转动的铰销", [x + .11, .42, 0], [.06, .12, .06], material.steel, [90, 0, 0]), rod("活动杆上端与锁轴联动的短摇臂", [x + .43, 1.68, 0], [x + .43, 1.9, -.12], .018), rod("在横轴上保持锁止的短卡栓", [x + .43, 1.9, -.12], [x + .43, 1.9, 0], .022));
    parts.push(rod("端侧操作同步锁轴的长手柄", [2.16, 1.9, 0], [2.16, 1.55, -.29], .028, material.red));
    return parts;
  } },
  { name: "扇形围壁转门集畜赶牛栏", build: () => {
    const wall = sweptProfile("入口留空的连续厚壁弧形围栏", material.steel, [[2.72, .13], [2.79, .13], [2.79, 1.35], [2.72, 1.35]], Math.PI * 1.5, 30);
    const parts: ModelPart[] = [wall, cylinder("推动扇门回转的中央承重轴座", [0, .18, 0], [.38, .36, .38], material.dark), rod("扇门中央完整竖向回转轴", [0, .18, 0], [0, 1.85, 0], .085), box("由中央轴推向弧壁的整片赶畜门", [1.31, .84, 0], [2.62, 1.14, .055], material.steel), rod("门片顶部保持刚度的水平梁", [0, 1.44, 0], [2.65, 1.44, 0], .05), rod("中央上方转动赶牛门的手动操纵杆", [0, 1.81, 0], [1.23, 1.81, .42], .033, material.dark)];
    for (let i = 0; i < 10; i++) { const a = i / 9 * Math.PI * 1.5; parts.push(rod("弧壁背部落地稳定立杆", [Math.cos(a) * 2.8, .035, Math.sin(a) * 2.8], [Math.cos(a) * 2.8, 1.72, Math.sin(a) * 2.8], .055), box("弧壁立杆固定地脚", [Math.cos(a) * 2.8, .025, Math.sin(a) * 2.8], [.18, .05, .18], material.dark)); }
    return parts;
  } },
  { name: "单牛侧臂机器人自动挤奶工作站", build: () => {
    const parts: ModelPart[] = [box("供单牛通行的防滑工作底台", [0, .08, 0], [1.14, .16, 2.45], material.dark), ...[-1, 1].flatMap(x => [-1, 1].map(z => rod("牛体活动空间外的四角立栏", [x * .53, .16, z * 1.12], [x * .53, 1.6, z * 1.12], .05))), ...[-1, 1].flatMap(side => [.65, 1.18, 1.57].map(y => rod("不覆盖腹下机械臂工作区的纵向栏杆", [side * .53, y, -1.12], [side * .53, y, 1.12], .035))), box("独立真空乳路和清洗后柜", [.96, .9, .32], [.59, 1.65, 1.24], material.steel), box("朝向操作者的乳路控制屏", [1.262, 1.36, .17], [.012, .25, .33], material.glass), cylinder("从侧柜伸出机械臂的回转肩座", [.64, .53, .12], [.19, .24, .19], material.dark), rod("横向到牛腹下的第一节平面机械臂", [.64, .55, .12], [.22, .55, .1], .065), cylinder("机械臂前后调整的竖直肘轴", [.22, .55, .1], [.11, .13, .11], material.dark), rod("定位奶杯的第二节细前臂", [.22, .55, .1], [0, .55, -.21], .04), box("机械臂末端独立奶杯定位盘", [0, .58, -.21], [.25, .055, .26], material.steel), box("奶杯定位的小型光学检测头", [.13, .67, -.3], [.07, .06, .08], material.dark)];
    for (const x of [-1, 1]) for (const z of [-1, 1]) parts.push(openPipe("四只独立竖直奶杯的真实上口", [x * .075, .61, -.21 + z * .075], [x * .075, .82, -.21 + z * .075], .024, .004), cord("奶杯各自回到侧柜的乳液短软管", [[x * .075, .61, -.21 + z * .075], [.25, .39, -.12], [.62, .43, .12]], .007, material.dark));
    parts.push(...[-1, 1].map(side => rod("入口末端前后可开门的竖框", [side * .43, .45, -1.1], [side * .43, 1.46, -1.1], .03)), rod("入站门上部横梁", [-.43, 1.46, -1.1], [.43, 1.46, -1.1], .03), cup("牛体前方的单个采食引导槽", [0, .61, 1.05], .22, .22, material.steel));
    return parts;
  } },
  { name: "限食斜栏圆筒草料投放架", build: () => [cylinder("不让草料直接接触泥地的底盘", [0, .19, 0], [1.59, .1, 1.59], material.steel), loop("底盘外侧低防踢圈", [0, .26, 0], .83, .04, [0, 0, 0], material.steel), loop("中部斜栏固定圆环", [0, .71, 0], .9, .035, [0, 0, 0], material.steel), loop("供整捆草料放入的顶部开放圈", [0, 1.36, 0], 1, .035, [0, 0, 0], material.steel), ...Array.from({ length: 16 }, (_, i) => { const a = i * Math.PI / 8; return rod("让牛颈可伸入但限制整捆拖出的斜喂食栏", [Math.cos(a) * .81, .26, Math.sin(a) * .81], [Math.cos(a + .12) * 1, 1.36, Math.sin(a + .12) * 1], .035); }), ...Array.from({ length: 4 }, (_, i) => { const a = i * Math.PI / 2; return box("圆筒草料架独立短接地脚", [Math.cos(a) * .67, .085, Math.sin(a) * .67], [.16, .17, .16], material.dark); })] },
  { name: "干湿分流计量猪用饲喂柱", build: () => [cup("四周开放而中央竖起的湿料承接盘", [0, .16, 0], .49, .16, material.steel), hopper("上口敞开的干料储料柱", [0, .58, 0], .32, .78), openPipe("饲料从计量颈落到承接盘的真正通道", [0, .6, 0], [0, .32, 0], .048), cylinder("猪鼻可推转的下料触发圆盘", [0, .36, 0], [.2, .025, .2], material.dark), rod("上部计量板的中央活动芯杆", [0, .35, 0], [0, .7, 0], .015), ...Array.from({ length: 3 }, (_, i) => { const a = i * Math.PI * 2 / 3; return rod("使整台设备离地的三条外支腿", [Math.cos(a) * .4, .03, Math.sin(a) * .4], [Math.cos(a) * .3, .65, Math.sin(a) * .3], .035); }), openPipe("与干料路分开的独立饮水立管", [.37, .26, .09], [.37, 1.21, .09], .023, .004), openPipe("让饮水流回湿盘的小弯嘴", [.37, .31, .09], [.22, .31, .09], .018, .004), box("干料定量旋转行程调节柄", [.12, .74, .05], [.16, .035, .035], material.red), ...[-1, 1].map(side => rod("湿盘上方防整身踩入的分格横栏", [side * .45, .4, 0], [0, .4, 0], .022))] },
  { name: "三脚吊罩式家禽育雏暖伞", build: () => {
    const parts: ModelPart[] = [part("朝下开放且有金属壁厚的反射暖罩", "lathe", material.steel, [0, .9, 0], [1, 1, 1], [0, 0, 0], { profile: [{ x: .12, y: .39 }, { x: .74, y: 0 }, { x: .75, y: -.035 }, { x: .1, y: .37 }, { x: .12, y: .39 }] }), cylinder("暖罩中央上部燃气阀与悬吊头", [0, 1.34, 0], [.14, .16, .14], material.dark), cylinder("暖罩内居中的加热核心", [0, 1.12, 0], [.16, .14, .16], material.red), loop("与雏禽保持间距的下部开放防护圈", [0, .87, 0], .68, .022, [0, 0, 0], material.steel), cord("独立燃气软管通向罩顶阀门", [[0, 1.4, 0], [.9, 1.5, 0], [1.1, .18, .3]], .012, material.dark)];
    for (let i = 0; i < 3; i++) { const a = i * Math.PI * 2 / 3; parts.push(rod("三脚悬吊支架的长承重杆", [Math.cos(a) * 1.12, .04, Math.sin(a) * 1.12], [0, 2.02, 0], .035), rod("把暖罩接在中央悬吊点下的短索", [Math.cos(a) * .48, 1.08, Math.sin(a) * .48], [0, 1.84, 0], .006, material.dark), rod("罩内防触护圈的细径向肋", [0, 1.05, 0], [Math.cos(a) * .68, .87, Math.sin(a) * .68], .006)); }
    return parts;
  } },
  { name: "渐变间隙滚筒活鱼规格分级机", build: () => {
    const parts: ModelPart[] = [...[-1, 1].flatMap(x => [-1, 1].map(z => rod("分级机四角落地承重支脚", [x * .53, .025, z * .8], [x * .53, .94, z * .8], .05))), ...[-1, 1].map(side => box("分级滚筒两侧轴承长梁", [side * .53, .91, 0], [.08, .12, 2.03])), ...[-1, 1].map(side => box("前后统一承托滚筒端轴的横梁", [0, .95, side * .94], [1.14, .08, .12])), box("滚筒上方敞开的入鱼引导底板", [0, 1.07, -1.07], [.98, .045, .35], material.steel, [-5, 0, 0]), ...[-1, 1].map(side => box("入鱼盘两侧真正直立的挡边", [side * .48, 1.17, -1.07], [.035, .22, .35], material.steel)), box("独立变速齿轮与驱动电机柜", [.71, .94, -.62], [.28, .37, .48], material.dark)];
    for (let i = 0; i < 8; i++) parts.push(part("沿出鱼方向逐渐变细的封闭分级滚筒", "lathe", material.steel, [(i - 3.5) * .115, 1, 0], [1, 1, 1], [95, 0, 0], { profile: [{ x: 0, y: -.92 }, { x: .055, y: -.92 }, { x: .0275, y: .92 }, { x: 0, y: .92 }] }));
    for (const z of [-.61, 0, .61]) parts.push(box("承接不同落下区鱼体的独立浅槽底", [.2, .43, z], [1.35, .035, .54], material.steel), ...[-1, 1].map(side => box("分级槽前后敞开上沿的分隔侧壁", [.2, .54, z + side * .27], [1.35, .22, .025], material.steel)), box("浅槽靠机内一端的独立封板", [-.475, .54, z], [.025, .22, .54], material.steel));
    return parts;
  } },
  { name: "双舱交替负压活鱼输送泵组", build: () => {
    const parts: ModelPart[] = [box("整套活鱼泵的固定撬装底架", [0, .09, 0], [1.93, .18, 1.47], material.dark), box("独立负压发生泵组机柜", [0, .52, .48], [.58, .65, .47], material.steel), cylinder("真空泵后置电动机", [0, .58, .81], [.28, .39, .28], material.dark, [90, 0, 0]), openPipe("两舱共用而与鱼路分离的真空横总管", [-.56, 1.77, .12], [.56, 1.77, .12], .035), openPipe("真空总管通往真空发生机组的竖管", [0, 1.77, .12], [0, .78, .48], .035)];
    for (const side of [-1, 1]) parts.push(part("带上下弧形封头的独立活鱼压力舱", "lathe", material.steel, [side * .57, 1.03, 0], [1, 1, 1], [0, 0, 0], { profile: [{ x: 0, y: -.65 }, { x: .22, y: -.62 }, { x: .35, y: -.47 }, { x: .35, y: .46 }, { x: .22, y: .61 }, { x: 0, y: .65 }] }), ...[-1, 1].map(z => rod("每个压力舱独立落地的固定腿", [side * .57, .18, z * .18], [side * .57, .57, z * .18], .055)), openPipe("上部抽吸空气支管", [side * .57, 1.65, 0], [side * .57, 1.77, .12], .027), openPipe("活鱼舱下部独立进排水大口", [side * .57, .46, 0], [side * .57, .46, -.53], .135, .012), box("大口上方封闭的切换阀执行头", [side * .57, .69, -.36], [.16, .16, .16], material.dark), loop("压力舱上部可开启维护口法兰", [side * .57, 1.64, 0], .13, .025, [0, 0, 0], material.steel));
    for (const side of [-1, 1]) parts.push(cylinder("把维护法兰接到舱体的固定短颈", [side * .57, 1.66, 0], [.22, .16, .22], material.steel), cylinder("维护法兰上方闭合的可移舱盖", [side * .57, 1.755, 0], [.26, .025, .26], material.steel));
    parts.push(openPipe("两舱排鱼大口连接的共同横流管", [-.57, .46, -.53], [.57, .46, -.53], .14, .012), openPipe("朝向外部鱼池的开放活鱼输送接口", [0, .46, -.53], [0, .46, -.96], .14, .012));
    return parts;
  } },
  { name: "多料斗微量饲料称重配料台", build: () => {
    const parts: ModelPart[] = [box("承托称重与计量支架的整块底台", [0, .065, 0], [1.85, .13, 1.6], material.dark), ...[-1, 1].flatMap(x => [-1, 1].map(z => rod("上部微料斗共用四角承重脚", [x * .83, .13, z * .56], [x * .83, 1.25, z * .56], .045))), ...[-1, 1].map(side => rod("同排微料斗的上下固定横梁", [-.84, 1.2, side * .34], [.84, 1.2, side * .34], .04)), cup("独立悬在下方称量的宽接料盘", [0, .46, -.13], .75, .19, material.steel), box("与上部供料架隔离的称重平台", [0, .34, -.13], [1.44, .08, 1.15], material.steel), ...[-1, 1].flatMap(x => [-1, 1].map(z => cylinder("称重盘四角独立压式传感柱", [x * .51, .23, -.13 + z * .4], [.075, .15, .075], material.dark))), box("操作者侧面独立配料控制屏", [.91, .92, -.24], [.045, .29, .3], material.dark)];
    for (const x of [-.6, -.2, .2, .6]) parts.push(hopper("分别储存不同微量组分的真实开放料斗", [x, .9, .32], .17, .62), openPipe("料斗下方独立螺旋定量机筒", [x, .87, .51], [x, .87, -.13], .055), box("每根定量螺旋筒后方的独立驱动电机", [x, .87, .62], [.14, .14, .19], material.dark), openPipe("计量螺旋末端落向下部秤盘的出料嘴", [x, .87, -.13], [x, .7, -.13], .045));
    return parts;
  } },
  { name: "青贮草捆松解切片分料台", build: () => {
    const parts: ModelPart[] = [...[-1, 1].flatMap(x => [-1, 1].map(z => rod("固定分料台四角承重支脚", [x * .66, .035, z * .75], [x * .66, .64, z * .75], .065))), ...[-1, 1].map(side => box("分料台两侧独立纵向主梁", [side * .66, .58, 0], [.1, .16, 2.1], material.steel)), ...[-1, 1].map(side => cylinder("托住整捆草料的双纵向滚筒", [side * .42, .77, .16], [.27, 1.57, .27], material.dark, [90, 0, 0])), ...[-1, 1].map(side => rod("防止草捆从左右滚出的高侧栏", [side * .66, 1.33, -.57], [side * .66, 1.33, .91], .045)), ...[-1, 1].flatMap(x => [-1, 1].map(z => rod("把高位侧栏接到主梁的竖向立柱", [x * .66, .63, z * .72], [x * .66, 1.33, z * .72], .04))), cylinder("前端横向切片松解刀鼓", [0, .73, -.91], [.39, 1.31, .39], material.dark, [0, 0, 90]), box("松解片料向外导落的开放斜底板", [0, .43, -1.5], [1.33, .035, .96], material.steel, [-15, 0, 0]), ...[-1, 1].map(side => box("出料斜槽两侧保留开口的竖挡板", [side * .67, .54, -1.5], [.035, .22, .96], material.steel, [-15, 0, 0])), box("单独驱动切片刀鼓的侧置机柜", [.87, .72, -.76], [.31, .4, .47], material.steel), box("后端托料滚筒的减速电机箱", [0, .76, 1.03], [.48, .31, .28], material.dark)];
    for (let i = 0; i < 12; i++) { const a = i % 4 * Math.PI / 2; parts.push(box("沿刀鼓错排的独立草捆切片齿", [(Math.floor(i / 4) - 1) * .36, .73 + Math.cos(a) * .23, -.91 + Math.sin(a) * .23], [.2, .09, .05], material.steel, [i % 4 * 90, 0, 0])); }
    return parts;
  } },
  { name: "杆托链带禽蛋集卵提升机", build: () => {
    const parts: ModelPart[] = [...[-1, 1].flatMap(x => [-1, 1].map(z => rod("竖向集卵机四角独立固定立柱", [x * .36, .025, z * .22], [x * .36, 2.43, z * .22], .045))), ...[-1, 1].map(side => cylinder("闭合托蛋链带的上下传动筒", [0, side < 0 ? .29 : 2.13, 0], [.31, .66, .31], material.dark, [0, 0, 90])), ...[-1, 1].map(side => box("包在驱动筒外侧的纵向链带侧护板", [side * .36, 1.22, 0], [.055, 2.25, .41], material.steel)), box("提升链顶端单独的驱动减速机", [.52, 2.13, 0], [.28, .32, .3], material.dark), box("从不同层高转入的侧向杆式输送架", [-.77, .91, .1], [.86, .13, .33], material.steel), box("提升机顶部排入横向分拣线的短台", [.72, 2.14, .1], [.76, .11, .34], material.steel)];
    for (const z of [-.15, .15]) for (let i = 0; i < 14; i++) parts.push(rod("托住禽蛋并沿垂直闭环升降的独立横杆", [-.31, .37 + i * .13, z], [.31, .37 + i * .13, z], .012, material.ivory));
    for (let i = 0; i < 8; i++) parts.push(rod("水平转接段托蛋滚杆", [-1.13 + i * .1, .99, -.04], [-1.13 + i * .1, .99, .24], .013, material.ivory));
    return parts;
  } },
  { name: "翻盘筛落式雏鸡残壳机械分离台", build: () => {
    const parts: ModelPart[] = [...[-1, 1].flatMap(x => [-1, 1].map(z => rod("残壳分离台四角承重支腿", [x * .53, .025, z * .91], [x * .53, .92, z * .91], .05))), ...[-1, 1].map(side => box("连续托盘输送线左右边架", [side * .53, .92, 0], [.075, .16, 2.15], material.steel)), cylinder("使孵化托盘翻转的中央横轴", [0, 1.15, -.25], [.06, 1.2, .06], material.steel, [0, 0, 90]), ...[-1, 1].map(side => cord("不封堵托盘滑入的翻盘C形侧夹", [[side * .46, .98, -.58], [side * .46, 1.43, -.58], [side * .46, 1.43, .05], [side * .46, 1.25, .14]], .022, material.steel)), box("翻盘轴外侧封闭驱动电机", [.72, 1.14, -.25], [.26, .33, .39], material.dark), box("筛下碎壳的宽下落导槽底板", [0, .52, .23], [.99, .035, 1.24], material.steel, [-12, 0, 0]), ...[-1, 1].map(side => box("碎壳导槽两侧保留出口的薄挡壁", [side * .49, .62, .23], [.035, .2, 1.24], material.steel, [-12, 0, 0])), box("承接分离雏禽的独立宽出口台", [0, .78, 1.07], [1.13, .065, .45], material.ivory)];
    for (let i = 0; i < 15; i++) parts.push(rod("前段输送孵化托盘的滚杆", [-.48, 1.02, -.99 + i * .069], [.48, 1.02, -.99 + i * .069], .018));
    for (let i = 0; i < 17; i++) parts.push(rod("分开残壳与雏禽的大间隙筛杆", [-.46 + i * .0575, .91, .05], [-.46 + i * .0575, .81, .91], .008, material.ivory));
    return parts;
  } },
  { name: "跨箱喷雾禽苗免疫输送机", build: () => {
    const parts: ModelPart[] = [...[-1, 1].flatMap(x => [-1, 1].map(z => rod("喷雾输送机四角落地支脚", [x * .43, .025, z * .81], [x * .43, .75, z * .81], .05))), box("可让雏禽周转箱连续通过的带式输送床", [0, .78, 0], [.87, .16, 1.99], material.steel), box("输送床上的平整循环承托带", [0, .868, 0], [.75, .016, 1.91], material.dark), ...[-1, 1].map(side => box("跨输送床两侧独立喷雾罩壁", [side * .46, 1.17, 0], [.04, .62, .76], material.steel)), box("前后均开放的喷雾桥顶罩", [0, 1.49, 0], [.96, .045, .8], material.steel), ...[-1, 1].map(side => cylinder("独立药液供给容器", [.72, 1.15, side * .22], [.2, .48, .2], material.ivory)), box("侧置小型供液计量泵与控制柜", [.72, .72, 0], [.34, .36, .64], material.steel), ...[-1, 1].map(side => openPipe("桥内朝下的独立喷雾平口喷头", [side * .23, 1.42, 0], [side * .23, 1.31, 0], .018, .004)), ...[-1, 1].map(side => cord("供液桶经顶部到各自喷头的细软管", [[.72, 1.38, side * .22], [.56, 1.58, side * .22], [side * .23, 1.58, 0], [side * .23, 1.41, 0]], .006, material.dark)), box("桥侧触发检测的小型光电头", [-.49, 1.06, -.35], [.055, .055, .055], material.dark), box("供液柜前侧状态控制屏", [.72, .77, -.331], [.22, .14, .012], material.glass)];
    return parts;
  } },
  { name: "玻璃斜罩支架式太阳熔蜡台", build: () => {
    const parts: ModelPart[] = [...[-1, 1].flatMap(x => [-1, 1].map(z => rod("太阳熔蜡台四个固定支脚", [x * .32, .025, z * .43], [x * .32, .72, z * .43], .035))), box("隔热箱体的底部承托板", [0, .76, 0], [.73, .08, 1.04], material.wood), ...[-1, 1].map(side => part("沿斜玻璃罩下缘闭合的梯形侧壁", "extrude", material.wood, [side * .35, 0, 0], [1, 1, 1], [0, 90, 0], { depth: .055, profile: [{ x: -.52, y: .8 }, { x: .52, y: .8 }, { x: .52, y: 1.048 }, { x: -.52, y: 1.232 }] })), ...[-1, 1].map(side => box("按斜罩高差封闭的前后端壁", [0, side > 0 ? 1.015 : .925, side * .49], [.66, side > 0 ? .43 : .25, .055], material.wood)), box("倾斜内盘把液蜡引向低端", [0, .94, -.04], [.62, .025, .84], material.steel, [-10, 0, 0]), ...[-1, 1].map(side => box("内盘两边防流失薄挡条", [side * .3, .97, -.04], [.018, .05, .84], material.steel, [-10, 0, 0])), box("前下方独立接蜡小盘底", [0, .825, -.33], [.48, .025, .24], material.steel), ...[-1, 1].map(side => rod("太阳能斜透明罩两侧铰轴", [side * .31, 1.09, .48], [side * .31, 1.09, .39], .012)), part("封住太阳热量而可见内盘的透明斜罩", "box", material.glass, [0, 1.14, 0], [.72, .012, 1.06], [-10, 0, 0], { opacity: .24 }), ...[-1, 1].map(side => box("斜透明罩两条长边框", [side * .36, 1.14, 0], [.025, .026, 1.08], material.steel, [-10, 0, 0])), ...[-1, 1].map(side => rod("斜盖前后固定短边框", [-.36, 1.14 + side * .092, side * .53], [.36, 1.14 + side * .092, side * .53], .022))];
    for (let i = 0; i < 11; i++) parts.push(rod("挡下杂质但允许蜡流过的内盘端筛条", [-.28 + i * .056, .885, -.35], [-.28 + i * .056, .885, -.43], .003, material.dark));
    return parts;
  } },
  { name: "巢脾双刷辊电动脱蜂收集机", build: () => {
    const parts: ModelPart[] = [...[-1, 1].flatMap(x => [-1, 1].map(z => rod("脱蜂机离地的可折固定立脚", [x * .3, .025, z * .21], [x * .27, .78, z * .19], .027))), box("刷辊下部独立收集箱的底板", [0, .25, 0], [.57, .035, .39], material.ivory), ...[-1, 1].map(side => box("收集箱两边可移出的侧壁", [side * .27, .43, 0], [.035, .36, .39], material.ivory)), ...[-1, 1].map(side => box("收集箱前后挡壁", [0, .43, side * .18], [.53, .36, .035], material.ivory)), ...[-1, 1].map(side => cylinder("夹住巢脾两面柔软扫蜂刷辊", [0, .81, side * .07], [.105, .55, .105], material.wood, [0, 0, 90])), ...[-1, 1].map(side => box("两个刷辊外部共同的轴承边座", [side * .31, .81, 0], [.065, .11, .28], material.steel)), box("独立蓄电池及小电机机柜", [.37, .65, 0], [.15, .32, .33], material.dark), ...[-1, 1].map(side => rod("巢脾从上方插入时的两条竖向导边", [side * .27, .79, 0], [side * .27, 1.16, 0], .018)), ...[-1, 1].map(side => rod("收集箱左右两只可提握柄", [side * .31, .49, -.07], [side * .31, .49, .07], .018, material.dark))];
    for (const side of [-1, 1]) for (let i = 0; i < 8; i++) { const a = i * Math.PI / 4; parts.push(box("柔性刷筒外周实际可见的连续刷毛脊", [0, .81 + Math.sin(a) * .055, side * .07 + Math.cos(a) * .055], [.51, .02, .02], material.wood, [i * 45, 0, 0])); }
    return parts;
  } },
  { name: "液压框刀青贮取料切块叉", build: () => {
    const parts: ModelPart[] = [box("可装入装载机的独立后部承力框", [0, .51, .34], [1.7, .93, .09], material.steel), ...[-1, 1].map(side => box("后承力框垂向加强立梁", [side * .7, .51, .29], [.09, 1, .12], material.steel)), ...[-1, 1].map(side => box("位于取料块两侧的向前框刀", [side * .82, .83, -.1], [.035, .2, .94], material.steel)), box("连接左右框刀的前横切刃", [0, .76, -.57], [1.68, .25, .035], material.steel), ...[-1, 1].map(side => rod("让切刀框上下回转的后端铰轴", [side * .73, .9, .23], [side * .9, .9, .23], .06)), ...[-1, 1].map(side => cylinder("两侧独立向下切刀的液压缸套", [side * .66, .79, .07], [.1, .43, .1], material.dark, [26, 0, 0])), ...[-1, 1].map(side => rod("液压活塞杆连接上刀框", [side * .66, .6, -.02], [side * .66, .5, -.13], .038)), ...[-1, 1].map(side => box("装载机安装用背部实际挂耳", [side * .55, .77, .44], [.13, .24, .11], material.dark))];
    for (let i = 0; i < 8; i++) parts.push(part("托住已切青贮块的长尖底叉齿", "extrude", material.steel, [(i - 3.5) * .205, .07, -.14], [1, 1, 1], [0, 90, 0], { depth: .035, profile: [{ x: -.52, y: 0 }, { x: .46, y: 0 }, { x: .46, y: .07 }, { x: -.45, y: .055 }, { x: -.57, y: .015 }] }));
    return parts;
  } },
  { name: "中央回转分隔式走马训练机", build: () => {
    const parts: ModelPart[] = [cylinder("走马机中央固定减速驱动基座", [0, .29, 0], [.9, .58, .9], material.dark), rod("高于马背的中央竖直回转柱", [0, .52, 0], [0, 2.45, 0], .18), cylinder("带动全部悬挂分隔门的上回转盘", [0, 2.44, 0], [.62, .19, .62], material.steel)];
    for (let i = 0; i < 4; i++) {
      const a = i * Math.PI / 2, radial: Triple = [Math.cos(a) * 3.5, 2.44, Math.sin(a) * 3.5];
      parts.push(rod("上部从中心伸向环形马道的独立长臂", [0, 2.44, 0], radial, .065), rod("长臂下垂的内侧柔性分隔门吊索", [Math.cos(a) * 2.5, 2.44, Math.sin(a) * 2.5], [Math.cos(a) * 2.5, .74, Math.sin(a) * 2.5], .016, material.dark), rod("长臂下垂的外侧柔性分隔门吊索", radial, [radial[0], .74, radial[2]], .016, material.dark));
      for (let n = 0; n < 3; n++) parts.push(rod("随中心转臂移动的透空马道分隔横栏", [Math.cos(a) * 2.45, .83 + n * .42, Math.sin(a) * 2.45], [Math.cos(a) * 3.58, .83 + n * .42, Math.sin(a) * 3.58], .025, material.steel));
    }
    for (let i = 0; i < 16; i++) { const a = i * Math.PI / 8; parts.push(rod("独立于回转门的外圈固定围栏桩", [Math.cos(a) * 3.82, .025, Math.sin(a) * 3.82], [Math.cos(a) * 3.82, 1.5, Math.sin(a) * 3.82], .055)); }
    parts.push(sweptProfile("外圈在进出门处留空的固定上护栏", material.steel, [[3.8, 1.46], [3.84, 1.46], [3.84, 1.5], [3.8, 1.5]], Math.PI * 2 * 15 / 16, 32), loop("马道内圈与中央驱动区分开的固定栏", [0, 1.35, 0], 2.24, .04, [0, 0, 0], material.steel));
    for (let i = 0; i < 8; i++) { const a = i * Math.PI / 4; parts.push(rod("接住内环护栏的实际落地支柱", [Math.cos(a) * 2.24, .025, Math.sin(a) * 2.24], [Math.cos(a) * 2.24, 1.35, Math.sin(a) * 2.24], .045)); }
    for (const y of [.35, 1.45]) parts.push(rod("朝外打开而露出进出通道的活动门横框", [3.82, y, 0], [4.85, y, -.8], .03));
    parts.push(rod("打开进出门远端的竖向门框", [4.85, .35, -.8], [4.85, 1.45, -.8], .03));
    return parts;
  } },
  { name: "整托禽蛋龙门真空移盘台", build: () => {
    const parts: ModelPart[] = [...[-1, 1].flatMap(x => [-1, 1].map(z => rod("两侧禽蛋转盘工位的固定台脚", [x * .55, .025, z * .39], [x * .55, .72, z * .39], .04))), box("供料和收蛋托盘并排定位的作业台", [0, .76, 0], [1.4, .08, .9], material.steel), ...[-1, 1].map(side => rod("跨在工作台之外的龙门固定立柱", [side * .78, .025, .1], [side * .78, 1.51, .1], .06)), rod("供整托吸盘横向移动的上导梁", [-.78, 1.51, .1], [.78, 1.51, .1], .055), box("沿上梁滑动的升降悬挂滑座", [0, 1.47, .1], [.21, .15, .18], material.dark), cylinder("使整托吸盘头竖直下降的气缸", [0, 1.22, .1], [.07, .39, .07], material.steel), box("分配真空到整托吸嘴的中空承盘", [0, .97, .1], [.39, .045, .34], material.steel), box("工作台下方独立的小型真空泵柜", [.36, .34, .16], [.34, .38, .44], material.dark), cord("上梁留有弯曲余量的真空供应软管", [[.36, .47, .16], [.66, 1.63, .15], [0, 1.61, .15], [0, 1.01, .1]], .012, material.dark)];
    for (let row = 0; row < 5; row++) for (let column = 0; column < 6; column++) parts.push(part("各自下开口且不封死的柔软吸蛋杯", "lathe", material.dark, [(column - 2.5) * .06, .89, .1 + (row - 2) * .06], [1, 1, 1], [0, 0, 0], { profile: [{ x: .02, y: 0 }, { x: .007, y: .06 }, { x: .003, y: .06 }, { x: .016, y: 0 }, { x: .02, y: 0 }] }));
    return parts;
  } },
  { name: "水密门循环泵马匹水疗跑台", build: () => {
    const parts: ModelPart[] = [box("整机防水箱体下的固定底架", [0, .13, 0], [1.47, .26, 3.8], material.dark), box("水槽底部密封承水结构板", [0, .29, 0], [1.39, .11, 3.61], material.steel), box("位于水槽内而可持续循环的上跑带", [0, .39, 0], [1.16, .045, 3.18], material.dark), box("跑带回转后隐藏在水槽底部的下行段", [0, .31, 0], [1.16, .025, 3.18], material.dark), ...[-1, 1].map(side => cylinder("宽跑带两端独立密封回转滚筒", [0, .35, side * 1.61], [.12, 1.19, .12], material.dark, [0, 0, 90])), ...[-1, 1].map(side => box("箱体下侧保证水密的整块侧板", [side * .695, .64, 0], [.045, .7, 3.61], material.steel)), ...[-1, 1].map(side => part("可从箱外观察马腿的连续侧窗", "box", material.glass, [side * .696, 1.16, 0], [.022, .47, 3.28], [0, 0, 0], { opacity: .24 })), ...[-1, 1].map(side => box("侧窗上沿坚固的承托边框", [side * .695, 1.43, 0], [.06, .08, 3.67], material.steel)), ...[-1, 1].map(side => box("真正封住箱体前后通道的水密门", [0, .88, side * 1.8], [1.4, 1.18, .06], material.steel)), ...[-1, 1].flatMap(side => [-1, 1].map(height => cylinder("水密门单侧竖向铰链筒", [-.73, .88 + height * .32, side * 1.8], [.045, .15, .045], material.steel))), ...[-1, 1].flatMap(side => [-1, 1].map(height => rod("水密门另一侧独立快开压紧把", [.72, .88 + height * .32, side * 1.8], [.84, .94 + height * .32, side * 1.8], .022, material.dark))), ...[-1, 1].flatMap(side => [-1, 1].map(end => box("封住侧窗两端间隙的水密直立窗框", [side * .695, 1.16, end * 1.72], [.055, .54, .17], material.steel))), box("外置独立循环过滤泵柜", [.99, .63, .52], [.53, .9, 1.08], material.steel), openPipe("从箱底排水口到循环泵的供水管", [.7, .4, .84], [.99, .4, .84], .065), openPipe("净化水从独立回水接口返回水槽", [.99, .81, .16], [.7, .81, .16], .065), openPipe("全槽低端独立排水阀接头", [.69, .32, -1.21], [1.01, .32, -1.21], .065), rod("排水阀上方快开控制手柄", [.87, .37, -1.21], [.87, .54, -1.21], .018, material.red), box("不挡住马进出路径的侧置控制台", [1.01, 1.33, .52], [.35, .33, .4], material.dark), box("侧置控制台的可见监控屏", [1.191, 1.36, .52], [.012, .18, .27], material.glass)];
    return parts;
  } },
  { name: "封闭压力锥式水产纯氧溶氧机组", build: () => [box("循环泵和氧锥共同的撬装底架", [0, .09, 0], [1.85, .18, 1.61], material.dark), part("上窄下宽并带封头的承压溶氧锥", "lathe", material.steel, [-.28, .59, 0], [1, 1, 1], [0, 0, 0], { profile: [{ x: 0, y: -.28 }, { x: .35, y: -.26 }, { x: .51, y: -.08 }, { x: .51, y: .18 }, { x: .065, y: 1.61 }, { x: 0, y: 1.66 }] }), ...[-1, 1].flatMap(x => [-1, 1].map(z => rod("承压氧锥四角离地承托短脚", [-.28 + x * .3, .18, z * .3], [-.28 + x * .3, .5, z * .3], .045))), cylinder("侧置加压循环水泵电动机", [.62, .42, .27], [.28, .5, .28], material.dark, [90, 0, 0]), box("电机前方独立离心水泵壳", [.62, .42, -.12], [.36, .38, .31], material.steel), openPipe("水泵送向氧锥顶部的竖向加压水路", [.62, .44, -.19], [.62, 2.23, -.19], .055), openPipe("顶部水路进入氧锥上端的横向接口", [.62, 2.23, -.19], [-.28, 2.23, 0], .055), openPipe("与加压水路分开的纯氧细进气口", [-.28, 2.15, -.04], [-.55, 2.15, -.25], .015, .003), openPipe("锥体下部送出富氧水的开放接口", [.18, .66, 0], [.91, .66, 0], .09), cylinder("氧锥上段独立压力表盘", [-.4, 1.88, -.17], [.12, .035, .12], material.ivory, [90, 0, 0]), rod("压力表连接氧锥的小径管颈", [-.4, 1.88, -.17], [-.36, 1.88, -.04], .012), rod("表盘上的可见压力指针", [-.4, 1.88, -.19], [-.375, 1.91, -.19], .0025, material.red)] },
];
