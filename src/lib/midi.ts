// 配置されたボードから MIDI ファイルを生成する

import { Midi } from "@tonejs/midi";
import type { GameSession } from "@/lib/game";
import { buildSteps } from "@/lib/buildSteps";
import { noteNameToMidi } from "@/lib/music";

/** セッションの曲を Standard MIDI File (Uint8Array) に書き出す */
export function buildMidi(session: GameSession): Uint8Array {
  const steps = buildSteps(session);
  const bpm = Number(session.themes.tempo.value) || 120;
  const beatSeconds = 60 / bpm;
  const barSeconds = beatSeconds * 4;

  const midi = new Midi();
  midi.header.setTempo(bpm);
  midi.header.name = session.customer.title;

  const chords = midi.addTrack();
  chords.name = "Chords";
  const bass = midi.addTrack();
  bass.name = "Bass";

  steps.forEach((step, i) => {
    if (!step.notes.length) return;
    const time = i * barSeconds;
    // コード(各小節)
    step.notes.forEach((n) => {
      chords.addNote({ name: n, time, duration: barSeconds * 0.98, velocity: 0.7 });
    });
    // ベース(ルート音を1オクターブ下げて)
    const root = step.notes[0];
    bass.addNote({
      midi: Math.max(0, noteNameToMidi(root) - 12),
      time,
      duration: barSeconds * 0.98,
      velocity: 0.8,
    });
  });

  return midi.toArray();
}

/** MIDI をダウンロードさせる */
export function downloadMidi(session: GameSession): void {
  const data = buildMidi(session);
  const blob = new Blob([data as BlobPart], { type: "audio/midi" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  const safe = session.customer.title.replace(/[^\w぀-ヿ一-龯]/g, "_");
  a.download = `作曲酒場_${safe}.mid`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
