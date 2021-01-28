import Datacard, {
  DatacardStructure
} from '../modules/datacard.js'

interface Data {
  _id: { $oid: string }
  [key: string]: unknown
}

interface PageParams {
  id: string
}

interface PageStructure {
  header?: string[]
  content: string[]
  footer?: string[]
}

export let title = 'News'
export const type = 'news'
const schemaResponse = fetch(`/schemas/${type}.json`)

const datacardStructure: DatacardStructure = {
  title: 'title',
  meta: ['publication_date', 'author'],
  content: 'content'
}

export const structure: PageStructure = {
  content: ['content']
}

export default async function render (
  routeParams: PageParams
): Promise<Record<string, HTMLElement>> {
  const { id = '' } = routeParams
  const dataResponse = await fetch(
    `/${type}` +
    (id !== '' ? `/${id}` : '') +
    '?data'
  )
  const data: Data | Data[] = await dataResponse.json()
  const schema = await (await schemaResponse).json()
  let content: HTMLElement

  if (Array.isArray(data)) {
    content = document.createElement('main')
    content.classList.add('collection')

    for (const entry of data) {
      const contentItem = new Datacard({
        data: entry,
        schema,
        structure: datacardStructure
      })
      contentItem.id = entry._id.$oid
      content.append(contentItem)
    }
  } else {
    content = new Datacard({
      data,
      schema,
      structure: datacardStructure
    })
    title = `${String(data.title)} :: ${title}`
  }

  return { content }
}
