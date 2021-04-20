import { documentMeta } from './document-meta.js'

type RenderElement = (previouslyUsed?: Element) => Element | Promise<Element>

type SectionItem = RenderElement | Section
interface SectionStructure { [sectionItem: string]: SectionItem }
type ElementProps = Partial<Pick<Element, 'id' | 'className' | 'slot'>>

export interface Section {
  render?: RenderElement
  properties?: ElementProps
  structure?: SectionStructure
}
export interface Page extends Section {
  title: string
  description: string
}

type ElementList = Map<string, WeakRef<Element>>
type AssignedElements = WeakMap<RenderElement, ElementList>
type RegistryEntry = [RenderElement, keyof ElementList]

const defaultRender: RenderElement = (assigned) =>
  assigned ?? document.createElement('section')

export function mergePageParts<I extends Section, C extends Section> (
  initialPart: I, coveringPart: C | I
): I | (I & C) {
  if (initialPart === coveringPart) return initialPart
  initialPart.render ??= defaultRender

  const { structure: initialStructure } = initialPart
  const { structure: coveringStructure } = coveringPart

  const mergedPage = { ...initialPart, ...coveringPart }
  mergedPage.structure = { ...initialStructure, ...coveringStructure }

  for (const sectionName in coveringStructure) {
    const initialSection = initialStructure?.[sectionName]
    const coveringSection = coveringStructure[sectionName]

    if (initialSection instanceof Function ||
      coveringSection instanceof Function
    ) continue

    mergedPage.structure[sectionName] = initialSection != null
      ? mergePageParts(initialSection, coveringSection)
      : coveringSection
  }
  return mergedPage
}

const assignedElements: AssignedElements = new WeakMap()

const elementRegistry = new FinalizationRegistry((entry: RegistryEntry) => {
  const [render, id] = entry

  assignedElements.get(render)?.delete(id)
  if (assignedElements.get(render)?.size === 0) {
    assignedElements.delete(render)
  }
})

async function getElement (render: RenderElement): Promise<Element> {
  const elementList = assignedElements.get(render)
  const usedElement = elementList?.get(currentId)?.deref()
  const element = await render(usedElement)

  registerElement(render, element)
  return element
}

function registerElement (render: RenderElement, element: Element): void {
  const elementList = assignedElements.get(render) ?? new Map() as ElementList

  elementList.set(currentId, new WeakRef(element))
  assignedElements.set(render, elementList)
  elementRegistry.register(element, [render, currentId])
}

export async function renderPage (page: Page): Promise<Element> {
  document.title = page.title
  documentMeta.description = page.description

  currentId = ''
  return await renderSection(page)
}

let currentId = ''
export async function renderSection (
  section: Section
): Promise<Element> {
  section.render ??= defaultRender
  const { render, properties, structure } = section

  const sectionId = currentId
  const sectionElement = await getElement(render)
  Object.assign(sectionElement, properties)

  const remainingChildren = new Set(sectionElement.children)
  const replenishment: Set<Element> = new Set()

  for (const itemName in structure) {
    const item = structure[itemName]
    let itemElement: Element

    currentId = `${sectionId}-${itemName}`
    if (item instanceof Function) {
      const renderItem = item
      itemElement = await getElement(renderItem)
    } else {
      const subSection = item
      itemElement = await renderSection(subSection)
    }
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
