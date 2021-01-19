// eslint-disable-next-line @typescript-eslint/no-explicit-any
const styleSheet: any = new CSSStyleSheet()
const CSS = `
  :host {
    display: flex;
    flex-flow: column;
    text-align: center;
  }
  #label {
    font-size: .8em;
    color: var(--additional-font-color);
  }
  [name=value] {
    font-weight: 600;
  }
`
const template = document.createElement('template')
template.innerHTML = `
  <slot id="label"></slot>
  <slot name="value"></slot>
`

export default class LabeledField extends HTMLElement {
  constructor () {
    super()

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const shadow: any = this.attachShadow({ mode: 'open' })
    shadow.adoptedStyleSheets = [styleSheet]
    shadow.append(template.content.cloneNode(true))
  }

  connectedCallback (): void {
    if (styleSheet.cssRules.length === 0) {
      styleSheet.replace(CSS)
    }
  }
}

customElements.define('app-labeled-field', LabeledField)
