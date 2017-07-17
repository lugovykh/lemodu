'use strict';

let newCard = document.createElement('ui-card');
newCard.insertAdjacentHTML(
  'beforeEnd',
  '<h2 slot="title">Hello World!</h2>'
);
newCard.insertAdjacentHTML(
  'beforeEnd',
  '<span slot="date">2017.07.07</span>'
);
newCard.insertAdjacentHTML(
  'beforeEnd',
  '<p>Привет мир!</p>'
);
document.body.append(newCard);

let newCard1 = document.createElement('ui-card');
newCard1.textContent = 'Hell World!';
document.body.append(newCard1);
