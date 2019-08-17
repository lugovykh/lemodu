const template = document.createElement('template');
template.innerHTML = `
  <slot name="header"></slot>
  <slot></slot>
`;

import DataBase from '/modules/db.js';
import Router from '/modules/router.js';
import '/elements/app-header/app-header.js';
import '/elements/app-page/app-page.js';

window.db = new DataBase();
window.router = new Router('news', 'users');

class AppBody extends HTMLElement {
  constructor() {
    super();

    this.attachShadow({mode: 'open'});
    this.shadowRoot.append(template.content.cloneNode(true));
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
