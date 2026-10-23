const MODELS = [
  {
    id: "kai",
    name: "Kai",
    desc: "Seated, blue jeans",
    pexelsId: 3214686,
    description:
      "a person seated in a leather chair with legs crossed, wearing blue jeans, framed on the legs and feet over a patterned white tile floor in bright daylight",
  },
  {
    id: "leo",
    name: "Leo",
    desc: "Crossed legs, ripped jeans",
    pexelsId: 8266799,
    description:
      "a person with crossed legs stretched out towards the camera, wearing light ripped jeans, against a coral pink background in soft even light",
  },
  {
    id: "max",
    name: "Max",
    desc: "Mid-jump, grey trousers",
    pexelsId: 2897533,
    description:
      "a person caught mid-jump with feet off the ground, wearing grey checked trousers, framed on the legs and feet against a pale white wall in soft daylight",
  },
  {
    id: "ruby",
    name: "Ruby",
    desc: "Raised legs, heels",
    pexelsId: 26850888,
    description:
      "a woman with bare legs raised and crossed in the air, framed on the legs and feet against a warm tan studio background in soft even light",
  },
  {
    id: "gia",
    name: "Gia",
    desc: "Legs, pink skirt",
    pexelsId: 6371765,
    description:
      "a woman standing on one leg with the other knee bent, wearing a short pink skirt, framed on the legs and feet against a coral studio background in soft even light",
  },
  {
    id: "henry",
    name: "Henry",
    desc: "Dark trousers, street",
    pexelsId: 2057484,
    description:
      "a man in dark tailored trousers, shown in a low close-up of his feet on a sunlit city pavement in warm evening light",
  },
  {
    id: "footwear_theo",
    name: "Theo",
    desc: "Walking, dark jeans",
    pexelsId: 18549540,
    description:
      "a man walking mid-stride across an asphalt road, wearing slim dark jeans and a cream sweatshirt, framed from the waist down in soft overcast daylight",
  },
  {
    id: "footwear_cole",
    name: "Cole",
    desc: "Mid-step, camo trousers",
    pexelsId: 18407470,
    description:
      "a person taking a step with one heel lifted, wearing camouflage cargo trousers, framed on the lower legs and feet on a brick-paved plaza in bright daylight",
  },
  {
    id: "footwear_ivy",
    name: "Ivy",
    desc: "Seated, crossed jeans",
    pexelsId: 37786757,
    description:
      "a person seated outdoors with legs crossed at the knee, wearing wide cropped blue jeans and white socks, framed on the legs and feet over a mossy cobblestone ground in warm soft light",
  },
  {
    id: "footwear_oscar",
    name: "Oscar",
    desc: "Seated, black trousers",
    pexelsId: 4100676,
    description:
      "a man seated in a wooden armchair with one leg crossed over the other, wearing black trousers and patterned socks, framed on the legs and feet over a warm wooden floor in soft indoor light",
  },
  {
    id: "footwear_mia",
    name: "Mia",
    desc: "Leg raised, light jeans",
    pexelsId: 14768505,
    description:
      "a person lying back with one leg stretched up into the frame, wearing light blue jeans, shown against a sage green wall and white painted floorboards in soft daylight",
  },
  {
    id: "footwear_nora",
    name: "Nora",
    desc: "Seated, beige trousers",
    pexelsId: 8133945,
    description:
      "a woman seated on a wooden bench with a laptop, legs crossed at the ankles, wearing beige tailored trousers, framed on the legs and feet over a grey patterned tile floor in soft daylight",
  },
  {
    id: "footwear_sam",
    name: "Sam",
    desc: "Kid seated, denim shorts",
    pexelsId: 28731591,
    description:
      "a small child seated on a wooden log with feet dangling, wearing rolled-up denim shorts, framed on the legs and feet above sandy ground in warm golden light",
  },
  {
    id: "footwear_lily",
    name: "Lily",
    desc: "Kid standing, top-down",
    pexelsId: 2738177,
    description:
      "a child standing with feet together, wearing light blue rolled jeans and white ankle socks, shown from above on a pale tiled floor in bright soft daylight",
  },
  {
    id: "footwear_zoe",
    name: "Zoe",
    desc: "Girl walking, blue jeans",
    pexelsId: 38727863,
    description:
      "a young girl in sunglasses walking towards the camera on a quiet suburban road, wearing blue jeans and a cream long-sleeve top with a small crossbody bag, framed full length in soft overcast daylight",
  },
  {
    id: "footwear_ada",
    name: "Ada",
    desc: "Seated on steps, skirt",
    pexelsId: 18465998,
    description:
      "a woman seated on granite steps with bare ankles crossed, wearing a patterned yellow skirt, framed close on the lower legs and feet in soft daylight",
  },
  {
    id: "footwear_mara",
    name: "Mara",
    desc: "Seated, mustard skirt",
    pexelsId: 3214308,
    description:
      "a woman seated on old stone steps with feet side by side, wearing a long mustard yellow knit skirt, framed on the lower legs and feet in soft outdoor light",
  },
  {
    id: "footwear_elsa",
    name: "Elsa",
    desc: "Standing, white dress",
    pexelsId: 7777179,
    description:
      "a woman standing with feet slightly apart and bare legs, wearing a knee-length white dress, framed from the knees down on a light wooden floor in front of dark wood cabinets in soft indoor light",
  },
  {
    id: "footwear_jay",
    name: "Jay",
    desc: "Mid-step, white studio",
    pexelsId: 11559288,
    description:
      "a person stepping forward with the foot angled on its toe, wearing slim black trousers, framed tight on one lower leg and foot against a pure white studio background",
  },
  {
    id: "footwear_lena",
    name: "Lena",
    desc: "Standing, pleated skirt",
    pexelsId: 5478513,
    description:
      "a woman standing with feet apart, wearing a long dark pleated metallic skirt, shown from above on sunlit cobblestones with crisp railing shadows",
  },
  {
    id: "footwear_clara",
    name: "Clara",
    desc: "Walking away, bare legs",
    pexelsId: 36212466,
    description:
      "a woman walking away from the camera with bare legs, wearing a dark knee-length coat and carrying a handbag, framed on the legs and feet on a grey brick pavement in cool daylight",
  },
  {
    id: "footwear_remy",
    name: "Remy",
    desc: "Standing, orange suit",
    pexelsId: 10341113,
    description:
      "a person standing with feet together, wearing loose orange suit trousers, framed from the waist down on a herringbone wooden floor against a white wall in soft daylight",
  },
  {
    id: "footwear_noah",
    name: "Noah",
    desc: "Mid-step, wide trousers",
    pexelsId: 39202942,
    description:
      "a person caught mid-stride with one foot lifted, wearing wide-leg dark brown trousers, framed on the legs and feet against a plain cream studio background in soft even light",
  },
  {
    id: "footwear_hugo",
    name: "Hugo",
    desc: "Seated, crossed legs",
    pexelsId: 10121669,
    description:
      "a person seated on a sofa with legs crossed, wearing beige tailored trousers, framed on the legs and feet beside a stool stacked with books over a cream rug in bright soft daylight",
  },
];

export default MODELS;
