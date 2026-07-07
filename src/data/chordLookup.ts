import type { ChordQuality, ChordShape, FretValue } from "../types/music";
import { CHORDS } from "./chords";
import { CHORD_FORMULAS, noteToPc } from "./theory";

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
  /** 食指橫按範圍（琴格 = 封閉把位） */
  barre?: { fromString: number; toString: number };
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
};

export function findChordShape(root: string, quality: ChordQuality): ChordShape {
  const name = root + CHORD_FORMULAS[quality].suffix;
  const existing = CHORDS.find(
    (c) => c.chordName === name && c.quality === quality,
  );
  if (existing) return existing;

  // 沒有現成按法：以可移動手型產生，挑把位最低的
  const rootPc = noteToPc(root);
  const candidates = MOVABLE_FORMS[quality]
    .map((form) => {
      const openPc = form.rootString === 6 ? E_OPEN_PC : A_OPEN_PC;
      let base = (rootPc - openPc + 12) % 12;
      if (base === 0) base = 12;
      return { form, base };
    })
    .sort((a, b) => a.base - b.base);

  const { form, base } = candidates[0];
  const frets: FretValue[] = form.relFrets.map((f) =>
    f === "x" ? "x" : f + base,
  );
  return {
    id: `gen-${name}`,
    chordName: name,
    quality,
    positionType: form.barre ? "barre" : "movable",
    frets,
    fingers: form.fingers,
    barre: form.barre
      ? { fret: base, fromString: form.barre.fromString, toString: form.barre.toString }
      : undefined,
  };
}
