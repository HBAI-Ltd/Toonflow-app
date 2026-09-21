<template>
  <div class="bgArt" aria-hidden="true">
    <canvas ref="filmCanvas" />
  </div>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted, ref } from "vue";
import filmUrl from "@/assets/image.png";

const filmCanvas = ref<HTMLCanvasElement>();
let isReady = false;
const frameDuration = 80;
let image: HTMLImageElement;
let context: CanvasRenderingContext2D | null = null;
let resizeObserver: ResizeObserver;
let reducedMotion: MediaQueryList;
let pauseTimer: ReturnType<typeof setTimeout> | undefined;
let animationId = 0;
let lastFrameTime = 0;
let frameIndex = 0;
let width = 0;
let height = 0;
let pixelRatio = 1;
let exposure = 1;
let jitterX = 0;
let jitterY = 0;
let jitterAngle = 0;
let frameTick = 0;
let grainIndex = 0;
let grainOffset = 0;
const grains: CanvasPattern[] = [];
const gateWear = Array.from({ length: 64 }, () => Math.random() * 1.8);
let scratches: { x: number; top: number; bottom: number; life: number; light: boolean }[] = [];
let dust: { x: number; y: number; size: number; fiber: boolean }[] = [];
let splice: { y: number; life: number } | null = null;

function getSourceRect(index: number) {
  const column = index % 4;
  const row = Math.floor(index / 4);
  // 原图各行的地面分隔带不等高，按实际边界避开帧号和相邻画格。
  const rowBounds = [[1, 126], [135, 262], [270, 391], [405, 528]][row]!;
  const scaleY = image.naturalHeight / 538;
  const cellWidth = image.naturalWidth / 4;
  return [column * cellWidth + 1, rowBounds[0]! * scaleY, cellWidth - 2, (rowBounds[1]! - rowBounds[0]!) * scaleY] as const;
}

function ageFilm() {
  frameTick++;
  exposure = 0.96 + Math.random() * 0.04;
  jitterX = (Math.random() - 0.5) * 2;
  jitterY = (Math.random() - 0.5) * 2.6;
  jitterAngle = (Math.random() - 0.5) * 0.007;
  grainIndex = Math.floor(Math.random() * grains.length);
  grainOffset = Math.floor(Math.random() * 192);
  scratches = scratches.filter((scratch) => --scratch.life > 0);
  for (const scratch of scratches) scratch.x += (Math.random() - 0.5) * 0.001;
  if (scratches.length < 3 && Math.random() < 0.28) {
    scratches.push({
      x: 0.05 + Math.random() * 0.9,
      top: Math.random() * 0.15,
      bottom: 0.7 + Math.random() * 0.3,
      life: 4 + Math.floor(Math.random() * 14),
      light: Math.random() > 0.4,
    });
  }
  if (splice && --splice.life <= 0) splice = null;
  else if (!splice && Math.random() < 0.015) splice = { y: 0.15 + Math.random() * 0.7, life: 3 + Math.floor(Math.random() * 4) };
  dust = Array.from({ length: 6 + Math.floor(Math.random() * 10) }, () => ({
    x: Math.random(), y: Math.random(), size: 0.4 + Math.random() * 1.5, fiber: Math.random() < 0.12,
  }));
}

function draw() {
  if (!context || !image?.naturalWidth || !width || !height) return;
  const ctx = context;
  ctx.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);

  const [sx, sy, sw, sh] = getSourceRect(frameIndex);
  const filmWidth = Math.min(width * 0.94, height * 0.8 * (181 / 125));
  const filmHeight = filmWidth * (125 / 181);
  const x = (width - filmWidth) / 2;
  const y = (height - filmHeight) / 2;
  const railWidth = filmWidth * 0.06;
  const pictureX = railWidth;
  const pictureWidth = filmWidth - railWidth * 2;
  const scale = Math.min(pictureWidth / sw, filmHeight / sh);

  const glow = ctx.createRadialGradient(width / 2, height / 2, 0, width / 2, height / 2, Math.max(width, height) * 0.62);
  glow.addColorStop(0, "#77766f");
  glow.addColorStop(0.55, "#242525");
  glow.addColorStop(1, "#101112");
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, width, height);

  // 画面、齿孔与磨损同随 jitter 平移/旋转，背景光晕保持静止
  ctx.save();
  ctx.translate(x + filmWidth / 2 + jitterX, y + filmHeight / 2 + jitterY);
  ctx.rotate(jitterAngle);
  ctx.translate(-filmWidth / 2, -filmHeight / 2);
  ctx.beginPath();
  ctx.roundRect(0, 0, filmWidth, filmHeight, 5);
  ctx.clip();
  ctx.fillStyle = "#b9b9b6";
  ctx.fillRect(0, 0, filmWidth, filmHeight);
  ctx.fillStyle = "#1c1c1c";
  ctx.fillRect(0, 0, railWidth, filmHeight);
  ctx.fillRect(filmWidth - railWidth, 0, railWidth, filmHeight);

  const holeCount = Math.max(4, Math.round(filmHeight / (railWidth * 1.6)));
  const holeSize = railWidth * 0.32;
  for (let i = 0; i < holeCount; i++) {
    const holeY = ((i + 0.5) / holeCount) * filmHeight;
    for (const railX of [railWidth / 2, filmWidth - railWidth / 2]) {
      ctx.beginPath();
      ctx.roundRect(railX - holeSize / 2, holeY - holeSize / 2, holeSize, holeSize, holeSize * 0.3);
      ctx.fillStyle = "#050505b0";
      ctx.fill();
      ctx.strokeStyle = "#ffffff14";
      ctx.lineWidth = 0.6;
      ctx.stroke();
    }
  }

  ctx.filter = `grayscale(1) contrast(1.08) brightness(${exposure})`;
  ctx.drawImage(image, sx, sy, sw, sh,
    pictureX + (pictureWidth - sw * scale) / 2,
    (filmHeight - sh * scale) / 2, sw * scale, sh * scale);
  ctx.filter = "none";

  // 暖色灯光泄漏，强度随时间缓慢起伏
  const leak = (Math.sin(frameTick * 0.02) + 1) / 2;
  const leakGradient = ctx.createRadialGradient(filmWidth * 0.85, filmHeight * 0.12, 0, filmWidth * 0.85, filmHeight * 0.12, filmWidth * 0.6);
  leakGradient.addColorStop(0, `rgba(255,150,60,${0.16 * leak})`);
  leakGradient.addColorStop(1, "rgba(255,150,60,0)");
  ctx.fillStyle = leakGradient;
  ctx.fillRect(0, 0, filmWidth, filmHeight);

  for (const scratch of scratches) {
    const scratchX = scratch.x * filmWidth;
    ctx.strokeStyle = scratch.light ? "#fff9e557" : "#17191860";
    ctx.lineWidth = scratch.light ? 0.6 : 0.85;
    ctx.beginPath();
    ctx.moveTo(scratchX, scratch.top * filmHeight);
    ctx.lineTo(scratchX + 0.7, filmHeight * 0.43);
    ctx.moveTo(scratchX + 0.6, filmHeight * 0.44);
    ctx.lineTo(scratchX - 0.4, scratch.bottom * filmHeight);
    ctx.stroke();
  }
  if (splice) {
    const spliceY = splice.y * filmHeight;
    ctx.strokeStyle = "#00000090";
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.moveTo(0, spliceY);
    ctx.lineTo(filmWidth, spliceY);
    ctx.stroke();
    ctx.strokeStyle = "#ffffff30";
    ctx.lineWidth = 0.6;
    ctx.beginPath();
    ctx.moveTo(0, spliceY + 1.4);
    ctx.lineTo(filmWidth, spliceY + 1.4);
    ctx.stroke();
  }
  ctx.fillStyle = "#14151488";
  ctx.strokeStyle = "#15161377";
  ctx.lineWidth = 0.7;
  for (const speck of dust) {
    const dx = speck.x * filmWidth;
    const dy = speck.y * filmHeight;
    ctx.beginPath();
    if (speck.fiber) {
      ctx.moveTo(dx, dy);
      ctx.quadraticCurveTo(dx + 4, dy - 3, dx + 2, dy + 5);
      ctx.stroke();
    } else {
      ctx.ellipse(dx, dy, speck.size, speck.size * 0.55, speck.x * 6, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  ctx.save();
  ctx.translate(filmWidth / 2, filmHeight / 2);
  ctx.scale(filmWidth / 2, filmHeight / 2);
  const vignette = ctx.createRadialGradient(-0.06, -0.08, 0.2, 0, 0, 1.35);
  vignette.addColorStop(0, "#fff8e509");
  vignette.addColorStop(0.5, "#00000008");
  vignette.addColorStop(0.82, "#00000048");
  vignette.addColorStop(1, "#000000c9");
  ctx.fillStyle = vignette;
  ctx.fillRect(-1, -1, 2, 2);
  ctx.restore();
  ctx.strokeStyle = "#08090880";
  ctx.lineWidth = 3;
  ctx.strokeRect(1, 1, filmWidth - 2, filmHeight - 2);
  ctx.shadowColor = "#080908";
  ctx.shadowBlur = 2;
  for (const bottom of [false, true]) {
    ctx.beginPath();
    for (let i = 0; i < gateWear.length; i++) {
      const edgeX = i / (gateWear.length - 1) * filmWidth;
      const edgeY = bottom ? filmHeight - gateWear[63 - i]! : gateWear[i]!;
      if (i === 0) ctx.moveTo(edgeX, edgeY);
      else ctx.lineTo(edgeX, edgeY);
    }
    ctx.stroke();
  }
  ctx.restore();

  const grain = grains[grainIndex];
  if (grain) {
    ctx.save();
    ctx.globalCompositeOperation = "soft-light";
    ctx.globalAlpha = 0.28;
    ctx.translate(-grainOffset, -grainOffset);
    ctx.fillStyle = grain;
    ctx.fillRect(0, 0, width + 192, height + 192);
    ctx.restore();
  }
}

function pause() {
  clearTimeout(pauseTimer);
  cancelAnimationFrame(animationId);
  animationId = 0;
}

function tick(time: number) {
  if (time - lastFrameTime >= frameDuration) {
    lastFrameTime = time - (time - lastFrameTime) % frameDuration;
    frameIndex = (frameIndex + 1) % 16;
    ageFilm();
    draw();
  }
  animationId = requestAnimationFrame(tick);
}

function play() {
  if (!isReady || !width || !height || reducedMotion.matches || document.hidden) return;
  clearTimeout(pauseTimer);
  if (!animationId) {
    lastFrameTime = performance.now();
    animationId = requestAnimationFrame(tick);
  }
  pauseTimer = setTimeout(pause, 150);
}

function resize() {
  const canvas = filmCanvas.value;
  if (!canvas) return;
  const bounds = canvas.getBoundingClientRect();
  width = bounds.width;
  height = bounds.height;
  pixelRatio = Math.min(window.devicePixelRatio, 2);
  canvas.width = Math.round(width * pixelRatio);
  canvas.height = Math.round(height * pixelRatio);
  if (!width || !height) pause();
  draw();
}

onMounted(() => {
  const canvas = filmCanvas.value!;
  context = canvas.getContext("2d");
  if (!context) return;
  reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  for (let i = 0; i < 4; i++) {
    const tile = document.createElement("canvas");
    tile.width = tile.height = 192;
    const tileContext = tile.getContext("2d")!;
    const pixels = tileContext.createImageData(192, 192);
    for (let p = 0; p < pixels.data.length; p += 4) {
      const value = Math.floor(Math.random() * 256);
      pixels.data[p] = pixels.data[p + 1] = pixels.data[p + 2] = value;
      pixels.data[p + 3] = 255;
    }
    tileContext.putImageData(pixels, 0, 0);
    const pattern = context.createPattern(tile, "repeat");
    if (pattern) grains.push(pattern);
  }
  image = new Image();
  image.onload = () => {
    ageFilm();
    resize();
    isReady = true;
  };
  image.src = filmUrl;
  resizeObserver = new ResizeObserver(resize);
  resizeObserver.observe(canvas);
  window.addEventListener("mousemove", play, { passive: true });
  window.addEventListener("blur", pause);
  document.addEventListener("visibilitychange", pause);
  reducedMotion.addEventListener("change", pause);
});

onUnmounted(() => {
  pause();
  resizeObserver?.disconnect();
  if (image) image.onload = null;
  window.removeEventListener("mousemove", play);
  window.removeEventListener("blur", pause);
  document.removeEventListener("visibilitychange", pause);
  reducedMotion?.removeEventListener("change", pause);
});
</script>

<style lang="scss" scoped>
.bgArt {
  position: absolute;
  inset: 0;
  overflow: hidden;
  background: #111213;
  pointer-events: none;

  canvas {
    display: block;
    width: 100%;
    height: 100%;
  }
}
</style>
