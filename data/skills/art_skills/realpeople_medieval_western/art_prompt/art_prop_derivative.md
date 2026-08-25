# Prop Derivative State Generation · Constraint Manual (Medieval Epic)

---

## 1. Derivative principles

1. **Form anchored** — the prop's core form / silhouette stays recognizable in every state
2. **State readable** — differences obvious at a glance
3. **Narrative service** — each state variant serves a specific story beat
4. **Physical degradation logic** — damage and aging follow plausible physics
5. **Reference-safe** — no state may introduce blood or gore; damage speaks through steel, wood, and cloth (S2)

---

## 2. State types

### 2.1 Use states

| State | Description | Fits | Prompt |
|---|---|---|---|
| Freshly forged / new-made | Clean, oiled, maker's finish | Weapons, gear | freshly forged, oiled finish |
| Campaign use | Notches, strap wear, dulled sheen | Weapons, armor pieces | campaign-worn, notched, dulled |
| Aged / heirloom | Deep patina, repairs visible, softened edges | Heirlooms, guild items | aged patina, old repairs |

### 2.2 Damage states

| State | Description | Fits | Prompt |
|---|---|---|---|
| Notched | Edge chips, small dents | Blades, shields | notched edge, small dents |
| Broken | Snapped blade, split haft, cracked shield | Story-beat props | snapped clean, split haft |
| Ruined | Burned, rusted through, torn to strips | Aftermath props | burned remains, rusted through, torn banner |

### 2.3 Special states

| State | Description | Fits | Prompt |
|---|---|---|---|
| Mud-caked | Field mud, dried spatter of earth | All field gear | mud-caked, dried earth |
| Rain-wet | Water beads, darkened leather, damp cloth | All | rain-wet, darkened leather |
| Frosted | Rime, frozen fittings, snow dusting | Winter scenes | frost-rimed, snow-dusted |
| Soot-marked | Fire smoke, ash coating | Siege / burned village | soot-marked, ash-dusted |
| Ceremonial | Cleaned, oiled, guild ribbon added | Rites, vindication | ceremonially cleaned, guild ribbon |

> **Hard ban in every state**: bloodstains, gore residue, viscera. A blade that has seen battle reads through notches and dulled steel, never through blood.

---

## 3. State variant frame specification

### Single state image

| Item | Constraint |
|---|---|
| Background | Clean neutral grey #E8E8E8 (same as design sheet) |
| Light | Even lighting, no hard shadow |
| Angle | Same as the design sheet front view |
| Proportion | Prop fills 70%+ of frame |

### State comparison image

| Item | Constraint |
|---|---|
| Layout | 2–3 states side by side in one frame |
| Consistency | Angle / light / background identical; only state differs |

---

## 4. Material state change rules

| Material | New → campaign | Campaign → aged | Damage expression |
|---|---|---|---|
| Forged steel | Oiled sheen → notches, dull spots | Dull → patina, pitting | Snapped, bent, shattered edge |
| Iron | Clean hammer finish → rust at joints | Rust spread, flaking | Rusted through, cracked |
| Leather | Supple → darkened, creased | Cracked, repaired stitches | Torn, strap ripped |
| Wood | Tool-mark finish → hand-polish, dings | Grey weathering, checks | Split, snapped, charred |
| Cloth / banner | Bright weave → faded, frayed edge | Sun-bleached, patched | Torn to strips, singed |
| Parchment | Crisp → curled, thumbed | Foxed, cracked | Burned edge, torn half |

---

## 5. Prompt template

### Single state variant

```
Based on the {prop name} design sheet, live-action photography style, natural light, ultra-fine detail,
{prop type}, {material description},
current state: {state name}, {state visual description},
{material surface change description},
one frame four-grid (2x2): top-left front view + top-right side view + bottom-left back view + bottom-right detail closeup,
clean neutral grey background, even soft light, no hard shadow,
material texture ultra-clear, realistic material, state details identifiable,
clean weathered surfaces only
```

---

## 6. Constraint rules

### Mandatory

| No. | Rule |
|---|---|
| R1 | Core form / silhouette recognizable in every state |
| R2 | State change follows physical logic |
| R3 | Must use the four-grid (2×2) layout |
| R4 | Must specify "clean neutral grey background", even soft light, no hard shadow |
| R5 | Every state reference-safe: zero blood or gore |

### Strictly forbidden

| No. | Forbidden |
|---|---|
| X1 | State change making the prop unrecognizable |
| X2 | Physically illogical damage (pewter shattering like glass) |
| X3 | Over-destruction beyond recognition |
| X4 | Bloodstains, gore residue in any state |
| X5 | Glowing / enchanted damage effects |
