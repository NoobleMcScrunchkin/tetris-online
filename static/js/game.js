let grid = Array.from(Array(10), () => new Array(20));
let gameSpeed = 1000 / 1;

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
