import DataBase from './modules/db'
import Router from './modules/router'
import './modules/app-header'
import './modules/app-page'
import './modules/app-card'

const mainStyleSheet = new CSSStyleSheet()
mainStyleSheet.replaceSync(`
  html, body {
    overflow: hidden;
    margin: 0;
    height: 100%;
  }
  body {
    font-family: var(--font-family);
    color: var(--content-font-color);
    background-color: var(--main-bg-color);
  }
  a {
    color: inherit;
    text-decoration: none;
  }
  `)
document.adoptedStyleSheets = [mainStyleSheet]

const styleSheet = new CSSStyleSheet()
const CSS = `
  :host {
    position: relative;
    display: grid;
    grid: [header-start] "header" [header-end]
      [page-start] "page" [page-end];
  }
`
const template = document.createElement('template')
template.innerHTML = `
  <slot name="header"></slot>
  <slot></slot>
`

const appName = 'main'

const db = new DataBase()
const router = new Router(['news', 'users', 'about'])

class App extends HTMLElement {
  constructor () {
    super()

    this.attachShadow({ mode: 'open' })
    this.shadowRoot.adoptedStyleSheets = [styleSheet]
    this.shadowRoot.append(template.content.cloneNode(true))
  }

  async connectedCallback () {
    if (styleSheet.cssRules.length === 0) {
      styleSheet.replaceSync(CSS)
    }

    this.render()
    addEventListener('popstate', async () => {
      this.render()
    })
  }

  async render () {
    const startTime = Date.now()
    const params = await router.getParams()
    if (params.size === 0) {
      params.set('type', 'news')
    }
    const data = await db.get(params)
    const type = params.get('type')
    const id = params.get('id')
    const newPage = document.createElement('app-page')
    const cardStructures = {
      news: {
        title: 'title',
        content: 'content',
        'top-bar': ['publication_date', 'author']
      },
      users: {
        title: 'nickname',
        content: 'about',
        'top-bar': ['first_name', 'last_name', 'birth_date']
      }
    }

    if (this.header == null) {
      this.header = document.createElement('app-header')
      this.append(this.header)
    }
    if (id) {
      newPage.classList.add('item')
      newPage.append(await this.createCard(data, { type, id, cardStructures }))
    } else {
      for await (const [id, entry] of Object.entries(data)) {
        newPage.append(await this.createCard(entry, { type, id, cardStructures }))
      }
    }
    if (this.page == null) {
      this.append(newPage)
    } else {
      this.page.replaceWith(newPage)
    }
    document.title = `${type} — ${appName}`
    sessionStorage.setItem('pageTitle', document.title)
    this.page = newPage
    console.log(`${this.constructor.name}: ${Date.now() - startTime}ms`)
  }

  async createCard (entry, { type, id, cardStructures }) {
    const card = document.createElement('app-card')
    card.dataset.href = await router.getUri({ type, id })

    const createMeta = async (key, value) => {
      const meta = document.createElement('app-card-meta')
      let content = value

      if (value.type) {
        const { type, id } = value
        const { title } = cardStructures[type]
        content = document.createElement('a')
        content.setAttribute('href', await router.getUri({ type, id }))
        content.append(value[title])
      } else if (/_date$/.test(key)) {
        const date = new Date(value)
        content = document.createElement('time')
        content.setAttribute('datetime', value)
        if (value.length <= 10) {
          content.append(date.toLocaleDateString())
        } else {
          content.append(date.toLocaleString())
        }
      }
      meta.dataset.label = key
      meta.append(content)
      return meta
    }

    for await (const [slot, key] of Object.entries(cardStructures[type])) {
      if (slot === 'title') {
        const title = document.createElement('h2')
        title.setAttribute('slot', slot)
        title.append(entry[key])
        card.append(title)
      } else if (slot === 'content') {
        card.append(entry[key])
      } else {
        const keys = key
        for await (const key of keys) {
          const value = entry[key]
          if (value == null) continue
          const meta = await createMeta(key, value)
          meta.setAttribute('slot', slot)
          card.append(meta)
        }
      }
    }
    return card
  }
}

customElements.define(`${appName}-app`, App)
const app = document.createElement(`${appName}-app`)
document.body.append(app)
