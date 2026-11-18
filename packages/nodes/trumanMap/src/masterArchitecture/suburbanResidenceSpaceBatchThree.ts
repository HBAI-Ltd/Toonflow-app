import { part, type ModelPart, type Triple } from "../assetModelParts";
import { glazedWall } from "./modernResidenceSpaceBatchOne";
import { waistStair } from "./publicSpaceBatchFourteen";
import { solidBox } from "./vernacularWorldBatchThree";
import { meshBeam } from "./vernacularWorldBatchFive";
import { packMeshes } from "./vernacularWorldBatchThirteen";
import { box, cylinder, design, type ArchitecturePrototype } from "./structures";

const stone = "#b6b6a8", steel = "#718681", timber = "#a38b68", pale = "#d0c9b8", glass = "#acc7c0", fabric = "#99ac9f";

function raisedGlassFrameHouse(): ModelPart[] {
  const parts: ModelPart[] = [
    box("独立钢柱承起的完整矩形生活层与前露台承板", 0, 1.3, 0, 9.6, .2, 20, stone),
    box("八根外置钢柱共同承担而不依赖玻璃围护的完整平屋盖", 0, 4.5, 0, 9.6, .2, 20, pale),
    box("地面入口宽梯前真实落地的完整石踏坪", 0, .125, -15.3, 3.4, .25, 1.4, stone),
    box("独立低钢架承起并与两段宽梯相接的完整外平台", 0, .65, -11.9, 8.4, .1, 3.4, stone),
    waistStair("从地面踏坪连续进入独立低外平台的四级宽阶", 0, .25, -14.8, 2.6, 4, .1125, .3),
    waistStair("从低外平台升到高生活前露台的四级独立宽阶", 0, .7, -11.2, 2.6, 4, .175, .3),
    box("内部独立厨务卫浴服务核真正闭合而不承担主屋盖的平顶", .6, 4.25, 1, 3.15, .1, 6.15, pale),
  ];
  const floorFrame: ModelPart[] = [], roofFrame: ModelPart[] = [], glazingFrame: ModelPart[] = [], lowFrame: ModelPart[] = [];
  for (const side of [-1, 1]) {
    for (const z of [-9, -3, 3, 9]) {
      parts.push(box("外置独立钢柱下真正落地且彼此分开的石承台", side * 4.7, .075, z, .65, .15, .65, stone), box("从石承台直接接到主屋盖底的独立外钢柱", side * 4.7, 2.275, z, .18, 4.25, .18, steel));
    }
    floorFrame.push(meshBeam("各同侧钢柱相接并承住整片生活平台的长钢边梁", [side * 4.7, 1.15, -9.8], [side * 4.7, 1.15, 9.8], .3, steel));
    roofFrame.push(meshBeam("各同侧钢柱顶接住完整平屋盖的长钢檐梁", [side * 4.7, 4.28, -9.8], [side * 4.7, 4.28, 9.8], .24, steel));
    glazingFrame.push(meshBeam("整面侧玻璃底端实际接入生活楼面的细钢窗槛", [side * 4.3, 1.44, -7], [side * 4.3, 1.44, 9], .08, steel), meshBeam("整面侧玻璃顶端与完整平屋盖底相接的细钢窗楣", [side * 4.3, 4.36, -7], [side * 4.3, 4.36, 9], .08, steel));
    for (const z of [-7, -3, 3, 9]) glazingFrame.push(meshBeam("透明围护各跨从真实楼面接到屋盖的细钢窗竖框", [side * 4.3, 1.4, z], [side * 4.3, 4.4, z], .065, steel));
    parts.push(part("低外台进入高露台后两侧连续透光的真实固定玻璃围护", "box", glass, [side * 4.3, 2.9, 1], [.035, 3, 16], [0, 0, 0], { opacity: .24, roughness: .18 }), part("前入户门两侧完整透光且真正落在生活板上的固定玻璃", "box", glass, [side * 2.6, 2.9, -7], [3.4, 3, .035], [0, 0, 0], { opacity: .24, roughness: .18 }));
    glazingFrame.push(meshBeam("高露台入户门两侧真正保留净口的独立细钢门梃", [side * .94, 1.4, -7], [side * .94, 3.7, -7], .08, steel), meshBeam("前立面固定窗玻璃下端避开入户门的钢窗槛", [side * .94, 1.44, -7], [side * 4.3, 1.44, -7], .08, steel));
    for (const z of [-13, -10.6]) {
      parts.push(box("独立低外台各钢脚下真正落地的石承台", side * 3.5, .075, z, .6, .15, .6, stone), box("低平台承框从石脚接起而不悬空的短钢柱", side * 3.5, .375, z, .16, .45, .16, steel));
    }
    lowFrame.push(meshBeam("独立低外台两侧钢脚顶承起完整石台板的纵钢框", [side * 3.5, .6, -13.3], [side * 3.5, .6, -10.5], .12, steel));
  }
  for (const z of [-9, -3, 3, 9]) floorFrame.push(meshBeam("两侧柱梁之间实际跨接承起生活平台的横钢梁", [-4.7, 1.15, z], [4.7, 1.15, z], .3, steel));
  for (const z of [-9, -3, 3, 9]) roofFrame.push(meshBeam("两列钢柱顶之间完整连接并接住屋盖的横钢梁", [-4.7, 4.28, z], [4.7, 4.28, z], .24, steel));
  for (const z of [-13, -10.6]) lowFrame.push(meshBeam("低外平台左右短柱顶部真实连续相接的横钢框", [-3.5, .6, z], [3.5, .6, z], .12, steel));
  parts.push(...packMeshes("实际接入八柱并承住抬高生活层的完整钢楼架", steel, floorFrame), ...packMeshes("八柱直接接合完整平盖的独立钢屋架", steel, roofFrame), ...packMeshes("低外平台四短脚上完整承住石台板的钢框", steel, lowFrame), part("后睡区完整落地且真正接到屋盖底的真实透明后围护", "box", glass, [0, 2.9, 9], [8.6, 3, .035], [0, 0, 0], { opacity: .24, roughness: .18 }), part("前入户门上方独立透明玻璃只封门楣以上部分", "box", glass, [0, 4.05, -7], [1.8, .7, .035], [0, 0, 0], { opacity: .24, roughness: .18 }));
  glazingFrame.push(meshBeam("真实前入户门净口上方与两门梃接合的钢门楣", [-.98, 3.74, -7], [.98, 3.74, -7], .08, steel), meshBeam("前玻璃全长上缘实际接住屋盖底的连续钢窗楣", [-4.3, 4.36, -7], [4.3, 4.36, -7], .08, steel), meshBeam("后玻璃全长下缘落在真实生活板面的连续钢窗槛", [-4.3, 1.44, 9], [4.3, 1.44, 9], .08, steel), meshBeam("后玻璃全长上缘实际接到屋盖底的连续钢窗楣", [-4.3, 4.36, 9], [4.3, 4.36, 9], .08, steel), meshBeam("后睡区玻璃中央真正接住上下钢框的细竖梃", [0, 1.4, 9], [0, 4.4, 9], .065, steel));
  parts.push(...packMeshes("真实透明围护各边连续接到楼面与屋盖的完整细钢窗框", steel, glazingFrame),
    ...glazedWall("服务核前侧实际承住开放厨房吊柜的完整隔壁", [-.9, -2], [2.1, -2], 1.4, 4.2, []),
    ...glazedWall("服务核后端遮挡睡区并封合独立卫浴的完整实壁", [2.1, 4], [-.9, 4], 1.4, 4.2, []),
    ...glazedWall("厨务贮藏间向西侧公共自由平面独立打开的真实内门", [-.9, -2], [-.9, 4], 1.4, 4.2, [], [[-1.5, 1.4, .85, 2.1]]),
    ...glazedWall("独用卫浴经东侧宽通道独立进入的真实侧门", [2.1, -2], [2.1, 4], 1.4, 4.2, [], [[1.6, 1.4, .8, 2.1]]),
    ...glazedWall("服务核内厨务储藏与卫浴真正从地面到盖板的完整分隔", [-.9, 1], [2.1, 1], 1.4, 4.2, []),
  );
  const guards: ModelPart[] = [];
  for (const [x, from, to, y] of [[-4.65, -9.85, -7, 1.4], [4.65, -9.85, -7, 1.4], [-4.1, -13.5, -10.3, .7], [4.1, -13.5, -10.3, .7]]) {
    guards.push(meshBeam("高前露台与低外台实际临空侧边的连续细钢护栏", [x!, y! + 1, from!], [x!, y! + 1, to!], .05, steel));
    for (const z of [from!, to!]) guards.push(meshBeam("外平台侧护栏真正从各自完整板面承起的独立立柱", [x!, y!, z], [x!, y! + 1, z], .05, steel));
  }
  for (const [z, half, y] of [[-9.85, 4.65, 1.4], [-13.5, 4.1, .7], [-10.3, 4.1, .7]]) for (const side of [-1, 1]) {
    guards.push(meshBeam("外台正面与后缘钢栏只在真实宽梯到达口处断开", [side * 1.38, y! + 1, z!], [side * half!, y! + 1, z!], .05, steel), meshBeam("宽梯到达口边缘钢栏实际接回平台板的端柱", [side * 1.38, y!, z!], [side * 1.38, y! + 1, z!], .05, steel));
  }
  for (const [base, z, rise] of [[.25, -14.8, .1125], [.7, -11.2, .175]]) for (const side of [-1, 1]) {
    const low: Triple = [side * 1.22, base! + rise!, z! + .15], high: Triple = [side * 1.22, base! + 4 * rise!, z! + 1.05];
    guards.push(meshBeam("两段宽入户梯沿实际踏面升起的连续钢扶手", [low[0], low[1] + .9, low[2]], [high[0], high[1] + .9, high[2]], .05, steel), meshBeam("宽梯扶手低端真正落在首级踏面的短钢柱", low, [low[0], low[1] + .9, low[2]], .05, steel), meshBeam("宽梯扶手高端真正落在末级踏面的短钢柱", high, [high[0], high[1] + .9, high[2]], .05, steel));
  }
  for (const [endZ, level, edgeZ] of [[-13.75, .7, -13.5], [-10.15, 1.4, -9.85]]) for (const side of [-1, 1]) guards.push(meshBeam("两段宽梯高端扶手真正斜接到对应平台栏口端柱的过渡短杆", [side * 1.22, level! + .9, endZ!], [side * 1.38, level! + 1, edgeZ!], .05, steel));
  parts.push(...packMeshes("两级独立平台真实保留连续入口的完整细钢护栏", steel, guards));
  const furniture: Record<string, ModelPart[]> = { [timber]: [], [pale]: [], [stone]: [], [fabric]: [] };
  const furnish = (name: string, color: string, x: number, y: number, z: number, w: number, h: number, d: number) => furniture[color]!.push(solidBox(name, x, y, z, w, h, d, color));
  furnish("自由起居区朝前露台完整落地的长沙发座", fabric, -2.7, 1.62, -4.2, 2.8, .44, 1.1);
  furnish("开放起居长沙发后端与座面相接的高软靠背", fabric, -2.7, 2.04, -3.73, 2.8, .9, .16);
  furnish("起居低茶几自真实生活板面承起的宽底座", timber, -2.7, 1.58, -5.6, 1.5, .36, .75);
  furnish("低茶几宽底座上完整相接的薄桌面", stone, -2.7, 1.79, -5.6, 1.7, .06, .9);
  furnish("自由餐区避开中央入户动线的完整宽桌脚", timber, 2.6, 1.77, -4.5, .6, .74, .8);
  furnish("餐桌宽支脚上实际贴合的完整薄桌面", timber, 2.6, 2.18, -4.5, 2, .08, 1.15);
  for (const side of [-1, 1]) {
    furnish("开放餐桌两侧真正落地的完整长凳脚", timber, 2.6, 1.59, -4.5 + side * 1.05, 1.4, .38, .35);
    furnish("开放餐桌长凳脚上实际相接的软凳面", fabric, 2.6, 1.81, -4.5 + side * 1.05, 1.7, .06, .5);
  }
  furnish("独立服务核前侧实际落地的完整开放厨房长地柜", timber, .6, 1.82, -2.5, 3, .84, .65);
  furnish("厨房长地柜上连续贴合的完整操作台面", stone, .6, 2.28, -2.5, 3.05, .08, .7);
  furnish("服务核前实壁上真正与墙相接的完整厨房吊柜", pale, .6, 3.45, -2.39, 2.8, .7, .32);
  furnish("服务核内厨务间真正落地且避开实门的长储物柜", pale, 1.2, 2.4, -1.2, .65, 2, 1.15);
  furnish("后睡区在服务核后壁遮挡之下的完整落地床架", timber, -.8, 1.6, 6.7, 1.8, .4, 2.2);
  furnish("后睡区床架上真实贴合的完整软床垫", pale, -.8, 1.86, 6.7, 1.76, .12, 2.16);
  furnish("后睡区床后真正接入生活板面的完整床头板", timber, -.8, 2.02, 7.8, 1.85, 1.24, .12);
  furnish("服务核旁进一步遮挡床位而保留西侧通路的落地衣柜", timber, -2.1, 2.4, 4.4, 2.3, 2, .65);
  furnish("后睡区东侧实际落地的书桌宽脚", timber, 3.2, 1.77, 6.6, .5, .74, .7);
  furnish("后睡区书桌宽脚上真正相接的完整薄桌面", timber, 3.2, 2.18, 6.6, .8, .08, 2.1);
  furnish("独立服务核内卫浴后角真正接地的淋浴托盘", pale, 1.3, 1.45, 3.2, 1.2, .1, 1.2);
  furnish("独用卫浴西后角坐便器实际落地的短支座", pale, -.25, 1.6, 3, .44, .4, .5);
  furnish("坐便器短支座上贴合的完整便座", pale, -.25, 1.84, 3, .6, .12, .75);
  furnish("坐便器便座后端实际相接的小水箱", pale, -.25, 2.13, 3.32, .56, .7, .18);
  furnish("独用卫浴前隔壁旁真正落地的完整洗手柜", timber, .9, 1.82, 1.5, .7, .84, .6);
  furnish("独用洗手柜上真正贴合的浅色盆台", pale, .9, 2.3, 1.5, .75, .12, .65);
  for (const [color, pieces] of Object.entries(furniture)) parts.push(...packMeshes("开放框架住宅各生活分区与封闭厨务卫浴内实际接地的固定家具", color, pieces));
  parts.push(cylinder("厨务间真实落地的独立电热储水箱不冒充结构柱", .1, 2.2, .25, .55, 1.6, pale));
  return parts;
}

export const suburbanResidenceSpaceBatchThreeDesigns: ArchitecturePrototype[] = [
  design("双台入户偏芯开放框架住宅", "八根外置独立钢柱直接承起高生活平台与平屋盖，四面真实玻璃围护内的自由平面绕封闭厨务卫浴服务核分流；低外台和高前露台经两段宽梯接入真正留空的前门，后睡区由实柜遮挡而保留双侧通路，全部柱梁平台与细窗框真实接合", raisedGlassFrameHouse, "建筑", "现代"),
];
