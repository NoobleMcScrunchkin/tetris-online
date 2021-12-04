const socket = io();

var currentGame;

let grid = Array.from(Array(10), () => new Array(20));
let movingPieces = [];
let held = [];
let next = [];
let gameSpeed = 1000 / 30;
let otherPlayers = [];

window.onload = () => {
    document.body.style.overflow = "hidden";
}

socket.on('connect', () => {
    socket.emit('login');
});

socket.on('loggedIn', () => {
    urlParams = new URLSearchParams(window.location.search);
    lobby = urlParams.get('lobby');
    var path = window.location.pathname;
    var page = path.split("/").pop();
    if (lobby && page == "vs") {
        joinGame(lobby);
    } else {
        newGameLobby(page);
    }
})

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
    let nextBoard = document.getElementById('nextPiece');
    rows = nextBoard.children;
    for (let y = 0; y < rows.length; y++) {
        let row = rows[y].children;
        for (let x = 0; x < row.length; x++) {
            let nextCell = next.filter(e => e.x - 3 === x && e.y == y)[0];
            if (nextCell) {
                row[x].style.backgroundColor = nextCell.colour;
                row[x].style.boxShadow = '0 0 0.1vw 0.5vw rgb(0 0 0 / 50%) inset';
            } else {
                row[x].style.backgroundColor = "";
                row[x].style.boxShadow = "";
            }
        }
    }
    let heldBoard = document.getElementById('heldPiece');
    rows = heldBoard.children;
    for (let y = 0; y < rows.length; y++) {
        let row = rows[y].children;
        for (let x = 0; x < row.length; x++) {
            let heldCell = held.filter(e => e.x - 3 === x && e.y == y)[0];
            if (heldCell) {
                row[x].style.backgroundColor = heldCell.colour;
                row[x].style.boxShadow = '0 0 0.1vw 0.5vw rgb(0 0 0 / 50%) inset';
            } else {
                row[x].style.backgroundColor = "";
                row[x].style.boxShadow = "";
            }
        }
    }
}

function drawOtherGrids() {
    let otherPlayersArea = document.getElementById('otherPlayers');
    otherPlayersArea.innerHTML = '';
    otherPlayers.forEach((player, index) => {
        if (!player) {
            return;
        }
        let playerContainer = document.createElement('div');
        playerContainer.className = "otherPlayer";
        playerContainer.innerText = "TestName";
        let playerGameDom = document.createElement('div');
        playerGameDom.className = 'board otherBoard';
        playerGameDom.id = player.id;
        for (let i = 0; i < 20; i++) {
            let row = document.createElement('div');
            row.classList = ['row'];
            playerGameDom.appendChild(row);
            for (let i = 0; i < 10; i++) {
                let cell = document.createElement('div');
                cell.classList = ['cell'];
                row.appendChild(cell);
            }
        }
        playerContainer.appendChild(document.createElement('br'));
        playerContainer.appendChild(playerGameDom);
        otherPlayersArea.appendChild(playerContainer);

        rows = playerGameDom.children;
        for (let y = 0; y < rows.length; y++) {
            let row = rows[y].children;
            for (let x = 0; x < row.length; x++) {
                row[x].style.backgroundColor = player.grid[x][y];
                let movingCell = player.movingPieces.filter(e => e.x === x && e.y == y)[0];
                if (movingCell) {
                    row[x].style.backgroundColor = movingCell.colour;
                }
            }
        }
    });
    if (otherPlayersArea.children.length == 0) {
        otherPlayersArea.hidden = true;
    } else {
        otherPlayersArea.hidden = false;
    }
}

// let gameLoop = setInterval(() => {
//     drawGrid();
// }, gameSpeed);


socket.on('updateBoard', (data) => {
    grid = data.grid;
    movingPieces = data.moving;
    next = data.next;
    held = data.held;
    drawGrid();
});

socket.on('updateOtherBoards', (data) => {
    otherPlayers = data.otherPlayers;
    drawOtherGrids();
});

socket.on('newPlayer', (data) => {
    console.log(data);
    let grid = Array.from(Array(10), () => new Array(20));
    let movingPieces = [];
    otherPlayers.push({
        id: data.id,
        grid,
        movingPieces
    })
    drawOtherGrids();
});

socket.on('removePlayer', (data) => {
    console.log(data);
    otherPlayers = otherPlayers.filter((obj) => {
        return obj.id !== data.id;
    });
    drawOtherGrids();
});


function newGameLobby(gameMode) {
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
                gamemode: gameMode
            })
        });
        
        return response.json();
    })().then((data) => {
        console.log(data);
        if (data.error) {
            console.log(data.error);
            // currentGame = undefined;
            return;
        }
        currentGame = data.gameID;
        if (gameMode == 'vs') {
            document.getElementById('LobbyURL').textContent = `Lobby Url: ${window.location.origin}/vs?lobby=${currentGame}`
            window.history.pushState('lobby', 'Tetris', '/vs?lobby=' + currentGame);
        }
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
                gameID: currentGame,
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
        if (data.success) {
            data.otherPlayers.forEach(id => {
                console.log(id);
                let grid = Array.from(Array(10), () => new Array(20));
                let movingPieces = [];
                otherPlayers.push({
                    id,
                    grid,
                    movingPieces
                })
            });
            currentGame = gameID;
            document.getElementById('LobbyURL').textContent = `Lobby Url: ${window.location.origin}/vs?lobby=${gameID}`
            document.getElementById('startGame').disabled = true;
        }
        if (data.error) {
            console.log(data.error);
        }
        drawOtherGrids();
    });
}

window.addEventListener('keydown', (e) => {
    switch (e.which) {
        case 90:
            socket.emit('rotate', {dir: 0});
            break;
        case 38:
        case 88:
            socket.emit('rotate', {dir: 1});
            break;
        case 37:
            socket.emit('move', {dir: 0});
            break;
        case 39:
            socket.emit('move', {dir: 1});
            break;
        case 40:
            socket.emit('down');
            break;
        case 32:
            socket.emit('harddown');
            break;
        case 16:
        case 67:
            socket.emit('hold');
            break;
        default:
            break;
    }
});