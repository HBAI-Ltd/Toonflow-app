import type { ModelPart } from "../assetModelParts";
import { glazedWall } from "./modernResidenceSpaceBatchOne";
import { boxesMesh, type SolidBox } from "./publicSpaceBatchEight";
import { stairFlight } from "./publicSpaceBatchSteps";
import { box, cylinder, design, rail, type ArchitecturePrototype } from "./structures";
import { hardFloor } from "./vernacularWorldBatchSix";

const paving = "#b7bcaf", timber = "#aa906b", roofColor = "#748b86", dark = "#526b68", cabinetColor = "#b2bcb1";

export const everydayDiningSpaceBatchFourDesigns: ArchitecturePrototype[] = [
  design("岸接双桥折台桩脚餐厅", "岸上长厨房与独立入口厅分别通过工作桥和顾客桥接入桩架上的Z形封闭餐厅，两段错向餐堂经中部真实颈廊连续通行；全部桩梁支承实体甲板，两条岸后实阶分别接送货门和客门，桥栏与低雨盖完整连接两岸建筑", watersideZigzagRestaurant, "建筑", "现代"),
];

function watersideZigzagRestaurant(): ModelPart[] {
  const deck: [number, number][] = [[-12, -7], [0, -7], [0, -4], [2, -4], [2, 1], [12, 1], [12, 7], [0, 7], [0, 4], [-2, 4], [-2, -1], [-12, -1]];
  const cover: [number, number][] = [[-12.35, -7.35], [.35, -7.35], [.35, -4.35], [2.35, -4.35], [2.35, .65], [12.35, .65], [12.35, 7.35], [-.35, 7.35], [-.35, 4.35], [-2.35, 4.35], [-2.35, -.65], [-12.35, -.65]];
  const parts: ModelPart[] = [
    box("岸上长厨与入口厅共同的完整实心岸基", 0, .8, 12, 18.8, 1.6, 6.6, paving),
    hardFloor("由实桩梁承住且两段餐堂和颈廊连续闭合的Z形甲板", timber, deck, .2, [0, 1.4, 0]),
    hardFloor("沿错向两餐堂和中颈廊实际闭合的整体Z形屋盖", roofColor, cover, .24, [0, 5, 0]),
    box("岸上长厨与入口厅由四面承墙封合的完整高屋盖", 0, 5.61, 12, 19, .22, 6.6, roofColor),
    stairFlight("岸后地面实际进入独立顾客厅的八级实体客阶", 7, 0, 18.2, 2.4, 8, .2, .4, true),
    stairFlight("岸后地面实际进入长厨房的八级独立送货阶", -6.5, 0, 18.2, 2.2, 8, .2, .4, true),
    ...glazedWall("岸楼后壁分别接两条实阶的顾客门和送货门", [-9, 15], [9, 15], 1.6, 5.5, [[0, 2.7, 6.7, 1.5]], [[-6.5, 1.6, 1.5, 2.6], [7, 1.6, 1.6, 2.6]]),
    ...glazedWall("岸楼前壁将厨工与顾客分别导向两座独立桥门", [-9, 9], [9, 9], 1.6, 5.5, [[-4.7, 2.7, 5.6, 1.5]], [[2, 1.6, 1.2, 2.6], [7, 1.6, 1.6, 2.6]]),
    ...glazedWall("岸上厨房完整西端高窗承墙", [-9, 9], [-9, 15], 1.6, 5.5, [[0, 2.7, 3.8, 1.5]]),
    ...glazedWall("顾客入口厅独立东端真实高窗承墙", [9, 9], [9, 15], 1.6, 5.5, [[0, 2.7, 3.8, 1.5]]),
    ...glazedWall("长厨房与顾客入口厅真正隔开且只留员工工作门的内墙", [4, 9], [4, 15], 1.6, 5.5, [], [[0, 1.6, 1.1, 2.6]]),
    ...glazedWall("右餐堂靠岸长墙真实分别接入工作桥和顾客桥", [0, 7], [12, 7], 1.6, 5, [[-1.5, 2.5, 1.7, 1.6], [4.2, 2.5, 1.7, 1.6]], [[-4, 1.6, 1.2, 2.6], [1, 1.6, 1.6, 2.6]]),
  ];
  const wallEdges: [[number, number], [number, number]][] = [[[-12, -7], [0, -7]], [[0, -7], [0, -4]], [[0, -4], [2, -4]], [[2, -4], [2, 1]], [[2, 1], [12, 1]], [[12, 1], [12, 7]], [[0, 7], [0, 4]], [[0, 4], [-2, 4]], [[-2, 4], [-2, -1]], [[-2, -1], [-12, -1]], [[-12, -1], [-12, -7]]];
  for (const [start, end] of wallEdges) {
    const length = Math.hypot(end[0] - start[0], end[1] - start[1]);
    parts.push(...glazedWall("错向餐堂与中颈廊沿完整外轮廓真正连续开窗的承屋墙", start, end, 1.6, 5, [[0, 2.45, Math.max(1, length - 1.25), 1.65]]));
  }
  const beams: SolidBox[] = [], posts: SolidBox[] = [], furniture: SolidBox[] = [], cabinets: SolidBox[] = [];
  for (const [x, z] of [[-11, -6], [-6, -6], [-1, -6], [-11, -2], [-6, -2], [-1, -2], [-1, 1], [1, 1], [1, 6], [6, 2], [11, 2], [6, 6], [11, 6]]) parts.push(cylinder("嵌地支承甲板横梁而不悬空的独立承重桩", x!, .6, z!, .3, 1.2, dark));
  for (const [x, z, width, depth] of [[-6, -6, 10.3, .22], [-6, -2, 10.3, .22], [6, 2, 10.3, .22], [6, 6, 10.3, .22], [-1, -.5, .22, 3], [1, 3.5, .22, 5]]) beams.push({ center: [x!, 1.3, z!], size: [width!, .2, depth!] });
  for (const [x, width] of [[2, 2], [7, 2.4]]) {
    parts.push(box("将岸上门槛与桩架餐堂门槛同高接通的独立桥面", x!, 1.5, 7.85, width!, .2, 1.7), box("两座独立桥分别避让门口的完整低雨盖", x!, 4.68, 8, width! + .4, .16, 2.35, roofColor));
    for (const side of [-1, 1]) {
      parts.push(rail([x! + side * (width! / 2 - .09), 2.66, 7.1], [x! + side * (width! / 2 - .09), 2.66, 8.9], .055, dark));
      for (const z of [7.1, 8.9]) posts.push({ center: [x! + side * (width! / 2 - .09), 3.1, z], size: [.11, 3, .11] });
    }
    beams.push({ center: [x!, 1.3, 7.5], size: [width! - .2, .2, 3.2] });
  }
  for (const [x, width] of [[7, 2.4], [-6.5, 2.2]]) for (const side of [-1, 1]) {
    const railX = x! + side * (width! / 2 - .06);
    parts.push(rail([railX, 1.2, 18.1], [railX, 2.6, 15.1], .055, dark));
    posts.push({ center: [railX, .7, 18.1], size: [.06, 1, .06] }, { center: [railX, 2.1, 15.1], size: [.06, 1, .06] });
  }
  for (const [x, z] of [[-9, -4], [-4, -4], [4, 4], [9, 4]]) {
    furniture.push({ center: [x!, 2.4, z!], size: [1.5, .1, 1.4] }, { center: [x!, 1.975, z!], size: [.18, .75, .8] });
    for (const side of [-1, 1]) furniture.push({ center: [x! + side * 1.22, 1.825, z!], size: [.55, .45, 1.8] }, { center: [x! + side * 1.47, 2.25, z!], size: [.11, .8, 1.8] });
  }
  cabinets.push({ center: [-4, 2.11, 12], size: [5, 1.02, 1.1] }, { center: [5, 2.11, 14], size: [1.2, 1.02, .7] });
  furniture.push({ center: [-4, 2.66, 12], size: [5.1, .08, 1.2] }, { center: [5, 2.66, 14], size: [1.3, .08, .8] });
  beams.push({ center: [-6, 4.84, -6.5], size: [12.6, .32, .22] }, { center: [-5, 4.84, -1.5], size: [14.5, .32, .22] }, { center: [5, 4.84, 1.5], size: [14.5, .32, .22] }, { center: [6, 4.84, 6.5], size: [12.6, .32, .22] });
  beams.push({ center: [0, 5.34, 12], size: [18.6, .32, .22] });
  parts.push(boxesMesh("承重桩与完整甲板之间以及屋盖下方真正接实的长梁", dark, beams), boxesMesh("独立双桥护栏与雨盖实际落在桥面上的全高立柱", dark, posts), boxesMesh("岸上厨房与入口厅实际落地的工作柜", cabinetColor, cabinets));
  for (let offset = 0; offset < furniture.length; offset += 20) parts.push(boxesMesh("两段餐堂桌座及岸上台面保留门口与颈廊的通路", timber, furniture.slice(offset, offset + 20)));
  return parts;
}
