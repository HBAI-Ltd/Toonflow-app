import { BackSide, Group, Mesh, ShaderMaterial, SphereGeometry, Vector2, Vector3 } from "three";
import type { SceneTime, SceneWeather, Vector3Value } from "./sceneDocument";
import { getWeatherStrengths } from "./weatherModel";
import { getCelestialState } from "./worldTime";

export function createWorldCelestials() {
  const group = new Group();
  group.name = "worldCelestials";
  const uniforms = {
    sunDirection: { value: new Vector3(0, 1, 0) }, moonDirection: { value: new Vector3(0, -1, 0) },
    moonLightDirection: { value: new Vector3(0, 1, 0) }, sunAngularRadius: { value: 0.00465047 }, moonAngularRadius: { value: 0.00452 }, sunDistance: { value: 1 },
    moonPhase: { value: 0 }, moonIntensity: { value: 1 }, starIntensity: { value: 1 }, night: { value: 0 },
    skyRotation: { value: 0 }, latitude: { value: 35 * Math.PI / 180 }, northOffset: { value: 0 },
    coverage: { value: 0.08 }, extinction: { value: 0 }, windTravel: { value: new Vector2() }, celestialTime: { value: 0 },
  };
  const geometry = new SphereGeometry(1, 32, 16);
  const material = new ShaderMaterial({
    uniforms, side: BackSide, transparent: true, depthWrite: false, depthTest: true, fog: false,
    vertexShader: `
      varying vec3 skyDirection;
      void main() {
        skyDirection = position;
        vec4 clip = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        gl_Position = clip.xyww;
      }
    `,
    fragmentShader: `
      uniform vec3 sunDirection;
      uniform vec3 moonDirection;
      uniform vec3 moonLightDirection;
      uniform float sunAngularRadius;
      uniform float moonAngularRadius;
      uniform float sunDistance;
      uniform float moonPhase;
      uniform float moonIntensity;
      uniform float starIntensity;
      uniform float night;
      uniform float skyRotation;
      uniform float latitude;
      uniform float northOffset;
      uniform float coverage;
      uniform float extinction;
      uniform vec2 windTravel;
      uniform float celestialTime;
      varying vec3 skyDirection;
      float hash(vec2 point) { return fract(sin(dot(point, vec2(127.1, 311.7))) * 43758.5453); }
      float noise(vec2 point) {
        vec2 cell = floor(point), part = fract(point);
        part = part * part * (3.0 - 2.0 * part);
        return mix(mix(hash(cell), hash(cell + vec2(1.0, 0.0)), part.x), mix(hash(cell + vec2(0.0, 1.0)), hash(cell + 1.0), part.x), part.y);
      }
      float cloudNoise(vec2 point) {
        float value = 0.0, weight = 0.54;
        for (int octave = 0; octave < 4; octave++) {
          value += noise(point) * weight;
          point = mat2(1.6, 1.2, -1.2, 1.6) * point + 7.3;
          weight *= 0.5;
        }
        return value;
      }
      vec3 rotateAxis(vec3 direction, vec3 axis, float angle) {
        return direction * cos(angle) + cross(axis, direction) * sin(angle) + axis * dot(axis, direction) * (1.0 - cos(angle));
      }
      float airMass(float altitude) {
        float degrees = asin(clamp(altitude, -1.0, 1.0)) * 57.2957795131;
        return clamp(1.0 / (max(altitude, 0.001) + 0.50572 * pow(max(degrees + 6.07995, 0.1), -1.6364)), 1.0, 40.0);
      }
      float basin(vec2 point, vec2 center, vec2 extent) {
        float radius = length((point - center) / extent);
        return 1.0 - smoothstep(0.65, 1.12, radius);
      }
      float craterField(vec2 point, vec2 lightAxis, float frequency, float pixelWidth) {
        vec2 grid = point * frequency;
        vec2 cell = floor(grid);
        float detail = 0.0;
        float antialias = max(0.025, pixelWidth * frequency);
        for (int row = -1; row <= 1; row++) {
          for (int column = -1; column <= 1; column++) {
            vec2 key = cell + vec2(float(column), float(row));
            float seed = hash(key + frequency);
            vec2 center = key + vec2(hash(key + 3.7), hash(key + 9.2)) * 0.7 + 0.15;
            vec2 offset = grid - center;
            float radius = 0.12 + seed * 0.23;
            float distance = length(offset);
            float rim = 1.0 - smoothstep(0.04, 0.04 + antialias, abs(distance - radius));
            float bowl = 1.0 - smoothstep(radius * 0.65, radius + antialias, distance);
            float relief = dot(offset / max(distance, 0.001), lightAxis);
            detail += (rim * (0.6 - relief * 0.4) - bowl * (0.26 + relief * 0.28)) * step(0.38, seed);
          }
        }
        return detail;
      }
      float lunarAlbedo(vec2 point, vec2 lightAxis, float pixelWidth) {
        float fineDetail = 1.0 - smoothstep(0.025, 0.1, pixelWidth);
        vec2 warped = point + vec2(noise(point * 13.0), noise(point * 13.0 + 19.0)) * 0.035 * fineDetail;
        float maria = max(basin(warped, vec2(-0.43, 0.12), vec2(0.28, 0.48)), basin(warped, vec2(-0.2, 0.38), vec2(0.31, 0.25)));
        maria = max(maria, basin(warped, vec2(0.2, 0.29), vec2(0.21, 0.23)));
        maria = max(maria, basin(warped, vec2(0.35, 0.06), vec2(0.24, 0.22)));
        maria = max(maria, basin(warped, vec2(0.65, 0.29), vec2(0.13, 0.15)));
        maria = max(maria, basin(warped, vec2(0.52, -0.2), vec2(0.18, 0.23)));
        maria = max(maria, basin(warped, vec2(-0.17, -0.35), vec2(0.21, 0.2)));
        maria = max(maria, basin(warped, vec2(-0.48, -0.34), vec2(0.15, 0.17)));
        float albedo = mix(0.76, 0.42, maria);
        albedo += (noise(point * 26.0) - 0.5) * 0.09 * fineDetail;
        albedo += craterField(point, lightAxis, 7.0, pixelWidth) * 0.12 * (1.0 - smoothstep(0.06, 0.18, pixelWidth));
        albedo += craterField(point, lightAxis, 23.0, pixelWidth) * 0.07 * (1.0 - smoothstep(0.018, 0.05, pixelWidth));
        vec2 tycho = point - vec2(-0.08, -0.63);
        float rayAngle = atan(tycho.y, tycho.x);
        float rays = pow(max(0.0, sin(rayAngle * 19.0 + sin(rayAngle * 7.0))), 14.0);
        albedo += rays * 0.08 * exp(-length(tycho) * 3.8) * smoothstep(0.035, 0.09, length(tycho)) * fineDetail;
        albedo += (1.0 - smoothstep(0.025, 0.045 + pixelWidth, length(tycho))) * 0.16;
        return clamp(albedo, 0.24, 0.95);
      }
      void main() {
        vec3 direction = normalize(skyDirection);
        float horizonWidth = max(fwidth(direction.y), 0.00001);
        float aboveHorizon = smoothstep(-horizonWidth, horizonWidth, direction.y);
        vec3 moonUp = abs(moonDirection.y) > 0.98 ? vec3(0.0, 0.0, 1.0) : vec3(0.0, 1.0, 0.0);
        vec3 moonRight = normalize(cross(moonDirection, moonUp));
        moonUp = normalize(cross(moonRight, moonDirection));
        vec2 moonPoint = vec2(dot(direction, moonRight), dot(direction, moonUp)) / sin(moonAngularRadius);
        float moonDistance = length(moonPoint);
        float moonPixelWidth = max(length(fwidth(moonPoint)), 0.0001);
        float moonEdgeWidth = max(fwidth(moonDistance) * 0.5, 0.001);
        float moonDisc = (1.0 - smoothstep(1.0 - moonEdgeWidth, 1.0 + moonEdgeWidth, moonDistance)) * step(0.99, dot(direction, moonDirection));
        float phaseAngle = moonPhase * 6.28318530718;
        vec2 projectedSun = vec2(dot(moonLightDirection, moonRight), dot(moonLightDirection, moonUp));
        vec2 moonSurface = moonPoint / max(1.0, moonDistance / 0.9999);
        vec3 moonNormal = vec3(moonSurface, sqrt(max(0.0, 1.0 - dot(moonSurface, moonSurface))));
        vec3 moonLight = vec3(projectedSun, -dot(moonLightDirection, moonDirection));
        float incident = dot(moonNormal, moonLight);
        float terminatorWidth = max(fwidth(incident) * 0.5, 0.0001);
        float litSurface = smoothstep(-terminatorWidth, terminatorWidth, incident);
        float moonIllumination = (1.0 - cos(phaseAngle)) * 0.5;
        float moonPresence = smoothstep(0.00005, 0.002, moonIllumination) * clamp(moonIntensity, 0.0, 1.0);
        float moonOpacity = moonDisc * moonPresence * mix(0.13 * litSurface, 0.98, night);

        float sunAngle = atan(length(cross(direction, sunDirection)), dot(direction, sunDirection));
        float sunEdgeWidth = max(fwidth(sunAngle) * 0.5, 0.000001);
        float sunDisc = 1.0 - smoothstep(sunAngularRadius - sunEdgeWidth, sunAngularRadius + sunEdgeWidth, sunAngle);
        float sunPresence = smoothstep(-sunAngularRadius, sunAngularRadius, sunDirection.y);
        if (aboveHorizon == 0.0) discard;
        float star = 0.0;
        vec3 starColor = vec3(0.0);
        if (night > 0.0 && starIntensity > 0.0 && direction.y > 0.0) {
          vec3 north = vec3(sin(northOffset), 0.0, -cos(northOffset));
          vec3 pole = north * cos(latitude) + vec3(0.0, sin(latitude), 0.0);
          vec3 stellarDirection = rotateAxis(direction, pole, skyRotation);
          vec2 starPosition = vec2(atan(stellarDirection.z, stellarDirection.x) / 6.28318530718 + 0.5, asin(clamp(stellarDirection.y, -1.0, 1.0)) / 3.14159265359 + 0.5) * vec2(560.0, 280.0);
          vec2 starCell = floor(starPosition);
          float starSeed = hash(starCell);
          if (starSeed >= 0.965) {
            vec2 starOffset = vec2(hash(starCell + 0.31), hash(starCell + 8.7)) * 0.7 + 0.15;
            float starDistance = length(fract(starPosition) - starOffset);
            float moonAbove = smoothstep(-0.02, 0.12, moonDirection.y);
            float moonWash = clamp(moonIllumination * moonIntensity * moonAbove, 0.0, 1.0);
            star = 1.0 - smoothstep(0.025, 0.14, starDistance);
            star *= (0.45 + 0.55 * hash(starCell + 21.4)) * (0.83 + 0.17 * sin(celestialTime * 1.6 + starSeed * 900.0));
            star *= night * starIntensity * (1.0 - moonWash * 0.72) * (1.0 - moonDisc) * smoothstep(0.0, 0.12, direction.y);
            starColor = mix(vec3(0.65, 0.79, 1.0), vec3(1.0, 0.87, 0.7), hash(starCell + 2.3));
          }
        }
        float sunGlare = exp(-sunAngle / (sunAngularRadius * 2.5)) * 0.045 + exp(-sunAngle / 0.035) * 0.006;
        sunGlare *= sunPresence;
        float sunOpacity = max(sunDisc, sunGlare);
        float opacity = max(max(star, moonOpacity), sunOpacity);
        if (opacity * aboveHorizon < 0.0001) discard;
        float cloudMask = 0.0;
        if (direction.y > 0.015) {
          vec2 cloudPosition = direction.xz / max(direction.y + 0.18, 0.2) * 1.35 - windTravel * 0.0012;
          cloudMask = smoothstep(0.69 - coverage * 0.4, 0.87 - coverage * 0.35, cloudNoise(cloudPosition)) * smoothstep(0.015, 0.16, direction.y);
        }
        float transmission = (1.0 - cloudMask * 0.985) * exp(-extinction / max(direction.y + 0.12, 0.12)) * aboveHorizon;
        float alpha = clamp(opacity * transmission, 0.0, 1.0);
        if (alpha < 0.0001) discard;
        vec3 color = starColor * star;
        if (moonOpacity > 0.0) {
          vec2 lightAxis = length(projectedSun) > 0.0001 ? normalize(projectedSun) : vec2(1.0, 0.0);
          float lunarTexture = lunarAlbedo(moonPoint, lightAxis, moonPixelWidth);
          float scattering = max(0.0, incident) / max(0.015, max(0.0, incident) + moonNormal.z);
          float reflected = litSurface * (0.8 * scattering * 2.0 + 0.2 * max(0.0, incident));
          float earthshine = 0.0012 * pow(1.0 - moonIllumination, 2.0) * night;
          vec3 moonAtmosphere = exp(-vec3(0.008, 0.013, 0.024) * airMass(moonDirection.y));
          color += vec3(1.0, 0.965, 0.91) * lunarTexture * (reflected * 1.15 + earthshine) * moonIntensity * moonAtmosphere * moonOpacity;
        }
        float sunOpticalDepth = airMass(sunDirection.y);
        vec3 sunColor = vec3(1.0, 0.976, 0.92) * exp(-vec3(0.045, 0.1, 0.22) * sunOpticalDepth);
        float sunRadiance = 36.0 / max(0.9, sunDistance * sunDistance);
        float solarRadius = clamp(sunAngle / sunAngularRadius, 0.0, 1.0);
        float limbDarkening = 0.45 + 0.55 * sqrt(max(0.0, 1.0 - solarRadius * solarRadius));
        color += sunColor * (sunDisc * sunRadiance * limbDarkening + sunGlare * 1.8);
        gl_FragColor = vec4(color / max(opacity, 0.0001), alpha);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }
    `,
  });
  const sky = new Mesh(geometry, material);
  sky.name = "celestialSky";
  sky.frustumCulled = false;
  sky.renderOrder = -900;
  group.add(sky);
  let weather: SceneWeather | undefined;
  let effectiveWind = 0;
  let disposed = false;

  function update(time: SceneTime, currentWeather?: SceneWeather) {
    if (disposed) return;
    weather = currentWeather;
    const celestial: ReturnType<typeof getCelestialState> & { moonAngularRadius?: number; sunAngularRadius?: number; sunDistance?: number; moonLightDirection?: Vector3Value } = getCelestialState(time);
    uniforms.sunDirection.value.copy(celestial.sunDirection);
    uniforms.moonDirection.value.copy(celestial.moonDirection);
    uniforms.moonLightDirection.value.copy(celestial.moonLightDirection ?? celestial.sunDirection).normalize();
    uniforms.moonAngularRadius.value = celestial.moonAngularRadius ?? 0.00452;
    uniforms.sunAngularRadius.value = celestial.sunAngularRadius ?? 0.00465047;
    uniforms.sunDistance.value = celestial.sunDistance ?? 1;
    uniforms.moonPhase.value = celestial.moonPhase;
    uniforms.moonIntensity.value = time.moonIntensity;
    uniforms.starIntensity.value = time.starIntensity;
    uniforms.night.value = celestial.night;
    uniforms.latitude.value = time.latitude * Math.PI / 180;
    uniforms.northOffset.value = time.northOffset * Math.PI / 180;
    uniforms.skyRotation.value = (time.hour / 24 + celestial.dayOfYear / 365.2422) * Math.PI * 2;
    const strengths = getWeatherStrengths(weather);
    effectiveWind = Math.max(Math.max(0, Math.min(1, weather?.wind ?? 0)), strengths.sandstorm * 0.78, strengths.blizzard * 0.7);
    const overcast = Math.max(strengths.clouds, strengths.rain, strengths.snow, strengths.fog, strengths.hail, strengths.thunder, strengths.blizzard);
    uniforms.coverage.value = !weather?.layers && weather?.condition === "clear" ? 0.08 + weather.intensity * 0.18 : 0.08 + overcast * 0.92;
    uniforms.extinction.value = strengths.fog * 1.6 + strengths.haze * 0.45 + strengths.dust * 1.1 + strengths.sandstorm * 2.4 + strengths.blizzard * 0.7;
  }

  function animate(seconds: number, cameraPosition: Vector3Value) {
    if (disposed) return false;
    group.position.copy(cameraPosition);
    const time = Number.isFinite(seconds) ? seconds : 0;
    uniforms.celestialTime.value = time;
    const angle = (weather?.windDirection ?? 45) * Math.PI / 180;
    // 与天气云层共用解析风场位移，云遮挡不会与天空云层错位。
    const distance = 38 * effectiveWind ** 1.35 * (time + 0.24 * (1 - Math.cos(time * 0.67)) / 0.67
      + 0.14 * (Math.cos(1.1) - Math.cos(time * 1.73 + 1.1)) / 1.73
      + 0.08 * (Math.cos(0.7) - Math.cos(time * 0.23 + 0.7)) / 0.23);
    uniforms.windTravel.value.set(Math.cos(angle) * distance, Math.sin(angle) * distance);
    return (uniforms.night.value > 0 && uniforms.starIntensity.value > 0) || effectiveWind > 0;
  }

  function dispose() {
    if (disposed) return;
    disposed = true;
    geometry.dispose();
    material.dispose();
    group.clear();
  }

  return { group, update, animate, dispose };
}
