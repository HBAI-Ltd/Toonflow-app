import { part, type ModelPart } from "../assetModelParts";
import { polygon } from "../masterNature/shared";
import { box, design, rail, colors } from "./structures";
import { doorway } from "./publicSpaceBatchOne";
import { stairFlight } from "./publicSpaceBatchTwo";
import { boxesMesh, type SolidBox } from "./publicSpaceBatchEight";

const stone = "#b6b5a7", dark = "#52686a", wood = "#aa926d";

export const publicSpaceBatchElevenDesigns = [
  design("三路分流双庭法院", "前方公共门厅分别进入两间完整审判庭，两侧后廊独立通向审判席，中央受控廊由后部候审室进入庭侧门，三个方向的门位与连廊实际分开", courthouse, "建筑", "现代"),
  design("内街双层盒院商场", "两层分铺营业带围住贯通内街，两道高位桥跨接左右回廊，并列连续公共阶梯实际接到桥边，通高内街上方由完整天光屋面封合", streetMall, "建筑", "现代"),
  design("天井环廊城市旅馆", "两层实分间客房围住贯通采光天井，客房从内侧环廊独立进入，天井中的连续阶梯接到上层开口平台，地层接待门厅连通主入口与内庭", atriumHotel, "建筑", "现代"),
];

function courthouse(): ModelPart[] {
  const p: ModelPart[] = [box("双庭法院全部流线共同落地地坪", 0, .15, 0, 52, .3, 44, stone), doorway("法院公共门厅正面实际主入口", [0, .3, -20], 50, 4.5, 3.6, 0, 3), box("公共门厅完整低位屋盖", 0, 4.95, -15, 50.5, .3, 10.5, dark), box("中央受控廊朝公共门厅的完整封墙", 0, 2.55, -10, 8, 4.5, .24, stone), box("中央受控廊与后候审室共同封顶", 0, 3.75, 5, 8, .3, 30, dark), doorway("后候审室独立受控外门", [0, .3, 20], 8, 3.3, 1.5), doorway("候审室通入中央受控廊的实际隔门", [0, .3, 12], 8, 3.3, 1.3)];
  for (const side of [-1, 1]) {
    const x = side * 13;
    p.push(doorway("公共门厅进入各审判庭的实际旁听门", [x, .3, -10], 18, 6, 2.4), doorway("侧后法官廊进入审判席背后的实际工作门", [x, .3, 10], 18, 6, 1.5), doorway("由中央受控廊进入庭侧的独立门", [side * 4, .3, 3.5], 13, 6, 1.4, 90), box("受控侧门前方的完整庭内侧墙", side * 4, 3.3, -6.5, .24, 6, 7, stone), box("各审判庭完整外侧墙", side * 22, 3.3, 0, .3, 6, 20, stone), box("每个完整审判庭独立高屋盖", x, 6.45, 0, 18.4, .3, 20.4, dark), doorway("两侧后廊各自独立法官入口", [x, .3, 17], 18, 3.3, 1.5), box("后廊外侧独立围墙", side * 22, 1.95, 13.5, .24, 3.3, 7, stone), box("后廊与中央受控空间之间的真实隔墙", side * 4, 1.95, 15, .24, 3.3, 10, stone), box("法官后廊低位完整屋面", x, 3.75, 13.5, 18, .3, 7, dark), box("公共门厅两端封合侧墙", side * 25, 2.55, -15, .24, 4.5, 10, stone), box("公共门厅后缘两端封合短墙", side * 23.5, 2.55, -10, 3, 4.5, .24, stone));
    p.push(box("审判席前方完整抬高地台", x, .7, 7.6, 12, .8, 3.2, wood), box("审判席连排长案", x, 1.55, 7.1, 10.5, .9, 1, dark));
    for (const offset of [-3.5, 3.5]) p.push(box("庭内两方独立当事人席台", x + offset, .8, 1.5, 3.5, 1, 1, wood));
    for (const z of [-7, -5, -3]) p.push(box("公共旁听席与庭审区分开的连续座台", x, .8, z, 12, .4, .75, "#959e8e"));
    p.push(box("旁听区域前端独立低栏", x, .9, -1.5, 13, 1.2, .1, dark), stairFlight("审判地台侧面的实际上行踏步", x - 6.5, .3, 6.3, 1.2, 4, .2, .3));
  }
  return p;
}

function streetMall(): ModelPart[] {
  const outside: [number, number][] = [[-22, -26], [22, -26], [22, 26], [-22, 26]], street: [number, number][] = [[-4, -24], [4, -24], [4, 24], [-4, 24]];
  const p: ModelPart[] = [box("完整内街商场落地楼面", 0, .15, 0, 45, .3, 54, stone), polygon("营业带与二层回廊围出真实通高内街", wood, outside, .25, [0, 4.5, 0], [street]), polygon("商场完整屋盖中部保留连续天光孔", dark, outside, .25, [0, 8.8, 0], [street]), part("贯穿内街上方的完整透明采光顶", "box", colors.glass, [0, 9.08, 0], [8.2, .05, 48.2], [0, 0, 0], { opacity: .25 })];
  for (const z of [-26, 26]) p.push(doorway("内街两端与室外实际贯通的主入口", [0, .3, z], 44, 8.5, 8, 0, 3.5));
  for (const y of [.3, 4.75]) for (const side of [-1, 1]) {
    const height = y === .3 ? 4.2 : 4.05;
    for (const z of [-52 / 3, 0, 52 / 3]) p.push(doorway("独立商铺直接面向公共内街的真实宽开口", [side * 8, y, z], 52 / 3, height, 5, 90, 3.2));
    for (const z of [-26 / 3, 26 / 3]) p.push(box("各铺之间延伸到外墙的真实分铺隔墙", side * 15, y + height / 2, z, 14, height, .2, stone));
    p.push(box("营业带外立面窗下连续实体墙", side * 22, y + .5, 0, .25, 1, 52, stone), box("营业带外立面窗上连续实体墙", side * 22, y + height - .35, 0, .25, .7, 52, stone), part("外侧独立长窗孔中的透明玻璃带", "box", colors.glass, [side * 22, y + (height + .3) / 2, 0], [.05, height - 1.7, 52], [0, 0, 0], { opacity: .24 }));
  }
  for (const [z, depth] of [[-10, 2.4], [11, 2]]) p.push(box("跨过通高内街并接到左右回廊的实际步桥", 0, 4.625, z!, 8, .25, depth!, wood));
  for (const x of [-5, 5]) for (const z of [-20, 0, 20]) p.push(box("避开商铺门口和主街的二层承重柱", x, 2.4, z, .28, 4.2, .28, dark));
  for (const x of [-1.3, 1.3]) for (let flight = 0; flight < 2; flight++) p.push(stairFlight("并列公共阶梯在高端直接接到跨街步桥前缘", x, .3 + flight * 2.225, .4 + flight * 4.8, 1.6, 12, 4.45 / 24, .4));
  for (const x of [-4, 4]) {
    for (const [a, b] of [[-24, -11.2], [-8.8, 10], [12, 24]]) p.push(rail([x, 5.85, a!], [x, 5.85, b!], .06, dark));
    for (const z of [-24, -11.2, -8.8, 10, 12, 24]) p.push(rail([x, 4.75, z], [x, 5.85, z], .06, dark));
  }
  return p;
}

function atriumHotel(): ModelPart[] {
  const outline: [number, number][] = [[-18, -16], [18, -16], [18, 16], [-18, 16]], courtyard: [number, number][] = [[-6, -5], [6, -5], [6, 5], [-6, 5]];
  const p: ModelPart[] = [box("井庭旅馆完整落地地坪", 0, .15, 0, 37, .3, 33, stone), polygon("真实客房与内侧环廊共同围出的上层楼面", wood, outline, .25, [0, 3.45, 0], [courtyard]), polygon("旅馆屋盖保留贯通井庭采光口", dark, outline, .25, [0, 6.95, 0], [courtyard]), part("通高井庭完整透明采光盖", "box", colors.glass, [0, 7.225, 0], [12.2, .05, 10.2], [0, 0, 0], { opacity: .24 })];
  const walls: SolidBox[] = [], beds: SolidBox[] = [];
  for (const y of [.3, 3.7]) {
    const h = y === .3 ? 3.15 : 3.25;
    for (const side of [-1, 1]) {
      for (const x of [-13.5, -4.5, 4.5, 13.5]) {
        if (side > 0 && y === .3 && Math.abs(x) < 9) continue;
        p.push(doorway("每间独立客房面向井庭环廊的真实房门", [x, y, side * 9], 9, h, .95, 0, 2.2));
        beds.push({ center: [x, y + .25, side * 12.5], size: [1.8, .5, 2.3] });
      }
      for (const x of [-9, 0, 9]) {
        if (side > 0 && y === .3 && !x) continue;
        walls.push({ center: [x, y + h / 2, side * 12.5], size: [.18, h, 7] });
      }
      for (const z of [-3, 3]) {
        p.push(doorway("侧翼客房面向内侧环廊的真实房门", [side * 9, y, z], 6, h, .95, 90, 2.2));
        beds.push({ center: [side * 13.5, y + .25, z], size: [1.8, .5, 2.3] });
      }
      walls.push({ center: [side * 13.5, y + h / 2, 0], size: [9, h, .18] });
      for (const z of [-6, 6]) walls.push({ center: [side * 13.5, y + h / 2, z], size: [9, h, .18] });
    }
    for (const z of [-16, 16]) {
      walls.push({ center: [0, y + h - .325, z], size: [36, .65, .24] });
      if (z > 0 && y === .3) {
        for (const s of [-1, 1]) {
          walls.push({ center: [s * 9.75, y + .4, z], size: [16.5, .8, .24] }, { center: [s * 1.6, y + 1.25, z], size: [.2, 2.5, .24] });
          p.push(part("正面主入口两旁真正留出门洞的透明窗", "box", colors.glass, [s * 9.85, y + (h + .15) / 2, z], [16.3, h - 1.45, .05], [0, 0, 0], { opacity: .24 }));
        }
      } else {
        walls.push({ center: [0, y + .4, z], size: [36, .8, .24] });
        p.push(part("整层客房外立面真实长窗孔中的玻璃", "box", colors.glass, [0, y + (h + .15) / 2, z], [36, h - 1.45, .05], [0, 0, 0], { opacity: .24 }));
      }
    }
    for (const x of [-18, 18]) {
      walls.push({ center: [x, y + .4, 0], size: [.24, .8, 32] }, { center: [x, y + h - .325, 0], size: [.24, .65, 32] });
      p.push(part("侧翼客房独立透明外侧窗带", "box", colors.glass, [x, y + (h + .15) / 2, 0], [.05, h - 1.45, 32], [0, 0, 0], { opacity: .24 }));
    }
  }
  p.push(doorway("地层接待门厅向井庭开放的实际入口", [0, .3, 9], 18, 3.15, 4, 0, 2.5));
  for (let start = 0; start < walls.length; start += 18) p.push(boxesMesh("独立客房隔墙和真实外窗上下实体带", stone, walls.slice(start, start + 18)));
  for (let start = 0; start < beds.length; start += 18) p.push(boxesMesh("各独立客房内实际落地的床座", "#a2a991", beds.slice(start, start + 18)));
  for (let flight = 0; flight < 2; flight++) p.push(stairFlight("中央开井空间中连续上行的旅馆公共阶梯", 4.5, .3 + flight * 1.7, -4.4 + flight * 4.32, 2, 12, 3.4 / 24, .36));
  p.push(box("阶梯高端跨出井庭孔洞的真实落脚平台", 4.5, 3.575, 4.77, 2, .25, 1.06, wood));
  for (const x of [-6, 6]) p.push(rail([x, 4.8, -5], [x, 4.8, 5], .06, dark));
  p.push(rail([-6, 4.8, -5], [6, 4.8, -5], .06, dark), rail([-6, 4.8, 5], [3.4, 4.8, 5], .06, dark), rail([5.6, 4.8, 5], [6, 4.8, 5], .06, dark));
  for (const [x, z] of [[-6, -5], [6, -5], [-6, 5], [6, 5], [3.4, 5], [5.6, 5]]) p.push(rail([x!, 3.7, z!], [x!, 4.8, z!], .06, dark));
  for (const x of [3.5, 5.5]) p.push(rail([x, 1.4, -4.4], [x, 4.8, 4.24], .06, dark));
  p.push(box("地层接待门厅独立前台", 0, .85, 12, 4, 1.1, 1, wood));
  return p;
}
