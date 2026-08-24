# Global Aesthetic Baseline · Guofeng 3D

---
You must strictly and completely follow every style constraint and global rule below, and generate the prompt strictly in the prompt-template format; output only the prompt body, and do not attach any explanation, note, comment, heading or other extra text.

## 1. Style DNA

| Dimension | Definition |
|---|---|
| **Primary style** | Guofeng 3D render (Chinese Style 3D) |
| **Secondary style** | High-precision 3D modeling · traditional Eastern aesthetics |
| **Emotional key** | Elegant and expansive, deeply evocative, ornate and refined |
| **Texture anchor words** | PBR material rendering, volumetric light, ambient occlusion |

---

## 2. Global color palette (style baseline)

### Color usage tiers

| Tier | Constraint strength | Notes |
|---|---|---|
| L1 hard constraint | High | Traditional Chinese color baseline, 3D render color |
| L2 soft constraint | Medium | Scene colors, costume colors and accent colors may be fine-tuned to the plot |
| L3 exception mechanism | Low | Special scenes/festivals may temporarily break local colors |

### Core palette

| No. | Color name | Value | Use |
|---|---|---|---|
| C1 | Moon white (月白) | #E0E8F0 | Sky, cloud and mist, base color of white robes |
| C2 | Blue-green (青绿) | #4A8C7E | Landscape, vegetation, blue-green landscape painting |
| C3 | Vermilion (朱红) | #B22222 | Architecture, doors and windows, festive scenes |
| C4 | Indigo (靛蓝) | #3B4B7C | Night sky, distant mountains, cool tones |
| C5 | Golden yellow (金黄) | #D4AF37 | Decoration, patterns, highlights |
| C6 | Ink black (墨黑) | #1C1C1C | Lines, outlines, dark areas |
| C7 | Rouge (胭脂) | #A94A5F | Character skin tone, lip color, blush |
| C8 | Ochre (赭石) | #965E3E | Architectural woodwork, ground, warm tones |
| C9 | Gamboge (藤黄) | #F0E442 | Accents, floral ornament, warm light |
| C10 | Plain gray (素灰) | #B8B8B8 | Stone, transitions, mid-tones |

### Hard-constrained colors (locked by default)

| Color item | Mapped color | Rule |
|---|---|---|
| Overall tone | Traditional Chinese tones dominant | Highly saturated fluorescent colors are forbidden |
| Material texture | PBR physical material rendering | A plastic feel/absence of texture is forbidden |
| Lighting direction | Natural light + artificial light combined | Single-source hard light is forbidden |

### Emotion palette

| Emotional scene | Main color | Secondary color | Suggested lighting and contrast | Frame keywords |
|---|---|---|---|---|
| Courtly opulence | C3 vermilion + C5 golden yellow | C1 moon white + C6 ink black | Warm-light illumination, emphasized highlights, depth-of-field layering | Ornate, solemn, imposing |
| Landscape mood | C2 blue-green + C1 moon white | C4 indigo + C10 plain gray | Soft volumetric light, depth-of-field blur, misty atmosphere | Poetic, far-reaching, ethereal |
| Boudoir gentleness | C7 rouge + C1 moon white | C5 golden yellow + C10 plain gray | Soft warm light, local highlights, medium close-up (近景) and close-up (特写) | Tender, delicate, warm |
| Wuxia grimness | C6 ink black + C4 indigo | C8 ochre + C10 plain gray | Cool-toned shadow, hard-light contrast, oppressive atmosphere | Austere, sharp, deadly |
| Festive celebration | C3 vermilion + C9 gamboge | C5 golden yellow + C7 rouge | Highly saturated warm light, overall brightness, rich color | Lively, joyful, grand |
| Moonlit night stillness | C4 indigo + C1 moon white | C6 ink black + C5 golden yellow accents | Cool-toned moonlight, local warm light, light-dark contrast | Quiet, cool, beautiful |

### Color-temperature constraints

| Parameter | Value | Notes |
|---|---|---|
| Overall color temperature | Toward neutral 4800-5500K (recommended) | Natural light as the keynote |
| Contrast | Medium 45-65% (suggested range) | Rich sense of layering |
| Saturation | Medium-high 55-75% (suggested range) | A full traditional palette |

### Tolerance and exceptions

| Item | Suggested tolerance |
|---|---|
| Hue shift | ±8° |
| Saturation shift | ±10% |
| Lightness shift | ±12% |

---

## 3. Global constraint rules

### Mandatory rules (inherited by all skills)

| No. | Rule |
|---|---|
| R1 | Must contain the style anchor words "3D render style" |
| R2 | Must state "PBR materials + high-precision modeling" |
| R3 | Must state "traditional Chinese color + Eastern aesthetics" |
| R4 | Must state "cinema-level lighting render" |
| R5 | Must state "Guofeng 3D aesthetics" |

### Strict prohibitions (inherited by all skills)

| No. | Forbidden content |
|---|---|
| X1 | "Realistic photography/photo-level realism" is forbidden |
| X2 | "Highly saturated fluorescent colors/neon colors/overly digital feel" are forbidden |
| X3 | "Western fantasy/cyberpunk/modern elements" are forbidden |
| X4 | "Low-precision modeling/crude textures/plastic texture" are forbidden |
| X5 | "Chaotic color/wrong lighting/wrong perspective" are forbidden |