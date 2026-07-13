import type { ChordShape } from "../../types/music";
import { STANDARD_TUNING_MIDI } from "../../types/music";
import { degreeLabel } from "../../data/theory";

interface ChordDiagramProps {
  shape: ChordShape;
  /** 圖形寬度（px），高度依比例縮放 */
  width?: number;
  className?: string;
  /**
   * 級數模式：給定根音 pitch class（0 = C），每條發聲的弦改標「相對根音的級數」，
   * 根音加圈、與大三和弦不同的音用琥珀色highlight。用在和弦變化教室，
   * 讓「把 3 降半音」這類文字能對到指板圖上的哪個點。
   */
  rootPc?: number;
}

const STRING_COUNT = 6;

/** 大三和弦的音程集合（根音·大三度·完全五度），用來判斷哪個音被動過 */
const MAJOR_SET = new Set([0, 4, 7]);

/**
 * 單一和弦指板圖（直式：琴枕在上，左側為第六弦/低音 E）
 */
export function ChordDiagram({
  shape,
  width = 160,
  className,
  rootPc,
}: ChordDiagramProps) {
  const showDegrees = rootPc != null;

  /** 某條弦某格發出的音相對根音的資訊 */
  const noteInfo = (stringIndex: number, fret: number) => {
    const semi = ((STANDARD_TUNING_MIDI[stringIndex] + fret - rootPc!) % 12 + 12) % 12;
    return {
      degree: degreeLabel(semi),
      isRoot: semi === 0,
      isChanged: !MAJOR_SET.has(semi),
    };
  };
  const frettedValues = shape.frets.filter(
    (f): f is number => typeof f === "number" && f > 0,
  );
  const maxFret = frettedValues.length ? Math.max(...frettedValues) : 1;
  const minFret = frettedValues.length ? Math.min(...frettedValues) : 1;
  // 高把位和弦不從第 1 格畫起，改標示起始格數
  const baseFret = maxFret <= 4 ? 1 : minFret;
  const fretCount = Math.max(4, maxFret - baseFret + 1);

  // SVG 座標系統
  const stringGap = 24;
  const fretGap = 30;
  const left = 30;
  const top = 34;
  const gridWidth = stringGap * (STRING_COUNT - 1);
  const gridHeight = fretGap * fretCount;
  const viewWidth = left + gridWidth + 18;
  const viewHeight = top + gridHeight + 14;

  const stringX = (stringIndex: number) => left + stringIndex * stringGap;
  const fretY = (fret: number) => top + (fret - baseFret + 0.5) * fretGap;

  const dotRadius = 9;

  return (
    <svg
      viewBox={`0 0 ${viewWidth} ${viewHeight}`}
      width={width}
      height={(width * viewHeight) / viewWidth}
      className={className}
      role="img"
      aria-label={`${shape.chordName} 和弦圖`}
    >
      {/* 琴枕或起始格數標示 */}
      {baseFret === 1 ? (
        <rect x={left - 1.5} y={top - 5} width={gridWidth + 3} height={5} rx={2} fill="#231b10" />
      ) : (
        <text x={left - 10} y={top + fretGap * 0.5 + 4} fontSize={12} fill="#5a4c30" textAnchor="end">
          {baseFret}fr
        </text>
      )}

      {/* 琴格橫線 */}
      {Array.from({ length: fretCount + 1 }, (_, i) => (
        <line
          key={`fret-${i}`}
          x1={left}
          x2={left + gridWidth}
          y1={top + i * fretGap}
          y2={top + i * fretGap}
          stroke="#765f40"
          strokeWidth={1}
        />
      ))}

      {/* 弦（左粗右細） */}
      {Array.from({ length: STRING_COUNT }, (_, i) => (
        <line
          key={`string-${i}`}
          x1={stringX(i)}
          x2={stringX(i)}
          y1={top}
          y2={top + gridHeight}
          stroke="#5a4c30"
          strokeWidth={1.8 - i * 0.18}
        />
      ))}

      {/* 弦頂端標記：o = 空弦、x = 悶音；級數模式下空弦改標級數圓點 */}
      {shape.frets.map((fret, i) => {
        const x = stringX(i);
        const y = top - 14;
        if (fret === "x") {
          return (
            <text key={`mark-${i}`} x={x} y={y} fontSize={13} fill="#922b18" textAnchor="middle" fontWeight={700}>
              ×
            </text>
          );
        }
        if (fret === 0) {
          if (showDegrees) {
            const info = noteInfo(i, 0);
            const fill = info.isChanged ? "#1a3a6b" : "#e6d0a8";
            const textFill = info.isChanged ? "#ffffff" : info.isRoot ? "#684b13" : "#231b10";
            return (
              <g key={`mark-${i}`}>
                <circle
                  cx={x}
                  cy={y - 3}
                  r={8}
                  fill={fill}
                  stroke={info.isRoot ? "#684b13" : "#ab873f"}
                  strokeWidth={info.isRoot ? 2 : 1}
                />
                <text x={x} y={y} fontSize={9} fill={textFill} textAnchor="middle" fontWeight={700}>
                  {info.degree}
                </text>
              </g>
            );
          }
          return (
            <circle key={`mark-${i}`} cx={x} cy={y - 4} r={4.5} fill="none" stroke="#483721" strokeWidth={1.5} />
          );
        }
        return null;
      })}

      {/* 封閉橫按 */}
      {shape.barre && (
        <rect
          x={stringX(STRING_COUNT - shape.barre.fromString) - dotRadius}
          y={fretY(shape.barre.fret) - dotRadius}
          width={
            stringX(STRING_COUNT - shape.barre.toString) -
            stringX(STRING_COUNT - shape.barre.fromString) +
            dotRadius * 2
          }
          height={dotRadius * 2}
          rx={dotRadius}
          fill="#1a3a6b"
          opacity={0.45}
        />
      )}

      {/* 按壓點：預設標手指編號；級數模式改標級數（根音加圈、變化音靛藍） */}
      {shape.frets.map((fret, i) => {
        if (typeof fret !== "number" || fret === 0) return null;
        const x = stringX(i);
        const y = fretY(fret);

        if (showDegrees) {
          const info = noteInfo(i, fret);
          const fill = info.isChanged ? "#1a3a6b" : "#e6d0a8";
          const textFill = info.isChanged ? "#ffffff" : info.isRoot ? "#684b13" : "#231b10";
          return (
            <g key={`dot-${i}`}>
              <circle
                cx={x}
                cy={y}
                r={dotRadius}
                fill={fill}
                stroke={info.isRoot ? "#684b13" : "none"}
                strokeWidth={info.isRoot ? 2.5 : 0}
              />
              <text x={x} y={y + 3.5} fontSize={9} fill={textFill} textAnchor="middle" fontWeight={700}>
                {info.degree}
              </text>
            </g>
          );
        }

        const finger = shape.fingers[i];
        return (
          <g key={`dot-${i}`}>
            <circle cx={x} cy={y} r={dotRadius} fill="#1a3a6b" />
            {finger != null && (
              <text x={x} y={y + 4} fontSize={11} fill="#ffffff" textAnchor="middle" fontWeight={700}>
                {finger}
              </text>
            )}
          </g>
        );
      })}
    </svg>
  );
}
