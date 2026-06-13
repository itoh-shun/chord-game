// 再生制御フック: ボード状態 -> Tone.js 再生

import { useCallback } from "react";
import { useGameStore, selectHand } from "@/store/gameStore";
import {
  playProgression,
  stopProgression,
  prepareInstrument,
  pickInstrument,
} from "@/lib/audio";
import { downloadMidi } from "@/lib/midi";
import { buildSteps } from "@/lib/buildSteps";

export { buildSteps };

export function usePlayback() {
  const session = useGameStore((s) => s.session);
  const isPlaying = useGameStore((s) => s.isPlaying);
  const drums = useGameStore((s) => s.drums);
  const setIsPlaying = useGameStore((s) => s.setIsPlaying);
  const setPlayingStep = useGameStore((s) => s.setPlayingStep);
  const audioLoading = useGameStore((s) => s.audioLoading);
  const setAudioLoading = useGameStore((s) => s.setAudioLoading);

  const instrument = session
    ? pickInstrument(session.themes.genre.value, session.special)
    : { id: "piano" as const, label: "ピアノ" };

  const play = useCallback(async () => {
    if (!session) return;
    const steps = buildSteps(session);
    if (steps.length === 0) return;
    const bpm = Number(session.themes.tempo.value) || 120;
    const inst = pickInstrument(session.themes.genre.value, session.special);

    // サンプル音源の読み込みを待つ(初回のみ時間がかかる)
    setAudioLoading(true);
    try {
      await prepareInstrument(inst.id);
    } finally {
      setAudioLoading(false);
    }

    setIsPlaying(true);
    await playProgression(
      steps,
      bpm,
      {
        onStep: (i) => setPlayingStep(steps[i].slotIndex),
        onEnd: () => setIsPlaying(false),
      },
      { drums, instrument: inst.id },
    );
  }, [session, drums, setIsPlaying, setPlayingStep, setAudioLoading]);

  const stop = useCallback(() => {
    stopProgression();
    setIsPlaying(false);
  }, [setIsPlaying]);

  const exportMidi = useCallback(() => {
    if (session) downloadMidi(session);
  }, [session]);

  // 配置済みスロットが1つでもあれば再生可能
  const canPlay = !!session && session.board.some((s) => s.cardId);
  const placedCount = session
    ? session.board.filter((s) => s.cardId).length
    : 0;
  const totalSlots = session ? session.board.length : 0;
  const handRemaining = selectHand(session).length;

  return {
    play,
    stop,
    exportMidi,
    isPlaying,
    audioLoading,
    canPlay,
    placedCount,
    totalSlots,
    handRemaining,
    instrumentLabel: instrument.label,
  };
}
