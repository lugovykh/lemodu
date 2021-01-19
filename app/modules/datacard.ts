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
  [name$="Meta"]::slotted(span) {
    display: flex;
    flex-flow: column;
    text-align: center;
    font-size: .8em;
    color: var(--additional-font-color);
  }
  >> .value {
    font-weight: 600;
  }
  #content::slotted(:where(p, div)) {
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

export interface DatacardStructure {
  title?: string
  basicMeta?: string | string[]
  extraMeta?: string | string[]
  content: string
}

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
  value: string,
  schema: DatacardJsonSchema,
  props?: {
    name?: string
    label?: string
    slot?: string
    href?: string
  }
): HTMLElement | string {
  let field: string | HTMLElement
  let {
    label = '',
    slot = ''
  } = props ?? {}

  switch (schema.type) {
    case 'string': {
      let content: string
      switch (schema.format) {
        case 'date-time':
          content ??= new Date(value).toLocaleString()
        // eslint-disable-next-line no-fallthrough
        case 'date':
          content ??= new Date(value).toLocaleDateString()
        // eslint-disable-next-line no-fallthrough
        case 'time': {
          content ??= new Date(value).toLocaleTimeString()

          const timeElement = document.createElement('time')
          timeElement.dateTime = value
          timeElement.textContent = content
          field = timeElement
        } break
        case 'email': {
          const anchorElement = document.createElement('a')
          anchorElement.href = `mailto:${value}`
          anchorElement.textContent = value
          field = anchorElement
        }
      }
    }
  }
  field ??= value

  // eslint-disable-next-line @typescript-eslint/strict-boolean-expressions
  if (props?.href) {
    const anchorElement = document.createElement('a')
    anchorElement.href = props.href
    field = wrapContent(field, anchorElement)
  }

  switch (props?.slot) {
    case 'title':
      field = wrapContent(field, document.createElement('h2'))
      label = ''
      break
    case 'content':
      field = wrapContent(field, document.createElement('div'))
      label = ''
      slot = ''
      break
    default:
      if (typeof field === 'string') {
        field = wrapContent(field, document.createElement('span'))
      }
  }

  if (typeof field !== 'string') {
    if (label !== '') {
      field.slot = 'value'
      const wrapper = new LabeledField()
      wrapper.append(label, field)
      field = wrapper
    }

    if (slot !== '') field.slot = slot
    // eslint-disable-next-line @typescript-eslint/strict-boolean-expressions
    if (props?.name) field.classList.add(props.name)
  }
  return field
}

export function createFormField (
  name: string,
  schema: DatacardJsonSchema
): DocumentFragment {
  const field = document.createDocumentFragment()

  const label = document.createElement('label')
  label.textContent = name
  field.append(label)

  const input = document.createElement('input')
  switch (schema.type) {
    case 'string':
      switch (schema.format) {
        case 'date':
        case 'time':
        case 'email':
          input.type = schema.format
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

export function createForm (schema: DatacardJsonSchemaObject): HTMLFormElement {
  const form = document.createElement('form')
  for (const [fieldName, fieldSchema]
    of Object.entries(schema.properties)
  ) {
    form.append(createFormField(fieldName, fieldSchema))
  }
  return form
}

export default class Datacard extends HTMLElement {
  data?: Record<string, unknown>
  schema?: DatacardJsonSchemaObject
  structure?: DatacardStructure

  constructor ({ data, schema, structure }: Partial<Datacard>) {
    super()

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const shadow: any = this.attachShadow({ mode: 'open' })
    shadow.adoptedStyleSheets = [styleSheet]
    shadow.append(template.content.cloneNode(true))

    this.data = data
    this.schema = schema
    this.structure = structure
  }

  connectedCallback (): void {
    if (styleSheet.cssRules.length === 0) {
      styleSheet.replace(CSS)
    }

    this.render()
  }

  render (): void {
    const { data, schema, structure } = this
    if (data == null || structure == null || schema == null) return

    if (this.classList.contains('edit')) {
      this.append(createForm(schema))
    } else {
      for (const [slot, fieldNames] of Object.entries(structure)) {
        if (Array.isArray(fieldNames)) {
          for (const name of fieldNames) {
            const value = String(data[name])
            const fieldSchema = schema.properties[name]
            this.append(
              createField(value, fieldSchema, { name, label: name, slot })
            )
          }
        } else {
          const name = fieldNames
          const value = String(data[name])
          const fieldSchema = schema.properties[name]
          this.append(
            createField(value, fieldSchema, { name, label: name, slot })
          )
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
