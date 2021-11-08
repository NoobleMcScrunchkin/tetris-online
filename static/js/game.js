const socket = io();

socket.emit('login');

var currentGame;

let grid = Array.from(Array(10), () => new Array(20));
let gameSpeed = 1000 / 30;

window.onload = () => {
    drawGrid();
}

function drawGrid() {
    let board = document.getElementsByClassName('board')[0];
    rows = board.children;
    for (let i = 0; i < rows.length; i++) {
        let row = rows[i].children;
        for (let j = 0; j < row.length; j++) {
            row[j].style.backgroundColor = grid[j][19 - i];
        }
    }
}

let gameLoop = setInterval(() => {
    drawGrid();
}, gameSpeed);


socket.on('updateBoard', (data) => {
    grid = data;
});


function newGameLobby() {
    (async function getLobby() {
        const response = await fetch('/api/newGame', {
            method: 'POST',
            mode: 'cors',
            cache: 'no-cache',
            credentials: 'same-origin',
            headers: {
                'Content-Type': 'application/json'
            },
            redirect: 'follow',
            referrerPolicy: 'no-referrer',
            body: JSON.stringify({
                
            })
        });

        return response.json();
    })().then((data) => {
        if (data.error) {
            console.log(data.error);
            // currentGame = undefined;
            return;
        }
        currentGame = data.gameID;
    });
}

function startGame() {
    (async function getLobby() {
        const response = await fetch('/api/startGame', {
            method: 'POST',
            mode: 'cors',
            cache: 'no-cache',
            credentials: 'same-origin',
            headers: {
                'Content-Type': 'application/json'
            },
            redirect: 'follow',
            referrerPolicy: 'no-referrer',
            body: JSON.stringify({
                gameID: currentGame
            })
        });

        return response.json();
    })().then((data) => {
        console.log(data);
    });
}

function joinGame(gameID) {
    (async function joinLobby() {
        const response = await fetch('/api/joinGame', {
            method: 'POST',
            mode: 'cors',
            cache: 'no-cache',
            credentials: 'same-origin',
            headers: {
                'Content-Type': 'application/json'
            },
            redirect: 'follow',
            referrerPolicy: 'no-referrer',
            body: JSON.stringify({
                gameID
            })
        });

        return response.json();
    })().then((data) => {
        console.log(data);
    });
}
