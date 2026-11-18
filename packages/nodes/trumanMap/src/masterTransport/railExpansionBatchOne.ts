import { part, ring, type ModelPart, type Triple } from "../assetModelParts";
import { polygon } from "../masterNature/shared";
import { box, cylinder, strut, transportColors, type TransportDefinition } from "./parts";

// 类别与总装关系参考厂商资料，全部轮廓为本地原创简化，不是厂商制造图。
// https://www.wabteccorp.com/freight-car/truck-systems/side-frames-bolsters
// https://www.voith.com/corp-en/connection-components-couplings/railway-couplers.html
export function steelWheelset(z: number): ModelPart[] {
  const parts = [cylinder("贯穿两车轮的整根钢轴", [0, .49, z], [.17, 2.06, .17], transportColors.dark, [0, 0, 90])];
  for (const side of [-1, 1]) parts.push(part("带内侧轮缘、踏面及凹形轮辐的铁路钢轮", "lathe", transportColors.body, [side * .78, .49, z], [1, 1, 1], [0, 0, -side * 90], { profile: [{ x: .1, y: -.085 }, { x: .49, y: -.085 }, { x: .49, y: -.055 }, { x: .455, y: -.04 }, { x: .455, y: .09 }, { x: .38, y: .09 }, { x: .32, y: .035 }, { x: .14, y: .035 }, { x: .14, y: .1 }, { x: .1, y: .1 }, { x: .1, y: -.085 }] }));
  return parts;
}

// 新标准轨整车保留1.36米轮背距，收窄轮缘根部以避开1.435米线路的轨头内缘。
export function standardGaugeWheelset(z: number): ModelPart[] {
  const parts = steelWheelset(z);
  for (const value of parts) {
    if (value.shape === "cylinder") { value.scale.x = .21; value.scale.z = .21; continue; }
    value.position.x = Math.sign(value.position.x) * .765;
    value.profile = value.profile!.map(point => point.x === .455 && point.y === -.04 ? { ...point, y: -.05 } : point);
  }
  return parts;
}

function coil(position: Triple, radius: number, height: number): ModelPart {
  const vertices: { x: number; y: number; z: number }[] = [], indices: number[] = [], wire = radius * .15;
  const rise = height / (Math.PI * 6), tangentLength = Math.hypot(radius, rise);
  for (let step = 0; step <= 24; step++) {
    const angle = step / 24 * Math.PI * 6, c = Math.cos(angle), s = Math.sin(angle);
    for (let side = 0; side < 6; side++) {
      const around = side * Math.PI / 3, radial = Math.cos(around) * wire, cross = Math.sin(around) * wire;
      vertices.push({ x: c * (radius + radial) + s * rise / tangentLength * cross, y: step / 24 * height + radius / tangentLength * cross, z: s * (radius + radial) - c * rise / tangentLength * cross });
      if (step) { const a = (step - 1) * 6 + side, b = (step - 1) * 6 + (side + 1) % 6; indices.push(a, b, b + 6, a, b + 6, a + 6); }
    }
  }
  vertices.push({ x: radius, y: 0, z: 0 }, { x: radius, y: height, z: 0 });
  for (let side = 0; side < 6; side++) { const next = (side + 1) % 6; indices.push(150, next, side, 151, 144 + side, 144 + next); }
  return part("承载螺旋钢弹簧", "mesh", transportColors.dark, position, [1, 1, 1], [0, 0, 0], { vertices, indices });
}

function ovalLink(position: Triple, crosswise = false): ModelPart {
  return ring("保留真实中孔的锻钢椭圆链环", transportColors.dark, .12, .027, 0, .04, { position: { x: position[0], y: position[1], z: position[2] }, scale: { x: 1, y: 1, z: 1.65 }, rotation: { x: crosswise ? 90 : 0, y: 0, z: crosswise ? 0 : 90 } });
}

export const railExpansionBatchOne: TransportDefinition[] = [
  { name: "三大件铸钢摇枕货车转向架", theme: "现代", itemType: "构件", tags: ["铁路货车", "两侧架一摇枕", "独立完整走行部"], create: () => {
    const parts: ModelPart[] = [...steelWheelset(-.91), ...steelWheelset(.91), box("跨越两侧架的浮置摇枕", [0, 1.03, 0], [2.05, .27, .5]), ring("摇枕上方真正凹口的车体心盘", transportColors.dark, .3, .06, 1.23, .12), cylinder("凹心盘中央承载销", [0, 1.23, 0], [.11, .15, .11], transportColors.trim)];
    const outline: [number, number][] = [[-1.27, .4], [-1.27, .83], [-.98, 1.17], [-.66, 1.17], [-.37, 1.02], [.37, 1.02], [.66, 1.17], [.98, 1.17], [1.27, .83], [1.27, .4], [.43, .4], [.32, .56], [-.32, .56], [-.43, .4]];
    const holes: [number, number][][] = [[[-1.04, .78], [-.87, .99], [-.65, .99], [-.43, .78]], [[.43, .78], [.65, .99], [.87, .99], [1.04, .78]], [[-.29, .65], [.29, .65], [.29, .91], [-.29, .91]]];
    for (const side of [-1, 1]) {
      const frame = polygon("三处真实透空的整体铸钢侧架", transportColors.body, outline, .13, [0, 0, 0], holes);
      frame.vertices = frame.vertices!.map(({ x, y, z }) => ({ x: side * 1.02 + y - .065, y: z, z: x }));
      parts.push(frame);
      for (const z of [-.91, .91]) parts.push(box("侧架端部包承钢轴的轴箱", [side * 1.02, .54, z], [.24, .27, .36], transportColors.dark));
      for (const x of [-.065, .065]) for (const z of [-.17, 0, .17]) parts.push(coil([side * 1.02 + x, .64, z], .052, .24));
      parts.push(box("弹簧组下方承簧台", [side * 1.02, .615, 0], [.3, .07, .58], transportColors.dark), box("摇枕端部弹簧压座", [side * 1.02, .94, 0], [.3, .1, .58]), box("车体侧向滚动旁承", [side * .72, 1.24, 0], [.23, .12, .3], transportColors.dark));
    }
    for (const z of [-.66, .66]) parts.push(box("连结两侧闸瓦的制动横梁", [0, .48, z], [1.95, .08, .1], transportColors.dark), ...[-1, 1].map(side => box("贴近钢轮踏面的独立制动闸瓦", [side * .78, .5, z], [.16, .37, .08], transportColors.trim)));
    return parts;
  } },
  { name: "焊接H架空气弹簧客车转向架", theme: "现代", itemType: "构件", tags: ["客车走行部", "空气弹簧二系悬挂", "整体焊接H形构架"], create: () => {
    const parts: ModelPart[] = [...steelWheelset(-1.18), ...steelWheelset(1.18), box("H构架中央贯通横梁", [0, .96, 0], [2.15, .26, .42]), box("承受空气弹簧载荷的上摇枕", [0, 1.5, 0], [2.15, .16, .55], transportColors.trim)];
    for (const side of [-1, 1]) {
      parts.push(box("通长封闭箱形侧梁", [side * 1, .96, 0], [.22, .3, 2.95]), part("圆腹橡胶空气弹簧", "lathe", transportColors.dark, [side * .85, 1.11, 0], [1, 1, 1], [0, 0, 0], { profile: [{ x: .18, y: 0 }, { x: .26, y: .05 }, { x: .29, y: .16 }, { x: .26, y: .26 }, { x: .19, y: .3 }, { x: 0, y: .3 }, { x: 0, y: 0 }] }), cylinder("空气弹簧下托盘", [side * .85, 1.12, 0], [.5, .07, .5], transportColors.trim), cylinder("空气弹簧上盖盘", [side * .85, 1.42, 0], [.46, .07, .46], transportColors.trim));
      for (const z of [-1.18, 1.18]) parts.push(box("滚动轴承密封轴箱", [side * 1.02, .51, z], [.27, .29, .35], transportColors.dark), coil([side * 1.02, .64, z], .095, .19), cylinder("一系弹簧上承台", [side * 1.02, .86, z], [.26, .07, .26]), strut("轴箱定位摆臂", [side * 1.02, .55, z], [side * 1.02, .79, z - Math.sign(z) * .43], .08), strut("斜置液压减振器缸体", [side * 1.14, .65, z], [side * 1.14, .98, z - Math.sign(z) * .5], .09, transportColors.trim));
      parts.push(strut("上摇枕防侧滚连杆", [side * .91, 1.43, .2], [side * .91, 1, .49], .065), strut("车体抗蛇行减振器", [side * 1.24, 1.05, -.65], [side * 1.24, 1.05, .45], .11, transportColors.dark));
    }
    for (const z of [-1.18, 1.18]) for (const side of [-1, 1]) parts.push(cylinder("轴装圆盘制动盘", [side * .36, .49, z], [.61, .065, .61], transportColors.trim, [0, 0, 90]), box("上部抱住制动盘的制动钳", [side * .36, .79, z], [.2, .17, .22], transportColors.signal));
    parts.push(cylinder("连接车体的中心牵引销", [0, 1.6, 0], [.17, .27, .17], transportColors.dark));
    return parts;
  } },
  { name: "旋转钩舌詹氏自动车钩", theme: "现代", itemType: "构件", tags: ["铁路联结器", "开口钩喉", "垂直钩舌销"], create: () => {
    const parts: ModelPart[] = [box("后端牵引杆柄", [0, .29, -.61], [.19, .2, .74], transportColors.dark), polygon("带真实内收钩喉的铸钢钩体", transportColors.body, [[-.12, -.37], [.12, -.37], [.15, .02], [.26, .17], [.27, .39], [.12, .56], [-.12, .56], [-.12, .38], [.035, .38], [.08, .27], [.025, .18], [-.17, .14]], .22, [0, .18, 0]), polygon("绕竖销略张开的独立钩舌", transportColors.trim, [[-.17, .1], [-.29, .13], [-.34, .32], [-.28, .48], [-.16, .54], [-.1, .43], [-.19, .36], [-.22, .25], [-.15, .22]], .21, [0, .185, 0]), cylinder("贯穿钩体与钩舌的转动销", [-.17, .305, .17], [.065, .34, .065], transportColors.dark), cylinder("钩舌销顶帽", [-.17, .49, .17], [.1, .035, .1], transportColors.trim), box("钩锁铁提升头", [.03, .43, .03], [.08, .12, .12], transportColors.dark), strut("钩锁提升小连杆", [.03, .47, .03], [.19, .58, -.12], .025), ring("钩锁操作提环", transportColors.dark, .065, .014, 0, .02, { position: { x: .19, y: .59, z: -.12 }, rotation: { x: 90, y: 0, z: 0 } }), box("尾柄横销头", [0, .29, -.98], [.33, .08, .08], transportColors.trim)];
    return parts;
  } },
  { name: "锥面定位密接中心缓冲车钩", theme: "现代", itemType: "构件", tags: ["客车密接联结器", "锥孔导向面", "下置电气连接盒"], create: () => {
    const outline: [number, number][] = [[-.31, .1], [-.36, .19], [-.36, .51], [-.24, .63], [.24, .63], [.36, .51], [.36, .19], [.31, .1]];
    const hole: [number, number][] = Array.from({ length: 16 }, (_, i) => { const angle = i * Math.PI / 8; return [.14 + Math.cos(angle) * .102, .39 + Math.sin(angle) * .102]; });
    const face = polygon("有真正导向孔的密接车钩面板", transportColors.body, outline.map(([x, y]) => [x, -y]), .12, [0, 0, .46], [hole.map(([x, y]) => [x, -y])]);
    face.rotation.x = 90;
    const parts: ModelPart[] = [face, box("后方中央牵引杆", [0, .35, -.2], [.18, .18, .85], transportColors.dark), cylinder("牵引杆后部转动安装轴", [0, .35, -.65], [.12, .36, .12], transportColors.trim), part("与对侧凹孔互锁的前伸定位锥", "cone", transportColors.trim, [-.14, .39, .6], [.2, .27, .2], [90, 0, 0]), ring("贯通面板导向孔的厚壁接收筒", transportColors.dark, .102, .02, 0, .2, { position: { x: .14, y: .39, z: .39 }, rotation: { x: 90, y: 0, z: 0 } }), box("下方独立电气触头壳", [0, .125, .23], [.41, .14, .3], transportColors.dark), box("下方前置电接触面", [0, .125, .395], [.34, .09, .03], transportColors.trim), cylinder("密接头后横向摆动销", [0, .35, .22], [.08, .49, .08], transportColors.dark, [0, 0, 90]), box("安装座承力底板", [0, .035, -.53], [.43, .07, .35], transportColors.body)];
    for (const side of [-1, 1]) parts.push(strut("钩头到牵引杆的斜承力肋", [side * .27, .35, .45], [side * .07, .35, -.01], .1), ring("气路接头前端真实通孔", transportColors.dark, .038, .01, 0, .08, { position: { x: side * .26, y: .22, z: .56 }, rotation: { x: 90, y: 0, z: 0 } }));
    return parts;
  } },
  { name: "螺杆收紧链环式铁路联结器", theme: "欧式", itemType: "构件", tags: ["手动链式车钩", "双向螺纹拉紧器", "真实椭圆环孔"], create: () => {
    const parts: ModelPart[] = [cylinder("双向螺纹收紧筒", [0, .27, 0], [.085, .3, .085], transportColors.body, [90, 0, 0]), cylinder("前向螺纹拉杆", [0, .27, -.23], [.04, .24, .04], transportColors.dark, [90, 0, 0]), cylinder("后向螺纹拉杆", [0, .27, .23], [.04, .24, .04], transportColors.dark, [90, 0, 0]), ...[-1, 1].map(end => ovalLink([0, .27, end * .46])), strut("穿过收紧筒的旋紧摆柄", [-.15, .14, 0], [.15, .4, 0], .025, transportColors.trim), cylinder("旋紧摆柄端部握块", [.16, .41, 0], [.05, .08, .05], transportColors.dark, [0, 0, -45]), box("后部车体承力安装梁", [0, .27, -.76], [.48, .22, .1], transportColors.body), ovalLink([0, .27, -.67], true)];
    const arc = Array.from({ length: 13 }, (_, index): [number, number] => { const angle = (-55 + index * 275 / 12) * Math.PI / 180; return [Math.cos(angle) * .14, Math.sin(angle) * .14]; });
    const inner = Array.from({ length: 13 }, (_, index): [number, number] => { const angle = (220 - index * 275 / 12) * Math.PI / 180; return [Math.cos(angle) * .085, Math.sin(angle) * .085]; });
    parts.push(part("留开口供末端链环挂入的锻造钩", "extrude", transportColors.trim, [0, .27, .71], [1, 1, 1], [0, 90, 0], { profile: [...arc, ...inner].map(([x, y]) => ({ x, y })), depth: .055 }), box("前端钩尾承力根部", [0, .18, .85], [.055, .18, .12], transportColors.trim));
    return parts;
  } },
  { name: "橡胶环簧车端管式缓冲器", theme: "现代", itemType: "构件", tags: ["铁路侧缓冲", "弹性环簧", "车端缓冲盘"], create: () => {
    const parts: ModelPart[] = [box("四孔安装座板", [0, .3, -.43], [.41, .58, .065], transportColors.body), part("缓冲器外承力管", "lathe", transportColors.dark, [0, .3, -.16], [1, 1, 1], [90, 0, 0], { profile: [{ x: .145, y: -.23 }, { x: .18, y: -.23 }, { x: .18, y: .23 }, { x: .145, y: .23 }, { x: .145, y: -.23 }] }), cylinder("从承力管前口伸出的压缩柱塞", [0, .3, .18], [.21, .45, .21], transportColors.trim, [90, 0, 0]), cylinder("缓冲盘背部圆承盘", [0, .3, .43], [.38, .055, .38], transportColors.body, [90, 0, 0]), part("略有凸面的宽幅缓冲头盘", "sphere", transportColors.dark, [0, .3, .48], [.5, .49, .1]), ring("承力管前口刮尘密封环", transportColors.trim, .15, .035, 0, .055, { position: { x: 0, y: .3, z: .08 }, rotation: { x: 90, y: 0, z: 0 } })];
    for (const side of [-1, 1]) for (const level of [-1, 1]) parts.push(cylinder("安装板固定螺栓头", [side * .145, .3 + level * .21, -.48], [.065, .06, .065], transportColors.trim, [90, 0, 0]));
    for (const z of [-.32, -.24, -.16, -.08, 0]) parts.push(ring("承力管外加固环箍", transportColors.body, .19, .025, 0, .025, { position: { x: 0, y: .3, z }, rotation: { x: 90, y: 0, z: 0 } }));
    for (let index = 0; index < 8; index++) parts.push(ring("承力管内部套在柱塞后端的橡胶储能环簧", transportColors.dark, .137, .045, 0, .035, { position: { x: 0, y: .3, z: -.33 + index * .048 }, rotation: { x: 90, y: 0, z: 0 } }));
    return parts;
  } },
  { name: "矩形风琴折棚铁路车端贯通道", theme: "现代", itemType: "构件", tags: ["车端连接走廊", "中空折棚", "跨接地板"], create: () => {
    const parts: ModelPart[] = [box("贯通道可通行跨接踏板", [0, .08, 0], [1.12, .16, 1.45], transportColors.dark)];
    for (let index = 0; index < 9; index++) {
      const z = -.64 + index * .16, width = index % 2 ? .65 : .73, top = index % 2 ? 2.1 : 2.17;
      const outline: [number, number][] = [[-width, .04], [width, .04], [width, top - .18], [width - .18, top], [-width + .18, top], [-width, top - .18]], inner: [number, number][] = [[-.55, .17], [.55, .17], [.55, 1.87], [.47, 1.97], [-.47, 1.97], [-.55, 1.87]];
      const fold = polygon("保持全高通道开口的风琴折棚肋", index === 0 || index === 8 ? transportColors.body : transportColors.dark, outline.map(([x, y]) => [x, -y]), .055, [0, 0, z], [inner.map(([x, y]) => [x, -y])]);
      fold.rotation.x = 90; parts.push(fold);
      if (index < 8) { for (const side of [-1, 1]) parts.push(box("相邻折棚肋之间连续的柔性侧膜", [side * .61, 1.03, z + .11], [.055, 1.87, .17], transportColors.dark)); parts.push(box("连续封闭顶缝的柔性棚顶膜", [0, 2.025, z + .11], [1.26, .055, .17], transportColors.dark)); }
    }
    for (const side of [-1, 1]) parts.push(strut("过道内壁连续扶手", [side * .49, 1.08, -.65], [side * .49, 1.08, .65], .032, transportColors.trim), ...[-.58, .58].map(z => strut("扶手固定至端框的短座", [side * .49, 1.08, z], [side * .64, 1.08, z], .025)));
    return parts;
  } },
  { name: "列车双储风缸空气制动分配阀组件", theme: "现代", itemType: "构件", tags: ["铁路空气制动", "副风缸与工作风缸", "分配阀管座"], create: () => {
    const parts: ModelPart[] = [box("固定在车底的独立安装架", [0, .09, 0], [1.25, .18, .94], transportColors.dark), box("分配阀三气路共用铸造管座", [.2, .36, -.28], [.43, .36, .22], transportColors.body), cylinder("分配阀主活塞竖直阀体", [.2, .67, -.28], [.24, .4, .24], transportColors.body), cylinder("阀体上盖盘", [.2, .9, -.28], [.3, .055, .3], transportColors.trim), cylinder("缓解阀横向独立阀体", [.46, .48, -.28], [.17, .29, .17], transportColors.body, [0, 0, 90]), cylinder("紧急制动侧阀室", [-.04, .48, -.28], [.17, .3, .17], transportColors.body, [90, 0, 0]), strut("外伸人工缓解拉杆", [.48, .48, -.28], [.73, .43, -.28], .024), ring("缓解拉杆末端提环", transportColors.dark, .045, .012, 0, .02, { position: { x: .75, y: .43, z: -.28 }, rotation: { x: 90, y: 0, z: 0 } })];
    for (const [x, z, radius, length] of [[-.32, .18, .17, .75], [.29, .29, .12, .55]]) {
      parts.push(part("两端封闭收圆的独立储风缸", "lathe", transportColors.body, [x!, .36, z!], [1, 1, 1], [90, 0, 0], { profile: [{ x: 0, y: -length! / 2 }, { x: radius! * .7, y: -length! * .46 }, { x: radius!, y: -length! * .35 }, { x: radius!, y: length! * .35 }, { x: radius! * .7, y: length! * .46 }, { x: 0, y: length! / 2 }] }));
      for (const end of [-1, 1]) parts.push(box("储风缸连接安装架的落地鞍座", [x!, .19, z! + end * length! * .27], [radius! * 1.7, .19, .08], transportColors.dark));
      parts.push(part("储风缸到阀座的连续制动气管", "tube", transportColors.dark, [0, 0, 0], [1, 1, 1], [0, 0, 0], { path: [{ x: x!, y: .36, z: z! - length! / 2 }, { x: x!, y: .36, z: -.39 }, { x: .2, y: .36, z: -.43 }, { x: .2, y: .36, z: -.37 }], radius: .018 }));
    }
    parts.push(ring("列车管输入接头的真实通气孔", transportColors.trim, .035, .01, 0, .07, { position: { x: .2, y: .26, z: -.43 }, rotation: { x: 90, y: 0, z: 0 } }), box("分配阀支架横向承托梁", [.2, .2, -.27], [.58, .1, .28], transportColors.dark));
    return parts;
  } },
];
