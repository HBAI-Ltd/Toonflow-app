import { part, type ModelPart, type Triple } from "../assetModelParts";
import { sweptProfile } from "../masterNature/shared";
import { box, cylinder, loop, rod, cord, piercedPanel, material, type MasterPrototype } from "./parts";
import { cabinetShell } from "./electronicExpansionBatchTwo";
import { mobileBase } from "./electronicExpansionBatchFour";

function airArm(name: string, start: Triple, end: Triple): ModelPart {
  const axis = rod(name, start, end, .07), half = axis.scale.y / 2;
  return part(name, "lathe", material.steel, [axis.position.x, axis.position.y, axis.position.z], [1, 1, 1], [axis.rotation.x, axis.rotation.y, axis.rotation.z], { profile: [{ x: .027, y: -half }, { x: .035, y: -half }, { x: .035, y: half }, { x: .027, y: half }, { x: .027, y: -half }] });
}

export const electronicExpansionBatchNineObjects: MasterPrototype[] = [
  // https://www.bertec.com/clinical
  { name: "动态姿态平衡评估舱", theme: "现代", itemType: "设施", build: () => {
    const surround = sweptProfile("保留前入口的连续环抱式视觉屏", material.ivory, [[.99, 0], [1.025, 0], [1.025, 1.73], [.99, 1.73]], Math.PI * 1.3, 24); surround.position = { x: 0, y: .26, z: .0 }; surround.rotation.y = 27;
    return [box("整座平衡评估舱连续接地的低机台", [0, .065, .05], [2.15, .13, 1.94], material.dark), box("动态测力台下的独立行进承座", [0, .175, -.08], [.92, .09, .88], material.steel), ...[-1, 1].map(side => cylinder("运动平台两侧真正的倾转轴承", [side * .44, .247, -.08], [.11, .08, .11], material.dark, [0, 0, 90])),
      box("可倾转且与视觉屏独立的实际双脚平台", [0, .285, -.08], [.83, .065, .73], material.steel, [3, 0, 0]), ...[-1, 1].map(side => box("供左右脚分别施力的独立测力踏板", [side * .205, .326, -.08], [.39, .025, .67], material.dark, [3, 0, 0])),
      surround, ...[-1, 1].map(side => box("从整机低台支承视觉屏的两根背立柱", [side * .78, 1.04, .68], [.08, 1.82, .1], material.steel)), ...[-1, 1].map(side => rod("保证站立使用者防坠的独立门架立柱", [side * .78, .13, -.24], [side * .78, 2.2, -.24], .06)), rod("防坠门架顶部完整横向承梁", [-.78, 2.2, -.24], [.78, 2.2, -.24], .065),
      ...[-1, 1].map(side => cord("从门架顶端垂到承重腰环的防坠带", [[side * .12, 2.2, -.24], [side * .12, 1.68, -.17], [side * .14, 1.32, -.08]], .014, material.wood)), loop("站立工作区内保持真实中空的承重腰环", [0, 1.32, -.08], .19, .019, [0, 0, 0], material.dark),
      rod("从门架伸到操作者控制面的独立短臂", [.78, 1.12, -.24], [1.1, 1.12, -.24], .035), box("与机架相连的侧方控制屏", [1.1, 1.24, -.24], [.3, .27, .055], material.glass)];
  } },
  // 密闭腰封舱使用正差压承担部分体重，不把此机构误画成抽真空吸住人。
  // https://alterg.com/
  { name: "腰封差压减重步行机", theme: "现代", itemType: "设施", build: () => {
    const sections: [number, number, number][] = [[.17, .48, .75], [.74, .51, .78], [.99, .31, .38], [1.08, .205, .25], [1.072, .197, .242], [.984, .302, .372], [.74, .502, .772], [.17, .472, .742]], vertices: NonNullable<ModelPart["vertices"]> = [], indices: number[] = [];
    for (const [y, rx, rz] of sections) for (let i = 0; i < 20; i++) { const a = i * Math.PI / 10; vertices.push({ x: Math.cos(a) * rx, y, z: Math.sin(a) * rz }); }
    for (let row = 0; row < sections.length; row++) for (let i = 0; i < 20; i++) { const a = row * 20 + i, b = row * 20 + (i + 1) % 20, c = ((row + 1) % sections.length) * 20 + i, d = ((row + 1) % sections.length) * 20 + (i + 1) % 20; indices.push(a, c, d, a, d, b); }
    return [box("差压步行机完整落地的长底座", [0, .085, 0], [1.08, .17, 1.72], material.dark), ...[-1, 1].map(side => box("把跑带辊轴实际支承到密封机床的长侧座", [side * .35, .203, 0], [.07, .066, 1.45], material.steel)), ...[-1, 1].map(end => cylinder("密闭舱底部真实的跑带回转长辊", [0, .228, end * .62], [.095, .66, .095], material.steel, [0, 0, 90])), box("密闭舱内真正连续的上跑带", [0, .278, 0], [.62, .005, 1.24], material.dark),
      { ...part("从带床到腰封真正连续且留上口的双壁压力软舱", "mesh", material.ivory, [0, 0, 0], [1, 1, 1], [0, 0, 0], { vertices, indices }), opacity: .48 }, part("上口真正贯通且与腰部套接的柔软密封环", "lathe", material.dark, [0, 1.065, 0], [1, 1, 1.2195], [0, 0, 0], { profile: [{ x: .189, y: 0 }, { x: .22, y: 0 }, { x: .22, y: .028 }, { x: .189, y: .028 }, { x: .189, y: 0 }] }),
      ...[-1, 1].flatMap(side => [rod("腰封外侧实际从机床升起的扶手立柱", [side * .49, .17, -.2], [side * .49, 1.05, -.2], .035), rod("供使用者握持的独立前后扶手", [side * .49, 1.05, -.4], [side * .49, 1.05, .32], .033, material.steel)]),
      box("后方送风机舱实际落到地面的矮承台", [0, .0425, .95], [.62, .085, .26], material.dark), box("后方保持整机差压的独立送风机舱", [0, .38, .95], [.62, .59, .26], material.ivory), cord("从送风舱到下体密闭舱的实际密封送风管", [[0, .48, .82], [0, .45, .75], [0, .45, .7]], .055, material.dark), rod("从后方风机舱升起的控制屏安装杆", [0, .675, .95], [0, 1.28, .95], .035), box("位于使用者前方的实际控制屏", [0, 1.35, .91], [.43, .24, .06], material.dark)];
  } },
  // https://www.hydroworx.com/wp-content/uploads/2025/12/HW-ECO-Product-Sheet-V6.pdf
  { name: "独立水下康复步行箱", theme: "现代", itemType: "设施", build: () => [
    box("水下步行箱实际封闭并接地的宽底床", [0, .1, 0], [1.19, .2, 2.2], material.dark), ...[-1, 1].map(side => ({ ...box("箱体两侧完整的透明水密厚壁", [side * .56, .9, 0], [.045, 1.4, 2.1], material.glass), opacity: .24 })), piercedPanel("循环喷嘴内膛真正贯穿的后方密封壁", [0, .2, 1.05], [[-.575, 0], [.575, 0], [.575, 1.4], [-.575, 1.4]], [-1, 1].map(side => Array.from({ length: 24 }, (_, i): [number, number] => [side * .3 + Math.cos(-i * Math.PI / 12) * .022, .48 + Math.sin(-i * Math.PI / 12) * .022])), .03, material.ivory, [-90, 0, 0]),
    piercedPanel("前方水密入门的真正完整厚框", [0, .2, -1.05], [[-.595, 0], [.595, 0], [.595, 1.4], [-.595, 1.4]], [[[-.47, .02], [-.47, 1.29], [.47, 1.29], [.47, .02]]], .04, material.steel, [-90, 0, 0]), { ...box("可封住前框实际入门口的透明厚门", [0, .855, -1.085], [.97, 1.29, .024], material.glass), opacity: .25 }, ...[.45, 1.18].map(y => cylinder("前门左缘实际固定到门框的水密铰链", [-.5, y, -1.08], [.055, .12, .055], material.steel)), rod("前门右侧实际的长锁紧手柄", [.4, .74, -1.12], [.4, 1.0, -1.12], .025, material.steel), ...[.74, 1.0].map(y => rod("门把手两端实际固定回透明厚门的短支耳", [.4, y, -1.09], [.4, y, -1.12], .018)),
    ...[-1, 1].flatMap(end => [cylinder("水下连续跑带两端真实的回转辊", [0, .27, end * .7], [.12, .69, .12], material.dark, [0, 0, 90]), ...[-1, 1].map(side => box("跑带辊两端真实接回箱底的轴承短座", [side * .36, .245, end * .7], [.07, .09, .11], material.steel))]), box("可以在水中运动的实际上层步行带", [0, .332, 0], [.65, .004, 1.4], material.dark), box("步行带下方实际回程的连续带面", [0, .208, 0], [.65, .004, 1.4], material.dark),
    { ...box("箱内独立可见的水面", [0, 1.09, 0], [1.07, .009, 2.01], material.glass), opacity: .48 }, ...[-1, 1].flatMap(side => [rod("箱内供步行者实际扶持的侧扶手", [side * .43, 1.3, -.83], [side * .43, 1.3, .85], .032, material.steel), ...[-.83, .85].map(z => rod("侧扶手实际回接箱沿的独立短支座", [side * .43, 1.3, z], [side * .555, 1.3, z], .025))]),
    ...[-1, 1].map(side => part("后壁真正开口的循环水喷嘴", "lathe", material.steel, [side * .3, .68, 1.0], [1, 1, 1], [90, 0, 0], { profile: [{ x: .022, y: -.05 }, { x: .035, y: -.05 }, { x: .035, y: .05 }, { x: .022, y: .05 }, { x: .022, y: -.05 }] })), box("箱后实际接地的循环水泵机组", [0, .35, 1.35], [.64, .7, .47], material.dark), ...[-1, 1].map(side => cord("外置循环机组真实接入后壁的密封供回管", [[side * .2, .5, 1.35], [side * .3, .55, 1.2], [side * .3, .68, 1.05]], .035, material.steel)),
  ] },
  // https://www.imes-icore.com/d67-en/dental/Brochure/coritec-250i-pro-plus-brochure-en.pdf
  { name: "五轴义齿湿式铣削机", theme: "现代", itemType: "设施", build: () => [
    ...cabinetShell(.68, .65, .62), box("湿式加工腔底部实际的液体收集托盘", [0, .0725, 0], [.59, .045, .5], material.steel), ...[-1, 1].map(side => rod("加工头独立的垂直Z向导轨", [side * .22, .095, .14], [side * .22, .59, .14], .022)), box("跨过材料坯上方的实际XY移动横梁", [0, .52, .13], [.53, .09, .12], material.dark),
    rod("主轴滑车在横梁上行进的真实水平杆", [-.24, .52, .055], [.24, .52, .055], .018), box("沿水平杆进给的独立主轴滑车", [.07, .49, .055], [.11, .1, .12], material.steel), cylinder("朝材料坯独立进给的实际铣削电主轴", [.07, .414, .0], [.055, .12, .055], material.dark), rod("主轴末端实际的细长切削刀具", [.07, .354, .0], [.07, .317, .0], .004, material.steel),
    box("后轴驱动单元实际固定回下机床的立座", [0, .2, .2], [.17, .24, .12], material.dark), cylinder("夹料框绕前后轴摆动的真实B轴座", [0, .29, .13], [.15, .13, .15], material.steel, [90, 0, 0]), ...[-1, 1].flatMap(side => [rod("B轴夹料框连接两侧A轴承的真实弯叉", [0, .29, .13], [side * .13, .29, .0], .025), cylinder("夹料环两端真实的A轴短轴承", [side * .13, .29, .0], [.05, .05, .05], material.dark, [0, 0, 90])]),
    part("能从侧轴旋转且保留夹料孔的真实环框", "lathe", material.steel, [0, .29, .0], [1, 1, 1], [0, 0, 90], { profile: [{ x: .046, y: -.017 }, { x: .062, y: -.017 }, { x: .062, y: .017 }, { x: .046, y: .017 }, { x: .046, y: -.017 }] }), cylinder("夹料环中用于加工的实际义齿材料圆坯", [0, .29, .0], [.1, .021, .1], material.ivory, [0, 0, 90]), rod("A轴实际穿入夹料环的驱动接轴", [-.13, .29, .0], [.13, .29, .0], .012),
    cord("从湿室侧方接近刀具的实际冷却液软管", [[.325, .4, .18], [.2, .46, .08], [.07, .35, .04]], .008, material.wood), { ...box("封住湿加工区域且可观察材料坯的前门", [0, .36, -.3125], [.65, .54, .015], material.glass), opacity: .22 }, box("低前沿实际的加工操作程序窗", [0, .072, -.32], [.29, .077, .02], material.dark),
  ] },
  // https://www.adsdental.com/uploads/file/eos-instructions-for-use-and-installation-version-2-0605.pdf
  { name: "口外关节臂吸雾净化机", theme: "现代", itemType: "设施", build: () => {
    const joints: Triple[] = [[0, .99, .03], [.18, 1.4, .05], [.38, 1.6, -.14], [.56, 1.41, -.32]], result: ModelPart[] = [...mobileBase(.47, .52), ...cabinetShell(.4, .58, .44, .23), cylinder("从过滤机柜上方伸出的独立抽气回转柱", [0, .9, .03], [.105, .18, .105], material.dark), piercedPanel("机柜前方滤芯门上真正分开的进排气槽", [0, .23, -.22], [[-.2, 0], [.2, 0], [.2, .58], [-.2, .58]], Array.from({ length: 6 }, (_, i): [number, number][] => [[-.125, .035 + i * .055], [-.125, .057 + i * .055], [.125, .057 + i * .055], [.125, .035 + i * .055]]), .015, material.steel, [-90, 0, 0]), box("位于通风门内侧可看见的实际过滤介质面", [0, .52, -.18], [.33, .5, .02], material.ivory)];
    for (let i = 0; i < joints.length - 1; i++) result.push(airArm("承重且内部真正贯通的关节抽气硬臂", joints[i]!, joints[i + 1]!), cylinder("抽气关节旁控制俯仰松紧的真实大旋钮", joints[i]!, [.095, .055, .095], material.dark, [0, 0, 90]));
    const axis = airArm("捕集罩末端的真实接管方向", joints[2]!, joints[3]!);
    result.push({ ...part("靠近口外且真正开口的透明捕集大罩", "lathe", material.glass, joints[3]!, [1, 1, 1], [axis.rotation.x, axis.rotation.y, axis.rotation.z], { profile: [{ x: .027, y: 0 }, { x: .035, y: 0 }, { x: .055, y: .05 }, { x: .16, y: .15 }, { x: .16, y: .16 }, { x: .048, y: .057 }, { x: .027, y: 0 }] }), opacity: .24 }, box("机柜上缘实际的吸雾强度操作窗", [0, .77, -.229], [.2, .06, .018], material.dark));
    return result;
  } },
  // 只表现可搬运保存整机的保育腔、支承和回路，未加入生理仿真。
  // https://www.fda.gov/media/147298/download
  { name: "离体心脏常温灌注保存机", theme: "现代", itemType: "设施", build: () => [
    ...mobileBase(.76, .84), ...cabinetShell(.7, .64, .73, .23), box("与下部控制舱连续连接的完整上承台", [0, .9, 0], [.76, .06, .79], material.steel), box("独立保育模块底部可取出的密封承盘", [0, .9425, .0], [.45, .025, .46], material.ivory), ...[-1, 1].map(side => ({ ...box("保育腔左右真实独立的透明壁", [side * .219, 1.05, .0], [.012, .2, .46], material.glass), opacity: .24 })), ...[-1, 1].map(end => ({ ...box("保育腔前后真实独立的透明壁", [0, 1.05, end * .224], [.45, .2, .012], material.glass), opacity: .24 })), { ...box("可密封到保育腔上沿的透明完整上盖", [0, 1.156, 0], [.46, .012, .47], material.glass), opacity: .24 },
    ...[-1, 1].map(side => rod("保育模块内真正分开的器官承托斜架", [side * .16, .955, .12], [side * .09, 1.015, -.09], .012, material.steel)), ...[-1, 1].map(side => cylinder("从上沿连到保育回路的独立密封接口", [side * .14, 1.15, side * .12], [.035, .055, .035], material.dark)),
    cylinder("模块前方实际装在机台上的搏动灌注泵头", [0, .992, -.29], [.15, .045, .15], material.dark, [90, 0, 0]), cylinder("左后方实际装在承台的膜式供氧筒", [-.24, 1.045, .19], [.125, .23, .125], material.steel), box("右后方实际的灌注液加温交换盒", [.24, 1.04, .19], [.16, .22, .2], material.dark),
    cord("泵头经过供氧筒进入保育模块的独立灌注回路", [[0, .992, -.315], [-.28, 1.08, -.29], [-.3, 1.14, .19], [-.14, 1.15, -.12]], .013, material.red), cord("保育模块经加温盒返回泵头的独立回路", [[.14, 1.15, .12], [.24, 1.15, .19], [.3, 1.03, -.1], [0, .992, -.315]], .013, material.wood),
    rod("下机柜后方实际升起的监控屏立柱", [0, .93, .32], [0, 1.47, .32], .035), rod("监控屏立柱到屏背的短接颈", [0, 1.42, .32], [0, 1.42, .26], .025), box("机后上方完整的灌注参数监控屏", [0, 1.45, .26], [.45, .29, .06], material.dark), ...[-1, 1].flatMap(side => [rod("机台两侧实际可握持的推行把手", [side * .36, 1.03, .27], [side * .36, 1.03, -.18], .023, material.steel), ...[-.18, .27].map(z => rod("推行把手两端实际装接回上承台的立耳", [side * .36, .93, z], [side * .36, 1.03, z], .02))]),
  ] },
];
