import type { ChordQuality, ChordShape, FretValue } from "../types/music";
import { CHORDS } from "./chords";
import { CHORD_FORMULAS, noteToPc, parseRoot } from "./theory";

/**
 * 依「根音＋和弦性質」找出按法：
 * 優先使用和弦資料庫中人工整理的按法（多為開放和弦），
 * 找不到時以 E 型／A 型可移動手型自動產生封閉和弦按法。
 */

interface MovableForm {
  /** 根音所在弦：6 = 低音 E 弦（E 型）、5 = A 弦（A 型） */
  rootString: 6 | 5;
  /** 相對於封閉把位的琴格 */
  relFrets: (number | "x")[];
  fingers: (number | null)[];
  /** 橫按範圍；rel = 橫按相對於封閉把位的偏移（預設 0） */
  barre?: { fromString: number; toString: number; rel?: number };
}

const E_OPEN_PC = 4; // 第六弦空弦 E
const A_OPEN_PC = 9; // 第五弦空弦 A

/** 各和弦性質的可移動手型模板（同性質有多型時取把位較低者） */
const MOVABLE_FORMS: Record<ChordQuality, MovableForm[]> = {
  major: [
    { rootString: 6, relFrets: [0, 2, 2, 1, 0, 0], fingers: [1, 3, 4, 2, 1, 1], barre: { fromString: 6, toString: 1 } },
    { rootString: 5, relFrets: ["x", 0, 2, 2, 2, 0], fingers: [null, 1, 2, 3, 4, 1], barre: { fromString: 5, toString: 1 } },
  ],
  minor: [
    { rootString: 6, relFrets: [0, 2, 2, 0, 0, 0], fingers: [1, 3, 4, 1, 1, 1], barre: { fromString: 6, toString: 1 } },
    { rootString: 5, relFrets: ["x", 0, 2, 2, 1, 0], fingers: [null, 1, 3, 4, 2, 1], barre: { fromString: 5, toString: 1 } },
  ],
  power: [
    { rootString: 6, relFrets: [0, 2, 2, "x", "x", "x"], fingers: [1, 3, 4, null, null, null] },
    { rootString: 5, relFrets: ["x", 0, 2, 2, "x", "x"], fingers: [null, 1, 3, 4, null, null] },
  ],
  dominant7: [
    { rootString: 6, relFrets: [0, 2, 0, 1, 0, 0], fingers: [1, 3, 1, 2, 1, 1], barre: { fromString: 6, toString: 1 } },
    { rootString: 5, relFrets: ["x", 0, 2, 0, 2, 0], fingers: [null, 1, 3, 1, 4, 1], barre: { fromString: 5, toString: 1 } },
  ],
  major7: [
    { rootString: 5, relFrets: ["x", 0, 2, 1, 2, 0], fingers: [null, 1, 3, 2, 4, 1], barre: { fromString: 5, toString: 1 } },
  ],
  minor7: [
    { rootString: 6, relFrets: [0, 2, 0, 0, 0, 0], fingers: [1, 3, 1, 1, 1, 1], barre: { fromString: 6, toString: 1 } },
    { rootString: 5, relFrets: ["x", 0, 2, 0, 1, 0], fingers: [null, 1, 3, 1, 2, 1], barre: { fromString: 5, toString: 1 } },
  ],
  sus2: [
    { rootString: 5, relFrets: ["x", 0, 2, 2, 0, 0], fingers: [null, 1, 3, 4, 1, 1], barre: { fromString: 5, toString: 1 } },
  ],
  sus4: [
    { rootString: 6, relFrets: [0, 2, 2, 2, 0, 0], fingers: [1, 2, 3, 4, 1, 1], barre: { fromString: 6, toString: 1 } },
    { rootString: 5, relFrets: ["x", 0, 2, 2, 3, 0], fingers: [null, 1, 2, 3, 4, 1], barre: { fromString: 5, toString: 1 } },
  ],
  add9: [
    { rootString: 5, relFrets: ["x", 0, 2, 4, 2, 0], fingers: [null, 1, 2, 4, 3, 1], barre: { fromString: 5, toString: 1 } },
  ],
  "6": [
    { rootString: 5, relFrets: ["x", 0, 2, 2, 2, 2], fingers: [null, 1, 3, 3, 3, 3], barre: { fromString: 4, toString: 1, rel: 2 } },
  ],
  m6: [
    { rootString: 5, relFrets: ["x", 0, 2, 2, 1, 2], fingers: [null, 1, 3, 4, 2, 4] },
  ],
  dim: [
    { rootString: 5, relFrets: ["x", 0, 1, 2, 1, "x"], fingers: [null, 1, 2, 4, 3, null] },
  ],
  m7b5: [
    { rootString: 5, relFrets: ["x", 0, 1, 0, 1, "x"], fingers: [null, 1, 3, 2, 4, null] },
  ],
};

/**
 * 常用斜線和弦（分數和弦）按法：上方和弦＋指定低音。
 * findShapeForName 會優先查這張表；移調後查不到時退回主和弦按法。
 */
const SLASH_SHAPES: Record<string, ChordShape> = {
  "C/B": {
    id: "slash-C-B",
    chordName: "C/B",
    quality: "major",
    positionType: "open",
    frets: ["x", 2, 2, 0, 1, 0],
    fingers: [null, 2, 3, null, 1, null],
    note: "C 和弦、B 當低音：低音下行 C→B→A 的中繼站。",
  },
  "C/G": {
    id: "slash-C-G",
    chordName: "C/G",
    quality: "major",
    positionType: "open",
    frets: [3, 3, 2, 0, 1, 0],
    fingers: [3, 4, 2, null, 1, null],
    note: "C 和弦、G 當低音（Ⅰ/5）。",
  },
  "C/E": {
    id: "slash-C-E",
    chordName: "C/E",
    quality: "major",
    positionType: "open",
    frets: [0, 3, 2, 0, 1, 0],
    fingers: [null, 3, 2, null, 1, null],
  },
  "G/B": {
    id: "slash-G-B",
    chordName: "G/B",
    quality: "major",
    positionType: "open",
    frets: ["x", 2, 0, 0, 3, 3],
    fingers: [null, 1, null, null, 3, 4],
  },
  "D/F#": {
    id: "slash-D-Fsharp",
    chordName: "D/F#",
    quality: "major",
    positionType: "open",
    frets: [2, "x", 0, 2, 3, 2],
    fingers: [1, null, null, 2, 4, 3],
    note: "低音 F# 常用拇指扣住第六弦。",
  },
  "Am/G": {
    id: "slash-Am-G",
    chordName: "Am/G",
    quality: "minor",
    positionType: "open",
    frets: [3, 0, 2, 2, 1, 0],
    fingers: [4, null, 2, 3, 1, null],
  },
};

/** 和弦記號 → 性質對照（例如 "m7" → minor7） */
const SUFFIX_TO_QUALITY: Record<string, ChordQuality> = {
  "": "major",
  m: "minor",
  "5": "power",
  "7": "dominant7",
  maj7: "major7",
  m7: "minor7",
  sus2: "sus2",
  sus4: "sus4",
  add9: "add9",
  "6": "6",
  m6: "m6",
  dim: "dim",
  "m7♭5": "m7b5",
};

/** 由完整和弦名稱（例如 "Am7"、"B♭"、"C/B"）找出按法 */
export function findShapeForName(chordName: string): ChordShape {
  const slash = SLASH_SHAPES[chordName];
  if (slash) return slash;
  // 斜線和弦查不到現成按法時，退回主和弦（低音交給想像力）
  const main = chordName.split("/")[0];
  const root = parseRoot(main);
  const quality = SUFFIX_TO_QUALITY[main.slice(root.length)];
  if (!quality) throw new Error(`無法解析和弦名稱：${chordName}`);
  return findChordShape(root, quality);
}

/** 把可移動手型套用到指定把位，產生實際按法 */
function buildFromForm(
  form: MovableForm,
  root: string,
  quality: ChordQuality,
  base: number,
): ChordShape {
  const name = root + CHORD_FORMULAS[quality].suffix;
  const frets: FretValue[] = form.relFrets.map((f) =>
    f === "x" ? "x" : f + base,
  );
  return {
    id: `gen-${name}-s${form.rootString}`,
    chordName: name,
    quality,
    positionType: form.barre ? "barre" : "movable",
    frets,
    fingers: form.fingers,
    barre: form.barre
      ? {
          fret: base + (form.barre.rel ?? 0),
          fromString: form.barre.fromString,
          toString: form.barre.toString,
        }
      : undefined,
  };
}

/** 手型的封閉把位：根音落在第幾格 */
function formBase(form: MovableForm, rootPc: number): number {
  const openPc = form.rootString === 6 ? E_OPEN_PC : A_OPEN_PC;
  let base = (rootPc - openPc + 12) % 12;
  if (base === 0) base = 12;
  return base;
}

export function findChordShape(root: string, quality: ChordQuality): ChordShape {
  const name = root + CHORD_FORMULAS[quality].suffix;
  const existing = CHORDS.find(
    (c) => c.chordName === name && c.quality === quality,
  );
  if (existing) return existing;

  // 沒有現成按法：以可移動手型產生，挑把位最低的
  const rootPc = noteToPc(root);
  const candidates = MOVABLE_FORMS[quality]
    .map((form) => ({ form, base: formBase(form, rootPc) }))
    .sort((a, b) => a.base - b.base);

  const { form, base } = candidates[0];
  return buildFromForm(form, root, quality, base);
}

/**
 * 同把位對照用：強制以「A 型」（根音在第五弦）可移動手型產生按法，
 * 讓同一根音的整個家族停在同一個把位，只有變動的音會移動——
 * 一眼看清 C→Cm 這類「其實只動一個音」的變化。所有性質都有 A 型手型。
 */
export function findMovableAShape(
  root: string,
  quality: ChordQuality,
): ChordShape {
  const forms = MOVABLE_FORMS[quality];
  const form = forms.find((f) => f.rootString === 5) ?? forms[0];
  return buildFromForm(form, root, quality, formBase(form, noteToPc(root)));
}

/** 依和弦名稱取 A 型可移動手型（同把位對照、學習清單內嵌圖用） */
export function findMovableShapeForName(chordName: string): ChordShape {
  const root = parseRoot(chordName);
  const quality = SUFFIX_TO_QUALITY[chordName.slice(root.length)];
  if (!quality) throw new Error(`無法解析和弦名稱：${chordName}`);
  return findMovableAShape(root, quality);
}
