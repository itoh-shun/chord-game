"use client";

import { useSongStore } from "@/store/songStore";
import { TopBar } from "@/components/TopBar";
import { PlayBar } from "@/components/PlayBar";
import { ComposeView } from "@/components/ComposeView";
import { JamView } from "@/components/JamView";
import { ChordEditor } from "@/components/ChordEditor";

export function ChordStudio() {
  const mode = useSongStore((s) => s.mode);

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-[480px] flex-col">
      <TopBar />
      <main className="flex-1 px-3 pb-4 pt-2">
        {mode === "compose" ? <ComposeView /> : <JamView />}
      </main>
      <PlayBar />
      <ChordEditor />
    </div>
  );
}
