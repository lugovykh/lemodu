const template = document.createElement('template');
template.innerHTML = `
  <slot></slot>
`;

import '/elements/app-card/app-card.js';

class NewsPage extends HTMLElement {
  constructor() {
    super();

    const shadowRoot = this.attachShadow({mode: 'open'});
    shadowRoot.append(template.content.cloneNode(true));
  }

  async connectedCallback() {
    await this.render();

    addEventListener('popstate', async e => {
      await this.render();
    });
  }

  async render() {
    if (router.history.has(location.pathname)) return;

    let fields = new Map()
      .set('title', {tag: 'h2'})
      .set('date', {tag: 'time'})
      .set('author', {tag: 'span'})
      .set('content', {});

    let createCard = entry => {
      let card = document.createElement('app-card');

      for (let key of fields.keys()) {
        let tag = fields.get(key).tag || 'div';
        let value = entry[key];
        let element;

        if (key == 'title' || key == 'author') {
          element = document.createElement('a');
          element.setAttribute('href', `/news/${id}`);
          if (key == 'author') {
            element.setAttribute('href', `/users/${id}`);
          }
          element.append(value)

        } else {
          element = document.createElement(tag);
          element.append(value);
        }
        if (tag == 'time') {
          element.setAttribute('datetime', value);
        }
        element.setAttribute('slot', key);
        card.append(element);
      }
      this.append(card);
    };

    let page = router.path[0] || router.routes.get('');
    let id = router.path[1];

    if (id) {
      let response = await fetch(`/${page}/${id}.json`);
      let data = await response.json();

      createCard(data)

    } else {
      let response = await fetch(`/${page}.json`);
      let data = await response.json();

      for (id in data) {
        let entry = data[id];
        createCard(entry)
      }
    }
  }
}

customElements.define('app-page', NewsPage);
