---
name: director_planning_liveaction_urban
description: Live-Action Urban constraints — defines the global constraints of the Live-Action Urban style on the tonal system, lighting schemes, texture direction, scene space elements, score choice and ambient sound, with deep adaptation for Seedance 2.0. Applies to any narrative genre.
metaData: director_skills, seedance2.0_adapted
---

# Live-Action Urban constraints · Live-action urban shooting · Technique reference

---

## 1. Tonal system and the visual keynote

- **Tonal base** — the whole piece uses urban white (#F5F2EC), fog gray (#9EA2A8) and navy (#2D3A4A) as base colors. Overall color temperature splits into neutral-leaning-warm by day (5000-5800K) and coexisting warm and cool by night (warm streetlight 2800-3200K + cool ambient 6000-8000K). Saturation is medium-low (35-55%), giving a restrained urban palette that is "cinematic without looking filtered" — the color comes from actual light sources, not from grading in post
- **The light source is the palette** — do not pair a "primary/secondary color"; drive the color of the frame with the temperature and direction of the light source. Dawn light 3500-4500K (warm white), midday 5500-6500K (cool white and clear), golden hour 2800-3500K (warm gold), blue hour 8000-10000K (deep blue-violet), sodium streetlight 2000-2200K (warm orange-yellow), convenience-store fluorescents 4000-5000K (cool white)
- **Warm-cool narrative contrast** — warm light (dawn light/sunset/desk lamp/sodium streetlight) is for warmth, healing, intimacy and street-life passages; cool light (midday skylight/overcast diffusion/blue hour/fluorescents) is for restraint, distance, loneliness and suspense passages. A key transition can hint at an emotional turn by switching the color temperature of the light source
- **Light-source-first principle** — when planning a passage, first fix "where the light comes from and at what color temperature", then fix the color of the frame. Avoid "this shot has pretty colors but the light source makes no sense"
- **Forbidden color range** — highly saturated fluorescent colors, cheap filter grading (such as teal-and-orange or sepia presets), CG neon color spill, abnormal color casts produced by unreal light sources

---

## 2. Lighting scheme system

- **Light is narrative** — 7 lighting schemes match different emotional passages. At the director's planning stage, fix the direction of the lighting keynote at passage level, not shot by shot. Every scheme must specify "the source of the light + color temperature + lighting ratio", so that Seedance 2.0 can simulate it physically
- **Lighting features of live-action shooting** — staging natural light through windows, practical sources (desk lamp/streetlight/screen/neon/headlights), environmental reflections (wet ground/glass curtain wall/water surface), the breathing sway of handheld camerawork, changes of depth of field guiding attention — these are the core lighting means of the Live-Action Urban style

| Scheme | Scheme name | Light recipe | Lighting ratio | Suitable emotion |
|---|---|---|---|---|
| A | Urban molten gold | Sunset window light entering at 45° from the side (3000-3500K) + ambient fill (sky reflection 5500K) | 1:3 medium contrast | Peak moments, elite occasions, warm memories, important meetings |
| B | Daytime clarity | Broad window/sky light diffusion (5000-5500K), no hard shadows, curtains softening it | 1:1.5 low contrast | Everyday slack, urban strolling, healing freshness, the office by day |
| C | Warm street-life light | Desk lamp/pendant lamp/sodium streetlight as warm key (2800-3200K), shadows keeping detail | 1:4 warm envelope | Home routine, street-life warmth, tender beats, late-night privacy |
| D | Cool sharp shadow | Hard side light (cool white window light 5000K or cool-toned streetlight) + deep shadows | 1:8 high ratio | Urban suspense, confrontation, cold oppression, high-pressure moments |
| E | Interior diffusion | Natural window diffusion (4500-5500K) + interior ceiling light/cool screen light as fill, soft shadows | 1:2 soft transitions | Interiors by day, workplace desk work, solitude and reflection, healing quiet |
| F | Rainy-night sheen | Wet ground reflecting streetlights (warm 2800K spots + cool 6000K ambient), light scattered by rain streaks on the window glass | 1:6 warm and cool coexisting | Walking alone on a rainy night, longing in solitude, artistic melancholy, suspense setup |
| G | Blue-hour poem | Sky diffusion 20 minutes after sunset (8000-10000K deep blue-violet) + the first warm artificial lights coming on | 1:5 cool base with warm points | Transitional moments, inner monologue, poetic pauses, the closing beat |

- **Warm-cool light allocation** — warm light (dawn light/sunset/desk lamp/sodium streetlight) suits warm healing, elite peak moments and street-life passages; cool light (midday skylight/overcast diffusion/blue hour/fluorescents) suits restrained distance, suspense and confrontation, and cold solitude passages. The switch point between warm and cool is the narrative turning point
- **Atmosphere direction mapping** — the atmosphere direction of every scene should map onto one of the lighting schemes above (A-G). If the narrative needs a mixed scheme (such as F+G), the dominant light source must be stated
- **Seedance 2.0 lighting adaptation notes**: name light sources in terms the AI can understand ("sunset window light" beats "warm volumetric light"). Lighting-ratio numbers help the model build a sense of light and dark. In multi-source scenes, the hierarchy of key light + fill light + ambient light must be stated

---

## 3. Texture direction — the real world in front of the camera

> The only yardstick of Live-Action Urban texture: how materials behave when a camera records them, not the material parameters a render engine generates.

- **Skin texture** — visible pores, natural oil sheen on the T-zone, natural redness over the cheekbones, slight darkness around the eyes — the evidence that real skin is "alive". In Seedance 2.0 prompts, use "visible skin pores, natural skin texture, not airbrushed, real skin texture" instead of the "subsurface scattering/SSS" of a 3D project
- **Hair texture** — loose strands falling naturally over the forehead and the nape, locks that gather and separate naturally, hair edges glowing as a translucent warm rim in backlight, the natural state of being blown by wind or soaked by rain. Seedance 2.0 uses "flyaway hair strands, natural hair movement, backlit hair rim light" instead of "physics-grade hair simulation"
- **Fabric texture** — the soft slight creasing of cotton, the twill grain and fading of denim, the loop texture of knitwear, the patina and bend marks of used leather. Clothes carry evidence of "having been worn" — the hem naturally creased, cuffs marked by putting the garment on and off. Seedance 2.0 uses "fabric texture with subtle wear, natural fabric drape, lived-in clothing"
- **Building materials** — water stains and hairline cracks on concrete walls, reflections and fingerprints on glass curtain walls, the worn patina of metal handrails, fine scratches on tiled floors, use marks on wooden surfaces. Seedance 2.0 uses "weathered building materials, real urban surfaces, not showroom clean"
- **Age texture above all** — materials must not be too clean or too perfect. Traces of life (everyday clutter on a desk, sticker residue on a wall, worn flooring) are not defects; they are the basis of spatial storytelling. Do not use "brand-new show flat" or "flawless architectural rendering"
- **Seedance 2.0 texture adaptation notes**: avoid CG terms such as "PBR material", "physics-grade rendering", "8K texture map". Use "real texture, natural material surface, visible wear and use marks, not CGI" instead. When describing a slight imperfection use "subtle" rather than modelling terms like "micro-detail"

---

## 4. Live-Action Urban scene space elements

Scene elements specific to the contemporary Chinese city and their visual narrative function in Seedance 2.0 video:

- **Window/floor-to-ceiling window/glass partition** — the most central composition and lighting prop of Live-Action Urban. The window is the entrance of light — the direction and color temperature of window light decide the whole lighting logic of the interior. Glass partitions create a multi-layered space of "separated yet see-through" (foreground → glass → mid-ground → glass → background). In Seedance 2.0, describe "light entering through window at specific angle" prominently so the model understands the direction of the source
- **Street/street trees/crosswalk/traffic flow** — the spatial skeleton of exterior scenes. An empty long street = solitude, heavy traffic = urban alienation, wet road after rain reflecting streetlights = emotional intensity. In Seedance 2.0, street scenes must state an executable optical description such as "wet road surface reflecting streetlights" or "dry pavement with long afternoon shadows"
- **Streetlight/window light/screen light/headlights** — the core narrative carriers of light in the urban world. Warm yellow streetlight (2000-2200K sodium or 3000K LED) = the body temperature of night; the cool white fluorescents of a convenience store (4000-5000K) = the safe-house island of the late-night city; the cool blue of a phone screen on a face = the lonely company of being alone
- **Old-town alleys/high-rise apartments/office towers/subway stations** — four narrative containers of urban architecture. The mottled walls and overhead wires of the old town = the memory of street life; looking down on the city from a high floor-to-ceiling window = the loneliness or control of the elite; the layered reflections of office glass partitions = the order and distance of the workplace; the cool fluorescents of a subway station plus tunnel darkness = a pause inside the city's flow
- **Use scene insert shots to bridge passages** — insert shots are emotional buffers; do not hard-cut. Insert shots of the same space at different times or weather (rainy street → sunny street) can imply the passage of time. In Seedance 2.0, insert shots need a stated light-source logic; an insert shot has emotion too
- **Turning points are made with images, not lines** — an abrupt lighting change (cloud covers the window light → the space suddenly darkens), a jump cut in shot size (medium shot 中景 → extreme close-up 大特写), a spatial transition (interior → the street outside the window), a focus drift — the camera does the storytelling

---

## 5. Live-Action Urban score and ambient sound

### 5.1 Instrument choice for the score

The Live-Action Urban score is led by acoustic instruments with restrained electronic elements, aiming at "a presence that never steals the scene":

- **Piano** — the core instrument of cold solitude and tender, delicate passages. It is at its best on repeated single notes or sparse chords — the silence between notes matters as much as the notes
- **Strings** — the driving force of passages that build and release emotion. Low and mid register as a bed (warm but not oppressive), high register touched briefly at emotional peaks and then withdrawn
- **Acoustic guitar** — the ground color of everyday slack, healing and urban-stroll passages. The texture of fingerpicking or light strumming, carrying the warmth of "afternoon sunlight" on its own
- **Electric guitar (clean/slightly overdriven)** — the emotional amplifier of urban nights, walking the streets alone and mildly melancholic passages. Single-note melodic lines or ambient arpeggios; use distortion sparingly
- **Electronic ambient pad** — the low-frequency bed of urban suspense, night transitions and passing-of-time passages. It exists as the layer that "can be ignored but would be wrong if removed"
- **Harmonica/accordion** — the finishing-touch instrument of street-life and nostalgic-memory passages. Not to be used throughout; its local appearance is itself a narrative signal
- **Light electronic beats** — the rhythmic base of urban-tempo passages (commuting montage, fast cuts of the city at night). Broken beats or minimal electronic drums, not above 80BPM
- Use sparingly: full orchestral tutti, heavy-metal distortion, high-energy EDM — these turn Live-Action Urban into "the score doing the acting"

### 5.2 Score combination strategy

| Emotional stage | Instrument combination |
|---|---|
| Calm opening/everyday narrative | Solo piano, or piano + a very light electronic pad |
| Warmth and healing/relaxed routine | Acoustic guitar + piano + a light string bed |
| Workplace elite/peak moment | Piano + mid-high strings + light electronic beats |
| Loneliness and solitude/longing | Sparse single-note piano, or piano + harmonica accents |
| Emotional turn/moment of fate | Strings swelling + piano closing it off |
| Suspense setup/urban night | Electronic ambient pad + light electronic beats + clean single-note electric guitar |
| Street life/nostalgia | Acoustic guitar + accordion/harmonica accents + very light strings |
| Ending/afterglow | Single piano notes thinning out → ambient sound alone |

### 5.3 Live-Action Urban ambient sound

> Ambient sound is the "auditory material" of a Live-Action Urban scene; it decides how immersive the space feels. Mark 1-2 core ambient sounds per scene.

**Core ambient sound layers:**
- **Interior ambience**: air-conditioning hum/keyboard typing/elevator chime/dripping tap/refrigerator compressor running/curtain stirred by wind/clock ticking
- **Exterior ambience**: tire noise of traffic/distant voices/wind through buildings/rustling street-tree leaves/birdsong/rain on car windows and pavement/muffled construction/the beep of a shared bike locking
- **Transitional ambience**: subway arrival announcement and braking/mall background music and crowd noise/elevator running and door chime/footsteps approaching down a corridor
- **Silence is also an ambient sound**: a late-night apartment with only the low hum of the fridge, a street at 5 a.m. with not even traffic — this "absence of sound" is itself narrative

Sound-design philosophy:
- Ambient sound is not pasted on; it is the sound the scene already has
- At a key moment, "pulling out" the ambient sound creates more emotional impact than "adding" an effect
- A change of ambient sound can imply a change of space — walking from a noisy street into a quiet convenience store, the sound suddenly "goes clean"

---

## 6. Dedicated Seedance 2.0 adaptation

### 6.1 Core adaptation principles

> Seedance 2.0 is a video model that prioritizes realistic physical simulation. The Live-Action Urban style is naturally close to Seedance 2.0 — but "photographic terminology" must be translated into "physical instructions" the model can execute.

| Adaptation dimension | Generic prompt wording | Seedance 2.0 optimized wording |
|---|---|---|
| Light description | Warm window light | Afternoon sunlight entering at 45° through the window on the right of frame, color temperature about 4500K warm white, casting an elongated window-frame shadow on the floor |
| Expression | A gentle look | Corners of the mouth lifting naturally, fine laugh lines at the outer eye, natural catchlights in the eyes while looking at the other person |
| Action | Turning around | Rotating slowly about 90 degrees to the right, weight shifting from the left foot to the right, about 1.5 seconds in total, the hem of the clothes swinging naturally while turning |
| Material | Real skin texture | Pores faintly visible on the cheeks, a slight natural oil sheen on the T-zone, neither retouched nor silicone-like |
| Weather | A rainy street | Fine rain, wet road reflecting warm yellow spots of streetlight, rain streaks on the window glass slightly blurring the street outside |

### 6.2 Image-quality base (exclusive to Seedance 2.0 Live-Action Urban)
1080p, live-action cinematic texture, real skin texture, natural light and shadow, 24fps film frame rate, handheld breathing or gimbal flow, real grain structure, not CG and not rendered
### 6.3 Lighting instructions (exclusive to Seedance 2.0 Live-Action Urban, chosen by lighting scheme)

| Lighting scheme | Seedance 2.0 lighting instruction |
|---|---|
| A Urban molten gold | Natural sunset light entering at 45° from the side, color temperature about 3000-3500K warm gold, 5500K sky ambient as shadow fill, lighting ratio about 1:3 |
| B Daytime clarity | Broad diffused window light, color temperature about 5000-5500K neutral cool white, curtains softening the light, no hard shadows, lighting ratio about 1:1.5 low contrast |
| C Warm street-life light | Warm desk lamp as key light, color temperature 2800-3200K, shadows keeping the outlines of objects, lighting ratio about 1:4 warm envelope |
| D Cool sharp shadow | Hard window light from the side, cool white 5000K as key, shadows deep but detailed, lighting ratio about 1:8 high ratio |
| E Interior diffusion | Natural window diffusion 4500-5500K as key, interior ceiling light as neutral fill, soft shadow transitions, lighting ratio about 1:2 |
| F Rainy-night sheen | Wet ground reflecting warm streetlight spots 2800K, ambient cool 6000K, light scattered by rain streaks on the window glass, lighting ratio about 1:6 warm and cool coexisting |
| G Blue-hour poem | Deep blue-violet sky diffusion after sunset about 8000-10000K, the first warm artificial light points at 2800K, lighting ratio about 1:5 cool base with warm points |

### 6.4 Making physical logic concrete (exclusive to Live-Action Urban)

> Seedance 2.0 can understand the physical laws of the real world. Every action must be described with concrete numbers and physical behavior; "thereupon", "and then", "appropriately" are forbidden.

| Scene | Abstract wording (forbidden) | Seedance 2.0 concrete wording |
|---|---|---|
| Getting up and leaving | Then stands up | Both hands press on the chair arms, knees move forward, after 0.5 seconds the body's weight shifts forward onto both feet, after another 1 second standing upright — about 2 seconds in total, then a 0.5-second pause once upright |
| Turning the head | Turns the head to look out the window | The head rotates slowly about 45 degrees to the right, the gaze moves from the coffee cup on the desk to the city skyline outside, the rotation takes about 1 second, and the gaze rests in the distance once it arrives |
| Pouring coffee | Poured a cup of coffee | The right hand holds the handle of the coffee pot, the spout tilts about 30 degrees, dark brown coffee pours into a white ceramic cup, the liquid rises from the bottom to two thirds of the cup, about 3 seconds in total, steam rising slowly from the rim |
| Walking in the rain | Walking alone in the rain | Walking slowly on the wet road, about one step per second, each footfall making fine ripples where the sole meets the water, warm yellow streetlight forming an elongated reflection on the wet road, raindrops visible under the streetlamp |

### 6.5 Making spatial logic concrete (exclusive to Live-Action Urban)

**Standard for defining spatial coordinates:**
- **Horizontal position**: the left third of frame / the center of frame / the right of frame, or relative to a fixed object in the scene ("1 meter from the floor-to-ceiling window")
- **Depth position**: foreground (1-2 m from the camera) / mid-ground (3-5 m from the camera) / background / the distant view outside the window
- **Between characters**: relative distance and facing ("A and B face each other about 0.8 m apart, A slightly left, B slightly right")
- **Character-to-space relation**: distance and direction relative to a fixed object in the scene

**Example of matching positions across a cut:**
[End of clip A]
A stands in front of the floor-to-ceiling window, about 0.5 m from it, facing outside, positioned center-right of frame.
The body turns slightly right by about 20 degrees, the right hand lifts and sets the coffee cup on the side table to the right.

[Start of clip B]
A's right hand has just left the cup, the cup is on the side table. A still stands in front of the floor-to-ceiling window, position unchanged.
The sky outside has gone from dusk to blue hour, and the desk lamp indoors is already on.
### 6.6 @reference mandatory anchoring syntax

> The character/scene/prop consistency of Seedance 2.0 relies on the @reference syntax.
Character anchoring: must cite @ImageX and state its purpose
Example: @Image1_职场女性_commuting suit as the character appearance reference, @Image2_写字楼_floor-to-ceiling-window office as the scene environment reference

Scene anchoring: must cite the @ImageX of the corresponding scene asset
Prop anchoring: if there is a held or core prop, cite the corresponding @ImageX

### 6.7 Best practice for multi-shot sequences (Seedance 2.0 Live-Action Urban)

> For Seedance 2.0, 2-3 shots per clip are recommended, total length 4-12 seconds.
[Shot 1: 中景 · 固定] In front of the office floor-to-ceiling window, A stands in profile holding a coffee cup and looking outside.
Afternoon window light enters at 45° from the right (about 4500K), casting a long window-frame shadow on the floor.
A is center-right of frame, about 3 m from the camera. Duration about 4 seconds.

[Cut to]
[Shot 2: 近景 · 缓推] A's face turns slowly from 45° profile toward the camera.
The corners of the mouth lift, the gaze comes back from outside, with natural catchlights of window light in the eyes.
Facial pores and skin texture are visible, not retouched. Duration about 3 seconds.

[Cut to]
[Shot 3: 特写 · 固定] A's hand sets the coffee cup on the side table, the base meeting the wooden top with a soft knock.
Window light plates a warm gold rim on the cup's mouth. Duration about 2 seconds.

### 6.8 Live-Action Urban Seedance 2.0 negative words (no more than 7)
3D render, CG animation, plastic mask face, retouched skin, non-live-action texture, floating objects, flickering image

---

## 7. Global narrative constraints

- **An insert shot is an emotion** — between narrative passages, a scene insert shot (the same space under different light) is recommended as an emotional buffer. An insert shot is not "nothing to shoot"; it is "letting the audience breathe"
- **Continuity and change of light** — within the same space, the angle of window light in a daytime passage should change continuously with time. If a dialogue scene spans half an hour, the position of the window light should have moved a little — Seedance 2.0 can understand this "reasonable imperfect consistency"
- **Consistent light source across characters** — within one shot, the direction of the light on every character's face must be unified. If the key light comes from the left, everyone's left cheek should be the lit side
- **Avoid "over-directing"** — Live-Action Urban seeks "life captured by a camera", not "plot arranged by a screenwriter". Allow uncontrollable everyday details in frame (wind moving a curtain, a cat passing by, a slight ripple in the coffee cup)
- **The value of silence** — not every shot has to be filled with action and dialogue. A three-second static (静止) close-up (特写) — the character merely breathing, blinking, existing — is often more powerful than any line

---

## 8. Quick decision card

### Emotion → lighting scheme + score lookup

| Emotion | Lighting scheme | Score direction |
|---|---|---|
| Warm everyday | C Warm street-life light or E Interior diffusion | Acoustic guitar + piano |
| Workplace restraint | E Interior diffusion or B Daytime clarity | Piano + light strings |
| Lonely longing | F Rainy-night sheen or G Blue-hour poem | Sparse single-note piano |
| Peak moment | A Urban molten gold | Piano + strings |
| Suspense and tension | D Cool sharp shadow | Electronic pad + light beats |
| Healing and new beginnings | B Daytime clarity | Acoustic guitar + piano |
| Street life | C Warm street-life light | Acoustic guitar + accordion |
| Poetic pause | G Blue-hour poem | Piano into ambient sound alone |
