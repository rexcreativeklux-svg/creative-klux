const MODELS = [
  {
    id: "mei",
    name: "Mei",
    desc: "Woman, white crop top, smiling",
    pexelsId: 9774859,
    description:
      "a smiling East Asian woman with long straight dark hair, wearing a white crop top, holding the product up in one hand near her face against a soft pink studio background in bright even light",
  },
  {
    id: "sora",
    name: "Sora",
    desc: "Woman, hands framing face",
    pexelsId: 30797174,
    description:
      "a smiling East Asian woman with dark hair pulled back, glowing clear skin and her fingertips framing her face, wearing a white top, against a clean white studio background in soft even light",
  },
  {
    id: "ama",
    name: "Ama",
    desc: "Woman, glowing skin close-up",
    pexelsId: 18656575,
    description:
      "a Black woman with glowing skin, eyes gently closed and soft glam makeup, bare shoulders and hands resting on her head, in a tight face close-up against a light grey studio background in soft even light",
  },
  {
    id: "zara",
    name: "Zara",
    desc: "Woman, towel wrap, bathrobe",
    pexelsId: 5938522,
    description:
      "a woman with dewy skin, her hair wrapped in a white towel and wearing a white bathrobe, touching her cheek with her fingertips against a muted teal studio background in soft daylight",
  },
  {
    id: "lola",
    name: "Lola",
    desc: "Woman, white robe, serums",
    pexelsId: 9775166,
    description:
      "a smiling woman with long voluminous curly hair, wearing a loose white robe, seated and holding the product in both hands against a soft pink studio background in bright even light",
  },
  {
    id: "efua",
    name: "Efua",
    desc: "Woman, red braids, serum",
    pexelsId: 36537431,
    description:
      "a Black woman with long red twisted braids, wearing a cream knit top, holding the product up beside her face and looking at it against a warm peach studio background in soft directional light",
  },
  {
    id: "rosa",
    name: "Rosa",
    desc: "Older woman, serum",
    pexelsId: 30473033,
    description:
      "a smiling older woman with short wavy blonde hair, wearing a bold patterned top and a gold watch, holding the product up towards the camera against a light grey studio background in soft even light",
  },
  {
    id: "omar",
    name: "Omar",
    desc: "Man, grooming close-up",
    pexelsId: 37711445,
    description:
      "a man with slicked-back dark hair and light stubble, wearing a white tank top, touching his brow in a tight face close-up against a pale grey studio background in soft even light",
  },
  {
    id: "beauty_lin",
    name: "Lin",
    desc: "Woman, cream on cheek, pink",
    pexelsId: 8140902,
    description:
      "a Southeast Asian woman with dark hair in a sleek low ponytail, wearing a lilac tank top, pressing her fingertips to a dab of cream on her cheek, head tilted, in a head-and-shoulders shot against a soft pink studio background in soft even light",
  },
  {
    id: "beauty_anya",
    name: "Anya",
    desc: "Woman, cream dots, peach",
    pexelsId: 3762877,
    description:
      "a young woman with light brown hair pulled back, fresh dewy skin with small dots of cream on her cheeks and soft pink lips, bare shoulders, one hand cupping her cheek in a tight face close-up against a warm peach studio background in soft even light",
  },
  {
    id: "beauty_nadia",
    name: "Nadia",
    desc: "Woman, curly hair, yellow",
    pexelsId: 6706884,
    description:
      "a smiling young woman with voluminous dark curly hair and glowing skin, wearing a white tank top, both hands raised gently to her cheek, in a head-and-shoulders shot against a warm yellow studio background in soft even light",
  },
  {
    id: "beauty_freya",
    name: "Freya",
    desc: "Woman, freckles, robe, jar",
    pexelsId: 8946877,
    description:
      "a smiling young woman with strawberry-blonde hair and freckles, wearing a fluffy white robe, holding the product in one hand while touching under her eye with the other, against a bright mustard-yellow studio background in soft even light",
  },
  {
    id: "beauty_hana",
    name: "Hana",
    desc: "Woman, white robe, bottle",
    pexelsId: 11179590,
    description:
      "an East Asian woman with long straight brown hair and natural bare skin, wearing a white robe off the shoulders, holding the product in both hands at chest height and looking at the camera against a warm beige studio background in soft even light",
  },
  {
    id: "beauty_sofia",
    name: "Sofia",
    desc: "Woman, long hair, cream jar",
    pexelsId: 6954610,
    description:
      "a young woman with long straight dark hair and soft natural makeup, wearing a thin-strapped camisole, holding the product up near her chin and gazing at the camera, against a warm cream studio background in soft even light",
  },
  {
    id: "beauty_mira",
    name: "Mira",
    desc: "Woman, buzz cut, fragrance",
    pexelsId: 8450504,
    description:
      "a young woman with a short buzz cut, pale clear skin and bare shoulders, holding the product up beside her face and looking at the camera, in a tight head-and-shoulders shot against a pale lavender-grey studio background in soft even light",
  },
  {
    id: "beauty_ingrid",
    name: "Ingrid",
    desc: "Older woman, silver hair",
    pexelsId: 5704852,
    description:
      "a smiling older woman with shoulder-length silver-blonde hair, gold earrings and a gold necklace, wearing a white camisole, in a head-and-shoulders shot against a clean white studio background in soft even light",
  },
  {
    id: "beauty_celia",
    name: "Celia",
    desc: "Older woman, grey curls",
    pexelsId: 36810460,
    description:
      "an older Black woman with voluminous grey curly hair and plum lipstick, eyes gently closed, wearing a brown and white patterned top, her hand resting softly against her cheek against a deep blue background in soft warm light",
  },
  {
    id: "beauty_adwoa",
    name: "Adwoa",
    desc: "Woman, laughing, glowing",
    pexelsId: 32707142,
    description:
      "a laughing Black woman with short dark hair pulled back, glowing deep-toned skin and bare shoulders, head tilted with eyes closed, in a face-and-shoulders close-up against a clean white studio background in bright soft light",
  },
  {
    id: "beauty_abena",
    name: "Abena",
    desc: "Woman, braided updo, glam",
    pexelsId: 38292824,
    description:
      "a Black woman with braids in a high updo, radiant glowing skin and soft glam makeup, bare shoulders, one hand resting at her neck and looking at the camera against a warm taupe studio background in soft directional light",
  },
  {
    id: "beauty_layla",
    name: "Layla",
    desc: "Woman, hijab, applying",
    pexelsId: 9219038,
    description:
      "a young woman wearing a beige hijab and a matching beige top, with soft natural makeup, looking down while holding the product against her cheek, in a head-and-shoulders shot against a soft neutral grey background in soft even light",
  },
  {
    id: "beauty_amina",
    name: "Amina",
    desc: "Woman, rust hijab, eyes shut",
    pexelsId: 20108061,
    description:
      "a Black woman wearing a rust-orange hijab and matching top, with gold eyeliner and glowing skin, eyes closed and hands crossed up near her collarbone, in a head-and-shoulders shot against a warm blurred peach background in soft light",
  },
  {
    id: "beauty_vera",
    name: "Vera",
    desc: "Woman, red lipstick, short",
    pexelsId: 5240241,
    description:
      "a woman in her thirties with short tousled auburn hair, defined eye makeup and red lips, wearing a white shirt, holding the product to her lips and looking at the camera against a clean white background in soft even light",
  },
  {
    id: "beauty_ruby",
    name: "Ruby",
    desc: "Woman, red hair, smiling",
    pexelsId: 8128690,
    description:
      "a smiling young woman with red hair pulled back and freckled fair skin, eyes closed, wearing a white tank top, holding the product against her cheek with fingers spread, against a light sky-blue studio background in bright even light",
  },
  {
    id: "beauty_kofi",
    name: "Kofi",
    desc: "Man, applying face cream",
    pexelsId: 7433338,
    description:
      "a smiling Black man with a short beard and close-cropped hair, bare-chested, a streak of cream on his forehead, massaging cream into his cheeks with both hands in a face close-up against a pale grey background in soft daylight",
  },
  {
    id: "beauty_emre",
    name: "Emre",
    desc: "Man, cream dots, mint",
    pexelsId: 31403898,
    description:
      "a man with a dark side-parted undercut and a moustache and goatee, bare-chested with a thin cord necklace, dots of cream across his face, dabbing cream under his eye with one finger, against a pale mint studio background in bright even light",
  },
  {
    id: "beauty_finn",
    name: "Finn",
    desc: "Man, blond, beige tee",
    pexelsId: 4812639,
    description:
      "a young man with short bleached-blond hair and fair skin, wearing a beige T-shirt, touching his cheek with one hand and holding the product in the other at chest height, in a waist-up shot against a warm beige studio background in soft even light",
  },
  {
    id: "beauty_jin",
    name: "Jin",
    desc: "Man, cream jar, bathroom",
    pexelsId: 8160455,
    description:
      "a young East Asian man with bleached platinum hair and cream on his cheek, wearing a light blue T-shirt, holding the product in one hand and scooping cream with the other, in a bright white-tiled bathroom in soft daylight",
  },
  {
    id: "beauty_walt",
    name: "Walt",
    desc: "Older man, beard grooming",
    pexelsId: 7322309,
    description:
      "an older man with swept-back grey hair and a full grey beard, wearing a light grey button-up shirt, grooming his beard with the product held in one hand, in a waist-up shot against a textured grey studio background in soft even light",
  },
  {
    id: "beauty_max",
    name: "Max",
    desc: "Man, shaving foam",
    pexelsId: 7320171,
    description:
      "a bald man with shaving foam covering his jaw and cheeks, wearing a navy tank top, holding the product up to his jaw with his chin raised, in a waist-up shot against a white wall and white brick in soft daylight",
  },
  {
    id: "beauty_marco",
    name: "Marco",
    desc: "Older man, grey stubble",
    pexelsId: 33323689,
    description:
      "a smiling older man with short grey hair, grey stubble and a moustache, wearing a white tank top, in a head-and-shoulders close-up against a dark charcoal background in soft directional light",
  },
];

export default MODELS;
