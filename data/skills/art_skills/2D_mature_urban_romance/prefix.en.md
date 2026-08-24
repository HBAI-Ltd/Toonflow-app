# Global Aesthetic Baseline · Mature Urban Romance Anime

---
You must strictly and completely follow every style constraint and global rule below, and generate the prompt strictly in the prompt-template format; output only the prompt body, and do not attach any explanation, note, comment, heading or other extra text.

## 1. Style DNA

| Dimension | Definition |
|---|---|
| **Primary style** | Mature Urban Romance Anime |
| **Secondary style** | Modern-novel-adaptation anime style · cinema-level texture |
| **Emotional key** | Sweet-doting — warmth inside coolness, closeness inside distance |
| **Texture anchor words** | Cel shading, clean lines, dramatic low-key lighting |

---

## 2. Global color palette (a style baseline, not a hard lock)

> Goal: unify the aesthetic, not restrict the work. Apart from the "hard-constrained colors", the remaining colors are preferred by default and may drift within a reasonable range.

### Color usage tiers

| Tier | Constraint strength | Notes |
|---|---|---|
| L1 hard constraint | High | Locks only the core of character recognition: the aesthetic direction of skin tone, hair color and the base color of the main outfit |
| L2 soft constraint | Medium | Scene colors, accessory colors and accent colors take the palette as first reference, adjustable per shot and plot |
| L3 exception mechanism | Low | Festival/memory/climax scenes may temporarily break local colors, but must keep the overall warm-cool logic |

| No. | Color name | Value | Use |
|---|---|---|---|
| C1 | Cool-white skin | `#F5EDE8` | Female skin-tone baseline |
| C2 | Warm-white skin | `#F5E6D8` | Male skin-tone baseline |
| C3 | Light blue | `#B8D4E3` | Sky, cool-toned environment |
| C4 | Ink black | `#1A1A2E` | Hair color, irises, outlines |
| C5 | Hazy rose | `#F2D7D5` | Lip color, blush, emotional accents |
| C6 | Blue-gray | `#7A8B99` | Distant buildings, shadow areas |
| C7 | Amber warm | `#C9A96E` | Warm light, lamplight, emotional peaks |
| C8 | Silver gray | `#C0C7CE` | Modern architecture, metal materials |
| C9 | Neutral gray | `#E8E8E8` | Character-sheet background |
| C10 | Plain white | `#F8F6F0` | Interior walls, base inner-garment color |

### Hard-constrained colors (locked by default)

| Color item | Mapped color | Rule |
|---|---|---|
| Female skin-tone baseline | C1 cool-white skin | Preferred by default, small lightness/warmth adjustment allowed |
| Male skin-tone baseline | C2 warm-white skin | Preferred by default, avoid going yellow or too gray |
| Hair/iris color baseline | C4 ink black | Preferred by default, slight drift toward dark blue/cool brown allowed |

### Soft-constrained colors (recommended first)

> C3/C5/C6/C7/C8/C9/C10 are the recommended color range, used for sky, emotional accents, distant views, warm light, metal materials, backgrounds, walls and so on. They may be adjusted to a neighbouring hue according to the mood of the shot.

### Emotion palette (director-aligned version)

| Emotional scene | Main color | Secondary color | Suggested lighting and contrast | Frame keywords |
|---|---|---|---|---|
| First-meeting flutter (restrained sweetness) | C1 cool-white skin | C5 hazy rose + C8 silver gray | Cool base + local soft warm highlights, strong contrast but no blowout | Cool-detached, breathing room, faintly sweet |
| Ambiguity warming up (intimacy closing in) | C5 hazy rose | C7 amber warm + C10 plain white | Warm up the medium and medium close shots, skin tone slightly warmer, background stays low-saturation | Soft focus, whispering feel, close in |
| Protective promise (steady and safe) | C10 plain white | C3 light blue + C4 ink black | Clear light-dark layering, silver/blue emphasizing a sense of safety | Settled, ceremonial, trust |
| Separation and misunderstanding (cold, distant, oppressive) | C6 blue-gray | C1 cool-white skin + C9 neutral gray | Lower saturation overall, widen the warm-cool contrast, deepen shadows | Distance, restraint, quiet pressure |
| Reunion and release (tearful re-warming) | C1 cool-white skin | C7 amber warm + C5 hazy rose | Cool first then warm, warm light gradually rising on the character's face | Warming up, letting go, moist air |
| Grand wedding celebration (classical highlight) | C7 amber warm | C5 hazy rose + C3 light blue | Saturation may be raised locally, avoid fluorescent colors; gold emphasizes ceremony | Opulent, solemn, sweet joy |
| Night banquet lantern fair (romantic flowing light) | C7 amber warm | C6 blue-gray + C3 light blue | Warm light sources dominate, cool colors hold up the background, keep shadow detail | Flowing light, lamp shadows, eyes meeting in the crowd |
| Dream and memory (realistic treatment) | C1 cool-white skin | C6 blue-gray + C3 light blue | Low-saturation haze coexists with real light positions, slight color cast allowed but no neon | Ethereal, old-memory feel, real and shootable |

### Rules for using the emotion palette

| No. | Rule |
|---|---|
| E1 | Every prompt must name at least 1 "emotional scene" and bind a main-color + secondary-color combination to it |
| E2 | No more than 2 main colors in a single shot, to keep the color narrative in focus |
| E3 | When the emotion switches, adjust the lighting ratio and color temperature first, then saturation |
| E4 | Sweet-doting content follows "cool base + warm accent" by default: cool colors lay the base, warm colors land on the focus of the characters' relationship |
| E5 | If it conflicts with the plot, the emotion palette takes priority over the generally recommended colors, but the strict prohibitions must not be broken |

### Color-temperature constraints

| Parameter | Value | Notes |
|---|---|---|
| Overall color temperature | Cool-leaning 5800-7000K (recommended) | The cool, ethereal keynote |
| Skin color temperature | Slightly warm 5200-5600K (recommended) | Cool-white but alive |
| Contrast | Strong (keep it there) | Sharp light-dark contrast |
| Saturation | Medium-low 30-50% (suggested range) | A refined gray tone |

### Tolerance and exceptions

| Item | Suggested tolerance |
|---|---|
| Hue shift | ±8° |
| Saturation shift | ±10% |
| Lightness shift | ±12% |

> Exception scenes: wedding, lantern fair, memory and emotional-climax shots may use warmer or more saturated local color blocks; but neon and fluorescent colors and modern color language are forbidden in frame.

---

## 3. Global constraint rules

### Mandatory rules (inherited by all skills)

| No. | Rule |
|---|---|
| R1 | Must contain the "anime style" style anchor words (anime style / cel shading) |
| R2 | Must state "cel shading + clean lines" |
| R3 | Faces must use "finely rendered features + delicate skin" |
| R4 | Hair must use "distinct layering + finely rendered strands" |
| R5 | Texture must state "ultra-crisp texture detail" |
| R6 | Must state "cinema-level composition + dramatic low-key lighting" |

### Strict prohibitions (inherited by all skills)

| No. | Forbidden content |
|---|---|
| X1 | "Live-action realism/photography/3D rendering/CGI" is forbidden |
| X2 | "Highly saturated fluorescent colors/neon colors" are forbidden |
| X3 | "Modern elements in frame" is forbidden (phones, computer screens, modern signage and the like) |
| X4 | Words tending toward "facial deformation/extra fingers/anatomical anomalies" are forbidden |
| X5 | "Nudity/exposure/see-through/suggestive description" is forbidden |
