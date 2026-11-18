// TEMPORARY verification page for the image work — deleted before the task ends. Not part of the change.
import PageSection, {type Section} from '@/components/PageSection'
import SiteImage from '@/components/SiteImage'
import VehicleImageGallery from '@/components/VehicleImageGallery'
import {vehiclePhotoUrl} from '@/lib/imageUrl'

const U = (id: string) => `https://cdn.sanity.io/images/sp8bk444/production/${id}`
const IMG = {
  a: U('401781c974808c7eab01128637d46785086b59a8-2925x2194.jpg'),
  b: U('16d9af966b86191d80ad68802111173e5ec60f0d-1600x1200.jpg'),
  c: U('2200be4e5a1ee0d71799ded2c086c3560bbb3338-1758x879.jpg'),
  d: U('10fd453e17dec07023d273daffd362565c11c7bc-1024x683.jpg'),
}
const VEHICLE = '3f2b8c1e-5a6d-4e7f-9b0a-1c2d3e4f5a6b'
const SHA = 'ab'.repeat(32)
const photo = (n: number) => `vehicles/${VEHICLE}/${SHA.slice(0, 63)}${n}.jpg`
const SB = 'http://127.0.0.1:54399/storage/v1/object/public/vehicle-photos/vehicles/' + VEHICLE

const sections = [
  {_key: 's1', _type: 'photoGallerySection', sectionHeading: 'Grid gallery', layout: 'grid', columns: '3', lightbox: true, photos: [IMG.a, IMG.b, IMG.c].map((url, i) => ({_key: 'p' + i, url, alt: 'Grid photo ' + i}))},
  {_key: 's2', _type: 'photoGallerySection', sectionHeading: 'Slider gallery', layout: 'slider', lightbox: true, photos: [IMG.d, IMG.b, IMG.c].map((url, i) => ({_key: 'q' + i, url, alt: 'Slider photo ' + i}))},
  {_key: 's3', _type: 'featureGridSection', sectionHeading: 'Hero slider', featureDisplayMode: 'horizontalScroll', cardWidthPreset: 'full', cardHeight: 420, sliderShowDots: true, showScrollArrows: true,
    features: [
      {_key: 'f1', title: 'One', mediaType: 'image', image: {url: IMG.c, alt: 'one'}},
      {_key: 'f2', title: 'Two', mediaType: 'image', image: {url: IMG.d, alt: 'two'}},
      {_key: 'f3', title: 'Video', mediaType: 'video', videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', videoThumbnail: {url: IMG.b, alt: 'video thumb'}},
    ]},
  {_key: 's4', _type: 'featureGridSection', sectionHeading: 'Scroller', featureDisplayMode: 'horizontalScroll', cardWidthPreset: 'normal', cardHeight: 300,
    features: [
      {_key: 'g1', title: 'Card', mediaType: 'image', image: {url: IMG.a, alt: 'card'}},
      {_key: 'g2', title: 'Video card', mediaType: 'video', videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', videoThumbnail: {url: IMG.c, alt: 'vt'}},
      {_key: 'g3', title: 'No image', mediaType: 'image'},
    ]},
  {_key: 's5', _type: 'bannerSection', sectionType: 'standard', heading: 'Standard + bg', images: [{_key: 'i1', url: IMG.d, alt: 'standard one'}], container: {enableBackgroundImage: true, backgroundImage: IMG.c, backgroundOverlay: 40}},
] as unknown as Section[]

const box: React.CSSProperties = {position: 'relative', width: 240, height: 160, border: '2px solid #888', background: '#222'}

export default function Page() {
  return (
    <div className="w-full" style={{background: '#111', color: '#fff'}}>
      <div data-check="fallbacks" style={{display: 'flex', gap: 16, flexWrap: 'wrap', padding: 16}}>
        <div data-case="no-src" style={box}><SiteImage src={undefined} alt="no src" sizes="cardGrid3" fill className="object-cover" /></div>
        <div data-case="empty" style={box}><SiteImage src="" alt="empty" sizes="cardGrid3" fill className="object-cover" /></div>
        <div data-case="malformed" style={box}><SiteImage src="vehicles/../../etc/passwd" alt="malformed" sizes="cardGrid3" fill className="object-cover" /></div>
        <div data-case="js-scheme" style={box}><SiteImage src="javascript:alert(1)" alt="js" sizes="cardGrid3" fill className="object-cover" /></div>
        <div data-case="broken-404" style={box}><SiteImage src={`${SB}/missing.jpg`} alt="404" sizes="cardGrid3" fill className="object-cover" /></div>
        <div data-case="broken-host" style={box}><SiteImage src="https://evil.example.com/a.jpg" alt="evil" sizes="cardGrid3" fill className="object-cover" /></div>
        <div data-case="broken-sanity" style={box}><SiteImage src={U('0000000000000000000000000000000000000000-100x100.jpg')} alt="gone" sizes="cardGrid3" fill className="object-cover" /></div>
        <div data-case="natural-no-src" style={{width: 240, border: '2px solid #888'}}><SiteImage src={null} alt="natural" sizes="cardGrid3" width={240} height={160} style={{width: '100%', height: 'auto'}} /></div>
        <div data-case="ok-sanity" style={box}><SiteImage src={IMG.d} alt="ok" sizes="cardGrid3" fill className="object-cover" /></div>
        <div data-case="ok-supabase" style={box}><SiteImage src={vehiclePhotoUrl(photo(1))} alt="sb" sizes="cardGrid3" fill className="object-cover" /></div>
      </div>
      <div data-check="vehicle-gallery" style={{maxWidth: 1100, margin: '0 auto', padding: 16}}>
        <VehicleImageGallery mainImage={vehiclePhotoUrl(photo(1))} mainImageAlt="Test van" gallery={[{url: IMG.b}, {url: IMG.c}, {url: `${SB}/missing.jpg`}]} />
      </div>
      {sections.map((s, i) => <PageSection key={s._key} section={s} isFirst={i === 0} />)}
    </div>
  )
}
