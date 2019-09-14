import DataBase from '/modules/db';
import Router from '/modules/router';
import '/modules/app-header/app-header';
import '/modules/app-page/app-page';
import '/modules/app-card/app-card';

const mainStyleSheet = new CSSStyleSheet();
mainStyleSheet.replaceSync(`
  html, body {
    overflow: hidden;
    margin: 0;
    height: 100%;
  }
  body {
    font-family: var(--font-family);
    color: var(--content-font-color);
    background-color: var(--main-bg-color);
  }
  a {
    color: inherit;
    text-decoration: inherit;
  }
  a:hover {
    text-decoration: underline;
  }
`);
document.adoptedStyleSheets = [...document.adoptedStyleSheets, mainStyleSheet];

const styleSheet = new CSSStyleSheet();
const CSS = `
  :host {
    position: relative;
    display: grid;
    grid: [header-start] "header" [header-end]
      [page-start] "page" [page-end];
  }
`;
const template = document.createElement('template');
template.innerHTML = `
  <slot name="header"></slot>
  <slot></slot>
`;

const appName = 'main';

const db = new DataBase();
const router = new Router(['news', 'users', 'about']);

class App extends HTMLElement {
  constructor() {
    super();

    this.attachShadow({ mode: 'open' });
    this.shadowRoot.adoptedStyleSheets = [styleSheet];
    this.shadowRoot.append(template.content.cloneNode(true));
  }

  async connectedCallback() {
    const startTime = Date.now();
    await this.render();
    console.log(`${this.constructor.name}: ${Date.now() - startTime}ms`);

    addEventListener('popstate', async () => {
      const startTime = Date.now();
      await this.render();
      console.log(`${this.constructor.name}: ${Date.now() - startTime}ms`);
    });
  }

  async render() {
    if (styleSheet.cssRules.length == 0) {
      styleSheet.replaceSync(CSS);
    }

    let opts = await router.getOpts();
    if (!opts.size) opts.set('type', 'news');
    const data = await db.get(opts);
    const type = opts.get('type');
    const id = opts.get('id');

    const newPage = document.createElement('app-page');
    const fields = {};

    fields.news = {
      'title': 'title',
      'top-bar': ['date', 'author'],
      'content': 'content'
    };
    fields.users = {
      'title': 'nickname',
      'top-bar': ['first-name', 'last-name', 'birthday'],
      'content': 'about'
    };

    const visibleFields = fields[type];

    if (id) {
      newPage.classList.add('item');
      newPage.append(await this.createCard(data, { type, id, visibleFields }));

    } else {
      for await (const id of Object.keys(data)) {
        const entry = data[id];
        newPage.append(await this.createCard(entry, { type, id, visibleFields }));
      }
    }

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

  async createCard(entry, opts) {
    const { type, id, visibleFields } = opts;
    const card = document.createElement('app-card');

    const createField = async (key, value, slot) => {
      let field;
      let content;
      let wrapperTag;
      let uriOpts;

      if (slot == 'title') {
        wrapperTag = 'h2';
        uriOpts = { type, id };

      } else if (value.type && value.id) {
        const { type, id } = value;
        uriOpts = { type, id };
      }

      if (uriOpts) {
        content = document.createElement('a');
        content.setAttribute('href', await router.getUri(uriOpts));
        field = document.createElement(wrapperTag || 'div');

      } else if (key == 'date') {
        content = document.createElement('time');
        content.setAttribute('datetime', value);

      } else {
        content = document.createElement('div');
      }
      if (field) {
        field.append(content);
      } else {
        field = content;
      }
      content.append(value.nickname || value);
      field.setAttribute('slot', slot);

      return field;
    };

    for await (const [slot, fields] of Object.entries(visibleFields)) {
      const fieldList = (fields instanceof Array) ? fields : [fields];

      for (const key of fieldList) {
        const value = entry[key];
        if (value === null) continue;

        const field = await createField(key, value, slot);
        card.append(field);
      }
    }
    return card;
  }
}

customElements.define(`${appName}-app`, App);
const app = document.createElement(`${appName}-app`);
document.body.append(app);
