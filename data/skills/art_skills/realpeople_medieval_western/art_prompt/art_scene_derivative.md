# Scene Derivative Asset Generation · Medieval Epic Constraint Manual

---

## 1. Derivative principles

1. **Spatial consistency** — structure / layout / materials constant across all variants
2. **Shot-scale driven** — one scene serves different narrative functions through different scales
3. **Time-of-day switching** — one space, different light moods across the day
4. **Weather variation** — one space, different emotions under different weather
5. **Photography anchored** — every variant keeps real photographic texture; refuse 3D/CG feel; keep lens optics and physical light

---

## 2. Shot-scale variants

### Scale definitions

| Scale | Range | Narrative function | Prompt |
|---|---|---|---|
| Extreme wide | Full scene + surroundings | Establish space, scale of the world | extreme wide shot |
| Wide | Scene complete | Show spatial structure | wide shot |
| Medium | Local area | Focus a functional zone | medium shot |
| Close | Scene detail | Material / atmosphere prop feature | close shot |
| Extreme close-up | Micro detail | Texture / key object | extreme closeup |

### Scale derivation rules

| From base | Keep unchanged | May change |
|---|---|---|
| Extreme wide → wide | Structures, overall layout | Angle narrows, foreground grows |
| Wide → medium | Material, tone, light | Crop focus, depth shift |
| Medium → close | Material, tone | Shallow depth, background melt |
| Close → extreme close-up | Material texture | Ultra-shallow, macro feel |

---

## 3. Time-of-day variants

### Time definitions

| Time | Visual character | Prompt |
|---|---|---|
| Dawn | Mist, cold-warm split, long soft shadows | dawn mist, first light |
| Midday overcast | Even grey diffusion, honest textures | overcast midday, flat grey light |
| Dusk | Ember sky, cooling stone, torch-lighting hour | ember dusk, torches being lit |
| Night (moon) | Steel-blue stillness, silver edges | moonlit night, steel-blue stillness |
| Night (fire) | Torch pools, hearth glow, black beyond | torchlit night, firelight pools |

### Time derivation rules

| From base | Keep unchanged | Change |
|---|---|---|
| Day → dusk | Structures / layout / material | Sky embers, shadows stretch, torches appear |
| Day → night | Structures / layout / material | Darkness, fire or moon becomes source |
| Interior day → interior night | Structure, furnishings | Warm candle pools, black windows |

---

## 4. Weather variants

### Weather definitions

| Weather | Visual character | Prompt |
|---|---|---|
| Overcast | Even diffusion, no hard shadow | overcast, soft diffusion |
| Fog | Distance swallowed, shapes loom | rolling fog, swallowed distance |
| Drizzle | Wet stone sheen, drip lines, grey air | thin drizzle, wet stone sheen |
| Snow | White blanket, muffled stillness, breath fog | falling snow, muffled stillness |
| Rare hard sun | Long shadows, honest wear revealed | rare hard sun, long shadows |

### Weather derivation rules

| From base | Keep unchanged | Change |
|---|---|---|
| Overcast → fog | Structures / layout | Fog layer, distance melts, saturation drops |
| Overcast → drizzle | Structures / layout | Rain lines, ground sheen, colder tone |
| Overcast → snow | Structures / layout | Snow cover, flakes, whiter tone |
| Vegetation adapts to weather | — | Wet heather, frost on branches |

---

## 5. Angle variants

### Angle definitions

> The derivative may switch angle relative to the reference. The caller passes reference + target angle; this file defines vocabulary and consistency constraints only.

| Angle | Description | Prompt |
|---|---|---|
| Front | Toward the scene's face | front view, eye level |
| Side (L/R) | 90° to left/right | left side view / right side view |
| Rear | 180° behind | back view |
| High | Overlooking layout — the fate's-gaze angle | high angle, bird's eye view |
| Low | Emphasizing walls and towers | low angle, worm's eye view |
| Push-in | Same direction, closer, local focus | push-in, closer angle |
| Free | Caller-defined angle | per {target angle} |

### Angle derivation rules

| Item | Constraint |
|---|---|
| Reference consistency | Structure / layout / material / tone / light / season / weather match the reference |
| Viewpoint | Same scene center, angle only; eye height may follow the angle |
| Light logic | Source direction unchanged; shadows recomputed physically for the new angle |
| Layout | Single frame (no grids / splits) |
| People | **No people or human outlines whatsoever** |
| Ratio | Default 16:9 (or per caller) |

---

## 6. Prompt template

```
medieval epic derivative scene, based on the reference image,
real photography, photorealistic, shot on ARRI Alexa, 35mm film grain,
RAW photo, ultra realistic, hyper detailed,
shallow depth of field, natural lens vignette, subtle chromatic aberration,
real photographic texture, film grain, motivated natural light, physical light and shadow,
scene derivative design sheet, environment concept art, no people, no characters, no human figures,
keep scene spatial structure consistent,
{target angle (if any)}, {shot scale (if any)}, {time description (if any)}, {weather description (if any)},
{foreground}, {midground}, {background},
{tone description}, {depth description (if any)}, {sky change (if any)}, {atmosphere adjustment (if any)},
{weather visual character (if any)}, {material surface change (if any)}, {vegetation adaptation (if any)},
weathered materials, moss and soot, wheel ruts and worn thresholds,
motivated light shafts, volumetric haze, aerial perspective, texture detail ultra-clear,
single-frame composition, consistent with reference structure/material/tone/light, viewpoint switched only per target angle,
no people anywhere in frame,
no churches, no religious buildings or symbols,
no text anywhere in the image
```

> **Usage note**: judge which dimensions to vary (angle / scale / time / weather) from the user's input; omit fields for unmentioned dimensions. No separate template per variant.

---

## 7. Constraint rules

### Mandatory

| No. | Rule |
|---|---|
| R1 | Spatial structure constant across variants |
| R2 | Time variants must adjust sky tone and atmosphere |
| R3 | Weather variants must adapt vegetation / material surfaces |
| R4 | Derivative must be "single frame" — no grids / splits |
| R5 | Derivative matches reference structure / material / tone / light; viewpoint switches per target angle only |
| R6 | **No people whatsoever** |
| R7 | Judge variation dimensions from user input; omit unmentioned dimensions |
| R8 | Must include photography anchors (real photography / photorealistic / RAW photo) |
| R9 | Must include lens optics (shallow depth of field / vignette / natural flare — at least one) |
| R10 | Materials must show weather and use; no pristine "CG feel" |

### Strictly forbidden

| No. | Forbidden |
|---|---|
| X1 | Structure / layout inconsistency across variants |
| X2 | Weather contradicting the season (summer snow etc.) |
| X3 | Material / style jumps across variants |
| X4 | Any person, shadow figure, or human outline |
| X5 | Multi-view / grid / split layouts |
| X6 | 3D render / CG / cartoon / game-engine texture (ban the words) |
| X7 | Pristine materials with no age (plastic feel) |
| X8 | Flat even light, no depth, no optics |
| X9 | Religious buildings or symbols appearing in any variant |
| X10 | Modern elements; East Asian architecture |
| X11 | Bodies, blood, or gore |
