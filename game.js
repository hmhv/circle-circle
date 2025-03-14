// エラーメッセージ要素の取得
const errorMessage = document.getElementById('errorMessage');

// エラーハンドリング関数
function showError(message) {
    errorMessage.textContent = message;
    errorMessage.style.display = 'block';
    setTimeout(() => {
        errorMessage.style.display = 'none';
    }, 3000);
}

// キャンバスとコンテキストの初期化
let canvas, ctx;
try {
    canvas = document.getElementById('gameCanvas');
    ctx = canvas.getContext('2d');
    if (!ctx) {
        throw new Error('Canvas 2D context is not supported');
    }
} catch (error) {
    showError('ゲームの初期化に失敗しました。ブラウザを更新してください。');
    console.error('Canvas initialization error:', error);
}

// ゲーム要素の取得
const startButton = document.getElementById('startButton');
const scoreElement = document.getElementById('scoreValue');
const levelElement = document.getElementById('levelValue');

// キャンバスサイズの設定
function resizeCanvas() {
    const container = canvas.parentElement;
    const containerWidth = container.clientWidth - 40; // パディングを考慮
    const containerHeight = window.innerHeight - 200; // 余白を考慮
    
    canvas.width = Math.min(800, containerWidth);
    canvas.height = Math.min(600, containerHeight);
}

// リサイズイベントの設定
window.addEventListener('resize', resizeCanvas);
resizeCanvas();

// ゲームの状態
let gameRunning = false;
let score = 0;
let gameTime = 0;
let gameOver = false;
let animationFrameId = null;

// オブジェクト設定
let coinCount = 15;
let obstacleCount = 25;
const powerUpCount = 1;

// プレイヤーの設定
let player = {
    x: canvas.width / 2,
    y: canvas.height / 2,
    size: 20,
    speed: 5, // 速度を遅くして滑らかに
    dx: 0,
    dy: 0
};

// ゲームオブジェクトの配列
let coins = [];
let obstacles = [];
let powerUps = [];

// キー入力の状態
const keys = {
    ArrowLeft: false,
    ArrowRight: false,
    ArrowUp: false,
    ArrowDown: false
};

// タッチ入力の状態
let touchStartX = 0;
let touchStartY = 0;

// タッチイベントの設定
canvas.addEventListener('touchstart', (e) => {
    e.preventDefault();
    touchStartX = e.touches[0].clientX;
    touchStartY = e.touches[0].clientY;
}, { passive: false });

canvas.addEventListener('touchmove', (e) => {
    e.preventDefault();
    const touchX = e.touches[0].clientX;
    const touchY = e.touches[0].clientY;
    
    const dx = touchX - touchStartX;
    const dy = touchY - touchStartY;
    
    player.dx = dx * 0.1;
    player.dy = dy * 0.1;
    
    touchStartX = touchX;
    touchStartY = touchY;
}, { passive: false });

// キーボードイベントの設定
window.addEventListener('keydown', (e) => {
    if (keys.hasOwnProperty(e.key)) {
        keys[e.key] = true;
        // スクロールを防止
        if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
            e.preventDefault();
        }
    }
});

window.addEventListener('keyup', (e) => {
    if (keys.hasOwnProperty(e.key)) {
        keys[e.key] = false;
    }
});

// プレイヤーの描画
function drawPlayer() {
    try {
        ctx.beginPath();
        ctx.arc(player.x + player.size/2, player.y + player.size/2, player.size/2, 0, Math.PI * 2);
        ctx.fillStyle = '#0000FF';
        ctx.fill();
        ctx.strokeStyle = '#FFFFFF';
        ctx.lineWidth = 2;
        ctx.stroke();
    } catch (error) {
        console.error('Error drawing player:', error);
    }
}

// コインクラス
class Coin {
    constructor() {
        this.size = 15;
        this.x = Math.random() * (canvas.width - this.size);
        this.y = Math.random() * (canvas.height - this.size);
        this.speed = 3;
        this.dx = (Math.random() - 0.5) * this.speed;
        this.dy = (Math.random() - 0.5) * this.speed;
    }

    update() {
        this.x += this.dx;
        this.y += this.dy;

        if (this.x <= 0 || this.x >= canvas.width - this.size) this.dx *= -1;
        if (this.y <= 0 || this.y >= canvas.height - this.size) this.dy *= -1;
    }

    draw() {
        try {
            ctx.beginPath();
            ctx.arc(this.x + this.size/2, this.y + this.size/2, this.size/2, 0, Math.PI * 2);
            ctx.fillStyle = '#FFD700';
            ctx.fill();
            ctx.strokeStyle = '#FFFFFF';
            ctx.lineWidth = 2;
            ctx.stroke();
        } catch (error) {
            console.error('Error drawing coin:', error);
        }
    }
}

// 障害物クラス
class Obstacle {
    constructor() {
        this.size = 20;
        const centerX = canvas.width / 2;
        const centerY = canvas.height / 2;
        const radius = Math.min(canvas.width, canvas.height) / 2.5;
        const angle = Math.random() * Math.PI * 2;
        this.x = centerX + Math.cos(angle) * radius;
        this.y = centerY + Math.sin(angle) * radius;
        this.speed = 4;
        this.dx = Math.cos(angle) * this.speed;
        this.dy = Math.sin(angle) * this.speed;
    }

    update() {
        this.x += this.dx;
        this.y += this.dy;

        if (this.x <= 0 || this.x >= canvas.width - this.size) this.dx *= -1;
        if (this.y <= 0 || this.y >= canvas.height - this.size) this.dy *= -1;
    }

    draw() {
        try {
            ctx.beginPath();
            ctx.arc(this.x + this.size/2, this.y + this.size/2, this.size/2, 0, Math.PI * 2);
            ctx.fillStyle = '#FF0000';
            ctx.fill();
            ctx.strokeStyle = '#FFFFFF';
            ctx.lineWidth = 2;
            ctx.stroke();
        } catch (error) {
            console.error('Error drawing obstacle:', error);
        }
    }
}

// パワーアップクラス
class PowerUp {
    constructor() {
        this.size = 15;
        this.x = Math.random() * (canvas.width - this.size);
        this.y = Math.random() * (canvas.height - this.size);
        this.active = true;
    }

    draw() {
        if (this.active) {
            try {
                ctx.beginPath();
                ctx.arc(this.x + this.size/2, this.y + this.size/2, this.size/2, 0, Math.PI * 2);
                ctx.fillStyle = '#00FF00';
                ctx.fill();
                ctx.strokeStyle = '#FFFFFF';
                ctx.lineWidth = 2;
                ctx.stroke();
            } catch (error) {
                console.error('Error drawing power-up:', error);
            }
        }
    }
}

// 衝突判定
function checkCollision(circle1, circle2) {
    const dx = (circle1.x + circle1.size/2) - (circle2.x + circle2.size/2);
    const dy = (circle1.y + circle1.size/2) - (circle2.y + circle2.size/2);
    const distance = Math.sqrt(dx * dx + dy * dy);
    return distance < (circle1.size/2 + circle2.size/2);
}

// 衝突エフェクト
function drawCollisionEffect(x, y, size) {
    try {
        ctx.beginPath();
        ctx.arc(x, y, size * 1.5, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.fill();
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
        ctx.lineWidth = 2;
        ctx.stroke();
    } catch (error) {
        console.error('Error drawing collision effect:', error);
    }
}

// ゲームの初期化
function initGame() {
    try {
        coins = [];
        obstacles = [];
        powerUps = [];
        
        score = 0;
        gameTime = 0;
        
        keys.ArrowLeft = false;
        keys.ArrowRight = false;
        keys.ArrowUp = false;
        keys.ArrowDown = false;
        
        scoreElement.textContent = score;
        levelElement.textContent = '0秒';
        
        player.x = canvas.width / 2 - player.size / 2;
        player.y = canvas.height / 2 - player.size / 2;
        
        for (let i = 0; i < coinCount; i++) {
            coins.push(new Coin());
        }
        
        for (let i = 0; i < obstacleCount; i++) {
            obstacles.push(new Obstacle());
        }
        
        for (let i = 0; i < powerUpCount; i++) {
            powerUps.push(new PowerUp());
        }
    } catch (error) {
        showError('ゲームの初期化に失敗しました。');
        console.error('Game initialization error:', error);
    }
}

// ゲームオーバー画面の描画
function drawGameOver() {
    try {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        ctx.fillStyle = '#FFFFFF';
        ctx.font = '48px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('GAME OVER', canvas.width / 2, canvas.height / 2 - 50);
        
        ctx.font = '24px Arial';
        ctx.fillText(`スコア: ${score}`, canvas.width / 2, canvas.height / 2 + 10);
        ctx.fillText(`プレイ時間: ${Math.floor(gameTime)}秒`, canvas.width / 2, canvas.height / 2 + 40);
        
        ctx.font = '20px Arial';
        ctx.fillText('スペースキーでリスタート', canvas.width / 2, canvas.height / 2 + 80);
    } catch (error) {
        console.error('Error drawing game over screen:', error);
    }
}

// プレイヤーの更新
function updatePlayer() {
    try {
        if (keys.ArrowLeft) player.dx = -player.speed;
        else if (keys.ArrowRight) player.dx = player.speed;
        else player.dx = 0;
        
        if (keys.ArrowUp) player.dy = -player.speed;
        else if (keys.ArrowDown) player.dy = player.speed;
        else player.dy = 0;
        
        // 移動前の位置を保存
        const prevX = player.x;
        const prevY = player.y;
        
        player.x += player.dx;
        player.y += player.dy;
        
        // 画面端での制限と衝突判定
        if (player.x <= 0 || player.x >= canvas.width - player.size || 
            player.y <= 0 || player.y >= canvas.height - player.size) {
            // 壁に当たった場合、元の位置に戻す
            player.x = prevX;
            player.y = prevY;
            // 衝突エフェクトの描画
            drawCollisionEffect(
                player.x + player.size/2,
                player.y + player.size/2,
                player.size/2
            );
            handleGameOver();
        }
    } catch (error) {
        console.error('Error updating player:', error);
    }
}

// ゲームループ
function gameLoop() {
    try {
        if (!gameRunning || gameOver) return;
        
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // ゲーム時間の更新
        gameTime += 1/60;
        levelElement.textContent = Math.floor(gameTime) + '秒';
        
        // プレイヤーの更新と描画
        updatePlayer();
        drawPlayer();
        
        // コインの更新と描画
        coins.forEach(coin => {
            coin.update();
            coin.draw();
            
            if (checkCollision(player, coin)) {
                score += 10;
                scoreElement.textContent = score;
                coins = coins.filter(c => c !== coin);
                coins.push(new Coin());
                drawCollisionEffect(coin.x + coin.size/2, coin.y + coin.size/2, coin.size);
            }
        });
        
        // 障害物の更新と描画
        obstacles.forEach(obstacle => {
            obstacle.update();
            obstacle.draw();
            
            if (checkCollision(player, obstacle)) {
                handleGameOver();
            }
        });
        
        // パワーアップの描画と処理
        powerUps.forEach(powerUp => {
            powerUp.draw();
            
            if (powerUp.active && checkCollision(player, powerUp)) {
                player.speed *= 1.5;
                powerUp.active = false;
                setTimeout(() => {
                    player.speed /= 1.5;
                }, 5000);
                powerUps = powerUps.filter(p => p !== powerUp);
                powerUps.push(new PowerUp());
                drawCollisionEffect(powerUp.x + powerUp.size/2, powerUp.y + powerUp.size/2, powerUp.size);
            }
        });
        
        animationFrameId = requestAnimationFrame(gameLoop);
    } catch (error) {
        showError('ゲームの実行中にエラーが発生しました。');
        console.error('Game loop error:', error);
    }
}

// ゲームオーバー処理
function handleGameOver() {
    gameOver = true;
    gameRunning = false;
    if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
    }
    drawGameOver();
}

// ゲームスタート処理
startButton.addEventListener('click', () => {
    if (gameRunning) return;
    
    gameOver = false;
    gameRunning = true;
    initGame();
    gameLoop();
});

// リスタート処理
window.addEventListener('keydown', (e) => {
    if (e.code === 'Space' && gameOver) {
        gameOver = false;
        gameRunning = true;
        initGame();
        gameLoop();
    }
}); 