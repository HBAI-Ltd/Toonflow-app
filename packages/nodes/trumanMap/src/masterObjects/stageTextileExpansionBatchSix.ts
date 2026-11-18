import { part, type ModelPart, type Triple } from "../assetModelParts";
import { polygon } from "../masterNature/shared";
import { clothShell, ovalPoints } from "./garmentExpansionBatchOne";
import { machineBed, roller, clothWeb, cageMembers } from "./stageTextileExpansionBatchOne";
import { processBath } from "./stageTextileExpansionBatchFour";
import { box, cylinder, ball, rod, loop, cord, plate, piercedPanel, material, type MasterPrototype } from "./parts";

const frame = "#758c8e", cloth = "#b8b5a3", pale = "#d3cfbb";

function barrelStairs(): ModelPart[] {
  return [...Array.from({ length: 20 }, (_, index) => box("沿外筒升到上方观演环廊的独立踏步", [9.1 - index * .23, .1 + index * .2, 0], [.25, .08, .9], material.wood)), ...[-1, 1].flatMap(side => [rod("踏步下方实际接地并撑到上廊的斜梯梁", [9.1, .02, side * .38], [4.55, 4, side * .38], .1, material.dark), ...[0, 6, 13, 19].map(index => { const x = 9.1 - index * .23; return rod("从梯阶接到同一斜扶手的护栏立柱", [x, .14 + index * .2, side * .49], [x, 1.1 + (9.1 - x) / 4.55 * 4, side * .49], .035, material.steel); }), rod("沿斜梯连续上升的实际扶手", [9.1, 1.1, side * .49], [4.55, 5.1, side * .49], .04, material.steel)])];
}

function formerRail(): ModelPart {
  const outline: [number, number][] = [], opening: [number, number][] = [];
  for (const [z, start] of [[4.1, 0], [-4.1, 180]]) for (let step = 0; step <= 12; step++) {
    const a = (start! + step * 15) * Math.PI / 180;
    outline.push([.65 + Math.cos(a) * .7, z! + Math.sin(a) * .7]);
    opening.push([.65 + Math.cos(a) * .6, z! + Math.sin(a) * .6]);
  }
  return polygon("供手模链连续回程且中央真实留空的环形导轨", material.dark, outline, .08, [0, 2.25, 0], [opening]);
}

function handFormer(z: number): ModelPart[] {
  const y = 1.73;
  return [rod("把瓷模腕端实际接到上方输送链的悬臂", [0, 2.3, z], [0, y, z], .03), cylinder("瓷手模上方与悬臂连接的长腕管", [0, y - .055, z], [.055, .11, .055], pale), ball("陶瓷手模具有真实厚度的手掌", [0, y - .15, z], [.1, .14, .05], pale), ...Array.from({ length: 4 }, (_, index) => { const length = [.095, .13, .12, .09][index]!; return cylinder("与手掌连体而彼此分开的四根瓷模手指", [-.034 + index * .023, y - .21 - length / 2, z], [.019, length, .02], pale); }), rod("向掌侧斜出的瓷模拇指", [.042, y - .12, z], [.083, y - .22, z], .023, pale)];
}

function coneCage(): ModelPart[] {
  const ribs: [Triple, Triple][] = Array.from({ length: 16 }, (_, index) => { const a = index * Math.PI / 8; return [[Math.cos(a) * .35, 1.02, -.1 + Math.sin(a) * .35], [Math.cos(a) * .035, 1.83, -.1 + Math.sin(a) * .035]]; });
  return [...cageMembers("锥面上实际留通风间隙的纵向金属网骨", ribs, .012), ...Array.from({ length: 8 }, (_, index) => loop("与纵骨交织并围成空心成帽锥笼的横向细环", [0, 1.02 + index * .105, -.1], .35 - index * .0408, .006)), cylinder("把锥笼顶端封在一起的小圆帽", [0, 1.833, -.1], [.075, .012, .075], material.steel), loop("锥笼底端可握持且不塞住吸风口的宽法兰环", [0, 1.015, -.1], .415, .028)];
}

function brimCone(x: number, y: number): ModelPart {
  return part("从小端到大端连续渐粗的独立扩檐锥辊", "lathe", material.steel, [x, y, -.3], [1, 1, 1], [90, 0, 0], { profile: [{ x: 0, y: 0 }, { x: .05, y: 0 }, { x: .115, y: .28 }, { x: 0, y: .28 }] });
}

// 独立静态演出设备；不包含车辆、表演者或场馆建筑壳。
export const stageTextileExpansionBatchSixObjects: MasterPrototype[] = [
  { name: "带入口环廊的木筒死亡之墙骑行装置", itemType: "设施", theme: "欧式", build: () => [
    cylinder("木筒内从入口连续通向骑行壁的完整地板", [0, .06, 0], [7.84, .12, 7.84], material.wood),
    clothShell("底部有真实进车门且内侧连续可骑行的厚木筒壁", [{ y: .12, rx: 3.92, rz: 3.92 }, { y: 2.1, rx: 3.92, rz: 3.92 }, { y: 4.12, rx: 3.92, rz: 3.92 }], material.wood, (row, column) => row === 0 && column >= 46 && column < 50, [0, 0, 0], [0, 0, 0], .12, 64),
    ...[.45, 1.15, 1.85].map(y => clothShell("在进车门两侧真实断开而非封门的筒壁外箍", [{ y: y - .025, rx: 3.985, rz: 3.985 }, { y: y + .025, rx: 3.985, rz: 3.985 }], material.steel, (_, column) => column >= 46 && column < 50, [0, 0, 0], [0, 0, 0], .035, 64)),
    ...[2.8, 3.92].map(y => loop("门楣上方完整围合的加固钢箍", [0, y, 0], 3.985, .035)),
    ...Array.from({ length: 16 }, (_, index) => index === 12 ? [] : [box("支住木壁并承接各道外箍的独立外竖肋", [Math.cos(index * Math.PI / 8) * 3.95, 2.02, Math.sin(index * Math.PI / 8) * 3.95], [.08, 3.96, .08], material.dark)]).flat(),
    polygon("与筒壁相接而中间敞开的上方观演环廊", material.wood, ovalPoints(4.5, 4.5, 32), .12, [0, 4, 0], [ovalPoints(3.93, 3.93, 32)]),
    ...[4.65, 5.08].map(y => clothShell("在接楼梯处真正留出通行缺口的环廊护栏", [{ y: y - .018, rx: 4.5, rz: 4.5 }, { y: y + .018, rx: 4.5, rz: 4.5 }], material.steel, (_, column) => column === 0 || column === 63, [0, 0, 0], [0, 0, 0], .035, 64)),
    ...Array.from({ length: 15 }, (_, index) => { const a = (index + 1) * Math.PI / 8; return rod("环廊外缘真正接地到扶手的护栏柱", [Math.cos(a) * 4.48, 4.12, Math.sin(a) * 4.48], [Math.cos(a) * 4.48, 5.1, Math.sin(a) * 4.48], .045); }),
    ...[-1, 1].map(side => rod("环廊上楼梯缺口两侧的独立护栏柱", [4.48, 4.12, side * .45], [4.48, 5.1, side * .45], .045)),
    ...[-1, 1].map(side => rod("进车门两侧的实际框柱", [side * .765, .12, -3.845], [side * .765, 2.12, -3.845], .08, material.dark)),
    rod("不压低进车门净高的实际横门楣", [-.765, 2.12, -3.845], [.765, 2.12, -3.845], .08, material.dark),
    plate("从地面连续坡接到筒内地板的进车坡", [0, 0, -3.845], [[0, 0], [1.2, 0], [0, .12]], 1.45, material.wood, [0, 90, 0]),
    ...barrelStairs(),
    box("把楼梯最后一级接入环廊缺口的上平台", [4.55, 4.05, 0], [.6, .14, 1.05], material.wood),
  ] },
  // 刚性摆臂与多人足板参考 CircusConcepts Russian Swing；不是两台接飞人平台。
  { name: "双A架刚性荡板俄罗斯摆", itemType: "设施", theme: "现代", build: () => [
    ...[-1, 1].flatMap(x => [-1, 1].map(z => box("把摆架压在地面的四个长脚座", [x * 1.8, .06, z * 2], [.45, .12, .9], material.dark))),
    ...[-1, 1].flatMap(x => [-1, 1].map(z => rod("从前后脚座合到上摆轴的高A架腿", [x * 1.8, .12, z * 2], [x * 1.8, 4.7, 0], .14, frame))),
    rod("跨接左右A架的上部轴梁", [-2, 4.7, 0], [2, 4.7, 0], .18, frame),
    ...[-1, 1].map(side => rod("A架脚部前后相连的防张开底梁", [side * 1.8, .16, -2], [side * 1.8, .16, 2], .1, material.dark)),
    ...[-1, 1].map(side => cylinder("实际穿过摆臂上端的左右共轴轴承", [side * 1.35, 4.63, 0], [.28, .35, .28], material.dark, [0, 0, 90])),
    ...[-1, 1].flatMap(x => [-1, 1].map(z => rod("以刚性钢臂把足板挂到真实上转轴", [x * 1.35, 4.63, 0], [x * 1.35, 1.1, z * .47], .065, material.steel))),
    plate("前后沿上翘而中间可站立的整幅荡板", [0, 1.02, 0], [[-.7, .18], [-.55, .03], [.55, .03], [.7, .18], [.68, .21], [.52, .065], [-.52, .065], [-.68, .21]], 2.8, material.wood, [0, 90, 0]),
    ...[-1, 1].map(side => rod("足板侧缘连接前后摆臂的承重横杆", [side * 1.35, 1.1, -.5], [side * 1.35, 1.1, .5], .07, material.dark)),
    ...[-1, 1].map(side => rod("供推摆者握住且两端接在摆臂上的半高侧把杆", [side * 1.35, 2.1, -.34], [side * 1.35, 2.1, .34], .04, material.dark)),
    ...[-1, 1].map(side => rod("仅在外侧A架连接前后腿而不封住摆动空间的横撑", [side * 1.8, 2.1, -1.12], [side * 1.8, 2.1, 1.12], .065, frame)),
  ] },
  // 瓷模链、分槽和热固化段参考 Ansell/CeramTec 公布的制手套过程；不是纸带浸胶塔换负载。
  { name: "手形瓷模环链三槽浸胶硫化单元线", itemType: "设施", theme: "现代", build: () => [
    formerRail(),
    ...[-4.1, -.8, 4.1].flatMap(z => [...[-.8, 1.5].map(x => box("输送环链门架的真实接地立柱", [x, 1.15, z], [.1, 2.3, .12], frame)), box("跨过湿槽与回程轨的门架横梁", [.35, 2.3, z], [2.5, .12, .15], frame)]),
    ...[-3, -1, 1].flatMap((z, index) => [box("把独立浸渍湿槽托到工作高度的整体底座", [0, .375, z], [1.25, .75, 1.5], material.dark), ...processBath(index === 0 ? "清洗凝固预处理槽" : index === 1 ? "乳胶浸渍槽" : "淋洗后处理槽", 1.35, 1.6, .75, [0, .75, z]), { ...box("只在槽内而不越过侧壁的薄液面", [0, 1.405, z], [1.05, .025, 1.3], index === 1 ? cloth : "#829fa0"), opacity: .7 }]),
    ...[-3, -1, 1, 3.2].flatMap(z => handFormer(z)),
    box("热固化段从地面到炉底的独立承重机座", [0, .5, 3.2], [1.45, 1, 2.4], material.dark),
    ...[-1, 1].map(side => box("两端敞开让手模通过的热固化炉侧壁", [side * .65, 1.7, 3.2], [.1, 1.5, 2.2], frame)),
    box("不以实心箱堵住手模通路的固化炉顶", [0, 2.45, 3.2], [1.4, .12, 2.2], frame),
    cylinder("固化炉上方实际接至炉顶的排风筒", [0, 2.9, 3.2], [.3, .8, .3], material.steel),
    cylinder("排风筒顶端防落物的外翻边", [0, 3.3, 3.2], [.37, .06, .37], material.dark),
    box("面向湿段操作者的线体控制箱", [-.98, .75, 1.85], [.35, 1.25, .5], frame),
    box("控制箱上部实际嵌入的显示玻璃", [-.98, 1.12, 1.593], [.27, .18, .012], material.glass),
  ] },
  { name: "半环热罩袜形板旋转定形机", itemType: "设施", theme: "现代", build: () => [
    cylinder("承住回转袜板总成的圆形落地底台", [0, .2, 0], [1.65, .4, 1.65], material.dark),
    cylinder("底台上方承接回转盘的中心驱动柱", [0, .51, 0], [.5, .52, .5], frame),
    cylinder("用同一中心轴带动各袜板的回转工作盘", [0, .65, 0], [2.25, .12, 2.25], material.steel),
    ...Array.from({ length: 8 }, (_, index) => { const a = index * Math.PI / 4, x = Math.cos(a) * .95, z = Math.sin(a) * .95; return [cylinder("把每块袜形板固定到转盘的快装立座", [x, .735, z], [.07, .09, .07], material.dark), plate("上宽下脚且具有实在厚度的独立加热袜形板", [x, .76, z], [[-.045, 0], [.07, 0], [.09, .5], [.08, .65], [-.045, .65], [-.065, .45], [-.09, .12], [-.2, .1], [-.24, .06], [-.24, .015], [-.05, .015]], .014, pale, [0, -index * 45, 0])]; }).flat(),
    clothShell("前半部开放供装袜而后半部封合的热风罩外壁", [{ y: .65, rx: 1.28, rz: 1.28 }, { y: 1.65, rx: 1.28, rz: 1.28 }], frame, (_, column) => column >= 16, [0, 0, 0], [0, 0, 0], .08, 32),
    clothShell("热风半罩内侧真实包围中央空区的弧壁", [{ y: .65, rx: .6, rz: .6 }, { y: 1.65, rx: .6, rz: .6 }], material.dark, (_, column) => column >= 16, [0, 0, 0], [0, 0, 0], .06, 32),
    clothShell("仅覆盖后半盘且保留中央空区的环形罩顶", [{ y: 1.65, rx: 1.28, rz: 1.28 }, { y: 1.73, rx: 1.28, rz: 1.28 }], frame, (_, column) => column >= 16, [0, 0, 0], [0, 0, 0], .7, 32),
    cylinder("后罩外侧与热风循环筒相接的鼓风机", [0, 1.0, 1.5], [.45, .4, .45], material.dark, [90, 0, 0]),
    box("热风机下方实际连接底台的承重座", [0, .45, 1.45], [.45, .9, .5], frame),
    rod("从鼓风机进入后半热罩的短送风管", [0, 1.0, 1.4], [0, 1.0, 1.2], .23, material.steel),
    box("前方可直接操作的低位控制台", [.7, .6, -1.25], [.4, .8, .35], frame),
    box("控制台前上方的显示窗", [.7, .85, -1.432], [.28, .14, .01], material.glass),
  ] },
  // 吸风锥、开松喂入与成形室结构参考 Bahner 3-212，不与已发冠楦蒸汽撑形机共本体。
  { name: "吸风锥笼毡帽坯喷铺成形机", itemType: "设施", theme: "现代", build: () => {
    const doorAngle = 55 * Math.PI / 180;
    return [...machineBed(2.4, 2.8, .5), cylinder("锥笼底下接至吸风机的密闭汇风腔", [0, .78, -.1], [.84, .46, .84], frame), ...coneCage(),
      ...[-1, 1].map(side => box("成形室左右两片真正留出内部空间的厚侧壁", [side * .76, 1.3, -.08], [.06, 1.6, 1.45], frame)),
      piercedPanel("后壁实际留出喂毛风道通口的成形室背板", [0, 1.3, .62], [[-.775, -.8], [.775, -.8], [.775, .8], [-.775, .8]], [[[-.7, -.55], [.7, -.55], [.7, -.25], [-.7, -.25]]], .06, frame, [90, 0, 0]), box("成形室顶部的独立防飞纤维盖", [0, 2.12, -.08], [1.6, .06, 1.5], frame),
      ...[-1, 1].map(side => ({ ...box("绕各自真实外侧铰轴敞开的成形室透明门", [side * (.75 - .375 * Math.cos(doorAngle)), 1.3, -.78 - .375 * Math.sin(doorAngle)], [.75, 1.6, .025], material.glass, [0, -side * 55, 0]), opacity: .28 })),
      ...[-1, 1].map(side => cylinder("门板共同绕其实际外缘旋转的长铰轴", [side * .75, 1.3, -.78], [.028, 1.65, .028], material.dark)),
      ...[-1, 1].map(side => box("喂毛开松鼓的独立接地后支架", [side * .72, .75, 1.2], [.12, 1.5, .65], frame)),
      ...[1.08, 1.38].map(z => roller("把毛纤维开松后送向成形室的齿辊", [0, 1.43, z], 1.4, .3, material.dark)),
      clothWeb("进入开松辊之前的短喂毛托带", 1.35, [0, 1.3, 1.95], [0, 1.3, 1.4], cloth),
      ...[-1, 1].map(side => box("把开松纤维送入真通口的风道上下薄壁", [0, 1.7 + side * .135, .88], [1.4, .03, .5], material.steel)),
      ...[-1, 1].map(side => box("风道左右侧壁保持中间通风而非实心箱", [side * .685, 1.7, .88], [.03, .3, .5], material.steel)),
      cylinder("独立外置吸风机的圆形涡壳", [-1.22, .73, .15], [.8, .45, .8], material.dark, [0, 0, 90]),
      box("吸风机真实落地的宽底脚", [-1.22, .2, .15], [.5, .4, .8], material.dark),
      rod("汇风腔与吸风机之间连续相接的粗管", [-.35, .78, -.1], [-1.05, .73, .15], .25, material.steel),
      box("独立侧置的成形控制机箱", [1.07, .6, 1.0], [.4, 1.2, .55], frame), box("嵌于机箱上方的观察显示面", [1.07, .98, .716], [.3, .18, .012], material.glass)];
  } },
  { name: "双对锥辊蒸汽帽檐扩展机", itemType: "设施", theme: "现代", build: () => [
    cylinder("灰铸铁机柱底下的宽圆落地盘", [0, .045, .04], [.68, .09, .68], material.dark),
    part("从宽底收腰后承接辊组的立式铸铁机柱", "lathe", frame, [0, .08, .12], [1, 1, 1], [0, 0, 0], { profile: [{ x: 0, y: 0 }, { x: .22, y: 0 }, { x: .15, y: .2 }, { x: .11, y: .72 }, { x: .16, y: .88 }, { x: 0, y: .88 }] }),
    box("在机柱上承接两对锥辊轴承的横齿箱", [0, 1.07, .13], [.61, .45, .25], frame),
    ...[-1, 1].flatMap(side => [brimCone(side * .16, .945), brimCone(side * .16, 1.175), ...[.945, 1.175].map(y => rod("锥辊后端实际穿入齿轮箱的短轴", [side * .16, y, -.02], [side * .16, y, .19], .035))]),
    rod("两对锥辊之间对准帽檐的细蒸汽指管", [0, 1.06, .1], [0, 1.06, -.2], .018, material.dark),
    polygon("位于锥辊夹口且中央留出帽冠的待扩檐环", cloth, ovalPoints(.23, .23), .004, [0, 1.058, -.14], [ovalPoints(.095, .095)]),
    cylinder("机柱侧面安装的独立传动电机", [.3, .58, .15], [.2, .26, .2], material.dark, [90, 0, 0]),
    box("把侧置电机接回机柱的短支架", [.2, .48, .15], [.28, .08, .18], frame),
    cord("从底部蒸汽接口上升至辊口的供汽细管", [[-.08, .25, .15], [-.15, .75, .15], [0, 1.06, .1]], .015, material.dark),
    rod("机柱下方向操作者伸出的脚踏连杆", [0, .3, -.02], [0, .08, -.35], .02, material.dark),
    box("控制蒸汽与辊合距的实际脚踏板", [0, .07, -.36], [.2, .045, .15], material.dark, [-12, 0, 0]),
  ] },
  // 固定罗拉台与往复锭车参考 Musée des Arts et Métiers 00184 及 Science Museum 纺骡藏品。
  { name: "固定罗拉台轨道锭车走锭纺骡机", itemType: "设施", theme: "欧式", build: () => {
    const yarnX = Array.from({ length: 16 }, (_, index) => -2.35 + index * 4.7 / 15);
    const fibers = yarnX.flatMap(x => [[[x, 1.525, 1.15], [x, 1.261, 1.0]], [[x, 1.261, 1.0], [x, 1.261, .6]], [[x, 1.261, .6], [x, 1.05, -1.36]]] as [Triple, Triple][]);
    return [...machineBed(6, 1.4, .8).map(value => ({ ...value, position: { ...value.position, z: value.position.z + .8 } })),
      ...[-1, 1].map(side => box("固定罗拉台两端实际落地的厚轴床", [side * 2.7, .83, .85], [.16, 1.66, .8], frame)),
      ...[.6, .8, 1].flatMap(z => [roller("夹住粗纱并逐段牵伸的下罗拉", [0, 1.2, z], 5.3, .12, material.dark), roller("与下罗拉形成细窄纱口的上罗拉", [0, 1.322, z], 5.3, .12, material.steel)]),
      ...yarnX.map(x => roller("固定机台上方逐锭供纱的粗纱筒", [x, 1.6, 1.15], .17, .15, cloth)),
      roller("穿过全部供纱筒并接回端轴床的整根筒轴", [0, 1.6, 1.15], 5.5, .028, material.steel),
      ...[-1, 1].map(side => box("允许整列锭车向前后往复的接地直轨", [side * 2.4, .08, -.45], [.09, .1, 3.7], material.dark)),
      ...[-1, 1].flatMap(x => [-1, 1].map(z => cylinder("长锭车真正落在轨顶上的行走轮", [x * 2.4, .23, -1.4 + z * .22], [.2, .075, .2], material.dark, [0, 0, 90]))),
      box("承住整列纺锭且与固定台分开的移动长车", [0, .39, -1.4], [5.25, .18, .5], frame),
      ...cageMembers("从移动锭车向后上方略倾的整列细纺锭", yarnX.map(x => [[x, .48, -1.48], [x, 1.05, -1.36]] as [Triple, Triple]), .014),
      ...yarnX.map(x => cylinder("卷绕在对应活动纺锭上的独立管纱", [x, .73, -1.427], [.065, .28, .065], cloth, [12, 0, 0])),
      ...cageMembers("从固定罗拉伸到移动锭尖的绷紧牵伸纱束", fibers, .0035, cloth),
      rod("实际托住牵伸纱线的全列导纱钢丝", [-2.55, 1.061, -1.2], [2.55, 1.061, -1.2], .012),
      ...[-1, 1].map(side => rod("把导纱钢丝接在锭车两端的细支臂", [side * 2.55, .48, -1.4], [side * 2.55, 1.061, -1.2], .025)),
      loop("端侧驱动回程与纺锭传动的独立大轮", [-2.95, .8, .85], .35, .035, [0, 0, 90], material.wood),
      ...Array.from({ length: 4 }, (_, index) => { const a = index * Math.PI / 2; return rod("大驱动轮中心实际接到轮缘的木辐", [-2.95, .8, .85], [-2.95, .8 + Math.cos(a) * .33, .85 + Math.sin(a) * .33], .025, material.wood); }),
      rod("大轮轮心穿入固定台轴床的共用传动轴", [-3.05, .8, .85], [-2.55, .8, .85], .05),
      rod("牵动长锭车前后回程的细绷索", [-2.6, .45, -1.4], [-2.6, .8, .85], .009, material.dark)];
  } },
  { name: "移夹牵纱多锭手摇珍妮纺纱架", itemType: "设施", theme: "欧式", build: () => {
    const yarnX = Array.from({ length: 12 }, (_, index) => -.66 + index * 1.32 / 11);
    const strands = yarnX.flatMap(x => [[[x, .8, -.45], [x, .97, 0]], [[x, .97, 0], [x, 1.18, .45]]] as [Triple, Triple][]);
    return [...[-1, 1].flatMap(x => [-1, 1].map(z => box("支承移夹轨与下床的四根完整木立柱", [x * .85, .6, z * .5], [.065, 1.2, .065], material.wood))),
      ...[-1, 1].map(side => box("连接木架前后并承住移动夹轨的纵梁", [side * .85, .78, 0], [.075, .1, 1.05], material.wood)),
      ...[-1, 1].map(side => box("承住供纱筒与锭根的前后木横床", [0, .58, side * .45], [1.78, .1, .12], material.wood)),
      ...[-1, 1].map(side => box("供人工抽移夹纱横梁的独立直滑轨", [side * .79, .95, 0], [.055, .055, 1.0], material.dark)),
      box("横跨各纱股而可沿轨抽移的下夹纱条", [0, .948, 0], [1.65, .035, .065], material.wood),
      box("与下夹条保持真实细缝的上夹纱条", [0, .994, 0], [1.65, .035, .065], material.wood),
      ...yarnX.map(x => cylinder("位于前木横床上逐股供纱的粗纱卷", [x, .7, -.45], [.075, .2, .075], cloth)),
      ...cageMembers("后横床上竖直且彼此分开的整列细纺锭", yarnX.map(x => [[x, .62, .45], [x, 1.18, .45]] as [Triple, Triple]), .012),
      ...yarnX.flatMap(x => [cylinder("卷绕在对应纺锭下部的独立细管纱", [x, .82, .45], [.055, .28, .055], cloth), cylinder("纺锭根端与下床相接的独立传动小轮", [x, .64, .45], [.055, .02, .055], material.dark)]),
      ...cageMembers("经过移夹条真缝后通向各锭尖的纱束", strands, .0035, cloth),
      loop("在架侧用手摇动并同时驱动多锭的大木轮", [-1.0, .78, 0], .5, .032, [0, 0, 90], material.wood),
      ...Array.from({ length: 6 }, (_, index) => { const a = index * Math.PI / 3; return rod("把手轮大轮缘实际接到中心轴的木辐", [-1.0, .78, 0], [-1.0, .78 + Math.cos(a) * .48, Math.sin(a) * .48], .02, material.wood); }),
      rod("从大手轮穿入侧木梁的短轴", [-1.08, .78, 0], [-.6, .78, 0], .035),
      rod("偏离轮心而能实际施力的外侧摇把", [-1.0, 1.19, .25], [-1.15, 1.19, .25], .025, material.dark),
      ...[-1, 1].map(side => rod("下木框两侧保持架体稳定的斜拉撑", [side * .85, .14, -.5], [side * .85, 1.1, .5], .03, material.dark))];
  } },
];
