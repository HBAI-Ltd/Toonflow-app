import { AmbientLight, BackSide, Color, DoubleSide, Float32BufferAttribute, Group, InstancedBufferAttribute, InstancedBufferGeometry, Mesh, ShaderMaterial, SphereGeometry, Vector2, Vector3 } from "three";
import type { SceneWeather, Vector3Value } from "./sceneDocument";
import { getWeatherStrengths } from "./weatherModel";

function random(index: number) { const value = Math.sin(index * 127.1 + 43.7) * 43758.5453; return value - Math.floor(value); }

type AtmosphereContext = { sunDirection: Vector3Value; night: number; cloudCoverage: number; visibility: number };
type AtmosphereWind = { windX: number; windZ: number; travelX: number; travelZ: number };

function createParticles(count: number, hail: boolean) {
  const seeds = new Float32Array(count * 4);
  for (let index = 0; index < seeds.length; index++) seeds[index] = random(index + (hail ? 27003 : 58001));
  const geometry = new InstancedBufferGeometry();
  geometry.setAttribute("position", new Float32BufferAttribute([-1, -1, 0, 1, -1, 0, 1, 1, 0, -1, -1, 0, 1, 1, 0, -1, 1, 0], 3));
  geometry.setAttribute("particleSeed", new InstancedBufferAttribute(seeds, 4));
  geometry.instanceCount = 0;
  const uniforms = {
    weatherSeconds: { value: 0 }, weatherCamera: { value: new Vector3() }, windTravel: { value: new Vector2() },
    volumeSpan: { value: 64 }, amount: { value: 0 }, hailMode: { value: Number(hail) }, particleColor: { value: new Color(hail ? "#d8edff" : "#bfa373") },
  };
  const material = new ShaderMaterial({
    uniforms, transparent: true, depthTest: true, depthWrite: false, side: DoubleSide,
    vertexShader: /* glsl */ `
      attribute vec4 particleSeed;
      uniform float weatherSeconds;
      uniform vec3 weatherCamera;
      uniform vec2 windTravel;
      uniform float volumeSpan;
      uniform float amount;
      uniform float hailMode;
      varying vec2 particleUv;
      varying float particleFade;
      varying float particleShade;
      void main() {
        float extent = volumeSpan * mix(1.4, 1.0, hailMode);
        float height = mix(28.0, 52.0, hailMode);
        float bottom = weatherCamera.y - mix(12.0, 16.0, hailMode);
        vec2 drift = windTravel * mix(0.82, 0.68, hailMode);
        drift += vec2(sin(weatherSeconds * 0.8 + particleSeed.w * 30.0), cos(weatherSeconds * 0.61 + particleSeed.z * 30.0)) * (1.0 - hailMode) * 1.4;
        vec2 local = mod(particleSeed.xy * extent + drift - weatherCamera.xz + extent * 0.5, extent) - extent * 0.5;
        float velocity = mix(-0.4 - particleSeed.w * 0.8, 14.0 + particleSeed.w * 12.0, hailMode);
        float y = bottom + mod(particleSeed.z * height - weatherSeconds * velocity - bottom, height);
        vec3 center = vec3(weatherCamera.x + local.x, y, weatherCamera.z + local.y);
        vec4 viewPosition = viewMatrix * vec4(center, 1.0);
        float size = mix(0.035 + particleSeed.w * 0.13, 0.035 + particleSeed.w * 0.065, hailMode);
        viewPosition.xy += position.xy * size;
        particleUv = position.xy;
        particleFade = (1.0 - smoothstep(0.72, 1.0, max(abs(local.x), abs(local.y)) / (extent * 0.5))) * smoothstep(0.5, 2.0, -viewPosition.z);
        particleFade *= mix(1.0 - smoothstep(extent * 0.4, extent, length(viewPosition.xyz)), 1.0, hailMode);
        particleShade = 0.65 + particleSeed.w * 0.35;
        gl_Position = projectionMatrix * viewPosition;
      }
    `,
    fragmentShader: /* glsl */ `
      uniform float amount;
      uniform float hailMode;
      uniform vec3 particleColor;
      varying vec2 particleUv;
      varying float particleFade;
      varying float particleShade;
      void main() {
        float radius = dot(particleUv, particleUv);
        float edge = 1.0 - smoothstep(mix(0.05, 0.65, hailMode), 1.0, radius);
        float alpha = edge * particleFade * mix(0.12 + amount * 0.12, 0.85, hailMode);
        if (alpha < 0.004) discard;
        vec3 color = particleColor * particleShade;
        color += vec3(0.4, 0.45, 0.5) * pow(max(0.0, 1.0 - length(particleUv - vec2(-0.3, 0.3))), 12.0) * hailMode;
        gl_FragColor = vec4(color, alpha);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }
    `,
  });
  const mesh = new Mesh(geometry, material);
  mesh.name = hail ? "weatherHail" : "weatherDust";
  mesh.frustumCulled = false;
  mesh.renderOrder = hail ? 2.2 : 1.8;
  return { mesh, geometry, material, uniforms };
}

export function createWorldAtmosphere() {
  const group = new Group();
  group.name = "worldAtmosphere";
  // ACT: 粒子为有界气象体积，不逐颗求地形刚体；冰雹 3200、尘粒 12000 上限，运动只更新 uniforms。
  const hail = createParticles(3200, true);
  const dust = createParticles(12000, false);
  const lightningLight = new AmbientLight("#b9cdff", 0);
  lightningLight.name = "weatherLightning";
  const skyUniforms = {
    weatherSeconds: { value: 0 }, windTravel: { value: new Vector2() }, coverage: { value: 0 }, visibility: { value: 1 }, night: { value: 0 },
    sunDirection: { value: new Vector3(0, 1, 0) }, auroraAmount: { value: 0 }, auroraColor: { value: new Color("#7ce8b7") }, auroraDirection: { value: 0 },
    rainbowAmount: { value: 0 }, meteorAmount: { value: 0 }, lightningFlash: { value: 0 }, boltSeed: { value: 0 },
  };
  const skyMaterial = new ShaderMaterial({
    uniforms: skyUniforms, transparent: true, side: BackSide, depthTest: true, depthWrite: false, fog: false,
    vertexShader: /* glsl */ `
      varying vec3 skyDirection;
      void main() {
        skyDirection = position;
        vec4 clip = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        gl_Position = clip.xyww;
      }
    `,
    fragmentShader: /* glsl */ `
      uniform float weatherSeconds;
      uniform vec2 windTravel;
      uniform float coverage;
      uniform float visibility;
      uniform float night;
      uniform vec3 sunDirection;
      uniform float auroraAmount;
      uniform vec3 auroraColor;
      uniform float auroraDirection;
      uniform float rainbowAmount;
      uniform float meteorAmount;
      uniform float lightningFlash;
      uniform float boltSeed;
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
      float angularDelta(float a, float b) { return atan(sin(a - b), cos(a - b)); }
      float segmentDistance(vec2 point, vec2 end) {
        return length(point - end * clamp(dot(point, end) / dot(end, end), 0.0, 1.0));
      }
      void main() {
        vec3 direction = normalize(skyDirection);
        float azimuth = atan(direction.z, direction.x);
        float altitude = asin(clamp(direction.y, -1.0, 1.0));
        float upper = smoothstep(0.015, 0.15, direction.y);
        vec2 cloudPosition = direction.xz / max(direction.y + 0.18, 0.2) * 1.35 - windTravel * 0.0012;
        float cloudMask = smoothstep(0.69 - coverage * 0.4, 0.87 - coverage * 0.35, cloudNoise(cloudPosition)) * smoothstep(0.015, 0.16, direction.y);
        float transmission = (1.0 - cloudMask * 0.98) * visibility * upper;
        vec3 color = vec3(0.0);
        float alpha = 0.0;
        if (auroraAmount > 0.001 && night > 0.01) {
          float angle = angularDelta(azimuth, auroraDirection);
          float drift = weatherSeconds * 0.045 + dot(windTravel, vec2(0.00003));
          float fold = sin(angle * 3.4 + drift) * 0.1 + sin(angle * 7.0 - drift * 1.4) * 0.045;
          float ribbonDistance = (altitude - 0.38 - fold) / 0.11;
          float ribbon = exp(-ribbonDistance * ribbonDistance);
          float curtain = pow(0.5 + 0.5 * sin(angle * 80.0 + noise(vec2(angle * 8.0, drift)) * 12.0), 1.8);
          float upperDistance = (altitude - 0.56 - fold) / 0.22;
          float upperRibbon = exp(-upperDistance * upperDistance) * 0.3;
          float intensity = (ribbon * (0.4 + curtain * 0.6) + upperRibbon) * exp(-angle * angle * 0.28) * auroraAmount * night * transmission;
          color += mix(auroraColor, vec3(0.36, 0.13, 0.58), smoothstep(0.32, 0.8, altitude)) * intensity * 1.25;
          alpha = max(alpha, min(0.8, intensity * 0.72));
        }
        if (rainbowAmount > 0.001 && sunDirection.y > 0.0) {
          float angle = acos(clamp(dot(direction, -sunDirection), -1.0, 1.0));
          float band = (angle - 0.705) / 0.038;
          float edge = smoothstep(0.0, 0.13, band) * (1.0 - smoothstep(0.87, 1.0, band));
          vec3 bandDistance = (vec3(band) - vec3(0.85, 0.5, 0.16)) / vec3(0.26, 0.23, 0.23);
          vec3 rainbow = exp(-bandDistance * bandDistance);
          float intensity = edge * rainbowAmount * (1.0 - night) * smoothstep(0.0, 0.1, sunDirection.y) * transmission;
          color += rainbow * intensity * 0.5;
          alpha = max(alpha, intensity * 0.35);
        }
        if (meteorAmount > 0.001 && night > 0.01) {
          for (int index = 0; index < 3; index++) {
            float epoch = (weatherSeconds + float(index) * 7.1) / 19.0;
            float seed = floor(epoch) + float(index) * 37.0;
            float age = fract(epoch) * 19.0;
            float start = hash(vec2(seed, 17.0)) * 6.2831853 - 3.14159265;
            float headAltitude = 0.45 + hash(vec2(seed, 31.0)) * 0.55 - age * 0.35;
            vec2 point = vec2(angularDelta(azimuth, start - age * 0.65), altitude - headAltitude);
            float trail = exp(-segmentDistance(point, vec2(0.25, 0.135)) * 850.0);
            trail *= 1.0 - clamp(dot(point, vec2(0.25, 0.135)) / 0.080725, 0.0, 1.0);
            float glow = exp(-length(point) * 450.0);
            float intensity = (trail + glow) * smoothstep(0.0, 0.06, age) * (1.0 - smoothstep(0.55, 0.85, age)) * meteorAmount * night * transmission;
            color += vec3(0.65, 0.83, 1.0) * intensity;
            alpha = max(alpha, min(0.95, intensity));
          }
        }
        if (lightningFlash > 0.001) {
          float angle = angularDelta(azimuth, boltSeed * 6.2831853 - 3.14159265);
          float branch = noise(vec2(altitude * 24.0, boltSeed * 71.0)) * 0.1 + sin(altitude * 90.0) * 0.008;
          float distanceToBolt = abs(angle - branch);
          float bolt = (exp(-distanceToBolt * 900.0) + exp(-distanceToBolt * 80.0) * 0.12) * smoothstep(0.02, 0.06, altitude) * (1.0 - smoothstep(0.64, 0.72, altitude));
          float intensity = bolt * lightningFlash * visibility;
          color += vec3(0.72, 0.81, 1.0) * intensity * 2.0;
          alpha = max(alpha, min(1.0, intensity));
        }
        if (alpha < 0.0005) discard;
        gl_FragColor = vec4(color / max(alpha, 0.001), alpha);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }
    `,
  });
  const sky = new Mesh(new SphereGeometry(418, 48, 24), skyMaterial);
  sky.name = "weatherPhenomena";
  sky.frustumCulled = false;
  sky.renderOrder = -850;
  group.add(hail.mesh, dust.mesh, sky, lightningLight);
  let strengths = getWeatherStrengths();
  let weatherInfluence = 1;
  let disposed = false;

  function update(weather: SceneWeather | undefined, span: number, context: AtmosphereContext) {
    strengths = getWeatherStrengths(weather);
    weatherInfluence = weather?.lighting?.weatherInfluence ?? 1;
    const dustAmount = Math.max(strengths.dust, strengths.sandstorm);
    hail.geometry.instanceCount = Math.floor(3200 * strengths.hail);
    dust.geometry.instanceCount = Math.floor(12000 * dustAmount);
    hail.mesh.visible = strengths.hail > 0;
    dust.mesh.visible = dustAmount > 0;
    hail.uniforms.volumeSpan.value = span;
    dust.uniforms.volumeSpan.value = span;
    hail.uniforms.amount.value = strengths.hail;
    dust.uniforms.amount.value = dustAmount;
    hail.uniforms.particleColor.value.set("#d8edff").multiplyScalar(1 - context.night * 0.65);
    dust.uniforms.particleColor.value.set(strengths.sandstorm > 0 ? "#bda073" : "#b9ae94").multiplyScalar(1 - context.night * 0.75);
    skyUniforms.sunDirection.value.set(context.sunDirection.x, context.sunDirection.y, context.sunDirection.z).normalize();
    skyUniforms.night.value = context.night;
    skyUniforms.coverage.value = context.cloudCoverage;
    skyUniforms.visibility.value = context.visibility;
    skyUniforms.auroraAmount.value = strengths.aurora;
    skyUniforms.auroraColor.value.set(weather?.auroraColor ?? "#7ce8b7");
    skyUniforms.auroraDirection.value = (weather?.auroraDirection ?? 270) * Math.PI / 180;
    skyUniforms.rainbowAmount.value = strengths.rainbow;
    skyUniforms.meteorAmount.value = strengths.meteors;
    sky.visible = Math.max(strengths.aurora, strengths.rainbow, strengths.meteors, strengths.thunder) > 0;
    lightningLight.intensity = 0;
  }

  function getFlash(seconds: number) {
    if (disposed || strengths.thunder <= 0) return 0;
    // ACT: 每 12–18 秒一次短闪，不做高频频闪；固定种子让编辑视口与 AI 观察使用同一条天气时间线。
    const cycle = Math.floor(seconds / 15);
    const age = seconds - (cycle * 15 + 4 + random(cycle + 4001) * 3);
    return age >= 0 && age < 0.24 ? Math.exp(-age * 22) * strengths.thunder : 0;
  }

  function animate(seconds: number, cameraPosition: Vector3Value, wind: AtmosphereWind, flash: number) {
    if (disposed) return false;
    sky.position.set(cameraPosition.x, cameraPosition.y, cameraPosition.z);
    skyUniforms.weatherSeconds.value = seconds;
    skyUniforms.windTravel.value.set(wind.travelX, wind.travelZ);
    skyUniforms.lightningFlash.value = flash;
    skyUniforms.boltSeed.value = random(Math.floor(seconds / 15) + 4001);
    lightningLight.intensity = flash * 4 * weatherInfluence;
    for (const particles of [hail, dust]) {
      if (!particles.mesh.visible) continue;
      particles.uniforms.weatherSeconds.value = seconds;
      particles.uniforms.weatherCamera.value.set(cameraPosition.x, cameraPosition.y, cameraPosition.z);
      particles.uniforms.windTravel.value.set(wind.travelX, wind.travelZ);
    }
    return hail.mesh.visible || dust.mesh.visible || sky.visible;
  }

  function dispose() {
    if (disposed) return;
    disposed = true;
    for (const particles of [hail, dust]) { particles.geometry.dispose(); particles.material.dispose(); }
    sky.geometry.dispose();
    skyMaterial.dispose();
    lightningLight.dispose();
    group.clear();
  }

  return { group, update, animate, getFlash, dispose };
}
