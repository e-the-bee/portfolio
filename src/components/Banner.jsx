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

const NAMES = Object.keys(LOADERS)

function hexToRgb01(hex) {
  const h = hex.replace('#', '')
  const full = h.length === 3 ? h.split('').map((c) => c + c).join('') : h
  const n = parseInt(full, 16)
  return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255]
}

// Map the avatar-derived palette [primary, secondary, tertiary, dark] onto each
// effect's own colour props, so whichever effect shows matches the pfp.
function colorProps(name, [c1, c2, c3, dark]) {
  switch (name) {
    case 'SideRays': return { rayColor1: c1, rayColor2: c2 }
    case 'ColorBends': return { colors: [c1, c2, c3] }
    case 'LineWaves': return { color1: c1, color2: c2, color3: c3 }
    case 'SoftAurora': return { color1: c1, color2: c2 }
    case 'Plasma': return { color: c1 }
    case 'GridScan': return { linesColor: dark, scanColor: c1, enableWebcam: false }
    case 'Dither': return { waveColor: hexToRgb01(c1) }
    case 'RippleGrid': return { gridColor: c1 }
    case 'ShapeGrid': return { borderColor: c1, hoverFillColor: c2 }
    case 'Balatro': return { color1: c1, color2: c2, color3: dark }
    default: return {}
  }
}

// Max parallax shift in px. The effect layer is inset by OVERSCAN on every
// side, so shifting up to SHIFT keeps its edges outside the frame — the
// effect moves with the cursor but never reveals a seam.
const SHIFT = 12
const OVERSCAN = 26

export default function Banner({ ready, colors = [] }) {
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
        {ready && (
          <Suspense fallback={null}>
            {/* keyed on colours so a late palette update remounts with the right tint */}
            <Effect key={colors.join(',')} {...colorProps(name, colors)} />
          </Suspense>
        )}
      </div>
    </div>
  )
}
