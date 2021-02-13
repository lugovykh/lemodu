import type { Page } from '../app'

interface Params {
  [key: string]: string
}

export interface PageModule {
  generate: (params: Params) => Page | Promise<Page>
}

export interface Link {
  pathname?: string
  search?: string
  hash?: string
  href?: string
}

export function normalizePathname (pathname = location.pathname): string {
  if (pathname.length > 2 && pathname.endsWith('/')) {
    return pathname.slice(0, -1)
  } else {
    return pathname
  }
}

export function isLink (link: Element): boolean {
  switch (link.tagName) {
    case 'AREA': case 'A': break
    default: return false
  }
  return (link as HTMLAnchorElement).href != null &&
    (link as HTMLAnchorElement).href !== ''
}

export default class Router {
  routes?: string[]
  pathKeys?: string[]
  handler?: (page: Page) => void | Promise<void>

  constructor ({
    pathKeys = ['type', 'id'],
    handler
  }: Partial<Router>) {
    this.pathKeys = pathKeys
    this.handler = handler

    this.#addClickListener()
    this.#addPopstateListener()

    history.replaceState(
      null, '', `${normalizePathname()}${location.search}${location.hash}`
    )
    this.#handleRoute().catch(console.log)
  }

  #handleRoute = async (page?: Page): Promise<void> => {
    await this.handler?.(page ?? await this.getPage())
  }

  #addClickListener = (): void => {
    const handleClick = async (e: MouseEvent): Promise<void> => {
      if (e.altKey || e.ctrlKey || e.shiftKey) return

      const link = e.composedPath().find(target => isLink(target as Element))

      if (link != null) {
        await this.go(link as Link)
        e.preventDefault()
      }
    }

    addEventListener('click', e => {
      this.#addClickListener()
      handleClick(e).catch(console.log)
    }, { once: true })
  }

  #addPopstateListener = (): void => {
    const handlePopstate = this.#handleRoute

    addEventListener('popstate', () => {
      this.#addPopstateListener()
      handlePopstate().catch(console.log)
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
    const pageModule: PageModule = await import(`../pages/${params.type}.js`)

    return await pageModule.generate(params)
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
