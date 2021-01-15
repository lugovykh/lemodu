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
}

export interface DatacardStructure {
  title?: string
  basicMeta?: string | string[]
  extraMeta?: string | string[]
  content: string
}

export type DatacardHandler =
  (rawField: unknown) => DatacardFieldProps | null

export type DatacardJsonSchema = {
  type: 'string'
  minLength?: number
  maxLength?: number
  pattern?: string
  format?:
  | 'date-time'
  | 'time'
  | 'date'
  | 'email'
} | {
  type: 'number'
} | (
  { type: 'object' } &
  DatacardJsonSchemaObject
) | {
  type: 'array'
} | {
  type: 'boolean'
} | {
  type: 'null'
}
export interface DatacardJsonSchemaObject {
  properties: Record<string, DatacardJsonSchema>
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

export function createField (
  name: string,
  props: DatacardFieldProps & { slot?: string }
): HTMLElement {
  const { slot = '', content, dateTime, href } = props
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
  } else if (slot.endsWith('Meta')) {
    const metaElement = new LabeledField()
    metaElement.label = name
    wrapper = metaElement
  } else {
    wrapper = document.createElement('div')
  }
  field = wrapContent(field ?? content, wrapper)

  if (slot !== '' && slot !== 'content') field.slot = slot
  field.className = name
  return field
}

export function createFormField (
  name: string,
  props: DatacardJsonSchema
): DocumentFragment {
  const field = document.createDocumentFragment()

  const label = document.createElement('label')
  label.textContent = name
  field.append(label)

  const input = document.createElement('input')
  switch (props.type) {
    case 'string':
      switch (props.format) {
        case 'date':
        case 'time':
        case 'email':
          input.type = props.format
          break
        case 'date-time':
          input.type = 'datetime-local'
          break

        default:
          input.type = 'text'
      }
      break
  }
  field.append(input)

  return field
}

export default class Datacard extends HTMLElement {
  data?: Record<string, unknown>
  schema?: DatacardJsonSchemaObject
  structure?: DatacardStructure
  handler?: DatacardHandler

  constructor ({ data, schema, structure, handler }: Partial<Datacard>) {
    super()

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const shadow: any = this.attachShadow({ mode: 'open' })
    shadow.adoptedStyleSheets = [styleSheet]
    shadow.append(template.content.cloneNode(true))

    this.data = data
    this.schema = schema
    this.structure = structure
    this.handler = handler
  }

  connectedCallback (): void {
    if (styleSheet.cssRules.length === 0) {
      styleSheet.replace(CSS)
    }

    this.render()
  }

  render (): void {
    const { data, schema, structure, handler } = this
    if (data == null || structure == null || handler == null) return

    const prepareFieldProps = (
      fieldName: string
    ): DatacardFieldProps | null => {
      const content = data[fieldName]
      const fieldProps = handler(content)

      return fieldProps
    }

    if (!this.classList.contains('edit')) {
      if (schema == null) return

      const form = document.createElement('form')
      for (const [fieldName, fieldSchema]
        of Object.entries(schema.properties)
      ) {
        form.append(createFormField(fieldName, fieldSchema))
      }
      this.append(form)
    } else {
      for (const [slotName, fieldNames] of Object.entries(structure)) {
        if (Array.isArray(fieldNames)) {
          for (const fieldName of fieldNames) {
            const fieldProps = prepareFieldProps(fieldName)
            if (fieldProps != null) {
              this.append(
                createField(fieldName, { ...fieldProps, slot: slotName })
              )
            }
          }
        } else {
          const fieldName = fieldNames
          const fieldProps = prepareFieldProps(fieldName)
          if (fieldProps != null) {
            if (slotName === 'title' && this.href !== '') {
              fieldProps.href = this.href
            }
            this.append(
              createField(fieldName, { ...fieldProps, slot: slotName })
            )
          }
        }
      }
    }
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
}

customElements.define('app-datacard', Datacard)
