// Page heading: brush-stroke backer plus the flashing letter blocks.
export default function Title({ o, brush, children }) {
  return (
    <h2 className="ttl" style={{ '--o': o, '--tb': `var(--${brush})` }}>
      <span className="wob">{children}</span>
      <i className="fl f1" /><i className="fl f2" /><i className="fl f3" /><i className="fl f4" /><i className="fl f5" />
    </h2>
  )
}

export const pageWrap = (top) => ({ maxWidth: 1160, margin: '0 auto', padding: `${top}px 16px 0`, position: 'relative', zIndex: 1 })
