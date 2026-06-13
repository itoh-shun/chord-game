import { getChordShape } from "@/lib/chordShapes";

/** ギターのコードダイアグラム(SVG)。コード名から運指を描画する。 */
export function ChordDiagram({
  chordName,
  size = 1,
  fallbackNotes = [],
}: {
  chordName: string;
  size?: number;
  /** 運指が無い場合に表示する構成音(音名) */
  fallbackNotes?: string[];
}) {
  const shape = getChordShape(chordName);

  const STR = 6; // 弦
  const FRETS = 4; // 表示フレット数
  const w = 34 * size;
  const h = 44 * size;
  const padX = 5 * size;
  const padTop = 9 * size; // 上(開放/ミュート記号)
  const padBottom = 3 * size;
  const gridW = w - padX * 2;
  const gridH = h - padTop - padBottom;
  const dx = gridW / (STR - 1);
  const dy = gridH / FRETS;
  const stroke = "#3a1d6e";

  if (!shape) {
    // 運指が無いときは構成音(音名)を縦に表示する
    return (
      <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} aria-label={chordName}>
        <rect
          x={0.5}
          y={padTop - 2 * size}
          width={w - 1}
          height={gridH + 4 * size}
          rx={3 * size}
          fill="none"
          stroke={stroke}
          strokeWidth={0.6 * size}
          strokeDasharray={`${2 * size} ${1.5 * size}`}
        />
        {fallbackNotes.slice(0, 5).map((n, i) => (
          <text
            key={i}
            x={w / 2}
            y={padTop + 6 * size + i * 7.5 * size}
            textAnchor="middle"
            fontSize={7 * size}
            fontWeight="bold"
            fill={stroke}
          >
            {n}
          </text>
        ))}
      </svg>
    );
  }

  const { frets, baseFret, barres } = shape;

  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} aria-label={chordName}>
      {/* ナット(baseFret=1のとき太線) */}
      {baseFret === 1 && (
        <rect x={padX} y={padTop - 1.5 * size} width={gridW} height={1.8 * size} fill={stroke} />
      )}
      {baseFret > 1 && (
        <text x={padX - 2 * size} y={padTop + dy * 0.8} fontSize={7 * size} fill={stroke} textAnchor="end">
          {baseFret}
        </text>
      )}

      {/* フレット線(横) */}
      {Array.from({ length: FRETS + 1 }).map((_, i) => (
        <line
          key={`f${i}`}
          x1={padX}
          y1={padTop + dy * i}
          x2={padX + gridW}
          y2={padTop + dy * i}
          stroke={stroke}
          strokeWidth={0.6 * size}
        />
      ))}
      {/* 弦(縦) */}
      {Array.from({ length: STR }).map((_, s) => (
        <line
          key={`s${s}`}
          x1={padX + dx * s}
          y1={padTop}
          x2={padX + dx * s}
          y2={padTop + gridH}
          stroke={stroke}
          strokeWidth={0.6 * size}
        />
      ))}

      {/* バレー */}
      {barres.map((b, i) => (
        <rect
          key={`b${i}`}
          x={padX - 1 * size}
          y={padTop + dy * (b - 0.5) - 2 * size}
          width={gridW + 2 * size}
          height={4 * size}
          rx={2 * size}
          fill={stroke}
        />
      ))}

      {/* 各弦の状態 */}
      {frets.map((f, s) => {
        const x = padX + dx * s;
        if (f === -1) {
          return (
            <text key={s} x={x} y={padTop - 2.5 * size} textAnchor="middle" fontSize={7 * size} fill={stroke}>
              ×
            </text>
          );
        }
        if (f === 0) {
          return (
            <circle key={s} cx={x} cy={padTop - 4 * size} r={2 * size} fill="none" stroke={stroke} strokeWidth={0.8 * size} />
          );
        }
        return (
          <circle key={s} cx={x} cy={padTop + dy * (f - 0.5)} r={2.6 * size} fill={stroke} />
        );
      })}
    </svg>
  );
}
