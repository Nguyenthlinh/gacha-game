// Web Audio API Sound Engine - Không cần file âm thanh
const SoundEngine = (() => {
    let ctx = null;

    function getCtx() {
        if (!ctx) ctx = new (window.AudioContext || window.webkitAudioContext)();
        if (ctx.state === 'suspended') ctx.resume();
        return ctx;
    }

    function note(freq, type, t, dur, vol = 0.3, c = getCtx()) {
        const osc = c.createOscillator();
        const gain = c.createGain();
        osc.connect(gain); gain.connect(c.destination);
        osc.type = type; osc.frequency.value = freq;
        gain.gain.setValueAtTime(0, t);
        gain.gain.linearRampToValueAtTime(vol, t + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, t + dur);
        osc.start(t); osc.stop(t + dur);
    }

    return {
        tick() {
            const c = getCtx();
            note(700, 'square', c.currentTime, 0.04, 0.12, c);
        },

        spinUp() {
            const c = getCtx();
            const osc = c.createOscillator();
            const gain = c.createGain();
            osc.connect(gain); gain.connect(c.destination);
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(100, c.currentTime);
            osc.frequency.exponentialRampToValueAtTime(600, c.currentTime + 1.2);
            gain.gain.setValueAtTime(0.15, c.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 1.3);
            osc.start(c.currentTime); osc.stop(c.currentTime + 1.3);
        },

        win() {
            const c = getCtx();
            [[523,0],[659,0.15],[784,0.3],[1047,0.45]].forEach(([f,t]) =>
                note(f, 'triangle', c.currentTime + t, 0.3, 0.4, c));
        },

        vipWin() {
            const c = getCtx();
            [[392,0],[523,0.1],[659,0.2],[784,0.3],[1047,0.4],[1319,0.55]].forEach(([f,t]) =>
                note(f, 'triangle', c.currentTime + t, 0.4, 0.5, c));
            note(130, 'sawtooth', c.currentTime, 0.8, 0.2, c);
        },

        cardFlip() {
            const c = getCtx();
            const size = Math.floor(c.sampleRate * 0.1);
            const buf = c.createBuffer(1, size, c.sampleRate);
            const d = buf.getChannelData(0);
            for (let i = 0; i < size; i++) d[i] = (Math.random() * 2 - 1) * Math.exp(-i / (size * 0.25));
            const src = c.createBufferSource(); src.buffer = buf;
            const fil = c.createBiquadFilter(); fil.type = 'bandpass'; fil.frequency.value = 1200;
            const gain = c.createGain();
            gain.gain.setValueAtTime(0.6, c.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 0.12);
            src.connect(fil); fil.connect(gain); gain.connect(c.destination);
            src.start(); src.stop(c.currentTime + 0.12);
        },

        cardReveal() {
            const c = getCtx();
            note(880, 'sine', c.currentTime, 0.15, 0.35, c);
            note(1100, 'sine', c.currentTime + 0.1, 0.2, 0.3, c);
        },

        regret() {
            const c = getCtx();
            note(400, 'triangle', c.currentTime, 0.2, 0.3, c);
            note(300, 'triangle', c.currentTime + 0.2, 0.3, 0.25, c);
        }
    };
})();
