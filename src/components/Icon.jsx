// <Icon name="github" size={18} /> — renders an SVG from src/assets/icons/.
//
// Icons are kept as standalone .svg files and loaded through Vite's glob
// import. They are injected inline (not via <img>) so `currentColor` still
// works — every icon on the site tints itself from the CSS accent/muted
// colour of its parent, which an <img> reference cannot do.
// Add an icon by dropping a new .svg into src/assets/icons; its filename
// (minus extension) becomes the `name`.
const files = import.meta.glob('../assets/icons/*.svg', { query: '?raw', import: 'default', eager: true })

const registry = {}
for (const path in files) {
  const name = path.split('/').pop().replace(/\.svg$/, '')
  registry[name] = files[path]
}

export const iconNames = Object.keys(registry)

export default function Icon({ name, size = 18, style }) {
  const svg = registry[name]
  if (!svg) return null
  return (
    <span
      aria-hidden="true"
      style={{ width: size, height: size, display: 'inline-flex', flexShrink: 0, ...style }}
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  )
}
