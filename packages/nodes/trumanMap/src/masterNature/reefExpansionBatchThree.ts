import { design, polygon } from "./shared";
import type { MasterNatureDesign, ModelPart } from "./shared";

// NOAA将spur-and-groove明确区分为相连珊瑚脊与沉积沟交替的地貌，不是礁块的尺寸款。
// https://taskforce.coralreef.noaa.gov/wp-content/uploads/2025/11/Perez2021_CNMI_StateOfTheReef_Report_2020-2021.pdf
function spurAndGrooveReef(): ModelPart[] {
  const sand = polygon("珊瑚礁脊之间露出的连续沉积砂底", "#c6c0a6", [[-26, -17], [23, -18], [28, -4], [26, 19], [12, 25], [-12, 24], [-26, 14]], .28);
  const rear = polygon("沟脊后方共同相接的起伏礁冠", "#b0b39b", [[-23, -15], [-14, -17], [-4, -16], [7, -17], [21, -15], [23, -11], [14, -8], [4, -10], [-7, -8], [-18, -10], [-23, -11]], 7.8);
  for (const vertex of rear.vertices!) if (vertex.y > 0) vertex.y += Math.sin(vertex.x * .2) * .32;
  rear.position.y = .18;
  const parts: ModelPart[] = [sand, rear];
  for (let index = 0; index < 7; index++) {
    const x = (index - 3) * 5.9, bend = (index - 3) * .66;
    const outline: [number, number][] = [[x - 2.35, -12], [x + 2.2, -12], [x + 2.05 + bend * .2, -5], [x + 2.3 + bend * .58, 4], [x + 1.65 + bend, 13], [x + .75 + bend * 1.2, 20], [x - .75 + bend * 1.2, 21], [x - 1.45 + bend, 14], [x - 1.6 + bend * .58, 5], [x - 2.15 + bend * .2, -4]];
    const spur = polygon("共同礁冠向外海分伸、两侧有真实沟槽的连续珊瑚硬脊", "#b7b7a0", outline, 1, [0, .2, 0]);
    for (const vertex of spur.vertices!) if (vertex.y > 0) {
      const outward = (vertex.z + 12) / 33;
      vertex.y = 7.7 - outward * 5.9 + Math.sin(vertex.z * .21 + index) * .28;
    }
    parts.push(spur);
  }
  return parts;
}

export const reefExpansionBatchThreeDesigns: MasterNatureDesign[] = [
  design("spurAndGrooveReefFramework", "珊瑚礁沟脊", "岩石", spurAndGrooveReef, ["Spur-and-groove reef", "共同礁冠外伸硬脊与真实沉积砂沟交替", "大型海底地貌"]),
];
