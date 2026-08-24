---
name: storyboard_table_techniques
description: >-
  General storyboard table technique reference.
  Covers the general techniques of storyboard design — the principles of splitting shots, the rules for establishing shots and shot merging, the iron rules of visual continuity, guidance on filling in the fields, transition rules and so on — for an Agent to activate and use.
---
# General storyboard table techniques

This document is the general technique reference for storyboard table design and applies to every Agent situation that needs a storyboard table built.

---

## Principles of splitting shots

**Start a new shot when**: the scene/location changes, time jumps, the subject of the shot changes, the shot size changes noticeably, or at an important beat of action

**No new shot needed for**: continuous conversation within the same picture, a slight change of expression or a small movement

Granularity: one independent picture = one shot; roughly every 35-70 words of script corresponds to 1-2 shots. A transition, if it is described explicitly, is also split out on its own.

---

## Rules for establishing shots and shot merging (against redundancy)

**Establishing shot**: the establishing of each new scene/section is done in at most 1-2 shots; splitting it into 3 or more fragments is forbidden.
- Recommended: 1 远景 with a 缓推 slow push (establishing + introducing the subject in one shot), or 1 大远景 to establish + 1 全景 to introduce the subject
- Forbidden: the redundant three-part form of an empty shot of the environment → then a local detail → then the character arriving

**Shot-merging self-check**:
- If one shot can convey it, do not split it into two — if one shot with a camera movement can do the establishing and the introduction at once, do not split it in two
- Consecutive shots describing different parts of the same space (courtyard gate → vines → side room) should be merged into one shot, with the shot description covering the several layers of space
- A purely decorative shot (showing environmental detail with no narrative advance — 叙事推进) should be merged into a shot that has a narrative function
- **The director's-thinking test**: once written, self-check — if a real director would shoot 2-3 adjacent shots as 1, the split is too fine and they should be merged

**The one-take strategy**: when adjacent shots have **continuous change of action, slight change of scene (movement within the same scene) or a gradual change of camera angle**, you may mark 「一镜到底」 in `cameraMove` or `description` and merge several fragmentary shots into one continuous long take.
- **When it applies**: a character walking through a space, following an action from point A to point B, 环绕 orbiting a character to show the environment, an establishing 缓推 slow push into a 特写 of the subject, and so on
- **How to mark it**: state the camera path in `cameraMove` (such as "一镜到底：缓推远景→跟移至院内→落幅全景" — one take: slow push on the long shot, track into the courtyard, settle on the wide shot) and describe the opening and closing framings in `description`
- **Relaxed duration**: because a one-take shot keeps renewing its information, it may exceed the 6s single-shot limit, but not 12s
- **Risk note**: a one-take raises the difficulty of rolling a usable generated picture (the continuity demands are high); use it only where the gain in narrative flow clearly outweighs cutting, and do not overuse it

**The golden 6-second rule**: when a 无台词 (no dialogue) shot accumulates more than 6s with no new information (dialogue/action/change of subject), the audience's attention breaks. Watch this especially with establishing and transitional shots — better to merge and compress than to drag

---

## The iron rules of visual continuity (obeyed throughout storyboard design)

**① Continuity of action**: between adjacent shots, the character's position, progress through the action and facing must be physically consistent. If the previous shot leaves the hand halfway up → the next shot must continue from that halfway state and cannot suddenly draw it back.

**② The law of shot-size progression**: shot-size changes follow progressive focusing or progressive release —
- Progressive focusing: 远景→全景→中景→近景→特写 (emotion tightening)
- Progressive release: 特写→近景→中景→远景 (emotion releasing)
- Consecutive shots at the same shot size with no narrative reason are forbidden (3 or more consecutive shots at the same shot size = visual fatigue)

**③ Conservation of the axis**: the 180-degree line principle — in a conversation/confrontation scene the characters' positions in the frame stay on the same side throughout the film (全片固定同侧), and the line must not be crossed

**④ Spatial logic of facing**: two people in conversation face each other, someone handling an object faces the object, someone gazing into the distance faces the distance. Facing the camera indiscriminately is forbidden

**⑤ Awareness of information control**: every shot must be aware of "what the audience knows and does not know at this moment" —
- Show the hand and not the face = suspense; sound before picture = anticipation; only the back = detachment; the full reveal = the climax paid off

**⑥ Beat-density constraint**: the number of actions/events in one shot must match its duration, preventing too much being packed in —
- 1 physical action = 1 beat, 1 camera movement = 1 beat, 1 short line (≤7 words) = 1 beat
- A 2-3s shot: at most 1 beat; a 4-6s shot: at most 2 beats; a 7s+ shot: at most 3 beats

**⑦ Head and tail safety zones**: the first 0.5s and the last 0.5s of every shot are a safe transition zone; put no key action or the start of a line there. The first 0.5s is for establishing the environment or a static reveal of the subject, and the last 0.5s is for the action to settle naturally.

---

## Guidance on filling in the fields

**description** (Shot description): one sentence describing the core content of the picture (10-35 words), containing the visible **subject + action/state + environmental space**, with no inner life written in. It must show spatial layering (at least two of foreground/middle ground (中景)/background involved). For example: "in the foreground the gauze curtain stirs; in the middle ground (中景) the marquis's carriage arrives at the ruined courtyard on Luoyan Mountain" or "Nanny Cheng jumps down from the carriage and takes in the ruined courtyard, the distant mountains fading into dusk"

> **🚫 Lighting/colour-tone description is forbidden**: neither description nor any other field **may** contain lighting words such as `light`/`shadow`/`colour temperature`/`colour tone`/`warm tone`/`cool tone`/`backlight`/`brightness`/`high contrast`. The lighting is carried entirely and automatically by the scene asset image the shot cites — a special lighting need such as night/rain/firelight is expressed by citing the corresponding **scene derivation** (night version/rain version/firelight version). In the example above, "in the afterglow" would also break the rule and must be deleted.

**shotSize** (Shot size):

| Shot size | Description | Narrative meaning |
|------|------|---------|
| 大远景 | The whole environment | Establishing / solitude / smallness |
| 远景 | The relation of scene to character | Spatial relations / setting the mood |
| 全景 | The character full-length with the environment | A character's entrance / a full-length reveal |
| 中景 | From the knees up | Everyday narration / conversation |
| 近景 | From the chest up | Conveying feeling / the focus of a conversation |
| 特写 | The face or part of an object | Intensifying emotion / a key prop |
| 大特写 | An extreme detail | An emotional nuke / the decisive instant (use with care, 2-3 times in the whole piece) |

**cameraMove** (Camera movement): when there is no camera movement, fill in `静止`. A camera movement must state its start and end direction.

| Camera movement | Description | Narrative meaning |
|------|------|---------|
| 推 | From far to near, emphasising the subject | Emotion building / discovery / spying |
| 拉 | From near to far, showing the environment | Emotion detaching / revealing the whole / parting |
| 摇 | Rotating and sweeping from a fixed position (固定位置) | Conveying the environment / searching |
| 移 | Moving with the subject | Accompanying / tracking |
| 俯拍 | From above looking down | Observing / smallness / the whole picture |
| 仰拍 | From below looking up | Heroising / oppression |

**action** (Character action): a concrete description of the action of the character/subject in the picture (5-30 words); when there is no character action, fill in `空镜`. The format is `(carry-over note)action description`. Requirements:
- **The carry-over note goes at the front**: wrapped in half-width parentheses and placed before the action description. The first shot writes `(开篇)`; the other shots write `(承接上镜:the linking action)`, such as `(承接上镜:缓推落幅~群像定格)` (slow push settling ~ group freeze) or `(承接上镜:arm half raised → continues to rise)`
- **How to write an action chain**: write a continuous chain of physical actions + the speed and rhythm ("slowly raises the right hand → the fingertips tremble slightly → the fist clenches abruptly"); writing only a static end state is forbidden. With several characters, separate their actions with `;` and order them by the associated asset names, such as `黎雾 rubs her cuff with her right hand → gathers the rabbit toy into her chest with her left arm;聂薇 fixes her gaze on the rabbit`
- **Facing/spatial relations are no longer written in this column**: facing and spatial relations have been split into their own columns (`orientation` / `spatialRelation`) and are not marked again inside action, avoiding a clash between `|` and the markdown table column separator

**orientation** (Facing): its own column, marking the facing of the characters' faces in the picture. Format:
- With several characters, list them in `associateAssetsNames` order, separated by `;`: `角色A-3/4正面朝右;角色B-3/4正面朝左`
- With a single character the name may be omitted: `面朝右`
- An empty shot or a pure object close-up (特写) is filled in as `—`
- The facing must obey the 180° axis rule (locked within a scene; a change must be given a turn of the body/head as a linking action in `action` and this column updated in step). For the allowed values, see the facing reference table below

**spatialRelation** (Spatial relations): its own column, the relative positions of the characters in a multi-character picture. Format:
- List them in `associateAssetsNames` order, separated by `、`: `角色A(position)、角色B(position)`
- For the position values, see the spatial relations reference table below (9 positions)
- A single-character shot may fill in just one item `character(position)` or `—`; a pure object close-up (特写) or an empty shot is `—`
- It must be self-consistent with the facing, shot size and camera movement (a character facing right should have their gaze/interaction target in a position to their right); characters in the same scene and group keep stable positions, and a change of blocking must be given a linking action in `action` with this column updated in step

**A complete field example** (a group of 5):
- `action`: `(opening) 远景, 缓推 slow push towards the group, the five loosely spaced — 黎雾 slightly to the left, a rabbit toy in the crook of her left arm; 聂薇's gaze is drawn to that patch of white`
- `orientation`: `黎雾-3/4正面朝右;聂薇-3/4正面朝左;何存羽-3/4正面朝左;秋瞳-3/4正面朝左;安娜-正面`
- `spatialRelation`: `黎雾(左前)、安娜(右前)、聂薇(左后)、何存羽(中后)、秋瞳(右后)`

**Facing reference table** (for filling in the orientation column):

| Facing value | Meaning | Typical use |
|---------|------|---------|
| 面朝右 | Facing horizontally to the right of frame | A character on the left of the 180° line, or facing a target on the right |
| 面朝左 | Facing horizontally to the left of frame | A character on the right of the 180° line, or facing a target on the left |
| 正面 | Straight to camera | A confession, a declaration, looking the audience in the eye |
| 3/4正面朝右 | Three-quarter front, angled right of camera | A subject in conversation (the character on the left of frame) |
| 3/4正面朝左 | Three-quarter front, angled left of camera | A subject in conversation (the character on the right of frame) |
| 正侧面朝右 | Full profile facing right | Monologue, brooding |
| 正侧面朝左 | Full profile facing left | Monologue, brooding |
| 3/4背面朝右 | Three-quarter back, angled right | Detachment, leaving |
| 3/4背面朝左 | Three-quarter back, angled left | Detachment, leaving |
| 背面 | Back to camera | A mysterious entrance, parting, gazing into the distance |

> A tilt modifier may be added: `面朝右微仰头`, `3/4正面朝左微低头`.

**Spatial relations reference table** (for filling in the spatialRelation column; mandatory in a multi-character scene):

The frame is divided into a 3×3 position grid of「left/centre/right」columns ×「front/middle/back」layers, where front = near the camera/the foreground layer and back = away from the camera/the background layer; front/back can also express a height difference (in a high-angle shot the kneeling figure takes「中前」and the standing figure applying pressure takes「中后」).

| Position value | Meaning | Typical use |
|---------|------|---------|
| 左前 | Left of frame, near the camera | A subject in the left foreground, often the one leading the speech |
| 中前 | Centre of frame, near the camera | A single subject in the centre, or a character half-hidden by the foreground |
| 右前 | Right of frame, near the camera | A subject in the right foreground |
| 左中 | Left of frame, middle-ground (中景) layer | The left position of the middle band of a group |
| 中中 | Dead centre of frame, middle-ground (中景) layer | The core subject in the centre, the one leading the conversation |
| 右中 | Right of frame, middle-ground (中景) layer | The right position of the middle band of a group |
| 左后 | Left of frame, further back (background) | The left position of the back row, an accompanying figure |
| 中后 | Centre of frame, further back | The centre of the back row, hidden by the foreground or standing higher |
| 右后 | Right of frame, further back | The right position of the back row, an onlooker |

**emotion** (Emotion): the emotional keynote the picture conveys (1-7 words), in concrete and perceptible terms. For example "coldly disdainful", "in agonised despair", "tense and oppressive". Vague words such as "happy" or "sad" are forbidden.

**scene**: the name of the scene this shot is in, corresponding to the scene in the script

**associateAssetsNames**: the list of names of the assets **visible** in the picture (including a character/object appearing only in part), so that the associated content can be confirmed at a glance

**duration**: baseline reference — 特写/expression 2-3s · conversation 近景 3-5s · full-length reveal 3-5s · action 2-4s · 远景/empty shot/transition 3-5s · complex scene 5-8s. **A single shot does not exceed 8s**; beyond that it must be split.

**When there is dialogue, the duration must be long enough to speak all of it and must match the speaking rate of the emotion**:

| Emotional state | Speaking rate reference | Example situation |
|---------|---------|----------|
| Anger, urgency, quarrelling | ~3 words/second | Berating, urging, panic |
| Ordinary conversation, narration | ~2.5 words/second | Everyday talk, a calm statement |
| Grief, deep feeling, brooding | ~1.5 words/second | A confession, mourning, remembering |
| A whisper, weakness, dying words | ~1.5 words/second | Barely a breath, a murmur in the ear |

How to calculate: the dialogue's word count ÷ the matching speaking rate (rounded up) = the base seconds, then add the pause allowance:
- Each punctuation pause in the dialogue (comma, full stop, ellipsis, dash and so on) +0.3-0.5s
- Each emotional turn/change of tone +0.5s
- The final `duration` = base seconds + accumulated pauses + 1s of safety margin (rounded up)

**lines**: the original text of the character's dialogue, **carried over from the script without changing a word**. With several characters, arrange them in the format `character name: line`. When there is 无台词 (no dialogue), fill in `无台词`. One line corresponds to one shot; avoid packing several rounds of dialogue from several characters into one shot.

**sound** (Sound effects): pure sound-effect description, layered as「ambient sound layer + action sound layer」. For example "the wind howling in the distance + the ring of a blade". When there is no sound effect, fill in `无音效`.

> **🚫 Music/scoring is strictly forbidden**: the final product of this pipeline **contains no background music at all**. The `音效` column carries only real sound sources (ambient sound + action sound + foley); any wording such as "BGM", "scoring", "melody", or "orchestra/piano/harp/flute or another instrument used to set the mood" **always breaks the rule**, and the review will judge it a serious problem. If the script has an instrument being played as a plot action (a character playing the qin, say), you may only write a concrete physical sound source such as "the metallic vibration of fingertips plucking the strings + the hum of the resonating body".

**associateAssetsIds**: the IDs of the assets **visible** in the picture (the actual `id` field values obtained from the assets data); do not invent IDs that do not exist.
- **A character that appears is cited**: every character appearing in the picture, whether as the subject or visible only in part (a back view, a hand, a blurred silhouette and so on), must have their corresponding asset ID cited as long as they are identifiable in the picture
- **The scene asset is mandatory**: every shot must cite the scene asset ID of the scene it is in (an asset whose type is scene); if that scene has a derived scene asset matching the current state of the picture, use the derived scene asset ID, otherwise use the main scene asset ID. A missing scene asset ID counts as an incomplete field
- Rule for choosing between parent and derived asset: choose the asset ID by the state the plot's picture needs — if the shot needs a derived state of some main asset, **choose only the derived asset ID**; only when no matching derived state exists do you choose the main asset ID; the parent and a derivation of the same parent asset must never appear together in the same shot

---

## Transition rules

- **Within one scene**: shots hard-cut by default
- **Across scenes**: insert 1 empty-shot entry (2-3s) as an emotional buffer, with content related to the mood of the scenes on either side
- **Across sections**: you may mark "dissolve transition" or "fade in/fade out" in description
- Fancy transitions are forbidden (wipes, spins, venetian blinds and so on)
