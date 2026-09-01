import { pcToName } from "../../data/theory";

/**
 * 把位起點圖：只畫第六弦（最粗的低音 E 弦），標出音階的每個音落在第幾格，
 * 並用圈裡的號碼標示「這是第幾把位的起點」。
 *
 * 這張圖就是把位編號的定義本身——第 N 把位＝從第六弦上「音階第 N 個音」
 * 出發的那一段。圖下方另外依「把位編號順序」列一次，
 * 因為指板上的左右位置會繞回低音處（第 4、5 把位落在低格），
 * 只看圖容易誤會編號是亂排的。
 */

interface Props {
  rootPc: number;
  /** 當把位起點用的音程（由根音起算的半音數） */
  anchorIntervals: number[];
  /** 與 anchorIntervals 對應的級數標記 */
  anchorDegrees: string[];
  /** 目前選中的把位索引（0 = 第 1 把位） */
  active: number;
  onPick?: (index: number) => void;
  fretCount?: number;
}

const OPEN_STRING_PC = 4; // 第六弦空弦 = E
const left = 74;
const fretW = 50;
const top = 34;

export function StringAnchors({
  rootPc,
  anchorIntervals,
  anchorDegrees,
  active,
  onPick,
  fretCount = 17,
}: Props) {
  const gridW = fretCount * fretW;
  const viewW = left + gridW + 14;
  const viewH = top + 48;

  const noteX = (fret: number) =>
    fret === 0 ? left - 28 : left + (fret - 0.5) * fretW;

  // 第 k 把位的起點格：與指型演算法（buildPattern）用的是同一條公式
  const anchors = anchorIntervals.map((semi, k) => ({
    box: k,
    degree: anchorDegrees[k],
    fret: (rootPc + semi - OPEN_STRING_PC + 24) % 12,
    name: pcToName((rootPc + semi) % 12),
  }));

  // 同一個音每 12 格重複一次：把高八度那顆也畫出來（淡色）
  const repeats = anchors
    .map((a) => ({ ...a, fret: a.fret + 12 }))
    .filter((a) => a.fret <= fretCount);

  return (
    <div className="flex flex-col gap-2.5">
      <svg
        viewBox={`0 0 ${viewW} ${viewH}`}
        width="100%"
        role="img"
        aria-label="第六弦上的把位起點"
      >
        {/* 弦名 */}
        <text x={20} y={top - 4} fontSize={11} fill="#483721" textAnchor="middle" fontWeight={700}>
          第六弦
        </text>
        <text x={20} y={top + 12} fontSize={9} fill="#765f40" textAnchor="middle">
          低音 E
        </text>

        {/* 琴枕 */}
        <rect x={left - 3} y={top - 16} width={5} height={32} rx={2} fill="#231b10" />

        {/* 琴格 */}
        {Array.from({ length: fretCount }, (_, i) => (
          <line
            key={`fret-${i + 1}`}
            x1={left + (i + 1) * fretW}
            x2={left + (i + 1) * fretW}
            y1={top - 14}
            y2={top + 14}
            stroke="#765f40"
            strokeWidth={1}
          />
        ))}

        {/* 弦 */}
        <line
          x1={left}
          x2={left + gridW}
          y1={top}
          y2={top}
          stroke="#5a4c30"
          strokeWidth={2.4}
        />

        {/* 高八度的重複起點（淡色，說明把位為什麼會循環） */}
        {repeats.map((a) => (
          <g key={`rep-${a.box}`} opacity={0.3}>
            <circle cx={noteX(a.fret)} cy={top} r={12} fill="#e6d0a8" stroke="#ab873f" strokeWidth={1} />
            <text
              x={noteX(a.fret)}
              y={top + 4}
              fontSize={11}
              fill="#231b10"
              textAnchor="middle"
              fontWeight={700}
            >
              {a.box + 1}
            </text>
          </g>
        ))}

        {/* 把位起點 */}
        {anchors.map((a) => {
          const x = noteX(a.fret);
          const isActive = a.box === active;
          return (
            <g
              key={`anchor-${a.box}`}
              onClick={() => onPick?.(a.box)}
              style={{ cursor: onPick ? "pointer" : "default" }}
            >
              {/* 音名＋級數 */}
              <text
                x={x}
                y={top - 22}
                fontSize={10}
                fill={isActive ? "#1a3a6b" : "#483721"}
                textAnchor="middle"
                fontWeight={700}
              >
                {a.name}
                <tspan fontSize={8} fill="#765f40">
                  {" "}
                  ({a.degree})
                </tspan>
              </text>
              <circle
                cx={x}
                cy={top}
                r={isActive ? 14 : 12}
                fill={isActive ? "#1a3a6b" : "#e6d0a8"}
                stroke={isActive ? "#684b13" : "#ab873f"}
                strokeWidth={isActive ? 2.5 : 1}
              />
              <text
                x={x}
                y={top + 4}
                fontSize={isActive ? 13 : 11}
                fill={isActive ? "#ffffff" : "#231b10"}
                textAnchor="middle"
                fontWeight={700}
              >
                {a.box + 1}
              </text>
              {/* 第幾格 */}
              <text
                x={x}
                y={top + 34}
                fontSize={10}
                fill={isActive ? "#1a3a6b" : "#5a4c30"}
                textAnchor="middle"
                fontWeight={isActive ? 700 : 400}
              >
                {a.fret === 0 ? "空弦" : `${a.fret} 格`}
              </text>
            </g>
          );
        })}
      </svg>

      {/* 依「把位編號」順序再列一次：圖上的左右位置會繞回低格，這排才是編號的定義 */}
      <div className="-mx-1 overflow-x-auto px-1 pb-1">
        <div className="flex min-w-max items-center gap-1.5">
          {anchors.map((a, i) => (
            <div key={`seq-${a.box}`} className="flex items-center gap-1.5">
              {i > 0 && <span className="text-ink-500">→</span>}
              <button
                onClick={() => onPick?.(a.box)}
                className={`flex flex-col items-center rounded-lg px-2.5 py-1 transition-colors ${
                  a.box === active
                    ? "bg-navy-700 text-white"
                    : "bg-paper-300 text-ink-700 hover:bg-paper-400"
                }`}
              >
                <span className="text-[10px] font-semibold leading-none">
                  第 {a.box + 1} 把位
                </span>
                <span className="mt-1 font-mono text-xs font-bold leading-none">
                  {a.fret === 0 ? "空弦" : `${a.fret} 格`}
                </span>
                <span className="mt-1 text-[9px] leading-none opacity-80">
                  {a.name}（{a.degree}）
                </span>
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
