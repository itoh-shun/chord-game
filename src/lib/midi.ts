// 曲を MIDI ファイルに書き出す

import { Midi } from "@tonejs/midi";
import type { Song } from "@/types";
import { songToEvents } from "@/lib/song";
import { noteNameToMidi } from "@/lib/music";

/** 曲を Standard MIDI File (Uint8Array) に書き出す */
export function buildMidi(song: Song): Uint8Array {
  const events = songToEvents(song);
  const bpm = song.tempo || 120;
  const beatSeconds = 60 / bpm;

  const midi = new Midi();
  midi.header.setTempo(bpm);
  midi.header.name = "composition";

  const chords = midi.addTrack();
  chords.name = "Chords";
  const bass = midi.addTrack();
  bass.name = "Bass";

  let acc = 0;
  for (const e of events) {
    const time = acc * beatSeconds;
    const dur = e.beats * beatSeconds;
    acc += e.beats;
    if (!e.notes.length) continue;
    e.notes.forEach((n) =>
      chords.addNote({ name: n, time, duration: dur * 0.98, velocity: 0.7 }),
    );
    bass.addNote({
      midi: Math.max(0, noteNameToMidi(e.notes[0]) - 12),
      time,
      duration: dur * 0.98,
      velocity: 0.8,
    });
  }
  return midi.toArray();
}

export function downloadMidi(song: Song): void {
  const data = buildMidi(song);
  const blob = new Blob([data as BlobPart], { type: "audio/midi" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `song_${song.key}_${song.tempo}bpm.mid`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
