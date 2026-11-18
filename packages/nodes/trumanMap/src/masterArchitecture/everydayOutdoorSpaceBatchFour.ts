import { combineMeshes, tapered } from "../masterNature/shared";
import type { ModelPart, Triple } from "../assetModelParts";
import { box, colors, design } from "./structures";
import { boxBatch, hardPlan, profileBody } from "./everydayOutdoorSpaceBatchOne";

const paving = "#bdbba9", stone = "#a6afa2", metal = "#70877d";

export const everydayOutdoorSpaceBatchFourDesigns = [
  design("步入式旱喷公共广场", "可行走的完整旱喷地台通过四侧缓坡接入外围公共广场，真实喷孔贯穿厚地面并通向下方回水腔，独立承托格梁和喷口供水管留在台面下，细水柱为静态透明示意", () => {
    const outer: [number, number][] = [[-15, -15], [15, -15], [15, 15], [-15, 15]], inner: [number, number][] = [[-6.4, -6.4], [6.4, -6.4], [6.4, 6.4], [-6.4, 6.4]], parts: ModelPart[] = [hardPlan("旱喷地台外围完整贯通的公共步行广场", paving, outer, .2, [0, 0, 0], [inner]), box("整个回水腔下方完整落地且封底的连续基板", 0, .05, 0, 12.8, .1, 12.8, stone), box("台下回水腔内连续静态集水面", 0, .2, 0, 12.3, .03, 12.3, colors.water)], nozzles: ModelPart[] = [], pipes: ModelPart[] = [], jets: ModelPart[] = [], crossbeams: Triple[] = [];
    for (const side of [-1, 1]) parts.push(box("回水腔两侧实际接住旱喷地台边缘的连续腔墙", side * 6.3, .275, 0, .2, .35, 12.8, stone), box("回水腔前后封合并承托地台的连续腔墙", 0, .275, side * 6.3, 12.4, .35, .2, stone));
    for (const x of [-3.2, 0, 3.2]) crossbeams.push([x, .275, 0]);
    parts.push(...boxBatch("台面下分格承托厚地板的纵向梁", stone, crossbeams, [.12, .35, 12.4]), ...boxBatch("台面下与纵梁共同受力的横向梁", stone, crossbeams.map(([x, y]) => [0, y, x]), [12.4, .35, .12]));
    for (const sideX of [-1, 1]) for (const sideZ of [-1, 1]) {
      const centerX = sideX * 3.2, centerZ = sideZ * 3.2, holes: [number, number][][] = [];
      for (let row = 0; row < 4; row++) for (let column = 0; column < 4; column++) {
        const x = centerX - 2.4 + column * 1.6, z = centerZ - 2.4 + row * 1.6, r = .11;
        holes.push([[x - r, z - r], [x + r, z - r], [x + r, z + r], [x - r, z + r]]);
        const nozzle = hardPlan("喷孔内与可行走地面齐平且保留出水内孔的金属喷口", metal, [[-.11, -.11], [.11, -.11], [.11, .11], [-.11, .11]], .035, [x, .565, z], [[[-.052, -.052], [.052, -.052], [.052, .052], [-.052, .052]]]);
        nozzles.push(nozzle); pipes.push(tapered("从回水腔基板实际接托喷口下端的供水短立管", metal, [[x, .1, z], [x, .565, z]], [.08, .08]));
        const height = 1.05 + 1.85 * Math.max(0, 1 - Math.hypot(x, z) / 8), path: Triple[] = [[x, .6, z], [x, .6 + height * .9, z], [x, .6 + height, z]];
        jets.push(tapered("从各独立喷口向上形成细水柱的静态水体", colors.water, path, [.037, .027, .012]));
      }
      parts.push(hardPlan("拥有十六个真实贯穿喷孔的独立厚地台分板", paving, [[centerX - 3.2, centerZ - 3.2], [centerX + 3.2, centerZ - 3.2], [centerX + 3.2, centerZ + 3.2], [centerX - 3.2, centerZ + 3.2]], .15, [0, .45, 0], holes));
    }
    // ACT: 喷口保持真实空孔，各10个合480顶点；水柱和管道各18个合并，不把64个喷口拆作主素材。
    for (let offset = 0; offset < nozzles.length; offset += 10) parts.push(combineMeshes("真实空心喷口的合批网格", metal, nozzles.slice(offset, offset + 10)));
    for (let offset = 0; offset < pipes.length; offset += 18) parts.push(combineMeshes("台下供水短立管合批网格", metal, pipes.slice(offset, offset + 18)), { ...combineMeshes("多喷口透明静态细水柱合批网格", colors.water, jets.slice(offset, offset + 18)), opacity: .48, roughness: .08 });
    for (let side = 0; side < 4; side++) { const angle = side * Math.PI / 2; parts.push(profileBody("从外圈广场真正坡接可步入旱喷地台的完整缓坡", paving, [[0, .2], [4, .2], [4, .6]], 4, [-Math.cos(angle) * 10.4, 0, -Math.sin(angle) * 10.4], -angle * 180 / Math.PI)); }
    return parts;
  }, "设施", "现代"),
];
