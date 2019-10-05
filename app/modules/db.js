export default class DataBase {
  async generateUrl (opts) {
    const entries = []
    opts = opts.keys instanceof Function
      ? opts : new Map(Object.entries(opts))

    for (const key of opts.keys()) {
      const value = opts.get(key)
      entries.push(`${key}=${value}`)
    }
    return `/json?${entries.join('&')}`
  }

  async get (opts) {
    const url = await this.generateUrl(opts)

    let data = await fetch(url)
    data = await data.json()

    return data
  }
}
