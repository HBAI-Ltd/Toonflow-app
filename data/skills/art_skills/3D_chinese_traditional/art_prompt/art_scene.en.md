---
name: art_scene
description: Scene image generation · constraint manual
metaData: art_skills
---

# Scene Image Generation · Constraint Manual

---

## 1. Scene aesthetic principles

1. **Spatial narrative** — the scene carries emotional and narrative function; it is not a plain backdrop
2. **Layered depth** — every scene must have a foreground/middle ground/background; flatness is ruled out
3. **Texture above all** — the material grain of wood/stone/cloth/water surfaces must be ultra-clear
4. **3D is the anchor** — every frame takes 3D rendering as its standard, rejecting the feel of flat textures/3D rendering/CG animation; pursue cinematic rendering effects such as volumetric light, ambient occlusion and depth-of-field blur

---

## 2. Season to tone mapping

| Season | Main tone | Secondary tone | Prompt |
|---|---|---|---|
| Spring | Blue-green + vermilion | Moon white, gamboge | verdant spring color、peach blossom ablaze |
| Summer | Blue-green + indigo | Moon white, blue-green | emerald summer lotus、dense shade against the sun |
| Autumn | Ochre + golden yellow | Vermilion, ochre | crimson autumn maple、golden leaves drifting down |
| Winter | Moon white + indigo | Ink black, blue-green | plain white winter snow、frost hanging on bare branches |

---

## 3. Interior scenes

### Space specification

| Dimension | Constraint | Prompt |
|---|---|---|
| Style | Ancient residence/palace/study/boudoir, Ming-Qing back to Tang-Song | ancient {dynasty} style |
| Material | Wood dominant, stone/jade/silk/gauze secondary | sandalwood furniture、jade screen、silk-gauze drapes |
| Tone | Traditional Chinese tones + moon white gauze drapes + vermilion lacquered wood | warm wood tone、plain elegant furnishing |
| Depth | Foreground/middle ground/background layers | foreground {element}、middle ground {element}、background {element} |
| Texture | Wood grain/cloth drape/porcelain sheen identifiable | clear grain、fine material texture |
| Lighting | Natural light sources dominant (window light/candlelight), volumetric light, ambient occlusion | natural light diffusion、flickering candlelight、volumetric light |
| Lens feel | Depth-of-field blur on fore and back, lens vignette, faint chromatic fringing | depth of field、lens vignette、chromatic aberration |
| Imperfection | Marks of use on wood surfaces, weathering on stone surfaces, natural creases in cloth | marks of years、natural wear、natural drape and folds of cloth |

### Interior type quick lookup

| Type | Core elements | Atmosphere words |
|---|---|---|
| Boudoir/bedchamber | Gauze bed curtains, dressing table, bronze mirror, vase | warm and private、gauze drapes hanging light |
| Study | Bookshelves, scrolls, brush and ink, go board | quiet and refined、the scent of ink everywhere |
| Great hall/main hall | Tall columns, inscribed plaque, drapes, candlestick | solemn and splendid、grand in scale |
| Courtyard corridor | Corridor columns, stone balustrade, flowering trees, lanterns | a winding path to seclusion、lamp shadows swaying |
| Kitchen/dining hall | Stove, steamer basket, tableware | the breath of cooking fires、warm everyday life |

---

## 4. Exterior scenes

### Space specification

| Dimension | Constraint | Prompt |
|---|---|---|
| Type | Courtyard/mountain forest/streamside/old bridge/market | {scene}，{season}，{time} |
| Weather | Clear/overcast/thin mist/drizzle/falling snow | thin mist spreading、drizzle fine as silk |
| Vegetation | Plum/bamboo/pine/peach blossom/willow/lotus (must fit the season) | peach blossom ablaze、emerald bamboo grove |
| Water | Streams/lakes/waterfalls need light reflection | a stream babbling、the lake like a mirror |
| Architecture | Flying eaves and dougong brackets, green tiles and white walls, stone bridges and wooden pavilions | upturned flying eaves、stone arch bridge |
| Air | Must have atmospheric perspective, volumetric light, distant scenery blurred | distant hills dark as painted brows、atmospheric perspective、volumetric light |
| Lighting | Natural light as the sole light source; sunlight/moonlight need volumetric light and scattering | natural illumination、volumetric light、depth-of-field blur |
| Lens feel | Depth-of-field blur, lens vignette, chromatic fringing, bokeh highlights | depth of field、bokeh、lens flare、vignette |
| Imperfection | Moss/weathering on stone, splitting/patina on wood, chipped tiles/moss traces | mottled moss、weathering marks、patina of years |

### Exterior type quick lookup

| Type | Core elements | Atmosphere words |
|---|---|---|
| Courtyard garden | Rockery, pond, flowering trees, stone path | flower shadows scattered、a winding path to seclusion |
| Mountain forest, sea of bamboo | Ancient trees, bamboo grove, rocks, cloud and mist | ridge upon ridge、cloud and mist drifting |
| Streamside, lakeside | Stream, pebbles, weeping willows, lotus | a stream babbling、willow shadows swaying |
| Old bridge, wayside pavilion | Stone arch bridge, pavilion, willows | pavilion on the old road、willows swaying |
| Market street | Tavern banners, stallholders, lanterns | a lively marketplace、the world of cooking fires |
| Rooftop terrace | Roof tiles, flying eaves, night sky | drinking alone under the moon、a fresh breeze coming |

---

## 5. Main view specification

### View definitions

> A single-frame main view, shot from the most representative angle of the scene, carrying the spatial narrative and the compositional center of gravity.

| Item | Constraint | Prompt |
|---|---|---|
| Viewpoint | A natural observing viewpoint, the composition best expressing the scene's subject and depth | hero shot、representative angle |
| Eye height | Eye-level by default; special scenes may look down or up | eye level (default) |
| Composition | Subject centered or following the rule of thirds, with clear foreground/middle ground/background layers | balanced composition |

### Frame specification

| Item | Constraint |
|---|---|
| Layout | A single frame (not a montage, not multi-view, not split screen) |
| People | **Any person, human shadow or human silhouette is strictly forbidden** |
| Consistency | Style/material/tone/light unified |
| Light | A single light-source logic, with consistent light direction |
| Aspect ratio | 16:9 by default (or as set by the caller) |

---

## 6. Prompt template

Guofeng-era scene main-view concept art，
3D render style，high-precision modeling，PBR materials，Guofeng 3D，cinema-level lighting，
3D rendered, volumetric lighting,
depth of field, natural lens vignette, subtle chromatic aberration, bokeh,
3D render texture，volumetric light，natural illumination，physical light and shadow，
scene design sheet, environment concept art, no people, no characters, no human figures,
{interior/exterior}，{scene type}，{dynasty style}，{season+time},
foreground：{element}, middle ground：{element}, background：{element},
{tone description}, {weather/atmosphere element},
{material description}, atmospheric perspective, ultra-clear grain detail,
natural wear marks on materials，patina of years，moss and weathering，natural drape and folds of cloth，
volumetric light，ambient occlusion，natural light diffusion，soft light and shadow，
single-frame composition，natural observing viewpoint，a composition that represents the scene's subject and shows the foreground/middle ground/background layers，
no person of any kind in the frame
no text of any kind in the image

---

## 7. Constraint rules

### Mandatory

| No. | Rule |
|---|---|
| R1 | The scene must have "foreground, middle ground and background layers" |
| R2 | Exteriors must include "atmospheric perspective" |
| R3 | The scene image must be a "single-frame main view"; multi-view/split-screen/grid montages are not allowed |
| R4 | The composition must represent the scene's subject and show the foreground/middle ground/background layers |
| R5 | **Any person is strictly forbidden** in the scene image |
| R6 | Must contain the 3D render keywords (3D rendered / volumetric lighting / PBR materials) |
| R7 | Must contain lens optical characteristics (at least one of depth of field / lens vignette / bokeh) |
| R8 | Materials must carry natural wear/marks of years; a brand-new flawless "CG feel" is forbidden |

### Forbidden

| No. | Forbidden |
|---|---|
| X1 | A pure white/pure black background or no scene at all |
| X2 | Extreme weather (storm/lightning/blizzard, unless the plot requires it) |
| X3 | A scene with no depth/no layering |
| X4 | Vegetation/weather contradicting the season |
| X5 | Any person, human shadow, human silhouette or human outline appearing |
| X6 | The frame being montaged into a multi-view/grid/split-screen layout |
| X7 | Low-precision modeling/crude textures/plastic texture (words such as low-poly, rough modeling are banned) |
| X8 | Materials too clean and perfect, with no marks of use and no feel of years (avoid a "plastic feel") |
| X9 | Lighting too even and flat, with no depth-of-field blur and no lens optical characteristics |
