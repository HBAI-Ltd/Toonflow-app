import { Euler, Quaternion, Vector3 } from "three";
import { ring, type ModelPart, type Triple } from "../assetModelParts";
import { rod } from "../masterObjects/parts";
import { box, cylinder, strut, surface, transportColors, type TransportDefinition } from "./parts";

// 类别依据为设备制造商公开资料；全部几何为原创场景道具，不复刻厂商图纸或制造规格。
// https://www.elematic.com/product/comcaster-e9/
// https://comevasrl.com/en/tbm-equipment/
// https://www.alertnz.com/container-tilter
export const railExpansionBatchNine: TransportDefinition[] = [
  { name: "门架轨行式预制混凝土布料机", theme: "现代", tags: ["预制构件生产", "跨幅移动门架", "横移布料斗", "开放料仓与贯通下料口"], create: () => {
    const parts: ModelPart[] = [];
    for (const side of [-1, 1]) {
      parts.push(box("门架底部长向走行箱梁", [side * 3.9, .79, 0], [.42, .3, 4.7], transportColors.dark));
      for (const z of [-1.8, 1.8]) parts.push(cylinder("门架轨道行走钢轮", [side * 3.9, .34, z], [.68, .2, .68], transportColors.body, [0, 0, 90]), cylinder("行走钢轮内侧轮缘", [side * 3.77, .34, z], [.73, .045, .73], transportColors.dark, [0, 0, 90]), cylinder("不横穿中央通道的钢轮短轴", [side * 3.9, .34, z], [.12, .72, .12], transportColors.trim, [0, 0, 90]), box("位于轮盘外侧的轴承挂架", [side * 4.16, .56, z], [.16, .59, .28], transportColors.dark));
      for (const z of [-1.3, 1.3]) parts.push(box("跨幅门架立柱", [side * 3.9, 2.77, z], [.3, 3.8, .3], transportColors.signal), strut("门架外侧防侧摆斜撑", [side * 3.9, 1.1, z], [side * 3.9, 4.7, -z], .12, transportColors.dark));
    }
    for (const end of [-1, 1]) parts.push(box("跨越预制台面上方的门架主梁", [0, 4.8, end * 1.3], [8.2, .4, .35], transportColors.signal), box("料斗小车沿横向运行的桥上钢轨", [0, 5.1, end * 1.22], [8.15, .2, .12], transportColors.dark));
    for (const x of [-.3, 1.1]) {
      for (const end of [-1, 1]) parts.push(cylinder("布料小车横向行走轮", [x, 5.35, end * 1.22], [.3, .12, .3], transportColors.body, [90, 0, 0]), cylinder("料斗外侧不穿过料仓的独立短轮轴", [x, 5.35, end * 1.22], [.09, .55, .09], transportColors.trim, [90, 0, 0]), box("横移钢轮内侧接入小车框架的轴承挂板", [x, 5.44, end], [.18, .3, .1], transportColors.dark));
    }
    for (const end of [-1, 1]) parts.push(box("小车端部避开料斗开口的承梁", [.4, 5.59, end * 1.17], [2.8, .2, .4], transportColors.dark));
    for (const side of [-1, 1]) parts.push(box("悬承料斗两侧的长向边框", [.4 + side * 1.26, 5.59, 0], [.2, .2, 2.54], transportColors.dark), strut("料斗上缘接入小车边框的短承臂", [.4 + side * 1.26, 5.65, 0], [.4 + side * 1.03, 5.78, 0], .16, transportColors.dark));
    const center = .4;
    for (const side of [-1, 1]) parts.push(surface("从上开口向下料喉收分的料斗侧壁", transportColors.body, [[center + side * 1.05, 5.85, -.95], [center + side * 1.05, 5.85, .95], [center + side * .4, 3.65, .35], [center + side * .4, 3.65, -.35]], [0, 1, 2, 0, 2, 3]), box("料仓上口两侧翻边", [center + side * 1.05, 5.85, 0], [.09, .09, 1.97], transportColors.trim));
    for (const end of [-1, 1]) parts.push(surface("料斗端部保留上下真实开口的斜壁", transportColors.body, [[center - 1.05, 5.85, end * .95], [center + 1.05, 5.85, end * .95], [center + .4, 3.65, end * .35], [center - .4, 3.65, end * .35]], [0, 1, 2, 0, 2, 3]), box("料仓上口前后翻边", [center, 5.85, end * .95], [2.18, .09, .09], transportColors.trim), box("下料喉前后直立薄壁", [center, 3.42, end * .35], [.8, .46, .055], transportColors.body));
    for (const side of [-1, 1]) parts.push(box("下料喉两侧直立薄壁", [center + side * .4, 3.42, 0], [.055, .46, .7], transportColors.body), box("水平闸板外侧的导槽", [center + .4, 3.18, side * .43], [1.7, .12, .13], transportColors.dark));
    parts.push(box("向侧方抽开的下料闸板", [1.29, 3.18, 0], [.94, .07, .8], transportColors.trim), box("与闸板同轴的驱动机座", [1.77, 3.39, .58], [.45, .45, .45], transportColors.signal), rod("机座与抽拉闸板的实际连接杆", [1.55, 3.2, .32], [1.77, 3.39, .58], .07, transportColors.dark), box("门架一侧的维护走台", [0, 4.7, 1.93], [8.2, .16, .78], transportColors.dark));
    for (const x of [-3.9, 0, 3.9]) parts.push(box("维护走台外缘护栏立柱", [x, 5.26, 2.27], [.06, 1.05, .06], transportColors.dark), strut("走台底部接入门架的横托", [x, 4.62, 1.3], [x, 4.62, 2.22], .12));
    parts.push(box("维护走台上部连续扶手", [0, 5.8, 2.27], [8.2, .06, .06], transportColors.trim), box("维护走台中部连续护杆", [0, 5.27, 2.27], [8.2, .05, .05], transportColors.dark), box("门架操作控制箱", [-3.86, 1.24, 2.08], [.5, .72, .24], transportColors.body), box("操作控制箱前面板", [-3.86, 1.28, 2.22], [.4, .4, .035], transportColors.dark));
    return parts;
  } },
  { name: "盾构后配套贯通龙门台车", theme: "现代", tags: ["盾构后配套", "独立移动龙门架", "中央物流通道", "上层输送带及通风筒"], create: () => {
    const parts: ModelPart[] = [];
    for (const side of [-1, 1]) {
      parts.push(box("后配套两侧轨行底部纵梁", [side * 2.3, 1.02, 0], [.4, .4, 11.4], transportColors.dark), box("不封堵中央通道的侧设备甲板", [side * 2.08, 1.3, 0], [1.02, .18, 11.1], transportColors.body));
      for (const z of [-4.4, 4.4]) parts.push(cylinder("龙门台车宽踏面钢轮", [side * 2.3, .44, z], [.82, .25, .82], transportColors.body, [0, 0, 90]), cylinder("钢轮内侧限位轮缘", [side * 2.14, .44, z], [.88, .055, .88], transportColors.dark, [0, 0, 90]), cylinder("避开物流通道的独立短轮轴", [side * 2.3, .44, z], [.14, .95, .14], transportColors.trim, [0, 0, 90]), box("钢轮外侧轴承与底梁连接架", [side * 2.64, .72, z], [.18, .8, .35], transportColors.dark));
      for (const z of [-4.6, 0, 4.6]) parts.push(box("从侧纵梁升至顶横梁的龙门立柱", [side * 2.3, 3.12, z], [.23, 4.2, .25], transportColors.signal));
      for (const end of [-1, 1]) parts.push(strut("仅位于侧面的龙门纵向斜撑", [side * 2.3, 1.5, end * 4.6], [side * 2.3, 5.15, end * 2.3], .13, transportColors.dark));
    }
    for (const z of [-4.6, 0, 4.6]) {
      parts.push(box("保持中央全宽通行的高位横门梁", [0, 5.3, z], [4.95, .35, .32], transportColors.signal));
      for (const x of [-1.65, .05]) parts.push(box("上层输送机接入横门梁的短支座", [x, 5.52, z], [.13, .16, .25], transportColors.dark));
      parts.push(strut("顶部通风筒两侧固定鞍托", [.75, 5.42, z], [1.3, 5.76, z], .09), strut("顶部通风筒另一侧固定鞍托", [1.86, 5.42, z], [1.3, 5.76, z], .09));
    }
    for (const side of [-1, 1]) parts.push(box("上层输送机两侧连续纵向托框", [-.8 + side * .85, 5.62, 0], [.13, .14, 12.5], transportColors.dark));
    for (const z of [-6.1, 6.1]) parts.push(cylinder("连续输送带两端回转滚筒", [-.8, 5.675, z], [.37, 1.52, .37], transportColors.trim, [0, 0, 90]), cylinder("回转滚筒外伸承重轴", [-.8, 5.675, z], [.08, 1.9, .08], transportColors.dark, [0, 0, 90]));
    parts.push(box("上层连续输送带的承料带面", [-.8, 5.86, 0], [1.48, .025, 12.2], transportColors.dark), box("同一输送带下部回程带面", [-.8, 5.49, 0], [1.48, .025, 12.2], transportColors.dark), ring("沿后配套顶部贯通的真实空心通风筒", transportColors.body, .51, .035, 0, 12.1, { position: { x: 1.3, y: 6.24, z: 0 }, rotation: { x: 90, y: 0, z: 0 } }));
    parts.push(box("左侧独立配电变压设备底座", [-2.08, 1.53, 1.2], [.87, .29, 3.35], transportColors.dark), box("变压设备油箱与绕组外壳", [-2.08, 2.24, 1.2], [.72, 1.2, 2.85], transportColors.body));
    for (const z of [.1, .83, 1.56, 2.29]) parts.push(box("朝向检修通道的变压器散热片", [-1.65, 2.24, z], [.2, 1.1, .08], transportColors.dark));
    parts.push(box("右侧液压油箱", [2.08, 1.93, -1.5], [.86, 1.08, 2.8], transportColors.body), cylinder("液压油箱上方泵组电机", [2.08, 2.7, -1.5], [.43, 1.25, .43], transportColors.dark, [90, 0, 0]), box("液压泵电机承托鞍座", [2.08, 2.49, -1.5], [.5, .15, .82], transportColors.dark), box("右侧封闭电控柜", [2.08, 2.23, 3.8], [.8, 1.7, 1.5], transportColors.body), box("电控柜面向走道的控制面板", [1.66, 2.43, 3.8], [.025, .6, 1.15], transportColors.dark), box("左侧不占中央净空的长电缆托槽", [-2.04, 3.8, 0], [.73, .16, 10.6], transportColors.dark));
    for (const z of [-4.6, 0, 4.6]) parts.push(strut("电缆槽从侧立柱悬出的承托", [-2.3, 3.72, z], [-1.71, 3.72, z], .1));
    for (const side of [-1, 1]) for (const end of [-1, 1]) parts.push(strut("在侧纵梁端部而不横挡中央通道的牵引杆", [side * 2.3, 1.02, end * 5.6], [side * 2.3, 1.02, end * 6.15], .15), ring("后配套侧置牵引联结环", transportColors.trim, .16, .055, 1.02, .12, { position: { x: side * 2.3, y: 1.02, z: end * 6.28 } }));
    return parts;
  } },
  { name: "可搬运集装箱液压倾装架", theme: "现代", tags: ["散料装箱", "空载倾装架", "可搬运一体底架", "真实铰接承托和角锁座"], create: () => {
    const parts: ModelPart[] = [];
    for (const side of [-1, 1]) parts.push(box("可搬运倾装架底部连续滑橇", [side * 1.3, .1, 0], [.27, .2, 7.1], transportColors.dark), box("由叉套托起的上层承重纵梁", [side * 1.3, .62, 0], [.3, .3, 7.1], transportColors.body));
    for (const z of [-1.6, 1.6]) {
      parts.push(box("可穿入货叉的横向叉套底板", [0, .19, z], [3.05, .08, .52], transportColors.dark), box("与上纵梁实际相接的叉套顶板", [0, .47, z], [3.05, .08, .52], transportColors.dark));
      for (const end of [-1, 1]) parts.push(box("货叉通道两侧实壁且端面不封口", [0, .33, z + end * .22], [3.05, .22, .08], transportColors.dark));
    }
    for (const z of [-3.3, 0, 3.3]) parts.push(box("底座连接两条滑橇的横向承梁", [0, .62, z], [2.9, .3, .3], transportColors.dark));
    const pivot: Triple = [0, 1.1, 2.85], angle = 35;
    parts.push(cylinder("贯穿倾转托架的水平铰轴", pivot, [.28, 3.25, .28], transportColors.trim, [0, 0, 90]));
    for (const side of [-1, 1]) parts.push(box("倾转轴两外侧承托立座", [side * 1.46, .79, 2.85], [.32, .24, .7], transportColors.dark), ring("倾转轴外侧真实穿孔轴承", transportColors.body, .25, .09, 0, .25, { position: { x: side * 1.46, y: 1.1, z: 2.85 }, rotation: { x: 0, y: 0, z: 90 } }));
    const tray: ModelPart[] = [];
    for (const side of [-1, 1]) {
      tray.push(box("倾转托架两条集装箱角件承梁", [side * 1.1, .02, -3.05], [.27, .3, 6.35], transportColors.signal));
      for (const z of [-.15, -5.95]) tray.push(box("对应箱体底角件的独立承托锁座", [side * 1.1, .25, z], [.45, .18, .45], transportColors.body), cylinder("穿入角件孔的扭锁竖轴", [side * 1.1, .4, z], [.1, .18, .1], transportColors.dark), box("扭锁上部非圆截面的锁舌", [side * 1.1, .49, z], [.22, .08, .1], transportColors.trim));
      tray.push(box("倾装架后端防纵向滑移承挡", [side * 1.1, .6, .17], [.5, .95, .22], transportColors.dark));
    }
    for (const z of [0, -3, -6.1]) tray.push(box("倾转托架贯通的横向连梁", [0, .02, z], [2.65, .3, .24], transportColors.signal));
    const rotation = new Quaternion().setFromEuler(new Euler(angle * Math.PI / 180, 0, 0));
    for (const value of tray) {
      const position = new Vector3(value.position.x, value.position.y, value.position.z).applyQuaternion(rotation).add(new Vector3(...pivot));
      const orientation = new Euler().setFromQuaternion(rotation.clone().multiply(new Quaternion().setFromEuler(new Euler(value.rotation.x * Math.PI / 180, value.rotation.y * Math.PI / 180, value.rotation.z * Math.PI / 180))));
      value.position = { x: position.x, y: position.y, z: position.z };
      value.rotation = { x: orientation.x * 180 / Math.PI, y: orientation.y * 180 / Math.PI, z: orientation.z * 180 / Math.PI };
      parts.push(value);
    }
    for (const side of [-1, 1]) {
      const start: Triple = [side * 1.1, .87, -1.95];
      const endVector = new Vector3(side * 1.1, -.09, -3.8).applyQuaternion(rotation).add(new Vector3(...pivot));
      const end: Triple = [endVector.x, endVector.y, endVector.z];
      const joint = new Vector3(...start).lerp(endVector, .65), middle: Triple = [joint.x, joint.y, joint.z];
      parts.push(box("液压缸下铰耳与底纵梁的承座", [side * 1.1, .81, -1.95], [.46, .3, .5], transportColors.dark), rod("倾装架长行程液压缸外筒", start, middle, .2, transportColors.body), rod("从外筒伸至托架下方的实际活塞杆", middle, end, .105, transportColors.trim), cylinder("活塞杆顶端横向铰销", end, [.13, .46, .13], transportColors.dark, [0, 0, 90]));
    }
    parts.push(box("底架前端避开倾转铰轴的独立液压动力箱", [0, 1.03, -2.95], [1.32, .52, .65], transportColors.body), box("液压动力箱上的操作面板", [0, 1.32, -2.95], [.82, .06, .4], transportColors.dark));
    return parts;
  } },
];
