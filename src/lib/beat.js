// Beat tracker: taps the <audio> element with a Web Audio analyser and writes CSS variables on `root`.
//   --beat   0..1, jumps to 1 on a bass hit and decays
//   --b0..4  0..1, five frequency bands for the equaliser bars
const BANDS = [[1, 3], [4, 8], [9, 20], [21, 50], [51, 120]]

const reduced = () => typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches

export function createBeat(audio, root) {
  let ctx = null
  let analyser = null
  let data = null
  let raf = 0
  let beat = 0
  let avg = 0
  let last = 0

  const setup = () => {
    if (ctx || reduced()) return Boolean(ctx)
    const Ctx = window.AudioContext || window.webkitAudioContext
    if (!Ctx) return false
    try {
      ctx = new Ctx()
      const src = ctx.createMediaElementSource(audio)
      analyser = ctx.createAnalyser()
      analyser.fftSize = 512
      analyser.smoothingTimeConstant = 0.55
      src.connect(analyser)
      analyser.connect(ctx.destination)
      data = new Uint8Array(analyser.frequencyBinCount)
      return true
    } catch {
      ctx = null
      return false
    }
  }

  const clear = () => {
    root.style.setProperty('--beat', '0')
    BANDS.forEach((_, i) => root.style.setProperty(`--b${i}`, '.2'))
  }

  const tick = (now) => {
    analyser.getByteFrequencyData(data)
    const mean = (a, b) => {
      let s = 0
      for (let i = a; i <= b; i++) s += data[i]
      return s / (b - a + 1) / 255
    }
    const bass = mean(1, 4)
    // A hit is bass clearly above its own recent average, with a short cooldown so one kick is one pulse.
    if (bass > avg * 1.22 + 0.06 && now - last > 150) {
      beat = 1
      last = now
    } else {
      beat *= 0.9
    }
    avg = avg * 0.94 + bass * 0.06
    root.style.setProperty('--beat', beat.toFixed(3))
    BANDS.forEach(([a, b], i) => root.style.setProperty(`--b${i}`, (0.15 + Math.min(1, mean(a, b) * 1.4) * 0.85).toFixed(3)))
    raf = requestAnimationFrame(tick)
  }

  return {
    // Call after a successful play(): the context may only start once the page has had a gesture.
    start() {
      if (!setup()) return
      ctx.resume().catch(() => {})
      if (!raf) {
        root.classList.add('live')
        raf = requestAnimationFrame(tick)
      }
    },
    stop() {
      if (raf) cancelAnimationFrame(raf)
      raf = 0
      beat = 0
      root.classList.remove('live')
      clear()
    },
  }
}
