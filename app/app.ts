import Router from './modules/router.js'

import Header from './modules/header.js'
import Menu from './modules/menu.js'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const styleSheet: any = new CSSStyleSheet()
const styles = `
  :host {
    position: relative;
    display: grid;
    grid-template-areas: 
      "header"
      "content"
      "footer";
    grid-template-rows: auto 1fr auto;
    gap: 2em;
    font-family: var(--main-font-family);
    color: var(--main-font-color);
    background-color: var(--additional-background-color);
  }
  #content::slotted(main) {
    grid-area: content;
    display: grid;
    grid: auto / minmax(200px, 800px);
    justify-content: center;
    align-content: start;
  }
  #content::slotted(main.collection) {
    grid: auto / repeat(auto-fit, minmax(320px, 480px));
    gap: 2em;
  }
  @media (max-width: 384px) {
    #content::slotted(main) {
      padding-left: 0;
      padding-right: 0;
    }
  }
`
const template = document.createElement('template')
template.innerHTML = `
  <slot name="header"></slot>
  <slot id="content"></slot>
`

export interface AppStructure {
  [section: string]: SectionStructure
}

interface SectionStructure {
  [slot: string]: Element[]
}

export interface Page {
  title: string
  structure: AppStructure
  setParams: (params: unknown) => Promise<void>
}

export interface PageStructure {
  [slot: string]: Element[]
}

let router: Router
const appStructure: AppStructure = { header: { senter: [new Menu()] } }

const appName = 'Noname'

class App extends HTMLElement {
  structure: AppStructure
  #currentStructure?: AppStructure

  constructor () {
    super()

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const shadow: any = this.attachShadow({ mode: 'open' })
    shadow.adoptedStyleSheets = [styleSheet]
    shadow.append(template.content.cloneNode(true))

    this.structure = appStructure
  }

  async connectedCallback (): Promise<void> {
    if (styleSheet.cssRules.length === 0) {
      styleSheet.replaceSync(styles)
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    router = new Router({
      routes: ['news', 'users', 'about'],
      handler: async (page: Page) => {
        await page.setParams(router.params)

        const { title, structure } = page
        this.structure = { ...appStructure, ...structure }

        document.title = `${title} | ${appName}`
        sessionStorage.setItem('pageTitle', document.title)

        await this.render()
      }
    })
  }

  async render (): Promise<void> {
    const { structure } = this

    for (const id in structure) {
      const currentSectionStructure = this.#currentStructure?.[id]
      const sectionStructure = structure[id]
      let section = this.children.namedItem(id)

      if (section == null) {
        switch (id) {
          case 'header':
            section = new Header()
            break
          default:
            section = document.createElement('main')
            break
        }
        section.id = id
        this.append(section)
      }

      if (sectionStructure !== currentSectionStructure) {
        section.textContent = ''

        for (const slot in sectionStructure) {
          section.append(...sectionStructure[slot])
        }
      }
    }
    this.#currentStructure = { ...structure }
  }
}

customElements.define('app-wrapper', App)
const app = new App()
document.body.append(app)
