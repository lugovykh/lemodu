const styleSheet = new CSSStyleSheet();
const CSS = `
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
  ::slotted(h2) {
    margin: 0 auto;
    font-size: 1.5em;
    font-weight: 600;
    color: var(--titel-font-color);
    font-variant: small-caps;
    text-decoration: none;
  }
  ::slotted(a),
  ::slotted(div),
  ::slotted(span),
  ::slotted(time) {
    font-size: .9em;
    color: var(--additional-font-color);
  }
  ::slotted(p),
  ::slotted([slot="content"]),
  ::slotted([slot="about"]) {
    margin: 16px 0 0;
    font-size: 1em;
    white-space: pre-wrap;
    text-align: justify;
    color: var(----content-font-color);
  }
`;
const template = document.createElement('template');
template.innerHTML = `
  <!-- article -->
  <slot name="title"></slot>
  <slot name="date"></slot>
  <slot name="author"></slot>
  <slot name="content"></slot>
  <!-- user -->
  <slot name="nickname"></slot>
  <slot name="full-name">
    <slot name="first-name"></slot>
    <slot name="last-name"></slot>
  </slot>
  <slot name="birthday"></slot>
  <slot name="about"></slot>
  <slot></slot>
`;

class AppCard extends HTMLElement {
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

customElements.define('app-card', AppCard);
