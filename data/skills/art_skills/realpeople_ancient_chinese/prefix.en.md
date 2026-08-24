# Global Aesthetic Baseline · Live-Action Ancient Chinese Realism

---
You must strictly and completely follow every style constraint and global rule below, and generate the prompt strictly in the prompt-template format; output only the prompt body, and do not attach any explanation, note, comment, heading or other extra text.
## 1. Style DNA

| Dimension | Definition |
|---|---|
| **Primary style** | Live-action ancient Chinese realism (Ancient-Chinese Photorealism) |
| **Secondary style** | Live-action realistic photography · film/TV-grade documentary texture |
| **Emotional key** | Sweet-romance leaning — cool with warmth, sparse yet dense |
| **Texture anchor words** | High contrast, extreme detail, ancient-style realist documentary |

---

## 2. Global color palette (style baseline, not a hard lock)

> Goal: unify the aesthetic rather than restrict creation. Apart from the "hard-constrained colors", the remaining colors are preferred by default and may shift within a reasonable range.

### Color usage tiers

| Tier | Constraint strength | Notes |
|---|---|---|
| L1 hard constraint | High | Locks only the core of character recognition: the aesthetic direction of skin tone, hair color and the base color of the main clothing |
| L2 soft constraint | Medium | Scene colors, accessory colors and accent colors take the palette as the preferred reference, and may be fine-tuned per shot and plot |
| L3 exception mechanism | Low | Festival/memory/climax scenes may temporarily break local colors, but the overall warm-cool logic must be kept |

| No. | Color name | Value | Use |
|---|---|---|---|
| C1 | Moon white (月白) | #D6E4EC | Base color of main clothing, mist, gauze drapes |
| C2 | Cool fair skin (冷白肤) | #F5EDE8 | Baseline skin tone for female characters |
| C2b | Warm fair skin (暖白肤) | #F5E6D8 | Baseline skin tone for male characters |
| C3 | Pearl gold (珠光金) | #E8D5B0 | Embroidery, accessory highlights, headpieces |
| C4 | Ink-jade black (墨玉黑) | #1A1A2E | Hair color, irises, outlines |
| C5 | Rosy-mist pink (烟霞粉) | #F2D7D5 | Lip color, blush, petals |
| C6 | Indigo blue-gray (青黛) | #4A6670 | Distant landscape, fill color in dark areas |
| C7 | Amber warm (琥珀暖) | #C9A96E | Warm light, candlelight, sunset glow |
| C8 | Frost-snow silver (霜雪银) | #C0C7CE | Weapons, water reflections, silver ornaments |
| C9 | Neutral gray (中性灰) | #E8E8E8 | Background of design sheets |
| C10 | Plain white (素白) | #F8F6F0 | Base color of the inner robe |

### Hard-constrained colors (locked by default)

| Color item | Mapped color | Rule |
|---|---|---|
| Baseline skin tone for female characters | C2 cool fair skin | Preferred by default; small lightness/warmth adjustments allowed |
| Baseline skin tone for male characters | C2b warm fair skin | Preferred by default; avoid a yellow or overly gray cast |
| Baseline hair/iris color | C4 ink-jade black | Preferred by default; a slight shift toward dark blue or cool brown is allowed |

### Soft-constrained colors (recommended, preferred)

> C3/C5/C6/C7/C8/C9/C10 are the recommended color range, used for embroidery, petals, distant scenery, warm light, silver ornaments, backgrounds, inner robes and so on. They may be adjusted to neighboring shades within the same hue according to the mood of the shot.

### Emotion palette (director-aligned version)

| Emotional scene | Main color | Secondary color | Suggested light effect and contrast | Frame keywords |
|---|---|---|---|---|
| First-sight flutter (restrained sweetness) | C1 moon white | C5 rosy-mist pink + C8 frost-snow silver | Cool base + local soft warm highlights, high contrast but no blowout | Cool and clear, breathing room, faintly sweet |
| Rising tension (intimacy closing in) | C5 rosy-mist pink | C7 amber warm + C10 plain white | Medium and close shots (中近景) warm up, skin tone slightly warmer, background stays low-saturation | Soft focus, whisper-close, pressed near |
| Protective vow (steady and safe) | C10 plain white | C3 pearl gold + C4 ink-jade black | Clear light-and-dark layering, gold used only as edge accents | Settled, ceremonial, trusting |
| Separation and misunderstanding (cold, distant, oppressive) | C6 indigo blue-gray | C1 moon white + C9 neutral gray | Lower saturation overall, widen the warm-cool contrast, deepen the shadows | Distance, restraint, still pressure |
| Reunion and release (tearful warming) | C1 moon white | C7 amber warm + C5 rosy-mist pink | Cool first then warm, warm light gradually rising on the character's face | Rewarming, letting go, damp air |
| Grand wedding (classical highlight) | C3 pearl gold | C7 amber warm + C5 rosy-mist pink | Saturation may be raised locally; avoid fluorescent red; gold emphasizes ceremonial patterns | Sumptuous, solemn, sweet and festive |
| Night banquet and lantern fair (romantic flowing light) | C7 amber warm | C6 indigo blue-gray + C8 frost-snow silver | Warm light sources dominate, cool colors hold up the background, keep detail in the dark areas | Flowing light, lantern shadows, eyes meeting in the crowd |
| Dream and memory (realist treatment) | C1 moon white | C6 indigo blue-gray + C3 pearl gold | Low-saturation haze coexists with real light positions; a slight color cast is allowed but no neon | Ethereal, old-memory feel, real and shootable |

### Rules for using the emotion palette

| No. | Rule |
|---|---|
| E1 | Every prompt must specify at least 1 "emotional scene" and bind a main-color + secondary-color combination to it |
| E2 | No more than 2 main colors per shot; avoid losing the focus of color storytelling |
| E3 | When the emotion switches, adjust lighting ratio and color temperature first, then saturation |
| E4 | Sweet-romance work follows "cool base + warm accents" by default: cool colors lay the base, warm colors land on the focus of the character relationship |
| E5 | If it conflicts with the plot, the emotion palette takes priority over the general recommended colors, but the strict prohibitions must not be broken |

### Color-temperature constraints

| Parameter | Value | Notes |
|---|---|---|
| Overall color temperature | Toward cool 5800-7000K (recommended) | A cool, ethereal keynote |
| Skin-tone color temperature | Slightly warm 5200-5600K (recommended) | Cool and fair, but alive |
| Contrast | High (keep it there) | Sharp light-and-dark contrast |
| Saturation | Medium-low 30-50% (suggested range) | A refined gray tonality |

### Tolerance and exceptions

| Item | Suggested tolerance |
|---|---|
| Hue shift | ±8° |
| Saturation shift | ±10% |
| Lightness shift | ±12% |

> Exception scenes: weddings, lantern fairs, memories and emotional-climax shots may use warmer or more saturated local color blocks; but neon, fluorescent and modern color language are forbidden in frame.

---

## 3. Global constraint rules

### Mandatory rules (inherited by all skills)

| No. | Rule |
|---|---|
| R1 | Must contain the "live-action realistic photography" style anchor word |
| R2 | Must state "high contrast + extreme detail" |
| R3 | Faces must use "delicate facial rendering + delicate skin" |
| R4 | Hair must use "strand-by-strand separation + delicate hair-strand rendering" |
| R5 | Texture must state "ultra-crisp texture detail" |

### Strict prohibitions (inherited by all skills)

| No. | Forbidden content |
|---|---|
| X1 | "Cartoon/anime/2D anime/illustration style" is forbidden |
| X2 | "Highly saturated fluorescent colors/neon colors" is forbidden |
| X3 | "Modern elements in frame" is forbidden |
| X4 | Terms tending toward "facial deformation/extra fingers/abnormal limbs" are forbidden |
| X5 | "Nudity/exposure/see-through/suggestive description" is forbidden |
