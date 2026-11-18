import { part, ring, type ModelPart } from "../assetModelParts";
import { ball, box, cylinder, strut, surface, transportColors, type TransportDefinition } from "./parts";
import { dish, panels } from "./spaceModels";

function spacecraft(name: string, create: TransportDefinition["create"], tags: string[]): TransportDefinition { return { name, create, tags: ["航天", ...tags], theme: "科幻" }; }

export const advancedSpaceModels: TransportDefinition[] = [
  spacecraft("高压行星球舱着陆器", () => {
    const parts: ModelPart[] = [ball("厚壁耐压球舱", [0, 1.25, 0], [1.6, 1.6, 1.6], transportColors.trim), part("环形吸能着陆底座", "lathe", transportColors.body, [0, 0.18, 0], [1, 1, 1], [0, 0, 0], { profile: [{ x: 1.1, y: 0 }, { x: 1.45, y: 0.15 }, { x: 1.5, y: 0.35 }, { x: 1.12, y: 0.35 }, { x: 1.1, y: 0 }] }), cylinder("上方热控颈", [0, 2.25, 0], [0.4, 0.7, 0.4], transportColors.dark), cylinder("高位气动稳定盘", [0, 2.6, 0], [2.6, 0.12, 2.6], transportColors.trim), strut("顶端通信长天线", [0, 2.6, 0], [0, 3.7, 0], 0.04)];
    for (let index = 0; index < 4; index++) { const angle = index * Math.PI / 2; parts.push(strut("球舱承压支架", [Math.cos(angle) * 0.55, 1.6, Math.sin(angle) * 0.55], [Math.cos(angle) * 1.25, 0.4, Math.sin(angle) * 1.25], 0.08), box("耐压科学窗口", [Math.cos(angle) * 0.78, 1.25, Math.sin(angle) * 0.78], [0.2, 0.17, 0.08], transportColors.dark, [0, 90 - index * 90, 0])); } return parts;
  }, ["高压探测"]),
  spacecraft("小行星触地采样探测器", () => [box("采样探测器平台", [0, 1.6, 0], [1.5, 1.1, 1.3], transportColors.trim), ...panels(5.5, 1.5, 0), dish([0, 2.3, 0.2], 0.8), strut("伸展取样主臂", [0.6, 1.4, -0.4], [1.3, 0.7, -1.5], 0.12), strut("伸展取样前臂", [1.3, 0.7, -1.5], [1.8, 0.2, -2.3], 0.09), cylinder("接触式采样头", [1.8, 0.16, -2.3], [0.6, 0.22, 0.6], transportColors.dark), box("返程样本密封舱", [-0.5, 2.2, -0.4], [0.6, 0.4, 0.6], transportColors.body), ...[-1, 1].map(side => cylinder("小推力姿控喷口", [side * 0.8, 1.3, 0.4], [0.16, 0.35, 0.16], transportColors.dark))], ["接触采样"]),
  spacecraft("彗星三脚锚定着陆器", () => {
    const parts: ModelPart[] = [box("方形科学舱", [0, 0.95, 0], [1.1, 0.9, 0.95], transportColors.trim), box("科学舱太阳能顶板", [0, 1.43, 0], [1.15, 0.035, 1], "#4b7185"), strut("下方取样钻杆", [0.25, 0.8, 0], [0.25, 0.1, 0], 0.065), cylinder("顶端通信盘", [0, 1.65, 0.1], [0.35, 0.1, 0.35])];
    for (let index = 0; index < 3; index++) { const angle = index * Math.PI * 2 / 3; parts.push(strut("着陆器外伸刚性腿", [Math.cos(angle) * 0.35, 0.7, Math.sin(angle) * 0.35], [Math.cos(angle) * 1.6, 0.2, Math.sin(angle) * 1.6], 0.08), box("脚端锚固横架", [Math.cos(angle) * 1.6, 0.15, Math.sin(angle) * 1.6], [0.5, 0.1, 0.16], transportColors.dark, [0, -index * 120, 0]), part("脚端冰面锚钉", "cone", transportColors.dark, [Math.cos(angle) * 1.6, 0.08, Math.sin(angle) * 1.6], [0.1, 0.18, 0.1], [180, 0, 0])); } return parts;
  }, ["表面锚固"]),
  spacecraft("轨道捕获拖船", () => {
    const parts: ModelPart[] = [cylinder("轨道拖船主舱", [0, 1, 0], [1.4, 2.6, 1.4], transportColors.body, [90, 0, 0]), ...panels(4, 1, 0.2), cylinder("尾部推进喷管", [0, 1, 1.6], [0.8, 0.7, 0.8], transportColors.dark, [90, 0, 0]), box("前部视觉对接摄像头", [0, 1.1, -1.4], [0.4, 0.3, 0.2], transportColors.glass)];
    for (const side of [-1, 1]) parts.push(ball("外置推进剂储罐", [side * 0.7, 1, 0.5], [0.65, 0.65, 0.65], transportColors.trim), strut("捕获主机械臂", [side * 0.55, 1, -0.8], [side * 1.1, 1, -1.8], 0.12), strut("捕获内收前臂", [side * 1.1, 1, -1.8], [side * 0.6, 1, -2.8], 0.1), box("捕获末端软垫", [side * 0.5, 1, -2.8], [0.3, 0.5, 0.15], transportColors.dark)); return parts;
  }, ["在轨服务"]),
  spacecraft("充气式太空居住舱", () => {
    const parts: ModelPart[] = [part("可展开柔性压力舱", "capsule", transportColors.trim, [0, 1.3, 0], [4.8, 4.2, 4.8], [90, 0, 0]), ...[-1, 1].flatMap(end => [cylinder("刚性对接口", [0, 1.3, end * 2.1], [1.1, 0.6, 1.1], transportColors.body, [90, 0, 0]), cylinder("对接环中心舱门", [0, 1.3, end * 2.42], [0.75, 0.05, 0.75], transportColors.dark, [90, 0, 0])])];
    for (const z of [-1.5, -0.75, 0, 0.75, 1.5]) {
      const radius = Math.abs(z) <= 1.05 ? 1.2 : 1.2 * Math.sqrt(1 - ((Math.abs(z) - 1.05) / 1.05) ** 2);
      const band = ring("压力舱环向约束带", transportColors.body, radius + 0.025, 0.04, 0, 0.06);
      band.position = { x: 0, y: 1.3, z }; band.rotation.x = 90; parts.push(band);
    }
    for (const side of [-1, 1]) parts.push(box("纵向设备硬接口", [side * 1.13, 1.3, 0], [0.15, 0.4, 1.6], transportColors.dark)); return parts;
  }, ["轨道居住"]),
  spacecraft("近太阳隔热探测器", () => {
    const points: [number, number, number][] = Array.from({ length: 8 }, (_, index) => [Math.cos(index * Math.PI / 4) * 1.6, Math.sin(index * Math.PI / 4) * 1.6, 0]);
    const faces = Array.from({ length: 6 }, (_, index) => [0, index + 1, index + 2]).flat();
    return [surface("前方耐热八角屏", transportColors.dark, points, faces, [0, 2, -1.1]), box("屏后科学舱", [0, 2, 0], [1, 1.3, 1.1], transportColors.trim), strut("隔热屏连接桁杆", [0, 2, -0.55], [0, 2, -1.1], 0.18), ...[-1, 1].map(side => box("小型倾斜太阳翼", [side * 0.9, 2.2, 0.1], [0.9, 0.045, 0.7], "#4b7185", [0, 0, side * 35])), strut("尾部磁场探测长杆", [0, 2.2, 0.6], [0, 2.8, 3.7], 0.04), ball("磁场探测头", [0, 2.8, 3.7], [0.18, 0.18, 0.18]), ...[-1, 1].map(side => strut("长电场天线", [side * 0.3, 1.8, 0.2], [side * 2.6, 0.8, 1.5], 0.015))];
  }, ["高温探测"]),
  spacecraft("三轴长波射电观测卫星", () => {
    const parts: ModelPart[] = [box("射电观测中央舱", [0, 2.1, 0], [0.8, 0.8, 0.8], transportColors.trim), ...panels(2.8, 2.1, 0), cylinder("尾部小推力发动机", [0, 1.5, 0], [0.4, 0.5, 0.4], transportColors.dark)];
    for (const [x, y, z] of [[1, 0, 0], [0, 1, 0], [0, 0, 1]] as const) parts.push(strut("双极长波接收天线", [-x * 4, 2.1 - y * 2, -z * 4], [x * 4, 2.1 + y * 2, z * 4], 0.018, transportColors.dark)); return parts;
  }, ["射电天文"]),
  spacecraft("抓附步行小行星巡视器", () => {
    const parts: ModelPart[] = [box("步行巡视器中央平台", [0, 0.8, 0], [1.3, 0.35, 1]), cylinder("上方环境相机", [0, 1.2, 0], [0.35, 0.5, 0.35], transportColors.dark), box("上置电池太阳板", [0, 1, 0], [1.4, 0.03, 1.1], "#4b7185")];
    for (let index = 0; index < 6; index++) { const angle = index * Math.PI / 3, x = Math.cos(angle), z = Math.sin(angle); parts.push(strut("抓附腿上段", [x * 0.5, 0.8, z * 0.4], [x * 1.2, 1.05, z * 1.2], 0.09), ball("步行关节", [x * 1.2, 1.05, z * 1.2], [0.17, 0.17, 0.17], transportColors.dark), strut("抓附腿下段", [x * 1.2, 1.05, z * 1.2], [x * 1.65, 0.15, z * 1.65], 0.07), ...[-1, 1].map(side => strut("足端双向锚爪", [x * 1.65, 0.15, z * 1.65], [x * 1.65 + z * side * 0.15, 0.05, z * 1.65 - x * side * 0.15], 0.035, transportColors.dark))); } return parts;
  }, ["微重力步行"]),
  spacecraft("轨道碎片捕网装置", () => {
    const parts: ModelPart[] = [box("捕网载体舱", [0, 0.6, 0.8], [0.8, 0.7, 1], transportColors.trim), ...panels(2.5, 0.6, 0.8), box("中央捕网发射口", [0, 0.7, 0.2], [0.5, 0.5, 0.08], transportColors.dark)];
    for (const side of [-1, 1]) parts.push(strut("网兜侧边绳", [side * 1.8, 0.2, -1], [side * 1.8, 3.8, -1], 0.025), strut("网兜横边绳", [-1.8, 2 + side * 1.8, -1], [1.8, 2 + side * 1.8, -1], 0.025), ...[-1, 1].map(end => ball("网角投射配重", [side * 1.8, 2 + end * 1.8, -1], [0.16, 0.16, 0.16], transportColors.dark)));
    for (const offset of [-1.2, -0.6, 0, 0.6, 1.2]) parts.push(strut("捕获纵网绳", [offset, 0.2, -1], [offset, 3.8, -1], 0.012), strut("捕获横网绳", [-1.8, 2 + offset, -1], [1.8, 2 + offset, -1], 0.012)); return parts;
  }, ["空间碎片回收"]),
];
