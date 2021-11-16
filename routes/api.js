const express = require('express');
const debug = require('debug')('routes/api');
const chalk = require('chalk');
const { MongoClient, ObjectID } = require('mongodb');
const { Worker } = require('worker_threads');
const path = require('path');
var io;
var games = [];

const dburl = 'mongodb://localhost:27017';
const dbname = 'tetris';

function makeid(length) {
    var result           = '';
    var characters       = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    var charactersLength = characters.length;
    for ( var i = 0; i < length; i++ ) {
      result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }
   return result;
}

const apiRouter = express.Router();

apiRouter.get('/', (req, res) => {
    res.json({});
});

apiRouter.post('/newGame', async (req, res) => {
    (async function mongo() {
        let client;
        let gameID = makeid(6);
        try {
            client = await MongoClient.connect(dburl);
            debug('Connected to the mongodb server');
            
            const db = client.db(dbname);

            let player = await db.collection('players').findOne({sessionID: req.session.id});
            if (!await db.collection('games').findOne({creator: req.session.id})) {
                response = 1;
                while (response != null) {
                    response = await db.collection('games').findOne({gameID}, { projection: {_id: 1}})
                    if (response != null) {
                        gameID = makeid(6);
                    }
                }

                response = await db.collection('games').insertOne({gameID, creator: req.session.id, playing: false, players: [{session: req.session.id, socket: player.socket}]});
                await db.collection('players').updateOne({sessionID: req.session.id}, {$set: {gameID}});
                req.session.gameID = gameID;
                req.session.save();
                res.json({gameID});
            } else {
                client.close();
                res.json({error: 'You already have an active game'});
            }
        } catch(err) {debug(err);}
        client.close();
    })();
});

apiRouter.post('/startGame', async (req, res) => {
    let gameID = req.body.gameID;

    client = await MongoClient.connect(dburl);
    debug('Connected to the mongodb server');
    
    const db = client.db(dbname);

    let game = await db.collection('games').findOne({gameID});
    if (game && !game.playing) {   
        const players = game.players;

        var gameIndex = games.push({
            gameWorker: new Worker(path.join(__dirname, '../game/game.js'), {
                workerData: {
                    players
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

                await db.collection('games').deleteOne({gameID})
            }
        });

        db.collection('games').updateOne({gameID}, { $set: { playing: true } })

        res.json({success: true});
    } else {
        res.json({error: "Game does not exist."});
    }
})

apiRouter.post('/joinGame', async (req, res) => {
    let gameID = req.body.gameID;

    client = await MongoClient.connect(dburl);
    debug('Connected to the mongodb server');
    
    const db = client.db(dbname);

    let player = await db.collection('players').findOne({sessionID: req.session.id});

    let game = await db.collection('games').findOne({gameID});
    if (game && !game.playing) {
        if (game.players.map(e => e.socket).indexOf(player.socket) != -1 || game.players.map(e => e.session).indexOf(req.session.id) != -1) {
            res.json({error: "Already in this game."})
        } else {
            let response = await db.collection('games').updateOne({gameID}, { $push: { players: { session: req.session.id, socket: player.socket } } })
            await db.collection('players').updateOne({sessionID: req.session.id}, {$set: {gameID}});
            req.session.gameID = gameID;
            req.session.save();
            let ids = [];
            game.players.forEach(playerDB => {
                io.to(playerDB.socket, playerDB.session).emit('newPlayer', {id: player.socket});
                ids.push(playerDB.socket);
            })
            res.json({success: true, otherPlayers: ids});
        }
    } else {
        res.json({error: "Game does not exist or is playing."});
    }
});

function start(newio) {
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
    return apiRouter;
} 

module.exports = start;