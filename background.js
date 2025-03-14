// 背景アニメーション用のコード

// キャンバスとコンテキストの取得
const backgroundCanvas = document.getElementById('backgroundCanvas');
const bgCtx = backgroundCanvas.getContext('2d');

// 画面サイズに合わせてキャンバスサイズを設定
function resizeBackgroundCanvas() {
    backgroundCanvas.width = window.innerWidth;
    backgroundCanvas.height = window.innerHeight;
}

// リサイズイベントのリスナー
window.addEventListener('resize', () => {
    resizeBackgroundCanvas();
    createParticles(); // リサイズ時に粒子を再生成
});

// 最初のキャンバスサイズ設定
resizeBackgroundCanvas();

// 粒子の設定
const particles = [];
const particleCount = 50; // 粒子の数
const particleColors = [
    'rgba(255, 255, 255, 0.3)',
    'rgba(135, 206, 250, 0.2)',
    'rgba(70, 130, 180, 0.2)',
    'rgba(123, 104, 238, 0.2)',
    'rgba(147, 112, 219, 0.2)',
    'rgba(238, 130, 238, 0.2)',
    'rgba(255, 192, 203, 0.2)'
];

// 粒子クラス
class Particle {
    constructor() {
        this.size = Math.random() * 15 + 5; // 大きさをランダムに
        this.x = Math.random() * backgroundCanvas.width;
        this.y = Math.random() * backgroundCanvas.height;
        this.speedX = (Math.random() - 0.5) * 0.8; // ゆっくり動くように
        this.speedY = (Math.random() - 0.5) * 0.8;
        this.color = particleColors[Math.floor(Math.random() * particleColors.length)];
        this.opacity = Math.random() * 0.5 + 0.1;
    }

    // 粒子の更新
    update() {
        this.x += this.speedX;
        this.y += this.speedY;

        // 画面端での反射
        if (this.x <= 0 || this.x >= backgroundCanvas.width) this.speedX *= -1;
        if (this.y <= 0 || this.y >= backgroundCanvas.height) this.speedY *= -1;
    }

    // 粒子の描画
    draw() {
        bgCtx.beginPath();
        bgCtx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        bgCtx.fillStyle = this.color;
        bgCtx.globalAlpha = this.opacity;
        bgCtx.fill();
        bgCtx.globalAlpha = 1;
    }
}

// 粒子の生成
function createParticles() {
    particles.length = 0; // 配列をクリア
    for (let i = 0; i < particleCount; i++) {
        particles.push(new Particle());
    }
}

// 粒子を初期化
createParticles();

// アニメーションループ
function animateBackground() {
    // 透明度の低い四角形で前のフレームを少し残す（軌跡効果）
    bgCtx.fillStyle = 'rgba(26, 26, 46, 0.2)';
    bgCtx.fillRect(0, 0, backgroundCanvas.width, backgroundCanvas.height);

    // 各粒子の更新と描画
    particles.forEach(particle => {
        particle.update();
        particle.draw();
    });
    
    // 次のフレームを要求
    requestAnimationFrame(animateBackground);
}

// アニメーションを開始
animateBackground(); 