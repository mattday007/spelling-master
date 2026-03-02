// Based on NZCER Essential Word Lists (Spell-Write, Croft & Mapa, 1998)
// and NZ Ministry of Education Literacy Learning Progressions.
//
// The 290 essential words across Lists 1-7 make up ~75% of all writing.
// Lists map to NZ Curriculum Levels:
//   Level 1 (Years 1-2, age 5-6): Lists 1-3
//   Level 2 (Years 3-4, age 7-8): Lists 1-4 + working on 5-7
//   Level 3 (Years 5-6, age 9-10): Lists 1-6
//   Level 4 (Years 7-8, age 11-12): Lists 1-7 + commonly misspelt words
//
// Sources:
//   - NZCER Spell-Write (Cedric Croft & Lia Mapa, 1998)
//   - NZ Literacy Learning Progressions (education.govt.nz)
//   - Frankton School, Vauxhall School, Ngatimoti School, Pukete School
//     published essential lists

export interface PresetList {
  name: string;
  ageMin: number;
  ageMax: number;
  words: string[];
}

export const PRESET_WORD_LISTS: PresetList[] = [
  // ── NZCER Essential Lists 1-3 (Years 1-2, age 5-6) ──────────────
  {
    name: "Essential Lists 1-3 (Years 1-2)",
    ageMin: 5,
    ageMax: 7,
    words: [
      // List 1 (10 words — 25% of writing)
      "a", "and", "I", "in", "is", "it", "my", "the", "to", "was",
      // List 2 (20 words — 15% of writing)
      "at", "but", "for", "got", "had", "he", "me", "of", "on", "she",
      "so", "that", "then", "there", "they", "up", "we", "went", "when", "you",
      // List 3 (30 words — 10% of writing)
      "about", "after", "all", "are", "as", "back", "be", "because", "came", "day",
      "down", "get", "go", "going", "have", "her", "his", "home", "into", "just",
      "like", "mum", "not", "one", "our", "out", "said", "some", "were", "with",
    ],
  },

  // ── NZCER Essential List 4 (Years 3-4, age 7-8) ─────────────────
  {
    name: "Essential List 4 (Years 3-4)",
    ageMin: 7,
    ageMax: 8,
    words: [
      // List 4 (50 words — 10% of writing)
      "again", "an", "around", "big", "by", "can", "come", "could", "dad", "did",
      "do", "first", "food", "from", "good", "has", "him", "house", "if", "little",
      "next", "night", "no", "now", "off", "old", "only", "or", "other", "over",
      "people", "put", "ran", "saw", "school", "see", "started", "their", "them", "this",
      "time", "took", "two", "us", "very", "well", "what", "will", "would", "your",
    ],
  },

  // ── NZCER Essential List 5 (Years 4-5, age 8-9) ─────────────────
  {
    name: "Essential List 5 (Years 4-5)",
    ageMin: 8,
    ageMax: 9,
    words: [
      // List 5 (50 words — 5% of writing)
      "am", "another", "away", "bed", "been", "before", "best", "brother", "called", "car",
      "door", "everyone", "family", "five", "found", "friend", "fun", "heard", "here", "know",
      "last", "left", "long", "looked", "made", "man", "more", "morning", "name", "never",
      "once", "play", "really", "room", "say", "sister", "something", "still", "thing", "think",
      "thought", "three", "through", "told", "too", "walked", "want", "way", "where", "which",
    ],
  },

  // ── NZCER Essential List 6 (Years 5-6, age 9-10) ────────────────
  {
    name: "Essential List 6 (Years 5-6)",
    ageMin: 9,
    ageMax: 10,
    words: [
      // List 6 (70 words — 5% of writing)
      "also", "always", "asked", "black", "boy", "bus", "cat", "coming", "cool", "dark",
      "decided", "dog", "eat", "end", "even", "every", "eyes", "fell", "felt", "find",
      "four", "gave", "getting", "great", "head", "hit", "how", "inside", "its", "jump",
      "knew", "later", "life", "live", "look", "lot", "lunch", "make", "minutes", "much",
      "nice", "opened", "outside", "place", "ready", "ride", "right", "run", "sleep", "suddenly",
      "take", "tell", "ten", "top", "tree", "turned", "until", "walk", "wanted", "water",
      "while", "who", "why", "window", "woke", "year", "yes",
    ],
  },

  // ── NZCER Essential List 7 (Years 6-7, age 10-11) ───────────────
  {
    name: "Essential List 7 (Years 6-7)",
    ageMin: 10,
    ageMax: 11,
    words: [
      // List 7 (60 words — 3% of writing)
      "any", "baby", "bad", "ball", "being", "bit", "boat", "bought", "camp", "dead",
      "died", "doing", "each", "ever", "everything", "face", "fast", "father", "few", "finally",
      "finished", "game", "girl", "gone", "ground", "guard", "hand", "happened", "happy", "help",
      "hole", "hot", "hour", "let", "many", "money", "mother", "myself", "new", "parents",
      "picked", "playing", "presents", "road", "side", "small", "sometimes", "soon", "stay", "stop",
      "swimming", "tea", "than", "tried", "under", "wait", "won", "work", "world",
    ],
  },

  // ── Commonly Misspelt Words — List 8 (Years 7-8, age 11-12) ─────
  {
    name: "Commonly Misspelt Words (Years 7-8)",
    ageMin: 11,
    ageMax: 12,
    words: [
      "aloud", "animals", "August", "autumn", "better", "book", "calendar", "caught", "children",
      "city", "destroy", "diary", "eight", "engine", "escape", "exercise", "February", "film",
      "half", "hear", "hoping", "hungry", "interesting", "January", "judge", "jumped", "light",
      "marae", "men", "might", "Mrs", "must", "peace", "piece", "read", "remember", "round",
      "safety", "sailor", "Saturday", "scissors", "sea", "should", "since", "spring", "stopped",
      "summer", "sure", "surprise", "tired", "today", "usually", "weekend", "writing",
      "yesterday",
    ],
  },

  // ── Extension Words — Lists 9-10 (Years 7-8, age 11-12) ─────────
  {
    name: "Extension Words (Years 7-8)",
    ageMin: 11,
    ageMax: 12,
    words: [
      "allowed", "Auckland", "awhile", "believe", "breakfast", "centre", "chocolate", "clothes",
      "couldn't", "dictionary", "different", "didn't", "dollars", "don't", "everybody", "friends",
      "front", "fruit", "grabbed", "lightning", "luckily", "nearly", "Pacific", "second",
      "someone", "stopped", "they're", "threw", "tomorrow", "wasn't", "watch", "weren't",
    ],
  },

  // ── NZ/UK Spelling Conventions (Years 4-8, age 8-12) ────────────
  // NZ English follows British spelling. These words teach the key
  // convention differences that NZ children must know.
  {
    name: "NZ/UK Spelling Patterns — -our words",
    ageMin: 8,
    ageMax: 12,
    words: [
      "colour", "favourite", "neighbour", "behaviour", "honour", "labour",
      "humour", "flavour", "rumour", "harbour", "armour", "vapour",
      "glamour", "savour", "vigour", "endeavour",
    ],
  },
  {
    name: "NZ/UK Spelling Patterns — -ise words",
    ageMin: 9,
    ageMax: 12,
    words: [
      "organise", "recognise", "realise", "apologise", "criticise",
      "emphasise", "specialise", "advertise", "supervise", "compromise",
      "practise", "advise", "revise", "improvise",
    ],
  },
  {
    name: "NZ/UK Spelling Patterns — -re and -ll words",
    ageMin: 9,
    ageMax: 12,
    words: [
      // -re endings (not -er)
      "centre", "theatre", "metre", "litre", "fibre", "sombre", "lustre",
      // doubled L before suffix
      "travelled", "travelling", "cancelled", "cancelling", "labelled",
      "modelled", "counsellor", "jewellery",
      // other NZ/UK conventions
      "programme", "cheque", "defence", "licence", "catalogue", "dialogue",
    ],
  },

  // ── Year 4 Curriculum Words (age 8-9) ────────────────────────────
  // Words from the NZ Curriculum Level 2 expectations. Children at Year 4
  // should know Lists 1-4 and be working on Lists 5-7. These words
  // practise prefixes (un-, sub-, pre-, non-) and suffixes (-ful, -ly,
  // -tion, -ment, -able, -ible) per MoE Literacy Progressions.
  {
    name: "Year 4 — Prefixes & Suffixes",
    ageMin: 8,
    ageMax: 9,
    words: [
      // un- prefix
      "unhappy", "unkind", "unlucky", "unsafe", "untidy", "unusual",
      // re- prefix
      "rewrite", "retell", "replay", "rebuild", "reread", "return",
      // -ful suffix
      "beautiful", "careful", "cheerful", "colourful", "hopeful", "thankful",
      // -ly suffix
      "quickly", "slowly", "quietly", "loudly", "gently", "kindly",
      // -tion suffix
      "action", "direction", "question", "station", "attention", "collection",
      // -ment suffix
      "moment", "movement", "statement", "agreement", "excitement", "government",
    ],
  },

  // ── Year 5-6 Curriculum Words (age 9-10) ─────────────────────────
  // NZ Curriculum Level 3. Students should know Lists 1-6 and be able
  // to spell most high-frequency words correctly. These extend into
  // cross-curricular vocabulary per MoE expectations.
  {
    name: "Year 5-6 — Cross-Curricular Words",
    ageMin: 9,
    ageMax: 10,
    words: [
      // Science
      "experiment", "temperature", "material", "energy", "environment", "weather",
      "planet", "habitat", "creature", "disease", "liquid", "solid",
      // Social studies / NZ contexts
      "community", "government", "parliament", "population", "settlement", "migration",
      "treaty", "tradition", "culture", "celebration",
      // Maths
      "multiply", "divide", "fraction", "measurement", "triangle", "rectangle",
      "distance", "weight", "height", "equation",
      // Commonly expected at this level
      "although", "believe", "breathe", "describe", "disappear",
      "imagine", "important", "knowledge", "noticed", "ordinary", "perhaps",
      "purpose", "receive", "separate", "straight", "strength",
    ],
  },

  // ── Year 7-8 Curriculum Words (age 11-12) ────────────────────────
  // NZ Curriculum Level 4. Students at this level should have few errors
  // in Lists 1-7, control commonly misspelt words, and handle
  // multisyllabic words using morphemic knowledge.
  {
    name: "Year 7-8 — Advanced Vocabulary",
    ageMin: 11,
    ageMax: 12,
    words: [
      "accommodate", "accompany", "according", "achieve", "acknowledgement",
      "aggressive", "apparently", "appreciate", "awkward", "bargain",
      "bruise", "category", "cemetery", "committee", "communicate",
      "competition", "conscience", "conscious", "consequence", "controversy",
      "convenient", "correspond", "curiosity", "definite", "desperate",
      "determined", "develop", "disappoint", "embarrass", "equipped",
      "especially", "exaggerate", "excellent", "existence", "explanation",
      "familiar", "foreign", "frequently", "guarantee", "immediately",
      "independent", "interrupt", "language", "leisure", "marvellous",
      "mischievous", "necessary", "nuisance", "occasion", "opportunity",
      "persuade", "physical", "prejudice", "privilege",
      "profession", "pronunciation", "recommend", "relevant", "restaurant",
      "rhyme", "rhythm", "sacrifice", "secretary", "shoulder",
      "signature", "sincerely", "sufficient", "thorough",
      "vegetable", "vehicle", "yacht",
    ],
  },

  // ── Te Reo Māori Loan Words (Years 3-8, age 7-12) ───────────────
  // Common te reo Māori words used in NZ English. Part of NZ school
  // life and cross-curricular vocabulary.
  {
    name: "Te Reo Māori in NZ English (Years 3-6)",
    ageMin: 7,
    ageMax: 10,
    words: [
      "aroha", "haere", "haka", "hangi", "hui", "kai", "karakia",
      "kia ora", "koha", "kumara", "mana", "maunga", "mihi",
      "moana", "patu", "paua", "pepeha", "pipi", "poi",
      "pounamu", "puku", "tui", "waka", "whanau", "whenua",
    ],
  },
  {
    name: "Te Reo Māori in NZ English (Years 7-8)",
    ageMin: 10,
    ageMax: 12,
    words: [
      "aotearoa", "atua", "harakeke", "iwi", "kaiako", "kaitiaki",
      "karanga", "kaumatua", "kaupapa", "kauri", "kawakawa",
      "kiwi", "korero", "kotahitanga", "mahi", "manaakitanga",
      "papatuanuku", "pohutukawa", "rangatira", "rangatiratanga",
      "reo", "tamariki", "taniwha", "taonga", "tikanga",
      "turangawaewae", "waiata", "wairua", "whakatauki", "whakapapa",
    ],
  },

  // ── NZ Nature & Geography (Years 3-6, age 7-10) ─────────────────
  {
    name: "NZ Nature & Geography",
    ageMin: 7,
    ageMax: 10,
    words: [
      "fern", "bush", "forest", "mountain", "volcano", "glacier",
      "fiord", "island", "peninsula", "geyser",
      "tussock", "flax", "rimu", "totara", "rata", "kowhai",
      "fantail", "kereru", "weta", "tuatara", "dolphin", "whale",
      "penguin", "albatross", "sandfly", "possum", "earthquake", "tsunami",
    ],
  },
];
