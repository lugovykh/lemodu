const template = document.createElement('template');
template.innerHTML = `
  <slot name="header"></slot>
  <slot></slot>
`;

import Router from '/modules/router.js';
import '/elements/app-header/app-header.js';
import '/elements/app-page/app-page.js';

const defaultPage = 'news';

window.router = new Router({
  '': defaultPage,
  'news': 'news-page',
  'news/:id': 'news-page',
  'users': 'user-page',
  'users/:id': 'userPage'
});

class AppBody extends HTMLElement {
  constructor() {
    super();

    const shadowRoot = this.attachShadow({mode: 'open'});
    shadowRoot.append(template.content.cloneNode(true));
  }

  async connectedCallback() {
    await this.render();

    addEventListener('popstate', async () => {
      await this.render();
    });
  }

  async render() {
    let newPage;

    if (router.history.has(location.pathname)) {
      newPage = router.history.get(location.pathname);
      console.log('The page was taken from history.');

    } else {
      // let pageTag = router.routes.get(router.path[0]);
      newPage = document.createElement('app-page');
      console.log('A new page has been created.');
    }

    if (this.currentPage) {
      this.currentPage.replaceWith(newPage);
    } else {
      this.append(newPage);
    }

    router.history.set(location.pathname, newPage);
    this.currentPage = newPage;
  }
}

customElements.define('app-body', AppBody);
const app = document.createElement('app-body');
document.body.append(app);
