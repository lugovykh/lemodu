export default class Router {
  constructor(routes) {
    this.path = location.pathname.match(/\/(\w+)/g) || ['/'];
    this.routes = new Map(Object.entries(routes));
    this.history = new Map();

    addEventListener('click', e => {
      if (e.target.tagName != 'A' && !e.target.href) return;
      if (e.altKey || e.ctrlKey || e.shiftKey) return;

      e.preventDefault();
      this.go(e.target.pathname);
    });
  }

  go(strPath) {
    let newPath = strPath.match(/\/(\w+)/g) || ['/'];
    if (newPath.join('').length !== strPath.length) return;

    this.path = newPath;
    history.pushState(null, null, strPath);
    dispatchEvent(new Event('popstate'));
  }
}
