// eslint-disable-next-line @typescript-eslint/no-explicit-any
const styleSheet: any = new CSSStyleSheet()
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
  }
  .label {
    font-size: .8em;
    font-weight: normal;
    color: var(--additional-font-color);
  }
`
const template = document.createElement('template')
template.innerHTML = `
<span class="label"></span>
<slot></slot>
`

export class Meta extends HTMLElement {
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

  get label(): string {
    return this.getAttribute('label') ?? ''
  }

  set label(value: string) {
    if (value) {
      this.setAttribute('label', value)
    } else {
      this.removeAttribute('label')
    }
  }

  render(): void {
    if (this.label) {
      this.shadowRoot?.querySelector('.label')?.append(this.label)
    }
  }
}

customElements.define('datacard-meta', Meta)
