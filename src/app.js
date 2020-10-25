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

    // Jugadores que TIENEN que estar
    const [ jugadores_act, setJACT ] = useState(() => {
        const j_act = {};
        jugadores.forEach(j => { j_act[j] = false });
        return j_act;
    });
    const [ num_js, setNJS ] = useState({ 3: true, 4: true, 5: true, 6: true });
    const [ clasicas, setClasicas ] = useState(false);

    let ps = partidas
        .filter(p => jugadores
            .map(j => !jugadores_act[j] || p.jugadores[j])
            .reduce((a, b) => a&&b))
        .filter(p => num_js[p.num_js])
        .filter(p => p.clasica && clasicas || !p.clasica);
    const js = encontrar_jugadores(ps);

    return <div>
        <h1>Clasificación de partidas de Tronos</h1>
        <p>In the game of thrones, you win or you die.</p>
        <table className="ListaPartidas">
            <CabeceroLista jugadores={js}>
                <Filtros jugadores={jugadores}
                    jugadores_act={jugadores_act} num_js={num_js} clasicas={clasicas}
                    toggle_j={j => setJACT(j_act => ({ ...j_act, [j]: !j_act[j] }))}
                    toggle_n={n => setNJS(njs => ({ ...njs, [n]: !njs[n] }))}
                    toggle_clasicas={() => setClasicas(c => !c)}
                />
            </CabeceroLista>
            <ListaPartidas partidas={ps} jugadores={js} />
        </table>
        <h2>Victorias</h2>
        <Estadisticas partidas={ps} jugadores={js} />
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

function Filtros ({ jugadores, jugadores_act, toggle_j, num_js, toggle_n,
        clasicas, toggle_clasicas }) {
    return <div class="Filtros" style="position: absolute;">
        <div><input type="checkbox" checked={clasicas} onclick={toggle_clasicas} />
            Clásicas
        </div><div>
            <b>Jugadores</b>
        </div>
        {jugadores.map(j => <div>
            <input type="checkbox" checked={jugadores_act[j]}
                onclick={() => toggle_j(j)} />{j}
        </div>)}
        <div><b>Número</b></div>
        <div>{[3,4,5,6].map(n => <span>
            <input type="checkbox" checked={num_js[n]}
                onclick={() => toggle_n(n)} />
            {n}</span>)}
        </div>
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
