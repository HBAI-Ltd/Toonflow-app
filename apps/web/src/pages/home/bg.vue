<template>
  <div ref="background" class="creativeBackground" aria-hidden="true">
    <div class="ambientLight" />
    <div class="lightRibbon" />
    <div class="dotGrid" />
    <svg class="flowLines" viewBox="0 0 1440 900" fill="none" preserveAspectRatio="xMidYMin slice">
      <g v-for="(path, index) in flowPaths" :key="path">
        <path :d="path" />
        <path class="flowPulse" :d="path" pathLength="100" :style="{ animationDelay: `${index * -2.3}s` }" />
      </g>
      <rect x="216" y="302" width="100" height="64" rx="12" />
      <rect x="1124" y="226" width="100" height="64" rx="12" />
      <rect x="968" y="728" width="100" height="64" rx="12" />
      <path d="m252 322 20 12-20 12zM1144 270l18-18 13 12 14-20 15 26M988 750h60m-60 12h36" />
      <g class="connectionDots">
        <circle cx="216" cy="334" r="4" />
        <circle cx="1224" cy="258" r="4" />
        <circle cx="1068" cy="760" r="4" />
        <circle cx="380" cy="640" r="4" />
      </g>
    </svg>
    <div class="sparkleField">
      <svg
        v-for="([x, y, size], index) in sparkles"
        :key="index"
        class="sparkle"
        viewBox="0 0 24 24"
        :style="{
          left: `${x}%`,
          top: `${y}%`,
          width: `${size}px`,
          height: `${size}px`,
          animationDelay: `${index * -0.73}s`,
          animationDuration: `${3.6 + (index % 4) * 0.8}s`,
        }">
        <path :d="sparklePath" />
        <circle cx="12" cy="12" r="1.2" />
      </svg>
    </div>
    <div class="pointerLight" />
  </div>
</template>

<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from "vue";

const background = ref<HTMLDivElement>();
const sparklePath = "M12 0C13.8 8.2 15.8 10.2 24 12C15.8 13.8 13.8 15.8 12 24C10.2 15.8 8.2 13.8 0 12C8.2 10.2 10.2 8.2 12 0Z";
const sparkles = [
  [8, 16, 14],
  [19, 10, 8],
  [34, 13, 12],
  [58, 9, 9],
  [76, 15, 18],
  [91, 11, 8],
  [5, 39, 10],
  [15, 48, 18],
  [87, 38, 15],
  [95, 55, 11],
  [69, 23, 9],
  [7, 72, 15],
  [23, 84, 10],
  [39, 70, 8],
  [54, 89, 12],
  [70, 80, 16],
  [86, 90, 9],
  [94, 76, 18],
];
const flowPaths = [
  "M-40 170H94Q118 170 118 194V310Q118 334 142 334H216",
  "M1224 258H1286Q1310 258 1310 282V448Q1310 472 1334 472H1480",
  "M80 752H260Q284 752 284 728V664Q284 640 308 640H380",
  "M1068 760H1130Q1154 760 1154 736V672Q1154 648 1178 648H1460",
];
let events: AbortController | undefined;

onMounted(() => {
  const layer = background.value!;
  const surface = layer.parentElement!;
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  events = new AbortController();
  const options = { passive: true, signal: events.signal };

  function resetPointer() {
    layer.style.setProperty("--pointerOpacity", "0");
    layer.style.setProperty("--driftX", "0px");
    layer.style.setProperty("--driftY", "0px");
  }

  function updateMotion() {
    layer.style.setProperty("--motionState", document.hidden || !document.hasFocus() ? "paused" : "running");
    resetPointer();
  }

  surface.addEventListener(
    "pointermove",
    (event) => {
      if (event.pointerType === "touch" || reducedMotion.matches) return;
      const bounds = layer.getBoundingClientRect();
      if (!bounds.width || !bounds.height) return;
      const x = event.clientX - bounds.left;
      const y = event.clientY - bounds.top;
      layer.style.setProperty("--pointerX", `${x}px`);
      layer.style.setProperty("--pointerY", `${y}px`);
      layer.style.setProperty("--pointerOpacity", "1");
      layer.style.setProperty("--driftX", `${(x / bounds.width - 0.5) * 24}px`);
      layer.style.setProperty("--driftY", `${(y / bounds.height - 0.5) * 18}px`);
    },
    options
  );

  surface.addEventListener("pointerleave", resetPointer, options);
  window.addEventListener("blur", updateMotion, options);
  window.addEventListener("focus", updateMotion, options);
  document.addEventListener("visibilitychange", updateMotion, options);
  reducedMotion.addEventListener("change", resetPointer, options);
  updateMotion();
});

onBeforeUnmount(() => {
  events?.abort();
});
</script>

<style lang="scss" scoped>
.creativeBackground {
  --sparkleColor: color-mix(in srgb, var(--el-color-primary) 45%, #b58aff);
  position: absolute;
  inset: 0;
  overflow: hidden;
  pointer-events: none;
  background: var(--el-bg-color);

  .ambientLight,
  .lightRibbon,
  .dotGrid,
  .flowLines,
  .sparkleField,
  .pointerLight {
    position: absolute;
    inset: 0;
  }

  .ambientLight {
    inset: -10%;
    background: radial-gradient(ellipse 45% 36% at 38% 12%, color-mix(in srgb, var(--el-color-primary) 22%, transparent), transparent),
      radial-gradient(ellipse 38% 42% at 94% 60%, color-mix(in srgb, var(--el-color-primary) 14%, transparent), transparent),
      radial-gradient(ellipse 32% 30% at 72% 8%, color-mix(in srgb, var(--sparkleColor) 18%, transparent), transparent),
      radial-gradient(ellipse 35% 35% at 4% 84%, color-mix(in srgb, var(--sparkleColor) 14%, transparent), transparent);
    animation: ambientDrift 16s ease-in-out infinite alternate;
    animation-play-state: var(--motionState, running);
  }

  .lightRibbon {
    inset: -45% -20% 15%;
    border-radius: 50%;
    border-bottom: 1px solid color-mix(in srgb, var(--el-color-primary) 24%, transparent);
    box-shadow: 0 24px 70px -36px color-mix(in srgb, var(--el-color-primary) 50%, transparent);
    transform: rotate(-16deg);
    mask-image: linear-gradient(90deg, transparent, #000 30%, #000 70%, transparent);
  }

  .dotGrid {
    background-image: radial-gradient(var(--el-text-color-placeholder) 0.7px, transparent 0.7px);
    background-size: 24px 24px;
    opacity: 0.3;
    mask-image: radial-gradient(ellipse at 50% 28%, transparent 18%, #000 80%);
  }

  .flowLines {
    width: 100%;
    height: 100%;
    stroke: color-mix(in srgb, var(--el-color-primary) 24%, var(--el-border-color));
    stroke-width: 1;
    opacity: 0.65;
    transform: translate(var(--driftX, 0px), var(--driftY, 0px));
    transition: transform 700ms ease-out;

    .flowPulse {
      stroke: var(--el-color-primary);
      stroke-width: 2;
      stroke-linecap: round;
      stroke-dasharray: 5 95;
      filter: drop-shadow(0 0 4px var(--el-color-primary));
      animation: flowTravel 9s linear infinite;
      animation-play-state: var(--motionState, running);
    }

    .connectionDots {
      fill: var(--el-bg-color);
      stroke: var(--el-color-primary);
      filter: drop-shadow(0 0 3px color-mix(in srgb, var(--el-color-primary) 50%, transparent));
    }
  }

  .sparkleField {
    transform: translate(calc(var(--driftX, 0px) * 1.4), calc(var(--driftY, 0px) * 1.4));
    transition: transform 900ms ease-out;

    .sparkle {
      position: absolute;
      overflow: visible;
      color: var(--el-color-primary);
      fill: currentColor;
      filter: drop-shadow(0 0 5px currentColor);
      animation: sparkleTwinkle ease-in-out infinite;
      animation-play-state: var(--motionState, running);

      &:nth-child(3n) {
        color: var(--sparkleColor);
      }

      circle {
        fill: #fff;
      }
    }
  }

  .pointerLight {
    background: radial-gradient(circle, var(--el-color-primary) 1.4px, transparent 1.4px) 0 0 / 24px 24px,
      radial-gradient(
        280px circle at var(--pointerX, 50%) var(--pointerY, 25%),
        color-mix(in srgb, var(--sparkleColor) 24%, transparent),
        transparent
      );
    mask-image: radial-gradient(240px circle at var(--pointerX, 50%) var(--pointerY, 25%), #000, transparent);
    opacity: calc(var(--pointerOpacity, 0) * 0.4);
    transition: opacity 400ms ease;
  }

  @media (max-width: 700px) {
    .flowLines {
      opacity: 0.3;
    }

    .sparkleField .sparkle:nth-child(even) {
      display: none;
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .ambientLight {
      animation: none;
    }

    .flowLines {
      transform: none;
      transition: none;

      .flowPulse {
        display: none;
        animation: none;
      }
    }

    .sparkleField {
      transform: none;
      transition: none;

      .sparkle {
        animation: none;
        opacity: 0.4;
      }
    }

    .pointerLight {
      display: none;
    }
  }
}

@keyframes ambientDrift {
  from {
    transform: translate(-2%, -1%) scale(1);
  }
  to {
    transform: translate(2%, 2%) scale(1.06);
  }
}

@keyframes flowTravel {
  from {
    stroke-dashoffset: 100;
  }
  to {
    stroke-dashoffset: 0;
  }
}

@keyframes sparkleTwinkle {
  0%,
  100% {
    opacity: 0.15;
    transform: scale(0.55) rotate(-12deg);
  }
  45% {
    opacity: 0.95;
    transform: scale(1.15) rotate(12deg);
  }
  70% {
    opacity: 0.3;
    transform: scale(0.75) rotate(0);
  }
}
</style>
