import { part, type ModelPart } from "../assetModelParts";
import { polygon } from "../masterNature/shared";
import { clothShell, ovalPoints } from "./garmentExpansionBatchOne";
import { box, cylinder, ball, cone, rod, loop, cord, plate, piercedPanel, material, type MasterPrototype } from "./parts";
import { CatmullRomCurve3, Vector3 } from "three";

const textile = "#7c989b", pale = "#d8d2bb", skin = "#a77056";

function eyeCircle(x: number, y: number, rx: number, ry = rx): [number, number][] {
  return ovalPoints(rx, ry, 12).map(([a, b]) => [x + a, y + b]);
}

function faceBlank(name: string, outline: [number, number][], holes: [number, number][][], color = material.wood, width = .11, curve = .035, thickness = .006, centerY = .16, z = 0): ModelPart {
  const panel = piercedPanel(name, [0, 0, 0], outline, holes, thickness, color);
  panel.vertices = panel.vertices!.map(vertex => ({ x: vertex.x, y: centerY + vertex.z, z: z + curve * (vertex.x * vertex.x / (width * width) - 1) - vertex.y }));
  return panel;
}

function maskTies(y = .19): ModelPart[] {
  return [cord("从两侧眼线高度绕至脑后的佩戴系带", [[-.095, y, .005], [-.11, y, .13], [.11, y, .13], [.095, y, .005]], .007, material.dark)];
}

function softShoeBase(): ModelPart {
  return polygon("前宽后窄并有足弓收腰的整体足底", material.wood, [[-.034, -.15], [.03, -.15], [.052, -.095], [.05, -.01], [.041, .11], [.025, .145], [-.026, .145], [-.044, .09], [-.049, -.03], [-.05, -.095]], .015);
}

function flyMesh(): ModelPart[] {
  const rings = [{ y: 0, rx: .11, rz: .13 }, { y: .13, rx: .13, rz: .14 }, { y: .32, rx: .085, rz: .1 }, { y: .48, rx: .067, rz: .075 }];
  return [{ ...clothShell("颈端和鼻端都开放的透视防蝇罩网", rings, material.dark, undefined, [0, .17, .2], [-90, 0, 0], .002), opacity: .2 }, ...Array.from({ length: 10 }, (_, index) => {
    const angle = index * Math.PI / 5;
    return cord("沿长马脸布罩纵向缝合的细网经", rings.map(ring => [Math.cos(angle) * ring.rx, .17 + Math.sin(angle) * ring.rz, .2 - ring.y]), .0015, pale);
  }), ...rings.map(ring => {
    const edge = loop("马面罩各断面的细网纬", [0, .17, .2 - ring.y], ring.rx, .002, [90, 0, 0], pale);
    edge.scale.z = ring.rz / ring.rx;
    return edge;
  })];
}

function bentTrunk(): ModelPart {
  const curve = new CatmullRomCurve3([new Vector3(0, .15, -.04), new Vector3(0, .125, -.11), new Vector3(0, -.03, -.15), new Vector3(0, -.13, -.12), new Vector3(0, -.14, -.065), new Vector3(0, -.09, -.045)]), steps = 12, sides = 12, layer = (steps + 1) * sides;
  const vertices: NonNullable<ModelPart["vertices"]> = [], indices: number[] = [];
  for (let inner = 0; inner < 2; inner++) for (let step = 0; step <= steps; step++) {
    const t = step / steps, center = curve.getPoint(t), cross = new Vector3(1, 0, 0).cross(curve.getTangent(t)).normalize(), radius = .035 - t * .02 - inner * .004;
    for (let side = 0; side < sides; side++) { const angle = side * Math.PI * 2 / sides, point = center.clone().add(new Vector3(Math.cos(angle) * radius, 0, 0)).addScaledVector(cross, Math.sin(angle) * radius); vertices.push({ x: point.x, y: point.y, z: point.z }); }
  }
  for (let step = 0; step < steps; step++) for (let side = 0; side < sides; side++) {
    const a = step * sides + side, b = (step + 1) * sides + side, c = (step + 1) * sides + (side + 1) % sides, d = step * sides + (side + 1) % sides;
    indices.push(a, b, c, a, c, d, a + layer, c + layer, b + layer, a + layer, d + layer, c + layer);
  }
  for (const step of [0, steps]) for (let side = 0; side < sides; side++) {
    const a = step * sides + side, b = step * sides + (side + 1) % sides;
    indices.push(...(step ? [a, b + layer, b, a, a + layer, b + layer] : [a, b, b + layer, a, b + layer, a + layer]));
  }
  return part("根端与卷起鼻端都真实开口的渐细弯鼻壳", "mesh", textile, [0, 0, 0], [1, 1, 1], [0, 0, 0], { vertices, indices });
}

export const garmentExpansionBatchThreeObjects: MasterPrototype[] = [
  { name: "硬盘水平展摆芭蕾蓬裙", itemType: "服饰", theme: "欧式", build: () => [
    clothShell("裙腰向水平裙盘展开的上层挺纱", [{ y: .055, rx: .53, rz: .49, ripple: .035 }, { y: .09, rx: .45, rz: .42, ripple: .05 }, { y: .12, rx: .215, rz: .145 }, { y: .27, rx: .17, rz: .115 }], pale),
    clothShell("露出上层边缘之下的连续下层纱盘", [{ y: .02, rx: .5, rz: .465, ripple: .04 }, { y: .075, rx: .21, rz: .14 }, { y: .14, rx: .185, rz: .125 }], "#bcb7ab"),
    clothShell("真正贯通并贴腰的独立裙腰", [{ y: .24, rx: .175, rz: .12 }, { y: .295, rx: .175, rz: .12 }], textile),
    ...Array.from({ length: 8 }, (_, index) => { const angle = index * Math.PI / 4; return rod("嵌在挺纱裙盘内的放射支骨", [Math.cos(angle) * .21, .118, Math.sin(angle) * .145], [Math.cos(angle) * .5, .063, Math.sin(angle) * .465], .0035, pale); }),
  ] },
  { name: "低裆双收踝灯笼裤", itemType: "服饰", theme: "异域", build: () => [
    clothShell("腰部与低垂裆部之间连续鼓起的裤身", [{ y: .405, rx: .32, rz: .18 }, { y: .62, rx: .38, rz: .22 }, { y: .89, rx: .235, rz: .145 }, { y: .96, rx: .225, rz: .14 }], textile),
    polygon("真实留出双腿开口的低裆连接裁片", textile, ovalPoints(.32, .18), .006, [0, .4, 0], [-1, 1].map(side => ovalPoints(.13, .14).map(([x, z]): [number, number] => [x + side * .15, z]))),
    ...[-1, 1].flatMap(side => [clothShell("下段从鼓起膝部收进脚踝的独立裤筒", [{ y: .025, rx: .047, rz: .052 }, { y: .1, rx: .07, rz: .08 }, { y: .23, rx: .13, rz: .14 }, { y: .405, rx: .13, rz: .14 }], textile, undefined, [side * .15, 0, 0]), clothShell("裤脚真正开口的束踝带", [{ y: .02, rx: .052, rz: .057 }, { y: .065, rx: .052, rz: .057 }], material.dark, undefined, [side * .15, 0, 0])]),
    clothShell("裤腰收褶的宽松紧带", [{ y: .89, rx: .24, rz: .15, ripple: .025 }, { y: .965, rx: .23, rz: .145, ripple: .025 }], material.dark),
  ] },
  { name: "短袖领口封底婴儿睡袋衣", itemType: "服饰", theme: "现代", build: () => [
    clothShell("两臂有洞且脚部不分腿的立体袋衣", [{ y: .025, rx: .18, rz: .1 }, { y: .28, rx: .22, rz: .14 }, { y: .48, rx: .19, rz: .105 }, { y: .62, rx: .17, rz: .095 }, { y: .7, rx: .046, rz: .042 }], pale, (row, column) => row === 2 && [0, 7, 8, 15].includes(column)),
    cylinder("封住袋底而让双脚在内部活动的柔软底片", [0, .015, 0], [.36, .025, .2], pale),
    ...[-1, 1].map(side => clothShell("接在真实袖笼上的短开放袖筒", [{ y: 0, rx: .055, rz: .057 }, { y: .19, rx: .04, rz: .042 }], pale, undefined, [side * .17, .59, 0], [0, 0, -side * 126])),
    rod("袋衣前方由袋底到领口的整条拉链", [0, .05, -.105], [0, .69, -.043], .006, textile),
    clothShell("领口内部可看穿的柔软包边", [{ y: .686, rx: .05, rz: .046 }, { y: .714, rx: .047, rz: .043 }], textile),
    box("防止拉链夹到颏部的折回软布片", [.014, .677, -.05], [.035, .042, .006], textile),
  ] },
  // 侧翼与双垂片结构参考 The Met《The Art of Ancient Egypt》及 GEM Nemes 词条。
  { name: "双侧翼垂片尼美斯头巾", itemType: "服饰", theme: "异域", build: () => [
    clothShell("覆盖头顶后部而前脸开放的整幅头巾", [{ y: .31, rx: .09, rz: .105 }, { y: .41, rx: .105, rz: .115 }, { y: .49, rx: .075, rz: .09 }, { y: .54, rx: 0, rz: 0 }], textile, (row, column) => row < 2 && [10, 11, 12, 13].includes(column), [0, 0, .035]),
    ...[-1, 1].map(side => plate("从耳旁向外撑展再垂至胸前的独立巾片", [side * .14, .255, -.018], [[-.055, .2], [.045, .19], [.115, .08], [.055, -.225], [-.04, -.225], [-.05, -.055]].map(([x, y]): [number, number] => [side * x!, y!]), .006, textile, [0, -side * 12, 0])),
    plate("巾后垂至颈根的连续收束片", [0, .235, .132], [[-.08, .16], [.08, .16], [.07, -.12], [.025, -.205], [-.025, -.205], [-.07, -.12]], .006, textile, [-5, 0, 0]),
    ...[-1, 1].flatMap(side => Array.from({ length: 6 }, (_, index) => rod("横过胸前垂片的实体窄织带", [side * .105, .065 + index * .047, -.031], [side * .195, .065 + index * .047, -.05], .004, pale))),
    cord("前额横接左右巾片的固定织边", [[-.09, .406, -.025], [0, .425, -.085], [.09, .406, -.025]], .01, pale),
    cord("把后巾尾卷束在颈根的窄缎带", [[-.028, .055, .14], [0, .04, .16], [.028, .055, .14]], .008, pale),
  ] },
  { name: "开腿桶座滑翔伞悬吊座袋", itemType: "服饰", theme: "现代", build: () => [
    clothShell("上胸敞开且底部留两腿洞的柔性桶座", [{ y: .12, rx: .235, rz: .2 }, { y: .3, rx: .25, rz: .22 }, { y: .65, rx: .22, rz: .16 }, { y: .92, rx: .2, rz: .13 }], textile, (row, column) => row >= 1 && [9, 10, 11, 12, 13, 14].includes(column)),
    polygon("用分开的腿口承住臀部的整体座片", material.dark, ovalPoints(.235, .2), .025, [0, .11, 0], [-1, 1].map(side => ovalPoints(.082, .085).map(([x, z]): [number, number] => [x + side * .105, z - .05]))),
    ...[-1, 1].map(side => cord("从座底经前腿侧到肩部的连续承重吊带", [[side * .17, .12, -.11], [side * .26, .42, -.07], [side * .21, .88, .08], [side * .16, .93, .12]], .025, material.dark)),
    ...[-1, 1].map(side => cord("从座底后缘通向伞绳主挂点的后承重带", [[side * .17, .13, .15], [side * .24, .49, -.03], [side * .26, .65, -.04]], .025, material.dark)),
    ...[-1, 1].map(side => loop("侧面的独立主悬挂锁环", [side * .26, .65, -.04], .04, .009, [90, 0, 0], material.steel)),
    rod("在胸口扣住两条肩带的横向快拆带", [-.235, .51, -.075], [.235, .51, -.075], .023, material.dark),
    box("胸前快卸扣", [0, .51, -.075], [.065, .045, .028], pale),
  ] },
  { name: "马蹄气囊式充气救生领", itemType: "服饰", theme: "现代", build: () => [
    ...[-1, 1].map(side => clothShell("沿前胸下垂而不封住中间胸口的气囊腿", [{ y: .035, rx: .045, rz: .06 }, { y: .12, rx: .075, rz: .08 }, { y: .4, rx: .07, rz: .075 }, { y: .5, rx: .06, rz: .07 }], material.red, undefined, [side * .115, 0, -.025], [0, 0, -side * 6], .006)),
    ...[-1, 1].map(side => ball("把下垂气囊末端真正封合的圆弧端盖", [side * .119, .035, -.025], [.09, .07, .12], material.red)),
    cord("绕过后颈并连起左右前胸气囊的马蹄上弧", [[-.16, .48, -.025], [-.17, .53, .07], [0, .56, .13], [.17, .53, .07], [.16, .48, -.025]], .067, material.red),
    clothShell("穿戴者腰部开放的固定束带", [{ y: .065, rx: .205, rz: .13 }, { y: .1, rx: .205, rz: .13 }], material.dark),
    ...[-1, 1].map(side => cord("后气囊与腰带之间的调节带", [[side * .12, .5, .11], [side * .16, .08, .1]], .014, material.dark)),
    cylinder("左侧口吹充气的短阀管", [-.175, .37, -.095], [.019, .12, .019], material.dark, [-12, 0, 0]),
    box("右侧自动充气触发器护套", [.178, .18, -.076], [.04, .09, .035], material.dark),
    cord("从触发器垂出的拉动环带", [[.178, .17, -.08], [.19, .095, -.1]], .006, pale),
  ] },
  { name: "鼻兜软裙边单窗潜水面镜", itemType: "服饰", theme: "现代", build: () => {
    const outline: [number, number][] = [[-.09, -.04], [-.04, -.045], [0, -.03], [.04, -.045], [.09, -.04], [.1, .035], [.07, .06], [-.07, .06], [-.1, .035]], opening: [number, number][] = [[-.08, -.028], [-.034, -.03], [0, -.012], [.034, -.03], [.08, -.028], [.085, .03], [.06, .045], [-.06, .045], [-.085, .03]];
    return [faceBlank("中央真正贯通的单窗硬质镜框", outline, [opening], textile, .1, 0, .008, .08, .026), faceBlank("前镜框后部向脸部展开的真实空心软裙边", outline.map(([x, y]): [number, number] => [x * 1.05, y * 1.08]), [opening], material.dark, .105, 0, .035, .08, .061), { ...plate("装入框内的整片透明防水镜窗", [0, .08, .02], opening, .003, material.glass, [0, 0, 0]), opacity: .3 }, clothShell("根部开口供鼻部伸入的独立软鼻兜", [{ y: 0, rx: .028, rz: .027 }, { y: .04, rx: .026, rz: .035 }, { y: .065, rx: .013, rz: .025 }, { y: .075, rx: 0, rz: 0 }], material.dark, undefined, [0, .043, .04], [-90, 0, 0], .004), cord("从镜框两端绕过后脑的分叉头带", [[-.098, .09, .04], [-.108, .09, .16], [0, .09, .23], [.108, .09, .16], [.098, .09, .04]], .012, material.dark), ...[-1, 1].map(side => box("镜带两端的独立调节扣", [side * .105, .09, .05], [.023, .032, .022], textile))];
  } },
  { name: "软密封双杯分离游泳镜", itemType: "服饰", theme: "现代", build: () => [
    ...[-1, 1].map(side => clothShell("前小后展且眼窝真正留空的独立眼杯", [{ y: 0, rx: .035, rz: .025 }, { y: .035, rx: .041, rz: .03 }], textile, undefined, [side * .049, .04, -.02], [90, 0, 0], .004)),
    ...[-1, 1].map(side => ({ ...cylinder("盖住眼杯前口的透明椭圆镜片", [side * .049, .04, -.019], [.064, .003, .045], material.glass, [90, 0, 0]), opacity: .3 })),
    rod("两眼杯之间单独弯曲的鼻梁桥", [-.015, .045, -.02], [.015, .045, -.02], .008, material.dark),
    cord("不带镜腿而完整绕过脑后的双杯镜带", [[-.09, .04, .005], [-.095, .045, .12], [0, .05, .18], [.095, .045, .12], [.09, .04, .005]], .006, material.dark),
    ...[-1, 1].map(side => box("眼杯外侧穿镜带的窄连接耳", [side * .091, .04, 0], [.02, .017, .012], textile)),
  ] },
  { name: "竖栅面金垂肩剑道面盔", itemType: "服饰", theme: "日式", build: () => [
    clothShell("后脑开放而头顶包覆的布衬面盔", [{ y: .16, rx: .105, rz: .115 }, { y: .3, rx: .11, rz: .12 }, { y: .4, rx: .07, rz: .08 }, { y: .43, rx: 0, rz: 0 }], material.dark, (row, column) => row < 2 && [10, 11, 12, 13, 3, 4].includes(column)),
    cord("围绕脸部真实洞口的厚护面缘", [[-.09, .17, -.09], [-.115, .27, -.115], [-.075, .385, -.1], [.075, .385, -.1], [.115, .27, -.115], [.09, .17, -.09], [0, .13, -.09], [-.09, .17, -.09]], .023, material.dark),
    ...Array.from({ length: 9 }, (_, index) => { const x = (index - 4) * .021; return rod("面金前方可看穿的独立竖向钢栅", [x, .155 + Math.abs(index - 4) * .006, -.115], [x, .375 - Math.abs(index - 4) * .008, -.115], .005, material.steel); }),
    ...[.2, .29, .35].map(y => rod("联接竖栅而非封脸的横金", [-.102, y, -.115], [.102, y, -.115], .005, material.steel)),
    ...[-1, 1].map(side => plate("沿两侧下垂并展开护住肩部的厚布垂", [side * .14, .13, .015], [[-.06, .09], [.06, .09], [.115, -.09], [0, -.13], [-.075, -.06]], .018, material.dark, [0, side * 24, side * 9])),
    plate("前颈独立的尖形咽喉垂", [0, .1, -.08], [[-.055, .045], [.055, .045], [.06, -.04], [0, -.1], [-.06, -.04]], .02, textile, [0, 0, 0]),
    ...[-1, 1].map(side => cord("脑后交结的长系面绳", [[side * .1, .24, .04], [-side * .08, .27, .14], [side * .09, .06, .17]], .007, pale)),
  ] },
  // 通风纵肋与后部调节结构参考 Giro 官方骑行头盔图；不使用实心壳上的黑贴片。
  { name: "纵肋通风空槽自行车头盔", itemType: "服饰", theme: "现代", build: () => [
    ...[-.072, -.036, 0, .036, .072].map(x => {
      const height = .145 * Math.sqrt(1 - x * x / (.11 * .11)), length = Math.sqrt(1 - x * x / (.105 * .105));
      return cord("前后贯通气槽之间的独立拱形吸能肋", [[x, .045, -.125 * length], [x, .045 + height * .7, -.075], [x, .045 + height, .015], [x, .045 + height * .65, .1], [x, .04, .145 * length]], .014, textile);
    }),
    ...[-.045, .065].map(z => cord("把各纵肋连接起来的真实横向拱骨", [[-.095, .05, z], [-.06, .135, z], [0, .17, z], [.06, .135, z], [.095, .05, z]], .009, material.dark)),
    clothShell("头盔内侧开放且可看到上部气槽的调节头箍", [{ y: .027, rx: .097, rz: .126 }, { y: .053, rx: .101, rz: .13 }], material.dark),
    ...[-1, 1].map(side => cord("从前后两根盔带汇至下颏的Y形束带", [[side * .08, .04, -.08], [side * .07, -.06, .01], [side * .08, .04, .095]], .006, material.dark)),
    rod("在下颏扣合的窄带", [-.07, -.06, .01], [.07, -.06, .01], .009, material.dark),
    cylinder("后脑旋钮调节盘", [0, .045, .14], [.027, .016, .027], pale, [90, 0, 0]),
  ] },
  { name: "扇面高冠科科什尼克头饰", itemType: "服饰", theme: "异域", build: () => [
    clothShell("位于扇冠后方而下面真正开口的戴头帽兜", [{ y: .025, rx: .088, rz: .105 }, { y: .12, rx: .087, rz: .1 }, { y: .175, rx: .055, rz: .065 }, { y: .19, rx: 0, rz: 0 }], pale, undefined, [0, 0, .04]),
    plate("底部为头部留下弧形凹口的整幅高扇冠板", [0, .08, -.035], [[-.15, 0], [-.22, .13], [-.18, .27], [0, .355], [.18, .27], [.22, .13], [.15, 0], [.09, .045], [0, .085], [-.09, .045]], .012, material.red, [0, 0, 0]),
    cord("沿扇面外轮廓连续包覆的立体窄缘", [[-.15, .08, -.044], [-.22, .21, -.044], [-.18, .35, -.044], [0, .435, -.044], [.18, .35, -.044], [.22, .21, -.044], [.15, .08, -.044]], .008, pale),
    ...[-1, 1].map(side => cord("扇冠两端交结到后颈的宽系带", [[side * .12, .1, 0], [side * .12, .09, .15], [side * .025, .035, .18]], .013, material.red)),
    ...[-1, 0, 1].map(index => rod("把高扇冠固定到帽兜的背部短支条", [index * .07, .14, -.025], [index * .07, .13, .055], .008, pale)),
  ] },
  { name: "双耳套长面马匹防蝇罩", itemType: "服饰", theme: "现代", build: () => [
    ...flyMesh(),
    ...[-1, 1].map(side => clothShell("与网罩后端相连而尖端封合的立体马耳袋", [{ y: .24, rx: .035, rz: .04 }, { y: .35, rx: .03, rz: .035 }, { y: .46, rx: .018, rz: .022 }, { y: .49, rx: 0, rz: 0 }], textile, undefined, [side * .07, 0, .16], [0, 0, -side * 12], .003)),
    clothShell("鼻端真正贯通的软布防磨口缘", [{ y: 0, rx: .07, rz: .079 }, { y: .035, rx: .071, rz: .08 }], textile, undefined, [0, .17, -.28], [90, 0, 0]),
    cord("在下颌处固定面罩的可调扣带", [[-.11, .15, .15], [-.075, .025, .09], [.075, .025, .09], [.11, .15, .15]], .014, textile),
    box("颌下固定带的独立快扣", [0, .025, .09], [.055, .026, .025], material.dark),
  ] },
  { name: "前胸Y形犬用胸背牵引带", itemType: "服饰", theme: "现代", build: () => [
    clothShell("完整围住前胸后部而内部留给躯干的宽胸环", [{ y: 0, rx: .145, rz: .19 }, { y: .045, rx: .145, rz: .19 }], textile, undefined, [0, .2, .1], [90, 0, 0], .006),
    clothShell("倾斜围住颈根且不勒住喉部的前环", [{ y: 0, rx: .09, rz: .125 }, { y: .035, rx: .09, rz: .125 }], textile, undefined, [0, .3, -.18], [65, 0, 0], .006),
    rod("沿脊背把前颈环连接到胸环的宽背条", [0, .42, -.215], [0, .39, .125], .035, textile),
    cord("由前胸分叉而在腹下汇合的Y形承力条", [[-.065, .24, -.14], [0, .12, -.16], [.065, .24, -.14]], .022, textile),
    rod("从Y形胸骨条经腹部接到后胸环的底条", [0, .12, -.16], [0, .02, .12], .026, textile),
    loop("脊背处接牵引绳的独立D形金属环", [0, .414, .04], .025, .006, [90, 0, 0], material.steel),
    ...[-1, 1].map(side => box("胸环两侧的独立快卸扣", [side * .147, .2, .12], [.025, .055, .043], material.dark)),
  ] },
  { name: "圆肩杯叠翼铰接护肩甲", itemType: "服饰", theme: "欧式", build: () => [
    clothShell("下面开放并容纳肩峰的圆弧整体肩杯", [{ y: .24, rx: .145, rz: .17 }, { y: .32, rx: .155, rz: .17 }, { y: .405, rx: .105, rz: .12 }, { y: .435, rx: 0, rz: 0 }], material.steel, (_, column) => [3, 4].includes(column), [0, 0, 0], [0, 0, 0], .007),
    ...Array.from({ length: 4 }, (_, index) => clothShell("从肩杯下面层叠并可滑动的弧形肩翼甲片", [{ y: .045 + index * .048, rx: .1 + index * .012, rz: .12 + index * .012 }, { y: .12 + index * .048, rx: .11 + index * .012, rz: .13 + index * .012 }], material.steel, (_, column) => [3, 4, 5, 6].includes(column), [0, 0, 0], [0, 0, 0], .005)),
    ...[-1, 1].flatMap(side => Array.from({ length: 4 }, (_, index) => cylinder("肩翼沿侧缘各自铰接的圆铆销", [side * (.105 + index * .012), .105 + index * .048, 0], [.016, .018, .016], material.wood, [0, 0, 90]))),
    cord("在上臂内侧扣合的皮束带", [[-.1, .09, .04], [0, .085, .145], [.1, .09, .04]], .014, material.wood),
    cord("从肩杯系到衣甲肩缝的固定皮带", [[-.09, .35, .03], [-.16, .36, .075], [-.18, .3, .08]], .016, material.wood),
  ] },
  { name: "叠趾片铰接铠甲足靴", itemType: "服饰", theme: "欧式", build: () => [
    { ...softShoeBase(), name: "足甲下方可看见前掌与足弓的薄足底", color: material.steel },
    ...Array.from({ length: 6 }, (_, index) => plate("前后相压而内部留空的独立弧形趾甲片", [0, .016, -.127 + index * .037], [[-.048, 0], [-.047, .032], [-.025, .057], [.025, .057], [.047, .032], [.048, 0], [.04, 0], [.039, .027], [.023, .047], [-.023, .047], [-.039, .027], [-.04, 0]].map(([x, y]): [number, number] => [x!, y! * (1 + index * .14)]), .046, material.steel, [0, 0, 0])),
    plate("只封住足尖前端的弧顶趾甲盖", [0, .016, -.15], [[-.048, 0], [-.04, .04], [-.02, .057], [.02, .057], [.04, .04], [.048, 0]], .006, material.steel, [0, 0, 0]),
    clothShell("从后足包向踝部而真正可穿入的甲筒", [{ y: .05, rx: .052, rz: .055 }, { y: .13, rx: .052, rz: .055 }, { y: .18, rx: .047, rz: .05 }], material.steel, undefined, [0, 0, .085], [0, 0, 0], .005),
    ...[-1, 1].flatMap(side => Array.from({ length: 5 }, (_, index) => cylinder("连接各趾甲片侧缘的可见铰钉", [side * .047, .044, -.1 + index * .037], [.012, .014, .012], material.wood, [0, 0, 90]))),
  ] },
  { name: "双侧铰链大腿小腿膝关节支具", itemType: "服饰", theme: "现代", build: () => [
    clothShell("前方开放的大腿C形承托壳", [{ y: .43, rx: .082, rz: .078 }, { y: .63, rx: .095, rz: .085 }], pale, (_, column) => [10, 11, 12, 13].includes(column), [0, 0, 0], [0, 0, 0], .005),
    clothShell("前方开放的小腿C形承托壳", [{ y: .035, rx: .057, rz: .059 }, { y: .245, rx: .07, rz: .071 }], pale, (_, column) => [10, 11, 12, 13].includes(column), [0, 0, 0], [0, 0, 0], .005),
    ...[-1, 1].flatMap(side => [rod("从上承壳向膝部伸出的侧支条", [side * .092, .54, 0], [side * .09, .325, 0], .017), rod("从膝部接到小腿承壳的侧支条", [side * .09, .325, 0], [side * .067, .135, 0], .017), cylinder("两侧都具有实际中心轴的膝关节铰盘", [side * .09, .325, 0], [.075, .027, .075], material.dark, [0, 0, 90]), cylinder("铰盘外侧可见的止动调节钮", [side * .108, .325, 0], [.025, .016, .025], textile, [0, 0, 90])]),
    ...[.09, .205, .47, .59].map(y => clothShell("跨越壳体前开口并固定腿部的窄绑带", [{ y, rx: y < .3 ? .071 : .096, rz: y < .3 ? .073 : .086 }, { y: y + .025, rx: y < .3 ? .071 : .096, rz: y < .3 ? .073 : .086 }], textile)),
  ] },
  { name: "后侧支条L形踝足矫形器", itemType: "服饰", theme: "现代", build: () => [
    { ...softShoeBase(), name: "足底整片开放式热塑矫形足板", color: pale },
    box("从足跟连续向上承接小腿的后侧刚性支条", [0, .215, .123], [.055, .41, .018], pale),
    clothShell("脚踝后方贴合而前方开放的弧形跟托", [{ y: .035, rx: .044, rz: .048 }, { y: .14, rx: .047, rz: .05 }], pale, (_, column) => [9, 10, 11, 12, 13, 14].includes(column), [0, 0, .075], [0, 0, 0], .005),
    clothShell("支条上端容纳小腿的开放弧形承壳", [{ y: .29, rx: .047, rz: .052 }, { y: .41, rx: .051, rz: .057 }], pale, (_, column) => [10, 11, 12, 13].includes(column), [0, 0, .075], [0, 0, 0], .005),
    clothShell("小腿前方闭合的实际固定绑带", [{ y: .335, rx: .054, rz: .06 }, { y: .365, rx: .054, rz: .06 }], textile, undefined, [0, 0, .075]),
    cord("从足板两侧越过足背的可调固定带", [[-.047, .02, -.02], [-.04, .075, .015], [.04, .075, .015], [.047, .02, -.02]], .015, textile),
  ] },
  // 组合冠体轮廓参考 NYU ISAW「Head of a Ptolemaic King」与 The Met 埃及王冠图。
  { name: "高背红冠白葫冠佩什恩特双冠", itemType: "服饰", theme: "异域", build: () => [
    clothShell("下方头口开放且后缘向上张开的红冠基体", [{ y: .015, rx: .088, rz: .108 }, { y: .1, rx: .105, rz: .118 }, { y: .16, rx: .102, rz: .11 }], material.red),
    plate("立在白冠后侧而非绕成圆筒的高背红冠片", [0, .14, .105], [[-.092, -.035], [.092, -.035], [.085, .275], [-.085, .275]], .012, material.red, [-4, 0, 0]),
    clothShell("从窄冠根扩成白葫形并收圆顶的上冠", [{ y: .11, rx: .075, rz: .082 }, { y: .27, rx: .07, rz: .07, z: -.01 }, { y: .4, rx: .053, rz: .055, z: -.02 }, { y: .45, rx: .056, rz: .057, z: -.02 }, { y: .5, rx: .037, rz: .04, z: -.015 }, { y: .515, rx: 0, rz: 0, z: -.015 }], pale),
    cord("从红冠前额向前伸出后再回卷的细长冠舌", [[0, .15, -.11], [0, .26, -.16], [0, .32, -.15], [0, .325, -.115], [0, .29, -.11]], .009, material.red),
    clothShell("红白冠交接处实际环绕的窄编缘", [{ y: .13, rx: .106, rz: .119 }, { y: .153, rx: .105, rz: .118 }], material.wood),
  ] },
  { name: "一片裁皮格栅高踝罗马凉鞋", itemType: "服饰", theme: "欧式", build: () => [
    softShoeBase(),
    clothShell("从鞋底连续翻起且真实镂格的整张裁皮笼", [{ y: .016, rx: .052, rz: .14, z: -.01 }, { y: .07, rx: .052, rz: .12 }, { y: .13, rx: .047, rz: .06, z: .065 }, { y: .215, rx: .046, rz: .05, z: .075 }], material.wood, (row, column) => (row === 0 && column % 2 === 0) || (row === 1 && [2, 3, 4, 5, 10, 11, 12, 13].includes(column)) || (row === 2 && [11, 12].includes(column)), [0, 0, 0], [0, 0, 0], .004),
    cord("从足背到踝前来回穿过皮格边缘的连续系带", [[-.022, .08, -.008], [.022, .11, .012], [-.022, .14, .023], [.022, .175, .025], [-.022, .208, .025]], .003, material.dark),
    ...[-1, 1].map(side => cord("绕后踝扣合的皮口缘", [[side * .045, .2, .075], [side * .035, .216, .11], [0, .219, .125]], .006, material.wood)),
    ...Array.from({ length: 5 }, (_, index) => cylinder("鞋底前掌可见的金属防滑钉", [(index % 2 ? -1 : 1) * .022, .002, -.09 + index * .042], [.008, .004, .008], material.dark)),
  ] },
  { name: "弹性口兜发软网发袋", itemType: "服饰", theme: "现代", build: () => [
    ...Array.from({ length: 16 }, (_, index) => { const a = index * Math.PI / 8; return cord("从兜底编向头口的斜向发网经线", [[0, .015, .065], [Math.cos(a - .15) * .055, .06, .065 + Math.sin(a - .15) * .065], [Math.cos(a) * .105, .13, .045 + Math.sin(a) * .115], [Math.cos(a + .15) * .095, .22, Math.sin(a + .15) * .105]], .0015, material.dark); }),
    ...[.075, .12, .165, .205].map((y, index) => { const r = [.072, .102, .102, .096][index]!, edge = loop("与斜经真实交叉的环绕网纬", [0, y, index < 2 ? .05 : .02], r, .0015, [0, 0, 0], material.dark); edge.scale.z = 1.1; return edge; }),
    clothShell("发袋开口处实际环绕且可看穿的弹性口缘", [{ y: .21, rx: .099, rz: .109 }, { y: .235, rx: .097, rz: .107 }], textile),
    ...[-1, 1].map(side => cord("头口后方交结的短织带", [[side * .045, .22, .095], [side * .01, .215, .13], [side * .035, .16, .145]], .006, textile)),
  ] },
  { name: "四折侧翼高前襟护士帽", itemType: "服饰", theme: "现代", build: () => [
    polygon("中间头口完全开放的薄布帽带", pale, ovalPoints(.091, .108), .008, [0, .015, 0], [ovalPoints(.081, .098)]),
    plate("正面向上展开而两端折回的护士帽前襟", [0, .067, -.08], [[-.12, -.045], [.12, -.045], [.145, .035], [.07, .085], [-.07, .085], [-.145, .035]], .006, pale, [8, 0, 0]),
    ...[-1, 1].map(side => plate("从前襟两端向后斜折的侧翼", [side * .086, .055, -.012], [[-.075, -.035], [.075, -.035], [.07, .04], [-.05, .065]], .006, pale, [0, side * 65, 0])),
    ...[-1, 1].map(side => plate("在后脑交叠成菱角的第二重折片", [side * .05, .055, .075], [[-.06, -.03], [.06, -.03], [.05, .04], [-.04, .055]], .006, pale, [0, side * 20, 0])),
    cylinder("固定后方交叠折片的小扣", [0, .062, .095], [.012, .006, .012], material.steel, [90, 0, 0]),
  ] },
  // 长鼻与真实眼口洞参考 Seattle Asian Art Museum 藏品 45.104；非鸟喙防护面具。
  { name: "长直鼻鼓眉天狗木面具", itemType: "服饰", theme: "日式", build: () => [
    faceBlank("眼孔鼻根和口部均贯通的凸面木脸", [[-.075, -.12], [.075, -.12], [.1, -.03], [.095, .09], [.06, .14], [-.06, .14], [-.095, .09], [-.1, -.03]], [eyeCircle(-.047, .055, .028, .013), eyeCircle(.047, .055, .028, .013), eyeCircle(0, .005, .018), eyeCircle(0, -.068, .043, .012)], material.red),
    clothShell("从脸内鼻孔连续向外凸出的长直鼻筒", [{ y: 0, rx: .021, rz: .021 }, { y: .13, rx: .023, rz: .022 }, { y: .22, rx: .018, rz: .019 }, { y: .242, rx: 0, rz: 0 }], material.red, undefined, [0, .165, -.036], [-90, 0, 0], .004),
    ...[-1, 1].map(side => cord("高拱但不挡住眼孔的独立浓眉", [[side * .018, .25, -.045], [side * .045, .265, -.055], [side * .08, .245, -.025]], .012, material.dark)),
    ...[-1, 0, 1].map(index => box("在张开的口洞上缘露出的独立小齿", [index * .024, .098, -.04], [.015, .012, .009], pale)),
    ...maskTies(.21),
  ] },
  { name: "双曲角外翻獠牙鬼面具", itemType: "服饰", theme: "奇幻", build: () => [
    faceBlank("宽额收颏并有眼口真洞的凹背鬼面", [[-.06, -.15], [.06, -.15], [.12, -.055], [.13, .06], [.08, .145], [-.08, .145], [-.13, .06], [-.12, -.055]], [eyeCircle(-.055, .05, .03, .015), eyeCircle(.055, .05, .03, .015), [[-.065, -.045], [.065, -.045], [.052, -.103], [-.052, -.103]]], skin, .13, .045),
    ...[-1, 1].map(side => clothShell("由额部弯向外上的中空尖角", [{ y: 0, rx: .025, rz: .025 }, { y: .07, rx: .02, rz: .02, x: side * .015 }, { y: .14, rx: .009, rz: .01, x: side * .025 }, { y: .17, rx: 0, rz: 0, x: side * .02 }], pale, undefined, [side * .072, .29, -.005], [0, 0, -side * 12], .004)),
    ...[-1, 1].map(side => ball("低于眼孔的立体外扩颧骨", [side * .088, .145, -.035], [.065, .06, .035], skin)),
    ball("眼口之间而非堵眼的凸起宽鼻梁", [0, .18, -.055], [.055, .055, .055], skin),
    ...[-1, 1].map(side => cone("从口部上缘向下伸出的两根尖獠牙", [side * .045, .085, -.055], [.023, .075, .023], pale, [0, 0, 180])),
    ...[-1, 1].map(side => cord("沿眼洞外缘隆起的斜折眉骨", [[side * .025, .25, -.045], [side * .065, .26, -.04], [side * .1, .235, -.02]], .012, material.dark)),
    ...maskTies(.21),
  ] },
  { name: "尖长双耳豺狼神舞台头罩", itemType: "服饰", theme: "奇幻", build: () => [
    clothShell("下颈开放且面部留出安装窗的整顶头罩", [{ y: .065, rx: .083, rz: .095 }, { y: .2, rx: .095, rz: .105 }, { y: .29, rx: .075, rz: .085 }, { y: .33, rx: 0, rz: 0 }], material.dark, (row, column) => row < 2 && [10, 11, 12, 13].includes(column)),
    faceBlank("双眼真正贯通而下颌拉长的前脸罩", [[-.055, -.115], [.055, -.115], [.09, -.025], [.095, .08], [.065, .135], [-.065, .135], [-.095, .08], [-.09, -.025]], [eyeCircle(-.047, .065, .025, .012), eyeCircle(.047, .065, .025, .012), eyeCircle(0, -.01, .045, .03)], material.dark, .095, .09, .006, .15, -.01),
    clothShell("从脸孔向前收尖而根端实际开放的长吻", [{ y: 0, rx: .049, rz: .033 }, { y: .095, rx: .039, rz: .03 }, { y: .15, rx: .025, rz: .022 }, { y: .17, rx: 0, rz: 0 }], material.dark, undefined, [0, .14, -.095], [-90, 0, 0], .005),
    ...[-1, 1].map(side => plate("从头顶向上伸出的长尖立耳", [side * .064, .335, .025], [[-.035, -.035], [.035, -.035], [.03, .09], [0, .21], [-.025, .1]], .026, material.dark, [4, 0, -side * 9])),
    ...[-1, 1].map(side => plate("嵌在长立耳前侧的内耳衬片", [side * .064, .337, .008], [[-.02, -.015], [.02, -.015], [.017, .08], [0, .175], [-.015, .09]], .004, material.wood, [4, 0, -side * 9])),
    ...maskTies(.18),
  ] },
  { name: "大扇耳卷长鼻神戏面具", itemType: "服饰", theme: "奇幻", build: () => [
    faceBlank("眼窝与长鼻根部真实贯通的宽额面壳", [[-.075, -.105], [.075, -.105], [.11, .015], [.09, .115], [0, .15], [-.09, .115], [-.11, .015]], [eyeCircle(-.053, .05, .027, .015), eyeCircle(.053, .05, .027, .015), eyeCircle(0, -.01, .034)], textile, .11, .035),
    bentTrunk(),
    ...[-1, 1].map(side => plate("从脸侧展开并具有真实厚度的大扇耳", [side * .117, .18, .01], [[-.035, .08], [.08, .13], [.135, .065], [.13, -.055], [.055, -.14], [-.035, -.07]].map(([x, y]): [number, number] => [side * x!, y!]), .012, textile, [0, -side * 18, 0])),
    ...[-1, 1].map(side => plate("大耳内部向外折开的独立衬片", [side * .127, .18, -.002], [[-.025, .055], [.065, .095], [.105, .045], [.1, -.045], [.05, -.105], [-.025, -.055]].map(([x, y]): [number, number] => [side * x!, y!]), .004, pale, [0, -side * 18, 0])),
    ...[-1, 1].map(side => clothShell("从嘴角向前上翘的封尖象牙道具", [{ y: 0, rx: .013, rz: .014 }, { y: .07, rx: .01, rz: .01, z: -.025 }, { y: .095, rx: 0, rz: 0, z: -.04 }], pale, undefined, [side * .049, .1, -.035], [-72, 0, side * 8], .003)),
    ...maskTies(.21),
  ] },
];
