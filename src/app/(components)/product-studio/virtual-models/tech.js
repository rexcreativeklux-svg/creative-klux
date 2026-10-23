const MODELS = [
  // Headphones
  {
    id: "tech_nia",
    name: "Nia",
    desc: "Woman, headphones, orange",
    pexelsId: 8663192,
    description:
      "a smiling Black woman with short curly hair, wearing a grey crew-neck sweatshirt, wearing over-ear headphones with both hands raised to the ear cups, looking off to the side, waist-up framing against a warm orange studio background in soft even light",
  },
  {
    id: "tech_bianca",
    name: "Bianca",
    desc: "Woman, headphones, red top",
    pexelsId: 3755925,
    description:
      "a young woman with dark hair in a high bun, wearing a red cropped sweatshirt and blue jeans, wearing over-ear headphones with both hands holding the ear cups, three-quarter framing against a bright orange-yellow studio background in soft even light",
  },
  {
    id: "tech_luca",
    name: "Luca",
    desc: "Teen, headphones, phone",
    pexelsId: 6256291,
    description:
      "a teenage boy with short brown hair, wearing an orange hoodie, wearing over-ear headphones with a cable and holding a phone in both hands at waist height, waist-up framing against a soft pink studio background in even light",
  },
  {
    id: "tech_kwame",
    name: "Kwame",
    desc: "Man, headphones, stripes",
    pexelsId: 8206774,
    description:
      "a Black man with short hair and a thin moustache, wearing a cream and black striped t-shirt, wearing over-ear headphones with both hands on the ear cups, looking straight at the camera, close chest-up framing against an orange background with diagonal light stripes",
  },
  {
    id: "tech_mei",
    name: "Mei",
    desc: "Woman, headphones, glasses",
    pexelsId: 28570312,
    description:
      "a smiling young Asian woman with shoulder-length dark hair with bangs and round glasses, wearing a white shirt with a lanyard, wearing white over-ear headphones with both hands raised beside them, chest-up framing against a light grey studio background in soft even light",
  },
  {
    id: "tech_finn",
    name: "Finn",
    desc: "Man, headphones, tablet",
    pexelsId: 5622642,
    description:
      "a young man with curly ginger hair and round glasses, wearing a white t-shirt and black trousers, wearing wired white over-ear headphones while seated and looking down at a tablet held in both hands, waist-up framing against a bright yellow studio background in even light",
  },
  // Earbuds
  {
    id: "tech_sofia",
    name: "Sofia",
    desc: "Woman, earbud, orange vest",
    pexelsId: 3755918,
    description:
      "a young woman with dark hair in a high bun, wearing an orange knit vest over a lilac high-neck top, wearing a white wireless earbud in her ear and turning her head slightly to show it, close chest-up framing against an orange-yellow studio background in soft even light",
  },
  {
    id: "tech_hana",
    name: "Hana",
    desc: "Woman, earbud, blue hoodie",
    pexelsId: 4584637,
    description:
      "a young woman with long brown hair, wearing a blue hoodie with the hood up, eyes closed and touching a wireless earbud in her ear with one hand, three-quarter framing against a pink studio background in soft even light",
  },
  {
    id: "tech_yuna",
    name: "Yuna",
    desc: "Woman, earbuds, cream knit",
    pexelsId: 7984972,
    description:
      "a young Asian woman with straight shoulder-length dark hair, wearing a cream knit sweater and a gold chain necklace, wearing white wireless earbuds and touching one with a fingertip, chest-up framing against a soft blurred peach-pink background in warm light",
  },
  {
    id: "tech_amir",
    name: "Amir",
    desc: "Man, earbud, round glasses",
    pexelsId: 8053511,
    description:
      "a Black man with short hair, a trimmed beard and round dark-framed glasses, wearing a teal button-up shirt, wearing a white wireless earbud in his ear and looking off to the side, close chest-up framing against a warm peach background in soft light",
  },
  // Phones
  {
    id: "tech_ayo",
    name: "Ayo",
    desc: "Woman, headwrap, showing phone",
    pexelsId: 6612222,
    description:
      "a young Black woman with a cream knotted headwrap, wearing a light grey button-up shirt, holding a phone upright in one hand at shoulder height with the screen facing the camera, waist-up framing against a dusty-pink studio background in soft even light",
  },
  {
    id: "tech_tunde",
    name: "Tunde",
    desc: "Man, grey tee, pointing phone",
    pexelsId: 6612233,
    description:
      "a smiling Black man with short hair and a beard, wearing a grey t-shirt, holding a phone up in one hand with the screen facing the camera and pointing at it with the other hand, waist-up framing against a dusty-pink studio background in soft even light",
  },
  {
    id: "tech_elena",
    name: "Elena",
    desc: "Woman, pink blazer, phone",
    pexelsId: 4342353,
    description:
      "a woman in her thirties with long straight auburn hair, wearing a pink blazer over a dark blouse, holding a phone in both hands at waist height and looking at the camera, three-quarter framing against a deep rose-red studio background in soft even light",
  },
  {
    id: "tech_marcus",
    name: "Marcus",
    desc: "Man, phone toward camera",
    pexelsId: 5057047,
    description:
      "a Black man with short hair, wearing a black t-shirt, holding a phone out at arm's length towards the camera so the phone is sharp in the foreground and he is softly blurred behind it, waist-up framing against a mustard-yellow studio background in even light",
  },
  {
    id: "tech_jamal",
    name: "Jamal",
    desc: "Man, vest, showing phone",
    pexelsId: 18073696,
    description:
      "a young Black man with braided hair, wearing a white turtleneck under a grey vest and jeans, holding a phone up in front of his chest with the back facing the camera, three-quarter framing against a dark charcoal studio background in soft directional light",
  },
  {
    id: "tech_layla",
    name: "Layla",
    desc: "Woman, black outfit, phone",
    pexelsId: 17459768,
    description:
      "a young woman with long straight dark hair, wearing a black shirt and blazer, holding a phone up beside her shoulder in one hand with the back facing the camera, waist-up framing against a warm grey studio background in soft light",
  },
  {
    id: "tech_walter",
    name: "Walter",
    desc: "Older man, suit, phone",
    pexelsId: 8899568,
    description:
      "a smiling older man with short white hair and glasses, wearing a dark blazer over a white shirt, seated and looking down at a phone held in both hands, waist-up framing against a plain light grey wall with a green houseplant behind him in soft natural light",
  },
  // Laptops and tablets
  {
    id: "tech_casey",
    name: "Casey",
    desc: "Woman, cap, holding laptop",
    pexelsId: 9558791,
    description:
      "a young woman with hair tucked under a white and black cap, wearing an oversized white t-shirt and jeans, holding an open laptop flat on one hand at chest height with the screen facing the camera, three-quarter framing against a light grey studio background in soft even light",
  },
  {
    id: "tech_jia",
    name: "Jia",
    desc: "Woman, black, open laptop",
    pexelsId: 7578258,
    description:
      "a young East Asian woman with dark hair tied back, wearing an all-black outfit with a cape-style jacket, holding an open laptop at waist height and smiling down at it, three-quarter framing against a plain black studio background in soft directional light",
  },
  {
    id: "tech_zara",
    name: "Zara",
    desc: "Woman, red neck, laptop",
    pexelsId: 8424944,
    description:
      "a young woman with long dark curly hair, wearing a red turtleneck under a black blazer, holding a closed laptop against her chest with both arms and looking off to the side, waist-up framing against a light grey studio background in soft even light",
  },
  {
    id: "tech_omar",
    name: "Omar",
    desc: "Man, shirt, open laptop",
    pexelsId: 8217414,
    description:
      "a man with short dark hair and a beard, wearing a light grey button-up shirt and beige trousers, holding an open laptop on one hand at chest height with the blank screen facing the camera, full-length framing against a light grey studio background in soft even light",
  },
  {
    id: "tech_arjun",
    name: "Arjun",
    desc: "Man, white shirt, tablet",
    pexelsId: 18321494,
    description:
      "a young South Asian man with short dark hair, wearing a white shirt and black trousers, seated on a stool holding a tablet in both hands in front of his chest, looking at the camera, three-quarter framing against a plain black studio background in soft directional light",
  },
  {
    id: "tech_kojo",
    name: "Kojo",
    desc: "Man, beanie, tablet, stool",
    pexelsId: 7533362,
    description:
      "a Black man with glasses and a grey beanie, wearing a tan jacket, dark jeans and white sneakers, seated on a wooden stool looking down at a tablet held in both hands, full-length framing against a terracotta-brown studio background in soft even light",
  },
  {
    id: "tech_victor",
    name: "Victor",
    desc: "Older man, drawing on tablet",
    pexelsId: 8001026,
    description:
      "an older man with white hair, a long white beard and glasses, wearing a black shirt, leaning over a white desk drawing on a tablet with a stylus, with white over-ear headphones on the desk beside him, waist-up framing against a light grey studio background in soft even light",
  },
  {
    id: "tech_helen",
    name: "Helen",
    desc: "Older woman, tablet",
    pexelsId: 6874312,
    description:
      "an older woman with short blonde hair, wearing an olive-brown knit sweater, holding a tablet in one hand and looking down at it thoughtfully with her other hand at her cheek, waist-up framing in a bright white interior with soft natural light",
  },
  // Smartwatches
  {
    id: "tech_ken",
    name: "Ken",
    desc: "Man, cream jacket, watch",
    pexelsId: 36043544,
    description:
      "a young man with short dark wavy hair, wearing a cream jacket over a dark shirt and beige trousers, raising one wrist and looking down to check a smartwatch, three-quarter framing against a light grey-blue studio background in soft even light",
  },
  {
    id: "tech_dante",
    name: "Dante",
    desc: "Man, locs, smartwatch",
    pexelsId: 18490821,
    description:
      "a Black man with long locs and dark sunglasses, wearing a white t-shirt, resting his chin on one hand with a black smartwatch clearly visible on his wrist, chest-up framing against a warm tan studio background in soft light",
  },
  // Cameras
  {
    id: "tech_mateo",
    name: "Mateo",
    desc: "Man, curls, holding camera",
    pexelsId: 7206254,
    description:
      "a young man with curly dark hair and a beard, wearing a black overshirt over a white t-shirt and jeans, holding a camera at waist height in one hand with the other hand in his pocket, three-quarter framing against a plain off-white studio background in soft even light",
  },
  {
    id: "tech_karim",
    name: "Karim",
    desc: "Man, burgundy knit, camera",
    pexelsId: 12303989,
    description:
      "a young man with short dark hair, wearing a burgundy turtleneck sweater and jeans, holding a camera with a long lens at his hip and looking off to the side, three-quarter framing against a plain beige studio background in soft even light",
  },
  {
    id: "tech_rin",
    name: "Rin",
    desc: "Woman, beret, camera to eye",
    pexelsId: 2505031,
    description:
      "a smiling young Asian woman with a dark bob and a brown newsboy cap, wearing a white blouse, holding a small camera up to one eye with both hands, chest-up framing against a bright yellow background in soft even light",
  },
  {
    id: "tech_lucia",
    name: "Lucia",
    desc: "Woman, dots top, camera",
    pexelsId: 11175900,
    description:
      "a playful young woman with long dark hair, wearing a black polka-dot top, holding a camera with a flash up to her face in one hand and sticking her tongue out, waist-up framing against a deep plum-purple studio background in soft even light",
  },
  // Game controllers
  {
    id: "tech_sora",
    name: "Sora",
    desc: "Woman, red controller",
    pexelsId: 9068930,
    description:
      "a smiling young East Asian woman with long dark hair, wearing a white tank top, holding a game controller out in front of her in both hands, waist-up framing against a bright white background with glowing light-panel strips in high-key light",
  },
  {
    id: "tech_eli",
    name: "Eli",
    desc: "Man, white tee, controller",
    pexelsId: 7886994,
    description:
      "a young man with short dark curly hair, wearing a white t-shirt, holding a game controller in both hands at chest height with a playful grin, chest-up framing against a plain dark grey studio background in soft even light",
  },
  {
    id: "tech_jabari",
    name: "Jabari",
    desc: "Man, headset, controller, blue",
    pexelsId: 6827131,
    description:
      "an excited young Black man with short twisted locs, wearing a black sleeveless top, medals around his neck and over-ear headphones, gripping a game controller in both hands at waist height with a big grin, waist-up framing against a light blue studio background in bright even light",
  },
];

export default MODELS;
