import type { ModelPart } from "../assetModelParts";
import type { MasterPrototype } from "./parts";
import { ball, boxP, coneP, crownBoard, cylP, figure, gold, halo, latheP, lotus, officialHat, plateP, red, shift, stone, torusP, tubeP, wood, xumi, black, cloth, type Fig, type V } from "./folkFigures";

// 中国民间神像与佛道塑像：庙宇里常见的泥塑、金身、石雕，按真实大小做（坐像高 0.85–2.4m，立像高 1.5–3.4m），底座和宝座一起做进去；
// 只做轮廓、体量和一眼能认的特征（冠帽、胡须、法器、坐骑），不做衣纹和彩绘。拍庙宇、祠堂和诡异民俗戏时可以直接放进殿里的神台上。
const d = (name: string, build: () => ModelPart[]): MasterPrototype => ({ name, theme: "中式", itemType: "器物", build });
const hs = (a: V, b: V): [V, V] => [a, b];
const throne = (y: number, w: number, d2: number, h: number, c = "#7a2a1e"): ModelPart[] => [boxP("宝座", c, [0, y + h / 2, 0], [w, h, d2]), boxP("靠背", c, [0, y + h + .75, -d2 / 2 + .08], [w * .95, 1.5, .12]), boxP("靠背顶", gold, [0, y + h + 1.52, -d2 / 2 + .08], [w, .08, .2])];
const tianwang = (name: string, skin: string, robe: string, weapon: (f: Fig) => ModelPart[]) => d(name, () => {
  const y0 = .5, k = 3.4, f = figure("stand", k, { skin, robe, trim: gold, mood: "fierce", hands: hs([-.2 * k, y0 + .6 * k, .06 * k], [.22 * k, y0 + .62 * k, .1 * k]) }, y0);
  return [...xumi(1.6, 1.3, .46), ball("脚下小鬼", "#6b4a2b", [0, y0 + .1, .5], [.6, .22, .5]), ...f.parts, ...[-1, 1].map(s => ball("肩甲", gold, [s * .17 * k, y0 + .74 * k, 0], .13 * k)), cylP("头盔", gold, [0, f.top + .02 * k, 0], .14 * k, .08 * k), coneP("盔缨", red, [0, f.top + .09 * k, 0], .05 * k, .1 * k), ...weapon(f)];
});
const lion = (x: number): ModelPart[] => {
  const g = "#a8a396", dk = "#8f8b80";
  return shift([boxP("狮座", g, [0, .2, 0], [.9, .4, .9]), ball("狮身", g, [0, .85, -.05], [.62, .8, .7]), ball("狮胸", g, [0, .8, .2], [.5, .6, .45]), ball("狮头", g, [0, 1.3, .22], [.46, .42, .44]), ball("鬃毛", dk, [0, 1.22, .05], [.62, .54, .36]), ball("狮鼻", g, [0, 1.25, .45], .12), boxP("狮口", "#3a342c", [0, 1.15, .43], [.2, .03, .03]),
    ...[-1, 1].flatMap(s => [ball("狮眼", "#2a241d", [s * .1, 1.38, .41], .06), coneP("狮耳", g, [s * .2, 1.58, .15], .09, .14), cylP("前腿", g, [s * .17, .68, .3], .13, .56), boxP("前爪", g, [s * .17, .43, .38], [.16, .06, .22])]), tubeP("狮尾", g, [[0, .7, -.4], [0, 1, -.55], [0, 1.3, -.45]], .05), ball("绣球", dk, [.17, .52, .5], .26)], x, 0, 0);
};

export const folkDeityChinaObjects: MasterPrototype[] = [
  d("土地公泥塑神像·员外帽拐杖元宝·坐高0.9m", () => {
    const y = .34, f = figure("sit", .9, { skin: "#e8cdab", robe: "#c9902f", trim: "#6e3a1c", beard: "#f4f1ea", mood: "smile", hands: "hold" }, y), [l, r] = f.hands;
    return [...xumi(.62, .5), ...f.parts, cylP("员外帽", "#6e3a1c", [0, f.top + .04, 0], .19, .1), cylP("帽檐", "#6e3a1c", [0, f.top - .005, 0], .25, .02), cylP("拐杖", wood, [r[0] + .04, y + .4, r[2]], .022, .8), ball("拐杖头", wood, [r[0] + .04, y + .82, r[2]], .06), boxP("元宝", gold, [l[0], l[1] + .05, l[2]], [.1, .05, .07])];
  }),
  d("土地婆泥塑神像·银发髻拐杖·坐高0.85m", () => {
    const y = .34, f = figure("sit", .85, { skin: "#e8cdab", robe: "#a63b31", trim: gold, mood: "smile", hands: "hold" }, y), [, r] = f.hands;
    return [...xumi(.6, .48), ...f.parts, ball("银发髻", "#efece4", [0, f.top + .015, -.03], .12), ball("银发", "#efece4", [0, f.top - .05, -.04], [.16, .1, .15]), cylP("拐杖", wood, [r[0] + .04, y + .36, r[2]], .02, .72), ball("拐杖头", wood, [r[0] + .04, y + .74, r[2]], .05)];
  }),
  d("城隍爷泥塑神像·乌纱帽红袍宝座·坐高1.9m", () => {
    const y = .54, th = y + .6, f = figure("sit", 1.9, { skin: "#d8a87d", robe: "#b1352a", trim: gold, beard: black, hair: black, mood: "stern", hands: "hold" }, th);
    return [...xumi(1.5, 1.1, .5), ...throne(y, 1.15, .95, .6), ...f.parts, ...officialHat(f), boxP("笏板", "#e8dcc0", [f.hands[1][0], f.hands[1][1] + .12, f.hands[1][2]], [.05, .3, .015])];
  }),
  d("关圣帝君泥塑神像·绿袍长髯青龙偃月刀·立高2.4m", () => {
    const y0 = .44, k = 2.4, f = figure("stand", k, { skin: "#b8452f", robe: "#2f6a4a", trim: gold, hair: black, beard: black, mood: "stern", hands: hs([-.19 * k, y0 + .45 * k, .05 * k], [.24 * k, y0 + .55 * k, .1 * k]) }, y0), r = f.hands[1];
    return [...xumi(1.1, .9, .4), ...f.parts, ball("绿头巾", "#2f6a4a", [0, f.top - .03, -.01], [.31, .16, .3]), cylP("刀杆", wood, [r[0], y0 + 1.2, r[2]], .04, 2.4), plateP("刀刃", "#aeb7bd", [r[0], y0 + 2.5, r[2]], ([[0, .02], [.12, .1], [.3, .16], [.5, .14], [.62, .02], [.58, -.18], [.45, -.1], [.3, -.06], [.1, -.1], [0, -.14]] as [number, number][]).map(([a, b]) => [a * 1.4, b * 1.4] as [number, number]), .04), boxP("刀柄尾", "#aeb7bd", [r[0], y0 + .02, r[2]], [.06, .08, .06])];
  }),
  d("妈祖天后神像·凤冠红袍宝座·坐高1.8m", () => {
    const y = .44, th = y + .5, f = figure("sit", 1.8, { skin: "#f0d3b0", robe: "#b1352a", trim: gold, hair: black, mood: "calm", hands: "hold" }, th);
    return [...xumi(1.3, 1, .4), ...throne(y, 1.05, .85, .5), halo(gold, [0, f.hy, -.2], .9), ...f.parts, ...crownBoard(f, gold), boxP("玉笏", "#e8dcc0", [0, f.hands[1][1] + .1, f.hands[1][2] + .02], [.05, .32, .012])];
  }),
  d("财神爷神像·红袍乌纱帽元宝如意·坐高1.4m", () => {
    const y = .34, f = figure("sit", 1.4, { skin: "#e8c8a4", robe: "#b1352a", trim: gold, beard: black, hair: black, mood: "smile", hands: "hold" }, y), [l, r] = f.hands;
    return [...xumi(.95, .8), ...f.parts, ...officialHat(f), boxP("元宝", gold, [l[0], l[1] + .06, l[2]], [.16, .08, .11]), tubeP("如意", gold, [r, [r[0] + .05, r[1] + .16, r[2] + .05], [r[0] + .02, r[1] + .3, r[2] + .02]], .015), ball("如意头", gold, [r[0] + .02, r[1] + .32, r[2] + .02], .07)];
  }),
  d("观音菩萨神像·白衣净瓶柳枝莲台·立高2.6m", () => {
    const y0 = .56, k = 2.6, f = figure("stand", k, { skin: "#f0dcc0", robe: cloth, trim: gold, hair: black, mood: "calm", hands: hs([-.14 * k, y0 + .52 * k, .12 * k], [.15 * k, y0 + .55 * k, .14 * k]) }, y0), [l, r] = f.hands;
    return [...xumi(1.2, 1, .4), ...lotus(.44, .55, "#eecbd2"), ...f.parts, ball("发髻", black, [0, f.top + .04, -.01], .16), ball("头纱", cloth, [0, f.top - .12, -.07], [.4, .42, .34]), halo(gold, [0, f.hy, -.16], .8),
      latheP("净瓶", "#8fb0b8", [r[0], r[1] - .02, r[2]], [[0, 0], [.04, 0], [.07, .06], [.06, .13], [.03, .18], [.035, .26], [0, .26]]), tubeP("柳枝", "#5f8f4a", [l, [l[0] - .1, l[1] + .25, l[2] + .05], [l[0] - .25, l[1] + .3, l[2] + .1]], .012)];
  }),
  d("千手观音神像·十八臂光轮莲台·坐高2.4m", () => {
    const y0 = .64, k = 2.4, g = "#e6c98a", f = figure("sit", k, { skin: g, robe: g, trim: gold, hair: "#1f2a4a", mood: "calm", hands: "palms" }, y0);
    const arms = Array.from({ length: 18 }, (_, i): ModelPart[] => { const a = (-100 + i * 200 / 17) * Math.PI / 180, ex = Math.sin(a) * (.35 + (i % 2) * .15) * k, ey = y0 + .62 * k + Math.cos(a) * (.28 + (i % 2) * .12) * k; return [tubeP("千手臂", g, [[Math.sign(Math.sin(a)) * .17 * k, y0 + .6 * k, -.06 * k], [ex * .6, ey - .04 * k, -.1 * k], [ex, ey, -.1 * k]], .022 * k), ball("千手掌", g, [ex, ey, -.1 * k], .05 * k)]; }).flat();
    return [...xumi(1.5, 1.2, .45), ...lotus(.49, .75, "#e8c4cc"), ...f.parts, ...arms, halo(gold, [0, y0 + .6 * k, -.2 * k], 1.2 * k), ball("发髻", "#1f2a4a", [0, f.top + .04, -.01], .17), halo(gold, [0, f.hy, -.15 * k], .45 * k)];
  }),
  d("释迦牟尼佛金身坐像·螺髻头光莲台·坐高2.4m", () => {
    const y0 = .64, k = 2.4, g = "#e0b84a", f = figure("sit", k, { skin: g, robe: g, trim: "#c99a2e", mood: "calm", hands: hs([-.04 * k, y0 + .36 * k, .2 * k], [.04 * k, y0 + .36 * k, .2 * k]) }, y0);
    return [...xumi(1.6, 1.3, .45), ...lotus(.49, .8, "#e8b84a"), ...f.parts, ball("螺发", "#1f2a4a", [0, f.hy + .05 * k, -.01 * k], [.18 * k, .13 * k, .2 * k]), ball("肉髻", "#1f2a4a", [0, f.top + .02 * k, 0], .075 * k), ...[-1, 1].map(s => ball("长耳垂", g, [s * .09 * k, f.hy - .03 * k, 0], [.025 * k, .1 * k, .03 * k])), halo(g, [0, f.hy, -.14 * k], .5 * k), halo("#c99a2e", [0, y0 + .5 * k, -.22 * k], 1.4 * k)];
  }),
  d("弥勒佛神像·大肚布袋笑像·坐高1.5m", () => {
    const y0 = .44, k = 1.5, f = figure("sit", k, { skin: "#e8c8a4", robe: "#c9902f", trim: "#a63b31", mood: "smile", hands: "knee" }, y0);
    return [...xumi(1.1, .9, .4), ...f.parts, ball("大肚", "#e8c8a4", [0, y0 + .42 * k, .1 * k], [.4 * k, .34 * k, .3 * k]), torusP("佛珠", wood, [0, y0 + .64 * k, .06 * k], [.3 * k, .3 * k, .3 * k], [90, 0, 0]), ball("布袋", "#d6c7a6", [.36 * k, y0 + .16 * k, .14 * k], [.22 * k, .26 * k, .22 * k]), ...[-1, 1].map(s => ball("大耳", "#e8c8a4", [s * .09 * k, f.hy - .02 * k, 0], [.03 * k, .1 * k, .035 * k]))];
  }),
  d("地藏王菩萨神像·毗卢帽锡杖明珠·坐高2.2m", () => {
    const y0 = .64, k = 2.2, f = figure("sit", k, { skin: "#e8cdab", robe: "#c9792f", trim: gold, mood: "calm", hands: "hold" }, y0), [l, r] = f.hands;
    return [...xumi(1.5, 1.2, .45), ...lotus(.49, .75, "#e8c4cc"), ...f.parts, cylP("毗卢帽", gold, [0, f.top + .03 * k, 0], .2 * k, .1 * k), ...[-2, -1, 0, 1, 2].map(i => coneP("帽叶", gold, [i * .04 * k, f.top + .1 * k, 0], .04 * k, .08 * k)), halo(gold, [0, f.hy, -.14 * k], .5 * k),
      cylP("锡杖", wood, [r[0] + .05, y0 + .5 * k, r[2]], .03, 1.1 * k), torusP("锡杖环", gold, [r[0] + .05, y0 + 1.08 * k, r[2]], [.18, .18, .03]), ball("明珠", "#f5e6a8", [l[0], l[1] + .09, l[2]], .14)];
  }),
  tianwang("增长天王神像·青面持剑·立高3.4m", "#4a78a8", "#2f6a4a", f => [boxP("宝剑", "#aeb7bd", [f.hands[1][0], f.hands[1][1] + .7, f.hands[1][2]], [.07, 1.5, .02]), boxP("剑格", gold, [f.hands[1][0], f.hands[1][1] - .05, f.hands[1][2]], [.28, .05, .05])]),
  tianwang("持国天王神像·白面持琵琶·立高3.4m", "#e9e4d8", "#d6c9a8", f => [plateP("琵琶", "#8a5a36", [f.hands[0][0] + .1, f.hands[0][1], f.hands[0][2]], [[0, .5], [.14, .3], [.18, .05], [.1, -.2], [0, -.28], [-.1, -.2], [-.18, .05], [-.14, .3]], .08), boxP("琵琶颈", "#6b4a2b", [f.hands[0][0] + .1, f.hands[0][1] + .72, f.hands[0][2]], [.06, .5, .05])]),
  tianwang("广目天王神像·赤面缠蛇·立高3.4m", "#b5432e", "#a8322a", f => [tubeP("神蛇", "#4a7a4f", [[f.hands[1][0], f.hands[1][1] - .3, f.hands[1][2]], [f.hands[1][0] + .15, f.hands[1][1], f.hands[1][2] + .1], [f.hands[1][0] - .1, f.hands[1][1] + .3, f.hands[1][2]], [f.hands[1][0] + .12, f.hands[1][1] + .6, f.hands[1][2] + .05]], .05), ball("蛇头", "#4a7a4f", [f.hands[1][0] + .12, f.hands[1][1] + .66, f.hands[1][2] + .07], .13)]),
  tianwang("多闻天王神像·绿面托宝伞·立高3.4m", "#4a8a5f", "#2f6a4a", f => [cylP("伞柄", wood, [f.hands[1][0], f.hands[1][1] + .6, f.hands[1][2]], .03, 1.4), coneP("宝伞", red, [f.hands[1][0], f.hands[1][1] + 1.45, f.hands[1][2]], 1.1, .5), ball("伞顶珠", gold, [f.hands[1][0], f.hands[1][1] + 1.75, f.hands[1][2]], .1)]),
  d("降龙罗汉泥塑像·光头披袈裟盘龙·立高1.6m", () => {
    const y0 = .4, k = 1.6, f = figure("stand", k, { skin: "#e8c8a4", robe: "#c9792f", trim: "#a63b31", mood: "smile", hands: hs([-.2 * k, y0 + .5 * k, .06 * k], [.2 * k, y0 + .6 * k, .12 * k]) }, y0), r = f.hands[1];
    const path: V[] = Array.from({ length: 9 }, (_, i): V => [r[0] + .13 * Math.sin(i * 1.4), y0 + .35 * k + i * .1 * k, r[2] + .13 * Math.cos(i * 1.4)]);
    return [...xumi(.9, .8, .36), ...f.parts, tubeP("盘龙", "#3f7f5a", path, .05), ball("龙头", "#3f7f5a", [path[8]![0], path[8]![1] + .08, path[8]![2]], [.14, .1, .2]), ...[-1, 1].map(s => coneP("龙角", gold, [path[8]![0] + s * .05, path[8]![1] + .17, path[8]![2]], .03, .1)), ...[-1, 1].map(s => ball("眉", "#efece4", [s * .04 * k, f.hy + .05 * k, .09 * k], [.05 * k, .012 * k, .02 * k]))];
  }),
  d("三清尊神像·元始灵宝道德三尊·坐高2.0m", () => {
    const y0 = .64, k = 2, out: ModelPart[] = [...xumi(6, 1.5, .45)];
    for (const [x, robe, hair] of [[-1.8, "#b1352a", "#1b1a1c"], [0, "#d9a93a", "#1b1a1c"], [1.8, "#2f6a8a", "#efece4"]] as [number, string, string][]) {
      const f = figure("sit", k, { skin: "#ecd2b0", robe, trim: gold, hair, beard: hair === "#efece4" ? hair : "#1b1a1c", mood: "calm", hands: "hold" }, y0);
      out.push(...shift([...lotus(.49, .7, "#e8c4cc"), ...f.parts, cylP("莲花冠", gold, [0, f.top + .03 * k, 0], .13 * k, .08 * k), coneP("冠尖", gold, [0, f.top + .1 * k, 0], .06 * k, .1 * k), halo(gold, [0, f.hy, -.14 * k], .5 * k), ball(x < 0 ? "宝珠" : x === 0 ? "如意头" : "太极扇", gold, [f.hands[1][0], f.hands[1][1] + .1, f.hands[1][2]], .13)], x, 0, 0));
    }
    return out;
  }),
  d("真武大帝神像·披发黑袍持剑踏龟蛇·立高2.4m", () => {
    const y0 = .44, k = 2.4, f = figure("stand", k, { skin: "#e8c8a4", robe: "#1f2530", trim: gold, hair: black, beard: black, mood: "stern", hands: hs([-.2 * k, y0 + .5 * k, .08 * k], [.2 * k, y0 + .6 * k, .1 * k]) }, y0), r = f.hands[1];
    return [...xumi(1.2, .9, .4), ball("踏龟", "#4a5a4a", [.12, y0 + .08, .35], [.7, .2, .5]), tubeP("蛇身", "#4a7a4f", [[-.3, y0 + .04, .45], [-.1, y0 + .12, .6], [.2, y0 + .06, .7], [.4, y0 + .14, .5]], .05), ...f.parts, tubeP("披发", black, [[0, f.top - .04, -.1], [-.05, y0 + .65 * k, -.15], [-.02, y0 + .45 * k, -.16]], .1), boxP("宝剑", "#aeb7bd", [r[0], r[1] + .8, r[2]], [.07, 1.6, .02]), halo(gold, [0, f.hy, -.14 * k], .5 * k)];
  }),
  d("哪吒神像·乾坤圈风火轮火尖枪·立高1.5m", () => {
    const y0 = .3, k = 1.5, f = figure("stand", k, { skin: "#f0d3b0", robe: "#c0392b", trim: gold, hair: black, mood: "smile", hands: hs([-.2 * k, y0 + .5 * k, .08 * k], [.22 * k, y0 + .58 * k, .1 * k]) }, y0), r = f.hands[1];
    return [...xumi(.9, .8, .26), ...[-1, 1].map(s => torusP("风火轮", red, [s * .12, y0 + .06, 0], [.3, .3, .06], [0, 90, 0])), ...f.parts, ...[-1, 1].map(s => ball("发髻", black, [s * .1 * k, f.top - .01, -.01], .1 * k)), torusP("乾坤圈", gold, [-.2 * k, y0 + .5 * k, .08 * k], [.2, .2, .2]), tubeP("混天绫", "#d94a3a", [[-.17 * k, y0 + .74 * k, 0], [-.02, y0 + .45 * k, -.2], [.25 * k, y0 + .3 * k, -.05]], .02),
      cylP("火尖枪", wood, [r[0], y0 + .75 * k, r[2]], .03, 1.5 * k), coneP("枪尖", "#aeb7bd", [r[0], y0 + 1.55 * k, r[2]], .06, .22)];
  }),
  d("月老神像·白须红线姻缘簿·坐高1.2m", () => {
    const y0 = .34, k = 1.2, f = figure("sit", k, { skin: "#ecd2b0", robe: "#b1352a", trim: gold, hair: "#efece4", beard: "#efece4", mood: "smile", hands: "hold" }, y0), [l] = f.hands;
    return [...xumi(.9, .75), ...f.parts, boxP("姻缘簿", "#e8dcc0", [l[0], l[1] + .03, l[2]], [.2, .04, .15]), ...[0, 1, 2, 3].map(i => tubeP("红线", "#d9332a", [[.18, y0 + .5 * k, .2 * k], [.3 + i * .08, y0 + .3, .45 + i * .04], [.4 + i * .12, y0 + .06, .7 + i * .06]], .008)), cylP("红线轴", "#d9332a", [.18, y0 + .52 * k, .2 * k], .07, .08, [90, 0, 0])];
  }),
  d("门神秦琼尉迟恭·朱漆双扇门板·高2.4m", () => [
    ...[-1, 1].flatMap((s): ModelPart[] => [boxP("朱漆门扇", "#9b2a20", [s * .58, 1.2, 0], [1.1, 2.4, .08]), ball("门神头", "#e8cdab", [s * .58, 1.82, .06], [.22, .26, .1]), boxP("门神袍", s < 0 ? "#2f6a4a" : "#1a1713", [s * .58, 1.3, .05], [.5, .8, .03]), boxP("门神甲", gold, [s * .58, 1.45, .07], [.52, .3, .02]), cylP("门神冠", "#1a1713", [s * .58, 1.99, .06], .24, .12), boxP("门神鞭", gold, [s * .3, 1.2, .08], [.04, 1.1, .03], [0, 0, s * 10]), torusP("铺首环", gold, [s * .12, 1.1, .07], [.14, .14, .03]), ball("门钉", gold, [s * .12, 1.1, .07], .05)]),
    boxP("门框", "#6b2a1c", [0, 2.45, 0], [2.4, .1, .14]), boxP("门槛", "#6b2a1c", [0, .05, 0], [2.4, .1, .14]),
  ]),
  d("石狮子一对·蹲坐须弥座绣球·高1.6m", () => [...lion(-.9), ...lion(.9)]),
  d("镇墓兽·人面独角蹲兽·长1.1m高1.3m", () => {
    const c = "#8a6a4a", h = "#c9a24a";
    return [boxP("兽座", "#8f8b80", [0, .08, 0], [.9, .16, 1.3]), ball("兽身", c, [0, .62, -.1], [.55, .6, .9]), ...[-1, 1].flatMap(s => [cylP("前肢", c, [s * .2, .38, .3], .13, .45), cylP("后肢", c, [s * .22, .34, -.4], .15, .35), ball("眼", black, [s * .08, 1.02, .6], .05), coneP("兽耳", c, [s * .17, 1.08, .42], .08, .14)]), ball("人面", "#c9a77c", [0, .98, .46], [.34, .4, .3]), ball("鼻", "#c9a77c", [0, .95, .63], .07), boxP("口", "#5a2a22", [0, .86, .62], [.14, .03, .02]), coneP("独角", h, [0, 1.42, .4], .07, .38), tubeP("舌", "#b5432e", [[0, .86, .62], [0, .74, .72]], .02),
      ...[0, 1, 2, 3, 4].map(i => coneP("脊刺", h, [0, .96 - i * .06, .12 - i * .2], .08, .2, [-20, 0, 0]))];
  }),
  d("石翁仲·文官像·朝服持笏·立高2.8m", () => {
    const y0 = .5, k = 2.6, f = figure("stand", k, { skin: stone, robe: "#a29e93", trim: "#8f8b80", mood: "stern", hands: "hold" }, y0);
    return [...xumi(1.1, .9, .46), ...f.parts, boxP("平天冠", "#8f8b80", [0, f.top + .03, 0], [.3, .05, .38]), cylP("冠筒", "#8f8b80", [0, f.top - .01, 0], .22, .08), boxP("笏", "#b3ae9f", [f.hands[1][0], f.hands[1][1] + .1, f.hands[1][2]], [.07, .5, .02])];
  }),
];
