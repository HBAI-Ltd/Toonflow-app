# Anime Scene Image Generation · Constraint Manual

---

## 1. Scene aesthetic principles

1. **Spatial narrative** — the scene carries emotion and narrative function; it is not a plain backdrop
2. **Layered depth** — every scene must have foreground/midground/background; flatness is not allowed
3. **Texture above all** — modern material texture must be ultra-crisp (glass/metal/wood/fabric/wall surfaces)
4. **Cel shading as the anchor** — every frame takes anime style as the standard, emphasising clean lines and cel shading
5. **Dramatic low-key lighting** — light serves the emotion, keeping the low-saturation cool-tone keynote

---

## 2. Season-to-color mapping

| Season | Main tone | Secondary tone | Prompt |
|---|---|---|---|
| Spring | Cyan-green + pale pink | Light blue, pale yellow | verdant spring, tender cherry-blossom pink |
| Summer | Emerald green + azure | Sky cyan, snow white | lush summer trees, sky washed blue |
| Autumn | Orange-yellow + brown-red | Ochre, golden yellow | golden autumn leaves, maple red like fire |
| Winter | Plain white + cool blue | Gray-white, pale blue | cool winter day, snow lying white |

---

## 3. Interior scenes

### Space specification

| Dimension | Constraint | Prompt |
|---|---|---|
| Style | Modern urban home/office/cafe/apartment | modern {scene type} style |
| Material | Mainly modern materials, glass/metal/wood/fabric as support | modern material, glass reflection, wood grain |
| Color | Mainly low-saturation cool tones, warm accents | cool tones dominant, warm light accents |
| Depth | Foreground/midground/background layering | foreground {element}, midground {element}, background {element} |
| Texture quality | Clear glass/metal/wood/fabric texture | clear material, fine texture |
| Lighting | Natural light/artificial light, distinct light-and-shadow layers | natural light, light-and-shadow layers, interior light |
| Lens feel | Cinema-level composition, shallow depth-of-field blur, lens optical characteristics | `shallow depth of field`, `film grain` |
| Imperfection | Modern marks of use, a lived-in feel | lived-in feel, marks of use |

### Interior type quick reference

| Type | Core elements | Atmosphere words |
|---|---|---|
| Modern apartment | Sofa/TV/bed/kitchen | warm and homey, lived-in feel |
| Business office | Desk/computer/documents/bookshelf | professional and brisk, workplace atmosphere |
| Cafe | Tables and chairs/coffee cup/counter/window | relaxed and easy, urban leisure |
| School classroom | Desks/blackboard/bookshelf/blackboard | youthful campus, studious air |
| Hotel room | Bed/bathroom/TV/nightstand | comfortable and modern, hotel atmosphere |

---

## 4. Exterior scenes

### Space specification

| Dimension | Constraint | Prompt |
|---|---|---|
| Type | City street/park/campus/commercial district | {scene}, {season}, {time} |
| Weather | Clear/overcast/thin mist/drizzle/snowfall | thin mist spreading, drizzle fine as silk |
| Vegetation | Trees/flowers and grass/lawn (must match the season) | trees casting shade, flowers in full bloom |
| Water | Ponds/fountains/rivers must have light reflections | light rippling on water, clear reflections |
| Architecture | Modern architecture/glass curtain wall/brick wall | modern city, architectural lines |
| Air quality | Aerial perspective is mandatory; distance goes grayer and bluer | distant hills like dark eyebrows, aerial perspective |
| Lighting | Natural light/artificial light, dramatic low-key lighting | natural lighting, volumetric light, dramatic light-and-shadow |
| Lens feel | Cinema-level composition, shallow depth-of-field blur, anime lens characteristics | `shallow depth of field`, `vignette`, `anime cinematic` |
| Imperfection | Marks of use in the city, marks of time | city marks, lived-in feel |

### Exterior type quick reference

| Type | Core elements | Atmosphere words |
|---|---|---|
| City street | Street lamps/crosswalk/buildings/vehicles | urban life, street air |
| Park green space | Trees/benches/lawn/paths | leisurely and relaxed, natural air |
| Commercial district | Shops/billboards/pedestrians/street | bustling city, commercial atmosphere |
| Campus scene | Teaching building/sports ground/trees/benches | youthful campus, studious air |
| Rooftop/balcony | Railing/city view/plants | open field of view, urban vantage point |
| Subway station/bus stop | Platform/train/pedestrians/signage | commuting life, urban rhythm |

---

## 5. Main-view specification

### View definition

> A single-frame main view, shot from the most representative angle of the scene, carrying the spatial narrative and the compositional centre of gravity.

| Item | Constraint | Prompt |
|---|---|---|
| Viewpoint | A natural observing viewpoint; the composition best expresses the scene's subject and its depth | `hero shot`, `representative angle` |
| Viewpoint height | Eye level by default; special scenes may look down or up | `eye level` (default) |
| Composition | Subject centred or following the rule of thirds; foreground/midground/background layering is clear | `balanced composition` |

### Frame specification

| Item | Constraint |
|---|---|
| Layout | A single frame (not a montage, not multiple views, not a split screen) |
| People | **Any person, human shadow or human silhouette is strictly forbidden** |
| Consistency | Style/material/color/light stay unified |
| Light | A single light-source logic, consistent light-and-shadow direction |
| Aspect ratio | 16:9 by default (or as set by the caller) |

---

## 6. Prompt template

anime scene main-view concept art，
anime style，cel shading，modern urban style，
cinematic composition，dramatic low-key lighting，
ultra detailed，8K，high quality，
shallow depth of field，image grain，lens vignette，
cel-shaded animation style，cinema-level composition，dramatic low-key lighting，
scene design sheet，environment concept art，no people，no characters，no human figures，
{interior/exterior}，{scene type}，{modern style}，{season + time}，
foreground: {element}，midground: {element}，background: {element}，
{color description}，{weather/atmosphere elements}，
{material description}，aerial perspective，ultra-crisp texture detail，
modern marks of use on the materials，lived-in feel，natural wear，
natural light/artificial light、dramatic light-and-shadow，low-saturation cool tones，
single-frame composition，a natural observing viewpoint，a composition that represents the scene's subject and shows the foreground/midground/background layering，
no people of any kind in the frame
no text of any kind in the image

---

## 7. Constraint rules

### Mandatory

| No. | Rule |
|---|---|
| R1 | The scene must have "foreground, midground and background layering" |
| R2 | Exteriors must include "aerial perspective" |
| R3 | The scene image must be a "single-frame main view"; stitching multiple views/split screens/grids is not allowed |
| R4 | The composition must represent the scene's subject and show the foreground/midground/background layering |
| R5 | **Any person is strictly forbidden** in the scene image |
| R6 | Must include the "anime style" keywords (anime style / cel shading) |
| R7 | Must include a depth-of-field characteristic (at least one of shallow depth of field / vignette), keeping the cel-shaded animation style |
| R8 | Materials must carry modern marks of use / a lived-in feel; a brand-new, flawless "3D-rendered look" is forbidden |

### Forbidden

| No. | Forbidden |
|---|---|
| X1 | A pure white/pure black background or no scene at all |
| X2 | Extreme weather (storm/lightning/blizzard, unless the plot requires it) |
| X3 | A scene with no depth/no layering |
| X4 | Vegetation/weather contradicting the season |
| X5 | Any person, human shadow, human silhouette or human outline appearing |
| X6 | The frame being stitched into a multi-view/grid/split-screen layout |
| X7 | 3D rendering/CG animation/game-engine texture (the words 3D render, CGI, Unreal Engine, Unity and the like are forbidden) |
| X8 | Materials that are too clean and perfect, with no marks of use or age at all (avoid a "plastic look") |
| X9 | Lighting that is too even and flat, with no depth-of-field blur and no lens optical characteristics |
