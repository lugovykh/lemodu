import type { Page } from '../app'

type ParamKey = string
interface ParamValues { [paramKey: string]: string[] }
export type PathTree = Array<ParamKey | ParamValues | PathTree>

interface BranchEntry { [paramKey: string]: PathTree }
interface Branches { [paramValue: string]: BranchEntry }

interface RouteParams {
  page?: string
  remainingPathname?: string
}
export interface PageParams { [key: string]: string }

export interface PageModule {
  pathTree?: PathTree
  generate: (params: PageParams) => Page | Promise<Page>
}
type PageHandler = (page: Page) => void | Promise<void>

export type Link = Partial<URL>

export function isLink (target: unknown): boolean {
  if (
    target instanceof HTMLAnchorElement ||
    target instanceof HTMLAreaElement
  ) {
    return target.href !== ''
  } return false
}

export function normalizePathname (pathname = location.pathname): string {
  if (pathname.length > 2 && pathname.endsWith('/')) {
    return pathname.slice(0, -1)
  } else {
    return pathname
  }
}

export default class Router {
  pathTree: PathTree
  #handler?: PageHandler

  constructor (routerParams: Partial<Router> = {}) {
    const { pathTree = ['page'], handler } = routerParams

    history.replaceState(
      null, '', `${normalizePathname()}${location.search}${location.hash}`
    )
    this.pathTree = pathTree
    this.handler = handler
  }

  get handler (): PageHandler | undefined { return this.#handler }
  set handler (handler: PageHandler | undefined) {
    if (handler === this.#handler) {
      return
    } else if (handler == null) {
      this.#deleteClickListener?.()
      this.#deletePopstateListener?.()
    } else if (this.#handler == null) {
      this.#setClickListener()
      this.#setPopstateListener()
    }
    this.#handler = handler
    this.#handleRoute().catch(console.log)
  }

  #handleRoute = async (page?: Page): Promise<void> => {
    await this.#handler?.(page ?? await this.getPage())
  }

  #handleClick = async (e: MouseEvent): Promise<void> => {
    if (e.altKey || e.ctrlKey || e.shiftKey) return

    const link = e.composedPath().find(isLink)
    if (link == null) return

    e.preventDefault()
    await this.go(link as Link)
  }

  #deleteClickListener?: () => void
  #setClickListener = (): void => {
    if (this.#deleteClickListener != null) return

    const clickListener = (e: MouseEvent): void => {
      this.#handleClick(e).catch(console.log)
    }
    this.#deleteClickListener = () => {
      this.#deleteClickListener = undefined
      removeEventListener('click', clickListener)
    }
    addEventListener('click', clickListener)
  }

  #deletePopstateListener?: () => void
  #setPopstateListener = (): void => {
    if (this.#deletePopstateListener != null) return

    const popstateListener = (): void => {
      this.#handleRoute().catch(console.log)
    }
    this.#deletePopstateListener = () => {
      this.#deletePopstateListener = undefined
      removeEventListener('popstate', popstateListener)
    }
    addEventListener('popstate', popstateListener)
  }

  parseBranches (pathTree = this.pathTree): Branches {
    const branches: Branches = {}

    for (const point of pathTree) {
      const remainingBranches: PathTree = []

      if (Array.isArray(point)) {
        const branching = point

        Object.assign(branches, this.parseBranches(branching))
        remainingBranches.push(...point.slice(1))
      } else if (typeof point === 'string') {
        const paramKey = point
        const anyValue = '*'

        branches[anyValue] = { [paramKey]: remainingBranches }
      } else {
        for (const paramKey in point) {
          const validValues = point[paramKey]

          for (const value of validValues) {
            branches[value] = { [paramKey]: remainingBranches }
          }
        }
      }
      remainingBranches.push(...pathTree.slice(1))
    }
    return branches
  }

  parseParams (
    { pathname = '', search, searchParams }: Link = location,
    pathTree = this.pathTree
  ): RouteParams & PageParams {
    pathname = normalizePathname(pathname)
    searchParams ??= new URLSearchParams(search)
    const searchEntries = Object.fromEntries(searchParams)

    if (pathname.startsWith('/')) pathname = pathname.slice(1)
    if (pathname === '') return { ...searchEntries }

    const pathValues = pathname.split('/')
    const pathEntries: PageParams = {}

    let remainingBranches = pathTree
    let remainingPathname = ''

    for (const value of pathValues) {
      if (remainingBranches.length === 0) {
        remainingPathname += `/${value}`
        continue
      }
      const currentBranch = this.parseBranches(remainingBranches)
      const branchEntry = currentBranch[value] ?? currentBranch['*']

      if (branchEntry == null) {
        throw new URIError(`Unknown branch: ${String(remainingBranches)}`)
      }
      for (const paramKey in branchEntry) {
        if (paramKey in searchEntries) {
          throw new URIError(`Same parameter in path and search: ${paramKey}`)
        }
        pathEntries[paramKey] = value
        remainingBranches = branchEntry[paramKey]
      }
    }
    return {
      ...pathEntries,
      ...searchEntries,
      remainingPathname
    }
  }

  async getPage (
    { pathname, ...restUriProps }: Link = location
  ): Promise<Page> {
    const {
      page = 'home',
      remainingPathname,
      ...basicParams
    } = this.parseParams({ pathname })

    const {
      pathTree = [],
      generate
    } = await import(`../pages/${page}.js`) as PageModule

    const {
      remainingPathname: invalidRemainder = '',
      ...pageParams
    } = this.parseParams(
      { pathname: remainingPathname, ...restUriProps },
      pathTree
    )
    if (invalidRemainder !== '') {
      throw new URIError(`Invalid remainder: (${invalidRemainder})`)
    }

    return await generate({ ...basicParams, ...pageParams })
  }

  async go ({
    href, origin = location.origin,
    pathname = '', search = '', hash = ''
  }: Link): Promise<void> {
    const uriString = href ?? `${pathname}${search}${hash}`
    const uriObject = new URL(uriString, href ?? origin)
    uriObject.pathname = normalizePathname(pathname)

    if (uriObject.href === location.href) return

    const page = await this.getPage(uriObject)
    history.pushState(null, page.title ?? '', uriString)
    await this.#handleRoute(page)
  }

  /**
   * @deprecated The method should not be used
   */
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
