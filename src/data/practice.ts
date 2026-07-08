import type { ChordQuality } from "../types/music";
import { QUALITY_LABELS, STANDARD_TUNING_MIDI } from "../types/music";
import { cagedPositions } from "./caged";
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

/** 上琴應用練習：把觀念搬到指板上的實作步驟 */
export interface GuitarDrill {
  title: string;
  /** 怎麼練＋聽什麼 */
  how: string;
}

export interface PracticeUnit {
  id: string;
  title: string;
  emoji: string;
  /** 這個單元在練什麼 */
  tagline: string;
  /** 完成後應該學會的觀念 */
  goals: string[];
  /** 拿起吉他做的應用練習 */
  drills: GuitarDrill[];
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

// ── 單元 7：指板音名 ─────────────────────────

const STRING_LABELS_ZH = [
  "第六弦（低音 E）",
  "第五弦（A）",
  "第四弦（D）",
  "第三弦（G）",
  "第二弦（B）",
  "第一弦（高音 E）",
];
const ALL_NOTE_NAMES = Array.from({ length: 12 }, (_, i) => pcToName(i));

/** （弦, 格）→ 音名 */
function genFretNoteQuestion(): Question {
  const s = Math.floor(Math.random() * 6);
  const fret = 1 + Math.floor(Math.random() * 12);
  const midi = STANDARD_TUNING_MIDI[s] + fret;
  const correct = pcToName(midi % 12);
  const openName = pcToName(STANDARD_TUNING_MIDI[s] % 12);
  return {
    prompt: `${STRING_LABELS_ZH[s]}第 ${fret} 格是什麼音？`,
    ...withOptions(
      correct,
      pickN(ALL_NOTE_NAMES.filter((n) => n !== correct), 3),
    ),
    explanation:
      `${STRING_LABELS_ZH[s]}空弦是 ${openName}，往上 ${fret} 個半音就是 ${correct}。` +
      `速記：第 12 格回到空弦音名；第 5 格＝下一弦的空弦音（僅第三弦例外，在第 4 格）。`,
    soundMidis: [midi],
    soundLabel: correct,
  };
}

/** 音名 → 格位 */
function genFindNoteQuestion(): Question {
  const s = Math.floor(Math.random() * 6);
  const targetPc = pick([0, 2, 4, 5, 7, 9, 11]); // 自然音
  const note = pcToName(targetPc);
  const openPc = STANDARD_TUNING_MIDI[s] % 12;
  const fret = (targetPc - openPc + 12) % 12;
  const openName = pcToName(openPc);
  const distractors = pickN(
    Array.from({ length: 12 }, (_, i) => i).filter((f) => f !== fret),
    3,
  ).map((f) => `第 ${f} 格`);
  return {
    prompt: `${note} 音在${STRING_LABELS_ZH[s]}的第幾格（0–11 格內）？`,
    ...withOptions(`第 ${fret} 格`, distractors),
    explanation:
      `${STRING_LABELS_ZH[s]}空弦是 ${openName}，從 ${openName} 往上數到 ${note} 是 ${fret} 個半音，` +
      `所以在第 ${fret} 格${fret === 0 ? "（就是空弦）" : ""}。`,
    soundMidis: [STANDARD_TUNING_MIDI[s] + fret],
    soundLabel: note,
  };
}

/** 相鄰弦同音換算（B 弦差一格陷阱） */
function genOctaveShapeQuestion(): Question {
  const s = Math.floor(Math.random() * 5); // 0..4：與下一條弦比
  const shift = s === 3 ? 4 : 5; // G→B 弦是大三度（4 格）
  const fret = 6 + Math.floor(Math.random() * 6); // 6..11
  const correct = fret - shift;
  const stringNo = ["六", "五", "四", "三", "二", "一"];
  const distractors = [fret - 4, fret - 5, fret - 6, fret - 3]
    .filter((f) => f !== correct)
    .slice(0, 3)
    .map((f) => `第 ${f} 格`);
  return {
    prompt: `第${stringNo[s]}弦第 ${fret} 格的音，等於第${stringNo[s + 1]}弦的第幾格？`,
    ...withOptions(`第 ${correct} 格`, distractors),
    explanation:
      `相鄰兩弦相差完全四度（5 格），只有第三弦→第二弦（G→B）是大三度（4 格）。` +
      `同一個音移到隔壁高音弦，往低把位退 ${shift} 格——B 弦的「差一格」陷阱就是這麼來的。`,
    soundMidis: [STANDARD_TUNING_MIDI[s] + fret],
    soundLabel: pcToName((STANDARD_TUNING_MIDI[s] + fret) % 12),
  };
}

/** 八度型與指板規則觀念（固定題庫） */
const OCTAVE_CONCEPT_QUESTIONS: ConceptQuestion[] = [
  {
    prompt: "第六弦第 3 格（G）的高八度，用「隔一弦」的八度型找，在哪裡？",
    correct: "第四弦第 5 格",
    distractors: ["第四弦第 3 格", "第五弦第 5 格", "第三弦第 4 格"],
    explanation:
      "低音側的八度型：隔一弦、往高把位 +2 格（六→四弦、五→三弦通用）。G 在第六弦第 3 格，高八度就在第四弦第 5 格——power chord 上面常疊的那個音。",
  },
  {
    prompt: "第四弦上某個音的高八度在第二弦，要往高把位移幾格？",
    correct: "3 格",
    distractors: ["2 格", "4 格", "5 格"],
    explanation:
      "高音側的八度型（四→二弦、三→一弦）是 +3 格——因為中間跨過了 G→B 弦那個「少一格」的交界；低音側（六→四、五→三）則是 +2 格。",
  },
  {
    prompt: "為什麼許多指板規則到了第二弦（B 弦）都要「多移 1 格」？",
    correct: "因為 G→B 弦之間是大三度（4 格），其他相鄰弦都是完全四度（5 格）",
    distractors: [
      "因為 B 弦比較細、張力不同",
      "因為 B 弦的音高超過中央 C",
      "沒有原因，純粹是習慣",
    ],
    explanation:
      "標準調弦 E–A–D–G–B–E 裡只有 G→B 是大三度。所有跨過這個交界的指型——八度型、和弦手型、音階把位——都要往高把位補 1 格。",
  },
  {
    prompt: "第六弦和第一弦的音名關係是？",
    correct: "完全相同（差兩個八度）",
    distractors: ["差完全五度", "差完全四度", "完全無關"],
    explanation:
      "兩條都是 E 弦：第六弦任何一格的音名跟第一弦同一格一模一樣，只差兩個八度——背熟第六弦等於同時背好第一弦。",
  },
];

// ── 單元 8：CAGED 與和弦內音 ──────────────────────

/** CAGED 手型 ↔ 把位互推 */
function genCagedFormQuestion(): Question {
  const root = pick(ROOTS);
  const positions = cagedPositions(noteToPc(root));
  const p = pick(positions);
  const posLabel = (x: (typeof positions)[number]) =>
    x.offset === 0 ? "開放把位" : `第 ${x.offset} 格`;
  const orderText = positions
    .map(
      (x) =>
        `${x.form.form} 型${x.offset === 0 ? "（開放）" : `＠${x.offset} 格`}`,
    )
    .join(" → ");
  const explanation =
    `CAGED 順序固定 C→A→G→E→D 循環。${root} 和弦沿指板依序是：${orderText}。`;
  const soundMidis = [...p.notes]
    .sort((a, b) => a.string - b.string)
    .map((n) => STANDARD_TUNING_MIDI[n.string] + n.fret);
  const soundLabel = `${root}（${p.form.form} 型）`;

  if (Math.random() < 0.5) {
    return {
      prompt: `用 ${p.form.form} 手型按 ${root} 和弦，手型要落在哪裡？`,
      ...withOptions(
        posLabel(p),
        pickN(positions.filter((x) => x !== p), 3).map(posLabel),
      ),
      explanation,
      soundMidis,
      soundLabel,
    };
  }
  return {
    prompt: `${root} 和弦在${posLabel(p)}附近，該用哪個 CAGED 手型？`,
    ...withOptions(
      `${p.form.form} 手型`,
      pickN(positions.filter((x) => x !== p), 3).map(
        (x) => `${x.form.form} 手型`,
      ),
    ),
    explanation,
    soundMidis,
    soundLabel,
  };
}

/** Guide tones：3、7 音定義和弦身分 */
function genGuideToneQuestion(): Question {
  const root = pick(ROOTS);
  const q = pick(["dominant7", "major7", "minor7", "m7b5"] as ChordQuality[]);
  const f = CHORD_FORMULAS[q];
  const name = root + f.suffix;
  const tones = spellChordTones(root, f.intervals);
  const d3 = intervalOf(f.intervals[1]).degree;
  const d5 = intervalOf(f.intervals[2]).degree;
  const d7 = intervalOf(f.intervals[3]).degree;
  const correct = `${tones[1]}（${d3}）與 ${tones[3]}（${d7}）`;
  const distractors = [
    `${tones[0]}（1）與 ${tones[2]}（${d5}）`,
    `${tones[0]}（1）與高八度的 ${tones[0]}`,
    "任何調內音效果都一樣",
  ];
  return {
    prompt: `在 ${name} 上 solo，長音落在哪兩個音最能「說出」這個和弦的身分？`,
    ...withOptions(correct, distractors),
    explanation:
      `3 音（${tones[1]}）決定大小、7 音（${tones[3]}）決定七和弦的種類——` +
      `這對 guide tones 一響，耳朵立刻知道現在是 ${name}；1 和 5 最安全，但每個和弦都有，說不出身分。`,
    soundMidis: theoryChordMidis(root, f.intervals),
    soundLabel: name,
  };
}

/** CAGED 與和弦內音觀念（固定題庫） */
const CAGED_CONCEPT_QUESTIONS: ConceptQuestion[] = [
  {
    prompt: "CAGED 系統的核心概念是？",
    correct: "同一個和弦可用 C·A·G·E·D 五種手型沿指板各按一次",
    distractors: [
      "五個調各有一個專屬手型",
      "五種不同的調弦法",
      "和弦進行的五種排列方式",
    ],
    explanation:
      "任何大三和弦都能用五個開放手型的封閉版本，沿指板由低到高各按一次——五個把位串起來，整片指板都是同一個和弦的家。",
  },
  {
    prompt: "CAGED 五個手型沿指板出現的順序是？",
    correct: "永遠是 C→A→G→E→D 循環（從哪個開始取決於和弦）",
    distractors: [
      "按字母順序 A→C→D→E→G",
      "隨和弦種類改變順序",
      "順序是隨機的，要各自背",
    ],
    explanation:
      "順序固定 C→A→G→E→D、繞完再回 C：C 和弦從 C 型（開放）開始往上接 A 型、G 型…；A 和弦就從 A 型開始。記住循環，找把位不用背表。",
  },
  {
    prompt: "F 和弦最常見的按法（第 1 格封閉）是哪個 CAGED 手型？",
    correct: "E 手型",
    distractors: ["C 手型", "A 手型", "D 手型"],
    explanation:
      "把開放 E 和弦整個上移 1 格、食指當琴枕封住第 1 格就是 F——E 手型封閉和弦，根音在第六弦。B 和弦（A 手型＠2 格）則是另一個常用型。",
  },
  {
    prompt: "換和弦時，solo 想「跟著和聲走」最有效的做法是？",
    correct: "換和弦的瞬間把長音落到新和弦的和弦內音（尤其 3、7 音）",
    distractors: [
      "繼續彈同一條音階就一定安全",
      "每次換和弦都回到調的主音",
      "加快速度讓錯音聽不出來",
    ],
    explanation:
      "音階是地圖、和弦內音是目的地：換和弦那一拍落在對方的 3 音或 7 音（guide tones），旋律立刻「貼」上和聲——這就是 chord tone targeting。",
  },
  {
    prompt: "G7 解決到 C 時，最漂亮的兩條半音線是？",
    correct: "B→C（3→1）與 F→E（♭7→3）",
    distractors: ["G→C 與 D→E", "G→A 與 B→D", "F→G 與 E→C"],
    explanation:
      "G7 的 3 音 B 往上半音進 C 的根音、♭7 音 F 往下半音進 C 的 3 音 E——這對三全音（B–F）的反向解決正是屬七和弦拉力的來源，solo 沿這兩條線走最有「解決感」。",
  },
  {
    prompt: "琶音（arpeggio）練習跟音階練習的本質差別是？",
    correct: "琶音只彈和弦內音，長音落在哪都貼和聲",
    distractors: [
      "琶音一定要彈得比較快",
      "琶音只能用掃弦技巧彈",
      "音階比琶音高級",
    ],
    explanation:
      "琶音＝把和弦拆開一顆顆彈：全部都是和弦內音，怎麼停都安全；音階則包含經過音，長音落錯會「浮」起來。實戰 solo 是兩者混用——音階跑動、琶音落點。",
  },
];

// ── 單元 9：指型把位（五聲 box 與一弦三音）──────────

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

// ── 單元 10：順階和弦（調性字典）───────────────────

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

// ── 單元 11：進行與功能 ──────────────────────────

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

// ── 單元 12：五度圈 ──────────────────────────

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
    drills: [
      {
        title: "單弦數格聽音程",
        how: "在第六弦任選一格當根音，往上 4 格彈大三度、7 格彈完全五度，邊彈邊唱「1—3—5」；再改成往上 3 格聽小三度。指板一格＝一個半音，格數就是音程的尺。",
      },
      {
        title: "半音 vs 全音的聽感",
        how: "同一條弦上先彈相鄰 1 格（小二度，緊張刺耳），再彈相隔 2 格（大二度，自然）；接著比較 3 格與 4 格——小三度暗、大三度亮，這半音差就是大小調的分水嶺。",
      },
      {
        title: "跨弦找五度",
        how: "按 power chord 手型（低音弦某格＋高一條弦同格再 +2 格）就是完全五度；相鄰兩弦「同一格」則是完全四度（G→B 弦例外）。用手型記音程，比數格子快。",
      },
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
    drills: [
      {
        title: "拆解開放和弦",
        how: "刷一次 C 開放和弦，再由低到高一弦一弦彈，對照和弦圖鑑說出每個音是 1、3 還是 5（C=1、E=3、G=5，會重複出現）。六條弦其實只有三個音在輪班。",
      },
      {
        title: "高音三弦拼三和弦",
        how: "在四、三、二弦分別按 5、4、3 格＝G 大三和弦（G·B·D）。把 3 音（第三弦 4 格）降到 3 格就變 Gm——只動半音，明亮立刻轉憂鬱。",
      },
      {
        title: "sus 的吊與放",
        how: "彈 D→Dsus4→D→Dsus2→D（小指在第一弦 3 格勾放、食指提起）。掛留音「吊住」的懸空感、回到 3 音的「落地」感，就是 sus 和弦的全部祕密。",
      },
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
    drills: [
      {
        title: "一根手指的魔法",
        how: "A→Am 只動一根手指（第二弦 2 格→1 格），來回彈聽 3→♭3 的變化；E→Em（第三弦 1 格→放開）同理。體會「只差半音、性格全變」。",
      },
      {
        title: "三種七度一次聽",
        how: "C（x32010）→Cmaj7（放開第二弦食指 x32000）→C7（小指加按第三弦 3 格 x32310）。同一個和弦疊大七、小七的色差，一分鐘聽完。",
      },
      {
        title: "拿掉三度音",
        how: "彈完整的 E 大和弦，再只彈六、五、四弦（E5 強力和弦）。開失真比較：有 3 音會糊、只剩 1 和 5 乾淨有力——這就是搖滾用 power chord 的原因。",
      },
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
    drills: [
      {
        title: "都會 vs 藍調",
        how: "交替彈 Cmaj7 與 C7——兩者只差半音（B vs B♭），一個夢幻慵懶、一個緊繃想解決。閉上眼睛聽到能分辨為止。",
      },
      {
        title: "放鬆的小七",
        how: "Am→Am7 只要放開第三弦 2 格；Em→Em7 放開第四弦 2 格。聽 m7 比 m 圓潤放鬆在哪——Funk/R&B 的節奏吉他就是這個色。",
      },
      {
        title: "add9 的亮片",
        how: "C→Cadd9（x32030，小指按第二弦 3 格）來回彈：多出來的 D 音就是「現代感」。很多流行歌前奏只是把三和弦全換成 add9 而已。",
      },
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
    drills: [
      {
        title: "同一進行換色彩",
        how: "到「歌曲進行」頁選卡農進行，用色彩開關切原版→七和弦版→add9 版，各跟著刷一輪。把「什麼色彩配什麼場合」直接聽進耳朵，而不是背文字。",
      },
      {
        title: "sus4 蓄力實戰",
        how: "刷 G→Gsus4（320013）→G，當作副歌前的推力；再試 D→Dsus4→D。數一拍吊住、一拍解決，你就會懂為什麼副歌前都要來這一下。",
      },
      {
        title: "全屬七的藍調",
        how: "用 E7、A7、B7 跟著歌曲進行頁的 12 小節藍調刷一輪——三個和弦全是屬七卻毫無違和，這種「張力就是常態」正是藍調的語言。",
      },
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
    drills: [
      {
        title: "跟著播放彈",
        how: "音階教學頁選 A 小調五聲、按「播放音階」，在第 1 把位（5–8 格）跟著彈並唱級數「1、♭3、4、5、♭7」。唱得出級數，音階才算真的認識。",
      },
      {
        title: "差一個音的對照",
        how: "彈一輪 A 自然小調，再把所有 F 換成 F#（就變成 A Dorian）。只差一個音，氛圍從憂鬱變洋氣——調式的差別用手指記最快。",
      },
      {
        title: "和聲小調的拉力",
        how: "彈 Am–E7–Am 循環，輪到 E7 那小節把 solo 裡所有 G 彈成 G#（A 和聲小調）。聽「回家」的力量瞬間變強——這就是升 7 音存在的理由。",
      },
    ],
    build: () =>
      shuffle([
        ...buildRound([genScaleFormulaQuestion, genScaleTonesQuestion], 5),
        ...pickN(SCALE_SCENARIOS, 4).map(scaleUsageQuestionFor),
      ]),
  },
  {
    id: "fretnotes",
    title: "指板音名",
    emoji: "🔤",
    tagline: "指板地圖的地基：每一格叫什麼名字、八度型怎麼推。",
    goals: [
      "任一（弦, 格）1 秒反射出音名，反向也能找格位",
      "八度型與相鄰弦規則（B 弦差一格陷阱）",
    ],
    drills: [
      {
        title: "單弦尋音計時賽",
        how: "計時 60 秒，在第六弦上找出並彈出 C、F、A、B♭（答案：8、1、5、6 格）。明天換第五弦、後天第四弦——一天一條弦，一週背完全指板。",
      },
      {
        title: "八度型驗證法",
        how: "第六弦隨便按一格，用「隔一弦、+2 格」找它的高八度並同時彈響——同名音會完全融合成一個聲音；聽起來「打架」就是找錯了。這招可以自我檢查，不用看答案。",
      },
      {
        title: "一音之路",
        how: "選一個音（例如 D），在六條弦的 0–12 格內各找一個，從最低的 D 彈到最高的 D 串成一條路。每天換一個音，指板的「同名音網」就會浮出來。",
      },
    ],
    build: () =>
      shuffle([
        ...buildRound(
          [genFretNoteQuestion, genFindNoteQuestion, genOctaveShapeQuestion],
          6,
        ),
        ...pickN(OCTAVE_CONCEPT_QUESTIONS, 3).map(conceptQuestionFor),
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
    drills: [
      {
        title: "box 配節拍器",
        how: "A 小調五聲第 1 把位、節拍器 60 BPM 八分音符，上行再下行完全不出錯後 +10 BPM；到 100 BPM 就換第 2 把位重來。速度是練出來的，不是趕出來的。",
      },
      {
        title: "滑音換把位",
        how: "第 1 把位彈到第一弦最高音（8 格），沿第一弦滑到 10 格接第 2 把位往回下行。相鄰把位共用一半的音——滑一下就換家，這是貫通指板的第一步。",
      },
      {
        title: "3NPS 六連音 legato",
        how: "一弦三音天生適合六連音：每條弦用「按-捶-捶」（食指按、中指小指 hammer-on）上行整個把位。每弦動作一模一樣，這種規律就是速彈機器的祕密。",
      },
    ],
    build: () =>
      shuffle([
        ...pickN(FINGERING_CONCEPT_QUESTIONS, 5).map(conceptQuestionFor),
        ...buildRound([genBoxStartQuestion], 3),
      ]),
  },
  {
    id: "caged",
    title: "CAGED 與和弦內音",
    emoji: "🧩",
    tagline: "五個手型鋪滿指板，solo 長音瞄準和弦內音。",
    goals: [
      "CAGED：同一和弦五種手型的位置與固定順序",
      "Guide tones：3、7 音定義和弦身分",
      "換和弦時瞄準和弦內音（chord tone targeting）",
    ],
    drills: [
      {
        title: "一個和弦環遊指板",
        how: "照指板地圖頁把 C 和弦五個手型各刷一次：開放 C 型→A 型 3 格→G 型 5 格→E 型 8 格→D 型 10 格。同一個和弦越彈越高——五個手型串完，你就「擁有」整個指板的 C。",
      },
      {
        title: "換和弦瞄 3 音",
        how: "放歌曲進行頁的 I–V–vi–IV 循環當背景，每次換和弦只彈兩顆音：新和弦的根音→3 音。習慣之後把 3 音改成長音落點——這就是 chord tone targeting 的肌肉記憶。",
      },
      {
        title: "三全音解決",
        how: "自己錄或循環 G7→C 的伴奏，單音彈 B→C（3→1）、再彈 F→E（♭7→3）。兩條半音線同時收攏的「啊，回家了」感，就是屬七和弦拉力的物理現場。",
      },
    ],
    build: () =>
      shuffle([
        ...buildRound([genCagedFormQuestion, genGuideToneQuestion], 5),
        ...pickN(CAGED_CONCEPT_QUESTIONS, 3).map(conceptQuestionFor),
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
    drills: [
      {
        title: "順階爬梯",
        how: "C 大調從 I 彈到 VII 再回家：C–Dm–Em–F–G–Am–Bdim–C，邊彈邊唸「一、二 m、三 m、四、五、六 m、七減」。爬熟一個調，其他調只是換起點。",
      },
      {
        title: "1–6–2–5 循環",
        how: "彈 C–Am–Dm–G 不停循環（爵士標準的 I–VIm–IIm–V）。全是調內和弦，怎麼接都和諧——感受「一家人」的安全感，之後聽到借用和弦才知道哪裡「出格」。",
      },
      {
        title: "級數搬家",
        how: "把同樣的級數 I–VIm–IIm–V 搬到 G 大調彈：G–Em–Am–D。和弦全變了、感覺完全一樣——級數不變、和弦跟調跑，這就是為什麼要用級數思考。",
      },
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
    drills: [
      {
        title: "催淚彈 A/B 測試",
        how: "先彈 C–F–C，再彈 C–F–Fm–C。Fm 那一步只動了一個音（F 和弦裡的 A→A♭），眼淚就是從那半音來的。自己彈一次比聽一百次講解都有效。",
      },
      {
        title: "副屬拉力對照",
        how: "彈 C–Am–Dm–G 一輪，再把 Am 換成 A7 彈 C–A7–Dm–G。A7 多出來的 C# 音把音樂用力推向 Dm——這就是副屬和弦 V/II 的推力，動漫和昭和歌謠到處都是。",
      },
      {
        title: "三種回家方式",
        how: "各彈幾次：G7→C（完全終止，最強的回家）、F→C（變格終止，教堂「阿們」的溫柔）、G7→Am（假終止，說好回家卻繞去別人家）。終止式決定樂句的標點符號。",
      },
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
    drills: [
      {
        title: "五度下行環遊",
        how: "在五、六弦上沿五度圈逆時針彈根音單音：C→F→B♭→E♭→A♭→D♭→F#→B→E→A→D→G→C，邊彈邊唸調名。手指走過一輪，五度圈就不再只是一張圖。",
      },
      {
        title: "近親 vs 遠親轉調",
        how: "彈 C 調的 C–F–G，接著轉 G 調彈 G–C–D（只差一個 F→F#，耳朵幾乎無痛），再直接跳 F# 調彈 F#–B–C#——正對面的調，聽聽有多突兀。距離感自己彈最準。",
      },
      {
        title: "II–V–I 傳送帶",
        how: "彈 Dm7–G7–Cmaj7，然後整組沿逆時針搬：Gm7–C7–Fmaj7，再 Cm7–F7–B♭maj7。每組的 I 變成下一組的 V 方向鄰居——爵士就是坐著這條傳送帶環遊 12 個調。",
      },
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
  drills: [
    {
      title: "全套暖身菜單",
      how: "從每個單元的上琴練習挑一個，串成 10 分鐘暖身：音程數格→拆和弦→五聲把位→CAGED 環遊→II–V–I 傳送帶。每天輪換，觀念就長在手上。",
    },
    {
      title: "實戰總驗收",
      how: "挑一首喜歡的歌：找出調性、把每個和弦標成級數、指出借用／副屬和弦、選對 solo 音階。做得到這四件事，這個 app 就畢業了。",
    },
  ],
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
      ...buildRound(
        [genFretNoteQuestion, genFindNoteQuestion, genOctaveShapeQuestion],
        2,
      ),
      ...shuffle([
        ...pickN(FINGERING_CONCEPT_QUESTIONS, 1).map(conceptQuestionFor),
        genBoxStartQuestion(),
      ]),
      ...buildRound([genCagedFormQuestion, genGuideToneQuestion], 2),
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
