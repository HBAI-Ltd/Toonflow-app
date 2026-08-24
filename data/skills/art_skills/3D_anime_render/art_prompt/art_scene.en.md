# 3D Anime Render Urban Scene Image Generation · Constraint Manual

---

## 1. Scene aesthetic principles

1. **Spatial narrative** — the scene carries emotional and narrative function; it is not a plain backdrop
2. **Layered depth** — every scene must have a foreground/midground/background; flatness is ruled out
3. **Texture above all** — wood grain/stone/fabric/water-surface textures are clear, but simplified by cel-shaded rendering
4. **Cel shading as the anchor** — every frame takes 3D animation render + cel shading as the standard and refuses realistic-photography/CG-animation texture; keep the animation style and lens character consistent
5. **Urban atmosphere** — modern urban landscape, architectural style and tone unified

---

## 2. Seasonal color mapping

| Season | Main tone | Secondary tone | Prompt |
|---|---|---|---|
| Spring | Verdant green + peach pink | Light blue, goose yellow | verdant spring colors, blossoms on every branch |
| Summer | Emerald green + lotus pink | Sky cyan, white | summer in full swing, green trees casting shade |
| Autumn | Crimson + golden yellow | Amber, light gray | deep autumn, red leaves falling |
| Winter | Plain white + frost silver | Deep blue, light gray | winter snow cover, winter quiet |

---

## 3. Urban architecture

### Space specification

| Dimension | Constraint | Prompt |
|---|---|---|
| Style | Modern city, office blocks/housing/commercial districts | modern urban architecture |
| Material | Mostly glass/concrete/metal (cel-shaded) | modern material, cel-shaded rendering |
| Tone | Mostly warm tones, dusk sunset-glow atmosphere | warm tones, dusk atmosphere |
| Depth | Foreground/midground/background layering (cel-shaded depth) | foreground {element}, midground {element}, background {element} |
| Texture | Architectural grain clear (cel-shaded) | clear grain, cel-shaded texture |
| Lighting | Mostly natural light (window light/street lamps), soft light | natural light, soft lighting |
| Lens feel | Shallow depth of field blurring fore/background, cel-shaded lens effect | shallow depth of field, cel-shaded lens |
| Imperfection | Buildings carry marks of use, natural wear (cel-shaded) | natural wear, cel-shaded treatment |

### Urban type quick reference

| Type | Core elements | Atmosphere words |
|---|---|---|
| Commercial district | High-rises/shops/billboards | bustling and lively, modern city |
| Residential district | Apartment blocks/gardens/streets | warm daily life, quiet neighbourhood |
| Office district | Office blocks/car park/coffee area | workplace mood, business air |
| Park and greenery | Trees/walking paths/benches | leisurely and relaxed, lush greenery |
| Transport hub | Metro station/bus stop/footbridge | busy traffic, the city's pulse |
| Riverside/lakeside | Water/walking paths/lights | romantic atmosphere, beautiful waterscape |

---

## 4. Interior and exterior scenes

### Interior space specification

| Dimension | Constraint | Prompt |
|---|---|---|
| Style | Office/cafe/apartment/convenience store | modern interior style |
| Material | Flooring/walls/furniture (cel-shaded) | modern material, cel-shaded rendering |
| Tone | Mostly warm tones, dusk atmosphere | warm tones, cosy atmosphere |
| Depth | Foreground/midground/background layering | foreground {element}, midground {element}, background {element} |
| Texture | Material grain clear (cel-shaded) | clear grain, cel-shaded texture |
| Lighting | Natural light + interior lamps, soft light | natural light, interior lighting, soft |
| Lens feel | Shallow depth of field blurring fore/background | shallow depth of field, interior lens |
| Imperfection | Furniture carries marks of use, natural wear | natural wear, cel-shaded treatment |

### Interior type quick reference

| Type | Core elements | Atmosphere words |
|---|---|---|
| Office | Desk/computer/documents/chair | workplace mood, business air |
| Cafe | Coffee table/seating/counter/decoration | warm and easy, leisurely atmosphere |
| Apartment | Sofa/bed/bookshelf/decoration | homely warmth, comfortable space |
| Convenience store | Shelves/checkout counter/drinks | everyday convenience, daily feel |
| Restaurant | Dining table/chairs/kitchen | dining mood, warm meal |
| Gym | Treadmill/equipment/mirrors | sporty mood, energetic space |

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
| Consistency | Style/material/tone/light unified (cel-shaded treatment) |
| Light | A single light-source logic, light-and-shadow direction consistent (cel-shaded treatment) |
| Aspect ratio | 16:9 by default (or as set by the caller) |

---

## 6. Prompt template
```
3D animation render，cinematic lighting，vivid cel-shaded texture，high-detail materials，joyful healing atmosphere，cartoon urban style，high-detail cartoon materials，moderate cartoon proportions，warm-toned color scheme，8K ultra HD，cinematic composition，soft light-and-shadow layering，bright cartoon render style，warm and healing，urban scene main-view concept image，
anime style, cel-shaded, 3D animation render,
film lighting, warm sunset lighting,
scene design sheet, environment concept art, no people, no characters, no human figures,
{interior/exterior}，{scene type}，{architectural style}，{season + time}，
foreground: {element}，midground: {element}，background: {element}，
{tone description}，{weather/atmosphere elements}，
{material description}，atmospheric perspective，clear grain，cel-shaded treatment，
natural marks of use on materials，lived-in wear，fabric falling in natural folds (cel-shaded)，
diffused natural light，volumetric light，cel-shaded light effect，cel-shaded cast shadow，
single-frame composition，a natural observing viewpoint，a composition that represents the scene's subject and shows the foreground/midground/background layering，
no person of any kind in frame，
cel-shaded render style，soft light-and-shadow，moderate cartoon proportions，high-detail cartoon materials，
warm-toned color scheme，dusk sunset-glow atmosphere，joyful healing atmosphere，
8K ultra HD，cinematic composition，
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
| R6 | Must contain the 3D anime render keywords (cel-shaded, 3D animation render, anime style) |
| R7 | Must contain a lens optical characteristic (at least one of shallow depth of field / lens vignette / bokeh, given cel-shaded treatment) |
| R8 | Materials must carry natural wear/marks of age; a brand-new, flawless "CG look" is forbidden, but it is presented cel-shaded |
| R9 | Must keep the cel-shaded render style consistent; mixing in realistic elements is not allowed |
| R10 | Must contain the warm-toned color scheme and dusk sunset-glow atmosphere keywords |
| R11 | Must contain the 8K ultra HD and cinematic composition keywords |

### Forbidden

| No. | Forbidden |
|---|---|
| X1 | A pure white/pure black background, or no scene at all |
| X2 | Extreme weather (storm/lightning/blizzard, unless the plot requires it, and it must be cel-shaded) |
| X3 | A scene with no depth/no layering |
| X4 | Vegetation/weather contradicting the season |
| X5 | Any person, human shadow, human silhouette or human outline appearing |
| X6 | The frame being stitched into a multi-view/grid/split-screen layout |
| X7 | 3D-render/CG-animation/game-engine texture (the words 3D render, CGI, Unreal Engine, Unity, etc. are banned) — 3D anime cel-shaded rendering must be stated explicitly instead |
| X8 | Material too clean and perfect, with no marks of use or age at all (avoid the "plastic look"); cel-shaded treatment is required |
| X9 | Lighting too even and flat, no depth-of-field blur, no lens optical characteristic |
| X10 | Using photographic realism terms (such as real photography, photorealistic, RAW photo, etc.) |
| X11 | Ancient/futuristic elements, anything outside the modern urban style |
| X12 | A cool-toned/night-time dominant tone instead of warm tones/a dusk atmosphere |