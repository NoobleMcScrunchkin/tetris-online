const express = require('express');
const debug = require('debug')('routes/main');
const chalk = require('chalk');

const mainRouter = express.Router();

mainRouter.get('/', (req, res) => {
    res.render('index', {
        currentPage: "/"
    }, (error, html) => {
        if (error) {
            console.warn(error);
            res.end();
            return;
        }
        res.send(html);
    });
});

mainRouter.get('/game', (req, res) => {
    res.render('game', {
        currentPage: "/game"
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