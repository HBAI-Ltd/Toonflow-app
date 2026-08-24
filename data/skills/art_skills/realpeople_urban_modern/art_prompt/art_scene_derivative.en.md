# Scene Derivative Asset Generation · Urban Realism Constraint Manual

---

## 1. Derivative principles

1. **Consistent space** — building structure/layout/material stay consistent across every variant
2. **Shot-size driven** — the same scene serves different narrative functions through different shot sizes
3. **Time-of-day switching** — the same space shows a different light-and-shadow mood at different times of day
4. **Weather changes** — the same space carries a different emotion under different weather
5. **Anchored on live-action** — every variant must keep real photographic texture and reject a 3D-rendered/CG-animation feel; keep the lens optical characteristics and physical lighting

---

## 2. Shot-size variants

### Shot-size definitions

| Shot size | Range | Narrative function | Prompt |
|---|---|---|---|
| Extreme wide shot (大全景) | The whole scene + the surrounding environment | Establish the space, orient the viewer | extreme wide shot、大全景 |
| Wide shot (全景) | The scene presented complete | Show the spatial structure | wide shot、全景 |
| Medium shot (中景) | A local area of the scene | Focus on a functional area | medium shot、中景 |
| Medium close-up (近景) | A detail of the scene | Close-up (特写) of material/atmosphere props | close shot、近景 |
| Close-up (特写) | An extremely local detail | Material texture/key props | extreme closeup、特写 |

### Shot-size derivation specification

| Derived from the base image | Stays unchanged | May change |
|---|---|---|
| 大全景 → 全景 | Building exterior, overall layout | Viewpoint narrows, more foreground |
| 全景 → 中景 | Material, tone, light | Crop and focus, depth of field changes |
| 中景 → 近景 | Material, tone | Shallow depth of field, background softened |
| 近景 → 特写 | Material texture | Extremely shallow depth of field, a macro feel |

---

## 3. Time-of-day variants

### Time-of-day definitions

| Time of day | Visual characteristics | Prompt |
|---|---|---|
| Early morning | Thin mist and soft light, tone interweaving cool and warm | first light of dawn, early-morning mist |
| Midday | Bright, short shadows, vivid color | midday sun, bright light |
| Dusk | Golden tone, long shadows, gradient sky | golden glow of dusk、golden hour |
| Night (moonlight) | Cool blue tone, quiet and cold | clear moonlight、moonlight |
| Night (city lights) | Warm yellow accents, light-and-dark contrast | scattered lights, city night view |

### Time-of-day derivation specification

| Derived from the base time of day | Stays unchanged | What changes |
|---|---|---|
| Day → dusk | Building/layout/material | Sky tone warms up, shadows lengthen |
| Day → night | Building/layout/material | Overall darkening, add lights/moonlight atmosphere |
| Interior day → interior night | Spatial structure, furniture | Overall tone warms up, add desk lamp/floor lamp elements |

---

## 4. Weather variants

### Weather definitions

| Weather | Visual characteristics | Prompt |
|---|---|---|
| Clear | Bright, clear shadows | clear open sky, bright sunshine |
| Overcast | Even light, no hard shadows | soft overcast light、overcast |
| Light mist | Reduced visibility, hazy air | mist spreading, fog curling |
| Drizzle | Water droplets, wet reflection, rain threads | drizzle like silk, a light veil of rain |
| Falling snow | White cover, snowflakes drifting down | snow falling thick, wrapped in silver white |

### Weather derivation specification

| Derived from the base weather | Stays unchanged | What changes |
|---|---|---|
| Clear → light mist | Building/layout | Add a fog layer, blur the distance, lower saturation |
| Clear → drizzle | Building/layout | Add rain threads, ground reflection, tone leans cool |
| Clear → falling snow | Building/layout | Add snow cover, snowflakes, tone leans white |
| Vegetation must adapt to the weather logic | — | Petals wet in the rain, bare branches frosted in the snow |

---

## 5. Angle variants

### Angle definitions

> The derivative image can switch along the angle dimensions below relative to the reference image. The caller passes in the reference image + a target angle description; this file only defines the angle vocabulary and the consistency constraints.

| Angle | Description | Prompt |
|---|---|---|
| Front/front view | Compared with the reference image, the line of sight faces the front of the scene | front view、eye level |
| Side (left/right) | Level view 90° to the left/right of the scene | left side view / right side view |
| Back/rear view | 180° to the back of the scene | back view |
| High angle | Looking down from a high position, showing the overall layout | high angle、bird's eye view |
| Low angle | Looking up from a low position, emphasizing a tall subject | low angle、worm's eye view |
| Closer push-in (近景推进) | Same direction but the camera pushes in (镜头推进), focusing on a local part | push-in、closer angle |
| Free angle | Any angle description defined by the caller | injected via `{target angle}` |

### Angle derivation specification

| Item | Constraint |
|---|---|
| Reference consistency | Building structure/layout/material/tone/light/season/weather must match the reference image |
| Viewpoint | The same scene centre point, only the angle switches; eye height may be adjusted with the angle |
| Lighting logic | The light-source direction of the reference image does not change; after the angle switches, the direction of cast light and shadow must be recomputed accordingly (stay physically sound) |
| Layout | Single frame (not a montage, not multi-view, not split screen) |
| People | **Any person, human shadow or human silhouette is strictly forbidden** |
| Aspect ratio | 16:9 by default (or as set by the caller) |

---

## 6. Prompt template

```
modern urban derivative scene image，based on the reference image，
real photography，photorealistic，shot on ARRI Alexa，35mm film grain，
RAW photo，ultra realistic，hyper detailed，
shallow depth of field，natural lens vignette，subtle chromatic aberration，bokeh，
real photographic texture，film grain feel，natural lighting，physical light and shadow，
scene derivative design sheet，environment concept art，no people，no characters，no human figures，
keep the spatial structure of the scene consistent，
{target angle (if any)}，{shot-size viewpoint (if any)}，{time-of-day description (if any)}，{weather description (if any)}，
{foreground}，{middle ground}，{background}，
{tone description}，{depth-of-field description (if any)}，{sky tone change (if any)}，{atmosphere adjustment (if any)}，
{weather visual characteristics (if any)}，{material surface change (if any)}，{vegetation adaptation description (if any)}，
natural wear marks on materials，traces of use，peeling walls，oxidised metal，
natural diffuse light，volumetric light，Tyndall effect，caustic projection，
atmospheric perspective，ultra-crisp texture detail，
single-frame composition，keep building structure/material/tone/light consistent with the reference image，switch the viewpoint only to the target angle，
no people in frame
no text of any kind in the image
```


> **How to use**: judge for yourself from the information the user provides which change dimensions to apply (angle/shot size/time of day/weather); for dimensions not mentioned, leave the corresponding field empty and omit it. There is no need to generate a separate template for each variant.

---

## 7. Constraint rules

### Mandatory

| No. | Rule |
|---|---|
| R1 | The scene's spatial structure stays consistent across every variant |
| R2 | Time-of-day variants must adjust the sky tone and the atmosphere |
| R3 | Weather variants must adapt the vegetation/material surfaces |
| R4 | The derivative image must be a "single frame"; stitching multiple views/grid/split screen is not allowed |
| R5 | The derivative image must keep building structure/material/tone/light consistent with the reference image, switching the viewpoint only to the specified angle |
| R6 | **Any person appearing in the scene image is strictly forbidden** |
| R7 | Judge the change dimensions for yourself from the information the user provides (angle/shot size/time of day/weather); leave dimensions not mentioned empty and omit them |
| R8 | Must include live-action photography keywords (real photography / photorealistic / RAW photo) |
| R9 | Must include lens optical characteristics (at least one of shallow depth of field / lens vignette / bokeh) |
| R10 | Materials must carry natural wear/traces of use; a brand-new flawless "CG feel" is forbidden |

### Forbidden

| No. | Forbidden |
|---|---|
| X1 | Building structure/layout inconsistent between variants |
| X2 | Weather contradicting the season (snow in summer, etc.) |
| X3 | Material/style jumping abruptly between variants |
| X4 | Any person, human shadow, human silhouette or human outline appearing |
| X5 | The frame being stitched into a multi-view/grid/split-screen layout |
| X6 | 3D-rendered/CG-animation/cartoon/game-engine texture (the words 3D render, CGI, Unreal Engine, Unity and the like are banned) |
| X7 | Materials that are too clean and perfect, with no trace of use or age (avoid a "plastic feel") |
| X8 | Lighting that is too even and flat, with no depth-of-field blur and no lens optical characteristics |
