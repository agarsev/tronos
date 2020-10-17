import { db } from '../lib/db.js';

export default function(req, res) {
    db.find({}, (err, partidas) => {
        res.send({ partidas });
    });
}
