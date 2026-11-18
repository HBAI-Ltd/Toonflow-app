import { part, type ModelPart } from "../assetModelParts";
import { box, cylinder, loop, rod, piercedPanel, material, type MasterPrototype } from "./parts";

function inputSocket(y: number, z: number, fullSize: boolean): ModelPart[] {
  const inner = fullSize ? .0094 : .0043, outer = fullSize ? .013 : .0064, result: ModelPart[] = [part(fullSize ? "左侧独立全尺寸平衡话筒输入插座金属筒" : "左侧独立小型平衡输入插座金属筒", "lathe", material.steel, [-.1225, y, z], [1, 1, 1], [0, 0, 90], { profile: [{ x: inner, y: 0 }, { x: outer, y: 0 }, { x: outer, y: .009 }, { x: inner, y: .009 }, { x: inner, y: 0 }] })];
  if (fullSize) result.push(piercedPanel("全尺寸话筒输入内芯真正分开的三个触点插孔", [-.1255, y, z], Array.from({ length: 20 }, (_, i): [number, number] => [Math.cos(i * Math.PI / 10) * .0094, Math.sin(i * Math.PI / 10) * .0094]), Array.from({ length: 3 }, (_, i) => Array.from({ length: 12 }, (_, n): [number, number] => [Math.cos(i * Math.PI * 2 / 3) * .0037 + Math.cos(-n * Math.PI / 6) * .0014, Math.sin(i * Math.PI * 2 / 3) * .0037 + Math.sin(-n * Math.PI / 6) * .0014])), .003, material.dark, [-90, 0, 90]));
  return result;
}

export const electronicExpansionBatchTwelveObjects: MasterPrototype[] = [
  // 原生便携现场整机，不是手持XY拾音棒放大或给旧调音台套包。
  // https://support.sounddevices.com/hc/en-us/articles/45140568880923-888-User-Guide
  { name: "专业现场多轨混音录音机", theme: "现代", itemType: "电子设备", build: () => {
    const inputZ = [-.060, -.020, .020, .060], controls = Array.from({ length: 8 }, (_, i) => ({ x: -.096 + (i % 4) * .027, y: .017 + Math.floor(i / 4) * .027 })), leftHoles = inputZ.flatMap(z => [{ y: .041, radius: .0094 }, { y: .0155, radius: .0043 }].map(({ y, radius }) => Array.from({ length: 16 }, (_, i): [number, number] => [-z + Math.cos(-i * Math.PI / 8) * radius, y - .004 + Math.sin(-i * Math.PI / 8) * radius]))), rightHoles: [number, number][][] = [
      ...[-.060, .060].map(z => Array.from({ length: 16 }, (_, i): [number, number] => [-z + Math.cos(-i * Math.PI / 8) * .0094, .037 + Math.sin(-i * Math.PI / 8) * .0094])),
      ...[.014, .024].map(y => [[-.0125, y - .0012], [-.0125, y + .0012], [.0125, y + .0012], [.0125, y - .0012]] as [number, number][]), [[-.037, .011], [-.037, .017], [-.025, .017], [-.025, .011]], Array.from({ length: 12 }, (_, i): [number, number] => [-.005 + Math.cos(-i * Math.PI / 6) * .0034, .043 + Math.sin(-i * Math.PI / 6) * .0034]),
    ], result: ModelPart[] = [
      box("现场录音整机实际接地的连续铝制底板", [0, .002, 0], [.245, .004, .185], material.steel), box("与两侧接口薄壁相连的完整铝制顶盖", [0, .059, 0], [.239, .004, .185], material.steel),
      piercedPanel("左机壁真正与八路输入金属插座同轴的贯通孔", [-.1195, .004, 0], [[-.0925, 0], [.0925, 0], [.0925, .057], [-.0925, .057]], leftHoles, .003, material.dark, [-90, 0, 90]), piercedPanel("右机壁真正分离的平衡输出及双卡和数据插孔", [.1225, .004, 0], [[-.0925, 0], [.0925, 0], [.0925, .057], [-.0925, .057]], rightHoles, .003, material.dark, [-90, 0, 90]),
      piercedPanel("前操作面真正留出显示窗和八根控制轴通孔", [0, .004, -.0925], [[-.1225, 0], [.1225, 0], [.1225, .057], [-.1225, .057]], [[[.018, .009], [.018, .050], [.094, .050], [.094, .009]], ...controls.map(({ x, y }) => Array.from({ length: 12 }, (_, i): [number, number] => [x + Math.cos(-i * Math.PI / 6) * .003, y - .004 + Math.sin(-i * Math.PI / 6) * .003]))], .003, material.dark, [-90, 0, 0]),
      piercedPanel("后机壁上真正通到网络接头的矩形开口", [0, .004, .0925], [[-.1225, 0], [.1225, 0], [.1225, .057], [-.1225, .057]], [[[.096, .016], [.096, .028], [.111, .028], [.111, .016]]], .003, material.dark, [-90, 0, 0]), box("嵌在前操作面窗口内且由边框承住的屏幕玻璃", [.056, .0335, -.094], [.076, .041, .003], material.glass),
    ];
    for (const z of inputZ) result.push(...inputSocket(.041, z, true), ...inputSocket(.0155, z, false));
    for (const { x, y } of controls) result.push(cylinder("真正穿过面板轴孔并承接通道旋钮的短轴", [x, y, -.0955], [.005, .015, .005], material.steel, [90, 0, 0]), cylinder("八个通道分别独立的实体混音电平轮", [x, y, -.103], [.017, .010, .017], material.dark, [90, 0, 0]), cylinder("电平轮中央独立可调的同轴输入增益轮", [x, y, -.111], [.008, .008, .008], material.steel, [90, 0, 0]), { ...loop("各通道面板上实际的环形状态灯导光圈", [x, y, -.0955], .0112, .0017, [90, 0, 0], material.glass), emissive: material.glass, emissiveIntensity: .12 });
    for (const z of [-.060, .060]) result.push(part("右侧主混音输出真正中空的金属插座", "lathe", material.steel, [.1225, .041, z], [1, 1, 1], [0, 0, -90], { profile: [{ x: .0094, y: 0 }, { x: .013, y: 0 }, { x: .013, y: .010 }, { x: .0094, y: .010 }, { x: .0094, y: 0 }] }), cylinder("输出插座内实际承住三根导电针的绝缘底座", [.124, .041, z], [.020, .003, .020], material.dark, [0, 0, 90]), ...Array.from({ length: 3 }, (_, i) => rod("平衡输出绝缘底座上真正分开的三根金属针", [.125, .041 + Math.cos(i * Math.PI * 2 / 3) * .0035, z + Math.sin(i * Math.PI * 2 / 3) * .0035], [.1315, .041 + Math.cos(i * Math.PI * 2 / 3) * .0035, z + Math.sin(i * Math.PI * 2 / 3) * .0035], .0017, material.steel)));
    result.push(part("右侧监听耳机插孔真正开口的独立金属圈", "lathe", material.steel, [.1225, .047, .005], [1, 1, 1], [0, 0, -90], { profile: [{ x: .0034, y: 0 }, { x: .0047, y: 0 }, { x: .0047, y: .004 }, { x: .0034, y: .004 }, { x: .0034, y: 0 }] }), cylinder("显示窗右方实际的菜单选择编码轮", [.108, .042, -.102], [.015, .013, .015], material.dark, [90, 0, 0]), cylinder("显示窗右下角真正凸出的录音运输键", [.108, .019, -.101], [.011, .011, .011], material.red, [90, 0, 0]),
      ...[-1, 1].flatMap(side => [box("后机壁上原生双电源扣座的实际底板", [side * .052, .032, .0965], [.070, .045, .008], material.steel), ...[-1, 1].map(edge => box("双电源扣座上可让电池沿直线扣入的独立导轨", [side * .052 + edge * .026, .032, .102], [.006, .043, .006], material.dark)), box("各电源扣座上真正可按下的锁定卡舌", [side * .052, .052, .103], [.019, .006, .007], material.dark)]),
      box("后网络接口内原生的绝缘接点承板", [.1035, .025, .087], [.014, .010, .008], material.steel), ...[-1, 1].map(side => box("机体前方两端真正保护外露旋钮的长侧护耳", [side * .1195, .033, -.103], [.006, .058, .034], material.steel)),
    );
    return result;
  } },
];
