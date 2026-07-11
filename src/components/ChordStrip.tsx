import {
  findMovableShapeForName,
  findShapeForName,
} from "../data/chordLookup";
import { playChord } from "../audio/audioEngine";
import { ChordDiagram } from "./fretboard/ChordDiagram";

/**
 * 迷你和弦圖列：把一串和弦名稱渲染成可點擊試聽的小按法圖，
 * 學習清單與練習單元的上琴練習共用——要彈什麼直接看得到。
 */
interface Props {
  chords: string[];
  /** true 時改用 A 型可移動手型（同把位對照用） */
  movable?: boolean;
  width?: number;
}

export function ChordStrip({ chords, movable = false, width = 68 }: Props) {
  return (
    <div className="mt-2 flex flex-wrap gap-1.5">
      {chords.map((name) => {
        const shape = movable
          ? findMovableShapeForName(name)
          : findShapeForName(name);
        return (
          <button
            key={name}
            onClick={() => playChord(shape, "strum")}
            className="flex flex-col items-center rounded-lg border border-slate-800 bg-slate-900/80 px-1.5 pt-1 transition-colors hover:border-amber-500/60"
            title={`${name} 按法，點擊試聽`}
          >
            <span className="text-[11px] font-bold leading-none text-amber-300">
              ♪ {name}
            </span>
            <ChordDiagram shape={shape} width={width} />
          </button>
        );
      })}
    </div>
  );
}
