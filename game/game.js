const {workerData, parentPort} = require('worker_threads');
var players = [];

for (let i = 0; i < workerData.players.length; i++) { 
    players.push({
        id: workerData.players[i].socket,
        session: workerData.players[i].session,
        grid: Array.from(Array(10), () => new Array(20))
    });
}

var gameLoop = setInterval(() => {
    for (let i = 0; i < players.length; i++) {
        grid = players[i].grid;
        grid[Math.floor(Math.random() * 10)][Math.floor(Math.random() * 20)] = '#FFFFFF'
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