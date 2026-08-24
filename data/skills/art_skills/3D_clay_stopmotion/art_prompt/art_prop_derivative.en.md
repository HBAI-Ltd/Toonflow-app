# Stop-Motion Clay Prop Derivative State Generation · Constraint Manual

---

## 1. Derivative principles

1. **Form anchored** — the prop's core form/silhouette stays recognisable in every state
2. **State is readable** — the difference between states must be obvious at a glance
3. **Serving the narrative** — each state variant serves a specific plot beat
4. **Progressive degradation** — damaged/aged states must follow sound physical logic
5. **Prop alone, shown independently** — only the prop itself may appear in frame

---

## 2. State types

### 2.1 Use states

| State | Description | Fitting props | Prompt |
|---|---|---|---|
| Brand new | Intact and undamaged, matte and mellow | All props | brand new, intact and undamaged, mellow texture |
| Everyday use | Slight wear, natural patina | Weapons/objects/jewellery | traces of everyday use, natural patina |
| Aged | Clear sense of age, soft coloring | Objects/tokens/scrolls | old and mottled, sense of age, soft coloring |

### 2.2 Damage states

| State | Description | Fitting props | Prompt |
|---|---|---|---|
| Slightly damaged | Small cracks/small chips/light wear | Porcelain/jade pendant/weapons | fine cracks, slight chipping |
| Broken | Clear cracks/fractures/shattering | Porcelain/jewellery/weapons | obvious cracks, shattered, fractured |
| Fragment | Only part/fragments left | Porcelain/jade pendant/tokens | fragment, shards, only half left |

### 2.3 Special states

| State | Description | Fitting props | Prompt |
|---|---|---|---|
| Bloodstained | Blood adhering to it | Weapons/clothing/tokens | mottled bloodstains, bloodstained |
| Soaked/damp | Water marks, damp reflection | Scrolls/tokens/clothing | soaked, damp paper, ink bleeding |
| Burning/scorched | Charred edges, burn marks | Scrolls/tokens/wooden items | charred edges, burn marks |
| Glowing/activated | Inner energy, faint light | Tokens/ritual objects/jade | faintly glowing, inner radiance |
| Wrapped/sealed away | Wrapped in cloth/a box | Tokens/jewellery/secret objects | wrapped in brocade cloth, sealed in a wooden box |

---

## 3. Frame specification for state variants

### Single-state image

| Item | Constraint |
|---|---|
| Background | Clean neutral gray #E8E8E8 (same as the sheet) |
| Light | Warm soft light, no hard shadow |
| Angle | Same as the front view of the original sheet |
| Proportion | The prop fills 70%+ of the frame |

### State comparison image

| Item | Constraint |
|---|---|
| Layout | 2-3 states shown side by side in one frame |
| Labelling | The state name labelled under each state |
| Consistency | Angle/light/background exactly the same, only the state differs |

---

## 4. Rules for material state change

| Material | Brand new → everyday | Everyday → aged | Damage appearance |
|---|---|---|---|
| Clay | Matte and mellow → slight wear | Wear → soft, dulled coloring | Chips/cracks/shattering |
| Wood | Fresh wood grain → natural patina | Patina → darkened coloring | Splitting/fracture/worm holes |
| Ceramic | Mellow glaze → fine scratches | Scratches → dulled glaze | Cracks/shattering/chips |
| Metal | Faint sheen → slight patina | Patina → oxidation marks | Chips/rolled edge/fracture |
| Fabric/paper | Brand new and flat → slight creases | Creases → yellowed and brittle | Tearing/scorching/ink bleeding |

---

## 5. Prompt template

### Single-state variant

```
based on the {prop name} sheet，stop-motion clay ancient-style prop derivative state，stop-motion animation style，3D cartoon render，warm-toned light and shadow，
{prop type}，{material description}，
current state: {state name}，{visual description of the state}，
{description of the material surface change}，
prop-only still-life display，the prop displayed alone，held by no one，worn by no one，
a four-panel grid (2×2) in one frame: top left front view (front view) + top right side view (side view) + bottom left back view (back view) + bottom right detail close-up (detail closeup)，
clean neutral gray background，warm soft light，no hard shadow，
ultra-clear material grain，matte clay texture，state detail distinguishable
no text of any kind in the image，
no person, hand, finger or limb may appear in frame, and the prop must not be in a gripped or worn state
```

---

## 6. Constraint rules

### Mandatory

| No. | Rule |
|---|---|
| R1 | The prop's core form/silhouette stays recognisable in every state |
| R2 | State changes must follow physical logic |
| R3 | Must use the four-panel grid (2×2) layout |
| R4 | Must specify "clean neutral gray background", warm soft light, no hard shadow |

### Forbidden

| No. | Forbidden |
|---|---|
| X1 | The prop becoming unrecognisable after the state change |
| X2 | Damage that breaks physical logic |
| X3 | Excessively gory/horrific depiction of damage |
| X4 | Any human figure appearing |
| X5 | The prop in a held/worn/in-use state |
| X6 | Cold hard light/strong contrast |
