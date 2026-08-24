---
name: liveaction_urban_character_derivative
description: Live-action urban character derived asset generation · constraint manual
metaData: liveaction_urban_art_skills
---

# Live-Action Urban Character Derived Asset Generation · Constraint Manual

---

## 1. Styling logic — styling a real person

> Live-action urban does not discuss "material stacking", "PBR rendering" or "modelling precision". What is discussed here is: a makeup artist working on a real face, a hair stylist handling real hair with real tools, a stylist taking a garment that has been worn off the rack — and then the camera photographing all of it.

1. **Makeup is a "second layer of skin", not a "face texture map"** — foundation blends with the skin's oil, eyeliner shifts slightly to follow the eye shape, lipstick sits unevenly because of lip lines — makeup must feel like it was "just applied"
2. **Hair is alive** — even after styling, loose strands still fall out, the roots have natural lift rather than a wig cap, and where a ponytail is pulled tight the scalp shows the natural pull
3. **Clothes are "worn on a body", not "worn on a model"** — the shoulder line is not necessarily perfectly symmetrical (a real stance is not symmetrical), the fabric creases naturally with the body's movement, and the neckline is slightly deformed from being pulled on and off
4. **Styling serves the face, it does not hide the face** — the worst styling is the one that makes the base likeness unrecognisable. Derived styling should reinforce, not mask, the character's core temperament

---

## 2. Styling layers

| Layer | Content | How live-action urban reads it |
|---|---|---|
| L0 | Base likeness | The base-likeness model — bare face, base hairstyle, base everyday outfit. Not modified |
| L1 | Makeup | A makeup artist's work on a real face — base → brows and eyes → cheeks → lips. Intensity decided by the setting |
| L2 | Hair styling | A hairstyle made by a stylist with real tools — blow-out/tying up/braiding/curling + hair ornaments |
| L3 | Inner layer | The next-to-skin layer — T-shirt/shirt/knitwear/camisole/base top, replacing the basic piece |
| L4 | Outerwear/main garment | The outer layer — suit/trench coat/hoodie/dress/overcoat/workwear, which decides the overall dressing style |
| L5 | Accessories | Jewellery/headwear/glasses/scarf/bag/watch — the last step of an everyday outfit |

> **Scope boundary**: styling only (makeup + hairstyle + clothing + accessories). It does not cover props (phone/coffee cup/umbrella/book and other handheld items), scene environments, or poses and actions.

---

## 3. Makeup — a makeup artist's work on a real face (L1)

### Core principle

> Makeup is a "second layer of skin". The camera must be able to see the real skin underneath it — pores not filled in, fine lines not sanded away, foundation not floating on the surface like a mask.

### Clue analysis and makeup decision

| Step | What is processed |
|---|---|
| S1 | Extract the user's clues: scene situation, emotional atmosphere, description of facial state |
| S2 | Filter out non-makeup clues: prop/scene/action words do not become makeup |
| S3 | Match setting → makeup intensity: bare-skin level / everyday level / occasion level / gala level |
| S4 | Generate the L1 prompt — output the conclusion only |

### Setting → makeup intensity mapping

| Setting | Makeup intensity | Core intent |
|---|---|---|
| At home/just woken up/bare-faced state | Bare-skin level — no trace of makeup, only the skin itself | Real skin texture, an unretouched face |
| Everyday commute/supermarket/a walk | Everyday level — light makeup, looking "not made up but with good colour" | Presentable at work/in daily life, a refinement nobody notices |
| Date/gathering/shopping | Occasion level — you can tell makeup was applied, but it is not too much | Makeup with presence, still within the range of "everyday life" |
| Banquet/wedding/gala | Gala level — a complete, refined makeup look | Makeup designed for lens and lights, but the real skin is still visible under the base |

### Female makeup — matched to the face type

#### Cool and restrained

| Intensity | Makeup intent | Prompt |
|---|---|---|
| Bare-skin level | No makeup — clean cool fair skin, brows natural and untouched, lip colour is her own blood colour | no trace of makeup, natural cool fair skin texture, untouched native brows, lip colour is her own blood colour |
| Everyday level | "I might have put on a bit of lip balm" — the faintest nude lip, brows lightly brushed, no trace of eye makeup | the faintest nude lipstick, natural brow shape lightly brushed, no eye-makeup feel, the skin's own sheen |
| Occasion level | A red lip is the only focus — matte brick red or brown-toned lipstick, brows and eyes kept restrained, emphasising cool detachment | matte brick-red lip (the only focus), the finest eyeliner hugging the outer corner, clean crisp brow shape, everything else almost bare |
| Gala level | Cool-toned smoky but not heavy — grey-brown light smoky eye, contouring, matte dark red lip, the bone structure preserved | grey-brown light smoky eye, light contour under the cheekbones, matte dark red lip, facial bone structure preserved |

#### Gentle and healing

| Intensity | Makeup intent | Prompt |
|---|---|---|
| Bare-skin level | Warm fair translucent skin, cheeks naturally pale pink, brows soft | warm fair translucent bare skin, naturally rosy cheeks, soft brow shape, no makeup feel |
| Everyday level | Dewy sheen — luminous base, pink-toned blush lightly brushed, lip-balm texture | luminous base makeup, pink-toned blush blended naturally, translucent moisturised lip, gentle gaze |
| Occasion level | Warm and soft — apricot eyeshadow, cream blush, mirror lip gloss, warm overall | warm apricot eyeshadow blended naturally, cream-textured blush, mirror lip gloss, warm and soft |
| Gala level | Warm-toned refined makeup — champagne pearl eye makeup, luminous base, rose-mauve lip, refined without losing gentleness | champagne pearl eye makeup, luminous highlight, rose-mauve lip colour, a refined, gentle complete makeup look |

#### Urban and capable

| Intensity | Makeup intent | Prompt |
|---|---|---|
| Bare-skin level | Neutral clean skin, brows crisp but undrawn | neutral clean bare skin, crisp brow shape untouched, natural lip colour, an unretouched face |
| Everyday level | "Office light makeup" — matte base, crisp brow shape, MLBB lip colour (my lips but better) | matte natural base, crisp brow shape lightly drawn, MLBB lip colour, presentable without drawing attention |
| Occasion level | Sharp but not fierce — clear eyeliner, contouring, low-saturation rose lip | sharp clear eyeliner, facial contouring, low-saturation rose lip, capable and forceful |
| Gala level | Full refined makeup — matte base, structural contouring, true red or plum lip, presence at full power | matte refined base, structural contouring, true red/plum lip, complete yet the facial structure still readable |

#### Youthful and lively

| Intensity | Makeup intent | Prompt |
|---|---|---|
| Bare-skin level | Collagen is the makeup — skin that needs no makeup is already bright | bare skin full of collagen, naturally rosy cheeks, bright eyes, no makeup needed |
| Everyday level | "Just a bit of colour" — tinted lip balm, clear brow gel, the faintest cream blush | tinted lip balm, brows groomed with clear gel, cream blush patted on lightly, you cannot tell makeup was applied |
| Occasion level | Bright and lively — orange/coral blush, glossy lip gloss, light pearl eyeshadow | orange-toned lively blush, glossy lip gloss, light pearl eyeshadow, a bright girlish quality |
| Gala level | Refined but not ageing — sheer base, juicy lip gloss, lightly shimmering eyeshadow, youthfulness preserved | sheer base keeping the skin texture, juicy lip gloss, lightly shimmering pearl eyeshadow, refined without covering the youthfulness |

#### Streetwise and everyday

| Intensity | Makeup intent | Prompt |
|---|---|---|
| Bare-skin level | A face the sun has been on — sun marks, natural unevenness of skin tone, no makeup | a natural face with sun marks, real unevenness of skin tone, skin with no makeup on it, the face of life itself |
| Everyday level | "Put on a bit of face cream and went out" — the faintest tinted primer, her own lip colour | the faintest tint, base makeup you can barely see, her own lip colour, the natural state of a freshly washed face |
| Occasion level | Simple and presentable — natural-shade lipstick, brows lightly tidied, a thin base | natural-shade lipstick, lightly tidied brow shape, a thin base with no heavy layer, plain decency |
| Gala level | Dressed up but not affected — warm earth-tone eyeshadow, brick red/brown red lip, skin texture still visible under the base | warm earth-tone eye makeup, brick-red/brown-red lip, a base that keeps the skin texture, dressed up without going false |

### Male makeup

> The highest standard for male makeup is "you cannot tell makeup was applied".

| Intensity | Applicable settings | Prompt |
|---|---|---|
| Bare-skin level | The default state for every setting | unretouched real male skin, natural oil sheen, pores clearly visible, real texture of a freshly shaved jaw |
| Everyday level | Lens close-ups/studio shoots/important dialogue | the faintest evening of skin tone (no visible powder), brows lightly groomed with clear gel, natural lip colour with a lip-balm texture — you cannot tell makeup was applied at all |
| Occasion level | Weddings/galas/lens close-ups | even clean skin (pore texture retained), brow shape lightly brushed, naturally moisturised lip colour — you can tell he was taken seriously but you cannot see foundation |

---

## 4. Hair styling — real hair in the stylist's hands (L2)

### Female hairstyles

#### Classified by styling method

| Styling method | Type | Hairstyle description | Matching face types |
|---|---|---|---|
| Falling naturally | Long straight black hair | naturally smooth straight hair, ends curving slightly inward, centre or side parting, loose strands falling naturally over the forehead and the back of the neck | Cool and restrained/gentle and healing/urban and capable |
| Falling naturally | Loose soft waves | wide loose waves, roots naturally lifted, curl not uniform (not identical curling-iron waves), loose strands framing the face | Gentle and healing/youthful and lively |
| Falling naturally | Collarbone-length layered bob | shoulder length, ends layered and point-cut, one side tucked behind the ear to show the earring, loose strands natural at the nape | Urban and capable/cool and restrained |
| Falling naturally | Tight lamb curls | small-to-medium curls all over, voluminous and airy, roots naturally standing, curl handmade rather than mechanically even | Youthful and lively/streetwise and everyday |
| Tied up | High ponytail | tied high on the crown, roots naturally lifted, ponytail falling in a natural curve rather than a straight line, loose strands falling naturally at the forehead and temples | Youthful and lively/urban and capable/sports settings |
| Tied up | Low ponytail/low bun | gathered at the nape or behind the ears, loose but not falling apart, loose strands natural at the nape, with the relaxed feel of "tied up in passing" | Gentle and healing/streetwise and everyday/at-home settings |
| Tied up | Top bun | coiled at the top or back of the head, loose rather than tight, loose strands framing the face and neck | At home/everyday/sports |
| Braided | Single side braid | braided to one side, loose and handmade, loose strands braided in, braid ends naturally frizzy | Gentle and healing/youthful and lively |
| Braided | Twin braids | symmetrical braids on both sides, moderately tight, suits a youthful look | Youthful and lively |
| Short hair | Ear-length bob | above or below the ear, ends blunt or point-cut, one side tucked behind the ear, nape clean | Urban and capable/cool and restrained |
| Short hair | Boyish choppy crop | layered point-cut short hair, nape clipped short, loose strands falling naturally at the forehead | Cool and restrained/urban and capable/androgynous |

#### The real state of hair in front of the camera (shared by all hairstyles)

| State | Prompt |
|---|---|
| Loose strands | loose strands falling naturally at the forehead, baby hairs at the temples, loose strands at the nape, hairline naturally uneven |
| Roots | roots naturally lifted rather than flat to the scalp, scalp naturally visible at the parting |
| Ends | ends naturally frizzy/split, ends falling in a natural curve after being tied up |
| Sheen | the natural reflection of healthy hair — neither greasy nor matte, hair a semi-transparent warm rim in backlight |
| Strictly forbidden | wig-like tidy edges, CG strands each separately drawn, no loose strands, stiffly set |

### Male hairstyles

| Style | Description | Matching face types |
|---|---|---|
| Crisp short hair | clipped short at the sides, left longer on top for styling, strands running in a natural direction, forehead visible | Rugged and mature/urban and capable (male face equivalent) |
| Textured side-part crop | loose strands at the forehead just covering the brows, top voluminous and layered, sides transitioning naturally | Sunny youth/warm and reserved |
| Side-part short hair | side parting, one side combed back, business-tidy but not a slicked-down shell | Crisp and restrained/warm and reserved |
| Buzz cut/crew cut | very short hair, scalp visible, natural hairline, clear head shape | Rugged and mature/streetwise and worldly |
| Wolf cut/mullet | short in front and long at the back, ends left long at the nape, crisp layers, with the offhand feel of "not cut carefully" | Sunny youth/crisp and restrained |
| Medium-long hair | shoulder length, falling naturally or half tied up, natural hair quality | Crisp and restrained/artistic temperament |
| Curly/textured | natural curl or a light texture perm, voluminous and airy, not stiff | Sunny youth/warm and reserved |

#### The real state of hair in front of the camera (shared by male hairstyles)

| State | Prompt |
|---|---|
| Short-hair texture | scalp visible with short hair, strands running in a natural direction, natural transition between sideburns and stubble |
| Everyday state | no gel-shell stiffness, hair naturally voluminous or slightly flattened (as in everyday life), the natural disorder of wind having blown through it |
| Hairline | natural hairline (slight recession allowed), possible slight thinning at the temples, not wig-like tidiness |
| Strictly forbidden | gel-shell reflection, wig-like tidy edges, CG strands, unnaturally perfect hairstyle |

---

## 5. Clothing — real outfits, not modelled garments (L3+L4)

### The clothing logic of live-action urban

> A 3D project discusses "material rendering", "PBR physical properties", "multi-layer structure assembly". Live-action urban discusses: where was this garment bought? How many times has it been worn? Why was it picked today?

- **Layering comes from weather and occasion, not from "design layers"**: a shirt over a T-shirt because morning and evening are cold, a trench coat because it is windy today, a knit cardigan because the office air conditioning is too cold
- **Clothes carry marks of wear**: the neckline slightly deformed, friction marks at the cuffs, stretch texture at the knees of the jeans, a white T-shirt slightly aged by washing
- **Fitted, not tight**: the garment follows the body without pulling, the shoulder line sits naturally (it may shift slightly with posture), the trouser length is exactly right or breaks slightly on the shoe
- **The real dressing of contemporary Chinese cities** — not a Korean drama, not a Japanese magazine, not a Western street shot

### Female clothing matrix

| Dressing style | Key pieces | Applicable settings | Prompt |
|---|---|---|---|
| Office commute | blazer/shirt/cigarette trousers/midi skirt/trench coat | Office, business meetings, everyday commute | office commute outfit, blazer + shirt + straight suit trousers, camel/navy/black palette, fabric with natural drape, fitted without pulling |
| Casual everyday | T-shirt/hoodie/jeans/wide-leg trousers/knit cardigan | Weekend outings, supermarket shopping, cafés, walks | casual everyday outfit, loose hoodie + straight jeans, off-white/grey/khaki palette, natural cotton texture |
| Gentle date | knit dress/floral midi skirt/cashmere cardigan/French shirt | Dates, gatherings with close friends, afternoon tea | gentle date outfit, knit dress + cropped cardigan, cream/dusty pink/pale apricot palette, soft fabric texture |
| Street style | oversize hoodie/cargo trousers/denim jacket/baseball cap | Shopping, street culture, music festivals, nightlife | street-style outfit, oversize hooded sweatshirt + wide-leg cargo trousers, black/grey/army green palette, offhand with attitude |
| Sports and outdoor | yoga leggings/sports bra/quick-dry T-shirt/shell jacket/trainers | Gym, outdoor running, cycling, hiking | sportswear outfit, yoga leggings + sports bra + loose quick-dry T-shirt, dark palette, natural texture of technical fabric |
| Preppy artistic | knit vest + shirt/pleated skirt/canvas shoes/short wool coat | Campus, bookshops, libraries, exhibitions | preppy artistic outfit, knit vest layered over a shirt + pleated skirt, navy/wine red/check, a bookish air |
| Relaxed at home | loose cotton loungewear/knit robe/fleece jacket | At home, morning, late night | at-home outfit, loose cotton long sleeve + lounge trousers, off-white/pale grey/pale blue, soft skin-friendly texture |

### Male clothing matrix

| Dressing style | Key pieces | Applicable settings | Prompt |
|---|---|---|---|
| Business formal | suit/white shirt/tie/dress shoes | Business meetings, formal occasions, important meetings | business formal outfit, dark grey/navy suit + white shirt, fitted cut, fabric crisp with good drape |
| Business casual | casual blazer + crew-neck T-shirt/knitwear + chinos | Everyday commute, light business occasions | business casual outfit, casual blazer + white crew-neck T-shirt + khaki chinos, no tie, relaxed but controlled |
| Everyday casual | plain T-shirt/long-sleeve henley/hoodie + straight jeans | Weekends, everyday, all informal occasions | everyday casual outfit, plain cotton T-shirt + straight jeans, black/white/grey/navy, natural comfortable fabric |
| Streetwear | printed hoodie/cargo trousers/denim jacket/canvas shoes | Shopping, gatherings, nightlife | streetwear outfit, printed hoodie + cuffed cargo trousers, black/army green/grey palette, relaxed with attitude |
| Technical sportswear | quick-dry T-shirt/sports shorts/track trousers/trainers | Gym, running, basketball court | sportswear outfit, quick-dry T-shirt + sports shorts, black/dark grey, technical fabric texture |
| Artistic and cool | drop-shoulder shirt/loose knitwear/wide-leg suit trousers/canvas shoes | Bookshops, exhibitions, cafés | artistic outfit, drop-shoulder cotton shirt + loose suit trousers, earth tones/off-white/navy, an unforced quality |

---

## 6. Accessories — the last step of an everyday outfit (L5)

### Female accessories

| Category | The accessory logic of live-action urban | Prompt |
|---|---|---|
| Earrings | Not "metal drop earrings" — but "the pair she picked up on her way out today". Mostly small and simple, echoing the dressing style | small silver studs/fine metal hoops/pearl studs/acrylic geometric drops — matching {dressing style} |
| Necklaces | A collarbone chain or a mid-length necklace, following the natural curve of the neck, neither floating nor sinking into the skin | fine collarbone chain/fine metal chain with pendant/short pearl necklace — sitting naturally against the neck |
| Watch/hand jewellery | A watch worn every day, a fine bracelet or a ring, with marks of use (strap naturally bent, metal lightly worn) | leather-strap watch/fine metal bracelet/simple ring — the quality of everyday wear, with marks of use |
| Headwear | Baseball cap/beret/knit beanie — the brim has a natural curve, the body of the hat shows marks of wear | baseball cap (brim naturally curved)/beret (worn slightly tilted)/knit beanie (soft texture) |
| Glasses | Prescription glasses or sunglasses, frame material natural, lenses with slight reflection but the eyes still visible | fine metal frame/acetate frame glasses, lenses slightly reflective but the gaze still visible |
| Bags | A real bag for everyday commuting/going out — leather with creases of use, canvas naturally aged | leather shoulder bag (natural creases of use)/canvas tote (slightly aged)/small crossbody bag |

### Male accessories

| Category | Prompt |
|---|---|
| Watch | an everyday wristwatch — metal bracelet naturally worn/leather strap with bend marks/simple dial |
| Glasses | fine metal frame/acetate frame glasses, lenses slightly reflective, nose pads sitting naturally |
| Headwear | baseball cap/beanie — naturally worn, brim slightly curved, with a sense of everyday use |
| Backpack | backpack/messenger bag — canvas or leather, with marks of use, straps naturally bent |

---

## 7. Styling combination quick reference

| Setting | Makeup intensity | Hairstyle | Dressing style | Accessories |
|---|---|---|---|---|
| At home in the morning | Bare-skin level | Falling naturally/casually tied up | Relaxed at home | Minimal or none |
| Commuting to work | Everyday level | Crisp loose hair/low ponytail/side-part short hair | Office commute/business casual | Watch + a simple bag |
| Weekend outing | Everyday level | Loose soft waves/textured side-part crop/wolf cut | Casual everyday/everyday casual | Bag + hat + watch |
| A date | Occasion level | Gentle waves/collarbone bob/side parting | Gentle date/preppy artistic | Earrings + necklace + bag |
| Café/bookshop | Everyday level | Falling naturally/layered short hair/medium-long hair | Preppy artistic/artistic and cool | Glasses + canvas bag |
| Gym/outdoors | Bare-skin level | High ponytail/top bun/buzz cut | Sports and outdoor/technical sportswear | Sports watch + headband |
| Banquet/gala | Gala level | Refined waves/updo/slicked side parting | Formal dress (dress/suit) | Earrings + necklace + hand jewellery + a refined bag |
| Alone late at night | Bare-skin level | Loosely falling/slightly messy | Relaxed at home | None |
| Street night market | Occasion level | Lamb curls/boxer braids/wolf cut | Street style/streetwear | Earrings + baseball cap |
| Hospital/formal occasion | Everyday level | Crisply tied up/crisp short hair | Simple plain-coloured outfit | Minimal |

> **Rule for inferring uncovered settings**: first judge whether the setting is private or public (private → bare-skin level, public → everyday level as the floor); then judge how formal it is (formal occasion → occasion level/gala level); finally judge the mood (romantic/social → occasion level). Makeup matches the face type (see section 3), the outfit matches the temperature and atmosphere of the setting.

---

## 8. Character portrait series — four-angle photography specification

> After the derived styling is layered on, the four-angle studio series must still be output, so that makeup, hairstyle and outfit stay consistent and recognisable across every live-action angle.

### Four-angle definitions

| Position | Angle | Shot size | Photographic requirement |
|---|---|---|---|
| Far left | Front, medium close-up | Top of head to top of collarbone | The face fills 60%+, makeup detail clearly visible (how the foundation blends with the skin, the precision of the eyeliner, the texture of the lip colour). Focal length 50-85mm |
| Second from left | Front 0° | Full body | The full front view of the outfit, with drape, layering and accessories shown complete. Head to feet complete |
| Second from right | Right side 90° | Full body | Side contour + the side layering of the outfit, the hairstyle seen from the side. Head to feet complete |
| Far right | Rear 180° | Full body | The full hairstyle at the back of the head, the outfit from behind, the back of the bag/headwear. Head to feet complete |

### Frame specification

| Item | Photographic requirement |
|---|---|
| Layout | Four angles side by side in one frame, left to right, evenly spaced. Laid out as a "styling approval photo" |
| Background | Mid-grey seamless backdrop paper #B0B0B0, no light spots, no gradient, no cast shadow |
| Standing pose | Keep the base-likeness stance — the natural everyday stance with shifted weight, not attention and not a pose. **Changing the posture because the outfit changed is forbidden** |
| Facial expression | A micro-expression in keeping with the makeup intensity and the atmosphere of the setting — bare-skin level neutral and natural, occasion level with a faint smile, gala level composed and confident. **Facial micro-expression only; no body movement is involved** |
| Light | Studio soft light — softbox key light from the front + reflector fill from both sides. Light soft, direction clear, lighting ratio about 1:2 to 1:3, keeping the modelling of the face. The material quality of clothing and accessories clearly visible |
| Consistency | The four angles are a continuous photographic record of the same person in the same styling session. Face/makeup/hairstyle/outfit/accessories must all read as one and the same session |
| Aspect ratio | 4:1 or 16:4 wide format recommended |

---

## 9. Prompt template

### Output format constraints

| Item | Constraint |
|---|---|
| Output content | **Output the prompt text only** — no analysis process, no option comparison, no quick-reference table, no constraint explanation |
| No scene | Do not include any scene/environment/weather/background description |
| No props | Do not include any handheld/interacted object (props are a separate asset) |
| No pose change | Do not change the base-likeness stance, do not output any action/posture change |
| Format | Output the complete, usable prompt directly |

### Full styling-overlay prompt template

using the character's base likeness image as the base image，img2img styling overlay，
live-action urban character styling portrait series，live-action photography，studio soft light，mid-grey seamless backdrop paper，
{gender} character portrait series，live-action style，not 3D not rendered not CG，
character portrait series, live-action photography, studio soft lighting,
keep the base likeness face unchanged，{overall temperament}，
【L1 · makeup】{makeup intensity — bare-skin level/everyday level/occasion level/gala level}，{makeup description}，makeup blended with real skin, foundation not a mask, skin pore texture still visible，
【L2 · hair】{hairstyle description}，real hair texture，{real state of loose strands/roots/ends}，not a wig not CG strands，
【L3+L4 · outfit】{dressing style}，{top description}+{bottom description}，{colour}，{natural fabric texture}，garments draping naturally, with real creases from being worn, not showroom samples，
【L5 · accessories】{accessory description}，the quality of everyday wear, with marks of use, sitting naturally on the body，
side by side left to right in one frame: medium close-up + front full body + side full body + back full body，
natural everyday stance (weight shifted)，mid-grey seamless backdrop paper #B0B0B0，even studio soft light，soft lighting ratio，
the four angles a continuous photographic record of one styling session，
clean frame with no text no watermark no signature no border，
live-action realistic photographic image quality、35mm full-frame photographic texture

### Negative prompt

3D render, 3D modeling, CGI, Unreal Engine, Blender, PBR material, 8K modeling, game engine, cartoon, anime, 2D, illustration, hand drawn, painting,
plastic skin, wax face, silicone skin, airbrushed skin, perfect smooth skin, poreless, doll-like, mannequin,
symmetrical pose, mannequin pose, runway pose, model stance, military stance, exaggerated pose, action pose,
heavy makeup, dramatic makeup, makeup mask, foundation mask, fake lashes, colored contacts,
wig, fake hair, helmet hair, stiff hair, perfect hairline, CG hair strands,
brand new clothes, showroom clothes, stiff fabric, unrealistically clean, no wrinkles, mannequin clothes,
古风, 古装, 汉服, 仙侠, 武侠, 民国, 赛博朋克, 科幻, 西方奇幻, 中世纪,
text, watermark, signature, logo, border, frame

---

## 10. Constraint rules

### Mandatory

| No. | Rule |
|---|---|
| R1 | After the overlay the face must match the base likeness — styling serves the face, it does not hide the face |
| R2 | Makeup must blend with real skin — foundation not a mask, pore texture still visible, not AI-smooth |
| R3 | The hairstyle must show real hair quality — loose strands, lift at the roots, frizzy ends, not a wig and not CG strands |
| R4 | Clothing must carry real marks of wear — natural creases, fabric drape, not a showroom sample and not brand new out of the factory |
| R5 | Accessories must feel worn every day — sitting against the body, with marks of use, neither floating nor sinking into the skin |
| R6 | Must output the four-angle studio series (medium close-up + front + side + back full body) |
| R7 | Must specify "mid-grey seamless backdrop paper #B0B0B0"; adding a scene environment is forbidden |
| R8 | Must specify "the four angles are a continuous photographic record of one styling session" |
| R9 | **Output the prompt only** — do not output the analysis process, quick-reference tables, option comparisons or anything else that is not the prompt |
| R10 | **No prop interaction** — do not include handheld objects; props are a separate asset |
| R11 | **The pose stays unchanged** — keep the base-likeness stance, do not add any action/posture description |
| R12 | **No scene/environment description** — the scene is a separate asset |
| R13 | L1 must be decided from the setting → makeup intensity mapping: bare-skin level / everyday level / occasion level / gala level |
| R14 | Every derived asset needs a styling plan — under normal circumstances it does not stay completely bare-faced and plainly dressed; it goes at least to everyday level |

### Strictly forbidden

| No. | Strictly forbidden |
|---|---|
| X1 | Strictly forbidden: "3D render / 3D modelling / CG / PBR material / 8K modelling / UE engine / Blender" and every other CG term |
| X2 | Strictly forbidden: "2D hand-drawn / illustration / animation / anime" and other non-photographic media |
| X3 | Strictly forbidden: "over-smoothed / silicone face / waxwork mask / zero pores / AI-smooth skin" — there must be real skin under the makeup |
| X4 | Strictly forbidden: "wig / CG strands each separately drawn / stiff tidy hair / no loose strands" |
| X5 | Strictly forbidden: "showroom sample / brand-new crease-free garment / floating clothing / mannequin-like dress" |
| X6 | Strictly forbidden: "symmetrical model stance / runway pose / military attention / exaggerated action" |
| X7 | Strictly forbidden: "heavy makeup covering the base-likeness face until it is unrecognisable" |
| X8 | Strictly forbidden: "ancient style / hanfu / xianxia / wuxia / Republican era / cyberpunk / sci-fi / Western fantasy" and other non-contemporary-urban dress |
| X9 | Strictly forbidden: "revealing / see-through / vulgar / borderline content / violence and gore" |
| X10 | Strictly forbidden: "watermark / text / LOGO / signature / border / traces of AI generation" |
