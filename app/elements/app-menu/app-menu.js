const template = document.createElement('template');
template.innerHTML = `
  <style>
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
  </style>
  <slot></slot>
`;

class AppMenu extends HTMLElement {
  constructor() {
    super();

    this.attachShadow({mode: 'open'});
    this.shadowRoot.append(template.content.cloneNode(true));
  }
}

customElements.define('app-menu', AppMenu);
