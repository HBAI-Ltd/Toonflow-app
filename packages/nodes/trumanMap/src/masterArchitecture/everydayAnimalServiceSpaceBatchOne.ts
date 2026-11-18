import { part, type ModelPart, type Triple } from "../assetModelParts";
import { polygon } from "../masterNature/shared";
import { box, colors, design, type ArchitecturePrototype } from "./structures";
import { doorway, standingPanel } from "./publicSpaceBatchOne";
import { boxesMesh, type SolidBox } from "./publicSpaceBatchEight";

const wallColor = "#b5b8aa";
const floorColor = "#afa793";
const roofColor = "#526a70";
const quietColor = "#92a69c";

function glazedWall(name: string, position: Triple, width: number, height: number, windowWidth: number, sill: number, windowHeight: number, yaw = 0): ModelPart[] {
  const value = standingPanel(name, wallColor, [[-width / 2, 0], [width / 2, 0], [width / 2, height], [-width / 2, height]], [[[-windowWidth / 2, sill], [windowWidth / 2, sill], [windowWidth / 2, sill + windowHeight], [-windowWidth / 2, sill + windowHeight]]], 0, 0.24);
  value.position = { x: position[0], y: position[1], z: position[2] }; value.rotation.y = yaw;
  return [value, part(`${name}真窗孔内的透明围护`, "box", colors.glass, [position[0], position[1] + sill + windowHeight / 2, position[2]], [windowWidth, windowHeight, 0.035], [0, yaw, 0], { opacity: 0.24, roughness: 0.18 })];
}

function staggeredVeterinaryClinic(): ModelPart[] {
  const floor = 0.22, wallHeight = 3.6, outline: [number, number][] = [[-13, -9], [-3, -9], [-3, -3], [4, -3], [4, -7], [12, -7], [12, 7], [10.5, 7], [10.5, 9], [12, 9], [12, 13], [6, 13], [6, 9], [7.5, 9], [7.5, 7], [-13, 7]], coreHole: [number, number][] = [[-3.12, -1.12], [3.12, -1.12], [3.12, 3.62], [-3.12, 3.62]], walls: SolidBox[] = [], tables: SolidBox[] = [], supports: SolidBox[] = [];
  const parts: ModelPart[] = [
    box("兽医诊疗楼与分开接患前场共同落地的院坪", -0.5, 0.1, 2, 31, 0.2, 27, floorColor),
    polygon("犬候诊长翼猫候诊短翼后院隔离翼真实错列的完整楼面", floorColor, outline, 0.02, [0, 0.2, 0]),
    polygon("错列全楼屋盖保留中央处置厅真实高窗井口", roofColor, outline, 0.24, [0, floor + wallHeight, 0], [coreHole]),
    box("中央处置厅高于其余诊疗翼的独立顶盖", 0, 4.84, 1.25, 6.24, 0.24, 4.74, roofColor),
    doorway("犬类候诊翼独立朝向前场的低门槛入口", [-8, floor, -9], 10, wallHeight, 1.8, 0, 2.5),
    doorway("猫类短候诊翼独立朝向另一侧前场的入口", [8, floor, -7], 8, wallHeight, 1.5, 0, 2.5),
    doorway("犬类候诊厅真正进入前部诊室公共廊的内门", [-8, floor, -3], 10, wallHeight, 1.6, 0, 2.4),
    doorway("猫类候诊厅真正进入另一段公共廊的内门", [8, floor, -3], 8, wallHeight, 1.4, 0, 2.4),
    doorway("中央处置厅从清洁服务廊进入的独立后门", [0, floor, 3.5], 6, wallHeight, 1.6, 0, 2.4),
    doorway("污物外廊西端直接通向外部服务院的门", [-13, floor, 6.25], 1.5, wallHeight, 1.05, 90, 2.4),
    doorway("污物外廊东端直接通向院外的服务门", [12, floor, 6.25], 1.5, wallHeight, 1.05, 90, 2.4),
    doorway("后院隔离连接前室与服务廊之间的第一道门", [9, floor, 7], 3, wallHeight, 1.3, 0, 2.4),
    doorway("后院隔离连接前室中部独立的第二道门", [9, floor, 8], 3, wallHeight, 1.15, 0, 2.4),
    doorway("后院独立隔离翼真正接到窄连接前室的门", [9, floor, 9], 6, wallHeight, 1.3, 0, 2.4),
    doorway("隔离动物由院外直接进入而绕开候诊厅的侧门", [12, floor, 11], 4, wallHeight, 1.4, 90, 2.4),
  ];
  parts.push(...glazedWall("犬候诊翼外侧完整采光窗墙", [-13, floor, -6], 6, wallHeight, 4.6, 1.0, 1.7, 90), ...glazedWall("猫候诊翼外侧完整采光窗墙", [12, floor, -5], 4, wallHeight, 2.6, 1.0, 1.7, 90), ...glazedWall("西诊疗翼外侧高位采光窗墙", [-13, floor, 1.25], 8.5, wallHeight, 6.8, 1.5, 1.4, 90), ...glazedWall("东诊疗翼外侧高位采光窗墙", [12, floor, 1.25], 8.5, wallHeight, 6.8, 1.5, 1.4, 90), ...glazedWall("隔离翼独立朝后院的完整高窗墙", [9, floor, 13], 6, wallHeight, 4.6, 1.3, 1.5), ...glazedWall("隔离翼与主楼之间院隙旁的封合侧窗墙", [6, floor, 11], 4, wallHeight, 2.6, 1.3, 1.5, 90));
  const transfer = standingPanel("清洁服务廊与污物外廊之间仅留传物窗的完整实墙", wallColor, [[-12.5, 0], [12.5, 0], [12.5, wallHeight], [-12.5, wallHeight]], [[[-0.6, 0.95], [0.6, 0.95], [0.6, 1.65], [-0.6, 1.65]]], 0, 0.2);
  transfer.position = { x: -0.5, y: floor, z: 5.5 }; parts.push(transfer);
  walls.push(
    { center: [-3, floor + wallHeight / 2, -6], size: [0.24, wallHeight, 6] },
    { center: [4, floor + wallHeight / 2, -5], size: [0.24, wallHeight, 4] },
    { center: [0.5, floor + wallHeight / 2, -3], size: [7, wallHeight, 0.24] },
    { center: [0, floor + wallHeight / 2, -2], size: [0.2, wallHeight, 2] },
    { center: [0, floor + wallHeight / 2, -1], size: [6, wallHeight, 0.2] },
    { center: [-3, floor + wallHeight / 2, 1.25], size: [0.2, wallHeight, 4.5] },
    { center: [3, floor + wallHeight / 2, 1.25], size: [0.2, wallHeight, 4.5] },
    { center: [-8, floor + wallHeight / 2, 1.25], size: [0.2, wallHeight, 4.5] },
    { center: [7.5, floor + wallHeight / 2, 1.25], size: [0.2, wallHeight, 4.5] },
    { center: [-2.75, floor + wallHeight / 2, 7], size: [20.5, wallHeight, 0.24] },
    { center: [11.25, floor + wallHeight / 2, 7], size: [1.5, wallHeight, 0.24] },
    { center: [7.5, floor + wallHeight / 2, 8], size: [0.2, wallHeight, 2] },
    { center: [10.5, floor + wallHeight / 2, 8], size: [0.2, wallHeight, 2] },
  );
  for (const [x, width] of [[-10.5, 5], [-5.5, 5], [5.25, 4.5], [9.75, 4.5]]) {
    parts.push(doorway("四间小动物检查房各自朝公共廊的真实门洞", [x!, floor, -1], width!, wallHeight, 1.05, 0, 2.4), doorway("四间检查房各自朝后部清洁服务廊的真实工作门", [x!, floor, 3.5], width!, wallHeight, 1.0, 0, 2.4));
    tables.push({ center: [x!, floor + 0.31, 1.1], size: [0.48, 0.62, 0.62] }, { center: [x!, floor + 0.67, 1.1], size: [x! < 0 ? 1.35 : 1.05, 0.1, 0.64] });
  }
  parts.push(boxesMesh("诊疗楼相互收头并落在实楼面上的完整房间与外廊墙", wallColor, walls), boxesMesh("四间检查房内实际接地承托的小动物短台", quietColor, tables));
  for (const [x, z, width, yaw] of [[0, -1.12, 6.24, 0], [0, 3.62, 6.24, 0], [-3.12, 1.25, 4.74, 90], [3.12, 1.25, 4.74, 90]]) parts.push(...glazedWall("处置厅抬高屋盖下实际封合高低顶差的顶光窗墙", [x!, 3.82, z!], width!, 0.9, width! - 0.4, 0.25, 0.55, yaw!));
  for (const x of [-3, 3]) for (const z of [-1, 3.5]) supports.push({ center: [x, 2.47, z], size: [0.2, 4.5, 0.2] });
  parts.push(boxesMesh("中央高顶处置厅由实楼面一直承到高窗顶梁的竖柱", roofColor, supports), box("中央处置工作岛实接地的封闭底架", 0, 0.62, 1.1, 0.55, 0.8, 1.45, roofColor), box("中央处置工作岛实际受托的窄动物台面", 0, 1.08, 1.1, 0.8, 0.12, 1.65, quietColor), box("清污隔墙传物窗下完整承托的穿墙台", -0.5, 1.19, 5.5, 1.2, 0.08, 0.8, roofColor), box("犬候诊区不堵门线的离地安置长台实心支座", -11, 0.48, -6, 1.1, 0.52, 3.2, quietColor), box("猫候诊区后靠实墙而避开正入口的提笼长台", 5.25, 0.64, -5, 1, 0.84, 2.5, quietColor));
  const kennelWalls: SolidBox[] = [];
  for (const x of [7.6, 9.2]) {
    kennelWalls.push({ center: [x, 0.3, 11.65], size: [1.6, 0.16, 1.7] }, { center: [x, 1.55, 11.65], size: [1.6, 0.14, 1.7] });
    parts.push(doorway("隔离留观位保持真实低门口的独立前围护", [x, 0.38, 10.8], 1.6, 1.1, 0.85, 0, 0.95));
  }
  for (const x of [6.8, 8.4, 10]) kennelWalls.push({ center: [x, 0.96, 11.65], size: [0.08, 1.16, 1.7] });
  kennelWalls.push({ center: [8.4, 0.96, 12.5], size: [3.28, 1.16, 0.08] });
  parts.push(boxesMesh("隔离翼两安置位真实落地底板侧板后板和顶板", quietColor, kennelWalls));
  return parts;
}

function splitLevelPetCareShop(): ModelPart[] {
  const dryFloor = 0.65, roofBase = 4.25, wetRampFloor = 0.3 + 2.7 / 6.2 * 0.05, outline: [number, number][] = [[-8, -10], [8, -10], [8, 11], [-1, 11], [-1, 6], [5, 6], [5, 2], [-1, 2], [-1, -4], [-8, -4]], grates: SolidBox[] = [], tubs: SolidBox[] = [], kennel: SolidBox[] = [], platforms: SolidBox[] = [];
  const parts: ModelPart[] = [
    box("街店湿洗干作静养三段共同落地的完整院坪", 0, 0.1, -0.25, 21, 0.2, 27.5, floorColor),
    polygon("前店高干作台与后静养翼绕开袋院的连续C形实体楼板", floorColor, outline, 0.45, [0, 0.2, 0]),
    polygon("仅盖住C形干区并保留开敞袋院的完整高屋盖", roofColor, outline, 0.24, [0, roofBase, 0]),
    part("湿洗条左侧实际斜向排沟的实体地坪", "extrude", quietColor, [0, 0, 1.5], [1, 1, 1], [0, 0, 0], { depth: 11, profile: [{ x: -8, y: 0.2 }, { x: -7.5, y: 0.2 }, { x: -7.5, y: 0.3 }, { x: -8, y: 0.35 }] }),
    part("湿洗条右侧实际收坡到空排沟的整块实体地坪", "extrude", quietColor, [0, 0, 1.5], [1, 1, 1], [0, 0, 0], { depth: 11, profile: [{ x: -7.2, y: 0.2 }, { x: -1, y: 0.2 }, { x: -1, y: 0.35 }, { x: -7.2, y: 0.3 }] }),
    box("低于两坡地坪而不以黑色贴片代替的实际排沟底", -7.35, 0.21, 1.5, 0.3, 0.02, 11, roofColor),
    box("低位湿洗条具有独立矮剖面的完整屋盖", -4.5, 3.35, 1.5, 7, 0.2, 11, roofColor),
    box("开敞袋院保留真实地面而不填高成室内楼板", 2, 0.21, 4, 6, 0.02, 4, quietColor),
    part("街前从院坪连到抬高店堂门槛的完整实心入坡", "extrude", floorColor, [0, 0, -11.5], [1, 1, 1], [0, -90, 0], { depth: 2.1, profile: [{ x: -1.5, y: 0.19 }, { x: 1.5, y: 0.19 }, { x: 1.5, y: dryFloor }, { x: -1.5, y: 0.2 }] }),
    part("前店经门洞连续降到湿洗区真实地面高度的坡道", "extrude", floorColor, [-4.5, 0, -2.6], [1, 1, 1], [0, -90, 0], { depth: 1.5, profile: [{ x: -1.4, y: 0.2 }, { x: 1.4, y: 0.2 }, { x: 1.4, y: wetRampFloor }, { x: -1.4, y: dryFloor }] }),
    part("湿洗作业结束后实际回升到高干作平台的横向实坡", "extrude", floorColor, [-2.1, 0, -1], [1, 1, 1], [0, 0, 0], { depth: 1.3, profile: [{ x: -1.1, y: 0.2 }, { x: 1.1, y: 0.2 }, { x: 1.1, y: dryFloor }, { x: -1.1, y: 0.3 + 4 / 6.2 * 0.05 }] }),
    part("干作区外门实际下降到低袋院的完整短坡", "extrude", floorColor, [2, 0, 3], [1, 1, 1], [0, -90, 0], { depth: 1.5, profile: [{ x: -1, y: 0.2 }, { x: 1, y: 0.2 }, { x: 1, y: 0.22 }, { x: -1, y: dryFloor }] }),
    part("后静养翼外门由低袋院实际上升的完整短坡", "extrude", floorColor, [2, 0, 5], [1, 1, 1], [0, -90, 0], { depth: 1.5, profile: [{ x: -1, y: 0.2 }, { x: 1, y: 0.2 }, { x: 1, y: dryFloor }, { x: -1, y: 0.22 }] }),
    part("湿洗条后服务门真正回落到外部院坪的同轴短坡", "extrude", floorColor, [-4.5, 0, 7.6], [1, 1, 1], [0, -90, 0], { depth: 1.3, profile: [{ x: -0.6, y: 0.19 }, { x: 0.6, y: 0.19 }, { x: 0.6, y: 0.2 }, { x: -0.6, y: wetRampFloor }] }),
    doorway("前店与低位湿洗条之间接到实坡的门洞", [-4.5, dryFloor, -4], 7, 3.6, 1.45, 0, 2.45),
    doorway("前店直接进入高干作区的独立宽门", [3.5, dryFloor, -4], 9, 3.6, 2.1, 0, 2.5),
    doorway("湿洗条通向高干作平台而与横实坡同轴的门", [-1, dryFloor, -1], 6, 3.6, 1.25, 90, 2.45),
    doorway("低位湿洗条后端直接通向服务院的实际外门", [-4.5, wetRampFloor, 7], 7, 3.25 - wetRampFloor, 1.25, 0, 2.3),
    doorway("高干作区真正开向袋院并接降坡的外门", [2, dryFloor, 2], 6, 3.6, 1.45, 0, 2.4),
    doorway("高干作区直接进入高干廊而不经过湿洗的门", [6.5, dryFloor, 2], 3, 3.6, 1.35, 0, 2.4),
    doorway("绕过低袋院的高干廊真正进入静养翼的门", [6.5, dryFloor, 6], 3, 3.6, 1.2, 0, 2.4),
    doorway("静养翼朝低袋院的真实放风门与上坡相接", [2, dryFloor, 6], 6, 3.6, 1.4, 0, 2.4),
  ];
  const shopfront = standingPanel("前街主门及两侧橱窗洞口构成的完整店面实框", wallColor, [[-8, 0], [-1.05, 0], [-1.05, 2.6], [1.05, 2.6], [1.05, 0], [8, 0], [8, 3.6], [-8, 3.6]], [[[-7.6, 0.7], [-1.5, 0.7], [-1.5, 3], [-7.6, 3]], [[1.5, 0.7], [7.6, 0.7], [7.6, 3], [1.5, 3]]], -10, 0.24);
  shopfront.position.y = dryFloor; parts.push(shopfront);
  for (const side of [-1, 1]) parts.push(part("位于真实店面橱窗孔内的整片玻璃", "box", colors.glass, [side * 4.55, dryFloor + 1.85, -10], [6.1, 2.3, 0.035], [0, 0, 0], { opacity: 0.24 }));
  parts.push(...glazedWall("前店西侧完整临街采光窗墙", [-8, dryFloor, -7], 6, 3.6, 4.7, 0.8, 2.1, 90), ...glazedWall("前店东侧完整临街采光窗墙", [8, dryFloor, -7], 6, 3.6, 4.7, 0.8, 2.1, 90), ...glazedWall("低湿洗条外侧低剖面窗墙", [-8, 0.2, 1.5], 11, 3.05, 9.2, 1.25, 1.2, 90), ...glazedWall("低湿洗条与袋院相邻的实际观察窗墙", [-1, 0.2, 4], 4, 3.05, 2.6, 1.25, 1.2, 90), ...glazedWall("干作间东侧完整高窗墙", [8, dryFloor, -1], 6, 3.6, 4.5, 1.1, 1.7, 90), ...glazedWall("高干廊外侧连续封合窗墙", [8, dryFloor, 4], 4, 3.6, 2.7, 1.0, 1.8, 90), ...glazedWall("高干廊面向低袋院的完整玻璃窗墙", [5, dryFloor, 4], 4, 3.6, 2.7, 1.0, 1.8, 90), ...glazedWall("后静养翼西侧与低屋盖收头的完整侧墙", [-1, dryFloor, 8.5], 5, 3.6, 3.5, 1.3, 1.5, 90), ...glazedWall("后静养翼东侧完整安静高窗墙", [8, dryFloor, 8.5], 5, 3.6, 3.5, 1.3, 1.5, 90), ...glazedWall("后静养翼后侧承托C形高屋盖的窗墙", [3.5, dryFloor, 11], 9, 3.6, 7.2, 1.4, 1.4));
  for (let grate = 0; grate < 28; grate++) grates.push({ center: [-7.35, 0.31, -3.8 + grate * 0.394], size: [0.34, 0.02, 0.045] });
  for (let i = 0; i < grates.length; i += 20) parts.push(boxesMesh("真正跨在空排沟两坡口边而保留格隙的实体栅盖", roofColor, grates.slice(i, i + 20)));
  for (const z of [1.1, 4.75]) {
    tubs.push({ center: [-2.15, 0.48, z], size: [1.7, 0.28, 1.15] }, { center: [-2.15, 0.65, z], size: [1.7, 0.06, 1.15] }, { center: [-1.34, 0.93, z], size: [0.08, 0.5, 1.15] }, { center: [-2.15, 0.93, z - 0.535], size: [1.7, 0.5, 0.08] }, { center: [-2.15, 0.93, z + 0.535], size: [1.7, 0.5, 0.08] }, { center: [-2.96, 0.76, z], size: [0.08, 0.16, 1.15] });
  }
  parts.push(boxesMesh("低位湿洗条内实际落地并保留盆腔与低前沿的两座砖砌洗位", wallColor, tubs));
  for (const x of [1.25, 5.6]) platforms.push({ center: [x, 0.95, -0.7], size: [0.42, 0.6, 0.55] }, { center: [x, 1.3, -0.7], size: [1.1, 0.1, 0.68] });
  platforms.push({ center: [-5.5, 1.05, -7.5], size: [2.5, 0.8, 0.75] }, { center: [5.1, 0.9, -8.5], size: [2.5, 0.5, 0.75] });
  parts.push(boxesMesh("前店交接台与高干作区工作台各自落在真实抬高楼板上的底座台面", quietColor, platforms));
  for (const x of [0.3, 2.1, 3.9]) {
    kennel.push({ center: [x, 0.7, 9.8], size: [1.8, 0.1, 1.6] }, { center: [x, 2.2, 9.8], size: [1.8, 0.1, 1.6] });
    parts.push(doorway("后静养安置位保持真实前门而非实心箱体的围护", [x, 0.75, 9], 1.8, 1.4, 1, 0, 1.2));
  }
  for (const x of [-0.6, 1.2, 3, 4.8]) kennel.push({ center: [x, 1.45, 9.8], size: [0.08, 1.4, 1.6] });
  kennel.push({ center: [2.1, 1.45, 10.6], size: [5.48, 1.4, 0.08] });
  parts.push(boxesMesh("后静养位各隔板真实接到抬高底板顶板与完整背墙", quietColor, kennel), boxesMesh("街前店堂大跨屋盖实际承到左右外墙的横梁", roofColor, [{ center: [0, 4.025, -9.4], size: [16, 0.45, 0.18] }, { center: [0, 4.025, -4.6], size: [16, 0.45, 0.18] }]));
  return parts;
}

export const everydayAnimalServiceSpaceBatchOneDesigns: ArchitecturePrototype[] = [
  design("错列双候诊兽医诊疗楼", "犬类长候诊翼与猫类短候诊翼错列前伸，四间检查房分别接前公共廊与后清洁服务廊，中央处置厅顶光屋盖由真实竖柱承托，后部污物外廊与清洁廊以带传物窗的墙分开，院隙后的隔离翼经双门前室连接并另设院外接患侧门", staggeredVeterinaryClinic, "建筑", "现代"),
  design("湿洗错台宠物洗护寄养店", "前街橱窗店堂和高干作静养翼围成C形开敞袋院，左侧独立低屋盖下的双坡实体地坪收向有真实内腔及格隙栅盖的排沟，连续实坡连接高低洗护区，右侧高干廊绕过湿洗直接进入后静养翼，两道院门均有实际接地坡面", splitLevelPetCareShop, "建筑", "现代"),
];
