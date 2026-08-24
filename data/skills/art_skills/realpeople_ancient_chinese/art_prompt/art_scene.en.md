# Scene Image Generation · Constraint Manual

---

## 1. Scene aesthetic principles

1. **Spatial narrative** — the scene carries emotional and narrative function; it is not a plain backdrop
2. **Layered depth** — every scene must have a foreground/middle ground/background; flatness is ruled out
3. **Texture above all** — the material texture of wood grain/stone/fabric/water and the like must be ultra-crisp
4. **Anchored on live photography** — every frame takes real photography as the standard and rejects 3D-rendered/CG-animation texture; pursue optical lens characteristics (depth-of-field blur, lens vignette, faint chromatic aberration) and physical lighting (natural diffused light, caustics, volumetric light)

---

## 2. Seasonal tonal mapping

| Season | Main tone | Secondary tone | Prompt |
|---|---|---|---|
| Spring | Verdant green + peach pink | Moon white, goose yellow | verdant spring green、peach blossoms ablaze |
| Summer | Emerald green + lotus pink | Sky cyan, lotus white | summer lotus emerald green、dense shade blocking the sun |
| Autumn | Crimson red + golden yellow | Amber, dusk gray | autumn maple crimson、golden leaves drifting down |
| Winter | Plain white + frost silver | Ink-jade black, ice blue | winter snow plain white、bare branches hung with frost |

---

## 3. Interior scenes

### Space specification

| Dimension | Constraint | Prompt |
|---|---|---|
| Style | Ancient residence/palace/study/boudoir, Wei-Jin through Tang-Song | ancient {dynasty} style |
| Material | Mainly wood, with stone/jade/silk/gauze as secondary | sandalwood furniture、jade screen、silk gauze drapes |
| Tonality | Low-saturation warm wood + moon white gauze drapes + celadon | warm wood tonality、plain elegant furnishing |
| Depth | Foreground/middle ground/background layering | foreground {element}、middle ground {element}、background {element} |
| Texture | Wood grain/fabric drape/porcelain sheen identifiable | clear texture、realistic material feel |
| Lighting | Mainly natural sources (window light/candlelight), light diffused and soft, with visible light-beam particles and caustic projections | natural diffused light、candlelight flickering、light beams through the window、Tyndall effect |
| Lens feel | Shallow depth of field blurring fore and back, slight lens vignette, natural color-temperature shift | shallow depth of field、lens vignette、natural color cast |
| Imperfection | Use marks on wood surfaces, weathering patterns on stone, natural creases in fabric | marks of time、natural wear、fabric falling in natural folds |

### Interior type quick lookup

| Type | Core elements | Atmosphere words |
|---|---|---|
| Boudoir/bedchamber | Gauze canopy, dressing table, bronze mirror, vase | warm and private、gauze drapes hanging softly |
| Study/library | Bookshelves, scrolls, brush and ink, go board | quiet and refined、the scent of ink everywhere |
| Great hall/main hall | Tall columns, plaques, curtains, candlesticks | solemn and splendid、grand in bearing |
| Courtyard corridor | Corridor columns, stone railings, flowers and trees, lanterns | a winding path to seclusion、lantern shadows flickering |
| Kitchen/dining hall | Stove, steamer baskets, tableware | the breath of cooking fires、warm everyday life |

---

## 4. Exterior scenes

### Space specification

| Dimension | Constraint | Prompt |
|---|---|---|
| Type | Courtyard/mountain forest/streamside/old bridge/market | {scene}，{season}，{time} |
| Weather | Clear/overcast/thin mist/fine rain/falling snow | thin mist spreading、fine rain like silk threads |
| Vegetation | Plum/bamboo/pine/peach blossom/willow/lotus (must match the season) | peach blossoms ablaze、green bamboo forming a grove |
| Water | Streams/lakes/waterfalls need light reflections | a babbling stream、the lake like a mirror |
| Architecture | Flying eaves and bracket sets, gray tiles and white walls, stone bridges and wooden pavilions | flying eaves with upturned corners、stone arch bridge |
| Sense of air | Aerial perspective is required; the distance turns grayer and bluer | far mountains like indigo、aerial perspective |
| Lighting | Natural light as the only source; sunlight/moonlight need volumetric light and scattering | natural lighting、volumetric light、god rays、Tyndall effect |
| Lens feel | Shallow depth-of-field blur, lens vignette, slight chromatic aberration, bokeh highlights | shallow depth of field、bokeh、lens flare、vignette |
| Imperfection | Moss/weathering on stone, splitting/patina on wood, chipped tiles/moss traces | mottled moss、traces of weathering、the patina of years |

### Exterior type quick lookup

| Type | Core elements | Atmosphere words |
|---|---|---|
| Courtyard garden | Rockery, pond, flowers and trees, stone path | flower shadows spreading、a winding path to seclusion |
| Mountain forest and bamboo sea | Ancient trees, bamboo grove, rocks, clouds and mist | ranges upon ranges、clouds and mist drifting |
| Streamside and lakeside | Stream, pebbles, weeping willows, lotus flowers | a babbling stream、willow shadows swaying |
| Old bridge and roadside pavilion | Stone arch bridge, pavilion, willow trees | pavilion on the old road、willows swaying tenderly |
| Market street | Wine banners, stalls, lanterns | a lively marketplace、the human world of cooking fires |
| Rooftop terrace | Tiles, flying eaves, night sky | drinking alone under the moon、a fresh breeze coming |

---

## 5. Main-view specification

### View definition

> A single-frame main view, shot from the most representative angle of the scene, carrying the spatial narrative and the compositional center of gravity.

| Item | Constraint | Prompt |
|---|---|---|
| Viewpoint | A natural observing viewpoint whose composition best shows the subject and depth of the scene | hero shot、representative angle |
| Eye height | Human eye level by default; special scenes may look down or up | eye level (default) |
| Composition | Subject centered or following the rule of thirds, with clear foreground/middle ground/background layering | balanced composition |

### Frame specification

| Item | Constraint |
|---|---|
| Layout | A single frame (not a collage, not multi-view, not split screen) |
| Characters | **Any character, human shadow or human silhouette is strictly forbidden** |
| Consistency | Style/material/tonality/light unified |
| Light | A single light-source logic, with consistent light direction |
| Frame ratio | 16:9 by default (or as set by the caller) |

---

## 6. Prompt template

```
Ancient-style scene main-view concept art，
real photography，photorealistic，shot on ARRI Alexa，35mm film grain，
RAW photo，ultra realistic，hyper detailed，
shallow depth of field，natural lens vignette，subtle chromatic aberration，bokeh，
real photographic texture，film grain feel，natural lighting，physically based light and shadow，
scene design sheet，environment concept art，no people，no characters，no human figures，
{interior/exterior}，{scene type}，{dynasty style}，{season+time}，
foreground: {element}，middle ground: {element}，background: {element}，
{tonal description}，{weather/atmosphere elements}，
{material description}，aerial perspective，ultra-crisp texture detail，
natural wear marks on the materials，the patina of years，moss and weathering，fabric falling in natural folds，
natural diffused light，volumetric light，Tyndall effect，caustic projections，
single-frame composition，natural observing viewpoint，a composition that represents the subject of the scene and shows the foreground/middle ground/background layering，
no character of any kind in the frame
no text of any kind in the image
```

---

## 7. Constraint rules

### Mandatory

| No. | Rule |
|---|---|
| R1 | The scene must have "foreground, middle ground and background layering" |
| R2 | Exteriors must contain "aerial perspective" |
| R3 | The scene image must be a "single-frame main view"; stitching multiple views/split screens/grids is not allowed |
| R4 | The composition must represent the subject of the scene and show the foreground/middle ground/background layering |
| R5 | **Any character is strictly forbidden** in a scene image |
| R6 | Must contain live-photography keywords (real photography / photorealistic / RAW photo) |
| R7 | Must contain optical lens characteristics (at least one of shallow depth of field / lens vignette / bokeh) |
| R8 | Materials must carry natural wear/marks of time; a brand-new flawless "CG feel" is forbidden |

### Strictly forbidden

| No. | Forbidden |
|---|---|
| X1 | A pure white/pure black background or no scene at all |
| X2 | Extreme weather (storm/lightning/blizzard, unless the plot requires it) |
| X3 | A scene with no depth/no layering |
| X4 | Vegetation/weather contradicting the season |
| X5 | Any character, human shadow, human silhouette or human outline appearing |
| X6 | The frame being stitched into a multi-view/grid/split-screen layout |
| X7 | 3D-rendered/CG-animation/cartoon/game-engine texture (words such as 3D render, CGI, Unreal Engine, Unity are forbidden) |
| X8 | Materials too clean and perfect, with no trace of use or age (avoid the "plastic feel") |
| X9 | Lighting too even and flat, with no depth-of-field blur and no optical lens characteristics |
