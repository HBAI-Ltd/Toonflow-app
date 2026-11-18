import { BoxGeometry, CylinderGeometry, Euler, Matrix4, Quaternion, Vector3 } from "three";
import { part, type ModelPart, type Triple } from "../assetModelParts";
import { polygon } from "../masterNature/shared";
import { captainSeats, drivingControls, quadFaces } from "./everydayPassengerVehicleBatchOne";
import { box, cylinder, strut, surface, wheel, transportColors, type TransportDefinition } from "./parts";

function geometryBatch(name: string, pieces: ModelPart[], round = false): ModelPart {
  const geometry = round ? new CylinderGeometry(0.5, 0.5, 1, 6, 1) : new BoxGeometry(1, 1, 1), source = geometry.getAttribute("position"), used = [...new Set(geometry.index!.array)], remap = new Map(used.map((index, offset) => [index, offset])), vertices: { x: number; y: number; z: number }[] = [], indices: number[] = [];
  try {
    for (const piece of pieces) {
      const offset = vertices.length, matrix = new Matrix4().compose(new Vector3(piece.position.x, piece.position.y, piece.position.z), new Quaternion().setFromEuler(new Euler(piece.rotation.x * Math.PI / 180, piece.rotation.y * Math.PI / 180, piece.rotation.z * Math.PI / 180)), new Vector3(piece.scale.x, piece.scale.y, piece.scale.z));
      for (const index of used) { const p = new Vector3(source.getX(index), source.getY(index), source.getZ(index)).applyMatrix4(matrix); vertices.push({ x: p.x, y: p.y, z: p.z }); }
      for (const index of geometry.index!.array) indices.push(offset + remap.get(index)!);
    }
  } finally { geometry.dispose(); }
  return part(name, "mesh", transportColors.dark, [0, 0, 0], [1, 1, 1], [0, 0, 0], { vertices, indices });
}

function cover(side: number, z: number): ModelPart {
  const profile = [...Array.from({ length: 9 }, (_, index) => ({ x: Math.cos(index * Math.PI / 8) * 0.46, y: 0.37 + Math.sin(index * Math.PI / 8) * 0.46 })), ...Array.from({ length: 9 }, (_, index) => ({ x: Math.cos((8 - index) * Math.PI / 8) * 0.42, y: 0.37 + Math.sin((8 - index) * Math.PI / 8) * 0.42 }))];
  return part("高于独立大轮胎并与车体侧壳接合的宽轮拱翼板", "extrude", "#8e9f99", [side * 0.7, 0, z], [1, 1, 1], [0, -90, 0], { depth: 0.34, profile });
}

function suspension(parts: ModelPart[], side: number, z: number) {
  parts.push(...wheel([side * 0.74, 0.37, z], 0.37, 0.25), cylinder("齿轮箱向独立转向节连接的横向半轴", [side * 0.34, 0.37, z], [0.055, 0.7, 0.055], transportColors.dark, [0, 0, 90]), strut("承接上下球铰并与独立轮毂真实连接的转向节", [side * 0.59, 0.29, z], [side * 0.59, 0.53, z], 0.05), box("固定于车架横梁并容纳上摆臂双枢轴的支座板", [side * 0.3, 0.57, z], [0.05, 0.3, 0.5], transportColors.dark));
  for (const direction of [-1, 1]) parts.push(strut("双叉臂悬架上摆臂的独立前后支杆", [side * 0.3, 0.69, z + direction * 0.18], [side * 0.59, 0.53, z], 0.04), strut("双叉臂悬架下摆臂的独立前后支杆", [side * 0.28, 0.42, z + direction * 0.24], [side * 0.59, 0.3, z], 0.04));
  const damper = strut("由摆臂斜接到车架上支座的独立减振器", [side * 0.52, 0.35, z], [side * 0.31, 0.73, z], 0.065, "#b28f65");
  damper.shape = "cylinder";
  parts.push(damper, cover(side, z));
}

export const everydayPassengerVehicleBatchSix: TransportDefinition[] = [
  { name: "并排双座防滚笼独立悬挂UTV", theme: "现代", tags: ["汽车", "影视", "生活常见", "并排座全地形车", "UTV", "完整双座防滚笼与四轮双叉臂", "短后器材舱"], create: () => {
    const color = "#99aaa0", parts: ModelPart[] = [box("并排双座座舱的开放平整脚部地板", [0, 0.5, -0.15], [1.16, 0.12, 1.55], transportColors.dark), cylinder("在中央横梁真实缺口中贯通前后齿轮箱的纵向传动轴", [0, 0.37, 0], [0.05, 2.26, 0.05], transportColors.dark, [90, 0, 0]), surface("防滚笼前方的完整短机罩", color, [[-0.55, 0.9, -1.55], [0.55, 0.9, -1.55], [0.55, 1.0, -0.75], [-0.55, 1.0, -0.75]], quadFaces), box("短机罩车头的闭合薄前面", [0, 0.74, -1.52], [1.12, 0.32, 0.07], color), polygon("绕后桥齿轮箱真实开孔并落在双纵梁的动力机床", transportColors.dark, [[-0.51, 0.65], [0.51, 0.65], [0.51, 1.55], [-0.51, 1.55]], 0.1, [0, 0.43, 0], [[[-0.18, 0.95], [0.18, 0.95], [0.18, 1.31], [-0.18, 1.31]]]), box("后置独立动力机壳", [0, 0.72, 1.13], [0.6, 0.34, 0.6], "#6a7c7c"), cylinder("经机床真实孔口连接动力机与后传动箱的短接壳", [0, 0.535, 1.13], [0.1, 0.14, 0.1], "#6a7c7c"), box("动力机上方保留维修净空的短器材舱地板", [0, 1.0, 1.15], [1.08, 0.08, 1.0], color), box("短器材舱前挡板", [0, 1.1, 0.65], [1.08, 0.2, 0.06], color), box("短器材舱后尾板", [0, 1.1, 1.65], [1.08, 0.2, 0.06], color), box("后器材舱尾板开启把手", [0, 1.11, 1.691], [0.18, 0.04, 0.03], transportColors.dark), box("一体防滚笼实际承托的轻型遮阳顶", [0, 1.8, -0.075], [1.32, 0.04, 1.05], "#687c79"), box("前方低位防碰横杠", [0, 0.46, -1.67], [1.15, 0.1, 0.1], transportColors.dark), box("后方低位防碰横杠", [0, 0.46, 1.68], [1.12, 0.1, 0.1], transportColors.dark)];
    for (const z of [-1.13, -0.15, 1.13]) for (const side of [-1, 1]) parts.push(box("为传动箱与纵向传动轴留真实中央缺口的横向框梁", [side * 0.325, 0.45, z], [0.31, 0.07, 0.075], transportColors.dark));
    for (const z of [-1.13, 1.13]) {
      parts.push(part("与轮边半轴同轴且固定于车架的独立齿轮箱壳", "sphere", "#647775", [0, 0.37, z], [0.3, 0.3, 0.3]));
      for (const side of [-1, 1]) parts.push(strut("真实从齿轮箱外壳接到分段横框梁的短固定座", [side * 0.12, 0.45, z], [side * 0.22, 0.42, z], 0.045));
    }
    for (const side of [-1, 1]) {
      parts.push(box("真实落在机床孔外实心钢面并承托后置动力机的承重脚", [side * 0.24, 0.55, 1.13], [0.16, 0.08, 0.2], transportColors.dark));
      parts.push(strut("完整前后贯通的低位纵向管架", [side * 0.48, 0.45, -1.5], [side * 0.48, 0.45, 1.5], 0.07), part("前部宽轮翼连接短机罩的实际侧薄壳", "extrude", color, [side * 0.51, 0, 0], [1, 1, 1], [0, -90, 0], { depth: 0.08, profile: [{ x: -1.55, y: 0.9 }, { x: -0.75, y: 1.0 }, { x: -0.75, y: 0.52 }, { x: -1.55, y: 0.52 }] }), box("从低位管架实际托起短机罩的支柱", [side * 0.48, 0.49, -1.13], [0.12, 0.12, 0.14], transportColors.dark), box("与后翼板及动力机床接合的完整后舱侧壳", [side * 0.51, 0.85, 1.15], [0.08, 0.7, 1.0], color));
      for (const z of [-1.13, 1.13]) suspension(parts, side, z);
      const frontLow: Triple = [side * 0.55, 0.5, -0.82], frontTop: Triple = [side * 0.62, 1.78, -0.58], rearLow: Triple = [side * 0.55, 0.5, 0.53], rearTop: Triple = [side * 0.62, 1.78, 0.43];
      parts.push(strut("一体防滚笼前倾高立柱", frontLow, frontTop, 0.06), strut("一体防滚笼完整后立柱", rearLow, rearTop, 0.06), strut("前后立柱之间连续相接的车顶纵杆", frontTop, rearTop, 0.06), strut("后舱侧壳连接车顶后角的实际防滚斜撑", [side * 0.55, 0.5, 1.3], rearTop, 0.06), surface("上下边沿均实际接入防滚立柱的半高侧门", color, [[side * 0.5521875, 0.54, -0.8125], [side * 0.5521875, 0.54, 0.526875], [side * 0.57625, 0.98, 0.4925], [side * 0.57625, 0.98, -0.73]], quadFaces), box("与前部薄车头接合的左右前照灯", [side * 0.32, 0.78, -1.56], [0.26, 0.11, 0.04], "#e7dfb6"), box("短后舱尾板上的左右制动灯", [side * 0.39, 1.1, 1.691], [0.16, 0.08, 0.035], "#af665b"), strut("外侧短臂连接防滚前柱的后视镜杆", [side * 0.58, 1.1, -0.71], [side * 0.75, 1.12, -0.71], 0.025), box("防滚柱侧外置后视镜壳", [side * 0.78, 1.12, -0.71], [0.1, 0.13, 0.12], transportColors.dark), strut("纵管架接到前防碰杠的真实托臂", [side * 0.48, 0.42, -1.48], [side * 0.48, 0.46, -1.67], 0.06), strut("纵管架接到后防碰杠的真实托臂", [side * 0.48, 0.42, 1.48], [side * 0.48, 0.46, 1.68], 0.06));
    }
    for (const z of [-0.58, 0.43]) parts.push(strut("左右车顶纵管之间真正闭合的防滚横管", [-0.62, 1.78, z], [0.62, 1.78, z], 0.06));
    captainSeats(parts, -0.18, 0.31, 0.74, 0.56);
    drivingControls(parts, -0.74, 0.98, 1.11, -0.31);
    const armNames = new Set(["双叉臂悬架上摆臂的独立前后支杆", "双叉臂悬架下摆臂的独立前后支杆"]), frameNames = new Set(["为传动箱与纵向传动轴留真实中央缺口的横向框梁", "完整前后贯通的低位纵向管架", "真实从齿轮箱外壳接到分段横框梁的短固定座", "纵管架接到前防碰杠的真实托臂", "纵管架接到后防碰杠的真实托臂", "前方低位防碰横杠", "后方低位防碰横杠"]), cageNames = new Set(["一体防滚笼前倾高立柱", "一体防滚笼完整后立柱", "前后立柱之间连续相接的车顶纵杆", "后舱侧壳连接车顶后角的实际防滚斜撑", "左右车顶纵管之间真正闭合的防滚横管"]);
    const batched = new Set([...armNames, ...frameNames, ...cageNames]);
    return [...parts.filter(piece => !batched.has(piece.name)), geometryBatch("四轮真实双叉臂前后连杆的轻量合批", parts.filter(piece => armNames.has(piece.name))), geometryBatch("连续底架与桥箱支座及前后防碰托臂的轻量合批", parts.filter(piece => frameNames.has(piece.name))), geometryBatch("完整双座防滚笼真实闭合圆管骨架合批", parts.filter(piece => cageNames.has(piece.name)), true)];
  } },
];
