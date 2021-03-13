import Router from './modules/router.js'
import { documentMeta } from './modules/document-meta.js'

import Header from './modules/header.js'
import Main from './modules/main.js'
import Menu from './modules/menu.js'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const styleSheet: any = new CSSStyleSheet()
const styles = `
  :host {
    display: grid;
    grid-template-areas: 
      "header"
      "content"
      "footer";
    grid-template-rows: auto 1fr auto;
    gap: 2em;
    font-family: var(--ui-font-family);
    color: var(--ui-font-color);
    background-color: var(--background-color);
  }
`
const template = document.createElement('template')
template.innerHTML = `
  <slot name="header"></slot>
  <slot name="aside"></slot>
  <slot id="content"></slot>
  <slot name="footer"></slot>
`

interface SectionStructure {
  [slot: string]: () => Element[] | Promise<Element[]>
}
interface AppStructure { [section: string]: SectionStructure }

export interface Page {
  name: string
  title: string
  description: string
  structure: AppStructure
}

const router = new Router()
const staticStructure: AppStructure = {
  header: {
    content: () => [new Menu()]
  }
}

const appName = 'Noname'

class App extends HTMLElement {
  #currentStructure?: AppStructure
  pageStructure?: AppStructure

  constructor () {
    super()

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const shadowRoot: any = this.attachShadow({ mode: 'open' })
    shadowRoot.adoptedStyleSheets = [styleSheet]
    shadowRoot.append(template.content.cloneNode(true))
  }

  async connectedCallback (): Promise<void> {
    if (styleSheet.cssRules.length === 0) {
      styleSheet.replaceSync(styles)
    }

    router.handler = async ({ title, description, structure }: Page) => {
      this.pageStructure = structure

      document.title = `${title} — ${appName}`
      documentMeta.description = description
      sessionStorage.setItem('pageTitle', document.title)

      await this.render()
    }
  }

  get structure (): AppStructure {
    const { pageStructure } = this

    const structure = { ...staticStructure }
    for (const sectionName in pageStructure) {
      const staticSectionStructure = staticStructure[sectionName]
      const sectionStructure = pageStructure[sectionName]

      structure[sectionName] = {
        ...staticSectionStructure,
        ...sectionStructure
      }
    }
    return structure
  }

  async render (): Promise<void> {
    const { structure } = this
    if (structure === this.#currentStructure) return

    for (const sectionName in structure) {
      const currentSectionStructure = this.#currentStructure?.[sectionName]
      const sectionStructure = structure[sectionName]
      let section = this.children.namedItem(sectionName)

      if (section == null) {
        switch (sectionName) {
          case 'header':
            section = new Header()
            break
          case 'main':
            section = new Main()
            break
          default:
            section = document.createElement('section')
        }
        section.id = sectionName
        this.append(section)
      }

      if (sectionStructure !== currentSectionStructure) {
        for (const slotName in sectionStructure) {
          const slotContent = await sectionStructure[slotName]()

          for (const element of slotContent) {
            if (slotName !== 'content') element.slot = slotName
          }
          section.replaceChildren(...slotContent)
        }
      }
    }
    this.#currentStructure = structure
  }
}

customElements.define('app-wrapper', App)
const app = new App()
document.body.append(app)
