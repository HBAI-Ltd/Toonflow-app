import { beam, part, type ModelPart, type Triple } from "../assetModelParts";
import { lobe } from "../natureParts";
import { box, cylinder, rod, ball, loop, cord, plate, piercedPanel, material, type MasterPrototype } from "./parts";
import { hollowPipe, soundBox } from "./musicExpansionBatchOne";
import { keyboard } from "./musicExpansionBatchTwo";

function circle(radius: number, x = 0, y = 0): [number, number][] {
  return Array.from({ length: 12 }, (_, index) => { const angle = -index * Math.PI / 6; return [x + Math.cos(angle) * radius, y + Math.sin(angle) * radius]; });
}

function seaOrgan(): ModelPart[] {
  const parts: ModelPart[] = [...[-1, 1].map(side => plate("连接全部阶板的岸侧承重颊墙", [side * 7, 0, 0], [[-3.05, 0], [2.05, 0], [2.05, 1.7], [1.05, 1.7], [1.05, 1.4], [.05, 1.4], [.05, 1.1], [-.95, 1.1], [-.95, .8], [-1.95, .8], [-1.95, .5], [-3.05, .5]], .2, material.ivory, [0, -90, 0]))];
  for (let index = 0; index < 4; index++) parts.push(box("保留阶板下空气腔的石质踏步", [0, .42 + index * .3, -2.5 + index], [14.2, .16, 1.05], material.ivory));
  const holes = Array.from({ length: 7 }, (_, index): [number, number][] => { const x = (index - 3) * 1.7; return [[x - .1, 1.36], [x - .1, 1.64], [x + .1, 1.64], [x + .1, 1.36]]; });
  parts.push(piercedPanel("七个真实出音孔贯穿的最上层岸阶", [0, 1.54, 0], [[-7.1, .975], [7.1, .975], [7.1, 2.025], [-7.1, 2.025]], holes, .16, material.ivory), piercedPanel("迎浪侧开有真实进水管口的岸底面", [0, 0, -3.04], [[-7.1, 0], [7.1, 0], [7.1, .5], [-7.1, .5]], Array.from({ length: 7 }, (_, index) => circle(.165, (index - 3) * 1.7, .25)), .12, material.ivory, [-90, 0, 0]));
  for (let index = 0; index < 7; index++) { const x = (index - 3) * 1.7;
    parts.push(hollowPipe("由浪口到岸内共鸣腔的独立斜升管", [[x, .25, -3.35], [x, .3, -1.3], [x, .5, .4], [x, .66, 1.5]], [.15, .14, .12, .085], .009, material.steel), hollowPipe("通向上层踏步孔口的真实竖直气柱", [[x, .66, 1.5], [x, 1.71, 1.5]], [.085, .085], .008, material.steel));
  }
  return parts;
}

function weightedRodSculpture(): ModelPart[] {
  const parts: ModelPart[] = [box("锚定弹性金属杆根部的整块厚基板", [0, .045, 0], [.62, .09, .62], material.wood)];
  for (let row = 0; row < 6; row++) for (let column = 0; column < 6; column++) {
    const x = (column - 2.5) * .086, z = (row - 2.5) * .086, height = 1.8 + Math.sin(row * .7 + column * .55) * .22;
    parts.push(rod("根部固定而顶端可以自由摆动的细弹性杆", [x, .08, z], [x, height, z], .004, material.wood), cylinder("增加惯性并可相互碰击的端部短粗配重", [x, height + .08, z], [.018, .18, .018], material.wood));
  }
  return parts;
}

function caveLithophone(): ModelPart[] {
  const stone = "#a5a18d", parts: ModelPart[] = [box("完整声效装置的洞穴琴承重底台", [0, .15, 0], [6.3, .3, 3.2], stone), ...[-1, 1].map(side => lobe("支承洞顶的厚岩柱", stone, [side * 2.65, 1.8, .45], [.8, 3.3, 1.5])), lobe("连续跨接两侧岩柱的天然石顶", stone, [0, 3.4, .45], [6.4, .8, 1.5]), rod("钟乳石后方独立承载击锤的机架梁", [-2.3, 2.65, .8], [2.3, 2.65, .8], .065), ...[-1, 1].map(side => rod("击锤梁两端接到洞壁的短支座", [side * 2.3, 2.65, .8], [side * 2.65, 2.65, .45], .09)), box("前方演奏者的有键控制柜", [0, .8, -1.3], [1.25, .8, .5], material.wood), ...keyboard(1.1, 1.22, -1.43, 16)];
  for (let index = 0; index < 8; index++) {
    const x = (index - 3.5) * .56, length = 1.1 + index % 4 * .27, bottom = 3.32 - length, localY = 2.65 - bottom;
    const radius = localY < length * .62 ? .045 + .045 * (localY - .2) / (length * .62 - .2) : .09 + .07 * (localY - length * .62) / (length * .38);
    const face = .3 + radius + .0225;
    parts.push(part("顶部连接天然石顶而不落地的钟乳石", "lathe", stone, [x, bottom, .3], [1, 1, 1], [0, 0, 0], { profile: [{ x: 0, y: 0 }, { x: .045, y: .2 }, { x: .09, y: length * .62 }, { x: .16, y: length }, { x: 0, y: length }] }), cylinder("固定在后梁上推动软锤的电磁执行器", [x, 2.65, .76], [.07, .16, .07], material.dark, [90, 0, 0]), rod("从执行器前伸到钟乳石表面的短锤杆", [x, 2.65, .68], [x, 2.65, face + .008], .01, material.steel), ball("紧靠钟乳石保留振动间隙的软锤头", [x, 2.65, face], [.025, .025, .025], material.dark));
  }
  parts.push(cord("演奏控制柜到机架梁的绝缘电缆束", [[.6, .7, -1.3], [2.25, .35, -1.1], [2.3, 2.65, .8]], .023, material.dark));
  return parts;
}

function rainWheel(): ModelPart[] {
  const parts: ModelPart[] = [...[-1, 1].map(side => box("颗粒雨声轮的侧向轴承立座", [0, .51, side * .35], [.14, 1.02, .13], material.wood)), ...[-1, 1].map(side => box("立座底部防倾长脚", [0, .055, side * .35], [1.1, .11, .4], material.dark)), ...[-1, 1].map(side => cylinder("固定在立座顶端的真实同轴轴承", [0, 1.02, side * .35], [.12, .15, .12], material.dark, [90, 0, 0])), rod("雨声轮两端支承的水平转轴", [0, 1.02, -.5], [0, 1.02, .5], .035), part("装有分仓颗粒的空心大轮边壳", "lathe", material.wood, [0, 1.02, 0], [1, 1, 1], [90, 0, 0], { profile: [{ x: .79, y: -.13 }, { x: .82, y: -.13 }, { x: .82, y: .13 }, { x: .79, y: .13 }, { x: .79, y: -.13 }] }), cylinder("轮后的薄木共鸣板", [0, 1.02, .13], [1.62, .012, 1.62], material.wood, [90, 0, 0]), part("可以看到真实分仓的前观察面", "cylinder", material.glass, [0, 1.02, -.13], [1.62, .008, 1.62], [90, 0, 0], { opacity: .2 }), rod("侧面手摇曲柄轴", [0, 1.02, .5], [0, 1.02, .7], .026), rod("摇柄偏心折臂", [0, 1.02, .7], [0, 1.27, .7], .026), rod("操作摇柄的横向木握柄", [0, 1.27, .7], [0, 1.27, .85], .04, material.dark)];
  for (let index = 0; index < 12; index++) { const angle = index * Math.PI / 6;
    parts.push(rod("轮内把颗粒分隔并逐次抬起的径向隔条", [0, 1.02, 0], [Math.cos(angle) * .79, 1.02 + Math.sin(angle) * .79, 0], .018, material.wood));
  }
  for (let index = 0; index < 24; index++) { const angle = Math.PI * (1.1 + index % 12 * .065), radius = .59 + Math.floor(index / 12) * .1; parts.push(lobe("轮内重力下落而发声的独立小颗粒", material.steel, [Math.cos(angle) * radius, 1.02 + Math.sin(angle) * radius, -.05 + index % 3 * .04], [.018, .018, .018])); }
  return parts;
}

function steppedThunderBox(): ModelPart[] {
  const outline: [number, number][] = [[-.8, .1], [.8, .1], [.8, 2.55], [-.8, 2.55]], parts: ModelPart[] = [box("滚雷箱的稳定地脚", [0, .07, 0], [2.1, .14, .95], material.wood), ...[-1, 1].map(side => box("高空心共鸣箱的侧壁", [side * .83, 1.35, .06], [.1, 2.55, .65], material.wood)), piercedPanel("箱背连续的薄木共鸣板", [0, 0, .38], outline, [], .012, material.wood, [-90, 0, 0]), box("箱顶的落石投入口固定梁", [0, 2.6, .06], [1.75, .1, .65], material.wood), box("箱底接住滚石的开放收集槽底", [0, .19, 0], [1.6, .035, .6], material.wood), ...[-1, 1].map(side => box("接石槽的前后挡边", [0, .27, side * .29], [1.6, .15, .025], material.wood))];
  for (let index = 0; index < 9; index++) { const side = index % 2 ? -1 : 1, y = .45 + index * .235;
    parts.push(box("交错留出端部滚落口的斜阶声板", [side * .07, y, .03], [1.42, .04, .48], material.wood, [0, 0, side * 4]));
  }
  parts.push(ball("投下时逐级敲击木阶的实心滚雷球", [.59, 2.48, .02], [.14, .14, .14], material.steel));
  return parts;
}

function rotoTom(): ModelPart[] {
  const parts: ModelPart[] = [rod("转鼓可伸缩的落地立杆", [0, .12, 0], [0, .98, 0], .025), ...Array.from({ length: 3 }, (_, index) => { const angle = index * Math.PI * 2 / 3; return rod("张开的三脚架承重脚", [0, .2, 0], [Math.cos(angle) * .32, .015, Math.sin(angle) * .32], .025); }), cylinder("从转轮中穿过的调张轴套", [0, .99, 0], [.045, .16, .045], material.dark), part("不设鼓腔而保持开底的鼓面外箍", "lathe", material.steel, [0, 1.12, 0], [1, 1, 1], [0, 0, 0], { profile: [{ x: .218, y: -.03 }, { x: .23, y: -.03 }, { x: .23, y: .02 }, { x: .218, y: .02 }, { x: .218, y: -.03 }] }), cylinder("张紧在可旋转箍圈上的单膜", [0, 1.14, 0], [.435, .002, .435], material.ivory), loop("旋转来改变整体鼓膜张力的下轮圈", [0, 1.055, 0], .21, .012)];
  for (let index = 0; index < 8; index++) { const angle = index * Math.PI / 4; parts.push(rod("转轮中心到外圈的承力辐条", [0, 1.055, 0], [Math.cos(angle) * .21, 1.055, Math.sin(angle) * .21], .012), rod("将转轮抬升力传至鼓面箍的独立支杆", [Math.cos(angle) * .21, 1.055, Math.sin(angle) * .21], [Math.cos(angle) * .224, 1.12, Math.sin(angle) * .224], .007)); }
  return parts;
}

function laserHarp(): ModelPart[] {
  const parts: ModelPart[] = [box("激光竖琴的落地电子控制底座", [0, .12, 0], [2.15, .24, .65], material.dark), ...[-1, 1].map(side => box("把光电接收头抬到演奏区上方的立柱", [side * 1, 1.6, 0], [.12, 2.9, .2], material.dark)), box("连接全部光电接收器的顶部横梁", [0, 3.05, 0], [2.15, .16, .22], material.dark)];
  for (let index = 0; index < 12; index++) { const x = (index - 5.5) * .145;
    parts.push(cylinder("演奏者身前的独立向上光束发射头", [x, .28, 0], [.035, .055, .035], material.steel), cylinder("顶梁上独立的光电接收头", [x, 2.98, 0], [.04, .05, .04], material.steel), part("以几何表示的静态演奏光束", "cylinder", "#92b5a1", [x, 1.63, 0], [.003, 2.65, .003], [0, 0, 0], { emissive: "#68a47a", emissiveIntensity: 1.1, opacity: .45 }));
  }
  parts.push(box("底座侧边的演奏状态与音色面板", [.6, .28, -.2], [.42, .05, .16], material.glass), cord("接到外部音源的单根屏蔽输出线", [[.98, .15, .2], [1.25, .03, .2], [1.4, .02, .42]], .01, material.dark));
  return parts;
}

function huehuetl(): ModelPart[] {
  const parts: ModelPart[] = [part("整木掏空且上下贯通的高筒鼓身", "lathe", material.wood, [0, .23, 0], [1, 1, 1], [0, 0, 0], { profile: [{ x: .28, y: 0 }, { x: .3, y: .78 }, { x: .27, y: .78 }, { x: .25, y: 0 }, { x: .28, y: 0 }] }), cylinder("高筒鼓顶部的唯一整张皮面", [0, 1.017, 0], [.59, .008, .59], material.ivory), loop("扣住皮面边缘的宽束箍", [0, 1.02, 0], .304, .014, [0, 0, 0], material.wood)];
  for (let index = 0; index < 3; index++) { const angle = index * Math.PI * 2 / 3;
    parts.push(plate("从整木鼓身下缘伸出的独立三足", [Math.cos(angle) * .22, 0, Math.sin(angle) * .22], [[-.065, 0], [.065, 0], [.075, .3], [-.075, .3]], .06, material.wood, [0, -index * 120, 0]));
  }
  return parts;
}

function guitarNeck(bridgeZ = -.07, bridgeY = .17): ModelPart[] {
  const parts: ModelPart[] = [box("双腰吉他的长木琴颈", [0, .71, -.008], [.055, .48, .04], material.wood), box("有独立音品的黑色指板", [0, .69, -.034], [.056, .5, .012], material.dark), piercedPanel("弦轴头中真实贯通的双长槽", [0, .95, -.002], [[-.035, 0], [.035, 0], [.039, .14], [-.039, .14]], [[[-.027, .025], [-.027, .11], [-.012, .11], [-.012, .025]], [[.012, .025], [.012, .11], [.027, .11], [.027, .025]]], .025, material.wood, [-90, 0, 0])];
  for (let index = 0; index < 18; index++) parts.push(box("从弦枕向琴身按十二平均律排列的音品", [0, .944 - .774 * (1 - 2 ** (-(index + 1) / 12)), -.042], [.058, .0025, .003], material.steel));
  for (let index = 0; index < 3; index++) parts.push(rod("横贯两条弦轴槽的可调弦轴", [-.057, .985 + index * .035, -.015], [.057, .985 + index * .035, -.015], .007, material.steel));
  for (let index = 0; index < 6; index++) parts.push(rod("从琴桥斜接到颈端弦枕的六根独立琴弦", [(index - 2.5) * .008, bridgeY, bridgeZ], [(index - 2.5) * .008, 1.03, -.045], .0012, material.steel));
  parts.push(box("弦轴头下方引导琴弦的上弦枕", [0, .944, -.038], [.06, .012, .018], material.ivory));
  return parts;
}

const guitarOutline: [number, number][] = [[0, .015], [-.13, .025], [-.185, .095], [-.19, .19], [-.13, .265], [-.1, .29], [-.14, .35], [-.145, .41], [-.09, .48], [0, .5], [.09, .48], [.145, .41], [.14, .35], [.1, .29], [.13, .265], [.19, .19], [.185, .095], [.13, .025]];

function acousticGuitar(): ModelPart[] {
  return [...soundBox(guitarOutline, .11, [circle(.055, 0, .33)]), ...guitarNeck(), ...[-1, 1].map(side => beam("在音板内侧交叉承振的木质细音梁", material.wood, [side * .12, .08, -.051], [-side * .07, .27, -.051], .012, .006)), box("以木音板本身传振的贴面琴桥", [0, .17, -.062], [.15, .025, .018], material.wood), box("琴桥上的窄白下弦枕", [0, .18, -.073], [.105, .008, .008], material.ivory), loop("围在真实声孔之外的窄装饰边", [0, .33, -.059], .059, .003, [90, 0, 0], material.wood)];
}

function resonatorGuitar(): ModelPart[] {
  const parts = soundBox(guitarOutline, .11, [circle(.118, 0, .19), circle(.026, -.071, .37), circle(.026, .071, .37)]);
  parts.push(...guitarNeck(-.103, .19), part("将弦桥振动机械扩散的真实薄壁金属共鸣锥", "lathe", material.steel, [0, .19, -.056], [1, 1, 1], [-90, 0, 0], { profile: [{ x: .116, y: 0 }, { x: .028, y: .014 }, { x: 0, y: .025 }, { x: 0, y: .022 }, { x: .027, y: .011 }, { x: .113, y: -.003 }, { x: .116, y: 0 }] }), cylinder("位于金属锥顶而不搭在木面上的桥饼", [0, .19, -.085], [.052, .012, .052], material.wood, [90, 0, 0]), box("桥饼上单独承弦的窄琴桥", [0, .19, -.094], [.08, .014, .012], material.ivory), loop("固定薄锥外缘的圆形压圈", [0, .19, -.058], .123, .006, [90, 0, 0], material.steel), plate("下端勾住琴弦的独立金属尾板", [0, .065, -.062], [[-.035, -.04], [.035, -.04], [.045, .055], [-.045, .055]], .008, material.steel, [0, 0, 0]));
  return parts;
}

function touchStick(): ModelPart[] {
  const outline: [number, number][] = [[-.055, 0], [.055, 0], [.05, 1.12], [-.05, 1.12]], parts: ModelPart[] = [plate("不设传统琴腹的连续厚指板琴棒", [0, .02, -.025], outline, .05, material.dark, [0, 0, 0]), box("琴棒下端带磁拾音器的短承弦座", [0, .12, -.058], [.12, .14, .045], material.steel), box("琴棒上端的分路弦轴座", [0, 1.13, -.005], [.15, .13, .055], material.wood)];
  for (let index = 0; index < 23; index++) parts.push(box("允许两手直接点弦发声的横向金属音品", [0, .23 + index * .037, -.052], [.111, .004, .007], material.steel));
  for (let index = 0; index < 10; index++) { const x = (index - 4.5) * .01; parts.push(rod("分为左右两手声部的十根点奏弦", [x, .1, -.082], [x, 1.17, -.06], .0013, material.steel)); }
  for (let index = 0; index < 5; index++) parts.push(rod("从宽弦轴座两侧伸出的调音机轴", [-.09, 1.08 + index * .023, -.005], [.09, 1.08 + index * .023, -.005], .007, material.steel));
  parts.push(cord("琴棒背面挂在演奏者肩部的背带", [[-.04, .13, .04], [-.18, .7, .12], [0, 1.07, .09]], .012, material.wood), box("固定在腰带上的背部承托扣", [0, .24, .035], [.07, .06, .025], material.steel));
  return parts;
}

function tar(): ModelPart[] {
  const outline: [number, number][] = [[0, .02], [-.085, .04], [-.13, .12], [-.1, .23], [-.035, .25], [-.075, .29], [-.08, .37], [0, .43], [.08, .37], [.075, .29], [.035, .25], [.1, .23], [.13, .12], [.085, .04]];
  const parts = soundBox(outline, .14, []);
  parts.push(box("从双腔琴腹伸出的窄长琴颈", [0, .66, .005], [.047, .5, .045], material.wood), box("宽矩形空弦轴头", [0, .99, .02], [.1, .2, .065], material.wood), ...[.92, .98, 1.04].map(y => rod("两侧对穿的独立木弦轴", [-.09, y, .02], [.09, y, .02], .012, material.wood)), box("双琴腹之间承托琴桥的窄束腰", [0, .25, -.074], [.06, .035, .014], material.wood), box("蒙皮大腹上独立的窄骨琴马", [0, .145, -.083], [.085, .025, .022], material.ivory));
  for (let index = 0; index < 16; index++) parts.push(box("绑在窄琴颈上的微分音束品", [0, .43 + index * .028, -.022], [.052, .003, .006], material.ivory));
  for (let index = 0; index < 6; index++) parts.push(rod("从大腹琴桥引向上部弦轴的成对演奏弦", [(index - 2.5) * .006, .145, -.096], [(index - 2.5) * .006, 1.03, -.035], .0013, material.steel));
  return parts;
}

function doubleBass(): ModelPart[] {
  const outline: [number, number][] = [[0, .12], [-.22, .16], [-.31, .38], [-.27, .66], [-.16, .79], [-.14, .93], [-.24, 1.02], [-.19, 1.22], [-.075, 1.36], [0, 1.39], [.075, 1.36], [.19, 1.22], [.24, 1.02], [.14, .93], [.16, .79], [.27, .66], [.31, .38], [.22, .16]];
  const holes = [-1, 1].map(side => [[side * .13, .55], [side * .17, .62], [side * .15, .79], [side * .1, .87], [side * .115, .76], [side * .135, .64]] as [number, number][]);
  const parts = soundBox(outline, .21, holes);
  parts.push(box("从斜肩琴身伸出的长无品琴颈", [0, 1.6, -.025], [.07, .55, .065], material.wood), box("低音提琴宽而平的长指板", [0, 1.42, -.075], [.073, .79, .025], material.dark), box("两侧齿轮调音机的宽弦轴箱", [0, 1.94, -.005], [.085, .23, .07], material.wood), rod("允许立奏的可伸缩尾柱", [0, .01, 0], [0, .23, 0], .025), piercedPanel("立于前音板的镂空高琴桥", [0, .53, -.12], [[-.1, 0], [.1, 0], [.13, .12], [.08, .16], [-.08, .16], [-.13, .12]], [[[-.06, .018], [-.06, .08], [.06, .08], [.06, .018]]], .018, material.wood, [-90, 0, 0]));
  for (let index = 0; index < 4; index++) parts.push(rod("由尾部跨过琴桥到弦枕的粗低音弦", [(index - 1.5) * .018, .25, -.15], [(index - 1.5) * .018, 2.01, -.065], .0022), rod("从琴头两侧伸出的独立蜗轮轴", [-.075, 1.86 + index * .047, -.005], [.075, 1.86 + index * .047, -.005], .012));
  return parts;
}

function fujara(): ModelPart[] {
  const stations = [0, .3, .315, .52, .535, .72, .735, 1.8], vertices: { x: number; y: number; z: number }[] = [], faces: number[] = [];
  for (const radius of [.035, .029]) for (const y of stations) for (let side = 0; side < 24; side++) { const angle = side * Math.PI / 12; vertices.push({ x: Math.cos(angle) * radius, y, z: Math.sin(angle) * radius }); }
  for (let level = 0; level < stations.length - 1; level++) for (let side = 0; side < 24; side++) {
    if ([1, 3, 5].includes(level) && side === 17) continue;
    const a = level * 24 + side, b = (level + 1) * 24 + side, c = level * 24 + (side + 1) % 24, d = (level + 1) * 24 + (side + 1) % 24;
    faces.push(a, b, c, c, b, d);
  }
  const count = stations.length * 24, indices = [...faces], boundary = new Map<string, [number, number]>();
  for (let index = 0; index < faces.length; index += 3) {
    const triangle = faces.slice(index, index + 3); indices.push(triangle[2]! + count, triangle[1]! + count, triangle[0]! + count);
    for (let edge = 0; edge < 3; edge++) { const a = triangle[edge]!, b = triangle[(edge + 1) % 3]!; if (!boundary.delete(`${b},${a}`)) boundary.set(`${a},${b}`, [a, b]); }
  }
  for (const [a, b] of boundary.values()) indices.push(a, b + count, b, a, a + count, b + count);
  return [part("上下贯通并保留三个真实指孔的长木音管", "mesh", material.wood, [0, 0, 0], [1, 1, 1], [0, 0, 0], { vertices, indices }), hollowPipe("从较低嘴位送气到主音管顶部的旁吹管", [[.075, 1.16, 0], [.075, 1.75, 0], [.05, 1.825, 0], [0, 1.825, 0]], [.012, .012, .012, .012], .003, material.wood), part("主音管顶部收拢旁管接口的薄壁风帽", "lathe", material.wood, [0, 1.78, 0], [1, 1, 1], [0, 0, 0], { profile: [{ x: .035, y: 0 }, { x: .035, y: .04 }, { x: .013, y: .04 }, { x: .013, y: .033 }, { x: .029, y: .033 }, { x: .029, y: 0 }, { x: .035, y: 0 }] }), ...[1.27, 1.63].map(y => box("将旁管与主音管绑在一起的短木垫", [.041, y, 0], [.04, .035, .035], material.dark)), ...[1.27, 1.63].map(y => loop("连住双管及木垫的束带", [.037, y, 0], .065, .003, [0, 0, 0], material.dark))];
}

function khaen(): ModelPart[] {
  const outline: [number, number][] = [[-.06, -.16], [.06, -.16], [.07, -.1], [.07, .1], [.04, .15], [-.04, .15], [-.07, .1], [-.07, -.1]], holes: [number, number][][] = [];
  for (let row = 0; row < 2; row++) for (let index = 0; index < 8; index++) holes.push(circle(.01, (row - .5) * .026, (index - 3.5) * .028));
  const parts: ModelPart[] = [piercedPanel("卡恩口簧琴舟形风室的中空侧圈", [0, .55, 0], outline, [outline.map(([x, z]) => [x * .8, z * .9] as [number, number]).reverse()], .07, material.wood), piercedPanel("各竹管真实贯穿的上风室封板", [0, .62, 0], outline, holes, .006, material.wood), piercedPanel("各竹管真实贯穿的下风室封板", [0, .544, 0], outline, holes, .006, material.wood), hollowPipe("从舟形风室前伸的短吹嘴", [[0, .58, -.14], [0, .58, -.23]], [.012, .012], .003, material.wood)];
  for (let row = 0; row < 2; row++) for (let index = 0; index < 8; index++) { const x = (row - .5) * .026, z = (index - 3.5) * .028, top = 1.55 - index * .07, bottom = .02 + index * .013;
    parts.push(hollowPipe("两端都越过风室的独立自由簧竹管", [[x, bottom, z], [x, top, z]], [.009, .009], .002, material.wood), box("穿入中央风室内的独立金属自由簧舌", [x, .585, z - .009], [.005, .025, .001], material.steel));
  }
  parts.push(...[.76, 1].map(y => box("把双排音管横向束住的压带", [0, y, 0], [.058, .013, .235], material.dark)));
  return parts;
}

function geomungo(): ModelPart[] {
  const outline: [number, number][] = [[-.13, -.82], [.13, -.82], [.14, .75], [.08, .82], [-.08, .82], [-.14, .75]], holes: [number, number][][] = [[[-.025, -.35], [-.025, -.1], [.025, -.1], [.025, -.35]]];
  const parts: ModelPart[] = [piercedPanel("玄琴长箱的底面与真实出声孔", [0, .02, 0], outline, holes, .009, material.wood), piercedPanel("保留整条共鸣长腔的木箱侧圈", [0, .029, 0], outline, [outline.map(([x, z]) => [x * .9, z * .97] as [number, number]).reverse()], .07, material.wood), piercedPanel("弦下连续的薄木音板", [0, .099, 0], outline, [], .009, material.ivory), ...[-1, 1].map(side => box("琴箱底部短足", [0, .01, side * .6], [.24, .02, .04], material.dark))];
  for (let index = 0; index < 16; index++) parts.push(box("两根按奏弦下方独立固定的高品柱", [-.055, .135, -.54 + index * .071], [.1, .055, .017], material.wood));
  for (let index = 0; index < 6; index++) { const x = -.1 + index * .04, y = index < 2 ? .166 : .148; parts.push(rod("分为按品旋律与空弦的六根独立丝弦", [x, y, -.76], [x, y, .76], .002, material.ivory)); if (index >= 2) parts.push(plate("空弦另由可移动的雁足琴码承托", [x, .108, .44 + index * .035], [[-.013, 0], [.013, 0], [0, .039]], .015, material.wood, [0, 0, 0])); }
  parts.push(rod("弹击琴弦的短竹拨棍", [.21, .018, -.21], [.21, .018, .16], .014, material.wood));
  return parts;
}

function bandura(): ModelPart[] {
  const outline: [number, number][] = [[0, .03], [-.19, .08], [-.25, .24], [-.22, .44], [-.1, .55], [-.09, .85], [0, .9], [.09, .83], [.1, .68], [.24, .55], [.29, .37], [.23, .15]];
  const parts = soundBox(outline, .13, [circle(.037, -.04, .38)]);
  parts.push(box("左侧长低音弦的短指板", [-.045, .65, -.078], [.09, .37, .025], material.dark), box("琴腹下端的统一琴桥", [0, .15, -.086], [.28, .025, .03], material.wood));
  for (let index = 0; index < 7; index++) parts.push(rod("沿短指板上伸的独立低音长弦", [-.09 + index * .014, .15, -.102], [-.085 + index * .014, .86, -.092], .0017, material.steel));
  for (let index = 0; index < 20; index++) { const t = index / 19; parts.push(rod("向宽琴肩展开而不经过指板的独立短弦", [-.02 + t * .13, .15, -.102], [.105 + Math.sin(t * Math.PI) * .13, .65 - t * .33, -.077], .0013, material.steel)); }
  for (let index = 0; index < 10; index++) parts.push(cylinder("宽琴肩上独立的短弦调音销", [.105 + Math.sin(index / 9 * Math.PI) * .13, .65 - index / 9 * .33, -.08], [.007, .018, .007], material.steel, [90, 0, 0]));
  return parts;
}

function concertZither(): ModelPart[] {
  const outline: [number, number][] = [[-.29, -.25], [.28, -.25], [.35, -.12], [.34, .18], [.22, .27], [-.29, .27]], parts: ModelPart[] = [piercedPanel("齐特尔筝的薄底板", [0, .012, 0], outline, [], .01, material.wood), piercedPanel("音箱周边连续空腔侧圈", [0, .022, 0], outline, [outline.map(([x, z]) => [x * .93, z * .92] as [number, number]).reverse()], .065, material.wood), piercedPanel("与独立按品区分开的真实声孔面板", [0, .087, 0], outline, [circle(.04, .1, .03)], .006, material.ivory), box("五根旋律弦下方独立的窄指板", [-.21, .106, 0], [.11, .025, .46], material.dark), ...[-1, 1].map(side => box("琴体下方低矮支脚", [side * .22, .007, 0], [.045, .014, .4], material.dark))];
  for (let index = 0; index < 17; index++) parts.push(box("仅在左侧指板上排列的半音金属品", [-.21, .123, -.19 + index * .024], [.11, .003, .004], material.steel));
  for (let index = 0; index < 5; index++) parts.push(rod("需要按品的五根旋律琴弦", [-.25 + index * .02, .132, -.23], [-.25 + index * .02, .132, .23], .0014, material.steel));
  for (let index = 0; index < 20; index++) { const x = -.12 + index * .021; parts.push(rod("面板右侧不按品的伴奏空弦", [x, .105, -.22], [x, .105, .23], .0012, material.steel)); }
  parts.push(...[-1, 1].map(side => rod("伴奏弦两端的独立桥条", [-.13, .105, side * .23], [.3, .105, side * .23], .009, material.wood)));
  return parts;
}

function cornu(): ModelPart[] {
  const path: Triple[] = Array.from({ length: 16 }, (_, index) => { const angle = (-165 + index * 20) * Math.PI / 180; return [Math.cos(angle) * .57, .62 + Math.sin(angle) * .57, 0]; });
  const parts: ModelPart[] = [hollowPipe("连续弯成大C形且真正贯通的科尔努音管", path, path.map((_, index) => .012 + index * .0022), .0035, material.wood), rod("横跨C形开口并搭在肩上的支撑横杆", path[1]!, path[12]!, .025, material.wood)];
  const end = path.at(-1)!;
  parts.push(part("C弯长号末端逐渐展开的开口喇叭", "lathe", material.wood, end, [1, 1, 1], [0, 0, 125], { profile: [{ x: .045, y: 0 }, { x: .06, y: .1 }, { x: .095, y: .18 }, { x: .09, y: .183 }, { x: .055, y: .104 }, { x: .041, y: 0 }, { x: .045, y: 0 }] }), hollowPipe("接在C弯音管近端的杯形吹嘴", [path[0]!, [path[0]![0] - .035, path[0]![1] + .075, 0]], [.012, .02], .003, material.wood));
  return parts;
}

function crwth(): ModelPart[] {
  const parts = soundBox([[-.16, .02], [.16, .02], [.16, .28], [-.16, .28]], .065, [circle(.017, -.075, .15), circle(.017, .075, .15)]);
  parts.push(piercedPanel("保留左右两个真正穿手口的整木上框", [0, 0, .0325], [[-.16, .25], [.16, .25], [.16, .67], [-.16, .67]], [[[-.13, .29], [-.13, .62], [-.04, .62], [-.04, .29]], [[.04, .29], [.04, .62], [.13, .62], [.13, .29]]], .065, material.wood, [-90, 0, 0]), box("框中独立贯通的窄指板", [0, .42, -.043], [.06, .44, .016], material.dark), box("将弦架离前音板的宽琴桥", [0, .12, -.052], [.21, .027, .025], material.wood));
  for (let index = 0; index < 6; index++) { const x = index < 2 ? -.12 + index * .025 : -.023 + (index - 2) * .015; parts.push(rod("四根指板弦与两根侧向空弦", [x, .07, -.068], [x, .65, -.053], .0015, material.steel), cylinder("贯通上横轭的独立调音销", [x, .65, 0], [.012, .085, .012], material.wood, [90, 0, 0])); }
  return parts;
}

function dungchen(): ModelPart[] {
  const parts: ModelPart[] = [];
  for (const [start, length, r1, r2] of [[-1.65, .92, .011, .027], [-.81, 1.05, .029, .052], [.16, 1.1, .055, .095]]) {
    parts.push(part("可逐节套入收拢的真实中空锥形长号节", "lathe", material.wood, [0, .2, start!], [1, 1, 1], [90, 0, 0], { profile: [{ x: r1!, y: 0 }, { x: r2!, y: length! }, { x: r2! - .003, y: length! }, { x: r1! - .003, y: 0 }, { x: r1!, y: 0 }] }), loop("套节末端的加厚锁定口箍", [0, .2, start! + length! - .012], r2! + .004, .006, [90, 0, 0], material.steel));
  }
  parts.push(part("长号末端真正张开的宽铜喇叭", "lathe", material.wood, [0, .2, 1.25], [1, 1, 1], [90, 0, 0], { profile: [{ x: .095, y: 0 }, { x: .12, y: .15 }, { x: .19, y: .3 }, { x: .2, y: .31 }, { x: .195, y: .315 }, { x: .185, y: .305 }, { x: .115, y: .153 }, { x: .09, y: 0 }, { x: .095, y: 0 }] }), hollowPipe("近端贴唇而保留通气孔的杯嘴", [[0, .2, -1.65], [0, .2, -1.7]], [.011, .021], .003, material.steel), ...[-1, 1].map(side => rod("宽口下方独立展开的落地叉脚", [0, .2, 1.24], [side * .16, .01, 1.24], .022, material.dark)));
  return parts;
}

function surdo(): ModelPart[] {
  const parts: ModelPart[] = [part("薄金属板卷成且上下贯通的直筒鼓腔", "lathe", material.steel, [0, .09, 0], [1, 1, 1], [0, 0, 0], { profile: [{ x: .26, y: 0 }, { x: .26, y: .78 }, { x: .254, y: .78 }, { x: .254, y: 0 }, { x: .26, y: 0 }] }), ...[.085, .875].map(y => cylinder("直筒两端各自独立的薄鼓膜", [0, y, 0], [.51, .004, .51], material.ivory)), ...[.08, .88].map(y => loop("均匀压住膜边的张紧金属箍", [0, y, 0], .273, .014))];
  for (let index = 0; index < 10; index++) { const angle = index * Math.PI / 5; parts.push(rod("贯穿鼓体上下两箍的独立长张紧杆", [Math.cos(angle) * .274, .075, Math.sin(angle) * .274], [Math.cos(angle) * .274, .89, Math.sin(angle) * .274], .008), cylinder("上箍上方可独立拧紧的六角螺母", [Math.cos(angle) * .274, .897, Math.sin(angle) * .274], [.018, .018, .018], material.dark)); }
  for (let index = 0; index < 3; index++) { const angle = index * Math.PI * 2 / 3; parts.push(rod("将直筒低音鼓架离地面的短脚", [Math.cos(angle) * .23, .28, Math.sin(angle) * .23], [Math.cos(angle) * .29, .012, Math.sin(angle) * .29], .02, material.dark)); }
  parts.push(rod("演奏时单手使用的长鼓槌", [.38, .025, -.23], [.38, .025, .19], .016, material.wood), ball("鼓槌末端软毡头", [.38, .025, -.25], [.07, .07, .07], material.ivory));
  return parts;
}

function foleyPit(): ModelPart[] {
  const parts: ModelPart[] = [box("拟音步台统一承载底框", [0, .08, 0], [4.2, .16, 2.6], material.dark), ...[-1, 1].map(side => box("拟音步台长边低围沿", [0, .28, side * 1.25], [4.2, .24, .1], material.wood)), ...[-1, 1].map(side => box("拟音步台短边低围沿", [side * 2.05, .28, 0], [.1, .24, 2.4], material.wood)), ...[-1, 1].map(side => box("分开各拟音槽的纵向木隔板", [side * 1, .27, 0], [.07, .22, 2.4], material.wood)), box("区分湿槽与干槽的中心隔水板", [0, .27, 0], [.07, .22, 2.4], material.wood)];
  for (let index = 0; index < 7; index++) parts.push(box("足步下可微微起响的独立悬空木条", [-1.52, .29, -.99 + index * .33], [.85, .04, .3], material.wood));
  parts.push(box("石粒槽底部的实体支撑层", [-.5, .2, 0], [.92, .07, 2.35], material.dark), box("土面槽中可踩踏的松土层", [.5, .245, 0], [.92, .13, 2.35], "#a38e73"), box("湿槽的独立不锈钢底盘", [1.52, .2, 0], [.92, .06, 2.35], material.steel), part("只在湿槽内部的静态薄水面", "box", "#91b2b7", [1.52, .28, 0], [.87, .045, 2.3], [0, 0, 0], { opacity: .48 }));
  for (let index = 0; index < 28; index++) parts.push(lobe("石粒槽内没有并入其他主素材的独立碎石", "#a1a29a", [-.5 + (index % 4 - 1.5) * .2, .285, -.99 + Math.floor(index / 4) * .33], [.16, .12, .22], [0, index * 31, 0]));
  return parts;
}

function pianoLifter(): ModelPart[] {
  const parts: ModelPart[] = [...[-1, 1].flatMap(side => [box("搬运夹架的两条低位承重长叉", [side * .7, .2, 0], [.16, .16, 1.5], material.dark), ...[-1, 1].map(end => cylinder("可在地面滚动的重载车轮", [side * .7, .1, end * .58], [.2, .08, .2], material.dark, [0, 0, 90])), box("支承翻转轴的竖直侧架", [side * .7, .82, .35], [.16, 1.18, .2], material.steel), cylinder("翻转托架两侧同轴的轴承座", [side * .7, 1.26, .35], [.19, .24, .19], material.dark, [0, 0, 90])]), box("将两长叉连成整体的后横梁", [0, .25, .6], [1.6, .16, .18], material.steel), rod("托架翻身的水平转轴", [-.84, 1.26, .35], [.84, 1.26, .35], .065, material.steel), ...[-1, 1].map(side => box("放到钢琴侧面下面的独立翻转托臂", [side * .44, .61, -.18], [.12, .17, 1.2], material.steel)), ...[-1, 1].map(side => box("托臂前端防滑脱的竖直挡头", [side * .44, .74, -.73], [.14, .3, .12], material.steel)), ...[-1, 1].map(side => rod("将托臂连接到翻转轴的上提连杆", [side * .44, .62, .34], [side * .44, 1.26, .35], .07, material.steel)), box("接触琴壳的连续软垫后板", [0, 1, .19], [1.2, .42, .08], material.wood), cylinder("托架下方推动翻身摇臂的液压缸", [0, .57, .51], [.12, .64, .12], material.steel, [25, 0, 0]), rod("液压缸活塞连接翻转托架的短杆", [0, .84, .38], [0, 1.19, .22], .045), cylinder("长叉旁可用脚泵动的独立液压泵", [.53, .34, .6], [.1, .22, .1], material.dark), rod("脚踩液压泵的长踏杆", [.53, .36, .6], [.53, .27, .99], .026, material.steel)];
  return parts;
}

function strohViolin(): ModelPart[] {
  const parts: ModelPart[] = [box("取代传统共鸣木箱的细长承力骨架", [0, .27, .01], [.045, .4, .035], material.wood), box("弦下连续长指板", [0, .48, -.022], [.04, .51, .022], material.dark), box("上部独立弦轴箱", [0, .78, .005], [.045, .15, .035], material.wood), part("收集琴桥振动的中空金属膜盒", "lathe", material.steel, [0, .22, .015], [1, 1, 1], [-90, 0, 0], { profile: [{ x: 0, y: -.016 }, { x: .06, y: -.016 }, { x: .06, y: .018 }, { x: .054, y: .018 }, { x: .054, y: -.01 }, { x: 0, y: -.01 }] }), cylinder("膜盒前侧被琴桥驱动的薄金属振膜", [0, .22, -.003], [.11, .001, .11], material.steel, [90, 0, 0]), box("将琴弦振动集中传给膜片的小琴桥", [0, .22, -.027], [.05, .023, .04], material.ivory), hollowPipe("由金属膜盒接入扩音口的鹅颈声管", [[.045, .22, .02], [.12, .25, .03], [.18, .42, .03]], [.012, .017, .02], .003, material.steel), part("向外张开而保持贯通的机械扩音喇叭", "lathe", material.wood, [.18, .42, .03], [1, 1, 1], [0, 0, -60], { profile: [{ x: .02, y: 0 }, { x: .035, y: .08 }, { x: .1, y: .17 }, { x: .096, y: .173 }, { x: .031, y: .083 }, { x: .016, y: 0 }, { x: .02, y: 0 }] }), ball("演奏者夹持的偏置下巴托", [-.05, .11, -.006], [.1, .023, .07], material.dark)];
  for (let index = 0; index < 4; index++) parts.push(rod("独立于金属骨架而经琴桥传振的演奏弦", [(index - 1.5) * .009, .13, -.05], [(index - 1.5) * .009, .82, -.035], .0013, material.steel), rod("上弦箱两侧的独立调音轴", [-.055, .73 + index * .028, .005], [.055, .73 + index * .028, .005], .008, material.wood));
  return parts;
}

// 基于声路与构造类别重新建模；这些是静态场景素材，不提供实际声学或气流仿真。
// https://zadar.travel/attractions/attractions/organo-marino （海浪推动独立气柱）
// https://catalogue.harrybertoia.org/client/harrber002/helpTexts.php?id=251 （固定根部而自由顶端的声杆）
// https://luraycaverns.com/our-story/ （击奏天然钟乳石）
// https://lypaproduct.com.au/play/Rain%20Wheel （轮内分仓挡板逐次抬起颗粒）
// https://www.nationalguitars.com/tech （琴桥把振动传到金属共鸣锥）
// https://ich.unesco.org/en/RL/fujara-and-its-music-00099 （长主音管、旁送气管和三个指孔）
export const musicExpansionBatchThreeObjects: MasterPrototype[] = [
  { name: "阶岸波驱气柱琴", itemType: "乐器", theme: "现代", build: seaOrgan },
  { name: "端重弹性杆声雕塑", itemType: "乐器", theme: "现代", build: weightedRodSculpture },
  { name: "软锤钟乳石洞穴琴", itemType: "乐器", theme: "现代", build: caveLithophone },
  { name: "回转分仓颗粒雨声轮", itemType: "乐器", theme: "欧式", build: rainWheel },
  { name: "阶槽滚石雷声箱", itemType: "乐器", theme: "欧式", build: steppedThunderBox },
  { name: "旋架调张无腔转鼓", itemType: "乐器", theme: "现代", build: rotoTom },
  { name: "光束触发激光竖琴架", itemType: "乐器", theme: "科幻", build: laserHarp },
  { name: "三足开底高筒木鼓", itemType: "乐器", theme: "异域", build: huehuetl },
  { name: "圆声孔双腰木吉他", itemType: "乐器", theme: "欧式", build: acousticGuitar },
  { name: "单锥桥饼共鸣吉他", itemType: "乐器", theme: "现代", build: resonatorGuitar },
  { name: "双手点弦无腹棒琴", itemType: "乐器", theme: "现代", build: touchStick },
  { name: "束腰双腹蒙皮塔尔琴", itemType: "乐器", theme: "异域", build: tar },
  { name: "斜肩平背低音提琴", itemType: "乐器", theme: "欧式", build: doubleBass },
  { name: "旁管送气三孔富雅拉", itemType: "乐器", theme: "欧式", build: fujara },
  { name: "舟形风室双排卡恩口簧琴", itemType: "乐器", theme: "异域", build: khaen },
  { name: "固定高品柱击弦玄琴", itemType: "乐器", theme: "异域", build: geomungo },
  { name: "斜肩宽腹班杜拉琴", itemType: "乐器", theme: "欧式", build: bandura },
  { name: "指板伴奏分区齐特尔筝", itemType: "乐器", theme: "欧式", build: concertZither },
  { name: "肩撑C弯科尔努铜号", itemType: "乐器", theme: "欧式", build: cornu },
  { name: "开框双手孔克鲁斯擦弦琴", itemType: "乐器", theme: "欧式", build: crwth },
  { name: "套节伸缩敦钦长号", itemType: "乐器", theme: "中式", build: dungchen },
  { name: "直筒张杆行进苏尔多鼓", itemType: "乐器", theme: "异域", build: surdo },
  { name: "分槽木石水面拟音步台", itemType: "设施", theme: "现代", build: foleyPit },
  { name: "钢琴翻身液压搬运夹架", itemType: "设施", theme: "现代", build: pianoLifter },
  { name: "金属膜机械扩音斯特罗琴", itemType: "乐器", theme: "欧式", build: strohViolin },
];
