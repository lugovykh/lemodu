import type { Page } from '../modules/page'
import type { PathTree, PageParams } from '../modules/router'

import Collection from '../modules/collection.js'

import Datacard, {
  DatacardStructure,
  JsonSchemaObject
} from '../modules/datacard.js'

interface Data {
  _id: string
  [key: string]: unknown
}
interface UsersData extends Data {
  nickname: string
}

interface UsersParams {
  id?: string
  action?: string
}

const name = 'users'
const schemaResponse = fetch(`/schemas/${name}.json`)
let schema: JsonSchemaObject

const datacardStructure: DatacardStructure = {
  title: 'nickname',
  meta: ['first_name', 'last_name', 'birth_date'],
  content: 'about'
}

export const pathTree: PathTree = [
  [{ action: ['add'] }],
  ['id', { action: ['edit'] }]
]

export async function generate (
  { id, action, ...remainingParams }: PageParams & UsersParams
): Promise<Page> {
  let title: string
  let description: string

  const dataResponse = await fetch(
    `/${name}` +
    (id != null ? `/${id}` : '') +
    '?data'
  )
  const data: UsersData | UsersData[] = await dataResponse.json()
  let content: () => Element
  schema ??= await (await schemaResponse).json()

  if (Array.isArray(data)) {
    title = 'Users'
    description = 'Users of this site'
    content = () => {
      const sectionContent = new Collection()

      for (const entry of data) {
        const contentItem = new Datacard({
          data: entry,
          schema,
          structure: datacardStructure
        })
        contentItem.href = `/${name}/${entry._id}`
        contentItem.id = entry._id
        sectionContent.append(contentItem)
      }
      return sectionContent
    }
  } else {
    title = String(data.nickname)
    description = `User profile: ${title}`
    content = () => {
      const sectionContent: Element = new Datacard({
        data,
        schema,
        structure: datacardStructure
      })
      return sectionContent
    }
  }
  const structure = {
    main: { structure: { content } }
  }

  return {
    title,
    description,
    structure
  }
}
