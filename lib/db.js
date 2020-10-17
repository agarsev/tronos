const Datastore = require('nedb');

export const db = new Datastore({
    filename: 'tronos.db',
    autoload: true,
});
