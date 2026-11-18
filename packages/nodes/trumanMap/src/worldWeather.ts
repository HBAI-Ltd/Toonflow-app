import { BackSide, BufferGeometry, Color, DoubleSide, DynamicDrawUsage, Float32BufferAttribute, Group, InstancedBufferAttribute, InstancedBufferGeometry, Mesh, Points, ShaderMaterial, SphereGeometry, Vector2, Vector3 } from "three";
import type { SceneLighting, SceneTime, SceneWeather, Vector3Value } from "./sceneDocument";
import { getWeatherStrengths } from "./weatherModel";
import { createWorldAtmosphere } from "./worldAtmosphere";
import { getCelestialState } from "./worldTime";

function random(index: number) { const value = Math.sin(index * 127.1 + 43.7) * 43758.5453; return value - Math.floor(value); }
function wrap(value: number, span: number) { return ((value % span) + span) % span; }
function mixColor(from: string, to: string, amount: number) { return `#${new Color(from).lerp(new Color(to), amount).getHexString()}`; }
function clampUnit(value: number) { return Math.min(1, Math.max(0, value)); }
function smoothStep(from: number, to: number, value: number) { const amount = clampUnit((value - from) / (to - from)); return amount * amount * (3 - 2 * amount); }
function directionElevation(direction: Vector3Value) { return Math.asin(Math.min(1, Math.max(-1, direction.y))) * 180 / Math.PI; }

export type WeatherEnvironment = { rain: number; snow: number; windX: number; windZ: number; gust: number };

function getLayerStrengths(weather: SceneWeather | undefined) {
  const layers = getWeatherStrengths(weather);
  return { ...layers, snow: Math.max(layers.snow, layers.blizzard), clouds: Math.max(layers.clouds, layers.rain, layers.snow, layers.hail, layers.thunder, layers.blizzard) };
}

function sampleWind(weather: SceneWeather | undefined, seconds: number) {
  const time = Number.isFinite(seconds) ? seconds : 0;
  const layers = getWeatherStrengths(weather);
  const wind = Math.max(clampUnit(weather?.wind ?? 0), layers.sandstorm * 0.78, layers.blizzard * 0.7);
  const angle = (weather?.windDirection ?? 45) * Math.PI / 180;
  const speed = 38 * wind ** 1.35;
  const gust = wind ? 1 + 0.24 * Math.sin(time * 0.67) + 0.14 * Math.sin(time * 1.73 + 1.1) + 0.08 * Math.sin(time * 0.23 + 0.7) : 1;
  // ACT: 阵风解析积分使位移的导数与瞬时风速一致，暂停、跳帧和观察采样不会积累误差。
  const distance = speed * (time + 0.24 * (1 - Math.cos(time * 0.67)) / 0.67
    + 0.14 * (Math.cos(1.1) - Math.cos(time * 1.73 + 1.1)) / 1.73
    + 0.08 * (Math.cos(0.7) - Math.cos(time * 0.23 + 0.7)) / 0.23);
  return { windX: Math.cos(angle) * speed * gust, windZ: Math.sin(angle) * speed * gust, gust, travelX: Math.cos(angle) * distance, travelZ: Math.sin(angle) * distance };
}

export function getWeatherEnvironment(weather: SceneWeather | undefined, seconds: number): WeatherEnvironment {
  const strengths = getLayerStrengths(weather);
  const wind = sampleWind(weather, seconds);
  return { rain: Math.max(strengths.rain, strengths.hail * 0.35), snow: strengths.snow, windX: wind.windX, windZ: wind.windZ, gust: wind.gust };
}

const dayLighting = { background: "#f5f7fa", fogColor: "#f5f7fa", sunColor: "#fff1dc", sunIntensity: 3.2, sunPosition: { x: -12, y: 20, z: 10 }, ambientColor: "#d6e5ff", ambientIntensity: 0.35, skyColor: "#c6dcff", skyIntensity: 2.1, groundColor: "#444a50", exposure: 1.15 };
const periodLighting = {
  day: dayLighting,
  sunset: { background: "#e9c1ae", fogColor: "#ddbab0", sunColor: "#ffb775", sunIntensity: 2.25, sunPosition: { x: -24, y: 7, z: 15 }, ambientColor: "#c3a5bf", ambientIntensity: 0.48, skyColor: "#e6b8af", skyIntensity: 1.2, groundColor: "#514b62", exposure: 1.08 },
  night: { background: "#172439", fogColor: "#243248", sunColor: "#b2ceff", sunIntensity: 0.45, sunPosition: { x: -8, y: 18, z: -14 }, ambientColor: "#91a9d5", ambientIntensity: 0.28, skyColor: "#7185ac", skyIntensity: 0.75, groundColor: "#283349", exposure: 1.05 },
};

type LightingPeriod = keyof typeof periodLighting;
type LightingCycle = { from: LightingPeriod; to: LightingPeriod; amount: number };

export function getWeatherHour(weather?: SceneWeather) {
  return weather?.hour ?? (weather?.timeOfDay === "sunset" ? 18 : weather?.timeOfDay === "night" ? 0 : 12);
}

function getLightingCycle(weather?: SceneWeather, time?: SceneTime): LightingCycle {
  if (time) {
    const altitude = directionElevation(getCelestialState(time).sunDirection);
    return altitude < 4 ? { from: "night", to: "sunset", amount: smoothStep(-6, 4, altitude) } : { from: "sunset", to: "day", amount: smoothStep(4, 20, altitude) };
  }
  const period = weather?.timeOfDay ?? "day";
  if (weather?.hour === undefined) return { from: period, to: period, amount: 0 };
  const stops = [[0, "night"], [5, "night"], [6, "sunset"], [8, "day"], [12, "day"], [16, "day"], [18, "sunset"], [20, "night"], [24, "night"]] as const;
  const hour = getWeatherHour(weather);
  for (let index = 1; index < stops.length; index++) {
    const before = stops[index - 1]!;
    const after = stops[index]!;
    if (hour > after[0]) continue;
    const progress = clampUnit((hour - before[0]) / (after[0] - before[0]));
    return { from: before[1], to: after[1], amount: progress * progress * (3 - 2 * progress) };
  }
  return { from: "night", to: "night", amount: 0 };
}

function cycleColor(cycle: LightingCycle, day: string, sunset: string, night: string) {
  const colors = { day, sunset, night };
  return mixColor(colors[cycle.from], colors[cycle.to], cycle.amount);
}

function cycleNumber(cycle: LightingCycle, day: number, sunset: number, night: number) {
  const values = { day, sunset, night };
  return values[cycle.from] + (values[cycle.to] - values[cycle.from]) * cycle.amount;
}

function getPeriodLighting(weather?: SceneWeather, time?: SceneTime) {
  const cycle = getLightingCycle(weather, time);
  const from = periodLighting[cycle.from];
  const to = periodLighting[cycle.to];
  const lighting = { ...from, sunPosition: { ...from.sunPosition } };
  for (const key of ["background", "fogColor", "sunColor", "ambientColor", "skyColor", "groundColor"] as const) lighting[key] = mixColor(from[key], to[key], cycle.amount);
  for (const key of ["sunIntensity", "ambientIntensity", "skyIntensity", "exposure"] as const) lighting[key] = from[key] + (to[key] - from[key]) * cycle.amount;
  for (const key of ["x", "y", "z"] as const) lighting.sunPosition[key] = from.sunPosition[key] + (to.sunPosition[key] - from.sunPosition[key]) * cycle.amount;
  return lighting;
}

export function getWeatherLighting(weather?: SceneWeather, time?: SceneTime): SceneLighting {
  const base = getPeriodLighting(weather, time);
  const lighting = weather?.lighting;
  const hour = getWeatherHour(weather);
  const solarElevation = 65 * Math.sin((hour - 6) * Math.PI / 12);
  const elevation = Math.abs(solarElevation);
  const horizon = clampUnit(elevation / 8);
  let sunIntensity = weather?.hour === undefined ? base.sunIntensity : base.sunIntensity * horizon * horizon * (3 - 2 * horizon);
  let sunAzimuth = weather?.hour === undefined ? (Math.atan2(base.sunPosition.z, base.sunPosition.x) * 180 / Math.PI + 360) % 360 : ((hour - 6) * 15 + (solarElevation < 0 ? 180 : 0) + 360) % 360;
  let sunElevation = weather?.hour === undefined ? Math.atan2(base.sunPosition.y, Math.hypot(base.sunPosition.x, base.sunPosition.z)) * 180 / Math.PI : elevation;
  let sunColor = base.sunColor;
  if (time) {
    const celestial = getCelestialState(time);
    const nightPosition = periodLighting.night.sunPosition;
    const nightDistance = Math.hypot(nightPosition.x, nightPosition.y, nightPosition.z);
    const fallback = { x: nightPosition.x / nightDistance, y: nightPosition.y / nightDistance, z: nightPosition.z / nightDistance };
    // ACT: 主光沿用昼夜共用的创作设置；月亮落下时使用原夜景主光，避免真实天体位置把编辑场景关黑。
    const direction = celestial.sunDirection.y > 0 ? celestial.sunDirection : celestial.moonDirection.y > 0 ? celestial.moonDirection : fallback;
    sunIntensity = base.sunIntensity;
    sunAzimuth = (Math.atan2(direction.z, direction.x) * 180 / Math.PI + 360) % 360;
    sunElevation = Math.max(0, directionElevation(direction));
    sunColor = base.sunColor;
  }
  return {
    sunIntensity: lighting?.sunIntensity ?? sunIntensity,
    sunAzimuth: lighting?.sunAzimuth ?? sunAzimuth,
    sunElevation: lighting?.sunElevation ?? sunElevation,
    sunColor: lighting?.sunColor ?? sunColor,
    ambientIntensity: lighting?.ambientIntensity ?? base.ambientIntensity,
    ambientColor: lighting?.ambientColor ?? base.ambientColor,
    skyIntensity: lighting?.skyIntensity ?? base.skyIntensity,
    exposure: lighting?.exposure ?? base.exposure,
    weatherInfluence: lighting?.weatherInfluence ?? 1,
  };
}

export function createWorldWeather() {
  const group = new Group();
  group.name = "worldWeather";
  const skyUniforms = {
    windTravel: { value: new Vector2() }, coverage: { value: 0.2 }, mistAmount: { value: 0 }, lightningFlash: { value: 0 },
    solarDirection: { value: new Vector3(0, 1, 0) }, twilightGlow: { value: 0 }, twilightColor: { value: new Color("#f2a16e") },
    zenithColor: { value: new Color("#9fc6e4") }, horizonColor: { value: new Color("#e8f0f5") },
    cloudColor: { value: new Color("#ffffff") }, cloudShadow: { value: new Color("#8394a7") },
  };
  const skyMaterial = new ShaderMaterial({
    uniforms: skyUniforms, side: BackSide, depthWrite: false, fog: false,
    vertexShader: /* glsl */ `
      varying vec3 skyDirection;
      void main() {
        skyDirection = position;
        vec4 clip = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        gl_Position = clip.xyww;
      }
    `,
    fragmentShader: /* glsl */ `
      uniform vec2 windTravel;
      uniform float coverage;
      uniform float mistAmount;
      uniform float lightningFlash;
      uniform vec3 solarDirection;
      uniform float twilightGlow;
      uniform vec3 twilightColor;
      uniform vec3 zenithColor;
      uniform vec3 horizonColor;
      uniform vec3 cloudColor;
      uniform vec3 cloudShadow;
      varying vec3 skyDirection;

      float hash(vec2 point) { return fract(sin(dot(point, vec2(127.1, 311.7))) * 43758.5453); }
      float noise(vec2 point) {
        vec2 cell = floor(point);
        vec2 part = fract(point);
        part = part * part * (3.0 - 2.0 * part);
        return mix(mix(hash(cell), hash(cell + vec2(1.0, 0.0)), part.x), mix(hash(cell + vec2(0.0, 1.0)), hash(cell + 1.0), part.x), part.y);
      }
      float cloudNoise(vec2 point) {
        float value = 0.0;
        float weight = 0.54;
        for (int octave = 0; octave < 4; octave++) {
          value += noise(point) * weight;
          point = mat2(1.6, 1.2, -1.2, 1.6) * point + 7.3;
          weight *= 0.5;
        }
        return value;
      }
      void main() {
        vec3 direction = normalize(skyDirection);
        float altitude = max(direction.y, 0.0);
        vec3 color = mix(horizonColor, zenithColor, pow(altitude, 0.48));
        if (twilightGlow > 0.0) {
          float sunward = max(dot(normalize(direction.xz + vec2(0.00001)), normalize(solarDirection.xz + vec2(0.00001))), 0.0);
          float sunsetScatter = pow(sunward, 4.0) * exp(-abs(direction.y) * 7.0) * twilightGlow;
          color += twilightColor * sunsetScatter * 0.45;
        }
        float cloudMask = 0.0;
        if (direction.y > 0.015) {
          vec2 cloudPosition = direction.xz / max(direction.y + 0.18, 0.2) * 1.35 - windTravel * 0.0012;
          float cloudValue = cloudNoise(cloudPosition);
          cloudMask = smoothstep(0.69 - coverage * 0.4, 0.87 - coverage * 0.35, cloudValue) * smoothstep(0.015, 0.16, direction.y);
          if (cloudMask > 0.0) {
            float shade = clamp(cloudNoise(cloudPosition + vec2(0.12, -0.09)) * 1.4 - 0.2, 0.0, 1.0);
            color = mix(color, mix(cloudColor, cloudShadow, shade * coverage), cloudMask * 0.94);
          }
        }
        color += vec3(0.62, 0.72, 1.0) * lightningFlash * (0.15 + cloudMask * 0.85);
        if (mistAmount > 0.0 && abs(direction.y) < 0.55) {
          float haze = cloudNoise(direction.xz * 1.2 - windTravel * 0.0018);
          color = mix(color, horizonColor, mistAmount * (0.08 + haze * 0.12) * (1.0 - smoothstep(0.0, 0.55, abs(direction.y))));
        }
        color += (hash(gl_FragCoord.xy) - 0.5) / 1024.0;
        gl_FragColor = vec4(max(color, vec3(0.0)), 1.0);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }
    `,
  });
  const sky = new Mesh(new SphereGeometry(420, 48, 24), skyMaterial);
  sky.name = "weatherSky";
  // 地面和模型先写深度，远平面的天空只填空白，随后再画选点和透明层。
  sky.renderOrder = 1;
  sky.frustumCulled = false;
  group.add(sky);

  // ACT: 固定 26000 条 GPU 雨带分近、中、远体积；只更新 uniforms，不逐帧上传雨点数组。
  const rainCount = 26000;
  const snowCount = 1800;
  const seeds = new Float32Array(rainCount * 4);
  for (let index = 0; index < seeds.length; index++) seeds[index] = random(index + 1);
  const rainGeometry = new InstancedBufferGeometry();
  rainGeometry.setAttribute("position", new Float32BufferAttribute([-1, 0, 0, 1, 0, 0, 1, 1, 0, -1, 0, 0, 1, 1, 0, -1, 1, 0], 3));
  rainGeometry.setAttribute("rainSeed", new InstancedBufferAttribute(seeds, 4));
  rainGeometry.instanceCount = 0;
  const rainUniforms = { weatherTime: { value: 0 }, rainAmount: { value: 0 }, volumeSpan: { value: 64 }, weatherCamera: { value: new Vector3() }, windVelocity: { value: new Vector2() }, windTravel: { value: new Vector2() }, rainColor: { value: new Color("#c3d2df") }, mistColor: { value: new Color("#8b9baa") }, mistFar: { value: 150 } };
  const rainMaterial = new ShaderMaterial({
    uniforms: rainUniforms, transparent: true, depthWrite: false, depthTest: true, side: DoubleSide,
    vertexShader: /* glsl */ `
      attribute vec4 rainSeed;
      uniform float weatherTime;
      uniform float rainAmount;
      uniform float volumeSpan;
      uniform vec3 weatherCamera;
      uniform vec2 windVelocity;
      uniform vec2 windTravel;
      varying vec2 dropUv;
      varying float dropFade;
      varying float dropDistance;
      void main() {
        float tier = min(floor(rainSeed.w * 3.0), 2.0);
        float extent = volumeSpan * mix(0.6, 3.6, tier * 0.5);
        float height = mix(32.0, 100.0, tier * 0.5);
        float bottom = weatherCamera.y - mix(12.0, 40.0, tier * 0.5);
        float fallSpeed = mix(9.0, 30.0, rainAmount) * (0.8 + rainSeed.w * 0.5);
        vec2 local = mod(rainSeed.xy * extent + windTravel - weatherCamera.xz + extent * 0.5, extent) - extent * 0.5;
        float y = bottom + mod(rainSeed.z * height - weatherTime * fallSpeed - bottom, height);
        vec3 center = vec3(weatherCamera.x + local.x, y, weatherCamera.z + local.y);
        vec4 mvPosition = viewMatrix * vec4(center, 1.0);
        vec3 velocity = mat3(viewMatrix) * vec3(windVelocity.x, -fallSpeed, windVelocity.y);
        vec2 side = vec2(-velocity.y, velocity.x);
        side = length(side) > 0.001 ? normalize(side) : vec2(1.0, 0.0);
        mvPosition.xyz += velocity * (position.y - 0.5) * mix(0.014, 0.075, rainAmount);
        mvPosition.xy += side * position.x * mix(0.006, 0.026, rainAmount) * (0.6 + rainSeed.w) * (1.0 + tier * 0.6);
        dropUv = vec2(position.x, position.y);
        dropDistance = length(mvPosition.xyz);
        dropFade = (1.0 - smoothstep(0.74, 1.0, max(abs(local.x), abs(local.y)) / (extent * 0.5))) * smoothstep(0.4, 1.4, dropDistance);
        gl_Position = projectionMatrix * mvPosition;
      }
    `,
    fragmentShader: /* glsl */ `
      uniform float rainAmount;
      uniform vec3 rainColor;
      uniform vec3 mistColor;
      uniform float mistFar;
      varying vec2 dropUv;
      varying float dropFade;
      varying float dropDistance;
      void main() {
        float edge = 1.0 - smoothstep(0.12, 1.0, abs(dropUv.x));
        float taper = pow(max(sin(dropUv.y * 3.14159265), 0.0), 0.6);
        float alpha = edge * taper * dropFade * mix(0.16, 0.46, rainAmount);
        if (alpha < 0.008) discard;
        vec3 color = mix(rainColor, mistColor, smoothstep(mistFar * 0.25, mistFar, dropDistance) * 0.6);
        gl_FragColor = vec4(color, alpha);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }
    `,
  });
  const rain = new Mesh(rainGeometry, rainMaterial);
  rain.frustumCulled = false;
  rain.renderOrder = 2;
  const snowPositions = new Float32BufferAttribute(new Float32Array(snowCount * 3), 3).setUsage(DynamicDrawUsage);
  const snowSizes = new Float32BufferAttribute(Array.from({ length: snowCount }, (_, index) => 0.7 + random(index + 11001) * 0.9), 1);
  const snowGeometry = new BufferGeometry();
  snowGeometry.setAttribute("position", snowPositions);
  snowGeometry.setAttribute("flakeSize", snowSizes);
  const snowMaterial = new ShaderMaterial({
    uniforms: { opacity: { value: 0.8 }, halfSpan: { value: 30 }, flakeColor: { value: new Color("#edf5ff") } },
    transparent: true, depthWrite: false, depthTest: true,
    vertexShader: /* glsl */ `
      attribute float flakeSize;
      uniform float halfSpan;
      varying float edgeFade;
      void main() {
        vec4 viewPosition = modelViewMatrix * vec4(position, 1.0);
        edgeFade = 1.0 - smoothstep(0.72, 1.0, max(abs(position.x), abs(position.z)) / halfSpan);
        gl_PointSize = clamp(flakeSize * 55.0 / max(1.0, -viewPosition.z), 1.0, 8.0);
        gl_Position = projectionMatrix * viewPosition;
      }
    `,
    fragmentShader: /* glsl */ `
      uniform float opacity;
      uniform vec3 flakeColor;
      varying float edgeFade;
      void main() {
        vec2 center = gl_PointCoord * 2.0 - 1.0;
        float radius = dot(center, center);
        float alpha = (1.0 - smoothstep(0.16, 1.0, radius)) * opacity * edgeFade;
        if (alpha < 0.015) discard;
        gl_FragColor = vec4(flakeColor, alpha);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }
    `,
  });
  const snow = new Points(snowGeometry, snowMaterial);
  snow.frustumCulled = false;
  snow.renderOrder = 2;
  const mistGeometry = new InstancedBufferGeometry();
  mistGeometry.setAttribute("position", new Float32BufferAttribute([-1, -1, 0, 1, -1, 0, 1, 1, 0, -1, -1, 0, 1, 1, 0, -1, 1, 0], 3));
  mistGeometry.setAttribute("mistSeed", new InstancedBufferAttribute(seeds.slice(0, 48 * 4), 4));
  mistGeometry.instanceCount = 48;
  const mistUniforms = { amount: { value: 0 }, volumeSpan: { value: 64 }, weatherCamera: { value: new Vector3() }, windTravel: { value: new Vector2() }, mistColor: { value: new Color("#8b9baa") } };
  const mistMaterial = new ShaderMaterial({
    uniforms: mistUniforms, transparent: true, depthTest: true, depthWrite: false, side: DoubleSide,
    vertexShader: /* glsl */ `
      attribute vec4 mistSeed;
      uniform float volumeSpan;
      uniform vec3 weatherCamera;
      uniform vec2 windTravel;
      varying vec2 mistUv;
      varying float mistPhase;
      varying float mistFade;
      void main() {
        float extent = volumeSpan * 1.5;
        vec2 local = mod(mistSeed.xy * extent + windTravel * 0.45 - weatherCamera.xz + extent * 0.5, extent) - extent * 0.5;
        vec3 center = vec3(weatherCamera.x + local.x, weatherCamera.y - 8.0 + mistSeed.z * 20.0, weatherCamera.z + local.y);
        vec4 mvPosition = viewMatrix * vec4(center, 1.0);
        mvPosition.xy += position.xy * vec2(7.0 + mistSeed.w * 13.0, 2.0 + mistSeed.w * 5.0);
        mistUv = position.xy;
        mistPhase = mistSeed.w * 17.0;
        mistFade = (1.0 - smoothstep(0.7, 1.0, max(abs(local.x), abs(local.y)) / (extent * 0.5))) * smoothstep(2.0, 9.0, -mvPosition.z);
        gl_Position = projectionMatrix * mvPosition;
      }
    `,
    fragmentShader: /* glsl */ `
      uniform float amount;
      uniform vec3 mistColor;
      varying vec2 mistUv;
      varying float mistPhase;
      varying float mistFade;
      float hash(vec2 point) { return fract(sin(dot(point, vec2(127.1, 311.7))) * 43758.5453); }
      float noise(vec2 point) {
        vec2 cell = floor(point);
        vec2 part = fract(point);
        part = part * part * (3.0 - 2.0 * part);
        return mix(mix(hash(cell), hash(cell + vec2(1.0, 0.0)), part.x), mix(hash(cell + vec2(0.0, 1.0)), hash(cell + 1.0), part.x), part.y);
      }
      void main() {
        float edge = 1.0 - smoothstep(0.08, 1.0, dot(mistUv, mistUv));
        float cloud = noise(mistUv * 3.0 + mistPhase) * 0.65 + noise(mistUv * 7.0 - mistPhase) * 0.35;
        float alpha = edge * cloud * mistFade * amount * 0.12;
        if (alpha < 0.002) discard;
        gl_FragColor = vec4(mistColor, alpha);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }
    `,
  });
  const mist = new Mesh(mistGeometry, mistMaterial);
  mist.frustumCulled = false;
  mist.renderOrder = 1.5;
  const atmosphere = createWorldAtmosphere();
  group.add(rain, snow, mist, atmosphere.group);
  let current: SceneWeather | undefined;
  let currentTime: SceneTime | undefined;
  let strengths = getLayerStrengths(undefined);
  let span = 64;
  let disposed = false;

  function update(weather: SceneWeather | undefined, terrainSize: number, sceneSize = 0, time?: SceneTime) {
    current = weather ? { ...weather, intensity: clampUnit(weather.intensity), wind: clampUnit(weather.wind) } : undefined;
    currentTime = time;
    const cycle = getLightingCycle(current, time);
    const period = getPeriodLighting(current, time);
    const celestial = time ? getCelestialState(time) : undefined;
    const condition = current?.condition ?? "clear";
    const intensity = current?.intensity ?? 0;
    strengths = getLayerStrengths(current);
    const visibilitySize = Math.max(terrainSize, sceneSize);
    const baseLighting = getWeatherLighting(current, time);
    const azimuth = baseLighting.sunAzimuth * Math.PI / 180;
    const elevation = baseLighting.sunElevation * Math.PI / 180;
    const sunDirection = new Vector3(Math.cos(elevation) * Math.cos(azimuth), Math.sin(elevation), Math.cos(elevation) * Math.sin(azimuth));
    const periodPosition = period.sunPosition;
    const lightDistance = Math.hypot(periodPosition.x, periodPosition.y, periodPosition.z) * Math.max(1, terrainSize / 40);
    const lighting = { ...period, ...baseLighting, sunPosition: { x: sunDirection.x * lightDistance, y: sunDirection.y * lightDistance, z: sunDirection.z * lightDistance }, fogNear: Math.max(terrainSize > 0 ? 130 : 65, visibilitySize * 1.6), fogFar: Math.max(terrainSize > 0 ? 360 : 180, visibilitySize * 4.5) };
    const overcast = Math.max(strengths.clouds, strengths.rain, strengths.snow, strengths.fog);
    const precipitation = Math.max(strengths.rain, strengths.snow, strengths.hail);
    const storm = Math.max(strengths.rain ** 2, strengths.thunder * 0.8, strengths.blizzard * 0.8);
    const dust = Math.max(strengths.dust * 0.6, strengths.sandstorm, strengths.haze * 0.65);
    const obscuration = Math.max(strengths.fog, strengths.sandstorm, strengths.blizzard * 0.92, strengths.haze * 0.65, strengths.dust * 0.45);
    const haze = cycleColor(cycle, "#b8c4cf", "#c8b9bb", "#344152");
    const dustColor = cycleColor(cycle, "#c6a26d", "#b78b68", "#493d37");
    const snowHaze = cycleColor(cycle, "#c6d4de", "#bfc3d0", "#34445c");
    lighting.background = mixColor(lighting.background, haze, overcast * 0.65);
    lighting.fogColor = mixColor(lighting.fogColor, haze, overcast * 0.75);
    const lightOvercast = overcast * baseLighting.weatherInfluence;
    const lightStorm = storm * baseLighting.weatherInfluence;
    const lightFog = strengths.fog * baseLighting.weatherInfluence;
    const lightDust = dust * baseLighting.weatherInfluence;
    // ACT: 天气采用艺术化衰减与冷色散射近似，不模拟真实光谱；乘法保留手动强度为0时的关灯语义。
    lighting.sunIntensity *= (1 - lightOvercast * 0.78) * (1 - lightStorm * 0.55);
    lighting.sunColor = mixColor(lighting.sunColor, cycleColor(cycle, "#c1d2df", "#c1d2df", "#91a7c6"), lightOvercast * 0.14 + lightStorm * 0.22 + lightFog * 0.08);
    lighting.ambientIntensity *= (1 + lightOvercast * cycleNumber(cycle, 0.12, 0.12, 0.04) / period.ambientIntensity) * (1 - lightStorm * 0.28);
    lighting.ambientColor = mixColor(lighting.ambientColor, cycleColor(cycle, "#b8c4cf", "#c8b9bb", "#7c91b3"), lightOvercast * 0.25 + lightStorm * 0.15);
    lighting.skyIntensity *= 1 - lightOvercast * 0.28 - lightStorm * 0.35 - lightFog * 0.12;
    lighting.skyColor = mixColor(lighting.skyColor, cycleColor(cycle, "#667b90", "#667b90", "#52627c"), lightStorm * 0.72);
    lighting.skyColor = mixColor(lighting.skyColor, haze, lightFog * 0.35);
    lighting.exposure *= 1 - lightStorm * 0.14;
    lighting.sunIntensity *= 1 - lightDust * 0.88;
    lighting.sunColor = mixColor(lighting.sunColor, "#d9a86b", lightDust * 0.7);
    lighting.ambientColor = mixColor(lighting.ambientColor, dustColor, lightDust * 0.7);
    lighting.skyColor = mixColor(lighting.skyColor, dustColor, lightDust * 0.8);
    lighting.skyIntensity *= 1 - lightDust * 0.5;
    lighting.exposure *= 1 - lightDust * 0.18;
    lighting.fogColor = mixColor(lighting.fogColor, cycleColor(cycle, "#7d8d9c", "#7d8d9c", "#293746"), storm * 0.75);
    lighting.background = mixColor(lighting.background, lighting.fogColor, storm);
    lighting.fogColor = mixColor(lighting.fogColor, dustColor, dust * 0.9);
    lighting.fogColor = mixColor(lighting.fogColor, snowHaze, strengths.blizzard * 0.8);
    lighting.background = mixColor(lighting.background, lighting.fogColor, Math.max(dust, strengths.blizzard));
    lighting.fogNear *= 1 - precipitation * 0.7;
    lighting.fogFar *= 1 - precipitation * 0.6;
    lighting.fogNear *= 1 - storm * 0.72;
    lighting.fogFar *= 1 - storm * 0.58;
    lighting.fogNear = lighting.fogNear * (1 - obscuration) ** 3 + (3 - strengths.sandstorm) * obscuration;
    lighting.fogFar = lighting.fogFar * (1 - obscuration) ** 2 + (25 - strengths.sandstorm * 13) * obscuration;
    span = Math.max(48, Math.min(96, terrainSize * 0.8 || 64));
    group.visible = !disposed && (!!current || !!time);
    rain.visible = group.visible && strengths.rain > 0;
    snow.visible = group.visible && strengths.snow > 0;
    rainGeometry.instanceCount = Math.floor(rainCount * (strengths.rain * 0.018 + strengths.rain ** 2.2 * 0.982));
    snowGeometry.setDrawRange(0, Math.floor(snowCount * strengths.snow));
    rainUniforms.rainAmount.value = strengths.rain;
    rainUniforms.volumeSpan.value = span;
    rainUniforms.rainColor.value.set(cycleColor(cycle, "#c3d2df", "#c3d2df", "#a1b4d0"));
    rainUniforms.mistColor.value.set(lighting.fogColor);
    rainUniforms.mistFar.value = lighting.fogFar;
    snowMaterial.uniforms.opacity.value = 0.5 + strengths.snow * 0.35;
    snowMaterial.uniforms.halfSpan.value = span / 2;
    snowMaterial.uniforms.flakeColor.value.set(cycleColor(cycle, "#edf5ff", "#d9d0e4", "#53627e"));
    const mistAmount = Math.max(strengths.fog, storm * 0.9, strengths.snow * 0.15, strengths.sandstorm, strengths.dust * 0.5, strengths.haze * 0.55, strengths.blizzard);
    mist.visible = group.visible && mistAmount > 0.001;
    mistUniforms.amount.value = mistAmount;
    mistUniforms.volumeSpan.value = span;
    mistUniforms.mistColor.value.set(lighting.fogColor);
    skyUniforms.mistAmount.value = mistAmount;
    skyUniforms.coverage.value = !current?.layers && condition === "clear" ? 0.08 + intensity * 0.18 : 0.08 + overcast * 0.92;
    skyUniforms.zenithColor.value.set(cycleColor(cycle, "#8fb9dc", "#7386ac", "#09152b")).lerp(new Color(haze), overcast * 0.85);
    skyUniforms.horizonColor.value.set(current ? mixColor(lighting.fogColor, "#dce8f0", cycleNumber(cycle, 1, 0, 0) * (1 - overcast)) : lighting.fogColor);
    skyUniforms.cloudColor.value.set(cycleColor(cycle, "#ffffff", "#f4c1a4", "#4c5e7a"));
    skyUniforms.cloudShadow.value.set(cycleColor(cycle, "#8999ac", "#9d8b9b", "#19283d"));
    skyUniforms.zenithColor.value.lerp(new Color(cycleColor(cycle, "#536678", "#536678", "#132237")), storm * 0.75);
    skyUniforms.cloudColor.value.lerp(new Color(cycleColor(cycle, "#9ca9b5", "#9ca9b5", "#263649")), storm);
    skyUniforms.cloudShadow.value.lerp(new Color(cycleColor(cycle, "#485969", "#485969", "#111c2c")), storm);
    skyUniforms.zenithColor.value.lerp(new Color(dustColor), dust * 0.94);
    skyUniforms.horizonColor.value.lerp(new Color(dustColor), dust * 0.6);
    skyUniforms.cloudColor.value.lerp(new Color(dustColor), dust * 0.65);
    skyUniforms.cloudShadow.value.lerp(new Color(dustColor).multiplyScalar(0.58), dust * 0.6);
    skyUniforms.zenithColor.value.lerp(new Color(snowHaze), strengths.blizzard * 0.75);
    const solarAngle = (getWeatherHour(current) - 6) * Math.PI / 12;
    const actualSun = celestial?.sunDirection ?? { x: Math.cos(solarAngle), y: Math.sin(solarAngle), z: 0 };
    const solarAltitude = directionElevation(actualSun);
    skyUniforms.solarDirection.value.set(actualSun.x, actualSun.y, actualSun.z);
    skyUniforms.twilightGlow.value = smoothStep(-14, -2, solarAltitude) * (1 - smoothStep(4, 16, solarAltitude)) * (1 - overcast * 0.8) * (1 - dust * 0.8);
    atmosphere.update(current, span, { sunDirection: actualSun, night: celestial?.night ?? cycleNumber(cycle, 0, 0, 1), cloudCoverage: skyUniforms.coverage.value, visibility: 1 - obscuration * 0.94 });
    return lighting;
  }

  function animate(seconds: number, cameraPosition: Vector3Value) {
    if (disposed || (!current && !currentTime)) return false;
    const time = Number.isFinite(seconds) ? seconds : 0;
    const environment = getWeatherEnvironment(current, time);
    const wind = sampleWind(current, time);
    const flash = atmosphere.getFlash(time);
    const activeAtmosphere = atmosphere.animate(time, cameraPosition, wind, flash);
    skyUniforms.lightningFlash.value = flash;
    sky.position.set(cameraPosition.x, cameraPosition.y, cameraPosition.z);
    skyUniforms.windTravel.value.set(wind.travelX, wind.travelZ);
    mistUniforms.weatherCamera.value.set(cameraPosition.x, cameraPosition.y, cameraPosition.z);
    mistUniforms.windTravel.value.set(wind.travelX, wind.travelZ);
    const height = 42;
    const bottom = cameraPosition.y - 12;
    const half = span / 2;
    if (rain.visible) {
      rainUniforms.weatherTime.value = time;
      rainUniforms.weatherCamera.value.set(cameraPosition.x, cameraPosition.y, cameraPosition.z);
      rainUniforms.windVelocity.value.set(environment.windX, environment.windZ);
      rainUniforms.windTravel.value.set(wind.travelX, wind.travelZ);
    }
    if (snow.visible) {
      snow.position.set(cameraPosition.x, bottom, cameraPosition.z);
      const count = Math.floor(snowCount * strengths.snow);
      for (let index = 0; index < count; index++) {
        const offset = index * 4;
        const phase = seeds[offset + 3]! * Math.PI * 2;
        const x = wrap(seeds[offset]! * span + wind.travelX * 0.45 + Math.sin(time * 0.7 + phase) * 0.7 - cameraPosition.x + half, span) - half;
        const z = wrap(seeds[offset + 1]! * span + wind.travelZ * 0.45 + Math.cos(time * 0.5 + phase) * 0.55 - cameraPosition.z + half, span) - half;
        const y = wrap(seeds[offset + 2]! * height - time * (0.7 + seeds[offset + 3]! * 1.1 + strengths.blizzard * 3.2) - bottom, height);
        snowPositions.setXYZ(index, x, y, z);
      }
      snowPositions.needsUpdate = true;
    }
    return rain.visible || snow.visible || activeAtmosphere || Math.abs(wind.windX) + Math.abs(wind.windZ) > 0.001;
  }

  function dispose() {
    if (disposed) return;
    disposed = true;
    group.visible = false;
    sky.geometry.dispose();
    skyMaterial.dispose();
    rainGeometry.dispose();
    rainMaterial.dispose();
    snowGeometry.dispose();
    snowMaterial.dispose();
    mistGeometry.dispose();
    mistMaterial.dispose();
    atmosphere.dispose();
    group.clear();
  }

  update(undefined, 0);
  return { group, update, animate, dispose };
}
