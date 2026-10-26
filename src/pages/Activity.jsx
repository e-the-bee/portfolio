import Title, { pageWrap } from './Title.jsx'

// Placeholder: this page will run on a second git account that is not set up yet, so it shows no real data.
// The previous live Codeberg version is parked in ActivityLive.jsx; swap the import in App.jsx to bring it back.
const PLANNED = [
  'Contribution map',
  'Recent commits per project',
  'Hours and weekdays I code',
  'Languages and repos',
]

export default function Activity() {
  return (
    <div id="activity" style={pageWrap(80)}>
      <div className="deco d-slash" aria-hidden="true" style={{ top: 30, left: -70, width: 430, height: 100, '--r': '-5deg', '--o': 3 }} />
      <div className="deco d-burst b" aria-hidden="true" style={{ bottom: 30, right: -50, width: 230, height: 230, '--r': '-8deg', '--o': 1 }} />
      <div className="slam" style={{ display: 'flex', flexDirection: 'column', gap: 18, marginBottom: 34, alignItems: 'flex-start' }}>
        <Title o={14} brush="brush-r">Activity</Title>
      </div>

      <div className="box rd slam" style={{ padding: 28, display: 'flex', flexDirection: 'column', gap: 14, border: '3px solid #0b0b0b', boxShadow: '8px 8px 0 #f2f0e6' }}>
        <span className="tag" style={{ alignSelf: 'flex-start' }}>in progress</span>
        <h3 className="hd" style={{ fontSize: 34 }}>Under construction</h3>
        <p style={{ fontSize: 14, lineHeight: 1.6, maxWidth: 640 }}>
          This page will track my git activity from a new account I am setting up. Nothing is connected yet, so there is no data here.
        </p>
      </div>

      <div className="box bk slam" style={{ marginTop: 36, padding: 22, display: 'flex', flexDirection: 'column', gap: 6 }}>
        <h3 className="hd" style={{ fontSize: 26, marginBottom: 6 }}>Coming here</h3>
        {PLANNED.map((t) => (
          <div key={t} style={{ fontSize: 13, lineHeight: 1.5, padding: '7px 0', borderBottom: '2px dashed rgba(242,240,230,.35)', opacity: 0.7 }}>{t}</div>
        ))}
      </div>
    </div>
  )
}
