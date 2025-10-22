// Game canvas setup
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreElement = document.getElementById('score');
const gameOverDiv = document.getElementById('gameOver');
const finalScoreElement = document.getElementById('finalScore');
const highScoreElement = document.getElementById('highScore');
const restartBtn = document.getElementById('restartBtn');

// Game constants
const GRAVITY = 0.5;
const JUMP_FORCE = -12;
const MOVE_SPEED = 5;
const PLATFORM_WIDTH = 70;
const PLATFORM_HEIGHT = 15;
const PLAYER_WIDTH = 40;
const PLAYER_HEIGHT = 40;

// Game state
let gameRunning = true;
let score = 0;
let highScore = localStorage.getItem('highScore') || 0;
let cameraY = 0;

// Player object
const player = {
    x: canvas.width / 2 - PLAYER_WIDTH / 2,
    y: canvas.height - 150,
    width: PLAYER_WIDTH,
    height: PLAYER_HEIGHT,
    velocityX: 0,
    velocityY: 0,
    jumping: false
};

// Platforms array
let platforms = [];

// Input handling
const keys = {
    left: false,
    right: false
};

// Event listeners for keyboard
document.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
        keys.left = true;
    }
    if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
        keys.right = true;
    }
});

document.addEventListener('keyup', (e) => {
    if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
        keys.left = false;
    }
    if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
        keys.right = false;
    }
});

// Restart button
restartBtn.addEventListener('click', restartGame);

// Initialize platforms
function initPlatforms() {
    platforms = [];

    // Starting platform
    platforms.push({
        x: canvas.width / 2 - PLATFORM_WIDTH / 2,
        y: canvas.height - 100,
        width: PLATFORM_WIDTH,
        height: PLATFORM_HEIGHT,
        type: 'normal'
    });

    // Generate initial platforms
    let y = canvas.height - 200;
    while (y > -500) {
        const x = Math.random() * (canvas.width - PLATFORM_WIDTH);
        platforms.push({
            x: x,
            y: y,
            width: PLATFORM_WIDTH,
            height: PLATFORM_HEIGHT,
            type: 'normal'
        });
        y -= Math.random() * 60 + 60;
    }
}

// Draw player
function drawPlayer() {
    // Body (green circle)
    ctx.fillStyle = '#5cb85c';
    ctx.beginPath();
    ctx.arc(player.x + player.width / 2, player.y + player.height / 2, player.width / 2, 0, Math.PI * 2);
    ctx.fill();

    // Eyes
    ctx.fillStyle = 'white';
    ctx.beginPath();
    ctx.arc(player.x + 15, player.y + 15, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(player.x + 25, player.y + 15, 6, 0, Math.PI * 2);
    ctx.fill();

    // Pupils
    ctx.fillStyle = 'black';
    ctx.beginPath();
    ctx.arc(player.x + 16, player.y + 15, 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(player.x + 26, player.y + 15, 3, 0, Math.PI * 2);
    ctx.fill();

    // Smile
    ctx.strokeStyle = 'black';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(player.x + 20, player.y + 20, 8, 0, Math.PI);
    ctx.stroke();
}

// Draw platforms
function drawPlatforms() {
    platforms.forEach(platform => {
        const screenY = platform.y - cameraY;

        // Only draw if visible
        if (screenY > -50 && screenY < canvas.height + 50) {
            // Platform shadow
            ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
            ctx.fillRect(platform.x + 2, screenY + 2, platform.width, platform.height);

            // Platform
            ctx.fillStyle = '#8B4513';
            ctx.fillRect(platform.x, screenY, platform.width, platform.height);

            // Platform highlight
            ctx.fillStyle = '#A0522D';
            ctx.fillRect(platform.x, screenY, platform.width, platform.height / 3);
        }
    });
}

// Update player
function updatePlayer() {
    // Horizontal movement
    if (keys.left) {
        player.velocityX = -MOVE_SPEED;
    } else if (keys.right) {
        player.velocityX = MOVE_SPEED;
    } else {
        player.velocityX = 0;
    }

    // Apply horizontal velocity
    player.x += player.velocityX;

    // Wrap around screen edges
    if (player.x > canvas.width) {
        player.x = -player.width;
    } else if (player.x < -player.width) {
        player.x = canvas.width;
    }

    // Apply gravity
    player.velocityY += GRAVITY;
    player.y += player.velocityY;

    // Camera follows player when moving up
    if (player.y < canvas.height / 2) {
        const diff = canvas.height / 2 - player.y;
        player.y = canvas.height / 2;
        cameraY += diff;

        // Update score
        score = Math.max(score, Math.floor(cameraY / 10));
        scoreElement.textContent = 'Счет: ' + score;
    }

    // Check platform collisions (only when falling)
    if (player.velocityY > 0) {
        platforms.forEach(platform => {
            const screenY = platform.y - cameraY;

            if (player.x < platform.x + platform.width &&
                player.x + player.width > platform.x &&
                player.y + player.height > screenY &&
                player.y + player.height < screenY + platform.height + 10 &&
                player.velocityY > 0) {

                // Jump!
                player.velocityY = JUMP_FORCE;
            }
        });
    }

    // Game over if player falls off screen
    if (player.y - cameraY > canvas.height) {
        gameOver();
    }
}

// Update platforms (generate new ones)
function updatePlatforms() {
    // Remove platforms that are too far below
    platforms = platforms.filter(platform => platform.y - cameraY < canvas.height + 100);

    // Add new platforms at the top
    const highestPlatform = platforms.reduce((highest, platform) =>
        platform.y < highest.y ? platform : highest, platforms[0]);

    while (highestPlatform.y - cameraY > -500) {
        const x = Math.random() * (canvas.width - PLATFORM_WIDTH);
        const y = highestPlatform.y - Math.random() * 60 - 60;
        platforms.push({
            x: x,
            y: y,
            width: PLATFORM_WIDTH,
            height: PLATFORM_HEIGHT,
            type: 'normal'
        });
    }
}

// Game over
function gameOver() {
    gameRunning = false;
    gameOverDiv.style.display = 'block';
    finalScoreElement.textContent = 'Ваш счет: ' + score;

    if (score > highScore) {
        highScore = score;
        localStorage.setItem('highScore', highScore);
    }
    highScoreElement.textContent = 'Лучший результат: ' + highScore;
}

// Restart game
function restartGame() {
    gameRunning = true;
    score = 0;
    cameraY = 0;
    gameOverDiv.style.display = 'none';
    scoreElement.textContent = 'Счет: 0';

    // Reset player
    player.x = canvas.width / 2 - PLAYER_WIDTH / 2;
    player.y = canvas.height - 150;
    player.velocityX = 0;
    player.velocityY = 0;

    // Reset platforms
    initPlatforms();

    // Restart game loop
    gameLoop();
}

// Game loop
function gameLoop() {
    if (!gameRunning) return;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Update
    updatePlayer();
    updatePlatforms();

    // Draw
    drawPlatforms();
    drawPlayer();

    // Continue loop
    requestAnimationFrame(gameLoop);
}

// Initialize and start game
initPlatforms();
gameLoop();
