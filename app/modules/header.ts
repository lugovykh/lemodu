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
    background-color: var(--ui-background-color);
    backdrop-filter: blur(var(--ui-blur));
    border-bottom: var(--ui-border);
    box-shadow: var(--ui-box-shadow);
    filter: drop-shadow(var(--ui-drop-shadow));
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
