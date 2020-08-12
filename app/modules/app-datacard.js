import './app-datacard-meta.js'

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
    margin: 0 0 1em;
  }
  ::slotted(h2) {
    align-self: center;
    max-width: 100%;
    overflow: hidden;
    font-size: 1.2em;
    font-weight: 600;
    font-variant: small-caps;
    color: var(--titel-font-color);
    white-space: nowrap;
    text-decoration: none;
    text-overflow: ellipsis;
  }
  ::slotted(p) {
    margin: 0 0 1em;
    font-size: 1em;
    white-space: pre-wrap;
    text-align: justify;
  }
  slot[name$="Bar"] {
    display: flex;
    flex-flow: row wrap;
  }
`
const template = document.createElement('template')
template.innerHTML = `
  <slot name="title"></slot>
  <slot name="topBar"></slot>
  <slot></slot>
  <slot name="bottomBar"></slot>
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

  render () {
    if (!this.data?.toString) {
      throw new Error(`Invalid or empty data: ${this.data}`)
    }

    const data = this.#data ?? this.prepareData()

    const wrapСontent = (content, wrapper) => {
      if (wrapper?.append && wrapper !== content) {
        wrapper.append(content)
        return wrapper
      } else {
        return content
      }
    }

    for (const [fieldName, fieldProps] of Object.entries(data)) {
      const { slot, href, src, datetime } = fieldProps
      let { content } = fieldProps
      let wrapper

      if (datetime) {
        wrapper = document.createElement('time')
        wrapper.dateTime = datetime
      } else if (src) {
        wrapper = document.createElement('img')
        wrapper.src = src
      }
      content = wrapСontent(content, wrapper)

      if (href) {
        wrapper = document.createElement('a')
        wrapper.href = href
      }
      content = wrapСontent(content, wrapper)

      if (slot === 'title') {
        wrapper = document.createElement('h2')
      } else if (/Bar$/.test(slot)) {
        wrapper = document.createElement('app-datacard-meta')
        wrapper.dataset.label = fieldName
      } else if (!wrapper) {
        wrapper = document.createElement('div')
      }
      content = wrapСontent(content, wrapper)

      content.id = fieldName
      content.slot = slot
      this.append(content)
    }
    return this
  }

  prepareData ({ data, structure, handler } = this) {
    const processedData = {}

    const addField = (fieldName, slot) => {
      const rawField = data[fieldName]
      if (!rawField) return

      const field = handler(rawField)
      field.slot = slot
      processedData[fieldName] = field
    }

    for (const [slot, fieldNames] of Object.entries(structure)) {
      if (Array.isArray(fieldNames)) {
        for (const key of fieldNames.keys()) {
          const fieldName = fieldNames[key]
          addField(fieldName, slot)
        }
      } else {
        const fieldName = fieldNames
        addField(fieldName, slot)
      }
    }
    return processedData
  }
}

customElements.define('app-datacard', AppDatacard)
