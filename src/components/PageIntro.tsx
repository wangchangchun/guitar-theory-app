import { useState } from "react";
import { useNav } from "../nav";

/**
 * 統一的「從這裡開始」引導卡：放在每個內容頁最上方，
 * 格式一致——這頁是什麼、編號的第一步、屬於學習路線哪個階段。
 * 收合狀態記在 localStorage，回訪時記得你上次的選擇。
 */

const COLLAPSE_KEY = "guitar-intro-collapsed-v1";

function loadCollapsed(): Record<string, boolean> {
  try {
    return JSON.parse(localStorage.getItem(COLLAPSE_KEY) ?? "{}");
  } catch {
    return {};
  }
}

interface Props {
  /** 收合狀態的儲存鍵，每頁唯一 */
  storageKey: string;
  /** 屬於學習路線的哪個階段，例如「階段 1 · 和弦地基」 */
  phase: string;
  /** 這一頁是什麼 */
  what: string;
  /** 從這裡開始：具體的前幾步（點什麼、做什麼） */
  steps: string[];
  /** 選填：補充重點／速記，顯示為次要的小字 */
  notes?: string[];
}

export function PageIntro({ storageKey, phase, what, steps, notes }: Props) {
  const { navigate } = useNav();
  const [collapsed, setCollapsed] = useState(
    () => loadCollapsed()[storageKey] ?? false,
  );

  const toggle = () => {
    const next = !collapsed;
    setCollapsed(next);
    const map = loadCollapsed();
    map[storageKey] = next;
    localStorage.setItem(COLLAPSE_KEY, JSON.stringify(map));
  };

  return (
    <section className="rounded-2xl border border-amber-500/25 bg-amber-500/[0.06] p-5">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <span className="font-mono text-xs font-bold uppercase tracking-wider text-amber-400">
            從這裡開始
          </span>
          <button
            onClick={() => navigate("roadmap")}
            className="rounded-full bg-amber-500/15 px-2.5 py-0.5 text-[11px] font-medium text-amber-300 transition-colors hover:bg-amber-500/25"
            title="回到學習路線總覽"
          >
            {phase} ↗
          </button>
        </div>
        <button
          onClick={toggle}
          className="shrink-0 text-xs font-medium text-slate-400 transition-colors hover:text-amber-300"
        >
          {collapsed ? "展開 ▾" : "收合 ▴"}
        </button>
      </div>

      {!collapsed && (
        <>
          <p className="mt-2.5 text-sm leading-relaxed text-slate-300">{what}</p>

          <ol className="mt-4 flex flex-col gap-2.5">
            {steps.map((step, i) => (
              <li key={i} className="flex items-start gap-3">
                <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-amber-500 font-mono text-[11px] font-bold text-slate-950">
                  {i + 1}
                </span>
                <span className="text-sm leading-relaxed text-slate-200">
                  {step}
                </span>
              </li>
            ))}
          </ol>

          {notes && notes.length > 0 && (
            <ul className="mt-4 flex flex-col gap-1 border-t border-amber-500/15 pt-3">
              {notes.map((n, i) => (
                <li
                  key={i}
                  className="text-xs leading-relaxed text-slate-400"
                >
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
