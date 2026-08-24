# Scene Derived Asset Generation · Constraint Manual

---

## 1. Derivation principles

1. **Spatial consistency** — building structure/layout/material stay consistent across all variants
2. **Shot-size driven** — the same scene shows different narrative functions through different shot sizes
3. **Time-of-day switching** — the same space presents a different light-and-shadow mood at different times of day
4. **Weather change** — the same space presents a different emotion under different weather
5. **Cel shading as the anchor** — every variant must keep the anime style, keeping clean lines and cel shading

---

## 2. Shot-size variants

### Shot-size definitions

| Shot size | Range | Narrative function | Prompt |
|---|---|---|---|
| Extreme wide shot (大全景) | The whole scene + the surrounding environment | Establish the space, orient the viewer | `extreme wide shot`、大全景 |
| Wide shot (全景) | The scene presented complete | Show the spatial structure | `wide shot`、全景 |
| Medium shot (中景) | A local area of the scene | Focus on a functional area | `medium shot`、中景 |
| Medium close-up (近景) | A detail of the scene | Close-up (特写) of material/atmosphere props | `close shot`、近景 |
| Close-up (特写) | An extremely local detail | Material texture/key props | `extreme closeup`、特写 |

### Shot-size derivation specification

| Derived from the base image | Stays unchanged | May change |
|---|---|---|
| 大全景 → 全景 | Building exterior, overall layout | Viewpoint narrows, more foreground |
| 全景 → 中景 | Material, tone, light | Crop and focus, depth of field changes |
| 中景 → 近景 | Material, tone | Shallow depth of field, background blur |
| 近景 → 特写 | Material texture | Extremely shallow depth of field, a macro feel |

---

## 3. Time-of-day variants

### Time-of-day definitions

| Time of day | Visual characteristics | Prompt |
|---|---|---|
| Early morning | Cool white light, a thin-mist feel | first light of dawn, thin morning mist |
| Midday | Bright, short shadows, vivid color | midday sun, bright light |
| Dusk | Golden tone, long shadows, sky gradient | golden glow of dusk, golden hour |
| Night (moonlight) | Cool blue tone, quiet and cool | clear moonlight, moonlight |
| Night (lamplight) | Warm yellow accents, light-dark contrast | scattered lamplight, lamplight atmosphere |

### Time-of-day derivation specification

| Derived from the base time of day | Stays unchanged | What changes |
|---|---|---|
| Day → dusk | Building/layout/material | Sky tone warms up, shadows lengthen |
| Day → night | Building/layout/material | Everything darkens, lamplight/moonlight atmosphere added |
| Interior day → interior night | Spatial structure, furniture | Overall tone warms up, interior lighting added |

---

## 4. Weather variants

### Weather definitions

| Weather | Visual characteristics | Prompt |
|---|---|---|
| Clear | Bright, clear shadows | clear boundless sky, bright sunshine |
| Overcast | Even light, no hard shadows | soft overcast light, overcast |
| Thin mist | Reduced visibility, hazy air | thin mist spreading, mist curling |
| Drizzle | Droplets, wet reflections, rain threads | drizzle fine as silk, a light veil of rain |
| Snowfall | White cover, snowflakes falling | snow flying thick, wrapped in silver white |

### Weather derivation specification

| Derived from the base weather | Stays unchanged | What changes |
|---|---|---|
| Clear → thin mist | Building/layout | Mist layer added, distance blurred, saturation lowered |
| Clear → drizzle | Building/layout | Rain threads added, ground reflections, tone goes cooler |
| Clear → snowfall | Building/layout | Lying snow added, snowflakes, tone goes whiter |
| Vegetation must adapt to the weather logic | — | Petals wet in the rain, bare branches frosted in the snow |

---

## 5. Angle variants

### Angle definitions

> The derived image can switch along the angle dimensions below relative to the reference image. The caller passes in the reference image + a target angle description; this file only defines the angle vocabulary and the consistency constraints.

| Angle | Description | Prompt |
|---|---|---|
| Front/front view | Compared with the reference image, the line of sight faces the front of the scene | `front view`, `eye level` |
| Side (left/right) | Level view 90° to the left/right of the scene | `left side view` / `right side view` |
| Back/rear view | 180° to the back of the scene | `back view` |
| High angle | Looking down from a high position, showing the overall layout | `high angle`, `bird's eye view` |
| Low angle | Looking up from a low position, emphasising a tall subject | `low angle`, `worm's eye view` |
| Closer push-in (近景推进) | Same direction, but the camera pushes in (镜头推进), focusing on a local area | `push-in`, `closer angle` |
| Free angle | Any angle description the caller defines | Injected as `{target angle}` |

### Angle derivation specification

| Item | Constraint |
|---|---|
| Consistency with the reference | Building structure/layout/material/tone/light/season/weather must match the reference image |
| Viewpoint | The same scene centre point, only the angle switches; the line-of-sight height may adjust with the angle |
| Lighting logic | The light-source direction of the reference image does not change; after the angle switches, the light-and-shadow cast direction must be recomputed to match (staying physically sound) |
| Layout | A single frame (not a montage, not multiple views, not a split screen) |
| People | **Any person, human shadow or human silhouette is strictly forbidden** |
| Aspect ratio | 16:9 by default (or as set by the caller) |

---

## 6. Prompt template

anime derived scene image, based on the reference image，
anime style，cel shading，modern urban style，
cinematic composition，dramatic low-key lighting，
ultra detailed，8K，high quality，
shallow depth of field，image grain，lens vignette，
cel-shaded animation style，cinema-level composition，dramatic low-key lighting，
scene derivative design sheet，environment concept art，no people，no characters，no human figures，
keep the scene's spatial structure consistent，
{target angle (if any)}，{shot-size viewpoint (if any)}，{time-of-day description (if any)}，{weather description (if any)}，
{foreground}，{midground}，{background}，
{color description}，{depth-of-field description (if any)}，{sky tone change (if any)}，{atmosphere adjustment (if any)}，
{weather visual characteristics (if any)}，{material surface change (if any)}，{vegetation adaptation description (if any)}，
modern marks of use on the materials，lived-in feel，natural wear，
natural light/artificial light、dramatic light-and-shadow，low-saturation cool tones，
aerial perspective，ultra-crisp texture detail，
single-frame composition，keep the building structure/material/tone/light consistent with the reference image, switching the viewpoint only by the target angle，
no people of any kind in the frame
no text of any kind in the image

> **Usage note**: judge for yourself from the information the user provides which change dimensions to apply (angle/shot size/time of day/weather); for dimensions not mentioned, simply leave the matching field empty and omit it. There is no need to generate a separate template for each variant.

---

## 7. Constraint rules

### Mandatory

| No. | Rule |
|---|---|
| R1 | The scene's spatial structure stays consistent across all variants |
| R2 | Time-of-day variants must adjust the sky tone and the atmosphere |
| R3 | Weather variants must adapt the vegetation/material surfaces |
| R4 | The derived image must be a "single frame"; stitching multiple views/grids/split screens is not allowed |
| R5 | The derived image must keep the building structure/material/tone/light consistent with the reference image, switching the viewpoint only by the specified angle |
| R6 | **Any person is strictly forbidden** in the scene image |
| R7 | Judge the change dimensions (angle/shot size/time of day/weather) yourself from the information the user provides; leave dimensions not mentioned empty and omit them |
| R8 | Must include the "anime style" keywords (anime style / cel shading) |
| R9 | Must include a depth-of-field characteristic (at least one of shallow depth of field / vignette), keeping the cel-shaded animation style |
| R10 | Materials must carry modern marks of use / a lived-in feel; a brand-new, flawless "3D-rendered look" is forbidden |

### Forbidden

| No. | Forbidden |
|---|---|
| X1 | Building structure/layout being inconsistent between variants |
| X2 | Weather contradicting the season (snowfall in summer and the like) |
| X3 | Material/style jumping between variants |
| X4 | Any person, human shadow, human silhouette or human outline appearing |
| X5 | The frame being stitched into a multi-view/grid/split-screen layout |
| X6 | 3D rendering/CG animation/game-engine texture (the words 3D render, CGI, Unreal Engine, Unity and the like are forbidden) |
| X7 | Materials that are too clean and perfect, with no marks of use or age at all (avoid a "plastic look") |
| X8 | Lighting that is too even and flat, with no depth-of-field blur and no lens optical characteristics |
