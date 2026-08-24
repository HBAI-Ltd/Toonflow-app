# Character Derivative Asset Generation · Urban Realism Constraint Manual

---

## 1. Overlay principles

1. **The face does not change** — after the overlay the features must match the base model exactly; any facial drift is forbidden
2. **The pose does not change** — keep the base model's natural standing pose; any change of pose/action/stance is forbidden
3. **Controllable layer by layer** — describe each layer separately so layers can be swapped individually (change the outfit without changing the makeup)
4. **Unified style** — all costume-and-makeup elements obey the same aesthetic system
5. **No drop in texture** — after the overlay the texture standard is no lower than the base model's
6. **Costume and makeup only** — overlay makeup/hairstyle/clothing/accessories only; introducing props, scenes, environment or actions is forbidden

---

## 2. Overlay layers

| Layer | Content | Notes |
|---|---|---|
| L0 | Base model | The base likeness model, not modified |
| L1 | Makeup (decision layer) | First analyse the user's cues, then decide the intensity: "base makeup/light makeup/formal makeup" |
| L2 | Hair styling | Hairstyle design + hair ornaments |
| L3 | Mid layer/inner layer | Replaces the white base mid layer |
| L4 | Outer layer/main outfit | T-shirt/shirt/suit/coat/dress, etc. |
| L5 | Accessories | Watch/glasses/earrings/necklace/belt/hand jewellery |

> **Scope boundary**: character derivative assets cover only layers L0–L5 (costume, makeup and hair), and do not cover props (phone/keys/bag/pen and other held objects), scene environment (indoor/outdoor/weather, etc.) or pose actions (walking/looking back/raising a hand, etc.). Those belong to other asset types.

---

## 3. Makeup constraints (L1)

### Base-model-to-derivative makeup strategy (critical)

> The character base model is in a natural state, but derivative assets enter the makeup pipeline by default. The system should analyse the makeup requirement from the cues the user provides, and decide the intensity between base makeup, light makeup and formal makeup.

### L1 cue analysis and makeup decision

| Step | What is processed | Decision result |
|---|---|---|
| S1 | Extract the user's cues: facial-state words, emotion words, intensity words | A summary of the makeup requirement |
| S2 | Filter out non-makeup cues: prop/scene/action/pose words are not grounds for applying makeup | Prevents misjudgement |
| S3 | Match the makeup style matrix and give an intensity tier | Base makeup / light makeup / formal makeup |
| S4 | Generate the final L1 prompt | Output only the conclusion, not the analysis process |

### Cue-to-makeup mapping (execution standard)

| Cue type | Typical cue | L1 decision |
|---|---|---|
| No clear facial-emphasis cue | Only clothing/hairstyle changes, no emphasis on emotion or state | Base makeup |
| Slight facial cue | Brightened complexion, full of energy, natural smile | Light makeup (extremely faint) |
| Clear workplace cue | Formal meeting, business occasion, important event | Formal makeup (controlled) |
| Clear casual cue | Everyday outing, casual date, weekend activity | Light makeup/base makeup |

### Female makeup style matrix

| Style | Applicable scene | Core prompt |
|---|---|---|
| Nude makeup | Everyday, commuting, leisure | nude makeup, natural base, clear and light |
| Workplace makeup | Meeting, business, formal | refined professional makeup, capable |
| Date makeup | Date, dinner party, gathering | refined makeup, rosy complexion |
| Party makeup | Party, performance, event | refined makeup, presence |

### Shared base skin (common to all makeup)

| Item | Constraint | Prompt |
|---|---|---|
| Texture | Natural skin, texture kept | natural skin, texture kept |
| Fairness | Natural skin tone, not over-white | natural skin tone, healthy skin tone |
| Translucency | Natural sheen | healthy skin sheen |
| Forbidden | Over-smoothing/mask face/plastic feel | — |

### Base makeup detail (default tier)

| Item | Constraint | Prompt |
|---|---|---|
| Base | Light and translucent, natural sheen | light base makeup, natural sheen |
| Brows | Lightly groomed along the base model's brow shape | naturally groomed brows, clean brow shape |
| Eyes | Extremely faint eye work, emphasis on clarity | clear eyes, extremely faint eyeliner |
| Cheeks | Extremely faint complexion brightening | natural cheek complexion |
| Lips | Natural lip color or light pink tint | natural moist lip color |
| Overall | Makeup is visible but extremely light | base makeup, faux bare face |

### Male makeup

| Item | Constraint | Prompt |
|---|---|---|
| Base skin | Natural skin, fresh and clean | natural skin, fresh and clean |
| Principle | Faux bare face — looks unmade-up but the skin is superb | faux bare face, naturally great skin |
| Brows | Natural brow shape, not drawn in | natural brow shape |
| Lip color | Natural blood color, slightly moist | natural lip color |

---

## 4. Hair styling constraints (L2)

### Female styling types

| Styling | Description | Applicable | Prompt |
|---|---|---|---|
| Natural long hair | Long hair falling naturally | Everyday, leisure | natural long hair, long hair over the shoulders |
| Ponytail | High ponytail/low ponytail/half ponytail | Sport, commuting | high ponytail, crisp ponytail |
| Updo | Bun/updo | Formal, dinner party | elegant updo, low bun |
| Short hair | Shoulder-length short hair/blunt shoulder cut | Fashion, capable | shoulder-length short hair, blunt shoulder cut |
| Waves | Natural soft curls/big waves | Date, party | natural curly hair, wavy hairstyle |
| Half-up | Half tied half loose, simple hair ornament | Everyday, commuting | half-up hair, half-loose hair |

### Female hair ornaments

| Item | Constraint | Prompt |
|---|---|---|
| Style | Minimalist modern, matched to the clothing | minimalist hair ornament, modern hair ornament |
| Material | Metal/leather/acrylic | metal hair clip, leather hair band |
| Craft | Refined craft, clear detail | refined hair ornament, clear detail |

### Male styling types

| Styling | Applicable | Prompt |
|---|---|---|
| Short hair | Everyday, business, leisure | short hair, fresh short hair |
| Medium-long hair | Leisure, artistic | medium-long hair, shoulder-length long hair |
| Side part | Business, formal | side-parted hairstyle, business hairstyle |
| Soft curls | Leisure, fashion | softly curled hairstyle, fashionable hairstyle |

---

## 5. Clothing constraints (L3+L4)

### Female clothing matrix

| Style | Cut | Applicable | Prompt |
|---|---|---|---|
| Business formal | Suit/shirt/pencil skirt | Workplace, meeting | professional suit, business formal |
| Casual fashion | T-shirt/jeans/casual trousers | Everyday, leisure | casual outfit, everyday fashion |
| Date outfit | One-piece dress/shirt/skirt | Date, gathering | one-piece dress, date outfit |
| Athleisure | Sportswear/hoodie/yoga pants | Sport, leisure | sportswear, casual sport |
| Evening gown | Gown/evening wear | Dinner party, event | evening gown, elegant gown |

### General female clothing constraints

| Item | Constraint | Prompt |
|---|---|---|
| Main color | Matched to the scene, natural colors | natural colors, harmonious tones |
| Material | True fabric texture, clearly visible | clear fabric texture |
| Texture | Texture must be ultra-crisp | clear clothing texture, ultra-crisp texture |
| Layering | Distinct layering, not over-layered | distinct layering, natural pairing |

### Male clothing matrix

| Style | Applicable | Prompt |
|---|---|---|
| Business formal | Suit/shirt/suit trousers | Workplace, meeting | business suit, formal wear |
| Casual fashion | Shirt/T-shirt/jeans | Everyday, leisure | casual outfit, everyday fashion |
| Athleisure | Sportswear/hoodie/track pants | Sport, leisure | sportswear, casual sport |
| Minimalist everyday | Minimalist shirt/casual trousers | Everyday, commuting | minimalist outfit, everyday casual |

---

## 6. Accessory constraints (L5)

### Female accessories

| Type | Constraint | Prompt |
|---|---|---|
| Jewellery | Minimalist and refined, not excessive | minimalist earrings, refined necklace |
| Watch | Minimalist/fashionable, matched to the style | minimalist watch, fashionable wristwatch |
| Glasses | Plain-lens/decorative glasses, clean | glasses, clear frames |
| Belt | Minimalist/fashionable, matched to the outfit | belt, waist cincher |

### Male accessories

| Type | Constraint | Prompt |
|---|---|---|
| Watch | Minimalist/business, matched to the style | minimalist watch, business wristwatch |
| Glasses | Plain-lens/decorative glasses, clean | glasses, clear frames |
| Belt | Minimalist/fashionable, matched to the outfit | belt, leather belt |
| Accessories | Minimalist and refined, not excessive | minimalist accessories, refined detail |

---

## 7. Costume-and-makeup combination quick reference

| Scene | Makeup | Hairstyle | Clothing | Accessories |
|---|---|---|---|---|
| Everyday commuting | Nude makeup | Natural long hair/ponytail | Business formal/casual fashion | Watch/minimalist |
| Business meeting | Workplace makeup | Updo/ponytail | Business formal | Watch/minimalist jewellery |
| Weekend leisure | Light makeup | Natural long hair | Casual fashion/athleisure | Minimalist |
| Date or gathering | Date makeup | Waves/updo | Date outfit | Refined jewellery |
| Dinner party or event | Formal makeup | Elegant updo/waves | Evening gown | Refined jewellery |
| Sport and fitness | Nude makeup | High ponytail/top knot | Athleisure | Minimalist |

---

> **🔍 Rule for inferring uncovered scenes**
>
> When the scene/situation the user describes is not in the table above, infer it yourself from the core DNA of this style:
>
> | Inference dimension | Live-action realistic urban DNA |
> |---|---|
> | Makeup intensity | Nude makeup by default (natural skin); business/formal → workplace makeup (capable and refined); date/gathering → date makeup (rosy complexion); party/performance → party makeup; sport/outdoors → nude or light makeup |
> | Hairstyle | Commuting/workplace → ponytail or half-up; leisure/date → natural long hair or waves; sport → high ponytail or top knot; formal → elegant updo; fashion occasion → short hair |
> | Clothing | The occasion decides how dressed up it is; workplace → business formal; leisure → everyday fashion; date → one-piece dress/skirt; sport → athleisure; dinner party → gown; true fabric texture is kept throughout |
> | Accessory density | Sport → minimalist or none; everyday → watch + minimalist; date → refined jewellery; dinner party → a refined full set |
> | Texture baseline | Anchored on live-action realistic photography; natural skin texture + hair-strand detail kept throughout; over-smoothing/plastic feel/3D rendering forbidden |

## 8. Four-view character sheet specification

### View definitions

| Position | View | Angle | Shot size | Requirement | Prompt |
|---|---|---|---|---|---|
| Far left | Portrait close-up | Front, eye level | Face to collarbone | Face fills 60%+, features/makeup clear | portrait closeup, face detail, makeup detail |
| Second from left | Front view | Front 0° | Full-body standing figure | Facing the camera, full front view of the clothing | front view, height mark |
| Second from right | Side view | Right 90° | Full-body standing figure | Pure profile silhouette, side layering of the clothing | side view, profile, height mark |
| Far right | Back view | Rear 180° | Full-body standing figure | Back-of-head hairstyle/back of the clothing clear | back view, rear view, height mark |

### Frame specification

| Item | Constraint |
|---|---|
| Layout | Four views side by side, left to right, in one frame |
| Background | Clean neutral gray #E8E8E8 |
| Standing pose | Standing naturally, feet parallel and slightly apart, arms hanging naturally |
| Expression | A micro-expression matching the makeup style, limited to facial micro-expression |
| Light | Even soft light, key light from the front + fill from both sides, no hard shadows |
| Consistency | Face/makeup/hairstyle/hairstyle/clothing/accessories are exactly the same across the four views |
| Aspect ratio | 4:1 or 3:1 recommended |

---

## 9. Prompt template

### Output format constraints

| Item | Constraint |
|---|---|
| Output content | **Output the prompt text only**, output nothing else |
| Forbidden output | Quick-reference tables, layered build plans, visual constraint tables, prohibition tables, derivative plans, output suggestions, core-element tables — any non-prompt content |
| Forbidden scenes | Character derivative assets **contain no scene/environment description**; output no scene/environment/weather/background narrative content |
| Forbidden props | **Contains no prop interaction**; output no phone/keys/bag/pen/wine glass or other held or interacted-with object |
| Forbidden pose change | **Do not change the base model's pose**; output no walking/looking back/raising a hand/turning sideways/running or any other action |
| Format | Output a directly usable prompt code block, with no heading, table, explanation or plan comparison |

### Full costume-and-makeup overlay (four views)

```
using the character base likeness image as the base image，img2img overlay of costume and makeup，
urban {gender} character four-view sheet，live-action realistic photography，urban realist documentary feel，strong contrast，extreme detail，8K，ultra fidelity
character design sheet，character turnaround，
keep the base likeness face unchanged，{overall temperament}，
【L1·Makeup】decided from the user's cues: {base makeup/light makeup/formal makeup}; using {makeup style}，natural skin，{brow makeup}，{eye makeup}，{lip makeup}，
【L2·Hair】{styling type}，every hair strand distinct，{hair ornament description}，
【L3+L4·Clothing】{main color}{cut}，{material}，{decorative craft}，clear clothing texture，ultra-crisp texture，
【L5·Accessories】{head ornament}，{ear ornament}，{necklace}，{watch}，
side by side left to right in one frame: portrait close-up + front view + side view + back view，
standing naturally，clean neutral gray background，even soft light，no hard shadow，
four-view consistency，finely rendered face，finely rendered hair strands，ultra-crisp texture detail
no text of any kind in the image
```


---

## 10. Constraint rules

### Mandatory

| No. | Rule |
|---|---|
| R1 | After the overlay the face must match the base model |
| R2 | Clothing must use "clear clothing texture + ultra-crisp texture" |
| R3 | Makeup/hairstyle/clothing/accessories share one unified style |
| R4 | Must output a four-view character sheet (portrait close-up + front view + side view + back view) |
| R5 | Must specify "clean neutral gray background" |
| R6 | Must specify "four-view consistency" |
| R7 | **Output the prompt only** — outputting quick-reference tables/layered plans/visual constraints/prohibitions/derivative plans/output suggestions or any other non-prompt content is forbidden |
| R8 | **No scene description** — character derivative assets do not touch scene/environment/weather/background narrative |
| R9 | **No prop interaction** — contains no held or interacted-with object (phone/bag/keys/pen, etc.) |
| R10 | **The pose stays unchanged** — must keep the base model's natural standing pose |
| R11 | **L1 must analyse before deciding** — first parse the user's facial cues, then settle on base makeup/light makeup/formal makeup |
| R12 | **Every derivative asset needs makeup** — under normal circumstances do not leave the face bare; use at least base makeup |

### Forbidden

| No. | Forbidden |
|---|---|
| X1 | Facial drift after the overlay |
| X2 | Makeup that is too exaggerated/heavy modern makeup |
| X3 | Makeup/clothing styles that clash with each other |
| X4 | Complex scene backgrounds (a plain gray ground is mandatory) |
| X5 | Costume, makeup and hair inconsistent between the four views |
| X6 | Outputting anything other than the prompt (tables/plans/suggestions/explanations/variants, etc.) |
| X7 | Adding scene description to a character derivative asset (indoor/outdoor/street/weather, etc.) |
| X8 | Outputting sections such as "core element quick reference", "layered build plan", "visual constraints", "prohibitions", "derivative plans" |
| X9 | Adding any prop interaction (phone/bag/keys/pen/wine glass or other held object) |
| X10 | Changing the base model's pose (walking/looking back/raising a hand/turning sideways/running/lowering the head or other action description) |
| X11 | Adding descriptions that link expression and pose (e.g. narrative writing like "walking turned 45° sideways with the corner of the mouth slightly curved") |
| X12 | Applying a fixed makeup look directly without analysing the user's cues |
| X13 | Wrongly leaving the face bare, so the derivative asset lacks the makeup it should have |
