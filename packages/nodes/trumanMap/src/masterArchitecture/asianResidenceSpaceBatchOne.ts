import { beam, part, pitchedRoof, type ModelPart } from "../assetModelParts";
import { box, design, rail } from "./structures";

const wood = "#947659", darkWood = "#6a5947", stone = "#a2a797", wall = "#c0b493", tile = "#6b746b";

export const asianResidenceSpaceBatchOneDesigns = [design(
  "前廊半干栏吊脚木楼",
  "后半部依靠厚石台落地，前半部由双排长木脚悬起，内室前连接通长可行外廊与侧置登楼梯，底层斜撑与纵梁构成完整承重框架",
  () => stiltResidence(), "建筑", "中式",
)];

function stiltResidence(): ModelPart[] {
  const floorTop = 3.22;
  const parts: ModelPart[] = [
    box("后半部依坡落地的厚砌石台", 0, 1.51, 3.45, 9, 3.02, 2.1, stone),
    box("前后空间连续的木铺楼板", 0, 3.12, 0, 9, 0.2, 8.8, wood),
    box("前外廊与内室之间门口过梁", 0, 5.84, -1.35, 8.4, 0.7, 0.16, darkWood),
    box("内室前立面门洞左侧完整板壁", -2.5, 4.39, -1.35, 3.4, 2.34, 0.14, wall),
    box("内室前立面门洞右侧完整板壁", 2.5, 4.39, -1.35, 3.4, 2.34, 0.14, wall),
    box("内室后端窗下实板壁", 0, 3.75, 4.15, 8.4, 1.06, 0.15, wall),
    box("内室后端窗上实板壁", 0, 5.79, 4.15, 8.4, 0.8, 0.15, wall),
    box("后窗中间完整承重板柱", 0, 4.85, 4.15, 0.5, 1.1, 0.16, darkWood),
    box("后窗左端板柱", -3.6, 4.85, 4.15, 1.2, 1.1, 0.16, wall),
    box("后窗右端板柱", 3.6, 4.85, 4.15, 1.2, 1.1, 0.16, wall),
  ];
  for (const x of [-4, -1.35, 1.35, 4]) {
    for (const z of [-4.1, -1.3]) parts.push(
      box("长吊脚独立落地石墩", x, 0.1, z, 0.46, 0.2, 0.46, stone),
      box("前半楼承到楼板下的长木脚", x, 1.61, z, 0.24, 2.82, 0.24, darkWood),
    );
    const top = 6.14 - 0.12 + 1.74 * (1 - Math.abs(x) / 4.8);
    parts.push(box("从吊脚延续到前廊屋檐的整木立柱", x, (floorTop + top) / 2, -4.1, 0.19, top - floorTop, 0.19, darkWood));
  }
  for (const z of [-4.1, -1.3, 2.5]) parts.push(box("把长木脚与后石台接成整体的横向承梁", 0, 2.92, z, 9, 0.2, 0.22, darkWood));
  for (const side of [-1, 1]) {
    parts.push(
      box("沿吊脚楼两侧连续的纵向承梁", side * 4, 2.92, 0, 0.24, 0.2, 8.8, darkWood),
      beam("吊脚下层前后柱之间抗摆斜撑", darkWood, [side * 4, 0.62, -4.1], [side * 4, 2.88, -1.3], 0.13),
      box("前廊两侧的低位挡脚板", side * 4.3, floorTop + 0.12, -2.65, 0.1, 0.24, 3, wood),
      rail([side * 4.3, floorTop + 0.95, -4.1], [side * 4.3, floorTop + 0.95, -1.35], 0.09, darkWood),
      box("内室两侧从楼面接到纵向屋檐的木板壁", side * 4.15, 4.77, 1.4, 0.16, 3.1, 5.5, wall),
    );
  }
  const roof = pitchedRoof("深出檐双坡瓦顶覆盖内室与前外廊", tile, 9.6, 9.3, 6.14);
  roof.profile![1]!.y = 1.8;
  roof.profile![4]!.y = 1.62;
  roof.position.z = 0;
  // 此屋脊沿进深方向，屋面由两侧纵柱及前廊木柱共同托住。
  parts.push(roof, box("前廊柱顶连续承檐梁", 0, 6.09, -4.1, 8.5, 0.18, 0.2, darkWood));
  for (const z of [-1.35, 4.15]) parts.push(part("前后山墙实际贴合双坡屋顶底面的封板", "extrude", wall, [0, 0, z], [1, 1, 1], [0, 0, 0], { depth: 0.16, profile: [{ x: -4.2, y: 6.14 }, { x: 4.2, y: 6.14 }, { x: 4.2, y: 6.365 }, { x: 0, y: 7.94 }, { x: -4.2, y: 6.365 }] }));
  for (const x of [-3.6, -2.8, -2, -1.2, -0.4, 0.4, 1.2, 2]) parts.push(box("外廊面向下坡侧的独立木栏柱", x, floorTop + 0.46, -4.1, 0.065, 0.92, 0.065, wood));
  parts.push(rail([-4, floorTop + 0.95, -4.1], [2.3, floorTop + 0.95, -4.1], 0.09, darkWood));
  for (const x of [-3.6, 3.6]) parts.push(box("外廊栏端与入室门边的立柱", x, 4.68, -1.35, 0.18, 2.92, 0.18, darkWood));
  const steps = 16, rise = floorTop / steps, run = 0.28;
  for (let step = 0; step < steps; step++) parts.push(box("从地面登向前廊的独立木楼梯踏板", 3.25, (step + 1) * rise - 0.035, -8.74 + step * run, 1.15, 0.07, run, wood));
  for (const side of [-1, 1]) parts.push(
    beam("木楼梯两侧实际承托踏板的通长梯梁", darkWood, [3.25 + side * 0.46, 0.1, -8.88], [3.25 + side * 0.46, 3.14, -4.4], 0.14),
    rail([3.25 + side * 0.6, 1, -8.88], [3.25 + side * 0.6, floorTop + 0.9, -4.4], 0.07, darkWood),
  );
  parts.push(box("高梯口内侧扶手落到廊板的栏柱", 2.65, floorTop + 0.45, -4.35, 0.08, 0.9, 0.08, darkWood));
  return parts;
}
