import { useMemo } from "react";
import type { PageId } from "../nav";
import { useNav } from "../nav";
import { PRACTICE_UNITS } from "../data/practice";
import { loadProgress, unitStatus } from "../data/progress";

/**
 * 學習路線：把 7 個內容頁與 12 個練習單元排成 5 個階段，
 * 每個頁面與單元都是可點連結、顯示精通進度——打開就知道走到哪、下一步做什麼。
 */

interface ContentLink {
  page: PageId;
  label: string;
}

interface Phase {
  index: string;
  title: string;
  goal: string;
  content: ContentLink[];
  /** 練習單元 id（依建議精通順序） */
  units: string[];
  drill: string;
  time: string;
}

const PHASES: Phase[] = [
  {
    index: "01",
    title: "和弦地基",
    goal: "先搞懂「和弦是從根音疊出來的」——每種和弦都只是同一個公式的不同版本，動一個音就變一種表情。",
    content: [{ page: "chords", label: "和弦圖鑑" }],
    units: ["intervals", "triads", "transform", "sevenths"],
    drill: "「一根手指的魔法」——A→Am 只動第二弦一格，來回聽 3→♭3 怎麼把明亮變憂鬱。",
    time: "1–2 週・每天 15–20 分",
  },
  {
    index: "02",
    title: "指板導航",
    goal: "知道每一格叫什麼名字、記熟五聲把位的形狀——沒有這一步，後面的 CAGED 和調性字典會全部卡住。",
    content: [
      { page: "fretmap", label: "指板地圖 ①" },
      { page: "scales", label: "音階教學" },
      { page: "fingering", label: "指型把位" },
    ],
    units: ["fretnotes", "scales", "fingering"],
    drill: "「單弦尋音計時賽」——60 秒內在第六弦找出 C、F、A、B♭，一天一條弦，一週背完全指板。",
    time: "2 週・每天 15–20 分",
  },
  {
    index: "03",
    title: "橋接和弦與音階",
    goal: "把「認識指板」和「認識和弦」接在一起：同一個和弦怎麼鋪滿整片指板，solo 的長音又該落在哪。",
    content: [{ page: "fretmap", label: "指板地圖 ②③" }],
    units: ["caged", "usage"],
    drill: "「三全音解決」——循環播放 G7→C，單彈 B→C、F→E 兩條半音線，親耳聽屬七和弦的拉力從哪來。",
    time: "1 週・每天 15–20 分",
  },
  {
    index: "04",
    title: "調性與和聲功能",
    goal: "和弦不再是單獨的個體，而是一個調裡的角色——順階、借用、副屬、轉調，都是同一套邏輯的延伸。",
    content: [
      { page: "diatonic", label: "調性字典" },
      { page: "circle", label: "五度圈" },
    ],
    units: ["diatonic", "harmony", "circle"],
    drill: "「催淚彈 A/B 測試」——先彈 C–F–C，再彈 C–F–Fm–C，感受只動一個音就掉淚的那半音。",
    time: "2 週・每天 15–20 分",
  },
  {
    index: "05",
    title: "實戰：歌曲與即興",
    goal: "把前面四階段全部倒進真的歌裡——移調、換節奏、換色彩和弦、配對的 solo 音階，一次全部用上。",
    content: [{ page: "songs", label: "歌曲進行" }],
    units: [],
    drill: "挑 3 首不同風格：王道進行、12 小節藍調、I–V–vi–IV，各移調 2 次、換 2 種節奏型再配對音階 solo。",
    time: "持續進行，每週回訪",
  },
];

const STATUS_BADGE = {
  mastered: { label: "✓ 已精通", cls: "bg-emerald-600/30 text-emerald-300" },
  practicing: { label: "練習中", cls: "bg-slate-700 text-slate-300" },
  untouched: { label: "未挑戰", cls: "bg-slate-800 text-slate-500" },
} as const;

export function RoadmapPage() {
  const { navigate } = useNav();
  // 單元 id → 序號與資料
  const unitMeta = useMemo(() => {
    const map = new Map<string, { no: number; emoji: string; title: string }>();
    PRACTICE_UNITS.forEach((u, i) =>
      map.set(u.id, { no: i + 1, emoji: u.emoji, title: u.title }),
    );
    return map;
  }, []);

  const progress = loadProgress();
  const masteredCount = PRACTICE_UNITS.filter(
    (u) => unitStatus(progress[u.id]) === "mastered",
  ).length;
  const pct = Math.round((masteredCount / PRACTICE_UNITS.length) * 100);

  return (
    <div className="mx-auto max-w-4xl">
      {/* 標題 */}
      <div className="mb-6 rounded-2xl border border-slate-800 bg-slate-900 p-6">
        <p className="mb-1 font-mono text-xs uppercase tracking-wider text-amber-400">
          學習路線圖
        </p>
        <h1 className="mb-2 text-2xl font-extrabold text-slate-100">
          從一個音，到一整首歌
        </h1>
        <p className="mb-4 text-sm leading-relaxed text-slate-400">
          7 個內容頁與 12 個練習單元排成 5 個階段。每個頁面與單元都可以直接點進去——
          照著走一遍，就是一套完整的自學課表。每次 15–20 分鐘就好。
        </p>
        <div className="flex items-center gap-3">
          <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-800">
            <div
              className="h-full bg-emerald-500 transition-all"
              style={{ width: `${pct}%` }}
            />
          </div>
          <span className="shrink-0 font-mono text-xs text-slate-400">
            {masteredCount} / {PRACTICE_UNITS.length} 單元精通
          </span>
        </div>
      </div>

      {/* 每次練習的固定流程 */}
      <div className="mb-6 grid gap-2 sm:grid-cols-4">
        {[
          ["01 暖身", "從已精通的單元挑一個上琴練習重彈"],
          ["02 讀頁", "翻開這階段指定的內容頁，先聽先看"],
          ["03 練題", "開對應練習單元，練到 80% 精通"],
          ["04 上琴", "做至少一個上琴練習，親手驗證"],
        ].map(([mark, text]) => (
          <div
            key={mark}
            className="rounded-xl border border-slate-800 bg-slate-900/60 p-3"
          >
            <p className="mb-1 font-mono text-[11px] font-semibold text-amber-400">
              {mark}
            </p>
            <p className="text-xs leading-relaxed text-slate-400">{text}</p>
          </div>
        ))}
      </div>

      {/* 五個階段 */}
      <div className="flex flex-col gap-4">
        {PHASES.map((phase) => (
          <section
            key={phase.index}
            className="rounded-2xl border border-slate-800 bg-slate-900 p-5"
          >
            <div className="mb-3 flex items-baseline gap-3">
              <span className="font-mono text-2xl font-bold text-slate-600">
                {phase.index}
              </span>
              <div>
                <h2 className="text-lg font-bold text-slate-100">
                  {phase.title}
                </h2>
                <p className="font-mono text-[11px] text-slate-500">
                  {phase.time}
                </p>
              </div>
            </div>
            <p className="mb-4 text-sm leading-relaxed text-slate-400">
              {phase.goal}
            </p>

            {/* 內容頁連結 */}
            <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
              內容頁
            </p>
            <div className="mb-4 flex flex-wrap gap-2">
              {phase.content.map((c) => (
                <button
                  key={c.page + c.label}
                  onClick={() => navigate(c.page)}
                  className="rounded-lg border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs font-medium text-amber-300 transition-colors hover:border-amber-500 hover:bg-slate-700"
                >
                  {c.label} →
                </button>
              ))}
            </div>

            {/* 練習單元連結 */}
            {phase.units.length > 0 ? (
              <>
                <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                  練習單元（依序精通）
                </p>
                <div className="mb-4 flex flex-col gap-1.5">
                  {phase.units.map((id) => {
                    const meta = unitMeta.get(id);
                    if (!meta) return null;
                    const status = unitStatus(progress[id]);
                    const badge = STATUS_BADGE[status];
                    return (
                      <button
                        key={id}
                        onClick={() => navigate("practice", id)}
                        className="flex items-center justify-between gap-2 rounded-lg border border-slate-800 bg-slate-950/40 px-3 py-2 text-left transition-colors hover:border-slate-600"
                      >
                        <span className="text-sm text-slate-200">
                          {meta.emoji} 單元 {meta.no}｜{meta.title}
                        </span>
                        <span
                          className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold ${badge.cls}`}
                        >
                          {badge.label}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </>
            ) : (
              <div className="mb-4">
                <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                  最終驗收
                </p>
                <button
                  onClick={() => navigate("practice")}
                  className="flex w-full items-center justify-between gap-2 rounded-lg border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-left transition-colors hover:border-amber-400"
                >
                  <span className="text-sm text-amber-300">
                    🏆 綜合測驗（12 單元全精通解鎖）
                  </span>
                  <span className="shrink-0 font-mono text-[10px] text-slate-400">
                    {masteredCount === PRACTICE_UNITS.length ? "已解鎖" : `還差 ${PRACTICE_UNITS.length - masteredCount}`}
                  </span>
                </button>
              </div>
            )}

            {/* 代表上琴練習 */}
            <p className="border-l-2 border-sky-500/60 pl-3 text-xs leading-relaxed text-slate-400">
              <span className="font-semibold text-sky-300">🎸 代表練習　</span>
              {phase.drill}
            </p>
          </section>
        ))}
      </div>

      <p className="mt-6 text-center text-xs leading-relaxed text-slate-500">
        先把「和弦地基」四個單元練到全綠，再往下走——地基不穩，後面會很卡。
        不用等滿分，80% 就走下一階段。
      </p>
    </div>
  );
}
