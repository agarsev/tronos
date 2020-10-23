import { h } from 'preact';
import { CASAS } from './comun.js';

function calcular_victorias(partidas, jugadores) {

    let victorias = {},
        num_partidas = {};

    for (const c of CASAS) {
        victorias[c] = 0;
        num_partidas[c] = 0;
    }

    for (const j of jugadores) {
        victorias[j] = { total: 0 };
        num_partidas[j] = { total: 0 };
        for (const c of CASAS) {
            victorias[j][c] = 0;
            num_partidas[j][c] = 0;
        }
    }

    for (const p of partidas) {
        for (const j of Object.keys(p.jugadores)) {
            if (!jugadores.includes(j)) continue;
            const casa = p.jugadores[j];
            num_partidas[j][casa] += 1;
            num_partidas[casa] += 1;
            num_partidas[j].total += 1;
        }
        const ganador = p.gana.jugador;
        victorias[p.gana.casa] += 1;
        if (!jugadores.includes(ganador)) continue;
        victorias[p.gana.jugador][p.gana.casa] += 1;
        victorias[p.gana.jugador].total += 1;
    }

    return { victorias, num_partidas };
}

export function Estadisticas ({ partidas, jugadores }) {
    const { victorias, num_partidas } = calcular_victorias(partidas, jugadores);

    return <table className="Estadisticas">
        <thead><tr>
            <th>casa</th>
            {jugadores.map(j => <th key={j}>{j}</th>)}
            <th>total</th>
        </tr></thead>
        <tbody>
            {CASAS.map(c => <tr key={c}>
                <th>{c}</th>
                {jugadores.map(j => <td key={j}>{victorias[j][c]}/{num_partidas[j][c]}</td>)}
                <td>{victorias[c]}/{num_partidas[c]}</td>
            </tr>)}
        </tbody>
        <tfoot><tr>
            <th>total</th>
            {jugadores.map(j => <td key={j}>{victorias[j].total}/{num_partidas[j].total}</td>)}
            <th></th>
        </tr></tfoot>
    </table>;
}
