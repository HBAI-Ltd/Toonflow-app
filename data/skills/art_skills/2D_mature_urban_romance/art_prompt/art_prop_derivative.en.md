# Anime Prop Derived State Generation · Constraint Manual

---

## 1. Derivation principles

1. **Form anchoring** — the prop's core form/silhouette stays recognisable in every state
2. **Readable state** — the difference between states must be obvious at a glance; the viewer tells them apart immediately
3. **Serving the narrative** — every state variant serves a specific plot beat
4. **Gradual degradation** — damage/aging states should follow a sound physical logic
5. **Prop shown alone** — only the prop itself may appear in frame; any person, hand or limb is strictly forbidden, the prop may not be held/worn/gripped, and it must be presented on its own as a still-life display

---

## 2. State types

### 2.1 Use states

| State | Description | Applicable props | Prompt |
|---|---|---|---|
| Brand new | Intact and undamaged, sheen like new | All props | brand new, intact and undamaged, sheen like new |
| Everyday use | Slight wear, natural patina | Office supplies/drinkware/personal items | marks of everyday use, natural wear |
| Aged | Clearly dated, dull color | Household objects/personal items | old and mottled, dated feel, dull color |

### 2.2 Damage states

| State | Description | Applicable props | Prompt |
|---|---|---|---|
| Slight damage | Small cracks/small chips/light wear | Glass/phone screen/notebook | fine cracks, slight chips |
| Broken | Clear cracks/fracture/shattering | Glass/ceramic/plastic | cracks obvious, shattered, fractured |
| Fragments | Only a part/fragments left | Glass/ceramic/keepsake | fragments, shards, only half remaining |

### 2.3 Special states

| State | Description | Applicable props | Prompt |
|---|---|---|---|
| Stains | Stains attached/liquid residue | Cups/clothing/paper | stain residue, liquid marks |
| Fingerprints | Finger marks, marks of use | Phone screen/glass/metal surfaces | clear fingerprints, marks of use |
| Wear | Worn corners and edges, paint chipped off | Electronics/furniture/ornaments | worn corners and edges, chipped-paint marks |
| Folding | Fold marks on books/paper | Books/paper/keepsakes | fold marks, creases obvious |
| Water marks | Water marks, damp reflections | Paper/clothing/fabric | water-mark residue, damp reflections |

---

## 3. Frame specification for state variants

### Single-state image

| Item | Constraint |
|---|---|
| Background | Clean neutral gray `#E8E8E8` (same as the character sheet) |
| Light | Even illumination, no hard shadows |
| Angle | The same as the front view of the original character sheet |
| Proportion | The prop fills 70%+ of the frame |

### State comparison image

| Item | Constraint |
|---|---|
| Layout | 2-3 states shown side by side in one frame |
| Labelling | The state name is labelled under each state |
| Consistency | Angle/light/background exactly the same, only the state differs |

---

## 4. Rules for material state changes

| Material | Brand new → everyday | Everyday → aged | How damage shows |
|---|---|---|---|
| Metal | Bright sheen → faint scratches | Scratches → oxidation spots | Chips/curled edges/fracture |
| Glass | Clear and translucent → faint scratches | Scratches → cracks/shattering | Cracks/shattering/chips |
| Wood | Fresh wood grain → natural patina | Patina → dull color | Splitting/worm holes/wear |
| Plastic | Brand new and smooth → faint scratches | Scratches → aging discoloration | Cracks/deformation/fading |
| Paper | Brand new and flat → faint creases | Creases → yellowed and brittle | Tearing/scorching/stains |
| Ceramic | Glazed sheen → faint scratches | Scratches → dull glaze | Cracks/shattering/chips |

---

## 5. Prompt template

### Single-state variant

based on the {prop name} character sheet，
anime style，cel shading，modern urban style，
cinematic composition，ultra detailed，8K，high quality，
shallow depth of field，image grain，lens vignette，
cel-shaded animation style，modern urban style，dramatic low-key lighting，
prop derivative design sheet，item concept art，no people，no characters，no human figures，
{prop type}，{material description}，
current state: {state name}，{visual description of the state}，
{description of the material-surface change}，
prop-only still-life display，the prop displayed on its own，held by no one，worn by no one，
a 2×2 four-panel grid in one frame: top-left front view (front view) + top-right side view (side view) + bottom-left back view (back view) + bottom-right detail close-up (detail closeup)，
clean neutral gray background，even soft light，no hard shadows，
ultra-crisp material texture，cel-shaded feel，state detail distinguishable
no text of any kind in the image，
no person, hand, finger or limb may appear in the frame, and the prop may not be in a gripped or worn state

---

## 6. Constraint rules

### Mandatory

| No. | Rule |
|---|---|
| R1 | The prop's core form/silhouette stays recognisable in every state |
| R2 | State changes must follow a sound physical logic |
| R3 | Must use a 2×2 four-panel grid layout: top-left front view + top-right side view + bottom-left back view + bottom-right detail close-up |
| R4 | Must specify "clean neutral gray background", even soft light, no hard shadows |
| R5 | Must include the "anime style" keywords (anime style / cel shading) |
| R6 | Must include a depth-of-field characteristic (at least one of shallow depth of field / vignette), keeping the cel-shaded animation style |

### Forbidden

| No. | Forbidden |
|---|---|
| X1 | The prop becoming unrecognisable after the state change |
| X2 | Damage that breaks physical logic (metal rusting and other changes that do not fit the material) |
| X3 | Excessively gory/horrific depictions of damage |
| X4 | Any human figure appearing, including full body, half body or a part (hand, fingers, arm and other limbs) |
| X5 | The prop being in a held, gripped, worn or in-use state |
| X6 | Elements implying a person is present (marks of being held, a wearer's viewpoint, a posture of use) |
| X7 | Using live-action realism/photography/3D-rendering words |
| X8 | Highly saturated fluorescent colors/neon colors |
