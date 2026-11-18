import { part, ring, beam, type ModelPart, type Triple } from "../assetModelParts";
import { tapered } from "../masterNature/shared";
import { box, cylinder, ball, rod, cup, plate, piercedPanel, material, type MasterPrototype } from "./parts";

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

function shellFromLoops(name: string, color: string, loops: [Triple[], Triple[], Triple[], Triple[]], bottomCenter: Triple, floorCenter: Triple): ModelPart {
  const count = loops[0].length, vertices = [...loops.flat(), bottomCenter, floorCenter].map(([x, y, z]) => ({ x, y, z })), indices: number[] = [];
  for (let index = 0; index < count; index++) {
    const next = (index + 1) % count;
    indices.push(index, count + index, next, next, count + index, count + next, count + index, count * 2 + index, count + next, count + next, count * 2 + index, count * 2 + next, count * 3 + index, count * 3 + next, count * 2 + index, count * 3 + next, count * 2 + next, count * 2 + index, count * 4 + 1, count * 3 + next, count * 3 + index, count * 4, index, next);
  }
  return part(name, "mesh", color, [0, 0, 0], [1, 1, 1], [0, 0, 0], { vertices, indices });
}

export const domesticExpansionBatchTenObjects: MasterPrototype[] = [
  { name: "高背侧翼五点束带儿童安全座", theme: "现代", itemType: "器物", build: () => {
    const side: [number, number][] = [[0.27, 0.13], [0.32, 0.22], [0.18, 0.42], [-0.04, 0.65], [-0.25, 0.91], [-0.34, 0.88], [-0.29, 0.38], [-0.1, 0.13]];
    const result: ModelPart[] = [box("承接座壳并带后卡扣的整块车座底架", [0, 0.07, 0], [0.43, 0.14, 0.5], material.dark), ...[-1, 1].map(value => plate("从下座承托到头侧的完整高侧翼硬壳", [value * 0.23, 0, 0], side, 0.045, material.ivory, [0, 90, 0])), hardPanel("两肩带槽真实贯通的后仰承重背壳", material.ivory, [[-0.215, -0.35], [0.215, -0.35], [0.215, 0.35], [-0.215, 0.35]], 0.045, [0, 0.55 + 0.0225 * Math.sin(12 * Math.PI / 180), 0.22 - 0.0225 * Math.cos(12 * Math.PI / 180)], [-0.075, 0.075].map(x => [[x - 0.018, -0.18], [x + 0.018, -0.18], [x + 0.018, -0.14], [x - 0.018, -0.14]]), [102, 0, 0]), box("与侧翼和底架相接的前低后高座垫", [0, 0.205, -0.08], [0.43, 0.1, 0.46], material.red, [-8, 0, 0]), box("中背实际贴住背壳的柔软承托垫", [0, 0.47, 0.18], [0.31, 0.31, 0.07], material.red, [12, 0, 0]), box("可见肩带槽上方的独立头枕垫", [0, 0.82, 0.3], [0.26, 0.15, 0.065], material.red, [12, 0, 0]), ...[-1, 1].map(value => ball("向前围护头部的两块独立软侧翼", [value * 0.15, 0.76, 0.24], [0.085, 0.22, 0.15], material.red)), ...[-1, 1].map(value => beam("分别由两肩带槽连向前扣的扁肩带", material.dark, [value * 0.075, 0.71, 0.28], [value * 0.05, 0.32, -0.14], 0.026, 0.0035)), ...[-1, 1].map(value => beam("左右独立的下腰部约束扁带", material.dark, [value * 0.225, 0.275, 0], [0, 0.275, -0.15], 0.026, 0.0035)), beam("由座前段连接中央扣的第五条扁带", material.dark, [0, 0.19, -0.25], [0, 0.275, -0.15], 0.029, 0.0035), box("五点带共同接合的独立扣座", [0, 0.285, -0.145], [0.055, 0.048, 0.025], material.dark), ...[-1, 1].map(value => box("底座后部伸出的两只车用短卡扣", [value * 0.15, 0.045, 0.29], [0.045, 0.035, 0.12], material.steel))];
    result.push(...[-1, 1].map(value => box("越过肩带槽外沿并接住肩带后端的真实压片", [value * 0.075, 0.71, 0.284], [0.075, 0.025, 0.025], material.steel)));
    return result;
  } },
  { name: "弧底后仰提篮式婴儿安全座", theme: "现代", itemType: "器物", build: () => {
    const loops: [Triple[], Triple[], Triple[], Triple[]] = [[], [], [], []];
    for (let index = 0; index < 16; index++) {
      const angle = index * Math.PI / 8, x = Math.cos(angle), z = Math.sin(angle);
      loops[0].push([x * 0.14, 0.055, z * 0.23]);
      loops[1].push([x * 0.23, 0.245 + (z + 1) * 0.0675, z * 0.37]);
      loops[2].push([x * 0.213, 0.24 + (z + 1) * 0.0675, z * 0.35]);
      loops[3].push([x * 0.13, 0.085 + (z + 1) * 0.02, z * 0.22]);
    }
    const result: ModelPart[] = [shellFromLoops("前低后高且内外连续的完整提篮承托壳", material.ivory, loops, [0, 0.055, 0], [0, 0.105, 0]), ...[-1, 1].map(value => tapered("提篮底部前后上弯的独立承重弧脚", material.dark, [[value * 0.13, 0.085, -0.27], [value * 0.13, 0.045, -0.12], [value * 0.13, 0.045, 0.12], [value * 0.13, 0.085, 0.27]], [0.012, 0.012, 0.012, 0.012])), ...[-1, 1].map(value => cylinder("长提梁在提篮两侧的真实转轴座", [value * 0.23, 0.285, 0], [0.065, 0.045, 0.065], material.dark, [0, 0, 90])), tapered("从两端转轴抬起的整根可握提梁", material.dark, [[-0.23, 0.285, 0], [-0.26, 0.55, 0], [-0.17, 0.69, 0], [0.17, 0.69, 0], [0.26, 0.55, 0], [0.23, 0.285, 0]], [0.02, 0.02, 0.02, 0.02, 0.02, 0.02]), ball("与提篮内地面接触的长下身软衬", [0, 0.14, -0.05], [0.26, 0.065, 0.46], material.glass), box("顺后壳升起且与下衬相接的后仰头肩垫", [0, 0.218, 0.205], [0.28, 0.065, 0.28], material.glass, [-35, 0, 0]), ...[-1, 1].map(value => beam("提篮内由肩部固定端接向中扣的扁带", material.dark, [value * 0.075, 0.326, 0.3], [0, 0.19, -0.06], 0.022, 0.003)), beam("前部座壳与中扣连接的胯间带", material.dark, [0, 0.12, -0.22], [0, 0.19, -0.06], 0.027, 0.003), box("提篮三向扁带相接的独立扣座", [0, 0.19, -0.06], [0.046, 0.035, 0.026], material.dark)];
    result.push(...[-1, 1].map(value => box("与提篮壳后肩坡实际相交的独立束带锚座", [value * 0.075, 0.326, 0.3], [0.05, 0.025, 0.035], material.dark)));
    return result;
  } },
  // 桌面上承臂、桌下独立压夹和悬兜共同承重；没有把木高脚餐椅去腿。
  // https://www.chiccousa.com/on/demandware.static/-/Sites-Chicco-Library/default/dw443eee94/manuals/hook-ons/chicco-fastlock-hook-on-chair-manual.pdf
  { name: "双C夹臂悬兜式婴儿餐椅", theme: "现代", itemType: "家具", build: () => {
    const result: ModelPart[] = [hardPanel("悬兜底部实际留有双腿口的软承座", material.red, [[-0.17, -0.16], [0.17, -0.16], [0.17, 0.16], [-0.17, 0.16]], 0.012, [0, 0.1, 0.065], [-0.075, 0.075].map(x => roundOutline(0.041, 0.063, 8).map(([px, pz]): [number, number] => [px + x, pz - 0.04]))), ...[-1, 1].map(value => box("从悬兜承座连到上臂的侧布片", [value * 0.17, 0.22, 0.065], [0.012, 0.24, 0.32], material.red)), box("与悬兜侧片相连的后靠软垫", [0, 0.26, 0.224], [0.35, 0.32, 0.028], material.red), ...[-1, 1].map(value => tapered("从座兜后部翻到桌面上的完整C夹上承臂", material.steel, [[value * 0.195, 0.13, 0.12], [value * 0.195, 0.34, 0.14], [value * 0.195, 0.35, -0.38]], [0.023, 0.023, 0.023])), ...[-1, 1].map(value => rod("桌下伸向压紧柱的独立锁夹下臂", [value * 0.195, 0.14, 0.12], [value * 0.195, 0.14, -0.26], 0.035, material.steel)), ...[-1, 1].map(value => cylinder("由下臂升起的夹紧螺柱", [value * 0.195, 0.207, -0.26], [0.014, 0.144, 0.014], material.steel)), ...[-1, 1].map(value => cylinder("桌面下方真正与螺柱相接的宽软压垫", [value * 0.195, 0.279, -0.26], [0.052, 0.024, 0.052], material.dark)), ...[-1, 1].map(value => box("桌面上方保护台面的长防滑握面", [value * 0.195, 0.35, -0.295], [0.055, 0.05, 0.18], material.dark)), ...[-1, 1].map(value => cylinder("下臂下方调节螺柱的独立旋钮", [value * 0.195, 0.126, -0.26], [0.045, 0.025, 0.045], material.dark)), beam("前横边与悬兜底之间的防滑出胯带", material.dark, [0, 0.11, 0.02], [0, 0.31, -0.09], 0.045, 0.006), rod("悬兜前边实际接住胯带的短横梁", [-0.17, 0.31, -0.09], [0.17, 0.31, -0.09], 0.025, material.dark)];
    return result;
  } },
  { name: "双A架刚臂电动婴儿摆椅", theme: "现代", itemType: "家具", build: () => {
    const result: ModelPart[] = [...[-1, 1].flatMap(x => [-1, 1].map(z => rod("两侧A架实际落地的四根长斜腿", [x * 0.34, 0.045, z * 0.42], [x * 0.34, 1.0, 0.03], 0.037))), ...[-1, 1].map(value => rod("A架前后独立防张跨地横梁", [-0.34, 0.045, value * 0.42], [0.34, 0.045, value * 0.42], 0.035)), ...[-1, 1].map(value => cylinder("A架顶部承轴与减速驱动圆盒", [value * 0.34, 1.0, 0.03], [0.16, 0.09, 0.16], material.ivory, [0, 0, 90])), ...[-1, 1].map(value => rod("由侧驱动盒悬下并实际接座框的刚性摆臂", [value * 0.34, 1.0, 0.03], [value * 0.24, 0.42, 0], 0.028, material.steel)), ...[-1, 1].map(value => tapered("摆椅前低后高的独立兜边承形框", material.ivory, [[value * 0.22, 0.29, -0.25], [value * 0.22, 0.42, 0], [value * 0.22, 0.65, 0.25]], [0.02, 0.02, 0.02])), box("以斜面承接躺姿身体的整幅软卧垫", [0, 0.458, 0], [0.43, 0.045, 0.55], material.glass, [-30, 0, 0]), rod("将左右兜框前缘真实连接的短横杆", [-0.22, 0.29, -0.25], [0.22, 0.29, -0.25], 0.025), ball("后上端与卧垫和兜框都相接的柔软头托", [0, 0.61, 0.22], [0.31, 0.06, 0.16], material.ivory), ...[-1, 1].map(value => beam("从兜边连向前中扣的真实肩腰扁带", material.dark, [value * 0.19, 0.46, 0.04], [0, 0.4, -0.11], 0.023, 0.003)), beam("座前沿至中扣的独立胯间扁带", material.dark, [0, 0.32, -0.23], [0, 0.4, -0.11], 0.03, 0.003), box("空座状态仍相扣的三向扣座", [0, 0.4, -0.11], [0.045, 0.035, 0.024], material.dark)];
    return result;
  } },
  // 仅借鉴立架、覆簧与悬坐承托的布置，不带任何玩具盘或品牌形象。
  // https://m.service.mattel.com/us/Technical/productDetail?prodno=K6070&siteid=27
  { name: "三高架悬簧婴儿学跳座", theme: "现代", itemType: "设施", build: () => {
    const result: ModelPart[] = [ring("固定落地而不设行走脚轮的宽外底框", material.ivory, 0.55, 0.028, 0.035, 0.04), ring("由悬簧支承的独立上坐环", material.ivory, 0.24, 0.045, 0.53, 0.035), hardPanel("悬坐软兜底部真正开放的双腿孔", material.glass, roundOutline(0.175, 0.145), 0.012, [0, 0.37, 0], [-0.075, 0.075].map(x => roundOutline(0.041, 0.065, 8).map(([px, pz]): [number, number] => [px + x, pz]))), ...[-1, 1].flatMap(x => [-1, 1].map(z => beam("由坐环真实悬住腿孔软兜的四条宽布带", material.glass, [x * 0.2, 0.53, z * 0.12], [x * 0.15, 0.382, z * 0.07], 0.04, 0.004)))];
    for (let index = 0; index < 3; index++) {
      const angle = index * Math.PI * 2 / 3, x = Math.cos(angle) * 0.25, z = Math.sin(angle) * 0.25;
      result.push(rod("从外底框升到上簧座的独立长立架", [Math.cos(angle) * 0.53, 0.035, Math.sin(angle) * 0.53], [Math.cos(angle) * 0.42, 0.82, Math.sin(angle) * 0.42], 0.036), rod("立架上方向内接住覆簧的短悬臂", [Math.cos(angle) * 0.42, 0.82, Math.sin(angle) * 0.42], [x + 0.016, 0.81, z], 0.027), tapered("真实盘绕并承接上下端的悬吊弹簧", material.steel, Array.from({ length: 49 }, (_, step): Triple => [x + Math.cos(step * Math.PI / 6) * 0.016, 0.61 + step / 48 * 0.2, z + Math.sin(step * Math.PI / 6) * 0.016]), Array(49).fill(0.003)), { ...ring("悬簧外不封死下端行程的柔性保护套", material.glass, 0.023, 0.003, 0.71, 0.2, { position: { x, y: 0.71, z } }), opacity: 0.4 }, beam("从悬簧下端接住坐环的实际短吊带", material.dark, [x + 0.016, 0.61, z], [Math.cos(angle) * 0.24, 0.55, Math.sin(angle) * 0.24], 0.022, 0.004));
    }
    return result;
  } },
  { name: "前后分区人体承托婴儿浴盆", theme: "现代", itemType: "器物", build: () => {
    const outline: [number, number][] = [[-0.21, -0.34], [-0.13, -0.43], [0.13, -0.43], [0.21, -0.34], [0.23, -0.12], [0.21, 0.23], [0.15, 0.36], [0, 0.4], [-0.15, 0.36], [-0.21, 0.23], [-0.23, -0.12]];
    const loops: [Triple[], Triple[], Triple[], Triple[]] = [[], [], [], []];
    for (const [x, z] of outline) { loops[0].push([x * 0.62, 0.025, z * 0.64]); loops[1].push([x, 0.225 + Math.max(0, z) * 0.1, z]); loops[2].push([x * 0.925, 0.223 + Math.max(0, z) * 0.1, z * 0.945]); loops[3].push([x * 0.55, 0.052 + Math.max(0, z) * 0.07, z * 0.58]); }
    return [shellFromLoops("非回转异形外沿与内腔连续成型的浴盆主体", material.ivory, loops, [0, 0.025, 0], [0, 0.077, 0]), box("后区顺躺姿升起而根部连到盆底的承背坡台", [0, 0.123, 0.105], [0.22, 0.06, 0.26], material.glass, [-27, 0, 0]), ball("与盆底连成承托结构的中央防滑出鞍脊", [0, 0.09, -0.055], [0.085, 0.11, 0.13], material.ivory), ...[-1, 1].map(value => box("较低足端两侧的短腿托肩", [value * 0.095, 0.082, -0.17], [0.055, 0.06, 0.16], material.ivory)), ...[-1, 1].map(value => box("异形盆底下方实际接地的短防滑托脚", [value * 0.115, 0.016, 0], [0.055, 0.032, 0.35], material.dark))];
  } },
  { name: "吸盘旋座前弧护栏婴儿浴椅", theme: "现代", itemType: "器物", build: () => {
    const result: ModelPart[] = [cylinder("安装在盆底的低位圆承盘", [0, 0.0225, 0], [0.33, 0.025, 0.33], material.ivory), ring("上下座盘之间的独立转座环", material.steel, 0.13, 0.018, 0.035, 0.015), cylinder("由下承盘托住的可转上座盘", [0, 0.06, 0], [0.28, 0.045, 0.28], material.ivory), hardPanel("三排水槽真实贯通的婴儿浴椅坐面", material.ivory, roundOutline(0.16, 0.15), 0.025, [0, 0.08, 0], [-0.08, 0, 0.08].map(x => [[x - 0.008, -0.05], [x + 0.008, -0.05], [x + 0.008, 0.05], [x - 0.008, 0.05]])), hardPanel("向后微倾并实际接到坐面的宽靠背", material.ivory, [[-0.14, 0.15], [0.14, 0.15], [0.12, -0.15], [-0.12, -0.15]], 0.02, [0, 0.25, 0.12], [], [100, 0, 0]), tapered("前方围护但让双腿分侧伸出的连续弧栏", material.glass, [[-0.17, 0.26, 0.05], [-0.17, 0.26, -0.12], [-0.08, 0.26, -0.19], [0.08, 0.26, -0.19], [0.17, 0.26, -0.12], [0.17, 0.26, 0.05]], Array(6).fill(0.019)), ...[-1, 1].map(value => rod("把前弧栏两端接回座面的独立侧支柱", [value * 0.14, 0.1, 0.08], [value * 0.17, 0.26, 0.05], 0.025)), rod("坐面到前弧栏中部的独立胯间护柱", [0, 0.1, -0.1], [0, 0.26, -0.19], 0.035, material.ivory), ...[-1, 1].flatMap(x => [-1, 1].map(z => ({ ...cup("朝下开放且接住下承盘的独立软吸盘", [0, 0, 0], 0.04, 0.025, material.dark), position: { x: x * 0.13, y: 0.025, z: z * 0.12 }, rotation: { x: 180, y: 0, z: 0 } })))];
    return result;
  } },
  // 开腿载兜、儿童背靠、成人背负层和可落地撑脚共同组成完整载架，而非给旧背包加一顶篷。
  // https://www.osprey.com/pocotm-child-carrier
  { name: "开腿坐兜撑脚式徒步婴儿载架", theme: "现代", itemType: "器物", build: () => {
    const result: ModelPart[] = [...[-1, 1].map(value => rod("从底脚升到儿童载兜上缘的完整背负外框", [value * 0.18, 0.03, 0.1], [value * 0.18, 0.74, 0.1], 0.022)), rod("外框下端实际接地的承重横脚", [-0.18, 0.03, 0.1], [0.18, 0.03, 0.1], 0.027), box("朝向成人背部的长缓冲承压垫", [0, 0.36, 0.135], [0.29, 0.52, 0.045], material.dark), ring("完整围住儿童上身的椭圆软包承形框", material.red, 0.2, 0.03, 0.65, 0.025, { position: { x: 0, y: 0.65, z: -0.03 }, scale: { x: 1, y: 1, z: 0.8 } }), hardPanel("载兜底部真实贯通的双腿分口", material.glass, [[-0.14, -0.13], [0.14, -0.13], [0.14, 0.13], [-0.14, 0.13]], 0.012, [0, 0.43, 0], [-0.07, 0.07].map(x => roundOutline(0.04, 0.06, 8).map(([px, pz]): [number, number] => [px + x, pz + 0.025]))), ...[-1, 1].map(value => box("儿童载兜两侧从底面接到上框的软护片", [value * 0.14, 0.54, -0.03], [0.012, 0.2, 0.26], material.glass)), box("儿童身后与侧护片连接的独立靠垫", [0, 0.6, -0.165], [0.31, 0.28, 0.04], material.glass), ...[-1, 1].flatMap(x => [-1, 1].map(z => beam("底兜四角与上围框之间实际承重的宽织带", material.dark, [x * 0.12, 0.442, z > 0 ? 0.07 : -0.09], [x * 0.17, 0.65, z > 0 ? 0.025 : -0.09], 0.028, 0.004))), ...[-1, 1].map(value => tapered("成人肩部可穿入的连续回弯背负带", material.dark, [[value * 0.12, 0.61, 0.16], [value * 0.16, 0.48, 0.26], [value * 0.15, 0.24, 0.27], [value * 0.12, 0.13, 0.16]], [0.025, 0.028, 0.028, 0.025])), ...[-1, 1].map(value => tapered("成人腰侧围拢到前扣的独立软腰翼", material.dark, [[value * 0.16, 0.15, 0.15], [value * 0.25, 0.14, 0.23], [value * 0.04, 0.15, 0.32]], [0.028, 0.034, 0.025])), box("两腰翼前端实际相接的独立扣盒", [0, 0.15, 0.32], [0.055, 0.04, 0.025], material.red), ...[-1, 1].map(value => rod("放置地面时展开的两根独立后撑脚", [value * 0.18, 0.58, 0.1], [value * 0.2, 0.025, -0.24], 0.023)), rod("两根后撑脚间的宽落地横杆", [-0.2, 0.025, -0.24], [0.2, 0.025, -0.24], 0.023), ...[-1, 1].map(value => cylinder("后撑脚与背负外框实际相接的独立转轴", [value * 0.18, 0.58, 0.1], [0.065, 0.04, 0.065], material.steel, [0, 0, 90]))];
    result.push(...[0.13, 0.61].map(y => rod("穿接背负外框并托住成人背垫的真实横梁", [-0.18, y, 0.104], [0.18, y, 0.104], 0.022, material.steel)), ...[-1, 1].map(value => rod("外框与儿童载兜上环之间的刚性短承臂", [value * 0.18, 0.65, 0.1], [value * 0.16, 0.65, 0.03], 0.025, material.steel)));
    return result;
  } },
];
