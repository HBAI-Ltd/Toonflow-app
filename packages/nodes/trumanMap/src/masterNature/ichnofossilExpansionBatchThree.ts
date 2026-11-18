import { design, type MasterNatureDesign, type ModelPart } from "./shared";
import { traceAt, traceBed, type TraceDepression, type TraceOutline } from "./ichnofossilExpansionBatchTwo";

// 原迹的分趾印与断续双拖沟： https://ichnology.ku.edu/invertebrate_traces/tfimages/protichnites.html
// 手兽足迹： https://www.nps.gov/articles/triassic-tracks-in-the-moenkopi-formation.htm
// https://www.naturalhistory.si.edu/sites/default/files/media/translated_publications/Moratalla%26amp%3B_98.pdf
// 一种完整迹型只建一个主；不按步数、左右旋向或足印大小另开更多主素材。

function protichnites(): ModelPart[] {
  const imprint: TraceOutline = [[-.014, -.008], [-.02, .01], [-.022, .03], [-.012, .033], [-.002, .015], [.01, .038], [.018, .035], [.015, .012], [.007, -.008]];
  const drag: TraceOutline = [[-.003, -.1], [.003, -.1], [.003, .1], [-.003, .1]];
  const traces: TraceDepression[] = [];
  const center = (z: number) => .018 * Math.sin(z * 4);
  for (let step = 0; step < 10; step++) for (const side of [-1, 1]) {
    const z = -.78 + step * .17 + Math.sin(step * 1.8 + side) * .011, x = center(z) + side * (.119 + Math.sin(step * 1.4) * .006);
    traces.push(traceAt(imprint.map(([px, pz]) => [px * side, pz]), x, z, side * .18, 1, [0, .006], .007));
  }
  for (const z of [-.66, -.24, .18, .6]) for (const side of [-1, 1]) traces.push(traceAt(drag, center(z) + side * .008, z, 0, 1, [0, 0], .004));
  return traceBed("原迹两列分趾印与中间断续双拖痕的潮坪岩层", "#aca28a", [[-.47, -1.09], [.37, -1.11], [.54, -.27], [.43, 1.12], [-.35, 1.16], [-.53, .45]], traces, .18);
}

function chirotherium(): ModelPart[] {
  const hind: TraceOutline = [[-.08, -.13], [-.11, -.05], [-.08, .02], [-.14, .06], [-.17, .17], [-.145, .2], [-.105, .17], [-.07, .08], [-.06, .23], [-.025, .26], [-.005, .23], [.005, .09], [.035, .24], [.07, .25], [.09, .21], [.07, .06], [.11, .15], [.145, .15], [.16, .12], [.13, 0], [.085, -.04], [.16, -.1], [.18, -.16], [.155, -.19], [.12, -.16], [.045, -.1], [.03, -.13]];
  const fore: TraceOutline = [[-.09, -.055], [-.13, .005], [-.15, .065], [-.13, .09], [-.09, .065], [-.06, .035], [-.06, .13], [-.035, .14], [-.015, .12], [0, .045], [.02, .14], [.05, .14], [.07, .11], [.055, .03], [.09, .09], [.12, .075], [.115, .04], [.07, -.015], [.125, -.04], [.12, -.07], [.07, -.055], [0, -.055]];
  const traces: TraceDepression[] = [];
  for (const [x, z] of [[-.21, -.76], [.22, -.24], [-.22, .28], [.23, .8]]) {
    const side = Math.sign(x!), angle = side * .12;
    traces.push(traceAt(hind.map(([px, pz]) => [px * side, pz]), x!, z!, angle, .6, [0, .015], .026),
      traceAt(fore.map(([px, pz]) => [px * side, pz]), x! * 1.12, z! + .25, angle, .45, [0, .02], .012));
  }
  return traceBed("五趾后足与小前掌相伴的手兽足迹岩层", "#b9a58c", [[-.72, -1.07], [.49, -1.12], [.76, -.3], [.69, 1.27], [-.46, 1.33], [-.79, .49]], traces);
}

export const ichnofossilExpansionBatchThreeDesigns: MasterNatureDesign[] = [
  design("protichnitesBifidDoubleDrag", "原迹双列分趾拖痕岩层", "岩石", protichnites, ["Protichnites", "节肢动物行走遗迹", "双列二分趾印", "中线断续成对拖沟"]),
  design("chirotheriumPentadactylManusPes", "手兽五趾前后足迹岩层", "岩石", chirotherium, ["Chirotherium型", "三叠纪四足动物造迹", "大后足向后外伸第五趾", "独立五趾小前掌与负压坑"]),
];
