import type { Page } from '../app'

interface PageParams {
  [key: string]: string
}
interface RouteParams {
  page?: string
  remainingPathname?: string
}

interface PathEntry {
  [paramKey: string]: PathTree
}
interface Pathes {
  [paramValue: string]: PathEntry
}

export type PathTree = Array<string | PageParams | PathTree>

export interface PageModule {
  pathTree?: PathTree
  generate: (params: PageParams) => Page | Promise<Page>
}

export interface Link {
  href?: string
  pathname?: string
  search?: string
  hash?: string
}

export function normalizePathname (pathname = location.pathname): string {
  if (pathname.length > 2 && pathname.endsWith('/')) {
    return pathname.slice(0, -1)
  } else {
    return pathname
  }
}

export function isLink (target: unknown): boolean {
  if (
    target instanceof HTMLAnchorElement ||
    target instanceof HTMLAreaElement
  ) {
    return target.href !== ''
  } return false
}

export default class Router {
  pathTree: PathTree
  handler?: (page: Page) => void | Promise<void>

  constructor ({
    pathTree = ['page'],
    handler
  }: Partial<Router>) {
    this.pathTree = pathTree
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

      const link = e.composedPath().find(isLink)

      if (link == null) return

      e.preventDefault()
      await this.go(link as Link)
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

  parsePathes (pathTree = this.pathTree): Pathes {
    const pathes: Pathes = {}

    for (const point of pathTree) {
      const remainingPath: PathTree = []

      if (Array.isArray(point)) {
        const branchingPath = point

        Object.assign(pathes, this.parsePathes(branchingPath))
        remainingPath.push(...point.slice(1))
      } else if (typeof point === 'string') {
        const paramKey = point
        const anyValue = '*'

        pathes[anyValue] = { [paramKey]: remainingPath }
      } else {
        for (const paramKey in point) {
          const validValues = point[paramKey]

          for (const value of validValues) {
            pathes[value] = { [paramKey]: remainingPath }
          }
        }
      }
      remainingPath.push(...pathTree.slice(1))
    }
    return pathes
  }

  parseParams (
    { pathname = '', search }: Link = location,
    pathTree = this.pathTree
  ): RouteParams & PageParams {
    if (pathname.startsWith('/')) {
      pathname = pathname.slice(1)
    }
    const pathValues = pathname.split('/')
    const pathParams: PageParams = {}

    let remainingBranches = pathTree
    let remainingPathname = ''

    for (const value of pathValues) {
      if (remainingBranches.length === 0) {
        remainingPathname += `/${value}`
        continue
      }
      const pathes = this.parsePathes(remainingBranches)
      const pathEntry = pathes[value] ?? pathes['*']

      if (pathEntry == null) throw new URIError(String(remainingBranches))

      for (const paramKey in pathEntry) {
        pathParams[paramKey] = value
        remainingBranches = pathEntry[paramKey]
      }
    }

    const searchParams = Object.fromEntries(new URLSearchParams(search))

    return { remainingPathname, ...pathParams, ...searchParams }
  }

  async getPage ({ pathname, search }: Link = location): Promise<Page> {
    const {
      page = 'main',
      remainingPathname
    } = this.parseParams({ pathname }) as RouteParams

    const {
      pathTree = [],
      generate
    } = await import(`../pages/${page}.js`) as PageModule

    const {
      remainingPathname: impossibleTail = '',
      ...pageParams
    } = this.parseParams({ pathname: remainingPathname, search }, pathTree)

    if (impossibleTail !== '') throw new URIError(impossibleTail)

    return await generate(pageParams)
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

  generateUri (params: PageParams): string {
    const pathEntries = []
    const searchEntries = new URLSearchParams()

    for (const [key, value] of Object.entries(params)) {
      const pathIndex = this.pathTree?.indexOf(key)

      if (pathIndex != null && pathIndex !== -1) {
        pathEntries[pathIndex] = value
      } else {
        searchEntries.set(key, value)
      }
    }
    return `/${pathEntries.join('/')}${searchEntries.toString()}`
  }
}
