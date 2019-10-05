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
    font-weight: 600;
    color: var(--content-font-color);
    // border-left: var(--content-left-border);
  }
  #label {
    font-size: .8em;
    font-weight: normal;
    color: var(--additional-font-color);
  }
`
const template = document.createElement('template')
template.innerHTML = `
<span id="label"></span>
<slot></slot>
`

class AppCardMeta extends HTMLElement {
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
    this.shadowRoot.querySelector('#label').append(this.dataset.label)
  }
}

customElements.define('app-card-meta', AppCardMeta)
