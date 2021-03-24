// eslint-disable-next-line @typescript-eslint/no-explicit-any
const styleSheet: any = new CSSStyleSheet()
const styles = `
  :host {
    display: grid;
    grid: auto / repeat(auto-fit, minmax(320px, 480px));
    place-content: start center;
    gap: 2em;
  }
`
const template = document.createElement('template')
template.innerHTML = `
  <slot></slot>
`

export default class Collection extends HTMLElement {
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

customElements.define('app-collection', Collection)
