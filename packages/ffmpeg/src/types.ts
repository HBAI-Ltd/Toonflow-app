import type { FfprobeData } from "@renmu/fluent-ffmpeg";

export const ffmpegMethods = [
  "input", "output", "inputOptions", "outputOptions", "inputFormat", "format", "inputFps",
  "audioCodec", "videoCodec", "audioBitrate", "videoBitrate", "audioFrequency", "audioChannels",
  "fps", "size", "aspect", "seekInput", "seekOutput", "duration", "frames", "noAudio", "noVideo",
  "audioFilters", "videoFilters", "complexFilter", "ffprobe",
] as const;

export type FfmpegMethod = typeof ffmpegMethods[number];
export type FfmpegStep = { method: FfmpegMethod; args: unknown[] };
export type FfmpegPlan = { steps: FfmpegStep[] };
export type FfmpegResult = { outputs: { path: string; mimeType: string }[]; probe?: FfprobeData };

export const ffmpegAliases = {
  addInput: "input", mergeAdd: "input", addOutput: "output",
  addInputOption: "inputOptions", addInputOptions: "inputOptions", inputOption: "inputOptions",
  addOutputOption: "outputOptions", addOutputOptions: "outputOptions", outputOption: "outputOptions",
  withInputFormat: "inputFormat", fromFormat: "inputFormat",
  outputFormat: "format", toFormat: "format", withOutputFormat: "format",
  inputFPS: "inputFps", withInputFps: "inputFps", withInputFPS: "inputFps",
  outputFps: "fps", outputFPS: "fps", withFps: "fps", withFPS: "fps",
  withAudioCodec: "audioCodec", withVideoCodec: "videoCodec",
  withAudioBitrate: "audioBitrate", withVideoBitrate: "videoBitrate",
  withAudioFrequency: "audioFrequency", withAudioChannels: "audioChannels",
  withSize: "size", withAspect: "aspect", setStartTime: "seekInput",
  seek: "seekOutput", setDuration: "duration", withDuration: "duration",
  takeFrames: "frames", withFrames: "frames", withNoAudio: "noAudio", withNoVideo: "noVideo",
  audioFilter: "audioFilters", withAudioFilter: "audioFilters", withAudioFilters: "audioFilters",
  videoFilter: "videoFilters", withVideoFilter: "videoFilters", withVideoFilters: "videoFilters",
  filterGraph: "complexFilter",
} as const satisfies Record<string, FfmpegMethod>;

export type FfmpegFilter = string | {
  filter: string;
  options?: string | number | (string | number)[] | Record<string, string | number>;
  inputs?: string | string[];
  outputs?: string | string[];
};

type FfmpegCommandArgs = {
  input: [path: string];
  output: [path: string];
  inputOptions: [options: string[]] | string[];
  outputOptions: [options: string[]] | string[];
  inputFormat: [format: string];
  format: [format: string];
  inputFps: [fps: number];
  audioCodec: [codec: string];
  videoCodec: [codec: string];
  audioBitrate: [bitrate: string | number];
  videoBitrate: [bitrate: string | number, constant?: boolean];
  audioFrequency: [frequency: number];
  audioChannels: [channels: number];
  fps: [fps: number];
  size: [size: string];
  aspect: [aspect: string | number];
  seekInput: [time: string | number];
  seekOutput: [time: string | number];
  duration: [duration: string | number];
  frames: [frames: number];
  noAudio: [];
  noVideo: [];
  audioFilters: [filters: FfmpegFilter[]] | FfmpegFilter[];
  videoFilters: [filters: FfmpegFilter[]] | FfmpegFilter[];
  complexFilter: [filters: FfmpegFilter | FfmpegFilter[], map?: string | string[]];
  ffprobe: [index?: number];
};

/** 仅记录链式配置；回调返回后由宿主执行，不暴露进程、原型或库的内部状态。 */
export type FfmpegCommand = {
  [Method in FfmpegMethod]: (...args: FfmpegCommandArgs[Method]) => FfmpegCommand;
} & {
  [Alias in keyof typeof ffmpegAliases]: (...args: FfmpegCommandArgs[typeof ffmpegAliases[Alias]]) => FfmpegCommand;
};

/** 旧字节转换接口的兼容选项；复杂媒体处理使用 ffmpeg(command => ...) 文件模式。 */
export interface FfmpegConvertOptions {
  /** png、jpeg 输出裁剪起点处的单张图片。 */
  format: "mp4" | "webm" | "wav" | "mp3" | "aac" | "ogg" | "flac" | "png" | "jpeg" | "gif";
  /** 裁剪起点，单位秒；缺省为 0。 */
  startSeconds?: number;
  /** 裁剪终点，单位秒；缺省为媒体末尾。 */
  endSeconds?: number;
  /** 目标宽度，2～8192；MP4/WebM 须为偶数，只填宽或高时按比例缩放。 */
  width?: number;
  /** 目标高度，2～8192；MP4/WebM 须为偶数。 */
  height?: number;
  /** 画面翻转：hflip 左右镜像，vflip 上下镜像；不支持其他滤镜或纯音频输出。 */
  vf?: "hflip" | "vflip";
  /** 输出帧率，1～120；不适用于纯音频输出。 */
  fps?: number;
  /** false 去掉声音，仅用于视频或 GIF。 */
  audio?: boolean;
  /** 音频采样率，单位 Hz。 */
  sampleRate?: number;
  channels?: 1 | 2;
  /** 音频比特率，单位 kbps。 */
  bitrateKbps?: number;
}

export interface FfmpegContext {
  (build: (command: FfmpegCommand) => unknown, signal?: AbortSignal): Promise<FfmpegResult>;
  convert(input: Uint8Array, options: FfmpegConvertOptions, signal?: AbortSignal): Promise<{ data: Uint8Array; mimeType: string }>;
}
