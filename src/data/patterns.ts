import { STANDARD_TUNING_MIDI } from "../types/music";

/**
 * 指型把位演算法：把音階切成「每弦固定 N 個音」的可背形狀。
 * - 五聲把位（box）：每弦 2 音，共 5 個把位
 * - 一弦三音（3NPS）：每弦 3 音，共 7 個把位
 * 規則：第 k 把位從第六弦的第 k 個音階音出發，之後每條弦
 * 取「音高嚴格上行」的前 N 個音階音——這正是標準指型的由來。
 */

export interface PatternNote {
  /** 弦索引，0 = 低音 E */
  string: number;
  fret: number;
  midi: number;
  degree: string;
}

export function buildPattern(
  rootPc: number,
  intervals: number[],
  degrees: string[],
  startIndex: number,
  notesPerString: number,
): PatternNote[] {
  const degreeByPc = new Map<number, string>(
    intervals.map((s, i) => [(rootPc + s) % 12, degrees[i]]),
  );
  // 第六弦（E）上把位起點：根音格 + 該音階音的音程，收在 0–11 格內
  const startFret = (rootPc + intervals[startIndex] - 4 + 24) % 12;

  const notes: PatternNote[] = [];
  let lastMidi = -Infinity;
  for (let s = 0; s < 6; s++) {
    let count = 0;
    for (let f = s === 0 ? startFret : 0; f <= 24 && count < notesPerString; f++) {
      const midi = STANDARD_TUNING_MIDI[s] + f;
      if (midi <= lastMidi) continue;
      const degree = degreeByPc.get(midi % 12);
      if (degree === undefined) continue;
      notes.push({ string: s, fret: f, midi, degree });
      lastMidi = midi;
      count++;
    }
  }
  return notes;
}
