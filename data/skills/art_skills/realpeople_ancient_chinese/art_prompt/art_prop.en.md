# Prop Image Generation · Constraint Manual

---

## 1. Prop design principles

1. **Readable function** — the prop's use is obvious at a glance; the form serves the function
2. **Extreme texture** — the material texture must be clearly identifiable (metal/jade/wood/cloth/paper)
3. **Consistent period** — every prop must fit the ancient Chinese world; modern elements are forbidden
4. **Clear scale** — imply the prop's real size through a reference object or a mark
5. **Pure prop, shown on its own** — only the prop itself may appear in the frame; any character, hand or limb is strictly forbidden, the prop must not be held/worn/gripped, and it must be presented on its own as a still-life display

---

## 2. Prop categories and aesthetic constraints

### 2.1 Weapons

| Item | Constraint | Prompt |
|---|---|---|
| Type | Sword/saber/bow/spear/fan | {weapon type}，ancient-style weapon |
| Material | Fine steel/dark iron + gemstone inlay + silk sword tassel | cold gleam biting、forged from fine steel |
| Ornament | Carving on the scabbard/hilt, tassels, hidden patterns | exquisite carving、hanging tassels |
| Sheen | Cool metal sheen, reflection off the edge | cold gleam flashing、metal texture |
| Prompt | ancient-style {weapon}，forged from fine steel，cold gleam biting，exquisite carving | — |

### 2.2 Ornaments

| Item | Constraint | Prompt |
|---|---|---|
| Type | Hairpin/hair stick/yingluo necklace/jade pendant/bracelet/earring | {ornament type}，ancient-style jewelry |
| Material | Gold/silver/jade/pearl/gemstone | woven gold thread、translucent jade |
| Craft | Extremely fine, filigree/cloisonné/inlay | master craft、finely carved and wrought |
| Sheen | Pearlescent/jade-smooth/metallic sheen | pearlescent glow、metallic sheen |
| Prompt | ancient-style {ornament}，{material}，master craft，finely carved and wrought | — |

### 2.3 Everyday vessels

| Item | Constraint | Prompt |
|---|---|---|
| Type | Tea set/wine set/incense burner/go board/scroll/lantern | {vessel type}，ancient-style vessel |
| Material | Porcelain/bronze/bamboo/wood/paper | celadon warm and smooth、red copper plain and antique |
| Texture | Glaze/wood grain/bamboo nodes clear | glaze sheen、clear wood grain |
| Style | Plain and elegant/splendid, switched by scene | plain and antique / splendid and exquisite |
| Prompt | ancient-style {vessel}，{material} texture，clear texture | — |

### 2.4 Tokens/key props

| Item | Constraint | Prompt |
|---|---|---|
| Type | Token/tally/scroll/medicine bottle/jade seal | {prop type}，ancient-style prop |
| Distinctiveness | Must be recognizable and carry narrative symbolism | unique form、deep symbolic meaning |
| Aged look | A sense of age may be added as the plot requires | old and mottled / brand new and exquisite |
| Prompt | ancient-style {prop}，{material}，{state}，unique form | — |

---

## 3. Multi-angle design sheet specification

### View definitions

| Position | View | Angle | Requirement | Prompt |
|---|---|---|---|---|
| Top left | Front view | Front 0° | The prop's complete front form | front view |
| Top right | Side view | Side 90° | Thickness/outline/structure clear | side view |
| Bottom left | Back view | Rear 180° | The prop's back structure/ornament | back view |
| Bottom right | Detail close-up | Local enlargement | Material texture/craft detail | detail closeup |

### Frame specification

| Item | Constraint |
|---|---|
| Layout | A four-cell grid (2×2) in one frame, four angles up, down, left and right |
| Background | Clean neutral gray #E8E8E8 |
| Light | Even soft light, no hard shadow |
| Proportion | In each cell the prop takes 70%+ of the cell |
| Cast shadow | A slight natural shadow on the ground is allowed |
| Frame ratio | 1:1 recommended |

---

## 4. Material rendering constraints

| Material | Rendering requirement | Prompt |
|---|---|---|
| Metal | Reflection/highlight/cool sheen, scratches faintly visible | metal texture、cool sheen、clear reflection |
| Jade | Inner glow, warm and smooth, slightly translucent | translucent jade、warm and smooth as fat |
| Wood | Clear wood grain, growth rings visible | clear wood grain、warm smooth texture |
| Porcelain | Glaze sheen, even color | glaze sheen、porcelain warm and smooth |
| Cloth/paper | Fiber texture, natural edges | fabric texture、paper plain and antique |
| Gemstone | Refraction/inner light, clear facets | brilliant gemstone、light refracting |

---

## 5. Prompt template

```
Ancient-style prop design sheet，live-action realistic photography style，ancient-style realist documentary，high contrast，extreme detail，
{prop type}，{material description}，{craft/ornament description}，{state description}，
pure prop still-life display，the prop displayed on its own，held by no one，worn by no one，
a four-cell grid (2×2) in one frame: top-left front view+top-right side view+bottom-left back view+bottom-right detail close-up，
clean neutral gray background，even soft light，no hard shadow，
ultra-crisp material texture，realistic texture，{material sheen description}
no text of any kind in the image，
no character, hand, finger or limb may appear in the frame, and the prop must not be gripped or worn
```

---

## 6. Constraint rules

### Mandatory

| No. | Rule |
|---|---|
| R1 | Must specify "clean neutral gray background" |
| R2 | Must state the prop's material and craft explicitly |
| R3 | The prop's form must fit the ancient Chinese world |

### Strictly forbidden

| No. | Forbidden |
|---|---|
| X1 | Complex scene backgrounds |
| X2 | The prop and a character in the same frame (this step produces a pure prop image) |
| X3 | Any character figure appearing, including full body, half body or a part (hand, fingers, arm or other limb) |
| X4 | The prop being held, gripped, worn or in use |
| X5 | Elements implying a person is present (such as traces of being held, a wearer's viewpoint, a posture of use) |
