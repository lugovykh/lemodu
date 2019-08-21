export default class DataBase {
  constructor() {
  }

  async generateUrl(opts) {
    let entries = [];
    opts = opts.keys instanceof Function
      ? opts : new Map(Object.entries(opts));

    for (const key of opts.keys()) {
      const value = opts.get(key);
      entries.push(`${key}=${value}`);
    }
    return `/get?${entries.join('&')}`;
  }

  async get(opts) {
    let url = await this.generateUrl(opts);

    let data = await fetch(url);
    data = await data.json();

    return data;
  }
}