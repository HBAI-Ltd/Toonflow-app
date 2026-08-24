# Stop-Motion Clay Character Derivative Asset Generation · Constraint Manual

---

## 1. Overlay principles

1. **The face does not change** — after the overlay, the features must be exactly identical to the base model
2. **The pose does not change** — keep the base model's natural standing pose
3. **Controllable layer by layer** — describe each layer separately so layers can be swapped individually
4. **Unified style** — all costume-and-makeup elements obey the same clay aesthetic system
5. **No drop in texture quality** — after the overlay, the clay texture standard is not below the base model
6. **Costume and makeup only** — overlay makeup/hairstyle/clothing/accessories only; introducing props, scenes or environment is forbidden

---

## 2. Overlay layers

| Layer | Content | Notes |
|---|---|---|
| L0 | Base model | The base likeness model, not modified |
| L1 | Makeup | Basic decorative color accents |
| L2 | Hair styling | Bun/tied hair + simple hair ornaments |
| L3 | Inner layer/inner top | Replaces the white base inner layer |
| L4 | Outer garment/main garment | Coat/robe/outer layer |
| L5 | Accessories | Head/ear/neck/waist ornaments |

> **Scope boundary**: character derivative assets contain only layers L0–L5 (costume, makeup and styling). They do not contain props, scene environment, or poses and actions.

---

## 3. Makeup constraints (L1)

### L1 decision principles

| Cue type | Typical cue | L1 decision |
|---|---|---|
| No clear facial emphasis | Only clothing/hairstyle changes | Basic decorative makeup |
| Slight facial cue | Softness, a smile, brightened complexion | Light decorative makeup |
| Explicit scene cue | Wedding, celebration, formal occasion | Formal decorative makeup |

### Female makeup style matrix

| Style | Fitting scene | Core prompt |
|---|---|---|
| Fresh nude makeup | Everyday, first meeting | natural makeup, clear and understated |
| Sweet warm peach makeup | Sweet romance, a date | pink blush, warm-toned lip color |
| Festive full makeup | Celebration, wedding | rich full makeup, abundant color |
| Evening-banquet makeup | Night, gathering | warm-toned eyeshadow, shimmering lip color |

### Common base skin (shared by all makeup looks)

| Item | Constraint | Prompt |
|---|---|---|
| Texture | Matte clay texture | matte clay, matte clay |
| Fairness | Warm cream | warm cream skin, cream warm tone |
| Forbidden | Highlight/oily sheen/mirror effect | — |

### By area (using sweet warm peach makeup as the example)

| Area | Constraint | Prompt |
|---|---|---|
| Blush | Warm pink, lightly swept over the apples of the cheeks | warm pink blush, soft apple cheeks |
| Eyeshadow | Warm brown/orange range, extremely light | warm brown eyeshadow, extremely light eye makeup |
| Lip makeup | Warm pink/coral, matte | warm pink lip color, matte lip makeup |
| Eyebrows | Naturally curved brows, color matching the hair | naturally curved brows, soft brow shape |

### Male makeup

| Item | Constraint | Prompt |
|---|---|---|
| Base skin | Matte clay texture, warm beige | matte clay, warm beige |
| Principle | Faux-bare face — looks natural but with even skin tone | natural skin tone, faux-bare face |
| Blush | Extremely light color in the complexion, no visible build-up | extremely light complexion, natural complexion |
| Lip color | Natural blood color, matte | natural lip color, matte lips |

---

## 4. Hair styling constraints (L2)

### Female styling types

| Styling | Description | Fitting use | Prompt |
|---|---|---|---|
| Half-up bun | Bun on top + hair falling behind | Everyday, going out | half-up bun, hair half gathered |
| High bun | High bun coiled up, elegant | Formal, celebration | high coiled bun, elegant bun |
| Low-hanging bun | Low bun to one side, languid | Private, leisure | low-hanging bun, languid hairstyle |
| Double buns | Two symmetrical buns, girlish | Young characters | double buns, girlish hairstyle |
| Fully loose hair | Long hair fully loose | Injured, down on one's luck | long hair falling loose, smooth hair |

### Female hair ornaments

| Item | Constraint | Prompt |
|---|---|---|
| Style | Retro and cozy, not over-complex | retro hair ornament, cozy decoration |
| Material | Clay material, simple metal | clay hair ornament, simple metal |
| Decoration | Flowers/bead strings/ribbons | flower hair ornament, bead-string accents |

### Male styling types

| Styling | Fitting use | Prompt |
|---|---|---|
| Half-crown tied hair | Everyday, simple | half-crown tied hair, naturally tied hair |
| Full crown, high-tied | Formal, ceremony | high-tied hair crown, formal hairstyle |
| Loose hair over the shoulders | Private, leisure | loose hair over the shoulders, natural long hair |
| Tied ponytail | Action, activity | tied ponytail, brisk hairstyle |

---

## 5. Clothing constraints (L3+L4)

### Female clothing matrix

| Style | Design | Fitting use | Prompt |
|---|---|---|---|
| Everyday long dress | Simple long dress | Everyday, leisure | simple long dress, everyday wear |
| Formal long gown | Layered long gown | Formal, celebration | layered long gown, ornate formal gown |
| Light everyday wear | Short top + skirt | Action, activity | light everyday wear, short top and skirt |
| Sleepwear | Loose long dress | Indoors, night | loose sleepwear, comfortable long dress |
| Wedding dress | Red layered long dress | Wedding | red wedding dress, layered red outfit |

### Common constraints for female clothing

| Item | Constraint | Prompt |
|---|---|---|
| Main color | Warm tones dominant, low saturation | warm-toned clothing, soft colors |
| Material | Clay-sculpted, simple texture | clay material, simple texture |
| Texture quality | Texture clearly visible | clear clothing texture |
| Layering | Simple layering, clearly separated layers | simple layering, clearly separated layers |

### Male clothing matrix

| Style | Fitting use | Prompt |
|---|---|---|
| Retro everyday robe | Everyday, at home | retro long robe, everyday wear |
| Combat-ready outfit | Adventure, action | combat-ready outfit, adventure clothing |
| Outer robe and cloak | Making an entrance, night travel | outer robe, dark cloak |
| Everyday casual wear | Leisure, private | everyday wear, casual wear |
| Formal wear | Celebration, ceremony | formal wear, formal clothing |

---

## 6. Accessory constraints (L5)

### Female accessories

| Type | Constraint | Prompt |
|---|---|---|
| Head ornament | Not over-complex, cozy style | simple head ornament, cozy decoration |
| Ear ornament | Small drop earrings/earrings | small drop earrings, refined earrings |
| Neck ornament | Simple necklace/choker | simple necklace, refined choker |
| Waist ornament | Simple belt/jade pendant | simple belt, small jade pendant |
| Hand ornament | Simple bracelet | simple bracelet, small bracelet |

### Male accessories

| Type | Constraint | Prompt |
|---|---|---|
| Hair crown | Simple hair crown/jade hairpin | simple hair crown, jade hairpin holding the hair |
| Waist sash | Simple waist sash/leather belt | simple waist sash, distinct texture |
| Jade pendant | Translucent and soft-warm | jade pendant at the waist, soft-warm jade pendant |
| Trinket | Simple hanging trinket/sword worn at the side (optional) | simple hanging trinket, small sword at the side |

---

## 7. Costume-and-makeup combination quick reference

| Scene | Makeup | Hairstyle | Clothing | Accessories |
|---|---|---|---|---|
| Everyday in her room | Fresh nude makeup | Half-up bun | Everyday long dress | Simple |
| First meeting | Fresh nude makeup | Half-up/high bun | Everyday long dress | Medium |
| Sweet romantic interaction | Sweet warm peach makeup | Half-up/low-hanging | Everyday long dress | Medium |
| Formal appearance | Festive full makeup | High bun | Formal long gown | Elaborate |
| Night conversation in secret | Fresh nude/peach makeup | Fully loose/low-hanging | Sleepwear | Minimal |
| Wedding ceremony | Festive full makeup | High bun | Wedding dress | Elaborate |

---

> **🔍 Rule for inferring uncovered scenes**
>
> When the scene/situation the user describes is not in the table above, infer it yourself from the core DNA of this style:
>
> | Inference dimension | Stop-motion clay DNA |
> |---|---|
> | Makeup intensity | Fresh nude makeup by default (matte clay texture); sweet romance/everyday → sweet warm peach makeup; celebration/wedding → festive full makeup; night/indoors → evening-banquet makeup |
> | Hairstyle | Everyday → half-up bun; formal/celebration → high bun; private/leisure → low-hanging bun or fully loose hair; every hairstyle keeps the clay-sculpted feel |
> | Clothing | Retro-whimsical keynote; everyday → simple long dress; formal → layered formal long gown; action → light everyday wear; the material is always clay-sculpted + simple texture |
> | Accessory elaborateness | Stay cozy and not over-elaborate; celebration → elaborate (flowers + bead strings); everyday → simple; action → minimal |
> | Texture baseline | Matte clay texture is locked at all times; highlights/metallic reflection are forbidden; warm cream skin feel takes priority |

## 8. Four-view character sheet specification

### View definitions

| Position | View | Angle | Shot size | Requirement | Prompt |
|---|---|---|---|---|---|
| Far left | Portrait close-up | Front, eye level | Face to collarbone | Face fills 60%+, features/makeup clear | portrait closeup, face detail |
| Second from left | Front view | Front 0° | Full-body standing figure | Facing the camera, full front view of the clothing | front view, full body |
| Second from right | Side view | Right 90° | Full-body standing figure | Pure profile silhouette, side layering of the clothing | side view, profile, full body |
| Far right | Back view | Rear 180° | Full-body standing figure | Hair ornament at the back of the head/clothing on the back/hair ends clear | back view, rear view, full body |

### Frame specification

| Item | Constraint |
|---|---|
| Layout | Four views side by side, left to right, in one frame |
| Background | Clean neutral gray #E8E8E8 |
| Standing pose | Standing naturally, feet parallel and slightly apart, arms hanging naturally |
| Expression | A micro-expression matching the makeup style, facial micro-expression only |
| Light | Warm soft light, key light from the front + fill light on both sides, no hard shadow |
| Consistency | Face/makeup/hairstyle/hair ornament/clothing/accessories are exactly the same across the four views |
| Aspect ratio | 4:1 or 3:1 recommended |

---

## 9. Prompt template

```
using the character base likeness image as the base image，stop-motion clay {gender} character four-view sheet，stop-motion animation style，3D cartoon render，warm-toned light and shadow，
character design sheet，character turnaround，
keep the face of the base likeness unchanged，{overall temperament}，
【L1·Makeup】decided from the user's cues: {basic decorative makeup/light decorative makeup/formal decorative makeup}; use {makeup style}，matte clay texture，{brow makeup}，{eye makeup}，{lip makeup}，
【L2·Hairstyle】{styling type}，clay hairstyle，{hair ornament description}，
【L3+L4·Clothing】{main color}{design}，{material}，{decorative craft}，clear clothing texture，
【L5·Accessories】{head ornament}，{ear ornament}，{neck ornament}，{waist ornament}，
side by side left to right in one frame: portrait close-up + front view + side view + back view，
standing naturally，clean neutral gray background，warm soft light，no hard shadow，
four-view consistency，finely rendered clay texture，soft healing expression
no text of any kind in the image
```

---

## 10. Constraint rules

### Mandatory

| No. | Rule |
|---|---|
| R1 | After the overlay the face must match the base model |
| R2 | Clothing must use "clear clothing texture" |
| R3 | Female accessories must be "not over-complex, cozy in style" |
| R4 | Makeup/hairstyle/clothing/accessories keep a unified style |
| R5 | Must output a four-view sheet |
| R6 | Must specify "clean neutral gray background" |
| R7 | Must specify "four-view consistency" |
| R8 | **Output the prompt only** — outputting non-prompt content is forbidden |
| R9 | **No scene description** |
| R10 | **No prop interaction** |
| R11 | **The pose stays unchanged** |
| R12 | **L1 must analyse before deciding** |
| R13 | **Every derivative asset needs makeup and styling** |
| R14 | **Makeup intensity must be restrained** |
| R15 | **Props/scene/action are not grounds for raising the intensity** |

### Forbidden

| No. | Forbidden |
|---|---|
| X1 | Facial drift after the overlay |
| X2 | Accessories too simple/modernised |
| X3 | Makeup and clothing styles conflicting with each other |
| X4 | Complex scene backgrounds (a plain gray ground is mandatory) |
| X5 | Costume and makeup inconsistent between the four views |
| X6 | Any content other than the prompt |
| X7 | Adding any prop interaction |
| X8 | Changing the base model's pose |
| X9 | Adding descriptions that link expression and pose |
| X10 | Applying a fixed makeup look directly without analysing the user's cues |
| X11 | Wrongly staying bare-faced |
| X12 | Wrongly upgrading the makeup because of prop/scene/action words alone |
