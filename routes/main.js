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

mainRouter.get('/vs', (req, res) => {
    res.render('multigame', {
        currentPage: "/vs"
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