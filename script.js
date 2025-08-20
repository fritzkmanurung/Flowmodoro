class PomodoroTimer {
    constructor() {
        this.workTime = 25;
        this.breakTime = 5;
        this.longBreakTime = 15;
        this.currentSession = 1;
        this.totalSessions = 4;
        this.completedSessions = 0;
        this.totalTimeSpent = 0;
        this.timeLeft = this.workTime * 60;
        this.originalTime = this.workTime * 60;
        this.isRunning = false;
        this.isWork = true;
        this.timerInterval = null;
        this.soundEnabled = true;
        this.musicEnabled = true;
        this.audioContext = null;
        this.backgroundMusic = null;
        
        this.initElements();
        this.initParticles();
        this.initAudio();
        this.updateDisplay();
        this.updateProgressRing();
        this.requestNotificationPermission();
    }

    initElements() {
        this.timerDisplay = document.getElementById('timer');
        this.statusDisplay = document.getElementById('status');
        this.startBtn = document.getElementById('start-btn');
        this.pauseBtn = document.getElementById('pause-btn');
        this.progressCircle = document.getElementById('progress-circle');
        this.currentSessionDisplay = document.getElementById('current-session');
        this.sessionDots = document.getElementById('session-dots');
        this.soundToggle = document.getElementById('sound-toggle');
        this.musicToggle = document.getElementById('music-toggle');
        this.completedSessionsDisplay = document.getElementById('completed-sessions');
        this.totalTimeDisplay = document.getElementById('total-time');
        this.visualizer = document.getElementById('visualizer');
    }

    initParticles() {
        const particlesContainer = document.getElementById('particles');
        const particleTypes = ['leaf', 'pollen', 'bubble'];
        
        for (let i = 0; i < 30; i++) {
            const particle = document.createElement('div');
            const type = particleTypes[Math.floor(Math.random() * particleTypes.length)];
            particle.className = `particle ${type}`;
            particle.style.left = Math.random() * 100 + '%';
            particle.style.top = Math.random() * 100 + '%';
            particle.style.animationDelay = Math.random() * 10 + 's';
            particle.style.animationDuration = (Math.random() * 5 + 8) + 's';
            particlesContainer.appendChild(particle);
        }
    }

    async initAudio() {
        try {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            await this.createBackgroundMusic();
            this.startBackgroundMusic();
        } catch (error) {
            console.log('Audio initialization failed:', error);
        }
    }

    async createBackgroundMusic() {
        if (!this.audioContext) return;

        // Create a more complex ambient sound
        const createOscillator = (freq, type = 'sine', gain = 0.1) => {
            const osc = this.audioContext.createOscillator();
            const gainNode = this.audioContext.createGain();
            
            osc.type = type;
            osc.frequency.setValueAtTime(freq, this.audioContext.currentTime);
            gainNode.gain.setValueAtTime(gain, this.audioContext.currentTime);
            
            osc.connect(gainNode);
            return { osc, gainNode };
        };

        // Create ambient nature sounds
        const sounds = [
            createOscillator(220, 'sine', 0.03), // Base drone
            createOscillator(440, 'triangle', 0.02), // Harmonic
            createOscillator(880, 'sine', 0.01), // High harmonic
        ];

        // Connect to destination and add some effects
        const masterGain = this.audioContext.createGain();
        masterGain.gain.setValueAtTime(0.3, this.audioContext.currentTime);
        masterGain.connect(this.audioContext.destination);

        sounds.forEach(({ osc, gainNode }) => {
            gainNode.connect(masterGain);
            osc.start();
            
            // Add some variation
            const lfo = this.audioContext.createOscillator();
            const lfoGain = this.audioContext.createGain();
            lfo.frequency.setValueAtTime(0.1, this.audioContext.currentTime);
            lfoGain.gain.setValueAtTime(0.01, this.audioContext.currentTime);
            lfo.connect(lfoGain);
            lfoGain.connect(gainNode.gain);
            lfo.start();
        });

        this.backgroundMusic = { sounds, masterGain };
    }

    startBackgroundMusic() {
        if (this.backgroundMusic && this.musicEnabled) {
            this.backgroundMusic.masterGain.gain.setValueAtTime(0.3, this.audioContext.currentTime);
            this.visualizer.style.display = 'flex';
        }
    }

    stopBackgroundMusic() {
        if (this.backgroundMusic) {
            this.backgroundMusic.masterGain.gain.setValueAtTime(0, this.audioContext.currentTime);
            this.visualizer.style.display = 'none';
        }
    }

    updateDisplay() {
        const minutes = String(Math.floor(this.timeLeft / 60)).padStart(2, '0');
        const seconds = String(this.timeLeft % 60).padStart(2, '0');
        this.timerDisplay.textContent = `${minutes}:${seconds}`;
        
        // Update page title
        document.title = `${minutes}:${seconds} - ${this.isWork ? 'Focus' : 'Break'} Time`;
    }

    updateProgressRing() {
        const circumference = 2 * Math.PI * 130;
        const progress = (this.originalTime - this.timeLeft) / this.originalTime;
        const offset = circumference - (progress * circumference);
        this.progressCircle.style.strokeDashoffset = offset;
    }

    updateTheme() {
        const body = document.body;
        body.className = '';
        
        if (this.isWork) {
            body.classList.add('theme-work');
            this.statusDisplay.textContent = 'Focus Time';
        } else if (this.currentSession === this.totalSessions && !this.isWork) {
            body.classList.add('theme-long-break');
            this.statusDisplay.textContent = 'Long Break';
        } else {
            body.classList.add('theme-break');
            this.statusDisplay.textContent = 'Short Break';
        }
    }

    updateSessionDisplay() {
        this.currentSessionDisplay.textContent = this.currentSession;
        const dots = this.sessionDots.querySelectorAll('.session-dot');
        dots.forEach((dot, index) => {
            dot.classList.toggle('completed', index < this.completedSessions);
        });
    }

    updateStats() {
        this.completedSessionsDisplay.textContent = this.completedSessions;
        const hours = Math.floor(this.totalTimeSpent / 3600);
        const minutes = Math.floor((this.totalTimeSpent % 3600) / 60);
        this.totalTimeDisplay.textContent = `${hours}h ${minutes}m`;
    }

    playNotificationSound() {
        if (!this.soundEnabled || !this.audioContext) return;
        
        // Create a pleasant notification sound
        const osc1 = this.audioContext.createOscillator();
        const osc2 = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();
        
        osc1.connect(gainNode);
        osc2.connect(gainNode);
        gainNode.connect(this.audioContext.destination);
        
        // Create a chord
        osc1.frequency.setValueAtTime(523.25, this.audioContext.currentTime); // C5
        osc2.frequency.setValueAtTime(659.25, this.audioContext.currentTime); // E5
        
        gainNode.gain.setValueAtTime(0, this.audioContext.currentTime);
        gainNode.gain.linearRampToValueAtTime(0.2, this.audioContext.currentTime + 0.1);
        gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 1);
        
        osc1.start(this.audioContext.currentTime);
        osc2.start(this.audioContext.currentTime);
        osc1.stop(this.audioContext.currentTime + 1);
        osc2.stop(this.audioContext.currentTime + 1);
    }

    requestNotificationPermission() {
        if ('Notification' in window && Notification.permission !== 'granted') {
            Notification.requestPermission();
        }
    }

    showNotification(title, body) {
        if ('Notification' in window && Notification.permission === 'granted') {
            new Notification(title, {
                body,
                icon: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="50" r="45" fill="%23ff6b6b"/></svg>',
                requireInteraction: false
            });
        }
    }

    start() {
        if (!this.isRunning) {
            // Resume audio context if needed
            if (this.audioContext && this.audioContext.state === 'suspended') {
                this.audioContext.resume();
            }
            
            this.isRunning = true;
            this.startBtn.style.display = 'none';
            this.pauseBtn.style.display = 'inline-block';
            
            this.timerInterval = setInterval(() => {
                if (this.timeLeft > 0) {
                    this.timeLeft--;
                    this.totalTimeSpent++;
                    this.updateDisplay();
                    this.updateProgressRing();
                } else {
                    this.complete();
                }
            }, 1000);
        }
    }

    pause() {
        if (this.isRunning) {
            clearInterval(this.timerInterval);
            this.isRunning = false;
            this.startBtn.style.display = 'inline-block';
            this.pauseBtn.style.display = 'none';
            this.startBtn.textContent = 'Resume';
        }
    }

    reset() {
        clearInterval(this.timerInterval);
        this.isRunning = false;
        this.isWork = true;
        this.currentSession = 1;
        this.timeLeft = this.workTime * 60;
        this.originalTime = this.workTime * 60;
        this.startBtn.style.display = 'inline-block';
        this.pauseBtn.style.display = 'none';
        this.startBtn.textContent = 'Start';
        this.updateDisplay();
        this.updateProgressRing();
        this.updateTheme();
        this.updateSessionDisplay();
        document.title = 'Enhanced Pomodoro Timer';
    }

    complete() {
        clearInterval(this.timerInterval);
        this.isRunning = false;
        this.playNotificationSound();
        this.timerDisplay.classList.add('pulse');
        
        setTimeout(() => {
            this.timerDisplay.classList.remove('pulse');
        }, 1000);

        if (this.isWork) {
            this.completedSessions++;
            
            if (this.currentSession === this.totalSessions) {
                // Long break
                this.timeLeft = this.longBreakTime * 60;
                this.showNotification('Long Break Time! 🌿', `Great work! Take a ${this.longBreakTime}-minute long break.`);
                this.currentSession = 1;
            } else {
                // Short break
                this.timeLeft = this.breakTime * 60;
                this.showNotification('Break Time! 🌸', `Take a ${this.breakTime}-minute break.`);
                this.currentSession++;
            }
            this.isWork = false;
        } else {
            // Back to work
            this.timeLeft = this.workTime * 60;
            this.showNotification('Focus Time! 🎯', `Start your ${this.workTime}-minute work session!`);
            this.isWork = true;
        }

        this.originalTime = this.timeLeft;
        this.updateDisplay();
        this.updateProgressRing();
        this.updateTheme();
        this.updateSessionDisplay();
        this.updateStats();
        
        // Auto-start next session after 2 seconds
        setTimeout(() => this.start(), 2000);
    }

    adjustTime(type, delta) {
        if (this.isRunning) return;

        switch (type) {
            case 'work':
                this.workTime = Math.max(1, Math.min(60, this.workTime + delta));
                document.getElementById('work-time').textContent = this.workTime;
                if (this.isWork) {
                    this.timeLeft = this.workTime * 60;
                    this.originalTime = this.workTime * 60;
                    this.updateDisplay();
                    this.updateProgressRing();
                }
                break;
            case 'break':
                this.breakTime = Math.max(1, Math.min(30, this.breakTime + delta));
                document.getElementById('break-time').textContent = this.breakTime;
                break;
            case 'longBreak':
                this.longBreakTime = Math.max(1, Math.min(60, this.longBreakTime + delta));
                document.getElementById('long-break-time').textContent = this.longBreakTime;
                break;
        }
    }

    toggleSound() {
        this.soundEnabled = !this.soundEnabled;
        this.soundToggle.textContent = this.soundEnabled ? '🔔' : '🔕';
        this.soundToggle.title = this.soundEnabled ? 'Disable Notifications' : 'Enable Notifications';
    }

    toggleMusic() {
        this.musicEnabled = !this.musicEnabled;
        this.musicToggle.textContent = this.musicEnabled ? '🎵' : '🔇';
        this.musicToggle.title = this.musicEnabled ? 'Disable Background Music' : 'Enable Background Music';
        
        if (this.musicEnabled) {
            this.startBackgroundMusic();
        } else {
            this.stopBackgroundMusic();
        }
    }
}

// Initialize timer
const timer = new PomodoroTimer();

// Global functions
function startTimer() { 
    // Handle first user interaction for audio
    if (timer.audioContext && timer.audioContext.state === 'suspended') {
        timer.audioContext.resume();
    }
    timer.start(); 
}
function pauseTimer() { timer.pause(); }
function resetTimer() { timer.reset(); }
function adjustTime(type, delta) { timer.adjustTime(type, delta); }

// Event listeners
document.getElementById('sound-toggle').addEventListener('click', () => timer.toggleSound());
document.getElementById('music-toggle').addEventListener('click', () => timer.toggleMusic());

// Keyboard shortcuts
document.addEventListener('keydown', (e) => {
    if (e.target.tagName === 'INPUT') return;
    
    switch (e.key.toLowerCase()) {
        case ' ':
        case 's':
            e.preventDefault();
            timer.isRunning ? timer.pause() : startTimer();
            break;
        case 'r':
            e.preventDefault();
            timer.reset();
            break;
        case 'n':
            e.preventDefault();
            timer.toggleSound();
            break;
        case 'm':
            e.preventDefault();
            timer.toggleMusic();
            break;
    }
});

// Prevent space bar scrolling
document.addEventListener('keypress', (e) => {
    if (e.key === ' ' && e.target === document.body) {
        e.preventDefault();
    }
});

// Handle page visibility for audio context
document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
        if (timer.audioContext && timer.audioContext.state === 'running') {
            timer.audioContext.suspend();
        }
    } else {
        if (timer.audioContext && timer.audioContext.state === 'suspended' && timer.musicEnabled) {
            timer.audioContext.resume();
        }
    }
});

// Auto-start background music when page loads (after user interaction)
document.addEventListener('click', () => {
    if (timer.audioContext && timer.audioContext.state === 'suspended') {
        timer.audioContext.resume();
    }
}, { once: true });
