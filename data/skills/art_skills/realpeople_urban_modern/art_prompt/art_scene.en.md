# Scene Image Generation · Urban Realism Constraint Manual

---

## 1. Scene aesthetic principles

1. **Spatial narrative** — the scene carries emotion and narrative function; it is not a plain backdrop
2. **Layered depth** — every scene must have a foreground/middle ground/background; flatness is excluded
3. **Texture above all** — the texture of concrete/glass/wood/metal/fabric and so on must be ultra-crisp
4. **Anchored on live-action** — every frame follows real photography as the standard; 3D-rendered/CG-animation texture is rejected. Pursue lens optical characteristics (depth-of-field blur, lens vignette, faint chromatic aberration) and physical lighting (natural diffuse light, caustics, volumetric light)

---

## 2. Seasonal tone mapping

| Season | Main tone | Secondary tone | Prompt |
|---|---|---|---|
| Spring | Tender green + light pink | Sky blue, pale yellow | spring tender green, peach-blossom light pink |
| Summer | Emerald green + deep blue | Sea blue, white | summer emerald green, deep blue sky |
| Autumn | Golden yellow + orange red | Amber, brown | autumn golden yellow, fallen-leaf orange red |
| Winter | Gray white + cool blue | Silver gray, ink blue | winter gray white, cool blue sky |

---

## 3. Interior scenes

### Spatial specification

| Dimension | Constraint | Prompt |
|---|---|---|
| Style | Modern apartment/office building/cafe/hotel/mall, modern minimalist/Nordic/industrial | modern {style} style |
| Material | Mainly concrete/glass/wood/metal/textile | concrete wall, glass curtain wall, wooden floor |
| Tone | Low-saturation neutral + natural wood + accent color | neutral tone, natural wood color, accent color |
| Depth | Foreground/middle ground/background layering | foreground {element}, middle ground {element}, background {element} |
| Texture | Wood grain/brushed metal/fabric weave identifiable | clear texture, realistic texture |
| Lighting | Mainly natural light sources (window light/desk lamp/pendant lamp), light diffuse and soft, visible light-beam particles and caustic projection | natural diffuse light, warm desk lamp light, light beam through the window |
| Lens feel | Shallow depth of field blurring fore- and background, slight lens vignette, natural color-temperature shift | shallow depth of field、lens vignette、natural color cast |
| Imperfection | Traces of use on walls, wear on the floor, natural creases in textiles | traces of use, natural wear, natural fabric drape |

### Interior type quick reference

| Type | Core elements | Atmosphere words |
|---|---|---|
| Modern apartment | Sofa, coffee table, floor-to-ceiling window, plants | Warm and comfortable, modern minimalist |
| Office space | Desk, computer, documents, plants | Professional and tidy, efficient atmosphere |
| Cafe | Counter, coffee machine, tables and chairs, decor | Relaxed and pleasant, artistic atmosphere |
| Hotel room | Bed, bedside table, floor-to-ceiling window, TV | Comfortable and luxurious, quiet atmosphere |
| Living room | Sofa, TV cabinet, rug, decorative paintings | Warm everyday, family atmosphere |

---

## 4. Exterior scenes

### Spatial specification

| Dimension | Constraint | Prompt |
|---|---|---|
| Type | Street/plaza/park/rooftop/car park | {scene}, {season}, {time} |
| Weather | Clear/overcast/light mist/drizzle/falling snow | mist spreading, drizzle like silk |
| Vegetation | Street trees/flower beds/lawn/potted plants (must match the season) | street trees, flower-bed plants |
| Water | Fountains/pools need light-and-shadow reflection | water surface reflection, fountain flowing |
| Architecture | Modern architecture, glass curtain wall, metal structure | modern architecture, glass curtain wall |
| Sense of air | Must have atmospheric perspective, the distance leaning gray and blue | distant view gray-blue, atmospheric perspective |
| Lighting | Natural light as the only light source; daylight/street lamps need volumetric light and scattering | natural lighting, volumetric light, warm street lamp light |
| Lens feel | Shallow depth-of-field blur, lens vignette, faint chromatic aberration, bokeh highlights | shallow depth of field、bokeh、lens flare、vignette |
| Imperfection | Cracks in the ground/peeling walls/oxidised metal/scratched glass | traces of use, natural wear |

### Exterior type quick reference

| Type | Core elements | Atmosphere words |
|---|---|---|
| City street | Street lamps, street trees, crosswalk | Urban everyday, busy street |
| Commercial plaza | Buildings, fountain, billboards | Bustling and lively, commercial atmosphere |
| Park green space | Lawn, trees, benches, footpath | Natural and quiet, leisurely atmosphere |
| Rooftop | Railing, city view, seating | Open view, city scenery |
| Underground car park | Parking bays, lane markings, indicator lights | Cold industrial, silent space |

---

## 5. Main-view specification

### View definition

> A single-frame main view, shot from the most representative angle of the scene, carrying the spatial narrative and the compositional centre of gravity.

| Item | Constraint | Prompt |
|---|---|---|
| Viewpoint | A natural observation viewpoint; the composition best conveys the scene's subject and depth | hero shot、representative angle |
| Eye height | Eye level by default; special scenes may look down or up | eye level (default) |
| Composition | Subject centred or following the rule of thirds, with clear foreground/middle ground/background layering | balanced composition |

### Frame specification

| Item | Constraint |
|---|---|
| Layout | Single frame (not a montage, not multi-view, not split screen) |
| People | **Any person, human shadow or human silhouette is strictly forbidden** |
| Consistency | Style/material/tone/light unified |
| Light | Single light-source logic, light and shadow pointing the same way |
| Aspect ratio | 16:9 by default (or as set by the caller) |

---

## 6. Prompt template

```
modern urban scene main-view concept image，
real photography，photorealistic，shot on ARRI Alexa，35mm film grain，
RAW photo，ultra realistic，hyper detailed，
shallow depth of field，natural lens vignette，subtle chromatic aberration，bokeh，
real photographic texture，film grain feel，natural lighting，physical light and shadow，
scene design sheet，environment concept art，no people，no characters，no human figures，
{interior/exterior}，{scene type}，{style}，{season + time}，
foreground: {element}，middle ground: {element}，background: {element}，
{tone description}，{weather/atmosphere element}，
{material description}，atmospheric perspective，ultra-crisp texture detail，
natural wear marks on materials，traces of use，peeling walls，oxidised metal，
natural diffuse light，volumetric light，Tyndall effect，caustic projection，
single-frame composition，natural observation viewpoint，a composition that represents the scene's subject and shows the foreground/middle ground/background layering，
no people in frame
no text of any kind in the image
```


---

## 7. Constraint rules

### Mandatory

| No. | Rule |
|---|---|
| R1 | The scene must have "foreground, middle ground and background layering" |
| R2 | Exteriors must include "atmospheric perspective" |
| R3 | The scene image must be a "single-frame main view"; stitching multiple views/split screen/grid is not allowed |
| R4 | The composition must represent the scene's subject and show the foreground/middle ground/background layering |
| R5 | **Any person appearing in the scene image is strictly forbidden** |
| R6 | Must include live-action photography keywords (real photography / photorealistic / RAW photo) |
| R7 | Must include lens optical characteristics (at least one of shallow depth of field / lens vignette / bokeh) |
| R8 | Materials must carry natural wear/traces of use; a brand-new flawless "CG feel" is forbidden |

### Forbidden

| No. | Forbidden |
|---|---|
| X1 | Pure white/pure black background or no scene |
| X2 | Extreme weather (storm/lightning/blizzard, unless the plot requires it) |
| X3 | A scene with no depth/no layering |
| X4 | Vegetation/weather contradicting the season |
| X5 | Any person, human shadow, human silhouette or human outline appearing |
| X6 | The frame being stitched into a multi-view/grid/split-screen layout |
| X7 | 3D-rendered/CG-animation/cartoon/game-engine texture (the words 3D render, CGI, Unreal Engine, Unity and the like are banned) |
| X8 | Materials that are too clean and perfect, with no trace of use or age (avoid a "plastic feel") |
| X9 | Lighting that is too even and flat, with no depth-of-field blur and no lens optical characteristics |
