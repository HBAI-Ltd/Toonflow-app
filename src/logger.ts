import * as fs from "fs";
import * as path from "path";
import getPath from "@/utils/getPath";

type LogLevel = "log" | "info" | "warn" | "error" | "debug";
type ConsoleMethod = (...args: unknown[]) => void;

const LOG_DIR = getPath("logs");
const LOG_FILE = path.join(LOG_DIR, "app.log");
const MAX_SIZE = 100 * 1024 * 1024;
const LEVELS: LogLevel[] = ["log", "info", "warn", "error", "debug"];

class Logger {
  private stream: fs.WriteStream | null = null;
  private originalConsole: Partial<Record<LogLevel, ConsoleMethod>> = {};
  private originalStdoutWrite: typeof process.stdout.write | null = null;
  private originalStderrWrite: typeof process.stderr.write | null = null;
  private isHijacked = false;

  init(): this {
    if (!fs.existsSync(LOG_DIR)) fs.mkdirSync(LOG_DIR, { recursive: true });
    this.stream = fs.createWriteStream(LOG_FILE, { flags: "a" });
    this.hijack();
    return this;
  }

  private formatTime(): string {
    const d = new Date();
    const p = (n: number, l = 2) => String(n).padStart(l, "0");
    return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}.${p(
      d.getMilliseconds(),
      3,
    )}`;
  }

  private stringify(arg: unknown): string {
    if (arg == null) return String(arg);
    if (arg instanceof Error) return `${arg.message}\n${arg.stack || ""}`;
    if (typeof arg === "object") {
      try {
        return JSON.stringify(arg);
      } catch {
        return String(arg);
      }
    }
    return String(arg);
  }

  private writing = false;
  private rotating = false;

  private write(level: LogLevel, args: unknown[]): void {
    const line = `[${this.formatTime()}] [${level.toUpperCase()}] ${args.map((a) => this.stringify(a)).join(" ")}\n`;
    if (this.stream && !this.stream.destroyed) this.stream.write(line);
    this.checkRotate();
  }

  private writeRaw(chunk: any): void {
    if (this.writing) return;
    this.writing = true;
    try {
      let str = typeof chunk === "string" ? chunk : chunk?.toString?.("utf-8") ?? "";
      str = str.replace(/\x1B\[\d*m/g, ""); // 去除 ANSI 颜色码
      if (str.trim() && this.stream && !this.stream.destroyed) this.stream.write(str.endsWith("\n") ? str : str + "\n");
    } finally {
      this.writing = false;
    }
  }

  private checkRotate(): void {
    if (this.rotating) return;
    try {
      if (!fs.existsSync(LOG_FILE) || fs.statSync(LOG_FILE).size < MAX_SIZE) return;
      this.rotating = true;
      this.stream?.end();

      // 使用流式读取截断，避免将整个日志文件加载到内存
      const ROTATE_SUFFIX = ".old";
      const oldFile = LOG_FILE + ROTATE_SUFFIX;
      fs.renameSync(LOG_FILE, oldFile);

      // 读取后半部分：先获取总行数的大致位置，然后流式跳过前半部分
      const totalSize = fs.statSync(oldFile).size;
      const startByte = totalSize >>> 1;

      const readFd = fs.openSync(oldFile, "r");
      const writeStream = fs.createWriteStream(LOG_FILE, { flags: "w" });

      // 从中间位置开始找第一个换行符
      const seekBuf = Buffer.alloc(4096);
      let offset = startByte;
      let foundNewline = false;
      while (!foundNewline) {
        const bytesRead = fs.readSync(readFd, seekBuf, 0, seekBuf.length, offset);
        if (bytesRead === 0) break;
        for (let i = 0; i < bytesRead; i++) {
          if (seekBuf[i] === 0x0A) { // '\n'
            offset += i + 1;
            foundNewline = true;
            break;
          }
        }
        if (!foundNewline) offset += bytesRead;
      }

      // 从找到的位置开始，将剩余内容通过管道写入新文件
      const readStream = fs.createReadStream(oldFile, { start: offset, fd: readFd, autoClose: true });
      readStream.pipe(writeStream).on("finish", () => {
        try { fs.unlinkSync(oldFile); } catch {}
        this.stream = fs.createWriteStream(LOG_FILE, { flags: "a" });
        this.rotating = false;
      }).on("error", () => {
        this.stream = fs.createWriteStream(LOG_FILE, { flags: "a" });
        this.rotating = false;
      });
    } catch {
      try {
        this.stream = fs.createWriteStream(LOG_FILE, { flags: "a" });
      } catch {}
      this.rotating = false;
    }
  }

  private hijack(): void {
    if (this.isHijacked) return;
    // 劫持 console 方法
    for (const level of LEVELS) {
      const original = console[level];
      if (typeof original !== "function") continue;
      this.originalConsole[level] = original.bind(console);
      (console as any)[level] = (...args: unknown[]) => {
        if (this.writing) {
          this.originalConsole[level]!(...args);
          return;
        }
        this.writing = true;
        try {
          this.write(level, args);
        } catch (err) {
          this.originalConsole.error?.("[Logger Error]", err);
        }
        this.writing = false;

        this.originalConsole[level]!(...args);
      };
    }

    // 劫持 stdout/stderr（捕获 morgan 等直接写 stdout 的输出）
    this.originalStdoutWrite = process.stdout.write.bind(process.stdout);
    this.originalStderrWrite = process.stderr.write.bind(process.stderr);

    process.stdout.write = ((chunk: any, ...rest: any[]) => {
      this.writeRaw(chunk);
      return this.originalStdoutWrite!(chunk, ...rest);
    }) as typeof process.stdout.write;

    process.stderr.write = ((chunk: any, ...rest: any[]) => {
      this.writeRaw(chunk);
      return this.originalStderrWrite!(chunk, ...rest);
    }) as typeof process.stderr.write;

    this.isHijacked = true;
  }

  /** 导出日志内容 */
  exportLogs(): string {
    if (!fs.existsSync(LOG_FILE)) return "";
    return fs.readFileSync(LOG_FILE, "utf-8");
  }

  /** 清空日志 */
  clear(): void {
    this.stream?.end();
    if (fs.existsSync(LOG_FILE)) fs.unlinkSync(LOG_FILE);
    this.stream = fs.createWriteStream(LOG_FILE, { flags: "a" });
  }

  /** 关闭日志 */
  close(): void {
    if (this.isHijacked) {
      for (const level of LEVELS) {
        const original = this.originalConsole[level];
        if (original) (console as any)[level] = original;
      }
      this.originalConsole = {};
      if (this.originalStdoutWrite) process.stdout.write = this.originalStdoutWrite;
      if (this.originalStderrWrite) process.stderr.write = this.originalStderrWrite;
      this.originalStdoutWrite = null;
      this.originalStderrWrite = null;
      this.isHijacked = false;
    }
    this.stream?.end();
    this.stream = null;
  }
}

const logger = new Logger().init();
export default logger;
