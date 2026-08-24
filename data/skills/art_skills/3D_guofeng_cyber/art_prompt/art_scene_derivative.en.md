---
name: art_scene_derivative
description: Guofeng Cyber 3D scene derived asset generation · constraint manual
metaData: art_skills
---
# Guofeng Cyber 3D Scene Derived Asset Generation · Constraint Manual
(fully compatible in both directions: ancient-style scenes + modern urban scenes)

---

## 1. Derivation principles
(core constraint: shared by the ancient-style and urban settings; every variant follows "fused, unified style, consistent spatial logic" strictly)

1. **Spatial consistency** — the architectural structure/layout/materials and the core Guofeng Cyber fusion elements stay perfectly identical across every variant
    - Ancient-style scenes: keep constant the cyber-retrofit logic of the ancient building system/flying eaves and bracket sets/mortise-and-tenon structure/courtyard layout/traditional motifs
    - Urban scenes: keep constant the fusion logic of the tower structure/street and lane network/urban functional zoning/Guofeng retrofit elements (Chinese flying eaves/bracket sets/motifs)
    - Element misplacement, structural alteration or stylistic rupture between variants is strictly forbidden
2. **Shot size drives it** — the same scene serves different narrative functions through different shot sizes, matched precisely to the spatial narrative logic of the ancient-style or urban setting
3. **Time-of-day switching** — the same space shows a different lighting mood at different times of day, with the brightness, color temperature and on/off logic of each setting's own light sources adapted in step
    - Ancient-style scenes: traditional lanterns/rune lamps/holographic Guofeng projections/neon conduits
    - Urban scenes: tower megascreens/street lamps/car headlights/Guofeng neon signboards/holographic ink-wash advertising
4. **Weather change** — the same space carries a different emotion under different weather, with the physical response of each setting's materials and elements adapted in step
    - Ancient-style scenes: neon Tyndall beams in rain and mist, snow covering the flying eaves, water dripping from eaves tiles, damp texture on the timber frame
    - Urban scenes: rain-streak reflections on glass curtain walls, neon reflections in road puddles, snow covering the tower flying eaves, frost flowers on metal structures
5. **3D as the anchor** — every variant must keep its 3D render texture; flat textures/CG-animation feel/anime flat-color style are rejected. PBR physical materials, ray-traced global illumination, volumetric light, ambient occlusion and depth-of-field blur are kept strictly, and each setting's own material texture is reinforced
    - Ancient-style only: weathered timber frame, aged metal, brick and tile texture, fabric drape creases, worn lacquer, moss and weathering
    - Urban only: ultra-white glass curtain wall, anodized aluminium, fair-faced concrete, asphalt road surface, frosted metal, self-illuminating LED screens

---

## 2. Shot-size variants

### Shot-size definitions
(full coverage of both the ancient-style and urban settings, matched to the narrative needs of different spaces)

| Shot size | Range | Narrative function | Prompt |
|---|---|---|---|
| Extreme wide shot (大全景) | The whole scene + the surrounding environment | Establish the space, orient globally | extreme wide shot、大全景、the whole Guofeng Cyber scene、ancient-style scene: ancient building cluster and cyber-retrofitted skyline; urban scene: Guofeng cyber city skyline, panoramic urban layout |
| Wide shot (全景) | The scene presented complete | Show the overall spatial structure and the fusion logic | wide shot、全景、complete structure of the Guofeng Cyber scene、ancient-style scene: complete form of the courtyard/ancient buildings with cyber retrofit; urban scene: complete layout of the towers/blocks with Guofeng fusion |
| Medium shot (中景) | A local area of the scene | Focus on the core functional area | medium shot、中景、Guofeng Cyber functional area、ancient-style scene: part of a hall/depth of a lane/garden node; urban scene: tower facade/depth of a lane/commercial district node |
| Medium close-up (近景) | A detail of the scene | Close-up (特写) of material/atmosphere props | close shot、近景、Guofeng Cyber material close-up、ancient-style scene: mortise-and-tenon mechanical structure/neon light on the motifs/flying-eave components; urban scene: Guofeng-motif curtain wall/flying-eave-shaped tower structure/neon signboard detail |
| Close-up (特写) | An extremely local detail | Material grain/key props | extreme closeup、特写、Guofeng Cyber grain detail、ancient-style scene: etched traditional motifs/conduit ports/glowing runes; urban scene: worn metal lacquer/LED screen pixel texture/glass curtain wall reflection detail |

### Shot-size derivation specification
(shared by the ancient-style and urban settings, variant consistency controlled strictly)

| Derived from the base image | Stays unchanged | May change |
|---|---|---|
| 大全景 → 全景 | Building exterior, overall layout, core Guofeng Cyber fusion elements, spatial road network/courtyard structure | Viewpoint narrows, the foreground gains elements specific to that setting (ancient-style: floating lanterns/holographic projection; urban: floating Guofeng advertising/street lamps/street trees) |
| 全景 → 中景 | Material, tone, light, position and fusion logic of the Guofeng Cyber elements | Crop and focus, depth of field changes, focus on the core functional area |
| 中景 → 近景 | Material, tone, core Guofeng Cyber material properties | Shallow depth of field, background blurred, focus on material and prop detail |
| 近景 → 特写 | Material grain, Guofeng Cyber grain detail | Extremely shallow depth of field, a macro feel, focus on micro texture and light detail |

---

## 3. Time-of-day variants

### Time-of-day definitions
(full coverage of the light-source logic of both the ancient-style and urban settings, lighting self-consistent and never in conflict)

| Time | Visual character | Prompt |
|---|---|---|
| Early morning | Thin mist and soft light, tones interweaving cool and warm, cool neon afterglow not yet out, morning light piercing the mist and the holographic projections into Tyndall beams<br>Ancient-style: morning light gilding the flying eaves, lantern afterglow<br>Urban: standby glow on the tower megascreens, street-lamp afterglow, morning light piercing the skyscraper cluster | first light of dawn、thin morning mist、Guofeng Cyber early morning、neon afterglow、morning light through the mist |
| Midday | Bright and highly saturated, shadows short and crisp, colors reproduced truly<br>Ancient-style: crisp shadows on the ancient building structure, natural highlights on metal and stone<br>Urban: strong reflections on the glass curtain wall, crisp shadow boundaries on the towers, neon dimmed on standby | midday sun、bright light、Guofeng Cyber midday、hard-light texture、physical material reflection |
| Dusk | Golden warm tone, long shadows, orange-to-purple gradient sky, golden glow and neon lighting up in turn<br>Ancient-style: long shadows of the ancient building outline, lanterns just lit<br>Urban: gold rim on the tower skyline, megascreens and neon signboards switching on in turn, car light trails | golden glow of dusk、golden hour、Guofeng Cyber dusk、neon first lit、skyline gradient |
| Night (moonlight) | Cool blue tone, quiet and cold, low illumination and high contrast<br>Ancient-style: cool blue moonlight, cool neon, cold reflections on timber and metal<br>Urban: moonlight over the tower cluster, cool rim light on the towers, cool neon, empty street shot | clear moonlight、moonlight、Guofeng Cyber moonlit night、cool neon、faint holographic glow |
| Night (lamplight) | Strong light-dark contrast, warm and cool light interwoven, high dynamic range lighting<br>Ancient-style: warm yellow lanterns interwoven with cyber neon, warm light through window lattice, holographic projection light<br>Urban: warm light glowing from inside the towers, Guofeng neon signboards, megascreen advertising, street lamps and car lights, lamplight along the lanes | lamplight fading out、candlelight flickering、Guofeng Cyber night scene、neon lamplight、warm lantern light、holographic light effects |

### Time-of-day derivation specification
(shared by the ancient-style and urban settings; the core structure is held constant, only the lighting mood changes)

| Derived from the base time | Stays unchanged | Changes |
|---|---|---|
| Day → dusk | Buildings/layout/materials, position and structure of the core Guofeng Cyber elements | Sky tone warms, shadows lengthen, neon light sources switch on in turn, holographic projection brightness rises, each setting's own light sources adapted in step |
| Day → night | Buildings/layout/materials, position and structure of the core Guofeng Cyber elements | Everything darkens, lamplight/moonlight mood added, each setting's own self-illuminating sources switched on — ancient-style: lanterns/rune lamps; urban: megascreens/street lamps/car lights |
| Interior day → interior night | Spatial structure, furniture, Guofeng Cyber retrofit structure | Overall tone warms, each setting's own light sources added — ancient-style: candle flame/lanterns; urban: console light sources/LED screens/Guofeng wall lamps |

---

## 4. Weather variants

### Weather definitions
(full coverage of the physical response in both the ancient-style and urban settings, material behavior logically consistent)

| Weather | Visual character | Prompt |
|---|---|---|
| Clear | Bright and clear, crisp shadows, high contrast<br>Ancient-style: sunlight and neon equally bright, crisp grain on timber, brick and tile<br>Urban: strong highlights on the glass curtain wall, crisp tower shadows, definite asphalt road texture | clear sky for miles、bright sunshine、Guofeng Cyber clear day、sunlight and neon coexisting |
| Overcast | Soft diffused light, no hard shadow, low contrast, gentle colors<br>Ancient-style: the neon light stands out, natural timber grain<br>Urban: matte texture on metal and concrete, soft tower outlines, neon saturation rises | soft overcast light、overcast、Guofeng Cyber overcast、soft diffused light、neon standing out |
| Thin mist | Layered mist, visibility falling by degrees, hazy air<br>Ancient-style: ancient buildings hazy in the distance, Tyndall effect on the neon light, holographic projections scattering in the mist<br>Urban: towers hazy in the distance, street lamps and neon forming a light fog, volumetric light piercing the mist | thin mist spreading、mist curling around、Guofeng Cyber thin mist、volumetric Tyndall light、neon light fog |
| Drizzle | Light trails on the rain threads, damp reflections, puddle reflections<br>Ancient-style: water dripping from eaves tiles, damp texture on the timber frame, rain threads reflecting the neon light<br>Urban: rain streaks on the glass curtain wall, road puddles reflecting neon and towers, water beads clinging to metal surfaces | drizzle like silk threads、a light veil of rain、Guofeng Cyber drizzle、light trails on the rain threads、neon reflection on the water |
| Falling snow | Snow cover, snowflakes drifting down, cool white tone, frost-flower texture<br>Ancient-style: snow on the flying eaves and bracket sets, frost flowers on timber and metal surfaces, snowflakes dyed by the neon<br>Urban: snow on the Guofeng flying eaves of the towers, snow on the street-tree branches, thin snow on the road, frost flowers on the metal structures | snow falling thick、the world in silver white、Guofeng Cyber falling snow、neon-dyed snow、frost-flower texture |

### Weather derivation specification
(shared by the ancient-style and urban settings; the spatial structure is held constant, only the physical response to the weather changes)

| Derived from the base weather | Stays unchanged | Changes |
|---|---|---|
| Clear → thin mist | Buildings/layout, structure and position of the core Guofeng Cyber elements | A mist layer is added, the background blurs, saturation drops, the neon light forms volumetric Tyndall beams, holographic projections scatter |
| Clear → drizzle | Buildings/layout, structure and position of the core Guofeng Cyber elements | Rain threads are added, the ground reflects, the tone turns cool, each setting's own materials take on a damp texture, puddle reflections adapt to the scene elements in step |
| Clear → falling snow | Buildings/layout, structure and position of the core Guofeng Cyber elements | Snow cover and snowflakes are added, the tone turns white, each setting's own structures take on snow cover, frost flowers form on metal surfaces, snowflakes are dyed by the light sources |
| Vegetation must adapt to the weather logic | — | Ancient-style: petals damp in the rain, snow on pine branches in the snow; urban: glowing leaves damp in the rain, frost on street trees in the snow — the weather change adapts the physical state and light response of the vegetation in step |

---

## 5. Four-view sheet specification

### View definitions
(shared by the ancient-style and urban settings, the 360° all-round spatial logic perfectly self-consistent)

> The camera is fixed at the center point of the scene, shooting level in the four directions front/back/left/right in turn, forming a 360° all-round view with no blind spot; the same applies to an ancient courtyard and an urban block.

| Position | View | View direction | Requirement | Prompt |
|---|---|---|---|---|
| Top left | Front view | Level forward from the center point (0°) | Shows the front main structure and depth layering of the scene, presenting the Guofeng Cyber fusion logic in full<br>Ancient-style: front form of the ancient buildings and the cyber-retrofit tiers<br>Urban: front structure of the towers/blocks and the Guofeng-retrofit tiers | front view、eye level、looking forward、front structure of the Guofeng Cyber scene、front presentation of the ancient-building/urban fusion |
| Top right | Right view | Level rightward from the center point (90°) | Shows the rightward spatial extension and side structure of the scene, presenting the side form and the conduit/lane layout in full<br>Ancient-style: right-side structure of the ancient buildings and the courtyard depth<br>Urban: right facade of the towers and the lane depth | right side view、eye level、looking right、right-side structure of the Guofeng Cyber scene、side presentation of the ancient-building/urban fusion |
| Bottom left | Back view | Level backward from the center point (180°) | Shows the rear structure and spatial depth of the scene, presenting the rear form and the equipment/conduit arrangement in full<br>Ancient-style: rear eave structure of the ancient buildings and the back courtyard layout<br>Urban: rear structure of the towers and the back street layout | back view、eye level、looking backward、rear structure of the Guofeng Cyber scene、rear presentation of the ancient-building/urban fusion |
| Bottom right | Left view | Level leftward from the center point (270°) | Shows the leftward spatial extension and side structure of the scene, presenting the side form and the lane/element layout in full<br>Ancient-style: left-side structure of the ancient buildings and the side courtyard layout<br>Urban: left facade of the towers and the side street layout | left view、eye level、looking left、left-side structure of the Guofeng Cyber scene、side presentation of the ancient-building/urban fusion |

### Frame specification
(shared by the ancient-style and urban settings, consistency constrained strictly, AI misplacement ruled out)

| Item | Constraint |
|---|---|
| Layout | A four-panel grid (2×2) in one frame: top left front view + top right right view + bottom left back view + bottom right left view, forming the four-direction view looking around from the center point |
| People | **Any person, human shadow, human outline or animal outline is strictly forbidden** |
| Viewpoint | All four views start from the same center point, at identical sightline height (standard eye level, 1.6 m), with no vertical offset |
| Consistency | Across the four views the architectural structure/material/tone/light/season/weather are perfectly identical, and the position, structure and light logic of the core Guofeng Cyber fusion elements are perfectly uniform, with nothing misplaced and nothing omitted |
| Light | The light direction is perfectly uniform across the four views and the lighting logic is 100% self-consistent (the positional relationships and shadow directions of the key light/ambient light/self-illuminating sources under the different viewpoints are entirely correct) |
| Aspect ratio | Fixed 1:1 square frame (2×2 grid evenly distributed) |

---

## 6. Prompt template
(shared by the ancient-style and urban settings, placeholders adapt flexibly, copy and use directly)

Guofeng Cyber 3D scene derived four-view sheet，based on the concept art of {scene name}，
{scene type: ancient-style scene / modern urban scene, pick one}，chinoiserie cyberpunk，Guofeng cyberpunk，
{ancient-style scene only: traditional ancient buildings fused with cyber technology, flying eaves and bracket sets matched with neon conduits, mortise-and-tenon structure combined with mechanical modules, etched traditional motifs with neon light, holographic Guofeng projections, cyberized traditional plaques}
{urban scene only: modern city fused with Guofeng culture, skyscrapers shaped with Chinese flying eaves, tower facades with bracket-set structure, glass curtain walls with traditional motifs, Guofeng neon signboards, holographic ink-wash advertising, cyberized Chinese lanes}
3D render style，high-precision hard-surface modeling，PBR physical materials，Guofeng 3D，cinema-level lighting，HDR high dynamic range，ray-traced global illumination，
3D rendered, volumetric lighting,
depth of field, natural lens vignette, subtle chromatic aberration, bokeh,
3D render texture，volumetric Tyndall light，natural light，physical lighting，neon self-illuminating lighting，
scene derivative design sheet, environment concept art, no people, no characters, no human figures,
keep the scene's spatial structure and core Guofeng Cyber elements perfectly identical，
{shot-size viewpoint (if any)}, {time-of-day description (if any)}, {weather description (if any)},
{core Guofeng Cyber elements (if any)}, {cyber light source description (if any)},
{foreground}, {midground}, {background},
{tone description}, {depth-of-field description (if any)}, {sky tone change (if any)}, {mood adjustment (if any)},
{weather visual character (if any)}, {material surface change (if any)}, {vegetation adaptation description (if any)},
natural wear marks on the materials，patina of years，moss and weathering，natural draping creases in the fabric，aged metal texture，weathered timber frame texture，worn lacquer detail，corroded metal texture，
volumetric light，ambient occlusion，natural diffused light，soft lighting，neon light fog，
aerial perspective，ultra-clear grain detail，8K ultra HD，ultra-fine detail，
a four-panel grid (2×2) in one frame：looking around from the scene's center point，front view + right view + back view + left view，
all four views shot level from the same center point，identical architectural structure，identical material and tone，identical lighting logic，Guofeng Cyber elements perfectly uniform，
no person of any kind in frame
no text of any kind in the image

> **Usage note**: judge from the information the user provides which change dimensions need to be applied (shot size/time of day/weather); for dimensions not mentioned, leave the matching field blank and omit it. There is no need to generate a separate template for each variant. Fill in either the ancient-style or the urban scene, and delete outright the fields specific to the setting you did not pick.

---

## 7. Constraint rules

### Mandatory rules
(shared by the ancient-style and urban settings, forced on every AI generation)

| No. | Rule |
|---|---|
| R1 | The scene's spatial structure and road-network/courtyard layout stay perfectly identical across every variant |
| R2 | A time-of-day variant must adjust the sky tone and the mood, and adapt the on/off, brightness and color-temperature logic of that setting's own light sources in step |
| R3 | A weather variant must adapt the vegetation/material surfaces, and adapt the physical and lighting response of that setting's own elements in step |
| R4 | Must be a "four-view sheet" (looking around from the center point: front view + right view + back view + left view), strictly following the 2×2 four-panel grid layout |
| R5 | Across the four views the architectural structure/material/tone/light/season/weather must be perfectly identical, with the Guofeng Cyber fusion elements neither misplaced nor omitted |
| R6 | In scene images, **any person, human shadow, human outline or animal outline is strictly forbidden** |
| R7 | Judge the change dimensions from the information the user provides; there is no need to split into separate templates |
| R8 | Must include the core 3D render keywords (at least 2 of 3D rendered / volumetric lighting / PBR materials) |
| R9 | Must include lens optical characteristics (at least one of depth of field / lens vignette / bokeh) |
| R10 | Materials must carry natural wear / marks of years; the brand-new flawless "plastic feel" or "CG feel" is forbidden |
| R11 | Every variant must keep the core Guofeng Cyber fusion logic — ancient-style scenes: traditional Eastern form as the core, cyber technology as the surface; urban scenes: modern urban space as the core, Guofeng culture as the soul — and any rupture between the elements is forbidden |
| R12 | Must include the Guofeng Cyber keywords (at least 2 of chinoiserie cyberpunk, Guofeng cyber, cyber-retrofitted ancient buildings, urban Guofeng fusion) |
| R13 | The lighting logic of every self-illuminating element (neon/holographic/megascreen/lantern) must obey physical rules and fit the ambient light, the time of day and the weather perfectly, with no light bleed and no misplaced shadows |

### Forbidden rules
(shared by the ancient-style and urban settings, forcibly avoided on every AI generation)

| No. | Forbidden |
|---|---|
| X1 | Architectural structure/layout/road network/courtyard inconsistent between variants |
| X2 | Weather contradicting the season (snow in summer, snow cover in the rainy season, and the like) |
| X3 | Abrupt changes in material/tone/style between variants, fusion logic inconsistent |
| X4 | Any person, human shadow, human silhouette, human outline or animal outline appearing |
| X5 | Architectural structure/material/tone inconsistent between the four views, or a viewpoint center/height that is not uniform |
| X6 | Low-precision modeling/rough textures/plastic texture/flat-color style (the words low-poly, rough modeling, flat color and the like are banned) |
| X7 | Materials that are too clean and perfect, with no trace of use or years (avoid the "plastic feel" and "toy feel") |
| X8 | Lighting that is too even and flat, with no depth-of-field blur, no lens optical character, no volumetric light/ambient occlusion |
| X9 | Guofeng and cyber elements spliced stiffly, piled up with no logic (mixing ancient buildings and urban towers with no fusion is forbidden, as is placing traditional and cyber elements with no logic) |
| X10 | Cyber light bleeding out, lighting logic muddled, self-illuminating sources with no reasonable physical support, shadow directions wrong |
| X11 | Losing the scene's core character: an ancient-style scene losing the traditional Eastern architectural/cultural core, an urban scene losing the modern city's spatial logic |
| X12 | Style imbalance within one scene: an ancient-style scene over-cyberized and losing the Guofeng core, an urban scene over-Guofeng'd and losing the cyber futurism |
