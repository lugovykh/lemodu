const template = document.createElement('template');
template.innerHTML = `
  <slot></slot>
`;

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
  }
}

customElements.define('app-page', AppPage);
