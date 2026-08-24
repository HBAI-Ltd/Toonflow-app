---
name: art_scene
description: Scene image generation · constraint manual
metaData: art_skills
---

# Scene Image Generation · Constraint Manual

---

## 1. Scene aesthetic principles

1. **Spatial storytelling** — the scene carries emotional and narrative function; it is not a plain backdrop
2. **Layered depth** — every scene must have a foreground/middle ground/background; flatness is ruled out
3. **Texture above all** — the weave of wood/stone/fabric/water and other materials must be ultra clear
4. **Anime as the anchor** — every frame is held to the Guofeng anime standard; 3D photorealism/CG-animation texture is refused; pursue delicate lines, cel-shaded flat coloring, Japanese-style rendering

---

## 2. Seasonal color mapping

| Season | Main tone | Secondary tone | Prompt |
|---|---|---|---|
| Spring | Blue-green + vermilion | Moon white, gamboge | verdant spring color、peach blossoms in full bloom |
| Summer | Blue-green + indigo | Moon white, blue-green | summer lotus deep green、dense shade blocking the sun |
| Autumn | Ochre + golden yellow | Vermilion, ochre | crimson autumn maples、golden leaves drifting down |
| Winter | Moon white + indigo | Ink black, blue-green | winter snow plain white、frost hanging on bare branches |

---

## 3. Interior scenes

### Spatial specification

| Dimension | Constraint | Prompt |
|---|---|---|
| Style | Ancient residence/palace/study/lady's chamber, Ming-Qing back to Tang-Song | ancient {dynasty} style |
| Material | Mainly wood, with stone/jade/silk/gauze as secondary | sandalwood furniture、jade screen、silk-gauze drapery |
| Tone | Traditional Chinese color tones + moon white gauze drapes + vermilion lacquered wood | warm wood tones、plain and elegant furnishing |
| Depth | Foreground/middle-ground/background layers | foreground {element}、middle ground {element}、background {element} |
| Texture | Wood grain/the drape of fabric/porcelain sheen distinguishable | clear weave、delicate texture |
| Lighting | Mainly natural light sources (window light/candlelight), soft light and shadow | diffused natural light、flickering candlelight、soft light and shadow |
| Lens feel | Cel-shaded flat coloring softening fore and back, clear lines | cel shading wash, clear lines |
| Sense of wear | Use marks on wood surfaces, weathering on stone, natural creasing in fabric | marks of passing years、natural wear、natural drape and folds in fabric |

### Interior type quick reference

| Type | Core elements | Atmosphere words |
|---|---|---|
| Lady's chamber/bedroom | Gauze canopy, dressing table, bronze mirror, vase | warm and private、gauze drapes hanging light |
| Study/scholar's room | Bookshelves, scrolls, brush and ink, go board | quiet and refined、the scent of ink everywhere |
| Great hall/main hall | Tall columns, plaques, curtains, candlesticks | solemn and splendid、grand in presence |
| Courtyard corridor | Corridor columns, stone railings, flowering trees, lanterns | a winding path to seclusion、lantern shadows flickering |
| Kitchen/dining hall | Stove, steamer baskets, tableware | the breath of cooking fires、warm everyday life |

---

## 4. Exterior scenes

### Spatial specification

| Dimension | Constraint | Prompt |
|---|---|---|
| Type | Courtyard/mountain forest/streamside/old bridge/market | {scene}，{season}，{time} |
| Weather | Clear/overcast/light mist/fine rain/falling snow | thin mist drifting、fine rain like silk threads |
| Vegetation | Plum/bamboo/pine/peach blossom/willow/lotus (must match the season) | peach blossoms in full bloom、emerald bamboo grove |
| Water | Stream/lake/waterfall need light reflection | a stream babbling、the lake like a mirror |
| Architecture | Flying eaves and dougong brackets, gray tiles and white walls, stone bridges and wooden pavilions | upturned flying eaves、stone arch bridge |
| Air feel | Atmospheric perspective is mandatory, distant scenery blurred | distant hills dark as painted brows、atmospheric perspective |
| Lighting | Natural light as the only light source; sunlight/moonlight need a Japanese-style rendering effect | natural lighting、Japanese-style rendering、soft light and shadow |
| Lens feel | Cel-shaded flat coloring softening, clear lines | cel shading wash, clear lines |
| Sense of wear | Moss/weathering on stone, patina on wood, broken roof tiles | mottled moss、weathering marks、the patina of years |

### Exterior type quick reference

| Type | Core elements | Atmosphere words |
|---|---|---|
| Courtyard garden | Rockery, pond, flowering trees, stone path | flower shadows spread lightly、a winding path to seclusion |
| Mountain forest, sea of bamboo | Ancient trees, bamboo grove, mountain rock, cloud and mist | ranges folded on ranges、cloud and mist drifting |
| Streamside, lakeside | Stream, pebbles, weeping willows, lotus | a stream babbling、willow shadows swaying |
| Old bridge, long pavilion | Stone arch bridge, long pavilion, willows | the long pavilion on the old road、willows lingering |
| Market street | Tavern banners, stalls, lanterns | a lively marketplace、the human world of cooking fires |
| Rooftop terrace | Roof tiles, flying eaves, night sky | drinking alone under the moon、a cool breeze coming |

---

## 5. Hero view specification

### View definition

> A single-frame hero view, shot from the most representative angle of the scene, carrying the spatial storytelling and the compositional centre of gravity.

| Item | Constraint | Prompt |
|---|---|---|
| Viewpoint | A natural observing viewpoint, the composition that best shows the scene's subject and its depth | hero shot、representative angle |
| Eye height | Human eye level by default; special scenes may look down or up | eye level (default) |
| Composition | Subject centred or following the rule of thirds, with clear foreground/middle-ground/background layers | balanced composition |

### Frame specification

| Item | Constraint |
|---|---|
| Layout | A single frame (not a montage, not multi-view, not split-screen) |
| People | **Any person, human shadow or human silhouette is strictly forbidden** |
| Consistency | Style/material/tone/light unified |
| Light | A single light-source logic, light and shadow consistent in direction |
| Aspect ratio | 16:9 by default (or as set by the caller) |

---

## 6. Prompt template

Guofeng anime scene hero-view concept art，
Guofeng anime，new Guochao aesthetic，Japanese anime rendering，cel-shaded flat coloring，delicate brushwork，
Japanese anime style, cel shading, fine brushstrokes,
cel-shaded flat coloring，delicate lines，natural lighting，Japanese-style rendering，
scene design sheet, environment concept art, no people, no characters, no human figures,
{interior/exterior}，{scene type}，{dynasty style}，{season+time},
foreground: {element}, middle ground: {element}, background: {element},
{tone description}, {weather/atmosphere element},
{material description}, atmospheric perspective, ultra clear texture detail,
natural wear marks on the materials，the patina of years，natural drape and folds in fabric，
soft light and shadow，Japanese-style rendering，diffused natural light，delicate texture，
single-frame composition，natural observing viewpoint，a composition that represents the scene's subject and shows the foreground/middle-ground/background layers，
no person of any kind in the frame
no text of any kind in the image

---

## 7. Constraint rules

### Mandatory

| No. | Rule |
|---|---|
| R1 | The scene must have "foreground, middle-ground and background layers" |
| R2 | Exteriors must include "atmospheric perspective" |
| R3 | A scene image must be a "single-frame hero view"; stitching multi-view/split-screen/grid layouts is not allowed |
| R4 | The composition must represent the scene's subject and show the foreground/middle-ground/background layers |
| R5 | **Any person is strictly forbidden** in a scene image |
| R6 | Must contain Guofeng anime keywords (Chinese style anime / cel shading / fine brushstrokes) |
| R7 | Must contain lens optical characteristics (cel-shaded flat coloring / delicate lines / Japanese-style rendering) |
| R8 | Materials must carry natural wear/marks of passing years; a brand-new flawless "CG feel" is forbidden |

### Forbidden

| No. | Forbidden |
|---|---|
| X1 | A pure white/pure black background or no scene at all |
| X2 | Extreme weather (storm/lightning/blizzard, unless the plot requires it) |
| X3 | A scene with no depth/no layering |
| X4 | Vegetation/weather contradicting the season |
| X5 | Any person, human shadow, human silhouette or human outline appearing |
| X6 | The frame stitched into a multi-view/grid/split-screen layout |
| X7 | 3D photorealism/CG animation/cartoon/game-engine texture (the words 3D render, CGI, Unreal Engine, Unity and the like are forbidden) |
| X8 | Materials too clean and perfect, with no use marks or sense of age (avoid a "plastic feel") |
| X9 | Lighting too even and flat, with no depth-of-field softening and no lens optical characteristics |
