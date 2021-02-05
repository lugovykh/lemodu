import type { Page } from '../app'

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
  routes?: string[]
  pathKeys?: string[]
  handler?: (routeContent: Page) => Promise<void>

  #params?: Record<string, Params>
  #routes?: Set<string>
  #pathKeys: Set<string>
  #handler: (uri?: Link) => void

  constructor ({
    routes,
    pathKeys = ['type', 'id'],
    handler
  }: Partial<Router>) {
    this.routes = routes
    this.pathKeys = pathKeys
    this.handler = handler

    this.#routes = new Set(routes)
    this.#pathKeys = new Set(pathKeys)
    this.#handler = async (uri?: Link) => {
      await this.handler?.(await this.getPage(uri))
    }

    history.replaceState(
      null, '', `${this.trimPathname()}${location.search}${location.hash}`
    )

    addEventListener('click', e => {
      if (e.altKey || e.ctrlKey || e.shiftKey) return

      const link = e.composedPath().find(element => {
        switch ((element as HTMLElement).tagName) {
          case 'AREA': case 'A':
            return (element as Link).href
        }
        return false
      })

      if (link != null) {
        e.preventDefault()
        // eslint-disable-next-line @typescript-eslint/no-floating-promises
        this.go(link as Link)
      }
    })

    addEventListener('popstate', () => this.#handler())
    this.#handler()
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

  trimPathname (pathname = location.pathname): string {
    if (pathname.length > 2 && pathname.endsWith('/')) {
      return pathname.slice(0, -1)
    } else {
      return pathname
    }
  }

  getParams ({ pathname = '', search }: Link = location): Params {
    if (pathname.startsWith('/')) {
      pathname = pathname.slice(1)
    }
    const { pathKeys = [] } = this
    const pathValues = this.trimPathname(pathname).split('/')

    const pathParams = new Map(pathKeys.map((key, i) => {
      const value = pathValues[i]
      return [key, value]
    }))
    const searchParams = new URLSearchParams(search)

    return {
      ...Object.fromEntries(pathParams),
      ...Object.fromEntries(searchParams)
    }
  }

  async getPage (uri: Link = location): Promise<Page> {
    const routeParams = this.getParams(uri)
    const routeData = await import(`../pages/${routeParams.type}.js`)

    return routeData
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

  async go (link: Link | string): Promise<void> {
    let uri: string

    if (typeof link === 'string') {
      uri = link
    } else if (link?.pathname != null) {
      const { pathname, search, hash } = link
      if (pathname === location.pathname &&
        search === location.search &&
        hash === location.hash
      ) return
      uri = `${this.trimPathname(pathname)}${search ?? ''}${hash ?? ''}`
    } else if (link?.href != null) {
      uri = link.href
      if (uri === location.href) return
    } else {
      uri = ''
    }

    this.#handler(new URL(uri, location.origin))
    history.pushState(null, '', uri)
  }
}
