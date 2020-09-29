// eslint-disable-next-line @typescript-eslint/no-explicit-any
const styleSheet: any = new CSSStyleSheet()
const CSS = `
  :host {
    display: grid;
    grid: none / auto-flow;
    line-height: 1.5;
    font-weight: 600;
    color: var(--menu-font-color);
    font-variant: small-caps;
  }
  ::slotted(*) {
    overflow: hidden;
    white-space: nowrap;
    padding: 8px 16px;
  }
  ::slotted(a) {
    color: var(--menu-font-color);
    text-decoration: none;
  }
`
const template = document.createElement('template')
template.innerHTML = `
  <slot></slot>
`

export class Menu extends HTMLElement {
  constructor() {
    super()

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const shadow: any = this.attachShadow({ mode: 'open' })
    shadow.adoptedStyleSheets = [styleSheet]
    shadow.append(template.content.cloneNode(true))
  }

  connectedCallback(): void {
    if (styleSheet.cssRules.length === 0) {
      styleSheet.replaceSync(CSS)
    }

    this.render()
  }

  render(): void {
    //
  }
}

customElements.define('app-menu', Menu)
