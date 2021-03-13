// eslint-disable-next-line @typescript-eslint/no-explicit-any
const styleSheet: any = new CSSStyleSheet()
const styles = `
  :host {
    display: flex;
    line-height: 1.5;
    font-weight: 600;
    color: var(--ui-font-color);
    font-variant: small-caps;
  }
  ::slotted(*) {
    overflow: hidden;
    white-space: nowrap;
    padding: .5em 1em;
  }
`
const template = document.createElement('template')
template.innerHTML = `
  <slot></slot>
`

export default class Menu extends HTMLElement {
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

    this.render()
  }

  render (): void {
    const pages = ['news', 'users', 'about']

    for (const value of pages) {
      const item = document.createElement('a')
      item.href = `/${value}`
      item.append(value)

      this.append(item)
    }
  }
}

customElements.define('app-menu', Menu)
