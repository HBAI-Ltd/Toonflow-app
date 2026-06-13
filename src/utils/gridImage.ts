import sharp from "sharp";
import { v4 as uuidv4 } from "uuid";
import oss from "@/utils/oss";

/**
 * 宫格图切分工具（借鉴 huobao-drama 的 grid-split）
 *
 * 一次生成 N 宫格图（多镜头同风格同人物），再按行列切分为单元格图片，
 * 分配到各分镜作为分镜图。1 次 API 调用产出 rows*cols 个镜头帧，
 * 且宫格内风格/角色天然一致。
 */

export interface GridCell {
  index: number;
  filePath: string; // OSS 相对路径
}

/**
 * 把宫格图按行列切分为单元格图片并保存到 OSS。
 * @param gridRelPath 宫格图的 OSS 相对路径
 * @param rows 行数
 * @param cols 列数
 * @param outDir 单元格输出目录（OSS 相对路径，如 /1/assets/2）
 * @returns 按 行优先 顺序排列的单元格信息
 */
export async function splitGridImage(gridRelPath: string, rows: number, cols: number, outDir: string): Promise<GridCell[]> {
  const absPath = await oss.getAbsolutePath(gridRelPath);
  const meta = await sharp(absPath).metadata();
  if (!meta.width || !meta.height) throw new Error("无法读取宫格图尺寸");

  const cellWidth = Math.floor(meta.width / cols);
  const cellHeight = Math.floor(meta.height / rows);
  if (cellWidth < 16 || cellHeight < 16) throw new Error(`宫格切分后单元格过小（${cellWidth}x${cellHeight}），请检查行列数`);

  const cells: GridCell[] = [];
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const index = r * cols + c;
      const cellRelPath = `${outDir}/${uuidv4()}.jpg`;
      const buffer = await sharp(absPath)
        .extract({ left: c * cellWidth, top: r * cellHeight, width: cellWidth, height: cellHeight })
        .jpeg({ quality: 92 })
        .toBuffer();
      await oss.writeFile(cellRelPath, buffer);
      cells.push({ index, filePath: cellRelPath });
    }
  }
  return cells;
}
