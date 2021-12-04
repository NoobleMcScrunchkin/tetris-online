const express = require('express');
const debug = require('debug')('routes/main');
const chalk = require('chalk');
const { MongoClient, ObjectId } = require('mongodb');
const bcrypt = require('bcrypt');
const saltRounds = 10;

const dburl = 'mongodb://localhost:27017';
const dbname = 'tetris';

const mainRouter = express.Router();

mainRouter.get('/', (req, res) => {
    res.render('index', {
        currentPage: "/",
        user: req.session.user
    }, (error, html) => {
        if (error) {
            console.warn(error);
            res.end();
            return;
        }
        res.send(html);
    });
});

mainRouter.get('/logout', (req, res) => {
    req.session.user = undefined;
    req.session.save();
    res.redirect('/');
});

mainRouter.get('/login', (req, res) => {
    res.render('login', {
        currentPage: "/login",
        user: req.session.user,
        failure: req.query.failure
    }, (error, html) => {
        if (error) {
            console.warn(error);
            res.end();
            return;
        }
        res.send(html);
    });
});

mainRouter.post('/login', async (req, res) => {
    let { username, password } = req.body;
    if (username == undefined || password == undefined) {
        res.redirect('/login?failure=invalid');
        return;
    }
    username = username.replace(' ', '');
    password = password.replace(' ', '');

    client = await MongoClient.connect(dburl);
    debug('Connected to the mongodb server');
    
    const db = client.db(dbname);

    user = await db.collection('users').findOne({username: username});

    if (!user) {
        res.redirect('/login?failure=invalid');
        return;
    }

    bcrypt.compare(password, user.password, function(err, result) {
        if (err) {
            debug(err);
            res.end();
            return;
        } else {
            if (result == true) {
                req.session.user = user;
                req.session.save();
                res.redirect('/');
            } else {
                res.redirect('/login?failure=invalid');
            }
        }
    });
});

mainRouter.get('/signup', (req, res) => {
    res.render('signup', {
        currentPage: "/signup",
        user: req.session.user,
        failure: req.query.failure
    }, (error, html) => {
        if (error) {
            console.warn(error);
            res.end();
            return;
        }
        res.send(html);
    });
});

mainRouter.post('/signup', async (req, res) => {
    let { username, password, passwordConf } = req.body;
    if (username == undefined || password == undefined || passwordConf == undefined) {
        res.redirect('/signup?failure=invalidUsername');
        return;
    }
    username = username.replace(' ', '');
    password = password.replace(' ', '');
    passwordConf = passwordConf.replace(' ', '');
    if (username == '') {
        res.redirect('/signup?failure=invalidUsername');
        return;
    } else if (password != passwordConf) {
        res.redirect('/signup?failure=passwordNoMatch');
        return;
    } else if (password.length < 8) {
        res.redirect('/signup?failure=passwordReqFail');
        return;
    }

    client = await MongoClient.connect(dburl);
    debug('Connected to the mongodb server');
    
    const db = client.db(dbname);

    user = await db.collection('users').findOne({username: username});

    if (user) {
        res.redirect('/signup?failure=invalidUsername');
        return;
    }


    bcrypt.hash(password, saltRounds, async (err, hash) => {
        if (err) {
            debug(err);
            res.end();
            return;
        } else {
            let doc = await db.collection('users').insertOne({username, password: hash});
            req.session.user = await db.collection('users').findOne({username});
            req.session.save();
            res.redirect('/');
        }
    });
});

mainRouter.get('/vs', (req, res) => {
    res.render('multigame', {
        currentPage: "/vs",
        user: req.session.user,
        mobile: /Android|webOS|iPhone|iPad|iPod|BlackBerry|BB|PlayBook|IEMobile|Windows Phone|Kindle|Silk|Opera Mini/i.test(req.headers["user-agent"]),
    }, (error, html) => {
        if (error) {
            console.warn(error);
            res.end();
            return;
        }
        res.send(html);
    });
});

mainRouter.get('/40lines', (req, res) => {
    res.render('multigame', {
        currentPage: "/40lines",
        user: req.session.user,
        mobile: /Android|webOS|iPhone|iPad|iPod|BlackBerry|BB|PlayBook|IEMobile|Windows Phone|Kindle|Silk|Opera Mini/i.test(req.headers["user-agent"]),
    }, (error, html) => {
        if (error) {
            console.warn(error);
            res.end();
            return;
        }
        res.send(html);
    });
});

mainRouter.get('/zen', (req, res) => {
    res.render('multigame', {
        currentPage: "/zen",
        user: req.session.user,
        mobile: /Android|webOS|iPhone|iPad|iPod|BlackBerry|BB|PlayBook|IEMobile|Windows Phone|Kindle|Silk|Opera Mini/i.test(req.headers["user-agent"]),
    }, (error, html) => {
        if (error) {
            console.warn(error);
            res.end();
            return;
        }
        res.send(html);
    });
});

mainRouter.get('/leaderboard', async (req, res) => {
    res.redirect('/leaderboard/40lines');
});

mainRouter.get('/leaderboard/:gamemode', async (req, res) => {
    let gamemode = req.params.gamemode;
    if (gamemode != '40lines' && gamemode != 'zen') {
        res.redirect('/');
        return;
    }

    client = await MongoClient.connect(dburl);
    debug('Connected to the mongodb server');
    
    const db = client.db(dbname);

    let scoresDB = await db.collection(gamemode).find().toArray();

    var scores = [];

    for (let i = 0; i < scoresDB.length; i++) {
        let score = scoresDB[i];
        let user = await db.collection('users').findOne({_id: new ObjectId(score.user)});
        let username = '';
        if (user) {
            username = await user.username;
        }
        scores.push({
            username,
            time: score.time
        });
    }

    res.render('leaderboard', {
        currentPage: "/leaderboard",
        leaderboard: gamemode,
        user: req.session.user,
        scores
    }, (error, html) => {
        if (error) {
            console.warn(error);
            res.end();
            return;
        }
        res.send(html);
    });
});

module.exports = mainRouter;