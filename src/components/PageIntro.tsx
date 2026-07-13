import { useState } from "react";
import { useNav } from "../nav";
import { ChordStrip } from "./ChordStrip";

/**
 * 每頁的「循序漸進學習清單」：步驟依難易度排序（入門→進階→挑戰），
 * 每一步都包含「觀念＋在頁面上做什麼」與「🎸 上琴實作」，
 * 可打勾記錄進度；勾選與收合狀態都存 localStorage。
 */

const COLLAPSE_KEY = "guitar-intro-collapsed-v1";
const DONE_KEY = "guitar-lesson-done-v1";

export type LessonLevel = "入門" | "進階" | "挑戰";

export interface LessonStep {
  level: LessonLevel;
  title: string;
  /** 觀念說明＋在頁面上做什麼 */
  learn: string;
  /** 上琴實作：拿起吉他做什麼、聽什麼 */
  guitar: string;
  /** 這一步會用到的和弦：直接內嵌迷你按法圖（可點擊試聽），不用往下找 */
  chords?: string[];
  /** true 時和弦圖改用 A 型可移動手型（同把位對照的步驟用） */
  movable?: boolean;
}

function loadMap(key: string): Record<string, boolean> {
  try {
    return JSON.parse(localStorage.getItem(key) ?? "{}");
  } catch {
    return {};
  }
}

function saveMap(key: string, map: Record<string, boolean>) {
  localStorage.setItem(key, JSON.stringify(map));
}

const LEVEL_STYLES: Record<LessonLevel, string> = {
  入門: "bg-olive-700/15 text-olive-700",
  進階: "bg-navy-700/15 text-navy-700",
  挑戰: "bg-blood-700/15 text-blood-700",
};

interface Props {
  /** 進度與收合狀態的儲存鍵，每頁唯一 */
  storageKey: string;
  /** 屬於學習路線的哪個階段，例如「階段 1 · 和弦地基」 */
  phase: string;
  /** 這一頁是什麼 */
  what: string;
  /** 依難易度排序的學習步驟 */
  lessons: LessonStep[];
  /** 選填：補充重點／速記 */
  notes?: string[];
}

export function PageIntro({ storageKey, phase, what, lessons, notes }: Props) {
  const { navigate } = useNav();
  const [collapsed, setCollapsed] = useState(
    () => loadMap(COLLAPSE_KEY)[storageKey] ?? false,
  );
  const [done, setDone] = useState<Record<string, boolean>>(() =>
    loadMap(DONE_KEY),
  );

  const keyOf = (i: number) => `${storageKey}:${i}`;
  const doneCount = lessons.filter((_, i) => done[keyOf(i)]).length;

  const toggleCollapsed = () => {
    const next = !collapsed;
    setCollapsed(next);
    const map = loadMap(COLLAPSE_KEY);
    map[storageKey] = next;
    saveMap(COLLAPSE_KEY, map);
  };

  const toggleDone = (i: number) => {
    const map = { ...done, [keyOf(i)]: !done[keyOf(i)] };
    setDone(map);
    saveMap(DONE_KEY, map);
  };

  return (
    <section className="rounded-2xl border border-navy-700/25 bg-navy-700/[0.06] p-5">
      <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2">
        <div className="flex items-center gap-2.5">
          <span className="font-mono text-xs font-bold uppercase tracking-wider text-navy-700">
            學習清單
          </span>
          <button
            onClick={() => navigate("roadmap")}
            className="rounded-full bg-navy-700/15 px-2.5 py-0.5 text-[11px] font-medium text-navy-700 transition-colors hover:bg-navy-700/25"
            title="回到學習路線總覽"
          >
            {phase} ↗
          </button>
        </div>
        <div className="flex items-center gap-3">
          <span className="font-mono text-xs text-ink-600">
            完成 <span className="font-bold text-olive-700">{doneCount}</span>
            /{lessons.length}
          </span>
          <button
            onClick={toggleCollapsed}
            className="shrink-0 text-xs font-medium text-ink-600 transition-colors hover:text-navy-700"
          >
            {collapsed ? "展開 ▾" : "收合 ▴"}
          </button>
        </div>
      </div>

      {!collapsed && (
        <>
          <p className="mt-2.5 text-sm leading-relaxed text-ink-700">{what}</p>
          <p className="mt-1 text-xs text-ink-500">
            由淺入深照順序做，每一步都有可以直接上琴的實作——做完就打勾。
          </p>

          <ol className="mt-4 flex flex-col gap-2.5">
            {lessons.map((step, i) => {
              const isDone = !!done[keyOf(i)];
              return (
                <li
                  key={i}
                  className={`rounded-xl border p-3 transition-colors ${
                    isDone
                      ? "border-olive-700/40 bg-olive-700/20"
                      : "border-line-200 bg-paper-200/40"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <button
                      onClick={() => toggleDone(i)}
                      aria-label={isDone ? "取消完成" : "標記完成"}
                      className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border text-[11px] font-bold transition-colors ${
                        isDone
                          ? "border-olive-700 bg-olive-700 text-white"
                          : "border-line-300 text-transparent hover:border-olive-700"
                      }`}
                    >
                      ✓
                    </button>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-mono text-[11px] text-ink-500">
                          {i + 1}
                        </span>
                        <span
                          className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${LEVEL_STYLES[step.level]}`}
                        >
                          {step.level}
                        </span>
                        <span
                          className={`text-sm font-semibold ${
                            isDone ? "text-ink-600" : "text-ink-900"
                          }`}
                        >
                          {step.title}
                        </span>
                      </div>
                      <p className="mt-1 text-xs leading-relaxed text-ink-700">
                        {step.learn}
                      </p>
                      <p className="mt-1 text-xs leading-relaxed">
                        <span className="mr-1 font-semibold text-gold-700">
                          🎸 上琴
                        </span>
                        <span className="text-ink-600">{step.guitar}</span>
                      </p>
                      {step.chords && step.chords.length > 0 && (
                        <ChordStrip
                          chords={step.chords}
                          movable={step.movable}
                        />
                      )}
                    </div>
                  </div>
                </li>
              );
            })}
          </ol>

          {notes && notes.length > 0 && (
            <ul className="mt-4 flex flex-col gap-1 border-t border-navy-700/15 pt-3">
              {notes.map((n, i) => (
                <li key={i} className="text-xs leading-relaxed text-ink-600">
                  ・{n}
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </section>
  );
}
