import { Vector3 } from "three";
import { part, type ModelPart, type Triple } from "../assetModelParts";
import { box, cylinder, ball, rod, loop, cord, plate, piercedPanel, material, type MasterPrototype } from "./parts";
import { rideSeat } from "./playExpansionBatchTwo";

function screen(position: Triple, width: number, height: number, tilt = 0): ModelPart[] {
  const a = tilt * Math.PI / 180;
  return [box("围合显示器的实体保护框", position, [width + .11, height + .11, .13], material.dark, [tilt, 0, 0]), box("嵌在框内的整块显示玻璃", [position[0], position[1] + Math.sin(a) * .069, position[2] - Math.cos(a) * .069], [width, height, .015], material.glass, [tilt, 0, 0])];
}

function coinDoor(position: Triple): ModelPart[] {
  return [box("带外接取币浅斗的前维护门", position, [.28, .34, .018], material.dark), box("维护门下的取币浅斗底", [position[0], position[1] - .105, position[2] - .025], [.16, .015, .07], material.steel), ...[-1, 1].map(s => box("取币浅斗真实侧壁", [position[0] + s * .08, position[1] - .08, position[2] - .026], [.012, .055, .07], material.steel))];
}

function panel(name: string, points: Triple[], color = material.ivory): ModelPart {
  const n = new Vector3(...points[1]!).sub(new Vector3(...points[0]!)).cross(new Vector3(...points[2]!).sub(new Vector3(...points[0]!))).normalize().multiplyScalar(.035);
  const positions = [1, -1].flatMap(side => points.map(([x, y, z]) => ({ x: x + n.x * side, y: y + n.y * side, z: z + n.z * side }))), indices = [0, 1, 2, 0, 2, 3, 6, 5, 4, 7, 6, 4];
  for (let i = 0; i < 4; i++) { const j = (i + 1) % 4; indices.push(i, j + 4, j, i, i + 4, j + 4); }
  return part(name, "mesh", color, [0, 0, 0], [1, 1, 1], [0, 0, 0], { vertices: indices.map(i => positions[i]!) });
}

export const playExpansionBatchThreeObjects: MasterPrototype[] = [
  { name: "双人立式摇杆街机柜", itemType: "设施", build: () => {
    const side: [number, number][] = [[-.31, 0], [.32, 0], [.37, .68], [.48, .88], [.46, 1.03], [.22, 1.08], [.19, 1.72], [.31, 1.95], [-.31, 1.95]];
    const p = [box("柜机独立落地底座", [0, .07, 0], [.94, .14, .78], material.dark), ...[-1, 1].map(s => plate("从脚座到顶篷的整体侧形板", [s * .45, .14, 0], side, .026, material.red, [0, 90, 0])), box("侧板之间的后方封闭壁", [0, 1.08, .31], [.88, 1.85, .035], material.dark), box("向前伸出的双人操作台", [0, 1.1, -.36], [1.04, .12, .4], material.ivory, [-7, 0, 0]), box("操作台下的封闭承力柜面", [0, .6, -.29], [.86, .92, .04], material.red), ...screen([0, 1.58, -.11], .78, .59, -8), box("柜顶横向灯箱实体", [0, 2.005, -.02], [.93, .2, .61], material.ivory), ...coinDoor([0, .54, -.318])];
    for (const s of [-1, 1]) { p.push(rod("玩家独立球头摇杆", [s * .26, 1.18, -.39], [s * .26, 1.29, -.39], .016, material.dark), ball("摇杆圆握头", [s * .26, 1.31, -.39], [.047, .047, .047], material.red)); for (let i = 0; i < 4; i++) p.push(cylinder("操作台上的独立圆按键", [s * .26 + (i % 2) * .065 - .03, 1.173, -.22 - Math.floor(i / 2) * .063], [.038, .015, .038], material.glass)); }
    return p;
  } },
  { name: "双鼓面节奏游艺机", itemType: "设施", build: () => {
    const p = [box("双鼓机的完整落地底座", [0, .12, 0], [1.9, .24, 1.7], material.dark), box("承托显示器及扬声器的后主柜", [0, 1.1, .45], [1.8, 1.95, .55], material.red), ...screen([0, 1.76, .115], 1.25, .72), box("两只鼓共用的倾斜前支台", [0, .74, -.53], [1.7, .3, .9], material.ivory, [-12, 0, 0]), ...coinDoor([0, .43, -.98])];
    for (const s of [-1, 1]) p.push(cylinder("短筒形鼓控制器的完整鼓腔", [s * .44, 1.04, -.56], [.67, .34, .67], material.wood, [24, 0, 0]), cylinder("倾斜朝向玩家的感应鼓面", [s * .44, 1.2, -.488], [.66, .018, .66], material.ivory, [24, 0, 0]), loop("鼓面边缘的加厚包圈", [s * .44, 1.205, -.485], .333, .018, [24, 0, 0], material.dark), rod("可独立握持的敲鼓棒", [s * .64, 1.06, -.93], [s * .64, 1.06, -.62], .019, material.wood), cord("将鼓棒系回机台的防丢绳", [[s * .64, 1.06, -.93], [s * .83, .62, -.9], [s * .74, .93, -.44]], .003, material.dark), cylinder("后柜底部实际扬声器", [s * .65, .56, .155], [.29, .018, .29], material.dark, [90, 0, 0]));
    return p;
  } },
  { name: "弦钮拨杆节奏游艺机", itemType: "设施", build: () => {
    const p = [box("双吉他控制器游艺机的宽底台", [0, .1, 0], [1.9, .2, 1.1], material.dark), box("上部屏幕的立式后柜", [0, 1.25, .3], [1.65, 2.2, .48], material.red), ...screen([0, 1.79, .015], 1.36, .86), box("控制器下方的完整横向托架", [0, .88, -.4], [1.75, .14, .43], material.ivory), ...coinDoor([0, .43, .035])];
    for (const s of [-1, 1]) {
      p.push(plate("专用控制器的非声学实心琴身", [s * .53, .6, -.65], [[-.13, 0], [.13, 0], [.17, .11], [.12, .2], [.15, .29], [.05, .33], [-.06, .33], [-.16, .24], [-.11, .16], [-.17, .09]], .06, material.wood, [0, 0, -s * 13]), rod("带按弦键的控制器直琴颈", [s * .53, .87, -.65], [s * .53, 1.48, -.65], .055, material.dark), box("琴身中央的弹拨触发横杆", [s * .53, .77, -.686], [.115, .025, .014], material.ivory), rod("额外颤音输入的弯杆", [s * .53 + .08, .72, -.69], [s * .53 + .08, .86, -.71], .008, material.steel), cord("控制器到机台的粗信号线", [[s * .59, .62, -.65], [s * .85, .2, -.2], [s * .6, .63, .06]], .009, material.dark), cord("便于站立演奏的软肩带", [[s * .44, .87, -.62], [s * .34, 1.25, -.55], [s * .53, 1.4, -.62]], .012, material.dark));
      for (let i = 0; i < 5; i++) p.push(box("琴颈上的五枚独立按弦键", [s * .53, 1.1 + i * .063, -.682], [.071, .042, .016], i % 2 ? material.glass : material.red));
    }
    return p;
  } },
  { name: "环屏触摸节奏游艺机", itemType: "设施", build: () => {
    const p = [box("环形节奏机的宽稳底座", [0, .12, 0], [1.22, .24, .95], material.dark), cylinder("上窄下宽的中央承托立柜", [0, .84, .08], [.7, 1.44, .7], material.ivory), cylinder("面向玩家的圆屏后壳", [0, 1.63, 0], [1.25, .24, 1.25], material.red, [90, 0, 0]), cylinder("整块圆形触控屏玻璃", [0, 1.63, -.131], [1.07, .016, 1.07], material.glass, [90, 0, 0]), loop("圆屏外围的连续触摸边框", [0, 1.63, -.15], .612, .06, [90, 0, 0], material.ivory), ...coinDoor([0, .58, -.29])];
    for (let i = 0; i < 8; i++) { const a = i * Math.PI / 4; p.push(box("围绕圆屏的八枚径向感应键", [Math.cos(a) * .58, 1.63 + Math.sin(a) * .58, -.199], [.16, .09, .025], material.glass, [0, 0, i * 45 + 90])); }
    p.push(...[-1, 1].map(s => cylinder("底柜两侧的可见扬声单元", [s * .25, .6, -.27], [.24, .025, .24], material.dark, [90, 0, 0])));
    return p;
  } },
  { name: "座舱方向盘竞速街机", itemType: "设施", build: () => {
    const p = [box("座舱与屏柜共用的长底盘", [0, .11, 0], [1.3, .22, 2.7], material.dark), box("前端倾斜的显示机柜", [0, 1.12, -.92], [1.2, 1.85, .45], material.red, [-6, 0, 0]), ...screen([0, 1.7, -1.19], 1.05, .66, -6), box("方向盘下的倾斜仪表壳", [0, .97, -.52], [1.02, .2, .6], material.ivory, [-12, 0, 0]), ...rideSeat([0, .57, .68]), rod("把方向盘固定到前柜的斜转向轴", [0, .85, -.51], [0, 1.18, -.24], .065), loop("乘员双手操纵的完整方向盘", [0, 1.18, -.24], .2, .025, [55, 0, 0], material.dark), box("脚下油门与制动踏板底", [0, .28, -.35], [.68, .06, .6], material.steel), ...[-1, 1].map(s => box("可独立踩压的两块长踏板", [s * .16, .38, -.46], [.16, .035, .27], material.dark, [-25, 0, 0])), box("座旁挡杆与按钮小台", [.48, .72, .18], [.2, .55, .36], material.red), rod("座旁操纵挡杆", [.48, 1, .18], [.48, 1.18, .17], .026, material.steel), ball("挡杆圆握头", [.48, 1.2, .17], [.07, .07, .07], material.dark)];
    for (const s of [-1, 1]) p.push(rod("方向盘的横向承力辐条", [0, 1.18, -.24], [s * .19, 1.18, -.24], .02, material.steel));
    return p;
  } },
  { name: "侧倾摩托竞速街机", itemType: "设施", build: () => [
    box("摩托模拟器的独立长底座", [0, .13, 0], [1.55, .26, 2.75], material.dark), box("前方与车身分离的完整屏柜", [0, 1.26, -1.01], [1.35, 2.1, .42], material.red), ...screen([0, 1.87, -1.26], 1.15, .75), box("支承整台跨骑控制器的固定基座", [0, .42, .3], [.56, .58, 1.2], material.steel), cylinder("允许玩家左右侧倾的纵向枢轴", [0, .64, .3], [.16, 1.55, .16], material.dark, [90, 0, 0]), ball("跨骑控制器的弧形前车罩", [0, .96, -.27], [.78, .65, .94], material.wood), box("可双腿跨坐的长座", [0, .93, .47], [.36, .18, 1.03], material.dark), box("车尾仿形支承壳", [0, .72, .8], [.44, .34, .53], material.wood), rod("车把中央操纵立轴", [0, 1.02, -.35], [0, 1.34, -.35], .04), rod("跨骑者双手握住的宽车把", [-.45, 1.34, -.35], [.45, 1.34, -.35], .035, material.dark), ...[-1, 1].flatMap(s => [box("跨骑控制器两侧固定脚踏", [s * .44, .43, .26], [.22, .06, .53], material.dark), rod("把脚踏接到倾转主体的连接杆", [s * .18, .62, .26], [s * .44, .43, .26], .05), rod("限制车身侧倾的两侧阻尼筒", [s * .5, .28, .6], [s * .25, .69, .6], .08, material.red)]),
  ] },
  { name: "双摇杆飞行操纵游艺座舱", itemType: "设施", build: () => [
    box("飞行座舱完整地台", [0, .12, 0], [1.8, .24, 2.7], material.steel), ...[-1, 1].map(s => box("半封闭座舱侧壁", [s * .8, .74, .03], [.1, 1.05, 1.95], material.red)), box("前部一体仪表面板", [0, 1.09, -.78], [1.5, .65, .17], material.ivory, [-14, 0, 0]), ...screen([0, 1.72, -1.02], 1.45, .72, -10), ...rideSeat([0, .6, .58]), ...[-1, 1].flatMap(s => [box("双手分别操纵的侧台", [s * .55, .63, .07], [.24, .24, .7], material.dark), rod("具有俯仰滚转输入的操纵杆", [s * .55, .75, -.02], [s * .55, 1.04, -.03], .033, material.steel), ball("手握操纵杆的椭圆握头", [s * .55, 1.07, -.03], [.065, .1, .065], material.dark), box("脚下的方向舵踏板", [s * .21, .36, -.55], [.23, .035, .28], material.dark, [-26, 0, 0])]), rod("座舱上方模拟前风挡的横框", [-.82, 2.2, -.9], [.82, 2.2, -.9], .055), ...[-1, 1].map(s => rod("前风挡上沿的倾斜侧框", [s * .82, 1.35, -.9], [s * .82, 2.2, -.9], .055)),
  ] },
  { name: "连绳光枪靶射游艺机", itemType: "设施", build: () => {
    const p = [box("完整立柜的宽底脚", [0, .12, 0], [1.8, .24, 1.5], material.dark), ...[-1, 1].map(s => plate("倾斜屏柜的厚侧形板", [s * .82, .24, .1], [[-.35, 0], [.43, 0], [.52, .8], [.2, 1.15], [.3, 2.2], [-.35, 2.2]], .055, material.red, [0, 90, 0])), ...screen([0, 1.9, -.2], 1.45, 1.02, -8), box("上方封闭扬声器横柜", [0, 2.49, -.01], [1.77, .22, .7], material.ivory), box("能放置两把专用光枪的前台", [0, 1.15, -.59], [1.8, .15, .6], material.dark), ...coinDoor([0, .64, -.6])];
    for (const s of [-1, 1]) p.push(box("专用光学指向控制器的前壳", [s * .48, 1.32, -.7], [.08, .11, .28], material.glass), box("专用控制器的手握柄", [s * .48, 1.2, -.6], [.065, .18, .08], material.dark, [-12, 0, 0]), cylinder("只收取屏幕位置光信号的前透镜", [s * .48, 1.32, -.848], [.055, .018, .055], material.dark, [90, 0, 0]), cord("连接控制器与主柜的螺旋软线", [[s * .48, 1.12, -.6], [s * .7, .65, -.7], [s * .64, 1.14, -.35]], .014, material.dark));
    return p;
  } },
  { name: "悬袋拳击测力游艺机", itemType: "设施", build: () => [
    box("测力机落地宽底座", [0, .12, 0], [1.4, .24, 1.5], material.dark), plate("立柜厚侧承托板左", [-.5, .24, .2], [[-.36, 0], [.35, 0], [.35, 2.2], [-.6, 2.2], [-.73, 1.95], [-.42, 1.78]], .045, material.red, [0, 90, 0]), plate("立柜厚侧承托板右", [.5, .24, .2], [[-.36, 0], [.35, 0], [.35, 2.2], [-.6, 2.2], [-.73, 1.95], [-.42, 1.78]], .045, material.red, [0, 90, 0]), box("连通到前伸测力架的上机头", [0, 2.26, -.28], [1.05, .33, 1.15], material.ivory), box("立柜后方封闭机体", [0, 1.16, .31], [.95, 1.85, .38], material.red), ...screen([0, 1.74, .085], .6, .36), cylinder("拳袋悬挂并连接传感器的顶轴", [0, 2.04, -.57], [.1, .23, .1], material.dark), ball("供玩家一拳击中的梨形软拳袋", [0, 1.68, -.57], [.39, .52, .39], material.wood), cylinder("拳袋顶部的承拉连接颈", [0, 1.98, -.57], [.08, .16, .08], material.dark), ...coinDoor([0, .56, .105]),
  ] },
  { name: "落锤撞铃力量游艺塔", itemType: "设施", build: () => {
    const p = [box("撞铃力量塔的宽落地台", [0, .13, 0], [2.6, .26, 3.5], material.wood), ...[-1, 1].map(s => rod("高塔固定斜撑", [s * 1.05, .26, .8], [0, 4.6, .8], .12, material.dark)), box("沿竖直方向上升的撞子导向背板", [0, 2.55, .8], [.52, 4.6, .12], material.red), ...[-1, 1].map(s => rod("约束撞子侧移的金属导轨", [s * .17, .27, .7], [s * .17, 4.75, .7], .025)), part("塔顶下口真正开放的撞铃罩", "lathe", material.steel, [0, 4.87, .67], [1, 1, 1], [0, 0, 0], { profile: [{ x: 0, y: .15 }, { x: .08, y: .14 }, { x: .15, y: .06 }, { x: .2, y: -.05 }, { x: .31, y: -.12 }, { x: .29, y: -.13 }, { x: .18, y: -.05 }, { x: .13, y: .04 }, { x: .065, y: .11 }, { x: 0, y: .12 }].reverse() }), rod("固定在背板上方的铃罩悬架", [0, 4.72, .8], [0, 5.08, .8], .06), rod("向前伸到铃顶的短吊臂", [0, 5.08, .8], [0, 5.08, .67], .06), rod("吊臂与铃顶的连接颈", [0, 5.08, .67], [0, 5.02, .67], .035), box("导轨下方的运动撞子", [0, .6, .66], [.2, .21, .15], material.dark), rod("打击垫与撞子之间的翘板杠杆", [0, .32, -1], [0, .44, .64], .11, material.steel), cylinder("翘板中部的横向支点", [0, .28, -.1], [.16, .75, .16], material.dark, [0, 0, 90]), cylinder("可用木锤击打的厚圆垫", [0, .42, -.95], [.55, .17, .55], material.red), rod("落锤长木握柄", [.78, .08, -1.3], [.78, .08, -.03], .045, material.wood), cylinder("横装的重软包木锤头", [.78, .13, -1.3], [.25, .63, .25], material.dark, [0, 0, 90])];
    for (let i = 0; i < 8; i++) p.push(rod("力量行程的实体横刻标", [-.23, 1 + i * .45, .724], [.23, 1 + i * .45, .724], .009, material.ivory));
    return p;
  } },
  { name: "双绳电动跳绳游艺架", itemType: "设施", build: () => {
    const p = [box("两列电机与跳跃区的共用底台", [0, .1, 0], [4.6, .2, 3.2], material.dark), box("中央独立感应跳跃坪", [0, .235, 0], [1.7, .07, 1.75], material.glass), ...[-1, 1].map(s => box("封住双曲柄驱动的侧机柜", [s * 1.85, .95, 0], [.55, 1.65, .9], material.red)), ...screen([0, 2.05, 1.2], 1.1, .55), ...[-1, 1].map(s => rod("支住后屏的落地立杆", [s * .5, .2, 1.2], [s * .5, 2.05, 1.2], .055))];
    for (const z of [-1, 1]) {
      p.push(cord("由两侧曲柄同步甩动的独立软跳绳", [[-1.55, 1.55 + z * .23, z * .22], [-.9, z < 0 ? .4 : 2.4, z * .65], [0, z < 0 ? .29 : 2.7, z * .75], [.9, z < 0 ? .4 : 2.4, z * .65], [1.55, 1.55 + z * .23, z * .22]], .018, z < 0 ? material.ivory : material.wood));
      for (const s of [-1, 1]) p.push(cylinder("侧柜面向跳跃区的旋转绳轴", [s * 1.58, 1.55, z * .22], [.11, .25, .11], material.steel, [0, 0, 90]), rod("与绳轴同步回转的曲柄", [s * 1.58, 1.55, z * .22], [s * 1.58, 1.55 + z * .23, z * .22], .04, material.dark));
    }
    return p;
  } },
  { name: "气缸顶杆打地鼠游艺台", itemType: "设施", build: () => {
    const holes = Array.from({ length: 6 }, (_, i): [number, number][] => Array.from({ length: 16 }, (_, j) => [Math.cos(-j * Math.PI / 8) * .105 + (i % 3 - 1) * .37, Math.sin(-j * Math.PI / 8) * .105 + (Math.floor(i / 3) - .5) * .36]));
    const p = [box("打地鼠台落地柜底板", [0, .04, 0], [1.48, .08, 1.15], material.dark), ...[-1, 1].flatMap(s => [box("给活动顶杆留出内部空间的侧柜壁", [s * .72, .5, 0], [.04, .84, 1.15], material.red), box("前后完整柜面薄壁", [0, .5, s * .555], [1.4, .84, .04], material.red)]), piercedPanel("给六个活动顶杆保留真实开口的台面", [0, .92, 0], [[-.76, -.59], [.76, -.59], [.76, .59], [-.76, .59]], holes, .04, material.ivory), box("台后计分器的竖立机头", [0, 1.27, .52], [1.43, .65, .18], material.red), ...screen([0, 1.38, .415], .87, .26), ...coinDoor([0, .48, -.59])];
    for (let i = 0; i < 6; i++) { const x = (i % 3 - 1) * .37, z = (Math.floor(i / 3) - .5) * .36, y = i % 2 ? 1 : 1.14; p.push(cylinder("能够在台面孔内上下运动的软包鼠柱", [x, y - .06, z], [.18, .25, .18], material.wood), ball("柔软圆顶活动靶头", [x, y + .055, z], [.19, .14, .19], material.wood), ...[-1, 1].map(s => ball("靶头的小圆耳", [x + s * .075, y + .1, z], [.056, .056, .04], material.wood))); }
    for (const s of [-1, 1]) p.push(rod("玩家击打用的软锤握柄", [s * .6, 1.02, -.58], [s * .6, 1.02, -.3], .026, material.dark), cylinder("防止磕碰台面的软锤头", [s * .6, 1.06, -.58], [.13, .24, .13], material.glass, [0, 0, 90]), cord("软锤到台面的短防丢绳", [[s * .6, 1.02, -.3], [s * .74, .73, -.3], [s * .7, .95, -.1]], .004, material.dark));
    return p;
  } },
  { name: "反折回球连续投篮机", itemType: "设施", build: () => {
    const p = [box("投篮机独立长底盘", [0, .11, 0], [2.1, .22, 4.8], material.dark), ...[-1, 1].flatMap(x => [-1, 1].map(z => rod("投篮机的四根整体承载立架", [x * .95, .22, z * 2.1], [x * .95, 3.4, z * 2.1], .065, material.steel))), box("后方标准比例的投篮背板", [0, 2.8, 2.05], [1.65, 1.05, .075], material.ivory), loop("背板前的实际开放篮圈", [0, 2.53, 1.66], .23, .022, [0, 0, 0], material.red), box("球落下后沿斜面返回玩家的长底板", [0, .92, 0], [1.83, .04, 4.15], material.glass, [-10, 0, 0]), box("前端球回收托台", [0, .63, -2.12], [1.83, .12, .55], material.ivory), box("前端隔开投币机构的柜面", [0, .4, -2.27], [1.83, .57, .15], material.red), ...coinDoor([0, .39, -2.357])];
    for (const s of [-1, 1]) p.push(rod("前后立架之间承托护网的上横梁", [s * .95, 3.35, -2.1], [s * .95, 3.35, 2.1], .045, material.steel), piercedPanel("投篮区两侧的真实大网孔护网", [s * .95, .77, 0], [[0, -2.1], [2.58, -2.1], [2.58, 2.1], [0, 2.1]], Array.from({ length: 20 }, (_, i): [number, number][] => { const y = Math.floor(i / 5) * .58 + .08, z = (i % 5) * .81 - 2.02; return [[y, z], [y, z + .7], [y + .48, z + .7], [y + .48, z]]; }), .014, material.dark, [0, 0, 90]));
    for (let i = 0; i < 6; i++) { const a = i * Math.PI / 3; p.push(cord("从篮圈向下收口的篮网绳", [[Math.cos(a) * .23, 2.53, 1.66 + Math.sin(a) * .23], [Math.cos(a) * .11, 2.12, 1.66 + Math.sin(a) * .11]], .004, material.ivory)); }
    for (const s of [-1, 1]) p.push(ball("被回收托台接住的篮球", [s * .4, .86, -2.05], [.34, .34, .34], material.wood));
    return p;
  } },
  { name: "机械杆控桌面冰球台", itemType: "设施", build: () => {
    const p = [box("冰球桌内部的薄承托底层", [0, .81, 0], [1.1, .05, 1.9], material.wood), ...[-1, 1].flatMap(x => [-1, 1].map(z => box("把冰球台托到腰高的四根落地桌腿", [x * .45, .4, z * .8], [.08, .8, .08], material.dark))), ...[-1, 1].map(s => box("冰球台长边保护壁", [s * .57, .91, 0], [.045, .18, 1.95], material.red)), piercedPanel("供选手沿真实导槽滑动的平整冰面", [0, .885, 0], [[-.55, -.94], [.55, -.94], [.55, .94], [-.55, .94]], [-.34, -.11, .11, .34].map(x => [[x - .009, -.68], [x - .009, .68], [x + .009, .68], [x + .009, -.68]] as [number, number][]), .024, material.ivory)];
    for (let i = 0; i < 4; i++) {
      const x = [-.34, -.11, .11, .34][i]!, side = i % 2 ? 1 : -1, z = side * .35;
      p.push(rod("能推拉并旋转冰球选手的金属操纵杆", [x, .867, -side * .55], [x, .867, side * 1.16], .011), cylinder("操纵杆末端防滑握把", [x, .867, side * 1.2], [.04, .15, .04], material.dark, [90, 0, 0]), rod("穿过冰面导槽的竖直连动小轴", [x, .867, z], [x, .97, z], .014), box("杆控冰球选手的厚身", [x, 1.03, z], [.06, .1, .025], side > 0 ? material.glass : material.red), ball("杆控小人的圆头", [x, 1.102, z], [.044, .044, .044], material.ivory), rod("小人向侧面伸出的冰球杆", [x, .97, z], [x + .1, .925, z + side * .04], .012, material.dark));
    }
    for (const s of [-1, 1]) p.push(...[-1, 1].map(x => rod("端面开放球门的竖直门柱", [x * .18, .91, s * .84], [x * .18, 1.09, s * .84], .018, material.steel)), rod("球门上横梁", [-.18, 1.09, s * .84], [.18, 1.09, s * .84], .018), ...[-1, 1].map(x => box("端面球门两旁的止球围壁", [x * .38, .96, s * .94], [.34, .13, .035], material.red)));
    p.push(cylinder("能被杆击送进球门的薄冰球", [0, .923, 0], [.044, .016, .044], material.dark));
    return p;
  } },
  { name: "人力跑轮滚环游乐器", itemType: "设施", build: () => {
    const p = [box("支承跑轮的完整固定底台", [0, .11, 0], [4.3, .22, 3.2], material.steel), ...[-1, 1].map(s => loop("轴线水平且中央敞开的承载跑轮圈", [s * .85, 2.8, 0], 2.4, .08, [0, 0, 90], material.red))];
    for (let i = 0; i < 24; i++) { const a = i * Math.PI / 12; p.push(box("连接两侧环并组成连续内侧跑面的木踏板", [0, 2.8 + Math.sin(a) * 2.35, Math.cos(a) * 2.35], [1.7, .07, .64], material.wood, [90 - i * 15, 0, 0])); }
    for (const x of [-1, 1]) for (const z of [-1, 1]) p.push(cylinder("支承两侧轮圈的地面导向滚轮", [x * .85, .32, z * .6], [.36, .25, .36], material.dark, [0, 0, 90]), box("导向滚轮下的固定支座", [x * .85, .24, z * .6], [.5, .22, .55], material.steel));
    p.push(box("从轴向进入敞口跑轮的低踏台", [1.55, .28, 0], [1.2, .56, 1.5], material.ivory));
    return p;
  } },
  { name: "旋转隧道平衡步桥", itemType: "设施", build: () => {
    const p = [part("在固定桥外独立旋转且两端贯通的隧道鼓", "lathe", material.red, [0, 3, 0], [1, 1, 1], [90, 0, 0], { profile: [{ x: 2.5, y: -4.1 }, { x: 2.5, y: 4.1 }, { x: 2.44, y: 4.1 }, { x: 2.44, y: -4.1 }, { x: 2.5, y: -4.1 }] }), box("完全不随外鼓旋转的贯通行走桥", [0, 1.36, 0], [1.35, .16, 10.6], material.wood)];
    for (const x of [-1, 1]) for (const z of [-1, 1]) p.push(box("固定桥在转鼓两端以外的落地支腿", [x * .54, .68, z * 4.9], [.12, 1.36, .15], material.dark), box("转鼓独立滚轮支架的宽落地脚", [x * 1.3, .14, z * 3.4], [1.2, .28, 1.3], material.steel), cylinder("支承外鼓回转的独立驱动胶轮", [x * 1.1, .56, z * 3.4], [.65, .4, .65], material.dark, [90, 0, 0]));
    for (const s of [-1, 1]) { p.push(rod("固定桥两侧完整保护扶手", [s * .66, 2.3, -5.2], [s * .66, 2.3, 5.2], .04, material.ivory)); for (let i = 0; i < 5; i++) p.push(rod("不接触旋转鼓的固定桥栏杆立杆", [s * .66, 1.44, -5 + i * 2.5], [s * .66, 2.3, -5 + i * 2.5], .035, material.ivory)); }
    for (let i = 0; i < 12; i++) { const a = i * Math.PI / 6; p.push(rod("沿转鼓长度连接两端的外侧加劲条", [Math.cos(a) * 2.53, 3 + Math.sin(a) * 2.53, -4.1], [Math.cos(a) * 2.53, 3 + Math.sin(a) * 2.53, 4.1], .045, material.wood)); }
    return p;
  } },
  { name: "循环攀爬天梯机", itemType: "设施", build: () => {
    const p = [box("循环天梯的独立落地底盘", [0, .12, 0], [2.5, .24, 2.7], material.steel), ...[-1, 1].map(s => rod("天梯两侧完整固定框柱", [s * .95, .24, 0], [s * .95, 4.2, 0], .15, material.dark)), ...[.72, 4.2].map(y => cylinder("同轴驱动两侧链条的完整滚筒轴", [0, y, 0], [.24, 2.1, .24], material.steel, [0, 0, 90])), box("底端链轮减速驱动机箱", [1.07, .7, .05], [.55, .8, .65], material.red)];
    for (const s of [-1, 1]) {
      const points: Triple[] = [];
      for (let i = 0; i <= 8; i++) { const a = i * Math.PI / 8; points.push([s * .73, 4.2 + Math.sin(a) * .33, -Math.cos(a) * .33]); }
      for (let i = 0; i <= 8; i++) { const a = i * Math.PI / 8; points.push([s * .73, .72 - Math.sin(a) * .33, Math.cos(a) * .33]); }
      points.push(points[0]!);
      p.push(cord("把上下攀爬横档连成闭合回路的侧链", points, .03, material.dark));
    }
    for (let i = 0; i < 10; i++) for (const s of [-1, 1]) p.push(rod("随侧链向下运动及从背后返回的横档", [-.73, .86 + i * .33, s * .33], [.73, .86 + i * .33, s * .33], .045, material.ivory));
    p.push(box("机器前方独立软落垫", [0, .34, -.95], [2, .2, 1.2], material.glass));
    return p;
  } },
  { name: "强制透视错觉展演室", itemType: "设施", build: () => {
    const frontLeft: Triple = [-1.8, .2, -1.5], frontRight: Triple = [1.8, .2, -1.5], backLeft: Triple = [-3.6, -1.2, 2], backRight: Triple = [2.16, -.08, -.8], topFrontLeft: Triple = [-1.8, 3.2, -1.5], topFrontRight: Triple = [1.8, 3.2, -1.5], topBackLeft: Triple = [-3.6, 4.8, 2], topBackRight: Triple = [2.16, 3.52, -.8];
    const p = [panel("向深端降低并实际倾斜的错觉室地板", [frontLeft, frontRight, backRight, backLeft], material.wood), panel("与斜地板共同形成投影矩形的高低屋顶", [topFrontLeft, topBackLeft, topBackRight, topFrontRight]), panel("远端高大的左侧室壁", [frontLeft, backLeft, topBackLeft, topFrontLeft]), panel("近端较低的右侧室壁", [frontRight, topFrontRight, topBackRight, backRight]), panel("左右深度不同的倾置后墙", [backLeft, backRight, topBackRight, topBackLeft], material.glass), box("固定观察点前的站立平台", [0, -.02, -4.6], [2.1, .2, 1.8], material.dark), rod("精确对准变形房间的观察孔立架", [0, .08, -5], [0, 1.6, -5], .07, material.dark), loop("限制观看位置的小型真实观察孔", [0, 1.6, -5], .075, .025, [90, 0, 0], material.red)];
    for (const q of [frontLeft, frontRight, backLeft, backRight]) p.push(rod("从最低地基承托斜地板的真实短支柱", [q[0], -1.25, q[2]], [q[0], q[1] - .035, q[2]], .12, material.dark));
    for (const x of [-1, 1]) for (const z of [-1, 1]) p.push(rod("将观察平台接到同一地面的落地支腿", [x * .9, -1.25, -4.6 + z * .7], [x * .9, -.12, -4.6 + z * .7], .1, material.dark));
    for (let i = 0; i < 5; i++) { const top = -1.03 + i * .24; p.push(box("上到固定观察位置的独立踏步", [0, (-1.25 + top) / 2, -7 + i * .36], [1.05, top + 1.25, .4], material.wood)); }
    p.push(rod("远端实高相同的比较立杆", [-3.2, -1.12, 1.8], [-3.2, .38, 1.8], .055, material.red), rod("近端实高相同的比较立杆", [1.95, -.06, -.85], [1.95, 1.44, -.85], .055, material.red));
    return p;
  } },
  { name: "双端空中杂技行走轮", itemType: "设施", build: () => {
    const p: ModelPart[] = [];
    for (const x of [-1, 1]) for (const z of [-1, 1]) p.push(box("高空行走轮的独立锚固基础", [x * 4, .18, z * 2.2], [1.5, .36, 1.8], material.steel), rod("把中央轴架到高空的前后大斜撑", [x * 4, .36, z * 2.2], [0, 12, z * 2.2], .3, material.dark));
    p.push(rod("横跨前后支架的主回转轴", [0, 12, -2.4], [0, 12, 2.4], .45), rod("连接两端跑轮的整体平衡转臂", [-5, 7, 0], [5, 17, 0], .4, material.red));
    for (const s of [-1, 1]) {
      const x = s * 5, y = 12 + s * 5;
      p.push(rod("端跑轮各自独立的回转轴", [x, y, -.85], [x, y, .85], .18));
      for (const z of [-1, 1]) { p.push(loop("两侧实际开放的杂技跑轮边圈", [x, y, z * .7], 2.15, .065, [90, 0, 0], material.ivory)); for (let i = 0; i < 4; i++) { const a = i * Math.PI / 2; p.push(rod("跑轮侧面从短轴通向边圈的辐条", [x, y, z * .7], [x + Math.cos(a) * 2.15, y + Math.sin(a) * 2.15, z * .7], .06)); } }
      for (let i = 0; i < 18; i++) { const a = i * Math.PI / 9; p.push(box("两端大圈内供演员行走的连续踏板", [x + Math.cos(a) * 2.1, y + Math.sin(a) * 2.1, 0], [.07, .75, 1.4], material.wood, [0, 0, i * 20])); }
    }
    return p;
  } },
  { name: "空中绸带独立表演吊架", itemType: "设施", build: () => {
    const p = [box("绸吊表演的独立厚软垫", [0, .15, 0], [5.1, .3, 4.5], material.glass), ...[-1, 1].flatMap(x => [-1, 1].flatMap(z => [box("四根斜吊架独立落地的平底脚座", [x * 2.7, .08, z * 2.3], [.55, .16, .55], material.steel), rod("四脚向中心吊点收拢的高挑钢架", [x * 2.7, .16, z * 2.3], [x * .55, 8.35, 0], .16, material.dark)])), rod("两个顶端吊架之间的承载横梁", [-.65, 8.35, 0], [.65, 8.35, 0], .23), loop("承重横梁下的锁闭吊环", [0, 8.16, 0], .17, .035, [90, 0, 0], material.steel)];
    for (const s of [-1, 1]) {
      const outline: [number, number][] = [];
      for (let i = 0; i <= 8; i++) { const y = .52 + i * .94, center = s * (.18 + Math.sin(i * .65) * .18), half = i === 8 ? .065 : .3; outline.push([center - half, y]); }
      for (let i = 8; i >= 0; i--) { const y = .52 + i * .94, center = s * (.18 + Math.sin(i * .65) * .18), half = i === 8 ? .065 : .3; outline.push([center + half, y]); }
      p.push(plate("可分开握持并有连续侧缘的长绸布", [0, 0, s * .11], outline, .012, s < 0 ? material.red : material.ivory, [0, 0, 0]), rod("绸布上端实际穿过吊环的固定结颈", [s * (.18 + Math.sin(5.2) * .18), 8.04, s * .11], [0, 8, 0], .045, s < 0 ? material.red : material.ivory));
    }
    return p;
  } },
  { name: "水面充气攀爬冰山", itemType: "设施", build: () => {
    const vertices: { x: number; y: number; z: number }[] = [], indices: number[] = [];
    for (const [r, y] of [[3.5, .3], [2.5, 2.1], [.65, 5.4]]) for (let i = 0; i < 8; i++) { const a = i * Math.PI / 4; vertices.push({ x: Math.cos(a) * r!, y: y!, z: Math.sin(a) * r! }); }
    for (let level = 0; level < 2; level++) for (let i = 0; i < 8; i++) { const a = level * 8 + i, b = level * 8 + (i + 1) % 8, c = a + 8, d = b + 8; indices.push(a, c, b, b, c, d); }
    vertices.push({ x: 0, y: .3, z: 0 }, { x: 0, y: 5.4, z: 0 });
    for (let i = 0; i < 8; i++) indices.push(24, i, (i + 1) % 8, 25, 16 + (i + 1) % 8, 16 + i);
    const p = [part("整体密封且具有八个大倾面的充气山体", "mesh", material.ivory, [0, 0, 0], [1, 1, 1], [0, 0, 0], { vertices: indices.map(i => vertices[i]!) }), ball("托住山体的宽扁漂浮底囊", [0, .26, 0], [7.2, .52, 7.2], material.glass)];
    for (let side = 0; side < 4; side++) {
      const a = side * Math.PI / 2 + Math.PI / 8;
      for (let row = 0; row < 5; row++) { const y = .9 + row * .76, radius = y < 2.1 ? 3.5 - (y - .3) / 1.8 : 2.5 - (y - 2.1) * 1.85 / 3.3, r = radius * Math.cos(Math.PI / 8); p.push(cord("供攀爬者独立抓握的闭口软把", [[Math.cos(a) * (r + .02) - Math.sin(a) * .16, y, Math.sin(a) * (r + .02) + Math.cos(a) * .16], [Math.cos(a) * (r + .17), y + .12, Math.sin(a) * (r + .17)], [Math.cos(a) * (r + .02) + Math.sin(a) * .16, y, Math.sin(a) * (r + .02) - Math.cos(a) * .16]], .025, material.red)); }
      p.push(cord("从浮体向水下锚点伸出的系留短绳", [[Math.cos(a) * 3.45, .25, Math.sin(a) * 3.45], [Math.cos(a) * 4.3, .02, Math.sin(a) * 4.3]], .025, material.dark));
    }
    return p;
  } },
  { name: "冲击发射双端大气枕", itemType: "设施", build: () => {
    const p = [ball("把一端冲击传到另一端的整体密封大气枕", [0, .9, 0], [12, 1.8, 4.3], material.glass), box("从高处跳向气枕一端的独立平台", [-6.25, 4.25, 0], [2.1, .2, 2.8], material.wood), ...[-1, 1].flatMap(x => [-1, 1].map(z => rod("起跳平台独立落水支柱", [-6.25 + x * .85, 0, z * 1.2], [-6.25 + x * .85, 4.15, z * 1.2], .16, material.dark))), ...[-1, 1].map(s => rod("平台入口两侧的上扶手", [-7.1, 5.2, s * 1.2], [-5.4, 5.2, s * 1.2], .04, material.ivory))];
    for (const s of [-1, 1]) for (const x of [-7.1, -5.4]) p.push(rod("平台扶手固定立杆", [x, 4.35, s * 1.2], [x, 5.2, s * 1.2], .04, material.ivory));
    for (let i = 0; i < 9; i++) p.push(box("上到跳台的真实外侧踏板", [-7.7, .25 + i * .47, -2.7 + i * .32], [.9, .14, .35], material.steel));
    for (const s of [-1, 1]) p.push(rod("台侧楼梯的连续承托斜梁", [-7.7 + s * .52, .12, -2.9], [-7.7 + s * .52, 4.25, 0], .1), cord("把大气枕定位在跳台前的水面系留绳", [[s * 4.4, .36, 1.5], [s * 5.8, .02, 2.8]], .035, material.dark));
    return p;
  } },
  { name: "双塔吊索俯卧飞行架", itemType: "设施", build: () => {
    const p: ModelPart[] = [];
    for (const x of [-1, 1]) for (const z of [-1, 1]) p.push(box("俯卧飞行吊架四角固定基础", [x * 8, .2, 3 + z * 3.2], [1.8, .4, 1.8], material.steel), rod("两侧塔的高挑固定索架", [x * 8, .4, 3 + z * 3.2], [x * 6.5, 17, 3], .28, material.dark));
    p.push(rod("两侧塔顶的刚性横向联梁", [-6.5, 17, 3], [6.5, 17, 3], .24, material.red), box("承接俯卧吊带的低登乘台", [0, 1.8, -6], [3.2, .2, 2.7], material.wood), ...[-1, 1].map(s => rod("登乘台独立支腿", [s * 1.2, 0, -6], [s * 1.2, 1.7, -6], .14)), box("承托三人俯卧的完整帆布吊兜", [0, 2.6, -6], [2.3, .12, 1.45], material.glass));
    for (const s of [-1, 1]) p.push(rod("长度固定且绕塔顶摆荡的承载吊索", [s * 6.5, 17, 3], [s * 1, 3.2, -6], .033, material.dark), cord("吊索下端连接俯卧吊带的分叉织带", [[s * 1, 2.66, -6.63], [s * 1, 3.2, -6], [s * 1, 2.66, -5.37]], .024, material.red));
    p.push(...[-1, 1].flatMap(s => [box("后方提升塔的独立落地足座", [s * 2.5, .15, -16], [1, .3, 1.2], material.steel), rod("后方提升索塔的分叉固定腿", [s * 2.5, .3, -16], [0, 13.5, -16], .25, material.dark)]), cylinder("将吊带拉向释放位置的提升卷筒", [0, .8, -16], [.8, 1.5, .8], material.steel, [0, 0, 90]), cord("与承重摆荡索独立的提升牵引绳", [[0, .8, -16], [0, 13.5, -16], [0, 3.2, -6]], .025, material.dark));
    return p;
  } },
  { name: "闭环钢索滑水牵引架", itemType: "设施", build: () => {
    const points = Array.from({ length: 5 }, (_, i): Triple => { const a = i * Math.PI * 2 / 5; return [Math.cos(a) * 18, 9.8, Math.sin(a) * 18]; }), p: ModelPart[] = [];
    for (let i = 0; i < 5; i++) {
      const q = points[i]!, next = points[(i + 1) % 5]!, a = i * Math.PI * 2 / 5;
      const outgoing = a + Math.PI / 5, tangentStart: Triple = [q[0] + Math.cos(outgoing) * .6125, q[1], q[2] + Math.sin(outgoing) * .6125], tangentEnd: Triple = [next[0] + Math.cos(outgoing) * .6125, next[1], next[2] + Math.sin(outgoing) * .6125];
      p.push(box("闭环各转向塔的独立岸侧基础", [Math.cos(a) * 20, .22, Math.sin(a) * 20], [3.4, .44, 3.4], material.steel), rod("岸侧斜塔挑向水上绳道的承载立柱", [Math.cos(a) * 20, .44, Math.sin(a) * 20], q, .23, material.dark), loop("引导连续牵引钢索转向的开放滑轮", q, .6, .075, [0, 0, 0], material.red), rod("沿两轮公切线闭合的连续驱动钢索", tangentStart, tangentEnd, .025, material.steel), cord("沿转向滑轮外缘过弯的钢索弧段", Array.from({ length: 5 }, (_, j): Triple => { const b = a - Math.PI / 5 + j * Math.PI / 10; return [q[0] + Math.cos(b) * .6125, q[1], q[2] + Math.sin(b) * .6125]; }), .0125, material.steel), rod("塔背向外固定的稳定拉索", [Math.cos(a) * 20, .44, Math.sin(a) * 20], [Math.cos(a) * 23, .02, Math.sin(a) * 23], .045, material.dark));
    }
    const pickup: Triple = [points[0]![0] * .35 + points[1]![0] * .65 + Math.cos(Math.PI / 5) * .6125, 9.8, points[0]![2] * .35 + points[1]![2] * .65 + Math.sin(Math.PI / 5) * .6125];
    p.push(box("主塔旁的低位驱动控制柜", [20.8, .75, .8], [1.2, 1.5, .9], material.red), cylinder("主塔滑轮的独立电动驱动头", [18, 9.95, 0], [.55, .3, .55], material.dark), cord("从闭环实际公切线上伸向滑水者的牵引绳", [pickup, [7.7, 4.8, 8.9], [4.8, .65, 4.9]], .016, material.dark), rod("滑水者握持的横向拉把", [4.45, .65, 4.9], [5.15, .65, 4.9], .035, material.red), box("主塔内侧的开放起滑登乘小台", [15, .38, 2.5], [3.5, .2, 2.6], material.wood), ...[-1, 1].map(s => rod("起滑台落地支柱", [15 + s * 1.3, 0, 2.5], [15 + s * 1.3, .28, 2.5], .12)));
    return p;
  } },
  { name: "机械曲面冲浪板平台", itemType: "设施", build: () => {
    const vertices: { x: number; y: number; z: number }[] = [], indices: number[] = [];
    for (const [z, width, y] of [[-1.65, .045, .1], [-1.38, .27, .02], [-.75, .41, 0], [.3, .43, 0], [1.2, .32, .05], [1.65, .14, .16]]) vertices.push({ x: -width!, y: y! - .04, z: z! }, { x: width!, y: y! - .04, z: z! }, { x: width!, y: y! + .04, z: z! }, { x: -width!, y: y! + .04, z: z! });
    for (let i = 0; i < 5; i++) for (let j = 0; j < 4; j++) { const a = i * 4 + j, b = i * 4 + (j + 1) % 4; indices.push(a, b, b + 4, a, b + 4, a + 4); }
    indices.push(0, 3, 2, 0, 2, 1, 20, 21, 22, 20, 22, 23);
    const p = [ball("保护站立练习者的整圈软缓冲底垫", [0, .32, 0], [6.6, .64, 5.6], material.glass), cylinder("承担左右滚转的固定低机座", [0, .71, 0], [.9, .8, .9], material.dark), cylinder("前后俯仰的独立横向轴套", [0, 1.02, 0], [.17, 1.25, .17], material.steel, [0, 0, 90]), rod("横轴上另设的纵向滚转短轴", [0, 1.12, -.7], [0, 1.12, .7], .13, material.steel), box("把两个运动轴接到踏板下方的刚性安装鞍座", [0, 1.2, 0], [.5, .15, .8], material.steel), part("首尾真实向上弯曲且有完整封边的长冲浪踏板", "mesh", material.ivory, [0, 1.3, 0], [1, 1, 1], [0, 0, 0], { vertices: indices.map(i => vertices[i]!) }), ...[-1, 1].flatMap(x => [-1, 1].map(z => rod("分别约束踏板四角运动的独立阻尼支腿", [x * .75, .55, z * .95], [x * .26, 1.26, z * .95], .09, material.red))), box("踏板后脚的独立防滑软垫", [0, 1.348, -.55], [.56, .016, .55], material.dark), box("与前段弧面斜率一致的前脚防滑软垫", [0, 1.362, .55], [.56, .016, .55], material.dark, [-3.18, 0, 0]), box("侧面操作员的完整控制立柜", [2.6, .83, .7], [.55, 1.3, .5], material.red), ...screen([2.6, 1.54, .44], .42, .25)];
    return p;
  } },
];
