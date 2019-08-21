const template = document.createElement('template');
template.innerHTML = `
  <style>
    :host {
      display: flex;
      flex-flow: column;
      box-sizing: border-box;
      padding: 8px 16px 16px;
      background-color: var(--content-bg-color);
      border: var(--content-border);
      border-top: var(--content-top-border);
      border-right: var(--content-right-border);
      border-bottom: var(--content-bottom-border);
      border-left: var(--content-left-border);
      border-radius: var(--content-border-radius);
    }
    a {
      font-variant: small-caps;
    }
    ::slotted(h2),
    [name=title]::slotted(*) {
      margin: 0 auto;
      font-size: 1.5em;
      font-weight: 600;
      color: var(--titel-font-color);
      font-variant: small-caps;
      text-decoration: none;
    }
    ::slotted(span),
    ::slotted(time) {
      font-size: .9em;
      color: var(--additional-font-color);
    }
    ::slotted(p) {
      margin: 16px 0 0;
      text-align: justify;
      color: var(--additional-font-color);
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

    this.attachShadow({mode: 'open'});
    this.shadowRoot.append(template.content.cloneNode(true));
  }
}

customElements.define('app-card', AppCard);
