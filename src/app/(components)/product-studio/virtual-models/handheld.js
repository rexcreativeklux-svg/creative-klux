const MODELS = [
  {
    id: "theo",
    name: "Theo",
    desc: "Man, pink tee, holding mug",
    pexelsId: 8801180,
    description:
      "a Black man with short curly hair and a trimmed goatee, wearing a pale pink t-shirt, holding the product up in one hand at chest height against a dusty-pink studio background in soft even light",
  },
  {
    id: "kofi",
    name: "Kofi",
    desc: "Man, beanie, holding mug",
    pexelsId: 6612228,
    description:
      "a Black man with a full beard and a tan beanie, wearing a grey t-shirt, holding the product in one hand in front of his chest against a soft pink studio background in even light",
  },
  {
    id: "freya",
    name: "Freya",
    desc: "Woman, white tank, both hands",
    pexelsId: 7290612,
    description:
      "a young woman with wavy shoulder-length blonde hair, wearing a white tank top, holding the product in both hands at chest height and looking down at it against a bright red studio background in soft even light",
  },
  {
    id: "lena",
    name: "Lena",
    desc: "Woman, black tee, showing phone",
    pexelsId: 9558582,
    description:
      "a smiling young woman with long light brown hair, wearing an oversized black t-shirt, holding the product up beside her shoulder towards the camera against a light grey studio background in soft even light",
  },
  {
    id: "sam",
    name: "Sam",
    desc: "Man, pink tee, showing phone",
    pexelsId: 9558243,
    description:
      "a young man with curly brown hair, wearing an oversized dusty-pink t-shirt, holding the product up beside his shoulder towards the camera against a light grey studio background in soft even light",
  },
  {
    id: "tia",
    name: "Tia",
    desc: "Woman, carrying boxes",
    pexelsId: 7552575,
    description:
      "a smiling Black woman with voluminous curly hair, wearing a beige t-shirt, carrying the packaged product in both arms in a bright white room in soft daylight",
  },
  {
    id: "hand_sleeve",
    name: "Wren",
    desc: "Hand only, white sleeve",
    pexelsId: 20594350,
    description:
      "a single hand in a white sleeve reaching in from the side, with no face in frame, against a clean white background in soft even light",
  },
  {
    id: "hand_denim",
    name: "Dara",
    desc: "Hand only, denim sleeve",
    pexelsId: 9869069,
    description:
      "a single raised hand in a rolled denim sleeve, with no face in frame, against a clean white background in bright even light",
  },
  {
    id: "handheld_kenji",
    name: "Kenji",
    desc: "Man, white tee, blue backdrop",
    pexelsId: 3951635,
    description:
      "a young East Asian man with short bleached-blond hair, wearing a white t-shirt, holding the product up beside his shoulder with one hand while presenting it with the other open palm and glancing down at it, against a vivid blue studio background in bright even light",
  },
  {
    id: "handheld_jun",
    name: "Jun",
    desc: "Man, blue tee, one hand",
    pexelsId: 8159665,
    description:
      "a young East Asian man with platinum-blond hair and tattooed forearms, wearing a light blue t-shirt, holding the product up in one hand and looking at it, in a bright white-tiled room in soft daylight",
  },
  {
    id: "handheld_maeve",
    name: "Maeve",
    desc: "Woman, white tank, by chin",
    pexelsId: 8129916,
    description:
      "a young woman with red hair pulled back, wearing a white tank top, holding the product in one hand just below her chin and smiling softly at the camera, against a light sky-blue studio background in soft even light",
  },
  {
    id: "handheld_mei",
    name: "Mei",
    desc: "Woman, beige cami, by eye",
    pexelsId: 9774754,
    description:
      "a smiling young East Asian woman with long straight black hair, wearing a beige camisole, holding the product up in front of one eye with her other hand on her hip, against a warm beige studio background in soft even light",
  },
  {
    id: "handheld_clara",
    name: "Clara",
    desc: "Woman, white tee, two hands",
    pexelsId: 7319120,
    description:
      "a young woman with straight dark brown shoulder-length hair, wearing a white t-shirt, holding the product up at shoulder height in one raised hand with her other hand raised on the opposite side, smiling at the camera, in a bright white room with soft daylight",
  },
  {
    id: "handheld_sofia",
    name: "Sofia",
    desc: "Woman, white dress, arm out",
    pexelsId: 7318968,
    description:
      "a smiling young woman with long dark brown hair, wearing a white knit sleeveless dress, holding the product out towards the camera on her open palm with her other hand resting on top, against a grey concrete wall in soft daylight",
  },
  {
    id: "handheld_anya",
    name: "Anya",
    desc: "Woman, pink tank, bottle",
    pexelsId: 4498212,
    description:
      "a smiling young woman with long straight light brown hair, wearing a dusty-pink tank top, holding the product up beside her shoulder in one hand, against a plain off-white wall in soft even light",
  },
  {
    id: "handheld_zuri",
    name: "Zuri",
    desc: "Woman, white hoodie, hat",
    pexelsId: 8217372,
    description:
      "a smiling young woman with long dark curly hair, wearing a white bucket hat, white hoodie and blue jeans, holding the product upright in both hands in front of her chest, against a pale mint-grey studio background in soft even light",
  },
  {
    id: "handheld_amara",
    name: "Amara",
    desc: "Woman, white shirt, dark bg",
    pexelsId: 5055455,
    description:
      "a young Black woman with her natural hair pulled up, wearing an open white linen shirt, holding the product in one hand at her waist and gazing steadily at the camera, against a dark olive-brown studio background in moody soft light",
  },
  {
    id: "handheld_elise",
    name: "Elise",
    desc: "Woman, white cami, close-up",
    pexelsId: 6475985,
    description:
      "a smiling young woman with long straight brown hair, wearing a white camisole, holding the product up close in her fingertips beside her chin while looking off to the side, in a close-up against a warm beige studio background in soft even light",
  },
  {
    id: "handheld_marta",
    name: "Marta",
    desc: "Older woman, patterned top",
    pexelsId: 30473027,
    description:
      "a smiling older woman in her sixties with short wavy light brown hair, wearing a colourful geometric-print blouse, holding the product out towards the camera in one hand, against a plain light grey studio background in soft even light",
  },
  {
    id: "handheld_ginny",
    name: "Ginny",
    desc: "Woman, knit sweater, by face",
    pexelsId: 5705085,
    description:
      "a young woman with long ginger hair, wearing a brown knit turtleneck sweater, holding the product up in both hands beside her face so it half covers it while she smiles at the camera, against a pale grey-white background in soft even light",
  },
  {
    id: "handheld_walter",
    name: "Walter",
    desc: "Older man, white beard",
    pexelsId: 8000622,
    description:
      "an older man with white swept-back hair, a long full white beard and glasses, wearing a dark shirt and waistcoat, holding the product out towards the camera in both hands at chest height, against a plain dark grey studio background in soft even light",
  },
  {
    id: "handheld_rosa",
    name: "Rosa",
    desc: "Hand only, pink backdrop",
    pexelsId: 6476115,
    description:
      "a single bare hand rising from the bottom of the frame holding the product upright, with no face in frame, against a flat soft-pink background in bright even light",
  },
  {
    id: "handheld_sage",
    name: "Sage",
    desc: "Hand only, fingertips, shadow",
    pexelsId: 7161094,
    description:
      "a single bare hand reaching in from the side holding the product up between its fingertips, casting a soft shadow, with no face in frame, against a plain warm light-grey wall in natural directional daylight",
  },
  {
    id: "handheld_juno",
    name: "Juno",
    desc: "Hand only, light grey",
    pexelsId: 10557902,
    description:
      "a single bare arm reaching in from the side gripping the product upright, with no face in frame, against a plain light grey background in soft even light",
  },
  {
    id: "handheld_ivy",
    name: "Ivy",
    desc: "Two hands, white backdrop",
    pexelsId: 7233931,
    description:
      "a pair of hands in a white sleeve reaching in from the lower right and holding the product up from beneath, with no face in frame, against a clean white background in bright even light",
  },
  {
    id: "handheld_remy",
    name: "Remy",
    desc: "Two hands, offering, grey",
    pexelsId: 7358343,
    description:
      "a pair of hands reaching in from the right offering the product forward on open fingers, with no face in frame, against a plain soft grey background in gentle even light",
  },
];

export default MODELS;
