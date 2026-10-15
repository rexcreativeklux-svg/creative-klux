/**
 * wavenet-voice-labels.js
 * ─────────────────────────────────────────────────────────────────────────────
 * The HAND-MAINTAINED half of the hosted voice picker: a display name for every
 * Google Wavenet voice, and a display name for every locale.
 *
 * The other half — which voices exist and where each one's sample lives — is
 * GENERATED into wavenet-voice-samples.json by `npm run wavenet-samples`. The two
 * are kept apart on purpose: regenerating the samples must never wipe the names.
 *
 * ⚠️ THE NAMES ARE OURS, NOT THE VENDOR'S. Wavenet voices are only lettered
 * (`en-US-Wavenet-C`), so each one is given a first name common in its language,
 * matched to its gender. They are labels, not people — see the ⚠️ on VOICE_FACES
 * in magic-studio-audio.js: no bios, no "recorded by".
 *
 * ⚠️ A VOICE MISSING HERE STILL WORKS. When the vendor adds a voice and the
 * samples are regenerated, its card falls back to "Voice <letter>" until a name
 * is added below. Keep the names UNIQUE across the whole list — the composer
 * chip shows the name alone, so two "Ana"s would be indistinguishable there.
 *
 * Plain data, no "use client": magic-studio-audio.js imports this and is itself
 * imported by a server component (see the ⚠️ at the top of that file).
 */

/** Voice id → display name. Grouped by locale, in the catalogue's letter order. */
export const WAVENET_VOICE_NAMES = {
  // Amharic
  "am-ET-Wavenet-A": "Selam",
  "am-ET-Wavenet-B": "Dawit",
  // Arabic
  "ar-XA-Wavenet-A": "Layla",
  "ar-XA-Wavenet-B": "Omar",
  "ar-XA-Wavenet-C": "Karim",
  "ar-XA-Wavenet-D": "Noor",
  // Bengali
  "bn-IN-Wavenet-A": "Moumita",
  "bn-IN-Wavenet-B": "Arnab",
  "bn-IN-Wavenet-C": "Riya",
  "bn-IN-Wavenet-D": "Sourav",
  // Mandarin (China)
  "cmn-CN-Wavenet-A": "Mei",
  "cmn-CN-Wavenet-B": "Wei",
  "cmn-CN-Wavenet-C": "Jun",
  "cmn-CN-Wavenet-D": "Lin",
  // Mandarin (Taiwan)
  "cmn-TW-Wavenet-A": "Yu-ting",
  "cmn-TW-Wavenet-B": "Chen",
  "cmn-TW-Wavenet-C": "Hao",
  // Czech
  "cs-CZ-Wavenet-B": "Tereza",
  // Danish
  "da-DK-Wavenet-F": "Freja",
  "da-DK-Wavenet-G": "Mads",
  // German
  "de-DE-Wavenet-G": "Lena",
  "de-DE-Wavenet-H": "Felix",
  // Greek
  "el-GR-Wavenet-B": "Eleni",
  // English (Australia)
  "en-AU-Wavenet-A": "Matilda",
  "en-AU-Wavenet-B": "Jack",
  "en-AU-Wavenet-C": "Chloe",
  "en-AU-Wavenet-D": "Lachlan",
  // English (UK)
  "en-GB-Wavenet-A": "Amelia",
  "en-GB-Wavenet-B": "Oliver",
  "en-GB-Wavenet-C": "Isla",
  "en-GB-Wavenet-D": "Harry",
  "en-GB-Wavenet-F": "Poppy",
  "en-GB-Wavenet-N": "Imogen",
  "en-GB-Wavenet-O": "Alfie",
  // English (India)
  "en-IN-Wavenet-A": "Priya",
  "en-IN-Wavenet-B": "Arjun",
  "en-IN-Wavenet-C": "Rohan",
  "en-IN-Wavenet-D": "Kavya",
  "en-IN-Wavenet-E": "Isha",
  "en-IN-Wavenet-F": "Vikram",
  // English (US)
  "en-US-Wavenet-A": "Ethan",
  "en-US-Wavenet-B": "Noah",
  "en-US-Wavenet-C": "Ava",
  "en-US-Wavenet-D": "Mason",
  "en-US-Wavenet-E": "Harper",
  "en-US-Wavenet-F": "Emma",
  "en-US-Wavenet-G": "Olivia",
  "en-US-Wavenet-H": "Sophia",
  "en-US-Wavenet-I": "Liam",
  "en-US-Wavenet-J": "James",
  // Spanish (Spain)
  "es-ES-Wavenet-E": "Pablo",
  "es-ES-Wavenet-F": "Lucía",
  "es-ES-Wavenet-G": "Javier",
  "es-ES-Wavenet-H": "Carmen",
  // Spanish (US)
  "es-US-Wavenet-A": "Sofía",
  "es-US-Wavenet-B": "Mateo",
  "es-US-Wavenet-C": "Diego",
  // Finnish
  "fi-FI-Wavenet-B": "Aino",
  // Filipino
  "fil-PH-Wavenet-A": "Ligaya",
  "fil-PH-Wavenet-B": "Mayumi",
  "fil-PH-Wavenet-C": "Andres",
  "fil-PH-Wavenet-D": "Paolo",
  // French (Canada)
  "fr-CA-Wavenet-A": "Émilie",
  "fr-CA-Wavenet-B": "Gabriel",
  "fr-CA-Wavenet-C": "Florence",
  "fr-CA-Wavenet-D": "Samuel",
  // French (France)
  "fr-FR-Wavenet-F": "Camille",
  "fr-FR-Wavenet-G": "Louis",
  // Gujarati
  "gu-IN-Wavenet-A": "Hetal",
  "gu-IN-Wavenet-B": "Jignesh",
  "gu-IN-Wavenet-C": "Krupa",
  "gu-IN-Wavenet-D": "Parth",
  // Hebrew
  "he-IL-Wavenet-A": "Noa",
  "he-IL-Wavenet-B": "Itai",
  "he-IL-Wavenet-C": "Tamar",
  "he-IL-Wavenet-D": "Yonatan",
  // Hindi
  "hi-IN-Wavenet-A": "Pooja",
  "hi-IN-Wavenet-B": "Rahul",
  "hi-IN-Wavenet-C": "Amit",
  "hi-IN-Wavenet-D": "Neha",
  "hi-IN-Wavenet-E": "Sunita",
  "hi-IN-Wavenet-F": "Rajesh",
  // Hungarian
  "hu-HU-Wavenet-B": "Zsófia",
  // Indonesian
  "id-ID-Wavenet-A": "Putri",
  "id-ID-Wavenet-B": "Budi",
  "id-ID-Wavenet-C": "Agus",
  "id-ID-Wavenet-D": "Dewi",
  // Italian
  "it-IT-Wavenet-E": "Giulia",
  "it-IT-Wavenet-F": "Lorenzo",
  // Japanese
  "ja-JP-Wavenet-A": "Yui",
  "ja-JP-Wavenet-B": "Sakura",
  "ja-JP-Wavenet-C": "Haruto",
  "ja-JP-Wavenet-D": "Ren",
  // Kannada
  "kn-IN-Wavenet-A": "Shwetha",
  "kn-IN-Wavenet-B": "Kiran",
  "kn-IN-Wavenet-C": "Lakshmi",
  "kn-IN-Wavenet-D": "Manjunath",
  // Korean
  "ko-KR-Wavenet-A": "Ji-woo",
  "ko-KR-Wavenet-B": "Seo-yeon",
  "ko-KR-Wavenet-C": "Min-jun",
  "ko-KR-Wavenet-D": "Do-hyun",
  // Malayalam
  "ml-IN-Wavenet-A": "Anjali",
  "ml-IN-Wavenet-B": "Arun",
  "ml-IN-Wavenet-C": "Lekha",
  "ml-IN-Wavenet-D": "Vishnu",
  // Marathi
  "mr-IN-Wavenet-A": "Sneha",
  "mr-IN-Wavenet-B": "Omkar",
  "mr-IN-Wavenet-C": "Gauri",
  // Malay
  "ms-MY-Wavenet-A": "Aisyah",
  "ms-MY-Wavenet-B": "Hafiz",
  "ms-MY-Wavenet-C": "Nurul",
  "ms-MY-Wavenet-D": "Faizal",
  // Norwegian
  "nb-NO-Wavenet-F": "Ingrid",
  "nb-NO-Wavenet-G": "Lars",
  // Dutch (Belgium)
  "nl-BE-Wavenet-C": "Lotte",
  "nl-BE-Wavenet-D": "Wout",
  // Dutch (Netherlands)
  "nl-NL-Wavenet-F": "Sanne",
  "nl-NL-Wavenet-G": "Daan",
  // Punjabi
  "pa-IN-Wavenet-A": "Simran",
  "pa-IN-Wavenet-B": "Gurpreet",
  "pa-IN-Wavenet-C": "Harleen",
  "pa-IN-Wavenet-D": "Jaspreet",
  // Polish
  "pl-PL-Wavenet-F": "Agnieszka",
  "pl-PL-Wavenet-G": "Jakub",
  // Portuguese (Brazil)
  "pt-BR-Wavenet-A": "Ana",
  "pt-BR-Wavenet-B": "Rafael",
  "pt-BR-Wavenet-C": "Beatriz",
  "pt-BR-Wavenet-D": "Larissa",
  "pt-BR-Wavenet-E": "Thiago",
  // Portuguese (Portugal)
  "pt-PT-Wavenet-E": "Inês",
  "pt-PT-Wavenet-F": "Duarte",
  // Romanian
  "ro-RO-Wavenet-B": "Ioana",
  // Russian
  "ru-RU-Wavenet-A": "Anastasia",
  "ru-RU-Wavenet-B": "Dmitri",
  "ru-RU-Wavenet-C": "Ekaterina",
  "ru-RU-Wavenet-D": "Alexei",
  "ru-RU-Wavenet-E": "Natalia",
  // Slovak
  "sk-SK-Wavenet-B": "Zuzana",
  // Swedish
  "sv-SE-Wavenet-A": "Elsa",
  "sv-SE-Wavenet-B": "Astrid",
  "sv-SE-Wavenet-C": "Erik",
  "sv-SE-Wavenet-D": "Maja",
  "sv-SE-Wavenet-E": "Oskar",
  "sv-SE-Wavenet-F": "Linnea",
  "sv-SE-Wavenet-G": "Nils",
  // Tamil
  "ta-IN-Wavenet-A": "Kavitha",
  "ta-IN-Wavenet-B": "Karthik",
  "ta-IN-Wavenet-C": "Meena",
  "ta-IN-Wavenet-D": "Senthil",
  // Turkish
  "tr-TR-Wavenet-A": "Elif",
  "tr-TR-Wavenet-B": "Emre",
  "tr-TR-Wavenet-C": "Zeynep",
  "tr-TR-Wavenet-D": "Ayşe",
  "tr-TR-Wavenet-E": "Mehmet",
  // Ukrainian
  "uk-UA-Wavenet-B": "Oksana",
  // Urdu
  "ur-IN-Wavenet-A": "Ayesha",
  "ur-IN-Wavenet-B": "Imran",
  // Vietnamese
  "vi-VN-Wavenet-A": "Linh",
  "vi-VN-Wavenet-B": "Minh",
  "vi-VN-Wavenet-C": "Trang",
  "vi-VN-Wavenet-D": "Quang",
};

/**
 * Locale tag → the name the language picker shows.
 *
 * ⚠️ A TABLE RATHER THAN Intl.DisplayNames, for two reasons. Intl gets Google's
 * tags wrong — `ar-XA` comes out as "Arabic (Pseudo-Accents)", XA being the
 * pseudo-locale region code — and its wording ("American English", "Flemish")
 * differs between engines, so the server and the browser could disagree about a
 * label. Intl is still the fallback for a locale the vendor adds later.
 */
export const WAVENET_LOCALE_LABELS = {
  "am-ET": "Amharic",
  "ar-XA": "Arabic",
  "bn-IN": "Bengali",
  "cmn-CN": "Mandarin (China)",
  "cmn-TW": "Mandarin (Taiwan)",
  "cs-CZ": "Czech",
  "da-DK": "Danish",
  "de-DE": "German",
  "el-GR": "Greek",
  "en-AU": "English (Australia)",
  "en-GB": "English (UK)",
  "en-IN": "English (India)",
  "en-US": "English (US)",
  "es-ES": "Spanish (Spain)",
  "es-US": "Spanish (US)",
  "fi-FI": "Finnish",
  "fil-PH": "Filipino",
  "fr-CA": "French (Canada)",
  "fr-FR": "French (France)",
  "gu-IN": "Gujarati",
  "he-IL": "Hebrew",
  "hi-IN": "Hindi",
  "hu-HU": "Hungarian",
  "id-ID": "Indonesian",
  "it-IT": "Italian",
  "ja-JP": "Japanese",
  "kn-IN": "Kannada",
  "ko-KR": "Korean",
  "ml-IN": "Malayalam",
  "mr-IN": "Marathi",
  "ms-MY": "Malay",
  "nb-NO": "Norwegian",
  "nl-BE": "Dutch (Belgium)",
  "nl-NL": "Dutch (Netherlands)",
  "pa-IN": "Punjabi",
  "pl-PL": "Polish",
  "pt-BR": "Portuguese (Brazil)",
  "pt-PT": "Portuguese (Portugal)",
  "ro-RO": "Romanian",
  "ru-RU": "Russian",
  "sk-SK": "Slovak",
  "sv-SE": "Swedish",
  "ta-IN": "Tamil",
  "tr-TR": "Turkish",
  "uk-UA": "Ukrainian",
  "ur-IN": "Urdu",
  "vi-VN": "Vietnamese",
};
