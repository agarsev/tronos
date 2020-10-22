import express from 'express';
import morgan from 'morgan';

import { nueva_partida, lista_partidas } from './api.js';
import config from './config.js';

const app = express();

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
    res.send(await lista_partidas());
});

app.post('/api/nueva', async (req, res) => {
    if (req.body.password != config.password) {
        throw { status: 403, error: "Contraseña incorrecta" };
    }
    res.send(await nueva_partida(req.body));
});

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

app.listen(config.port, () => {
    console.log(`Clasificación de tronos iniciada en http://localhost:${3000}`);
});
