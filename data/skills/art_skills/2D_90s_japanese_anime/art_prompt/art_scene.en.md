# 1990s Retro Japanese Anime Style - Scene Image Generation · Constraint Manual

---

## 1. Scene aesthetic principles

1. **Spatial narrative** — a scene carries emotion and narrative function; it is not a plain backdrop
2. **Layered depth** — every scene must have a foreground/middle ground/background; flatness is ruled out
3. **Texture above all** — material expression through line/color/light must be clear
4. **The 1990s as anchor** — every frame is held to the 1990s retro Japanese anime standard; modern CG/3D rendering is rejected; pursue hand-drawn line character (fluid linework, block shading) and cinematic light (soft warm light, volumetric light)

---

## 2. Seasonal color mapping

| Season | Main tone | Secondary tone | Prompt |
|---|---|---|---|
| Spring | Pink + fresh green | Light yellow, pale purple | spring pink, cherry blossoms in bloom |
| Summer | Jade green + blue | Light blue, white | summer jade green, blue sky and white clouds |
| Autumn | Golden yellow + orange-red | Brown, deep green | autumn gold, maple leaves turning red |
| Winter | White + gray | Deep blue, light blue | winter white, snowflakes falling |

---

## 3. Interior scenes

### Spatial specification

| Dimension | Constraint | Prompt |
|---|---|---|
| Style | 1990s Japanese-style room/Western-style room | {style} style |
| Material | Mainly wood/stone/fabric/glass | wooden furniture, fabric decoration |
| Tone | Low-saturation warm tone/soft cool tone | warm tone/cool tone |
| Depth | Foreground/middle ground/background layering | foreground {element}, middle ground {element}, background {element} |
| Quality | Fluid linework, soft color | fluid linework, soft color |
| Lighting | Natural light/lamplight, soft cinematic light | natural lighting, soft cinematic light |
| Line feel | Clear outlines, block shading | clear lines, block shading |
| Wear and imperfection | Walls show signs of use, furniture naturally worn | signs of use, natural wear |

### Interior type quick reference

| Type | Core elements | Atmosphere words |
|---|---|---|
| Bedroom/lady's room | Bed/wardrobe/dressing table | Warm and private, comfortable |
| Study | Bookshelf/desk/chair | Quiet, scholarly |
| Living room/main hall | Sofa/coffee table/decoration | Comfortable, warm |
| Corridor/balcony | Railing/plants/decoration | Open, airy |
| Kitchen/dining room | Dining table/kitchenware | Warm, homely |

---

## 4. Exterior scenes

### Spatial specification

| Dimension | Constraint | Prompt |
|---|---|---|
| Type | Courtyard/mountain woods/street/square | {scene}, {season}, {time} |
| Weather | Clear/overcast/rain/snow | clear day, rainy day, snowy day |
| Vegetation | Trees/flowers/grass (must match the season) | trees, flowers and grass |
| Architecture | 1990s architecture/Japanese-style architecture | 1990s architecture/Japanese-style architecture |
| Sense of air | Aerial perspective is mandatory, distance grays out | aerial perspective, blurred distance |
| Lighting | Natural light as the only light source, soft cinematic light | natural lighting, soft cinematic light |
| Line feel | Clear outlines, block shading | clear lines, block shading |
| Wear and imperfection | Walls show signs of use, the ground is worn | signs of use, marks of wear |

### Exterior type quick reference

| Type | Core elements | Atmosphere words |
|---|---|---|
| Courtyard garden | Plants/small bridge/pond | Quiet, graceful |
| Mountain woods/park | Trees/rocks/paths | Natural, open |
| Street/market | Buildings/stalls/passers-by | Lively, full of daily life |
| Riverside/lakeside | Water surface/bridge/trees | Quiet, graceful |
| Rooftop/terrace | Railing/sky/distant view | Open, free |

---

## 5. Main-view specification

### View definition

> A single-frame main view, shot from the most representative angle of the scene, carrying the spatial narrative and the compositional centre of gravity.

| Item | Constraint | Prompt |
|---|---|---|
| Angle | A natural observing angle whose composition best conveys the scene's subject and depth | hero shot, representative angle |
| Eye height | Human eye level by default; special scenes may look down or up | eye level (default) |
| Composition | Subject centred or on the rule of thirds, with clear foreground/middle ground/background layering | balanced composition |

### Frame specification

| Item | Constraint |
|---|---|
| Layout | Single frame (not a collage, not multi-view, not split screen) |
| People | **Any person, human shadow or human silhouette is strictly forbidden** |
| Consistency | Style/material/tone/light are unified |
| Light | A single light-source logic, consistent light direction |
| Aspect ratio | 16:9 by default (or as set by the caller) |

---

## 6. Prompt template
```
1990s retro Japanese anime style scene main-view concept art，
90s anime style，hand-drawn flat coloring，soft warm tones，fine fluid linework，cinematic light and shadow，
scene design sheet，environment concept art，no people，no characters，no human figures，
1990s retro style，nostalgic healing atmosphere，
{interior/exterior}，{scene type}，{season + time}，
foreground: {element}，middle ground: {element}，background: {element}，
{tone description}，{weather/atmosphere elements}，
{material description}，aerial perspective，ultra-clear line detail，
fluid linework、block shading、signs of use，
soft cinematic light、background glow、natural lighting，
single-frame composition，natural observing angle，a composition that represents the scene's subject and shows the foreground/middle ground/background layering，
no person anywhere in the frame
no text of any kind in the image
```

---

## 7. Constraint rules

### Mandatory

| No. | Rule |
|---|---|
| R1 | The scene must have "foreground, middle ground and background layering" |
| R2 | Exteriors must include "aerial perspective" |
| R3 | The scene image must be a "single-frame main view"; stitching multiple views/split screens/grids is not allowed |
| R4 | The composition must represent the scene's subject and show the foreground/middle ground/background layering |
| R5 | **Any person in the scene image is strictly forbidden** |
| R6 | Must include the 1990s keywords (90s anime style / hand-drawn / warm tone) |
| R7 | Must include line character (at least one of fluid linework, block shading) |
| R8 | Materials must carry signs of use; a brand-new flawless "CG look" is forbidden |

### Forbidden

| No. | Forbidden |
|---|---|
| X1 | Pure white/pure black background, or no scene at all |
| X2 | Extreme weather (storm/lightning/blizzard, unless the plot requires it) |
| X3 | A scene with no depth/no layering |
| X4 | Vegetation/weather contradicting the season |
| X5 | Any person, human shadow or human silhouette appearing |
| X6 | The frame stitched into a multi-view/grid/split-screen layout |
| X7 | 3D rendering/CG animation/modern-style texture |
| X8 | Materials too clean and perfect, with no signs of use at all |
| X9 | Lighting too even and flat, with no soft cinematic light |
