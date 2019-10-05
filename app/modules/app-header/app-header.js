import '/modules/app-menu/app-menu.js';

const styleSheet = new CSSStyleSheet();
const CSS = `
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
`;
const template = document.createElement('template');
template.innerHTML = `
  <slot name="menu"></slot>
  <slot></slot>
`;

export default class AppHeader extends HTMLElement {
  constructor() {
    super();

    this.attachShadow({ mode: 'open' });
    this.shadowRoot.adoptedStyleSheets = [styleSheet];
    this.shadowRoot.append(template.content.cloneNode(true));
  }

  async connectedCallback() {
    if (styleSheet.cssRules.length == 0) {
      styleSheet.replaceSync(CSS);
    }

    this.render();
  }

  async render() {
    const menu = document.createElement('app-menu');
    const pages = ['news', 'users', 'about'];

    for await (const value of pages) {
      const subMenu = document.createElement('a');
      subMenu.setAttribute('href', `/${value}`);
      subMenu.append(value);

      menu.append(subMenu);
    }
    menu.setAttribute('slot', 'menu');
    this.append(menu);
  }
}

customElements.define('app-header', AppHeader);
