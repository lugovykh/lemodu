import type { PageStructure } from '../app'

import Datacard, {
  DatacardStructure,
  JsonSchemaObject
} from '../modules/datacard.js'

interface Data {
  _id: { $oid: string }
  [key: string]: unknown
}

interface PageParams {
  id: string
}

export let title = ''
export const type = 'news'
const schemaResponse = fetch(`/schemas/${type}.json`)
let schema: JsonSchemaObject

const datacardStructure: DatacardStructure = {
  title: 'title',
  meta: ['publication_date', 'author'],
  content: 'content'
}

export let structure: PageStructure

export async function setParams (
  pageParams: PageParams
): Promise<void> {
  const { id = '' } = pageParams
  const dataResponse = await fetch(
    `/${type}` +
    (id !== '' ? `/${id}` : '') +
    '?data'
  )
  const data: Data | Data[] = await dataResponse.json()
  schema ??= await (await schemaResponse).json()
  let content: HTMLElement

  if (Array.isArray(data)) {
    content = document.createElement('div')
    content.classList.add('collection')

    for (const entry of data) {
      const contentItem = new Datacard({
        data: entry,
        schema,
        structure: datacardStructure
      })
      contentItem.href = `/${type}/${entry._id.$oid}`
      contentItem.id = entry._id.$oid
      content.append(contentItem)
    }
    title = 'News'
  } else {
    content = new Datacard({
      data,
      schema,
      structure: datacardStructure
    })
    title = String(data.title)
  }

  structure = { content: [content] }
}
