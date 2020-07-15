const styleSheet = new CSSStyleSheet()
const CSS = `
  :host {
    grid-area: page;
    display: grid;
    grid: auto / repeat(auto-fill, minmax(400px, 1fr));
    grid-gap: 32px;
    padding: 32px;
  }
  @media (max-width: 600px) {
    :host {
      padding: 32px 16px;
    }
  }
  :host(.item) {
    grid: auto / minmax(400px, 800px);
    justify-content: center;
  }
`
const template = document.createElement('template')
template.innerHTML = `
  <slot></slot>
`

class AppPage extends HTMLElement {
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
  }

  async render () {
  }
}

customElements.define('app-page', AppPage)
