const socket = io();

socket.emit('login');

var currentGame;

let grid = Array.from(Array(10), () => new Array(20));
let movingPieces = [];
let gameSpeed = 1000 / 30;

window.onload = () => {
    drawGrid();
}

function drawGrid() {
    let board = document.getElementsByClassName('board')[0];
    rows = board.children;
    for (let y = 0; y < rows.length; y++) {
        let row = rows[y].children;
        for (let x = 0; x < row.length; x++) {
            row[x].style.boxShadow = '';
            row[x].style.backgroundColor = grid[x][y];
            if (grid[x][y]) {
                row[x].style.boxShadow = '0 0 0.1vw 0.5vw rgb(0 0 0 / 50%) inset';
            }
            let movingCell = movingPieces.filter(e => e.x === x && e.y == y)[0];
            if (movingCell) {
                row[x].style.backgroundColor = movingCell.colour;
                row[x].style.boxShadow = '0 0 0.1vw 0.5vw rgb(0 0 0 / 50%) inset';
            }
        }
    }
}

let gameLoop = setInterval(() => {
    drawGrid();
}, gameSpeed);


socket.on('updateBoard', (data) => {
    grid = data.grid;
    movingPieces = data.moving;
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
