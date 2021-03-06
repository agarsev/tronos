import { h, render } from 'preact';
import { useState, useEffect } from 'preact/hooks';

import { CASAS } from './comun.js';
import { Estadisticas } from './estadisticas.js';

fetch("api/partidas").then(r => r.json())
    .then(({ partidas, frase }) => ({ partidas: partidas.reverse(),
        jugadores: encontrar_jugadores(partidas),
        frase,
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

function App ({ partidas, jugadores, frase }) {

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

    const [ mensaje, setMensaje ] = useState(null);

    const [ generada, setGenerada ] = useState(null);
    const generar = nuevos => fetch("api/generar", {
        method: 'POST', body: JSON.stringify({
            jugadores: jugadores.filter(j => jugadores_act[j]),
            nuevos
        }), headers: { 'Content-Type': 'application/json' }
    }).then(r => r.ok?r.json():r.text())
        .then(r => typeof(r)=='object'?setGenerada(r):setMensaje(r))
        .catch(e => console.log(e));

    const [ desplegado, setDesplegado ] = useState(false);
    useEffect(() => {
        const cerrar_desplegable = () => setDesplegado(false);
        document.addEventListener("click", cerrar_desplegable);
        return () => document.removeEventListener("click", cerrar_desplegable);
    }, []);

    return <main>
        <h1>Clasificación de partidas de Tronos</h1>
        <p class={mensaje?"Mensaje":""}>{mensaje?mensaje:frase}</p>
        <div class="ListaWrapper">
            <div class="ListaPartidas"><table>
                <CabeceroLista jugadores={js} orden={orden} setOrden={setOrden}
                    desplegado={desplegado} setDesplegado={setDesplegado} />
                <ListaPartidas partidas={ps} jugadores={js} />
            </table></div>
            {desplegado?<Filtros jugadores={jugadores}
                jugadores_act={jugadores_act} num_js={num_js} clasicas={clasicas}
                toggle_j={j => setJACT(j_act => ({ ...j_act, [j]: !j_act[j] }))}
                toggle_n={n => setNJS(njs => ({ ...njs, [n]: !njs[n] }))}
                toggle_clasicas={() => setClasicas(c => !c)}
                generar={generar}
            />:null}
        </div>
        <h2>Victorias</h2>
        <Estadisticas partidas={ps} jugadores={js} />
        {generada?<Generada generada={generada}
            dismiss={() => setGenerada(null)} />:null}
    </main>;
}

function CabeceroLista ({ jugadores, orden, setOrden, children,
        desplegado, setDesplegado }) {

    return <thead><tr>
        <td><BotonOrden orden={orden} setOrden={setOrden} modo="fecha" /></td>
        {jugadores.map(j => <th>{j}
            <BotonOrden orden={orden} setOrden={setOrden} modo={j} />
        </th>)}
        <td>
            <button class="BotonDesplegar" onclick={e => {
                setDesplegado(!desplegado);
                e.stopPropagation();
            }}>
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
    const [ num_nuevos, setNuevos ] = useState(0);

    return <div class="Filtros" onclick={e => e.stopPropagation()} >
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
        <div>
            <button onclick={() => generar(num_nuevos)}>Generar</button>
            +<input min={3-num_checked} max={6-num_checked} size={1} type="number"
                value={num_nuevos} onchange={e => setNuevos(e.target.value)} />
        </div>
    </div>;
}

function ListaPartidas ({ partidas, jugadores }) {
    return <tbody>
        {partidas.map(p => <tr key={p._id}>
            <td>{p.clasica?null:<abbr title={p.fecha}>📅</abbr>}</td>
            {jugadores.map(j => p.jugadores[j]?
                <Jugador key={j} partida={p} jugador={j} />
                :<td></td>
            )}
            <td></td>
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
