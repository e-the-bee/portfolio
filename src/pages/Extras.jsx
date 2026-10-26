import { useState } from 'react'
import { EMAIL, INTERESTS, LINKS } from '../content.js'
import Title, { pageWrap } from './Title.jsx'

const CELLS = Array.from({ length: 140 }, (_, i) => {
  const col = Math.floor(i / 7)
  return { cls: `cell l${(i * 7 + col * 3) % 5}`, delay: `${col * 45}ms` }
})

const sq = (bg) => ({ width: 12, height: 12, background: bg })
const small = { fontSize: 15, padding: '6px 16px' }

export default function Extras({ handle }) {
  const [copied, setCopied] = useState(false)
  const copyEmail = async () => {
    try {
      await navigator.clipboard.writeText(EMAIL)
      setCopied(true)
      setTimeout(() => setCopied(false), 1800)
    } catch { /* clipboard unavailable */ }
  }

  return (
    <div id="extras" style={pageWrap(80)}>
      <div className="deco d-slash" aria-hidden="true" style={{ top: 30, left: -70, width: 430, height: 100, '--r': '-5deg', '--o': 3 }} />
      <div className="deco d-burst b" aria-hidden="true" style={{ bottom: 30, right: -50, width: 230, height: 230, '--r': '-8deg', '--o': 1 }} />
      <div className="deco d-rip" aria-hidden="true" style={{ top: '46%', left: -70, width: 340, height: 200, '--r': '3deg', '--o': 5 }} />
      <div className="deco d-tri r" aria-hidden="true" style={{ top: 200, right: '6%', width: 100, height: 100, '--r': '-10deg', '--o': 2 }} />
      <div className="slam" style={{ display: 'flex', flexDirection: 'column', gap: 18, marginBottom: 34, alignItems: 'flex-start' }}>
        <Title o={22} brush="brush-r">Extras</Title>
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 32, alignItems: 'flex-start' }}>
        <div className="box bk" style={{ flex: '1 1 380px', padding: 22, display: 'flex', flexDirection: 'column', gap: 8, minWidth: 0, boxShadow: '8px 8px 0 var(--acc)' }}>
          <div style={{ display: 'flex', gap: 6, marginBottom: 6 }}>
            <i className="rd" style={sq()} /><i style={sq('#f2f0e6')} /><i style={sq('#f2f0e6')} />
          </div>
          <div className="type" style={{ '--ch': '10ch', '--d': '.3s' }}>$ whoami</div>
          <div className="type" style={{ '--ch': `${handle.length + 1}ch`, '--d': '1.6s' }}>{handle}</div>
          <div className="type" style={{ '--ch': '18ch', '--d': '2.8s' }}>$ cat interests.txt</div>
          <div className="type" style={{ '--ch': `${INTERESTS.length}ch`, '--d': '4.6s' }}>{INTERESTS}</div>
          <div><span style={{ fontSize: 14 }}>$ </span><span className="caret" /></div>
        </div>

        <div style={{ flex: '1 1 380px', display: 'flex', flexDirection: 'column', gap: 30, minWidth: 0 }}>
          <div className="box pb" style={{ padding: 22, display: 'flex', flexDirection: 'column', gap: 12 }}>
            <h3 className="hd" style={{ fontSize: 24 }}>Activity</h3>
            <div style={{ overflowX: 'auto', paddingBottom: 6 }}>
              <div className="heat">
                {CELLS.map((c, i) => <i key={i} className={c.cls} style={{ '--d': c.delay }} />)}
              </div>
            </div>
          </div>
          <div className="box bk" style={{ padding: 22, display: 'flex', flexDirection: 'column', gap: 12 }}>
            <h3 className="hd" style={{ fontSize: 24 }}>Links</h3>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 14 }}>
              {LINKS.map((l, i) => (
                <a key={l.label} className={i === 0 ? 'jag btn r' : 'jag btn'} href={l.href} target="_blank" rel="noreferrer" style={small}>{l.label}</a>
              ))}
              <button type="button" className="jag btn" onClick={copyEmail} style={small}>{copied ? 'Copied!' : 'Email'}</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
