import type { ChordShape } from "../types/music";
import { chordMidiNotes, midiToFrequency } from "../types/music";

/**
 * 音效引擎：以 Karplus-Strong 弦振動模擬合成撥弦音，
 * 不需載入任何取樣檔即可發出接近吉他的撥弦聲。
 */

let ctx: AudioContext | null = null;
let master: GainNode | null = null;
const bufferCache = new Map<number, AudioBuffer>();

function getContext(): AudioContext {
  if (!ctx) {
    ctx = new AudioContext();
    master = ctx.createGain();
    master.gain.value = 0.9;
    const compressor = ctx.createDynamicsCompressor();
    master.connect(compressor);
    compressor.connect(ctx.destination);
  }
  if (ctx.state === "suspended") void ctx.resume();
  return ctx;
}

/** Karplus-Strong：雜訊爆發灌入延遲線，經低通平均回授衰減成弦音 */
function renderPluck(audioCtx: AudioContext, midi: number): AudioBuffer {
  const cached = bufferCache.get(midi);
  if (cached) return cached;

  const sampleRate = audioCtx.sampleRate;
  const freq = midiToFrequency(midi);
  const seconds = 3;
  const length = sampleRate * seconds;
  const buffer = audioCtx.createBuffer(1, length, sampleRate);
  const out = buffer.getChannelData(0);

  const period = Math.max(2, Math.round(sampleRate / freq));
  const delayLine = new Float32Array(period);
  for (let i = 0; i < period; i++) {
    delayLine[i] = Math.random() * 2 - 1;
  }

  // 低音弦衰減慢、高音弦衰減快，聽感較接近真實吉他
  const damping = 0.994 + Math.min(0.005, (midi - 40) * 0.00012);
  let idx = 0;
  for (let i = 0; i < length; i++) {
    const current = delayLine[idx];
    const next = delayLine[(idx + 1) % period];
    delayLine[idx] = damping * 0.5 * (current + next);
    out[i] = current;
    idx = (idx + 1) % period;
  }

  bufferCache.set(midi, buffer);
  return buffer;
}

function playMidiAt(audioCtx: AudioContext, midi: number, when: number, gain = 0.3) {
  const source = audioCtx.createBufferSource();
  source.buffer = renderPluck(audioCtx, midi);
  const g = audioCtx.createGain();
  g.gain.setValueAtTime(gain, when);
  source.connect(g);
  g.connect(master!);
  source.start(when);
}

/** 播放單音 */
export function playNote(midi: number) {
  const audioCtx = getContext();
  playMidiAt(audioCtx, midi, audioCtx.currentTime);
}

export type StrumStyle = "strum" | "arpeggio";

/** 播放整個和弦：strum = 快速刷弦、arpeggio = 分解和弦 */
export function playChord(shape: ChordShape, style: StrumStyle = "strum") {
  playMidiNotes(chordMidiNotes(shape), style);
}

/** 直接播放一組 MIDI 音高（樂理教學、練習題試聽用，不需要和弦按法） */
export function playMidiNotes(midis: number[], style: StrumStyle = "strum") {
  const audioCtx = getContext();
  const stagger = style === "strum" ? 0.045 : 0.28;
  const start = audioCtx.currentTime + 0.02;
  midis.forEach((midi, i) => {
    playMidiAt(audioCtx, midi, start + i * stagger, 0.28);
  });
}

// ── 排程播放 API（節奏引擎用，時間以音訊時鐘為準）──────────

/** 取得音訊時鐘目前時間（秒） */
export function getAudioTime(): number {
  return getContext().currentTime;
}

/** 在指定時間播單音 */
export function noteAt(midi: number, when: number, gain = 0.25) {
  playMidiAt(getContext(), midi, when, gain);
}

/** 在指定時間刷和弦：down = 低音到高音、up = 反向（上撥） */
export function strumChordAt(
  shape: ChordShape,
  when: number,
  gain = 0.28,
  dir: "down" | "up" = "down",
) {
  const audioCtx = getContext();
  const notes = chordMidiNotes(shape);
  const ordered = dir === "down" ? notes : [...notes].reverse();
  ordered.forEach((midi, i) => playMidiAt(audioCtx, midi, when + i * 0.012, gain));
}

// ── 合成鼓組（噪音與正弦波合成，零取樣檔）──────────────

let noiseBuffer: AudioBuffer | null = null;

function getNoise(audioCtx: AudioContext): AudioBuffer {
  if (!noiseBuffer) {
    const len = Math.floor(audioCtx.sampleRate * 0.3);
    noiseBuffer = audioCtx.createBuffer(1, len, audioCtx.sampleRate);
    const data = noiseBuffer.getChannelData(0);
    for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
  }
  return noiseBuffer;
}

function noiseHit(when: number, gain: number, decay: number, highpassHz: number) {
  const audioCtx = getContext();
  const src = audioCtx.createBufferSource();
  src.buffer = getNoise(audioCtx);
  const filter = audioCtx.createBiquadFilter();
  filter.type = "highpass";
  filter.frequency.value = highpassHz;
  const g = audioCtx.createGain();
  g.gain.setValueAtTime(gain, when);
  g.gain.exponentialRampToValueAtTime(0.001, when + decay);
  src.connect(filter);
  filter.connect(g);
  g.connect(master!);
  src.start(when);
  src.stop(when + decay + 0.02);
}

/** Hi-hat：高通短噪音，切八分/十六分用 */
export function hatAt(when: number, gain = 0.07) {
  noiseHit(when, gain, 0.04, 7000);
}

/** 小鼓：中頻噪音，backbeat（2、4 拍）用 */
export function snareAt(when: number, gain = 0.22) {
  noiseHit(when, gain, 0.13, 1500);
}

/** 大鼓：正弦波音高下滑 */
export function kickAt(when: number, gain = 0.5) {
  const audioCtx = getContext();
  const osc = audioCtx.createOscillator();
  osc.type = "sine";
  osc.frequency.setValueAtTime(110, when);
  osc.frequency.exponentialRampToValueAtTime(45, when + 0.1);
  const g = audioCtx.createGain();
  g.gain.setValueAtTime(gain, when);
  g.gain.exponentialRampToValueAtTime(0.001, when + 0.16);
  osc.connect(g);
  g.connect(master!);
  osc.start(when);
  osc.stop(when + 0.18);
}
