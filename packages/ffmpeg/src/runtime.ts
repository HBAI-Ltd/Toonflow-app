import ffmpeg from "@renmu/fluent-ffmpeg";
import { lstatSync, realpathSync, statSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, isAbsolute, join, parse, relative, resolve, sep } from "node:path";
import type { Readable } from "node:stream";

type FfmpegInternals = ffmpeg.FfmpegCommand & {
  options: ffmpeg.FfmpegCommandOptions;
  _inputs: { source: string | Readable }[];
  _outputs: { target?: string | NodeJS.WritableStream }[];
};

const require = createRequire(import.meta.url);
const native = ffmpeg.prototype as FfmpegInternals;

/** 原生 fluent 工厂；文件路径相对工作区解析，不修改库的全局原型。 */
export function createFfmpeg(directory: string): typeof ffmpeg {
  const root = realpathSync(directory);
  if (!statSync(root).isDirectory()) throw new Error("FFmpeg 工作区必须是目录");

  function assertWithin(path: string) {
    const offset = relative(root, path);
    if (offset === ".." || offset.startsWith(`..${sep}`) || isAbsolute(offset)) {
      throw Object.assign(new Error("FFmpeg 只能操作当前工作区内的文件"), { status: 403 });
    }
  }

  function resolvePath(path: string, folder = false): string {
    if (!path || /[\x00-\x1f]/.test(path) || (/^[a-z][a-z\d+.-]*:/i.test(path) && !/^[a-z]:[\\/]/i.test(path))) {
      throw new Error("FFmpeg 文件路径无效，不能使用协议或设备路径");
    }
    const target = resolve(root, path);
    assertWithin(target);
    if (process.platform === "win32" && target.slice(parse(target).root.length).split(/[\\/]/).some(part =>
      /[:<>"|?*]|[. ]$/.test(part) || /^(con|prn|aux|nul|com[1-9]|lpt[1-9])(?:\.|$)/i.test(part))) {
      throw new Error("FFmpeg 文件路径无效");
    }
    let parent = target;
    while (true) {
      try {
        const actual = resolve(realpathSync(parent), relative(parent, target));
        assertWithin(actual);
        if (!folder && actual === root) throw new Error("FFmpeg 文件路径不能是工作区根目录");
        return actual;
      } catch (error) {
        if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
        // 悬空链接不能当作普通的待创建文件，缺失父目录则继续检查最近的已有祖先。
        if (lstatSync(parent, { throwIfNoEntry: false })?.isSymbolicLink()) throw new Error("FFmpeg 不能操作悬空符号链接");
        const ancestor = dirname(parent);
        if (ancestor === parent) throw error;
        parent = ancestor;
      }
    }
  }

  function fileArgument<T>(value: T): T {
    if (typeof value === "string") return resolvePath(value) as T;
    if (value && typeof value === "object" && "path" in value) {
      const path = value.path;
      if (typeof path === "string" || Buffer.isBuffer(path)) resolvePath(resolve(String(path)));
    }
    return value;
  }

  function checkFiles(command: FfmpegInternals) {
    command.options.cwd = resolvePath(command.options.cwd ?? root, true);
    for (const input of command._inputs) fileArgument(input.source);
    for (const output of command._outputs) fileArgument(output.target);
  }

  // ACT: 只保护显式文件入口；原始参数、滤镜、清单内的间接 I/O 仍是可信代码，不是进程沙箱。
  const proto = Object.create(native) as FfmpegInternals;
  proto.input = proto.addInput = proto.mergeAdd = function(source) {
    return native.input.call(this, fileArgument(source));
  };
  proto.output = proto.addOutput = function(target, options) {
    return native.output.call(this, fileArgument(target), options);
  };
  proto.clone = function() {
    return Object.setPrototypeOf(native.clone.call(this), proto);
  };
  proto._getArguments = function() {
    checkFiles(this);
    return native._getArguments.call(this);
  };
  proto.ffprobe = function(...args: unknown[]) {
    try { checkFiles(this); }
    catch (error) {
      const callback = args.at(-1);
      if (typeof callback !== "function") throw error;
      callback(error);
      return;
    }
    Reflect.apply(native.ffprobe, this, args);
  };
  proto.screenshots = proto.screenshot = proto.takeScreenshots = proto.thumbnail = proto.thumbnails = function(config, folder) {
    const settings = typeof config === "number" ? { count: config } : { ...config };
    settings.folder = resolvePath(settings.folder ?? folder ?? root, true);
    resolvePath(join(settings.folder, settings.filename || "tn.png"));
    return native.screenshots.call(this, settings);
  };
  proto.concat = proto.concatenate = proto.mergeToFile = function(target, options?: string | { end?: boolean }) {
    return Reflect.apply(native.concat, this, [fileArgument(target), options]);
  };
  proto.preset = proto.usingPreset = function(preset) {
    if (typeof preset === "string") {
      this.options.presets = resolvePath(this.options.presets ?? this.options.preset ?? root, true);
      const path = resolvePath(join(this.options.presets, preset));
      resolvePath(require.resolve(path));
    }
    return native.preset.call(this, preset);
  };

  const factory = function(input?: string | Readable | ffmpeg.FfmpegCommandOptions, options?: ffmpeg.FfmpegCommandOptions) {
    const settings = typeof input === "object" && input && !("readable" in input)
      ? { ...input } : { ...options, source: input as string | Readable | undefined };
    settings.cwd = resolvePath(settings.cwd ?? root, true);
    return Reflect.construct(ffmpeg, [settings], factory);
  } as typeof ffmpeg;
  Object.setPrototypeOf(factory, ffmpeg);
  factory.prototype = proto;
  factory.ffprobe = function(file: string, ...args: unknown[]) {
    const command = factory(file);
    Reflect.apply(command.ffprobe, command, args);
  };
  return factory;
}
