import { part, type ModelPart } from "../assetModelParts";
import { glazedWall } from "./modernResidenceSpaceBatchOne";
import { boxesMesh, standingPanel, type SolidBox } from "./publicSpaceBatchEight";
import { stairFlight } from "./publicSpaceBatchTwo";
import { box, design, rail, type ArchitecturePrototype } from "./structures";
import { slopePanel } from "./vernacularWorldBatchOne";
import { hardFloor } from "./vernacularWorldBatchSix";

const paving = "#b7b7a9", pale = "#c9c7b7", steel = "#60787c", warm = "#ad9374", glass = "#a6cbc8";
type Point = [number, number];

export const culturalExhibitionSpaceBatchTwoDesigns: ArchitecturePrototype[] = [
  design("斜贯双楔天光艺术馆", "东西向低楔展厅与南北向高楔在共享十字核心真正交会，斜屋面在接口裁开；上层大洞保留两座深梁跨廊，前后两组实体石阶穿过独立楼板井连接两层，四端真门与高侧窗共同围合完整展馆", crossedWedgeMuseum, "建筑", "现代"),
];

function rectangle(left: number, right: number, bottom: number, top: number): Point[] {
  return [[left, bottom], [right, bottom], [right, top], [left, top]];
}

function lowerRoofAt(x: number): number { return 7.2 + .06 * x; }
function upperRoofAt(z: number): number { return 11 - .05 * z; }

function crossedWedgeMuseum(): ModelPart[] {
  const p: ModelPart[] = [
    hardFloor("十字地面展厅四臂连成完整可行地坪", paving, [[-26, -7.5], [-6, -7.5], [-6, -25], [6, -25], [6, -7.5], [26, -7.5], [26, 7.5], [6, 7.5], [6, 25], [-6, 25], [-6, 7.5], [-26, 7.5]], .3, [0, 0, 0]),
    hardFloor("两条跨厅廊与前后画廊为同一有洞楼板", warm, rectangle(-6, 6, -25, 25), .3, [0, 4.5, 0], [rectangle(-3, 3, -7.5, 7.5), rectangle(1.45, 4.55, -22.1, -10.5), rectangle(-4.55, -1.45, 10.5, 22.1)]),
    slopePanel("西低楔斜屋面在高楔接口实际终止", [[-26.3, lowerRoofAt(-26.3) + .28, -7.8], [-5.88, lowerRoofAt(-5.88) + .28, -7.8], [-5.88, lowerRoofAt(-5.88) + .28, 7.8], [-26.3, lowerRoofAt(-26.3) + .28, 7.8]], .28, steel),
    slopePanel("东高端斜屋面在高楔接口实际裁开", [[5.88, lowerRoofAt(5.88) + .28, -7.8], [26.3, lowerRoofAt(26.3) + .28, -7.8], [26.3, lowerRoofAt(26.3) + .28, 7.8], [5.88, lowerRoofAt(5.88) + .28, 7.8]], .28, steel),
    slopePanel("南北高楔完整长斜盖独立跨越交会核心", [[-6.3, upperRoofAt(-25.3) + .28, -25.3], [6.3, upperRoofAt(-25.3) + .28, -25.3], [6.3, upperRoofAt(25.3) + .28, 25.3], [-6.3, upperRoofAt(25.3) + .28, 25.3]], .28, pale),
    ...glazedWall("西端低楔真正贯通地面展厅的对外门", [-26, -7.5], [-26, 7.5], .3, lowerRoofAt(-26), [[-4.8, 1.4, 3, 2.6], [4.8, 1.4, 3, 2.6]], [[0, .3, 3.6, 3.4]]),
    ...glazedWall("东端高楔真正贯通地面展厅的对外门", [26, -7.5], [26, 7.5], .3, lowerRoofAt(26), [[-4.8, 1.4, 3, 2.6], [4.8, 1.4, 3, 2.6]], [[0, .3, 3.6, 3.4]]),
  ];
  const beams: SolidBox[] = [], posts: SolidBox[] = [];

  for (const z of [-7.5, 7.5]) for (const [left, right] of [[-26, -6], [6, 26]]) {
    const holes = [(left! + right!) / 2 - 5, (left! + right!) / 2 + 5].map(x => rectangle(x - 2.3, x + 2.3, 1.4, 4.1));
    p.push(standingPanel("低楔纵墙贴合斜屋缘并真正开出两扇窗", pale, [[left!, .3], [right!, .3], [right!, lowerRoofAt(right!)], [left!, lowerRoofAt(left!)]], holes, z, .24));
    for (const hole of holes) p.push(part("嵌入低楔斜墙真实窗洞的独立玻璃", "box", glass, [(hole[0]![0] + hole[1]![0]) / 2, 2.75, z], [4.6, 2.7, .045], [0, 0, 0], { opacity: .27, roughness: .2 }));
  }

  for (const side of [-1, 1]) {
    for (const [front, back] of [[-25, -7.5], [7.5, 25]]) {
      const middle = (front! + back!) / 2, holes = [rectangle(middle - 4.8, middle + 4.8, 6.2, 9.1), rectangle(middle - 3.8, middle + 3.8, 1.3, 3.6)];
      const wall = standingPanel("高楔前后整段承墙同时保留上下层真实窗孔", pale, [[front!, .3], [back!, .3], [back!, upperRoofAt(back!)], [front!, upperRoofAt(front!)]], holes, 0, .24);
      wall.rotation.y = -90; wall.position.x = side * 6; p.push(wall);
      for (const [y, height, length] of [[7.65, 2.9, 9.6], [2.45, 2.3, 7.6]]) p.push(part("两层画廊墙孔内独立而不封死房体的玻璃", "box", glass, [side * 6, y!, middle], [.045, height!, length!], [0, 0, 0], { opacity: .27, roughness: .2 }));
    }
    const strip = standingPanel("相交处仅从低屋盖之上起立的高侧采光壁", pale, [[-7.5, lowerRoofAt(side * 6)], [7.5, lowerRoofAt(side * 6)], [7.5, upperRoofAt(7.5)], [-7.5, upperRoofAt(-7.5)]], [rectangle(-5, 5, 8.1, 10.2)], 0, .24);
    strip.rotation.y = -90; strip.position.x = side * 6; p.push(strip, part("高低斜壳交接上方真正透光的天光长窗", "box", glass, [side * 6, 9.15, 0], [.045, 2.1, 10], [0, 0, 0], { opacity: .25, roughness: .2 }));
  }

  for (const end of [-1, 1]) {
    p.push(...glazedWall("高楔端墙地面真门与楼上双窗共同闭合", [-6, end * 25], [6, end * 25], .3, upperRoofAt(end * 25), [[-2.75, 6.2, 3.5, 2.9], [2.75, 6.2, 3.5, 2.9]], [[0, .3, 3.6, 3.4]]));
    const stairX = -end * 3, direction = -end;
    for (let flight = 0; flight < 2; flight++) {
      const low = .3 + flight * 2.25, startZ = end * (22 - flight * 6);
      p.push(stairFlight("前后画廊各自通过真实楼板井的连续石阶", stairX, low, startZ, 2.8, 10, .225, .5, end > 0));
      if (flight) p.push(box("上段石阶下从地坪起立的真实石承体", stairX, 1.425, startZ + direction * 2.5, 2.8, 2.25, 5, paving));
      else p.push(box("两段石阶之间足宽且落地的真实休息台", stairX, 1.425, startZ + direction * 5.5, 2.8, 2.25, 1, paving));
      for (const side of [-1, 1]) {
        p.push(rail([stairX + side * 1.36, low + .95, startZ], [stairX + side * 1.36, low + 3.2, startZ + direction * 5], .07, steel));
        for (let index = 0; index <= 5; index++) posts.push({ center: [stairX + side * 1.36, low + .525 + index * .45, startZ + direction * index], size: [.065, 1.05, .065] });
      }
    }
    p.push(box("石阶最上端真正接到楼板井边的短平台", stairX, 4.65, end * 10.75, 2.8, .3, .5, warm));
    for (const x of [-5.8, 5.8]) beams.push({ center: [x, 2.4, end * 7.8], size: [.35, 4.2, .4] });
    beams.push({ center: [0, 4.1, end * 7.8], size: [12, .8, .45] });
  }

  for (const x of [-4.5, 4.5]) beams.push({ center: [x, 4.1, 0], size: [2.8, .8, 15.6] });
  for (const x of [-24, -16, -8, 8, 16, 24]) beams.push({ center: [x, lowerRoofAt(x) - .25, 0], size: [.3, .5, 15.1] });
  for (const z of [-22, -12, 0, 12, 22]) beams.push({ center: [0, upperRoofAt(z) - .325, z], size: [12.1, .65, .3] });
  for (let index = 0; index < beams.length; index += 20) p.push(boxesMesh("全部保留真实跨廊深梁端承柱及两向屋架横梁", steel, beams.slice(index, index + 20)));

  const guardSegments = [
    [-3.05, -7.5, -3.05, 7.5], [3.05, -7.5, 3.05, 7.5], [-3.05, -7.55, 3.05, -7.55], [-3.05, 7.55, 3.05, 7.55],
    [1.4, -22.15, 4.6, -22.15], [1.4, -22.15, 1.4, -10.5], [4.6, -22.15, 4.6, -10.5],
    [-4.6, 22.15, -1.4, 22.15], [-4.6, 10.5, -4.6, 22.15], [-1.4, 10.5, -1.4, 22.15],
  ];
  for (const [x0, z0, x1, z1] of guardSegments) {
    p.push(rail([x0!, 5.85, z0!], [x1!, 5.85, z1!], .07, steel));
    const count = Math.max(1, Math.ceil(Math.hypot(x1! - x0!, z1! - z0!) / 2.5));
    for (let index = 0; index <= count; index++) posts.push({ center: [x0! + (x1! - x0!) * index / count, 5.325, z0! + (z1! - z0!) * index / count], size: [.065, 1.05, .065] });
  }
  for (let index = 0; index < posts.length; index += 20) p.push(boxesMesh("楼板大洞石阶井与连续阶梯的全部实体栏柱", steel, posts.slice(index, index + 20)));

  for (const x of [-18, 18]) for (const z of [-5.6, 5.6]) p.push(box("低楔展厅不遮断十字主通路的独立展墙", x, 1.95, z, 7.5, 3.3, .16, pale));
  p.push(box("南画廊让出东侧阶井的独立落地展台", -1.5, 5.9, -17.5, 2, 2.2, 4, warm), box("北画廊让出西侧阶井的独立落地展台", 1.5, 5.9, 17.5, 2, 2.2, 4, warm));
  return p;
}
