import { lstat, open, stat } from "node:fs/promises";
import { extname } from "node:path";
import { ffmpegMethods, type FfmpegPlan, type FfmpegStep } from "./types";

// ACT: 允许普通媒体解复用器，清单、设备与协议嵌套不属于此接口；这不是原生进程沙箱。
export const inputFormats = ["mov", "matroska", "webm", "avi", "mpeg", "mpegts", "flv", "wav", "mp3", "aac", "ogg", "flac", "png_pipe", "jpeg_pipe", "webp_pipe", "bmp_pipe", "tiff_pipe", "gif", "apng"];
const outputFormats = new Set(["mp4", "mov", "matroska", "webm", "avi", "mpeg", "mpegts", "flv", "wav", "mp3", "adts", "ogg", "flac", "image2", "image2pipe", "gif", "apng", "webp", "rawvideo", "s16le", "f32le", "null"]);
const outputExtensions = new Set(".mp4 .m4a .m4v .mov .mkv .webm .avi .mpeg .mpg .ts .flv .wav .mp3 .aac .ogg .opus .flac .png .jpg .jpeg .bmp .tif .tiff .gif .webp .apng .avif .heic .ico .raw .pcm .yuv".split(" "));
const safeFilters = new Set((
  "null anull nullsink anullsink split asplit crop cropdetect pad scale scale2ref zscale format aformat fps framerate framestep " +
  "setsar setdar setpts asetpts settb asettb trim atrim select aselect concat overlay xfade acrossfade blend tblend " +
  "hflip vflip transpose rotate perspective zoompan tile untile tpad apad loop aloop reverse areverse " +
  "fade afade drawbox drawgrid delogo color colorchannelmixer colorbalance colorcontrast colorcorrect colorlevels colorspace colortemperature " +
  "hue eq negate lut lutrgb lutyuv lut2 tlut2 histogram normalize monochrome vibrance unsharp smartblur boxblur gblur avgblur median noise " +
  "yadif bwdif w3fdif field fieldorder separatefields weave doubleweave interlace pullup decimate mpdecimate deflicker " +
  "vstack hstack xstack alphamerge alphaextract premultiply unpremultiply chromakey colorkey despill lenscorrection vignette " +
  "amix amerge join pan channelsplit channelmap aresample asetrate atempo rubberband volume loudnorm dynaudnorm alimiter acompressor " +
  "acompressor sidechaincompress sidechaingate agate adelay aecho afir equalizer superequalizer bass treble highpass lowpass bandpass bandreject " +
  "allpass crossover anequalizer biquad deesser adeclick adeclip afftdn anlmdn anullsrc sine anoisesrc silenceremove silencedetect " +
  "earwax stereotools stereowiden extrastereo surround apulsator aphaser flanger chorus tremolo vibrato compand mcompand aeval aevalsrc " +
  "astats aspectralstats volumedetect replaygain ebur128 ashowinfo showinfo showwaves showwavespic showspectrum showspectrumpic showfreqs showvolume " +
  "vectorscope waveform palettegen dither thumbnail blackdetect blackframe freezedetect bench abench setrange squeeze pseudocolor"
).split(/\s+/));
const fileFilters = new Set(["subtitles", "ass", "drawtext"]);
const plainMethods = new Set<string>(ffmpegMethods);
const textValue = /^[^\u0000-\u001f\u007f]*$/;
const word = /^[A-Za-z0-9_+.:-]+$/;
const time = /^-?(?:\d+(?:\.\d+)?|\d{1,3}:\d{2}(?::\d{2}(?:\.\d+)?)?)$/;
const label = /^[A-Za-z0-9_:.+-]+$/;

function fail(message: string): never {
  throw new Error(`FFmpeg：${message}`);
}

function string(value: unknown, name: string): string {
  if (typeof value !== "string" || !value || !textValue.test(value)) fail(`${name} 必须是非空且不包含控制字符的字符串`);
  return value;
}

function scalar(value: unknown, name: string): string {
  if (typeof value === "number" && Number.isFinite(value)) return String(value);
  return string(value, name);
}

function record(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === "object" && !Array.isArray(value) && (Object.getPrototypeOf(value) === Object.prototype || Object.getPrototypeOf(value) === null);
}

// FFmpeg 的引号内反斜杠是字面量；在外部它转义下一个字符。不得按逗号正则拆 filtergraph。
function scan(value: string, separator: (character: string) => boolean) {
  let quoted = false;
  const positions: number[] = [];
  for (let index = 0; index < value.length; index++) {
    const character = value[index]!;
    if (quoted) {
      if (character === "'") quoted = false;
    } else if (character === "\\") {
      if (++index >= value.length) fail("滤镜末尾有未完成的转义");
    } else if (character === "'") quoted = true;
    else if (separator(character)) positions.push(index);
  }
  if (quoted) fail("滤镜包含未闭合的单引号");
  return positions;
}

function split(value: string, separators: string) {
  const positions = [...scan(value, character => separators.includes(character)), value.length];
  let start = 0;
  return positions.map(end => {
    const part = value.slice(start, end);
    start = end + 1;
    return part;
  });
}

function decode(value: string) {
  let result = "";
  let quoted = false;
  for (let index = 0; index < value.length; index++) {
    const character = value[index]!;
    if (quoted) {
      if (character === "'") quoted = false;
      else result += character;
    } else if (character === "'") quoted = true;
    else if (character === "\\") {
      if (++index >= value.length) fail("滤镜末尾有未完成的转义");
      result += value[index];
    } else result += character;
  }
  if (quoted) fail("滤镜包含未闭合的单引号");
  return result;
}

function encode(value: unknown) {
  const option = scalar(value, "滤镜参数").replace(/[\\':]/g, "\\$&");
  return option.replace(/[\\'\[\],;]/g, "\\$&");
}

function labels(value: unknown) {
  if (value === undefined) return "";
  return (Array.isArray(value) ? value : [value]).map(item => {
    const name = string(item, "流标签").replace(/^\[([^\[\]]+)\]$/, "$1");
    if (!label.test(name)) fail(`无效的流标签：${name}`);
    return `[${name}]`;
  }).join("");
}

function validateGraph(value: string, structuredFile = false) {
  for (const raw of split(value, ",;")) {
    let part = raw.trim();
    if (!part) fail("滤镜图中存在空滤镜");
    while (part.startsWith("[")) {
      const end = part.indexOf("]");
      if (end < 0 || !label.test(part.slice(1, end))) fail("滤镜输入标签不合法");
      part = part.slice(end + 1).trimStart();
    }
    const match = /^([A-Za-z0-9_]+)(?:@[A-Za-z0-9_]+)?/.exec(part);
    if (!match) fail("滤镜名称不合法");
    const name = match[1]!;
    if (!safeFilters.has(name) && !(structuredFile && fileFilters.has(name))) fail(fileFilters.has(name) ? `${name} 请使用结构化 options 对象声明文件路径` : `尚未审查滤镜 ${name} 的文件访问能力`);
    part = part.slice(match[0].length).trimStart();
    const outputStart = scan(part, character => character === "[" || character === "]")[0] ?? part.length;
    const argument = part.slice(0, outputStart).trim();
    const outputs = part.slice(outputStart);
    if (outputs && !/^(?:\[[A-Za-z0-9_:.+-]+\]\s*)+$/.test(outputs)) fail("滤镜输出标签不合法");
    if (argument && !argument.startsWith("=")) fail("滤镜名称后只能跟参数或输出标签");
    if (argument) {
      // 两层转义：filtergraph -> AVOption；/key=file 会让 CLI 自行读取文件，必须拒绝。
      for (const option of split(decode(argument.slice(1)), ":")) {
        const key = decode(option).split("=", 1)[0]!.trim();
        if (key.startsWith("/")) fail("不支持 /参数名=文件 的隐式文件读取，请通过结构化文件参数传入");
      }
    }
  }
  return value;
}

async function resolveFile(path: unknown, resolvePath: (path: string) => Promise<string>, output = false) {
  const relative = string(path, "文件路径").replace(/\\/g, "/");
  if (relative.startsWith("/") || /[:<>|?*%]/.test(relative) || relative.split("/").some(part => !part || part === "." || part === "..")) fail("文件路径必须是工作区内的相对路径，不能包含协议、目录跳转或文件序列通配符");
  const absolutePath = await resolvePath(relative);
  if (output) {
    if (!outputExtensions.has(extname(relative).toLowerCase())) fail("输出扩展名必须对应普通媒体文件，不能使用播放清单、序列或设备格式");
    const existing = await lstat(absolutePath).catch((error: NodeJS.ErrnoException) => {
      if (error.code !== "ENOENT") throw error;
      return null;
    });
    if (existing) fail(`输出文件已经存在，请使用新文件名：${relative}`);
  } else if (!(await stat(absolutePath)).isFile()) fail(`输入不是普通文件：${relative}`);
  return { path: relative, absolutePath };
}

async function filter(value: unknown, resolvePath: (path: string) => Promise<string>): Promise<string> {
  if (typeof value === "string") return validateGraph(string(value, "滤镜"));
  if (!record(value) || typeof value.filter !== "string" || Object.keys(value).some(key => !["filter", "options", "inputs", "outputs"].includes(key))) fail("滤镜必须是字符串或 { filter, options, inputs, outputs } 对象");
  const name = value.filter;
  if (!/^[A-Za-z0-9_]+$/.test(name) || (!safeFilters.has(name) && !fileFilters.has(name))) fail(`尚未审查滤镜 ${name} 的文件访问能力`);
  let options = value.options;
  if (fileFilters.has(name)) {
    if (!record(options)) fail(`${name} 必须使用结构化 options 对象`);
    options = { ...options };
    const settings = options as Record<string, unknown>;
    const fileKeys = name === "drawtext" ? ["fontfile", "textfile"] : ["filename"];
    const allowed = name === "drawtext"
      ? new Set("fontfile textfile text font fontcolor fontcolor_expr fontsize x y line_spacing text_align box boxcolor boxborderw boxw boxh borderw bordercolor shadowx shadowy shadowcolor alpha expansion start_number reload fix_bounds text_shaping ft_load_flags tabsize basetime enable y_align".split(" "))
      : new Set("filename original_size charenc stream_index si alpha force_style wrap_unicode".split(" "));
    if (Object.keys(settings).some(key => !allowed.has(key))) fail(`${name} 包含不支持的参数（fontsdir 等目录读取不对外开放）`);
    if (settings.font !== undefined && !/^[\p{L}\p{N} _-]+$/u.test(string(settings.font, "字体家族"))) fail("font 只能是字体家族名；指定字体文件请使用 fontfile");
    if (name !== "drawtext" && settings.filename === undefined) fail(`${name} 必须指定 filename`);
    for (const key of fileKeys) {
      if (settings[key] === undefined) continue;
      const resolved = await resolveFile(settings[key], resolvePath);
      if (key === "filename") {
        const extension = extname(resolved.path).toLowerCase();
        const file = await open(resolved.absolutePath, "r");
        let contents: string;
        try {
          const head = Buffer.alloc(4096);
          const { bytesRead } = await file.read(head, 0, head.length, 0);
          contents = head.toString("utf8", 0, bytesRead).replace(/^\uFEFF/, "").trimStart();
        } finally { await file.close(); }
        const valid = [".ass", ".ssa"].includes(extension) ? /^\[Script Info\]/i.test(contents)
          : name === "subtitles" && extension === ".srt" ? /^(?:\d+\s*\r?\n)?\d{2,}:\d{2}:\d{2}[,.]\d{3}\s+-->\s+\d{2,}:\d{2}:\d{2}[,.]\d{3}/.test(contents)
          : name === "subtitles" && extension === ".vtt" && /^WEBVTT(?:\s|$)/.test(contents);
        if (!valid) fail("字幕必须是内容与扩展名一致的 SRT、ASS、SSA 或 WebVTT 文本，不能是媒体清单");
      }
      settings[key] = resolved.absolutePath;
    }
  }
  let encoded = "";
  if (options !== undefined) {
    if (record(options)) {
      encoded = Object.entries(options).map(([key, item]) => {
        if (!/^[A-Za-z0-9_]+$/.test(key)) fail(`滤镜参数名不合法：${key}`);
        return `${key}=${encode(item)}`;
      }).join(":");
    } else if (Array.isArray(options)) encoded = options.map(encode).join(":");
    else encoded = scalar(options, "滤镜参数");
  }
  return validateGraph(`${labels(value.inputs)}${name}${encoded ? `=${encoded}` : ""}${labels(value.outputs)}`, fileFilters.has(name));
}

function options(args: unknown[], input: boolean) {
  const values = args.length === 1 && Array.isArray(args[0]) ? args[0] : args;
  const tokens: string[] = [];
  for (const value of values) {
    const token = string(value, "命令参数");
    const pair = /^(-[A-Za-z0-9_:.-]+)[ \t]+([\s\S]+)$/.exec(token);
    if (pair) tokens.push(pair[1]!, pair[2]!);
    else tokens.push(token);
  }
  const result: string[] = [];
  for (let index = 0; index < tokens.length; index++) {
    const flag = tokens[index]!;
    if (!input && ["-an", "-vn", "-sn", "-dn", "-shortest", "-copyts", "-start_at_zero"].includes(flag)) {
      result.push(flag);
      continue;
    }
    const value = tokens[++index];
    if (!value) fail(`参数 ${flag} 缺少值`);
    let valid = false;
    if (["-ss", "-sseof", "-t", "-to", "-itsoffset"].includes(flag)) valid = time.test(value);
    else if (input && ["-stream_loop", "-loop", "-thread_queue_size", "-probesize", "-analyzeduration", "-fpsprobesize"].includes(flag)) valid = /^-?\d+$/.test(value);
    else if (input && ["-r", "-framerate", "-itsscale"].includes(flag)) valid = /^\d+(?:\.\d+)?(?:\/\d+)?$/.test(value);
    else if (flag === "-f") valid = (input ? inputFormats : [...outputFormats]).includes(value);
    else if (!input && flag === "-map") valid = /^(?:-?\d+(?::[vasdt](?::\d+)?)?\??|\[[A-Za-z0-9_:.+-]+\])$/.test(value);
    else if (!input && /^-metadata(?::[sgpcvasdt](?::\d+)*)?$/.test(flag)) valid = /^[A-Za-z0-9_.-]+=/.test(value);
    else if (!input && /^-(?:c|codec|b|r|s|pix_fmt|sample_fmt|ac|ar|threads|q|qscale|profile|level|preset|tune|disposition)(?::[vasdt](?::\d+)?)?$/.test(flag)) valid = word.test(value);
    else if (!input && ["-crf", "-maxrate", "-minrate", "-bufsize", "-g", "-keyint_min", "-sc_threshold", "-bf", "-refs", "-compression_level", "-qmin", "-qmax", "-vsync", "-fps_mode", "-movflags", "-fflags", "-flags", "-flags2", "-color_range", "-colorspace", "-color_primaries", "-color_trc", "-chroma_sample_location", "-filter_threads", "-filter_complex_threads", "-frames:v", "-frames:a", "-vframes", "-aframes", "-video_track_timescale", "-avoid_negative_ts", "-max_muxing_queue_size"].includes(flag)) valid = word.test(value);
    else if (!input && ["-map_metadata", "-map_chapters"].includes(flag)) valid = /^-?\d+$/.test(value);
    if (!valid) fail(`参数 ${flag} 未开放或值不合法；滤镜请使用 videoFilters、audioFilters 或 complexFilter`);
    result.push(flag, value);
  }
  return result;
}

export async function preparePlan(plan: FfmpegPlan, resolvePath: (path: string) => Promise<string>): Promise<{ steps: FfmpegStep[]; outputs: { path: string; absolutePath: string }[]; probeIndex?: number }> {
  if (!record(plan) || Object.keys(plan).some(key => key !== "steps") || !Array.isArray(plan.steps) || !plan.steps.length || plan.steps.length > 512) fail("plan.steps 必须包含 1 至 512 个链式调用");
  const steps: FfmpegStep[] = [];
  const outputs: { path: string; absolutePath: string }[] = [];
  let inputs = 0;
  let probeIndex: number | undefined;
  for (const [index, item] of plan.steps.entries()) {
    if (!record(item) || Object.keys(item).some(key => !["method", "args"].includes(key)) || typeof item.method !== "string" || !plainMethods.has(item.method) || !Array.isArray(item.args)) fail("plan 中包含未开放的方法");
    const method = item.method;
    let args: unknown[] = [...item.args];
    if (method === "ffprobe") {
      if (index !== plan.steps.length - 1 || args.length > 1 || (args.length && (!Number.isInteger(args[0]) || (args[0] as number) < 0))) fail("ffprobe(index?) 只能作为最后一个调用");
      probeIndex = args.length ? args[0] as number : 0;
      continue;
    }
    if (method === "input" || method === "output") {
      if (args.length !== 1) fail(`${method} 只接受一个工作区文件路径`);
      const resolved = await resolveFile(args[0], resolvePath, method === "output");
      if (method === "input") inputs++;
      else {
        if (outputs.some(output => output.absolutePath === resolved.absolutePath)) fail("不能重复声明同一个输出文件");
        outputs.push(resolved);
      }
      args = [resolved.absolutePath];
    } else if (method === "inputOptions" || method === "outputOptions") {
      if (method === "inputOptions" && !inputs) fail("请先声明 input 再配置 inputOptions");
      args = [options(args, method === "inputOptions")];
    } else if (method === "complexFilter" || method === "videoFilters" || method === "audioFilters") {
      if (!args.length || (method === "complexFilter" && args.length > 2)) fail(`${method} 参数数量不合法`);
      const values = Array.isArray(args[0]) ? args[0] : method === "complexFilter" ? [args[0]] : args;
      const filters = await Promise.all(values.map(value => filter(value, resolvePath)));
      args = [filters];
      if (method === "complexFilter" && item.args[1] !== undefined) {
        const maps = Array.isArray(item.args[1]) ? item.args[1] : [item.args[1]];
        args.push(maps.map(value => labels(value).slice(1, -1)));
      }
    } else if (method === "noAudio" || method === "noVideo") {
      if (args.length) fail(`${method} 不接受参数`);
    } else {
      if (args.length !== 1 && !(method === "videoBitrate" && args.length === 2 && typeof args[1] === "boolean")) fail(`${method} 参数数量不合法`);
      const value = scalar(args[0], method);
      let valid = false;
      if (method === "inputFormat") valid = !!inputs && inputFormats.includes(value);
      else if (method === "format") valid = outputFormats.has(value);
      else if (["audioCodec", "videoCodec"].includes(method)) valid = /^[A-Za-z0-9_]+$/.test(value);
      else if (["audioBitrate", "videoBitrate"].includes(method)) valid = /^\d+(?:\.\d+)?[kKmMgG]?$/.test(value);
      else if (["audioFrequency", "audioChannels", "frames"].includes(method)) valid = /^\d+$/.test(value) && Number(value) > 0;
      else if (["fps", "inputFps"].includes(method)) valid = /^\d+(?:\.\d+)?(?:\/\d+)?$/.test(value);
      else if (["seekInput", "seekOutput", "duration"].includes(method)) valid = time.test(value);
      else if (method === "size") valid = /^(?:\d+x\d+|\d+x\?|\?x\d+|\d+(?:\.\d+)?%)$/.test(value);
      else if (method === "aspect") valid = /^\d+(?:\.\d+)?(?:[:/]\d+)?$/.test(value);
      if (!valid) fail(`${method} 参数不合法或尚未开放`);
    }
    steps.push({ method, args } as FfmpegStep);
  }
  if (!inputs) fail("至少需要一个 input");
  if (probeIndex !== undefined) {
    if (outputs.length || probeIndex >= inputs || steps.some(step => !["input", "inputFormat"].includes(step.method))) fail("ffprobe 仅接受 input、inputFormat 和有效的输入索引");
  } else if (!outputs.length) fail("至少需要一个 output");
  return { steps, outputs, ...(probeIndex === undefined ? {} : { probeIndex }) };
}
