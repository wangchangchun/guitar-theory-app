import type { Derivation, DerivationRow } from "../../data/scales";
import { scaleById } from "../../data/scales";

/**
 * 音階的「身世對照表」：上排是父音階、下排是這條音階，
 * 逐音標出哪個保留、哪個改了、哪個被拿掉、哪個是新加的。
 * 目的是讓人不用死背八組音——每條音階都只是前一條動了一兩個音。
 */

const DEG_SEMI: Record<string, number> = {
  "1": 0, "♭2": 1, "2": 2, "♭3": 3, "3": 4, "4": 5,
  "♭5": 6, "5": 7, "♭6": 8, "6": 9, "♭7": 10, "7": 11,
};

/** 這一格發生了什麼事（顯示在最下方的小字） */
function changeLabel(row: DerivationRow): string {
  switch (row.kind) {
    case "kept":
      return "保留";
    case "removed":
      return "拿掉";
    case "added":
      return "新增";
    case "changed": {
      const from = DEG_SEMI[row.parent ?? ""] ?? 0;
      const to = DEG_SEMI[row.child ?? ""] ?? 0;
      return to > from ? "升半音" : "降半音";
    }
  }
}

const CHILD_CELL: Record<DerivationRow["kind"], string> = {
  kept: "bg-paper-300 text-ink-700",
  changed: "bg-navy-700 text-white",
  removed: "border border-dashed border-line-300 text-ink-500",
  added: "bg-gold-700 text-white",
};

const LABEL_COLOR: Record<DerivationRow["kind"], string> = {
  kept: "text-ink-500",
  changed: "text-navy-700",
  removed: "text-ink-500",
  added: "text-gold-700",
};

interface Props {
  derivation: Derivation;
  /** 這條音階的名字（下排標題） */
  scaleName: string;
  /** 點父音階名稱時切換過去 */
  onPickParent?: (id: string) => void;
}

export function ScaleDerivation({ derivation, scaleName, onPickParent }: Props) {
  const parent = scaleById(derivation.fromId);

  return (
    <div className="flex flex-col gap-3">
      {/* 一句話：從誰、改了什麼 */}
      <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm">
        <span className="text-ink-600">從</span>
        {onPickParent ? (
          <button
            onClick={() => onPickParent(parent.id)}
            className="rounded-md bg-paper-300 px-2 py-0.5 font-semibold text-navy-700 underline decoration-navy-700/40 underline-offset-2 transition-colors hover:bg-paper-400"
            title={`切換到${parent.name}`}
          >
            {parent.name}
          </button>
        ) : (
          <span className="font-semibold text-navy-700">{parent.name}</span>
        )}
        <span className="text-ink-600">出發，</span>
        <span className="font-semibold text-ink-900">{derivation.summary}</span>
        <span className="text-ink-600">，就得到</span>
        <span className="font-semibold text-navy-700">{scaleName}</span>
        <span className="text-ink-600">。</span>
      </p>

      {/* 逐音對照 */}
      <div className="-mx-1 overflow-x-auto px-1 pb-1">
        <div className="flex min-w-max items-start gap-1.5">
          {/* 列標題 */}
          <div className="flex shrink-0 flex-col gap-1.5 pr-1 pt-0.5 text-right">
            <span className="h-8 text-[11px] leading-8 text-ink-600">
              {parent.name}
            </span>
            <span className="h-8 text-[11px] font-semibold leading-8 text-ink-900">
              {scaleName}
            </span>
            <span className="text-[10px] text-ink-500">改動</span>
          </div>

          {derivation.rows.map((row, i) => (
            <div key={i} className="flex shrink-0 flex-col items-center gap-1.5">
              {/* 父音階 */}
              <span
                className={`flex h-8 w-11 items-center justify-center rounded-md font-mono text-sm font-semibold ${
                  row.parent === null
                    ? "border border-dashed border-line-200 text-ink-500"
                    : row.kind === "removed"
                      ? "bg-paper-300 text-ink-500 line-through decoration-blood-700/70"
                      : "bg-paper-300 text-ink-700"
                }`}
              >
                {row.parent ?? "—"}
              </span>
              {/* 這條音階 */}
              <span
                className={`flex h-8 w-11 items-center justify-center rounded-md font-mono text-sm font-semibold ${CHILD_CELL[row.kind]}`}
              >
                {row.child ?? "✕"}
              </span>
              {/* 改動說明 */}
              <span
                className={`text-[10px] font-semibold ${LABEL_COLOR[row.kind]}`}
              >
                {changeLabel(row)}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* 為什麼要這樣改 */}
      <p className="text-sm leading-relaxed text-ink-700">
        <span className="mr-1 font-semibold text-gold-700">為什麼這樣改？</span>
        {derivation.why}
      </p>
    </div>
  );
}
