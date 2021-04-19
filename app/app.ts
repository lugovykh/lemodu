import Router from './modules/router.js'

import { Page, mergePageParts, renderPage } from './modules/page.js'

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
    font-family: var(--ui-font-family);
    color: var(--ui-color);
    background: var(--background);
  }
  [name=header]::slotted(header) {
    grid-area: header;
    position: sticky;
    top: 0;
    z-index: 100;
    display: flex;
    flex-flow: row;
    justify-content: space-around;
    background: var(--ui-background);
    backdrop-filter: blur(var(--ui-blur));
    border-bottom: var(--ui-border);
    box-shadow: var(--ui-box-shadow);
    filter: drop-shadow(var(--ui-drop-shadow));
  }
  #content::slotted(main) {
    grid-area: content;
    display: grid;
    grid-template-columns: 1fr;
    place-content: start center;
    padding: 0 2em;
    gap: 2em;
  }
`
const template = document.createElement('template')
template.innerHTML = `
  <slot name="header"></slot>
  <slot name="aside"></slot>
  <slot id="content"></slot>
  <slot name="footer"></slot>
`

const router = new Router()

const appName = 'App'
const appDescription = 'Designed With ❤'

const initialPagePart: Page = {
  title: document.title,
  description: appDescription,
  render: () => app,
  structure: {
    header: {
      render: (used) => used ?? document.createElement('header'),
      properties: { slot: 'header' },
      structure: {
        mainMenu: (used) => used ?? new Menu()
      }
    },
    main: {
      render: (used) => used ?? document.createElement('main')
    }
  }
}

class App extends HTMLElement {
  page?: Page

  constructor () {
    super()

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const shadowRoot: any = this.attachShadow({ mode: 'open' })
    shadowRoot.adoptedStyleSheets = [styleSheet]
    shadowRoot.append(template.content.cloneNode(true))
  }

  async connectedCallback (): Promise<void> {
    if (styleSheet.cssRules.length === 0) {
      styleSheet.replaceSync(styles)
    }
    router.handler = async (page) => {
      page.title = `${page.title} — ${appName}`
      sessionStorage.setItem('pageTitle', page.title)

      this.page = page
      await this.render()
    }
    await this.render()
  }

  async render (): Promise<void> {
    const { page: dynamicPagePart } = this
    const mergedPage = dynamicPagePart != null
      ? mergePageParts(initialPagePart, dynamicPagePart)
      : initialPagePart

    await renderPage(mergedPage)
  }
}

customElements.define('app-wrapper', App)
const app = new App()
document.body.append(app)
