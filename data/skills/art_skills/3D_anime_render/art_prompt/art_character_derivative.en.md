# 3D Anime Render Urban Character Derivative Asset Generation · Constraint Manual

---

## 1. Overlay principles

1. **The face does not change** — after the overlay, the features must be exactly identical to the base model; facial drift is forbidden
2. **The pose does not change** — keep the base model's natural standing pose; any change of pose/action/stance is forbidden
3. **Controllable layer by layer** — describe each layer separately so layers can be swapped individually (change the outfit without changing the makeup)
4. **Unified style** — all costume-and-makeup elements obey the same urban anime aesthetic system
5. **No drop in texture quality** — after the overlay, the texture standard is not below the base model
6. **Costume and makeup only** — overlay makeup/hairstyle/clothing/accessories only; introducing props, scenes, environment or action is forbidden

---

## 2. Overlay layers

| Layer | Content | Notes |
|---|---|---|
| L0 | Base model | The base likeness model, not modified |
| L1 | Makeup (decision layer) | Analyse the user's cues first, then decide the intensity: "base makeup / light makeup / formal makeup" |
| L2 | Hair styling | Loose hair/ponytail/updo/half-up + hair ornaments |
| L3 | Inner layer/inner top | Replaces the white base inner layer |
| L4 | Outer garment/main garment | Modern urban clothing |
| L5 | Accessories | Head/ear/neck/waist/hand ornaments |

> **Scope boundary**: character derivative assets contain only layers L0–L5 (costume, makeup and styling). They do not contain props (umbrella/phone/laptop/coffee and other held objects), scene environment (interior/exterior/weather, etc.) or poses and actions (walking/looking back/raising a hand, etc.). Those belong to other asset types.

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
| Slight facial cue | Gentle, faintly smiling, lashes trembling lightly, complexion slightly lifted | Light makeup (extremely faint) |
| Clear frail-and-ill cue | Pale complexion, extremely faint lip color, slight redness under the eyes | Frail pear-blossom makeup (light makeup) |
| Clear formal-ceremony cue | Full dress, ceremony, opulent entrance | Formal makeup (controlled) |

> Decision principle: every derivative asset must have makeup and styling; look at the facial cues first to settle the intensity and style, and a change of prop, scene or pose must never raise the makeup intensity on its own.

### Female makeup style matrix

| Style | Applicable scene | Core prompt |
|---|---|---|
| Fresh plain makeup | Everyday, first meeting, at work | fresh plain makeup, brows lightly swept, plain makeup on a clear face |
| Cool striking frost makeup | Formal, confrontation, power | cool striking makeup, sharp brows and eyes, thin cool lips |
| Soft charming peach makeup | Sweet romance, ambiguity, heart-flutter | peach-blossom makeup, faint red at the outer eye, dewy lip color |
| Frail pear-blossom makeup | Injured, weakened | pale complexion, extremely faint lip color, slight redness under the eyes |
| Opulent evening-banquet makeup | Formal banquet, attending in full dress | refined heavy makeup, striking lip color |

### Universal base skin (shared by all makeup looks)

| Item | Constraint | Prompt |
|---|---|---|
| Texture | Cel-shaded rendering, soft sheen | cartoon skin, soft skin texture |
| Fairness | Cool fair skin, translucent not ghostly white | milky skin, milky white skin |
| Inner translucency | A soft glow coming from within | inner translucency, translucent glowing skin |
| Forbidden | Matte/dead white/waxy/greasy/overexposed | — |

### Base makeup detail (default level)

| Item | Constraint | Prompt |
|---|---|---|
| Brows | Lightly groomed along the base model's brow shape, without changing it | naturally groomed brows, clean brow shape |
| Eyes | Extremely faint eye work, emphasising clarity and liveliness | clear eyes, extremely faint inner eyeliner |
| Cheeks | Extremely faint lift of complexion, no visible build-up of color | natural cheek complexion, faintly lifted complexion |
| Lips | Nude pink or light pink tint, kept restrained | naturally dewy lip color, light pink lip color |
| Overall | Makeup is visible, but the makeup feel is very light | base makeup, no-makeup makeup feel, natural refinement |

### By area (taking fresh plain makeup as the example)

| Area | Constraint | Prompt |
|---|---|---|
| Base | Sheer and translucent, dewy faint sheen | sheer base, dewy creamy skin |
| Brow makeup | Distant-mountain brow/willow-leaf brow, lightly swept in gray-brown | distant-mountain dark brows, brows lightly swept |
| Eye makeup | Extremely faint eyeshadow, inner eyeliner, long lashes | clear eye makeup, long lashes |
| Blush | Extremely faint sheer pink, lightly swept on the apples of the cheeks | extremely faint blush, sheer pink slightly flushed |
| Lip makeup | Dewy light pink, faint sheen | dewy light pink lip color |

### Male makeup

| Item | Constraint | Prompt |
|---|---|---|
| Base skin | Cel-shaded rendering, fair and translucent, fresh and natural | cartoon skin, creamy skin, luminous skin |
| Principle | No-makeup makeup — looks unmade-up but the skin is superb | no-makeup makeup, naturally great skin |
| Brows | Naturally thick brows, not drawn in | naturally sword-shaped brows, striking brow shape |
| Lip color | Natural healthy color, faintly dewy | natural lip color, a healthy flush |

---

## 4. Hair styling constraints (L2)

### Female styling types

| Styling | Description | Applicable | Prompt |
|---|---|---|---|
| Naturally loose hair | Long hair falling naturally, smooth and glossy | Everyday, leisure | naturally loose hair, smooth long hair |
| High ponytail | High-tied ponytail, energetic and capable | Sport, commuting | high ponytail, energetic ponytail |
| Low ponytail | Low-tied ponytail, elegant and simple | Everyday, business | low ponytail, elegant ponytail |
| Half-up hair | Top half tied + lower half falling naturally | Everyday, date | half-up hair, half-tied hairstyle |
| Twin ponytails | Ponytails on both sides, youthful and lively | Lively scenes | twin ponytails, lively hairstyle |
| Elegant updo | Updo/bun, a formal feel | Formal occasions | elegant updo, low bun |

### Female hair ornaments

| Item | Constraint | Prompt |
|---|---|---|
| Style | Modern urban, minimalist and refined, matching the clothing | modern hair ornament, urban style |
| Material | Metal/fabric/acrylic | metal hair clip, fabric hair ornament |
| Craft | Refined craft, presented in cartoon form | fine craft, refined ornament |

### Male styling types

| Styling | Applicable | Prompt |
|---|---|---|
| Fresh short hair | Everyday, business | fresh short hair, tidy hairstyle |
| Side part or centre part | Formal, commuting | side-parted hairstyle, centre-parted hairstyle |
| Fluffy and tousled | Leisure, artsy | fluffy hairstyle, tousled and casual |
| Medium-long natural | Leisure, artsy | medium-long hair, falling naturally |

---

## 5. Clothing constraints (L3+L4)

### Female clothing matrix

| Style | Cut | Applicable | Prompt |
|---|---|---|---|
| Urban commuter wear | Shirt/suit/skirt | Work, everyday | commuter clothing, urban business wear |
| Casual everyday wear | T-shirt/jeans/hoodie | Everyday, leisure | casual clothing, comfortable outfit |
| Evening dress | One-piece dress/gown | Banquet, date | evening dress, elegant dress |
| Sportswear | Sportswear set/sports vest | Sport, fitness | sports clothing, energetic outfit |
| Formal gown | Haute-couture gown | Formal occasions | formal gown, opulent dress |

### Universal female clothing constraints

| Item | Constraint | Prompt |
|---|---|---|
| Main color | Mostly warm tones, fitting the urban feel | warm-toned clothing, urban color scheme |
| Material | Real material feel + cel-shaded rendering | clear clothing texture, cel-shaded material |
| Texture | Grain clear but not over-realistic | clear clothing grain, cartoon texture |
| Shoulders | Natural shoulders, ornament in moderation | natural shoulders, moderate ornament |
| Layering | Moderate layering, not over-elaborate | moderate layering, clean and distinct |

### Male clothing matrix

| Style | Applicable | Prompt |
|---|---|---|
| Urban casual wear | Shirt/jeans/casual jacket | Everyday, leisure | casual clothing, urban style |
| Business formal wear | Suit/shirt/tie | Work, formal | business formal wear, professional look |
| Sportswear set | Sportswear/sportswear set | Sport, fitness | sports clothing, energetic outfit |
| Everyday casual wear | T-shirt/jeans/hoodie | Leisure, private | everyday casual wear, comfortable outfit |
| Formal gown | Haute-couture suit/formal wear | Formal occasions | formal gown, opulent look |

---

## 6. Accessory constraints (L5)

### Female accessories

| Type | Constraint | Prompt |
|---|---|---|
| Head ornament | Modern urban, not skimpy | modern hair ornament, refined head ornament |
| Ear ornament | Refined studs/drop earrings | refined earrings, urban style |
| Neck ornament | Refined necklace/choker | refined necklace, minimalist design |
| Waist ornament | Minimalist belt/decorative band | minimalist belt, urban accessory |
| Hand ornament | Refined bracelet/watch | refined watch, urban accessory |

### Male accessories

| Type | Constraint | Prompt |
|---|---|---|
| Glasses | Modern glasses/sunglasses | modern glasses, fashionable accessory |
| Belt | Minimalist belt/leather belt | minimalist belt, urban style |
| Watch | Refined watch/sports watch | refined watch, urban accessory |
| Backpack | Urban backpack/briefcase | urban backpack, practical accessory |
| Keychain | Minimalist keychain | minimalist keychain, urban detail |

---

## 7. Costume-and-makeup combination quick reference

| Scene | Makeup | Hairstyle | Clothing | Accessories |
|---|---|---|---|---|
| Everyday commuting | Fresh plain makeup | Half-up hair/ponytail | Urban commuter wear | Minimalist |
| Casual date | Soft charming peach makeup | Half-up hair/loose hair | Casual everyday wear | Medium |
| Business meeting | Cool striking frost makeup | Half-up hair/tied hair | Business formal wear | Refined |
| Sport and fitness | Light makeup | Ponytail/tied hair | Sportswear | Simple |
| Formal evening banquet | Opulent evening-banquet makeup | Updo/half-up hair | Evening dress | Very elaborate |
| Weekend shopping | Light makeup | Loose hair/half-up hair | Casual everyday wear | Medium |
| Sports competition | Light makeup | Ponytail/tied hair | Sportswear | Simple |

---

> **🔍 Rule for inferring uncovered scenes**
>
> When the scene/situation the user describes is not in the table above, infer it yourself from the core DNA of this style:
>
> | Inference dimension | 3D anime render urban DNA |
> |---|---|
> | Makeup intensity | Fresh plain makeup by default; formal/business → cool striking frost makeup; sweet romance/date → soft charming peach makeup; frail/injured → frail pear-blossom makeup; banquet/full dress → opulent evening-banquet makeup |
> | Hairstyle | Everyday/commuting → half-up hair or ponytail; leisure/date → naturally loose hair; formal → updo; sport → high ponytail; twin ponytails for youthful, lively scenes |
> | Clothing | Full coverage of urban scenes; the formality of the occasion decides how refined the clothing is (commuting < everyday < date < banquet); the 3D cel-shaded material is kept throughout |
> | Accessory density | Sport → simple; everyday/commuting → minimalist; date → medium and refined; formal banquet → very elaborate |
> | Texture baseline | Cel-shaded rendering + soft light-and-shadow stay locked throughout; sliding into realistic photography or flat 2D anime texture is forbidden |

## 8. Four-view character sheet specification

> After the derivative costume and makeup are overlaid, a four-view sheet must still be output, to ensure the costume, makeup and styling stay consistent at every angle.

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
| Light | Even soft light, key light from the front + fill light on both sides, no hard shadow |
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
| Forbidden props | **Contains no prop interaction**; output no umbrella/phone/laptop/coffee or other held or interacted-with object (props belong to the prop asset category) |
| Forbidden pose change | **Do not change the base model's pose**; output no walking/looking back/raising a hand/turning sideways/running or any other action or stance change — keep the natural standing pose |
| Format | Output a directly usable prompt code block, with no heading, table, explanation or plan comparison |

### Full costume-and-makeup overlay (four views)

```
using the character base likeness image as the base image，img2img overlay of costume and makeup，
3D animation render，cinematic lighting，vivid cel-shaded texture，high-detail materials，joyful healing atmosphere，cartoon urban style，high-detail cartoon materials，moderate cartoon proportions，warm-toned color scheme，8K ultra HD，cinematic composition，soft light-and-shadow layering，bright cartoon render style，warm and healing，{gender} character four-view sheet，
anime style, cel-shaded, 3D animation render, film lighting,
character design sheet, character turnaround,
keep the base likeness face unchanged，{overall temperament}，
【L1·Makeup】decided from the user's cues: {base makeup/light makeup/formal makeup}; using {makeup style}，cel-shaded skin，{brow makeup}，{eye makeup}，{lip makeup}，
【L2·Hair】{styling type}，hair strands rendered flowing，{hair ornament description}，
【L3+L4·Clothing】{main color}{cut}，{material}，{decorative craft}，clear clothing texture、cel-shaded material，
【L5·Accessories】{head ornament}，{ear ornament}，{neck ornament}，{waist ornament}，
side by side left to right in one frame: portrait close-up + front view + side view + back view，
standing naturally，clean neutral gray background，even soft light，no hard shadow，
four-view consistency，finely rendered face，finely rendered hair strands，clear grain detail，
cel-shaded render style，soft light-and-shadow，moderate cartoon proportions，realistic material combined in，
8K ultra HD，cinematic composition，
no text of any kind in the image
```

---

## 10. Constraint rules

### Mandatory

| No. | Rule |
|---|---|
| R1 | After the overlay the face must match the base model |
| R2 | Clothing must use "clear clothing texture + cel-shaded material" |
| R3 | Female accessories must be "modern urban + refined craft" |
| R4 | Makeup/hairstyle/clothing/accessories keep a unified style |
| R5 | Must output a four-view sheet (portrait close-up + front view + side view + back view) |
| R6 | Must specify "clean neutral gray background" |
| R7 | Must specify "four-view consistency" |
| R8 | **Output the prompt only** — outputting quick-reference tables/layered plans/visual constraints/prohibitions/derivative plans/output suggestions or any other non-prompt content is forbidden |
| R9 | **No scene description** — character derivative assets do not touch scene/environment/weather/background narrative; scenes are a separate asset type |
| R10 | **No prop interaction** — contains no held or interacted-with object (umbrella/phone/laptop, etc.); props are a separate asset type |
| R11 | **The pose stays unchanged** — the base model's natural standing pose must be kept; any change of action/stance/posture is forbidden |
| R12 | **L1 must analyse before deciding** — parse the user's facial cues first, then settle on base makeup/light makeup/formal makeup |
| R13 | **Every derivative asset needs makeup and styling** — under normal circumstances do not stay bare-faced; use at least base makeup |
| R14 | **Makeup intensity is controlled** — even with makeup, stay restrained; no modern heavy makeup or exaggerated color-makeup effects |
| R15 | **Props/scene/action are not grounds for raising the intensity** — prop, environment or action information alone must not lift base makeup to a heavier makeup |
| R16 | Must contain the 3D anime render keywords (cel-shaded, 3D animation render, anime style) |
| R17 | Must contain the 8K ultra HD and cinematic composition keywords |
| R18 | Must contain the cinematic lighting keyword (film lighting) |

### Forbidden

| No. | Forbidden |
|---|---|
| X1 | Facial drift after the overlay |
| X2 | Accessories too simple/modernised (female) |
| X3 | Makeup and clothing styles conflicting with each other |
| X4 | Complex scene backgrounds (a plain gray ground is mandatory) |
| X5 | Costume and makeup inconsistent between the four views |
| X6 | Any content other than the prompt (tables/plans/suggestions/explanations/variants, etc.) |
| X7 | Adding scene description to a character derivative asset (mountain path/rain/interior/street/weather and other environmental elements) |
| X8 | Outputting sections such as "core element quick reference", "layered build plan", "visual constraints", "prohibitions", "derivative plans" |
| X9 | Adding any prop interaction (holding a phone/laptop/coffee/bag, etc.) |
| X10 | Changing the base model's pose (walking/looking back/raising a hand/turning sideways/running/lowering the head/looking up and other action descriptions) |
| X11 | Adding descriptions that link expression and pose (such as narrative writing like "walking turned 45° with the corner of the mouth slightly curved") |
| X12 | Applying a fixed makeup look directly without analysing the user's cues |
| X13 | Wrongly staying bare-faced, so the derivative asset lacks the makeup and styling it should have |
| X14 | Wrongly upgrading the makeup because of prop/scene/action words alone, resulting in a wrong makeup-intensity decision |
| X15 | Using photographic realism terms (such as real photography, photorealistic, RAW photo, etc.) |
| X16 | Cel-shaded texture overdone or underdone — it must stay moderate |