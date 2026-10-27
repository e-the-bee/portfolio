// Fetches Discord presence from the Lanyard API and returns what the app renders.
// Throws on failure; the caller picks the fallback.

const CDN = 'https://cdn.discordapp.com'

export async function fetchPresence(discordId) {
  const res = await fetch(`https://api.lanyard.rest/v1/users/${discordId}`)
  const json = await res.json()
  if (!json.success) throw new Error('lanyard request failed')

  const { discord_user: user, discord_status: statusKey } = json.data
  const name = user.global_name || user.username || 'user'
  const avatarUrl = user.avatar
    ? `${CDN}/avatars/${user.id}/${user.avatar}.${user.avatar.startsWith('a_') ? 'gif' : 'png'}?size=256`
    : `${CDN}/embed/avatars/${(Number(user.discriminator) || 0) % 5}.png`

  return { displayName: name, userTag: '@' + (user.username || name), avatarUrl, statusKey }
}
