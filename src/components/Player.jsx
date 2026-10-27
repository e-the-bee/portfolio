import { SONGS } from '../content.js'
import { BONE, INK } from '../theme.js'

function Volume({ player }) {
  return (
    <label className="vol">
      <span>Vol</span>
      <input
        type="range"
        min="0"
        max="1"
        step="0.01"
        value={player.volume}
        aria-label="Volume"
        onChange={(e) => player.setVolume(Number(e.target.value))}
      />
    </label>
  )
}

export function MiniPlayer({ player }) {
  const btn = { minHeight: 44, fontSize: 15, padding: '6px 16px' }
  return (
    <div style={{ maxWidth: 1160, margin: '0 auto', padding: '18px 16px 0', position: 'relative', zIndex: 2 }}>
      <div className="box rd" style={{ display: 'flex', flexWrap: 'nowrap', overflowX: 'auto', gap: 18, alignItems: 'center', padding: '22px 20px', border: `3px solid ${INK}`, boxShadow: `6px 6px 0 ${BONE}` }}>
        <span className="tag" style={{ flex: 'none', whiteSpace: 'nowrap' }}>now playing</span>
        <span className="hd" style={{ fontSize: 22, flex: '1 0 140px', whiteSpace: 'nowrap' }}>{player.cur.title}</span>
        <button type="button" className="jag btn" style={btn} onClick={player.prev}>Prev</button>
        <button type="button" className="jag btn on" style={btn} onClick={player.toggle}>{player.playing ? 'Pause' : 'Play'}</button>
        <button type="button" className="jag btn" style={btn} onClick={player.next}>Next</button>
        <Volume player={player} />
      </div>
    </div>
  )
}

export default function Player({ player }) {
  const { cur, song, playing } = player
  return (
    <div id="player" style={{ maxWidth: 1160, margin: '0 auto', padding: '36px 16px 0', position: 'relative', zIndex: 1 }}>
      <div className="deco d-slash" aria-hidden="true" style={{ top: -14, right: -70, width: 300, height: 120, '--r': '-6deg', '--o': 1 }} />
      <div className="deco d-rip" aria-hidden="true" style={{ top: '52%', left: -80, width: 300, height: 180, '--r': '3deg', '--o': 3 }} />
      <div className="deco d-tri b" aria-hidden="true" style={{ bottom: -26, right: '7%', width: 120, height: 120, '--r': '12deg', '--o': 4 }} />
      <div className="box rd slam" style={{ padding: 24, border: `3px solid ${INK}`, boxShadow: `8px 8px 0 ${BONE}`, '--d': '200ms' }}>
        <div className={playing ? 'player' : 'player paused'} style={{ display: 'flex', flexWrap: 'wrap', gap: 28, alignItems: 'stretch' }}>
          <div style={{ display: 'flex', gap: 18, alignItems: 'center', flex: '2 1 520px', minWidth: 0 }}>
            <div className="bk" style={{ width: 124, height: 124, flex: 'none', transform: 'rotate(-3deg) scale(calc(1 + var(--beat, 0) * .06))', padding: 0, overflow: 'hidden' }}>
              <img src={cur.cover} alt="" style={{ width: '100%', height: '100%', display: 'block', objectFit: 'cover' }} />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, flex: 1, minWidth: 0 }}>
              <h2 className="hd fx dk" style={{ fontSize: 36, lineHeight: 1, alignSelf: 'flex-start', color: 'var(--on)', '--o': 11 }}>
                {cur.title}
                {[1, 2, 3, 4, 5].map((n) => <i key={n} className={`cl c${n}`} aria-hidden="true">{cur.title}</i>)}
              </h2>
              <span style={{ fontSize: 13 }}>{cur.artist} · {cur.album}</span>
              <div className="prog"><i style={{ width: `${player.pct}%`, animation: 'none' }} /></div>
              <div style={{ display: 'flex', flexWrap: 'nowrap', gap: 16 }}>
                <button type="button" className="jag btn" onClick={player.prev}>Prev</button>
                <button type="button" className="jag btn on" onClick={player.toggle}>{playing ? 'Pause' : 'Play'}</button>
                <button type="button" className="jag btn" onClick={player.next}>Next</button>
                <Volume player={player} />
              </div>
            </div>
            <div style={{ display: 'flex', gap: 6, alignItems: 'flex-end', height: 56, flex: 'none' }} aria-hidden="true">
              {['-.1s', '-.35s', '-.2s', '-.45s', '-.05s'].map((d, i) => <i key={d} className="eqb" style={{ animationDelay: d, '--bv': `var(--b${i}, .5)` }} />)}
            </div>
          </div>

          <div style={{ flex: '1 1 300px', display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14, padding: '4px 14px 4px 10px' }}>
              {SONGS.map((s, i) => (
                <button key={s.title} type="button" className={i === song ? 'jag trk on' : 'jag trk'} onClick={() => player.pick(i)}>
                  <span className="num">{i + 1}</span>
                  <span style={{ flex: 1, fontSize: 14 }}>{s.title}</span>
                  <span className="tag">{s.artist}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
