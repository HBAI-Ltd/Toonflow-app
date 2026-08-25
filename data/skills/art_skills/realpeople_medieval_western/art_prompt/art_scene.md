# Scene Image Generation · Medieval Epic Constraint Manual

---

## 1. Scene aesthetic principles

1. **Space as narrative** — scenes carry emotion and story function, never a mere backdrop
2. **Layered depth** — every scene must have foreground / midground / background; no flatness
3. **Texture supreme** — stone / timber / iron / thatch / cloth textures must be ultra-clear
4. **Photography as anchor** — every frame held to real cinematography; refuse 3D-render / CG feel; pursue lens optics (depth-of-field falloff, natural vignette, subtle chromatic traces) and physical light (window shafts, fire glow, overcast diffusion, volumetric haze)
5. **Weather is a character** — fog, rain, snow, mud, and cold breath are constants of this world
6. **Secular world only** — no churches, chapels, shrines, or religious architecture of any kind

---

## 2. Season and tone mapping

| Season | Dominant tone | Support tone | Prompt |
|---|---|---|---|
| Spring | Wet green + grey sky | Moss, cold streams | wet spring green, grey sky |
| Summer | Deep green + warm dust | Golden fields, haze | high summer fields, warm haze |
| Autumn | Rust + amber | Bare branches, smoke | rust and amber autumn, wood smoke |
| Winter | Bone white + steel blue | Frozen mud, black trees | bone-white winter, steel-blue light |

---

## 3. Interior scenes

### Spatial specification

| Dimension | Constraint | Prompt |
|---|---|---|
| Style | Hunters' guild hall / castle chamber / tavern / forge / dungeon cell / stable / war tent | medieval {type} interior |
| Material | Rough stone, timber beams, iron fittings, straw, wool hangings, tallow candles | rough stone walls, smoke-darkened beams |
| Tone | Palette C1–C8; cold stone base with fire warmth pooling | cold stone, pooled firelight |
| Depth | Foreground / midground / background layers | foreground {element}, midground {element}, background {element} |
| Texture | Stone tooling marks, wood grain, soot, wax drips identifiable | tooling marks, soot stains, wax drips |
| Light | Motivated: high windows, hearth, candles, torches; shafts and volumetric haze | window light shafts, hearth glow, candle pools |
| Lens feel | Shallow depth of field, natural vignette, warm-cold split | shallow depth of field, lens vignette |
| Lived-in | Scarred tables, straw on flagstones, hung game, tally marks | scarred tabletops, straw on flagstones |

### Interior type quick table

| Type | Core elements | Atmosphere words |
|---|---|---|
| Guild great hall | High seat, long tables, trophy antlers, guild banners, hearth | power, judgment, smoke and firelight |
| Castle chamber | Curtained bed, writing desk, narrow window, furs | private, cold stone softened by fur |
| Tavern | Low beams, tankards, fiddle corner, crowded benches | warm, loud, working-folk refuge |
| Forge | Anvil, coals, hanging tools, quench barrel | ember light, labor, iron ring |
| Dungeon cell | Wet stone, iron bars, high slit window, straw | despair, single cold light shaft |
| War tent | Map table, camp cots, banners, lantern | strategy, canvas glow, fatigue |

---

## 4. Exterior scenes

### Spatial specification

| Dimension | Constraint | Prompt |
|---|---|---|
| Types | Castle walls / moorland / old forest / mountain pass / village / river ford / quiet battlefield aftermath | {scene}, {season}, {time} |
| Weather | Overcast / fog / drizzle / snow / rare hard sun | rolling fog, thin drizzle |
| Vegetation | Heather, gorse, ancient oaks, pines, bare winter branches (seasonal logic) | wind-bent heather, ancient oaks |
| Water | Cold rivers, fords, rain pools with sky reflection | cold river ford, sky-reflecting pools |
| Structures | Timber-frame, dry-stone walls, palisades, watchtowers — medieval European construction only | timber-frame houses, dry-stone walls |
| Air | Aerial perspective mandatory; distance turns grey-blue | aerial perspective, grey-blue distance |
| Light | Natural only: overcast diffusion, low sun shafts, moon | overcast diffusion, low sun through fog |
| Lens feel | Shallow depth of field where intimate, deep focus for scale; vignette, subtle flare in fog | deep focus, natural vignette |
| Lived-in | Mud roads, wheel ruts, patched thatch, leaning fences | mud roads, wheel ruts, patched thatch |

### Exterior type quick table

| Type | Core elements | Atmosphere words |
|---|---|---|
| Castle walls | Battlements, banners, brazier smoke | watchful, wind-torn banners |
| Moorland | Heather, standing stones (weathered, non-religious), fog | vast, desolate, exposed |
| Old forest | Moss, root tangles, canopy gloom, shafted light | ancient, sheltering, watchful |
| Mountain pass | Scree, snow line, narrow trail | peril, thin cold air |
| Village | Thatch, mud lanes, market stalls, well | humble, smoke and livestock |
| Aftermath field | Torn banners, broken shields, crows, grey snow, smoke — **no bodies, no blood** | silent, mourning, wind |

---

## 5. Hero view specification

### View definition

> Single-frame hero view, shot from the scene's most characteristic angle, carrying spatial narrative and compositional weight.

| Item | Constraint | Prompt |
|---|---|---|
| Angle | Natural observing angle that best shows subject and depth | hero shot, representative angle |
| Eye height | Default human eye level; high/low allowed for special scenes | eye level (default) |
| Composition | Subject centered or rule-of-thirds; clear F/M/B layers | balanced composition |

### Frame specification

| Item | Constraint |
|---|---|
| Layout | Single frame (no grids, splits, or multi-views) |
| People | **No people, silhouettes, or human outlines whatsoever** |
| Consistency | Style / material / tone / light unified |
| Light | Single light logic, consistent shadow direction |
| Ratio | Default 16:9 (or per caller) |

---

## 6. Prompt template

```
medieval epic scene hero view concept,
real photography, photorealistic, shot on ARRI Alexa, 35mm film grain,
RAW photo, ultra realistic, hyper detailed,
shallow depth of field, natural lens vignette, subtle chromatic aberration,
real photographic texture, film grain, motivated natural light, physical light and shadow,
scene design sheet, environment concept art, no people, no characters, no human figures,
{interior/exterior}, {scene type}, {season + time},
foreground: {element}, midground: {element}, background: {element},
{tone description}, {weather/atmosphere element},
{material description}, aerial perspective, texture detail ultra-clear,
weathered materials, moss and soot, wheel ruts and worn thresholds,
window or fire light shafts, volumetric haze, overcast diffusion,
single-frame composition, natural observing angle, composition shows subject and F/M/B depth,
no people anywhere in frame,
no churches, no religious buildings or symbols,
no text anywhere in the image
```

---

## 7. Constraint rules

### Mandatory

| No. | Rule |
|---|---|
| R1 | Scene must have "foreground/midground/background layers" |
| R2 | Exteriors must include "aerial perspective" |
| R3 | Scene image must be a "single-frame hero view" — no grids / splits / multi-views |
| R4 | Composition must represent the subject and show F/M/B depth |
| R5 | **No people whatsoever** in scene images |
| R6 | Must include photography anchors (real photography / photorealistic / RAW photo) |
| R7 | Must include lens optics (shallow depth of field / lens vignette / natural flare — at least one) |
| R8 | Materials must show weather and use; no pristine "CG feel" |
| R9 | Aftermath scenes speak through metaphor only: torn banners, broken shields, crows — no bodies, no blood (S5) |

### Strictly forbidden

| No. | Forbidden |
|---|---|
| X1 | Pure white / pure black / empty background |
| X2 | Extreme weather (storm / lightning / blizzard) unless the story requires |
| X3 | Flat scenes without depth |
| X4 | Vegetation / weather contradicting the season |
| X5 | Any person, shadow figure, or human outline |
| X6 | Multi-view / grid / split layouts |
| X7 | 3D render / CG / cartoon / game-engine texture (ban the words 3D render, CGI, Unreal Engine, Unity) |
| X8 | Pristine, untouched materials with no age (plastic feel) |
| X9 | Flat even light with no depth or optics |
| X10 | Churches, chapels, shrines, crosses, or any religious architecture and symbols |
| X11 | Modern elements (vehicles, wires, pavement, signage) |
| X12 | East Asian architecture or garden elements |
| X13 | Bodies, blood, or gore in aftermath scenes |
