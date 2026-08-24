# Stop-Motion Clay Prop Image Generation · Constraint Manual

---

## 1. Prop design principles

1. **Function is readable** — the prop's use is obvious at a glance; the form serves the function
2. **Clay texture taken to the limit** — the material's grain must be clearly identifiable (clay/wood/fabric/paper)
3. **Period consistency** — every prop must fit the ancient-style world; modern elements are forbidden
4. **Clear scale** — imply the prop's real size through a reference object or a marking
5. **Prop alone, shown independently** — only the prop itself may appear in frame; any person, hand or limb is strictly forbidden

---

## 2. Prop categories and aesthetic constraints

### 2.1 Weapons

| Item | Constraint | Prompt |
|---|---|---|
| Type | Sword/saber/bow/spear/fan | {weapon type}, ancient-style weapon |
| Material | Clay-sculpted + simple metal ornament + silk sword tassel | clay texture, refined metal ornament |
| Ornament | Carved scabbard/hilt, tassels, hidden patterning | refined carving, hanging tassels |
| Sheen | Matte clay texture, slight reflection on the metal parts | matte clay, slight metallic sheen |
| Prompt | ancient-style {weapon}, clay texture, refined carving | — |

### 2.2 Jewellery

| Item | Constraint | Prompt |
|---|---|---|
| Type | Hairpin/hair stick/yingluo beaded collar/jade pendant/bracelet/earring | {jewellery type}, ancient-style jewellery |
| Material | Clay + simple metal/bead strings/gemstone | clay material, simple metal ornament |
| Craft | Refined and fine, clear patterning | refined craft, clear patterning |
| Sheen | Matte clay texture, faint metallic glint | matte clay, slight metallic sheen |
| Prompt | ancient-style {jewellery}, {material}, refined craft | — |

### 2.3 Everyday objects

| Item | Constraint | Prompt |
|---|---|---|
| Type | Tea set/wine set/incense burner/go board/scroll/lantern | {object type}, ancient-style object |
| Material | Clay/wood/ceramic | clay texture, wood grain |
| Texture | Glaze/wood grain/bamboo joints clear | clear grain, mellow texture |
| Style | Plain-elegant/cozy, switching with the scene | plain and simple / cozy and refined |
| Prompt | ancient-style {object}, {material} texture, clear grain | — |

### 2.4 Tokens/key props

| Item | Constraint | Prompt |
|---|---|---|
| Type | Token of trust/tally/scroll/medicine bottle/jade seal | {prop type}, ancient-style prop |
| Distinctiveness | Must be recognisable and carry narrative symbolism | distinctive form, deep symbolic meaning |
| Aged feel | Age can be added as the plot needs | old and mottled / brand new and refined |
| Prompt | ancient-style {prop}, {material}, {state}, distinctive form | — |

---

## 3. Multi-angle sheet specification

### View definitions

| Position | View | Angle | Requirement | Prompt |
|---|---|---|---|---|
| Top left | Front view | Front 0° | The prop's complete front form | front view |
| Top right | Side view | Side 90° | Thickness/silhouette/structure clear | side view |
| Bottom left | Back view | Rear 180° | The prop's back structure/ornament | back view |
| Bottom right | Detail close-up | Local enlargement | Material grain/craft detail | detail closeup |

### Frame specification

| Item | Constraint |
|---|---|
| Layout | A four-panel grid (2×2) in one frame, four angles in the four quadrants |
| Background | Clean neutral gray #E8E8E8 |
| Light | Warm soft light, no hard shadow |
| Proportion | In each cell the prop fills 70%+ of the cell |
| Cast shadow | A slight natural ground shadow is allowed |
| Aspect ratio | 1:1 recommended |

---

## 4. Material rendering constraints

| Material | Rendering requirement | Prompt |
|---|---|---|
| Clay | Matte texture, fingerprint indentations faintly visible | matte clay texture, matte clay |
| Wood | Clear wood grain, growth rings visible | clear wood grain, mellow texture |
| Metal | Slight reflection, no over-strong highlight | slight metallic sheen, matte metal |
| Ceramic | Mellow glaze, soft coloring | mellow glaze, soft porcelain |
| Fabric/paper | Fibre texture, natural edges | fabric texture, plain old-style paper |
| Gemstone | Matte texture, internal light | matte gemstone, mellow texture |

---

## 5. Prompt template

```
stop-motion clay ancient-style prop sheet，stop-motion animation style，3D cartoon render，warm-toned light and shadow，extreme detail，
{prop type}，{material description}，{craft/ornament description}，{state description}，
prop-only still-life display，the prop displayed alone，held by no one，worn by no one，
a four-panel grid (2×2) in one frame: top left front view + top right side view + bottom left back view + bottom right detail close-up，
clean neutral gray background，warm soft light，no hard shadow，
ultra-clear material grain，matte clay texture，{material sheen description}
no text of any kind in the image，
no person, hand, finger or limb may appear in frame, and the prop must not be in a gripped or worn state
```

---

## 6. Constraint rules

### Mandatory

| No. | Rule |
|---|---|
| R1 | Must specify "clean neutral gray background" |
| R2 | Must state the prop's material and craft |
| R3 | The prop's form must fit the ancient-style world |
| R4 | Must specify "matte clay texture" |
| R5 | Must specify "warm soft light" |

### Forbidden

| No. | Forbidden |
|---|---|
| X1 | Complex scene backgrounds |
| X2 | The prop and a character in the same frame |
| X3 | Any human figure appearing |
| X4 | The prop in a held/worn/in-use state |
| X5 | Elements implying a person is present |
| X6 | Cold hard light/strong contrast |
| X7 | Excessive highlight/mirror reflection |
