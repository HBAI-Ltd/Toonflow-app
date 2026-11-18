import { part, ring, type ModelPart, type Triple } from "../assetModelParts";
import { box, cylinder, cup, loop, rod, bars, cord, piercedPanel, legs, material, type MasterPrototype } from "./parts";
import { openNeck, openTray } from "./culinaryExpansionBatchOne";
import { conveyor, frontShell } from "./culinaryExpansionBatchTwo";

export function wireStrip(name: string, position: Triple, width: number, span: number, count: number, radius: number): ModelPart {
  const vertices: { x: number; y: number; z: number }[] = [], indices: number[] = [];
  for (let i = 0; i < count; i++) {
    const offset = vertices.length, z = -span / 2 + i * span / (count - 1);
    for (const x of [-width / 2, width / 2]) for (const [y, dz] of [[-radius, -radius], [radius, 0], [-radius, radius]]) vertices.push({ x, y: y!, z: z + dz! });
    indices.push(offset, offset + 2, offset + 1, offset + 3, offset + 4, offset + 5);
    for (let j = 0; j < 3; j++) { const a = offset + j, b = offset + (j + 1) % 3; indices.push(a, b, b + 3, a, b + 3, a + 3); }
  }
  return part(name, "mesh", material.steel, position, [1, 1, 1], [0, 0, 0], { vertices, indices });
}

// 参考公开原理，自制独立装配；不复用整台机器换食品、尺寸或附件来扩主。
// https://sivetz.com/
// https://www.sollich.com/en/technology/enrobing
// https://dairyprocessinghandbook.tetrapak.com/chapter/designing-process-line
export const culinaryExpansionBatchThreeObjects: MasterPrototype[] = [
  { name: "圆筒挂钩烤鸭炉", theme: "中式", itemType: "设施", build: () => [
    ...legs(.73, .73, .19, .055), part("双层保温圆筒炉膛", "lathe", material.steel, [0, .2, 0], [1, 1, 1], [0, 0, 0], { profile: [{ x: .43, y: 0 }, { x: .48, y: .07 }, { x: .48, y: 1.15 }, { x: .29, y: 1.38 }, { x: .27, y: 1.38 }, { x: .44, y: 1.12 }, { x: .44, y: .08 }, { x: .4, y: .04 }, { x: .43, y: 0 }] }),
    cup("炉底独立炭火盆", [0, .2, 0], .31, .16, material.dark), ring("炭火盆上方承挂锅圈", material.dark, .38, .03, .39, .05), rod("炉顶横向挂钩承梁", [-.26, 1.52, 0], [.26, 1.52, 0], .022),
    ...[-1, 0, 1].map(side => cord("下垂的独立烤鸭挂钩", [[side * .17, 1.52, 0], [side * .17, 1.26, 0], [side * .17, 1.21, -.04], [side * .17, 1.25, -.065]], .007)),
    part("偏置放下的中空炉盖", "lathe", material.steel, [.65, .015, 0], [1, 1, 1], [0, 0, 0], { profile: [{ x: .3, y: 0 }, { x: .3, y: .055 }, { x: .15, y: .13 }, { x: .08, y: .13 }, { x: .08, y: .2 }, { x: .065, y: .2 }, { x: .065, y: .115 }, { x: .145, y: .115 }, { x: .28, y: .045 }, { x: .28, y: 0 }, { x: .3, y: 0 }] }),
    cylinder("筒壁温度圆表", [0, .96, -.486], [.1, .025, .1], material.ivory, [90, 0, 0]), ...[-1, 1].map(side => cord("炉筒侧提耳", [[side * .46, 1.02, -.05], [side * .57, 1.02, -.05], [side * .57, .9, .05], [side * .46, .9, .05]], .018)),
  ] },
  { name: "深腹坦都里陶炉", theme: "异域", itemType: "设施", build: () => [
    cylinder("稳固圆形炉底", [0, .08, 0], [.9, .16, .9], material.red), part("上收窄口的深腹耐火内胆", "lathe", material.red, [0, .15, 0], [1, 1, 1], [0, 0, 0], { profile: [{ x: .36, y: 0 }, { x: .46, y: .33 }, { x: .44, y: .69 }, { x: .31, y: 1.01 }, { x: .29, y: 1.07 }, { x: .24, y: 1.07 }, { x: .26, y: 1 }, { x: .39, y: .68 }, { x: .41, y: .33 }, { x: .31, y: .05 }, { x: .36, y: 0 }] }),
    ring("陶炉口外圈保护箍", material.dark, .315, .022, 1.17, .045), ...[.25, .68].map(y => loop("炉腹外侧束箍", [0, y, 0], y < .3 ? .435 : .457, .018, [0, 0, 0], material.dark)),
    openNeck("从炉底进入的独立进气管", [0, .2, -.37], .06, .22, .012, material.red, [90, 0, 0]), ...[-1, 1].map(side => rod("斜插进炉内的金属烤签", [side * .09, .34, 0], [side * .2, 1.43, 0], .008)),
    ...[-1, 1].map(side => rod("烤签端部隔热持握", [side * .18, 1.26, 0], [side * .2, 1.43, 0], .025, material.wood)),
  ] },
  { name: "摇柄压力爆米花炮炉", theme: "中式", itemType: "设施", build: () => [
    ...legs(.58, .94, .32, .04), ...[-1, 1].map(side => box("炮炉底架长梁", [side * .29, .34, 0], [.045, .045, 1.05], material.dark)), part("两端收分的密闭压力转锅", "lathe", material.dark, [0, .67, 0], [1, 1, 1], [90, 0, 0], { profile: [{ x: 0, y: -.42 }, { x: .1, y: -.42 }, { x: .24, y: -.2 }, { x: .24, y: .2 }, { x: .14, y: .42 }, { x: 0, y: .42 }] }),
    ...[-1, 1].map(side => rod("端部横向旋转轴颈", [0, .67, side * .39], [0, .67, side * .58], .04)), ...[-1, 1].map(side => box("转锅端轴承高座", [0, .51, side * .5], [.18, .34, .12])), cylinder("锅口螺旋锁紧厚盖", [0, .67, -.44], [.3, .04, .3], material.steel, [90, 0, 0]),
    rod("锅盖锁紧横梁", [-.19, .67, -.48], [.19, .67, -.48], .025), ...[-1, 1].map(side => rod("锁梁接回锅口的拉耳", [side * .19, .67, -.48], [side * .19, .67, -.34], .02)),
    cylinder("随锅旋转的压力表", [0, .77, -.49], [.075, .02, .075], material.ivory, [90, 0, 0]), rod("轴端手摇曲柄", [0, .67, .59], [.2, .67, .59], .015), rod("曲柄外握柄", [.2, .67, .59], [.2, .67, .76], .03, material.wood),
    ...openTray("转锅下炭火燃烧盆", [0, .35, 0], .39, .56, .1, material.dark),
  ] },
  { name: "流化床立筒咖啡焙炉", theme: "现代", itemType: "设施", build: () => [
    box("热风机及电加热基柜", [0, .38, 0], [.75, .76, .72], material.dark), part("立式透视热风豆床筒", "lathe", material.glass, [0, .83, 0], [1, 1, 1], [0, 0, 0], { profile: [{ x: .12, y: 0 }, { x: .25, y: .26 }, { x: .25, y: .84 }, { x: .24, y: .84 }, { x: .24, y: .26 }, { x: .11, y: 0 }, { x: .12, y: 0 }], opacity: .35 }),
    openNeck("豆床下方独立热风喷嘴", [0, .72, 0], .12, .14, .012), piercedPanel("真正带九孔的布风筛板", [0, .84, 0], Array.from({ length: 16 }, (_, i): [number, number] => [Math.cos(i * Math.PI / 8) * .105, Math.sin(i * Math.PI / 8) * .105]), Array.from({ length: 9 }, (_, i): [number, number][] => { const x = (i % 3 - 1) * .041, z = (Math.floor(i / 3) - 1) * .041; return [[x - .009, z - .009], [x - .009, z + .009], [x + .009, z + .009], [x + .009, z - .009]]; }), .009),
    part("豆床顶部收汽斗", "lathe", material.steel, [0, 1.67, 0], [1, 1, 1], [0, 0, 0], { profile: [{ x: .25, y: 0 }, { x: .1, y: .19 }, { x: .085, y: .19 }, { x: .235, y: 0 }, { x: .25, y: 0 }] }),
    cord("顶部携壳热风弯管", [[0, 1.86, 0], [0, 2, 0], [.57, 2, 0], [.57, 1.73, 0]], .075), cylinder("侧置豆壳旋风收集筒", [.57, 1.49, 0], [.31, .58, .31]), part("收集筒下细口锥斗", "lathe", material.steel, [.57, .9, 0], [1, 1, 1], [0, 0, 0], { profile: [{ x: .045, y: 0 }, { x: .155, y: .3 }, { x: .145, y: .3 }, { x: .035, y: 0 }, { x: .045, y: 0 }] }),
    ...[-1, 1].map(side => rod("侧筒支承落地架", [.57 + side * .14, .08, 0], [.57 + side * .14, 1.25, 0], .028)), openNeck("下部卸豆侧嘴", [0, .9, -.14], .045, .22, .008, material.steel, [90, 0, 0]), ...openTray("机前卸豆接槽", [0, .72, -.4], .52, .42, .09),
  ] },
  { name: "水幕式巧克力涂覆机", theme: "现代", itemType: "设施", build: () => {
    return [...legs(.73, 1.27, .63, .05), ...[.85, .78].map(y => wireStrip("64根独立透空网带横丝", [0, y, 0], .67, 1.8, 64, .0015)), ...[-1, 1].map(side => cylinder("网带两端回转辊", [0, .815, side * .9], [.07, .67, .07], material.dark, [0, 0, 90])), ...[-1, 1].map(side => box("网带侧边承载梁", [side * .36, .815, 0], [.04, .1, 1.88])), ...openTray("下方可加热涂料循环槽", [0, .49, 0], .88, 1.37, .26), ...[-1, 1].map(side => rod("跨带涂覆架立柱", [side * .42, .6, .08], [side * .42, 1.4, .08], .045)),
    ...openTray("顶部宽缝溢流槽", [0, 1.31, .08], .74, .21, .09), box("从溢流口下落的巧克力幕", [0, 1.075, -.025], [.65, .46, .008], "#795747"), cylinder("底槽中的卫生循环泵", [.3, .62, .4], [.13, .22, .13], material.dark, [90, 0, 0]),
    cord("泵至上槽的供浆弯管", [[.3, .62, .4], [.46, .62, .4], [.46, 1.39, .4], [.23, 1.39, .16]], .025), rod("涂覆后吹匀表面的扁气刀", [-.33, 1.05, -.52], [.33, 1.05, -.52], .025), ...[-1, 1].map(side => rod("气刀两端支座", [side * .36, .84, -.52], [side * .36, 1.05, -.52], .02)),
    ...[-1, 1].map(side => part("涂覆区域防溅观察窗", "box", material.glass, [side * .38, 1.13, -.04], [.012, .53, .7], [0, 0, 0], { opacity: .35 })),
    ];
  } },
  { name: "双端扭结糖果包装机", theme: "现代", itemType: "设施", build: () => {
    const parts: ModelPart[] = [...legs(.69, 1.05, .7, .055), box("扭结机传动底台", [0, .76, 0], [.91, .16, 1.45], material.ivory), cylinder("糖块定位分度圆盘", [0, .93, .06], [.58, .055, .58]), ...[-1, 1].map(side => cylinder("横向双端扭结抓头", [side * .27, .98, -.17], [.13, .17, .13], material.dark, [0, 0, 90])),
      ...[-1, 1].map(side => box("扭结抓头横向滑座", [side * .37, .9, -.17], [.16, .15, .26])), ...[-1, 1].flatMap(side => [-1, 1].map(jaw => rod("对夹扭结爪", [side * .2, .98, -.17 + jaw * .03], [side * .13, .98, -.17 + jaw * .018], .01))),
      cylinder("上方包装纸放卷轴", [0, 1.43, .48], [.35, .42, .35], material.ivory, [0, 0, 90]), ...[-1, 1].map(side => rod("纸卷两端承架", [side * .3, .82, .5], [side * .3, 1.43, .5], .025)), rod("纸带前导向辊", [-.24, 1.15, .18], [.24, 1.15, .18], .05), box("纸卷进入包糖位的薄纸带", [0, 1.15, .33], [.38, .005, .33], material.ivory), ...openTray("前方成糖出料槽", [0, .71, -.69], .37, .36, .06)];
    for (let i = 0; i < 10; i++) { const a = i * Math.PI / 5; parts.push(box("分度盘周边独立夹糖定位块", [Math.cos(a) * .23, .98, .06 + Math.sin(a) * .23], [.06, .035, .045], material.dark, [0, -i * 36, 0])); }
    return parts;
  } },
  { name: "自动打蛋分离线", theme: "现代", itemType: "设施", build: () => {
    const parts: ModelPart[] = [...legs(.71, 1.68, .68, .055), ...conveyor("托蛋定位传送带", [0, .83, 0], .68, 2.2), ...[-1, 1].map(side => box("打蛋工位承架", [side * .4, 1.06, 0], [.065, .5, .45])), rod("划壳刀公共下压横轴", [-.38, 1.26, 0], [.38, 1.26, 0], .024), ...[-1, 1].map(side => box("左右分开的开蛋壳夹指", [side * .1, 1.06, 0], [.08, .1, .15])),
      ...openTray("下面分流的蛋白槽", [-.19, .42, 0], .32, 1.15, .13), ...openTray("下面独立收集蛋黄的槽", [.19, .42, 0], .32, 1.15, .13), box("上方驱动连杆盒", [0, 1.35, 0], [.73, .14, .3], material.dark)];
    for (let i = 0; i < 7; i++) { const z = -.9 + i * .3; parts.push(...[-1, 1].map(side => cup("转动分开的半壳承托小杯", [side * .08, .85, z], .06, .045)), box("蛋黄分离窄托舌", [.12, .68, z], [.07, .012, .16]), ...[-1, 1].map(side => rod("蛋白落流的侧隙导杆", [.12 + side * .05, .68, z - .08], [.12 + side * .05, .68, z + .08], .007))); }
    parts.push(...openTray("尾端弃壳收集槽", [0, .65, 1.24], .59, .39, .1));
    return parts;
  } },
  { name: "旋盘饼干夹心机", theme: "现代", itemType: "设施", build: () => {
    const parts: ModelPart[] = [...legs(.84, .73, .67, .055), box("夹心机分度工作台", [0, .73, 0], [1.1, .15, .95], material.ivory), cylinder("承放下饼的旋转分度盘", [0, .86, 0], [.79, .06, .79]),
      ...[-1, 1].map(side => openNeck("上下饼分别排队的竖直落饼筒", [side * .3, .9, .12], .09, .63, .008, material.glass)), cup("独立夹心浆料斗", [0, 1.21, -.27], .16, .3), openNeck("正对分度盘的定量夹心嘴", [0, 1.03, -.27], .025, .18, .006), rod("料斗支柱", [.22, .81, -.32], [.22, 1.39, -.32], .03),
      cylinder("合上顶饼的升降压头", [.24, 1.13, -.16], [.13, .14, .13], material.dark), rod("压头与台面的立架", [.46, .81, -.16], [.46, 1.32, -.16], .035), rod("压头横梁", [.24, 1.32, -.16], [.46, 1.32, -.16], .035), ...openTray("前方成品夹心饼出槽", [0, .75, -.54], .32, .38, .05)];
    for (let i = 0; i < 8; i++) { const a = i * Math.PI / 4; parts.push(ring("分度盘上的真实定位饼圈", material.dark, .073, .008, .905, .015, { position: { x: Math.cos(a) * .29, y: .905, z: Math.sin(a) * .29 } })); }
    return parts;
  } },
  { name: "双滤带辊压果汁机", theme: "现代", itemType: "设施", build: () => {
    const parts: ModelPart[] = [...legs(.76, 1.7, .64, .055), ...openTray("下方全长集汁槽", [0, .45, 0], .94, 2.15, .16), ...[-1, 1].map(side => box("滤带主承载侧架", [side * .45, .87, 0], [.06, .62, 2.08])), ...conveyor("下层承渣滤带", [0, .93, 0], .73, 2),
      box("上层滤带入口斜压面", [0, 1.12, .24], [.73, .012, 1.08], material.dark, [-12, 0, 0]), box("上层滤带后段压面", [0, .965, -.62], [.73, .012, .68], material.dark), cup("前段果浆分配料斗", [0, 1.36, .75], .3, .3), box("料斗口下均匀布浆横槽", [0, 1.26, .75], [.74, .12, .24])];
    for (let i = 0; i < 5; i++) { const z = -.82 + i * .3; parts.push(cylinder("上下渐压滤带的横向压汁辊", [0, i < 3 ? 1.08 : 1.16, z], [.17, .84, .17], material.steel, [0, 0, 90])); }
    parts.push(...[-1, 1].map(side => rod("压紧上滤带的气缸杆", [side * .43, 1.1, -.4], [side * .43, 1.48, -.4], .045)), rod("末端刮渣长刀", [-.4, .93, -1.05], [.4, .93, -1.05], .018), ...openTray("末端独立出渣斜槽", [0, .69, -1.19], .76, .35, .06), openNeck("集汁槽的排汁出口", [.3, .48, -.98], .035, .22, .006, material.steel, [90, 0, 0]));
    return parts;
  } },
  { name: "压带孔筒鱼肉采肉机", theme: "现代", itemType: "设施", build: () => {
    const holes = Array.from({ length: 20 }, (_, i): [number, number][] => { const x = (i % 5 - 2) * .045, z = (Math.floor(i / 5) - 1.5) * .045; return [[x - .009, z - .009], [x - .009, z + .009], [x + .009, z + .009], [x + .009, z - .009]]; });
    const sideOutline: [number, number][] = [[-.28, -.215 * Math.PI / 2], [.28, -.215 * Math.PI / 2], ...Array.from({ length: 12 }, (_, i): [number, number] => [.28, .215 * (-Math.PI / 2 + (i + 1) * Math.PI / 12)]), [-.28, .215 * Math.PI / 2], ...Array.from({ length: 11 }, (_, i): [number, number] => [-.28, .215 * (Math.PI / 2 - (i + 1) * Math.PI / 12)])];
    const sideHoles = Array.from({ length: 30 }, (_, i): [number, number][] => { const x = (i % 5 - 2) * .09, z = (Math.floor(i / 5) - 2.5) * .1075; return [[x - .018, z - .014], [x - .018, z + .014], [x + .018, z + .014], [x + .018, z - .014]]; });
    const perforatedShells = [0, 1].map(half => {
      const value = piercedPanel("挤压工作面的真正贯通孔筒半壳", [0, 1.02, 0], sideOutline, sideHoles, .025);
      value.vertices = value.vertices!.map(({ x, y, z }) => { const a = z / .215; return { x, y: Math.cos(a) * (.215 + y), z: Math.sin(a) * (.215 + y) }; });
      value.rotation.x = half * 180;
      return value;
    });
    const parts: ModelPart[] = [...legs(.62, .7, .55, .055), box("采肉机传动底座", [0, .64, 0], [.79, .19, .96], material.ivory), ...perforatedShells,
      piercedPanel("筛筒末端可见真实孔板", [-.28, 1.02, 0], Array.from({ length: 20 }, (_, i): [number, number] => [Math.cos(i * Math.PI / 10) * .235, Math.sin(i * Math.PI / 10) * .235]), holes, .018, material.steel, [0, 0, 90]),
      ...[-1, 1].map(side => cylinder("挤压带端部回转辊", [0, 1.02, side * .31], [.13, .6, .13], material.dark, [0, 0, 90])), part("贴合筛筒下半圆的挤肉橡胶带", "extrude", material.dark, [.285, 1.02, 0], [1, 1, 1], [0, -90, 0], { depth: .57, profile: [...Array.from({ length: 13 }, (_, i) => { const a = Math.PI / 2 + i * Math.PI / 12; return { x: Math.sin(a) * .264, y: Math.cos(a) * .264 }; }), ...Array.from({ length: 13 }, (_, i) => { const a = Math.PI * 1.5 - i * Math.PI / 12; return { x: Math.sin(a) * .244, y: Math.cos(a) * .244 }; })] }), box("筛筒右端驱动箱", [.4, 1, 0], [.2, .4, .51], material.dark), cylinder("筛筒接到驱动箱的短轴", [.295, 1.02, 0], [.08, .12, .08], material.steel, [0, 0, 90]),
      ...openTray("上方鱼料送入盘", [0, 1.05, .38], .56, .33, .05), ...openTray("筒端净鱼肉出料盘", [-.47, .73, 0], .36, .46, .07), ...openTray("压带后端皮骨出口", [0, .66, -.55], .57, .29, .05)];
    return parts;
  } },
  { name: "往复槽锅茶叶理条机", theme: "中式", itemType: "设施", build: () => {
    const parts: ModelPart[] = [...legs(.78, 1.13, .64, .055), box("理条机下部加热底柜", [0, .71, 0], [1.04, .18, 1.46], material.dark), ...[-1, 1].map(side => rod("槽锅共同往复导杆", [side * .47, .9, -.67], [side * .47, .9, .67], .025)), ...[-1, 1].map(side => box("槽锅横向连接梁", [0, .84, side * .57], [.94, .05, .06])),
      cylinder("偏心往复驱动轮", [.62, .78, 0], [.22, .07, .22], material.steel, [0, 0, 90]), rod("偏心轮拉向槽锅的连杆", [.66, .84, .065], [.42, .88, .065], .022), box("侧部理条驱动电机", [.64, .65, 0], [.24, .25, .3], material.dark)];
    for (let i = 0; i < 6; i++) { const x = (i - 2.5) * .15; parts.push(box("每个槽锅独立平底", [x, .88, 0], [.1, .012, 1.24]), ...[-1, 1].map(side => box("槽锅两侧相连斜壁", [x + side * .058, .92, 0], [.014, .11, 1.24], material.steel, [0, 0, side * 28]))); }
    parts.push(...[-1, 1].map(side => box("防止茶叶纵向落出的端挡板", [0, .93, side * .63], [.92, .13, .015])));
    return parts;
  } },
  { name: "回转灌瓶旋盖机", theme: "现代", itemType: "设施", build: () => {
    const parts: ModelPart[] = [...legs(1, .8, .7, .06), box("灌瓶机同步传动台", [0, .76, 0], [1.25, .16, 1.08], material.ivory), cylinder("瓶口定位分度转盘", [0, .88, 0], [.9, .065, .9]), cup("机器后侧独立液料平衡筒", [0, 1.55, .38], .25, .36), ...[-1, 1].map(side => rod("上供料筒固定支架", [side * .34, .84, .38], [side * .34, 1.76, .38], .035)),
      ...[-1, 1].map(side => openNeck("从平衡筒接到灌液头的管颈", [side * .14, 1.36, .08], .02, .28, .005)), cylinder("独立旋盖竖轴机头", [.32, 1.3, -.13], [.14, .35, .14], material.dark), rod("旋盖机头侧承柱", [.52, .83, -.13], [.52, 1.52, -.13], .04), rod("旋盖承柱横臂", [.32, 1.52, -.13], [.52, 1.52, -.13], .035),
      ...openTray("瓶盖振动送盖浅盘", [.51, 1.55, .3], .35, .33, .1), cord("从送盖盘滑向旋盖头的盖槽", [[.5, 1.57, .25], [.4, 1.48, .15], [.32, 1.43, -.13]], .027, material.steel)];
    for (let i = 0; i < 8; i++) { const a = i * Math.PI / 4; parts.push(ring("转盘圆周瓶底真实定位圈", material.dark, .055, .008, .93, .025, { position: { x: Math.cos(a) * .34, y: .93, z: Math.sin(a) * .34 } })); }
    parts.push(...conveyor("瓶体前后进出窄带", [-.56, .89, 0], .2, 1.45)); return parts;
  } },
  { name: "螺旋面包冷却塔", theme: "现代", itemType: "设施", build: () => {
    const vertices: { x: number; y: number; z: number }[] = [], indices: number[] = [];
    for (let i = 0; i <= 48; i++) { const a = i * Math.PI / 8, y = .35 + i * .033; for (const [r, h] of [[.52, 0], [.94, 0], [.94, .025], [.52, .025]]) vertices.push({ x: Math.cos(a) * r!, y: y + h!, z: Math.sin(a) * r! }); if (i) for (let j = 0; j < 4; j++) { const a = (i - 1) * 4 + j, b = i * 4 + j, c = (i - 1) * 4 + (j + 1) % 4, d = i * 4 + (j + 1) % 4; indices.push(a, c, b, c, d, b); } }
    indices.push(2, 1, 0, 3, 2, 0, 192, 193, 194, 192, 194, 195);
    const parts: ModelPart[] = [cylinder("中央回转驱动鼓", [0, 1.05, 0], [.96, 1.8, .96], material.dark), cylinder("底部公共减速转台", [0, .1, 0], [1.1, .2, 1.1]), part("连续三圈上升冷却承料带", "mesh", material.steel, [0, 0, 0], [1, 1, 1], [0, 0, 0], { vertices, indices }), cord("承料带外侧防落护杆", Array.from({ length: 49 }, (_, i): Triple => [Math.cos(i * Math.PI / 8) * .94, .44 + i * .033, Math.sin(i * Math.PI / 8) * .94]), .012), ...conveyor("底层切向进料带", [.73, .35, -.36], .4, .72), ...conveyor("顶层切向出料带", [.73, .35 + 48 * .033, .36], .4, .72)];
    for (let i = 0; i < 6; i++) { const a = i * Math.PI / 3; parts.push(rod("周边落地承带立柱", [Math.cos(a) * 1.015, 0, Math.sin(a) * 1.015], [Math.cos(a) * 1.015, 2, Math.sin(a) * 1.015], .04)); for (let level = 0; level < 3; level++) parts.push(rod("立柱连接中央鼓的水平承梁", [Math.cos(a) * .45, .31 + level * .528 + i * .088, Math.sin(a) * .45], [Math.cos(a) * 1.015, .31 + level * .528 + i * .088, Math.sin(a) * 1.015], .022)); }
    return parts;
  } },
  { name: "奶品板换杀菌撬", theme: "现代", itemType: "设施", build: () => {
    const parts: ModelPart[] = [...legs(1.6, .83, .18, .05), box("卫生杀菌撬底架", [0, .22, 0], [1.83, .08, 1.06]), ...[-1, 1].map(side => box("板换两端压紧立板", [-.38 + side * .28, .77, .05], [.06, 1, .58])), ...[-1, 1].flatMap(side => [-1, 1].map(end => rod("板组贯通压紧拉杆", [-.72, .45 + (end + 1) * .31, .05 + side * .23], [.01, .45 + (end + 1) * .31, .05 + side * .23], .018))),
      cup("前置恒液位奶平衡槽", [.48, .3, -.1], .19, .46), cylinder("底架卫生供奶泵", [.48, .38, .3], [.15, .25, .15], material.dark, [90, 0, 0]), cord("平衡槽底接入板换的供奶管", [[.48, .32, -.1], [.48, .27, -.25], [-.68, .27, -.25], [-.68, .52, -.25]], .022),
      cord("板换接至持温盘管的出奶管", [[-.09, 1.05, -.25], [.22, 1.05, -.25], [.22, 1.34, -.25]], .022), box("侧置温度控制柜", [.73, .9, .35], [.32, .56, .24], material.dark)];
    for (let i = 0; i < 12; i++) parts.push(box("独立可见传热薄板", [-.62 + i * .044, .77, .05], [.015, .86, .48]));
    for (let i = 0; i < 5; i++) parts.push(rod("串联持温管横直段", [.12, 1.35 + i * .075, -.25], [.68, 1.35 + i * .075, -.25], .035), ...(i < 4 ? [cord("持温管段间U形回弯", [[i % 2 ? .12 : .68, 1.35 + i * .075, -.25], [i % 2 ? .09 : .71, 1.3875 + i * .075, -.25], [i % 2 ? .12 : .68, 1.425 + i * .075, -.25]], .0175)] : []));
    parts.push(...[-1, 1].map(side => rod("持温管独立固定立架", [.4 + side * .27, .26, -.25], [.4 + side * .27, 1.7, -.25], .022)), openNeck("冷却后奶液出口", [-.68, .9, -.25], .026, .2, .005, material.steel, [90, 0, 0]));
    return parts;
  } },
  { name: "熟蛋滚轮剥壳机", theme: "现代", itemType: "设施", build: () => {
    const parts: ModelPart[] = [...legs(.65, 1.1, .62, .05), ...openTray("收集碎蛋壳和冲洗水的浅槽", [0, .61, 0], .82, 1.42, .1), ...[-1, 1].map(side => box("胶辊两端轴承架", [0, .83, side * .64], [.8, .32, .08])), ...openTray("前段熟蛋喂入盘", [0, .96, .8], .7, .35, .08), ...openTray("尾端净蛋接盘", [0, .7, -.8], .7, .33, .05), box("后端低速同步驱动箱", [0, .85, .78], [.8, .35, .2], material.dark)];
    for (let i = 0; i < 6; i++) parts.push(cylinder("成对揉搓碎壳的软胶滚轴", [(i - 2.5) * .11, .9, 0], [.095, 1.2, .095], material.ivory, [90, 0, 0]));
    for (const side of [-1, 1]) parts.push(rod("上方冲洗水长总管", [side * .26, 1.2, -.58], [side * .26, 1.2, .58], .025), ...[-.45, 0, .45].map(z => openNeck("喷向胶辊区的短喷嘴", [side * .26, 1.08, z], .012, .12, .003)), ...[-1, 1].map(end => rod("冲洗总管落架短柱", [side * .26, .83, end * .58], [side * .26, 1.2, end * .58], .018)));
    return parts;
  } },
  { name: "真空转篮低温油炸机", theme: "现代", itemType: "设施", build: () => [
    ...legs(.92, .91, .25, .06), box("封闭真空炸制机底架", [0, .31, 0], [1.12, .14, 1.12]), cup("厚壁密闭炸制腔", [0, .38, 0], .45, .7), cylinder("可卸真空密封圆盖", [0, 1.115, 0], [.96, .055, .96]), loop("圆盖顶部相连提环", [0, 1.19, 0], .12, .02, [90, 0, 0]),
    cylinder("顶上可见转篮驱动机", [0, 1.31, 0], [.19, .28, .19], material.dark), ...[0, 90, 180, 270].map(angle => { const a = angle * Math.PI / 180; return box("密封盖周向机械快扣", [Math.cos(a) * .46, 1.09, Math.sin(a) * .46], [.045, .13, .06], material.dark, [0, -angle, 0]); }),
    cylinder("侧置真空冷凝筒", [.76, .76, .24], [.29, .68, .29]), cord("炸腔上口连接冷凝筒的抽汽管", [[.3, 1.11, .24], [.76, 1.11, .24], [.76, 1.02, .24]], .035), cylinder("冷凝筒后真空泵", [.76, .36, .63], [.21, .35, .21], material.dark, [90, 0, 0]), cord("冷凝筒接真空泵的低位管", [[.76, .6, .24], [.76, .36, .24], [.76, .36, .5]], .025),
    cylinder("前部独立循环油过滤器", [.7, .48, -.37], [.24, .31, .24]), cord("炸制油出口至独立过滤器", [[.38, .47, -.15], [.7, .47, -.15], [.7, .48, -.37]], .025), cylinder("盖上真空压力表", [.2, 1.19, -.18], [.075, .02, .075], material.ivory, [90, 0, 0]),
  ] },
  { name: "往复锯片列面包切片机", theme: "现代", itemType: "设施", build: () => {
    const parts: ModelPart[] = [...legs(.63, .58, .62, .05), box("切片机低速驱动柜", [0, .73, 0], [.79, .22, .65], material.ivory), ...[-1, 1].map(side => box("往复刀架两侧承柱", [side * .36, 1.11, 0], [.065, .58, .26])), ...[-1, 1].map(side => rod("两刀架共同横梁", [-.33, .89 + (side + 1) * .22, 0], [.33, .89 + (side + 1) * .22, 0], .025)),
      box("面包前方斜入料板", [0, 1.02, .3], [.65, .018, .49], material.steel, [16, 0, 0]), box("切好面包后出料板", [0, .89, -.29], [.65, .018, .45]), ...[-1, 1].map(side => box("前入料板两侧护沿", [side * .33, 1.05, .3], [.015, .15, .49], material.steel, [16, 0, 0])), box("侧面偏心往复传动头", [.45, 1.07, 0], [.16, .22, .24], material.dark)];
    for (let i = 0; i < 18; i++) parts.push(box("独立往复薄锯条", [(i - 8.5) * .034, 1.1, 0], [.0015, .4, .014]));
    parts.push(...openTray("刀下独立接屑抽盘", [0, .8, 0], .67, .47, .035));
    return parts;
  } },
  { name: "转杯蛋品称重分级线", theme: "现代", itemType: "设施", build: () => {
    const parts: ModelPart[] = [...legs(.68, 1.56, .65, .05), ...conveyor("逐蛋称量传送面", [0, .82, 0], .67, 2.02), box("独立称重段的浮动托台", [0, .8, 0], [.55, .07, .27], material.ivory), ...[-1, 1].map(side => box("称重段下应变支脚", [side * .18, .73, 0], [.05, .08, .12], material.dark)), box("称重数据显示立屏", [.43, 1.14, 0], [.14, .23, .2], material.dark), rod("数据显示屏侧固定立杆", [.43, .8, 0], [.43, 1.06, 0], .025)];
    for (let i = 0; i < 9; i++) parts.push(cup("单个禽蛋的可倾转承杯", [0, .84, -.87 + i * .22], .06, .045), rod("承杯两侧共同翻杯轴", [-.12, .85, -.87 + i * .22], [.12, .85, -.87 + i * .22], .008));
    for (const side of [-1, 1]) for (let i = 0; i < 2; i++) { const z = -.59 + i * 1.06; parts.push(box("向对应级别倾斜的导蛋滑道", [side * .49, .75, z], [.55, .014, .24], material.steel, [0, 0, -side * 13]), rod("翻杯落料的固定触发凸杆", [side * .11, .84, z - .08], [side * .11, .9, z + .08], .01)); }
    return parts;
  } },
  { name: "大桶翻转冲洗灌水机", theme: "现代", itemType: "设施", build: () => {
    const parts: ModelPart[] = [...legs(.97, 1.07, .57, .055), ...openTray("回收冲洗水的通长底槽", [0, .58, 0], 1.17, 1.46, .18), ...[-1, 1].map(side => box("翻桶两侧回转轴承架", [side * .52, 1.1, 0], [.08, .94, 1.06])), rod("翻桶公共水平回转轴", [-.58, 1.25, 0], [.58, 1.25, 0], .055),
      ...[-1, 1].map(side => ring("夹持桶身的中空回转箍", material.dark, .23, .035, 0, .055, { position: { x: side * .27, y: 1.25, z: 0 }, rotation: { x: 90, y: 0, z: 0 } })), box("桶架侧端翻转驱动箱", [.66, 1.25, 0], [.21, .28, .35], material.dark),
      ...[-1, 1].map(side => rod("向下倒置瓶口内伸入的清洗喷管", [side * .27, .69, 0], [side * .27, 1.08, 0], .025)), ...[-1, 1].map(side => rod("独立灌水工位的高位喷嘴", [side * .27, 1.59, -.57], [side * .27, 1.9, -.57], .025)), rod("高位灌水嘴公共给水横管", [-.27, 1.9, -.57], [.27, 1.9, -.57], .04),
      ...[-1, 1].map(side => rod("灌水横管后方落架支承", [side * .45, .6, -.57], [side * .45, 1.91, -.57], .035)), ...openTray("放正桶身的前方出桶托台", [0, .58, -.92], 1.06, .38, .04)];
    return parts;
  } },
  { name: "倒桶式落地饮水机", theme: "现代", itemType: "设施", build: () => [
    ...frontShell("落地冷热饮水机主壳", [0, 0, 0], .34, .96, .34, material.ivory), box("机前下部保冷柜门", [0, .3, -.183], [.29, .5, .025], material.ivory), ...openTray("水龙头下面的滴水盘", [0, .61, -.13], .27, .15, .025),
    ...[-1, 1].map(side => openNeck("冷热水分别向下的出水嘴", [side * .067, .7, -.13], .011, .08, .003)), ...[-1, 1].map(side => box("龙头上方冷热按压键", [side * .067, .85, -.183], [.055, .06, .018], side < 0 ? material.red : material.dark)),
    part("顶部倒置的桶装纯水瓶", "lathe", material.glass, [0, .96, 0], [1, 1, 1], [0, 0, 0], { profile: [{ x: .035, y: 0 }, { x: .035, y: .07 }, { x: .14, y: .14 }, { x: .15, y: .43 }, { x: .12, y: .47 }, { x: 0, y: .47 }, { x: 0, y: .45 }, { x: .11, y: .45 }, { x: .14, y: .42 }, { x: .13, y: .15 }, { x: .025, y: .08 }, { x: .025, y: 0 }, { x: .035, y: 0 }], opacity: .4 }),
    ...[1.15, 1.3].map(y => loop("桶身加强凸筋", [0, y, 0], .149, .006, [0, 0, 0], material.glass)), ring("插入瓶颈的顶部承桶接座", material.dark, .1, .045, .962, .045),
  ] },
  { name: "卧式掀盖冷冻柜", theme: "现代", itemType: "设施", build: () => [
    ...legs(1.02, .56, .1, .035), ...openTray("带独立内胆的深冷冻柜腔", [0, .1, 0], 1.22, .72, .77, material.ivory), ...openTray("露出的金属冷冻内胆", [0, .16, 0], 1.1, .6, .67),
    rod("冷柜盖后方长合页轴", [-.57, .89, .35], [.57, .89, .35], .02), box("向后掀起的隔热厚柜盖", [0, 1.17, .43], [1.24, .61, .065], material.ivory, [-14, 0, 0]), rod("柜盖前端横持把", [-.17, 1.45, .32], [.17, 1.45, .32], .025, material.dark),
    ...[-1, 1].map(side => rod("保持开盖的左右撑杆", [side * .47, .68, .24], [side * .47, 1.12, .44], .012)), ...[-1, 1].map(side => rod("冻柜内可提篮的上沿滑轨", [-.49, .83, side * .25], [.49, .83, side * .25], .009)),
    ...bars("冷凝散热短格栅", 7, [.4, .31, -.373], .25, [.014, .23, .01], 0, material.dark), cylinder("柜前低位温度旋钮", [-.42, .27, -.375], [.05, .022, .05], material.dark, [90, 0, 0]),
  ] },
  { name: "厨下滤芯反渗透净水机", theme: "现代", itemType: "设施", build: () => [
    box("机架背部安装板", [0, .31, .13], [.48, .62, .025]), ...[-1, 0, 1].map(side => cup("前置独立滤芯可旋取壳杯", [side * .145, .01, 0], .063, .34, material.ivory)), ...[-1, 0, 1].map(side => cylinder("滤杯顶连接头", [side * .145, .375, 0], [.14, .07, .14], material.dark)),
    cylinder("上方卧式反渗透卷膜筒", [0, .5, 0], [.095, .43, .095], material.ivory, [0, 0, 90]), ...[-1, 1].map(side => loop("膜筒固定箍", [side * .13, .5, 0], .05, .008, [0, 0, 90], material.dark)), cylinder("后置增压泵", [0, .27, .23], [.11, .27, .11], material.dark, [90, 0, 0]),
    ...[-1, 1].map(side => cord("滤杯头到膜筒端口的连接软管", [[side * .145, .41, 0], [side * .27, .41, 0], [side * .27, .5, 0], [side * .215, .5, 0]], .005, material.ivory)),
    part("侧置独立压力储水罐", "lathe", material.ivory, [.47, 0, 0], [1, 1, 1], [0, 0, 0], { profile: [{ x: 0, y: 0 }, { x: .12, y: 0 }, { x: .17, y: .08 }, { x: .17, y: .42 }, { x: .11, y: .5 }, { x: .025, y: .5 }, { x: .025, y: .54 }, { x: 0, y: .54 }] }), cord("膜筒纯水端接到储水罐的软管", [[.215, .5, 0], [.3, .58, .08], [.47, .58, .08], [.47, .54, 0]], .005, material.ivory),
    rod("独立鹅颈饮水龙头立杆", [.69, 0, 0], [.69, .36, 0], .016), cord("饮水龙头弯嘴", [[.69, .36, 0], [.69, .44, 0], [.69, .44, -.13], [.69, .37, -.13]], .008), cylinder("龙头台面固定底盘", [.69, .008, 0], [.065, .016, .065]),
  ] },
  { name: "椭圆回转寿司输送台", theme: "日式", itemType: "设施", build: () => {
    const outer: [number, number][] = [], inner: [number, number][] = [];
    for (let end = 0; end < 2; end++) for (let i = 0; i <= 8; i++) { const a = -Math.PI / 2 + end * Math.PI + i * Math.PI / 8, center = end ? -.75 : .75; outer.push([center + Math.cos(a) * .69, Math.sin(a) * .69]); inner.unshift([center + Math.cos(a) * .34, Math.sin(a) * .34]); }
    const parts: ModelPart[] = [...legs(2.3, .88, .8, .06), piercedPanel("中部真正贯通的环形台面", [0, .81, 0], outer, [inner], .07, material.wood), cylinder("回转链带驱动电机", [0, .59, .49], [.18, .32, .18], material.dark, [0, 0, 90]), box("电机接到台底的承挂架", [0, .71, .49], [.23, .2, .2])];
    for (let end = 0; end < 2; end++) for (let i = 0; i < 8; i++) { const a = -Math.PI / 2 + end * Math.PI + (i + .5) * Math.PI / 8, center = end ? -.75 : .75; parts.push(box("两端半圆段连续链带承盘板", [center + Math.cos(a) * .515, .889, Math.sin(a) * .515], [.31, .018, .2], material.steel, [0, -a * 180 / Math.PI, 0])); }
    for (const side of [-1, 1]) for (let i = 0; i < 7; i++) parts.push(box("长侧直线段连续链带承盘板", [(-.75 + (i + .5) * 1.5 / 7), .889, side * .515], [.212, .018, .31]));
    parts.push(...[-1, 1].map(side => box("台面落地腿之间承重横梁", [side * .9, .62, 0], [.09, .11, .98], material.dark)));
    return parts;
  } },
  { name: "刮鼓式食品片冰机", theme: "现代", itemType: "设施", build: () => [
    box("下方压缩机与储冰底柜", [0, .45, 0], [.82, .9, .72], material.ivory), cup("上部开放制冰圆鼓", [0, .92, 0], .3, .57), ring("制冰鼓独立外壁蒸发夹套", material.steel, .3, .035, 1.19, .55), cylinder("上方慢速刮冰传动机", [0, 1.62, 0], [.19, .23, .19], material.dark),
    rod("刮冰刀中央竖轴", [0, .99, 0], [0, 1.56, 0], .028), box("靠鼓壁的长竖刮冰刀", [.25, 1.2, 0], [.025, .46, .04]), ...[-1, 1].map(side => rod("刮冰刀与中轴的承力短臂", [0, 1.2 + side * .18, 0], [.25, 1.2 + side * .18, 0], .016)),
    cord("供水薄膜分配环", Array.from({ length: 17 }, (_, i): Triple => [Math.cos(i * Math.PI / 8) * .27, 1.46, Math.sin(i * Math.PI / 8) * .27]), .007), openNeck("刮下片冰的前出料口", [0, 1, -.26], .09, .22, .01, material.steel, [90, 0, 0]), ...openTray("出冰口下接冰斜台", [0, .76, -.39], .55, .34, .05),
    ...bars("底柜制冷机散热格栅", 10, [0, .34, -.37], .6, [.02, .31, .014], 0, material.dark),
  ] },
  { name: "齿辊压甘蔗榨汁机", theme: "现代", itemType: "设施", build: () => {
    const parts: ModelPart[] = [...legs(.58, .65, .59, .05), box("榨蔗机承压底箱", [0, .66, 0], [.73, .14, .85], material.ivory), ...[-1, 1].map(side => box("榨辊两端厚侧轴架", [side * .3, .97, 0], [.055, .54, .45])),
      ...[-1, 1].map(side => cylinder("上下压蔗实辊", [0, .96 + side * .115, 0], [.2, .57, .2], material.steel, [0, 0, 90])), box("后方齿轮同步电机箱", [.45, .91, .04], [.26, .39, .52], material.dark), ...openTray("前部插甘蔗的送入导盘", [0, .89, -.4], .51, .37, .07), ...openTray("后部压扁蔗渣的独立出口", [0, .85, .4], .51, .37, .05),
      ...openTray("辊下鲜汁收集盘", [0, .68, 0], .52, .55, .07), openNeck("鲜汁盘下出汁嘴", [0, .71, -.28], .022, .16, .004, material.steel, [90, 0, 0])];
    for (const side of [-1, 1]) for (let i = 0; i < 12; i++) { const a = i * Math.PI / 6; parts.push(rod("榨蔗辊上连续纵向齿棱", [-.28, .96 + side * .115 + Math.cos(a) * .102, Math.sin(a) * .102], [.28, .96 + side * .115 + Math.cos(a) * .102, Math.sin(a) * .102], .008)); }
    return parts;
  } },
];
