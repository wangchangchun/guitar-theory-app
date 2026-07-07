import { useState } from "react";
import type { ReactElement } from "react";
import { ChordLibraryPage } from "./pages/ChordLibraryPage";
import { ScalesPage } from "./pages/ScalesPage";
import { DiatonicPage } from "./pages/DiatonicPage";
import { SongProgressionsPage } from "./pages/SongProgressionsPage";
import { PracticePage } from "./pages/PracticePage";

type PageId = "chords" | "scales" | "diatonic" | "songs" | "practice";

const NAV_ITEMS: { id: PageId; label: string }[] = [
  { id: "chords", label: "和弦圖鑑" },
  { id: "scales", label: "音階教學" },
  { id: "diatonic", label: "調性字典" },
  { id: "songs", label: "歌曲進行" },
  { id: "practice", label: "樂理練習" },
];

const PAGES: Record<PageId, () => ReactElement> = {
  chords: ChordLibraryPage,
  scales: ScalesPage,
  diatonic: DiatonicPage,
  songs: SongProgressionsPage,
  practice: PracticePage,
};

const FOOTNOTES: Record<PageId, string> = {
  chords: "點擊任一和弦卡片即可聆聽音效（Karplus-Strong 弦振動合成）。",
  scales: "點指板上的音可以單獨試聽；級數代表該音與根音的音程關係。",
  diatonic: "練習目標：看到級數 1 秒反射出和弦代號——這張表是所有分析的字典。",
  songs: "▶ 播放會照 BPM 循環刷弦，跟著亮起的小節換和弦練習。",
  practice: "答錯沒關係——回「和弦圖鑑」與「調性字典」複習，再來挑戰！",
};

export default function App() {
  const [page, setPage] = useState<PageId>("chords");
  const Page = PAGES[page];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <header className="border-b border-slate-800 bg-slate-900/70 backdrop-blur">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-8 gap-y-3 px-4 py-4">
          <h1 className="text-xl font-extrabold tracking-tight">
            🎸 搖滾吉他<span className="text-amber-400">樂理教室</span>
          </h1>
          <nav className="flex flex-wrap gap-1">
            {NAV_ITEMS.map((item) => (
              <button
                key={item.id}
                onClick={() => setPage(item.id)}
                className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                  page === item.id
                    ? "bg-amber-500 text-slate-950"
                    : "bg-slate-800 text-amber-300 hover:bg-slate-700"
                }`}
              >
                {item.label}
              </button>
            ))}
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-6">
        <Page />
      </main>

      <footer className="mx-auto max-w-6xl px-4 pb-8 text-center text-xs text-slate-600">
        {FOOTNOTES[page]}
      </footer>
    </div>
  );
}
