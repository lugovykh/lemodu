import '/elements/app-card/app-card.js';

const template = document.createElement('template');
template.innerHTML = `
  <slot name="header"></slot>
  <slot></slot>
`;

class AppBody extends HTMLElement {
  constructor() {
    super();

    const shadowRoot = this.attachShadow({mode: 'open'});
    shadowRoot.append(template.content.cloneNode(true));
  }

  async connectedCallback() {
    let response = await fetch('/news.json');
    let data = await response.json();
    let fields = new Map();

    fields.set('title', 'h2');
    fields.set('date', 'time');
    fields.set('author', 'span');
    fields.set('content');

    for (let item in data) {
      let card = document.createElement('app-card');

      for (let key of fields.keys()) {
        let element = document.createElement(fields.get(key) || 'div');
        element.setAttribute('slot', key);
        element.append(data[item][key]);

        card.append(element);
      }
      this.append(card);
    }
  }
}

customElements.define('app-body', AppBody);
const app = document.createElement('app-body');
document.body.append(app);
