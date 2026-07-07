/**
 * 歌曲和弦進行資料庫：每個進行的 chords 與 romanNumerals
 * 一一對應，一格 = 一小節，播放時依 BPM 循環。
 */

export type Genre = "rock" | "blues" | "punk" | "pop-rock" | "metal";

export interface Progression {
  id: string;
  title: string;
  genre: Genre;
  key: string;
  bpm: number;
  /** 每小節的和弦名稱 */
  chords: string[];
  /** 每小節對應的級數記號 */
  romanNumerals: string[];
  description: string;
  /** solo 建議音階 */
  soloTip: string;
  /** 代表性歌曲／風格 */
  examples?: string;
}

export const PROGRESSIONS: Progression[] = [
  {
    id: "twelve-bar-blues-E",
    title: "12 小節藍調",
    genre: "blues",
    key: "E",
    bpm: 96,
    chords: ["E7", "E7", "E7", "E7", "A7", "A7", "E7", "E7", "B7", "A7", "E7", "B7"],
    romanNumerals: ["I7", "I7", "I7", "I7", "IV7", "IV7", "I7", "I7", "V7", "IV7", "I7", "V7"],
    description:
      "藍調搖滾的地基：I–IV–V 三個屬七和弦排成固定的 12 小節，從 Chuck Berry 到 AC/DC 都在用。最後一小節回到 V7 叫 turnaround，把音樂拉回開頭再來一輪。",
    soloTip: "E 小調五聲音階或 E 藍調音階，一條用到底。",
    examples: "Johnny B. Goode、Hound Dog 這類經典的骨架。",
  },
  {
    id: "axis-I-V-vi-IV",
    title: "I–V–vi–IV 四和弦金曲",
    genre: "pop-rock",
    key: "C",
    bpm: 120,
    chords: ["C", "G", "Am", "F"],
    romanNumerals: ["I", "V", "vi", "IV"],
    description:
      "流行搖滾最常見的四和弦循環：I 是家、V 帶動力、vi 轉憂鬱、IV 再推回家。數不清的暢銷曲都是它。",
    soloTip: "C 大調音階／C 大調五聲；想帶點感傷改用 A 小調五聲（其實是同一組音）。",
    examples: "Let It Be、With or Without You…列得完才奇怪。",
  },
  {
    id: "sad-vi-IV-I-V",
    title: "vi–IV–I–V 感傷搖滾",
    genre: "pop-rock",
    key: "C（Am 起）",
    bpm: 90,
    chords: ["Am", "F", "C", "G"],
    romanNumerals: ["vi", "IV", "I", "V"],
    description:
      "跟四和弦金曲用一樣的和弦，只是從 Am 出發——整個氛圍立刻變憂鬱。同樣的材料，順序決定情緒。",
    soloTip: "A 小調五聲／A 自然小調。",
    examples: "無數抒情搖滾與 ballad 的套路。",
  },
  {
    id: "punk-I-IV-V",
    title: "I–IV–V 龐克三和弦",
    genre: "punk",
    key: "A",
    bpm: 160,
    chords: ["A", "D", "E"],
    romanNumerals: ["I", "IV", "V"],
    description:
      "三個和弦打天下：最原始的搖滾能量。全部下撥、越直越好，態度比技巧重要。",
    soloTip: "A 大調五聲；其實龐克 solo 常常就是把主旋律再彈一次。",
    examples: "Ramones 式直球，早期搖滾與龐克的共同語言。",
  },
  {
    id: "andalusian-Am",
    title: "i–♭VII–♭VI–V 西班牙下行",
    genre: "rock",
    key: "Am",
    bpm: 110,
    chords: ["Am", "G", "F", "E"],
    romanNumerals: ["i", "♭VII", "♭VI", "V"],
    description:
      "根音一路下行製造宿命感，經典搖滾與金屬 ballad 的常客。最後的 E 是大三和弦（和聲小調借來的 V），把你用力拽回 Am。",
    soloTip: "A 自然小調；彈到 E 和弦那小節把 G 升成 G#（和聲小調）更對味。",
    examples: "Hit the Road Jack、Sultans of Swing 段落都有它的影子。",
  },
  {
    id: "mixolydian-D-C-G",
    title: "I–♭VII–IV 經典搖滾",
    genre: "rock",
    key: "D",
    bpm: 116,
    chords: ["D", "C", "G"],
    romanNumerals: ["I", "♭VII", "IV"],
    description:
      "大調卻混進 ♭VII 這個「借來的」和弦，正是 Mixolydian 調式的招牌味——立刻有經典搖滾電台的氣味。",
    soloTip: "D Mixolydian（跟 G 大調同一組音）或 D 大調五聲。",
    examples: "Sweet Home Alabama、Sympathy for the Devil 的骨架。",
  },
  {
    id: "fifties-I-vi-IV-V",
    title: "I–vi–IV–V 50 年代進行",
    genre: "pop-rock",
    key: "C",
    bpm: 100,
    chords: ["C", "Am", "F", "G"],
    romanNumerals: ["I", "vi", "IV", "V"],
    description:
      "doo-wop 與早期搖滾樂的招牌循環，溫暖復古。跟四和弦金曲的差別只在 vi 的位置。",
    soloTip: "C 大調五聲，簡單乾淨最對味。",
    examples: "Stand By Me、Earth Angel 的年代感來源。",
  },
  {
    id: "metal-power-i-bVI-bVII",
    title: "i–♭VI–♭VII 金屬強力和弦",
    genre: "metal",
    key: "Em",
    bpm: 140,
    chords: ["E5", "C5", "D5"],
    romanNumerals: ["i", "♭VI", "♭VII"],
    description:
      "整組用強力和弦彈的自然小調進行：沒有三度音，失真開下去也不會糊。搭配手掌悶音（palm mute）下撥製造重量感。",
    soloTip: "E 小調五聲／E 自然小調。",
    examples: "無數金屬與硬式搖滾 riff 的基本款。",
  },
];
