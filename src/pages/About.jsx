import { SKILLS, STATS, TIMELINE } from '../content.js'
import Title, { pageWrap } from './Title.jsx'

export default function About() {
  return (
    <div id="about" style={pageWrap(80)}>
      <div className="deco d-shard r" aria-hidden="true" style={{ top: 20, right: -30, width: 250, height: 270, '--r': '-5deg', '--o': 4 }} />
      <div className="deco d-rip" aria-hidden="true" style={{ top: '48%', left: -100, width: 390, height: 210, '--r': '-2deg', '--o': 2 }} />
      <div className="deco d-bar r" aria-hidden="true" style={{ bottom: 80, right: -70, width: 470, height: 72, '--r': '4deg', '--o': 6 }} />
      <div className="deco d-dots" aria-hidden="true" style={{ top: '30%', right: '12%', width: 200, height: 150, '--o': 1 }} />
      <div className="slam" style={{ display: 'flex', flexDirection: 'column', gap: 18, marginBottom: 34, alignItems: 'flex-start' }}>
        <Title o={18} brush="torn-r">About me</Title>
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 32, alignItems: 'stretch' }}>
        <div style={{ flex: '2 1 460px', minWidth: 0, display: 'flex', flexDirection: 'column', gap: 30 }}>
          <div className="box pb slam" style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 12 }}>
            {['96%', '90%', '93%', '60%'].map((w) => <div key={w} className="ln" style={{ width: w }} />)}
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 24, padding: '0 10px 10px 4px' }}>
            {STATS.map((s, i) => (
              <div key={s.k} className="slam" style={{ flex: '1 1 130px', '--d': `${i * 100}ms` }}>
                <div className="jag keep bk" style={{ padding: 16, boxShadow: '5px 5px 0 var(--acc)' }}>
                  <div className="hd" style={{ fontSize: 44, lineHeight: 1 }}>{s.v}</div>
                  <div style={{ fontSize: 12 }}>{s.k}</div>
                </div>
              </div>
            ))}
          </div>

          <div className="box rd" style={{ padding: 22, display: 'flex', flexDirection: 'column', gap: 14, border: '3px solid #0b0b0b', boxShadow: '6px 6px 0 #f2f0e6' }}>
            <h3 className="hd" style={{ fontSize: 26 }}>Skills</h3>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
              {SKILLS.map((s, i) => <span key={i} className="jag tag">{s}</span>)}
            </div>
          </div>
        </div>

        <div style={{ flex: '1 1 300px', display: 'flex', flexDirection: 'column', gap: 30 }}>
          <div className="box bk" style={{ padding: 22, display: 'flex', flexDirection: 'column', gap: 0 }}>
            <h3 className="hd" style={{ fontSize: 26, marginBottom: 16 }}>Timeline</h3>
            {TIMELINE.map((e, i) => (
              <div key={i} style={{ display: 'flex', gap: 14 }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <div className="rd" style={{ width: 16, height: 16, border: '2px solid #f2f0e6', transform: 'rotate(45deg)' }} />
                  <div style={{ flex: 1, width: 3, background: '#f2f0e6', minHeight: 48 }} />
                </div>
                <div style={{ paddingBottom: 16, display: 'flex', flexDirection: 'column', gap: 6, flex: 1 }}>
                  <span className="hd" style={{ fontSize: 16 }}>{e.year}</span>
                  <div className="ln" style={{ width: '80%', background: '#f2f0e6' }} />
                  <div className="ln" style={{ width: '50%', background: '#f2f0e6' }} />
                </div>
              </div>
            ))}
          </div>
          <div className="box pb" style={{ padding: 22, display: 'flex', flexDirection: 'column', gap: 12 }}>
            <h3 className="hd" style={{ fontSize: 26 }}>Currently</h3>
            <div className="ln" style={{ width: '85%' }} />
            <div className="ln" style={{ width: '60%' }} />
          </div>
        </div>
      </div>
    </div>
  )
}
