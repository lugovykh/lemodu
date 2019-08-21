const template = document.createElement('template');
template.innerHTML = `
  <style>
    :host {
      display: flex;
      flex-flow: column;
      margin: 16px auto;
      padding: 16px;
      background-color: #FFF;
      box-shadow: 0 1px 4px rgba(0,0,0,.2);
    }
    ::slotted(div) {
      white-space: pre-wrap;
    }
  </style>
  <slot name="logo"></slot>
  <slot></slot>
`;

class AppCard extends HTMLElement {
  constructor() {
    super();

    const shadowRoot = this.attachShadow({mode: 'open'});
    shadowRoot.append(template.content.cloneNode(true));
  }
}

customElements.define('app-header', AppCard);
