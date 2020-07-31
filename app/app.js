import DataBase from './modules/db'
import Router from './modules/router'
import './modules/app-header'
import './modules/app-page'
import './modules/app-datacard'

const appName = 'main'

const db = new DataBase()
const router = new Router(['news', 'users', 'about'])

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

class App extends HTMLElement {
  dataStructures = {
    news: {
      title: 'title',
      '': 'content',
      'top-bar': ['publication_date', 'author']
    },
    users: {
      title: 'nickname',
      '': 'about',
      'top-bar': ['first_name', 'last_name', 'birth_date']
    }
  }

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

  createDatacard (rawData, dataType) {
    const dataStructure = this.dataStructures[dataType]
    const fieldContentTypes = {
      users: 'nickname'
    }

    const fieldHandler = (rawField) => {
      const field = {}

      if (rawField.id) {
        const { id, type } = rawField
        const contentName = fieldContentTypes[type]
        field.content = rawField[contentName]
        field.href = router.generateUri({ type, id })
      } else if (rawField.length === 24 &&
        /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}Z$/.test(rawField)
      ) {
        field.datetime = rawField
        field.content = new Date(rawField)
        field.content = field.content.toLocaleString()
      } else if (rawField.length === 10 &&
        /^\d{4}-\d{2}-\d{2}$/.test(rawField)
      ) {
        field.datetime = rawField
        field.content = new Date(rawField)
        field.content = field.content.toLocaleDateString()
      } else {
        field.content = rawField
      }
      return field
    }

    const datacard = document.createElement('app-datacard')
    datacard.rawData = rawData
    datacard.structure = dataStructure
    datacard.handler = fieldHandler

    return datacard
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

    if (!this.header) {
      this.header = document.createElement('app-header')
      this.append(this.header)
    }
    if (id) {
      newPage.classList.add('item')
      newPage.append(this.createDatacard(data, type))
    } else {
      for (const [id, entry] of Object.entries(data)) {
        const datacard = this.createDatacard(entry, type)
        datacard.id = `${type}${id}`
        newPage.append(datacard)
      }
    }
    if (!this.page) {
      this.append(newPage)
    } else {
      this.page.replaceWith(newPage)
    }

    document.title = `${type} — ${appName}`
    sessionStorage.setItem('pageTitle', document.title)
    this.page = newPage
    console.log(`${this.constructor.name}: ${Date.now() - startTime}ms`)
  }
}

customElements.define(`${appName}-app`, App)
const app = document.createElement(`${appName}-app`)
document.body.append(app)
