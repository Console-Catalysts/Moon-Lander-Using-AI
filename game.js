const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const restartButton = document.getElementById('restartButton');

// Lander properties
let lander = {
    x: 400,
    y: 100,
    vx: 0,
    vy: 0,
    angle: 0,
    thrust: 0,
    fuel: 150,
    crashed: false,
    landed: false
};

// Terrain, stars, and particles arrays
let terrain = [];
let stars = [];
let particles = [];

// Game constants
const GRAVITY = 0.025;
const THRUST_POWER = 0.08;
const ROTATION_SPEED = 0.05;

// Optional rocket image
const rocketImage = new Image();
rocketImage.src = 'rocket.png'; // Replace with your image path if you have one
let rocketLoaded = false;
rocketImage.onload = () => { rocketLoaded = true; };
rocketImage.onerror = () => { console.log("Rocket image not found, using default lander shape."); };

// Generate terrain
function generateTerrain() {
    let x = 0;
    let y = 500;
    while (x < canvas.width) {
        terrain.push({ x: x, y: y });
        x += Math.random() * 50 + 50;
        y += Math.random() * 100 - 50;
        if (y < 400) y = 400;
        if (y > 550) y = 550;
    }
    let flatSpots = Math.random(5);
    for (let i = 1; i < terrain.length - 1; i += Math.floor(terrain.length / flatSpots)) {
        terrain[i].y = terrain[i - 1].y;
        terrain[i + 1].y = terrain[i].y;
    }
}

generateTerrain();

// Generate static stars
function generateStars() {
    for (let i = 0; i < 100; i++) {
        stars.push({
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height,
            size: Math.random() * 2
        });
    }
}

generateStars();

// Draw background
function drawBackground() {
    ctx.fillStyle = 'black';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = 'white';
    for (let star of stars) {
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
        ctx.fill();
    }
}

// Draw terrain
function drawTerrain() {
    ctx.beginPath();
    ctx.moveTo(terrain[0].x, terrain[0].y);
    for (let point of terrain) {
        ctx.lineTo(point.x, point.y);
    }
    ctx.lineTo(canvas.width, canvas.height);
    ctx.lineTo(0, canvas.height);
    ctx.closePath();
    ctx.fillStyle = '#555';
    ctx.fill();
}

// Draw lander (with optional rocket sprite)
function drawLander() {
    ctx.save();
    ctx.translate(lander.x, lander.y);
    ctx.rotate(lander.angle);

    if (rocketLoaded) {
        ctx.drawImage(rocketImage, -15, -15, 30, 30); // Adjust size as needed
    } else {
        // Default triangular lander
        ctx.beginPath();
        ctx.moveTo(0, -15);
        ctx.lineTo(10, 10);
        ctx.lineTo(-10, 10);
        ctx.closePath();
        ctx.fillStyle = '#ccc';
        ctx.fill();
        ctx.strokeStyle = 'white';
        ctx.stroke();
    }

    ctx.restore();
}

// Particle class for flames
class Particle {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.vx = (Math.random() - 0.5) * 2;
        this.vy = Math.random() * 2 + 1;
        this.life = 20;
    }
    update() {
        this.x += this.vx;
        this.y += this.vy;
        this.life--;
    }
    draw() {
        ctx.beginPath();
        ctx.arc(this.x, this.y, 2, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 165, 0, ${this.life / 20})`;
        ctx.fill();
    }
}

// Generate particles
function generateParticles() {
    if (lander.thrust > 0 && lander.fuel > 0) {
        let particleX = lander.x - Math.sin(lander.angle) * 15; // Adjusted for bottom thrust
        let particleY = lander.y + Math.cos(lander.angle) * 15;
        particles.push(new Particle(particleX, particleY));
    }
}

// Update and draw particles
function updateParticles() {
    particles = particles.filter(p => p.life > 0);
    for (let p of particles) {
        p.update();
        p.draw();
    }
}

// Update lander physics
function updateLander() {
    if (lander.crashed || lander.landed) return;

    lander.vy += GRAVITY;
    lander.x += lander.vx;
    lander.y += lander.vy;

    for (let i = 0; i < terrain.length - 1; i++) {
        let p1 = terrain[i];
        let p2 = terrain[i + 1];
        if (lander.x >= p1.x && lander.x <= p2.x) {
            let terrainY = p1.y + (lander.x - p1.x) * (p2.y - p1.y) / (p2.x - p1.x);
            if (lander.y + 10 >= terrainY) {
                if (Math.abs(lander.vy) < 1 && Math.abs(lander.vx) < 1 && Math.abs(lander.angle) < 0.1) {
                    lander.landed = true;
                } else {
                    lander.crashed = true;
                }
                lander.y = terrainY - 10;
                lander.vy = 0;
                lander.vx = 0;
            }
        }
    }

    if (lander.x < 0) lander.x = canvas.width;
    if (lander.x > canvas.width) lander.x = 0;
}

// Handle controls
let keys = { up: false, left: false, right: false };

document.addEventListener('keydown', (e) => {
    if (lander.crashed || lander.landed) return;
    if (e.key === 'ArrowUp') keys.up = true;
    if (e.key === 'ArrowLeft') keys.left = true;
    if (e.key === 'ArrowRight') keys.right = true;
});

document.addEventListener('keyup', (e) => {
    if (e.key === 'ArrowUp') keys.up = false;
    if (e.key === 'ArrowLeft') keys.left = false;
    if (e.key === 'ArrowRight') keys.right = false;
});

// Apply thrust
function applyThrust() {
    if (lander.fuel <= 0) return;

    if (keys.up) {
        lander.thrust = THRUST_POWER;
        lander.vx += Math.sin(lander.angle) * lander.thrust;
        lander.vy -= Math.cos(lander.angle) * lander.thrust;
        lander.fuel -= 0.5;
    } else {
        lander.thrust = 0;
    }

    if (keys.left) lander.angle -= ROTATION_SPEED;
    if (keys.right) lander.angle += ROTATION_SPEED;
}

// Draw controls text
function drawControls() {
    ctx.fillStyle = 'white';
    ctx.font = '16px Arial';
    ctx.fillText('Controls: Up - Thrust, Left - Rotate Left, Right - Rotate Right', 10, canvas.height - 10);
}

// Reset game
function resetGame() {
    window.location.reload();
}

restartButton.addEventListener('click', resetGame);

// Game loop
function gameLoop() {
    drawBackground();
    drawTerrain();
    drawLander();
    updateParticles();

    updateLander();
    applyThrust();
    generateParticles();

    ctx.fillStyle = 'white';
    ctx.font = '20px Arial';
    ctx.fillText(`Fuel: ${Math.floor(lander.fuel)}`, 10, 30);
    ctx.fillText(`Velocity: ${Math.floor( Math.sqrt((lander.vx*lander.vx)+ (lander.vy*lander.vy)) )}`, 10, 60);

    if (lander.crashed) {
        ctx.fillStyle = 'red';
        ctx.font = '30px Arial';
        ctx.fillText('Crashed!', 350, 300);
        restartButton.style.display = 'block';
    } else if (lander.landed) {
        ctx.fillStyle = 'green';
        ctx.font = '30px Arial';
        ctx.fillText('Landed Safely!', 320, 300);
        restartButton.style.display = 'block';
    } else {
        restartButton.style.display = 'none';
    }

    drawControls();
    requestAnimationFrame(gameLoop);
}

// Start the game
gameLoop();