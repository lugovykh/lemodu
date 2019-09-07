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
    let opts = await router.getOpts();
    if (!opts.size) opts.set('type', 'news');
    const content = await db.get(opts);
    const type = opts.get('type');
    const id = opts.get('id');

    const newPage = document.createElement('app-page');
    const visibleFields = {};

    visibleFields.news = new Map()
      .set('title', { tag: 'a' })
      .set('date', { tag: 'time' })
      .set('author', { tag: 'a' })
      .set('content', {});

    visibleFields.users = new Map()
      .set('nickname', { tag: 'a' })
      .set('first-name', { tag: 'span' })
      .set('last-name', { tag: 'span' })
      .set('birthday', { tag: 'time' })
      .set('about', {});

    const fields = visibleFields[type];

    if (id) {
      newPage.classList.add('item');
      newPage.append(await this.createCard(content, { type, id, fields }));

    } else {
      for await (const id of Object.keys(content)) {
        const entry = content[id];
        newPage.append(await this.createCard(entry, { type, id, fields }));
      }
    }

    if (styleSheet.cssRules.length == 0) {
      styleSheet.replaceSync(CSS);
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
    const card = document.createElement('app-card');
    const { fields } = opts;

    for await (const [key, value] of Object.entries(entry)) {
      if (!fields.has(key) || value === null) continue;

      const title = fields.keys().next().value;
      let element;
      let content;
      let wrapperTag;
      let uriOpts;

      if (key == title) {
        const { type, id } = opts;
        wrapperTag = 'h2';
        uriOpts = { type, id };

      } else if (value.type && value.id) {
        const { type, id } = value;
        uriOpts = { type, id };
      }

      if (uriOpts) {
        element = document.createElement('a');
        element.setAttribute('href', await router.getUri(uriOpts));
        content = document.createElement(wrapperTag || 'div');
      } else if (key == 'date') {
        element = document.createElement('time');
        element.setAttribute('datetime', value);
      } else {
        element = document.createElement('div');
      }
      if (content) {
        content.append(element);
      } else {
        content = element;
      }

      element.append(value.nickname || value);
      content.setAttribute('slot', key);
      card.append(content);
    }

    return card;
  }
}

customElements.define(`${appName}-app`, App);
const app = document.createElement(`${appName}-app`);
document.body.append(app);
