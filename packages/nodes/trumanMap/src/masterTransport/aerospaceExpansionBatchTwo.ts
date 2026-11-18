import { Euler, Quaternion, Vector3 } from "three";
import { part, ring, type ModelPart, type Triple } from "../assetModelParts";
import { fuselage, propeller, tail } from "./aircraftModels";
import { airfoil, smallGear } from "./aerospaceExpansionBatchOne";
import { ball, box, cylinder, strut, surface, transportColors, type TransportDefinition } from "./parts";

function toroidalTube(name: string, radius: number, width: number, y: number, color: string): ModelPart {
  return part(name, "lathe", color, [0, y, 0], [1, 1, 1], [0, 0, 0], { profile: Array.from({ length: 13 }, (_, index) => ({ x: radius + Math.cos(index * Math.PI / 6) * width, y: Math.sin(index * Math.PI / 6) * width })) });
}

function hybridEnvelope(): ModelPart {
  const sections = [[-40, 0.06], [-31, 0.63], [-15, 0.96], [12, 1], [30, 0.7], [40, 0.07]];
  const vertices = sections.flatMap(([z, scale]) => Array.from({ length: 32 }, (_, index) => {
    const angle = index * Math.PI / 16, radius = 1 + 0.12 * Math.cos(angle * 3);
    return { x: Math.sin(angle) * radius * 17 * scale!, y: 22 + Math.cos(angle) * radius * 10 * scale!, z: z! };
  }));
  const indices: number[] = [];
  for (let section = 0; section < sections.length - 1; section++) for (let index = 0; index < 32; index++) {
    const a = section * 32 + index, b = section * 32 + (index + 1) % 32;
    indices.push(a, b + 32, b, a, a + 32, b + 32);
  }
  vertices.push({ x: 0, y: 22, z: -40 }, { x: 0, y: 22, z: 40 });
  for (let index = 0; index < 32; index++) indices.push(192, index, (index + 1) % 32, 193, 160 + (index + 1) % 32, 160 + index);
  return part("沿纵向收分的三叶连续浮力包络", "mesh", transportColors.trim, [0, 0, 0], [1, 1, 1], [0, 0, 0], { vertices, indices });
}

// 完整大主体的原创场景构造；没有飞机品牌、挂载或同体状态扩项。
// https://www.nationalmuseum.af.mil/Visit/Museum-Exhibits/Fact-Sheets/Display/Article/195770/chance-voughtltv-xc-142a/
// https://www.nasa.gov/aeronautics/nasa-aircraft/x-wing/
// https://airandspace.si.edu/collection-objects/hiller-xhoe-1-hornet/nasm_A19610115000
// https://www.hybridairvehicles.com/airlander/technology/
// https://ntrs.nasa.gov/citations/20230017347
// https://airandspace.si.edu/collection-objects/model-spacecraft-orion-nuclear-pulse/nasm_A19790892000
export const aerospaceExpansionBatchTwo: TransportDefinition[] = [
  { name: "整片机翼倾转式垂直起降运输机", theme: "现代", tags: ["整翼倾转", "翼梁与发动机共同转动", "尾部俯仰小旋翼"], create: () => {
    const parts: ModelPart[] = [fuselage(13.8, 2.8, 2.65), ...tail(5.3, 5.0, 6.4), surface("尾身至高平尾的承力垂直安定面", transportColors.body, [[0, 0, -1.1], [0, 2.8, 0.65], [0, 0, 1.55]], [0, 1, 2], [0, 2.65, 4.85]), ball("前端宽视野飞行座舱罩", [0, 3.15, -4.8], [2.05, 1.1, 1.9], transportColors.glass), cylinder("整片机翼的横向回转主轴", [0, 4.4, -0.2], [0.42, 3.2, 0.42], transportColors.dark, [0, 0, 90]), ...smallGear([[-1.35, 2.6, 0.6], [1.35, 2.6, 0.6]], [0, 2.5, -4.3], 0.4)];
    const assembly: ModelPart[] = [airfoil("整体随枢轴倾转的连续主翼", 19.2, 2.65, [0, 0, 0])];
    for (const side of [-1, 1]) for (const distance of [2.75, 6.75]) assembly.push(cylinder("固定在可转主翼上的动力短舱", [side * distance, 0.1, -0.25], [0.78, 2.5, 0.78], transportColors.body, [90, 0, 0]), ...propeller(side * distance, 0.1, -1.65, 1.75));
    const rotation = new Quaternion().setFromEuler(new Euler(65 * Math.PI / 180, 0, 0));
    for (const value of assembly) {
      const p = new Vector3(value.position.x, value.position.y, value.position.z).applyQuaternion(rotation).add(new Vector3(0, 4.4, -0.2));
      const q = new Quaternion().setFromEuler(new Euler(value.rotation.x * Math.PI / 180, value.rotation.y * Math.PI / 180, value.rotation.z * Math.PI / 180));
      const euler = new Euler().setFromQuaternion(rotation.clone().multiply(q));
      value.position = { x: p.x, y: p.y, z: p.z };
      value.rotation = { x: euler.x * 180 / Math.PI, y: euler.y * 180 / Math.PI, z: euler.z * 180 / Math.PI };
      parts.push(value);
    }
    parts.push(cylinder("尾端俯仰控制旋翼电机", [0, 2.97, 6.2], [0.3, 0.3, 0.3], transportColors.dark), box("尾端水平俯仰控制旋翼", [0, 3.14, 6.2], [2.1, 0.04, 0.18], transportColors.dark));
    return parts;
  } },
  { name: "可停转十字承力旋翼X翼研究机", theme: "现代", tags: ["停转旋翼", "X翼", "旋翼与固定翼转换"], create: () => {
    const parts: ModelPart[] = [fuselage(10.5, 1.65, 2.15), ball("前置双座透明机舱", [0, 2.65, -2.85], [1.35, 1.0, 1.9], transportColors.glass), cylinder("带停止锁位机构的主旋翼桅", [0, 3.35, -0.1], [0.32, 1.8, 0.32], transportColors.body), cylinder("宽桨叶中央承力盘", [0, 4.25, -0.1], [1.05, 0.2, 1.05], transportColors.dark), airfoil("斜向跨接的第一对刚性承力桨叶", 13.6, 1.1, [0, 4.3, -0.1], [0, 135, 0]), airfoil("与第一对正交的另一对刚性桨叶", 13.6, 1.1, [0, 4.3, -0.1], [0, 45, 0]), airfoil("悬在主旋翼下方的短固定机翼", 6.4, 1.3, [0, 2.45, -0.45]), ...tail(4.1, 2.6, 3.7), ...smallGear([[-1.05, 2.15, 1.2], [1.05, 2.15, 1.2]], [0, 1.95, -2.7], 0.32)];
    for (const side of [-1, 1]) parts.push(part("巡航推进用贯通涡喷机匣", "lathe", transportColors.dark, [side * 1.1, 2.5, 0.85], [1, 1, 1], [90, 0, 0], { profile: [{ x: 0.34, y: -1.2 }, { x: 0.4, y: -0.4 }, { x: 0.31, y: 1.1 }, { x: 0.25, y: 1.1 }, { x: 0.33, y: -0.4 }, { x: 0.28, y: -1.2 }, { x: 0.34, y: -1.2 }] }), strut("机体至涡喷短舱的侧向连接架", [side * 0.65, 2.5, 0.85], [side * 1.1, 2.5, 0.85], 0.14));
    return parts;
  } },
  { name: "桨尖冲压喷气驱动开放骨架直升机", theme: "现代", tags: ["桨尖喷气", "无尾桨", "开放座舱骨架"], create: () => {
    const parts: ModelPart[] = [box("开放飞行平台底架", [0, 0.68, 0.1], [1.1, 0.14, 1.65], transportColors.dark), cylinder("不向机身传递驱动扭矩的主旋翼桅", [0, 1.81, 0.45], [0.16, 2.2, 0.16], transportColors.body), cylinder("自由回转的双叶主旋翼桨毂", [0, 2.95, 0.45], [0.4, 0.16, 0.4], transportColors.dark), airfoil("通向两端冲压喷管的连续双叶旋翼", 8.4, 0.3, [0, 3.02, 0.45]), cylinder("座椅后方的圆筒燃料容器", [0, 1.2, 0.95], [0.65, 0.75, 0.65], transportColors.body), strut("不带尾桨的轻质方向稳定尾梁", [0, 0.87, 0.7], [0, 1.1, 4.0], 0.1), surface("尾梁末端纯空气动力稳定鳍", transportColors.signal, [[0, 0, -0.5], [0, 0.9, 0.2], [0, -0.1, 0.7]], [0, 1, 2], [0, 1.1, 3.8])];
    for (const side of [-1, 1]) {
      parts.push(box("并列飞行员座垫", [side * 0.3, 0.83, -0.15], [0.45, 0.13, 0.48], transportColors.dark), box("开放座舱短靠背", [side * 0.3, 1.09, 0.06], [0.43, 0.48, 0.1], transportColors.body), strut("向前伸出的脚踏框", [side * 0.4, 0.68, -0.4], [side * 0.4, 0.38, -1.0], 0.045), box("踏脚小横杆", [side * 0.4, 0.38, -1.0], [0.32, 0.045, 0.08], transportColors.dark), box("连续着陆滑橇", [side * 0.86, 0.055, 0.05], [0.1, 0.11, 2.8], transportColors.dark), strut("主桅根部侧向斜撑", [side * 0.48, 0.75, 0.6], [0, 2.2, 0.45], 0.045));
      for (const z of [-0.6, 0.7]) parts.push(strut("飞行平台至着陆滑橇的支腿", [side * 0.46, 0.7, z], [side * 0.86, 0.1, z], 0.06));
      parts.push(part("桨尖切向贯通冲压喷气短管", "lathe", transportColors.dark, [side * 4.12, 3.02, 0.45], [1, 1, 1], [side * 90, 0, 0], { profile: [{ x: 0.14, y: -0.43 }, { x: 0.16, y: -0.18 }, { x: 0.16, y: 0.13 }, { x: 0.1, y: 0.4 }, { x: 0.072, y: 0.4 }, { x: 0.128, y: 0.12 }, { x: 0.128, y: -0.18 }, { x: 0.11, y: -0.43 }, { x: 0.14, y: -0.43 }] }));
    }
    return parts;
  } },
  { name: "三叶浮力体矢量推进混合货运飞艇", theme: "科幻", tags: ["混合浮力飞艇", "连续多叶包络", "矢量升力风扇", "大型载货舱"], create: () => {
    const parts: ModelPart[] = [hybridEnvelope(), box("浮力包络下方的货舱承力地板", [0, 4.2, 0], [10.5, 0.45, 26]), box("货舱独立承力顶板", [0, 8.4, 0], [10.5, 0.3, 26]), box("后舱封闭端壁", [0, 6.25, 12.8], [10.5, 4.1, 0.25], transportColors.body), ...[-1, 1].map(side => ball("可接触粗糙地面的着陆气垫", [side * 7.2, 1.0, 0], [8, 2, 18], transportColors.dark)), airfoil("后部横向方向稳定翼", 24, 6, [0, 22, 30]), surface("背部大型方向稳定鳍", transportColors.signal, [[0, 0, -5], [0, 11, 3], [0, 0, 7]], [0, 1, 2], [0, 24, 30])];
    for (const side of [-1, 1]) {
      for (const z of [-10, 0, 10]) parts.push(strut("浮力体纵向脊至货舱顶的吊挂支承", [side * 4.4, 13.1, z], [side * 4.4, 8.4, z], 0.28), box("货舱侧窗间承力柱", [side * 5.1, 6.3, z], [0.28, 4.1, 0.3], transportColors.body));
      for (const z of [-7.5, -2.5, 2.5, 7.5]) parts.push(part("货舱侧面透明装卸观察窗", "box", transportColors.glass, [side * 5.1, 6.3, z], [0.12, 3.7, 4.7], [0, 0, 0], { opacity: 0.48 }));
      parts.push(strut("货舱与侧向着陆气垫的前支承", [side * 4.7, 4.1, -6.5], [side * 7.2, 1.7, -6.5], 0.35), strut("货舱与侧向着陆气垫的后支承", [side * 4.7, 4.1, 6.5], [side * 7.2, 1.7, 6.5], 0.35));
      for (const z of [-18, 18]) {
        parts.push(strut("包络内部硬点至矢量风扇的侧桁梁", [side * 12.5, 17.5, z], [side * 18.5, 13, z], 0.55), ring("可矢量偏转的贯通风扇护环", transportColors.dark, 2.05, 0.23, 0, 0.8, { position: { x: side * 18.5, y: 13, z }, rotation: { x: 65, y: 0, z: 0 } }), cylinder("风扇轴心承座", [side * 18.5, 13, z], [0.5, 0.75, 0.5], transportColors.body, [65, 0, 0]));
        for (const angle of [0, 60, 120]) parts.push(box("矢量风扇连续双端桨叶", [side * 18.5, 13, z], [3.55, 0.19, 0.1], transportColors.body, [-25, 0, angle]));
      }
    }
    parts.push(box("前端驾驶舱框", [0, 6.15, -12.9], [4.2, 3.1, 0.3], transportColors.body), part("驾驶舱前窗", "box", transportColors.glass, [0, 6.7, -13.1], [3.7, 1.7, 0.12], [0, 0, 0], { opacity: 0.5 }));
    return parts;
  } },
  { name: "环列充气热盾大钝体再入飞行器", theme: "科幻", tags: ["充气式再入减速器", "六米级展开热盾", "环列后部充气骨架"], create: () => {
    const parts: ModelPart[] = [part("面向来流的连续锥弧隔热蒙皮", "lathe", transportColors.dark, [0, 0, 0], [1, 1, 1], [0, 0, 0], { profile: [{ x: 0, y: 0 }, { x: 0.5, y: 0.035 }, { x: 1.25, y: 0.2 }, { x: 3, y: 0.88 }, { x: 3, y: 0.94 }, { x: 1.25, y: 0.26 }, { x: 0.5, y: 0.095 }, { x: 0, y: 0.06 }] }), cylinder("包含航电与气源的中央再入器", [0, 1.55, 0], [0.95, 1.95, 0.95], transportColors.body), cylinder("顶部回收降落伞舱", [0, 2.59, 0], [1.05, 0.2, 1.05], transportColors.trim)];
    for (const radius of [0.73, 1.12, 1.51, 1.9, 2.29, 2.68]) parts.push(toroidalTube("支承隔热蒙皮的独立密封充气环", radius, 0.18, 0.21 + radius * 0.32, transportColors.trim));
    for (let index = 0; index < 6; index++) {
      const angle = index * Math.PI / 3, x = Math.cos(angle), z = Math.sin(angle);
      parts.push(strut("中央再入器至外环的径向承力索", [x * 0.45, 0.78, z * 0.45], [x * 2.66, 1.18, z * 2.66], 0.025, transportColors.body), strut("环列骨架的向心约束索", [x * 2.66, 1.18, z * 2.66], [x * 0.46, 1.8, z * 0.46], 0.018, transportColors.body));
    }
    return parts;
  } },
  { name: "大型推送盘缓冲桁架深空运输船", theme: "科幻", tags: ["外脉冲推进构想", "后部推送盘", "长桁架与独立缓冲支柱"], create: () => {
    const parts: ModelPart[] = [part("整舰后方的大直径实体推送盘", "lathe", transportColors.dark, [0, 0, 0], [1, 1, 1], [0, 0, 0], { profile: [{ x: 0, y: 0 }, { x: 4.7, y: 0.15 }, { x: 5.0, y: 0.4 }, { x: 4.85, y: 0.65 }, { x: 0, y: 0.7 }] }), cylinder("缓冲支柱上方的共同载荷平台", [0, 6.2, 0], [7.6, 0.5, 7.6], transportColors.body), cylinder("下段封闭货运与物资舱", [0, 10.1, 0], [5.2, 7.3, 5.2], transportColors.trim), part("与下段分离并由桁架承托的前端居住舱", "lathe", transportColors.body, [0, 22.3, 0], [1, 1, 1], [0, 0, 0], { profile: [{ x: 0, y: -3 }, { x: 1.9, y: -2.8 }, { x: 2.6, y: -1.65 }, { x: 2.6, y: 1.0 }, { x: 1.6, y: 2.4 }, { x: 0, y: 2.9 }] }), cylinder("前段居住舱中央对接颈", [0, 25.65, 0], [1.25, 0.9, 1.25], transportColors.dark), ring("顶部对接捕获环", transportColors.trim, 0.82, 0.16, 26.16, 0.16)];
    for (let index = 0; index < 6; index++) {
      const a = index * Math.PI / 3, x = Math.cos(a) * 3.2, z = Math.sin(a) * 3.2;
      parts.push(cylinder("推送盘上方的独立长行程缓冲缸", [x, 2, z], [0.56, 2.7, 0.56], transportColors.body), cylinder("连接载荷平台的外露缓冲柱塞", [x, 4.5, z], [0.24, 3.0, 0.24], transportColors.trim), ring("缓冲缸顶部密封导向口", transportColors.dark, 0.32, 0.16, 3.35, 0.12, { position: { x, y: 3.35, z } }));
    }
    for (let index = 0; index < 4; index++) {
      const a = index * Math.PI / 2, b = (index + 1) * Math.PI / 2;
      const low: Triple = [Math.cos(a) * 3.35, 6.4, Math.sin(a) * 3.35], high: Triple = [Math.cos(a) * 3.35, 20.2, Math.sin(a) * 3.35];
      parts.push(strut("跨越隔离距离的长桁架纵梁", low, high, 0.21), strut("下层桁架空间斜撑", low, [Math.cos(b) * 3.35, 13.3, Math.sin(b) * 3.35], 0.15), strut("上层桁架空间斜撑", [Math.cos(a) * 3.35, 13.3, Math.sin(a) * 3.35], [Math.cos(b) * 3.35, 20.2, Math.sin(b) * 3.35], 0.15), strut("桁架顶部连接居住舱底承力环", high, [Math.cos(a) * 1.8, 19.65, Math.sin(a) * 1.8], 0.22));
    }
    for (const side of [-1, 1]) parts.push(box("上段外伸热控辐射板", [side * 4.4, 17.7, 0], [0.12, 6.8, 4.3], transportColors.dark), strut("辐射板至主桁架的固定横梁", [side * 3.35, 17.7, 0], [side * 4.4, 17.7, 0], 0.16));
    return parts;
  } },
];
