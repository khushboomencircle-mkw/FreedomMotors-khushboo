import type {ReactNode} from 'react'
import type {ThumbKind} from './presets'

/**
 * Small wireframe pictures for the layout picker. Drawn in code (no image files to make or keep in sync), in the
 * current text colour so they follow the Studio's light and dark themes.
 *
 *   solid blocks  = pictures        thin bars = text
 */

const W = 72
const H = 48

/** A picture block. */
const Pic = ({x, y, w, h}: {x: number; y: number; w: number; h: number}) => (
  <rect x={x} y={y} width={w} height={h} rx={2} fill="currentColor" opacity={0.5} />
)
/** A line of text. */
const Txt = ({x, y, w}: {x: number; y: number; w: number}) => (
  <rect x={x} y={y} width={w} height={2.5} rx={1.25} fill="currentColor" opacity={0.85} />
)

/** `n` cards in a row, each a picture with two text lines under it. */
function cardRow(n: number, top = 8, height = 32): ReactNode {
  const gap = 4
  const pad = 6
  const w = (W - pad * 2 - gap * (n - 1)) / n
  return Array.from({length: n}, (_, i) => {
    const x = pad + i * (w + gap)
    return (
      <g key={i}>
        <Pic x={x} y={top} w={w} h={height - 10} />
        <Txt x={x} y={top + height - 6} w={w * 0.8} />
        <Txt x={x} y={top + height - 1.5} w={w * 0.55} />
      </g>
    )
  })
}

/**
 * Mosaic with `cols` columns, laid out the way the website does it: the first tile of every five is a big 2×2 tile
 * (or the full width when there are only two columns) and the rest are single cells, filling left to right.
 */
function mosaic(cols: number): ReactNode {
  const rows = 3
  const pad = 6
  const gap = 3
  const cw = (W - pad * 2 - gap * (cols - 1)) / cols
  const ch = (H - 8 - gap * (rows - 1)) / rows
  const taken = Array.from({length: rows}, () => Array<boolean>(cols).fill(false))
  const tiles: ReactNode[] = []
  /** First free spot (left to right, top to bottom) where a w×h tile fits. */
  const findSpot = (w: number, h: number): [number, number] | undefined => {
    for (let r = 0; r + h <= rows; r++) {
      for (let c = 0; c + w <= cols; c++) {
        let free = true
        for (let dr = 0; dr < h; dr++)
          for (let dc = 0; dc < w; dc++) if (taken[r + dr][c + dc]) free = false
        if (free) return [r, c]
      }
    }
    return undefined
  }
  for (let i = 0; ; i++) {
    let w = i % 5 === 0 ? Math.min(2, cols) : 1
    let h = i % 5 === 0 ? 2 : 1
    let spot = findSpot(w, h)
    // The picture only has room for three rows: a big tile that doesn't fit is drawn as a single one.
    if (!spot && h === 2) {
      w = 1
      h = 1
      spot = findSpot(w, h)
    }
    if (!spot) break
    const [r, c] = spot
    for (let dr = 0; dr < h; dr++) for (let dc = 0; dc < w; dc++) taken[r + dr][c + dc] = true
    tiles.push(
      <Pic
        key={i}
        x={pad + c * (cw + gap)}
        y={4 + r * (ch + gap)}
        w={cw * w + gap * (w - 1)}
        h={ch * h + gap * (h - 1)}
      />,
    )
  }
  return <g>{tiles}</g>
}

function drawing(kind: ThumbKind): ReactNode {
  switch (kind) {
    case 'mosaic2':
      return mosaic(2)
    case 'mosaic3':
      return mosaic(3)
    case 'mosaic4':
      return mosaic(4)
    case 'grid2':
      return cardRow(2)
    case 'grid3':
      return cardRow(3)
    case 'grid4':
      return cardRow(4)
    case 'mosaic':
      return (
        <g>
          <Pic x={6} y={7} w={26} h={34} />
          <Pic x={36} y={7} w={30} h={15} />
          <Pic x={36} y={26} w={14} h={15} />
          <Pic x={52} y={26} w={14} h={15} />
        </g>
      )
    case 'list':
      return (
        <g>
          {[0, 1, 2].map((i) => (
            <g key={i}>
              <Pic x={6} y={6 + i * 13} w={18} h={10} />
              <Txt x={28} y={8.5 + i * 13} w={36} />
              <Txt x={28} y={13 + i * 13} w={24} />
            </g>
          ))}
        </g>
      )
    case 'slider':
      return (
        <g>
          <Pic x={16} y={6} w={40} h={26} />
          <Txt x={16} y={36} w={32} />
          <Txt x={16} y={41} w={22} />
          <rect x={2} y={6} width={9} height={26} rx={2} fill="currentColor" opacity={0.2} />
          <rect x={61} y={6} width={9} height={26} rx={2} fill="currentColor" opacity={0.2} />
        </g>
      )
    case 'scroller':
      return (
        <g>
          <Pic x={4} y={8} w={24} h={22} />
          <Pic x={32} y={8} w={24} h={22} />
          <Pic x={60} y={8} w={24} h={22} />
          <Txt x={4} y={34} w={18} />
          <Txt x={32} y={34} w={18} />
          <rect x={4} y={42} width={30} height={2} rx={1} fill="currentColor" opacity={0.85} />
          <rect x={4} y={42} width={64} height={2} rx={1} fill="currentColor" opacity={0.2} />
        </g>
      )
    case 'overImage':
      return (
        <g>
          <Pic x={6} y={6} w={60} h={36} />
          <rect x={14} y={19} width={28} height={2.5} rx={1.25} fill="#fff" opacity={0.95} />
          <rect x={14} y={25} width={20} height={2.5} rx={1.25} fill="#fff" opacity={0.8} />
        </g>
      )
    case 'aboveImage':
      return (
        <g>
          <Txt x={6} y={7} w={32} />
          <Txt x={6} y={13} w={22} />
          <Pic x={6} y={20} w={60} h={22} />
        </g>
      )
    case 'belowImage':
      return (
        <g>
          <Pic x={6} y={6} w={60} h={22} />
          <Txt x={6} y={33} w={32} />
          <Txt x={6} y={39} w={22} />
        </g>
      )
    case 'boxLayout':
      return (
        <g>
          <rect
            x={6}
            y={5}
            width={60}
            height={38}
            rx={3}
            fill="none"
            stroke="currentColor"
            opacity={0.7}
          />
          <Txt x={11} y={9} w={28} />
          <Pic x={11} y={15} w={50} h={15} />
          <Txt x={11} y={34} w={36} />
        </g>
      )
    case 'besideImage':
      return (
        <g>
          <Txt x={6} y={14} w={26} />
          <Txt x={6} y={20} w={22} />
          <Txt x={6} y={26} w={24} />
          <Pic x={38} y={7} w={28} h={34} />
        </g>
      )
    case 'imageLeft':
      return (
        <g>
          <Pic x={6} y={7} w={26} h={34} />
          {[0, 1, 2, 3].map((i) => (
            <Txt key={i} x={38} y={10 + i * 8} w={i % 2 ? 22 : 28} />
          ))}
        </g>
      )
    case 'imageRight':
      return (
        <g>
          <Pic x={40} y={7} w={26} h={34} />
          {[0, 1, 2, 3].map((i) => (
            <Txt key={i} x={6} y={10 + i * 8} w={i % 2 ? 22 : 28} />
          ))}
        </g>
      )
  }
}

export default function LayoutThumb({kind}: {kind: ThumbKind}) {
  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      width="100%"
      role="presentation"
      aria-hidden="true"
      data-thumb={kind}
      style={{display: 'block', maxWidth: 108}}
    >
      {drawing(kind)}
    </svg>
  )
}
