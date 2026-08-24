# 3D Anime Render Urban Scene Derivative Asset Generation · Constraint Manual

---

## 1. Derivation principles

1. **Spatial consistency** — architectural structure/layout/material stay consistent across all variants
2. **Driven by shot size** — the same scene serves different narrative functions through different shot sizes
3. **Time-of-day switching** — the same space shows a different lighting atmosphere at different times of day
4. **Weather change** — the same space shows a different emotion under different weather
5. **Cel shading as the anchor** — every variant must keep the 3D animation render + cel-shaded style and refuse realistic-photography/CG-animation feel; keep the lens character and lighting consistent
6. **Unified urban atmosphere** — every variant must keep the modern urban style and the warm-toned color scheme

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
| Early morning | Thin mist and soft light, tone interweaving cool and warm (cel-shaded) | faint morning light, early-morning mist |
| Midday | Bright, short shadows, vivid color (cel-shaded) | midday sun, bright light |
| Dusk | Golden tone, long shadows, sky gradient (cel-shaded) | golden glow of dusk, golden hour |
| Night (moonlight) | Cool blue tone, quiet and cold (cel-shaded) | clear moonlight, moonlight |
| Night (lamplight) | Warm yellow accents, light-dark contrast (cel-shaded) | scattered lamplight, flickering candlelight |

### Time-of-day derivation specification

| Derived from the base time of day | Stays unchanged | What changes |
|---|---|---|
| Day → dusk | Building/layout/material | Sky tone warms up, shadows lengthen (cel-shaded) |
| Day → night | Building/layout/material | Overall darkening, lamplight/moonlight atmosphere added (cel-shaded) |
| Interior day → interior night | Spatial structure, furniture | Overall tone warms up, candlelight/lantern elements added (cel-shaded) |

---

## 4. Weather variants

### Weather definitions

| Weather | Visual character | Prompt |
|---|---|---|
| Clear | Bright, shadows clear (cel-shaded) | clear open sky, bright sunshine |
| Overcast | Even light, no hard shadow (cel-shaded) | soft overcast light, overcast |
| Thin mist | Visibility lowered, hazy air (cel-shaded) | thin mist spreading, haze curling |
| Drizzle | Water droplets, wet reflection, rain streaks (cel-shaded) | drizzle like silk, a gauze curtain of rain |
| Falling snow | White cover, snowflakes drifting down (cel-shaded) | snow falling thick, wrapped in silver white |

### Weather derivation specification

| Derived from the base weather | Stays unchanged | What changes |
|---|---|---|
| Clear → thin mist | Building/layout | Add a fog layer, blur the distant view, lower the saturation (cel-shaded) |
| Clear → drizzle | Building/layout | Add rain streaks, ground reflection, tone turns cooler (cel-shaded) |
| Clear → falling snow | Building/layout | Add snow cover, snowflakes, tone turns whiter (cel-shaded) |
| Vegetation must adapt to the weather logic | — | Petals wet in the rain, bare branches frosted in the snow (cel-shaded) |

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
| Reference consistency | Architectural structure/layout/material/tone/light/season/weather must match the reference image (cel-shaded treatment) |
| Viewpoint | The same scene centre point, only the angle switches; eye height may adjust with the angle |
| Lighting logic | The light-source direction of the reference image does not change; after the angle switches, the direction of light and cast shadow must be recomputed to match (cel-shaded treatment) |
| Layout | A single frame (not a collage, not multi-view, not a split screen) |
| People | **Any person, human shadow or human silhouette is strictly forbidden** |
| Aspect ratio | 16:9 by default (or as set by the caller) |

---

## 6. Prompt template
```
3D animation render，cinematic lighting，vivid cel-shaded texture，high-detail materials，joyful healing atmosphere，cartoon urban style，high-detail cartoon materials，moderate cartoon proportions，warm-toned color scheme，8K ultra HD，cinematic composition，soft light-and-shadow layering，bright cartoon render style，warm and healing，derived scene image，based on the reference image，
anime style, cel-shaded, 3D animation render,
film lighting, warm sunset lighting,
scene derivative design sheet, environment concept art, no people, no characters, no human figures,
keep the scene's spatial structure consistent，
{target angle (if any)}，{shot-size viewpoint (if any)}，{time-of-day description (if any)}，{weather description (if any)}，
{foreground}，{midground}，{background}，
{tone description}，{depth-of-field description (if any)}，{sky tone change (if any)}，{atmosphere adjustment (if any)}，
{weather visual character (if any)}，{material surface change (if any)}，{vegetation adaptation description (if any)}，
natural marks of use on materials，lived-in wear，fabric falling in natural folds (cel-shaded)，
diffused natural light，volumetric light，cel-shaded light effect，cel-shaded cast shadow，
atmospheric perspective，clear grain，cel-shaded treatment，
single-frame composition，keep the architectural structure/material/tone/light consistent with the reference image，switch the viewpoint only per the target angle，
no person of any kind in frame，
cel-shaded render style，soft light-and-shadow，moderate cartoon proportions，high-detail cartoon materials，
warm-toned color scheme，dusk sunset-glow atmosphere，joyful healing atmosphere，
8K ultra HD，cinematic composition，
no text of any kind in the image
```

> **Usage note**: judge for yourself, from the information the user provides, which change dimensions to apply (angle/shot size/time of day/weather); for dimensions not mentioned, leave the corresponding field empty and omit it. There is no need to generate a separate template for each variant.

---

## 7. Constraint rules

### Mandatory

| No. | Rule |
|---|---|
| R1 | The scene's spatial structure stays consistent across all variants |
| R2 | A time-of-day variant must adjust the sky tone and the atmosphere (cel-shaded) |
| R3 | A weather variant must adapt the vegetation/material surfaces (cel-shaded) |
| R4 | The derived image must be a "single frame"; stitching multiple views/grids/split screens is not allowed |
| R5 | The derived image must keep the architectural structure/material/tone/light consistent with the reference image and switch the viewpoint only per the specified angle |
| R6 | **Any person in the scene image is strictly forbidden** |
| R7 | Judge the change dimensions yourself from the information the user provides (angle/shot size/time of day/weather); leave the dimensions not mentioned empty and omit them |
| R8 | Must contain the 3D anime render keywords (cel-shaded, 3D animation render, anime style) |
| R9 | Must contain a lens optical characteristic (at least one of shallow depth of field / lens vignette / bokeh, given cel-shaded treatment) |
| R10 | Materials must carry natural wear/marks of age; a brand-new, flawless "CG look" is forbidden, but it is presented cel-shaded |
| R11 | Must keep the cel-shaded render style consistent; mixing in realistic elements is not allowed |
| R12 | Must contain the warm-toned color scheme and dusk sunset-glow atmosphere keywords |
| R13 | Must contain the 8K ultra HD and cinematic composition keywords |
| R14 | Must contain the cinematic lighting and joyful healing atmosphere keywords |

### Forbidden

| No. | Forbidden |
|---|---|
| X1 | Architectural structure/layout inconsistent between variants |
| X2 | Weather contradicting the season (falling snow in summer, etc., within the limits of cel shading) |
| X3 | An abrupt material/style shift between variants |
| X4 | Any person, human shadow, human silhouette or human outline appearing |
| X5 | The frame being stitched into a multi-view/grid/split-screen layout |
| X6 | 3D-render/CG-animation/cartoon/game-engine texture (the words 3D render, CGI, Unreal Engine, Unity, etc. are banned) — 3D anime cel-shaded rendering must be stated explicitly instead |
| X7 | Material too clean and perfect, with no marks of use or age at all (avoid the "plastic look"); cel-shaded treatment is required |
| X8 | Lighting too even and flat, no depth-of-field blur, no lens optical characteristic |
| X9 | Using photographic realism terms (such as real photography, photorealistic, RAW photo, etc.) |
| X10 | Ancient/futuristic elements, anything outside the modern urban style |
| X11 | A cool-toned/night-time dominant tone instead of warm tones/a dusk atmosphere |
| X12 | Missing the joyful healing atmosphere keyword |