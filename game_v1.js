const canvas = document.createElement("canvas");
const ctx = canvas.getContext("2d");
document.body.appendChild(canvas);

// ✅ Function to adjust canvas size dynamically
function resizeCanvas() {
    canvas.width = window.innerWidth;  // Make canvas match window width
    canvas.height = window.innerHeight; // Make canvas match window height
}

// ✅ Set initial size and update on window resize
resizeCanvas();
window.addEventListener("resize", resizeCanvas);


document.body.style.backgroundColor = "#000000";
document.body.style.overflow = "hidden";

const player = {
    x: canvas.width * 0.5 - (canvas.width * 0.03), // Centered horizontally
    y: canvas.height * 0.85, // Positioned at 85% of the height
    width: canvas.width * 0.06, // Scales based on window size
    height: canvas.height * 0.06,
    speed: 5,
    image: new Image()
};

player.image.src = "spaceship.png"; // Make sure the image is in the same directory

const asteroidImage = new Image();
asteroidImage.src = "asteroid.png"; // Make sure the asteroid sprite is in the same directory

const explosionGif = new Image();
explosionGif.src = "explosion.gif"; // Ensure you have an explosion GIF file in the directory

const keys = {};
const lasers = [];
const asteroids = [];
const explosions = []; // Store explosion positions
const stars = Array.from({ length: 100 }, () => ({
    x: Math.random() * canvas.width,
    y: Math.random() * canvas.height,
    size: Math.random() * 2 + 1,
}));

// Laser properties
const laserSpeed = 7;
const laserWidth = 4;
const laserHeight = 15;

// Asteroid properties
const asteroidSpeed = 2;
const minAsteroidSize = 30;
const maxAsteroidSize = 60;
let asteroidSpawnRate = 100;
let maxAsteroids = 10;
let asteroidSpawnCounter = 0;
let asteroidIncreaseTimer = 0;
let asteroidIncreaseInterval = 600; // Every 10 seconds (~60 FPS, 600 frames)

let gameOver = false;
let score = 0;

// ✅ Load high scores and ensure all scores are stored as numbers
let highScores = JSON.parse(localStorage.getItem('highScores')) || [];

// ✅ If old scores were stored as numbers only, convert them to objects with names
if (highScores.length > 0 && typeof highScores[0] === 'number') {
    highScores = highScores.map(score => ({ name: 'Unknown', score: Number(score) }));
}

// ✅ Ensure all scores are objects with proper number values
highScores = highScores.map(entry => ({
    name: entry.name || 'Unknown',
    score: Number(entry.score) || 0 // Convert to number and default to 0 if NaN
}));

document.addEventListener("keydown", (event) => {
    if (gameOver) return;
    keys[event.key] = true;
    event.preventDefault(); // Prevent unwanted scrolling
    
    if (event.key === " ") { // Spacebar to shoot
        lasers.push({ x: player.x + player.width / 2 - laserWidth / 2, y: player.y, width: laserWidth, height: laserHeight });
    }
});

document.addEventListener("keyup", (event) => {
    keys[event.key] = false;
});

function checkCollision(obj1, obj2, buffer = 10) {
    return (
        obj1.x + buffer < obj2.x + obj2.width - buffer &&
        obj1.x + obj1.width - buffer > obj2.x + buffer &&
        obj1.y + buffer < obj2.y + obj2.height - buffer &&
        obj1.y + obj1.height - buffer > obj2.y + buffer
    );
}

function saveScore() {
    // Check if the current score is high enough to be in the top 10
    highScores.push({ name: "Anonymous", score: score });

    // ✅ Sort scores from highest to lowest
    highScores.sort((a, b) => b.score - a.score);

    // ✅ Keep only the top 10 scores
    highScores = highScores.slice(0, 10);

    // ✅ Only ask for name if the player made it into the top 10
    if (highScores.some(entry => entry.score === score)) {
        let playerName = prompt('You made it onto the leaderboard! Enter your name:');
        if (!playerName) playerName = 'Anonymous';

        // Find the newly added "Anonymous" entry and update the name
        for (let entry of highScores) {
            if (entry.score === score && entry.name === "Anonymous") {
                entry.name = playerName;
                break; // Stop after updating the first matching score
            }
        }
    }

    // ✅ Save the sorted scores to localStorage
    localStorage.setItem('highScores', JSON.stringify(highScores));
}

function showScoreBoard() {
    const scoreBoard = document.createElement('div');
    scoreBoard.style.position = 'absolute';
    scoreBoard.style.top = '50%';
    scoreBoard.style.left = '50%';
    scoreBoard.style.transform = 'translate(-50%, -50%)';
    scoreBoard.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
    scoreBoard.style.padding = '20px';
    scoreBoard.style.border = '2px solid white';
    scoreBoard.style.color = 'white';
    scoreBoard.style.fontSize = '18px';
    scoreBoard.style.textAlign = 'center';
    scoreBoard.style.borderRadius = '10px';

    scoreBoard.innerHTML = '<h2>High Scores</h2>';

    // ✅ Sort scores before displaying
    highScores.sort((a, b) => b.score - a.score);
    
    // ✅ Create a table for better layout
    const table = document.createElement('table');
    table.style.width = '100%';
    table.style.borderCollapse = 'collapse';
    table.style.marginTop = '10px';

    // Table Header
    const headerRow = document.createElement('tr');
    headerRow.innerHTML = `
        <th style="border-bottom: 2px solid white; padding: 5px;">Rank</th>
        <th style="border-bottom: 2px solid white; padding: 5px;">Name</th>
        <th style="border-bottom: 2px solid white; padding: 5px;">Score</th>
    `;
    table.appendChild(headerRow);

    // ✅ Show **only the top 10** scores
    for (let i = 0; i < Math.min(10, highScores.length); i++) {
        const row = document.createElement('tr');

        row.innerHTML = `
            <td style="padding: 5px; border-bottom: 1px solid gray;">${i + 1}</td>
            <td style="padding: 5px; border-bottom: 1px solid gray;">${highScores[i].name}</td>
            <td style="padding: 5px; border-bottom: 1px solid gray;">${highScores[i].score}</td>
        `;

        table.appendChild(row);
    }

    scoreBoard.appendChild(table);

    // ✅ "Play Again" button
    const restartButton = document.createElement('button');
    restartButton.innerText = 'Play Again';
    restartButton.style.marginTop = '15px';
    restartButton.style.padding = '10px 20px';
    restartButton.style.fontSize = '18px';
    restartButton.style.borderRadius = '5px';
    restartButton.style.cursor = 'pointer';
    restartButton.onclick = resetGame;

    scoreBoard.appendChild(restartButton);
    document.body.appendChild(scoreBoard);
}



function resetGame() {
    location.reload(); // Reload the page to restart the game
}

function update() {
    if (gameOver) return;
    
    // Check for asteroid-player collision with slight overlap
    for (let i = asteroids.length - 1; i >= 0; i--) {
        if (checkCollision(player, asteroids[i], 5)) {
            setTimeout(saveScore, 1000); // Slight overlap buffer for more realistic collision
            gameOver = true;
            explosions.push({ x: player.x, y: player.y, width: 50, height: 50, timer: 30 });
            explosions.push({ x: asteroids[i].x, y: asteroids[i].y, width: 50, height: 50, timer: 30 });
            
            setTimeout(() => {
                showScoreBoard();
            }, 1000); // Delay game over by 1 second
            return;
        }
    }
    if (gameOver) return;
    
    // Update explosions
    for (let i = explosions.length - 1; i >= 0; i--) {
        explosions[i].timer--;
        if (explosions[i].timer <= 0) {
            explosions.splice(i, 1);
        }
    }
    if (gameOver) return;
    
    // Move lasers upward
    for (let i = lasers.length - 1; i >= 0; i--) {
        lasers[i].y -= laserSpeed;
        
        // Remove lasers if they move off-screen
        if (lasers[i].y + lasers[i].height < 0) {
            lasers.splice(i, 1);
        }
    }
    if (gameOver) return;
    
    // Move asteroids downward
    for (let i = asteroids.length - 1; i >= 0; i--) {
        asteroids[i].y += asteroidSpeed;
        
        // Remove asteroids if they move off-screen
        if (asteroids[i].y > canvas.height) {
            asteroids.splice(i, 1);
        }
    }
    if (gameOver) return;
    
    // Increase max number of asteroids every 10 seconds
    asteroidIncreaseTimer++;
    if (asteroidIncreaseTimer >= asteroidIncreaseInterval) {
        maxAsteroids += 2;
        asteroidIncreaseTimer = 0;
    }
    
    // Ensure maxAsteroids affects spawning
    asteroidSpawnCounter++;
    if (asteroids.length < maxAsteroids) {
        let size = Math.random() * (maxAsteroidSize - minAsteroidSize) + minAsteroidSize;
        asteroids.push({
            x: Math.random() * (canvas.width - size),
            y: -size,
            width: canvas.width * 0.06, // Scales based on width
            height: canvas.height * 0.06,
        });
        asteroidSpawnCounter = 0;
    }
    
    // Check for laser-asteroid collisions
    for (let i = lasers.length - 1; i >= 0; i--) {
        for (let j = asteroids.length - 1; j >= 0; j--) {
            if (checkCollision(lasers[i], asteroids[j], 5)) {
                // Add explosion at asteroid location
                explosions.push({ x: asteroids[j].x, y: asteroids[j].y, width: 50, height: 50, timer: 30 });
                
                // Remove asteroid and laser
                asteroids.splice(j, 1);
                score += 5;
                lasers.splice(i, 1);
                break;
            }
        }
    }
    
    if (keys["ArrowLeft"] && player.x > 0) player.x -= player.speed;
    if (keys["ArrowRight"] && player.x < canvas.width - player.width) player.x += player.speed;
    if (keys["ArrowUp"] && player.y > 0) player.y -= player.speed;
    if (keys["ArrowDown"] && player.y < canvas.height - player.height) player.y += player.speed;
}

function draw() {
    // Display score in a box at the top center
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(canvas.width / 2 - 60, 10, 120, 30);
    ctx.strokeStyle = 'white';
    ctx.strokeRect(canvas.width / 2 - 60, 10, 120, 30);
    ctx.fillStyle = 'white';
    ctx.font = '20px Arial';
    ctx.fillText('Score: ' + score, canvas.width / 2 - 45, 32);
    
    // Display high scores
    ctx.fillText('High Scores:', canvas.width - 200, 30);
    for (let i = 0; i < highScores.length; i++) {
        ctx.fillText((i + 1) + '. ' + highScores[i].name + ' - ' + highScores[i].score, canvas.width - 200, 50 + (i * 20));
    }
    for (let i = 0; i < highScores.length; i++) {
        ctx.fillText((i + 1) + '. ' + highScores[i], canvas.width - 200, 50 + (i * 20));
    }
    // Display score
    ctx.fillStyle = 'white';
    ctx.font = '20px Arial';
    
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Display score in a box at the top center
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(canvas.width / 2 - 60, 10, 120, 30);
    ctx.strokeStyle = 'white';
    ctx.strokeRect(canvas.width / 2 - 60, 10, 120, 30);
    ctx.fillStyle = 'white';
    ctx.font = '20px Arial';
    ctx.fillText('Score: ' + score, canvas.width / 2 - 45, 32);
    
    // Draw background stars
    ctx.fillStyle = "white";
    for (const star of stars) {
        ctx.fillRect(star.x, star.y, star.size, star.size);
    }
    
    // Draw player spaceship
    ctx.drawImage(player.image, player.x, player.y, player.width, player.height);
    
    // Draw lasers
    ctx.fillStyle = "red";
    for (const laser of lasers) {
        ctx.fillRect(laser.x, laser.y, laser.width, laser.height);
    }
    
    // Draw asteroids
    for (const asteroid of asteroids) {
        ctx.drawImage(asteroidImage, asteroid.x, asteroid.y, asteroid.width, asteroid.height);
    }
    
    // Draw explosions
    for (const explosion of explosions) {
        ctx.drawImage(explosionGif, explosion.x, explosion.y, explosion.width, explosion.height);
    }
}

function gameLoop() {
    draw();
    update();
    requestAnimationFrame(gameLoop);
}

function startGame() {
    document.getElementById('startButton').remove();
    gameLoop();
}

const startButton = document.createElement('button');
startButton.id = 'startButton';
startButton.innerText = 'Start Game';
startButton.style.position = 'absolute';
startButton.style.top = '50%';
startButton.style.left = '50%';
startButton.style.transform = 'translate(-50%, -50%)';
startButton.style.padding = '15px 30px';
startButton.style.fontSize = '20px';
startButton.onclick = startGame;
document.body.appendChild(startButton);