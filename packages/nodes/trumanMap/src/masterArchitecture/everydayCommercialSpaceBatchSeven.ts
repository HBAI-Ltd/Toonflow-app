import { beam, part, type ModelPart } from "../assetModelParts";
import { boxesMesh, standingPanel, type SolidBox } from "./publicSpaceBatchEight";
import { design, type ArchitecturePrototype } from "./structures";
import { slopePanel } from "./vernacularWorldBatchOne";
import { hardFloor } from "./vernacularWorldBatchSix";

const paving = "#b7bbb0", wall = "#d0cfbe", steel = "#718582", dark = "#4d6264", pale = "#c5cebd", wood = "#a28e6c", glass = "#a3c8c4";
type Point = [number, number];

export const everydayCommercialSpaceBatchSevenDesigns: ArchitecturePrototype[] = [
  design("外展折谷屋自助洗衣店", "前窄后展的梯形店壳以两片实际平面屋壳收向纵谷，双前门绕中央折衣台通向后洗护机列；独立后维护室从机列旁真门和后巷门进入，所有洗护机都保留实际圆孔和内筒", valleyRoofLaunderette, "建筑", "现代"),
];

function rectangle(left: number, right: number, bottom: number, top: number): Point[] {
  return [[left, bottom], [right, bottom], [right, top], [left, top]];
}

function roofAt(x: number, z: number): number { return 3.6 + .06 * (z + 8) + .12 * Math.abs(x); }

function valleyRoofLaunderette(): ModelPart[] {
  const p: ModelPart[] = [hardFloor("前窄后展洗衣店完整梯形落地楼面", paving, [[-5, -8], [5, -8], [8, 8], [-8, 8]], .3, [0, 0, 0])];
  for (const side of [-1, 1]) p.push(slopePanel("从高边收向中央纵谷的真实厚折屋面", [[0, roofAt(0, -8.3) + .22, -8.3], [side * 5.3, roofAt(side * 5.3, -8.3) + .22, -8.3], [side * 8.3, roofAt(side * 8.3, 8.3) + .22, 8.3], [0, roofAt(0, 8.3) + .22, 8.3]], .22, steel));
  p.push(standingPanel("洗衣店实际双前门的折谷端立面", wall, [[-5, .3], [-2.9, .3], [-2.9, 2.9], [-1.5, 2.9], [-1.5, .3], [1.5, .3], [1.5, 2.9], [2.9, 2.9], [2.9, .3], [5, .3], [5, roofAt(5, -8)], [0, roofAt(0, -8)], [-5, roofAt(-5, -8)]], [rectangle(-4.6, -3.4, .8, 2.6), rectangle(-.9, .9, .8, 2.6), rectangle(3.4, 4.6, .8, 2.6)], -8, .2));
  for (const x of [-4, 0, 4]) p.push(part("前门两旁及中央真实窗孔内独立玻璃", "box", glass, [x, 1.7, -8], [x === 0 ? 1.8 : 1.2, 1.8, .035], [0, 0, 0], { opacity: .24, roughness: .2 }));
  p.push(standingPanel("后维护室独立后巷门的折谷端立面", wall, [[-8, .3], [-.65, .3], [-.65, 2.9], [.65, 2.9], [.65, .3], [8, .3], [8, roofAt(8, 8)], [0, roofAt(0, 8)], [-8, roofAt(-8, 8)]], [rectangle(-6.5, -2, 3.3, 4.2), rectangle(2, 6.5, 3.3, 4.2)], 8, .2));
  for (const x of [-4.25, 4.25]) p.push(part("后维护室真实高窗内独立透明玻璃", "box", glass, [x, 3.75, 8], [4.5, .9, .035], [0, 0, 0], { opacity: .25, roughness: .2 }));

  const length = Math.hypot(3, 16);
  for (const side of [-1, 1]) {
    const yaw = -Math.atan2(16, side * 3) * 180 / Math.PI;
    const shell = standingPanel("向后张开的斜侧壁真实贴合上升屋缘", wall, [[0, .3], [length, .3], [length, roofAt(side * 8, 8)], [0, roofAt(side * 5, -8)]], [rectangle(2, length - 2, 2.1, 3.3)], 0, .2);
    shell.position.x = side * 5; shell.position.z = -8; shell.rotation.y = yaw; p.push(shell, part("斜侧壁贯通长窗内独立透明玻璃", "box", glass, [side * 6.5, 2.7, 0], [length - 4, 1.2, .035], [0, yaw, 0], { opacity: .24, roughness: .2 }));
  }
  const halfWidth = 5 + (6.3 + 8) * 3 / 16;
  p.push(standingPanel("洗护机列旁通向后维护条带的真实工作门", wall, [[-halfWidth, .3], [6.05, .3], [6.05, 2.9], [7.15, 2.9], [7.15, .3], [halfWidth, .3], [halfWidth, roofAt(halfWidth, 6.3)], [0, roofAt(0, 6.3)], [-halfWidth, roofAt(-halfWidth, 6.3)]], [], 6.3, .16));

  const cases: SolidBox[] = [], controls: SolidBox[] = [], furniture: SolidBox[] = [], structure: SolidBox[] = [];
  for (const x of [-5.5, -3.3, -1.1, 1.1, 3.3, 5.5]) {
    const circle: Point[] = Array.from({ length: 16 }, (_, index) => { const angle = index * Math.PI / 8; return [Math.cos(angle) * .34, .9 + Math.sin(angle) * .34]; });
    const front = standingPanel("洗护机前面真正挖穿圆形门孔的柜板", pale, rectangle(-.55, .55, .3, 1.65), [circle], 4.9, .07); front.position.x = x; p.push(front);
    cases.push({ center: [x, .335, 5.4], size: [1.1, .07, 1] }, { center: [x, 1.615, 5.4], size: [1.1, .07, 1] }, { center: [x, .975, 5.865], size: [1.1, 1.35, .07] });
    for (const side of [-1, 1]) cases.push({ center: [x + side * .515, .975, 5.4], size: [.07, 1.35, 1] });
    p.push(part("洗护机真实杯形滚筒与后盘", "lathe", steel, [x, .9, 5.35], [1, 1, 1], [90, 0, 0], { profile: [{ x: .33, y: -.42 }, { x: .33, y: .42 }, { x: 0, y: .42 }, { x: 0, y: .39 }, { x: .3, y: .39 }, { x: .3, y: -.42 }, { x: .33, y: -.42 }] }), part("前圆孔与内筒之间真实连续的密封门圈", "lathe", dark, [x, .9, 4.9], [1, 1, 1], [90, 0, 0], { profile: [{ x: .305, y: -.04 }, { x: .37, y: -.04 }, { x: .37, y: .04 }, { x: .305, y: .04 }, { x: .305, y: -.04 }] }), part("可透视实际内筒的独立圆门玻璃", "cylinder", glass, [x, .9, 4.855], [.62, .025, .62], [90, 0, 0], { opacity: .17, roughness: .15 }));
    controls.push({ center: [x, 1.46, 4.85], size: [.72, .15, .04] });
  }
  for (let index = 0; index < cases.length; index += 20) p.push(boxesMesh("六台洗护机真实接地且保留圆筒空腔的柜壳", pale, cases.slice(index, index + 20)));
  p.push(boxesMesh("洗护机前板上真实接合的操作带", steel, controls));

  for (const side of [-1, 1]) furniture.push({ center: [side * .56, 1.1, -2], size: [.88, .1, 5] }, { center: [side * .8, .675, -2], size: [.14, .75, 4.6] });
  furniture.push({ center: [-4.1, .55, -5.5], size: [.7, .5, 2] }, { center: [-4.5, .95, -5.5], size: [.14, .9, 2] });
  p.push(boxesMesh("双前门之间中央折衣台及侧边等候座", wood, furniture));
  for (const z of [-7.5, -1.5, 5.8, 7.7]) {
    const width = 5 + (z + 8) * 3 / 16;
    for (const side of [-1, 1]) {
      const start = [0, roofAt(0, z) - .12, z], end = [side * width, roofAt(side * width, z) - .12, z];
      const dx = end[0]! - start[0]!, dy = end[1]! - start[1]!, run = Math.hypot(dx, dy);
      p.push(part("两片折屋面下逐跨真实连接高边与中谷的斜梁", "box", steel, [(start[0]! + end[0]!) / 2, (start[1]! + end[1]!) / 2, z], [run, .24, .16], [0, 0, Math.atan2(dy, dx) * 180 / Math.PI]));
    }
    if (z < 7) structure.push({ center: [0, roofAt(0, z) / 2 + .15, z], size: [.14, roofAt(0, z) - .3, .14] });
  }
  p.push(boxesMesh("中谷折屋架真实落在店内地坪的独立承柱", steel, structure));
  p.push(beam("跨过后工作门通道并把末榀屋架接回端墙的纵谷梁", steel, [0, roofAt(0, 5.8) - .14, 5.8], [0, roofAt(0, 8) - .14, 8], .22, .3));
  return p;
}
