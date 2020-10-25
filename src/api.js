import Datastore from 'nedb';
import moment from 'moment';
import config from 'config';

import { CASAS } from './comun.js';

const db = new Datastore({
    filename: config.get('db'),
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
    return nedb('find', {})
        .then(partidas => partidas.sort((a, b) => {
            if (a.clasica && b.clasica) return a.fecha - b.fecha;
            if (a.clasica && !b.clasica) return -1;
            if (!a.clasica && b.clasica) return 1;
            return a.fecha.localeCompare(b);
        }));
}

const OTRAS_CLAVES = [ 'password', 'gana', 'fecha', 'clasica' ];

export function nueva_partida (enviada) {

    const fecha = moment(enviada.fecha);
    if (!fecha.isValid()) {
        throw { status: 400,
            error: `Fecha no reconocida (usa YYYY-MM-DD): "${enviada.fecha}"`
        }
    }

    let partida = {
        fecha: fecha.format("YYYY-MM-DD"),
        casas: {},
        jugadores: {},
        clasica: enviada.clasica || false,
    };

    Object.keys(enviada).forEach(k => {
        const v = enviada[k];
        if (OTRAS_CLAVES.includes(k)) return;
        if (CASAS.includes(k)) {
            partida.casas[k] = v;
            partida.jugadores[v] = k;
        } else if (CASAS.includes(v)) {
            partida.casas[v] = k;
            partida.jugadores[k] = v;
        } else {
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
