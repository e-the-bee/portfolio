import { useEffect, useRef, useState } from 'react'
import { hexToRgb01 } from './lib/color.js'
import { fetchPresence } from './lib/lanyard.js'
import { getPaletteFromUrl } from './lib/okolors.js'
import { MONO_BANNER_COLORS, bannerColors } from './lib/palette.js'
import { BIO, BIO_LINK, DNI, SONGS } from './content.js'
// About and Extras are switched off for now; restore the imports, nav entries and routes below to bring them back.
// import About from './pages/About.jsx'
// import Extras from './pages/Extras.jsx'
import Music from './pages/Music.jsx'
import Projects from './pages/Projects.jsx'
import config from './site.config.json'

const INK = '#0b0b0b'
const BONE = '#f2f0e6'
const DEFAULT_ACC = '#d6232b'

const NAV = [
  { id: 'home', label: 'Home' },
  { id: 'music', label: 'Music' },
  { id: 'projects', label: 'Projects' },
  // { id: 'about', label: 'About' },
  // { id: 'extras', label: 'Extras' },
]

// The site accent follows the cover art of the current song.
// Text colour that stays readable on the accent block.
function onAccent(hex) {
  const [r, g, b] = hexToRgb01(hex)
  return 0.2126 * r + 0.7152 * g + 0.0722 * b > 0.55 ? INK : BONE
}

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
    if (playing) a.play().then(() => setGated(false), () => { setPlaying(false); setGated(true) })
    else a.pause()
  }, [playing, song])

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

  return (
    <div className="g" style={{ ...rootVars, minHeight: '100vh', position: 'relative', overflow: 'hidden', background: INK, paddingBottom: 24 }}>
      <audio
        ref={audioRef}
        src={SONGS[song].audio}
        preload="metadata"
        onLoadStart={() => setPct(0)}
        onTimeUpdate={(e) => setPct(e.currentTarget.duration ? (e.currentTarget.currentTime / e.currentTarget.duration) * 100 : 0)}
        onEnded={() => { setSong((song + 1) % SONGS.length); setPlaying(true) }}
      />

      {/* backdrop shapes */}
      <div aria-hidden="true" style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 820, overflow: 'hidden', pointerEvents: 'none' }}>
        <div className="deco d-slash" style={{ zIndex: 0, top: -70, left: '-9%', width: '67%', height: 640, '--r': '0deg', '--o': 0 }} />
        <div className="deco d-bar" style={{ zIndex: 0, top: 300, left: '36%', width: 520, height: 34, '--r': '-64deg', '--o': 2 }} />
        <div className="halftone" style={{ position: 'absolute', right: 0, top: 0, width: '48%', height: 440 }} />
      </div>

      {/* nav */}
      <div style={{ maxWidth: 1160, margin: '0 auto', padding: '22px 16px 0', position: 'relative', zIndex: 2 }}>
        <div className="box slam" style={{ display: 'flex', flexWrap: 'nowrap', overflowX: 'auto', alignItems: 'center', gap: 22, padding: '22px 24px' }}>
          <div className="logoW">
            <div className="sh" aria-hidden="true" />
            <div className="hd rd wob" style={{ width: 60, height: 60, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, border: `3px solid ${INK}`, boxShadow: `5px 5px 0 ${BONE}` }}>LOGO</div>
          </div>
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
          <Hero me={me} acc={acc} />
        </>
      ) : page === 'music' ? <Music />
        : <Projects />}
      {/* page === 'about' ? <About /> : <Extras handle={me.userTag} /> */}

      {/* footer */}
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

function Volume({ player }) {
  return (
    <label className="vol">
      <span>Vol</span>
      <input
        type="range"
        min="0"
        max="1"
        step="0.01"
        value={player.volume}
        aria-label="Volume"
        onChange={(e) => player.setVolume(Number(e.target.value))}
      />
    </label>
  )
}

function MiniPlayer({ player }) {
  const btn = { minHeight: 44, fontSize: 15, padding: '6px 16px' }
  return (
    <div style={{ maxWidth: 1160, margin: '0 auto', padding: '18px 16px 0', position: 'relative', zIndex: 2 }}>
      <div className="box rd" style={{ display: 'flex', flexWrap: 'nowrap', overflowX: 'auto', gap: 18, alignItems: 'center', padding: '22px 20px', border: `3px solid ${INK}`, boxShadow: `6px 6px 0 ${BONE}` }}>
        <span className="tag" style={{ flex: 'none', whiteSpace: 'nowrap' }}>now playing</span>
        <span className="hd" style={{ fontSize: 22, flex: '1 0 140px', whiteSpace: 'nowrap' }}>{player.cur.title}</span>
        <button type="button" className="jag btn" style={btn} onClick={player.prev}>Prev</button>
        <button type="button" className="jag btn on" style={btn} onClick={player.toggle}>{player.playing ? 'Pause' : 'Play'}</button>
        <button type="button" className="jag btn" style={btn} onClick={player.next}>Next</button>
        <Volume player={player} />
      </div>
    </div>
  )
}

function Player({ player }) {
  const { cur, song, playing } = player
  return (
    <div id="player" style={{ maxWidth: 1160, margin: '0 auto', padding: '36px 16px 0', position: 'relative', zIndex: 1 }}>
      <div className="deco d-slash" aria-hidden="true" style={{ top: -14, right: -70, width: 380, height: 110, '--r': '-6deg', '--o': 1 }} />
      <div className="deco d-rip" aria-hidden="true" style={{ top: 140, left: -80, width: 300, height: 280, '--r': '3deg', '--o': 3 }} />
      <div className="deco d-tri b" aria-hidden="true" style={{ bottom: -26, right: '7%', width: 110, height: 110, '--r': '12deg', '--o': 4 }} />
      <div className="deco d-dots" aria-hidden="true" style={{ bottom: -10, left: '6%', width: 240, height: 120, '--o': 2 }} />
      <div className="box rd slam" style={{ padding: 24, border: `3px solid ${INK}`, boxShadow: `8px 8px 0 ${BONE}`, '--d': '200ms' }}>
        <div className={playing ? 'player' : 'player paused'} style={{ display: 'flex', flexWrap: 'wrap', gap: 28, alignItems: 'stretch' }}>
          <div style={{ display: 'flex', gap: 18, alignItems: 'center', flex: '2 1 520px', minWidth: 0 }}>
            <div className="bk" style={{ width: 124, height: 124, flex: 'none', transform: 'rotate(-3deg)', padding: 0, overflow: 'hidden' }}>
              <img src={cur.cover} alt="" style={{ width: '100%', height: '100%', display: 'block', objectFit: 'cover' }} />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, flex: 1, minWidth: 0 }}>
              <h2 className="hd fx dk" style={{ fontSize: 36, lineHeight: 1, alignSelf: 'flex-start', color: 'var(--on)', '--o': 11 }}>
                {cur.title}
                {[1, 2, 3, 4, 5].map((n) => <i key={n} className={`cl c${n}`} aria-hidden="true">{cur.title}</i>)}
              </h2>
              <span style={{ fontSize: 13 }}>{cur.artist} · {cur.album}</span>
              <div className="prog"><i style={{ width: `${player.pct}%`, animation: 'none' }} /></div>
              <div style={{ display: 'flex', flexWrap: 'nowrap', gap: 16 }}>
                <button type="button" className="jag btn" onClick={player.prev}>Prev</button>
                <button type="button" className="jag btn on" onClick={player.toggle}>{playing ? 'Pause' : 'Play'}</button>
                <button type="button" className="jag btn" onClick={player.next}>Next</button>
                <Volume player={player} />
              </div>
            </div>
            <div style={{ display: 'flex', gap: 6, alignItems: 'flex-end', height: 56, flex: 'none' }} aria-hidden="true">
              {['-.1s', '-.35s', '-.2s', '-.45s', '-.05s'].map((d) => <i key={d} className="eqb" style={{ animationDelay: d }} />)}
            </div>
          </div>

          <div style={{ flex: '1 1 300px', display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14, padding: '4px 14px 4px 4px' }}>
              {SONGS.map((s, i) => (
                <button key={s.title} type="button" className={i === song ? 'jag trk on' : 'jag trk'} onClick={() => player.pick(i)}>
                  <span className="num">{i + 1}</span>
                  <span style={{ flex: 1, fontSize: 14 }}>{s.title}</span>
                  <span className="tag">{s.artist}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function Hero({ me, acc }) {
  const [first, ...rest] = me.displayName.split(' ')
  return (
    <div id="top" style={{ maxWidth: 1160, margin: '0 auto', padding: '36px 16px 0', position: 'relative', zIndex: 1 }}>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 36, alignItems: 'stretch' }}>
        <div style={{ flex: '1 1 480px', minWidth: 0, display: 'flex', flexDirection: 'column', gap: 26 }}>
          <div className="slam" style={{ display: 'flex', flexWrap: 'wrap', gap: 34, alignItems: 'center', '--d': '100ms' }}>
            <div style={{ position: 'relative', width: 190, height: 190, margin: '20px 30px 20px 20px' }}>
              <div className="burst" aria-hidden="true" style={{ position: 'absolute', inset: -44, background: 'var(--burst-k) 0 0/100% 100% no-repeat' }} />
              <div className="burst" aria-hidden="true" style={{ position: 'absolute', inset: -30, background: 'var(--burst-b) 0 0/100% 100% no-repeat', animationDirection: 'reverse' }} />
              <img className="pfp" src="/pfp.jpg" alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', border: `4px solid ${INK}` }} />
              <div aria-hidden="true" style={{ position: 'absolute', top: -16, left: 50, width: 84, height: 26, background: 'rgba(242,240,230,.85)', transform: 'rotate(-6deg)', zIndex: 5 }} />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, flex: '1 1 260px', minWidth: 0 }}>
              <h1 className="hd fx" style={{ fontSize: 'clamp(52px,9vw,92px)', lineHeight: 0.95, color: '#fff', textShadow: `5px 5px 0 ${INK}`, alignSelf: 'flex-start', '--o': 4 }}>
                <span className="wob">{first}{rest.length > 0 && <><br />{rest.join(' ')}</>}</span>
                <i className="fl f1" /><i className="fl f2" /><i className="fl f3" /><i className="fl f4" /><i className="fl f5" />
              </h1>
              <p className="mk" style={{ fontSize: 22, transform: 'rotate(-2deg)', background: INK, color: BONE, padding: '4px 12px', alignSelf: 'flex-start' }}>[tagline goes here]</p>
            </div>
          </div>

          <div className="box pb slam" style={{ padding: 22, display: 'flex', flexDirection: 'column', gap: 12, '--d': '220ms' }}>
            {BIO.map((t) => <p key={t} style={{ fontSize: 14, lineHeight: 1.6 }}>{t}</p>)}
            <a href={BIO_LINK} target="_blank" rel="noreferrer" style={{ fontSize: 13, alignSelf: 'flex-start', textDecoration: 'underline' }}>{BIO_LINK}</a>
          </div>

        </div>

        {/* discord */}
        <div className="slam" style={{ flex: '0 1 380px', minWidth: 260, width: '100%', display: 'flex', '--d': '300ms' }}>
          <div className="bk" style={{ boxShadow: '8px 8px 0 var(--acc)', flex: 1, display: 'flex', flexDirection: 'column' }}>
            <div className="rd" style={{ height: 100, padding: 10, position: 'relative', overflow: 'hidden', borderBottom: `3px solid ${BONE}` }}>
              <div className="halftone" aria-hidden="true" style={{ position: 'absolute', inset: 0, opacity: 0.9, background: `radial-gradient(circle,${INK} 26%,transparent 28%) 0 0/12px 12px` }} />
            </div>
            <div style={{ padding: '0 20px 20px', display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: 12, marginTop: -36, position: 'relative' }}>
                <div style={{ position: 'relative', width: 78, height: 78 }}>
                  <img src={me.avatarUrl} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', border: `4px solid ${INK}`, borderRadius: '50%', background: BONE }} />
                  <div className="dot" style={{ position: 'absolute', right: -4, bottom: -4, background: me.status.color }} />
                </div>
              </div>
              <div>
                <h3 className="hd" style={{ fontSize: 26 }}>{me.displayName}</h3>
                <p style={{ fontSize: 12, opacity: 0.85, marginTop: 2 }}>{me.userTag}</p>
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                <span className="tag">{me.status.label}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="box bk slam" style={{ marginTop: 36, padding: 22, display: 'flex', flexDirection: 'column', gap: 6, '--d': '280ms' }}>
        <h3 className="hd" style={{ fontSize: 26, marginBottom: 6 }}>Do Not Interact</h3>
        {DNI.map((t) => (
          <div key={t} style={{ fontSize: 13, lineHeight: 1.5, padding: '7px 0', borderBottom: '2px dashed rgba(242,240,230,.35)' }}>{t}</div>
        ))}
      </div>
    </div>
  )
}
