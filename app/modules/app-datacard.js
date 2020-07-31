import './app-datacard-meta'

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

class AppDatacard extends HTMLElement {
  #data

  constructor () {
    super()

    this.attachShadow({ mode: 'open' })
    this.shadowRoot.adoptedStyleSheets = [styleSheet]
    this.shadowRoot.append(template.content.cloneNode(true))
  }

  connectedCallback () {
    if (styleSheet.cssRules.length === 0) {
      styleSheet.replaceSync(CSS)
    }

    this.render()
  }

  set data (data) {
    this.#data = data
  }

  get data () {
    return this.#data
  }

  render () {
    if (!this.data?.toString && !this.rawData?.toString) {
      throw new Error(`Invalid data: ${this.data}`)
    }

    const data = this.#data ?? this.prepareData()

    const wrapField = (field, wrapper) => {
      if (wrapper && wrapper !== field) {
        wrapper.append(field)
        field = wrapper
      }
      return field
    }

    for (const [fieldName, fieldProps] of Object.entries(data)) {
      const { slot, href, src, datetime } = fieldProps
      let { content: field } = fieldProps
      let wrapper

      if (datetime) {
        wrapper = document.createElement('time')
        wrapper.setAttribute('datetime', datetime)
      } else if (src) {
        wrapper = document.createElement('img')
        wrapper.setAttribute('src', src)
      }
      field = wrapField(field, wrapper)

      if (href) {
        wrapper = document.createElement('a')
        wrapper.setAttribute('href', href)
      }
      field = wrapField(field, wrapper)

      if (slot === 'title') {
        wrapper = document.createElement('h2')
        wrapper.setAttribute('slot', slot)
      } else if (/-bar$/.test(slot)) {
        wrapper = document.createElement('app-datacard-meta')
        wrapper.setAttribute('slot', slot)
        wrapper.dataset.label = fieldName
      }
      field = wrapField(field, wrapper)

      field.setAttribute?.('id', fieldName)
      this.append(field)
    }
    return this
  }

  prepareData ({ rawData, structure, handler } = this) {
    const data = {}

    for (const [slot, fieldNames] of Object.entries(structure)) {
      if (Array.isArray(fieldNames)) {
        for (const [order, key] of fieldNames.entries()) {
          const rawField = rawData[key]
          if (!rawField) continue

          const field = handler(rawField)
          data[key] = field

          field.slot ??= slot
          field.order ??= order
        }
      } else {
        const key = fieldNames
        const rawField = rawData[key]
        if (!rawField) continue

        const field = handler(rawField)
        data[key] = field
        field.slot ??= slot
      }
    }
    return data
  }
}

customElements.define('app-datacard', AppDatacard)
