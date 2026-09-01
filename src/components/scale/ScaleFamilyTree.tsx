import { SCALES } from "../../data/scales";

/**
 * 音階家族樹：所有音階都從大調音階長出來，每一條只是前一條動了一兩個音。
 * 用來取代「八個音階各背一組音」的印象，也當成這一頁的學習順序地圖。
 */

interface Props {
  /** 目前選中的音階 id */
  activeId: string;
  onPick: (id: string) => void;
}

const childrenOf = (id: string) =>
  SCALES.filter((s) => s.derivation?.fromId === id);

function Node({
  id,
  depth,
  activeId,
  onPick,
}: {
  id: string;
  depth: number;
  activeId: string;
  onPick: (id: string) => void;
}) {
  const scale = SCALES.find((s) => s.id === id)!;
  const kids = childrenOf(id);
  const isActive = activeId === id;

  return (
    <li className="relative">
      <div className="flex flex-wrap items-center gap-x-2 gap-y-1 py-1">
        {depth > 0 && scale.derivation && (
          <span className="rounded-md bg-paper-300 px-1.5 py-0.5 text-[10px] font-medium text-ink-600">
            {scale.derivation.summary}
          </span>
        )}
        <button
          onClick={() => onPick(id)}
          className={`rounded-lg px-2.5 py-1 text-sm font-semibold transition-colors ${
            isActive
              ? "bg-navy-700 text-white"
              : "bg-paper-300 text-navy-700 hover:bg-paper-400"
          }`}
        >
          {scale.name}
        </button>
        {depth === 0 && (
          <span className="text-[11px] font-medium text-gold-700">參考原點</span>
        )}
      </div>
      {kids.length > 0 && (
        <ul className="ml-3 border-l border-dashed border-line-300 pl-4">
          {kids.map((k) => (
            <Node
              key={k.id}
              id={k.id}
              depth={depth + 1}
              activeId={activeId}
              onPick={onPick}
            />
          ))}
        </ul>
      )}
    </li>
  );
}

export function ScaleFamilyTree({ activeId, onPick }: Props) {
  const roots = SCALES.filter((s) => !s.derivation);

  return (
    <ul className="flex flex-col">
      {roots.map((r) => (
        <Node
          key={r.id}
          id={r.id}
          depth={0}
          activeId={activeId}
          onPick={onPick}
        />
      ))}
    </ul>
  );
}
