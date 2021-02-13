import Router from './modules/router.js'

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
    font-family: var(--main-font-family);
    color: var(--main-font-color);
    background-color: var(--additional-background-color);
  }
`
const template = document.createElement('template')
template.innerHTML = `
  <slot name="header"></slot>
  <slot name="aside"></slot>
  <slot id="content"></slot>
  <slot name="footer"></slot>
`

export interface AppStructure {
  [section: string]: SectionStructure
}

interface SectionStructure {
  [slot: string]: Element[]
}

export interface Page {
  name: string
  title: string
  description: string
  structure: AppStructure
}

export interface PageStructure {
  [slot: string]: Element[]
}

let router: Router
const staticStructure: AppStructure = { header: { senter: [new Menu()] } }

const appName = 'Noname'

function setDocumentDescription (description: string): void {
  const maxLength = 155
  let documentDescription = document.head.children.namedItem('description')

  if (documentDescription == null) {
    const newDocumentDescription = document.createElement('meta')
    newDocumentDescription.name = 'description'
    documentDescription = newDocumentDescription
  }
  (documentDescription as HTMLMetaElement)
    .content = description.substr(0, maxLength)
  document.head.append(documentDescription)
}

class App extends HTMLElement {
  structure: AppStructure
  #currentStructure?: AppStructure

  constructor () {
    super()

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const shadow: any = this.attachShadow({ mode: 'open' })
    shadow.adoptedStyleSheets = [styleSheet]
    shadow.append(template.content.cloneNode(true))

    this.structure = staticStructure
  }

  async connectedCallback (): Promise<void> {
    if (styleSheet.cssRules.length === 0) {
      styleSheet.replaceSync(styles)
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    router = new Router({
      handler: ({ title, description, structure }: Page) => {
        this.structure = { ...staticStructure, ...structure }

        document.title = `${title} | ${appName}`
        setDocumentDescription(description)
        sessionStorage.setItem('pageTitle', document.title)

        this.render()
      }
    })
  }

  render (): void {
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
          case 'main':
            section = new Main()
            break
          default:
            section = document.createElement('section')
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
