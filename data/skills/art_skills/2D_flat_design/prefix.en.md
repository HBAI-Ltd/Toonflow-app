# Global Aesthetic Baseline · 2D Flat Design

---
You must strictly and completely follow every style constraint and global rule below, and generate the prompt strictly in the prompt-template format; output only the prompt body, and do not attach any explanation, note, comment, heading or other extra text.
## 1. Style DNA

| Dimension | Definition |
|---|---|
| **Primary style** | 2D Flat Design |
| **Secondary style** | Geometric shapes · solid color blocks · no shadow, no gradient |
| **Emotional key** | Minimalist and modern · bright and fresh |
| **Texture anchor words** | Clean lines, solid-color fill, color-block contrast |

---

## 2. Global color palette (a style baseline, not a hard lock)

> Goal: unify the aesthetic, not restrict the work. Apart from the "hard-constrained colors", the remaining colors are preferred by default and may drift within a reasonable range.

### Color usage tiers

| Tier | Constraint strength | Notes |
|---|---|---|
| L1 hard constraint | High | Locks only the core of character recognition: the aesthetic direction of skin tone, hair color and the base color of the main outfit |
| L2 soft constraint | Medium | Scene colors, accessory colors and accent colors take the palette as first reference, adjustable per shot and plot |
| L3 exception mechanism | Low | Romantic/climactic/special scenes may temporarily break local colors, but must keep the overall flat logic |

| No. | Color name | Value | Use |
|---|---|---|---|
| C1 | Bright blue | #3B82F6 | Backgrounds, clothing, cool-toned subjects |
| C2 | Vivid orange | #F59E0B | Warm accents, emotional peaks |
| C3 | Pure white | #FFFFFF | Backgrounds, negative space, a sense of purity |
| C4 | Deep brown hair | #4A3728 | Hair color, irises |
| C5 | Refined gray | #8A8A8A | Neutral color, secondary elements |
| C6 | Pale purple | #C084FC | Night, dreamlike moods, accents |
| C7 | Warm pink | #FB7185 | Romance, heart-flutter, accents |
| C8 | Light yellow | #FDE047 | Warmth, sunlight, backgrounds |
| C9 | Off-white | #FEF3C7 | Backgrounds, negative space, a sense of warmth |
| C10 | Mint green | #5EEAD4 | Nature, freshness, environment |

### Hard-constrained colors (locked by default)

| Color item | Mapped color | Rule |
|---|---|---|
| Skin-tone baseline | C3 pure white + C9 off-white | Preferred by default, slight lightness adjustment allowed |
| Hair/iris color baseline | C4 deep brown hair | Preferred by default, drift toward deep brown/dark chestnut allowed |

### Soft-constrained colors (recommended first)

> C1/C2/C5/C6/C7/C8/C10 are the recommended color range, used for clothing, decoration, backgrounds, warm light, environment and so on. They may be adjusted to a neighbouring hue according to the mood of the shot.

### Emotion palette (director-aligned version)

| Emotional scene | Main color | Secondary color | Suggested color-block contrast | Frame keywords |
|---|---|---|---|---|
| Everyday warmth | C9 off-white | C3 pure white + C5 refined gray | Low contrast, soft | Lived-in feel, warmth, calm |
| Heart-flutter moment | C7 warm pink | C2 vivid orange + C9 off-white | Medium contrast, main color stands out | Shyness, closeness, ambiguity |
| Office/study | C1 bright blue | C3 pure white + C5 refined gray | High contrast, rational | Efficient, calm, professional |
| Romantic scene | C7 warm pink | C2 vivid orange + C8 light yellow | High contrast, romantic | Sweetness, warmth, emotion |
| Night scene | C6 pale purple | C1 bright blue + C2 vivid orange | Cool-dominant, warm accents | Quiet, mysterious, reflective |
| Memory/flashback | C8 light yellow | C5 refined gray + C7 warm pink | Low contrast, soft | Nostalgia, old memories, dreamlike |
| Parting sorrow | C5 refined gray | C1 bright blue + C6 pale purple | High contrast, cool-toned | Distance, restraint, quiet pressure |
| Reunion and release | C9 off-white | C7 warm pink + C2 vivid orange | Cool first then warm, gradual | Warming up, letting go, healing |

### Rules for using the emotion palette

| No. | Rule |
|---|---|
| E1 | Every prompt must name at least 1 "emotional scene" and bind a main-color + secondary-color combination to it |
| E2 | No more than 2 main colors in a single shot, to keep the color narrative in focus |
| E3 | When the emotion switches, adjust hue and color temperature first, then saturation |
| E4 | Healing-oriented content follows "warm base + warm/cool contrast" by default: warm colors lay the base, cool colors serve backgrounds/secondary elements |
| E5 | If it conflicts with the plot, the emotion palette takes priority over the generally recommended colors, but the strict prohibitions must not be broken |

### Color-temperature constraints

| Parameter | Value | Notes |
|---|---|---|
| Overall color temperature | Neutral 5500-6500K (recommended) | The minimalist modern keynote |
| Skin color temperature | Slightly warm 5800-6200K (recommended) | Off-white but alive |
| Contrast | Medium-high (keep it there) | Color-block contrast is clear but not excessive |
| Saturation | Medium-high 70-90% (suggested range) | The refined tone of the flat style |

### Tolerance and exceptions

| Item | Suggested tolerance |
|---|---|
| Hue shift | ±8° |
| Saturation shift | ±10% |
| Lightness shift | ±12% |

> Exception scenes: romantic, climactic and emotional-turn shots may use warmer or more saturated local color blocks; but highly saturated fluorescent colors and modern color language are forbidden in frame.

---

## 3. Global constraint rules

### Mandatory rules (inherited by all skills)

| No. | Rule |
|---|---|
| R1 | Must contain the style anchor words "2D flat style + Flat Design" |
| R2 | Must state "no shadow, no gradient + solid color blocks" |
| R3 | Faces must use "geometric shapes + clean lines" |
| R4 | Outlines must use "clear lines + uniform and consistent" |
| R5 | Color must state "solid-color fill + clear color-block contrast" |

### Strict prohibitions (inherited by all skills)

| No. | Forbidden content |
|---|---|
| X1 | "3D rendering/photorealistic rendering/photo-level realism" is forbidden |
| X2 | "Shadow/gradient/texture/light-and-shadow" is forbidden |
| X3 | "Highly saturated fluorescent colors/neon colors" are forbidden |
| X4 | Words tending toward "facial deformation/broken proportions/anatomical anomalies" are forbidden |
| X5 | "Complex detail/fine texture/realistic background" is forbidden |
| X6 | "3D perspective/depth description" is forbidden |
