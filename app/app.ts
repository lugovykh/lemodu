import Router from './modules/router.js'
import Menu from './modules/menu.js'
import Datacard, {
  DatacardStructure
} from './modules/datacard.js'
import type { JsonSchemaObject } from './modules/json-schema'

const appName = 'noname'
const router = new Router({ pages: ['news', 'users', 'about'] })
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
    filter: drop-shadow(var(--main-drop-shadow));
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

const datacardStructures: Map<string, DatacardStructure> = new Map()
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

function createDatacard (
  data: Data,
  schema: JsonSchemaObject,
  dataType: string
): Datacard {
  const datacard = new Datacard({
    data,
    schema,
    structure: datacardStructures.get(dataType)
  })

  datacard.id = data._id.$oid
  datacard.href = router.generateUri({ type: dataType, id: data._id.$oid })

  return datacard
}

class App extends HTMLElement {
  constructor () {
    super()

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const shadow: any = this.attachShadow({ mode: 'open' })
    shadow.adoptedStyleSheets = [styleSheet]
    shadow.append(template.content.cloneNode(true))
  }

  async connectedCallback (): Promise<void> {
    if (styleSheet.cssRules.length === 0) {
      styleSheet.replace(CSS)
    }

    router.callback = async () => await this.updateContent()
    await this.render()
  }

  async render (): Promise<void> {
    const mainMenu = new Menu()
    mainMenu.slot = 'mainMenu'
    this.append(mainMenu)

    await this.updateContent()
  }

  async updateContent (): Promise<void> {
    const { type = 'news' } = router.params
    const dataResponse = await fetch(
      `${location.pathname.length > 0 ? location.pathname : type}?data`
    )
    const data: Data | Data[] = await dataResponse.json()
    const schema = await (await fetch(`/schemas/${type}.json`)).json()
    const currentContent = this.children.namedItem('content')
    const content = document.createElement('main')

    if (Array.isArray(data)) {
      for (const entry of data) {
        const contentItem = createDatacard(entry, schema, type)
        content.append(contentItem)
      }
      content.classList.add('collection')
    } else {
      content.append(createDatacard(data, schema, type))
      content.classList.remove('collection')
    }

    content.id = 'content'
    if (currentContent !== null) {
      currentContent.replaceWith(content)
    } else {
      this.append(content)
    }

    document.title = `${type} | ${appName}`
    sessionStorage.setItem('pageTitle', document.title)
  }
}

customElements.define('app-wrapper', App)
const app = new App()
document.body.append(app)
