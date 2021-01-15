export interface Link {
  pathname?: string
  search?: string
  hash?: string
  href?: string
}
interface Params {
  [key: string]: string
}

export default class Router {
  pages?: string[]
  callback?: (params?: unknown) => void
  pathKeys?: string[]

  #params?: Record<string, Params>
  #pages?: Set<string>
  #pathKeys: Set<string>

  constructor ({
    pages,
    callback,
    pathKeys = ['type', 'id']
  }: Partial<Router>) {
    this.pages = pages
    this.callback = callback
    this.pathKeys = pathKeys

    this.#pages = new Set(pages)
    this.#pathKeys = new Set(pathKeys)

    history.replaceState(
      null, '', `${this.normalizePathname()}${location.search}${location.hash}`
    )

    addEventListener('click', e => {
      if (e.altKey || e.ctrlKey || e.shiftKey) return

      const link = e.composedPath().find(element => {
        switch ((element as HTMLElement).tagName) {
          case 'A':
          case 'AREA':
            return (element as Link).href
        }
      }) as Link | undefined

      if (link != null) {
        e.preventDefault()
        this.go(link)
      }
    })

    addEventListener('popstate', () => this.callback?.())
  }

  get params (): Params {
    const { pathname, search } = location
    const uri = `${pathname}${search}`
    let params = this.#params?.[uri]

    if (params == null) {
      params = this.getParams({ pathname, search })
      this.#params = { [uri]: params }
    }
    return params
  }

  normalizePathname (pathname = location.pathname): string {
    if (pathname.length > 2 && pathname.endsWith('/')) {
      return pathname.slice(0, -1)
    }
    return pathname
  }

  getParams ({ pathname, search }: Link = location): Params {
    const params: Params = {}
    const pathParams = this.normalizePathname(pathname).split('/')
    const rawParamsIterator = pathParams.values()
    rawParamsIterator.next()

    for (const key of this.#pathKeys) {
      const value = rawParamsIterator.next().value

      if (value != null) {
        params[key] = value
      } else if (rawParamsIterator.next().value != null) {
        throw new URIError(`Invalid URI path: ${String(pathname)}`)
      } else break
    }
    if (search != null) {
      const searchParams = search.slice(1).split('&')
      for (const entry of searchParams) {
        const [key, value] = entry.split('=')
        params[key] = value
      }
    }
    return params
  }

  generateUri (params: Params): string {
    const pathEntries: string[] = []
    const searchEntries: string[] = []

    for (const [key, value] of Object.entries(params)) {
      if (this.#pathKeys.has(key)) {
        pathEntries.push(`${value}`)
      } else {
        searchEntries.push(`${key}=${value}`)
      }
    }
    return `/${pathEntries.join('/')}` +
      `${searchEntries.length > 0 ? searchEntries.join('&') : ''}`
  }

  go (link: Link | string): void {
    let uri: string | undefined

    if (typeof link === 'string') {
      uri = link
    } else if (link?.pathname != null) {
      const { pathname, search, hash } = link
      if (pathname === location.pathname &&
        search === location.search &&
        hash === location.hash
      ) return
      uri = `${this.normalizePathname(pathname)}${search ?? ''}${hash ?? ''}`
    } else if (link?.href != null) {
      uri = link.href
      if (uri === location.href) return
    }

    history.pushState(null, '', uri)
    this.callback?.()
  }
}
