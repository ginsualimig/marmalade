import type { DifficultyMode } from "@/lib/game/quizPersistence";

export type StageId = "k1" | "k2" | "p1" | "p2" | "p3" | "p4" | "p5" | "p6";
export type SubjectArea = "maths" | "word-skills";
export type AnswerMode = "mcq" | "typed" | "hybrid";
export type MathsDomain =
  | "number-sense"
  | "addition-subtraction"
  | "multiplication-division"
  | "fractions"
  | "measurement-time-money"
  | "geometry"
  | "word-problems"
  | "patterns"
  | "place-value";
export type WordDomain =
  | "letter-recognition"
  | "phonemic-awareness"
  | "phonics"
  | "blending-segmenting"
  | "high-frequency-words"
  | "spelling-patterns"
  | "vocabulary"
  | "morphology"
  | "reading-comprehension-lite";

export type DiagnosticCategory = {
  id: string;
  subject: SubjectArea;
  label: string;
  description: string;
  signals: string[];
};

export type QuestionBand = {
  id: string;
  subject: SubjectArea;
  label: string;
  answerMode: AnswerMode;
  promptTypes: string[];
  successLooksLike: string[];
  diagnosticTags: string[];
  examples: string[];
};

export type StageCurriculum = {
  stage: StageId;
  label: string;
  ageBand: string;
  singaporeAlignment: string[];
  mathsFocus: MathsDomain[];
  wordFocus: WordDomain[];
  recommendedBossMix: {
    mathsShare: number;
    wordShare: number;
  };
  questionBands: QuestionBand[];
  sampleLexicon: string[];
  implementationNotes: string[];
};

export type ModeCurriculumCluster = {
  mode: DifficultyMode;
  label: string;
  stages: StageId[];
  ageBand: string;
  rationale: string;
  answerModePolicy: {
    maths: AnswerMode;
    wordSkills: AnswerMode;
    notes: string[];
  };
  operationalRules: string[];
};

export const DIAGNOSTIC_CATEGORIES: DiagnosticCategory[] = [
  {
    id: "math-number-sense",
    subject: "maths",
    label: "Number sense",
    description: "Counts, compares, and recognises quantity reliably.",
    signals: ["miscounts objects", "confuses bigger/smaller", "slow quantity recognition"]
  },
  {
    id: "math-place-value",
    subject: "maths",
    label: "Place value",
    description: "Understands tens, hundreds, thousands and regrouping structure.",
    signals: ["reads 304 as 34", "breaks on renaming/regrouping", "digit-value confusion"]
  },
  {
    id: "math-facts-fluency",
    subject: "maths",
    label: "Facts fluency",
    description: "Recalls basic addition, subtraction, multiplication, and division facts.",
    signals: ["very slow fact recall", "counts every time", "inverse fact weakness"]
  },
  {
    id: "math-multistep-reasoning",
    subject: "maths",
    label: "Multi-step reasoning",
    description: "Holds steps in sequence and chooses operations correctly.",
    signals: ["drops one step", "operation choice errors", "gets lost mid-solution"]
  },
  {
    id: "math-word-problem-translation",
    subject: "maths",
    label: "Word-problem translation",
    description: "Turns language into number operations.",
    signals: ["ignores key quantities", "copies visible numbers only", "misreads comparison language"]
  },
  {
    id: "word-letter-sound",
    subject: "word-skills",
    label: "Letter-sound knowledge",
    description: "Links graphemes to sounds accurately.",
    signals: ["random letter guesses", "confuses short vowels", "weak consonant recall"]
  },
  {
    id: "word-blending-segmenting",
    subject: "word-skills",
    label: "Blending and segmenting",
    description: "Builds and breaks words by sound chunks.",
    signals: ["can name letters but not read word", "drops phonemes", "reverses sound order"]
  },
  {
    id: "word-sight-word-fluency",
    subject: "word-skills",
    label: "High-frequency word fluency",
    description: "Reads and spells common words automatically.",
    signals: ["slow recognition of common words", "over-relies on sounding out", "inconsistent spelling of known words"]
  },
  {
    id: "word-pattern-transfer",
    subject: "word-skills",
    label: "Spelling pattern transfer",
    description: "Applies rimes, digraphs, suffixes, and orthographic patterns to new words.",
    signals: ["knows one word but cannot generalise pattern", "confuses digraphs", "weak suffix use"]
  },
  {
    id: "word-morphology-vocab",
    subject: "word-skills",
    label: "Morphology and vocabulary",
    description: "Uses prefixes, suffixes, roots, and meaning clues.",
    signals: ["guesses long words from first letters only", "misses affixes", "limited synonym awareness"]
  }
];

export const STAGE_CURRICULUM: Record<StageId, StageCurriculum> = {
  k1: {
    stage: "k1",
    label: "K1",
    ageBand: "~4-5",
    singaporeAlignment: ["MOE Kindergarten Learning Outcomes: early numeracy", "MOE Kindergarten Learning Outcomes: language and literacy"],
    mathsFocus: ["number-sense", "addition-subtraction", "patterns", "geometry"],
    wordFocus: ["letter-recognition", "phonemic-awareness", "phonics", "blending-segmenting"],
    recommendedBossMix: { mathsShare: 0.5, wordShare: 0.5 },
    questionBands: [
      {
        id: "k1-math-counting",
        subject: "maths",
        label: "Count objects to 10",
        answerMode: "mcq",
        promptTypes: ["count pictures", "choose numeral", "which group has more/less"],
        successLooksLike: ["stable counting 1-10", "matches quantity to numeral", "basic compare language"],
        diagnosticTags: ["math-number-sense"],
        examples: ["How many stars?", "Which group has more apples?"]
      },
      {
        id: "k1-math-compose",
        subject: "maths",
        label: "Join/take away within 5",
        answerMode: "mcq",
        promptTypes: ["story sums with objects", "finger-count addition", "take-away visual prompts"],
        successLooksLike: ["combines small groups", "understands one more/one less"],
        diagnosticTags: ["math-number-sense", "math-facts-fluency"],
        examples: ["2 ducks and 1 duck makes ?", "5 cookies take away 1 = ?"]
      },
      {
        id: "k1-word-letters",
        subject: "word-skills",
        label: "Letter names and initial sounds",
        answerMode: "mcq",
        promptTypes: ["pick first letter", "match sound to letter", "uppercase-lowercase match"],
        successLooksLike: ["identifies most letters", "hears first sound in simple words"],
        diagnosticTags: ["word-letter-sound"],
        examples: ["Which letter starts sun?", "Tap the lowercase b"]
      },
      {
        id: "k1-word-cvc-prep",
        subject: "word-skills",
        label: "Blend simple CVC words",
        answerMode: "mcq",
        promptTypes: ["complete cat/cup/sun", "select ending sound", "rhyme family choice"],
        successLooksLike: ["blends 2-3 sounds", "spots rhyming endings"],
        diagnosticTags: ["word-letter-sound", "word-blending-segmenting"],
        examples: ["c_a_t", "Which word rhymes with hat?"]
      }
    ],
    sampleLexicon: ["cat", "sun", "hat", "dog", "pen", "fish", "mop", "jam"],
    implementationNotes: [
      "Keep to audio-friendly, highly visual prompts.",
      "Use MCQ only; typed answers are too punitive at this stage.",
      "Distractors should differ by one salient feature only."
    ]
  },
  k2: {
    stage: "k2",
    label: "K2",
    ageBand: "~5-6",
    singaporeAlignment: ["MOE Kindergarten Learning Outcomes: early numeracy", "MOE Kindergarten Learning Outcomes: reading readiness"],
    mathsFocus: ["number-sense", "addition-subtraction", "measurement-time-money", "patterns"],
    wordFocus: ["phonemic-awareness", "phonics", "blending-segmenting", "high-frequency-words", "spelling-patterns"],
    recommendedBossMix: { mathsShare: 0.5, wordShare: 0.5 },
    questionBands: [
      {
        id: "k2-math-within20",
        subject: "maths",
        label: "Numbers within 20",
        answerMode: "mcq",
        promptTypes: ["count on/back", "number bonds to 10", "missing number"],
        successLooksLike: ["recognises 0-20", "solves simple missing-number items"],
        diagnosticTags: ["math-number-sense", "math-facts-fluency"],
        examples: ["7 + 2 = ?", "? + 3 = 10"]
      },
      {
        id: "k2-math-compare-measure",
        subject: "maths",
        label: "Basic compare and measure language",
        answerMode: "mcq",
        promptTypes: ["longer/shorter", "heavier/lighter", "before/after"],
        successLooksLike: ["understands everyday compare vocabulary"],
        diagnosticTags: ["math-number-sense"],
        examples: ["Which is longer?", "What comes after 14?"]
      },
      {
        id: "k2-word-cvc-ccvc",
        subject: "word-skills",
        label: "CVC/CCVC word reading and spelling",
        answerMode: "hybrid",
        promptTypes: ["missing vowel", "pick digraph", "type final letter"],
        successLooksLike: ["blends simple words smoothly", "spells short familiar words"],
        diagnosticTags: ["word-letter-sound", "word-blending-segmenting", "word-pattern-transfer"],
        examples: ["tr_ap", "ship starts with which sound?"]
      },
      {
        id: "k2-word-sight-rimes",
        subject: "word-skills",
        label: "High-frequency words and rimes",
        answerMode: "mcq",
        promptTypes: ["read common word", "choose rhyming word family", "odd-one-out by sound"],
        successLooksLike: ["automatic reading of common words", "transfers -at/-ig/-op patterns"],
        diagnosticTags: ["word-sight-word-fluency", "word-pattern-transfer"],
        examples: ["Find said", "Which word belongs to the -an family?"]
      }
    ],
    sampleLexicon: ["shop", "train", "chip", "frog", "green", "play", "said", "come"],
    implementationNotes: [
      "MCQ still dominant; allow very short typed single-letter or 3-letter answers in support mode.",
      "Limit typed evaluation to exact-match familiar words.",
      "Use diagnostic logging around vowel confusions and final consonant omissions."
    ]
  },
  p1: {
    stage: "p1",
    label: "Primary 1",
    ageBand: "~6-7",
    singaporeAlignment: ["Primary Mathematics 2021: whole numbers to 100", "Primary English: foundational decoding and spelling"],
    mathsFocus: ["number-sense", "addition-subtraction", "place-value", "measurement-time-money", "geometry"],
    wordFocus: ["phonics", "blending-segmenting", "high-frequency-words", "spelling-patterns", "vocabulary"],
    recommendedBossMix: { mathsShare: 0.55, wordShare: 0.45 },
    questionBands: [
      {
        id: "p1-math-placevalue100",
        subject: "maths",
        label: "Whole numbers to 100",
        answerMode: "mcq",
        promptTypes: ["tens and ones", "order numbers", "number bonds", "compare values"],
        successLooksLike: ["reads and decomposes two-digit numbers", "adds/subtracts within 20 confidently"],
        diagnosticTags: ["math-place-value", "math-facts-fluency"],
        examples: ["How many tens in 47?", "Which is greatest: 36, 63, 46?"]
      },
      {
        id: "p1-math-basic-wordproblems",
        subject: "maths",
        label: "One-step word problems",
        answerMode: "mcq",
        promptTypes: ["add/take away stories", "money/time vocabulary"],
        successLooksLike: ["chooses correct operation from short text"],
        diagnosticTags: ["math-word-problem-translation"],
        examples: ["Ali has 7 marbles and gets 3 more. How many now?"]
      },
      {
        id: "p1-word-digraphs",
        subject: "word-skills",
        label: "Digraphs and common spelling patterns",
        answerMode: "hybrid",
        promptTypes: ["sh/ch/th/wh choice", "missing vowel team", "typed short word"],
        successLooksLike: ["hears and spells common digraphs", "reads simple patterned words"],
        diagnosticTags: ["word-letter-sound", "word-pattern-transfer"],
        examples: ["__ip → ship", "Pick the ending for rain"]
      },
      {
        id: "p1-word-common-words",
        subject: "word-skills",
        label: "High-frequency word control",
        answerMode: "mcq",
        promptTypes: ["choose correct common word", "spot the correctly spelt word"],
        successLooksLike: ["stable recall of early sight words"],
        diagnosticTags: ["word-sight-word-fluency"],
        examples: ["which/witch", "come/kom"]
      }
    ],
    sampleLexicon: ["which", "train", "light", "garden", "school", "jumped"],
    implementationNotes: [
      "Use mostly MCQ in live battle; typed spelling can appear in calmer review rounds.",
      "Math questions should stay one-step during battles.",
      "Keep number ranges small enough that failure reflects concept, not reading load."
    ]
  },
  p2: {
    stage: "p2",
    label: "Primary 2",
    ageBand: "~7-8",
    singaporeAlignment: ["Primary Mathematics: whole numbers to 1000", "Primary English: spelling patterns and sentence-level vocabulary"],
    mathsFocus: ["place-value", "addition-subtraction", "multiplication-division", "measurement-time-money", "word-problems"],
    wordFocus: ["phonics", "high-frequency-words", "spelling-patterns", "vocabulary", "reading-comprehension-lite"],
    recommendedBossMix: { mathsShare: 0.55, wordShare: 0.45 },
    questionBands: [
      {
        id: "p2-math-1000",
        subject: "maths",
        label: "Whole numbers to 1000 and basic operations",
        answerMode: "hybrid",
        promptTypes: ["3-digit place value", "regrouping", "times tables 2,5,10", "simple division sharing"],
        successLooksLike: ["handles regrouping", "connects multiplication and equal groups"],
        diagnosticTags: ["math-place-value", "math-facts-fluency"],
        examples: ["304 means 3 hundreds and ? ones", "4 groups of 5 = ?"]
      },
      {
        id: "p2-math-1step",
        subject: "maths",
        label: "One-step word problems with money/time/length",
        answerMode: "mcq",
        promptTypes: ["buying items", "elapsed simple time", "compare lengths"],
        successLooksLike: ["maps context to operation reliably"],
        diagnosticTags: ["math-word-problem-translation"],
        examples: ["A toy costs $6 and a book costs $8. How much altogether?"]
      },
      {
        id: "p2-word-patterns",
        subject: "word-skills",
        label: "Long vowels, blends, suffix beginnings",
        answerMode: "hybrid",
        promptTypes: ["typed word completion", "choose correct long-vowel spelling", "plural/past tense endings"],
        successLooksLike: ["transfers common spelling rules", "uses inflectional endings"],
        diagnosticTags: ["word-pattern-transfer", "word-sight-word-fluency"],
        examples: ["bike/baik", "jump + ed = ?"]
      },
      {
        id: "p2-word-vocab",
        subject: "word-skills",
        label: "Everyday vocabulary and context choice",
        answerMode: "mcq",
        promptTypes: ["best-fit word", "simple synonym", "complete sentence"],
        successLooksLike: ["uses meaning not just sound"],
        diagnosticTags: ["word-morphology-vocab"],
        examples: ["The puppy is very __. (playful/sleepy when picture shows running)"]
      }
    ],
    sampleLexicon: ["bright", "cleaned", "market", "float", "storm", "careful"],
    implementationNotes: [
      "Introduce typed answers for short maths facts and short spelling completions.",
      "Keep typed input forgiving only for whitespace/case, not spelling accuracy.",
      "Great point to start diagnostic dashboards for regrouping vs fact-fluency splits."
    ]
  },
  p3: {
    stage: "p3",
    label: "Primary 3",
    ageBand: "~8-9",
    singaporeAlignment: ["Primary Mathematics: multiplication/division fluency, fractions introduction", "Primary English: expanded vocabulary and morphology"],
    mathsFocus: ["place-value", "multiplication-division", "fractions", "measurement-time-money", "word-problems"],
    wordFocus: ["spelling-patterns", "vocabulary", "morphology", "reading-comprehension-lite"],
    recommendedBossMix: { mathsShare: 0.6, wordShare: 0.4 },
    questionBands: [
      {
        id: "p3-math-facts-fractions",
        subject: "maths",
        label: "Times tables, division, basic fractions",
        answerMode: "hybrid",
        promptTypes: ["times tables up to 10", "inverse facts", "fraction of a set", "compare simple fractions"],
        successLooksLike: ["faster fact recall", "understands numerator/denominator in simple settings"],
        diagnosticTags: ["math-facts-fluency", "math-multistep-reasoning"],
        examples: ["6 × 7 = ?", "1/2 of 12 = ?"]
      },
      {
        id: "p3-math-2step-light",
        subject: "maths",
        label: "Light two-step problem solving",
        answerMode: "mcq",
        promptTypes: ["buying and change", "equal groups then combine", "measurement conversion simple"],
        successLooksLike: ["keeps sequence of two operations"],
        diagnosticTags: ["math-multistep-reasoning", "math-word-problem-translation"],
        examples: ["3 bags of 4 marbles and 2 extra. How many?"]
      },
      {
        id: "p3-word-morphology",
        subject: "word-skills",
        label: "Prefixes, suffixes, and syllable chunks",
        answerMode: "hybrid",
        promptTypes: ["add prefix/suffix", "spell multi-syllable word chunk", "typed completion"],
        successLooksLike: ["recognises common affixes", "spells longer familiar words by chunks"],
        diagnosticTags: ["word-pattern-transfer", "word-morphology-vocab"],
        examples: ["happy + ness = ?", "re + tell = ?"]
      },
      {
        id: "p3-word-meaning",
        subject: "word-skills",
        label: "Vocabulary by context",
        answerMode: "mcq",
        promptTypes: ["best synonym", "context clue", "word choice"],
        successLooksLike: ["uses sentence meaning to discriminate words"],
        diagnosticTags: ["word-morphology-vocab"],
        examples: ["tiny means nearly the same as __"]
      }
    ],
    sampleLexicon: ["careless", "teacher", "fraction", "marketplace", "quickly", "beautiful"],
    implementationNotes: [
      "Start mixing MCQ and typed more evenly.",
      "Battle mode should still avoid long free-response word problems.",
      "Use typed maths for direct facts; use MCQ for multi-step reasoning to reduce input noise."
    ]
  },
  p4: {
    stage: "p4",
    label: "Primary 4",
    ageBand: "~9-10",
    singaporeAlignment: ["Primary Mathematics: stronger fractions/decimals/problem sums", "Primary English: broader word knowledge and accurate spelling"],
    mathsFocus: ["multiplication-division", "fractions", "measurement-time-money", "geometry", "word-problems"],
    wordFocus: ["spelling-patterns", "vocabulary", "morphology", "reading-comprehension-lite"],
    recommendedBossMix: { mathsShare: 0.6, wordShare: 0.4 },
    questionBands: [
      {
        id: "p4-math-fractions-decimals",
        subject: "maths",
        label: "Fractions, decimals, and operations fluency",
        answerMode: "hybrid",
        promptTypes: ["equivalent fractions", "simple decimal place value", "area/perimeter basics"],
        successLooksLike: ["understands part-whole beyond concrete pictures", "solves routine fraction/decimal items"],
        diagnosticTags: ["math-place-value", "math-multistep-reasoning"],
        examples: ["Which is equal to 1/2?", "0.7 means 7 tenths"]
      },
      {
        id: "p4-math-problem-sums",
        subject: "maths",
        label: "Routine two-step problem sums",
        answerMode: "mcq",
        promptTypes: ["comparison", "change and total", "measurement applications"],
        successLooksLike: ["selects operation order accurately"],
        diagnosticTags: ["math-multistep-reasoning", "math-word-problem-translation"],
        examples: ["A ribbon is 85 cm. 27 cm is cut off. Another 10 cm is used. How much left?"]
      },
      {
        id: "p4-word-orthography",
        subject: "word-skills",
        label: "Orthographic patterns in longer words",
        answerMode: "typed",
        promptTypes: ["correct misspelt word", "suffix transformation", "type vowel pattern"],
        successLooksLike: ["more precise internal spelling representation"],
        diagnosticTags: ["word-pattern-transfer", "word-morphology-vocab"],
        examples: ["beautifull → ?", "magic + al = ?"]
      },
      {
        id: "p4-word-context",
        subject: "word-skills",
        label: "Word meaning in short contexts",
        answerMode: "mcq",
        promptTypes: ["cloze with meaning", "antonym/synonym", "prefix meaning"],
        successLooksLike: ["combines spelling with meaning"],
        diagnosticTags: ["word-morphology-vocab"],
        examples: ["unhappy means not __"]
      }
    ],
    sampleLexicon: ["beautiful", "magical", "carefully", "fraction", "decimal", "journey"],
    implementationNotes: [
      "Typed spelling becomes worthwhile from P4 upward for diagnostics.",
      "Store error strings for later pattern analysis, not just correct/incorrect.",
      "Math problem sums should remain short enough to fit combat pacing."
    ]
  },
  p5: {
    stage: "p5",
    label: "Primary 5",
    ageBand: "~10-11",
    singaporeAlignment: ["Upper Primary Mathematics: fractions/decimals/percentages, ratio intro, complex problem solving", "Upper Primary English: vocabulary precision and morphology"],
    mathsFocus: ["fractions", "measurement-time-money", "word-problems", "place-value", "geometry"],
    wordFocus: ["spelling-patterns", "vocabulary", "morphology", "reading-comprehension-lite"],
    recommendedBossMix: { mathsShare: 0.65, wordShare: 0.35 },
    questionBands: [
      {
        id: "p5-math-upper-primary",
        subject: "maths",
        label: "Fractions, decimals, percentage, ratio foundations",
        answerMode: "typed",
        promptTypes: ["compute routine fraction/decimal", "percentage of quantity", "simple ratio interpretation"],
        successLooksLike: ["handles routine upper-primary calculations"],
        diagnosticTags: ["math-place-value", "math-multistep-reasoning"],
        examples: ["25% of 80 = ?", "Write 2:3 as a statement about marbles"]
      },
      {
        id: "p5-math-model-method-lite",
        subject: "maths",
        label: "Comparison and part-whole problem sums",
        answerMode: "mcq",
        promptTypes: ["difference comparison", "fraction as operator", "unit-rate lite"],
        successLooksLike: ["maps structure instead of keyword hunting"],
        diagnosticTags: ["math-word-problem-translation", "math-multistep-reasoning"],
        examples: ["Tom has 3/5 as many stickers as Ana... which working fits?"]
      },
      {
        id: "p5-word-academic",
        subject: "word-skills",
        label: "Academic vocabulary and derivational morphology",
        answerMode: "typed",
        promptTypes: ["prefix/suffix transformation", "choose precise word", "correct derived form"],
        successLooksLike: ["controls meaning shifts across word families"],
        diagnosticTags: ["word-morphology-vocab"],
        examples: ["decide → decision", "act → action"]
      },
      {
        id: "p5-word-confusables",
        subject: "word-skills",
        label: "Common confusable spellings",
        answerMode: "mcq",
        promptTypes: ["their/there/they’re style contrasts", "stationary/stationery-type pairs"],
        successLooksLike: ["uses context plus orthography"],
        diagnosticTags: ["word-pattern-transfer", "word-morphology-vocab"],
        examples: ["The bus is __. (stationary/stationery)"]
      }
    ],
    sampleLexicon: ["decision", "operation", "percentage", "comparison", "stationary", "curiosity"],
    implementationNotes: [
      "Typed maths is appropriate for direct numerical answers.",
      "For battle flow, surface only short-answer typed items; route long reasoning items to MCQ working-choice formats.",
      "Upper-primary spelling should log morphology failures separately from pure phonics errors."
    ]
  },
  p6: {
    stage: "p6",
    label: "Primary 6",
    ageBand: "~11-12",
    singaporeAlignment: ["Upper Primary / PSLE-adjacent Mathematics: integrated problem solving", "Upper Primary English: accurate spelling, vocabulary discrimination, morphology"],
    mathsFocus: ["fractions", "measurement-time-money", "geometry", "word-problems", "place-value"],
    wordFocus: ["vocabulary", "morphology", "spelling-patterns", "reading-comprehension-lite"],
    recommendedBossMix: { mathsShare: 0.65, wordShare: 0.35 },
    questionBands: [
      {
        id: "p6-math-psle-lite",
        subject: "maths",
        label: "Integrated routine PSLE-style skills",
        answerMode: "typed",
        promptTypes: ["ratio/percentage/fraction conversions", "speed or average lite", "area-volume basic", "multi-step arithmetic"],
        successLooksLike: ["solves concise multi-step numeric tasks accurately"],
        diagnosticTags: ["math-multistep-reasoning", "math-word-problem-translation"],
        examples: ["15% of a number is 12. What is the number?", "Convert 3/4 to a percentage"]
      },
      {
        id: "p6-math-strategy-choice",
        subject: "maths",
        label: "Choose best setup for a problem sum",
        answerMode: "mcq",
        promptTypes: ["which equation fits", "which model works", "spot operation trap"],
        successLooksLike: ["strategy selection before computation"],
        diagnosticTags: ["math-word-problem-translation", "math-multistep-reasoning"],
        examples: ["Which equation matches this ratio story?"]
      },
      {
        id: "p6-word-precision",
        subject: "word-skills",
        label: "Precise spelling and academic word choice",
        answerMode: "typed",
        promptTypes: ["type correctly spelt word", "choose most precise synonym", "derive correct noun/adjective form"],
        successLooksLike: ["controls complex but common school vocabulary"],
        diagnosticTags: ["word-morphology-vocab", "word-pattern-transfer"],
        examples: ["explain → explanation", "Which word best replaces 'good' in a formal sentence?"]
      },
      {
        id: "p6-word-editing",
        subject: "word-skills",
        label: "Editing-style spelling discrimination",
        answerMode: "mcq",
        promptTypes: ["spot error", "choose correction", "meaning-sensitive word choice"],
        successLooksLike: ["notices subtle spelling/meaning mismatches"],
        diagnosticTags: ["word-pattern-transfer", "word-morphology-vocab"],
        examples: ["Which underlined word is wrong?"]
      }
    ],
    sampleLexicon: ["explanation", "equivalent", "percentage", "operation", "efficient", "strategy"],
    implementationNotes: [
      "Typed mode should dominate direct answers by P6.",
      "Keep battle prompts concise: short stems, one clear target, no paragraph reading load.",
      "Separate 'calculation mistake' from 'strategy mistake' in analytics."
    ]
  }
};

export const MODE_CURRICULUM_CLUSTERS: Record<DifficultyMode, ModeCurriculumCluster> = {
  sprout: {
    mode: "sprout",
    label: "Sprout",
    stages: ["k1", "k2", "p1"],
    ageBand: "K1-P1",
    rationale: "Early-learning lane: emphasis on concrete numeracy, phonics, and short patterned words.",
    answerModePolicy: {
      maths: "mcq",
      wordSkills: "hybrid",
      notes: [
        "Default to MCQ during live combat.",
        "Allow typed only for single letters, missing short chunks, or very short numerals."
      ]
    },
    operationalRules: [
      "Cap maths mostly at one-step tasks.",
      "Prefer visual or orally scannable prompts.",
      "Do not penalise keyboarding ability more than content knowledge."
    ]
  },
  spark: {
    mode: "spark",
    label: "Spark",
    stages: ["p2", "p3", "p4"],
    ageBand: "P2-P4",
    rationale: "Middle-primary lane: consolidate arithmetic fluency, introduce fractions/problem sums, and move from phonics to spelling patterns and morphology.",
    answerModePolicy: {
      maths: "hybrid",
      wordSkills: "hybrid",
      notes: [
        "Use typed for short direct answers and routine spelling completions.",
        "Use MCQ when the learning target is reasoning path selection rather than transcription."
      ]
    },
    operationalRules: [
      "Mix one-step fluency items with light two-step reasoning.",
      "Typed word answers should usually be 4-10 letters, not full sentences.",
      "Keep diagnostic buckets separate for fact fluency vs problem translation."
    ]
  },
  comet: {
    mode: "comet",
    label: "Comet",
    stages: ["p5", "p6"],
    ageBand: "P5-P6",
    rationale: "Upper-primary lane: concise but challenging problem solving and precise vocabulary/spelling control.",
    answerModePolicy: {
      maths: "typed",
      wordSkills: "hybrid",
      notes: [
        "Typed direct answers should be standard for routine maths calculations.",
        "Keep MCQ for strategy-selection or meaning discrimination items."
      ]
    },
    operationalRules: [
      "Allow multi-step maths, but keep reading load compact.",
      "Prefer typed spelling for longer target words to improve diagnostic value.",
      "Track strategy errors separately from careless slips."
    ]
  }
};

export const MODE_CONFIG_FROM_CURRICULUM: Record<
  DifficultyMode,
  {
    label: string;
    ageBand: string;
    subtitle: string;
    playerMaxHp: number;
    bossMaxHp: number;
    correctDamage: number;
    wrongDamage: number;
    mathMax: number;
    allowTwoStepMath: boolean;
    spellingWords: string[];
  }
> = {
  sprout: {
    label: "Sprout",
    ageBand: "K1-P1",
    subtitle: "Singapore early-years lane: phonics, counting, number bonds, and simple word building",
    playerMaxHp: 120,
    bossMaxHp: 90,
    correctDamage: 22,
    wrongDamage: 11,
    mathMax: 10,
    allowTwoStepMath: false,
    spellingWords: [
      ...STAGE_CURRICULUM.k1.sampleLexicon,
      ...STAGE_CURRICULUM.k2.sampleLexicon,
      ...STAGE_CURRICULUM.p1.sampleLexicon
    ]
  },
  spark: {
    label: "Spark",
    ageBand: "P2-P4",
    subtitle: "Singapore middle-primary lane: regrouping, tables, fractions, spelling patterns, and morphology",
    playerMaxHp: 100,
    bossMaxHp: 105,
    correctDamage: 20,
    wrongDamage: 14,
    mathMax: 18,
    allowTwoStepMath: true,
    spellingWords: [
      ...STAGE_CURRICULUM.p2.sampleLexicon,
      ...STAGE_CURRICULUM.p3.sampleLexicon,
      ...STAGE_CURRICULUM.p4.sampleLexicon
    ]
  },
  comet: {
    label: "Comet",
    ageBand: "P5-P6",
    subtitle: "Singapore upper-primary lane: multi-step maths, percentages, ratios, and precise spelling/vocabulary",
    playerMaxHp: 92,
    bossMaxHp: 120,
    correctDamage: 18,
    wrongDamage: 17,
    mathMax: 24,
    allowTwoStepMath: true,
    spellingWords: [
      ...STAGE_CURRICULUM.p5.sampleLexicon,
      ...STAGE_CURRICULUM.p6.sampleLexicon
    ]
  }
};

export const getCurriculumStagesForMode = (mode: DifficultyMode) =>
  MODE_CURRICULUM_CLUSTERS[mode].stages.map((stage) => STAGE_CURRICULUM[stage]);
