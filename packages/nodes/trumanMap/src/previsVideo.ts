// ACT: 预演小样视频：逐帧离线渲染后用 WebCodecs 编码，自带最小的 MP4（H.264）/WebM（VP9、VP8）封装，不依赖第三方库。
// 帧时间戳按帧号精确给出，渲染慢也不会变成慢动作；MP4 把 moov 放在最前，网页和剪辑软件都能直接拖进去。

export interface PrevisVideo { blob: Blob; mimeType: string; extension: "mp4" | "webm" }
export interface PrevisRecorder { add(frame: CanvasImageSource, index: number): Promise<void>; finish(): Promise<PrevisVideo>; close(): void }

interface Chunk { data: Uint8Array; key: boolean; timestamp: number }

const h264Codecs = ["avc1.640028", "avc1.4d0028", "avc1.42001f"];
const webmCodecs: [string, string][] = [["vp09.00.10.08", "V_VP9"], ["vp8", "V_VP8"]];

/** 选能用的编码器：优先 H.264（MP4），否则 VP9/VP8（WebM）。都不支持时报中文说明。 */
export async function createPrevisRecorder(width: number, height: number, fps: number): Promise<PrevisRecorder> {
  if (typeof VideoEncoder === "undefined" || typeof VideoFrame === "undefined") throw new Error("当前浏览器不支持视频编码（WebCodecs），请用新版 Chrome 或 Edge 打开再导出预演小样");
  const base = { width, height, framerate: fps, bitrate: Math.round(width * height * fps * 0.1), latencyMode: "quality" as const };
  for (const codec of h264Codecs) {
    const config: VideoEncoderConfig = { ...base, codec, avc: { format: "avc" } };
    if ((await VideoEncoder.isConfigSupported(config).catch(() => undefined))?.supported) return startRecorder(config, "mp4", fps);
  }
  for (const [codec, id] of webmCodecs) {
    const config: VideoEncoderConfig = { ...base, codec };
    if ((await VideoEncoder.isConfigSupported(config).catch(() => undefined))?.supported) return startRecorder(config, "webm", fps, id);
  }
  throw new Error("当前浏览器没有可用的 H.264 / VP9 / VP8 视频编码器，无法导出预演小样");
}

function startRecorder(config: VideoEncoderConfig, format: "mp4" | "webm", fps: number, codecId = ""): PrevisRecorder {
  const chunks: Chunk[] = [];
  let description: Uint8Array | undefined;
  let failure: unknown;
  const encoder = new VideoEncoder({
    output(chunk, metadata) {
      const data = new Uint8Array(chunk.byteLength);
      chunk.copyTo(data);
      chunks.push({ data, key: chunk.type === "key", timestamp: chunk.timestamp });
      const value = metadata?.decoderConfig?.description;
      if (value && !description) { description = new Uint8Array(value.byteLength); description.set(ArrayBuffer.isView(value) ? new Uint8Array(value.buffer, value.byteOffset, value.byteLength) : new Uint8Array(value)); }
    },
    error(error) { failure = error; },
  });
  encoder.configure(config);
  const keyEvery = Math.max(1, Math.round(fps * 2));
  return {
    async add(source, index) {
      if (failure) throw failure;
      // 编码队列别堆太多，避免内存涨。
      while (encoder.encodeQueueSize > 6) await new Promise(resolve => setTimeout(resolve, 4));
      const frame = new VideoFrame(source, { timestamp: Math.round(index * 1e6 / fps), duration: Math.round(1e6 / fps) });
      try { encoder.encode(frame, { keyFrame: index % keyEvery === 0 }); } finally { frame.close(); }
    },
    async finish() {
      await encoder.flush();
      if (failure) throw failure;
      encoder.close();
      if (!chunks.length) throw new Error("没有编码出任何画面");
      const width = config.width, height = config.height;
      if (format === "mp4") {
        if (!description) throw new Error("H.264 编码器没有给出解码参数，无法封装 MP4");
        return { blob: new Blob([muxMp4(chunks, description, width, height, fps)], { type: "video/mp4" }), mimeType: "video/mp4", extension: "mp4" };
      }
      return { blob: new Blob([muxWebm(chunks, codecId, width, height, fps)], { type: "video/webm" }), mimeType: "video/webm", extension: "webm" };
    },
    close() { if (encoder.state !== "closed") encoder.close(); },
  };
}

// ---------- MP4 ----------
const text = (value: string) => [...value].map(char => char.charCodeAt(0));
const u32 = (value: number) => [value >>> 24 & 255, value >>> 16 & 255, value >>> 8 & 255, value & 255];
const u16 = (value: number) => [value >>> 8 & 255, value & 255];
function box(type: string, ...parts: (number[] | Uint8Array)[]): Uint8Array {
  const size = 8 + parts.reduce((sum, part) => sum + part.length, 0);
  const out = new Uint8Array(size);
  out.set([...u32(size), ...text(type)]);
  let offset = 8;
  for (const part of parts) { out.set(part, offset); offset += part.length; }
  return out;
}
const fullBox = (type: string, version: number, flags: number, ...parts: (number[] | Uint8Array)[]) => box(type, [version, flags >>> 16 & 255, flags >>> 8 & 255, flags & 255], ...parts);
const matrix = [...u32(0x00010000), ...u32(0), ...u32(0), ...u32(0), ...u32(0x00010000), ...u32(0), ...u32(0), ...u32(0), ...u32(0x40000000)];

export function muxMp4(chunks: Chunk[], avcC: Uint8Array, width: number, height: number, fps: number): Uint8Array<ArrayBuffer> {
  const count = chunks.length;
  const durationMs = Math.round(count * 1000 / fps);
  // 硬件编码器可能输出B帧（解码顺序≠显示顺序）：这时写 ctts（v1，允许负偏移）给出每帧显示时间，没有重排就不写。
  const reordered = chunks.some((chunk, index) => Math.round(chunk.timestamp * fps / 1e6) !== index);
  const ftyp = box("ftyp", text("isom"), u32(512), text("isomiso2avc1mp41"));
  const moov = (dataOffset: number) => box("moov",
    fullBox("mvhd", 0, 0, u32(0), u32(0), u32(1000), u32(durationMs), u32(0x00010000), u16(0x0100), new Array(10).fill(0), matrix, new Array(24).fill(0), u32(2)),
    box("trak",
      fullBox("tkhd", 0, 3, u32(0), u32(0), u32(1), u32(0), u32(durationMs), new Array(8).fill(0), u16(0), u16(0), u16(0), u16(0), matrix, u32(width << 16), u32(height << 16)),
      box("mdia",
        fullBox("mdhd", 0, 0, u32(0), u32(0), u32(fps), u32(count), u16(0x55c4), u16(0)),
        fullBox("hdlr", 0, 0, u32(0), text("vide"), new Array(12).fill(0), text("VideoHandler"), [0]),
        box("minf",
          fullBox("vmhd", 0, 1, new Array(8).fill(0)),
          box("dinf", fullBox("dref", 0, 0, u32(1), fullBox("url ", 0, 1))),
          box("stbl",
            fullBox("stsd", 0, 0, u32(1), box("avc1", new Array(6).fill(0), u16(1), new Array(16).fill(0), u16(width), u16(height), u32(0x00480000), u32(0x00480000), u32(0), u16(1), new Array(32).fill(0), u16(0x18), u16(0xffff), box("avcC", avcC))),
            fullBox("stts", 0, 0, u32(1), u32(count), u32(1)),
            ...(reordered ? [fullBox("ctts", 1, 0, u32(count), chunks.flatMap((chunk, index) => [...u32(1), ...u32(Math.round(chunk.timestamp * fps / 1e6) - index)]))] : []),
            fullBox("stss", 0, 0, u32(chunks.filter(chunk => chunk.key).length), chunks.flatMap((chunk, index) => chunk.key ? u32(index + 1) : [])),
            fullBox("stsc", 0, 0, u32(1), u32(1), u32(count), u32(1)),
            fullBox("stsz", 0, 0, u32(0), u32(count), chunks.flatMap(chunk => u32(chunk.data.length))),
            fullBox("stco", 0, 0, u32(1), u32(dataOffset)))))));
  // moov 放前面（边下边播）；它的大小与偏移值无关，先量一次再填真实偏移。
  const moovSize = moov(0).length;
  const dataSize = chunks.reduce((sum, chunk) => sum + chunk.data.length, 0);
  const head = moov(ftyp.length + moovSize + 8);
  const out = new Uint8Array(ftyp.length + moovSize + 8 + dataSize);
  out.set(ftyp, 0); out.set(head, ftyp.length);
  let offset = ftyp.length + moovSize;
  out.set([...u32(8 + dataSize), ...text("mdat")], offset); offset += 8;
  for (const chunk of chunks) { out.set(chunk.data, offset); offset += chunk.data.length; }
  return out;
}

// ---------- WebM ----------
function ebmlId(id: number) { const bytes: number[] = []; for (let value = id; value > 0; value = Math.floor(value / 256)) bytes.unshift(value & 255); return bytes; }
function ebmlSize(size: number) { const bytes = [0x01]; for (let shift = 6; shift >= 0; shift--) bytes.push(Math.floor(size / 2 ** (shift * 8)) & 255); return bytes; }
function element(id: number, ...parts: (number[] | Uint8Array)[]): Uint8Array {
  const size = parts.reduce((sum, part) => sum + part.length, 0);
  const head = [...ebmlId(id), ...ebmlSize(size)];
  const out = new Uint8Array(head.length + size);
  out.set(head);
  let offset = head.length;
  for (const part of parts) { out.set(part, offset); offset += part.length; }
  return out;
}
function uint(value: number, width = 0) { const bytes: number[] = []; for (let rest = value; rest > 0 || bytes.length === 0; rest = Math.floor(rest / 256)) bytes.unshift(rest & 255); while (bytes.length < width) bytes.unshift(0); return bytes; }
function float64(value: number) { const out = new Uint8Array(8); new DataView(out.buffer).setFloat64(0, value); return out; }

export function muxWebm(chunks: Chunk[], codecId: string, width: number, height: number, fps: number): Uint8Array<ArrayBuffer> {
  const frameMs = 1000 / fps;
  const header = element(0x1A45DFA3, element(0x4286, uint(1)), element(0x42F7, uint(1)), element(0x42F2, uint(4)), element(0x42F3, uint(8)), element(0x4282, text("webm")), element(0x4287, uint(4)), element(0x4285, uint(2)));
  const info = element(0x1549A966, element(0x2AD7B1, uint(1000000)), element(0x4D80, text("TrumanMap")), element(0x5741, text("TrumanMap")), element(0x4489, float64(chunks.length * frameMs)));
  const tracks = element(0x1654AE6B, element(0xAE, element(0xD7, uint(1)), element(0x73C5, uint(1)), element(0x83, uint(1)), element(0x86, text(codecId)), element(0x23E383, uint(Math.round(1e9 / fps))), element(0xE0, element(0xB0, uint(width)), element(0xBA, uint(height)))));
  // 每个关键帧开一个 Cluster（关键帧间隔2秒，块内相对时间不会溢出 int16）。
  const clusters: { time: number; bytes: Uint8Array }[] = [];
  let group: { time: number; blocks: Uint8Array[] } | undefined;
  const flush = () => { if (group) clusters.push({ time: group.time, bytes: element(0x1F43B675, element(0xE7, uint(group.time)), ...group.blocks) }); };
  chunks.forEach((chunk, index) => {
    const time = Math.round(index * frameMs);
    if (!group || chunk.key) { flush(); group = { time, blocks: [] }; }
    const relative = time - group.time;
    group.blocks.push(element(0xA3, [0x81, relative >> 8 & 255, relative & 255, chunk.key ? 0x80 : 0], chunk.data));
  });
  flush();
  // Cues 放在 Cluster 前面，位置用定长8字节，这样 Cues 的大小不受偏移影响。
  const cues = (positions: number[]) => element(0x1C53BB6B, ...clusters.map((cluster, index) => element(0xBB, element(0xB3, uint(cluster.time, 8)), element(0xB7, element(0xF7, uint(1)), element(0xF1, uint(positions[index] ?? 0, 8))))));
  const cuesSize = cues([]).length;
  const positions: number[] = [];
  let position = info.length + tracks.length + cuesSize;
  for (const cluster of clusters) { positions.push(position); position += cluster.bytes.length; }
  const segment = element(0x18538067, info, tracks, cues(positions), ...clusters.map(cluster => cluster.bytes));
  const out = new Uint8Array(header.length + segment.length);
  out.set(header); out.set(segment, header.length);
  return out;
}
