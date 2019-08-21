export default class Router {
  constructor(...pages) {
    let startTime = Date.now();
    history.replaceState(null, null, this.normalizePathname());

    this.pages = new Set(pages);
    this.opts = this.getOpts();
    this.history = new Map();

    addEventListener('click', async e => {
      if (e.target.tagName != 'A' && !e.target.href) return;
      if (e.altKey || e.ctrlKey || e.shiftKey) return;
      e.preventDefault();

      try {
        await this.go(e.target.pathname);
      } catch(err) {
        e.target.classList.add('invalid');
        throw err;
      }
    });

    addEventListener('popstate', e => {
      if (!e.isTrusted) return;

      // here the path is updated in case of navigating through the browser
      // history
      this.opts = this.getOpts();
    }, true);

    console.log(`${this.constructor.name}: ${Date.now() - startTime}ms`);
  }

  normalizePathname(strPath = location.pathname) {
    if (strPath.length > 2 && strPath[strPath.length - 1] == '/') {
      return strPath.slice(0, -1);
    }
    return strPath;
  }

  getOpts(strPath = location.pathname) {
    let path = this.normalizePathname(strPath).split('/');
    let keys = ['type', 'id'];
    let opts = {};

    if (path.length > 3 || path.length > 2 && path[1] === '') {
      throw new URIError(`Invalid path: ${strPath}`);
    }
    if (!this.pages.has(path[1]) && path[1] !== '') {
      throw new URIError(`This page does not exist: ${strPath}`);
    }

    for (let i of keys.keys()) {
      let key = keys[i];

      if (path[i+1]) opts[key] = path[i+1];
    }

    if (this.getUri(opts) != strPath) {
      throw new URIError(`Invalid path: ${strPath}`);
    }
    return opts;
  }

  getUri(opts) {
    let keys = ['type', 'id'];
    let uri = '';

    for (let key of keys) {
      if (!opts[key]) break;

      uri += `/${opts[key]}`;
    }
    return uri ||'/';
  }

  async go(strPath) {
    strPath = this.normalizePathname(strPath);

    if (strPath == location.pathname) return;

    // update the opts here to validate the link and, in the case of the wrong
    // path, so that the error pops up in the link listener and then there is an
    // opportunity to process this invalid link
    this.opts = this.getOpts(strPath);

    history.pushState(null, null, strPath);
    dispatchEvent(new PopStateEvent('popstate'));
  }
}
