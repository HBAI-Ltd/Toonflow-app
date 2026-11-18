import { part, type ModelPart } from "../assetModelParts";
import { polygon } from "../masterNature/shared";
import { box, cylinder, design, pipe, colors, type ArchitecturePrototype } from "./structures";
import { doorway } from "./publicSpaceBatchOne";
import { openingWall, holesAt } from "./periodPublicSpaceBatchOne";
import { verticalPanel } from "./historicSpaceBatchNine";
import { stairFlight } from "./historicSpaceBatchSeven";
import { boxesMesh, type SolidBox } from "./publicSpaceBatchEight";

const wall = "#bbb8a7", paving = "#aaa995", iron = "#56696b", wood = "#a08a67", mat = "#899e98";

export const everydayRecreationSpaceBatchThreeDesigns: ArchitecturePrototype[] = [
  design("凹门低翼灯笼顶拳击健身会馆", "临街两间低更衣接待翼夹出凹门雨庭，贯通中廊接到后方通高训练厅；四根真正落地的灯笼顶承柱支住长梁和透光高窗，拳台四周留环行通道，侧后独立门可绕过拳台疏散", boxingClub, "建筑", "现代"),
];

function boxingClub(): ModelPart[] {
  const p: ModelPart[] = [
    box("前部低翼、凹入雨庭与后方高厅共同的完整基础", 0, .1, 2, 23, .2, 26, paving),
    doorway("凹进低翼之间而真正连通前雨庭的公共入口", [0, .2, -8.5], 4, 3.4, 2.4),
    doorway("接待中廊与后部高训练厅真正贯通的宽内门", [0, .2, -4], 16, 4.6, 3, 0, 2.8),
    doorway("训练厅后方真正绕开拳台的独立通行后门", [0, .2, 14], 16, 4.6, 1.8),
    box("低侧翼与中央门廊共同封合并由外围墙接承的平屋盖", 0, 3.7, -7, 22.3, .2, 6.3, iron),
    polygon("通高训练厅完整屋面真正围出中央灯笼顶光井", iron, [[-8.15, -4.15], [8.15, -4.15], [8.15, 14.15], [-8.15, 14.15]], .2, [0, 4.8, 0], [[[-3.6, -2], [3.6, -2], [3.6, 12], [-3.6, 12]]]),
    box("由四角承柱和连续高梁真正承住的中央采光顶盖", 0, 6.21, 5, 7.5, .22, 14.3, iron),
    box("拳台侧保留一整条独立通行道的地面练习软垫", 5.9, .235, 5, 2.6, .07, 10, mat),
    box("拳台实际钢框上方的完整承重木甲板", 0, .93, 5.1, 7.2, .14, 7.2, wood),
    box("完整接在木甲板上表面的连续拳击软台面", 0, 1.01, 5.1, 7.2, .02, 7.2, mat),
    stairFlight("从训练地坪真实升到拳台前沿的独立宽阶", 4, 1.4, .82, .3, 0, [0, .2, .3], -90),
    box("沙袋悬链上方真正搭接到横向承梁的独立长钢轨", -5.8, 4.56, 5, .1, .1, 14, iron),
    box("进入会馆后落在右侧且让开中廊的接待工作柜", 1.35, .68, -5.6, .8, .96, 1.2, wood),
    box("接待工作柜真正承住的连续薄台面", 1.35, 1.19, -5.6, .94, .06, 1.3, iron),
  ];
  const frame: SolidBox[] = [], posts: SolidBox[] = [], benches: SolidBox[] = [];
  for (const side of [-1, 1]) {
    p.push(openingWall("临街低翼真正开透两窗的完整前外墙", 9, 3.4, holesAt([-2.2, 2.2], 2.2, 1.3, 1.2), [side * 6.5, .2, -10], 0, wall), openingWall("更衣翼外端真正封合且留采光孔的完整侧墙", 6, 3.4, holesAt([0], 2.2, 1.3, 1.2), [side * 11, .2, -7], 90, wall), box("低侧翼后墙与高训练厅前端真正闭合的短实墙", side * 9.5, 1.9, -4, 3, 3.4, .3, wall), doorway("中廊两侧各自真正接入更衣分室的独立门洞", [side * 2, .2, -7], 6, 3.4, 1.1, 90, 2.4));
    for (const offset of [-2.2, 2.2]) p.push(part("低翼前墙真实窗孔中的独立玻璃", "box", colors.glass, [side * 6.5 + offset, 2.05, -10], [2.2, 1.3, .035], [0, 0, 0], { opacity: .28, roughness: .14 }));
    p.push(part("更衣翼外端窗孔内真正镶入的薄玻璃", "box", colors.glass, [side * 11, 2.05, -7], [.035, 1.3, 2.2], [0, 0, 0], { opacity: .28, roughness: .14 }));
    const outline: [number, number][] = [[-9, 0], [-5.7, 0], [-5.7, 2.5], [-4.3, 2.5], [-4.3, 0], [9, 0], [9, 4.6], [-9, 4.6]];
    p.push(verticalPanel("高训练厅侧墙实际留出独立侧门与高窗的完整围护", outline, holesAt([0, 5], 3.1, 1.5, 1.9), .3, [side * 8, .2, 5], 90, wall));
    for (const z of [0, 5]) p.push(part("训练厅侧墙真实窗洞内的独立采光玻璃", "box", colors.glass, [side * 8, 2.85, z], [.035, 1.5, 3.1], [0, 0, 0], { opacity: .27, roughness: .14 }));
    p.push(part("中央高顶侧面真正透光而非封死的连续窗带", "box", colors.glass, [side * 3.6, 5.55, 5], [.035, 1.1, 14], [0, 0, 0], { opacity: .26, roughness: .14 }), box("四角高柱之间真正承托两侧普通屋盖的纵向梁", side * 3.6, 4.55, 5, .22, .5, 14.2, iron), box("高窗顶端实际接住完整顶盖的连续纵梁", side * 3.6, 5.9, 5, .22, .4, 14.2, iron));
    for (const z of [-2, 12]) p.push(box("由地面直接接到高顶盖而不悬空的独立整高承柱", side * 3.6, 3.15, z, .22, 5.9, .22, iron));
    for (const z of [-2, 5, 12]) p.push(box("从外侧整墙接到中央纵梁且支住侧屋面的横梁", side * 5.8, 4.7, z, 4.4, .2, .18, iron));
    for (const z of [-2, 1.5, 5, 8.5, 12]) posts.push({ center: [side * 3.6, 5.55, z], size: [.065, 1.1, .065] });
    benches.push({ center: [side * 8, .67, -7], size: [3.8, .08, .6] }, ...[-1, 1].map(end => ({ center: [side * 8 + end * 1.5, .415, -7] as [number, number, number], size: [.18, .43, .45] as [number, number, number] })));
  }
  for (const z of [-2, 12]) p.push(part("中央灯笼顶前后端真正封合的薄采光窗", "box", colors.glass, [0, 5.55, z], [7.2, 1.1, .035], [0, 0, 0], { opacity: .26, roughness: .14 }), box("灯笼顶前后端真正把两列高柱连在一起的横梁", 0, 5.9, z, 7.4, .4, .22, iron));
  p.push(boxesMesh("连续高窗之间实际连接上下边梁的独立窗间杆", iron, posts), boxesMesh("更衣分室中真正接地并托住长坐板的固定整理凳", wood, benches));
  for (const side of [-1, 1]) {
    for (const end of [-1, 1]) frame.push({ center: [side * 3, .53, 5.1 + end * 3], size: [.22, .66, .22] });
    frame.push({ center: [side * 3, .8, 5.1], size: [.18, .12, 6.2] }, { center: [0, .8, 5.1 + side * 3], size: [6.2, .12, .18] });
  }
  for (const z of [2.5, 5.1, 7.7]) frame.push({ center: [0, .8, z], size: [6, .12, .14] });
  p.push(boxesMesh("钢框周梁横撑与承脚共同接承整块拳台甲板", iron, frame));
  for (const side of [-1, 1]) for (const end of [-1, 1]) p.push(cylinder("穿过台面并接在下方钢框上的真实拳台角柱", side * 3, 1.65, 5.1 + end * 3, .09, 1.66, iron), box("角柱上真实相接且覆盖绳端的独立护角软垫", side * 3, 1.86, 5.1 + end * 3, .18, .94, .18, side < 0 ? "#aa746a" : "#718d9c"));
  for (const y of [1.36, 1.68, 2, 2.32]) for (const side of [-1, 1]) p.push(pipe("角柱之间真正相接的横向拳台围绳", [-3, y, 5.1 + side * 3], [3, y, 5.1 + side * 3], .025), pipe("角柱之间真正相接的纵向拳台围绳", [side * 3, y, 2.1], [side * 3, y, 8.1], .025));
  for (const z of [0, 5, 10]) p.push(part("真正由上方钢轨悬链吊住的圆端训练重沙袋", "capsule", "#807a6d", [-5.8, 1.75, z], [.76, 1.4, .76]), pipe("上端进入钢轨而下端接到沙袋顶部的承重悬链", [-5.8, 4.53, z], [-5.8, 2.45, z], .015));
  return p;
}
