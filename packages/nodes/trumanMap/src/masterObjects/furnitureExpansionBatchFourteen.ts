import { Euler, Quaternion, Vector3 } from "three";
import { part, type ModelPart, type Triple } from "../assetModelParts";
import { box, cylinder, rod, loop, plate, cog, piercedPanel, material, type MasterPrototype } from "./parts";

const safeColor = "#465158";

function circle(x: number, z: number, radius: number): [number, number][] {
  return Array.from({ length: 8 }, (_, index): [number, number] => { const a = index * Math.PI / 4; return [x + Math.cos(a) * radius, z + Math.sin(a) * radius]; });
}

function hardPanel(name: string, position: Triple, outline: [number, number][], holes: [number, number][][], thickness: number, rotation: Triple = [0, 0, 0]): ModelPart {
  const value = piercedPanel(name, position, outline, holes, thickness, safeColor, rotation);
  const vertices = value.indices!.map(index => ({ ...value.vertices![index]! }));
  return { ...value, vertices, indices: vertices.map((_, index) => index) };
}

function sleeve(name: string, position: Triple, radius: number, inside: number, length: number, rotation: Triple = [0, 0, 0]): ModelPart {
  return part(name, "lathe", material.steel, position, [1, 1, 1], rotation, { profile: [{ x: inside, y: -length / 2 }, { x: radius, y: -length / 2 }, { x: radius, y: length / 2 }, { x: inside, y: length / 2 }, { x: inside, y: -length / 2 }] });
}

function doorPart(value: ModelPart): ModelPart {
  const angle = 64 * Math.PI / 180, axis = new Vector3(0, 1, 0), degrees = Math.PI / 180;
  const position = new Vector3(value.position.x + .07, value.position.y, value.position.z).applyAxisAngle(axis, angle);
  const rotation = new Euler().setFromQuaternion(new Quaternion().setFromAxisAngle(axis, angle).multiply(new Quaternion().setFromEuler(new Euler(value.rotation.x * degrees, value.rotation.y * degrees, value.rotation.z * degrees))));
  return { ...value, position: { x: position.x - .56, y: position.y, z: position.z - .445 }, rotation: { x: rotation.x / degrees, y: rotation.y / degrees, z: rotation.z / degrees } };
}

export const furnitureExpansionBatchFourteenObjects: MasterPrototype[] = [
  { name: "重门多栓保险柜", theme: "现代", itemType: "家具", build: () => {
    const boltHeights = [.36, .825, 1.29], boltColumns = [.3, .69];
    const sideOutline: [number, number][] = [[-.1, -.405], [-1.55, -.405], [-1.55, .405], [-.1, .405]];
    const capOutline: [number, number][] = [[-.445, -.405], [.445, -.405], [.445, .405], [-.445, .405]];
    const parts: ModelPart[] = [box("直接承重而没有虚空脚柱的完整厚底座", [0, .05, 0], [1.12, .1, .86], safeColor), ...[-.52, .445].map(x => hardPanel("三处侧向锁孔真正穿透厚壁的独立柜侧板", [x, 0, 0], sideOutline, boltHeights.map(y => circle(-y, -.35, .021)), .075, [0, 0, -90])), ...[.1, 1.475].map(y => hardPanel("为上下锁栓保留真实孔腔的柜顶底厚板", [0, y, 0], capOutline, boltColumns.map(x => circle(x - .49, -.35, .021)), .075)), box("保持柜内空腔而真正封闭后端的厚背壁", [0, .825, .3675], [.89, 1.3, .075], safeColor)];
    parts.push(...[-1, 1].map(side => box("从柜壁前伸并承接重门止口的侧门框", [side * .4825, .825, -.4245], [.075, 1.45, .059], safeColor)), ...[.1375, 1.5125].map(y => box("与侧框实接而不填死柜口的上下止口梁", [0, y, -.4245], [.89, .075, .059], safeColor)), ...[-1, 1].map(side => box("沿侧止口连续接合的薄橡胶门封", [side * .452, .825, -.457], [.014, 1.3, .006], material.dark)), ...[.168, 1.482].map(y => box("与侧门封端部相接的上下密封条", [0, y, -.457], [.918, .014, .006], material.dark)), ...[.62, 1.06].map(y => box("两端实际接到柜侧壁而保留前方取物空间的厚层板", [0, y, .025], [.89, .025, .55], material.steel)));
    for (const y of [.32, .825, 1.33]) {
      parts.push(cylinder("贯穿三个铰节而位于柜体外侧的重门轴销", [-.56, y, -.445], [.045, .24, .045], material.steel));
      for (const offset of [-.07, .07]) parts.push(sleeve("固定门框上的上下环形铰节", [-.56, y + offset, -.445], .04, .024, .06), box("避开轴孔并把固定铰节实焊到门框的厚铰叶", [-.4935, y + offset, -.445], [.077, .055, .06], material.steel));
    }
    const doorHoles = [circle(.495, -.825, .026), circle(.495, -1.18, .0095)];
    const leaf: ModelPart[] = [hardPanel("带真实双轴孔的厚重外门面", [0, 0, -.065], [[.015, -.155], [.975, -.155], [.975, -1.495], [.015, -1.495]], doorHoles, .05, [90, 0, 0]), hardPanel("比门面内缩而能进入柜口的厚背阶块", [0, 0, -.015], [[.08, -.215], [.91, -.215], [.91, -1.435], [.08, -1.435]], doorHoles, .068, [90, 0, 0]), hardPanel("承接全部锁杆导套而不遮住轴孔的后机板", [0, 0, .053], [[.05, -.185], [.93, -.185], [.93, -1.465], [.05, -1.465]], doorHoles, .012, [90, 0, 0])];
    for (const y of [.32, .825, 1.33]) leaf.push(sleeve("随重门转动而保持轴孔贯通的中央铰节", [-.07, y, 0], .04, .024, .08), box("从铰节外缘接入门面的厚铰叶", [.054, y, -.025], [.192, .09, .04], material.steel));
    leaf.push(rod("实际穿过门体轴孔并接入后锁盘的手轮主轴", [.495, .825, -.185], [.495, .825, .125], .044, material.steel), cylinder("包住手轮根轴并压在门面上的外轴座", [.495, .825, -.11], [.09, .11, .09], material.steel, [90, 0, 0]), loop("由四辐条固定而保持中央透空的锁定手轮", [.495, .825, -.18], .175, .018, [90, 0, 0], material.steel));
    for (let index = 0; index < 4; index++) { const a = index * Math.PI / 2; leaf.push(rod("锁定手轮中心轴到外环的实体辐条", [.495, .825, -.18], [.495 + Math.cos(a) * .168, .825 + Math.sin(a) * .168, -.18], .015, material.steel)); }
    leaf.push(cylinder("独立密码转盘压在厚门面上的金属座圈", [.495, 1.18, -.085], [.11, .04, .11], material.steel, [90, 0, 0]), { ...cog("有真实齿缘而非平面标签的密码调节盘", [.495, 1.18, -.111], .047, .014), color: material.dark }, plate("密码盘上方固定在门面的三角指针", [.495, 1.265, -.0675], [[-.012, 0], [.012, 0], [0, -.018]], .005, material.steel, [0, 0, 0]), rod("从密码盘穿过第二门孔的独立细锁轴", [.495, 1.18, -.11], [.495, 1.18, .1], .014, material.steel), box("密码细轴背面实际压接门后板的机械锁盒", [.495, 1.18, .085], [.14, .12, .04], material.steel), rod("从锁盒伸到上方锁杆的机械挡止舌", [.55, 1.235, .1], [.55, 1.35, .1], .014, material.steel), cylinder("由手轮主轴带动且真正压接连杆的后转盘", [.495, .825, .108], [.15, .026, .15], material.steel, [90, 0, 0]), ...[.14, .85].map(x => box("连接三只水平重栓的整体竖滑杆", [x, .825, .09], [.04, .98, .04], material.steel)), ...[.3, 1.35].map(y => box("同时带动两只竖向重栓的整体横滑杆", [.495, y, .09], [.5, .04, .04], material.steel)));
    const links: [Triple, Triple][] = [[[.555, .845, .105], [.85, .825, .105]], [[.435, .805, .105], [.14, .825, .105]], [[.475, .885, .105], [.28, 1.35, .105]], [[.515, .765, .105], [.62, .3, .105]]];
    for (const [start, end] of links) leaf.push(rod("转盘偏心销与对应滑杆之间的真实传力连杆", start, end, .017, material.steel), cylinder("把连杆锁在转盘上的独立偏心短销", start, [.025, .025, .025], material.steel, [90, 0, 0]));
    for (const y of boltHeights) for (const side of [-1, 1]) { const x = side < 0 ? .14 : .85, end = side < 0 ? 0 : 1, guide = side < 0 ? .065 : .925; leaf.push(rod("由同侧滑杆贯通到门边之外的圆柱重锁栓", [x, y, .095], [end, y, .095], .035, material.steel), sleeve("实际接触后机板并允许侧锁栓穿行的中空导套", [guide, y, .095], .031, .019, .05, [0, 0, -90])); }
    for (const x of boltColumns) for (const side of [-1, 1]) { const start = side < 0 ? .3 : 1.35, end = side < 0 ? .11 : 1.54, guide = side < 0 ? .21 : 1.445; leaf.push(rod("由上下横滑杆推动并伸入顶底锁孔的圆柱重栓", [x, start, .095], [x, end, .095], .035, material.steel), sleeve("实际接触后机板且不填死竖栓通道的中空导套", [x, guide, .095], .031, .019, .055)); }
    parts.push(...leaf.map(doorPart));
    return parts.map(value => value.color === material.steel ? { ...value, roughness: .38, metalness: .65 } : value);
  } },
];
