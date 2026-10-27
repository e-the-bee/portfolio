import { ALBUMS } from '../content.js'
import Title, { pageWrap } from './Title.jsx'

export default function Music() {
  return (
    <div id="music" style={pageWrap(72)}>
      <div className="deco d-slash" aria-hidden="true" style={{ top: '4%', right: -60, width: 300, height: 120, '--r': '-7deg', '--o': 1 }} />
      <div className="deco d-rip" aria-hidden="true" style={{ top: '33%', left: -80, width: 300, height: 180, '--r': '2deg', '--o': 4 }} />
      <div className="deco d-shard" aria-hidden="true" style={{ top: '62%', right: -30, width: 190, height: 210, '--r': '6deg', '--o': 2 }} />
      <div className="deco d-dots" aria-hidden="true" style={{ bottom: '3%', left: '2%', width: 220, height: 130, '--o': 3 }} />
      <div className="slam" style={{ display: 'flex', flexDirection: 'column', gap: 18, marginBottom: 34, alignItems: 'flex-start' }}>
        <Title o={7} brush="torn-r">Music lately</Title>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,minmax(0,1fr))', gap: '30px 24px', padding: '6px 14px 6px 6px' }}>
        {ALBUMS.map((s, i) => (
          <div key={s.album} className="slam" style={{ display: 'flex', flexDirection: 'column', minWidth: 0, '--d': `${(i % 4) * 90}ms` }}>
            <div className="album">
              <div className="vinyl" />
              <div className="cover pb" style={{ border: '3px solid #0b0b0b', overflow: 'hidden' }}>
                <img src={s.cover} alt="" style={{ width: '100%', height: '100%', display: 'block', objectFit: 'cover' }} />
              </div>
            </div>
            <span style={{ marginTop: 12, fontSize: 13 }}>{s.album}</span>
            <span style={{ marginTop: 2, fontSize: 11, opacity: 0.7 }}>{s.artist}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
