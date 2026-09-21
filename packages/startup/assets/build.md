# ThorVG Windows x64 运行库

`windowsX64/thorvg.dll` 从未修改的 ThorVG v1.1.1 官方发布源码在本机编译，仅用于软件光栅化 Lottie 矢量动画。采用体积优化、LTO 和 `exports.def` 中的 17 个官方 C API 导出，当前 DLL 为 499,712 字节，无自定义渲染或接口包装代码。

- 官方发布：https://github.com/thorvg/thorvg/releases/tag/v1.1.1
- 源码：https://github.com/thorvg/thorvg/releases/download/v1.1.1/thorvg-1.1.1.tar.xz
- 源码 SHA-256：`5ca6143088f18b5dbe42552c939594100da6226d79de503d1a171184d6aa310d`
- DLL SHA-256：`d3624d64950e51f6b8ac585c15d99ecce60ca926c6c5a407f8ec05830b838afc`
- 工具：Visual Studio 2022 MSVC x64 19.33.31631（工具集目录 14.33.31629）、Windows SDK 10.0.22621.0、Python 3.8、Meson 1.11.2、Ninja 1.13.2。
- `license.txt` 保留 ThorVG 和实际启用的 RapidJSON 完整 MIT 许可。

构建工具仅放在项目 `work/thorvgTools`，未全局安装。解压源码至 `work/thorvg-1.1.1` 后，从仓库根目录、在初始化 MSVC x64 环境的 PowerShell 中执行：

```powershell
python -m pip install --target work/thorvgTools meson==1.11.2 ninja==1.13.2
$env:PYTHONPATH = (Resolve-Path work/thorvgTools).Path
$env:PATH = (Resolve-Path work/thorvgTools/bin).Path + ';' + $env:PATH
python -m mesonbuild.mesonmain setup work/thorvgStaticBuild work/thorvg-1.1.1 --buildtype=release --default-library=static -Doptimization=s -Db_lto=true -Dbindings=capi -Dengines=cpu -Dloaders=lottie '-Dsavers=[]' '-Dtools=[]' -Dtests=false '-Dextra=[]' -Db_vscrt=mt -Dthreads=false -Dpartial=false -Dsimd=false -Dfile=false
python -m mesonbuild.mesonmain compile -C work/thorvgStaticBuild -j 8
link /NOLOGO /DLL /OUT:work/thorvgStaticBuild/thorvg-1.dll /DEF:packages/startup/assets/exports.def /LTCG /OPT:REF /OPT:ICF work/thorvgStaticBuild/src/libthorvg-1.a
```

复制 `work/thorvgStaticBuild/thorvg-1.dll` 至 `packages/startup/assets/windowsX64/thorvg.dll`，仅重命名、不修改二进制。官方静态库通过标准链接器生成 DLL，仅导出播放器实际调用的 C API，使未使用的接口能被删除；未改第三方动画逻辑，也未使用 UPX。新增 C API 调用时需同步 `exports.def` 并重新链接。

采用静态 CRT，导入表仅含 `KERNEL32.dll`，CPU 单线程直接渲染预乘 BGRA；未启用 GPU、OpenMP、表达式、字体、SVG、位图解码或文件 I/O。JSON 由 Bun 读取后通过官方 C API 复制到引擎，不需要另一个 WebView。若以后素材增加上述特性，需按需调整 loader/extra 后重编译。
