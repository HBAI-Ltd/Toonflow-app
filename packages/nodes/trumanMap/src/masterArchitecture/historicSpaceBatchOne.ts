import { beam, part, ring, type ModelPart, type Triple } from "../assetModelParts";
import { arch, base, box, cylinder, design, roof, type ArchitecturePrototype } from "./structures";
import { barrelRoof, halfDomeRoof, halfRoundFloor, halfRoundWall } from "./spatialShells";

const stone = "#aaa896", earth = "#a59778", wood = "#967a56", iron = "#46545a", tile = "#7c8277";

// 构造依据为遗产机构公开的类型说明，几何为原创简化场景道具，不是遗址复原测绘。
// https://heritageireland.ie/unguided-sites/creevykeel-court-tomb/
// https://whc.unesco.org/en/tentativelists/6557
// https://whc.unesco.org/en/list/833/
// https://www.english-heritage.org.uk/visit/inspire-me/blog/blog-posts/how-to-spot-a-castle-hiding-in-plain-sight/
// https://historicengland.org.uk/listing/the-list/list-entry/1001807
// https://whc.unesco.org/en/list/524
export const historicSpaceBatchOneDesigns: ArchitecturePrototype[] = [
  design("门柱承盖支石墓", "高前门柱与低后立石直接承托倾斜整片顶石，侧石围出短葬室，前面保留真正的门柱间隙", portalTomb, "建筑", "异域"),
  design("U形前庭双室廊冢", "开口石列先围出仪式前庭，再经窄门进入由横隔立石分开的连续葬室", courtCairn, "建筑", "异域"),
  design("十字侧室通道冢", "长直入口廊道进入带左右侧室与后端石龛的十字葬室，周边石堆与顶板不填塞内部通路", cruciformPassageTomb, "建筑", "异域"),
  design("弧列立碑长室巨人墓", "半圆凹面立碑围出宽前庭，中央高碑的低入口接到狭长石盖集体葬室", giantTomb, "建筑", "异域"),
  design("夹壁阶道叠涩努拉吉塔", "收分厚石塔具有真实贯通低门、中央叠涩室与环绕室外的夹壁石梯", nuragheTower, "建筑", "异域"),
  design("丘垒与外郭木堡", "高丘顶木塔与低位封闭外郭通过独立上升木桥连通，高低防御区和桥下空间均实际成形", motteBailey, "建筑", "欧式"),
  design("弧郭折行瓮城", "向城门前外伸的弧墙围出开顶夹庭，偏置外门迫使通行路线转弯后才到内门", barbican, "建筑", "欧式"),
  design("开喉三角独立外垒", "面对前方的两条厚斜面在尖部会合，后方留开放喉口和上炮台的坡道，属于城壕外独立三角防御工事", ravelin, "建筑", "欧式"),
  design("双半棱堡角堡", "两端半棱堡的面与侧翼经中央幕墙相连，背后开喉通向防守方，保留交叉侧射的凹进边界", hornwork, "建筑", "欧式"),
  design("护壕封顶侧射廊", "低位封顶石廊沿壕沟突出，双侧真实射口朝相反方向侧射，后端入口经短筒券与廊室贯通", caponier, "建筑", "欧式"),
  design("弯臂遮挡营门土垒", "营地土垒的门口附带向内卷入的弯臂，并以门前独立遮挡短堤阻断直冲路线，保留折入通道", claviculaGate, "设施", "欧式"),
  design("环行石栏覆钵窣堵坡", "实心覆钵置于可绕行圆台，真实栏间通路、横梁石门与顶部方栏伞轴共同构成舍利纪念主体", stupaMonument, "建筑", "异域"),
  design("马蹄后龛柱列查迪堂", "长筒券主厅的柱列绕过半圆后龛和内部小窣堵坡，侧通道贯通；前立面留真实大弧窗与三条入口", chaityaHall, "建筑", "异域"),
  design("高低柱网巨柱神庙厅", "密集侧柱托住低位石屋盖，中央开花柱头高柱承起高盖并在两侧形成透空高窗", hypostyleHall, "建筑", "异域"),
  design("四面通券净火亭", "四个实心角墩与四向开放拱券托住中部薄壳圆顶，中央火台同四个可穿行方向相连", chaharTaq, "建筑", "异域"),
  design("四向通行四柱凯旋门", "四个角墩围出可交叉通行的街道中心，四面石券与上部方形纪念阁共同构成立体门楼，内部保持十字通路", tetrapylon, "建筑", "欧式"),
  design("双翼对向登阶讲经台", "左右两座固定石梯分别登上中间高台，面向会众的凸弧读经围板与下方通行券洞形成一体石坛", doubleAmbo, "设施", "欧式"),
  design("半圆分阶圣职座", "连续半圆石阶席位面向前方，在最高席中央设置高背座并留出正中登阶通道", synthronon, "设施", "欧式"),
  design("铸铁墓穴防盗罩", "锚固横木与粗铁边梁锁住拱形密格罩，罩下保持真实空腔和前后端栏，用于墓穴防盗的固定设施", mortsafe, "设施", "欧式"),
  design("砖券侧龛地下葬廊", "筒券墓廊的两侧按列砌出横长安葬龛，独立龛床与分层过梁围出真实凹穴，后端小墓室同前廊连通", catacombGallery, "建筑", "欧式"),
];

function slab(name: string, profile: [number, number][], depth: number, position: Triple, rotation: Triple = [0, 0, 0], color = stone): ModelPart {
  return part(name, "extrude", color, position, [1, 1, 1], rotation, { profile: profile.map(([x, y]) => ({ x, y })), depth });
}

function earthBank(name: string, from: [number, number], to: [number, number], width: number, topWidth: number, height: number): ModelPart {
  return slab(name, [[-width / 2, 0], [width / 2, 0], [topWidth / 2, height], [-topWidth / 2, height]], Math.hypot(to[0] - from[0], to[1] - from[1]), [(from[0] + to[0]) / 2, .18, (from[1] + to[1]) / 2], [0, Math.atan2(to[0] - from[0], to[1] - from[1]) * 180 / Math.PI, 0], earth);
}

function placedArch(x: number, z: number, radius: number, spring: number, depth: number, yaw = 0, y = .18, thickness = .3): ModelPart {
  const value = arch(x, z, radius, spring, depth, thickness);
  value.position.y = y;
  value.rotation.y = yaw;
  value.color = stone;
  return value;
}

function ringAt(name: string, radius: number, thickness: number, height: number, position: Triple, color = stone): ModelPart {
  const value = ring(name, color, radius, thickness, position[1], height);
  value.position.x = position[0]; value.position.z = position[2];
  return value;
}

function portalTomb(): ModelPart[] {
  return [
    box("双门柱之间贯通的葬室地面", 0, .08, 0, 3.1, .16, 3.8, earth),
    ...[-1, 1].map(s => slab("向内微收且实际承盖的门柱", [[-.31, 0], [.31, 0], [.23, 2.5], [-.17, 2.7]], .65, [s * 1.05, .16, -1.2])),
    slab("葬室后端横立石", [[-1.05, 0], [1.05, 0], [.93, 1.82], [-.86, 1.95]], .42, [0, .16, 1.3]),
    ...[-1, 1].map(s => slab("包住短葬室侧面的立石", [[-1.15, 0], [1.15, 0], [1.08, 2.7], [-.97, 1.97]], .32, [s * 1.13, .16, .05], [0, 90, 0])),
    slab("从高门柱向后下降的整片顶石", [[-1.55, 0], [1.58, .07], [1.4, .52], [-1.24, .43]], 3.6, [0, 2.46, -.02], [19, 0, 0]),
  ];
}

function courtCairn(): ModelPart[] {
  const p: ModelPart[] = [base(11, 17), box("双室葬廊连续底板", 0, .25, 3.3, 2.5, .14, 7.8, stone)];
  for (let i = 0; i <= 10; i++) {
    if (i === 5) continue;
    const a = i * Math.PI / 10;
    p.push(part("围出前庭而不填实的独立弧列立石", "box", stone, [Math.cos(a) * 3.9, 1, -3.2 - Math.sin(a) * 4], [.65, 1.64, .48], [0, 90 + i * 18, 0]));
  }
  for (const s of [-1, 1]) {
    p.push(box("从前庭延到葬室门口的围石", s * 2.45, .9, -.8, 3.25, 1.44, .45), box("双室连续石壁", s * 1.25, 1.25, 3.3, .5, 1.94, 7.8), earthBank("葬廊外侧石土护堆", [s * 2.7, .1], [s * 2.7, 7.1], 2.3, .7, 1.5));
    p.push(box("低门口两旁大立石", s * .88, 1.45, -.55, .5, 2.34, .6), box("两室之间保留窄通道的隔石", s * .9, 1.2, 3.2, .45, 1.84, .4));
  }
  p.push(box("葬廊末端封石", 0, 1.25, 7.2, 2.9, 1.94, .45));
  for (const z of [1, 3.6, 6.2]) p.push(box("横跨葬廊的承重石盖", 0, 2.35, z, 3.15, .32, 2.65));
  return p;
}

function cruciformPassageTomb(): ModelPart[] {
  const p: ModelPart[] = [base(12, 17), box("通向十字葬室的连续低廊底", 0, .25, -3.7, 1.7, .14, 8.5), box("十字中心室铺石", 0, .25, 2.1, 3.5, .14, 3.3)];
  for (const s of [-1, 1]) {
    p.push(box("入口长廊两侧立石", s * .92, 1.1, -3.8, .35, 1.56, 8.3), box("十字横向侧室底板", s * 2.7, .25, 2.1, 2, .14, 2.6), box("侧室最外侧封石", s * 3.78, 1.22, 2.1, .35, 1.8, 3), box("中心室前面避开廊口的立石", s * 1.34, 1.2, .52, .75, 1.76, .35));
    for (const z of [.68, 3.52]) p.push(box("侧室前后两片厚立石", s * 2.7, 1.22, z, 2.25, 1.8, .35));
    p.push(box("后龛两侧向后延续的短壁", s * 1.45, 1.25, 4.6, .35, 1.86, 2.2), earthBank("入口两侧覆石长堆", [s * 2.8, -6.4], [s * 2.8, -.1], 3.5, 2.2, 2));
  }
  p.push(box("后端葬龛底板", 0, .25, 4.6, 2.9, .14, 2.4), box("后端葬龛封壁", 0, 1.25, 5.76, 3.2, 1.86, .35));
  for (const z of [-6.5, -4, -1.5]) p.push(box("廊道上方不堵塞入口的横盖石", 0, 2.03, z, 2.45, .3, 2.6));
  p.push(box("十字横室上盖石", 0, 2.32, 2.1, 8, .36, 3.2), box("后龛上方独立石盖", 0, 2.39, 4.75, 3.5, .32, 2.4), earthBank("后龛外侧收束护堆", [-4.8, 6.2], [4.8, 6.2], 2, 1, 2.2));
  return p;
}

function giantTomb(): ModelPart[] {
  const p: ModelPart[] = [base(13, 16), box("狭长集体葬室底石", 0, .25, 3, 1.8, .14, 10)];
  for (let i = 0; i < 12; i++) {
    if (i === 5 || i === 6) continue;
    const a = (i + .5) * Math.PI / 12;
    p.push(part("中央向外逐渐降低的凹面立碑", "box", stone, [Math.cos(a) * 5.4, .18 + (.95 + Math.sin(a) * .8) / 2, -4 + Math.sin(a) * 2], [.85, .95 + Math.sin(a) * .8, .42], [0, -90 - i * 15, 0]));
  }
  p.push(...[-1, 1].map(s => box("中央高碑低入口两旁竖石", s * .75, 1.78, -2, .7, 3.2, .5)), slab("高碑圆顶与真实低门过梁", [[-1.1, 0], [1.1, 0], [1.1, 1.5], [.8, 2], [0, 2.3], [-.8, 2], [-1.1, 1.5]], .5, [0, 1.2, -2]));
  for (const s of [-1, 1]) p.push(box("直通长室两侧石壁", s * .95, 1.12, 3.1, .4, 1.6, 10.2), earthBank("葬室外侧长形护石堆", [s * 2.2, -1.4], [s * 2.2, 8], 2.25, .7, 1.7));
  p.push(box("长室尽端封石", 0, 1.12, 8.15, 2.3, 1.6, .4));
  for (let i = 0; i < 5; i++) p.push(box("横跨狭长葬室的平石盖", 0, 2.02, -.9 + i * 2, 2.55, .22, 2.1));
  return p;
}

function nuragheTower(): ModelPart[] {
  const p: ModelPart[] = [base(12, 12), cylinder("中央中室地坪", 0, .25, 0, 5.6, .14, stone), halfRoundWall("低门两侧有真正缺口的外厚石壁", 5.3, .65, 2.2, [0, .18, 0], 79, stone, Math.PI * 2 - 22 * Math.PI / 180), halfRoundWall("主室墙下方与低门对应的入口缺口", 2.9, .6, 2.2, [0, .18, 0], 73, stone, Math.PI * 2 - 34 * Math.PI / 180), part("上部收分且内侧保留夹壁空间的外塔壳", "lathe", stone, [0, 0, 0], [1, 1, 1], [0, 0, 0], { profile: [{ x: 5.3, y: 2.38 }, { x: 4.4, y: 8.6 }, { x: 3.8, y: 8.6 }, { x: 4.65, y: 2.38 }, { x: 5.3, y: 2.38 }] }), box("跨过两重石壁低门的长门楣", 0, 2.3, -4, 1.4, .4, 2.8)];
  for (const s of [-1, 1]) p.push(box("连通外塔门与中室门的侧石壁", s * .68, 1.22, -3.95, .28, 2.08, 2.7));
  for (let i = 0; i < 7; i++) p.push(ringAt("中室上方向内叠涩的厚石环", 2.9 - i * .35, .48, .6, [0, 2.58 + i * .5, 0]));
  p.push(cylinder("中室叠涩顶端封石", 0, 6, 0, 1.05, .28, stone), ringAt("塔顶连续防护石沿", 4.4, .32, .7, [0, 8.75, 0]));
  for (let i = 0; i < 22; i++) {
    const a = (-50 + i * 14) * Math.PI / 180, y = .32 + i * .27;
    p.push(part("位于外塔壁和中室之间的上升石阶", "box", stone, [Math.cos(a) * 3.65, y, Math.sin(a) * 3.65], [1.25, .22, .98], [0, -a * 180 / Math.PI, 0]));
  }
  p.push(ringAt("中室顶上连接阶道终点的环廊", 3.95, 1.45, .22, [0, 6.12, 0]));
  return p;
}

function motteBailey(): ModelPart[] {
  const p: ModelPart[] = [base(35, 30), part("上平下宽且内部实心的夯土高丘", "lathe", earth, [-8, .18, 0], [1, 1, 1], [0, 0, 0], { profile: [{ x: 0, y: 0 }, { x: 8.7, y: 0 }, { x: 4.6, y: 5.4 }, { x: 0, y: 5.4 }] }), box("低位外郭活动地坪", 7, .35, 0, 13, .34, 19, earth)];
  for (let i = 0; i < 18; i++) {
    const a = (i + .5) * Math.PI * 2 / 18;
    if (Math.cos(a) > .94) continue;
    p.push(part("丘顶围合木栅墙", "box", wood, [-8 + Math.cos(a) * 4.25, 6.3, Math.sin(a) * 4.25], [1.5, 1.45, .16], [0, 90 - a * 180 / Math.PI, 0]));
  }
  for (const s of [-1, 1]) {
    p.push(box("外郭两侧完整木围墙", 7, 1.4, s * 9.2, 13.2, 2.1, .18, wood), box("木塔侧壁", -8 + s * 1.7, 7.3, 0, .18, 3.4, 4, wood));
    p.push(box("木塔正面门洞两侧板壁", -8 + s * 1.2, 7.05, -2, 1, 2.9, .18, wood), box("外郭前门两侧围墙", 13.5, 1.4, s * 5.2, .18, 2.1, 8, wood));
    p.push(beam("上丘桥的两侧扶栏", wood, [-3.6, 6.45, s * .8], [1, 1.5, s * .8], .08));
  }
  p.push(box("丘顶木塔地板", -8, 5.7, 0, 3.6, .2, 4.2, wood), box("丘顶木塔后墙", -8, 7.3, 2, 3.6, 3.4, .18, wood), box("木塔高门楣", -8, 8.8, -2, 3.6, .4, .18, wood), roof(-8, 9.02, 0, 4.2, 4.6), beam("从外郭升上丘顶且下方悬空的木桥", wood, [-3.7, 5.65, 0], [1, .7, 0], .22, 1.65), ...[-1, 1].map(s => box("外郭后侧避开上丘桥的木围墙", .45, 1.4, s * 5.12, .18, 2.1, 8.36, wood)));
  for (const x of [3.5, 10]) p.push(box("外郭内独立木工作棚后墙", x, 1.55, 7.5, 4.2, 2.4, .14, wood), ...[-1, 1].map(s => box("工作棚前立柱", x + s * 1.9, 1.55, 4.8, .16, 2.4, .16, wood)), roof(x, 2.84, 6.2, 4.6, 3.3));
  return p;
}

function barbican(): ModelPart[] {
  const p: ModelPart[] = [base(18, 20), halfRoundFloor("前伸半圆门庭地面", 7.3, .18, [0, .18, -2], 180, stone), halfRoundWall("偏开外门的弧形瓮城主墙", 7.4, .6, 4.6, [0, .36, -2], 180, stone, 127 * Math.PI / 180), halfRoundWall("外门另一侧短弧护墙", 7.4, .6, 4.6, [0, .36, -2], 27, stone, 27 * Math.PI / 180), ...[-1, 1].map(s => box("通向城内的直城墙翼", s * 5.15, 2.66, -1.2, 6.3, 4.6, .7)), placedArch(0, -1.2, 1.6, 2.2, 1, 0, .36, .6), box("内门石券上方连接守门平台的石壁", 0, 4.99, -1.2, 4.4, 1.8, 1)];
  for (const s of [-1, 1]) p.push(box("内门两侧上层守门楼墩", s * 2.35, 3.2, -.2, 1, 5.68, 2.2), box("夹庭两侧连回内墙的短壁", s * 7.1, 2.66, -1.5, .6, 4.6, 1.4));
  p.push(box("内门上方可通行的守门平台", 0, 6.03, -.2, 5.7, .28, 2.4));
  p.push(placedArch(5.67, -6.76, 1.35, 2.1, .9, -50, .36, .38), part("外门石券上方连接两段弧墙的石门楣", "box", stone, [5.67, 4.58, -6.76], [3.6, .82, .9], [0, -50, 0]));
  for (let i = 0; i < 14; i++) {
    const a = (-174 + i * 10) * Math.PI / 180;
    p.push(part("弧墙顶间隔实心垛石", "box", stone, [Math.cos(a) * 7.1, 5.3, -2 + Math.sin(a) * 7.1], [.7, .65, .65], [0, 90 - a * 180 / Math.PI, 0]));
  }
  return p;
}

function ravelin(): ModelPart[] {
  const p: ModelPart[] = [base(23, 23), earthBank("外垒左向厚斜面土台", [-8, 6], [0, -9], 5, 2.7, 3), earthBank("外垒右向厚斜面土台", [0, -9], [8, 6], 5, 2.7, 3)];
  for (const s of [-1, 1]) {
    p.push(beam("尖角外垒正面连续胸墙", stone, [s * 7.3, 3.55, 5.8], [0, 3.55, -8], .65, .8), earthBank("后方开放喉口两边短护坡", [s * 8, 6], [s * 3.2, 6], 4, 2.6, 3));
    for (let i = 0; i < 4; i++) p.push(part("厚台上的分隔炮位石垛", "box", stone, [s * (1.4 + i * 1.65), 3.8, -5.7 + i * 3.1], [1.1, 1.15, 1.15], [0, s * 28, 0]));
  }
  p.push(slab("从开喉处斜接右侧厚台的实心缓坡", [[-4.03, 0], [4.03, 0], [4.03, 2.98], [-4.03, .1]], 2.2, [2, .2, 4], [0, 60.26, 0], earth), box("喉口低位进入平台", 0, .28, 8, 4, .2, 4));
  return p;
}

function hornwork(): ModelPart[] {
  const p: ModelPart[] = [base(32, 24), earthBank("两半棱堡之间的厚幕墙台", [-6.5, -4], [6.5, -4], 4.3, 2.6, 3.2)];
  for (const s of [-1, 1]) {
    p.push(earthBank("半棱堡朝外的长面", [s * 6.5, -4], [s * 11.5, -8.3], 4.5, 2.8, 3.2), earthBank("半棱堡向内折回的侧射翼", [s * 11.5, -8.3], [s * 12, -1.2], 4.5, 2.8, 3.2), earthBank("通向后方开放营地的长侧壁", [s * 12, -1.2], [s * 12, 9], 3.4, 2.1, 3.2), beam("向外突面连续胸墙", stone, [s * 6.5, 3.9, -5], [s * 11.8, 3.9, -9], .6), beam("侧射翼胸墙", stone, [s * 12.6, 3.9, -8], [s * 12.9, 3.9, -1], .6));
    for (let i = 0; i < 4; i++) p.push(box("侧射翼间隔防护石垛", s * 11.9, 4, -7 + i * 1.8, 1.05, 1.05, .8));
  }
  p.push(box("幕墙顶连续防护胸墙", 0, 3.9, -5.1, 13, .75, .6), slab("从开放后方进入幕墙上的宽坡", [[-4.7, 0], [4.7, 0], [4.7, 3.2], [-4.7, 0.1]], 2.7, [0, .18, .9], [0, 90, 0], earth));
  return p;
}

function caponier(): ModelPart[] {
  const p: ModelPart[] = [base(8, 14), box("护壕廊室连续地坪", 0, .3, -.6, 4.6, .24, 9.8), ...[-1, 1].map(s => box("侧射口下方厚墙", s * 2.05, 1.05, -.6, .5, 1.26, 9.8)), barrelRoof("与壕内低轮廓一致的防护筒券", 2.1, .45, 10, [0, 2.2, -.6], stone)];
  for (const s of [-1, 1]) {
    p.push(box("射口上方连续承券墙梁", s * 2.05, 2.04, -.6, .5, .32, 9.8));
    for (let i = 0; i <= 5; i++) p.push(box("把侧射窗隔开的厚石墩", s * 2.05, 1.8, -5.3 + i * 1.88, .5, .26, .75));
    p.push(box("前端正面射口两旁厚壁", s * 1.4, 1.38, -5.4, 1.35, 1.92, .5));
  }
  const endProfile: [number, number][] = Array.from({ length: 13 }, (_, i) => { const a = Math.PI - i * Math.PI / 12; return [Math.cos(a) * 2.55, Math.sin(a) * 2.55]; });
  p.push(box("前端射口上方厚门楣", 0, 2.15, -5.4, 1.6, .38, .5), slab("封住正面券顶下方而不填塞下部射口的半圆砖壁", endProfile, .5, [0, 2.2, -5.4]), placedArch(0, 5.7, 1, 1.2, 2.5, 0, .42, .4));
  for (const s of [-1, 1]) p.push(box("进入侧射廊后端的封墙翼", s * 1.7, 1.4, 4.2, 1.1, 1.96, .5));
  return p;
}

function claviculaGate(): ModelPart[] {
  const p: ModelPart[] = [base(22, 19), earthBank("营门左侧连续夯土长堤", [-10, 1.5], [-2.8, 1.5], 3, 1.3, 2), earthBank("营门右侧连续夯土长堤", [2.6, 1.5], [10, 1.5], 3, 1.3, 2), earthBank("门前阻直射而与主垒分离的横堤", [-3.4, -4.6], [3.4, -4.6], 2.4, 1, 1.75), box("真正开口的营门地道", 0, .24, -.4, 3.9, .12, 7.3, earth)];
  for (let i = 0; i < 6; i++) {
    const a = (-90 + i * 22) * Math.PI / 180, b = a + 22 * Math.PI / 180;
    p.push(earthBank("从门侧向内卷入的连续弯臂", [-2.8 + Math.cos(a) * 3.6, 5.1 + Math.sin(a) * 3.6], [-2.8 + Math.cos(b) * 3.6, 5.1 + Math.sin(b) * 3.6], 2.1, .9, 2));
  }
  for (const x of [-8.5, -6.4, -4.3, 4, 6.1, 8.2]) p.push(box("土垒顶的木防护桩板", x, 2.78, 1.5, 1.8, 1.2, .14, wood));
  return p;
}

function stupaMonument(): ModelPart[] {
  const p: ModelPart[] = [base(17, 17), cylinder("可环绕覆钵的连续圆形台基", 0, .32, 0, 13.4, .64, stone), part("闭底实心覆钵", "lathe", earth, [0, .64, 0], [1, 1, 1], [0, 0, 0], { profile: [{ x: 0, y: 0 }, { x: 4.4, y: 0 }, { x: 4.35, y: .85 }, { x: 4, y: 1.85 }, { x: 3.3, y: 2.85 }, { x: 2.25, y: 3.6 }, { x: .85, y: 4.05 }, { x: 0, y: 4.12 }] }), cylinder("覆钵顶平坦承栏台", 0, 4.85, 0, 2.25, .2, stone), cylinder("穿过方栏的中央伞轴", 0, 6, 0, .13, 2.4, wood)];
  for (const s of [-1, 1]) p.push(box("顶上方形护栏横壁", 0, 5.16, s * .82, 1.8, .42, .13), box("顶上方形护栏纵壁", s * .82, 5.16, 0, .13, .42, 1.8));
  for (let i = 0; i < 3; i++) p.push(cylinder("伞轴上的层叠圆盖", 0, 5.6 + i * .65, 0, 1.8 - i * .37, .13, stone));
  for (let i = 0; i < 24; i++) {
    const a = i * Math.PI / 12;
    if (i % 6 === 0) continue;
    p.push(box("围住环行道的独立石栏柱", Math.cos(a) * 6.1, 1.24, Math.sin(a) * 6.1, .25, 1.2, .25));
  }
  for (let i = 0; i < 4; i++) {
    const yaw = i * 90, a = yaw * Math.PI / 180;
    for (const y of [.95, 1.4]) p.push(halfRoundWall("石栏柱间连续有缺口的横栏", 6.2, .15, .14, [0, y, 0], yaw + 79, stone, Math.PI / 2 - 22 * Math.PI / 180));
    for (const s of [-1, 1]) p.push(box("横梁石门的两侧直柱", Math.sin(a) * 6.1 + Math.cos(a) * s * .86, 2.03, Math.cos(a) * 6.1 - Math.sin(a) * s * .86, .3, 2.78, .3));
    for (const s of [-1, 1]) p.push(box("连接三层门梁而不悬空的竖石撑", Math.sin(a) * 6.1 + Math.cos(a) * s * .86, 3.79, Math.cos(a) * 6.1 - Math.sin(a) * s * .86, .19, .9, .19));
    for (let j = 0; j < 3; j++) p.push(part("横梁石门上部三层外伸梁", "box", stone, [Math.sin(a) * 6.1, 3.38 + j * .42, Math.cos(a) * 6.1], [2.9 - j * .1, .2, .3], [0, yaw, 0]));
  }
  return p;
}

function chaityaHall(): ModelPart[] {
  const p: ModelPart[] = [box("主厅与侧通道的完整长地面", 0, .12, -1.8, 10.4, .24, 20.8, stone), halfRoundFloor("与长主厅连为一体的半圆后龛地面", 5.2, .24, [0, 0, 8.6], 0, stone), ...[-1, 1].map(s => box("主厅两侧直线岩壁", s * 5.1, 2.7, -1.8, .35, 4.92, 20.8)), halfRoundWall("后龛外侧连续厚岩壁", 5.25, .4, 4.92, [0, .24, 8.6], 0, stone), barrelRoof("由中央柱列直接承托的长筒券岩顶", 3.25, .35, 21.2, [0, 5.16, -1.8], stone), halfDomeRoof("筒券后端接后龛柱列的圆顶薄壳", 3.25, .35, [0, 5.16, 8.6], 0, stone), ...[-1, 1].map(s => box("主柱列与外岩壁之间的低侧廊顶", s * 4.2, 5.29, -1.8, 2.15, .26, 21.2)), halfRoundWall("后龛环行侧通道上方真正连续的薄石顶板", 5.4, 2.15, .24, [0, 5.16, 8.6], 0, stone)];
  for (const s of [-1, 1]) for (const z of [-9, -5.3, -1.6, 2.1, 5.8]) p.push(cylinder("主廊两侧石柱", s * 3.25, 2.7, z, .46, 4.92, stone), box("各柱实际承住券脚的石柱头", s * 3.25, 5.02, z, .8, .28, .8));
  for (let i = 1; i < 6; i++) {
    const a = i * Math.PI / 6;
    p.push(cylinder("绕过内部窣堵坡的后龛石柱", Math.cos(a) * 3.25, 2.7, 8.6 + Math.sin(a) * 3.25, .46, 4.92, stone), box("后龛石柱上方承顶柱头", Math.cos(a) * 3.25, 5.02, 8.6 + Math.sin(a) * 3.25, .8, .28, .8));
  }
  p.push(cylinder("后龛内供绕行的窣堵坡圆鼓", 0, 1.08, 8.6, 2.5, 1.68, stone), part("圆鼓上方的实心半球钵体", "lathe", stone, [0, 1.92, 8.6], [1, 1, 1], [0, 0, 0], { profile: [{ x: 0, y: 0 }, { x: 1.28, y: 0 }, { x: 1.17, y: .62 }, { x: .8, y: 1.08 }, { x: 0, y: 1.3 }] }), box("窣堵坡顶上小型方栏座", 0, 3.35, 8.6, .65, .26, .65), cylinder("内部小伞轴", 0, 3.94, 8.6, .08, 1, wood), cylinder("内部平展伞盖", 0, 4.25, 8.6, 1.3, .1, wood));
  for (const x of [-4.25, -1.75, 1.75, 4.25]) p.push(box("前方三个真实门洞之间的立面岩墩", x, 2.6, -12.2, .85, 4.72, .5));
  p.push(box("三个入口之上连接的横石楣", 0, 5, -12.2, 10.4, .32, .5), placedArch(0, -12.2, 3, .1, .5, 0, 5.16, .5), ...[-1, 1].map(s => box("马蹄弧窗两侧延接外岩壁的立面石肩", s * 4.4, 6.96, -12.2, 1.9, 3.6, .5)));
  for (const z of [-8.5, -3.5, 1.5, 6.5]) p.push(barrelRoof("与岩顶贴合的独立仿木弧肋", 3.21, .12, .14, [0, 5.12, z], wood));
  return p;
}

function hypostyleHall(): ModelPart[] {
  const p: ModelPart[] = [base(21, 24)];
  for (const x of [-7.2, -4.5, 4.5, 7.2]) for (const z of [-8, -2.7, 2.7, 8]) {
    p.push(cylinder("低侧厅密集束状柱身", x, 3.5, z, 1.05, 6.64, stone), part("低柱上部闭合花蕾柱头", "lathe", stone, [x, 6.52, z], [1, 1, 1], [0, 0, 0], { profile: [{ x: 0, y: 0 }, { x: .53, y: 0 }, { x: .72, y: .6 }, { x: .6, y: .9 }, { x: 0, y: .9 }] }));
  }
  for (const s of [-1, 1]) {
    p.push(box("低侧柱列真正支承的整片石屋盖", s * 5.9, 7.5, 0, 9, .3, 21.5));
    for (const z of [-8, -2.7, 2.7, 8]) p.push(cylinder("中央通道两侧高柱身", s * 1.9, 4.65, z, 1.2, 8.94, stone), part("高柱开放伞形柱头", "lathe", stone, [s * 1.9, 8.85, z], [1, 1, 1], [0, 0, 0], { profile: [{ x: 0, y: 0 }, { x: .6, y: 0 }, { x: .72, y: .28 }, { x: 1.1, y: .65 }, { x: 1.1, y: .85 }, { x: 0, y: .85 }] }));
    for (const z of [-10.25, -6.2, -2.1, 2.1, 6.2, 10.25]) p.push(box("透空高窗之间的短石墩", s * 2.4, 8.6, z, .32, 1.9, .55));
  }
  p.push(box("中央高柱与高窗共同托起的高屋盖", 0, 9.95, 0, 5.8, .5, 21.5));
  for (const s of [-1, 1]) p.push(box("侧厅外侧厚石壁", s * 10, 3.8, 0, .6, 7.24, 21.5), box("入口门洞两旁延展的立面厚壁", s * 6.2, 3.8, -10.7, 7.7, 7.24, .6));
  p.push(box("后方石厅封壁", 0, 3.8, 10.7, 20.5, 7.24, .6), box("入口上方承盖横梁", 0, 7.55, -10.7, 4.7, .6, .6));
  return p;
}

function chaharTaq(): ModelPart[] {
  const p: ModelPart[] = [base(10, 10), ...[-1, 1].flatMap(x => [-1, 1].map(z => box("托住四向拱券的落地角墩", x * 3, 2.1, z * 3, 1.5, 3.84, 1.5)))];
  for (const s of [-1, 1]) p.push(placedArch(0, s * 3, 2.25, 2.1, 1.5), placedArch(s * 3, 0, 2.25, 2.1, 1.5, 90));
  p.push(ringAt("四拱上方连续的圆顶承圈", 3.2, .55, .35, [0, 4.9, 0]), halfDomeRoof("亭顶前半部真正薄壳圆顶", 3.25, .24, [0, 5.07, 0], 0, tile), halfDomeRoof("亭顶后半部真正薄壳圆顶", 3.25, .24, [0, 5.07, 0], 180, tile), box("中部火台宽石底座", 0, .44, 0, 1.8, .52, 1.8), box("火台上部收进的方柱", 0, .96, 0, 1.1, .52, 1.1), box("火台上部展开的承火托板", 0, 1.32, 0, 1.7, .2, 1.7));
  return p;
}

function tetrapylon(): ModelPart[] {
  const p: ModelPart[] = [base(12, 12)];
  for (const x of [-1, 1]) for (const z of [-1, 1]) p.push(box("双街道间的四个厚角墩", x * 3.1, 2.5, z * 3.1, 2.4, 4.64, 2.4), box("石墩下部独立方基", x * 3.1, .38, z * 3.1, 2.7, .4, 2.7));
  for (const s of [-1, 1]) p.push(placedArch(0, s * 3.1, 1.9, 2.5, 2.4, 0, .18, .55), placedArch(s * 3.1, 0, 1.9, 2.5, 2.4, 90, .18, .55));
  p.push(box("跨在四向券顶之上的连续纪念阁底", 0, 5.3, 0, 9.1, .5, 9.1), ...[-1, 1].flatMap(s => [box("上部中空阁的横向厚壁", 0, 6.2, s * 4.1, 8.7, 1.4, .5), box("上部中空阁的纵向厚壁", s * 4.1, 6.2, 0, .5, 1.4, 8.7)]), box("上阁冠檐", 0, 7.08, 0, 9.3, .36, 9.3));
  return p;
}

function doubleAmbo(): ModelPart[] {
  const p: ModelPart[] = [base(10, 5), placedArch(0, 0, .8, .95, 2, 0, .18, .42), box("中部高讲经台地面", 0, 2.08, 0, 2.7, .25, 2.25), halfRoundWall("高台前方真正凸弧石读经围板", 1.32, .16, .92, [0, 2.21, -.2], 180, stone), box("读经围板上方平展书托", 0, 3.17, -1.05, 1.3, .09, .48)];
  for (const s of [-1, 1]) {
    for (let i = 0; i < 7; i++) p.push(box("从外向中部升高的独立固定踏步", s * (4.05 - i * .42), .18 + (i + 1) * .135, 0, .44, (i + 1) * .27, 1.5));
    p.push(beam("登台梯外侧连续斜石栏", stone, [s * 4.3, 1.05, .85], [s * 1.18, 2.98, .85], .14), box("讲经台后侧保护短壁", s * .85, 2.66, .95, .65, .9, .15));
  }
  return p;
}

function synthronon(): ModelPart[] {
  const p: ModelPart[] = [base(11, 8), halfRoundFloor("半圆席区前方同高石地面", 4.8, .18, [0, .18, 0], 0, stone)];
  for (let i = 0; i < 4; i++) {
    const r = 2.55 + i * .62, h = .45 + i * .38;
    p.push(halfRoundWall("中央登阶左侧的连续弧石座阶", r, .63, h, [0, .36, 0], -5, stone, Math.PI / 2 - 10 * Math.PI / 180), halfRoundWall("中央登阶右侧的连续弧石座阶", r, .63, h, [0, .36, 0], -95, stone, Math.PI / 2 - 10 * Math.PI / 180));
    p.push(box("在左右石席之间逐级抬起的登阶", 0, .36 + h / 2, 2.15 + i * .62, .68, h, .64));
  }
  p.push(halfRoundWall("席圈后方完整防护壁", 4.7, .3, 2.8, [0, .36, 0], 0, stone), box("最高位中间的高背主座承台", 0, 2.15, 4.05, 1.3, .4, 1), box("主座石背", 0, 2.95, 4.4, 1.3, 1.6, .15), ...[-1, 1].map(s => box("主座扶手石", s * .61, 2.65, 4.02, .14, .7, .85)));
  return p;
}

function mortsafe(): ModelPart[] {
  const p: ModelPart[] = [box("压在墓穴周边而不封住罩腔的前石枕", 0, .1, -1.15, 1.35, .2, .3), box("后石枕", 0, .1, 1.15, 1.35, .2, .3)];
  for (const s of [-1, 1]) p.push(box("纵向沉重铁底边梁", s * .57, .25, 0, .075, .1, 2.55, iron));
  for (let i = 0; i < 10; i++) {
    const z = -1.12 + i * .25;
    p.push(part("逐根连接底梁的拱形铁罩条", "tube", iron, [0, 0, 0], [1, 1, 1], [0, 0, 0], { radius: .021, path: [{ x: -.57, y: .25, z }, { x: -.55, y: .62, z }, { x: -.32, y: .9, z }, { x: 0, y: 1, z }, { x: .32, y: .9, z }, { x: .55, y: .62, z }, { x: .57, y: .25, z }] }));
  }
  for (const x of [-.4, 0, .4]) p.push(beam("沿罩顶纵向连接所有拱条的铁杆", iron, [x, x === 0 ? .998 : .84, -1.13], [x, x === 0 ? .998 : .84, 1.14], .035));
  for (const z of [-1.13, 1.14]) for (const x of [-.4, -.2, 0, .2, .4]) p.push(box("封住前后端面的竖向防盗格条", x, .59, z, .028, .67, .028, iron));
  for (const x of [-.57, .57]) for (const z of [-.85, .85]) p.push(box("锁定铁罩与基础的粗锚固杆", x, .22, z, .055, .44, .055, iron));
  return p;
}

function catacombGallery(): ModelPart[] {
  const p: ModelPart[] = [base(8, 16), box("墓廊内贯通行走地面", 0, .28, 0, 2.6, .2, 14.5, stone), barrelRoof("主葬廊完整砖券薄壳", 1.4, .3, 14.5, [0, 2.7, 0], tile)];
  for (const s of [-1, 1]) {
    p.push(box("横长安葬龛后方连续岩壁", s * 3.05, 1.72, 0, .4, 2.88, 14.5, earth));
    for (let i = 0; i <= 4; i++) p.push(box("把相邻墓龛隔开的实际竖向砖壁", s * 2.2, 1.72, -7.1 + i * 3.55, 1.65, 2.88, .24, stone));
    for (const y of [.45, 1.42, 2.39, 3.05]) p.push(box("分层墓龛间完整砖床过梁", s * 2.2, y, 0, 1.65, .15, 14.5, stone));
  }
  p.push(box("葬廊尽端封墙", 0, 1.7, 7.3, 6.5, 2.84, .45), placedArch(0, -7.2, 1.05, 1.3, .55, 0, .38, .35));
  return p;
}
