'use strict';

let newCard = document.createElement('ui-card');
newCard.className = 'info';
newCard.innerHTML = '<h2 slot="title">Hello World!</h2><p>Привет мир!</p>';
document.body.append(newCard);

let newCard1 = document.createElement('ui-card');
newCard1.className = 'warning';
newCard1.textContent = 'Hell World!';
document.body.append(newCard1);
