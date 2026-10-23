const MODELS = [
  {
    id: "eyewear_adaeze",
    name: "Adaeze",
    desc: "Woman, white tee, hand on chin",
    pexelsId: 32887100,
    description:
      "a young Black woman with long dark hair tucked behind one ear, wearing a white ribbed top, one finger resting at her chin, in a tight frontal face close-up against a light grey studio background in soft even light",
  },
  {
    id: "eyewear_ifeoma",
    name: "Ifeoma",
    desc: "Woman, black blazer, aqua wall",
    pexelsId: 38670858,
    description:
      "a young Black woman with a straight dark shoulder-length bob, wearing a black blazer over a black top with her arms crossed, facing the camera in a waist-up portrait against a plain aqua studio background in bright even light",
  },
  {
    id: "eyewear_greta",
    name: "Greta",
    desc: "Older woman, lilac blazer",
    pexelsId: 5335408,
    description:
      "a smiling older woman in her seventies with short white hair, wearing a lilac blazer over a tan top, facing the camera in a chest-up portrait against a plain white studio background in soft even light",
  },
  {
    id: "eyewear_wren",
    name: "Wren",
    desc: "Woman, green-streak bob",
    pexelsId: 16107549,
    description:
      "a young woman with a wavy brown bob streaked with green, wearing a black blazer over a white shirt, chin slightly raised and one hand at her chest, in a chest-up portrait against a plain warm grey studio background in soft light",
  },
  {
    id: "eyewear_kwame",
    name: "Kwame",
    desc: "Man, big smile, shirt and tie",
    pexelsId: 30496625,
    description:
      "a broadly smiling young Black man with short dark hair, wearing a grey zip jacket over a white shirt and blue tie, head turned slightly in a 3/4 chest-up portrait against a dark studio background with a soft green rim light",
  },
  {
    id: "eyewear_tunde",
    name: "Tunde",
    desc: "Man, burgundy blazer",
    pexelsId: 35659738,
    description:
      "a young Black man with a short fade and a trimmed beard, wearing a burgundy blazer over a white shirt, body turned in a 3/4 pose looking at the camera, in a chest-up portrait against a plain light grey studio background in soft directional light",
  },
  {
    id: "eyewear_rafael",
    name: "Rafael",
    desc: "Man, grey tee, green wall",
    pexelsId: 39335175,
    description:
      "a young man with swept-back dark hair and light stubble, wearing a grey V-neck t-shirt, facing the camera straight on with a serious look, in a chest-up portrait against a plain green wall in soft even light",
  },
  {
    id: "eyewear_samuel",
    name: "Samuel",
    desc: "Man 50s, red shirt, pink wall",
    pexelsId: 15200411,
    description:
      "a middle-aged Black man with short greying hair and a grey goatee, wearing a red button-up shirt, facing the camera with a calm expression, in a chest-up portrait against a plain pale pink studio background in soft even light",
  },
  {
    id: "eyewear_omar",
    name: "Omar",
    desc: "Man, beard, striped shirt",
    pexelsId: 27205832,
    description:
      "a young man with dark styled hair and a full beard, wearing a striped short-sleeve shirt, sitting with his arms folded on the back of a chair and facing the camera, in a waist-up portrait against a plain grey studio background in soft light",
  },
  {
    id: "eyewear_arjun",
    name: "Arjun",
    desc: "Man, moustache, denim jacket",
    pexelsId: 15474962,
    description:
      "a young South Asian man with swept-back dark hair and a thin moustache, wearing a denim jacket over a green checked shirt, facing the camera straight on, in a chest-up portrait against a red corrugated metal shutter in warm natural light",
  },
  {
    id: "eyewear_linh",
    name: "Linh",
    desc: "Woman, short hair, outdoors",
    pexelsId: 5075386,
    description:
      "a young East Asian woman with a short choppy pixie cut, wearing a dark bomber jacket over a black and white striped top, facing the camera with a neutral look, in a tight head-and-shoulders portrait outdoors with a softly blurred street background in natural daylight",
  },
  {
    id: "eyewear_marco",
    name: "Marco",
    desc: "Older man, grey beard, stripes",
    pexelsId: 10223581,
    description:
      "an older man with swept-back grey hair and a full white beard, wearing a navy and white striped Breton top, head turned to the side in profile-to-3/4 view, in a chest-up portrait in a bright home interior with a softly blurred shelf behind him in natural window light",
  },
  {
    id: "eyewear_amara",
    name: "Amara",
    desc: "Woman, braided updo, green",
    pexelsId: 11989029,
    description:
      "a young Black woman with braided hair in a high updo, wearing a black turtleneck, head slightly tilted with a calm gaze, in a head-and-shoulders portrait against a plain bright green studio background in soft even light",
  },
  {
    id: "eyewear_efua",
    name: "Efua",
    desc: "Woman, braided bob, turtleneck",
    pexelsId: 5945246,
    description:
      "a young Black woman with a braided bob and fringe, wearing a white turtleneck under a pale green coat, looking straight at the camera with a soft smile, in a tight head-and-shoulders close-up against a muted red wall in soft natural light",
  },
  {
    id: "eyewear_mei",
    name: "Mei",
    desc: "Woman, long wavy hair",
    pexelsId: 18367881,
    description:
      "a young East Asian woman with long voluminous wavy dark hair, wearing a cream top, facing the camera straight on with a neutral look, in a head-and-shoulders portrait against a softly blurred warm neutral background in soft natural light",
  },
  {
    id: "eyewear_wei",
    name: "Wei",
    desc: "Man, black polo, grey studio",
    pexelsId: 30976000,
    description:
      "a middle-aged East Asian man with short dark hair, wearing a black polo shirt, facing the camera with a slight smile, in a tight head-and-shoulders portrait against a plain light grey studio background in soft even light",
  },
  {
    id: "eyewear_niran",
    name: "Niran",
    desc: "Man, turtleneck, grey blazer",
    pexelsId: 10816007,
    description:
      "a young Southeast Asian man with short dark hair and a thin moustache, wearing a light grey blazer over a white turtleneck, facing the camera in a waist-up portrait against a plain off-white studio background in bright even light",
  },
  {
    id: "eyewear_kenji",
    name: "Kenji",
    desc: "Man, beard, grey tee",
    pexelsId: 7678752,
    description:
      "a young man of East Asian heritage with thick black hair and a short beard, wearing a dark grey t-shirt, facing the camera straight on with a neutral expression, in a head-and-shoulders portrait against a pale textured stone wall in soft overcast light",
  },
  {
    id: "eyewear_vikram",
    name: "Vikram",
    desc: "Man, moustache, white tee",
    pexelsId: 35325042,
    description:
      "a South Asian man in his thirties with a styled dark quiff, a thick moustache and stubble, wearing a white V-neck t-shirt and a thin silver chain, head turned to the side in a 3/4 profile, in a chest-up portrait in a warm softly blurred interior",
  },
  {
    id: "eyewear_leela",
    name: "Leela",
    desc: "Older woman, silver curls",
    pexelsId: 33072907,
    description:
      "a smiling older South Asian woman with curly silver hair and drop earrings, wearing a navy patterned top, leaning toward the camera in a 3/4 pose, in a chest-up portrait outdoors with a pale softly blurred garden background in bright daylight",
  },
  {
    id: "eyewear_aldo",
    name: "Aldo",
    desc: "Older man, beige coat, moody",
    pexelsId: 19224294,
    description:
      "an older man with swept-back grey hair, wearing a beige coat with the collar up, head turned in a 3/4 view looking toward the camera, in a chest-up portrait against a dark moody background in soft directional light",
  },
  {
    id: "eyewear_irena",
    name: "Irena",
    desc: "Woman 50s, auburn hair",
    pexelsId: 8558900,
    description:
      "a smiling woman in her fifties with shoulder-length auburn hair and red lipstick, wearing a black top, facing the camera straight on, in a head-and-shoulders portrait against a plain white wall in soft natural light",
  },
  {
    id: "eyewear_rosa",
    name: "Rosa",
    desc: "Woman 50s, curly hair, smiling",
    pexelsId: 14749730,
    description:
      "a warmly smiling middle-aged woman with voluminous curly dark auburn hair, wearing a black top and a small pendant necklace, facing the camera straight on, in a tight head-and-shoulders portrait against a plain white background in bright even light",
  },
  {
    id: "eyewear_lian",
    name: "Lian",
    desc: "Older woman, plaid shirt",
    pexelsId: 35968859,
    description:
      "a smiling older East Asian woman with short grey-brown hair, wearing a red and navy plaid shirt, facing the camera straight on, in a tight head-and-shoulders portrait against a softly blurred lilac background in soft natural light",
  },
  {
    id: "eyewear_sasha",
    name: "Sasha",
    desc: "Woman, red hair, fluffy coat",
    pexelsId: 11043596,
    description:
      "a young woman with long wavy red hair, wearing a white fluffy coat held up near her chin, head tilted slightly with a soft gaze, in a tight head-and-shoulders portrait outdoors against a pale softly blurred winter background in soft daylight",
  },
  {
    id: "eyewear_jomo",
    name: "Jomo",
    desc: "Young man, afro, dark top",
    pexelsId: 22462846,
    description:
      "a young Black man with a short afro, wearing a dark navy crew-neck top, chin slightly raised and head turned in a 3/4 view, in a head-and-shoulders portrait against a plain warm beige studio background in soft directional light",
  },
  {
    id: "eyewear_dayo",
    name: "Dayo",
    desc: "Man, hand at chin, blue wall",
    pexelsId: 7302739,
    description:
      "a young Black man with short curly hair and a light beard, wearing a navy zip track jacket, one hand resting thoughtfully at his chin, facing the camera in a chest-up portrait against a plain royal blue wall with a palm leaf behind him in soft even light",
  },
  {
    id: "eyewear_hanna",
    name: "Hanna",
    desc: "Woman, blonde bob, close-up",
    pexelsId: 20533914,
    description:
      "a woman in her thirties with a shoulder-length blonde bob, wearing a white turtleneck under a grey coat, head turned slightly in a 3/4 view, in a tight face close-up outdoors against a pale softly blurred city background in soft daylight",
  },
  {
    id: "eyewear_camila",
    name: "Camila",
    desc: "Woman, long dark hair, street",
    pexelsId: 1239288,
    description:
      "a young Latina woman with long dark hair and a soft closed-mouth smile, wearing a grey sweater, facing the camera straight on, in a head-and-shoulders portrait outdoors with a softly blurred city street behind her in bright daylight",
  },
  {
    id: "eyewear_pavel",
    name: "Pavel",
    desc: "Man, white shirt, hand on chin",
    pexelsId: 6346972,
    description:
      "a smiling young man with short brown hair, wearing a white button-up shirt, one hand resting at his chin with his other arm folded, facing the camera in a waist-up portrait against a plain white textured studio background in bright even light",
  },
  {
    id: "eyewear_lukas",
    name: "Lukas",
    desc: "Bald man, stubble, striped tee",
    pexelsId: 6333586,
    description:
      "a bald young man with light stubble and wide eyes, wearing a white and black striped long-sleeve top, facing the camera straight on, in a chest-up portrait against a plain white background in bright even light",
  },
  {
    id: "eyewear_daniel",
    name: "Daniel",
    desc: "Man, tan jacket, hoodie",
    pexelsId: 19140089,
    description:
      "a young man with short dark styled hair and light stubble, wearing a tan canvas jacket over a grey hoodie, facing the camera with a slight smile, in a chest-up portrait against a plain beige wall in soft natural light",
  },
  {
    id: "eyewear_aisha",
    name: "Aisha",
    desc: "Woman, headwrap, print dress",
    pexelsId: 37346786,
    description:
      "a young Black woman wearing a patterned headwrap and a matching dark patterned dress, arms crossed and facing the camera straight on, in a waist-up portrait against a warm mottled tan studio backdrop in soft even light",
  },
];

export default MODELS;
