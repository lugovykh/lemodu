db.collection('news').insertMany([{
  title: 'Hello World!',
  publication_date: new Date(),
  author: 'admin',
  content: 'Hello everyone! It\'s my first news.\nHello everyone! It\'s my first news.\nHello everyone! It\'s my first news.'
}, {
  title: 'Hello 🌍!',
  publication_date: new Date(),
  author: 'admin',
  content: 'Hello anyone! It\'s my second news.\nHello anyone! It\'s my second news.\nHello anyone! It\'s my second news.'
}])
db.collection('users').insertMany([{
  nickname: 'admin',
  first_name: 'Sergey',
  last_name: 'Lugovykh',
  birth_date: new Date('1991-05-12'),
  about: 'The one who created it.'
}, {
  nickname: 'friend',
  first_name: 'Mikhail',
  last_name: 'P.',
  about: 'Admin\'s best friend.'
}])
