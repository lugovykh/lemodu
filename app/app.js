import Router from './modules/router.js'
import './modules/app-header.js'
import './modules/app-page.js'
import './modules/app-datacard.js'

const appName = 'main'

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
      topBar: ['publication_date', 'author'],
      '': 'content'
    },
    users: {
      title: 'nickname',
      topBar: ['first_name', 'last_name', 'birth_date'],
      '': 'about'
    }
  }

  constructor () {
    super()

    this.attachShadow({ mode: 'open' })
    this.shadowRoot.adoptedStyleSheets = [styleSheet]
    this.shadowRoot.append(template.content.cloneNode(true))
  }

  connectedCallback () {
    if (styleSheet.cssRules.length === 0) {
      styleSheet.replaceSync(CSS)
    }

    this.render()
    addEventListener('popstate', () => {
      this.render()
    })
  }

  createDatacard (rawData, dataType) {
    const dataStructure = this.dataStructures[dataType]
    const fieldContentTypes = {
      users: 'nickname'
    }

    const dataHandler = (rawField) => {
      const field = {}

      if (rawField._id) {
        const { _id: id, type } = rawField
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
    datacard.data = rawData
    datacard.structure = dataStructure
    datacard.handler = dataHandler

    datacard.classList.add(dataType)
    datacard.id = rawData._id

    return datacard
  }

  async render () {
    const startTime = Date.now()
    const params = router.getParams()
    if (params.size === 0) {
      params.set('type', 'news')
    }
    let data = await fetch(`${location.pathname.length > 1 ? location.pathname : 'news'}?data`) // must be fixed
    data = await data.json()
    console.log(data)
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
      for (const entry of data) {
        const datacard = this.createDatacard(entry, type)
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
