/**
 * 音階資料庫：每個音階以「由根音起算的半音數」定義，
 * degrees 與 intervals 一一對應（例如小調五聲的 3 半音 = ♭3）。
 *
 * 每個音階還記錄「它是從哪條音階、做了什麼改變而來的」（derivation），
 * 讓學習者不用死背八組音，而是從大調音階一路推出來。
 */

export type ChangeKind = "kept" | "changed" | "removed" | "added";

export interface DerivationRow {
  /** 父音階的級數；null = 這個音是新加進來的 */
  parent: string | null;
  /** 這條音階的級數；null = 這個音被拿掉了 */
  child: string | null;
  kind: ChangeKind;
}

export interface Derivation {
  /** 父音階 id */
  fromId: string;
  /** 一句話：做了什麼改變（顯示在標題列） */
  summary: string;
  /** 為什麼要這樣改：聲音上得到什麼、代價是什麼 */
  why: string;
  /** 逐音對照表，依父音階的級數順序排列 */
  rows: DerivationRow[];
}

export interface ScaleDef {
  id: string;
  name: string;
  intervals: number[];
  degrees: string[];
  /** 這個音階是什麼、怎麼來的 */
  description: string;
  /** 搖滾情境下怎麼用 */
  usage: string;
  /** 一句話的聲音個性，給新手先有印象 */
  mood: string;
  /** 從哪條音階變來的；大調音階是參考原點，沒有父音階 */
  derivation?: Derivation;
  /**
   * 把位起點使用的音程（未指定則每個音階音各起一個把位）。
   * 例如藍調音階沿用小調五聲的 5 個把位，♭5 不當起點。
   */
  positionAnchors?: number[];
}

export const SCALES: ScaleDef[] = [
  {
    id: "major",
    name: "大調音階",
    intervals: [0, 2, 4, 5, 7, 9, 11],
    degrees: ["1", "2", "3", "4", "5", "6", "7"],
    mood: "明亮、穩定，像「Do Re Mi」那樣理所當然。",
    description:
      "全-全-半-全-全-全-半，所有樂理的參考原點：其他音階的 ♭3、♭7 都是相對它而言。聲音明亮、穩定。",
    usage: "流行搖滾旋律與確立調性的基本功。先把它聽熟，其他音階才有「差在哪」的感覺。",
  },
  {
    id: "major-pentatonic",
    name: "大調五聲音階",
    intervals: [0, 2, 4, 7, 9],
    degrees: ["1", "2", "3", "5", "6"],
    mood: "陽光、開朗，怎麼彈都不會錯。",
    description:
      "大調音階拿掉 4 和 7——兩個最容易和和弦打架的音，剩下五個怎麼彈都不出錯的音。",
    usage: "南方搖滾、鄉村味 solo 的招牌，聽起來陽光開朗。",
    derivation: {
      fromId: "major",
      summary: "拿掉 4 和 7 兩個音",
      why:
        "4 和 7 是大調裡最不安分的兩個音：4 一直想解決到 3，7 一直想衝回 1。把它們拿掉之後，剩下的五個音配上調內任何和弦都不會打架——這就是「五聲怎麼彈都不會錯」的真正原因。",
      rows: [
        { parent: "1", child: "1", kind: "kept" },
        { parent: "2", child: "2", kind: "kept" },
        { parent: "3", child: "3", kind: "kept" },
        { parent: "4", child: null, kind: "removed" },
        { parent: "5", child: "5", kind: "kept" },
        { parent: "6", child: "6", kind: "kept" },
        { parent: "7", child: null, kind: "removed" },
      ],
    },
  },
  {
    id: "natural-minor",
    name: "自然小調音階",
    intervals: [0, 2, 3, 5, 7, 8, 10],
    degrees: ["1", "2", "♭3", "4", "5", "♭6", "♭7"],
    mood: "憂鬱、沉，搖滾與金屬的預設情緒。",
    description:
      "大調音階從第六個音出發的重新排列：和同名大調只差 ♭3、♭6、♭7 三個音，氛圍就從明亮變憂鬱。",
    usage: "搖滾 ballad 與金屬的基本語彙，配小調和弦進行（如 Am–F–C–G）。",
    derivation: {
      fromId: "major",
      summary: "把 3、6、7 各降半音",
      why:
        "決定「大調還是小調」的關鍵只有第 3 個音：降半音之後大三度變成小三度，氣氛立刻由亮轉暗。♭6 和 ♭7 再把憂鬱補滿。只動三個音，整首歌的顏色就換掉了。",
      rows: [
        { parent: "1", child: "1", kind: "kept" },
        { parent: "2", child: "2", kind: "kept" },
        { parent: "3", child: "♭3", kind: "changed" },
        { parent: "4", child: "4", kind: "kept" },
        { parent: "5", child: "5", kind: "kept" },
        { parent: "6", child: "♭6", kind: "changed" },
        { parent: "7", child: "♭7", kind: "changed" },
      ],
    },
  },
  {
    id: "minor-pentatonic",
    name: "小調五聲音階",
    intervals: [0, 3, 5, 7, 10],
    degrees: ["1", "♭3", "4", "5", "♭7"],
    mood: "直接、耐聽，搖滾 solo 的萬用鑰匙。",
    description: "自然小調拿掉 2 和 ♭6，剩五個音：搖滾 solo 的萬用鑰匙。",
    usage:
      "幾乎所有搖滾吉他手學的第一條音階。背熟指型後加上推弦與滑音，就是最經典的搖滾腔。",
    derivation: {
      fromId: "natural-minor",
      summary: "拿掉 2 和 ♭6 兩個音",
      why:
        "2 和 ♭6 是小調裡最容易和和弦擦撞的兩個音，停在上面很容易「聽起來怪怪的」。拿掉之後剩五個音，隨便停在哪一個都安全，推弦揉弦怎麼玩都對——所以它是新手的第一條 solo 音階。",
      rows: [
        { parent: "1", child: "1", kind: "kept" },
        { parent: "2", child: null, kind: "removed" },
        { parent: "♭3", child: "♭3", kind: "kept" },
        { parent: "4", child: "4", kind: "kept" },
        { parent: "5", child: "5", kind: "kept" },
        { parent: "♭6", child: null, kind: "removed" },
        { parent: "♭7", child: "♭7", kind: "kept" },
      ],
    },
  },
  {
    id: "blues",
    name: "藍調音階",
    intervals: [0, 3, 5, 6, 7, 10],
    degrees: ["1", "♭3", "4", "♭5", "5", "♭7"],
    mood: "又髒又對味，一聽就是藍調。",
    description:
      "小調五聲＋♭5「藍調音」：那個又髒又對味的半音，是藍調的靈魂。",
    usage: "藍調與藍調搖滾。♭5 當經過音滑過去最對味，別在上面停留太久。",
    positionAnchors: [0, 3, 5, 7, 10],
    derivation: {
      fromId: "minor-pentatonic",
      summary: "在 4 和 5 中間插入一個 ♭5",
      why:
        "♭5 不屬於任何一個調，正因為「不對」才有那股張力。它是經過音——從 4 滑到 5、或從 5 滑到 4 的路上順手擦過去最好聽，停在上面反而會變成單純的走音。",
      rows: [
        { parent: "1", child: "1", kind: "kept" },
        { parent: "♭3", child: "♭3", kind: "kept" },
        { parent: "4", child: "4", kind: "kept" },
        { parent: null, child: "♭5", kind: "added" },
        { parent: "5", child: "5", kind: "kept" },
        { parent: "♭7", child: "♭7", kind: "kept" },
      ],
    },
  },
  {
    id: "harmonic-minor",
    name: "和聲小調音階",
    intervals: [0, 2, 3, 5, 7, 8, 11],
    degrees: ["1", "2", "♭3", "4", "5", "♭6", "7"],
    mood: "小調底、異國味，帶著古典的緊張感。",
    description:
      "自然小調把 ♭7 升回 7：就為了讓小調也有 V7→Im 的強力「回家」拉力。7 和 ♭6 之間的增二度，帶著獨特的異國味。",
    usage:
      "小調進行彈到 V（或 V7）那一小節就切換它（把 ♭7 升半音，如 Am 調把 G 升成 G#）；也是新古典金屬速彈的招牌音階。",
    derivation: {
      fromId: "natural-minor",
      summary: "把 ♭7 升回 7",
      why:
        "自然小調的 ♭7 離主音有一個全音，回家的拉力太鬆。升回 7 之後只差半音，V7→Im 的解決感立刻變強。代價是 ♭6 到 7 之間被拉開成三個半音（增二度）——那個大跳就是它聽起來「異國」的來源。",
      rows: [
        { parent: "1", child: "1", kind: "kept" },
        { parent: "2", child: "2", kind: "kept" },
        { parent: "♭3", child: "♭3", kind: "kept" },
        { parent: "4", child: "4", kind: "kept" },
        { parent: "5", child: "5", kind: "kept" },
        { parent: "♭6", child: "♭6", kind: "kept" },
        { parent: "♭7", child: "7", kind: "changed" },
      ],
    },
  },
  {
    id: "dorian",
    name: "Dorian 調式",
    intervals: [0, 2, 3, 5, 7, 9, 10],
    degrees: ["1", "2", "♭3", "4", "5", "6", "♭7"],
    mood: "憂鬱裡帶一點亮，比自然小調洋氣。",
    description: "小調但把 ♭6 還原成 6：憂鬱裡帶一點亮，比自然小調洋氣。",
    usage: "放克搖滾、Santana 式的 solo；小調進行想要時髦一點就換它。",
    derivation: {
      fromId: "natural-minor",
      summary: "把 ♭6 還原成 6",
      why:
        "♭6 是自然小調裡最「苦」的音。還原成 6 之後，決定小調身分的 ♭3 還在，但那股苦味被抽掉了——變成憂鬱裡透著一點光。只動一個音，就從悲情搖滾變成放克。",
      rows: [
        { parent: "1", child: "1", kind: "kept" },
        { parent: "2", child: "2", kind: "kept" },
        { parent: "♭3", child: "♭3", kind: "kept" },
        { parent: "4", child: "4", kind: "kept" },
        { parent: "5", child: "5", kind: "kept" },
        { parent: "♭6", child: "6", kind: "changed" },
        { parent: "♭7", child: "♭7", kind: "kept" },
      ],
    },
  },
  {
    id: "mixolydian",
    name: "Mixolydian 調式",
    intervals: [0, 2, 4, 5, 7, 9, 10],
    degrees: ["1", "2", "3", "4", "5", "6", "♭7"],
    mood: "大調的亮，但重心往下沉——經典搖滾的味道。",
    description: "大調但 7 降成 ♭7：屬七和弦（X7）的原生音階。",
    usage: "經典搖滾 riff（AC/DC 味）與藍調上的大調系 solo；配 I–♭VII–IV 進行剛剛好。",
    derivation: {
      fromId: "major",
      summary: "把 7 降成 ♭7",
      why:
        "大調的 7 死命想回到 1，調性感很強。降成 ♭7 之後那股拉力鬆掉，重心往下沉、聽起來沒那麼「乖」——這正好是屬七和弦（X7）的聲音，也是經典搖滾 riff 的共同語言。",
      rows: [
        { parent: "1", child: "1", kind: "kept" },
        { parent: "2", child: "2", kind: "kept" },
        { parent: "3", child: "3", kind: "kept" },
        { parent: "4", child: "4", kind: "kept" },
        { parent: "5", child: "5", kind: "kept" },
        { parent: "6", child: "6", kind: "kept" },
        { parent: "7", child: "♭7", kind: "changed" },
      ],
    },
  },
];

export const scaleById = (id: string) => SCALES.find((s) => s.id === id)!;

/**
 * 音階的「步階序列」：相鄰兩音差幾個半音（最後一步是回到八度）。
 * 例如大調音階 → [2,2,1,2,2,2,1] = 全全半全全全半。
 */
export function scaleSteps(intervals: number[]): number[] {
  return intervals.map((s, i) =>
    i + 1 < intervals.length ? intervals[i + 1] - s : 12 - s,
  );
}

/** 半音數 → 中文步階名（吉他上 1 格 = 1 半音） */
export function stepName(semitones: number): string {
  switch (semitones) {
    case 1:
      return "半音";
    case 2:
      return "全音";
    case 3:
      return "全音半";
    case 4:
      return "兩個全音";
    default:
      return `${semitones} 格`;
  }
}
