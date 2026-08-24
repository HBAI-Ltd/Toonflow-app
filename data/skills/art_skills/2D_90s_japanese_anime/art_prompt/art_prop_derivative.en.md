# 1990s Retro Japanese Anime Style - Prop Derivative State Generation · Constraint Manual

---

## 1. Derivation principles

1. **Form anchored** — the prop's core form/silhouette stays recognisable in every state
2. **State is readable** — the difference between states must be obvious at a glance
3. **In service of the narrative** — each state variant serves a specific plot beat
4. **Progressive degradation** — damaged/aged states must follow a plausible physical logic
5. **The prop alone, shown on its own** — only the prop itself may appear in the frame; any person, hand or limb is strictly forbidden

---

## 2. State types

### 2.1 Use states

| State | Description | Applicable props | Prompt |
|---|---|---|---|
| Brand new | Intact, sheen like new | All props | brand new, intact |
| Everyday use | Slight wear, natural patina | Weapons/objects/jewellery | signs of everyday use, slight wear |
| Aged | Clear sense of period, dulled color | Objects/tokens/scrolls | aged, sense of period |

### 2.2 Damage states

| State | Description | Applicable props | Prompt |
|---|---|---|---|
| Slight damage | Small cracks/small chips/slight wear | Porcelain/jade pendant/weapons | fine cracks, slight chipping |
| Broken | Clear fissures/fracture/shattering | Porcelain/jewellery/weapons | pronounced fissures, shattered |
| Fragment | Only a part/fragments left | Porcelain/jade pendant/tokens | fragment, shards |

### 2.3 Special states

| State | Description | Applicable props | Prompt |
|---|---|---|---|
| Bloodstained | Blood adhering | Weapons/tokens | bloodstains, bloodstained |
| Soaked/wet | Water marks, wet reflections | Scrolls/tokens/clothing | soaked, wet |
| Burnt/scorched | Charred edges, marks of fire | Scrolls/tokens/wooden items | charred edges, marks of fire |
| Glowing/activated | Inner energy, radiating light | Tokens/ritual objects/jade | faintly glowing, inner radiance |
| Wrapped/sealed | Wrapped in cloth/a box | Tokens/jewellery/secret objects | wrapped, sealed away |

---

## 3. Frame specification for state variants

### Single-state image

| Item | Constraint |
|---|---|
| Background | Warm-toned off-white #F8F4E8 (matching the sheet) |
| Light | Soft cinematic light, even illumination, no hard shadow |
| Angle | Matching the front view of the original sheet |
| Proportion | The prop fills 70%+ of the frame |

### State comparison image

| Item | Constraint |
|---|---|
| Layout | 2-3 states shown side by side in one frame |
| Labelling | The state name is labelled below each state |
| Consistency | Angle/light/background exactly the same, only the state differs |

---

## 4. Rules for material state change

| Material | Brand new → everyday | Everyday → aged | Damage expression |
|---|---|---|---|
| Metal | Bright sheen → slight patina | Patina → rust spots | Chips/rolled edge/fracture |
| Jade | Translucent and smooth → slight wear | Wear → fine surface cracks | Cracks/shattering/chipped corner |
| Wood | Fresh grain → natural patina | Patina → dulled color | Splitting/fracture/worm holes |
| Porcelain | Glazed sheen → fine scratches | Scratches → dulled glaze | Cracks/shattering/chips |
| Fabric/paper | Brand new and flat → slight creases | Creases → yellowed and brittle | Tearing/scorching |

---

## 5. Prompt template

### Single-state variant

```
based on the {prop name} sheet，1990s retro Japanese anime style，hand-drawn flat coloring，soft warm tones，
{prop type}，{material description}，
current state: {state name}，{visual description of the state}，
{description of the material surface change}，
the prop alone as a still life，the prop displayed on its own，held by no one，worn by no one，
a four-cell grid (2×2) in one frame: top-left front view(front view) + top-right side view(side view) + bottom-left back view(back view) + bottom-right detail close-up(detail closeup)，
warm-toned off-white background，soft cinematic light，even soft light，no hard shadow，
ultra-clear material texture，hand-drawn texture，state detail identifiable
no text of any kind in the image，
no person, hand, finger or limb may appear in the frame, and the prop must not be in a gripped or worn state
```

---

## 6. Constraint rules

### Mandatory

| No. | Rule |
|---|---|
| R1 | The prop's core form/silhouette stays recognisable in every state |
| R2 | State changes must follow a physical logic |
| R3 | Must use the four-cell grid (2×2) layout |
| R4 | Must specify "warm-toned off-white background" and soft cinematic light |

### Forbidden

| No. | Forbidden |
|---|---|
| X1 | The prop becoming unrecognisable after the state change |
| X2 | Damage that violates physical logic |
| X3 | Excessively gory/horrific depiction of damage |
| X4 | Any human figure appearing |
| X5 | The prop in a held, gripped, worn or in-use state |
| X6 | Any element implying the presence of a person |
