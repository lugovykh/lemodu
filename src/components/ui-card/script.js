class UiCard extends HTMLElement {
  constructor() {
    super();

    const ownerDocument = document.currentScript.ownerDocument;
    const template = ownerDocument.querySelector('template');
    const shadowRoot = this.attachShadow({mode: 'open'});
    shadowRoot.append(template.content.cloneNode(true));
  }
}

customElements.define('ui-card', UiCard);
