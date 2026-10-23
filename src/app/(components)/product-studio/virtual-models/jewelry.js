const MODELS = [
  {
    id: "clara",
    name: "Clara",
    desc: "Neckline, white shirt",
    pexelsId: 14823622,
    description:
      "a woman shown in a close-up of her neck and collarbone, wearing an open white shirt over a white top, in soft natural light",
  },
  {
    id: "jade",
    name: "Jade",
    desc: "Neckline, black top",
    pexelsId: 16346889,
    description:
      "a woman shown in a close-up of her neck and chest, wearing a black sleeveless mock-neck top, against a dark background in soft directional light",
  },
  {
    id: "priya",
    name: "Priya",
    desc: "Hand close-up, rings",
    pexelsId: 18092913,
    description:
      "a woman shown in a close-up of her hand raised to her collar, wearing a white shirt, against a soft grey background in gentle daylight",
  },
  {
    id: "kaya",
    name: "Kaya",
    desc: "Woman, profile, earrings",
    pexelsId: 8396318,
    description:
      "a woman with dark curly hair tied back, shown in profile with her ear and jawline in focus, wearing a pink top, against a light background in soft daylight",
  },
  {
    id: "ben",
    name: "Ben",
    desc: "Man, wrist close-up",
    pexelsId: 5717686,
    description:
      "a bearded man shown in a close-up of his wrist as he adjusts his cuff, wearing a grey checked button-up shirt, against a bright white background in soft even light",
  },
  {
    id: "tunde",
    name: "Tunde",
    desc: "Man, checking watch",
    pexelsId: 37096859,
    description:
      "a Black man with short hair, wearing a tan ribbed henley, looking down at his wrist with both hands raised in front of him, against a cream curtain backdrop in warm soft light",
  },
  {
    id: "jewelry_elena",
    name: "Elena",
    desc: "Collarbone, bare shoulder",
    pexelsId: 7067815,
    description:
      "a fair-skinned woman shown in a tight close-up of her neck, collarbone and bare shoulder, against a soft grey background in gentle natural light",
  },
  {
    id: "jewelry_amara",
    name: "Amara",
    desc: "Neckline, chin raised",
    pexelsId: 7886233,
    description:
      "a Black woman with short natural hair, chin tilted up to show her neck and collarbone, wearing an open dark cardigan, against a white background in soft even light",
  },
  {
    id: "jewelry_zuri",
    name: "Zuri",
    desc: "Hand to chest, black cami",
    pexelsId: 20635250,
    description:
      "a Black woman with her hair in an updo, hand resting on her collarbone, wearing a black camisole, framed from the chest up against a pale lavender-grey background in soft studio light",
  },
  {
    id: "jewelry_freya",
    name: "Freya",
    desc: "Neckline, white square top",
    pexelsId: 4972987,
    description:
      "a fair, lightly freckled woman shown in a close-up of her neck and collarbone, wearing a white square-neck top, in bright soft daylight",
  },
  {
    id: "jewelry_noor",
    name: "Noor",
    desc: "Hand, dark nails",
    pexelsId: 20363680,
    description:
      "a woman shown in a close-up of her hand reaching toward the camera with dark polished nails, against a blurred olive-green background in soft light",
  },
  {
    id: "jewelry_rosa",
    name: "Rosa",
    desc: "Older hands on marble",
    pexelsId: 4661283,
    description:
      "an older woman shown in a close-up of both hands laid flat with red painted nails, on a white marble surface in soft daylight from above",
  },
  {
    id: "jewelry_omar",
    name: "Omar",
    desc: "Man, hand reaching out",
    pexelsId: 23350374,
    description:
      "a bearded man in a black t-shirt reaching his hand toward the camera, his hand and fingers in sharp focus with his face softly blurred behind, against a light background in soft light",
  },
  {
    id: "jewelry_lily",
    name: "Lily",
    desc: "Wrist, soft light",
    pexelsId: 885218,
    description:
      "a fair-skinned woman shown in a close-up of her inner wrist and forearm, against a soft pale grey background in gentle natural light",
  },
  {
    id: "jewelry_maya",
    name: "Maya",
    desc: "Wrist, beige backdrop",
    pexelsId: 1191536,
    description:
      "a woman with a medium-brown skin tone shown in a close-up of her outstretched wrist and loosely cupped hand, against a blurred beige background in soft warm light",
  },
  {
    id: "jewelry_sofia",
    name: "Sofia",
    desc: "Wrist, white drape",
    pexelsId: 16055236,
    description:
      "a woman shown in a close-up of her extended arm and relaxed wrist, against a draped white fabric backdrop in soft diffused light",
  },
  {
    id: "jewelry_hanna",
    name: "Hanna",
    desc: "Profile, ear, ponytail",
    pexelsId: 4970920,
    description:
      "a young fair-skinned woman with her hair pulled back in a ponytail, shown in profile with her ear and jawline in focus, wearing a black tank top, against a bright white background in soft daylight",
  },
  {
    id: "jewelry_ayo",
    name: "Ayo",
    desc: "Profile, short curls",
    pexelsId: 29853199,
    description:
      "a Black woman with short curly hair, shown in profile from the shoulders up with her ear and neck clearly visible, bare-shouldered, against a plain white background in soft studio light",
  },
  {
    id: "jewelry_ella",
    name: "Ella",
    desc: "Profile, hair in bun",
    pexelsId: 16292410,
    description:
      "a fair-skinned woman with her hair in a high bun, shown in profile from the shoulders up with her ear and neck clearly visible, against a plain off-white background in soft even light",
  },
  {
    id: "jewelry_kofi",
    name: "Kofi",
    desc: "Man, wrist, white tee",
    pexelsId: 9275870,
    description:
      "a Black man shown in a close-up of his wrist and hand hanging at his side, wearing a white t-shirt and black trousers, in soft natural light",
  },
  {
    id: "jewelry_irina",
    name: "Irina",
    desc: "Older woman, watch check",
    pexelsId: 4587416,
    description:
      "a middle-aged woman with short brown hair and glasses, wearing an orange t-shirt, looking down at her raised wrist, against a plain light grey background in soft even light",
  },
  {
    id: "jewelry_jamal",
    name: "Jamal",
    desc: "Man, wrist, green backdrop",
    pexelsId: 6612158,
    description:
      "a Black man shown in a close-up of his raised wrist as he taps it with his other hand, wearing a black long-sleeve top, against a plain sage-green background in soft even light",
  },
  {
    id: "jewelry_sam",
    name: "Sam",
    desc: "Older man, neckline",
    pexelsId: 25724264,
    description:
      "an older Black man with a grey beard, shown from the lips down to the chest as he lifts the chain at his neck with both hands, wearing a black t-shirt, against a warm brown background in soft directional light",
  },
];

export default MODELS;
