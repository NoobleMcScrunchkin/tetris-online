const {workerData, parentPort} = require('worker_threads');
var players = [];

for (let i = 0; i < workerData.players.length; i++) { 
    let index = players.push({
        id: workerData.players[i].socket,
        session: workerData.players[i].session,
        grid: Array.from(Array(10), () => new Array(20)),
        movingPieces: Array.from(Array(10), () => new Array(20))
    }) - 1;
    players[index].movingPieces[5][19] = '#FFF';
}

function newPiece(player) {
    players[player].movingPieces = Array.from(Array(10), () => new Array(20));
    players[player].movingPieces[5][19] = '#FFF';
}

function moveDown(player) {
    let movingPieces = players[player].movingPieces;
    let blocked = false;
    for (let x = 0; x < movingPieces.length; x++) {
        let col = movingPieces[x];
        for (let y = 0; y < col.length; y++) {
            console.log(x, y, movingPieces[x][y])
            if (!(movingPieces[x][y] && (!movingPieces[x][y - 1] || y == 19))) {
                blocked = true;
            }
        }
    }
    if (blocked) {
        newPiece(player);
    } else {
        console.log(1);
        for (let x = 0; x < movingPieces.length; x++) {
            let col = movingPieces[x];
            for (let y = 0; y < col.length; y++) {
                if (movingPieces[x][y] && (!movingPieces[x][y - 1] || y == 19)) {
                    movingPieces[y - 1][x] = movingPieces[y][x];
                    movingPieces[y][x] = undefined;
                    players[player].grid[y - 1][x] = players[player].grid[y][x];
                    players[player].grid[y][x] = undefined;
                    console.log(players[player].grid[y - 1][x]);
                }
            }
        }
        players[player].movingPieces = movingPieces;
    }
}

var gameLoop = setInterval(() => {
    for (let i = 0; i < players.length; i++) {
        moveDown(i);
        grid = players[i].grid;
        // grid[Math.floor(Math.random() * 10)][Math.floor(Math.random() * 20)] = '#FFFFFF'
        parentPort.postMessage({
            type: 'socketSend',
            emitChannel: 'updateBoard',
            socketID: players[i].id,
            msg: grid
        });
    }
}, 1000 / 5)

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