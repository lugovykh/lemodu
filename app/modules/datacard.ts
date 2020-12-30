import LabeledField from './labeled-field.js'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const styleSheet: any = new CSSStyleSheet()
const CSS = `
  :host {
    overflow: hidden;
    display: flex;
    flex-flow: column;
    box-sizing: border-box;
    padding: 1em 2em;
    color: var(--content-font-color);
    background-color: var(--content-background-color);
    border: var(--content-border);
    border-radius: var(--main-border-radius);
    box-shadow: var(--main-box-shadow);
    filter: drop-shadow(var(--content-drop-shadow));
  }
  ::slotted(*) {
    margin: 0 0 1em;
  }
  ::slotted(h2) {
    max-width: 100%;
    overflow: hidden;
    text-align: center;
    font-size: 1.2em;
    font-weight: 600;
    font-variant: small-caps;
    color: var(--titel-font-color);
    white-space: nowrap;
    text-overflow: ellipsis;
  }
  [name$="Meta"] {
    display: flex;
    flex-flow: row wrap;
    justify-content: space-evenly;
    gap: 1em;
  }
  #content::slotted(*) {
    text-align: justify;
  }
`
const template = document.createElement('template')
template.innerHTML = `
  <slot name="title"></slot>
  <slot name="basicMeta"></slot>
  <slot name="extraMeta"></slot>
  <slot id="content"></slot>
`

export interface DatacardFieldProps {
  content: string
  dateTime?: string
  href?: string
  slot?: string
}
export interface DatacardStructure {
  title?: string
  basicMeta?: string | string[]
  extraMeta?: string | string[]
  content: string
}

export type DatacardJsonSchema = {
  type: 'string'
  minLength: number
  maxLength: number
  pattern: string
  format:
  | 'date-time'
  | 'time'
  | 'date'
  | 'email'
} | {
  type: 'number'
} | {
  type: 'object'
  properties: Record<string, DatacardJsonSchema>
} | {
  type: 'array'
} | {
  type: 'boolean'
} | {
  type: 'null'
}

export function wrapContent<T extends HTMLElement> (
  field: string | T,
  wrapper: T
): T {
  if (wrapper !== field) {
    wrapper.append(field)
  }
  return wrapper
}

export function createField (name: string, props: DatacardFieldProps): HTMLElement {
  const { slot, content, dateTime, href } = props
  let field: HTMLElement | undefined
  let wrapper: HTMLElement

  // eslint-disable-next-line @typescript-eslint/strict-boolean-expressions
  if (dateTime) {
    const timeElement = document.createElement('time')
    timeElement.dateTime = dateTime
    field = wrapContent(content, timeElement)
  }
  // eslint-disable-next-line @typescript-eslint/strict-boolean-expressions
  if (href) {
    const anchorElement = document.createElement('a')
    anchorElement.href = href
    field = wrapContent(field ?? content, anchorElement)
  }

  if (slot === 'title') {
    const headingElement = document.createElement('h2')
    wrapper = headingElement
  } else if (slot?.endsWith('Meta') != null) {
    const metaElement = new LabeledField()
    metaElement.label = name
    wrapper = metaElement
  } else {
    wrapper = document.createElement('div')
  }
  field = wrapContent(field ?? content, wrapper)

  // eslint-disable-next-line @typescript-eslint/strict-boolean-expressions
  if (slot) field.slot = slot
  field.className = name
  return field
}

export default class Datacard extends HTMLElement {
  data?: Record<string, unknown>
  structure?: DatacardStructure
  handler?: (rawField: unknown) => DatacardFieldProps | undefined

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

    this.render()
  }

  get href (): string {
    return this.getAttribute('href') ?? ''
  }

  set href (value: string) {
    if (value !== '') {
      this.setAttribute('href', value)
    } else {
      this.removeAttribute('href')
    }
  }

  render ({ data, structure, handler } = this): void {
    if (data == null || structure == null || handler == null) return

    const prepareFieldProps = (fieldName: string, slotName: string): DatacardFieldProps | undefined => {
      const content = data[fieldName]
      const fieldProps = handler(content)

      if (fieldProps != null && slotName !== 'content') {
        fieldProps.slot ??= slotName
      }
      return fieldProps
    }

    for (const [slotName, fieldNames] of Object.entries(structure)) {
      if (Array.isArray(fieldNames)) {
        for (const fieldName of fieldNames) {
          const fieldProps = prepareFieldProps(fieldName, slotName)
          if (fieldProps != null) {
            this.append(createField(fieldName, fieldProps))
          }
        }
      } else {
        const fieldName = fieldNames
        const fieldProps = prepareFieldProps(fieldName, slotName)
        if (fieldProps != null) {
          if (slotName === 'title' && this.href !== '') {
            fieldProps.href = this.href
          }
          this.append(createField(fieldName, fieldProps))
        }
      }
    }
  }
}

customElements.define('app-datacard', Datacard)
