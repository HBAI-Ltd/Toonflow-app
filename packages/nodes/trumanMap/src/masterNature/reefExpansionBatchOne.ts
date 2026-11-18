import { design, lobe, part, polygon } from "./shared";
import type { MasterNatureDesign, ModelPart } from "./shared";

const reefStone = "#b4b6a0";
const shoreStone = "#8e9b88";
const sandTube = "#bcb092";
const microbialStone = "#b4ae93";

// 地貌类型依据NOAA与GBRMPA：接岸裙礁、隔泻湖堡礁、孤立平顶台礁各保留自己的空间关系。
// https://oceanservice.noaa.gov/facts/threecorals.html
// https://elibrary.gbrmpa.gov.au/bitstreams/75aa3d11-f1b6-40ca-b487-ad40e5a66203/download
function reefRelief(name: string, color: string, radiusX: number, radiusZ: number, height: (x: number, z: number) => number): ModelPart {
  const sectors = 32, rings = 8;
  const vertices = [{ x: 0, y: height(0, 0), z: 0 }], indices: number[] = [];
  for (let row = 1; row <= rings; row++) for (let sector = 0; sector < sectors; sector++) {
    const angle = sector * Math.PI * 2 / sectors;
    const edge = 1 + Math.sin(angle * 3) * .045 + Math.cos(angle * 7) * .026;
    const x = Math.cos(angle) * radiusX * row / rings * edge;
    const z = Math.sin(angle) * radiusZ * row / rings * edge;
    const fade = Math.min(1, (1 - row / rings) * 6);
    vertices.push({ x, y: .18 + Math.max(0, height(x, z) - .18) * fade, z });
    const current = 1 + (row - 1) * sectors + sector, next = 1 + (row - 1) * sectors + (sector + 1) % sectors;
    if (row === 1) indices.push(0, next, current);
    else {
      const inner = current - sectors, innerNext = next - sectors;
      indices.push(inner, innerNext, next, inner, next, current);
    }
  }
  // 顶面与侧面分顶点；海坡法线不会被底部封口或悬崖侧面抹平。
  const sideStart = vertices.length, edgeStart = 1 + (rings - 1) * sectors;
  for (let sector = 0; sector < sectors; sector++) {
    const top = vertices[edgeStart + sector]!;
    vertices.push({ ...top }, { x: top.x, y: 0, z: top.z });
  }
  for (let sector = 0; sector < sectors; sector++) {
    const a = sideStart + sector * 2, b = sideStart + (sector + 1) % sectors * 2;
    indices.push(a, b, b + 1, a, b + 1, a + 1);
  }
  const bottomStart = vertices.length;
  for (let sector = 0; sector < sectors; sector++) {
    const top = vertices[edgeStart + sector]!;
    vertices.push({ x: top.x, y: 0, z: top.z });
  }
  const bottomCenter = vertices.length; vertices.push({ x: 0, y: 0, z: 0 });
  for (let sector = 0; sector < sectors; sector++) indices.push(bottomCenter, bottomStart + sector, bottomStart + (sector + 1) % sectors);
  return part(name, "mesh", color, [0, 0, 0], [1, 1, 1], [0, 0, 0], { vertices, indices });
}

function fringingReef(): ModelPart[] {
  const reef = reefRelief("从岩岸直接延伸的宽礁坪及向海倾斜前礁坡", reefStone, 37, 29, (x, z) => {
    const distance = Math.hypot((x + 8) / 30, z / 23);
    const shelf = distance < .78 ? 4.5 + .25 * Math.sin(z * .21) : 4.5 * Math.max(0, 1 - (distance - .78) / .26);
    const drainage = Math.exp(-(((z + 2.4 * Math.sin(x * .13)) / 2.2) ** 2)) * Math.max(0, x + 1) * .075;
    return Math.max(.3, shelf - drainage);
  });
  const headland = reefRelief("与裙礁礁坪相连且未被泻湖分离的岩质岛岸", shoreStone, 19, 20, (x, z) => {
    const height = 15 * Math.max(0, 1 - (x / 20) ** 2 - (z / 22) ** 2) ** .9;
    return .25 + height * (.9 + Math.sin(z * .21 + x * .11) * .1);
  });
  headland.position.x = -17;
  return [reef, headland];
}

function barrierReef(): ModelPart[] {
  const ridge = reefRelief("岸外独立礁脊、陡前礁坡及泻湖一侧缓礁坡", reefStone, 44, 37, (x, z) => {
    const crestX = 20 + Math.sin(z * .09) * 3.2;
    const distance = x - crestX, top = 8.3 + Math.cos(z * .15) * .45;
    const slope = distance > 2.8 ? Math.max(0, 1 - (distance - 2.8) / 10) : distance < -3 ? Math.max(0, 1 - (-distance - 3) / 17) : 1;
    const passage = Math.exp(-(((z - 6.5) / 2.7) ** 2)) * 4.4;
    return .3 + Math.max(0, top * slope - passage);
  });
  const shore = reefRelief("泻湖另一侧独立岩岸，岸脚与堡礁之间保留低底深槽", shoreStone, 11, 30, (x, z) => .25 + 13 * Math.max(0, 1 - (x / 12) ** 2 - (z / 34) ** 2) ** .85);
  shore.position.x = -30;
  return [ridge, shore];
}

function platformReef(): ModelPart[] {
  return [reefRelief("孤立台礁的宽平顶、三处真实浅池和环向外海陡坡", reefStone, 39, 31, (x, z) => {
    const radius = Math.hypot(x / 35, z / 27);
    const table = radius < .72 ? 10.8 : 10.8 * Math.max(0, 1 - (radius - .72) / .29);
    const westPool = 5.2 * Math.exp(-(((x + 10) / 6.5) ** 2) - (z / 5.6) ** 2);
    const northPool = 3.5 * Math.exp(-(((x - 9) / 5.8) ** 2) - ((z + 10) / 5.8) ** 2);
    const southPool = 4 * Math.exp(-(((x - 8) / 5.2) ** 2) - ((z - 9) / 6.3) ** 2);
    return Math.max(.3, table - westPool - northPool - southPool);
  })];
}

function ringPoints(radius: number, count: number, x = 0, z = 0): [number, number][] {
  return Array.from({ length: count }, (_, index) => {
    const angle = index * Math.PI * 2 / count;
    return [x + Math.cos(angle) * radius, z + Math.sin(angle) * radius];
  });
}

// 凝块石是凝块孔架而非叠层石的薄层放大：DBCA区分clotted与laminated内部结构。
// https://library.dbca.wa.gov.au/static/Journals/080485/080485-06.pdf
function thrombolite(): ModelPart[] {
  const outline: [number, number][] = Array.from({ length: 24 }, (_, index) => {
    const angle = index * Math.PI / 12, radius = 1.2 + Math.sin(index * 1.6) * .11;
    return [Math.cos(angle) * radius, Math.sin(angle) * radius * .8];
  });
  const centers = [[-.61, -.22], [-.3, .35], [.12, -.39], [.46, .25], [.72, -.2], [-.07, .03]];
  const holes = centers.map(([x, z], index) => ringPoints(.095 + index % 2 * .023, 8, x!, z!));
  const framework = polygon("凝块之间上下贯通而不是涂黑的真实孔隙骨架", microbialStone, outline, .64, [0, 0, 0], holes);
  for (const vertex of framework.vertices!) if (vertex.y > 0) vertex.y = .52 + Math.sin(vertex.x * 6.7) * .065 + Math.cos(vertex.z * 7.4) * .065;
  const parts: ModelPart[] = [framework];
  for (let index = 0; index < 17; index++) {
    const angle = index * 2.4, radius = .35 + index % 3 * .24;
    const x = Math.cos(angle) * radius, z = Math.sin(angle) * radius * .78;
    if (centers.some(([holeX, holeZ]) => Math.hypot(x - holeX!, z - holeZ!) < .23)) continue;
    const y = .52 + Math.sin(x * 6.7) * .065 + Math.cos(z * 7.4) * .065;
    parts.push(lobe("相互融合且没有规则横向层理的碳酸盐凝块", microbialStone, [x, y + .065, z], [.3, .23, .27]));
  }
  return parts;
}

// JNCC记录砂粒管密集形成30–50cm厚的蜂窝状礁体。只雕刻外露管口，不放大管径。
// https://data.jncc.gov.uk/data/18af713e-3401-485d-b40e-e920f99ef195/UKBAP-BAPHabitats-46-SabellariaAlveolataReefs.pdf
function honeycombWormReef(): ModelPart[] {
  const outline: [number, number][] = [[-.65, -.34], [-.24, -.48], [.24, -.43], [.64, -.25], [.68, .13], [.39, .43], [-.12, .48], [-.59, .27]];
  const fissures = [ringPoints(.055, 9, -.23, .07), ringPoints(.045, 8, .23, -.12), ringPoints(.041, 8, .39, .17)];
  const foundation = polygon("蜂窝管礁共同砂质骨架，潮池排水孔保持贯通", sandTube, outline, .13, [0, 0, 0], fissures);
  const parts: ModelPart[] = [foundation];
  for (let row = 0; row < 4; row++) for (let column = 0; column < 6; column++) {
    const x = (column - 2.5) * .17 + Math.sin(row * 1.7) * .025, z = (row - 1.5) * .18;
    if (fissures.some(points => Math.hypot(x - points.reduce((sum, value) => sum + value[0], 0) / points.length, z - points.reduce((sum, value) => sum + value[1], 0) / points.length) < .12)) continue;
    const holes: [number, number][][] = [];
    for (let tubeRow = 0; tubeRow < 4; tubeRow++) for (let tubeColumn = 0; tubeColumn < 5; tubeColumn++) holes.push(ringPoints(.003, 6, (tubeColumn - 2) * .018 + tubeRow % 2 * .006, (tubeRow - 1.5) * .021));
    const crest = polygon("蜂窝沙管密集固结形成的真实毫米管口群", sandTube, [[-.075, -.059], [-.053, -.079], [.058, -.071], [.079, -.039], [.073, .065], [.012, .08], [-.069, .057]], .17 + (row + column) % 3 * .035, [x, .095, z], holes);
    for (const vertex of crest.vertices!) if (vertex.y > 0) vertex.y += Math.sin(vertex.x * 35 + column) * .012 + Math.cos(vertex.z * 31 + row) * .012;
    parts.push(crest);
  }
  return parts;
}

export const reefExpansionBatchOneDesigns: MasterNatureDesign[] = [
  design("shoreAttachedFringingReef", "接岸裙礁", "岩石", fringingReef, ["Fringing reef", "岩岸直接连接宽礁坪与外海礁坡", "大型海底生物建造地貌"]),
  design("lagoonSeparatedBarrierReef", "离岸堡礁", "岩石", barrierReef, ["Barrier reef", "岩岸与外礁脊之间保留泻湖深槽和横向通道", "大型海底生物建造地貌"]),
  design("isolatedPlatformReef", "孤立平顶台礁", "岩石", platformReef, ["Platform reef", "宽台顶独立浅池与陡外海坡", "大型海底生物建造地貌"]),
  design("clottedThromboliteFramework", "凝块石孔架", "岩石", thrombolite, ["Thrombolite", "无横向薄层的相连凝块和真实贯孔", "微生物碳酸盐建造体"]),
  design("sabellariaHoneycombReef", "蜂窝沙管虫礁", "岩石", honeycombWormReef, ["Sabellaria alveolata reef", "砂质共同礁基与真实毫米蜂窝管口", "海岸生物建造体"]),
];
