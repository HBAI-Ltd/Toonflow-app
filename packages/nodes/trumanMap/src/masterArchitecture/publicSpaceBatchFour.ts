import { part, type ModelPart, type Triple } from "../assetModelParts";
import { box, cylinder, design, colors } from "./structures";
import { barrelRoof, halfRoundWall } from "./spatialShells";
import { polygon } from "../masterNature/shared";
import { doorway } from "./publicSpaceBatchOne";

const wallColor = "#b6b9ab", paving = "#b8b096", dark = "#526970", wood = "#a58c66";

export const publicSpaceBatchFourDesigns = [
  design("中心环视重症监护病区", "六个独立病房围绕中央护理台布置，病房前墙的双观察窗与实际门洞面向环行通道，床头服务墙和独立房顶组成完整病区", intensiveCareWard, "建筑", "现代"),
  design("环廊观察窗生物实验楼", "北侧分隔工作间通过观察窗和独立门洞接向中央采光院，南侧准备间与两侧环廊共同形成完整实验楼", biologyLaboratory, "建筑", "现代"),
  design("分区进出综合警务署", "前方公共接待楼与后方车辆穿行库分开，两侧办公及留置翼围合受控内院，车行出入接后场，人行接待接前场", policeCompound, "建筑", "现代"),
  design("双会场连廊会议中心", "两座带扇形阶席的完整圆形会场以中央连廊相接，各自的前入口与连廊侧入口独立开设，中央服务厅贯通前后", twinConferenceCenter, "建筑", "现代"),
  design("大跨拱肋室内骑术馆", "完整长跨度筒拱覆盖沙质骑术场，低位护壁围出训练范围，侧门接到带独立通行廊的马厩翼，前后高拱端窗封合大馆", ridingHall, "建筑", "现代"),
];

function glazedPartition(name: string, width: number, height: number, opening: number, doorHeight: number, bottom: number, top: number): ModelPart[] {
  const left = -width / 2 + .25, right = -opening / 2 - .25;
  const outline: [number, number][] = [[-width / 2, 0], [-opening / 2, 0], [-opening / 2, doorHeight], [opening / 2, doorHeight], [opening / 2, 0], [width / 2, 0], [width / 2, height], [-width / 2, height]];
  const holes: [number, number][][] = [[[left, bottom], [right, bottom], [right, top], [left, top]], [[-right, bottom], [-left, bottom], [-left, top], [-right, top]]];
  const wall = polygon(name, wallColor, outline, .24, [0, 0, 0], holes);
  wall.vertices = wall.vertices!.map(point => ({ x: point.x, y: point.z, z: .12 - point.y }));
  return [wall, ...[-1, 1].map(side => part("位于实际窗孔内的观察玻璃", "box", colors.glass, [side * (Math.abs(left) + Math.abs(right)) / 2, (bottom + top) / 2, 0], [right - left, top - bottom, .035], [0, 0, 0], { opacity: .25, roughness: .16 }))];
}

function place(parts: ModelPart[], position: Triple, yaw: number): ModelPart[] {
  const angle = yaw * Math.PI / 180, c = Math.cos(angle), s = Math.sin(angle);
  return parts.map(value => ({ ...value, position: { x: position[0] + value.position.x * c + value.position.z * s, y: position[1] + value.position.y, z: position[2] - value.position.x * s + value.position.z * c }, rotation: { ...value.rotation, y: value.rotation.y + yaw } }));
}

function intensiveCareWard(): ModelPart[] {
  const p: ModelPart[] = [cylinder("完整六翼病区共同落地基础", 0, .1, 0, 23, .2, paving), halfRoundWall("中央护理台朝走廊留实际工作口的台身", 2.2, .35, 1.1, [0, .2, 0], -15, wallColor, Math.PI * 11 / 6), halfRoundWall("护理台连续台面沿工作口收头", 2.3, .5, .14, [0, 1.3, 0], -15, wood, Math.PI * 11 / 6), cylinder("中央环行廊上方整体圆屋盖", 0, 3.73, 0, 10.65, .2, dark)];
  for (let index = 0; index < 6; index++) {
    const a = index * Math.PI / 3;
    const front = glazedPartition("病房前墙的实际门与双观察窗", 5.2, 3.4, 1.2, 2.3, 1.1, 2.9);
    for (const value of front) { value.position.y += .2; value.position.z -= 2.5; }
    const room = [...front, ...[-1, 1].map(side => box("病房两侧完整隔声墙", side * 2.6, 1.9, 0, .2, 3.4, 5, wallColor)), box("病房后侧封合外墙", 0, 1.9, 2.5, 5.2, 3.4, .24, wallColor), box("独立病房平屋盖", 0, 3.7, 0, 5.5, .2, 5.5, dark), box("病床离地稳固底架", 0, .55, .35, .8, .7, 1.9, dark), box("护理床床面", 0, 1, .35, .9, .2, 2.1, "#94afa5"), box("床头服务面板", 0, 1.8, 2.3, 3.6, .6, .18, wallColor), cylinder("床侧竖直服务接口立杆", 1.25, 1.7, .3, .06, 2.2, dark)];
    p.push(...place(room, [Math.cos(a) * 7, 0, Math.sin(a) * 7], 90 - index * 60));
  }
  return p;
}

function biologyLaboratory(): ModelPart[] {
  const p: ModelPart[] = [box("实验楼完整承重地基", 0, .1, 0, 34, .2, 30, paving), polygon("围绕中央采光院的连续室内地板", paving, [[-16.8, -14.8], [16.8, -14.8], [16.8, 14.8], [-16.8, 14.8]], .2, [0, .2, 0], [[[-12.5, -6.5], [12.5, -6.5], [12.5, 3.5], [-12.5, 3.5]]]), doorway("实验楼前方公共入口", [0, .4, -14.8], 33.6, 3.8, 2.4), box("实验楼完整北外墙", 0, 2.3, 14.8, 33.6, 3.8, .24, wallColor), ...[-1, 1].map(side => box("实验楼侧翼外墙", side * 16.8, 2.3, 0, .24, 3.8, 29.6, wallColor)), polygon("沿环廊与工作间闭合的屋盖", dark, [[-17.1, -15.1], [17.1, -15.1], [17.1, 15.1], [-17.1, 15.1]], .24, [0, 4.2, 0], [[[-12.5, -6.5], [12.5, -6.5], [12.5, 3.5], [-12.5, 3.5]]]), part("中央采光院顶置透明盖", "box", colors.glass, [0, 4.46, -1.5], [25.1, .04, 10.1], [0, 0, 0], { opacity: .25 }), doorway("准备更衣翼与采光院之间门洞", [0, .4, -6.5], 25, 3.8, 2.4)];
  for (const x of [-10, 0, 10]) {
    p.push(...place(glazedPartition("实验工作间朝采光院的实际观察窗和门", 10, 3.8, 1.5, 2.4, 1.2, 2.9), [x, .4, 3.5], 0), box("实验工作台整体耐水台面", x, 1.3, 9, 6.5, .2, 1.6, wallColor), ...[-1, 1].map(side => box("工作台实际落地支脚", x + side * 2.7, .8, 9, .18, .8, 1.3, dark)));
  }
  for (const x of [-15, -5, 5, 15]) p.push(box("实验工作间之间完整分隔墙", x, 2.3, 9.15, .2, 3.8, 11.3, wallColor));
  for (const x of [-8, 8]) p.push(doorway("准备翼内部独立更衣缓冲门", [x, .4, -10.65], 8.3, 3.8, 1.2, 90));
  for (const side of [-1, 1]) for (const z of [-6.5, 3.5]) p.push(box("采光院顶盖独立支承细柱", side * 12.5, 2.43, z, .16, 4.06, .16, dark));
  p.push(box("采光院中可排布植物的低位种植床", 0, .3, -1.5, 20.5, .2, 6.5, "#909c78"));
  return p;
}

function policeCompound(): ModelPart[] {
  const p: ModelPart[] = [box("公共接待和警务后场共同基础", 0, .1, 0, 38, .2, 40, paving), box("前方接待楼完整楼板", 0, .3, -13, 36, .2, 8, paving), doorway("面向公众的主入口", [0, .4, -17], 36, 4, 2.8), doorway("接待楼通往受控内院的门洞", [0, .4, -9], 36, 4, 1.6), ...[-1, 1].map(side => box("接待楼两端封墙", side * 17.9, 2.4, -13, .25, 4, 8, wallColor)), box("接待楼完整屋盖", 0, 4.65, -13, 36.5, .25, 8.5, dark), box("公共报到服务长台", -7, 1.12, -12, 10, 1.05, .8, wallColor), box("公众等候固定长座", 8, .8, -13.7, 9, .35, .8, wood), box("后场车辆贯通库屋面", 0, 5.1, 16, 36.5, .3, 8.5, dark)];
  for (const side of [-1, 1]) {
    p.push(box("侧翼完整地板", side * 14, .3, 2, 8, .2, 20, paving), box("侧翼外侧连续围护墙", side * 18, 2.4, 2, .25, 4, 20, wallColor), box("侧翼完整屋盖", side * 14, 4.65, 2, 8.5, .25, 20.5, dark));
    for (let i = 0; i < 4; i++) { const z = -5.5 + i * 5; p.push(doorway(side < 0 ? "办公间实际朝院入口" : "留置间独立受控入口", [side * 10, .4, z], 5, 4, side < 0 ? 1.2 : .95, 90, 2.4)); }
    for (let i = 0; i <= 4; i++) p.push(box("侧翼每室之间真实厚隔墙", side * 14, 2.4, -8 + i * 5, 8, 4, .2, wallColor));
  }
  for (const x of [-12, 0, 12]) for (const z of [12, 20]) p.push(doorway("警用车辆前后贯通的高门洞", [x, .2, z], 12, 4.7, 3.6, 0, 3.8));
  p.push(box("后场车库两端封墙", -18, 2.55, 16, .25, 4.7, 8, wallColor), box("后场车库另一端封墙", 18, 2.55, 16, .25, 4.7, 8, wallColor), box("受控内院作业地面", 0, .23, 1.5, 19.5, .06, 20.5, "#929d93"));
  return p;
}

function twinConferenceCenter(): ModelPart[] {
  const p: ModelPart[] = [box("双会场共同落地会务平台", 0, .2, 0, 44, .4, 30, paving), doorway("中央服务连廊前入口", [0, .4, -12], 6.7, 4.5, 2.5), doorway("中央服务连廊后出口", [0, .4, 12], 6.7, 4.5, 2.5), box("中央会务连廊独立屋面", 0, 5.1, 0, 7.1, .25, 24.4, dark)];
  for (const side of [-1, 1]) {
    const x = side * 12, starts = side < 0 ? [15, 285] : [285, 195];
    p.push(halfRoundWall("会场前门与连廊侧门之间的连续弧墙", 9, .3, 5.5, [x, .4, 0], -starts[0]!, wallColor, Math.PI * 4 / 3), halfRoundWall("会场两入口之间另一段封合弧墙", 9, .3, 5.5, [x, .4, 0], -starts[1]!, wallColor, Math.PI / 3), cylinder("完整圆形会场的宽出檐屋面", x, 6.1, 0, 18.7, .25, dark), box("会场前方低位演讲台", x, .8, -3.2, 5.8, .8, 2.3, wood));
    for (let row = 0; row < 3; row++) p.push(halfRoundWall("面向演讲台逐级抬升的扇形观众阶台", 4.6 + row * 1.2, 1, .35 * (row + 1), [x, .4, 0], 0, wood));
    for (const z of [-7.2, 7.2]) p.push(box("连廊侧墙在会场侧门之外收头", side * 3.35, 2.65, z, .25, 4.5, 9.6, wallColor));
    p.push(part("连廊低顶与会场高顶之间的封合高窗", "box", colors.glass, [side * 3.35, 5.6, 0], [.08, .75, 4.8], [0, 0, 0], { opacity: .25 }));
  }
  p.push(box("中央连廊服务登记台", 0, 1.2, 8.8, 4.5, 1.1, .7, wallColor));
  return p;
}

function ridingHall(): ModelPart[] {
  const p: ModelPart[] = [box("骑术馆与马厩整体基础", 4.5, .1, 0, 35, .2, 48, paving), box("室内完整沙质训练地面", 0, .25, 0, 22, .1, 41.5, "#bfad84"), box("骑术馆西侧整体低墙", -12, 2.6, 0, .3, 4.8, 44, wallColor), doorway("骑术馆通向马厩通行廊的侧门", [12, .2, 0], 44, 4.8, 3.2, 90, 3.2), ...[-1, 1].map(side => doorway("骑术馆前后实际宽入口", [0, .2, side * 22], 24, 4.8, 3.6, 0, 3.5)), barrelRoof("覆盖整座骑术馆的连续筒拱屋盖", 12.25, .18, 44.3, [0, 5, 0], dark), box("马厩侧翼完整平屋盖", 17, 5.2, 0, 10.5, .2, 20.5, dark), box("马厩远侧连续外墙", 22, 2.6, 0, .25, 4.8, 20, wallColor), ...[-1, 1].map(side => box("马厩前后完整端墙", 17, 2.6, side * 10, 10, 4.8, .2, wallColor))];
  for (const side of [-1, 1]) p.push(part("封合筒拱两端的透明半圆高窗", "extrude", colors.glass, [0, 5, side * 22.05], [1, 1, 1], [0, 0, 0], { depth: .25, profile: Array.from({ length: 13 }, (_, i) => ({ x: Math.cos(i * Math.PI / 12) * 12.43, y: Math.sin(i * Math.PI / 12) * 12.43 })), opacity: .25 }), box("训练场两侧连续低位防护壁", side * 10.7, .95, 0, .16, 1.3, 39.5, wood));
  for (const z of [-18, 0, 18]) p.push(barrelRoof("承托筒拱屋面的独立实体拱肋", 12, .25, .25, [0, 5, z], wood));
  for (const z of [-6.65, 0, 6.65]) p.push(doorway("马厩每栏实际通向独立服务廊的门洞", [15, .2, z], 6.65, 3.2, 1.6, 90, 2.6));
  for (const z of [-10, -3.325, 3.325, 10]) p.push(box("马厩各独立栏位之间的实心隔墙", 18.5, 1.8, z, 7, 3.2, .16, wood));
  for (const side of [-1, 1]) for (const end of [-1, 1]) p.push(box("训练场端部留宽门口的防护壁", end * 6.25, .95, side * 20, 8.9, 1.3, .16, wood));
  return p;
}
