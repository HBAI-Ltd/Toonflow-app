# Global Aesthetic Baseline · Live-Action Urban Realism

---
You must strictly and completely follow every style constraint and global rule below, and generate the prompt strictly in the prompt-template format; output only the prompt body, and do not attach any explanation, note, comment, heading or other extra text.
## 1. Style DNA

| Dimension | Definition |
|---|---|
| **Primary style** | Live-action urban realism (Modern-Photorealism) |
| **Secondary style** | Live-action realistic photography · film/TV-level documentary texture |
| **Emotional key** | Sweet and tender — direct expression, warmth of everyday life |
| **Texture anchor words** | Strong contrast, extreme detail, urban realist documentary feel |

---

## 2. Global color palette (a style baseline, not a hard lock)

> Goal: unify the aesthetic, not restrict the work. Apart from the "hard-constrained colors", the remaining colors are preferred by default and may drift within a reasonable range.

### Color usage tiers

| Tier | Constraint strength | Notes |
|---|---|---|
| L1 hard constraint | High | Locks only the core of character recognition: the aesthetic direction of skin tone, hair color and the base color of the main outfit |
| L2 soft constraint | Medium | Scene colors, accessory colors and accent colors take the palette as first reference, adjustable per shot and plot |
| L3 exception mechanism | Low | Festive/memory/climactic scenes may temporarily break local colors, but must keep the overall warm-cool logic |

| No. | Color name | Value | Use |
|---|---|---|---|
| C1 | Off-white | #F5F0E8 | Base color of the main outfit, walls, curtains |
| C2 | Warm fair skin | #F5E6D8 | Skin-tone baseline for female/male characters |
| C3 | Cream pink | #F4D7D5 | Lip color, blush, decorative accents |
| C4 | Deep brown hair | #3A2E25 | Hair color, irises |
| C5 | Refined gray | #8A8A8A | Modern architecture, furniture, accessories |
| C6 | Cool blue | #5E7485 | Night backgrounds, light through windows, cool light sources |
| C7 | Warm amber | #C9A96E | Warm lamps, candlelight, sunset light |
| C8 | Metallic silver | #C0C7CE | Electronic devices, jewellery, reflections |
| C9 | Neutral gray | #E8E8E8 | Character-sheet background |
| C10 | Greige | #E5DED3 | Home soft furnishings, sofas, rugs |

### Hard-constrained colors (locked by default)

| Color item | Mapped color | Rule |
|---|---|---|
| Skin-tone baseline | C2 warm fair skin | Preferred by default, small lightness/warmth adjustment allowed |
| Hair/iris color baseline | C4 deep brown hair | Preferred by default, slight drift toward deep brown/dark chestnut allowed |

### Soft-constrained colors (recommended first)

> C1/C3/C5/C6/C7/C8/C9/C10 are the recommended color range, used for clothing, decoration, backgrounds, warm light, silver jewellery, home interiors and so on. They may be adjusted to a neighbouring hue according to the mood of the shot.

### Emotion palette (director-aligned version)

| Emotional scene | Main color | Secondary color | Suggested lighting and contrast | Frame keywords |
|---|---|---|---|---|
| First meeting (everyday) | C1 off-white | C5 refined gray + C9 neutral gray | Cool base + local warm light, strong contrast but no blown highlights | Natural, lived-in feel, chance encounter |
| Signal of attraction (ambiguity) | C3 cream pink | C7 warm amber + C1 off-white | Warm up medium and close shots (中近景), raise skin temperature slightly, keep the background low-saturation | Warmth, closeness, ambiguity |
| Work scene (everyday) | C5 refined gray | C1 off-white + C8 metallic silver | Clear light-and-dark layering, gray tones dominant | Professional, restrained, distant |
| Conflict and argument (cool-toned) | C5 refined gray | C6 cool blue + C9 neutral gray | Drop saturation overall, widen the warm-cool gap, deepen shadows | Tense, confrontational, distant |
| Reunion and reconciliation (warming up) | C1 off-white | C7 warm amber + C3 cream pink | Cool first then warm, warm light on the character's face increasing gradually | Warming up, letting go, healing |
| Sweet date (highlight) | C7 warm amber | C3 cream pink + C5 refined gray | Saturation may be raised locally, avoid fluorescence; warm light emphasizes intimacy | Romantic, intimate, heart-flutter |
| Nightlife (urban feel) | C6 cool blue | C7 warm amber + C8 metallic silver | Warm light sources dominate, cool background holds them up, keep shadow detail | Neon, urban, rhythm |
| Memory/flashback (softened) | C1 off-white | C5 refined gray + C7 warm amber | Low-saturation haze coexists with real light positions, slight color cast allowed but no neon | Soft, old memories, real |

### Rules for using the emotion palette

| No. | Rule |
|---|---|
| E1 | Every prompt must name at least 1 "emotional scene" and bind a main-color + secondary-color combination to it |
| E2 | No more than 2 main colors in a single shot, to keep the color narrative in focus |
| E3 | When the emotion switches, adjust the lighting ratio and color temperature first, then saturation |
| E4 | Sweet, tender content follows "cool base + warm accent" by default: cool colors lay the base, warm colors land on the focus of the character relationship |
| E5 | If it conflicts with the plot, the emotion palette takes priority over the generally recommended colors, but the strict prohibitions must not be broken |

### Color-temperature constraints

| Parameter | Value | Notes |
|---|---|---|
| Overall color temperature | Warm-leaning 5200-5800K (recommended) | The warm modern keynote |
| Skin color temperature | Slightly warm 5200-5600K (recommended) | Warm fair but alive |
| Contrast | Strong (keep it there) | Vivid light-and-dark difference |
| Saturation | Medium-low 40-60% (suggested range) | The refined modern tone |

### Tolerance and exceptions

| Item | Suggested tolerance |
|---|---|
| Hue shift | ±8° |
| Saturation shift | ±10% |
| Lightness shift | ±12% |

> Exception scenes: date, neon and emotional-peak shots may use warmer or more saturated local color blocks; but neon fluorescence and modern color language are forbidden in frame.

---

## 3. Global constraint rules

### Mandatory rules (inherited by all skills)

| No. | Rule |
|---|---|
| R1 | Must contain the style anchor words "live-action realistic photography" |
| R2 | Must state "strong contrast + extreme detail" |
| R3 | Faces must use "finely rendered features + delicate skin" |
| R4 | Hair must use "every strand distinct + finely rendered hair strands" |
| R5 | Texture must state "ultra-crisp texture detail" |

### Strict prohibitions (inherited by all skills)

| No. | Forbidden content |
|---|---|
| X1 | "Cartoon/anime/2D anime/illustration style" is forbidden |
| X2 | "Highly saturated fluorescent colors/neon colors" are forbidden |
| X3 | "Missing modern elements" is forbidden (the modern setting must be stated explicitly) |
| X4 | Words tending toward "facial deformation/extra fingers/anatomical anomalies" are forbidden |
| X5 | "Nudity/exposure/see-through/suggestive description" is forbidden |
| X6 | "Ancient style/period costume/hanfu/traditional architectural elements" are forbidden |