import { Suspense, lazy, useCallback, useMemo, useRef } from 'react'

// Each of the ten ReactBits backgrounds the banner can show. Loaders are
// dynamic imports so only the randomly-chosen effect's chunk (and its WebGL
// deps) is ever downloaded — the other nine cost nothing at runtime.
const LOADERS = {
  SideRays: () => import('./backgrounds/SideRays.jsx'),
  ColorBends: () => import('./backgrounds/ColorBends.jsx'),
  LineWaves: () => import('./backgrounds/LineWaves.jsx'),
  SoftAurora: () => import('./backgrounds/SoftAurora.jsx'),
  Plasma: () => import('./backgrounds/Plasma.jsx'),
  // GridScan is a named-only export; webcam stays off so it never asks for a camera.
  GridScan: () => import('./backgrounds/GridScan.jsx').then((m) => ({ default: m.GridScan })),
  Dither: () => import('./backgrounds/Dither.jsx'),
  RippleGrid: () => import('./backgrounds/RippleGrid.jsx'),
  ShapeGrid: () => import('./backgrounds/ShapeGrid.jsx'),
  Balatro: () => import('./backgrounds/Balatro.jsx'),
}

// Per-effect prop overrides (defaults are used for everything else).
const PROPS = {
  GridScan: { enableWebcam: false },
}

const NAMES = Object.keys(LOADERS)

// Max parallax shift in px. The effect layer is inset by OVERSCAN on every
// side, so shifting up to SHIFT keeps its edges outside the frame — the
// effect moves with the cursor but never reveals a seam.
const SHIFT = 12
const OVERSCAN = 26

export default function Banner() {
  // Pick one effect for the life of this mount (i.e. per page load).
  const name = useMemo(() => NAMES[Math.floor(Math.random() * NAMES.length)], [])
  const Effect = useMemo(() => lazy(LOADERS[name]), [name])
  const layerRef = useRef(null)

  const onMove = useCallback((e) => {
    const r = e.currentTarget.getBoundingClientRect()
    const dx = (e.clientX - (r.left + r.width / 2)) / (r.width / 2)
    const dy = (e.clientY - (r.top + r.height / 2)) / (r.height / 2)
    if (layerRef.current) {
      layerRef.current.style.transform =
        `translate(${(dx * SHIFT).toFixed(1)}px, ${(dy * SHIFT).toFixed(1)}px)`
    }
  }, [])

  const onLeave = useCallback(() => {
    if (layerRef.current) layerRef.current.style.transform = 'translate(0,0)'
  }, [])

  return (
    <div
      onMouseMove={onMove}
      onMouseLeave={onLeave}
      style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}
    >
      <div
        ref={layerRef}
        style={{
          position: 'absolute',
          inset: `-${OVERSCAN}px`,
          transition: 'transform .35s cubic-bezier(.22,.61,.36,1)',
          willChange: 'transform',
        }}
      >
        <Suspense fallback={null}>
          <Effect {...(PROPS[name] || {})} />
        </Suspense>
      </div>
    </div>
  )
}
