---
name: liveaction_urban_storyboard_table
description: Storyboard-table Live-Action Urban constraints — defines the specifications of the Live-Action Urban style inside the storyboard table for lighting and atmosphere, photographic texture, action rhythm, environmental motion, camera movement and transition taboos, with deep adaptation for Seedance 2.0. Applies to any urban narrative genre.
metaData: director_skills, seedance2.0_adapted
---

# Storyboard-table Live-Action Urban constraints · Live-action urban shooting · Technique reference

---

## 1. What the storyboard table is for

The storyboard table is the director's core tool for turning a script into camera language. These constraints target Seedance 2.0 video generation: every description of light, action and space uses concrete language the model can execute. No abstract emotional summaries, no render parameters the model cannot read.

---

## 2. Seedance 2.0 iron rules of description

> Every description in a Live-Action Urban storyboard table must obey the following translation principle — translate "director's intent" into "physical instructions the AI can execute".

| Forbidden abstract phrasing | Seedance 2.0 concrete replacement |
|---|---|
| She is very sad | Brows and eyes lowered, gaze unfocused toward the floor, corners of the mouth sinking naturally, the right hand unconsciously rubbing the left wrist |
| The sunlight is lovely | Afternoon sunlight entering at 45° through the window on the left (about 4500K warm white), casting a rectangular patch of the window frame on the floor |
| The street is busy | The warm yellow lights of the street-front shops all on (about 3000K), five pedestrians walking slowly along the pedestrian street, one of them pushing a stroller |
| He turns and leaves | Rotating slowly about 90 degrees to the right, facing the right of frame, the right foot stepping out about 0.6 m first, the left foot following, about 2 seconds in total |
| The atmosphere is oppressive | A single hard window light from the side (cool white about 5000K) striking at an angle, the rest of the room deep and dark but with faint outlines visible, lighting ratio about 1:8 |
| Wind moves the curtain | The white sheer curtain billows about 15cm from the breeze outside and falls back, repeating on a cycle of about 2 seconds |

---

## 3. Light and atmosphere — Seedance 2.0 physical light-source description

### 3.1 Unified lighting within a scene

No more than two core lighting schemes should appear within one scene, unless there is a narrative-driven change of source (someone turns on a desk lamp, daylight after sunrise outshines the indoor lamps, a move from indoors to outdoors). A change of light source must be marked in the storyboard table with its triggering event.

### 3.2 Light-source syntax (every shot must contain it)
[Light] Key: {source type}, {direction}, {color temperature value K}, {soft/hard}
[Light] Fill/ambient: {source type}, {direction}, {color temperature value K}
[Lighting ratio] About 1:{X}
### 3.3 Emotion → light-source matrix

| Emotion | Light recipe (can be dropped straight into Seedance 2.0) | Visual keywords |
|---|---|---|
| Workplace restraint | Cool white window light as key (5000-5500K) entering from the side of the floor-to-ceiling window, cool screen light (6500K) as facial fill. Lighting ratio about 1:3 | Neutral leaning cool, materials clear |
| Everyday slack | Broad diffused window light (5000K), curtains softening it. Lighting ratio about 1:1.5 low contrast | Clear, low contrast, healing |
| Warm intimacy | Warm desk lamp as key (2800-3200K), shadows keeping object outlines. Lighting ratio about 1:4 | Warm envelope, private |
| Street-life warmth | Mixed sources — warm yellow sodium streetlight (2000-2200K) dominant, cool white shopfronts (4000K) as local counterpoint. Lighting ratio about 1:5 | Warm-dominant, lively |
| Rainy-night loneliness | Wet road reflecting warm yellow streetlight spots (2800K), ambient cool (6000K sky diffusion), rain streaks on the window glass scattering light. Lighting ratio about 1:6 | Warm and cool coexisting, poetic loneliness |
| Suspense and tension | A single hard window light from the side (cool white 5000K), high ratio about 1:8, shadows deep but with faint outlines. Lighting ratio about 1:8 | Oppressive, uncertain |
| Healing and new beginnings | Ample diffused natural light (5000-5500K), skylight + ground reflection as fill. Lighting ratio about 1:1.5 | High key and clear, hopeful |
| Late-night fragility | A single warm source — desk lamp/streetlight outside the window (2800-3200K) lighting like an island, one side of the face lit and the other dark. Lighting ratio about 1:8 | Minimal source, private and fragile |

### 3.4 Warm-cool tone and narrative stage

- **Cool-dominant** (5000K+): workplace restraint, suspense and tension, cold solitude, rainy nights
- **Warm-dominant** (2000-3500K): tender intimacy, street-life warmth, home routine, golden hour
- **Warm and cool coexisting**: transitional moments (blue hour + the first warm lamps), rainy nights (cool ambient + warm light spots)
- **A change of light = a narrative signal**: the sky outside the window shifting from daytime cool white to evening warm gold = time passing; walking from the cool white of the office out under warm yellow streetlights = a switch of scene and emotion

### 3.5 Seedance 2.0 lighting adaptation notes

- Color-temperature numbers help the model calibrate its white-balance tendency: `color temperature about 3200K` beats `warm light`
- Lighting-ratio numbers help the model build a sense of light and dark: `lighting ratio about 1:4` beats `soft shadows`
- The light source must have a clear origin: `entering at 45° through the window on the left of frame` beats `side light`
- Describe the reflection path of ambient light: `wet road reflecting warm yellow spots of streetlight` beats `warm reflections on the ground`

---

## 4. Environmental motion — let the frame breathe

### 4.1 Motion density

Arrange at least one shot with environmental motion every 3-4 shots. Static dialogue scenes are no exception — at least one shot must have leaves moving outside the window, steam rising from a coffee cup, or a curtain stirred by the breeze.

### 4.2 Urban environmental motion elements (executable by Seedance 2.0)

| Scene | Environmental motion you can describe |
|---|---|
| Interior | The curtain billowing about 10cm from a breeze and falling back (about a 2-second cycle), steam rising slowly from the coffee cup, a small insect crossing the pool of desk-lamp light, headlights outside occasionally sweeping across the ceiling |
| Street | Street-tree leaves rustling, a distant pedestrian waiting at the crosswalk then walking on, a bicycle riding slowly across the mid-ground of frame, a puddle at the curb rippling as a wheel rolls through |
| Café/restaurant | Steam rising from the coffee machine, the light on the window seat brightening and dimming as clouds move outside, the repeated motion of staff wiping glassware at the counter, the door chime rung by the draft as someone pushes the door |
| Office | Blind stripes moving slowly as the light angle outside changes, a computer screensaver switching over, the water cooler occasionally letting out a "glug" of bubbles, the printer feeding out paper |
| Late-night venues | The convenience store's automatic door opening and closing again and again, the traffic light casting alternating red/green on the crosswalk, the headlights of an occasional passing car sweeping a band of light across the ceiling |
| Rooftop | Clothes on the line moving in the wind, a light in the distant skyline occasionally coming on or going out, clouds moving slowly across the sky |

### 4.3 Seedance 2.0 specification for describing environmental motion

- Motion must have a concrete path and speed: `leaves moved by the wind, about 2-3 small sways per second` beats `the tree is moving`
- Motion of light must agree with the spatial light-source logic: `when a cloud covers the sun, the area of window light indoors shrinks by about 40% and recovers after about 3 seconds`
- Motion with no source is forbidden: no wind blowing = the curtain does not move. No window open indoors = no wind

---

## 5. Rhythm of character action — Seedance 2.0 concrete physical logic

### 5.1 Iron rules of action description

Every character action must be described with: **path + speed/duration + coordination of body parts + effect on surrounding objects**.

### 5.2 Concrete library of everyday actions

| Action | Description Seedance 2.0 can execute |
|---|---|
| Standing up | Both hands press on the chair arms, knees move forward, after 0.5 seconds the body's weight shifts forward onto both feet, after another 1 second standing upright — about 2 seconds in total, then a pause of about 0.5 seconds once upright |
| Turning the head | The head rotates slowly about 30 degrees to the right, the gaze moves from the documents on the desk to outside the window, the rotation takes about 1 second, and the gaze rests in the distance for about 1 second once it arrives |
| Drinking coffee | The right hand holds the handle, the rim comes to the lips, the cup tilts about 15 degrees, the liquid touches the upper lip, a small sip of about 1 second, the cup lowering back to its place in about 1 second |
| Walking to the window | Rising from the office chair (about 2 seconds), walking at an even pace about 4 steps toward the floor-to-ceiling window on the right of frame (about 3 m, taking about 3 seconds), stopping about 0.5 m from the window |
| Sitting down | The body leans forward with knees slightly bent, the hips meet the seat, the seat compresses about 2cm (spring/foam deformation), the back settles naturally against the backrest — about 1.5 seconds in total |
| Putting an object down | The right hand lowers the coffee cup from chest height to the desk, the base meeting the wooden top with a light knock, the fingers releasing the handle — about 1 second in total |
| Pushing a door open and entering | The right hand grips the handle and turns it down about 30 degrees, pushes the door inward to about 70 degrees, the body follows the door in, the right foot crossing the threshold first — about 2 seconds in total |
| Looking at the phone | The right hand picks the phone (about 15cm long) up from the desk, the thumb taps the lower screen to wake it, the cool screen light falls on the right side of the face, the eyes narrowing slightly to focus on the screen — about 3 seconds in total |
| Putting on a coat | The right hand goes into the right sleeve, the left hand reaches back into the left sleeve, both shoulders open slightly backward to settle the coat on the shoulders, the collar folding out naturally — about 4 seconds in total |
| An embrace | A steps forward about 0.5 m, both arms wrap around B's shoulders and back, the hands crossing lightly behind B's back, the face close to B's ear, held for about 3 seconds |

### 5.3 Action rhythm and narrative scene

- **Everyday narrative/dialogue scenes**: actions steady and restrained, every micro-action annotated with duration and path. The rhythm is unhurried — not slow, but "not rushed"
- **Scenes of emotional swing**: the amplitude and speed of actions increase slightly. A character may unconsciously speed up tapping fingers on the table during dialogue, or breathe so that the shoulders rise and fall more visibly
- **Conflict scenes**: actions crisp and decisive, but still with a physical path. A blow/shove must be specific: "the right hand pushes at the front of the other's left shoulder, the other's weight shifting back about 20cm"
- Forbidden: piling up fast actions with no narrative reason, teleporting with no physical logic, vague descriptions such as "made a gesture"

### 5.4 Costume motion

The motion of real clothing is a natural asset of the image — not "cloth simulation parameters", but "the hem of the trench coat lifted about 20 degrees by the wind", "one end of the scarf sliding off the shoulder", "the skirt swaying about 10cm left and right with each step". Annotate these costume motion details in the shot description of the storyboard table.

---

## 6. Concrete spatial logic — the Seedance 2.0 spatial coordinate system

### 6.1 Spatial information every shot must declare
Horizontal position: left/center/right of frame, or the left third of frame
Depth position: {value} meters from the camera, foreground/mid-ground/background
Relation between character and scene: {value} meters from {fixed object}
(If two or more people) the relative distance and facing of characters A and B
### 6.2 Example of matching positions across a cut
【End of clip A】
A stands in front of the floor-to-ceiling window, about 0.5 m from it, facing outside, positioned center-right of frame, about 4 m from the camera.
Outside is the afternoon city skyline, sunlight entering at an angle through the window on the right of frame.
A holds a coffee cup in the right hand at chest height, the cup about 15cm from the lips.

【Start of clip B】
A's coffee cup has just come down about 10cm from the mouth, the cup still at chest height. A still stands in front of the floor-to-ceiling window (position unchanged).
The sky outside has turned to blue hour — deep blue-violet sky, the outline lights of the buildings and the streetlights already on.
The desk lamp indoors is on (side table on the left of frame), its warm yellow light (about 3000K) falling on A's left cheek.
### 6.3 Spatial change must be concrete

| Abstract (forbidden) | Seedance 2.0 concrete |
|---|---|
| She came closer | A walks at an even pace 4 steps (about 3 m) from the background of frame (about 5 m from the camera, at the doorframe) toward the camera and stops about 2 m from the camera — taking about 4 seconds |
| The two face each other | A is center-left of frame (about 3 m from the camera), B is center-right of frame (about 3 m from the camera), the two facing each other about 0.8 m apart |
| From indoors to outdoors | A walks from indoors (about 3 m from the camera) to the door, pushes it open (the door swinging inward about 80 degrees), the right foot crossing the threshold into the street outside — the warm yellow streetlight outside instantly replacing the cool white fluorescents indoors |

---

## 7. Camera-movement specification — Seedance 2.0 camera motion

### 7.1 Permitted camera movement

| Camera movement | Seedance 2.0 description | Use case |
|---|---|---|
| 固定 (locked off) | The camera stays locked off (固定) and does not move, the frame static (静止) | Dialogue, everyday life, insert shots as breathing space, emotional gazing |
| 手持微晃 (slight handheld sway) | The camera has slight irregular shake (amplitude about ±2cm), simulating the breathing of handheld shooting | Emotional swings, street walking, intimate following, subjective viewpoint |
| 稳定器流动 (gimbal flow) | The camera moves smoothly at an even pace, no shake | Urban strolling, a character's entrance, showing a space, transitions |
| 缓推 (slow push in) | The camera pushes in (推进) slowly toward the subject, push-in (推进) rate about 0.3 m per second | Emotion rising, truth closing in, attention focusing |
| 缓拉 (slow pull back) | The camera pulls back (拉远) slowly, pull-back (拉远) rate about 0.3 m per second | Parting, closing off, revealing the whole picture |
| 跟拍 (following shot) | The camera moves in sync with the character keeping about 2 m distance | Walking along, tracking through the city |
| 摇镜 (pan) | The camera rotates horizontally/vertically on the spot | Shifting the line of sight, laying out spatial relations |

### 7.2 Forbidden camera movement

- Fast whip pans (甩镜) with no narrative purpose, abrupt push-ins and pull-outs (push/pull rate above 1 m per second)
- Violent handheld shake lasting more than 3 seconds (unless the narrative is subjective impact/dizziness)
- Illogical fancy transitions — wipe, spin, blinds, page turn and other effect transitions
- The camera rotating 360 degrees for no reason

### 7.3 Live-Action Urban camera-movement philosophy

- The locked-off camera position (固定机位) is the first choice — let the audience see real people existing naturally in a real space
- Slight handheld sway is for emotional passages — but the amplitude must not exceed the normal range of documentary film style
- The start and end of a moving shot must be steady and the movement even — sudden acceleration or an abrupt stop is forbidden

---

## 8. Transition specification

### 8.1 Permitted transitions

| Transition | Visual execution | Narrative function |
|---|---|---|
| Hard cut | Cut straight over | Shot changes within one scene (default) |
| Lighting-match transition | Two scenes cut together under similar lighting logic | Time passing, parallel narrative. Example: morning light outside the window at A → morning light outside the window at B |
| Space-match transition | Two spaces echo each other in composition or elements | Scene jump. Example: the moment the office door closes → the moment the apartment door opens |
| Insert-shot transition | Insert a scene insert shot (3-5 seconds) | Emotional buffer, chapter division, hinting at time passing |
| Focus transition | The focus of the outgoing shot moves from subject to background, the incoming shot pulls the subject gradually into focus out of a blurred background | Change of space, shift of attention |

### 8.2 Forbidden transitions

- Pure visual-effect transitions (page turn, wipe, blinds, mosaic)
- Spin/zoom transitions with no narrative logic
- Using more than two kinds of transition within one scene

---

## 9. Sound-picture sync planning (exclusive to Seedance 2.0)

### 9.1 Specification for annotating ambient sound

Mark 1-2 core ambient sounds per scene, written in the ambient-sound column of the storyboard table:

| Scene | Suggested ambient sound |
|---|---|
| Office | Light keyboard typing / air-conditioning hum / a printer in the distance |
| Café | Coffee-machine steam / glassware clinking / faint background voices |
| Street by day | Tire noise of traffic / distant voices / wind through street-tree leaves |
| Street on a rainy night | Rain on car windows and pavement / an occasional car splashing past |
| Home at night | The low hum of the fridge / an occasional car outside / a clock ticking |
| Rooftop | Wind / the faint hum of the distant city |
| Subway station | Arrival announcement and braking / the footsteps of the crowd |

### 9.2 Annotating sound-picture sync

Mark the key sound-picture sync points in the storyboard table:
- `t=2s` the light knock of the cup base meeting the table as the coffee cup is set down
- `t=5s` the faint creak of the door hinge as it is pushed open — the character enters, and the street sound outside is instantly muffled by the door
- `t=8s` an ambulance siren from far outside the window — the character looks up out the window for about 1 second

---

## 10. Seedance 2.0 storyboard card template

Every shot uses the card format below, filled in shot by shot in the storyboard table:
【Shot X】Duration: {value}s | Shot size: {大特写/近景/中近景/中景/全景/大全景/空镜}

Shot description:
{character motion — with concrete action path, duration, coordination of body parts}
{character expression — with gaze direction and micro-expression detail}
{light-source logic — key light type + direction + color temperature K + lighting ratio}
{environmental detail — with concrete props, material surfaces, use marks}
{costume motion — how the clothing behaves if wind or the action moves it}

Spatial coordinates:
Horizontal {left/center/right of frame, concrete distance from the edge} | Depth {value meters from the camera}
{relation and distance to fixed objects in the scene}
{if two or more people, the relative distance and facing between characters}

Camera movement: {固定/手持微晃/缓推/缓拉/跟拍/摇镜}
{the concrete rate and the start and end positions of the movement}

Transition: {hard cut/insert-shot transition/lighting match/space match — mark the joining point between the outgoing and incoming shots}

Ambient sound: {1-2 core ambient sounds}

Seedance 2.0 key anchoring:
Character anchoring: @ImageX_{character name} {look description}
Scene anchoring: @ImageX {scene name} {space description}
{Prop anchoring: @ImageX {prop name} — if there is a core held/interacted prop}
---

## 11. Specification for insert shots

### 11.1 An insert shot is not "nothing to shoot"

An insert shot is a container of emotion. Every insert shot must have a narrative purpose and concrete visual content:

| Insert shot type | Narrative purpose | Example |
|---|---|---|
| Establishing the scene | A new space appears for the first time — let the audience see clearly what this place is | Office wide establishing shot (大全景): the rows of desks, the floor-to-ceiling window, the city outside |
| Emotional buffer | A breath after a high-emotion passage | Raindrops sliding down the glass outside the window at about 2cm per second |
| Time passing | Hinting that time has gone by | The sky outside the same window shifting from afternoon azure to deep blue-violet |
| Metaphorical pause | Feeling expressed through an object | A half-finished cup of coffee on the table, a lipstick mark on the rim |
| Transition link | The natural passage between two spaces | The fluorescent tube in the stairwell — the previous scene was the office, the next is the rooftop |

### 11.2 Seedance 2.0 specification for describing insert shots

Insert shots must also obey the iron rule of light + texture + motion in description: afternoon window light enters at an angle from the right (about 4500K), casting the stripes of the blinds onto the empty meeting table,
the stripes slowly changing width and position as the clouds move outside, going fully dark after about 5 seconds — a cloud has covered the sun.
The tabletop has fine scratches and the ring marks of water glasses left by a meeting.

---

## 12. Storyboard-table quality self-check list

Once the storyboard table of a scene is finished, the director checks item by item:

| Check item | Passing standard |
|---|---|
| Light is traceable | Every shot can answer "where the light comes from and at what color temperature" |
| Action is executable | Every action has a path, a duration and body parts |
| Space is locatable | Every shot marks the horizontal and depth position of the character |
| Positions match across cuts | The position/posture of the same person in adjacent shots can be joined up |
| The environment moves | At least 1 shot with environmental motion every 3-4 shots |
| No empty phrasing | No unexecutable descriptions such as "she is beautiful" or "the mood is good" |
| Zero CG terms | No CG vocabulary such as PBR/SSR/AO/volumetric light/next-gen |
| @reference complete | Character/scene/core props all carry an anchoring citation |
