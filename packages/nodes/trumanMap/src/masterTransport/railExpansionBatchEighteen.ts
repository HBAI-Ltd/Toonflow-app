import { Euler, Quaternion, Vector3 } from "three";
import { part, ring, type ModelPart, type Triple } from "../assetModelParts";
import { polygon } from "../masterNature/shared";
import { rod } from "../masterObjects/parts";
import { runningFrame } from "./railExpansionBatchThree";
import { box, cylinder, strut, transportColors, type TransportDefinition } from "./parts";

function barrelArc(name: string, startAngle: number, color: string, center: Triple, glazed = false): ModelPart {
  const profile = Array.from({ length: 13 }, (_, index) => { const angle = startAngle + index * Math.PI / 12; return { x: Math.cos(angle) * 1.8, y: Math.sin(angle) * 1.8 }; });
  profile.push(...Array.from({ length: 13 }, (_, index) => { const angle = startAngle + (12 - index) * Math.PI / 12, radius = glazed ? 1.765 : 1.73; return { x: Math.cos(angle) * radius, y: Math.sin(angle) * radius }; }));
  return part(name, "extrude", color, center, [1, 1, 1], [0, 90, 0], { depth: 3, profile, ...(glazed ? { opacity: .38, roughness: .15 } : {}) });
}

// 旋舱承载类别参考制造商资料。采用原创环托轮支承，静态展示斜车架与水平舱地板；不实现机械控制。
// https://www.doppelmayr.com/en/cwa-cabins/funicular-railways-cabins/
// https://www.doppelmayr.com/wp-content/uploads/2024/03/240301_0339_CWA_Special-Broschuere_FR.pdf
// 舱数量仅是完整车型的构成，不注册不同数量、坡度、涂装或地区版本。
export const railExpansionBatchEighteen: TransportDefinition[] = [
  { name: "环托轮独立旋舱自调平陡坡缆车", theme: "现代", tags: ["独立水平客舱与斜车架解耦", "外周回转轨圈", "完整找平托轮驱动", "陡坡缆索客车", "静态构造展示"], create: () => {
    const parts: ModelPart[] = [...runningFrame(13, [-5.6, -4.2, 4.2, 5.6])];
    const centers = [-3, 3];
    for (const z of centers) {
      for (const side of [-1, 1]) {
        parts.push(box("舱端回转支承位于通行门外侧的长向基梁", [side * 1.83, .92, z], [.18, .2, 4.6], transportColors.dark));
        for (const end of [-1, 1]) parts.push(strut("由车底主纵梁接向回转支承的独立悬臂", [side * 1.15, .92, z + end * 2.2], [side * 1.83, .92, z + end * 2.2], .16, transportColors.dark));
        for (const angle of [Math.PI * 1.25, Math.PI * 1.5, Math.PI * 1.75]) {
          const y = 3 + Math.sin(angle) * 2.02, pointZ = z + Math.cos(angle) * 2.02;
          parts.push(cylinder("切向承接客舱外周回转圈的下托轮", [side * 1.48, y, pointZ], [.32, .13, .32], transportColors.body, [0, 0, 90]), cylinder("托轮轴仅位于舱外而不穿越客舱的独立短轴", [side * 1.65, y, pointZ], [.1, .6, .1], transportColors.trim, [0, 0, 90]), strut("门洞地板下方的托轮外侧承轴座", [side * 1.83, .92, pointZ], [side * 1.83, y, pointZ], .14, transportColors.dark));
        }
        parts.push(part("在客舱前后留出完整门道的外置上扣轮门架", "extrude", transportColors.dark, [side * 1.83, 0, z], [1, 1, 1], [0, 90, 0], { depth: .14, profile: [{ x: -2.26, y: .92 }, { x: -2.26, y: 5.13 }, { x: 2.26, y: 5.13 }, { x: 2.26, y: .92 }, { x: 2.14, y: .92 }, { x: 2.14, y: 4.91 }, { x: -2.14, y: 4.91 }, { x: -2.14, y: .92 }] }), cylinder("客舱回转圈上方防脱扣轮", [side * 1.48, 5.02, z], [.32, .13, .32], transportColors.body, [0, 0, 90]), cylinder("上扣轮向外接入门架而不进入客舱的短轮轴", [side * 1.65, 5.02, z], [.1, .6, .1], transportColors.trim, [0, 0, 90]));
      }
      const driveAngle = Math.PI * 1.75, driveY = 3 + Math.sin(driveAngle) * 2.02, driveZ = z + Math.cos(driveAngle) * 2.02;
      parts.push(cylinder("与外周托轮同轴且独立驱动客舱找平的电机", [2.03, driveY, driveZ], [.4, .4, .4], transportColors.signal, [0, 0, 90]));
    }
    for (const end of [-1, 1]) parts.push(box("车端缆索承力夹持座", [0, .8, end * 6.15], [.48, .22, .7], transportColors.body), strut("夹索座连接车底横向端梁的独立承力牵引杆", [0, .92, end * 6], [0, .8, end * 6.4], .14, transportColors.dark));
    const tilt = new Quaternion().setFromEuler(new Euler(25 * Math.PI / 180, 0, 0));
    for (const value of parts) {
      const position = new Vector3(value.position.x, value.position.y, value.position.z).applyQuaternion(tilt);
      const orientation = new Euler().setFromQuaternion(tilt.clone().multiply(new Quaternion().setFromEuler(new Euler(value.rotation.x * Math.PI / 180, value.rotation.y * Math.PI / 180, value.rotation.z * Math.PI / 180))));
      value.position = { x: position.x, y: position.y, z: position.z };
      value.rotation = { x: orientation.x * 180 / Math.PI, y: orientation.y * 180 / Math.PI, z: orientation.z * 180 / Math.PI };
    }
    for (const localZ of centers) {
      const center = new Vector3(0, 3, localZ).applyQuaternion(tilt), position: Triple = [center.x, center.y, center.z];
      parts.push(barrelArc("回转客舱下半周具有真实厚度的承力壳", Math.PI, transportColors.body, position), barrelArc("回转客舱上半周连续曲面玻璃", 0, transportColors.glass, position, true), box("在斜行车架上仍然保持水平的独立客舱地板", [0, center.y - 1.25, center.z], [3.05, .16, 1.9], transportColors.wood));
      for (const side of [-1, 1]) {
        parts.push(ring("客舱端部承接全部托轮的完整外周回转轨圈", transportColors.dark, 1.86, .06, 0, .13, { position: { x: side * 1.48, y: center.y, z: center.z }, rotation: { x: 0, y: 0, z: 90 } }));
        const outline: [number, number][] = Array.from({ length: 20 }, (_, index) => { const angle = index * Math.PI / 10; return [Math.cos(angle) * 1.75, Math.sin(angle) * 1.75]; });
        const panel = polygon("具有成人全高通行门洞的圆筒客舱端面", transportColors.body, outline, .05, [side * 1.5, center.y, center.z], [[[-1.17, -.55], [1.1, -.55], [1.1, .55], [-1.17, .55]]]);
        panel.rotation.z = 90;
        parts.push(panel, box("独立客舱长座椅的实际承托底座", [side * 1.1, center.y - 1.005, center.z], [.17, .33, 1.2], transportColors.dark), box("随客舱保持水平的独立长座垫", [side * 1.1, center.y - .76, center.z], [.45, .16, 1.3], transportColors.dark), box("客舱端面内侧接入座垫的独立靠背", [side * 1.3, center.y - .41, center.z], [.09, .56, 1.3], transportColors.body));
      }
    }
    return parts;
  } },
];
