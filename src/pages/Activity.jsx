import { useEffect, useMemo, useState } from 'react'
import { ACTIVITY_USER } from '../content.js'
import { fetchCommits, fetchContributions, fetchLanguages, fetchRepos, timeAgo } from '../lib/github.js'
import Title, { pageWrap } from './Title.jsx'

const WEEKS = 53
const DAY = 86400000
const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const LANG_COLORS = ['var(--acc)', '#f2f0e6', '#8a8a82', '#d6a63a', '#4a4a46', '#b8b4a2']

const dayKey = (d) => `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`
const startOfDay = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate())

// Turn daily contribution counts into the heatmap cells, streaks and per-weekday totals.
function summarise(days) {
  const perDay = new Map()
  const weekdays = Array(7).fill(0)
  let total = 0
  for (const { date, count } of days) {
    const [y, m, d] = date.split('-').map(Number)
    const day = new Date(y, m - 1, d)
    perDay.set(dayKey(day), count)
    weekdays[day.getDay()] += count
    total += count
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

  return { cells, max, total, weekdays, longest, current, active: cells.filter((c) => c.n > 0).length }
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
          <span style={{ fontSize: 10, lineHeight: '14px', height: 14, opacity: 0.7, whiteSpace: 'nowrap' }}>{labels[i]}</span>
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

function Commits({ repos, commits }) {
  const [repo, setRepo] = useState('all')
  const current = repos.find((r) => r.name === repo)
  const list = (current ? commits.filter((c) => c.repo === repo) : commits).slice(0, current ? 30 : 20)

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
          <a href={current.html_url} target="_blank" rel="noreferrer" style={{ textDecoration: 'underline' }}>open on GitHub</a>
        </p>
      )}
      {list.length === 0 && <p style={{ fontSize: 13 }}>No commits yet.</p>}
      <div>
        {list.map((c) => <CommitRow key={`${c.repo}${c.sha}`} c={c} showRepo={!current} />)}
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
            <span className="tag">updated {timeAgo(new Date(r.pushed_at))}</span>
            {r.stargazers_count > 0 && <span className="tag">{r.stargazers_count} stars</span>}
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
    Promise.all([fetchContributions(ACTIVITY_USER), fetchRepos(ACTIVITY_USER)])
      .then(async ([days, all]) => {
        const repos = all.filter((r) => !r.fork).sort((a, b) => new Date(b.pushed_at) - new Date(a.pushed_at))
        // An empty repo answers its commit list with 409; treat it as having none.
        const lists = await Promise.all(repos.map((r) => fetchCommits(ACTIVITY_USER, r.name).catch(() => [])))
        const commits = lists.flat().sort((a, b) => b.date - a.date)
        if (live) setData({ status: 'ok', days, repos, commits })
      })
      .catch(() => live && setData({ status: 'error' }))
    return () => { live = false }
  }, [])

  const sum = useMemo(() => (data.status === 'ok' ? summarise(data.days) : null), [data])
  const hours = useMemo(() => {
    const h = Array(24).fill(0)
    if (data.status === 'ok') for (const c of data.commits) h[c.date.getHours()]++
    return h
  }, [data])

  return (
    <div id="activity" style={pageWrap(64)}>
      <div className="deco d-slash" aria-hidden="true" style={{ top: 40, right: -80, width: 420, height: 96, '--r': '4deg', '--o': 3 }} />
      <div className="deco d-burst b" aria-hidden="true" style={{ top: '52%', left: -90, width: 220, height: 220, '--r': '7deg', '--o': 1 }} />
      <div className="deco d-rip" aria-hidden="true" style={{ bottom: 40, right: -90, width: 380, height: 220, '--r': '-4deg', '--o': 5 }} />
      <div className="slam" style={{ display: 'flex', flexDirection: 'column', gap: 18, marginBottom: 28, alignItems: 'flex-start' }}>
        <Title o={31} brush="brush-r">Activity</Title>
      </div>

      {data.status === 'loading' && <p style={{ fontSize: 14 }}>loading activity from GitHub...</p>}
      {data.status === 'error' && (
        <div className="box bk" style={{ padding: 22, display: 'flex', flexDirection: 'column', gap: 10 }}>
          <h3 className="hd" style={{ fontSize: 24 }}>Activity did not load</h3>
          <p style={{ fontSize: 13 }}>Activity is loaded live from GitHub. Reload in a minute, or look directly at <a href={`https://github.com/${ACTIVITY_USER}`} target="_blank" rel="noreferrer" style={{ textDecoration: 'underline' }}>github.com/{ACTIVITY_USER}</a>.</p>
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
              <Bars values={hours} labels={Array.from({ length: 24 }, (_, h) => (h % 3 === 0 ? String(h).padStart(2, '0') : ''))} />
            </div>
            <div className="box bk" style={{ flex: '1 1 260px', padding: 22, display: 'flex', flexDirection: 'column', gap: 14, minWidth: 0 }}>
              <h3 className="hd" style={{ fontSize: 26 }}>Busiest days</h3>
              <Bars values={sum.weekdays} labels={DAY_NAMES} />
            </div>
          </div>

          <Commits repos={data.repos} commits={data.commits} />
          <Languages repos={data.repos} />
          <RepoCards repos={data.repos} />
        </div>
      )}
    </div>
  )
}
