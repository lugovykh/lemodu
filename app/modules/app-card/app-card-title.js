const styleSheet = new CSSStyleSheet()
const CSS = `
  :host {
    flex-grow: 1;
    flex-basis: 0%;
    position: relative;
    overflow: hidden;
    display: flex;
    flex-flow: column;
    align-items: center;
    box-sizing: border-box;
    padding: 0 8px;
    color: var(--content-font-color);
    // border-left: var(--content-left-border);
  }
  #label {
    font-size: .8em;
    color: var(--additional-font-color);
  }
  ::slotted(*) {
    font-weight: 600;
  }
`
const template = document.createElement('template')
template.innerHTML = `
<h2><a id="title"><slot></slot></a></h2>
`

class AppCardTitle extends HTMLElement {
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
    this.shadowRoot.querySelector('#title').setAttribute(
      'href', this.dataset.href
    )
    this.setAttribute('slot', 'title')
  }
}

customElements.define('app-card-title', AppCardTitle)
