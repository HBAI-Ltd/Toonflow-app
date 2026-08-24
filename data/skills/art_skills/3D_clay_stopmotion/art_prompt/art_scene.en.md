# Stop-Motion Clay Scene Image Generation · Constraint Manual

---

## 1. Scene aesthetic principles

1. **Spatial narrative** — the scene carries emotional and narrative function
2. **Layered depth** — every scene must have a foreground/midground/background; flatness is ruled out
3. **Clay texture above all** — the material's grain must be clearly identifiable (wood/stone/fabric/water surface)
4. **Stop-motion as the anchor** — every frame takes the stop-motion clay style as its standard and refuses live-action realism; pursue the characteristics of stop-motion photography (depth-of-field blur, lens flecks, stop-motion graininess) together with warm-toned light and shadow

---

## 2. Season-to-tone mapping

| Season | Main tone | Secondary tone | Prompt |
|---|---|---|---|
| Spring | Warm green + peach pink | Off-white, goose yellow | spring warm green, peach-blossom pink |
| Summer | Emerald green + lotus pink | Sky cyan, lotus white | summer lotus emerald, warm feel of deep shade |
| Autumn | Warm red + golden yellow | Orange-yellow, warm gray | autumn maple warm red, golden leaves in warm sun |
| Winter | Soft white + frost gray | Warm wood color, ice blue | soft winter snow, warm-toned bare branches |

---

## 3. Interior scenes

### Space specification

| Dimension | Constraint | Prompt |
|---|---|---|
| Style | Ancient mansion/palace/study/lady's chamber, cozy and retro | ancient {dynasty} style, cozy and retro |
| Material | Clay-sculpted wood dominant, stone/jade/silk/gauze secondary | clay wooden furniture, jade stone screen |
| Tone | Low-saturation warm wood + off-white gauze drapes + celadon | warm wood tone, cozy furnishings |
| Depth | Foreground/midground/background layering | foreground {element}, midground {element}, background {element} |
| Texture | Wood grain/fabric drape/porcelain sheen distinguishable | clear grain, clay texture |
| Lighting | Warm soft light dominant (window light/candlelight), light diffused | diffused warm light, cozy candlelight |
| Lens feel | Soft shallow depth-of-field blur, natural light flecks, stop-motion graininess | shallow depth of field, bokeh, stop-motion feel |
| Imperfection | Wooden surfaces show use, stone surfaces show weathering, fabric has natural folds | marks of age, natural wear, fabric falling in natural folds |

### Interior type quick reference

| Type | Core elements | Atmosphere words |
|---|---|---|
| Lady's chamber/bedroom | Gauze bed curtains, dressing table, bronze mirror, vase | cozy and private, gauze drapes hanging lightly |
| Study | Bookshelves, scrolls, brush and ink, go board | quiet and refined, the scent of ink everywhere |
| Great hall/main hall | Tall columns, inscribed plaque, curtains, candlestick | solemn and ornate, grand in scale |
| Courtyard corridor | Corridor pillars, stone railing, flowering plants, lanterns | a winding path to a quiet place, lantern shadows swaying |
| Kitchen/dining hall | Stove, steamer baskets, tableware | the breath of cooking fires, cozy everyday life |

---

## 4. Exterior scenes

### Space specification

| Dimension | Constraint | Prompt |
|---|---|---|
| Type | Courtyard/mountain forest/streamside/old bridge/market | {scene}, {season}, {time} |
| Weather | Clear/overcast/thin mist/drizzle/drifting snow | thin mist spreading, drizzle like silk threads |
| Vegetation | Plum/bamboo/pine/peach blossom/willow/lotus (must match the season) | peach blossoms in full bloom, emerald bamboo forming a grove |
| Water | Stream/lake/waterfall must have light-and-shadow reflection | a stream babbling, the lake like a mirror |
| Architecture | Flying eaves and bracket sets, gray tiles and white walls, stone bridges and wooden pavilions | upturned flying eaves, stone arch bridge |
| Sense of air | Atmospheric perspective is mandatory, the distance leaning warm gray | distant mountains like dark eyebrows, atmospheric perspective |
| Lighting | Warm natural light is the only light source; sunlight/moonlight must have volumetric light | diffused warm light, volumetric light, warm-toned light flecks |
| Lens feel | Soft shallow depth-of-field blur, bokeh flecks, stop-motion feel | shallow depth of field, bokeh, stop-motion feel |
| Imperfection | Moss/weathering on stone, splitting/patina on wood, broken tiles | mottled moss, weathering marks, patina of years |

### Exterior type quick reference

| Type | Core elements | Atmosphere words |
|---|---|---|
| Courtyard garden | Rockery, pond, flowering plants, stone path | flower shadows scattered, a winding path to a quiet place |
| Mountain forest and bamboo sea | Ancient trees, bamboo grove, mountain rocks, cloud and mist | ranges upon ranges, clouds and mist drifting |
| Streamside and lakeside | Stream, pebbles, weeping willow, lotus | a stream babbling, willow shadows swaying |
| Old bridge and wayside pavilion | Stone arch bridge, wayside pavilion, willow trees | wayside pavilion on the old road, willows swaying tenderly |
| Market street | Tavern banner, stalls, lanterns | a lively marketplace, the human world of cooking fires |
| Rooftop terrace | Roof tiles, flying eaves, night sky | drinking alone under the moon, a cool breeze coming slowly |

---

## 5. Main view specification

### View definition

> A single-frame main view, shot from the most representative angle of the scene, carrying the spatial narrative and the compositional centre of gravity.

| Item | Constraint | Prompt |
|---|---|---|
| Viewpoint | A natural observing viewpoint whose composition best shows the scene's subject and its depth | hero shot, representative angle |
| Eye height | Human eye level by default; special scenes may look down or up | eye level (default) |
| Composition | Subject centred or following the rule of thirds; foreground/midground/background layering is clear | balanced composition |

### Frame specification

| Item | Constraint |
|---|---|
| Layout | A single frame (not a collage, not multi-view, not a split screen) |
| People | **Any person, human shadow or human silhouette is strictly forbidden** |
| Consistency | Style/material/tone/light unified |
| Light | A single light-source logic, light-and-shadow direction consistent |
| Aspect ratio | 16:9 by default (or as set by the caller) |

---

## 6. Prompt template

```
stop-motion clay ancient-style scene main-view concept image，stop-motion animation style，3D cartoon render，warm-toned light and shadow，soft shallow depth of field，
claymation style，stop-motion aesthetic，warm lighting，
scene design sheet，environment concept art，no people，no characters，no human figures，
{interior/exterior}，{scene type}，{dynasty style}，{season + time}，
foreground: {element}，midground: {element}，background: {element}，
{tone description}，{weather/atmosphere elements}，
{material description}，atmospheric perspective，ultra-clear grain detail，
natural marks of wear on materials，patina of years，moss and weathering，fabric falling in natural folds，
diffused warm soft light，volumetric light，warm-toned light flecks，shallow depth-of-field blur，
single-frame composition，a natural observing viewpoint，a composition that represents the scene's subject and shows the foreground/midground/background layering，
no person of any kind in frame
no text of any kind in the image
```


---

## 7. Constraint rules

### Mandatory

| No. | Rule |
|---|---|
| R1 | The scene must have "foreground, midground and background layering" |
| R2 | Exteriors must contain "atmospheric perspective" |
| R3 | The scene image must be a "single-frame main view"; stitching multiple views/split screens/grids is not allowed |
| R4 | The composition must represent the scene's subject and show the foreground/midground/background layering |
| R5 | **Any person in the scene image is strictly forbidden** |
| R6 | Must contain the stop-motion animation keywords (claymation / stop-motion) |
| R7 | Must contain the shallow depth-of-field keywords (shallow depth of field / bokeh) |
| R8 | Must specify "warm soft light", no hard shadow |
| R9 | Materials must carry natural wear/marks of age |

### Forbidden

| No. | Forbidden |
|---|---|
| X1 | A pure white/pure black background, or no scene at all |
| X2 | Extreme weather (storm/lightning/blizzard) |
| X3 | A scene with no depth/no layering |
| X4 | Vegetation/weather contradicting the season |
| X5 | Any person, human shadow or human silhouette appearing |
| X6 | The frame being stitched into a multi-view/grid/split-screen layout |
| X7 | Live-action photographic realism/3D render/CG-animation texture |
| X8 | Material too clean and perfect, with no marks of use at all |
| X9 | Cold hard light/strong contrast/hard shadow |
