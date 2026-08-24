# 1990s Retro Japanese Anime Style - Character Derivative Asset Generation · Constraint Manual

---

## 1. Overlay principles

1. **The face does not change** — after the overlay, the features must be exactly identical to the base model; facial drift is forbidden
2. **The pose does not change** — keep the base model's natural standing pose; any change of pose/action/stance is forbidden
3. **Controllable layer by layer** — describe each layer separately so layers can be swapped individually (change the outfit without changing the makeup)
4. **Unified style** — all costume-and-makeup elements obey the 1990s retro hand-drawn flat-coloring aesthetic system, but without templated copying
5. **Character difference preserved** — different characters should keep distinct clothing according to age, identity, personality and occasion; avoid "everyone wearing the same thing"
6. **No drop in quality** — after the overlay, the hand-drawn texture standard is not below the base model
7. **Costume and makeup only** — overlay makeup/hairstyle/clothing/footwear/accessories only; introducing props, scenes, environment or action is forbidden

---

## 2. Overlay layers

| Layer | Content | Notes |
|---|---|---|
| L0 | Base model | The base likeness model, not modified |
| L1 | Makeup (decision layer) | Analyse the makeup-and-styling intensity from the user's cues |
| L2 | Hair styling | Bun/tied hair/braids + hair ornaments |
| L3 | Inner layer | Replaces the white base inner layer |
| L4 | Outerwear/main garment | Kimono/modern wear/retro wear, etc. |
| L5 | Footwear | Shoe shape/socks/upper material/color scheme |
| L6 | Accessories | Head/ear/neck/waist/hand ornaments |

> **Scope boundary**: character derivative assets cover layers L0–L6 only; they do not cover props, scene environment or pose and action.

---

## 3. Makeup constraints (L1)

### Strategy from base model to derivative makeup and styling (key)

> The character base model is bare-faced, but derivative assets enter the makeup-and-styling flow by default. The system should analyse the makeup need from the user's cues and decide the intensity among base makeup, light makeup and formal makeup.

### Cue-to-makeup mapping

| Cue type | Typical cue | L1 decision |
|---|---|---|
| No clear facial-emphasis cue | Only clothing/hairstyle changes | Base makeup |
| Slight facial cue | Faintly smiling, complexion slightly lifted | Light makeup |
| Clear frail-and-ill cue | Pale complexion, extremely faint lip color | Frail makeup |
| Clear formal-ceremony cue | Full dress, ceremony | Formal makeup |

### Female makeup style matrix

| Style | Applicable scene | Core prompt |
|---|---|---|
| Everyday light makeup | Everyday, first meeting | light makeup, natural makeup, nostalgic feel |
| Date makeup | Date, date | sweet makeup, warm pink, good complexion |
| Formal makeup | Banquet, ceremony | refined makeup, pronounced eye makeup |
| Frail makeup | Injured, weakened | pale complexion, faint lip color, light eye makeup |
| Retro makeup | Nostalgic scenes, classic | retro makeup, 1990s style |

### General skin base

| Item | Constraint | Prompt |
|---|---|---|
| Texture | Flat coloring, even tone | flat coloring, even skin |
| Fairness | Warm fair skin, soft and not glaring | warm fair skin, soft pale |
| Inner glow | Keep a soft-light feel within the flat coloring | translucent skin, soft sheen |
| Forbidden | Over-digital look/oily shine/heavy feel | — |

### Male makeup

| Item | Constraint | Prompt |
|---|---|---|
| Skin base | Healthy skin tone, flat coloring | healthy skin tone, flat coloring |
| Principle | No-makeup makeup — looks unmade-up but with good skin | no-makeup look, naturally good skin |
| Brows | Naturally thick brows, not drawn in | naturally sword-shaped brows, handsome brow line |
| Lip color | Natural blood color, slightly moist | natural lip color, a sense of blood color |

---

## 4. Hair-styling constraints (L2)

### Female styling types

| Styling | Description | Applicable | Prompt |
|---|---|---|---|
| Twin tails | Ponytails on both sides, common in the 1990s | Young girl, everyday | twin tails, 1990s style |
| High ponytail | Ponytail at the crown, brisk | Sports, action | high ponytail, brisk |
| Long hair down | Long hair fully loose, gentle | Gentle, everyday | long hair down, smooth |
| Side ponytail | Ponytail on one side, asymmetric | Playful, individual | side ponytail, playful |
| Braids | Braided styling, refined | Formal, occasions | braids, refined hairstyle |
| Bun | Bun at the crown, cute | Cute, everyday | bun, cute |

### Female hair ornaments

| Item | Constraint | Prompt |
|---|---|---|
| Style | Common in the 1990s, matched to the clothing | 1990s hair ornament, retro style |
| Material | Ribbon/pearl and jade/metal | ribbon hair ornament, pearl-and-jade hair ornament |
| Craft | Hand-drawn texture, true to the 1990s | hand-drawn hair ornament, 1990s style |

### Male styling types

| Styling | Applicable | Prompt |
|---|---|---|
| Short hair | Everyday, brisk | short hair, brisk |
| Medium-long hair | Everyday, refined | medium-long hair, refined |
| Long hair tied up | Formal, combat | long hair tied up, dashing |
| Loose hair over the shoulders | Casual, gentle | loose hair over the shoulders, gentle |

---

## 5. Clothing and footwear constraints (L3+L4+L5)

> **Note**: the styles below are style references, not rigid uniform templates. Combine them freely, guided first by the character's identity, age, occupation, personality and the occasion, as long as the whole still keeps the 1990s retro Japanese anime feel.

### Female clothing matrix

| Style | Cut | Applicable | Prompt |
|---|---|---|---|
| Everyday casual wear | T-shirt/jeans/dress | Everyday, campus | casual wear, comfortable |
| Kimono/hanfu | Traditional clothing | Occasions, themes | kimono, hanfu |
| Sportswear | Sports outfit, hoodie | Sports, leisure | sportswear, energetic |
| Formal dress | Formal gown, 1990s style | Banquet, formal | formal dress, elegant |
| Uniform | School uniform, 1990s uniform | Campus, workplace | uniform, neat |

### General female clothing constraints

| Item | Constraint | Prompt |
|---|---|---|
| Main color | Warm, neutral or low-saturation cool colors may be chosen per character sheet; avoid uniformity | nostalgic color scheme, character-specific color scheme |
| Material | Fabric texture is clear; cotton/knit/uniform wool/silk etc. may be chosen per identity | clear fabric texture, flat coloring |
| Quality | Fluid linework, soft color, keeping the 1990s hand-drawn feel | fluid linework, soft color |
| Layering | Clear layering, rich detail, but the complexity should match the character's identity | clear layering, clear detail |

### Male clothing matrix

| Style | Applicable | Prompt |
|---|---|---|
| Everyday casual wear | T-shirt/jeans | Everyday, casual |
| Uniform | School uniform, 1990s uniform | Uniform, neat |
| Suit | Formal wear, formal | suit, formal |
| Sportswear | Sports outfit, hoodie | Sports, energetic |
| Kimono/hanfu | Traditional, occasions | kimono, hanfu |

### Footwear design matrix (L5)

| Style | Common female shoe types | Common male shoe types | Prompt |
|---|---|---|---|
| Everyday campus | Loafers, Mary Janes, ankle socks with leather shoes | Loafers, sneakers | campus shoes, retro Japanese, clean shoe shape |
| Everyday casual | Canvas shoes, low-top sneakers, ankle boots | Canvas shoes, casual shoes, low-top sneakers | casual shoes, comfortable, nostalgic color scheme |
| Formal occasions | Low heels, thin-strap leather shoes, ankle boots | Leather shoes, ankle boots | formal footwear, refined, crisp lines |
| Traditional clothing | Geta, low-cut embroidered shoes, cloth shoes | Geta, cloth shoes, traditional ankle boots | traditional footwear, matched to the clothing |
| Action/sports | Lightweight sneakers, laced ankle boots | Sneakers, functional ankle boots | lightweight footwear, easy to move in |

### General footwear constraints

| Item | Constraint | Prompt |
|---|---|---|
| Unified style | Footwear must be in period with the main garment, but the shoe type may vary freely with the character's identity | unified with the clothing, retro Japanese |
| Clear structure | Shoe opening/heel/laces/socks are clearly layered | clear shoe shape, clear structure |
| Color scheme | May echo the clothing's main color, secondary color or the character's personal signature color; a single fixed color logic is not required | low-saturation color scheme, nostalgic color |
| Quality | Hand-drawn flat coloring, fluid linework; avoid exaggerated modern streetwear-sneaker design | hand-drawn footwear, flat coloring |
| Forbidden | Bare feet are forbidden, missing footwear design is forbidden, exaggerated modern high-tech sneakers are forbidden | — |

---

## 6. Accessory constraints (L6)

### Female accessories

| Type | Constraint | Prompt |
|---|---|---|
| Head ornament | Headband/hair clip/bow | hair ornament, refined |
| Ear ornament | Earrings/studs | earrings, small |
| Neck ornament | Necklace/pendant | necklace, refined |
| Hand ornament | Bracelet/bangle | bracelet, slender |
| Bag | Handbag, shoulder bag | bag, stylish |

### Male accessories

| Type | Constraint | Prompt |
|---|---|---|
| Glasses | Glasses/sunglasses | glasses, stylish |
| Watch | Watch | watch, refined |
| Ring | Ring | ring, simple |
| Scarf | Scarf | scarf, warm |

---

## 7. Costume-and-makeup combination quick reference

| Scene | Makeup | Hairstyle | Clothing | Footwear | Accessories |
|---|---|---|---|---|---|
| Everyday campus | Everyday light makeup | Twin tails/long hair down | Uniform/everyday casual wear | Loafers/Mary Janes/sneakers | Minimal |
| First meeting | Everyday light makeup | Long hair down/side ponytail | Everyday casual wear | Canvas shoes/low heels | Medium |
| Sweet date | Date makeup | Side ponytail/bun | Casual/kimono | Low heels/geta | Medium to many |
| Formal occasion | Formal makeup | Braids/high ponytail | Formal dress/formal wear | Low-heeled leather shoes/ankle boots | Fairly elaborate |
| Gentle and private | Everyday light makeup | Long hair down | Everyday casual wear | Soft-soled shoes/canvas shoes | Minimal |
| Intense action | Everyday light makeup (extremely faint) | High ponytail | Sportswear | Sneakers/functional ankle boots | Simple |
| Retro scene | Retro makeup | Braids/twin tails | Kimono/retro wear | Geta/cloth shoes | Medium |

> **🔍 Rule for inferring uncovered scenes**
>
> When the scene/situation the user describes is not in the table above, infer it yourself from the core DNA of this style:
>
> | Inference dimension | 1990s retro Japanese anime DNA |
> |---|---|
> | Makeup intensity | Everyday light makeup by default (flat coloring, nostalgic feel); formal/ceremony → formal makeup; date/heart-flutter → date makeup; retro theme → retro makeup |
> | Hairstyle | Everyday/young girl → twin tails or long hair down; sports/action → high ponytail; formal → braids; playful/individual → side ponytail; cute → bun |
> | Clothing | Vary freely with the 1990s style as anchor: choose per character sheet from school uniform, uniform, casual wear, kimono, knitwear, jacket, dress and so on; avoid making characters highly alike |
> | Footwear | Match loafers, canvas shoes, leather shoes, ankle boots, geta and so on to the clothing and identity; there is no single fixed answer |
> | Accessory density | Everyday → minimal (1990s-style hair ornament + basic accessories); formal → medium to elaborate; action/sports → simple or none |
> | Quality baseline | Hand-drawn flat coloring is locked at all times; fluid linework, soft warm color; digital feel/3D rendering/modern CG texture are forbidden |

---

## 8. Four-view character sheet specification

### View definitions

| Position | View | Angle | Shot size | Requirement | Prompt |
|---|---|---|---|---|---|
| Far left | Portrait close-up | Front, eye level | Face to collarbone | Face fills 60%+, features/makeup clear | portrait closeup, face detail |
| Second from left | Front view | Front 0° | Full-body standing figure | Facing the camera, full front view of the clothing | front view, full body |
| Second from right | Side view | Right 90° | Full-body standing figure | Pure profile silhouette, side layering of the clothing | side view, profile |
| Far right | Back view | Rear 180° | Full-body standing figure | Back-of-head hair ornament/back of the clothing clear | back view, rear view |

### Frame specification

| Item | Constraint |
|---|---|
| Layout | Four views side by side, left to right, in one frame |
| Background | Warm-toned off-white #F8F4E8 |
| Standing pose | Standing naturally, feet parallel and slightly apart (**any change of pose is forbidden**) |
| Expression | A micro-expression matching the makeup style (e.g. light makeup → natural, formal makeup → slight smile) |
| Light | Soft cinematic light, even soft light, no hard shadow |
| Consistency | Face/makeup/hairstyle/hair ornaments/clothing/footwear/accessories are exactly the same across the four views |
| Aspect ratio | 4:1 or 3:1 recommended |

---

## 8. Prompt template

```
take the base character likeness image as the base image，img2img overlay of costume and makeup，
90s anime style，retro Japanese anime style，{gender} character four-view sheet，hand-drawn flat coloring，soft warm tones，cinematic light and shadow，
character design sheet，character turnaround，
keep the base likeness face unchanged，{overall temperament}，
【L1·Makeup】{base makeup/light makeup/formal makeup}; using {makeup style}，even skin，{brow makeup}，{eye makeup}，{lip makeup}，
【L2·Hairstyle】{styling type}，fluid hair strands，{hair ornament description}，
【L3+L4·Clothing】{main color}{cut}，{material}，{decorative craft}，fluid clothing lines，clear texture，
【L5·Footwear】{shoe style}，{upper material}，{socks/shoe-opening design}，unified with the clothing，
【L6·Accessories】{head ornament}，{ear ornament}，{neck ornament}，{waist ornament}，
side by side left to right in one frame: portrait close-up + front view + side view + back view，
standing naturally，clean neutral gray background，soft cinematic light，no hard shadow，
four-view consistency，finely rendered face，finely rendered hair strands，clear texture detail
no text of any kind in the image
```

---

## 9. Constraint rules

### Mandatory

| No. | Rule |
|---|---|
| R1 | After the overlay, the face must match the base model |
| R2 | Clothing must carry the 1990s hand-drawn quality of "fluid linework + clear structure", but the cut should be allowed to vary by character |
| R3 | Female accessories must stay in the 1990s style and match the clothing; a single fixed combination is not enforced |
| R4 | Makeup/hairstyle/clothing/footwear/accessories must be unified in style, but must not be templated to the point where characters lose their differences |
| R5 | Must output a four-view sheet (portrait close-up + front view + side view + back view) |
| R6 | Must specify "warm-toned off-white background #F8F4E8" |
| R7 | Must specify "four-view consistency" |
| R8 | **Output the prompt only** — outputting tables/plans/explanations/variants is forbidden |
| R9 | **No scene description** — do not include scene/environment/weather description |
| R10 | **No prop interaction** — do not include any held or interacted-with object |
| R11 | **The pose stays unchanged** — must keep the base model's natural standing pose |
| R12 | **L1 must analyse before deciding** — parse the user's facial cues first, then settle the makeup intensity |
| R13 | **Every derivative asset needs makeup and styling** — at minimum use base makeup |
| R14 | **Makeup intensity is controlled** — no excessively exaggerated makeup |
| R15 | **Props/scenes/actions are not grounds for raising intensity** — that information alone must not lift base makeup higher |

### Forbidden

| No. | Forbidden |
|---|---|
| X1 | Facial drift after the overlay |
| X2 | Accessories too plain/too modern (female) |
| X3 | Makeup/clothing/footwear styles conflicting with one another |
| X4 | Complex scene backgrounds (a warm-toned background is mandatory) |
| X5 | Costume and makeup inconsistent between the four views |
| X6 | Any content other than the prompt |
| X7 | Adding scene description to a character derivative asset |
| X8 | Outputting "quick reference", "plan", "suggestion" and similar sections |
| X9 | Adding any prop interaction |
| X10 | Changing the base model's pose |
| X11 | Adding expression-and-pose interlocking description |
| X12 | Applying fixed makeup directly without analysing the user's cues |
| X13 | Wrongly keeping the bare face, so the required makeup and styling is missing |
| X14 | Wrongly upgrading the makeup merely because of prop/scene/action words |
