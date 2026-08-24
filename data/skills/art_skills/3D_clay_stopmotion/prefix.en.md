# Global Aesthetic Baseline · Stop-Motion Clay

---
You must strictly and completely follow every style constraint and global rule below, and generate the prompt strictly in the prompt-template format; output only the prompt body, and do not attach any explanation, note, comment, heading or other extra text.
## 1. Style DNA

| Dimension | Definition |
|---|---|
| **Primary style** | Stop-Motion Clay (Stop-Motion Claymation) |
| **Secondary style** | Whimsical 3D cartoon · warm-toned light-and-shadow layering |
| **Emotional key** | Healing and nostalgic · childlike and delicate |
| **Texture anchor words** | Clay texture, fingerprint indentations, soft shallow depth of field |

---

## 2. Global color palette (a style baseline, not a hard lock)

> Goal: unify the aesthetic, not restrict the work. Apart from the "hard-constrained colors", the remaining colors are preferred by default and may drift within a reasonable range.

### Color usage tiers

| Tier | Constraint strength | Notes |
|---|---|---|
| L1 hard constraint | High | Locks only the core of character recognition: the aesthetic direction of skin tone, hair color and the base color of the main outfit |
| L2 soft constraint | Medium | Scene colors, accessory colors and accent colors take the palette as first reference, adjustable per shot and plot |
| L3 exception mechanism | Low | Whimsical/climactic/special scenes may temporarily break local colors, but must keep the overall warm-tone logic |

| No. | Color name | Value | Use |
|---|---|---|---|
| C1 | Cream yellow | #F5E6D0 | Skin-tone base, warm light, interiors |
| C2 | Terracotta red | #C96E5A | The clay body itself, warm accents |
| C3 | Sky blue | #87AEC9 | Sky, clothing, cool-toned accents |
| C4 | Deep brown hair | #4A3728 | Hair color, irises |
| C5 | Refined gray | #8A8A8A | Architecture, shadow, neutral color |
| C6 | Pale purple | #D0C4D6 | Night, dreamlike moods, magic |
| C7 | Warm amber | #C9A96E | Dusk, lamplight, a sense of warmth |
| C8 | Mint green | #9DC2A5 | Plants, nature, environment |
| C9 | Off-white | #F5F0E8 | Walls, clothing, backgrounds |
| C10 | Warm orange | #E8C890 | Sunset, firelight, a cozy feel |

### Hard-constrained colors (locked by default)

| Color item | Mapped color | Rule |
|---|---|---|
| Skin-tone baseline | C1 cream yellow | Preferred by default, slight lightness/warmth adjustment allowed |
| Hair/iris color baseline | C4 deep brown hair | Preferred by default, slight drift toward deep brown/dark chestnut allowed |

### Soft-constrained colors (recommended first)

> C2/C3/C5/C6/C7/C8/C9/C10 are the recommended color range, used for clothing, decoration, backgrounds, warm light, environment and so on. They may be adjusted to a neighbouring hue according to the mood of the shot.

### Emotion palette (director-aligned version)

| Emotional scene | Main color | Secondary color | Suggested lighting and contrast | Frame keywords |
|---|---|---|---|---|
| Everyday warmth | C1 cream yellow | C9 off-white + C5 refined gray | Even warm tone, soft contrast | Lived-in feel, warmth, calm |
| Heart-flutter moment | C2 terracotta red | C1 cream yellow + C10 warm orange | Warmer in medium and closer shots, slightly flushed skin | Shyness, closeness, ambiguity |
| Indoor everyday | C9 off-white | C5 refined gray + C1 cream yellow | Clear light-dark layering, neutral-dominant | Home, comfort, safety |
| Whimsical/magic | C6 pale purple | C7 warm amber + C3 sky blue | Magic light motes, colored halos | Dreamlike, mysterious, whimsical |
| Outdoor nature | C8 mint green | C1 cream yellow + C3 sky blue | Natural warm tone, layered shadows | Fresh, open, free |
| Night dreamscape | C6 pale purple | C3 sky blue + C1 cream yellow | Cool-dominant, warm accents | Quiet, contemplative, solitude |
| Memory/flashback | C1 cream yellow | C5 refined gray + C7 warm amber | Soft focus and haze, slightly faded | Nostalgia, old memories, dreamlike |
| Parting sorrow | C5 refined gray | C3 sky blue + C1 cream yellow | Lower saturation, widen the warm/cool gap | Distance, restraint, quiet pressure |

### Rules for using the emotion palette

| No. | Rule |
|---|---|
| E1 | Every prompt must name at least 1 "emotional scene" and bind a main-color + secondary-color combination to it |
| E2 | No more than 2 main colors in a single shot, to keep the color narrative in focus |
| E3 | When the emotion switches, adjust the lighting ratio and color temperature first, then saturation |
| E4 | Healing-oriented content follows "warm base + warm/cool contrast" by default: warm colors lay the base, cool colors serve backgrounds/shadows |
| E5 | If it conflicts with the plot, the emotion palette takes priority over the generally recommended colors, but the strict prohibitions must not be broken |

### Color-temperature constraints

| Parameter | Value | Notes |
|---|---|---|
| Overall color temperature | Warm 4500-5000K (recommended) | The warm nostalgic keynote |
| Skin color temperature | Slightly warm 4800-5200K (recommended) | Cream yellow but alive |
| Contrast | Medium (keep it there) | Light-dark layering is clear but not excessive |
| Saturation | Medium-low 60-75% (suggested range) | The refined tone of stop-motion animation |

### Tolerance and exceptions

| Item | Suggested tolerance |
|---|---|
| Hue shift | ±8° |
| Saturation shift | ±10% |
| Lightness shift | ±12% |

> Exception scenes: whimsical, magic and emotional-peak shots may use warmer or more saturated local color blocks; but highly saturated fluorescent colors and modern color language are forbidden in frame.

---

## 3. Global constraint rules

### Mandatory rules (inherited by all skills)

| No. | Rule |
|---|---|
| R1 | Must contain the style anchor words "stop-motion animation style + clay texture" |
| R2 | Must state "visible fingerprint indentations + clay-texture material" |
| R3 | Faces must use "3D cartoon character + soft shallow depth of field" |
| R4 | Hair strands must use "clay sculpting + handcrafted marks preserved" |
| R5 | Lighting must state "cinematic light-and-shadow layering + warm-tone dominant" |

### Strict prohibitions (inherited by all skills)

| No. | Forbidden content |
|---|---|
| X1 | "Modern 3D animation style/Pixar/late-period Disney style" is forbidden |
| X2 | "Smooth plastic/modern CG rendering" is forbidden |
| X3 | "Highly saturated fluorescent colors/neon colors" are forbidden |
| X4 | Words tending toward "facial deformation/broken proportions/anatomical anomalies" are forbidden |
| X5 | "Modern scenes/modern architecture/modern clothing" are forbidden |
