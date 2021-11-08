const {workerData, parentPort} = require('worker_threads');
var players = [];

const pieces = [
    [
        {
            x: 5,
            y: 0,
            colour: '#a000f1'
        },
        {
            x: 4,
            y: 1,
            colour: '#a000f1'
        },
        {
            x: 5,
            y: 1,
            colour: '#a000f1'
        },
        {
            x: 6,
            y: 1,
            colour: '#a000f1'
        },
    ],
    [
        {
            x: 3,
            y: 0,
            colour: '#01f0f1'
        },
        {
            x: 4,
            y: 0,
            colour: '#01f0f1'
        },
        {
            x: 5,
            y: 0,
            colour: '#01f0f1'
        },
        {
            x: 6,
            y: 0,
            colour: '#01f0f1'
        },
    ],
    [
        {
            x: 3,
            y: 0,
            colour: '#0101f0'
        },
        {
            x: 3,
            y: 1,
            colour: '#0101f0'
        },
        {
            x: 4,
            y: 1,
            colour: '#0101f0'
        },
        {
            x: 5,
            y: 1,
            colour: '#0101f0'
        },
    ],
    [
        {
            x: 5,
            y: 0,
            colour: '#0101f0'
        },
        {
            x: 3,
            y: 1,
            colour: '#0101f0'
        },
        {
            x: 4,
            y: 1,
            colour: '#0101f0'
        },
        {
            x: 5,
            y: 1,
            colour: '#0101f0'
        },
    ],
    [
        {
            x: 4,
            y: 0,
            colour: '#f0f001'
        },
        {
            x: 5,
            y: 0,
            colour: '#f0f001'
        },
        {
            x: 4,
            y: 1,
            colour: '#f0f001'
        },
        {
            x: 5,
            y: 1,
            colour: '#f0f001'
        },
    ],
    [
        {
            x: 4,
            y: 0,
            colour: '#02ef00'
        },
        {
            x: 5,
            y: 0,
            colour: '#02ef00'
        },
        {
            x: 3,
            y: 1,
            colour: '#02ef00'
        },
        {
            x: 4,
            y: 1,
            colour: '#02ef00'
        },
    ],
    [
        {
            x: 3,
            y: 0,
            colour: '#f00100'
        },
        {
            x: 4,
            y: 0,
            colour: '#f00100'
        },
        {
            x: 4,
            y: 1,
            colour: '#f00100'
        },
        {
            x: 5,
            y: 1,
            colour: '#f00100'
        },
    ],
];

for (let i = 0; i < workerData.players.length; i++) { 
    let index = players.push({
        id: workerData.players[i].socket,
        session: workerData.players[i].session,
        grid: Array.from(Array(10), () => new Array(20)),
        movingPieces: [],
        dead: false
    }) - 1;
    newPiece(index);
    parentPort.postMessage({
        type: 'socketSend',
        emitChannel: 'updateBoard',
        socketID: players[index].id,
        grid: players[index].grid,
        moving: players[index].movingPieces
    });
}

function newPiece(player) {
    players[player].movingPieces = JSON.parse(JSON.stringify(pieces[Math.floor(Math.random() * pieces.length)]));
    players[player].movingPieces.forEach(piece => {
        if (players[player].grid[piece.x][piece.y] != undefined) {
            players[player].movingPieces = [];
            player.dead = true;
        }
    });
}

function moveDown(player) {
    let grid = players[player].grid;
    let movingPieces = players[player].movingPieces;
    let blocked = false;
    movingPieces.forEach(piece => {
        if (grid[piece.x][piece.y + 1] != undefined || piece.y + 1 == 20) {
            blocked = true;
        }
    });

    if (blocked) {
        movingPieces.forEach(piece => {
            grid[piece.x][piece.y] = piece.colour;
        });
        newPiece(player);
    } else {
        movingPieces.forEach(piece => {
            piece.y++;
        });
    }
}

var gameLoop = setInterval(() => {
    for (let i = 0; i < players.length; i++) {
        if (players[i].dead) continue;
        moveDown(i);
        grid = players[i].grid;
        moving = players[i].movingPieces;
        parentPort.postMessage({
            type: 'socketSend',
            emitChannel: 'updateBoard',
            socketID: players[i].id,
            grid,
            moving
        });
    }
}, 1000 / 10)

parentPort.on('message', (data) => {
    if (data.type == 'disconnect') {
        players = players.filter((obj) => {
            return obj.id !== data.socketID;
        });
        if (players.length == 0) {
            clearInterval(gameLoop);
            console.log('interval cleared')
            parentPort.postMessage({
                type: 'noPlayers',
                msg: true
            })
        }
    }
});