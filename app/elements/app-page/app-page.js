const template = document.createElement('template');
template.innerHTML = `
  <style>
    :host {
      grid-area: page;
      display: grid;
      grid: auto / repeat(auto-fill, minmax(400px, 1fr));
      grid-gap: 32px;
      padding: 32px;
    }
    @media (max-width: 600px) {
      :host {
        padding: 32px 16px;
      }
    }
    :host(.item) {
      grid: auto / minmax(400px, 800px);
      justify-content: center;
    }
  </style>
  <slot></slot>
`;

import '/elements/app-card/app-card.js';

class AppPage extends HTMLElement {
  constructor() {
    super();

    this.attachShadow({mode: 'open'});
    this.shadowRoot.append(template.content.cloneNode(true));
  }

  async connectedCallback() {
    await this.render();
  }

  async render() {
    const startTime = Date.now();
    const visibleFields = {};

    visibleFields.news = new Map()
      .set('title', {tag: 'h2'})
      .set('date', {tag: 'time'})
      .set('author', {tag: 'span'})
      .set('content', {});

    visibleFields.users = new Map()
      .set('nickname', {tag: 'h2'})
      .set('first-name', {tag: 'span'})
      .set('birthday', {tag: 'time'})
      .set('last-name', {tag: 'span'})
      .set('about', {});

    let createCard = async (entry, destination) => {
      const card = document.createElement('app-card');
      const fields = visibleFields[type];

      for await (const key of fields.keys()) {
        const value = entry[key];
        const tag = fields.get(key).tag || 'div';
        const element = document.createElement(tag);
        let content = value;

        if (key == 'title' || key == 'author') {
          content = document.createElement('a');
          content.setAttribute('href', await router.getUri({type, id}));
 
          if (key == 'author') {
            content.setAttribute('href',
              await router.getUri({type: 'users', id: [value.id]})
            );
          }
          content.append(value.nickname || value);
        }
        if (tag == 'time') {
          element.setAttribute('datetime', value);
        }
        element.setAttribute('slot', key);
        element.append(content);
        card.append(element);
      }
      if (destination) destination.append(card);
      return card;
    };

    let opts = await router.getOpts();
    if (!opts.size) opts.set('type', 'news');
    let data = await db.get(opts);
    let type = opts.get('type');
    let id = opts.get('id');

    if (opts.has('id')) {
      this.classList.add('item');
      await createCard(data, this);

    } else {      
      for await (id of Object.keys(data)) {
        const entry = data[id];
        await createCard(entry, this);
      }
    }
    console.log(`${this.constructor.name}: ${Date.now() - startTime}ms`);
  }
}

customElements.define('app-page', AppPage);
