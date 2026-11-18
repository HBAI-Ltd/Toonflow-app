import { Color, DataTexture, FloatType, MeshStandardMaterial, NearestFilter, NoColorSpace, RGBAFormat, UnsignedByteType, Vector2, Vector3 } from "three";
import type { SceneTerrain } from "./sceneDocument";
import { terrainSurfaceOptions } from "./terrainSurfaces";
import { getTerrainPaint } from "./terrainPaint";

export function createTerrainMaterial(initial: SceneTerrain) {
  let width = initial.segments + 1;
  let surfaceValues = new Uint8Array(width * width * 4);
  function createSurfaceTexture() {
    const texture = new DataTexture(surfaceValues, width, width, RGBAFormat, UnsignedByteType);
    texture.minFilter = texture.magFilter = NearestFilter;
    texture.generateMipmaps = false;
    texture.flipY = false;
    texture.unpackAlignment = 1;
    texture.colorSpace = NoColorSpace;
    return texture;
  }
  let surfaceTexture = createSurfaceTexture();
  function createPaintTexture(data: Uint8Array = new Uint8Array(4), segments = 0) {
    const texture = new DataTexture(data, segments + 1, segments + 1, RGBAFormat, UnsignedByteType);
    texture.minFilter = texture.magFilter = NearestFilter;
    texture.generateMipmaps = false;
    texture.flipY = false;
    texture.unpackAlignment = 1;
    texture.colorSpace = NoColorSpace;
    texture.needsUpdate = true;
    return texture;
  }
  let paintTexture = createPaintTexture();
  let paintData: Uint8Array | undefined;
  let paintSegments = 0;
  let paintVersion = -1;
  const styleValues = new Float32Array(256 * 4);
  const styleTexture = new DataTexture(styleValues, 256, 1, RGBAFormat, FloatType);
  styleTexture.minFilter = styleTexture.magFilter = NearestFilter;
  styleTexture.generateMipmaps = false;
  styleTexture.flipY = false;
  styleTexture.colorSpace = NoColorSpace;
  styleTexture.needsUpdate = true;
  const styleKeys: string[] = [];
  const styleColor = new Color();
  const count = terrainSurfaceOptions.length;
  const paletteValues = new Float32Array(count * 8);
  const reliefScales = [0, 0, 0, 0, 0, 0, 0, 0.007, 0.04, 0.028, 0.032, 0.018, 0.045, 0.07, 0.004, 0.018, 0.022, 0.018, 0.035, 0.015, 0.036, 0.012, 0.014, 0.027, 0.012, 0.035, 0.016, 0.014, 0.004, 0.002, 0.01, 0.025, 0.012, 0.035, 0.027, 0.014, 0.03, 0.023];
  for (const surface of terrainSurfaceOptions) {
    const color = surface.id === 38 ? new Color("#f5f7fa").lerp(new Color("#dcdfe6"), 0.12) : new Color(surface.color);
    paletteValues.set([color.r, color.g, color.b, surface.id < 7 ? 0.98 : surface.roughness], surface.id * 4);
    paletteValues.set([surface.wetness, reliefScales[surface.id] ?? 0.015, surface.metalness ?? 0, surface.emission ?? 0], (count + surface.id) * 4);
  }
  const paletteTexture = new DataTexture(paletteValues, count, 2, RGBAFormat, FloatType);
  paletteTexture.minFilter = paletteTexture.magFilter = NearestFilter;
  paletteTexture.generateMipmaps = false;
  paletteTexture.flipY = false;
  paletteTexture.colorSpace = NoColorSpace;
  paletteTexture.needsUpdate = true;
  const uniforms = {
    terrainSurfaces: { value: surfaceTexture }, terrainPalette: { value: paletteTexture },
    terrainPaintMap: { value: paintTexture }, terrainPaintSegments: { value: 0 },
    terrainStyles: { value: styleTexture }, terrainPaintStyled: { value: 0 }, terrainLayerLimit: { value: 16 },
    terrainEnvSky: { value: new Color(0) }, terrainEnvGround: { value: new Color(0) },
    terrainEnvSun: { value: new Color(0) }, terrainEnvSunDirection: { value: new Vector3(0, 1, 0) },
    terrainGrid: { value: new Vector2(initial.size, initial.segments) }, terrainRain: { value: 0 }, terrainSeed: { value: initial.seed % 65536 },
  };
  const material = new MeshStandardMaterial({ roughness: 0.98, metalness: 0 });
  const previewMaterial = new MeshStandardMaterial({ roughness: 0.98, metalness: 0 });
  const sharedTerrainShader = /* glsl */ `
      uniform sampler2D terrainSurfaces;
      uniform sampler2D terrainPaintMap;
      uniform float terrainPaintSegments;
      uniform sampler2D terrainPalette;
      uniform vec2 terrainGrid;
      uniform float terrainRain;
      uniform float terrainSeed;
      uniform sampler2D terrainStyles;
      uniform int terrainPaintStyled;
      uniform int terrainLayerLimit;
      uniform vec3 terrainEnvSky, terrainEnvGround, terrainEnvSun, terrainEnvSunDirection;
      varying vec3 terrainPosition;
      varying vec2 terrainLocalPosition;
      struct TerrainSample { vec3 color; float roughness; float height; float saltHeight; float metalness; vec3 emission; };
      float terrainHash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7)) + terrainSeed * 0.017) * 43758.5453); }
      float terrainNoise(vec2 p) {
        vec2 c = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f);
        return mix(mix(terrainHash(c), terrainHash(c + vec2(1, 0)), f.x), mix(terrainHash(c + vec2(0, 1)), terrainHash(c + 1.0), f.x), f.y);
      }
      float terrainJoint(vec2 p, vec2 aa, float width) {
        vec2 edge = min(fract(p), 1.0 - fract(p));
        vec2 mask = smoothstep(vec2(width) - aa, vec2(width) + aa, edge);
        return 1.0 - min(mask.x, mask.y);
      }

      vec4 terrainResolve(float sourceId) {
        if (sourceId >= 256.0) return texelFetch(terrainStyles, ivec2(int(sourceId) - 256, 0), 0);
        return vec4(texelFetch(terrainPalette, ivec2(int(sourceId), 0), 0).rgb, sourceId);
      }
      vec3 terrainEnvironment(vec3 viewDirection, vec3 normal, float roughness) {
        vec3 reflected = normalize(mix(reflect(-viewDirection, normal), normal, pow(roughness, 4.0)));
        vec3 direction = normalize(transpose(mat3(viewMatrix)) * reflected);
        float blur = 0.08 + roughness * 0.8;
        vec3 radiance = mix(terrainEnvGround, terrainEnvSky, smoothstep(-0.3, 0.5, direction.y)) * 0.25;
        float cloud = exp(-pow((direction.x + direction.y * 0.2 - 0.28) / blur, 2.0)) * smoothstep(0.1, 0.6, direction.y);
        radiance += terrainEnvSky * cloud * 0.35;
        float sun = pow(max(0.0, dot(direction, terrainEnvSunDirection)), mix(1024.0, 4.0, roughness));
        return radiance + terrainEnvSun * sun;
      }
      float terrainHexEdge(vec2 p) {
        vec2 span = vec2(1.0, 1.7320508);
        vec2 a = mod(p, span) - span * 0.5, b = mod(p - span * 0.5, span) - span * 0.5;
        vec2 local = abs(dot(a, a) < dot(b, b) ? a : b);
        return max(0.0, 0.5 - max(local.x, dot(local, vec2(0.5, 0.8660254))));
      }
      TerrainSample terrainScifi(float surfaceId, TerrainSample result, vec3 worldPosition, vec2 pixel, vec2 noiseValue) {
        vec2 p = worldPosition.xz;
        float footprint = max(pixel.x, pixel.y);
        float detail = 1.0 - smoothstep(0.008, 0.08, footprint);
        float broad = noiseValue.x, fine = noiseValue.y;
        if (surfaceId < 39.5) {
          result.color *= 0.97 + sin(p.x * 140.0 + broad * 3.0) * 0.02 * detail;
          result.height = (broad - 0.5) * 0.0003;
        } else if (surfaceId < 40.5) {
          float wave = sin(p.x * 1.6 + broad * 2.0) + cos(p.y * 1.3 + broad * 2.5);
          result.color *= 0.96 + broad * 0.08;
          result.height = wave * 0.012 + (fine - 0.5) * 0.0005;
        } else if (surfaceId < 41.5) {
          vec2 grid = p * 1.4;
          float line = terrainJoint(grid, pixel * 1.4, 0.035);
          float node = 1.0 - smoothstep(0.06, 0.06 + max(0.015, footprint * 1.4), length(fract(grid) - 0.5));
          result.color *= 0.22 + line * 0.7 + node * 0.35;
          result.emission *= line * 1.4 + node * 2.0;
          result.height = terrainJoint(grid, vec2(0.004), 0.035) * 0.002;
        } else if (surfaceId < 42.5) {
          float line = terrainJoint(p * 3.2, pixel * 3.2, 0.025);
          float scan = sin(p.y * 60.0) * 0.04 * detail;
          result.color *= 0.3 + line * 0.55 + scan;
          result.emission *= 0.18 + line * 1.7;
        } else if (surfaceId < 43.5) {
          float bar = terrainJoint(p * 2.5, pixel * 2.5, 0.1);
          result.color *= 0.12 + bar * 0.88;
          result.height = terrainJoint(p * 2.5, vec2(0.004), 0.1) * 0.008;
        } else if (surfaceId < 44.5) {
          float weave = mod(floor(p.x * 8.0) + floor(p.y * 8.0), 2.0);
          float fiber = sin(mix(p.x, p.y, weave) * 180.0);
          result.color *= 0.62 + weave * 0.13 + fiber * 0.1 * detail;
          result.height = fiber * 0.0007;
        } else if (surfaceId < 45.5) {
          vec2 grid = vec2(p.x * 1.4, (p.x * 0.5 + p.y * 0.8660254) * 1.4);
          float line = terrainJoint(grid, pixel * 2.0, 0.035);
          result.color *= 0.28 + line * 0.7;
          result.emission *= 0.12 + line * 2.0;
          result.height = terrainJoint(grid, vec2(0.004), 0.035) * 0.003;
        } else if (surfaceId < 46.5) {
          float surfacePatch = terrainNoise(p * 2.5);
          float vein = pow(1.0 - abs(surfacePatch * 2.0 - 1.0), 12.0);
          result.color *= 0.56 + surfacePatch * 0.6;
          result.emission *= vein * 2.0;
          result.height = (surfacePatch - 0.5) * 0.018;
        } else if (surfaceId < 47.5) {
          vec2 grid = p * vec2(0.7, 0.95);
          grid.x += mod(floor(grid.y), 2.0) * 0.5;
          float seam = terrainJoint(grid, max(pixel, vec2(0.001)), 0.022);
          float corner = length(abs(fract(grid) - 0.5) - 0.39);
          float rivet = 1.0 - smoothstep(0.022 - footprint, 0.022 + max(0.001, footprint), corner);
          rivet *= detail;
          result.color *= 0.88 - seam * 0.56 + rivet * 0.32 + broad * 0.12;
          result.roughness = clamp(result.roughness - rivet * 0.12, 0.1, 1.0);
          result.height = (1.0 - terrainJoint(grid, vec2(0.003), 0.022)) * 0.012
            + (1.0 - smoothstep(0.018, 0.026, corner)) * 0.002;
        } else if (surfaceId < 48.5) {
          vec2 panel = p * vec2(0.65, 1.1);
          float frame = terrainJoint(panel, pixel * 1.1, 0.025);
          float cells = terrainJoint(p * vec2(6.5, 8.8), pixel * 8.8, 0.018);
          result.color *= mix(vec3(0.58, 0.7, 1.0) * (0.65 + cells * 0.3), vec3(1.7), frame);
          result.roughness = mix(result.roughness, 0.48, frame);
          result.height = terrainJoint(panel, vec2(0.003), 0.025) * 0.007;
        } else if (surfaceId < 49.5) {
          float edge = terrainHexEdge(p * 1.8);
          float seam = 1.0 - smoothstep(0.025 - footprint * 1.8, 0.025 + max(0.002, footprint * 1.8), edge);
          result.color *= 0.96 - seam * 0.55 + broad * 0.05;
          result.height = smoothstep(0.015, 0.07, edge) * 0.012;
        } else if (surfaceId < 50.5) {
          float corrosion = terrainNoise(p * 3.0);
          float rust = smoothstep(0.32, 0.7, corrosion + broad * 0.18);
          result.color *= mix(vec3(0.52, 0.62, 0.72), vec3(1.45, 0.68, 0.3), rust) * (0.8 + fine * 0.3);
          result.metalness = mix(0.85, 0.06, rust);
          result.roughness = mix(0.48, 0.98, rust);
          result.height = (corrosion - 0.5) * 0.009;
        } else if (surfaceId < 51.5) {
          float gap = abs(terrainNoise(p * 1.8 + broad * 0.8) - 0.5);
          float aa = max(0.002, footprint * 1.3);
          float lava = 1.0 - smoothstep(0.055 - aa, 0.055 + aa, gap);
          result.color *= 0.1 + lava * 0.75;
          result.emission *= lava * 2.0;
          result.height = -(1.0 - smoothstep(0.035, 0.12, gap)) * 0.025;
        } else if (surfaceId < 52.5) {
          vec2 crystal = fract(vec2(p.x * 0.8660254 - p.y * 0.5, p.x * 0.5 + p.y * 0.8660254) * 1.1) - 0.5;
          float facet = 0.5 - max(abs(crystal.x), abs(crystal.y));
          float facing = smoothstep(-max(0.001, footprint * 1.6), max(0.001, footprint * 1.6), crystal.y - crystal.x);
          result.color *= 0.58 + facet * 0.8 + facing * 0.16;
          result.roughness += broad * 0.08;
          result.height = facet * 0.09;
        } else if (surfaceId < 53.5) {
          float gap = abs(sin(p.x * 2.4 + broad * 6.0) + sin(p.y * 1.6 - broad * 4.0));
          float aa = max(0.004, footprint * 3.5);
          float plasma = 1.0 - smoothstep(0.1 - aa, 0.1 + aa, gap);
          result.color *= 0.16 + plasma * 0.7;
          result.emission *= plasma * 2.3;
          result.height = -(1.0 - smoothstep(0.06, 0.22, gap)) * 0.035;
        } else if (surfaceId < 54.5) {
          float growth = terrainNoise(p * 2.7);
          float gap = abs(growth - 0.5), aa = max(0.002, footprint * 1.8);
          float roots = 1.0 - smoothstep(0.04 - aa, 0.04 + aa, gap);
          result.color *= 0.5 + growth * 0.55 + roots * 0.32;
          result.emission *= roots * 1.5;
          result.height = (growth - 0.5) * 0.03 + (1.0 - smoothstep(0.025, 0.065, gap)) * 0.004;
        } else if (surfaceId < 55.5) {
          float edge = terrainHexEdge(p * 5.0), aa = max(0.003, footprint * 5.0);
          float wall = 1.0 - smoothstep(0.055 - aa, 0.055 + aa, edge);
          result.color *= 0.2 + wall * 0.8;
          result.emission *= wall * 1.6;
          result.height = (1.0 - smoothstep(0.035, 0.075, edge)) * 0.006;
        } else if (surfaceId < 56.5) {
          vec2 grid = p * 1.8, local = fract(grid);
          float lane = mix(0.25, 0.75, mod(floor(grid.y), 2.0));
          float path = min(abs(local.y - lane), max(abs(local.x - 0.5), abs(local.y - 0.5) - 0.25));
          float aa = max(0.002, footprint * 1.8);
          float trace = 1.0 - smoothstep(0.018 - aa, 0.018 + aa, path);
          float padDistance = length(local - vec2(0.5, lane));
          float pad = 1.0 - smoothstep(0.065 - aa, 0.065 + aa, padDistance);
          result.color *= 0.14 + trace * 0.65 + pad * 0.25;
          result.emission *= trace * 1.4 + pad * 0.8;
          result.height = (1.0 - smoothstep(0.014, 0.024, path)) * 0.0015
            + (1.0 - smoothstep(0.06, 0.07, padDistance)) * 0.001;
        } else if (surfaceId < 57.5) {
          vec2 grid = p * 1.1, cell = floor(grid);
          vec2 center = 0.3 + 0.4 * vec2(terrainHash(cell), terrainHash(cell + 31.7));
          float radius = length(fract(grid) - center);
          float fleck = smoothstep(0.64, 0.82 + footprint * 12.0, fine);
          float rim = exp(-pow((radius - 0.15) / 0.025, 2.0));
          result.color *= 0.58 + broad * 0.5 + fleck * 0.65 - (1.0 - smoothstep(0.08, 0.15, radius)) * 0.22;
          result.metalness = 0.35 + fleck * 0.6;
          result.roughness = 0.84 - fleck * 0.5;
          result.height = (broad - 0.5) * 0.04 + rim * 0.008 - (1.0 - smoothstep(0.09, 0.14, radius)) * 0.018;
        } else {
          vec2 grid = p * 7.0;
          float aa = max(0.003, footprint * 7.0);
          float star = step(0.94, terrainHash(floor(grid)))
            * (1.0 - smoothstep(0.04 - aa, 0.04 + aa, length(fract(grid) - 0.5))) * detail;
          float dune = sin(p.x * 2.2 + sin(p.y * 1.1) * 1.4);
          result.color *= 0.78 + broad * 0.22 + fine * 0.08 * detail + star * 1.5;
          result.emission *= star * 3.0;
          result.metalness += star * 0.5;
          result.height = dune * 0.012 + (broad - 0.5) * 0.015;
        }
        result.color *= 1.0 - terrainRain * 0.12;
        result.roughness = clamp(result.roughness - terrainRain * 0.03, 0.025, 1.0);
        return result;
      }

  `;
  const detailedTerrainShader = /* glsl */ `      vec3 terrainCell(vec2 p, out vec2 nearest) {
        vec2 cell = floor(p), local = fract(p);
        float first = 100.0, second = 100.0, seed = 0.0;
        nearest = vec2(0.0);
        for (int y = -1; y <= 1; y++) for (int x = -1; x <= 1; x++) {
          vec2 offset = vec2(x, y), id = cell + offset;
          vec2 jitter = vec2(terrainHash(id), terrainHash(id + 19.37));
          vec2 q = local - offset - (0.12 + jitter * 0.76);
          float variation = fract(jitter.x * 17.17 + jitter.y * 23.23);
          vec2 shape = vec2(q.x + q.y * (variation - 0.5) * 0.9, q.y) * vec2(0.82 + variation * 0.36, 1.18 - variation * 0.36);
          float metric = dot(shape, shape);
          if (metric < first) { second = first; first = metric; seed = variation; nearest = q; }
          else second = min(second, metric);
        }
        return vec3(sqrt(first), (sqrt(second) - sqrt(first)) * 0.5, seed);
      }
      vec3 terrainCell(vec2 p) {
        vec2 nearest;
        return terrainCell(p, nearest);
      }
      vec2 terrainSaltSite(ivec2 cell) {
        uint state = uint(cell.x) * 0x8da6b343u ^ uint(cell.y) * 0xd8163841u ^ uint(terrainSeed + 1.0) * 0xcb1ab31fu;
        state ^= state >> 16; state *= 0x7feb352du; state ^= state >> 15;
        uint other = state * 0x846ca68bu; other ^= other >> 16;
        return vec2(float(state >> 8), float(other >> 8)) / 16777216.0;
      }
      float terrainSaltGap(vec2 p) {
        ivec2 cell = ivec2(floor(p));
        vec2 local = fract(p);
        float first = 100.0, second = 100.0;
        // ACT: 欧氏站点限制在格内0.3–0.7，最近两点始终在3×3邻域，换格不会截断F2。
        for (int y = -1; y <= 1; y++) for (int x = -1; x <= 1; x++) {
          ivec2 offset = ivec2(x, y);
          vec2 q = local - vec2(offset) - (0.3 + terrainSaltSite(cell + offset) * 0.4);
          float metric = dot(q, q);
          if (metric < first) { second = first; first = metric; }
          else second = min(second, metric);
        }
        return (sqrt(second) - sqrt(first)) * 0.5;
      }

      TerrainSample terrainSample(float sourceId, vec3 worldPosition, vec2 terrainPixel, vec2 noiseValue) {
        vec4 style = terrainResolve(sourceId);
        float surfaceId = style.a;
        vec4 base = texelFetch(terrainPalette, ivec2(int(surfaceId), 0), 0);
        vec4 parameters = texelFetch(terrainPalette, ivec2(int(surfaceId), 1), 0);
        vec2 terrainMaterial = vec2(base.a, parameters.x);
        TerrainSample result;
        result.color = style.rgb;
        result.metalness = parameters.z;
        result.emission = style.rgb * parameters.w;
        result.roughness = base.a;
        result.height = 0.0;
        result.saltHeight = 0.0;
        if (surfaceId == 38.0) {
          result.color = base.rgb * (1.0 - terrainRain * 0.15);
          result.roughness = 0.95 - terrainRain * 0.6;
          return result;
        }
        if (surfaceId > 38.5) return terrainScifi(surfaceId, result, worldPosition, terrainPixel, noiseValue);
        if (surfaceId > 19.5 && max(terrainPixel.x, terrainPixel.y) >= 0.4) {
          float wet = terrainRain * terrainMaterial.y * (0.65 + noiseValue.x * 0.35);
          result.color *= 1.0 - wet * 0.32;
          result.roughness = clamp(terrainMaterial.x - wet * (terrainMaterial.x - 0.16), 0.12, 1.0);
          return result;
        }
        float terrainWet = terrainRain;
        float terrainDetail = 0.0;
        if (surfaceId > 6.5) {
          vec2 p = worldPosition.xz;
          float broad = noiseValue.x, fine = noiseValue.y;
          float grainFade = 1.0 - smoothstep(0.025, 0.18, max(terrainPixel.x, terrainPixel.y));
          float pattern = 0.94 + broad * 0.12 + (fine - 0.5) * 0.12 * grainFade;
          vec3 terrainTint = vec3(1.0);
          float joint = 0.0;
          float relief = (fine - 0.5) * 0.004 + (broad - 0.5) * parameters.y * 0.2;
          float heightJoint = 0.0;
          if (surfaceId < 7.5) {
            joint = terrainJoint(p / 3.0, terrainPixel / 3.0, 0.003);
            heightJoint = terrainJoint(p / 3.0, vec2(0.0005), 0.003);
            pattern = mix(pattern, 0.75, joint);
          } else if (surfaceId < 10.5) {
            pattern = 0.78 + broad * 0.36 + (fine - 0.5) * 0.1 * grainFade;
            if (surfaceId > 8.5) pattern *= 0.96 + sin(p.x * 5.0 + broad * 2.0) * 0.04 * grainFade;
          } else if (surfaceId < 11.5) {
            float wave = sin(p.x * 10.0 + p.y * 3.0 + broad * 5.0 + terrainNoise(p * 0.13) * 18.0);
            pattern += wave * 0.045 * grainFade;
            relief += wave * 0.002;
          } else if (surfaceId < 13.5) {
            if (surfaceId < 12.5) {
              pattern = 1.0;
              if (grainFade > 0.001) {
                vec3 cell = terrainCell(p * 6.0 + broad * 0.4);
                joint = (1.0 - smoothstep(0.035, 0.035 + max(terrainPixel.x, terrainPixel.y) * 6.0, cell.y)) * grainFade;
                pattern = mix(1.0, mix(0.7 + cell.z * 0.55, 0.62, joint), grainFade);
                relief += max(0.0, 0.5 - cell.x) * 0.035;
                heightJoint = 1.0 - smoothstep(0.03, 0.04, cell.y);
              }
            } else {
              float wave = sin(p.x * 2.2 + p.y * 0.9 + broad * 6.0 + terrainNoise(p * 0.12 + 3.0) * 12.0);
              pattern = 0.84 + terrainNoise(p * 2.2) * 0.25 + wave * 0.06;
              relief += wave * 0.004;
            }
          } else if (surfaceId < 14.5) {
            pattern = 0.91 + (fine - 0.5) * 0.3 * grainFade;
          } else if (surfaceId < 16.5) {
            vec2 grid = p * (surfaceId < 15.5 ? vec2(1.4) : vec2(3.2, 6.4));
            grid.x += mod(floor(grid.y), 2.0) * 0.5;
            joint = terrainJoint(grid, terrainPixel * (surfaceId < 15.5 ? vec2(1.4) : vec2(3.2, 6.4)), 0.035);
            heightJoint = terrainJoint(grid, vec2(0.002), 0.035);
            pattern = mix(0.9 + terrainHash(floor(grid)) * 0.2, 0.45, joint);
          } else if (surfaceId < 17.5) {
            pattern = 0.97 + broad * 0.05 + (fine - 0.5) * 0.025 * grainFade;
          } else if (surfaceId < 18.5) {
            pattern = 0.74 + terrainNoise(p * 3.0) * 0.4 + (fine - 0.5) * 0.07 * grainFade;
          } else if (surfaceId < 19.5) {
            pattern += sin(p.x * 33.0 + p.y * 17.0 + broad * 6.0) * 0.07 * grainFade;
          } else {
            float footprint = max(terrainPixel.x, terrainPixel.y);
            float coarseFade = 1.0 - smoothstep(0.08, 0.4, footprint);
            if (surfaceId < 20.5) {
              pattern = 0.7 + terrainNoise(p * 5.0) * 0.48 + (fine - 0.5) * 0.2 * grainFade;
              pattern -= pow(max(0.0, sin(p.x * 38.0 + broad * 10.0)), 16.0) * 0.12 * grainFade;
            } else if (surfaceId < 21.5) {
              vec2 nearest;
              vec3 cell = terrainCell(p * 6.5 + broad * 0.4, nearest);
              float seed = cell.z, angle = seed * 6.2831853;
              vec2 q = mat2(cos(angle), -sin(angle), sin(angle), cos(angle)) * nearest * (0.75 + seed * 0.65);
              float aa = max(0.01, footprint * 16.0);
              float leaf = 1.0 - smoothstep(0.75 - aa, 0.75 + aa, length(q * vec2(3.5, 2.1)));
              float vein = 1.0 - smoothstep(0.015, 0.015 + aa, abs(q.x));
              float leafHeight = 1.0 - smoothstep(0.73, 0.77, length(q * vec2(3.5, 2.1)));
              relief += leafHeight * 0.004;
              pattern = mix(0.75 + broad * 0.2, 0.9 + seed * 0.4 - vein * 0.13, leaf * grainFade);
              terrainTint = mix(vec3(1.0), vec3(1.22, 0.96, 0.67), leaf * seed * grainFade);
            } else if (surfaceId < 22.5) {
              vec3 cell = terrainCell(p * 5.5 + broad * 0.4);
              float aa = max(0.003, footprint * 5.5);
              joint = smoothstep(0.43 + cell.z * 0.06 - aa, 0.43 + cell.z * 0.06 + aa, cell.x) * grainFade;
              pattern = mix(1.0, mix(0.85 + cell.z * 0.4 - cell.x * 0.2, 0.5, joint), grainFade);
              relief += max(0.0, 0.5 - cell.x) * 0.09;
              heightJoint = smoothstep(0.425 + cell.z * 0.06, 0.435 + cell.z * 0.06, cell.x);
              terrainTint = mix(vec3(1.0), mix(vec3(0.9, 0.96, 1.03), vec3(1.08, 1.0, 0.91), cell.z), grainFade);
            } else if (surfaceId < 23.5) {
              float surfacePatch = smoothstep(0.35, 0.7, terrainNoise(p * 2.5));
              pattern = 0.72 + broad * 0.35 + (fine - 0.5) * 0.12 * grainFade;
              terrainTint = mix(vec3(1.0), vec3(0.83, 1.12, 0.7), surfacePatch * 0.65);
            } else if (surfaceId < 24.5) {
              pattern = 0.94 + broad * 0.1 - smoothstep(0.65, 0.85, fine) * 0.11 * grainFade;
            } else if (surfaceId < 25.5) {
              float wave = sin(p.y * 5.0 + p.x * 1.1 + broad * 3.0 + terrainNoise(p * 0.18) * 12.0);
              pattern = 0.91 + broad * 0.15 + wave * 0.11;
              relief += wave * 0.004;
            } else if (surfaceId < 26.5) {
              vec3 cell = terrainCell(p * 2.2 + broad * 0.28);
              float aa = max(0.002, footprint * 2.2);
              joint = 1.0 - smoothstep(0.035 - aa, 0.035 + aa, cell.y);
              pattern = mix(0.84 + cell.z * 0.34 - cell.x * 0.12, 0.43, joint);
              relief += max(0.0, 0.55 - cell.x) * 0.12;
              heightJoint = 1.0 - smoothstep(0.03, 0.04, cell.y);
            } else if (surfaceId < 27.5) {
              vec2 grid = p * vec2(0.45, 4.0);
              grid.x += mod(floor(grid.y), 2.0) * 0.5;
              joint = terrainJoint(grid, terrainPixel * vec2(0.45, 4.0), 0.025);
              heightJoint = terrainJoint(grid, vec2(0.002), 0.025);
              relief += sin(p.y * 140.0 + sin(p.x * 0.8) * 8.0 + broad * 4.0) * 0.0005;
              pattern = mix(0.82 + terrainHash(floor(grid)) * 0.3 + sin(p.y * 140.0 + sin(p.x * 0.8) * 8.0 + broad * 4.0) * 0.08 * grainFade, 0.4, joint);
            } else if (surfaceId < 28.5) {
              vec2 grid = p * 2.0;
              joint = terrainJoint(grid, terrainPixel * 2.0, 0.012);
              heightJoint = terrainJoint(grid, vec2(0.001), 0.012);
              pattern = mix(0.95 + terrainHash(floor(grid)) * 0.07 + (fine - 0.5) * 0.02 * grainFade, 0.62, joint);
            } else if (surfaceId < 29.5) {
              vec3 cell = terrainCell(p * 22.0);
              float chip = (1.0 - smoothstep(0.22, 0.36 + footprint * 22.0, cell.x)) * grainFade;
              relief += (1.0 - smoothstep(0.22, 0.36, cell.x)) * 0.0006;
              pattern = mix(0.98, 0.6 + cell.z * 0.85, chip);
              terrainTint = mix(vec3(1.0), vec3(1.08, 0.92, 0.83), chip * cell.z);
            } else if (surfaceId < 30.5) {
              pattern = 0.95 + (fine - 0.5) * 0.22 * grainFade;
              pattern -= terrainJoint(p * 18.0, terrainPixel * 18.0, 0.15) * 0.05 * grainFade;
              heightJoint = terrainJoint(p * 18.0, vec2(0.01), 0.15) * 0.2;
            } else if (surfaceId < 31.5) {
              float wave = sin(p.y * 18.0 + broad * 0.6);
              pattern = 0.92 + broad * 0.12 + wave * 0.09 * grainFade;
              relief += wave * 0.0015;
            } else if (surfaceId < 34.5) {
              if (surfaceId < 32.5) {
                float gap = terrainSaltGap(p * 1.4 + vec2(broad, terrainNoise(p * 0.6 + 9.0)) * 0.65);
                float aa = max(0.002, footprint * 1.4);
                joint = 1.0 - smoothstep(0.025 - aa, 0.025 + aa, gap);
                pattern = 0.95 + broad * 0.08 + joint * 0.13;
                // 盐壳起伏固定为米制轮廓；颜色AA不能改变凹凸宽度，亚像素凸缘提前淡出。
                float rim = 1.0 - smoothstep(0.0, 0.065, gap / 1.4);
                result.saltHeight = rim * 0.004;
                relief = (broad - 0.5) * 0.003 + result.saltHeight;
              } else {
                float scale = surfaceId < 33.5 ? 2.0 : 9.0;
                vec3 cell = terrainCell(p * scale + vec2(broad, terrainNoise(p * 0.6 + 9.0)) * 0.65);
                float aa = max(0.002, footprint * scale);
                joint = 1.0 - smoothstep(0.025 - aa, 0.025 + aa, cell.y);
                heightJoint = 1.0 - smoothstep(0.02, 0.03, cell.y);
                if (surfaceId < 33.5) pattern = mix(0.84 + cell.z * 0.3, 0.43, joint);
                else {
                  joint = (1.0 - smoothstep(0.09 - aa, 0.09 + aa, cell.x)) * grainFade;
                  heightJoint = 1.0 - smoothstep(0.08, 0.1, cell.x);
                  pattern = mix(0.8 + broad * 0.27 + cell.z * 0.14 * grainFade, 0.38, joint);
                }
              }
            } else if (surfaceId < 35.5) {
              pattern = 0.94 + terrainNoise(p * 1.8 + broad) * 0.09 + (fine - 0.5) * 0.06 * grainFade;
            } else if (surfaceId < 36.5) {
              float surfacePatch = terrainNoise(p * 3.0);
              pattern = 0.82 + surfacePatch * 0.34 + (fine - 0.5) * 0.08 * grainFade;
              terrainTint = mix(vec3(1.06, 0.96, 0.83), vec3(0.87, 1.07, 0.88), smoothstep(0.35, 0.65, surfacePatch));
            } else {
              vec3 cell = terrainCell(p * 0.85 + broad * 0.45);
              float aa = max(0.002, footprint * 0.85);
              joint = 1.0 - smoothstep(0.022 - aa, 0.022 + aa, cell.y);
              heightJoint = 1.0 - smoothstep(0.017, 0.027, cell.y);
              pattern = mix(0.93 + cell.z * 0.13 + (fine - 0.5) * 0.04 * grainFade, 0.62, joint);
            }
            pattern = mix(1.0, pattern, coarseFade);
            joint *= coarseFade;
            terrainTint = mix(vec3(1.0), terrainTint, coarseFade);
          }
          float reliefScale = parameters.y;
          // 凹凸只读取固定世界尺度轮廓；颜色AA与LOD不能改变height的缝宽。
          if (surfaceId != 32.0) relief -= heightJoint * reliefScale;
          result.height = relief;
          terrainWet *= terrainMaterial.y * (0.65 + broad * 0.35);
          terrainDetail = (fine - 0.5) * 0.08 * grainFade + joint * 0.12;
          if (surfaceId == 32.0) terrainDetail = (broad - 0.5) * 0.025;
          result.color *= terrainTint * pattern * (1.0 - terrainWet * 0.32);
        } else {
          float broad = noiseValue.x, fine = noiseValue.y;
          float grainFade = 1.0 - smoothstep(0.025, 0.18, max(terrainPixel.x, terrainPixel.y));
          result.color *= (0.9 + broad * 0.16) * (vec3(1.0) - terrainRain * vec3(0.2, 0.18, 0.15));
          result.height = (fine - 0.5) * 0.006;
          if (surfaceId < 0.5 || abs(surfaceId - 3.0) < 0.5) {
            result.color *= 0.88 + terrainNoise(worldPosition.xz * 2.8) * 0.24;
            result.height += (broad - 0.5) * 0.018;
          } else if (surfaceId < 1.5 || abs(surfaceId - 5.0) < 0.5) {
            result.color *= 0.86 + terrainNoise(worldPosition.xz * 3.0) * 0.28;
            result.height += (broad - 0.5) * 0.035;
            if (surfaceId < 1.5 && worldPosition.y > 13.0) result.color = mix(result.color, texelFetch(terrainPalette, ivec2(6, 0), 0).rgb, min(0.8, (worldPosition.y - 13.0) / 8.0));
          } else if (abs(surfaceId - 4.0) < 0.5) {
            float ripple = sin(worldPosition.x * 10.0 + worldPosition.z * 3.0 + broad * 5.0 + terrainNoise(worldPosition.xz * 0.13) * 18.0);
            result.color *= 1.0 + ripple * 0.045 * grainFade;
            result.height += ripple * 0.006;
          } else if (surfaceId > 5.5) result.height *= 0.2;
        }
        result.roughness = clamp(terrainMaterial.x - terrainWet * (surfaceId > 6.5 ? terrainMaterial.x - 0.16 : 0.5) + terrainDetail, 0.12, 1.0);
        result.height *= 1.0 - terrainRain * 0.25;
        result.saltHeight *= 1.0 - terrainRain * 0.25;
        return result;

      }

  `;
  const previewTerrainShader = /* glsl */ `
      TerrainSample terrainSample(float sourceId, vec3 worldPosition, vec2 pixel, vec2 noiseValue) {
        vec4 style = terrainResolve(sourceId);
        float surfaceId = style.a;
        vec4 base = texelFetch(terrainPalette, ivec2(int(surfaceId), 0), 0);
        vec4 parameters = texelFetch(terrainPalette, ivec2(int(surfaceId), 1), 0);
        TerrainSample result;
        result.color = style.rgb;
        result.roughness = base.a;
        result.metalness = parameters.z;
        result.emission = style.rgb * parameters.w;
        result.height = 0.0; result.saltHeight = 0.0;
        if (surfaceId == 38.0) {
          result.color = base.rgb * (1.0 - terrainRain * 0.15);
          result.roughness = 0.95 - terrainRain * 0.6;
          return result;
        }
        if (surfaceId > 38.5) return terrainScifi(surfaceId, result, worldPosition, pixel, noiseValue);
        vec2 p = worldPosition.xz;
        float detail = 1.0 - smoothstep(0.025, 0.18, max(pixel.x, pixel.y));
        float joint = 0.0;
        float shade = 0.94 + noiseValue.x * 0.12 + (noiseValue.y - 0.5) * 0.08 * detail;
        if (surfaceId == 7.0) joint = terrainJoint(p / 3.0, pixel / 3.0, 0.003);
        else if (surfaceId == 15.0 || surfaceId == 16.0 || surfaceId == 27.0 || surfaceId == 28.0) {
          vec2 scale = surfaceId == 16.0 ? vec2(3.2, 6.4) : surfaceId == 27.0 ? vec2(0.45, 4.0) : vec2(2.0);
          vec2 grid = p * scale;
          if (surfaceId != 28.0) grid.x += mod(floor(grid.y), 2.0) * 0.5;
          joint = terrainJoint(grid, pixel * scale, 0.025);
          if (surfaceId == 27.0) shade += sin(p.y * 100.0 + noiseValue.x * 4.0) * 0.05 * detail;
        }
        float wet = terrainRain * (surfaceId < 7.0 ? 1.0 : parameters.x) * (0.65 + noiseValue.x * 0.35);
        result.color *= mix(shade, 0.6, joint) * (1.0 - wet * 0.25);
        result.roughness = clamp(base.a - wet * 0.5, 0.12, 1.0);
        return result;
      }

  `;
  function prepareMaterial(target: MeshStandardMaterial, detailed: boolean) {
    target.customProgramCacheKey = () => detailed ? "terrainMaterial9" : "terrainPreview2";
    target.onBeforeCompile = shader => {
      Object.assign(shader.uniforms, uniforms);
      shader.vertexShader = "varying vec3 terrainPosition; varying vec2 terrainLocalPosition;\n" + shader.vertexShader;
      shader.vertexShader = shader.vertexShader.replace("#include <begin_vertex>", `
        #include <begin_vertex>
        terrainPosition = (modelMatrix * vec4(position, 1.0)).xyz;
        terrainLocalPosition = position.xz;
      `);
      shader.fragmentShader = sharedTerrainShader + (detailed ? detailedTerrainShader : previewTerrainShader) + shader.fragmentShader;
      shader.fragmentShader = shader.fragmentShader.replace("#include <color_fragment>", `
        #include <color_fragment>
        vec2 terrainPixel = max(fwidth(terrainPosition.xz), vec2(0.0001));
        vec2 terrainNoiseValue = vec2(terrainNoise(terrainPosition.xz * 0.85), terrainNoise(terrainPosition.xz * 28.0));
        vec2 terrainGridPoint = clamp((terrainLocalPosition / terrainGrid.x + 0.5) * terrainGrid.y, vec2(0.0), vec2(terrainGrid.y));
        ivec2 terrainCellPoint = ivec2(min(floor(terrainGridPoint), vec2(terrainGrid.y - 1.0)));
        vec2 terrainUv = smoothstep(vec2(0.0), vec2(1.0), terrainGridPoint - vec2(terrainCellPoint));
        vec4 terrainCornerWeights = vec4((1.0 - terrainUv.x) * (1.0 - terrainUv.y),
          (1.0 - terrainUv.x) * terrainUv.y, terrainUv.x * (1.0 - terrainUv.y), terrainUv.x * terrainUv.y);
        float terrainIds[16], terrainWeights[16];
        for (int i = 0; i < 16; i++) { terrainIds[i] = 0.0; terrainWeights[i] = 0.0; }
        float terrainPaintCoverage = 0.0;
        if (terrainPaintSegments > 0.0) {
          vec2 paintPoint = clamp((terrainLocalPosition / terrainGrid.x + 0.5) * terrainPaintSegments, vec2(0.0), vec2(terrainPaintSegments));
          ivec2 paintCell = ivec2(min(floor(paintPoint), vec2(terrainPaintSegments - 1.0)));
          vec2 paintUv = smoothstep(vec2(0.0), vec2(1.0), paintPoint - vec2(paintCell));
          vec4 paintWeights = vec4((1.0 - paintUv.x) * (1.0 - paintUv.y), (1.0 - paintUv.x) * paintUv.y,
            paintUv.x * (1.0 - paintUv.y), paintUv.x * paintUv.y);
          bool paintOpaque = true;
          for (int i = 0; i < 4; i++) {
            vec4 encoded = texelFetch(terrainPaintMap, paintCell + ivec2(i / 2, i % 2), 0);
            float weight = paintWeights[i] * encoded.a;
            if (encoded.a < 1.0) paintOpaque = false;
            terrainIds[8 + i * 2] = floor(encoded.r * 255.0 + 0.5) + float(terrainPaintStyled) * 256.0;
            terrainIds[9 + i * 2] = floor(encoded.g * 255.0 + 0.5) + float(terrainPaintStyled) * 256.0;
            terrainWeights[8 + i * 2] = weight * (1.0 - encoded.b);
            terrainWeights[9 + i * 2] = weight * encoded.b;
            terrainPaintCoverage += weight;
          }
          terrainPaintCoverage = paintOpaque ? 1.0 : clamp(terrainPaintCoverage, 0.0, 1.0);
        }
        if (terrainPaintCoverage < 1.0) for (int i = 0; i < 4; i++) {
          vec4 encoded = texelFetch(terrainSurfaces, terrainCellPoint + ivec2(i / 2, i % 2), 0);
          terrainIds[i * 2] = floor(encoded.r * 255.0 + 0.5);
          terrainIds[i * 2 + 1] = floor(encoded.g * 255.0 + 0.5);
          float weight = terrainCornerWeights[i] * (1.0 - terrainPaintCoverage);
          terrainWeights[i * 2] = weight * (1.0 - encoded.b);
          terrainWeights[i * 2 + 1] = weight * encoded.b;
        }
        int terrainUniqueCount = 0;
        for (int i = 0; i < 16; i++) {
          float id = terrainIds[i], weight = terrainWeights[i];
          if (weight <= 0.0) continue;
          int match = -1, j = 0;
          while (j < terrainUniqueCount) {
            if (terrainIds[j] == id) { match = j; break; }
            j++;
          }
          if (match >= 0) terrainWeights[match] += weight;
          else {
            terrainIds[terrainUniqueCount] = id; terrainWeights[terrainUniqueCount] = weight;
            terrainUniqueCount++;
          }
        }
        // ACT: 高度最多256格，绘制图最多1024格；每像素最多旧8+新8层，先去重，纯材质只采样一次。
        vec3 terrainAlbedo = vec3(0.0);
        float terrainRoughness = 0.0, terrainHeight = 0.0, terrainSaltHeight = 0.0, terrainTotal = 0.0, terrainMetalness = 0.0;
        vec3 terrainEmission = vec3(0.0);
        int terrainSlot = 0;
        while (terrainSlot < terrainUniqueCount && terrainSlot < terrainLayerLimit) {
          float weight = terrainWeights[terrainSlot];
          TerrainSample layer = terrainSample(terrainIds[terrainSlot], terrainPosition, terrainPixel, terrainNoiseValue);
          terrainAlbedo += layer.color * weight;
          terrainRoughness += layer.roughness * weight;
          terrainHeight += layer.height * weight;
          terrainSaltHeight += layer.saltHeight * weight;
          terrainMetalness += layer.metalness * weight;
          terrainEmission += layer.emission * weight;
          terrainTotal += weight;
          terrainSlot++;
        }
        terrainAlbedo /= max(0.00001, terrainTotal);
        terrainRoughness /= max(0.00001, terrainTotal);
        terrainHeight /= max(0.00001, terrainTotal);
        terrainSaltHeight /= max(0.00001, terrainTotal);
        terrainMetalness /= max(0.00001, terrainTotal);
        terrainEmission /= max(0.00001, terrainTotal);
        diffuseColor.rgb *= terrainAlbedo;
      `).replace("#include <roughnessmap_fragment>", `
        #include <roughnessmap_fragment>
        roughnessFactor = terrainRoughness;
      `).replace("#include <metalnessmap_fragment>", `
        #include <metalnessmap_fragment>
        metalnessFactor = terrainMetalness;
      `).replace("#include <emissivemap_fragment>", `
        #include <emissivemap_fragment>
        totalEmissiveRadiance += terrainEmission;
      `).replace("#include <lights_fragment_maps>", `
        #include <lights_fragment_maps>
        #if defined(RE_IndirectSpecular)
          if (terrainMetalness > 0.0) radiance += terrainMetalness * terrainEnvironment(geometryViewDir, geometryNormal, material.roughness);
        #endif
      `).replace("#include <normal_fragment_maps>", detailed ? `
        #include <normal_fragment_maps>
        vec3 terrainSigmaX = dFdx(-vViewPosition), terrainSigmaY = dFdy(-vViewPosition);
        vec3 terrainR1 = cross(terrainSigmaY, normal), terrainR2 = cross(normal, terrainSigmaX);
        float terrainDet = dot(terrainSigmaX, terrainR1);
        vec2 terrainHeightGradient = vec2(dFdx(terrainHeight - terrainSaltHeight), dFdy(terrainHeight - terrainSaltHeight));
        terrainHeightGradient *= 1.0 - smoothstep(0.01, 0.06, max(terrainPixel.x, terrainPixel.y));
        vec2 terrainSaltGradient = vec2(dFdx(terrainSaltHeight), dFdy(terrainSaltHeight));
        terrainHeightGradient += terrainSaltGradient * (1.0 - smoothstep(0.008, 0.025, max(terrainPixel.x, terrainPixel.y)));
        vec3 terrainGradient = (terrainHeightGradient.x * terrainR1 + terrainHeightGradient.y * terrainR2) / max(abs(terrainDet), 1e-12) * sign(terrainDet);
        normal = normalize(normal - terrainGradient / max(1.0, length(terrainGradient) * 0.5));
      ` : "#include <normal_fragment_maps>");
    };
  }
  prepareMaterial(material, true);
  prepareMaterial(previewMaterial, false);
  let disposed = false;
  const paletteColors = terrainSurfaceOptions.map(surface => surface.color);
  const paletteColor = new Color();
  function setColors(colors?: Record<string, string>) {
    if (disposed) return;
    let changed = false;
    for (const surface of terrainSurfaceOptions) {
      if (surface.id === 38) continue;
      const override = colors?.[surface.id];
      const value = typeof override === "string" && /^#[0-9a-f]{6}$/i.test(override) ? override : surface.color;
      if (paletteColors[surface.id] === value) continue;
      paletteColor.set(value);
      paletteValues.set([paletteColor.r, paletteColor.g, paletteColor.b], surface.id * 4);
      paletteColors[surface.id] = value;
      changed = true;
    }
    if (changed) paletteTexture.needsUpdate = true;
  }
  function update(terrain: SceneTerrain, materialOnly = false) {
    if (disposed) return;
    const gridChanged = width !== terrain.segments + 1 || uniforms.terrainGrid.value.x !== terrain.size;
    if (width !== terrain.segments + 1) {
      width = terrain.segments + 1;
      surfaceValues = new Uint8Array(width * width * 4);
      surfaceTexture.dispose();
      surfaceTexture = createSurfaceTexture();
      uniforms.terrainSurfaces.value = surfaceTexture;
    }
    let changed = surfaceTexture.version === 0;
    if (!materialOnly || gridChanged) for (let index = 0; index < width * width; index++) {
      const value = terrain.surfaces[index];
      const id = typeof value === "number" && Number.isInteger(value) && value >= 0 && value < count ? value : 38;
      const top = terrain.surfaceBlend?.surfaces[index];
      const topId = typeof top === "number" && Number.isInteger(top) && top >= 0 && top < count ? top : id;
      const coverage = terrain.surfaceBlend?.weights[index] ?? 0;
      const weight = Number.isFinite(coverage) ? Math.round(Math.min(1, Math.max(0, coverage)) * 255) : 0;
      const offset = index * 4;
      if (surfaceValues[offset] !== id || surfaceValues[offset + 1] !== topId || surfaceValues[offset + 2] !== weight) {
        surfaceValues[offset] = id; surfaceValues[offset + 1] = topId; surfaceValues[offset + 2] = weight; changed = true;
      }
    }
    if (changed) surfaceTexture.needsUpdate = true;
    const paint = getTerrainPaint(terrain);
    if (paint?.data !== paintData || (paint?.segments ?? 0) !== paintSegments) {
      paintData = paint?.data;
      paintSegments = paint?.segments ?? 0;
      paintTexture.dispose();
      paintTexture = createPaintTexture(paintData, paintSegments);
      uniforms.terrainPaintMap.value = paintTexture;
      uniforms.terrainPaintSegments.value = paintSegments;
      paintVersion = -1;
    }
    if (paint && paint.version !== paintVersion) { paintTexture.needsUpdate = true; paintVersion = paint.version; }
    const styles = paint?.styles;
    let stylesChanged = false;
    for (let index = 0; index < (styles?.length ?? 0); index++) {
      const style = styles![index]!;
      const key = style.surface + ":" + style.color;
      if (styleKeys[index] === key) continue;
      styleColor.set(style.color);
      styleValues.set([styleColor.r, styleColor.g, styleColor.b, style.surface], index * 4);
      styleKeys[index] = key;
      stylesChanged = true;
    }
    styleKeys.length = styles?.length ?? 0;
    if (stylesChanged) styleTexture.needsUpdate = true;
    uniforms.terrainPaintStyled.value = styles ? 1 : 0;
    setColors(terrain.surfaceColors);
    uniforms.terrainGrid.value.set(terrain.size, terrain.segments);
    uniforms.terrainSeed.value = terrain.seed % 65536;
  }
  function setEnvironment(sky: Color, ground: Color, sun: Color, sunDirection: Vector3) {
    if (disposed) return;
    uniforms.terrainEnvSky.value.copy(sky);
    uniforms.terrainEnvGround.value.copy(ground);
    uniforms.terrainEnvSun.value.copy(sun);
    uniforms.terrainEnvSunDirection.value.copy(sunDirection).normalize();
  }
  function dispose() {
    if (disposed) return;
    disposed = true;
    surfaceTexture.dispose();
    paletteTexture.dispose();
    paintTexture.dispose();
    styleTexture.dispose();
    material.dispose();
    previewMaterial.dispose();
  }
  update(initial);
  return { material, previewMaterial, update, setColors, setEnvironment, setRain(rain: number) { uniforms.terrainRain.value = Math.min(1, Math.max(0, rain)); }, dispose };
}
