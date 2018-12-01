const template = document.createElement('template');
template.innerHTML = `
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

    addEventListener('popstate', async e => {
      await this.render();
    });
  }

  async render() {
    let startTime = Date.now();
    if (router.history.has(location.pathname)) return;

    let visibleFields = {};

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

    let createCard = async entry => {
      let card = document.createElement('app-card');
      let fields = visibleFields[type];

      for (let key of fields.keys()) {
        let tag = fields.get(key).tag || 'div';
        let value = entry[key];
        let element;

        if (key == 'title' || key == 'author') {
          let link = document.createElement('a');
          link.setAttribute('href', router.getUri({type, id}));
 
          if (key == 'author') {
            link.setAttribute('href',
              router.getUri({type: 'users', id: [value.id]})
            );
          }
          link.append(value.nickname || value)

          element = document.createElement(tag);
          element.append(link)

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
      return card;
    };

    let {type = 'news', id} = router.opts;
    let card;

    if (id) {
      let data = await db.get({type, id});

      card = await createCard(data);
      this.append(card);

    } else {
      let data = await db.get({type});

      for (id of Object.keys(data)) {
        let entry = data[id];
        card = await createCard(entry);
        this.append(card);
      }
      console.log(`${this.constructor.name}: ${Date.now() - startTime}ms`);
    }
  }
}

customElements.define('app-page', AppPage);
