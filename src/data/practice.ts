import type { ChordQuality } from "../types/music";
import { QUALITY_LABELS } from "../types/music";
import {
  CHORD_FORMULAS,
  FORMULA_LIST,
  INTERVALS,
  intervalOf,
  noteToPc,
  pcToName,
  spellChordTones,
  theoryChordMidis,
} from "./theory";
import { MAJOR_DEGREES } from "./diatonic";

/**
 * 樂理練習題庫：把觀念拆成一個個「單元」，每個單元只練一件事，
 * 全部單元達到精通標準（80%）後解鎖綜合測驗。
 */

export interface Question {
  prompt: string;
  options: string[];
  answerIndex: number;
  explanation: string;
  soundMidis?: number[];
  soundLabel?: string;
}

export interface PracticeUnit {
  id: string;
  title: string;
  emoji: string;
  /** 這個單元在練什麼 */
  tagline: string;
  /** 完成後應該學會的觀念 */
  goals: string[];
  build: () => Question[];
}

/** 精通標準：單輪答對率需達 80% */
export const MASTERY_RATIO = 0.8;

const ROOTS = ["C", "D", "E", "F", "G", "A", "B"] as const;

function shuffle<T>(arr: readonly T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function pick<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function pickN<T>(arr: readonly T[], n: number): T[] {
  return shuffle(arr).slice(0, n);
}

function withOptions(correct: string, distractors: string[]) {
  const options = shuffle([correct, ...distractors]);
  return { options, answerIndex: options.indexOf(correct) };
}

/** 依出題器產生一輪題目，避免重複題 */
function buildRound(
  gens: readonly (() => Question)[],
  count: number,
): Question[] {
  const order: (() => Question)[] = [];
  while (order.length < count) order.push(...shuffle(gens));
  const questions: Question[] = [];
  for (const gen of order.slice(0, count)) {
    let q = gen();
    let guard = 0;
    while (questions.some((x) => x.prompt === q.prompt) && guard++ < 10) {
      q = gen();
    }
    questions.push(q);
  }
  return questions;
}

const SEMITONE_MEMO =
  "速記：大二度 2、小三度 3、大三度 4、完全四度 5、減五度 6、完全五度 7、" +
  "大六度 9、小七度 10、大七度 11、大九度 14 個半音。";

// ── 單元 1：音程 ─────────────────────────────

/** 給兩個音，認音程名稱 */
function genIntervalNameQuestion(): Question {
  const root = pick(ROOTS);
  const candidates = INTERVALS.filter((i) => i.semitones !== 0);
  const iv = pick(candidates);
  const target = spellChordTones(root, [iv.semitones])[0];
  const distractors = pickN(
    candidates.filter((x) => x.semitones !== iv.semitones),
    3,
  ).map((x) => x.name);
  return {
    prompt: `從 ${root} 往上到 ${target}（相距 ${iv.semitones} 個半音）是什麼音程？`,
    ...withOptions(iv.name, distractors),
    explanation: `${iv.semitones} 個半音是${iv.name}。${SEMITONE_MEMO}`,
  };
}

/** 給根音與音程，推算目標音（排除大九度，避免與大二度同音名） */
function genIntervalNoteQuestion(): Question {
  const root = pick(ROOTS);
  const candidates = INTERVALS.filter(
    (i) => i.semitones !== 0 && i.semitones < 12,
  );
  const iv = pick(candidates);
  const target = spellChordTones(root, [iv.semitones])[0];
  const others = [
    ...new Set(
      candidates
        .filter((x) => x.semitones !== iv.semitones)
        .map((x) => spellChordTones(root, [x.semitones])[0]),
    ),
  ].filter((n) => n !== target);
  return {
    prompt: `從 ${root} 往上一個${iv.name}（${iv.degree}），會到哪個音？`,
    ...withOptions(target, pickN(others, 3)),
    explanation: `${iv.name} ＝ ${iv.semitones} 個半音：從 ${root} 往上數 ${iv.semitones} 格就是 ${target}。`,
  };
}

/** 音程名稱 → 半音數 */
function genSemitoneQuestion(): Question {
  const candidates = INTERVALS.filter((i) => i.semitones !== 0);
  const iv = pick(candidates);
  const distractors = pickN(
    candidates.filter((x) => x.semitones !== iv.semitones),
    3,
  ).map((x) => `${x.semitones} 個半音`);
  return {
    prompt: `${iv.name}（級數記號 ${iv.degree}）等於幾個半音？`,
    ...withOptions(`${iv.semitones} 個半音`, distractors),
    explanation: `${iv.name} ＝ ${iv.semitones} 個半音。${SEMITONE_MEMO}`,
  };
}

// ── 單元 2 / 4：拼和弦與認和弦（依和弦池出題）──────────

const TRIAD_QUALITIES: ChordQuality[] = [
  "major", "minor", "power", "sus2", "sus4", "dim",
];
const SEVENTH_QUALITIES: ChordQuality[] = [
  "dominant7", "major7", "minor7", "m7b5", "add9", "6", "m6",
];

function formulasOf(qualities: ChordQuality[]) {
  return FORMULA_LIST.filter((f) => qualities.includes(f.quality));
}

/** 說出和弦的組成音 */
function genTonesQuestion(qualities: ChordQuality[]): Question {
  const pool = formulasOf(qualities);
  const root = pick(ROOTS);
  const f = pick(pool);
  const name = root + f.suffix;
  const tones = spellChordTones(root, f.intervals);
  const distractors = pickN(
    pool.filter((x) => x.quality !== f.quality),
    3,
  ).map((x) => spellChordTones(root, x.intervals).join(" · "));
  const degrees = f.intervals.map((s) => intervalOf(s).degree).join("·");
  return {
    prompt: `${name}（${QUALITY_LABELS[f.quality]}）的組成音是？`,
    ...withOptions(tones.join(" · "), distractors),
    explanation: `${name} ＝ ${f.buildText}，級數 ${degrees}，也就是 ${tones.join("·")}。`,
    soundMidis: theoryChordMidis(root, f.intervals),
    soundLabel: name,
  };
}

/** 由組成音反推和弦 */
function genIdentifyQuestion(qualities: ChordQuality[]): Question {
  const pool = formulasOf(qualities);
  const root = pick(ROOTS);
  const f = pick(pool);
  const name = root + f.suffix;
  const tones = spellChordTones(root, f.intervals);
  const distractors = pickN(
    pool.filter((x) => x.quality !== f.quality),
    3,
  ).map((x) => root + x.suffix);
  return {
    prompt: `組成音 ${tones.join(" · ")} 疊出來的是什麼和弦？`,
    ...withOptions(name, distractors),
    explanation: `${name}（${QUALITY_LABELS[f.quality]}）＝ ${f.buildText}。`,
    soundMidis: theoryChordMidis(root, f.intervals),
    soundLabel: name,
  };
}

// ── 單元 3：和弦變化 ──────────────────────────

function genTransformQuestion(): Question {
  const root = pick(ROOTS);
  const maj = spellChordTones(root, CHORD_FORMULAS.major.intervals);
  const kinds: ChordQuality[] = [
    "minor", "sus2", "sus4", "dominant7", "major7", "minor7", "power",
  ];
  const kind = pick(kinds);
  const f = CHORD_FORMULAS[kind];
  const resultName = root + f.suffix;
  const resultTones = spellChordTones(root, f.intervals);

  let prompt: string;
  let distractors: string[];
  switch (kind) {
    case "minor":
      prompt = `${root} 和弦（${maj.join("·")}）的大三度 ${maj[1]} 降半音，會變成什麼和弦？`;
      distractors = [`${root}sus2`, `${root}7`, `${root}5`];
      break;
    case "sus2":
      prompt = `把 ${root} 和弦的三度音 ${maj[1]} 換成大二度，會變成什麼和弦？`;
      distractors = [`${root}m`, `${root}sus4`, `${root}5`];
      break;
    case "sus4":
      prompt = `把 ${root} 和弦的三度音 ${maj[1]} 往上半音換成完全四度，會變成什麼和弦？`;
      distractors = [`${root}sus2`, `${root}m`, `${root}maj7`];
      break;
    case "dominant7":
      prompt = `在 ${root} 和弦（1·3·5）上再疊一個小七度，會變成什麼和弦？`;
      distractors = [`${root}maj7`, `${root}m7`, `${root}sus4`];
      break;
    case "major7":
      prompt = `在 ${root} 和弦（1·3·5）上再疊一個大七度，會變成什麼和弦？`;
      distractors = [`${root}7`, `${root}m7`, `${root}m`];
      break;
    case "minor7":
      prompt = `在 ${root}m 和弦（1·♭3·5）上再疊一個小七度，會變成什麼和弦？`;
      distractors = [`${root}7`, `${root}maj7`, `${root}sus2`];
      break;
    case "power":
      prompt = `拿掉 ${root} 和弦的三度音、只留下 1 和 5，會變成什麼和弦？`;
      distractors = [`${root}sus2`, `${root}m`, `${root}sus4`];
      break;
    default:
      throw new Error(`未支援的變化題型：${kind}`);
  }

  return {
    prompt,
    ...withOptions(resultName, distractors),
    explanation: `${resultName} ＝ ${f.buildText}（${resultTones.join("·")}）。${f.changeText}`,
    soundMidis: theoryChordMidis(root, f.intervals),
    soundLabel: resultName,
  };
}

// ── 單元 5：使用時機 ──────────────────────────

interface UsageScenario {
  quality: ChordQuality;
  /** 實戰情境描述（不可直接說出答案的和弦名） */
  scenario: string;
}

const USAGE_SCENARIOS: UsageScenario[] = [
  {
    quality: "major",
    scenario: "校園民謠彈唱，需要最單純、明亮、穩定的聲響當歌曲的「家」",
  },
  {
    quality: "minor",
    scenario: "同一個根音，只想動一個音就把明亮變憂鬱",
  },
  {
    quality: "power",
    scenario: "破音開到底的龐克 riff，聲音要乾淨有力、不能糊成一團",
  },
  {
    quality: "sus2",
    scenario: "前奏的分解和弦想要空靈、飄浮、聽不出大小調的聲音",
  },
  {
    quality: "sus4",
    scenario: "副歌前想把聽眾吊住——緊繃、懸而未決，下一拍解決回大三和弦",
  },
  {
    quality: "add9",
    scenario: "J-pop 鋼琴系伴奏：要比三和弦更亮更現代，但仍要有明確的大調感",
  },
  {
    quality: "6",
    scenario: "老歌收尾：想要復古溫暖、又不帶七和弦都會感的結束聲響",
  },
  {
    quality: "m6",
    scenario: "小調歌想收得優雅、帶點爵士的煙燻味",
  },
  {
    quality: "dominant7",
    scenario: "12 小節藍調的每一級和弦，或想用力把音樂推回主和弦時",
  },
  {
    quality: "major7",
    scenario: "City Pop 的慵懶都會感，段落停在這個和弦不動也好聽",
  },
  {
    quality: "minor7",
    scenario: "Funk 節奏吉他：想要比小三和弦更圓潤放鬆的律動色",
  },
  {
    quality: "dim",
    scenario: "兩個相鄰和弦之間想墊一個極不穩定的半音橋，一拍就走",
  },
  {
    quality: "m7b5",
    scenario: "小調 II–V–I 進行的第一個和弦",
  },
];

function usageOption(q: ChordQuality): string {
  return `${QUALITY_LABELS[q]}（C${CHORD_FORMULAS[q].suffix}）`;
}

function usageQuestionFor(s: UsageScenario): Question {
  const f = CHORD_FORMULAS[s.quality];
  const distractors = pickN(
    FORMULA_LIST.filter((x) => x.quality !== s.quality),
    3,
  ).map((x) => usageOption(x.quality));
  return {
    prompt: `情境：${s.scenario}——該用哪種和弦？`,
    ...withOptions(usageOption(s.quality), distractors),
    explanation: `${QUALITY_LABELS[s.quality]}：${f.whenToUse}`,
    soundMidis: theoryChordMidis("C", f.intervals),
    soundLabel: "C" + f.suffix,
  };
}

// ── 單元 6：順階和弦（調性字典）───────────────────

function genDiatonicQuestion(): Question {
  const key = pick(ROOTS);
  const entry = pick(MAJOR_DEGREES);
  const rootName = pcToName(noteToPc(key) + entry.semitones);
  const f = CHORD_FORMULAS[entry.seventhQuality];
  const chordName = rootName + f.suffix;
  const explanation =
    `${key} 大調順階七和弦依序是 IM7・IIm7・IIIm7・IVM7・V7・VIm7・VIIm7♭5；` +
    `${entry.seventhNumeral} 的根音落在 ${rootName}，所以是 ${chordName}。`;
  const soundMidis = theoryChordMidis(rootName, f.intervals);

  if (Math.random() < 0.5) {
    const distractors = pickN(
      MAJOR_DEGREES.filter((d) => d !== entry),
      3,
    ).map(
      (d) =>
        pcToName(noteToPc(key) + d.semitones) +
        CHORD_FORMULAS[d.seventhQuality].suffix,
    );
    return {
      prompt: `${key} 大調的 ${entry.seventhNumeral} 是哪個和弦？`,
      ...withOptions(chordName, distractors),
      explanation,
      soundMidis,
      soundLabel: chordName,
    };
  }
  const distractors = pickN(
    MAJOR_DEGREES.filter((d) => d !== entry),
    3,
  ).map((d) => d.seventhNumeral);
  return {
    prompt: `${chordName} 在 ${key} 大調中是哪一級？`,
    ...withOptions(entry.seventhNumeral, distractors),
    explanation,
    soundMidis,
    soundLabel: chordName,
  };
}

// ── 單元定義 ────────────────────────────────

const genTriadTones = () => genTonesQuestion(TRIAD_QUALITIES);
const genTriadIdentify = () => genIdentifyQuestion(TRIAD_QUALITIES);
const genSeventhTones = () => genTonesQuestion(SEVENTH_QUALITIES);
const genSeventhIdentify = () => genIdentifyQuestion(SEVENTH_QUALITIES);

export const PRACTICE_UNITS: PracticeUnit[] = [
  {
    id: "intervals",
    title: "音程基礎",
    emoji: "📏",
    tagline: "所有和弦公式的量尺：先把「幾個半音是什麼音程」練到反射。",
    goals: [
      "看到兩個音，說出它們的音程名稱",
      "看到音程名稱，數出半音數與目標音",
    ],
    build: () =>
      buildRound(
        [genIntervalNameQuestion, genIntervalNoteQuestion, genSemitoneQuestion],
        9,
      ),
  },
  {
    id: "triads",
    title: "三和弦拼裝",
    emoji: "🧱",
    tagline: "大、小、強力、掛留、減——用 1·3·5 的積木拼出基本和弦。",
    goals: [
      "說出任一三和弦／掛留和弦的組成音",
      "看到一組音，反推它是什麼和弦",
    ],
    build: () => buildRound([genTriadTones, genTriadIdentify], 8),
  },
  {
    id: "transform",
    title: "和弦變化",
    emoji: "🔧",
    tagline: "「動哪個音會變成什麼」——和弦變化教室的核心觀念驗收。",
    goals: [
      "知道 3 降半音變 m、換成 2/4 變 sus",
      "知道疊 ♭7 變屬七、疊 7 變大七",
    ],
    build: () => buildRound([genTransformQuestion], 8),
  },
  {
    id: "sevenths",
    title: "七和弦與色彩",
    emoji: "🎨",
    tagline: "7、maj7、m7、m7♭5、add9、6——流行與爵士的調色盤。",
    goals: [
      "分清楚小七度(♭7)與大七度(7)疊出的差別",
      "說出各色彩和弦的組成音並能反推",
    ],
    build: () => buildRound([genSeventhTones, genSeventhIdentify], 8),
  },
  {
    id: "usage",
    title: "使用時機",
    emoji: "🎯",
    tagline: "樂理不是背公式：給你實戰情境，選出該用的和弦種類。",
    goals: [
      "知道每種和弦「什麼時候會用到」",
      "聽到需求（藍調／催淚／空靈…）能反射對應和弦",
    ],
    build: () => pickN(USAGE_SCENARIOS, 8).map(usageQuestionFor),
  },
  {
    id: "diatonic",
    title: "順階和弦",
    emoji: "📖",
    tagline: "調性字典驗收：任何大調的 I~VII 級都要能一秒反射。",
    goals: [
      "背熟 IM7・IIm7・IIIm7・IVM7・V7・VIm7・VIIm7♭5",
      "級數 ↔ 和弦代號雙向互推",
    ],
    build: () => buildRound([genDiatonicQuestion], 8),
  },
];

/** 綜合測驗：每個單元抽 2 題，全部單元精通後解鎖 */
export const FINAL_UNIT: PracticeUnit = {
  id: "final",
  title: "綜合測驗",
  emoji: "🏆",
  tagline: "六個單元各抽兩題混合出擊——全部答對代表樂理真的內化了。",
  goals: ["把所有觀念混在一起也不會亂"],
  build: () =>
    shuffle([
      ...buildRound(
        [genIntervalNameQuestion, genIntervalNoteQuestion, genSemitoneQuestion],
        2,
      ),
      ...buildRound([genTriadTones, genTriadIdentify], 2),
      ...buildRound([genTransformQuestion], 2),
      ...buildRound([genSeventhTones, genSeventhIdentify], 2),
      ...pickN(USAGE_SCENARIOS, 2).map(usageQuestionFor),
      ...buildRound([genDiatonicQuestion], 2),
    ]),
};
