import './app-card-meta'

const styleSheet = new CSSStyleSheet()
const CSS = `
  :host {
    position: relative;
    overflow: hidden;
    display: flex;
    flex-flow: column;
    box-sizing: border-box;
    padding: 8px 16px;
    text-decoration: none;
    color: var(--content-font-color);
    background-color: var(--content-bg-color);
    border: var(--content-border);
    border-top: var(--content-top-border);
    border-right: var(--content-right-border);
    border-bottom: var(--content-bottom-border);
    border-left: var(--content-left-border);
    border-radius: var(--content-border-radius);
  }
  ::slotted(*) {
    margin: 0 0 16px;
  }
  a#title {
    max-width: 100%;
    align-self: center;
    text-decoration: none;
  }
  ::slotted(h2) {
    overflow: hidden;
    font-size: 1.2em;
    font-weight: 600;
    font-variant: small-caps;
    color: var(--titel-font-color);
    white-space: nowrap;
    text-overflow: ellipsis;
  }
  ::slotted(p) {
    margin: 0 0 1em;
    font-size: 1em;
    white-space: pre-wrap;
    text-align: justify;
  }
  slot[name$="-bar"] {
    display: flex;
    flex-flow: row wrap;
  }
`
const template = document.createElement('template')
template.innerHTML = `
  <a id="title"><slot name="title"></slot></a>
  <slot name="top-bar"></slot>
  <slot></slot>
`

class AppCard extends HTMLElement {
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
  }
}

customElements.define('app-card', AppCard)
