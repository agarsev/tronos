import { h, render } from 'preact';
import { useState } from 'preact/hooks';

import { Estadisticas } from './estadisticas.js';

fetch("api/partidas").then(r => r.json())
    .then(partidas => ({ partidas,
        jugadores: encontrar_jugadores(partidas),
    }))
    .then(datos => render(<App {...datos} />, document.body))
    .catch(e => console.log(e));

function encontrar_jugadores (partidas) {
    const js = new Set();
    partidas.forEach(p => {
        Object.keys(p.jugadores).forEach(j => js.add(j));
    });
    return [...js.values()].sort();
}

function App ({ partidas, jugadores }) {

    const [ jugadores_act, setJACT ] = useState(() => {
        const j_act = {};
        jugadores.forEach(j => { j_act[j] = true });
        return j_act;
    });
    const [ solo_esos, setSolo ] = useState(false);

    const ps = partidas.filter(p => Object.keys(p.jugadores)
        .map(j => jugadores_act[j])
        .reduce((a, b) => solo_esos?a&&b:a||b));
    const js = encontrar_jugadores(ps);

    return <div>
        <h1>Clasificación de partidas de Tronos</h1>
        <p>In the game of thrones, you win or you die.</p>
        <table className="ListaPartidas">
            <CabeceroLista jugadores={js}>
                <Filtros jugadores={jugadores} jugadores_act={jugadores_act}
                    toggle_j={j => setJACT(j_act => ({ ...j_act, [j]: !j_act[j] }))}
                    solo={solo_esos} toggle_solo={() => setSolo(s => !s)}
                />
            </CabeceroLista>
            <ListaPartidas partidas={ps} jugadores={js} />
        </table>
        <h2>Victorias</h2>
        <Estadisticas partidas={ps}
            jugadores={jugadores.filter(j => jugadores_act[j])} />
    </div>;
}

function CabeceroLista ({ jugadores, children }) {

    const [ desplegado, setDesplegado ] = useState(false);

    return <thead><tr>
        {jugadores.map(j => <th>{j}</th>)}
        <td style="position: relative;">
            <button onclick={() => setDesplegado(d => !d)}>{desplegado?'^':'v'}</button>
            {desplegado?children:null}
        </td>
    </tr></thead>;
}

function Filtros ({ jugadores, jugadores_act, toggle_j, solo, toggle_solo }) {
    return <div class="Filtros" style="position: absolute;">
        <div>
            <b>Jugadores</b>
            <input type="checkbox" checked={solo} onclick={toggle_solo} /> sólo
        </div>
        {jugadores.map(j => <div>
            <input type="checkbox" checked={jugadores_act[j]}
                onclick={() => toggle_j(j)} />{j}
        </div>)}
    </div>;
}

function ListaPartidas ({ partidas, jugadores }) {
    return <tbody>
        {partidas.map(p => <tr key={p._id}>
            {jugadores.map(j => p.jugadores[j]?
                <Jugador key={j} partida={p} jugador={j} />
                :<td></td>
            )}
        </tr>)}
    </tbody>;
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
