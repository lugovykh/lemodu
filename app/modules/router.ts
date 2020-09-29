interface Link {
  pathname?: string
  search?: string
  hash?: string
  href?: string
}
interface Params {
  [key: string]: string
}

export default class Router {
  #params?: Record<string, Params>
  pages: Set<string>
  pathKeys: Set<string>

  constructor(pages: string[], pathKeys = ['type', 'id']) {
    this.pages = new Set(pages)
    this.pathKeys = new Set(pathKeys)

    history.replaceState(
      null, '', `${this.normalizePathname()}${location.search}${location.hash}`
    )

    addEventListener('click', e => {
      if (e.altKey || e.ctrlKey || e.shiftKey) return

      const link = e.composedPath().find(element => {
        return (element as HTMLElement)?.tagName === 'A' && (element as Link)?.href
      }) as Link | undefined

      if (!link) return
      e.preventDefault()
      this.go(link)
    })
  }

  get params(): Params {
    const { pathname, search } = location
    const uri = `${pathname}${search}`
    let params = this.#params?.[uri]

    if (!params) {
      params = this.getParams({ pathname, search })
      this.#params = { [uri]: params }
    }
    return params
  }

  normalizePathname(pathname = location.pathname): string {
    if (pathname.length > 2 && pathname.endsWith('/')) {
      return pathname.slice(0, -1)
    }
    return pathname
  }

  getParams({ pathname, search }: Link = location): Params {
    const params: Params = {}
    const pathParams = this.normalizePathname(pathname).split('/')
    const rawParamsIterator = pathParams.values()
    rawParamsIterator.next()

    for (const key of this.pathKeys) {
      const value = rawParamsIterator.next().value

      if (value) {
        params[key] = value
      } else if (rawParamsIterator.next().value) {
        throw new URIError(`Invalid URI path: ${pathname}`)
      } else break
    }
    if (search) {
      const searchParams = search.slice(1).split('&')
      for (const entry of searchParams) {
        const [key, value] = entry.split('=')
        params[key] = value
      }
    }
    return params
  }

  generateUri(params: Params): string {
    const pathEntries: string[] = []
    const searchEntries: string[] = []

    for (const [key, value] of Object.entries(params)) {
      if (this.pathKeys.has(key)) {
        pathEntries.push(`${value}`)
      } else {
        searchEntries.push(`${key}=${value}`)
      }
    }
    return `/${pathEntries.join('/')}` +
      `${searchEntries.length ? searchEntries.join('&') : ''}`
  }

  go(link: Link | string): void {
    let uri: string | undefined

    if (typeof link === 'string') {
      uri = link
    } else if (link?.pathname) {
      const { pathname, search, hash } = link
      if (pathname === location.pathname &&
        search === location.search &&
        hash === location.hash
      ) return
      uri = `${this.normalizePathname(pathname)}${search}${hash}`
    } else if (link?.href) {
      uri = link.href
      if (uri === location.href) return
    }

    history.pushState(null, '', uri)
    dispatchEvent(new PopStateEvent('popstate'))
  }
}
