import { part, ring, type ModelPart, type Triple } from "../assetModelParts";
import { polygon } from "../masterNature/shared";
import { solidPanel } from "./marineExpansionBatchTwo";
import { box, cylinder, strut, transportColors, type TransportDefinition } from "./parts";

// 原创简化船用主机，保留完整曲轴、十字头、气缸与跨级汽路，不作为制造图。
// https://my.wingd.com/media/g5bd21zh/om_wingd-x62-b.pdf
// https://collection.sciencemuseumgroup.org.uk/objects/co51790/triple-expansion-marine-steam-engine

const body = transportColors.body, dark = transportColors.dark, trim = transportColors.trim;

function crankTrain(z: number, phase: number, crankY: number, crossheadY: number, radius: number): ModelPart[] {
  const angle = phase * Math.PI / 180, end: Triple = [Math.cos(angle) * radius, crankY + Math.sin(angle) * radius, z];
  return [strut("主轴中心与曲柄销之间的受力曲柄腹板", [0, crankY, z], end, 0.3, dark), cylinder("实际连接曲柄腹板与连杆的偏心销", [end[0], end[1], z + 0.15], [0.18, 0.35, 0.18], trim, [90, 0, 0]), strut("曲柄销至十字头的独立长连杆", [end[0], end[1], z + 0.15], [0, crossheadY, z], 0.16, body)];
}

function pipe(name: string, path: Triple[], radius: number): ModelPart {
  return part(name, "tube", dark, [0, 0, 0], [1, 1, 1], [0, 0, 0], { radius, path: path.map(([x, y, z]) => ({ x, y, z })) });
}

export const marineExpansionBatchEight: TransportDefinition[] = [
  { name: "直列六缸低速十字头船用柴油主机", theme: "现代", itemType: "设施", tags: ["低速柴油主机", "十字头二冲程机", "船用大型发动机"], create: () => {
    const rodHoles: [number, number][][] = Array.from({ length: 6 }, (_, index) => Array.from({ length: 8 }, (_, angle): [number, number] => [Math.cos(angle * Math.PI / 4) * 0.15, -5.5 + index * 2.2 + Math.sin(angle * Math.PI / 4) * 0.15]));
    const parts: ModelPart[] = [box("大型主机连续船底安装床板", [0, 0.4, 0], [5.3, 0.8, 14], dark), polygon("顶部敞开的曲轴箱承载框", body, [[-2.1, -6.65], [2.1, -6.65], [2.1, 6.65], [-2.1, 6.65]], 1.2, [0, 0.8, 0], [[[-1.9, -6.5], [1.9, -6.5], [1.9, 6.5], [-1.9, 6.5]]]), cylinder("贯通全部气缸的船用主曲轴", [0, 1.6, 0], [0.35, 14.2, 0.35], dark, [90, 0, 0]), polygon("活塞杆逐孔穿过的上部气缸承载机架", body, [[-1.6, -6.75], [1.6, -6.75], [1.6, 6.75], [-1.6, 6.75]], 0.7, [0, 6.65, 0], rodHoles), cylinder("曲轴尾端输出联轴法兰", [0, 1.6, 7], [1.7, 0.25, 1.7], trim, [90, 0, 0]), cylinder("气缸侧连续排气总管", [1.45, 11.9, 0], [0.8, 12.8, 0.8], dark, [90, 0, 0]), cylinder("扫气总管", [-1.5, 7.95, 0], [1.1, 12.8, 1.1], body, [90, 0, 0]), box("侧置涡轮增压机底座", [2.9, 5.2, 5.2], [1.6, 9.6, 2.6], body), cylinder("排气涡轮外壳", [2.9, 10.4, 5.2], [2.3, 1, 2.3], dark, [0, 0, 90]), part("同轴压气机的中空进气围壳", "lathe", body, [4, 10.4, 5.2], [1, 1, 1], [0, 0, 90], { profile: [{ x: 0.7, y: -0.5 }, { x: 1.2, y: -0.5 }, { x: 1.2, y: 0.5 }, { x: 0.7, y: 0.5 }, { x: 0.7, y: -0.5 }] }), cylinder("连接涡轮与压气机的贯通短轴", [3.45, 10.4, 5.2], [0.15, 1.3, 0.15], dark, [0, 0, 90]), ring("压气机真正敞开的轴向进气口", trim, 0.75, 0.14, 10.4, 0.22, { position: { x: 4.6, y: 10.4, z: 5.2 }, rotation: { x: 0, y: 0, z: 90 } })];
    for (const center of [-4.4, 0, 4.4]) {
      const lowerHoles: [number, number][][] = [-1.1, 1.1].map(z => [[-0.9, z - 0.4], [0.9, z - 0.4], [0.9, z + 0.4], [-0.9, z + 0.4]]);
      const upperHoles: [number, number][][] = [-1.1, 1.1].map(z => Array.from({ length: 8 }, (_, index): [number, number] => [Math.cos(index * Math.PI / 4) * 0.15, z + Math.sin(index * Math.PI / 4) * 0.15]));
      parts.push(solidPanel("保留连杆摆动通槽的下部导轨承台", [0, 2.08, center], [1, 0, 0], [0, 0, 1], [[-1.6, -2.2], [1.6, -2.2], [1.6, 2.2], [-1.6, 2.2]], lowerHoles), solidPanel("活塞杆真正穿过圆孔的上承台", [0, 6.58, center], [1, 0, 0], [0, 0, 1], [[-1.6, -2.2], [1.6, -2.2], [1.6, 2.2], [-1.6, 2.2]], upperHoles));
    }
    for (const z of [-6, 0, 6]) for (const side of [-1, 1]) parts.push(strut("曲轴床板至上部机架的A形承柱", [side * 2.1, 2, z], [side * 1.2, 6.85, z], 0.3, body));
    for (const z of [-6.6, -4.4, -2.2, 0, 2.2, 4.4, 6.6]) parts.push(box("主轴承下部落到床板的支座", [0, 1.15, z], [0.7, 0.7, 0.4], body), ring("真正抱住主轴的分体承载轴承", trim, 0.29, 0.1, 1.6, 0.3, { position: { x: 0, y: 1.6, z }, rotation: { x: 90, y: 0, z: 0 } }));
    for (let index = 0; index < 6; index++) {
      const z = -5.5 + index * 2.2;
      parts.push(cylinder("长冲程立式燃烧气缸外套", [0, 9.2, z], [1.65, 3.7, 1.65], body), cylinder("独立气缸密封顶盖", [0, 11.25, z], [1.8, 0.4, 1.8], dark), cylinder("气缸盖中央排气阀执行头", [0, 11.65, z], [0.6, 0.4, 0.6], trim), box("限制活塞侧摆的十字头滑块", [0, 4.9, z], [1.15, 0.6, 0.6], trim), cylinder("十字头至气缸内活塞的长杆", [0, 6.7, z], [0.12, 3, 0.12], dark), ...[-1, 1].map(side => box("十字头两侧连续竖直滑轨", [side * 0.7, 4.33, z], [0.16, 4.34, 0.3], dark)), ...crankTrain(z, index * 60, 1.6, 4.65, 0.55), pipe("每缸独立排气支管", [[0, 11.65, z], [0.55, 12.05, z], [1.45, 11.9, z]], 0.14), strut("扫气总管接入缸套的短支管", [-1.5, 7.95, z], [-0.7, 7.95, z], 0.25, body));
    }
    parts.push(pipe("排气总管至增压涡轮的连接弯管", [[1.45, 11.9, 5.5], [1.9, 11.9, 5.2], [2.9, 11.4, 5.2]], 0.3), pipe("压气机至扫气总管的回接管", [[4, 10.4, 4.1], [4, 8.5, 2.9], [-1.5, 8.5, 2.9], [-1.5, 7.95, 2.9]], 0.26));
    return parts;
  } },
  { name: "三级逐次膨胀立式船用蒸汽主机", theme: "蒸汽朋克", itemType: "设施", tags: ["三胀蒸汽机", "船用复合蒸汽机", "triple expansion marine engine"], create: () => {
    const rodHoles: [number, number][][] = [-3, 0, 3].map(z => Array.from({ length: 8 }, (_, angle): [number, number] => [Math.cos(angle * Math.PI / 4) * 0.13, z + Math.sin(angle * Math.PI / 4) * 0.13]));
    const parts: ModelPart[] = [box("蒸汽主机与冷凝器共用床板", [0.6, 0.325, 0], [7.8, 0.65, 11], dark), cylinder("三缸共同受力的连续主轴", [0, 1.4, 0], [0.3, 11.5, 0.3], dark, [90, 0, 0]), cylinder("主轴末端输出飞轮", [0, 1.4, 5.7], [2.6, 0.24, 2.6], dark, [90, 0, 0]), polygon("活塞杆孔贯穿整层气缸承载机架", body, [[-1.65, -5], [1.65, -5], [1.65, 5], [-1.65, 5]], 0.3, [0, 5.2, 0], rodHoles), ...[-1, 1].map(side => box("十字头下部开敞式纵向承载轨", [side * 0.75, 1.98, 0], [0.25, 0.3, 10], dark)), cylinder("独立卧式冷凝器圆筒", [2.7, 1.8, 0.8], [2.1, 6, 2.1], body, [90, 0, 0]), ...[-1.4, 3].map(z => box("冷凝器底部实际鞍形承座", [2.7, 0.85, z], [1.6, 0.4, 0.6], trim))];
    for (const z of [-4.5, -1.5, 1.5, 4.5]) parts.push(box("曲轴主轴承床座", [0, 0.95, z], [0.65, 0.6, 0.4], body), ring("曲轴主轴承真实圆孔", trim, 0.24, 0.08, 1.4, 0.28, { position: { x: 0, y: 1.4, z }, rotation: { x: 90, y: 0, z: 0 } }));
    for (let index = 0; index < 3; index++) {
      const z = -3 + index * 3, diameter = [1, 1.6, 2.3][index]!;
      parts.push(cylinder(["高压小缸", "中压扩容缸", "低压大缸"][index]!, [0, 6.55, z], [diameter, 2.1, diameter], body), cylinder("独立汽缸封闭顶盖", [0, 7.72, z], [diameter + 0.16, 0.24, diameter + 0.16], trim), box("十字头滑块", [0, 3.5, z], [1.05, 0.4, 0.65], trim), cylinder("十字头至缸内的活塞直杆", [0, 4.75, z], [0.1, 2.1, 0.1], dark), ...crankTrain(z, index * 120, 1.4, 3.32, 0.5), ...[-1, 1].map(side => box("连续直杆导向滑轨", [side * 0.62, 3.65, z], [0.14, 3.1, 0.3], dark)), ...[-1, 1].map(side => strut("缸体下方立式A形承柱", [side * 1.7, 0.65, z], [side * 0.95, 5.25, z], 0.25, body)), box("独立配汽阀箱", [-diameter / 2 - 0.25, 6.5, z], [0.5, 1.7, diameter * 0.75], dark), strut("主轴偏心轮至配汽箱的外侧长阀杆", [-0.5, 1.4, z - 0.6], [-diameter / 2 - 0.25, 6, z - 0.36], 0.06, trim), ring("主轴侧面实际偏心配汽轮", body, 0.37, 0.1, 1.4, 0.12, { position: { x: -0.16, y: 1.4, z: z - 0.6 }, rotation: { x: 90, y: 0, z: 0 } }));
      const rodHole: [number, number][] = Array.from({ length: 8 }, (_, angle) => [Math.cos(angle * Math.PI / 4) * 0.13, Math.sin(angle * Math.PI / 4) * 0.13]);
      parts.push(solidPanel("有真实活塞杆孔的缸底承载片", [0, 5.25, z], [1, 0, 0], [0, 0, 1], [[-1.3, -1.3], [1.3, -1.3], [1.3, 1.3], [-1.3, 1.3]], [rodHole]));
    }
    parts.push(pipe("高压缸排汽进入中压缸的跨级接管", [[0.4, 6.8, -3], [1.15, 6.8, -3], [1.15, 6.8, 0], [0.72, 6.8, 0]], 0.16), pipe("中压缸排汽进入低压缸的跨级接管", [[0.7, 6.5, 0], [1.45, 6.5, 0], [1.45, 6.5, 3], [1.05, 6.5, 3]], 0.2), pipe("低压缸向冷凝器的末级排汽管", [[1.05, 6.25, 3], [2.7, 5.7, 3], [2.7, 2.85, 3]], 0.28), strut("调汽手轮接入阀箱的支架", [-0.75, 5.7, -3], [-0.85, 5.1, -3], 0.12, body), cylinder("外部调汽手轮轴", [-1.45, 5.1, -3], [0.06, 1.2, 0.06], dark, [0, 0, 90]), ring("外部调汽操作轮", trim, 0.4, 0.06, 5.1, 0.06, { position: { x: -2.05, y: 5.1, z: -3 }, rotation: { x: 0, y: 0, z: 90 } }));
    for (const degrees of [0, 120, 240]) { const angle = degrees * Math.PI / 180; parts.push(strut("调汽轮缘至主轴的实际辐条", [-2.05, 5.1, -3], [-2.05, 5.1 + Math.cos(angle) * 0.37, -3 + Math.sin(angle) * 0.37], 0.04, trim)); }
    return parts;
  } },
];
