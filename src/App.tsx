import { useState } from "react";
import type { ReactElement } from "react";
import type { PageId } from "./nav";
import { NavContext } from "./nav";
import { RoadmapPage } from "./pages/RoadmapPage";
import { ChordLibraryPage } from "./pages/ChordLibraryPage";
import { ScalesPage } from "./pages/ScalesPage";
import { FingeringSystemsPage } from "./pages/FingeringSystemsPage";
import { FretboardMapPage } from "./pages/FretboardMapPage";
import { DiatonicPage } from "./pages/DiatonicPage";
import { CircleOfFifthsPage } from "./pages/CircleOfFifthsPage";
import { SongProgressionsPage } from "./pages/SongProgressionsPage";
import { PracticePage } from "./pages/PracticePage";

const NAV_ITEMS: { id: PageId; label: string }[] = [
  { id: "roadmap", label: "學習路線" },
  { id: "chords", label: "和弦圖鑑" },
  { id: "scales", label: "音階教學" },
  { id: "fingering", label: "指型把位" },
  { id: "fretmap", label: "指板地圖" },
  { id: "diatonic", label: "調性字典" },
  { id: "circle", label: "五度圈" },
  { id: "songs", label: "歌曲進行" },
  { id: "practice", label: "樂理練習" },
];

const PAGES: Record<PageId, () => ReactElement> = {
  roadmap: RoadmapPage,
  chords: ChordLibraryPage,
  scales: ScalesPage,
  fingering: FingeringSystemsPage,
  fretmap: FretboardMapPage,
  diatonic: DiatonicPage,
  circle: CircleOfFifthsPage,
  songs: SongProgressionsPage,
  practice: PracticePage,
};

const FOOTNOTES: Record<PageId, string> = {
  roadmap: "五個階段循序漸進；點任一內容頁或練習單元即可直接前往，進度會自動記錄。",
  chords: "點擊任一和弦卡片即可聆聽音效（Karplus-Strong 弦振動合成）。",
  scales: "點指板上的音可以單獨試聽；級數代表該音與根音的音程關係。",
  fingering:
    "五聲把位＝每弦 2 音 × 5 個把位；一弦三音＝每弦 3 音 × 7 個把位。點音試聽、▶ 播放整個把位。",
  fretmap:
    "指板音名 → CAGED 和弦地圖 → 琶音瞄準：從認識每一格，到讓 solo 跟著和聲走。",
  diatonic: "練習目標：看到級數 1 秒反射出和弦代號——這張表是所有分析的字典。",
  circle:
    "順時針一格＝往上五度（V 方向）、逆時針一格＝往上四度（IV 方向）；點任一調可試聽。",
  songs: "▶ 播放會照 BPM 循環刷弦，跟著亮起的小節換和弦練習。",
  practice:
    "一個單元練一個觀念，答對率 80% 即精通；全部單元精通後解鎖綜合測驗。",
};

export default function App() {
  const [page, setPage] = useState<PageId>("roadmap");
  const [pendingUnitId, setPendingUnitId] = useState<string | null>(null);
  const Page = PAGES[page];

  const navigate = (target: PageId, unitId?: string) => {
    setPage(target);
    setPendingUnitId(unitId ?? null);
    window.scrollTo({ top: 0 });
  };

  return (
    <NavContext.Provider
      value={{
        navigate,
        pendingUnitId,
        consumePendingUnit: () => setPendingUnitId(null),
      }}
    >
      <div className="min-h-screen bg-paper-200 text-ink-900">
        <header className="border-b border-line-200 bg-paper-100/70 backdrop-blur">
          <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-8 gap-y-3 px-4 py-4">
            <button
              onClick={() => navigate("roadmap")}
              className="text-xl font-extrabold tracking-tight"
            >
              🎸 搖滾吉他<span className="text-navy-700">樂理教室</span>
            </button>
            <nav className="flex flex-wrap gap-1">
              {NAV_ITEMS.map((item) => (
                <button
                  key={item.id}
                  onClick={() => navigate(item.id)}
                  className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                    page === item.id
                      ? "bg-navy-700 text-white"
                      : "bg-paper-300 text-navy-700 hover:bg-paper-400"
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

        <footer className="mx-auto max-w-6xl px-4 pb-8 text-center text-xs text-ink-500">
          {FOOTNOTES[page]}
        </footer>
      </div>
    </NavContext.Provider>
  );
}
