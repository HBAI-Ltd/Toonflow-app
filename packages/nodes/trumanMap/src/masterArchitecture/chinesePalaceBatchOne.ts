import { part, type ModelPart, type Triple } from "../assetModelParts";
import { riseSteps } from "./everydayOutdoorSpaceBatchOne";
import { roofAt } from "./chineseArchKit";
import { arch, box, cylinder, design, type ArchitecturePrototype } from "./structures";

const red = "#a34f3d", gold = "#c8a55d", stone = "#c0b9a3", wood = "#704a36", wall = "#9e5846";

// 原创影视布景比例，不复刻特定皇宫；各主体保留真实廊道、门洞和可用台阶。
export const chinesePalaceBatchOneDesigns: ArchitecturePrototype[] = [
  design("三踏御道重檐皇宫朝会大殿", "中式古代古装剧皇宫朝会主体：高台三条登殿踏道、双列朱柱、前廊与殿内宝座台、重檐四坡金瓦屋盖组成完整大殿，不是独立屋顶构件", audienceHall, "建筑", "中式"),
  design("三券并列前庭宫门", "中式古代古装剧宫廷入口：实厚三券门道连通宫门内外，中间门楼与两侧低值房分层，前庭供仪仗集结，三门不是同一单门的数量款式", palaceGate, "建筑", "中式"),
  design("十字抱厦宫墙转角楼", "中式古代古装剧宫城折角：转角楼核接四向抱厦，两条垂直宫墙在底部实接，十字上楼与有真实入口的折角巡廊组成完整防卫建筑", cornerTower, "建筑", "中式"),
  design("回廊内庭宫廷寝殿院", "中式古代古装剧后宫居住整院：后部独立寝殿、两侧回廊、前侧门与独立照壁围合开放内庭，连接廊路保留真实入口，不是四合院正房换色", residentialCourt, "建筑", "中式"),
];

// 庑殿屋面：高度场曲面、翼角上翘、瓦垄与戗脊，由屋面套件生成；footprint 即檐口外缘，无额外出挑。
function hipRoof(name: string, x: number, y: number, z: number, width: number, depth: number, rise: number): ModelPart[] {
  const alongX = width >= depth;
  return roofAt({ width: alongX ? depth : width, depth: alongX ? width : depth, style: "hip", color: gold, trimColor: wood, overhang: [0, 0], rise, ribs: true, lanterns: false, label: name }, [x, y, z], alongX);
}

function pillars(name: string, positions: [number, number][], floor: number, height: number, diameter = .5): ModelPart[] {
  return positions.flatMap(([x, z]) => [cylinder(`${name}独立石柱础`, x, floor + .11, z, diameter * 1.45, .22, stone), cylinder(`${name}朱漆承重通柱`, x, floor + .18 + height / 2, z, diameter, height, red)]);
}

function audienceHall(): ModelPart[] {
  const parts: ModelPart[] = [box("皇宫大殿完整落地高台", 0, .8, 0, 39, 1.6, 25, stone), box("高台上须弥出沿", 0, 1.7, 0, 40, .2, 26, stone)];
  for (const x of [-12, 0, 12]) parts.push(riseSteps("三路由地面实接殿台的登殿踏道", 0, 1.8, 9, .52, x ? 3.2 : 4.5, [x, 0, -17.68]));
  const columns: [number, number][] = [];
  for (const z of [-9, 9]) for (const x of [-15, -9, -3, 3, 9, 15]) columns.push([x, z]);
  parts.push(...pillars("大殿前后柱列", columns, 1.8, 6.4, .68));
  for (const z of [-9, 9]) parts.push(box("檐柱顶通长额枋", 0, 8.28, z, 31, .42, .5, red));
  for (const side of [-1, 1]) parts.push(box("殿内两侧实壁", side * 16, 4.7, 1.5, .3, 5.8, 15.3, wall), box("短向承接屋盖的柱顶大梁", side * 15, 8.28, 0, .5, .42, 18.5, red));
  parts.push(box("殿内后部封闭墙", 0, 4.7, 9, 32, 5.8, .3, wall), ...hipRoof("下层庑殿披檐", 0, 8.4, 0, 37, 24, 3.1));
  for (const side of [-1, 1]) parts.push(box("上层承檐短壁", side * 13, 10.7, 0, .35, 3.1, 11, red), box("上层短向封檐与承梁", 0, 10.7, side * 5.5, 26.3, 3.1, .35, red));
  parts.push(...hipRoof("上层重檐正殿屋盖", 0, 12.2, 0, 29, 14, 3.2), box("殿内宝座须弥台", 0, 2.15, 6.2, 6, .7, 3.8, stone), riseSteps("宝座台前登阶", 1.8, 2.5, 4, .32, 3.2, [0, 0, 3.02]), box("宝座台上实际承座", 0, 2.96, 6.6, 2.6, .9, 1.15, gold), box("宝座背屏", 0, 3.8, 7.05, 3, 2.6, .18, red));
  return parts;
}

function palaceGate(): ModelPart[] {
  const parts: ModelPart[] = [box("三门前庭完整落地石坪", 0, .12, -3, 34, .24, 23, stone)];
  for (const x of [-9, 0, 9]) {
    const value = arch(x, 0, 2, 3.7, 4.8, 1.1);
    value.position.y = .24;
    parts.push(value, box("券顶承托宫门上平台的实心填墙", x, 6.95, 0, 6.2, 1.1, 4.8, wall));
  }
  for (const x of [-14.3, -4.5, 4.5, 14.3]) parts.push(box("三券之间接地的独立厚门墩", x, 3.7, 0, Math.abs(x) > 10 ? 4.4 : 2.8, 6.92, 4.8, wall));
  parts.push(box("三门上部连续宫城通台", 0, 7.62, 0, 33, .24, 6.5, stone), ...pillars("中央宫门楼", [[-4,-2], [4,-2], [-4,2], [4,2]], 7.74, 4.4));
  for (const z of [-2,2]) parts.push(box("门楼柱顶横枋", 0, 12.18, z, 8.5, .25, .3, red));
  for (const x of [-4,4]) parts.push(box("门楼侧向封板", x, 9.96, 0, .2, 4.44, 4, red));
  parts.push(...hipRoof("中央宫门金瓦屋盖", 0, 12.3, 0, 12, 8, 2.8));
  for (const side of [-1,1]) {
    parts.push(box("宫门两侧低值房后墙", side * 11.8, 9.3, 1.8, 6.4, 3.12, .2, wall), ...pillars("低值房前廊", [[side * 9,-1.8], [side * 14.6,-1.8]], 7.74, 3.1, .4), box("低值房前廊实接柱顶横枋", side * 11.8, 10.9, -1.8, 6.4, .25, .3, red), ...hipRoof("宫门侧值房屋盖", side * 11.8, 11.0, 0, 8, 5.6, 1.5));
  }
  return parts;
}

function cornerTower(): ModelPart[] {
  const parts: ModelPart[] = [box("折角楼完整落地高台", 0, 3.1, 0, 15, 6.2, 15, stone), box("折角楼承楼上台", 0, 6.32, 0, 15.8, .24, 15.8, stone), box("接入转角楼的东向厚宫墙", 17, 3.22, 0, 20, 6.44, 2.2, wall), box("接入转角楼的北向厚宫墙", 0, 3.22, 17, 2.2, 6.44, 20, wall)];
  parts.push(...pillars("转角楼主核", [[-5,-5],[5,-5],[-5,5],[5,5]], 1.44, 7.2, .55));
  for (const x of [-5,5]) {
    for (const z of [-3.25,3.25]) parts.push(box("侧抱厦入口两旁实墙", x, 5, z, .25, 7.12, 3.5, wall));
    parts.push(box("侧抱厦入口上方承重门楣", x, 7.5, 0, .25, 2.12, 3, wall));
  }
  for (const x of [-3.25,3.25]) parts.push(box("后抱厦入口两旁实墙", x, 5, 5, 3.5, 7.12, .25, wall));
  parts.push(box("后抱厦入口上方承重门楣", 0, 7.5, 5, 3, 2.12, .25, wall));
  for (const x of [-5,5]) parts.push(box("前入口两旁下围实墙", x * .7, 3.65, -5, 3, 4.42, .22, wall));
  for (const z of [-5,5]) parts.push(box("主核柱顶横梁", 0, 8.7, z, 10.6, .3, .35, red));
  for (const x of [-5,5]) parts.push(box("主核侧承梁", x, 8.7, 0, .35, .3, 10.6, red));
  parts.push(...hipRoof("角楼主屋盖", 0, 8.9, 0, 14.5, 14.5, 3));
  for (const side of [-1,1]) {
    for (const alongX of [true,false]) {
      const x = alongX ? side * 7.6 : 0, z = alongX ? 0 : side * 7.6;
      parts.push(box("四向抱厦由主台承托的伸出木地板", x, 1.5, z, alongX ? 5.5 : 4.8, .18, alongX ? 4.8 : 5.5, wood));
      const supports: [number,number][] = alongX ? [[side * 9.9,-2],[side * 9.9,2]] : [[-2,side * 9.9],[2,side * 9.9]];
      parts.push(...pillars("四向抱厦外柱", supports, 1.59, 4.9, .38), box("抱厦檐下承枋", alongX ? side * 9.9 : 0, 6.55, alongX ? 0 : side * 9.9, alongX ? .3 : 4.5, .28, alongX ? 4.5 : .3, red), ...hipRoof("低层十字抱厦屋盖", x, 6.65, z, alongX ? 6.3 : 5.4, alongX ? 5.4 : 6.3, 1.4));
    }
  }
  for (const value of parts.slice(4)) value.position.y += 5;
  parts.push(box("东向宫墙上真实接入抱厦的巡行路面", 17, 6.515, 0, 20, .15, 2.2, stone), box("北向宫墙上真实接入抱厦的巡行路面", 0, 6.515, 17, 2.2, .15, 20, stone), riseSteps("楼前由地面上行的前半石阶", 0, 3.295, 13, .4, 3, [0,0,-20.75]), riseSteps("接续前半阶并直接登上木地板的后半石阶", 3.295, 6.59, 13, .4, 3, [0,0,-15.55]));
  return parts;
}

function residentialCourt(): ModelPart[] {
  const parts: ModelPart[] = [box("寝殿与回廊共用落地院坪", 0, .12, 0, 31, .24, 35, stone), box("后部寝殿抬高地台", 0, .6, 9, 25, .72, 13, stone), riseSteps("内庭接上寝殿前廊的宽阶", .24, .96, 4, .4, 6, [0,0,.9])];
  parts.push(...pillars("寝殿前后朱柱", [[-10,3],[-6,3],[-2,3],[2,3],[6,3],[10,3],[-10,14],[10,14]], .96, 4.6));
  parts.push(box("寝殿后封墙", 0, 3.2, 14, 20.5, 4.48, .25, wall));
  for (const side of [-1,1]) parts.push(box("寝殿侧封墙", side * 10, 3.2, 8.5, .25, 4.48, 11, wall), box("寝室前隔扇两侧实墙", side * 6.2, 2.6, 5.2, 7.6, 3.28, .18, red));
  parts.push(box("寝室中央门洞上梁", 0, 4.5, 5.2, 20.4, .55, .22, red), box("寝殿前檐通长额枋", 0, 5.6, 3, 21, .3, .4, red), ...hipRoof("寝殿完整四坡屋盖", 0, 5.75, 8.5, 26, 15, 2.8));
  parts.push(box("寝室中央留出前厅分流的实隔墙", 0, 2.6, 10.2, .18, 3.28, 7.5, red));
  for (const side of [-1,1]) {
    parts.push(box("两侧寝室独立架床承脚", side * 5.5, 1.2, 10.2, 2.5, .48, 3, wood), box("架床上实际承接四角帷柱的床面", side * 5.5, 1.5, 10.2, 2.6, .16, 3.1, gold));
    for (const dx of [-1.15,1.15]) for (const dz of [-1.4,1.4]) parts.push(cylinder("与床面实接的独立帷帐木柱", side * 5.5 + dx, 2.57, 10.2 + dz, .1, 2.14, wood));
    parts.push(box("四根帷柱共同承托的架床帐顶", side * 5.5, 3.7, 10.2, 2.6, .12, 3.1, gold));
  }
  for (const side of [-1,1]) {
    parts.push(box("侧回廊连续抬高地板", side * 12.6, .48, -3, 3.2, .48, 23, stone), box("回廊外侧宫墙", side * 14.1, 2.35, -3, .28, 4.22, 23, wall));
    const positions: [number,number][] = [-13,-8,-3,2,7].map(z=>[side * 11.2,z]);
    parts.push(...pillars("两侧回廊内柱", positions, .72, 3.1, .35), box("廊柱上通长檐枋", side * 11.2, 3.88, -3, .3, .3, 23.8, red), ...hipRoof("两侧回廊低屋盖", side * 12.6, 4, -3, 5.3, 25, 1.25));
    parts.push(box("前院侧门旁独立界墙", side * 9.4, 2.2, -14.4, 5.5, 3.92, .3, wall), box("前院中门两侧边墩", side * 3.4, 2.2, -14.4, 1, 3.92, .5, red));
  }
  parts.push(box("前院门洞实际跨两边墩的上枋", 0, 4.08, -14.4, 7.8, .3, .6, red), ...hipRoof("寝院前门屋盖", 0, 4.25, -14.4, 9, 3.8, 1.25), box("内庭独立照壁落地基座", 0, .55, -8.5, 6.4, .62, .9, stone), box("不封两侧绕行的寝院照壁", 0, 2.05, -8.5, 5.8, 2.4, .35, wall), ...hipRoof("照壁压顶", 0, 3.35, -8.5, 6.6, 1.5, .6));
  return parts;
}
