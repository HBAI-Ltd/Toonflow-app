import { beam, ring, type ModelPart, type Triple } from "../assetModelParts";
import { box, cylinder, plate, piercedPanel, material, type MasterPrototype } from "./parts";

function hardSignPanel(name: string, outline: [number, number][], holes: [number, number][][], thickness: number, color: string): ModelPart {
  const value = piercedPanel(name, [0, 0, 0], outline, holes, thickness, color);
  value.vertices = value.indices!.map(index => {
    const point = value.vertices![index]!;
    return { x: point.x, y: point.z, z: thickness / 2 - point.y };
  });
  delete value.indices;
  return value;
}

export const domesticExpansionBatchElevenObjects: MasterPrototype[] = [
  { name: "折叠A字湿滑告示牌", theme: "现代", itemType: "器物", build: () => {
    const yellow = "#e6c445", ink = "#2d3433", angle = 17 * Math.PI / 180, baseY = 0.006 * Math.cos(angle) + 0.009 * Math.sin(angle), hingeY = baseY + 0.64 * Math.cos(angle);
    const outline: [number, number][] = [[-0.16, 0], [-0.16, 0.04], [-0.146, 0.07], [-0.13, 0.57], [-0.115, 0.626], [0.115, 0.626], [0.13, 0.57], [0.146, 0.07], [0.16, 0.04], [0.16, 0], [0.102, 0], [0.102, 0.02], [-0.102, 0.02], [-0.102, 0]];
    const handle: [number, number][] = [[-0.076, 0.556], [-0.071, 0.55], [0.071, 0.55], [0.076, 0.556], [0.076, 0.584], [0.071, 0.59], [-0.071, 0.59], [-0.076, 0.584]];
    const marks: [number, number, number, number][] = [[0.008, 0.408, -0.01, 0.383], [0.002, 0.4, -0.031, 0.405], [0.002, 0.4, 0.044, 0.392], [-0.01, 0.383, -0.036, 0.361], [-0.036, 0.361, -0.061, 0.368], [-0.01, 0.383, 0.015, 0.365], [0.015, 0.365, 0.031, 0.34], [-0.072, 0.333, -0.04, 0.333], [-0.024, 0.327, 0.005, 0.327]];
    const onPanel = (side: number, x: number, y: number, z = 0): Triple => [x, baseY + y * Math.cos(angle) - z * side * Math.sin(angle), -side * 0.64 * Math.sin(angle) + y * side * Math.sin(angle) + z * Math.cos(angle)];
    const result: ModelPart[] = [];
    for (const side of [-1, 1]) {
      const faceZ = -side * 0.0042;
      const warning = hardSignPanel("贴在实牌外面的开芯三角警告图框", [[-0.1, 0.31], [0.1, 0.31], [0, 0.48]], [[[-0.082, 0.32], [0.082, 0.32], [0, 0.46]]], 0.0014, ink);
      warning.position.z = faceZ;
      const local: ModelPart[] = [hardSignPanel("顶端手把与下沿分脚都真实开口的整幅薄实牌", outline, [handle], 0.008, yellow), warning, plate("湿滑失足人形图标的圆头", [0.014, 0.426, faceZ], Array.from({ length: 12 }, (_, index): [number, number] => { const a = index * Math.PI / 6; return [Math.cos(a) * 0.01, Math.sin(a) * 0.01]; }), 0.0014, ink, [0, 0, 0]), ...[-1, 1].map(x => box("嵌住牌脚下沿并实际触地的防滑脚套", [x * 0.131, 0, 0], [0.056, 0.012, 0.018], material.dark))];
      for (const [x1, y1, x2, y2] of marks) {
        const length = Math.hypot(x2 - x1, y2 - y1), dx = (y2 - y1) / length * 0.003, dy = (x1 - x2) / length * 0.003;
        local.push(plate("沿实牌表面薄印的失足四肢与积水短纹", [0, 0, faceZ], [[x1 + dx, y1 + dy], [x2 + dx, y2 + dy], [x2 - dx, y2 - dy], [x1 - dx, y1 - dy]], 0.0014, ink, [0, 0, 0]));
      }
      for (const value of local) {
        const position = onPanel(side, value.position.x, value.position.y, value.position.z);
        value.position = { x: position[0], y: position[1], z: position[2] };
        value.rotation.x = side * 17;
        result.push(value);
      }
    }
    for (const x of [-0.079, 0, 0.079]) result.push(ring("内孔贯通并实际包住实轴的交错铰链轴节", yellow, 0.015, 0.0115, 0, 0.075, { position: { x, y: hingeY, z: 0 }, rotation: { x: 0, y: 0, z: 90 } }));
    result.push(cylinder("穿过三节铰链的连续横向实轴", [0, hingeY, 0], [0.007, 0.254, 0.007], material.steel, [0, 0, 90]));
    for (const side of [-1, 1]) {
      const front = onPanel(1, side * 0.14, 0.28, 0.003), back = onPanel(-1, side * 0.14, 0.28, -0.003), knee: Triple = [side * 0.14, front[1] + 0.018, 0];
      result.push(beam("由前牌侧缘铰接到中央折点的限开扁撑", yellow, front, knee, 0.012, 0.004), beam("由中央折点铰接到后牌侧缘的限开扁撑", yellow, knee, back, 0.012, 0.004));
      for (const position of [front, knee, back]) result.push(cylinder("穿入限开扁撑并在牌边承接的真实短铰销", position, [0.016, 0.023, 0.016], material.steel, [0, 0, 90]));
    }
    return result;
  } },
];
