import DataBase from '/modules/db.js';
import Router from '/modules/router.js';
import '/elements/app-header/app-header.js';
import '/elements/app-page/app-page.js';

const template = document.createElement('template');
template.innerHTML = `
  <style>
    :host {
      position: relative;
      display: grid;
      grid: [header-start] "header" [header-end]
        [page-start] "page" [page-end];
    }
  </style>

  <slot name="header"></slot>
  <slot></slot>
`;

window.db = new DataBase();
window.router = new Router(['news', 'users', 'about']);

const appName = 'main';

class App extends HTMLElement {
  constructor() {
    super();

    this.attachShadow({ mode: 'open' });
    this.shadowRoot.append(template.content.cloneNode(true));
  }

  async connectedCallback() {
    await this.render();

    addEventListener('popstate', async () => {
      await this.render();
    });
  }

  async render() {
    const newPage = document.createElement('app-page');

    if (!this.currentHeader) {
      const newHeader = document.createElement('app-header');
      this.append(newHeader);
      this.currentHeader = newHeader;
    }

    if (this.currentPage) {
      this.currentPage.replaceWith(newPage);
    } else {
      this.append(newPage);
    }
    this.currentPage = newPage;
  }
}

customElements.define(`${appName}-app`, App);
const app = document.createElement(`${appName}-app`);
document.body.append(app);
