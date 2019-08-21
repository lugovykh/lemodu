export default class DataBase {
  constructor() {}

  async generateUrl(opts) {
    let entries = [];

    for (let key of Object.keys(opts)) {
      let value = opts[key];
      entries.push(`${key}=${value}`);
    }
    return `/get?${entries.join('&')}`;
  }

  async get(opts) {
    let response = await fetch(await this.generateUrl(opts));

    return await response.json();
  }
}