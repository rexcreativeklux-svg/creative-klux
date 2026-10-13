/**
 * Image to Variations — a photo to select as the source image, the style to
 * push it toward, and a note on what to keep. `prompt` is the optional
 * description.
 *
 * One of the Image and Video catalogs — see ../mediaTemplates.js for the entry
 * shape, how these are loaded, and how to add one. Pexels media throughout.
 */

const CATALOG = [
  {
    pexelsId: 11324518,
    width: 6000,
    height: 4000,
    credit: "Hurrah suhail",
    formatLabel: "Flat Vector",
    values: {
      style: "flat-vector",
    },
    prompt:
      "Hold the pair of chunky white trainers in the same top-down position, laces and soles intact. Redraw them as clean flat shapes with solid fills and swap the red cloth for a single flat coral panel.",
  },
  {
    pexelsId: 4735904,
    width: 3124,
    height: 4686,
    credit: "https://kaboompics.com/",
    formatLabel: "Photorealistic",
    values: {
      style: "photorealistic",
    },
    prompt:
      "Keep the cream pump bottle, the peach tube and the small jar unchanged in shape and colour. Move them from white marble onto pale travertine with soft morning window light and a few water droplets nearby.",
  },
  {
    pexelsId: 4913342,
    width: 1800,
    height: 2700,
    credit: "Maria Orlova",
    formatLabel: "Watercolor",
    values: {
      style: "Watercolor Painting",
    },
    prompt:
      "Leave the cappuccino, its rosetta latte art and the white saucer in the same top-down framing. Repaint the scene in loose watercolour washes, letting the grey marble veins bleed softly into the paper.",
  },
  {
    pexelsId: 34407507,
    width: 4000,
    height: 6000,
    credit: "ramon rangel",
    formatLabel: "Cyberpunk",
    values: {
      style: "Futuristic Cyberpunk",
    },
    prompt:
      "Don't alter the burger itself — glossy bun, lettuce, crispy fillet and plate stay put. Turn the dark room into a neon-lit night diner with magenta and cyan signs glowing out of focus behind it.",
  },
  {
    pexelsId: 10360611,
    width: 3671,
    height: 5506,
    credit: "Anna Belousova",
    formatLabel: "Illustration",
    values: {
      style: "illustration",
    },
    prompt:
      "Keep the tall, wobbly stack of layered cake slices on its white stand, every layer in order. Render it as a hand-drawn editorial illustration with visible linework and a warm peach background.",
  },
  {
    pexelsId: 4740494,
    width: 2670,
    height: 4000,
    credit: "Ksenia Chernaya",
    formatLabel: "Lifestyle",
    values: {
      style: "lifestyle",
    },
    prompt:
      "The tan leather sofa, patterned cushion and open laptop remain exactly where they are. Add late-afternoon sun across the wall, a knitted throw over one arm and a mug on the floor beside the monstera.",
  },
  {
    pexelsId: 9709224,
    width: 3668,
    height: 5502,
    credit: "cottonbro studio",
    formatLabel: "Watercolor",
    values: {
      style: "Watercolor Painting",
    },
    prompt:
      "Preserve the hands lifting the leafy plant, the terracotta pot and the white planter. Turn the photo into a soft watercolour study with green and rust washes and loose, unfinished edges.",
  },
  {
    pexelsId: 9327162,
    width: 2784,
    height: 1856,
    credit: "Denys Mikhalevych",
    formatLabel: "3D Render",
    values: {
      style: "3d-render",
    },
    prompt:
      "Keep the row of structured leather handbags on the white shelf, same order and colours from taupe to red. Rebuild it as a polished 3D render with studio lighting and a smooth concrete wall behind.",
  },
  {
    pexelsId: 13792279,
    width: 3000,
    height: 4500,
    credit: "whos selected",
    formatLabel: "Lifestyle",
    values: {
      style: "lifestyle",
    },
    prompt:
      "The purple over-ear headphones and their coiled cable stay untouched on the laptop. Warm the room up with evening lamp light, keep the guitar blurred behind and add a notebook and pen on the bedspread.",
  },
  {
    pexelsId: 32403277,
    width: 5454,
    height: 3636,
    credit: "Bayram  Yalçın",
    formatLabel: "Vintage Sepia",
    values: {
      style: "Vintage Sepia",
    },
    prompt:
      "Hold on to the rusty orange bicycle leaning under the barred window, frame and wheels unchanged. Tone the whole street in warm sepia with faded edges, light grain and a slightly worn print finish.",
  },
  {
    pexelsId: 35765312,
    width: 3168,
    height: 4752,
    credit: "Foto Panda",
    formatLabel: "Oil Painting",
    values: {
      style: "Oil Painting",
    },
    prompt:
      "Keep the tabby cat's face, narrowed eyes, pink nose and long whiskers precisely as they are. Repaint it as a dark oil portrait with thick brushwork in the fur and a deep umber background.",
  },
  {
    pexelsId: 144608,
    width: 2048,
    height: 1365,
    credit: "Suvan Chowdhury",
    formatLabel: "Sketch",
    values: {
      style: "Sketch Drawing",
    },
    prompt:
      "Retain the fluffy white dog mid-snarl — bared teeth, flattened ears and the angle of the head. Convert it to a graphite pencil sketch with rough hatching for the fur on textured off-white paper.",
  },
  {
    pexelsId: 3137050,
    width: 4000,
    height: 6000,
    credit: "Adrien Olichon",
    formatLabel: "Abstract",
    values: {
      style: "Abstract Art",
    },
    prompt:
      "Keep the faceted blue-and-white facade rising from the bottom corner, each triangular panel in place. Push the rest into abstraction: flatten the sky to a pale wash and echo the triangles as drifting shapes.",
  },
  {
    pexelsId: 3218443,
    width: 4949,
    height: 3434,
    credit: "Francesco Ungaro",
    formatLabel: "Cinematic",
    values: {
      style: "cinematic",
    },
    prompt:
      "Leave the jagged mountain ridge and dark forest line as composed. Grade it like a film still at blue hour — deeper teal shadows, a thin band of mist in the valley and a faint glow along the peaks.",
  },
  {
    pexelsId: 30408335,
    width: 5184,
    height: 2916,
    credit: "Ahimsa -  OM",
    formatLabel: "3D Render",
    values: {
      style: "3d-render",
    },
    prompt:
      "Preserve the two lipsticks, their square black cases and the ridged seashell they stand on. Recreate the set as a smooth 3D render with a terracotta backdrop, softer bounce light and gentle shadow.",
  },
  {
    pexelsId: 37127787,
    width: 5874,
    height: 3916,
    credit: "Thilina Alagiyawanna",
    formatLabel: "Gradient",
    values: {
      style: "gradient",
    },
    prompt:
      "The amber glass perfume bottle and its mirrored reflection stay exactly as shot. Trade the gold crackle bokeh for a smooth amber-to-plum gradient, leaving a soft glow directly behind the bottle.",
  },
  {
    pexelsId: 27544691,
    width: 6421,
    height: 3598,
    credit: "Deepa Nishad",
    formatLabel: "Flat Vector",
    values: {
      style: "flat-vector",
    },
    prompt:
      "Hold the white cosmetic tube and small jar on the ledge in the same spot. Simplify everything to flat vector shapes — a solid blush wall, crisp palm-leaf shadows and no photographic texture at all.",
  },
  {
    pexelsId: 5488052,
    width: 6000,
    height: 3376,
    credit: "Bonus Studio",
    formatLabel: "Cinematic",
    values: {
      style: "cinematic",
    },
    prompt:
      "Don't change the line of skewered burgers on the wooden pass. Darken the kitchen around them, add warm heat-lamp light from above, light steam and a shallow, film-like depth of field.",
  },
  {
    pexelsId: 19651306,
    width: 3744,
    height: 5616,
    credit: "Yulia Oliinychenko",
    formatLabel: "Watercolor",
    values: {
      style: "Watercolor Painting",
    },
    prompt:
      "Keep each cake slice on its white plate where it sits, including the berry-topped layered one in the centre. Paint the table in delicate watercolour with pale blue shadows and soft, wet edges.",
  },
  {
    pexelsId: 4846087,
    width: 1777,
    height: 2683,
    credit: "Rachel Claire",
    formatLabel: "Illustration",
    values: {
      style: "illustration",
    },
    prompt:
      "The deep green velvet sofa and the round brass side table stay in the same arrangement. Redraw the room as a flat-shaded interior illustration with gouache texture and a slightly warmer wall.",
  },
  {
    pexelsId: 9413778,
    width: 4000,
    height: 6000,
    credit: "Sasha  Kim",
    formatLabel: "Flat Vector",
    values: {
      style: "flat-vector",
    },
    prompt:
      "Preserve the gloved hands, terracotta pots and broad green leaves in this overhead layout. Convert it all to flat vector artwork with solid colour blocks, no soil texture and a plain sand background.",
  },
  {
    pexelsId: 4830924,
    width: 3744,
    height: 4758,
    credit: "Diana Light",
    formatLabel: "Collage",
    values: {
      style: "collage",
    },
    prompt:
      "Keep the teal leather handbag with its gold clasp exactly as it is, glasses resting beside it. Rework the surroundings as a paper collage with cut-out leaves, torn magazine strips and a chalk-white base.",
  },
  {
    pexelsId: 6185147,
    width: 3785,
    height: 5669,
    credit: "Bulat Latypov",
    formatLabel: "Cyberpunk",
    values: {
      style: "Futuristic Cyberpunk",
    },
    prompt:
      "Leave the headphones hooked over the microphone stand untouched. Flood the dim studio with electric blue and hot pink light, add glowing equaliser displays on the racks and a faint haze in the air.",
  },
  {
    pexelsId: 19353575,
    width: 2000,
    height: 3555,
    credit: "Alejo Galli",
    formatLabel: "Sketch",
    values: {
      style: "Sketch Drawing",
    },
    prompt:
      "Keep the brown town bicycle propped against the tall brick wall, saddle and basket rack in place. Redraw it as an ink-and-pencil sketch, hatching each course of brick and leaving the pavement white.",
  },
  {
    pexelsId: 6145891,
    width: 3005,
    height: 2661,
    credit: "Samuel Sweet",
    formatLabel: "Cartoon",
    values: {
      style: "Cartoon Style",
    },
    prompt:
      "Hold the tabby cat's stern stare, striped forehead and white whiskers. Turn it into a friendly cartoon character with bigger eyes, clean outlines and a simple yellow-green meadow backdrop.",
  },
  {
    pexelsId: 16019884,
    width: 2848,
    height: 4272,
    credit: "Vitalina Parpalak",
    formatLabel: "Vintage Sepia",
    values: {
      style: "Vintage Sepia",
    },
    prompt:
      "Keep the shaggy dog facing the camera, ears half folded and fur ruffled. Swap the neutral black and white for a warm sepia tone with soft vignetting and the look of an old album print.",
  },
  {
    pexelsId: 8177672,
    width: 3071,
    height: 4606,
    credit: "cottonbro studio",
    formatLabel: "Oil Painting",
    values: {
      style: "Oil Painting",
    },
    prompt:
      "The peach roses and yellow tulips in their slim glass vases stay as arranged. Render them as a classical oil still life with visible brushstrokes and a dark, velvety curtain behind.",
  },
  {
    pexelsId: 31024672,
    width: 3024,
    height: 4032,
    credit: "Sarah  Rücker",
    formatLabel: "Pixel Art",
    values: {
      style: "Pixel Art",
    },
    prompt:
      "Keep the concrete building with its deep grid of square recesses, same corner view. Rebuild it as monochrome pixel art, each recess a neat block, with a dithered grey sky above the roofline.",
  },
  {
    pexelsId: 33999682,
    width: 6336,
    height: 9504,
    credit: "Daniel Torobekov",
    formatLabel: "Oil Painting",
    values: {
      style: "Oil Painting",
    },
    prompt:
      "Preserve the bare brown ridges, the patches of snow and the cloud bank spilling over the summit. Paint the landscape in thick palette-knife oils with ochre slopes and a bright cobalt sky.",
  },
  {
    pexelsId: 27008322,
    width: 2000,
    height: 2000,
    credit: "José Martin Segura Benites",
    formatLabel: "Cyberpunk",
    values: {
      style: "Futuristic Cyberpunk",
    },
    prompt:
      "Keep the crossed legs, glossy black leggings and white platform trainers in the same pose. Replace the grey studio with a rain-slick rooftop at night, lit by purple and cyan signs.",
  },
  {
    pexelsId: 36779953,
    width: 6000,
    height: 4000,
    credit: "Suhas Hanjar",
    formatLabel: "Cinematic",
    values: {
      style: "cinematic",
    },
    prompt:
      "The square glass perfume bottle stays lying on the dark fabric, cap and label untouched. Sharpen the window-blind light into warmer golden bars and let the folds around it fall into deep shadow.",
  },
  {
    pexelsId: 22032446,
    width: 3072,
    height: 4608,
    credit: "Laura Chouette",
    formatLabel: "Minimal",
    values: {
      style: "minimal",
    },
    prompt:
      "Keep the slim black wristwatch with its plain dark dial exactly as shot. Smooth out the creased black fabric to a flat matte surface and centre the watch with plenty of empty space.",
  },
  {
    pexelsId: 7691161,
    width: 3820,
    height: 5730,
    credit: "ROMAN ODINTSOV",
    formatLabel: "3D Render",
    values: {
      style: "3d-render",
    },
    prompt:
      "Preserve the set of white cosmetic containers — pump bottles, jars and the open cream pot. Recreate them as a soft clay-style 3D render on a pale lilac surface with rounded, diffuse shadows.",
  },
  {
    pexelsId: 459489,
    width: 7952,
    height: 5304,
    credit: "Pixabay",
    formatLabel: "Pixel Art",
    values: {
      style: "Pixel Art",
    },
    prompt:
      "Keep the blue cup and saucer and the heart poured into the foam. Redraw the cafe table as cosy pixel art with a chunky wood-grain pattern and a small curl of pixel steam above the cup.",
  },
  {
    pexelsId: 15010285,
    width: 3529,
    height: 5293,
    credit: "Natan Machado Fotografia  Gastronômica",
    formatLabel: "Illustration",
    values: {
      style: "illustration",
    },
    prompt:
      "The front burger stays as built — seeded bun, bacon, red onion and melted cheese on the charred board. Render the spread as a rich menu illustration with inked outlines and painted highlights.",
  },
  {
    pexelsId: 19651067,
    width: 3671,
    height: 5506,
    credit: "Yulia Oliinychenko",
    formatLabel: "Minimal",
    values: {
      style: "minimal",
    },
    prompt:
      "Keep the single slice of layered cream cake on its round white plate. Remove the wrinkled cloth in favour of a seamless warm-white surface with one soft shadow and nothing else in frame.",
  },
  {
    pexelsId: 6580416,
    width: 4912,
    height: 6947,
    credit: "Max Vakhtbovych",
    formatLabel: "3D Render",
    values: {
      style: "3d-render",
    },
    prompt:
      "Hold the room layout — emerald sofa, round tray table with the plant, pale rug. Present it as a clean architectural 3D visualisation with even daylight and slightly lighter wall panelling.",
  },
  {
    pexelsId: 25462388,
    width: 2980,
    height: 2235,
    credit: "성진 김",
    formatLabel: "Watercolor",
    values: {
      style: "Watercolor Painting",
    },
    prompt:
      "Preserve the round white pots and the little succulent crowned with pink blossoms. Paint it as a botanical watercolour, with speckled soil in dry brush and the decking reduced to faint lines.",
  },
  {
    pexelsId: 27046143,
    width: 2000,
    height: 2000,
    credit: "José Martin Segura Benites",
    formatLabel: "Sketch",
    values: {
      style: "Sketch Drawing",
    },
    prompt:
      "Keep the two tote bags side by side, the black one behind the brown, with their embossed croc pattern. Turn them into a fashion pencil sketch with light shading on plain white paper.",
  },
  {
    pexelsId: 5650531,
    width: 5962,
    height: 3975,
    credit: "cottonbro studio",
    formatLabel: "Abstract",
    values: {
      style: "Abstract Art",
    },
    prompt:
      "The black studio headphones hanging on the perforated stand remain recognisable. Abstract everything else: enlarge the punched holes into floating circles in navy, black and a single orange accent.",
  },
  {
    pexelsId: 37858364,
    width: 7008,
    height: 4672,
    credit: "Sebastian Tyszka",
    formatLabel: "Vintage Sepia",
    values: {
      style: "Vintage Sepia",
    },
    prompt:
      "Keep both black bicycles resting against the beige wall beneath the window. Age the photo into a sepia postcard with a paper border, gentle fading and softened contrast on the cobbles.",
  },
  {
    pexelsId: 34887499,
    width: 7728,
    height: 5152,
    credit: "Yusuf Çelik",
    formatLabel: "Sketch",
    values: {
      style: "Sketch Drawing",
    },
    prompt:
      "Hold the cat's wide-eyed look, white chest and patched ears. Redraw the portrait in charcoal with smudged shading for the fur and only a few loose strokes for the ground it rests on.",
  },
  {
    pexelsId: 14393470,
    width: 4000,
    height: 6000,
    credit: "chickenbunny",
    formatLabel: "Oil Painting",
    values: {
      style: "Oil Painting",
    },
    prompt:
      "Keep the shepherd dog lying on the floor, ears pricked and looking up at the camera. Repaint the dim interior in moody oils with warm browns and a soft highlight across the muzzle.",
  },
  {
    pexelsId: 4272625,
    width: 3500,
    height: 2333,
    credit: "cottonbro studio",
    formatLabel: "Minimal",
    values: {
      style: "minimal",
    },
    prompt:
      "Leave the thin wildflower stems in their small glass vases as they are. Clean the grey wall to a perfectly even tone, lose the tabletop clutter and keep a wide band of empty space overhead.",
  },
  {
    pexelsId: 9458996,
    width: 6000,
    height: 4000,
    credit: "Stephen Andrews",
    formatLabel: "Flat Vector",
    values: {
      style: "flat-vector",
    },
    prompt:
      "Keep the white panelled block, its long canopy and glazed entrance in the same perspective. Reduce the building to flat vector planes in three greys with a solid pale blue sky replacing the clouds.",
  },
  {
    pexelsId: 39894311,
    width: 2767,
    height: 1848,
    credit: "Lywin",
    formatLabel: "Pixel Art",
    values: {
      style: "Pixel Art",
    },
    prompt:
      "Preserve the layered ridgelines, the snow-capped peak in the centre and the scattered clouds. Rework the view as a retro game backdrop in pixel art with banded blues and blocky cloud shapes.",
  },
  {
    pexelsId: 11324546,
    width: 4000,
    height: 6000,
    credit: "Hurrah suhail",
    formatLabel: "Abstract",
    values: {
      style: "Abstract Art",
    },
    prompt:
      "The two white trainers with grey panels stay crisp and recognisable, one above the other. Dissolve the red fabric into bold abstract brush shapes in crimson, black and cream.",
  },
  {
    pexelsId: 16378451,
    width: 4170,
    height: 6255,
    credit: "mearlywan",
    formatLabel: "Gradient",
    values: {
      style: "gradient",
    },
    prompt:
      "Keep the yellow pump bottle leaning on the little white column exactly as posed. Swap the draped cream cloth for a soft butter-to-apricot gradient with a faint floor shadow.",
  },
  {
    pexelsId: 4392068,
    width: 3024,
    height: 4032,
    credit: "Gareth Rees",
    formatLabel: "Flat Vector",
    values: {
      style: "flat-vector",
    },
    prompt:
      "Hold the overhead view of the black cup, its handle to the right and the tulip latte art. Flatten it to vector shapes: a solid cream background, one brown circle of coffee and a clean white pattern.",
  },
  {
    pexelsId: 4315148,
    width: 5184,
    height: 3456,
    credit: "Horizon Content",
    formatLabel: "Pixel Art",
    values: {
      style: "Pixel Art",
    },
    prompt:
      "Keep the dark-bun burger at the front and the two skewered ones behind it on the board. Recreate the trio as detailed pixel art with a warm orange backdrop and visible square pixels.",
  },
  {
    pexelsId: 15123700,
    width: 3566,
    height: 2397,
    credit: "Midori",
    formatLabel: "Lifestyle",
    values: {
      style: "lifestyle",
    },
    prompt:
      "The open hand holding the slice of pink crepe cake stays as it is. Replace the hazy skyline with a sunny park picnic — a checked blanket, a flask and friends blurred in the distance.",
  },
  {
    pexelsId: 20418771,
    width: 3024,
    height: 4032,
    credit: "Sandeep Lasar",
    formatLabel: "Illustration",
    values: {
      style: "illustration",
    },
    prompt:
      "Keep the high view down into the grand lounge, the red armchairs and the tall curtained windows. Redraw it as a detailed interior illustration with fine ink lines and flat jewel-toned colour.",
  },
  {
    pexelsId: 6231747,
    width: 3360,
    height: 5040,
    credit: "Gary  Barnes",
    formatLabel: "Cartoon",
    values: {
      style: "Cartoon Style",
    },
    prompt:
      "Keep the gardener's pose, black apron and the small pots of succulents on the table. Redraw her and the scene as a soft cartoon with rounded shapes and a leafy green background.",
  },
  {
    pexelsId: 27174573,
    width: 4000,
    height: 4000,
    credit: "José Martin Segura Benites",
    formatLabel: "Gradient",
    values: {
      style: "gradient",
    },
    prompt:
      "The dark brown tote with cream handles and loose strap stays put on its white plinth. Refine the backdrop into a seamless caramel-to-ivory gradient and keep the warm side light.",
  },
  {
    pexelsId: 15487609,
    width: 3000,
    height: 4000,
    credit: "Sunil Satapathy",
    formatLabel: "Sketch",
    values: {
      style: "Sketch Drawing",
    },
    prompt:
      "Keep the on-ear headphones lying flat, the headband arching above the two cups. Render them as a technical pencil drawing with precise outlines and cross-hatched shadow on grey paper.",
  },
  {
    pexelsId: 18998720,
    width: 4000,
    height: 6000,
    credit: "Alexander Mass",
    formatLabel: "Watercolor",
    values: {
      style: "Watercolor Painting",
    },
    prompt:
      "Preserve the sage-green bicycle and the bunch of bright flowers strapped to its rack. Paint it in watercolour, letting the petals bloom into the paper and fading the wooden wall behind.",
  },
  {
    pexelsId: 39616607,
    width: 4480,
    height: 6720,
    credit: "Helena Jankovičová Kováčová",
    formatLabel: "Illustration",
    values: {
      style: "illustration",
    },
    prompt:
      "Keep the tuxedo cat sitting upright, white bib and paws showing, head turned to one side. Illustrate it in a storybook style with textured brushes and a dusky green garden behind.",
  },
  {
    pexelsId: 32739920,
    width: 2150,
    height: 2866,
    credit: "Benoit Vacherie",
    formatLabel: "Vintage Sepia",
    values: {
      style: "Vintage Sepia",
    },
    prompt:
      "Hold the dog's solemn expression, drooping ears and brindle coat in the same studio pose. Tone the portrait in deep sepia with an oval vignette, like a formal sitting from a century ago.",
  },
  {
    pexelsId: 19795605,
    width: 2848,
    height: 4272,
    credit: "Rahime Gül",
    formatLabel: "Abstract",
    values: {
      style: "Abstract Art",
    },
    prompt:
      "Keep the cut-glass vase and its cluster of red flowers as the clear focal point. Turn the folds of white fabric into sweeping abstract forms in blush, grey and scarlet around it.",
  },
  {
    pexelsId: 4842199,
    width: 1978,
    height: 2805,
    credit: "Dinul hidayat",
    formatLabel: "Abstract",
    values: {
      style: "Abstract Art",
    },
    prompt:
      "The slanted rows of square window recesses keep their rhythm and angle. Recolour the facade as a geometric abstract composition, alternating warm sand, slate blue and off-white blocks.",
  },
  {
    pexelsId: 38972112,
    width: 3024,
    height: 4032,
    credit: "Petra Nesti",
    formatLabel: "Watercolor",
    values: {
      style: "Watercolor Painting",
    },
    prompt:
      "Keep the stony stream running down the green valley and the peaks beneath heavy cloud. Translate the scene into a loose watercolour landscape with wet-on-wet skies and granulated rock.",
  },
  {
    pexelsId: 9281756,
    width: 3024,
    height: 4032,
    credit: "Mihai  Gutsan",
    formatLabel: "Photorealistic",
    values: {
      style: "photorealistic",
    },
    prompt:
      "Keep the white canvas trainers with gum soles tucked inside their open box. Lift the heavy shadows with soft daylight from a window and place the box on a pale wooden floor.",
  },
  {
    pexelsId: 11577068,
    width: 5931,
    height: 3956,
    credit: "Harsh limbachiya",
    formatLabel: "Cyberpunk",
    values: {
      style: "Futuristic Cyberpunk",
    },
    prompt:
      "The blue glass perfume bottle and its dark reflection on the water stay unchanged. Turn the glowing lines behind it into a neon grid of cyan and magenta with light mist drifting across.",
  },
  {
    pexelsId: 27544680,
    width: 6421,
    height: 3598,
    credit: "Deepa Nishad",
    formatLabel: "Minimal",
    values: {
      style: "minimal",
    },
    prompt:
      "Preserve the white tube, pump bottle and low jar lined up on the shelf. Remove the leaf shadows and the sprig, leaving a plain off-white wall and a single soft shadow under each item.",
  },
  {
    pexelsId: 15801079,
    width: 3537,
    height: 3537,
    credit: "Arya Bajra",
    formatLabel: "Cinematic",
    values: {
      style: "cinematic",
    },
    prompt:
      "Keep the hands, the glass of coffee and the etched latte art being drawn with a pick. Grade the bar in warm tungsten and deep shadow with a shallow focus, like a close-up from a film.",
  },
  {
    pexelsId: 33253821,
    width: 4608,
    height: 3072,
    credit: "Busenur Demirkan",
    formatLabel: "Photorealistic",
    values: {
      style: "photorealistic",
    },
    prompt:
      "The burger, the pile of seasoned fries and the two dips stay on the black plate as served. Brighten the dark table with natural daylight from the side and keep every texture sharp.",
  },
  {
    pexelsId: 19526837,
    width: 3744,
    height: 5616,
    credit: "Yulia Oliinychenko",
    formatLabel: "Collage",
    values: {
      style: "collage",
    },
    prompt:
      "Keep the cake slices — red velvet, green sponge and the layered honey cake on its stand. Rebuild the garden table as a playful collage of cut-out photos, paper doilies and painted leaves.",
  },
  {
    pexelsId: 6758245,
    width: 7184,
    height: 4795,
    credit: "Max Vakhtbovych",
    formatLabel: "Lifestyle",
    values: {
      style: "lifestyle",
    },
    prompt:
      "Keep the long grey sofa, its mix of cushions and the botanical mural on the wall. Make the room feel lived in: a book left open on the stone coffee table, a throw and soft evening light.",
  },
  {
    pexelsId: 39694680,
    width: 2080,
    height: 3120,
    credit: "Ivett M",
    formatLabel: "Pixel Art",
    values: {
      style: "Pixel Art",
    },
    prompt:
      "Keep the paddle cactus in its terracotta pot at the centre of the shelf. Convert the plant corner to pixel art with blocky spines, a teal pot behind and a warm, limited colour palette.",
  },
  {
    pexelsId: 22432991,
    width: 3508,
    height: 4961,
    credit: "Muneeb Malhotra",
    formatLabel: "Flat Vector",
    values: {
      style: "flat-vector",
    },
    prompt:
      "Hold the sage-green handbag stacked on the pink one, handles upright and gold fittings visible. Redraw both as flat vector icons with simple shading on a clean white background.",
  },
  {
    pexelsId: 27350775,
    width: 4000,
    height: 3000,
    credit: "Andrey Matveev",
    formatLabel: "3D Render",
    values: {
      style: "3d-render",
    },
    prompt:
      "Keep the white over-ear headphones hanging on the slim black stand. Rebuild the product shot as a crisp 3D render with soft-touch materials, a pale oak wall and a matte grey plinth.",
  },
  {
    pexelsId: 36546545,
    width: 6035,
    height: 8591,
    credit: "Valentina Sergi",
    formatLabel: "Vintage Sepia",
    values: {
      style: "Vintage Sepia",
    },
    prompt:
      "Preserve the long arcade of columns and arches and the bicycles parked along the wall. Age it into a sepia travel photograph with faded highlights, grain and darkened corners.",
  },
  {
    pexelsId: 12713649,
    width: 2592,
    height: 3240,
    credit: "Cristian Loayza",
    formatLabel: "Gradient",
    values: {
      style: "gradient",
    },
    prompt:
      "Keep the cream-coloured cat in profile, alert ears and whiskers sharp against the light. Smooth the red backdrop into a rich crimson-to-rose gradient with no visible texture.",
  },
  {
    pexelsId: 27208837,
    width: 2545,
    height: 3810,
    credit: "Ivan Garfias",
    formatLabel: "Cinematic",
    values: {
      style: "cinematic",
    },
    prompt:
      "The young husky stays half in shadow, one pale eye catching the light. Heighten the drama with a colder blue backlight, fine drifting mist and deeper blacks around the silhouette.",
  },
  {
    pexelsId: 17329723,
    width: 3888,
    height: 5184,
    credit: "Lisa Fotios",
    formatLabel: "Watercolor",
    values: {
      style: "Watercolor Painting",
    },
    prompt:
      "Keep the peach and red roses in the tall glass vase on the windowsill. Paint them as a light watercolour, with the white blinds washed out to pale grey and the teal curtain as one stroke.",
  },
  {
    pexelsId: 4307947,
    width: 5934,
    height: 3331,
    credit: "George Shervashidze",
    formatLabel: "Abstract",
    values: {
      style: "Abstract Art",
    },
    prompt:
      "Keep the diagonal fins of the facade and the sharp split between dark and light halves. Exaggerate it into pure abstraction with hard-edged stripes in ink black, bone white and one cobalt band.",
  },
  {
    pexelsId: 34472460,
    width: 6048,
    height: 4024,
    credit: "Michal Petráš",
    formatLabel: "Oil Painting",
    values: {
      style: "Oil Painting",
    },
    prompt:
      "Preserve the snow-covered range on the horizon and the broad autumn plain in front. Render the view as a traditional oil landscape with golden grass, layered glazes and a soft blue sky.",
  },
  {
    pexelsId: 39354385,
    width: 5443,
    height: 4000,
    credit: "Tuğba",
    formatLabel: "Cartoon",
    values: {
      style: "Cartoon Style",
    },
    prompt:
      "Keep the ginger-and-white cat's face close to the lens, green eyes and pink nose unchanged. Redraw it as a cheerful cartoon with bold outlines, bigger pupils and a simple bright lawn behind.",
  },
  {
    pexelsId: 37114523,
    width: 3712,
    height: 5568,
    credit: "D. M.González",
    formatLabel: "Sketch",
    values: {
      style: "Sketch Drawing",
    },
    prompt:
      "The scruffy terrier stays lying with its head lifted and mouth open, the ball by its paws. Translate the black-and-white photo into a soft pencil sketch with wiry strokes for the coat on cream paper.",
  },
  {
    pexelsId: 20278829,
    width: 3024,
    height: 4032,
    credit: "Jordana Macias",
    formatLabel: "Watercolor",
    values: {
      style: "Watercolor Painting",
    },
    prompt:
      "Keep the bouquet as arranged — pink roses, white daisies and purple blooms in the glass vase. Paint it in airy watercolour, letting the leaves bleed outwards and the dark tabletop fade to a pale wash.",
  },
  {
    pexelsId: 16566144,
    width: 5304,
    height: 6630,
    credit: "Mikita Yo",
    formatLabel: "Cyberpunk",
    values: {
      style: "Futuristic Cyberpunk",
    },
    prompt:
      "Preserve the sweeping curve of the glass tower and its white ribbed band. Shift the scene to night, with cyan and magenta light running along the curve and a hazy glow reflected in every pane.",
  },
  {
    pexelsId: 7036091,
    width: 4032,
    height: 3024,
    credit: "Amanda Cerni",
    formatLabel: "Gradient",
    values: {
      style: "gradient",
    },
    prompt:
      "Keep the dark foreground ridge with its red scrub and the receding layers of hills. Smooth the misty distance and sky into one clean gradient from slate blue to pale peach, with no visible banding.",
  },
  {
    pexelsId: 34159031,
    width: 4000,
    height: 6000,
    credit: "Anhelina Vasylyk",
    formatLabel: "3D Render",
    values: {
      style: "3d-render",
    },
    prompt:
      "The slice of layered cake stays as cut — crumbly sponge, cream and dark cherry filling. Rebuild it as a glossy 3D render on a pale wooden board with soft studio light and a deep teal backdrop.",
  },
  {
    pexelsId: 6480707,
    width: 5301,
    height: 3534,
    credit: "Leah Newhouse",
    formatLabel: "Minimal",
    values: {
      style: "minimal",
    },
    prompt:
      "Keep the tan leather sofa with its pale cushions centred between the two windows. Clear away the basket, lamp and side table, leaving white walls, sheer curtains and a bare rug in even daylight.",
  },
  {
    pexelsId: 6754875,
    width: 6240,
    height: 4161,
    credit: "cottonbro studio",
    formatLabel: "Lifestyle",
    values: {
      style: "lifestyle",
    },
    prompt:
      "Leave the hand setting down the round black mug and the white ceramic jug beside it untouched. Trade the draped studio cloth for a sunlit kitchen table with a linen runner, a loaf of bread and a jar of honey.",
  },
  {
    pexelsId: 33646085,
    width: 4080,
    height: 3072,
    credit: "snazzy  Photography",
    formatLabel: "Vintage Sepia",
    values: {
      style: "Vintage Sepia",
    },
    prompt:
      "Keep the pair of brown leather wingback armchairs facing the camera, stud detailing intact. Tone the lounge in warm sepia with soft grain and faded highlights, like a photograph from an old members' club.",
  },
  {
    pexelsId: 11788439,
    width: 2303,
    height: 4096,
    credit: "chen pincheng",
    formatLabel: "Pixel Art",
    values: {
      style: "Pixel Art",
    },
    prompt:
      "Preserve the two lighthouse towers on the clifftop and the rocky slope dropping to the sea. Rework it as pixel art with blocky boulders, a flat blue sky and small white pixels for the breaking waves.",
  },
  {
    pexelsId: 30403209,
    width: 3534,
    height: 5301,
    credit: "James Collington",
    formatLabel: "Photorealistic",
    values: {
      style: "photorealistic",
    },
    prompt:
      "Keep the pile of croissants exactly as stacked, flaky ridges and golden crust included. Move them onto a marble counter beside a window, with crisp morning light and a dusting of flour around the plate.",
  },
  {
    pexelsId: 15841781,
    width: 3456,
    height: 5184,
    credit: "Feyza  Tuğba",
    formatLabel: "Oil Painting",
    values: {
      style: "Oil Painting",
    },
    prompt:
      "The two carved brown clay teapots stay stacked one on the other, resting on the burlap. Paint them as a traditional oil still life with heavy impasto on the hessian and a dim, smoky brown background.",
  },
  {
    pexelsId: 39495643,
    width: 4926,
    height: 3284,
    credit: "FOX ^.ᆽ.^= ∫",
    formatLabel: "Illustration",
    values: {
      style: "illustration",
    },
    prompt:
      "Keep the ginger tabby turned towards the camera, pale green eyes and striped flank in place. Illustrate it in a children's-book style with soft crayon texture and a blurred mint-green garden behind.",
  },
  {
    pexelsId: 20130214,
    width: 3864,
    height: 3864,
    credit: "Martin Ondřich",
    formatLabel: "Cinematic",
    values: {
      style: "cinematic",
    },
    prompt:
      "Don't change the yellow labrador's face — amber eyes, brown nose and tilted ears. Keep the black background, add a warm key light from one side and a faint cool rim along the neck and shoulder.",
  },
  {
    pexelsId: 39970939,
    width: 2656,
    height: 3984,
    credit: "Uyên Phạm Mẫn Du",
    formatLabel: "Flat Vector",
    values: {
      style: "flat-vector",
    },
    prompt:
      "Keep the tall orange lilies in the ribbed cream vase on the small table by the window. Reduce the scene to flat vector shapes: a mustard wall, a white window frame and solid green stems, no texture.",
  },
  {
    pexelsId: 15631447,
    width: 3024,
    height: 4032,
    credit: "Elle Cover",
    formatLabel: "Abstract",
    values: {
      style: "Abstract Art",
    },
    prompt:
      "Hold the receding lattice of steel ribs and glass panels seen from below. Turn it into an abstract composition, filling alternate panels with teal, chalk white and deep navy until the structure reads as pattern.",
  },
  {
    pexelsId: 675257,
    width: 5472,
    height: 3648,
    credit: "eberhard grossgasteiger",
    formatLabel: "Cinematic",
    values: {
      style: "cinematic",
    },
    prompt:
      "Keep the sunlit rust-coloured ridge in the foreground and the jagged dark range behind it. Grade the view like a wide film frame: richer orange on the lit slope, colder shadows and a thin veil of dusk haze.",
  },
  {
    pexelsId: 19651266,
    width: 3744,
    height: 5616,
    credit: "Yulia Oliinychenko",
    formatLabel: "Collage",
    values: {
      style: "collage",
    },
    prompt:
      "Keep the stacked pancake cake on its dark wooden stand and the meringue cakes beside it. Rebuild the table as a paper collage with cut-out cakes, scalloped paper doilies and blocks of pastel card behind.",
  },
  {
    pexelsId: 37397037,
    width: 3982,
    height: 5974,
    credit: "Christina & Peter",
    formatLabel: "Watercolor",
    values: {
      style: "Watercolor Painting",
    },
    prompt:
      "The blue hydrangea in its carved terracotta pot and the blue watering can stay side by side. Render the patio corner in watercolour with speckled petals, a soft green lawn and the stone wall barely sketched.",
  },
  {
    pexelsId: 29561744,
    width: 3619,
    height: 5428,
    credit: "Selim Karadayı",
    formatLabel: "Cartoon",
    values: {
      style: "Cartoon Style",
    },
    prompt:
      "Keep the old bicycle with its flower basket parked beside the turquoise building. Draw the lane as a cartoon backdrop with wobbly outlines, a glowing wall lamp and flat, saturated colour on the walls.",
  },
  {
    pexelsId: 1652312,
    width: 12234,
    height: 8156,
    credit: "Jane  T D.",
    formatLabel: "Flat Vector",
    values: {
      style: "flat-vector",
    },
    prompt:
      "Preserve the overhead layout of fruit bowls, berries, mango cubes and citrus slices on white. Convert every piece to flat vector artwork with clean circles, solid fills and evenly spaced shapes.",
  },
  {
    pexelsId: 7195580,
    width: 6016,
    height: 4016,
    credit: "Max Vakhtbovych",
    formatLabel: "3D Render",
    values: {
      style: "3d-render",
    },
    prompt:
      "Keep the deep cream armchair in the foreground and the glass-topped coffee table next to it. Present the lounge as a tidy 3D interior visualisation with matte materials, even light and a simplified dining area.",
  },
  {
    pexelsId: 37601416,
    width: 4999,
    height: 7498,
    credit: "Doğan Alpaslan  Demir",
    formatLabel: "Minimal",
    values: {
      style: "minimal",
    },
    prompt:
      "Keep the small red-and-white striped lighthouse standing on its breakwater in the water. Remove the city skyline behind it, flatten the sea to a calm grey-blue and leave two thirds of the frame as empty sky.",
  },
];

export default CATALOG;
