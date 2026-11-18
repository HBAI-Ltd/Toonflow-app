import { Euler, Quaternion, Vector3 } from "three";
import { part, type ModelPart, type Triple } from "../assetModelParts";
import { polygon, tapered } from "../masterNature/shared";
import { lobe, combineMeshes } from "../natureParts";
import { box, cylinder, rod, cord, plate, loop, ball, cone, cup, piercedPanel, material, type MasterPrototype } from "./parts";

// 参考完整装配类型；几何为本地原创，不收录馆藏照片或模型。
// https://www.nationaltrustcollections.org.uk/object/129442 （系带可降侧长榻）
// https://www.metmuseum.org/art/collection/search/6906 （转角椅）

function placeParts(parts: ModelPart[], rotation: Triple, offset: Triple): ModelPart[] {
  const turn = new Quaternion().setFromEuler(new Euler(...rotation.map(value => value * Math.PI / 180) as Triple));
  for (const value of parts) {
    const position = new Vector3(value.position.x, value.position.y, value.position.z).applyQuaternion(turn);
    value.position = { x: position.x + offset[0], y: position.y + offset[1], z: position.z + offset[2] };
    const local = new Quaternion().setFromEuler(new Euler(value.rotation.x * Math.PI / 180, value.rotation.y * Math.PI / 180, value.rotation.z * Math.PI / 180));
    const facing = new Euler().setFromQuaternion(turn.clone().multiply(local));
    value.rotation = { x: facing.x * 180 / Math.PI, y: facing.y * 180 / Math.PI, z: facing.z * 180 / Math.PI };
  }
  return parts;
}

export const heritageFurnitureBatchThreeObjects: MasterPrototype[] = [
  { name: "系带可降扶侧长榻", theme: "欧式", itemType: "家具", build: () => {
    const parts = [box("连贯长榻座框", [0, .34, 0], [1.88, .2, .83], material.wood), box("长榻全幅软座垫", [0, .48, -.015], [1.73, .13, .73], material.ivory), box("高位软包固定靠背", [0, .84, .36], [1.84, .7, .09], material.ivory), ...[-1, 1].flatMap(x => [-1, 1].map(z => cylinder("短木足", [x * .8, .125, z * .29], [.09, .25, .09], material.wood)))];
    for (const s of [-1, 1]) {
      const side = [box("能沿座侧长轴下放的整体扶侧", [0, .28, 0], [.065, .56, .84], material.ivory), ...[-1, 1].map(z => cylinder("扶侧前后悬绳角柱", [0, .59, z * .37], [.04, .18, .04], material.wood)), ...[-1, 1].map(z => ball("角柱顶固定系绳球", [0, .7, z * .37], [.055, .055, .055], material.wood))];
      parts.push(...placeParts(side, [0, 0, -s * 17], [s * .88, .45, 0]), cylinder("通长扶侧旋转合页轴", [s * .88, .45, 0], [.025, .82, .025], material.steel, [90, 0, 0]), cylinder("固定背框的系绳角柱", [s * .85, 1.12, .37], [.04, .19, .04], material.wood));
      const outerX = s * (.88 + .7 * Math.sin(17 * Math.PI / 180)), topY = .45 + .7 * Math.cos(17 * Math.PI / 180);
      parts.push(cord("系在前后角柱间限定扶侧角度的承重绳", [[s * .85, 1.2, .37], [outerX, topY, -.37]], .008, material.wood), cord("扶侧后角通向背柱的限定绳", [[s * .85, 1.2, .37], [outerX, topY, .37]], .008, material.wood));
    }
    return parts;
  } },
  { name: "夹角双背转角椅", theme: "欧式", itemType: "家具", build: () => {
    const parts = [box("方形对角入座软垫", [0, .465, 0], [.54, .065, .54], material.ivory), ...[-1, 1].flatMap(x => [-1, 1].map(z => rod("四角独立弯足", [x * .3, .025, z * .3], [x * .24, .435, z * .24], .04, material.wood))), cord("跨相邻两边而不围住前角的连续搭脑", [[-.29, .74, .29], [-.05, .82, .32], [.28, .85, .28], [.32, .82, -.05], [.29, .74, -.29]], .027, material.wood), rod("后转角通高立柱", [.27, .45, .27], [.28, .85, .28], .035, material.wood), ...[0, 1].map(axis => rod("两侧扶臂端部立柱", axis ? [.27, .45, -.25] : [-.25, .45, .27], axis ? [.29, .74, -.29] : [-.29, .74, .29], .03, material.wood)), box("座下横向联系梁", [0, .39, .24], [.51, .06, .04], material.wood), box("座下纵向联系梁", [.24, .39, 0], [.04, .06, .51], material.wood)];
    for (const x of [-.13, 0, .13]) parts.push(rod("第一面靠背插棂", [x, .49, .25], [x, .8, .31], .016, material.wood));
    for (const z of [-.13, 0, .13]) parts.push(rod("与第一面垂直的第二面插棂", [.25, .49, z], [.31, .8, z], .016, material.wood));
    return parts;
  } },
  { name: "翻背变桌修道院长凳", theme: "欧式", itemType: "家具", build: () => {
    const parts = [box("长凳中空座箱底", [0, .055, 0], [1.46, .11, .5], material.wood), ...[-1, 1].map(s => box("长凳座箱左右端板", [s * .7, .28, 0], [.05, .45, .5], material.wood)), ...[-1, 1].map(s => box("座箱前后板", [0, .28, s * .23], [1.38, .45, .04], material.wood)), box("独立承坐平盖", [0, .52, 0], [1.48, .045, .53], material.wood), ...[-1, 1].map(s => box("侧扶臂与翻背轴的通高支座", [s * .73, .62, .03], [.06, .46, .54], material.wood)), cylinder("长背在侧扶臂间翻转的共同横轴", [0, .8, .07], [.035, 1.57, .035], material.steel, [0, 0, 90]), box("同一整幅靠背翻平后形成的宽桌面", [0, .835, .07], [1.82, .055, .92], material.wood), ...[-1, 1].map(s => box("翻面桌板底面长撑条", [0, .79, s * .29], [1.65, .045, .045], material.wood)), ...[-1, 1].map(s => cylinder("桌板翻到平位的木制限位销", [s * .75, .78, -.19], [.035, .12, .035], material.wood, [0, 0, 90]))];
    return parts;
  } },
  { name: "长台沙狐球桌", theme: "欧式", itemType: "家具", build: () => {
    const parts = [...[-1, 1].map(s => box("下纵梁与滑盘之间的实接长承条", [s * .22, .768, 0], [.07, .065, 4], material.wood)), box("连续窄长实木滑盘赛道", [0, .82, 0], [.5, .045, 4.01], material.wood), ...[-1, 1].map(s => box("赛道两侧低下去的回收沟槽底", [s * .325, .755, 0], [.15, .035, 4.19], material.dark)), ...[-1, 1].map(s => box("整桌外侧护墙", [s * .43, .795, 0], [.055, .15, 4.3], material.wood)), ...[-1, 1].map(s => box("长桌前后封口护墙", [0, .795, s * 2.12], [.86, .15, .06], material.wood)), ...[-1, 1].map(s => box("承托赛道的整根下纵梁", [s * .26, .68, 0], [.09, .12, 4.2], material.wood))];
    for (const z of [-1.5, 0, 1.5]) for (const s of [-1, 1]) parts.push(box("长台分布承重足", [s * .25, .34, z], [.09, .68, .13], material.wood));
    for (const z of [-1.7, -1.47, 1.47, 1.7]) parts.push(box("两端实嵌得分区分界细条", [0, .84325, z], [.5, .0015, .003], material.ivory));
    for (let i = 0; i < 6; i++) parts.push(cylinder("有重量的推击沙狐球圆盘", [i % 2 ? .1 : -.09, .8515, (i < 3 ? -1 : 1) * (1.44 + i % 3 * .11)], [.044, .018, .044], i % 2 ? material.red : material.steel));
    return parts;
  } },
  { name: "四门投槽荷兰木滑盘桌", theme: "欧式", itemType: "家具", build: () => {
    const parts = [box("滑盘长槽底板", [0, .8, 0], [.47, .035, 2.08], material.wood), ...[-1, 1].map(s => box("长槽两侧连续护边", [s * .24, .845, 0], [.025, .1, 2.13], material.wood)), box("球道末端封板", [0, .88, 1.055], [.48, .17, .025], material.wood), ...[-1, 1].flatMap(x => [-1, 1].map(z => box("独立长桌四足", [x * .19, .395, z * .78], [.06, .79, .07], material.wood))), box("四道计分门的共同上门楣", [0, .932, .63], [.45, .06, .04], material.wood)];
    for (let i = 0; i < 5; i++) parts.push(box("计分门之间真正竖立的门柱", [-.215 + i * .1075, .86, .63], [.018, .085, .04], material.wood));
    for (let i = 0; i < 3; i++) parts.push(box("每个得分槽向后延伸的真实隔板", [-.1075 + i * .1075, .875, .84], [.014, .12, .39], material.wood));
    for (let i = 0; i < 7; i++) parts.push(cylinder("可推过门洞进入独立后槽的圆片", [(i % 3 - 1) * .09, .829, -.68 + Math.floor(i / 3) * .11], [.055, .024, .055], material.ivory));
    return parts;
  } },
  { name: "弧端九孔手击弹球长台", theme: "欧式", itemType: "家具", build: () => {
    const outline: [number, number][] = [[-.31, -1.05], [.31, -1.05], ...Array.from({ length: 13 }, (_, i): [number, number] => [Math.cos(i * Math.PI / 12) * .31, .72 + Math.sin(i * Math.PI / 12) * .31])];
    const holes = Array.from({ length: 9 }, (_, i) => Array.from({ length: 12 }, (_, j): [number, number] => [(i % 3 - 1) * .15 + Math.cos(-j * Math.PI / 6) * .033, .34 + Math.floor(i / 3) * .17 + Math.sin(-j * Math.PI / 6) * .033]));
    const top: ModelPart[] = [polygon("带真实贯通九孔的整块木赛道", material.wood, outline, .035, [0, 0, 0], holes), ...[-1, 1].map(s => box("长球道两侧上护沿", [s * .318, .06, -.16], [.025, .12, 1.78], material.wood)), cord("后端连成半圆的反弹围沿", Array.from({ length: 13 }, (_, i): Triple => [Math.cos(i * Math.PI / 12) * .312, .055, .72 + Math.sin(i * Math.PI / 12) * .312]), .02, material.wood)];
    for (let i = 0; i < 9; i++) top.push(cup("每个球洞下方有底的独立接球窝", [(i % 3 - 1) * .15, -.055, .34 + Math.floor(i / 3) * .17], .034, .08, material.wood), ...[-1, 1].map(s => cylinder("围住球窝入口的独立挡球钉", [(i % 3 - 1) * .15 + s * .045, .055, .34 + Math.floor(i / 3) * .17], [.009, .04, .009], material.steel)));
    top.push(rod("由人直接击球的细木球杆", [.21, .07, -.95], [.21, .07, -.3], .018, material.wood), ball("赛道上的完整木球", [.05, .0525, -.53], [.035, .035, .035], material.ivory));
    const parts = [...placeParts(top, [-3, 0, 0], [0, .84, 0]), ...[-1, 1].flatMap(x => [-1, 1].map(z => box("前低后高的四角木足", [x * .25, (.81 + z * .042) / 2, z * .79], [.065, .81 + z * .042, .075], material.wood))), ...[-1, 1].map(s => box("木足上方纵向联系梁", [s * .25, .7, 0], [.055, .11, 1.72], material.wood))];
    return parts;
  } },
  { name: "同心环跃球计分游艺机", theme: "现代", itemType: "家具", build: () => {
    const parts = [box("游艺机底架平台", [0, .1, .06], [.92, .2, 3.05], material.dark), ...[-1, 1].map(s => box("柜墙内缘实接抛球坡的长承条", [s * .39, .69, -.3], [.06, .06, 1.8], material.wood)), ...[-1, 1].map(s => box("回球斜坡边缘与侧柜相接的承轨", [s * .39, .66, .08], [.055, .035, 2.8], material.wood, [-7, 0, 0])), ...[-1, 1].map(s => rod("沿计分板两侧从底架直达顶端的斜立框", [s * .43, .2, .959], [s * .43, 2.04, 1.63], .055, material.wood)), box("前收球盘下实接两侧柜墙的宽横托", [0, .47, -1.3], [.86, .055, .32], material.dark), ...[-1, 1].map(s => box("滚道两侧承力柜墙", [s * .43, .41, .07], [.06, .62, 3.05], material.wood)), part("从平滚道逐步弯起的连续抛球坡", "extrude", material.wood, [0, 0, 0], [1, 1, 1], [0, 90, 0], { depth: .75, profile: [[1.2, .68], [-.55, .68], [-.72, .73], [-.86, .87], [-.95, 1.06], [-.99, 1.27], [-.95, 1.3], [-.91, 1.08], [-.83, .9], [-.69, .77], [-.54, .72], [1.2, .72]].map(([x, y]) => ({ x: x!, y: y! })) }), ...[-1, 1].map(s => rod("平滚道侧边挡球细轨", [s * .36, .7325, -1.21], [s * .36, .7325, .55], .025, material.dark)), box("各得分口下方倾斜回球底坡", [0, .67, .08], [.75, .025, 2.77], material.dark, [-7, 0, 0]), box("前方接住回球的收集盘底", [0, .49, -1.3], [.74, .03, .34], material.dark), ...[-1, 1].map(s => box("回球盘两端短护边", [s * .36, .54, -1.3], [.025, .09, .36], material.dark)), box("回球盘正面挡球沿", [0, .54, -1.47], [.74, .09, .025], material.dark)];
    const target = [piercedPanel("中间真正开口的倾斜计分背板", [0, 0, 0], [[-.43, 0], [.43, 0], [.43, 1.1], [-.43, 1.1]], [Array.from({ length: 20 }, (_, i): [number, number] => [Math.cos(-i * Math.PI / 10) * .37, .55 + Math.sin(-i * Math.PI / 10) * .37])], .03, material.wood)];
    for (const radius of [.365, .25, .14]) target.push(part("可让球穿过的同心分值环壁", "lathe", material.ivory, [0, 0, .55], [1, 1, 1], [0, 0, 0], { profile: [{ x: radius - .014, y: -.1 }, { x: radius, y: -.1 }, { x: radius, y: .02 }, { x: radius - .014, y: .02 }, { x: radius - .014, y: -.1 }] }));
    target.push(...[-1, 1].map(s => rod("把得分环固定到外框的窄辐条", [s * .14, -.02, .55], [s * .42, -.02, .55], .016, material.dark)));
    parts.push(...placeParts(target, [-70, 0, 0], [0, 1, 1.25]), box("得分环上方独立显示盒", [0, 2.16, 1.57], [.9, .27, .15], material.dark), box("显示盒内连续计分窗", [0, 2.16, 1.495], [.72, .15, .012], material.glass));
    for (const x of [-.14, 0, .14]) parts.push(ball("回球盘中待重新滚投的球", [x, .5475, -1.3], [.085, .085, .085], material.ivory));
    return parts;
  } },
  { name: "展翼人鸟迦楼罗陈设像", theme: "异域", itemType: "器物", build: () => {
    // 形体依据鸟、人、展翼和爪足的图像传统，不用普通鸟模型换石色。
    // https://www.amnh.org/explore/ology/ology-cards/283-garuda
    const parts: ModelPart[] = [cylinder("雕像落地莲座基台", [0, .06, 0], [.95, .12, .7], material.wood), lobe("挺起的人鸟胸腹", material.ivory, [0, 1.2, 0], [.55, .84, .35]), lobe("蹲起而相连的下腹", material.ivory, [0, .77, .04], [.53, .4, .37]), lobe("带鸟喙的完整头颅", material.ivory, [0, 1.83, -.035], [.28, .35, .28]), plate("实际向前弯下的上喙", [0, 1.8, -.145], [[0, 0], [.14, -.015], [.21, -.1], [.16, -.17], [.1, -.09], [0, -.08]], .08, material.wood, [0, 90, 0]), cylinder("上身与头之间的颈部", [0, 1.6, 0], [.19, .22, .19], material.ivory), cone("冠顶渐细立冠", [0, 2.08, -.015], [.19, .24, .19], material.wood)];
    for (const s of [-1, 1]) {
      const outline: [number, number][] = [[0, 0], [.3, .4], [.85, .78], [1.05, .72], [.76, .53], [.96, .49], [.68, .35], [.78, .25], [.48, .14], [.24, -.16], [0, -.2]];
      parts.push(plate("有连续外缘和羽裂的完整展翼", [s * .18, 1.35, .11], outline.map(([x, y]): [number, number] => [s * x, y]), .06, material.ivory, [0, 0, 0]), tapered("肩至屈肘的完整上臂", material.ivory, [[s * .17, 1.43, -.02], [s * .38, 1.29, -.1]], [.075, .05]), tapered("向胸前合掌的前臂", material.ivory, [[s * .38, 1.29, -.1], [s * .065, 1.32, -.24]], [.05, .04]), lobe("胸前合拢而未悬空的手掌", material.ivory, [s * .04, 1.36, -.25], [.075, .17, .07]), tapered("腹下外展的鸟腿", material.ivory, [[s * .17, .8, .04], [s * .26, .42, -.03], [s * .19, .2, -.08]], [.09, .07, .045]), lobe("承接三趾的爪足根", material.ivory, [s * .19, .17, -.09], [.16, .12, .18]));
      for (const toe of [-1, 0, 1]) parts.push(tapered("前伸后向下弯的实体爪趾", material.ivory, [[s * .19, .17, -.13], [s * .19 + toe * .07, .145, -.25], [s * .19 + toe * .09, .13, -.29]], [.023, .018, .004]));
      parts.push(lobe("头部两侧隆起的眼眶", material.ivory, [s * .115, 1.87, -.13], [.06, .075, .05]));
      for (let i = 0; i < 4; i++) parts.push(rod("展翼上实际接连的长羽轴", [s * .3, 1.4, .15], [s * (.62 + i * .15), 1.63 + i * .12, .15], .018, material.wood));
    }
    parts.push(plate("下腹背后连续扇形尾羽", [0, .2, .19], [[-.23, 0], [.23, 0], [.16, .62], [0, .73], [-.16, .62]], .04, material.ivory, [-12, 0, 0]));
    return parts;
  } },
  { name: "鳄狮河马阿米特陈设像", theme: "异域", itemType: "器物", build: () => {
    // https://globalegyptianmuseum.org/glossary.aspx?id=58
    const parts: ModelPart[] = [box("供完整混合形体站立的薄基台", [0, .045, -.02], [.99, .09, 2.23], material.wood), lobe("把狮式胸腹连续接回河马后躯的宽腰", material.ivory, [0, .72, .13], [.61, .56, .57]), lobe("河马式宽厚后躯", material.ivory, [0, .69, .47], [.84, .86, .94]), lobe("向前抬起的狮式胸腹", material.ivory, [0, .79, -.25], [.64, .87, .86]), lobe("连接鳄首的粗颈", material.ivory, [0, 1.03, -.5], [.49, .46, .46]), lobe("宽额鳄头后部", material.ivory, [0, 1.13, -.7], [.42, .3, .39]), lobe("向前长出的扁平上鳄吻", material.ivory, [0, 1.075, -.94], [.35, .16, .62]), lobe("和上颌保有真实口缝的下颌", material.ivory, [0, .93, -.93], [.32, .1, .59]), cord("河马后部短而垂的尾", [[0, .84, .82], [0, .68, 1.01], [.07, .56, .99]], .035, material.ivory)];
    for (const s of [-1, 1]) {
      parts.push(lobe("鳄吻后方连回头颅的下颌关节", material.ivory, [s * .15, .99, -.7], [.1, .19, .14]), tapered("狮式前腿的肩肘腕连续段", material.ivory, [[s * .22, .83, -.34], [s * .25, .41, -.43], [s * .27, .17, -.47]], [.1, .07, .055]), lobe("狮掌宽前爪", material.ivory, [s * .27, .148, -.55], [.23, .14, .29]), tapered("河马后腿的粗短支承", material.ivory, [[s * .27, .76, .58], [s * .29, .38, .61], [s * .3, .17, .67]], [.15, .12, .095]), lobe("河马式宽厚后足", material.ivory, [s * .3, .148, .69], [.25, .14, .31]), lobe("高于上吻的鳄眼隆起", material.ivory, [s * .16, 1.23, -.75], [.12, .13, .12]));
      for (const z of [-1.12, -1.01, -.9]) parts.push(cone("上下颌之间可见的独立鳄齿", [s * .13, .995, z], [.022, .047, .022], material.wood, [180, 0, 0]));
      for (let i = 0; i < 3; i++) parts.push(lobe("前爪指节", material.ivory, [s * .27 + (i - 1) * .055, .145, -.67], [.05, .08, .09]));
    }
    return parts;
  } },
  { name: "卷鼻鱼躯摩羯陈设像", theme: "异域", itemType: "器物", build: () => {
    // 采用象鼻与鱼体的传统形体，不把同一鳄兽换头扩主。
    // https://www.muziumnegara.gov.my/en/makara
    const parts: ModelPart[] = [box("水兽陈设低基座", [0, .04, .12], [1.2, .08, 1.79], material.wood), plate("从基台连续托接鱼腹的实体卷浪", [0, 0, .16], [[-.32, .08], [.33, .08], [.32, .18], [.2, .3], [.06, .33], [-.05, .29], [-.08, .19], [-.23, .15], [-.32, .12]], .38, material.ivory, [0, -90, 0]), lobe("象兽头向鱼躯连续过渡的粗颈肩", material.ivory, [0, .67, -.16], [.56, .53, .63]), lobe("收向鱼尾的饱满鱼躯", material.ivory, [0, .55, .24], [.77, .69, 1.1]), lobe("较高而前伸的象兽头颅", material.ivory, [0, .83, -.44], [.59, .57, .57]), lobe("张开的上唇口缘", material.ivory, [0, .79, -.69], [.43, .14, .4]), lobe("和上唇分离的下口床", material.ivory, [0, .58, -.66], [.42, .13, .43]), tapered("从鼻额卷起再内扣的实体长象鼻", material.ivory, [[0, .99, -.58], [0, 1.05, -.82], [0, 1.25, -.96], [0, 1.43, -.83], [0, 1.31, -.67]], [.11, .095, .08, .06, .025]), tapered("从后躯向上回卷的粗尾柄", material.ivory, [[0, .55, .65], [0, .72, .97], [0, 1.04, .9], [0, 1.18, .66]], [.21, .17, .09, .025]), plate("卷尾上端分裂的宽鱼尾鳍", [0, 1.03, .76], [[0, 0], [-.29, .25], [-.32, .43], [-.07, .35], [0, .2], [.07, .35], [.32, .43], [.29, .25]], .045, material.ivory, [0, 0, 0])];
    for (const s of [-1, 1]) {
      parts.push(plate("鱼躯左右向外展开的胸鳍", [s * .235, .49, .02], [[0, 0], [.37, .02], [.48, -.16], [.16, -.2], [0, -.11]].map(([x, y]): [number, number] => [s * x!, y!]), .05, material.ivory, [0, 0, s * 12]), lobe("头侧象耳", material.ivory, [s * .29, .87, -.35], [.13, .37, .31]), lobe("象鼻两边凸起的眼眶", material.ivory, [s * .22, 1, -.6], [.1, .12, .12]), tapered("口角真实上弯的短獠牙", material.wood, [[s * .19, .68, -.69], [s * .22, .78, -.84], [s * .18, .91, -.83]], [.035, .028, .003]));
    }
    const scales: ModelPart[] = [];
    for (const s of [-1, 1]) for (let i = 0; i < 5; i++) {
      const y = .58 + i % 2 * .1, z = -.03 + i * .13;
      const x = .327 * Math.sqrt(Math.max(0, 1 - ((y - .55) / .293) ** 2 - ((z - .24) / .468) ** 2)) - .04;
      scales.push(lobe("鱼躯鳞隆", material.ivory, [s * x, y, z], [.13, .18, .18], [0, s * 15, 0]));
    }
    parts.push(combineMeshes("鱼躯上实际起伏的鳞列", material.ivory, scales));
    return parts;
  } },
  { name: "独角鳞身麒麟瑞兽像", theme: "中式", itemType: "器物", build: () => {
    // https://www.dpm.org.cn/lemmas/241903.html
    const parts: ModelPart[] = [box("麒麟四蹄共用的薄石台", [0, .045, 0], [.87, .09, 1.91], material.wood), lobe("鹿式收腰长躯", material.ivory, [0, .92, .06], [.64, .73, 1.25]), lobe("向上挺起的颈胸", material.ivory, [0, 1.21, -.46], [.42, .87, .44], [-18, 0, 0]), lobe("龙式隆额头部", material.ivory, [0, 1.65, -.68], [.38, .39, .4]), lobe("独立前伸的龙吻", material.ivory, [0, 1.57, -.91], [.32, .18, .38]), lobe("龙吻下颌", material.ivory, [0, 1.46, -.87], [.29, .1, .33]), tapered("额上唯一向后弯的肉角", material.wood, [[0, 1.79, -.63], [0, 2.01, -.56], [0, 2.12, -.34]], [.055, .04, .012]), cord("下颌垂下后回卷的长须", [[0, 1.45, -.98], [0, 1.26, -1.01], [0, 1.22, -.86]], .025, material.ivory), tapered("牛式长尾的连续尾柄", material.ivory, [[0, 1.03, .58], [0, 1.23, .83], [.11, 1.39, .81], [.22, 1.24, .73]], [.045, .04, .032, .019]), lobe("长尾末端的浓尾簇", material.wood, [.23, 1.21, .72], [.13, .24, .17], [0, 0, -28])];
    for (const s of [-1, 1]) {
      for (const z of [-1, 1]) {
        const rootZ = z * .43;
        parts.push(tapered("前后腿实际分开的蹄足肢段", material.ivory, [[s * .22, .91, rootZ], [s * .25, .51, rootZ + (z > 0 ? -.1 : .035)], [s * .25, .18, rootZ + .05]], [.085, .06, .045]));
        for (const toe of [-1, 1]) parts.push(box("保留中缝的分蹄", [s * .25 + toe * .037, .15, rootZ + .015], [.063, .12, .17], material.wood));
      }
      parts.push(lobe("麒麟隆起的双目", material.wood, [s * .16, 1.69, -.82], [.08, .08, .07]), tapered("龙吻向两边弯展的颊须", material.ivory, [[s * .12, 1.56, -.98], [s * .28, 1.62, -1.04], [s * .35, 1.77, -.99]], [.019, .015, .004]), plate("龙首两侧尖耳", [s * .11, 1.73, -.57], [[0, 0], [.1, .14], [.15, .1], [.05, -.03]].map(([x, y]): [number, number] => [s * x!, y!]), .035, material.ivory, [0, 0, 0]));
    }
    const scales: ModelPart[] = [];
    for (const s of [-1, 1]) for (let i = 0; i < 8; i++) {
      const y = .9 + i % 2 * .14, z = -.35 + Math.floor(i / 2) * .24;
      const x = .272 * Math.sqrt(Math.max(0, 1 - ((y - .92) / .31) ** 2 - ((z - .06) / .532) ** 2)) - .04;
      scales.push(lobe("麒麟实体鱼鳞", material.ivory, [s * x, y, z], [.11, .16, .17], [0, s * 15, 0]));
    }
    parts.push(combineMeshes("鹿躯两侧相接的鳞列", material.ivory, scales));
    for (let i = 0; i < 5; i++) parts.push(plate("沿颈背逐段上卷的火焰鬃", [0, 1.12 + i * .105, -.28 - i * .055], [[0, 0], [.06, .12], [.14, .15], [.1, .025], [.04, -.03]], .045, material.wood, [0, 90, 0]));
    return parts;
  } },
  { name: "水屋排水备具立台", theme: "日式", itemType: "家具", build: () => {
    const outline: [number, number][] = [[-.81, -.29], [.81, -.29], [.81, .29], [-.81, .29]];
    const parts: ModelPart[] = [polygon("真正为右侧洗具槽留洞的木台面", material.wood, outline, .035, [0, .8, 0], [[[.2, -.2], [.2, .2], [.7, .2], [.7, -.2]]]), ...[-1, 1].flatMap(x => [-1, 1].map(z => box("木台四角方足", [x * .75, .4, z * .23], [.065, .8, .065], material.wood))), ...[-1, 1].map(s => box("背部延伸的承架立柱", [s * .75, 1.25, .26], [.055, 1.18, .055], material.wood)), ...[1.16, 1.62, 1.82].map(y => box("背架上分层置茶具的窄搁板", [0, y, .2], [1.54, .025, .22], material.wood)), ...Array.from({ length: 15 }, (_, i) => rod("后背保持通风的竖竹条", [i * .1 - .7, .84, .29], [i * .1 - .7, 1.81, .29], .012, material.wood)), box("洗具槽真正封住的底部", [.45, .62, 0], [.51, .025, .41], material.dark), ...[-1, 1].map(s => box("槽内前后薄壁", [.45, .715, s * .198], [.5, .17, .015], material.dark)), ...[-1, 1].map(s => box("槽内左右薄壁", [.45 + s * .248, .715, 0], [.015, .17, .4], material.dark)), ...[-1, 1].map(s => box("沥水竹篦条下实接台面的横垫条", [-.32, .8375, s * .14], [.78, .01, .04], material.wood)), ...Array.from({ length: 9 }, (_, i) => box("左侧架高且实际分离的沥水竹篦条", [-.68 + i * .09, .85, 0], [.042, .025, .43], material.wood)), cord("台后向槽内弯下的水嘴", [[.61, .82, .245], [.61, 1.05, .245], [.61, 1.08, .08], [.61, 1, .03]], .015), rod("槽底向下排水的落水管", [.45, .62, 0], [.45, .22, 0], .035, material.dark), box("台下贯通置桶搁板", [0, .16, 0], [1.49, .025, .46], material.wood)];
    return parts;
  } },
  { name: "厚框弧托大鼓承架", theme: "日式", itemType: "家具", build: () => {
    const notch: [number, number][] = [[-.48, 0], [.48, 0], [.48, .64], [.4, .64], ...Array.from({ length: 12 }, (_, i): [number, number] => [Math.cos((i + 1) * Math.PI / 12) * .4, .64 - Math.sin((i + 1) * Math.PI / 12) * .4]), [-.48, .64]];
    return [...[-1, 1].map(s => plate("前后真正凹下托住鼓身的厚弧框", [0, .32, s * .38], notch, .09, material.wood, [0, 0, 0])), ...[-1, 1].flatMap(x => [-1, 1].map(z => box("弧框下四角短脚", [x * .39, .16, z * .38], [.09, .32, .09], material.wood))), ...[-1, 1].map(s => box("前后联系的水平侧梁", [s * .39, .24, 0], [.075, .075, .89], material.wood)), ...[-1, 1].map(s => box("弧框下横向宽稳足", [0, .04, s * .38], [1.1, .08, .21], material.wood)), ...[-1, 1].map(s => rod("抵抗演奏侧推的斜撑", [s * .39, .28, -.38], [s * .39, .64, .38], .035, material.wood))];
  } },
  { name: "拉洋片多层景柜", theme: "中式", itemType: "器物", build: () => {
    const parts: ModelPart[] = [box("西洋景柜厚底", [0, .68, 0], [1.47, .08, .77], material.wood), ...[-1, 1].flatMap(x => [-1, 1].map(z => box("抬高观看箱的四根支足", [x * .6, .32, z * .29], [.07, .64, .07], material.wood))), ...[-1, 1].map(s => box("景柜完整左右壁", [s * .7, 1.18, 0], [.035, .95, .71], material.wood)), box("景柜顶部遮光盖", [0, 1.68, 0], [1.49, .055, .79], material.wood), box("供纵深景片投射对比的柜背", [0, 1.18, .345], [1.37, .95, .025], material.ivory), piercedPanel("真正开出三个窥景孔的正面板", [0, .72, -.365], [[-.72, 0], [.72, 0], [.72, .93], [-.72, .93]], [-.43, 0, .43].map(x => Array.from({ length: 16 }, (_, i): [number, number] => [x + Math.cos(-i * Math.PI / 8) * .1, .57 + Math.sin(-i * Math.PI / 8) * .1])), .03, material.wood, [-90, 0, 0]), ...[-.16, .02, .21].map(z => box("景片底边嵌入且直接落接柜底的托槽", [0, .75, z], [1.31, .065, .028], material.wood)), plate("柜内前景林木轮廓片", [0, .78, -.16], [[-.62, 0], [.62, 0], [.62, .14], [.38, .14], [.3, .39], [.22, .14], [-.21, .14], [-.33, .44], [-.43, .14], [-.62, .14]], .008, material.dark, [0, 0, 0]), plate("柜内中景桥台及山坡片", [0, .78, .02], [[-.64, 0], [.64, 0], [.64, .28], [.32, .31], [.1, .14], [-.24, .17], [-.41, .33], [-.64, .26]], .008, material.red, [0, 0, 0]), plate("柜内远山独立轮廓片", [0, .78, .21], [[-.65, 0], [.65, 0], [.65, .62], [.42, .76], [.13, .52], [-.12, .73], [-.4, .54], [-.65, .69]], .008, material.wood, [0, 0, 0])];
    for (const x of [-.43, 0, .43]) parts.push(loop("窥景孔前突出镜筒口圈", [x, 1.29, -.39], .102, .012, [90, 0, 0], material.dark), { ...cylinder("窥景孔内的透镜", [x, 1.29, -.39], [.19, .006, .19], material.glass, [90, 0, 0]), opacity: .28 });
    for (const s of [-1, 1]) parts.push(loop("景片拉绳跨顶转向的实际导索轮", [s * .63, 1.715, .02], .025, .006, [90, 0, 0], material.dark), cord("从柜顶提起景片的独立拉绳", [[s * .51, 1.06, .02], [s * .51, 1.73, .02], [s * .75, 1.73, .02], [s * .76, 1.04, .02]], .004, material.dark), ball("表演者掌握的拉绳木坠", [s * .76, 1.02, .02], [.05, .07, .05], material.wood));
    return parts;
  } },
  { name: "人面翼牛舍杜守门像", theme: "异域", itemType: "器物", build: () => {
    // https://www.lib.uchicago.edu/collex/exhibits/discovery-collection-memory-oriental-institute-100/human-headed-winged-bull/
    const parts: ModelPart[] = [box("守门翼牛完整基台", [0, .07, .12], [1.18, .14, 2.87], material.wood), lobe("牛式宽背长躯", material.ivory, [0, 1.23, .29], [1.01, 1.2, 2.02]), lobe("高立的人面颈胸", material.ivory, [0, 1.72, -.65], [.65, .98, .7]), lobe("正面人首", material.ivory, [0, 2.22, -.8], [.48, .63, .45]), box("完整鼻梁", [0, 2.23, -1.005], [.07, .2, .07], material.ivory), cylinder("高位平顶冠", [0, 2.65, -.78], [.53, .36, .53], material.wood), plate("与颈胸相接的下垂方须", [0, 2.06, -.965], [[-.18, 0], [.18, 0], [.22, -.2], [.17, -.54], [-.17, -.54], [-.22, -.2]], .055, material.ivory, [0, 0, 0]), tapered("后躯下垂后回弯的牛尾", material.ivory, [[0, 1.34, 1.11], [0, .94, 1.4], [.16, .67, 1.3]], [.07, .05, .02])];
    for (const s of [-1, 1]) {
      for (const z of [-.55, .89]) parts.push(tapered("直达方蹄的牛足", material.ivory, [[s * .33, 1.05, z], [s * .35, .58, z + .03], [s * .35, .24, z + .025]], [.13, .1, .08]), box("承重分蹄", [s * .35, .22, z - .015], [.24, .16, .31], material.ivory));
      parts.push(plate("背部向后上伸的整幅羽翼", [s * .28, 1.52, -.31], [[0, 0], [-.58, .85], [-1.47, 1.02], [-1.2, .73], [-1.1, .54], [-.78, .33], [-.4, .14], [0, -.09]], .09, material.ivory, [0, 90, 0]), tapered("冠前向上内卷的实角", material.wood, [[s * .23, 2.61, -.84], [s * .33, 2.8, -.84], [s * .19, 2.9, -.84]], [.045, .034, .005]), lobe("人首耳部", material.ivory, [s * .23, 2.24, -.78], [.09, .16, .08]));
      for (let i = 0; i < 5; i++) parts.push(rod("整翼内分开的长羽脊", [s * .33, 1.6 + i * .03, -.28], [s * .33, 1.95 + i * .12, .81 + i * .05], .025, material.wood));
    }
    for (const x of [-.12, -.06, 0, .06, .12]) parts.push(rod("方须上的独立纵向卷纹脊", [x, 1.58, -1.003], [x, 2.03, -1.003], .018, material.wood));
    return parts;
  } },
  { name: "人躯马身半人马陈设像", theme: "欧式", itemType: "器物", build: () => {
    // https://www.metmuseum.org/art/collection/search/248143
    const parts: ModelPart[] = [box("半人马薄基台", [0, .06, .12], [1.03, .12, 2.34], material.wood), lobe("完整马身及后臀", material.ivory, [0, 1.05, .22], [.72, .89, 1.69]), lobe("从马颈位置上升的人胸", material.ivory, [0, 1.71, -.49], [.55, .84, .37]), lobe("人胸和马身之间连成一体的腰腹", material.ivory, [0, 1.28, -.4], [.43, .55, .49]), cylinder("完整人颈", [0, 2.13, -.49], [.16, .2, .16], material.ivory), lobe("完整人首", material.ivory, [0, 2.36, -.5], [.29, .37, .29]), lobe("头后有厚度的发团", material.wood, [0, 2.42, -.43], [.32, .33, .22]), tapered("马臀后方长尾", material.wood, [[0, 1.27, .93], [0, .83, 1.2], [.13, .39, 1.12]], [.09, .075, .025])];
    for (const s of [-1, 1]) {
      for (const z of [-.4, .78]) parts.push(tapered("前后四条真实马腿", material.ivory, [[s * .23, 1.12, z], [s * .27, .63, z + (z > 0 ? -.12 : .04)], [s * .27, .22, z + .03]], [.09, .065, .045]), box("马腿下完整硬蹄", [s * .27, .19, z - .01], [.14, .14, .23], material.wood));
      parts.push(tapered("人体肩肘及伸出的前臂", material.ivory, [[s * .24, 1.94, -.48], [s * .42, 1.66, -.62], [s * .28, 1.55, -.94]], [.075, .055, .035]), lobe("前臂末端手掌", material.ivory, [s * .28, 1.55, -.98], [.09, .12, .1]));
    }
    return parts;
  } },
  { name: "鱼尾特里同海神陈设像", theme: "欧式", itemType: "器物", build: () => {
    const parts: ModelPart[] = [cylinder("鱼尾承托的低圆台", [0, .055, .08], [1.37, .11, 1.15], material.wood), tapered("从人腰过渡到回卷鱼尾的完整下身", material.ivory, [[0, .86, 0], [.25, .56, .14], [.52, .31, .48], [.22, .2, .67], [-.22, .26, .49], [-.39, .52, .43]], [.19, .21, .17, .13, .08, .03]), plate("鱼尾端的双瓣扇鳍", [-.39, .44, .43], [[0, 0], [-.29, .23], [-.31, .43], [-.07, .35], [0, .2], [.09, .35], [.3, .43], [.27, .21]], .04, material.ivory, [0, 0, -28]), lobe("挺起的人形胸腹", material.ivory, [0, 1.14, -.04], [.49, .75, .33]), cylinder("人首颈部", [0, 1.51, -.05], [.14, .17, .14], material.ivory), lobe("吹号的人首", material.ivory, [0, 1.73, -.08], [.27, .33, .28]), lobe("后卷浓发", material.wood, [0, 1.78, -.015], [.31, .3, .21]), part("朝前方展开且有真实口沿的海螺号口", "lathe", material.wood, [0, 1.62, -.27], [1, 1, 1], [90, 0, 0], { profile: [{ x: .024, y: 0 }, { x: .04, y: .14 }, { x: .15, y: .36 }, { x: .15, y: .38 }, { x: .135, y: .38 }, { x: .03, y: .14 }, { x: .015, y: 0 }, { x: .024, y: 0 }] })];
    for (const s of [-1, 1]) parts.push(tapered("托住海螺号的屈臂", material.ivory, [[s * .2, 1.34, -.05], [s * .37, 1.15, -.21], [s * .13, 1.52, -.46]], [.065, .05, .03]), lobe("扶在螺号两侧的手掌", material.ivory, [s * .11, 1.52, -.47], [.075, .1, .07]));
    return parts;
  } },
  { name: "犬首阿努比斯守门立像", theme: "异域", itemType: "器物", build: () => {
    const parts: ModelPart[] = [box("独立立像薄台", [0, .04, 0], [.79, .08, .79], material.wood), lobe("人形肩胸与长躯", material.ivory, [0, 1.12, 0], [.46, .72, .28]), part("腰口窄下摆宽而真正中空的整幅短裙", "lathe", material.wood, [0, .465, 0], [1, 1, .731], [0, 0, 0], { profile: [{ x: .26, y: 0 }, { x: .14, y: .49 }, { x: .126, y: .49 }, { x: .244, y: .016 }, { x: .26, y: .016 }, { x: .26, y: 0 }] }), cylinder("承头的直颈", [0, 1.52, 0], [.15, .2, .15], material.ivory), lobe("胡狼式长后脑", material.ivory, [0, 1.74, -.015], [.25, .3, .31]), lobe("向前突出的窄长胡狼吻", material.ivory, [0, 1.7, -.23], [.14, .12, .34]), box("犬吻末端鼻", [0, 1.715, -.393], [.08, .06, .025], material.wood), cylinder("颈下宽项圈", [0, 1.47, 0], [.3, .05, .3], material.wood), rod("手侧的长权杖", [.34, .08, -.02], [.34, 1.74, -.02], .018, material.wood)];
    for (const s of [-1, 1]) {
      parts.push(tapered("短裙下的修长人腿", material.ivory, [[s * .115, .58, 0], [s * .13, .31, s * .04], [s * .13, .14, s * .08]], [.065, .044, .034]), lobe("人腿下向前伸的足", material.ivory, [s * .13, .115, -.055 + s * .08], [.13, .08, .25]), plate("头顶竖立的长尖犬耳", [s * .09, 1.84, .005], [[-.045, 0], [.045, 0], [.025, .28], [0, .34], [-.025, .28]], .045, material.ivory, [0, 0, -s * 7]), tapered("躯干两侧下伸的人臂", material.ivory, [[s * .16, 1.32, 0], [s * .27, 1.06, -.035], [s * .31, .94, -.06]], [.065, .048, .032]), lobe("手掌", material.ivory, [s * .31, .92, -.06], [.07, .13, .075]));
    }
    return parts;
  } },
  { name: "蛇龙穆什胡什守护兽像", theme: "异域", itemType: "器物", build: () => {
    // https://dia.org/collection/mushhushshu-dragon-symbol-god-marduk/55602
    const parts: ModelPart[] = [box("长体守护兽低基台", [0, .045, .18], [.91, .09, 2.47], material.wood), tapered("带蛇鳞主躯和高伸细颈", material.ivory, [[0, .72, .66], [0, .81, .04], [0, 1.02, -.47], [0, 1.47, -.57]], [.24, .26, .2, .11]), lobe("细长蛇龙头", material.ivory, [0, 1.57, -.67], [.25, .2, .5]), tapered("额上向后弯的长角", material.wood, [[0, 1.63, -.54], [0, 1.84, -.43], [0, 1.92, -.25]], [.034, .024, .003]), tapered("长而向上卷起的蛇尾", material.ivory, [[0, .75, .72], [0, .56, 1.1], [0, .66, 1.38], [0, .94, 1.42], [0, 1.04, 1.24]], [.11, .075, .05, .03, .008]), tapered("尾端向前扣下的尖刺", material.wood, [[0, 1.04, 1.24], [0, 1.1, 1.11], [0, .99, 1.04]], [.027, .019, .003])];
    for (const s of [-1, 1]) {
      parts.push(tapered("狮式前足肩腕段", material.ivory, [[s * .17, .9, -.34], [s * .21, .5, -.39], [s * .23, .18, -.45]], [.075, .055, .04]), lobe("狮掌前足", material.ivory, [s * .23, .139, -.52], [.19, .12, .22]), tapered("猛禽式反曲后跗段", material.ivory, [[s * .19, .77, .62], [s * .25, .43, .48], [s * .25, .16, .77]], [.075, .045, .028]));
      for (const toe of [-1, 0, 1]) parts.push(tapered("后足分开卷下的猛禽爪趾", material.wood, [[s * .25, .16, .77], [s * .25 + toe * .055, .13, .63], [s * .25 + toe * .065, .09, .58]], [.018, .012, .003]));
    }
    return parts;
  } },
  { name: "直立孕腹塔沃瑞特守护像", theme: "异域", itemType: "器物", build: () => {
    // 家庭陈设尺度；并非把普通河马换石材或放大成虚构古代巨像。
    // https://art.thewalters.org/object/22.223/
    const parts: ModelPart[] = [box("家庭陈设低基座", [0, .018, 0], [.31, .036, .32], material.wood), lobe("明显前隆的直立孕腹", material.ivory, [0, .28, -.015], [.27, .35, .29]), lobe("连到头下的宽肩胸", material.ivory, [0, .43, .005], [.23, .2, .2]), lobe("河马式高头", material.ivory, [0, .57, -.015], [.23, .23, .25]), lobe("河马圆阔的吻部", material.ivory, [0, .53, -.16], [.2, .12, .17]), tapered("背部向下而不伸出侧身的鳄尾", material.ivory, [[0, .44, .09], [0, .28, .15], [0, .07, .23]], [.045, .035, .006])];
    for (const s of [-1, 1]) parts.push(tapered("两侧下垂的短前臂", material.ivory, [[s * .11, .44, -.005], [s * .16, .32, -.06], [s * .13, .27, -.12]], [.034, .027, .02]), lobe("孕腹上方的乳胸", material.ivory, [s * .06, .4, -.11], [.07, .1, .075]), lobe("狮式后腿", material.ivory, [s * .075, .095, .015], [.1, .14, .12]), lobe("站立宽爪足", material.ivory, [s * .075, .06, -.035], [.11, .05, .16]), lobe("头两侧小耳", material.ivory, [s * .1, .66, .02], [.05, .06, .035]));
    return parts;
  } },
  { name: "四臂象首伽内什陈设像", theme: "异域", itemType: "器物", build: () => {
    // https://kimbellart.org/collection/ap-198111
    const parts: ModelPart[] = [cylinder("完整坐像的厚圆座", [0, .08, 0], [1.45, .16, 1.08], material.wood), lobe("前隆的宽腹坐身", material.ivory, [0, .69, 0], [.72, .89, .64]), lobe("象首及额部", material.ivory, [0, 1.25, -.055], [.58, .63, .46]), tapered("从象首正中垂下并侧卷的长鼻", material.ivory, [[0, 1.26, -.23], [0, .98, -.41], [.05, .73, -.46], [-.17, .72, -.43]], [.09, .075, .06, .025]), cone("头顶收尖立冠", [0, 1.686, -.025], [.31, .34, .31], material.wood), ...[-1, 1].map(s => lobe("向两边展开的薄大象耳", material.ivory, [s * .35, 1.25, .01], [.35, .57, .13], [0, 0, -s * 12])), ...[-1, 1].map(s => lobe("盘坐在座上的完整屈膝腿", material.ivory, [s * .39, .277, .015], [.59, .28, .56], [0, s * 20, 0]))];
    for (const s of [-1, 1]) {
      parts.push(tapered("上对肩臂向两边抬起", material.ivory, [[s * .22, .94, .03], [s * .55, 1.1, .02], [s * .61, 1.4, -.01]], [.085, .065, .04]), lobe("上臂末端独立手掌", material.ivory, [s * .61, 1.43, -.01], [.11, .16, .09]), tapered("下对手臂从独立肩根伸向腹前", material.ivory, [[s * .27, .86, -.12], [s * .53, .66, -.18], [s * .35, .53, -.42]], [.08, .055, .035]), lobe("腹前下手掌", material.ivory, [s * .35, .54, -.45], [.12, .1, .13]), tapered("象吻两边实体短牙", material.wood, [[s * .15, 1.11, -.25], [s * .2, 1.04, -.38], [s * .15, .99, -.4]], [.035, .024, .003]));
    }
    return parts;
  } },
  { name: "蝎尾人面狮曼提柯尔像", theme: "奇幻", itemType: "器物", build: () => {
    // https://warburg.sas.ac.uk/sites/default/files/Box%205.%20Supernatural%20and%20leonine%20creatures.pdf
    const parts: ModelPart[] = [box("完整兽像薄基台", [0, .045, .17], [.94, .09, 2.19], material.wood), lobe("狮式收腰长躯", material.ivory, [0, .77, .16], [.67, .76, 1.31]), lobe("竖起的狮胸", material.ivory, [0, .92, -.39], [.6, .83, .61]), lobe("带明确人面比例的头颅", material.ivory, [0, 1.38, -.57], [.38, .48, .34]), box("人面鼻梁", [0, 1.39, -.725], [.06, .15, .065], material.ivory), lobe("下颌与面颊", material.ivory, [0, 1.24, -.64], [.3, .18, .27]), tapered("从臀部上举再前扣的连续蝎尾", material.wood, [[0, .92, .7], [0, .96, 1.01], [0, 1.31, 1.17], [0, 1.66, .94], [0, 1.71, .48], [0, 1.48, .28]], [.085, .08, .065, .05, .035, .01]), tapered("尾端向下刺入的钩状毒针", material.wood, [[0, 1.48, .28], [0, 1.35, .2], [0, 1.27, .31]], [.034, .023, .003])];
    for (const s of [-1, 1]) {
      for (const z of [-.38, .68]) parts.push(tapered("四足各自连接肩或臀的肢段", material.ivory, [[s * (z > 0 ? .17 : .21), z > 0 ? .78 : .88, z > 0 ? .53 : z], [s * .25, .43, z + .03], [s * .26, .17, z -.015]], [.085, .06, .04]), lobe("狮式宽爪", material.ivory, [s * .26, .139, z - .07], [.22, .12, .28]));
      parts.push(lobe("人头两侧的耳廓", material.ivory, [s * .18, 1.39, -.55], [.07, .12, .065]));
      for (let i = 0; i < 5; i++) parts.push(lobe("连接人首和狮肩的蓬鬃", material.wood, [s * (.2 + i % 2 * .025), 1.11 + i * .075, -.45 + i % 2 * .025], [.15, .22, .17]));
    }
    return parts;
  } },
  { name: "鸡首翼蛇鸡蛇兽陈设像", theme: "奇幻", itemType: "器物", build: () => {
    // https://sites.nd.edu/manuscript-studies/tag/mythology/
    const parts: ModelPart[] = [box("翼蛇兽完整基台", [0, .045, .16], [1.55, .09, 1.86], material.wood), lobe("直立而非四足的鸟兽躯干", material.ivory, [0, .75, .04], [.57, .75, .72]), tapered("鸡首下上弯的细颈", material.ivory, [[0, .93, -.19], [0, 1.2, -.32], [0, 1.45, -.31]], [.13, .1, .07]), lobe("鸡式带圆颊的头", material.ivory, [0, 1.5, -.35], [.26, .29, .3]), plate("尖而下弯的实体鸟喙", [0, 1.48, -.46], [[0, .04], [.2, -.015], [.12, -.09], [0, -.045]], .075, material.wood, [0, 90, 0]), plate("沿头顶起伏而非平片冠的鸡冠", [0, 1.6, -.3], [[-.14, 0], [-.13, .14], [-.07, .09], [-.025, .2], [.03, .1], [.09, .15], [.13, .02]], .05, material.red, [0, 90, 0]), lobe("嘴下垂肉", material.red, [0, 1.36, -.4], [.065, .16, .08]), tapered("从鸟身后长出的细长蛇尾", material.ivory, [[0, .71, .31], [0, .58, .73], [0, .82, 1.05], [.2, 1.13, .99], [.34, 1.04, .77]], [.115, .08, .055, .03, .004])];
    for (const s of [-1, 1]) {
      parts.push(plate("向两边撑开的指骨膜翼", [s * .2, .94, .04], [[0, 0], [.29, .44], [.57, .61], [.64, .51], [.39, .32], [.54, .05], [.28, .16], [.2, -.12], [0, -.13]].map(([x, y]): [number, number] => [s * x!, y!]), .04, material.ivory, [0, 0, 0]), rod("膜翼上缘的长指骨", [s * .2, .94, .04], [s * .77, 1.55, .04], .025, material.wood), tapered("两条独立反曲鸟腿", material.ivory, [[s * .16, .58, 0], [s * .23, .34, .13], [s * .23, .17, -.05]], [.065, .04, .025]));
      for (const toe of [-1, 0, 1]) parts.push(tapered("落到基台的三前趾", material.wood, [[s * .23, .17, -.05], [s * .23 + toe * .055, .13, -.19], [s * .23 + toe * .065, .09, -.24]], [.016, .011, .003]));
    }
    return parts;
  } },
  { name: "伏卧人面狮斯芬克斯像", theme: "异域", itemType: "器物", build: () => {
    // https://www.metmuseum.org/art/collection/search/544442
    const parts: ModelPart[] = [box("完整伏像石基台", [0, .065, 0], [1.05, .13, 2.59], material.wood), lobe("贴近基台的伏狮躯干", material.ivory, [0, .57, .3], [.79, .72, 1.53]), lobe("前胸上挺的狮颈肩", material.ivory, [0, .85, -.4], [.63, .83, .7]), lobe("佩戴头巾的人面头颅", material.ivory, [0, 1.32, -.58], [.4, .5, .39]), box("人面隆起鼻梁", [0, 1.34, -.766], [.06, .17, .06], material.ivory), plate("覆盖头顶及后脑的头巾", [0, 1.39, -.42], [[-.3, -.02], [-.24, .17], [-.14, .24], [.14, .24], [.24, .17], [.3, -.02], [.27, -.39], [-.27, -.39]], .15, material.ivory, [0, 0, 0]), tapered("下颌前向下伸的窄假须", material.ivory, [[0, 1.18, -.76], [0, 1.01, -.79], [0, .97, -.7]], [.05, .035, .02]), cord("狮尾沿后躯绕回石台的长尾", [[0, .71, .88], [.36, .34, 1.02], [.38, .2, .63], [.25, .2, .45]], .035, material.ivory)];
    for (const s of [-1, 1]) parts.push(lobe("连接狮胸和伏地前腿的完整厚肩肘", material.ivory, [s * .2, .49, -.38], [.31, .55, .42]), lobe("屈在后腿下并实际落接石台的后掌", material.ivory, [s * .31, .2, .79], [.3, .18, .51]), lobe("贴地向前直伸的狮前腿", material.ivory, [s * .25, .28, -.65], [.23, .24, .97]), lobe("前腿末端连成整体的宽狮掌", material.ivory, [s * .25, .209, -1.04], [.29, .19, .38]), lobe("屈在躯干下的狮后腿", material.ivory, [s * .31, .38, .74], [.33, .39, .6]));
    return parts;
  } },
  { name: "半人蛇尾厄喀德娜陈设像", theme: "欧式", itemType: "器物", build: () => {
    // https://www.theoi.com/Ther/DrakainaEkhidna1.html
    const parts: ModelPart[] = [cylinder("半人蛇尾像的低宽圆座", [0, .045, .07], [1.63, .09, 1.48], material.wood), tapered("从人腰向下盘绕且连续收尖的蛇体", material.ivory, [[0, .86, 0], [.35, .43, .12], [.5, .23, .48], [.05, .2, .72], [-.55, .21, .38], [-.55, .22, -.25], [0, .23, -.55], [.4, .23, -.25]], [.18, .17, .15, .13, .1, .07, .04, .004]), lobe("与蛇体真实连接的人形胸腰", material.ivory, [0, 1.1, -.01], [.42, .65, .29]), cylinder("上身与头连接的颈", [0, 1.42, -.015], [.12, .15, .12], material.ivory), lobe("完整人首", material.ivory, [0, 1.63, -.035], [.27, .33, .26]), lobe("头后和肩后披下的发团", material.wood, [0, 1.56, .065], [.33, .48, .18])];
    for (const s of [-1, 1]) parts.push(tapered("左右各自展开的手臂", material.ivory, [[s * .16, 1.27, -.01], [s * .39, 1.12, -.12], [s * .5, 1.26, -.17]], [.055, .04, .025]), lobe("手臂端的完整手掌", material.ivory, [s * .52, 1.28, -.17], [.08, .13, .075]));
    return parts;
  } },
];
