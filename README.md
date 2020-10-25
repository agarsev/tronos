# Tronos

Clasificación de partidas de Juego de Tronos para conjunteros y amigos. Verla en
acción en <https://garciasevilla.com/tronos>.

## Servidor

- Instalar: `npm install`
- Ejecutar: `npm start`

## API

Los ejemplos usan [httpie].

- Lista de partidas: `http https://garciasevilla.com/tronos/api/partidas`
- Nueva partida: `http https://garciasevilla.com/tronos/api/nueva
    antonio=lannister santi=stark baratheon="héctor" tyrell=luis gana=lannister
    password=secreto`
- Generar partida: `http https://garciasevilla.com/tronos/api/generar
    jugadores:='["antonio","santi","héctor","luis"]'`

Las partidas se generan con un algoritmo genético muy tonto.

## Autor

- Antonio F. G. Sevilla <antonio@garciasevilla.com>

[httpie]: https://httpie.org/
