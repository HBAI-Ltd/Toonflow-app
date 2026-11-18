import { part, type ModelPart } from "../assetModelParts";
import { polygon } from "../masterNature/shared";
import { box, design, rail, colors, type ArchitecturePrototype } from "./structures";
import { doorway } from "./publicSpaceBatchOne";
import { openingWall, holesAt } from "./periodPublicSpaceBatchOne";
import { verticalPanel } from "./historicSpaceBatchNine";
import { stairFlight } from "./historicSpaceBatchSeven";
import { barrelRoof } from "./spatialShells";
import { boxesMesh, type SolidBox } from "./publicSpaceBatchEight";

const wall = "#c2bdae", floor = "#a8a799", wood = "#b79c78", iron = "#657678";

export const everydayRecreationSpaceBatchTwoDesigns: ArchitecturePrototype[] = [
  design("高拱舞室侧翼双层排练中心", "后退的通高弹性舞室与临街两层更衣接待翼组成L形完整建筑，折返楼梯穿过真实楼板井通到二层观察廊，侧翼横梁由内墙和外墙承托并向舞室挑出，舞室扁拱屋盖落在侧墙和柱列上", rehearsalCenter, "建筑", "现代"),
];

function rehearsalCenter(): ModelPart[] {
  const p: ModelPart[] = [
    box("前院、通高舞室和两层侧翼共同的完整落地基础", -.5, .1, .5, 22, .2, 23, floor),
    box("独立弹性垫块上方真实连续的完整木舞面", -3.5, .35, 2, 12.7, .1, 15.7, wood),
    openingWall("通高舞室西墙上真正开孔的高位采光窗带", 16, 7, holesAt([-5, 0, 5], 3.4, 1.6, 4.7), [-10, .2, 2], 90, wall),
    verticalPanel("舞室与低层接待廊之间真正留出双门的承重隔壁", [[-8, 0], [-5.8, 0], [-5.8, 2.5], [-4.2, 2.5], [-4.2, 0], [4.2, 0], [4.2, 2.5], [5.8, 2.5], [5.8, 0], [8, 0], [8, 3.2], [-8, 3.2]], [], .3, [3, .2, 2], 90, wall),
    polygon("侧翼二层真正让出两折楼梯和半高平台井的完整楼板", floor, [[3, -10], [9, -10], [9, 10], [3, 10]], .2, [0, 3.4, 0], [[[3.4, -8.8], [6.25, -8.8], [6.25, -4.8], [3.4, -4.8]]]),
    box("从侧翼楼板连续挑入舞室上方的窄观察廊", 2.3, 3.5, 2, 1.5, .2, 16, floor),
    box("真正由两侧外墙与内柱列接承的侧翼平屋盖", 6, 7.3, 0, 6.3, .2, 20.3, iron),
    openingWall("临前院一侧真正封合双层前厅的完整短外墙", 4, 7, holesAt([0], 2, 1.8, 4.2), [3, .2, -8], 90, wall),
    part("前厅短侧墙高窗内真正镶入的薄玻璃", "box", colors.glass, [3, 5.3, -8], [.035, 1.8, 2], [0, 0, 0], { opacity: .28, roughness: .14 }),
    openingWall("侧翼外墙中上下两层真正贯通的独立采光窗", 20, 7, [1.1, 4.25].flatMap(y => holesAt([-6, 0, 6], 2.9, 1.65, y)), [9, .2, 0], 90, wall),
    stairFlight("从前门接待坪连续升到半高平台的第一折宽阶", 10, 1.25, 1.7, .28, 0, [4.1, .2, -8.8], -90),
    stairFlight("从半高平台折返且穿过楼板井的第二折宽阶", 10, 1.25, 1.7, .28, 0, [5.55, 1.9, -6], 90),
    box("把两折楼梯真正接到一起的整块半高转向平台", 4.825, 1.8, -5.4, 2.85, .2, 1.2, floor),
    ...[3.55, 6.1].map(x => box("半高转向平台下真正落到地坪的承重短柱", x, 1, -4.95, .18, 1.6, .18, iron)),
    box("接待入口右侧真正落地的固定工作柜", 8.25, .65, -8, .7, .9, 1.6, wood),
    box("接待柜上方真实相接的完整薄台面", 8.25, 1.13, -8, .82, .06, 1.72, iron),
  ];
  const elastic: SolidBox[] = [], posts: SolidBox[] = [], benches: SolidBox[] = [];
  for (const x of [-8.5, -5, -1.5, 2]) for (const z of [-4, 0, 4, 8]) elastic.push({ center: [x, .235, z], size: [.3, .07, .3] });
  p.push(boxesMesh("将整幅木舞面与基础分开的独立弹性承托垫块", iron, elastic));
  p.push(boxesMesh("由弹性垫块连续接到整幅木舞面下缘的支承龙骨", wood, [-8.5, -5, -1.5, 2].map(x => ({ center: [x, .285, 2], size: [.2, .03, 15.7] }))));
  const roof = barrelRoof("两端封合且由侧墙柱列承住的扁拱薄屋壳", 6.5, .18, 16.4, [-3.5, 7.2, 2], iron);
  roof.scale.y = .25;
  p.push(roof);
  for (const z of [-6, 10]) {
    p.push(doorway("通高舞室前后真正接通外庭的独立宽门", [-3.5, .2, z], 13, 7, 2.4, 0, 2.8));
    const profile = Array.from({ length: 13 }, (_, index) => { const a = Math.PI - index * Math.PI / 12; return { x: Math.cos(a) * 6.5, y: Math.sin(a) * 1.625 }; });
    p.push(part("真实封到扁拱屋盖内缘的弧顶端山墙", "extrude", wall, [-3.5, 7.2, z], [1, 1, 1], [0, 0, 0], { depth: .24, profile }));
    p.push(stairFlight("舞室木地面从外庭真实接入门洞的两级短石阶", 2, 2.4, .2, .32, 0, [-3.5, .2, z < 0 ? -6.49 : 10.49], z < 0 ? -90 : 90));
  }
  for (const z of [-10, 10]) {
    p.push(verticalPanel("双层接待翼前后真正保留地面门和上层窗的完整外墙", [[-3, 0], [-1.05, 0], [-1.05, 2.6], [1.05, 2.6], [1.05, 0], [3, 0], [3, 7], [-3, 7]], holesAt([0], 3.6, 1.8, 4.2), .3, [6, .2, z], 0, wall), part("接待翼高位真实窗洞内的独立薄玻璃", "box", colors.glass, [6, 5.3, z], [3.6, 1.8, .035], [0, 0, 0], { opacity: .28, roughness: .14 }));
  }
  for (const z of [-4, 2, 8]) p.push(box("内承墙和外承墙之间真正托住侧翼楼面并挑出观察廊的横梁", 5.275, 3.32, z, 7.45, .16, .2, iron));
  for (const z of [-5, 2, 9]) {
    p.push(box("二层楼面上真正接到舞室拱脚与侧翼屋盖的内柱", 3, 5.4, z, .18, 3.6, .18, iron));
    const rib = barrelRoof("从西侧整墙连续拱到东侧承柱的细分拱肋", 6.4, .12, .14, [-3.5, 7.2, z], iron);
    rib.scale.y = .25;
    p.push(rib);
  }
  for (const z of [-3, 7]) p.push(stairFlight("侧翼低地坪穿过真实门洞接到弹性舞面的小宽阶", 2, 1.4, .2, .32, 0, [3.49, .2, z], 180));
  for (const z of [-3, 2, 7]) p.push(part("西侧高窗真实镶入窗洞的完整薄玻璃", "box", colors.glass, [-10, 5.7, z], [.035, 1.6, 3.4], [0, 0, 0], { opacity: .25, roughness: .14 }));
  for (const y of [2.125, 5.275]) for (const z of [-6, 0, 6]) p.push(part("两层侧翼真正镶在采光洞口内的透明窗片", "box", colors.glass, [9, y, z], [.035, 1.65, 2.9], [0, 0, 0], { opacity: .28, roughness: .14 }));
  for (const z of [-1.6, 5.6]) p.push(part("面对连续木舞面的真实墙装练功镜", "box", colors.glass, [-9.84, 1.9, z], [.035, 2.8, 6.8], [0, 0, 0], { metalness: .9, roughness: .06 }));
  p.push(rail([-9.4, 1.35, -5.1], [-9.4, 1.35, 9.1], .05, wood));
  for (const z of [-4, 0, 4, 8]) p.push(rail([-9.85, 1.35, z], [-9.4, 1.35, z], .045, iron));
  for (const y of [.2, 3.6]) {
    for (const z of [1, 7]) p.push(doorway("上下更衣整理分室各自面对公共侧廊的真实门", [5.5, y, z], 6, y > 1 ? 3.6 : 3.2, 1.05, 90, 2.3));
    for (const z of [1, 7]) benches.push({ center: [8.45, y + .43, z], size: [.55, .08, 3] }, ...[-1, 1].map(side => ({ center: [8.45, y + .195, z + side * 1.15] as [number, number, number], size: [.4, .39, .15] as [number, number, number] })));
  }
  for (const z of [-2, 4]) p.push(box("更衣分室之间真正贯通上下层并接承屋盖的分隔墙", 7.25, 3.7, z, 3.5, 7, .18, wall));
  p.push(boxesMesh("上下分室内真正落地且接住坐板的固定整理长凳", wood, benches));
  p.push(box("观察廊临空一侧真正连续防护舞室挑空的长扶手", 1.55, 4.65, 2, .06, .06, 16, iron));
  for (const z of [-5.7, -1.7, 2.3, 6.3, 9.7]) posts.push({ center: [1.55, 4.125, z], size: [.06, 1.05, .06] });
  for (const [a, b] of [[[3.4, -8.8], [3.4, -4.8]], [[6.25, -8.8], [6.25, -4.8]], [[3.4, -4.8], [6.25, -4.8]], [[3.4, -8.8], [4.9, -8.8]]] as const) {
    p.push(rail([a[0], 4.65, a[1]], [b[0], 4.65, b[1]], .055, iron));
    for (const at of [a, b]) posts.push({ center: [at[0], 4.125, at[1]], size: [.055, 1.05, .055] });
  }
  for (const [x, y, start, end] of [[3.475, .2, -8.8, -6], [4.725, .2, -8.8, -6], [4.925, 1.9, -6, -8.8], [6.175, 1.9, -6, -8.8]]) {
    p.push(rail([x!, y! + 1.05, start!], [x!, y! + 2.75, end!], .05, iron));
    for (const [floorY, z] of [[y!, start!], [y! + 1.7, end!]]) posts.push({ center: [x!, floorY! + .525, z!], size: [.05, 1.05, .05] });
  }
  p.push(box("半高转向平台后沿实际留在楼梯井内的独立扶手", 4.825, 2.95, -4.8, 2.7, .055, .055, iron));
  for (const x of [3.475, 6.175]) {
    p.push(box("半高平台两侧真正接到折返梯扶手的防坠侧栏", x, 2.95, -5.4, .055, .055, 1.2, iron));
    posts.push({ center: [x, 2.425, -4.8], size: [.055, 1.05, .055] });
  }
  for (let start = 0; start < posts.length; start += 20) p.push(boxesMesh("分别落在观察廊、楼板井和各级台面上的真实栏杆", iron, posts.slice(start, start + 20)));
  return p;
}
