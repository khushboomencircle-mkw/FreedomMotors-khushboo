import assert from 'node:assert/strict'
import {describe, it} from 'node:test'
import {
  TemplateUnavailableError,
  activeTemplateCards,
  buildPageFromTemplate,
  findDisplayOrderProblems,
  latestVersions,
  pickUsableTemplate,
} from './resolve'
import {TEMPLATE_CONTENT_QUERY, TEMPLATE_LIST_QUERY, draftIdOf, publishedIdOf} from './queries'

// Run with: npm run test:templates

describe('latest version wins (drafts included)', () => {
  it('uses the draft when there is one, and reports the published id', () => {
    const docs = [
      {_id: 'pageTemplate-a', title: 'Published A'},
      {_id: 'drafts.pageTemplate-a', title: 'Draft A'},
      {_id: 'pageTemplate-b', title: 'Only published B'},
    ]
    const latest = latestVersions(docs)
    assert.equal(latest.length, 2)
    assert.deepEqual(latest.find((d) => d._id === 'pageTemplate-a')?.title, 'Draft A')
    assert.deepEqual(latest.find((d) => d._id === 'pageTemplate-b')?.title, 'Only published B')
  })
  it('does not depend on the order the API returns them in', () => {
    const a = latestVersions([
      {_id: 'drafts.t', title: 'D'},
      {_id: 't', title: 'P'},
    ])
    const b = latestVersions([
      {_id: 't', title: 'P'},
      {_id: 'drafts.t', title: 'D'},
    ])
    assert.equal(a[0].title, 'D')
    assert.equal(b[0].title, 'D')
  })
  it('a template that exists only as a draft is still available', () => {
    assert.equal(latestVersions([{_id: 'drafts.t', title: 'Draft only'}])[0]._id, 't')
  })
})

describe('only active templates are offered', () => {
  it('hides inactive ones, judged on the latest version', () => {
    const cards = activeTemplateCards([
      {_id: 'a', title: 'A published on', isActive: true},
      {_id: 'drafts.a', title: 'A draft off', isActive: false},
      {_id: 'b', title: 'B on', isActive: true},
      {_id: 'c', title: 'C off', isActive: false},
      {_id: 'drafts.d', title: 'D draft on', isActive: true},
    ])
    assert.deepEqual(cards.map((c) => c._id).sort(), ['b', 'd'])
  })
  it('sorts by category then title', () => {
    const cards = activeTemplateCards([
      {_id: '1', title: 'Zed', category: 'campaign', isActive: true},
      {_id: '2', title: 'Alpha', category: 'vehicle', isActive: true},
      {_id: '3', title: 'Beta', category: 'campaign', isActive: true},
    ])
    assert.deepEqual(
      cards.map((c) => c._id),
      ['3', '1', '2'],
    )
  })
  it('an empty library gives an empty list', () => {
    assert.deepEqual(activeTemplateCards([]), [])
  })
})

describe('refusing templates that cannot be used', () => {
  it('a missing template', () => {
    assert.throws(() => pickUsableTemplate([]), TemplateUnavailableError)
  })
  it('an inactive template is refused even if its published version is active', () => {
    assert.throws(
      () =>
        pickUsableTemplate([
          {_id: 't', isActive: true},
          {_id: 'drafts.t', isActive: false, title: 'Off'},
        ]),
      /switched off/,
    )
  })
  it('an active template is returned', () => {
    assert.equal(pickUsableTemplate([{_id: 't', isActive: true, title: 'On'}]).title, 'On')
  })
})

describe('the new page built from a template', () => {
  const template = {
    _id: 'drafts.pageTemplate-x',
    title: 'Campaign',
    isActive: true,
    showHeader: false,
    seo: {noIndex: true},
    sections: [
      {_key: 'k1', _type: 'bannerSection', sequence: 3, images: []},
      {_key: 'k2', _type: 'callToActionSection', sequence: 1},
    ],
  }
  const page = buildPageFromTemplate(template)

  it('is a customPage with its own copied sections and keeps their Display Order', () => {
    assert.equal(page._type, 'customPage')
    assert.equal(
      page.isActive,
      true,
      "the page is active; the template's own on/off switch is not copied",
    )
    assert.deepEqual(
      page.sections.map((s) => (s as {sequence: number}).sequence),
      [3, 1],
    )
    assert.deepEqual(page.seo, {noIndex: true})
  })
  it('copies the header and footer switches (default on)', () => {
    assert.equal(page.showHeader, false)
    assert.equal(page.showFooter, true)
  })
  it('has fresh keys, and no reference or id linking it to the template', () => {
    const json = JSON.stringify(page)
    assert.ok(!json.includes('"k1"') && !json.includes('"k2"'))
    assert.ok(!json.includes('pageTemplate-x') && !json.includes('_ref'))
  })
  it('does not set a title or slug (each page needs its own)', () => {
    assert.ok(!('title' in page) && !('slug' in page))
  })
  it('does not change the template it was built from', () => {
    assert.equal(template.sections[0]._key, 'k1')
  })
  it('an empty template gives an empty page', () => {
    assert.deepEqual(buildPageFromTemplate({_id: 'x', isActive: true}).sections, [])
  })
})

describe('queries', () => {
  it('exclude Releases copies and only ask for template documents', () => {
    for (const q of [TEMPLATE_LIST_QUERY, TEMPLATE_CONTENT_QUERY]) {
      assert.match(q, /_type == "pageTemplate"/)
      assert.match(q, /versions\.\*\*/)
    }
    assert.match(TEMPLATE_CONTENT_QUERY, /_id in \[\$id, \$draftId\]/)
  })
  it('id helpers', () => {
    assert.equal(draftIdOf('pageTemplate-a'), 'drafts.pageTemplate-a')
    assert.equal(publishedIdOf('drafts.pageTemplate-a'), 'pageTemplate-a')
    assert.equal(publishedIdOf('pageTemplate-a'), 'pageTemplate-a')
  })
})

describe('Display Order check (warning only)', () => {
  it('is quiet for numbered, distinct sections in any list position', () => {
    assert.deepEqual(findDisplayOrderProblems([{sequence: 3}, {sequence: 1}, {sequence: 2}]), [])
  })
  it('reports a missing number and a repeated number', () => {
    const problems = findDisplayOrderProblems([{sequence: 1}, {}, {sequence: 1}])
    assert.equal(problems.length, 2)
    assert.match(problems[0], /Section 2 has no Display Order/)
    assert.match(problems[1], /Sections 1 and 3 share Display Order 1/)
  })
  it('an empty or missing list is fine', () => {
    assert.deepEqual(findDisplayOrderProblems([]), [])
    assert.deepEqual(findDisplayOrderProblems(undefined), [])
  })
})
