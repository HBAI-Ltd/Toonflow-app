import { part, ring, type ModelPart, type Triple } from "../assetModelParts";
import { combineMeshes, leaf, needle } from "../natureParts";
import { polygon } from "../masterNature/shared";
import { box, colors, cylinder, design, pipe } from "./structures";

// 只表现可见构造，不提供流量、净化效率或防渗性能模拟。
// https://www.usbr.gov/tsc/techreferences/mands/wmm/chap08_10.html
// https://www.usbr.gov/tsc/techreferences/computer%20software/software/coanda/
// https://www.epa.gov/landfills/frequent-questions-about-landfills
// https://wetlandinfo.detsi.qld.gov.au/wetlands/management/treatment-systems/for-agriculture/treatment-sys-nav-page/floating-wetlands/design-summary.html
const stone = "#a1ac9f", liner = "#586d65", steel = "#82968e";

function quadMesh(name: string, faces: Triple[][], color: string): ModelPart {
  const vertices: { x: number; y: number; z: number }[] = [], indices: number[] = [];
  for (const face of faces) {
    const n = vertices.length;
    vertices.push(...face.map(([x, y, z]) => ({ x, y, z })));
    indices.push(n, n + 1, n + 2, n, n + 2, n + 3);
  }
  return part(name, "mesh", color, [0, 0, 0], [1, 1, 1], [0, 0, 0], { vertices, indices });
}

function slab(name: string, corners: Triple[], thickness: number, color: string): ModelPart {
  const p = [...corners, ...corners.map(([x, y, z]): Triple => [x, y - thickness, z])];
  return quadMesh(name, [[0, 3, 2, 1], [4, 5, 6, 7], [0, 1, 5, 4], [1, 2, 6, 5], [2, 3, 7, 6], [3, 0, 4, 7]].map(face => face.map(i => p[i]!)), color);
}

function basinFrame(name: string, innerLow: Triple, innerHigh: Triple, outerLow: Triple, outerHigh: Triple, color: string): ModelPart {
  const ringPoints = ([w, d, y]: Triple): Triple[] => [[-w / 2, y, -d / 2], [w / 2, y, -d / 2], [w / 2, y, d / 2], [-w / 2, y, d / 2]];
  const [il, ih, ol, oh] = [innerLow, innerHigh, outerLow, outerHigh].map(ringPoints), faces: Triple[][] = [];
  for (let i = 0; i < 4; i++) { const j = (i + 1) % 4; faces.push([ol![i]!, oh![i]!, oh![j]!, ol![j]!], [il![i]!, il![j]!, ih![j]!, ih![i]!], [ih![i]!, ih![j]!, oh![j]!, oh![i]!], [il![i]!, ol![i]!, ol![j]!, il![j]!]); }
  return quadMesh(name, faces, color);
}

export const landscapeSpaceBatchEightDesigns = [
  design("防渗垃圾填埋库盆", "完整边坡库盆内铺独立防渗层，鱼骨集水导管汇入低位检修井，侧边石阶与上缘检修桥连通库底和库缘", () => {
    const parts: ModelPart[] = [box("填埋库盆的连续承托地基", 0, .5, 0, 72, 1, 100, colors.earth), basinFrame("四角闭合且内侧真实下凹的库盆土堤", [48, 76, 1], [68, 96, 13], [72, 100, 0], [72, 100, 13], colors.earth), box("库底连续防渗底衬", 0, 1.02, 0, 48, .04, 76, liner), basinFrame("贴合全部边坡的独立薄防渗衬层", [47.96, 75.96, 1.035], [67.96, 95.96, 13.035], [48, 76, 1.02], [68, 96, 13.02], liner), pipe("沿库底通向检修井的集水主管", [0, 1.2, -36], [0, 1.2, 38], .28)];
    for (const z of [-30, -18, -6, 6, 18, 30]) for (const side of [-1, 1]) parts.push(pipe("向中央主管汇流的鱼骨支管", [side * 21, 1.35, z - 5], [0, 1.2, z], .16));
    const well = ring("库端开放检修井完整筒壁", stone, 1, .18, 0, 3.6); well.position = { x: 0, y: 2.8, z: 38 }; parts.push(well, cylinder("检修井完整底板", 0, 1.05, 38, 2, .1));
    const steps = Array.from({ length: 60 }, (_, i) => { const y = 1 + (i + 1) * .2, z = -12 + i * .28; return slab("从库底落地支承的独立完整石级", [[-22.25, y, z], [-20.75, y, z], [-20.75, y, z + .28], [-22.25, y, z + .28]], y - 1, stone); });
    // ACT: 保留全部60级并按20级合批，避免长阶轮廓的共线盖面退化，单片480顶点。
    for (let i = 0; i < steps.length; i += 20) parts.push(combineMeshes("库底通向高位检修桥的完整石阶分组", stone, steps.slice(i, i + 20)));
    parts.push(box("石阶顶与库缘相接的检修桥板", -28.5, 13.08, 4.8, 15, .16, 1.6, stone), ...[-1, 1].map(s => pipe("检修桥两侧连续扶手", [-36, 14.2, 4.8 + s * .7], [-21, 14.2, 4.8 + s * .7], .065)), box("检修桥内侧落地承柱", -22, 7, 4.8, .3, 12, .3, stone));
    for (const side of [-1, 1]) for (const x of [-35.8, -28.5, -21.2]) parts.push(pipe("检修桥扶手真实接到桥板的独立短柱", [x, 13.16, 4.8 + side * .7], [x, 14.2, 4.8 + side * .7], .065));
    return parts;
  }, "建筑", "现代"),
  design("巴歇尔喉道量水渠", "上游收缩段接窄直喉段，喉底下落后在扩散段缓升，两个独立侧井与标尺观察不同位置水头，水面只作静态示意", () => {
    const sections: { z: number; width: number; y: number }[] = [{ z: -12, width: 10, y: 1.2 }, { z: -2, width: 3, y: 1.2 }, { z: 2, width: 3, y: .4 }, { z: 12, width: 9, y: .75 }];
    const parts: ModelPart[] = [box("量水渠完整水平基础", 0, .1, 0, 12, .2, 25)];
    for (let i = 0; i < sections.length - 1; i++) {
      const a = sections[i]!, b = sections[i + 1]!;
      parts.push(slab("真实收缩喉降扩散的承水渠底", [[-a.width / 2, a.y, a.z], [a.width / 2, a.y, a.z], [b.width / 2, b.y, b.z], [-b.width / 2, b.y, b.z]], .25, stone));
      for (const s of [-1, 1]) {
        const panel: Triple[] = [[s * a.width / 2, a.y + 2, a.z], [s * (a.width / 2 + .25), a.y + 2, a.z], [s * (b.width / 2 + .25), b.y + 2, b.z], [s * b.width / 2, b.y + 2, b.z]];
        parts.push(slab("沿渠道边界形成真实厚度的侧墙", s === 1 ? panel : panel.reverse(), 2, stone));
      }
      parts.push(slab("随渠底标高过渡的静态水层", [[-a.width / 2 + .08, a.y + .65, a.z], [a.width / 2 - .08, a.y + .65, a.z], [b.width / 2 - .08, b.y + .65, b.z], [-b.width / 2 + .08, b.y + .65, b.z]], .018, colors.water));
    }
    for (const [x, z, floor] of [[-4.2, -8, 1.2], [2.3, .5, .7]]) {
      const well = ring("与水头观测位置对应的侧井筒", stone, .45, .1, 0, 2); well.position = { x: x!, y: floor! + .7, z: z! }; parts.push(well, box("观测井旁立式水位标尺板", x! + .5, floor! + .9, z!, .12, 1.8, .05, "#d5d8bd"), cylinder("侧井筒独立落地基础", x!, .5, z!, 1, 1, stone), pipe("量水渠与侧井相通的水头引管", [x! + (x! < 0 ? .6 : -.7), floor! + .25, z!], [x!, floor! + .25, z!], .07));
      for (let i = 0; i < 9; i++) parts.push(box("标尺分度实体短横档", x! + .5, floor! + .1 + i * .2, z! - .035, .1, .018, .015, steel));
    }
    return parts;
  }, "建筑", "现代"),
  design("曲面水力筛取水堰", "水从高位堰唇进入向下弯曲的开放筛面，筛下集水腔与末端越流排杂槽分开，可见独立细筛条和筛下空间", () => {
    const parts: ModelPart[] = [box("取水堰与集水腔的连续基础", 0, .15, 1.3, 18, .3, 8.5), box("筛面上端的完整进水承台", 0, 3.2, -2.3, 17, 5.8, 2.6), box("上游堰唇", 0, 6.22, -.99, 16.8, .18, .25, stone), box("筛下集水腔开放前挡墙", 0, .95, 4.45, 17, 1.3, .25, stone)];
    const curve = (t: number): [number, number] => [-1 + t * 5, 6.3 - 4.3 * t * t];
    const wires: ModelPart[] = [];
    for (let i = 0; i < 200; i++) {
      const [za, ya] = curve(i / 200), [zb, yb] = curve((i + .72) / 200);
      wires.push(slab("两端实际搭入侧壁且保留真实狭缝的独立筛条", [[-8.1, ya, za], [8.1, ya, za], [8.1, yb, zb], [-8.1, yb, zb]], .03, steel));
    }
    for (let i = 0; i < wires.length; i += 20) parts.push(combineMeshes("完整曲面筛条分组", steel, wires.slice(i, i + 20)));
    const profile = [{ x: 1, y: .3 }, ...Array.from({ length: 10 }, (_, i) => { const [z, y] = curve(i / 9); return { x: -z, y: y + .25 }; }), { x: -4, y: .3 }];
    for (const s of [-1, 1]) parts.push(part("随筛面曲率收合的两端厚侧壁", "extrude", stone, [s * 8.2, 0, 0], [1, 1, 1], [0, 90, 0], { depth: .3, profile }));
    parts.push(box("越流排杂槽完整底板", 0, .65, 5.2, 17, .2, 1.1, stone), ...[-1, 1].map(s => box("排杂槽左右侧边", s * 8.4, 1.1, 5.2, .2, .8, 1.1, stone)), pipe("筛下集水侧向出水主管", [7.9, .95, 2.8], [11, .7, 2.8], .4));
    return parts;
  }, "建筑", "现代"),
  design("悬根浮动湿地净化床", "周边浮筒承托真实开孔植垫，挺水茎叶生长在孔位而细根悬挂在植垫下方，四角锚缆约束横向漂移", () => {
    const holes: [number, number][][] = [-1, 1].flatMap(x => [-1, 1].map(z => [[x * 3.3 - 1, z * 2.1 - 1], [x * 3.3 + 1, z * 2.1 - 1], [x * 3.3 + 1, z * 2.1 + 1], [x * 3.3 - 1, z * 2.1 + 1]] as [number, number][]));
    const deck = polygon("拥有四个贯通种植孔的浮垫框", liner, [[-6.7, -4.7], [6.7, -4.7], [6.7, 4.7], [-6.7, 4.7]], .16, [0, 2.12, 0], holes);
    deck.vertices = deck.indices!.map(i => deck.vertices![i]!); delete deck.indices;
    const parts: ModelPart[] = [deck, ...[-1, 1].map(s => cylinder("沿长边承托植垫的封闭浮筒", s * 6.55, 2, 0, .6, 9.2, liner, [90, 0, 0])), ...[-1, 1].map(s => cylinder("沿短边承托植垫的封闭浮筒", 0, 2, s * 4.55, .6, 13.1, liner, [0, 0, 90]))];
    const stems: ModelPart[] = [], leaves: ModelPart[] = [], roots: ModelPart[] = [], plantSupports: ModelPart[] = [];
    for (const x of [-3.3, 3.3]) for (const z of [-2.1, 2.1]) {
      for (let row = 0; row < 4; row++) { const pz = z + (row - 1.5) * .42; plantSupports.push(slab("穿孔内两端搭入浮框且托住茎根的稀疏载植横梁", [[x - 1.05, 2.18, pz - .05], [x + 1.05, 2.18, pz - .05], [x + 1.05, 2.18, pz + .05], [x - 1.05, 2.18, pz + .05]], .08, liner)); }
      for (let i = 0; i < 16; i++) {
        const px = x + (i % 4 - 1.5) * .42, pz = z + (Math.floor(i / 4) - 1.5) * .42, top = 3.25 + i % 3 * .16;
        stems.push(needle("穿过浮垫孔位的挺水茎", "#849568", [px, 2.1, pz], [px + .05, top, pz - .04], .025));
        const upper = (2.65 - 2.1) / (top - 2.1), lower = (2.48 - 2.1) / (top - 2.1);
        leaves.push(leaf("叶根实际插入倾斜茎节的狭长叶片", "#7f9b65", [px + .05 * upper, 2.65, pz - .04 * upper], .1, .72, [-30, i * 83, 0]), leaf("叶根实际接入另一侧倾斜茎节的挺水尖叶", "#8eaa72", [px + .05 * lower, 2.48, pz - .04 * lower], .11, .68, [-38, i * 83 + 160, 0]));
        if (i % 2 === 0) roots.push(needle("植垫下方真实悬空的细根束", "#80765d", [px, 2.12, pz], [px + .12, .45 + i % 3 * .13, pz - .08], .028));
      }
    }
    parts.push(combineMeshes("四个通孔内稀疏载植横梁合批", liner, plantSupports), combineMeshes("整床挺水茎群", "#849568", stems), combineMeshes("植垫下悬挂根系", "#80765d", roots));
    for (let i = 0; i < leaves.length; i += 40) parts.push(combineMeshes("根系对应的窄叶群", i % 80 ? "#8eaa72" : "#7f9b65", leaves.slice(i, i + 40)));
    for (const x of [-1, 1]) for (const z of [-1, 1]) parts.push(box("水下四角压载锚块", x * 8.5, .12, z * 6.5, .9, .24, .9, stone), pipe("允许浮床上下位移的斜向系泊缆", [x * 6.5, 2, z * 4.5], [x * 8.5, .24, z * 6.5], .035));
    return parts;
  }, "建筑", "现代"),
];
