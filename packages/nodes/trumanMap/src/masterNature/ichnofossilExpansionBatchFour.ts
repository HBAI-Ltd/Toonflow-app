import { Vector3 } from "three";
import { combineMeshes, design, lobe, part, polygon, tapered, type MasterNatureDesign, type ModelPart, type Triple } from "./shared";
import { prism } from "./geologicStructureExpansionBatchOne";
import { shellTube } from "./invertebrateExpansionBatchOne";

// 真潜穴/壁体与沉积蹼层的原创几何，保留厘米管径，不将微型造迹动物放大。
// https://ichnology.ku.edu/invertebrate_traces/tfimages/zoophycos.html
// https://ichnology.ku.edu/invertebrate_traces/tfimages/ophiomorpha.html
// https://ichnology.ku.edu/invertebrate_traces/tfimages/skolithos.html

function zoophycos(): ModelPart[] {
  const cast = "#bca98c", edge = "#c6b393", matrix = "#a5a087", dark = "#a5977c";
  const count = 49, angle = Math.PI * 4.5, thickness = .012;
  const inner: Triple[] = [], outer: Triple[] = [];
  for (let index = 0; index < count; index++) {
    const progress = index / (count - 1), a = progress * angle, y = .19 + progress * .4, radius = .18 + progress * .3;
    inner.push([Math.cos(a) * .045, y, Math.sin(a) * .045]);
    outer.push([Math.cos(a) * radius, y, Math.sin(a) * radius]);
  }
  const top = inner.flatMap((point, index) => [point, outer[index]!]);
  const vertices = [1, -1].flatMap(side => top.map(([x, y, z]) => ({ x, y: y + side * thickness / 2, z })));
  const indices: number[] = [], topFaces: number[] = [];
  for (let index = 0; index < count - 1; index++) { const a = index * 2, b = a + 1, c = a + 2, d = a + 3; topFaces.push(a, c, b, b, c, d); }
  const boundary = new Map<string, [number, number]>();
  for (let index = 0; index < topFaces.length; index += 3) {
    const a = topFaces[index]!, b = topFaces[index + 1]!, c = topFaces[index + 2]!;
    indices.push(a, b, c, a + top.length, c + top.length, b + top.length);
    for (const [x, y] of [[a, b], [b, c], [c, a]]) { const key = `${Math.min(x!, y!)},${Math.max(x!, y!)}`; if (boundary.has(key)) boundary.delete(key); else boundary.set(key, [x!, y!]); }
  }
  for (const [a, b] of boundary.values()) indices.push(a, b + top.length, b, a, a + top.length, b + top.length);
  const parts: ModelPart[] = [
    polygon("螺旋潜穴蹼层原位出露的海相沉积底床", matrix, [[-.64, -.51], [.4, -.63], [.67, -.16], [.58, .62], [-.36, .69], [-.67, .18]], .15),
    tapered("螺旋层片中心残留的细围岩芯", matrix, [[0, .14, 0], [0, .66, 0]], [.06, .058]),
    part("绕中心轴连成螺旋并有真实厚度的完整蹼状层片", "mesh", cast, [0, 0, 0], [1, 1, 1], [0, 0, 0], { vertices, indices }),
    tapered("沿螺旋层片周缘连续相接的边缘潜穴管", edge, outer, outer.map(() => .018)),
  ];
  const lamellae: ModelPart[] = [];
  for (let index = 2; index < count - 1; index += 2) {
    const a = index / (count - 1) * angle, progress = index / (count - 1), radius = .18 + progress * .3;
    const at = (r: number, offset: number): Triple => [Math.cos(a + offset) * r, .19 + (a + offset) / angle * .4 + .005, Math.sin(a + offset) * r];
    lamellae.push(tapered("从内侧到周缘管呈J形回弯的细蹼层纹脊", dark, [at(.055, -.065), at((radius + .055) / 2, .026), at(radius, 0)], [.003, .003, .003]));
  }
  for (let start = 0; start < lamellae.length; start += 16) parts.push(combineMeshes("螺旋蹼层表面真实接合的J形层纹", dark, lamellae.slice(start, start + 16)));
  return parts;
}

function ophiomorpha(): ModelPart[] {
  const cast = "#c3ad88", matrix = "#a4997e";
  const path: Triple[] = [[0, 1.97, 0], [0, 1.4, .02], [.08, .8, .06], [.36, .38, .08], [.94, .3, .04]];
  const tube = shellTube("连续开口并有光滑内腔的真实颗粒衬壁管体", path, path.map(() => .065), .018, cast);
  const wall = prism("颗粒衬壁潜穴后方保留的古海相砂岩", matrix, [[-.2, .15], [.25, .15], [.24, 1.12], [.12, 2.12], [-.18, 2.03]], .32);
  wall.position.z = -.205;
  const parts: ModelPart[] = [
    polygon("潜穴弯管底段保留的沉积砂岩基底", matrix, [[-.49, -.42], [.9, -.43], [1.24, -.03], [1.08, .57], [-.33, .6]], .24),
    wall,
    tube,
  ];
  const pellets: ModelPart[] = [];
  for (let segment = 0; segment < path.length - 1; segment++) {
    const a = path[segment]!, b = path[segment + 1]!, steps = Math.ceil(new Vector3(...b).distanceTo(new Vector3(...a)) / .07);
    for (let row = 0; row < steps; row++) for (let sector = 0; sector < 6; sector++) {
      const t = (row + .5) / steps, angular = (sector * 8 / 6 + row * .47) % 8, j = Math.floor(angular), s = angular - j, next = (j + 1) % 8;
      const va = tube.vertices![segment * 16 + j]!, vb = tube.vertices![(segment + 1) * 16 + j]!, vc = tube.vertices![segment * 16 + next]!, vd = tube.vertices![(segment + 1) * 16 + next]!;
      const triangle = t + s <= 1 ? [va, vb, vc] : [vc, vb, vd], weights = t + s <= 1 ? [1 - t - s, t, s] : [1 - t, 1 - s, t + s - 1];
      const point = new Vector3();
      triangle.forEach((vertex, index) => point.addScaledVector(new Vector3(vertex!.x, vertex!.y, vertex!.z), weights[index]!));
      const v0 = triangle[0]!, v1 = triangle[1]!, v2 = triangle[2]!, normal = new Vector3(v1.x - v0.x, v1.y - v0.y, v1.z - v0.z).cross(new Vector3(v2.x - v0.x, v2.y - v0.y, v2.z - v0.z)).normalize();
      const center = new Vector3(a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t);
      if (normal.dot(point.clone().sub(center)) < 0) normal.negate();
      point.addScaledVector(normal, .004);
      pellets.push(lobe("胶结在真实外壁三角面且不穿入内腔的沉积颗粒", cast, [point.x, point.y, point.z], [.022, .025, .022]));
    }
  }
  for (let start = 0; start < pellets.length; start += 40) parts.push(combineMeshes("潜穴衬壁外侧相接的胶结颗粒", cast, pellets.slice(start, start + 40)));
  return parts;
}

function skolithosPipeRock(): ModelPart[] {
  const matrix = "#afa489", lining = "#c5b799";
  const positions = [[-.6, -.35, .033], [-.24, .15, .035], [.1, -.25, .029], [.44, .25, .038], [.72, -.05, .032], [-.55, .5, .03], [.14, .58, .034]];
  const holes = positions.map(([x, z, radius]) => Array.from({ length: 8 }, (_, index) => [x! + Math.cos(index * Math.PI / 4) * radius!, z! + Math.sin(index * Math.PI / 4) * radius!] as [number, number]));
  const parts: ModelPart[] = [polygon("含真实平行贯层直潜穴的原位石英砂岩管岩", matrix, [[-.98, -.56], [.68, -.69], [1.07, -.02], [.8, .74], [-.71, .8], [-1.03, .03]], .82, [0, 0, 0], holes)];
  for (const [index, position] of positions.entries()) {
    const [x, z, radius] = position;
    parts.push(shellTube("直潜穴上部断续保存的毫米级光滑薄衬壁", [[x!, .82, z!], [x!, .68 - index * .018, z!]], [radius!, radius!], .002, lining));
    if (index % 2 === 0) parts.push(shellTube("直潜穴下部独立保存而未封堵内腔的薄衬壁", [[x!, .2, z!], [x!, 0, z!]], [radius!, radius!], .002, lining));
  }
  return parts;
}

export const ichnofossilExpansionBatchFourDesigns: MasterNatureDesign[] = [
  design("zoophycosHelicoidSpreite", "螺旋潜穴周管蹼层遗迹", "岩石", zoophycos, ["Zoophycos", "三维螺旋蹼状层片", "连续周缘管与J形层纹", "约1米展开直径"]),
  design("ophiomorphaPelletedLinedTube", "颗粒衬壁潜穴弯管", "岩石", ophiomorpha, ["Ophiomorpha", "原位衬壁潜穴", "真实开口内腔和平滑内壁", "外壁胶结颗粒与连续弯管"]),
  design("skolithosPerforatedPipeRock", "直潜穴贯层管岩", "岩石", skolithosPipeRock, ["Skolithos", "不分枝平行贯层潜穴", "真实孔道与断续薄衬壁", "原位石英砂岩地层"]),
];
