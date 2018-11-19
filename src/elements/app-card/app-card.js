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
    ::slotted(h2),
    [name=title]::slotted(*) {
      margin: 0;
      font-size: 1.4em;
      font-weight: normal;
      color: #000;
      text-decoration: none;
    }
    ::slotted(span),
    ::slotted(time) {
      font-size: .9em;
      color: #888;
    }
    ::slotted(p) {
      margin: 1em 0 0;
      text-align: justify;
      color: #444;
    }
    ::slotted(div) {
      white-space: pre-wrap;
    }
  </style>
  <!-- article -->
  <slot name="title"></slot>
  <slot name="date"></slot>
  <slot name="author"></slot>
  <slot name="content"></slot>
  <!-- user -->
  <slot name="nickname"></slot>
  <slot name="first-name"></slot>
  <slot name="last-name"></slot>
  <slot name="birthday"></slot>
  <slot name="about"></slot>
  <slot></slot>
`;

class AppCard extends HTMLElement {
  constructor() {
    super();

    const shadowRoot = this.attachShadow({mode: 'open'});
    shadowRoot.append(template.content.cloneNode(true));
  }
}

customElements.define('app-card', AppCard);
