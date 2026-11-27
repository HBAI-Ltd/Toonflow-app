/// <reference path="./demucsWeb.d.ts" />
import { packLocalTensor, unpackLocalTensor, type LocalModelClient, type LocalModelTensor } from "@toonflow/plugin-server/localModelClient";
import { pcmToWav } from "@toonflow/node-shared/pcmPreview";
import { prepareModelInput, standaloneIspec } from "demucs-web/processor";

// HTDemucs 固定为 44.1 kHz 双声道、每次 7.8 秒。相邻窗口重叠四分之一。
export const sampleRate = 44100;
const windowSamples = 343980;
export const stride = windowSamples * 3 / 4;

function outputSamples(tensor: LocalModelTensor | undefined, shape: number[]) {
  if (tensor?.type !== "float32" || tensor.dims.join(",") !== shape.join(",")) throw new Error("人声分离模型返回的音轨尺寸无效");
  const bytes = unpackLocalTensor(tensor);
  if (bytes.byteLength !== shape.reduce((n, dim) => n * dim, 4)) throw new Error("人声分离模型返回的音轨尺寸无效");
  return new Float32Array(bytes.buffer, bytes.byteOffset, bytes.byteLength / 4);
}

async function predictVocals(run: LocalModelClient["run"], signal: AbortSignal, current: Float32Array, next: Float32Array) {
  const source = new Float32Array(windowSamples * 2);
  source.set(current);
  source.set(next.subarray(0, source.length - current.length), current.length);
  const left = new Float32Array(windowSamples), right = new Float32Array(windowSamples);
  for (let frame = 0; frame < windowSamples; frame++) {
    left[frame] = source[frame * 2]!;
    right[frame] = source[frame * 2 + 1]!;
  }

  // 发布者的纯信号处理函数处理归一化 STFT 和补边。模型的两路分支都交给宿主执行。
  const { waveform, magSpec, numBins, numFrames } = prepareModelInput(left, right);
  const { outputs } = await run({ id: "demucs", inputs: {
    input: packLocalTensor("float32", [1, 2, windowSamples], waveform),
    x: packLocalTensor("float32", [1, 4, numBins, numFrames], magSpec),
  } }, signal);
  signal.throwIfAborted();
  const tensors = Object.values(outputs);
  const time = outputSamples(tensors.find(t => t.dims.length === 4), [1, 4, 2, windowSamples]);
  const spectrum = outputSamples(tensors.find(t => t.dims.length === 5), [1, 4, 4, numBins, numFrames]);
  // 模型返回 drums / bass / other / vocals，仅重建第 4 轨的频谱，保留对应时域残差。
  const plane = numBins * numFrames;
  const channel = (index: number) => spectrum.subarray((12 + index) * plane, (13 + index) * plane);
  const voice = standaloneIspec({ leftReal: channel(0), leftImag: channel(1), rightReal: channel(2), rightImag: channel(3) }, windowSamples);
  const vocals = new Float32Array(Math.min(source.length, current.length + next.length));
  for (let i = 0; i < vocals.length / 2; i++) {
    vocals[i * 2] = voice.left[i]! + time[6 * windowSamples + i]!;
    vocals[i * 2 + 1] = voice.right[i]! + time[7 * windowSamples + i]!;
  }
  return vocals;
}

export async function* separateVocalChunks(count: number, readChunk: (index: number) => Promise<Float32Array>, run: LocalModelClient["run"], signal: AbortSignal) {
  let current = await readChunk(0);
  let tail: Float32Array = new Float32Array();
  for (let index = 0; index < count; index++) {
    const next = index + 1 < count ? await readChunk(index + 1) : new Float32Array();
    signal.throwIfAborted();
    const vocals = !next.length && tail.length === current.length ? tail : await predictVocals(run, signal, current, next);
    if (vocals !== tail) {
      const frames = Math.min(current.length, tail.length) / 2;
      for (let i = 0; i < frames * 2; i++) {
        const blend = (Math.floor(i / 2) + 1) / (frames + 1);
        vocals[i] = tail[i]! * (1 - blend) + vocals[i]! * blend;
      }
    }
    tail = vocals.slice(current.length);
    const accompaniment = new Float32Array(current.length);
    for (let i = 0; i < current.length; i++) accompaniment[i] = current[i]! - vocals[i]!;
    const wavFormat = { sampleRate, channels: 2, format: "f32le" } as const;
    signal.throwIfAborted();
    yield {
      voice: pcmToWav(vocals.slice(0, current.length).buffer, wavFormat),
      music: pcmToWav(accompaniment.buffer, wavFormat),
    };
    current = next;
  }
}
