---
name: art_character_derivative
description: Guofeng Cyber 3D character derived asset generation · constraint manual
metaData: art_skills
---

# Guofeng Cyber 3D Character Derived Asset Generation · Constraint Manual
## (dual-setting edition: traditional ancient-style scenes + modern urban cyber scenes)

---

## 1. Overlay principles (core rules shared by both settings)

1. **The face does not change** — after overlaying, the features must match the base model exactly; facial drift, deformation or stylized alteration is forbidden
2. **The pose does not change** — keep the base model's natural standing pose; any change of pose/action/bearing is forbidden
3. **Layer by layer, under control** — each layer is described independently, with the ancient-style and cyber elements kept in separate layers so they can be swapped per layer (change the costume without changing the makeup, change the cyber elements without changing the Guofeng base)
4. **Unified style** — every costume and makeup element obeys one aesthetic system: **ancient-style scenes take traditional Eastern aesthetics as the core with cyber elements as a light, optional fusion; urban scenes take the Guofeng form as the base with cyber functionality as the core expression**. Splitting or opposing the Guofeng and cyber elements is forbidden throughout
5. **No drop in texture** — after overlaying, the texture standard is no lower than the base model's; 3D PBR materials and cinema-level lighting are the floor for every setting
6. **Costume and makeup only** — overlay makeup/hairstyle/costume/accessories only; introducing props, scenes, environments or actions is forbidden
7. **One-click dual-setting fit** — with no explicit cyber/urban clue, default to pure ancient-style generation; with an explicit cyber/urban clue, match the Guofeng cyber urban system automatically, with no need to rebuild the underlying logic

---

## 2. Overlay layers (layered structure compatible with both settings)

| Layer | Content | Dual-setting note |
|---|---|---|
| L0 | Base model | The base likeness model; face, bearing and standing pose are fully locked, shared by the ancient-style and urban settings, and are not modified in any way |
| L1 | Makeup (decision layer) | Analyze the user's clues first, then decide the strength and style among "base makeup / light makeup / formal makeup / cyber functional makeup / urban commute makeup", covering two systems: ancient-style traditional makeup and urban cyber light-effect makeup |
| L2 | Hair styling | Guofeng buns/tied hair/braids + traditional hair ornaments/cyber functional hair pieces, covering two systems — ancient-style traditional styling and urban cyber light styling — with the high-precision hair-strand standard shared by every setting |
| L3 | Middle layer/inner wear | Replace the white base middle layer: ancient-style scenes use traditional silk middle layers, urban scenes use Guofeng functional-fabric inner wear, which may carry controlled hidden circuit patterns and micro neon light strips |
| L4 | Outer garment/main costume | The core dual-fit layer: ancient-style scenes use Chinese traditional formal wear/ceremonial dress/everyday dress; urban scenes use **cyber functional clothing built on a Guofeng form** (a Chinese core structure such as a standing collar/diagonal front/pankou knot buttons/ruqun must be kept). Purely Western functional clothing with no Guofeng core is forbidden |
| L5 | Accessories | Traditional head/ear/neck/waist/hand ornaments + Guofeng cyber functional accessories/light-responsive components; ancient-style scenes use mainly traditional accessories with light cyber accents, urban scenes use fused Guofeng + cyber accessories. Purely Western cyber accessories are forbidden throughout |

> **Scope boundary**: character derived assets cover layers L0–L5 (costume, hair and makeup) only. They do not cover props (umbrellas/swords/fans/books/lanterns and other held objects), scene environments (interior/exterior/weather and the like) or pose actions (walking/glancing back/raising a hand and the like). Those belong to other asset types. Cyber functional elements are confined to the L1–L5 costume-and-makeup scope and must not cross the boundary to modify the base model's body structure.

---

## 3. Makeup constraints (L1 · ancient-style + urban dual system)

### Strategy from base model to derived makeup (key)

> The character base model is bare-faced, but derived assets enter the makeup flow by default. The system should analyze the makeup requirement from the clues the user provides, match the ancient-style or urban setting attribute first, then decide the strength within that makeup system. With no explicit setting clue, default to the ancient-style system and never switch on your own.

### L1 clue analysis and makeup decision

| Step | What is processed | Decision result |
|---|---|---|
| S1 | Extract the user's clues: facial-state words, emotion words, strength words, style words, setting words (ancient-style/urban) | A two-dimensional "setting + makeup" requirement summary |
| S2 | Filter out non-makeup clues: prop/scene/action/pose words are not grounds for applying makeup | Prevents misjudgment |
| S3 | Match the ancient-style or urban setting system first, then match the makeup style matrix and give a strength tier | Ancient-style system: base makeup / light makeup / formal makeup; urban system: commute makeup / business makeup / cyber functional makeup |
| S4 | Generate the final L1 prompt | Output only the conclusion, not the analysis process |

### Clue to makeup mapping (execution standard · dual-setting fit)

| Clue type | Typical clue | Setting match | L1 decision |
|---|---|---|---|
| No clear setting/facial-emphasis clue | Only costume/hairstyle changes, with no emphasis on emotion or state | Ancient-style by default | Base makeup |
| Slight facial clue | Gentle, smiling, lashes trembling lightly, complexion slightly lifted | Shared by ancient-style and urban | Light makeup (extremely faint) |
| Clear ancient-style everyday clue | Everyday, in the boudoir, going out, leisure, a literati gathering | Ancient-style setting | Base makeup (natural and clear) |
| Clear ancient-style formal-ceremony clue | Grand wedding, ceremony, court audience, important occasion | Ancient-style setting | Formal makeup (refined and opulent) |
| Clear urban everyday clue | Commuting, urban everyday, leisure outing | Urban cyber setting | Urban commute makeup (clear and natural + extremely faint texture) |
| Clear urban formal clue | Business, holographic meeting, urban gala | Urban cyber setting | Urban business makeup (refined matte + cool-toned texture) |
| Clear cyber functional clue | Cyber, functional, night operations, mission, neon, futurism | Urban cyber setting | Cyber functional makeup (controlled light effects, fused with Guofeng) |

> Decision principles:
> 1. Every derived asset must carry makeup; match the system from the setting clues first, then let the facial clues decide strength and style. Prop, scene or pose changes must never raise the makeup strength on their own
> 2. A cyber functional clue may trigger only the urban cyber system's makeup; with no matching clue, cyber light-effect makeup must never be added on your own
> 3. In an ancient-style setting with no explicit cyber clue, adding any cyber light-effect/functional makeup is forbidden, so that a pure ancient-style scene fits perfectly

### Female makeup style matrix (full coverage of both settings)

| System | Style | Applicable scenes | Core prompt |
|---|---|---|---|
| Ancient-style system | Clear plain makeup | Ancient-style everyday, first meeting, in the boudoir, literati gathering | clear elegant makeup、lightly drawn brows、plain makeup and clear face |
| Ancient-style system | Courtly noble makeup | Ancient-style court, formal, power, gala | refined makeup、sharp brow shape、rosy lip color |
| Ancient-style system | Romantic peach-blossom makeup | Ancient-style dates, heart-flutter, sweetness | peach-blossom makeup、slight red at the eye corners、dewy lip color |
| Ancient-style system | Grand wedding makeup | Ancient-style grand wedding, ceremony | heavy splendid makeup、vermilion lips and phoenix eyes |
| Ancient-style system | Festival celebration makeup | Ancient-style festival, gathering | bright color、pastel makeup |
| Urban cyber system | Urban commute makeup | Urban everyday, commuting, leisure outing | clear no-makeup makeup、natural brow shape、even base、no exaggerated color |
| Urban cyber system | Urban business makeup | Urban business, holographic meeting, formal occasion | matte cool-toned base、crisp brow shape、deep eye makeup、low-saturation lip texture |
| Urban cyber system | Cyber streaming-light makeup | Urban night operations, cyber scenes, functional leisure | micro neon light at the eye corners、skin-close hidden circuit patterns、lip color with fine shimmering flow、makeup clear and not heavy |
| Urban cyber system | Functional cool-tone makeup | Urban mission, action, strong-presence scenes | matte cool-toned base、crisp brow shape、deep eye makeup、local matte functional texture、no exaggerated light effects |

### Universal base skin (every makeup · shared by both settings)

| Item | Constraint | Prompt |
|---|---|---|
| Texture | PBR material rendering, naturally translucent, controlled texture, 3D feel uniform across every setting | PBR materials、natural sheen、soft texture、fine skin grain |
| Whiteness | Pink-white keynote, translucent not ghostly | pink-white keynote、fair and translucent |
| Inner glow | A soft light from within | inner glow、skin translucent and luminous |
| Cyber fit | Only the urban cyber system may add skin-close hidden circuit patterns and micro neon light effects; they must not cover the base model's skin texture. Forbidden in the ancient-style system | skin-close hidden circuit patterns、controlled micro neon light effects、blending naturally with the skin |
| Forbidden | Matte/dead white/waxy/oily/overexposed, cyber paintwork covering large areas of the base model, harsh glare, adding cyber elements to an ancient-style scene on your own | — |

### Base makeup detail (ancient-style default tier · shared by both settings)

| Item | Constraint | Prompt |
|---|---|---|
| Brows | Lightly tidied along the base model's brow shape, without changing it | naturally tidied brows、clean brow shape |
| Eyes | Extremely faint eye work, emphasizing clarity and liveliness | clear eyes、extremely faint eyeshadow |
| Cheeks | An extremely faint lift of complexion, pastel blush | natural cheek complexion、pastel blush |
| Lips | Pale pink or vermilion tint, kept restrained | naturally dewy lip color、pale pink lip color |
| Overall | Makeup is visible, but the makeup feel is very light | base makeup、natural makeup feel、soft texture |

### Male makeup (dual-setting fit)

| System | Item | Constraint | Prompt |
|---|---|---|---|
| Ancient-style, universal | Base skin | PBR material rendering, fair and translucent, fresh and natural | PBR materials、fair and translucent、natural sheen |
| Ancient-style, universal | Core principle | No-makeup makeup — looks unmade-up, but the skin is superb | no-makeup makeup、naturally good skin |
| Ancient-style, universal | Brows | Naturally thick brows, without changing the base model's brow shape | natural sword brows、upright brow shape |
| Ancient-style, universal | Lip color | Natural blood color, slightly dewy | natural lip color、a sense of blood color |
| Urban cyber system | Cyber fit | Only local matte functional texture and extremely faint hidden circuit patterns may be added, with no exaggerated light effects; forbidden with no explicit clue | extremely faint skin-close hidden circuit patterns、matte functional texture、no glare |
| Urban cyber system | Urban business makeup | Matte clear base, crisp brow shape, no surplus makeup feel | clear matte base、crisp brow shape、no-makeup makeup texture |

---

## 4. Hair styling constraints (L2 · ancient-style + urban dual system)

### Female styling types (full coverage of both settings)

| System | Styling | Description | Applicable scenes | Prompt |
|---|---|---|---|---|
| Ancient-style system | High cloud bun | High coiled bun + traditional hair ornaments | Ancient-style court, formal, gala | high cloud bun、refined coiled hair、Chinese traditional form |
| Ancient-style system | Double-ring bun | Two symmetrical rings, girlish | Ancient-style young characters, everyday | double-ring bun、girlish style、Chinese traditional styling |
| Ancient-style system | Falling-horse bun | Low bun to one side, languid | Ancient-style everyday, leisure, in the boudoir | falling-horse bun、languid side bun、Chinese traditional styling |
| Ancient-style system | Loose hair | All the long hair loose, falling naturally | Ancient-style boudoir, private, night | long hair falling loose、falling naturally、Chinese traditional texture |
| Ancient-style system | High tied ponytail | Tied high, crisp and capable | Ancient-style martial training, action scenes | high ponytail、crisp and capable、Chinese traditional tied hair |
| Ancient-style system | Half-tied hair | Top half tied + hair falling behind | Ancient-style everyday, going out | half-tied cloud bun、hair falling naturally、Chinese traditional styling |
| Urban cyber system | Guofeng half-tied low ponytail | Chinese half-tied hair + low ponytail, crisp and unfussy | Urban commuting, everyday outings | Guofeng half-tied low ponytail、Chinese braid accents、crisp everyday、high-precision hair strands |
| Urban cyber system | Guofeng high functional bun | Chinese high bun + functional structure holding it, may embed micro neon light strips | Urban formal, holographic gala, functional scenes | Guofeng high functional bun、titanium-alloy hair pieces holding it、embedded controlled micro neon light strips |
| Urban cyber system | Guofeng half-mechanical braid | Chinese three-strand braid + functional cord, micro-glow tassel accents | Urban leisure, night operations, cyber scenes | Guofeng half-mechanical braid、Chinese braid base、functional braid cord、light-responsive tassel accents |
| Urban cyber system | Guofeng high ponytail | Chinese tied hair + high ponytail, functional hair clasp holding it | Urban functional, action, mission scenes | Guofeng high ponytail、Chinese tied-hair base、functional hair clasp holding it、crisp and capable |

### Female hair ornaments (dual-setting fit)

| System | Constraint | Prompt |
|---|---|---|
| Ancient-style system | Ornate and refined, matched to the costume, purely traditional Chinese material and craft, no cyber elements (forbidden with no explicit clue) | ornate hair ornaments、refined craft、gold and silver hairpins、a head full of pearls and kingfisher feather、fine carving |
| Urban cyber system | Guofeng form at the core, matched to the costume, traditional materials fused with cyber functional materials, light effects controlled | Guofeng cyber hair ornaments、refined craft、gold, silver and jade ornaments + titanium-alloy functional pieces、controlled micro neon light strips、holographic projection accents |

### Male styling types (full coverage of both settings)

| System | Styling | Applicable scenes | Prompt |
|---|---|---|---|
| Ancient-style system | Tied hair with half crown | Ancient-style everyday, literati, gathering | tied hair with half crown、jade hairpin holding the hair、Chinese traditional styling |
| Ancient-style system | Full crown, tied high | Ancient-style formal, court audience, gala | full crown tied high、jade crown holding the hair、Chinese traditional form |
| Ancient-style system | Loose hair over the shoulders | Ancient-style private, night scenes | loose hair over the shoulders、long hair like ink、Chinese traditional texture |
| Ancient-style system | High tied ponytail | Ancient-style combat, martial training scenes | hair tied high for battle、crisp ponytail、Chinese traditional tied hair |
| Urban cyber system | Guofeng functional half-crown tied hair | Urban everyday, commuting, business scenes | Guofeng functional half-crown tied hair、Chinese tied-hair base、matte titanium-alloy hair pieces、crisp and capable |
| Urban cyber system | Guofeng low-ponytail tied hair | Urban leisure, everyday outings | Guofeng low-ponytail tied hair、Chinese tied-hair base、minimal functional hair clasp、natural texture |
| Urban cyber system | Guofeng high tied functional hair | Urban functional, mission, night-operation scenes | Guofeng high tied functional hair、Chinese tied-hair base、full-enclosure functional hair crown、matte craft |

---

## 5. Costume constraints (L3+L4 · the core dual-setting layer)

### Core red line (shared by both settings · not to be crossed)
**Every costume must take the Chinese traditional form as its absolute core.** Ancient-style scenes follow Chinese costume cutting logic strictly; urban cyber scenes must keep at least one Chinese core structure — standing collar/diagonal front/pankou knot buttons/ruqun/parallel front/wide sleeves. Purely Western suits, purely functional shell jackets and purely Western cyberpunk costumes with no Guofeng core are forbidden, so that the Guofeng base is never lost in either the ancient-style or the urban setting.

### Female costume matrix (full coverage of both settings)

| System | Style | Core design | Applicable scenes | Prompt |
|---|---|---|---|---|
| Ancient-style system | Ancient-style everyday long skirt | Chinese ruqun form, flowing hem, traditional embroidery | Ancient-style everyday, boudoir, gathering, going out | ancient-style ruqun long skirt、flowing robe and skirt、silk texture、traditional Suzhou embroidery motifs、multiple layers |
| Ancient-style system | Court ceremonial dress | Chinese ceremonial form, wide-sleeved robe, layered hem, opulent embroidery | Ancient-style court, formal, gala, power scenes | ancient-style court ceremonial dress、opulent skirt ensemble、Chinese wide-sleeved robe、gold-thread embroidery、layered hem |
| Ancient-style system | Light everyday dress | Chinese short jacket, standing collar with diagonal front, waisted cut, crisp and unfussy | Ancient-style action, martial training, going out | ancient-style light everyday dress、short jacket cut、standing collar with diagonal front、cotton-linen and silk texture、crisp and capable |
| Ancient-style system | Sleepwear | Thin gauze middle layer, plain silk, loose and comfortable | Ancient-style interior, night, private scenes | ancient-style sleepwear、loose and comfortable、thin gauze and silk material、plain and simple |
| Ancient-style system | Grand wedding robes | Phoenix coronet and rosy cape form, layered red robes, traditional wedding motifs | Ancient-style wedding, grand wedding ceremony | ancient-style grand wedding robes、phoenix coronet and rosy cape、layered red robes、gold-thread embroidery、Chinese wedding form |
| Urban cyber system | Guofeng commute everyday wear | Chinese standing-collar/diagonal-front shirt, modernized short ruqun, functional fabric panels, everyday and unexaggerated | Urban everyday, commuting, leisure outing | Guofeng cyber commute everyday wear、Chinese standing collar and diagonal front、modernized ruqun cut、silk panelled with matte functional fabric、minimal embroidery、crisp everyday |
| Urban cyber system | Guofeng business formal wear | Chinese parallel-front suit form, modernized tangzhuang structure, high-grade matte fabric, minimal and opulent | Urban business, holographic meeting, formal occasion | Guofeng cyber business formal wear、Chinese parallel-front tangzhuang base、high-grade matte fabric、structured cut、minimal Chinese motifs、opulent and understated |
| Urban cyber system | Light functional Guofeng everyday wear | Chinese short jacket + functional vest, diagonal front with pankou knots + magnetic clasps, waisted cut, light and crisp | Urban action, night operations, functional leisure | light functional Guofeng everyday wear、Chinese diagonal-front short jacket、functional vest panels、magnetic pankou knots、matte functional fabric、crisp and capable |
| Urban cyber system | Guofeng cyber wedding/gala dress | Chinese phoenix coronet and rosy cape/ceremonial form, titanium-alloy structure, layered hem, controlled micro neon light strips | Urban grand wedding, holographic gala, important occasion | Guofeng cyber gala dress、Chinese ceremonial core form、silk panelled with 3D-printed structure、gold-thread embroidery fused with hidden circuit patterns、controlled micro neon light strips |
| Urban cyber system | Guofeng functional sleepwear | Chinese diagonal-front middle layer, thin gauze panelled with functional lining, loose and comfortable, faint sheen texture | Urban interior, night, private scenes | Guofeng functional sleepwear、Chinese diagonal-front form、loose and comfortable、thin gauze panelled with functional fabric、faint sheen texture |

### Universal female costume constraints (dual-setting fit)

| Item | Constraint | Prompt |
|---|---|---|
| Main color | Ancient-style scenes default to traditional Chinese tones; urban scenes may pair low-saturation cool cyber contrast colors and controlled neon accents. High-saturation glaring palettes are forbidden | traditional Chinese tones、Guofeng cyber palette、low-saturation contrast、controlled neon accents |
| Material | Ancient-style scenes default to silk + embroidery + pearlescent fabric; urban scenes may panel in matte functional fabric, high-visibility reflective strips and 3D-printed structural pieces, but the Guofeng core fabric base must be kept | silk texture、embroidery detail、purely traditional fabric in ancient-style scenes; traditional fabric panelled with functional fabric and 3D-printed structure in urban scenes |
| Grain | Ancient-style scenes default to Chinese traditional motifs; urban scenes may fuse traditional motifs with circuit grain and hidden cyber patterns, with ultra-clear grain. Purely cyber grain with no Guofeng core is forbidden | clear clothing texture、ultra-clear grain、purely Chinese traditional motifs in ancient-style scenes; traditional motifs deeply fused with circuit grain in urban scenes |
| Shoulders | Ancient-style scenes default to a Guofeng cloud collar/pibo shawl; urban scenes may add functional shoulder plates/structural ornament, which must stay unified with the Chinese form | splendid cloud collar and flowing pibo shawl in ancient-style scenes; Guofeng shoulder-plate accents unified with the overall form in urban scenes |
| Layering | Multiple layers, clearly distinguished, the Guofeng inner wear and outer garment logic unified; in urban scenes the functional structure must not break the layering logic | multiple layers、clearly distinguished、Chinese form logic unified |
| Light effects | Only urban cyber scenes may add embedded micro neon light strips; the light must be controlled, not glaring, must not break the costume texture, and must not blow out. Forbidden in ancient-style scenes with no explicit clue | embedded micro neon light strips in urban scenes、controlled light effects、no blown highlights、blending naturally with the costume |

### Male costume matrix (full coverage of both settings)

| System | Style | Applicable scenes | Prompt |
|---|---|---|---|
| Ancient-style system | Literati scholar's dress | Ancient-style everyday, study, gathering, going out | ancient-style literati scholar's dress、long-robe form、standing collar with diagonal front、silk and cotton-linen texture、traditional motif embroidery |
| Ancient-style system | Warrior's fighting dress | Ancient-style combat, martial practice, action scenes | ancient-style warrior's fighting dress、battle-robe form、standing collar and waisted cut、hard-wearing fabric、crisp and capable |
| Ancient-style system | Court ceremonial dress | Ancient-style court audience, ceremony, gala | ancient-style court dress、formal ceremonial form、wide-sleeved loose robe、opulent fabric、traditional motifs |
| Ancient-style system | Everyday casual dress | Ancient-style leisure, private, everyday outings | ancient-style everyday casual dress、simple style、comfortable fabric、Chinese standing collar、loose and proper |
| Ancient-style system | Grand ceremonial dress | Ancient-style formal, celebration, important occasion | ancient-style grand ceremonial dress、opulent and refined、Chinese ceremonial form、high-grade fabric、gold-thread embroidery |
| Urban cyber system | Guofeng business commute wear | Urban everyday, commuting, business meeting | Guofeng business commute wear、Chinese standing-collar tangzhuang base、modernized suit cut、high-grade matte fabric、minimal Chinese motifs、crisp and proper |
| Urban cyber system | Guofeng functional casual wear | Urban everyday, leisure outings, light functional scenes | Guofeng functional casual wear、Chinese diagonal-front short jacket、functional fabric panels、magnetic pankou knots、loose and comfortable、everyday versatile |
| Urban cyber system | Warrior functional fighting dress | Urban action, mission, night-operation scenes | Guofeng warrior functional fighting dress、Chinese battle-robe base、matte functional fabric、structured protective pieces、standing collar and waisted cut、crisp and capable |
| Urban cyber system | Guofeng gala ceremonial dress | Urban holographic gala, formal occasion, grand wedding | Guofeng gala ceremonial dress、Chinese ceremonial core form、opulent fabric、titanium-alloy structural accents、traditional motifs fused with hidden circuit patterns |

---

## 6. Accessory constraints (L5 · dual-setting fit)

### Female accessories (split by setting system)

| System | Type | Constraint | Prompt |
|---|---|---|---|
| Ancient-style system | Head ornaments | Ornate and refined, never sparse, purely Chinese traditional materials, matched to the hairstyle and costume | ornate head ornaments、a head full of pearls and kingfisher feather、gold and silver hairpins、jade buyao、fine carving |
| Ancient-style system | Ear ornaments | Traditional hanging tassels/jade ear pendants, unified with the overall style | tassel earrings、hanging jade ear pendants、jade ear ornaments、gold and silver inlay |
| Ancient-style system | Neck ornaments | Traditional yingluo collar/torque, Chinese traditional form | splendid yingluo collar、refined torque、gold, silver and jade inlay |
| Ancient-style system | Waist ornaments | Traditional palace cord/jade pendant, Chinese traditional craft | flowing palace cord、jade pendant at the waist、jade jinbu pendant、refined weaving |
| Ancient-style system | Hand ornaments | Traditional jade bracelet/arm bangle, Chinese traditional form | translucent jade bracelet、refined arm bangle、gold, silver and jade material |
| Urban cyber system | Head ornaments | Guofeng form at the core, traditional materials fused with cyber functional materials, matched to the hairstyle and costume, light effects controlled | Guofeng cyber head ornaments、pearls and jade + titanium-alloy functional pieces、controlled micro neon light strips、holographic projection accents、refined craft |
| Urban cyber system | Ear ornaments | Traditional jade ear pendants fused with cyber functional drops, light-responsive tassels controlled and unexaggerated | Guofeng functional ear drops、jade inlay + titanium-alloy material、controlled micro neon light-responsive tassels、refined and small |
| Urban cyber system | Neck ornaments | Traditional yingluo collar fused with a functional torque, Chinese form at the core | Guofeng functional torque、yingluo structure + titanium-alloy material、embedded controlled micro glow、refined and close-fitting |
| Urban cyber system | Waist ornaments | Traditional palace cord/jade pendant fused with a functional waist belt, magnetic clasps, structured build | Guofeng functional waist belt、wide belt panelled with palace cord、jade pendant at the waist、titanium-alloy magnetic clasps、distinct texture |
| Urban cyber system | Hand ornaments | Traditional jade bracelet fused with a functional wristband, Chinese form at the core, no exaggerated design | Guofeng functional wristband、translucent jade bracelet + titanium-alloy material、controlled micro glow、refined and close-fitting |

### Male accessories (split by setting system)

| System | Type | Constraint | Prompt |
|---|---|---|---|
| Ancient-style system | Hair crown | Traditional jade crown/gold crown, refined craft, Chinese traditional form, matched to the hairstyle and costume | jade crown holding the hair、gold crown holding the hair、jade carving、refined craft |
| Ancient-style system | Waist sash | Traditional wide sash/leather belt, Chinese traditional form, distinct texture | wide sash、leather belt、jade belt hook、distinct texture |
| Ancient-style system | Jade pendant | Traditional translucent, warm jade pendant, Chinese traditional craft, worn at the waist | jade pendant at the waist、translucent and warm、Hetian jade quality、fine carving |
| Ancient-style system | Waist accessories | A sword/fan/flute only as an accessory fixed at the waist; **held props are forbidden**; Chinese traditional form | sword fixed at the waist as an accessory、folding fan hung at the waist、bamboo flute as a waist ornament、no held interaction |
| Urban cyber system | Hair crown | Traditional jade-crown form + titanium-alloy functional material, matte craft, refined modeling, matched to the hairstyle and costume | Guofeng functional hair crown、Chinese crown-ornament base、matte titanium-alloy material、jade inlay、refined craft |
| Urban cyber system | Waist sash | Traditional wide-sash form + functional structure, magnetic clasps, structured cut, distinct texture | Guofeng functional waist belt、Chinese waist-sash base、matte functional fabric、titanium-alloy magnetic clasps、structured build |
| Urban cyber system | Jade pendant | Traditional jade form + acrylic light-responsive material, translucent and warm, controlled micro glow, worn at the waist | Guofeng light-responsive jade pendant、traditional form、acrylic + jade material、translucent and warm、controlled micro glow |
| Urban cyber system | Waist accessories | Traditional form + functional material, only as an accessory fixed at the waist; **held props are forbidden** | functional sword fixed at the waist as an accessory、titanium-alloy folding fan hung at the waist、no held interaction |

---

## 7. Costume and makeup combination quick lookup (full coverage of every scene in both settings)

| System | Scene | Makeup | Hairstyle | Costume | Accessories |
|---|---|---|---|---|---|
| Ancient-style system | Everyday in the boudoir | Clear plain makeup | Loose hair/half-tied hair | Ancient-style everyday long skirt | Medium (simple traditional accessories) |
| Ancient-style system | First meeting/gathering | Clear plain makeup | Half-tied hair/falling-horse bun | Ancient-style everyday long skirt | Medium to many (refined traditional accessories) |
| Ancient-style system | Romantic interaction | Romantic peach-blossom makeup | Half-tied hair/falling-horse bun | Ancient-style everyday long skirt/light everyday dress | Medium |
| Ancient-style system | Formal appearance at a court gala | Courtly noble makeup | High cloud bun | Ancient-style court ceremonial dress | Extremely elaborate (opulent traditional accessories) |
| Ancient-style system | Private at night | Clear plain/peach-blossom makeup | Loose hair/falling-horse bun | Ancient-style sleepwear | Extremely minimal (no surplus accessories) |
| Ancient-style system | Grand wedding ceremony | Grand wedding makeup | High cloud bun | Ancient-style grand wedding robes | Extremely elaborate (full phoenix-coronet-and-cape set) |
| Ancient-style system | Martial training/action | Plain makeup (extremely faint) | High tied ponytail | Ancient-style light everyday dress/warrior's fighting dress | Simple (basic fixed accessories only) |
| Urban cyber system | Urban commute everyday | Urban commute makeup | Guofeng half-tied low ponytail | Guofeng commute everyday wear | Medium to low (minimal Guofeng functional accessories) |
| Urban cyber system | Urban business formal occasion | Urban business makeup | Guofeng functional half-crown tied hair | Guofeng business formal wear | Medium (understated, opulent Guofeng functional accessories) |
| Urban cyber system | Appearance at an urban holographic gala | Courtly noble makeup/cyber streaming-light makeup | Guofeng high functional bun | Guofeng cyber gala dress | Extremely elaborate (opulent fused Guofeng + cyber accessories) |
| Urban cyber system | Urban night operations/functional mission | Functional cool-tone makeup | Guofeng high ponytail | Light functional Guofeng everyday wear/warrior functional fighting dress | Simple (functional fixed accessories only) |
| Urban cyber system | Urban leisure date | Romantic peach-blossom makeup/cyber streaming-light makeup | Guofeng half-mechanical braid | Guofeng commute everyday wear/light functional everyday wear | Medium (Guofeng accessories with a micro glow) |
| Urban cyber system | Private night scene | Clear plain makeup | Loose hair/low ponytail | Guofeng functional sleepwear | Extremely minimal (no surplus accessories) |
| Urban cyber system | Urban grand wedding ceremony | Grand wedding makeup | Guofeng high functional bun | Guofeng cyber wedding dress | Extremely elaborate (full fused Guofeng + cyber accessory set) |

---

> **🔍 Inference rule for scenes not covered (shared by both settings)**
>
> When the scene/situation the user describes is not in the table above, infer it yourself from the core DNA of this style: **lock the ancient-style or urban setting system first, then match the rules for each dimension**:
>
> | Inference dimension | Ancient-style system core DNA | Urban cyber system core DNA |
> |---|---|---|
> | Makeup strength | Clear plain makeup by default; court/power/formal→courtly noble makeup; heart-flutter/sweet romance→romantic peach-blossom makeup; grand wedding/ceremony→grand wedding makeup; festival gathering→festival celebration makeup | Urban commute makeup by default; business/formal→urban business makeup; heart-flutter/sweet romance→romantic peach-blossom makeup; gala/grand wedding→courtly noble makeup; cyber/functional/night operations→cyber streaming-light makeup/functional cool-tone makeup |
> | Hairstyle | Everyday/in the boudoir→half-tied hair or falling-horse bun; court/formal/gala→high cloud bun; private/night→loose hair; martial training/action→high tied ponytail | Everyday/commuting→half-tied low ponytail; business/formal→functional half-crown tied hair; gala/grand wedding→high functional bun; private/night→loose hair/low ponytail; functional/action→high ponytail |
> | Costume | The Chinese traditional form is the absolute core; emotional scenes→flowing ruqun long skirt; power/formal→court ceremonial dress; action→light everyday dress; PBR materials always locked; purely Chinese traditional motifs by default | The Chinese core form is the absolute base; everyday/commuting→Guofeng commute everyday wear; business/formal→Guofeng business formal wear; action/functional→light functional everyday wear; PBR materials always locked; traditional motifs fused with circuit grain by default |
> | Accessory density | Everyday→medium; formal/court→extremely elaborate; private→extremely minimal; action→simple; purely traditional Chinese accessories at the core | Everyday→medium to low; business/gala→extremely elaborate; private→extremely minimal; action→simple; fused Guofeng + cyber accessories at the core, light effects controlled |
> | Texture baseline | PBR materials + cinema-level soft light always locked; a sense of volume and sheen takes priority over flat decorative feel; no cyber light effects (forbidden with no explicit clue) | PBR materials + cinema-level lighting always locked; a sense of volume and sheen takes priority over flat decorative feel; cyber light effects are embedded controlled micro neon, blowing out is forbidden; Guofeng and cyber elements deeply fused, with no rupture |

## 8. Four-view design sheet specification (shared by both settings · one uniform 3D render standard)

> After the derived costume and makeup are overlaid, a four-view design sheet must still be output, to ensure the costume, hair and makeup, the motifs, the cyber light effects and the structural pieces stay perfectly consistent at every angle; this applies to the ancient-style and urban settings alike.

### View definitions

| Position | View | Angle | Shot size | Requirement | Prompt |
|---|---|---|---|---|---|
| Far left | Portrait close-up | Front, eye level | Face to collarbone | Face fills 60%+, features/makeup/makeup-effect detail 100% clear | portrait closeup、face detail、makeup detail |
| Second from left | Front view | Front 0° | Full-body standing figure | Facing the camera, the whole front of the costume, structure/motifs/light-strip positions clear | front view、height mark、costume detail |
| Second from right | Side view | Right 90° | Full-body standing figure | Pure profile silhouette, the side layering of the costume, the side form of the structure clear | side view、profile、height mark、costume profile detail |
| Far right | Back view | Rear 180° | Full-body standing figure | Hair ornaments at the back of the head/costume back/hair ends/back structure clear | back view、rear view、height mark、rear costume detail |

### Frame specification (shared by both settings · not to be crossed)

| Item | Constraint |
|---|---|
| Layout | Four views side by side, left to right, in one frame; the same layout for the ancient-style and urban settings |
| Background | Plain gray solid color #B8B8B8, **adding any scene/environment/weather element is forbidden**; the same for the ancient-style and urban settings |
| Standing pose | Standing naturally, feet parallel and slightly apart, arms hanging naturally or slightly out (**any change of pose is forbidden**); the same for the ancient-style and urban settings |
| Expression | A micro-expression matching the makeup style, facial micro-expression only, involving no body action; the same for the ancient-style and urban settings |
| Light | Universal standard: even soft light, key light from the front + fill light on both sides, no hard shadow; urban cyber scenes may add controlled self-illuminated reflection that does not break the overall lighting unity, with no blown highlights |
| Consistency | Face/makeup/hairstyle/hair ornaments/costume/accessories/motifs/light effects/structural pieces are exactly the same across the four views, with no deviation whatsoever |
| Aspect ratio | 4:1 or 3:1 recommended; the same for the ancient-style and urban settings |
| 3D standard | High-precision modeling, PBR materials, 8K ultra HD and cinema-level rendering uniform across every setting; no difference in texture between the ancient-style and urban settings |

---

## 9. Prompt template (one-click dual-setting fit · for Guofeng Cyber 3D)

### Output format constraints (shared by both settings · iron rule)

| Item | Constraint |
|---|---|
| Output content | **Output the prompt text only**, and nothing else |
| Forbidden output | Quick-lookup tables, layered construction plans, visual constraint tables, prohibition tables, derivation plans, output suggestions, core-element tables and any other non-prompt content |
| Forbidden scenes | Character derived assets **contain no scene/environment description**; output no scene/environment/weather/background narrative content (the scene belongs to the scene asset category) |
| Forbidden props | **No prop interaction of any kind**; output no umbrella/sword/fan/book/lantern/wine cup or other held or interacted object (props belong to the prop asset category) |
| Forbidden pose change | **Do not change the base model's pose**; output no walking/glancing back/raising a hand/turning side-on/running or any other action or bearing change — keep the natural standing pose |
| Format | Output a usable prompt code block directly, with no heading, table, explanation or plan comparison |

### Complete costume and makeup overlay (four views · one-click dual-setting fit)

```
Take the character base likeness image as the underlying image and overlay the costume, hair and makeup with img2img，
Guofeng Cyber 3D style，{setting system: ancient-style/urban cyber}，high-precision modeling，PBR materials，Chinese aesthetic core，{light ancient-style fusion/urban functional fusion}，cinema-level lighting，
Guofeng cyber {gender} character four-view design sheet，3D render，high-precision modeling，8K，ultra-faithful
character design sheet, character turnaround,
keep the face of the base likeness exactly the same and the natural standing pose unchanged，{overall temperament},
【L1·Makeup】decide from the user's clues: {base makeup/light makeup/formal makeup/urban commute makeup/business makeup/cyber functional makeup}; use {makeup style}, PBR material rendering, {brow makeup}, {eye makeup}, {lip makeup}, {controlled micro neon light effects/skin-close hidden circuit patterns (add as needed)},
【L2·Hairstyle】{styling type}, high-precision clear hair strands, {hair ornament description}, Guofeng form at the core,
【L3+L4·Costume】{main color}{design}, {material}, {decorative craft}, {traditional motifs/traditional motifs fused with circuit grain}, clear clothing texture, PBR material rendering, {embedded controlled micro neon light strips (add as needed)},
【L5·Accessories】{head ornaments}, {ear ornaments}, {neck ornaments}, {waist ornaments}, {hand ornaments}, Guofeng form at the core, unified with the costume and makeup style,
side by side left to right in one frame：portrait close-up+front view+side view+back view,
standing naturally, plain gray solid-color background, even soft light, no hard shadow, {cyber light effects controlled and not glaring (add as needed)},
face/makeup/hairstyle/costume/accessories/motifs/light effects exactly the same across the four views, clear Guofeng Cyber 3D modeling, clear high-precision modeling,
no text of any kind in the image
```

---

## 10. Constraint rules (shared by both settings · mandatory + forbidden iron rules)

### Mandatory rules (executed 100%, no exceptions)

| No. | Rule |
|---|---|
| R1 | After overlaying, the face must match the base model exactly; any drift, deformation or stylized alteration of the features is forbidden |
| R2 | The costume must use "clear clothing texture + PBR material rendering"; cyber elements must not break the costume's base texture or the Guofeng core form |
| R3 | Every setting must take the Chinese Guofeng form as its absolute core — ancient-style scenes purely traditional Guofeng, urban scenes never losing the Guofeng base; purely Western design with no Guofeng core is forbidden |
| R4 | Makeup/hairstyle/costume/accessory/cyber element styles are perfectly unified; splitting or opposing the Guofeng and cyber elements is forbidden |
| R5 | A four-view design sheet must be output (portrait close-up+front view+side view+back view); the same for the ancient-style and urban settings |
| R6 | Must specify "plain gray solid-color background"; adding any scene/environment/weather element is forbidden; the same for the ancient-style and urban settings |
| R7 | Must specify "four-view consistency": all costume and makeup, motifs, cyber light effects and structural pieces are perfectly uniform across the four views |
| R8 | **Output the prompt only** — outputting quick-lookup tables/layered plans/visual constraints/prohibitions/derivation plans/output suggestions or any other non-prompt content is forbidden |
| R9 | **No scene description** — character derived assets involve no scene/environment/weather/background narrative; the scene is an independent asset type |
| R10 | **No prop interaction** — no held or interacted object of any kind (umbrella/sword/fan/book, etc.); props are an independent asset type, except accessories fixed at the waist |
| R11 | **The pose stays unchanged** — the base model's natural standing pose must be kept; any change of action/bearing/posture is forbidden |
| R12 | **L1 must analyze before deciding** — parse the user's setting clues, facial clues and style clues first, then match the corresponding system and settle the makeup tier |
| R13 | **Every derived asset needs makeup** — normally it does not stay bare-faced; use at least base makeup |
| R14 | **Makeup strength is controlled** — even with makeup applied it must stay restrained; modern heavy makeup/exaggerated color makeup/blown-out cyber light effects must not appear |
| R15 | **Props/scenes/actions are not grounds for raising the strength** — prop, environment or action information alone must never raise base makeup to a stronger makeup |
| R16 | **Dual-setting fit rule** — with no explicit cyber/urban clue, default to pure ancient-style generation; with an explicit clue, match the urban cyber system; never switch on your own |
| R17 | **Cyber elements are strictly controlled** — only the urban cyber system may use cyber light effects/functional elements, forbidden in ancient-style scenes with no explicit clue; every cyber element must be deeply fused with Guofeng, and rupture is forbidden |
| R18 | **Cyber elements are confined to the costume-and-makeup scope** — functional structural pieces and light-effect elements are confined to the costume and accessory layers and must not change the base model's features, limb structure or basic bearing |
| R19 | **3D texture uniform across every setting** — the ancient-style and urban settings must keep the same high-precision modeling, PBR material and cinema-level lighting standard; no downgrade in texture is allowed |

### Forbidden rules (forbidden 100%, no exceptions)

| No. | Forbidden |
|---|---|
| X1 | Facial drift after overlaying, deformed features, inconsistency with the base model |
| X2 | The costume losing the Guofeng core form, producing a purely Western suit, purely functional clothing or purely Western cyberpunk design with no Chinese core |
| X3 | Makeup/costume/cyber element styles clashing with each other, producing a rupture, with Guofeng and cyber elements opposed |
| X4 | A complex scene background (it must be a solid color); adding any environment/scene/weather element is forbidden |
| X5 | Costume and makeup, motifs, cyber light effects or structural pieces inconsistent between the four views |
| X6 | Any content beyond the output prompt (tables/plans/suggestions/explanations/variants, etc.) |
| X7 | Adding a scene description to a character derived asset (street view/rain/interior/street/weather or other environmental elements) |
| X8 | Outputting sections such as "core element quick lookup", "layered construction plan", "visual constraints", "prohibitions" or "derivation plans" |
| X9 | Adding any prop interaction (holding an umbrella/sword/fan/book/lantern/wine cup or other object) |
| X10 | Changing the base model's pose (walking/glancing back/raising a hand/turning side-on/running/lowering the head/looking up or other action descriptions) |
| X11 | Adding descriptions that link expression and pose (narrative writing such as "walking side-on at 45° with the corner of the mouth curving slightly") |
| X12 | Applying a fixed makeup or fixed cyber elements directly without analyzing the user's clues, or switching between the ancient-style and urban systems on your own |
| X13 | Wrongly staying bare-faced, so the derived asset lacks the makeup it should have |
| X14 | Wrongly upgrading the makeup on prop/scene/action words alone, leading to a wrong makeup-strength decision |
| X15 | Adding cyber light effects/functional elements on your own in an ancient-style scene with no explicit clue, breaking the ancient-style atmosphere |
| X16 | Neon light effects blown out, glaring or covering large areas, breaking the texture of the frame and the character's face and costume-and-makeup detail |
| X17 | Modifying the base model's limb structure or facial features on your own, adding prosthetic modification or body paintwork outside the costume-and-makeup scope |
| X18 | The urban setting losing the Guofeng base, producing a purely Western cyberpunk style detached from the Chinese core form |
| X19 | Vulgar, exaggerated Western punk design that does not fit Eastern aesthetics, violating the Guofeng aesthetic core |

---

## ✅ Validation notes
1. **100% dual-setting fit**: two parallel rule sets — the "ancient-style traditional system" and the "urban cyber system" — are built out in full, so pure ancient-style content can be generated perfectly with no explicit cyber clue, and Guofeng cyber content precisely with an urban clue, with no conflict between them
2. **Zero drift on the Guofeng base**: the red line "the Chinese form is the absolute core" runs through the whole manual; every costume, hairstyle and accessory in the urban cyber setting keeps its Guofeng core, ruling out drift into pure Western cyber
3. **Cyber fusion under control**: cyber elements are split into an "optional light version" and an "urban reinforced version" with clear boundaries, so an ancient-style scene never becomes over-cyberized and an urban scene never loses its Guofeng
4. **One uniform 3D standard**: the ancient-style and urban settings share one high-precision 3D render standard, with no difference in PBR materials, lighting or modeling precision, keeping the generated result stable
5. **No core constraint dropped**: the original manual's core rules — "the face does not change, the pose does not change, layer by layer under control, costume and makeup only" — are kept in full; the optimization does not break the manual's underlying logic
6. **Coverage with no blind spots**: the costume-and-makeup combinations, inference rules and prompt templates for every ancient-style and urban sub-scene are filled in, ready to use directly with no second round of adjustment