import { useState } from 'react'
import { CHANGELOG, PROJECTS, PROJECT_FILTERS } from '../content.js'
import Title, { pageWrap } from './Title.jsx'

const centered = { display: 'flex', alignItems: 'center', justifyContent: 'center' }

export default function Projects() {
  const [filter, setFilter] = useState('all')
  const [open, setOpen] = useState(null)

  const show = (i) => { setOpen(i); window.scrollTo({ top: 0 }) }
  const list = PROJECTS.map((p, idx) => ({ ...p, idx })).filter((p) => filter === 'all' || p.cat === filter)

  return (
    <div id="projects" style={pageWrap(64)}>
      <div className="deco d-burst" aria-hidden="true" style={{ top: '3%', left: -70, width: 200, height: 200, '--r': '-6deg', '--o': 2 }} />
      <div className="deco d-rip" aria-hidden="true" style={{ top: '42%', right: -80, width: 300, height: 180, '--r': '-3deg', '--o': 5 }} />
      <div className="deco d-slash b" aria-hidden="true" style={{ bottom: '4%', left: -60, width: 300, height: 120, '--r': '5deg', '--o': 1 }} />
      <div className="slam" style={{ display: 'flex', flexDirection: 'column', gap: 18, marginBottom: 28, alignItems: 'flex-start' }}>
        <Title o={13} brush="brush-r">Projects</Title>
      </div>

      {open == null ? (
        <>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 14, margin: '6px 0 30px' }}>
            {PROJECT_FILTERS.map((k) => (
              <button key={k} type="button" className={k === filter ? 'jag btn r' : 'jag btn'} onClick={() => setFilter(k)}>{k}</button>
            ))}
          </div>
          {list.length === 0 && (
            <div className="bk" style={{ padding: 18, borderStyle: 'dashed', marginBottom: 30 }}>
              <span style={{ fontSize: 13 }}>nothing in this filter yet</span>
            </div>
          )}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '34px 30px', padding: '0 10px 10px 6px' }}>
            {list.map((p, i) => (
              <div key={p.idx} className="slam" style={{ flex: '1 1 250px', maxWidth: 360, position: 'relative', '--d': `${i * 110}ms` }}>
                {p.wip && <span className="wip hd" aria-label="Work in progress"><span>WIP</span></span>}
                <a className="jag keep card pb" href="#detail" onClick={(e) => { e.preventDefault(); show(p.idx) }} style={{ display: 'block', textDecoration: 'none', border: '3px solid #0b0b0b' }}>
                  <div className="thumb">{p.image ? <img src={p.image} alt={`${p.name} screenshot`} /> : <span>PROJECT IMAGE / GIF</span>}</div>
                  <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 10, borderTop: '3px solid #0b0b0b' }}>
                    <h3 className="hd" style={{ fontSize: 26 }}>{p.name}</h3>
                    {p.desc ? <p style={{ fontSize: 13, lineHeight: 1.45 }}>{p.desc}</p> : (
                      <>
                        <div className="ln" style={{ width: '92%' }} />
                        <div className="ln" style={{ width: '70%' }} />
                      </>
                    )}
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>{p.tags.map((t, j) => <span key={j} className="tag">{t}</span>)}</div>
                    <div className="hd" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 14 }}>
                      <span>{p.status}</span><span className="view">view →</span>
                    </div>
                  </div>
                </a>
              </div>
            ))}
          </div>
        </>
      ) : (
        <Detail p={PROJECTS[open]} back={() => show(null)} />
      )}
    </div>
  )
}

function Detail({ p, back }) {
  return (
    <>
      <div className="wipe" aria-hidden="true" />
      <div className="slam" style={{ display: 'flex', flexDirection: 'column', gap: 30, padding: '0 10px 10px 6px' }}>
        <div><button type="button" className="jag btn" onClick={back}>← Back to projects</button></div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 34, alignItems: 'flex-start' }}>
          <div style={{ flex: '2 1 460px', minWidth: 0, display: 'flex', flexDirection: 'column', gap: 30 }}>
            <div className="box pb" style={{ border: '3px solid #0b0b0b' }}>
              <div className="thumb" style={{ height: 340 }}>{p.image ? <img src={p.image} alt={`${p.name} screenshot`} /> : <span>BIG PROJECT MEDIA / GIF / VIDEO</span>}</div>
              <div style={{ padding: 22, display: 'flex', flexDirection: 'column', gap: 12, borderTop: '3px solid #0b0b0b' }}>
                <h3 className="hd" style={{ fontSize: 52, lineHeight: 1 }}>{p.name}</h3>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  <span className="tag">{p.cat}</span><span className="tag">{p.status}</span>
                  {p.tags.map((t, j) => <span key={j} className="tag">{t}</span>)}
                </div>
                {p.desc
                  ? <p style={{ fontSize: 15, lineHeight: 1.5 }}>{p.desc}</p>
                  : ['96%', '90%', '94%', '58%'].map((w) => <div key={w} className="ln" style={{ width: w }} />)}
              </div>
            </div>
            <div className="box bk" style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 14 }}>
              <h3 className="hd" style={{ fontSize: 24 }}>Gallery</h3>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16 }}>
                <div className="rd hd" style={{ flex: '1 1 120px', height: 110, ...centered, fontSize: 14, border: '2px solid #f2f0e6' }}>SHOT 1</div>
                <div className="pb hd" style={{ flex: '1 1 120px', height: 110, ...centered, fontSize: 14 }}>SHOT 2</div>
                <div className="rd hd" style={{ flex: '1 1 120px', height: 110, ...centered, fontSize: 14, border: '2px solid #f2f0e6' }}>SHOT 3</div>
              </div>
            </div>
          </div>

          <div style={{ flex: '1 1 280px', display: 'flex', flexDirection: 'column', gap: 30, paddingRight: 10 }}>
            <div className="box rd" style={{ padding: 22, display: 'flex', flexDirection: 'column', gap: 16, border: '3px solid #0b0b0b', boxShadow: '6px 6px 0 #f2f0e6' }}>
              <h3 className="hd" style={{ fontSize: 26 }}>Links</h3>
              {['Source', 'Download', 'Docs'].map((l) => (
                l === 'Source' && p.source
                  ? <a key={l} className="jag btn" href={p.source} target="_blank" rel="noreferrer" style={{ justifyContent: 'flex-start' }}>{l}</a>
                  : <a key={l} className="jag btn" href="#detail" onClick={(e) => e.preventDefault()} style={{ justifyContent: 'flex-start' }}>{l}</a>
              ))}
            </div>
            <div className="box pb" style={{ padding: 22, display: 'flex', flexDirection: 'column', gap: 14 }}>
              <h3 className="hd" style={{ fontSize: 26 }}>Changelog</h3>
              {CHANGELOG.map((c) => (
                <div key={c.v} style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <span className="hd" style={{ fontSize: 16 }}>{c.v} · [date]</span>
                  <div className="ln" style={{ width: c.w }} />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
