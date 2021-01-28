import Router from './modules/router.js'
import Menu from './modules/menu.js'

const appName = 'noname'
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const styleSheet: any = new CSSStyleSheet()
const CSS = `
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
  header {
    grid-area: header;
    display: flex;
    flex-flow: row;
    position: sticky;
    z-index: 100;
    top: 0;
    background-color: var(--main-background-color);
    backdrop-filter: blur(var(--main-blur));
    border-bottom: var(--main-border);
    box-shadow: var(--main-box-shadow);
    filter: drop-shadow(var(--main-drop-shadow));
  }
  header ::slotted(*) {
    margin: 0 auto;
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
  <header>
    <slot name="mainMenu"></slot>
  </header>
  <slot id="content"></slot>
`

interface PageStructure {
  content: string[]
  [key: string]: string[]
}

interface PageData {
  title: string
  structure: PageStructure
  default: (routeParams: unknown) => Record<string, Element>
}

// const datacardStructures: Map<string, unknown> = new Map()
//   .set('users', {
//     title: 'nickname',
//     meta: ['first_name', 'last_name', 'birth_date'],
//     content: 'about'
//   })

let router: Router
let pageContent: Record<string, Element>
let currentChildren: Set<Element>

class App extends HTMLElement {
  structure: PageStructure

  constructor () {
    super()

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const shadow: any = this.attachShadow({ mode: 'open' })
    shadow.adoptedStyleSheets = [styleSheet]
    shadow.append(template.content.cloneNode(true))

    this.structure = {
      content: []
    }
  }

  async connectedCallback (): Promise<void> {
    if (styleSheet.cssRules.length === 0) {
      styleSheet.replace(CSS)
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    router = new Router({
      routes: ['news', 'users', 'about'],
      handler: async (pageData: Partial<PageData>) => {
        pageContent = await pageData.default?.(router.params) ?? {}
        this.structure = { ...this.structure, ...pageData.structure }

        await this.render()
      }
    })
  }

  async render (): Promise<void> {
    const { structure } = this
    currentChildren = new Set(this.children)

    const mainMenu = new Menu()
    mainMenu.slot = 'mainMenu'
    this.append(mainMenu)

    for (const slot in structure) {
      const contentIds = structure[slot]

      for (const id of contentIds) {
        const currentChild = this.children.namedItem(id)
        const newChild = pageContent[id]
        newChild.id = id

        if (currentChild != null) {
          if (currentChild === newChild) return

          currentChildren.delete(currentChild)
          currentChild.replaceWith(newChild)
        } else {
          this.append(newChild)
        }
      }
    }

    for (const unnecessary of currentChildren) {
      unnecessary.remove()
    }

    document.title = `${'pageTitle'} | ${appName}`
    sessionStorage.setItem('pageTitle', document.title)
  }
}

customElements.define('app-wrapper', App)
const app = new App()
document.body.append(app)
