import type { JsonSchema, JsonSchemaObject } from './json-schema'

export function generateFormField (
  name: string,
  schema: JsonSchema
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

export function generateForm (schema: JsonSchemaObject): HTMLFormElement {
  const form = document.createElement('form')
  for (const [fieldName, fieldSchema]
    of Object.entries(schema.properties)
  ) {
    form.append(generateFormField(fieldName, fieldSchema))
  }
  return form
}
