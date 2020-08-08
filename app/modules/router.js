export default class Router {
  #params = new Map() // cache

  constructor (pages, pathKeys = ['type', 'id']) {
    const startTime = Date.now()
    history.replaceState(null, null,
      `${this.normalizePathname()}${location.search}${location.hash}`
    )

    this.pages = new Set(pages)
    this.pathKeys = new Set(pathKeys)

    addEventListener('click', e => {
      if (e.altKey || e.ctrlKey || e.shiftKey) return
      const link = e.path.find(target => {
        return target.tagName === 'A' && target.href
      })
      if (link == null) return
      e.preventDefault()

      this.go(link)
    })

    console.log(`${this.constructor.name}: ${Date.now() - startTime}ms`)
  }

  normalizePathname (strPath = location.pathname) {
    if (strPath.length > 2 && strPath[strPath.length - 1] === '/') {
      return strPath.slice(0, -1)
    }
    return strPath
  }

  getParams ({ pathname, search } = location) {
    const url = `${pathname}${search}`
    if (this.#params.has(url)) {
      return this.#params.get(url)
    }

    const params = new Map()
    let rawParams = this.normalizePathname(pathname).split('/').slice(1)
    const rawParamsIterator = rawParams.values()

    if (rawParams[0] && !this.pages.has(rawParams[0])) {
      throw new URIError(`Invalid URI: ${url}`)
    }

    for (const key of this.pathKeys) {
      const value = rawParamsIterator.next().value

      if (value) {
        params.set(key, value)
      } else if (rawParamsIterator.next().value) {
        throw new URIError(`Invalid URI: ${url}`)
      } else break
    }

    rawParams = search.slice(1).split('&')

    for (const entry of rawParams) {
      if (!entry) break

      params.set(...entry.split('='))
    }

    if (this.generateUri(params) !== url) {
      throw new URIError(`Invalid URI: ${url}`)
    }

    this.#params.clear()
    this.#params.set(url, params)
    return params
  }

  generateUri (params) {
    const pathEntries = []
    const searchEntries = []

    params = params.keys instanceof Function
      ? params : new Map(Object.entries(params))

    for (const [key, value] of params) {
      if (this.pathKeys.has(key)) {
        pathEntries.push(`${value}`)
      } else {
        searchEntries.push(`${key}=${value}`)
      }
    }
    return `/${pathEntries.join('/')}` +
      `${searchEntries.length ? searchEntries.join('&') : ''}`
  }

  go ({ pathname, search, hash }) {
    pathname = this.normalizePathname(pathname)

    if (pathname === location.pathname &&
      search === location.search &&
      hash === location.hash
    ) return

    history.pushState(null, null, `${pathname}${search}${hash}`)
    dispatchEvent(new PopStateEvent('popstate'))
  }
}
