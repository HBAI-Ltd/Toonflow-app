import type { ModelPart } from "../assetModelParts";
import { glazedWall } from "./modernResidenceSpaceBatchOne";
import { boxesMesh, type SolidBox } from "./publicSpaceBatchEight";
import { box, cylinder, design, type ArchitecturePrototype } from "./structures";

const paving = "#b9b8a9", roofColor = "#738b87", timber = "#aa906b", counterColor = "#aeb7af", dark = "#526a6b";

function tableAndBenches(x: number, z: number): SolidBox[] {
  return [{ center: [x, 1, z], size: [1.5, .1, 1.4] }, { center: [x, .575, z], size: [.18, .75, .8] }, ...[-1, 1].flatMap(side => [{ center: [x + side * 1.22, .425, z], size: [.55, .45, 1.8] } as SolidBox, { center: [x + side * 1.47, .85, z], size: [.11, .8, 1.8] } as SolidBox])];
}

export const everydayDiningSpaceBatchOneDesigns: ArchitecturePrototype[] = [
  design("贯街中厨双厅餐馆", "前后两座餐堂隔着封闭高厨房独立面向两条街，西侧完整顾客廊从双街门绕过厨房串联双厅；东侧隔墙工作廊另接两端送货门与厨门，四种高低屋盖和实际门窗围合真正前后分流的整栋餐馆", throughStreetRestaurant, "建筑", "现代"),
  design("中厅双廊侧包间酒楼", "中央高公共餐厅前接横向门厅，两侧低包间各有面向内顾客廊和外侧上菜廊的两道真门；两条外工作廊经后横廊接到独立厨房，顾客廊在后端实封，客厅宽门与中央高侧窗围合前客后勤分流的完整酒楼", privateRoomRestaurant, "建筑", "现代"),
];

function throughStreetRestaurant(): ModelPart[] {
  const parts: ModelPart[] = [
    box("两街餐馆及中段双廊共同的连续落地楼面", 0, .1, 0, 12.72, .2, 18.72, paving),
    ...[-1, 1].map(end => box("与门内地坪同标高的双街齐平入口外沿", 0, .1, end * 9.55, 12.72, .2, 1.1, paving)),
    box("前公共餐堂沿完整外墙与厨房前墙承托的低屋盖", 0, 3.85, -5.65, 12.8, .3, 7.5, roofColor),
    box("后公共餐堂沿完整外墙与厨房后墙承托的低屋盖", 0, 3.85, 5.9, 12.8, .3, 7, roofColor),
    box("高厨房由四面独立承墙围合的完整屋盖", .5, 5.06, .25, 7, .24, 5.1, roofColor),
    box("西侧顾客绕行廊实际接在厨墙与外墙之间的低屋盖", -4.35, 3.08, .25, 3.9, .16, 4.7, timber),
    box("东侧工作廊实际接在厨墙与外墙之间的低屋盖", 4.85, 3.08, .25, 2.9, .16, 4.7, timber),
    ...glazedWall("前街顾客门和独立工作门之间真正开孔的餐堂橱窗", [-6, -9], [6, -9], .2, 3.8, [[.15, .85, 6.6, 2.15]], [[-4.5, .2, 1.7, 2.65], [5.2, .2, 1.3, 2.5]]),
    ...glazedWall("后街顾客门与后工作门真正分别进入双廊的后立面", [-6, 9], [6, 9], .2, 3.8, [[.15, .85, 6.6, 2.15]], [[-4.5, .2, 1.7, 2.65], [5.2, .2, 1.3, 2.5]]),
    ...glazedWall("前堂面向西街的真实长窗承墙", [-6, -9], [-6, -2], .2, 3.8, [[0, 1.1, 4.4, 1.7]]),
    ...glazedWall("后堂面向西街的真实长窗承墙", [-6, 2.5], [-6, 9], .2, 3.8, [[0, 1.1, 4.1, 1.7]]),
    ...glazedWall("绕行顾客廊可向街外采光的低窗墙", [-6, -2], [-6, 2.5], .2, 3, [[0, .9, 3.2, 1.45]]),
    ...glazedWall("前工作廊朝街的独立高采光墙", [6, -9], [6, -2], .2, 3.8, [[0, 2.2, 4.1, .85]]),
    ...glazedWall("后工作廊朝街的独立高采光墙", [6, 2.5], [6, 9], .2, 3.8, [[0, 2.2, 3.8, .85]]),
    ...glazedWall("厨房侧工作廊真正封合到低屋盖的侧高窗", [6, -2], [6, 2.5], .2, 3, [[0, 1.8, 2.6, .7]]),
    ...glazedWall("中段封闭厨房西墙在顾客廊上方独立开窗", [-2.7, -2], [-2.7, 2.5], .2, 5, [[0, 3.65, 2.7, .9]]),
    ...glazedWall("高厨房东侧独立员工门实际通向工作廊", [3.7, -2], [3.7, 2.5], .2, 5, [[0, 3.65, 2.7, .9]], [[0, .2, 1.3, 2.6]]),
    ...glazedWall("高厨房前墙真正留出前堂传餐窗而不打断顾客廊", [-2.7, -2], [3.7, -2], .2, 5, [[0, 3.75, 3.7, .85]], [[-.3, 1.3, 2.5, 1.05]]),
    ...glazedWall("高厨房后墙真正留出后堂传餐窗而不堵工作廊", [-2.7, 2.5], [3.7, 2.5], .2, 5, [[0, 3.75, 3.7, .85]], [[-.3, 1.3, 2.5, 1.05]]),
    ...glazedWall("前堂与前工作廊之间允许员工进入餐堂的实际门", [4.3, -9], [4.3, -2], .2, 3.8, [], [[0, .2, 1.1, 2.5]]),
    ...glazedWall("后堂与后工作廊之间允许员工进入餐堂的实际门", [4.3, 2.5], [4.3, 9], .2, 3.8, [], [[0, .2, 1.1, 2.5]]),
  ];
  const structure: SolidBox[] = [], furniture: SolidBox[] = [], counters: SolidBox[] = [];
  for (const z of [-5.5, 5.5]) structure.push({ center: [.12, 3.68, z], size: [12.48, .24, .23] });
  for (const z of [-2, 2.5]) {
    counters.push({ center: [.2, .71, z], size: [2.5, 1.02, .62] });
    furniture.push({ center: [.2, 1.26, z], size: [2.7, .08, .8] });
  }
  counters.push({ center: [.5, .69, .4], size: [3.7, .98, 1] });
  furniture.push({ center: [.5, 1.22, .4], size: [3.8, .08, 1.1] });
  for (const z of [-6.6, -3.7, 4.2, 7]) furniture.push(...tableAndBenches(1, z));
  parts.push(boxesMesh("前后餐堂长跨屋梁实际接到两侧外墙的完整承架", dark, structure), boxesMesh("前后真实传餐孔下柜与中厨独立操作柜", counterColor, counters));
  for (let offset = 0; offset < furniture.length; offset += 20) parts.push(boxesMesh("双厅桌面坐台与工作台实际落在连续楼面上", timber, furniture.slice(offset, offset + 20)));
  return parts;
}

function privateRoomRestaurant(): ModelPart[] {
  const parts: ModelPart[] = [
    box("酒楼门厅中厅包间双廊和后厨共同的完整落地楼面", 0, .1, 0, 26.8, .2, 28.8, paving),
    box("主门前与内部门厅同标高的实际入场外沿", 0, .1, -14.7, 8, .2, 1.4, paving),
    box("中央高公共餐厅沿四面高承墙闭合的独立屋盖", 0, 6.12, -.5, 10.8, .24, 15.5, roofColor),
    ...[-1, 1].map(side => box("低包间与两条不同用途走廊共同的侧翼屋盖", side * 9, 3.61, -.5, 8.8, .22, 15.5, roofColor)),
    box("前横向接待门厅完整低屋盖", 0, 3.61, -11.05, 26.8, .22, 6.7, roofColor),
    box("后部横向上菜廊完整低屋盖", 0, 3.61, 8, 26.8, .22, 2.3, roofColor),
    box("独立后厨房沿服务墙与外墙承托的高屋盖", 0, 4.31, 11.5, 26.8, .22, 5.4, roofColor),
    ...glazedWall("完整酒楼临街宽前门与独立两侧高窗", [-13, -14], [13, -14], .2, 3.5, [[-8.5, .9, 5.7, 1.85], [8.5, .9, 5.7, 1.85]], [[0, .2, 3.6, 2.8]]),
    ...glazedWall("后厨房后巷送货门及真实高采光长窗", [-13, 14], [13, 14], .2, 4.2, [[-1, 2.3, 17.5, 1.2]], [[11.5, .2, 1.5, 2.6]]),
    ...glazedWall("前门厅进入中央公共餐厅的真实宽门与高侧窗", [-5, -8], [5, -8], .2, 6, [[0, 4.1, 6.8, 1.3]], [[0, .2, 5.2, 3]]),
    ...glazedWall("中央公共餐厅后部单独接入上菜廊的真实门", [-5, 7], [5, 7], .2, 6, [[0, 4.1, 6.8, 1.3]], [[0, .2, 1.6, 2.6]]),
    ...glazedWall("后厨两端员工门与中央传餐窗实际接向横上菜廊", [-13, 9], [13, 9], .2, 4.2, [], [[-8, .2, 1.3, 2.6], [8, .2, 1.3, 2.6], [0, 1.3, 4.2, 1.15]]),
  ];
  const structure: SolidBox[] = [], furniture: SolidBox[] = [], chairs: SolidBox[] = [], counters: SolidBox[] = [];
  for (const side of [-1, 1]) {
    parts.push(...glazedWall("前横门厅侧面真实长窗", [side * 13, -14], [side * 13, -8], .2, 3.5, [[0, 1, 3.4, 1.65]]), ...glazedWall("包间外工作廊实际高窗承墙", [side * 13, -8], [side * 13, 9], .2, 3.5, [[-4.2, 1.5, 5.1, 1.25], [4.2, 1.5, 5.1, 1.25]]), ...glazedWall("后厨侧墙独立高窗真正封合高屋盖", [side * 13, 9], [side * 13, 14], .2, 4.2, [[0, 2.4, 2.8, 1.1]]), ...glazedWall("中央高厅经实际侧门进入内顾客廊的高窗侧墙", [side * 5, -8], [side * 5, 7], .2, 6, [[0, 4.1, 12.6, 1.3]], [[-2.5, .2, 1.4, 2.6], [1.5, .2, 1.4, 2.6]]),
      ...glazedWall("两间侧包间各自从内顾客廊进入的真实客门", [side * 6.8, -8], [side * 6.8, 7], .2, 3.5, [], [[-5.7, .2, 1.2, 2.6], [2.3, .2, 1.2, 2.6]]), ...glazedWall("两间侧包间背后各自独立接外工作廊的上菜门", [side * 11.5, -8], [side * 11.5, 7], .2, 3.5, [], [[-1.6, .2, 1.1, 2.5], [5.9, .2, 1.1, 2.5]]),
      box("前门厅不与外工作廊串行的侧翼实封头墙", side * 9.9, 1.85, -8, 6.2, 3.3, .2), box("两间包间之间真正接到客廊与工作廊墙的分室墙", side * 9.15, 1.85, -.5, 4.7, 3.3, .18), box("后包间与横向上菜廊之间实际封合的后墙", side * 9.15, 1.85, 7, 4.7, 3.3, .2), box("内顾客廊后端真实实封而不串入上菜横廊的短墙", side * 5.9, 1.85, 7, 1.8, 3.3, .2));
    structure.push({ center: [side * 5, 1.85, -11], size: [.24, 3.3, .24] }, { center: [side * 6.5, 2.2, 11.5], size: [.25, 4, .25] });
    for (const z of [-4.1, 3.4]) {
      const x = side * 9.15;
      parts.push(cylinder("包间内保留双门环绕通行的独立圆桌桌面", x, 1, z, 1.56, .09, timber), cylinder("圆桌桌面真实接到地面的独立承重中柱", x, .5775, z, .17, .755, dark), cylinder("圆桌中柱下方实际贴住包间楼面的宽脚盘", x, .23, z, .55, .06, dark));
      for (const direction of [-1, 1]) {
        chairs.push({ center: [x + direction * 1.13, .44, z], size: [.52, .48, .52] }, { center: [x + direction * 1.4, .85, z], size: [.1, .7, .52] });
        chairs.push({ center: [x, .44, z + direction * 1.13], size: [.52, .48, .52] }, { center: [x, .85, z + direction * 1.4], size: [.52, .7, .1] });
      }
    }
  }
  for (const z of [-7.5, -.5, 6.5]) structure.push({ center: [.12, 5.84, z], size: [10.48, .32, .24] });
  structure.push({ center: [.12, 3.35, -11], size: [26.48, .3, .25] }, { center: [.12, 4.05, 11.5], size: [26.48, .3, .25] });
  for (const z of [-5.2, -1, 3.2]) for (const x of [-2.4, 2.4]) furniture.push(...tableAndBenches(x, z));
  counters.push({ center: [0, .71, 9], size: [4.2, 1.02, .68] }, { center: [-3.5, .71, 12.5], size: [8, 1.02, 1] }, { center: [6.2, .71, 12.5], size: [7.5, 1.02, 1] });
  furniture.push({ center: [0, 1.26, 9], size: [4.4, .08, .85] }, { center: [-3.5, 1.26, 12.5], size: [8.1, .08, 1.1] }, { center: [6.2, 1.26, 12.5], size: [7.6, .08, 1.1] });
  parts.push(boxesMesh("中央高厅跨梁与前后低屋盖实际落地的柱梁结构", dark, structure), boxesMesh("上菜横廊传餐口与后厨实际接地的连续柜体", counterColor, counters));
  for (let offset = 0; offset < furniture.length; offset += 20) parts.push(boxesMesh("公共大厅保留中央纵通道的全部桌面坐台和后厨工作面", timber, furniture.slice(offset, offset + 20)));
  for (let offset = 0; offset < chairs.length; offset += 20) parts.push(boxesMesh("包间圆桌周围落地且给两道门留空的独立椅体", timber, chairs.slice(offset, offset + 20)));
  return parts;
}
