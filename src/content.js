// Site copy and lists. Entries in [brackets] are placeholders to fill in.

export const SONGS = [
  { title: 'Stick N Move (Demo)', artist: 'Linkin Park', album: 'Hybrid Theory (20th Anniversary)', cover: '/covers/lp.jpg', audio: '/audio/lp.mp3' },
  { title: 'A Certain Shade of Green', artist: 'Incubus', album: 'S.C.I.E.N.C.E.', cover: '/covers/inc.jpg', audio: '/audio/inc.mp3' },
  { title: 'Snot', artist: 'Snot', album: 'Get Some', cover: '/covers/snot.jpg', audio: '/audio/snot.mp3' },
]

// Shelf on the Music page: the playable songs first, then the rest of the collection.
export const ALBUMS = [
  ...SONGS,
  { album: 'Adrenaline', artist: 'Deftones', cover: '/covers/adrenaline.jpg' },
  { album: 'Make Yourself', artist: 'Incubus', cover: '/covers/makeyourself.jpg' },
  { album: 'Around the Fur', artist: 'Deftones', cover: '/covers/aroundthefur.jpg' },
  { album: 'Introduction to Mayhem', artist: 'Primer 55', cover: '/covers/mayhem.jpg' },
  { album: 'Trigger', artist: 'Design19', cover: '/covers/trigger.jpg' },
  { album: 'Issues', artist: 'Korn', cover: '/covers/issues.jpg' },
  { album: 'Significant Other', artist: 'Limp Bizkit', cover: '/covers/significantother.jpg' },
  { album: 'Requiem', artist: 'Korn', cover: '/covers/requiem.jpg' },
]

export const PROJECTS = [
  { name: '[Project one]', status: 'live', cat: 'mods', tags: ['tag', 'tag'] },
  { name: '[Project two]', status: 'in progress', cat: 'tools', tags: ['tag', 'tag'] },
  { name: '[Project three]', status: 'archived', cat: 'web', tags: ['tag', 'tag'] },
  { name: '[Project four]', status: 'idea', cat: 'other', tags: ['tag', 'tag'] },
  { name: '[Project five]', status: 'live', cat: 'web', tags: ['tag', 'tag'] },
  { name: '[Project six]', status: 'in progress', cat: 'mods', tags: ['tag', 'tag'] },
  { name: '[Project seven]', status: 'live', cat: 'tools', tags: ['tag', 'tag'] },
]

export const PROJECT_FILTERS = ['all', 'mods', 'tools', 'web', 'other']

export const STATS = [
  { v: '00', k: 'stat one' },
  { v: '00', k: 'stat two' },
  { v: '00', k: 'stat three' },
  { v: '00', k: 'stat four' },
]

export const SKILLS = ['skill', 'skill', 'skill', 'skill', 'skill', 'skill', 'skill']

export const TIMELINE = [{ year: '[year]' }, { year: '[year]' }, { year: '[year]' }]

export const CHANGELOG = [
  { v: 'v0.3', w: '80%' },
  { v: 'v0.2', w: '65%' },
  { v: 'v0.1', w: '50%' },
]

export const INTERESTS = 'music, code, [thing], [thing]'

export const EMAIL = 'ethebee3@gmail.com'

export const LINKS = [
  { label: 'GitHub', href: 'https://github.com/e-the-bee' },
  { label: 'Discord', href: 'https://discord.com/users/1164594827883728987' },
]

// Copied from the old site's About and Do Not Interact tabs.
export const BIO = [
  'I make minecraft mods, plugins, and websites. I also sometimes make mods and plugins for free, contact me with cool ideas!',
  "Kindness toward all kinds of people is the goal, it isn't my place to punish others for their wrongdoings.",
  "People are hypocrites, knowingly or not, but it takes courage to admit when you've been one and to make up for it.",
]
export const BIO_LINK = 'https://nohello.net/'

export const DNI = [
  'Are aggressive or hostile',
  'Are under 15',
  'Makes everything political (having views is fine, keep it respectful)',
  'CSA apologists / content',
  'Lie with intent to deceive or hurt',
  'Thrive on drama or stir up things for attention',
  "Are highly prejudiced (opinions are fine, obsession isn't)",
]

// Copied from the old site's AI Use Policy tab.
export const AI_POLICY = [
  'I use AI to speed up and streamline my own projects. Every part that matters: the functionality, the ideas, the research into game mechanics, the outside sources, comes from me. AI doesn\'t originate any of that.',
  "What I use it for is the low-creativity work: organizing and refactoring code, making repetitive changes, and generating code from mock/flow code I've already written. Basically, the parts that don't require real thinking to finish.",
  "AI is a tool, and I treat it like one. If a piece of a project needs creativity, problem-solving, or actual thought, I don't hand it off.",
  "I don't judge how other people use AI, with a few exceptions. I don't respect:",
]
export const AI_POLICY_DISLIKES = [
  'Lying about using it',
  'AI-generated art',
  '"Vibe-coded" workflows where someone vaguely describes what they want and ships whatever comes out',
  'Selling cheap AI-made products meant to trick the buyer',
]

// GitHub account whose activity the Activity page shows.
export const ACTIVITY_USER = 'e-the-bee'

// Bio shown on the Discord profile card.
export const DISCORD_BIO = [
  'available times:',
  '3pm to 7pm weekdays',
  '12am to 7pm weekends',
  'read social tab before contacting',
]
