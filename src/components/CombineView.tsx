"use client";

import { useSongStore } from "@/store/songStore";
import {
  DECK,
  SECTION_KEYS,
  SECTION_DISPLAY,
  TOTAL_COMBOS,
  type SectionKey,
} from "@/lib/deck";
import { cellChordName } from "@/lib/music";
import { ChordDiagram } from "@/components/ChordDiagram";
import { SECTION_STYLE } from "@/components/ChordCellView";

const COLOR_BY: Record<SectionKey, string> = { A: "sky", B: "violet", S: "rose" };

function CardSlot({ sk }: { sk: SectionKey }) {
  const sel = useSongStore((s) => s.sel[sk]);
  const songKey = useSongStore((s) => s.song.key);
  const current = useSongStore((s) => s.current);
  const song = useSongStore((s) => s.song);
  const cycleCard = useSongStore((s) => s.cycleCard);
  const card = DECK[sk][sel];
  const st = SECTION_STYLE[COLOR_BY[sk]];

  // このセクションが再生中か(assembled song の対応セクション)
  const secIndex = SECTION_KEYS.indexOf(sk);
  const sec = song.sections[secIndex];
  let playing = false;
  if (current >= 0 && sec) {
    let acc = 0;
    for (let i = 0; i < secIndex; i++) acc += song.sections[i].chords.length;
    playing = current >= acc && current < acc + sec.chords.length;
  }

  return (
    <div
      className={`rounded-2xl bg-white p-2 shadow ring-2 ${
        playing ? "ring-pop-yellow playing-glow" : st.ring
      }`}
    >
      <div className="mb-1 flex items-center gap-2">
        <span className={`rounded-md ${st.bar} px-2 py-0.5 text-xs font-black text-white`}>
          {SECTION_DISPLAY[sk]}
        </span>
        <span className="truncate text-xs font-bold text-stone-500">{card.name}</span>
        <span className="ml-auto text-[10px] text-stone-400">
          {sel + 1}/{DECK[sk].length}
        </span>
      </div>
      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={() => cycleCard(sk, -1)}
          className="h-16 w-7 shrink-0 rounded-xl bg-stone-100 text-lg font-black text-stone-500 active:scale-95"
        >
          ◀
        </button>
        <div className="flex flex-1 justify-around">
          {card.cells.map((c, i) => {
            const name = cellChordName(c, songKey);
            return (
              <div key={i} className="flex flex-col items-center">
                <span className="text-xs font-black text-stone-800">{name}</span>
                <ChordDiagram chordName={name} size={0.85} />
              </div>
            );
          })}
        </div>
        <button
          type="button"
          onClick={() => cycleCard(sk, 1)}
          className="h-16 w-7 shrink-0 rounded-xl bg-stone-100 text-lg font-black text-stone-500 active:scale-95"
        >
          ▶
        </button>
      </div>
    </div>
  );
}

export function CombineView() {
  const shuffleCombine = useSongStore((s) => s.shuffleCombine);
  const sendToCompose = useSongStore((s) => s.sendToCompose);

  return (
    <div className="space-y-3">
      {/* 組み合わせ数 */}
      <div className="rounded-2xl bg-gradient-to-r from-pop-pink to-pop-purple p-[2px] shadow">
        <div className="flex items-center justify-center gap-2 rounded-2xl bg-white py-2">
          <span className="text-sm font-bold text-foreground/60">つなげて作曲</span>
          <span className="text-2xl font-black text-foreground">
            {TOTAL_COMBOS.toLocaleString()}
          </span>
          <span className="text-sm font-bold text-foreground/60">曲</span>
        </div>
      </div>
      <p className="text-center text-xs text-foreground/50">
        ◀▶ で各パートの札をめくって、好きな組み合わせに。キーは上で変更。
      </p>

      {SECTION_KEYS.map((sk) => (
        <CardSlot key={sk} sk={sk} />
      ))}

      <div className="flex gap-2">
        <button
          type="button"
          onClick={shuffleCombine}
          className="flex-1 rounded-2xl bg-gradient-to-r from-pop-cyan to-pop-pink py-3 font-black text-white shadow-lg ring-2 ring-white/60 active:scale-95"
        >
          🎲 全部シャッフル
        </button>
        <button
          type="button"
          onClick={sendToCompose}
          className="rounded-2xl bg-white px-4 py-3 font-black text-foreground shadow ring-2 ring-pop-purple/40 active:scale-95"
        >
          ✏️ 編集へ
        </button>
      </div>
    </div>
  );
}
