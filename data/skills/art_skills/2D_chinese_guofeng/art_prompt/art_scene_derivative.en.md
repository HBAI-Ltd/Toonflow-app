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
3. **Time-of-day switching** — the same space shows a different lighting mood at different times of day
4. **Weather change** — the same space shows a different emotion under different weather
5. **Anime as the anchor** — every variant must keep the Guofeng anime texture; 3D photorealism/CG-animation feel is refused; keep delicate lines, cel-shaded flat coloring, Japanese-style rendering

---

## 2. Shot-size variants

### Shot-size definitions

| Shot size | Range | Narrative function | Prompt |
|---|---|---|---|
| Extreme wide shot (大全景) | The whole scene + the surrounding environment | Establish the space, orient the viewer | extreme wide shot、大全景 |
| Wide shot (全景) | The scene presented complete | Show the spatial structure | wide shot、全景 |
| Medium shot (中景) | A local area of the scene | Focus on a functional area | medium shot、中景 |
| Medium close-up (近景) | A detail of the scene | Close-up (特写) of material/atmosphere props | close shot、近景 |
| Close-up (特写) | An extremely local detail | Material weave/key props | extreme closeup、特写 |

### Shot-size derivation specification

| Derived from the base image | Stays unchanged | May change |
|---|---|---|
| 大全景 → 全景 | Building exterior, overall layout | Viewpoint narrows, more foreground |
| 全景 → 中景 | Material, tone, light | Crop and focus, depth of field changes |
| 中景 → 近景 | Material, tone | Shallow depth of field, background softened |
| 近景 → 特写 | Material weave | Extremely shallow depth of field, a macro feel |

---

## 3. Time-of-day variants

### Time-of-day definitions

| Time of day | Visual character | Prompt |
|---|---|---|
| Early morning | Thin mist and soft light, tone woven of cool and warm | faint morning light、early morning mist |
| Midday | Bright, short shadows, vivid color | midday sun、bright light |
| Dusk | Golden tone, long shadows, gradient sky | golden glow of dusk、golden hour |
| Night (moonlight) | Cool blue tone, quiet and cold | clear radiance of moonlight、moonlight |
| Night (lamplight) | Warm yellow accents, light-dark contrast | lamps thinning out into the night、points of candlelight |

### Time-of-day derivation specification

| Derived from the base time of day | Stays unchanged | What changes |
|---|---|---|
| Day → dusk | Architecture/layout/material | Sky tone warms, shadows lengthen |
| Day → night | Architecture/layout/material | Overall darkening, add lamplight/moonlight atmosphere |
| Interior day → interior night | Spatial structure, furniture | Overall tone warms, add candle/lantern elements |

---

## 4. Weather variants

### Weather definitions

| Weather | Visual character | Prompt |
|---|---|---|
| Clear | Bright, shadows clear | a clear boundless sky、bright sunshine |
| Overcast | Even light, no hard shadows | soft overcast light、overcast |
| Light mist | Visibility drops, the air hazy | thin mist drifting、mist curling around |
| Fine rain | Water droplets, wet reflections, threads of rain | fine rain like silk threads、a light veil of rain |
| Falling snow | White covering, snowflakes drifting down | snow falling thick、the world wrapped in silver |

### Weather derivation specification

| Derived from the base weather | Stays unchanged | What changes |
|---|---|---|
| Clear → light mist | Architecture/layout | Add a mist layer, distant scenery blurred, saturation lowered |
| Clear → fine rain | Architecture/layout | Add threads of rain, reflections on the ground, tone turns cool |
| Clear → falling snow | Architecture/layout | Add settled snow, snowflakes, tone turns white |
| Vegetation must adapt to the weather logic | — | Petals wet in the rain, bare branches frosted in the snow |

---

## 5. Angle variants

### Angle definitions

> Relative to the reference image, the derived image may switch along the angle dimensions below. The caller passes in a reference image + a target angle description; this file only defines the angle vocabulary and the consistency constraints.

| Angle | Description | Prompt |
|---|---|---|
| Front/front view | Compared with the reference image, the line of sight faces the front of the scene | front view、eye level |
| Side (left/right) | Level view toward the left/right side of the scene at 90° | left side view / right side view |
| Back/rear view | Toward the back of the scene at 180° | back view |
| High angle | Looking down from a high position, showing the overall layout | high angle、bird's eye view |
| Low angle | Looking up from a low position, emphasising a tall subject | low angle、worm's eye view |
| Closer push-in (近景推进) | Same direction but the camera pushes in (镜头推进), focusing on a part | push-in、closer angle |
| Free angle | Any angle description the caller defines | injected per `{target angle}` |

### Angle derivation specification

| Item | Constraint |
|---|---|
| Reference consistency | Architectural structure/layout/material/tone/light/season/weather must match the reference image |
| Viewpoint | The same scene centre point, only the angle switches; eye height may adjust with the angle |
| Lighting logic | The reference image's light direction stays; after the angle switches, the cast direction of light and shadow must be recomputed in step (keep it physically sound) |
| Layout | A single frame (not a montage, not multi-view, not split-screen) |
| People | **Any person, human shadow or human silhouette is strictly forbidden** |
| Aspect ratio | 16:9 by default (or as set by the caller) |

---

## 6. Prompt template

Guofeng anime derived scene image，based on the reference image，
Guofeng anime，new Guochao aesthetic，Japanese anime rendering，cel-shaded flat coloring，delicate brushwork，
Japanese anime style, cel shading, fine brushstrokes,
keep the scene's spatial structure consistent，
{target angle (if any)}, {shot-size viewpoint (if any)}, {time-of-day description (if any)}, {weather description (if any)},
{foreground}, {middle ground}, {background},
{tone description}, {depth-of-field description (if any)}, {sky tone change (if any)}, {atmosphere adjustment (if any)},
{weather visual character (if any)}, {material surface change (if any)}, {vegetation adaptation description (if any)},
natural wear marks on the materials，the patina of years，natural drape and folds in fabric，
soft light and shadow，Japanese-style rendering，diffused natural light，delicate texture，
Guofeng anime high-definition rendering，high detail，delicate lines，cel-shaded flat feel，
single-frame composition，keep architectural structure/material/tone/light consistent with the reference image，switch the viewpoint only per the target angle，
no person of any kind in the frame
no text of any kind in the image

> **How to use**: judge for yourself, from the information the user provides, which dimensions of change to apply (angle/shot size/time of day/weather); for dimensions not mentioned, leave the corresponding field empty and omit it. There is no need to generate a separate template for every variant.

---

## 7. Constraint rules

### Mandatory

| No. | Rule |
|---|---|
| R1 | The scene's spatial structure stays consistent across all variants |
| R2 | A time-of-day variant must adjust the sky tone and the atmosphere |
| R3 | A weather variant must adapt the vegetation/material surface |
| R4 | A derived image must be a "single frame"; stitching multi-view/grid/split-screen is not allowed |
| R5 | A derived image must keep architectural structure/material/tone/light consistent with the reference image, and only switch the viewpoint to the specified angle |
| R6 | **Any person is strictly forbidden** in a scene image |
| R7 | Judge the dimensions of change from the information the user provides (angle/shot size/time of day/weather); leave dimensions not mentioned empty and omit them |
| R8 | Must contain Guofeng anime keywords (Chinese style anime / cel shading / fine brushstrokes) |
| R9 | Must contain lens optical characteristics (cel-shaded flat coloring / delicate lines / Japanese-style rendering) |
| R10 | Materials must carry natural wear/marks of passing years; a brand-new flawless "CG feel" is forbidden |

### Forbidden

| No. | Forbidden |
|---|---|
| X1 | Architectural structure/layout inconsistent between variants |
| X2 | Weather contradicting the season (snow falling in summer and the like) |
| X3 | Abrupt shifts of material/style between variants |
| X4 | Any person, human shadow, human silhouette or human outline appearing |
| X5 | The frame stitched into a multi-view/grid/split-screen layout |
| X6 | 3D photorealism/CG animation/cartoon/game-engine texture (the words 3D render, CGI, Unreal Engine, Unity and the like are forbidden) |
| X7 | Materials too clean and perfect, with no use marks or sense of age (avoid a "plastic feel") |
| X8 | Lighting too even and flat, with no depth-of-field softening and no lens optical characteristics |
