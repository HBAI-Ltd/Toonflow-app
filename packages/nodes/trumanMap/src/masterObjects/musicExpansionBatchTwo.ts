import { part, type ModelPart, type Triple } from "../assetModelParts";
import { box, cylinder, rod, ball, loop, cord, plate, piercedPanel, material, type MasterPrototype } from "./parts";
import { soundBox, hollowPipe } from "./musicExpansionBatchOne";

export function keyboard(width: number, y: number, z: number, count = 20): ModelPart[] {
  const parts = Array.from({ length: count }, (_, index) => box("有独立间隙的演奏白键", [(index - (count - 1) / 2) * width / count, y, z], [width / count * .92, .018, .18], material.ivory));
  for (let index = 0; index < count - 1; index++) if (![2, 6].includes(index % 7)) parts.push(box("白键之间较短的半音键", [(index - (count - 2) / 2) * width / count, y + .016, z + .045], [width / count * .5, .016, .085], material.dark));
  return parts;
}

function tableLegs(width: number, depth: number, height: number): ModelPart[] {
  return [-1, 1].flatMap(x => [-1, 1].map(z => box("承重桌式琴脚", [x * width / 2, height / 2, z * depth / 2], [.045, height, .045], material.wood)));
}

function closedRing(name: string, x: number, y: number, z: number, radius: number, height: number, color = material.wood): ModelPart {
  return part(name, "lathe", color, [x, y, z], [1, 1, 1], [0, 0, 0], { profile: [{ x: radius, y: 0 }, { x: radius, y: height }, { x: radius - .008, y: height }, { x: radius - .008, y: 0 }, { x: radius, y: 0 }] });
}

function octobass(): ModelPart[] {
  const outline: [number, number][] = [[0, .2], [-.42, .22], [-.55, .5], [-.48, .95], [-.28, 1.12], [-.27, 1.3], [-.39, 1.44], [-.3, 1.7], [0, 1.88], [.3, 1.7], [.39, 1.44], [.27, 1.3], [.28, 1.12], [.48, .95], [.55, .5], [.42, .22]];
  const parts = soundBox(outline, .3, [[[-.24, .66], [-.19, .7], [-.19, .98], [-.24, 1.03], [-.22, .91], [-.22, .76]], [[.24, .66], [.19, .7], [.19, .98], [.24, 1.03], [.22, .91], [.22, .76]]]);
  parts.push(box("承载机械截弦器的长琴颈", [0, 2.35, -.005], [.12, 1.2, .11], material.wood), box("琴颈前的长指板", [0, 2.14, -.07], [.115, 1.23, .02], material.dark), box("琴头三弦轴箱", [0, 3.05, -.015], [.15, .35, .12], material.wood), rod("落地尾柱", [0, .01, 0], [0, .3, 0], .035, material.steel), box("为演奏者提供站位的平台", [.83, .11, 0], [.62, .22, .64], material.wood), box("供左手操作截弦杆的竖轴座", [.25, 2.2, .035], [.06, .75, .06], material.dark));
  for (let index = 0; index < 3; index++) parts.push(rod("跨过下琴马的低音弦", [(index - 1) * .032, .4, -.225], [(index - 1) * .032, 3.17, -.1], .003, material.steel), rod("侧向贯通的巨大调弦轴", [-.15, 2.96 + index * .09, -.015], [.15, 2.96 + index * .09, -.015], .025, material.wood));
  for (let index = 0; index < 7; index++) { const y = 1.93 + index * .115; parts.push(rod("横跨琴颈按下琴弦的独立截弦杠杆", [-.085, y, -.115], [.25, y, -.115], .014, material.steel), rod("从截弦杠杆通向演奏者的操纵连杆", [.25, y, -.115], [.53, 1.58 + index * .055, -.04], .012, material.steel), ball("机械截弦器的手握端", [.53, 1.58 + index * .055, -.04], [.04, .035, .035], material.dark)); }
  parts.push(piercedPanel("下方镂空双足大琴马", [0, .69, -.185], [[-.16, 0], [.16, 0], [.18, .16], [.1, .22], [-.1, .22], [-.18, .16]], [[[-.1, .02], [-.1, .12], [.1, .12], [.1, .02]]], .02, material.wood, [-90, 0, 0]));
  return parts;
}

function pedalSteel(): ModelPart[] {
  const parts: ModelPart[] = [...tableLegs(.95, .32, .69), box("落地钢棒吉他的长演奏琴台", [0, .75, 0], [1.1, .12, .4], material.wood), box("平卧而没有指按音品的长指板", [0, .824, 0], [.72, .025, .18], material.dark), box("右侧带转指的变调琴桥总成", [.45, .84, 0], [.12, .055, .18], material.steel), box("琴台左端弦枕", [-.45, .845, 0], [.03, .04, .18], material.ivory), rod("联动脚踏板的底横轴", [-.46, .08, -.16], [.46, .08, -.16], .025)];
  for (let index = 0; index < 10; index++) { const z = (index - 4.5) * .013; parts.push(rod("悬于平卧指板上的独立琴弦", [-.46, .862, z], [.47, .862, z], .0015, material.steel)); }
  for (let index = 0; index < 6; index++) { const x = (index - 2.5) * .13; parts.push(box("改变弦张力的独立脚踏板", [x, .055, -.25], [.055, .025, .23], material.dark, [-8, 0, 0]), rod("从脚踏板直连琴底的变调拉杆", [x, .08, -.17], [x, .7, -.17], .007, material.steel), rod("琴底通向变调琴桥的拉索", [x, .7, -.17], [.46, .7, -.05 + index * .018], .005, material.steel)); }
  parts.push(...[-1, 1].map(side => box("膝盖向内推压的侧变调杠杆", [side * .17, .57, -.08], [.035, .23, .07], material.steel)), cylinder("平放在琴台上的抛光演奏钢棒", [.09, .875, .13], [.025, .08, .025], material.steel, [0, 0, 90]));
  return parts;
}

function clavicytherium(): ModelPart[] {
  const parts: ModelPart[] = [...tableLegs(.75, .37, .65), box("立式拨弦琴的键盘台框", [0, .73, -.1], [.94, .16, .5], material.wood), ...keyboard(.82, .82, -.29, 18), ...soundBox([[-.43, .79], [.43, .79], [.43, 2.32], [.16, 2.48], [-.12, 2.31], [-.43, 1.72]], .18, [])];
  for (let index = 0; index < 18; index++) { const x = (index - 8.5) * .041, height = 1.5 - index * .048; parts.push(rod("位于立琴箱中的竖直金属弦", [x, .91, -.113], [x, .91 + height, -.113], .0015, material.steel), box("由琴键转向机构提升的独立拨弦跳杆", [x, .93, -.12], [.013, .14, .016], material.dark)); }
  parts.push(rod("横向限住拨弦跳杆的上导轨", [-.4, 1.02, -.14], [.4, 1.02, -.14], .022, material.wood), ...[-1, 1].map(side => box("包住转向键杆的侧端支架", [side * .44, .88, -.17], [.05, .19, .32], material.wood)));
  return parts;
}

function dulcitone(): ModelPart[] {
  const parts: ModelPart[] = [...tableLegs(.83, .28, .62), box("音叉琴承重浅木箱底", [0, .68, 0], [.99, .08, .38], material.wood), ...[-1, 1].map(side => box("音叉琴箱侧壁", [side * .48, .78, 0], [.025, .18, .38], material.wood)), box("后壁音叉固定梁", [0, .79, .16], [.94, .09, .045], material.wood), ...keyboard(.88, .75, -.15, 18)];
  for (let index = 0; index < 12; index++) { const x = (index - 5.5) * .071, length = .15 - index * .006;
    parts.push(piercedPanel("具有真实齿间开槽的独立U形钢音叉", [x, .826, .12], [[-.022, -length], [-.014, -length], [-.014, -.004], [.014, -.004], [.014, -length], [.022, -length], [.022, .004], [-.022, .004]], [], .008, material.steel), rod("琴键后端向音叉弹起的短锤杆", [x, .75, -.015], [x, .815, .06], .006, material.wood), ball("音叉下方的小毡锤头", [x, .815, .06], [.018, .016, .022], material.ivory));
  }
  parts.push(box("统一抬起制音毡条的后横杆", [0, .8, .095], [.9, .018, .025], material.dark), box("前脚下的延音脚踏板", [.25, .045, -.2], [.08, .02, .17], material.wood), rod("从脚踏板连到制音杆的细链", [.25, .06, -.15], [.25, .79, .09], .004, material.steel));
  return parts;
}

function hydraulis(): ModelPart[] {
  const parts: ModelPart[] = [box("古水风琴稳固底座", [0, .07, 0], [1.5, .14, .72], material.wood), box("将稳压空气分配给各音管的上风箱", [0, .83, 0], [1.25, .16, .32], material.wood), cylinder("盛水稳压的开口外水槽底", [0, .2, .14], [.5, .06, .5], material.wood), closedRing("稳压水槽的真实圆壁", 0, .23, .14, .25, .45), part("开底而顶端封闭的真实薄壁稳风钟罩", "lathe", material.steel, [0, .49, .14], [1, 1, 1], [0, 0, 0], { profile: [{ x: .17, y: -.19 }, { x: .17, y: .19 }, { x: 0, y: .19 }, { x: 0, y: .182 }, { x: .162, y: .182 }, { x: .162, y: -.19 }, { x: .17, y: -.19 }] }), hollowPipe("从钟罩引至风箱的真实气管", [[0, .68, .14], [0, .78, .14], [0, .83, 0]], [.025, .025, .025], .005, material.steel), ...keyboard(1.1, .85, -.25, 18)];
  for (let index = 0; index < 13; index++) { const x = (index - 6) * .084, height = .55 + (12 - index) * .055; parts.push(hollowPipe("口部真正开放的渐长古风琴管", [[x, .91, .05], [x, .91 + height, .05]], [.023, .023], .004, material.steel)); }
  for (const side of [-1, 1]) parts.push(cylinder("人力抽送空气的独立活塞泵筒", [side * .58, .39, .2], [.12, .5, .12], material.steel), rod("泵筒中的活塞杆", [side * .58, .39, .2], [side * .58, .79, .2], .02, material.steel), rod("泵顶手动压杆", [side * .58, .78, .2], [side * .84, .62, .2], .025, material.wood), hollowPipe("泵筒至稳压钟罩的下通气管", [[side * .58, .16, .2], [side * .3, .16, .2], [0, .32, .14]], [.018, .018, .018], .004, material.steel));
  return parts;
}

function calliope(): ModelPart[] {
  const parts: ModelPart[] = [...tableLegs(1.25, .55, .48), box("汽笛琴的金属承重台", [0, .54, 0], [1.5, .12, .74], material.dark), cylinder("独立供气汽笛总管", [0, .78, .18], [.095, 1.35, .095], material.steel, [0, 0, 90]), ...keyboard(1.25, .64, -.27, 16)];
  for (let index = 0; index < 15; index++) {
    const x = (index - 7) * .088, height = .22 + (14 - index) * .024;
    parts.push(
      part("上端封闭而下端开放的汽笛共鸣钟筒", "lathe", material.steel, [x, .88, .18], [1, 1, 1], [0, 0, 0], { profile: [{ x: .034, y: 0 }, { x: .034, y: height }, { x: 0, y: height }, { x: 0, y: height - .006 }, { x: .028, y: height - .006 }, { x: .028, y: 0 }, { x: .034, y: 0 }] }),
      part("连续成形的汽阀支颈与环隙喷气盘", "lathe", material.steel, [x, .78, .18], [1, 1, 1], [0, 0, 0], { profile: [{ x: 0, y: 0 }, { x: .0085, y: 0 }, { x: .0085, y: .066 }, { x: .04, y: .066 }, { x: .04, y: .084 }, { x: .0085, y: .084 }, { x: .0085, y: .1 }, { x: 0, y: .1 }] }),
      rod("由前排键杆控制的独立汽阀连杆", [x, .64, -.16], [x, .78, .15], .007, material.steel),
    );
  }
  parts.push(hollowPipe("接入外置汽源的粗供应弯管", [[.72, .78, .18], [.91, .78, .18], [.91, .18, .18]], [.04, .04, .04], .005, material.steel));
  return parts;
}

function tubulum(): ModelPart[] {
  const parts: ModelPart[] = [...[-1, 1].flatMap(side => [rod("支撑端击音管的两侧框柱", [side * .7, .02, 0], [side * .7, 1.05, 0], .045), rod("两侧展开的防倾横脚", [side * .7, .025, -.35], [side * .7, .025, .55], .045)]), rod("将所有管口固定在演奏高度的前梁", [-.72, .92, -.03], [.72, .92, -.03], .04), rod("托住后方回弯段的后梁", [-.72, .3, .42], [.72, .3, .42], .035)];
  for (let index = 0; index < 10; index++) { const x = (index - 4.5) * .137, low = .1 + index * .045; parts.push(hollowPipe("留双端开口并折返的独立端击音管", [[x, .95, -.12], [x, low + .08, -.12], [x, low, .03], [x, low, .35], [x, low + .1, .45], [x, .5 + index * .035, .45]], [.048, .048, .048, .048, .048, .048], .006, material.glass)); }
  parts.push(...[-1, 1].map(side => plate("拍击管口的独立软胶扇拍", [side * .12, .03, -.38], [[-.055, -.1], [.055, -.1], [.07, .08], [0, .12], [-.07, .08]], .014, material.dark)));
  return parts;
}

function claviharp(): ModelPart[] {
  const parts: ModelPart[] = [box("键控竖琴的落地钢性底架", [0, .08, 0], [1.1, .16, .66], material.dark), rod("承担弦张力的前立柱", [.44, .17, .12], [.44, 1.98, .12], .09, material.wood), rod("三角弦架的弯曲顶梁", [-.42, 1.47, .12], [.44, 1.98, .12], .085, material.wood), rod("倾斜的长共鸣音箱下梁", [-.34, .16, .12], [-.42, 1.47, .12], .16, material.wood), box("键控机构的前演奏台", [0, .76, -.25], [1.02, .17, .38], material.wood), ...keyboard(.91, .86, -.34, 16)];
  for (let index = 0; index < 15; index++) {
    const t = index / 14, x = -.34 + t * .73, top = 1.52 + t * .43, low = .24 + t * .3;
    parts.push(rod("从音箱斜向顶梁独立张紧的竖琴弦", [-.345 - (low - .24) * .06, low, .1], [x, top, .1], .0015, material.steel), rod("把前键动作转到对应弦的拨弦传动杆", [(index - 7) * .06, .82, -.2], [-.35, low + .08, .03], .005, material.steel), rod("轻触弦后侧向退出的独立横拨钩", [-.35, low + .08, .03], [-.33, low + .08, .105], .004, material.wood));
  }
  parts.push(...[-1, 1].map(side => rod("前演奏台的承重斜撑", [side * .42, .15, -.12], [side * .42, .74, -.24], .04, material.wood)));
  return parts;
}

function dripDrum(): ModelPart[] {
  const parts: ModelPart[] = [...[-1, 1].map(side => rod("水滴鼓装置的高位承重柱", [side * .48, .025, 0], [side * .48, 2.15, 0], .04)), ...[-1, 1].map(side => rod("支柱两端展开的防倾脚", [side * .48, .025, -.4], [side * .48, .025, .4], .04)), rod("承载高位滴水罐的横梁", [-.5, 2.15, 0], [.5, 2.15, 0], .045), part("上方储水罐的真实开口薄壳", "lathe", material.steel, [0, 1.78, 0], [1, 1, 1], [0, 0, 0], { profile: [{ x: 0, y: 0 }, { x: .14, y: 0 }, { x: .14, y: .3 }, { x: .135, y: .3 }, { x: .135, y: .006 }, { x: 0, y: .006 }] }), box("固定储水罐的梁下托座", [0, 1.7625, 0], [.34, .035, .32], material.dark), ...[-1, 1].map(side => rod("把储水罐托座吊到上横梁的短支杆", [side * .17, 1.7625, 0], [side * .17, 2.15, 0], .018)), hollowPipe("从罐底引出并向下的节流滴水嘴", [[0, 1.79, 0], [0, 1.67, 0]], [.008, .008], .002, material.steel), cylinder("滴水嘴上的流量调节阀", [0, 1.72, 0], [.027, .04, .027], material.steel), rod("滴水阀横向小手柄", [-.04, 1.73, 0], [.04, 1.73, 0], .008, material.dark), part("接收离散水滴起振的薄壁凹面金属盘", "lathe", material.steel, [0, .62, 0], [1, 1, 1], [0, 0, 0], { profile: [{ x: 0, y: 0 }, { x: .12, y: .012 }, { x: .24, y: .055 }, { x: .28, y: .1 }, { x: .277, y: .103 }, { x: .237, y: .058 }, { x: .119, y: .015 }, { x: 0, y: .003 }] }), rod("让接水盘可以轻微摆动的侧向铰轴", [-.34, .67, 0], [.34, .67, 0], .018), ...[-1, 1].map(side => rod("将凹盘边缘接到铰轴的短托臂", [side * .24, .68, 0], [side * .34, .67, 0], .013)), ...[-1, 1].map(side => cord("悬住铰轴而不夹死盘体的软吊线", [[side * .34, .67, 0], [side * .48, 1.1, 0]], .004, material.dark)), box("改变盘体阻尼的足踏控制板", [0, .045, -.36], [.18, .025, .23], material.wood), rod("将足踏动作传给盘边的机械连杆", [0, .055, -.28], [0, .71, -.24], .009, material.steel), cylinder("落在盘缘改变振动阻尼的小毡头", [0, .718, -.24], [.025, .012, .025], material.dark)];
  for (let index = 0; index < 4; index++) parts.push(part("滴水路径中的静态离散水滴", "sphere", "#a2c5d0", [0, .85 + index * .2, 0], [.012, .018, .012], [0, 0, 0], { opacity: .6 }));
  return parts;
}

function carnyx(): ModelPart[] {
  return [hollowPipe("从演奏者嘴部上竖的长兽首号管", [[0, .25, -.25], [0, .3, 0], [0, 1.2, 0], [0, 2.05, 0]], [.016, .022, .035, .047], .004, material.wood), hollowPipe("上端向前展开的长吻中空兽首", [[0, 2.05, 0], [0, 2.18, -.09], [0, 2.2, -.24]], [.047, .07, .095], .005, material.wood), ...[-1, 1].map(side => plate("兽首上举的长耳片", [side * .085, 2.15, -.03], [[-.025, 0], [.025, 0], [.04, .21], [0, .28], [-.035, .18]], .008, material.wood, [0, side * 20, side * -25])), plate("由真实铰轴向前下方张开的独立活动下颌", [0, 2.12, -.08], [[-.055, 0], [.055, 0], [.07, .16], [.05, .23], [-.05, .23], [-.07, .16]], .009, material.wood, [-112, 0, 0]), rod("让下颌可张合的横向铰轴", [-.07, 2.12, -.08], [.07, 2.12, -.08], .014, material.dark), ...[-1, 1].map(side => ball("兽首侧眼", [side * .071, 2.19, -.1], [.02, .02, .02], material.dark))];
}

function lur(): ModelPart[] {
  const path: Triple[] = [[-.12, .12, 0], [-.22, .38, .01], [-.16, .72, .035], [.13, .88, .06], [.35, 1.05, .08], [.38, 1.36, .07], [.14, 1.55, .02], [-.16, 1.45, -.04], [-.24, 1.14, -.08], [-.08, .95, -.12], [.16, 1.02, -.15], [.24, 1.3, -.18]];
  return [hollowPipe("围成两道自由曲环的连续青铜鲁尔号管", path, path.map((_, index) => .012 + index * .0038), .0035, material.wood), part("管末横向展开并保留中央出声孔的圆盘喇叭", "lathe", material.wood, [.24, 1.3, -.18], [1, 1, 1], [0, 0, 0], { profile: [{ x: .05, y: 0 }, { x: .18, y: .08 }, { x: .2, y: .08 }, { x: .2, y: .086 }, { x: .176, y: .086 }, { x: .046, y: .006 }, { x: .05, y: 0 }] }), hollowPipe("小杯形唇振吹嘴", [[-.12, .12, 0], [-.1, .08, 0]], [.012, .02], .003, material.wood)];
}

function guqin(): ModelPart[] {
  const outline: [number, number][] = [[-.12, -.62], [.12, -.62], [.115, -.42], [.09, -.35], [.095, .3], [.075, .35], [.075, .61], [-.075, .61], [-.075, .35], [-.095, .3], [-.09, -.35], [-.115, -.42]];
  const body = piercedPanel("具有底部龙池和凤沼声口的古琴底板", [0, .018, 0], outline, [[[-.03, -.22], [-.03, .1], [.03, .1], [.03, -.22]], [[-.025, .35], [-.025, .45], [.025, .45], [.025, .35]]], .007, material.wood);
  const rim = piercedPanel("围出古琴内部长腔的侧圈", [0, .025, 0], outline, [outline.map(([x, z]) => [x * .9, z * .96] as [number, number]).reverse()], .045, material.wood);
  const parts: ModelPart[] = [body, rim, piercedPanel("连续而不设活动琴码的古琴上音板", [0, .073, 0], outline, [], .008, material.dark), box("头端七弦越过的整条岳山", [0, .088, -.56], [.22, .012, .02], material.ivory), box("尾端承弦的整条龙龈", [0, .087, .57], [.14, .012, .017], material.wood)];
  for (let index = 0; index < 7; index++) parts.push(rod("无音品而直接按到音板的七根琴弦", [-.085 + index * .028, .098, -.57], [-.055 + index * .018, .094, .58], .0016, material.ivory), cylinder("底面独立调张的琴轸", [-.084 + index * .028, .009, -.5], [.014, .018, .014], material.wood));
  for (let index = 0; index < 13; index++) parts.push(cylinder("沿单侧嵌入而不突出成品的音位徽", [-.088, .083, -.43 + index * .075], [.005, .001, .005], material.ivory));
  return parts;
}

function rudraVeena(): ModelPart[] {
  const parts: ModelPart[] = [rod("横跨双葫芦的连续长竹琴杆", [-.92, .53, 0], [.92, .53, 0], .082, material.wood)];
  for (const side of [-1, 1]) parts.push(part("两端独立的大型中空葫芦共鸣器", "lathe", material.wood, [side * .56, .015, 0], [1, 1, 1], [0, 0, 0], { profile: [{ x: 0, y: 0 }, { x: .18, y: .03 }, { x: .26, y: .19 }, { x: .22, y: .36 }, { x: .08, y: .46 }, { x: .075, y: .46 }, { x: .21, y: .355 }, { x: .251, y: .19 }, { x: .174, y: .038 }, { x: 0, y: .009 }] }), rod("将琴杆连接到葫芦顶部的承振颈", [side * .56, .45, 0], [side * .56, .53, 0], .075, material.wood));
  for (let index = 0; index < 18; index++) parts.push(rod("沿竹杆横列的高拱金属音品", [-.6 + index * .071, .594, -.055], [-.6 + index * .071, .594, .055], .01, material.steel));
  for (let index = 0; index < 4; index++) parts.push(rod("从桥上横跨所有高音品的主奏弦", [-.82, .615, -.028 + index * .019], [.82, .615, -.028 + index * .019], .0017, material.steel), rod("琴杆端部的独立调弦轴", [.78 + index * .045, .53, -.075], [.78 + index * .045, .53, .075], .018, material.wood));
  parts.push(box("端部宽面泛音琴桥", [-.78, .59, 0], [.09, .07, .12], material.ivory));
  return parts;
}

function saraswatiVeena(): ModelPart[] {
  const parts: ModelPart[] = [part("雕木大琴腹的中空半球共鸣壳", "lathe", material.wood, [0, .22, .58], [1, 1, 1], [0, 0, 0], { profile: [{ x: 0, y: -.2 }, { x: .15, y: -.15 }, { x: .24, y: -.03 }, { x: .25, y: .12 }, { x: .24, y: .16 }, { x: .231, y: .16 }, { x: .24, y: .115 }, { x: .23, y: -.025 }, { x: .145, y: -.14 }, { x: 0, y: -.19 }] }), cylinder("大琴腹顶部的薄木音板", [0, .385, .58], [.47, .008, .47], material.ivory), box("由琴腹通向龙首的粗长琴颈", [0, .36, .02], [.13, .09, .9], material.wood), ball("颈下承托的小型第二共鸣葫芦", [0, .18, -.32], [.23, .32, .23], material.wood), plate("向上卷曲的龙首琴头", [0, .34, -.46], [[-.03, -.03], [.09, -.03], [.17, .06], [.2, .16], [.14, .2], [.08, .17], [.12, .14], [.09, .08]], .09, material.wood, [0, 90, 0])];
  for (let index = 0; index < 18; index++) parts.push(box("固定在琴颈两侧蜡梁上的高弧音品", [0, .42, -.37 + index * .038], [.14, .012, .009], material.steel));
  for (let index = 0; index < 4; index++) parts.push(rod("从琴腹宽桥跨到头端的演奏弦", [-.034 + index * .022, .447, -.47], [-.034 + index * .022, .433, .67], .0016, material.steel));
  parts.push(box("大音板上高起的宽琴马", [0, .417, .65], [.17, .055, .06], material.ivory), ...[-1, 1].flatMap(side => [rod("粗琴颈上侧向插入的主弦轴", [side * .06, .37, -.34], [side * .13, .37, -.34], .022, material.dark), rod("琴颈第二列调弦轴", [side * .06, .37, -.24], [side * .13, .37, -.24], .022, material.dark)]));
  return parts;
}

function balafon(): ModelPart[] {
  const parts: ModelPart[] = [...[-1, 1].map(side => rod("木音板两侧的长承重梁", [-.8, .62, side * .23], [.8, .62, side * .15], .04, material.wood)), ...tableLegs(1.35, .3, .6)];
  for (let index = 0; index < 14; index++) { const x = (index - 6.5) * .113, length = .55 - index * .018, radius = .1 - index * .003;
    parts.push(box("按音高削薄且不贴死框架的硬木音键", [x, .665, 0], [.095, .035, length], material.wood), part("各音键下方独立的中空葫芦共鸣罐", "lathe", material.wood, [x, .38 + index * .006, 0], [1, 1, 1], [0, 0, 0], { profile: [{ x: 0, y: -.13 }, { x: radius * .8, y: -.1 }, { x: radius, y: 0 }, { x: radius * .8, y: .1 }, { x: .027, y: .2 - index * .006 }, { x: .021, y: .2 - index * .006 }, { x: radius * .74, y: .094 }, { x: radius - .006, y: 0 }, { x: radius * .73, y: -.094 }, { x: 0, y: -.124 }] }));
  }
  parts.push(...[-1, 1].map(side => rod("绑在木键两端槽中的连续悬线", [-.8, .65, side * .2], [.8, .65, side * .12], .004, material.dark)));
  return parts;
}

function clavicylinder(): ModelPart[] {
  const parts: ModelPart[] = [...tableLegs(.9, .36, .64), box("摩擦圆筒琴的浅机箱底", [0, .7, 0], [1.05, .1, .48], material.wood), ...keyboard(.93, .77, -.17, 18), cylinder("单个连续旋转的玻璃摩擦圆筒", [0, .92, .12], [.15, .9, .15], material.glass, [0, 0, 90]), ...[-1, 1].map(side => rod("玻璃圆筒主轴的独立轴承支座", [side * .47, .75, .12], [side * .47, .92, .12], .025, material.steel)), cylinder("将脚踏运动变成转动的侧飞轮", [.53, .83, .12], [.23, .018, .23], material.dark, [0, 0, 90]), box("脚踏摇板", [.18, .045, -.1], [.18, .025, .33], material.wood), rod("脚踏板与偏心飞轮之间的连杆", [.18, .06, .03], [.53, .9, .18], .012, material.steel)];
  for (let index = 0; index < 16; index++) { const x = (index - 7.5) * .055; parts.push(rod("按键时抵到旋转玻璃筒的独立调音杆", [x, .79, -.02], [x, .9, .045], .007, material.steel)); }
  return parts;
}

function geigenwerk(): ModelPart[] {
  const parts: ModelPart[] = [...tableLegs(.85, 1.1, .63), box("轮弓键琴的长共鸣箱底", [0, .71, .22], [1.06, .14, 1.47], material.wood), ...keyboard(.93, .8, -.39, 18), ...[-1, 1].map(side => box("抬高的琴箱侧缘", [side * .51, .86, .22], [.035, .22, 1.47], material.wood)), rod("横向驱动各擦弦圆轮的传动轴", [-.48, .9, .16], [.48, .9, .16], .018)];
  for (let index = 0; index < 5; index++) parts.push(cylinder("随传动轴转动的松香擦弦轮", [(index - 2) * .19, .9, .16], [.17, .045, .17], material.dark, [0, 0, 90]));
  for (let index = 0; index < 15; index++) { const x = (index - 7) * .06; parts.push(rod("键杆可抬起接触圆轮的长演奏弦", [x, .984, -.2], [x, .984, .87], .0016, material.steel), rod("将键盘运动传给弦端的短抬弦杆", [x, .8, -.22], [x, .98, -.17], .008, material.wood)); }
  parts.push(box("脚踩转动擦弦轮的往复踏板", [0, .055, .1], [.24, .025, .4], material.wood), cylinder("侧边低位传动大轮", [.58, .34, .16], [.38, .035, .38], material.dark, [0, 0, 90]), cord("脚踏大轮至擦弦轴端的闭合传动带", [[.58, .15, .16], [.58, .9, .06], [.58, 1, .16], [.58, .9, .26], [.58, .15, .16]], .007, material.wood));
  return parts;
}

function cimbalom(): ModelPart[] {
  const outline: [number, number][] = [[-.63, -.27], [.63, -.27], [.4, .31], [-.4, .31]];
  const parts: ModelPart[] = [...tableLegs(.9, .4, .63), piercedPanel("大型止音扬琴的梯形共鸣箱底", [0, .65, 0], outline, [], .012, material.wood), piercedPanel("具有真实长空腔的梯形琴箱侧圈", [0, .662, 0], outline, [outline.map(([x, z]) => [x * .95, z * .92] as [number, number]).reverse()], .09, material.wood), piercedPanel("保留独立声口的上部薄音板", [0, .752, 0], outline, [[[-.04, -.16], [-.04, -.08], [.04, -.08], [.04, -.16]]], .007, material.ivory), ...[-1, 1].map(side => rod("双列桥脚上的承弦高桥", [side * .19, .8, -.22], [side * .19, .8, .25], .035, material.ivory)), box("带连杆的前置止音脚踏板", [0, .045, -.29], [.18, .023, .23], material.wood), rod("脚踏板通向琴底止音轴的长拉杆", [0, .06, -.22], [0, .67, -.1], .012, material.steel), rod("琴底横向分配止音动作的转轴", [-.48, .68, .05], [.48, .68, .05], .018, material.steel)];
  for (let index = 0; index < 20; index++) { const z = -.23 + index * .025, half = .58 - (z + .23) * .34; parts.push(rod("跨过两列高琴桥的演奏弦组", [-half, .82, z], [half, .82, z], .0016, material.steel)); }
  parts.push(...[-1, 1].flatMap(side => [-1, 1].map(end => box("把承弦高桥接实薄音板的四个桥脚", [side * .19, .7765, end * .18], [.035, .035, .045], material.ivory))), ...[-1, 1].map(side => box("由脚踏统一抬离琴弦的长毡制音条", [side * .36, .808, .015], [.035, .018, .51], material.dark)));
  return parts;
}

function pyrophone(): ModelPart[] {
  const parts: ModelPart[] = [...tableLegs(.57, .47, .54), box("火焰风琴的木制气阀控制台", [0, .8, 0], [.7, .52, .58], material.wood), ...keyboard(.6, 1.075, -.17, 14), cylinder("为各燃烧器分气的横向总管", [0, 1.16, .12], [.034, .6, .034], material.steel, [0, 0, 90])];
  for (let index = 0; index < 9; index++) { const x = (index - 4) * .065, height = .35 + (8 - index) * .035;
    const tube = hollowPipe("火焰上方真实贯通的耐热玻璃谐振管", [[x, 1.18, .12], [x, 1.18 + height, .12]], [.023, .023], .002, material.glass); tube.opacity = .32;
    parts.push(tube, cylinder("玻璃管下部独立的气体燃烧喷嘴", [x, 1.195, .12], [.008, .05, .008], material.steel), part("燃烧器顶端的静态小火苗", "cone", "#c99865", [x, 1.24, .12], [.012, .045, .012], [0, 0, 0], { emissive: "#c89156", emissiveIntensity: .6 }));
  }
  return parts;
}

function baryton(): ModelPart[] {
  const parts = soundBox([[0, .03], [-.16, .06], [-.2, .2], [-.13, .35], [-.14, .5], [-.09, .64], [0, .7], [.09, .64], [.14, .5], [.13, .35], [.2, .2], [.16, .06]], .12, [[[-.08, .29], [-.11, .35], [-.11, .44], [-.08, .49], [-.09, .42], [-.09, .36]], [[.08, .29], [.11, .35], [.11, .44], [.08, .49], [.09, .42], [.09, .36]]]);
  parts.push(...[-1, 1].map(side => box("背面让拇指伸入的开槽琴颈侧壁", [side * .045, .93, .01], [.018, .54, .085], material.wood)), box("覆盖空颈正面的无品指板", [0, .88, -.045], [.092, .6, .009], material.dark), box("容纳两套琴弦的宽弦轴头", [0, 1.27, .01], [.14, .23, .1], material.wood), box("分开前奏弦与背共鸣弦的宽琴马", [0, .23, -.085], [.16, .055, .033], material.ivory));
  for (let index = 0; index < 7; index++) parts.push(rod("前方供弓擦奏的独立琴弦", [(index - 3) * .011, .12, -.107], [(index - 3) * .011, 1.35, -.06], .0015, material.steel));
  for (let index = 0; index < 10; index++) parts.push(rod("可以从琴颈背槽用拇指拨动的共鸣弦", [(index - 4.5) * .006, .25, .045], [(index - 4.5) * .006, 1.36, .045], .0012, material.steel));
  for (let index = 0; index < 7; index++) parts.push(rod("两套弦共用琴头的横向调音轴", [-.11, 1.17 + index * .031, .01], [.11, 1.17 + index * .031, .01], .012, material.wood));
  return parts;
}

function longStringInstrument(): ModelPart[] {
  const parts: ModelPart[] = [];
  for (const side of [-1, 1]) {
    parts.push(box("完整装置两端的落地重锚基座", [0, .17, side * 10.4], [2, .34, .7], material.dark), ...[-1, 1].map(x => box("锚架独立承力柱", [x * .83, .7, side * 10.4], [.12, 1.1, .16], material.wood)), box("承接所有弦拉力的横向总梁", [0, 1.12, side * 10.4], [1.8, .14, .18], material.wood), box("开放演奏端的共鸣木箱底", [0, .59, side * 10.13], [1.7, .06, .5], material.wood), ...[-1, 1].map(x => box("共鸣箱侧壁", [x * .84, .83, side * 10.13], [.025, .45, .5], material.wood)), box("共鸣箱背面薄板", [0, .83, side * 10.36], [1.7, .45, .025], material.wood));
  }
  for (let index = 0; index < 24; index++) { const x = (index - 11.5) * .06; parts.push(rod("跨越整段空间以纵向摩擦起声的长钢弦", [x, 1.15, -10.35], [x, 1.15, 10.35], .0015, material.steel)); }
  return parts;
}

function hydraulophone(): ModelPart[] {
  const parts: ModelPart[] = [...[-1, 1].map(side => box("公共液鸣琴的两端落地支脚", [side * .8, .38, 0], [.22, .76, .45], material.dark)), closedRing("循环储水箱的中空外壁", 0, .03, .22, .29, .45, material.steel), cylinder("储水箱底板", [0, .03, .22], [.57, .015, .57], material.steel), hollowPipe("沿演奏台缓弯的主水流管", [[-.98, .87, .1], [-.5, .9, -.03], [0, .91, -.08], [.5, .9, -.03], [.98, .87, .1]], [.075, .075, .075, .075, .075], .008, material.glass), box("位于演奏管下方的开放回流水槽底", [0, .74, -.08], [1.9, .025, .32], material.steel), ...[-1, 1].map(side => box("回流槽前后挡水边", [0, .79, -.08 + side * .15], [1.9, .1, .018], material.steel))];
  for (let index = 0; index < 12; index++) { const x = (index - 5.5) * .135, z = -.08 + x * x * .2;
    parts.push(hollowPipe("可用手指封住来变调的独立喷水孔颈", [[x, .92, z], [x, .99, z]], [.012, .012], .003, material.steel), part("从独立指孔流出的静态透明水柱", "cylinder", "#9ebcc5", [x, 1.035, z], [.009, .09, .009], [0, 0, 0], { opacity: .5 }));
  }
  parts.push(cylinder("闭合循环水泵", [.48, .24, .22], [.15, .22, .15], material.dark), hollowPipe("从水泵接入演奏总管的供水支管", [[.48, .25, .22], [.7, .25, .22], [.9, .87, .1]], [.025, .025, .025], .004, material.steel), hollowPipe("从回流槽进入储水箱的排水管", [[0, .74, -.08], [0, .5, .22]], [.03, .03], .004, material.steel));
  return parts;
}

function aeolianTower(): ModelPart[] {
  const parts: ModelPart[] = [box("风弦柱的稳定底座", [0, .08, 0], [.8, .16, .65], material.dark), ...[-1, 1].map(side => box("留出贯通风道的中空共鸣柱侧壁", [side * .3, 1.8, 0], [.1, 3.4, .25], material.wood)), box("风弦柱顶部刚性弦梁", [0, 3.5, 0], [.7, .12, .3], material.wood), box("低位固定弦的音桥梁", [0, .25, 0], [.7, .12, .3], material.wood), ...[-1, 1].map(side => box("风弦柱侧面开放共鸣槽的背壁", [side * .3, 1.8, .1], [.1, 3.3, .035], material.wood))];
  for (let index = 0; index < 12; index++) parts.push(rod("由气流横向激起涡振的长金属弦", [(index - 5.5) * .043, .3, -.03], [(index - 5.5) * .043, 3.45, -.03], .0015 + index % 3 * .0002, material.steel));
  return parts;
}

function sirenKeyboard(): ModelPart[] {
  const parts: ModelPart[] = [...tableLegs(.8, .4, .61), box("气动盘琴承重机台", [0, .69, 0], [1, .16, .56], material.wood), ...keyboard(.87, .79, -.19, 18), cylinder("驱动多圈孔盘的横向主轴", [0, 1.05, .12], [.024, .72, .024], material.steel, [0, 0, 90]), cylinder("主轴侧向驱动电机", [.45, 1.05, .12], [.16, .2, .16], material.dark, [0, 0, 90]), ...[-1, 1].map(side => rod("主轴两端轴承立座", [side * .37, .77, .12], [side * .37, 1.05, .12], .035)), cylinder("向各喷口分气的低位气箱", [0, .85, .28], [.06, .8, .06], material.steel, [0, 0, 90])];
  for (let index = 0; index < 4; index++) { const x = (index - 1.5) * .16, outline = Array.from({ length: 32 }, (_, point): [number, number] => [Math.cos(point * Math.PI / 16) * .18, Math.sin(point * Math.PI / 16) * .18]), holes = Array.from({ length: 12 + index * 2 }, (_, hole) => { const angle = hole * Math.PI * 2 / (12 + index * 2); return Array.from({ length: 6 }, (_, step): [number, number] => [Math.cos(angle) * .145 + Math.cos(-step * Math.PI / 3) * .01, Math.sin(angle) * .145 + Math.sin(-step * Math.PI / 3) * .01]); });
    parts.push(piercedPanel("留有真实等距通气孔的旋转音盘", [x, 1.05, .12], outline, holes, .007, material.steel, [0, 0, 90]), hollowPipe("沿轴向穿过音盘孔列的独立键控喷气管", [[x, .85, .28], [x - .07, .92, .28], [x - .07, 1.05, .265], [x - .012, 1.05, .265]], [.01, .01, .01, .01], .003, material.steel));
  }
  return parts;
}

function earthBow(): ModelPart[] {
  const parts: ModelPart[] = [closedRing("保留真实地下共鸣坑的土穴壁", 0, -.3, 0, .42, .3, material.wood), cylinder("共鸣坑底部土层", [0, -.305, 0], [.83, .015, .83], material.wood), cylinder("盖住坑口并由琴弦带动的薄共鸣蒙板", [0, .01, 0], [.82, .012, .82], material.ivory), cord("根部入地并向坑口弯曲的柔性长弓杆", [[.78, -.2, 0], [.76, .4, 0], [.56, 1.1, 0], [.2, 1.45, 0], [-.12, 1.53, 0]], .02, material.wood), rod("从杆尖直接拉住坑口蒙板中心的单弦", [-.12, 1.53, 0], [0, .02, 0], .002, material.steel), cylinder("蒙板中央防止琴弦撕裂的小垫片", [0, .02, 0], [.045, .009, .045], material.dark)];
  return parts;
}

// 形态参照文物和制作者的公开介绍，几何为独立原创代码，没有下载模型。
// https://www.metmuseum.org/art/collection/search/501791 （立式拨弦键琴）
// https://collection.sciencemuseumgroup.org.uk/objects/co5899/dulcitone （音叉琴）
// https://collection.sciencemuseumgroup.org.uk/objects/co5867 （火焰风琴）
// https://www.metmuseum.org/art/collection/search/502450 （背颈共鸣弦）
// https://www.ellenfullman.com/elementalview （长弦以纵向摩擦激振）
// https://www.mim.be/index.php/en/collection-piece/geigenwerk （转轮擦弦键琴）
// https://mimo-international.com/MIMO/doc/IFD/OAI_CIMU_ALOES_0160175 （键控竖琴）
// https://genesis.eecg.toronto.edu/mannventions/hydraulophone.htm （以水为发声媒介的指孔琴）
export const musicExpansionBatchTwoObjects: MasterPrototype[] = [
  { name: "机械截弦八度低音提琴", itemType: "乐器", theme: "欧式", build: octobass },
  { name: "脚踏变调钢棒吉他台", itemType: "乐器", theme: "现代", build: pedalSteel },
  { name: "立箱转向拨弦键琴", itemType: "乐器", theme: "欧式", build: clavicytherium },
  { name: "分叉音叉击键琴", itemType: "乐器", theme: "欧式", build: dulcitone },
  { name: "液压钟罩稳风古风琴", itemType: "乐器", theme: "欧式", build: hydraulis },
  { name: "总管键控蒸汽汽笛琴", itemType: "乐器", theme: "蒸汽朋克", build: calliope },
  { name: "掌端击奏折管音管架", itemType: "乐器", theme: "现代", build: tubulum },
  { name: "键控侧拨克拉维竖琴", itemType: "乐器", theme: "欧式", build: claviharp },
  { name: "踏板悬盘滴水鼓装置", itemType: "乐器", theme: "现代", build: dripDrum },
  { name: "长直兽首卡尔尼克斯号", itemType: "乐器", theme: "欧式", build: carnyx },
  { name: "双卷盘口青铜鲁尔号", itemType: "乐器", theme: "欧式", build: lur },
  { name: "龙池凤沼七弦古琴", itemType: "乐器", theme: "中式", build: guqin },
  { name: "双葫芦长杆鲁德拉维纳琴", itemType: "乐器", theme: "异域", build: rudraVeena },
  { name: "龙首雕木维纳琴", itemType: "乐器", theme: "异域", build: saraswatiVeena },
  { name: "悬线葫芦共鸣巴拉丰琴", itemType: "乐器", theme: "异域", build: balafon },
  { name: "单筒摩擦调杆击键琴", itemType: "乐器", theme: "欧式", build: clavicylinder },
  { name: "联动轮弓擦弦键琴", itemType: "乐器", theme: "欧式", build: geigenwerk },
  { name: "踏板抬毡钦巴龙琴", itemType: "乐器", theme: "欧式", build: cimbalom },
  { name: "玻璃热管火焰风琴", itemType: "乐器", theme: "蒸汽朋克", build: pyrophone },
  { name: "背颈开槽共鸣弦巴里通琴", itemType: "乐器", theme: "欧式", build: baryton },
  { name: "重锚共鸣箱长弦擦奏装置", itemType: "乐器", theme: "现代", build: longStringInstrument },
  { name: "循环水流指孔液鸣琴", itemType: "乐器", theme: "现代", build: hydraulophone },
  { name: "贯通风道自奏长弦立塔", itemType: "乐器", theme: "现代", build: aeolianTower },
  { name: "键控气动穿孔盘赛壬琴", itemType: "乐器", theme: "蒸汽朋克", build: sirenKeyboard },
  { name: "土穴蒙板单弦地弓", itemType: "乐器", theme: "异域", build: earthBow },
];
