import { part, type ModelPart } from "../assetModelParts";
import { cup, piercedPanel } from "../masterObjects/parts";
import { boxesMesh, type SolidBox } from "./publicSpaceBatchEight";
import { box, cylinder, design, rail, type ArchitecturePrototype } from "./structures";

const concrete = "#b3b7ab", plaster = "#c9c5b3", timber = "#a08864", roof = "#667e79", fabric = "#c5cab8";
type Point = [number, number];

function wallFace(name: string, axis: "xy" | "yz", offset: number, outline: Point[], holes: Point[][] = [], depth = 0.24, color = plaster): ModelPart {
  const value = piercedPanel(name, [0, 0, 0], outline, holes, depth, color);
  value.vertices = value.indices!.map(index => { const p = value.vertices![index]!; return axis === "xy" ? { x: p.x, y: p.z, z: offset + depth / 2 - p.y } : { x: offset + p.y - depth / 2, y: p.z, z: p.x }; });
  delete value.indices; return value;
}

function rectangle(center: number, bottom: number, width: number, height: number): Point[] {
  return [[center - width / 2, bottom], [center + width / 2, bottom], [center + width / 2, bottom + height], [center - width / 2, bottom + height]];
}

function openWall(left: number, right: number, bottom: number, top: number, center: number, width: number, height: number): Point[] {
  return [[left, bottom], [center - width / 2, bottom], [center - width / 2, bottom + height], [center + width / 2, bottom + height], [center + width / 2, bottom], [right, bottom], [right, top], [left, top]];
}

function thinStair(name: string, x: number, z: number, reverse = false): ModelPart {
  const direction = reverse ? -1 : 1, outline: Point[] = [[z, 0.02], [z + direction * 4.8, 3.22], [z + direction * 4.8, 3.4]];
  for (let step = 15; step >= 0; step--) { outline.push([z + direction * step * 0.3, 0.2 + (step + 1) * 0.2]); if (step) outline.push([z + direction * step * 0.3, 0.2 + step * 0.2]); }
  return wallFace(name, "yz", x, outline, [], 1.5, concrete);
}

export const everydayHospitalitySpaceBatchFourDesigns: ArchitecturePrototype[] = [
  design("独梯上宿下库双单元汽车客舍", "并列的两间完整封闭车库各自通过后侧独立梯井直上对应上层套房，前方中央步行门廊通入共同接待横厅，后外阶直接接到上层公共短桥；车库私梯、公共服务阶、套内湿室与车行宽门分别有真实通路，没有把半层独户住宅换床或重复拼成房群", garageSuiteLodge, "建筑", "现代"),
];

function garageSuiteLodge(): ModelPart[] {
  const floorOutline: Point[] = [[-9, -7], [-1, -7], [-1, 5], [1, 5], [1, -7], [9, -7], [9, 7], [-9, 7]];
  const holes = [-7.8, 7.8].map(x => [[x - 1, -1.2], [x + 1, -1.2], [x + 1, 3.6], [x - 1, 3.6]] as Point[]);
  const floor = piercedPanel("两套房与后公共短桥连续相接并保留各自私梯井的上层楼板", [0, 3.18, 0], floorOutline, holes, 0.22, concrete);
  floor.vertices = floor.indices!.map(index => ({ ...floor.vertices![index]! })); delete floor.indices;
  const cover = piercedPanel("完整高屋盖沿两套房和后公共桥连续封合并让开中央采光槽", [0, 6.4, 0], [[-9.3, -7.3], [-0.7, -7.3], [-0.7, 4.7], [0.7, 4.7], [0.7, -7.3], [9.3, -7.3], [9.3, 7.3], [-9.3, 7.3]], [], 0.22, roof);
  cover.vertices = cover.indices!.map(index => ({ ...cover.vertices![index]! })); delete cover.indices;
  const parts: ModelPart[] = [box("车库接待横厅与后公共阶共同落地的完整基础地坪", 0, 0.1, 2.725, 18.6, 0.2, 19.75, concrete), floor, cover, box("前中央步行门廊的独立低盖实际接到两库侧墙", 0, 3.29, -3, 2.2, 0.22, 8, roof)];
  const glass: SolidBox[] = [], furnishings: SolidBox[] = [], ceramics: SolidBox[] = [], soft: SolidBox[] = [], posts: SolidBox[] = [];
  const addPane = (axis: "xy" | "yz", offset: number, center: number, bottom: number, width: number, height: number) => glass.push({ center: axis === "xy" ? [center, bottom + height / 2, offset] : [offset, bottom + height / 2, center], size: axis === "xy" ? [width, height, 0.035] : [0.035, height, width] });
  for (const side of [-1, 1]) {
    const x = side * 5, stairX = side * 7.8, left = side < 0 ? -9 : 1, right = side < 0 ? -1 : 9;
    parts.push(wallFace("车库完整宽车行口与其上方套房的实际前窗壁", "xy", -7, openWall(left, right, 0.2, 6.4, x, 3.4, 2.5), [rectangle(x, 4.25, 3.6, 1.5)])); addPane("xy", -7, x, 4.25, 3.6, 1.5);
    const sideWindows = [rectangle(-3, 2, 3, 0.65), rectangle(-3.5, 4.25, 3.5, 1.5), rectangle(3.1, 5, 1.8, 0.8), rectangle(5.4, 1, 2, 1.5)];
    parts.push(wallFace("外侧实承墙分别向下库上宿与后接待厅实际采光", "yz", side * 9, [[-7, 0.2], [7, 0.2], [7, 6.4], [-7, 6.4]], sideWindows));
    for (const [z, bottom, width, height] of [[-3, 2, 3, 0.65], [-3.5, 4.25, 3.5, 1.5], [3.1, 5, 1.8, 0.8], [5.4, 1, 2, 1.5]]) addPane("yz", side * 9, z!, bottom!, width!, height!);
    parts.push(wallFace("中央步行门廊与各独立车库之间真正封合的底层分隔", "yz", side, [[-7, 0.2], [1, 0.2], [1, 3.18], [-7, 3.18]]), wallFace("套房面对中央采光槽且独立进入后公共桥的实门壁", "yz", side, openWall(-7, 7, 3.4, 6.4, 6, 1.2, 2.3), [rectangle(-3.5, 4.5, 3, 1.2)])); addPane("yz", side, -3.5, 4.5, 3, 1.2);
    parts.push(wallFace("各库后端通向公共接待厅且真正避开私梯的独立人行门", "xy", 1, openWall(side < 0 ? -6.8 : 1, side < 0 ? -1 : 6.8, 0.2, 3.18, side * 2.2, 1.1, 2.3)), wallFace("库内后侧进入独立私梯井的真实门", "xy", -1.2, openWall(stairX - 1, stairX + 1, 0.2, 3.18, stairX, 1.1, 2.3)), wallFace("私梯井在接待厅一侧的完整内围壁", "yz", side * 6.8, [[-1.2, 0.2], [3.6, 0.2], [3.6, 3.18], [-1.2, 3.18]]), wallFace("私梯井靠外侧与公共厅实际分开的连续围壁", "yz", side * 8.8, [[-1.2, 0.2], [3.6, 0.2], [3.6, 3.18], [-1.2, 3.18]]), wallFace("私梯井在高端下方封合而不阻塞上层踏面的后壁", "xy", 3.6, [[stairX - 1, 0.2], [stairX + 1, 0.2], [stairX + 1, 3.18], [stairX - 1, 3.18]]), thinStair("车库私梯真实穿过专属楼板井直达本套房的完整上行段", stairX, -1.2));
    for (const edge of [-1, 1]) {
      const px = stairX + edge * 0.775;
      parts.push(rail([px, 1.25, -1.2], [px, 4.45, 3.6], 0.055, roof));
      for (const t of [0, 0.5, 1]) posts.push({ center: [px, 0.2 + 3.2 * t + 0.525, -1.2 + 4.8 * t], size: [0.055, 1.05, 0.055] });
      const gx = stairX + edge * 1.04;
      parts.push(rail([gx, 4.5, -1.24], [gx, 4.5, 3.6], 0.055, roof));
      for (const z of [-1.24, 1.2, 3.6]) posts.push({ center: [gx, 3.95, z], size: [0.055, 1.1, 0.055] });
    }
    parts.push(rail([stairX - 1.04, 4.5, -1.24], [stairX + 1.04, 4.5, -1.24], 0.055, roof));
    const bathLeft = side < 0 ? -6.2 : 3, bathRight = side < 0 ? -3 : 6.2, bathCenter = side * 4.6;
    parts.push(wallFace("各套房湿室真实从后内厅平门进入的独立门壁", "xy", 4.6, openWall(bathLeft, bathRight, 3.4, 6, bathCenter, 1, 2.1), [], 0.14), wallFace("上层湿室与前卧区真正隔开的短厚壁", "xy", 2.2, [[bathLeft, 3.4], [bathRight, 3.4], [bathRight, 6], [bathLeft, 6]], [], 0.14), ...[bathLeft, bathRight].map(px => wallFace("上层套内湿室两侧实际接地封合的短壁", "yz", px, [[2.2, 3.4], [4.6, 3.4], [4.6, 6], [2.2, 6]], [], 0.14)), box("湿室短壁实际接住且让开套房高盖的独立平吊顶", bathCenter, 6.05, 3.4, 3.2, 0.1, 2.4, plaster), cylinder("套内坐便器实际落在本层地面的瓷承座", side * 5.6, 3.6, 3, 0.42, 0.4, plaster), { ...cup("套内承座真正顶住的独立开放瓷碗", [side * 5.6, 3.77, 3], 0.25, 0.2, plaster), scale: { x: 1, y: 1, z: 1.25 } }, box("套内洗手台实际落地且避开湿室门的浅柜", side * 3.6, 3.82, 3.1, 0.65, 0.84, 0.6, timber), { ...cup("套内洗手台面上真正接合的开放浅盆", [side * 3.6, 4.22, 3.1], 0.28, 0.15, plaster), scale: { x: 1, y: 1, z: 0.85 } });
    furnishings.push({ center: [side * 4.5, 3.6, -3.7], size: [2, 0.4, 2.2] }, { center: [side * 4.5, 4, -2.65], size: [2.1, 1.2, 0.12] }, { center: [side * 2, 4.3, -5.5], size: [1, 1.8, 1.5] }, { center: [side * 8, 3.82, -5.5], size: [0.8, 0.84, 2] });
    ceramics.push({ center: [side * 5.6, 3.85, 2.65], size: [0.32, 0.18, 0.4] }, { center: [side * 5.6, 4.15, 2.42], size: [0.5, 0.7, 0.2] });
    soft.push({ center: [side * 4.5, 3.87, -3.7], size: [1.96, 0.14, 2.16] });
    parts.push(box("套房内独立浅备餐柜上真正接合的完整台面", side * 8, 4.28, -5.5, 0.85, 0.08, 2.05, concrete), ...[-1, 1].map(offset => box("车库内离开人员通道的独立矮止轮块", x + offset * 0.9, 0.28, 0.3, 0.6, 0.16, 0.16, concrete)), part("车辆从公共地面真正平缓驶到车库门内地坪的短实坡", "extrude", concrete, [x, 0, 0], [1, 1, 1], [0, -90, 0], { depth: 3.8, profile: [{ x: -8.35, y: 0 }, { x: -7.15, y: 0 }, { x: -7.15, y: 0.2 }] }));
  }
  parts.push(wallFace("接待横厅与上层公共短桥共同封合的真实后门窗墙", "xy", 7, openWall(-9, 9, 0.2, 6.4, 2.5, 1.3, 2.3), [rectangle(0, 3.4, 1.8, 2.3), ...[-5, 5].flatMap(x => [rectangle(x, 1, 3, 1.5), rectangle(x, 4.25, 3, 1.5)])]));
  for (const x of [-5, 5]) for (const y of [1, 4.25]) addPane("xy", 7, x, y, 3, 1.5);
  parts.push(thinStair("从后公共场地直接接进上层公共桥门的独立外服务阶", 0, 11.8, true));
  for (const x of [-0.775, 0.775]) {
    parts.push(rail([x, 1.25, 11.8], [x, 4.45, 7], 0.055, roof));
    for (const t of [0, 0.5, 1]) posts.push({ center: [x, 0.2 + t * 3.2 + 0.525, 11.8 - t * 4.8], size: [0.055, 1.05, 0.055] });
  }
  parts.push(rail([-0.98, 4.5, 5], [0.98, 4.5, 5], 0.055, roof));
  for (const x of [-0.98, 0, 0.98]) posts.push({ center: [x, 3.95, 5], size: [0.055, 1.1, 0.055] });
  for (let start = 0; start < posts.length; start += 18) parts.push(boxesMesh("私梯井上口及内外完整梯段各自实落踏面边的独立护栏柱", roof, posts.slice(start, start + 18)));
  for (let start = 0; start < glass.length; start += 18) parts.push({ ...boxesMesh("各完整外墙真实孔口内独立相接的透明窗片", "#a3c4bd", glass.slice(start, start + 18)), opacity: 0.28, roughness: 0.22 });
  parts.push(boxesMesh("两间套房各自真正落地的床架床头衣柜与备餐柜", timber, furnishings), boxesMesh("各坐便器碗体后侧真实承接的瓷桥与水箱", plaster, ceramics), boxesMesh("各套房木床架上实际贴合的独立织物软垫", fabric, soft), box("后接待横厅避开中央门廊及私梯的完整短前台", -3, 0.75, 5.8, 3, 1.1, 0.8, timber), box("公共前台柜体上真正相接的整片台面", -3, 1.35, 5.8, 3.1, 0.1, 0.9, concrete), box("接待厅后窗前不占公共后门的完整落地等待坐台", 5, 0.425, 6, 3, 0.45, 0.75, timber), part("中央人行门廊由外地面连续接入室内的实际短坡", "extrude", concrete, [0, 0, 0], [1, 1, 1], [0, -90, 0], { depth: 1.7, profile: [{ x: -8.35, y: 0 }, { x: -7.15, y: 0 }, { x: -7.15, y: 0.2 }] }));
  return parts;
}
