import { ALBUMS, SONGS, TOP_ARTISTS } from '../content.js'
import Title, { pageWrap } from './Title.jsx'

export default function Music() {
  return (
    <>
      <div id="music" style={pageWrap(72)}>
        <div className="deco d-slash" aria-hidden="true" style={{ top: 44, right: -60, width: 400, height: 96, '--r': '-7deg', '--o': 1 }} />
        <div className="deco d-rip" aria-hidden="true" style={{ top: 250, left: -90, width: 460, height: 210, '--r': '2deg', '--o': 4 }} />
        <div className="deco d-shard" aria-hidden="true" style={{ top: '38%', right: -30, width: 220, height: 240, '--r': '6deg', '--o': 2 }} />
        <div className="deco d-dots" aria-hidden="true" style={{ bottom: 70, left: '2%', width: 270, height: 170, '--o': 3 }} />
        <div className="deco d-tri r" aria-hidden="true" style={{ bottom: 140, right: '14%', width: 96, height: 96, '--r': '14deg', '--o': 5 }} />
        <div className="slam" style={{ display: 'flex', flexDirection: 'column', gap: 18, marginBottom: 34, alignItems: 'flex-start' }}>
          <Title o={7} brush="torn-r">Music lately</Title>
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 32, alignItems: 'stretch' }}>
          <div style={{ flex: '2 1 460px', minWidth: 0, display: 'grid', gridTemplateColumns: 'repeat(3,minmax(0,1fr))', gap: '30px 24px', padding: '6px 14px 6px 6px', alignSelf: 'flex-start' }}>
            {ALBUMS.map((s, i) => (
              <div key={s.album} className="slam" style={{ display: 'flex', flexDirection: 'column', minWidth: 0, '--d': `${(i % 3) * 90}ms` }}>
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

          <div style={{ flex: '1 1 300px', display: 'flex', flexDirection: 'column', gap: 26 }}>
            <div className="box pb" style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 14 }}>
              <h3 className="hd" style={{ fontSize: 24 }}>Top artists</h3>
              {TOP_ARTISTS.map((a, i) => (
                <div key={a.name} style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <span style={{ fontSize: 12 }}>{a.name}</span>
                  <div className="seg" style={{ background: 'rgba(11,11,11,.18)' }}><i style={{ '--w': a.w, '--d': `${i * 140}ms` }} /></div>
                </div>
              ))}
            </div>
            <div className="box bk" style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 8 }}>
              <h3 className="hd" style={{ fontSize: 24 }}>Recently played</h3>
              {SONGS.map((s) => (
                <div key={s.title} style={{ display: 'flex', gap: 10, alignItems: 'center', padding: '8px 0', borderBottom: '2px dashed rgba(242,240,230,.5)' }}>
                  <img src={s.cover} alt="" style={{ width: 34, height: 34, flex: 'none', border: '2px solid #0b0b0b', objectFit: 'cover' }} />
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 2, minWidth: 0 }}>
                    <span style={{ fontSize: 13 }}>{s.title}</span>
                    <span style={{ fontSize: 11, opacity: 0.7 }}>{s.artist}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
