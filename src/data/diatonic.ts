import type { ChordQuality } from "../types/music";

/**
 * 順階和弦（調性字典）：大調與自然小調每一級的三和弦／七和弦性質。
 * semitones = 該級根音與主音的距離。
 */

export interface DiatonicDegree {
  semitones: number;
  triadQuality: ChordQuality;
  seventhQuality: ChordQuality;
  triadNumeral: string;
  seventhNumeral: string;
  /** 功能角色說明 */
  role: string;
}

export const MAJOR_DEGREES: DiatonicDegree[] = [
  {
    semitones: 0,
    triadQuality: "major",
    seventhQuality: "major7",
    triadNumeral: "I",
    seventhNumeral: "IM7",
    role: "主和弦：家。段落的起點與終點。",
  },
  {
    semitones: 2,
    triadQuality: "minor",
    seventhQuality: "minor7",
    triadNumeral: "IIm",
    seventhNumeral: "IIm7",
    role: "下屬代理：II–V–I 的起手式。",
  },
  {
    semitones: 4,
    triadQuality: "minor",
    seventhQuality: "minor7",
    triadNumeral: "IIIm",
    seventhNumeral: "IIIm7",
    role: "主代理：王道進行的過渡站；換成 III7 就是催淚副屬。",
  },
  {
    semitones: 5,
    triadQuality: "major",
    seventhQuality: "major7",
    triadNumeral: "IV",
    seventhNumeral: "IVM7",
    role: "下屬：離家出走的第一步，日系進行最愛的起點。",
  },
  {
    semitones: 7,
    triadQuality: "major",
    seventhQuality: "dominant7",
    triadNumeral: "V",
    seventhNumeral: "V7",
    role: "屬和弦：唯一的屬七，最想回家（I）的和弦。",
  },
  {
    semitones: 9,
    triadQuality: "minor",
    seventhQuality: "minor7",
    triadNumeral: "VIm",
    seventhNumeral: "VIm7",
    role: "主代理：憂鬱版的家，小調感的來源。",
  },
  {
    semitones: 11,
    triadQuality: "dim",
    seventhQuality: "m7b5",
    triadNumeral: "VII°",
    seventhNumeral: "VIIm7♭5",
    role: "屬代理：極不穩定，幾乎只出現在往 I 或 IIIm 的路上。",
  },
];

export const MINOR_DEGREES: DiatonicDegree[] = [
  {
    semitones: 0,
    triadQuality: "minor",
    seventhQuality: "minor7",
    triadNumeral: "Im",
    seventhNumeral: "Im7",
    role: "小調的家：憂鬱的起點。",
  },
  {
    semitones: 2,
    triadQuality: "dim",
    seventhQuality: "m7b5",
    triadNumeral: "II°",
    seventhNumeral: "IIm7♭5",
    role: "小調 II–V 的起手（IIm7♭5–V7–Im）。",
  },
  {
    semitones: 3,
    triadQuality: "major",
    seventhQuality: "major7",
    triadNumeral: "♭III",
    seventhNumeral: "♭IIIM7",
    role: "平行大調的家：小調裡的一道光。",
  },
  {
    semitones: 5,
    triadQuality: "minor",
    seventhQuality: "minor7",
    triadNumeral: "IVm",
    seventhNumeral: "IVm7",
    role: "小調下屬；被大調借走就是催淚彈。",
  },
  {
    semitones: 7,
    triadQuality: "minor",
    seventhQuality: "minor7",
    triadNumeral: "Vm",
    seventhNumeral: "Vm7",
    role: "自然小調的 V 是小和弦；想要強拉力就借和聲小調的 V7。",
  },
  {
    semitones: 8,
    triadQuality: "major",
    seventhQuality: "major7",
    triadNumeral: "♭VI",
    seventhNumeral: "♭VIM7",
    role: "熱血動漫感的來源之一（♭VI–♭VII–I）。",
  },
  {
    semitones: 10,
    triadQuality: "major",
    seventhQuality: "dominant7",
    triadNumeral: "♭VII",
    seventhNumeral: "♭VII7",
    role: "搖滾感的 ♭VII：借到大調就是 Mixolydian 味。",
  },
];
