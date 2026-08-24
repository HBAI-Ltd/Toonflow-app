# Scene Derivative Asset Generation · Flat Style Constraint Manual

---

## 1. Derivation principles

1. **Spatial consistency** — architectural structure/layout/material stay consistent across all variants
2. **Driven by shot size** — the same scene serves different narrative functions through different shot sizes
3. **Time-of-day switching** — the same space shows different tonal color blocks at different times of day
4. **Weather change** — the same space shows a different color atmosphere under different weather
5. **Flat as the anchor** — every variant must keep the flat vector illustration texture and refuse 3D-render/CG-animation feel; keep clean lines and solid-color fill

---

## 2. Shot-size variants

### Shot-size definitions

| Shot size | Range | Narrative function | Prompt |
|---|---|---|---|
| Extreme wide shot (大全景) | The whole scene + the surrounding environment | Establish the space, orient the viewer | extreme wide shot、大全景、flat extreme wide |
| Wide shot (全景) | The scene presented complete | Show the spatial structure | wide shot、全景、flat wide |
| Medium shot (中景) | A local area of the scene | Focus on a functional area | medium shot、中景、flat medium |
| Medium close-up (近景) | A detail of the scene | Close-up (特写) of color blocks/atmosphere props | close shot、近景、flat close |
| Close-up (特写) | An extremely local detail | Color-block texture/key props | extreme closeup、特写、flat extreme close |

### Shot-size derivation specification

| Derived from the base image | Stays unchanged | May change |
|---|---|---|
| 大全景 → 全景 | Building exterior, overall layout | Viewpoint narrows, more color blocks in the foreground |
| 全景 → 中景 | Material, tone, light | Crop and focus, solid-color change |
| 中景 → 近景 | Material, tone | Solid-color focus, background color blocks |
| 近景 → 特写 | Color-block texture | Solid-color focus, macro color blocks |

---

## 3. Time-of-day variants

### Time-of-day definitions

| Time of day | Visual character | Prompt |
|---|---|---|
| Early morning | Flat tone, light color blocks | flat early morning, light morning colors |
| Midday | Flat and bright, solid color blocks | flat midday, solid-color brightness |
| Dusk | Flat gold, warm color blocks | flat dusk, warm golden glow |
| Night (moonlight) | Flat cool blue, dark color blocks | flat moonlight, cool blue moon color |
| Night (lamplight) | Flat warm yellow, dark background | flat lamplight, warm yellow on a dark ground |

### Time-of-day derivation specification

| Derived from the base time of day | Stays unchanged | What changes |
|---|---|---|
| Day → dusk | Building/layout/material | Sky color blocks warm up, shadow color blocks |
| Day → night | Building/layout/material | Overall color blocks darken, lamplight/moonlight color blocks added |
| Interior day → interior night | Spatial structure, furniture | Overall color blocks warm up, candlelight/lantern color blocks added |

---

## 4. Weather variants

### Weather definitions

| Weather | Visual character | Prompt |
|---|---|---|
| Clear | Flat and bright, solid color blocks | flat clear sky, solid-color sunny day |
| Overcast | Flat and even, gray color blocks | flat overcast, gray soft light |
| Thin mist | Flat and hazy, low-saturation color blocks | flat thin mist, hazy color blocks |
| Drizzle | Flat rain streaks, damp color blocks | flat drizzle, damp color blocks |
| Falling snow | Flat white, covering color blocks | flat falling snow, white cover |

### Weather derivation specification

| Derived from the base weather | Stays unchanged | What changes |
|---|---|---|
| Clear → thin mist | Building/layout | Add a flat fog layer, blur the distant color blocks, lower the saturation |
| Clear → drizzle | Building/layout | Add flat rain streaks, ground color blocks, tone turns cooler |
| Clear → falling snow | Building/layout | Add flat snow cover, snowflake color blocks, tone turns whiter |
| Vegetation must adapt to the weather logic | — | flat rain colors, flat snow colors |

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
| Reference consistency | Architectural structure/layout/material/tone/season/weather must match the reference image |
| Viewpoint | The same scene centre point, only the angle switches; eye height may adjust with the angle |
| Lighting logic | Keep the flat no-light-and-shadow logic, consistent with the reference image |
| Layout | A single frame (not a collage, not multi-view, not a split screen) |
| People | **Any person, human shadow or human silhouette is strictly forbidden** |
| Aspect ratio | 1:1 by default (or as set by the caller) |

---

## 6. Prompt template

```
flat ancient-style derived scene image，based on the reference image，
2d flat design，vector art，flat illustration，
minimalist，clean lines，solid colors，
flat scene derivative，environment concept art，no people，no characters，no human figures，
keep the scene's spatial structure consistent，
{target angle (if any)}，{shot-size viewpoint (if any)}，{time-of-day description (if any)}，{weather description (if any)}，
{foreground color blocks}，{midground color blocks}，{background color blocks}，
{tone description}，{color-block change (if any)}，{sky color-block change (if any)}，{atmosphere adjustment (if any)}，
{weather visual character (if any)}，{material color-block change (if any)}，{vegetation adaptation description (if any)}，
no marks of time，no wear，flat and perfect，
no lighting，no shadow，flat solid-color fill，
no perspective，solid-color fill，
single-frame composition，keep the architectural structure/material/tone consistent with the reference image，switch the viewpoint only per the target angle，
no person of any kind in frame
no text of any kind in the image
```

> **Usage note**: judge for yourself, from the information the user provides, which change dimensions to apply (angle/shot size/time of day/weather); for dimensions not mentioned, leave the corresponding field empty and omit it. There is no need to generate a separate template for each variant.

---

## 7. Constraint rules

### Mandatory

| No. | Rule |
|---|---|
| R1 | The scene's spatial structure stays consistent across all variants |
| R2 | A time-of-day variant must adjust the color-block tone and atmosphere |
| R3 | A weather variant must adapt the color blocks/material surfaces |
| R4 | The derived image must be a "single frame"; stitching multiple views/grids/split screens is not allowed |
| R5 | The derived image must keep the architectural structure/material/tone consistent with the reference image and switch the viewpoint only per the specified angle |
| R6 | **Any person in the scene image is strictly forbidden** |
| R7 | Judge the change dimensions yourself from the information the user provides (angle/shot size/time of day/weather); leave the dimensions not mentioned empty and omit them |
| R8 | Must specify the "flat style" keywords (2d flat design, vector art) |
| R9 | Must specify "no light-and-shadow, no gradient" |
| R10 | Material must be solid-color fill; complex texture/sense of age is forbidden |

### Forbidden

| No. | Forbidden |
|---|---|
| X1 | Architectural structure/layout inconsistent between variants |
| X2 | Weather contradicting the season (falling snow in summer, etc.) |
| X3 | An abrupt material/style shift between variants |
| X4 | Any person, human shadow, human silhouette or human outline appearing |
| X5 | The frame being stitched into a multi-view/grid/split-screen layout |
| X6 | 3D-render/CG-animation/cartoon/game-engine texture (the words 3D render, CGI, Unreal Engine, Unity, etc. are banned) |
| X7 | Material too complex, color blocks poorly distinguished |
| X8 | Adding light-and-shadow/shadow/gradient/three-dimensionality effects |
