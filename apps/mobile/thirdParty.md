# Android 验证包第三方说明

## jsQR 1.4.0

扫码使用 [jsQR](https://github.com/cozmo/jsQR) 读取摄像头帧或图片中的二维码，未修改上游库。许可证为 Apache-2.0，原文随 APK 保存在 `assets/jsqrLicense.txt`。

## Bun 1.4.2

APK 内置官方 Android ARM64 Bun 1.4.2，位于 `lib/arm64-v8a/libbun.so`，未修改运行时二进制。

- 官方发行包：https://github.com/oven-sh/bun/releases/tag/bun-v1.4.2
- 对应源码：https://github.com/oven-sh/bun/tree/744846f844374847c902b5e7fd59b4342a51ef99
- 本文下方的官方许可说明原文：https://raw.githubusercontent.com/oven-sh/bun/744846f844374847c902b5e7fd59b4342a51ef99/LICENSE.md
- 此版本固定的 WebKit 源码：https://github.com/oven-sh/WebKit/tree/2e2aa2290fac856d6f451ceacb58f7f5b44dd057
- 对应 WebKit LGPL 原文：https://github.com/oven-sh/WebKit/blob/2e2aa2290fac856d6f451ceacb58f7f5b44dd057/Source/JavaScriptCore/COPYING.LIB

Bun 本体采用 MIT，静态链接的 JavaScriptCore/WebKit 等组件保留各自许可证；下方原文保留了上游组件清单、源码和重新链接说明。正式分发时须履行对应组件的许可与重新链接要求。

## GeckoView 157.0.20261005135250

APK 内置 Mozilla 官方 `org.mozilla.geckoview:geckoview-arm64-v8a:157.0.20261005135250`，包含 Gecko 157.0.1 ARM64 内核，未修改上游 SDK 或原生二进制。系统 WebView 能力不足时启用 GeckoView，执行同样的能力预检，通过后加载本机页面；运行时无需下载内核。

- 官方发布包：[Mozilla Maven AAR](https://maven.mozilla.org/maven2/org/mozilla/geckoview/geckoview-arm64-v8a/157.0.20261005135250/geckoview-arm64-v8a-157.0.20261005135250.aar)
- AAR SHA256：`ca83e82e11a15d0881b02206a67a9e0b7210a142fd0f281e8d018e4ae849d9b4`
- 对应源码：[mozilla-release / 737ec77d798755890b062aab541a90d6c75afd19](https://hg.mozilla.org/releases/mozilla-release/rev/737ec77d798755890b062aab541a90d6c75afd19)，版本定位来自官方 [POM 的 SCM tag](https://maven.mozilla.org/maven2/org/mozilla/geckoview/geckoview-arm64-v8a/157.0.20261005135250/geckoview-arm64-v8a-157.0.20261005135250.pom)。
- 主许可证：[Mozilla Public License 2.0](https://www.mozilla.org/en-US/MPL/2.0/)。Gecko 所含第三方组件保留各自许可证，官方许可页资源随内核打入 APK，对应 `about:license`；本项目不删改这些许可资源。

上述精确版本源码链接供接收者获取对应源码；分发时须保留 Mozilla 及内核第三方组件的许可、版权与源码获取说明。

## 打包方案参考

参考 [minapk](https://github.com/jjtseng93/minapk/tree/6bf971d65720b0ed868818e73ac334d344dab5ca) 将 Bun 放入 Android 原生库目录并通过 ProcessBuilder 启动的方式。本验证项目自行实现最小 Activity 与 Windows SDK 构建脚本，不包含 minapk/Buninu 源码、终端或工具二进制。

## Bun 官方 LICENSE.md 原文

Bun itself is MIT-licensed.

## JavaScriptCore

Bun statically links JavaScriptCore (and WebKit) which is LGPL-2 licensed. WebCore files from WebKit are also licensed under LGPL2. Per LGPL2:

> (1) If you statically link against an LGPL’d library, you must also provide your application in an object (not necessarily source) format, so that a user has the opportunity to modify the library and relink the application.

You can find the patched version of WebKit used by Bun here: <https://github.com/oven-sh/webkit>. If you would like to relink Bun with changes:

- `git clone https://github.com/oven-sh/WebKit vendor/WebKit`
- `bun sync-webkit-source` (checks out the version pinned in `WEBKIT_VERSION` in `scripts/build/deps/webkit.ts`)
- `bun run build:local`

This compiles JavaScriptCore, compiles Bun’s `.cpp` bindings for JavaScriptCore (which are the object files using JavaScriptCore) and outputs a new `bun` binary with your changes.

## Linked libraries

Bun statically links these libraries:

| Library | License |
|---------|---------|
| [`boringssl`](https://boringssl.googlesource.com/boringssl/) | [several licenses](https://boringssl.googlesource.com/boringssl/+/refs/heads/master/LICENSE) |
| [`brotli`](https://github.com/google/brotli) | MIT |
| [`libarchive`](https://github.com/libarchive/libarchive) | [several licenses](https://github.com/libarchive/libarchive/blob/master/COPYING) |
| [`lol-html`](https://github.com/cloudflare/lol-html/tree/master/c-api) | BSD 3-Clause |
| [`ls-hpack`](https://github.com/litespeedtech/ls-hpack) | MIT |
| [`ls-qpack`](https://github.com/litespeedtech/ls-qpack) | MIT |
| [`lsquic`](https://github.com/litespeedtech/lsquic) | MIT (portions derived from [Chromium proto-quic](https://github.com/litespeedtech/lsquic/blob/master/LICENSE.chrome), BSD 3-Clause) |
| [`mimalloc`](https://github.com/microsoft/mimalloc) | MIT |
| [`picohttp`](https://github.com/h2o/picohttpparser) | dual-licensed under the Perl License or the MIT License |
| [`zstd`](https://github.com/facebook/zstd) | dual-licensed under the BSD License or GPLv2 license |
| [`simdutf`](https://github.com/simdutf/simdutf) | Apache 2.0 |
| [`tinycc`](https://github.com/tinycc/tinycc) | LGPL v2.1 |
| [`uSockets`](https://github.com/uNetworking/uSockets) | Apache 2.0 |
| [`zlib-ng`](https://github.com/zlib-ng/zlib-ng) | zlib |
| [`c-ares`](https://github.com/c-ares/c-ares) | MIT licensed |
| [`libicu`](https://github.com/unicode-org/icu) 78 | [license here](https://github.com/unicode-org/icu/blob/main/icu4c/LICENSE) |
| [`libbase64`](https://github.com/aklomp/base64/blob/master/LICENSE) | BSD 2-Clause |
| [`libuv`](https://github.com/libuv/libuv) (on Windows) | MIT |
| [`libdeflate`](https://github.com/ebiggers/libdeflate) | MIT |
| [`libjpeg-turbo`](https://github.com/libjpeg-turbo/libjpeg-turbo) | [BSD 3-Clause / IJG / zlib](https://github.com/libjpeg-turbo/libjpeg-turbo/blob/main/LICENSE.md) |
| [`libspng`](https://github.com/randy408/libspng) | BSD 2-Clause |
| [`libwebp`](https://github.com/webmproject/libwebp) | BSD 3-Clause |
| [`highway`](https://github.com/google/highway) | Apache 2.0 |
| [`uucode`](https://github.com/jacobsandlund/uucode) | MIT |
| A fork of [`uWebsockets`](https://github.com/jarred-sumner/uwebsockets) | Apache 2.0 licensed |
| Parts of [Tigerbeetle's IO code](https://github.com/tigerbeetle/tigerbeetle/blob/532c8b70b9142c17e07737ab6d3da68d7500cbca/src/io/windows.zig#L1) | Apache 2.0 licensed |
| `__cxa_thread_atexit` fallback from [LLVM libc++abi](https://github.com/llvm/llvm-project/blob/llvmorg-19.1.0/libcxxabi/src/cxa_thread_atexit.cpp) | Apache 2.0 with LLVM exception |

## Polyfills

For compatibility reasons, the following packages are embedded into Bun's binary and injected if imported.

| Package | License |
|---------|---------|
| [`acorn`](https://github.com/acornjs/acorn) | MIT |
| [`acorn-walk`](https://github.com/acornjs/acorn) | MIT |
| [`assert`](https://npmjs.com/package/assert) | MIT |
| [`browserify-zlib`](https://npmjs.com/package/browserify-zlib) | MIT |
| [`buffer`](https://npmjs.com/package/buffer) | MIT |
| [`constants-browserify`](https://npmjs.com/package/constants-browserify) | MIT |
| [`crypto-browserify`](https://npmjs.com/package/crypto-browserify) | MIT |
| [`domain-browser`](https://npmjs.com/package/domain-browser) | MIT |
| [`events`](https://npmjs.com/package/events) | MIT |
| [`https-browserify`](https://npmjs.com/package/https-browserify) | MIT |
| [`os-browserify`](https://npmjs.com/package/os-browserify) | MIT |
| [`path-browserify`](https://npmjs.com/package/path-browserify) | MIT |
| [`process`](https://npmjs.com/package/process) | MIT |
| [`punycode`](https://npmjs.com/package/punycode) | MIT |
| [`querystring-es3`](https://npmjs.com/package/querystring-es3) | MIT |
| [`stream-browserify`](https://npmjs.com/package/stream-browserify) | MIT |
| [`stream-http`](https://npmjs.com/package/stream-http) | MIT |
| [`string_decoder`](https://npmjs.com/package/string_decoder) | MIT |
| [`timers-browserify`](https://npmjs.com/package/timers-browserify) | MIT |
| [`tty-browserify`](https://npmjs.com/package/tty-browserify) | MIT |
| [`url`](https://npmjs.com/package/url) | MIT |
| [`util`](https://npmjs.com/package/util) | MIT |
| [`vm-browserify`](https://npmjs.com/package/vm-browserify) | MIT |

## Additional credits

- Bun's JS transpiler, CSS lexer, and Node.js module resolver source code is a port of [@evanw](https://github.com/evanw)’s [esbuild](https://github.com/evanw/esbuild) project.
- Credit to [@kipply](https://github.com/kipply) for the name "Bun"!
