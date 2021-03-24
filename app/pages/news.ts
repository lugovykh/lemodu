import type { Page } from '../app'
import type { PathTree, PageParams } from '../modules/router'

import Collection from '../modules/collection.js'

import Datacard, {
  DatacardStructure,
  JsonSchemaObject
} from '../modules/datacard.js'

interface Data {
  _id: { $oid: string }
  [key: string]: unknown
}
interface NewsData extends Data {
  title: string
  content: string
}

interface NewsParams {
  id?: string
  action?: string
}

const name = 'news'
const schemaResponse = fetch(`/schemas/${name}.json`)
let schema: JsonSchemaObject

const datacardStructure: DatacardStructure = {
  title: 'title',
  meta: ['publication_date', 'author'],
  content: 'content'
}

export const pathTree: PathTree = [
  [{ action: ['add'] }],
  ['id', { action: ['edit'] }]
]

export async function generate (
  { id, action, ...remainingParams }: PageParams & NewsParams
): Promise<Page> {
  let title: string
  let description: string

  const dataResponse = await fetch(
    `/${name}` +
    (id != null ? `/${id}` : '') +
    '?data'
  )
  const data: NewsData | NewsData[] = await dataResponse.json()
  schema ??= await (await schemaResponse).json()
  let content: () => Element[]

  if (Array.isArray(data)) {
    title = 'News'
    description = 'Latest news of this site'
    content = () => {
      const slotContent = new Collection()

      for (const entry of data) {
        const contentItem = new Datacard({
          data: entry,
          schema,
          structure: datacardStructure
        })
        contentItem.href = `/${name}/${entry._id.$oid}`
        contentItem.id = entry._id.$oid
        slotContent.append(contentItem)
      }
      return [slotContent]
    }
  } else {
    title = String(data.title)
    description = String(data.content)
    content = () => {
      const slotContent = new Datacard({
        data,
        schema,
        structure: datacardStructure
      })
      return [slotContent]
    }
  }
  const structure = { main: { content } }

  return {
    name,
    title,
    description,
    structure
  }
}
