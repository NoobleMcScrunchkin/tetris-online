const express = require('express');
const expressSession = require('express-session');
const morgan = require('morgan');
const socketio = require('socket.io');
const http = require('http');
const debug = require('debug')('index.js');
const bodyParser = require('body-parser');
const chalk = require('chalk');
const path = require('path');
const MongoClient = require('mongodb').MongoClient;

var games = [];
const dburl = 'mongodb://localhost:27017';
const dbname = 'tetris';
const port = process.env.PORT || 3000;
const app = express();
const server = http.createServer(app);
const io = socketio(server);

MongoClient.connect(dburl, async function(err, db) {
    if (err) throw err;
    var dbo = db.db(dbname);
    await dbo.collection("games").drop(function(err, delOK) {
        if (delOK) console.log("Collection deleted");
        db.close();
    });
});

MongoClient.connect(dburl, async function(err, db) {
    if (err) throw err;
    var dbo = db.db(dbname);
    await dbo.collection("players").drop(function(err, delOK) {
        if (delOK) console.log("Collection deleted");
        db.close();
    });
});

const session = expressSession({
    secret: 'abcdefghijklmnopqrstuvwxyz68709802',
    resave: true,
    saveUninitialized: true
});
var sharedsession = require("express-socket.io-session");
app.use(session);
io.use(sharedsession(session, { autoSave: true }));

app.set('view engine', 'pug');
app.set('views', './views');

// app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.json());

// app.use(morgan('tiny'));

app.use('/js', express.static(path.join(__dirname, 'node_modules/bootstrap/dist/js')));
app.use('/css', express.static(path.join(__dirname, 'node_modules/bootstrap/dist/css')));
app.use('/js', express.static(path.join(__dirname, 'static/js')))
app.use('/css', express.static(path.join(__dirname, 'static/css')));

const mainRouter = require('./routes/main');
app.use('/', mainRouter);

const apiRouter = require('./routes/api')(io);
app.use('/api', apiRouter);

app.use((req, res, next) => {
    res.send('<html><body><h1>404 Not Found</h1></body></html>');
    next();
})


server.listen(port);
console.log(`listening on port ${chalk.green(port.toString())}`);