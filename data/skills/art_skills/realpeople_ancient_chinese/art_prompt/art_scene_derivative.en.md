# Scene Derived Asset Generation · Constraint Manual

---

## 1. Derivation principles

1. **Consistent space** — the architectural structure/layout/materials stay consistent across all variants
2. **Driven by shot size** — the same scene serves different narrative functions through different shot sizes
3. **Time-of-day switching** — the same space shows a different lighting atmosphere at different times of day
4. **Weather change** — the same space carries a different emotion under different weather
5. **Anchored on live photography** — every variant must keep a real photographic texture and reject a 3D-rendered/CG-animation feel; keep the optical lens characteristics and physical lighting

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

| Time of day | Visual character | Prompt |
|---|---|---|
| Early morning | Thin mist and soft light, cool and warm tones interwoven | first light of dawn、thin morning mist |
| Midday | Bright, short shadows, vivid color | midday sun、bright light |
| Dusk | Golden tonality, long shadows, gradient sky | golden glow of dusk、golden hour |
| Night (moonlight) | Cool blue tonality, quiet and cold | clear radiance of the moon、moonlight |
| Night (lamplight) | Warm yellow accents, light-dark contrast | lamps thinning out、points of candlelight |

### Time-of-day derivation specification

| Derived from the base time of day | Stays unchanged | Changes |
|---|---|---|
| Daytime → dusk | Building/layout/material | Sky tonality warms, shadows lengthen |
| Daytime → night | Building/layout/material | Overall darkening, lamplight/moonlight atmosphere added |
| Interior daytime → interior night | Spatial structure, furniture | Overall tonality warms, candle-flame/lantern elements added |

---

## 4. Weather variants

### Weather definitions

| Weather | Visual character | Prompt |
|---|---|---|
| Clear | Bright, shadows crisp | clear sky for miles、bright sunshine |
| Overcast | Even light, no hard shadows | overcast soft light、overcast |
| Thin mist | Reduced visibility, hazy air | thin mist spreading、mist curling |
| Fine rain | Water beads, wet reflections, threads of rain | fine rain like silk threads、a veil of rain |
| Falling snow | White cover, snowflakes drifting down | snow flying thick、the world wrapped in silver |

### Weather derivation specification

| Derived from the base weather | Stays unchanged | Changes |
|---|---|---|
| Clear → thin mist | Building/layout | Mist layer added, distance blurred, saturation lowered |
| Clear → fine rain | Building/layout | Threads of rain added, ground reflections, tonality turns cooler |
| Clear → falling snow | Building/layout | Settled snow added, snowflakes, tonality turns whiter |
| Vegetation must adapt to the weather logic | — | Petals wet in the rain, bare branches hung with frost in the snow |

---

## 5. Angle variants

### Angle definitions

> The derived image may switch along the angle dimensions below relative to the reference image. The caller passes in the reference image + the target angle description; this file only defines the angle vocabulary and the consistency constraints.

| Angle | Description | Prompt |
|---|---|---|
| Front/front view | Compared with the reference image, the line of sight faces the front of the scene | front view、eye level |
| Side (left/right) | 90° eye-level view toward the left/right side of the scene | left side view / right side view |
| Back/rear view | 180° toward the back of the scene | back view |
| High angle | Looking down from a high position, showing the overall layout | high angle、bird's eye view |
| Low angle | Looking up from a low position, emphasizing a tall subject | low angle、worm's eye view |
| Closer push-in (近景推进) | Same direction but the camera pushes in (镜头推进), focusing on a part | push-in、closer angle |
| Free angle | Any angle description defined by the caller | injected as `{target angle}` |

### Angle derivation specification

| Item | Constraint |
|---|---|
| Reference consistency | Architectural structure/layout/material/tonality/light/season/weather must match the reference image |
| Viewpoint | The same scene center point, only the angle switches; the eye height may be adjusted with the angle |
| Lighting logic | The light-source direction of the reference image does not change; after the angle switch, the direction of light and shadow must be recomputed accordingly (staying physically sound) |
| Layout | A single frame (not a collage, not multi-view, not split screen) |
| Characters | **Any character, human shadow or human silhouette is strictly forbidden** |
| Frame ratio | 16:9 by default (or as set by the caller) |

---

## 6. Prompt template

```
Ancient-style derived scene image, based on the reference image，
real photography，photorealistic，shot on ARRI Alexa，35mm film grain，
RAW photo，ultra realistic，hyper detailed，
shallow depth of field，natural lens vignette，subtle chromatic aberration，bokeh，
real photographic texture，film grain feel，natural lighting，physically based light and shadow，
scene derivative design sheet，environment concept art，no people，no characters，no human figures，
keep the spatial structure of the scene consistent，
{target angle (if any)}，{shot-size viewpoint (if any)}，{time-of-day description (if any)}，{weather description (if any)}，
{foreground}，{middle ground}，{background}，
{tonal description}，{depth-of-field description (if any)}，{sky tonality change (if any)}，{atmosphere adjustment (if any)}，
{weather visual character (if any)}，{material surface change (if any)}，{vegetation adaptation description (if any)}，
natural wear marks on the materials，the patina of years，moss and weathering，fabric falling in natural folds，
natural diffused light，volumetric light，Tyndall effect，caustic projections，
aerial perspective，ultra-crisp texture detail，
single-frame composition，keeping the architectural structure/material/tonality/light consistent with the reference image, switching the viewpoint only by the target angle，
no character of any kind in the frame
no text of any kind in the image
```

> **Usage note**: judge for yourself from the information the user provides which change dimensions to apply (angle/shot size/time of day/weather); for dimensions not mentioned, leave the corresponding field empty and omit it. There is no need to generate a separate template for every variant.

---

## 7. Constraint rules

### Mandatory

| No. | Rule |
|---|---|
| R1 | The spatial structure of the scene stays consistent across all variants |
| R2 | A time-of-day variant must adjust the sky tonality and the atmosphere |
| R3 | A weather variant must adapt the vegetation/material surfaces |
| R4 | The derived image must be a "single frame"; stitching multiple views/grids/split screens is not allowed |
| R5 | The derived image must keep the architectural structure/material/tonality/light consistent with the reference image, switching the viewpoint only by the specified angle |
| R6 | **Any character is strictly forbidden** in a scene image |
| R7 | Judge the change dimensions (angle/shot size/time of day/weather) yourself from the information the user provides; leave dimensions not mentioned empty and omit them |
| R8 | Must contain live-photography keywords (real photography / photorealistic / RAW photo) |
| R9 | Must contain optical lens characteristics (at least one of shallow depth of field / lens vignette / bokeh) |
| R10 | Materials must carry natural wear/marks of time; a brand-new flawless "CG feel" is forbidden |

### Strictly forbidden

| No. | Forbidden |
|---|---|
| X1 | Architectural structure/layout inconsistent between variants |
| X2 | Weather contradicting the season (snow in summer and the like) |
| X3 | Material/style jumping abruptly between variants |
| X4 | Any character, human shadow, human silhouette or human outline appearing |
| X5 | The frame being stitched into a multi-view/grid/split-screen layout |
| X6 | 3D-rendered/CG-animation/cartoon/game-engine texture (words such as 3D render, CGI, Unreal Engine, Unity are forbidden) |
| X7 | Materials too clean and perfect, with no trace of use or age (avoid the "plastic feel") |
| X8 | Lighting too even and flat, with no depth-of-field blur and no optical lens characteristics |
