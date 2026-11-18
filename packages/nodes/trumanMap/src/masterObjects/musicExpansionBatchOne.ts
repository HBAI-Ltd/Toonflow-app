import { Quaternion, Vector3 } from "three";
import { part, type ModelPart, type Triple } from "../assetModelParts";
import { box, cylinder, ball, rod, loop, cord, plate, piercedPanel, material, type MasterPrototype } from "./parts";

function circle(radius: number, x = 0, y = 0): [number, number][] {
  return Array.from({ length: 16 }, (_, index) => { const angle = index * Math.PI / 8; return [x + Math.cos(angle) * radius, y + Math.sin(angle) * radius]; });
}

export function soundBox(outline: [number, number][], depth: number, holes: [number, number][][]): ModelPart[] {
  const center = outline.reduce((sum, point) => sum + point[1], 0) / outline.length;
  const orient = (points: [number, number][], clockwise: boolean) => {
    const area = points.reduce((sum, [x, y], index) => { const next = points[(index + 1) % points.length]!; return sum + x * next[1] - next[0] * y; }, 0);
    return (area < 0) === clockwise ? points : [...points].reverse();
  };
  const outer = orient(outline, false), inner = orient(outline.map(([x, y]) => [x * .91, center + (y - center) * .94]), true);
  return [
    piercedPanel("连续中空琴箱侧圈", [0, 0, depth / 2], outer, [inner], depth, material.wood, [-90, 0, 0]),
    piercedPanel("保留真实声孔的薄面板", [0, 0, -depth / 2], outer, holes.map(value => orient(value, true)), .004, material.ivory, [-90, 0, 0]),
    piercedPanel("连续封闭的琴背薄板", [0, 0, depth / 2 + .004], outer, [], .004, material.wood, [-90, 0, 0]),
  ];
}

export function hollowPipe(name: string, path: Triple[], radii: number[], wall: number, color = material.wood): ModelPart {
  const vertices: { x: number; y: number; z: number }[] = [], indices: number[] = [];
  path.forEach((point, index) => {
    const direction = new Vector3(...path[Math.min(path.length - 1, index + 1)]!).sub(new Vector3(...path[Math.max(0, index - 1)]!)).normalize();
    const rotation = new Quaternion().setFromUnitVectors(new Vector3(0, 1, 0), direction);
    for (const radius of [radii[index]!, radii[index]! - wall]) for (let step = 0; step < 12; step++) {
      const angle = step * Math.PI / 6, value = new Vector3(Math.cos(angle) * radius, 0, Math.sin(angle) * radius).applyQuaternion(rotation).add(new Vector3(...point));
      vertices.push({ x: value.x, y: value.y, z: value.z });
    }
    if (index) for (let step = 0; step < 12; step++) {
      const next = (step + 1) % 12, a = (index - 1) * 24, b = index * 24;
      indices.push(a + step, b + step, a + next, a + next, b + step, b + next,
        a + step + 12, a + next + 12, b + step + 12, a + next + 12, b + next + 12, b + step + 12);
    }
  });
  const last = (path.length - 1) * 24;
  for (let step = 0; step < 12; step++) { const next = (step + 1) % 12; indices.push(step, next, step + 12, next, next + 12, step + 12, last + step, last + step + 12, last + next, last + next, last + step + 12, last + next + 12); }
  return part(name, "mesh", color, [0, 0, 0], [1, 1, 1], [0, 0, 0], { vertices, indices });
}

function pegs(count: number, y: number, gap: number, span: number): ModelPart[] {
  return Array.from({ length: count }, (_, index) => rod("横贯弦箱的调音轴", [-span, y + index * gap, 0], [span, y + index * gap, 0], .008, material.wood));
}

function pluckedStrings(count: number, low: number, high: number, width: number, z: number, highZ = -.04): ModelPart[] {
  return Array.from({ length: count }, (_, index) => rod("从琴马斜接至弦枕的独立张弦", [(index / Math.max(1, count - 1) - .5) * width, low, z], [(index / Math.max(1, count - 1) - .5) * width, high, highZ], .0013, material.steel));
}

export function springWire(path: Triple[], wireRadius = .0018): ModelPart {
  const vertices: { x: number; y: number; z: number }[] = [], indices: number[] = [];
  path.forEach((point, index) => {
    const direction = new Vector3(...path[Math.min(index + 1, path.length - 1)]!).sub(new Vector3(...path[Math.max(0, index - 1)]!)).normalize();
    const rotation = new Quaternion().setFromUnitVectors(new Vector3(0, 1, 0), direction);
    for (let side = 0; side < 6; side++) { const angle = side * Math.PI / 3, value = new Vector3(Math.cos(angle) * wireRadius, 0, Math.sin(angle) * wireRadius).applyQuaternion(rotation).add(new Vector3(...point)); vertices.push({ x: value.x, y: value.y, z: value.z }); }
    if (index) for (let side = 0; side < 6; side++) { const next = (side + 1) % 6, a = (index - 1) * 6, b = index * 6; indices.push(a + side, b + side, a + next, a + next, b + side, b + next); }
  });
  const start = vertices.length, end = start + 1, first = path[0]!, last = path.at(-1)!;
  vertices.push({ x: first[0], y: first[1], z: first[2] }, { x: last[0], y: last[1], z: last[2] });
  for (let side = 0; side < 6; side++) { const next = (side + 1) % 6, offset = (path.length - 1) * 6; indices.push(start, side, next, end, offset + next, offset + side); }
  return part("连续螺旋而非锯齿折线的刮奏钢簧", "mesh", material.steel, [0, 0, 0], [1, 1, 1], [0, 0, 0], { vertices, indices });
}

export function bellowsFold(x: number): ModelPart {
  const vertices: { x: number; y: number; z: number }[] = [], indices: number[] = [];
  for (let section = 0; section < 3; section++) for (const inset of [0, .003]) {
    const r = (section === 1 ? .104 : .095) - inset;
    for (const [y, z] of [[-r, -r], [r, -r], [r, r], [-r, r]]) vertices.push({ x: (section - 1) * .012, y: y!, z: z! });
  }
  for (let section = 0; section < 2; section++) for (let side = 0; side < 4; side++) {
    const next = (side + 1) % 4, a = section * 8, b = (section + 1) * 8;
    indices.push(a + side, a + next, b + side, a + next, b + next, b + side,
      a + side + 4, b + side + 4, a + next + 4, a + next + 4, b + side + 4, b + next + 4);
  }
  for (const section of [0, 2]) for (let side = 0; side < 4; side++) {
    const a = section * 8 + side, b = section * 8 + (side + 1) % 4;
    indices.push(...(section === 0 ? [a, a + 4, b, b, a + 4, b + 4] : [a, b, a + 4, b, b + 4, a + 4]));
  }
  return part("内外连续闭合的薄壁方框风箱褶", "mesh", material.red, [x, .105, 0], [1, 1, 1], [0, 0, 0], { vertices, indices });
}

function violin(): ModelPart[] {
  const outline: [number, number][] = [[0, .025], [-.075, .025], [-.105, .075], [-.105, .14], [-.065, .185], [-.05, .21], [-.083, .23], [-.087, .285], [-.055, .335], [0, .35], [.055, .335], [.087, .285], [.083, .23], [.05, .21], [.065, .185], [.105, .14], [.105, .075], [.075, .025]];
  const fHole: [number, number][] = [[-.005, -.038], [.008, -.025], [.006, -.006], [-.005, .012], [-.008, .03], [-.002, .041], [-.012, .034], [-.015, .013], [-.003, -.009], [.002, -.024], [-.01, -.035]];
  const parts = soundBox(outline, .045, [-1, 1].map(side => fHole.map(([x, y]) => [side * (.045 + x), .185 + y])));
  parts.push(
    box("从琴身上缘伸出的圆肩短琴颈", [0, .426, .003], [.032, .18, .026], material.wood),
    box("压在琴颈上的无品黑指板", [0, .376, -.034], [.032, .235, .009], material.dark),
    box("凹槽弦轴箱", [0, .527, .002], [.033, .07, .03], material.wood),
    ...pegs(4, .503, .015, .036),
    cord("向内卷曲的琴头涡卷", [[0, .555, 0], [0, .58, 0], [0, .591, -.018], [0, .575, -.028]], .01, material.wood),
    piercedPanel("镂空双足拱形琴马", [0, .145, -.048], [[-.022, 0], [.022, 0], [.03, .033], [.018, .043], [-.018, .043], [-.03, .033]], [[[-.012, .006], [-.012, .024], [.012, .024], [.012, .006]]], .007, material.wood, [-90, 0, 0]),
    plate("尾部拉弦板", [0, .075, -.036], [[-.018, -.038], [.018, -.038], [.025, .04], [-.025, .04]], .006, material.dark, [0, 0, 0]),
    ...pluckedStrings(4, .07, .526, .023, -.054),
    ball("琴尾侧偏的下巴托", [-.055, .048, -.039], [.075, .025, .045], material.dark),
    cord("弧形肩托的承肩垫", [[-.09, .052, .045], [0, .035, .075], [.09, .052, .045]], .013, material.dark),
    ...[-1, 1].map(side => rod("肩托夹脚", [side * .085, .05, .044], [side * .085, .05, 0], .006)),
    rod("独立马尾擦奏弓杆", [.18, .015, -.31], [.18, .025, .33], .005, material.wood),
    rod("弓毛带", [.169, .015, -.31], [.169, .015, .33], .002, material.ivory),
  );
  return parts;
}

function morinKhuur(): ModelPart[] {
  const parts = soundBox([[-.17, .02], [.17, .02], [.12, .35], [-.12, .35]], .12, [circle(.02, -.07, .21), circle(.02, .07, .21)]);
  parts.push(box("贯通梯形琴腹的长无品琴杆", [0, .65, .025], [.037, .78, .04], material.wood), ...pegs(2, .99, .045, .075), plate("具有长吻和下颌的马首轮廓", [0, 1.035, .015], [[-.02, 0], [.02, 0], [.045, .035], [.048, .065], [.005, .12], [-.025, .135], [-.025, .1], [-.045, .085], [-.045, .05]], .035, material.wood, [0, 90, 0]), ...[-1, 1].map(side => plate("马首上竖耳", [side * .02, 1.135, .015], [[-.009, 0], [.009, 0], [.005, .035]], .012, material.dark, [0, 0, 0])), box("承托两根马尾弦的宽琴马", [0, .13, -.074], [.11, .035, .03], material.wood), ...pluckedStrings(2, .06, 1.03, .032, -.09), box("琴尾系弦的小木枕", [0, .047, -.075], [.07, .02, .025], material.dark), rod("独立长马尾弓杆", [.25, .018, -.38], [.25, .028, .38], .006, material.wood), rod("松弛弓毛的可拉紧马尾", [.238, .018, -.37], [.238, .018, .37], .0028, material.ivory));
  return parts;
}

function kamancheh(): ModelPart[] {
  return [part("开面球腹的薄壁共鸣壳", "lathe", material.wood, [0, .22, 0], [1, 1, 1], [-90, 0, 0], { profile: [{ x: 0, y: -.13 }, { x: .075, y: -.115 }, { x: .12, y: -.07 }, { x: .13, y: .025 }, { x: .117, y: .065 }, { x: .111, y: .065 }, { x: .124, y: .024 }, { x: .114, y: -.066 }, { x: .071, y: -.109 }, { x: 0, y: -.124 }] }), cylinder("前面张紧的圆形皮膜", [0, .22, -.065], [.225, .002, .225], material.ivory, [90, 0, 0]), rod("由球腹贯通而出的支地尾钉", [0, .01, .01], [0, .4, .01], .015, material.steel), rod("细长圆截面琴颈", [0, .32, .01], [0, .78, .01], .032, material.wood), box("上部四弦轴箱", [0, .83, .01], [.047, .14, .04], material.dark), ...pegs(4, .78, .033, .065), box("皮膜上的短琴桥", [0, .175, -.09], [.06, .025, .05], material.wood), ...pluckedStrings(4, .16, .885, .025, -.105), rod("擦奏弓的弯木主体", [.23, .015, -.3], [.23, .03, .3], .005, material.wood), cord("由手指控制张力的弓毛", [[.218, .015, -.3], [.205, .012, 0], [.218, .03, .3]], .002, material.ivory)];
}

function rubab(): ModelPart[] {
  const outline: [number, number][] = [[0, 0], [-.08, .025], [-.105, .11], [-.085, .2], [-.045, .22], [-.065, .25], [-.065, .37], [-.035, .41], [.035, .41], [.065, .37], [.065, .25], [.045, .22], [.085, .2], [.105, .11], [.08, .025]];
  return [...soundBox(outline, .17, []), box("短而宽的中空上琴颈", [0, .49, .01], [.07, .19, .07], material.wood), box("后弯而非直立的弦轴头", [0, .68, .06], [.065, .2, .055], material.wood, [38, 0, 0]), ...pegs(3, .59, .037, .08), ...Array.from({ length: 9 }, (_, index) => rod("沿短颈侧排列的共鸣弦轴", [.025, .3 + index * .031, 0], [.09, .3 + index * .031, 0], .008, material.wood)), ...pluckedStrings(3, .08, .71, .03, -.1), ...Array.from({ length: 9 }, (_, index) => rod("越过下琴马的独立共鸣弦", [index * .004 - .016, .08, -.082], [.045, .32 + index * .03, -.054], .001, material.steel)), box("皮面下部高琴马", [0, .1, -.1], [.1, .027, .018], material.wood), ...[.44, .48, .52].map(y => box("仅在短颈上段的束弦音品", [0, y, -.033], [.074, .004, .004], material.ivory))];
}

function rawap(): ModelPart[] {
  return [part("圆腹长颈热瓦普的中空半球木壳", "lathe", material.wood, [0, .14, 0], [1, 1, 1], [-90, 0, 0], { profile: [{ x: 0, y: -.11 }, { x: .085, y: -.085 }, { x: .13, y: -.025 }, { x: .13, y: .045 }, { x: .123, y: .045 }, { x: .123, y: -.023 }, { x: .08, y: -.079 }, { x: 0, y: -.103 }] }), cylinder("圆腹前面绷紧的皮膜", [0, .14, -.047], [.247, .004, .247], material.ivory, [90, 0, 0]), box("沿圆腹向上伸出的窄长琴颈", [0, .51, .015], [.04, .64, .032], material.wood), ...[-1, 1].map(side => cord("琴腹肩部真正外伸的回钩双角", [[side * .025, .26, .015], [side * .08, .29, .015], [side * .105, .36, .015], [side * .07, .39, .015]], .016, material.wood)), box("后弯弦轴头", [0, .86, .03], [.055, .15, .038], material.wood, [25, 0, 0]), ...pegs(5, .81, .024, .06), ...pluckedStrings(5, .05, .91, .028, -.064), ...Array.from({ length: 13 }, (_, index) => box("长颈上紧束的独立音品", [0, .31 + index * .035, -.006], [.043, .003, .004], material.ivory)), box("皮膜琴桥", [0, .08, -.065], [.075, .025, .019], material.wood)];
}

function saz(): ModelPart[] {
  return [...soundBox([[0, .01], [-.085, .04], [-.12, .12], [-.1, .22], [-.035, .36], [0, .4], [.035, .36], [.1, .22], [.12, .12], [.085, .04]], .15, [circle(.022, 0, .15)]), box("比梨形琴腹更长的细直琴颈", [0, .66, 0], [.035, .6, .035], material.wood), box("顺琴颈轴线延伸的扁弦轴头", [0, 1.005, .015], [.047, .16, .036], material.wood, [15, 0, 0]), ...pegs(3, .95, .04, .055), ...pluckedStrings(6, .07, 1.05, .025, -.092), ...Array.from({ length: 17 }, (_, index) => box("沿琴颈密排的绑线微分音品", [0, .39 + index * .031, -.02], [.038, .003, .005], material.ivory)), box("梨腹底端贴面琴桥", [0, .08, -.089], [.09, .02, .02], material.dark)];
}

function valiha(): ModelPart[] {
  const parts: ModelPart[] = [hollowPipe("本体与共鸣箱合一的竹筒", [[0, .03, 0], [0, .76, 0]], [.055, .055], .007), ...[.08, .71].map(y => cylinder("封住竹筒端节的竹隔", [0, y, 0], [.096, .006, .096], material.wood)), ...[.06, .73].map(y => loop("压住弦端的紧束带", [0, y, 0], .057, .004, [0, 0, 0], material.dark))];
  for (let index = 0; index < 16; index++) {
    const angle = index * Math.PI / 8, x = Math.cos(angle), z = Math.sin(angle), a = .13 + index % 4 * .018, b = .66 - index % 3 * .015;
    parts.push(rod("从竹皮中抬起的纵向独立琴弦", [x * .067, .085, z * .067], [x * .067, .705, z * .067], .0017, material.ivory), rod("琴弦下端的独立移动琴马", [x * .052, a, z * .052], [x * .068, a, z * .068], .006, material.wood), rod("琴弦上端的独立移动琴马", [x * .052, b, z * .052], [x * .068, b, z * .068], .006, material.wood));
  }
  return parts;
}

function sasando(): ModelPart[] {
  const parts: ModelPart[] = [hollowPipe("两端固定外弦的竖直竹筒", [[0, .08, 0], [0, .72, 0]], [.038, .038], .006), ...[.11, .69].map(y => loop("围绕竹筒端部的弦轴固定圈", [0, y, 0], .04, .007))];
  for (let index = 0; index < 18; index++) {
    const angle = index * Math.PI * 2 / 18, x = Math.cos(angle), z = Math.sin(angle);
    parts.push(cord("由中部高琴码顶起的单独金属弦", [[x * .04, .11, z * .04], [x * .082, .36, z * .082], [x * .04, .69, z * .04]], .0014, material.steel), rod("位于筒体中部的放射状高琴码", [x * .035, .36, z * .035], [x * .082, .36, z * .082], .007, material.wood));
  }
  const vertices: { x: number; y: number; z: number }[] = [], indices: number[] = [];
  for (let index = 0; index <= 20; index++) {
    const angle = (-150 + index * 15) * Math.PI / 180;
    for (const offset of [0, .004]) for (const [radius, y] of [[.08, .02], [.3, .18], [.4, .43], [.34, .78], [.16, .9]]) vertices.push({ x: Math.sin(angle) * (radius! + offset), y: y!, z: Math.cos(angle) * (radius! + offset) + .06 });
    if (index) for (let row = 0; row < 4; row++) {
      const a = (index - 1) * 10 + row, b = index * 10 + row;
      indices.push(a, a + 1, b, a + 1, b + 1, b, a + 5, b + 5, a + 6, a + 6, b + 5, b + 6);
    }
  }
  for (let row = 0; row < 4; row++) for (const [offset, reverse] of [[0, false], [200, true]] as const) { const a = offset + row; indices.push(...(reverse ? [a, a + 1, a + 5, a + 1, a + 6, a + 5] : [a, a + 5, a + 1, a + 1, a + 5, a + 6])); }
  for (let index = 0; index < 20; index++) for (const row of [0, 4]) { const a = index * 10 + row, b = (index + 1) * 10 + row; indices.push(...(row === 0 ? [a, b, a + 5, b, b + 5, a + 5] : [a, a + 5, b, b, a + 5, b + 5])); }
  parts.push(part("保留正面开口的掌叶曲面共鸣罩", "mesh", material.ivory, [0, 0, 0], [1, 1, 1], [0, 0, 0], { vertices, indices }));
  return parts;
}

function ektara(): ModelPart[] {
  return [part("蒙皮挤压琴的中空葫芦下腹", "lathe", material.wood, [0, .025, 0], [1, 1, 1], [0, 0, 0], { profile: [{ x: 0, y: 0 }, { x: .09, y: .025 }, { x: .13, y: .1 }, { x: .11, y: .19 }, { x: .104, y: .19 }, { x: .123, y: .1 }, { x: .085, y: .031 }, { x: 0, y: .007 }] }), cylinder("琴弦直接拉住的上蒙皮", [0, .217, 0], [.208, .003, .208], material.ivory), ...[-1, 1].map(side => rod("可向内挤压的分叉竹条", [side * .11, .13, 0], [side * .013, .78, 0], .015, material.wood)), box("将两条竹臂合拢的顶端夹块", [0, .78, 0], [.04, .05, .035], material.wood), rod("上端贯通调音轴", [-.055, .79, 0], [.055, .79, 0], .012, material.dark), rod("从鼓皮中心直达叉臂顶端的单根琴弦", [0, .218, 0], [0, .79, 0], .0015, material.steel), cylinder("皮膜中心的系弦小垫", [0, .221, 0], [.015, .007, .015], material.dark)];
}

function nailViolin(): ModelPart[] {
  const parts: ModelPart[] = [cylinder("带薄面板的扁圆共鸣木箱底", [0, .005, 0], [.305, .01, .305], material.wood), part("中空薄壁圆箱侧圈", "lathe", material.wood, [0, .03, 0], [1, 1, 1], [0, 0, 0], { profile: [{ x: .145, y: -.02 }, { x: .153, y: -.02 }, { x: .153, y: .025 }, { x: .145, y: .025 }, { x: .145, y: -.02 }] }), piercedPanel("具有三个透空声孔的薄木面板", [0, .055, 0], circle(.15), [circle(.015, -.055, 0).reverse(), circle(.015, .055, 0).reverse(), circle(.018, 0, .055).reverse()], .003, material.ivory)];
  for (let index = 0; index < 28; index++) { const angle = index * Math.PI * 2 / 28; parts.push(rod("沿边缘竖直插入的可擦奏调音钉", [Math.cos(angle) * .128, .055, Math.sin(angle) * .128], [Math.cos(angle) * .128, .11 + index % 7 * .008, Math.sin(angle) * .128], .0038, material.steel)); }
  parts.push(rod("擦钉演奏弓杆", [.23, .012, -.23], [.23, .018, .23], .004, material.wood), rod("擦奏弓毛", [.22, .012, -.23], [.22, .012, .23], .002, material.ivory));
  return parts;
}

function glassHarp(): ModelPart[] {
  const parts: ModelPart[] = [box("玻璃杯列琴的平木架", [0, .045, 0], [1.05, .045, .33], material.wood), ...[-1, 1].flatMap(x => [-1, 1].map(z => box("木架短足", [x * .45, .02, z * .11], [.04, .04, .04], material.dark)))];
  for (let index = 0; index < 12; index++) { const x = (index % 6 - 2.5) * .16, z = (Math.floor(index / 6) - .5) * .15, radius = .065 - index * .002, height = .12 - index * .003;
    parts.push(cylinder("每只酒杯独立的圆底座", [x, .075, z], [.075, .006, .075], material.glass), rod("酒杯细支柱", [x, .078, z], [x, .12, z], .008, material.glass), part("以湿指摩擦杯缘的真实中空杯", "lathe", material.glass, [x, .12, z], [1, 1, 1], [0, 0, 0], { profile: [{ x: 0, y: 0 }, { x: radius * .65, y: .025 }, { x: radius, y: height * .7 }, { x: radius, y: height }, { x: radius - .003, y: height }, { x: radius - .003, y: height * .7 }, { x: radius * .6, y: .029 }, { x: 0, y: .005 }] }));
  }
  return parts;
}

function glassRodResonator(): ModelPart[] {
  const parts: ModelPart[] = [...[-1, 1].flatMap(side => [rod("声扩散琴支腿", [side * .4, .02, 0], [side * .32, .82, .12], .035), rod("支脚横向稳定杆", [side * .4, .02, -.25], [side * .4, .02, .35], .035)]), box("固定金属振动轴的厚重音梁", [0, .82, .12], [.88, .075, .07], material.steel)];
  for (let index = 0; index < 16; index++) { const x = (index - 7.5) * .05; parts.push(rod("向演奏者前伸的玻璃摩擦棒", [x, .84, .1], [x, .84, -.28], .009, material.glass), rod("向后连接扩声板的调音钢轴", [x, .82, .13], [x, .56 + index * .011, .4], .006, material.steel), cylinder("调音钢轴尾部的质量块", [x, .56 + index * .011, .4], [.026, .035, .026], material.steel)); }
  for (const side of [-1, 1]) parts.push(part("从振动音梁引出的中空薄壳扩声锥", "lathe", material.ivory, [side * .28, .56, .34], [1, 1, 1], [90, side * 20, 0], { profile: [{ x: .025, y: 0 }, { x: .16, y: .35 }, { x: .156, y: .35 }, { x: .021, y: 0 }, { x: .025, y: 0 }] }));
  return parts;
}

function angklung(): ModelPart[] {
  const parts: ModelPart[] = [...[-1, 1].map(side => rod("手持竹框的两侧立柱", [side * .18, .02, 0], [side * .18, .89, 0], .018, material.wood)), rod("竹框顶部吊梁", [-.19, .89, 0], [.19, .89, 0], .02, material.wood), box("允许竹脚前后滚动的下部导槽底", [0, .035, 0], [.43, .025, .065], material.wood), ...[-1, 1].map(side => box("导槽两侧短壁", [0, .065, side * .032], [.43, .045, .009], material.wood))];
  for (let index = 0; index < 3; index++) { const x = (index - 1) * .11, height = .66 - index * .12;
    parts.push(hollowPipe("具有共鸣空腔的下竹筒", [[x, .08, 0], [x, .08 + height * .47, 0]], [.033, .033], .005), part("上段削成单侧振动舌的竹片", "extrude", material.wood, [x - .023, .08 + height * .47, -.022], [1, 1, 1], [0, 0, 0], { depth: .009, profile: [{ x: 0, y: 0 }, { x: .046, y: 0 }, { x: .036, y: height * .53 }, { x: .01, y: height * .53 }] }), rod("竹筒底部与导槽碰击的横脚", [x - .04, .08, 0], [x + .04, .08, 0], .018, material.wood), cord("将竹舌自由悬挂在梁上的藤绳", [[x, .08 + height, -.017], [x, .89, -.017], [x, .89, .017], [x, .08 + height, .017]], .003, material.dark));
  }
  return parts;
}

function timpani(): ModelPart[] {
  const parts: ModelPart[] = [part("下腹收拢而顶部开放的铜锅共鸣箱", "lathe", material.wood, [0, .24, 0], [1, 1, 1], [0, 0, 0], { profile: [{ x: 0, y: 0 }, { x: .16, y: .03 }, { x: .27, y: .12 }, { x: .33, y: .28 }, { x: .35, y: .45 }, { x: .342, y: .45 }, { x: .322, y: .282 }, { x: .263, y: .126 }, { x: .155, y: .038 }, { x: 0, y: .008 }] }), cylinder("锅口上方单张绷紧鼓膜", [0, .693, 0], [.693, .004, .693], material.ivory), loop("连动张紧的鼓面箍", [0, .7, 0], .355, .011), rod("固定锅底的中央承重柱", [0, .07, 0], [0, .27, 0], .08), ...[-1, 1].map(side => rod("定音鼓底架张开的双腿", [0, .13, 0], [side * .26, .025, .16], .035)), rod("踏板方向的第三支脚", [0, .13, 0], [0, .025, -.35], .035), box("足尖改变张力的长踏板", [0, .045, -.27], [.11, .018, .2], material.dark, [-12, 0, 0]), rod("从踏板连接至锅底的联动拉杆", [0, .05, -.2], [0, .25, -.05], .018)];
  for (let index = 0; index < 8; index++) { const angle = index * Math.PI / 4; parts.push(rod("将踏板总拉力分配至鼓缘的张紧杆", [Math.cos(angle) * .12, .2, Math.sin(angle) * .12], [Math.cos(angle) * .345, .69, Math.sin(angle) * .345], .009), cylinder("箍上独立校准螺母", [Math.cos(angle) * .35, .71, Math.sin(angle) * .35], [.025, .025, .025], material.dark)); }
  return parts;
}

function bodhran(): ModelPart[] {
  return [part("背部完全开放的单面框鼓木圈", "lathe", material.wood, [0, .22, 0], [1, 1, 1], [90, 0, 0], { profile: [{ x: .203, y: -.05 }, { x: .22, y: -.05 }, { x: .22, y: .05 }, { x: .203, y: .05 }, { x: .203, y: -.05 }] }), cylinder("仅覆盖前面的单张薄皮膜", [0, .22, -.052], [.41, .003, .41], material.ivory, [90, 0, 0]), rod("开放背部供手掌握持的横撑", [-.205, .22, .02], [.205, .22, .02], .018, material.wood), rod("背面交叉稳定撑", [0, .015, .025], [0, .425, .025], .018, material.wood), rod("双端击鼓槌的细腰柄", [.29, .014, -.1], [.29, .014, .1], .016, material.wood), ...[-1, 1].map(side => ball("双端鼓槌的圆头", [.29, .014, side * .1], [.027, .027, .027], material.wood))];
}

function mridangam(): ModelPart[] {
  const parts: ModelPart[] = [part("两头开口且左右直径不同的桶形木鼓", "lathe", material.wood, [0, .17, 0], [1, 1, 1], [0, 0, 90], { profile: [{ x: .13, y: -.3 }, { x: .17, y: -.12 }, { x: .18, y: .03 }, { x: .15, y: .27 }, { x: .14, y: .3 }, { x: .13, y: .3 }, { x: .14, y: .27 }, { x: .17, y: .03 }, { x: .16, y: -.12 }, { x: .12, y: -.3 }, { x: .13, y: -.3 }] })];
  for (const side of [-1, 1]) parts.push(cylinder("两端独立张紧的鼓膜", [side * .303, .17, 0], [side < 0 ? .28 : .26, .004, side < 0 ? .28 : .26], material.ivory, [0, 0, 90]), cylinder("鼓膜中心用于调音的黑色复合饼", [side * .307, .17, 0], [side < 0 ? .09 : .075, .002, side < 0 ? .09 : .075], material.dark, [0, 0, 90]), loop("端部结实的编皮箍", [side * .3, .17, 0], side < 0 ? .146 : .136, .012, [0, 0, 90], material.wood));
  for (let index = 0; index < 12; index++) { const angle = index * Math.PI / 6; parts.push(cord("两端鼓箍之间连续穿系的纵向皮带", [[-.3, .17 + Math.cos(angle) * .14, Math.sin(angle) * .14], [0, .17 + Math.cos(angle) * .184, Math.sin(angle) * .184], [.3, .17 + Math.cos(angle) * .13, Math.sin(angle) * .13]], .0038, material.ivory), box("插在皮带下方用来局部调张的木楔", [0, .17 + Math.cos(angle) * .175, Math.sin(angle) * .175], [.075, .015, .018], material.wood, [index * 30, 0, 0])); }
  return parts;
}

function springScraper(): ModelPart[] {
  const parts: ModelPart[] = [...[-1, 1].map(side => box("刮奏器的纵向木侧梁", [side * .048, .035, 0], [.018, .06, .26], material.wood)), ...[-1, 1].map(side => box("固定三根刮奏弹簧的端板", [0, .04, side * .13], [.115, .08, .018], material.wood)), rod("独立金属刮奏棒", [.095, .01, -.15], [.095, .01, .15], .006, material.steel)];
  for (let index = 0; index < 3; index++) { const x = (index - 1) * .032; parts.push(springWire(Array.from({ length: 61 }, (_, point): Triple => [x + Math.cos(point * Math.PI / 2) * .011, .07 + Math.sin(point * Math.PI / 2) * .011, -.12 + point * .004]))); }
  return parts;
}

function alphorn(): ModelPart[] {
  return [hollowPipe("连续贯通并逐渐放大的长木号音管", [[0, .21, -1.6], [0, .19, -.9], [0, .16, -.2], [0, .12, .5], [0, .15, .95], [0, .26, 1.2], [0, .42, 1.3]], [.009, .015, .022, .035, .05, .078, .11], .004), hollowPipe("唇端杯形木制吹嘴", [[0, .21, -1.65], [0, .21, -1.6]], [.017, .009], .003), ...[-1, 1].map(side => rod("支持末端上翘喇叭的落地小支脚", [0, .12, .5], [side * .08, .01, .5], .017, material.wood)), ...[-.9, -.2, .5].map(z => loop("长木音管的分节束箍", [0, z < -.3 ? .19 : z < .1 ? .16 : .12, z], z < -.3 ? .017 : z < .1 ? .024 : .037, .003, [90, 0, 0], material.dark))];
}

function ophicleide(): ModelPart[] {
  const parts: ModelPart[] = [hollowPipe("折返后向上张开的锥形低音号主管", [[.035, .68, 0], [.065, .57, 0], [.075, .2, 0], [.04, .07, 0], [-.07, .07, 0], [-.12, .2, 0], [-.12, .6, 0], [-.12, .86, 0]], [.011, .017, .024, .029, .036, .041, .055, .105], .003, material.steel), hollowPipe("带杯口的细吹嘴弯头", [[.035, .68, 0], [0, .77, 0], [-.045, .78, 0]], [.011, .01, .019], .002, material.steel), rod("支撑右手指孔键轴的长杆", [.11, .2, -.028], [.11, .62, -.028], .004, material.steel)];
  for (let index = 0; index < 9; index++) { const y = .22 + index * .045; parts.push(loop("号管外凸的独立键孔座", [.076, y, -.027], .012, .003, [90, 0, 0], material.steel), cylinder("覆盖键孔的抬起音键盖", [.085, y + .01, -.045], [.027, .004, .027], material.steel, [90, 0, 0]), rod("从侧键轴连接到音孔盖的短拨臂", [.11, y, -.028], [.085, y + .01, -.045], .004, material.steel)); }
  parts.push(...[.28, .54].map(y => rod("约束两条主音管间距的短横撑", [-.12, y, .02], [.075, y, .02], .008, material.steel)));
  return parts;
}

function trombaMarina(): ModelPart[] {
  return [...soundBox([[-.18, .015], [.18, .015], [.023, 1.48], [-.023, 1.48]], .19, [circle(.027, 0, .26)]), rod("从窄顶继续向上的调弦琴颈", [0, 1.4, 0], [0, 1.75, 0], .035, material.wood), rod("顶部横调音轴", [-.045, 1.71, 0], [.06, 1.71, 0], .012, material.dark), piercedPanel("右足抵住音板而左足微离板面的偏置鸣响琴马", [0, .16, -.099], [[-.045, -.004], [-.022, -.004], [-.014, -.02], [0, -.024], [.018, -.014], [.025, 0], [.044, 0], [.025, -.025], [-.008, -.035], [-.03, -.028]], [], .018, material.wood), rod("由琴尾固定板接到偏置鸣桥的同一根粗弦下段", [0, .045, -.126], [0, .17, -.1315], .0025, material.ivory), rod("从鸣桥斜接至琴头的同一根擦奏粗弦上段", [0, .17, -.1315], [0, 1.72, -.025], .0025, material.ivory), box("让擦奏弦实际接实到木琴颈前缘的上端弦枕", [0, 1.711, -.023], [.038, .018, .018], material.wood), box("琴尾的弦端固定板", [0, .04, -.115], [.07, .022, .035], material.dark), rod("演奏单弦的长弓", [.29, .014, -.4], [.29, .02, .4], .006, material.wood), rod("弓杆内侧的马尾带", [.278, .014, -.4], [.278, .014, .4], .002, material.ivory)];
}

function kulintang(): ModelPart[] {
  const parts: ModelPart[] = [...[-1, 1].flatMap(side => [box("长条排锣架侧梁", [0, .46, side * .14], [1.45, .045, .04], material.wood), ...[-1, 1].map(end => box("承重架腿", [end * .61, .23, side * .14], [.05, .46, .05], material.wood))]), ...[-1, 1].map(end => box("排锣架端横撑", [end * .7, .43, 0], [.045, .045, .32], material.wood)), ...[-1, 1].map(side => cord("承托小锣并保持自由振动的长绳", [[-.72, .49, side * .06], [.72, .49, side * .06]], .004, material.dark))];
  for (let index = 0; index < 8; index++) { const x = (index - 3.5) * .17, radius = .09 - index * .004;
    parts.push(part("具有真实下空腔与中央凸钮的横置铜锣", "lathe", material.wood, [x, .5, 0], [1, 1, 1], [0, 0, 0], { profile: [{ x: radius, y: 0 }, { x: radius, y: .035 }, { x: radius * .7, y: .045 }, { x: radius * .25, y: .045 }, { x: radius * .19, y: .065 }, { x: 0, y: .07 }, { x: 0, y: .064 }, { x: radius * .14, y: .06 }, { x: radius * .21, y: .039 }, { x: radius * .68, y: .039 }, { x: radius - .005, y: .03 }, { x: radius - .005, y: 0 }, { x: radius, y: 0 }] }));
  }
  parts.push(...[-1, 1].flatMap(side => [rod("排锣敲击槌柄", [side * .12, .02, -.2], [side * .22, .02, -.44], .012, material.wood), ball("小击槌软头", [side * .22, .02, -.44], [.025, .025, .025], material.dark)]));
  return parts;
}

function bandoneon(): ModelPart[] {
  const parts: ModelPart[] = [...[-1, 1].map(side => box("方形班多钮琴的左右独立簧箱", [side * .18, .105, 0], [.075, .21, .21], material.dark)), ...Array.from({ length: 13 }, (_, index) => bellowsFold((index - 6) * .022))];
  for (const side of [-1, 1]) {
    parts.push(cord("从侧簧箱弓起的掌背固定皮带", [[side * .217, .035, -.075], [side * .262, .105, -.075], [side * .217, .18, -.075]], .008, material.wood));
    for (let row = 0; row < 4; row++) for (let column = 0; column < 5; column++) parts.push(cylinder("两手分列的圆形旋律和低音钮", [side * .222, .04 + row * .041, -.07 + column * .035], [.012, .008, .012], material.ivory, [0, 0, 90]));
  }
  return parts;
}

function tanpura(): ModelPart[] {
  return [part("下腹硕大且内部中空的葫芦共鸣壳", "lathe", material.wood, [0, .24, .02], [1, 1, 1], [-90, 0, 0], { profile: [{ x: 0, y: -.2 }, { x: .12, y: -.17 }, { x: .2, y: -.08 }, { x: .22, y: .05 }, { x: .2, y: .11 }, { x: .191, y: .11 }, { x: .211, y: .047 }, { x: .192, y: -.076 }, { x: .115, y: -.162 }, { x: 0, y: -.191 }] }), cylinder("覆盖葫芦前脸的薄木音板", [0, .24, -.091], [.39, .006, .39], material.ivory, [90, 0, 0]), box("没有音品的宽长空弦琴颈", [0, .85, .005], [.075, 1, .07], material.wood), cylinder("琴颈上端的圆柱形弦箱", [0, 1.4, .005], [.085, .16, .085], material.wood), ...pegs(4, 1.34, .039, .09), box("产生泛音的宽平弧顶琴桥", [0, .16, -.12], [.13, .032, .045], material.ivory), ...pluckedStrings(4, .12, 1.47, .045, -.14), ...Array.from({ length: 4 }, (_, index) => ball("下端用于细调空弦张力的滑珠", [(index - 1.5) * .015, .13, -.141], [.01, .016, .01], material.wood))];
}

function sarod(): ModelPart[] {
  const outline: [number, number][] = [[0, .01], [-.095, .04], [-.14, .13], [-.12, .25], [-.055, .31], [-.04, .45], [.04, .45], [.055, .31], [.12, .25], [.14, .13], [.095, .04]];
  return [...soundBox(outline, .15, []), plate("没有音品的连续金属指板", [0, .45, -.0325], [[-.04, -.15], [.04, -.15], [.031, .2], [-.031, .2]], .005, material.steel, [0, 0, 0]), box("琴颈后的承重木芯", [0, .49, .005], [.065, .4, .07], material.wood), plate("向侧面收分的长弦轴头", [0, .72, 0], [[-.03, -.07], [.03, -.07], [.06, .075], [.02, .13], [-.035, .08]], .045, material.wood, [0, 0, 0]), ...pegs(4, .68, .037, .07), ...Array.from({ length: 9 }, (_, index) => rod("沿琴颈下侧排列的共鸣调音销", [.03, .3 + index * .035, .01], [.095, .3 + index * .035, .01], .008, material.wood)), ...pluckedStrings(4, .09, .8, .045, -.1), ...Array.from({ length: 9 }, (_, index) => rod("从下琴马引向侧销的共鸣弦", [(index - 4) * .004, .09, -.092], [.039, .3 + index * .035, -.04], .001, material.steel)), box("蒙皮上承托演奏弦与共鸣弦的琴桥", [0, .12, -.1], [.115, .025, .022], material.ivory)];
}

function handpan(): ModelPart[] {
  const points: Triple[] = [[0, .15, 0]], faces: number[] = [];
  for (let ringIndex = 1; ringIndex <= 5; ringIndex++) for (let step = 0; step < 24; step++) {
    const radius = ringIndex * .027, angle = step * Math.PI / 12, x = Math.cos(angle) * radius, z = Math.sin(angle) * radius;
    let y = .145 - (radius / .135) ** 2 * .045;
    for (let tone = 0; tone < 7; tone++) { const a = tone * Math.PI * 2 / 7, dx = x - Math.cos(a) * .082, dz = z - Math.sin(a) * .082; y -= .012 * Math.exp(-(dx * dx + dz * dz) / .0003); }
    points.push([x, y, z]);
  }
  for (let step = 0; step < 24; step++) faces.push(0, 1 + (step + 1) % 24, 1 + step);
  for (let ringIndex = 1; ringIndex < 5; ringIndex++) for (let step = 0; step < 24; step++) { const a = 1 + (ringIndex - 1) * 24 + step, b = 1 + ringIndex * 24 + step, c = 1 + (ringIndex - 1) * 24 + (step + 1) % 24, d = 1 + ringIndex * 24 + (step + 1) % 24; faces.push(a, c, b, c, d, b); }
  const vertices = [0, -.003].flatMap(offset => points.map(([x, y, z]) => ({ x, y: y + offset, z }))), count = points.length, indices = [...faces];
  for (let index = 0; index < faces.length; index += 3) indices.push(faces[index]! + count, faces[index + 2]! + count, faces[index + 1]! + count);
  for (let step = 0; step < 24; step++) { const a = 97 + step, b = 97 + (step + 1) % 24; indices.push(a, b, b + count, a, b + count, a + count); }
  return [part("连续凹入调音区且没有切舌缝的薄钢上壳", "mesh", material.steel, [0, 0, 0], [1, 1, 1], [0, 0, 0], { vertices, indices }), part("中空下壳及底部真实出音孔", "lathe", material.dark, [0, 0, 0], [1, 1, 1], [0, 0, 0], { profile: [{ x: .135, y: .1 }, { x: .131, y: .1 }, { x: .111, y: .039 }, { x: .045, y: .01 }, { x: .025, y: .017 }, { x: .025, y: .012 }, { x: .045, y: .005 }, { x: .115, y: .035 }, { x: .135, y: .1 }] }), loop("上下钢壳接合的环缘", [0, .1, 0], .136, .004, [0, 0, 0], material.steel)];
}

// 文物/声路参考：仅据公开构造重新建模，没有下载模型或图片。
// https://www.metmuseum.org/art/collection/search/501563 （钉琴）
// https://www.metmuseum.org/art/collection/search/503503 （球腹尾钉琴）
// https://www.metmuseum.org/art/collection/search/504148 （鲁巴卜）
// https://ich.unesco.org/en/RL/angklung-00393 （安格隆）
// https://emuseum.nmmusd.org/objects/7573/valiha （筒体弦与移动琴马）
// https://edutheque.philharmoniedeparis.fr/0161194-cristal-baschet.aspx （摩擦棒、金属轴和扩声锥）
export const musicExpansionBatchOneObjects: MasterPrototype[] = [
  { name: "肩托双腰小提琴", theme: "欧式", itemType: "乐器", build: violin },
  { name: "梯形琴腹马头琴", theme: "中式", itemType: "乐器", build: morinKhuur },
  { name: "球腹尾钉卡曼恰琴", theme: "异域", itemType: "乐器", build: kamancheh },
  { name: "束腰蒙皮鲁巴卜琴", theme: "异域", itemType: "乐器", build: rubab },
  { name: "角肩圆腹热瓦普", theme: "中式", itemType: "乐器", build: rawap },
  { name: "梨腹细长颈萨兹琴", theme: "异域", itemType: "乐器", build: saz },
  { name: "整筒分弦瓦里哈琴", theme: "异域", itemType: "乐器", build: valiha },
  { name: "掌叶共鸣罩萨桑多琴", theme: "异域", itemType: "乐器", build: sasando },
  { name: "叉杆挤压变调独弦琴", theme: "异域", itemType: "乐器", build: ektara },
  { name: "边缘调音钉擦奏琴", theme: "欧式", itemType: "乐器", build: nailViolin },
  { name: "杯缘摩擦玻璃杯列琴", theme: "欧式", itemType: "乐器", build: glassHarp },
  { name: "玻璃棒金属轴声扩散琴", theme: "欧式", itemType: "乐器", build: glassRodResonator },
  { name: "悬筒竹框安格隆", theme: "异域", itemType: "乐器", build: angklung },
  { name: "联杆踏板调张定音鼓", theme: "欧式", itemType: "乐器", build: timpani },
  { name: "背撑无铃单膜手鼓", theme: "欧式", itemType: "乐器", build: bodhran },
  { name: "双面横置姆里丹加姆鼓", theme: "异域", itemType: "乐器", build: mridangam },
  { name: "三簧钢丝刮奏响器", theme: "异域", itemType: "乐器", build: springScraper },
  { name: "上翘口长木号", theme: "欧式", itemType: "乐器", build: alphorn },
  { name: "键孔折管奥菲克莱德号", theme: "欧式", itemType: "乐器", build: ophicleide },
  { name: "船腹鸣桥单弦擦奏号琴", theme: "欧式", itemType: "乐器", build: trombaMarina },
  { name: "凸钮横置库林唐排锣", theme: "异域", itemType: "乐器", build: kulintang },
  { name: "双侧圆钮班多钮琴", theme: "欧式", itemType: "乐器", build: bandoneon },
  { name: "宽桥空弦坦布拉琴", theme: "异域", itemType: "乐器", build: tanpura },
  { name: "金属无品指板萨罗德琴", theme: "异域", itemType: "乐器", build: sarod },
  { name: "连续凹音区双壳手碟", theme: "现代", itemType: "乐器", build: handpan },
];
