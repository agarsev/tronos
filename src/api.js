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

export async function lista_partidas () {
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

/* Generación por genético de nuevas partidas
 *
 * because why not :D
 */

const DECAY = 0.8;
const CUTOFF = 0.05;
const N_INDIVIDUOS = 10;
const TASA_MUTACION_INICIAL = 0.8;
const DECAY_MUTACION = 0.9;
const ITERACIONES_PJ = 8;

export async function generar_partida (jugadores) {
    if (jugadores.length < 3 || jugadores.length > CASAS.length) {
        throw { status: 400, error: `Número incorrecto de jugadores: ${jugadores.length}` }
    }
    const casas_posibles = CASAS.slice(0, jugadores.length);

    // Calculamos las penalizaciones de que a cada jugador le toque una casa,
    // con un peso inversamente proporcional a lo vieja que sea la partida
    const scores = casas_posibles.reduce((scores, casa) => {
        jugadores.forEach(j => scores[j][casa] = 0);
        return scores;
    }, jugadores.reduce((scores, j) => ({...scores, [j]: {}}), {}));

    let peso = 1;
    for (const partida of (await lista_partidas()).reverse()) {
        for (const j of jugadores) {
            const casa = partida.jugadores[j];
            if (casas_posibles.includes(casa)) {
                scores[j][casa] += peso;
            }
        }
        peso = peso*DECAY;
        if (peso < CUTOFF) break;
    }

    function evaluar (poblacion) {
        for (const p of poblacion) {
            if (p.score == undefined) p.score =
                jugadores.reduce((sum, j) => sum + scores[j][p[j]], 0);
        }
        poblacion.sort((a, b) => a.score - b.score);
    }

    // Población inicial aleatoria
    function permutacion_aleatoria () {
        let p = {};
        const inicial = casas_posibles.sort(() => Math.random()*2-1);
        for (let i=0; i<jugadores.length; i++) {
            p[jugadores[i]] = inicial[i];
        }
        return p;
    }

    let poblacion = [];
    for (let i = 0; i<N_INDIVIDUOS; i++) {
        poblacion.push(permutacion_aleatoria());
    }
    evaluar(poblacion);

    let tasa_mutacion = TASA_MUTACION_INICIAL;
    // Mutaciones individuales sólo (cómo mezclar?)
    function mutacion (partida) {
        let casas = jugadores.map(j => partida[j]);
        while (Math.random() < tasa_mutacion) {
            let x = Math.floor(Math.random()*jugadores.length),
                y = Math.floor(Math.random()*(jugadores.length-1));
            if (y >= x) y += 1;
            const t = casas[x];
            casas[x] = casas[y];
            casas[y] = t;
        }
        let ret = {};
        for (let i=0; i<jugadores.length; i++) {
            ret[jugadores[i]] = casas[i];
        }
        return ret;
    }

    // Bucle ultra sencillo mutacion/seleccion
    for (let i = 0; i<ITERACIONES_PJ*jugadores.length; i++) {
        poblacion[10] = mutacion(poblacion[0]);
        poblacion[9] = mutacion(poblacion[Math.floor(Math.random()*3)]);
        poblacion[8] = mutacion(poblacion[Math.floor(Math.random()*5)]);
        poblacion[7] = mutacion(poblacion[Math.floor(Math.random()*7)]);
        evaluar(poblacion);
        tasa_mutacion = tasa_mutacion * DECAY_MUTACION;
    }

    delete poblacion[0].score;
    return poblacion[0];
}

