import LabeledField from './labeled-field.js'
import type { JsonSchema, JsonSchemaObject } from './json-schema'

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
  ::slotted(:not(:last-child)) {
    margin: 0 0 1em;
  }
  ::slotted(h2) {
    max-width: 100%;
    overflow: hidden;
    text-align: center;
    font-size: 1.2em;
    font-weight: 600;
    font-variant: small-caps;
    color: var(--title-font-color);
    white-space: nowrap;
    text-overflow: ellipsis;
  }
  [name="meta"] {
    display: flex;
    flex-flow: row wrap;
    justify-content: space-evenly;
    gap: 1em;
  }
  #content::slotted(:where(p, div)) {
    text-align: justify;
  }
`
const template = document.createElement('template')
template.innerHTML = `
  <slot name="title"></slot>
  <slot name="meta"></slot>
  <slot id="content"></slot>
`

export interface DatacardStructure {
  title?: string
  meta?: string | string[]
  content: string | string[]
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

export interface FieldProps {
  name?: string
  label?: string
  slot?: string
  href?: string
}

export function createField (
  value: string,
  schema: JsonSchema,
  props?: FieldProps
): HTMLElement | string {
  let field: string | HTMLElement
  let { label = '', slot = '' } = props ?? {}

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

          const timeWrapper = document.createElement('time')
          timeWrapper.dateTime = value
          timeWrapper.textContent = content
          field = timeWrapper
        } break
        case 'email': {
          const anchorWrapper = document.createElement('a')
          anchorWrapper.href = `mailto:${value}`
          anchorWrapper.textContent = value
          field = anchorWrapper
        }
      }
    }
  }
  field ??= value

  // eslint-disable-next-line @typescript-eslint/strict-boolean-expressions
  if (props?.href) {
    const anchorWrapper = document.createElement('a')
    anchorWrapper.href = props.href
    field = wrapContent(field, anchorWrapper)
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
      const labeledField = new LabeledField()
      labeledField.append(label, field)
      field = labeledField
    }

    if (slot !== '') field.slot = slot
    // eslint-disable-next-line @typescript-eslint/strict-boolean-expressions
    if (props?.name) field.classList.add(props.name)
  }
  return field
}

export default class Datacard extends HTMLElement {
  data?: Record<string, unknown>
  schema?: JsonSchemaObject
  structure?: DatacardStructure
  href?: string

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

  async connectedCallback (): Promise<void> {
    if (styleSheet.cssRules.length === 0) {
      styleSheet.replace(CSS)
    }

    await this.render()
  }

  async render (): Promise<void> {
    const { data, schema, structure } = this
    if (data == null || structure == null || schema == null) return

    if (this.classList.contains('edit')) {
      const { createForm } = await import('./create-form.js')
      this.append(createForm(schema))
    } else {
      const props: Record<string, FieldProps> = {}
      // eslint-disable-next-line @typescript-eslint/strict-boolean-expressions
      if (this.href && structure?.title != null) {
        props[structure.title] = {
          href: this.href
        }
      }
      for (const [slot, fieldNames] of Object.entries(structure)) {
        if (Array.isArray(fieldNames)) {
          for (const name of fieldNames) {
            const value = String(data[name])
            const fieldSchema = schema.properties[name]
            this.append(createField(
              value, fieldSchema, {
                name, label: name, slot, ...props?.[name]
              }
            ))
          }
        } else {
          const name = fieldNames
          const value = String(data[name])
          const fieldSchema = schema.properties[name]
          this.append(createField(
            value, fieldSchema, {
              name, label: name, slot, ...props?.[name]
            }
          ))
        }
      }
    }
  }
}

customElements.define('app-datacard', Datacard)
