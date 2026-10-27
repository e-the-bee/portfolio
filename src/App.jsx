import { useEffect, useRef, useState } from 'react'
import Hero from './components/Hero.jsx'
import Logo from './components/Logo.jsx'
import Player, { MiniPlayer } from './components/Player.jsx'
import { SONGS } from './content.js'
import { createBeat } from './lib/beat.js'
import { hexToRgb01 } from './lib/color.js'
import { fetchPresence } from './lib/lanyard.js'
import { getPaletteFromUrl } from './lib/okolors.js'
import { MONO_BANNER_COLORS, bannerColors } from './lib/palette.js'
import Activity from './pages/Activity.jsx'
import Extras from './pages/Extras.jsx'
import Music from './pages/Music.jsx'
import Projects from './pages/Projects.jsx'
import config from './site.config.json'
import { BONE, INK } from './theme.js'

const DEFAULT_ACC = '#d6232b'

// About (pages/About.jsx) is switched off: re-add it here and to NAV to bring it back.
const NAV = [
  { id: 'home', label: 'Home' },
  { id: 'music', label: 'Music' },
  { id: 'projects', label: 'Projects' },
  { id: 'activity', label: 'Activity' },
  { id: 'extras', label: 'Extras' },
]

const PAGES = { music: Music, projects: Projects, activity: Activity }

// Text colour that stays readable on the accent block.
function onAccent(hex) {
  const [r, g, b] = hexToRgb01(hex)
  return 0.2126 * r + 0.7152 * g + 0.0722 * b > 0.55 ? INK : BONE
}

// The site accent follows the cover art of the current song.
function accentFrom(res) {
  if (!res) return DEFAULT_ACC
  if (res.mono) return MONO_BANNER_COLORS[0]
  const { minSaturation, maxSaturation } = config.palette
  const sat = Math.min(maxSaturation, Math.max(minSaturation, res.s))
  return bannerColors(res, sat)[0]
}

export default function App() {
  const [page, setPage] = useState('home')
  const [wipeKey, setWipeKey] = useState(0)
  const [song, setSong] = useState(0)
  const [playing, setPlaying] = useState(true)
  const [gated, setGated] = useState(false)
  const [pct, setPct] = useState(0)
  const [volume, setVolume] = useState(0.33)
  const audioRef = useRef(null)
  const rootRef = useRef(null)
  const beatRef = useRef(null)
  const [acc, setAcc] = useState(DEFAULT_ACC)
  const [me, setMe] = useState({
    avatarUrl: config.profile.fallbackAvatar,
    displayName: config.profile.fallbackName,
    userTag: '@' + config.profile.fallbackName,
    status: config.status.connecting,
  })

  useEffect(() => {
    let live = true
    fetchPresence(config.profile.discordId)
      .then((p) => {
        if (!live) return
        setMe({
          avatarUrl: p.avatarUrl,
          displayName: p.displayName,
          userTag: p.userTag,
          status: config.status[p.statusKey] || config.status.offline,
        })
      })
      .catch(() => {
        if (live) setMe((m) => ({ ...m, status: config.status.offline }))
      })
    return () => { live = false }
  }, [])

  useEffect(() => {
    let live = true
    getPaletteFromUrl(SONGS[song].cover).then((res) => {
      if (live) setAcc(accentFrom(res))
    })
    return () => { live = false }
  }, [song])

  // Try to autoplay; a rejected play() flips the UI back to paused and arms the gesture listener below.
  useEffect(() => {
    const a = audioRef.current
    if (!a) return
    if (playing) {
      a.play().then(() => {
        setGated(false)
        beatRef.current?.start()
      }, () => { setPlaying(false); setGated(true) })
    } else {
      a.pause()
      beatRef.current?.stop()
    }
  }, [playing, song])

  // Beat effects: the tracker writes --beat and --b0..4 straight onto the root element, no re-renders.
  useEffect(() => {
    beatRef.current = createBeat(audioRef.current, rootRef.current)
    return () => beatRef.current?.stop()
  }, [])

  // Browsers block autoplay until the page gets a gesture: after a blocked attempt, start on the first
  // click or key press anywhere (a control handles its own click).
  useEffect(() => {
    if (!gated) return undefined
    const start = (e) => {
      if (e.target instanceof Element && e.target.closest('.btn,.vol')) return
      setPlaying(true)
    }
    window.addEventListener('pointerdown', start)
    window.addEventListener('keydown', start)
    return () => {
      window.removeEventListener('pointerdown', start)
      window.removeEventListener('keydown', start)
    }
  }, [gated])

  useEffect(() => {
    if (audioRef.current) audioRef.current.volume = volume
  }, [volume])

  const go = (id) => {
    if (id === page) return
    setPage(id)
    setWipeKey((k) => k + 1)
    window.scrollTo({ top: 0 })
  }

  const player = {
    song,
    playing,
    pct,
    volume,
    setVolume,
    cur: SONGS[song],
    pick: (i) => { setSong(i); setPlaying(true) },
    prev: () => { setSong((song + SONGS.length - 1) % SONGS.length); setPlaying(true) },
    next: () => { setSong((song + 1) % SONGS.length); setPlaying(true) },
    toggle: () => setPlaying((p) => !p),
  }

  const rootVars = { '--acc': acc, '--on': onAccent(acc), '--flick': '.36s' }
  const Page = PAGES[page]

  return (
    <div ref={rootRef} className="g" style={{ ...rootVars, minHeight: '100vh', position: 'relative', overflow: 'hidden', background: INK, paddingBottom: 24 }}>
      <div className="beatfx" aria-hidden="true" />
      <audio
        ref={audioRef}
        src={SONGS[song].audio}
        preload="metadata"
        onLoadStart={() => setPct(0)}
        onTimeUpdate={(e) => setPct(e.currentTarget.duration ? (e.currentTarget.currentTime / e.currentTarget.duration) * 100 : 0)}
        onEnded={player.next}
      />

      <div aria-hidden="true" style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 820, overflow: 'hidden', pointerEvents: 'none' }}>
        <div className="beatbg" style={{ position: 'absolute', inset: 0 }}>
          <div className="deco d-slash" style={{ zIndex: 0, top: -50, left: '-5%', width: '30%', height: 340, '--r': '0deg', '--o': 0 }} />
          <div className="deco d-bar" style={{ zIndex: 0, top: 560, left: '-3%', width: 240, height: 80, '--r': '-8deg', '--o': 2 }} />
          <div className="halftone" style={{ position: 'absolute', right: 0, top: 0, width: '48%', height: 440 }} />
        </div>
      </div>

      <div style={{ maxWidth: 1160, margin: '0 auto', padding: '22px 16px 0', position: 'relative', zIndex: 2 }}>
        <div className="box slam" style={{ display: 'flex', flexWrap: 'nowrap', overflowX: 'auto', overflowY: 'hidden', alignItems: 'center', gap: 22, padding: '22px 24px' }}>
          <Logo />
          <nav style={{ display: 'flex', flexWrap: 'nowrap', gap: 18, flex: '1 0 auto' }}>
            {NAV.map((n) => (
              <button key={n.id} type="button" className={`jag nv${n.id === page ? ' cur' : ''}`} style={{ '--base': 'skewX(-12deg)' }} onClick={() => go(n.id)}>
                <span>{n.label}</span>
              </button>
            ))}
          </nav>
        </div>
      </div>

      {page !== 'home' && <MiniPlayer player={player} />}

      <div key={wipeKey} className={wipeKey ? 'wipe' : undefined} aria-hidden="true" />
      {page === 'home' ? (
        <>
          <Player player={player} />
          <Hero me={me} />
        </>
      ) : page === 'extras' ? <Extras handle={me.userTag} /> : <Page />}

      <div className="zig" aria-hidden="true" style={{ marginTop: 80 }} />
      <div style={{ maxWidth: 1160, margin: '0 auto', padding: '40px 16px 20px', position: 'relative', zIndex: 1 }}>
        <div className="box pb" style={{ padding: 20, display: 'flex', flexWrap: 'wrap', gap: 14, alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: 13 }}>© {new Date().getFullYear()} {me.userTag}</span>
          <button type="button" className="jag btn r" onClick={() => window.scrollTo({ top: 0 })}>Back to top</button>
        </div>
      </div>
    </div>
  )
}
