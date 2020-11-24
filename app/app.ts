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
    grid-template-areas: 
      "header"
      "content"
      "footer";
    grid-template-rows: auto 1fr auto;
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
    filter: drop-shadow(var(--main-drop-shadow))
  }
  header ::slotted(*) {
    margin: 0 auto;
  }
  #content::slotted(main) {
    grid-area: content;
    display: grid;
    grid: auto / minmax(320px, 800px);
    padding: 2em;
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
    const content = document.createElement('main')

    if (Array.isArray(data)) {
      for (const entry of data) {
        const contentItem = this.createDatacard(entry, type)
        content.append(contentItem)
      }
      content.classList.add('collection')
    } else {
      content.append(this.createDatacard(data, type))
      content.classList.remove('collection')
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
