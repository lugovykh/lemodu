export default class Router {
  constructor(routes) {
    history.replaceState(null, null, this.normalizePathname());

    this._regExp = new RegExp('(?<=\/)[${'
      + '\\p{Alphabetic}'
      + '\\p{Mark}'
      + '\\p{Decimal_Number}'
      + '\\p{Connector_Punctuation}'
      + '\\p{Join_Control}'
      +'}]+', 'gu'
    );
    this.path = this.getPath();
    this.routes = new Map(Object.entries(routes));
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

      this.path = this.getPath();
    }, true);
  }

  normalizePathname(strPath = location.pathname) {
    if (strPath.length > 1 && strPath[strPath.length-1] == '/') {
      return strPath.slice(0, -1);
    }
    return strPath;
  }

  getPath(strPath = location.pathname) {
    let path = strPath.match(this._regExp) || [''];
    
    // validation of the received path
    if (path.join('').length + path.length != strPath.length) {
      throw new URIError(`Invalid URI: ${strPath}`);
    }

    return path;
  }

  async go(strPath) {
    strPath = this.normalizePathname(strPath);
    this.path = this.getPath(strPath);

    history.pushState(null, null, strPath);
    dispatchEvent(new PopStateEvent('popstate'));
  }
}
