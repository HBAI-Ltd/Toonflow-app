# 视觉一致性校验：本地 CLIP embedding

> 视频审核（`src/utils/videoReview.ts` 的 `inspectVisualConsistency`）比对视频首帧与资产/分镜参考图，度量角色/画面一致性。本文说明如何从旧的 16×16 像素指纹升级到本地 CLIP embedding。

## 为什么升级

- 旧方案 16×16 像素欧氏距离（`visualSimilarity.ts` 的 `createVisualFingerprint`/`compareVisualFingerprints`）只能抓"完全跑偏"，抓不住"微变脸/服装细节漂移"，且对构图/景别/光线变化极敏感（同角色不同景别会误判为不相似）。
- CLIP 图像 embedding 是语义级相似，对构图变化鲁棒，能更准地判断"是不是同一角色/同一画面要素"。本地离线运行，零调用成本。

## 工作机制

- `src/utils/agent/imageEmbedding.ts`：仿 `embedding.ts`（文本 embedding）的本地 ONNX 范式，用 `pipeline("image-feature-extraction", …)` 生成图像 embedding（L2 归一化），进程内 LRU 缓存。
- `visualSimilarity.ts` 的 `compareImageFilesByEmbedding`：两图 embedding 的余弦相似度 [0,1]。
- `videoReview.ts`：优先用 CLIP（阈值 `VISUAL_LOW_SIMILARITY_THRESHOLD_CLIP = 0.75`）；**模型不可用时自动降级**到旧像素指纹（阈值 `0.55`），审核不中断，`report.visualConsistency.method` 记录用了 `clip` 还是 `pixel`。

## 启用步骤（默认走降级，需下模型才启用 CLIP）

**未放置模型时，系统自动使用像素指纹 fallback，功能正常、不报错。** 要启用 CLIP（本项目已在 `data/models/clip-vit-base-patch32/` 放好，且该目录已 `.gitignore` 不入库；下述为重新获取步骤）：

1. **下载模型文件** 到 `data/models/clip-vit-base-patch32/`（推荐镜像 `hf-mirror.com`，源仓库 `Xenova/clip-vit-base-patch32`）。`image-feature-extraction` pipeline 对 CLIP 加载的是 **vision 塔**，且默认按**基名**查找，所以只需三个文件：
   - `config.json`
   - `preprocessor_config.json`（图像预处理必需）
   - `onnx/vision_model.onnx` ← **必须是这个基名**。仓库里是 `vision_model_fp16.onnx`（~168MB）等带精度后缀的文件；下载后**复制/重命名为 `vision_model.onnx`**（pipeline 不会自动按 dtype 拼后缀）。
   - 不需要 tokenizer/vocab/merges/text_model（那些是文本塔用的，删掉省体积）。
   ```bash
   BASE=https://hf-mirror.com/Xenova/clip-vit-base-patch32/resolve/main
   mkdir -p data/models/clip-vit-base-patch32/onnx
   curl -sL $BASE/config.json -o data/models/clip-vit-base-patch32/config.json
   curl -sL $BASE/preprocessor_config.json -o data/models/clip-vit-base-patch32/preprocessor_config.json
   curl -sL $BASE/onnx/vision_model_fp16.onnx -o data/models/clip-vit-base-patch32/onnx/vision_model.onnx
   ```
2. **配置 `o_setting`**（有默认值，通常无需改）：
   - `imageModelFolder`：默认 `clip-vit-base-patch32`
   - `imageModelDtype`：默认 `fp32`（因为我们用的是基名 `vision_model.onnx`，dtype 只影响文件名查找，内容精度由 onnx 自身决定）
3. 重启服务。首次审核 lazy 加载（~1s），之后进程内缓存。

## 阈值校准（已用真实资产图校准）

实测 `clip-vit-base-patch32` vision（512D）在"商业三国"同项目角色四视图上：跨角色相似度约 **0.54~0.83**，同一角色不同帧更高。对比 16×16 像素指纹在同批图上因构图差异剧烈波动（0.27~0.93，把构图不同的同类图误判为不相似）——**CLIP 的语义区分更可信**。

据此把 `VISUAL_LOW_SIMILARITY_THRESHOLD_CLIP` 定为 **0.60**（低于此才算真正跑偏/错配角色）。不同项目画风可微调此阈值。

## 注意事项

- **仓库体积**：现有 `all-MiniLM-L6-v2`（44MB）已入库；CLIP 模型（~350MB）较大，是否入库需权衡仓库膨胀。若不入库，需在部署/打包流程单独分发到 `data/models/`。
- **打包**：`data/models/` 已在 Electron 打包资源内（与 all-MiniLM 一致）。
- **降级是安全网**：任何时候模型缺失/加载失败，都不会让视频审核崩溃，只是回落到较粗的像素度量。

## 相关文件

| 文件 | 作用 |
|---|---|
| `src/utils/agent/imageEmbedding.ts` | 本地 CLIP 图像 embedding（新增） |
| `src/utils/visualSimilarity.ts` | `compareImageFilesByEmbedding`（新增）+ 旧像素指纹（保留为 fallback） |
| `src/utils/videoReview.ts` | 切换 CLIP + 阈值 + 降级保护 + `method` 记录 |
| `src/utils/agent/embedding.ts` | 参照范式（文本 embedding） |
