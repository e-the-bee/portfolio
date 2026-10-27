import { BIO, BIO_LINK, DISCORD_BIO } from '../content.js'
import { BONE, INK } from '../theme.js'

export default function Hero({ me }) {
  const [first, ...rest] = me.displayName.split(' ')
  return (
    <div id="top" style={{ maxWidth: 1160, margin: '0 auto', padding: '36px 16px 0', position: 'relative', zIndex: 1 }}>
      <div className="deco d-burst b" aria-hidden="true" style={{ top: '46%', right: -60, width: 200, height: 200, '--r': '-8deg', '--o': 1 }} />
      <div className="deco d-dots" aria-hidden="true" style={{ bottom: '4%', left: '3%', width: 220, height: 130, '--o': 2 }} />
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 36, alignItems: 'stretch' }}>
        <div style={{ flex: '1 1 480px', minWidth: 0, display: 'flex', flexDirection: 'column', gap: 26 }}>
          <div className="slam" style={{ display: 'flex', flexWrap: 'wrap', gap: 34, alignItems: 'center', '--d': '100ms' }}>
            <div className="beatpop" style={{ position: 'relative', width: 190, height: 190, margin: '20px 30px 20px 20px' }}>
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
              <p className="mk" style={{ fontSize: 22, transform: 'rotate(-2deg)', background: INK, color: BONE, padding: '4px 12px', alignSelf: 'flex-start' }}>Making noise, shipping code.</p>
            </div>
          </div>

          <div className="box pb slam" style={{ padding: 22, display: 'flex', flexDirection: 'column', gap: 12, '--d': '220ms' }}>
            {BIO.map((t) => <p key={t} style={{ fontSize: 14, lineHeight: 1.6 }}>{t}</p>)}
            <a href={BIO_LINK} target="_blank" rel="noreferrer" style={{ fontSize: 13, alignSelf: 'flex-start', textDecoration: 'underline' }}>{BIO_LINK}</a>
          </div>
        </div>

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
              <div style={{ fontSize: 12, lineHeight: 1.6, borderTop: '2px dashed rgba(242,240,230,.35)', paddingTop: 12 }}>
                <a href={BIO_LINK} target="_blank" rel="noreferrer" style={{ textDecoration: 'underline' }}>nohello.net</a>
                {DISCORD_BIO.map((t) => <div key={t}>{t}</div>)}
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
