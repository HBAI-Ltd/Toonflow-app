import { part, type ModelPart } from "../assetModelParts";
import { box, design, rail, colors, type ArchitecturePrototype } from "./structures";
import { verticalPanel } from "./historicSpaceBatchNine";
import { holesAt } from "./periodPublicSpaceBatchOne";
import { stairFlight } from "./historicSpaceBatchSeven";
import { boxesMesh, type SolidBox } from "./publicSpaceBatchEight";

const wall = "#c7c3b3", paving = "#a8ab9b", wood = "#c0a77c", iron = "#63777a", marking = "#b06f59";

// 现代单打场基本比例参考官方场地资料；整座十字形双场会馆为原创组合，不是旧古网球厅的换皮。
// https://ussquash.org/court-specifications/
// https://www.csd.gob.es/es/csd/instalaciones/politicas-publicas-de-ordenacion/normativa-tecnica-de-instalaciones-deportivas/normas-nide/nide-1-13
export const everydayRecreationSpaceBatchFourDesigns: ArchitecturePrototype[] = [
  design("双场玻璃后壁观球桥壁球会馆", "两座相背的实体击球短场以带真实入场门的玻璃后壁夹住中央观球桥，前方高门厅长阶抵达桥面，地面侧路从阶旁分别进场，后方服务出口贯通，双低跨与中央高脊封合十字形整馆", squashClub, "建筑", "现代"),
];

function squashClub(): ModelPart[] {
  const p: ModelPart[] = [
    box("双短场、中央高厅与前后通路共同的落地基础", 0, .1, -2.4, 24, .2, 17.2, paving),
    box("连接两侧玻璃后壁且真正由柱梁承托的高位观球桥", 0, 3.1, 0, 3.2, .2, 6.7, paving),
    box("前高厅与中央观球桥及后通路共同的完整高屋盖", 0, 7.31, -2.4, 5.1, .22, 15.5, iron),
    stairFlight("前门厅中真正从低坪连续抵达高位观球桥的长实阶", 20, 1.5, 3, .28, 0, [0, .2, -8.95], -90),
    box("高观球桥后沿真正防护下方服务通路的连续扶手", 0, 4.25, 3.35, 3.2, .06, .06, iron),
  ];
  const frames: SolidBox[] = [], lines: SolidBox[] = [], seats: SolidBox[] = [];
  for (const z of [-10, 5.2]) {
    p.push(verticalPanel("高门厅前后真正开通地面入口和独立上窗的外墙", [[-2.4, 0], [-1, 0], [-1, 2.6], [1, 2.6], [1, 0], [2.4, 0], [2.4, 7], [-2.4, 7]], holesAt([0], 2.8, 2, 4.2), .3, [0, .2, z], 0, wall), part("高门厅上下分离的真实采光窗玻璃", "box", colors.glass, [0, 5.4, z], [2.8, 2, .035], [0, 0, 0], { opacity: .27, roughness: .13 }));
  }
  for (const side of [-1, 1]) {
    p.push(box("正面击球实墙与玻璃后壁之间完整齐平的木场地", side * 6.495, .21, 0, 9.75, .02, 6.4, wood), box("无檐面无中网的现代壁球完整实体正击球墙", side * 11.52, 3.15, 0, .3, 5.9, 6.7, wall), box("由实侧墙和背部跨梁真正承住的完整单场低跨屋盖", side * 6.56, 6.21, 0, 10.2, .22, 7.1, iron), box("玻璃背墙顶端实际跨在两面实侧墙之间的承重梁", side * 1.6, 6, 0, .16, .2, 6.9, iron));
    const rear = verticalPanel("在中央地面通路上真正留出入场口的完整玻璃后壁", [[-3.35, 0], [-.45, 0], [-.45, 2.2], [.45, 2.2], [.45, 0], [3.35, 0], [3.35, 5.9], [-3.35, 5.9]], [], .04, [side * 1.6, .2, 0], 90, colors.glass);
    rear.opacity = .3; rear.roughness = .13; p.push(rear);
    p.push(part("玻璃后壁上方真正封合中央高低屋面落差的采光带", "box", colors.glass, [side * 1.6, 6.65, 0], [.035, 1.1, 6.7], [0, 0, 0], { opacity: .28, roughness: .13 }), box("前门厅向外展开的完整长侧墙", side * 2.4, 3.7, -6.675, .3, 7, 6.65, wall), box("后服务出口两侧真正封合的短高侧墙", side * 2.4, 3.7, 4.275, .3, 7, 1.85, wall), box("观球桥下连续连接前后承柱的边缘承重梁", side * 1.55, 2.9, 0, .14, .2, 6.5, iron));
    for (const z of [-3.35, 3.35]) p.push(box("球场两边真正参与击球并封合整个短场的实体侧壁", side * 6.56, 3.15, z, 10.2, 5.9, .3, wall), box("高前后厅与窄中央屋脊接合处真实闭合的短阶壁", side * 2, 6.65, z, .8, 1.1, .3, wall));
    for (const z of [-3.2, 3.2]) p.push(box("中央玻璃墙边实际落地并贯穿桥面接到高屋盖的整高柱", side * 1.55, 3.7, z, .14, 7, .14, iron));
    for (const y of [.7, 2, 4.79]) lines.push({ center: [side * 11.37, y, 0], size: [.012, .045, 6.4] });
    lines.push({ center: [side * 5.88, .222, 0], size: [.045, .004, 6.4] }, { center: [side * 3.75, .222, 0], size: [4.26, .004, .045] });
    for (const end of [-1, 1]) {
      lines.push({ center: [side * 2.42, .222, end * 1.6], size: [1.6, .004, .045] }, { center: [side * 3.22, .222, end * 2.4], size: [.045, .004, 1.6] });
      p.push(rail([side * 1.62, 2.35, end * 3.188], [side * 11.37, 4.79, end * 3.188], .04, marking));
    }
    for (const z of [-3.35, 0, 3.35]) frames.push({ center: [side * 1.6, 6.65, z], size: [.065, 1.1, .065] });
    frames.push({ center: [side * 1.6, 7.15, 0], size: [.065, .1, 6.7] });
    p.push(rail([side * .75, 1.25, -8.95], [side * .75, 4.25, -3.35], .055, iron));
    p.push(box("观球桥前缘接住梯顶扶手并伸入侧壁的短横扶栏", side * 1.15, 4.25, -3.32, .8, .06, .08, iron), box("观球桥前缘真正贴合桥面且承住封边玻璃的短底梁", side * 1.15, 3.23, -3.32, .8, .06, .06, iron), part("梯口两侧真正镶入短栏框架的防坠玻璃", "box", colors.glass, [side * 1.1025, 3.73, -3.32], [.65, 1, .018], [0, 0, 0], { opacity: .28, roughness: .13 }));
    frames.push({ center: [side * 1.45, 3.725, -3.32], size: [.055, 1.05, .055] });
    for (const ratio of [0, .5, 1]) {
      const y = .2 + ratio * 3;
      frames.push({ center: [side * .75, y + .525, -8.95 + ratio * 5.6], size: [.055, 1.05, .055] });
    }
    frames.push({ center: [side * 1.5, 3.725, 3.35], size: [.055, 1.05, .055] });
    seats.push({ center: [side * .32, 3.69, 0], size: [.55, .08, 3.5] }, ...[-1, 1].map(end => ({ center: [side * .32, 3.425, end * 1.25] as [number, number, number], size: [.4, .45, .12] as [number, number, number] })));
  }
  for (const z of [-3.2, 3.2]) p.push(box("两排高柱之间真正接住观球桥端部的横向梁", 0, 2.9, z, 3.2, .2, .14, iron));
  frames.push({ center: [0, 3.725, 3.35], size: [.055, 1.05, .055] });
  p.push(box("双面观球座之间真正接到坐板的窄靠背", 0, 4.04, 0, .1, .7, 3.5, wood), boxesMesh("观球桥上真正落地并相接的双面坐板与承脚", wood, seats));
  for (let start = 0; start < frames.length; start += 20) p.push(boxesMesh("上下高窗与长阶和桥尾实际接承各段扶手的完整立杆", iron, frames.slice(start, start + 20)));
  for (let start = 0; start < lines.length; start += 20) p.push(boxesMesh("实体击球墙与木地坪上真正相接的短线和发球框", marking, lines.slice(start, start + 20)));
  return p;
}
