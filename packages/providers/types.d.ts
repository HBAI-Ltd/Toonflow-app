/// <reference types="bun" />

type ModelType = "text" | "image" | "video" | "audio";

type ImageMode = "text" | "singleImage" | "multiReference";
type VideoMode =
  | "singleImage"
  | "startEndRequired"
  | "endFrameOptional"
  | "startFrameOptional"
  | "text"
  | (`${"video" | "image" | "audio"}Reference:${number}`)[];

interface ProviderModel {
  id: string;
  label: string;
  type: ModelType;
  think?: boolean;
  mode?: (ImageMode | VideoMode)[];
  associationSkills?: string;
  audio?: "optional" | boolean;
  imageSizes?: string[];
  imageRatios?: string[];
  durationResolutionMap?: { duration: number[]; resolution: string[] }[];
  voices?: { title: string; voice: string }[];
}

interface ProviderFormRule {
  field: string;
  value: unknown;
}

type ProviderConfig<TRules extends readonly ProviderFormRule[]> = {
  [TRule in TRules[number] as TRule["field"]]: TRule["value"];
};

interface ProviderContext<TConfig = Record<string, unknown>> {
  config: TConfig;
  signal?: AbortSignal;
  /** 宿主直接注入工具，供应商无需 import；FFmpeg 为按需安装的插件能力。 */
  tool: ProviderTools;
}

interface MediaRequest {
  model: string;
  /** 仅放供应商专属参数；公共字段的映射与支持范围由供应商校验。 */
  other?: Record<string, unknown>;
}

/** 抽象层的媒体来源；供应商负责转换为平台需要的 URL、文件或字节。 */
type MediaInput =
  | { type: "url"; url: string; mimeType?: string }
  | { type: "base64"; data: string; mimeType: string }
  | { type: "binary"; data: Uint8Array; mimeType: string };

type MediaAsset = MediaInput & { mediaType: "image" | "video" | "audio" };

interface AudioConvertOptions {
  format: "wav" | "mp3";
  /** 裁剪起点，单位秒，含边界；缺省为 0。 */
  startSeconds?: number;
  /** 裁剪终点，单位秒，不含边界；缺省为音频末尾。 */
  endSeconds?: number;
  /** 目标采样率；缺省保持原采样率。 */
  sampleRate?: number;
  /** mp3 比特率，单位 kbps；缺省 128，仅 format 为 mp3 时生效。 */
  bitrateKbps?: number;
}

/** FFmpeg 仅开放结构化转换选项，不接受文件路径、URL 或任意命令参数。 */
interface FfmpegConvertOptions {
  /** png、jpeg 输出裁剪起点处的单张图片。 */
  format: "mp4" | "webm" | "wav" | "mp3" | "aac" | "ogg" | "flac" | "png" | "jpeg" | "gif";
  /** 裁剪起点，单位秒；缺省为 0。 */
  startSeconds?: number;
  /** 裁剪终点，单位秒；缺省为媒体末尾。 */
  endSeconds?: number;
  /** 目标宽度，2～8192；MP4/WebM 须为偶数。只填宽或高时按比例缩放。 */
  width?: number;
  /** 目标高度，2～8192；MP4/WebM 须为偶数。 */
  height?: number;
  /** 画面翻转：hflip 左右镜像，vflip 上下镜像；不支持其他滤镜或纯音频输出。 */
  vf?: "hflip" | "vflip";
  /** 输出帧率，1～120；不适用于纯音频输出。 */
  fps?: number;
  /** false 去掉声音，仅用于视频或 GIF 输出。 */
  audio?: boolean;
  /** 音频采样率，单位 Hz。 */
  sampleRate?: number;
  channels?: 1 | 2;
  /** 音频比特率，单位 kbps。 */
  bitrateKbps?: number;
}

/** 缺少可用 FFmpeg 时抛出；由宿主前端询问下载安装，供应商应继续向上抛出。 */
interface FfmpegRequiredError extends Error {
  name: "FfmpegRequiredError";
  code: "FFMPEG_REQUIRED";
  status: 424;
}

interface ProviderTools {
  fetch: typeof globalThis.fetch;
  hash: typeof Bun.hash;
  image: typeof Bun.Image;
  /**
   * 音频裁剪转码；仅接受 WAV 格式的内存字节并返回处理后的内存字节，不支持文件路径、URL 或其他压缩格式输入。
   */
  audio: {
    convert(input: Uint8Array, options: AudioConvertOptions): Promise<{ data: Uint8Array; mimeType: string }>;
  };
  /**
   * 只接收、返回内存字节，不提供文件、URL 或任意 FFmpeg 参数操作。
   * 宿主始终注入此接口，但不保证已安装 FFmpeg；仅调用 convert 时检测。
   * 缺失时抛出 FfmpegRequiredError，并通知在线前端询问下载；不会后台自动安装。
   * 安装后由用户重新发起操作，供应商不要捕获此错误后自动重试完整生成请求。
   * 输入、输出均限 100 MB；处理最长 5 分钟，响应 this.signal 的取消。
   * 输入须支持管道读取；moov 位于尾部等需要 seek 的普通 MP4 可能无法处理。
   * @throws {FfmpegRequiredError} 未安装或当前设置未找到可用的 FFmpeg。
   * @example await this.tool.ffmpeg.convert(bytes, { format: "mp4", width: 1280, audio: false });
   * @example await this.tool.ffmpeg.convert(bytes, { format: "png", vf: "hflip" });
   */
  ffmpeg: {
    convert(input: Uint8Array, options: FfmpegConvertOptions): Promise<{ data: Uint8Array; mimeType: string }>;
  };
}

interface ImageRequest extends MediaRequest {
  prompt: string;
  /** 参考图。 */
  images?: MediaInput[];
  mask?: MediaInput;
  /** 生成数量。 */
  n?: number;
  /** 画面宽高比，如 16:9。 */
  ratio?: string;
  /** 输出尺寸，如 1K、2K、4K 或 1024x1024；具体格式由供应商转换。 */
  size?: string;
  /** 画质档位，如 low、medium、high，由供应商映射。 */
  quality?: string;
  /** 输出编码格式，如 png、jpeg、webp。 */
  outputFormat?: string;
}

interface VideoRequest extends MediaRequest {
  prompt: string;
  /** 当前生成模式；参考模式数组声明各类参考媒体数量上限。 */
  mode?: VideoMode;
  /** 参考图；首尾帧通过 firstFrame、lastFrame 单独传入。 */
  images?: MediaInput[];
  videos?: MediaInput[];
  audios?: MediaInput[];
  firstFrame?: MediaInput;
  lastFrame?: MediaInput;
  /** 输出时长，单位秒；支持范围由供应商按模型校验。 */
  duration?: number;
  /** 画面宽高比，如 16:9。 */
  ratio?: string;
  /** 分辨率档位，如 720p、1080p。 */
  resolution?: string;
  generateAudio?: boolean;
  watermark?: boolean;
}

interface AudioRequest extends MediaRequest {
  text: string;
  audios?: MediaInput[];
  /** 音色标识，由供应商映射到平台的音色参数。 */
  voice?: string;
  /** 语速倍率，1 为正常语速。 */
  speed?: number;
  /** 音量增益，单位 dB，0 为原始音量。 */
  volume?: number;
  /** 输出编码格式，如 mp3、wav、pcm。 */
  format?: string;
  /** 输出采样率，单位 Hz。 */
  sampleRate?: number;
}

/**
 * 三种生成函数统一返回最终媒体数组，不能返回任务 ID 或原始平台响应。
 * ACT: 本层只约定完整结果；供应商内部处理轮询/流读取，失败时抛出异常。
 */
type GenerateMedia<TRequest, TConfig = Record<string, unknown>> = (
  this: ProviderContext<TConfig>,
  request: TRequest,
) => Promise<MediaAsset[]>;

interface ProviderUpdateInfo {
  hasUpdate: boolean;
  latestVersion: string;
  notice: string;
}

interface ProviderDefinition<TRules extends readonly ProviderFormRule[] = readonly ProviderFormRule[]> {
  id: string;
  label: string;
  /** 适配文件版本，独立于模型版本；新增供应商应填写，缺省仅兼容旧文件。 */
  version?: string;
  apiUrl?: string;
  protocol?: "openai-completions" | "openai-responses" | "anthropic-messages";
  /** 厂商说明的 Markdown 内容。 */
  readme?: string;
  rules: TRules;
  models: ProviderModel[];
  /** 检查供应商适配文件是否有更新。 */
  checkForUpdates?: (this: ProviderContext<ProviderConfig<TRules>>) => Promise<ProviderUpdateInfo>;
  /** 获取更新文件的完整源码；写入与应用由宿主负责。 */
  updateVendor?: (this: ProviderContext<ProviderConfig<TRules>>) => Promise<string>;
  /** 未实现的方法保持缺省，调用方据此判断能力是否可用。 */
  generateImage?: GenerateMedia<ImageRequest, ProviderConfig<TRules>>;
  generateVideo?: GenerateMedia<VideoRequest, ProviderConfig<TRules>>;
  generateAudio?: GenerateMedia<AudioRequest, ProviderConfig<TRules>>;
}
