"use client";

import { useSongStore, songToEvents } from "@/store/songStore";
import { SectionLane } from "@/components/SectionLane";

export function ComposeView() {
  const song = useSongStore((s) => s.song);
  const current = useSongStore((s) => s.current);
  const addSection = useSongStore((s) => s.addSection);

  const events = songToEvents(song);
  const activeCellId = current >= 0 ? (events[current]?.cellId ?? null) : null;

  return (
    <div className="space-y-3">
      <p className="text-center text-xs text-foreground/50">
        コードをタップして度数・種類・長さを編集。セクションで展開を組み立て。
      </p>
      {song.sections.map((sec) => (
        <SectionLane
          key={sec.id}
          section={sec}
          songKey={song.key}
          activeCellId={activeCellId}
        />
      ))}
      <button
        type="button"
        onClick={addSection}
        className="w-full rounded-2xl bg-white/70 py-3 font-black text-foreground/70 ring-2 ring-dashed ring-pop-purple/40 active:scale-95"
      >
        ＋ セクション(展開)を追加
      </button>
    </div>
  );
}
