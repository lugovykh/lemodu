import { Meta } from './datacard-meta.js'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const styleSheet: any = new CSSStyleSheet()
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
  slot[name$="Meta"] {
    display: flex;
    flex-flow: row wrap;
  }
`
const template = document.createElement('template')
template.innerHTML = `
  <slot name="title"></slot>
  <slot name="basicMeta"></slot>
  <slot name="extraMeta"></slot>
  <slot></slot>
`

export interface Field {
  content: string
  dateTime?: string
  href?: string
  slot?: string
}
export interface Structure {
  title?: string
  basicMeta?: string | string[]
  extraMeta?: string | string[]
  content: string
}
export type Handler = (rawField: unknown) => Field | undefined

export class Datacard extends HTMLElement {
  data?: Record<string, unknown>
  structure?: Structure
  handler?: Handler

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

  get href(): string {
    return this.getAttribute('href') ?? ''
  }

  set href(value: string) {
    if (value) {
      this.setAttribute('href', value)
    } else {
      this.removeAttribute('href')
    }
  }

  render(): void {
    const data = this.prepareData()

    for (const [fieldName, fieldProps] of Object.entries(data)) {
      this.append(this.createField(fieldName, fieldProps))
    }
  }

  wrapContent<T extends HTMLElement>(field: string | T, wrapper: T): T {
    if (wrapper !== field) {
      wrapper.append(field)
    }
    return wrapper
  }

  createField(name: string, props: Field): HTMLElement {
    const { slot, content, dateTime, href } = props
    let field: HTMLElement | undefined, wrapper: HTMLElement

    if (dateTime) {
      const timeElement = document.createElement('time')
      timeElement.dateTime = dateTime
      field = this.wrapContent(content, timeElement)
    }
    if (href) {
      const anchorElement = document.createElement('a')
      anchorElement.href = href
      field = this.wrapContent(field ?? content, anchorElement)
    }

    if (slot === 'title') {
      const headingElement = document.createElement('h2')
      wrapper = headingElement
    } else if (slot?.endsWith('Meta')) {
      const metaElement = new Meta()
      metaElement.label = name
      wrapper = metaElement
    } else {
      wrapper = document.createElement('div')
    }
    field = this.wrapContent(field ?? content, wrapper)

    if (slot && slot !== 'content') field.slot = slot
    field.className = name
    return field
  }

  prepareData({ data, structure, handler } = this): Record<string, Field> {
    if (!data || !structure || !handler) {
      throw new TypeError(`Some required properties are undefined: ${{ data, structure, handler }}`)
    }
    const fieldList: Record<string, Field> = {}
    const addFieldToList = (fieldName: string, slot: string): void => {
      const rawField = data[fieldName]
      const field = handler(rawField)
      if (!field) return

      field.slot = slot
      fieldList[fieldName] = field
    }

    for (const [slot, fieldNames] of Object.entries(structure)) {
      if (Array.isArray(fieldNames)) {
        for (const name of fieldNames) addFieldToList(name, slot)
      } else {
        const name = fieldNames
        addFieldToList(name, slot)
      }
    }
    if (this.href && structure.title) {
      fieldList[structure.title].href = this.href
    }
    return fieldList
  }
}

customElements.define('app-datacard', Datacard)
