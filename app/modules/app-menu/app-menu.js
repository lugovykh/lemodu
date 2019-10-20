const styleSheet = new CSSStyleSheet();
const CSS = `
  :host {
    display: grid;
    grid: none / auto-flow;
    line-height: 1.2;
    font-weight: 600;
    color: var(--menu-font-color);
    font-variant: small-caps;
  }
  ::slotted(*) {
    overflow: hidden;
    white-space: nowrap;
    padding: 8px 16px;
  }
  ::slotted(a) {
    color: var(--menu-font-color);
    text-decoration: none;
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
    if (styleSheet.cssRules.length == 0) {
      styleSheet.replaceSync(CSS);
    }

    this.render();
  }

  async render() {
  }
}

customElements.define('app-menu', AppMenu);
