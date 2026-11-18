import { part, ring, type ModelPart, type Triple } from "../assetModelParts";
import { combineMeshes, tapered } from "../masterNature/shared";
import { propeller } from "./aircraftModels";
import { bodyLoft, sweptWing } from "./aerospaceExpansionBatchFive";
import { airfoil } from "./aerospaceExpansionBatchOne";
import { dish } from "./spaceModels";
import { ball, box, cylinder, strut, surface, transportColors, wheel, type TransportDefinition } from "./parts";

// 完整公路两用飞机、双自旋平台与独立可展反射器；不将换载荷或折叠状态分作主素材。
// https://www.klein-vision.com/concept-2
// https://s3vi.ndc.nasa.gov/ssri-kb/static/resources/III.4.3.1_Space_Vehicle_Control_Systems.pdf
// https://www.northropgrumman.com/wp-content/uploads/AstroMesh-DataSheet.pdf
export const aerospaceExpansionBatchFifteen: TransportDefinition[] = [
  { name: "四轮封闭舱折叠翼公路两用飞行车", theme: "现代", tags: ["公路两用飞机", "可见翼根翻折铰架", "可伸缩双尾梁", "四轮封闭乘员车舱"], create: () => {
    const parts: ModelPart[] = [bodyLoft("将公路车舱与飞机翼根承力部合为一体的低截面车身", [[-3.1, 0.12, 0.15, -0.05], [-2.5, 0.8, 0.45, 0], [-1.2, 1.0, 0.55, 0], [1.5, 1.0, 0.55, 0], [2.5, 0.6, 0.35, 0.1], [3.1, 0.1, 0.1, 0.15]], 1.0), ball("四轮车身上方的封闭双座透明乘员舱", [0, 1.55, -0.7], [1.45, 1.0, 2.3], transportColors.glass), airfoil("从乘员舱地板下方贯穿的低置中央承力翼", 1.9, 1.6, [0, 1.15, 0.2]), cylinder("车身尾部独立后推式航空电机舱", [0, 1.8, 2.75], [0.5, 0.8, 0.5], transportColors.dark, [90, 0, 0]), ...propeller(0, 1.8, 3.25, 0.75), airfoil("在伸出尾梁之间横向连接的稳定平尾", 3.0, 0.7, [0, 2.15, 5.25])];
    parts.push(strut("后置航空电机舱与低位车身承力框之间的安装座", [0, 1.2, 2.5], [0, 1.8, 2.75], 0.16));
    for (const z of [-1.8, 1.5]) parts.push(cylinder("公路四轮底盘左右轮之间的贯通轮轴", [0, 0.32, z], [0.09, 1.9, 0.09], transportColors.dark, [0, 0, 90]));
    for (const side of [-1, 1]) {
      parts.push(sweptWing("从车身侧方翻折铰架伸出的完整展开主翼", [side * 0.95, 1.15, 0.2], [side * 4.9, 1.35, 0.8], 1.6, 0.65), cylinder("与车身纵向平行的翼根翻折承载铰轴", [side * 0.95, 1.15, 0.2], [0.18, 1.4, 0.18], transportColors.dark, [90, 0, 0]), strut("在飞行展开位置锁定外翼根部的斜向支撑", [side * 0.8, 0.8, 0.6], [side * 1.7, 1.15, 0.4], 0.075), strut("由车身尾部向后展开的粗外套尾梁", [side * 0.65, 1.2, 1.6], [side * 0.88, 1.5, 3.7], 0.17), strut("从粗外套尾梁伸出的细内承力尾梁", [side * 0.88, 1.5, 3.7], [side * 1.05, 1.7, 5.5], 0.12), surface("在展开尾梁外端支承的独立方向尾鳍", transportColors.signal, [[0, 0, -0.45], [0, 1.35, 0.15], [0, 0, 0.65]], [0, 1, 2], [side * 1.05, 1.7, 5.15]), ball("公路前鼻两侧接入车身的前照明灯", [side * 0.43, 1.1, -2.78], [0.24, 0.16, 0.18], transportColors.trim));
      for (const z of [-0.4, 0.8]) parts.push(box("夹持翼根铰轴两端的固定锁止耳板", [side * 0.95, 1.15, z], [0.3, 0.1, 0.18], transportColors.body));
      for (const z of [-1.8, 1.5]) parts.push(...wheel([side * 0.95, 0.32, z], 0.32, 0.18), strut("车身侧梁至公路车轮的独立短悬架", [side * 0.7, 0.8, z], [side * 0.95, 0.32, z], 0.09));
    }
    return parts;
  } },
  { name: "包覆太阳筒与去旋台双自旋通信航天器", theme: "科幻", tags: ["双自旋平台", "包覆式太阳电池筒", "上部去旋设备台", "完整筒体通信航天器"], create: () => {
    const parts: ModelPart[] = [cylinder("承载包覆电池表皮的旋转密封圆筒舱", [0, 2.75, 0], [3.3, 4.9, 3.3], transportColors.body), ring("旋转圆筒下端的连续电池承力边框", transportColors.trim, 1.78, 0.17, 0.4, 0.2), ring("旋转圆筒上端的连续电池承力边框", transportColors.trim, 1.78, 0.17, 5.1, 0.2), cylinder("连接旋转筒与去旋平台的中央轴承座", [0, 5.3, 0], [1.0, 0.3, 1.0], transportColors.dark), cylinder("通过轴承从旋转筒内伸出的去旋承力短轴", [0, 5.75, 0], [0.5, 1.1, 0.5], transportColors.body), cylinder("在太阳电池旋转筒上方独立定向的设备平台", [0, 6.3, 0], [2.8, 0.5, 2.8], transportColors.trim), part("圆筒底部真正内凹的轨道机动钟形喷口", "lathe", transportColors.dark, [0, 0, 0], [1, 1, 1], [0, 0, 0], { profile: [{ x: 0.37, y: 0 }, { x: 0.44, y: 0 }, { x: 0.17, y: 0.5 }, { x: 0.11, y: 0.5 }, { x: 0.37, y: 0 }] })];
    for (let index = 0; index < 16; index++) {
      const angle = index * Math.PI / 8;
      parts.push(box("围绕整圈旋转舱而不依赖展开翼的太阳电池长面", [Math.cos(angle) * 1.67, 2.75, Math.sin(angle) * 1.67], [0.65, 4.7, 0.04], "#496e82", [0, 90 - angle * 180 / Math.PI, 0]));
    }
    for (const side of [-1, 1]) {
      parts.push(dish([side * 1.1, 7.4, 0], 1.0), strut("去旋设备台至独立定向反射面的短支承", [side * 0.7, 6.5, 0], [side * 1.1, 7.4, 0], 0.1), part("位于反射面焦区并面向反射面的空心馈源喇叭", "lathe", transportColors.body, [side * 1.1, 8.02, -0.434], [1, 1, 1], [145, 0, 0], { profile: [{ x: 0.03, y: 0 }, { x: 0.06, y: 0 }, { x: 0.15, y: 0.2 }, { x: 0.11, y: 0.2 }, { x: 0.03, y: 0 }] }));
      for (const edge of [-1, 1]) parts.push(strut("从反射面侧缘指向焦区馈源座的细承力臂", [side * 1.1 + edge * 0.7, 7.4 + 0.25 * Math.cos(35 * Math.PI / 180), -0.25 * Math.sin(35 * Math.PI / 180)], [side * 1.1, 8.02, -0.434], 0.025));
    }
    return parts;
  } },
  { name: "剪式环桁张网抛物面航天反射器总成", theme: "科幻", itemType: "构件", tags: ["独立大型航天部件", "剪式可展环桁", "前后张索网", "真正开孔反射网面"], create: () => {
    const parts: ModelPart[] = [ring("反射网缘在上部承力节点之间连续张紧的细边圈", transportColors.body, 6.0, 0.06, 3.8, 0.08), ring("后支承网缘连续连接下部承力节点的细边圈", transportColors.body, 6.0, 0.06, 2.5, 0.08), box("反射器与航天器展开臂相连的外周安装基座", [6.6, 3.2, 0], [1.4, 1.5, 0.5], transportColors.body), strut("由环桁外周接出的馈源悬臂外段", [6, 3.8, 0], [5, 6.8, 0], 0.1), strut("悬臂伸至抛物面焦区的馈源水平支段", [5, 6.8, 0], [0, 7.3, 0], 0.1), part("在抛物面焦区面向反射网的空心馈源喇叭", "lathe", transportColors.body, [0, 7.3, 0], [1, 1, 1], [180, 0, 0], { profile: [{ x: 0.025, y: 0 }, { x: 0.05, y: 0 }, { x: 0.12, y: 0.3 }, { x: 0.085, y: 0.3 }, { x: 0.025, y: 0 }] })];
    for (let index = 0; index < 12; index++) {
      const a = index * Math.PI / 6, b = (index + 1) * Math.PI / 6, x = Math.cos(a) * 6, z = Math.sin(a) * 6, nextX = Math.cos(b) * 6, nextZ = Math.sin(b) * 6;
      parts.push(strut("可展环桁上边的连续周向承力杆", [x, 3.8, z], [nextX, 3.8, nextZ], 0.065), strut("可展环桁下边的连续周向承力杆", [x, 2.5, z], [nextX, 2.5, nextZ], 0.065), strut("可展环桁每个周向节间的第一根剪式斜杆", [x, 2.5, z], [nextX, 3.8, nextZ], 0.055), strut("可展环桁每个周向节间交叉连接的第二根斜杆", [x, 3.8, z], [nextX, 2.5, nextZ], 0.055));
    }
    // ACT: 以米级开孔网格表现张网结构，不模拟微米金属编织；每4条曲索合批，单mesh≤424顶点。
    for (const base of [2.0, 0.7]) {
      const curves: ModelPart[] = [];
      for (let fixed = -5; fixed <= 5; fixed++) for (const axis of [0, 1]) {
        const limit = Math.sqrt(36 - fixed * fixed), values = [-limit, ...Array.from({ length: 11 }, (_, index) => index - 5).filter(value => value > -limit + 0.0001 && value < limit - 0.0001), limit];
        const path: Triple[] = values.map(value => axis === 0 ? [value, base + (value * value + fixed * fixed) / 20, fixed] : [fixed, base + (value * value + fixed * fixed) / 20, value]);
        curves.push(tapered("沿真实抛物曲面张紧的细网索", "#a99873", path, path.map(() => 0.018)));
      }
      for (let index = 0; index < curves.length; index += 4) parts.push(combineMeshes("在抛物曲面上交叉并保留实际透空网孔的张索网片", "#a99873", curves.slice(index, index + 4)));
    }
    for (const [x, z] of [[3, 0], [3, 2], [2, 3], [0, 3], [-2, 3], [-3, 2], [-3, 0], [-3, -2], [-2, -3], [0, -3], [2, -3], [3, -2]]) {
      const rise = (x! * x! + z! * z!) / 20;
      parts.push(strut("在网格真实交点之间连接前后两张索网的定形拉索", [x!, 0.7 + rise, z!], [x!, 2.0 + rise, z!], 0.02, transportColors.trim));
    }
    return parts;
  } },
];
