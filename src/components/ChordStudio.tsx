"use client";

import { useEffect } from "react";
import { useSongStore } from "@/store/songStore";
import { TopBar } from "@/components/TopBar";
import { PlayBar } from "@/components/PlayBar";
import { ComposeView } from "@/components/ComposeView";
import { JamView } from "@/components/JamView";
import { ChordEditor } from "@/components/ChordEditor";
import { ChallengeBar } from "@/components/ChallengeBar";
import { ResultOverlay } from "@/components/ResultOverlay";

export function ChordStudio() {
  const mode = useSongStore((s) => s.mode);
  const hydrate = useSongStore((s) => s.hydrate);

  // クライアントで進捗を読み込み・初回お題を生成
  useEffect(() => {
    hydrate();
  }, [hydrate]);

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-[480px] flex-col">
      <TopBar />
      <main className="flex-1 space-y-3 px-3 pb-4 pt-2">
        {mode === "play" && <ChallengeBar />}
        {mode === "jam" ? <JamView /> : <ComposeView />}
      </main>
      <PlayBar />
      <ChordEditor />
      <ResultOverlay />
    </div>
  );
}
