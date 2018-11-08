const template = document.createElement('template');
template.innerHTML = `
  <slot></slot>
`;

class UserPage extends HTMLElement {
  constructor() {
    super();

    const shadowRoot = this.attachShadow({mode: 'open'});
    shadowRoot.append(template.content.cloneNode(true));
  }

  async connectedCallback() {
    let response = await fetch('/users.json');
    let data = await response.json();
    let fields = new Map();

    fields.set('nickname', 'h2');
    fields.set('first-name', 'span');
    fields.set('last-name', 'span');
    fields.set('birthday', 'time');
    fields.set('about');

    for (let item in data) {
      let card = document.createElement('app-card');

      for (let key of fields.keys()) {
        if (!data[item][key]) continue;

        let element = document.createElement(fields.get(key) || 'div');
        element.setAttribute('slot', key);
        element.append(data[item][key]);

        card.append(element);
      }
      this.append(card);
    }
  }
}

customElements.define('user-page', UserPage);
