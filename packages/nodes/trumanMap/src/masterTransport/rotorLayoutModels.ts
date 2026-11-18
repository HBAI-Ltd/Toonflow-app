import { part, type ModelPart } from "../assetModelParts";
import { ball, box, cylinder, strut, transportColors, wheel, type TransportDefinition } from "./parts";
import { fuselage, tail } from "./aircraftModels";

export const rotorLayoutModels: TransportDefinition[] = [
  { name: "共轴反桨行星侦察机", theme: "科幻", tags: ["航空", "共轴直升机", "上下反转旋翼", "双层桨毂", "四点着陆足"], create: () => {
    const parts = [box("下部隔热电池与电子舱", [0, 0.25, 0], [0.2, 0.17, 0.19], transportColors.trim), cylinder("中央外套反转轴", [0, 0.53, 0], [0.045, 0.42, 0.045], transportColors.dark), cylinder("同轴内层上桨轴", [0, 0.78, 0], [0.018, 0.36, 0.018], transportColors.trim), box("高置太阳能电池板", [0, 0.99, 0], [0.44, 0.014, 0.14], transportColors.glass), box("机腹下视相机", [0, 0.15, -0.06], [0.045, 0.04, 0.045], transportColors.dark), cylinder("下视相机小镜片", [0, 0.125, -0.06], [0.026, 0.012, 0.026], transportColors.glass)];
    for (const level of [0, 1]) {
      const y = 0.67 + level * 0.16;
      parts.push(cylinder("分层独立旋翼桨毂", [0, y, 0], [0.07, 0.045, 0.07], transportColors.body), box("反向配对连续轻质旋翼", [0, y, 0], [1.2, 0.009, 0.055], transportColors.dark, [0, level * 75, 0]));
    }
    for (const x of [-1, 1]) for (const z of [-1, 1]) parts.push(strut("外张轻质着陆腿", [x * 0.085, 0.32, z * 0.07], [x * 0.25, 0.012, z * 0.23], 0.012), ball("着陆腿末端小支垫", [x * 0.25, 0.009, z * 0.23], [0.033, 0.018, 0.033], transportColors.dark));
    return parts;
  } },
  { name: "交叉双旋翼起重直升机", theme: "现代", tags: ["航空", "交叉旋翼", "同步交错双桨", "外倾双桨轴", "外部吊载"], create: () => {
    const parts: ModelPart[] = [fuselage(8.4, 1.25, 2.2), ball("单人高可视驾驶前舱", [0, 2.25, -2.8], [1.1, 1.4, 1.7], transportColors.body), part("前舱透明观察罩", "sphere", transportColors.glass, [0, 2.45, -3.3], [0.98, 1, 1], [0, 0, 0], { opacity: 0.48 }), box("双桨传动主减速箱", [0, 3.1, -0.5], [1.3, 0.7, 1.7]), ...tail(3.6, 2.45, 3), cylinder("吊挂载荷中央连接座", [0, 1.55, -0.2], [0.5, 0.2, 0.5], transportColors.dark), strut("外载短吊索", [0, 1.5, -0.2], [0, 0.85, -0.2], 0.04), part("外载开放吊钩", "tube", transportColors.trim, [0, 0.85, -0.2], [1, 1, 1], [0, 0, 0], { radius: 0.035, path: [{ x: 0, y: 0, z: 0 }, { x: 0.1, y: -0.12, z: 0 }, { x: 0.05, y: -0.25, z: 0 }, { x: -0.1, y: -0.22, z: 0 }, { x: -0.12, y: -0.1, z: 0 }] }), ...[-1, 1].map(side => cylinder("后置涡轴发动机短舱", [side * 0.5, 2.9, 0.6], [0.6, 2.2, 0.6], transportColors.dark, [90, 0, 0]))];
    for (const side of [-1, 1]) {
      parts.push(strut("向外倾斜的独立桨轴", [side * 0.48, 3.2, -0.5], [side * 0.8, 4.5, -0.5], 0.13), cylinder("交叉旋翼传动桨毂", [side * 0.8, 4.5, -0.5], [0.45, 0.22, 0.45], transportColors.body, [0, 0, -side * 14]));
      // 两个静态桨组相差90度，保留交叠的扫掠区与外倾轴，避免将桨叶画成互相穿透的十字片。
      parts.push(box("同步错相的双叶交叉旋翼", [side * 0.8, 4.5, -0.5], side < 0 ? [0.25, 0.055, 13] : [13, 0.055, 0.25], transportColors.dark, [0, 0, -side * 14]));
      for (const z of [-0.6, 1.6]) parts.push(strut("机体外张起落架", [side * 0.4, 2, z], [side * 1.15, 0.32, z], 0.1), ...wheel([side * 1.15, 0.32, z], 0.32, 0.14));
    }
    return parts;
  } },
];
