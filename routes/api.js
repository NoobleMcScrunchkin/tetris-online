const express = require('express');
const debug = require('debug')('routes/api');
const chalk = require('chalk');

const apiRouter = express.Router();

apiRouter.get('/', (req, res) => {
    res.json({});
});

module.exports = apiRouter;