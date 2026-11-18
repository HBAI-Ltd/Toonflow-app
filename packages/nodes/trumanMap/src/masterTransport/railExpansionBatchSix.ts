import { Euler, Quaternion, Vector3 } from "three";
import { part, ring, type ModelPart, type Triple } from "../assetModelParts";
import { polygon } from "../masterNature/shared";
import { rod } from "../masterObjects/parts";
import { box, cylinder, strut, transportColors, type TransportDefinition } from "./parts";

function restrainedSeat(position: Triple, yaw = 0): ModelPart[] {
  const parts = [box("独立乘客成形座垫", [0, .04, 0], [.48, .13, .46], transportColors.signal), box("独立乘客倾斜靠背", [0, .62, .23], [.47, 1.05, .13], transportColors.dark, [-10, 0, 0]), part("连接座垫前缘且保留身体净空的U形约束架", "extrude", transportColors.trim, [0, .02, -.23], [1, 1, 1], [0, 0, 0], { depth: .055, profile: [{ x: -.22, y: .08 }, { x: -.22, y: .78 }, { x: -.17, y: .89 }, { x: .17, y: .89 }, { x: .22, y: .78 }, { x: .22, y: .08 }, { x: .15, y: .08 }, { x: .15, y: .77 }, { x: .12, y: .82 }, { x: -.12, y: .82 }, { x: -.15, y: .77 }, { x: -.15, y: .08 }] })];
  const turn = new Quaternion().setFromAxisAngle(new Vector3(0, 1, 0), yaw * Math.PI / 180);
  for (const value of parts) {
    const p = new Vector3(value.position.x, value.position.y, value.position.z).applyQuaternion(turn);
    value.position = { x: p.x + position[0], y: p.y + position[1], z: p.z + position[2] };
    const r = new Euler().setFromQuaternion(turn.clone().multiply(new Quaternion().setFromEuler(new Euler(value.rotation.x * Math.PI / 180, value.rotation.y * Math.PI / 180, value.rotation.z * Math.PI / 180))));
    value.rotation = { x: r.x * 180 / Math.PI, y: r.y * 180 / Math.PI, z: r.z * 180 / Math.PI };
  }
  return parts;
}

// 仅独立移动载具与座舱，不含固定塔架或轨道，不宣称具备机械游乐模拟。
// https://www.bolliger-mabillard.com/inverted-coaster
// https://www.mack-rides.com/products/xtreme-spinning-coaster
// https://www.wiegandslide.com/produkte/alpine-coaster.html
// https://www.doppelmayr.com/en/systems/material-ropeways/
// https://www.intamin.com/wp-content/uploads/2019/09/IAR-2020-Flyer-VerticalRides-gyro-drop.pdf
export const railExpansionBatchSix: TransportDefinition[] = [
  { name: "倒挂式悬吊过山车车组", theme: "现代", tags: ["上轨下乘", "悬吊座椅", "承重侧向及防脱轮组"], create: () => {
    const parts: ModelPart[] = [box("轨道下方通长悬吊承力脊梁", [0, 2.23, 0], [.26, .25, 6.35], transportColors.dark)];
    for (const z of [-2.1, 0, 2.1]) {
      parts.push(box("每排独立的悬吊轮组中央横框", [0, 2.48, z], [.64, .18, .72], transportColors.body), box("轮架中柱与通长悬吊梁的承力连接", [0, 2.6, z], [.23, .5, .3], transportColors.dark), box("双座背后横向承重梁", [0, 1.28, z + .24], [1.46, .17, .2], transportColors.dark), rod("连接两侧承重轮及轴箱的完整横轴", [-.9, 3.05, z], [.9, 3.05, z], .07, transportColors.trim), rod("连接防脱轮轴箱与中央轮架的完整横轴", [-.9, 2.63, z], [.9, 2.63, z], .07, transportColors.trim));
      for (const side of [-1, 1]) parts.push(...restrainedSeat([side * .38, .65, z]), strut("上悬梁到座背的竖向吊接", [side * .38, 2.25, z + .24], [side * .38, 1.3, z + .24], .085), cylinder("轨道上方承重聚氨酯轮", [side * .48, 3.05, z], [.36, .14, .36], transportColors.dark, [0, 0, 90]), cylinder("轨道下方独立防脱轮", [side * .48, 2.63, z], [.28, .13, .28], transportColors.dark, [0, 0, 90]), cylinder("轨道外侧水平导向轮", [side * .66, 2.82, z], [.26, .13, .26], transportColors.dark), box("三向轮组共同侧承板", [side * .9, 2.78, z], [.075, .72, .54], transportColors.body), rod("侧向导向轮至下横轴的竖向轮轴", [side * .66, 2.6, z], [side * .66, 2.82, z], .055, transportColors.trim));
    }
    return parts;
  } },
  { name: "中央转盘式旋转过山车车厢", theme: "现代", tags: ["客舱独立竖轴转盘", "轨道三向夹持轮", "背向外周乘坐"], create: () => {
    const parts: ModelPart[] = [box("保持沿轨方向且位于两轨之间的独立走行底架", [0, .52, 0], [.7, .4, 2.5], transportColors.dark), ring("独立于走行底架的回转支承圈", transportColors.dark, .57, .14, .73, .22), cylinder("回转圈内连接客舱底板的竖直主轴", [0, .89, 0], [.35, .42, .35], transportColors.body), cylinder("整体旋转客舱圆底板", [0, .98, 0], [2.7, .16, 2.7], transportColors.body), ring("圆形客舱的薄壁低围边", transportColors.signal, 1.36, .07, 1.23, .45)];
    for (const z of [-.9, .9]) {
      parts.push(box("位于两轨之间的前后轮架横梁", [0, .11, z], [.72, .18, .4], transportColors.dark), strut("轮架横梁连接中央走行底架的短柱", [0, .2, z], [0, .42, z], .12), rod("左右承重轮的完整横向轮轴", [-.7, .49, z], [.7, .49, z], .055, transportColors.trim), rod("左右防脱轮的完整横向轮轴", [-.7, .11, z], [.7, .11, z], .055, transportColors.trim));
      for (const side of [-1, 1]) parts.push(cylinder("轨道上表面承重轮", [side * .48, .49, z], [.34, .14, .34], transportColors.dark, [0, 0, 90]), cylinder("轨道下表面防抬起轮", [side * .48, .11, z], [.18, .13, .18], transportColors.dark, [0, 0, 90]), cylinder("轨道外侧的水平导向轮", [side * .64, .26, z], [.2, .12, .2], transportColors.dark), rod("侧向导向轮至下横轴的独立轮轴", [side * .64, .11, z], [side * .64, .3, z], .05, transportColors.trim));
    }
    for (let index = 0; index < 4; index++) {
      const angle = index * Math.PI / 2;
      parts.push(...restrainedSeat([Math.cos(angle) * .83, 1.09, Math.sin(angle) * .83], -index * 90 - 90));
    }
    return parts;
  } },
  { name: "双管轨夹持式山地重力滑车", theme: "现代", tags: ["山地滑车", "低位连坐座舱", "手动双杆制动", "包络导向轮组"], create: () => {
    const parts: ModelPart[] = [polygon("前尖后圆的完整滑车承载托板", transportColors.body, [[-.38, 1], [.38, 1], [.44, -.55], [.28, -1.2], [0, -1.4], [-.28, -1.2], [-.44, -.55]], .1, [0, .37, 0]), part("前后贯通且保留乘坐空腔的低位外壳", "extrude", transportColors.signal, [0, .47, -.05], [1, 1, 1], [0, 0, 0], { depth: 2.1, profile: [{ x: -.35, y: 0 }, { x: .35, y: 0 }, { x: .44, y: .3 }, { x: .36, y: .3 }, { x: .29, y: .08 }, { x: -.29, y: .08 }, { x: -.36, y: .3 }, { x: -.44, y: .3 }] }), box("前后连坐的长形软座垫", [0, .69, .25], [.55, .13, 1.13], transportColors.dark), box("后方独立支撑靠背", [0, 1.07, .76], [.55, .72, .12], transportColors.dark, [-10, 0, 0]), box("滑车前方双脚承托板", [0, .58, -.88], [.56, .07, .43], transportColors.dark), strut("双杆手制动共用横向联轴", [-.44, .54, -.15], [.44, .54, -.15], .045, transportColors.dark), strut("座垫前部连接两侧舱沿的约束腰带", [-.4, .77, -.12], [.4, .77, -.12], .045, transportColors.trim)];
    for (const side of [-1, 1]) {
      parts.push(strut("驾驶员两侧直接操作的制动杆", [side * .44, .54, -.15], [side * .44, .97, -.05], .035, transportColors.dark), cylinder("制动杆顶端握把", [side * .44, 1.01, -.05], [.075, .13, .075], transportColors.dark));
      for (const z of [-.72, .65]) parts.push(box("高于轮胎并连接车底的轮架上承板", [side * .4, .375, z], [.3, .07, .3], transportColors.body), cylinder("双管轨上侧承重小滚轮", [side * .3, .23, z], [.2, .09, .2], transportColors.dark, [0, 0, 90]), cylinder("双管轨下侧防脱小滚轮", [side * .3, .03, z], [.1, .08, .1], transportColors.dark, [0, 0, 90]), cylinder("管轨外侧水平导向小滚轮", [side * .385, .105, z], [.12, .05, .12], transportColors.dark), rod("上承重轮到外侧固定板的横轴", [side * .3, .23, z], [side * .5, .23, z], .035, transportColors.trim), rod("下防脱轮到外侧固定板的横轴", [side * .3, .03, z], [side * .5, .03, z], .03, transportColors.trim), strut("避开三向滚轮的外侧轮架固定板", [side * .5, .03, z], [side * .5, .36, z], .045, transportColors.body), rod("水平导向滚轮至下轴的短轮轴", [side * .385, .03, z], [side * .385, .15, z], .025, transportColors.trim));
    }
    return parts;
  } },
  { name: "开放桁架平台式货运索道吊篮", theme: "现代", tags: ["货运索道", "长形开放吊运平台", "承重索滑轮组", "牵引索夹持头"], create: () => {
    const parts: ModelPart[] = [box("货运索道篮完整长平台", [0, .19, 0], [2.3, .16, 6.2], transportColors.wood), box("货运篮上方长向桁架承梁", [0, 3.2, 0], [.18, .2, 5.4], transportColors.dark), strut("平台桁架到顶部滑轮组及牵引夹的中央吊杆", [0, 3.25, 0], [0, 4.82, 0], .17, transportColors.body), box("承重索滑轮组共同承架", [0, 4.43, 0], [.85, .16, 2.15], transportColors.dark), box("中央牵引索的夹持座", [0, 4.84, 0], [.22, .12, .55], transportColors.body)];
    for (const side of [-1, 1]) {
      parts.push(box("吊运平台底部连续承重纵梁", [side * .94, .09, 0], [.16, .18, 6.2], transportColors.dark), strut("货篮长侧护栏上梁", [side * 1.08, 1.03, -2.95], [side * 1.08, 1.03, 2.95], .05));
      for (const z of [-2.95, 0, 2.95]) parts.push(strut("货篮侧栏固定立柱", [side * 1.08, .27, z], [side * 1.08, 1.03, z], .05));
      for (const end of [-1, 1]) parts.push(strut("货篮角部到上方承梁的三角吊架", [side * 1.03, .27, end * 2.65], [0, 3.2, end * 2.65], .1, transportColors.dark));
      for (const z of [-.65, .65]) parts.push(part("带中部绳槽的承重索滑轮", "lathe", transportColors.dark, [side * .25, 4.65, z], [1, 1, 1], [0, 0, 90], { profile: [{ x: .07, y: -.1 }, { x: .23, y: -.1 }, { x: .23, y: -.055 }, { x: .19, y: -.035 }, { x: .19, y: .035 }, { x: .23, y: .055 }, { x: .23, y: .1 }, { x: .07, y: .1 }, { x: .07, y: -.1 }] }), cylinder("穿过滑轮轴孔的真正水平轮轴", [side * .25, 4.65, z], [.14, .45, .14], transportColors.trim, [0, 0, 90]), strut("轴端外侧与承架之间的竖直固定板", [side * .43, 4.65, z], [side * .43, 4.43, z], .07, transportColors.trim));
    }
    for (const end of [-1, 1]) parts.push(strut("货篮端部横向护栏上梁", [-1.08, 1.03, end * 2.95], [1.08, 1.03, end * 2.95], .05));
    return parts;
  } },
  { name: "自由落体塔环形移动乘客座舱", theme: "现代", itemType: "设施", tags: ["独立移动座舱", "真实中空塔孔", "上下两层导向轮", "外向约束座椅"], create: () => {
    const parts: ModelPart[] = [ring("留出塔体穿越孔的环形座舱承盘", transportColors.body, 2.4, 1.22, .37, .18), ring("座椅背后连续承重靠环", transportColors.dark, 1.79, .1, .96, .14), ring("座舱内缘上方导向环梁", transportColors.dark, 1.44, .16, 2.24, .15)];
    for (let index = 0; index < 8; index++) {
      const angle = index * Math.PI / 4;
      parts.push(...restrainedSeat([Math.cos(angle) * 2.05, .52, Math.sin(angle) * 2.05], -index * 45 - 90), strut("外圈座椅基座到内导向框的径向承梁", [Math.cos(angle) * 1.23, .37, Math.sin(angle) * 1.23], [Math.cos(angle) * 2.25, .37, Math.sin(angle) * 2.25], .12, transportColors.dark));
    }
    for (let index = 0; index < 4; index++) {
      const angle = index * Math.PI / 2, x = Math.cos(angle), z = Math.sin(angle), tx = -z, tz = x;
      parts.push(strut("环形座舱内缘上下贯通导向立架", [x * 1.45, .44, z * 1.45], [x * 1.45, 2.24, z * 1.45], .13, transportColors.body));
      for (const y of [.67, 2]) parts.push(rod("垂直塔轨侧面独立导向滚轮", [x * 1.31 - tx * .08, y, z * 1.31 - tz * .08], [x * 1.31 + tx * .08, y, z * 1.31 + tz * .08], .28, transportColors.dark), strut("导向轮到内缘立架的承力短座", [x * 1.45, y, z * 1.45], [x * 1.31, y, z * 1.31], .075));
    }
    return parts;
  } },
];
