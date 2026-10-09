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

## 腾讯 TBS SDK 44286

当前验证包将 `com.tencent.tbs:tbssdk:44286` 的 Java SDK 编入 DEX，不内置 X5 内核。系统 WebView 能力不足时才进入 X5 流程，确认实际加载 X5 后直接进入页面，不重复检测网页能力。新版 X5 接入仍需替换为腾讯提供的新 SDK 和专用 `config.tbs`，见 README 中的接入状态说明。

- 官方发布包：[Maven Central](https://repo.maven.apache.org/maven2/com/tencent/tbs/tbssdk/44286/tbssdk-44286.jar)
- SDK JAR SHA256：`d70f1544400885a889d8901cbd4d82538a93c6213ef3103d8a75e72fc29a121f`
- SDK 采用 [Tencent Binary License](https://github.com/TencentBrowsingService/TBS_SDK/blob/3988ed7fdec43f39fc8c2ba881e4064fe0b52024/LICENSE.txt)，原文保留如下；此 SDK 壳的许可不替代下载内核所附的第三方许可。

It is permitted that distribution of this Android TBS SDK in binary form only is free on Maven Central and GitHub.
Copyright (C) 2019 THL A29 Limited, a Tencent company.  All rights reserved.

Redistribution of the Android TBS SDK in binary form only on Maven Central and GitHub is permitted provided that the following conditions are met:
1. Redistribution in binary form must reproduce the above copyright notice, this list of conditions and the following disclaimer in the documentation and/or other materials provided with the distribution.

2. Neither the name of THL A29 Limited nor the names of its contributors may be used to endorse or promote products derived from this software without specific prior written permission.
THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED.
IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.

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
