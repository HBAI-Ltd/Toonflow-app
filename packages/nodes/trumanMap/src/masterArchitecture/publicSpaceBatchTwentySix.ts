import { part, type ModelPart } from "../assetModelParts";
import { polygon } from "../masterNature/shared";
import { box, cylinder, design, colors } from "./structures";
import { doorway, standingPanel } from "./publicSpaceBatchOne";
import { boxesMesh, type SolidBox } from "./publicSpaceBatchEight";
import { restroomBasin, restroomBowl } from "./publicSpaceBatchThirteen";

const stone = "#b8b9ab", dark = "#52696c", ceramic = "#d4d9ce";

export const publicSpaceBatchTwentySixDesigns = [
  design("前檐错门条形公共厕站", "连续前檐提供开放洗手区，两侧真实折线门厅遮挡厕格视线，十二间独立厕格与中央两间家庭间分别通行；后部连续管线检修廊从两端独立进入，高低屋面之间保留真实高侧光窗，前后空间共同组成完整条形公共建筑", linearPublicRestroom, "建筑", "现代"),
];

function linearPublicRestroom(): ModelPart[] {
  const p: ModelPart[] = [box("公共厕站与前檐洗手场共同落地的完整基础", 0, .15, 0, 46, .3, 24, stone), polygon("前檐公共洗手区和三片独立卫生分区共同的地面饰层", "#b8ad97", [[-20, -9], [20, -9], [20, 9], [-20, 9]], .005, [0, .3, 0]), box("开放前檐完整连续雨棚", 0, 3.7, -6, 40.5, .2, 6.5, dark), box("折线门厅与家庭前室上方的独立低屋面", 0, 3.9, -1.6, 40.5, .2, 3.2, dark), box("独立厕格和后部检修廊共同的完整高屋面", 0, 4.625, 4.65, 40.5, .25, 9.3, dark), part("高低屋面之间真正闭合的连续高侧光窗", "box", colors.glass, [0, 4.25, 0], [40, .5, .05], [0, 0, 0], { opacity: .24 }), part("街面实际接到公共厕站前场的连续低坡", "extrude", stone, [0, 0, -14], [1, 1, 1], [0, -90, 0], { depth: 4, profile: [{ x: -2, y: 0 }, { x: 2, y: 0 }, { x: 2, y: .3 }, { x: -2, y: .02 }] })];
  const partitions: SolidBox[] = [], fixtures: SolidBox[] = [], taps: SolidBox[] = [], columns: SolidBox[] = [], panes: SolidBox[] = [];
  const front = [{ x: -20, y: 0 }];
  for (const [x, width] of [[-11.5, 1.8], [-1.5, 1.1], [1.5, 1.1], [11.5, 1.8]]) front.push({ x: x! - width! / 2, y: 0 }, { x: x! - width! / 2, y: 2.6 }, { x: x! + width! / 2, y: 2.6 }, { x: x! + width! / 2, y: 0 });
  front.push({ x: 20, y: 0 }, { x: 20, y: 3.5 }, { x: -20, y: 3.5 });
  p.push(part("两侧门厅与中央家庭间分别从公共前檐进入的真实四门立面", "extrude", stone, [0, .3, -3], [1, 1, 1], [0, 0, 0], { depth: .2, profile: front }));
  const rearWindows: [number, number][][] = [];
  for (const x of [-15, -5, 5, 15]) { rearWindows.push([[x - 4, 3.2], [x + 4, 3.2], [x + 4, 4.1], [x - 4, 4.1]]); panes.push({ center: [x, 3.65, 9], size: [8, .9, .05] }); }
  p.push(standingPanel("后检修廊上方真实高窗与隐私实墙共同的完整后立面", stone, [[-20, .3], [20, .3], [20, 4.5], [-20, 4.5]], rearWindows, 9, .24));
  for (const side of [-1, 1]) {
    const outer = standingPanel("完整侧墙沿高低屋面收头并独立开通后检修廊的真门", stone, [[-6, .3], [-5.6, .3], [-5.6, 2.8], [-4.4, 2.8], [-4.4, .3], [6, .3], [6, 3.8], [3, 3.8], [3, 4.5], [-6, 4.5]], [[[-5, 3.3], [2, 3.3], [2, 4.1], [-5, 4.1]]], 0, .24); outer.position.x = side * 20; outer.position.z = 3; outer.rotation.y = 90; p.push(outer); panes.push({ center: [side * 20, 3.7, 4.5], size: [.05, .8, 7] });
    const center = side * 11.5, opening = side * 5.5;
    const privacy = standingPanel("门厅前门与公共厕廊之间刻意错开的真实隐私门墙", stone, [[-8.5, .3], [opening - .7, .3], [opening - .7, 2.9], [opening + .7, 2.9], [opening + .7, .3], [8.5, .3], [8.5, 3.8], [-8.5, 3.8]], [], 0, .2); privacy.position.x = center; p.push(privacy);
    for (let room = 0; room < 6; room++) {
      const x = center - 8.5 + (room + .5) * 17 / 6;
      p.push(doorway("十二间独立厕格分别进入真实公共厕廊的门洞", [x, .3, 3], 17 / 6, 2.4, .9, 0, 2.05), restroomBowl("厕格内真实敞口并有内壁的独立便盆", x, .3, 5.8));
      fixtures.push({ center: [x, .85, 6.675], size: [.55, 1.1, .45] }, { center: [x, .56, 6.225], size: [.1, .1, .45] });
    }
    for (let wall = 1; wall < 6; wall++) partitions.push({ center: [center - 8.5 + wall * 17 / 6, 1.5, 5], size: [.12, 2.4, 4] });
  }
  for (const x of [-3, 0, 3]) partitions.push({ center: [x, 2.05, -1.5], size: [.16, 3.5, 3] }, { center: [x, 2.4, 3.5], size: [.16, 4.2, 7] });
  partitions.push({ center: [0, 1.5, 7], size: [40, 2.4, .2] });
  for (const x of [-1.5, 1.5]) {
    const opening = Math.sign(x) * .75, screen = standingPanel("家庭独立间前室和内厕之间真正错开的隐私门", stone, [[-1.5, .3], [opening - .5, .3], [opening - .5, 2.35], [opening + .5, 2.35], [opening + .5, .3], [1.5, .3], [1.5, 2.7], [-1.5, 2.7]], [], 1, .12); screen.position.x = x; p.push(screen, restroomBowl("家庭独立间内真实开口与内腔的便盆", x, .3, 5.8));
    fixtures.push({ center: [x, .85, 6.675], size: [.55, 1.1, .45] }, { center: [x, .56, 6.225], size: [.1, .1, .45] });
  }
  for (const [x, z] of [[-17, -5.5], [-6, -5.5], [6, -5.5], [17, -5.5], [-1.5, -1.3], [1.5, -1.3]]) {
    p.push(restroomBasin("公共前檐与家庭前室中具有真实内腔的独立洗手盆", x!, 1.2, z!), part("从地面真实承接盆底且内部保留通管腔的细柱盆座", "lathe", ceramic, [x!, .3, z!], [1, 1, 1], [0, 0, 0], { profile: [{ x: .08, y: 0 }, { x: .08, y: .65 }, { x: .04, y: .65 }, { x: .04, y: 0 }, { x: .08, y: 0 }] }));
    taps.push({ center: [x!, 1.3, z! + .22], size: [.04, .2, .04] }, { center: [x!, 1.41, z! + .08], size: [.04, .04, .32] });
  }
  for (const x of [-19.5, -8, 8, 19.5]) columns.push({ center: [x, 1.85, -8.5], size: [.2, 3.1, .2] });
  columns.push({ center: [0, 3.5, -8.5], size: [40, .2, .25] });
  p.push(cylinder("后检修廊内沿整栋连续布置并接入两端墙体的公共给水管", 0, 3, 8.65, .16, 40, dark, [0, 0, 90]));
  for (const x of [-18, -9, 0, 9, 18]) taps.push({ center: [x, 3, 8.75], size: [.12, .08, .3] });
  for (const [name, color, values] of [["各独立厕格和家庭间真实落地并接入后湿墙的连续隔墙", stone, partitions], ["各便盆与后湿墙实际相接的背箱和短连接管", ceramic, fixtures], ["细柱盆座上实际贴合盆沿的出水臂和后廊管托", dark, taps], ["开放前檐真正落地并承接整片雨棚的柱梁", dark, columns]] as [string, string, SolidBox[]][]) for (let start = 0; start < values.length; start += 18) p.push(boxesMesh(name, color, values.slice(start, start + 18)));
  const glass = boxesMesh("完整厕站高侧窗和后检修廊真实窗孔内的独立玻璃", colors.glass, panes); glass.opacity = .24; p.push(glass);
  return p;
}
