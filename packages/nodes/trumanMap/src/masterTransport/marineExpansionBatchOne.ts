import { part, ring, type ModelPart, type Triple } from "../assetModelParts";
import { polygon } from "../masterNature/shared";
import { box, cylinder, strut, transportColors, type TransportDefinition } from "./parts";

// 原创简化构造，参考主体类型，不复刻厂商外观或制造尺寸。
// https://www.voith.com/corp-en/drives-transmissions/voith-schneider-propeller-vsp.html
// https://www.voith.com/corp-en/drives-transmissions/voith-inline-thruster-propulsor.html
// https://www.rmg.co.uk/collections/objects/rmgc-object-6990
// https://canalrivertrust.org.uk/things-to-do/canal-history/history-features-and-articles/the-evolution-of-the-narrowboat
// https://www.macgregor.com/products/merchant/hatch-covers/

const body = transportColors.body, dark = transportColors.dark, trim = transportColors.trim, wood = transportColors.wood;

export function openHull(name: string, sections: [number, number, number, number][], thickness: number, color: string): ModelPart {
  const vertices = sections.flatMap(([z, width, bottom, height]) => [
    { x: -width, y: height, z }, { x: -bottom, y: 0, z }, { x: bottom, y: 0, z }, { x: width, y: height, z },
    { x: -width + thickness, y: height, z }, { x: -bottom + thickness, y: thickness, z }, { x: bottom - thickness, y: thickness, z }, { x: width - thickness, y: height, z },
  ]);
  const indices: number[] = [];
  const quad = (a: number, b: number, c: number, d: number) => indices.push(a, b, c, a, c, d);
  for (let section = 0; section < sections.length - 1; section++) {
    const a = section * 8, b = (section + 1) * 8;
    for (let edge = 0; edge < 3; edge++) {
      quad(a + edge, a + edge + 1, b + edge + 1, b + edge);
      quad(a + 4 + edge, b + 4 + edge, b + 5 + edge, a + 5 + edge);
    }
    quad(a, b, b + 4, a + 4);
    quad(a + 3, a + 7, b + 7, b + 3);
  }
  for (const [offset, reverse] of [[0, true], [(sections.length - 1) * 8, false]] as const) for (let edge = 0; edge < 3; edge++) {
    const corners = [offset + edge, offset + edge + 1, offset + edge + 5, offset + edge + 4];
    if (reverse) corners.reverse();
    quad(corners[0]!, corners[1]!, corners[2]!, corners[3]!);
  }
  return part(name, "mesh", color, [0, 0, 0], [1, 1, 1], [0, 0, 0], { vertices, indices });
}

function rope(name: string, path: Triple[], radius = 0.012, color = trim): ModelPart {
  return part(name, "tube", color, [0, 0, 0], [1, 1, 1], [0, 0, 0], { radius, path: path.map(([x, y, z]) => ({ x, y, z })) });
}

function foil(name: string, position: Triple, angle: number, height: number): ModelPart {
  const value = polygon(name, trim, [[-0.32, 0], [-0.2, -0.055], [0.23, -0.03], [0.43, 0], [0.23, 0.03], [-0.2, 0.055]], height, position);
  value.rotation.y = angle;
  return value;
}

export const marineExpansionBatchOne: TransportDefinition[] = [
  { name: "双铰纵向开体卸泥驳船", theme: "现代", tags: ["开体泥驳", "split hopper barge", "纵向分体船壳"], create: () => {
    const parts: ModelPart[] = [];
    for (const side of [-1, 1]) {
      const cross: [number, number][] = [[0, 0.2], [4.8, 0.2], [5.2, 4.1], [4.65, 4.1], [0, 0.65]];
      const half = part("承载泥舱与压载舷箱的半船壳", "extrude", body, [side * 0.12, 0, 0], [1, 1, 1], [0, 0, 0], { profile: cross.map(([x, y]) => ({ x: x * side, y })), depth: 31 });
      parts.push(half, box("半船舷甲板", [side * 4.75, 4.15, 0], [0.85, 0.16, 31.4], trim));
      parts.push(polygon("与半船壳连成一体的尖艏浮舱", body, [[side * 0.12, -19], [side * 2.4, -18.5], [side * 5.2, -15.5], [side * 0.12, -15.5]], 3.9), box("中缝分离的艉端浮舱", [side * 2.66, 1.95, 16.5], [5.08, 3.9, 2], body));
      for (const z of [-14.3, 14.3]) {
        parts.push(strut("舷箱至上部铰轴承力架", [side * 4.7, 4, z], [side * 0.75, 5.9, z], 0.42, dark));
        const rodStart: Triple = [side * 0.8, 5.65, z], rodEnd: Triple = [side * 3.7, 4.3, z];
        parts.push(strut("控制开体的水平斜置液压缸", rodStart, [side * 2.5, 4.86, z], 0.42, body), strut("开体液压缸活塞杆", [side * 2.4, 4.9, z], rodEnd, 0.17, trim));
      }
      for (const z of [-9, 0, 9]) parts.push(box("侧舷空腔加劲隔板", [side * 4.8, 2.8, z], [0.28, 2.5, 0.22], dark));
    }
    parts.push(...[-14.3, 14.3].map(z => cylinder("两半船共同铰接横销", [0, 5.9, z], [0.48, 2.2, 0.48], trim, [0, 0, 90])), box("后部高位控制台底架", [0, 6.1, 16], [3.3, 0.25, 3], trim), ...[-1, 1].map(side => strut("控制室高脚支承", [side * 1.4, 3.9, 16], [side * 1.4, 6.1, 16], 0.25, dark)), box("分体铰轴上方控制室", [0, 7.1, 16], [2.6, 1.8, 2]), box("控制室前观察窗", [0, 7.3, 14.98], [2.2, 0.75, 0.035], transportColors.glass), box("控制室顶", [0, 8.1, 16], [2.9, 0.16, 2.4], trim));
    return parts;
  } },
  { name: "艉舵杆驾驶的运河窄体居住船", theme: "欧式", tags: ["narrowboat", "内河窄船", "窄体生活航船"], create: () => {
    const parts: ModelPart[] = [openHull("平底尖艏窄体钢船壳", [[-9, 0.17, 0.12, 1], [-7.7, 1.05, 0.85, 0.88], [7, 1.05, 0.85, 0.88], [9, 0.75, 0.65, 0.88]], 0.06, dark), box("舱内连续地板", [0, 0.28, 0.1], [1.75, 0.12, 15], wood), box("低弧生活舱顶", [0, 2.4, -0.2], [1.93, 0.12, 13.8], body), box("窄船前舱封壁", [0, 1.56, -7.1], [1.85, 1.65, 0.07], body), ...[-1, 1].flatMap(side => [box("窗带下侧连续舱板", [side * 0.94, 1.05, -0.2], [0.065, 0.6, 13.8], body), box("窗带上侧连续舱板", [side * 0.94, 2.17, -0.2], [0.065, 0.4, 13.8], body)]), box("船艉开放驾驶平台", [0, 0.8, 7.7], [1.65, 0.15, 2.5], wood), box("艉舱门左壁", [-0.66, 1.56, 6.7], [0.53, 1.65, 0.07], body), box("艉舱门右壁", [0.66, 1.56, 6.7], [0.53, 1.65, 0.07], body), box("艉舱门上梁", [0, 2.23, 6.7], [0.8, 0.3, 0.07], body), cylinder("艉外贯通舵轴", [0, 0.9, 9.05], [0.07, 1.25, 0.07], dark), box("舵轴下方平板舵叶", [0, 0.35, 9.22], [0.045, 0.6, 0.65], dark), strut("伸到驾驶员手边的长舵杆", [0, 1.52, 9.05], [0, 1.52, 7.1], 0.055, trim), cylinder("顶面矮排烟筒", [0.5, 2.65, 3.8], [0.16, 0.45, 0.16], dark), box("烟筒挡雨帽", [0.5, 2.9, 3.8], [0.27, 0.04, 0.27], dark), box("舱内侧长坐床", [-0.46, 0.67, 2.2], [0.7, 0.65, 2.3], trim), box("舱内厨房台", [0.54, 0.8, -1.5], [0.62, 0.9, 2.2], wood)];
    for (const side of [-1, 1]) {
      for (let index = 0; index < 6; index++) parts.push(box("窄船舱壁真实窗间柱", [side * 0.94, 1.64, -7 + index * 2.3], [0.07, 0.62, 0.21], body), box("舱内可见透明侧窗", [side * 0.94, 1.64, -5.85 + index * 2.3], [0.025, 0.62, 2.09], transportColors.glass));
      parts.push(strut("艉平台侧护栏", [side * 0.84, 1.62, 7], [side * 0.7, 1.62, 8.9], 0.035, dark), ...[7.1, 8.8].map(z => strut("艉护栏竖柱", [side * (z > 8 ? 0.7 : 0.84), 0.85, z], [side * (z > 8 ? 0.7 : 0.84), 1.62, z], 0.035, dark)));
    }
    for (const value of parts.filter(value => value.color === transportColors.glass)) value.opacity = 0.35;
    return parts;
  } },
  { name: "敞口蒙皮肋骨架乌米亚克舟", theme: "异域", tags: ["umiak", "蒙皮大舟", "皮木骨架舟"], create: () => {
    const stations: [number, number, number, number][] = [[-4.5, 0.18, 0.12, 1.08], [-3.1, 0.82, 0.6, 0.86], [-1.5, 1.04, 0.77, 0.82], [1.6, 1.05, 0.78, 0.82], [3.2, 0.85, 0.6, 0.88], [4.5, 0.28, 0.15, 1.02]];
    const parts: ModelPart[] = [openHull("保持真实敞口的连续薄兽皮船壳", stations, 0.028, "#aa997d")];
    for (let index = 0; index < stations.length - 1; index++) {
      const a = stations[index]!, b = stations[index + 1]!;
      for (const side of [-1, 1]) parts.push(strut("皮革穿绑的连续上舷木缘", [side * (a[1] - 0.035), a[3], a[0]], [side * (b[1] - 0.035), b[3], b[0]], 0.065, wood), strut("蒙皮内侧纵向底缘木条", [side * (a[2] - 0.02), 0.075, a[0]], [side * (b[2] - 0.02), 0.075, b[0]], 0.045, wood));
    }
    for (const [z, width, bottom, height] of stations.slice(1, -1)) {
      for (const side of [-1, 1]) parts.push(strut("弯肋上段", [side * (width - 0.055), height - 0.015, z], [side * (bottom - 0.025), 0.09, z], 0.045, wood));
      parts.push(strut("横贯底部的木肋", [-bottom + 0.02, 0.09, z], [bottom - 0.02, 0.09, z], 0.045, wood));
    }
    for (const z of [-1.3, 1.4]) parts.push(box("连接双舷的可拆横座", [0, 0.67, z], [1.96, 0.075, 0.24], wood));
    parts.push(box("船艉弧形座垫", [0, 0.54, 3.15], [1.3, 0.08, 0.45], wood), strut("前后连续木龙骨", [0, 0.065, -4.5], [0, 0.065, 4.5], 0.075, wood));
    for (const side of [-1, 1]) for (const z of [-2.5, 2.3]) parts.push(cylinder("成对木制桨销", [side * 0.94, 0.9, z], [0.035, 0.23, 0.035], wood), rope("绕过上舷的皮条绑缚", [[side * 0.91, 0.8, z - 0.06], [side * 1, 0.86, z], [side * 0.91, 0.9, z + 0.06]], 0.008, dark));
    parts.push(strut("船内收置木桨杆", [-0.68, 0.73, -2.9], [0.52, 0.73, 2.6], 0.04, wood), box("木桨宽扁末叶", [0.59, 0.73, 2.9], [0.19, 0.035, 0.7], wood, [0, 12, 0]));
    return parts;
  } },
  { name: "竖直叶片摆线全向船用推进器", theme: "现代", itemType: "构件", tags: ["摆线推进器", "竖叶推进", "cycloidal propeller"], create: () => {
    const parts: ModelPart[] = [cylinder("船底固定圆形安装座", [0, 2.32, 0], [2.8, 0.2, 2.8], dark), cylinder("下方旋转叶盘", [0, 2.13, 0], [2.55, 0.2, 2.55], body), cylinder("上部驱动减速壳", [0, 2.78, 0], [1.65, 0.72, 1.65], body), cylinder("偏心操纵轴承", [0.21, 3.2, 0], [0.32, 0.3, 0.32], trim), box("侧置操纵缸支座", [0.8, 2.83, 0], [0.45, 0.4, 0.6], dark)];
    for (let index = 0; index < 5; index++) {
      const angle = index * Math.PI * 2 / 5, x = Math.cos(angle) * 0.96, z = Math.sin(angle) * 0.96;
      parts.push(foil("可绕自身竖轴改变桨距的水翼叶", [x, 0.1, z], -index * 72 + 14, 1.9), cylinder("叶片上部独立调距轴", [x, 2.15, z], [0.12, 0.3, 0.12], dark), cylinder("叶轴摇臂转盘", [x, 2.36, z], [0.24, 0.07, 0.24], trim));
    }
    for (const side of [-1, 1]) parts.push(box("甲板承力安装脚", [side * 1.2, 2.4, 0], [0.65, 0.12, 0.75], body));
    return parts;
  } },
  { name: "中央无轴环缘电动船用推进器", theme: "现代", itemType: "构件", tags: ["环缘推进器", "rim driven thruster", "无轴推进"], create: () => {
    const parts: ModelPart[] = [part("内置定子且前后贯通的环形壳", "lathe", body, [0, 1.3, 0], [1, 1, 1], [90, 0, 0], { profile: [{ x: 1.04, y: -0.36 }, { x: 1.21, y: -0.29 }, { x: 1.23, y: 0.29 }, { x: 1.04, y: 0.36 }, { x: 1.01, y: 0.28 }, { x: 1.01, y: -0.28 }, { x: 1.04, y: -0.36 }] }), ring("叶片末端连接的环形转子", dark, 1.025, 0.07, 1.3, 0.18, { position: { x: 0, y: 1.3, z: 0 }, rotation: { x: 90, y: 0, z: 0 } }), box("上方电缆接入封头", [0, 2.62, 0], [0.3, 0.22, 0.4], dark)];
    for (let index = 0; index < 6; index++) parts.push(part("外端固定在转子且内端自由的扫掠叶", "extrude", trim, [0, 1.3, 0], [1, 1, 1], [0, 0, index * 60], { depth: 0.04, profile: [{ x: 0.2, y: -0.015 }, { x: 0.42, y: -0.19 }, { x: 0.99, y: -0.17 }, { x: 1.025, y: 0.03 }, { x: 0.65, y: 0.1 }, { x: 0.3, y: 0.09 }] }));
    for (const side of [-1, 1]) parts.push(box("可安装于船体隧道的外侧支耳", [side * 1.2, 1.3, 0], [0.3, 0.4, 0.35], body), box("外侧支耳承力肋", [side * 1.11, 1.3, -0.19], [0.15, 0.55, 0.055], dark));
    return parts;
  } },
  { name: "往复式脚踏双摆鳍船用驱动器", theme: "现代", itemType: "构件", tags: ["双摆鳍脚踏驱动", "皮艇脚踏机构", "往复水翼"], create: () => {
    const parts: ModelPart[] = [box("纵置水密传动脊", [0, 0.67, 0], [0.14, 0.18, 0.65], dark), cylinder("两侧脚臂共同承载轴", [0, 0.74, 0], [0.065, 0.4, 0.065], body, [0, 0, 90]), ...[-1, 1].map(side => cylinder("脚臂索鼓", [side * 0.14, 0.74, 0], [0.14, 0.06, 0.14], trim, [0, 0, 90]))];
    for (const side of [-1, 1]) {
      parts.push(strut("前后交替摆动的脚踏臂", [side * 0.17, 0.74, 0], [side * 0.17, 1.15 + side * 0.07, side * 0.18 - 0.35], 0.035, body), box("独立脚踏防滑垫", [side * 0.17, 1.15 + side * 0.07, side * 0.18 - 0.4], [0.13, 0.045, 0.2], dark), cylinder("水下鳍片前缘摆动钢杆", [0, 0.37, side * 0.22], [0.014, 0.59, 0.014], body), part("可弯曲的连续薄水翼鳍片", "extrude", dark, [0, 0, side * 0.22], [1, 1, 1], [0, 90, 0], { depth: 0.008, profile: [{ x: -0.025, y: 0.65 }, { x: 0.17, y: 0.58 }, { x: 0.21, y: 0.16 }, { x: 0.14, y: 0.04 }, { x: -0.025, y: 0 }] }), cylinder("水密脊内摆鳍横轴", [0, 0.7, side * 0.22], [0.06, 0.24, 0.06], trim, [0, 0, 90]));
    }
    parts.push(rope("脚鼓与前后鳍轴之间的闭合控制索", [[0.11, 0.8, -0.23], [0.11, 0.85, 0], [0.11, 0.8, 0.23], [0.11, 0.64, 0.23], [0.11, 0.64, -0.23], [0.11, 0.8, -0.23]], 0.005, trim));
    return parts;
  } },
  { name: "横杆稳向双弧爪海军锚", theme: "欧式", itemType: "构件", tags: ["有杆锚", "Admiralty anchor", "海军锚"], create: () => {
    const parts: ModelPart[] = [box("长直受拉锚杆", [0, 1.48, 0], [0.14, 2.55, 0.14], dark), cylinder("垂直锚爪平面的长木横杆", [0, 2.35, 0], [0.18, 2.6, 0.18], wood, [90, 0, 0]), box("横杆夹紧铁箍", [0, 2.35, 0], [0.28, 0.25, 0.29], dark), ring("锚杆顶端闭合卸扣眼", dark, 0.16, 0.045, 2.88, 0.1, { rotation: { x: 90, y: 0, z: 0 } }), box("锚冠加厚受力连接", [0, 0.28, 0], [0.44, 0.32, 0.22], dark)];
    for (const side of [-1, 1]) parts.push(part("与锚冠整体相连的上弯长锚臂", "extrude", dark, [0, 0, 0], [1, 1, 1], [0, 0, 0], { depth: 0.15, profile: [[0, 0.12], [side * 0.28, 0.14], [side * 0.78, 0.36], [side * 1.03, 0.85], [side * 0.92, 1.02], [side * 0.61, 0.53], [side * 0.2, 0.33], [0, 0.35]].map(([x, y]) => ({ x: x!, y: y! })) }), part("向上掘底的三角锚爪掌", "extrude", body, [side * 0.94, 0.85, 0], [1, 1, 1], [0, side * 25, 0], { depth: 0.32, profile: [{ x: side * -0.16, y: -0.13 }, { x: side * 0.12, y: 0.24 }, { x: side * 0.17, y: -0.17 }] }));
    return parts;
  } },
  { name: "凹底蘑菇头永久系泊锚", theme: "现代", itemType: "构件", tags: ["蘑菇锚", "永久系泊", "mushroom anchor"], create: () => [part("下侧凹空可埋泥的蘑菇盘", "lathe", dark, [0, 0, 0], [1, 1, 1], [0, 0, 0], { profile: [{ x: 0.75, y: 0 }, { x: 0.75, y: 0.09 }, { x: 0.64, y: 0.29 }, { x: 0.38, y: 0.45 }, { x: 0, y: 0.52 }, { x: 0, y: 0.4 }, { x: 0.35, y: 0.34 }, { x: 0.56, y: 0.21 }, { x: 0.65, y: 0.06 }, { x: 0.65, y: 0 }, { x: 0.75, y: 0 }] }), cylinder("蘑菇盘中央锚杆", [0, 1.05, 0], [0.13, 1.2, 0.13], dark), cylinder("锚杆底部承力凸肩", [0, 0.53, 0], [0.3, 0.17, 0.3], dark), ring("锚链连接闭合锻眼", body, 0.16, 0.045, 1.76, 0.1, { rotation: { x: 90, y: 0, z: 0 } })] },
  { name: "锁套回折四弯爪小艇锚", theme: "现代", itemType: "构件", tags: ["折爪锚", "grapnel anchor", "锁套小艇锚"], create: () => {
    const parts: ModelPart[] = [cylinder("细长承载锚柄", [0, 0.58, 0], [0.055, 0.99, 0.055], dark), cylinder("锚爪共享底部铰座", [0, 0.18, 0], [0.17, 0.2, 0.17], body), cylinder("可滑动的锁爪套筒", [0, 0.37, 0], [0.11, 0.22, 0.11], body), ring("锚柄末端绳眼", dark, 0.09, 0.025, 1.12, 0.055, { rotation: { x: 90, y: 0, z: 0 } })];
    for (let index = 0; index < 4; index++) parts.push(part("在下端铰接并向外上弯的锚爪", "extrude", dark, [0, 0, 0], [1, 1, 1], [0, index * 90, 0], { depth: 0.042, profile: [{ x: 0, y: 0.1 }, { x: 0.2, y: 0.08 }, { x: 0.43, y: 0.22 }, { x: 0.55, y: 0.53 }, { x: 0.48, y: 0.6 }, { x: 0.36, y: 0.29 }, { x: 0.16, y: 0.19 }, { x: 0, y: 0.22 }] }));
    return parts;
  } },
  { name: "厚壁封闭椭圆巴拿马导缆孔", theme: "现代", itemType: "构件", tags: ["巴拿马导缆孔", "Panama chock", "封闭导缆"], create: () => {
    const ellipse = (rx: number, ry: number, count: number): [number, number][] => Array.from({ length: count }, (_, index) => [Math.cos(index * Math.PI * 2 / count) * rx, Math.sin(index * Math.PI * 2 / count) * ry]);
    const frame = polygon("前后真正贯通的圆滑厚壁导缆框", body, ellipse(0.7, 0.4, 24), 0.34, [0, 0.56, -0.17], [ellipse(0.46, 0.22, 20)]);
    frame.rotation.x = 90;
    return [frame, box("导缆孔下部安装脚座", [0, 0.08, 0], [1.62, 0.16, 0.6], dark), ...[-1, 1].map(side => strut("椭圆框侧向厚肋脚", [side * 0.58, 0.15, 0], [side * 0.61, 0.44, 0], 0.18, body)), ...[-1, 1].flatMap(side => [-1, 1].map(end => cylinder("甲板安装紧固头", [side * 0.67, 0.19, end * 0.21], [0.07, 0.06, 0.07], trim)))];
  } },
  { name: "双臂滑轨重力式吊艇架", theme: "现代", itemType: "设施", tags: ["重力吊艇架", "救生艇吊架", "gravity boat davit"], create: () => {
    const parts: ModelPart[] = [box("双架之间贯通安装底梁", [-0.55, 0.16, 0], [1.65, 0.32, 8.3], dark), box("同步卷筒的下部轴承托座", [-0.6, 0.39, 0], [0.45, 0.2, 1.6], dark), cylinder("中部同步卷缆筒", [-0.6, 0.75, 0], [0.62, 2, 0.62], body, [90, 0, 0]), box("带刹车的卷扬减速箱", [-0.6, 0.62, 1.3], [0.7, 0.75, 0.5], dark)];
    for (const z of [-3.6, 3.6]) {
      parts.push(box("吊艇架脚底固定板", [0, 0.16, z], [1.8, 0.32, 1.2], dark), strut("滑轨背部支承柱", [-0.45, 0.3, z], [0.35, 2.8, z], 0.24, body), strut("外伸轨道斜撑", [0.5, 0.3, z], [1.85, 3.1, z], 0.2, body));
      for (const offset of [-0.22, 0.22]) {
        parts.push(strut("双片下斜滑轨", [0, 0.55, z + offset], [0.7, 2.8, z + offset], 0.13, dark), strut("双片外伸滑轨", [0.7, 2.8, z + offset], [2.55, 3.52, z + offset], 0.13, dark), strut("双片滑轨顶缘", [0.7, 2.98, z + offset], [2.55, 3.7, z + offset], 0.08, body));
      }
      parts.push(strut("沿轨滚出舷外的吊臂", [1.65, 3.28, z], [2.72, 4.5, z], 0.2, body), strut("吊臂头部回撑", [2.12, 3.47, z], [2.72, 4.5, z], 0.12, dark), cylinder("吊臂下端双轨滚轮轴", [1.65, 3.28, z], [0.07, 0.67, 0.07], trim, [90, 0, 0]), ...[-1, 1].map(side => cylinder("接触钢轨的吊臂滚轮", [1.65, 3.28, z + side * 0.22], [0.3, 0.11, 0.3], trim, [90, 0, 0])), cylinder("吊臂头部滑轮", [2.72, 4.5, z], [0.32, 0.18, 0.32], dark, [90, 0, 0]), rope("由底部卷筒到顶端滑轮的钢索", [[-0.6, 0.8, Math.sign(z) * 0.9], [0.05, 1, z], [0.7, 2.9, z], [2.72, 4.53, z]], 0.018, dark), ...[-1, 1].map(side => strut("滑轮下垂的双程吊艇钢索", [2.72 + side * 0.07, 4.4, z], [2.72 + side * 0.07, 0.98, z], 0.018, dark)), box("下部吊索承载滑块", [2.72, 0.99, z], [0.24, 0.22, 0.13], dark), ring("吊艇索下方承载吊眼", trim, 0.16, 0.045, 0.75, 0.1, { position: { x: 2.72, y: 0.75, z }, rotation: { x: 90, y: 0, z: 0 } }));
    }
    return parts;
  } },
  { name: "双板液压对折货舱盖总成", theme: "现代", itemType: "构件", tags: ["折叠货舱盖", "folding hatch cover", "折板舱盖"], create: () => {
    const parts: ModelPart[] = [...[-1, 1].map(side => box("敞开货舱围板长边", [side * 3.1, 0.65, 0], [0.22, 1.3, 8.6], body)), ...[-1, 1].map(end => box("敞开货舱围板端边", [0, 0.65, end * 4.2], [6.2, 1.3, 0.22], body))];
    for (const side of [-1, 1]) parts.push(box("盖板滚轮连续长导轨", [side * 3.08, 1.36, 0], [0.18, 0.16, 8.6], dark));
    const hinge: Triple = [0, 5.02, -2.2], lower: Triple = [0, 1.5, -4.2], upper: Triple = [0, 1.5, -0.2];
    for (const [centerZ, angle] of [[-3.2, -60.4], [-1.2, 60.4]]) {
      parts.push(box("保持板间真空隙的折起舱盖板", [0, 3.26, centerZ!], [5.95, 0.18, 4.05], trim, [angle!, 0, 0]));
      for (const x of [-2.1, 0, 2.1]) parts.push(strut("板下连续承力纵肋", [x, 1.5, centerZ! + (centerZ! < -2 ? -1 : 1)], [x, 5.02, -2.2], 0.12, dark));
    }
    parts.push(cylinder("两盖板之间贯通共铰轴", hinge, [0.18, 6.3, 0.18], dark, [0, 0, 90]), cylinder("第一板在货舱端部的固定铰轴", lower, [0.18, 6.3, 0.18], dark, [0, 0, 90]));
    for (const side of [-1, 1]) parts.push(cylinder("第二盖板落在轨上的滚轮", [side * 3.08, upper[1], upper[2]], [0.38, 0.18, 0.38], dark, [0, 0, 90]), strut("端部液压举升缸筒", [side * 2.75, 0.6, -3.8], [side * 2.75, 2.65, -3.25], 0.2, body), strut("液压缸至首盖板的活塞杆", [side * 2.75, 2.6, -3.26], [side * 2.75, 3.6, -3.02], 0.08, dark), cylinder("活塞杆端盖板销轴", [side * 2.75, 3.6, -3.02], [0.13, 0.32, 0.13], dark, [0, 0, 90]));
    return parts;
  } },
];
