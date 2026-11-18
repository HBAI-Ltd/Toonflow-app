import { beam, part, ring, type ModelPart, type Triple } from "../assetModelParts";
import { polygon } from "../masterNature/shared";
import { box, cylinder, strut, transportColors, helicalFlight, type TransportDefinition } from "./parts";

function pipe(name: string, start: Triple, end: Triple, radius: number, wall: number, color = transportColors.body): ModelPart {
  const value = beam(name, color, start, end, 1), half = value.scale.y / 2;
  value.shape = "lathe";
  value.scale = { x: 1, y: 1, z: 1 };
  value.profile = [{ x: radius, y: -half }, { x: radius, y: half }, { x: radius - wall, y: half }, { x: radius - wall, y: -half }, { x: radius, y: -half }];
  return value;
}

function volute(z: number, color: string): ModelPart {
  const vertices: { x: number; y: number; z: number }[] = [], indices: number[] = [];
  for (let step = 0; step <= 14; step++) {
    const angle = (-50 + step / 14 * 330) * Math.PI / 180, radius = 0.024 + step / 14 * 0.022;
    for (const wall of [0, 0.006]) for (let side = 0; side < 8; side++) {
      const a = side * Math.PI / 4, r = radius - wall;
      vertices.push({ x: Math.cos(angle) * (0.09 + Math.cos(a) * r), y: 0.13 + Math.sin(angle) * (0.09 + Math.cos(a) * r), z: z + Math.sin(a) * r });
    }
    if (step) for (let side = 0; side < 8; side++) {
      const a = (step - 1) * 16 + side, b = step * 16 + side, c = (step - 1) * 16 + (side + 1) % 8, d = step * 16 + (side + 1) % 8;
      indices.push(a, b, c, c, b, d, a + 8, c + 8, b + 8, c + 8, d + 8, b + 8);
    }
  }
  for (let side = 0; side < 8; side++) {
    const next = (side + 1) % 8, last = 14 * 16;
    indices.push(side, next, side + 8, next, next + 8, side + 8, last + side, last + side + 8, last + next, last + next, last + side + 8, last + next + 8);
  }
  return part("截面渐增且保留真实管腔的蜗壳流道", "mesh", color, [0, 0, 0], [1, 1, 1], [0, 0, 0], { vertices, indices });
}

function circle(radius: number, count: number, x = 0, z = 0): [number, number][] {
  return Array.from({ length: count }, (_, index) => { const angle = index * Math.PI * 2 / count; return [x + Math.cos(angle) * radius, z + Math.sin(angle) * radius]; });
}

// 涡轮增压与点火类别参考生产商公开的工作原理，几何为自制简化造型。
// https://www.garrettmotion.com/de/turbocharger-technology/how-a-turbo-works/basic/
// https://www.bosch-mobility.com/en/solutions/ignition/spark-plug/
export const roadExpansionBatchTwo: TransportDefinition[] = [
  { name: "端口贯通式汽车椭圆排气消声器", theme: "现代", itemType: "构件", tags: ["汽车排气", "消声器", "中空消声罐"], create: () => {
    const body = part("两端收口的椭圆薄壁罐壳", "lathe", transportColors.body, [0, 0.11, 0], [1.35, 1, 0.8], [90, 0, 0], { profile: [{ x: 0.09, y: -0.27 }, { x: 0.11, y: -0.23 }, { x: 0.11, y: 0.23 }, { x: 0.09, y: 0.27 }, { x: 0.081, y: 0.27 }, { x: 0.101, y: 0.22 }, { x: 0.101, y: -0.22 }, { x: 0.081, y: -0.27 }, { x: 0.09, y: -0.27 }] });
    const parts: ModelPart[] = [body, pipe("从前端开孔插入的排气接管", [0, 0.11, -0.38], [0, 0.11, -0.25], 0.026, 0.004), pipe("从后端开孔伸出的尾管接头", [0, 0.11, 0.25], [0, 0.11, 0.39], 0.026, 0.004), pipe("罐内连接两接管的中心导流管", [0, 0.11, -0.26], [0, 0.11, 0.26], 0.025, 0.003)];
    for (const z of [-0.27, 0.26]) {
      const cap = polygon("椭圆罐端面与圆形接管匹配的真实通孔盖板", transportColors.body, circle(0.09, 24).map(([x, y]) => [x * 1.35, y * 0.8]), 0.01, [0, 0.11, z], [circle(0.026, 16)]);
      cap.rotation.x = 90;
      parts.push(cap);
    }
    for (const z of [-0.15, 0.15]) parts.push(part("包过罐壳并回到悬挂杆的压带", "tube", transportColors.dark, [0, 0, 0], [1, 1, 1], [0, 0, 0], { radius: 0.005, path: [{ x: -0.12, y: 0.2, z }, { x: -0.15, y: 0.12, z }, { x: -0.1, y: 0.035, z }, { x: 0.1, y: 0.035, z }, { x: 0.15, y: 0.12, z }, { x: 0.12, y: 0.2, z }] }), strut("连接车底橡胶吊耳的悬挂短杆", [0.12, 0.2, z], [0.21, 0.25, z], 0.012), ring("排气吊耳的贯通橡胶环", transportColors.dark, 0.025, 0.008, 0, 0.015, { position: { x: 0.215, y: 0.25, z }, rotation: { x: 90, y: 0, z: 0 } }));
    return parts;
  } },
  { name: "双蜗壳共轴废气涡轮增压器", theme: "现代", itemType: "构件", tags: ["涡轮增压器", "共轴压气机", "切向蜗壳"], create: () => {
    const parts: ModelPart[] = [volute(-0.075, transportColors.body), volute(0.075, transportColors.dark), cylinder("连接热端与冷端的轴承中间体", [0, 0.13, 0], [0.09, 0.15, 0.09], transportColors.trim, [90, 0, 0]), pipe("冷端轴向空气入口", [0, 0.13, -0.08], [0, 0.13, -0.18], 0.055, 0.008), pipe("热端轴向排气出口", [0, 0.13, 0.08], [0, 0.13, 0.18], 0.055, 0.008), pipe("冷端蜗壳末端切向压气出口", [0.0156, 0.0414, -0.075], [0.13, 0.0615, -0.075], 0.046, 0.006), pipe("热端蜗壳切向废气入口", [0.0156, 0.0414, 0.075], [0.13, 0.0615, 0.075], 0.046, 0.006), cylinder("贯通两端叶轮的连接轴", [0, 0.13, 0], [0.013, 0.27, 0.013], transportColors.trim, [90, 0, 0])];
    for (const side of [-1, 1]) {
      parts.push(ring("封接蜗壳与轴向入口的中空侧盖", side < 0 ? transportColors.body : transportColors.dark, 0.095, 0.043, 0, 0.012, { position: { x: 0, y: 0.13, z: side * 0.11 }, rotation: { x: 90, y: 0, z: 0 } }));
      for (let index = 0; index < 7; index++) { const angle = index * Math.PI * 2 / 7; parts.push(box("轴向入口内可见的扫掠叶片", [Math.cos(angle) * 0.027, 0.13 + Math.sin(angle) * 0.027, side * 0.12], [0.013, 0.055, 0.005], transportColors.trim, [side * 18, 0, index * 360 / 7 - 90])); }
    }
    parts.push(pipe("轴承中间体润滑供油短口", [0, 0.17, 0], [0, 0.23, 0], 0.012, 0.004), box("涡轮轴承体下安装足", [0, 0.076, 0], [0.1, 0.024, 0.08]));
    return parts;
  } },
  { name: "膜片弹簧式单片干式汽车离合器", theme: "现代", itemType: "构件", tags: ["干式离合器", "膜片弹簧", "摩擦从动盘"], create: () => {
    const parts: ModelPart[] = [ring("两侧摩擦片的中空从动圆盘", transportColors.dark, 0.115, 0.076, 0, 0.014, { position: { x: 0, y: 0.14, z: -0.026 }, rotation: { x: 90, y: 0, z: 0 } }), ring("把摩擦环传力至花键毂的薄从动盘腹板", transportColors.body, 0.077, 0.054, 0, 0.004, { position: { x: 0, y: 0.14, z: -0.026 }, rotation: { x: 90, y: 0, z: 0 } }), ring("压紧从动片的环形压盘", transportColors.body, 0.125, 0.043, 0, 0.022, { position: { x: 0, y: 0.14, z: 0.001 }, rotation: { x: 90, y: 0, z: 0 } }), ring("与飞轮连接的外缘压盖圈", transportColors.body, 0.138, 0.013, 0, 0.015, { position: { x: 0, y: 0.14, z: 0.045 }, rotation: { x: 90, y: 0, z: 0 } }), pipe("从动盘中央贯通花键毂", [0, 0.14, -0.065], [0, 0.14, 0.055], 0.028, 0.009, transportColors.trim)];
    for (let index = 0; index < 12; index++) {
      const angle = index * Math.PI / 6;
      parts.push(beam("留有径向缝隙的膜片弹簧指", transportColors.trim, [Math.cos(angle) * 0.103, 0.14 + Math.sin(angle) * 0.103, 0.043], [Math.cos(angle) * 0.031, 0.14 + Math.sin(angle) * 0.031, 0.078], 0.012, 0.004));
      if (index % 2 === 0) parts.push(beam("压盖外圈至压盘的折弯承力桥", transportColors.body, [Math.cos(angle) * 0.13, 0.14 + Math.sin(angle) * 0.13, 0.045], [Math.cos(angle) * 0.105, 0.14 + Math.sin(angle) * 0.105, 0.015], 0.024, 0.008));
    }
    return parts;
  } },
  { name: "螺纹中央口旋装式机油滤清器", theme: "现代", itemType: "构件", tags: ["旋装机滤", "环列进油孔", "机油过滤"], create: () => {
    const holes = [circle(0.009, 12), ...Array.from({ length: 6 }, (_, index) => { const angle = index * Math.PI / 3; return circle(0.004, 6, Math.cos(angle) * 0.026, Math.sin(angle) * 0.026); })];
    return [part("下端封闭而上端容纳滤芯的薄壁钢罐", "lathe", transportColors.signal, [0, 0, 0], [1, 1, 1], [0, 0, 0], { profile: [{ x: 0, y: 0 }, { x: 0.032, y: 0 }, { x: 0.043, y: 0.012 }, { x: 0.043, y: 0.08 }, { x: 0.037, y: 0.087 }, { x: 0.037, y: 0.079 }, { x: 0.038, y: 0.075 }, { x: 0.038, y: 0.014 }, { x: 0.028, y: 0.008 }, { x: 0, y: 0.008 }] }), polygon("具有中央出油孔和六个真实进油孔的底板", transportColors.body, circle(0.037, 24), 0.004, [0, 0.084, 0], holes), ring("安装面外环密封橡胶圈", transportColors.dark, 0.037, 0.004, 0.09, 0.004), pipe("贯通螺纹连接口的内衬短颈", [0, 0.075, 0], [0, 0.093, 0], 0.012, 0.003, transportColors.trim), ...[0, 1, 2, 3, 4, 5].map(index => { const angle = index * Math.PI / 3; return box("罐顶卷边压接小肋", [Math.cos(angle) * 0.04, 0.081, Math.sin(angle) * 0.04], [0.007, 0.014, 0.007], transportColors.body, [0, -index * 60, 0]); })];
  } },
  { name: "蜡式双阀盘汽车冷却节温器", theme: "现代", itemType: "构件", tags: ["发动机节温器", "热敏蜡芯", "旁通阀盘"], create: () => {
    const parts: ModelPart[] = [ring("卡在水道壳间的开放定位法兰", transportColors.body, 0.028, 0.007, 0.071, 0.004), cylinder("主水道阀门的独立平阀盘", [0, 0.055, 0], [0.044, 0.004, 0.044]), cylinder("可随热胀伸缩的中央蜡芯筒", [0, 0.036, 0], [0.015, 0.033, 0.015], transportColors.trim), cylinder("连接主阀与旁通盘的细杆", [0, 0.035, 0], [0.004, 0.067, 0.004]), cylinder("下部小旁通阀盘", [0, 0.004, 0], [0.024, 0.005, 0.024]), part("围住蜡芯的连续压缩回位弹簧", "tube", transportColors.dark, [0, 0, 0], [1, 1, 1], [0, 0, 0], { radius: 0.0012, path: Array.from({ length: 41 }, (_, index) => { const angle = index / 40 * Math.PI * 10; return { x: Math.cos(angle) * 0.01, y: 0.018 + index / 40 * 0.034, z: Math.sin(angle) * 0.01 }; }) })];
    for (let index = 0; index < 3; index++) { const angle = index * Math.PI * 2 / 3; parts.push(strut("法兰至蜡芯下座的开放笼架", [Math.cos(angle) * 0.023, 0.071, Math.sin(angle) * 0.023], [Math.cos(angle) * 0.009, 0.014, Math.sin(angle) * 0.009], 0.003)); }
    parts.push(cylinder("三根笼架共同承托蜡芯的下环座", [0, 0.014, 0], [0.022, 0.004, 0.022]));
    return parts;
  } },
  { name: "陶瓷绝缘侧电极螺纹火花塞", theme: "现代", itemType: "构件", tags: ["火花塞", "螺纹壳体", "放电间隙"], create: () => {
    const profile = [{ x: 0.007, y: 0.028 }, ...Array.from({ length: 10 }, (_, index) => ({ x: index % 2 ? 0.007 : 0.009, y: 0.031 + index * 0.0035 })), { x: 0.006, y: 0.069 }, { x: 0.005, y: 0.071 }];
    const thread = helicalFlight([0, 0.002, 0], 0.0062, 0.0072, 0.019, 6, 1, 0.001);
    return [cylinder("螺纹下方带孔绝缘芯的金属壳", [0, 0.012, 0], [0.0125, 0.022, 0.0125], transportColors.body), thread, part("供套筒夹持的六角扳手位", "extrude", transportColors.body, [0, 0.026, 0], [1, 1, 1], [-90, 0, 0], { depth: 0.011, profile: circle(0.011, 6).map(([x, y]) => ({ x, y })) }), part("带连续防爬电肋的陶瓷绝缘柱", "lathe", transportColors.trim, [0, 0, 0], [1, 1, 1], [0, 0, 0], { profile: [...profile, { x: 0, y: 0.071 }, { x: 0, y: 0.028 }] }), cylinder("高压导线连接端子", [0, 0.077, 0], [0.006, 0.013, 0.006]), cylinder("下端中央细点火电极", [0, -0.001, 0], [0.002, 0.006, 0.002], transportColors.trim), strut("从螺纹壳沿侧面伸下的搭铁电极", [0.006, 0.004, 0], [0.006, -0.0065, 0], 0.0018), strut("弯到中央电极下方并留放电间隙的地电极", [0.006, -0.0065, 0], [0, -0.0065, 0], 0.0018)];
  } },
  { name: "四拐五主轴颈汽车曲轴", theme: "现代", itemType: "构件", tags: ["发动机曲轴", "偏置连杆轴颈", "整体平衡重"], create: () => {
    const parts: ModelPart[] = [];
    for (const z of [-0.24, -0.12, 0, 0.12, 0.24]) parts.push(cylinder("位于共同旋转轴线的主轴颈", [0, 0.12, z], [0.05, 0.055, 0.05], transportColors.body, [90, 0, 0]));
    for (let index = 0; index < 4; index++) {
      const z = -0.18 + index * 0.12, side = index === 0 || index === 3 ? 1 : -1;
      parts.push(cylinder("偏离主轴线的独立连杆轴颈", [0, 0.12 + side * 0.06, z], [0.045, 0.055, 0.045], transportColors.trim, [90, 0, 0]));
      for (const end of [-1, 1]) parts.push(part("连接主轴颈与偏心销并带反侧平衡重的曲柄臂", "extrude", transportColors.dark, [0, 0.12, z + end * 0.035], [1, 1, 1], [0, 0, 0], { depth: 0.015, profile: [{ x: -0.028, y: side * 0.076 }, { x: 0.028, y: side * 0.076 }, { x: 0.032, y: 0 }, { x: 0.052, y: -side * 0.05 }, { x: 0.038, y: -side * 0.078 }, { x: -0.038, y: -side * 0.078 }, { x: -0.052, y: -side * 0.05 }, { x: -0.032, y: 0 }] }));
    }
    parts.push(cylinder("曲轴前端正时传动鼻轴", [0, 0.12, -0.3], [0.03, 0.085, 0.03], transportColors.body, [90, 0, 0]), cylinder("后主轴颈连接飞轮法兰的短轴", [0, 0.12, 0.275], [0.045, 0.05, 0.045], transportColors.body, [90, 0, 0]), cylinder("后端飞轮安装法兰", [0, 0.12, 0.293], [0.11, 0.035, 0.11], transportColors.body, [90, 0, 0]));
    for (let index = 0; index < 6; index++) { const angle = index * Math.PI / 3; parts.push(cylinder("飞轮法兰定位短螺柱", [Math.cos(angle) * 0.04, 0.12 + Math.sin(angle) * 0.04, 0.316], [0.007, 0.018, 0.007], transportColors.trim, [90, 0, 0])); }
    return parts;
  } },
  { name: "内空裙部活塞连杆总成", theme: "现代", itemType: "构件", tags: ["汽车活塞连杆", "活塞环槽", "连杆大小头"], create: () => {
    const parts: ModelPart[] = [part("封闭顶冠与下端开放的薄壁活塞裙", "lathe", transportColors.body, [0, 0, 0], [1, 1, 1], [0, 0, 0], { profile: [{ x: 0.041, y: 0.23 }, { x: 0.041, y: 0.3 }, { x: 0.039, y: 0.31 }, { x: 0, y: 0.31 }, { x: 0, y: 0.302 }, { x: 0.035, y: 0.297 }, { x: 0.035, y: 0.23 }, { x: 0.041, y: 0.23 }] }), ring("连杆大头的真正曲轴销孔", transportColors.dark, 0.038, 0.01, 0, 0.025, { position: { x: 0, y: 0.066, z: 0 }, rotation: { x: 90, y: 0, z: 0 } }), ring("连杆小头的真正活塞销孔", transportColors.trim, 0.016, 0.006, 0, 0.023, { position: { x: 0, y: 0.265, z: 0 }, rotation: { x: 90, y: 0, z: 0 } }), box("连杆I形中部的薄腹板", [0, 0.166, 0], [0.018, 0.165, 0.008], transportColors.body), ...[-1, 1].map(side => box("连杆I形截面的侧向加强翼", [side * 0.012, 0.166, 0], [0.006, 0.165, 0.018], transportColors.body)), pipe("裙部内部贯通连杆小头的活塞销", [0, 0.265, -0.034], [0, 0.265, 0.034], 0.009, 0.003, transportColors.trim)];
    for (const y of [0.283, 0.293]) parts.push(ring("与活塞外径贴合的独立压缩环", transportColors.dark, 0.0418, 0.003, y, 0.002));
    parts.push(ring("活塞下方刮油环", transportColors.dark, 0.0418, 0.003, 0.274, 0.003));
    for (const side of [-1, 1]) parts.push(cylinder("大头轴承盖连接螺杆", [side * 0.03, 0.052, 0], [0.006, 0.053, 0.006], transportColors.trim), box("连杆大头分体轴承盖的外侧连接耳", [side * 0.03, 0.055, 0], [0.016, 0.018, 0.025], transportColors.body));
    return parts;
  } },
  { name: "偏心蛋形凸轮配气凸轮轴", theme: "现代", itemType: "构件", tags: ["配气凸轮轴", "蛋形凸轮", "气门驱动"], create: () => {
    const parts: ModelPart[] = [cylinder("贯穿全部配气凸轮的中心轴杆", [0, 0.06, 0], [0.025, 0.51, 0.025], transportColors.dark, [90, 0, 0])];
    for (let index = 0; index < 8; index++) parts.push(part("有基圆和突出桃尖的偏心配气凸轮", "extrude", transportColors.body, [0, 0.06, -0.2 + index * 0.057], [1, 1, 1], [0, 0, [20, 110, 200, 290, 290, 200, 110, 20][index]!], { depth: 0.014, profile: [{ x: -0.014, y: -0.017 }, { x: 0.014, y: -0.017 }, { x: 0.021, y: -0.005 }, { x: 0.019, y: 0.014 }, { x: 0.012, y: 0.035 }, { x: 0, y: 0.043 }, { x: -0.012, y: 0.035 }, { x: -0.019, y: 0.014 }, { x: -0.021, y: -0.005 }] }));
    for (const z of [-0.245, 0, 0.245]) parts.push(cylinder("支承凸轮轴的光滑轴颈", [0, 0.06, z], [0.038, 0.02, 0.038], transportColors.trim, [90, 0, 0]));
    parts.push(cylinder("正时轮安装鼻轴", [0, 0.06, -0.282], [0.023, 0.065, 0.023], transportColors.body, [90, 0, 0]), box("正时轮定位用外露平键", [0, 0.073, -0.285], [0.006, 0.006, 0.025], transportColors.trim));
    return parts;
  } },
];
