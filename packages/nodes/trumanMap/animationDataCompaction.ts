import { readFile } from "@toonflow/file";
import { fileURLToPath } from "node:url";
import { normalizePath, type Plugin } from "vite";

type Track = { name: string; times: number[] | 0; values: number[] | 0; type: string };
type AnimationData = { animations: { clip: { tracks: Track[] } }[] };

const dataPath = normalizePath(fileURLToPath(new URL("./src/characterAnimationData.json", import.meta.url)));
const moduleId = "\0trumanMapCharacterAnimationData.js";
// 解码器源码同时用于构建期回读校验和产物，保证两边是同一份逻辑。
const expandSource = `(data, counts, stream) => {
  const numbers = stream.split(",");
  let read = 0, slot = 0;
  for (const animation of data.animations) for (const track of animation.clip.tracks) {
    const frames = counts[slot++], stride = counts[slot++], size = frames * stride;
    const times = new Array(frames), ints = new Array(size), values = new Array(size);
    for (let index = 0, time = 0; index < frames; index++) times[index] = (time += +numbers[read++]) / 1e6;
    for (let index = 0; index < size; index++) {
      let delta = +numbers[read++];
      if (index >= 2 * stride) delta += ints[index - stride] - ints[index - 2 * stride];
      ints[index] = index >= stride ? delta + ints[index - stride] : delta;
      values[index] = ints[index] / 1e5;
    }
    track.times = times;
    track.values = values;
  }
  return data;
}`;

function integers(values: number[], scale: number, label: string) {
  return values.map(value => {
    const integer = Math.round(value * scale);
    if (integer / scale !== value || Object.is(value, -0) || !Number.isSafeInteger(integer)) throw new Error(`${label} 不是 1/${scale} 精度的有限数：${value}`);
    return integer;
  });
}

// 人形动作的时间（1e-6 秒）和通道值（1e-5）在导出时已量化：构建期改存整数二阶差分文本，运行时还原成与 JSON 完全相同的数组，原始数据文件不变。
export function compactAnimationData(): Plugin {
  return {
    name: "compactTrumanMapAnimationData",
    enforce: "pre",
    async resolveId(source, importer) {
      if (!importer || !source.endsWith("characterAnimationData.json")) return;
      const resolved = await this.resolve(source, importer, { skipSelf: true });
      return resolved && normalizePath(resolved.id) === dataPath ? moduleId : undefined;
    },
    async load(id) {
      if (id !== moduleId) return;
      this.addWatchFile(dataPath);
      const text = await readFile(dataPath, "utf8");
      const data = JSON.parse(text) as AnimationData;
      const counts: number[] = [];
      const stream: number[] = [];
      for (const animation of data.animations) for (const track of animation.clip.tracks) {
        if (!Array.isArray(track.times) || !Array.isArray(track.values)) throw new Error(`动作轨道缺少关键帧：${track.name}`);
        const frames = track.times.length, stride = track.values.length / Math.max(1, frames);
        if (!Number.isInteger(stride) || stride < 1) throw new Error(`动作轨道值数量与帧数不匹配：${track.name}`);
        const times = integers(track.times, 1e6, `${track.name} 时间`);
        const values = integers(track.values, 1e5, `${track.name} 通道值`);
        counts.push(frames, stride);
        times.forEach((time, index) => stream.push(index ? time - times[index - 1]! : time));
        values.forEach((value, index) => {
          let delta = index >= stride ? value - values[index - stride]! : value;
          if (index >= 2 * stride) delta -= values[index - stride]! - values[index - 2 * stride]!;
          stream.push(delta);
        });
        track.times = 0;
        track.values = 0;
      }
      const meta = JSON.stringify(data);
      const packed = stream.join(",");
      const restored = (new Function(`return ${expandSource}`)() as (data: AnimationData, counts: number[], stream: string) => AnimationData)(JSON.parse(meta), counts, packed);
      if (JSON.stringify(restored) !== JSON.stringify(JSON.parse(text))) throw new Error("人形动作数据压缩后无法原样还原");
      return `export default (${expandSource})(JSON.parse(${JSON.stringify(meta)}), ${JSON.stringify(counts)}, ${JSON.stringify(packed)});\n`;
    },
  };
}
