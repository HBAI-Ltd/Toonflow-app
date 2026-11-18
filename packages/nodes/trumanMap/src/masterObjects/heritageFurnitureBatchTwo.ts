import { part, type ModelPart } from "../assetModelParts";
import { helicalFlight } from "../masterTransport/parts";
import { polygon } from "../masterNature/shared";
import { box, cylinder, rod, cord, plate, loop, ball, piercedPanel, bars, material, type MasterPrototype } from "./parts";

// 传统大型家具采用实际不同的承载空间及开合构造；未完成25项前不登记目录。
// 结构类型参考：https://www.metmuseum.org/art/collection/search/205595 （court cupboard）
// https://www.museum.go.kr/MUSEUM/contents/M0502000000.do?relicId=2316&schM=view&searchId=search （bandaji）
// https://www.gardnermuseum.org/experience/collection/11898 （压布家具）

export const heritageFurnitureBatchTwoObjects: MasterPrototype[] = [
  { name: "带廊步入式拔步床", theme: "中式", itemType: "家具", build: () => {
    const parts: ModelPart[] = [box("跨越床身和外廊的通底台座", [0, .17, 0], [2.14, .26, 3.13], material.wood), box("卧床内部承榻", [0, .51, .39], [1.87, .15, 1.99], material.wood), box("薄褥", [0, .63, .39], [1.74, .09, 1.87], material.ivory), box("前廊低位行步平台", [0, .35, -1.11], [1.99, .1, .72], material.wood), box("廊前落地一级踏步", [0, .055, -1.7], [.77, .11, .32], material.wood), box("上层满顶承尘板", [0, 2.15, 0], [2.14, .075, 3.13], material.wood), box("床后连贯围板", [0, 1.01, 1.43], [1.98, .91, .04], material.wood)];
    for (const x of [-1, 1]) for (const z of [-1.43, -.58, 1.43]) parts.push(box("廊和床之间分层承重柱", [x * .99, 1.23, z], [.075, 1.86, .075], material.wood));
    for (const x of [-1, 1]) parts.push(box("床身侧围板", [x * .96, .96, .43], [.05, .8, 1.94], material.wood), box("通廊纵向顶枋", [x * .99, 2.04, 0], [.08, .16, 2.93], material.wood), rod("前廊两侧低扶栏", [x * .99, .91, -1.43], [x * .99, .91, -.58], .04, material.wood));
    for (const z of [-1.43, -.58, 1.43]) parts.push(box("柱间横向挂落上枋", [0, 1.99, z], [2.04, .2, .075], material.wood));
    for (const x of [-1, 1]) for (const z of [-1.2, -.98, -.76]) parts.push(rod("前廊侧低栏竖棂", [x * .99, .4, z], [x * .99, .91, z], .025, material.wood));
    for (const x of [-1, 1]) parts.push(box("内床门口半幅幔", [x * .68, 1.39, -.57], [.57, 1.2, .008], material.ivory));
    return parts;
  } },
  { name: "八足双台座马扎兰书桌", theme: "欧式", itemType: "家具", build: () => {
    const parts = [box("整幅写字面", [0, .81, 0], [1.44, .055, .73], material.wood), box("中部短抽斗面", [0, .71, -.32], [.42, .11, .03], material.wood), box("后部凹入膝位壁", [0, .6375, .25], [.43, .315, .035], material.wood)];
    parts.push(box("中部抽斗的独立内底", [0, .661, -.11], [.43, .014, .41], material.wood), box("中部抽斗的短后壁", [0, .71, .089], [.43, .1, .014], material.wood), ...[-1, 1].map(s => box("中部抽斗薄侧壁", [s * .205, .71, -.11], [.014, .1, .41], material.wood)), ...[-1, 1].map(s => box("中部抽斗接回双台座的承屉轨", [s * .24, .648, -.11], [.07, .025, .41], material.wood)));
    for (const s of [-1, 1]) {
      for (const x of [-.17, .17]) for (const z of [-.24, .24]) parts.push(part("八足收腰转木腿", "lathe", material.wood, [s * .47 + x, .025, z], [1, 1, 1], [0, 0, 0], { profile: [{ x: 0, y: 0 }, { x: .032, y: 0 }, { x: .025, y: .08 }, { x: .052, y: .18 }, { x: .031, y: .28 }, { x: .043, y: .39 }, { x: .032, y: .46 }, { x: 0, y: .46 }] }));
      parts.push(box("桌侧独立抽斗座", [s * .47, .6225, 0], [.43, .335, .62], material.wood));
      for (const y of [.525, .625, .725]) parts.push(box("侧座小抽斗前脸", [s * .47, y, -.323], [.37, .082, .022], material.wood), loop("小抽斗提环", [s * .47, y, -.345], .018, .004, [90, 0, 0]));
      parts.push(rod("同侧四足的对角拉撑", [s * .47 - .17, .13, -.24], [s * .47 + .17, .13, .24], .025, material.wood), rod("同侧反向对角拉撑", [s * .47 + .17, .13, -.24], [s * .47 - .17, .13, .24], .025, material.wood));
    }
    return parts;
  } },
  { name: "螺杆压板布草柜", theme: "欧式", itemType: "家具", build: () => {
    const parts = [box("布草压机整柜底座", [0, .075, 0], [.96, .15, .65], material.wood), ...[-1, 1].map(s => box("贯通压台上下的厚门柱", [s * .4, 1.14, 0], [.1, 2.12, .48], material.wood)), box("压台固定下床", [0, .85, 0], [.83, .09, .55], material.wood), box("压机承受螺杆反力的上梁", [0, 2.14, 0], [.95, .12, .58], material.wood), box("螺杆下方独立活动压板", [0, 1.28, 0], [.71, .1, .49], material.wood), cylinder("带螺旋牙的中心实轴", [0, 1.77, 0], [.045, 1.04, .045], material.wood), helicalFlight([0, 1.32, 0], .022, .034, .88, 9, 1, .004), rod("旋紧螺杆的长横握杆", [-.36, 2.29, 0], [.36, 2.29, 0], .035, material.wood), cylinder("握杆中心轴头", [0, 2.26, 0], [.07, .18, .07], material.wood), box("下柜中空底板", [0, .17, 0], [.77, .025, .55], material.wood), box("下柜后板", [0, .49, .2525], [.77, .61, .045], material.wood), ...[-1, 1].flatMap(s => [.27, .7].map(y => cylinder("压布柜下门实接厚柱的短合页", [s * .36, y, -.252], [.03, .07, .03], material.dark))), ...[-1, 1].map(s => box("下柜双开门", [s * .19, .49, -.28], [.355, .59, .03], material.wood)), ...[-1, 1].map(s => loop("下柜门环", [s * .055, .5, -.305], .022, .005, [90, 0, 0])), box("被压平的叠布", [0, 1.065, 0], [.61, .33, .41], material.ivory)];
    return parts;
  } },
  { name: "上罩柱廊餐器柜", theme: "欧式", itemType: "家具", build: () => {
    const parts = [box("餐器柜厚底台", [0, .11, 0], [1.28, .22, .53], material.wood), ...[-1, 1].map(s => box("下柜两侧壁", [s * .585, .54, 0], [.055, .66, .48], material.wood)), box("下柜后板", [0, .54, .215], [1.13, .65, .03], material.wood), ...[-1, 1].map(s => box("下柜双门", [s * .285, .55, -.24], [.54, .62, .04], material.wood)), box("突出柜体的备餐大台面", [0, .91, -.015], [1.36, .08, .64], material.wood), box("上罩中央内收柜背", [0, 1.47, .2], [.76, .88, .035], material.wood), ...[-1, 1].map(s => box("内收上柜侧壁", [s * .385, 1.5, .04], [.035, .82, .37], material.wood)), ...[1.1, 1.89].map(y => box("上柜上下层底", [0, y, .04], [.8, .05, .37], material.wood)), ...[1.28, 1.72].map(y => cylinder("上柜独门实接左侧壁的短合页", [-.36, y, -.15], [.026, .075, .026], material.dark)), box("上柜中央独门", [0, 1.5, -.155], [.71, .72, .035], material.wood), box("整体上罩宽檐", [0, 1.98, 0], [1.36, .13, .62], material.wood)];
    for (const s of [-1, 1]) parts.push(...[.39, .72].map(y => cylinder("餐器柜下门实接侧壁的合页筒", [s * .56, y, -.235], [.026, .075, .026], material.dark)), box("备餐面与内收上柜之间的后承柱", [s * .37, 1.015, .205], [.06, .18, .065], material.wood), part("上罩前方独立转木廊柱", "lathe", material.wood, [s * .56, .95, -.22], [1, 1, 1], [0, 0, 0], { profile: [{ x: 0, y: 0 }, { x: .05, y: 0 }, { x: .038, y: .13 }, { x: .06, y: .27 }, { x: .037, y: .48 }, { x: .048, y: .68 }, { x: .045, y: .99 }, { x: 0, y: .99 }] }), loop("柜门铁环", [s * .06, .54, -.268], .022, .005, [90, 0, 0]));
    return parts;
  } },
  { name: "真栅格通风食物柜", theme: "欧式", itemType: "家具", build: () => {
    const parts = [...[-1, 1].flatMap(x => [-1, 1].map(z => box("落地通角柱", [x * .42, .935, z * .24], [.06, 1.87, .06], material.wood))), ...[.25, .75, 1.25, 1.8].map(y => box("置食物的中空柜内搁层", [0, y, 0], [.83, .03, .47], material.wood)), box("上口檐板", [0, 1.88, 0], [.96, .06, .61], material.wood), ...[-1, 1].flatMap(s => bars("侧壁真正相隔的通风窄板", 7, [s * .42, 1.02, 0], .42, [.02, 1.54, .04], 2, material.wood)), ...bars("后背留缝通风条", 11, [0, 1.02, .25], .78, [.045, 1.54, .02], 0, material.wood), ...[.25, 1.8].map(y => box("后通风栅与角柱相接的上下横框", [0, y, .25], [.87, .035, .035], material.wood))];
    for (const s of [-1, 1]) {
      for (const edge of [-1, 1]) parts.push(box("通风门框竖边", [s * .205 + edge * .18, 1.02, -.27], [.025, 1.57, .025], material.wood));
      for (const y of [.25, 1.8]) parts.push(box("通风门框横边", [s * .205, y, -.27], [.39, .03, .025], material.wood));
      parts.push(...bars("门内真正透空的细栅", 5, [s * .205, 1.02, -.27], .29, [.024, 1.54, .018], 0, material.wood), loop("通风门小拉环", [s * .045, 1.03, -.295], .021, .005, [90, 0, 0]));
    }
    return parts;
  } },
  { name: "双足立框滑升挡火屏", theme: "欧式", itemType: "家具", build: () => {
    return [...[-1, 1].flatMap(s => [box("挡火屏长横稳足", [s * .33, .025, 0], [.09, .05, .48], material.wood), box("带内侧滑槽的高立柱", [s * .33, .8, 0], [.045, 1.55, .055], material.wood), box("立柱内侧上滑轨", [s * .3, 1.04, -.006], [.018, .95, .035], material.dark)]), rod("顶端横向联系梁", [-.33, 1.57, 0], [.33, 1.57, 0], .032, material.wood), box("沿竖柱升降的整片挡热屏", [0, .94, -.02], [.57, .66, .025], material.ivory), ...[-1, 1].map(s => box("滑屏外侧木边", [s * .275, .94, -.025], [.025, .68, .04], material.wood)), ...[.61, 1.27].map(y => box("滑屏上下框", [0, y, -.025], [.58, .035, .04], material.wood)), ...[-1, 1].map(s => cylinder("锁定屏高的横向夹钮", [s * .35, 1.11, 0], [.03, .06, .03], material.steel, [0, 0, 90])), ...[-1, 1].flatMap(s => [box("滑屏木边接入导轨的活动导耳", [s * .295, 1.04, -.014], [.025, .16, .025], material.wood), rod("夹钮穿过立柱而接到导耳的细螺杆", [s * .35, 1.11, 0], [s * .278, 1.11, 0], .009, material.steel)]), rod("低位通宽拉枨", [-.33, .2, 0], [.33, .2, 0], .025, material.wood)];
  } },
  { name: "上半落板朝鲜半闭柜", theme: "异域", itemType: "家具", build: () => {
    const parts = [box("矮足柜底", [0, .07, 0], [1.08, .14, .5], material.wood), ...[-1, 1].map(s => box("完整榫合侧板", [s * .515, .52, 0], [.04, .88, .46], material.wood)), box("整幅后板", [0, .52, .215], [1.01, .85, .03], material.wood), box("下半固定前板", [0, .3, -.22], [1.01, .4, .035], material.wood), box("上部通宽顶板", [0, .97, 0], [1.09, .05, .52], material.wood), box("柜前上半单扇下翻门", [0, .51, -.44], [1.005, .025, .43], material.wood), ...[-.36, 0, .36].map(x => cylinder("前半落板的分段铰链", [x, .51, -.225], [.018, .13, .018], material.dark, [0, 0, 90])), ...[-1, 1].map(s => cord("保持落板水平的侧限位索", [[s * .48, .84, -.2], [s * .48, .525, -.64]], .004, material.dark)), ...[-1, 1].map(s => rod("侧限位索固定到柜侧的短链耳", [s * .48, .84, -.2], [s * .515, .84, -.2], .012, material.dark)), box("柜内上部小屉搁底", [0, .8225, .015], [1.01, .02, .36], material.wood)];
    for (const x of [-.32, 0, .32]) parts.push(box("上缘三个独立小抽屉", [x, .875, -.04], [.29, .085, .25], material.wood), loop("小抽屉垂环", [x, .875, -.171], .012, .003, [90, 0, 0]));
    for (const s of [-1, 1]) parts.push(loop("端板搬运提环", [s * .54, .64, 0], .052, .009, [0, 0, 90], material.dark));
    return parts;
  } },
  { name: "中轴对开挂衣旅行柜箱", theme: "现代", itemType: "家具", build: () => {
    const parts: ModelPart[] = [];
    for (const s of [-1, 1]) {
      const half = [box("旅行衣箱厚后壳", [s * .35, .85, .22], [.7, 1.7, .04], material.dark), ...[-1, 1].map(edge => box("箱半侧壁", [s * .35 + edge * .33, .85, 0], [.04, 1.7, .45], material.wood)), ...[.025, 1.675].map(y => box("箱半上下边", [s * .35, y, 0], [.7, .05, .45], material.wood))];
      if (s < 0) half.push(rod("挂衣半边的横向衣杆", [-.63, 1.47, 0], [-.07, 1.47, 0], .025), ...[-.54, -.35, -.16].map(x => cord("固定在挂杆上的衣撑", [[x, 1.48, 0], [x, 1.38, 0], [x - .1, 1.26, 0], [x + .1, 1.26, 0], [x, 1.38, 0]], .008, material.wood)), box("挂衣侧底部鞋靴承盘", [-.35, .16, 0], [.58, .04, .36], material.wood));
      else for (const y of [.22, .51, .8, 1.09, 1.38]) half.push(box("另一半的固定衣物抽斗", [.35, y, .025], [.56, .25, .36], material.wood), rod("抽斗正面横拉手", [.29, y, -.17], [.41, y, -.17], .012, material.dark));
      const angle = s * 24 * Math.PI / 180;
      for (const value of half) { const { x, z } = value.position; value.position.x = x * Math.cos(angle) + (z - .24) * Math.sin(angle); value.position.z = .24 - x * Math.sin(angle) + (z - .24) * Math.cos(angle); value.rotation.y += s * 24; parts.push(value); }
    }
    for (const y of [.21, .85, 1.49]) parts.push(cylinder("左右箱共同竖铰轴", [0, y, .24], [.025, .16, .025], material.steel));
    return parts;
  } },
  { name: "阔口石柱洗礼盆", theme: "欧式", itemType: "家具", build: () => [cylinder("宽阔石台阶座", [0, .075, 0], [.91, .15, .91], material.ivory), part("下宽上窄承水盆石柱", "lathe", material.ivory, [0, .15, 0], [1, 1, 1], [0, 0, 0], { profile: [{ x: 0, y: 0 }, { x: .28, y: 0 }, { x: .23, y: .11 }, { x: .14, y: .23 }, { x: .14, y: .57 }, { x: .27, y: .65 }, { x: 0, y: .65 }] }), part("上口贯通而盆底封闭的厚石水盆", "lathe", material.ivory, [0, .75, 0], [1, 1, 1], [0, 0, 0], { profile: [{ x: 0, y: 0 }, { x: .26, y: 0 }, { x: .47, y: .12 }, { x: .54, y: .34 }, { x: .48, y: .34 }, { x: .42, y: .16 }, { x: .23, y: .06 }, { x: 0, y: .06 }] }), loop("盆口外缘连续石唇", [0, 1.09, 0], .54, .02, [0, 0, 0], material.ivory)] },
  { name: "双弓插棂温莎木椅", theme: "欧式", itemType: "家具", build: () => {
    const parts: ModelPart[] = [plate("钻孔承插背棂的整板座", [0, .46, 0], [[-.21, -.23], [.21, -.23], [.26, -.12], [.24, .16], [.16, .24], [-.16, .24], [-.24, .16], [-.26, -.12]], .045, material.wood), cord("高位蒸弯整根背弓", [[-.23, .49, .12], [-.26, .81, .16], [-.18, 1.08, .2], [0, 1.16, .22], [.18, 1.08, .2], [.26, .81, .16], [.23, .49, .12]], .023, material.wood), cord("低位连续扶手弓", [[-.31, .7, -.18], [-.32, .72, .08], [-.2, .76, .2], [0, .77, .23], [.2, .76, .2], [.32, .72, .08], [.31, .7, -.18]], .022, material.wood)];
    for (const s of [-1, 1]) for (const z of [-1, 1]) parts.push(rod("插入厚座的外张足", [s * .28, .015, z * .25], [s * .18, .46, z * .16], .035, material.wood));
    for (const x of [-.18, -.12, -.06, 0, .06, .12, .18]) { const y = 1.15 - .17 * (x / .18) ** 2; parts.push(rod("从座面直插背弓的长棂", [x, .48, .13], [x, y, .21], .014, material.wood)); }
    for (const s of [-1, 1]) parts.push(rod("扶手前支棂", [s * .22, .48, -.14], [s * .31, .7, -.18], .022, material.wood), rod("左右足之间纵枨", [s * .23, .2, -.21], [s * .23, .2, .21], .025, material.wood));
    parts.push(rod("H形中间联足枨", [-.23, .2, 0], [.23, .2, 0], .025, material.wood));
    return parts;
  } },
  { name: "撑杆锁位莫里斯躺椅", theme: "欧式", itemType: "家具", build: () => {
    const parts: ModelPart[] = [box("独立绷条承座框", [0, .4, 0], [.69, .11, .66], material.wood), box("宽松可取下座垫", [0, .5, -.015], [.61, .13, .59], material.ivory), ...[-1, 1].flatMap(s => [box("前方通高扶手立柱", [s * .34, .36, -.27], [.06, .72, .06], material.wood), rod("向后弯落地的下座梁", [s * .34, .4, -.27], [s * .34, .035, .48], .065, material.wood), box("向后延伸承撑杆的扶手梁", [s * .34, .71, .055], [.095, .055, .93], material.wood), box("木扶手上的独立软垫", [s * .34, .75, -.08], [.095, .035, .5], material.ivory)]), cylinder("靠背与座框共用铰轴", [0, .445, .29], [.03, .73, .03], material.steel, [0, 0, 90])];
    for (const s of [-1, 1]) {
      parts.push(rod("沿后仰背两侧的梯框边", [s * .27, .45, .29], [s * .27, 1.05, .6], .035, material.wood));
      for (const z of [.32, .39, .46]) parts.push(box("限定靠背撑杆位置的真正上开凹槽前齿", [s * .34, .75, z - .018], [.06, .045, .014], material.wood));
    }
    for (const y of [.58, .73, .88, 1.03]) { const z = .29 + (y - .45) * .31 / .6; parts.push(rod("梯背水平承垫横枨", [-.27, y, z], [.27, y, z], .028, material.wood)); }
    parts.push(rod("嵌入后扶手凹槽的撑背横杆", [-.39, .75, .445], [.39, .75, .445], .025), box("真实斜置靠垫", [0, .77, .455], [.51, .66, .1], material.ivory, [27.3, 0, 0]));
    return parts;
  } },
  { name: "通孔穿板双撑长背椅", theme: "异域", itemType: "家具", build: () => [piercedPanel("开有穿板榫槽的完整斜背板", [0, 0, -.28], [[-.22, 0], [.22, 0], [.22, 1.11], [.13, 1.25], [-.13, 1.25], [-.22, 1.11]], [[[-.15, .3], [-.15, .39], [.15, .39], [.15, .3]]], .035, material.wood, [-75, 0, 0]), box("真正穿过背板开槽的长座撑板", [0, .25, -.015], [.28, .035, 1.236], material.wood, [23.9, 0, 0])] },
  { name: "侧链折起船舱壁吊铺", theme: "现代", itemType: "家具", build: () => {
    const parts = [...[-1, 1].map(s => box("固定于船舱隔壁的竖向铺座板", [s * .85, .94, .42], [.1, 1.2, .06], material.dark)), rod("整张卧铺的通长侧铰轴", [-.94, .67, .39], [.94, .67, .39], .038), ...[-1, 1].map(s => box("卧铺两端板梁", [s * .95, .65, 0], [.055, .09, .8], material.wood)), ...[-1, 1].map(s => box("卧铺前后长框", [0, .65, s * .38], [1.95, .09, .045], material.wood)), ...bars("卧铺内真实独立排板", 14, [0, .66, 0], 1.82, [.1, .03, .725], 0, material.wood), box("铺上薄床褥", [0, .725, 0], [1.82, .1, .68], material.ivory), ...[-1, 1].map(s => cord("两端把铺体荷载传回舱壁的斜链", [[s * .85, 1.49, .42], [s * .85, .69, -.38]], .009)), rod("外缘防滚落护杆", [-.86, .91, -.38], [.86, .91, -.38], .022), ...[-1, 1].map(s => rod("护杆与铺框之间短立撑", [s * .86, .69, -.38], [s * .86, .91, -.38], .02))];
    return parts;
  } },
  { name: "滚轴承棺灵柩台", theme: "欧式", itemType: "家具", build: () => {
    const parts = [...[-1, 1].flatMap(x => [-1, 1].map(z => box("灵柩台独立承重方足", [x * .37, .34, z * .79], [.08, .68, .08], material.wood))), ...[-1, 1].map(s => box("托住滚轴的长侧梁", [s * .37, .67, 0], [.08, .12, 1.94], material.wood)), ...[-1, 1].map(s => box("床架前后联梁", [0, .63, s * .88], [.8, .07, .07], material.wood)), ...[-1, 1].map(s => rod("两足之间纵向低撑", [s * .37, .2, -.79], [s * .37, .2, .79], .04, material.wood)), rod("低位横向联系撑", [-.37, .2, 0], [.37, .2, 0], .04, material.wood)];
    for (const z of [-.69, -.23, .23, .69]) parts.push(cylinder("可以沿长向滚送棺体的横滚轴", [0, .74, z], [.075, .76, .075], material.wood, [0, 0, 90]), ...[-1, 1].map(s => cylinder("滚轴端固定轴耳", [s * .38, .74, z], [.035, .08, .035], material.steel, [0, 0, 90])));
    return parts;
  } },
  { name: "薄壁六角楔形木棺", theme: "欧式", itemType: "家具", build: () => {
    const outline: [number, number][] = [[-.26, -1.02], [.26, -1.02], [.4, -.62], [.23, .99], [-.23, .99], [-.4, -.62]];
    const inner: [number, number][] = [[-.235, -.992], [.235, -.992], [.37, -.62], [.205, .962], [-.205, .962], [-.37, -.62]];
    const lid = polygon("另置棺侧的完整木盖", material.wood, outline, .025, [-.43, .6, 0]); lid.rotation.z = -80;
    const parts = [polygon("六边棺底厚板", material.wood, outline, .035, [0, .035, 0]), polygon("内腔真实贯通的薄壁棺身", material.wood, outline, .4, [0, .07, 0], [inner]), lid];
    for (const s of [-1, 1]) for (const z of [-.54, .18, .72]) {
      const side = .4 - (z + .62) * .17 / 1.61;
      parts.push(rod("棺侧搬运握柄", [s * (side + .035), .27, z - .07], [s * (side + .035), .27, z + .07], .015, material.dark));
      for (const end of [-1, 1]) parts.push(rod("握柄与棺侧壁的短接脚", [s * (side + .035), .27, z + end * .07], [s * (.4 - (z + end * .07 + .62) * .17 / 1.61), .27, z + end * .07], .012, material.dark));
    }
    return parts;
  } },
  { name: "A架多轴卷毯陈列柜架", theme: "异域", itemType: "家具", build: () => {
    const parts: ModelPart[] = [];
    for (const x of [-1, 1]) parts.push(rod("靠墙后架斜腿", [x * 1.16, .025, .45], [x * 1.16, 1.78, .08], .065, material.wood), rod("朝前外张架腿", [x * 1.16, .025, -.45], [x * 1.16, 1.78, .08], .065, material.wood), rod("A架下横枨", [x * 1.16, .25, -.4], [x * 1.16, .25, .4], .045, material.wood));
    for (let i = 0; i < 4; i++) { const y = .42 + i * .37, z = -.32 + i * .08; parts.push(rod("可穿入整卷地毯的承托长轴", [-1.23, y, z], [1.23, y, z], .045, material.wood), cylinder("挂在长轴上的完整卷毯", [0, y, z], [.17, 2.17, .17], material.ivory, [0, 0, 90]), ...[-1, 1].map(s => loop("毯卷两端防散束带", [s * .84, y, z], .087, .005, [0, 0, 90], material.red))); }
    parts.push(rod("两A架的下部纵向联系梁", [-1.16, .18, .3], [1.16, .18, .3], .045, material.wood));
    return parts;
  } },
  { name: "双拱鞍桥木马陈列架", theme: "异域", itemType: "家具", build: () => {
    const parts = [box("鞍架通长承托脊梁", [0, .83, 0], [.13, .1, .96], material.wood), ...[-1, 1].flatMap(x => [-1, 1].map(z => rod("向外张开的木马足", [x * .33, .025, z * .4], [x * .06, .82, z * .33], .055, material.wood))), ...[-1, 1].map(s => rod("木马横足拉撑", [-.27, .19, s * .39], [.27, .19, s * .39], .028, material.wood)), ...[-1, 1].map(s => rod("长拉梁两端实接左右斜足的横枨", [-.23, .33, s * .373], [.23, .33, s * .373], .035, material.wood)), rod("前后足间长拉梁", [0, .33, -.36], [0, .33, .36], .035, material.wood)];
    for (const z of [-.28, .28]) parts.push(plate("承住马鞍内弧的实木鞍桥", [0, .86, z], [[-.22, 0], [-.2, .08], [-.12, .18], [0, .22], [.12, .18], [.2, .08], [.22, 0], [.17, 0], [.12, .11], [0, .15], [-.12, .11], [-.17, 0]], .06, material.wood, [0, 0, 0]));
    return parts;
  } },
  { name: "分肢承托立铠木架", theme: "异域", itemType: "家具", build: () => {
    const parts = [box("立铠架厚木稳座", [0, .04, 0], [.76, .08, .64], material.wood), rod("贯通骨盆和肩部的承重立轴", [0, .08, 0], [0, 1.67, 0], .045, material.wood), box("可套胸背甲的肩横托", [0, 1.43, 0], [.47, .06, .11], material.wood), ball("承住头盔的无面圆木头托", [0, 1.71, 0], [.17, .2, .17], material.wood), loop("承腰甲的横向木圈", [0, 1.03, 0], .17, .025, [0, 0, 0], material.wood), loop("承胸甲的横向木圈", [0, 1.28, 0], .21, .025, [0, 0, 0], material.wood)];
    for (const s of [-1, 1]) parts.push(rod("臂甲独立斜落承杆", [s * .22, 1.43, 0], [s * .36, 1.05, -.02], .03, material.wood), cylinder("臂杆下方止滑挡托", [s * .36, 1.04, -.02], [.08, .025, .08], material.wood), rod("左右腿甲木芯", [s * .13, .12, 0], [s * .13, .98, 0], .065, material.wood), box("靴甲承板", [s * .13, .1, -.04], [.15, .045, .31], material.wood), rod("连接胸腰两圈的前撑条", [s * .12, 1.04, -.13], [s * .12, 1.29, -.17], .02, material.wood));
    return parts;
  } },
  { name: "双层横槽长兵器排架", theme: "异域", itemType: "家具", build: () => {
    const parts = [...[-1, 1].flatMap(s => [box("兵器架前后长稳足", [s * .87, .035, 0], [.13, .07, .62], material.wood), box("横架承重立柱", [s * .87, .76, .03], [.065, 1.45, .065], material.wood)]), box("下层承兵器尾托板", [0, .2, -.08], [1.79, .065, .28], material.wood)];
    const edge: [number, number][] = [[-.88, 0], [.88, 0], [.88, .14]];
    for (let i = 0; i < 7; i++) { const x = .72 - i * .24; edge.push([x + .045, .14], [x + .045, .07], [x - .045, .07], [x - .045, .14]); }
    edge.push([-.88, .14]);
    parts.push(plate("真正向上开槽的兵器承颈横板", [0, 1.17, .03], edge, .065, material.wood, [0, 0, 0]), rod("低位贯穿联系枨", [-.87, .34, .03], [.87, .34, .03], .035, material.wood));
    return parts;
  } },
  { name: "斜底活门储粮米柜", theme: "中式", itemType: "家具", build: () => {
    const parts = [box("米柜落地底台", [0, .065, 0], [.94, .13, .65], material.wood), ...[-1, 1].map(s => box("储粮箱完整侧墙", [s * .435, .85, 0], [.04, 1.45, .59], material.wood)), box("粮箱后壁", [0, .85, .275], [.85, 1.45, .04], material.wood), box("前方封到出粮口上沿的完整木板", [0, .985, -.275], [.85, 1.15, .04], material.wood), box("把粮导向前口的真实斜底", [0, .55, 0], [.85, .04, .72], material.wood, [-40, 0, 0]), ...[-1, 1].map(s => box("出粮口左右保留的实木壁", [s * .3, .3, -.275], [.26, .22, .04], material.wood)), box("出粮口下缘", [0, .205, -.29], [.35, .03, .1], material.wood), box("可上提打开的中央出粮闸板", [0, .425, -.305], [.29, .24, .025], material.wood), ...[-1, 1].map(s => rod("闸把横握接回闸板的短耳", [s * .06, .43, -.31], [s * .06, .43, -.34], .01, material.dark)), rod("闸板外横把", [-.06, .43, -.34], [.06, .43, -.34], .014, material.dark), box("上部加粮口后半固定盖", [0, 1.59, .14], [.94, .035, .34], material.wood), box("前半向后掀起的加粮盖", [0, 1.716, -.144], [.94, .035, .34], material.wood, [48, 0, 0])];
    return parts;
  } },
  { name: "筛粉匣抽拉备餐橱", theme: "现代", itemType: "家具", build: () => {
    const parts = [box("备餐橱宽底", [0, .065, .04], [1.11, .13, .57], material.wood), ...[-1, 1].map(s => box("备餐下橱侧壁", [s * .52, .47, .04], [.04, .8, .55], material.wood)), box("下橱背板", [0, .47, .295], [1.02, .79, .03], material.wood), box("固定在下橱上的整柜工作面", [0, .9, .015], [1.17, .055, .69], material.ivory), box("从柜体向前抽出的金属覆面台", [0, .87, -.26], [1.08, .035, .58], material.ivory), ...[-1, 1].map(s => box("下方双门储物区", [s * .26, .41, -.25], [.49, .55, .035], material.wood)), ...[-1, 1].map(s => box("台下两只窄抽屉", [s * .26, .76, -.25], [.49, .115, .035], material.wood)), ...[-1, 1].map(s => box("上橱侧墙", [s * .52, 1.4, .14], [.04, .96, .32], material.wood)), box("上橱整幅背板", [0, 1.4, .285], [1.02, .95, .025], material.wood), ...[1.02, 1.89].map(y => box("上橱上下层板", [0, y, .14], [1.1, .035, .34], material.wood)), box("左右仓分开的竖板", [0, 1.47, .14], [.025, .81, .29], material.wood), ...[1.2, 1.74].map(y => cylinder("上橱右门实接侧框的短合页", [.5, y, -.016], [.024, .07, .024], material.dark)), box("右半仓柜门", [.27, 1.48, -.025], [.45, .77, .03], material.wood), part("左仓中真正中空的面粉斗和出粉嘴", "lathe", material.steel, [-.26, 1.12, .12], [1, 1, 1], [0, 0, 0], { profile: [{ x: .035, y: 0 }, { x: .035, y: .06 }, { x: .17, y: .23 }, { x: .17, y: .48 }, { x: .155, y: .48 }, { x: .155, y: .24 }, { x: .025, y: .07 }, { x: .025, y: 0 }, { x: .035, y: 0 }] }), cylinder("面粉斗筛网壳", [-.26, 1.18, .12], [.1, .055, .1], material.dark), rod("手摇筛粉的横向曲柄轴", [-.26, 1.18, .11], [-.26, 1.18, -.07], .012), rod("筛粉曲柄偏置臂", [-.26, 1.18, -.07], [-.19, 1.18, -.07], .012), cylinder("筛粉摇柄木握", [-.19, 1.18, -.1], [.025, .07, .025], material.wood, [90, 0, 0])];
    for (const x of [-.26, .26]) for (const y of [.42, .77]) parts.push(rod("橱门屉面横把手", [x - .055, y, -.28], [x + .055, y, -.28], .012, material.dark));
    parts.push(loop("上橱右门提环", [.09, 1.46, -.05], .018, .004, [90, 0, 0]));
    return parts;
  } },
  { name: "长杆夹持挂毯陈列架", theme: "异域", itemType: "家具", build: () => {
    const parts = [...[-1, 1].flatMap(s => [box("挂毯架前后宽稳足", [s * 1.2, .04, 0], [.16, .08, .85], material.wood), rod("两端高立柱", [s * 1.2, .08, 0], [s * 1.2, 2.35, 0], .065, material.wood), rod("抵抗悬毯侧拉的下角撑", [s * 1.2, .12, -.34], [s * 1.2, .57, 0], .035, material.wood)]), rod("贯通全宽的挂毯长横杆", [-1.35, 2.35, 0], [1.35, 2.35, 0], .06, material.wood), box("被夹住的连续软毯面", [0, 1.3, -.015], [2.23, 1.95, .012], material.ivory), rod("毯底防飘压杆", [-1.12, .32, -.015], [1.12, .32, -.015], .025, material.wood)];
    for (const x of [-1.05, -.7, -.35, 0, .35, .7, 1.05]) parts.push(loop("穿过横杆的独立悬毯环", [x, 2.35, 0], .043, .007, [0, 0, 90]), box("悬环下方夹毯片", [x, 2.28, -.015], [.035, .08, .025], material.dark));
    return parts;
  } },
  { name: "正交条框悬板扶手椅", theme: "现代", itemType: "家具", build: () => {
    const parts = [...[-1, 1].flatMap(x => [-1, 1].map(z => box("彼此正交而不并成板箱的独立立杆", [x * .28, .325, z > 0 ? .18 : -.24], [.038, .65, .038], material.dark))), ...[-1, 1].map(s => box("两侧贯通扶手平条", [s * .3, .66, -.015], [.085, .035, .71], material.wood)), box("向前后露出两端的座前横枨", [0, .47, -.24], [.72, .04, .04], material.dark), box("低于前枨的座后横枨", [0, .39, .16], [.72, .04, .04], material.dark), ...[-1, 1].map(s => box("下层左右纵向联足横条", [s * .28, .12, -.02], [.035, .035, .71], material.dark)), box("分离于条框之上的斜座平板", [0, .46, -.04], [.49, .035, .54], material.ivory, [12, 0, 0]), box("与座面分别安装的后仰背平板", [0, .7, .22], [.44, .58, .035], material.red, [18, 0, 0]), box("托住背板下缘的独立横条", [0, .425, .13], [.57, .035, .035], material.dark), box("托住背板中段的独立横条", [0, .665, .21], [.57, .035, .035], material.dark)];
    return parts;
  } },
  { name: "闭管多带悬面扶手椅", theme: "现代", itemType: "家具", build: () => {
    const parts: ModelPart[] = [];
    for (const s of [-1, 1]) parts.push(cord("侧面完整闭合钢管框", [[s * .31, .055, -.28], [s * .31, .04, 0], [s * .31, .055, .3], [s * .31, .1, .33], [s * .31, .61, .33], [s * .31, .66, .29], [s * .31, .66, 0], [s * .31, .66, -.27], [s * .31, .61, -.31], [s * .31, .1, -.31], [s * .31, .055, -.28]], .018), cord("从侧框向后上延伸的背带立管", [[s * .31, .42, .27], [s * .31, .66, .32], [s * .31, .96, .39]], .018), box("独立包在上横管上的皮扶带", [s * .31, .685, -.015], [.09, .012, .49], material.dark));
    parts.push(rod("座带前沿承力横管", [-.31, .452, -.23], [.31, .452, -.23], .025), rod("座带后沿承力横管", [-.31, .388, .23], [.31, .388, .23], .025), rod("高靠背的联系横管", [-.31, .96, .39], [.31, .96, .39], .025));
    for (const z of [-.165, -.055, .055, .165]) parts.push(box("分开张紧而不封成坐壳的皮座带", [0, .42 - z * Math.tan(8 * Math.PI / 180), z], [.59, .015, .095], material.wood, [8, 0, 0]));
    for (const y of [.74, .89]) parts.push(box("与座带分离的宽背皮带", [0, y, .32 + (y - .66) * .07 / .3], [.59, .105, .013], material.wood, [13, 0, 0]));
    return parts;
  } },
  { name: "子午圈木座大型地球仪", theme: "欧式", itemType: "家具", build: () => {
    const parts: ModelPart[] = [part("地球仪蓝色实体球体", "sphere", "#779ba6", [0, .88, 0], [.64, .64, .64], [0, 0, 23.5]), loop("允许南北极轴旋转的竖立子午圈", [0, .88, 0], .38, .012, [90, 0, 0], material.steel), loop("固定于底座上的水平地平圈", [0, .88, 0], .39, .018, [0, 0, 0], material.wood), cylinder("托住子午圈的木质中柱", [0, .31, 0], [.09, .44, .09], material.wood), cylinder("中柱上方的承环小盘", [0, .525, 0], [.14, .035, .14], material.wood)];
    const tilt = 23.5 * Math.PI / 180;
    for (const s of [-1, 1]) parts.push(rod("连接球体两极和子午圈的短转轴", [-Math.sin(tilt) * s * .315, .88 + Math.cos(tilt) * s * .315, 0], [-Math.sin(tilt) * s * .38, .88 + Math.cos(tilt) * s * .38, 0], .014));
    for (let i = 0; i < 3; i++) { const angle = i * Math.PI * 2 / 3; parts.push(rod("中柱下向三边展开的木足", [0, .25, 0], [Math.cos(angle) * .31, .025, Math.sin(angle) * .31], .05, material.wood)); }
    // ACT: 陆块按12度网格概括轮廓，是陈设模型；不作为精确地图或国界数据。
    const continents: [number, number][][] = [
      [[-168, 70], [-130, 72], [-118, 62], [-60, 50], [-80, 25], [-100, 18], [-122, 48], [-148, 60]],
      [[-80, 12], [-50, 5], [-35, -10], [-54, -55], [-72, -41]],
      [[-18, 33], [0, 37], [32, 31], [50, 13], [38, -10], [20, -35], [9, -30], [-10, 5]],
      [[-10, 36], [0, 60], [28, 72], [65, 72], [90, 60], [130, 70], [168, 60], [146, 44], [130, 30], [110, 0], [80, 7], [55, 25], [32, 40]],
      [[112, -13], [131, -10], [152, -23], [147, -40], [117, -35]],
    ];
    const cells: [number, number][] = [];
    for (let latitude = -78; latitude <= 78; latitude += 12) for (let longitude = -174; longitude <= 174; longitude += 12) {
      const onLand = continents.some(outline => {
        let inside = false;
        for (let i = 0, previous = outline.length - 1; i < outline.length; previous = i++) {
          const a = outline[i]!, b = outline[previous]!;
          if ((a[1] > latitude) !== (b[1] > latitude) && longitude < (b[0] - a[0]) * (latitude - a[1]) / (b[1] - a[1]) + a[0]) inside = !inside;
        }
        return inside;
      });
      if (onLand) cells.push([longitude, latitude]);
    }
    for (let start = 0; start < cells.length; start += 48) {
      const vertices: { x: number; y: number; z: number }[] = [], indices: number[] = [];
      for (const [longitude, latitude] of cells.slice(start, start + 48)) {
        const offset = vertices.length;
        for (const radius of [.324, .318]) for (const [east, north] of [[-6, -6], [6, -6], [6, 6], [-6, 6]]) {
          const lon = (longitude + east!) * Math.PI / 180, lat = (latitude + north!) * Math.PI / 180;
          vertices.push({ x: Math.sin(lon) * Math.cos(lat) * radius, y: Math.sin(lat) * radius, z: Math.cos(lon) * Math.cos(lat) * radius });
        }
        indices.push(...[0, 1, 2, 0, 2, 3, 4, 6, 5, 4, 7, 6, 0, 4, 5, 0, 5, 1, 1, 5, 6, 1, 6, 2, 2, 6, 7, 2, 7, 3, 3, 7, 4, 3, 4, 0].map(index => index + offset));
      }
      parts.push(part("贴合球面的粗略陆块薄壳", "mesh", "#91a77a", [0, .88, 0], [1, 1, 1], [0, 0, 23.5], { vertices, indices }));
    }
    parts.push(part("南极轮廓薄盖", "lathe", "#91a77a", [0, .88, 0], [1, 1, 1], [0, 0, 23.5], { profile: [{ x: 0, y: -.324 }, { x: .034, y: -.3222 }, { x: .034, y: -.3162 }, { x: 0, y: -.318 }] }));
    return parts;
  } },
];
