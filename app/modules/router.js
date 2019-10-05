export default class Router {
  constructor (pages, pathKeys = ['type', 'id']) {
    const startTime = Date.now()
    history.replaceState(null, null,
      `${this.normalizePathname()}${location.search}${location.hash}`
    )

    this.pages = new Set(pages)
    this.pathKeys = new Set(pathKeys)
    this._params = new Map() // cache

    addEventListener('click', async e => {
      if (e.target.tagName !== 'A' ||
        e.target.href === undefined ||
        e.altKey ||
        e.ctrlKey ||
        e.shiftKey
      ) return
      e.preventDefault()

      if (e.target.classList.contains('invalid')) return

      try {
        // get the params here to validate the link and, in the case of the wrong
        // URI, so that the error pops up in the link listener and then there
        // is an opportunity to process this invalid link
        await this.getParams(e.target)
      } catch (err) {
        e.target.classList.add('invalid')
        throw err
      }
      this.go(e.target)
    })

    console.log(`${this.constructor.name}: ${Date.now() - startTime}ms`)
  }

  normalizePathname (strPath = location.pathname) {
    if (strPath.length > 2 && strPath[strPath.length - 1] === '/') {
      return strPath.slice(0, -1)
    }
    return strPath
  }

  async getParams ({ pathname, search } = location) {
    const url = `${pathname}${search}`
    if (this._params.has(url)) {
      return this._params.get(url)
    }

    const params = new Map()
    let rawParams = this.normalizePathname(pathname).split('/').slice(1)
    const rawParamsIterator = rawParams.values()

    if (rawParams[0] && !this.pages.has(rawParams[0])) {
      throw new URIError(`Invalid URI: ${url}`)
    }

    for await (const key of this.pathKeys) {
      const value = rawParamsIterator.next().value

      if (value) {
        params.set(key, value)
      } else if (rawParamsIterator.next().value) {
        throw new URIError(`Invalid URI: ${url}`)
      } else break
    }

    rawParams = search.slice(1).split('&')

    for await (const entry of rawParams) {
      if (!entry) break

      params.set(...entry.split('='))
    }

    if (await this.getUri(params) !== url) {
      throw new URIError(`Invalid URI: ${url}`)
    }

    this._params.clear()
    this._params.set(url, params)
    return params
  }

  async getUri (params) {
    const pathEntries = []
    const searchEntries = []

    params = params.keys instanceof Function
      ? params : new Map(Object.entries(params))

    for await (const [key, value] of params) {
      if (this.pathKeys.has(key)) {
        pathEntries.push(`${value}`)
      } else {
        searchEntries.push(`${key}=${value}`)
      }
    }
    return `/${pathEntries.join('/')}` +
      `${searchEntries.length ? searchEntries.join('&') : ''}`
  }

  async go ({ pathname, search, hash }) {
    pathname = this.normalizePathname(pathname)

    if (pathname === location.pathname &&
      search === location.search &&
      hash === location.hash
    ) return

    history.pushState(null, null, `${pathname}${search}${hash}`)
    dispatchEvent(new PopStateEvent('popstate'))
  }
}
