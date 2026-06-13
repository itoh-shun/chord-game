"use client";

import { useGameStore } from "@/store/gameStore";
import { PackScreen } from "@/components/PackScreen";
import { RevealScreen } from "@/components/RevealScreen";
import { GameBoard } from "@/components/GameBoard";

/** フェーズに応じて画面を切り替えるルート */
export function CompositionTavern() {
  const phase = useGameStore((s) => s.phase);

  if (phase === "pack" || phase === "opening") return <PackScreen />;
  if (phase === "revealed") return <RevealScreen />;
  return <GameBoard />;
}
