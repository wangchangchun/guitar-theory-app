/**
 * 音階資料庫：每個音階以「由根音起算的半音數」定義，
 * degrees 與 intervals 一一對應（例如小調五聲的 3 半音 = ♭3）。
 */

export interface ScaleDef {
  id: string;
  name: string;
  intervals: number[];
  degrees: string[];
  /** 這個音階是什麼、怎麼來的 */
  description: string;
  /** 搖滾情境下怎麼用 */
  usage: string;
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
    description:
      "全-全-半-全-全-全-半，所有樂理的參考原點：其他音階的 ♭3、♭7 都是相對它而言。聲音明亮、穩定。",
    usage: "流行搖滾旋律與確立調性的基本功。先把它聽熟，其他音階才有「差在哪」的感覺。",
  },
  {
    id: "major-pentatonic",
    name: "大調五聲音階",
    intervals: [0, 2, 4, 7, 9],
    degrees: ["1", "2", "3", "5", "6"],
    description:
      "大調音階拿掉 4 和 7——兩個最容易和和弦打架的音，剩下五個怎麼彈都不出錯的音。",
    usage: "南方搖滾、鄉村味 solo 的招牌，聽起來陽光開朗。",
  },
  {
    id: "natural-minor",
    name: "自然小調音階",
    intervals: [0, 2, 3, 5, 7, 8, 10],
    degrees: ["1", "2", "♭3", "4", "5", "♭6", "♭7"],
    description:
      "大調音階從第六個音出發的重新排列：和同名大調只差 ♭3、♭6、♭7 三個音，氛圍就從明亮變憂鬱。",
    usage: "搖滾 ballad 與金屬的基本語彙，配小調和弦進行（如 Am–F–C–G）。",
  },
  {
    id: "minor-pentatonic",
    name: "小調五聲音階",
    intervals: [0, 3, 5, 7, 10],
    degrees: ["1", "♭3", "4", "5", "♭7"],
    description: "自然小調拿掉 2 和 ♭6，剩五個音：搖滾 solo 的萬用鑰匙。",
    usage:
      "幾乎所有搖滾吉他手學的第一條音階。背熟指型後加上推弦與滑音，就是最經典的搖滾腔。",
  },
  {
    id: "blues",
    name: "藍調音階",
    intervals: [0, 3, 5, 6, 7, 10],
    degrees: ["1", "♭3", "4", "♭5", "5", "♭7"],
    description:
      "小調五聲＋♭5「藍調音」（青色標記）：那個又髒又對味的半音，是藍調的靈魂。",
    usage: "藍調與藍調搖滾。♭5 當經過音滑過去最對味，別在上面停留太久。",
    positionAnchors: [0, 3, 5, 7, 10],
  },
  {
    id: "dorian",
    name: "Dorian 調式",
    intervals: [0, 2, 3, 5, 7, 9, 10],
    degrees: ["1", "2", "♭3", "4", "5", "6", "♭7"],
    description: "小調但把 ♭6 還原成 6：憂鬱裡帶一點亮，比自然小調洋氣。",
    usage: "放克搖滾、Santana 式的 solo；小調進行想要時髦一點就換它。",
  },
  {
    id: "mixolydian",
    name: "Mixolydian 調式",
    intervals: [0, 2, 4, 5, 7, 9, 10],
    degrees: ["1", "2", "3", "4", "5", "6", "♭7"],
    description: "大調但 7 降成 ♭7：屬七和弦（X7）的原生音階。",
    usage: "經典搖滾 riff（AC/DC 味）與藍調上的大調系 solo；配 I–♭VII–IV 進行剛剛好。",
  },
];
