import { useEffect, useRef, useState } from 'react'

// Background music.
//
// Playback is derived from three independent facts rather than tracked as one
// "is playing" flag:
//   started  — the visitor has done something that counts as consent to sound
//   muted    — they turned it off (persisted, so it stays off next visit)
//   focused  — this tab is visible AND the window has focus
// The element plays only when all three allow it. Keeping them separate is
// what stops refocusing the tab from overriding a deliberate mute.
//
// Renders nothing unless `audio.src` is set in site.config.json.
const STORAGE_KEY = 'om-audio-muted'

export default function AmbientAudio({
  src,
  volume = 0.1,
  loop = false,
  showToggle = true,
  clickToStart = true,
  pauseWhenUnfocused = true,
  gateLabel = 'click anywhere to enter'
}) {
  const audioRef = useRef(null)
  const [muted, setMuted] = useState(() => {
    try { return localStorage.getItem(STORAGE_KEY) === '1' } catch { return false }
  })
  // With a click gate the visitor's click is the start signal. Without one we
  // start immediately and rely on the browser (and the gesture fallback).
  const [started, setStarted] = useState(!clickToStart)
  const [focused, setFocused] = useState(true)
  const [playing, setPlaying] = useState(false)
  const [failed, setFailed] = useState(false)

  // ── focus tracking ──────────────────────────────────────────────────────
  useEffect(() => {
    if (!pauseWhenUnfocused) return
    const sync = () => setFocused(document.hasFocus() && !document.hidden)
    sync()
    window.addEventListener('focus', sync)
    window.addEventListener('blur', sync)
    document.addEventListener('visibilitychange', sync)
    return () => {
      window.removeEventListener('focus', sync)
      window.removeEventListener('blur', sync)
      document.removeEventListener('visibilitychange', sync)
    }
  }, [pauseWhenUnfocused])

  // ── playback follows intent ─────────────────────────────────────────────
  useEffect(() => {
    const el = audioRef.current
    if (!el || !src) return
    el.volume = volume

    if (started && !muted && (!pauseWhenUnfocused || focused)) {
      const p = el.play()
      if (p && p.then) p.then(() => setPlaying(true)).catch(() => setPlaying(false))
    } else {
      el.pause()
      setPlaying(false)
    }
  }, [started, muted, focused, src, volume, pauseWhenUnfocused])

  // Without a gate, autoplay may be refused — fall back to the first gesture.
  useEffect(() => {
    if (clickToStart || muted || !src) return
    const el = audioRef.current
    if (!el || !el.paused) return

    const onGesture = () => { setStarted(true); cleanup() }
    const opts = { once: true, passive: true }
    const events = ['pointerdown', 'keydown', 'scroll', 'touchstart']
    events.forEach((e) => window.addEventListener(e, onGesture, opts))
    const cleanup = () => events.forEach((e) => window.removeEventListener(e, onGesture))
    return cleanup
  }, [clickToStart, muted, src, playing])

  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY, muted ? '1' : '0') } catch { /* private mode */ }
  }, [muted])

  if (!src) return null

  const toggle = () => {
    if (playing) { setMuted(true); return }
    setMuted(false)
    setStarted(true)
  }

  const showGate = clickToStart && !started && !muted && !failed

  return (
    <>
      <audio
        ref={audioRef}
        src={src}
        loop={loop}
        preload="auto"
        onEnded={() => setPlaying(false)}
        onError={() => { setFailed(true); setStarted(true) }}
      />

      {showGate && (
        // The whole overlay is the click target; the inner button exists so
        // the gate is reachable and operable by keyboard too.
        <div className="om-gate" onClick={() => setStarted(true)}>
          <button className="om-gate-bubble" onClick={() => setStarted(true)}>
            {gateLabel}
          </button>
        </div>
      )}

      {showToggle && !failed && !showGate && (
        <button
          onClick={toggle}
          className="om-audio-toggle"
          title={playing ? 'Mute music' : 'Play music'}
          aria-label={playing ? 'Mute music' : 'Play music'}
        >
          {playing ? '♪' : '♪̸'}
        </button>
      )}
    </>
  )
}
