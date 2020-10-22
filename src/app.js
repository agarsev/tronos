import { h, render } from 'preact';

import { CASAS } from './comun.js';

fetch("api/partidas").then(r => r.json())
    .then(procesar_partidas)
    .then(datos => render(<App datos={datos} />, document.body))
    .catch(e => console.log(e));

function procesar_partidas(partidas) {

    let jugadores = [],
        victorias = {},
        num_partidas = {};

    CASAS.forEach(c => {
        victorias[c] = 0;
        num_partidas[c] = 0;
    });

    partidas.forEach(p => {
        Object.keys(p.jugadores).forEach(j => {
            const casa = p.jugadores[j];
            if (!jugadores.includes(j)) {
                jugadores.push(j);
                victorias[j] = { total: 0 };
                num_partidas[j] = { total: 0 };
                CASAS.forEach(c => {
                    victorias[j][c] = 0;
                    num_partidas[j][c] = 0;
                }); 
            }
            num_partidas[j][casa] += 1;
            num_partidas[casa] += 1;
            num_partidas[j].total += 1;
        });
        victorias[p.gana.jugador][p.gana.casa] += 1;
        victorias[p.gana.jugador].total += 1;
        victorias[p.gana.casa] += 1;
    });

    return {
        partidas, victorias, num_partidas,
        jugadores: jugadores.sort()
    };
}

function App ({ datos }) {
    return <div>
        <h1>Clasificación de partidas de Tronos</h1>
        <p>In the game of thrones, you win or you die.</p>
        <ListaPartidas {...datos} />
        <h2>Victorias</h2>
        <Estadisticas {...datos} />
    </div>
}

function ListaPartidas ({ partidas, jugadores }) {
    return <table className="ListaPartidas">
        <thead><tr>
            {jugadores.map(j => <th key={j}>{j}</th>)}
        </tr></thead>
        <tbody>
            {partidas.map(p => <tr key={p._id}>
                {jugadores.map(j => <Jugador key={j} partida={p} jugador={j} />)}
            </tr>)}
        </tbody>
    </table>;
}

function Jugador ({ partida, jugador }) {
    const casa = partida.jugadores[jugador];
    let estilo = {};
    if (partida.gana.jugador == jugador) {
        estilo.backgroundImage = "url('img/corona.png')";
    }

    return <td style={estilo} >
        <span className="IconoCasa" style={{
            backgroundImage: `url('img/${casa}.jpg')`
            }} />
    </td>;
}

function Estadisticas ({ jugadores, victorias, num_partidas }) {
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
