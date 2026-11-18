import { part, type ModelPart } from "../assetModelParts";
import { polygon } from "../masterNature/shared";
import { rod } from "../masterObjects/parts";
import { box, cylinder, strut, transportColors, type TransportDefinition } from "./parts";

function uprightPlate(name: string, outline: [number, number][], x: number, thickness: number, color = transportColors.body): ModelPart {
  const value = polygon(name, color, outline, thickness, [x + thickness / 2, 0, 0]);
  value.rotation.z = 90;
  return value;
}

// 原创静态压气后抛摇铲整机；不含后挂矿车，不注册轮式、履带式或容量变化版本。
// 轨行、链拉摇臂与防分离索的构造依据来自 ASME，而非把普通铲运车换成轨道轮。
// https://www.asme.org/about-asme/engineering-history/landmarks/212-eimco-rocker-shovel-loader-model-12b
// https://tridentsa.co.za/rockershovels/12b-rockershovel/
export const railExpansionBatchTwenty: TransportDefinition[] = [
  { name: "压气链拉弧摇臂后抛式轨行装岩机", theme: "现代", tags: ["矿山后抛装岩机", "曲面滚摇臂", "完整双气动传动链", "独立窄轨施工载具", "前铲后卸"], create: () => {
    const parts: ModelPart[] = [box("承接走行轴和上部回转座的铸钢底台", [0, .5, .1], [1.25, .3, 1.92], transportColors.dark), cylinder("承接横向清底回转动作的上车回转底座", [0, .72, .1], [1.12, .18, 1.12], transportColors.body), box("摇臂滚道与双动力机构的完整上车底架", [0, .84, .15], [1.28, .15, 1.68], transportColors.dark)];
    for (const z of [-.6, .75]) {
      parts.push(cylinder("两侧窄轨承重轮之间的实际贯通轮轴", [0, .27, z], [.11, 1.55, .11], transportColors.trim, [0, 0, 90]));
      for (const side of [-1, 1]) parts.push(cylinder("窄轨装岩机的独立钢质踏面轮", [side * .59, .27, z], [.5, .18, .5], transportColors.body, [0, 0, 90]), cylinder("朝向两轨内侧的承重轮轮缘", [side * .49, .27, z], [.54, .035, .54], transportColors.dark, [0, 0, 90]), box("外侧承轴箱与上方底台实际相接的吊座", [side * .75, .37, z], [.14, .28, .28], transportColors.dark));
    }
    parts.push(cylinder("接入后轮轴上方减速箱的走行压气马达", [0, .77, .73], [.32, .55, .32], transportColors.body, [0, 0, 90]), box("走行气马达向轮轴传力的密闭齿轮箱", [0, .49, .73], [.62, .35, .32], transportColors.dark), cylinder("独立于走行传动的摇铲气马达", [0, 1.11, .66], [.4, .62, .4], transportColors.body, [0, 0, 90]), cylinder("由摇铲马达实际贯穿两侧链轮的横向驱动轴", [0, 1.11, .66], [.12, 1.44, .12], transportColors.trim, [0, 0, 90]));
    const rockerOutline: [number, number][] = Array.from({ length: 13 }, (_, index) => { const angle = (-120 + index * 15) * Math.PI / 180; return [1.29 + Math.sin(angle) * .55, .3 + Math.cos(angle) * .55]; });
    rockerOutline.push(...Array.from({ length: 13 }, (_, index) => { const angle = (60 - index * 15) * Math.PI / 180; return [1.29 + Math.sin(angle) * .41, .3 + Math.cos(angle) * .41] as [number, number]; }), [.74, -1.3], [.59, -1.3]);
    for (const side of [-1, 1]) {
      parts.push(box("上车底架两侧承接曲面摇臂的水平滚道", [side * .61, .7, .15], [.16, .08, 1.48], transportColors.trim), strut("滚道前端由下方上车底架承接的短支座", [side * .61, .7, -.5], [side * .61, .84, -.5], .14), uprightPlate("以真实弧形底面在滚道上后摇的整片承力摇臂", rockerOutline, side * .61, .1), cylinder("由横向驱动轴实际承托的摇铲牵引链轮", [side * .64, 1.11, .66], [.31, .1, .31], transportColors.dark, [0, 0, 90]), box("与上车底架后端相接的摇臂缓冲止挡", [side * .61, 1.01, .92], [.2, .24, .18], transportColors.body));
      parts.push(part("从摇臂前端连续接到驱动链轮的牵引链", "tube", transportColors.dark, [0, 0, 0], [1, 1, 1], [0, 0, 0], { radius: .025, path: [{ x: side * .68, y: .69, z: -1.26 }, { x: side * .68, y: 1.25, z: .58 }, { x: side * .64, y: 1.26, z: .66 }, { x: side * .64, y: 1.11, z: .81 }] }), rod("防止曲面摇臂与滚道分离的独立保留钢索", [side * .61, 1.766, .575], [side * .61, .84, .88], .025, transportColors.dark), box("摇臂前端与斗背刚性连接的实际接耳", [side * .61, .68, -1.25], [.2, .17, .2], transportColors.dark));
    }
    parts.push(uprightPlate("底面与弯曲后背连续相接而顶部敞开的装岩铲斗", [[.1, -2.1], [.12, -1.5], [.22, -1.32], [.72, -1.17], [.75, -1.22], [.28, -1.38], [.19, -1.53], [.17, -2.1]], 0, 1.46, transportColors.body), box("跨过铲斗全宽的前方耐磨切削刃", [0, .15, -2.08], [1.55, .08, .1], transportColors.trim));
    for (const side of [-1, 1]) parts.push(uprightPlate("与弯曲底和斗背相接的独立斗侧板", [[.12, -2.1], [.12, -1.5], [.22, -1.32], [.72, -1.17], [.72, -1.4], [.4, -1.9]], side * .72, .055, transportColors.body));
    parts.push(box("人员位于摇臂外侧的独立站立踏台", [-.98, .42, .3], [.5, .12, 1.4], transportColors.dark), strut("操作踏台接入车架的前横托臂", [-.5, .42, -.25], [-1, .42, -.25], .12), strut("操作踏台接入车架的后横托臂", [-.5, .42, .8], [-1, .42, .8], .12), box("两路压气操作阀实际固定于侧边控制座", [-.96, .98, .65], [.26, .32, .24], transportColors.body), strut("侧操作阀到站台的实际承托立柱", [-.96, .42, .65], [-.96, .85, .65], .09));
    for (const z of [.58, .72]) parts.push(rod("走行和摇铲各自独立的压气阀控制手柄", [-.96, 1.09, z], [-1.05, 1.34, z], .025, transportColors.dark));
    parts.push(part("由控制阀分出的短压气总管", "tube", transportColors.dark, [0, 0, 0], [1, 1, 1], [0, 0, 0], { radius: .03, path: [{ x: -.93, y: .96, z: .75 }, { x: -.45, y: .96, z: .87 }, { x: -.3, y: 1.11, z: .8 }, { x: -.2, y: 1.11, z: .7 }] }), part("从气路分配座接入走行马达的独立支管", "tube", transportColors.dark, [0, 0, 0], [1, 1, 1], [0, 0, 0], { radius: .022, path: [{ x: -.45, y: .96, z: .87 }, { x: -.4, y: .77, z: .9 }, { x: -.25, y: .77, z: .82 }] }));
    return parts;
  } },
];
