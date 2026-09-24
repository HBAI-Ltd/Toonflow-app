import type { FfmpegCommand, FfmpegCommandOptions, FfmpegFactory } from "./types";

export const chainMethods = [
  "input", "addInput", "mergeAdd", "withInputFormat", "inputFormat", "fromFormat",
  "withInputFps", "withInputFPS", "withFpsInput", "withFPSInput", "inputFPS", "inputFps", "fpsInput", "FPSInput",
  "nativeFramerate", "withNativeFramerate", "native", "setStartTime", "seekInput", "loop",
  "withNoAudio", "noAudio", "withAudioCodec", "audioCodec", "withAudioBitrate", "audioBitrate",
  "withAudioChannels", "audioChannels", "withAudioFrequency", "audioFrequency", "withAudioQuality", "audioQuality",
  "withAudioFilter", "withAudioFilters", "audioFilter", "audioFilters", "withNoVideo", "noVideo",
  "withVideoCodec", "videoCodec", "withVideoBitrate", "videoBitrate", "withVideoFilter", "withVideoFilters", "videoFilter", "videoFilters",
  "withOutputFps", "withOutputFPS", "withFpsOutput", "withFPSOutput", "withFps", "withFPS", "outputFPS", "outputFps", "fpsOutput", "FPSOutput", "fps", "FPS",
  "takeFrames", "withFrames", "frames", "keepPixelAspect", "keepDisplayAspect", "keepDisplayAspectRatio", "keepDAR",
  "withSize", "setSize", "size", "withAspect", "withAspectRatio", "setAspect", "setAspectRatio", "aspect", "aspectRatio",
  "applyAutopadding", "applyAutoPadding", "applyAutopad", "applyAutoPad", "withAutopadding", "withAutoPadding", "withAutopad", "withAutoPad", "autoPad", "autopad",
  "addOutput", "output", "seekOutput", "seek", "withDuration", "setDuration", "duration", "toFormat", "withOutputFormat", "outputFormat", "format", "map",
  "addInputOption", "addInputOptions", "withInputOption", "withInputOptions", "inputOption", "inputOptions",
  "addOutputOption", "addOutputOptions", "addOption", "addOptions", "withOutputOption", "withOutputOptions", "withOption", "withOptions", "outputOption", "outputOptions",
  "filterGraph", "complexFilter", "clone", "renice",
] as const satisfies readonly (keyof FfmpegCommand)[];

export const runMethods = [
  "run", "save", "saveToFile", "takeScreenshots", "thumbnail", "thumbnails", "screenshot", "screenshots", "mergeToFile", "concatenate", "concat",
] as const satisfies readonly (keyof FfmpegCommand)[];

export const queryMethods = [
  "ffprobe", "availableFilters", "getAvailableFilters", "availableCodecs", "getAvailableCodecs",
  "availableEncoders", "getAvailableEncoders", "availableFormats", "getAvailableFormats",
] as const satisfies readonly (keyof FfmpegCommand)[];

export type BrowserFfmpegOptions = Pick<FfmpegCommandOptions, "cwd" | "niceness" | "priority" | "stdoutLines" | "timeout"> & { source?: string };
export type FfmpegCall = { method: string; args: unknown[]; undefinedArgs?: number[] };
export type BrowserFfmpegRequest = { directory: string; requestId: string; options: BrowserFfmpegOptions; calls: FfmpegCall[]; operation: FfmpegCall };
export type FfmpegRemoteEvent = { event: string; args: unknown[] };

export type BrowserFfmpegEvents = {
  start: [command: string];
  progress: [progress: { frames: number; currentFps: number; currentKbps: number; targetSize: number; timemark: string; percent?: number }];
  stderr: [line: string];
  codecData: [data: { format: string; audio: string; audio_details: string[]; video: string; video_details: string[]; duration: string }];
  filenames: [filenames: string[]];
  end: [stdout: string | null, stderr: string | null];
  error: [error: Error, stdout?: string | null, stderr?: string | null];
};

type ChainMethod = typeof chainMethods[number] | Exclude<typeof runMethods[number], "run">;
type PathMethod = "input" | "addInput" | "mergeAdd" | "output" | "addOutput" | "mergeToFile" | "concat" | "concatenate";
type OptionMethod = Extract<ChainMethod, `${string}Option` | `${string}Options`>;
type Chain = { [K in Exclude<ChainMethod, PathMethod | OptionMethod>]: (...args: Parameters<FfmpegCommand[K]>) => BrowserFfmpegCommand };
type PathChain = { [K in PathMethod]: (path: string) => BrowserFfmpegCommand };
type OptionChain = { [K in OptionMethod]: (...options: string[] | [string[]]) => BrowserFfmpegCommand };

/** 浏览器保留文件型 fluent API；Node.js Stream、子进程和执行程序路径由宿主管理。 */
export type BrowserFfmpegCommand = Chain & PathChain & OptionChain & Pick<FfmpegCommand, typeof queryMethods[number]> & {
  on<K extends keyof BrowserFfmpegEvents>(event: K, listener: (...args: BrowserFfmpegEvents[K]) => void): BrowserFfmpegCommand;
  once: BrowserFfmpegCommand["on"];
  addListener: BrowserFfmpegCommand["on"];
  off: BrowserFfmpegCommand["on"];
  removeListener: BrowserFfmpegCommand["on"];
  removeAllListeners(event?: keyof BrowserFfmpegEvents): BrowserFfmpegCommand;
  preset(preset: (command: BrowserFfmpegCommand) => void): BrowserFfmpegCommand;
  usingPreset: BrowserFfmpegCommand["preset"];
  run(): void;
  kill(signal?: "SIGKILL" | "SIGTERM"): BrowserFfmpegCommand;
};

export interface BrowserFfmpegFactory extends Pick<FfmpegFactory, typeof queryMethods[number]> {
  (options?: BrowserFfmpegOptions): BrowserFfmpegCommand;
  (input?: string, options?: BrowserFfmpegOptions): BrowserFfmpegCommand;
}
