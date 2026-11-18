import { part, type ModelPart } from "../assetModelParts";
import { glazedWall } from "./modernResidenceSpaceBatchOne";
import { boxesMesh, standingPanel, type SolidBox } from "./publicSpaceBatchEight";
import { barrelRoof } from "./spatialShells";
import { box, design, type ArchitecturePrototype } from "./structures";
import { hardFloor } from "./vernacularWorldBatchSix";

const paving = "#b9beae", wall = "#c8ccbe", roofColor = "#7b9690", steel = "#667e80", cold = "#d0d4c7", timber = "#a09274", glass = "#a3c3be";

function rectangle(x0: number, x1: number, y0: number, y1: number): [number, number][] { return [[x0, y0], [x1, y0], [x1, y1], [x0, y1]]; }

function spinalEnd(name: string, z: number, width: number, height: number, holes: [number, number][][] = []): ModelPart {
  const outline: [number, number][] = [[-5, .3], [-width / 2, .3], [-width / 2, .3 + height], [width / 2, .3 + height], [width / 2, .3], [5, .3], [5, 4.8]];
  for (let i = 1; i <= 12; i++) { const a = i * Math.PI / 12; outline.push([Math.cos(a) * 5, 4.8 + Math.sin(a) * 1.25]); }
  return standingPanel(name, wall, outline, holes, z, .24);
}

// 两侧前交易翼与后冷配翼之间各凹入一处真正露天卸货院；不是矩形仓房换生鲜标签。
// 低翼、前后分流中脊、两道大车庭口和扁拱承架共同决定完整建筑平剖面。
function twinDockCourtFreshSupplyHall(): ModelPart[] {
  const p: ModelPart[] = [
    hardFloor("四低翼和高交易中脊组成真正双凹院H形落地楼面", paving, [[-15, -14], [15, -14], [15, -6], [5, -6], [5, 6], [15, 6], [15, 14], [-15, 14], [-15, 6], [-5, 6], [-5, -6], [-15, -6]], .3, [0, 0, 0]),
    spinalEnd("高扁拱中脊前街客入口及上方真实采光孔", -14, 2.6, 3.1, [rectangle(-3.4, 3.4, 3.9, 4.9)]),
    spinalEnd("中脊后场净配拨出口及两侧真实高窗", 14, 3.2, 3.4, [rectangle(-4.1, -2.3, 4.05, 4.8), rectangle(2.3, 4.1, 4.05, 4.8)]),
    spinalEnd("前交易与后配拨之间完整到拱底的横分界墙及独立通门", 2, 1.2, 2.5, [rectangle(-3.5, -1.7, 1.1, 2.4), rectangle(1.7, 3.5, 1.1, 2.4)]),
    part("中脊前街实际高窗孔内的独立透光玻璃", "box", glass, [0, 4.4, -14], [6.8, 1, .035], [0, 0, 0], { opacity: .28, roughness: .2 }),
    ...[-3.2, 3.2].map(x => part("中脊后端真实高窗孔内独立玻璃", "box", glass, [x, 4.425, 14], [1.8, .75, .035], [0, 0, 0], { opacity: .28, roughness: .2 })),
  ];
  const roof = barrelRoof("四低翼之间连续前后贯穿的真实扁拱薄屋壳", 5, .2, 28.6, [0, 4.8, 0], roofColor); roof.scale.y = .25; p.push(roof);
  const structure: SolidBox[] = [], fixtures: SolidBox[] = [], shelves: SolidBox[] = [];
  for (const side of [-1, 1]) {
    const x0 = side < 0 ? -15 : 5, x1 = side < 0 ? -5 : 15, x = side * 10;
    p.push(box("双嵌院面向外街真正露天开放的独立收货院坪", x, .15, 0, 10, .3, 12, "#a8b2aa"), box("前交易低翼完整承墙平屋盖", x, 3.81, -10, 10.6, .22, 8.6, roofColor), box("后冷配低翼完整承墙平屋盖", x, 3.81, 10, 10.6, .22, 8.6, roofColor));
    p.push(...glazedWall("前交易低翼各自面向街道的真入口和橱窗", [x0, -14], [x1, -14], .3, 3.7, [[-3, .85, 2.1, 1.8], [3, .85, 2.1, 1.8]], [[0, .3, 1.8, 2.8]]));
    p.push(...glazedWall("前交易翼外侧完整采光长窗", [side * 15, -14], [side * 15, -6], .3, 3.7, [[0, 1, 4.5, 1.8]]));
    p.push(standingPanel("前交易翼背向卸货院的真实补货传递孔及完整分界", wall, rectangle(x0, x1, .3, 3.7), [rectangle(x - 1.4, x + 1.4, 1.1, 2.4)], -6, .24));
    p.push(...glazedWall("后配拨翼从露天货院进入的真正宽收货门", [x0, 6], [x1, 6], .3, 3.7, [], [[0, .3, 3.2, 3]]));
    p.push(...glazedWall("后冷配翼外侧完整高窗与实承墙", [side * 15, 6], [side * 15, 14], .3, 3.7, [[0, 2.3, 5, .9]]));
    p.push(...glazedWall("后冷藏间独立后场人员出口和完整高采光孔", [x0, 14], [x1, 14], .3, 3.7, [[0, 2.3, 2.4, .9]], [[side * 2, .3, 1.2, 2.5]]));
    p.push(...glazedWall("后翼前分拣与后冷藏之间真正贯通的宽内门", [x0, 10], [x1, 10], .3, 3.7, [], [[side * 2, .3, 1.8, 2.7]]));
    const frontStart: [number, number] = [side * 5, side < 0 ? -6 : -14], frontEnd: [number, number] = [side * 5, side < 0 ? -14 : -6];
    p.push(...glazedWall("前交易翼与中脊公共厅之间真实通门及低屋盖以上高窗", frontStart, frontEnd, .3, 4.8, [[0, 3.95, 4.5, .6]], [[0, .3, 1.8, 2.8]]));
    p.push(...glazedWall("中脊侧壁面向露天卸货院的独立观察窗", [side * 5, side < 0 ? 6 : -6], [side * 5, side < 0 ? -6 : 6], .3, 4.8, [[-3, 2.5, 3, 1.5], [3, 2.5, 3, 1.5]]));
    p.push(...glazedWall("后分拣翼与中脊后配拨道独立接合的真实工作门", [side * 5, side < 0 ? 14 : 6], [side * 5, side < 0 ? 6 : 14], .3, 4.8, [[0, 3.95, 4.5, .6]], [[side < 0 ? 1.5 : -1.5, .3, 1.6, 2.8]]));
    for (const z of [-13.6, -6.4, 6.4, 13.6]) structure.push({ center: [side * 15, 2.0, z], size: [.24, 3.4, .24] }, { center: [x, 3.55, z], size: [10.24, .3, .24] });
    for (const z of [-13.6, -6.4, 0, 6.4, 13.6]) structure.push({ center: [side * 5, 2.55, z], size: [.24, 4.5, .24] });
    // 前售台保留两端顾客绕行道；后冷架在独立房内，不挡收货、冷门和配拨门。
    fixtures.push({ center: [x, 1.14, -10], size: [5, .08, 1.8] }, { center: [x, .7, -10], size: [3.8, .8, .22] }, { center: [x, 1.06, -6], size: [3, .08, .7] });
    for (const dx of [-2.1, 2.1]) fixtures.push({ center: [x + dx, .7, -10], size: [.18, .8, 1.4] });
    fixtures.push({ center: [side * 13.8, 1.14, 8.1], size: [1.1, .08, 2.8] }, { center: [side * 13.8, .7, 8.1], size: [.2, .8, 2.4] });
    for (const y of [.38, .95, 1.52, 2.09, 2.66]) shelves.push({ center: [side * 14.1, y, 12], size: [.8, .08, 2.8] });
    for (const z of [10.65, 13.35]) shelves.push({ center: [side * 14.1, 1.5, z], size: [.8, 2.4, .08] });
    p.push(box("凹院收货宽门外真正由两根柱梁承托的短雨棚", x, 3.55, 4.6, 7.2, .20, 3.2, roofColor));
    for (const dx of [-3.3, 3.3]) structure.push({ center: [x + dx, 1.85, 3.1], size: [.18, 3.1, .18] }, { center: [x + dx, 3.375, 4.6], size: [.16, .15, 3.2] });
    structure.push({ center: [x, 3.375, 3.1], size: [7, .15, .16] });
    p.push(part("每个开放收货院沿外街无栏口真实接地的完整短坡", "extrude", paving, [0, 0, 0], [1, 1, 1], [0, 0, 0], { profile: [{ x: side * 15, y: 0 }, { x: side * 17, y: 0 }, { x: side * 15, y: .3 }], depth: 8 }));
    p.push(part("两前交易翼独立街门真正接回街道的短坡", "extrude", paving, [x, 0, 0], [1, 1, 1], [0, -90, 0], { profile: [{ x: -16, y: 0 }, { x: -14, y: 0 }, { x: -14, y: .3 }], depth: 2.2 }), part("后冷藏人员出口真正接回室外的独立短坡", "extrude", paving, [x + side * 2, 0, 0], [1, 1, 1], [0, -90, 0], { profile: [{ x: 14, y: 0 }, { x: 16, y: 0 }, { x: 14, y: .3 }], depth: 1.5 }));
  }
  const ribProfile: { x: number; y: number }[] = [];
  for (let i = 0; i <= 12; i++) { const a = Math.PI - i * Math.PI / 12; ribProfile.push({ x: Math.cos(a) * 5, y: 4.8 + Math.sin(a) * 1.25 }); }
  for (let i = 0; i <= 12; i++) { const a = i * Math.PI / 12; ribProfile.push({ x: Math.cos(a) * 5, y: 4.64 + Math.sin(a) * 1.25 }); }
  for (const z of [-13.6, -6.4, 0, 6.4, 13.6]) p.push(part("与真实扁拱内表面同分站相接的完整跨厅钢肋", "extrude", steel, [0, 0, z], [1, 1, 1], [0, 0, 0], { profile: ribProfile, depth: .20 }));
  for (const x of [-2.6, 2.6]) fixtures.push({ center: [x, 1.06, 1.65], size: [2.0, .08, 1] }, { center: [x, .68, 1.40], size: [.3, .76, .7] });
  for (const side of [-1, 1]) fixtures.push({ center: [side * 3.1, .45, 8.1], size: [1.1, .3, 7.2] });
  for (const [name, color, pieces] of [["拱中脊和四低翼完整承柱横梁及凹院雨棚承架", steel, structure], ["交易交接与后分拣完整落地台柜及后配拨低台", timber, fixtures], ["后翼独立冷藏间中避开真实通门的完整层架", cold, shelves]] as [string, string, SolidBox[]][]) for (let start = 0; start < pieces.length; start += 20) p.push(boxesMesh(name, color, pieces.slice(start, start + 20)));
  p.push(part("中脊前街公共门完整接回地面的短坡", "extrude", paving, [0, 0, 0], [1, 1, 1], [0, -90, 0], { profile: [{ x: -16, y: 0 }, { x: -14, y: 0 }, { x: -14, y: .3 }], depth: 3 }), part("中脊后配拨宽门完整接回地面的短坡", "extrude", paving, [0, 0, 0], [1, 1, 1], [0, -90, 0], { profile: [{ x: 14, y: 0 }, { x: 17, y: 0 }, { x: 14, y: .3 }], depth: 3.6 }));
  return p;
}

export const everydayFoodSupplyBuildingSpaceBatchTwoDesigns: ArchitecturePrototype[] = [
  design("双嵌卸货院中脊生鲜配拨厅", "高扁拱中脊串起前公共交易与后配拨，四座前售后冷低翼之间嵌入两座露天收货院；货车从左右庭口直达后分拣和独立冷间，前交易经真实横隔传货孔接货，顾客前门与后场出货门分开。H形完整平面、同分站拱肋和双院承柱雨棚形成独立生鲜供配建筑", twinDockCourtFreshSupplyHall, "建筑", "现代"),
];
