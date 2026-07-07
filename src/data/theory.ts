import type { ChordQuality } from "../types/music";

/**
 * 樂理資料：音程定義與和弦公式。
 * 所有和弦都視為「根音 + 一組音程（以半音數表示）」，
 * 例如大三和弦 = [0, 4, 7] = 根音＋大三度＋完全五度。
 */

export interface IntervalDef {
  semitones: number;
  /** 中文名稱，例如「大三度」 */
  name: string;
  /** 級數記號，例如 "3"、"♭3" */
  degree: string;
}

export const INTERVALS: IntervalDef[] = [
  { semitones: 0, name: "根音", degree: "1" },
  { semitones: 2, name: "大二度", degree: "2" },
  { semitones: 3, name: "小三度", degree: "♭3" },
  { semitones: 4, name: "大三度", degree: "3" },
  { semitones: 5, name: "完全四度", degree: "4" },
  { semitones: 6, name: "減五度", degree: "♭5" },
  { semitones: 7, name: "完全五度", degree: "5" },
  { semitones: 9, name: "大六度", degree: "6" },
  { semitones: 10, name: "小七度", degree: "♭7" },
  { semitones: 11, name: "大七度", degree: "7" },
  { semitones: 14, name: "大九度", degree: "9" },
];

export function intervalOf(semitones: number): IntervalDef {
  const found = INTERVALS.find((i) => i.semitones === semitones);
  if (!found) throw new Error(`未定義的音程：${semitones} 半音`);
  return found;
}

export interface ChordFormula {
  quality: ChordQuality;
  /** 接在根音後的記號，例如 "m7"；大三和弦為空字串 */
  suffix: string;
  /** 由根音起算的半音數 */
  intervals: number[];
  /** 口語化的組成說明 */
  buildText: string;
  /** 從大三和弦出發的變化說明 */
  changeText: string;
}

/** 依教學順序排列：先三和弦、再掛留、最後七和弦 */
export const FORMULA_LIST: ChordFormula[] = [
  {
    quality: "major",
    suffix: "",
    intervals: [0, 4, 7],
    buildText: "根音＋大三度＋完全五度",
    changeText: "基準型：1·3·5 疊出大三和弦，聲音明亮開朗。以下所有變化都從它出發。",
  },
  {
    quality: "minor",
    suffix: "m",
    intervals: [0, 3, 7],
    buildText: "根音＋小三度＋完全五度",
    changeText: "把大三度(3)降半音變成小三度(♭3)：只動一個音，明亮就變憂鬱。",
  },
  {
    quality: "power",
    suffix: "5",
    intervals: [0, 7],
    buildText: "根音＋完全五度",
    changeText: "直接拿掉三度音：沒有 3 就沒有大小調之分，失真音色下最乾淨有力。",
  },
  {
    quality: "sus2",
    suffix: "sus2",
    intervals: [0, 2, 7],
    buildText: "根音＋大二度＋完全五度",
    changeText: "把三度音往下換成大二度(2)：懸浮、未解決的開放感。",
  },
  {
    quality: "sus4",
    suffix: "sus4",
    intervals: [0, 5, 7],
    buildText: "根音＋完全四度＋完全五度",
    changeText: "把三度音往上半音換成完全四度(4)：緊繃懸浮，非常想解決回大三度。",
  },
  {
    quality: "add9",
    suffix: "add9",
    intervals: [0, 4, 7, 14],
    buildText: "大三和弦＋大九度（高八度的 2）",
    changeText:
      "保留 3 音、上面再疊一個 9 音：比純三和弦亮、更現代，J-pop 鋼琴伴奏的預設色（有 3 音，跟 sus2 不同）。",
  },
  {
    quality: "6",
    suffix: "6",
    intervals: [0, 4, 7, 9],
    buildText: "大三和弦＋大六度",
    changeText: "疊 6 不疊 7 的復古色：City Pop、老歌、爵士味的溫暖收尾。",
  },
  {
    quality: "m6",
    suffix: "m6",
    intervals: [0, 3, 7, 9],
    buildText: "小三和弦＋大六度",
    changeText: "小和弦的復古變化：憂鬱裡帶一點爵士的煙燻味。",
  },
  {
    quality: "dominant7",
    suffix: "7",
    intervals: [0, 4, 7, 10],
    buildText: "大三和弦＋小七度",
    changeText: "在 1·3·5 上再疊小七度(♭7)：藍調與搖滾的張力來源，推著音樂往前走。",
  },
  {
    quality: "major7",
    suffix: "maj7",
    intervals: [0, 4, 7, 11],
    buildText: "大三和弦＋大七度",
    changeText: "在 1·3·5 上再疊大七度(7)：夢幻、慵懶的都會色彩。",
  },
  {
    quality: "minor7",
    suffix: "m7",
    intervals: [0, 3, 7, 10],
    buildText: "小三和弦＋小七度",
    changeText: "小三和弦(1·♭3·5)再疊小七度(♭7)：比 m 更柔和放鬆，Funk / R&B 常客。",
  },
  {
    quality: "dim",
    suffix: "dim",
    intervals: [0, 3, 6],
    buildText: "根音＋小三度＋減五度",
    changeText: "把小三和弦的 5 再降半音：極不穩定，常當經過和弦往隔壁滑。",
  },
  {
    quality: "m7b5",
    suffix: "m7♭5",
    intervals: [0, 3, 6, 10],
    buildText: "減三和弦＋小七度（半減七）",
    changeText:
      "大調第 VII 級的原生七和弦；J-pop 精緻和聲愛用的 ♯IVm7♭5 也是它。",
  },
];

export const CHORD_FORMULAS = Object.fromEntries(
  FORMULA_LIST.map((f) => [f.quality, f]),
) as Record<ChordQuality, ChordFormula>;

const SHARP_NAMES = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
const FLAT_NAMES = ["C", "D♭", "D", "E♭", "E", "F", "G♭", "G", "A♭", "A", "B♭", "B"];

const PC_BY_LETTER: Record<string, number> = {
  C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11,
};

/** 從和弦名稱取出根音，例如 "C#m7" → "C#"、"B♭" → "B♭" */
export function parseRoot(chordName: string): string {
  const m = chordName.match(/^([A-G])(#|♭|b)?/);
  if (!m) throw new Error(`無法解析和弦名稱：${chordName}`);
  const accidental = m[2] === "b" ? "♭" : (m[2] ?? "");
  return m[1] + accidental;
}

export function noteToPc(note: string): number {
  let pc = PC_BY_LETTER[note[0]];
  if (note.includes("#")) pc += 1;
  if (note.includes("♭")) pc -= 1;
  return (pc + 12) % 12;
}

export function pcToName(pc: number, useFlats = false): string {
  return (useFlats ? FLAT_NAMES : SHARP_NAMES)[((pc % 12) + 12) % 12];
}

/** 由根音與音程公式拼出組成音名；根音用降記號時整組跟著用降記號 */
export function spellChordTones(root: string, intervals: number[]): string[] {
  const useFlats = root.includes("♭");
  const rootPc = noteToPc(root);
  return intervals.map((s) => pcToName(rootPc + s, useFlats));
}

/** 樂理試聽用 MIDI 音高：根音固定落在 C3–B3，往上疊出和弦 */
export function theoryChordMidis(root: string, intervals: number[]): number[] {
  const rootMidi = 48 + noteToPc(root);
  return intervals.map((s) => rootMidi + s);
}

/** 移調：把和弦名稱的根音移動 delta 個半音，保留後綴（Am7 +2 → Bm7）；斜線和弦的低音一併移調 */
export function transposeChordName(
  name: string,
  delta: number,
  useFlats: boolean,
): string {
  const [main, bass] = name.split("/");
  const root = parseRoot(main);
  const moved = pcToName(noteToPc(root) + delta, useFlats) + main.slice(root.length);
  return bass ? `${moved}/${pcToName(noteToPc(bass) + delta, useFlats)}` : moved;
}
