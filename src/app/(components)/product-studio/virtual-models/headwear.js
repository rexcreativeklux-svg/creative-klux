const MODELS = [
  {
    id: "headwear_elias",
    name: "Elias",
    desc: "Man, black sweater, white bg",
    pexelsId: 8346050,
    description:
      "a pale young man with short light-brown hair, wearing a black crew-neck sweater over a white collared shirt, facing the camera straight-on in a head-and-shoulders portrait against a plain white studio background in soft even light",
  },
  {
    id: "headwear_malik",
    name: "Malik",
    desc: "Man, brown sweater, sunglasses",
    pexelsId: 5592275,
    description:
      "a young Black man with a thin moustache and small round sunglasses, wearing a brown sweatshirt, seated and holding a phone, looking at the camera in a half-body portrait against a soft beige wall in warm natural light",
  },
  {
    id: "headwear_kofi",
    name: "Kofi",
    desc: "Man, linen shirt, beige bg",
    pexelsId: 7623963,
    description:
      "a Black man with a short beard, wearing a loose white linen shirt, his body turned sideways and head turned back over his shoulder towards the camera in a half-body portrait against a warm beige studio background in soft directional light",
  },
  {
    id: "headwear_julien",
    name: "Julien",
    desc: "Man, white shirt, grey bg",
    pexelsId: 8427641,
    description:
      "a young white man with a light moustache, wearing an open-collar white shirt, head tilted slightly down with a calm gaze at the camera in a head-and-shoulders portrait against a plain light grey studio background in soft even light",
  },
  {
    id: "headwear_kenji",
    name: "Kenji",
    desc: "Man, suspenders, seated",
    pexelsId: 20322654,
    description:
      "a young East Asian man with short dark hair, wearing a white short-sleeve shirt with black suspenders and black trousers, seated on a stool with hands clasped looking at the camera in a full-body shot against a plain off-white wall in soft daylight",
  },
  {
    id: "headwear_walter",
    name: "Walter",
    desc: "Older man, sherpa jacket",
    pexelsId: 6626075,
    description:
      "a smiling older white man in his sixties with stubble, wearing a beige sherpa jacket over an olive t-shirt and jeans, seated and leaning forward in a half-body portrait against a lilac purple studio background in bright even light",
  },
  {
    id: "headwear_tunde",
    name: "Tunde",
    desc: "Man, black tee, yellow bg",
    pexelsId: 37977759,
    description:
      "a Black man with a short beard and an earring, wearing a black t-shirt, facing the camera with a serious expression in a head-and-shoulders portrait against a vivid mustard-yellow studio background in bright even light",
  },
  {
    id: "headwear_bjorn",
    name: "Bjorn",
    desc: "Man, full beard, blue light",
    pexelsId: 18905420,
    description:
      "a white man with a full dark beard and curled moustache, wearing a fleece jacket, looking at the camera in a head-and-shoulders portrait against a deep blue background in moody blue-tinted studio light",
  },
  {
    id: "headwear_luka",
    name: "Luka",
    desc: "Man, stubble, black turtleneck",
    pexelsId: 11824931,
    description:
      "a young white man with stubble and a short beard, wearing a black turtleneck, head tilted slightly with an intense gaze at the camera in a tight head-and-shoulders close-up against a dark grey studio background in soft side light",
  },
  {
    id: "headwear_noah",
    name: "Noah",
    desc: "Teen boy, striped sweater",
    pexelsId: 6345407,
    description:
      "a white teenage boy with short brown hair, wearing a white striped sweater, head tilted and resting against his raised hand while looking at the camera in a head-and-shoulders portrait against a pale mint studio background in soft even light",
  },
  {
    id: "headwear_sofia",
    name: "Sofia",
    desc: "Woman, white tee, freckles",
    pexelsId: 9558763,
    description:
      "a young white woman with long straight light-brown hair and freckles, wearing a white t-shirt, smiling softly at the camera straight-on in a head-and-shoulders portrait against a plain light grey studio background in soft even light",
  },
  {
    id: "headwear_imani",
    name: "Imani",
    desc: "Woman, big smile, halter top",
    pexelsId: 13447017,
    description:
      "a Black woman with a short cropped haircut and a wide smile, wearing a black halter top with bare shoulders, head tilted towards the camera in a head-and-shoulders portrait against a pale blue-white studio background in bright soft light",
  },
  {
    id: "headwear_freya",
    name: "Freya",
    desc: "Woman, long curls, teal bg",
    pexelsId: 4846945,
    description:
      "a white woman with long voluminous auburn curls, wearing a teal top, head turned slightly with a calm gaze at the camera in a head-and-shoulders portrait against a dark teal studio background in soft even light",
  },
  {
    id: "headwear_emma",
    name: "Emma",
    desc: "Teen girl, arms crossed, pink",
    pexelsId: 6256250,
    description:
      "a white teenage girl with long straight light-brown hair, wearing a dusty-pink turtleneck sweater and jeans, arms crossed and looking at the camera in a half-body portrait against a soft coral-pink studio background in bright even light",
  },
  {
    id: "headwear_helen",
    name: "Helen",
    desc: "Older woman, white shirt",
    pexelsId: 5934339,
    description:
      "a smiling older white woman in her sixties with short silver hair and pearl earrings, wearing a white collared shirt, resting her cheek on her hand in a head-and-shoulders portrait against a muted blue-grey background in warm sunlight",
  },
  {
    id: "headwear_adaeze",
    name: "Adaeze",
    desc: "Woman, navy turtleneck, dark",
    pexelsId: 30743718,
    description:
      "a young Black woman with hoop earrings, wearing a navy turtleneck, head turned over her shoulder towards the camera with hands crossed in front of her chest in a half-body portrait against a solid black studio background in soft dramatic light",
  },
  {
    id: "headwear_selin",
    name: "Selin",
    desc: "Woman, black top, seaside",
    pexelsId: 20693556,
    description:
      "a young woman with long straight dark-brown hair, wearing a black sleeveless top, looking at the camera with a calm expression in a half-body portrait outdoors in front of soft-focus blue water and a hazy city skyline in cool daylight",
  },
  {
    id: "headwear_yui",
    name: "Yui",
    desc: "Woman, profile, blue shirt",
    pexelsId: 6962046,
    description:
      "a young East Asian woman with long dark hair, wearing a light blue shirt, leaning forward with her face in side profile looking into the distance in a half-body shot outdoors against green leafy bushes with pink flowers in soft daylight",
  },
  {
    id: "headwear_omar",
    name: "Omar",
    desc: "Boy, big grin, red jacket",
    pexelsId: 11082161,
    description:
      "a grinning young boy around seven with a gap-toothed smile, wearing a red puffer jacket, looking straight at the camera in a head-and-shoulders portrait outdoors against a softly blurred brick background in soft daylight",
  },
  {
    id: "headwear_mia",
    name: "Mia",
    desc: "Little girl, glasses, curls",
    pexelsId: 27487168,
    description:
      "a little East Asian girl around four with curly dark hair and round glasses, wearing a striped t-shirt, standing at a wooden table and looking at the camera in a half-body shot in a softly lit room with a blurred chair behind her in warm light",
  },
  {
    id: "headwear_ahmet",
    name: "Ahmet",
    desc: "Older man, scarf, mountains",
    pexelsId: 39317285,
    description:
      "a smiling elderly man in his seventies with a weathered face, wearing a dark jacket and patterned scarf, looking at the camera in a head-and-shoulders portrait outdoors against a softly blurred snowy mountain and vehicle in cool daylight",
  },
  {
    id: "headwear_minh",
    name: "Minh",
    desc: "Man, glasses, beach profile",
    pexelsId: 31489424,
    description:
      "a Southeast Asian man with glasses, wearing a light blue t-shirt, his head in side profile gazing out to sea in a head-and-shoulders shot outdoors against a soft-focus beach and hazy blue water in soft daylight",
  },
  {
    id: "headwear_dario",
    name: "Dario",
    desc: "Man, scarf, astride chair",
    pexelsId: 34830015,
    description:
      "a white man with stubble, wearing a rust-brown jacket with a scarf, sitting backwards on a chair with his hand at his chin looking at the camera in a three-quarter-length shot against a plain light grey studio background in soft even light",
  },
  {
    id: "headwear_ayse",
    name: "Ayse",
    desc: "Older woman, cardigan, smile",
    pexelsId: 40427731,
    description:
      "a smiling elderly woman in her seventies with a lined face, wearing a navy knit vest over a patterned blouse with a soft scarf at her neck, looking at the camera in a head-and-shoulders portrait outdoors against a softly blurred green street in daylight",
  },
  {
    id: "headwear_marco",
    name: "Marco",
    desc: "Man, beard, suit and tie",
    pexelsId: 12861974,
    description:
      "a laughing bearded man with dark hair, wearing a black suit, white shirt and black tie, head turned to the side in a head-and-shoulders portrait against a solid black studio background in dramatic side light",
  },
  {
    id: "headwear_arun",
    name: "Arun",
    desc: "Young man, seated, khaki",
    pexelsId: 13010861,
    description:
      "a smiling young Southeast Asian man with short dark hair, wearing a khaki short-sleeve shirt and jeans, sitting cross-legged on the ground looking at the camera in a full-body shot against a pale netted wall in soft daylight",
  },
];

export default MODELS;
