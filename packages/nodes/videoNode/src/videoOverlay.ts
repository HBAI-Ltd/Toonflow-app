export function subtitleFileName(path: string) {
  const ext = path.match(/\.(srt|vtt|ass|ssa)$/i)?.[1]?.toLowerCase();
  if (!ext) throw new Error("请选择 SRT、VTT、ASS 或 SSA 字幕");
  return `captions.${ext}`;
}

export function drawOverlayText(canvas: HTMLCanvasElement, text: string, size: number, color: string, width: number, height: number) {
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("浏览器无法绘制文字");
  const lines = text.trim().split(/\r?\n/);
  const font = `600 ${size}px sans-serif`;
  ctx.font = font;
  canvas.width = Math.max(2, Math.min(width, Math.ceil(Math.max(...lines.map(line => ctx.measureText(line).width)) + 12)));
  canvas.height = Math.max(2, Math.min(height, Math.ceil(lines.length * size * 1.4 + 12)));
  ctx.font = font;
  ctx.textBaseline = "top";
  ctx.fillStyle = color;
  ctx.lineJoin = "round";
  ctx.lineWidth = Math.max(2, size / 16);
  ctx.strokeStyle = "rgba(0,0,0,.65)";
  for (const [i, line] of lines.entries()) {
    ctx.strokeText(line, 6, 6 + i * size * 1.4, canvas.width - 10);
    ctx.fillText(line, 6, 6 + i * size * 1.4, canvas.width - 10);
  }
}

export function overlayPosition(key: string, positionX: number, positionY: number) {
  if (key === "custom") return `(W-w)*${positionX}/100:(H-h)*${positionY}/100`;
  const x = "min(16,max(0,(W-w)/2))", y = "min(16,max(0,(H-h)/2))";
  if (key === "center") return "(W-w)/2:(H-h)/2";
  return `'${key.endsWith("Right") ? `W-w-${x}` : x}':'${key.startsWith("bottom") ? `H-h-${y}` : y}'`;
}

export function layerOffset(key: string, width: number, height: number, w: number, h: number, positionX: number, positionY: number) {
  if (key === "custom") return { x: (width - w) * positionX / 100, y: (height - h) * positionY / 100 };
  const dx = (width - w) / 2, dy = (height - h) / 2;
  const padX = Math.max(0, Math.min(16, dx)), padY = Math.max(0, Math.min(16, dy));
  return key === "center" ? { x: dx, y: dy } : { x: key.endsWith("Right") ? width - w - padX : padX, y: key.startsWith("bottom") ? height - h - padY : padY };
}
