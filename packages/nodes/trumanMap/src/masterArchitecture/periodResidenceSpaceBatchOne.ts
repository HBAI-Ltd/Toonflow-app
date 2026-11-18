import { part, type ModelPart, type Triple } from "../assetModelParts";
import { wallSpecs } from "../roofRegistry";
import { box, design } from "./structures";
import { barrelRoof } from "./spatialShells";
import { gableCover, slopePanel } from "./vernacularWorldBatchOne";
import { endGable, ladder } from "./vernacularWorldBatchTwo";
import { solidBox } from "./vernacularWorldBatchThree";
import { meshBeam } from "./vernacularWorldBatchFive";
import { hardFloor } from "./vernacularWorldBatchSix";
import { packMeshes } from "./vernacularWorldBatchThirteen";

const plaster = "#c7bda5", masonry = "#a39d8b", tile = "#64716a", timber = "#866c50", stone = "#aaa995", redBrick = "#a18b76";
type Door = [number, number, number];
type Window = [number, number, number, number];

// 建筑组成参考公开营造资料；各屋体尺度、顶点、分室和装配为本地原创。
// https://www.ihchina.cn/art/detail/id/21922.html
// https://www.shanghai.gov.cn/hpfy/index.html
export const periodResidenceSpaceBatchOneDesigns = [
  design("角门影壁一进合院住宅", "正房、东西厢房与倒座房共同围住真实露天内院，东南角门经影壁转入院中，正房前低檐廊和各独立房门连通院落，厚砖山墙与木承架托住完整瓦盖", northCourtyardResidence, "建筑", "中式"),
  design("前天井石库门里弄整宅", "石门前天井被两层侧厢和后客堂主楼围住，内侧木梯穿过真实楼板洞到达上层，后灶披间的亭子间经降阶短桥接入主楼，侧晒台与后门保持贯通", shikumenLaneResidence, "建筑", "中式"),
  design("前店中院后宅单廊铺院", "宽前铺与独立后宅之间留完整露天中院，东侧有贯通带檐窄廊，前铺真门窗和内柜分开，后宅的起居室、睡室与侧通道各有真实隔门，院墙闭合到两栋屋体", shopCourtResidence, "建筑", "中式"),
  design("砖券跨巷贯厅过街住楼", "完整上层住宅跨过真实贯通的下层街巷，厚砖筒券与两侧实房承担楼面，侧内梯穿过真梯洞进入贯通上厅，前后房窗与两侧私室独立分隔在完整双坡瓦盖内", overLaneResidence, "建筑", "中式"),
];

export function periodWall(name: string, color: string, width: number, height: number, thickness: number, position: Triple, doors: Door[] = [], windows: Window[] = [], yaw = 0): ModelPart {
  const outline: [number, number][] = [[-width / 2, 0], [-width / 2, height], [width / 2, height], [width / 2, 0]];
  for (const [x, w, h] of [...doors].sort((a, b) => b[0] - a[0])) outline.push([x + w / 2, 0], [x + w / 2, h], [x - w / 2, h], [x - w / 2, 0]);
  const angle = yaw * Math.PI / 180, value = hardFloor(name, color, outline, thickness, [position[0] - Math.sin(angle) * thickness / 2, position[1], position[2] + Math.cos(angle) * thickness / 2], windows.map(([x, y, w, h]): [number, number][] => [[x - w / 2, y], [x + w / 2, y], [x + w / 2, y + h], [x - w / 2, y + h]])); value.rotation = { x: -90, y: 0, z: -yaw };
  // 登记门窗洞口，供建筑生成后统一补门窗外框和壁柱（门洞在轮廓底边开口，窗洞为内孔）
  wallSpecs.set(value, { width, height, depth: thickness, holes: [...doors.map(([x, w, h]): [number, number][] => [[x - w / 2, 0], [x + w / 2, 0], [x + w / 2, h], [x - w / 2, h]]), ...windows.map(([x, y, w, h]): [number, number][] => [[x - w / 2, y], [x + w / 2, y], [x + w / 2, y + h], [x - w / 2, y + h]])] });
  return value;
}

export function periodRoof(name: string, span: number, length: number, wallTop: number, rise: number, x: number, z: number, alongX = false, wallColor = plaster): ModelPart[] {
  const extension = .35 * rise / (span / 2), p = gableCover(name, span + .7, length + .6, wallTop + .16 - extension, rise + extension, tile);
  for (const value of p) { value.position.x = x; value.position.z = z; value.rotation.y = alongX ? 90 : 0; }
  for (const end of [-1, 1]) { const value = endGable(0, 0, span, wallTop, rise, wallColor); value.position.x = x + (alongX ? end * length / 2 : 0); value.position.z = z + (alongX ? 0 : end * length / 2); value.rotation.y = alongX ? 90 : 0; p.push(value); }
  return p;
}

export function lattice(position: Triple, windows: Window[], yaw = 0): ModelPart[] {
  const angle = yaw * Math.PI / 180, at = (x: number, y: number): Triple => [position[0] + Math.cos(angle) * x, position[1] + y, position[2] + Math.sin(angle) * x], pieces: ModelPart[] = [];
  for (const [x, y, width, height] of windows) {
    for (const side of [-1, 1]) pieces.push(meshBeam("真窗洞中实际上下相接的细木窗栅", at(x + side * width / 4, y), at(x + side * width / 4, y + height), .045, timber));
    pieces.push(meshBeam("真窗洞内连接竖栅的横向木窗格", at(x - width / 2, y + height / 2), at(x + width / 2, y + height / 2), .045, timber));
  }
  return pieces;
}

function northCourtyardResidence(): ModelPart[] {
  const p: ModelPart[] = [box("正房厢房倒座与角门共用完整落地石坪", 0, .1, 0, 22, .2, 25.6, stone)], walls: ModelPart[] = [], wood: ModelPart[] = [];
  for (const x of [-5, 0, 5]) {
    const windows: Window[] = [[-1.6, 1, 1.1, 1.2], [1.6, 1, 1.1, 1.2]];
    walls.push(periodWall("正房三间各自保留实际门窗的完整前立面", plaster, 5, 3.1, .22, [x, .3, 6], [[0, 1.05, 2.1]], windows)); wood.push(...lattice([x, .3, 6], windows));
  }
  walls.push(solidBox("正房通长真实落地后砖墙", 0, 1.85, 12, 15, 3.1, .3, plaster), ...[-1, 1].map(side => solidBox("正房两端与山面相接的完整实砖侧墙", side * 7.5, 1.85, 9, .3, 3.1, 6, plaster)), ...[-1, 1].map(side => solidBox("三间正房之间从地坪连到屋盖的独立内隔墙", side * 2.5, 1.85, 9, .14, 3.1, 6, plaster)));
  p.push(box("三间正房与前低廊共用的实际高石地台", 0, .24, 8.4, 15, .12, 7.2, stone), ...periodRoof("完整正房高双坡青瓦屋盖", 6, 15, 3.4, 1.5, 0, 9, true), slopePanel("正房前独立低廊完整接到主屋檐下的瓦坡", [[-7.6, 2.95, 4.8], [7.6, 2.95, 4.8], [7.6, 3.55, 6], [-7.6, 3.55, 6]], .12, tile));
  for (const x of [-7, -2.5, 2.5, 7]) wood.push(meshBeam("低前廊实际落在正房前石台上的木檐柱", [x, .3, 4.9], [x, 2.83, 4.9], .15, timber));
  wood.push(meshBeam("低前廊四木柱顶实际连续的檐承枋", [-7.5, 2.83, 4.9], [7.5, 2.83, 4.9], .16, timber));
  for (const side of [-1, 1]) {
    const start = side < 0 ? -6 : -4, length = 6 - start, centers = side < 0 ? [-4, 0, 4] : [-7 / 3, 1, 13 / 3];
    for (const z of centers) {
      const width = length / 3, windows: Window[] = [[1.05, 1, .7, 1.05]];
      walls.push(periodWall("东西厢房各自面向内院的真实独立门窗", plaster, width, 2.5, .22, [side * 7.5, .3, z], [[-.45, .9, 2.05]], windows, 90)); wood.push(...lattice([side * 7.5, .3, z], windows, 90));
    }
    walls.push(solidBox("厢房向宅外封闭的完整厚砖后墙", side * 10.5, 1.55, (start + 6) / 2, .3, 2.5, length, plaster));
    for (const z of [start, 6]) walls.push(solidBox("厢房两端真实接到瓦盖山面的完整墙", side * 9, 1.55, z, 3, 2.5, .22, plaster));
    for (const z of [start + length / 3, start + length * 2 / 3]) walls.push(solidBox("厢房相邻私室之间完整到顶的木隔板", side * 9, 1.55, z, 3, 2.5, .12, plaster));
    p.push(box("厢房门内完整连续的高石地台", side * 9, .24, (start + 6) / 2, 3, .12, length, stone), ...periodRoof("东西厢房各自完整的长双坡瓦盖", 3, length, 2.8, 1, side * 9, (start + 6) / 2));
  }
  for (const x of [-47 / 6, -2.5, 17 / 6]) { const windows: Window[] = [[1.4, 1, .9, 1.05]]; walls.push(periodWall("倒座三室各自朝院打开的真实门窗", plaster, 16 / 3, 2.7, .22, [x, .2, -7], [[-.5, .95, 2.1]], windows)); wood.push(...lattice([x, .2, -7], windows)); }
  walls.push(solidBox("倒座向街连续封闭的完整后砖墙", -2.5, 1.55, -12, 16, 2.7, .3, plaster));
  for (const x of [-10.5, -31 / 6, 1 / 6, 5.5]) walls.push(solidBox("倒座端部与相邻房间之间完整的分隔墙", x, 1.55, -9.5, .22, 2.7, 5, plaster));
  p.push(...periodRoof("倒座房完整低双坡瓦盖", 5, 16, 2.9, 1, -2.5, -9.5, true));
  for (const z of [-12.5, -7.5]) walls.push(periodWall("东南角屋门前后真正贯通的砖门墙", masonry, 5, 3, .3, [8, .2, z], [[0, 1.5, 2.4]]));
  for (const x of [5.5, 10.5]) walls.push(solidBox("角门两端承住完整门屋瓦顶的厚砖壁", x, 1.7, -10, .3, 3, 5, masonry));
  p.push(...periodRoof("东南角门上完整青瓦门屋盖", 5, 5, 3.2, 1.15, 8, -10, false, masonry), box("角门内挡住直视而两侧可绕行的完整影壁", 8, 1.3, -5.8, 3.1, 2.2, .3, masonry), box("影壁上实际压住墙身的完整砖石帽", 8, 2.45, -5.8, 3.45, .16, .55, tile));
  for (const side of [-1, 1]) { walls.push(solidBox("正房旁小露地外缘完整闭合的院墙", side * 10.5, 1.5, 9, .3, 2.6, 6, masonry), solidBox("正房后两侧露地真正封合的后院墙", side * 9, 1.5, 12, 3, 2.6, .3, masonry)); }
  walls.push(solidBox("西厢与倒座之间连续闭合的短院墙", -10.5, 1.5, -6.5, .3, 2.6, 1, masonry), solidBox("角门与东厢之间真实围合的短院墙", 10.5, 1.5, -5.75, .3, 2.6, 3.5, masonry));
  p.push(...packMeshes("合院各房真实分隔及闭合外缘的完整砖墙", plaster, walls), ...packMeshes("前廊檐柱承枋与所有真实窗洞内的木窗格", timber, wood));
  return p;
}

function shikumenLaneResidence(): ModelPart[] {
  const p: ModelPart[] = [box("石库门前天井主楼侧厢与后披屋共用完整石基", 0, .1, 0, 9.6, .2, 20, stone), hardFloor("主楼上层真正保留侧内梯长洞的木楼面", timber, [[-4.5, -4], [4.5, -4], [4.5, 4.5], [-4.5, 4.5]], .18, [0, 3.02, 0], [[[-4.05, -3.1], [-2.75, -3.1], [-2.75, 2.75], [-4.05, 2.75]]])], walls: ModelPart[] = [], wood: ModelPart[] = [];
  const frontWindows: Window[] = [[-1.6, 1, .8, 1.2], [1.6, 1, .8, 1.2]], upperWindows: Window[] = [[0, .8, 1.3, 1.45]];
  walls.push(periodWall("前天井通入主楼客堂及两侧厢房的真实底层门窗", redBrick, 9, 2.8, .24, [0, .2, -4], [[0, 1.3, 2.2], [-3.4, .9, 2.1], [3.4, .9, 2.1]], frontWindows), periodWall("主楼二层经实门通入侧厢并向前天井采光的完整砖面", redBrick, 9, 2.8, .24, [0, 3.2, -4], [[-3.4, .9, 2.1], [3.4, .9, 2.1]], upperWindows)); wood.push(...lattice([0, .2, -4], frontWindows), ...lattice([0, 3.2, -4], upperWindows));
  for (const level of [.2, 3.2]) {
    walls.push(periodWall("主楼通往后天井和后披屋的真实后门", redBrick, 9, 2.8, .24, [0, level, 4.5], [[0, 1.15, 2.15]], [[-2.8, 1, 1.1, 1.2], [2.8, 1, 1.1, 1.2]]));
    for (const side of [-1, 1]) walls.push(periodWall("主楼中厅通入两侧私室和梯间的实际内门", plaster, 8.5, 2.8, .12, [side * 1.4, level, .25], [[0, 1, 2.1]], [], 90));
  }
  for (const side of [-1, 1]) {
    walls.push(solidBox("里弄主楼两侧完整通高的厚共墙", side * 4.5, 3.1, .25, .26, 5.8, 8.5, redBrick), solidBox("前侧厢向外完整通高的厚砖共墙", side * 4.5, 3.1, -6.75, .26, 5.8, 5.5, redBrick), solidBox("前侧厢在石门两侧真正闭合的砖前壁", side * 3.4, 3.1, -9.5, 2.2, 5.8, .26, redBrick));
    walls.push(periodWall("前厢底层真正朝前天井开门的完整砖壁", redBrick, 5.5, 2.8, .22, [side * 2.3, .2, -6.75], [[0, .9, 2.1]], [[-1.8, 1, .7, 1.1]], 90), periodWall("前厢上层朝前天井采光且保留真实窗洞的完整砖壁", redBrick, 5.5, 2.8, .22, [side * 2.3, 3.2, -6.75], [], [[0, .8, 1.5, 1.4]], 90));
    p.push(box("侧厢两层之间真实连续的木楼板", side * 3.4, 3.1, -6.75, 2.2, .2, 5.5, timber), hardFloor("前侧厢真实避开登晒台梯口的厚屋面", masonry, [[side * 3.4 - 1.2, -9.6], [side * 3.4 + 1.2, -9.6], [side * 3.4 + 1.2, -3.9], [side * 3.4 - 1.2, -3.9]], .2, [0, 6, 0], [[[side * 3.4 - .43, -7.3], [side * 3.4 + .43, -7.3], [side * 3.4 + .43, -5.9], [side * 3.4 - .43, -5.9]]]), ...ladder("前厢上室经真实顶洞登到晒台的独立短木梯", side * 3.4, 3.2, -8.3, 6.27, -5.8, 9));
    walls.push(solidBox("前厢晒台外缘实际接到共墙的矮砖栏", side * 4.48, 6.45, -6.75, .15, .5, 5.5, redBrick), solidBox("前厢晒台临前天井真实封合的低砖护栏", side * 2.3, 6.45, -6.75, .15, .5, 5.5, redBrick), solidBox("前厢晒台朝街一端实际落在屋板上的低砖栏", side * 3.4, 6.45, -9.5, 2.2, .5, .15, redBrick));
  }
  p.push(...periodRoof("主楼完整高青瓦双坡盖", 8.5, 9, 6, 1.8, 0, .25, true, redBrick));
  walls.push(periodWall("黑门石框两侧真实闭合的前天井门墙", redBrick, 4.6, 2.8, .28, [0, .2, -9.5], [[0, 1.4, 2.2]]));
  for (const side of [-1, 1]) walls.push(solidBox("实际落地而不堵门洞的两根完整石门框", side * .83, 1.33, -9.56, .26, 2.26, .38, stone));
  p.push(box("完整承在两侧石框上的库门石楣", 0, 2.56, -9.56, 1.92, .26, .42, stone), part("石门楣上原创简洁三角山花", "extrude", stone, [0, 2.69, -9.56], [1, 1, 1], [0, 0, 0], { depth: .34, profile: [{ x: -1.08, y: 0 }, { x: 1.08, y: 0 }, { x: 0, y: .48 }] }));
  wood.push(meshBeam("侧内梯靠共墙真正从地面接到上层梯口的边梁", [-3.94, .2, -3], [-3.94, 3.11, 2.4], .13, timber), meshBeam("侧内梯靠客堂一边真正接到楼板的承梯梁", [-2.86, .2, -3], [-2.86, 3.11, 2.4], .13, timber));
  for (let i = 0; i < 15; i++) wood.push(solidBox("侧内梯全部保留独立真实厚木踏板", -3.4, .34 + i * .2, -2.9 + i * .35, 1.15, .12, .35, timber));
  wood.push(solidBox("内梯末级实际接到木楼面梯口边的完整落脚台", -3.4, 3.11, 2.5, 1.3, .18, .65, timber));
  wood.push(meshBeam("主楼上层梯井临客堂一边真实接续的木扶栏", [-2.7, 4.1, -3.1], [-2.7, 4.1, 2.1], .055, timber));
  for (const z of [-3.1, -.5, 2.1]) wood.push(meshBeam("上层梯井扶栏实际落到洞边楼板的竖木柱", [-2.7, 3.2, z], [-2.7, 4.1, z], .055, timber));
  for (const z of [5.5, 9.5]) walls.push(periodWall("后灶披屋前后真实贯通的低门窗墙", redBrick, 9, 2.4, .22, [0, .2, z], [[0, 1.15, 2.15]], [[-2.8, 1, 1.1, 1], [2.8, 1, 1.1, 1]]));
  for (const side of [-1, 1]) walls.push(solidBox("后灶披间两端连续闭合的完整低外砖壁", side * 4.5, 1.4, 7.5, .24, 2.4, 4, redBrick));
  p.push(box("后灶披间上真实承住亭子间和两侧晒台的完整楼板", 0, 2.7, 7.5, 9.2, .2, 4.2, masonry));
  walls.push(periodWall("亭子间正对主楼的真实低入室门", redBrick, 4, 2.2, .2, [0, 2.8, 5.5], [[0, 1, 2]]), periodWall("亭子间后墙真正贯通的采光窗", redBrick, 4, 2.6, .2, [0, 2.8, 9.5], [], [[0, .8, 1.5, 1.1]]));
  for (const side of [-1, 1]) {
    walls.push(periodWall("亭子间真正通往两侧晒台的独立侧门", redBrick, 4, 2.2, .18, [side * 2, 2.8, 7.5], [[0, .8, 2]], [], 90));
    const fill = hardFloor("亭子间单坡檐下连续封合到侧墙的斜顶砖带", redBrick, [[5.5, 4.9], [9.5, 4.9], [9.5, 5.36], [5.5, 4.93]], .18, [side * 2 - .09, 0, 0]); fill.rotation = { x: -90, y: 0, z: -90 }; walls.push(fill);
  }
  p.push(slopePanel("亭子间完整覆盖小室的低单坡瓦盖", [[-2.3, 5.06, 5.2], [2.3, 5.06, 5.2], [2.3, 5.55, 9.8], [-2.3, 5.55, 9.8]], .16, tile));
  for (let i = 0; i < 2; i++) wood.push(solidBox("主楼后门越过后天井下降到亭子间的真实短桥踏段", 0, 3.1 - i * .2, 4.75 + i * .5, 1.15, .2, .5, timber));
  for (const side of [-1, 1]) wood.push(meshBeam("后天井降阶短桥侧边实际接续的完整木扶手", [side * .54, 4.05, 4.5], [side * .54, 3.65, 5.5], .05, timber), meshBeam("后天井短桥前端实际接到踏台的扶手立柱", [side * .54, 3.2, 4.55], [side * .54, 4.03, 4.55], .05, timber), meshBeam("后天井短桥后端实际接到亭子间平台的扶手立柱", [side * .54, 2.8, 5.5], [side * .54, 3.65, 5.5], .05, timber));
  for (const side of [-1, 1]) {
    walls.push(solidBox("后披屋晒台外边实际落在楼板上的矮砖护栏", side * 4.5, 3.1, 7.5, .16, .6, 4, redBrick), solidBox("后披屋晒台后缘在亭子间两边闭合的矮栏", side * 3.25, 3.1, 9.5, 2.5, .6, .16, redBrick));
    wood.push(solidBox("上层卧室内真正落在木楼面上的独立床台", side * 2.05, 3.42, -.7, side < 0 ? 1 : 1.3, .44, 2, timber));
  }
  wood.push(solidBox("灶披间内避开前后门的完整落地灶台", -2.8, .65, 7.8, 2.4, .9, 1, masonry));
  p.push(...packMeshes("前天井主楼侧厢与后亭子间的全部真实厚砖墙", redBrick, walls), ...packMeshes("石库门内所有实际楼梯木格和卧台", timber, wood));
  return p;
}

function shopCourtResidence(): ModelPart[] {
  const p: ModelPart[] = [box("前铺中院后宅与侧廊共用完整落地石坪", 0, .1, 0, 10.7, .2, 26.6, stone)], walls: ModelPart[] = [], wood: ModelPart[] = [];
  const shopWindows: Window[] = [[-3.5, .8, 2, 1.8], [3.5, .8, 2, 1.8]];
  walls.push(periodWall("沿街前铺真实可进出的宽门与两侧铺窗", plaster, 10, 3.3, .24, [0, .2, -13], [[0, 2.4, 2.7]], shopWindows), periodWall("前铺向中院及侧通廊分别打开的实际后门", plaster, 10, 3.3, .24, [0, .2, -7], [[0, 1.2, 2.3], [3.8, 1.1, 2.3]]));
  for (const side of [-1, 1]) walls.push(solidBox("前铺两端与瓦顶山墙相接的完整厚壁", side * 5, 1.85, -10, .26, 3.3, 6, plaster));
  p.push(...periodRoof("前铺完整横向双坡瓦盖", 6, 10, 3.5, 1.15, 0, -10, true));
  for (const side of [-1, 1]) wood.push(solidBox("铺窗后方实际落地且避开中门的完整柜体", side * 3.2, .68, -11.2, 2.5, .96, 1, timber), solidBox("铺柜之上实际接触的完整木柜台面", side * 3.2, 1.2, -11.2, 2.6, .08, 1.1, timber));
  walls.push(solidBox("露天中院西侧真实连接前铺与后宅的完整院墙", -5, 1.4, -1, .26, 2.4, 12, masonry), solidBox("东侧带檐通廊向外连续闭合的高院壁", 5, 1.7, -1, .26, 3, 12, masonry));
  p.push(slopePanel("中院东边独立窄廊连续连接前铺后宅的完整瓦坡", [[3, 2.6, -7.15], [5.15, 3.3, -7.15], [5.15, 3.3, 5.15], [3, 2.6, 5.15]], .14, tile));
  for (const z of [-6.5, -2.7, 1.1, 4.7]) wood.push(meshBeam("中院东窄廊真实从石坪立到低檐的独立木柱", [3.1, .2, z], [3.1, 2.46, z], .14, timber));
  wood.push(meshBeam("窄廊低檐沿全部廊柱接续的完整长枋", [3.1, 2.46, -7], [3.1, 2.46, 5], .16, timber));
  const homeWindows: Window[] = [[-3, 1, 1.3, 1.25]];
  walls.push(periodWall("后宅起居室与独立侧廊各自真正开门的前立面", plaster, 10, 3, .24, [0, .2, 5], [[0, 1.2, 2.2], [3.8, 1.1, 2.2]], homeWindows), periodWall("后宅睡室真后窗与侧通道真实出口", plaster, 10, 3, .24, [0, .2, 13], [[3.8, 1.1, 2.2]], [[-2.5, 1, 2, 1.25]])); wood.push(...lattice([0, .2, 5], homeWindows));
  for (const side of [-1, 1]) walls.push(periodWall("后宅两端完整承住瓦盖且有真实侧窗的长壁", plaster, 8, 3, .26, [side * 5, .2, 9], [], [[0, 1, 1.4, 1.25]], 90));
  walls.push(periodWall("起居室睡室经侧通道独立出入的纵向内隔墙", plaster, 8, 3, .14, [2.8, .2, 9], [[-2, .9, 2.1], [2, .9, 2.1]], [], 90), periodWall("后宅起居与睡室之间保留真实内门的厚隔墙", plaster, 7.8, 3, .14, [-1.1, .2, 9], [[1, .9, 2.1]]));
  p.push(...periodRoof("独立后宅完整较高双坡瓦盖", 8, 10, 3.2, 1.5, 0, 9, true));
  wood.push(solidBox("后睡室避开侧通道和内门的完整落地木卧台", -2.6, .42, 11.1, 2, .44, 2.4, timber), solidBox("后宅起居厅实际落地的完整长木坐台", -3.8, .42, 6.8, .8, .44, 2.2, timber));
  p.push(...packMeshes("前店后宅内外墙和中院侧界的全部真实砖体", plaster, walls), ...packMeshes("铺院所有柜台窗格廊柱与后宅卧台完整保留", timber, wood));
  return p;
}

function overLaneResidence(): ModelPart[] {
  const p: ModelPart[] = [box("贯穿下层街巷和两侧房体的完整落地石坪", 0, .1, 0, 14.8, .2, 8.8, stone), hardFloor("整座跨巷上厅真实避开西侧内梯长洞的完整楼板", timber, [[-7, -4], [7, -4], [7, 4], [-7, 4]], .25, [0, 3.55, 0], [[[-6.5, -2.95], [-5.1, -2.95], [-5.1, 2.5], [-6.5, 2.5]]]), barrelRoof("真实跨过街巷且完全保留贯通内空的厚砖筒券", 2, .3, 8, [0, 1, 0], masonry)], walls: ModelPart[] = [], wood: ModelPart[] = [];
  for (const side of [-1, 1]) {
    const profile: [number, number][] = [[side * 2.3, 1], [side * 2.3, 3.55], [0, 3.55], [0, 3.3], ...Array.from({ length: 5 }, (_, i) => { const a = Math.PI / 2 - side * (i + 1) * Math.PI / 12; return [Math.cos(a) * 2.3, 1 + Math.sin(a) * 2.3] as [number, number]; })], fill = hardFloor("筒券两边真实填实并承担上层楼面的厚拱肩", masonry, profile, 8, [0, 0, 4]); fill.rotation.x = -90; walls.push(fill);
    walls.push(solidBox("两侧底屋临巷并与筒券拱脚咬合的完整厚承墙", side * 2.3, 1.875, 0, .3, 3.35, 8, masonry), solidBox("底屋和上层住宅共同落地的完整通高外侧墙", side * 7, 3.5, 0, .3, 6.6, 8, plaster));
    for (const end of [-1, 1]) {
      walls.push(periodWall("两侧底屋向街口开门的完整下层立面", plaster, 4.7, 3.35, .24, [side * 4.65, .2, end * 4], end < 0 ? [[0, 1.05, 2.2]] : [], end < 0 ? [] : [[0, 1, 1.2, 1.3]]));
      const windows: Window[] = [[0, .9, 1.6, 1.4]]; walls.push(periodWall("过街住楼两侧上房前后真正贯通的窗洞墙", plaster, 5, 3, .24, [side * 4.5, 3.8, end * 4], [], windows)); wood.push(...lattice([side * 4.5, 3.8, end * 4], windows));
    }
    walls.push(periodWall("上层中厅通入两侧独立私室的真实分隔门墙", plaster, 8, 3, .14, [side * 2, 3.8, 0], [[0, 1.1, 2.2]], [], 90));
  }
  for (const end of [-1, 1]) { const windows: Window[] = [[0, .75, 2.2, 1.6]]; walls.push(periodWall("跨巷中厅正对两端街口的完整真窗立面", plaster, 4, 3, .24, [0, 3.8, end * 4], [], windows)); wood.push(...lattice([0, 3.8, end * 4], windows)); }
  for (const x of [-6.33, -5.27]) wood.push(meshBeam("西侧内梯真正从底屋接到上厅洞口的完整斜承梁", [x, .2, -2.9], [x, 3.7, 2.4], .16, timber));
  for (let i = 0; i < 18; i++) wood.push(solidBox("跨巷住楼内梯逐级上行的独立厚木踏板", -5.8, .34 + i * .2, -2.66 + i * .28, 1.1, .12, .28, timber));
  wood.push(solidBox("末级踏板真正接到上层实楼面的完整木落脚台", -5.8, 3.69, 2.5, 1.4, .22, .52, timber), solidBox("东上房实际落在楼板上的完整木卧台", 4.6, 4.02, 1.3, 1.8, .44, 2.3, timber), solidBox("西上房避开梯洞的完整低木坐台", -3.9, 4.02, -.8, 1.2, .44, 2.4, timber));
  wood.push(meshBeam("跨巷上房梯井临私室一边完整的木扶栏", [-5.06, 4.7, -2.95], [-5.06, 4.7, 2.1], .055, timber));
  for (const z of [-2.95, -.4, 2.1]) wood.push(meshBeam("跨巷上厅梯井扶栏实际落在完整楼面的竖木柱", [-5.06, 3.8, z], [-5.06, 4.7, z], .055, timber));
  p.push(...periodRoof("整座过街住宅完整横跨两侧房体的双坡瓦盖", 8, 14, 6.8, 1.5, 0, 0, true), ...packMeshes("过街筒券拱肩与整座住宅内外实际砖墙", plaster, walls), ...packMeshes("上层真窗木格侧内梯和私室完整木卧台", timber, wood));
  return p;
}
