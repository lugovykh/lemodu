const template = document.createElement('template');
template.innerHTML = `
  <style>
    :host {
      display: flex;
      flex-flow: column;
      margin: 16px auto;
      padding: 16px;
      min-width: 24em;
      max-width: 40em;
      background-color: #FFF;
      border-radius: 2px;
      box-shadow: 0 1px 4px rgba(0,0,0,.2);
    }
    [name=title]::slotted(*) {
      margin: 0;
      font-size: 1.2em;
      color: #000;
    }
    [name=date]::slotted(*),
    [name=author]::slotted(*) {
      font-size: .9em;
      color: #888;
    }
    ::slotted(p) {
      margin: 1em 0 0;
      text-align: justify;
      color: #444;
    }
  </style>

  <slot name="title"></slot>
  <slot name="date"></slot>
  <slot name="author"></slot>
  <slot name="content"></slot>
`;

class AppCard extends HTMLElement {
  constructor() {
    super();

    const shadowRoot = this.attachShadow({mode: 'open'});
    shadowRoot.append(template.content.cloneNode(true));
  }
}

customElements.define('app-card', AppCard);
