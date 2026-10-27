// Client for the public GitHub REST API (60 requests/hour per visitor without a token). Responses are
// cached in sessionStorage for a few minutes so flipping between pages stays cheap.
const API = 'https://api.github.com'
// GitHub has no public contribution-graph endpoint (GraphQL needs a token), so the graph comes from a
// community mirror of it.
const CONTRIBUTIONS_API = 'https://github-contributions-api.jogruber.de/v4'
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

async function get(url) {
  const key = `gh:${url}`
  const cached = readCache(key)
  if (cached) return cached
  const res = await fetch(url)
  if (!res.ok) throw new Error(`GitHub ${res.status}`)
  const data = await res.json()
  writeCache(key, data)
  return data
}

export const fetchRepos = (user) => get(`${API}/users/${user}/repos?type=owner&per_page=100`)

// [{ date: 'YYYY-MM-DD', count }] for the past year
export const fetchContributions = (user) => get(`${CONTRIBUTIONS_API}/${user}?y=last`).then((r) => r.contributions)

// { Language: bytes }
export const fetchLanguages = (user, repo) => get(`${API}/repos/${user}/${repo}/languages`)

export async function fetchCommits(user, repo) {
  const list = await get(`${API}/repos/${user}/${repo}/commits?author=${user}&per_page=100`)
  return list.map((c) => ({
    repo,
    sha: c.sha.slice(0, 7),
    message: c.commit.message.split('\n')[0],
    date: new Date(c.commit.author.date),
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
