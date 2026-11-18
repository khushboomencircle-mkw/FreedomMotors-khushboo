/**
 * The pictures shown for each section in the Add section menu: small wireframes, drawn here in code so they stay
 * consistent and can be regenerated (`npm run sections:previews`). They are plain SVG files served from /public, shown
 * by the Studio in an <img>, so they use fixed colours that read on both the light and the dark Studio theme.
 *
 *   solid blocks = pictures        thin bars = text        blue = buttons and highlights
 */

const W = 160
const H = 100

const C = {
  paper: '#f4f5f8',
  frame: '#cdd2dc',
  pic: '#b5bccb',
  picDark: '#7d8699',
  textDark: '#5b6376',
  textLight: '#9aa2b4',
  white: '#ffffff',
  accent: '#2276fc',
}

const rect = (x: number, y: number, w: number, h: number, fill: string, rx = 3) =>
  `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${rx}" fill="${fill}"/>`
/** A line of text. */
const bar = (x: number, y: number, w: number, fill = C.textDark, h = 3.5) =>
  rect(x, y, w, h, fill, h / 2)
const button = (x: number, y: number, w: number, filled = true) =>
  filled
    ? rect(x, y, w, 9, C.accent, 4.5)
    : `<rect x="${x + 0.5}" y="${y + 0.5}" width="${w - 1}" height="8" rx="4" fill="none" stroke="${C.accent}"/>`
const star = (cx: number, cy: number) => {
  const pts = Array.from({length: 10}, (_, i) => {
    const r = i % 2 === 0 ? 3.6 : 1.5
    const a = (Math.PI / 5) * i - Math.PI / 2
    return `${(cx + r * Math.cos(a)).toFixed(2)},${(cy + r * Math.sin(a)).toFixed(2)}`
  })
  return `<polygon points="${pts.join(' ')}" fill="#f4b400"/>`
}

/** `n` cards side by side across the picture, each built by `card(x, w)`. */
function cardsAcross(n: number, top: number, card: (x: number, w: number) => string): string {
  const pad = 12
  const gap = 6
  const w = (W - pad * 2 - gap * (n - 1)) / n
  return Array.from({length: n}, (_, i) => card(pad + i * (w + gap), w)).join('')
}

const drawings: Record<string, () => string> = {
  bannerSection: () =>
    [
      rect(8, 8, 144, 84, C.picDark, 4),
      rect(8, 8, 144, 84, 'rgba(0,0,0,0.18)', 4),
      bar(20, 34, 70, C.white, 5),
      bar(20, 45, 50, C.white, 5),
      bar(20, 58, 62, 'rgba(255,255,255,0.7)'),
      button(20, 70, 34),
    ].join(''),

  cardsGridSection: () =>
    [
      bar(12, 10, 54, C.textDark, 4.5),
      cardsAcross(3, 24, (x, w) =>
        [
          rect(x, 24, w, 36, C.pic),
          bar(x, 66, w * 0.8),
          bar(x, 73, w * 0.55, C.textLight),
          bar(x, 82, w * 0.4, C.accent, 3),
        ].join(''),
      ),
    ].join(''),

  featureGridSection: () =>
    [
      bar(12, 10, 60, C.textDark, 4.5),
      cardsAcross(3, 24, (x, w) =>
        [
          rect(x, 24, w, 66, C.picDark),
          rect(x, 24, w, 66, 'rgba(0,0,0,0.2)'),
          bar(x + 4, 70, w * 0.7, C.white),
          bar(x + 4, 77, w * 0.45, 'rgba(255,255,255,0.7)'),
        ].join(''),
      ),
    ].join(''),

  accordionSection: () => {
    const row = (y: number, open: boolean) =>
      [
        rect(12, y, 136, open ? 26 : 14, C.white, 3),
        `<rect x="12.5" y="${y + 0.5}" width="135" height="${open ? 25 : 13}" rx="3" fill="none" stroke="${C.frame}"/>`,
        bar(18, y + 5, 70, C.textDark),
        // chevron
        `<path d="${open ? `M136 ${y + 8} l4 -4 l4 4` : `M136 ${y + 4} l4 4 l4 -4`}" fill="none" stroke="${C.textDark}" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>`,
        open ? bar(18, y + 14, 110, C.textLight) + bar(18, y + 20, 80, C.textLight) : '',
      ].join('')
    return [bar(12, 8, 50, C.textDark, 4.5), row(20, true), row(50, false), row(68, false)].join('')
  },

  linkListSection: () =>
    [
      rect(10, 10, 54, 80, C.pic),
      ...[0, 1, 2, 3].map((i) =>
        [
          bar(74, 14 + i * 20, i % 2 ? 54 : 66),
          bar(74, 22 + i * 20, 40, C.textLight),
          `<rect x="74" y="${29 + i * 20}" width="76" height="1" fill="${C.frame}"/>`,
        ].join(''),
      ),
    ].join(''),

  customHtmlSection: () => {
    const code = (indent: number, y: number, w: number, fill = C.textDark) =>
      bar(18 + indent * 8, y, w, fill, 3.5)
    return [
      rect(10, 10, 140, 80, '#2b2f3a', 4),
      // < / > mark
      `<path d="M24 26 l-8 8 l8 8 M42 26 l8 8 l-8 8 M36 24 l-6 20" fill="none" stroke="${C.accent}" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" transform="translate(52 0)"/>`,
      code(0, 54, 40, '#6ea8fe'),
      code(1, 62, 60, '#9aa2b4'),
      code(1, 70, 48, '#9aa2b4'),
      code(0, 78, 30, '#6ea8fe'),
    ].join('')
  },

  photoGallerySection: () =>
    [
      rect(10, 10, 62, 80, C.pic),
      rect(78, 10, 34, 38, C.picDark),
      rect(116, 10, 34, 38, C.pic),
      rect(78, 52, 34, 38, C.pic),
      rect(116, 52, 34, 38, C.picDark),
    ].join(''),

  callToActionSection: () =>
    [
      rect(8, 14, 144, 72, C.white, 6),
      `<rect x="8.5" y="14.5" width="143" height="71" rx="6" fill="none" stroke="${C.frame}"/>`,
      bar(44, 30, 72, C.textDark, 5),
      bar(56, 42, 48, C.textLight),
      button(44, 58, 34),
      button(82, 58, 34, false),
    ].join(''),

  googleReviewsSection: () =>
    [
      bar(12, 10, 64, C.textDark, 4.5),
      cardsAcross(3, 26, (x, w) =>
        [
          rect(x, 26, w, 62, C.white),
          `<rect x="${x + 0.5}" y="26.5" width="${w - 1}" height="61" rx="3" fill="none" stroke="${C.frame}"/>`,
          [0, 1, 2, 3, 4].map((i) => star(x + 6 + i * ((w - 12) / 4), 36)).join(''),
          bar(x + 5, 47, w - 10, C.textLight),
          bar(x + 5, 54, w - 16, C.textLight),
          bar(x + 5, 61, w - 22, C.textLight),
          `<circle cx="${x + 10}" cy="77" r="5" fill="${C.pic}"/>`,
          bar(x + 19, 75, w * 0.4, C.textDark),
        ].join(''),
      ),
    ].join(''),

  vehicleCarouselSection: () => {
    const car = (x: number, w: number) =>
      [
        rect(x, 24, w, 66, C.white),
        `<rect x="${x + 0.5}" y="24.5" width="${w - 1}" height="65" rx="3" fill="none" stroke="${C.frame}"/>`,
        rect(x + 4, 28, w - 8, 30, C.pic),
        // a simple van silhouette
        rect(x + w * 0.2, 38, w * 0.6, 11, C.picDark, 3),
        `<circle cx="${x + w * 0.32}" cy="51" r="3.2" fill="${C.textDark}"/>`,
        `<circle cx="${x + w * 0.68}" cy="51" r="3.2" fill="${C.textDark}"/>`,
        bar(x + 5, 64, w * 0.7, C.textDark),
        bar(x + 5, 72, w * 0.45, C.accent),
        bar(x + 5, 80, w * 0.35, C.textLight),
      ].join('')
    return [
      bar(12, 10, 56, C.textDark, 4.5),
      cardsAcross(3, 24, car),
      // arrows
      `<path d="M7 56 l-3 -4 l3 -4" fill="none" stroke="${C.textDark}" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>`,
      `<path d="M153 56 l3 -4 l-3 -4" fill="none" stroke="${C.textDark}" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>`,
    ].join('')
  },

  staticSection: () =>
    [
      `<rect x="14.5" y="14.5" width="131" height="71" rx="5" fill="none" stroke="${C.textLight}" stroke-dasharray="5 4"/>`,
      // a pin
      `<path d="M80 30 a8 8 0 1 1 0.01 0 z M80 38 v14" fill="none" stroke="${C.textDark}" stroke-width="2" stroke-linecap="round"/>`,
      bar(52, 62, 56, C.textDark),
      bar(60, 71, 40, C.textLight),
    ].join(''),
}

/** The section types that have a picture. */
export const PREVIEW_TYPES = Object.keys(drawings)

/** The complete SVG file for one section type, or undefined for a type without a picture. */
export function sectionPreviewSvg(sectionType: string): string | undefined {
  const draw = drawings[sectionType]
  if (!draw) return undefined
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}">` +
    `<rect width="${W}" height="${H}" rx="8" fill="${C.paper}"/>` +
    draw() +
    `</svg>\n`
  )
}
