import { part, ring, type ModelPart, type Triple } from "../assetModelParts";
import { fuselage, propeller, tail } from "./aircraftModels";
import { ball, box, cylinder, strut, surface, transportColors, wheel, type TransportDefinition } from "./parts";

export function airfoil(name: string, span: number, chord: number, position: Triple, rotation: Triple = [0, 90, 0]): ModelPart {
  return part(name, "extrude", transportColors.trim, position, [1, 1, 1], rotation, {
    depth: span,
    profile: [[0.5, 0], [0.3, 0.065], [-0.05, 0.075], [-0.5, 0.012], [-0.5, -0.012], [-0.05, -0.03], [0.3, -0.025]].map(([x, y]) => ({ x: x! * chord, y: y! * chord })),
  });
}

export function smallGear(mains: Triple[], nose: Triple, radius = 0.22): ModelPart[] {
  return [...mains, nose].flatMap(([x, top, z]) => [strut("机体至轮叉的缓冲支柱", [x, top, z], [x, radius, z], 0.07), ...wheel([x, radius, z], radius, 0.11)]);
}

function shiftedFuselage(x: number, length: number, diameter: number, y: number): ModelPart {
  const result = fuselage(length, diameter, y);
  result.position.x = x;
  return result;
}

function curvedTrack(name: string, x: number, points: [number, number][]): ModelPart {
  return part(name, "tube", transportColors.dark, [0, 0, 0], [1, 1, 1], [0, 0, 0], { radius: 0.018, path: points.map(([y, z]) => ({ x, y, z })) });
}

// 依据公开构型原理原创简化，不复刻品牌外观或声明制造尺寸。
// https://www.nasa.gov/reference/ad-1/
// https://www.si.edu/object/nasm_A19610120000
// https://www.nasa.gov/wp-content/uploads/2015/03/Cave_of_the_Winds_pdf.pdf
// https://www.faa.gov/sites/faa.gov/files/regulations_policies/handbooks_manuals/aviation/helicopter_flying_handbook/hfh_ch04.pdf
// https://www.faa.gov/documentlibrary/media/advisory_circular/ac_65-15a.pdf
export const aerospaceExpansionBatchOne: TransportDefinition[] = [
  { name: "整体偏转单斜翼研究飞机", theme: "现代", tags: ["单斜翼", "非对称后掠", "中央机翼转轴"], create: () => {
    const mainWing = airfoil("跨过机身的连续可偏转承力翼", 10.4, 1.15, [0, 1.62, -0.1]);
    mainWing.rotation.y = 128;
    const parts: ModelPart[] = [fuselage(8.4, 0.76, 1.25), mainWing, cylinder("单片主翼中央垂直回转轴承", [0, 1.55, -0.1], [0.48, 0.24, 0.48], transportColors.dark), ball("前置单座透明舱盖", [0, 1.64, -2.05], [0.62, 0.5, 1.4], transportColors.glass), ...tail(3.3, 1.4, 2.4), ...smallGear([[-0.68, 1.22, 0.6], [0.68, 1.22, 0.6]], [0, 1.15, -2.35])];
    for (const side of [-1, 1]) parts.push(part("后体两侧贯通小喷气短舱", "lathe", transportColors.dark, [side * 0.58, 1.16, 1.15], [1, 1, 1], [90, 0, 0], { profile: [{ x: 0.22, y: -0.68 }, { x: 0.23, y: 0.3 }, { x: 0.16, y: 0.65 }, { x: 0.125, y: 0.65 }, { x: 0.195, y: 0.27 }, { x: 0.185, y: -0.68 }, { x: 0.22, y: -0.68 }] }), strut("喷气短舱侧向悬挂梁", [side * 0.26, 1.2, 1.1], [side * 0.58, 1.2, 1.1], 0.1));
    return parts;
  } },
  { name: "低展弦比圆盘翼双桨试验飞机", theme: "现代", tags: ["圆盘翼", "低展弦比", "翼端大直径螺旋桨"], create: () => {
    const parts: ModelPart[] = [part("翼身合一的厚圆盘升力面", "lathe", transportColors.body, [0, 1.95, 0], [1, 1, 1.12], [0, 0, 0], { profile: [{ x: 0, y: -0.17 }, { x: 1.9, y: -0.14 }, { x: 3.5, y: -0.035 }, { x: 3.6, y: 0 }, { x: 2.7, y: 0.16 }, { x: 0.9, y: 0.27 }, { x: 0, y: 0.29 }] }), ball("圆盘前部独立驾驶舱泡", [0, 2.37, -1.55], [0.92, 0.7, 1.42], transportColors.glass), ...smallGear([[-2.4, 1.92, -0.65], [2.4, 1.92, -0.65]], [0, 1.95, 2.85], 0.28)];
    for (const side of [-1, 1]) parts.push(cylinder("伸向翼端大桨的动力轴罩", [side * 2.5, 2.05, -1.55], [0.38, 2.4, 0.38], transportColors.body, [90, 0, 0]), ...propeller(side * 2.5, 2.05, -2.83, 1.5), airfoil("圆盘后缘分置升降面", 1.9, 0.8, [side * 2.15, 2.07, 3.1]), surface("后缘双垂直稳定鳍", transportColors.signal, [[0, 0, -0.5], [0, 1.1, 0.2], [0, 0, 0.75]], [0, 1, 2], [side * 1.55, 2.1, 2.35]));
    return parts;
  } },
  { name: "半圆槽翼后置螺旋桨试验飞机", theme: "现代", tags: ["槽翼", "半圆开放翼槽", "后置螺旋桨"], create: () => {
    const parts: ModelPart[] = [fuselage(6.1, 0.85, 1.55), ball("中部双座透明座舱罩", [0, 1.98, -1.15], [0.75, 0.7, 1.6], transportColors.glass), ...tail(2.4, 1.7, 2.6), airfoil("机身至半圆槽内缘的中央翼段", 1.35, 1.65, [0, 1.8, 0]), ...smallGear([[-0.7, 1.5, 0.65], [0.7, 1.5, 0.65]], [0, 1.45, -1.75], 0.23)];
    for (const side of [-1, 1]) {
      const profile = [0.87, 0.79].flatMap((radius, level) => Array.from({ length: 13 }, (_, index) => { const angle = Math.PI + (level ? 12 - index : index) * Math.PI / 12; return { x: Math.cos(angle) * radius, y: Math.sin(angle) * radius }; }));
      parts.push(part("上方敞开并有真实壁厚的半圆槽翼", "extrude", transportColors.trim, [side * 1.48, 1.8, 0], [1, 1, 1], [0, 0, 0], { profile, depth: 1.75 }), airfoil("槽口外缘至翼尖的水平翼段", 1.45, 1.4, [side * 3.05, 1.8, 0]), cylinder("置于开放槽中段的发动机短舱", [side * 1.48, 1.8, 0.14], [0.27, 1.28, 0.27], transportColors.body, [90, 0, 0]), ...propeller(side * 1.48, 1.8, 0.91, 0.69), strut("槽翼下壁至发动机的承托支柱", [side * 1.48, 0.98, 0.12], [side * 1.48, 1.71, 0.12], 0.055));
    }
    return parts;
  } },
  { name: "前后双主翼串列翼轻型飞机", theme: "现代", tags: ["串列翼", "前后两组主升力翼", "无独立小平尾"], create: () => [fuselage(4.8, 0.7, 1.32), airfoil("机头后方低位前主翼", 4.8, 0.92, [0, 1.25, -1.18]), airfoil("机体后段高位后主翼", 5.6, 1.1, [0, 1.73, 1.15]), ball("两翼间的透明飞行座舱", [0, 1.75, -0.08], [0.58, 0.67, 1.24], transportColors.glass), cylinder("前拉式活塞发动机整流罩", [0, 1.35, -2.02], [0.55, 0.56, 0.55], transportColors.body, [90, 0, 0]), ...propeller(0, 1.35, -2.48, 0.83), surface("机体末端垂直方向舵", transportColors.signal, [[0, 0, -0.45], [0, 0.92, 0.1], [0, 0, 0.65]], [0, 1, 2], [0, 1.4, 1.95]), ...[-1, 1].map(side => strut("机身至高位后翼的斜撑", [side * 0.27, 1.4, 0.7], [side * 1.8, 1.73, 1.15], 0.035)), ...smallGear([[-0.65, 1.25, 0.5], [0.65, 1.25, 0.5]], [0, 1.25, -1.72], 0.2)] },
  { name: "双完整机身中央连接翼运载飞机", theme: "现代", tags: ["双机身", "横向中央承力翼", "分立座舱与尾翼"], create: () => {
    const parts: ModelPart[] = [airfoil("跨接双完整机身的连续主承力翼", 22, 3.5, [0, 3.15, -0.2]), box("中央翼下外载主挂架", [0, 2.78, 0.05], [0.9, 0.65, 2.1], transportColors.dark)];
    for (const side of [-1, 1]) {
      parts.push(shiftedFuselage(side * 4.6, 18, 1.6, 2.75), ball("各机身前端独立驾驶舱盖", [side * 4.6, 3.3, -5.9], [1.25, 0.65, 1.9], transportColors.glass), airfoil("独立机身后部水平尾翼", 4.1, 1.25, [side * 4.6, 3.0, 7.1]), surface("各机身独立垂直尾鳍", transportColors.signal, [[0, 0, -1.1], [0, 2.5, 0.75], [0, 0, 1.55]], [0, 1, 2], [side * 4.6, 2.9, 7.0]), ...smallGear([[side * 4.6 - 0.85, 2.7, 1.5], [side * 4.6 + 0.85, 2.7, 1.5]], [side * 4.6, 2.65, -5.85], 0.4));
      for (const distance of [2.1, 7.6]) parts.push(part("主翼下方贯通涡扇短舱", "lathe", transportColors.dark, [side * distance, 2.3, -0.8], [1, 1, 1], [90, 0, 0], { profile: [{ x: 0.5, y: -1.7 }, { x: 0.58, y: -0.8 }, { x: 0.5, y: 1.1 }, { x: 0.34, y: 1.6 }, { x: 0.28, y: 1.6 }, { x: 0.43, y: 1.05 }, { x: 0.5, y: -0.8 }, { x: 0.43, y: -1.7 }, { x: 0.5, y: -1.7 }] }), strut("翼梁至发动机的垂直吊挂支架", [side * distance, 3.1, -0.5], [side * distance, 2.68, -0.5], 0.19));
    }
    return parts;
  } },
  { name: "偏置透明观察舱不对称侦察飞机", theme: "现代", tags: ["不对称飞机", "偏置完整观察舱", "动力尾身与乘员舱分离"], create: () => {
    const parts: ModelPart[] = [shiftedFuselage(-1.25, 6.8, 0.9, 1.6), airfoil("贯穿动力尾身与观察舱的整幅主翼", 10.5, 1.8, [0, 1.55, 0]), part("右侧完整透明观察座舱", "capsule", transportColors.glass, [1.1, 1.73, -0.4], [1.5, 4.1, 1.6], [90, 0, 0], { opacity: 0.48 }), box("透明舱内独立座席地板", [1.1, 1.33, -0.4], [1.02, 0.08, 2.7], transportColors.dark), ...[-1.0, 0.25].map(z => box("观察员独立座位", [1.1, 1.55, z], [0.48, 0.4, 0.55], transportColors.body)), ...propeller(-1.25, 1.6, -3.53, 1.1), airfoil("尾身左侧单边水平安定面", 2.6, 0.92, [-2.55, 1.77, 2.7]), surface("动力尾身后的垂直尾鳍", transportColors.signal, [[0, 0, -0.65], [0, 1.25, 0.2], [0, 0, 0.95]], [0, 1, 2], [-1.25, 1.76, 2.65]), ...smallGear([[-2.6, 1.55, 0.2], [2.65, 1.55, 0.2]], [-1.25, 1.55, 2.8], 0.25)];
    for (const z of [-1.15, -0.4, 0.35]) parts.push(part("透明舱环向金属框", "lathe", transportColors.dark, [1.1, 1.73, z], [1, 1, 1.05], [90, 0, 0], { profile: [{ x: 0.365, y: -0.014 }, { x: 0.38, y: -0.014 }, { x: 0.38, y: 0.014 }, { x: 0.365, y: 0.014 }, { x: 0.365, y: -0.014 }] }));
    return parts;
  } },
  { name: "直升机总距周期变距双环斜盘", theme: "现代", itemType: "构件", tags: ["旋翼控制", "固定环与旋转环", "球铰与变距拉杆"], create: () => {
    const parts: ModelPart[] = [ring("套住主旋翼轴的下安装法兰", transportColors.body, 0.19, 0.06, 0.035, 0.07), ring("供主轴穿过的中空滑动套筒", transportColors.dark, 0.12, 0.025, 0.2, 0.27), ring("相对机身不旋转的下斜盘", transportColors.body, 0.34, 0.16, 0.34, 0.045, { rotation: { x: 8, y: 0, z: 0 } }), ring("跟随桨轴旋转的上斜盘", transportColors.trim, 0.32, 0.14, 0.4, 0.04, { rotation: { x: 8, y: 0, z: 0 } }), ring("斜盘中心球铰通孔套", transportColors.dark, 0.145, 0.025, 0.365, 0.075)];
    for (let index = 0; index < 3; index++) {
      const angle = index * Math.PI * 2 / 3, x = Math.cos(angle), z = Math.sin(angle), low: Triple = [x * 0.28, 0.34 - z * 0.04, z * 0.28], high: Triple = [x * 0.25, 0.41 - z * 0.035, z * 0.25];
      parts.push(strut("机身液压伺服器至固定斜盘的推拉杆", [x * 0.29, 0.08, z * 0.29], low, 0.018), ball("固定环控制球铰", low, [0.036, 0.036, 0.036], transportColors.dark), strut("旋转斜盘至桨根变距摇臂的拉杆", high, [x * 0.33, 0.76, z * 0.33], 0.014), ball("旋转环拉杆球铰", high, [0.03, 0.03, 0.03], transportColors.dark));
    }
    parts.push(strut("防止下斜盘绕轴旋转的固定叉下臂", [0.22, 0.08, 0], [0.43, 0.21, 0], 0.024), strut("防转固定叉上臂", [0.43, 0.21, 0], [0.33, 0.34, 0], 0.024));
    return parts;
  } },
  { name: "三自由度铰接式主旋翼桨毂", theme: "现代", itemType: "构件", tags: ["旋翼桨毂", "挥舞铰", "摆振铰", "变距轴承"], create: () => {
    const parts: ModelPart[] = [ring("主旋翼安装底法兰", transportColors.dark, 0.21, 0.1, 0.04, 0.08), cylinder("传递发动机扭矩的竖直主桅", [0, 0.28, 0], [0.16, 0.48, 0.16], transportColors.body), cylinder("三臂桨毂中央承力头", [0, 0.53, 0], [0.4, 0.14, 0.4], transportColors.dark)];
    for (let index = 0; index < 3; index++) {
      const a = index * Math.PI * 2 / 3, x = Math.cos(a), z = Math.sin(a);
      const at = (radius: number, y = 0.53): Triple => [x * radius, y, z * radius];
      parts.push(strut("桨毂中央至摆振铰的承力臂", at(0.12), at(0.32), 0.1), cylinder("允许桨根前后摆振的竖直铰销", at(0.32), [0.09, 0.22, 0.09], transportColors.trim), strut("摆振铰至挥舞铰的短接头", at(0.32), at(0.46), 0.09), cylinder("切向设置的水平挥舞铰销", at(0.46), [0.075, 0.23, 0.075], transportColors.trim, [0, -index * 120 + 90, 90]), cylinder("绕桨叶展向转动的变距轴承套", at(0.61), [0.16, 0.25, 0.16], transportColors.body, [0, -index * 120, 90]), ring("外端供桨梁插入的真实空心夹套", transportColors.dark, 0.105, 0.03, 0, 0.22, { position: { x: x * 0.82, y: 0.53, z: z * 0.82 }, rotation: { x: 0, y: -index * 120, z: 90 } }), strut("从轴承套偏心伸出的变距摇臂", at(0.6), [x * 0.6 - z * 0.19, 0.53, z * 0.6 + x * 0.19], 0.03), ball("供斜盘拉杆连接的末端球铰", [x * 0.6 - z * 0.19, 0.53, z * 0.6 + x * 0.19], [0.045, 0.045, 0.045], transportColors.trim));
    }
    return parts;
  } },
  { name: "后移下偏式富勒襟翼滑轨组件", theme: "现代", itemType: "构件", tags: ["富勒襟翼", "后缘增升", "滚轮曲轨与联动杆"], create: () => {
    const parts: ModelPart[] = [airfoil("包含后缘安装区的固定机翼短段", 1.6, 1.1, [0, 0.83, -0.4]), airfoil("后移下偏并与固定翼留缝的襟翼", 1.5, 0.62, [0, 0.55, 0.67], [22, 90, 0])];
    for (const x of [-0.52, 0.52]) parts.push(curvedTrack("向后逐渐下弯的襟翼承载导轨", x, [[0.69, -0.65], [0.66, -0.13], [0.59, 0.29], [0.47, 0.64], [0.37, 0.85]]), cylinder("沿曲轨滚动的承载轮", [x, 0.485, 0.6], [0.095, 0.07, 0.095], transportColors.trim, [0, 0, 90]), strut("滚轮小车连接襟翼前梁的支座", [x, 0.485, 0.6], [x, 0.64, 0.44], 0.035), strut("固定翼下的驱动缸", [x, 0.7, -0.45], [x, 0.58, 0.17], 0.055), strut("推动襟翼小车的外露活塞杆", [x, 0.58, 0.17], [x, 0.485, 0.6], 0.023), box("导轨前端固定翼梁安装块", [x, 0.73, -0.52], [0.13, 0.22, 0.15], transportColors.body));
    return parts;
  } },
  { name: "前缘缝翼弧形导轨组件", theme: "现代", itemType: "构件", tags: ["前缘缝翼", "向前下方伸出", "保持真实气流缝隙"], create: () => {
    const parts: ModelPart[] = [airfoil("前缘缝翼后方的固定机翼短段", 1.55, 1.0, [0, 0.65, 0]), part("有内外两层真实壁厚的弧形前缘缝翼", "extrude", transportColors.signal, [0, 0.58, -0.76], [1, 1, 1], [0, 90, 0], { depth: 1.5, profile: [{ x: 0.13, y: -0.07 }, { x: 0.18, y: 0 }, { x: 0.12, y: 0.07 }, { x: -0.12, y: 0.08 }, { x: -0.16, y: 0.055 }, { x: 0.09, y: 0.045 }, { x: 0.135, y: 0 }, { x: 0.1, y: -0.045 }, { x: -0.11, y: -0.055 }, { x: -0.11, y: -0.08 }] })];
    for (const x of [-0.5, 0.5]) parts.push(curvedTrack("由翼内前伸下弯的缝翼弧轨", x, [[0.55, 0.12], [0.54, -0.2], [0.5, -0.46], [0.44, -0.71]]), cylinder("弧轨端部的缝翼导向滚轮", [x, 0.445, -0.7], [0.08, 0.06, 0.08], transportColors.trim, [0, 0, 90]), strut("滚轮与缝翼内壁的短支座", [x, 0.445, -0.7], [x, 0.57, -0.76], 0.035), box("曲轨固定端承托块", [x, 0.58, 0.12], [0.13, 0.14, 0.15], transportColors.body));
    parts.push(strut("缝翼同步驱动横轴", [-0.58, 0.51, -0.05], [0.58, 0.51, -0.05], 0.025), strut("驱动曲柄与前伸连杆", [0, 0.51, -0.05], [0, 0.5, -0.67], 0.025));
    return parts;
  } },
  { name: "双导轨火箭助推航空弹射座椅", theme: "现代", itemType: "构件", tags: ["航空救生座椅", "舱内导向滑轨", "束带与腿部约束"], create: () => {
    const parts: ModelPart[] = [box("弹射座椅金属座盆", [0, 0.5, -0.05], [0.5, 0.12, 0.48], transportColors.body), box("坐垫", [0, 0.58, -0.06], [0.44, 0.075, 0.43], transportColors.dark), box("后倾承力座椅背板", [0, 0.99, 0.16], [0.48, 0.88, 0.08], transportColors.body, [-9, 0, 0]), box("背部软垫", [0, 0.99, 0.1], [0.4, 0.72, 0.06], transportColors.dark, [-9, 0, 0]), box("头枕及救生伞包装舱", [0, 1.53, 0.18], [0.46, 0.3, 0.29], transportColors.body), box("头部承托软垫", [0, 1.53, 0.015], [0.32, 0.2, 0.065], transportColors.dark), part("座盆下方的中空助推喷管", "lathe", transportColors.dark, [0, 0.21, 0.12], [1, 1, 1], [0, 0, 0], { profile: [{ x: 0.08, y: -0.16 }, { x: 0.055, y: -0.06 }, { x: 0.075, y: 0.16 }, { x: 0.052, y: 0.16 }, { x: 0.036, y: -0.06 }, { x: 0.057, y: -0.16 }, { x: 0.08, y: -0.16 }] })];
    for (const side of [-1, 1]) parts.push(box("后背两侧平行导向滑轨", [side * 0.27, 0.86, 0.28], [0.055, 1.65, 0.06], transportColors.dark), ...[0.5, 1.25].map(y => box("抱住导轨的座椅滑块", [side * 0.27, y, 0.23], [0.1, 0.11, 0.08], transportColors.trim)), box("侧方手臂护板", [side * 0.27, 0.72, -0.025], [0.055, 0.32, 0.49], transportColors.body), strut("肩部双束带", [side * 0.14, 1.35, 0.035], [side * 0.06, 0.68, -0.22], 0.04, transportColors.signal), strut("连接中心扣的腰部束带", [side * 0.23, 0.65, 0.03], [side * 0.06, 0.68, -0.22], 0.035, transportColors.signal), strut("向前延伸的腿部支架", [side * 0.19, 0.46, -0.13], [side * 0.19, 0.22, -0.45], 0.035), box("下部脚跟支承踏板", [side * 0.19, 0.21, -0.46], [0.13, 0.04, 0.18], transportColors.dark));
    parts.push(cylinder("腰部束带中央扣", [0, 0.68, -0.24], [0.08, 0.03, 0.08], transportColors.trim, [90, 0, 0]), part("位于两腿间的开放救生拉环", "tube", transportColors.signal, [0, 0.62, -0.24], [1, 1, 1], [0, 0, 0], { radius: 0.012, path: [{ x: -0.07, y: 0, z: 0 }, { x: -0.06, y: 0.1, z: -0.06 }, { x: 0, y: 0.135, z: -0.07 }, { x: 0.06, y: 0.1, z: -0.06 }, { x: 0.07, y: 0, z: 0 }] }));
    return parts;
  } },
  { name: "环框纵桁半硬壳航空机身筒段", theme: "现代", itemType: "构件", tags: ["半硬壳机身", "环向框与纵向桁条", "轴向两端贯通"], create: () => {
    const parts: ModelPart[] = [part("两端完全敞开的薄壁承力蒙皮", "lathe", transportColors.body, [0, 1.2, 0], [1, 1, 1], [90, 0, 0], { profile: [{ x: 1.16, y: -1.2 }, { x: 1.16, y: 1.2 }, { x: 1.125, y: 1.2 }, { x: 1.125, y: -1.2 }, { x: 1.16, y: -1.2 }] })];
    for (const z of [-1.05, 0, 1.05]) parts.push(ring("蒙皮内部独立环向机身框", transportColors.dark, 1.13, 0.075, 0, 0.035, { position: { x: 0, y: 1.2, z }, rotation: { x: 90, y: 0, z: 0 } }));
    for (let index = 0; index < 10; index++) {
      const angle = index * Math.PI / 5, x = Math.cos(angle), y = Math.sin(angle);
      parts.push(box("沿机身轴向连接环框的角形纵桁腹板", [x * 1.08, 1.2 + y * 1.08, 0], [0.035, 0.065, 2.28], transportColors.trim, [0, 0, index * 36 - 90]), box("纵桁内侧承力缘条", [x * 1.055, 1.2 + y * 1.055, 0], [0.07, 0.02, 2.28], transportColors.trim, [0, 0, index * 36 - 90]));
    }
    return parts;
  } },
];
