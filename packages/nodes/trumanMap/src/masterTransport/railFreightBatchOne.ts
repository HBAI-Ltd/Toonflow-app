import { part, ring, type ModelPart, type Triple } from "../assetModelParts";
import { polygon } from "../masterNature/shared";
import { standardGaugeWheelset } from "./railExpansionBatchOne";
import { box, cylinder, strut, transportColors, type TransportDefinition } from "./parts";

function freightRunningGear(length: number, bogieOffset: number): ModelPart[] {
  const parts: ModelPart[] = [];
  for (const center of [-bogieOffset, bogieOffset]) {
    parts.push(box("在两侧承轴架上承接车底纵梁的横向摇枕", [0, 1.015, center], [2.55, .23, .56], transportColors.dark));
    for (const side of [-1, 1]) parts.push(box("同一转向架两端轴箱之间的通长承力侧架", [side * 1.03, .82, center], [.22, .38, 2.65], transportColors.dark));
    for (const offset of [-.95, .95]) {
      const z = center + offset;
      parts.push(...standardGaugeWheelset(z));
      for (const side of [-1, 1]) parts.push(box("包住横轴端并向上接入承力侧架的轴承箱", [side * 1.03, .54, z], [.28, .29, .34], transportColors.dark));
    }
  }
  for (const side of [-1, 1]) parts.push(box("横跨两转向架且与摇枕实接的货车底架侧纵梁", [side * 1.25, 1.13, 0], [.18, .24, length], transportColors.dark));
  for (const end of [-1, 1]) parts.push(box("把侧纵梁和中央牵引柄联为一体的车端横梁", [0, 1.13, end * (length / 2 - .16)], [2.7, .25, .22], transportColors.dark), box("由车端横梁伸出的中央牵引车钩柄", [0, 1.11, end * (length / 2 + .19)], [.22, .23, .58], transportColors.dark));
  return parts;
}

function handBrake(parts: ModelPart[], z: number) {
  parts.push(box("端台制动立柱实际固定于车端横梁", [-.95, 1.67, z], [.1, 1.05, .12], transportColors.dark), cylinder("贯穿制动手轮中心并接入立柱的短轴", [-.95, 2.08, z - .08], [.08, .23, .08], transportColors.trim, [90, 0, 0]), ring("有真实内孔的车端制动手轮轮圈", transportColors.trim, .24, .025, 0, .035, { position: { x: -.95, y: 2.08, z: z - .19 }, rotation: { x: 90, y: 0, z: 0 } }));
  for (const angle of [0, 60, 120]) parts.push(box("由制动手轮轴心连接到外圈的实际轮辐", [-.95, 2.08, z - .19], [.46, .025, .035], transportColors.trim, [0, 0, angle]));
}

function pivotedParts(parts: ModelPart[], origin: Triple, angle: number): ModelPart[] {
  const radians = angle * Math.PI / 180, c = Math.cos(radians), s = Math.sin(radians);
  return parts.map(value => {
    const x = value.position.x, y = value.position.y;
    return { ...value, position: { x: origin[0] + x * c - y * s, y: origin[1] + x * s + y * c, z: origin[2] + value.position.z }, rotation: { ...value.rotation, z: value.rotation.z + angle } };
  });
}

// 仅参考货车承载和卸料类别，造型、比例及部件均为原创简化，不含货物或品牌涂装。
// https://www.gbrx.com/wp-content/uploads/2021/06/73-Centerbeam-Railcar.pdf
// https://www.lohr.fr/uploads/2023/04/d16589c-plaquette-modalohr-en.pdf
// https://loram.com/inspection-and-optimization/ballast-technologies/products-solutions/hydradump/
// https://www.spoorwegmuseum.nl/en/ontdek/de-collectie/our-trains/bulb-wagon-ns-99625-ucs/
export const railFreightBatchOne: TransportDefinition[] = [
  { name: "贯通高桁架中梁木材铁路平车", theme: "现代", tags: ["火车", "铁路", "铁路货运", "中梁平车", "中央承力桁架", "两侧独立装载台", "本体不含可换木材货物"], create: () => {
    const parts = freightRunningGear(22, 8.4);
    for (const side of [-1, 1]) parts.push(box("中梁两旁各自连续并接在侧纵梁上的装货地板", [side * .72, 1.31, 0], [1.25, .15, 21.65], transportColors.wood));
    parts.push(box("车厢中轴通长高桁架的下弦承载梁", [0, 1.39, 0], [.2, .23, 21.65], transportColors.body), box("贯穿两端挡板的高位桁架上弦梁", [0, 4.34, 0], [.19, .2, 21.65], transportColors.body));
    for (let index = 0; index < 7; index++) {
      const z = -10.6 + index * 3.53;
      parts.push(box("承载中梁上下弦之间的独立高立柱", [0, 2.86, z], [.18, 3.1, .18], transportColors.body));
      if (index < 6) parts.push(strut("跨相邻立柱且实接上下弦的三角腹杆", [0, index % 2 ? 4.31 : 1.4, z], [0, index % 2 ? 1.4 : 4.31, z + 3.53], .12, transportColors.body));
    }
    for (const end of [-1, 1]) {
      parts.push(box("与中梁相接且挡住纵向滑货的车端高挡板", [0, 2.85, end * 10.73], [2.67, 3.05, .14], transportColors.body));
      for (const side of [-1, 1]) parts.push(strut("端挡板外侧连接底架和上缘的斜撑", [side * 1.19, 1.24, end * 10.81], [side * .35, 4.32, end * 10.81], .1, transportColors.dark));
    }
    for (const side of [-1, 1]) for (const z of [-8.8, -5.3, -1.8, 1.8, 5.3, 8.8]) parts.push(cylinder("真正固定在侧纵梁上的捆带卷紧轴", [side * 1.38, 1.36, z], [.2, .18, .2], transportColors.trim, [0, 0, 90]));
    handBrake(parts, 10.55);
    return parts;
  } },
  { name: "开腹鱼梁扭锁骨架集装箱铁路平车", theme: "现代", tags: ["火车", "铁路", "铁路货运", "集装箱骨架车", "无通长承货底板", "鱼腹中央纵梁", "实体角件扭锁座"], create: () => {
    const parts = freightRunningGear(18.6, 6.9);
    const web = polygon("侧面呈鱼腹下垂且贯通两端的中央承力腹板", transportColors.body, [[.97, -9.12], [1.44, -9.12], [1.44, 9.12], [.97, 9.12], [.97, 5.9], [.57, 4.5], [.57, -4.5], [.97, -5.9]], .25, [.125, 0, 0]);
    web.rotation.z = 90;
    parts.push(web, box("鱼腹纵梁上缘沿全长连续的窄翼板", [0, 1.43, 0], [.48, .12, 18.25], transportColors.body), box("中央最低鱼腹边的下翼板", [0, .6, 0], [.45, .12, 9.1], transportColors.body));
    for (const end of [-1, 1]) parts.push(strut("低腹段下缘接回车端高梁的斜翼板", [0, .6, end * 4.5], [0, 1, end * 5.9], .18, transportColors.body));
    for (const z of [-8.7, -3.1, 3.1, 8.7]) {
      parts.push(box("将两侧箱角荷载送进鱼腹中梁的横枕", [0, 1.4, z], [2.82, .19, .3], transportColors.body));
      for (const side of [-1, 1]) parts.push(box("横枕末端承接集装箱角件的凸起座板", [side * 1.25, 1.54, z], [.3, .13, .35], transportColors.trim), box("穿入角件并旋转锁紧的横置扭锁头", [side * 1.25, 1.645, z], [.19, .1, .1], transportColors.dark), strut("横枕下缘连回中央腹板的对角短撑", [side * 1.16, 1.31, z], [0, 1.02, z + Math.sign(z) * .7], .1, transportColors.dark));
    }
    for (const side of [-1, 1]) for (const z of [-6.5, 0, 6.5]) parts.push(box("骨架侧梁外缘可踩踏的短格栅踏台", [side * 1.25, 1.32, z], [.4, .08, .85], transportColors.trim));
    handBrake(parts, 9.1);
    return parts;
  } },
  { name: "低轮袋回转承载桥半挂车铁路驮背车", theme: "现代", tags: ["火车", "铁路", "铁路货运", "半挂车驮背运输", "独立回转承载桥", "下沉承轮槽", "机械枢轴与牵引销鞍座", "不包含路面拖车"], create: () => {
    const parts = freightRunningGear(19.4, 7.95);
    // ACT: 静态素材保留闭合运输姿态；开桥状态不再登记为第二个主素材。
    parts.push(cylinder("下沉承载桥中央实接横向底托的竖向回转枢轴", [0, .51, .5], [.34, .62, .34], transportColors.dark), box("中央枢轴下方接到两侧车底纵梁的低位横托", [0, .33, .5], [2.62, .18, .5], transportColors.dark), box("中央回转枢轴顶端的承载桥定位盘", [0, .78, .5], [.75, .1, .75], transportColors.trim));
    for (const side of [-1, 1]) {
      parts.push(box("把中央低位枢轴横托吊接到固定高位车架的承力立耳", [side * 1.25, .73, .5], [.2, .83, .4], transportColors.dark));
      parts.push(box("低于转向架顶面的贯通回转载桥侧壁梁", [side * 1.16, .65, .15], [.2, .73, 13.7], transportColors.body), box("后车轮可直接压入的独立低位轮袋底板", [side * .76, .335, 3.2], [.72, .14, 5.25], transportColors.trim), box("前支腿可停放且与轮袋连通的窄底板", [side * .76, .335, -.72], [.72, .14, 2.65], transportColors.trim));
      for (const z of [-5.9, -2.9, .5, 3.8, 6.3]) parts.push(box("独立回转载桥两侧把低底板吊接到侧梁的托肋", [side * 1.03, .48, z], [.18, .32, .22], transportColors.dark));
      parts.push(box("桥端与固定车架机械锁合的实心锁舌", [side * 1.16, 1.04, -6.65], [.25, .13, .38], transportColors.dark), box("车架上承接回载桥锁舌的固定锁座", [side * 1.24, 1.13, -6.66], [.36, .13, .55], transportColors.body));
    }
    for (const z of [-6.55, -2.05, .5, 5.72, 6.82]) parts.push(box("跨接两根回转载桥纵梁的低位横梁", [0, .34, z], [2.45, .16, .24], transportColors.body));
    parts.push(box("与回转载桥前段连成整体的牵引销鞍座横托", [0, .98, -5.65], [2.42, .2, .8], transportColors.dark), box("从横托向上实际承接半挂车前牵引销的鞍座立台", [0, 1.32, -5.65], [.62, .55, .68], transportColors.body));
    const saddle = polygon("保留后向导入槽的开喉式牵引销鞍盘", transportColors.dark, [[-.42, -.4], [.42, -.4], [.42, .4], [.13, .4], [.13, -.08], [-.13, -.08], [-.13, .4], [-.42, .4]], .12, [0, 1.57, -5.65]);
    parts.push(saddle, box("回转桥中央定位销实际插入承载盘的锁定柱", [.24, .77, .5], [.1, .25, .1], transportColors.trim));
    for (const end of [-1, 1]) parts.push(box("转向架上方固定踏板避让低位回转桥", [0, 1.29, end * 8.7], [2.5, .14, 1.55], transportColors.trim));
    handBrake(parts, 9.4);
    return parts;
  } },
  { name: "双仓锥底密闭气卸铁路粉料罐车", theme: "现代", tags: ["火车", "铁路", "铁路货运", "气卸粉料车", "独立立式压力仓", "锥底集料", "连续卸料汇管与供气管"], create: () => {
    const parts = freightRunningGear(11.2, 3.7);
    parts.push(box("两压力仓之间连接全部横托的中央车底梁", [0, 1.15, 0], [.36, .24, 10.85], transportColors.dark));
    for (const z of [-2.25, 2.25]) {
      parts.push(part("带上收锥封头及下卸料锥的封闭独立压力仓", "lathe", transportColors.body, [0, 1.3, z], [1, 1, 1], [0, 0, 0], { profile: [{ x: 0, y: 0 }, { x: .2, y: 0 }, { x: .28, y: .15 }, { x: 1.2, y: 1.02 }, { x: 1.3, y: 1.17 }, { x: 1.3, y: 2.34 }, { x: 1.22, y: 2.54 }, { x: .32, y: 3.02 }, { x: 0, y: 3.02 }] }), ring("压力仓圆腹处承接支腿的实际承力环箍", transportColors.dark, 1.32, .065, 2.48, .17, { position: { x: 0, y: 2.48, z } }), cylinder("与锥顶相接的粉料装填人孔短颈", [0, 4.37, z], [.46, .22, .46], transportColors.body), cylinder("密闭人孔上方独立锁紧盖", [0, 4.5, z], [.55, .08, .55], transportColors.trim), cylinder("下锥真正接入卸料阀座的短喉管", [0, 1.3, z], [.25, .27, .25], transportColors.dark), box("下卸料喉管上的独立隔离阀体", [0, 1.13, z], [.34, .23, .34], transportColors.trim));
      for (const side of [-1, 1]) {
        parts.push(strut("从车底侧纵梁承托仓体承力环的实际斜支腿", [side * 1.23, 1.22, z], [side * 1.23, 2.47, z], .13, transportColors.dark), box("支腿下端横向连接中央底梁的托梁", [side * .62, 1.21, z], [1.35, .18, .4], transportColors.dark));
      }
      parts.push(part("从独立卸料阀连续接入侧面汇管的粉料支管", "tube", transportColors.dark, [0, 0, 0], [1, 1, 1], [0, 0, 0], { radius: .065, path: [{ x: 0, y: 1.1, z }, { x: .55, y: .99, z }, { x: 1.39, y: .99, z }] }), part("供气主管到压力仓下锥的独立加压支路", "tube", transportColors.trim, [0, 0, 0], [1, 1, 1], [0, 0, 0], { radius: .025, path: [{ x: -1.38, y: 1.35, z }, { x: -.72, y: 1.5, z }, { x: -.3, y: 1.55, z }] }));
    }
    parts.push(part("沿车侧连接两只卸料阀的连续粉料总管", "tube", transportColors.dark, [0, 0, 0], [1, 1, 1], [0, 0, 0], { radius: .075, path: [{ x: 1.39, y: .99, z: -3.5 }, { x: 1.39, y: .99, z: 0 }, { x: 1.39, y: .99, z: 3.5 }] }), part("沿另一侧连接仓体气支路的连续压气总管", "tube", transportColors.trim, [0, 0, 0], [1, 1, 1], [0, 0, 0], { radius: .03, path: [{ x: -1.38, y: 1.35, z: -3.5 }, { x: -1.38, y: 1.35, z: 0 }, { x: -1.38, y: 1.35, z: 3.5 }] }), ring("侧面粉料软管接驳口保留真实通孔", transportColors.trim, .105, .025, 0, .18, { position: { x: 1.39, y: .99, z: 3.58 }, rotation: { x: 90, y: 0, z: 0 } }), box("仓间实际连接两只承力环的巡检平台", [0, 2.48, 0], [1.2, .12, 2.08], transportColors.trim), box("把中央巡检平台实际延伸至外侧检修梯顶的踏板", [1.02, 2.48, 0], [.94, .12, .88], transportColors.trim));
    for (const side of [-1, 1]) {
      parts.push(strut("仓间检修梯的实际侧扶梯梁", [1.42, 1.27, side * .36], [1.42, 2.56, side * .36], .05, transportColors.dark), strut("检修平台两侧实际固定的护栏立柱", [side * .56, 2.48, 0], [side * .56, 3.25, 0], .04, transportColors.dark));
      parts.push(strut("检修梯下端实际连回车底侧纵梁的短连接座", [1.25, 1.29, side * .36], [1.42, 1.29, side * .36], .07, transportColors.dark), strut("由平台护栏立柱实托的纵向上扶手", [side * .56, 3.25, -1.04], [side * .56, 3.25, 1.04], .04, transportColors.dark));
    }
    for (const y of [1.38, 1.67, 1.96, 2.25, 2.54]) parts.push(strut("在两侧梯梁之间实接的防滑梯级", [1.42, y, -.36], [1.42, y, .36], .04, transportColors.trim));
    handBrake(parts, 5.35);
    return parts;
  } },
  { name: "全斗侧翻降门气动铁路自卸车", theme: "现代", tags: ["火车", "铁路", "铁路货运", "侧翻自卸车", "独立车斗纵向铰轴", "双侧气动执行器", "卸料侧门实际降下", "不同于固定敞车及底卸漏斗车"], create: () => {
    const parts = freightRunningGear(12.4, 4.2);
    parts.push(box("车斗下方把四气缸和支座联在一起的中央底架", [0, 1.24, 0], [2.36, .22, 10.9], transportColors.dark), cylinder("沿卸料侧贯通支承整个车斗的纵向铰接轴", [1.1, 1.53, 0], [.17, 10.45, .17], transportColors.trim, [90, 0, 0]));
    for (const z of [-4.3, 0, 4.3]) parts.push(box("纵向翻斗铰轴真正坐入固定车架的轴承支座", [1.1, 1.4, z], [.34, .34, .4], transportColors.dark));
    const body: ModelPart[] = [box("侧翻整斗的连续平底承货板", [-1.1, .065, 0], [2.58, .13, 10.5], transportColors.body), box("非卸料侧与底板实接的完整高侧壁", [-2.34, .91, 0], [.12, 1.75, 10.5], transportColors.body), box("非卸料侧壁上缘连续加固梁", [-2.34, 1.82, 0], [.18, .13, 10.55], transportColors.dark)];
    for (const end of [-1, 1]) body.push(box("整斗两端的封闭横向端板", [-1.1, .91, end * 5.2], [2.58, 1.75, .13], transportColors.body), strut("斗端外部把底缘接到上缘的对角承力肋", [-2.2, .12, end * 5.3], [-.05, 1.74, end * 5.3], .09, transportColors.dark));
    for (const z of [-4.8, -2.4, 0, 2.4, 4.8]) body.push(box("车斗高侧壁外缘从下梁连续接到上梁的立肋", [-2.42, .91, z], [.09, 1.84, .12], transportColors.dark));
    parts.push(...pivotedParts(body, [1.1, 1.53, 0], -22));
    // 右侧门由底部铰接向外放下；它属于这台自卸车，不以开闭姿态另增条目。
    parts.push(box("卸料侧向外降下并离开整斗流料路径的独立长门", [1.77, 1.32, 0], [1.52, .12, 10.35], transportColors.body, [0, 0, -12]), cylinder("降门接回车架侧的独立通长门铰轴", [1.08, 1.47, 0], [.12, 10.4, .12], transportColors.dark, [90, 0, 0]));
    for (const z of [-3.1, 3.1]) {
      for (const side of [-1, 1]) {
        const start: Triple = [side * .9, 1.28, z], end: Triple = side < 0 ? [-.96, 2.38, z] : [.75, 1.69, z];
        const middle: Triple = [start[0] + (end[0] - start[0]) * .62, start[1] + (end[1] - start[1]) * .62, z];
        parts.push(strut("用底耳轴支承且向翻斗传力的独立气缸筒", start, middle, .32, transportColors.dark), strut("由气缸筒实际伸入车斗底部耳轴的活塞杆", middle, end, .13, transportColors.trim), cylinder("活塞杆与翻斗底部实际连接的纵向销轴", end, [.11, .34, .11], transportColors.trim, [90, 0, 0]), box("气缸底部实际固定在底架的耳轴座", [start[0], 1.31, z], [.43, .25, .32], transportColors.body));
      }
    }
    parts.push(cylinder("专供翻斗执行器的卧式压气储罐", [0, 1.63, 4.75], [.42, 1.2, .42], transportColors.dark, [0, 0, 90]), box("将储气罐实托于底架的鞍座", [0, 1.43, 4.75], [1.07, .19, .34], transportColors.body), box("翻斗气路控制阀固定在车架外侧的阀座", [-1.34, 1.43, -4.65], [.23, .4, .5], transportColors.trim));
    handBrake(parts, 6);
    return parts;
  } },
];
