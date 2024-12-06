import { Platform } from "./platform.js";
import { Enemy } from "./enemy.js";
const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
const canvasWidth = canvas.width;
const canvasHeight = canvas.height;
let lastTime = 0;
let worldOffsetX = 0;
function gameLoop(timestamp) {
  const deltaTime = timestamp - lastTime;
  lastTime = timestamp;

  // Efface l'écran
  ctx.clearRect(0, 0, canvasWidth, canvasHeight);

  // Logique et rendu
  update(deltaTime);
  draw();

  // Appel récursif
  requestAnimationFrame(gameLoop);
}
requestAnimationFrame(gameLoop);
class Player {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.width = 50;
    this.height = 50;
    this.speed = 5;
    this.dy = 0; // Vitesse verticale (chute)
    this.gravity = 0.5; // Gravité
    this.jumpStrength = -15; // Force du saut
    this.isOnGround = false; // Indicateur si le joueur est sur une plateforme
    this.moveDirection = 0; // 1 pour droite, -1 pour gauche, 0 pour immobile
    this.color = "blue";
    this.bullets = [];
  }
  move(direction) {
    if (direction === "left") this.moveDirection = -1;
    if (direction === "right") this.moveDirection = 1;
  }
  stop() {
    this.moveDirection = 0;
  }
  shoot() {
    this.bullets.push(
      new Bullet(this.x + this.width, this.y + this.height / 2)
    );
  }
  jump() {
    if (this.isOnGround) {
      this.dy = this.jumpStrength; // Applique la force du saut
      this.isOnGround = false;
    }
  }
  update() {
    // Applique la gravité
    this.dy += this.gravity;
    this.y += this.dy;
    this.isOnGround = false; // Réinitialise l'état de "sur le sol"
    // Détecter la collision avec chaque plateforme
    platforms.forEach((platform) => {
      // Vérifier la collision horizontale et verticale
      if (
        this.x < platform.x + platform.width &&
        this.x + this.width > platform.x &&
        this.y + this.height > platform.y &&
        this.y + this.height < platform.y + platform.height
      ) {
        this.dy = 0; // Arrête la chute
        this.isOnGround = true;
        this.y = platform.y - this.height; // Placer le joueur sur la plateforme
      }
    });
    // Déplace le joueur horizontalement en fonction de la direction
    this.x += this.moveDirection * this.speed;
    // Limiter les mouvements horizontaux aux bords de l'écran
    if (this.x < 0) this.x = 0;
    if (this.x + this.width > canvasWidth) this.x = canvasWidth - this.width;
    // Si le joueur tombe en dehors de l'écran
    if (this.y + this.height > canvasHeight) {
      this.y = canvasHeight - this.height;
      this.dy = 0;
      this.isOnGround = true;
    }
    this.bullets.forEach((bullet) => bullet.update());
    this.bullets = this.bullets.filter((bullet) => !bullet.outOfBounds());
  }
  draw(ctx) {
    ctx.fillStyle = this.color;
    ctx.fillRect(this.x, this.y, this.width, this.height);
    // Dessine les projectiles
    this.bullets.forEach((bullet) => bullet.draw(ctx));
  }
}
class Bullet {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.width = 10;
    this.height = 5;
    this.speed = 7;
    this.color = "yellow";
  }

  update() {
    this.x += this.speed;
  }

  outOfBounds() {
    return this.x > canvasWidth;
  }

  draw(ctx) {
    ctx.fillStyle = this.color;
    ctx.fillRect(this.x, this.y, this.width, this.height);
  }
}
function checkCollisions() {
  enemies = enemies.filter((enemy) => {
    const isCollided = player.bullets.some(
      (bullet) =>
        bullet.x < enemy.x + enemy.width &&
        bullet.x + bullet.width > enemy.x &&
        bullet.y < enemy.y + enemy.height &&
        bullet.y + bullet.height > enemy.y
    );

    if (isCollided) return false; // L'ennemi est détruit
    return enemy.x + enemy.width > 0; // Garde les ennemis dans l'écran
  });
}
const player = new Player(50, canvasHeight / 2);
const platforms = [
  new Platform(1, 600, 200, 20),
  new Platform(300, 500, 200, 20),
  new Platform(100, 300, 200, 20),
  new Platform(400, 400, 200, 20),
  new Platform(600, 200, 200, 20),
  new Platform(200, 100, 200, 20),
  new Platform(500, 700, 200, 20),
];
let enemies = [
  new Enemy(120, 300 - 40, platforms[2]), // Ennemis sur la première plateforme
  new Enemy(420, 400 - 40, platforms[3]),
];
document.addEventListener("keydown", (event) => {
  if (event.key === "ArrowLeft") player.move("left");
  if (event.key === "ArrowRight") player.move("right");
  if (event.key === "ArrowUp") player.jump();
  if (event.key === " ") player.shoot(); // Touche espace pour tirer
});
document.addEventListener("keyup", (event) => {
  if (event.key === "ArrowLeft" || event.key === "ArrowRight") player.stop(); // Arrêter le mouvement horizontal
});
function generatePlatform() {
  const platformWidth = Math.random() * 200 + 50; // Largeur entre 50 et 250 pixels
  const platformHeight = 20;
  const platformX = canvasWidth + Math.random() * 200; // Position hors écran (à droite)
  const platformY = Math.random() * (canvasHeight - 200); // Hauteur aléatoire (évite le bas de l'écran)
  return new Platform(platformX, platformY, platformWidth, platformHeight);
}
function generateEnemy(platform) {
  const enemyX = platform.x + Math.random() * (platform.width - 40); // Position sur la plateforme
  const enemyY = platform.y - 40; // Juste au-dessus de la plateforme
  return new Enemy(enemyX, enemyY, platform);
}

function update(deltaTime) {
  player.update();
  // Si le joueur dépasse le centre de l'écran
  if (player.x > canvasWidth / 2) {
    // Le joueur reste centré, et tout le reste défile
    const scrollSpeed = player.speed;
    player.x = canvasWidth / 2; // Garder le joueur au centre
    platforms.forEach((platform) => platform.update(scrollSpeed));
    enemies.forEach((enemy) => enemy.update(scrollSpeed));
    // Vérifie si des plateformes sortent de l'écran et en génère de nouvelles
    for (let i = platforms.length - 1; i >= 0; i--) {
      const platform = platforms[i];

      // Si la plateforme est sortie de l'écran
      if (platform.x + platform.width < 0) {
        platforms.splice(i, 1); // Supprime la plateforme
        platforms.push(generatePlatform()); // Ajoute une nouvelle plateforme
      }
    }
  }
  // Limiter à un maximum de 4 ennemis dans le jeu
  if (enemies.length < 2) {
    platforms.forEach((platform) => {
      // Vérifie si un ennemi n'est pas déjà sur la plateforme
      if (
        Math.random() < 0.3 &&
        !enemies.some((enemy) => enemy.platform === platform)
      ) {
        enemies.push(generateEnemy(platform));
      }
    });
  }
  enemies.forEach((enemy) => enemy.update(deltaTime));
  checkCollisions();
}
function draw() {
  player.draw(ctx);
  platforms.forEach((platform) => platform.draw(ctx));
  enemies.forEach((enemy) => enemy.draw(ctx));
}