import type { ModelPart } from "../assetModelParts";
import { polygon, tapered } from "../masterNature/shared";
import { plate } from "../masterObjects/parts";
import { woodWheel } from "./easternHorseCarriageBatchOne";
import { box, cylinder, transportColors, type TransportDefinition } from "./parts";

// 高出车盘的大轮把载台真正分成两边；不是已有前小轮平板手推车改名或换货。
// https://dyhhl.cn/Index/show/catid/34/id/294.html
// https://www.chnmuseum.cn/zp/zpml/201812/t20181218_24269.shtml

export const easternHorseCarriageBatchFive: TransportDefinition[] = [
  { name: "大轮中置双台鸡公车", theme: "中式", tags: ["影视", "人力货运车", "鸡公车", "中置承载独轮车", "双外挑载台与真实轮槽"], create: () => {
    const wood = transportColors.wood;
    const parts: ModelPart[] = [...woodWheel(0, 0, .65), cylinder("大轮中空车毂和两片承轴腹板共用的完整短轴", [0, .65, 0], [.09, .62, .09], transportColors.dark, [0, 0, 90]), box("只跨过大轮上方且保留轮缘净空的窄护轮顶", [0, 1.37, 0], [.47, .07, 1.55], wood)];
    const outline: [number, number][] = [[-.78, .53], [.78, .53], [.73, .64], [.18, .84], [.12, 1.04], [-.12, 1.04], [-.18, .84], [-.73, .64]];
    const hole = Array.from({ length: 12 }, (_, index): [number, number] => [Math.cos(-index * Math.PI / 6) * .052, .65 + Math.sin(-index * Math.PI / 6) * .052]);
    for (const side of [-1, 1]) {
      const cheek = polygon("把双台荷载引到中央轴孔的完整镂孔承轴腹板", wood, outline, .07, [0, 0, 0], [hole]);
      cheek.vertices = cheek.vertices!.map(point => ({ x: point.y - .035 + side * .215, y: point.z, z: point.x }));
      parts.push(cheek, box("位于大轮一侧且低于轮轴的独立外挑载台", [side * .56, .62, 0], [.55, .075, 1.8], wood), tapered("从两侧载台后端延伸而逐渐上弯的整根车把", wood, [[side * .28, .60, .62], [side * .36, .84, 1.45], [side * .38, .95, 2.1]], [.042, .04, .033]), box("停车时与大轮共同形成三点落地的独立撑脚", [side * .64, .26, .76], [.055, .52, .085], wood), box("外挑载台外侧接回前后枨的承载纵边梁", [side * .82, .60, 0], [.065, .11, 1.85], wood), cylinder("穿过承轴腹板外侧且防止短轴横移的立销", [side * .285, .65, 0], [.012, .16, .012], transportColors.dark));
      for (const z of [-.74, .74]) parts.push(box("跨过轮缘前后而从横枨直接承到护轮顶的短立柱", [side * .2, .985, z], [.045, .77, .045], wood));
    }
    for (const z of [-.75, .75]) parts.push(box("轮缘以外横接左右两块载台的连续承重横枨", [0, .56, z], [1.80, .08, .13], wood));
    parts.push(plate("挂在两只车把之间而能搭肩助推的完整宽车绊", [0, 0, 1.95], [[-.38, .97], [-.32, .91], [-.15, .76], [0, .71], [.15, .76], [.32, .91], [.38, .97], [.38, .91], [.32, .85], [.15, .70], [0, .65], [-.15, .70], [-.32, .85], [-.38, .91]], .006, "#655645", [0, 0, 0]));
    return parts;
  } },
];
