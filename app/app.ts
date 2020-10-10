import Router from './modules/router.js'
import { Menu } from  './modules/menu.js'
import * as Datacard from './modules/datacard.js'

const appName = 'noname'
const router = new Router(['news', 'users', 'about'])
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const styleSheet: any = new CSSStyleSheet()
const CSS = `
  :host {
    position: relative;
    display: grid;
    grid: [header-start] "header" [header-end]
      [content-start] "content" [content-end];
  }
  header {
    grid-area: header;
    display: flex;
    flex-flow: row;
    position: sticky;
    z-index: 100;
    top: 0;
    background-color: var(--content-bg-color);
    border-bottom: var(--menu-border);
  }
  header ::slotted(*) {
    margin: 0 auto;
  }
  slot:not([name])::slotted(*) {
    grid-area: content;
  }
  slot:not([name])::slotted(main) {
    display: grid;
    grid: auto / minmax(320px, 800px);
    grid: auto / repeat(auto-fit, minmax(320px, 480px));
    gap: 32px;
    padding: 32px;
    justify-content: center;
  }
  @media (max-width: 384px) {
    slot:not([name]) {
      padding: 32px 0;
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

interface Data {
  _id: { $oid: string }
  [key: string]: unknown
}

class App extends HTMLElement {
  constructor() {
    super()

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const shadow: any = this.attachShadow({ mode: 'open' })
    shadow.adoptedStyleSheets = [styleSheet]
    shadow.append(template.content.cloneNode(true))
  }

  connectedCallback(): void {
    if (styleSheet.cssRules.length === 0) {
      styleSheet.replaceSync(CSS)
    }

    addEventListener('popstate', () => this.updateContent())
    this.render()
  }

  render(): void {
    const mainMenu = new Menu()
    mainMenu.slot = 'mainMenu'
    this.append(mainMenu)

    this.updateContent()
  }

  async updateContent(): Promise<void> {
    const { type = 'news' } = router.params
    const dataResponse = await fetch(
      `${location.pathname.length ? location.pathname : type}?data`
    )
    const data: Data | Data[] = await dataResponse.json()
    const currentContent = this.children.namedItem('content')
    let content: HTMLElement

    if (Array.isArray(data)) {
      content = document.createElement('main')
      for (const entry of data) {
        const contentItem = this.createDatacard(entry, type)
        content.append(contentItem)
      }
    } else {
      content = this.createDatacard(data, type)
    }

    content.id = 'content'
    if (currentContent) {
      currentContent.replaceWith(content)
    } else {
      this.append(content)
    }

    document.title = `${type} | ${appName}`
    sessionStorage.setItem('pageTitle', document.title)
  }

  datacardStructures: Map<string, Datacard.Structure> = new Map()
    .set('news', {
      title: 'title',
      basicMeta: ['publication_date', 'author'],
      content: 'content'
    })
    .set('users', {
      title: 'nickname',
      basicMeta: ['first_name', 'last_name', 'birth_date'],
      content: 'about'
    })

  createDatacard(rawData: Data, dataType: string): Datacard.Datacard {
    const fieldNameByType: Record<string, string> = {
      users: 'nickname'
    }

    const datacard = new Datacard.Datacard()
    datacard.data = rawData
    datacard.structure = this.datacardStructures.get(dataType)

    datacard.handler = (rawField): ReturnType<Datacard.Handler> => {
      if (!rawField) return
      let content: string, href: string | undefined, dateTime: string | undefined

      if ((rawField as Data)?._id) {
        const subdata = rawField as Data
        const id = subdata._id.$oid
        const type = dataType
        const fieldName = fieldNameByType[type]
        href = router.generateUri({ type, id })
        content = `${subdata?.[fieldName]}`
      } else if (typeof rawField === 'string' && rawField.length === 24 &&
        /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}Z$/.test(rawField)
      ) {
        dateTime = rawField
        content = new Date(rawField).toLocaleString()
      } else if (typeof rawField === 'string' && rawField.length === 10 &&
        /^\d{4}-\d{2}-\d{2}$/.test(rawField)
      ) {
        dateTime = rawField
        content = new Date(rawField).toLocaleDateString()
      } else {
        content = `${rawField}`
      }
      return { content, href, dateTime }
    }

    datacard.id = rawData._id.$oid
    datacard.href = router.generateUri({ type: dataType, id: rawData._id.$oid })

    return datacard
  }
}

customElements.define('site-app', App)
const app = new App()
document.body.append(app)
