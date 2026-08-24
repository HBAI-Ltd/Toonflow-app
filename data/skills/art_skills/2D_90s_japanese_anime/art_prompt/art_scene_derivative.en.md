# 1990s Retro Japanese Anime Style - Scene Derivative Asset Generation · Constraint Manual

---

## 1. Derivation principles

1. **Spatial consistency** — architectural structure/layout/material stay consistent across all variants
2. **Driven by shot size** — the same scene serves different narrative functions through different shot sizes
3. **Time-of-day switching** — the same space shows a different light-and-shadow atmosphere at different times of day
4. **Weather change** — the same space carries a different emotion under different weather
5. **The 1990s as anchor** — every variant must keep the 1990s retro style and refuse modern CG/3D rendering

---

## 2. Shot-size variants

### Shot-size definitions

| Shot size | Range | Narrative function | Prompt |
|---|---|---|---|
| Extreme wide shot (大全景) | The whole scene + the surrounding environment | Establish the space, orient the viewer | extreme wide shot |
| Wide shot (全景) | The scene presented complete | Show the spatial structure | wide shot |
| Medium shot (中景) | A local area of the scene | Focus on a functional area | medium shot |
| Medium close-up (近景) | A detail of the scene | Close-up (特写) of material/atmosphere props | close shot |
| Close-up (特写) | An extremely local detail | Material texture/key props | extreme closeup |

### Shot-size derivation specification

| Derived from the base image | Stays unchanged | May change |
|---|---|---|
| 大全景 → 全景 | Building exterior, overall layout | Viewpoint narrows, more foreground |
| 全景 → 中景 | Material, tone, light | Crop and focus, depth-of-field change |
| 中景 → 近景 | Material, tone | Shallow depth of field, background blur |
| 近景 → 特写 | Material texture | Extremely shallow depth of field, macro feel |

---

## 3. Time-of-day variants

### Time-of-day definitions

| Time of day | Visual character | Prompt |
|---|---|---|
| Early morning | Thin mist and soft light, cool-leaning tone | morning light, early-morning mist |
| Midday | Bright, short shadows, vivid color | midday sun, bright light |
| Dusk | Golden tone, long shadows, gradient sky | dusk, golden hour |
| Night (moonlight) | Cool blue tone, still and cold | moonlight, moonlit night |
| Night (lamplight) | Warm yellow accents, light-and-dark contrast | night, lamplight |

### Time-of-day derivation specification

| Derived from the base time of day | Stays unchanged | What changes |
|---|---|---|
| Day → dusk | Building/layout/material | Sky tone warms, shadows lengthen |
| Day → night | Building/layout/material | Overall darkening, lamplight/moonlight added |
| Interior day → interior night | Spatial structure, furniture | Overall tone warms, light sources added |

---

## 4. Weather variants

### Weather definitions

| Weather | Visual character | Prompt |
|---|---|---|
| Clear | Bright, clear shadows | clear day, bright sunshine |
| Overcast | Even light, no hard shadow | overcast, soft light |
| Thin mist | Reduced visibility, hazy air | thin mist, drifting fog |
| Fine rain | Water droplets, wet reflections | fine rain, threads of rain |
| Falling snow | White cover, snowflakes falling | falling snow, snowflakes |

### Weather derivation specification

| Derived from the base weather | Stays unchanged | What changes |
|---|---|---|
| Clear → thin mist | Building/layout | A fog layer added, distance blurred |
| Clear → fine rain | Building/layout | Threads of rain added, ground reflections |
| Clear → falling snow | Building/layout | Snow cover added, snowflakes |
| Vegetation must adapt to the weather logic | — | Plants wet in rain, plants frosted in snow |

---

## 5. Angle variants

### Angle definitions

> Relative to the reference image, the derivative image may switch along the angle dimensions below. The caller passes in the reference image + a target-angle description; this file only defines the angle vocabulary and the consistency constraints.

| Angle | Description | Prompt |
|---|---|---|
| Front view | Compared with the reference image, the line of sight faces the front of the scene | front view, eye level |
| Side view (left/right) | Level view 90° to the left/right of the scene | left side view / right side view |
| Back view | 180° to the back of the scene | back view |
| High angle | Looking down from a high position, showing the overall layout | high angle, bird's eye view |
| Low angle | Looking up from a low position, emphasising a tall subject | low angle, worm's eye view |
| Closer push-in (近景推进) | Same direction, but the camera pushes in (镜头推进), focusing on a local area | push-in, closer angle |
| Free angle | Any angle description defined by the caller | injected as `{target angle}` |

### Angle derivation specification

| Item | Constraint |
|---|---|
| Consistency with the reference | Architectural structure/layout/material/tone/light/season/weather must match the reference image |
| Viewpoint | The same scene centre point, only the angle switches; eye height may be adjusted with the angle |
| Lighting logic | The light-source direction of the reference image does not change; after the angle switch, the cast direction of light and shadow must be recomputed accordingly (staying physically plausible) |
| Layout | Single frame (not a collage, not multi-view, not split screen) |
| People | **Any person, human shadow or human silhouette is strictly forbidden** |
| Aspect ratio | 16:9 by default (or as set by the caller) |

---

## 6. Prompt template
```
1990s retro Japanese anime style derivative scene image，based on the reference image，
90s anime style，hand-drawn flat coloring，soft warm tones，fine fluid linework，cinematic light and shadow，
scene derivative design sheet，environment concept art，no people，no characters，no human figures，
keep the scene's spatial structure consistent，
{target angle (if any)}，{shot-size viewpoint (if any)}，{time-of-day description (if any)}，{weather description (if any)}，
{foreground}，{middle ground}，{background}，
{tone description}，{depth-of-field description (if any)}，{sky tone change (if any)}，{atmosphere adjustment (if any)}，
{weather visual character (if any)}，{material surface change (if any)}，{vegetation adaptation description (if any)}，
fluid linework、block shading、signs of use，
soft cinematic light、background glow、natural lighting，
single-frame composition，keeping architectural structure/material/tone/light consistent with the reference image，switching the viewpoint only by the target angle，
no person anywhere in the frame
no text of any kind in the image
```

> **Usage note**: judge for yourself from the information the user provides which change dimensions apply (angle/shot size/time of day/weather); leave the fields of the dimensions not mentioned empty and omit them. There is no need to generate a separate template for each variant.

---

## 7. Constraint rules

### Mandatory

| No. | Rule |
|---|---|
| R1 | The scene's spatial structure stays consistent across all variants |
| R2 | A time-of-day variant must adjust the sky tone and the atmosphere |
| R3 | A weather variant must adapt the vegetation/material surfaces |
| R4 | The derivative image must be a "single frame"; stitching multiple views/grids/split screens is not allowed |
| R5 | The derivative image must keep architectural structure/material/tone/light consistent with the reference image, switching the viewpoint only by the specified angle |
| R6 | **Any person in the scene image is strictly forbidden** |
| R7 | Judge the change dimensions (angle/shot size/time of day/weather) for yourself from the information the user provides; leave the dimensions not mentioned empty and omit them |
| R8 | Must include the 1990s keywords (90s anime style / hand-drawn / warm tone) |
| R9 | Must include line character (at least one of fluid linework, block shading) |
| R10 | Materials must carry signs of use; a brand-new flawless "CG look" is forbidden |

### Forbidden

| No. | Forbidden |
|---|---|
| X1 | Architectural structure/layout inconsistent between variants |
| X2 | Weather contradicting the season |
| X3 | An abrupt change of material/style between variants |
| X4 | Any person, human shadow or human silhouette appearing |
| X5 | The frame stitched into a multi-view/grid/split-screen layout |
| X6 | 3D rendering/CG animation/modern-style texture |
| X7 | Materials too clean and perfect, with no signs of use at all |
| X8 | Lighting too even and flat, with no soft cinematic light |
