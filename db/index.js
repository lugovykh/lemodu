let db;

exports.connect = function() {
  db = require('./news.json');
};

exports.getItem = function(id) {
  if (!db[id]) {
    throw new Error(`Item #${id} is not found`);
  }
  return db[id];
};
