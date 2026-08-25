# Prop Image Generation · Medieval Epic Constraint Manual

---

## 1. Prop design principles

1. **Function readable** — purpose obvious at a glance; form serves function
2. **Texture supreme** — material must be identifiable (forged iron / leather / wood / wool / horn / parchment / wax)
3. **Era consistent** — every prop belongs to a secular medieval Western European world; no modern elements, no religious items
4. **Scale clear** — real size implied through proportion and construction detail
5. **Prop displayed alone** — only the prop in frame; no people, hands, or limbs; never held / worn / in use; still-life presentation
6. **Reference-safe** — props are reused as generation references: weapons always clean (oiled steel, notched edge, worn grip), never bloodstained (S2)

---

## 2. Prop categories and aesthetic constraints

### 2.1 Weapons and hunting gear

| Item | Constraint | Prompt |
|---|---|---|
| Types | Sword / axe / spear / bow / crossbow / hunting knife / traps / net / cage | {weapon type}, medieval forged weapon |
| Material | Forged steel, iron fittings, leather grip, ash or oak haft | forged steel, leather-wrapped grip |
| Condition | Battle-honest: notched edge, dulled sheen, worn grip — always clean, never bloodstained | notched edge, oiled steel, worn grip |
| Craft | Hammer marks, rivets, functional construction | visible hammer marks, riveted fittings |

### 2.2 Guild and heraldic items

| Item | Constraint | Prompt |
|---|---|---|
| Types | Hunter's medallion / guild seal / wanted notice / banner / heraldic shield | {item type}, hunters' guild insignia |
| Material | Cast bronze or iron, wax seal, parchment, embroidered cloth | cast bronze, red wax seal, aged parchment |
| Craft | Engraved secular emblems (stag, wolf, crossed spears) — never religious symbols | engraved stag emblem |
| Text | Any script must be illegible period scribbles, never readable text | illegible aged script |

### 2.3 Daily life items

| Item | Constraint | Prompt |
|---|---|---|
| Types | Goblet / tankard / lantern / candlestick / iron key / rope / satchel / bedroll | {item type}, medieval daily object |
| Material | Pewter, fired clay, hammered iron, tallow, hemp, waxed leather | pewter tankard, hammered iron |
| Condition | Used: dents, wax drips, smoke stain, patina | dented, wax drippings, smoke-darkened |

### 2.4 Story and quest items

| Item | Constraint | Prompt |
|---|---|---|
| Types | Map / signet ring / broken sword / lock of hair token / creature trophy (non-gory: shed antler, scale, claw sheath) | {item type} |
| Material | Per item, always period-true | aged vellum map, worn signet ring |
| Narrative | May carry story wear per plot (a snapped blade, a burned map edge) | snapped clean at the forte, singed edge |
| Ban | Gory trophies (heads, organs), fresh blood on any item | — |

---

## 3. Multi-angle sheet specification

### View definitions

| Position | View | Angle | Requirement | Prompt |
|---|---|---|---|---|
| Top left | Front | Front 0° | Complete front form | front view |
| Top right | Side | Side 90° | Thickness / silhouette / structure | side view |
| Bottom left | Back | Rear 180° | Back structure / fittings | back view |
| Bottom right | Detail close-up | Local zoom | Material texture / craft detail | detail closeup |

### Frame specification

| Item | Constraint |
|---|---|
| Layout | One frame, four-grid (2×2) |
| Background | Clean neutral grey #E8E8E8 |
| Light | Even soft light, no hard shadow |
| Proportion | Prop fills 70%+ of each cell |
| Shadow | Natural soft ground shadow allowed |
| Ratio | 1:1 recommended |

---

## 4. Material rendering constraints

| Material | Rendering requirement | Prompt |
|---|---|---|
| Forged steel | Dull oiled sheen, hammer marks, notches, cold highlight | forged steel, oiled sheen, hammer marks |
| Iron | Hammered surface, rust at rivets and joints allowed | hammered iron, rust at rivets |
| Leather | Grain visible, darkened contact points, stitch detail | leather grain, darkened with use |
| Wood | Grain and tool marks, polished by hands | oak grain, hand-polished |
| Wool / cloth | Weave visible, frayed edges, embroidery slightly worn | visible weave, frayed edge |
| Parchment / vellum | Aged, curled, ink faded, illegible script | aged parchment, faded ink |
| Bronze / pewter | Soft patina, cast texture | bronze patina, cast texture |
| Horn / bone / antler | Natural ridges, polished tips, no gore context | polished antler, natural ridges |
| Wax | Drips, thumb-pressed seals, cracked edges | red wax seal, cracked edge |

---

## 5. Prompt template

```
medieval prop design sheet, real photography style, period drama realism, strong contrast, ultra-fine detail,
{prop type}, {material description}, {craft/decoration description}, {condition description},
prop still-life display, prop shown alone, not held, not worn,
one frame four-grid (2x2): top-left front view + top-right side view + bottom-left back view + bottom-right detail closeup,
clean neutral grey background, even soft light, no hard shadow,
material texture ultra-clear, realistic material, {material sheen description}
no legible text in the image,
no people, hands, fingers, or limbs anywhere in the frame; the prop is never held, worn, or in use
```

---

## 6. Constraint rules

### Mandatory

| No. | Rule |
|---|---|
| R1 | Must specify "clean neutral grey background" |
| R2 | Must state prop material and craft explicitly |
| R3 | Prop form must fit the secular medieval Western European worldview |
| R4 | Weapons always clean: oiled steel, notched edges, worn grips — never bloodstained (S2) |

### Strictly forbidden

| No. | Forbidden |
|---|---|
| X1 | Complex scene background |
| X2 | Prop and character in the same frame (this stage is prop-only) |
| X3 | Any human figure, full or partial (hands, fingers, arms) |
| X4 | Prop held, worn, or in use |
| X5 | Elements implying a person (grip pose, wearer's viewpoint) |
| X6 | Modern objects or materials (plastic, machine finish) |
| X7 | Religious items (crosses, rosaries, altar pieces, clerical regalia) |
| X8 | Blood, gore, or gory trophies on any prop |
| X9 | Glowing / enchanted / neon high-fantasy effects |
| X10 | Legible text on parchment, banners, or seals |
