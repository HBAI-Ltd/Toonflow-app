import type { ModelPart } from "../assetModelParts";
import { slab } from "./modernCommercialSpaceBatchOne";
import { glazedWall } from "./modernResidenceSpaceBatchOne";
import { waistStair } from "./publicSpaceBatchFourteen";
import { box, design } from "./structures";

const wall = "#b9bcad", roof = "#6d8984", floor = "#a58c69", glass = "#a8c9c4";
type Point = [number, number];

export const modernResidenceSpaceBatchThreeDesigns = [design(
  "居拱穿庭桥屋",
  "完整中空拱身同时围出两端睡室和高中央起居厅，左右薄底内阶随拱腹升起并接到水平楼面，两处前门分别以外阶入户，开敞庭院从完整住宅下方贯穿",
  () => inhabitedArchResidence(), "建筑", "现代",
)];

function section(name: string, color: string, outline: Point[], depth: number, z = 0, holes: Point[][] = []): ModelPart {
  const value = slab(name, color, outline, depth, [0, 0, 0], holes);
  value.vertices = value.vertices!.map(({ x, y: thickness, z: height }) => ({ x, y: height, z: z + depth / 2 - thickness }));
  return value;
}

function inhabitedArchResidence(): ModelPart[] {
  const outline: Point[] = [[-16, .2], [-12, 2.8], [-9, 3], [-4, 6.1], [4, 6.1], [9, 3], [12, 2.8], [16, .2], [16, 6.5], [9, 7], [4, 10.5], [-4, 10.5], [-9, 7], [-16, 6.5]];
  const centerWindow: Point[] = [[-2.5, 7.4], [2.5, 7.4], [2.5, 9], [-2.5, 9]], leftStairWindow: Point[] = [[-8.6, 4.548], [-4.4, 7.152], [-4.4, 8.452], [-8.6, 5.848]], rightStairWindow = leftStairWindow.map(([x, y]): Point => [-x, y]);
  const rearWindows: Point[][] = [centerWindow, leftStairWindow, rightStairWindow, [[-13.8, 4.3], [-10.2, 4.3], [-10.2, 5.9], [-13.8, 5.9]], [[10.2, 4.3], [13.8, 4.3], [13.8, 5.9], [10.2, 5.9]]];
  const frontDoors: Point[][] = [-1, 1].map(side => [[side * 12 - 1.1, 3.3], [side * 12 + 1.1, 3.3], [side * 12 + 1.1, 5.7], [side * 12 - 1.1, 5.7]]);
  const p: ModelPart[] = [
    box("贯穿居拱下方并接到两处外梯的完整庭坪", 0, .1, -2, 40, .2, 22, "#aeb2a4"),
    section("两端落地支点之间连续承托住宅的折拱屋壳", roof, [[-16, 6.5], [-9, 7], [-4, 10.5], [4, 10.5], [9, 7], [16, 6.5], [16, 6.75], [9, 7.25], [4, 10.75], [-4, 10.75], [-9, 7.25], [-16, 6.75]], 8.4),
    section("西睡室下方接地端与上升拱腹之间的实体承台", wall, [[-16, .2], [-12, 2.8], [-9, 3], [-9, 3.1], [-16, 3.1]], 8),
    section("东睡室下方接地端与上升拱腹之间的实体承台", wall, [[16, .2], [12, 2.8], [9, 3], [9, 3.1], [16, 3.1]], 8),
    box("西端睡室完整水平木楼面", -12.5, 3.2, 0, 7, .2, 8, floor),
    box("东端睡室完整水平木楼面", 12.5, 3.2, 0, 7, .2, 8, floor),
    box("居拱最高处真正平整的中央起居楼面", 0, 6.25, 0, 8, .3, 8, floor),
    section("西侧内阶薄底下方真正随拱腹上升的承阶板", wall, [[-9, 3], [-4, 6.1], [-4, 6.22], [-9, 3.12]], 8),
    section("东侧内阶薄底下方真正随拱腹上升的承阶板", wall, [[4, 6.1], [9, 3], [9, 3.12], [4, 6.22]], 8),
    section("前立面在真实拱腹和屋壳之间保留门窗的完整厚壁", wall, outline, .24, -4, [centerWindow, leftStairWindow, rightStairWindow, ...frontDoors]),
    section("后立面随高低内室真正封合并保留五处透光孔", wall, outline, .24, 4, rearWindows),
  ];
  for (const [z, windows] of [[-4, [centerWindow, leftStairWindow, rightStairWindow]], [4, rearWindows]] as [number, Point[][]][]) for (const window of windows) {
    const pane = section("真实门窗孔内随室内阶程升高的透明窗片", glass, window, .035, z); pane.opacity = .28; pane.roughness = .2; p.push(pane);
  }
  p.push(...glazedWall("西端住宅真正接地且带高窗的完整端壁", [-16, -4], [-16, 4], .2, 6.5, [[0, 4.2, 4.5, 1.8]]), ...glazedWall("东端住宅真正接地且带高窗的完整端壁", [16, 4], [16, -4], .2, 6.5, [[0, 4.2, 4.5, 1.8]]));
  for (const side of [-1, 1]) {
    const steps = waistStair("低睡室通向高起居厅且不堵拱下庭院的完整内阶", 0, 0, 0, 3.6, 18, 3.1 / 18, 5 / 18); steps.rotation.y = side < 0 ? 90 : -90; steps.position = { x: side * 9, y: 3.3, z: 0 }; p.push(steps);
    const guard: Point[] = side < 0 ? [[-9, 3.08], [-4, 6.18], [-4, 7.4], [-9, 4.3]] : [[4, 6.18], [9, 3.08], [9, 4.3], [4, 7.4]];
    for (const z of [-1.76, 1.76]) p.push(section("两侧实接薄底内阶且随阶程上升的低护壁", roof, guard, .08, z));
    p.push(waistStair("庭面沿外阶进入两端前门的完整薄底入户梯", side * 12, .22, -10.2, 2, 20, (3.3 - .22) / 20, .31), box("外阶顶部穿过真实前门接入木楼面的落脚台", side * 12, 3.2, -4, 2, .2, .5, floor));
    for (const edge of [-1, 1]) {
      const outside = section("外梯两边与梯底真正相接的连续低护壁", roof, [[0, 0], [6.2, 3.08], [6.2, 4.3], [0, 1.22]], .08); outside.rotation.y = -90; outside.position = { x: side * 12 + edge * .96, y: 0, z: -10.2 }; p.push(outside);
    }
    p.push(box("两端睡室里实际贴合水平木楼面的独立床座", side * 12.6, 3.53, 1.7, 2.3, .46, 2.8, floor), box("独立床座上贴合的厚织物床垫", side * 12.6, 3.83, 1.7, 2.2, .14, 2.7, "#ccc7b4"));
  }
  p.push(box("高起居厅后侧真正落地的长坐台", 0, 6.65, 1.8, 4.5, .5, 1.2, floor), box("与坐台后边实际接合的完整软靠背", 0, 7.1, 2.32, 4.5, .9, .16, "#8ea99b"));
  return p;
}
