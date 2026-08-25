# Character Derivative Asset Generation · Medieval Epic Constraint Manual

---

## 1. Overlay principles

1. **Face unchanged** — features after overlay must match the base model exactly; no facial drift
2. **Pose unchanged** — keep the base model's natural standing pose; no pose / action / posture change
3. **Layer-by-layer control** — each layer described independently, replaceable per layer (change armor without changing hair)
4. **Style unity** — all costume elements obey the same medieval aesthetic
5. **Texture never degrades** — overlay quality standard no lower than the base model
6. **Costume scope only** — overlay grooming / hair styling / garments / accessories only; no props, scenes, environments, or actions
7. **Reference-safe** — derivative assets are reused as generation references; zero fresh blood or open wounds at any layer (S1)

---

## 2. Overlay layers

| Layer | Content | Notes |
|---|---|---|
| L0 | Base model | Base image, unmodified |
| L1 | Condition state (decision layer) | Analyze user cues first, then decide: kept / travel-worn / campaign-worn intensity |
| L2 | Hair styling | Braids, ties, period styling + modest ornaments |
| L3 | Underlayer | Linen shirt / wool underlayer replacing the plain base |
| L4 | Outer layer | Tunic / gambeson / mail / brigandine / cloak / gown |
| L5 | Accessories | Belt, sword belt (empty scabbard allowed as costume), guild medallion, brooch, gloves, fur trim |

> **Scope boundary**: character derivative assets cover L0–L5 (costume and grooming) only. Hand-held props (weapons drawn, torches, maps), scene environments, weather, and pose/action changes belong to other asset types.

---

## 3. Condition state constraints (L1)

### From base to derivative condition strategy (key)

> The base model is a neutral state, but derivative assets default into a condition pass. Analyze the user's cues and choose intensity between kept, travel-worn, and campaign-worn.

### L1 cue analysis and decision

| Step | Processing | Result |
|---|---|---|
| A1 | Extract user cues: state words, emotion words, hardship words | Condition summary |
| A2 | Filter non-condition cues: prop / scene / action words are not condition evidence | Prevent misreads |
| A3 | Match the condition matrix and pick intensity | kept / travel-worn / campaign-worn |
| A4 | Generate the final L1 prompt | Output conclusions only, never the analysis |

### Cue-to-condition mapping

| Cue type | Typical cues | L1 decision |
|---|---|---|
| No hardship cues | Only garment/hair changes requested | kept |
| Travel cues | On the road, forest camp, rain, long ride | travel-worn |
| Campaign cues | After battle, siege, long pursuit, exile | campaign-worn (still zero fresh wounds — reads through dust, dried mud, torn hem, fatigue) |
| Court cues | Feast, audience with the lord, guild ceremony | kept (formal) |

### Condition matrix

| State | Skin & face | Costume surface | Prompt |
|---|---|---|---|
| Kept | Clean, rested, brushed hair | Garments brushed, straps set | well-kept, freshly brushed wool |
| Travel-worn | Dust on cheekbones, wind-tangled hair | Mud at hems, damp shoulders, road dust | travel-worn, road dust, mud-caked hem |
| Campaign-worn | Deep fatigue, grime, chapped lips, old healed scars visible | Torn edges, scorch marks, dented fittings, dulled steel | campaign-worn, battle-worn gear, dented fittings, dulled steel |

> **Hard ban at every state**: fresh blood, open wounds, bandages soaked red. Hardship reads through dirt, damage to gear, and fatigue in the face.

---

## 4. Hair styling constraints (L2)

| Style | Description | Fits | Prompt |
|---|---|---|---|
| Loose natural | Hair loose, weather-tousled | Travel, camp | natural loose hair, weather-tousled |
| Tied back | Simple leather tie, practical | Hunt, work | tied back with leather cord |
| Braided | Single or double braids, warrior or noble patterns | Battle, ceremony | braided hair, warrior braids |
| Crowned styling | Coiled or pinned, modest metal pins | Court, feast | coiled braids, modest silver pins |
| Short cropped | Rough-cut practical | Soldiers, laborers | rough-cropped hair |

Facial hair follows the same logic: rough stubble (travel) → trimmed beard (court) → matted (campaign).

---

## 5. Garment constraints (L3+L4)

### Garment matrix by station and occasion

| Direction | Pieces | Fits | Prompt |
|---|---|---|---|
| Commoner daily | Wool tunic, hood, patched cloak | Village, tavern | coarse wool tunic, patched cloak |
| Hunter field dress | Leather jerkin, wool layers, weather cloak, bracers | Hunt, travel | leather jerkin, weathered cloak, leather bracers |
| Soldier kit | Gambeson, mail shirt, surcoat with heraldry | March, garrison | padded gambeson, riveted mail, worn surcoat |
| Knightly harness | Fitted plate over mail, heraldic surcoat, sword belt | Battle, tourney | fitted steel plate, heraldic surcoat, dulled steel |
| Noble court dress | Fine wool gown/doublet, fur trim, subdued deep dye | Court, feast | fine wool doublet, fur-trimmed, deep subdued dye |
| Guild ceremony | Guild colors, hunter's medallion, formal cloak | Guild hall rites | guild colors, hunter's medallion, formal cloak |

### General garment constraints

| Item | Constraint | Prompt |
|---|---|---|
| Color | Natural dyes, low saturation, per palette C1–C7 | natural dye tones, muted colors |
| Fabric | Real fiber visible: wool weave, linen slub, leather grain, fur nap | visible wool weave, leather grain |
| Wear | Every piece shows being worn: creases, strap marks, polished contact points | worn creases, strap marks |
| Layering | Clear medieval layering, not over-stacked | clear layering, practical fit |

---

## 6. Accessory constraints (L5)

| Type | Constraint | Prompt |
|---|---|---|
| Belts | Worn leather, iron or brass buckle, tool loops | worn leather belt, iron buckle |
| Guild marks | Hunter's medallion, guild badge — secular insignia only | hunter's guild medallion |
| Jewelry | Modest period pieces: brooch, ring, torc; no gemstone gloss | simple brooch, worn silver ring |
| Gloves & bracers | Working leather, scuffed | scuffed leather gloves |
| Sword belt | Belt and empty scabbard allowed as costume; the weapon itself is a prop asset | sword belt with scabbard |
| Ban | Religious symbols (crosses, rosaries, clerical items), modern items, neon or glowing elements | — |

---

## 7. Costume combination quick table

| Scenario | L1 condition | L2 hair | L3+L4 garments | L5 accessories |
|---|---|---|---|---|
| Village daily | kept | loose / tied | commoner daily | worn belt |
| Hunt departure | kept → travel | tied / braided | hunter field dress | bracers, medallion |
| Long pursuit / exile | travel-worn | weather-tousled | hunter field dress, damaged | minimal |
| After the battle | campaign-worn | matted, tangled | soldier kit / harness, dented | scuffed, strap-torn |
| Guild ceremony | kept (formal) | braided / coiled | guild ceremony dress | medallion, formal cloak |
| Court audience | kept (formal) | crowned styling | noble court dress | brooch, fur trim |

> **🔍 Inference rule for uncovered scenarios**
>
> When the user's scenario is not in the table, infer from the style genes:
>
> | Dimension | Medieval epic gene |
> |---|---|
> | Condition intensity | Default kept; road/forest/rain → travel-worn; battle/siege/exile → campaign-worn (never fresh wounds) |
> | Hair | Practical for field, braided for ceremony, matted for campaign |
> | Garments | Station decides quality; occasion decides formality; fabric always real and worn |
> | Accessories | Fewer in the field, guild marks for rites, modest jewelry at court; never religious, never glowing |
> | Texture baseline | Live-action photography anchor; pores + fabric weave always kept; no plastic, no CG |

---

## 8. Four-view sheet specification

### View definitions

| Position | View | Angle | Framing | Requirement | Prompt |
|---|---|---|---|---|---|
| Far left | Portrait close-up | Front, eye level | Face to collarbone | Face 60%+, features / condition clear | portrait closeup, face detail |
| Left 2 | Front view | Front 0° | Full body | Costume front fully shown | front view |
| Right 2 | Side view | Right 90° | Full body | Profile silhouette, costume side layering | side view, profile |
| Far right | Back view | Rear 180° | Full body | Hair back, cloak back, gear straps clear | back view, rear view |

### Frame specification

| Item | Constraint |
|---|---|
| Layout | Four views side by side, left to right, one frame |
| Background | Clean neutral grey #E8E8E8 |
| Stance | Natural standing, feet slightly apart, arms at sides |
| Expression | Micro-expression consistent with condition, face only |
| Light | Even soft light, front key + side fill, no hard shadow |
| Consistency | Face / condition / hair / garments / accessories identical across views |
| Ratio | 4:1 or 3:1 recommended |

---

## 9. Prompt template

### Output format constraints

| Item | Constraint |
|---|---|
| Output | **Prompt text only**, nothing else |
| Forbidden output | Quick tables, layer plans, constraint tables, prohibition lists, variant plans, suggestions — any non-prompt content |
| No scenes | Character derivatives contain **no scene / environment / weather / background narrative** |
| No props | **No prop interaction** — no weapons drawn, torches, maps, cups or held objects |
| No pose change | **Base pose unchanged** — no walking / turning / raising arms / any action |
| Format | Output the usable prompt code block directly; no titles, tables, explanations, comparisons |

### Full costume overlay (four views)

```
Using the character base image as the underlay, img2img costume overlay,
medieval {gender or creature-type} character four-view design sheet, live-action photography, period drama realism, strong contrast, ultra-fine detail, 8K,
character design sheet, character turnaround,
keep base face unchanged, {overall temperament},
[L1 · condition] decided from user cues: {kept / travel-worn / campaign-worn}; {condition surface description}, clean weathered surfaces only,
[L2 · hair] {styling}, individual hair strands, {ornament description},
[L3+L4 · garments] {color}{pieces}, {fabric}, visible weave and grain, worn creases, {wear description},
[L5 · accessories] {belt}, {guild mark}, {jewelry}, {gloves/bracers},
side by side left to right in one frame: portrait closeup + front view + side view + back view,
natural standing, clean neutral grey background, even soft light, no hard shadow,
four-view consistency, fine facial rendering, fine hair rendering, fabric texture ultra-clear
no text anywhere in the image
```

---

## 10. Constraint rules

### Mandatory

| No. | Rule |
|---|---|
| R1 | Face after overlay must match the base model |
| R2 | Garments must use "visible weave and grain + fabric texture ultra-clear" |
| R3 | Condition / hair / garments / accessories style-unified |
| R4 | Must output the four-view sheet (portrait + front + side + back) |
| R5 | Must specify "clean neutral grey background" |
| R6 | Must specify "four-view consistency" |
| R7 | **Prompt only** — no tables / plans / constraints / suggestions in output |
| R8 | **No scene description** in character derivatives |
| R9 | **No prop interaction** — no held objects (weapons drawn, torches, maps, cups) |
| R10 | **Pose unchanged** — keep the base natural standing pose |
| R11 | **L1 analyze before deciding** — parse hardship cues, then choose kept / travel-worn / campaign-worn |
| R12 | **Every derivative carries condition** — normally not pristine-neutral; at least "kept" grooming state |
| R13 | **Reference-safe** — zero fresh blood / open wounds at any layer or state |

### Strictly forbidden

| No. | Forbidden |
|---|---|
| X1 | Facial drift after overlay |
| X2 | Modern grooming or garments |
| X3 | Condition / garment styles conflicting with each other |
| X4 | Complex scene background (must be plain grey) |
| X5 | Costume inconsistency across the four views |
| X6 | Outputting anything beyond the prompt |
| X7 | Scene description inside a character derivative |
| X8 | "Quick reference", "layer plan", "constraints", "variants" sections in output |
| X9 | Prop interaction (weapons drawn, torches, maps, cups) |
| X10 | Pose change (walking, turning, raising arms, kneeling) |
| X11 | Expression-pose narrative descriptions |
| X12 | Applying a fixed condition without analyzing user cues |
| X13 | Fresh wounds, blood, soaked bandages at any layer |
| X14 | Religious symbols or clerical garments |
| X15 | Glowing / neon / high-fantasy gloss elements |
