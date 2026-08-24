# Global Aesthetic Baseline · 3D Anime Render

---
You must strictly and completely follow every style constraint and global rule below, and generate the prompt strictly in the prompt-template format; output only the prompt body, and do not attach any explanation, note, comment, heading or other extra text.
## 1. Style DNA

| Dimension | Definition |
|---|---|
| **Primary style** | 3D Anime Render (3D Animation Rendering) |
| **Secondary style** | Cel-shaded texture · cinematic light-and-shadow layering |
| **Emotional key** | Healing · bright and warm |
| **Texture anchor words** | Clear outlines, high-detail materials, soft warm tones |

---

## 2. Global color palette (a style baseline, not a hard lock)

> Goal: unify the aesthetic, not restrict the work. Apart from the "hard-constrained colors", the remaining colors are preferred by default and may drift within a reasonable range.

### Color usage tiers

| Tier | Constraint strength | Notes |
|---|---|---|
| L1 hard constraint | High | Locks only the core of character recognition: the aesthetic direction of skin tone, hair color and the base color of the main outfit |
| L2 soft constraint | Medium | Scene colors, accessory colors and accent colors take the palette as first reference, adjustable per shot and plot |
| L3 exception mechanism | Low | Romantic/climactic/special scenes may temporarily break local colors, but must keep the overall warm-tone logic |

| No. | Color name | Value | Use |
|---|---|---|---|
| C1 | Warm orange | #F5A673 | Skin-tone base, dusk, sunset glow |
| C2 | Cherry-blossom pink | #F4D5D5 | Cheek blush, romance, accents |
| C3 | Sky blue | #87AEC9 | Sky, clothing, cool-toned accents |
| C4 | Deep brown hair | #4A3728 | Hair color, irises |
| C5 | Refined gray | #8A8A8A | Architecture, shadow, neutral color |
| C6 | Pale purple | #D0C4D6 | Night, dreamlike moods, memories |
| C7 | Warm amber | #C9A96E | Dusk, lamplight, a sense of warmth |
| C8 | Mint green | #9DC2A5 | Plants, nature, environment |
| C9 | Off-white | #F5F0E8 | Walls, clothing, backgrounds |
| C10 | Warm yellow | #F5E6D0 | Interiors, warm light, a cozy feel |

### Hard-constrained colors (locked by default)

| Color item | Mapped color | Rule |
|---|---|---|
| Skin-tone baseline | C1 warm orange | Preferred by default, slight lightness/warmth adjustment allowed |
| Hair/iris color baseline | C4 deep brown hair | Preferred by default, slight drift toward deep brown/dark chestnut allowed |

### Soft-constrained colors (recommended first)

> C2/C3/C5/C6/C7/C8/C9/C10 are the recommended color range, used for clothing, decoration, backgrounds, warm light, environment and so on. They may be adjusted to a neighbouring hue according to the mood of the shot.

### Emotion palette (director-aligned version)

| Emotional scene | Main color | Secondary color | Suggested lighting and contrast | Frame keywords |
|---|---|---|---|---|
| Everyday warmth | C10 warm yellow | C9 off-white + C5 refined gray | Even warm tone, soft contrast | Lived-in feel, warmth, calm |
| Heart-flutter moment | C2 cherry-blossom pink | C1 warm orange + C10 warm yellow | Warmer in medium and closer shots, slightly flushed skin | Shyness, closeness, ambiguity |
| Urban landscape | C9 off-white | C5 refined gray + C3 sky blue | Clear light-dark layering, neutral-dominant | Urban, open, natural |
| Dusk romance | C7 warm amber | C1 warm orange + C2 cherry-blossom pink | Backlit sunset glow, rim light | Romance, warmth, emotion |
| Night street scene | C3 sky blue | C6 pale purple + C1 warm orange | Cool-dominant, warm accents | Urban, quiet, alive |
| Indoor everyday | C10 warm yellow | C9 off-white + C5 refined gray | Warm soft-focus light, a cozy feel | Home, comfort, safety |
| Memory/flashback | C1 warm orange | C5 refined gray + C7 warm amber | Soft focus and haze, slightly faded | Nostalgia, old memories, dreamlike |
| Parting sorrow | C5 refined gray | C3 sky blue + C1 warm orange | Lower saturation, widen the warm/cool gap | Distance, restraint, quiet pressure |

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
| Overall color temperature | Warm 4800-5200K (recommended) | The warm healing keynote |
| Skin color temperature | Slightly warm 5000-5400K (recommended) | Warm orange but alive |
| Contrast | Medium (keep it there) | Light-dark layering is clear but not excessive |
| Saturation | Medium-high 65-80% (suggested range) | The refined tone of 3D anime |

### Tolerance and exceptions

| Item | Suggested tolerance |
|---|---|
| Hue shift | ±8° |
| Saturation shift | ±10% |
| Lightness shift | ±12% |

> Exception scenes: romantic, dusk and emotional-peak shots may use warmer or more saturated local color blocks; but highly saturated fluorescent colors and modern color language are forbidden in frame.

---

## 3. Global constraint rules

### Mandatory rules (inherited by all skills)

| No. | Rule |
|---|---|
| R1 | Must contain the style anchor words "3D animation render + cel-shaded texture" |
| R2 | Must state "clear outlines + high-detail materials" |
| R3 | Faces must use "realistic materials combined with cartoon proportions + soft light-and-shadow" |
| R4 | Hair strands must use "clear outlines + natural light-and-shadow layering" |
| R5 | Lighting must state "cinematic lighting + soft light-and-shadow layering" |

### Strict prohibitions (inherited by all skills)

| No. | Forbidden content |
|---|---|
| X1 | "Photorealistic rendering/photo-level realism" is forbidden |
| X2 | "Dark tones/heavy shadow/excessive contrast" is forbidden |
| X3 | "Highly saturated fluorescent colors/neon colors" are forbidden |
| X4 | Words tending toward "facial deformation/broken proportions/anatomical anomalies" are forbidden |
| X5 | "Missing modern elements" is forbidden (a modern setting must be stated explicitly) |
| X6 | "Cyberpunk/steampunk/invented Western-fantasy elements" are forbidden |