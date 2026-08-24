---
name: liveaction_urban_scene_derivative
description: Live-action urban scene derived asset generation · constraint manual
metaData: liveaction_urban_art_skills
---

# Live-Action Urban Scene Derived Asset Generation · Constraint Manual

---

## 1. Derivation principles

> Live-action urban scene derivation is not "cutting new camera positions in a rendered scene" but "the same real place, photographed again from a different position, at a different time, in different weather".

1. **Spatial anchoring** — the core spatial structure of a scene must stay recognisable across every variant. The angle changed, the light changed, the weather changed — but one look tells you "this is still that place"
2. **Focal length is narrative** — shooting the same scene at different focal lengths says different things. Wide angle says "the lonely relation between this person and the city", medium says "look at this corner", telephoto says "there is something over there"
3. **Time of day is emotion** — the office in morning light and the office late at night are one space with two emotions. When the time changes, the light changes, and so does the narrative function of the scene — it is not as simple as swapping a sky texture
4. **Weather is story** — on the same street, a clear day is ordinary life, a rainy day is melancholy, a snowy day is romance or solitude. Weather is the emotional filter of a scene, but it is not a filter — it is a real optical and environmental change
5. **Single-view photography** — every derived variant is an independent single full-view photograph. The same space as the original scene sheet, but it may use a different focal length, a different time of day, different weather

---

## 2. Focal-length and composition variants — different gazes on the same space

### Composition variant definitions

| Variant | Focal length | Coverage | Narrative function | Prompt |
|---|---|---|---|---|
| Wide-angle overview | 24-28mm | The whole scene + the surrounding urban environment | Establishes spatial position, shows the relation between the space and the city; a person placed here would look small | 24mm wide-angle overview, complete space + environmental relation, deep focus f/8-f/11 |
| Standard full view (标准全景) | 35mm | The scene shown complete | The equivalent of the human eye, an objective record of the place, the most "honest" composition | 35mm standard full view (标准全景), human-eye perspective, the complete face of the place |
| Medium-shot focus (中景聚焦) | 50mm | The core functional area of the scene / its most recognisable part | Focuses on the "heart" of the space — the desk area of an office, the counter of a café, the junction of a street | 50mm medium-shot focus (中景聚焦), the core narrative area of the space |
| Close-up detail (近景细节) | 85mm | One part within the space — a window, a lamp, a table | Draws the eye to one narrative detail of the space — that unfinished coffee, that blanket thrown on the sofa | 85mm close-up (近景), the narrative detail of the space, shallow depth of field isolating the subject |
| Same angle, different height | — | Change of viewpoint height | Shooting down — the gaze of fate; eye level — the human point of view; shooting up — oppression or grandeur | low-angle upward shot/high-angle downward shot, the original spatial structure kept |

### Focal-length derivation rules

| Derived from the wide-angle overview | Kept unchanged | What changes |
|---|---|---|
| 广角→标准全景 | Spatial structure, light-source logic, time of day and weather, traces of use | Focal length narrows to 35mm, the frame covers less but the space does not change, perspective closer to the human eye |
| 标准全景→中景聚焦 | Material quality, light direction, tonality, traces of use | Focal length narrows to 50mm, cropped to focus on the core area, depth of field moderately shallower |
| 中景→近景细节 | Material texture, prop positions, light direction | Focal length 85mm, extremely shallow depth of field, background naturally softened, the narrative detail within the space brought out |

---

## 3. Time-of-day variants — the makeup time puts on a space

> The same space becomes a completely different place under the light of a different hour. Below is the behaviour of real light sources at the key times of day.

| Time of day | Recipe of the light | Emotional shift of the space | Prompt |
|---|---|---|---|
| Early morning | Low-angle warm white morning light, diffusion from thin mist in the air, the space slightly cool, not fully awake | Quiet, gathering, not yet filled by the order of the day — "nothing has started yet" | early morning scene, low-angle morning light slanting in, the space still cool and unwarmed, the quiet of nobody having arrived |
| Late morning | Daylight rising, cool white and clear, shadows sharp, materials distinct | The establishment of order — the "default" state of a daytime scene | late morning daylight, the space bright and clear, a place running through its day |
| Midday | Top light dominant, shadows short and dense; outdoors, strong reflection off materials | A sense of pause — the gap of the lunch break, the peak of one day like any other | midday top light, the space entering the pause of the day, midday quiet or a brief slackening |
| Afternoon | Daylight moving west, warm tone strengthening, raking light through windows or trees making long shadows and dapples | Languid, time slowing, everything in the afternoon soft — "the longest stretch of the day" | afternoon raking light, long shadows crossing the space, dapples scattered, a languid warm afternoon |
| Golden hour | Very warm low-angle gold-orange light, shadows at their longest, every surface gilded | Cherishing — the most precious light of the day, a warmth that passes in a moment | golden hour, warm gold raking light flooding the space, every surface edged with gold, a warmth that passes in a moment |
| Blue hour | Sky deep blue-violet, natural light extremely dim and cool, artificial lights just coming on, cool and warm coexisting | Transition — the day is over, the night has not fully taken over, the shortest poetic moment | blue hour, deep blue-violet sky through doors and windows, artificial lights just lit, cool and warm light coexisting |
| Late night | Artificial light only — one desk lamp, the street light outside the window, the cool light of a screen | Loneliness or intimacy — the world has gone quiet, the space belongs to one person (or to no one) | late-night scene, a single warm source of desk lamp/street light outside the window, most of the area sinking into shadow, extremely quiet |

### Time-of-day derivation rules

| Derived from the base time of day | Kept unchanged | What changes |
|---|---|---|
| Daytime → dusk (golden hour) | Spatial structure, position of furniture/objects, building exterior | Light-source colour temperature warms to 2800-3500K, shadows lengthen, lit surfaces gilded, artificial lights coming on one by one |
| Daytime → night | Spatial structure, position of furniture/objects, building exterior | Overall exposure drops, artificial lights all on, neon/street lights/interior lamps become the key light, outside the window turns from day to night |
| Interior daytime → interior late night | Spatial structure, position of furnishings | Only very few sources left (one desk lamp/a street light outside), large areas sinking into shadow, a sense of intimacy or solitude |

---

## 4. Weather variants — the emotion weather gives a space

> The same street, the same window, become a different story in different weather.

| Weather | Change in the space | Emotion | Prompt |
|---|---|---|---|
| Clear | Light and shadow sharp, materials distinct, colour saturated | Ordinary, bright, open | clear-day scene, ample sunlight, light and shadow well defined, material quality distinct |
| Cloudy/overcast | Soft light with no hard shadows, overall cool grey, light even | Restraint, calm, or the omen of something oppressive | overcast soft light, no hard shadows, light evenly diffused, overall grey cool tone |
| Thin mist | Distant scenery naturally softened, near ground sharp, visible humidity in the air | Hazy, uncertain, poetic | a scene in thin mist, distant scenery gradually vanishing into the mist, near ground sharp, visible humidity in the air |
| Light rain | Rain marks on the window glass, reflections on the wet ground, water beads on outdoor metal/leaves | Melancholy, contemplation, romance, or the turn of a story | a scene in drizzle, rain marks on the window glass, natural reflections on the wet ground, air cool and damp |
| Heavy rain | Dense curtain of rain, reduced visibility outdoors, puddles and splash on the ground, the visual form of the sound of rain | Cut off — indoors is refuge, outdoors there is nowhere to escape | heavy-rain scene, a thick curtain of rain outside the window, puddles splashing on the ground, the sense of being cut off between inside and outside |
| After rain | Everything wet, puddles still on the ground, air clear, reflections crisp, daylight possibly breaking through the cloud | Renewal, clarity, an emotional washing-clean | post-rain scene, damp air, puddles on the ground reflecting the sky, the clarity of everything having been washed |
| Light snow | Snowflakes falling, a fine white accumulation, warm light through the veil of snow, visible trails of drifting snow in the air | Quiet, gentle, romantic | light-snow scene, sparse snowflakes falling, a thin white layer on the ground, warm light through the drifting snow, calm and gentle |
| Heavy snow | Snow covering surfaces, white dominant, the visual form of sound being absorbed | Solitude or romance — the world simplified to black and white | heavy-snow scene, snow covering the ground and the edges of buildings, the world simplified by white, solitary or romantic |

### Weather derivation rules

| Derived from clear weather | Kept unchanged | What changes |
|---|---|---|
| Clear → thin mist | Spatial structure, building exterior, object positions | Add layers of mist, distant scenery softened, saturation lowered, light sources producing visible beams (a real Tyndall effect, not a visual effect) |
| Clear → light rain | Spatial structure, building exterior, object positions | Add rain streaks outdoors, real rain marks on the glass, wet reflective ground, tone going cool, water beads on the planting |
| Clear → snow | Spatial structure, building exterior, object positions | Add drifting/lying snow, tone going cool white, contrast of warm light sources raised, snow on branches/window sills |
| Interior clear → interior rain | Spatial structure, position of furnishings | Outside the window turns rainy, rain marks on the window glass, interior light dimmer and cooler, the emotion turning from bright to melancholy |

---

## 5. Single-view photography specification — shared by all derived variants

> Every derived variant is an independent **single** full-view photograph. Not a 2×2 four-view sheet, not a multi-angle collage.

| Item | Photographic requirement |
|---|---|
| Spatial structure | **The same space** as the original scene sheet. Building structure/furnishings/object positions in principle do not change — what changes is focal length/time of day/weather |
| Focal length | According to the variant type (wide-angle overview → 近景细节), use 24mm/35mm/50mm/85mm |
| Depth of field | Wide-angle overview → deep focus f/8-f/11; 中景 → moderately shallow depth of field f/4-f/5.6; 近景细节 → shallow depth of field f/2.8 |
| Light source | Comes from real light — the time of day matching the sun's height and colour temperature, the weather matching atmospheric scattering and occlusion, interiors matching window light and artificial lamps |
| People | **No people, human shadows or human silhouettes may appear in any variant** |
| Aspect ratio | 16:9 or 3:2 wide format, consistent with the original scene sheet |
| Colour | Driven by the colour temperature of the actual light sources; do not apply a filter |

---

## 6. Prompt template

### Focal-length variant

live-action urban scene derived photography，the same space as the original scene {scene name}，a single still spatial photograph，not 3D rendered not CG，
{wide-angle overview/标准全景/中景聚焦/近景细节}，{24mm/35mm/50mm/85mm}，
keep the original scene's spatial structure, furnishing positions and light-source logic unchanged，
{focal length description}，{depth of field description}，{description of the area the composition focuses on}，
{time of day + weather}，{description of the light's behaviour}，
no one in the space — no people, human shadows or human silhouettes may appear at all，
real photographic image quality、35mm full-frame photographic texture、single spatial photograph

### Time-of-day variant

live-action urban scene derived photography，the same space as the original scene {scene name}，
same camera position、same focal length、only the time of day changes — from the original time of day to {new time of day}，
keep the spatial structure and object positions completely unchanged，
{the light of the new time of day: direction, colour temperature, intensity}，
{the spatial emotion of the new time of day: quiet/warm/lonely/poetic}，
{changes in the switching and brightness of artificial light sources}，
no one in the space — no people, human shadows or human silhouettes may appear at all，
real photographic image quality、single spatial photograph

### Weather variant

live-action urban scene derived photography，the same space as the original scene {scene name}，
same camera position、same focal length、same time of day — only the weather changes to {new weather}，
keep the spatial structure and object positions completely unchanged，
{visual features of the new weather: rain streaks/snow/mist/wet ground/rain marks}，
{the real changes weather produces on material surfaces: film of water on metal/rain marks on glass/reflections in standing water/water beads on planting/lying snow}，
{the emotional shift the weather brings}，
no one in the space — no people, human shadows or human silhouettes may appear at all，
real photographic image quality、single spatial photograph

> **Usage note**: focal-length variants, time-of-day variants and weather variants can be used on their own or in combination (such as "afternoon + light rain + 中景"). Any dimension not involved simply omits the corresponding field in that prompt.

### Negative prompt

3D render, 3D modeling, CGI, Unreal Engine, Blender, PBR material, volumetric lighting, ambient occlusion, ray tracing, game engine, cartoon, anime, 2D, illustration, hand drawn, painting,
four views, grid layout, 2x2, turnaround, orthographic view, blueprint, multiple angles,
showroom, brand new, pristine, perfect, unrealistically clean, sterile, empty without reason,
people, person, human figure, silhouette, shadow figure, body, crowd,
dramatic sky replacement, unrealistic sky, composite, fake weather, Photoshop effect, filter effect,
古风, 古代, 仙侠, 武侠, 民国, 赛博朋克, 科幻, 西方奇幻, 中世纪, 异世界, 非中国城市,
text, watermark, signature, logo, border, frame, UI element, HUD

---

## 7. Constraint rules

### Mandatory

| No. | Rule |
|---|---|
| R1 | The spatial structure of the scene must stay recognisable across every derived variant — the same place must not become another place |
| R2 | The light sources of a time-of-day variant must obey real physics — the sun's elevation decides colour temperature and shadow length, artificial lights switch on and off logically |
| R3 | A weather variant must also carry the real physical changes on material surfaces — rain marks on glass/reflections in standing water/water beads on planting/lying snow |
| R4 | Must be a **single** full-view photograph — single view, not a 2×2 four-view sheet, not multi-angle, not a turnaround |
| R5 | Must state the origin of the light — where the light comes from, what colour temperature, what kind of source — it cannot be global illumination with no origin |
| R6 | Must keep the original space's traces of use — deriving a new time of day or weather must not "wash away" the wear and the sense of age of the space |
| R7 | **No people, human shadows or human silhouettes may appear in any variant** |
| R8 | Must state the core anchor "live-action photography + not 3D rendered not CG" |

### Strictly forbidden

| No. | Strictly forbidden |
|---|---|
| X1 | Any unrecognisable change to the spatial structure is strictly forbidden — changing the time of day/weather/focal length must not "change the place" |
| X2 | Strictly forbidden: "3D render / 3D modelling / CG / UE engine / Blender / PBR material / volumetric light / AO" and every other CG term |
| X3 | Strictly forbidden: "2D hand-drawn / illustration / animation / anime" and other non-photographic media |
| X4 | Strictly forbidden: "four views / 2×2 grid / multiple angles / turnaround / orthographic view / blueprint" — a single image only |
| X5 | Strictly forbidden: "ancient style/antiquity/xianxia/wuxia/Republican era/cyberpunk/sci-fi/Western fantasy/other worlds" and other non-contemporary-urban scenes |
| X6 | Strictly forbidden: "any person/human shadow/human silhouette/outline/limb appearing" |
| X7 | Strictly forbidden: "sky swapped in like a texture/a Photoshop composite feel/a filter laid over" — the weather change must be a real optical and environmental change |
| X8 | Strictly forbidden: "light of unknown origin/directionless global even illumination" |
| X9 | Strictly forbidden: "a time-of-day variant that does not adjust the switching and brightness of artificial lights" — at dusk the lamps must be on, late at night they cannot all be on |
| X10 | Strictly forbidden: "a weather variant that erases the everyday traces of use in the space" — a wall after rain is still mottled, the ground under snow is still worn |
| X11 | Strictly forbidden: "blown-out whites/crushed blacks/no tonal separation" |
| X12 | Strictly forbidden: "watermark / text / LOGO / signature / border / traces of AI generation" |
