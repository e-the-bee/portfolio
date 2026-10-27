import { BONE, INK } from '../theme.js'

// Jagged eighth note: stem, spiky flag and a chipped note head in one outline.
const NOTE = 'M33 3 L36 2 L38 9 L45 14 L43 18 L51 24 L48 29 L52 36 L45 34 L38 28 L37 48 L41 53 L37 59 L29 57 L22 59 L13 56 L8 51 L11 44 L6 41 L14 36 L21 38 L27 40 L28 12 Z'

export default function Logo() {
  return (
    <div className="logoW">
      <div className="sh" aria-hidden="true" />
      <svg className="wob" viewBox="0 0 60 60" width="60" height="60" role="img" aria-label="Logo" style={{ display: 'block', overflow: 'visible' }}>
        <path d={NOTE} transform="translate(4 4)" fill={BONE} />
        <path d={NOTE} fill={INK} stroke={BONE} strokeWidth="1.5" strokeLinejoin="miter" />
      </svg>
    </div>
  )
}
