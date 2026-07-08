/**
 * 五度圈資料：從 C 出發順時針排列，每走一格主音往上完全五度、
 * 調號多一個升記號；逆時針則多一個降記號。
 * 陣列索引即時鐘位置（0 = 12 點鐘的 C）。
 */

export interface CircleKey {
  /** 外圈大調調名 */
  major: string;
  /** 內圈關係小調（共用同一組音） */
  minor: string;
  /** 調號描述，例如 "2♯"、"3♭" */
  signature: string;
  /** 等音調名（僅 F♯／G♭ 這格） */
  enharmonic?: string;
}

export const CIRCLE_KEYS: CircleKey[] = [
  { major: "C", minor: "Am", signature: "無升降" },
  { major: "G", minor: "Em", signature: "1♯" },
  { major: "D", minor: "Bm", signature: "2♯" },
  { major: "A", minor: "F#m", signature: "3♯" },
  { major: "E", minor: "C#m", signature: "4♯" },
  { major: "B", minor: "G#m", signature: "5♯" },
  { major: "F#", minor: "D#m", signature: "6♯", enharmonic: "G♭＝6♭" },
  { major: "D♭", minor: "B♭m", signature: "5♭" },
  { major: "A♭", minor: "Fm", signature: "4♭" },
  { major: "E♭", minor: "Cm", signature: "3♭" },
  { major: "B♭", minor: "Gm", signature: "2♭" },
  { major: "F", minor: "Dm", signature: "1♭" },
];
