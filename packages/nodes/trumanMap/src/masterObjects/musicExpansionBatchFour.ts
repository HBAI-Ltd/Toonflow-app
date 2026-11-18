import { part, type ModelPart, type Triple } from "../assetModelParts";
import { BoxGeometry, Euler, Quaternion, Vector3 } from "three";
import { combineMeshes } from "../natureParts";
import { sweptProfile } from "../masterNature/shared";
import { box, cylinder, rod, ball, loop, cord, plate, piercedPanel, material, type MasterPrototype } from "./parts";
import { soundBox, hollowPipe, bellowsFold, springWire } from "./musicExpansionBatchOne";

function strings(count: number, startY: number, endY: number, width: number, startZ: number, endZ: number): ModelPart[] {
  return Array.from({ length: count }, (_, index) => { const x = (index / Math.max(1, count - 1) - .5) * width; return rod("由琴桥分别斜接到弦枕的独立张弦", [x, startY, startZ], [x, endY, endZ], .0015, material.steel); });
}

function sanxian(): ModelPart[] {
  const outline: [number, number][] = [[-.1, .015], [.1, .015], [.14, .05], [.145, .21], [.1, .26], [-.1, .26], [-.145, .21], [-.14, .05]], parts = soundBox(outline, .095, []);
  parts[2]!.name = "琴鼓背面独立张紧的第二张皮膜";
  parts[2]!.color = material.ivory;
  parts.push(rod("无品而截面圆润的三弦长琴颈", [0, .23, .012], [0, 1.11, .012], .038, material.dark), box("向后折转的长弦轴头", [0, 1.19, .037], [.052, .2, .04], material.wood, [25, 0, 0]), box("双面蒙皮琴鼓上的小琴马", [0, .085, -.067], [.065, .028, .025], material.wood), ...strings(3, .08, 1.24, .028, -.082, -.022), ...[1.1, 1.16, 1.22].map(y => rod("弦轴头侧向穿过的三只调音轴", [-.075, y, .015], [.075, y, .015], .012, material.wood)));
  return parts;
}

function masenqo(): ModelPart[] {
  const parts = soundBox([[0, .025], [.17, .19], [0, .355], [-.17, .19]], .11, []);
  parts.push(rod("贯穿菱形膜箱的单根木琴杆", [0, .045, .015], [0, 1.02, .015], .035, material.wood), rod("顶端唯一的横穿调音轴", [-.08, .96, .015], [.08, .96, .015], .019, material.dark), box("膜面上的单弦短琴桥", [0, .16, -.072], [.055, .03, .023], material.wood), rod("在菱形琴箱正面拉紧的唯一主弦", [0, .07, -.084], [0, .98, -.025], .002, material.ivory), cord("向外拱起的独立擦奏弓杆", [[.27, .018, -.3], [.3, .05, 0], [.27, .018, .3]], .006, material.wood), rod("不与琴杆混为一体的弓毛", [.26, .018, -.3], [.26, .018, .3], .0022, material.ivory));
  return parts;
}

function sarinda(): ModelPart[] {
  const outline: [number, number][] = [[0, .015], [-.095, .04], [-.14, .15], [-.1, .27], [-.04, .29], [-.11, .34], [-.12, .48], [-.04, .4], [.04, .4], [.12, .48], [.11, .34], [.04, .29], [.1, .27], [.14, .15], [.095, .04]], parts = soundBox(outline, .12, []);
  parts.push(box("上半截在琴箱外裸露的宽短琴颈", [0, .62, -.005], [.07, .45, .06], material.wood), box("宽大的弦轴头", [0, .91, .015], [.1, .22, .075], material.wood), box("下腹蒙皮上承振的窄高琴桥", [0, .14, -.077], [.12, .035, .03], material.ivory), ...strings(3, .08, .98, .035, -.1, -.035));
  for (let index = 0; index < 3; index++) parts.push(rod("琴头两侧伸出的主弦轴", [-.09, .83 + index * .065, .015], [.09, .83 + index * .065, .015], .014, material.dark));
  for (let index = 0; index < 8; index++) parts.push(rod("短琴颈侧面为共鸣弦配置的独立弦轴", [.026, .43 + index * .045, .005], [.1, .43 + index * .045, .005], .009, material.wood), rod("位于主弦下方的共鸣细弦", [(index - 3.5) * .005, .14, -.085], [.035, .43 + index * .045, -.04], .0011, material.steel));
  return parts;
}

function ngoni(): ModelPart[] {
  const outline: [number, number][] = [[0, .015], [-.065, .035], [-.09, .13], [-.075, .34], [-.04, .43], [.04, .43], [.075, .34], [.09, .13], [.065, .035]], parts = soundBox(outline, .14, []);
  parts.push(rod("从舟形皮面槽箱中贯通伸出的无品琴杆", [0, .02, -.015], [0, 1.03, -.015], .035, material.dark), box("皮面上直接承弦的木琴马", [0, .16, -.087], [.085, .035, .025], material.wood), ...strings(4, .08, .96, .028, -.105, -.045));
  for (let index = 0; index < 4; index++) parts.push(loop("沿琴杆滑动来调节弦张力的皮束环", [0, .76 + index * .065, -.015], .021, .005, [0, 0, 0], material.wood));
  return parts;
}

function bolon(): ModelPart[] {
  const parts: ModelPart[] = [part("大葫芦下腹真正中空的共鸣壳", "lathe", material.wood, [0, .27, 0], [1, 1, 1], [-90, 0, 0], { profile: [{ x: 0, y: -.23 }, { x: .17, y: -.17 }, { x: .26, y: -.02 }, { x: .25, y: .12 }, { x: .241, y: .12 }, { x: .25, y: -.017 }, { x: .164, y: -.16 }, { x: 0, y: -.22 }] }), cylinder("大葫芦正面的张紧皮音板", [0, .27, -.124], [.486, .006, .486], material.ivory, [90, 0, 0]), cord("可以前后挠动改变张力的长弧形琴颈", [[0, .22, 0], [-.08, .74, 0], [-.29, 1.25, 0], [-.35, 1.56, 0]], .025, material.dark), box("皮面上耸起的长条承弦琴桥", [0, .27, -.16], [.055, .2, .055], material.wood)];
  for (let index = 0; index < 3; index++) parts.push(rod("由高琴桥斜接到可变弧颈的粗低音弦", [0, .2 + index * .06, -.19], [-.23 - index * .05, 1.12 + index * .17, -.03], .0025, material.ivory), rod("卡住弧颈上弦端的独立木调音轴", [-.27 - index * .04, 1.12 + index * .17, -.055], [-.27 - index * .04, 1.12 + index * .17, .055], .018, material.wood));
  return parts;
}

function gusli(): ModelPart[] {
  const outline: [number, number][] = [[-.54, -.16], [.48, -.16], [.55, -.08], [.45, .27], [-.35, .34], [-.54, .17]], parts: ModelPart[] = [piercedPanel("角翼琴底面长音腔的薄底板", [0, .015, 0], outline, [], .009, material.wood), piercedPanel("保持角翼边沿完整的中空侧圈", [0, .024, 0], outline, [outline.map(([x, z]) => [x * .94, z * .9] as [number, number]).reverse()], .075, material.wood), piercedPanel("设有穿手窗与圆音孔的上音板", [0, .099, 0], outline, [[[-.46, -.06], [-.46, .18], [-.3, .22], [-.3, -.06]], [[.05, -.035], [.02, .015], [.05, .065], [.1, .065], [.13, .015], [.1, -.035]]], .007, material.ivory)];
  for (let index = 0; index < 16; index++) { const z = -.12 + index * .022; parts.push(rod("跨过穿手窗而扇形渐变的独立琴弦", [-.5, .121, z], [.47 - index * .009, .121, z], .0014, material.steel), cylinder("琴翼斜边上各弦独立的金属调音销", [.47 - index * .009, .115, z], [.007, .022, .007], material.steel)); }
  parts.push(rod("穿手窗边缘承托弦的固定琴枕", [-.29, .119, -.13], [-.29, .119, .24], .012, material.wood));
  return parts;
}

function begena(): ModelPart[] {
  const parts = soundBox([[-.28, .02], [.28, .02], [.3, .6], [-.3, .6]], .19, []);
  parts.push(...[-1, 1].map(side => rod("从大膜箱两侧直立伸出的粗琴臂", [side * .27, .4, .02], [side * .4, 1.65, .02], .055, material.wood)), rod("承担整组长弦的上横轭", [-.44, 1.63, .02], [.44, 1.63, .02], .065, material.dark), box("皮面下部的宽鸣桥", [0, .21, -.127], [.4, .05, .045], material.wood));
  for (let index = 0; index < 10; index++) { const x = (index - 4.5) * .055; parts.push(rod("可直接手拨的大框竖琴粗弦", [x * .65, .16, -.152], [x, 1.63, -.018], .0022, material.ivory), cord("在琴桥处与弦接触产生鸣响的独立皮襻", [[x * .65 - .007, .22, -.14], [x * .65, .24, -.157], [x * .65 + .007, .22, -.14]], .002, material.wood)); }
  return parts;
}

function crumhorn(): ModelPart[] {
  const levels = [.24, .37, .385, .46, .475, .55, .565, .64, .655, .73, .745, .82, .835, .94], parts: ModelPart[] = [];
  for (let index = 0; index < levels.length - 1; index++) {
    const y = levels[index]!, height = levels[index + 1]! - y;
    if (index % 2) {
      const value = sweptProfile("保留真实侧向指孔的局部薄壁圆管段", material.wood, [[.025, 0], [.025, height], [.02, height], [.02, 0]], Math.PI * 2 - .6, 16);
      value.position.y = y; value.rotation.y = 107;
      parts.push(value);
    } else parts.push(hollowPipe("指孔之间保持贯通的木质声管段", [[0, y, 0], [0, y + height, 0]], [.025, .025], .005, material.wood));
  }
  parts.push(hollowPipe("在下端回弯而开口向上的J形尾管", [[0, .24, 0], [0, .075, 0], [.085, .025, 0], [.16, .08, 0], [.16, .21, 0]], [.025, .025, .027, .03, .035], .005, material.wood), part("在嘴唇外保护双簧片的真实中空风帽", "lathe", material.dark, [0, .94, 0], [1, 1, 1], [0, 0, 0], { profile: [{ x: .03, y: 0 }, { x: .032, y: .13 }, { x: .018, y: .17 }, { x: .012, y: .17 }, { x: .026, y: .127 }, { x: .025, y: 0 }, { x: .03, y: 0 }] }), hollowPipe("风帽顶端保持通气的短吹嘴", [[0, 1.1, 0], [0, 1.16, 0]], [.012, .012], .003, material.wood));
  return parts;
}

function sousaphone(): ModelPart[] {
  const path: Triple[] = Array.from({ length: 17 }, (_, index) => { const angle = (-165 + index * 20) * Math.PI / 180; return [Math.cos(angle) * .39, .52 + Math.sin(angle) * .39, 0]; });
  const parts: ModelPart[] = [hollowPipe("中间留出真实穿身开口的肩背主音管圈", path, path.map((_, index) => .04 + index * .0012), .004, material.wood), hollowPipe("从肩圈沿身体外侧升至头顶的粗音管", [path.at(-1)!, [-.39, .92, 0], [-.33, 1.3, 0], [0, 1.45, -.03]], [.059, .062, .067, .075], .004, material.wood), part("头顶向前张开而非向上的大扩音口", "lathe", material.wood, [0, 1.45, -.03], [1, 1, 1], [-90, 0, 0], { profile: [{ x: .075, y: 0 }, { x: .12, y: .15 }, { x: .24, y: .28 }, { x: .235, y: .285 }, { x: .115, y: .155 }, { x: .071, y: 0 }, { x: .075, y: 0 }] }), hollowPipe("从演奏者嘴位接入阀组的弯吹管", [[-.06, 1.06, -.12], [.12, .99, -.14], [.13, .82, -.15]], [.01, .011, .011], .003, material.wood)];
  for (let index = 0; index < 3; index++) { const x = -.045 + index * .05; parts.push(cylinder("演奏者胸前独立压动的活塞阀", [x, .8, -.15], [.032, .2, .032], material.wood), cylinder("活塞阀上方的按指帽", [x, .918, -.15], [.028, .012, .028], material.steel), hollowPipe("从活塞阀伸出的独立变长副音管", [[x, .83, -.16], [x - .025, .75, -.25], [x - .025, .64 - index * .035, -.25], [x + .025, .64 - index * .035, -.25], [x, .76, -.16]], [.009, .009, .009, .009, .009], .002, material.wood)); }
  parts.push(hollowPipe("把活塞组接回肩背主音管的短连接管", [[.12, .78, -.15], [-.12, .55, -.14], path[0]!], [.018, .025, .04], .003, material.wood));
  return parts;
}

function uilleannPipes(): ModelPart[] {
  const parts: ModelPart[] = [ball("由肘风箱持续供气的皮制气袋", [-.3, .22, 0], [.34, .2, .25], material.wood), ...[-1, 1].map(side => plate("肘压送气风箱的两片硬木夹板", [.21, .17 + side * .07, 0], [[-.13, -.1], [.11, -.07], [.13, .08], [-.1, .1]], .018, material.wood)), ...Array.from({ length: 6 }, (_, index) => { const value = bellowsFold(0); value.name = "两夹板间连续闭合的薄壁气密风箱褶"; value.color = material.dark; value.position = { x: .22, y: .12 + index * .02, z: 0 }; value.rotation.z = 90; return value; }), hollowPipe("从肘风箱连入皮袋的供气软管", [[.09, .2, 0], [-.05, .2, .05], [-.16, .22, .05]], [.013, .013, .013], .003, material.dark), cylinder("容纳持续低音管和调音管的共同木管座", [-.08, .23, -.03], [.09, .23, .09], material.dark, [0, 0, 90]), hollowPipe("演奏者朝下按孔的独立旋律管", [[-.2, .2, -.1], [-.15, .02, -.5]], [.016, .021], .004, material.wood)];
  for (let index = 0; index < 3; index++) { const x = -.06 + index * .035, end = .4 + index * .14;
    parts.push(hollowPipe("横放在腿上的独立持续低音管", [[x, .24, .02], [x, .24, end]], [.018, .022], .004, material.wood), hollowPipe("带键的独立和声调音管", [[x, .19, .01], [x, .19, .32 + index * .08]], [.016, .019], .003, material.wood));
    for (let key = 0; key < 3; key++) parts.push(box("可用腕部压下的和声长键", [x, .213, .14 + key * .065], [.028, .008, .035], material.steel));
  }
  return parts;
}

export function groupedBoxes(name: string, values: ModelPart[]): ModelPart[] {
  const geometry = new BoxGeometry(1, 1, 1), p = geometry.getAttribute("position");
  const vertices = Array.from({ length: p.count }, (_, index) => ({ x: p.getX(index), y: p.getY(index), z: p.getZ(index) })), indices = Array.from(geometry.index!.array);
  geometry.dispose();
  const parts: ModelPart[] = [];
  for (let index = 0; index < values.length; index += 20) parts.push(combineMeshes(name, values[index]!.color, values.slice(index, index + 20).map(value => ({ ...value, shape: "mesh", vertices, indices }))));
  return parts;
}

function pianoKeys(width: number, y: number, z: number): ModelPart[] {
  const whites: ModelPart[] = [], blacks: ModelPart[] = [];
  for (let index = 0; index < 52; index++) {
    whites.push(box("标准宽度的配重白键", [(index - 25.5) * width / 52, y, z], [width / 52 * .95, .018, .16], material.ivory));
    if (index < 51 && ![2, 6].includes((index + 5) % 7)) blacks.push(box("错列在白键后端的短半音黑键", [(index - 25) * width / 52, y + .018, z + .036], [width / 52 * .54, .022, .086], material.dark));
  }
  return [...groupedBoxes("独立硬面顶点的白键小组", whites), ...groupedBoxes("独立硬面顶点的黑键小组", blacks)];
}

function digitalPiano(): ModelPart[] {
  const parts: ModelPart[] = [box("内置配重动作而没有声学弦箱的演奏键台", [0, .8, 0], [1.38, .1, .32], material.dark), ...pianoKeys(1.21, .858, -.06), box("键后窄操作面板", [0, .865, .105], [1.24, .035, .1], material.dark), box("键台中央的乐谱托", [0, 1.005, .14], [.4, .25, .012], material.dark, [-12, 0, 0]), ...[-1, 1].map(side => rod("折叠琴架交叉承力杆", [side * .43, .04, -.1], [-side * .43, .75, -.1], .035)), ...[-1, 1].map(side => rod("琴架底部横向展开脚", [side * .43, .035, -.3], [side * .43, .035, .29], .035)), ...[-1, 1].map(side => rod("琴架上部承托键台的横杆", [side * .43, .75, -.22], [side * .43, .75, .22], .03)), box("三联制音与延音脚踏板的独立底座", [0, .025, -.22], [.32, .05, .2], material.dark), ...[-1, 0, 1].map(side => box("独立可踩动的制音踏片", [side * .09, .062, -.23], [.045, .025, .19], material.wood, [-8, 0, 0])), cord("踏板盒到键台后端的连接线", [[0, .045, -.15], [.36, .01, .18], [.54, .79, .13]], .005, material.dark), cylinder("键后音量旋钮", [-.52, .89, .105], [.023, .023, .023], material.steel), box("操作面板中央小显示窗", [.2, .887, .105], [.12, .003, .045], material.glass)];
  return parts;
}

function electronicDrums(): ModelPart[] {
  const parts: ModelPart[] = [...[-1, 1].map(side => rod("电子鼓开放管架的两侧落地柱", [side * .57, .02, 0], [side * .57, .87, 0], .034)), rod("开放管架前方连成一体的承力横杆", [-.58, .82, 0], [.58, .82, 0], .036), ...[-1, 1].map(side => rod("管架底部前后展开的稳定脚", [side * .57, .025, -.32], [side * .57, .025, .4], .034)), cylinder("没有低音鼓腔而竖立的电子踢击垫", [0, .2, .25], [.25, .035, .25], material.dark, [90, 0, 0]), box("踢击垫独立落地底脚", [0, .025, .25], [.36, .05, .2], material.dark), box("由脚驱动的底鼓踏板", [0, .035, -.04], [.12, .025, .3], material.steel), rod("将脚踏动作传给踢击垫的击锤杆", [0, .09, .13], [0, .2, .2], .012), ball("电子踢击垫前方的圆软锤", [0, .2, .21], [.04, .04, .04], material.ivory)];
  for (const [x, y, z, radius] of [[-.36, .73, -.17, .155], [-.23, .94, .03, .12], [.08, .95, .04, .12], [.39, .81, .17, .135]]) parts.push(cylinder("没有共鸣筒而只有胶面与触发传感器的独立鼓垫", [x!, y!, z!], [radius! * 2, .035, radius! * 2], material.dark), cylinder("覆盖触发层的浅色网状演奏面", [x!, y! + .02, z!], [radius! * 1.8, .006, radius! * 1.8], material.ivory), rod("从开放管架延伸到击垫底面的独立悬臂", [x!, .82, 0], [x!, y! - .018, z!], .022));
  for (const [x, y, z, radius] of [[-.58, 1.15, .16, .18], [.61, 1.23, .23, .2], [-.58, .85, -.22, .15]]) parts.push(rod("电子镲的弧架支臂", [x! * .8, .82, 0], [x!, y!, z!], .019), part("可击打而不开金属镲音的薄胶电子镲片", "lathe", material.dark, [x!, y!, z!], [1, 1, 1], [0, 0, 0], { profile: [{ x: .012, y: .025 }, { x: .012, y: .017 }, { x: .055, y: .012 }, { x: radius!, y: -.008 }, { x: radius!, y: 0 }, { x: .055, y: .02 }, { x: .012, y: .025 }] }));
  parts.push(box("管架侧面带触发输入口的鼓音源主机", [-.68, .89, -.02], [.17, .1, .15], material.dark), box("鼓主机上的小显示窗", [-.68, .944, -.02], [.1, .004, .055], material.glass), box("独立控制开合状态的踩镲脚踏器", [-.42, .025, -.25], [.11, .04, .24], material.dark));
  for (const [x, y, z] of [[-.36, .73, -.17], [-.23, .94, .03], [.08, .95, .04], [.39, .81, .17], [.61, 1.23, .23]]) parts.push(cord("从各独立触发垫接入鼓主机的信号线", [[x!, y! - .02, z!], [x!, .7, .05], [-.6, .7, .05], [-.68, .86, -.02]], .004, material.dark));
  return parts;
}

function modularSynthWall(): ModelPart[] {
  const parts: ModelPart[] = [box("完整模块合成器墙柜的承重底架", [0, .07, 0], [1.75, .14, .65], material.dark), ...[-1, 1].map(side => box("墙柜左右保护侧壁", [side * .79, 1.02, .05], [.08, 1.8, .43], material.wood)), box("完整合成柜背部的电源与布线空间", [0, 1.02, .24], [1.6, 1.8, .055], material.dark), box("上缘压住各模块的承重横梁", [0, 1.93, .05], [1.67, .07, .43], material.wood)];
  for (let row = 0; row < 2; row++) for (let column = 0; column < 3; column++) {
    const x = (column - 1) * .5, y = .6 + row * .86;
    parts.push(box("可独立接线的模拟振荡滤波模块面板", [x, y, -.165], [.47, .78, .035], material.steel));
    for (let index = 0; index < 4; index++) parts.push(cylinder("模块正面有独立轴座的参数旋钮", [x - .135 + index % 2 * .27, y + .18 - Math.floor(index / 2) * .21, -.198], [.042, .026, .042], material.dark, [90, 0, 0]), loop("模块底部真正中空的信号插孔", [x - .145 + index * .096, y - .22, -.188], .01, .003, [90, 0, 0], material.dark));
  }
  for (let index = 0; index < 7; index++) { const leftX = -.645 + index % 3 * .5, rightX = -.549 + (index + 1) % 3 * .5, y = index % 2 ? 1.24 : .38;
    parts.push(cord("以实际下垂弧线接到模块插孔的信号跳线", [[leftX, y, -.2], [leftX + .08, y - .17, -.27], [rightX - .08, y - .18, -.27], [rightX, index % 2 ? .38 : 1.24, -.2]], .006, index % 2 ? material.red : material.wood));
  }
  return parts;
}

function continuousFingerboard(): ModelPart[] {
  const parts: ModelPart[] = [box("没有机械分键的连续压感演奏器外壳", [0, .88, 0], [1.34, .085, .25], material.dark), box("将位置横移与压力连续读出的柔性演奏表面", [0, .928, -.015], [1.25, .012, .17], material.red), ...[-1, 1].map(side => rod("演奏台下方折叠的斜向承力腿", [side * .45, .025, -.13], [-side * .45, .835, .1], .03)), ...[-1, 1].map(side => rod("压感演奏台落地横脚", [side * .45, .025, -.3], [side * .45, .025, .3], .033)), box("控制器后部真实外伸的音源接口匣", [.43, .88, .16], [.25, .06, .09], material.steel), box("演奏器地面独立表情踏板底座", [.2, .025, -.25], [.13, .05, .26], material.dark), box("表情踏板上方可摆动的脚踏片", [.2, .06, -.25], [.12, .025, .25], material.wood, [-10, 0, 0]), cord("脚踏板到后部接口匣的细信号线", [[.2, .04, -.15], [.56, .01, .25], [.56, .87, .18]], .005, material.dark)];
  for (let index = 0; index < 24; index++) parts.push(box("嵌在连续面下而不分割表面的浅音位线", [(index - 11.5) * .05, .935, -.015], [.0015, .001, .17], material.dark));
  return parts;
}

function springMembraneInstrument(): ModelPart[] {
  const parts: ModelPart[] = [rod("弓弦和两条耦合簧共同连接的中央琴杆", [0, .12, .03], [0, 2.17, .03], .035, material.wood), box("把弦振动传入长簧而非独立敲鼓的耦合琴桥", [0, .69, -.063], [.085, .09, .065], material.wood), ...[-1, 1].map(side => rod("中央琴杆向两侧展开的落地斜撑", [0, .57, .03], [side * .38, .026, .24], .025, material.wood)), rod("避免中央琴杆前后倾倒的第三支脚", [0, .57, .03], [0, .026, -.34], .025, material.wood)];
  for (const side of [-1, 1]) {
    const x = side * 1.12, y = side < 0 ? .86 : 1.02;
    parts.push(part("只在前端蒙膜而后端留开口的薄壁膜腔", "lathe", material.wood, [x, y, .1], [1, 1, 1], [-90, 0, 0], { profile: [{ x: .265, y: -.12 }, { x: .265, y: .12 }, { x: .257, y: .12 }, { x: .257, y: -.12 }, { x: .265, y: -.12 }] }), cylinder("由长簧激励而连在腔口的薄皮膜", [x, y, -.023], [.514, .006, .514], material.ivory, [90, 0, 0]), cylinder("长簧实际连到膜心的传振钮", [x, y, -.034], [.025, .022, .025], material.wood, [90, 0, 0]), rod("从地面承托膜盘背面的独立立杆", [x, .025, .18], [x, y, .18], .024), rod("膜盘支架前后展开的底脚", [x, .023, -.17], [x, .023, .46], .023), rod("膜盘支架横向展开的第二底脚", [x - .24, .023, .18], [x + .24, .023, .18], .023), rod("将膜腔侧壁接实到立杆的短支臂", [x, y, .18], [x + side * .253, y, .1], .018));
    const start = new Vector3(side * .038, .69, -.096), end = new Vector3(x, y, -.045), axis = end.clone().sub(start).normalize(), across = new Vector3(0, 0, 1), up = axis.clone().cross(across).normalize();
    const path: Triple[] = Array.from({ length: 289 }, (_, index) => { const t = index / 288, radius = .015 * Math.min(1, index / 3, (288 - index) / 3), angle = index * Math.PI / 3, v = start.clone().lerp(end, t).addScaledVector(across, Math.cos(angle) * radius).addScaledVector(up, Math.sin(angle) * radius); v.y -= Math.sin(t * Math.PI) * .055; return [v.x, v.y, v.z]; });
    for (let index = 0; index < 288; index += 72) { const value = springWire(path.slice(index, index + 73), .0009); value.name = "从弦桥连续伸至膜心而保留真实绕圈的长耦合簧"; parts.push(value); }
    parts.push(rod("中央琴杆顶部的独立弦轴", [side * .012, 2.11, -.005], [side * .085, 2.11, -.005], .011, material.wood), rod("在耦合桥以上可供弓擦的长演奏弦", [side * .012, .69, -.099], [side * .012, 2.11, -.039], .0015, material.steel), rod("桥以下接入琴杆尾部的张紧弦段", [side * .012, .2, -.025], [side * .012, .69, -.099], .0015, material.steel));
  }
  return parts;
}

function daxophone(): ModelPart[] {
  const parts: ModelPart[] = [box("藏有接触拾音器而夹住木舌根部的木声块", [0, .735, .025], [.13, .065, .12], material.wood), box("通过螺钉夹紧木舌而非粘死的上压板", [0, .777, -.015], [.1, .025, .1], material.dark), piercedPanel("末端自由振动并有侧向收分的单片木舌", [0, .764, -.045], [[-.016, 0], [-.023, -.1], [-.014, -.17], [-.024, -.24], [-.016, -.33], [.014, -.33], [.024, -.27], [.014, -.19], [.024, -.09], [.016, 0]], [], .005, material.wood), plate("以曲底沿木舌滑动来改变有效振动长度的手持压块", [0, .785, -.23], [[-.044, .012], [-.036, -.002], [-.018, -.013], [0, -.016], [.018, -.013], [.036, -.002], [.044, .012], [.04, .047], [-.04, .047]], .06, material.dark, [0, 0, 0]), ...[-1, 1].map(side => cylinder("分别压紧木舌根部的夹座螺钉", [side * .038, .799, -.015], [.012, .02, .012], material.steel)), cylinder("声块下方连接三脚架的调节轴座", [0, .69, .025], [.06, .06, .06], material.dark), cord("靠在演奏架侧面的独立弓杆", [[.2, .7, -.39], [.36, .74, -.1], [.51, .7, .18]], .005, material.wood), rod("与弯弓分离而可擦过木舌的马尾弓毛", [.2, .7, -.39], [.51, .7, .18], .0018, material.ivory), cord("由声块后端引出的接触拾音器线缆", [[0, .73, .089], [.1, .6, .13], [.2, .02, .18]], .004, material.dark)];
  for (let index = 0; index < 3; index++) { const angle = index * Math.PI * 2 / 3; parts.push(rod("支撑夹座并允许自由木舌悬空的完整三脚架", [0, .7, .025], [Math.cos(angle) * .28, .022, .025 + Math.sin(angle) * .28], .018)); }
  return parts;
}

function beamStringInstrument(): ModelPart[] {
  const parts: ModelPart[] = [box("整根连续金属声梁的C槽底板", [0, .86, 0], [5.46, .028, .32], material.steel), ...[-1, 1].map(side => box("保留真实空槽而非实心长方体的声梁侧翼", [0, .95, side * .15], [5.46, .18, .02], material.steel)), ...[-1, 1].map(side => box("承受全部张弦的梁端锚板", [side * 2.64, 1.025, 0], [.075, .12, .31], material.steel)), ...[-1, 1].map(side => rod("独立滑车沿连续声梁移动的导向轨", [-2.5, 1.055, side * .131], [2.5, 1.055, side * .131], .01)), box("横跨声梁而在弦下滑动的磁拾音滑车", [.34, 1.027, 0], [.18, .028, .28], material.dark), box("靠近弦而不穿透弦的磁拾音极片", [.34, 1.048, 0], [.035, .008, .21], material.steel), cylinder("能够沿弦滑动的金属激励套筒", [1.2, 1.105, 0], [.065, .23, .065], material.wood, [90, 0, 0]), cord("滑动拾音器引出的柔性信号线", [[.34, 1.026, .14], [.6, .71, .32], [1.85, .02, .45]], .005, material.dark)];
  for (let index = 0; index < 12; index++) { const z = (index - 5.5) * .016;
    parts.push(rod("在连续金属梁上独立张紧的长金属弦", [-2.62, 1.072, z], [2.62, 1.072, z], .0013, material.steel), cylinder("锚板背后各弦独立的螺纹张紧轴", [2.69, 1.072, z], [.012, .1, .012], material.dark, [0, 0, 90]));
  }
  for (const x of [-1.9, 1.9]) parts.push(rod("声梁支架连接连续槽底的承重横梁", [x, .817, -.23], [x, .817, .23], .03), ...[-1, 1].map(side => rod("让演奏者能够沿声梁敲擦的落地展开腿", [x, .82, 0], [x, .025, side * .4], .027)), rod("支架底部防止分腿滑开的横向连杆", [x, .17, -.33], [x, .17, .33], .018));
  return parts;
}

function conicalBellInstrument(): ModelPart[] {
  const parts: ModelPart[] = [rod("承载整列独立锥壳钟的连续后侧安装梁", [-1.39, 1.02, .12], [1.39, 1.02, .12], .028, material.dark)];
  for (let index = 0; index < 31; index++) {
    const x = (index - 15) * .087, z = index % 2 ? -.053 : .053, radius = .066 - index * .0008, height = .15 - index * .002;
    const bell = sweptProfile("开底薄壁且前后错开以免钟口互相穿插的铸铝锥壳钟", material.steel, [[radius, 0], [radius * .38, height * .77], [.012, height], [0, height], [0, height - .006], [.008, height - .006], [radius * .38 - .004, height * .77 - .002], [radius - .004, 0]], Math.PI * 2, 12);
    bell.position = { x, y: .99, z };
    parts.push(bell, rod("只接在钟顶而让宽口自由振动的独立悬臂", [x, 1.02, .12], [x, .99 + height, z], .007, material.dark));
  }
  for (const x of [-.94, .94]) { parts.push(rod("演奏高度可调的落地钟列支柱", [x, .08, .12], [x, 1.02, .12], .022)); for (let index = 0; index < 3; index++) { const angle = index * Math.PI * 2 / 3; parts.push(rod("保持钟列窄而完整的三脚支架", [x, .25, .12], [x + Math.cos(angle) * .3, .022, .12 + Math.sin(angle) * .3], .019)); } }
  return parts;
}

function mizhavu(): ModelPart[] {
  const parts: ModelPart[] = [part("宽鼓腹缩至细颈而保留空腔的整片铜釜", "lathe", material.wood, [0, .22, 0], [1, 1, 1], [0, 0, 0], { profile: [{ x: 0, y: 0 }, { x: .17, y: .035 }, { x: .29, y: .19 }, { x: .33, y: .4 }, { x: .31, y: .65 }, { x: .22, y: .79 }, { x: .09, y: .86 }, { x: .09, y: .97 }, { x: .082, y: .97 }, { x: .082, y: .865 }, { x: .215, y: .784 }, { x: .302, y: .647 }, { x: .322, y: .4 }, { x: .283, y: .194 }, { x: .165, y: .043 }, { x: 0, y: .008 }] }), cylinder("只覆盖细颈口的可击打张紧皮膜", [0, 1.193, 0], [.178, .006, .178], material.ivory), loop("细口外侧固定皮膜的独立绑扎圈", [0, 1.182, 0], .093, .007, [0, 0, 0], material.dark), ...[-1, 1].flatMap(x => [-1, 1].map(z => box("让铜釜底部离开地面的木笼角柱", [x * .35, .29, z * .35], [.055, .58, .055], material.wood))), ...[-1, 1].map(side => rod("承托鼓腹而非让铜底触地的交叉木托", [-.35, .25, side * .13], [.35, .25, side * .13], .045, material.dark)), ...[-1, 1].map(side => rod("木笼两侧固定角柱的低横档", [side * .35, .09, -.35], [side * .35, .09, .35], .03, material.wood)), ...[-1, 1].map(side => rod("木笼上缘避免角柱向外张开的连梁", [-.35, .55, side * .35], [.35, .55, side * .35], .03, material.wood))];
  return parts;
}

function guembri(): ModelPart[] {
  const outline: [number, number][] = [[-.16, .02], [.16, .02], [.19, .07], [.19, .46], [.15, .5], [-.15, .5], [-.19, .46], [-.19, .07]], parts = soundBox(outline, .17, [[[-.037, .055], [-.037, .13], [.037, .13], [.037, .055]]]);
  parts.push(rod("贯穿矩形皮面共鸣箱的粗无品木琴杆", [0, .09, .01], [0, 1.16, .01], .04, material.dark), box("膜面上承托粗低音弦的平头鸣桥", [0, .18, -.108], [.12, .038, .045], material.wood), ...[-1, 1].map(side => rod("通过下方真开口可见的分叉系弦木芯", [0, .14, -.055], [side * .025, .07, -.075], .012, material.wood)));
  for (let index = 0; index < 3; index++) {
    const x = (index - 1) * .025, high = index === 1 ? .82 : 1.1 + index * .02;
    parts.push(rod("两根通长弦和一根中途系结的短空弦", [x, .09, -.1], [x, .18, -.132], .0024, material.ivory), rod("越过皮面琴桥后接入琴杆的独立演奏弦", [x, .18, -.132], [x, high, -.028], .0024, material.ivory), loop("沿琴杆滑动调节各弦张力的独立皮束环", [0, high, .01], .025, .006, [0, 0, 0], material.wood));
  }
  return parts;
}

function sape(): ModelPart[] {
  const outline: [number, number][] = [[-.08, .02], [.08, .02], [.14, .08], [.16, .25], [.145, .8], [.11, 1.06], [.045, 1.13], [.045, 1.39], [.082, 1.43], [.07, 1.51], [-.07, 1.51], [-.082, 1.43], [-.045, 1.39], [-.045, 1.13], [-.11, 1.06], [-.145, .8], [-.16, .25], [-.14, .08]], cavity: [number, number][] = [[-.06, .08], [-.11, .14], [-.13, .28], [-.115, .78], [-.08, 1.02], [.08, 1.02], [.115, .78], [.13, .28], [.11, .14], [.06, .08]];
  const parts: ModelPart[] = [piercedPanel("从整块木材背部凿出而真正保持开放的舟形琴壳", [0, 0, .055], outline, [cavity], .1, material.wood, [-90, 0, 0]), piercedPanel("宽长舟腹和短琴颈连续成形的薄木音面", [0, 0, -.045], outline, [], .006, material.wood, [-90, 0, 0]), box("长舟腹下端独立承弦的木琴桥", [0, .18, -.065], [.12, .022, .028], material.dark)];
  for (let index = 0; index < 4; index++) { const x = (index - 1.5) * .019;
    parts.push(rod("沿长舟腹分别张紧的旋律弦与持续低音弦", [x, .12, -.08], [x, 1.46, -.06], .0015, material.steel), rod("宽琴头两侧各弦独立的横木调音轴", [-.09, 1.41 + index * .025, .01], [.09, 1.41 + index * .025, .01], .01, material.dark));
  }
  for (let index = 0; index < 11; index++) parts.push(box("只在旋律弦下设置而不横贯空弦区的独立高音品", [-.0285, .53 + index * .074, -.059], [.025, .006, .013], material.ivory));
  return parts;
}

function adufe(): ModelPart[] {
  const parts: ModelPart[] = [piercedPanel("方框鼓内部连续而非实心的木框", [0, 0, .035], [[-.225, .02], [.225, .02], [.225, .47], [-.225, .47]], [[[-.207, .038], [-.207, .452], [.207, .452], [.207, .038]]], .07, material.wood, [-90, 0, 0]), ...[-1, 1].map(side => box("方木框两侧分别拉紧的可击打皮膜", [0, .245, side * .037], [.45, .45, .004], material.ivory))];
  for (let index = 0; index < 8; index++) { const x = -.2 + index * .057;
    for (const side of [-1, 1]) {
      const y = side > 0 ? .465 : .025, middle = side > 0 ? .48 : .01, value = springWire([[x, y, -.041], [x, middle, 0], [x, y, .041]], .0015);
      value.name = "围过方框边而实际连至两张皮膜的独立缝线"; value.color = material.dark; parts.push(value);
    }
  }
  for (let index = 0; index < 6; index++) parts.push(ball("封闭双皮膜之间实际放入的响籽", [(index - 2.5) * .021, .04, 0], [.01, .012, .008], material.wood));
  return parts;
}

function jouhikko(): ModelPart[] {
  const holes: [number, number][][] = [-1, 1].map(side => Array.from({ length: 8 }, (_, index) => { const angle = -index * Math.PI / 4; return [side * .05 + Math.cos(angle) * .011, .16 + Math.sin(angle) * .018] as [number, number]; }));
  const parts = soundBox([[-.095, .02], [.095, .02], [.1, .25], [.065, .31], [-.095, .31]], .07, holes);
  parts.push(piercedPanel("无中央指板而保留一个真正穿手窗的整木琴框", [0, 0, .035], [[-.095, .27], [.065, .27], [.095, .55], [.06, .595], [-.07, .595], [-.095, .55]], [[[-.066, .315], [-.064, .546], [.053, .546], [.036, .315]]], .07, material.wood, [-90, 0, 0]), box("弓擦弦与音板之间独立的窄琴桥", [0, .115, -.052], [.1, .03, .027], material.wood), rod("独立长弓的细弯木杆", [.2, .018, -.3], [.2, .035, .3], .006, material.wood), cord("可由手指调节张力的独立弓毛", [[.188, .018, -.3], [.179, .012, 0], [.188, .035, .3]], .0022, material.ivory));
  for (let index = 0; index < 3; index++) { const x = -.026 + index * .029; parts.push(rod("不依附指板而用伸入窗口的手指侧面截音的演奏弦", [x * .7, .07, -.07], [x, .57, -.047], .0018, material.ivory), cylinder("贯穿琴框上横轭的独立木调音轴", [x, .57, -.005], [.016, .11, .016], material.dark, [90, 0, 0])); }
  return parts;
}

function rollReader(y: number, z: number): ModelPart[] {
  const width = .32, holes: [number, number][][] = Array.from({ length: 12 }, (_, index) => { const x = (index % 4 - 1.5) * .065, py = (Math.floor(index / 4) - 1) * .065 + (index % 3) * .009; return [[x - .004, py - .012], [x - .004, py + .012], [x + .004, py + .012], [x + .004, py - .012]]; });
  const parts: ModelPart[] = [...[-1, 1].map(side => cylinder("连续纸谱的独立收卷或放卷滚筒", [0, y + side * .12, z], [.074, width + .04, .074], material.wood, [0, 0, 90])), ...[-1, 1].map(side => box("同时承托上下卷筒轴端的读谱器侧颊", [side * (width / 2 + .025), y, z], [.025, .32, .11], material.dark)), piercedPanel("实际贯穿音符长孔而非印上黑色方块的纸谱", [0, y, z - .037], [[-width / 2, -.12], [width / 2, -.12], [width / 2, .12], [-width / 2, .12]], holes, .002, material.ivory, [-90, 0, 0])];
  for (const side of [-1, 1]) {
    const ports: [number, number][][] = Array.from({ length: 44 }, (_, index) => { const x = (index + .5) * width / 88 - width / 4; return [[x - .0008, -.003], [x - .0008, .003], [x + .0008, .003], [x + .0008, -.003]]; });
    parts.push(piercedPanel("纸谱背后各自贯通的八十八路真空读轨孔半列", [side * width / 4, y, z - .031], [[-width / 4, -.01], [width / 4, -.01], [width / 4, .01], [-width / 4, .01]], ports, .006, material.wood, [-90, 0, 0]));
  }
  return parts;
}

function pneumaticKeyBank(): ModelPart[] {
  const geometry = new BoxGeometry(1, 1, 1), p = geometry.getAttribute("position"), vertices = Array.from({ length: p.count }, (_, index) => ({ x: p.getX(index) * .02, y: p.getY(index) < 0 ? 0 : .024 + (p.getZ(index) + .5) * .014, z: p.getZ(index) * .11 })), indices = Array.from(geometry.index!.array);
  geometry.dispose();
  const values = Array.from({ length: 88 }, (_, index) => part("两层错列而每键各自闭合的气动小风箱", "mesh", material.dark, [(Math.floor(index / 2) - 21.5) * 1.2 / 44, .58 + index % 2 * .06, .07], [1, 1, 1], [0, 0, 0], { vertices, indices })), parts: ModelPart[] = [];
  for (let index = 0; index < values.length; index += 20) parts.push(combineMeshes("独立硬面顶点合批而未删减的气动键风箱组", material.dark, values.slice(index, index + 20)));
  return parts;
}

function pneumaticPianoPlayer(): ModelPart[] {
  const parts: ModelPart[] = [box("前置演奏机独立落地而不含钢琴的下承座", [0, .09, 0], [1.28, .1, .52], material.wood), ...[-1, 1].map(side => box("围住气动系统而前方开放的整机木侧壁", [side * .59, .43, .03], [.07, .6, .43], material.wood)), box("前置演奏机的连续后保护板", [0, .44, .23], [1.2, .62, .035], material.wood), box("分配到各个小风箱的上层真空风箱总管", [0, .55, .08], [1.22, .06, .2], material.wood), ...pneumaticKeyBank(), ...groupedBoxes("八十八根分别连接风箱与压键指的细推杆组", Array.from({ length: 88 }, (_, index) => box("独立木推杆", [(index - 43.5) * 1.2 / 88, .697, .09], [.006, .17, .006], material.wood))), ...groupedBoxes("向后伸出并能压动外部钢琴各键的八十八条机械指", Array.from({ length: 88 }, (_, index) => box("各自独立而非装饰键盘的压键指", [(index - 43.5) * 1.2 / 88, .785, .24], [.0095, .014, .29], material.wood))), ...rollReader(.905, -.07), ...[-1, 1].map(side => box("独立读谱架的两根竖向木承柱", [side * .21, .84, -.045], [.035, .4, .15], material.wood)), box("读谱器上方连续保护横檐", [0, 1.078, -.045], [.48, .035, .16], material.wood), box("两只排气风箱共同连接的稳压负压腔", [0, .31, .13], [1.0, .2, .14], material.dark)];
  for (const side of [-1, 1]) {
    parts.push(plate("脚踏排气风箱封闭而具有真实楔形行程的柔性侧壁", [side * .27, .19, -.02], [[-.12, 0], [.12, 0], [.12, .13], [-.12, .04]], .34, material.dark, [0, 90, 0]), box("大排气风箱的固定下叶板", [side * .27, .19, -.02], [.36, .012, .25], material.wood), box("大排气风箱带铰接斜度的活动上叶板", [side * .27, .275, -.02], [.36, .012, .256], material.wood, [20.56, 0, 0]), box("演奏机前端可轮流踩动的排气踏板", [side * .27, .064, -.36], [.19, .025, .29], material.dark, [-12, 0, 0]), rod("把踏板运动传入活动风箱叶的机械连杆", [side * .27, .09, -.25], [side * .27, .23, -.13], .012), hollowPipe("从排气风箱连入共同负压腔的短气道", [[side * .27, .25, .08], [side * .27, .31, .16]], [.018, .018], .004, material.dark));
  }
  parts.push(hollowPipe("共同负压腔接入上方键风箱的主气道", [[.48, .31, .16], [.48, .54, .14]], [.022, .022], .004, material.dark), hollowPipe("从纸卷读轨孔背面接至气动阀组的配气管", [[0, .905, -.06], [.17, .79, .07], [.17, .55, .07]], [.013, .02, .02], .003, material.dark));
  return parts;
}

function circularBowOrchestrion(): ModelPart[] {
  const parts: ModelPart[] = [box("完整自动提琴柜落地的连续厚木底座", [0, .065, .02], [1.72, .13, .86], material.wood), ...[-1, 1].map(side => box("从底座贯通到顶而非另放乐器套装的柜侧立框", [side * .79, 1.25, .18], [.1, 2.37, .56], material.wood)), box("环弓机械柜连续的薄背板", [0, 1.25, .44], [1.67, 2.37, .035], material.wood), box("环弓机械柜上端的横联保护檐", [0, 2.47, .08], [1.72, .1, .76], material.wood), box("分开下部钢琴与上部环弓的固定承力台", [0, 1.44, .05], [1.58, .07, .7], material.wood), box("下部自动钢琴真实承弦的木音板", [0, .83, .32], [1.45, 1.05, .025], material.wood), ...[-1, 1].map(side => box("承受自动钢琴弦组张力的金属侧骨架", [side * .68, .83, .28], [.045, 1.05, .035], material.steel)), rod("钢琴金属弦框下部的通长锚梁", [-.69, .3, .28], [.69, .3, .28], .035, material.steel), ...groupedBoxes("合批而仍保持各自分离的自动钢琴金属弦束", Array.from({ length: 20 }, (_, index) => box("自动钢琴独立竖向弦束", [(index - 9.5) * .064, .82 + index * .003, .245], [.002, .94 - index * .006, .002], material.steel))), ...groupedBoxes("自动击弦机构逐音排列的毡头组", Array.from({ length: 20 }, (_, index) => box("靠近琴弦而不贯穿音板的独立毡槌头", [(index - 9.5) * .064, 1.18, .218], [.027, .04, .025], material.ivory))), rod("控制下部自动钢琴击弦机构的通长轴", [-.68, 1.15, .19], [.68, 1.15, .19], .018), ...pianoKeys(1.38, .8, -.32), box("前伸键床与内柜相接的实木承托", [0, .765, -.25], [1.52, .055, .46], material.wood), ...rollReader(1.11, -.12), box("下部共同向琴键与提琴指爪供气的稳压真空箱", [0, .2, .02], [.85, .2, .34], material.dark), cylinder("下柜右侧驱动真空泵和环弓的共用电机", [.54, .24, .14], [.2, .25, .2], material.dark), rod("从共用传动机升至圆弓驱动轮的竖传动轴", [.375, .27, 0], [.375, 1.71, 0], .013), hollowPipe("环绕三具琴弦并在桥上方接触弦面的连续环弓毛带", [[0, 1.665, 0], [0, 1.745, 0]], [.343, .343], .004, material.ivory), loop("连续环弓毛带上方的刚性保持圈", [0, 1.752, 0], .343, .008, [0, 0, 0], material.dark), loop("连续环弓毛带下方的刚性保持圈", [0, 1.658, 0], .343, .008, [0, 0, 0], material.dark)];
  for (let index = 0; index < 3; index++) {
    const angle = (-90 + index * 120) * Math.PI / 180, yaw = -angle - Math.PI / 2, rotation = new Quaternion().setFromAxisAngle(new Vector3(0, 1, 0), yaw), offset = new Vector3(Math.cos(angle) * .289, 1.48, Math.sin(angle) * .289);
    const local = soundBox([[0, .02], [-.07, .025], [-.09, .1], [-.07, .17], [-.045, .2], [-.075, .25], [-.07, .31], [0, .35], [.07, .31], [.075, .25], [.045, .2], [.07, .17], [.09, .1], [.07, .025]], .055, [-1, 1].map(side => Array.from({ length: 8 }, (_, point) => { const a = -point * Math.PI / 4; return [side * .034 + Math.cos(a) * .006, .2 + Math.sin(a) * .022] as [number, number]; })));
    local.push(box("自动提琴的独立窄琴颈", [0, .435, 0], [.029, .23, .035], material.wood), box("自动提琴上方容纳单根演奏弦的弦轴头", [0, .58, .01], [.035, .08, .035], material.wood), box("由气动装置压向环弓的独立琴桥", [0, .13, -.042], [.1, .025, .027], material.wood), rod("该自动提琴独自负责一个音区的实际演奏弦", [0, .065, -.057], [0, .605, -.036], .0015, material.steel), cylinder("自动提琴顶部的横向调弦轴", [0, .59, -.005], [.012, .085, .012], material.dark, [0, 0, 90]), box("支承各气动指爪而不挡住环弓的上部阀座", [0, .46, -.115], [.04, .22, .02], material.steel));
    for (let finger = 0; finger < 5; finger++) local.push(cylinder("可分别向演奏弦伸缩的气动金属指爪", [0, .38 + finger * .038, -.075], [.014, .065, .014], material.steel, [90, 0, 0]));
    for (const value of local) {
      const position = new Vector3(value.position.x, value.position.y, value.position.z).applyQuaternion(rotation).add(offset), euler = new Euler().setFromQuaternion(rotation.clone().multiply(new Quaternion().setFromEuler(new Euler(value.rotation.x * Math.PI / 180, value.rotation.y * Math.PI / 180, value.rotation.z * Math.PI / 180))));
      value.position = { x: position.x, y: position.y, z: position.z }; value.rotation = { x: euler.x * 180 / Math.PI, y: euler.y * 180 / Math.PI, z: euler.z * 180 / Math.PI };
      parts.push(value);
    }
    const pivot = new Vector3(0, .01, .015).applyQuaternion(rotation).add(offset), connection = new Vector3(0, .46, -.125).applyQuaternion(rotation).add(offset), x = Math.cos(angle) * .375, z = Math.sin(angle) * .375;
    parts.push(rod("各提琴从承力台伸起而允许向环弓摆压的底部枢轴", [pivot.x, 1.44, pivot.z], [pivot.x, pivot.y, pivot.z], .015), cord("从共同真空箱通往各提琴气动截弦机构的软管", [[0, .29, .1], [Math.cos(angle) * .5, 1.37, Math.sin(angle) * .3], [connection.x, connection.y, connection.z]], .008, material.dark), cylinder("外接环弓保持圈而承担驱动与定心的立轴滚轮", [x, 1.705, z], [.065, .12, .065], material.dark), rod("把环弓滚轮接到柜内承力台的独立轴座", [x, 1.44, z], [x, 1.64, z], .02));
  }
  return parts;
}

// 原型类别的真实构造分别建模，不按地域装饰、弦数、同器物大小组合增加主项。
export const musicExpansionBatchFourObjects: MasterPrototype[] = [
  { name: "双面蒙皮长颈三弦", itemType: "乐器", theme: "中式", build: sanxian },
  { name: "菱箱单弦马森阔琴", itemType: "乐器", theme: "异域", build: masenqo },
  { name: "双肩缺口萨琳达琴", itemType: "乐器", theme: "异域", build: sarinda },
  { name: "舟槽皮面恩戈尼琴", itemType: "乐器", theme: "异域", build: ngoni },
  { name: "弧颈高桥博隆低音琴", itemType: "乐器", theme: "异域", build: bolon },
  { name: "开窗角翼古斯里琴", itemType: "乐器", theme: "欧式", build: gusli },
  { name: "皮襻鸣桥大框贝格纳琴", itemType: "乐器", theme: "异域", build: begena },
  { name: "风帽护簧J弯克鲁姆霍恩", itemType: "乐器", theme: "欧式", build: crumhorn },
  { name: "穿身肩圈苏萨风低音号", itemType: "乐器", theme: "现代", build: sousaphone },
  { name: "肘箱供气横管尤利安风笛", itemType: "乐器", theme: "欧式", build: uilleannPipes },
  { name: "配重键台演奏电钢琴", itemType: "乐器", theme: "现代", build: digitalPiano },
  { name: "开放击垫机架电子鼓", itemType: "乐器", theme: "现代", build: electronicDrums },
  { name: "跳线模块模拟合成器墙柜", itemType: "乐器", theme: "现代", build: modularSynthWall },
  { name: "连续滑音压感演奏琴", itemType: "乐器", theme: "现代", build: continuousFingerboard },
  { name: "弦簧耦合双膜盘琴", itemType: "乐器", theme: "现代", build: springMembraneInstrument },
  { name: "木舌弓擦达克索风琴", itemType: "乐器", theme: "现代", build: daxophone },
  { name: "滑轨拾音长梁弦琴", itemType: "乐器", theme: "现代", build: beamStringInstrument },
  { name: "顶钮悬锥钟列铝音琴", itemType: "乐器", theme: "现代", build: conicalBellInstrument },
  { name: "巨腹细颈铜釜米扎夫鼓", itemType: "乐器", theme: "异域", build: mizhavu },
  { name: "矩箱皮面古姆布里低音琴", itemType: "乐器", theme: "异域", build: guembri },
  { name: "开背长舟箱萨佩琴", itemType: "乐器", theme: "异域", build: sape },
  { name: "双膜方框阿杜菲鼓", itemType: "乐器", theme: "欧式", build: adufe },
  { name: "开框手窗尤希科弓琴", itemType: "乐器", theme: "欧式", build: jouhikko },
  { name: "纸卷气动前置钢琴演奏机", itemType: "设施", theme: "欧式", build: pneumaticPianoPlayer },
  { name: "环弓气动自动提琴演奏柜", itemType: "乐器", theme: "欧式", build: circularBowOrchestrion },
];
