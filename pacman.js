let board;
const rowCount = 21;
const columnCount = 19;
const tileSize = 32;
const boardWidth = columnCount * tileSize;
const boardHeight = rowCount * tileSize;
let context;

let blueGhostImage;
let orangeGhostImage;
let pinkGhostImage;
let redGhostImage;
let pacmanUpImage;
let pacmanDownImage;
let pacmanLeftImage;
let pacmanRightImage;
let wallImage;

const tileMap = [
    "XXXXXXXXXXXXXXXXXXX",
    "X        X        X",
    "X XX XXX X XXX XX X",
    "X                 X",
    "X XX X XXXXX X XX X",
    "X    X       X    X",
    "XXXX XXXX XXXX XXXX",
    "OOOX X       X XOOO",
    "XXXX X XXrXX X XXXX",
    "O       bpo       O",
    "XXXX X XXXXX X XXXX",
    "OOOX X       X XOOO",
    "XXXX X XXXXX X XXXX",
    "X        X        X",
    "X XX XXX X XXX XX X",
    "X  X     P     X  X",
    "XX X X XXXXX X X XX",
    "X    X   X   X    X",
    "X XXXXXX X XXXXXX X",
    "X                 X",
    "XXXXXXXXXXXXXXXXXXX"
];

const walls = new Set();
const foods = new Set();
const ghosts = new Set();
let pacman;
const directions = ['U', 'D', 'L', 'R'];
let lives = 3;
let score = 0;
let gameOver = false;

window.onload = () => {
    board = document.getElementById('board');
    board.width = boardWidth;
    board.height = boardHeight;
    context = board.getContext('2d');

    loadImages();
    loadMap();
    update();
    for (let ghost  of ghosts.values()) {
        const newDirection = directions[Math.floor(Math.random()*4)];
        ghost.updateDirection(newDirection);
    }
    document.addEventListener('keyup', movePacman);
    
};

function loadImages() {
    wallImage = new Image();
    wallImage.src = "images/wall.png";

    blueGhostImage = new Image();
    blueGhostImage.src = "images/blueGhost.png";
    orangeGhostImage = new Image();
    orangeGhostImage.src = "images/orangeGhost.png";
    pinkGhostImage = new Image();
    pinkGhostImage.src = "images/pinkGhost.png";
    redGhostImage = new Image();
    redGhostImage.src = "images/redGhost.png";

    pacmanUpImage = new Image();
    pacmanUpImage.src = "images/pacmanUp.png";
    pacmanDownImage = new Image();
    pacmanDownImage.src = "images/pacmanDown.png";
    pacmanLeftImage = new Image();
    pacmanLeftImage.src = "images/pacmanLeft.png";
    pacmanRightImage = new Image();
    pacmanRightImage.src = "images/pacmanRight.png";
}

function loadMap() {
    for (let r = 0; r < rowCount; r++) {
        for (let c = 0; c < columnCount; c++) {
            const tileMapChar = tileMap[r][c];
            const x = c * tileSize;
            const y = r * tileSize;

            if (tileMapChar === 'X') {
                walls.add(new Block(wallImage, x, y, tileSize, tileSize));
            } else if (tileMapChar === 'b') {
                ghosts.add(new Block(blueGhostImage, x, y, tileSize, tileSize));
            } else if (tileMapChar === 'o') {
                ghosts.add(new Block(orangeGhostImage, x, y, tileSize, tileSize));
            } else if (tileMapChar === 'p') {
                ghosts.add(new Block(pinkGhostImage, x, y, tileSize, tileSize));
            } else if (tileMapChar === 'r') {
                ghosts.add(new Block(redGhostImage, x, y, tileSize, tileSize));
            } else if (tileMapChar === 'P') {
                pacman = new Block(pacmanRightImage, x, y, tileSize, tileSize);
            } else if (tileMapChar === ' ') {
                foods.add(new Block(null, x + 14, y + 14, 4, 4));
            }
        }
    }
}

function update() {
    if (gameOver) {
        return;
    }
    draw();
    move();
    setTimeout(update, 50);
}

function draw() {
    context.clearRect(0, 0, board.width, board.height);
    context.drawImage(pacman.image, pacman.x, pacman.y, pacman.width, pacman.height);
    for (const wall of walls) {
        if (wall.image.complete && wall.image.naturalWidth > 0) {
            context.drawImage(wall.image, wall.x, wall.y, wall.width, wall.height);
        }
    }
    for (const food of foods) {
        context.fillStyle = "white";
        context.fillRect(food.x, food.y, food.width, food.height);
    }
    for (const ghost of ghosts) {
        if (ghost.image.complete && ghost.image.naturalWidth > 0) {
            context.drawImage(ghost.image, ghost.x, ghost.y, ghost.width, ghost.height);
        }
    }
    if (pacman.image.complete && pacman.image.naturalWidth > 0) {
        context.drawImage(pacman.image, pacman.x, pacman.y, pacman.width, pacman.height);
    }
    
    context.fillStyle = 'white';
    context.font = '14px sans-serif';
    if (gameOver) {
        context.fillText('Game Over: ' + String(score), tileSize/2, tileSize/2);
    }
    else {
        context.fillText('x' + String(lives) + ' '+ String(score), tileSize/2, tileSize/2);
    }
}

function move() {
    pacman.x += pacman.velocityX;
    pacman.y += pacman.velocityY;

    for (let wall of walls.values()) {
        if (collision(pacman, wall)) {
            pacman.x -= pacman.velocityX;
            pacman.y -= pacman.velocityY;
            break;
        }
    }

    for (let ghost of ghosts.values()) {
        if (collision(ghost, pacman)) {
            lives -= 1;
            if (lives == 0) {
                gameOver = true;
                return;
            }
            resetPosition();
        }
        if (ghost.y == tileSize*9 && ghost.direction != 'U' && ghost.direction != 'D') {
            ghost.updateDirection('U');
        }
        
        ghost.x += ghost.velocityX;
        ghost.y += ghost.velocityY;
        for (let wall of walls.values()) {
            if (collision(ghost, wall) || ghost.x <= 0 || ghost.x + ghost.width >= boardWidth){
                ghost.x -= ghost.velocityX;
                ghost.y -= ghost.velocityY;
                const newDirection = directions[Math.floor(Math.random()*4)];
                ghost.updateDirection(newDirection);
            }
        }
    }

    let foodEaten = null;
    for (let food of foods.values()) {
        if (collision(pacman, food)) {
            foodEaten = food;
            score += 10;
            break;

        }
    }
    foods.delete(foodEaten);

    if (foods.size == 0) {
        loadMap();
        resetPosition();
    }
}

function movePacman(e) {
    if (gameOver) {
        loadMap();
        resetPosition();
        lives = 3;
        gameOver = false;
        update();
        return;
    }
    if (e.code == 'ArrowUp' || e.code == 'KeyW') {
        pacman.updateDirection('U');
    }
    else if (e.code == 'ArrowDown' || e.code == 'KeyS') {
        pacman.updateDirection('D');
    }
    else if (e.code == 'ArrowLeft' || e.code == 'KeyA') {
        pacman.updateDirection('L');
    }
    else if (e.code == 'ArrowRight' || e.code == 'KeyD') {
        pacman.updateDirection('R');
    }

    if (pacman.direction == 'U') {
        pacman.image = pacmanDownImage;
    }
    else if  (pacman.direction == 'D') {
        pacman.image = pacmanDownImage;
    }
    else if  (pacman.direction == 'L') {
        pacman.image = pacmanLeftImage;
    }
    else if  (pacman.direction == 'R') {
        pacman.image = pacmanRightImage;
    }
}

function collision(a, b) {
    return a.x < b.x + b.width &&   //a's top left corner doesn't reach b's top right corner
           a.x + a.width > b.x &&   //a's top right corner passes b's top left corner
           a.y < b.y + b.height &&  //a's top left corner doesn't reach b's bottom left corner
           a.y + a.height > b.y;    //a's bottom left corner passes b's top left corner
}

function resetPosition() {
    pacman.reset();
    pacman.velocityX = 0;
    pacman.velocityY = 0;
    for (let ghost of ghost.values()) {
        ghost.reset();
        const newDirection = directions[Math.floor(Math.random()*4)];
        ghost.updateDirection(newDirection);
    }

}

class Block {
    constructor(image, x, y, width, height) {
        this.image = image;
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.startX = x;
        this.startY = y;
        this.direction = 'R';
        this.velocityX = 0;
        this.velocityY = 0;

    }

    updateDirection(direction) {
        const prevDirection = this.direction;
        this.direction = direction;
        this.updateVelocity();
        this.x += this.velocityX;
        this.y += this.velocityY;

        for(let wall of walls.values()) {
            if (collision(this, wall)) {
                this.x -= this.velocityX;
                this.y -= this.velocityY;
                this.direction = prevDirection;
                this.updateVelocity();
                return;
            }
        }
    }

    updateVelocity() {
        if (this.direction == 'U') {
            this.velocityX = 0;
            this.velocityY = -tileSize/4;
        }
        else if (this.direction == 'D') {
            this.velocityX = 0;
            this.velocityY = tileSize/4;
        }
        else if (this.direction == 'L') {
            this.velocityX = -tileSize/4;
            this.velocityY = 0;
        }
        else if (this.direction == 'R') {
            this.velocityX = tileSize/4;
            this.velocityY = 0;
        }
    }
    reset() {
        this.x = this.startX;
        this.y = this.startY
    }

}