import { useEffect, useRef, useState } from 'react'
import Banner from './components/Banner.jsx'
import { getPaletteFromUrl } from './lib/okolors.js'

const DISCORD_ID = '1164594827883728987'

const GAMES = [
  { label: 'Minecraft', img: '/games/minecraft.jpg', link: 'https://www.minecraft.net/' },
  { label: 'Geometry Dash', img: '/games/geometry-dash.jpg', link: 'https://www.robtopgames.com/' },
  { label: 'Rocket League', img: '/games/rocket-league.jpg', link: 'https://www.rocketleague.com/' },
  { label: 'osu!', img: '/games/osu.png', fit: 'contain', bg: '#ff77a9', link: 'https://osu.ppy.sh/' },
]

// Projects shown in the Projects tab — a single row of two cards.
const PROJECTS = [
  {
    id: 'src',
    title: 'this site',
    desc: 'The source behind this very page — a Vite + React single-page portfolio with a live Discord status, Spotify players and dynamic palette. Click through to read the code on Codeberg.',
    link: 'https://codeberg.org/ethebee3/portfolio',
  },
  {
    id: 'blanket',
    title: 'blanket',
    desc: 'coming soon',
  },
]

// Real Spotify tracks — rendered as official embed players (30s preview for
// anyone, full track for logged-in Spotify listeners). Cover art comes from
// the embed, so no placeholder art is needed.
const TRACKS = [
  { id: '4rASiafr0DhS5Il3BPC49l', title: 'ungrateful', artist: 'gryp' },
  { id: '0l3kMJXLcw4yaSOIU39Sq6', title: 'stairs', artist: 'design19' },
  { id: '3Fwe3XoPOiyWUPYdBKMTqV', title: 'around the fur', artist: 'deftones' },
]

const LANGS = [
  { key: 'html', label: 'HTML', link: 'https://developer.mozilla.org/en-US/docs/Web/HTML' },
  { key: 'css', label: 'CSS', link: 'https://developer.mozilla.org/en-US/docs/Web/CSS' },
  { key: 'js', label: 'JavaScript', link: 'https://developer.mozilla.org/en-US/docs/Web/JavaScript' },
  { key: 'react', label: 'React', link: 'https://react.dev/' },
  { key: 'cpp', label: 'C++', link: 'https://isocpp.org/' },
  { key: 'java', label: 'Java', link: 'https://www.java.com/' },
  { key: 'python', label: 'Python', link: 'https://www.python.org/' },
  { key: 'git', label: 'Git', link: 'https://git-scm.com/' },
  { key: 'github', label: 'GitHub', link: 'https://github.com/' },
  { key: 'mysql', label: 'MySQL', link: 'https://www.mysql.com/' },
]

// ── color helpers ──────────────────────────────────────────────────────────
function hslStr(h, s, l) {
  return `hsl(${h.toFixed(0)} ${s.toFixed(0)}% ${l}%)`
}

function hslToHex(h, s, l) {
  h = ((h % 360) + 360) % 360
  s /= 100; l /= 100
  const a = s * Math.min(l, 1 - l)
  const f = (n) => {
    const k = (n + h / 30) % 12
    const c = l - a * Math.max(-1, Math.min(k - 3, 9 - k, 1))
    return Math.round(255 * c).toString(16).padStart(2, '0')
  }
  return `#${f(0)}${f(8)}${f(4)}`
}

// Build [primary, secondary, tertiary, dark] for the banner. Prefer the
// avatar's *actual* dominant colours from Okolors so multi-colour effects look
// like the pfp; fall back to hue-derived shades when only one colour is found.
function bannerColorsFrom(res, s) {
  const S = Math.round(Math.min(0.92, Math.max(0.5, s)) * 100)
  const cols = (res.colors || []).filter(Boolean)
  const c1 = cols[0] || hslToHex(res.h, S, 62)
  const c2 = cols[1] || hslToHex(res.h + 28, S, 56)
  const c3 = cols[2] || hslToHex(res.h + 335, S, 50)
  return [c1, c2, c3, hslToHex(res.h, S, 15)]
}
const DEFAULT_BANNER_COLORS = ['#5865f2', '#7d5bf2', '#4e54e0', '#161a2e']
const MONO_BANNER_COLORS = [hslToHex(225, 12, 78), hslToHex(225, 10, 56), hslToHex(225, 10, 40), hslToHex(225, 10, 13)]

export default function App() {
  const rootRef = useRef(null)
  const rafRef = useRef(null)

  const [state, setState] = useState({
    avatarUrl: 'https://cdn.discordapp.com/embed/avatars/0.png',
    displayName: 'username',
    userTag: '@username',
    statusText: 'Connecting…',
    statusColor: '#747f8d',
    activeTab: 'about',
    decorationUrl: '',
    hasDecoration: false,
  })

  // Colours handed to the banner effect. `ready` gates the effect so it mounts
  // once with the correct (avatar-matched) colours instead of flashing defaults.
  const [banner, setBanner] = useState({ ready: false, colors: DEFAULT_BANNER_COLORS })
  const revealBanner = (colors, force) =>
    setBanner((b) => (force || !b.ready ? { ready: true, colors } : b))

  // ── palette / status application on the root element ─────────────────────
  const applyStatus = (color) => {
    if (rootRef.current) rootRef.current.style.setProperty('--status', color)
  }

  const applyPalette = (h, s) => {
    const root = rootRef.current
    if (!root) return
    const set = (k, v) => root.style.setProperty(k, v)
    const sp = (s * 100).toFixed(0)
    set('--accent', hslStr(h, +sp, 62))
    set('--accent2', hslStr((h + 28) % 360, +sp, 56))
    set('--bg', hslStr(h, 22, 4.5))
    set('--card', hslStr(h, 18, 8))
    set('--card2', hslStr(h, 16, 12.5))
    set('--card3', hslStr(h, 15, 17))
    set('--border', `hsla(${h.toFixed(0)},25%,82%,0.09)`)
  }

  const applyMono = () => {
    const root = rootRef.current
    if (!root) return
    const set = (k, v) => root.style.setProperty(k, v)
    const H = 225 // cool neutral hue for barely-there tint
    set('--accent', hslStr(H, 8, 84))
    set('--accent2', hslStr(H, 10, 60))
    set('--bg', hslStr(H, 8, 4.5))
    set('--card', hslStr(H, 7, 8))
    set('--card2', hslStr(H, 7, 12.5))
    set('--card3', hslStr(H, 7, 17))
    set('--border', `hsla(${H},12%,85%,0.09)`)
  }

  // Palette generation via Okolors' approach (Oklab k-means), see lib/okolors.js.
  // Results are cached per-URL in localStorage, so this is instant on revisit.
  const extractPalette = (url) => {
    getPaletteFromUrl(url).then((res) => {
      if (!res) { revealBanner(DEFAULT_BANNER_COLORS, false); return } // load/CORS failure
      if (res.mono) { applyMono(); revealBanner(MONO_BANNER_COLORS, true); return } // greyscale
      const sat = Math.min(0.9, Math.max(0.55, res.s))
      applyPalette(res.h, sat)
      revealBanner(bannerColorsFrom(res, sat), true)
    })
  }

  // ── lanyard fetch ────────────────────────────────────────────────────────
  const fetchLanyard = async () => {
    try {
      const res = await fetch(`https://api.lanyard.rest/v1/users/${DISCORD_ID}`)
      const json = await res.json()
      if (!json.success) throw new Error('lanyard failed')
      const d = json.data
      const u = d.discord_user
      const name = u.global_name || u.username || 'user'
      const avatar = u.avatar
        ? `https://cdn.discordapp.com/avatars/${u.id}/${u.avatar}.${u.avatar.startsWith('a_') ? 'gif' : 'png'}?size=256`
        : `https://cdn.discordapp.com/embed/avatars/${(Number(u.discriminator) || 0) % 5}.png`
      const statusMap = {
        online: ['#43b581', 'Online'],
        idle: ['#faa61a', 'Idle'],
        dnd: ['#f04747', 'Do Not Disturb'],
        offline: ['#747f8d', 'Offline'],
      }
      const st = statusMap[d.discord_status] || statusMap.offline
      const deco = u.avatar_decoration_data
      setState((prev) => ({
        ...prev,
        avatarUrl: avatar,
        displayName: name,
        userTag: '@' + (u.username || name),
        statusText: st[1],
        statusColor: st[0],
        hasDecoration: !!(deco && deco.asset),
        decorationUrl: deco && deco.asset
          ? `https://cdn.discordapp.com/avatar-decoration-presets/${deco.asset}.png?size=160&passthrough=true`
          : '',
      }))
      applyStatus(st[0])
      extractPalette(avatar)
    } catch (e) {
      setState((prev) => ({ ...prev, statusText: 'Offline', statusColor: '#747f8d' }))
      applyStatus('#747f8d')
      revealBanner(DEFAULT_BANNER_COLORS, false)
    }
  }

  // ── marquees ─────────────────────────────────────────────────────────────
  const startMarquees = () => {
    const reg = new WeakSet()
    const tracks = []
    const scan = () => {
      document.querySelectorAll('.om-marquee').forEach((el) => {
        if (reg.has(el)) return
        reg.add(el)
        const full = parseFloat(el.dataset.speed) || 36
        const dir = parseFloat(el.dataset.dir) || -1
        const st = { el, full, dir, speed: full, target: full, offset: 0, half: 0 }
        el.addEventListener('mouseenter', () => { st.target = 0 })
        el.addEventListener('mouseleave', () => { st.target = st.full })
        tracks.push(st)
      })
    }
    let last = performance.now(), acc = 0
    const tick = (now) => {
      const dt = Math.min(0.05, (now - last) / 1000); last = now
      acc += dt
      if (acc > 0.4) { acc = 0; scan() }
      for (let i = tracks.length - 1; i >= 0; i--) {
        const st = tracks[i]
        if (!st.el.isConnected) { tracks.splice(i, 1); continue }
        if (!st.half) { st.half = st.el.scrollWidth / 2; if (!st.half) continue }
        st.speed += (st.target - st.speed) * Math.min(1, dt * 6) // smooth slow-to-stop
        st.offset += st.dir * st.speed * dt
        if (st.offset <= -st.half) st.offset += st.half
        else if (st.offset >= 0) st.offset -= st.half
        st.el.style.transform = 'translateX(' + st.offset.toFixed(2) + 'px)'
      }
      rafRef.current = requestAnimationFrame(tick)
    }
    scan()
    rafRef.current = requestAnimationFrame(tick)
  }

  useEffect(() => {
    fetchLanyard()
    startMarquees()
    // Fallback: if the avatar never resolves, show the effect with defaults.
    const t = setTimeout(() => revealBanner(DEFAULT_BANNER_COLORS, false), 1200)
    return () => { clearTimeout(t); if (rafRef.current) cancelAnimationFrame(rafRef.current) }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // apply initial status color once the root is available
  useEffect(() => {
    applyStatus(state.statusColor)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // ── derived render values ────────────────────────────────────────────────
  const active = state.activeTab
  const langs = LANGS.map((l) => ({ ...l, url: `https://skillicons.dev/icons?i=${l.key}` }))
  const langsLoop = [...langs, ...langs]
  const gamesLoop = [...GAMES, ...GAMES]

  const tabBtn = (on) => ({
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontFamily: 'inherit',
    cursor: 'pointer',
    padding: '11px 6px',
    borderRadius: '10px',
    border: '1px solid ' + (on ? 'transparent' : 'var(--border)'),
    background: on ? 'var(--accent)' : 'transparent',
    color: on ? '#0b0d10' : 'var(--muted)',
    transition: 'all .18s ease',
  })

  const setTab = (tab) => setState((prev) => ({ ...prev, activeTab: tab }))

  return (
    <div
      ref={rootRef}
      style={{
        '--bg': '#08090c',
        '--card': '#0f1116',
        '--card2': '#161922',
        '--card3': '#1c202b',
        '--accent': '#5865f2',
        '--accent2': '#7d5bf2',
        '--text': '#f4f5f7',
        '--muted': '#8a92a1',
        '--border': 'rgba(255,255,255,.06)',
        '--status': '#43b581',
        minHeight: '100vh',
        width: '100%',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'flex-start',
        padding: '48px 20px 80px',
        background: 'radial-gradient(1200px 600px at 50% -10%, color-mix(in srgb, var(--accent) 12%, transparent), transparent 70%), var(--bg)',
        color: 'var(--text)',
      }}
    >
      <div style={{ width: '100%', maxWidth: '500px', display: 'flex', flexDirection: 'column', gap: '18px' }}>

        {/* ===== PROFILE CARD ===== */}
        <div style={{ animation: 'fadeUp .6s ease both', background: 'var(--card)', border: '1px solid var(--border)', borderRadius: '20px', overflow: 'hidden', boxShadow: '0 24px 60px -20px rgba(0,0,0,.7)' }}>
          <div style={{ height: '130px', background: 'linear-gradient(120deg, var(--accent), var(--accent2))', position: 'relative', overflow: 'hidden' }}>
            <Banner ready={banner.ready} colors={banner.colors} />
            <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', background: 'radial-gradient(400px 200px at 80% 120%, rgba(255,255,255,.18), transparent 60%)' }} />
            <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', background: 'linear-gradient(180deg, transparent 55%, rgba(0,0,0,.28))' }} />
          </div>
          <div style={{ padding: '0 22px 22px', position: 'relative' }}>
            <div style={{ position: 'absolute', top: '-46px', left: '22px' }}>
              <div style={{ position: 'relative', width: '92px', height: '92px' }}>
                <div style={{ width: '92px', height: '92px', borderRadius: '50%', border: '6px solid var(--card)', overflow: 'hidden', background: 'var(--card2)' }}>
                  <img src={state.avatarUrl} alt="avatar" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                </div>
                {state.hasDecoration && (
                  <img src={state.decorationUrl} alt="decoration" style={{ position: 'absolute', top: '50%', left: '50%', width: '124%', height: '124%', transform: 'translate(-50%,-50%)', pointerEvents: 'none' }} />
                )}
                <span style={{ position: 'absolute', right: '2px', bottom: '8px', width: '20px', height: '20px', borderRadius: '50%', border: '4px solid var(--card)', background: 'var(--status)', animation: 'pulse 2.4s infinite', zIndex: 2 }} />
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: '14px', gap: '8px' }}>
              <a href="#" title="GitHub" className="om-social" style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'var(--card2)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all .2s ease' }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M12 .5C5.37.5 0 5.87 0 12.5c0 5.3 3.44 9.8 8.21 11.39.6.11.82-.26.82-.58v-2.03c-3.34.73-4.04-1.6-4.04-1.6-.55-1.39-1.34-1.76-1.34-1.76-1.09-.75.08-.73.08-.73 1.2.09 1.84 1.24 1.84 1.24 1.07 1.84 2.81 1.31 3.5 1 .11-.78.42-1.31.76-1.61-2.67-.3-5.47-1.34-5.47-5.95 0-1.31.47-2.39 1.24-3.23-.13-.3-.54-1.52.11-3.18 0 0 1.01-.32 3.3 1.23a11.5 11.5 0 0 1 6 0c2.29-1.55 3.3-1.23 3.3-1.23.65 1.66.24 2.88.12 3.18.77.84 1.23 1.92 1.23 3.23 0 4.62-2.81 5.64-5.49 5.94.43.37.82 1.1.82 2.22v3.29c0 .32.22.7.83.58A12.01 12.01 0 0 0 24 12.5C24 5.87 18.63.5 12 .5Z" /></svg>
              </a>
              <a href="https://codeberg.org/ethebee3" target="_blank" rel="noopener noreferrer" title="Codeberg" className="om-social" style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'var(--card2)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all .2s ease' }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M11.999.747A11.974 11.974 0 0 0 0 12.75c0 2.254.635 4.465 1.833 6.376L11.837 6.19c.072-.092.251-.092.323 0l4.178 5.402h-2.992l.065.239h3.113l.882 1.138h-3.674l.103.374h3.86l.777 1.003h-4.358l.135.483h4.593l.695.894h-5.038l.165.589h5.326l.609.785h-5.717l.182.65h6.038l.562.727h-6.397l.183.65h6.717A12.003 12.003 0 0 0 24 12.75 11.977 11.977 0 0 0 11.999.747zm3.654 19.104.182.65h5.326c.173-.204.353-.433.513-.65zm.385 1.377.18.65h3.563c.233-.198.485-.428.712-.65zm.383 1.377.182.648h1.203c.356-.204.685-.412 1.042-.648z" /></svg>
              </a>
              <a href="#" title="Email" className="om-social" style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'var(--card2)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all .2s ease' }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="4" width="20" height="16" rx="2" /><path d="m22 7-10 6L2 7" /></svg>
              </a>
            </div>

            <div style={{ marginTop: '4px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                <h1 style={{ margin: 0, fontSize: '26px', fontWeight: 800, letterSpacing: '-.5px' }}>{state.displayName}</h1>
                <span style={{ fontSize: '12px', color: 'var(--muted)', background: 'var(--card2)', border: '1px solid var(--border)', padding: '3px 9px', borderRadius: '20px' }}>{state.userTag}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '7px', marginTop: '6px', fontSize: '13px', color: 'var(--muted)' }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--status)', display: 'inline-block' }} />
                {state.statusText}
              </div>
            </div>
          </div>
        </div>

        {/* ===== TAB BAR ===== */}
        <div style={{ animation: 'fadeUp .6s ease .06s both', display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '6px', background: 'var(--card)', border: '1px solid var(--border)', borderRadius: '14px', padding: '6px' }}>
          <button onClick={() => setTab('about')} title="About" style={tabBtn(active === 'about')}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="8" r="4" /><path d="M4 21v-1a6 6 0 0 1 6-6h4a6 6 0 0 1 6 6v1" /></svg>
          </button>
          <button onClick={() => setTab('skills')} title="Skills" style={tabBtn(active === 'skills')}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="8 6 3 12 8 18" /><polyline points="16 6 21 12 16 18" /></svg>
          </button>
          <button onClick={() => setTab('music')} title="Music" style={tabBtn(active === 'music')}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18V5l12-2v13" /><circle cx="6" cy="18" r="3" /><circle cx="18" cy="16" r="3" /></svg>
          </button>
          <button onClick={() => setTab('projects')} title="Projects" style={tabBtn(active === 'projects')}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" /></svg>
          </button>
        </div>

        {/* ===== ABOUT ===== */}
        {active === 'about' && (
          <div style={{ animation: 'fadeUp .45s ease both', background: 'var(--card)', border: '1px solid var(--border)', borderRadius: '16px', padding: '22px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '9px', marginBottom: '14px' }}>
              <span style={{ color: 'var(--accent)', fontSize: '15px' }}>✦</span>
              <h2 style={{ margin: 0, fontSize: '12px', fontWeight: 700, letterSpacing: '2px', textTransform: 'uppercase', color: 'var(--muted)' }}>About Me</h2>
            </div>
            <div style={{ textAlign: 'center', color: 'var(--accent)', opacity: 0.55, fontSize: '12px', letterSpacing: '3px', marginBottom: '16px' }}>*.·:·.☽✧ ✦ ✧☾.·:·.*</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', textAlign: 'center' }}>
              {[
                'I take commissions for minecraft mods, plugins, and websites. I also sometimes make mods and plugins for free.',
                "Kindness toward all kinds of people is the goal — it isn't my place to punish others for their wrongdoings.",
                "People are hypocrites, knowingly or not, but it takes courage to admit when you've been one and to make up for it.",
              ].map((line, i) => (
                <p key={i} style={{ margin: 0, fontSize: '14px', lineHeight: 1.7, color: 'var(--text)', textWrap: 'pretty' }}>{line}</p>
              ))}
            </div>
            <div style={{ textAlign: 'center', marginTop: '18px' }}>
              <a href="https://nohello.net/" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--accent)', fontSize: '13px', borderBottom: '1px solid color-mix(in srgb, var(--accent) 40%, transparent)', paddingBottom: '1px' }}>https://nohello.net/</a>
            </div>
            <div style={{ textAlign: 'center', color: 'var(--accent)', opacity: 0.55, fontSize: '12px', letterSpacing: '3px', marginTop: '16px' }}>*.·:·.☽✧ ✦ ✧☾.·:·.*</div>
          </div>
        )}

        {/* ===== SKILLS + CAROUSEL ===== */}
        {active === 'skills' && (
          <div style={{ animation: 'fadeUp .45s ease both', background: 'var(--card)', border: '1px solid var(--border)', borderRadius: '16px', padding: '20px 0 22px', overflow: 'hidden' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '9px', marginBottom: '16px', padding: '0 22px' }}>
              <span style={{ color: 'var(--accent)', fontSize: '15px' }}>⌘</span>
              <h2 style={{ margin: 0, fontSize: '12px', fontWeight: 700, letterSpacing: '2px', textTransform: 'uppercase', color: 'var(--muted)' }}>Interests &amp; Skills</h2>
            </div>
            <div style={{ padding: '0 22px 18px', display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {['Web Development', 'UI / UX', 'Open Source', 'Game Dev'].map((t) => (
                <span key={t} style={{ fontSize: '12px', padding: '5px 12px', borderRadius: '20px', background: 'var(--card2)', border: '1px solid var(--border)', color: 'var(--text)' }}>{t}</span>
              ))}
            </div>
            <div style={{ position: 'relative', padding: '12px 0', WebkitMaskImage: 'linear-gradient(90deg,transparent,#000 12%,#000 88%,transparent)', maskImage: 'linear-gradient(90deg,transparent,#000 12%,#000 88%,transparent)' }}>
              <div className="om-marquee om-lang" data-dir="-1" data-speed="38" style={{ display: 'flex', gap: '14px', width: 'max-content', willChange: 'transform' }}>
                {langsLoop.map((lang, i) => (
                  <a key={i} href={lang.link} target="_blank" rel="noopener noreferrer" title={lang.label} className="om-lang-tile" style={{ width: '56px', height: '56px', borderRadius: '14px', background: 'var(--card2)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, transition: 'transform .25s ease' }}>
                    <img src={lang.url} alt={lang.label} width="34" height="34" style={{ display: 'block' }} />
                  </a>
                ))}
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '9px', margin: '22px 22px 14px' }}>
              <span style={{ color: 'var(--accent)', display: 'flex', alignItems: 'center' }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="6" x2="10" y1="12" y2="12" /><line x1="8" x2="8" y1="10" y2="14" /><line x1="15" x2="15.01" y1="13" y2="13" /><line x1="18" x2="18.01" y1="11" y2="11" /><path d="M17.32 5H6.68a4 4 0 0 0-3.978 3.59c-.006.052-.01.101-.017.152C2.604 9.416 2 14.456 2 16a3 3 0 0 0 3 3c1 0 1.5-.5 2-1l1.414-1.414A2 2 0 0 1 9.828 16h4.344a2 2 0 0 1 1.414.586L17 18c.5.5 1 1 2 1a3 3 0 0 0 3-3c0-1.544-.604-6.584-.685-7.258-.007-.05-.011-.1-.017-.151A4 4 0 0 0 17.32 5z" /></svg>
              </span>
              <h2 style={{ margin: 0, fontSize: '12px', fontWeight: 700, letterSpacing: '2px', textTransform: 'uppercase', color: 'var(--muted)' }}>Games In Rotation</h2>
            </div>
            <div style={{ position: 'relative', padding: '12px 0', WebkitMaskImage: 'linear-gradient(90deg,transparent,#000 12%,#000 88%,transparent)', maskImage: 'linear-gradient(90deg,transparent,#000 12%,#000 88%,transparent)' }}>
              <div className="om-marquee om-games" data-dir="1" data-speed="34" style={{ display: 'flex', gap: '14px', width: 'max-content', willChange: 'transform' }}>
                {gamesLoop.map((game, i) => (
                  <a key={i} href={game.link} target="_blank" rel="noopener noreferrer" title={game.label} className="om-game-card" style={{ width: '118px', flexShrink: 0, borderRadius: '14px', overflow: 'hidden', background: 'var(--card2)', border: '1px solid var(--border)', transition: 'transform .25s ease' }}>
                    <div style={{ aspectRatio: '3 / 4', background: game.bg || 'var(--card3)', overflow: 'hidden', padding: game.fit === 'contain' ? '16px' : 0 }}>
                      <img src={game.img} alt={game.label} loading="lazy" draggable="false" style={{ width: '100%', height: '100%', objectFit: game.fit || 'cover', display: 'block', userSelect: 'none' }} />
                    </div>
                    <div style={{ padding: '8px 11px', fontSize: '11.5px', fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{game.label}</div>
                  </a>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ===== MUSIC ===== */}
        {active === 'music' && (
          <div style={{ animation: 'fadeUp .45s ease both', background: 'var(--card)', border: '1px solid var(--border)', borderRadius: '16px', padding: '20px 22px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '9px', marginBottom: '16px' }}>
              <span style={{ color: 'var(--accent)', fontSize: '15px' }}>♫</span>
              <h2 style={{ margin: 0, fontSize: '12px', fontWeight: 700, letterSpacing: '2px', textTransform: 'uppercase', color: 'var(--muted)' }}>Music Taste</h2>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {TRACKS.map((t) => (
                <iframe
                  key={t.id}
                  title={`${t.title} — ${t.artist}`}
                  src={`https://open.spotify.com/embed/track/${t.id}?utm_source=generator&theme=0`}
                  width="100%"
                  height="80"
                  loading="lazy"
                  frameBorder="0"
                  allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                  style={{ borderRadius: '12px', border: 'none', display: 'block', colorScheme: 'normal' }}
                />
              ))}
            </div>
            <div style={{ fontSize: '11px', color: 'var(--muted)', marginTop: '12px', opacity: 0.7, lineHeight: 1.5 }}>
              Hit play to preview each track. Log in to Spotify in your browser to hear the full song.
            </div>
          </div>
        )}

        {/* ===== PROJECTS ===== */}
        {active === 'projects' && (
          <div style={{ animation: 'fadeUp .45s ease both', background: 'var(--card)', border: '1px solid var(--border)', borderRadius: '16px', padding: '20px 22px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '9px', marginBottom: '16px' }}>
              <span style={{ color: 'var(--accent)', fontSize: '15px' }}>▶</span>
              <h2 style={{ margin: 0, fontSize: '12px', fontWeight: 700, letterSpacing: '2px', textTransform: 'uppercase', color: 'var(--muted)' }}>Current Projects</h2>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              {PROJECTS.map((p) => {
                const cardStyle = { display: 'flex', flexDirection: 'column', minHeight: '150px', background: 'var(--card2)', border: '1px solid var(--border)', borderRadius: '12px', padding: '16px', transition: 'transform .2s ease,border-color .2s ease' }
                const body = (
                  <>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
                      <div style={{ fontSize: '15px', fontWeight: 700 }}>{p.title}</div>
                      {p.link && (
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--muted)', flexShrink: 0 }}><path d="M7 17 17 7" /><path d="M7 7h10v10" /></svg>
                      )}
                    </div>
                    <div style={{ fontSize: '12px', color: 'var(--muted)', marginTop: '9px', lineHeight: 1.6, textWrap: 'pretty', flexGrow: 1 }}>{p.desc}</div>
                  </>
                )
                return p.link ? (
                  <a key={p.id} href={p.link} target="_blank" rel="noopener noreferrer" className="om-project-card" style={cardStyle}>{body}</a>
                ) : (
                  <div key={p.id} style={{ ...cardStyle, opacity: 0.72 }}>{body}</div>
                )
              })}
            </div>
          </div>
        )}

        <div style={{ textAlign: 'center', fontSize: '11px', color: 'var(--muted)', opacity: 0.6, paddingTop: '4px' }}>palette pulled live from your discord avatar via lanyard</div>

      </div>
    </div>
  )
}
