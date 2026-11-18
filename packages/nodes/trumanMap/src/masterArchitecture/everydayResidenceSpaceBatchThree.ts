import type { ModelPart, Triple } from "../assetModelParts";
import { combineMeshes } from "../natureParts";
import { glazedWall } from "./modernResidenceSpaceBatchOne";
import { waistStair } from "./publicSpaceBatchFourteen";
import { solidBox } from "./vernacularWorldBatchThree";
import { meshBeam } from "./vernacularWorldBatchFive";
import { box, design } from "./structures";

const stone = "#afb4a8", timber = "#a08a6b", pale = "#d2cabb", fabric = "#99aa9e", steel = "#6b8581";

function galleryWalkupApartment(): ModelPart[] {
  const parts: ModelPart[] = [box("公寓主楼外廊与转角共梯共同落地的完整基础", -2, .11, -.7, 22, .22, 11), box("两户之间由地面贯通到屋盖的完整分户承重墙", 0, 4.7, 0, .24, 8.8, 8, pale), box("三层公寓完整封合的薄平屋盖", 0, 9.2, 0, 14.7, .2, 8.7, steel)];
  const flightGuards: ModelPart[] = [], landingGuards: ModelPart[] = [], furniture: Record<string, ModelPart[]> = { [timber]: [], [pale]: [], [fabric]: [], [stone]: [] };
  const furnish = (name: string, color: string, x: number, y: number, z: number, w: number, h: number, d: number) => furniture[color]!.push(solidBox(name, x, y, z, w, h, d, color));
  for (let level = 0; level < 3; level++) {
    const y = .3 + level * 3, guards: ModelPart[] = [];
    parts.push(box("两户完整客卧厨卫共用同层承托的住宅楼板", 0, y - (level ? .1 : .04), 0, 14, level ? .2 : .08, 8, timber), box("从转角共梯连续横行到两户门前的完整外廊楼板", -1.9, y - (level ? .1 : .04), -4.45, 18.4, level ? .2 : .08, 2.3, stone));
    parts.push(
      ...glazedWall("外廊前沿保留两户独立入户门与起居窗的完整立面", [-7, -4], [7, -4], y, y + 2.8, [[-2.1, y + .85, 2.4, 1.6], [4.9, y + .85, 2.4, 1.6]], [[-5.9, y, .95, 2.15], [1.1, y, .95, 2.15]]),
      ...glazedWall("每户后卧与卫浴各自真实采光的完整后立面", [7, 4], [-7, 4], y, y + 2.8, [[5, y + .85, 2.4, 1.6], [1.5, y + 1.7, 1.1, .75], [-2, y + .85, 2.4, 1.6], [-5.5, y + 1.7, 1.1, .75]]),
      ...glazedWall("西端起居与后卧室各自透光的封合端壁", [-7, 4], [-7, -4], y, y + 2.8, [[-2, y + .85, 1.8, 1.6], [2, y + .85, 1.8, 1.6]]),
      ...glazedWall("东端起居与后厨各自透光的封合端壁", [7, -4], [7, 4], y, y + 2.8, [[-2, y + .85, 1.8, 1.6], [1, y + 1.05, 1.2, 1.3]]),
    );
    for (const start of [-7, 0]) {
      parts.push(...glazedWall("每户起居厅分别通往卧室与后厨的两座真实内门", [start, 0], [start + 7, 0], y, y + 2.8, [], [[-1.5, y, .85, 2.1], [2, y, .85, 2.1]]), ...glazedWall("每户卧室与厨卫服务带之间完整的分隔承壁", [start + 4, 0], [start + 4, 4], y, y + 2.8, []), ...glazedWall("每户后厨进入独用卫浴的真实门与隔墙", [start + 4, 2], [start + 7, 2], y, y + 2.8, [], [[0, y, .75, 2.1]]));
      furnish("每户后卧室内实际落地的独立床架", timber, start + 2, y + .2, 2.25, 1.6, .4, 2.1); furnish("独立床架上贴合的完整织物床垫", pale, start + 2, y + .46, 2.25, 1.56, .12, 2.06); furnish("卧室床后实际接地的完整床头板", timber, start + 2, y + .62, 3.3, 1.65, 1.24, .12);
      furnish("每户起居厅侧墙前实际落地的完整长沙发座", fabric, start + 6.15, y + .22, -2.2, 1.1, .44, 2.3); furnish("长沙发座后沿相接的软靠背", fabric, start + 6.62, y + .64, -2.2, .16, .9, 2.3); furnish("每户起居厅餐桌自地面承起的完整宽脚", timber, start + 3.2, y + .37, -1.8, .5, .74, .6); furnish("餐桌宽脚上方实际贴合的薄桌面", stone, start + 3.2, y + .78, -1.8, 1.3, .08, .9);
      furnish("每户后厨沿端墙实际落地的长地柜", timber, start + 6.6, y + .42, 1.1, .6, .84, 1.4); furnish("后厨长地柜上贴合的连续操作台", stone, start + 6.6, y + .88, 1.1, .65, .08, 1.45); furnish("每户后厨避开门洞的完整冰箱箱身", pale, start + 4.7, y + .93, .7, .65, 1.86, .7);
      furnish("每户卫浴后角与楼板实际接触的坐便支座", pale, start + 4.65, y + .2, 3.12, .42, .4, .5); furnish("坐便支座上贴合的完整坐便座体", pale, start + 4.65, y + .44, 3.12, .58, .12, .72); furnish("坐便座后沿接合的完整水箱", pale, start + 4.65, y + .73, 3.42, .55, .7, .18); furnish("每户卫浴右侧实际落地的洗手台柜", timber, start + 6.5, y + .42, 2.7, .6, .84, .5); furnish("洗手台柜上真正相接的浅盆台", pale, start + 6.5, y + .9, 2.7, .65, .12, .55); furnish("每户卫浴后侧实际落在楼板上的淋浴托盘", pale, start + 5.65, y + .05, 3.3, 1, .1, 1);
    }
    if (level > 0) {
      guards.push(meshBeam("每层外廊临街边连续接通的扶栏", [-11, y + 1.05, -5.52], [7.2, y + 1.05, -5.52], .06, steel));
      for (const x of [-11, -7, -3, 1, 5, 7.2]) guards.push(meshBeam("外廊扶栏底端实际接入楼板的立柱", [x, y, -5.52], [x, y + 1.05, -5.52], .06, steel));
      for (const [x, end] of [[-11, -3.3], [7.2, -4]]) guards.push(meshBeam("外廊两端与前栏连续封合的侧扶栏", [x!, y + 1.05, -5.52], [x!, y + 1.05, end!], .06, steel), meshBeam("外廊侧扶栏尾端实落楼板的短柱", [x!, y, end!], [x!, y + 1.05, end!], .06, steel));
      for (const [from, to] of level === 1 ? [[-11, -10.4], [-9.2, -8.9], [-7.7, -7]] : [[-11, -8.9], [-7.7, -7]]) {
        guards.push(meshBeam("外廊梯厅后缘只在真实上下梯口处断开的扶栏", [from!, y + 1.05, -3.3], [to!, y + 1.05, -3.3], .06, steel));
        for (const x of [from!, to!]) if (x !== -11) guards.push(meshBeam("梯厅后缘护栏实际支在完整廊板上的立柱", [x, y, -3.3], [x, y + 1.05, -3.3], .06, steel));
      }
      parts.push(combineMeshes("每层前外廊全部真实临空边的完整栏架", steel, guards));
    }
    if (level === 2) continue;
    parts.push(waistStair("端部共梯从本层外廊出发的九级薄底上行阶", -9.8, y, -4.2, 1.2, 9, 1 / 6, .3), waistStair("端部共梯换向后真正接入上一层外廊的九级阶", -8.3, y + 1.5, -.6, 1.2, 9, 1 / 6, .3, true), box("两跑共梯之间完整相接的换向平台", -9.05, y + 1.4, -1.05, 3, .2, .9, stone));
    for (const [x, z, base, reverse] of [[-9.8, -4.2, y, false], [-8.3, -.6, y + 1.5, true]] as [number, number, number, boolean][]) for (const side of [-1, 1]) {
      const direction = reverse ? -1 : 1, low: Triple = [x + side * .55, base + 1 / 6, z + direction * .15], high: Triple = [x + side * .55, base + 1.5, z + direction * 2.55];
      flightGuards.push(meshBeam("共梯扶手随九级阶程连续上行", [low[0], low[1] + .9, low[2]], [high[0], high[1] + .9, high[2]], .05, steel), meshBeam("共梯扶手低端真正落在首级踏面的短柱", low, [low[0], low[1] + .9, low[2]], .05, steel), meshBeam("共梯扶手高端真正落在末级踏面的短柱", high, [high[0], high[1] + .9, high[2]], .05, steel));
    }
    landingGuards.push(meshBeam("换向平台后沿与两侧完整相接的护栏", [-10.5, y + 2.5, -.65], [-7.6, y + 2.5, -.65], .05, steel));
    for (const x of [-10.5, -7.6]) landingGuards.push(meshBeam("换向平台侧面不堵两跑梯口的短护栏", [x, y + 2.5, -1.45], [x, y + 2.5, -.65], .05, steel), meshBeam("换向平台侧栏前端接台面的竖柱", [x, y + 1.5, -1.45], [x, y + 2.5, -1.45], .05, steel), meshBeam("换向平台后角接台面的竖柱", [x, y + 1.5, -.65], [x, y + 2.5, -.65], .05, steel));
    landingGuards.push(meshBeam("上行首跑外扶手实际接入换向台侧栏的短连段", [-10.35, y + 2.4, -1.65], [-10.5, y + 2.5, -1.45], .05, steel), meshBeam("换向台侧栏实际接入次跑外扶手的短连段", [-7.6, y + 2.5, -.65], [-7.75, y + 2.4 + 1 / 6, -.75], .05, steel));
  }
  for (const x of [-10.4, -7.7]) parts.push(box("共同托住两层换向平台并与地基相连的连续立柱", x, 2.45, -1.05, .2, 4.3, .3, steel));
  const gallerySupports = [-10.8, -4.8, 1.2, 7.1].map(x => solidBox("外廊前沿从地面连续接到最高廊板底的承柱", x, 3.2, -5.45, .22, 5.8, .22, steel));
  for (const y of [2.97, 5.97]) gallerySupports.push(solidBox("外廊前沿各承柱与整片廊板之间真实相接的横梁", -1.85, y, -5.45, 18.3, .26, .2, steel));
  parts.push(combineMeshes("前外廊全部楼板与接地长柱真实连成的梁柱承架", steel, gallerySupports));
  for (const [name, color, pieces] of [["全部共梯扶手与实落踏面的立柱", steel, flightGuards], ["所有换向平台与梯口连续相连的安全栏架", steel, landingGuards], ...Object.entries(furniture).map(([color, pieces]) => ["六户完整户型内各自接地并互相贴合的固定家具", color, pieces])] as [string, string, ModelPart[]][]) for (let first = 0; first < pieces.length; first += 16) parts.push(combineMeshes(name, color, pieces.slice(first, first + 16)));
  return parts;
}

export const everydayResidenceSpaceBatchThreeDesigns = [
  design("前外廊转角梯三层步行公寓", "端部露天折返共梯接入三层横向前外廊，每层两户经各自实门入户，户内前起居厅分别连接后卧与厨卫带，门窗、完整楼板屋盖及独立家具保留六户完整生活空间，外廊前梁和换向平台均由接地长柱承托", galleryWalkupApartment, "建筑", "现代"),
];
