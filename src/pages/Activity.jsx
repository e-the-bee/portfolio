import { useEffect, useMemo, useState } from 'react'
import { ACTIVITY_HIDE_REPOS, ACTIVITY_USER } from '../content.js'
import { fetchCommits, fetchHeatmap, fetchLanguages, fetchRepos, timeAgo } from '../lib/codeberg.js'
import Title, { pageWrap } from './Title.jsx'

const WEEKS = 53
const DAY = 86400000
const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const LANG_COLORS = ['var(--acc)', '#f2f0e6', '#8a8a82', '#d6a63a', '#4a4a46', '#b8b4a2']

const dayKey = (d) => `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`
const startOfDay = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate())

// Group raw heatmap points into per-day, per-hour and per-weekday totals.
function summarise(points) {
  const perDay = new Map()
  const hours = Array(24).fill(0)
  const weekdays = Array(7).fill(0)
  let total = 0
  for (const p of points) {
    const d = new Date(p.timestamp * 1000)
    perDay.set(dayKey(d), (perDay.get(dayKey(d)) || 0) + p.contributions)
    hours[d.getHours()] += p.contributions
    weekdays[d.getDay()] += p.contributions
    total += p.contributions
  }

  const today = startOfDay(new Date())
  const first = new Date(today.getTime() - ((WEEKS - 1) * 7 + today.getDay()) * DAY)
  const cells = []
  let max = 0
  for (let t = first; t <= today; t = new Date(t.getFullYear(), t.getMonth(), t.getDate() + 1)) {
    const n = perDay.get(dayKey(t)) || 0
    max = Math.max(max, n)
    cells.push({ date: t, n })
  }

  let longest = 0
  let run = 0
  for (const c of cells) {
    run = c.n > 0 ? run + 1 : 0
    longest = Math.max(longest, run)
  }
  // A quiet today does not break a streak that is still alive.
  let current = 0
  for (let i = cells.length - 1; i >= 0; i--) {
    if (cells[i].n > 0) current++
    else if (i !== cells.length - 1) break
  }

  return { cells, max, total, hours, weekdays, longest, current, active: cells.filter((c) => c.n > 0).length }
}

const level = (n, max) => (n === 0 ? 0 : Math.min(4, Math.ceil((n / max) * 4)))

function Stat({ v, k }) {
  return (
    <div className="box pb" style={{ flex: '1 1 150px', padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: 4 }}>
      <span className="hd" style={{ fontSize: 40, lineHeight: 1 }}>{v}</span>
      <span style={{ fontSize: 12 }}>{k}</span>
    </div>
  )
}

function Bars({ values, labels, tall = 90 }) {
  const max = Math.max(1, ...values)
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 4, height: tall + 22 }}>
      {values.map((v, i) => (
        <div key={i} title={`${labels[i]}: ${v}`} style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-end', gap: 4, height: '100%' }}>
          <i style={{ display: 'block', width: '100%', height: Math.max(2, (v / max) * tall), background: v === max ? 'var(--acc)' : '#f2f0e6' }} />
          <span style={{ fontSize: 10, opacity: 0.7, whiteSpace: 'nowrap' }}>{labels[i]}</span>
        </div>
      ))}
    </div>
  )
}

function Heatmap({ cells, max }) {
  const lead = cells[0].date.getDay()
  return (
    <div style={{ overflowX: 'auto', paddingBottom: 6 }}>
      <div className="heat">
        {Array.from({ length: lead }, (_, i) => <i key={`pad${i}`} style={{ width: 12, height: 12 }} />)}
        {cells.map((c, i) => (
          <i
            key={i}
            className={`cell l${level(c.n, max)}`}
            style={{ '--d': `${Math.floor((i + lead) / 7) * 18}ms` }}
            title={`${c.date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}: ${c.n} contribution${c.n === 1 ? '' : 's'}`}
          />
        ))}
      </div>
    </div>
  )
}

function CommitRow({ c, showRepo }) {
  return (
    <a className="crow" href={c.url} target="_blank" rel="noreferrer">
      <span className="tag" style={{ flex: 'none', fontSize: 11 }}>{c.sha}</span>
      <span style={{ flex: 1, minWidth: 0, fontSize: 13, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.message}</span>
      {showRepo && <span className="hd" style={{ flex: 'none', fontSize: 13 }}>{c.repo}</span>}
      <span style={{ flex: 'none', fontSize: 12, opacity: 0.7 }}>{timeAgo(c.date)}</span>
    </a>
  )
}

function Commits({ repos }) {
  const [repo, setRepo] = useState('all')
  const [state, setState] = useState({ status: 'loading', list: [] })

  useEffect(() => {
    let live = true
    setState({ status: 'loading', list: [] })
    const job = repo === 'all'
      ? Promise.all(repos.map((r) => fetchCommits(ACTIVITY_USER, r.name, 10).catch(() => []))).then((all) => all.flat().sort((a, b) => b.date - a.date).slice(0, 20))
      : fetchCommits(ACTIVITY_USER, repo, 30)
    job.then((list) => live && setState({ status: 'ok', list })).catch(() => live && setState({ status: 'error', list: [] }))
    return () => { live = false }
  }, [repo, repos])

  const current = repos.find((r) => r.name === repo)

  return (
    <div className="box pb" style={{ padding: 22, display: 'flex', flexDirection: 'column', gap: 14 }}>
      <h3 className="hd" style={{ fontSize: 26 }}>Recent commits</h3>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
        {['all', ...repos.map((r) => r.name)].map((k) => (
          <button key={k} type="button" className={k === repo ? 'jag btn r' : 'jag btn'} style={{ fontSize: 15, padding: '6px 16px' }} onClick={() => setRepo(k)}>{k}</button>
        ))}
      </div>
      {current && (
        <p style={{ fontSize: 13 }}>
          {current.description || 'No description.'}{' '}
          <a href={current.html_url} target="_blank" rel="noreferrer" style={{ textDecoration: 'underline' }}>open on Codeberg</a>
        </p>
      )}
      {state.status === 'loading' && <p style={{ fontSize: 13 }}>loading commits...</p>}
      {state.status === 'error' && <p style={{ fontSize: 13 }}>Could not reach Codeberg. Try again in a minute.</p>}
      {state.status === 'ok' && state.list.length === 0 && <p style={{ fontSize: 13 }}>No commits yet.</p>}
      <div>
        {state.list.map((c) => <CommitRow key={`${c.repo}${c.sha}`} c={c} showRepo={repo === 'all'} />)}
      </div>
    </div>
  )
}

function Languages({ repos }) {
  const [langs, setLangs] = useState(null)

  useEffect(() => {
    let live = true
    Promise.all(repos.map((r) => fetchLanguages(ACTIVITY_USER, r.name).catch(() => ({}))))
      .then((all) => {
        const sum = {}
        for (const l of all) for (const [k, v] of Object.entries(l)) sum[k] = (sum[k] || 0) + v
        const total = Object.values(sum).reduce((a, b) => a + b, 0)
        if (live) setLangs(Object.entries(sum).sort((a, b) => b[1] - a[1]).map(([name, bytes]) => ({ name, pct: total ? (bytes / total) * 100 : 0 })))
      })
    return () => { live = false }
  }, [repos])

  if (!langs || langs.length === 0) return null
  return (
    <div className="box bk" style={{ padding: 22, display: 'flex', flexDirection: 'column', gap: 14 }}>
      <h3 className="hd" style={{ fontSize: 26 }}>Languages</h3>
      <div style={{ display: 'flex', height: 18, border: '2px solid #f2f0e6' }}>
        {langs.map((l, i) => <i key={l.name} title={`${l.name} ${l.pct.toFixed(1)}%`} style={{ width: `${l.pct}%`, background: LANG_COLORS[i % LANG_COLORS.length] }} />)}
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px 18px' }}>
        {langs.map((l, i) => (
          <span key={l.name} style={{ fontSize: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
            <i style={{ width: 10, height: 10, background: LANG_COLORS[i % LANG_COLORS.length] }} />
            {l.name} {l.pct.toFixed(1)}%
          </span>
        ))}
      </div>
    </div>
  )
}

function RepoCards({ repos }) {
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 22 }}>
      {repos.map((r) => (
        <a key={r.name} className="jag keep card box bk" href={r.html_url} target="_blank" rel="noreferrer" style={{ flex: '1 1 240px', padding: 18, display: 'flex', flexDirection: 'column', gap: 8, textDecoration: 'none', color: 'inherit' }}>
          <h3 className="hd" style={{ fontSize: 22 }}>{r.name}</h3>
          <p style={{ fontSize: 12, lineHeight: 1.5, flex: 1 }}>{r.description || 'No description.'}</p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {r.language && <span className="tag">{r.language}</span>}
            <span className="tag">updated {timeAgo(new Date(r.updated_at))}</span>
            {r.stars_count > 0 && <span className="tag">{r.stars_count} stars</span>}
          </div>
        </a>
      ))}
    </div>
  )
}

export default function Activity() {
  const [data, setData] = useState({ status: 'loading' })

  useEffect(() => {
    let live = true
    Promise.all([fetchHeatmap(ACTIVITY_USER), fetchRepos(ACTIVITY_USER)])
      .then(([heat, repos]) => live && setData({
        status: 'ok',
        heat,
        repos: repos.filter((r) => !ACTIVITY_HIDE_REPOS.includes(r.name)).sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at)),
      }))
      .catch(() => live && setData({ status: 'error' }))
    return () => { live = false }
  }, [])

  const sum = useMemo(() => (data.status === 'ok' ? summarise(data.heat) : null), [data])

  return (
    <div id="activity" style={pageWrap(64)}>
      <div className="deco d-slash" aria-hidden="true" style={{ top: 40, right: -80, width: 420, height: 96, '--r': '4deg', '--o': 3 }} />
      <div className="deco d-burst b" aria-hidden="true" style={{ top: '52%', left: -90, width: 220, height: 220, '--r': '7deg', '--o': 1 }} />
      <div className="deco d-rip" aria-hidden="true" style={{ bottom: 40, right: -90, width: 380, height: 220, '--r': '-4deg', '--o': 5 }} />
      <div className="slam" style={{ display: 'flex', flexDirection: 'column', gap: 18, marginBottom: 28, alignItems: 'flex-start' }}>
        <Title o={31} brush="brush-r">Activity</Title>
      </div>

      {data.status === 'loading' && <p style={{ fontSize: 14 }}>loading activity from Codeberg...</p>}
      {data.status === 'error' && (
        <div className="box bk" style={{ padding: 22, display: 'flex', flexDirection: 'column', gap: 10 }}>
          <h3 className="hd" style={{ fontSize: 24 }}>Codeberg did not answer</h3>
          <p style={{ fontSize: 13 }}>Activity is loaded live from Codeberg. Reload in a minute, or look directly at <a href={`https://codeberg.org/${ACTIVITY_USER}`} target="_blank" rel="noreferrer" style={{ textDecoration: 'underline' }}>codeberg.org/{ACTIVITY_USER}</a>.</p>
        </div>
      )}

      {sum && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 30 }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 22 }}>
            <Stat v={sum.total} k="contributions, past year" />
            <Stat v={sum.active} k="active days" />
            <Stat v={sum.current} k="day streak now" />
            <Stat v={sum.longest} k="longest streak (days)" />
          </div>

          <div className="box bk" style={{ padding: 22, display: 'flex', flexDirection: 'column', gap: 12 }}>
            <h3 className="hd" style={{ fontSize: 26 }}>Contribution map</h3>
            <Heatmap cells={sum.cells} max={Math.max(1, sum.max)} />
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 30, alignItems: 'stretch' }}>
            <div className="box bk" style={{ flex: '2 1 420px', padding: 22, display: 'flex', flexDirection: 'column', gap: 14, minWidth: 0 }}>
              <h3 className="hd" style={{ fontSize: 26 }}>When I code</h3>
              <Bars values={sum.hours} labels={Array.from({ length: 24 }, (_, h) => (h % 3 === 0 ? String(h).padStart(2, '0') : ''))} />
            </div>
            <div className="box bk" style={{ flex: '1 1 260px', padding: 22, display: 'flex', flexDirection: 'column', gap: 14, minWidth: 0 }}>
              <h3 className="hd" style={{ fontSize: 26 }}>Busiest days</h3>
              <Bars values={sum.weekdays} labels={DAY_NAMES} />
            </div>
          </div>

          <Commits repos={data.repos} />
          <Languages repos={data.repos} />
          <RepoCards repos={data.repos} />
        </div>
      )}
    </div>
  )
}
