import Router from './modules/router.js'
import './modules/header.js'
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
  slot[name="header"] {
    display: block;
    position: sticky;
    z-index: 100;
    top: 0;
  }
  slot:not([name]) {
    grid-area: content;
    display: grid;
    grid: auto / minmax(320px, 800px);
    justify-content: center;
    padding: 32px;
  }
  slot:not([name]).collection{
    grid: auto / repeat(auto-fit, minmax(320px, 480px));
    grid-gap: 32px;
  }
  @media (max-width: 384px) {
    slot:not([name]) {
      padding: 32px 0;
    }
  }
`
const template = document.createElement('template')
template.innerHTML = `
  <slot name="header"></slot>
  <slot id="content"></slot>
`

interface Data {
  _id: { $oid: string }
  [key: string]: unknown
}

class App extends HTMLElement {
  header?: HTMLElement
  #content?: HTMLElement | Map<string, HTMLElement>

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

    addEventListener('popstate', () => this.render())
    this.render()
  }

  updateContent(data: Data | Data[]) {
    const { type = 'news' } = router.params
    const slot = this.shadowRoot?.children.namedItem('content') as HTMLSlotElement
    slot.assignedNodes().forEach(node => (node as ChildNode)?.remove())

    if (Array.isArray(data)) {
      for (const entry of data) {
        this.append(this.createDatacard(entry, type))
      }
      slot.classList.add('collection')
    } else {
      this.append(this.createDatacard(data, type))
      slot.classList.remove('collection')
    }
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

  async render(): Promise<void> {
    const { type = 'news' } = router.params
    const dataResponse = await fetch(
      `${location.pathname.length ? location.pathname : 'news'}?data`
    )
    const data: Data | Data[] = await dataResponse.json()

    if (!this.header) {
      this.header = document.createElement('app-header')
      this.header.slot = 'header'
      this.append(this.header)
    }

    this.updateContent(data)

    document.title = `${type} | ${appName}`
    sessionStorage.setItem('pageTitle', document.title)
  }
}

customElements.define('site-app', App)
const app = new App()
document.body.append(app)
