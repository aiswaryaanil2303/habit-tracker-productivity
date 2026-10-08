/**
 * 💖 BIRTHDAY WEBSITE - INTERACTIVE JAVASCRIPT
 * Handles animations, audio synthesis, audio player, cake blowing, 
 * love letters, coupons, reasons jar, and confetti magic.
 */

// =========================================================
// 🔊 SOUND SYNTHESIZER (Web Audio API - 100% Reliable SFX)
// =========================================================
const AudioFX = {
    ctx: null,
    
    init() {
        if (!this.ctx) {
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            this.ctx = new AudioContext();
        }
        if (this.ctx.state === 'suspended') {
            this.ctx.resume();
        }
    },
    
    // Gentle romantic chime / surprise unlock sound
    playChime() {
        this.init();
        const now = this.ctx.currentTime;
        const notes = [523.25, 659.25, 783.99, 1046.50, 1318.51]; // C5, E5, G5, C6, E6
        
        notes.forEach((freq, idx) => {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(freq, now + idx * 0.1);
            
            gain.gain.setValueAtTime(0, now + idx * 0.1);
            gain.gain.linearRampToValueAtTime(0.2, now + idx * 0.1 + 0.05);
            gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.1 + 1.2);
            
            osc.connect(gain);
            gain.connect(this.ctx.destination);
            
            osc.start(now + idx * 0.1);
            osc.stop(now + idx * 0.1 + 1.3);
        });
    },

    // Soft candle blow whoosh sound
    playBlow() {
        this.init();
        const now = this.ctx.currentTime;
        const bufferSize = this.ctx.sampleRate * 0.8;
        const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            data[i] = Math.random() * 2 - 1;
        }

        const noise = this.ctx.createBufferSource();
        noise.buffer = buffer;

        const filter = this.ctx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.setValueAtTime(400, now);
        filter.frequency.exponentialRampToValueAtTime(150, now + 0.8);
        filter.Q.setValueAtTime(2, now);

        const gain = this.ctx.createGain();
        gain.gain.setValueAtTime(0.3, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.8);

        noise.connect(filter);
        filter.connect(gain);
        gain.connect(this.ctx.destination);

        noise.start(now);
        noise.stop(now + 0.8);
    },

    // Stamp / Pop sound for coupons & jar
    playPop() {
        this.init();
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        
        osc.type = 'sine';
        osc.frequency.setValueAtTime(400, now);
        osc.frequency.exponentialRampToValueAtTime(800, now + 0.15);
        
        gain.gain.setValueAtTime(0.3, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);
        
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        
        osc.start(now);
        osc.stop(now + 0.2);
    }
};

// =========================================================
// 🎊 CONFETTI & FIREWORKS SYSTEM
// =========================================================
const ConfettiSystem = {
    canvas: null,
    ctx: null,
    particles: [],
    animId: null,

    init() {
        this.canvas = document.createElement('canvas');
        this.canvas.id = 'confetti-canvas';
        this.canvas.style.position = 'fixed';
        this.canvas.style.top = '0';
        this.canvas.style.left = '0';
        this.canvas.style.width = '100vw';
        this.canvas.style.height = '100vh';
        this.canvas.style.pointerEvents = 'none';
        this.canvas.style.zIndex = '9998';
        document.body.appendChild(this.canvas);
        
        this.ctx = this.canvas.getContext('2d');
        this.resize();
        window.addEventListener('resize', () => this.resize());
    },

    resize() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
    },

    burst(x = window.innerWidth / 2, y = window.innerHeight / 2, count = 120) {
        const colors = ['#f5b0cd', '#f3c98b', '#e29578', '#ff4d6d', '#ffffff', '#8338ec', '#ffd166'];
        
        for (let i = 0; i < count; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = Math.random() * 12 + 4;
            this.particles.push({
                x,
                y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed - 3,
                size: Math.random() * 8 + 4,
                color: colors[Math.floor(Math.random() * colors.length)],
                rotation: Math.random() * 360,
                rotSpeed: (Math.random() - 0.5) * 10,
                opacity: 1,
                decay: Math.random() * 0.015 + 0.008,
                isHeart: Math.random() > 0.6
            });
        }

        if (!this.animId) {
            this.animate();
        }
    },

    drawHeart(ctx, x, y, size, color, opacity, rotation) {
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate((rotation * Math.PI) / 180);
        ctx.globalAlpha = opacity;
        ctx.fillStyle = color;
        ctx.beginPath();
        const topCurveHeight = size * 0.3;
        ctx.moveTo(0, topCurveHeight);
        // Left curve
        ctx.bezierCurveTo(-size / 2, -topCurveHeight, -size, topCurveHeight / 3, 0, size);
        // Right curve
        ctx.bezierCurveTo(size, topCurveHeight / 3, size / 2, -topCurveHeight, 0, topCurveHeight);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
    },

    animate() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];
            p.x += p.vx;
            p.y += p.vy;
            p.vy += 0.25; // gravity
            p.rotation += p.rotSpeed;
            p.opacity -= p.decay;

            if (p.opacity <= 0) {
                this.particles.splice(i, 1);
                continue;
            }

            if (p.isHeart) {
                this.drawHeart(this.ctx, p.x, p.y, p.size, p.color, p.opacity, p.rotation);
            } else {
                this.ctx.save();
                this.ctx.translate(p.x, p.y);
                this.ctx.rotate((p.rotation * Math.PI) / 180);
                this.ctx.globalAlpha = p.opacity;
                this.ctx.fillStyle = p.color;
                this.ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
                this.ctx.restore();
            }
        }

        if (this.particles.length > 0) {
            this.animId = requestAnimationFrame(() => this.animate());
        } else {
            this.animId = null;
        }
    }
};

// =========================================================
// 🌌 BACKGROUND STARRY CANVAS & SPARKLE TRAIL
// =========================================================
const BackgroundCanvas = {
    canvas: null,
    ctx: null,
    stars: [],
    sparkles: [],

    init() {
        this.canvas = document.getElementById('star-canvas');
        this.ctx = this.canvas.getContext('2d');
        this.resize();
        this.createStars(80);
        
        window.addEventListener('resize', () => this.resize());
        window.addEventListener('mousemove', (e) => this.addSparkle(e.clientX, e.clientY));
        window.addEventListener('touchmove', (e) => {
            if (e.touches.length > 0) {
                this.addSparkle(e.touches[0].clientX, e.touches[0].clientY);
            }
        });

        this.render();
    },

    resize() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
    },

    createStars(num) {
        this.stars = [];
        for (let i = 0; i < num; i++) {
            this.stars.push({
                x: Math.random() * window.innerWidth,
                y: Math.random() * window.innerHeight,
                radius: Math.random() * 1.5 + 0.5,
                alpha: Math.random(),
                speed: Math.random() * 0.02 + 0.005,
                color: Math.random() > 0.3 ? '#f3c98b' : '#f5b0cd'
            });
        }
    },

    addSparkle(x, y) {
        if (this.sparkles.length > 30) return;
        this.sparkles.push({
            x,
            y,
            size: Math.random() * 4 + 2,
            alpha: 1,
            color: Math.random() > 0.5 ? '#f3c98b' : '#ffffff',
            vx: (Math.random() - 0.5) * 1.5,
            vy: (Math.random() - 0.5) * 1.5 - 0.5
        });
    },

    render() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        // Twinkling stars
        this.stars.forEach(s => {
            s.alpha += s.speed;
            if (s.alpha > 1 || s.alpha < 0.2) s.speed = -s.speed;
            
            this.ctx.beginPath();
            this.ctx.arc(s.x, s.y, s.radius, 0, Math.PI * 2);
            this.ctx.fillStyle = s.color;
            this.ctx.globalAlpha = Math.max(0.1, Math.min(1, s.alpha));
            this.ctx.fill();
        });

        // Mouse trail sparkles
        for (let i = this.sparkles.length - 1; i >= 0; i--) {
            const sp = this.sparkles[i];
            sp.x += sp.vx;
            sp.y += sp.vy;
            sp.alpha -= 0.03;

            if (sp.alpha <= 0) {
                this.sparkles.splice(i, 1);
                continue;
            }

            this.ctx.beginPath();
            this.ctx.arc(sp.x, sp.y, sp.size, 0, Math.PI * 2);
            this.ctx.fillStyle = sp.color;
            this.ctx.globalAlpha = sp.alpha;
            this.ctx.shadowBlur = 8;
            this.ctx.shadowColor = sp.color;
            this.ctx.fill();
            this.ctx.shadowBlur = 0;
        }

        requestAnimationFrame(() => this.render());
    }
};

// =========================================================
// 🎵 DEDICATED SONG AUDIO PLAYER
// =========================================================
const MusicPlayer = {
    audio: null,
    isPlaying: false,
    elements: {},

    init() {
        this.audio = new Audio(BIRTHDAY_CONFIG.song.audioSrc);
        this.audio.loop = true;
        this.audio.preload = 'auto';

        // Elements
        this.elements.stationCard = document.getElementById('song-station-card');
        this.elements.playBtn = document.getElementById('main-play-btn');
        this.elements.floatingBtn = document.getElementById('floating-play-btn');
        this.elements.floatingBar = document.getElementById('floating-music-bar');
        this.elements.vinyl = document.getElementById('vinyl-disc');
        this.elements.progressBar = document.getElementById('progress-bar-fill');
        this.elements.progressContainer = document.getElementById('progress-container');
        this.elements.currTime = document.getElementById('curr-time');
        this.elements.durTime = document.getElementById('dur-time');

        // Event listeners
        this.elements.playBtn.addEventListener('click', () => this.togglePlay());
        this.elements.floatingBtn.addEventListener('click', () => this.togglePlay());

        // Audio events
        this.audio.addEventListener('timeupdate', () => this.updateProgress());
        this.audio.addEventListener('loadedmetadata', () => {
            this.elements.durTime.textContent = this.formatTime(this.audio.duration || 0);
        });

        // Seek
        this.elements.progressContainer.addEventListener('click', (e) => {
            const rect = this.elements.progressContainer.getBoundingClientRect();
            const pos = (e.clientX - rect.left) / rect.width;
            if (this.audio.duration) {
                this.audio.currentTime = pos * this.audio.duration;
            }
        });
    },

    togglePlay() {
        AudioFX.init();
        if (this.isPlaying) {
            this.audio.pause();
            this.isPlaying = false;
            this.updateUI(false);
        } else {
            this.audio.play().then(() => {
                this.isPlaying = true;
                this.updateUI(true);
            }).catch(e => {
                console.log("Audio playback note:", e);
            });
        }
    },

    startAutoplay() {
        this.audio.play().then(() => {
            this.isPlaying = true;
            this.updateUI(true);
        }).catch(() => {
            console.log("Autoplay was prevented by browser policy.");
        });
    },

    updateUI(playing) {
        if (playing) {
            this.elements.playBtn.innerHTML = '❚❚';
            this.elements.floatingBtn.innerHTML = '❚❚';
            this.elements.stationCard.classList.add('playing');
            this.elements.floatingBar.classList.add('playing');
            this.elements.vinyl.classList.add('spinning');
        } else {
            this.elements.playBtn.innerHTML = '▶';
            this.elements.floatingBtn.innerHTML = '▶';
            this.elements.stationCard.classList.remove('playing');
            this.elements.floatingBar.classList.remove('playing');
            this.elements.vinyl.classList.remove('spinning');
        }
    },

    updateProgress() {
        if (!this.audio.duration) return;
        const pct = (this.audio.currentTime / this.audio.duration) * 100;
        this.elements.progressBar.style.width = `${pct}%`;
        this.elements.currTime.textContent = this.formatTime(this.audio.currentTime);
        if (!isNaN(this.audio.duration) && this.elements.durTime.textContent === '0:00') {
            this.elements.durTime.textContent = this.formatTime(this.audio.duration);
        }
    },

    formatTime(sec) {
        const m = Math.floor(sec / 60);
        const s = Math.floor(sec % 60);
        return `${m}:${s < 10 ? '0' : ''}${s}`;
    }
};

// =========================================================
// 🎂 CAKE & CANDLE BLOWING
// =========================================================
const CakeHandler = {
    blownOut: false,

    init() {
        const blowBtn = document.getElementById('btn-blow');
        const candlesGroup = document.getElementById('candles-group');

        blowBtn.addEventListener('click', () => this.blow());
        candlesGroup.addEventListener('click', () => this.blow());
    },

    blow() {
        if (this.blownOut) return;
        this.blownOut = true;

        AudioFX.playBlow();

        // Extinguish candles
        const candles = document.querySelectorAll('.candle');
        candles.forEach((c, idx) => {
            setTimeout(() => {
                c.classList.add('blown-out');
            }, idx * 120);
        });

        // Confetti explosion
        setTimeout(() => {
            AudioFX.playChime();
            const cakeRect = document.getElementById('cake-scene').getBoundingClientRect();
            ConfettiSystem.burst(cakeRect.left + cakeRect.width / 2, cakeRect.top + 60, 180);
            
            setTimeout(() => ConfettiSystem.burst(window.innerWidth * 0.25, window.innerHeight * 0.4, 100), 300);
            setTimeout(() => ConfettiSystem.burst(window.innerWidth * 0.75, window.innerHeight * 0.4, 100), 600);

            // Show post-blow celebration message
            document.getElementById('cake-instructions').style.display = 'none';
            const postMsg = document.getElementById('post-blow-msg');
            postMsg.style.display = 'block';
        }, 600);
    }
};

// =========================================================
// 💌 WAX-SEALED LOVE LETTER
// =========================================================
const LetterHandler = {
    opened: false,

    init() {
        const envelope = document.getElementById('envelope');
        const waxSeal = document.getElementById('wax-seal');
        const letterCard = document.getElementById('parchment-letter');

        const openEnvelope = () => {
            if (this.opened) return;
            this.opened = true;
            AudioFX.playChime();
            AudioFX.playPop();
            
            envelope.classList.add('opened');
            ConfettiSystem.burst(window.innerWidth / 2, window.innerHeight * 0.6, 70);
            
            setTimeout(() => {
                letterCard.classList.add('active');
                letterCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }, 800);
        };

        envelope.addEventListener('click', openEnvelope);
        waxSeal.addEventListener('click', (e) => {
            e.stopPropagation();
            openEnvelope();
        });
    }
};

// =========================================================
// 🫙 REASONS JAR
// =========================================================
const ReasonsHandler = {
    currentIndex: 0,
    shuffledReasons: [],

    init() {
        this.shuffledReasons = [...BIRTHDAY_CONFIG.reasons].sort(() => Math.random() - 0.5);
        const jar = document.getElementById('love-jar');
        const btnNext = document.getElementById('btn-next-reason');

        const drawReason = () => {
            AudioFX.playPop();
            this.currentIndex = (this.currentIndex + 1) % this.shuffledReasons.length;
            const textEl = document.getElementById('drawn-reason-text');
            const countEl = document.getElementById('reason-count');
            
            textEl.style.opacity = '0';
            textEl.style.transform = 'translateY(8px)';
            
            setTimeout(() => {
                textEl.textContent = `“${this.shuffledReasons[this.currentIndex]}”`;
                countEl.textContent = `Reason ${this.currentIndex + 1} of ${this.shuffledReasons.length}`;
                textEl.style.opacity = '1';
                textEl.style.transform = 'translateY(0)';
            }, 250);
        };

        jar.addEventListener('click', drawReason);
        btnNext.addEventListener('click', drawReason);
    }
};

// =========================================================
// 🎟️ COUPONS HANDLER
// =========================================================
const CouponsHandler = {
    init() {
        const container = document.getElementById('coupons-container');
        BIRTHDAY_CONFIG.coupons.forEach(c => {
            const ticket = document.createElement('div');
            ticket.className = 'coupon-ticket';
            ticket.innerHTML = `
                <div class="coupon-left">
                    <div class="coupon-icon">${c.icon}</div>
                    <div>
                        <div class="coupon-title">${c.title}</div>
                        <div class="coupon-desc">${c.description}</div>
                    </div>
                </div>
                <button class="btn-redeem" data-id="${c.id}">Redeem ✨</button>
                <div class="stamp-redeemed">REDEEMED ❤️</div>
            `;

            const btn = ticket.querySelector('.btn-redeem');
            btn.addEventListener('click', () => {
                if (!ticket.classList.contains('redeemed')) {
                    AudioFX.playPop();
                    AudioFX.playChime();
                    ticket.classList.add('redeemed');
                    btn.textContent = 'Claimed!';
                    const rect = ticket.getBoundingClientRect();
                    ConfettiSystem.burst(rect.left + rect.width / 2, rect.top + rect.height / 2, 40);
                }
            });

            container.appendChild(ticket);
        });
    }
};

// =========================================================
// ⏱️ DAYS / COUNTDOWN COUNTER
// =========================================================
function initCounter() {
    const now = new Date();
    const anniv = new Date(BIRTHDAY_CONFIG.anniversaryDate);
    const diffTime = Math.abs(now - anniv);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    document.getElementById('counter-days').textContent = diffDays;
}

// =========================================================
// 🎁 SURPRISE UNWRAP GATE INITIALIZATION
// =========================================================
function initSurpriseGate() {
    const unwrapBtn = document.getElementById('btn-unwrap');
    const giftBoxContainer = document.getElementById('gift-box-container');
    const surpriseGate = document.getElementById('surprise-gate');
    const mainApp = document.getElementById('main-app');

    const unwrap = () => {
        AudioFX.playChime();
        giftBoxContainer.classList.add('opening');
        
        // Confetti burst on opening
        const boxRect = giftBoxContainer.getBoundingClientRect();
        ConfettiSystem.burst(boxRect.left + boxRect.width / 2, boxRect.top + boxRect.height / 2, 140);
        
        setTimeout(() => {
            surpriseGate.classList.add('unlocked');
            mainApp.classList.add('active');
            
            // Autoplay romantic background song on user click gesture!
            MusicPlayer.startAutoplay();
        }, 900);
    };

    unwrapBtn.addEventListener('click', unwrap);
    giftBoxContainer.addEventListener('click', unwrap);
}

// =========================================================
// 🚀 POPULATE CONFIG DATA INTO HTML
// =========================================================
function populateConfigData() {
    // Surprise Gate
    document.getElementById('surprise-pretitle').textContent = BIRTHDAY_CONFIG.surprise.preTitle;
    document.getElementById('surprise-title').textContent = BIRTHDAY_CONFIG.surprise.title;
    document.getElementById('surprise-subtitle').textContent = BIRTHDAY_CONFIG.surprise.subtitle;
    document.getElementById('btn-unwrap-text').textContent = BIRTHDAY_CONFIG.surprise.buttonText;
    document.getElementById('surprise-hint').textContent = BIRTHDAY_CONFIG.surprise.hintText;

    // Hero Section & Spotlight
    document.getElementById('hero-tag').textContent = `Happy Birthday to My Favorite Person`;
    document.getElementById('hero-title').textContent = `Happy Birthday, ${BIRTHDAY_CONFIG.nickname}!`;
    if (BIRTHDAY_CONFIG.photo) {
        document.getElementById('hero-photo').src = BIRTHDAY_CONFIG.photo;
    }
    if (BIRTHDAY_CONFIG.photoCaption) {
        document.getElementById('hero-photo-caption').textContent = BIRTHDAY_CONFIG.photoCaption;
    }
    document.getElementById('hero-desc').textContent = `A tiny piece of the universe made with all my love, just for ${BIRTHDAY_CONFIG.nickname}.`;

    // Dedicated Song Section
    document.getElementById('song-title').textContent = BIRTHDAY_CONFIG.song.title;
    document.getElementById('song-artist').textContent = BIRTHDAY_CONFIG.song.artist;
    if (BIRTHDAY_CONFIG.song.albumCover) {
        document.getElementById('song-album-art').src = BIRTHDAY_CONFIG.song.albumCover;
    }
    document.getElementById('song-quote').textContent = BIRTHDAY_CONFIG.song.dedicationNote;
    document.getElementById('lyrics-highlight').textContent = BIRTHDAY_CONFIG.song.lyricsHighlight;
    document.getElementById('floating-song-title').textContent = `${BIRTHDAY_CONFIG.song.title} - ${BIRTHDAY_CONFIG.song.artist}`;

    // Cake Section
    document.getElementById('cake-tagline').textContent = BIRTHDAY_CONFIG.cake.tagline;
    document.getElementById('cake-title').textContent = BIRTHDAY_CONFIG.cake.title;
    document.getElementById('cake-instructions-text').textContent = BIRTHDAY_CONFIG.cake.instructions;
    document.getElementById('post-blow-title').textContent = BIRTHDAY_CONFIG.cake.postBlowTitle;
    document.getElementById('post-blow-text').textContent = BIRTHDAY_CONFIG.cake.postBlowMessage;

    // Love Letter
    document.getElementById('letter-salutation').textContent = BIRTHDAY_CONFIG.letter.salutation;
    const letterBody = document.getElementById('letter-body');
    letterBody.innerHTML = '';
    BIRTHDAY_CONFIG.letter.paragraphs.forEach(pText => {
        const p = document.createElement('p');
        p.textContent = pText;
        letterBody.appendChild(p);
    });
    document.getElementById('letter-signature').textContent = BIRTHDAY_CONFIG.letter.signature;

    // Initial Reason in Jar
    document.getElementById('drawn-reason-text').textContent = `“${BIRTHDAY_CONFIG.reasons[0]}”`;
    document.getElementById('reason-count').textContent = `Reason 1 of ${BIRTHDAY_CONFIG.reasons.length}`;
}

// =========================================================
// 🌟 APP INITIALIZATION
// =========================================================
document.addEventListener('DOMContentLoaded', () => {
    populateConfigData();
    BackgroundCanvas.init();
    ConfettiSystem.init();
    MusicPlayer.init();
    CakeHandler.init();
    LetterHandler.init();
    ReasonsHandler.init();
    CouponsHandler.init();
    initCounter();
    initSurpriseGate();
});
