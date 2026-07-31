//Set the game's title:
const gameTitle = "Brick Breaker";

//canvas gets the canvas element from the index.html document:
const canvas = document.getElementById("gameScreen");
//ctx gets the 2D canvas element that we can actually draw objects on, so ctx is used whenever we want to draw something:
const ctx = canvas.getContext("2d");

//Set level, lives and score values:
let level = 1;
let lives = 3;
let score = 0;
let time = 0;



let gameState = "start";

let paddleReady = false;

let scores = [120, 450, 90, 300];
scores.sort((a, b) => b - a); // high to low
scores.sort((a, b) => a - b); // low to high

const collectSound = new Audio("assets/collect.mp3");

const hitSound = new Audio("assets/hit.mp3");
hitSound.volume = 0.5;

const music = new Audio("assets/music.mp3");
music.loop = true;
music.volume = 0.4;

let muted = localStorage.getItem("muted") === true;

function toggleMute() {
    muted = !muted;
    music.volume = muted ? 0 : 0.4;
    localStorage.setItem("muted", muted);
}

document.addEventListener("keydown", e => {
    if (e.key === "m") {
        toggleMute();
    }
});

let shake = 0;
function triggerShake(s) {
    shake = s;
}

function gameOver() {
    music.currentTime = 0;
    music.pause();
    saveScore(score);
    gameState = "gameover";

    //save the top score:
    let board = JSON.parse(localStorage.getItem("board"));
    let high = Number(board[0].score) || 0;
    localStorage.setItem("highScore", high);
}

function randomX(n) {
    return Math.round(Math.random() * n);
}


//Counts down by 1 every 1000milliseconds:
let elapsedTime = 0;
setInterval(() => {
    elapsedTime++
}, 1000);

function saveScore(score) {
    let playerName = prompt("New high score! Your Name:") || "Player";
    let board = JSON.parse(localStorage.getItem("board")) || [];
    board.push({ name: playerName, score: score });
    board.sort((a, b) => b.score - a.score);
    board = board.slice(0, 5);
    localStorage.setItem("board", JSON.stringify(board));
}
function drawLeaderboard() {
    let board = JSON.parse(localStorage.getItem("board")) || [];
    ctx.fillStyle = "white";
    ctx.font = "20px Arial";
    ctx.fillText("Top Scores", 230, 120);
    for (let i = 0; i < board.length; i++) {
        ctx.fillText((i + 1) + ". " + board[i].name + " " + board[i].score, 250, 160 + i * 30);
    }
}


//Initalize the paddle Image() object:
const paddleImg = new Image();
// image.onload waits for the image to be loaded before taking action - in this case, we run the function below
paddleImg.onload = function () {
    //we set a v
    paddleReady = true;
}
paddleImg.src = "assets/paddle.png";

const shipImg = new Image();
shipImg.onload = function () {
    //image is loaded and can be drawn now
    imageReady = true;
}
shipImg.src = "assets/walk.png";

let bgReady = false;
const bgImg = new Image();
bgImg.onload = () => bgReady = true;
bgImg.src = "assets/background.png";

let powerups = [];

let asteroids = [];

function makeAsteroid(x, y, r) {
    return {
        x: x,
        y: y,
        r: r,
        w: x + r * 2,
        h: y + r * 2,
        vx: 3 * (Math.random() * 2 - 1),
        vy: 3 * (Math.random() * 2 - 1),
        alive: true
    }
}

function buildAsteroids(n) {
    for (i = 0; i < n; i++) {
        x = Math.random() * canvas.width;
        y = Math.random() * canvas.height;
        r = 3 + 12 * Math.random();
        asteroids.push(makeAsteroid(x, y, r));
    }
}

function moveAsteroids() {
    for (let a = 0; a < asteroids.length; a++) {
        a.x += a.vx;
        a.y += a.vy;

        if (ballColliding(a)) {

        }

    }
}

function collideAsteroids() {

}

function drawAsteroids(l) {
    for (i = 0; i < asteroids.length; i++) {
        let a = asteroids[i];
        ctx.fillStyle = "#361f00";
        ctx.beginPath();
        ctx.arc(a.x, a.y, a.r, 0, Math.PI * 2);
        ctx.fill();
    }
}

//Call this function in update()
function removePowerup() {
    for (let i = powerups.length - 1; i >= 0; i--) {
        if (powerups[i].y > 400) {
            powerups.splice(i, 1);
        }
    }
}

function makePowerUp(x, y) {
    return { x: x, y: y, w: 16, h: 16, vy: 2 };

}

// Call this function when a brick is broken:
function spawnPowerUp(x, y) {
    let chance = Math.random();
    if (chance > 0.79) {
        let newPowerup = makePowerUp(x, y);
        powerups.push(newPowerup);
    }
    else {
        return;
    }
}

// Call this function in update()
function movePowerUps() {
    for (i = 0; i < powerups.length; i++) {

        powerups[i].y += powerups[i].vy;

        if (isColliding(powerups[i], paddle)) {
            paddle.w = 150;
            paddle.growUntil = Date.now + 5000;
            powerups.splice(i, 1);
        }

    }
}

//Call this function in draw()
function drawPowerUps() {
    for (i = 0; i < powerups.length; i++) {
        let p = powerups[i];
        ctx.fillStyle = "yellow";
        ctx.fillRect(p.x, p.y, p.w, p.h);
    }
}

//An Array that holds all the bricks in the game.
//Bricks is a 2d array, so it is an array containing other arrays, each of which has its own values stored inside it as well:
let bricks = [];

//Set the number of rows of bricks to make:
const rows = 5;

//Set the number of columns of bricks to make:
const cols = 10;

function makeBrick(brickX, brickY) {
    return {
        x: brickX,
        y: brickY,
        w: 54,
        h: 18,
        alive: true,
        color: "red",
        health: 1
    };
}

function bricksLeft() {
    return bricks.flat().filter(b => b.alive).length;
}

//This loop creates all the arrays [] and brick Objects stored within bricks[]
for (let r = 0; r < rows; r++) {
    //First, we add a new array to the bricks array at index [r]:
    bricks[r] = [];

    //Then we add a number of bricks to this new array at position [r], equal to the number of columns defined by cols.
    for (let c = 0; c < cols; c++) {
        //Adds a brick variable inside the new sub-array that was added to the bricks[] array on line 33 - bricks[r][c] defines its position in this array.
        // [r] is the # of the array inside bricks[] and [c] is the position of the brick inside that sub-array   
        let x = 15 + c * 57;
        let y = 40 + r * 24;
        bricks[r][c] = makeBrick(x, y);
    }
}

//Create Object Literals to store the values for the paddle and ball:

/*This type of declaration, using a pair of curly-braces surrounding values like: {x: , y: , w: , h: } is called an "Object Literal"
 rather than declaring a single value like we usually would, using {} lets us create an object that can hold multiple values inside it which we can access later.
 note that an object literal, like a variable, does not do anything on its own, it is a container that stores values for other parts of the script to use*/

//The paddle has variables for its x position(x), y position(y), width(w), height(h) and speed:
const paddleStartValues = { x: 250, y: 370, w: 100, h: 14, speed: 6, growUntil: 0 };
let paddle = paddleStartValues;

const ballStartValues = { x: 300, y: 200, r: 8, vx: 3, vy: -3 };
//We create another Object Literal for the ball, storing its x position(x), y position(y), radius(r), velocity along the x-axis (vx) and velocity along the y-axis (vy)
let ball = ballStartValues;

function setTimer(t) {
    time = t;
    elapsedTime = 0;
}

document.addEventListener("keydown", e => {
    if (e.key === "Enter" && gameState === "start") {
        gameState = "playing";
        //setTimer(60);
    }
    if (e.key === "Enter" && gameState === "gameover") {
        resetGame();
    }
});


//check if the game is paused:
document.addEventListener("keydown", e => {
    if (e.key === "p") {
        if (gameState === "playing") {
            gameState = "paused";
        } else if (gameState === "paused") {
            gameState = "playing";
        }
    }
});

// Keys is created as an empty Object Literal that can be used to store and track of what keys on the keyboard are currently being held down:
let keys = {};

//We add a listener for keys being pressed - whenever any key is pressed, it adds that key to keys{} as a boolean value, and sets it to true:
document.addEventListener("keydown", e => {
    keys[e.key.toLowerCase()] = true;
})

//We add a listener for keys being released - whenever any key is released, it sets the value of that key in keys{} to false, indicating that it is no longer being held down
document.addEventListener("keyup", e => {
    keys[e.key.toLowerCase()] = false;
})

//Function isColliding checks for collision between two rectangular bounding boxes of a given object a and object b, by comparing the positions of their corner points
//If all the checks return true that means they are overlapping, and the function returns true as well, if any of the checks fail then the function returns false:
function isColliding(a, b) {
    return a.x < b.x + b.w &&
        a.x + a.w > b.x &&
        a.y < b.y + b.h &&
        a.y + a.h > b.y;
}

//Checks for a collision between the ball and another (rectangular) object (obj), if true, returns true:  
function ballColliding(obj) {
    if (ball.y + ball.r > obj.y &&
        //we subtract the ball's radius here because we want to check if the top of the ball is hitting the bottom of an object - not strictly necessary but makes collision more accurate:
        ball.y - ball.r < obj.y + obj.h
        && ball.x + ball.r > obj.x &&
        ball.x + ball.r < obj.x + obj.w)
        //Causes the ball to bounce up: 
        return true;
    //NOTE: Without the use of Math.abs, the ball will get stuck inside the paddle and keep moving up and down, as it will keep colliding and reverse direction every frame:
}

let frame = 0;
let tick = 0;

function resetBall() {
    ball.x = 300;
    ball.y = 200;
    ball.vy = -Math.abs(ball.vy);
}

function buildBricks() {
    for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
            //Check the brick in array [r] at position [c]:
            let b = bricks[r][c];
            b.alive = true;
        }
    }
}

function resetGame() {
    score = 0; // reset score
    lives = 3; // reset lives
    level = 1; // reset level
    resetBall(); //reset the ball's position
    buildBricks(); // rebuild all the bricks
    ball.vx = 3; // Set the ball's x velocity to its base - the value here should be whatever the ball's starting vx value is in your code
    ball.vy = -3; // Set the ball's y velocity to its base - the value here should be whatever the ball's starting vy value is in your code
    gameState = "playing"; //set the game state back to playing
    setTimer(60);

}

const maxSpeed = 6;
function nextLevel() {
    level++;
    ball.vx *= 1.1;
    ball.vy *= 1.1;
    if (Math.abs(ball.vx) > maxSpeed) ball.vx = maxSpeed * Math.sign(ball.vx);
    if (Math.abs(ball.vy) > maxSpeed) ball.vy = maxSpeed * Math.sign(ball.vy);
    buildBricks();
    resetBall();
}


let flash = 0;
function damageFlash(f) {
    flash = f;
}

let particles = [];

// call this function when a brick is destroyed
function burst(x, y) {
    for (i = 0; i < 8; i++) {
        particles.push({
            x, y,
            vx: (Math.random() - 0.5) * 6,
            vy: (Math.random() - 0.5) * 6, life: 1
        })
    }
}

//Place in update()
function moveParticles() {
    for (i = 0; i < particles.length; i++) {
        let p = particles[i];
        p.x += p.vx;
        p.y += p.vy;
    }
}

//Place near the bottom of draw()
function drawParticles() {

    for (i = 0; i < particles.length; i++) {
        let p = particles[i];
        ctx.fillStyle = "rgba(255,255,0," + p.life + ")";
        ctx.fillRect(p.x, p.y, 10, 10);
        p.life -= 0.05;
        if (p.life <= 0) {
            particles.splice(p, 1);
        }
    }
}

//Function update() is where you should put all your object's movement, collisions, and other interactions - do not draw anything inside update(), draw it in draw()
function update() {
    console.log(randomX(5));
    if (gameState === "playing") {
        console.table(bricks);
        music.play();
        moveParticles();
        tick++
        if (tick % 8 === 0) {
            frame = (frame + 1) % 4;
        }

        //Move the ball across the screen by adding its velocity to its position every frame:
        ball.x += ball.vx;
        ball.y += ball.vy;

        //If the wall would move off the left or right side of the screen, reverse its direction:
        if (ball.x < 0 || ball.x > canvas.width) ball.vx = -ball.vx;
        //This prevents the ball from moving off the top of the screen by reversing its direction, 
        //but not the bottom, as we want the ball to be able to fall out of the bottom as that's how the player loses:
        if (ball.y < 0) ball.vy = -ball.vy;

        //If the ball falls off the bottom of the screen:
        if (ball.y > canvas.height) {
            //If the player has lives left:

            if (lives > 1) {
                damageFlash(1);
                //remove one life, reset the ball's position
                lives = lives - 1;
                resetBall();
            }
            //If the player has no lives left:
            else {
                //Set the state to gameover
                if (!muted) {
                    hitSound.play();
                }
                gameOver();
            }
        }

        //Move paddle:
        if (keys["arrowleft"] || keys["a"]) paddle.x -= paddle.speed;
        if (keys["arrowright"] || keys["d"]) paddle.x += paddle.speed;
        if (keys["arrowup"] || keys["w"]) paddle.y -= paddle.speed;
        if (keys["arrowdown"] || keys["s"]) paddle.y += paddle.speed;

        //Keep paddle onscreen - if its x or y position ever becomes < 0 or is > the screen's width/height minus the paddle's own width or height,
        //we set its position along that axus back to either 0 or the size of the screen along that axis - the paddle's own size:   
        paddle.x = Math.max(0, Math.min(canvas.width - paddle.w, paddle.x));
        paddle.y = Math.max(0, Math.min(canvas.height - paddle.h, paddle.y));

        //Check if the ball is colliding with the paddle:
        if (ballColliding(paddle)) {
            //If it is, we use Math.abs to invert the ball's y velocity to move it upwards:
            ball.vy = -Math.abs(ball.vy);
            //NOTE: Math.abs always returns a positive value, so by using it here and then setting it to be negative,
            //we ensure the ball will always bounce upwards off the paddle, which is what we want.
        };

        //Brick Collision
        for (let r = 0; r < rows; r++) {
            for (let c = 0; c < cols; c++) {
                //Check the brick in array [r] at position [c]:
                const b = bricks[r][c];
                //If the ball is colliding with this brick (b) and the brick is alive: 
                if (b.alive && ballColliding(b)) {
                    // when the ball hits a brick:
                    //Set the brick to no longer be alive:
                    b.alive = false;
                    //Reverse the ball's velocity along the y axis (up/down) so it "bounces" off the brick:
                    ball.vy = -ball.vy;
                    //Add 10 points to the player's score:
                    score += 10;
                    spawnPowerUp(b.x + b.w * 0.5, b.y + b.h * 0.5);
                    //Play the sound from the beginning:
                    if (!muted) {
                        collectSound.cloneNode().play();
                    }
                    burst(b.x + b.w * 0.5, b.y + b.h * 0.5)
                    triggerShake(8);
                }
            }
        }

        movePowerUps();
        removePowerup();

        //When level is cleared
        if (bricksLeft() === 0) {
            nextLevel();
        }
    }
    //end of function update - anything past the curly-brace below will not be a part of update!///////////////////////////////////////////////////////////////////////////////
}


function drawHUD() {
    ctx.textAlign = "left";
    ctx.fillStyle = "white";
    ctx.font = "18px Arial";
    ctx.fillText("Score: " + score, 20, 30);
    ctx.fillText("Lives: " + lives, 230, 30);
    ctx.fillText(`Time: ${time - elapsedTime}`, 480, 30);
}

function drawStartScreen() {
    //Get the highScore
    let high = Number(localStorage.getItem("highScore")) || 0;

    ctx.textAlign = "center";
    ctx.fillStyle = "white";
    ctx.font = "40px Arial";
    ctx.fillText("Brick Breaker", 300, 150);

    //Show the highScore
    ctx.font = "20px Arial";
    ctx.fillText("High Score: " + high, 300, 210)
}

function drawPauseText() {
    ctx.textAlign = "center";
    ctx.fillStyle = "white";
    ctx.font = "40px Arial";
    ctx.fillText("PAUSED", canvas.width / 2, 160);

    ctx.font = "20px Arial";
    ctx.fillText("Press P to resume", canvas.width / 2, 220);

}

function drawGame() {
    if (bgReady) ctx.drawImage(bgImg, 0, 0, canvas.width, canvas.height);
    drawStartScreen;
    //This loop draws every brick contained within the bricks[] array:
    //For each array inside bricks:
    for (let r = 0; r < rows; r++) {
        //Check each brick inside that array:
        for (let c = 0; c < cols; c++) {
            //This if statement checks if the current brick is alive or not. If it is, then it gets drawn onto the canvas. If it isn't, then it is not drawn.
            //This is what allows the bricks to disappear after the ball hits them - it sets their "alive" value to false, so they aren't drawn and thus appear to be "destroyed".

            let b = bricks[r][c];

            if (b.alive === true) {

                if (r % 2 === 0) b.color = "red";
                if (r % 2 !== 0) b.color = "green";
                if (r % 3 === 0) b.color = "yellow";

                ctx.fillStyle = b.color;
                /*Draws the current brick using its stored values - note that the reason we use bricks[r][c] is to specify:
                 That we want the specific brick that is stored in the bricks array within the sub-array [r], and is at position [c] in that array.
                 Because we go through the first loop a number of times equal to bricks.length, and the second a number of times equal to the length
                 of the current array [r], we will draw every brick stored inside of the bricks[] array*/
                ctx.fillRect(b.x, b.y, b.w, b.h);
            }
        }
    }

    drawPowerUps();
    // Draw the paddle:
    // Sets the color of the paddle:
    ctx.fillStyle = "#4aabbd";
    // Draws the paddle using the values defined when the paddle Object was declared earlier - x, y, w, h
    ctx.drawImage(paddleImg, paddle.x, paddle.y, paddle.w, paddle.h);
    // ctx.drawImage (shipImg, frame*48, 0, 48, 48,
    // paddle.x, paddle.y, 48, 48);

    /* Remember that to access a value within an Object Literal, you need to use the object literal's name, 
       then a period, and then the name of the value you want to access, as shown here ^ */

    // Sets the color of the ball:
    ctx.fillStyle = "#006d2d";
    //Start drawing a path (shape) for the ball
    ctx.beginPath();
    //Draw the ball using the values defined when the paddle Object was declared earlier - x, y, r,
    //NOTE: When using ctx.arc to draw a circle, remember to use 0 as the starting angle and Math.PI * 2 as the ending angle:
    ctx.arc(ball.x, ball.y, ball.r, 0, Math.PI * 2);
    //Colors in the ball:
    ctx.fill();

    //If flash is greater > 0, we turn the whole screen red with opacity = the value of flash, then reduce the value of flash every frame until it is 0:
    if (flash > 0) {
        ctx.fillStyle = "rgba(255,0,0," + flash + ")";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        flash -= 0.05;
    }
    drawParticles();

    drawHUD();
}

function drawGameOver() {
    /*
    ctx.textAlign = "center";
    ctx.fillStyle = "white";
    ctx.font = "40px Arial";
    ctx.fillText("GAME OVER", 300, 160);
    ctx.font = "24px Arial";
    ctx.fillText(`Score: ${score}`, 300, 210);
    ctx.fillText("Press ENTER to retry", 300, 270);
    */
    drawLeaderboard();
}

//Function update() is where you should draw all the graphics on the canvas, don't use it for physics or collisions, those should be handled in update()
function draw() {
    let dx = (Math.random() - 0.5) * shake;
    let dy = (Math.random() - 0.5) * shake;
    ctx.save();
    ctx.translate(dx, dy);
    //ClearRect wipes the canvas - nothing should be above clearRect in draw or it won't display.
    if (gameState === "start") drawStartScreen();
    if (gameState === "playing") drawGame();
    if (gameState === "gameover") drawGameOver();
    if (gameState === "paused") { drawGame(); drawPauseText(); }
    //end of function draw() - anything past the curly-brace below will not be a part of draw()///////////////////////////////////////////////////////////////////////////////
    ctx.restore();
    if (shake > 0) shake -= 0.5;
}



//New function pageUI - gets the values of the page's score, lives and level UI from the index.html file and updates them to match the values of the score, lives, and level variables:
function pageUI() {
    document.getElementById("scoreText").textContent = score;
    document.getElementById("livesText").textContent = lives;
    document.getElementById("levelText").textContent = level;
}

// The Game Loop. Every function that you want to run repeatedly, so update(), draw(), pageUI, etc must be placed inside the gameLoop() function or they won't run more than once:
function gameLoop() {
    // Run update() before draw to make sure all the positions of objects get updated before you draw them:
    update();
    // Then run draw() to render all the game's visuals:
    draw();
    // Update the values of the page's UI:
    pageUI();
    /* this next line repeats the gameLoop, causing it to run indefinitely as every completed gameLoop will start another.
       requestAnimationFrame is used here because it tells the code to wait to play the gameloop function at the start of the next frame - 
       if we were simply to call gameloop, the page would crash due to the code trying to repeatedly run gameLoop() immediately.*/
    requestAnimationFrame(gameLoop);
}

// Starts the gameLoop, without this line of code at the end of your script nothing will function
requestAnimationFrame(gameLoop);


