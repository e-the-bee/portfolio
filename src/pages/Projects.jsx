import { useState } from 'react'
import { PROJECTS, PROJECT_FILTERS } from '../content.js'
import Title, { pageWrap } from './Title.jsx'

export default function Projects() {
  const [filter, setFilter] = useState('all')
  const list = PROJECTS.filter((p) => filter === 'all' || p.cat === filter)

  return (
    <div id="projects" style={pageWrap(64)}>
      <div className="deco d-burst" aria-hidden="true" style={{ top: '3%', left: -70, width: 200, height: 200, '--r': '-6deg', '--o': 2 }} />
      <div className="deco d-rip" aria-hidden="true" style={{ top: '42%', right: -80, width: 300, height: 180, '--r': '-3deg', '--o': 5 }} />
      <div className="deco d-slash b" aria-hidden="true" style={{ bottom: '4%', left: -60, width: 300, height: 120, '--r': '5deg', '--o': 1 }} />
      <div className="slam" style={{ display: 'flex', flexDirection: 'column', gap: 18, marginBottom: 28, alignItems: 'flex-start' }}>
        <Title o={13} brush="brush-r">Projects</Title>
      </div>

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
        {list.map((p, i) => {
          const Card = p.url ? 'a' : 'div'
          return (
            <div key={p.name} className="slam" style={{ flex: '1 1 250px', maxWidth: 360, position: 'relative', '--d': `${i * 110}ms` }}>
              {p.wip && <span className="wip hd" aria-label="Work in progress"><span>WIP</span></span>}
              <Card
                className="jag keep card pb"
                {...(p.url && { href: p.url, target: '_blank', rel: 'noreferrer' })}
                style={{ display: 'block', textDecoration: 'none', border: '3px solid #0b0b0b' }}
              >
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
                    <span>{p.status}</span>{p.url && <span className="view">view →</span>}
                  </div>
                </div>
              </Card>
            </div>
          )
        })}
      </div>
    </div>
  )
}
