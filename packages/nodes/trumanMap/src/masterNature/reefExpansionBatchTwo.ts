import { combineMeshes, design, leaf, lobe, polygon, sweptProfile, tapered } from "./shared";
import type { MasterNatureDesign, ModelPart, Triple } from "./shared";

const skeleton = "#a9b7aa";
const living = "#c6ceba";
const coral = "#b7ae91";
const growingTip = "#d3d0b0";

function oval(x: number, y: number, radiusX: number, radiusY: number): [number, number][] {
  return Array.from({ length: 10 }, (_, index) => {
    const angle = index * Math.PI / 5;
    return [x + Math.cos(angle) * radiusX, y + Math.sin(angle) * radiusY];
  });
}

function curvedSkeletonWall(name: string, outline: [number, number][], holes: [number, number][][], radius: number, position: Triple, yaw: number): ModelPart {
  const wall = polygon(name, skeleton, outline, .16, position, holes);
  for (const vertex of wall.vertices!) {
    const angle = vertex.x / radius, depth = radius + vertex.y, height = vertex.z;
    vertex.x = Math.sin(angle) * depth;
    vertex.y = height;
    vertex.z = radius - Math.cos(angle) * depth;
  }
  wall.rotation.y = yaw;
  return wall;
}

// DFO：新生玻璃海绵附着在旧代刚性硅质骨架上，逐代形成有孔道的完整礁丘。
// https://www.pac.dfo-mpo.gc.ca/fm-gp/sustain-soutien/gsr-res/about-gsr-au-sujet-res-eng.html
function glassSpongeReef(): ModelPart[] {
  const foundation = polygon("多代硅质骨骼固结的礁丘基体，宏观孔道上下贯通", skeleton,
    [[-3.3, -.9], [-2.4, -1.7], [-.7, -1.9], [1.4, -1.7], [3.3, -.8], [3.5, .6], [2.2, 1.8], [-.6, 2], [-2.8, 1.2]], .5, [0, 0, 0],
    [oval(-1.7, -.35, .38, .27), oval(.25, -.7, .48, .29), oval(1.6, .55, .4, .31), oval(-.65, .75, .33, .3)]);
  for (const vertex of foundation.vertices!) if (vertex.y > 0) vertex.y += Math.sin(vertex.x * 2.3 + vertex.z) * .08;
  const parts: ModelPart[] = [foundation,
    curvedSkeletonWall("礁丘中拱接而非单根海绵放大的弯曲旧代骨架", [[-1.5, 0], [-1.42, 1.1], [-1, 1.72], [-.57, 1.48], [-.18, 2.02], [.42, 1.73], [.78, 1.95], [1.4, 1.18], [1.5, 0]], [oval(-1.02, .77, .19, .24), oval(-.53, .56, .2, .22), oval(-.05, 1.21, .18, .28), oval(.39, .65, .22, .24), oval(.93, .87, .18, .27)], 1.55, [-1.1, .28, -.52], 13),
    curvedSkeletonWall("礁丘后侧与底部相连的第二片孔洞壳状骨骼", [[-1.35, 0], [-1.32, .86], [-.93, 1.42], [-.42, 1.82], [.14, 1.64], [.63, 1.98], [1.2, 1.13], [1.36, 0]], [oval(-.91, .61, .18, .21), oval(-.35, .93, .21, .25), oval(.18, .47, .19, .21), oval(.62, 1.18, .19, .28), oval(.99, .53, .15, .2)], 1.4, [1.05, .3, .42], -147)];
  // ACT: 保留礁丘的米级骨架通道与新生出水腔；不逐微米重建硅质六射骨针。
  for (const [x, z, height, yaw] of [[-2.25, .2, 1.05, -12], [-.58, -.38, 1.65, 16], [.8, .72, 1.42, -15], [2.1, -.15, 1.22, 11]]) {
    const cup = sweptProfile("旧骨架上长出的玻璃海绵新生薄壁出水杯", living, [[.07, 0], [.15, height! * .24], [.28, height! * .58], [.32, height! * .85], [.29, height!], [.23, height!], [.26, height! * .84], [.22, height! * .57], [.095, height! * .23], [.035, .04]], Math.PI * 2, 24);
    cup.position = { x: x!, y: .33, z: z! }; cup.rotation.z = yaw!;
    parts.push(cup);
  }
  return parts;
}

// NOAA：麋角珊瑚的枝为宽扁掌状，区别鹿角珊瑚的圆柱分枝，可长至约2m高、4m宽。
// https://www.fisheries.noaa.gov/species/elkhorn-coral
function elkhornCoral(): ModelPart[] {
  const parts: ModelPart[] = [sweptProfile("麋角珊瑚整群宽扁主枝共同固着的短粗骨干", coral, [[0, 0], [.26, 0], [.24, .2], [.16, .56], [.15, .8], [0, .82]], Math.PI * 2, 20)];
  const blade: [number, number][] = [[-.065, 0], [.065, 0], [.09, .42], [.23, .8], [.39, 1.09], [.45, 1.36], [.35, 1.33], [.25, 1.14], [.18, 1.03], [.2, 1.4], [.145, 1.59], [.055, 1.51], [.04, 1.26], [-.055, 1.02], [-.17, 1.29], [-.29, 1.37], [-.28, 1.2], [-.16, .84], [-.1, .43]];
  for (const [index, yaw] of [0, 83, 176, 268].entries()) {
    const frond = polygon("有真实分叉空隙而非圆管拼成的宽扁鹿掌主枝", coral, blade, .055, [0, .56 + index % 2 * .08, 0]);
    frond.rotation = { x: -29 - index % 2 * 7, y: yaw, z: index % 2 ? 6 : -4 };
    parts.push(frond);
  }
  for (const side of [-1, 1]) {
    const upper = polygon("主干上方伸出的第二层短而上举的扁枝", coral, [[-.07, 0], [.08, 0], [.12, .39], [.29, .69], [.28, .91], [.19, .82], [.06, .59], [-.02, .9], [-.1, 1.04], [-.17, .97], [-.13, .57]], .047, [side * .05, .75, 0]);
    upper.rotation = { x: -56, y: side * 50, z: side * 9 }; parts.push(upper);
  }
  return parts;
}

// NOAA的竹节鞭珊瑚具有4–5m不分枝长轴及上部卷梢，并非平面扇状珊瑚放大。
// https://oceanexplorer.noaa.gov/expedition-feature/okeanos-ex1903-dailyupdates-june23-media-coral-log/
function bambooWhipCoral(): ModelPart[] {
  const path: Triple[] = Array.from({ length: 49 }, (_, index) => {
    const t = index / 48;
    if (t < .61) return [.03 * Math.sin(t * Math.PI), t * 4.9, .018 * Math.sin(t * Math.PI * 2)];
    const curl = (t - .61) / .39, angle = curl * Math.PI * 3.3, radius = .075 + curl * .23;
    return [.028 + Math.sin(angle) * radius, 2.989 + curl * 1.17, -.012 + radius * (1 - Math.cos(angle))];
  });
  const radii = path.map((_, index) => .011 - index / 48 * .007);
  const parts: ModelPart[] = [lobe("竹节鞭珊瑚黏附岩面的扁平固着盘", "#989e88", [0, .018, 0], [.16, .04, .14]), tapered("贯穿整条不分枝长轴的柔性节间中轴", "#8d9586", path, radii)];
  for (let index = 0; index < path.length - 2; index += 3) {
    const start = path[index]!, end = path[index + 2]!;
    const calcified = path.slice(index, index + 3).map(point => [...point] as Triple);
    const gap = .07;
    calcified[0] = [start[0] + (calcified[1]![0] - start[0]) * gap, start[1] + (calcified[1]![1] - start[1]) * gap, start[2] + (calcified[1]![2] - start[2]) * gap];
    calcified[2] = [end[0] + (calcified[1]![0] - end[0]) * gap, end[1] + (calcified[1]![1] - end[1]) * gap, end[2] + (calcified[1]![2] - end[2]) * gap];
    parts.push(tapered("竹节鞭珊瑚硬质钙化骨节，骨节间保留真实柔性连接间隙", living, calcified, radii.slice(index, index + 3).map(radius => radius * 1.25)));
  }
  const tentacles: ModelPart[] = [];
  for (let node = 0; node < 10; node++) {
    const root = path[7 + node * 4]!, stalk: Triple = [root[0] + .018, root[1] + .004, root[2]];
    parts.push(tapered("鞭轴一侧真正接在骨节上的小型珊瑚个员梗", living, [root, stalk], [.005, .004]));
    for (let ray = 0; ray < 8; ray++) tentacles.push(leaf("八放个员伸展的独立触手", growingTip, stalk, .0025, .012, [65, ray * 45, -65]));
  }
  for (let index = 0; index < tentacles.length; index += 40) parts.push(combineMeshes("鞭轴上的八放个员触手簇", growingTip, tentacles.slice(index, index + 40)));
  return parts;
}

export const reefExpansionBatchTwoDesigns: MasterNatureDesign[] = [
  design("glassSpongeBioherm", "玻璃海绵生物礁孔架", "岩石", glassSpongeReef, ["Glass sponge reef", "旧代刚性硅质骨骼上的新生薄壁海绵", "多代积累形成有宏孔道的礁丘"]),
  design("elkhornAcroporaPalmata", "麋角珊瑚", "动物", elkhornCoral, ["Acropora palmata", "宽扁掌状骨骼分枝与真实叉隙", "大型造礁珊瑚"]),
  design("unbranchedBambooWhipCoral", "竹节鞭珊瑚", "动物", bambooWhipCoral, ["Bamboo whip coral", "不分枝钙质骨节长轴与卷曲梢", "大型深海八放珊瑚"]),
];
