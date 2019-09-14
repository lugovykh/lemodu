const styleSheet = new CSSStyleSheet();
styleSheet.replaceSync(`
a.invalid {
  text-decoration: line-through !important;
}
`);
document.adoptedStyleSheets = [...document.adoptedStyleSheets, styleSheet];

export default class Router {
  constructor(pages, pathKeys = ['type', 'id']) {
    const startTime = Date.now();
    history.replaceState(null, null,
      `${this.normalizePathname()}${location.search}${location.hash}`
    );

    this.pages = new Set(pages);
    this.pathKeys = new Set(pathKeys);
    this.history = new Map();
    this._opts = new Map(); // cache

    addEventListener('click', async e => {
      if (e.target.tagName != 'A'
        || !e.target.href
        || e.altKey
        || e.ctrlKey
        || e.shiftKey
      ) return;
      e.preventDefault();

      if (e.target.classList.contains('invalid')) return;

      try {
        // get the opts here to validate the link and, in the case of the wrong
        // URI, so that the error pops up in the link listener and then there
        // is an opportunity to process this invalid link
        await this.getOpts(e.target);

      } catch (err) {
        e.target.classList.add('invalid');
        throw err;
      }
      this.go(e.target);
    });

    console.log(`${this.constructor.name}: ${Date.now() - startTime}ms`);
  }

  normalizePathname(strPath = location.pathname) {
    if (strPath.length > 2 && strPath[strPath.length - 1] == '/') {
      return strPath.slice(0, -1);
    }
    return strPath;
  }

  async getOpts({ pathname, search } = location) {
    const url = `${pathname}${search}`;
    if (this._opts.has(url)) {
      return this._opts.get(url);
    }

    let opts = new Map();
    let rawOpts = this.normalizePathname(pathname).split('/').slice(1);
    let rawOptsIterator = rawOpts.values();

    if (rawOpts[0] && !this.pages.has(rawOpts[0])) {
      throw new URIError(`Invalid URI: ${url}`);
    }

    for await (const key of this.pathKeys) {
      const value = rawOptsIterator.next().value;

      if (value) {
        opts.set(key, value);

      } else if (rawOptsIterator.next().value) {
        throw new URIError(`Invalid URI: ${url}`);

      } else break;
    }

    rawOpts = search.slice(1).split('&');

    for await (const entry of rawOpts) {
      if (!entry) break;

      opts.set(...entry.split('='));
    }

    if (await this.getUri(opts) !== url) {
      throw new URIError(`Invalid URI: ${url}`);
    }

    this._opts.clear();
    this._opts.set(url, opts);
    return opts;
  }

  async getUri(opts) {
    let pathEntries = [];
    let searchEntries = [];

    opts = opts.keys instanceof Function
      ? opts : new Map(Object.entries(opts));

    for await (const [key, value] of opts) {
      if (this.pathKeys.has(key)) {
        pathEntries.push(`${value}`);
      } else {
        searchEntries.push(`${key}=${value}`);
      }
    }
    return `/${pathEntries.join('/')}`
      + `${searchEntries.length ? searchEntries.join('&') : ''}`;
  }

  async go({ pathname, search, hash }) {
    pathname = this.normalizePathname(pathname);

    if (pathname === location.pathname
      && search === location.search
      && hash === location.hash
    ) return;

    history.pushState(null, null, `${pathname}${search}${hash}`);
    dispatchEvent(new PopStateEvent('popstate'));
  }
}
