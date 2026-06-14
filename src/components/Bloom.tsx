"use client";

import { useEffect, useRef, useState } from "react";
import { initAudio, isReady, pluck } from "@/lib/sound";
import { MOODS, buildNotes, type Mood } from "@/lib/scales";

type Node = {
  x: number; // 0..1
  y: number; // 0..1
  note: string;
  pan: number;
  hue: number;
  born: number;
  lastPhase: number;
};
type Ring = { x: number; y: number; born: number; hue: number };

const LOOP_MS = 6400;
const MAX_NODES = 48;

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}

export function Bloom() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const nodes = useRef<Node[]>([]);
  const rings = useRef<Ring[]>([]);
  const moodRef = useRef<Mood>(MOODS[0]);
  const notesRef = useRef<string[]>(buildNotes(MOODS[0]));
  const pressed = useRef(false);
  const lastSpawn = useRef(0);
  const rainRef = useRef(false);
  const rainTimer = useRef(0);
  const interacted = useRef(false);

  const [moodIdx, setMoodIdx] = useState(0);
  const [rain, setRain] = useState(false);
  const [hint, setHint] = useState(true);
  const [count, setCount] = useState(0);

  // ノートを y から決める(上=高音)
  function noteForY(y: number) {
    const list = notesRef.current;
    const idx = Math.round((1 - y) * (list.length - 1));
    const t = idx / (list.length - 1);
    const [h0, h1] = moodRef.current.hue;
    return { note: list[Math.max(0, Math.min(list.length - 1, idx))], hue: lerp(h0, h1, t) };
  }

  function addNode(x: number, y: number) {
    const { note, hue } = noteForY(y);
    const node: Node = { x, y, note, pan: x * 2 - 1, hue, born: performance.now(), lastPhase: 1 };
    nodes.current.push(node);
    if (nodes.current.length > MAX_NODES) nodes.current.shift();
    setCount(nodes.current.length);
  }

  async function ensureStarted() {
    if (!interacted.current) {
      interacted.current = true;
      setHint(false);
    }
    if (!isReady()) await initAudio();
  }

  useEffect(() => {
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext("2d")!;
    let raf = 0;

    const pos = (e: PointerEvent) => ({
      x: e.clientX / window.innerWidth,
      y: e.clientY / window.innerHeight,
    });

    const onDown = async (e: PointerEvent) => {
      pressed.current = true;
      const p = pos(e);
      addNode(p.x, p.y);
      await ensureStarted();
    };
    const onMove = (e: PointerEvent) => {
      if (!pressed.current) return;
      const now = performance.now();
      if (now - lastSpawn.current < 70) return;
      lastSpawn.current = now;
      const p = pos(e);
      addNode(p.x, p.y);
    };
    const onUp = () => {
      pressed.current = false;
    };

    canvas.addEventListener("pointerdown", onDown);
    canvas.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    window.addEventListener("pointercancel", onUp);

    const render = () => {
      raf = requestAnimationFrame(render);
      const now = performance.now();
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      const w = window.innerWidth;
      const h = window.innerHeight;
      if (canvas.width !== Math.floor(w * dpr) || canvas.height !== Math.floor(h * dpr)) {
        canvas.width = Math.floor(w * dpr);
        canvas.height = Math.floor(h * dpr);
      }
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      // 背景(残像を残してフェード)
      const baseHue = moodRef.current.bgHue + Math.sin(now / 9000) * 18;
      const g = ctx.createLinearGradient(0, 0, 0, h);
      g.addColorStop(0, `hsla(${baseHue}, 60%, 9%, 0.20)`);
      g.addColorStop(1, `hsla(${baseHue + 40}, 70%, 5%, 0.20)`);
      ctx.globalCompositeOperation = "source-over";
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, w, h);

      ctx.globalCompositeOperation = "lighter";

      // 自動生成(雨)
      if (rainRef.current && now - rainTimer.current > 620) {
        rainTimer.current = now;
        addNode(0.1 + Math.random() * 0.8, 0.12 + Math.random() * 0.76);
      }

      const ns = nodes.current;

      // 星座(近い点をつなぐ)
      for (let i = 0; i < ns.length; i++) {
        for (let j = i + 1; j < ns.length; j++) {
          const ax = ns[i].x * w, ay = ns[i].y * h;
          const bx = ns[j].x * w, by = ns[j].y * h;
          const d = Math.hypot(ax - bx, ay - by);
          if (d < 140) {
            ctx.strokeStyle = `hsla(${(ns[i].hue + ns[j].hue) / 2}, 80%, 70%, ${0.12 * (1 - d / 140)})`;
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(ax, ay);
            ctx.lineTo(bx, by);
            ctx.stroke();
          }
        }
      }

      // ノード(発音判定＋発光)
      for (const n of ns) {
        const phase = ((now - n.born) % LOOP_MS) / LOOP_MS;
        if (phase < n.lastPhase) {
          // ループが頭に戻った→発音
          if (isReady()) pluck(n.note, n.pan);
          rings.current.push({ x: n.x, y: n.y, born: now, hue: n.hue });
          if (rings.current.length > 120) rings.current.shift();
        }
        n.lastPhase = phase;

        const pulse = Math.exp(-phase * 5); // 発音直後に大きく光る
        const cx = n.x * w, cy = n.y * h;
        const r = 5 + pulse * 16;
        const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, r * 3);
        grad.addColorStop(0, `hsla(${n.hue}, 95%, ${65 + pulse * 25}%, ${0.5 + pulse * 0.5})`);
        grad.addColorStop(1, `hsla(${n.hue}, 95%, 60%, 0)`);
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(cx, cy, r * 3, 0, Math.PI * 2);
        ctx.fill();
        // 芯
        ctx.fillStyle = `hsla(${n.hue}, 100%, ${80 + pulse * 15}%, ${0.7 + pulse * 0.3})`;
        ctx.beginPath();
        ctx.arc(cx, cy, 2 + pulse * 2.5, 0, Math.PI * 2);
        ctx.fill();
      }

      // リング
      const RING_LIFE = 1700;
      const rs = rings.current;
      for (let i = rs.length - 1; i >= 0; i--) {
        const age = now - rs[i].born;
        if (age > RING_LIFE) {
          rs.splice(i, 1);
          continue;
        }
        const t = age / RING_LIFE;
        const rad = t * Math.min(w, h) * 0.42;
        ctx.strokeStyle = `hsla(${rs[i].hue}, 90%, 70%, ${(1 - t) * 0.5})`;
        ctx.lineWidth = (1 - t) * 3 + 0.5;
        ctx.beginPath();
        ctx.arc(rs[i].x * w, rs[i].y * h, rad, 0, Math.PI * 2);
        ctx.stroke();
      }
    };
    raf = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(raf);
      canvas.removeEventListener("pointerdown", onDown);
      canvas.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointercancel", onUp);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function chooseMood(i: number) {
    setMoodIdx(i);
    moodRef.current = MOODS[i];
    notesRef.current = buildNotes(MOODS[i]);
    // 既存ノードを新スケールに合わせて作り直す
    nodes.current = nodes.current.map((n) => {
      const { note, hue } = noteForY(n.y);
      return { ...n, note, hue };
    });
  }

  return (
    <div className="fixed inset-0 select-none overflow-hidden bg-black">
      <canvas ref={canvasRef} className="absolute inset-0 h-full w-full touch-none" />

      {/* ヒント */}
      {hint && (
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center gap-2 text-center">
          <p className="animate-pulse text-2xl font-black tracking-widest text-white/80 drop-shadow">
            どこでも触れて
          </p>
          <p className="text-sm text-white/40">なぞると光と音が咲く</p>
        </div>
      )}

      {/* コントロール */}
      <div className="absolute inset-x-0 top-0 flex items-center gap-2 p-3">
        <span className="text-sm font-black tracking-widest text-white/80">✦ BLOOM</span>
        <div className="ml-auto flex items-center gap-1.5 rounded-full bg-white/10 p-1 backdrop-blur">
          {MOODS.map((m, i) => (
            <button
              key={m.id}
              type="button"
              onClick={() => chooseMood(i)}
              className={`h-8 w-8 rounded-full text-sm font-black transition ${
                moodIdx === i ? "bg-white text-black" : "text-white/70"
              }`}
            >
              {m.name}
            </button>
          ))}
        </div>
      </div>

      <div className="absolute inset-x-0 bottom-0 flex items-center justify-center gap-3 p-4">
        <button
          type="button"
          onClick={() => {
            rainRef.current = !rainRef.current;
            setRain(rainRef.current);
          }}
          className={`rounded-full px-4 py-2 text-sm font-black backdrop-blur transition ${
            rain ? "bg-white text-black" : "bg-white/10 text-white/80"
          }`}
        >
          🌧 自動 {rain ? "ON" : "OFF"}
        </button>
        <button
          type="button"
          onClick={() => {
            nodes.current = [];
            rings.current = [];
            setCount(0);
          }}
          className="rounded-full bg-white/10 px-4 py-2 text-sm font-black text-white/80 backdrop-blur"
        >
          ✕ 消す
        </button>
        <span className="rounded-full bg-white/10 px-3 py-2 text-sm font-black text-white/60 backdrop-blur">
          {count}
        </span>
      </div>
    </div>
  );
}
