const express = require('express');
const expressSession = require('express-session');
const morgan = require('morgan');
const socketio = require('socket.io');
const http = require('http');
const https = require('https');
const debug = require('debug')('index.js');
const bodyParser = require('body-parser');
const chalk = require('chalk');
const path = require('path');
const MongoClient = require('mongodb').MongoClient;
const fs = require('fs');

var games = [];
const dburl = 'mongodb://localhost:27017';
const dbname = 'tetris';
const app = express();

const credentials = {
    key: fs.readFileSync('sslcert/server.key', 'utf8'),
    cert: fs.readFileSync('sslcert/server.crt', 'utf8')
};

// var httpServer = http.createServer(app);
var httpsServer = https.createServer(credentials, app);
const io = socketio(httpsServer);

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

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.json());

// app.use(morgan('tiny'));

app.use('/js', express.static(path.join(__dirname, 'node_modules/bootstrap/dist/js')));
app.use('/css', express.static(path.join(__dirname, 'node_modules/bootstrap/dist/css')));
app.use('/js', express.static(path.join(__dirname, 'static/js')))
app.use('/css', express.static(path.join(__dirname, 'static/css')));
app.use('/img', express.static(path.join(__dirname, 'static/img')));
app.use('/other', express.static(path.join(__dirname, 'static/other')));

app.get('/app.js', function(req, res){
    res.sendFile(__dirname + '/static/js/app.js');
}); 

app.get('/sw.js', function(req, res){
    res.sendFile(__dirname + '/static/js/sw.js');
}); 

const mainRouter = require('./routes/main');
app.use('/', mainRouter);

const apiRouter = require('./routes/api')(io);
app.use('/api', apiRouter);

app.use((req, res, next) => {
    res.send('<html><body><h1>404 Not Found</h1></body></html>');
    next();
})

var httpapp = express();
httpapp.get('*', function(req, res) {  
    res.redirect('https://' + req.headers.host + req.url);
});
httpapp.listen(80);
httpsServer.listen(443);

console.log(`listening on port ${chalk.green(443)}`);