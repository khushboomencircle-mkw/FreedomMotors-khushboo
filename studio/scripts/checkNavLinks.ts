import {getCliClient} from 'sanity/cli'
const client = getCliClient({apiVersion: '2024-01-01'})
// Check both published and draft versions
const results = await client.fetch(
  `*[_type == "navigationSettings"]{_id, "count": count(links), links[]{label, href}}`,
)
console.log(JSON.stringify(results, null, 2))
