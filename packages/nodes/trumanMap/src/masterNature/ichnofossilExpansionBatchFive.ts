import { combineMeshes, design, lobe, polygon, sweptProfile, tapered, type MasterNatureDesign, type ModelPart, type Triple } from "./shared";
import { prism } from "./geologicStructureExpansionBatchOne";

// 原创原位潜穴充填与壁体。保持厘米管径；不以管数、旋转或删除蹼层增加同体主素材。
// https://ichnology.ku.edu/invertebrate_traces/tfimages/diplocraterion.html
// https://ichnology.ku.edu/invertebrate_traces/tfimages/rosselia.html
// https://ichnology.ku.edu/invertebrate_traces/tfimages/asterosoma.html

function diplocraterion(): ModelPart[] {
  const cast = "#c4b28e", matrix = "#a49b82", spreite = "#afa188";
  const path: Triple[] = [[-.16, .81, 0], [-.16, .46, 0], [-.15, .28, 0], [-.1, .2, 0], [0, .17, 0], [.1, .2, 0], [.15, .28, 0], [.16, .46, 0], [.16, .81, 0]];
  const wall = prism("U形潜穴后方原位保留的海相沉积剖面", matrix, [[-.46, .04], [.47, .04], [.43, .87], [.16, .91], [-.45, .85]], .3);
  wall.position.z = -.162;
  const parts: ModelPart[] = [
    polygon("U形潜穴所在的完整沉积基底", matrix, [[-.57, -.42], [.48, -.46], [.61, .16], [.35, .43], [-.55, .36]], .08), wall,
    prism("两条垂直臂之间有实体厚度的完整迁移蹼层", spreite, [[-.147, .81], [-.14, .28], [-.09, .205], [0, .18], [.09, .205], [.14, .28], [.147, .81]], .018),
    tapered("双平行竖臂与底部连续回转的U形潜穴充填", cast, path, path.map(() => .018)),
  ];
  const bands: ModelPart[] = [];
  for (let index = 0; index < 8; index++) {
    const base = .23 + index * .06;
    bands.push(tapered("连在迁移蹼层实体前缘的旧U形层纹", cast, [[-.145, base + .1, .009], [-.1, base + .025, .009], [0, base, .009], [.1, base + .025, .009], [.145, base + .1, .009]], [.002, .002, .002, .002, .002]));
  }
  parts.push(combineMeshes("U形管两臂之间连续保存的迁移层纹", cast, bands),
    combineMeshes("古床面上两处相伴的膨大潜穴口充填", cast, [-1, 1].map(side => lobe("U形潜穴口的半球状扩张", cast, [side * .16, .81, 0], [.08, .05, .07]))));
  return parts;
}

function rosselia(): ModelPart[] {
  const matrix = "#a69e85", dark = "#a5967b", pale = "#c3b28e";
  const bounds = [[.004, .004, .004], [.008, .025, .05], [.012, .05, .09], [.016, .075, .13], [.02, .1, .17], [.024, .125, .21]];
  const parts: ModelPart[] = [
    polygon("同心漏斗潜穴原位保留的沉积基岩", matrix, [[-.46, -.34], [.3, -.44], [.47, -.05], [.39, .44], [-.31, .47], [-.48, .08]], .09),
    sweptProfile("保留四分之一剖露面的完整潜穴外侧围岩", matrix, [[.024, .08], [.38, .08], [.38, .57], [.21, .57], [.125, .29]], Math.PI * 1.5, 16),
    tapered("漏斗中心连续而约铅笔粗的圆柱潜穴充填", pale, [[0, .075, 0], [0, .59, 0]], [.0046, .0046]),
  ];
  for (let layer = 0; layer < bounds.length - 1; layer++) {
    const inner = bounds[layer]!, outer = bounds[layer + 1]!;
    parts.push(sweptProfile("围绕中心细管嵌套且真实相接的漏斗形同心衬层", layer % 2 ? dark : pale, [[inner[0]!, .08], [outer[0]!, .08], [outer[1]!, .29], [outer[2]!, .57], [inner[2]!, .57], [inner[1]!, .29]], Math.PI * 1.5, 16));
  }
  return parts;
}

function asterosoma(): ModelPart[] {
  const cast = "#c1af8b", matrix = "#a49f85";
  const branches: ModelPart[] = [];
  for (let index = 0; index < 8; index++) {
    const a = index * Math.PI / 4 + Math.sin(index * 2.3) * .09, radius = .31 + (index % 3) * .035, y = .31 + Math.sin(index * 1.8) * .035;
    const at = (r: number, height: number, offset = 0): Triple => [Math.cos(a + offset) * r, height, Math.sin(a + offset) * r];
    branches.push(tapered("从同一中心轴分出的膨胀梭状喂食支潜穴", cast, [[0, .36, 0], at(radius * .28, y + .035, -.04), at(radius * .68, y), at(radius, .163, .07)], [.013, .027, .032, .006]));
  }
  return [
    polygon("放射膨室潜穴所在原位砂泥沉积床", matrix, [[-.52, -.38], [.25, -.52], [.55, -.09], [.45, .49], [-.25, .55], [-.56, .07]], .16),
    tapered("连通古床面并接合放射膨室的中央潜穴轴", cast, [[0, .14, 0], [0, .55, 0]], [.022, .018]),
    combineMeshes("中央轴周围相接的完整放射膨室系统", cast, branches),
  ];
}

export const ichnofossilExpansionBatchFiveDesigns: MasterNatureDesign[] = [
  design("diplocraterionVerticalSpreiteCast", "U形潜穴迁移蹼层剖面", "岩石", diplocraterion, ["Diplocraterion", "双竖臂与底部连续U管", "两臂间真实迁移蹼层", "原位海相沉积出露"]),
  design("rosseliaConcentricFunnelSection", "同心漏斗潜穴围岩剖块", "岩石", rosselia, ["Rosselia", "铅笔粗中心管", "五层实体同心漏斗衬层", "保留围岩的剖露遗迹"]),
  design("asterosomaRadiatingBulbCast", "放射膨室潜穴沉积遗迹", "岩石", asterosoma, ["Asterosoma", "中心轴放射的梭状膨室", "支穴末端收为细管", "原位喂食潜穴充填"]),
];
