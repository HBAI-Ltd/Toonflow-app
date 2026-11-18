import { part, type ModelPart } from "../assetModelParts";
import { polygon } from "../masterNature/shared";
import { box, cylinder, shipHull, strut, transportColors, type TransportDefinition } from "./parts";

// 原创简化的完整船型，按结构识别；不是某一品牌型号的制造规格。
// https://www.dco.uscg.mil/Portals/9/DCO%20Documents/5p/CG-5PC/CG-CVC/CVC1/towing/bridge/program/TVBP_Outreach_Orientation_and_Indoc_Workbook.pdf
// https://usna.edu/NAOE/_files/documents/Courses/EN400/02.02%20Chapter%202.pdf
// https://www.englisheng.com.au/semi-submersibles.html

const body = transportColors.body, dark = transportColors.dark, trim = transportColors.trim, glass = transportColors.glass;

export const marineExpansionBatchThree: TransportDefinition[] = [
  { name: "平艏双顶推膝高驾驶台内河推船", theme: "现代", tags: ["内河推船", "方艏推轮", "pushboat", "高位驾驶台"], create: () => {
    const parts: ModelPart[] = [polygon("适于近岸浅航道的方艏平底船壳", body, [[-4.3, -11], [4.3, -11], [4.3, 8], [3.4, 11], [-3.4, 11], [-4.3, 8]], 1.8), box("低层机舱工作室", [0, 3.2, 2], [5.4, 2.8, 10], trim), box("机舱顶侧走道", [0, 4.67, 2], [6, 0.14, 10.6], dark), box("高置驾驶室地板", [0, 8.55, 0], [5.6, 0.2, 4.4], dark), box("高驾驶室下半舱板", [0, 9.05, 0], [5.1, 0.8, 4], body), box("高驾驶室独立顶棚", [0, 10.55, 0], [5.7, 0.2, 4.5], trim), box("驾驶室前透光窗", [0, 9.94, -2.02], [4.9, 1.05, 0.04], glass), box("驾驶室后透光窗", [0, 9.94, 2.02], [4.9, 1.05, 0.04], glass), ...[-1, 1].map(side => box("驾驶室长侧透光窗", [side * 2.56, 9.94, 0], [0.04, 1.05, 4], glass)), box("驾驶台仪表倾台", [0, 9.39, -1.5], [2.7, 0.4, 0.65], dark)];
    for (const side of [-1, 1]) {
      parts.push(box("将推力传入船壳的高顶推膝", [side * 2.7, 3.3, -11.08], [0.55, 4.7, 0.55], dark), box("与驳船直接接触的弹性顶推面", [side * 2.7, 3.2, -11.48], [0.65, 3.8, 0.28], transportColors.wood), strut("顶推膝后方纵向撑架", [side * 2.7, 1.8, -7.2], [side * 2.7, 4.8, -11], 0.25, body), strut("高驾驶室下方承载柱", [side * 2.3, 4.7, -1.5], [side * 2.3, 8.45, -1.5], 0.22, body), strut("驾驶室高架后支柱", [side * 2.3, 4.7, 1.5], [side * 2.3, 8.45, 1.5], 0.22, body), strut("高架承柱斜向稳定撑", [side * 2.3, 4.7, 1.5], [side * 2.3, 8.45, -1.5], 0.16, dark), cylinder("机舱双侧排烟管", [side * 2.4, 6.6, 4.5], [0.42, 4, 0.42], dark), box("舷侧防撞长护舷", [side * 4.35, 1.7, -0.5], [0.18, 0.45, 17], dark), strut("露天前工作甲板护栏", [side * 4, 2.8, -9], [side * 4, 2.8, -4], 0.055, trim), ...[-9, -4].map(z => strut("前甲板护栏竖柱", [side * 4, 1.8, z], [side * 4, 2.8, z], 0.055, trim)));
      for (const z of [-1.9, 1.9]) parts.push(box("高驾驶室实际窗间竖柱", [side * 2.5, 9.95, z], [0.1, 1.2, 0.1], dark));
      parts.push(box("艉下垂直操纵舵叶", [side * 2.3, 0.8, 10.7], [0.1, 1.1, 1.2], dark));
    }
    for (let index = 0; index < 8; index++) parts.push(box("机舱侧登顶梯级", [-3.4, 2.05 + index * 0.36, 6.4 - index * 0.45], [0.7, 0.08, 0.48], dark));
    for (const x of [-3.75, -3.05]) parts.push(strut("机舱侧登顶梯斜梁", [x, 1.8, 6.8], [x, 4.7, 2.9], 0.07, body));
    for (const z of [-0.35, 0.35]) parts.push(strut("高台后部攀登梯侧杆", [-2.85, 4.7, z], [-2.85, 8.6, z], 0.05, trim));
    for (let index = 0; index < 10; index++) parts.push(strut("高驾驶台实际梯档", [-2.85, 4.9 + index * 0.38, -0.35], [-2.85, 4.9 + index * 0.38, 0.35], 0.04, trim));
    for (const value of parts.filter(value => value.color === glass)) value.opacity = 0.35;
    return parts;
  } },
  { name: "刚性侧壁封端气垫高速客船", theme: "现代", tags: ["水面效应船", "SES", "侧壁气垫船", "水喷推进"], create: () => {
    const vent = (x: number): [number, number][] => Array.from({ length: 12 }, (_, index) => [x + Math.cos(index * Math.PI / 6) * 0.5, 9 + Math.sin(index * Math.PI / 6) * 0.5]);
    const parts: ModelPart[] = [polygon("升力风道真正贯通的跨侧壁主甲板", body, [[-4.6, -12.5], [4.6, -12.5], [4.6, 12.5], [-4.6, 12.5]], 0.3, [0, 2.25, 0], [vent(-2.1), vent(2.1)]), box("客舱连续轻型顶棚", [0, 5.03, -0.3], [7.6, 0.16, 13.5], trim), box("客舱前部下半舱壁", [0, 2.98, -6.7], [7.4, 0.86, 0.1], body), box("客舱倾斜前风挡", [0, 4.17, -6.5], [7.2, 1.55, 0.05], glass, [-15, 0, 0]), ...[-1, 1].map(side => box("两侧窗下连续舱壁", [side * 3.65, 3, -0.3], [0.1, 0.9, 12.8], body)), ...[-1, 1].map(side => box("长侧透明窗带", [side * 3.65, 4.17, -0.3], [0.04, 1.45, 12.8], glass)), ...[-1, 1].map(side => box("后端客舱门两侧壁", [side * 2.1, 3.75, 6.15], [3.1, 2.4, 0.1], body)), box("后端门上方舱壁", [0, 4.79, 6.15], [1.1, 0.3, 0.1], body)];
    for (const side of [-1, 1]) {
      const hull = shipHull(1.5, 29, 2.4);
      hull.name = "延伸进水中的刚性细长侧船体";
      hull.position.x = side * 3.85;
      parts.push(hull, box("纵置乘客长座垫", [side * 2.6, 3.05, -0.1], [0.65, 0.9, 8], transportColors.wood), box("纵置乘客长靠背", [side * 2.91, 3.63, -0.1], [0.12, 1.2, 8], trim), part("船艉真正开放的水喷推进出口", "lathe", dark, [side * 3.85, 1.2, 14], [1, 1, 1], [90, 0, 0], { profile: [{ x: 0.28, y: -0.55 }, { x: 0.4, y: -0.55 }, { x: 0.32, y: 0.55 }, { x: 0.22, y: 0.55 }, { x: 0.28, y: -0.55 }] }));
      for (const z of [-6.5, -2.2, 2.1, 6.2]) parts.push(box("侧窗带的实际承重竖框", [side * 3.65, 4.18, z], [0.1, 1.55, 0.1], dark));
      parts.push(part("甲板升力风道上的中空风扇围壳", "lathe", dark, [side * 2.1, 2.85, 9], [1, 1, 1], [0, 0, 0], { profile: [{ x: 0.5, y: -0.35 }, { x: 0.8, y: -0.35 }, { x: 0.8, y: 0.35 }, { x: 0.5, y: 0.35 }, { x: 0.5, y: -0.35 }] }), cylinder("升力风扇中央电机轴", [side * 2.1, 3.14, 9], [0.22, 0.45, 0.22], body), strut("风扇电机到围壳的安装桥", [side * 2.1 - 0.73, 3.2, 9], [side * 2.1 + 0.73, 3.2, 9], 0.08, body));
      for (let index = 0; index < 3; index++) {
        const angle = index * Math.PI * 2 / 3;
        parts.push(box("风道内部的升力扇叶", [side * 2.1 + Math.cos(angle) * 0.28, 2.95, 9 + Math.sin(angle) * 0.28], [0.42, 0.045, 0.14], body, [0, -index * 120, 0]));
      }
    }
    for (const end of [-1, 1]) for (let index = 0; index < 8; index++) parts.push(box("仅位于前后两端的分片柔性封气裙", [(index - 3.5) * 0.8, 1.3, end < 0 ? -10.5 : 12], [0.81, 1.9, 0.2], dark, [end * 6, 0, 0]));
    for (const value of parts.filter(value => value.color === glass)) value.opacity = 0.35;
    return parts;
  } },
  { name: "下层长观察舱半潜式观光客船", theme: "现代", tags: ["半潜式观光船", "semi submarine", "非下潜客船", "水下观景舱"], create: () => {
    const well: [number, number][] = [[-0.62, -6], [0.62, -6], [0.62, -2], [-0.62, -2]];
    const parts: ModelPart[] = [polygon("下层观察舱的封闭底壳", dark, [[-1.15, -7], [1.15, -7], [1.15, 6], [-1.15, 6]], 0.3), polygon("带真实下舱梯井的上层游览甲板", body, [[-1.2, -9], [1.2, -9], [3, -6.5], [3, 8.4], [-3, 8.4], [-3, -6.5]], 0.25, [0, 3, 0], [well]), polygon("与梯井相接的下观察舱顶盖", trim, [[-1.15, -7], [1.15, -7], [1.15, 6], [-1.15, 6]], 0.25, [0, 2.75, 0], [well]), ...[-1, 1].map(side => box("观察舱窗带下面的低围板", [side * 1.12, 0.5, -0.5], [0.08, 0.4, 13], body)), ...[-1, 1].map(side => box("观察舱窗带上方结构板", [side * 1.12, 2.48, -0.5], [0.08, 0.54, 13], body)), ...[-1, 1].map(side => box("由底舱向外观察的连续透明窗", [side * 1.12, 1.46, -0.5], [0.035, 1.5, 13], glass)), box("下观察舱前端封壁", [0, 1.5, -6.93], [2.3, 2.4, 0.1], body), box("下观察舱后端封壁", [0, 1.5, 5.96], [2.3, 2.4, 0.1], body), box("上层乘客区轻型雨棚", [0, 5.8, -0.2], [5.5, 0.15, 15.5], trim), box("前端舵位控制台", [0, 3.74, -7.2], [1.5, 0.98, 0.7], dark), box("前端透明挡风面", [0, 4.43, -7], [4.6, 1.35, 0.05], glass)];
    for (const side of [-1, 1]) {
      const hull = shipHull(1.4, 16.8, 1.35);
      hull.name = "始终浮在水面的独立侧浮体";
      hull.position.x = side * 2.25;
      hull.position.y = 1.75;
      parts.push(hull, box("上层游客长条坐凳", [side * 2, 3.67, 1.2], [0.65, 0.84, 9], transportColors.wood), box("上层侧座靠背", [side * 2.32, 4.2, 1.2], [0.1, 1.1, 9], trim), box("下舱独立长坐席", [side * 0.72, 0.65, 1.8], [0.48, 0.7, 6.5], transportColors.wood), box("下舱长座低靠背", [side * 0.97, 1.05, 1.8], [0.09, 0.85, 6.5], trim));
      for (const z of [-6.85, -3.65, -0.45, 2.75, 5.93]) parts.push(box("水下观察窗之间的承力立柱", [side * 1.12, 1.46, z], [0.1, 1.5, 0.11], dark));
      for (const z of [-6.5, 0, 7.1]) parts.push(strut("上层雨棚连续支柱", [side * 2.5, 3.25, z], [side * 2.5, 5.75, z], 0.055, dark));
      parts.push(strut("上层两舷安全横栏", [side * 2.8, 4.25, -6.5], [side * 2.8, 4.25, 7.9], 0.045, trim));
      for (const z of [-6.5, 0.7, 7.9]) parts.push(strut("上层安全栏的实际立杆", [side * 2.8, 3.25, z], [side * 2.8, 4.25, z], 0.045, trim));
      parts.push(strut("连通上下舱的斜梯侧梁", [side * 0.54, 3.25, -6], [side * 0.54, 0.3, -2.2], 0.09, dark));
    }
    for (let index = 0; index < 8; index++) parts.push(box("从上层甲板一直到观察舱的踏步", [0, 3.25 - (index + 0.5) * 2.95 / 8, -6 + (index + 0.5) * 3.8 / 8], [1, 0.08, 0.49], body));
    for (const value of parts.filter(value => value.color === glass)) value.opacity = 0.3;
    return parts;
  } },
];
