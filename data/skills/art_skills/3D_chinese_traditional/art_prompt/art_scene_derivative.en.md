---
name: art_scene_derivative
description: Scene derived asset generation · constraint manual
metaData: art_skills
---

# Scene Derived Asset Generation · Constraint Manual

---

## 1. Derivation principles

1. **Spatial consistency** — architectural structure/layout/material stay consistent across all variants
2. **Driven by shot size** — the same scene serves different narrative functions through different shot sizes
3. **Time-of-day switching** — the same space shows a different lighting atmosphere at different times of day
4. **Weather change** — the same space shows a different emotion under different weather
5. **3D is the anchor** — every variant must keep the 3D render texture and refuse a flat-texture/CG-animation feel; keep volumetric light, ambient occlusion and depth-of-field blur

---

## 2. Shot-size variants

### Shot-size definitions

| Shot size | Range | Narrative function | Prompt |
|---|---|---|---|
| Extreme wide shot (大全景) | The whole scene + the surrounding environment | Establish the space, orient the viewer | extreme wide shot、大全景 |
| Wide shot (全景) | The scene presented complete | Show the spatial structure | wide shot、全景 |
| Medium shot (中景) | A local area of the scene | Focus on a functional area | medium shot、中景 |
| Medium close-up (近景) | A detail of the scene | Close-up (特写) of material/atmosphere props | close shot、近景 |
| Close-up (特写) | An extremely local detail | Material grain/key props | extreme closeup、特写 |

### Shot-size derivation specification

| Derived from the base image | Stays unchanged | May change |
|---|---|---|
| 大全景 → 全景 | Building exterior, overall layout | Viewpoint narrows, more foreground |
| 全景 → 中景 | Material, tone, light | Crop and focus, depth of field changes |
| 中景 → 近景 | Material, tone | Shallow depth of field, background blurred |
| 近景 → 特写 | Material grain | Extremely shallow depth of field, a macro feel |

---

## 3. Time-of-day variants

### Time-of-day definitions

| Time of day | Visual character | Prompt |
|---|---|---|
| Early morning | Thin mist and soft light, tone interweaving cool and warm | faint morning light、early-morning mist |
| Midday | Bright, short shadows, vivid color | midday sun、bright light |
| Dusk | Golden tone, long shadows, sky gradient | golden glow of dusk、golden hour |
| Night (moonlight) | Cool blue tone, quiet and cold | clear moonlight、moonlight |
| Night (lamplight) | Warm yellow accents, light-dark contrast | scattered lamplight、flickering candlelight |

### Time-of-day derivation specification

| Derived from the base time of day | Stays unchanged | What changes |
|---|---|---|
| Day → dusk | Building/layout/material | Sky tone warms up, shadows lengthen |
| Day → night | Building/layout/material | Overall darkening, lamplight/moonlight atmosphere added |
| Interior day → interior night | Spatial structure, furniture | Overall tone warms up, candlelight/lantern elements added |

---

## 4. Weather variants

### Weather definitions

| Weather | Visual character | Prompt |
|---|---|---|
| Clear | Bright, clear shadows | boundless clear sky、bright sunshine |
| Overcast | Even light, no hard shadow | soft overcast light、overcast |
| Thin mist | Reduced visibility, hazy air | thin mist spreading、mist curling around |
| Drizzle | Water beads, damp reflections, rain threads | drizzle fine as silk、a light veil of rain |
| Falling snow | White cover, snowflakes drifting down | snow falling thick、wrapped in silver white |

### Weather derivation specification

| Derived from the base weather | Stays unchanged | What changes |
|---|---|---|
| Clear → thin mist | Building/layout | A mist layer added, distant scenery blurred, saturation lowered |
| Clear → drizzle | Building/layout | Rain threads added, ground reflections, tone turns cool |
| Clear → falling snow | Building/layout | Snow cover added, snowflakes, tone turns white |
| Vegetation must adapt to the weather logic | — | Petals damp in the rain, bare branches frosted in the snow |

---

## 5. Angle variants

### Angle definitions

> Relative to the reference image, the derived image may switch along the angle dimensions below. The caller passes in the reference image + a target angle description; this file defines only the angle vocabulary and the consistency constraints.

| Angle | Description | Prompt |
|---|---|---|
| Front/front view | Compared with the reference image, the line of sight faces the front of the scene | front view、eye level |
| Side (left/right) | Level view 90° to the left/right of the scene | left side view / right side view |
| Back/rear view | 180° to the back of the scene | back view |
| High angle | Looking down from a high position, showing the overall layout | high angle、bird's eye view |
| Low angle | Looking up from a low position, emphasizing a tall subject | low angle、worm's eye view |
| Closer push-in (近景推进) | Same direction but the camera pushes in (镜头推进), focusing on a part | push-in、closer angle |
| Free angle | Any angle description defined by the caller | injected per `{target angle}` |

### Angle derivation specification

| Item | Constraint |
|---|---|
| Reference consistency | Architectural structure/layout/material/tone/light/season/weather must match the reference image |
| Viewpoint | The same scene center point, only the angle switches; the eye height may adjust with the angle |
| Lighting logic | The light-source direction of the reference image does not change; after the angle switches, the cast direction of light and shadow must be recomputed accordingly (staying physically plausible) |
| Layout | A single frame (not a montage, not multi-view, not split screen) |
| People | **Any person, human shadow or human silhouette is strictly forbidden** |
| Aspect ratio | 16:9 by default (or as set by the caller) |

---

## 6. Prompt template

Guofeng-era derived scene image，based on the reference image，
3D render style，high-precision modeling，PBR materials，Guofeng 3D，cinema-level lighting，
3D rendered, volumetric lighting,
depth of field, natural lens vignette, subtle chromatic aberration, bokeh,
3D render texture，volumetric light，natural illumination，physical light and shadow，
scene derivative design sheet, environment concept art, no people, no characters, no human figures,
keep the spatial structure of the scene consistent，
{target angle (if any)}, {shot-size viewpoint (if any)}, {time-of-day description (if any)}, {weather description (if any)},
{foreground}, {middle ground}, {background},
{tone description}, {depth-of-field description (if any)}, {sky tone change (if any)}, {atmosphere adjustment (if any)},
{weather visual character (if any)}, {material surface change (if any)}, {vegetation adaptation description (if any)},
natural wear marks on materials，patina of years，moss and weathering，natural drape and folds of cloth，
volumetric light，ambient occlusion，natural light diffusion，soft light and shadow，
atmospheric perspective，ultra-clear grain detail，
single-frame composition，keeping the architectural structure/material/tone/light consistent with the reference image，switching the viewpoint only to the target angle，
no person of any kind in the frame
no text of any kind in the image

> **Usage note**: judge for yourself from the information the user provides which change dimensions to apply (angle/shot size/time of day/weather); for dimensions not mentioned, leave the corresponding field empty and omit it. There is no need to generate a separate template for each variant.

---

## 7. Constraint rules

### Mandatory

| No. | Rule |
|---|---|
| R1 | The spatial structure of the scene stays consistent across all variants |
| R2 | A time-of-day variant must adjust the sky tone and the atmosphere |
| R3 | A weather variant must adapt the vegetation/material surfaces |
| R4 | The derived image must be a "single frame"; multi-view/grid/split-screen montages are not allowed |
| R5 | The derived image must keep the architectural structure/material/tone/light consistent with the reference image, switching the viewpoint only to the specified angle |
| R6 | **Any person is strictly forbidden** in the scene image |
| R7 | Judge the change dimensions for yourself from the information the user provides (angle/shot size/time of day/weather); leave dimensions not mentioned empty and omit them |
| R8 | Must contain the 3D render keywords (3D rendered / volumetric lighting / PBR materials) |
| R9 | Must contain lens optical characteristics (at least one of depth of field / lens vignette / bokeh) |
| R10 | Materials must carry natural wear/marks of years; a brand-new flawless "CG feel" is forbidden |

### Forbidden

| No. | Forbidden |
|---|---|
| X1 | Architectural structure/layout inconsistent between variants |
| X2 | Weather contradicting the season (snow falling in summer and the like) |
| X3 | An abrupt change of material/style between variants |
| X4 | Any person, human shadow, human silhouette or human outline appearing |
| X5 | The frame being montaged into a multi-view/grid/split-screen layout |
| X6 | Low-precision modeling/crude textures/plastic texture (words such as low-poly, rough modeling are banned) |
| X7 | Materials too clean and perfect, with no marks of use and no feel of years (avoid a "plastic feel") |
| X8 | Lighting too even and flat, with no depth-of-field blur and no lens optical characteristics |
