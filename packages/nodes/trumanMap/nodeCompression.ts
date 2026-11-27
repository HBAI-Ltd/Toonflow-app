import { constants, zstdCompressSync } from "node:zlib";
import { resolve } from "node:path";
import { createContext, runInContext } from "node:vm";
import { decompress } from "fzstd";
import { build, type Plugin } from "vite";

const alphabet = Array.from({ length: 94 }, (_, index) => String.fromCharCode(index + 33)).filter(char => !"\"'`\\".includes(char)).join("");

export function compressNode(): Plugin {
  let root = "";
  return {
    name: "compressTrumanMap",
    enforce: "post",
    configResolved(config) { root = config.root; },
    async generateBundle(_options, bundle) {
      const chunk = bundle["trumanMap.umd.js"];
      if (!chunk || chunk.type !== "chunk") throw new Error("未生成 TrumanMap 节点脚本");
      const source = chunk.code;
      const raw = Buffer.from(source, "utf8");
      // zstd 22 级单帧（窗口覆盖整份脚本、帧头写入原长）：跨模块的重复几何代码比 gzip 32KB 窗口多压约两成；Node/Bun 内置编码，fzstd 同步解码。
      const compressed = zstdCompressSync(raw, { params: { [constants.ZSTD_c_compressionLevel]: 22, [constants.ZSTD_c_contentSizeFlag]: 1 } });
      if (Buffer.compare(decompress(compressed), raw)) throw new Error("zstd 压缩结果无法被 fzstd 原样还原");
      const encoded: string[] = [];
      let buffer = 0;
      let bits = 0;
      // 90 个无需 JS 转义的 ASCII 字符，每对承载 12 或 13 位。
      for (const byte of compressed) {
        buffer |= byte << bits;
        bits += 8;
        if (bits > 12) {
          const count = (buffer & 4095) > 4003 ? 12 : 13;
          const value = buffer & (1 << count) - 1;
          encoded.push(alphabet[value % 90]!, alphabet[Math.floor(value / 90)]!);
          buffer >>>= count;
          bits -= count;
        }
      }
      if (bits) {
        encoded.push(alphabet[buffer % 90]!);
        if (bits > 7 || buffer >= 90) encoded.push(alphabet[Math.floor(buffer / 90)]!);
      }
      // ACT: 脚手架在压缩后添加明文安装头并校验最终文件大小；这里只打包本次构建的可信 UMD。
      // 同步解包以兼容旧宿主的 script.onload 注册协议；需要宿主允许动态脚本执行。
      // 宿主按脚本文本是否含 toonflowTiptapHost 决定先加载 marked/DOMPurify；压缩会藏住这个标记，解包器需显式引用它。
      const tiptapHost = source.includes("toonflowTiptapHost");
      const entry = resolve(root, "trumanMapCompressedEntry.js");
      const result = await build({
        root,
        configFile: false,
        logLevel: "silent",
        plugins: [{
          name: "trumanMapCompressedEntry",
          resolveId: id => id === entry ? entry : undefined,
          load: id => id === entry ? `
            import { decompress } from "fzstd";
            const alphabet = ${JSON.stringify(alphabet)};
            const payload = ${JSON.stringify(encoded.join(""))};
            const bytes = new Uint8Array(${compressed.length});
            const digits = new Uint8Array(128);
            for (let index = 0; index < alphabet.length; index++) digits[alphabet.charCodeAt(index)] = index;
            let value = -1, buffer = 0, bits = 0, output = 0;
            for (const char of payload) {
              const digit = digits[char.charCodeAt(0)];
              if (value < 0) { value = digit; continue; }
              value += digit * 90;
              buffer |= value << bits;
              bits += (value & 4095) > 4003 ? 12 : 13;
              while (bits > 7) {
                bytes[output++] = buffer & 255;
                buffer >>>= 8;
                bits -= 8;
              }
              value = -1;
            }
            if (value >= 0) bytes[output] = (buffer | value << bits) & 255;
            if (!globalThis.toonflowNodeHost) throw new Error("请在 Toonflow 画布中加载 TrumanMap");
            ${tiptapHost ? `if (!globalThis.toonflowTiptapHost) throw new Error("宿主未提前加载 toonflowTiptapHost（marked/DOMPurify），无法加载 TrumanMap");` : ""}
            const component = new Function(new TextDecoder("utf-8", { fatal: true }).decode(decompress(bytes)) + "\\nreturn globalThis.toonflowNodes.trumanMap;\\n//# sourceURL=trumanMap.unpacked.js")();
            if (!component || !["object", "function"].includes(typeof component)) throw new Error("TrumanMap 解包后未注册节点组件");
          ` : undefined,
        }],
        build: {
          write: false,
          minify: true,
          sourcemap: false,
          lib: { entry, name: "trumanMapCompressed", formats: ["iife"] },
        },
      });
      const outputs = (Array.isArray(result) ? result : [result]).flatMap(item => "output" in item ? item.output : []);
      if (outputs.length !== 1 || outputs[0]?.type !== "chunk") throw new Error("节点解包器构建失败");
      const loader = outputs[0].code;
      if (tiptapHost && !loader.includes("toonflowTiptapHost")) throw new Error("节点解包器缺少 toonflowTiptapHost 预加载标记");
      // 在隔离上下文里跑一遍真实解包器，确认还原出的脚本与压缩前逐字节一致，避免把坏包发布出去。
      let unpacked: string | undefined;
      const sandbox = createContext({ toonflowNodeHost: {}, toonflowTiptapHost: {}, TextDecoder, Function: function (code: string) { unpacked = code; return () => ({}); } });
      runInContext(loader, sandbox, { filename: "trumanMapLoaderCheck.js" });
      if (unpacked !== `${source}\nreturn globalThis.toonflowNodes.trumanMap;\n//# sourceURL=trumanMap.unpacked.js`) throw new Error("节点解包器还原的脚本与构建结果不一致");
      chunk.code = loader;
      this.info(`原始 ${raw.length} 字节，zstd ${compressed.length} 字节，解包器 ${Buffer.byteLength(loader, "utf8")} 字节`);
    },
  };
}
