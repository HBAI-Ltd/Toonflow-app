# Scene Image Generation · Flat Style Constraint Manual

---

## 1. Scene aesthetic principles

1. **Spatial narrative** — the scene carries emotional and narrative function; it is not a plain backdrop
2. **Flat layering** — foreground/midground/background are separated by color blocks, with no perspective depth
3. **Color blocks above all** — every scene must be expressed through color blocks; gradient/light-and-shadow is refused
4. **Flat as the anchor** — every frame takes flat vector illustration as the standard and refuses 3D-render/CG-animation texture; aim for clean lines and solid-color fill

---

## 2. Seasonal color mapping

| Season | Main tone | Secondary tone | Prompt |
|---|---|---|---|
| Spring | Verdant green + peach pink | Moon white, goose yellow | flat spring colors, green and peach pink |
| Summer | Emerald green + lotus pink | Sky cyan, lotus white | flat summer lotus, emerald and lotus pink |
| Autumn | Crimson + golden yellow | Amber, dusk gray | flat autumn maple, crimson and gold |
| Winter | Plain white + frost silver | Ink-jade black, ice blue | flat winter snow, plain white and frost silver |

---

## 3. Interior scenes

### Space specification

| Dimension | Constraint | Prompt |
|---|---|---|
| Style | Ancient mansion/palace/study/lady's chamber, Wei-Jin through Tang-Song | ancient {dynasty} style, flat ancient style |
| Material | Solid color blocks, line-drawn | flat sandalwood, flat jade, flat silk gauze |
| Tone | Low-saturation solid color blocks | flat warm tone, flat and plain |
| Depth | Foreground/midground/background separated by color blocks | foreground {color block}, midground {color block}, background {color block} |
| Texture | No texture, solid-color fill | no texture, flat texture feel, flat texture |
| Lighting | No lighting, purely flat-filled color blocks | no light-and-shadow, flat lighting, no lighting |
| Lens feel | No depth-of-field blur, purely flat | no depth of field, flat viewpoint, no depth |
| Imperfection | No imperfection, solid color and perfect | no wear, flat and perfect, no wear |

### Interior type quick reference

| Type | Core elements | Atmosphere words |
|---|---|---|
| Lady's chamber/bedroom | Gauze canopy, dressing table, bronze mirror, vase | flat and cosy, minimalist and private |
| Study/library | Bookshelf, scrolls, brush and ink, go board | flat and quiet, minimalist and refined |
| Great hall/main hall | Tall columns, plaque, drapery, candlestick | flat and solemn, minimalist and splendid |
| Courtyard corridor | Corridor columns, stone railing, plants, lantern | flat winding path, minimalist lantern light |
| Kitchen/dining hall | Stove, steamer, tableware | flat hearth life, minimalist everyday |

---

## 4. Exterior scenes

### Space specification

| Dimension | Constraint | Prompt |
|---|---|---|
| Type | Courtyard/mountain forest/streamside/old bridge/market | {scene}, {season}, {time}, flat ancient style |
| Weather | Clear/overcast/thin mist/drizzle/falling snow | flat thin mist, flat drizzle |
| Vegetation | Plum/bamboo/pine/peach blossom/willow/lotus (must match the season) | flat peach blossom, flat green bamboo |
| Water | Stream/lake/waterfall must be rendered in solid color | flat stream, flat lake surface |
| Architecture | Flying eaves and bracket sets, gray tiles and white walls, stone bridges and wooden pavilions | flat flying eaves, flat stone bridge |
| Air feel | No atmospheric perspective, purely flat | no perspective, flat distant view, flat far |
| Lighting | No lighting, purely flat-filled color blocks | no lighting, flat daylight, no light |
| Lens feel | No depth-of-field blur, purely flat | no depth of field, flat viewpoint, no depth |
| Imperfection | No imperfection, solid color and perfect | no weathering, flat and perfect, no weathering |

### Exterior type quick reference

| Type | Core elements | Atmosphere words |
|---|---|---|
| Courtyard garden | Rockery, pond, plants, stone path | flat flower shadows, minimalist winding path |
| Mountain forest and bamboo sea | Old trees, bamboo grove, rocks, clouds and mist | flat layered peaks, minimalist clouds and mist |
| Streamside and lakeside | Stream, pebbles, weeping willow, lotus | flat stream water, minimalist weeping willow |
| Old bridge and long pavilion | Stone arch bridge, long pavilion, willow trees | flat old bridge, minimalist long pavilion |
| Market street | Wine banner, stalls, lanterns | flat street life, minimalist bustle |
| Rooftop terrace | Roof tiles, flying eaves, night sky | flat roof tiles, minimalist night sky |

---

## 5. Main view specification

### View definition

> A single-frame main view, shot from the most representative angle of the scene, carrying the spatial narrative and the compositional centre of gravity.

| Item | Constraint | Prompt |
|---|---|---|
| Viewpoint | A natural observing viewpoint whose composition best shows the scene's subject and its color-block layering | hero shot, representative angle |
| Eye height | Human eye level by default; special scenes may look down or up | eye level (default) |
| Composition | Subject centred or following the rule of thirds; foreground/midground/background color-block layering is clear | balanced composition |

### Frame specification

| Item | Constraint |
|---|---|
| Layout | A single frame (not a collage, not multi-view, not a split screen) |
| People | **Any person, human shadow or human silhouette is strictly forbidden** |
| Consistency | Style/material/tone unified |
| Light | No lighting, solid-color fill, no light-and-shadow logic |
| Aspect ratio | 1:1 by default (or as set by the caller) |

---

## 6. Prompt template

```
flat ancient-style scene main-view concept image，
2d flat design，vector art，flat illustration，
minimalist，clean lines，solid colors，
flat scene，environment design，no people，no characters，no human figures，
{interior/exterior}，{scene type}，{dynasty style}，{season + time}，
foreground: {color-block elements}，midground: {color-block elements}，background: {color-block elements}，
{tone description}，{weather/atmosphere elements}，
{material description}，no perspective，solid-color fill，
no marks of time，no wear，flat and perfect，
no lighting，no shadow，flat solid-color fill，
single-frame composition，a natural observing viewpoint，a composition that represents the scene's subject and shows the foreground/midground/background color-block layering，
no person of any kind in frame
no text of any kind in the image
```

---

## 7. Constraint rules

### Mandatory

| No. | Rule |
|---|---|
| R1 | The scene must have "foreground, midground and background color-block layering" |
| R2 | Exteriors must be a "flat distant view" with no atmospheric perspective |
| R3 | The scene image must be a "single-frame main view"; stitching multiple views/split screens is not allowed |
| R4 | The composition must represent the scene's subject and show the foreground/midground/background color-block layering |
| R5 | **Any person in the scene image is strictly forbidden** |
| R6 | Must specify the "flat style" keywords (2d flat design, vector art) |
| R7 | Must specify "no light-and-shadow, no gradient" |
| R8 | Material must be solid-color fill; complex texture/sense of age is forbidden |

### Forbidden

| No. | Forbidden |
|---|---|
| X1 | A pure white/pure black background, or no scene at all |
| X2 | Extreme weather (storm/lightning/blizzard, unless the plot requires it) |
| X3 | A scene with no layering/no color-block separation |
| X4 | Vegetation/weather contradicting the season |
| X5 | Any person, human shadow, human silhouette or human outline appearing |
| X6 | The frame being stitched into a multi-view/grid/split-screen layout |
| X7 | 3D-render/CG-animation/cartoon/game-engine texture (the words 3D render, CGI, Unreal Engine, Unity, etc. are banned) |
| X8 | Material too complex, color blocks poorly distinguished |
| X9 | Adding light-and-shadow/shadow/gradient/three-dimensionality effects |
