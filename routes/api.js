const express = require('express');
const debug = require('debug')('routes/api');
const chalk = require('chalk');
const { MongoClient, ObjectID } = require('mongodb');
const path = require('path');
var gameHandler;
var io;

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
    let gameMode = req.body.gamemode;

    if (gameMode != "vs" && gameMode != "40lines" && gameMode != "zen") {
        res.json({error: "Invalid Gamemode"});
        return;
    }

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
                let userid;
                if (req.session.user) {
                    userid = await req.session.user._id;
                }
                response = await db.collection('games').insertOne({gameID, creator: req.session.id, playing: false, gameMode, players: [{session: req.session.id, socket: player.socket, user: userid}]});
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

        gameHandler.startGame(players, gameID, game.gameMode);

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
    if (game && !game.playing && game.gameMode == 'vs') {
        if (game.players.map(e => e.socket).indexOf(player.socket) != -1 || game.players.map(e => e.session).indexOf(req.session.id) != -1) {
            res.json({error: "Already in this game."})
        } else {
            let userid;
            if (req.session.user) {
                userid = await req.session.user._id;
            }
            let response = await db.collection('games').updateOne({gameID}, { $push: { players: { session: req.session.id, socket: player.socket, user: userid } } })
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
    gameHandler = require('../game/gameServerHandler');
    gameHandler.init(io);
    return apiRouter;
} 

module.exports = start;