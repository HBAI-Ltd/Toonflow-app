# Character Base Image Generation · Medieval Epic Constraint Manual

---

## 1. Base image principles

1. **The face is the soul** — facial features are the character's only anchor; pore-level fine rendering
2. **Character-driven** — base clothing is decided by the character description (station / trade / gender / setting); specific costume comes later as overlay layers
3. **Four-view consistency** — face / build / hair / base clothing highly consistent across views
4. **Weathered truth** — even at rest the character carries lived history: wind-chapped skin, work-hardened hands, fatigue or resolve in the eyes
5. **Live-action photography** — anchored to real photography; keep true skin texture (pores / small flaws / healed scars); **never fresh wounds or blood (S-rules)**

---

## 2. Facial constraints

> Facial features are not fixed by parameters; they are derived freely from the character description (gender / age / temperament / origin) to guarantee visual differentiation between characters and support a diverse cast.

### General requirements

| Item | Constraint |
|---|---|
| Features | Derived naturally from the character description; no preset face / eye / brow / nose / lip shapes; any ethnicity per description |
| Style base | Live-action photorealism, pore-level rendering, real material, motivated natural light |
| Temperament | Distill temperament keywords from the description (grim / weary / resolute / gentle / cunning) and write them into the prompt |
| Expression | Neutral micro-expression consistent with temperament |
| History | Lived history may show as healed scars, weather lines, old calluses — never open wounds |

---

## 3. Skin constraints

| Item | Constraint | Prompt |
|---|---|---|
| Tone | Any natural tone per character description, even across body | natural skin tone, even complexion |
| Finish | Natural, matte-leaning; wind and cold visible | weathered skin, wind-chapped cheeks |
| Texture | Pores visible, fine lines, small flaws, healed scars allowed | visible pores, fine lines, healed scar |
| Grooming | Period-true: no modern makeup, no whitened teeth, natural brows | no modern grooming, period-authentic |

---

## 4. Build constraints

| Item | Constraint | Prompt |
|---|---|---|
| Height | Set by character description; default 155–190cm | {height}cm tall |
| Proportion | 7–8 heads tall, strictly constrained full-body proportion | 7-8 heads tall proportion |
| Hands | Working hands: knuckles, tendons, old calluses | weathered working hands |
| Posture | Natural stance, weight settled, shoulders honest to the life lived | natural stance, lived-in posture |

---

## 5. Base hair constraints

> Only natural loose / simply tied styles here; braids, ornaments, and styling come in the derivative stage.

| Item | Constraint | Prompt |
|---|---|---|
| Color | Natural color per description (black / brown / auburn / grey / blond), no modern dye | natural hair color |
| Length | Per character description | shoulder-length hair, long hair |
| Texture | Strand-level clarity, real texture, slightly unkempt | individual hair strands, natural texture |
| Style | Loose or simply tied back, no ornament | natural hairstyle, no ornament |
| Facial hair | Per description; period-natural, not barbered sharp | natural beard, rough stubble |

---

## 6. Base clothing constraints

> Base clothing is the character's "everyday default state", decided by station / trade; armor, cloaks, and formal dress are overlays in the derivative stage. **No modern garments.**

### Station-based defaults

| Station | Default clothing direction |
|---|---|
| Serf / villager | Coarse wool tunic, patched, rope or simple belt |
| Guild hunter | Leather jerkin over wool, sturdy boots, weather-stained |
| Man-at-arms | Padded gambeson, worn straps, no plate at base |
| Noble | Fine wool and linen layers, subdued dye, quality visible in cut not shine |
| Royalty | Rich but restrained: deep-dyed wool, fur trim, no gold gloss |
| Nonhuman (elf etc.) | Simple natural-fiber dress adapted to their culture, worn and practical |
| Unspecified | Plain medieval wool layers, low-saturation neutral tones |

### Clothing unity rules

- Style must match the medieval photorealism aesthetic (natural dye tones, real fabric)
- Low-saturation neutral colors, no complex pattern, ready for derivative overlays
- Identical garment style across all four views
- Base clothing is the "everyday default"; focus stays on face and build
- Forbidden: modern garments, underwear-as-base, revealing or sexualized dress

---

## 7. Nonhuman characters (elves, beasts, creatures)

> This style supports nonhuman characters as first-class cast, rendered with **practical-effects realism** — as if built by a film creature shop, never glossy CG.

| Item | Constraint | Prompt |
|---|---|---|
| Anatomy | Plausible bone and muscle logic, weight-bearing stance | plausible anatomy, weighted stance |
| Surface | Real material: skin, scale, fur, horn with micro-texture and wear | practical creature effects, micro-textured skin |
| Eyes | Living, wet, catch-light — the emotional anchor | expressive eyes, natural catchlight |
| History | Old scars healed over, worn claws, notched horn — never fresh wounds | healed old scars, weathered hide |
| Ban | Glossy CG, neon glow, cartoon proportions | — |

---

## 8. Four-view sheet specification

### View definitions

| Position | View | Angle | Framing | Requirement | Prompt |
|---|---|---|---|---|---|
| Far left | Portrait close-up | Front, eye level | Crown to collarbone | Full crown-to-collarbone, face 60%+, features clear | portrait closeup, face detail, head to collarbone complete |
| Left 2 | Front view | Front 0° | Full body | Facing camera, arms natural, full head-to-toe | front view, full body head to toe |
| Right 2 | Side view | Right 90° | Full body | Clean profile silhouette, full head-to-toe | side view, profile, full body head to toe |
| Far right | Back view | Rear 180° | Full body | Back of head / back / hair ends / feet clear | back view, rear view, full body head to toe |

### Frame specification

| Item | Constraint |
|---|---|
| Layout | Four views side by side, left to right, in one frame |
| Background | Clean neutral grey #E8E8E8 |
| Stance | Natural standing, feet slightly apart, arms at sides |
| Full body | Head-to-toe complete, no cropping |
| Portrait | Crown-to-collarbone complete, no crown crop |
| Expression | Neutral micro-expression per temperament |
| Light | Even soft light, front key + side fill, no hard shadow |
| Consistency | Skin / build / hair / face / base clothing identical across views |
| Ratio | 4:1 or 3:1 recommended |

---

## 9. Prompt template

```
{gender or creature-type} character four-view design sheet, live-action photography, medieval period drama realism, strong contrast, ultra-fine detail,
character design sheet, character turnaround,
{facial features derived from character description}, {overall temperament}, natural state,
{skin tone}, weathered skin, visible pores, fine lines, {healed scar note if any},
{height}cm tall, {heads-tall proportion}, {build description}, natural stance,
{hair color}{hair length}, individual hair strands, natural texture, no ornament, {facial hair if any},
{station-appropriate base clothing, e.g. coarse wool tunic / leather jerkin over wool / fine subdued wool layers}, low-saturation natural dye tones, no complex pattern,
side by side left to right in one frame: portrait closeup + front view + side view + back view,
portrait closeup complete from crown to collarbone, no crown crop,
full-body views complete from head to toe, no cropping,
natural standing, clean neutral grey background, even soft light, no hard shadow,
four-view consistency, fine facial rendering, fine hair rendering, real skin texture
no text anywhere in the image
```

---

## 10. Constraint rules

### Mandatory

| No. | Rule |
|---|---|
| R1 | Must be "natural state" — no armor, no weapons, no props at base |
| R2 | Must declare station-appropriate base clothing from the character description; no modern garments, no underwear-as-base |
| R3 | Must declare "no hair ornament, no accessories" |
| R4 | Must specify "clean neutral grey background" |
| R5 | Must specify "four-view consistency" |
| R6 | Full-body views complete head to toe, no cropping |
| R7 | Must declare height and constrain proportion via heads-tall conversion |
| R8 | Portrait complete crown to collarbone, no crown crop |
| R9 | Skin must keep real weathered texture; no over-smoothing |
| R10 | Zero fresh blood or open wounds on the asset (S1) — lived history only through healed scars, dirt, fatigue |

### Strictly forbidden

| No. | Forbidden |
|---|---|
| X1 | Modern garments; underwear / revealing / sexualized base; clothing contradicting the description; complex pattern that blocks overlays |
| X2 | Hard top light / underlight / colored light |
| X3 | Over-whitening / over-smoothing to plastic |
| X4 | Complex scene background (must be plain grey) |
| X5 | Exaggerated expression / dynamic pose |
| X6 | Cropping head or feet on full-body views |
| X7 | Cropping crown on the portrait |
| X8 | Fresh wounds, blood, gore on the asset |
| X9 | Religious symbols or garments (robes of clergy, crosses, prayer items) |
| X10 | Glossy-CG creature look for nonhuman characters |
