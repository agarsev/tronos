import express from 'express';
import morgan from 'morgan';
import config from 'config';
import Bundler from 'parcel-bundler';

import { nueva_partida, lista_partidas, generar_partida } from './api.js';

const app = express();

const frases = config.get('frases');

// Logging
morgan.token('SYSTEMD', (req, res) => {
    if (res.statusCode < 300) return '<6>';
    if (res.statusCode < 400) return '<5>';
    if (res.statusCode < 500) return '<4>';
    return '<3>';
});
app.use(morgan(':SYSTEMD :remote-addr ":method :url" :status :response-time ms'));

// API
app.use(express.json());

app.get('/api/partidas', async (_, res) => {
    res.send({
        frase: frases[Math.floor(Math.random()*frases.length)],
        partidas: await lista_partidas()
    });
});

app.post('/api/nueva', async (req, res) => {
    if (req.body.password != config.get('password')) {
        throw { status: 403, error: "Contraseña incorrecta" };
    }
    res.send(await nueva_partida(req.body));
});

app.post('/api/generar', async (req, res) => {
    let jugadores = req.body.jugadores;
    for (let i = 0; i<req.body.nuevos; i++) {
        jugadores.push(`jugador ${i+1}`);
    }
    res.send(await generar_partida(jugadores));
});

// Front-end
app.use('/img', express.static('img'));

const bundler = new Bundler('src/index.html', {
    autoInstall: false,
    logLevel: 0,
});
app.use(bundler.middleware());

// Error handler
app.use(function (err, req, res, next) {
    if (res.headersSent) { return next(err) }
    if (err.status === undefined || err.status >= 500) {
        console.error(err.stack);
        res.sendStatus(500);
    } else {
        res.status(err.status).send(err.error);
    }
});

app.listen(config.get('port'), () => {
    console.log(`Clasificación de tronos iniciada en http://localhost:${3000}`);
});
