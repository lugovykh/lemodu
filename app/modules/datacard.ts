import LabeledField from './labeled-field.js'
import type { JsonSchema, JsonSchemaObject } from '../schemas/json-schema'

export type { JsonSchemaObject } from '../schemas/json-schema'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const styleSheet: any = new CSSStyleSheet()
const styles = `
  :host {
    overflow: hidden;
    display: flex;
    flex-flow: column;
    gap: 1em;
    box-sizing: border-box;
    width: clamp(320px, 100%, 800px);
    height: fit-content;
    justify-self: center;
    padding: 1em 2em;
    color: var(--content-font-color);
    background-color: var(--content-background-color);
    border: var(--content-border);
    border-radius: var(--main-border-radius);
    box-shadow: var(--main-box-shadow);
    filter: drop-shadow(var(--content-drop-shadow));
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
  title: string
  meta: string | string[]
  content: string | string[]
  [key: string]: string | string[]
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
  let { name = '', label = '', slot = '', href = '' } = props ?? {}

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

  if (href !== '') {
    const anchorWrapper = document.createElement('a')
    anchorWrapper.href = href
    field = wrapContent(field, anchorWrapper)
  }

  switch (slot) {
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

  if (label !== '')field = new LabeledField(label, field)
  if (slot !== '') field.slot = slot
  if (name !== '') field.classList.add(name)

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
      styleSheet.replaceSync(styles)
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
      for (const slot in structure) {
        let fieldNames = structure[slot]
        if (!Array.isArray(fieldNames)) {
          fieldNames = [fieldNames]
        }

        for (const name of fieldNames) {
          const value = String(data[name])
          const fieldSchema = schema.properties[name]
          this.append(createField(value, fieldSchema, {
            name, label: name, slot, ...props?.[name]
          }))
        }
      }
    }
  }
}

customElements.define('app-datacard', Datacard)
