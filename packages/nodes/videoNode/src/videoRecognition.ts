import type { LocalModelClient } from "@toonflow/plugin-server/localModelClient";
import { detectSubtitleLines, imageTensor, floats, type PercentRect } from "./videoTextDetection";
// PP-OCRv5_mobile_rec/config.json, PaddlePaddle Authors, Apache-2.0, revision 682f20538d8c086cb2128e5cfac775e6c4904e85.
import alphabet from "./subtitleAlphabet.json";

export async function recognizeSubtitles(frame: Uint8Array, width: number, height: number, area: PercentRect, run: LocalModelClient["run"], signal: AbortSignal) {
  const lines = await detectSubtitleLines(frame, width, height, area, run, signal);
  const texts: string[] = [];
  for (const line of lines.slice(0, 12)) {
    const w = Math.max(8, Math.min(960, Math.ceil(48 * line.w / line.h)));
    const { outputs } = await run({ id: "ppOcrV5Rec", inputs: { x: imageTensor(frame, width, height, line, w, 48, "symmetric", 3, Math.max(w, 320)) } }, signal);
    const tensor = Object.values(outputs)[0], probs = floats(tensor);
    if (tensor?.dims.length !== 3 || tensor.dims[0] !== 1 || tensor.dims[2] !== alphabet.length + 2) throw new Error("字幕识别模型与字典不匹配");
    const classes = tensor.dims[2];
    let last = -1, text = "", score = 0, letters = 0;
    for (let start = 0; start < probs.length; start += classes) {
      let best = 0;
      for (let j = 1; j < classes; j++) if (probs[start + j]! > probs[start + best]!) best = j;
      if (best && best !== last) { text += alphabet[best - 1] ?? " "; score += probs[start + best]!; letters++; }
      last = best;
    }
    if (letters && score / letters >= 0.55 && text.trim()) texts.push(text.trim());
  }
  return texts.join("\n");
}
