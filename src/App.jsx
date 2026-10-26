import { useEffect, useState } from 'react'
import { hexToRgb01 } from './lib/color.js'
import { fetchPresence } from './lib/lanyard.js'
import { getPaletteFromUrl } from './lib/okolors.js'
import { MONO_BANNER_COLORS, bannerColors, blendDecoration } from './lib/palette.js'
import config from './site.config.json'

const INK = '#0b0b0b'
const BONE = '#f2f0e6'
const DEFAULT_ACC = '#d6232b'

const NAV = [
  { id: 'home', label: 'Home' },
  { id: 'music', label: 'Music' },
  { id: 'projects', label: 'Projects' },
  { id: 'about', label: 'About' },
  { id: 'extras', label: 'Extras' },
]

// Text colour that stays readable on the accent block.
function onAccent(hex) {
  const [r, g, b] = hexToRgb01(hex)
  return 0.2126 * r + 0.7152 * g + 0.0722 * b > 0.55 ? INK : BONE
}

// Avatar (+ optional decoration, blended at reduced strength) -> palette
// result. null when the image can't be loaded.
function resolvePalette(avatarUrl, decorationUrl) {
  const { decorationInfluence, accentShift } = config.palette
  if (!decorationUrl || decorationInfluence <= 0) {
    return getPaletteFromUrl(avatarUrl).then((res) =>
      (res && !res.mono ? blendDecoration(res, null, 0, accentShift) : res))
  }
  return Promise.all([getPaletteFromUrl(avatarUrl), getPaletteFromUrl(decorationUrl)])
    .then(([avatar, deco]) =>
      (avatar ? blendDecoration(avatar, deco, decorationInfluence, accentShift) : avatar))
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
  const [acc, setAcc] = useState(DEFAULT_ACC)
  const [me, setMe] = useState({
    avatarUrl: config.profile.fallbackAvatar,
    displayName: config.profile.fallbackName,
    userTag: '@' + config.profile.fallbackName,
    status: config.status.connecting,
  })

  useEffect(() => {
    let live = true
    ;(async () => {
      try {
        const p = await fetchPresence(config.profile.discordId)
        if (!live) return
        setMe({
          avatarUrl: p.avatarUrl,
          displayName: p.displayName,
          userTag: p.userTag,
          status: config.status[p.statusKey] || config.status.offline,
        })
        const res = await resolvePalette(p.avatarUrl, p.decorationUrl)
        if (live) setAcc(accentFrom(res))
      } catch {
        if (live) setMe((m) => ({ ...m, status: config.status.offline }))
      }
    })()
    return () => { live = false }
  }, [])

  const go = (id) => {
    if (id === page) return
    setPage(id)
    setWipeKey((k) => k + 1)
    window.scrollTo({ top: 0 })
  }

  const rootVars = { '--acc': acc, '--on': onAccent(acc), '--flick': '.36s' }

  return (
    <div className="g" style={{ ...rootVars, minHeight: '100vh', position: 'relative', overflow: 'hidden', background: INK, paddingBottom: 24 }}>
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

      {page === 'home' ? (
        <>
          <div key={wipeKey} className={wipeKey ? 'wipe' : undefined} aria-hidden="true" />
          <Hero me={me} acc={acc} />
        </>
      ) : (
        <>
          <div key={wipeKey} className="wipe" aria-hidden="true" />
          <div style={{ maxWidth: 1160, margin: '0 auto', padding: '36px 16px 0', position: 'relative', zIndex: 1 }}>
            <div className="box pb slam" style={{ padding: 22 }}>
              <h2 className="hd" style={{ fontSize: 36 }}>{page}</h2>
              <p style={{ marginTop: 10 }}>Coming soon.</p>
            </div>
          </div>
        </>
      )}

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

function Hero({ me, acc }) {
  const [first, ...rest] = me.displayName.split(' ')
  return (
    <div id="top" style={{ maxWidth: 1160, margin: '0 auto', padding: '36px 16px 0', position: 'relative', zIndex: 1 }}>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 36, alignItems: 'flex-start' }}>
        <div style={{ flex: '1 1 480px', minWidth: 0, display: 'flex', flexDirection: 'column', gap: 26 }}>
          <div className="slam" style={{ display: 'flex', flexWrap: 'wrap', gap: 34, alignItems: 'center', '--d': '100ms' }}>
            <div style={{ position: 'relative', width: 190, height: 190, margin: '20px 30px 20px 20px' }}>
              <div className="burst" aria-hidden="true" style={{ position: 'absolute', inset: -44, background: 'var(--burst-k) 0 0/100% 100% no-repeat' }} />
              <div className="burst" aria-hidden="true" style={{ position: 'absolute', inset: -30, background: 'var(--burst-b) 0 0/100% 100% no-repeat', animationDirection: 'reverse' }} />
              <img src={me.avatarUrl} alt="" crossOrigin="anonymous" style={{ transform: 'rotate(-4deg)', position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', border: `4px solid ${INK}` }} />
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

          <div className="box pb slam" style={{ padding: 22, display: 'flex', flexDirection: 'column', gap: 14, '--d': '220ms' }}>
            <div className="ln" style={{ width: '94%' }} />
            <div className="ln" style={{ width: '88%' }} />
            <div className="ln" style={{ width: '62%' }} />
          </div>

          <div className="slam" style={{ display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'center', '--d': '340ms' }}>
            <span className="tag">pfp palette</span>
            <div style={{ display: 'flex', gap: 6 }}>
              {[acc, BONE, INK, '#2a2a28'].map((c) => (
                <div key={c} style={{ width: 40, height: 40, background: c, border: `3px solid ${BONE}` }} />
              ))}
            </div>
          </div>
        </div>

        {/* discord */}
        <div className="slam" style={{ flex: '0 1 380px', minWidth: 260, width: '100%', '--d': '300ms' }}>
          <div className="jag keep bk" style={{ boxShadow: '8px 8px 0 var(--acc)' }}>
            <div className="rd" style={{ height: 100, padding: 10, position: 'relative', overflow: 'hidden', borderBottom: `3px solid ${BONE}` }}>
              <div className="halftone" aria-hidden="true" style={{ position: 'absolute', inset: 0, opacity: 0.9, background: `radial-gradient(circle,${INK} 26%,transparent 28%) 0 0/12px 12px` }} />
            </div>
            <div style={{ padding: '0 20px 20px', display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: 12, marginTop: -36, position: 'relative' }}>
                <div style={{ position: 'relative', width: 78, height: 78 }}>
                  <img src={me.avatarUrl} alt="" crossOrigin="anonymous" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', border: `4px solid ${INK}`, borderRadius: '50%', background: BONE }} />
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
    </div>
  )
}
