# Prop Derivative State Generation · Constraint Manual (live-action urban edition)

---

## 1. Derivative principles

1. **Form anchoring** — the prop's core form/silhouette stays recognisable in every state
2. **Readable state** — the difference between states must be obvious at a glance, so the audience can tell them apart immediately
3. **Serving the narrative** — every state variant serves a specific plot beat
4. **Gradual degradation** — damage/ageing states must follow a sensible physical logic

---

## 2. State types

### 2.1 Use states

| State | Description | Applicable props | Prompt |
|---|---|---|---|
| Brand new | Intact, sheen like new | All props | brand new, intact, sheen like new |
| Everyday use | Slight wear, natural traces | Electronics/household goods | traces of everyday use, natural wear |
| Aged | Clear traces of use, ageing | Leather goods/textiles | traces of use, natural ageing |

### 2.2 Damage states

| State | Description | Applicable props | Prompt |
|---|---|---|---|
| Slight damage | Small scratches/small cracks | Phone/laptop | fine scratches, slight cracks |
| Broken | Clear cracks/fracture | Electronics/glassware | obvious cracks, shattered |
| Fragments | Only part left/shards | Glass/ceramic ware | fragments, shards |

### 2.3 Special states

| State | Description | Applicable props | Prompt |
|---|---|---|---|
| Stains | Stains adhering | All props | stains, dirt |
| Water marks | Water marks, wet reflection | Paper goods/textiles | water marks, wet traces |
| Scratches | Clear scratches | Metal/glass | obvious scratches, scrapes |
| Wear | Surface wear | Leather/textiles | traces of wear, ageing |
| Broken screen | Screen shattered | Electronics | shattered screen, cracks |

---

## 3. Frame specification for state variants

### Single-state image

| Item | Constraint |
|---|---|
| Background | Clean neutral gray #E8E8E8 (same as the sheet) |
| Light | Even illumination, no hard shadows |
| Angle | Same as the front view of the original sheet |
| Proportion | The prop fills 70%+ of the frame |

### State comparison image

| Item | Constraint |
|---|---|
| Layout | 2-3 states shown side by side in one frame |
| Labelling | The state name labelled below each state |
| Consistency | Angle/light/background exactly the same, only the state differs |

---

## 4. Rules for material state changes

| Material | Brand new → everyday | Everyday → aged | Damage expression |
|---|---|---|---|
| Metal | Bright sheen → fine scratches | Scratches → oxidation spots | Dent/bend/fracture |
| Glass | Transparent → fine scratches | Scratches → clear cracks | Shattering/chipping |
| Plastic | New sheen → slight wear | Wear → fading | Cracks/deformation |
| Leather | Smooth → slight creases | Creases → cracks | Tearing/wear |
| Textile | Brand new → slight creases | Creases → fading | Tearing/stains |

---

## 5. Prompt template

### Single-state variant

```

based on the {prop name} sheet，live-action realistic photography style，natural light，extreme detail，
{prop type}，{material description}，
current state: {state name}，{visual description of the state}，
{description of the surface change of the material}，
a four-panel grid (2×2) in one frame: top left front view + top right side view + bottom left back view + bottom right detail close-up，
clean neutral gray background，even soft light，no hard shadow，
ultra-crisp material texture，realistic texture，state detail identifiable

```


---

## 6. Constraint rules

### Mandatory

| No. | Rule |
|---|---|
| R1 | The prop's core form/silhouette stays recognisable in every state |
| R2 | State changes must follow physical logic |
| R3 | Must use the four-panel grid (2×2) layout |
| R4 | Must specify "clean neutral gray background", even soft light, no hard shadows |

### Forbidden

| No. | Forbidden |
|---|---|
| X1 | The prop becoming unrecognisable after the state change |
| X2 | Damage that violates physical logic (e.g. metal rusting) |
| X3 | Damage so extreme that it cannot be recognised |
