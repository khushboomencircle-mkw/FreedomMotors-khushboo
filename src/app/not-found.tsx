import SiteLayout from './(site)/layout'
import NotFound from './(site)/not-found'

// 404 for URLs that match no route at all (e.g. /a/b/c). The root layout no longer
// carries the header/footer, so this wraps the same 404 page in the site chrome —
// identical to the 404 shown when a page calls notFound().
export default function RootNotFound() {
  return (
    <SiteLayout>
      <NotFound />
    </SiteLayout>
  )
}
