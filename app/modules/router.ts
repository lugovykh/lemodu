import type { Page } from '../app'

export function normalizePathname (pathname = location.pathname): string {
  if (pathname.length > 2 && pathname.endsWith('/')) {
    return pathname.slice(0, -1)
  } else {
    return pathname
  }
}

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
  handler?: (routeContent: Page) => void

  #paramsCache?: Record<string, Params>
  #handler: (uri?: Link) => void

  constructor ({
    pathKeys = ['type', 'id'],
    handler
  }: Partial<Router>) {
    this.pathKeys = pathKeys
    this.handler = handler

    this.#handler = (uri: Link = location) => {
      this.getPage(uri)
        .then(page => this.handler?.(page))
        .catch(console.log)
    }

    history.replaceState(
      null, '', `${normalizePathname()}${location.search}${location.hash}`
    )

    addEventListener('click', e => {
      if (e.altKey || e.ctrlKey || e.shiftKey) return

      const link = e.composedPath().find(element => {
        switch ((element as Element).tagName) {
          case 'AREA': case 'A': return (element as Link).href
        } return false
      })
      if (link == null) return

      e.preventDefault()
      this.go(link as Link)
    })

    addEventListener('popstate', () => this.#handler())
    this.#handler()
  }

  get params (): Params {
    const { pathname, search } = location
    const uri = `${pathname}${search}`
    const params = this.#paramsCache?.[uri] ?? this.getParams()

    this.#paramsCache = { [uri]: params }
    return params
  }

  getParams ({ pathname = '', search }: Link = location): Params {
    if (pathname.startsWith('/')) {
      pathname = pathname.slice(1)
    }
    const { pathKeys = [] } = this
    const pathValues = normalizePathname(pathname).split('/')

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
    const params = this.getParams(uri)
    const page = await import(`../pages/${params.type}.js`)

    await page.setParams(params)
    return page
  }

  go ({ href, pathname, search, hash }: Link): void {
    const uriString = href ??
      `${normalizePathname(pathname ?? '')}${search ?? ''}${hash ?? ''}`
    const uriObject = new URL(uriString, href ?? location.origin)

    if (uriObject.href === location.href) return

    this.#handler(uriObject)
    history.pushState(null, '', uriString)
  }

  generateUri (params: Params): string {
    const pathEntries = []
    const searchEntries = new URLSearchParams()

    for (const [key, value] of Object.entries(params)) {
      const pathIndex = this.pathKeys?.indexOf(key)

      if (pathIndex != null && pathIndex !== -1) {
        pathEntries[pathIndex] = value
      } else {
        searchEntries.set(key, value)
      }
    }
    return `/${pathEntries.join('/')}${searchEntries.toString()}`
  }
}
