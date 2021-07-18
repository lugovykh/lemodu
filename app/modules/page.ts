import { documentMeta } from './document-meta.js'

type Tag = keyof TagMap
type TagMap = HTMLElementTagNameMap
type TaggedRender<T extends Tag, M extends TagMap>
  = (tag?: T) => M[T] | Promise<M[T]>

type CustomRender<T extends Element> = () => T | Promise<T>

type Properties<T extends Element> = { [K in keyof T]?: T[K] }

type ItemRender = CustomRender<Element>
type DefaultRender = TaggedRender<Tag, TagMap>

type SectionItem = ItemRender | Item | Section
type SectionItemParts = SectionItem[]
type StructureItem = SectionItem | SectionItemParts
type Structure = Record<string, StructureItem>
type StructureParts = Structure[]
type SectionStructure = Structure | StructureParts

interface UndefinedItem {
  props?: Properties<TagMap[typeof defaultTag]>
}
interface TaggedItem<T extends Tag> {
  tag: T
  props?: Properties<TagMap[T]>
}
interface CustomedItem<T extends Element> {
  render: CustomRender<T>
  props?: Properties<T>
}
interface SectionLike {
  structure: SectionStructure
}
interface PageLike {
  title: string
  description: string
}

export type Item = TaggedItem<Tag> | CustomedItem<Element> | UndefinedItem
export type Section = Item & SectionLike
export type Page = Section & PageLike

type ElementId = string
type ElementList = Map<ElementId, WeakRef<Element>>
type AssignedElements = WeakMap<Render, ElementList>

type Render = ItemRender | DefaultRender
type RegistryEntry = [Render, ElementId]

const defaultTag: Tag = 'div'
const defaultRender: DefaultRender =
  (tag = defaultTag) => document.createElement(tag)

function isDefinedItem<T extends Item> (item: T): boolean {
  return 'tag' in item || 'render' in item
}

const assignedElements: AssignedElements = new WeakMap()

const elementRegistry = new FinalizationRegistry((entry: RegistryEntry) => {
  const [render, id] = entry

  assignedElements.get(render)?.delete(id)
  if (assignedElements.get(render)?.size === 0) {
    assignedElements.delete(render)
  }
})

async function getElement (render: Render, tag?: Tag): Promise<Element> {
  const elementList = assignedElements.get(render)
  const usedElement = elementList?.get(currentId)?.deref()
  const element = usedElement ?? await render(tag)

  if (element !== usedElement) registerElement(render, element)
  return element
}

function registerElement (render: Render, element: Element): void {
  const elementList = assignedElements.get(render) ?? new Map() as ElementList

  elementList.set(currentId, new WeakRef(element))
  assignedElements.set(render, elementList)
  elementRegistry.register(element, [render, currentId])
}

function mergeSectionItems (...itemParts: SectionItemParts): SectionItem {
  let mergedItem: StructureItem = {}

  for (const part of itemParts) {
    if (part instanceof Function) {
      mergedItem = part
    } else if (isDefinedItem(part) || mergedItem instanceof Function) {
      mergedItem = { ...part }
    } else {
      const initialItem = mergedItem
      mergedItem = { ...mergedItem, ...part }

      if ('props' in initialItem && 'props' in part) {
        mergedItem.props = { ...initialItem.props, ...part.props }
      }
      if ('structure' in initialItem && 'structure' in part) {
        (mergedItem as Section).structure = [
          initialItem.structure, part.structure
        ].flat()
      }
    }
  }
  return mergedItem
}

function mergeStructures (
  ...structureParts: StructureParts
): Structure {
  const [initialPart, ...otherParts] = structureParts
  const mergedStructure = { ...initialPart }

  for (const part of otherParts) {
    for (const itemName in part) {
      let item = part[itemName]

      if (itemName in mergedStructure) {
        const initialItem = mergedStructure[itemName]
        item = [initialItem, item].flat()
      }
      mergedStructure[itemName] = item
    }
  }
  return mergedStructure
}

const idSeparator = ':'
let currentId = ''
async function renderItem (item: Item): Promise<Element> {
  let itemElement: Element
  const { props } = item

  if ('render' in item) {
    const { render } = item
    itemElement = await getElement(render)
  } else if ('tag' in item) {
    const { tag } = item
    itemElement = await getElement(defaultRender, tag)
  } else {
    itemElement = await getElement(defaultRender)
  }
  Object.assign(itemElement, props)
  return itemElement
}

async function renderSection (Section: Section): Promise<Element> {
  const sectionId = currentId
  const { structure } = Section
  const sectionStructure = Array.isArray(structure)
    ? mergeStructures(...structure)
    : structure
  const sectionElement = await renderItem(Section)

  const remainingChildren = new Set(sectionElement.children)
  const replenishment: Set<Element> = new Set()

  for (const itemName in sectionStructure) {
    currentId = `${sectionId}${idSeparator}${itemName}`
    const item = sectionStructure[itemName]
    const sectionItem = Array.isArray(item)
      ? mergeSectionItems(...item)
      : item
    const itemElement = await renderSectionItem(sectionItem)

    if (sectionElement.contains(itemElement)) {
      remainingChildren.delete(itemElement)
    } else replenishment.add(itemElement)
  }
  for (const wasteElement of remainingChildren) {
    wasteElement.remove()
  }
  sectionElement.append(...replenishment)
  return sectionElement
}

async function renderSectionItem (
  sectionItem: SectionItem
): Promise<Element> {
  let sectionItemElement: Element

  if (sectionItem instanceof Function) {
    const render = sectionItem
    sectionItemElement = await getElement(render)
  } else if (!('structure' in sectionItem)) {
    sectionItemElement = await renderItem(sectionItem)
  } else {
    sectionItemElement = await renderSection(sectionItem)
  }
  return sectionItemElement
}

export async function renderPage (
  initialPage: Page, ...pageParts: Array<Partial<Page>>
): Promise<Element> {
  document.title = initialPage.title
  documentMeta.description = initialPage.description

  currentId = ''
  const page = mergeSectionItems(initialPage, ...pageParts)
  return await renderSectionItem(page)
}
