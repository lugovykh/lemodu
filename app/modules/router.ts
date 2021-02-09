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

export function normalizePathname (pathname = location.pathname): string {
  if (pathname.length > 2 && pathname.endsWith('/')) {
    return pathname.slice(0, -1)
  } else {
    return pathname
  }
}

export default class Router {
  routes?: string[]
  pathKeys?: string[]
  handler?: (page: Page) => void | Promise<void>
  #handleRoute = async (page?: Page): Promise<void> => {
    await this.handler?.(page ?? await this.getPage())
  }

  constructor ({
    pathKeys = ['type', 'id'],
    handler
  }: Partial<Router>) {
    this.pathKeys = pathKeys
    this.handler = handler

    this.setClickHandler()
    this.setRouteHandler()

    history.replaceState(
      null, '', `${normalizePathname()}${location.search}${location.hash}`
    )
    this.#handleRoute().catch(console.log)
  }

  setClickHandler (): void {
    const handleClick = async (e: MouseEvent): Promise<void> => {
      if (e.altKey || e.ctrlKey || e.shiftKey) return

      const link = e.composedPath().find(element => {
        switch ((element as Element)?.tagName) {
          case 'AREA': case 'A': return (element as Link).href
        } return false
      })
      if (link != null) {
        e.preventDefault()
        await this.go(link as Link)
      }
      this.setClickHandler()
    }

    addEventListener('click', e => {
      handleClick(e).catch(console.log)
    }, { once: true })
  }

  setRouteHandler (): void {
    const handleRoute = async (): Promise<void> => {
      await this.#handleRoute()
      this.setRouteHandler()
    }

    addEventListener('popstate', () => {
      handleRoute().catch(console.log)
    }, { once: true })
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

  async go ({ href, pathname, search, hash }: Link): Promise<void> {
    const uriString = href ??
      `${normalizePathname(pathname ?? '')}${search ?? ''}${hash ?? ''}`
    const uriObject = new URL(uriString, href ?? location.origin)

    if (uriObject.href === location.href) return

    const page = await this.getPage(uriObject)
    history.pushState(null, page.title ?? '', uriString)
    await this.#handleRoute(page)
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
