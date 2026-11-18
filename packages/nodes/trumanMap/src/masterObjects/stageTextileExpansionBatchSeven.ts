import { part, ring, type ModelPart } from "../assetModelParts";
import { box, cylinder, rod, material, type MasterPrototype } from "./parts";

const paper = "#e2dfd2", frame = "#39444c";

function paperSweep(): ModelPart {
  const half = .00075, radius = .075 + half, turn = .65;
  const stations: { y: number; z: number; ny: number; nz: number }[] = [];
  for (let step = 2; step >= 0; step--) {
    const a = step * Math.PI / 12;
    stations.push({ y: 2.8 + Math.sin(a) * radius, z: Math.cos(a) * radius, ny: Math.sin(a), nz: Math.cos(a) });
  }
  stations.push({ y: turn + half, z: radius, ny: 0, nz: 1 });
  for (let step = 1; step <= 16; step++) {
    const a = step * Math.PI / 32;
    stations.push({ y: turn + half - Math.sin(a) * turn, z: radius + turn - Math.cos(a) * turn, ny: Math.sin(a), nz: Math.cos(a) });
  }
  stations.push({ y: half, z: 2.6, ny: 1, nz: 0 });
  const vertices: NonNullable<ModelPart["vertices"]> = [], indices: number[] = [];
  const edge = (station: typeof stations[number], x: number, side: number) => ({ x, y: station.y + station.ny * half * side, z: station.z + station.nz * half * side });
  // ACT: 同一连续薄壳分别留出正反面、两条厚边和两端盖的法线接缝，弧面不靠重叠平板拼接。
  for (let face = 0; face < 4; face++) {
    const start = vertices.length;
    for (const station of stations) {
      if (face < 2) vertices.push(edge(station, -1.36, face ? -1 : 1), edge(station, 1.36, face ? -1 : 1));
      else vertices.push(edge(station, face === 2 ? -1.36 : 1.36, 1), edge(station, face === 2 ? -1.36 : 1.36, -1));
    }
    for (let index = 0; index < stations.length - 1; index++) {
      const a = start + index * 2, b = a + 1, c = a + 2, d = a + 3;
      indices.push(...(face === 0 || face === 3 ? [a, c, b, b, c, d] : [a, b, c, b, d, c]));
    }
  }
  for (const end of [0, stations.length - 1]) {
    const station = stations[end]!, start = vertices.length;
    vertices.push(edge(station, -1.36, 1), edge(station, 1.36, 1), edge(station, 1.36, -1), edge(station, -1.36, -1));
    indices.push(...(end ? [start, start + 2, start + 1, start, start + 3, start + 2] : [start, start + 1, start + 2, start, start + 2, start + 3]));
  }
  return part("从纸卷切线垂落并连续转弧铺到地面的有厚度摄影纸", "mesh", paper, [0, 0, 0], [1, 1, 1], [0, 0, 0], { vertices, indices, roughness: .94 });
}

// 双伸缩柱与通轴结构参考 Manfrotto 1314B；2.72米原生卷纸宽度参考 Savage 107英寸无缝背景纸。
// https://www.manfrotto.com/global-uk/photo-stand-support-bag-and-spring-complete-set-1314b/
// https://savageuniversal.com/us-en/white-seamless-background-paper-107-w-x-36-l-sa-50-12/
export const stageTextileExpansionBatchSevenObjects: MasterPrototype[] = [
  { name: "双柱卷纸摄影背景架", theme: "现代", itemType: "设施", build: () => {
    const parts: ModelPart[] = [
      cylinder("真实贯穿左右承轴座和纸芯的整根横向卷纸轴", [0, 2.8, 0], [.032, 3.24, .032], material.steel, [0, 0, 90]),
      ring("包在轴外而两端真实敞口的厚纸芯筒", material.wood, .034, .007, 0, 2.77, { position: { x: 0, y: 2.8, z: 0 }, rotation: { x: 0, y: 0, z: 90 } }),
      ring("绕在纸芯外而非实心堵住轴孔的整幅背景纸卷", paper, .075, .041, 0, 2.72, { position: { x: 0, y: 2.8, z: 0 }, rotation: { x: 0, y: 0, z: 90 }, roughness: .94 }),
      ...[-1, 1].map(side => cylinder("藏在芯筒内把纸芯重量传回横轴的端部撑芯衬套", [side * 1.28, 2.8, 0], [.054, .12, .054], frame, [0, 0, 90])),
      paperSweep(),
    ];
    for (const side of [-1, 1]) {
      const x = side * 1.56;
      parts.push(cylinder("落在三角腿组中央的固定外立管", [x, .78, 0], [.052, 1.28, .052], frame), cylinder("从粗管内伸出的中段升降管", [x, 1.78, 0], [.038, 1.22, .038], frame), cylinder("连接上承轴座且仍插在中管内的细伸缩管", [x, 2.4625, 0], [.026, .625, .026], frame), ...[.205, .5].map(y => cylinder("真实环抱立管并铰接腿杆的三脚架滑动根套", [x, y, 0], [.084, .07, .084], frame)));
      for (const y of [1.42, 2.39]) parts.push(cylinder("伸缩管接头上锁住升降段的厚管口套", [x, y, 0], [.067, .055, .067], frame), rod("实际穿入管口套的侧向锁高螺杆", [x + side * .022, y, 0], [x + side * .105, y, 0], .01, material.steel), box("锁高螺杆外端的手拧翼柄", [x + side * .105, y, 0], [.025, .055, .018], frame));
      for (let index = 0; index < 3; index++) {
        const a = (90 + index * 120) * Math.PI / 180, dx = side * Math.cos(a), dz = Math.sin(a);
        parts.push(rod("从上根套斜展到地面的独立摄影架腿", [x, .5, 0], [x + dx * .64, .05, dz * .64], .036, frame), box("每根架腿末端实际接地的橡胶脚套", [x + dx * .64, .025, dz * .64], [.09, .05, .09], frame), rod("下滑套接到斜腿中段而不穿过纸幕的折叠连撑", [x, .205, 0], [x + dx * .29, .5 - .45 * .29 / .64, dz * .29], .016, frame));
      }
      parts.push(ring("内柱顶端真正承住整根横轴的贯通圆轴座", frame, .031, .015, 0, .08, { position: { x, y: 2.8, z: 0 }, rotation: { x: 0, y: 0, z: 90 } }), rod("从承轴座外侧锁住横轴的独立顶紧螺杆", [x, 2.8, .025], [x, 2.8, .1], .009, material.steel), box("顶紧螺杆末端能够握持的短翼柄", [x, 2.8, .1075], [.04, .024, .015], frame));
    }
    return parts;
  } },
];
