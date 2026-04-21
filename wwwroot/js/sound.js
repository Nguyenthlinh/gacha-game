// Web Audio API Sound Engine v2 - Vui tai hơn!
const SoundEngine = (() => {
    let ctx = null;

    function getCtx() {
        if (!ctx) ctx = new (window.AudioContext || window.webkitAudioContext)();
        if (ctx.state === 'suspended') ctx.resume();
        return ctx;
    }

    // Tạo 1 nốt nhạc cơ bản
    function note(freq, type, startT, dur, vol = 0.4, c = null) {
        if (!c) c = getCtx();
        const osc = c.createOscillator();
        const gain = c.createGain();
        osc.connect(gain); gain.connect(c.destination);
        osc.type = type; osc.frequency.value = freq;
        gain.gain.setValueAtTime(0, startT);
        gain.gain.linearRampToValueAtTime(vol, startT + 0.015);
        gain.gain.exponentialRampToValueAtTime(0.001, startT + dur);
        osc.start(startT); osc.stop(startT + dur + 0.01);
    }

    return {

        // 🟡 Gacha tick: tiếng "pop!" bong bóng vui tai
        tick() {
            const c = getCtx();
            const osc = c.createOscillator();
            const gain = c.createGain();
            osc.connect(gain); gain.connect(c.destination);
            osc.type = 'sine';
            osc.frequency.setValueAtTime(1200, c.currentTime);
            osc.frequency.exponentialRampToValueAtTime(350, c.currentTime + 0.07);
            gain.gain.setValueAtTime(0.45, c.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 0.09);
            osc.start(c.currentTime); osc.stop(c.currentTime + 0.1);
        },

        // 🔴 Gacha spin up: tiếng whirl tăng dần hào hứng
        spinUp() {
            const c = getCtx();
            const osc = c.createOscillator();
            const gain = c.createGain();
            osc.connect(gain); gain.connect(c.destination);
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(80, c.currentTime);
            osc.frequency.exponentialRampToValueAtTime(700, c.currentTime + 1.0);
            gain.gain.setValueAtTime(0.0, c.currentTime);
            gain.gain.linearRampToValueAtTime(0.18, c.currentTime + 0.1);
            gain.gain.setValueAtTime(0.18, c.currentTime + 0.85);
            gain.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 1.2);
            osc.start(c.currentTime); osc.stop(c.currentTime + 1.25);
        },

        // 🃏 Lật thẻ: tiếng "fwip!" rất giống lật bài thật
        cardFlip() {
            const c = getCtx();
            // Phần tiếng swoosh
            const osc = c.createOscillator();
            const gain = c.createGain();
            osc.connect(gain); gain.connect(c.destination);
            osc.type = 'sine';
            osc.frequency.setValueAtTime(200, c.currentTime);
            osc.frequency.exponentialRampToValueAtTime(1000, c.currentTime + 0.04);
            osc.frequency.exponentialRampToValueAtTime(180, c.currentTime + 0.13);
            gain.gain.setValueAtTime(0.35, c.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 0.16);
            osc.start(c.currentTime); osc.stop(c.currentTime + 0.18);

            // Thêm lớp tiếng "phật" nhẹ
            const osc2 = c.createOscillator();
            const gain2 = c.createGain();
            const filter = c.createBiquadFilter();
            filter.type = 'bandpass'; filter.frequency.value = 800; filter.Q.value = 1.5;
            osc2.connect(filter); filter.connect(gain2); gain2.connect(c.destination);
            osc2.type = 'sawtooth'; osc2.frequency.value = 220;
            gain2.gain.setValueAtTime(0.2, c.currentTime);
            gain2.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 0.12);
            osc2.start(c.currentTime); osc2.stop(c.currentTime + 0.14);
        },

        // ✨ Lật thẻ xịn: tiếng chuông "ting!" sáng trong
        cardReveal() {
            const c = getCtx();
            // Chuông ting chính
            const osc = c.createOscillator();
            const gain = c.createGain();
            osc.connect(gain); gain.connect(c.destination);
            osc.type = 'sine'; osc.frequency.value = 1567; // G6
            gain.gain.setValueAtTime(0, c.currentTime);
            gain.gain.linearRampToValueAtTime(0.5, c.currentTime + 0.01);
            gain.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 0.5);
            osc.start(c.currentTime); osc.stop(c.currentTime + 0.55);

            // Hài âm bên dưới (1/2)
            const osc2 = c.createOscillator();
            const gain2 = c.createGain();
            osc2.connect(gain2); gain2.connect(c.destination);
            osc2.type = 'sine'; osc2.frequency.value = 784; // G5
            gain2.gain.setValueAtTime(0, c.currentTime);
            gain2.gain.linearRampToValueAtTime(0.25, c.currentTime + 0.01);
            gain2.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 0.4);
            osc2.start(c.currentTime); osc2.stop(c.currentTime + 0.45);
        },

        // 🎉 Thắng thường: 3 nốt nhạc vui (Do-Mi-Sol)
        win() {
            const c = getCtx();
            // E5 - G5 - C6: Vui, sáng, ngắn gọn
            [
                [659, 0, 0.3],   // E5
                [784, 0.13, 0.3], // G5
                [1047, 0.26, 0.5], // C6
            ].forEach(([f, t, d]) => note(f, 'triangle', c.currentTime + t, d, 0.45, c));
        },

        // 👑 VIP thắng: fanfare 8-bit hào hứng kiểu game
        vipWin() {
            const c = getCtx();
            // Arpeggio lên - giống Mario star nhưng vui hơn
            const melody = [
                [523, 0.00, 0.15],  // C5
                [659, 0.10, 0.15],  // E5
                [784, 0.20, 0.15],  // G5
                [1047, 0.30, 0.2],  // C6
                [784, 0.42, 0.12],  // G5
                [1047, 0.52, 0.12], // C6
                [1319, 0.62, 0.5],  // E6
            ];
            melody.forEach(([f, t, d]) => note(f, 'square', c.currentTime + t, d, 0.35, c));
            // Bass thấp
            note(131, 'sawtooth', c.currentTime, 0.4, 0.18, c);
            note(165, 'sawtooth', c.currentTime + 0.3, 0.4, 0.18, c);
            // Thêm tiếng chuông ở cuối
            note(2093, 'sine', c.currentTime + 0.65, 0.6, 0.3, c); // C7
        },

        // 😭 Tiếc nuối: "Wah wah wah" kiểu trombone xuống
        regret() {
            const c = getCtx();
            // Ba bước xuống: Sol → Fa → Re
            [
                [392, 0.00],  // G4
                [349, 0.28],  // F4
                [294, 0.56],  // D4
            ].forEach(([startF, t]) => {
                const osc = c.createOscillator();
                const gain = c.createGain();
                const filter = c.createBiquadFilter();
                filter.type = 'lowpass'; filter.frequency.value = 800;
                osc.connect(filter); filter.connect(gain); gain.connect(c.destination);
                osc.type = 'sawtooth';
                osc.frequency.setValueAtTime(startF * 1.06, c.currentTime + t);
                osc.frequency.exponentialRampToValueAtTime(startF * 0.9, c.currentTime + t + 0.22);
                gain.gain.setValueAtTime(0, c.currentTime + t);
                gain.gain.linearRampToValueAtTime(0.3, c.currentTime + t + 0.04);
                gain.gain.exponentialRampToValueAtTime(0.001, c.currentTime + t + 0.24);
                osc.start(c.currentTime + t); osc.stop(c.currentTime + t + 0.28);
            });
        }
    };
})();

// ============================================================
// 🎵 Nhạc nền (Background Music) - Dùng cho trang Lật Thẻ
// ============================================================
const BgMusic = (() => {
    let ctx = null;
    let masterGain = null;
    let isPlaying = false;
    let scheduleTimeout = null;
    let nextNoteTime = 0;
    let noteIndex = 0;

    // Giai điệu vui tươi 16 nốt - C major
    // [freq_melody, freq_bass, duration_s]
    const MELODY = [
        [659, 262, 0.25],  // E5 / C4
        [784, 262, 0.25],  // G5 / C4
        [880, 330, 0.25],  // A5 / E4
        [784, 330, 0.25],  // G5 / E4
        [659, 392, 0.25],  // E5 / G4
        [523, 392, 0.25],  // C5 / G4
        [587, 349, 0.25],  // D5 / F4
        [659, 349, 0.5 ],  // E5 / F4 (dài hơn)
        [784, 392, 0.25],  // G5 / G4
        [659, 392, 0.25],  // E5 / G4
        [523, 330, 0.25],  // C5 / E4
        [440, 330, 0.25],  // A4 / E4
        [523, 262, 0.25],  // C5 / C4
        [659, 262, 0.25],  // E5 / C4
        [587, 294, 0.25],  // D5 / D4
        [523, 262, 0.5 ],  // C5 / C4 (dài hơn)
    ];

    const LOOK_AHEAD = 0.1;
    const SCHEDULE_INTERVAL = 80;

    function getCtx() {
        if (!ctx) {
            ctx = new (window.AudioContext || window.webkitAudioContext)();
            masterGain = ctx.createGain();
            masterGain.gain.value = 0.07; // Rất nhẹ, không lấn át SFX
            masterGain.connect(ctx.destination);
        }
        if (ctx.state === 'suspended') ctx.resume();
        return ctx;
    }

    function scheduleNote(freq, bassFreq, dur, time) {
        const c = getCtx();

        // Melody - sine wave nhẹ nhàng
        const mel = c.createOscillator();
        const melGain = c.createGain();
        mel.connect(melGain); melGain.connect(masterGain);
        mel.type = 'triangle'; mel.frequency.value = freq;
        melGain.gain.setValueAtTime(0, time);
        melGain.gain.linearRampToValueAtTime(1.0, time + 0.02);
        melGain.gain.setValueAtTime(1.0, time + dur * 0.7);
        melGain.gain.exponentialRampToValueAtTime(0.001, time + dur);
        mel.start(time); mel.stop(time + dur + 0.01);

        // Bass - sine wave nền
        const bass = c.createOscillator();
        const bassGain = c.createGain();
        bass.connect(bassGain); bassGain.connect(masterGain);
        bass.type = 'sine'; bass.frequency.value = bassFreq;
        bassGain.gain.setValueAtTime(0.5, time);
        bassGain.gain.exponentialRampToValueAtTime(0.001, time + dur * 0.8);
        bass.start(time); bass.stop(time + dur + 0.01);
    }

    function scheduler() {
        if (!isPlaying) return;
        const c = getCtx();

        while (nextNoteTime < c.currentTime + LOOK_AHEAD) {
            const [freq, bass, dur] = MELODY[noteIndex % MELODY.length];
            scheduleNote(freq, bass, dur, nextNoteTime);
            nextNoteTime += dur;
            noteIndex++;
        }
        scheduleTimeout = setTimeout(scheduler, SCHEDULE_INTERVAL);
    }

    return {
        start() {
            if (isPlaying) return;
            isPlaying = true;
            const c = getCtx();
            nextNoteTime = c.currentTime + 0.1;
            noteIndex = 0;
            scheduler();
        },

        stop() {
            isPlaying = false;
            clearTimeout(scheduleTimeout);
        },

        toggle() {
            if (isPlaying) { this.stop(); return false; }
            else { this.start(); return true; }
        },

        setVolume(v) {
            if (masterGain) masterGain.gain.value = v;
        },

        isActive() { return isPlaying; }
    };
})();

