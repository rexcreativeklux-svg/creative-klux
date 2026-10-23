const MODELS = [
  {
    id: "sofia",
    name: "Sofia",
    desc: "Woman, blazer, jeans",
    pexelsId: 6211602,
    description:
      "a young woman with long dark hair tied back, wearing a grey blazer over a white shirt with blue jeans and white boots, holding the bag by its handle at her side in a full-body pose against a clean white studio background in soft even light",
  },
  {
    id: "leah",
    name: "Leah",
    desc: "Woman, black dress",
    pexelsId: 21837375,
    description:
      "a woman with long dark hair, wearing a fitted black dress, holding the bag in front of her by its top handle in an editorial pose against a soft peach studio background in even light",
  },
  {
    id: "anya",
    name: "Anya",
    desc: "Woman, orange knit",
    pexelsId: 8801070,
    description:
      "a woman with shoulder-length brown hair, wearing a chunky orange knit sweater, holding the bag in both hands at her waist against a plain grey studio background in soft even light",
  },
  {
    id: "nia",
    name: "Nia",
    desc: "Woman, tote on shoulder",
    pexelsId: 7880062,
    description:
      "a woman with curly blonde-highlighted hair, wearing a sage cardigan top and white wide-leg trousers, carrying the bag on her shoulder in a full-body pose against a clean white studio background in soft daylight",
  },
  {
    id: "iris",
    name: "Iris",
    desc: "Cropped, white trousers",
    pexelsId: 26316180,
    description:
      "a person in white wide-leg trousers and a white top, cropped at the shoulders, holding the bag down at their side by its handles against a warm off-white studio background in soft even light",
  },
  {
    id: "jonah",
    name: "Jonah",
    desc: "Man, backpack, white tee",
    pexelsId: 6238173,
    description:
      "a Black man with shoulder-length locs, wearing a white t-shirt and black jeans, carrying the bag over one shoulder against a bright sky-blue studio background in even light",
  },
  {
    id: "bags_ethan",
    name: "Ethan",
    desc: "Man, backpack, white tee",
    pexelsId: 15529150,
    description:
      "a man in his twenties with swept-back brown hair, wearing a white t-shirt with a dark sweater tied over his shoulders, carrying the bag as a backpack over one shoulder with his hand on the strap, in a waist-up shot against a plain black studio background in soft directional light",
  },
  {
    id: "bags_marco",
    name: "Marco",
    desc: "Man, coat, messenger bag",
    pexelsId: 5950017,
    description:
      "a bearded man in his thirties with dark hair and glasses, wearing a dark overcoat over a denim shirt, carrying the bag as a messenger bag on a strap over his shoulder at his hip, in a three-quarter shot leaning against a red brick wall in warm daylight",
  },
  {
    id: "bags_darnell",
    name: "Darnell",
    desc: "Man, office wear, briefcase",
    pexelsId: 13801804,
    description:
      "a Black man with short hair and a beard, wearing a black shirt and tie with light grey trousers, holding the bag by its handle at his side while walking, in a full-body shot along a bright glass-walled walkway in natural daylight",
  },
  {
    id: "bags_kofi",
    name: "Kofi",
    desc: "Man, tank top, duffel",
    pexelsId: 8554909,
    description:
      "an athletic Black man with short hair, wearing a sage tank top, carrying the bag as a gym duffel on his shoulder with one hand gripping the strap, in a waist-up shot against a clean white tiled wall in bright even light",
  },
  {
    id: "bags_rami",
    name: "Rami",
    desc: "Man, jacket, duffel in hand",
    pexelsId: 9414533,
    description:
      "a man with short dark hair, a beard and sunglasses, wearing a dark denim jacket, white tee, grey jeans and brown boots, holding the bag as a duffel by its handles down at his side, in a full-body shot against a weathered concrete wall in soft daylight",
  },
  {
    id: "bags_minh",
    name: "Minh",
    desc: "Asian man, backpack",
    pexelsId: 18285582,
    description:
      "a young East Asian man with short black hair, wearing a brown checked overshirt, carrying the bag as a backpack on one shoulder with his hand on the strap, in a three-quarter shot on a leafy park path in soft daylight",
  },
  {
    id: "bags_tunde",
    name: "Tunde",
    desc: "Man, tote on shoulder",
    pexelsId: 6786904,
    description:
      "a Black man with short hair and a beard, wearing a black long-sleeve top and black jeans, carrying the bag as a large tote over his shoulder with his hand at the strap, in a three-quarter shot against a plain beige studio background in soft even light",
  },
  {
    id: "bags_malik",
    name: "Malik",
    desc: "Man walking, tote",
    pexelsId: 14967410,
    description:
      "a Black man in a black cap and white sunglasses, wearing a white t-shirt and black trousers, carrying the bag as a tote over his shoulder while walking in profile, in a full-body shot against a clean white panelled wall in bright daylight",
  },
  {
    id: "bags_diego",
    name: "Diego",
    desc: "Man, hat, crossbody",
    pexelsId: 5019232,
    description:
      "a bearded man in a wide-brim hat and glasses, wearing a black leather jacket, black jeans and brown boots, wearing the bag crossbody at his hip, in a full-body shot in front of a cream building doorway in soft daylight",
  },
  {
    id: "bags_lukas",
    name: "Lukas",
    desc: "Man, glasses, backpack",
    pexelsId: 18999222,
    description:
      "a man in his thirties with short light-brown hair, glasses and a moustache, wearing a dark brown corduroy jacket over a white tee, carrying the bag as a backpack over his shoulders, in a waist-up shot on a city street with a softly blurred background in daylight",
  },
  {
    id: "bags_edith",
    name: "Edith",
    desc: "Older woman, tote",
    pexelsId: 5330466,
    description:
      "an older woman with short white hair and round black glasses, wearing a white shirt under a brown tweed waistcoat, carrying the bag on her shoulder with her hand resting on the handle, in a waist-up shot against a clean light grey studio background in soft even light",
  },
  {
    id: "bags_mira",
    name: "Mira",
    desc: "Woman, brown suit",
    pexelsId: 19220719,
    description:
      "a young woman with dark shoulder-length hair, wearing a brown jacket, long brown skirt and black ankle boots, holding the bag up at her chest by its top handle, in a full-body shot against a plain warm grey studio background in soft even light",
  },
  {
    id: "bags_priya",
    name: "Priya",
    desc: "Woman, black, on forearm",
    pexelsId: 21897151,
    description:
      "a South Asian woman with long wavy dark hair, wearing an off-shoulder black top, carrying the bag hooked over her forearm by its handles in front of her body, in a waist-up shot against a soft peach studio background in even light",
  },
  {
    id: "bags_elena",
    name: "Elena",
    desc: "Woman, coat, crossbody",
    pexelsId: 15831353,
    description:
      "a woman with dark hair in a bun, wearing a long black wool coat over a grey turtleneck, wearing the bag crossbody across her chest, in a three-quarter shot against a silver corrugated metal wall in soft daylight",
  },
  {
    id: "bags_amira",
    name: "Amira",
    desc: "Woman, hijab, tote",
    pexelsId: 17849287,
    description:
      "a woman in a black hijab, wearing an olive-green jacket, carrying the bag as a tote on her shoulder in profile, in a three-quarter shot against a soft sage-green fabric backdrop in diffused light",
  },
  {
    id: "bags_ayo",
    name: "Ayo",
    desc: "Woman, hijab, big tote",
    pexelsId: 16117897,
    description:
      "a Black woman in a black hijab, wearing a white shirt, holding the bag as a large tote up in front of her body by its handles, in a waist-up shot against a dark textured studio backdrop in soft directional light",
  },
  {
    id: "bags_greta",
    name: "Greta",
    desc: "Woman, black dress, clutch",
    pexelsId: 35086614,
    description:
      "a woman with a platinum blonde bob, wearing a sleeveless black mini dress and red heels, seated on a tall wooden stool holding the bag as a clutch in both hands on her lap, in a full-body shot against a clean white studio background in soft even light",
  },
  {
    id: "bags_linh",
    name: "Linh",
    desc: "Woman, white ao dai",
    pexelsId: 37105296,
    description:
      "a Vietnamese woman with long dark hair tied back, wearing a white ao dai with white trousers, holding the bag by its top handle in front of her with both hands, in a full-body shot on a tree-lined path in warm soft daylight",
  },
  {
    id: "bags_carla",
    name: "Carla",
    desc: "Woman, denim, crossbody",
    pexelsId: 39054986,
    description:
      "a woman with shoulder-length dark wavy hair and glasses, wearing an oversized denim jacket over a white top with black trousers, wearing the bag crossbody on a thin strap, in a three-quarter shot in a leafy courtyard in soft daylight",
  },
  {
    id: "bags_mei",
    name: "Mei",
    desc: "Woman, tote on shoulder",
    pexelsId: 7578699,
    description:
      "a young East Asian woman with dark hair tied back, wearing a white tank top and light jeans, carrying the bag as a large tote on her shoulder, in a three-quarter shot against a black ribbed wall in soft even light",
  },
];

export default MODELS;
