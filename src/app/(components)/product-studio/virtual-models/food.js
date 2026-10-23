const MODELS = [
  {
    id: "food_malik",
    name: "Malik",
    desc: "Man, coral hoodie, can",
    pexelsId: 8422912,
    description:
      "a smiling young man with short curly dark hair and round black glasses, wearing a coral-pink hoodie, holding the drink in one hand at chest height with a straw in it against a matching coral-pink studio background in soft even light",
  },
  {
    id: "food_omar",
    name: "Omar",
    desc: "Man, coral hoodie, sipping",
    pexelsId: 8422780,
    description:
      "a young man with short curly dark hair and round black glasses, wearing a coral-pink hoodie, sipping the drink through a straw while holding it in both hands at his chin against a coral-pink studio background in soft even light",
  },
  {
    id: "food_clara",
    name: "Clara",
    desc: "Woman, grey tee, juice",
    pexelsId: 6740776,
    description:
      "a smiling young woman with dark brown hair in a messy bun, wearing an oversized charcoal t-shirt, holding the drink bottle up in one hand at shoulder height against a dark slate-grey wall in soft even light",
  },
  {
    id: "food_elise",
    name: "Elise",
    desc: "Woman, grey tee, sipping",
    pexelsId: 6740810,
    description:
      "a young woman with dark brown hair in a bun, wearing an oversized charcoal t-shirt, leaning against a pale concrete wall in side profile and sipping from the drink bottle with eyes closed, holding its cap in her other hand, against a dark grey background in soft light",
  },
  {
    id: "food_inez",
    name: "Inez",
    desc: "Woman, yellow, chocolate",
    pexelsId: 5469114,
    description:
      "a young woman with long dark curly hair, wearing a bright yellow sweatshirt, sitting at a yellow table and holding the chocolate bar up to her mouth in both hands with small pieces scattered on the table, against a plain white studio background in bright even light",
  },
  {
    id: "food_olga",
    name: "Olga",
    desc: "Woman, white dress, bite",
    pexelsId: 8964023,
    description:
      "a smiling young woman with long straight blonde hair, wearing a cream and navy knit polo dress, taking a bite of the chocolate bar held in one hand while leaning on a white ledge, against a plain white studio background in soft daylight",
  },
  {
    id: "food_bianca",
    name: "Bianca",
    desc: "Woman, rust top, candy bar",
    pexelsId: 8710024,
    description:
      "a young woman with long wavy blonde hair, wearing a rust-red velvet camisole, holding the snack bar to her lips in one hand and looking at the camera, close portrait framing against a warm yellow-orange studio background in soft light",
  },
  {
    id: "food_mila",
    name: "Mila",
    desc: "Girl, polka dot, juice box",
    pexelsId: 30394244,
    description:
      "a laughing little girl with blonde hair in pigtails, wearing a polka-dot dress and pink jacket, drinking from the small juice carton held up to her mouth in one hand, standing on a bright balcony with soft blurred trees behind in natural daylight",
  },
  {
    id: "food_ruth",
    name: "Ruth",
    desc: "Older woman, cup & saucer",
    pexelsId: 6625712,
    description:
      "a smiling older woman with shoulder-length blonde hair, wearing a navy knit dress, holding the cup on its saucer in both hands at waist height against a plain light grey studio background in soft even light",
  },
  {
    id: "food_yasmin",
    name: "Yasmin",
    desc: "Woman, grey sweater, cup",
    pexelsId: 9587109,
    description:
      "a young woman with dark curly hair pinned up, wearing a grey sweater over a white collared shirt and jeans, seated and holding the cup on a saucer in both hands at her lap against a plain dark grey studio background in soft light",
  },
  {
    id: "food_mei",
    name: "Mei",
    desc: "Woman, cream knit, bread",
    pexelsId: 8455386,
    description:
      "a young East Asian woman with dark hair tied back, wearing a cream knit sweater, seated at a white table holding the slice of bread up in both hands with a plate in front of her, against a plain off-white wall in soft daylight",
  },
  {
    id: "food_katya",
    name: "Katya",
    desc: "Woman, kitchen, sandwich",
    pexelsId: 7801314,
    description:
      "a young woman with long light brown hair and glasses, wearing a white tee under an open denim shirt, taking a bite of the sandwich held in both hands, standing in a modern kitchen with dark tiles behind her in warm light",
  },
  {
    id: "food_hana",
    name: "Hana",
    desc: "Woman, apron, pasta plate",
    pexelsId: 6223179,
    description:
      "a beaming young East Asian woman with a short dark bob, wearing a white long-sleeve top and orange apron, holding the plate of food out towards the camera in both hands, waist-up framing in front of a brick oven in warm light",
  },
  {
    id: "food_sofia",
    name: "Sofia",
    desc: "Woman, white tee, bowls",
    pexelsId: 7622871,
    description:
      "a smiling young woman with long dark hair, wearing an oversized white t-shirt, holding a bowl in one hand and a plate in the other at waist height in a bright home kitchen with a soft blurred background in daylight",
  },
  {
    id: "food_ama",
    name: "Ama",
    desc: "Woman, denim apron, platter",
    pexelsId: 6004692,
    description:
      "a smiling young Black woman with braided hair pulled back, wearing a yellow top under a denim apron, holding the platter of food in both hands at waist height in a bright white room with a doorway behind in soft daylight",
  },
  {
    id: "food_nadia",
    name: "Nadia",
    desc: "Woman, kitchen, green juice",
    pexelsId: 6707375,
    description:
      "a smiling young woman with short dark curly hair, wearing a white shirt over an orange top, holding the drink up near her face in one hand while leaning on a counter in a bright white kitchen in soft daylight",
  },
  {
    id: "food_jia",
    name: "Jia",
    desc: "Woman, sunglasses, smoothie",
    pexelsId: 6224592,
    description:
      "a young East Asian woman with long dark hair and white cat-eye sunglasses, wearing a navy vest over a white tee, sipping the drink through a straw while holding the cup in one hand, standing in a bright room with pale walls in soft daylight",
  },
  {
    id: "food_carmen",
    name: "Carmen",
    desc: "Woman, white top, drinking",
    pexelsId: 7208606,
    description:
      "a young woman with long voluminous curly brown hair, wearing a white top, drinking from the glass held to her lips in one hand in side profile, standing in a moody dark-teal kitchen with soft window light",
  },
  {
    id: "food_finn",
    name: "Finn",
    desc: "Man, yellow, burger bite",
    pexelsId: 5622661,
    description:
      "a young man with curly ginger hair and round wire glasses, wearing a white t-shirt, taking a big bite of the burger held in both hands against a bright yellow studio background in even light",
  },
  {
    id: "food_jonas",
    name: "Jonas",
    desc: "Man, black tee, burgers",
    pexelsId: 13553940,
    description:
      "a smiling young man with short brown hair and glasses, wearing a black t-shirt and black gloves, holding the food out towards the camera in both hands over a counter, against a dark brick-wall background in warm light",
  },
  {
    id: "food_leo",
    name: "Leo",
    desc: "Boy, eating from bowl",
    pexelsId: 8762990,
    description:
      "a young boy with a light brown bowl haircut, eating a spoonful from the bowl on the table in front of him and looking at the camera, close framing against a soft white background in bright daylight",
  },
  {
    id: "food_anya",
    name: "Anya",
    desc: "Woman, white tee, bottle",
    pexelsId: 8532622,
    description:
      "a smiling young woman with long auburn hair, wearing a white t-shirt, holding the drink bottle down at her side in one hand, three-quarter framing against a plain light grey studio background in soft even light",
  },
  {
    id: "food_ken",
    name: "Ken",
    desc: "Man, yellow suit, bottle",
    pexelsId: 3951407,
    description:
      "a young East Asian man with short bleached hair, wearing a bright yellow hooded coverall, seated on a stool and tipping the drink bottle up to his mouth with one hand against a dusty-pink studio background in even light",
  },
  {
    id: "food_dario",
    name: "Dario",
    desc: "Man, curly, smelling snack",
    pexelsId: 6252881,
    description:
      "a young man with curly tied-back hair and stubble, wearing a grey tee, holding the stack of baked snacks in both hands under his nose with eyes closed in side profile against a plain white background in bright soft light",
  },
  {
    id: "food_henry",
    name: "Henry",
    desc: "Older man, blue hoodie, cup",
    pexelsId: 6625697,
    description:
      "a smiling older man with short grey hair, wearing a blue hoodie, holding the cup up near his face in one hand and the saucer in the other against a plain light grey studio background in soft even light",
  },
  {
    id: "food_lily",
    name: "Lily",
    desc: "Girl, red beret, ice cream",
    pexelsId: 6182385,
    description:
      "a laughing young girl with straight dark hair under a red knit beret, wearing a fluffy lilac jacket, holding the ice cream cone up to her mouth in one hand, close framing outdoors with a soft blurred background in daylight",
  },
  {
    id: "food_andre",
    name: "Andre",
    desc: "Man, denim shirt, pouring",
    pexelsId: 5571746,
    description:
      "a smiling young man with short dark hair, wearing an open light-denim shirt over a white tee, pouring juice from the carton into a glass held in his other hand in a bright white kitchen in soft daylight",
  },
  {
    id: "food_linh",
    name: "Linh",
    desc: "Woman, green, plate & bite",
    pexelsId: 12547160,
    description:
      "a young East Asian woman with long dark hair, wearing a dark green blouse, holding the plate of food in one hand and taking a bite with chopsticks in the other against a bright green studio background in even light",
  },
  {
    id: "food_marco",
    name: "Marco",
    desc: "Man, beige tee, takeaway",
    pexelsId: 6969890,
    description:
      "a young man with short dark hair and stubble, wearing a beige t-shirt, holding the takeaway bowl in both hands and looking down at it beside a paper bag, in a bright room with a sunlit window behind in soft daylight",
  },
  {
    id: "food_eli",
    name: "Eli",
    desc: "Toddler, kitchen, bowls",
    pexelsId: 4867908,
    description:
      "a toddler boy with dark curly hair, wearing a white shirt, sitting at a wooden kitchen table and reaching into a bowl of food with another bowl beside him, in a bright cream kitchen in soft daylight",
  },
];

export default MODELS;
