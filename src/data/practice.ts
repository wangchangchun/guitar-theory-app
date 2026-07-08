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
import { MAJOR_DEGREES, MINOR_DEGREES } from "./diatonic";
import type { ScaleDef } from "./scales";
import { SCALES } from "./scales";
import { CIRCLE_KEYS } from "./circleOfFifths";

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
  /** 試聽播放方式：和弦齊響（預設）或琶音（音階用） */
  soundStyle?: "strum" | "arpeggio";
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
  "速記：小二度 1、大二度 2、小三度 3、大三度 4、完全四度 5、減五度 6、完全五度 7、" +
  "小六度 8、大六度 9、小七度 10、大七度 11、完全八度 12、大九度 14 個半音。";

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

// ── 單元 6：音階 ─────────────────────────────

const scaleDegreesOf = (s: ScaleDef) => s.degrees.join("·");

/** 說出音階的級數公式 */
function genScaleFormulaQuestion(): Question {
  const s = pick(SCALES);
  const distractors = pickN(
    SCALES.filter((x) => x.id !== s.id),
    3,
  ).map(scaleDegreesOf);
  return {
    prompt: `${s.name}的級數公式是？`,
    ...withOptions(scaleDegreesOf(s), distractors),
    explanation: `${s.name} ＝ ${scaleDegreesOf(s)}。${s.description}`,
    soundMidis: theoryChordMidis("C", [...s.intervals, 12]),
    soundLabel: `C ${s.name}`,
    soundStyle: "arpeggio",
  };
}

/** 拼出指定根音的音階組成音 */
function genScaleTonesQuestion(): Question {
  const root = pick(ROOTS);
  const s = pick(SCALES);
  const tonesOf = (x: ScaleDef) => spellChordTones(root, x.intervals).join(" ");
  const distractors = pickN(
    SCALES.filter((x) => x.id !== s.id),
    3,
  ).map(tonesOf);
  return {
    prompt: `${root} ${s.name}的組成音是？`,
    ...withOptions(tonesOf(s), distractors),
    explanation: `${s.name}的級數公式是 ${scaleDegreesOf(s)}，從 ${root} 出發就是 ${tonesOf(s)}。`,
    soundMidis: theoryChordMidis(root, [...s.intervals, 12]),
    soundLabel: `${root} ${s.name}`,
    soundStyle: "arpeggio",
  };
}

/** 音階使用情境（不可直接說出答案的音階名） */
const SCALE_SCENARIOS: { id: string; scenario: string }[] = [
  { id: "major", scenario: "流行搖滾的明亮旋律，想把「大調的聲音」刻進耳朵" },
  {
    id: "major-pentatonic",
    scenario: "南方搖滾／鄉村味的 solo，要陽光開朗、五個音怎麼彈都不出錯",
  },
  { id: "natural-minor", scenario: "搖滾 ballad 的憂鬱 solo，背景是 Am–F–C–G" },
  {
    id: "minor-pentatonic",
    scenario: "搖滾吉他手要背的第一條 solo 音階，加上推弦滑音就是經典搖滾腔",
  },
  { id: "blues", scenario: "12 小節藍調上想要「又髒又對味」的 solo" },
  {
    id: "harmonic-minor",
    scenario: "小調進行走到 V7 想要強力回家的拉力，或新古典金屬的異國速彈",
  },
  { id: "dorian", scenario: "放克搖滾、Santana 式的時髦小調 solo" },
  {
    id: "mixolydian",
    scenario: "AC/DC 式的經典搖滾 riff，或在屬七和弦上做大調系 solo",
  },
];

function scaleUsageQuestionFor(sc: { id: string; scenario: string }): Question {
  const s = SCALES.find((x) => x.id === sc.id)!;
  const distractors = pickN(
    SCALES.filter((x) => x.id !== s.id),
    3,
  ).map((x) => x.name);
  return {
    prompt: `情境：${sc.scenario}——該用哪條音階？`,
    ...withOptions(s.name, distractors),
    explanation: `${s.name}：${s.usage}`,
    soundMidis: theoryChordMidis("C", [...s.intervals, 12]),
    soundLabel: `C ${s.name}`,
    soundStyle: "arpeggio",
  };
}

// ── 單元 7：指型把位（五聲 box 與一弦三音）──────────

/** 五聲把位起點音（第 N 把位＝音階第 N 個音當第六弦起點） */
function genBoxStartQuestion(): Question {
  const root = pick(ROOTS);
  const s = SCALES.find((x) => x.id === "minor-pentatonic")!;
  const k = 1 + Math.floor(Math.random() * 4); // 第 2～5 把位
  const tones = s.intervals.map((iv) => spellChordTones(root, [iv])[0]);
  const correct = tones[k];
  const distractors = pickN(tones.filter((t) => t !== correct), 3);
  return {
    prompt: `${root} 小調五聲的第 ${k + 1} 把位，第六弦的起點是哪個音？`,
    ...withOptions(correct, distractors),
    explanation:
      `把位規則：第 N 把位就從音階的第 N 個音出發。` +
      `${root} 小調五聲＝${tones.join("·")}，第 ${k + 1} 個音是 ${correct}，` +
      `所以第 ${k + 1} 把位的第六弦起點就是它。`,
    soundMidis: theoryChordMidis(root, [...s.intervals, 12]),
    soundLabel: `${root} 小調五聲`,
    soundStyle: "arpeggio",
  };
}

/** 指型系統觀念（固定題庫） */
const FINGERING_CONCEPT_QUESTIONS: ConceptQuestion[] = [
  {
    prompt: "五聲音階在指板上共有幾個把位（box）？",
    correct: "5 個——每個音階音各當一次第六弦起點",
    distractors: ["3 個", "7 個——每個音級一個", "12 個——每格一個"],
    explanation:
      "五聲音階有 5 個音，每個音都可以當把位的第六弦起點，所以正好 5 個把位；沿指板一個接一個排，拼起來就是整片指板。",
  },
  {
    prompt: "「一弦三音（3NPS）」指的是什麼？",
    correct: "七聲音階每條弦固定彈 3 個音的指型系統",
    distractors: [
      "每三格換一次把位的移動方式",
      "只用三條弦彈音階",
      "和弦每弦只按三個音",
    ],
    explanation:
      "3NPS（Three Notes Per String）把大調／小調等七聲音階整理成每弦固定 3 個音、共 7 個把位的系統——音多、把位寬、換弦點固定。",
  },
  {
    prompt: "速彈和 legato 樂手偏愛一弦三音指型，主要原因是？",
    correct: "每弦音數固定，撥序與捶勾模式完全規律",
    distractors: [
      "音比較多聽起來比較厲害",
      "完全不需要移動把位",
      "只能用下撥所以比較簡單",
    ],
    explanation:
      "每弦都是 3 個音：交替撥弦的落點、捶勾（hammer-on／pull-off）的組合在每條弦上一模一樣，肌肉記憶可以無限複製——這就是速彈機器的祕密。",
  },
  {
    prompt: "五聲音階把位（box）裡，每條弦要按幾個音？",
    correct: "2 個",
    distractors: ["1 個", "3 個", "每條弦數量不同"],
    explanation:
      "五聲 box 每弦正好 2 音，手型緊湊、推弦揉弦空間大——這是它好背好彈的原因；相對地 3NPS 每弦 3 音。",
  },
  {
    prompt: "一弦三音系統共有幾個把位？",
    correct: "7 個——每個音級各起一個",
    distractors: ["5 個", "3 個", "6 個——每條弦一個"],
    explanation:
      "七聲音階有 7 個音，每個音都能當第六弦的把位起點，所以 3NPS 共 7 個把位。",
  },
  {
    prompt: "A 小調五聲第 1 把位（第 5 格起）跟哪個封閉和弦手型重疊？",
    correct: "E 手型的 Am 封閉和弦（根音在第六弦第 5 格）",
    distractors: [
      "A 手型的 Dm 封閉和弦",
      "C 手型的開放 C 和弦",
      "G 手型的開放 G 和弦",
    ],
    explanation:
      "第六弦第 5 格是 A：E 手型封閉和弦跟五聲第 1 把位共用根音與大部分位置——和弦按著不動就能找到 solo 音，這是「和弦與把位互相定位」（CAGED 思維）的第一步。",
  },
  {
    prompt: "為什麼五聲音階被稱為「怎麼彈都不太出錯」？",
    correct: "它拿掉了最容易和和弦打架的音（如大調的 4 和 7）",
    distractors: [
      "因為它音少所以只能彈得慢",
      "因為它只有根音和五度",
      "因為它每條弦的指型都一樣",
    ],
    explanation:
      "大調五聲＝大調去掉 4、7；小調五聲＝自然小調去掉 2、♭6——去掉的正是最容易與和弦撞出半音衝突的音，剩下的音對調內和弦幾乎都是安全音。",
  },
  {
    prompt: "把位跟把位之間要怎麼「接起來」貫通整個指板？",
    correct: "相鄰把位共用一半的音，沿同一條弦滑到共用音就換過去",
    distractors: [
      "彈完一個把位要停下來重新定位",
      "把位之間沒有關係，要分開背",
      "只能從第 1 把位照順序彈到第 5",
    ],
    explanation:
      "相鄰把位是同一組音的不同切法：第 N 把位高把位側的音＝第 N+1 把位低把位側的音。在任一條弦上滑一格到共用音，就無縫接到下一個把位。",
  },
];

// ── 單元 8：順階和弦（調性字典）───────────────────

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

/** 自然小調順階七和弦（調性字典的小調模式） */
function genMinorDiatonicQuestion(): Question {
  const key = pick(ROOTS);
  // 小調的降記號調（Dm/Gm/Cm/Fm）用降記號拼音才正確
  const useFlats = ["C", "D", "F", "G"].includes(key);
  const entry = pick(MINOR_DEGREES);
  const rootName = pcToName(noteToPc(key) + entry.semitones, useFlats);
  const f = CHORD_FORMULAS[entry.seventhQuality];
  const chordName = rootName + f.suffix;
  const explanation =
    `${key} 小調（自然小調）順階七和弦依序是 Im7・IIm7♭5・♭IIIM7・IVm7・Vm7・♭VIM7・♭VII7；` +
    `${entry.seventhNumeral} 的根音落在 ${rootName}，所以是 ${chordName}。`;
  const soundMidis = theoryChordMidis(rootName, f.intervals);

  if (Math.random() < 0.5) {
    const distractors = pickN(
      MINOR_DEGREES.filter((d) => d !== entry),
      3,
    ).map(
      (d) =>
        pcToName(noteToPc(key) + d.semitones, useFlats) +
        CHORD_FORMULAS[d.seventhQuality].suffix,
    );
    return {
      prompt: `${key} 小調的 ${entry.seventhNumeral} 是哪個和弦？`,
      ...withOptions(chordName, distractors),
      explanation,
      soundMidis,
      soundLabel: chordName,
    };
  }
  const distractors = pickN(
    MINOR_DEGREES.filter((d) => d !== entry),
    3,
  ).map((d) => d.seventhNumeral);
  return {
    prompt: `${chordName} 在 ${key} 小調（自然小調）中是哪一級？`,
    ...withOptions(entry.seventhNumeral, distractors),
    explanation,
    soundMidis,
    soundLabel: chordName,
  };
}

// ── 單元 8：進行與功能 ──────────────────────────

/** 關係大小調互推 */
function genRelativeKeyQuestion(): Question {
  const key = pick(ROOTS);
  const rel = pcToName(noteToPc(key) + 9);
  const explanation =
    `大調主音往下小三度（3 個半音）就是關係小調：${key} 大調與 ${rel} 小調共用同一組音——` +
    `${rel} 小調就是 ${key} 大調從第六個音出發的重新排列，所以 solo 時兩者的音階可以互換。`;
  const minorNames = ROOTS.map((r) => `${pcToName(noteToPc(r) + 9)} 小調`);
  const majorNames = ROOTS.map((r) => `${r} 大調`);
  if (Math.random() < 0.5) {
    const correct = `${rel} 小調`;
    return {
      prompt: `${key} 大調的「關係小調」（共用同一組音的小調）是？`,
      ...withOptions(correct, pickN(minorNames.filter((n) => n !== correct), 3)),
      explanation,
    };
  }
  const correct = `${key} 大調`;
  return {
    prompt: `${rel} 小調的「關係大調」（共用同一組音的大調）是？`,
    ...withOptions(correct, pickN(majorNames.filter((n) => n !== correct), 3)),
    explanation,
  };
}

interface ConceptQuestion {
  prompt: string;
  correct: string;
  distractors: string[];
  explanation: string;
}

/** 歌曲進行頁教到的功能和聲觀念：借用、副屬、著名進行、斜線和弦、轉調 */
const CONCEPT_QUESTIONS: ConceptQuestion[] = [
  {
    prompt: "大調進行裡，最想「回家」解決到 I 的和弦是哪一級？",
    correct: "V（屬和弦）",
    distractors: ["IV（下屬）", "IIm（下屬代理）", "VIm（主代理）"],
    explanation:
      "V（尤其是 V7）帶著往 I 強烈解決的傾向——V7→I 是所有終止式的原型，聽到屬七就想回家。",
  },
  {
    prompt: "C 大調的歌想用「催淚彈」借用和弦 IVm，實際要按哪個和弦？",
    correct: "Fm",
    distractors: ["Dm", "Gm", "Am"],
    explanation:
      "C 大調的 IV 是 F；從平行小調（C 小調）借來的 IVm 就是 Fm——F 裡的 A 音降成 A♭，只動半音就讓陽光轉陰。",
  },
  {
    prompt: "C 大調進行中突然出現 E7 把音樂推向 Am，這個 E7 叫什麼？",
    correct: "副屬和弦（V/VIm）",
    distractors: ["借用和弦", "掛留和弦", "經過減和弦"],
    explanation:
      "E7 是 Am 的屬和弦——調外的屬七專門用來推向某個調內和弦，稱為副屬和弦（Secondary Dominant），記作 V/VIm。丸サ進行的 E7 就是它。",
  },
  {
    prompt: "「II–V–I」在 C 大調的七和弦版本是？",
    correct: "Dm7 – G7 – Cmaj7",
    distractors: ["Em7 – Am7 – Dm7", "Fmaj7 – G7 – Am7", "Dm7 – E7 – Am7"],
    explanation:
      "II–V–I 是最經典的回家路線：下屬代理 IIm7 → 屬 V7 → 主 IM7，爵士與流行到處都是它。",
  },
  {
    prompt: "♭VI–♭VII–I 熱血終止裡的 ♭VI 和 ♭VII 是從哪裡借來的？",
    correct: "平行小調（同主音小調）",
    distractors: ["關係小調", "五度圈隔壁的調", "Mixolydian 調式"],
    explanation:
      "C 大調借用 C 小調的 A♭（♭VI）與 B♭（♭VII），全音階梯一路爬回 I——動漫主題歌式的熱血收尾。",
  },
  {
    prompt: "12 小節藍調用到哪三個級數的和弦？",
    correct: "I7、IV7、V7",
    distractors: ["I、VIm、IV", "IIm7、V7、IM7", "I5、♭VI、♭VII"],
    explanation:
      "藍調把 I、IV、V 三個級數全部彈成屬七和弦，排成固定的 12 小節；最後回 V7 的小節叫 turnaround，把音樂拉回開頭再來一輪。",
  },
  {
    prompt: "IVM7–V7–IIIm7–VIm7 是哪個著名進行？",
    correct: "王道進行",
    distractors: ["卡農進行", "小室進行", "50 年代進行"],
    explanation:
      "J-pop 出現率最高的王道進行：從 IV 起手一開始就懸浮，V 推進、IIIm7 過渡、VIm7 收進溫柔的小調感。",
  },
  {
    prompt: "VIm–IV–V–I 是哪個著名進行？",
    correct: "小室進行",
    distractors: ["王道進行", "丸サ進行", "卡農進行"],
    explanation:
      "小調開頭、大調收尾的小室進行：VIm 憂鬱起跑、IV–V 標準推進、最後亮亮地落在 I。",
  },
  {
    prompt: "C–G–Am–Em–F–C–F–G 的低音一路級進下行，這是哪個進行？",
    correct: "卡農進行",
    distractors: ["王道進行", "12 小節藍調", "西班牙下行"],
    explanation:
      "低音 C–B–A–G–F–E–F–G 級進下行，就是帕海貝爾卡農的和聲——溫暖懷舊、越走越開闊，抒情大合唱的長青樹。",
  },
  {
    prompt: "和弦記號「C/B」的意思是？",
    correct: "彈 C 和弦、用 B 當最低音",
    distractors: [
      "C 和 B 兩個和弦快速交替",
      "C 和弦省略 B 音",
      "B 調上的 C 和弦",
    ],
    explanation:
      "斜線（分數）和弦：斜線左邊是和弦、右邊是指定低音。C/B 常用來做 C–B–A–G 的級進低音線。",
  },
  {
    prompt: "整首歌最後一次副歌突然全體升半音，這個手法叫？",
    correct: "轉調（升 Key）",
    distractors: ["借用和弦", "副屬和弦", "掛留解決"],
    explanation:
      "最後副歌升 Key 是流行樂經典的轉調手法：所有和弦一起升半音（或全音），情緒瞬間再拉高一層。歌曲進行頁的「転調↑」開關就是在模擬它。",
  },
  {
    prompt: "自然小調的 Vm 拉力不夠時，通常怎麼加強「回家」的力量？",
    correct: "借和聲小調，把 Vm 換成 V7",
    distractors: ["把 Im 換成 I7", "把 IVm 換成 IV", "把 ♭VII 升成 VII"],
    explanation:
      "自然小調的 V 是小和弦、解決力弱；把 ♭7 級音升半音（和聲小調）讓 V 變成大三／屬七，V7→Im 的拉力就回來了。西班牙下行最後的 E 大三和弦就是這麼來的。",
  },
];

function conceptQuestionFor(c: ConceptQuestion): Question {
  return {
    prompt: c.prompt,
    ...withOptions(c.correct, [...c.distractors]),
    explanation: c.explanation,
  };
}

// ── 單元 9：五度圈 ──────────────────────────

const SIGNATURE_MEMO =
  "調號速記：C 在頂端無升降；從 C 順時針走幾格就有幾個 ♯（G 1♯、D 2♯…），" +
  "逆時針走幾格就有幾個 ♭（F 1♭、B♭ 2♭…）。";

/** 五度圈相鄰調（順時針 = V 方向、逆時針 = IV 方向） */
function genCircleNeighborQuestion(): Question {
  const i = Math.floor(Math.random() * CIRCLE_KEYS.length);
  const k = CIRCLE_KEYS[i];
  const cw = CIRCLE_KEYS[(i + 1) % 12];
  const ccw = CIRCLE_KEYS[(i + 11) % 12];
  const majorsExcept = (names: string[]) =>
    pickN(
      CIRCLE_KEYS.filter((x) => !names.includes(x.major)).map((x) => x.major),
      3,
    );
  if (Math.random() < 0.5) {
    return {
      prompt: `五度圈上，${k.major} 大調順時針的下一格（主音往上完全五度）是哪個調？`,
      ...withOptions(cw.major, majorsExcept([cw.major])),
      explanation:
        `${k.major} 往上完全五度是 ${cw.major}——它正是 ${k.major} 大調的 V 級根音；` +
        `順時針一格＝屬（V）方向，調號多一個 ♯。`,
      soundMidis: theoryChordMidis(cw.major, CHORD_FORMULAS.major.intervals),
      soundLabel: cw.major,
    };
  }
  return {
    prompt: `五度圈上，${k.major} 大調逆時針的下一格（主音往上完全四度）是哪個調？`,
    ...withOptions(ccw.major, majorsExcept([ccw.major])),
    explanation:
      `${k.major} 往上完全四度是 ${ccw.major}——它正是 ${k.major} 大調的 IV 級根音；` +
      `逆時針一格＝下屬（IV）方向，調號多一個 ♭。II–V–I 這類「五度下行」進行就是沿逆時針走。`,
    soundMidis: theoryChordMidis(ccw.major, CHORD_FORMULAS.major.intervals),
    soundLabel: ccw.major,
  };
}

/** 使用情境：挑轉調目標（平滑的近親調 vs 戲劇化的正對面） */
function genCircleModulationQuestion(): Question {
  const i = Math.floor(Math.random() * CIRCLE_KEYS.length);
  const k = CIRCLE_KEYS[i];
  const cw = CIRCLE_KEYS[(i + 1) % 12].major;
  const ccw = CIRCLE_KEYS[(i + 11) % 12].major;
  const opposite = CIRCLE_KEYS[(i + 6) % 12].major;
  if (Math.random() < 0.5) {
    const correct = pick([cw, ccw]);
    const farKeys = pickN(
      [4, 5, 6, 7, 8].map((o) => CIRCLE_KEYS[(i + o) % 12].major),
      3,
    );
    return {
      prompt: `情境：你用 ${k.major} 大調寫歌，副歌想平滑轉調到「只差一個音」的近親調——五度圈上該挑哪個大調？`,
      ...withOptions(correct, farKeys),
      explanation:
        `${k.major} 在五度圈的相鄰兩格是 ${ccw}（IV 方向）與 ${cw}（V 方向），調內音只差一個、` +
        `轉過去最平滑；走得越遠差的音越多，正對面的 ${opposite} 反差最大。`,
    };
  }
  return {
    prompt: `情境：${k.major} 大調的橋段想來一次最遠、反差最大的戲劇化轉調——五度圈上挑哪個調？`,
    ...withOptions(opposite, [cw, ccw, CIRCLE_KEYS[(i + 2) % 12].major]),
    explanation:
      `正對面（相隔 6 格）的 ${opposite} 和 ${k.major} 共用的調內音最少，聽感反差最大；` +
      `相鄰的 ${ccw}、${cw} 則是只差一個音的平滑近親調。`,
  };
}

/** 使用情境：用五度圈找 I–IV–V */
function genCircleFourFiveQuestion(): Question {
  const i = Math.floor(Math.random() * CIRCLE_KEYS.length);
  const k = CIRCLE_KEYS[i];
  const cw = CIRCLE_KEYS[(i + 1) % 12].major;
  const ccw = CIRCLE_KEYS[(i + 11) % 12].major;
  const correct = `IV＝${ccw}、V＝${cw}`;
  const distractors = [
    `IV＝${cw}、V＝${ccw}`,
    `IV＝${CIRCLE_KEYS[(i + 10) % 12].major}、V＝${CIRCLE_KEYS[(i + 2) % 12].major}`,
    `IV＝${ccw}、V＝${CIRCLE_KEYS[(i + 2) % 12].major}`,
  ];
  return {
    prompt: `情境：${k.major} 大調的歌要刷 I–IV–V 三和弦，用五度圈找 IV 和 V 的根音——答案是？`,
    ...withOptions(correct, distractors),
    explanation:
      `I·IV·V 在五度圈上永遠相鄰三格：逆時針隔壁是 IV（${ccw}）、順時針隔壁是 V（${cw}）。` +
      `所以 ${k.major} 大調的三大和弦就是 ${k.major}、${ccw}、${cw}——不用數音、看圈就好。`,
  };
}

/** 五度圈使用情境（固定題庫） */
const CIRCLE_CONCEPT_QUESTIONS: ConceptQuestion[] = [
  {
    prompt: "情境：進行 A7→D7→G7→C 一個推一個回家，這在五度圈上是什麼方向？",
    correct: "逆時針（五度下行）",
    distractors: ["順時針（五度上行）", "跳到正對面", "沿內圈走一圈"],
    explanation:
      "每個和弦都是下一個的屬和弦（V→I 連鎖），根音一路往上四度＝五度圈逆時針。副屬和弦鏈、II–V–I 都沿這個方向走，所以逆時針又叫「回家的方向」。",
  },
  {
    prompt: "情境：拿到一份譜，調號有 4 個 ♯，用五度圈怎麼判斷調性？",
    correct: "從 C 順時針數 4 格 → E 大調（或關係小調 C#m）",
    distractors: [
      "從 C 逆時針數 4 格 → A♭ 大調",
      "從 C 順時針數 4 格的內圈 → Fm",
      "調號跟五度圈無關，只能背",
    ],
    explanation:
      "順時針一格多一個 ♯：G(1♯)→D(2♯)→A(3♯)→E(4♯)。同格內圈的 C#m 是關係小調、調號相同——看旋律最後停在哪個主音，就知道是 E 大調還是 C#m 小調。",
  },
  {
    prompt: "情境：Am 小調的歌想借大調五聲的把位來 solo，該用哪個調的音？",
    correct: "C 大調（Am 的關係大調）",
    distractors: ["A 大調", "E 大調", "F 大調"],
    explanation:
      "五度圈同一格的內外圈共用同一組音：Am 的關係大調就是外圈的 C。A 小調五聲和 C 大調五聲是同一組音，指型直接共用，只是根音的落點不同。",
  },
];

/** 調號 ↔ 調名互推 */
function genKeySignatureQuestion(): Question {
  const k = pick(CIRCLE_KEYS);
  const others = CIRCLE_KEYS.filter((x) => x.major !== k.major);
  if (Math.random() < 0.5) {
    return {
      prompt: `${k.major} 大調的調號是？`,
      ...withOptions(k.signature, pickN(others, 3).map((x) => x.signature)),
      explanation: `${k.major} 大調的調號是 ${k.signature}。${SIGNATURE_MEMO}`,
    };
  }
  return {
    prompt: `調號「${k.signature}」的大調是哪個調？`,
    ...withOptions(`${k.major} 大調`, pickN(others, 3).map((x) => `${x.major} 大調`)),
    explanation: `調號 ${k.signature} 對應 ${k.major} 大調。${SIGNATURE_MEMO}`,
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
    id: "scales",
    title: "音階圖鑑",
    emoji: "🎼",
    tagline: "大調、小調、五聲、藍調、調式——solo 的語彙庫驗收。",
    goals: [
      "背熟各音階的級數公式與組成音",
      "知道每條音階「什麼情境該拿出來用」",
    ],
    build: () =>
      shuffle([
        ...buildRound([genScaleFormulaQuestion, genScaleTonesQuestion], 5),
        ...pickN(SCALE_SCENARIOS, 4).map(scaleUsageQuestionFor),
      ]),
  },
  {
    id: "fingering",
    title: "指型把位",
    emoji: "🎸",
    tagline: "五聲 box 與一弦三音：把音階變成手指背得起來的形狀。",
    goals: [
      "五聲 5 把位：每弦 2 音、第 N 把位從第 N 個音出發",
      "一弦三音 7 把位：每弦 3 音，速彈與 legato 的標配",
      "把位怎麼互相連接、怎麼跟封閉和弦手型對位",
    ],
    build: () =>
      shuffle([
        ...pickN(FINGERING_CONCEPT_QUESTIONS, 5).map(conceptQuestionFor),
        ...buildRound([genBoxStartQuestion], 3),
      ]),
  },
  {
    id: "diatonic",
    title: "順階和弦",
    emoji: "📖",
    tagline: "調性字典驗收：大調與自然小調的 I~VII 級都要能一秒反射。",
    goals: [
      "背熟大調 IM7・IIm7・IIIm7・IVM7・V7・VIm7・VIIm7♭5",
      "背熟小調 Im7・IIm7♭5・♭IIIM7・IVm7・Vm7・♭VIM7・♭VII7",
      "級數 ↔ 和弦代號雙向互推",
    ],
    build: () =>
      buildRound(
        [genDiatonicQuestion, genDiatonicQuestion, genMinorDiatonicQuestion],
        9,
      ),
  },
  {
    id: "harmony",
    title: "進行與功能",
    emoji: "🗺️",
    tagline: "歌曲進行頁的觀念總驗收：借用、副屬、著名進行與轉調。",
    goals: [
      "認得王道／卡農／小室／12 小節藍調等著名進行",
      "理解借用和弦（IVm、♭VI/♭VII）與副屬和弦（V/x）",
      "關係大小調、斜線和弦、轉調的意義",
    ],
    build: () =>
      shuffle([
        ...pickN(CONCEPT_QUESTIONS, 7).map(conceptQuestionFor),
        genRelativeKeyQuestion(),
      ]),
  },
  {
    id: "circle",
    title: "五度圈",
    emoji: "🧭",
    tagline: "調性地圖驗收：相鄰調、調號，以及實戰上什麼時候攤開這張圖。",
    goals: [
      "順時針＝五度上行（V 方向）、逆時針＝四度上行（IV 方向）",
      "12 個大調的調號（幾個 ♯／♭）雙向互推",
      "實戰情境：找 I–IV–V、挑轉調目標、認五度下行、看調號辨調",
    ],
    build: () =>
      shuffle([
        ...buildRound([genCircleNeighborQuestion, genKeySignatureQuestion], 4),
        ...buildRound(
          [genCircleModulationQuestion, genCircleFourFiveQuestion],
          2,
        ),
        ...pickN(CIRCLE_CONCEPT_QUESTIONS, 3).map(conceptQuestionFor),
      ]),
  },
];

/** 綜合測驗：每個單元抽 2 題，全部單元精通後解鎖 */
export const FINAL_UNIT: PracticeUnit = {
  id: "final",
  title: "綜合測驗",
  emoji: "🏆",
  tagline: "每個單元各抽兩題混合出擊——全部答對代表樂理真的內化了。",
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
      ...buildRound([genScaleFormulaQuestion, genScaleTonesQuestion], 2),
      ...shuffle([
        ...pickN(FINGERING_CONCEPT_QUESTIONS, 1).map(conceptQuestionFor),
        genBoxStartQuestion(),
      ]),
      ...buildRound([genDiatonicQuestion, genMinorDiatonicQuestion], 2),
      ...[
        ...pickN(CONCEPT_QUESTIONS, 1).map(conceptQuestionFor),
        genRelativeKeyQuestion(),
      ],
      ...buildRound(
        [
          genCircleNeighborQuestion,
          genKeySignatureQuestion,
          genCircleModulationQuestion,
          genCircleFourFiveQuestion,
        ],
        2,
      ),
    ]),
};
