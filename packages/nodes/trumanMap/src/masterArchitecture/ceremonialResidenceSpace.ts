import { part, pitchedRoof, type ModelPart } from "../assetModelParts";
import { box, cylinder, design } from "./structures";

const stone = "#a9ae9d", wood = "#8a684c", plaster = "#c6bda4", roofTile = "#64756a";

export const ceremonialResidenceSpaceDesigns = [design(
  "双进穿堂祭祀宗祠",
  "前享堂与抬高后祭堂沿同一中轴布置，侧廊经台阶连接两进堂屋并围住露天天井；前堂前后敞通，后堂牌位与祭案两侧保留绕行通路",
  () => ancestralHall(), "建筑", "中式",
)];

function hallParts(z: number, width: number, depth: number, floor: number, eave: number): ModelPart[] {
  const rise = width * 0.17;
  const roof = pitchedRoof("堂屋独立双坡瓦盖", roofTile, width + 0.8, depth + 0.8, eave);
  roof.profile![1]!.y = rise;
  roof.profile![4]!.y = rise - 0.18;
  roof.position.z = z;
  const parts: ModelPart[] = [
    box("石台整体承住木柱堂屋", 0, (floor + 0.18) / 2, z, width, floor - 0.18, depth, stone), roof,
    box("沿堂屋中轴托住屋面内脊的通长木梁", 0, eave + rise - 0.26, z, 0.22, 0.16, depth, wood),
  ];
  for (const side of [-1, 1]) parts.push(
    box("不堵塞穿堂中轴的两侧板壁", side * width / 2, (floor + eave + 0.05) / 2, z, 0.16, eave + 0.05 - floor, depth, plaster),
    box("堂屋前后柱列的通长承檐枋", 0, eave - 0.13, z + side * (depth / 2 - 0.3), width, 0.2, 0.22, wood),
  );
  for (const x of [-width / 2 + 0.5, -2.2, 2.2, width / 2 - 0.5]) for (const end of [-1, 1]) {
    const top = eave - 0.12 + (rise - 0.06) * (1 - Math.abs(x) / (width / 2 + 0.4));
    parts.push(cylinder("堂前后檐下实际接到屋面底部的木柱", x, (floor + 0.16 + top) / 2, z + end * (depth / 2 - 0.3), 0.24, top - floor - 0.16, wood));
    if (Math.abs(x) > 3) parts.push(cylinder("木柱下承压的独立石础", x, floor + 0.08, z + end * (depth / 2 - 0.3), 0.42, 0.16, stone));
  }
  return parts;
}

function ancestralHall(): ModelPart[] {
  const parts: ModelPart[] = [box("完整祠院与前院共用的石铺地坪", 0, 0.09, 0, 18, 0.18, 33, stone), ...hallParts(-8.5, 12.8, 7, 0.6, 6), ...hallParts(8, 13.6, 8, 1, 7.2)];
  parts.push(part("后祭堂封住脊下山墙的真实完整后壁", "extrude", plaster, [0, 0, 12], [1, 1, 1], [0, 0, 0], { depth: 0.2, profile: [{ x: -6.8, y: 1 }, { x: 6.8, y: 1 }, { x: 6.8, y: 7.328 }, { x: 0, y: 9.512 }, { x: -6.8, y: 7.328 }] }));
  for (const side of [-1, 1]) {
    parts.push(box("享堂与祭堂间真实可走的侧廊地台", side * 7, 0.39, -1, 2, 0.42, 8, stone), box("侧廊前后柱顶连续承檐木梁", side * 7, 3.68, -0.5, 2, 0.18, 9.6, wood));
    const roof = pitchedRoof("独立低檐侧廊瓦顶", roofTile, 2.4, 9.8, 3.8);
    roof.position.x = side * 7; roof.position.z = -0.5; parts.push(roof);
    for (const z of [-4.7, -2, 0.7, 3.5]) parts.push(cylinder("长侧廊屋檐下的连续承柱", side * 7, 2.14, z, 0.18, 3.08, wood));
    for (let step = 0; step < 2; step++) parts.push(box("侧廊尽端接上后祭堂的石阶", side * 7, 0.6 + (step + 1) * 0.1, 3.25 + step * 0.5, 2, (step + 1) * 0.2, 0.5, stone));
  }
  for (let step = 0; step < 3; step++) parts.push(box("天井中轴登后祭堂的完整宽石阶", 0, 0.18 + (step + 1) * (0.82 / 3) / 2, 3.1 + step * 0.36, 4, (step + 1) * 0.82 / 3, 0.36, stone));
  for (let step = 0; step < 2; step++) parts.push(box("前享堂入口的宽石踏步", 0, 0.18 + (step + 1) * 0.105, -12.54 + step * 0.36, 4, (step + 1) * 0.21, 0.36, stone));
  parts.push(box("后祭堂长祭案桌面", 0, 1.82, 10, 7, 0.16, 1, wood));
  for (const x of [-3.1, 3.1]) for (const z of [9.65, 10.35]) parts.push(box("祭案真实落到堂面的四个木足", x, 1.37, z, 0.12, 0.74, 0.12, wood));
  for (const x of [-1.8, 0, 1.8]) parts.push(box("长祭案后的独立竖向牌位陈设", x, 2.575, 10, 0.85, 1.35, 0.15, wood));
  parts.push(box("前享堂中部供案台面", 0, 1.38, -8.3, 4, 0.16, 0.85, wood), ...[-1, 1].map(side => box("供案台面下落地木侧足", side * 1.65, 0.95, -8.3, 0.16, 0.7, 0.7, wood)));
  for (const side of [-1, 1]) parts.push(box("祠院前门两侧不封死中轴的院墙", side * 5.1, 1.79, -14.7, 7.6, 3.22, 0.3, plaster), cylinder("前院门洞两侧的承门柱", side * 1.3, 2.13, -14.7, 0.28, 3.9, wood));
  parts.push(part("前院门洞上部接到小屋顶底部的承檐山面门枋", "extrude", wood, [0, 0, -14.7], [1, 1, 1], [0, 0, 0], { depth: 0.35, profile: [{ x: -1.5, y: 3.92 }, { x: 1.5, y: 3.92 }, { x: 1.5, y: 4.308 }, { x: 0, y: 4.85 }, { x: -1.5, y: 4.308 }] }));
  const entryRoof = pitchedRoof("前院正门独立小瓦顶", roofTile, 3.6, 2.3, 4.2); entryRoof.position.z = -14.7; parts.push(entryRoof);
  return parts;
}
