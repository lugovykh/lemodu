const styleSheet = new CSSStyleSheet();
const CSS = `
  :host {
    display: grid;
    grid: none / auto-flow;
    line-height: 1;
    font-weight: 600;
    color: var(--menu-font-color);
    text-transform: uppercase;
    text-decoration: none;
  }
  ::slotted(*) {
    overflow: hidden;
    white-space: nowrap;
    padding: 16px;
  }
  ::slotted(a) {
    color: var(--menu-font-color);
    text-decoration: none !important;
  }
`;
const template = document.createElement('template');
template.innerHTML = `
  <slot></slot>
`;

class AppMenu extends HTMLElement {
  constructor() {
    super();

    this.attachShadow({ mode: 'open' });
    this.shadowRoot.adoptedStyleSheets = [styleSheet];
    this.shadowRoot.append(template.content.cloneNode(true));
  }

  async connectedCallback() {
    this.render();
  }

  async render() {
    if (styleSheet.cssRules.length == 0) {
      styleSheet.replaceSync(CSS);
    }
  }
}

customElements.define('app-menu', AppMenu);
