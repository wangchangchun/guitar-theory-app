/**
 * 歌曲和弦進行資料庫：以 step 為單位，每個 step 有和弦、級數
 * 與拍數（預設 4 拍 = 一小節；2 拍 = 半小節，用來表現較快的和聲節奏）。
 */

export type Genre = "jpop" | "rock" | "blues" | "punk" | "pop-rock" | "metal";

export interface ProgressionStep {
  chord: string;
  numeral: string;
  /** 佔幾拍（4/4 拍制），預設 4 = 一整小節 */
  beats?: number;
}

export interface Progression {
  id: string;
  title: string;
  genre: Genre;
  /** 調性主音（移調的基準），例如 "C"、"E" */
  keyRoot: string;
  keyQuality: "major" | "minor";
  bpm: number;
  steps: ProgressionStep[];
  description: string;
  /** solo 建議音階 */
  soloTip: string;
  /** 代表性歌曲／風格 */
  examples?: string;
}

export const PROGRESSIONS: Progression[] = [
  // ── 日系五大進行（先在 C 調練熟，再用移調器移到 G、F、D、A）──
  {
    id: "jpop-oudou",
    title: "王道進行",
    genre: "jpop",
    keyRoot: "C",
    keyQuality: "major",
    bpm: 92,
    steps: [
      { chord: "Fmaj7", numeral: "IVM7" },
      { chord: "G7", numeral: "V7" },
      { chord: "Em7", numeral: "IIIm7" },
      { chord: "Am7", numeral: "VIm7" },
    ],
    description:
      "J-pop 出現率最高的進行：從 IV 起手（不從主和弦出發，一開始就懸浮），V 推進、IIIm7 過渡、VIm7 收進小調的溫柔。變體：把 Em7 換成 E7（III7 副屬和弦），對 Am7 的拉力更強、更「催淚」。",
    soloTip: "C 大調音階；長音落在各和弦的 7 音或 9 音，最有日系懸浮感。",
    examples: "數不清的 J-pop 副歌都是它，聽到「IV 開頭的溫柔感」就是了。",
  },
  {
    id: "jpop-komuro",
    title: "小室進行",
    genre: "jpop",
    keyRoot: "C",
    keyQuality: "major",
    bpm: 128,
    steps: [
      { chord: "Am", numeral: "VIm" },
      { chord: "F", numeral: "IV" },
      { chord: "G", numeral: "V" },
      { chord: "C", numeral: "I" },
    ],
    description:
      "小調開頭、大調收尾：VIm 的憂鬱起跑，經過 IV–V 的標準推進，最後亮亮地落在 I。90 年代小室哲哉時代至今的日系動感歌骨架。",
    soloTip: "A 小調五聲或 A 自然小調（跟 C 大調同一組音）。",
    examples: "90 年代日系舞曲、動畫 OP 的常客。",
  },
  {
    id: "jpop-canon",
    title: "カノン進行（卡農進行）",
    genre: "jpop",
    keyRoot: "C",
    keyQuality: "major",
    bpm: 100,
    steps: [
      { chord: "C", numeral: "I" },
      { chord: "G", numeral: "V" },
      { chord: "Am", numeral: "VIm" },
      { chord: "Em", numeral: "IIIm" },
      { chord: "F", numeral: "IV" },
      { chord: "C", numeral: "I" },
      { chord: "F", numeral: "IV" },
      { chord: "G", numeral: "V" },
    ],
    description:
      "低音線 C–B–A–G–F–E–F–G 級進下行——就是帕海貝爾卡農的和聲，古典耳朵會立刻認出來。溫暖、懷舊、越走越開闊，J-pop 抒情歌的長青樹。",
    soloTip: "C 大調音階；跟著低音線下行寫對旋律特別好聽。",
    examples: "畢業歌、抒情大合唱系的標配。",
  },
  {
    id: "jpop-marusa",
    title: "丸サ進行（Just the Two of Us）",
    genre: "jpop",
    keyRoot: "C",
    keyQuality: "major",
    bpm: 96,
    steps: [
      { chord: "Fmaj7", numeral: "IVM7" },
      { chord: "E7", numeral: "III7" },
      { chord: "Am7", numeral: "VIm7" },
      { chord: "Gm7", numeral: "Vm7", beats: 2 },
      { chord: "C7", numeral: "I7", beats: 2 },
    ],
    description:
      "都會、R&B 感，近年 J-pop 極流行。E7 是 Am 的副屬和弦（III7）——用古典的副屬概念一秒理解；最後一小節的 Gm7–C7 是往 IV（F）的 II–V，半小節換一次和弦，和聲節奏加快把音樂推回開頭。",
    soloTip: "A 小調五聲；在 E7 上把 G 改成 G#（A 和聲小調）最對味。",
    examples: "丸の内サディスティック、Just the Two of Us。",
  },
  {
    id: "jpop-4536251",
    title: "4536251 萬能進行",
    genre: "jpop",
    keyRoot: "C",
    keyQuality: "major",
    bpm: 84,
    steps: [
      { chord: "F", numeral: "IV", beats: 2 },
      { chord: "G", numeral: "V", beats: 2 },
      { chord: "Em", numeral: "IIIm", beats: 2 },
      { chord: "Am", numeral: "VIm", beats: 2 },
      { chord: "Dm", numeral: "IIm", beats: 2 },
      { chord: "G", numeral: "V", beats: 2 },
      { chord: "C", numeral: "I" },
    ],
    description:
      "華語＋日系通用的萬能進行：4–5–3–6–2–5–1。前三小節兩拍換一個和弦（和聲節奏較快、一路推進），最後整小節停在 I 收尾，情緒起伏完整。",
    soloTip: "C 大調音階／大調五聲，重拍落和弦音。",
    examples: "華語抒情歌與 J-pop 民謠系的共同骨架。",
  },

  // ── 歐美經典進行 ──────────────────────────
  {
    id: "twelve-bar-blues-E",
    title: "12 小節藍調",
    genre: "blues",
    keyRoot: "E",
    keyQuality: "major",
    bpm: 96,
    steps: [
      { chord: "E7", numeral: "I7" },
      { chord: "E7", numeral: "I7" },
      { chord: "E7", numeral: "I7" },
      { chord: "E7", numeral: "I7" },
      { chord: "A7", numeral: "IV7" },
      { chord: "A7", numeral: "IV7" },
      { chord: "E7", numeral: "I7" },
      { chord: "E7", numeral: "I7" },
      { chord: "B7", numeral: "V7" },
      { chord: "A7", numeral: "IV7" },
      { chord: "E7", numeral: "I7" },
      { chord: "B7", numeral: "V7" },
    ],
    description:
      "藍調搖滾的地基：I–IV–V 三個屬七和弦排成固定的 12 小節，從 Chuck Berry 到 AC/DC 都在用。最後一小節回到 V7 叫 turnaround，把音樂拉回開頭再來一輪。",
    soloTip: "E 小調五聲音階或 E 藍調音階，一條用到底。",
    examples: "Johnny B. Goode、Hound Dog 這類經典的骨架。",
  },
  {
    id: "axis-I-V-vi-IV",
    title: "I–V–vi–IV 四和弦金曲",
    genre: "pop-rock",
    keyRoot: "C",
    keyQuality: "major",
    bpm: 120,
    steps: [
      { chord: "C", numeral: "I" },
      { chord: "G", numeral: "V" },
      { chord: "Am", numeral: "vi" },
      { chord: "F", numeral: "IV" },
    ],
    description:
      "歐美流行搖滾最常見的四和弦循環：I 是家、V 帶動力、vi 轉憂鬱、IV 再推回家。數不清的暢銷曲都是它。",
    soloTip: "C 大調音階／C 大調五聲；想帶點感傷改用 A 小調五聲（其實是同一組音）。",
    examples: "Let It Be、With or Without You…列得完才奇怪。",
  },
  {
    id: "sad-vi-IV-I-V",
    title: "vi–IV–I–V 感傷搖滾",
    genre: "pop-rock",
    keyRoot: "C",
    keyQuality: "major",
    bpm: 90,
    steps: [
      { chord: "Am", numeral: "vi" },
      { chord: "F", numeral: "IV" },
      { chord: "C", numeral: "I" },
      { chord: "G", numeral: "V" },
    ],
    description:
      "跟四和弦金曲用一樣的和弦，只是從 Am 出發——整個氛圍立刻變憂鬱。同樣的材料，順序決定情緒。",
    soloTip: "A 小調五聲／A 自然小調。",
    examples: "無數抒情搖滾與 ballad 的套路。",
  },
  {
    id: "punk-I-IV-V",
    title: "I–IV–V 龐克三和弦",
    genre: "punk",
    keyRoot: "A",
    keyQuality: "major",
    bpm: 160,
    steps: [
      { chord: "A", numeral: "I" },
      { chord: "D", numeral: "IV" },
      { chord: "E", numeral: "V" },
    ],
    description:
      "三個和弦打天下：最原始的搖滾能量。全部下撥、越直越好，態度比技巧重要。",
    soloTip: "A 大調五聲；其實龐克 solo 常常就是把主旋律再彈一次。",
    examples: "Ramones 式直球，早期搖滾與龐克的共同語言。",
  },
  {
    id: "andalusian-Am",
    title: "i–♭VII–♭VI–V 西班牙下行",
    genre: "rock",
    keyRoot: "A",
    keyQuality: "minor",
    bpm: 110,
    steps: [
      { chord: "Am", numeral: "i" },
      { chord: "G", numeral: "♭VII" },
      { chord: "F", numeral: "♭VI" },
      { chord: "E", numeral: "V" },
    ],
    description:
      "根音一路下行製造宿命感，經典搖滾與金屬 ballad 的常客。最後的 E 是大三和弦（和聲小調借來的 V），把你用力拽回 Am。",
    soloTip: "A 自然小調；彈到 E 和弦那小節把 G 升成 G#（和聲小調）更對味。",
    examples: "Hit the Road Jack、Sultans of Swing 段落都有它的影子。",
  },
  {
    id: "mixolydian-D-C-G",
    title: "I–♭VII–IV 經典搖滾",
    genre: "rock",
    keyRoot: "D",
    keyQuality: "major",
    bpm: 116,
    steps: [
      { chord: "D", numeral: "I" },
      { chord: "C", numeral: "♭VII" },
      { chord: "G", numeral: "IV" },
    ],
    description:
      "大調卻混進 ♭VII 這個「借來的」和弦，正是 Mixolydian 調式的招牌味——立刻有經典搖滾電台的氣味。",
    soloTip: "D Mixolydian（跟 G 大調同一組音）或 D 大調五聲。",
    examples: "Sweet Home Alabama、Sympathy for the Devil 的骨架。",
  },
  {
    id: "fifties-I-vi-IV-V",
    title: "I–vi–IV–V 50 年代進行",
    genre: "pop-rock",
    keyRoot: "C",
    keyQuality: "major",
    bpm: 100,
    steps: [
      { chord: "C", numeral: "I" },
      { chord: "Am", numeral: "vi" },
      { chord: "F", numeral: "IV" },
      { chord: "G", numeral: "V" },
    ],
    description:
      "doo-wop 與早期搖滾樂的招牌循環，溫暖復古。跟四和弦金曲的差別只在 vi 的位置。",
    soloTip: "C 大調五聲，簡單乾淨最對味。",
    examples: "Stand By Me、Earth Angel 的年代感來源。",
  },
  {
    id: "metal-power-i-bVI-bVII",
    title: "i–♭VI–♭VII 金屬強力和弦",
    genre: "metal",
    keyRoot: "E",
    keyQuality: "minor",
    bpm: 140,
    steps: [
      { chord: "E5", numeral: "i" },
      { chord: "C5", numeral: "♭VI" },
      { chord: "D5", numeral: "♭VII" },
    ],
    description:
      "整組用強力和弦彈的自然小調進行：沒有三度音，失真開下去也不會糊。搭配手掌悶音（palm mute）下撥製造重量感。",
    soloTip: "E 小調五聲／E 自然小調。",
    examples: "無數金屬與硬式搖滾 riff 的基本款。",
  },
];
