const bird = document.getElementById('bird');
const gameContainer = document.querySelector('.game-container');
const scoreElement = document.getElementById('score');
const startScreen = document.querySelector('.start-screen');
const startButton = document.getElementById('start-button');
const gameOverScreen = document.querySelector('.game-over-screen');
const restartButton = document.getElementById('restart-button');
const gameOverScore = document.getElementById('game-over-score');
const pauseButton = document.getElementById('pause-button');

const birdSpeed = 10; // Speed of obstacles
const moveSpeed = 20; // Speed of controlling bird
const flyingBirdSpeed = 15; // Speed of flying birds
const gapHeight = 300; // Height of the gap between top and bottom obstacles
const minObstacleHeight = 100; // Minimum height of obstacles
const maxObstacleHeight = window.innerHeight - gapHeight - minObstacleHeight; // Maximum height of obstacles
const obstacleFrequency = 2000; // Frequency of obstacle creation (increased for fewer birds)

let birdY = parseInt(window.getComputedStyle(bird).bottom);
let birdX = parseInt(window.getComputedStyle(bird).left);
let score = 0;
let gameInterval;
let obstacles = [];
let birds = [];
let isPaused = false;

// Sound effects
const startSound = new Audio('sounds/start.mp3.wav');
const scoreSound = new Audio('sounds/score.mp3.wav');
const hitSound = new Audio('sounds/hit.mp3.wav');
const pauseSound = new Audio('sounds/pause.mp3.wav'); // Optional: Add a pause sound

// Reduce the size of the controlling bird
bird.style.width = '30px'; // Smaller width
bird.style.height = '30px'; // Smaller height

function moveBird(direction) {
    switch (direction) {
        case 'ArrowUp':
            birdY += moveSpeed;
            break;
        case 'ArrowDown':
            birdY -= moveSpeed;
            break;
        case 'ArrowLeft':
            birdX -= moveSpeed;
            break;
        case 'ArrowRight':
            birdX += moveSpeed;
            break;
    }
    // Restrict bird's movement within the game container
    birdY = Math.max(birdY, 0); // Top boundary
    birdY = Math.min(birdY, window.innerHeight - bird.clientHeight); // Bottom boundary
    birdX = Math.max(birdX, 0); // Left boundary
    birdX = Math.min(birdX, window.innerWidth - bird.clientWidth); // Right boundary
    bird.style.bottom = `${birdY}px`;
    bird.style.left = `${birdX}px`;
}

function createObstaclePair() {
    // Create a gap and adjust top and bottom obstacle heights
    const topObstacleHeight = Math.random() * (maxObstacleHeight - minObstacleHeight) + minObstacleHeight;
    const bottomObstacleHeight = window.innerHeight - topObstacleHeight - gapHeight;
    
    // Ensure that there is enough space for the bird to pass
    const adjustedTopHeight = Math.min(topObstacleHeight, window.innerHeight - gapHeight - minObstacleHeight);
    const adjustedBottomHeight = Math.min(bottomObstacleHeight, window.innerHeight - minObstacleHeight);

    // Ensure no overlap by using a vertical offset
    const verticalOffset = Math.random() * (maxObstacleHeight - minObstacleHeight);

    // Create top obstacle with a gap at the top
    const topObstacle = document.createElement('div');
    topObstacle.classList.add('obstacle');
    topObstacle.style.height = `${adjustedTopHeight}px`;
    topObstacle.style.top = `${verticalOffset}px`;
    topObstacle.style.right = '0';
    topObstacle.style.clipPath = 'inset(0 0 0 0)'; // No gap

    // Create bottom obstacle with a gap at the bottom
    const bottomObstacle = document.createElement('div');
    bottomObstacle.classList.add('obstacle');
    bottomObstacle.style.height = `${adjustedBottomHeight}px`;
    bottomObstacle.style.bottom = '0';
    bottomObstacle.style.right = '0';
    bottomObstacle.style.clipPath = 'inset(0 0 0 0)'; // No gap

    gameContainer.appendChild(topObstacle);
    gameContainer.appendChild(bottomObstacle);

    obstacles.push(topObstacle, bottomObstacle);
}

function createFlyingBird() {
    const flyingBird = document.createElement('div');
    flyingBird.classList.add('flying-bird');
    const size = Math.random() * 40 + 30; // Random size between 30 and 70px
    flyingBird.style.width = `${size}px`;
    flyingBird.style.height = `${size}px`;
    flyingBird.style.backgroundImage = 'url("bird.png")'; // Use your downloaded bird image
    flyingBird.style.backgroundSize = 'cover';
    flyingBird.style.top = `${Math.random() * (window.innerHeight - size)}px`; // Random top position
    flyingBird.style.left = `${window.innerWidth}px`; // Start off-screen
    gameContainer.appendChild(flyingBird);
    birds.push(flyingBird);
}

function moveObstacles() {
    obstacles.forEach((obstacle, index) => {
        let obstacleX = parseInt(window.getComputedStyle(obstacle).right);
        obstacleX += birdSpeed;
        obstacle.style.right = `${obstacleX}px`;

        // Remove obstacles that have moved out of view
        if (obstacleX > window.innerWidth) {
            obstacle.remove();
            obstacles.splice(index, 1);
            score++;
            scoreSound.play(); // Play score sound
            scoreElement.textContent = `Score: ${score}`;
        }
    });
}

function moveFlyingBirds() {
    birds.forEach((flyingBird, index) => {
        let birdX = parseInt(window.getComputedStyle(flyingBird).left);
        birdX -= flyingBirdSpeed; // Adjust speed of flying birds
        flyingBird.style.left = `${birdX}px`;

        // Remove flying birds that have moved out of view
        if (birdX < -50) { // Make sure to remove the bird before it fully leaves the view
            flyingBird.remove();
            birds.splice(index, 1);
        }
    });
}

function detectCollision() {
    const birdRect = bird.getBoundingClientRect();

    obstacles.forEach(obstacle => {
        const obstacleRect = obstacle.getBoundingClientRect();

        if (
            birdRect.right > obstacleRect.left &&
            birdRect.left < obstacleRect.right &&
            birdRect.bottom > obstacleRect.top &&
            birdRect.top < obstacleRect.bottom
        ) {
            hitSound.play(); // Play hit sound
            endGame();
        }
    });

    birds.forEach(flyingBird => {
        const flyingBirdRect = flyingBird.getBoundingClientRect();

        if (
            birdRect.right > flyingBirdRect.left &&
            birdRect.left < flyingBirdRect.right &&
            birdRect.bottom > flyingBirdRect.top &&
            birdRect.top < flyingBirdRect.bottom
        ) {
            hitSound.play(); // Play hit sound
            endGame();
        }
    });
}

function pauseGame() {
    if (!isPaused) {
        clearInterval(gameInterval);
        isPaused = true;
        pauseButton.textContent = 'Resume';
        pauseSound.play(); // Play pause sound
    } else {
        gameInterval = setInterval(() => {
            moveObstacles();
            moveFlyingBirds();
            detectCollision();
        }, 50);
        isPaused = false;
        pauseButton.textContent = 'Pause';
    }
}

function endGame() {
    clearInterval(gameInterval);
    gameOverScore.textContent = `Score: ${score}`;
    gameOverScreen.style.display = 'flex';
    gameContainer.style.display = 'none';
}

function startGame() {
    startSound.play(); // Play start sound
    startScreen.style.display = 'none';
    gameContainer.style.display = 'block';
    createObstaclePair();
    createFlyingBird(); // Add initial flying birds
    gameInterval = setInterval(() => {
        moveObstacles();
        moveFlyingBirds();
        detectCollision();
    }, 50);
    setInterval(() => {
        if (!isPaused) {
            createObstaclePair();
            createFlyingBird(); // Create new flying birds at regular intervals
        }
    }, obstacleFrequency);
}

function restartGame() {
    gameOverScreen.style.display = 'none';
    gameContainer.style.display = 'block';
    birdY = 50;
    birdX = 100;
    bird.style.bottom = `${birdY}px`;
    bird.style.left = `${birdX}px`;
    score = 0;
    scoreElement.textContent = `Score: ${score}`;
    obstacles.forEach(obstacle => obstacle.remove());
    birds.forEach(flyingBird => flyingBird.remove());
    obstacles = [];
    birds = [];
    startGame();
}

startButton.addEventListener('click', startGame);
restartButton.addEventListener('click', restartGame);
pauseButton.addEventListener('click', pauseGame);
document.addEventListener('keydown', event => {
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(event.key)) {
        moveBird(event.key);
    }
});
