# 图片预览

支持 JPG、JPEG、PNG、WebP、GIF、BMP、SVG、AVIF 和 ICO。通过宿主共享文件 URL 读取资源，在切换或关闭标签时释放 URL。

图标由扩展自行声明；“图片适应窗口”设置默认开启，关闭后按原始尺寸展示并支持滚动。

扩展 ID 为 `ext-image`，包名为 `@toonflow/ext-image`。在仓库根目录执行 `bun run --cwd packages/ext/image build`，产物为 `build/ext/image.ext.js`。扩展开发与上下文接口见 `packages/extScaffold/readme.md`。
