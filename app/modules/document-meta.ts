export function getMeta (name: string): HTMLMetaElement | undefined {
  const { head } = document
  let meta = head.children.namedItem(name)

  if (meta instanceof HTMLMetaElement && meta.name === name) {
    return meta
  } else if (meta != null) {
    meta = head.querySelector(`meta[name=${name}]`)
    if (meta instanceof HTMLMetaElement) {
      return meta
    }
  }
}

export function setMeta (
  name: string,
  props?: Partial<HTMLMetaElement>
): HTMLMetaElement {
  const { head } = document
  const meta = getMeta(name) ?? document.createElement('meta')

  if (!head.contains(meta)) {
    meta.name = name
    head.append(meta)
  }
  Object.assign(meta, props)

  return meta
}

export const documentMeta = {
  get description (): string {
    return getMeta('description')?.content ?? ''
  },

  set description (content: string) {
    const maxLength = 155
    content = content.substr(0, maxLength)
    setMeta('description', { content })
  }
}
