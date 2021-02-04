// eslint-disable-next-line @typescript-eslint/no-explicit-any
const styleSheet: any = new CSSStyleSheet()
const styles = `
  :host {
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
  ::slotted(*) {
    margin: 0 auto;
  }
`
const template = document.createElement('template')
template.innerHTML = `
  <slot></slot>
`

export default class Header extends HTMLElement {
  constructor () {
    super()

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const shadow: any = this.attachShadow({ mode: 'open' })
    shadow.adoptedStyleSheets = [styleSheet]
    shadow.append(template.content.cloneNode(true))
  }

  connectedCallback (): void {
    if (styleSheet.cssRules.length === 0) {
      styleSheet.replaceSync(styles)
    }
  }
}

customElements.define('app-header', Header)
