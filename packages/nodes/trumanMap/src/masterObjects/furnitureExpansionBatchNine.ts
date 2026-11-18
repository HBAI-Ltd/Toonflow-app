import { Vector3 } from "three";
import { part, type ModelPart, type Triple } from "../assetModelParts";
import { box, cylinder, ball, rod, loop, cord, plate, piercedPanel, bars, material, type MasterPrototype } from "./parts";
import { sweptSeat, bowlShell } from "./furnitureExpansionBatchSeven";

export function clothPanel(name: string, points: Triple[], color: string, thickness = .004): ModelPart {
  const normal = new Vector3(...points[1]!).sub(new Vector3(...points[0]!)).cross(new Vector3(...points[2]!).sub(new Vector3(...points[0]!))).normalize().multiplyScalar(thickness / 2);
  const vertices = [-1, 1].flatMap(side => points.map(([x, y, z]) => ({ x: x + side * normal.x, y: y + side * normal.y, z: z + side * normal.z }))), indices: number[] = [], count = points.length;
  for (let index = 1; index < count - 1; index++) indices.push(count, count + index, count + index + 1, 0, index + 1, index);
  for (let index = 0; index < count; index++) {
    const next = (index + 1) % count, start = vertices.length;
    vertices.push(vertices[count + index]!, vertices[index]!, vertices[next]!, vertices[count + next]!);
    indices.push(start, start + 1, start + 2, start, start + 2, start + 3);
  }
  return part(name, "mesh", color, [0, 0, 0], [1, 1, 1], [0, 0, 0], { vertices, indices });
}

function stake(position: Triple): ModelPart[] {
  return [rod("张索末端实际插地的短钉", [position[0], 0, position[2]], [position[0], .12, position[2]], .012), loop("短钉顶部扣住拉绳的小眼", [position[0], .12, position[2]], .018, .004, [90, 0, 0])];
}

function archPath(width: number, height: number, z: number): Triple[] {
  return Array.from({ length: 9 }, (_, index): Triple => { const angle = index * Math.PI / 8; return [-Math.cos(angle) * width, .04 + Math.sin(angle) * height, z]; });
}

function hinge(x: number, y: number, z: number, diameter = .045): ModelPart {
  return cylinder("两根活动杆真正相交的横向铰销", [x, y, z], [diameter, .035, diameter], material.dark, [0, 0, 90]);
}

export const furnitureExpansionBatchNineObjects: MasterPrototype[] = [
  { name: "交杆双层圆顶睡帐", theme: "现代", itemType: "家具", build: () => {
    const tiers = [[1, .04], [.835, .9], [.49, 1.39]];
    const ringPoint = (index: number, tier: number): Triple => { const angle = index * Math.PI / 4, [radius, y] = tiers[tier]!; return [Math.cos(angle) * radius! * 1.19, y!, Math.sin(angle) * radius! * 1.37]; };
    const parts: ModelPart[] = [plate("与穹顶八角坡脚一致的独立防水盆底", [0, .025, 0], Array.from({ length: 8 }, (_, index): [number, number] => { const point = ringPoint(index, 0); return [point[0] * .97, -point[2] * .97]; }), .02, material.dark)];
    for (let index = 0; index < 8; index++) {
      for (let tier = 0; tier < 2; tier++) if (tier || index !== 5 && index !== 6) parts.push(clothPanel("在前侧让出真实门洞的外层分片雨布", [ringPoint(index, tier), ringPoint(index + 1, tier), ringPoint(index + 1, tier + 1), ringPoint(index, tier + 1)], material.red));
      parts.push(clothPanel("包住穹顶而与内帐留通气层的顶雨片", [ringPoint(index, 2), ringPoint(index + 1, 2), [0, 1.59, 0]], material.red));
    }
    for (const angle of [Math.PI / 4, Math.PI * 3 / 4]) parts.push(cord("从相对地脚交叉越过穹顶的完整弹杆", Array.from({ length: 13 }, (_, index): Triple => { const t = index * Math.PI / 12; return [Math.cos(angle) * 1.19 * Math.cos(t), .04 + Math.sin(t) * 1.55, Math.sin(angle) * 1.37 * Math.cos(t)]; }), .012));
    parts.push(cord("真正绕过敞开门口两侧和上沿的拉链框", [ringPoint(5, 0), ringPoint(5, 1), ringPoint(6, 1), ringPoint(7, 1), ringPoint(7, 0)], .009, material.ivory));
    for (const side of [-1, 1]) parts.push({ ...clothPanel("可从门口看见且不封住入口的内帐网壁", [[side * .94, .07, -.75], [side * .94, .07, .88], [side * .63, .82, .88], [side * .63, .82, -.75]], material.ivory), opacity: .18 }, rod("外帐侧绷点到地钉的张索", [side * 1.08, .27, .74], [side * 1.6, .12, .95], .004, material.ivory), ...stake([side * 1.6, .12, .95]));
    return parts;
  } },
  { name: "连续弧撑隧道睡帐", theme: "现代", itemType: "家具", build: () => {
    const front = archPath(1.07, 1.33, -1.66), rear = archPath(1.07, 1.33, 1.66);
    const parts: ModelPart[] = [box("隧道帐独立长盆底", [0, .025, 0], [2.09, .035, 3.31], material.dark), ...[-1.66, 0, 1.66].map(z => ({ ...cord("三根各自从两侧落脚的连续平行弧撑", archPath(1.09, 1.35, 0), .014), position: { x: 0, y: 0, z } }))];
    for (let index = 0; index < 8; index++) parts.push(clothPanel("两端等截面弧之间整幅连续的隧道雨布", [front[index]!, front[index + 1]!, rear[index + 1]!, rear[index]!], material.wood));
    parts.push(clothPanel("后端完整半圆封帐布", rear, material.wood));
    parts.push(clothPanel("入口左侧保留帐门的窄幅护布", [front[0]!, front[2]!, [-.54, .72, -1.66], [-.54, .04, -1.66]], material.wood), clothPanel("入口右侧保留帐门的窄幅护布", [front[6]!, front[8]!, [.54, .04, -1.66], [.54, .72, -1.66]], material.wood), clothPanel("入口上部保留通高敞口的拱帽", [front[2]!, front[3]!, front[4]!, front[5]!, front[6]!, [.54, .72, -1.66], [-.54, .72, -1.66]], material.wood));
    for (const side of [-1, 1]) parts.push(rod("沿帐体纵向对拉的端部张索", [0, 1.34, side * 1.66], [0, .12, side * 2.19], .004, material.ivory), ...stake([0, .12, side * 2.19]), cord("沿两侧下缘将三根弧撑锁在一起的织带", [[side * 1.07, .06, -1.66], [side * 1.07, .06, 0], [side * 1.07, .06, 1.66]], .008, material.dark));
    return parts;
  } },
  { name: "三角脊撑双坡睡帐", theme: "现代", itemType: "家具", build: () => [
    box("双坡睡帐从坡脚开始的通底防潮布", [0, .025, 0], [2.19, .035, 2.52], material.dark),
    ...[-1, 1].map(side => clothPanel("从脊线直接落地而没有高直侧壁的整幅坡布", [[0, 1.38, -1.29], [0, 1.38, 1.29], [side * 1.13, .04, 1.29], [side * 1.13, .04, -1.29]], material.ivory)),
    clothPanel("帐后真正封合的完整三角布面", [[-1.13, .04, 1.29], [1.13, .04, 1.29], [0, 1.38, 1.29]], material.ivory),
    ...[-1, 1].map(side => clothPanel("帐前沿斜边留住中间三角入口的门侧布", [[side * 1.13, .04, -1.29], [side * .67, .04, -1.29], [0, 1.11, -1.29], [0, 1.38, -1.29]], material.ivory)),
    ...[-1, 1].flatMap(z => [...[-1, 1].map(x => rod("门口两侧外张成真正A字而不占通道的脊撑腿", [x * 1.12, .035, z * 1.28], [0, 1.4, z * 1.28], .023)), rod("从前后脊点拉向地面的端部细张索", [0, 1.4, z * 1.28], [0, .12, z * 1.94], .004, material.wood), ...stake([0, .12, z * 1.94])]),
    rod("将前后两副A撑锁在一起的整根顶部脊杆", [0, 1.4, -1.3], [0, 1.4, 1.3], .026),
    ...[-1, 1].flatMap(x => [-1, 1].map(z => box("包住坡脚杆头的厚护布角", [x * 1.12, .05, z * 1.27], [.09, .055, .09], material.dark))),
  ] },
  { name: "分叉充气梁起居帐", theme: "现代", itemType: "家具", build: () => {
    const profile: [number, number][] = [[-1.56, .05], [-1.56, 1.33], [-1.04, 1.99], [0, 2.23], [1.04, 1.99], [1.56, 1.33], [1.56, .05]];
    const parts: ModelPart[] = [box("高直壁充气起居帐的整幅地盆", [0, .025, 0], [3.11, .04, 3.02], material.dark)];
    for (const z of [-1.48, 1.48]) {
      parts.push({ ...cord("从两侧竖直气柱连贯拱起的粗充气梁", profile.map(([x, y]): Triple => [x, y, 0]), .075, material.dark), position: { x: 0, y: 0, z } }, rod("在拱顶下方分叉支承屋脊的中央气柱", [0, 1.47, z], [0, 2.21, z], .11, material.dark));
      for (const side of [-1, 1]) parts.push(rod("中央气柱分向两肩的Y形气叉", [0, 1.47, z], [side * 1.01, 1.98, z], .1, material.dark));
    }
    for (let index = 0; index < profile.length - 1; index++) { const a = profile[index]!, b = profile[index + 1]!; parts.push(clothPanel("连接前后充气承梁的整幅起居帐围护", [[a[0], a[1], -1.48], [b[0], b[1], -1.48], [b[0], b[1], 1.48], [a[0], a[1], 1.48]], material.wood)); }
    parts.push(clothPanel("起居帐后部完整的高直壁封片", profile.map(([x, y]): Triple => [x, y, 1.48]), material.wood), clothPanel("入口上沿与帐顶间的连续肩片", [[-1.56, 1.33, -1.48], [-1.04, 1.99, -1.48], [0, 2.23, -1.48], [1.04, 1.99, -1.48], [1.56, 1.33, -1.48]], material.wood));
    for (const side of [-1, 1]) parts.push(clothPanel("门洞两边不挡通行的宽直立布侧", [[side * .65, .05, -1.48], [side * 1.56, .05, -1.48], [side * 1.56, 1.33, -1.48], [side * .65, 1.33, -1.48]], material.wood), cylinder("可见但不冒充气柱开孔的独立充气阀", [side * 1.63, .26, 1.42], [.07, .055, .07], material.red, [0, 0, 90]));
    parts.push(rod("纵贯起居空间上方而不占地的屋脊气梁", [0, 2.23, -1.48], [0, 2.23, 1.48], .1, material.dark));
    return parts;
  } },
  { name: "方底单桅张索帐", theme: "现代", itemType: "家具", build: () => {
    const apex: Triple = [0, 2.04, 0], corners: Triple[] = [[-1.27, .04, -1.27], [1.27, .04, -1.27], [1.27, .04, 1.27], [-1.27, .04, 1.27]];
    const parts: ModelPart[] = [box("方锥帐独立的方形盆底", [0, .025, 0], [2.53, .035, 2.53], material.dark), rod("只在中心承接四方坡布的单根主桅", [0, .04, 0], apex, .032), ball("单桅顶端保护雨布的圆头", apex, [.075, .075, .075], material.ivory)];
    for (let index = 1; index < 4; index++) parts.push(clothPanel("从方底边整幅收束到单顶点的三角坡布", [corners[index]!, corners[(index + 1) % 4]!, apex], material.red));
    const doorZ = -1.27 * (2.04 - 1.48) / 2;
    parts.push(clothPanel("前坡左侧让出真正可进入门洞的布片", [corners[0]!, [-.56, .04, -1.27], [0, 1.48, doorZ], apex], material.red), clothPanel("前坡右侧让出真正可进入门洞的布片", [[.56, .04, -1.27], corners[1]!, apex, [0, 1.48, doorZ]], material.red));
    for (const corner of corners) { const end: Triple = [corner[0] * 1.36, .12, corner[2] * 1.36]; parts.push(rod("四个方角分别朝外拉紧的独立张索", corner, end, .004, material.ivory), ...stake(end)); }
    parts.push(cord("沿前坡门缝从地面升向桅顶的双边拉链", [[-.56, .04, -1.27], [0, 1.48, doorZ], [.56, .04, -1.27]], .008, material.dark));
    return parts;
  } },
  { name: "三点悬台睡帐架", theme: "现代", itemType: "家具", build: () => {
    const vertices = Array.from({ length: 3 }, (_, index): Triple => { const angle = -Math.PI / 2 + index * Math.PI * 2 / 3; return [Math.cos(angle) * 1.4, .9, Math.sin(angle) * 1.4]; });
    const parts: ModelPart[] = [];
    for (let index = 0; index < 3; index++) {
      const angle = -Math.PI / 2 + index * Math.PI * 2 / 3, top: Triple = [Math.cos(angle) * 2.37, 1.56, Math.sin(angle) * 2.37], corner = vertices[index]!;
      for (const side of [-1, 1]) { const foot: Triple = [Math.cos(angle) * 2.57 + Math.cos(angle + Math.PI / 2) * side * .43, .035, Math.sin(angle) * 2.57 + Math.sin(angle + Math.PI / 2) * side * .43]; parts.push(rod("不依赖额外树木的三座双脚锚定桅架", foot, top, .055), cylinder("锚桅各脚独立的宽防陷地靴", [foot[0], .025, foot[2]], [.18, .05, .18], material.dark)); }
      parts.push(rod("平台角点到锚桅顶的真实宽张带", corner, top, .035, material.dark), clothPanel("三点边缘到下凹中心的实际承人睡网", [corner, vertices[(index + 1) % 3]!, [0, .75, 0]], material.wood, .012), rod("三角睡台每条边完整承张力的边索", corner, vertices[(index + 1) % 3]!, .02, material.dark));
      if (index) parts.push(clothPanel("在前方留入口的三角悬台雨罩", [corner, vertices[(index + 1) % 3]!, [0, 1.92, 0]], material.red));
    }
    parts.push(cord("睡台上方自承雨罩的两根交弧之一", [[vertices[1]![0], .9, vertices[1]![2]], [0, 1.94, 0], [vertices[2]![0], .9, vertices[2]![2]]], .014), cord("雨罩前部由脚角升到弧顶的短弯脊", [vertices[0]!, [0, 1.92, 0]], .014), rod("睡台前角实际可抓取的窄吊梯左边绳", [-.18, .03, -1.6], [-.18, .9, -1.088], .012, material.ivory), rod("睡台前角实际可抓取的窄吊梯右边绳", [.18, .03, -1.6], [.18, .9, -1.088], .012, material.ivory));
    for (const y of [.2, .43, .66]) parts.push(rod("在两条梯边间真正贯通的吊梯木踏棍", [-.18, y, -1.6 + (y - .03) * .512 / .87], [.18, y, -1.6 + (y - .03) * .512 / .87], .025, material.wood));
    return parts;
  } },
  { name: "弹簧回卷半壳沙滩帐", theme: "现代", itemType: "家具", build: () => {
    const front = archPath(1.08, 1.29, -.42), rear = archPath(.79, .81, .85);
    const parts: ModelPart[] = [plate("沙滩半壳帐向敞口外展开的薄防潮底", [0, .025, .07], [[-1.04, -.86], [1.04, -.86], [1.07, .31], [.79, .88], [-.79, .88], [-1.07, .31]], .015, material.dark)];
    parts.push(cord("沿开放前口再从底侧回卷成一整圈的扁弹簧框", [...front, [1.02, .04, .56], [.79, .04, .85], [-.79, .04, .85], [-1.02, .04, .56], front[0]!], .012), cord("从同一底圈弹起承住后壳的回卷弹簧弧", rear, .011));
    for (let index = 0; index < 8; index++) parts.push(clothPanel("前高后低并保持前口完全敞开的半壳遮阳片", [front[index]!, front[index + 1]!, rear[index + 1]!, rear[index]!], material.ivory));
    parts.push(clothPanel("沙滩帐后部真正闭合的圆拱护片", rear, material.ivory));
    for (const side of [-1, 1]) parts.push(box("压住两侧弹簧底圈的宽织带套", [side * .98, .045, .37], [.12, .055, .22], material.red));
    return parts;
  } },
  { name: "外翻伞毂冰钓帐", theme: "现代", itemType: "家具", build: () => {
    const parts: ModelPart[] = [box("四方冰钓帐独立的薄底盆", [0, .025, 0], [2.01, .035, 2.01], material.dark)];
    for (let wall = 1; wall < 4; wall++) {
      const angle = wall * Math.PI / 2, locate = (u: number, y: number, depth = 1): Triple => [Math.cos(angle) * u + Math.sin(angle) * depth, y, Math.sin(angle) * u - Math.cos(angle) * depth];
      const corners = [locate(-1, .04), locate(1, .04), locate(1, 1.78), locate(-1, 1.78)], hub = locate(0, .94, 1.14);
      for (let index = 0; index < 4; index++) parts.push(clothPanel("每个墙毂展开后向外鼓起的独立三角帐片", [corners[index]!, corners[(index + 1) % 4]!, hub], material.red), rod("从墙角经折肘伸向外翻伞毂的承帐杆", corners[index]!, hub, .015, material.dark));
      parts.push(ball("每面墙上真正汇合四支骨杆的独立外翻毂", hub, [.08, .08, .08], material.dark));
    }
    for (const side of [-1, 1]) parts.push(clothPanel("前方留下通高拉链门的窄直立门侧", [[side * .52, .04, -1], [side, .04, -1], [side, 1.78, -1], [side * .52, 1.78, -1]], material.red));
    parts.push(box("帐门顶部的连续压边织带", [0, 1.74, -1], [1.99, .09, .012], material.dark));
    const roof: Triple[] = [[-1, 1.78, -1], [1, 1.78, -1], [1, 1.78, 1], [-1, 1.78, 1]];
    for (let index = 0; index < 4; index++) parts.push(clothPanel("向中心高毂收合的四面帐顶", [roof[index]!, roof[(index + 1) % 4]!, [0, 2.17, 0]], material.ivory), rod("从上角支到顶毂的实际短伞骨", roof[index]!, [0, 2.17, 0], .015, material.dark));
    return parts;
  } },
  { name: "气撑蚌壳翻盖睡帐", theme: "现代", itemType: "家具", build: () => {
    const rearY = .245, frontY = 1.22, depth = 2.13, topLength = Math.hypot(depth, frontY - rearY), roofAngle = Math.atan2(frontY - rearY, depth) * 180 / Math.PI;
    const parts: ModelPart[] = [box("睡帐下壳完整封底板", [0, .095, 0], [1.42, .05, 2.21], material.dark), ...[-1, 1].flatMap(side => [box("下壳两条连续高侧沿", [side * .695, .165, 0], [.03, .14, 2.21], material.dark), box("可独立摆放的宽低位安装脚", [side * .51, .035, 0], [.14, .07, 1.83], material.steel)]), ...[-1, 1].map(side => box("下壳前后封口短沿", [0, .165, side * 1.09], [1.36, .14, .03], material.dark)), box("下壳内真正放平的完整睡垫", [0, .205, 0], [1.3, .06, 2.08], material.ivory), box("在后侧铰起的整块蚌壳顶盖", [0, (rearY + frontY) / 2, 0], [1.44, .045, topLength], material.dark, [roofAngle, 0, 0]), rod("后缘贯穿睡舱宽度的完整顶盖转轴", [-.72, rearY, depth / 2], [.72, rearY, depth / 2], .035)];
    for (const side of [-1, 1]) {
      parts.push(clothPanel("随硬顶展开并在侧方形成真实三角睡舱的帐布", [[side * .67, .24, depth / 2], [side * .67, .24, -depth / 2], [side * .67, frontY, -depth / 2], [side * .67, rearY, depth / 2]], material.wood));
      const start: Triple = [side * .62, .18, .63], end: Triple = [side * .62, 1.04, -.72], mid: Triple = [side * .62, .61, -.045];
      parts.push(rod("两侧气撑实际连接下壳的粗外缸", start, mid, .035), rod("从气撑外缸伸到上盖的细活塞杆", mid, end, .018), hinge(side * .62, .18, .63), hinge(side * .62, 1.04, -.72));
      parts.push(clothPanel("前侧门口两边保留敞口的窄幅门布", [[side * .41, .24, -depth / 2], [side * .67, .24, -depth / 2], [side * .67, frontY, -depth / 2], [side * .41, frontY, -depth / 2]], material.wood));
    }
    parts.push(box("硬顶前沿上提开舱的抓手", [0, frontY + .02, -1.09], [.26, .04, .055], material.steel));
    return parts;
  } },
  { name: "剪撑月亮兜椅", theme: "现代", itemType: "家具", build: () => {
    const rim = Array.from({ length: 16 }, (_, index): Triple => { const angle = index * Math.PI / 8; return [Math.cos(angle) * .5, .82 + Math.sin(angle) * .31, .09 + Math.sin(angle) * .3]; });
    const parts: ModelPart[] = [bowlShell("由整圈边框兜住而实际下沉的圆月软布座", [0, .42, -.035], rim, .009, material.wood), cord("贯穿全部布边套的柔性圆月口圈", [...rim, rim[0]!], .016, material.dark)];
    for (const side of [-1, 1]) parts.push(rod("从前脚交叉撑到圆月后口的长折腿", [side * .354, .025, -.33], [side * .354, 1.039, .302], .025), rod("从后脚反交叉撑到圆月前口的短折腿", [side * .354, .025, .36], [side * .354, .601, -.122], .025), hinge(side * .354, .498, -.035), ...[-.33, .36].map(z => ball("折腿末端防陷宽脚套", [side * .354, .025, z], [.07, .05, .075], material.dark)));
    parts.push(rod("连接两侧剪撑的下方同步轴", [-.354, .498, -.035], [.354, .498, -.035], .02), rod("后侧两脚之间的低位防外张联杆", [-.354, .13, .31], [.354, .13, .31], .02));
    return parts;
  } },
  { name: "联杆重力躺椅", theme: "现代", itemType: "家具", build: () => {
    const points: [number, number, number][] = [[-.94, .5, .285], [-.64, .44, .285], [-.31, .49, .285], [.07, .57, .285], [.39, .95, .285], [.59, 1.19, .27]];
    const parts: ModelPart[] = [sweptSeat("由外框弹绳张紧而将腿托和背托联为一体的躺布", points, .012, material.dark), cylinder("与倾躺背框相贴的可移圆头枕", [0, 1.155, .53], [.13, .46, .13], material.ivory, [0, 0, 90])];
    for (const side of [-1, 1]) {
      parts.push(cord("整根沿腿托和斜背连续上翻的活动躺框", points.map(([z, y]): Triple => [side * .325, y, z]), .018), rod("固定折架从前脚升起的长斜腿", [side * .34, .025, -.63], [side * .34, .73, .34], .025), rod("固定折架从后脚升起的反向短斜腿", [side * .34, .025, .66], [side * .34, .66, -.27], .025), hinge(side * .34, .47915, -.0051), box("手压即可带动连杆的平直扶手", [side * .35, .755, -.04], [.07, .035, .69], material.wood), rod("将前折腿上端实际接到扶手底面的短支颈", [side * .34, .66, -.27], [side * .34, .738, -.27], .02), rod("将后折腿上端实际接到扶手后缘的短桥", [side * .34, .73, .34], [side * .34, .74, .29], .02), rod("从扶手前端拉动腿托上翘的短连杆", [side * .34, .74, -.32], [side * .325, .47, -.49], .018), rod("扶手后端牵动斜背枢点的短连杆", [side * .34, .74, .29], [side * .325, .82, .28], .018), hinge(side * .34, .73, .34));
      for (const [z, y] of [[-.81, .474], [-.49, .463], [-.12, .53], [.24, .772], [.47, 1.046]]) parts.push(cord("由布缘绕到活动钢框的实际短弹力锁绳", [[side * .28, y!, z! - .035], [side * .329, y! - .005, z!], [side * .28, y!, z! + .035]], .004, material.ivory));
    }
    parts.push(rod("两侧腿托前端之间的完整同步横框", [-.325, .5, -.94], [.325, .5, -.94], .02), ...[-.63, .66].map(z => rod("折架两脚之间落地防张开的整幅横杆", [-.34, .025, z], [.34, .025, z], .027)));
    return parts;
  } },
  { name: "铝卷条剪撑露营桌", theme: "现代", itemType: "家具", build: () => [
    ...bars("能够从承架取下并卷起的独立铝桌条", 15, [0, .735, 0], 1.12, [.074, .022, .72], 0),
    ...[-1, 1].flatMap(side => [rod("桌条下方贯穿全宽的两根承面横梁", [-.59, .707, side * .27], [.59, .707, side * .27], .03), rod("从左地脚剪开到右上端的折合桌腿", [-.61, .02, side * .27], [.54, .7, side * .27], .027), rod("从右地脚反交到左上端的折合桌腿", [.61, .02, side * .27], [-.54, .7, side * .27], .027), cylinder("每侧剪脚交点的前后向铰销", [0, .381, side * .27], [.045, .04, .045], material.dark, [90, 0, 0]), box("逐条锁住桌条而允许卷曲的连续织带", [0, .721, side * .2], [1.18, .008, .025], material.dark)]),
    rod("连接两副剪架中铰点的同步轴", [0, .381, -.29], [0, .381, .29], .02),
    ...[-1, 1].map(side => rod("左右地脚跨接前后剪架的完整底杆", [side * .61, .02, -.29], [side * .61, .02, .29], .027)),
  ] },
  { name: "箱扣对折露营桌", theme: "现代", itemType: "家具", build: () => [
    ...[-1, 1].map(side => box("在中缝处可对合成箱体的完整半幅台面", [side * .325, .725, 0], [.646, .035, .74], material.ivory)),
    rod("贯穿两半台面连接缝的通长折叠铰轴", [0, .701, -.365], [0, .701, .365], .018),
    ...[-1, 1].flatMap(x => [-1, 1].flatMap(z => [cylinder("能够收进半桌箱底的粗外腿管", [x * .49, .515, z * .27], [.035, .37, .035]), cylinder("从外腿管伸出并插销锁长的细内腿", [x * .49, .177, z * .27], [.026, .306, .026]), cylinder("与内腿真正相接的宽脚垫", [x * .49, .016, z * .27], [.057, .032, .057], material.dark), rod("避免折腿向箱内回折的斜锁撑", [x * .49, .45, z * .27], [x * .18, .7, z * .27], .014)])),
    ...[-1, 1].map(side => rod("两根同半桌折腿共同转动的长U架横轴", [side * .49, .69, -.27], [side * .49, .69, .27], .025)),
    cord("两半桌对合后能直接提起的外置U形抓手", [[-.105, .68, -.379], [-.105, .61, -.4], [.105, .61, -.4], [.105, .68, -.379]], .012, material.dark),
    ...[-1, 1].map(side => box("固定在中缝两端的真实闭合锁扣", [side * .055, .708, .381], [.095, .045, .02], material.steel)),
  ] },
  { name: "弓脚低位张布床", theme: "现代", itemType: "家具", build: () => [
    ...[-1, 1].map(side => rod("整根纵向承受床布张力的分段侧梁", [side * .33, .205, -.99], [side * .33, .205, .99], .025)),
    ...[-1, 1].map(side => clothPanel("从侧梁向中心轻微下垂的完整承人布面", [[0, .183, -.95], [side * .33, .213, -.95], [side * .33, .213, .95], [0, .183, .95]], material.wood, .008)),
    ...[-.72, 0, .72].flatMap(z => [{ ...cord("利用预弯弹性向两侧顶紧而没有X铰腿的整根压弓脚", [[-.33, .205, 0], [-.42, .13, 0], [-.29, .025, 0], [.29, .025, 0], [.42, .13, 0], [.33, .205, 0]], .017), position: { x: 0, y: 0, z } }, rod("压弓上方直接扣住两侧纵梁的预张拉底弦", [-.33, .2, z], [.33, .2, z], .01, material.dark), ...[-1, 1].map(side => cylinder("压弓脚接入侧梁的独立锁扣", [side * .33, .205, z], [.048, .05, .048], material.dark, [90, 0, 0]))]),
    ...[-1, 1].map(side => rod("床布两端的窄幅可抽撑杆", [-.33, .203, side * .95], [.33, .203, side * .95], .016)),
  ] },
  { name: "中心火盆环桌", theme: "现代", itemType: "家具", build: () => {
    const circle = (radius: number) => Array.from({ length: 16 }, (_, index): [number, number] => { const angle = index * Math.PI / 8; return [Math.cos(angle) * radius, Math.sin(angle) * radius]; });
    const parts: ModelPart[] = [piercedPanel("在中央留出真实隔热开口的完整环形桌面", [0, .61, 0], circle(1.03), [circle(.5)], .045, material.wood), part("真正内凹开放而非实心锥体的独立火盆", "lathe", material.dark, [0, .225, 0], [1, 1, 1], [0, 0, 0], { profile: [{ x: 0, y: 0 }, { x: .25, y: 0 }, { x: .46, y: .34 }, { x: .449, y: .344 }, { x: .242, y: .018 }, { x: 0, y: .018 }] }), loop("火盆口沿加强但不中断中央空腔的窄铁圈", [0, .563, 0], .463, .014, [0, 0, 0], material.dark)];
    for (let index = 0; index < 4; index++) { const angle = Math.PI / 4 + index * Math.PI / 2, at = (radius: number, y: number): Triple => [Math.cos(angle) * radius, y, Math.sin(angle) * radius]; parts.push(rod("由环桌下沿直接落地的外展支脚", at(.73, .611), at(.9, .025), .04, material.dark), rod("从同一支脚内侧承住火盆底的斜托", at(.87, .11), at(.235, .238), .025, material.dark), box("外展脚末端的防陷脚掌", at(.9, .025), [.12, .05, .12], material.dark)); }
    return parts;
  } },
  { name: "锁臂折展炊事台", theme: "现代", itemType: "家具", build: () => {
    const parts: ModelPart[] = [box("中部独立耐热炊事台面", [0, .87, 0], [.68, .035, .63], material.steel), piercedPanel("边缘实际接到低横撑且保留七条通风槽的承物盘", [0, .219, .04], [[-.36, -.245], [.36, -.245], [.36, .245], [-.36, .245]], Array.from({ length: 7 }, (_, index): [number, number][] => { const x = (index - 3) * .09; return [[x - .028, -.2], [x + .028, -.2], [x + .028, .2], [x - .028, .2]]; }), .022, material.dark)];
    for (const side of [-1, 1]) {
      parts.push(box("能够沿中台边铰起收拢的完整侧工作翼", [side * .625, .858, 0], [.56, .025, .61], material.ivory), rod("侧工作翼与中台边相接的贯通铰轴", [side * .344, .843, -.3], [side * .344, .843, .3], .018), rod("从下架锁到外翼底面的承重折撑", [side * .36, .25, .17], [side * .83, .842, .17], .02), rod("中台后方可折收的挂具竖杆", [side * .31, .86, .26], [side * .31, 1.54, .26], .019), ...[-1, 1].map(z => rod("在上端铰开并支撑整机的外斜桌腿", [side * .39, .02, z * .34], [side * .29, .85, z * .26], .027)), rod("两根同侧折腿之间的低位锁定横撑", [side * .36, .25, -.3], [side * .36, .25, .3], .02));
      parts.push(clothPanel("台下储物仓真正垂落的软侧壁", [[side * .31, .24, -.21], [side * .31, .24, .28], [side * .31, .81, .28], [side * .31, .81, -.21]], material.wood), box("中部防风板围成三面但保持前方开放的侧片", [side * .32, 1.025, .04], [.014, .29, .55], material.dark));
    }
    parts.push(box("中部热台后方真正竖立的整幅挡风背片", [0, 1.025, .315], [.65, .29, .014], material.dark), rod("可悬挂炊具而不中断操作面的顶部横杆", [-.33, 1.54, .26], [.33, 1.54, .26], .022));
    for (const x of [-.2, 0, .2]) parts.push(cord("从顶横杆向下回钩的独立小挂钩", [[x, 1.54, .26], [x, 1.46, .26], [x, 1.44, .22], [x, 1.47, .2]], .004));
    return parts;
  } },
  { name: "剪架悬盆洗漱台", theme: "现代", itemType: "家具", build: () => {
    const hole = Array.from({ length: 20 }, (_, index): [number, number] => [Math.cos(index * Math.PI / 10) * .23, Math.sin(index * Math.PI / 10) * .23]);
    const parts: ModelPart[] = [piercedPanel("真实开圆孔让软盆口沿坐入的独立洗漱台面", [0, .795, 0], [[-.39, -.31], [.39, -.31], [.39, .31], [-.39, .31]], [hole], .022, material.ivory), part("由台面下悬挂而保持开放盆腔的软质洗漱盆", "lathe", material.steel, [0, .55, 0], [1, 1, 1], [0, 0, 0], { profile: [{ x: 0, y: 0 }, { x: .15, y: 0 }, { x: .239, y: .26 }, { x: .225, y: .26 }, { x: .139, y: .016 }, { x: 0, y: .016 }] })];
    for (const side of [-1, 1]) parts.push(rod("从前脚反交到洗漱台后缘的折腿", [side * .31, .02, -.3], [side * .31, .79, .27], .027), rod("从后脚反交到洗漱台前缘的折腿", [side * .31, .02, .3], [side * .31, .79, -.27], .027), hinge(side * .31, .425, 0), rod("夹在两侧上腿之间的真正承台横杆", [-.33, .78, side * .27], [.33, .78, side * .27], .026));
    parts.push(rod("两副剪脚中铰之间的同步轴", [-.31, .425, 0], [.31, .425, 0], .018), cord("真正接在盆底并向低位排水的短软管", [[0, .55, 0], [.15, .43, .04], [.39, .16, .1], [.43, .035, .16]], .017, material.dark), cord("回扣在上台两边的独立悬毛巾侧框", [[.36, .79, -.22], [.49, .79, -.22], [.49, .79, .22], [.36, .79, .22]], .014), cord("从台后伸向盆口的可拆供水弯颈", [[0, .8, .27], [0, 1.04, .27], [0, 1.075, .13], [0, 1.02, .1]], .011));
    return parts;
  } },
  { name: "折撑围网旅行床", theme: "现代", itemType: "家具", build: () => {
    const parts: ModelPart[] = [box("离地后可整片折收的旅行床硬底托", [0, .19, 0], [1.12, .035, .75], material.dark), box("真正落在床底托上的薄软褥", [0, .225, 0], [1.06, .035, .69], material.ivory), cylinder("收床时向上提起的底部四臂汇合座", [0, .105, 0], [.12, .08, .12], material.dark)];
    for (const x of [-1, 1]) for (const z of [-1, 1]) {
      parts.push(rod("从独立脚靴直接升到围网角点的可折立杆", [x * .56, .035, z * .38], [x * .56, .81, z * .38], .026), cylinder("围网旅行床四角宽防陷脚", [x * .56, .025, z * .38], [.1, .05, .1], material.dark), rod("从床底中枢伸到四角托底的折撑臂", [0, .105, 0], [x * .55, .19, z * .37], .019));
    }
    for (const side of [-1, 1]) {
      parts.push({ ...clothPanel("两侧让父母看清床内的完整透视网围", [[-.55, .24, side * .375], [.55, .24, side * .375], [.55, .8, side * .375], [-.55, .8, side * .375]], material.ivory), opacity: .19 }, { ...clothPanel("两端让父母看清床内的完整透视网围", [[side * .555, .24, -.37], [side * .555, .24, .37], [side * .555, .8, .37], [side * .555, .8, -.37]], material.ivory), opacity: .19 });
      parts.push(rod("上沿长边从角点延伸到中央锁扣的左半管", [-.56, .81, side * .38], [0, .81, side * .38], .033, material.wood), rod("上沿长边从中央锁扣延伸到角点的右半管", [0, .81, side * .38], [.56, .81, side * .38], .033, material.wood), box("长边中央用于解锁折床的包胶双铰座", [0, .81, side * .38], [.11, .055, .06], material.dark), rod("上沿短边贯通两角的可折承围杆", [side * .56, .81, -.38], [side * .56, .81, .38], .033, material.wood));
    }
    return parts;
  } },
  { name: "扇骨落地挡风拱屏", theme: "现代", itemType: "家具", build: () => {
    const hub: Triple = [-.8, .11, 0], ends = Array.from({ length: 8 }, (_, index): Triple => { const angle = index * Math.PI * 7 / 72; return [hub[0] + Math.cos(angle) * 1.68, hub[1] + Math.sin(angle) * 1.68, 0]; });
    const parts: ModelPart[] = [cylinder("整面挡风屏绕其展开的共同落地扇轴", hub, [.11, .09, .11], material.dark, [90, 0, 0]), box("扇轴下方抵抗前后风压的完整宽脚", [-.8, .035, 0], [.17, .07, .87], material.dark), box("末端扇骨下方可锁定开角的第二宽脚", [.88, .035, 0], [.17, .07, .71], material.dark)];
    for (let index = 0; index < ends.length; index++) { parts.push(rod("从同一扇轴放射到拱顶边缘的完整细骨", hub, ends[index]!, .022)); if (index) parts.push(clothPanel("两根扇骨之间能够风琴折收的真实布扇片", [hub, ends[index - 1]!, ends[index]!], material.wood, .007)); }
    parts.push(cord("连接全部扇骨末端而能随折屏合拢的连续软包边", ends, .01, material.dark), rod("将末端扇骨实际锁到宽地脚的短撑", [.88, .07, 0], ends[0]!, .025));
    return parts;
  } },
  { name: "平行连杆房车踏梯", theme: "现代", itemType: "家具", build: () => {
    const parts: ModelPart[] = [];
    for (const side of [-1, 1]) {
      for (const offset of [-.065, .065]) parts.push(rod("共同约束三级踏面保持水平的连续平行侧连杆", [side * .3, .14 + offset, -.65], [side * .3, .62 + offset, .65], .022));
      parts.push(rod("后部能随踏梯收拢而独立落地的长承腿", [side * .3, .02, .69], [side * .3, .62, .65], .032), rod("前端地脚实际接起两条平行连杆的短立脚", [side * .3, .02, -.65], [side * .3, .205, -.65], .025), rod("从前地脚接到后承腿的底部锁定撑", [side * .3, .02, -.67], [side * .3, .39, .67], .022), box("前后方向连成整体的防陷地脚", [side * .3, .02, .02], [.1, .04, 1.47], material.dark), box("可抵接房车门槛的宽顶挂耳", [side * .3, .64, .73], [.11, .075, .21], material.dark));
    }
    for (let index = 0; index < 3; index++) { const z = -.45 + index * .45, y = .21385 + index * .16615; parts.push(box("经平行连杆约束而保持水平的独立防滑踏板", [0, y + .025, z], [.64, .05, .34], material.steel), ...[-1, 1].flatMap(side => [rod("两条平行侧杆之间真正竖立的踏板短连片", [side * .3, y - .065, z], [side * .3, y + .065, z], .025), hinge(side * .3, y - .065, z), hinge(side * .3, y + .065, z)]), ...bars("踏板表面略凸起的防滑细条", 4, [0, y + .053, z], .23, [.57, .006, .013], 2, material.dark)); }
    return parts;
  } },
  { name: "风琴框网层食品柜", theme: "现代", itemType: "家具", build: () => {
    const parts: ModelPart[] = [box("可整体拎起的轻质封顶板", [0, 1.32, 0], [.69, .025, .56], material.ivory)];
    for (const side of [-1, 1]) {
      for (const bottom of [.13, .7]) parts.push(rod("沿侧面风琴合拢的第一斜撑", [side * .32, bottom, -.25], [side * .32, bottom + .57, .25], .018), rod("沿侧面风琴合拢的第二反斜撑", [side * .32, bottom, .25], [side * .32, bottom + .57, -.25], .018), hinge(side * .32, bottom + .285, 0));
      parts.push({ ...clothPanel("储粮柜两侧连续透气而能折叠的软网布", [[side * .315, .16, -.24], [side * .315, .16, .24], [side * .315, 1.3, .24], [side * .315, 1.3, -.24]], material.ivory), opacity: .22 }, rod("两副侧风琴架之间的落地联杆", [-.32, .03, side * .25], [.32, .03, side * .25], .024), ...[-1, 1].flatMap(z => [rod("从地脚实际接起风琴架底铰节点的短竖颈", [side * .32, .03, z * .25], [side * .32, .13, z * .25], .02), rod("从风琴架顶铰节点实际支住封顶板的短承颈", [side * .32, 1.27, z * .25], [side * .32, 1.309, z * .25], .02)]));
    }
    for (const y of [.15, .72, 1.29]) parts.push(box("各自锁在风琴架节点间的可取下食品层板", [0, y, 0], [.63, .018, .49], material.dark), ...[-1, 1].map(side => rod("接住层板前后边而不只靠网布的通长承架", [-.32, y - .02, side * .24], [.32, y - .02, side * .24], .017)));
    parts.push({ ...clothPanel("后侧真正闭合但仍透气的完整网壁", [[-.315, .16, .245], [.315, .16, .245], [.315, 1.3, .245], [-.315, 1.3, .245]], material.ivory), opacity: .22 }, cylinder("前门收卷后挂在顶板下方的软网布卷", [0, 1.265, -.26], [.065, .61, .065], material.wood, [0, 0, 90]), cord("食品柜封顶板上的独立织带提手", [[-.12, 1.335, 0], [-.12, 1.42, 0], [.12, 1.42, 0], [.12, 1.335, 0]], .009, material.dark));
    return parts;
  } },
  { name: "伸脚踏台竞技钓箱", theme: "现代", itemType: "家具", build: () => {
    const parts: ModelPart[] = [box("与六脚底架联成整体的中部防水钓箱", [0, .44, .13], [.59, .29, .52], material.dark), box("钓箱本身兼作座面的整幅防水软垫", [0, .618, .13], [.61, .067, .54], material.wood), ...[-1, 1].map(side => box("从钓箱底部向前伸出的承踏台内滑梁", [side * .23, .22, -.39], [.035, .04, 1.39], material.steel)), ...bars("实际留有沥水缝而非实心薄片的前伸脚踏板", 8, [0, .25, -.72], .55, [.59, .032, .061], 2, material.dark)];
    for (const x of [-1, 1]) for (const z of [-.13, .38, -.97]) parts.push(cylinder("用于独立调平钓箱和踏台的粗腿外管", [x * .32, z < -.5 ? .175 : .38, z], [.035, z < -.5 ? .16 : .36, .035]), cylinder("从粗外管内伸出的细调平脚", [x * .32, .105, z], [.026, .17, .026]), ball("防止钓箱陷入泥地的独立万向脚掌", [x * .32, .027, z], [.14, .054, .14], material.dark), cylinder("每根腿单独夹紧高度的旋锁", [x * .344, z < -.5 ? .19 : .27, z], [.055, .04, .055], material.red, [0, 0, 90]));
    parts.push(...[-.13, .38, -.97].map(z => rod("把外侧调平腿实际连接到内侧箱梁与踏台滑梁的横托", [-.34, z < -.5 ? .22 : .31, z], [.34, z < -.5 ? .22 : .31, z], .026)), box("箱前能完整抽出而不只是贴标签的浅饵盘", [0, .436, -.22], [.5, .075, .28], material.steel), box("浅饵盘前侧实际可抓的拉柄", [0, .443, -.37], [.15, .025, .025], material.dark), rod("钓箱右侧把鱼竿托伸到身前的水平安装臂", [.32, .53, -.05], [.64, .53, -.44], .025), loop("独立安装臂前端真正可以承住竿身的开放托环", [.64, .55, -.44], .055, .009, [90, 0, 0], material.wood));
    return parts;
  } },
  { name: "三叉交杆吊布凳", theme: "现代", itemType: "家具", build: () => {
    const corners = Array.from({ length: 3 }, (_, index): Triple => { const angle = index * Math.PI * 2 / 3; return [Math.cos(angle) * .285, .51, Math.sin(angle) * .285]; });
    const parts: ModelPart[] = [cylinder("三根斜脚能够分别绕转的中央分叉铰套", [0, .263, 0], [.065, .09, .065], material.dark)];
    for (let index = 0; index < 3; index++) { const corner = corners[index]!, foot: Triple = [-corner[0] * .94, .018, -corner[2] * .94]; parts.push(rod("从对侧地脚穿过中央铰套到布角的完整折脚", foot, corner, .025, material.wood), ball("每根折脚末端实际着地的防滑套", foot, [.06, .036, .06], material.dark), clothPanel("从三角布边自然下垂到座心的独立承人扇片", [corner, corners[(index + 1) % 3]!, [0, .463, 0]], material.red, .009), rod("锁住三角凳布边而非四角吊椅的连续承带", corner, corners[(index + 1) % 3]!, .012, material.dark)); }
    return parts;
  } },
  { name: "三桅狭口悬布摇椅", theme: "现代", itemType: "家具", build: () => {
    const top: Triple = [0, 1.99, .18], rim: Triple[] = [[0, 1.57, -.15], [-.33, 1.15, -.15], [-.29, .63, -.15], [0, .47, -.15], [.29, .63, -.15], [.33, 1.15, -.15]];
    const parts: ModelPart[] = [cord("狭口吊布前缘完整而柔软的六角包边", [...rim, rim[0]!], .012, material.wood)];
    for (let index = 0; index < 3; index++) { const angle = (-30 + index * 120) * Math.PI / 180, foot: Triple = [Math.cos(angle) * .95, .03, Math.sin(angle) * .95]; parts.push(rod("三根汇聚到同一高点的独立外展承重桅", foot, top, .04), cylinder("外展桅末端抵抗下陷的宽脚靴", [foot[0], .025, foot[2]], [.17, .05, .17], material.dark)); }
    for (let index = 0; index < rim.length; index++) parts.push(clothPanel("从狭口兜向深后舱而没有藤篮骨架的承人厚吊布", [rim[index]!, rim[(index + 1) % rim.length]!, [0, .92, .4]], material.red, .012));
    parts.push(rod("从吊布上角到桅顶的真正承重短吊带", rim[0]!, top, .018, material.dark), box("沿深布兜倾斜底面承接而不沉到布下的柔软小垫", [0, .73, .1], [.4, .08, .31], material.ivory, [-39, 0, 0]));
    return parts;
  } },
  { name: "偏桅悬臂庭院伞", theme: "现代", itemType: "家具", build: () => {
    const parts: ModelPart[] = [box("偏桅伞下横贯前后的第一重脚", [-1.06, .045, 0], [.2, .09, 1.29], material.dark), box("与第一重脚正交并联成完整十字的第二重脚", [-1.06, .045, 0], [1.29, .09, .2], material.dark), cord("从重脚后侧升起并向伞顶连续弯挑的偏心主桅", [[-1.06, .09, 0], [-1.06, 1.76, 0], [-.85, 2.27, 0], [-.43, 2.61, 0], [0, 2.71, 0]], .035), rod("桅中段到悬臂前端的可锁长斜拉杆", [-1.06, 1.72, 0], [-.12, 2.66, 0], .021), cylinder("吊伞顶端连接所有主骨的中枢", [0, 2.66, 0], [.09, .13, .09], material.dark), cylinder("收开伞时沿短中轴滑动的活动伞毂", [0, 2.425, 0], [.11, .055, .11], material.dark)];
    for (const x of [-1, 1]) for (const z of [-1, 1]) parts.push(box("锁在十字脚上的独立可搬压重块", [-1.06 + x * .34, .12, z * .34], [.46, .15, .46], material.steel));
    for (let index = 0; index < 8; index++) {
      const angle = index * Math.PI / 4, next = (index + 1) * Math.PI / 4, at = (a: number, radius: number, y: number): Triple => [Math.cos(a) * radius, y, Math.sin(a) * radius];
      parts.push({ ...cord("从中枢经曲肩一直伸到伞缘的完整主伞骨", [[0, 2.68, 0], [.68, 2.57, 0], [1.32, 2.19, 0]], .012, material.dark), rotation: { x: 0, y: -index * 45, z: 0 } }, rod("从活动伞毂撑到主骨曲肩的独立开伞撑条", [0, 2.425, 0], at(angle, .68, 2.57), .009), clothPanel("伞中央相邻主骨之间的独立坡面布", [[0, 2.675, 0], at(angle, .68, 2.57), at(next, .68, 2.57)], material.ivory), clothPanel("在曲肩下方接续到伞缘的完整外圈布片", [at(angle, .68, 2.57), at(angle, 1.32, 2.19), at(next, 1.32, 2.19), at(next, .68, 2.57)], material.ivory));
    }
    parts.push(cylinder("主桅侧方真正伸出的独立开伞摇柄轴", [-1.115, 1.15, 0], [.025, .11, .025], material.steel, [0, 0, 90]), rod("摇柄轴与隔热手柄之间的偏心短臂", [-1.17, 1.15, 0], [-1.17, 1.04, 0], .016), cylinder("可抓住转动的开伞手握段", [-1.21, 1.04, 0], [.035, .1, .035], material.wood, [0, 0, 90]));
    return parts;
  } },
];
