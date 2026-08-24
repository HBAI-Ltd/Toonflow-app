# Character Derivative Asset Generation · Flat Style Constraint Manual

---

## 1. Overlay principles

1. **The silhouette does not change** — after the overlay, the line silhouette must be exactly identical to the base model; silhouette drift is forbidden
2. **The pose does not change** — keep the base model's natural standing pose; any change of pose/action/stance is forbidden
3. **Controllable layer by layer** — describe each layer separately so layers can be swapped individually (change the outfit without changing the makeup)
4. **Unified style** — all costume-and-makeup elements obey the same flat aesthetic system
5. **No drop in color-block quality** — after the overlay, the color-block standard is not below the base model
6. **Costume and makeup only** — overlay makeup/hairstyle/clothing/accessories only; introducing props, scenes, environment or action is forbidden

---

## 2. Overlay layers

| Layer | Content | Notes |
|---|---|---|
| L0 | Base model | The base likeness model, not modified |
| L1 | Makeup (decision layer) | Analyse the user's cues first, then decide the intensity: "base makeup / light makeup / formal makeup" |
| L2 | Hair styling | Bun/tied hair/braids + hair ornaments |
| L3 | Inner robe/inner layer | Replaces the white base inner robe |
| L4 | Outer robe/main garment | Wide-sleeved robe/straight-hem robe/great cloak, etc. |
| L5 | Accessories | Head/ear/neck/waist/hand ornaments |

---

## 3. Makeup constraints (L1)

### Strategy from base model to derivative makeup and styling (key)

> The character base model is bare-faced, but derivative assets enter the makeup-and-styling flow by default. The system should analyse the makeup need from the cues the user provides and decide the intensity among base makeup, light makeup and formal makeup, rather than staying bare-faced.

### L1 cue analysis and makeup decision

| Step | What it handles | Decision result |
|---|---|---|
| S1 | Extract the user's cues: facial-state words, emotion words, intensity words | Form a summary of the makeup need |
| S2 | Filter out non-makeup cues: prop/scene/action/pose words are not grounds for applying makeup | Prevent misjudgement |
| S3 | Match the makeup style matrix and give an intensity level | Base makeup / light makeup / formal makeup |
| S4 | Generate the final L1 prompt | Output the conclusion only, not the analysis process |

### Cue-to-makeup mapping (execution standard)

| Cue type | Typical cue | L1 decision |
|---|---|---|
| No clear facial-emphasis cue | Only clothing/hairstyle changes, no emphasis on emotion or state | Base makeup |
| Slight facial cue | Gentle, faintly smiling, complexion slightly lifted | Light makeup (extremely faint) |
| Clear frail-and-ill cue | Pale complexion, extremely faint lip color | Frail pear-blossom makeup (light makeup) |
| Clear formal-ceremony cue | Full dress, ceremony, opulent entrance | Formal makeup (controlled) |

### Female makeup style matrix

| Style | Applicable scene | Core prompt |
|---|---|---|
| Fresh plain makeup | Everyday, first meeting, in her chamber | flat makeup, soft light color blocks, minimalist makeup |
| Cool striking frost makeup | Formal, confrontation, power | flat cool makeup, clean lines, color-block makeup |
| Soft charming peach makeup | Sweet romance, ambiguity, heart-flutter | flat peach makeup, pink tinting, color-block expression |
| Frail pear-blossom makeup | Injured, weakened | flat sickly makeup, pale skin tone, faint lip color |
| Opulent phoenix makeup | Wedding, full dress | flat heavy makeup, rich color blocks, refined lines |

### Common base skin (shared by all makeup styles)

| Item | Constraint | Prompt |
|---|---|---|
| Texture | Single-color fill, no gradient | single-color skin, flat skin, solid skin |
| Fairness | Light single color, even | light skin tone, single-color skin tone |
| Subsurface glow | No subsurface glow, purely flat | no sheen, no translucency |
| Forbidden | Gradient/shadow/three-dimensionality | — |

### Base makeup detail (default level)

| Item | Constraint | Prompt |
|---|---|---|
| Brows | Line-drawn, single-color fill | line brows, flat brow shape |
| Eyes | Simplified color blocks, no pupil detail | flat eyes, color-block eyes |
| Cheeks | Extremely faint color blocks, no visible build-up | extremely faint blush, color-block lift |
| Lips | Single-color tint, kept restrained | single-color lips, flat lips |
| Overall | Makeup is visible, but the color blocks are very light | base flat makeup, flat no-makeup look |

---

## 4. Hair styling constraints (L2)

### Female styling types

| Styling | Description | Applicable | Prompt |
|---|---|---|---|
| Half-up cloud bun | Bun on top of the head + hair falling at the back | Everyday, going out | flat cloud bun, minimalist bun |
| Flying-immortal bun | High bun swept upward, clean lines | Immortal realm, grand entrance | flat flying bun, line-drawn high bun |
| Fallen-horse bun | Low bun to one side, languid lines | Private, ambiguous | flat fallen bun, line-drawn side bun |
| Double-ring bun | Symmetrical double buns, girlish lines | Young characters | flat double buns, simple double rings |
| Fully loose hair | Long hair fully loose, with a simple hair ornament | Injured, downfallen | flat loose hair, line-drawn long hair |
| Tied ponytail | High tie, capable, clean lines | Martial training, action | flat ponytail, line-drawn tied hair |

### Female hair ornaments

| Item | Constraint | Prompt |
|---|---|---|
| Style | Flattened ornament, geometric shape | flat hair ornament, geometric decoration |
| Material | Line-drawn, single-color fill | line-drawn ornament, color-block hair ornament |
| Craft | Clean lines, minimalist craft | clean lines, flat craft |

### Male styling types

| Styling | Applicable | Prompt |
|---|---|---|
| Tied hair with half crown | Everyday, scholar | flat tied hair, line-drawn crown |
| Full crown, high tie | Formal, imperial court | flat full crown, line-drawn tied hair |
| Loose hair over the shoulders | Private, injured | flat loose hair, line-drawn long hair |
| Battle-tied ponytail | Combat, martial training | flat battle hair, line-drawn ponytail |

---

## 5. Clothing constraints (L3+L4)

### Female clothing matrix

| Style | Cut | Applicable | Prompt |
|---|---|---|---|
| Minimalist flowing outfit | Layered wide-sleeved robe, flat lines | Everyday, immortal realm | flat wide sleeves, line-drawn robe |
| Dignified formal robe | Curved-hem deep robe/ruqun, geometric lines | Imperial court, banquet | flat curved-hem robe, minimalist deep robe |
| Light everyday wear | Narrow-sleeved ruqun/short jacket, clean lines | Action, martial training | flat narrow sleeves, clean short jacket |
| Sleepwear | Thin gauze inner garment, plain-color flat | Indoors, night | flat sleepwear, plain-color garment |
| Wedding dress | Phoenix coronet and embroidered cape, layered color blocks | Wedding | flat wedding dress, multi-layer color blocks |

### General constraints for female clothing

| Item | Constraint | Prompt |
|---|---|---|
| Main color | White/moon-white/silver-gray by default | white flat clothing, minimalist garment |
| Material | Solid color blocks, no texture | solid-color garment, no texture |
| Texture | Lines must be clear | clear lines, distinct color blocks |
| Shoulders | Shoulder ornament/shawl/cloud collar lines | line-drawn shoulder ornament, flat cloud collar |
| Layering | Multiple layers worn over each other, distinct color blocks | multi-layer wear, flat layering |

### Male clothing matrix

| Style | Applicable | Prompt |
|---|---|---|
| Scholar's elegant outfit | Everyday, study | flat long robe, minimalist robe |
| Warrior's fitted outfit | Combat, martial practice | flat fitted outfit, clean battle dress |
| Dark robe and great cloak | Entrance, night travel | flat great cloak, line-drawn cape |
| Everyday casual wear | Leisure, private | flat everyday wear, minimalist casual wear |
| Ceremonial court robe | Imperial court, ceremony | flat court robe, minimalist ceremonial robe |

---

## 6. Accessory constraints (L5)

### Female accessories

| Type | Constraint | Prompt |
|---|---|---|
| Head ornament | Flattened, geometric shape | flat head ornament, geometric hair ornament |
| Ear ornament | Line-drawn tassel/jade earring | line-drawn earrings, flat jade earring |
| Neck ornament | Line-drawn beaded collar/torque | line-drawn beaded collar, flat torque |
| Waist ornament | Line-drawn silk cord/jade pendant | line-drawn silk cord, flat jade pendant |
| Hand ornament | Line-drawn jade bangle/armlet | line-drawn bracelet, flat armlet |

### Male accessories

| Type | Constraint | Prompt |
|---|---|---|
| Hair crown | Flat crown, clean lines | flat crown, line-drawn crown |
| Waist sash | Line-drawn waist sash, flat color blocks | line-drawn waist sash, flat belt |
| Jade pendant | Flat jade pendant, clean shape | flat jade pendant, line-drawn pendant |
| Weapon | Worn sword/fan/flute (optional) | flat sword, line-drawn fan |

---

## 7. Costume-and-makeup combination quick reference

| Scene | Makeup | Hairstyle | Clothing | Accessories |
|---|---|---|---|---|
| Everyday in her chamber | Fresh plain makeup | Half-up cloud bun | Minimalist flowing outfit | Flat, medium |
| First meeting | Fresh plain makeup | Half-up/flying-immortal | Minimalist flowing outfit | Flat, medium to many |
| Sweet romantic interaction | Soft charming peach makeup | Half-up/fallen-horse | Minimalist/light | Flat, medium |
| Formal entrance | Cool striking frost makeup | Flying-immortal bun | Dignified formal robe | Flat, very elaborate |
| Night conversation | Fresh plain/peach makeup | Fully loose/fallen-horse | Sleepwear | Flat, very minimal |
| Injured and downfallen | Frail pear-blossom makeup | Fully loose (dishevelled) | Damaged everyday wear | Flat, very minimal/none |
| Wedding ceremony | Opulent phoenix makeup | Flying-immortal bun | Wedding dress | Flat, very elaborate |
| Martial training/action | Plain makeup (extremely faint) | Tied ponytail | Light everyday wear | Flat, simple |

---

> **🔍 Rule for inferring uncovered scenes**
>
> When the scene/situation the user describes is not in the table above, infer it yourself from the core DNA of this style:
>
> | Inference dimension | Flat ancient-style DNA |
> |---|---|
> | Makeup intensity | Fresh plain makeup by default (extremely minimal color blocks); formal/entrance → cool striking frost makeup; sweet romance/date → soft charming peach makeup; weakened/frail → frail pear-blossom makeup |
> | Hairstyle | Everyday → half-up cloud bun or fallen-horse bun; formal → flying-immortal bun; private/night → fully loose hair; action → tied ponytail |
> | Clothing | All clothing must be converted into flat color-block expression; patterns extremely simplified; multi-layer wear only needs to keep the sense of silhouette |
> | Accessory density | Flattening comes first; formal → flat and very elaborate (simplified to color-block head ornament + waist ornament silhouette); everyday → flat, medium |
> | Color tendency | Low-saturation ancient-style color range (tea white/bamboo green/lotus pink/brick red); no gradient; clearly defined boundary lines |

## 8. Four-view character sheet specification

### View definitions

| Position | View | Angle | Shot size | Requirement | Prompt |
|---|---|---|---|---|---|
| Far left | Portrait close-up | Front, eye level | Face to collarbone | Face fills 60%+, features/makeup clear | portrait closeup、face detail、makeup detail |
| Second from left | Front view | Front 0° | Full-body standing figure | Facing the camera, full front view of the clothing | front view、height mark |
| Second from right | Side view | Right 90° | Full-body standing figure | Pure profile silhouette, side layering of the clothing | side view、profile、height mark |
| Far right | Back view | Rear 180° | Full-body standing figure | Back-of-head hair ornament/back of the clothing/hair ends clear | back view、rear view、height mark |

### Frame specification

| Item | Constraint |
|---|---|
| Layout | Four views side by side, left to right, in one frame |
| Background | Clean neutral gray #E8E8E8 |
| Standing pose | Standing naturally, feet parallel and slightly apart, arms hanging naturally or slightly out (**any change of pose is forbidden**) |
| Expression | A micro-expression matching the makeup style (e.g. fresh plain makeup → serene, peach makeup → faintly smiling), limited to facial micro-expression, no body action |
| Light | No light-and-shadow, purely flat-filled color blocks |
| Consistency | Face/makeup/hairstyle/hair ornament/clothing/accessories are exactly the same across the four views |
| Aspect ratio | 4:1 or 3:1 recommended |

---

## 9. Prompt template

### Output format constraints

| Item | Constraint |
|---|---|
| Output content | **Output the prompt text only**, output nothing else |
| Forbidden output | Quick-reference tables, layered build plans, visual constraint tables, prohibition tables, derivative plans, output suggestions, core-element tables — any non-prompt content |
| Forbidden scenes | Character derivative assets **contain no scene/environment description**; output no scene/environment/weather/background narrative content (scenes belong to the scene asset category) |
| Forbidden props | **Contains no prop interaction**; output no umbrella/sword/fan/book/lantern/wine cup or other held or interacted-with object (props belong to the prop asset category) |
| Forbidden pose change | **Do not change the base model's pose**; output no walking/looking back/raising a hand/turning sideways/running or any other action or stance change — keep the natural standing pose |
| Format | Output a directly usable prompt code block, with no heading, table, explanation or plan comparison |

### Full costume-and-makeup overlay (four views)


```
using the character base likeness image as the base image，img2img overlay of costume and makeup，
flat ancient-style {gender} character four-view sheet，
2d flat design，vector art，flat illustration，
minimalist，clean lines，solid colors，
keep the base likeness silhouette unchanged，{overall temperament}，
【L1·Makeup】decided from the user's cues: {base makeup/light makeup/formal makeup}; using {makeup style}，single-color skin，flat skin tone，{brow makeup}，{eye makeup}，{lip makeup}，
【L2·Hair】{styling type}，line-drawn hairstyle，{hair ornament description}，
【L3+L4·Clothing】{main color}{cut}，{material}，{decorative craft}，clear lines，distinct color blocks，
【L5·Accessories】{head ornament}，{ear ornament}，{neck ornament}，{waist ornament}，
side by side left to right in one frame: portrait close-up + front view + side view + back view，
standing naturally，clean neutral gray background，no light-and-shadow，no gradient，
four-view consistency，clean lines，color-block fill，
no text of any kind in the image
```


---

## 10. Constraint rules

### Mandatory

| No. | Rule |
|---|---|
| R1 | After the overlay the silhouette must match the base model |
| R2 | Clothing must use "clear lines + distinct color blocks" |
| R3 | Female accessories must be "flattened + geometric" |
| R4 | Makeup/hairstyle/clothing/accessories keep a unified style |
| R5 | Must output a four-view sheet (portrait close-up + front view + side view + back view) |
| R6 | Must specify "clean neutral gray background" |
| R7 | Must specify "four-view consistency" |
| R8 | **Output the prompt only** — outputting quick-reference tables/layered plans/visual constraints/prohibitions/derivative plans/output suggestions or any other non-prompt content is forbidden |
| R9 | **No scene description** — character derivative assets do not touch scene/environment/weather/background narrative; scenes are a separate asset type |
| R10 | **No prop interaction** — contains no held or interacted-with object (umbrella/sword/fan/book, etc.); props are a separate asset type |
| R11 | **The pose stays unchanged** — the base model's natural standing pose must be kept; any change of action/stance/posture is forbidden |
| R12 | **L1 must analyse before deciding** — parse the user's facial cues first, then settle on base makeup/light makeup/formal makeup |
| R13 | **Every derivative asset needs makeup and styling** — under normal circumstances do not stay bare-faced; use at least base makeup |
| R14 | **Makeup intensity is controlled** — even with makeup, stay restrained; no modern flat heavy makeup or exaggerated color-makeup effects |
| R15 | **Props/scene/action are not grounds for raising the intensity** — prop, environment or action information alone must not lift base makeup to a heavier makeup |

### Forbidden

| No. | Forbidden |
|---|---|
| X1 | Silhouette drift after the overlay |
| X2 | Accessories too simple/modernised (female) |
| X3 | Makeup and clothing styles conflicting with each other |
| X4 | Complex scene backgrounds (a plain gray ground is mandatory) |
| X5 | Costume and makeup inconsistent between the four views |
| X6 | Any content other than the prompt (tables/plans/suggestions/explanations/variants, etc.) |
| X7 | Adding scene description to a character derivative asset (mountain path/rain/interior/street/weather and other environmental elements) |
| X8 | Outputting sections such as "core element quick reference", "layered build plan", "visual constraints", "prohibitions", "derivative plans" |
| X9 | Adding any prop interaction (holding an umbrella/sword/fan/book/lantern/wine cup, etc.) |
| X10 | Changing the base model's pose (walking/looking back/raising a hand/turning sideways/running/lowering the head/looking up and other action descriptions) |
| X11 | Adding descriptions that link expression and pose (such as narrative writing like "walking turned 45° with the corner of the mouth slightly curved") |
| X12 | Applying a fixed makeup look directly without analysing the user's cues |
| X13 | Wrongly staying bare-faced, so the derivative asset lacks the makeup and styling it should have |
| X14 | Wrongly upgrading the makeup because of prop/scene/action words alone, resulting in a wrong makeup-intensity decision |
| X15 | Adding gradient/shadow/highlight/three-dimensionality effects |
