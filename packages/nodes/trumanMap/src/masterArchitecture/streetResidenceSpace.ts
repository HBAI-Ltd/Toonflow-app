import { part, pitchedRoof, type ModelPart } from "../assetModelParts";
import { box, design, rail } from "./structures";

const plaster = "#c3bc9f", timber = "#806a50", roofTile = "#756e61", stone = "#a5aaa0";

// 构造依据：URA Understanding the Shophouse，公共骑廊与中段敞口天井。
// https://www.ura.gov.sg/conservation/conservation-resources/understanding-the-shophouse/
// 为原创简化空间原型，不复刻特定历史建筑或声称尺寸满足现行建筑规范。
export const streetResidenceSpaceDesigns = [design(
  "五脚基骑廊天井街屋",
  "街面两柱承住公共步廊上方的二层，长进深店居由敞口天井分成前后两段，折返楼梯沿天井一侧连接楼面，骑廊可横向连续穿行",
  () => shophouse(), "建筑", "中式",
)];

function shophouse(): ModelPart[] {
  const parts: ModelPart[] = [
    box("店居长进深落地基础", 0, 0.08, 1, 5.2, 0.16, 14, stone),
    box("与两侧相邻街屋衔接的公共五脚基步廊", 0, 0.04, -7, 5.2, 0.08, 2.2, stone),
    box("前段铺面上方并覆盖公共步廊的二层楼面", 0, 3.8, -3.6, 5, 0.12, 8.4, timber),
    box("跨过天井后独立的后段居室二层楼面", 0, 3.8, 5.75, 5, 0.12, 4.3, timber),
    box("二层前侧沿墙接到楼梯口的窄走廊", 2.15, 3.8, 2.1, 0.7, 0.12, 3, timber),
    box("折返梯上下两跑之间的休息平台", 1.2, 1.95, 2.85, 2.1, 0.12, 0.36, timber),
    box("天井后段地层门洞上方过梁", 0, 3.1, 3.6, 5, 0.36, 0.18, plaster),
    box("前铺向天井敞开的上层门洞过梁", 0, 6.55, 0.6, 5, 0.7, 0.18, plaster),
    box("后居向天井敞开的上层门洞过梁", 0, 6.55, 3.6, 5, 0.7, 0.18, plaster),
    box("地面店铺的开放街面门楣", 0, 3.45, -5.95, 5, 0.46, 0.22, plaster),
    box("骑廊前沿托住上部街面墙的通长梁", 0, 3.57, -7.85, 5.2, 0.34, 0.32, plaster),
    box("骑廊二层窗下实墙", 0, 4.19, -7.85, 5, 0.66, 0.22, plaster),
    box("骑廊二层窗上实墙", 0, 6.6, -7.85, 5, 0.6, 0.22, plaster),
    box("分隔街面两个真实窗洞的墙墩", 0, 5.4, -7.85, 0.65, 1.8, 0.22, plaster),
    box("后居地层后门上方墙体", 0, 3.25, 7.95, 5, 0.72, 0.18, plaster),
    box("后居二层窗下实墙", 0, 4.3, 7.95, 5, 0.88, 0.18, plaster),
    box("后居二层窗上实墙", 0, 6.55, 7.95, 5, 0.7, 0.18, plaster),
  ];
  for (const side of [-1, 1]) {
    parts.push(
      box("把二层荷载传到骑廊外侧的独立街柱", side * 2.3, 1.83, -7.85, 0.3, 3.66, 0.35, plaster),
      part("包含骑廊上层挑出段及前后屋面山墙的完整共用侧墙", "extrude", plaster, [side * 2.5, 0, 0], [1, 1, 1], [0, 90, 0], { depth: 0.22, profile: [[-7.85, 3.8], [-5.95, 3.8], [-5.95, 0.1], [8, 0.1], [8, 6.954], [5.8, 7.55], [3.4, 6.9], [0.9, 6.9], [-3.5, 7.55], [-7.85, 6.907]].map(([z,y]) => ({ x: -z!, y: y! })) }),
      box("铺面大开口两侧的实墙垛", side * 2.3, 1.7, -5.95, 0.4, 3.1, 0.22, plaster),
      box("街面上层窗洞外侧墙墩", side * 2.27, 5.4, -7.85, 0.46, 1.8, 0.22, plaster),
      box("天井前后楼面开敞界面的端墙垛", side * 2.32, 5.05, 0.6, 0.36, 2.38, 0.18, plaster),
      box("天井后楼面开敞界面的端墙垛", side * 2.32, 5.05, 3.6, 0.36, 2.38, 0.18, plaster),
      box("后居地层实墙在门洞两侧保留通路", side * 1.65, 1.52, 7.95, 1.7, 2.72, 0.18, plaster),
      box("后居二层窗洞两侧墙垛", side * 1.9, 5.38, 7.95, 1.2, 1.3, 0.18, plaster),
      box("地层天井后入口两侧墙垛", side * 1.7, 1.6, 3.6, 1.6, 2.7, 0.18, plaster),
    );
    for (let slat = 0; slat < 4; slat++) parts.push(box("窗洞内可透视的木百叶片", side * 1.3, 4.7 + slat * 0.43, -7.86, 1.35, 0.12, 0.13, timber));
  }
  const rise = 3.7 / 18;
  for (let step = 0; step < 9; step++) {
    parts.push(
      box("天井靠墙第一跑独立木踏板", 1.75, 0.16 + (step + 1) * rise - 0.03, 0.72 + step * 0.23, 0.85, 0.06, 0.23, timber),
      box("天井折返第二跑独立木踏板", 0.65, 2.01 + (step + 1) * rise - 0.03, 2.56 - step * 0.23, 0.85, 0.06, 0.23, timber),
    );
  }
  parts.push(
    rail([1.26, 1.12, 0.6], [1.26, 2.97, 2.68], 0.055, timber),
    rail([0.16, 2.97, 2.68], [0.16, 4.82, 0.6], 0.055, timber),
    box("第一跑梯口扶手立柱", 1.26, 0.65, 0.6, 0.065, 1.1, 0.065, timber),
    box("折返梯平台扶手立柱", 0.16, 2.49, 2.9, 0.065, 0.96, 0.065, timber),
    box("二层梯口扶手立柱", 0.16, 4.34, 0.6, 0.065, 0.96, 0.065, timber),
    rail([-2.1, 4.8, 0.6], [-0.05, 4.8, 0.6], 0.065, timber),
    rail([-2.1, 4.8, 3.6], [1.8, 4.8, 3.6], 0.065, timber),
  );
  for (const side of [-1, 1]) parts.push(
    rail([1.75 + side * 0.35, 0.18, 0.6], [1.75 + side * 0.35, 1.98, 2.675], 0.12, timber),
    rail([0.65 + side * 0.35, 1.98, 2.675], [0.65 + side * 0.35, 3.83, 0.6], 0.12, timber),
    box("中间休息平台的落地承重木柱", 1.2 + side * 0.9, 1.025, 2.85, 0.12, 1.73, 0.12, timber),
  );
  for (const [depth, z] of [[8.8, -3.5], [4.8, 5.8]]) {
    const roof = pitchedRoof("天井前后分段双坡瓦顶不覆盖采光通风口", roofTile, depth!, 5.5, 6.9);
    roof.position.z = z!;
    roof.rotation.y = 90;
    parts.push(roof);
  }
  // 上层沿井通廊外侧护栏，栏脚直接接住楼板，留出梯口通行。
  for (const z of [1.05, 2.05, 3.05]) parts.push(box("天井窄走廊面向井口的护栏柱", 1.82, 4.34, z, 0.065, 0.96, 0.065, timber));
  parts.push(rail([1.82, 4.8, 0.65], [1.82, 4.8, 3.55], 0.065, timber));
  return parts;
}
