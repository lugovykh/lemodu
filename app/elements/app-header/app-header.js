const template = document.createElement('template');
template.innerHTML = `
  <style>
    :host {
      grid-area: header;
      display: flex;
      flex-flow: row;
      background-color: var(--content-bg-color);
      border-bottom: var(--menu-border);
    }
    ::slotted(*) {
      margin: 0 auto;
    }
  </style>
  <slot name="menu"></slot>
  <slot></slot>
`;

import '/elements/app-menu/app-menu.js';

class AppHeader extends HTMLElement {
  constructor() {
    super();

    this.attachShadow({mode: 'open'});
    this.shadowRoot.append(template.content.cloneNode(true));
  }

  async connectedCallback() {
    await this.render();
  }

  async render() {
    const menu = document.createElement('app-menu');
    const pages = ['news', 'users', 'about'];

    for await (const value of pages) {
      const subMenu = document.createElement('a');
      subMenu.setAttribute('href', await router.getUri({type: value}))
      subMenu.append(value);

      menu.append(subMenu);
    }
    menu.setAttribute('slot', 'menu');
    this.append(menu);
  }
}

customElements.define('app-header', AppHeader);
