import Datastore from 'nedb';
import moment from 'moment';

import { CASAS } from './comun.js';
import config from './config.js';

const db = new Datastore({
    filename: config.db,
    autoload: true,
});

function nedb (method, data) {
    return new Promise((resolve, reject) => {
        db[method](data, (error, result) => {
            if (error) reject(error);
            else resolve(result);
        });
    });
}

export function lista_partidas () {
    return nedb('find', {});
}

const OTRAS_CLAVES = [ 'password', 'gana' ];

export function nueva_partida (enviada) {

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
        } else if (!OTRAS_CLAVES.includes(k)) {
           throw { status: 400, error: `Clave no reconocida: "${k}: ${v}"` };
        }
    });

    partida.num_js = Object.keys(partida.casas).length;
    if (partida.num_js < 3) {
        throw { status: 400, error: "Faltan jugadores" };
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
        throw { status: 400, error: "Falta vencedor (clave 'gana')" };
    }

    return nedb('insert', partida);
}
