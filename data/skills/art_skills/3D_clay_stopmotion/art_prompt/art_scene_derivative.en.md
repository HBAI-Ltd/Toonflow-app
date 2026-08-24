# Stop-Motion Clay Scene Derivative Asset Generation · Constraint Manual

---

## 1. Derivation principles

1. **Spatial consistency** — architectural structure/layout/material stay consistent across all variants
2. **Driven by shot size** — the same scene serves different narrative functions through different shot sizes
3. **Time-of-day switching** — the same space shows a different warm-toned lighting atmosphere at different times of day
4. **Weather change** — the same space shows a different emotion under different weather
5. **Stop-motion as the anchor** — every variant must keep the stop-motion clay style

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
| Early morning | Warm soft light, tone leaning warm gold | faint morning light, early-morning warm tone |
| Midday | Bright, short shadows, vivid color | midday sun, bright light |
| Dusk | Warm golden tone, long shadows, sky gradient | golden warmth of dusk, golden hour |
| Night (moonlight) | Cool blue tone, quiet and cold | clear moonlight, moonlight |
| Night (lamplight) | Warm yellow accents, light-dark contrast | scattered lamplight, flickering candlelight |

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
| Clear | Bright, clear shadows | a boundless clear sky, brilliant sunshine |
| Overcast | Even light, no hard shadow | overcast soft light, overcast |
| Thin mist | Reduced visibility, hazy air | thin mist spreading, mist curling |
| Drizzle | Water beads, damp reflection, rain threads | drizzle like silk threads, a light veil of rain |
| Drifting snow | White cover, snowflakes falling | snow drifting down, everything dressed in silver |

### Weather derivation specification

| Derived from the base weather | Stays unchanged | What changes |
|---|---|---|
| Clear → thin mist | Building/layout | A mist layer added, the distance blurred, saturation lowered |
| Clear → drizzle | Building/layout | Rain threads added, ground reflection, tone leaning cool |
| Clear → drifting snow | Building/layout | Snow cover added, snowflakes, tone leaning white |
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
| Lighting logic | The light-source direction of the reference image does not change; after the angle switches, the direction of light and cast shadow must be recomputed to match (keeping the warm soft light) |
| Layout | A single frame (not a collage, not multi-view, not a split screen) |
| People | **Any person, human shadow or human silhouette is strictly forbidden** |
| Aspect ratio | 16:9 by default (or as set by the caller) |

---

## 6. Prompt template

```
stop-motion clay derivative scene image，based on the reference image，stop-motion animation style，3D cartoon render，warm-toned light and shadow，soft shallow depth of field，
claymation style，stop-motion aesthetic，warm lighting，shallow depth of field，bokeh，
scene derivative design sheet，environment concept art，no people，no characters，no human figures，
keep the spatial structure of the scene consistent，
{target angle (if any)}，{shot-size viewpoint (if any)}，{time-of-day description (if any)}，{weather description (if any)}，
{foreground}，{midground}，{background}，
{tone description}，{depth-of-field description (if any)}，{sky tone change (if any)}，{atmosphere adjustment (if any)}，
{weather visual character (if any)}，{material surface change (if any)}，{vegetation adaptation description (if any)}，
natural marks of wear on materials，patina of years，moss and weathering，fabric falling in natural folds，
diffused warm soft light，volumetric light，warm-toned light flecks，shallow depth-of-field blur，
atmospheric perspective，ultra-clear grain detail，
single-frame composition，keeping the architectural structure/material/tone/light consistent with the reference image, switching the viewpoint only per the target angle，
no person of any kind in frame
no text of any kind in the image
```

---

## 7. Constraint rules

### Mandatory

| No. | Rule |
|---|---|
| R1 | The scene's spatial structure stays consistent across all variants |
| R2 | A time-of-day variant must adjust the sky tone and the atmosphere |
| R3 | A weather variant must adapt the vegetation/material surface |
| R4 | The derived image must be a "single frame"; stitching multiple views/grids/split screens is not allowed |
| R5 | The derived image must keep the architectural structure/material/tone/light consistent with the reference image, switching the viewpoint only per the specified angle |
| R6 | **Any person in the scene image is strictly forbidden** |
| R7 | Judge which dimensions change (angle/shot size/time of day/weather) from the information the user provides; leave out any dimension not mentioned |
| R8 | Must contain the stop-motion animation keywords (claymation / stop-motion) |
| R9 | Must contain the shallow depth-of-field keywords (shallow depth of field / bokeh) |
| R10 | Must specify "warm soft light" |
| R11 | Materials must carry natural wear/marks of age |

### Forbidden

| No. | Forbidden |
|---|---|
| X1 | Architectural structure/layout inconsistent between variants |
| X2 | Weather contradicting the season |
| X3 | An abrupt change of material/style between variants |
| X4 | Any person, human shadow or human silhouette appearing |
| X5 | The frame being stitched into a multi-view/grid/split-screen layout |
| X6 | Live-action photographic realism/3D render/CG-animation texture |
| X7 | Material too clean and perfect, with no marks of use at all |
| X8 | Cold hard light/strong contrast/hard shadow |
