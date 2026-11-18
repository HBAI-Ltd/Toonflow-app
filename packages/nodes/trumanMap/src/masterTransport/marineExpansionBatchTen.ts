import { part, ring, type ModelPart, type Triple } from "../assetModelParts";
import { polygon } from "../masterNature/shared";
import { box, cylinder, strut, surface, transportColors, type TransportDefinition } from "./parts";

// 原创简化的历史试验船构造；滚盘与滚筒均为静态展示，不承诺史料中的航速或稳定性。
// https://www.usni.org/magazines/proceedings/1879/december/development-armor-applied-ships
// https://www.usni.org/magazines/proceedings/1896/april/professional-notes
// https://cnum.cnam.fr/pgi/fpage.php?4KY28.49/237/100/536/5/420=
// https://archives-ftp.gov.yk.ca/library/normal/Harpers_1897_11_06.pdf

const body = transportColors.body, dark = transportColors.dark, trim = transportColors.trim;

function openSmokePipe(position: Triple, radius: number, height: number): ModelPart {
  return part("上端真正中空的锅炉烟管", "lathe", dark, position, [1, 1, 1], [0, 0, 0], { profile: [{ x: radius, y: 0 }, { x: radius, y: height }, { x: radius - 0.08, y: height }, { x: radius - 0.08, y: 0 }, { x: radius, y: 0 }] });
}

function screw(position: Triple, radius: number): ModelPart[] {
  const parts = [cylinder("螺旋桨短轮毂", position, [radius * 0.3, radius * 0.45, radius * 0.3], trim, [90, 0, 0])];
  for (let index = 0; index < 3; index++) {
    const angle = index * Math.PI * 2 / 3, points: Triple[] = [[0.1, 0, -0.08], [radius * 0.9, radius * 0.1, 0.08], [radius, radius * 0.35, 0.18], [radius * 0.18, radius * 0.23, 0.02]].map(([x, y, z]) => [x! * Math.cos(angle) - y! * Math.sin(angle), x! * Math.sin(angle) + y! * Math.cos(angle), z!] as Triple);
    parts.push(surface("绕轴分布并带螺距的真实桨叶", trim, points, [0, 1, 2, 0, 2, 3], position));
  }
  return parts;
}

export const marineExpansionBatchTen: TransportDefinition[] = [
  { name: "平底圆盘船壳中央露炮台岸防铁甲舰", theme: "欧式", tags: ["圆形铁甲舰", "circular ironclad", "popoffka"], create: () => {
    const parts: ModelPart[] = [part("由平底过渡到整圆水线和斜甲板的独立船体", "lathe", body, [0, 0, 0], [1, 1, 1], [0, 0, 0], { profile: [{ x: 0, y: 0.55 }, { x: 11.55, y: 0.55 }, { x: 14.8, y: 1.6 }, { x: 15.4, y: 3.7 }, { x: 5, y: 4.9 }, { x: 0, y: 4.9 }] }), part("中央留有真实炮台空腔的固定厚装甲围壁", "lathe", dark, [0, 4.86, 0], [1, 1, 1], [0, 0, 0], { profile: [{ x: 4.65, y: 0 }, { x: 5.05, y: 0 }, { x: 5.05, y: 2.1 }, { x: 4.65, y: 2.1 }, { x: 4.65, y: 0 }] }), box("圆船后部舵机突出舱", [0, 2.7, 15.1], [3, 1.5, 2.6], dark), cylinder("中央炮台内部圆形地台", [0, 5.05, 0], [9.25, 0.3, 9.25], trim), ring("外缘连续安全上栏", trim, 15.25, 0.035, 4.7, 0.05)];
    for (let index = 0; index < 12; index++) {
      const x = (index - 5.5) * 1.8, length = 2 * Math.sqrt(11.55 ** 2 - x ** 2);
      parts.push(box("平行布置并实接平底的浅龙骨", [x, 0.28, 0], [0.2, 0.56, length], dark));
      const angle = index * Math.PI / 6;
      parts.push(strut("圆斜甲板边缘栏杆立柱", [Math.cos(angle) * 15.25, 3.72, Math.sin(angle) * 15.25], [Math.cos(angle) * 15.25, 4.72, Math.sin(angle) * 15.25], 0.045, trim));
    }
    for (const x of [-1.5, 1.5]) {
      parts.push(cylinder("露炮台内的独立炮架回转底座", [x, 5.5, 0.6], [2.1, 0.6, 2.1], dark), box("炮管俯仰双耳支座", [x, 6.55, 0.5], [1.25, 1.5, 1.45], dark), cylinder("实接炮架的横向俯仰枢轴", [x, 7.45, 0.3], [0.3, 1.6, 0.3], trim, [0, 0, 90]), part("高于炮台围壁且有真实炮口的重炮管", "lathe", dark, [x, 7.45, 1.2], [1, 1, 1], [-90, 0, 0], { profile: [{ x: 0, y: 0 }, { x: 0.55, y: 0 }, { x: 0.55, y: 0.4 }, { x: 0.38, y: 5 }, { x: 0.22, y: 5 }, { x: 0.22, y: 0.4 }, { x: 0, y: 0.4 }] }));
    }
    for (const side of [-1, 1]) {
      parts.push(box("低层锅炉舱甲板罩", [side * 7.5, 4.85, 3.5], [3, 1.3, 4.8], dark), openSmokePipe([side * 7.5, 5.48, 3.5], 0.6, 4), box("斜甲板舷侧低舱棚", [side * 9.5, 4.45, -4], [3.2, 1, 3], trim));
      for (const x of [1.5, 4.5, 7.5]) {
        const shaftX = side * x;
        parts.push(cylinder("由圆船艉部伸向独立螺旋桨的轴", [shaftX, 1.4, 13.7], [0.16, 4, 0.16], dark, [90, 0, 0]), ...screw([shaftX, 1.4, 15.75], 1));
      }
    }
    parts.push(box("前部低矮驾驶室实体基座", [0, 4.5, -10.1], [3.2, 0.8, 2.6], dark), box("驾驶室前方观察窗", [0, 5.16, -11.36], [2.8, 0.48, 0.045], transportColors.glass), box("驾驶室观察层顶盖", [0, 5.5, -10.1], [3.4, 0.12, 2.8], dark));
    for (const x of [-1.52, 1.52]) parts.push(box("驾驶室窗带两侧支承", [x, 5.17, -10.1], [0.12, 0.65, 2.6], dark));
    return parts;
  } },
  { name: "双侧透镜滚盘浮体承载式蒸汽试验船", theme: "欧式", tags: ["Bazin roller ship", "滚盘浮体船", "浮轮式试验船"], create: () => {
    const parts: ModelPart[] = [box("由轴架架高的长方形主甲板", [0, 6.15, 0], [7.8, 0.35, 39], body), ...[-1, 1].map(side => box("实接甲板底部的纵向承载主梁", [side * 3.3, 5.65, 0], [0.4, 0.7, 38], dark))];
    for (const z of [-12, 0, 12]) {
      parts.push(box("将两侧滚盘荷载送入平台的横框", [0, 5.7, z], [7.8, 0.5, 1.2], dark), cylinder("独立轮对的贯通横向驱动轴", [0, 5, z], [0.35, 11, 0.35], dark, [0, 0, 90]), box("滚盘轮对独立减速传动箱", [0, 5.15, z], [1.6, 1.15, 1.1], trim));
      for (const side of [-1, 1]) parts.push(part("整体密封且两面凸起的透镜形浮力滚盘", "lathe", body, [side * 5.3, 5, z], [1, 1, 1], [0, 0, 90], { profile: [{ x: 0, y: -1.4 }, { x: 3.8, y: -0.8 }, { x: 5, y: 0 }, { x: 3.8, y: 0.8 }, { x: 0, y: 1.4 }] }), cylinder("滚盘内侧与横轴同心的承载轴承", [side * 3.65, 5, z], [0.9, 0.65, 0.9], dark, [0, 0, 90]), box("轴承上方实接甲板横框的吊座", [side * 3.65, 5.55, z], [0.45, 1.1, 0.8], dark));
    }
    parts.push(box("甲板上部锅炉与机器舱低围壁", [0, 6.85, 1], [4.8, 1.05, 10], trim), box("机器舱上部平顶", [0, 8.52, 1], [5, 0.12, 10.2], dark), ...[-3.95, 5.95].map(z => box("机器舱窗带端部实体承重墙", [0, 7.92, z], [4.8, 1.1, 0.12], trim)), openSmokePipe([0, 8.58, 3], 0.65, 3.3), box("前方高位操舵台下座", [0, 6.9, -14], [3.4, 1.15, 3], trim), box("操舵台顶棚", [0, 8.8, -14], [4, 0.14, 3.6], dark), box("操舵台前窗", [0, 8, -15.5], [3.15, 1.35, 0.04], transportColors.glass), cylinder("主螺旋桨纵向传动轴", [0, 2.6, 19], [0.3, 3.3, 0.3], dark, [90, 0, 0]), ...screw([0, 2.6, 20.65], 1.5), cylinder("艉轴支架轴承", [0, 2.6, 18.7], [0.75, 0.45, 0.75], body, [90, 0, 0]), strut("由后甲板伸到艉轴的实心承架", [0, 6, 18.7], [0, 2.6, 18.7], 0.3, dark), box("后部实接舵杆的竖直舵叶", [0, 2.2, 21.6], [0.22, 2.7, 1.2], dark), cylinder("艉部下伸舵杆", [0, 4.4, 21.2], [0.18, 4.6, 0.18], dark), strut("甲板后沿到舵杆的上部支承", [0, 6.1, 19.4], [0, 6.1, 21.2], 0.24, dark));
    for (const side of [-1, 1]) {
      for (const z of [-15.5, -12.5]) parts.push(box("操舵台窗间立柱", [side * 1.65, 8.05, z], [0.1, 1.5, 0.1], dark));
      parts.push(box("嵌在真实窗带空位内的机器舱侧窗", [side * 2.36, 7.92, 1], [0.04, 1.04, 9.8], transportColors.glass));
      for (const z of [-3.9, 1, 5.9]) parts.push(box("从低围壁承到舱顶的窗间柱", [side * 2.36, 7.92, z], [0.12, 1.1, 0.13], trim));
      parts.push(strut("架高主甲板两侧长安全栏", [side * 3.72, 7.35, -19], [side * 3.72, 7.35, 19], 0.045, trim));
      for (const z of [-19, -6, 6, 19]) parts.push(strut("长甲板护栏立柱", [side * 3.72, 6.3, z], [side * 3.72, 7.35, z], 0.045, trim));
    }
    return parts;
  } },
  { name: "双端内台承轮驱动整壳旋转滚筒试验船", theme: "欧式", tags: ["Knapp roller boat", "滚筒船", "整壳旋转试验船"], create: () => {
    const parts: ModelPart[] = [part("两端缩口而内部真正贯通的薄壁旋转船筒", "lathe", body, [0, 3.8, 0], [1, 1, 1], [0, 0, 90], { profile: [{ x: 2.25, y: -16.75 }, { x: 3.8, y: -15.25 }, { x: 3.8, y: 15.25 }, { x: 2.25, y: 16.75 }, { x: 2.13, y: 16.75 }, { x: 3.68, y: 15.25 }, { x: 3.68, y: -15.25 }, { x: 2.13, y: -16.75 }, { x: 2.25, y: -16.75 }] })];
    for (let index = 0; index < 16; index++) {
      const angle = index * Math.PI / 8;
      parts.push(box("顺长筒轴线布置的外壳推水凸肋", [0, 3.8 + Math.cos(angle) * 3.84, Math.sin(angle) * 3.84], [29.8, 0.1, 0.35], dark, [angle * 180 / Math.PI, 0, 0]));
    }
    for (const side of [-1, 1]) {
      const x = side * 13.4;
      const openings = [-1, 1].map(sign => [[side * 0.9 - 0.27, sign * 1.3 - 0.49], [side * 0.9 + 0.27, sign * 1.3 - 0.49], [side * 0.9 + 0.27, sign * 1.3 + 0.49], [side * 0.9 - 0.27, sign * 1.3 + 0.49]] as [number, number][]);
      parts.push(polygon("具有两个贯通传动带孔的端部机器工作平台", trim, [[-2.9, -1.85], [2.9, -1.85], [2.9, 1.85], [-2.9, 1.85]], 0.3, [x, 2.55, 0], openings), box("由筒端真实开口伸出的登乘短台", [side * 16.85, 2.95, 0], [1.5, 0.2, 2.7], trim), part("旋转圆筒外侧连续加固箍", "lathe", dark, [side * 14.5, 3.8, 0], [1, 1, 1], [0, 0, 90], { profile: [{ x: 3.8, y: -0.09 }, { x: 3.9, y: -0.09 }, { x: 3.9, y: 0.09 }, { x: 3.8, y: 0.09 }, { x: 3.8, y: -0.09 }] }), cylinder("端台立式蒸汽锅炉", [side * 12, 3.85, 0], [1.3, 2, 1.3], dark), openSmokePipe([side * 12, 4.85, 0], 0.26, 1), cylinder("筒端平台下的转向舵杆", [side * 17.2, 2, 0], [0.12, 2.05, 0.12], dark), box("端部位于工作台下的独立转向尾板", [side * 17.2, 1.5, 0], [0.14, 1.6, 2.1], dark));
      for (const sign of [-1, 1]) {
        const z = sign * 0.95, length = Math.hypot(1.46, 1.25), normalY = -sign * 1.25 / length, normalZ = -1.46 / length;
        parts.push(box("端台驱动蒸汽机的底座与缸体", [side * 14, 3.2, z], [1.3, 0.7, 0.65], dark), strut("锅炉至两部端台发动机的供汽管", [side * 12, 4.25, z * 0.3], [side * 14, 3.5, z], 0.08, trim), cylinder("相邻两个承轮共用的横向传动轴", [x, 1.64, sign * 2.2], [0.13, 3.34, 0.13], dark, [0, 0, 90]), cylinder("蒸汽机端部传动带主动轮", [side * 14.3, 3.1, z], [0.48, 0.15, 0.48], trim, [0, 0, 90]), cylinder("承轮轴上的同平面从动带轮", [side * 14.3, 1.64, sign * 2.2], [0.48, 0.15, 0.48], trim, [0, 0, 90]));
        for (const offset of [-0.24, 0.24]) parts.push(strut("经过真实平台孔的外切传动带直线段", [side * 14.3, 3.1 + normalY * offset, z + normalZ * offset], [side * 14.3, 1.64 + normalY * offset, sign * 2.2 + normalZ * offset], 0.05, dark));
      }
      for (const axial of [-1.5, 1.5]) for (const z of [-2.2, 2.2]) parts.push(cylinder("与圆筒内壁真实相切的承载驱动轮", [x + axial, 1.64, z], [1.2, 0.34, 1.2], dark, [0, 0, 90]), strut("承轮轴心到内平台下方的实体吊架", [x + axial, 1.64, z], [x + axial, 2.55, Math.sign(z) * 1.7], 0.13, dark));
      for (const z of [-1.26, 1.26]) parts.push(strut("筒外登乘台安全栏", [side * 16.35, 3.95, z], [side * 17.5, 3.95, z], 0.04, trim), strut("筒外登乘台栏杆立柱", [side * 17.5, 3.03, z], [side * 17.5, 3.95, z], 0.04, trim));
    }
    return parts;
  } },
];
