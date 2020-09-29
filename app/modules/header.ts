import './menu.js'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const styleSheet: any = new CSSStyleSheet()
const CSS = `
  :host {
    grid-area: header;
    display: flex;
    flex-flow: row;
    background-color: var(--content-bg-color);
    border-bottom: var(--menu-border);
  }
  ::slotted(*) {
    margin: 0 auto;
  }
`
const template = document.createElement('template')
template.innerHTML = `
  <slot name="menu"></slot>
  <slot></slot>
`

class Header extends HTMLElement {
  constructor() {
    super()

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const shadow: any = this.attachShadow({ mode: 'open' })
    shadow.adoptedStyleSheets = [styleSheet]
    shadow.append(template.content.cloneNode(true))
  }

  connectedCallback() {
    if (styleSheet.cssRules.length === 0) {
      styleSheet.replaceSync(CSS)
    }

    this.render()
  }

  async render() {
    const menu = document.createElement('app-menu')
    const pages = ['news', 'users', 'about']

    for await (const value of pages) {
      const subMenu = document.createElement('a')
      subMenu.setAttribute('href', `/${value}`)
      subMenu.append(value)

      menu.append(subMenu)
    }
    menu.setAttribute('slot', 'menu')
    this.append(menu)
  }
}

customElements.define('app-header', Header)
