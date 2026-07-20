import { useEffect, useRef, useState } from 'react'

// Background music.
//
// Browsers block audible playback until the visitor has interacted with the
// page, so "play on load" is best-effort: we try immediately, and if the
// browser refuses we start on the first click/key/scroll instead. Chrome may
// allow the immediate attempt on machines that visit this site often (its
// media engagement heuristic), which is exactly why the gesture fallback has
// to exist — the author's browser is the least representative one.
//
// Renders nothing at all unless `audio.src` is set in site.config.json.
const STORAGE_KEY = 'om-audio-muted'

export default function AmbientAudio({ src, volume = 0.3, loop = false, showToggle = true }) {
  const audioRef = useRef(null)
  // Visitors who muted it once shouldn't be re-blasted on every page load.
  const [muted, setMuted] = useState(() => {
    try { return localStorage.getItem(STORAGE_KEY) === '1' } catch { return false }
  })
  const [playing, setPlaying] = useState(false)
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    const el = audioRef.current
    if (!el || !src || muted) return

    el.volume = volume
    let cleanup = () => {}

    const start = () => {
      const attempt = el.play()
      if (attempt && attempt.catch) {
        attempt.then(() => setPlaying(true)).catch(() => {})
      }
    }

    const onGesture = () => {
      start()
      cleanup()
    }

    const tryPlay = el.play()
    if (tryPlay && tryPlay.then) {
      tryPlay.then(() => setPlaying(true)).catch(() => {
        // Autoplay refused — wait for the first interaction of any kind.
        const opts = { once: true, passive: true }
        window.addEventListener('pointerdown', onGesture, opts)
        window.addEventListener('keydown', onGesture, opts)
        window.addEventListener('scroll', onGesture, opts)
        window.addEventListener('touchstart', onGesture, opts)
        cleanup = () => {
          window.removeEventListener('pointerdown', onGesture)
          window.removeEventListener('keydown', onGesture)
          window.removeEventListener('scroll', onGesture)
          window.removeEventListener('touchstart', onGesture)
        }
      })
    }

    return () => cleanup()
  }, [src, volume, muted])

  // Keep the live element in step with the volume/mute state.
  useEffect(() => {
    const el = audioRef.current
    if (!el) return
    el.volume = volume
    if (muted) { el.pause(); setPlaying(false) }
    try { localStorage.setItem(STORAGE_KEY, muted ? '1' : '0') } catch { /* private mode */ }
  }, [muted, volume])

  if (!src) return null

  const toggle = () => {
    const el = audioRef.current
    if (!el) return
    if (muted || el.paused) {
      setMuted(false)
      el.volume = volume
      const p = el.play()
      if (p && p.then) p.then(() => setPlaying(true)).catch(() => setFailed(true))
    } else {
      setMuted(true)
    }
  }

  return (
    <>
      <audio
        ref={audioRef}
        src={src}
        loop={loop}
        preload="auto"
        onEnded={() => setPlaying(false)}
        onError={() => setFailed(true)}
      />
      {showToggle && !failed && (
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
