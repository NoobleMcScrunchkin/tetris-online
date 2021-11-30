const debug = require('debug')('game/gameServerHandler');
const chalk = require('chalk');
const { MongoClient, ObjectID } = require('mongodb');
const { Worker } = require('worker_threads');
const path = require('path');
var io;
var games = [];

const dburl = 'mongodb://localhost:27017';
const dbname = 'tetris';

module.exports.startGame = async function(players, gameID, gameMode) {
    client = await MongoClient.connect(dburl);
    debug('Connected to the mongodb server');
    
    const db = client.db(dbname);

    var gameIndex = games.push({
        gameWorker: new Worker(path.join(__dirname, 'game.js'), {
            workerData: {
                players,
                gameMode
            }
        }),
        players,
        gameID
    }) - 1;

    games[gameIndex].gameWorker.on('message', async (data) => {
        if (data.type == 'socketSend') {
            io.to(data.socketID).emit(data.emitChannel, {grid: data.grid, moving: data.moving, next: data.next, held: data.held, otherPlayers: data.otherPlayers})
        }

        if (data.type == 'noPlayers') {
            games[gameIndex].gameWorker.terminate();
            games.splice(gameIndex, 1);

            await db.collection('games').deleteOne({gameID});
        }

        if (data.type == '40linescomplete') {
            games[gameIndex].gameWorker.terminate();
            games.splice(gameIndex, 1);

            await db.collection('games').deleteOne({gameID});
            if (data.user) {
                await db.collection('40lines').insertOne({user: data.user, time: data.time});
            }
        }
    });
}

module.exports.init = function(newio) {
    io = newio;
    io.on('connection', (socket) => {
        socket.on('login', async () => {
            socket.handshake.session.socketID = socket.id;
            socket.handshake.session.save();

            let client = await MongoClient.connect(dburl);
            debug('Connected to the mongodb server');
            
            const db = client.db(dbname);

            db.collection('players').updateOne({sessionID: socket.handshake.session.id}, {$set: {socket: socket.id}}, {upsert: true});
        })
        

        socket.on("message", (msg) => {
            console.log(socket.id, socket.handshake.sessionID, msg);
        })

        socket.on("rotate", (data) => {
            games.forEach(async (game) => {
                if (game.players.map(e => e.socket).indexOf(socket.id) != -1) {
                    game.gameWorker.postMessage({type: 'rotate', dir: data.dir, socket: socket.id});
                }
            });
        })

        socket.on("move", (data) => {
            games.forEach(async (game) => {
                if (game.players.map(e => e.socket).indexOf(socket.id) != -1) {
                    game.gameWorker.postMessage({type: 'move', dir: data.dir, socket: socket.id});
                }
            });
        })

        socket.on("down", (data) => {
            games.forEach(async (game) => {
                if (game.players.map(e => e.socket).indexOf(socket.id) != -1) {
                    game.gameWorker.postMessage({type: 'down', socket: socket.id});
                }
            });
        })

        socket.on("harddown", (data) => {
            games.forEach(async (game) => {
                if (game.players.map(e => e.socket).indexOf(socket.id) != -1) {
                    game.gameWorker.postMessage({type: 'harddown', socket: socket.id});
                }
            });
        })

        socket.on("hold", (data) => {
            games.forEach(async (game) => {
                if (game.players.map(e => e.socket).indexOf(socket.id) != -1) {
                    game.gameWorker.postMessage({type: 'hold', socket: socket.id});
                }
            });
        })
    
        socket.on('disconnect', async () => {
            games.forEach(async (game) => {
                if (game.players.map(e => e.socket).indexOf(socket.id) != -1) {
                    game.gameWorker.postMessage({type: 'disconnect', socketID: socket.id});
                }
            });

            let client = await MongoClient.connect(dburl);
            debug('Connected to the mongodb server');
            
            const db = client.db(dbname);

            let player = await db.collection('players').findOne({sessionID: socket.handshake.session.id});

            await db.collection('players').deleteOne({sessionID: socket.handshake.session.id});

            if (!player || !player.gameID) {
                return;
            }

            let gameID = player.gameID;

            let gamedb = await db.collection('games').findOne({gameID});

            if (!gamedb) {
                return;
            }

            let players = gamedb.players.filter((obj) => {
                return obj.socket !== socket.id;
            });

            if (players.length) {
                db.collection('games').updateOne({gameID}, {$set: {players}});
            } else {
                db.collection('games').deleteOne({gameID});
            }

            gamedb.players.forEach(player => {
                io.to(player.socket).emit('removePlayer', {id: socket.id});
            })
        })
    });
}