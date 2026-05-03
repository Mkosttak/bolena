/**
 * KDS bildirim sesi:
 * 1) Kısa PCM WAV (data URL) + HTMLAudioElement — çoğu tarayıcıda Web Audio’dan daha toleranslı.
 * 2) Web Audio yedek (HTML5 play reddedilirse).
 * İlk pointerdown/keydown ile HTML sesi “sıcak” çalınıp kilit açılır.
 */

let ctx: AudioContext | null = null
let chimeDataUrl: string | null = null
let chimeAudioEl: HTMLAudioElement | null = null

function uint8ToBase64(bytes: Uint8Array): string {
  let binary = ''
  for (let i = 0; i < bytes.byteLength; i++) binary += String.fromCharCode(bytes[i]!)
  return btoa(binary)
}

/** ~500 ms iki tonlu çan (C5 + E5), mono 16-bit 22.05 kHz WAV */
function buildKitchenChimeWavDataUrl(): string {
  if (chimeDataUrl) return chimeDataUrl

  const sampleRate = 22050
  const durationMs = 500
  const samples = Math.floor((sampleRate * durationMs) / 1000)
  const dataSize = samples * 2
  const buffer = new ArrayBuffer(44 + dataSize)
  const view = new DataView(buffer)

  const writeStr = (offset: number, s: string) => {
    for (let i = 0; i < s.length; i++) view.setUint8(offset + i, s.charCodeAt(i)!)
  }

  writeStr(0, 'RIFF')
  view.setUint32(4, 36 + dataSize, true)
  writeStr(8, 'WAVE')
  writeStr(12, 'fmt ')
  view.setUint32(16, 16, true)
  view.setUint16(20, 1, true)
  view.setUint16(22, 1, true)
  view.setUint32(24, sampleRate, true)
  view.setUint32(28, sampleRate * 2, true)
  view.setUint16(32, 2, true)
  view.setUint16(34, 16, true)
  writeStr(36, 'data')
  view.setUint32(40, dataSize, true)

  const f1 = 523.25
  const f2 = 659.25
  for (let i = 0; i < samples; i++) {
    const t = i / sampleRate
    const attack = Math.min(1, i / (sampleRate * 0.035))
    const rel = i > samples * 0.52 ? Math.max(0, 1 - (i - samples * 0.52) / (samples * 0.48)) : 1
    const env = attack * rel
    const tone1 = 0.45 * Math.sin(2 * Math.PI * f1 * t)
    const tone2 = t > 0.085 ? 0.4 * Math.sin(2 * Math.PI * f2 * (t - 0.085)) : 0
    let sample = (tone1 + tone2) * env * 0.82
    sample = Math.max(-1, Math.min(1, sample))
    view.setInt16(44 + i * 2, Math.round(sample * 32000), true)
  }

  chimeDataUrl = `data:audio/wav;base64,${uint8ToBase64(new Uint8Array(buffer))}`
  return chimeDataUrl
}

function getChimeAudioElement(): HTMLAudioElement | null {
  if (typeof window === 'undefined') return null
  if (!chimeAudioEl) {
    chimeAudioEl = new Audio(buildKitchenChimeWavDataUrl())
    chimeAudioEl.preload = 'auto'
  }
  return chimeAudioEl
}

function getContext(): AudioContext | null {
  if (typeof window === 'undefined') return null
  try {
    const Ctor =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
    if (!Ctor) return null
    if (!ctx) ctx = new Ctor()
    return ctx
  } catch {
    return null
  }
}

function scheduleChimeAt(audioCtx: AudioContext): void {
  const now = audioCtx.currentTime

  const master = audioCtx.createGain()
  master.gain.setValueAtTime(0.0001, now)
  master.gain.exponentialRampToValueAtTime(0.45, now + 0.03)
  master.gain.exponentialRampToValueAtTime(0.0001, now + 0.60)
  master.connect(audioCtx.destination)

  const tones: { freq: number; at: number; dur: number }[] = [
    { freq: 392, at: 0, dur: 0.34 },
    { freq: 493.88, at: 0.11, dur: 0.36 },
  ]

  for (const { freq, at, dur } of tones) {
    const t0 = now + at
    const osc = audioCtx.createOscillator()
    osc.type = 'sine'
    osc.frequency.setValueAtTime(freq, t0)

    const g = audioCtx.createGain()
    g.gain.setValueAtTime(0.0001, t0)
    g.gain.exponentialRampToValueAtTime(0.45, t0 + 0.025)
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur)

    osc.connect(g)
    g.connect(master)
    osc.start(t0)
    osc.stop(t0 + dur + 0.02)
  }
}

function playWebAudioChimeFallback(): void {
  const audioCtx = getContext()
  if (!audioCtx) return

  const run = () => {
    try {
      if (audioCtx.state !== 'closed') scheduleChimeAt(audioCtx)
    } catch {
      /* yoksay */
    }
  }

  if (audioCtx.state === 'suspended') {
    void audioCtx.resume().then(run).catch(run)
  } else {
    run()
  }
}

/**
 * İlk tıklama / tuş: HTML5 sesi çok düşük volümla çalıp durdurarak kilidi açar + WebAudio resume.
 */
export function attachKitchenNotificationAudioUnlock(): () => void {
  if (typeof window === 'undefined') return () => {}

  const tryUnlock = () => {
    const el = getChimeAudioElement()
    if (el) {
      const prev = el.volume
      el.volume = 0.015
      el.currentTime = 0
      void el
        .play()
        .then(() => {
          el.pause()
          el.currentTime = 0
          el.volume = prev > 0.05 ? prev : 1.0
        })
        .catch(() => {
          el.volume = prev > 0.05 ? prev : 1.0
        })
    }
    const c = getContext()
    if (c && c.state === 'suspended') void c.resume().catch(() => {})
  }

  window.addEventListener('pointerdown', tryUnlock, { capture: true, passive: true })
  window.addEventListener('keydown', tryUnlock, { capture: true, passive: true })

  return () => {
    window.removeEventListener('pointerdown', tryUnlock, { capture: true })
    window.removeEventListener('keydown', tryUnlock, { capture: true })
  }
}

export function playKitchenNotificationChime(): void {
  // Chime'in kendi suresi ~500 ms — aralari ~1100 ms sessizlik birakacak sekilde
  // 1600 ms'lik adimlarla calistir. Toplam: ~3.7 saniyelik dikkat sinyali.
  const DELAYS = [0, 1600, 3200]
  for (const delay of DELAYS) {
    setTimeout(() => {
      const dataUrl = buildKitchenChimeWavDataUrl()
      if (dataUrl) {
        const clone = new Audio(dataUrl)
        clone.volume = 1.0
        void clone.play().catch(() => playWebAudioChimeFallback())
      } else {
        playWebAudioChimeFallback()
      }
    }, delay)
  }
}
