// Thin client for the public Codeberg (Forgejo) API. Responses are cached in
// sessionStorage for a few minutes so flipping between pages stays cheap.
const API = 'https://codeberg.org/api/v1'
const TTL = 5 * 60 * 1000

function readCache(key) {
  try {
    const hit = JSON.parse(sessionStorage.getItem(key))
    if (hit && Date.now() - hit.at < TTL) return hit.data
  } catch { /* storage unavailable or corrupt */ }
  return null
}

function writeCache(key, data) {
  try { sessionStorage.setItem(key, JSON.stringify({ at: Date.now(), data })) } catch { /* storage full or blocked */ }
}

async function get(path) {
  const key = `cb:${path}`
  const cached = readCache(key)
  if (cached) return cached
  const res = await fetch(`${API}${path}`, { headers: { Accept: 'application/json' } })
  if (!res.ok) throw new Error(`Codeberg ${res.status}`)
  const data = await res.json()
  writeCache(key, data)
  return data
}

export const fetchRepos = (user) => get(`/users/${user}/repos?limit=50`)

// [{ timestamp (s), contributions }]
export const fetchHeatmap = (user) => get(`/users/${user}/heatmap`)

// { Language: bytes }
export const fetchLanguages = (user, repo) => get(`/repos/${user}/${repo}/languages`)

export async function fetchCommits(user, repo, limit) {
  const list = await get(`/repos/${user}/${repo}/commits?limit=${limit}&stat=false&verification=false&files=false`)
  return list.map((c) => ({
    repo,
    sha: c.sha.slice(0, 7),
    message: c.commit.message.split('\n')[0],
    date: new Date(c.created),
    url: c.html_url,
  }))
}

export function timeAgo(date, now = Date.now()) {
  const s = Math.max(0, (now - date.getTime()) / 1000)
  if (s < 60) return 'just now'
  if (s < 3600) return `${Math.floor(s / 60)}m ago`
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`
  if (s < 86400 * 30) return `${Math.floor(s / 86400)}d ago`
  if (s < 86400 * 365) return `${Math.floor(s / (86400 * 30))}mo ago`
  return `${Math.floor(s / (86400 * 365))}y ago`
}
