/**
 * Digital Human — a portrait to select as the source image, and a direction
 * for the delivery. `prompt` is that direction, never the words being said: the
 * voice track is still the user's own.
 *
 * One of the Image and Video catalogs — see ../mediaTemplates.js for the entry
 * shape, how these are loaded, and how to add one. Pexels media throughout.
 */

const CATALOG = [
  {
    pexelsId: 36646353,
    width: 5760,
    height: 8640,
    credit: "Mario Spencer",
    formatLabel: "Poised Statement",
    prompt:
      "Composed and self-assured, chin level, shoulders kept side-on. Hold a steady gaze, speak at an unhurried pace and let a faint smile arrive only at the end.",
  },
  {
    pexelsId: 12311572,
    width: 2432,
    height: 3648,
    credit: "Joseph Eulo",
    formatLabel: "Big Friendly Hello",
    prompt:
      "Wide, open smile throughout with bright eyes and lifted brows. Lean in a touch on the first words, nod along warmly and keep the energy high but relaxed.",
  },
  {
    pexelsId: 8278853,
    width: 3563,
    height: 5344,
    credit: "ANTONI SHKRABA production",
    formatLabel: "Calm Explainer",
    prompt:
      "Gentle, approachable and even-paced. Soft closed-mouth smile between sentences, direct eye contact through the glasses and a small nod on each key point.",
  },
  {
    pexelsId: 18890524,
    width: 3584,
    height: 6000,
    credit: "Alexander Krivitskiy",
    formatLabel: "Playful Confidante",
    prompt:
      "Head tilted, teasing smile, as if sharing something fun with a friend. Light, lilting energy, eyes crinkling, with a soft laugh under the last line.",
  },
  {
    pexelsId: 30133734,
    width: 3221,
    height: 4832,
    credit: "Sydney Sang",
    formatLabel: "Polished Introduction",
    prompt:
      "Formal but friendly. Stand tall, keep the head still and the gaze level, and deliver each sentence crisply with a brief courteous nod to open and close.",
  },
  {
    pexelsId: 38216749,
    width: 2048,
    height: 3072,
    credit: "OTB  frames",
    formatLabel: "Direct Challenge",
    prompt:
      "Firm, level stare and a set jaw. Speak in short, punchy beats with almost no head movement, then give one decisive nod on the closing line.",
  },
  {
    pexelsId: 8423069,
    width: 4000,
    height: 5992,
    credit: "Pavel Danilyuk",
    formatLabel: "Encouraging Guide",
    prompt:
      "Bright and patient, with a gentle smile and raised brows. Slight head tilt when asking a question, slow nods of reassurance, and an inviting pause before each new idea.",
  },
  {
    pexelsId: 27298085,
    width: 2730,
    height: 4096,
    credit: "sagar tiwari",
    formatLabel: "Reassuring Advice",
    prompt:
      "Calm authority with a kind half-smile. Keep eye contact steady, pace measured and clear, and add small confirming nods as though putting a listener at ease.",
  },
  {
    pexelsId: 32224391,
    width: 5758,
    height: 7197,
    credit: "Tochukwu  Ekeh",
    formatLabel: "Measured Authority",
    prompt:
      "Serious, grounded and deliberate. Hold the gaze without blinking away, keep the chin slightly lowered and let each sentence land before starting the next.",
  },
  {
    pexelsId: 13801472,
    width: 3740,
    height: 5610,
    credit: "Mizuno K",
    formatLabel: "Brisk Briefing",
    prompt:
      "Efficient and upbeat, like a quick update on the move. Level eye contact, a polite closed-lip smile, clipped pacing and a small nod to sign off.",
  },
  {
    pexelsId: 36495982,
    width: 4672,
    height: 7008,
    credit: "Daneswara Eka",
    formatLabel: "Gentle Wisdom",
    prompt:
      "Unhurried and tender, with a steady, knowing gaze. Very little movement, a faint softening around the mouth, and generous silences between thoughts.",
  },
  {
    pexelsId: 2101154,
    width: 3853,
    height: 5319,
    credit: "Elle Hughes",
    formatLabel: "Cheerful Service",
    prompt:
      "Sunny and welcoming, smile fixed in place and eyes bright behind the glasses. Light bounce in the head, friendly nods and a quick, lively rhythm.",
  },
  {
    pexelsId: 5430213,
    width: 4447,
    height: 6663,
    credit: "Wundef Media",
    formatLabel: "Caring Check-In",
    prompt:
      "Warm, bright smile with a slight head tilt of concern. Speak softly and clearly, nod gently to reassure, and keep the eyes fixed kindly on the viewer.",
  },
  {
    pexelsId: 16029823,
    width: 3300,
    height: 4950,
    credit: "Matheus Bertelli",
    formatLabel: "Cool Creative",
    prompt:
      "Laid-back and a little guarded, chin tucked behind crossed arms. Slow blink, deadpan delivery, then a slight raise of one brow on the punchline.",
  },
  {
    pexelsId: 17076314,
    width: 4000,
    height: 6000,
    credit: "akash tetwal",
    formatLabel: "Relaxed Update",
    prompt:
      "Easy-going and conversational, as if chatting across a table. Glance up with a mild smile, speak at a comfortable pace and finish with a casual nod.",
  },
  {
    pexelsId: 39087408,
    width: 3072,
    height: 4608,
    credit: "Galib Rahman Nadim",
    formatLabel: "Good-Humoured Chat",
    prompt:
      "Soft, amused smile and twinkling eyes. Loose, friendly head sway while talking, a small chuckle between sentences and plenty of warmth in the gaze.",
  },
  {
    pexelsId: 29852852,
    width: 4109,
    height: 5136,
    credit: "Ifeyinka Adeyemo",
    formatLabel: "Assured Welcome",
    prompt:
      "Poised, with a knowing closed-lip smile and the head angled slightly. Smooth, confident pace, steady eyes, and a subtle lift of the chin on the final word.",
  },
  {
    pexelsId: 9092311,
    width: 4160,
    height: 6240,
    credit: "Gustavo Rangel",
    formatLabel: "Straight Talk",
    prompt:
      "Honest and level, no smile, eyes locked on the lens. Even tempo with brief pauses, a tiny forward lean for emphasis and one firm nod to finish.",
  },
  {
    pexelsId: 12311544,
    width: 3648,
    height: 5472,
    credit: "Joseph Eulo",
    formatLabel: "Serious Notice",
    prompt:
      "Grave and focused, brows slightly drawn. Keep the head still, speak slowly and plainly, and hold eye contact for a beat after the last word.",
  },
  {
    pexelsId: 37409445,
    width: 4160,
    height: 6240,
    credit: "Wolrider YURTSEVEN",
    formatLabel: "Hearty Greeting",
    prompt:
      "Jovial and open, broad smile under the glasses. Lean in as if greeting an old colleague, nod generously and let a laugh colour the opening line.",
  },
  {
    pexelsId: 14319677,
    width: 3648,
    height: 5472,
    credit: "Moises  Caro | Photographer",
    formatLabel: "Homely Story",
    prompt:
      "Soft and neighbourly, with a small contented smile. Speak slowly, eyes resting on the viewer, and tilt the head a little while recalling each detail.",
  },
  {
    pexelsId: 16762656,
    width: 4000,
    height: 6000,
    credit: "SoyBreno Fotografia",
    formatLabel: "Intense Confession",
    prompt:
      "Hushed and intense, half the face in shadow. Barely move, keep the stare unbroken and release each phrase quietly, with a slow blink between lines.",
  },
  {
    pexelsId: 5212321,
    width: 4000,
    height: 6000,
    credit: "Max Fischer",
    formatLabel: "Confident Lesson",
    prompt:
      "Bright, sure of the subject, with a slight smile and lifted chin. Clear, steady pacing, crisp nods on the main points and a brief pause after each one.",
  },
  {
    pexelsId: 29995617,
    width: 3009,
    height: 4514,
    credit: "Tran Nhu Tuan",
    formatLabel: "Friendly Guidance",
    prompt:
      "Open, pleasant and composed. Light smile, head upright, clear diction at a gentle pace and an occasional small nod, as if answering a common question.",
  },
  {
    pexelsId: 5722166,
    width: 4029,
    height: 6043,
    credit: "cottonbro studio",
    formatLabel: "Steady Reassurance",
    prompt:
      "Quiet, serious and trustworthy. Hold a calm, direct gaze, keep the shoulders still and speak in a low, even tone with a soft nod at the close.",
  },
  {
    pexelsId: 12903019,
    width: 4000,
    height: 6000,
    credit: "Mizuno K",
    formatLabel: "Smart Casual Pitch",
    prompt:
      "Self-assured with a hint of a smirk, body turned side-on. Look straight down the lens, keep the pace brisk and punctuate the main point with a short nod.",
  },
  {
    pexelsId: 36263265,
    width: 3680,
    height: 5520,
    credit: "Sóc Năng Động",
    formatLabel: "Kindly Elder",
    prompt:
      "Gentle, patient and a little amused. Soft smile, slow blinks, small nods of agreement and a calm, deliberate pace with room to breathe.",
  },
  {
    pexelsId: 31530222,
    width: 3456,
    height: 5184,
    credit: "Oliver Dohrn",
    formatLabel: "Soft Sincerity",
    prompt:
      "Quiet and earnest, lips barely parted, eyes steady. Slight tilt of the head, hushed tone and long, thoughtful gaps between sentences.",
  },
  {
    pexelsId: 15946547,
    width: 4320,
    height: 6480,
    credit: "Korede  Adenola",
    formatLabel: "Unflinching Honesty",
    prompt:
      "Still, direct and a touch stern. Eyes fixed forward, minimal blinking, each word placed carefully and no smile until the very last beat.",
  },
  {
    pexelsId: 14156508,
    width: 3456,
    height: 5184,
    credit: "Shazard R.",
    formatLabel: "Confident Pitch",
    prompt:
      "Upright and certain, arms folded, with a polite half-smile. Clear, energetic delivery, firm eye contact and a decisive nod on each selling point.",
  },
  {
    pexelsId: 16852335,
    width: 4000,
    height: 5334,
    credit: "Daniel Teran",
    formatLabel: "Grandmotherly Warmth",
    prompt:
      "Tender and cheerful, eyes creased with a broad smile. Lean in slightly, nod slowly and speak with a soft, sing-song lilt and easy pauses.",
  },
  {
    pexelsId: 5496471,
    width: 4000,
    height: 6000,
    credit: "Pavel Danilyuk",
    formatLabel: "Laughing Aside",
    prompt:
      "Loose and delighted, grinning wide with hands on the head. Let laughter spill into the words, rock the head a little and keep the mood light.",
  },
  {
    pexelsId: 32254667,
    width: 4000,
    height: 6000,
    credit: "Daniil Kondrashin",
    formatLabel: "Clear And Kind",
    prompt:
      "Composed and gentle, with a faint smile and attentive eyes. Speak plainly at a moderate pace, keep the head level and nod once to reassure.",
  },
  {
    pexelsId: 24252237,
    width: 1706,
    height: 2560,
    credit: "Adriano Bragi",
    formatLabel: "Tough Kitchen Talk",
    prompt:
      "Gruff, no-nonsense and proud, arms folded tight. Hard stare, short sentences, a slight jut of the chin and one curt nod to end.",
  },
  {
    pexelsId: 30479371,
    width: 8742,
    height: 11656,
    credit: "Augusto Carneiro Junior",
    formatLabel: "Crisp Announcement",
    prompt:
      "Cool, professional and exact. Neutral expression, eyes straight ahead, tidy pacing with clean pauses and almost no movement of the head.",
  },
  {
    pexelsId: 29647355,
    width: 4000,
    height: 6000,
    credit: "ahmed akeri",
    formatLabel: "Low-Key Recommendation",
    prompt:
      "Mellow and sincere, with a slight friendly smile in dim light. Keep the voice soft, the gaze steady and nod lightly when making the suggestion.",
  },
  {
    pexelsId: 32115898,
    width: 4000,
    height: 6000,
    credit: "Daniil Kondrashin",
    formatLabel: "Composed Update",
    prompt:
      "Serene and attentive, lips resting neutral, eyes clear. Smooth, measured speech with a slight tilt of the head and a faint smile to close.",
  },
  {
    pexelsId: 27786109,
    width: 3221,
    height: 4832,
    credit: "Sydney Sang",
    formatLabel: "Sharp Showman",
    prompt:
      "Slick and self-possessed, one brow slightly raised. Brisk, confident tempo, a tiny smirk on the key phrase and a quick tip of the head to finish.",
  },
  {
    pexelsId: 27086922,
    width: 3648,
    height: 5472,
    credit: "Helena Lopes",
    formatLabel: "Evening Invitation",
    prompt:
      "Radiant and sociable, smiling broadly with the head tilted. Warm, lively pacing, bright eyes and a small laugh as the invitation lands.",
  },
  {
    pexelsId: 3534962,
    width: 3456,
    height: 5184,
    credit: "TUBARONES PHOTOGRAPHY",
    formatLabel: "Tender Honesty",
    prompt:
      "Soft, open and unguarded, with a gentle closed-lip smile. Head tipped slightly, quiet pace, eyes never leaving the viewer and a slow blink at the end.",
  },
  {
    pexelsId: 30124371,
    width: 4048,
    height: 5760,
    credit: "Ipaye Gbolahan",
    formatLabel: "Sober Reflection",
    prompt:
      "Solemn and quiet, face completely still. Low, even delivery with heavy pauses, eyes steady and only the slightest dip of the head between thoughts.",
  },
  {
    pexelsId: 33268961,
    width: 3648,
    height: 5472,
    credit: "Junior Diniz PHOTOGRAPHER IN LISBON",
    formatLabel: "Craftsman's Word",
    prompt:
      "Earnest and plain-spoken, brows faintly furrowed. Hold the gaze, keep the shoulders squared and speak slowly, as if explaining something that matters.",
  },
  {
    pexelsId: 9623645,
    width: 4000,
    height: 6000,
    credit: "Lara Jameson",
    formatLabel: "Commanding Address",
    prompt:
      "Stern and imposing, looking down toward the lens. Deep, slow delivery, chin high, with a long pause and a narrow-eyed stare before the final line.",
  },
  {
    pexelsId: 36287434,
    width: 6060,
    height: 6060,
    credit: "Christine Blanchet",
    formatLabel: "Weathered Kindness",
    prompt:
      "Soft-eyed and patient, with a small crinkled smile. Speak slowly and plainly, nod now and then, and let the pauses stretch comfortably.",
  },
  {
    pexelsId: 5212317,
    width: 5504,
    height: 8256,
    credit: "Max Fischer",
    formatLabel: "Enthusiastic Lesson",
    prompt:
      "Animated and delighted, big smile and bright eyes behind the glasses. Lively pace, eager nods and a slight lean forward when the best part arrives.",
  },
  {
    pexelsId: 15962798,
    width: 2852,
    height: 4277,
    credit: "Tran Nhu Tuan",
    formatLabel: "Precise Explanation",
    prompt:
      "Neat, calm and methodical. Level gaze through the glasses, a light professional smile, even pacing and a small nod after each clear point.",
  },
  {
    pexelsId: 31052395,
    width: 2056,
    height: 3084,
    credit: "Huy Nguyễn",
    formatLabel: "Dry Observation",
    prompt:
      "Flat, wry and unbothered. Hold a blank stare through the glasses, keep the head motionless and drop each line with a slight delayed blink.",
  },
  {
    pexelsId: 34678940,
    width: 4000,
    height: 6000,
    credit: "amin naderloei",
    formatLabel: "Over-The-Shoulder Look",
    prompt:
      "Guarded and intriguing, glancing back over the shoulder. Slow, low delivery, eyes held on the lens and a barely-there turn of the head on the last word.",
  },
  {
    pexelsId: 20586318,
    width: 3376,
    height: 6000,
    credit: "Ben Khatry",
    formatLabel: "Sharp Proposal",
    prompt:
      "Focused and businesslike, arms crossed, brow slightly lowered. Tight, confident phrasing, firm eye contact and a short nod to underline the offer.",
  },
  {
    pexelsId: 7582899,
    width: 4000,
    height: 6000,
    credit: "Mikhail Nilov",
    formatLabel: "Upbeat Announcement",
    prompt:
      "Bright, eager and smiling wide. Quick, energetic pacing with lifted brows, frequent nods and a little forward lean as the news is shared.",
  },
  {
    pexelsId: 38197025,
    width: 3648,
    height: 5472,
    credit: "Tony Zohari",
    formatLabel: "Glowing Welcome",
    prompt:
      "Radiant and outgoing, with a full smile and sparkling eyes. Friendly, flowing pace, head tipped slightly and a gracious nod to round things off.",
  },
  {
    pexelsId: 30975992,
    width: 4822,
    height: 7233,
    credit: "Hao Peng",
    formatLabel: "Plain Speaking",
    prompt:
      "Level-headed and mildly amused, lips pressed in a faint smile. Calm, practical pace, steady eyes behind the glasses and a slight nod on each fact.",
  },
  {
    pexelsId: 27086761,
    width: 3648,
    height: 5472,
    credit: "Helena Lopes",
    formatLabel: "Gracious Host",
    prompt:
      "Poised and pleasant, arms folded with an easy smile. Smooth, welcoming tone, relaxed pace, steady gaze and a small tilt of the head as a greeting.",
  },
  {
    pexelsId: 30208144,
    width: 3706,
    height: 4632,
    credit: "DETTY  IMAGES",
    formatLabel: "Elder's Blessing",
    prompt:
      "Dignified and kindly, with a gentle smile and arms crossed. Deep, slow cadence, patient pauses and a grave, approving nod at the end.",
  },
  {
    pexelsId: 31969134,
    width: 4000,
    height: 6000,
    credit: "Sephina Cornwall",
    formatLabel: "Bare Honesty",
    prompt:
      "Plain and vulnerable, seated still with a neutral face. Quiet, slow delivery, eyes fixed forward and hands at rest, with long pauses.",
  },
  {
    pexelsId: 8617725,
    width: 3801,
    height: 5701,
    credit: "Yan Krukau",
    formatLabel: "Curious Puzzle",
    prompt:
      "Inquisitive and playful, hand at the chin and one brow lifted. Thoughtful pace, a slow smile as the answer forms and a tilt of the head to invite a reply.",
  },
  {
    pexelsId: 29852895,
    width: 3575,
    height: 4468,
    credit: "Ifeyinka Adeyemo",
    formatLabel: "Bright Introduction",
    prompt:
      "Polished and beaming, with a wide confident smile. Clear, lively pace, eyes wide and engaged, and a neat nod at the start and the finish.",
  },
  {
    pexelsId: 30692444,
    width: 3934,
    height: 6766,
    credit: "AMORIE SAM",
    formatLabel: "Earnest Thinker",
    prompt:
      "Serious and gentle, brows slightly knit above the glasses. Soft, careful phrasing, unbroken eye contact and a slow nod while weighing each idea.",
  },
  {
    pexelsId: 8727507,
    width: 4000,
    height: 6000,
    credit: "Tima Miroshnichenko",
    formatLabel: "Stark Statement",
    prompt:
      "Stoic and unsmiling, standing square to the lens. Flat, deliberate delivery with no head movement and a long, steady stare between sentences.",
  },
  {
    pexelsId: 5206931,
    width: 4480,
    height: 6720,
    credit: "https://kaboompics.com/",
    formatLabel: "Brisk Reassurance",
    prompt:
      "Capable and kind, with a light smile behind the glasses. Clear, practical pace, direct eye contact and quick, encouraging nods as each step is covered.",
  },
  {
    pexelsId: 34685880,
    width: 3024,
    height: 4032,
    credit: "Pete Miller Portraits",
    formatLabel: "Street Corner Story",
    prompt:
      "Wry and good-natured, eyes narrowed in a knowing smile. Slow, storytelling rhythm, small shakes of the head and a pleased nod at the end.",
  },
  {
    pexelsId: 18935832,
    width: 3456,
    height: 5184,
    credit: "Cláudio Emanuel",
    formatLabel: "Level-Headed Briefing",
    prompt:
      "Even and matter-of-fact, eyes steady behind the glasses. Keep the face neutral, the head square to the lens, and mark each main point with a short, tidy nod.",
  },
  {
    pexelsId: 37148308,
    width: 4000,
    height: 6000,
    credit: "Vincent Santamaria",
    formatLabel: "Winning Handshake",
    prompt:
      "Broad, confident smile and bright eyes, as if greeting a new client. Lively but controlled pace, a slight lean forward and an assured nod on the offer.",
  },
  {
    pexelsId: 36322501,
    width: 3456,
    height: 5184,
    credit: "Bakarii_photography",
    formatLabel: "Radiant Thanks",
    prompt:
      "Overflowing with gratitude, grinning wide with cheeks lifted. Quick, happy rhythm, head dipping slightly with each thank-you and eyes shining at the lens.",
  },
  {
    pexelsId: 12311546,
    width: 3648,
    height: 5472,
    credit: "Joseph Eulo",
    formatLabel: "Approachable Expert",
    prompt:
      "Friendly and assured, with a relaxed smile that stays in place. Smooth, moderate pace, eyes on the viewer and an easy nod whenever a point is settled.",
  },
  {
    pexelsId: 3827677,
    width: 4480,
    height: 6720,
    credit: "Dima Valkov",
    formatLabel: "Furious Rant",
    prompt:
      "Scowling, brows knotted and lips pressed tight between lines. Sharp, clipped bursts of speech, a small shake of the head and a glare that never lets up.",
  },
  {
    pexelsId: 31009214,
    width: 2848,
    height: 4288,
    credit: "Taís Alves",
    formatLabel: "Knowing Remark",
    prompt:
      "Wry and self-possessed, one corner of the mouth lifted. Slow, dry pacing, chin tilted a little and a long, amused look after the final word.",
  },
  {
    pexelsId: 39977028,
    width: 2048,
    height: 2048,
    credit: "Jay Krymis",
    formatLabel: "Rugged Sincerity",
    prompt:
      "Gravelly and heartfelt, head tipped to one side with a soft half-smile. Unhurried phrasing, warm eyes and a slow nod as if giving honest advice.",
  },
  {
    pexelsId: 20596252,
    width: 4000,
    height: 6000,
    credit: "𝓢𝓱𝓪𝓷𝓮 𝓦𝓮𝓼𝓽 ™",
    formatLabel: "Deadpan Verdict",
    prompt:
      "Stony and unimpressed, mouth set in a flat line. Deliver each sentence slowly with no head movement, then raise the brows a fraction at the end.",
  },
  {
    pexelsId: 35390319,
    width: 1927,
    height: 2387,
    credit: "Murry Lee",
    formatLabel: "Serene Welcome",
    prompt:
      "Calm and open, face fully front-on with a faint closed-lip smile. Gentle, even pace, soft blinks and the slightest nod to greet and to finish.",
  },
  {
    pexelsId: 30124372,
    width: 4480,
    height: 6720,
    credit: "Ipaye Gbolahan",
    formatLabel: "Quiet Resolve",
    prompt:
      "Reserved and determined, lips together and gaze unwavering. Speak low and evenly, keep the shoulders still and let a pause sit before the last sentence.",
  },
  {
    pexelsId: 31871011,
    width: 4480,
    height: 6720,
    credit: "Waldir Évora",
    formatLabel: "Sparkling Introduction",
    prompt:
      "Joyful and outgoing, with a wide open smile and lifted cheeks. Bouncy, warm delivery, head tilted slightly and a light laugh between sentences.",
  },
  {
    pexelsId: 39974545,
    width: 4337,
    height: 6506,
    credit: "Sam Agdasi",
    formatLabel: "Seasoned Counsel",
    prompt:
      "Thoughtful and courteous, with a restrained smile. Speak at a considered pace, tilt the head slightly while reasoning and nod once to confirm each conclusion.",
  },
  {
    pexelsId: 10001467,
    width: 4000,
    height: 6000,
    credit: "zaid  mohammed",
    formatLabel: "Piercing Stare",
    prompt:
      "Intense and wary under the hat brim, eyes narrowed. Low, slow delivery with the head angled down and almost no blinking until the line is finished.",
  },
  {
    pexelsId: 7597466,
    width: 4016,
    height: 5729,
    credit: "Alexandru Molnar",
    formatLabel: "Sidelong Charm",
    prompt:
      "Relaxed and a little cheeky, looking across the shoulder with a lopsided smile. Easy, drawling pace and a small lift of the brows on the best line.",
  },
  {
    pexelsId: 27269933,
    width: 4000,
    height: 6000,
    credit: "Adem Erkoç",
    formatLabel: "Grandfatherly Tale",
    prompt:
      "Twinkling and gentle, with a soft smile beneath the beard. Slow, storytelling cadence, eyes creasing warmly and small nods as each memory comes.",
  },
  {
    pexelsId: 35495778,
    width: 4672,
    height: 7008,
    credit: "Grigore Scar",
    formatLabel: "Motherly Concern",
    prompt:
      "Tender but serious, brows slightly raised in worry. Soft, careful phrasing, a small tilt of the head and steady eye contact that never hardens.",
  },
  {
    pexelsId: 29995646,
    width: 2863,
    height: 4294,
    credit: "Tran Nhu Tuan",
    formatLabel: "Corporate Welcome",
    prompt:
      "Bright and professional, with a neat, welcoming smile. Clear and upbeat pacing, upright posture and a polite nod at the opening and the close.",
  },
  {
    pexelsId: 32072049,
    width: 3280,
    height: 4922,
    credit: "_brunovisual",
    formatLabel: "Cool Composure",
    prompt:
      "Calm and unhurried, lips resting closed and gaze direct. Smooth, low-energy delivery with a slight tilt of the head and a hint of a smile at the end.",
  },
  {
    pexelsId: 5876695,
    width: 3648,
    height: 5472,
    credit: "Monstera Production",
    formatLabel: "Delighted Recommendation",
    prompt:
      "Cheerful and chatty, smiling with the whole face. Brisk, friendly tempo, head tilting side to side and an enthusiastic nod on the thing being praised.",
  },
  {
    pexelsId: 13098503,
    width: 3456,
    height: 5184,
    credit: "Joseph Eulo",
    formatLabel: "Infectious Grin",
    prompt:
      "Beaming and playful, teeth showing in a huge smile. Fast, buoyant delivery with the head tipping to one side and a laugh ready to break out.",
  },
  {
    pexelsId: 5254582,
    width: 3264,
    height: 4928,
    credit: "Gansham Ramchandani",
    formatLabel: "Heartfelt Embrace",
    prompt:
      "Affectionate and contented, arms wrapped close and a soft smile. Slow, gentle rhythm with a slight sway of the head and kind, steady eyes.",
  },
  {
    pexelsId: 7826294,
    width: 4160,
    height: 6240,
    credit: "Nataliya Vaitkevich",
    formatLabel: "Graceful Reflection",
    prompt:
      "Soft and elegant, with a serene smile and hand resting near the collar. Leisurely pace, gentle blinks and a slow tilt of the head between thoughts.",
  },
  {
    pexelsId: 7562141,
    width: 3925,
    height: 5887,
    credit: "VAZHNIK",
    formatLabel: "Stern Reminder",
    prompt:
      "Unsmiling and firm, brows low and chin level. Short, plain sentences with a pause after each, eyes fixed on the lens and one slow, serious nod.",
  },
  {
    pexelsId: 12989198,
    width: 3456,
    height: 5184,
    credit: "Sandro  Tavares",
    formatLabel: "Polished Sales Talk",
    prompt:
      "Sunny and persuasive, grinning with easy confidence. Energetic, flowing pace, a slight forward lean on the benefits and quick agreeable nods throughout.",
  },
  {
    pexelsId: 32072046,
    width: 4000,
    height: 6000,
    credit: "_brunovisual",
    formatLabel: "Understated Poise",
    prompt:
      "Quiet and collected, with a level gaze and a barely-there smile. Even, graceful pacing, head held high and a small nod to underline the key phrase.",
  },
  {
    pexelsId: 9254556,
    width: 3828,
    height: 5742,
    credit: "Ron Lach",
    formatLabel: "Solemn Truth",
    prompt:
      "Still and grave, eyes wide and unblinking. Speak softly and slowly with the head perfectly upright, leaving a full breath between each sentence.",
  },
  {
    pexelsId: 8154425,
    width: 4480,
    height: 6720,
    credit: "Cedric Fauntleroy",
    formatLabel: "Gentle Invitation",
    prompt:
      "Kind and smiling softly, eyes warm and attentive. Light, melodic pace, a slight tilt of the head and a small encouraging nod as the invitation is made.",
  },
  {
    pexelsId: 37070441,
    width: 3648,
    height: 5472,
    credit: "Speak Media Uganda",
    formatLabel: "Neighbourly Cheer",
    prompt:
      "Jolly and open, with a broad, easy smile. Relaxed, friendly tempo, a chuckle in the voice and generous nods as though welcoming someone in.",
  },
  {
    pexelsId: 7298872,
    width: 2920,
    height: 5184,
    credit: "Kindel Media",
    formatLabel: "Veteran Insight",
    prompt:
      "Sharp and seasoned, a faint knowing smile under the glasses. Deliberate, confident pace, brows lifting on the key insight and a slow nod to seal it.",
  },
  {
    pexelsId: 12951789,
    width: 2832,
    height: 3933,
    credit: "Marcelo Verfe",
    formatLabel: "Composed Leadership",
    prompt:
      "Assured and steady, with a slight professional smile. Measured pace, shoulders relaxed, eyes level and a calm nod whenever a decision is stated.",
  },
  {
    pexelsId: 6899940,
    width: 3427,
    height: 5141,
    credit: "cottonbro studio",
    formatLabel: "Theatrical Flourish",
    prompt:
      "Grand and dramatic beneath the top hat, chin raised and eyes smouldering. Rich, slow phrasing with a deliberate turn of the head on the final line.",
  },
  {
    pexelsId: 16322150,
    width: 3471,
    height: 4772,
    credit: "Gustt Rabelo",
    formatLabel: "Old-School Charm",
    prompt:
      "Genial and dapper, smiling with twinkling eyes. Smooth, courteous delivery, a slight tilt of the head and a gracious nod as if tipping a hat.",
  },
  {
    pexelsId: 12931653,
    width: 2048,
    height: 3072,
    credit: "Jrfotosgrand Fotografia",
    formatLabel: "Fierce Determination",
    prompt:
      "Head lowered, eyes burning up at the lens, jaw tight. Low, forceful delivery in short beats, with a tiny shake of the head on the word that matters.",
  },
  {
    pexelsId: 9486842,
    width: 2681,
    height: 4016,
    credit: "ROCKETMANN TEAM",
    formatLabel: "Raw Vulnerability",
    prompt:
      "Bare and unguarded, lips slightly parted and eyes searching. Hushed, hesitant pacing with small swallows between phrases and no smile at all.",
  },
  {
    pexelsId: 5945246,
    width: 4480,
    height: 6720,
    credit: "Theo  Decker",
    formatLabel: "Bookish Warmth",
    prompt:
      "Sweet and thoughtful, smiling softly behind the glasses with the head tilted. Gentle, steady pace and small nods, as if explaining a favourite idea.",
  },
  {
    pexelsId: 10223872,
    width: 3648,
    height: 5472,
    credit: "Ron Lach",
    formatLabel: "Jovial Raconteur",
    prompt:
      "Lively and amused, grinning through the white beard. Animated, rolling pace with raised brows, a tilt of the head and a hearty chuckle at the end.",
  },
  {
    pexelsId: 15780889,
    width: 4000,
    height: 6000,
    credit: "Joel Santos",
    formatLabel: "Quiet Confidence",
    prompt:
      "Poised and calm, with a subtle closed-lip smile. Slow, assured delivery, chin slightly lifted and a steady gaze that holds for a beat afterwards.",
  },
  {
    pexelsId: 28842451,
    width: 2524,
    height: 3812,
    credit: "Marina Photos",
    formatLabel: "Icy Monologue",
    prompt:
      "Cold and controlled, expression blank and lips barely moving. Flat, slow delivery with the head motionless and a single slow blink before the last line.",
  },
  {
    pexelsId: 16624065,
    width: 4572,
    height: 6858,
    credit: "Marcus Queiroga Silva",
    formatLabel: "Striking Calm",
    prompt:
      "Cool and precise, eyes direct and brows relaxed. Crisp diction at an even tempo, minimal movement and a slight lowering of the chin to finish.",
  },
];

export default CATALOG;
