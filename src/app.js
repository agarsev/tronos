import { h, render } from 'preact';
import { useState } from 'preact/hooks';

import { CASAS } from './comun.js';
import { Estadisticas } from './estadisticas.js';

fetch("api/partidas").then(r => r.json())
    .then(partidas => ({ partidas: partidas.reverse(),
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

function ordenar_partidas (partidas, modo) {
    if (modo == 'default') return partidas;
    if (modo == 'fecha') return partidas.reverse();
    return partidas.sort((a, b) => {
        const casa_a = a.jugadores[modo],
              casa_b = b.jugadores[modo],
              gana_a = a.gana.jugador == modo,
              gana_b = b.gana.jugador == modo;
        if (!casa_a) return casa_b?1:0;
        if (!casa_b) return -1;
        if (casa_a == casa_b) return gana_a?-1:(gana_b?1:0);
        return CASAS.indexOf(casa_a) - CASAS.indexOf(casa_b);
    });
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
    const [ orden, setOrden ] = useState('default');

    let ps = partidas
        .filter(p => jugadores
            .map(j => !jugadores_act[j] || p.jugadores[j])
            .reduce((a, b) => a&&b))
        .filter(p => num_js[p.num_js]);
    if (!clasicas) ps = ps.filter(p => !p.clasica);
    ps = ordenar_partidas(ps, orden);

    const js = encontrar_jugadores(ps);

    const [ generada, setGenerada ] = useState(null);
    const generar = () => fetch("api/generar", {
        method: 'POST', body: JSON.stringify({
            jugadores: jugadores.filter(j => jugadores_act[j])
        }), headers: { 'Content-Type': 'application/json' }
    }).then(r => r.json())
        .then(setGenerada)
        .catch(e => console.log(e));

    return <div>
        <h1>Clasificación de partidas de Tronos</h1>
        <p>In the game of thrones, you win or you die.</p>
        <div className="ListaPartidas"><table>
            <CabeceroLista jugadores={js} orden={orden} setOrden={setOrden} >
                <Filtros jugadores={jugadores}
                    jugadores_act={jugadores_act} num_js={num_js} clasicas={clasicas}
                    toggle_j={j => setJACT(j_act => ({ ...j_act, [j]: !j_act[j] }))}
                    toggle_n={n => setNJS(njs => ({ ...njs, [n]: !njs[n] }))}
                    toggle_clasicas={() => setClasicas(c => !c)}
                    generar={generar}
                />
            </CabeceroLista>
            <ListaPartidas partidas={ps} jugadores={js} />
        </table></div>
        <h2>Victorias</h2>
        <Estadisticas partidas={ps} jugadores={js} />
        {generada?<Generada generada={generada}
            dismiss={() => setGenerada(null)} />:null}
    </div>;
}

function CabeceroLista ({ jugadores, orden, setOrden, children }) {

    const [ desplegado, setDesplegado ] = useState(false);

    return <thead><tr>
        <td><BotonOrden orden={orden} setOrden={setOrden} modo="fecha" /></td>
        {jugadores.map(j => <th>{j}
            <BotonOrden orden={orden} setOrden={setOrden} modo={j} />
        </th>)}
        <td style="position: relative;">
            <button class="BotonDesplegar" onclick={() => setDesplegado(d => !d)}>
                {desplegado?'▼':'+'}
            </button>
            {desplegado?children:null}
        </td>
    </tr></thead>;
}

function BotonOrden ({ orden, setOrden, modo }) {
    const activo = orden == modo;
    const onclick = () => setOrden(activo?'default':modo);
    return <button class="BotonOrden" onclick={onclick}>{activo?'▼':'━'}</button>;
}

function Filtros ({ jugadores, jugadores_act, toggle_j, num_js, toggle_n,
        clasicas, toggle_clasicas, generar }) {

    const num_checked = jugadores.reduce((sum, j) => sum+(jugadores_act[j]?1:0), 0);

    return <div class="Filtros">
        <div><input type="checkbox" checked={clasicas} onclick={toggle_clasicas} />
            Clásicas
        </div><div>
            <b>Jugadores</b>
        </div>
        {jugadores.map(j => <div>
            <input type="checkbox" checked={jugadores_act[j]}
                onclick={() => toggle_j(j)} /><span>{j}</span>
        </div>)}
        <div><b>Número</b></div>
        <div>{[3,4,5,6].map(n => <span>
            <input type="checkbox" checked={num_js[n]}
                onclick={() => toggle_n(n)} />
            {n}</span>)}
        </div>
        <div>{num_checked>2 && num_checked<7?
            <button onclick={generar}>Generar</button>
        :null}</div>
    </div>;
}

function ListaPartidas ({ partidas, jugadores }) {
    return <tbody>
        {partidas.map(p => <tr key={p._id}>
            <td>{p.clasica?null:p.fecha}</td>
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

    return <td class="IconoCasa" style={estilo} >
        <span style={{
            backgroundImage: `url('img/${casa}.jpg')`
            }} />
    </td>;
}

function Generada ({ generada, dismiss }) {
    const js = Object.keys(generada).sort();
    return <div class="PartidaGenerada" onclick={dismiss}>
        <div onclick={e => e.stopPropagation()}>
            <table><thead><tr>
                {js.map(j => <th>{j}</th>)}
            </tr></thead>
            <tbody><tr>
                {js.map(j => <Jugador partida={{ jugadores: generada, gana: {} }} jugador={j} />)}
            </tr></tbody></table>
            <button onclick={dismiss}>OK</button>
        </div>
    </div>;
}
