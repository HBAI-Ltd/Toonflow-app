import type { ModelPart, Triple } from "../assetModelParts";
import { box, design } from "./structures";
import { slopePanel } from "./vernacularWorldBatchOne";
import { solidBox } from "./vernacularWorldBatchThree";
import { meshBeam } from "./vernacularWorldBatchFive";
import { hardFloor } from "./vernacularWorldBatchSix";
import { packMeshes } from "./vernacularWorldBatchThirteen";
import { lattice, periodWall } from "./periodResidenceSpaceBatchOne";

const brick = "#a48d79", plaster = "#c6bda5", stone = "#aaa99a", timber = "#886f52", tile = "#657269";

// 上海城市转角住楼的楔形用地和底商上住类型参考；本体平面、尺度、楼梯与各立面均为原创。
// https://www.xuhui.gov.cn/zfjg_qzfbm_fgj_bmdt/20230128/509539.html
export const periodResidenceSpaceBatchTwoDesigns = [
  design("双街折廊楔角商住楼", "沿两条斜交街面的厚砖墙围成完整楔角楼体，底层店门和展示窗分别朝双街打开，上层角厅及两侧私室经折廊绕过真梯井，连续折返内梯连接四层，窄前端与宽后部共同收在完整髋坡瓦盖下", wedgeCornerResidence, "建筑", "中式"),
];

function wedgeCornerResidence(): ModelPart[] {
  const outline: [number, number][] = [[-1.5, -12], [1.5, -12], [10, 10], [-10, 10]], stairHole: [number, number][] = [[-1.4, -.95], [1.4, -.95], [1.4, 2.95], [-1.4, 2.95]], p: ModelPart[] = [hardFloor("双街楔角商住楼全部承墙共同落地的完整石基", stone, [[-1.85, -12.4], [1.85, -12.4], [10.45, 10.4], [-10.45, 10.4]], .2, [0, 0, 0])], walls: ModelPart[] = [], wood: ModelPart[] = [], roof: ModelPart[] = [];
  const sideLength = Math.hypot(8.5, 22), halfWidth = (z: number) => 1.5 + (z + 12) * 8.5 / 22;
  for (let level = 0; level < 4; level++) {
    const floor = .2 + level * 3;
    if (level > 0) p.push(hardFloor("每层完全符合双街楔形外廓且真实留出内梯井的木楼板", timber, outline, .2, [0, floor - .2, 0], [stairHole]));
    for (const side of [-1, 1]) {
      const yaw = Math.atan2(22, side * 8.5) * 180 / Math.PI, position: Triple = [side * 5.75, floor, -1], windows: [number, number, number, number][] = level === 0 ? [[0, .8, 4.2, 1.8], [6, .8, 2.8, 1.8]] : [[-8, .9, 1.8, 1.4], [-3, .9, 1.8, 1.4], [2, .9, 1.8, 1.4], [7, .9, 1.8, 1.4]];
      walls.push(periodWall("沿斜交街面完整承住楔形楼板并留实际店门窗的厚砖立面", brick, sideLength, 3, .28, position, level === 0 ? [[-5, 1.4, 2.4], [9, 1.1, 2.2]] : [], windows, yaw)); wood.push(...lattice(position, windows, yaw));
    }
    const noseWindows: [number, number, number, number][] = level === 0 ? [] : [[0, .8, 1.6, 1.45]], rearWindows: [number, number, number, number][] = level === 0 ? [[-6, 1, 2, 1.35], [6, 1, 2, 1.35]] : [[-7, 1, 1.6, 1.35], [-3.8, 1, 1.6, 1.35], [0, 1, 1.2, 1.35], [3.8, 1, 1.6, 1.35], [7, 1, 1.6, 1.35]];
    walls.push(periodWall("楔角窄端门厅与上层角厅完整而有实际门窗的正立面", brick, 3, 3, .28, [0, floor, -12], level === 0 ? [[0, 1.1, 2.3]] : [], noseWindows), periodWall("宽后立面实际封合两侧房体和共用后厅的砖墙", brick, 20, 3, .28, [0, floor, 10], level === 0 ? [[0, 1.1, 2.3]] : [], rearWindows)); wood.push(...lattice([0, floor, -12], noseWindows), ...lattice([0, floor, 10], rearWindows));
    walls.push(periodWall("西侧私室向折廊开出两处实际内门的完整长隔壁", plaster, 17, 3, .16, [-2.7, floor, 1.5], [[-6, .95, 2.15], [5, .95, 2.15]], [], 90), periodWall("东侧私室兼梯井侧界的完整长隔壁及前后实际房门", plaster, 17, 3, .16, [1.6, floor, 1.5], [[-6, .95, 2.15], [5, .95, 2.15]], [], 90), solidBox("主梯井西侧与公共绕行窄廊之间的完整实体隔墙", -1.6, floor + 1.5, 1, .16, 3, 4.3, plaster));
    for (const z of [-1.15, 3.15]) walls.push(periodWall(z < 0 ? "真实梯井前缘实际通到同层公共厅的完整门洞隔墙" : "梯井后缘与绕行公共廊分开的完整实隔墙", plaster, 3.2, 3, .16, [0, floor, z], z < 0 ? [[0, 1.1, 2.15]] : []));
    const half = halfWidth(3.8);
    walls.push(periodWall("西侧前后私室之间实际留门并闭合到斜外墙的完整隔壁", plaster, half - 2.7, 3, .14, [-(half + 2.7) / 2, floor, 3.8], [[1.3, .9, 2.15]]), periodWall("东侧前后私室之间实际留门并闭合到斜外墙的完整隔壁", plaster, half - 1.6, 3, .14, [(half + 1.6) / 2, floor, 3.8], [[-1.5, .9, 2.15]]));
    if (level === 0) wood.push(solidBox("西街铺窗内避开入门路线的完整落地柜台", -4.35, .72, .4, 1.2, 1.04, 2.4, timber), solidBox("东街铺窗内避开入门路线的完整落地柜台", 4.35, .72, .4, 1.2, 1.04, 2.4, timber));
    else {
      wood.push(solidBox("西后私室真正落在楔形楼板内的完整低木卧台", -5.6, floor + .22, 6, 1.6, .44, 2.2, timber), solidBox("东后私室真正落在楔形楼板内的完整低木卧台", 5.8, floor + .22, 6, 1.6, .44, 2.2, timber), solidBox("窄端角厅避开主门路线的完整低木坐台", -.6, floor + .22, -9.5, .7, .44, 1.8, timber));
    }
    if (level === 3) continue;
    for (let i = 0; i < 9; i++) {
      wood.push(solidBox("折返内梯第一跑逐级上升的独立厚木踏板", -.7, floor + (i + 1) / 6 - .06, -.65 + i * .3, 1.1, .12, .3, timber), solidBox("折返内梯第二跑反向接到上一层的独立厚木踏板", .7, floor + 1.5 + (i + 1) / 6 - .06, 1.75 - i * .3, 1.1, .12, .3, timber));
    }
    wood.push(solidBox("折返内梯两跑之间完整接续且真正承重的中间平台", 0, floor + 1.41, 2.4, 2.6, .18, 1, timber), solidBox("折返内梯末级跨出真实楼板洞并接到门厅的上落脚台", 0, floor + 2.91, -1.02, 2.6, .18, .6, timber));
    wood.push(meshBeam("折返主梯半层平台下真正嵌入两侧井壁的横承木", [-1.6, floor + 1.3, 2.6], [1.6, floor + 1.3, 2.6], .2, timber), meshBeam("折返主梯半层平台后缘真正连通两侧竖柱的木护栏", [-1.28, floor + 2.35, 2.85], [1.28, floor + 2.35, 2.85], .055, timber));
    for (const x of [-1.28, 1.28]) {
      wood.push(meshBeam("折返梯半层平台侧边保护墙前窄隙的连续木扶栏", [x, floor + 2.35, 1.95], [x, floor + 2.35, 2.85], .055, timber));
      for (const z of [1.95, 2.85]) wood.push(meshBeam("半层平台后侧护栏真正落到木平台面的独立立柱", [x, floor + 1.5, z], [x, floor + 2.35, z], .055, timber));
    }
    for (const x of [-1.2, -.2]) wood.push(meshBeam("第一跑独立木踏板下实际连续承托的斜木梯梁", [x, floor + .05, -.8], [x, floor + 1.42, 1.9], .13, timber));
    for (const x of [.2, 1.2]) wood.push(meshBeam("第二跑独立木踏板下反向接续的实际斜木梯梁", [x, floor + 1.55, 1.9], [x, floor + 2.92, -.8], .13, timber));
    wood.push(meshBeam("折返内梯低跑中侧实际连续的完整木扶手", [-.15, floor + 1.02, -.65], [-.15, floor + 2.35, 1.75], .055, timber), meshBeam("折返内梯高跑中侧实际连续的完整木扶手", [.15, floor + 2.52, 1.75], [.15, floor + 3.85, -.65], .055, timber));
    for (const [x, y, z] of [[-.15, 1 / 6, -.65], [-.15, 1.5, 1.75], [.15, 5 / 3, 1.75], [.15, 3, -.65]]) wood.push(meshBeam("斜扶手实际连到相应踏板边缘的独立竖木柱", [x!, floor + y!, z!], [x!, floor + y! + .85, z!], .055, timber));
  }
  const bottom: Triple[] = [[-1.5, 12.36, -12], [1.5, 12.36, -12], [10, 12.36, 10], [-10, 12.36, 10]], front: Triple = [0, 14.2, -7], rear: Triple = [0, 14.2, 7];
  roof.push(slopePanel("楔角窄前端两侧真实收向短前脊的厚瓦髋坡", [bottom[0]!, bottom[1]!, front], .16, tile), slopePanel("楔楼宽后端完整收向短后脊的厚瓦髋坡", [bottom[2]!, bottom[3]!, rear], .16, tile), slopePanel("东斜街面上方真实三角厚瓦坡前片", [bottom[1]!, bottom[2]!, rear], .16, tile), slopePanel("东斜街面上方真实三角厚瓦坡后片", [bottom[1]!, rear, front], .16, tile), slopePanel("西斜街面上方真实三角厚瓦坡前片", [bottom[3]!, bottom[0]!, front], .16, tile), slopePanel("西斜街面上方真实三角厚瓦坡后片", [bottom[3]!, front, rear], .16, tile));
  p.push(hardFloor("完整楔形屋面外缘真实挑出的砖石檐压顶环", stone, [[-1.8, -12.3], [1.8, -12.3], [10.3, 10.3], [-10.3, 10.3]], .16, [0, 12.2, 0], [outline]));
  for (const z of [-6, 6]) { const half = halfWidth(z); wood.push(meshBeam("顶层两侧厚砖墙之间实际托住屋脊柱的整根横承梁", [-half, 12.16, z], [half, 12.16, z], .28, timber), meshBeam("横承梁上实际接到高长屋脊的短木柱", [0, 12.3, z], [0, 14.04, z], .18, timber)); }
  wood.push(meshBeam("楔形完整髋坡瓦盖下的真正连续高屋脊木", [0, 14.04, -7], [0, 14.04, 7], .2, timber));
  p.push(...packMeshes("楔形商住楼所有完整实砖围壁及可穿行分室隔墙", brick, walls), ...packMeshes("全部窗格独立木楼梯卧台与屋盖承枋完整保留", timber, wood), ...packMeshes("随楔角整栋外廓完整收合的真实厚瓦髋坡", tile, roof));
  return p;
}
