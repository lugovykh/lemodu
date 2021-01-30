export type JsonSchema = {
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
  JsonSchemaObject
) | {
  type: 'array'
} | {
  type: 'boolean'
} | {
  type: 'null'
}

export interface JsonSchemaObject {
  properties: Record<string, JsonSchema>
}
