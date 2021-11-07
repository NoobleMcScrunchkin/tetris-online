const express = require('express');
const session = require('express-session');
const morgan = require('morgan');
const debug = require('debug')('index.js');
const chalk = require('chalk');
const path = require('path');

const port = process.env.PORT || 3000;
const app = express();

app.set('view engine', 'pug');
app.set('views', './views');

app.use(morgan('tiny'));

app.use('/js', express.static(path.join(__dirname, 'node_modules/bootstrap/dist/js')));
app.use('/css', express.static(path.join(__dirname, 'node_modules/bootstrap/dist/css')));
app.use('/js', express.static(path.join(__dirname, 'static/js')))
app.use('/css', express.static(path.join(__dirname, 'static/css')));

const mainRouter = require('./routes/main');
app.use('/', mainRouter);

const apiRouter = require('./routes/api');
app.use('/api', apiRouter);

app.use((req, res, next) => {
    res.send('<html><body><h1>404 Not Found</h1></body></html>');
    next();
})

app.listen(port, () => {
    console.log(`listening on port ${chalk.green(port.toString())}`);
});