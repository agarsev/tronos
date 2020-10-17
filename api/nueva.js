import moment from 'moment';

import { db } from '../lib/db.js';
import { CASAS } from '../lib/comun.js';

import config from '../config.js';

export default function (req, res) {

    if (req.body.password != config.password) {
        res.sendStatus(403);
        return;
    }

    const enviada = req.body;
    let partida = {
        fecha: enviada.fecha || moment().format("YYYY-MM-DD"),
        casas: {},
        jugadores: {},
    };

    Object.keys(enviada).forEach(k => {
        const v = enviada[k];
        if (CASAS.includes(k)) {
            partida.casas[k] = v;
            partida.jugadores[v] = k;
        } else if (CASAS.includes(v)) {
            partida.casas[v] = k;
            partida.jugadores[k] = v;
        }
    });

    partida.num_js = partida.casas.length;
    if (partida.num_js < 3) {
        res.status(400).send("Faltan jugadores");
        return;
    }

    const g = enviada.gana;
    if (CASAS.includes(g)) {
        partida.gana = {
            casa: g,
            jugador: partida.casas[g],
        };
    } else if (g in partida.jugadores) {
        partida.gana = {
            casa: partida.jugadores[g],
            jugador: g,
        };
    } else {
        res.status(400).send("Falta vencedor (clave 'gana')");
        return;
    }

    db.insert(partida, (err, doc) => {
        if (err) {
            res.sendStatus(500);
        } else {
            res.send(doc);
        }
    });

}
