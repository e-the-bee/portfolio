import { useEffect, useRef, useState } from 'react'
import Banner from './components/Banner.jsx'
import Icon from './components/Icon.jsx'
import { getPaletteFromUrl } from './lib/okolors.js'
import config from './site.config.json'

// All content and tunables (profile, socials, theme, banner effects, tabs and
// their sections, footer) live in src/site.config.json — edit that, not this.
// Add a new tab by appending to `tabs` with one of the types below.

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
const DEFAULT_BANNER_COLORS = config.banner.defaultColors
const MONO_BANNER_COLORS = [hslToHex(225, 12, 78), hslToHex(225, 10, 56), hslToHex(225, 10, 40), hslToHex(225, 10, 13)]

// CSS custom properties for the root element, from the theme config.
const THEME_VARS = Object.fromEntries(
  Object.entries(config.theme).map(([key, value]) => ['--' + key, value])
)

// ── shared section building blocks ─────────────────────────────────────────
const cardStyle = {
  animation: 'fadeUp .45s ease both',
  background: 'var(--card)',
  border: '1px solid var(--border)',
  borderRadius: '16px',
}

const headingStyle = {
  margin: 0,
  fontSize: '12px',
  fontWeight: 700,
  letterSpacing: '2px',
  textTransform: 'uppercase',
  color: 'var(--muted)',
}

const marqueeMask = {
  position: 'relative',
  padding: '12px 0',
  WebkitMaskImage: 'linear-gradient(90deg,transparent,#000 12%,#000 88%,transparent)',
  maskImage: 'linear-gradient(90deg,transparent,#000 12%,#000 88%,transparent)',
}

// Section heading with either a text glyph or an SVG icon from assets.
function SectionHeading({ glyph, icon, children, style }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '9px', ...style }}>
      {icon
        ? <span style={{ color: 'var(--accent)', display: 'flex', alignItems: 'center' }}><Icon name={icon} size={16} /></span>
        : <span style={{ color: 'var(--accent)', fontSize: '15px' }}>{glyph}</span>}
      <h2 style={headingStyle}>{children}</h2>
    </div>
  )
}

function ExternalLink({ href, title, className, style, children }) {
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" title={title} className={className} style={style}>
      {children}
    </a>
  )
}

// ── tab section renderers, one per `type` in site.config.json ──────────────

function TextSection({ tab }) {
  return (
    <div style={{ ...cardStyle, padding: '22px' }}>
      <SectionHeading glyph={tab.glyph} icon={tab.headingIcon} style={{ marginBottom: '14px' }}>{tab.heading}</SectionHeading>
      {tab.flourish && (
        <div style={{ textAlign: 'center', color: 'var(--accent)', opacity: 0.55, fontSize: '12px', letterSpacing: '3px', marginBottom: '16px' }}>{tab.flourish}</div>
      )}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', textAlign: 'center' }}>
        {(tab.paragraphs || []).map((line, i) => (
          <p key={i} style={{ margin: 0, fontSize: '14px', lineHeight: 1.7, color: 'var(--text)', textWrap: 'pretty' }}>{line}</p>
        ))}
      </div>
      {(tab.links || []).map((l) => (
        <div key={l.url} style={{ textAlign: 'center', marginTop: '18px' }}>
          <ExternalLink href={l.url} style={{ color: 'var(--accent)', fontSize: '13px', borderBottom: '1px solid color-mix(in srgb, var(--accent) 40%, transparent)', paddingBottom: '1px' }}>
            {l.label}
          </ExternalLink>
        </div>
      ))}
      {tab.flourish && (
        <div style={{ textAlign: 'center', color: 'var(--accent)', opacity: 0.55, fontSize: '12px', letterSpacing: '3px', marginTop: '16px' }}>{tab.flourish}</div>
      )}
    </div>
  )
}

function Marquee({ settings = {}, children }) {
  return (
    <div style={marqueeMask}>
      <div
        className="om-marquee"
        data-dir={settings.direction ?? -1}
        data-speed={settings.speed ?? 36}
        style={{ display: 'flex', gap: '14px', width: 'max-content', willChange: 'transform' }}
      >
        {children}
      </div>
    </div>
  )
}

function SkillsSection({ tab }) {
  const langs = (tab.languages?.items || []).map((l) => ({ ...l, url: `https://skillicons.dev/icons?i=${l.key}` }))
  const langsLoop = [...langs, ...langs]
  const games = tab.games?.items || []
  const gamesLoop = [...games, ...games]
  return (
    <div style={{ ...cardStyle, padding: '20px 0 22px', overflow: 'hidden' }}>
      <SectionHeading glyph={tab.glyph} icon={tab.headingIcon} style={{ marginBottom: '16px', padding: '0 22px' }}>{tab.heading}</SectionHeading>
      <div style={{ padding: '0 22px 18px', display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
        {(tab.interests || []).map((t) => (
          <span key={t} style={{ fontSize: '12px', padding: '5px 12px', borderRadius: '20px', background: 'var(--card2)', border: '1px solid var(--border)', color: 'var(--text)' }}>{t}</span>
        ))}
      </div>
      <Marquee settings={tab.languages?.marquee}>
        {langsLoop.map((lang, i) => (
          <ExternalLink key={i} href={lang.link} title={lang.label} className="om-lang-tile" style={{ width: '56px', height: '56px', borderRadius: '14px', background: 'var(--card2)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, transition: 'transform .25s ease' }}>
            <img src={lang.url} alt={lang.label} width="34" height="34" style={{ display: 'block' }} />
          </ExternalLink>
        ))}
      </Marquee>
      {games.length > 0 && (
        <>
          <SectionHeading glyph={tab.games.headingGlyph} icon={tab.games.headingIcon} style={{ margin: '22px 22px 14px' }}>{tab.games.heading}</SectionHeading>
          <Marquee settings={tab.games.marquee}>
            {gamesLoop.map((game, i) => (
              <ExternalLink key={i} href={game.link} title={game.label} className="om-game-card" style={{ width: '118px', flexShrink: 0, borderRadius: '14px', overflow: 'hidden', background: 'var(--card2)', border: '1px solid var(--border)', transition: 'transform .25s ease' }}>
                <div style={{ aspectRatio: '3 / 4', background: game.bg || 'var(--card3)', overflow: 'hidden', padding: game.fit === 'contain' ? '16px' : 0 }}>
                  <img src={game.img} alt={game.label} loading="lazy" draggable="false" style={{ width: '100%', height: '100%', objectFit: game.fit || 'cover', display: 'block', userSelect: 'none' }} />
                </div>
                <div style={{ padding: '8px 11px', fontSize: '11.5px', fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{game.label}</div>
              </ExternalLink>
            ))}
          </Marquee>
        </>
      )}
    </div>
  )
}

function MusicSection({ tab }) {
  return (
    <div style={{ ...cardStyle, padding: '20px 22px' }}>
      <SectionHeading glyph={tab.glyph} icon={tab.headingIcon} style={{ marginBottom: '16px' }}>{tab.heading}</SectionHeading>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {(tab.tracks || []).map((t) => (
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
      {tab.note && (
        <div style={{ fontSize: '11px', color: 'var(--muted)', marginTop: '12px', opacity: 0.7, lineHeight: 1.5 }}>{tab.note}</div>
      )}
    </div>
  )
}

function ProjectsSection({ tab }) {
  const columns = tab.columns || 2
  return (
    <div style={{ ...cardStyle, padding: '20px 22px' }}>
      <SectionHeading glyph={tab.glyph} icon={tab.headingIcon} style={{ marginBottom: '16px' }}>{tab.heading}</SectionHeading>
      <div style={{ display: 'grid', gridTemplateColumns: `repeat(${columns},1fr)`, gap: '12px' }}>
        {(tab.items || []).map((p) => {
          const projectCard = { display: 'flex', flexDirection: 'column', minHeight: '150px', background: 'var(--card2)', border: '1px solid var(--border)', borderRadius: '12px', padding: '16px', transition: 'transform .2s ease,border-color .2s ease' }
          const body = (
            <>
              <div style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
                <div style={{ fontSize: '15px', fontWeight: 700 }}>{p.title}</div>
                {p.link && <Icon name="external" size={13} style={{ color: 'var(--muted)' }} />}
              </div>
              <div style={{ fontSize: '12px', color: 'var(--muted)', marginTop: '9px', lineHeight: 1.6, textWrap: 'pretty', flexGrow: 1 }}>{p.desc}</div>
            </>
          )
          return p.link ? (
            <ExternalLink key={p.id} href={p.link} className="om-project-card" style={projectCard}>{body}</ExternalLink>
          ) : (
            <div key={p.id} style={{ ...projectCard, opacity: 0.72 }}>{body}</div>
          )
        })}
      </div>
    </div>
  )
}

const SECTION_TYPES = {
  text: TextSection,
  skills: SkillsSection,
  music: MusicSection,
  projects: ProjectsSection,
}

// ── app ────────────────────────────────────────────────────────────────────
export default function App() {
  const rootRef = useRef(null)
  const rafRef = useRef(null)

  const [state, setState] = useState({
    avatarUrl: config.profile.fallbackAvatar,
    displayName: config.profile.fallbackName,
    userTag: '@' + config.profile.fallbackName,
    statusText: config.status.connecting.label,
    statusColor: config.status.connecting.color,
    activeTab: config.tabs[0]?.id,
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
      const sat = Math.min(config.palette.maxSaturation, Math.max(config.palette.minSaturation, res.s))
      applyPalette(res.h, sat)
      revealBanner(bannerColorsFrom(res, sat), true)
    })
  }

  // ── lanyard fetch ────────────────────────────────────────────────────────
  const fetchLanyard = async () => {
    try {
      const res = await fetch(`https://api.lanyard.rest/v1/users/${config.profile.discordId}`)
      const json = await res.json()
      if (!json.success) throw new Error('lanyard failed')
      const d = json.data
      const u = d.discord_user
      const name = u.global_name || u.username || 'user'
      const avatar = u.avatar
        ? `https://cdn.discordapp.com/avatars/${u.id}/${u.avatar}.${u.avatar.startsWith('a_') ? 'gif' : 'png'}?size=256`
        : `https://cdn.discordapp.com/embed/avatars/${(Number(u.discriminator) || 0) % 5}.png`
      const st = config.status[d.discord_status] || config.status.offline
      const deco = u.avatar_decoration_data
      setState((prev) => ({
        ...prev,
        avatarUrl: avatar,
        displayName: name,
        userTag: '@' + (u.username || name),
        statusText: st.label,
        statusColor: st.color,
        hasDecoration: !!(deco && deco.asset),
        decorationUrl: deco && deco.asset
          ? `https://cdn.discordapp.com/avatar-decoration-presets/${deco.asset}.png?size=160&passthrough=true`
          : '',
      }))
      applyStatus(st.color)
      extractPalette(avatar)
    } catch (e) {
      setState((prev) => ({ ...prev, statusText: config.status.offline.label, statusColor: config.status.offline.color }))
      applyStatus(config.status.offline.color)
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
    const t = setTimeout(() => revealBanner(DEFAULT_BANNER_COLORS, false), config.banner.revealTimeoutMs)
    return () => { clearTimeout(t); if (rafRef.current) cancelAnimationFrame(rafRef.current) }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // ── render ───────────────────────────────────────────────────────────────
  const active = state.activeTab
  const activeTab = config.tabs.find((t) => t.id === active)
  const Section = activeTab ? SECTION_TYPES[activeTab.type] : null

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
        ...THEME_VARS,
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
            <Banner
              ready={banner.ready}
              colors={banner.colors}
              effects={config.banner.effects}
              shift={config.banner.parallaxShift}
              overscan={config.banner.overscan}
            />
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
              {config.profile.socials.map((s) => (
                <ExternalLink key={s.title} href={s.url} title={s.title} className="om-social" style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'var(--card2)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all .2s ease' }}>
                  <Icon name={s.icon} size={18} />
                </ExternalLink>
              ))}
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
        <div style={{ animation: 'fadeUp .6s ease .06s both', display: 'grid', gridTemplateColumns: `repeat(${config.tabs.length},1fr)`, gap: '6px', background: 'var(--card)', border: '1px solid var(--border)', borderRadius: '14px', padding: '6px' }}>
          {config.tabs.map((tab) => (
            <button key={tab.id} onClick={() => setTab(tab.id)} title={tab.title} style={tabBtn(active === tab.id)}>
              <Icon name={tab.icon} size={18} />
            </button>
          ))}
        </div>

        {/* ===== ACTIVE SECTION ===== */}
        {Section && <Section key={activeTab.id} tab={activeTab} />}

        {config.footer && (
          <div style={{ textAlign: 'center', fontSize: '11px', color: 'var(--muted)', opacity: 0.6, paddingTop: '4px' }}>{config.footer}</div>
        )}

      </div>
    </div>
  )
}
