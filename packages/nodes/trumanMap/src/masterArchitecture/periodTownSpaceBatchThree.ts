import { part, beam, type ModelPart } from "../assetModelParts";
import { polygon } from "../masterNature/shared";
import { base, box, design, type ArchitecturePrototype } from "./structures";
import { stairFlight } from "./historicSpaceBatchSeven";
import { openingWall, holesAt, postSet } from "./periodPublicSpaceBatchOne";
import { boxesMesh, type SolidBox } from "./publicSpaceBatchEight";

const stone = "#b3aa94", timber = "#998361", plank = "#b2a384", roofColor = "#7b7e6a";

// 完整长屋内的前车厅、后马位和后部草阁共同组织交通，不将马模型或现成马厩拼进普通仓房扩主。
// 寄马车行兼存马车及侧草阁的类型参考：https://parks.ca.gov/?page_id=28018
export const periodTownSpaceBatchThreeDesigns: ArchitecturePrototype[] = [
  design("前高车厅后双列寄马车行", "通高前厅容纳车马登记与马车停放，后方双列独立马位通过喂养侧道接到中央通马长道；后厩上的两条草阁在尾端横向连通，前厅侧内阶真实接到草阁开边，完整承柱梁架与前后真门贯穿整座年代车行", liveryCarriageStable, "建筑", "欧式"),
];

function liveryCarriageStable(): ModelPart[] {
  const p: ModelPart[] = [base(20, 38), openingWall("寄马车行前厅真正开通的高马车门与独立登记室入口", 16, 6.4, [...holesAt([0], 5, 4.5, .005), ...holesAt([-5.6], 1.2, 2.6), ...holesAt([5.5], 1.8, 2, 1.3)], [0, .18, -16], 0, plank), openingWall("后厩中央通马长道出口及草阁后上料窗真正分层的完整后壁", 16, 6.4, [...holesAt([0], 3.6, 2.7, .005), ...holesAt([0], 2.2, 1.9, 3.355), ...holesAt([-5.3, 5.3], 1.6, 1.7, 4.1)], [0, .18, 16], 0, plank), polygon("后厩两侧草阁在尾端真正连通而中央留整条投草挑空的U形木楼面", timber, [[-8, -4], [-2, -4], [-2, 14], [2, 14], [2, -4], [8, -4], [8, 16], [-8, 16]], .22, [0, 3.28, 0]), part("车行整座长屋由厚壁和通高木柱共同承托的完整双坡阁顶", "extrude", roofColor, [0, 6.78, 0], [1, 1, 1], [0, 0, 0], { depth: 32.8, profile: [{ x: -8.4, y: 0 }, { x: 0, y: 2.2 }, { x: 8.4, y: 0 }, { x: 8.4, y: -.2 }, { x: -8.4, y: -.2 }] }), { ...postSet("后厩内由地面连续贯通草阁边缘并接到整屋阁顶的八根完整木柱", [-4, 3, 10, 16].flatMap(z => [[-2, z], [2, z]] as [number, number][]), 6.4, .18), color: timber }, stairFlight("通高前厅侧缘真正连续接到后草阁开边的独立内石阶", 20, 1.4, 3.32, .28, 0, [-5.3, .18, -9.6], -90), openingWall("前厅独立登记室面向停放车厅的真实职员门", 5, 2.7, holesAt([0], 1.2, 2.4), [-4, .18, -13.5], 90, plank), box("登记室背面由地面连续接承低屋盖的完整短壁", -6, 1.53, -11, 4, 2.7, .22, plank), box("登记室三面围护与车行外壁共同接承的完整低木盖", -6, 2.98, -13.5, 4, .2, 5, timber), box("登记室内避开职员门而实际落地的完整木案柜", -6.6, .63, -13.5, 1.6, .9, 1.2, timber), box("草阁尾端跨过通马长道上方而接承真实木栏的连续护边", 0, 4, 14, 4, 1, .1, timber)];
  const dividers: SolidBox[] = [], fencePosts: [number, number][] = [];
  for (const side of [-1, 1]) {
    p.push(openingWall("整屋左右连续厚板围护中实际分开前车厅和后马位的真窗", 32, 6.4, [...holesAt([12.5, 7.5], 1.8, 2, 1.3), ...holesAt([2.25, -1.25, -4.75, -8.25, -11.75], 1.5, 1.25, 1.5), ...holesAt([1, -6, -13], 1.6, 1.5, 4.2)], [side * 8, .18, 0], 90, plank), box("后厩草阁中央长挑空边缘实际接在木楼面上的完整护栏", side * 2, 4, 5, .1, 1, 18, timber), box("草阁各侧底部实际落在横承梁上并托住楼面的连续纵木梁", side * 5, 3.17, 6, .22, .22, 20, timber), box("五个马位前方跨过真实出入通口并接到所有立杆的高木横栏", side * 4.5, 2.65, 4.75, .12, .12, 17.5, timber), box("沿马位外墙连续喂养槽真正有厚度的独立槽底", side * 7.5, .75, 4.75, .65, .1, 17.5, timber));
    for (const x of [7.18, 7.83]) p.push(box("喂养长槽的两条真实上立薄侧壁", side * x, .925, 4.75, .055, .35, 17.5, timber));
    for (const z of [-4, 13.5]) p.push(box("喂养长槽两端与槽底和双侧壁实际闭合的短端板", side * 7.5, .925, z, .65, .35, .06, timber));
    for (const z of [-4, -.5, 3, 6.5, 10, 13.5]) {
      dividers.push({ center: [side * 6.25, .98, z], size: [3.5, 1.6, .14] });
      fencePosts.push([side * 4.5, z]);
    }
    for (const z of [-2.25, 1.25, 4.75, 8.25, 11.75]) p.push(beam("把喂养槽底荷载实际斜传到完整外壁的短木托", timber, [side * 7.87, .4, z], [side * 7.3, .7, z], .07));
  }
  p.push(boxesMesh("双列独立马位之间真正落地且保持前侧喂养道通行的十二片低隔板", timber, dividers), { ...postSet("马位前方高木横栏真正由厩地接承的十二根独立竖杆", fencePosts, 2.5, .18), color: timber });
  for (const z of [-4, 3, 10, 16]) p.push(box("两侧草阁楼面下真正嵌入边柱和两外墙的连续木承梁", 0, 3.15, z, 16.2, .26, .26, timber));
  for (const [a, b] of [[-8, -6], [-4.6, -2], [2, 8]]) p.push(box("草阁前临空边真实让开侧阶顶口的独立木护栏", (a! + b!) / 2, 4, -4, b! - a!, 1, .1, timber));
  const stairPosts: SolidBox[] = [];
  for (const x of [-6, -4.6]) {
    p.push(beam("前车厅侧内阶两边实际连续接到高端落地竖杆的斜木扶手", timber, [x, 1.18, -9.6], [x, 4.5, -4], .065));
    for (const t of [0, .5, 1]) stairPosts.push({ center: [x, .68 + 3.32 * t, -9.6 + 5.6 * t], size: [.075, 1, .075] });
  }
  p.push(boxesMesh("内阶两侧从真实石阶内嵌接到斜扶手的完整竖木杆", timber, stairPosts));
  return p;
}
