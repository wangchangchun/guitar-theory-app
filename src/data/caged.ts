import type { FretValue } from "../types/music";

/**
 * CAGED 系統：任何大三和弦都能用 C·A·G·E·D 五種開放手型的
 * 「封閉版本」沿指板各按一次。手型上移 offset 格後，
 * 原本的空弦音由食指封閉（或省略）代替。
 */

export interface CagedForm {
  form: "C" | "A" | "G" | "E" | "D";
  /** 開放把位的六弦按法（索引 0 = 第六弦），"x" = 不彈 */
  frets: FretValue[];
  /** 開放型的根音 pitch class */
  openRootPc: number;
  /** 根音所在弦索引（0 = 第六弦），找把位時的定位錨 */
  rootString: number;
  tip: string;
}

export const CAGED_FORMS: CagedForm[] = [
  {
    form: "C",
    frets: ["x", 3, 2, 0, 1, 0],
    openRootPc: 0,
    rootString: 1,
    tip: "根音在第五弦（無名指）。移動時食指封住原本的空弦位置，手型像被拉長的 C。",
  },
  {
    form: "A",
    frets: ["x", 0, 2, 2, 2, 0],
    openRootPc: 9,
    rootString: 1,
    tip: "根音在第五弦（食指封閉）。第二常用的封閉型：B 和弦＝A 手型在第 2 格。",
  },
  {
    form: "G",
    frets: [3, 2, 0, 0, 0, 3],
    openRootPc: 7,
    rootString: 0,
    tip: "根音在第六弦（跨度大）。完整封閉吃力，實戰常只取高音側或低音側的一半。",
  },
  {
    form: "E",
    frets: [0, 2, 2, 1, 0, 0],
    openRootPc: 4,
    rootString: 0,
    tip: "根音在第六弦（食指封閉）。最重要的封閉型：F 和弦＝E 手型在第 1 格。",
  },
  {
    form: "D",
    frets: ["x", "x", 0, 2, 3, 2],
    openRootPc: 2,
    rootString: 2,
    tip: "根音在第四弦。高把位的小三角形，適合疊在另一把吉他上面加花。",
  },
];

export interface CagedPosition {
  form: CagedForm;
  /** 手型整體上移的格數（0 = 開放把位） */
  offset: number;
  /** 這個手型實際發聲的（弦, 格） */
  notes: { string: number; fret: number }[];
}

/** 指定根音的五個 CAGED 把位，依指板位置由低到高排列 */
export function cagedPositions(rootPc: number): CagedPosition[] {
  return CAGED_FORMS.map((form) => {
    const offset = (rootPc - form.openRootPc + 12) % 12;
    const notes = form.frets.flatMap((f, s) =>
      f === "x" ? [] : [{ string: s, fret: (f as number) + offset }],
    );
    return { form, offset, notes };
  }).sort((a, b) => a.offset - b.offset);
}
