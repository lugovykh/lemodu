// eslint-disable-next-line @typescript-eslint/no-explicit-any
const styleSheet: any = new CSSStyleSheet()
const styles = `
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
  constructor (label: string, value: Element) {
    super()

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const shadow: any = this.attachShadow({ mode: 'open' })
    shadow.adoptedStyleSheets = [styleSheet]
    shadow.append(template.content.cloneNode(true))

    if (value != null) {
      value.slot = 'value'
      this.append(label ?? '', value)
    }
  }

  connectedCallback (): void {
    if (styleSheet.cssRules.length === 0) {
      styleSheet.replaceSync(styles)
    }
  }
}

customElements.define('app-labeled-field', LabeledField)
