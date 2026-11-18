import { part, ring, beam, type ModelPart, type Triple } from "../assetModelParts";
import { tapered } from "../masterNature/shared";
import { box, cylinder, rod, ball, piercedPanel, material, type MasterPrototype } from "./parts";

function roundOutline(radiusX: number, radiusZ = radiusX, count = 16): [number, number][] {
  return Array.from({ length: count }, (_, index) => {
    const angle = index * Math.PI * 2 / count;
    return [Math.cos(angle) * radiusX, Math.sin(angle) * radiusZ];
  });
}

function hardPanel(name: string, color: string, outline: [number, number][], thickness: number, position: Triple, holes: [number, number][][] = [], rotation: Triple = [0, 0, 0]): ModelPart {
  const value = piercedPanel(name, position, outline, holes, thickness, color, rotation);
  value.vertices = value.indices!.map(index => ({ ...value.vertices![index]! }));
  delete value.indices;
  return value;
}

export const domesticExpansionBatchNineObjects: MasterPrototype[] = [
  // 只参考煮水罐、立柱、方向性蒸汽臂的工作布局；所有形体由本地工厂创建。
  // https://collins.co/products/facial-steamer
  { name: "玻璃罐关节长臂落地蒸面机", theme: "现代", itemType: "设施", build: () => {
    const result: ModelPart[] = [cylinder("维持长臂平衡的中央铸重底座", [0, 0.095, 0], [0.23, 0.11, 0.23], material.dark), cylinder("底座上真实承接机头的长立柱", [0, 0.54, 0], [0.045, 0.87, 0.045], material.steel), box("蒸汽发生机头的隔热上壳", [0.025, 0.98, 0.015], [0.24, 0.14, 0.21], material.ivory), { ...ring("挂在机头下方且实际空心的玻璃煮水罐", material.glass, 0.066, 0.004, 0.78, 0.24, { position: { x: 0.075, y: 0.78, z: -0.015 } }), opacity: 0.3 }, cylinder("玻璃罐密封底", [0.075, 0.663, -0.015], [0.131, 0.006, 0.131], material.glass), cylinder("机头下部夹紧玻璃罐的独立上盖", [0.075, 0.915, -0.015], [0.145, 0.03, 0.145], material.dark), cylinder("罐内由上盖悬入的短加热组件", [0.075, 0.79, -0.015], [0.024, 0.22, 0.024], material.steel), cylinder("长臂根部的横向调角铰轴", [-0.08, 1.04, 0], [0.07, 0.12, 0.07], material.dark, [90, 0, 0]), rod("机头到长臂中关节的承重短段", [-0.08, 1.04, 0], [-0.2, 1.22, 0], 0.035, material.ivory), rod("可转向面部的独立长蒸汽臂", [-0.2, 1.22, 0], [-0.58, 1.22, -0.04], 0.03, material.ivory), cylinder("两臂段实际连接的圆形关节", [-0.2, 1.22, 0], [0.058, 0.045, 0.058], material.dark, [90, 0, 0]), part("长臂端部向外敞开的真正蒸汽喷口", "lathe", material.ivory, [-0.58, 1.22, -0.04], [1, 1, 1], [0, 0, 110], { profile: [{ x: 0.018, y: 0 }, { x: 0.044, y: 0.075 }, { x: 0.038, y: 0.075 }, { x: 0.012, y: 0 }, { x: 0.018, y: 0 }] }), cylinder("机头前部调汽计时旋钮", [0.025, 0.98, -0.102], [0.055, 0.025, 0.055], material.dark, [90, 0, 0])];
    for (let index = 0; index < 5; index++) { const angle = index * Math.PI * 2 / 5, x = Math.cos(angle) * 0.3, z = Math.sin(angle) * 0.3; result.push(rod("向外展开并接住脚轮的独立星形底脚", [0, 0.1, 0], [x, 0.08, z], 0.04, material.dark), cylinder("星形底脚下的独立小脚轮", [x, 0.04, z], [0.08, 0.03, 0.08], material.dark, [90, 0, 0])); }
    return result;
  } },
  // 回转热源为开放圆环，区别于封闭头罩式热风干发机；没有复刻品牌外观或参数。
  // https://manual.tb-global.net/archives/product/roller-ball-f-mobile-version
  { name: "倾环回转红外烫发促进机", theme: "现代", itemType: "设施", build: () => {
    const angle = 55 * Math.PI / 180, joinY = 1.48 - Math.sin(angle) * 0.289, joinZ = -0.27 + Math.cos(angle) * 0.289;
    const result: ModelPart[] = [cylinder("回转热环下方的重心底毂", [0, 0.115, 0.12], [0.22, 0.12, 0.22], material.dark), cylinder("下部可锁高的外立柱", [0, 0.62, 0.12], [0.065, 1.02, 0.065], material.steel), cylinder("上部实际伸出的细调高芯杆", [0, 1.16, 0.12], [0.045, 0.39, 0.045], material.steel), box("后立柱上的驱动与控制竖壳", [0, 1.35, 0.1], [0.16, 0.3, 0.23], material.ivory), ring("保留头部开放空间的倾斜回转外热环", material.ivory, 0.295, 0.018, 0, 0.045, { position: { x: 0, y: 1.48, z: -0.27 }, rotation: { x: 55, y: 0, z: 0 } }), ring("与外环内沿接合的独立碳热辐射窄环", material.dark, 0.277, 0.008, 0, 0.016, { position: { x: 0, y: 1.48, z: -0.27 }, rotation: { x: 55, y: 0, z: 0 } }), rod("后驱动座真正连接到热环根部的短传动臂", [0, 1.25, -0.015], [0, joinY, joinZ], 0.045, material.steel), cylinder("与短臂同轴接合的回转驱动头", [0, 1.25, 0.006], [0.09, 0.08, 0.09], material.dark, [90, 0, 0]), box("后竖壳上的时间温度控制面", [0, 1.4, 0.222], [0.115, 0.12, 0.015], material.glass), rod("立柱中段的调高锁紧踏杆", [0.027, 0.55, 0.12], [0.16, 0.55, 0.12], 0.018, material.dark)];
    for (let index = 0; index < 5; index++) { const theta = index * Math.PI * 2 / 5, x = Math.cos(theta) * 0.32, z = 0.12 + Math.sin(theta) * 0.32; result.push(rod("维持热环稳定的长星形轮脚", [0, 0.115, 0.12], [x, 0.085, z], 0.04, material.dark), cylinder("轮脚下独立行走小轮", [x, 0.045, z], [0.09, 0.03, 0.09], material.dark, [90, 0, 0])); }
    return result;
  } },
  { name: "跨床门架悬带三角自助拉手架", theme: "现代", itemType: "设施", build: () => {
    const result: ModelPart[] = [...[-1, 1].flatMap(x => [-1, 1].map(z => rod("从床两侧地面拱向横梁的四根门架腿", [x * 0.75, 0.045, z * 0.65], [x * 0.75, 2.1, 0], 0.055, material.steel))), rod("跨越床上方的独立承重长横梁", [-0.79, 2.1, 0], [0.79, 2.1, 0], 0.06), ...[-1, 1].map(side => rod("每侧两斜腿间防张开的短横撑", [side * 0.75, 0.7, -0.443], [side * 0.75, 0.7, 0.443], 0.035)), ...[-1, 1].flatMap(x => [-1, 1].map(z => box("四角各自接触地面的防滑承压脚", [x * 0.75, 0.025, z * 0.65], [0.13, 0.05, 0.18], material.dark))), ring("抱住上横梁并真正承接悬吊带的窄金属环", material.dark, 0.039, 0.012, 0, 0.025, { position: { x: 0, y: 2.1, z: 0 }, rotation: { x: 0, y: 0, z: 90 } }), beam("上环至三角拉手的承重扁织带", material.dark, [0, 2.062, 0], [0, 1.63, 0.012], 0.024, 0.004), hardPanel("中间可供手掌穿入的真正三角握框", material.ivory, [[0, -0.16], [0.18, 0.12], [-0.18, 0.12]], 0.024, [0, 1.47, 0], [[[0, -0.1], [0.125, 0.08], [-0.125, 0.08]]], [90, 0, 0])];
    return result;
  } },
  { name: "顶天立地回转扶把助站柱", theme: "现代", itemType: "设施", build: () => [
    cylinder("压在地面的宽防滑圆底垫", [0, 0.035, 0], [0.23, 0.07, 0.23], material.dark), cylinder("底垫上向上承力的长外柱", [0, 0.75, 0], [0.055, 1.45, 0.055], material.steel), cylinder("与下柱重叠的上段伸缩芯柱", [0, 1.9, 0], [0.043, 1.0, 0.043], material.ivory), cylinder("实际顶住天花的宽弹性压盘", [0, 2.42, 0], [0.2, 0.055, 0.2], material.dark), ring("锁住两柱搭接处的独立压紧套环", material.dark, 0.038, 0.012, 1.42, 0.08), rod("压紧套环外侧可手拧的短锁杆", [0.031, 1.42, 0], [0.1, 1.42, 0.03], 0.012, material.dark), ...[0.82, 1.18].map(y => ring("弯扶把上下端共同绕转的承轴套", material.dark, 0.044, 0.017, y, 0.055)), tapered("从下承轴套弯出再回接上套的完整扶把", material.ivory, [[0.027, 0.82, 0], [0.22, 0.82, 0], [0.3, 1.0, 0], [0.22, 1.18, 0], [0.027, 1.18, 0]], [0.024, 0.024, 0.024, 0.024, 0.024]), ring("柱底螺压调高处的独立转动手轮", material.dark, 0.061, 0.012, 0.17, 0.035), ...[-1, 1].map(side => rod("手轮与柱身实际相连的短辐条", [side * 0.025, 0.17, 0], [side * 0.055, 0.17, 0], 0.01, material.dark)),
  ] },
  { name: "膝托扶杆旋盘转位平台", theme: "现代", itemType: "设施", build: () => {
    const result: ModelPart[] = [cylinder("始终贴地承力的固定圆底盘", [0, 0.0125, 0], [0.5, 0.025, 0.5], material.dark), ring("固定下盘与可转上盘间的独立环形轴承", material.steel, 0.202, 0.018, 0.03, 0.014), cylinder("供双脚站立并围绕轴承转动的上踏盘", [0, 0.05, 0], [0.48, 0.035, 0.48], material.ivory), ...[-1, 1].map(side => hardPanel("上踏盘上两块真实独立的防滑脚垫", material.dark, [[-0.045, -0.1], [0.045, -0.1], [0.055, 0.06], [0.03, 0.1], [-0.03, 0.1], [-0.055, 0.06]], 0.006, [side * 0.105, 0.068, 0.035])), ...[-1, 1].map(side => rod("随转盘一起回转的两根前扶立杆", [side * 0.18, 0.065, -0.12], [side * 0.18, 1.1, -0.12], 0.034)), rod("便于站起握住的宽横扶把", [-0.235, 1.1, -0.12], [0.235, 1.1, -0.12], 0.038, material.dark), ...[-1, 1].map(side => box("扶立杆前后可调的两块独立膝软托", [side * 0.105, 0.55, -0.045], [0.17, 0.2, 0.065], material.glass)), ...[-1, 1].map(side => rod("把膝软托真正接到前立杆的短承托", [side * 0.18, 0.55, -0.12], [side * 0.105, 0.55, -0.045], 0.023)), ...[-1, 1].map(side => cylinder("空载挪动时使用的两只后倾小轮", [side * 0.2, 0.05, -0.19], [0.08, 0.035, 0.08], material.dark, [90, 0, 0])), ...[-1, 1].map(side => rod("下盘向运输小轮伸出的真实短轮叉", [side * 0.17, 0.06, -0.14], [side * 0.2, 0.05, -0.19], 0.022, material.steel))];
    return result;
  } },
  { name: "手刹软座折合四轮助行车", theme: "现代", itemType: "设施", build: () => {
    const result: ModelPart[] = [];
    for (const side of [-1, 1]) {
      result.push(rod("前轮上行至折架铰点的长前支腿", [side * 0.27, 0.17, -0.31], [side * 0.27, 0.61, 0.08], 0.035), rod("后轮收合到同一铰点的独立后腿", [side * 0.27, 0.17, 0.34], [side * 0.27, 0.61, 0.08], 0.035), rod("前支腿上方承接握把的独立伸缩柱", [side * 0.27, 0.61, 0.08], [side * 0.27, 0.95, 0.14], 0.029), cylinder("前后腿实际共用的外侧折合轴", [side * 0.27, 0.61, 0.08], [0.06, 0.06, 0.06], material.dark, [0, 0, 90]), rod("长柱顶端向操作者伸出的防滑握柄", [side * 0.27, 0.95, 0.14], [side * 0.27, 0.95, 0.27], 0.039, material.dark), rod("握柄下方可向上捏合的制动扳手", [side * 0.27, 0.904, 0.15], [side * 0.27, 0.904, 0.25], 0.015, material.steel), tapered("手刹扳手接到后轮制动器的独立线管", material.dark, [[side * 0.27, 0.905, 0.15], [side * 0.3, 0.7, 0.12], [side * 0.3, 0.29, 0.29], [side * 0.27, 0.22, 0.34]], [0.0035, 0.0035, 0.0035, 0.0035]));
      for (const z of [-0.32, 0.34]) result.push(cylinder("各自接地的行走大轮", [side * 0.28, 0.11, z], [0.22, 0.045, 0.22], material.dark, [0, 0, 90]));
    }
    result.push(rod("与前支腿实际接合的前承座横杆", [-0.27, 0.58, 0.05], [0.27, 0.58, 0.05], 0.028), rod("与后腿相接并接住座后缘的后横杆", [-0.27, 0.565, 0.107], [0.27, 0.565, 0.107], 0.03), box("可随折架收拢的宽软座垫", [0, 0.6, 0.02], [0.45, 0.045, 0.32], material.dark), tapered("两上柱之间向前弯出的软质靠带", material.glass, [[-0.27, 0.8, 0.114], [-0.16, 0.8, -0.05], [0, 0.8, -0.075], [0.16, 0.8, -0.05], [0.27, 0.8, 0.114]], [0.027, 0.027, 0.027, 0.027, 0.027]), box("座下开放置物袋的底片", [0, 0.33, 0.03], [0.36, 0.012, 0.24], material.ivory), ...[-1, 1].map(side => box("置物布袋两侧的独立竖片", [side * 0.175, 0.41, 0.03], [0.01, 0.16, 0.24], material.ivory)), ...[-1, 1].map(side => box("置物布袋前后壁", [0, 0.41, 0.03 + side * 0.115], [0.34, 0.16, 0.01], material.ivory)), ...[-1, 1].map(side => beam("从承座横杆真正吊住布袋的扁带", material.dark, [side * 0.14, 0.58, 0.05], [side * 0.14, 0.487, 0.05], 0.018, 0.003)));
    return result;
  } },
  { name: "卧姿双层充气浅浴池", theme: "现代", itemType: "设施", build: () => {
    const result: ModelPart[] = [hardPanel("足端带真实排水孔的保温防水软盆底", material.glass, [[-0.435, -0.91], [-0.355, -0.995], [0.355, -0.995], [0.435, -0.91], [0.435, 0.91], [0.355, 0.995], [-0.355, 0.995], [-0.435, 0.91]], 0.05, [0, -0.005, 0], [roundOutline(0.018, 0.018, 12).map(([x, z]): [number, number] => [x + 0.25, z - 0.8])]), box("头端真正承在盆底上的防水软枕", [0, 0.065, 0.62], [0.36, 0.04, 0.25], material.ivory), ring("盆底真孔下接软管的独立排水短颈", material.dark, 0.021, 0.003, 0.022, 0.04, { position: { x: 0.25, y: 0.022, z: -0.8 } }), tapered("足端可向床外导出的排水软管", material.dark, [[0.25, 0.01, -0.8], [0.47, 0.025, -1.02], [0.6, 0.03, -1.05]], [0.015, 0.015, 0.015])];
    for (const y of [0.11, 0.245]) {
      result.push(...[-1, 1].map(side => cylinder("卧池左右两条独立长充气壁", [side * 0.36, y, 0], [0.15, 1.84, 0.15], material.glass, [90, 0, 0])), ...[-1, 1].map(side => cylinder("卧池头足端的横向充气壁", [0, y, side * 0.92], [0.15, 0.72, 0.15], material.glass, [0, 0, 90])), ...[-1, 1].flatMap(x => [-1, 1].map(z => ball("与长短气壁实际相接的柔性圆角", [x * 0.36, y, z * 0.92], [0.15, 0.15, 0.15], material.glass))));
    }
    result.push(cylinder("侧壁独立充气止气阀帽", [0.443, 0.245, 0.43], [0.025, 0.02, 0.025], material.dark, [0, 0, 90])); return result;
  } },
  { name: "方骨软罩头口家用蒸汽舱", theme: "现代", itemType: "设施", build: () => {
    const result: ModelPart[] = [...[-1, 1].flatMap(x => [-1, 1].map(z => rod("软罩四角可拆接的独立长骨架", [x * 0.39, 0.035, z * 0.39], [x * 0.39, 1.02, z * 0.39], 0.018))), ...[0.035, 1.02].flatMap(y => [-1, 1].flatMap(side => [rod("方骨架前后两根横框", [-0.39, y, side * 0.39], [0.39, y, side * 0.39], 0.018), rod("方骨架左右两根纵框", [side * 0.39, y, -0.39], [side * 0.39, y, 0.39], 0.018)])), box("与底框接合的整片防水舱底软层", [0, 0.025, 0], [0.8, 0.025, 0.8], material.glass), box("左侧独立隔热软罩布", [-0.4, 0.526, 0], [0.006, 0.972, 0.8], material.glass), hardPanel("送汽管从右软罩真实穿入的小孔", material.glass, [[-0.486, -0.4], [0.486, -0.4], [0.486, 0.4], [-0.486, 0.4]], 0.006, [0.397, 0.526, 0], [roundOutline(0.019, 0.019, 12).map(([x, z]): [number, number] => [x + 0.356, z + 0.25])], [0, 0, -90]), box("后侧隔热软罩整片布", [0, 0.526, 0.4], [0.8, 0.972, 0.006], material.glass), ...[-1, 1].map(side => box("中线可开合的两片前入口软罩", [side * 0.2, 0.526, -0.4], [0.397, 0.972, 0.006], material.glass)), hardPanel("为头颈保留真实圆口的上罩片", material.glass, [[-0.4, -0.4], [0.4, -0.4], [0.4, 0.4], [-0.4, 0.4]], 0.012, [0, 1.0, 0], [roundOutline(0.105, 0.105).map(([x, z]): [number, number] => [x, z - 0.015])]), box("入口中线连续的拉链封边", [0, 0.52, -0.407], [0.012, 0.91, 0.008], material.dark), box("供蒸坐时承托身体的舱内独立座板", [0, 0.32, 0.04], [0.35, 0.035, 0.35], material.ivory), ...[-1, 1].flatMap(x => [-1, 1].map(z => rod("实际承接舱内座板的四根短脚", [x * 0.14, 0.035, 0.04 + z * 0.14], [x * 0.14, 0.305, 0.04 + z * 0.14], 0.025))), ring("舱外独立蒸汽发生罐的真实筒壁", material.ivory, 0.09, 0.006, 0.155, 0.26, { position: { x: 0.65, y: 0.155, z: 0.25 } }), cylinder("蒸汽发生罐的封闭底座", [0.65, 0.025, 0.25], [0.185, 0.025, 0.185], material.dark), hardPanel("发生罐上盖有实际出汽通孔", material.ivory, roundOutline(0.1, 0.1, 12), 0.02, [0.65, 0.28, 0.25], [roundOutline(0.018, 0.018, 8)]), tapered("由外发生罐上行再弯入舱内的粗送汽软管", material.dark, [[0.65, 0.295, 0.25], [0.65, 0.41, 0.25], [0.48, 0.39, 0.25], [0.4, 0.17, 0.25], [0.34, 0.16, 0.25]], [0.016, 0.016, 0.016, 0.016, 0.016]), cylinder("外发生罐前部的独立调汽旋钮", [0.65, 0.17, 0.153], [0.045, 0.02, 0.045], material.dark, [90, 0, 0])];
    return result;
  } },
  { name: "分轴折扇式壁挂晾衣臂架", theme: "现代", itemType: "设施", build: () => {
    const result: ModelPart[] = [hardPanel("上下紧固孔真实贯通的长壁挂安装板", material.steel, [[-0.06, -0.425], [0.06, -0.425], [0.06, 0.425], [-0.06, 0.425]], 0.025, [0, 0.45, 0.02], [0.12, 0.78].map(y => roundOutline(0.0075, 0.0075, 8).map(([x, z]): [number, number] => [x, 0.45 - y + z])), [90, 0, 0])];
    for (let index = 0; index < 6; index++) {
      const y = 0.18 + index * 0.108, angle = (-65 + index * 26) * Math.PI / 180, end: Triple = [Math.sin(angle) * 0.68, y, -0.025 - Math.cos(angle) * 0.68];
      result.push(rod("每个独立竖轴从壁挂板向前伸出的短承座", [0, y, 0.02], [0, y, -0.025], 0.025), cylinder("可分别扇开收合的独立短竖铰轴", [0, y, -0.025], [0.042, 0.065, 0.042], material.dark), rod("绕各自竖轴展开的完整长晾衣臂", [0, y, -0.025], end, 0.017, material.steel), ball("长晾衣臂末端的独立防滑圆帽", end, [0.026, 0.026, 0.026], material.dark));
    }
    return result;
  } },
];
