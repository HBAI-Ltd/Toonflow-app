import { beam, part, ring, type ModelPart, type Triple } from "../assetModelParts";
import { polygon } from "../masterNature/shared";
import { boxesMesh, type SolidBox } from "./publicSpaceBatchEight";
import { box, cylinder, design, pipe, type ArchitecturePrototype } from "./structures";

const concrete = "#b2b5ab", steel = "#607779", dark = "#35494c", copper = "#a58c69", porcelain = "#c8d1bd";

// 只取构造原理，造型与尺寸在此原创；不复制现存型号或涂装。
// https://www.furrerfrey.com/catalog/prospekte/200_LightRail_en.pdf
// https://museo.ferrovienord.it/en/header/archive-library-and/museum-industry-and-labour-saronno/second-category-railway-semaphore-signal-fs-type/
// https://collis.co.uk/collis-engineering/signal-gantries/
// https://historicengland.org.uk/research/results/reports/7008/HistoricRailwayBuildingsandStructures_overviewofdevelopmentpressureandreviewofsignificanceVol2
export const railWaysideBatchOneDesigns: ArchitecturePrototype[] = [
  design("斜腕臂定位单线接触网支柱", "落地H柱经上下绝缘座承托三角腕臂，独立定位管夹住接触线，承力索与短跨接触线由吊弦连接；包含完整基础与固定夹具", catenaryMast, "设施", "现代"),
  design("拉线配重臂板铁路进站信号机", "旗板与双色透光眼镜架共用实轴，后置灯照向当前红色镜片，连续拉线接入底部收索器，独立配重杠杆与登检梯均实际接到立柱", semaphoreSignal, "设施", "欧式"),
  design("撑杆旋臂蒸汽机车注水鹤", "有转动承座的立管承托外伸弯颈水臂，斜拉杆接到臂端抱箍，末端软管自然垂落至注水高度，地面阀座与排水格组成完整补水点", waterCrane, "设施", "欧式"),
  design("双腿通透桁架铁路信号桥", "双侧桁腿承托跨线通透横桁，独立下吊光色信号头与顶部检修走道相接，端部落地爬梯到达围栏开口，不含控制室或车站楼", signalBridge, "设施", "现代"),
];

function accessLadder(name: string, x: number, z: number, bottom: number, top: number, width: number): ModelPart[] {
  const count = Math.floor((top - bottom) / .31), rungs: SolidBox[] = [];
  const parts = [-1, 1].map(side => box(`${name}连续侧梁`, x + side * width / 2, (bottom + top) / 2, z, .045, top - bottom, .055, steel));
  for (let index = 0; index <= count; index++) rungs.push({ center: [x, bottom + index * .31, z], size: [width + .04, .035, .06] });
  for (let start = 0; start < rungs.length; start += 16) parts.push(boxesMesh(`${name}实接两侧梁的成列踏棍`, steel, rungs.slice(start, start + 16)));
  return parts;
}

function horizontalInsulator(x: number, y: number): ModelPart {
  const profile = [{ x: 0, y: -.35 }, { x: .038, y: -.35 }];
  for (const level of [-.24, -.08, .08, .24]) profile.push({ x: .038, y: level - .035 }, { x: .12, y: level }, { x: .038, y: level + .035 });
  profile.push({ x: .038, y: .35 }, { x: 0, y: .35 });
  return part("上下腕臂与H柱之间的有伞裙绝缘座", "lathe", porcelain, [x, y, 0], [1, 1, 1], [0, 0, 90], { profile });
}

function catenaryMast(): ModelPart[] {
  const p: ModelPart[] = [
    box("单线接触网立柱完整混凝土基础", -3.2, .18, 0, 1.2, .36, 1.2, concrete),
    box("H柱柱脚法兰与基础相接", -3.2, .4, 0, .64, .1, .64, steel),
    box("H柱贯通腹板", -3.2, 4.275, 0, .1, 7.75, .3, steel),
    ...[-1, 1].map(side => box("H柱两侧连续翼缘", -3.2, 4.275, side * .17, .34, 7.75, .055, steel)),
    box("H柱顶部防积水封板", -3.2, 8.18, 0, .36, .08, .4, steel),
    ...[5.7, 7.2].flatMap(y => [
      box("实际抱住H柱翼缘的腕臂固定夹座", -3.02, y, 0, .26, .23, .4, dark),
      horizontalInsulator(-2.65, y),
      pipe("绝缘座外端的金属腕臂铰接短头", [-2.34, y, 0], [-2.24, y, 0], .095),
    ]),
    pipe("从上绝缘座接至承力索夹座的上腕臂", [-2.28, 7.2, 0], [.18, 6.8, 0], .095),
    pipe("从下绝缘座接至承力索夹座的斜腕臂", [-2.28, 5.7, 0], [.18, 6.8, 0], .095),
    box("两腕臂顶点实际夹持承力索的夹座", .18, 6.8, 0, .19, .15, .16, dark),
    pipe("从下腕臂支出的接触线定位立管", [-.9, 6.317, 0], [-.9, 5.65, 0], .055),
    pipe("从定位立管连接接触线夹子的定位臂", [-.9, 5.65, 0], [.18, 5.5, 0], .042),
    box("定位臂端部夹住接触线的独立铜夹", .18, 5.5, 0, .09, .07, .11, copper),
    pipe("完整支柱承托的短跨连续接触线", [.18, 5.5, -6], [.18, 5.5, 6], .018),
    part("由腕臂实际支承的微垂承力索短跨", "tube", copper, [0, 0, 0], [1, 1, 1], [0, 0, 0], { radius: .012, path: [{ x: .18, y: 6.96, z: -6 }, { x: .18, y: 6.84, z: -3 }, { x: .18, y: 6.8, z: 0 }, { x: .18, y: 6.84, z: 3 }, { x: .18, y: 6.96, z: 6 }] }),
  ];
  for (const x of [-3.43, -2.97]) for (const z of [-.23, .23]) p.push(cylinder("柱脚法兰实际穿入基础的锚栓", x, .42, z, .045, .2, dark));
  for (const z of [-4.5, -2.25, 0, 2.25, 4.5]) {
    const top = 6.8 + .16 * z * z / 36;
    p.push(pipe("承力索向接触线传递重量的独立吊弦", [.18, top, z], [.18, 5.5, z], .012));
  }
  return p;
}

function semaphoreSignal(): ModelPart[] {
  const p: ModelPart[] = [
    box("臂板信号机独立落地基础", 0, .14, .12, .95, .28, 1.05, concrete),
    box("固定立柱的厚法兰底板", 0, .33, 0, .44, .1, .44, dark),
    box("信号立柱连续白色上段", 0, 3.46, 0, .18, 5.96, .2, "#d7d4be"),
    box("白柱下段耐污钢套", 0, .92, 0, .24, 1.1, .26, dark),
    cylinder("旗板和眼镜架共用并穿入立柱的实轴", 0, 5.7, -.05, .14, .54, steel, [90, 0, 0]),
    box("横向停止指示的独立旗板", .82, 5.7, -.22, 1.62, .28, .055, "#b96553"),
    box("旗板远端贯穿上下边的白色标带", 1.37, 5.7, -.254, .17, .28, .016, "#e3ddc6"),
    pipe("固定灯箱实际连接立柱的横向支承", [0, 5.83, .16], [-.38, 5.83, .16], .07),
    cylinder("红镜片后方固定发光灯的遮光灯箱", -.38, 5.83, .08, .33, .3, dark, [90, 0, 0]),
    pipe("臂板后侧实际连到拉索的驱动曲柄", [0, 5.7, .17], [-.33, 5.23, .17], .065),
    pipe("实轴另一侧的短配重摇臂", [0, 5.7, .17], [.42, 5.24, .17], .065),
    box("与摇臂末端相接的失效回位配重", .42, 5.18, .17, .23, .22, .16, dark),
    pipe("从上曲柄连续接到底部收索器的拉线", [-.33, 5.23, .17], [-.33, 1.08, .17], .012),
    box("收索驱动器实际固定到立柱的承台", -.18, 1.03, .13, .55, .08, .44, steel),
    box("下部拉线收索传动箱", -.28, 1.26, .16, .34, .4, .32, dark),
    ...accessLadder("信号柱背面登检梯", 0, .31, .28, 6.15, .48),
    pipe("登检梯顶部实际固定于立柱的左连接", [-.24, 6.1, .31], [0, 6.1, 0], .04),
    pipe("登检梯顶部实际固定于立柱的右连接", [.24, 6.1, .31], [0, 6.1, 0], .04),
  ];
  const lensCenters: [number, number][] = [[-.38, 5.83], [-.38, 5.35]];
  const holes = lensCenters.map(([x, y]) => Array.from({ length: 12 }, (_, i) => { const a = i * Math.PI / 6; return [x + Math.cos(a) * .142, -y + Math.sin(a) * .142] as [number, number]; }));
  const spectacle = polygon("旗板根部上下双色镜片所在的真实透孔眼镜架", dark, [[-.64, -6.04], [-.1, -6.04], [.08, -5.77], [.08, -5.55], [-.1, -5.12], [-.64, -5.12]], .055, [0, 0, -.2], holes);
  spectacle.rotation.x = 90;
  p.push(spectacle);
  for (let index = 0; index < lensCenters.length; index++) {
    const [x, y] = lensCenters[index]!;
    p.push(part("眼镜架实际孔内的独立有色透光镜片", "cylinder", index ? "#7d9d87" : "#bf7867", [x, y, -.195], [.278, .028, .278], [90, 0, 0], { opacity: .55, ...(index ? {} : { emissive: "#b96151", emissiveIntensity: .32 }) }));
  }
  return p;
}

function waterCrane(): ModelPart[] {
  const p: ModelPart[] = [
    box("注水鹤独立阀井基础", 0, .15, 0, 1.3, .3, 1.3, concrete),
    cylinder("供水立管的承压底座", 0, .47, 0, .62, .4, dark),
    cylinder("从阀井上升的固定供水立管", 0, 2.48, 0, .3, 4.1, steel),
    cylinder("立管顶部承接转动臂的同轴座", 0, 4.34, 0, .45, .38, dark),
    cylinder("可旋转的上节弯颈立管", 0, 4.83, 0, .3, .8, steel),
    cylinder("旋转座上方连到拉杆的高位实柱", 0, 5.63, 0, .12, .82, steel),
    pipe("从固定立管伸出的低位阀门支路", [0, .85, 0], [-.55, .85, 0], .12),
    cylinder("低位阀杆与供水支路实际相接", -.55, 1.04, 0, .045, .4, steel),
    ring("阀杆上端可操纵的手轮", dark, .18, .035, 1.24, .045, { position: { x: -.55, y: 1.24, z: 0 } }),
    ...[-1, 1].map(side => beam("阀门手轮与中心阀杆相接的辐条", dark, [-.55, 1.24, 0], [-.55 + side * .16, 1.24, 0], .025)),
    part("立管经弯颈接到外伸注水臂的连续水管", "tube", steel, [0, 0, 0], [1, 1, 1], [0, 0, 0], { radius: .15, path: [{ x: 0, y: 4.9, z: 0 }, { x: .1, y: 5.15, z: 0 }, { x: .4, y: 5.25, z: 0 }, { x: 3.8, y: 5.25, z: 0 }, { x: 4.16, y: 5.1, z: 0 }, { x: 4.26, y: 4.82, z: 0 }] }),
    pipe("从同轴高柱接到注水臂抱箍的抗弯斜拉杆", [0, 5.98, 0], [3.7, 5.43, 0], .055),
    part("臂端斜拉杆实际套接的加强抱箍", "lathe", dark, [3.7, 5.25, 0], [1, 1, 1], [0, 0, 90], { profile: [{ x: .145, y: -.1 }, { x: .195, y: -.1 }, { x: .195, y: .1 }, { x: .145, y: .1 }, { x: .145, y: -.1 }] }),
    part("从弯颈末端自然向下注水的垂落软管", "tube", "#697776", [0, 0, 0], [1, 1, 1], [0, 0, 0], { radius: .145, path: [{ x: 4.26, y: 4.86, z: 0 }, { x: 4.29, y: 4.45, z: .04 }, { x: 4.36, y: 3.8, z: .1 }, { x: 4.38, y: 3.1, z: .12 }, { x: 4.37, y: 2.65, z: .1 }] }),
    part("软管末端保留真实出水孔的管嘴", "lathe", dark, [4.37, 2.65, .1], [1, 1, 1], [0, 0, 0], { profile: [{ x: .123, y: -.12 }, { x: .156, y: -.12 }, { x: .156, y: .12 }, { x: .123, y: .12 }, { x: .123, y: -.12 }] }),
    box("注水落点下方的落地排水格框", 4.35, .07, .1, 1.25, .14, 1.5, concrete),
  ];
  for (const y of [.55, 3.95]) p.push(cylinder("固定立管的加厚法兰接头", 0, y, 0, .46, .12, dark));
  for (const side of [-1, 1]) p.push(box("排水格两侧留出格栅槽的框边", 4.35 + side * .49, .17, .1, .13, .1, 1.3, dark));
  p.push(boxesMesh("接到框边的独立排水横栅", steel, Array.from({ length: 9 }, (_, i) => ({ center: [4.35, .17, -.46 + i * .14] as Triple, size: [.9, .07, .035] as Triple }))));
  return p;
}

function signalBridge(): ModelPart[] {
  const p: ModelPart[] = [];
  for (const x of [-7.5, 7.5]) {
    p.push(box("信号桥桁腿独立落地基础", x, .18, 0, 1.45, .36, 1.9, concrete), box("桁腿柱脚将前后柱连接到基础的底板", x, .4, 0, .75, .12, 1.2, steel));
    for (const z of [-.4, .4]) p.push(box("信号桥前后两根真实落地承柱", x, 4.04, z, .22, 7.36, .22, steel));
    for (let level = 0; level < 3; level++) {
      const lower = .55 + level * 2.35, upper = lower + 2.35;
      p.push(beam("双柱之间实际相连的桁腿斜腹杆", steel, [x, lower, -.4], [x, upper, .4], .105), beam("桁腿反向斜腹杆", steel, [x, lower, .4], [x, upper, -.4], .105), pipe("桁腿腹杆节点横向连接撑", [x, upper, -.4], [x, upper, .4], .1));
    }
  }
  for (const z of [-.4, .4]) {
    for (const y of [7.6, 8.6]) p.push(box("跨线横桁的连续上下弦杆", 0, y, z, 15.25, .16, .16, steel));
    for (let i = 0; i <= 6; i++) p.push(box("横桁节点连接上下弦杆的竖腹杆", -7.5 + i * 2.5, 8.1, z, .09, 1.04, .09, steel));
    for (let i = 0; i < 6; i++) p.push(beam("横桁各节间保持通透的斜腹杆", steel, [-7.5 + i * 2.5, i % 2 ? 8.6 : 7.6, z], [-5 + i * 2.5, i % 2 ? 7.6 : 8.6, z], .09));
  }
  p.push(box("落在上弦杆上的完整检修信号走道", 0, 8.7, 0, 15.55, .12, 1.1, dark));
  for (const z of [-.51, .51]) {
    const start = z > 0 ? -7.12 : -7.7;
    p.push(pipe("在西侧梯口留真实缺口的上扶手", [start, 9.8, z], [7.7, 9.8, z], .055), pipe("在西侧梯口留真实缺口的中挡杆", [start, 9.26, z], [7.7, 9.26, z], .04));
    p.push(boxesMesh("从检修走道实际立起并避开梯口的护栏立柱", steel, Array.from({ length: 9 }, (_, i) => ({ center: [start + (7.6 - start) * i / 8, 9.27, z] as Triple, size: [.055, 1.08, .055] as Triple }))));
  }
  for (const x of [-3.2, 3.2]) {
    p.push(box("从横桁下弦杆实际垂下的信号吊臂", x, 7.08, -.4, .12, 1.12, .16, dark), box("垂吊信号头完整不透光背板", x, 6.5, -.5, .72, 1.4, .17, dark));
    for (let i = 0; i < 3; i++) {
      const y = 6.95 - i * .45, color = ["#af6958", "#b9a06b", "#7f9e87"][i]!;
      p.push(part("固定信号头中独立的圆形光色镜面", "cylinder", color, [x, y, -.598], [.265, .04, .265], [90, 0, 0], { ...(i === 0 ? { emissive: color, emissiveIntensity: .3 } : {}) }));
      p.push(part("每只镜面外侧保持真实开口的遮光筒", "lathe", dark, [x, y, -.66], [1, 1, 1], [90, 0, 0], { profile: [{ x: .137, y: -.08 }, { x: .165, y: -.08 }, { x: .165, y: .08 }, { x: .137, y: .08 }, { x: .137, y: -.08 }] }));
    }
  }
  p.push(...accessLadder("西桁腿侧面直达检修走道的落地爬梯", -7.5, .72, .36, 8.88, .48));
  for (const y of [1, 4.8, 8.5]) for (const side of [-1, 1]) p.push(pipe("爬梯与桁腿实际相接的固定撑脚", [-7.5 + side * .24, y, .72], [-7.5, y, .4], .045));
  return p;
}
