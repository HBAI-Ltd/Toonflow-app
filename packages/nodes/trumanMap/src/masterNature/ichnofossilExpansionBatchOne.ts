import { combineMeshes, design, lobe, polygon, tapered, type MasterNatureDesign, type ModelPart, type Triple } from "./shared";
import { prism } from "./geologicStructureExpansionBatchOne";

// 原创差异侵蚀出露的沉积充填潜穴铸体，不含造迹动物，不把旧活体换成石材。
// 古陆河狸潜穴： https://www.nps.gov/subjects/fossils/see-fossils-in-situ.htm
// https://www.nps.gov/agfo/learn/nature/geology.htm
// 多层箱网潜穴： https://ichnology.ku.edu/invertebrate_traces/tfimages/thalassinoides.html
// 深井巢室潜穴： https://ichnology.ku.edu/invertebrate_traces/tfimages/camborygma.html
// 管径、井深及巢室均为米制；保留围岩是地质出露，不是展示支架。

function daemonelix(): ModelPart[] {
  const matrix = "#a99d83", cast = "#c6b18a";
  const spiral: Triple[] = Array.from({ length: 57 }, (_, index) => {
    const angle = index / 56 * Math.PI * 6.5;
    return [Math.cos(angle) * .32, 2.65 - index / 56 * 2.16, Math.sin(angle) * .32];
  });
  const bottom = spiral.at(-1)!;
  return [
    polygon("含潜穴铸体的差异侵蚀砂岩基底", matrix, [[-.71, -.63], [.55, -.59], [1.65, .42], [1.65, 1.26], [.77, 1.43], [-.61, .61]], .2),
    tapered("剥蚀后留在螺旋内侧的原有围岩柱", matrix, [[0, .16, 0], [0, 2.59, 0]], [.274, .248]),
    tapered("古陆河狸连续三圈多的螺旋下降潜穴充填", cast, spiral, spiral.map(() => .085)),
    tapered("螺旋井底部弯向侧方巢室的连续巷道", cast, [bottom, [.2, .33, .61], [.72, .28, .86], [1.16, .3, .96]], [.085, .105, .13, .12]),
    lobe("井底侧向巷道终端完整的扩张巢室充填", cast, [1.16, .3, .96], [.8, .52, .56]),
  ];
}

function thalassinoides(): ModelPart[] {
  const cast = "#c4b38e", matrix = "#a59f87";
  const lower: Triple[] = [[-1.26, .32, -.85], [-.46, .33, -.45], [.45, .31, -.8], [1.24, .32, -.2], [.76, .33, .79], [-.15, .34, 1.2], [-1.18, .32, .55], [-.25, .34, .22]];
  const upper: Triple[] = [[-.81, 1.05, -.31], [.2, 1.03, -.61], [.81, 1.1, .32], [-.3, 1.02, .75]];
  const tubes: ModelPart[] = [];
  for (const [a, b] of [[0, 1], [1, 2], [2, 3], [3, 4], [4, 5], [5, 6], [6, 0], [1, 7], [7, 4], [7, 6]] as [number, number][]) tubes.push(tapered("下层平面中呈Y与T分叉的圆柱巷道", cast, [lower[a]!, lower[b]!], [.073, .073]));
  for (const [a, b] of [[0, 1], [1, 2], [2, 3], [3, 0]] as [number, number][]) tubes.push(tapered("上层不规则闭合的圆柱巷道", cast, [upper[a]!, upper[b]!], [.068, .068]));
  for (const [a, b] of [[1, 0], [4, 2], [6, 3]] as [number, number][]) tubes.push(tapered("真实贯通上下两层箱网的竖向井道", cast, [lower[a]!, upper[b]!], [.073, .068]));
  for (const index of [0, 2]) {
    const node = upper[index]!;
    tubes.push(tapered("从上层分叉点延至古床面的竖井充填", cast, [node, [node[0] + .06, 1.48, node[2] + .03]], [.068, .068]));
  }
  const joints = [...lower, ...upper].map(node => lobe("分叉汇流位置稍扩张的圆滑节点", cast, node, [.205, .205, .205]));
  return [
    polygon("多层潜穴网下部保留的原位砂岩床", matrix, [[-1.62, -1.12], [.36, -1.16], [1.64, -.58], [1.58, 1.18], [.3, 1.52], [-1.57, .95]], .3),
    combineMeshes("两层圆滑分枝管与三处竖井构成的完整三维箱网", cast, tubes),
    combineMeshes("完整潜穴箱网中相接的圆滑分叉节点", cast, joints),
  ];
}

function camborygma(): ModelPart[] {
  const cast = "#c5ad87", matrix = "#a69379";
  const wall = prism("后方差异侵蚀残留的洪泛平原围岩", matrix, [[-.24, .15], [.29, .15], [.31, 1.21], [.23, 2.73], [-.13, 2.64], [-.25, 1.34]], .36);
  wall.position.z = -.22;
  const paths: Triple[][] = [
    [[0, 2.59, 0], [-.04, 1.9, .06], [.07, 1.2, -.02], [.03, .4, .05]],
    [[-.024, 1.8, .049], [-.5, 1.5, .3], [-.85, 1.1, .32]],
    [[.046, 1.35, -.003], [.55, 1, -.25], [.95, .6, -.35]],
    [[.033, .45, .046], [-.4, .3, -.25], [-.65, .29, -.55]],
  ];
  const tubes = paths.map((path, index) => tapered(index === 0 ? "螯虾潜穴自古床面下行的完整深竖井" : "从深井分叉到膨室的侧向支巷", cast, path, path.map(() => index === 0 ? .057 : .052)));
  const chambers = [[-.85, 1.1, .32], [.95, .6, -.35], [-.65, .29, -.55]].map(node => lobe("深井分支终端保存的扩张巢室", cast, node as Triple, [.34, .25, .32]));
  const marks: ModelPart[] = [];
  for (let index = 0; index < 8; index++) {
    const y = 1.22 + index * .155, a = y < 1.9 ? paths[0]![2]! : paths[0]![1]!, b = y < 1.9 ? paths[0]![1]! : paths[0]![0]!, t = (y - a[1]) / (b[1] - a[1]), x = a[0] + (b[0] - a[0]) * t, z = a[2] + (b[2] - a[2]) * t;
    marks.push(tapered("潜穴泥壁保存的短斜刮痕脊", cast, [[x - .027, y - .014, z + .043], [x + .027, y + .012, z + .043]], [.009, .009]));
  }
  return [
    polygon("承接深潜穴下端的洪泛平原沉积基底", matrix, [[-1.14, -.91], [.61, -.88], [1.33, -.42], [1.21, .66], [-.4, .9], [-1.12, .43]], .24),
    wall,
    combineMeshes("真实相交的长竖井与三条侧向巷道", cast, tubes),
    combineMeshes("三处支巷末端接合的膨室充填", cast, chambers),
    combineMeshes("留在井壁上的短斜刮痕脊列", cast, marks),
  ];
}

export const ichnofossilExpansionBatchOneDesigns: MasterNatureDesign[] = [
  design("daemonelixBeaverBurrowCast", "古陆河狸螺旋潜穴铸体", "岩石", daemonelix, ["Daemonelix", "Palaeocastor造迹", "螺旋下降井与底侧巢室", "约2.7米高原位出露"]),
  design("thalassinoidesBoxworkCast", "海生分枝潜穴三维箱网", "岩石", thalassinoides, ["Thalassinoides", "多层圆滑分枝巷道", "竖井贯通的完整箱网", "原位潜穴充填遗迹"]),
  design("camborygmaDeepChamberBurrow", "螯虾深井巢室潜穴铸体", "岩石", camborygma, ["Camborygma", "陆相淡水造迹", "深竖井与多支巷膨室", "古洪泛平原原位出露"]),
];
