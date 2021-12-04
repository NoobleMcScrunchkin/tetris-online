const {workerData, parentPort} = require('worker_threads');
var players = [];
var startingPlayers = [];

const pieces = [
    [
        /*
         # 
        ###
        */
        {
            x: 5,
            y: 0,
            colour: '#a000f1',
            ox: 5,
            oy: 1
        },
        {
            x: 4,
            y: 1,
            colour: '#a000f1',
            ox: 5,
            oy: 1
        },
        {
            x: 5,
            y: 1,
            colour: '#a000f1',
            ox: 5,
            oy: 1
        },
        {
            x: 6,
            y: 1,
            colour: '#a000f1',
            ox: 5,
            oy: 1
        },
    ],
    [
        /*
        ####
        */
        {
            x: 3,
            y: 0,
            colour: '#01f0f1',
            ox: 4.5,
            oy: 0.5
        },
        {
            x: 4,
            y: 0,
            colour: '#01f0f1',
            ox: 4.5,
            oy: 0.5
        },
        {
            x: 5,
            y: 0,
            colour: '#01f0f1',
            ox: 4.5,
            oy: 0.5
        },
        {
            x: 6,
            y: 0,
            colour: '#01f0f1',
            ox: 4.5,
            oy: 0.5
        },
    ],
    [
        /*
        #
        ###
        */
        {
            x: 3,
            y: 0,
            colour: '#0101f0',
            ox: 4,
            oy: 1
        },
        {
            x: 3,
            y: 1,
            colour: '#0101f0',
            ox: 4,
            oy: 1
        },
        {
            x: 4,
            y: 1,
            colour: '#0101f0',
            ox: 4,
            oy: 1
        },
        {
            x: 5,
            y: 1,
            colour: '#0101f0',
            ox: 4,
            oy: 1
        },
    ],
    [
        /*
          #
        ###
        */
        {
            x: 5,
            y: 0,
            colour: '#efa000',
            ox: 4,
            oy: 1
        },
        {
            x: 3,
            y: 1,
            colour: '#efa000',
            ox: 4,
            oy: 1
        },
        {
            x: 4,
            y: 1,
            colour: '#efa000',
            ox: 4,
            oy: 1
        },
        {
            x: 5,
            y: 1,
            colour: '#efa000',
            ox: 4,
            oy: 1
        },
    ],
    [
        /*
        ##
        ##
        */
        {
            x: 4,
            y: 0,
            colour: '#f0f001',
            ox: 4.5,
            oy: 0.5
        },
        {
            x: 5,
            y: 0,
            colour: '#f0f001',
            ox: 4.5,
            oy: 0.5
        },
        {
            x: 4,
            y: 1,
            colour: '#f0f001',
            ox: 4.5,
            oy: 0.5
        },
        {
            x: 5,
            y: 1,
            colour: '#f0f001',
            ox: 4.5,
            oy: 0.5
        },
    ],
    [
        /*
         ##
        ##
        */
        {
            x: 4,
            y: 0,
            colour: '#02ef00',
            ox: 4,
            oy: 1
        },
        {
            x: 5,
            y: 0,
            colour: '#02ef00',
            ox: 4,
            oy: 1
        },
        {
            x: 3,
            y: 1,
            colour: '#02ef00',
            ox: 4,
            oy: 1
        },
        {
            x: 4,
            y: 1,
            colour: '#02ef00',
            ox: 4,
            oy: 1
        },
    ],
    [
        /*
        ##
         ##
        */
        {
            x: 3,
            y: 0,
            colour: '#f00100',
            ox: 4,
            oy: 1
        },
        {
            x: 4,
            y: 0,
            colour: '#f00100',
            ox: 4,
            oy: 1
        },
        {
            x: 4,
            y: 1,
            colour: '#f00100',
            ox: 4,
            oy: 1
        },
        {
            x: 5,
            y: 1,
            colour: '#f00100',
            ox: 4,
            oy: 1
        },
    ],
];

const gameMode = workerData.gameMode;
const startTime = new Date();

for (let i = 0; i < workerData.players.length; i++) { 
    let nextID = Math.floor(Math.random() * pieces.length);
    let index = players.push({
        id: workerData.players[i].socket,
        user: workerData.players[i].user,
        grid: Array.from(Array(10), () => new Array(20)),
        movingPieces: [],
        movingID: 0,
        heldID: 0,
        nextPiece: JSON.parse(JSON.stringify(pieces[nextID])),
        nextID,
        heldPiece: [],
        justHeld: false,
        dead: false,
        linesCleared: 0
    }) - 1;
    newPiece(index);
    parentPort.postMessage({
        type: 'socketSend',
        emitChannel: 'updateBoard',
        socketID: players[index].id,
        grid: players[index].grid,
        moving: players[index].movingPieces,
        next: players[index].nextPiece,
        held: players[index].heldPiece
    });
}

startingPlayers = JSON.parse(JSON.stringify(players));

function rotate(cx, cy, x, y, angle) {
    var radians = (Math.PI / 180) * angle,
        cos = Math.cos(radians),
        sin = Math.sin(radians),
        nx = (cos * (x - cx)) + (sin * (y - cy)) + cx,
        ny = (cos * (y - cy)) - (sin * (x - cx)) + cy;
    return [nx, ny];
}

function newPiece(player) {
    players[player].movingPieces = JSON.parse(JSON.stringify(players[player].nextPiece));
    players[player].movingID = players[player].nextID
    players[player].nextID = Math.floor(Math.random() * pieces.length);
    players[player].nextPiece = JSON.parse(JSON.stringify(pieces[players[player].nextID]));
    // players[player].movingPieces = JSON.parse(JSON.stringify(pieces[6]));
    players[player].movingPieces.forEach(piece => {
        if (players[player].grid[piece.x][piece.y] != undefined) {
            players[player].movingPieces = [];
            players[player].dead = true;
            if (gameMode == 'zen') {
                let time = (new Date()) - startTime;
                // console.log(time);
                parentPort.postMessage({
                    type: 'zencomplete',
                    time,
                    user: players[player].user,
                });
                clearInterval(gameLoop);
            }
        }
    });
}

function moveDown(player) {
    if (!players[player]) {
        return;
    }
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
        for (let y = 19; y > 0; y--) {
            let complete = true;
            for (let x = 0; x < grid.length; x++) {
                if (grid[x][y] == undefined) {
                    complete = false;
                }
            }
            if (complete) {
                players[player].linesCleared++;
                for (let y2 = y; y2 > 1; y2--) {
                    for (let x = 0; x < grid.length; x++) {
                        grid[x][y2] = grid[x][y2 - 1];
                    }
                }
                y++;
            }
        }
        players[player].justHeld = false;
        newPiece(player);
        return 1;
    } else {
        movingPieces.forEach(piece => {
            piece.y++;
            piece.oy++;
        });
        return 0;
    }
}

var gameLoop = setInterval(() => {
    for (let i = 0; i < players.length; i++) {
        if (!players[i]) {
            continue;
        }
        if (players[i].dead) {
            delete players[i];
            continue;
        } else {
            moveDown(i);
            grid = players[i].grid;
            moving = players[i].movingPieces;
            next = players[i].nextPiece;
            held = players[i].heldPiece;
            parentPort.postMessage({
                type: 'socketSend',
                emitChannel: 'updateBoard',
                socketID: players[i].id,
                grid,
                moving,
                next,
                held
            });
            if (gameMode == '40lines' && players[i].linesCleared == 40) {
                //Submit Score
                let time = (new Date()) - startTime;
                // console.log(time);
                parentPort.postMessage({
                    type: '40linescomplete',
                    time,
                    user: players[i].user,
                });
                clearInterval(gameLoop);
            }
        }
    }
    for (let i = 0; i < startingPlayers.length; i++) {
        let otherPlayers = JSON.parse(JSON.stringify(players));
        otherPlayers.splice(i, 1);
        parentPort.postMessage({
            type: 'socketSend',
            emitChannel: 'updateOtherBoards',
            socketID: startingPlayers[i].id,
            otherPlayers
        });
    }
}, 1000 / 5)

parentPort.on('message', (data) => {
    let playerI;
    let player;
    if (data.socket) {
        playerI = players.map(e => e.id).indexOf(data.socket);
        player = players[playerI];
        if (!player || player.dead) {
            return;
        }
    }
    if (data.type == 'disconnect') {
        players = players.filter((obj) => {
            return obj.id !== data.socketID;
        });
        if (players.length == 0) {
            clearInterval(gameLoop);
            parentPort.postMessage({
                type: 'noPlayers',
                msg: true
            })
        }
    } else if (data.type == 'rotate') {
        if (data.dir == 0) {
            player.movingPieces.forEach(piece => {
                rotatepoint = rotate(piece.ox, piece.oy, piece.x, piece.y, 90);
                piece.x = Math.round(rotatepoint[0]);
                piece.y = Math.round(rotatepoint[1]);
            });
        } else {
            player.movingPieces.forEach(piece => {
                rotatepoint = rotate(piece.ox, piece.oy, piece.x, piece.y, -90);
                piece.x = Math.round(rotatepoint[0]);
                piece.y = Math.round(rotatepoint[1]);
                if (piece.x < 0) {
                    move = 2;
                } else if (piece.x > 9) {
                    move = 1;
                }
            });
        }
        let out = true;
        while (out) {
            let move = 0;
            player.movingPieces.forEach(piece => {
                if (piece.x < 0) {
                    move = 2;
                } else if (piece.x > 9) {
                    move = 1;
                }
            });
            if (move == 1) {
                player.movingPieces.forEach(piece => {
                    piece.x--;
                    piece.ox--;
                });
            } else if (move == 2) {
                player.movingPieces.forEach(piece => {
                    piece.x++;
                    piece.ox++;
                });
            } else {
                out = false;
            }
        }
        out = true;
        while (out) {
            let move = 0;
            player.movingPieces.forEach(piece => {
                if (piece.y > 19 || player.grid[piece.x][piece.y]) {
                    move = 1;
                }
            });
            if (move == 1) {
                player.movingPieces.forEach(piece => {
                    piece.y--;
                    piece.oy--;
                });
            } else {
                out = false;
            }
        }
    } else if (data.type == 'move') {
        let originalMoving = JSON.parse(JSON.stringify(player.movingPieces));
        let allow = true;
        if (data.dir == 0) {
            player.movingPieces.forEach(piece => {
                piece.x--;
                piece.ox--;
                if (piece.x < 0 || player.grid[piece.x][piece.y]) {
                    allow = false;
                }
            });
        } else {
            player.movingPieces.forEach(piece => {
                piece.x++;
                piece.ox++;
                if (piece.x > 9 || player.grid[piece.x][piece.y]) {
                    allow = false;
                }
            });
        }
        if (!allow) {
            player.movingPieces = JSON.parse(JSON.stringify(originalMoving));
        }
    } else if (data.type == 'down') {
        moveDown(playerI);
    } else if (data.type == 'harddown') {
        let move = true;
        while (move) {
            move = moveDown(playerI) == 0;
        }
    } else if (data.type == 'hold' && player.justHeld == false) {
        if (player.heldPiece.length > 0) {
            player.movingPieces = JSON.parse(JSON.stringify(player.heldPiece));
            player.heldPiece = JSON.parse(JSON.stringify(pieces[player.movingID]));
            let temp = player.heldID;
            player.heldID = player.movingID;
            player.movingID = temp;
        } else {
            player.heldPiece = JSON.parse(JSON.stringify(pieces[player.movingID]));
            player.heldID = player.movingID;
            newPiece(playerI);
        }
        player.justHeld = true;
    }
    if (player) {
        parentPort.postMessage({
            type: 'socketSend',
            emitChannel: 'updateBoard',
            socketID: data.socket,
            grid: player.grid,
            moving: player.movingPieces,
            next: player.nextPiece,
            held: player.heldPiece
        });
    }
});