import { documentMeta } from './document-meta.js'

type Render = (previouslyUsed?: Element) => Element | Promise<Element>

type Part = Partial<Page>
type SectionItem = Render | Item | Section
interface SectionStructure { [sectionItem: string]: SectionItem }
type ElementProps = Partial<Pick<Element, 'id' | 'className' | 'slot'>>

export interface Item {
  render?: Render
  properties?: ElementProps
}
export interface Section extends Item {
  structure: SectionStructure
}
export interface Page extends Section {
  title: string
  description: string
}

type ElementList = Map<string, WeakRef<Element>>
type AssignedElements = WeakMap<Render, ElementList>
type RegistryEntry = [Render, keyof ElementList]

const defaultRender: Render = (assigned) =>
  assigned ?? document.createElement('section')

function mergeStructures (
  initialStructure: SectionStructure,
  coveringStructure?: SectionStructure
): SectionStructure {
  const mergedStructure = { ...initialStructure, ...coveringStructure }

  for (const sectionName in coveringStructure) {
    const initialSection = initialStructure[sectionName]
    const coveringSection = coveringStructure[sectionName]

    if (initialSection instanceof Function ||
      coveringSection instanceof Function
    ) continue

    mergedStructure[sectionName] = initialSection != null
      ? mergePageParts(initialSection, coveringSection)
      : coveringSection
  }
  return mergedStructure
}

export function mergePageParts<I extends Part, C extends Part> (
  initialPart: I extends infer P ? P : I,
  coveringPart: C extends infer P ? P : C
): I & C extends infer M ? M : I {
  if (initialPart === coveringPart) return initialPart
  initialPart.render ??= defaultRender

  const mergedPart = { ...initialPart, ...coveringPart }
  if (coveringPart.render == null && initialPart.structure != null) {
    const { structure: initialStructure } = initialPart
    const { structure: coveringStructure } = coveringPart
    const structure = mergeStructures(initialStructure, coveringStructure)
    mergedPart.structure = structure
  }
  return mergedPart
}

const assignedElements: AssignedElements = new WeakMap()

const elementRegistry = new FinalizationRegistry((entry: RegistryEntry) => {
  const [render, id] = entry

  assignedElements.get(render)?.delete(id)
  if (assignedElements.get(render)?.size === 0) {
    assignedElements.delete(render)
  }
})

async function getElement (render: Render): Promise<Element> {
  const elementList = assignedElements.get(render)
  const usedElement = elementList?.get(currentId)?.deref()
  const element = await render(usedElement)

  registerElement(render, element)
  return element
}

function registerElement (render: Render, element: Element): void {
  const elementList = assignedElements.get(render) ?? new Map() as ElementList

  elementList.set(currentId, new WeakRef(element))
  assignedElements.set(render, elementList)
  elementRegistry.register(element, [render, currentId])
}

let currentId = ''
async function renderItem (item: Item): Promise<Element> {
  item.render ??= defaultRender
  const { render, properties } = item
  const itemElement = await getElement(render)

  Object.assign(itemElement, properties)
  return itemElement
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

export async function renderSection (section: Section): Promise<Element> {
  const sectionId = currentId
  const { structure } = section
  const sectionElement = await renderItem(section)

  const remainingChildren = new Set(sectionElement.children)
  const replenishment: Set<Element> = new Set()

  for (const itemName in structure) {
    currentId = `${sectionId}:${itemName}`
    const item = structure[itemName]
    const itemElement = await renderSectionItem(item)

    if (sectionElement.contains(itemElement)) {
      remainingChildren.delete(itemElement)
    } else {
      replenishment.add(itemElement)
    }
  }
  for (const wasteElement of remainingChildren) {
    wasteElement.remove()
  }
  sectionElement.append(...replenishment)
  return sectionElement
}

export async function renderPage (page: Page): Promise<Element> {
  document.title = page.title
  documentMeta.description = page.description

  currentId = ''
  return await renderSection(page)
}
