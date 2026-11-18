import { type ModelPart, type Triple } from "../assetModelParts";
import { box, cylinder, ball, rod, loop, cord, piercedPanel, material, type MasterPrototype } from "./parts";
import { clothPanel } from "./furnitureExpansionBatchNine";
import { glow } from "./furnitureExpansionBatchTen";

export function caster(x: number, z: number): ModelPart[] {
  return [cylinder("片场设备落地橡胶轮", [x, .08, z], [.16, .045, .16], material.dark, [0, 0, 90]), { ...cord("两侧真正夹住轮轴的倒U轮叉", [[-.035, .08, 0], [-.035, .17, 0], [.035, .17, 0], [.035, .08, 0]], .008), position: { x, y: 0, z } }, rod("贯穿轮毂和轮叉两耳的短轮轴", [x - .045, .08, z], [x + .045, .08, z], .012), rod("轮叉到设备底架的回转立销", [x, .17, z], [x, .23, z], .02)];
}

function gripHead(center: Triple): ModelPart[] {
  const [x, y, z] = center, circle = (radius: number, offset = 0) => Array.from({ length: 16 }, (_, index): [number, number] => { const a = index * Math.PI / 8; return [Math.cos(a) * radius + offset, Math.sin(a) * radius]; });
  return [...[-.02, .008].map(offset => piercedPanel("有真实穿臂孔及独立锁紧孔的铸造夹持盘", [x + offset, y, z], circle(.065), [circle(.01), circle(.0055, .035)], .012, material.steel, [0, 0, -90])), rod("穿过偏置锁紧孔的独立夹盘螺杆", [x - .04, y - .035, z], [x + .075, y - .035, z], .01, material.dark), rod("夹盘外侧能够手动拧紧的短横把", [x + .075, y - .035, z - .042], [x + .075, y - .035, z + .042], .015, material.dark)];
}

export const furnitureExpansionBatchTwelveObjects: MasterPrototype[] = [
  { name: "龟背偏臂C型夹持立架", theme: "现代", itemType: "构件", build: () => {
    const parts: ModelPart[] = [cylinder("把三根不等高折腿叠接起来的龟背根座", [0, .245, 0], [.085, .27, .085], material.dark), cylinder("下段完整粗伸缩立管", [0, .83, 0], [.045, 1.23, .045]), cylinder("由粗管中伸出的上段细立管", [0, 1.63, 0], [.029, .82, .029]), cylinder("伸缩管口上夹住细管的厚锁套", [0, 1.395, 0], [.062, .055, .062], material.dark), rod("伸缩锁套侧方的实际锁紧螺柄", [.022, 1.395, 0], [.095, 1.395, 0], .012, material.dark), rod("立管到偏置夹头下缘的短竖颈", [0, 2.015, 0], [0, 2.07, 0], .026), rod("把偏置夹头实际接回立管的横向短桥", [0, 2.07, 0], [.035, 2.07, 0], .025)];
    for (let index = 0; index < 3; index++) { const a = index * Math.PI * 2 / 3, radius = index ? .55 : .67, rootY = .18 + index * .07, at = (r: number, y: number): Triple => [Math.cos(a) * r, y, Math.sin(a) * r]; parts.push(cord("根部能互相错层收合而脚端都着地的整根弯腿", [at(0, rootY), at(.055, rootY - .055), at(.21, .095), at(radius, .025)], .021), ball("每根弯腿末端独立的宽橡胶脚套", at(radius, .025), [.085, .05, .085], material.dark)); }
    const armY = (x: number) => 2.08 + (x + .23) * .23 / 1.13;
    parts.push(rod("从平衡侧穿过夹头并向前偏伸的完整承旗臂", [-.23, 2.08, 0], [.94, armY(.94), 0], .016), ...gripHead([.035, armY(.035), 0]), ...gripHead([.72, armY(.72), 0]));
    return parts;
  } },
  { name: "双箱抽托翻盖化妆站", theme: "现代", itemType: "家具", build: () => {
    const parts: ModelPart[] = [...[-1, 1].flatMap(x => [-1, 1].flatMap(z => caster(x * .54, z * .23))), box("跨接两只抽屉箱而留出中部坐姿净空的完整工作面", [0, .8875, 0], [1.32, .035, .62], material.dark), ...[-1, 1].map(z => box("真正将两只箱体锁成整体的桌下通长承梁", [0, .8525, z * .24], [1.27, .05, .045], material.steel))];
    for (const side of [-1, 1]) {
      const x = side * .45;
      parts.push(box("原生飞行箱结构的完整厚底", [x, .255, .025], [.41, .05, .56], material.dark), box("箱体背面真正封闭的薄背板", [x, .5575, .2925], [.41, .555, .025], material.dark), ...[-1, 1].map(edge => box("抽屉箱两侧真实薄壁", [x + edge * .19, .5575, .025], [.03, .555, .55], material.dark)), box("抽屉箱接住完整工作面的封顶板", [x, .8525, .025], [.41, .035, .56], material.dark), ...[.465, .635].map(y => box("抽屉之间真正承物的分层板", [x, y, .025], [.35, .02, .5], material.steel)));
      for (const [index, y] of [.38, .55, .72].entries()) { const open = side < 0 && index === 1, z = open ? -.38 : -.255; parts.push(box("每层可以独立抽出的完整抽屉前脸", [x, y, z], [.37, .14, .025], material.dark), { ...cord("前脸上两端真正回接的短U提柄", [[-.055, 0, 0], [-.055, 0, -.028], [.055, 0, -.028], [.055, 0, 0]], .006, material.steel), position: { x, y, z: z - .014 } }); }
      parts.push(box("桌面侧边能够铰收进箱体的整片工作翼", [side * .895, .8875, 0], [.47, .025, .59], material.ivory), rod("侧翼和中台之间真正贯通的铰轴", [side * .66, .875, -.29], [side * .66, .875, .29], .016), ...[-1, 1].map(z => rod("从箱侧锁到外翼底面的独立斜撑", [side * .64, .6, z * .15], [side * 1.1, .875, z * .15], .014)));
    }
    parts.push(box("已经抽出而仍然连接箱内导轨的浅屉底", [-.45, .49, -.13], [.33, .02, .48], material.steel), ...[-1, 1].map(edge => box("抽出浅屉的真实侧壁", [-.45 + edge * .16, .54, -.13], [.015, .1, .48], material.steel)), box("抽出浅屉的后壁", [-.45, .54, .1], [.335, .1, .02], material.steel), ...[-1, 1].map(edge => box("箱内实际托住抽出浅屉的滑轨", [-.45 + edge * .16, .4775, -.115], [.035, .015, .49], material.steel)));
    parts.push(box("通过底部铰轴打开的完整箱盖背板", [0, 1.32, .2925], [1.24, .84, .025], material.dark), ...[-1, 1].map(edge => box("箱盖左右真实承镜边框", [edge * .585, 1.32, .275], [.07, .84, .035], material.steel)), ...[.935, 1.705].map(y => box("箱盖上下真正夹住镜面的横框", [0, y, .275], [1.17, .07, .035], material.steel)), { ...box("被上下边框实际夹住的整块化妆镜", [0, 1.32, .261], [1.1, .71, .008], "#b9cbd0"), roughness: .12, metalness: .85 }, rod("两只箱体与镜盖共用的完整翻盖铰轴", [-.62, .91, .2925], [.62, .91, .2925], .03));
    for (const side of [-1, 1]) { parts.push(rod("镜盖打开后实际锁住倾角的侧向安全撑", [side * .59, .87, .11], [side * .59, 1.17, .28], .012)); for (const y of [1.045, 1.255, 1.465, 1.675]) parts.push(glow(ball("直接嵌在镜框内的独立化妆光球", [side * .585, y, .237], [.057, .057, .057], material.ivory))); }
    return parts;
  } },
  { name: "双升降柱蝴蝶柔光框", theme: "现代", itemType: "构件", build: () => {
    const parts: ModelPart[] = [];
    for (const side of [-1, 1]) {
      const x = side * 1.65;
      for (let index = 0; index < 3; index++) { const a = (-30 + index * 120) * Math.PI / 180, px = x + Math.cos(a) * .6, pz = Math.sin(a) * .6; parts.push(...caster(px, pz), rod("高滚架根部到每只独立脚轮的粗承重腿", [x, .29, 0], [px, .23, pz], .052)); }
      parts.push(cylinder("高滚升降架固定外立柱", [x, .735, 0], [.075, .99, .075]), cylinder("从外柱内滑出的中间升降套管", [x, 1.72, 0], [.052, .97, .052]), cylinder("从中管继续伸出的顶部内柱", [x, 2.4, 0], [.035, .81, .035]), ...[1.22, 2.17].flatMap(y => [cylinder("两级升降套管口各自独立的锁套", [x, y, 0], [.09, .055, .09], material.dark), rod("从锁套侧方伸出的独立锁高螺柄", [x + .025, y, 0], [x + .115, y, 0], .014, material.dark)]), box("实际安装在粗柱前侧的手摇升降齿轮盒", [x, .95, .07], [.13, .18, .09], material.dark), rod("齿轮盒向前伸出的手摇输入轴", [x, .95, .115], [x, .95, .19], .014), rod("输入轴到手柄之间的偏心摇臂", [x, .95, .19], [x + .1, .86, .19], .016), rod("摇臂末端可握的独立短手柄", [x + .1, .86, .19], [x + .1, .86, .27], .026, material.dark), cylinder("内柱顶部真正接住整幅框边的横向俯仰轴", [side * 1.63, 2.8, 0], [.07, .32, .07], material.steel, [0, 0, 90]), loop("俯仰轴外端锁定框角的独立手轮", [side * 1.76, 2.8, 0], .08, .012, [0, 0, 90], material.dark));
      for (let index = 0; index < 3; index++) { const a = index * Math.PI * 2 / 3; parts.push(rod("俯仰锁轮与中心轴之间实际接合的辐条", [side * 1.76, 2.8, 0], [side * 1.76, 2.8 + Math.cos(a) * .075, Math.sin(a) * .075], .008)); }
    }
    const corners: Triple[] = [[-1.48, 2.5966, -1.13], [1.48, 2.5966, -1.13], [1.48, 3.0034, 1.13], [-1.48, 3.0034, 1.13]], cloth: Triple[] = [[-1.42, 2.6074, -1.07], [1.42, 2.6074, -1.07], [1.42, 2.9926, 1.07], [-1.42, 2.9926, 1.07]];
    for (let index = 0; index < 4; index++) { const next = (index + 1) % 4, a = corners[index]!, b = corners[next]!, innerA = cloth[index]!, innerB = cloth[next]!; parts.push(rod("在四角真正闭合的完整大幅蝴蝶框边", a, b, .043), rod("把透光布角绑回主框的独立张拉细绳", a, innerA, .005, material.dark), rod("将各边中点也实际张紧的短细绳", [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2, (a[2] + b[2]) / 2], [(innerA[0] + innerB[0]) / 2, (innerA[1] + innerB[1]) / 2, (innerA[2] + innerB[2]) / 2], .005, material.dark)); }
    parts.push({ ...clothPanel("由双柱托框真正张紧的整幅摄影透光薄布", cloth, material.ivory, .004), opacity: .68 });
    return parts;
  } },
];
