import type { Page } from '../app'

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

const name = 'users'
const schemaResponse = fetch(`/schemas/${name}.json`)
let schema: JsonSchemaObject

const datacardStructure: DatacardStructure = {
  title: 'nickname',
  meta: ['first_name', 'last_name', 'birth_date'],
  content: 'about'
}

export async function generate (
  pageParams: PageParams
): Promise<Page> {
  let title: string
  let description: string
  const { id = '' } = pageParams
  const dataResponse = await fetch(
    `/${name}` +
    (id !== '' ? `/${id}` : '') +
    '?data'
  )
  const data: Data | Data[] = await dataResponse.json()
  let content: () => Element[]
  schema ??= await (await schemaResponse).json()

  if (Array.isArray(data)) {
    title = 'Users'
    description = 'Users of this site'
    content = () => {
      const slotContent = document.createElement('div')
      slotContent.classList.add('collection')

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
    title = String(data.nickname)
    description = `User profile: ${title}`
    content = () => {
      const slotContent: Element = new Datacard({
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
