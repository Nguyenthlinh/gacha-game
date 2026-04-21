let isRolling = false;
let currentRewardName = '';
let allRewards = [];

async function loadRewardsList() {
    try {
        const res = await fetch('/api/gacha/rewards');
        if (res.ok) allRewards = (await res.json()).filter(r => r.quantity > 0);
    } catch(e) { console.error(e); }
}

document.addEventListener('DOMContentLoaded', loadRewardsList);

async function rollGacha() {
    if (isRolling) return;
    isRolling = true;

    const machine = document.getElementById('gachaMachine');
    const idle = document.getElementById('idleState');
    const result = document.getElementById('rewardResult');
    const slot = document.getElementById('gachaSlot');
    const slotText = document.getElementById('gachaSlotText');
    const rollBtn = document.getElementById('rollBtn');
    const sparkles = document.getElementById('sparkleRing');

    idle.classList.add('hidden');
    result.classList.add('hidden');
    slot.classList.remove('hidden');
    sparkles.classList.remove('hidden');
    machine.classList.add('machine-spinning');
    rollBtn.disabled = true;
    rollBtn.querySelector('.btn-text').innerText = '😵‍💫 ĐANG QUAY...';

    SoundEngine.spinUp();

    // Danh sách tên để slot hiện
    const names = allRewards.length > 0
        ? allRewards.map(r => r.name)
        : ['🎁 Bí Ẩn', '🏆 Giải thưởng', '⭐ Phần quà'];

    let interval;
    let speed = 60;

    function startSpin() {
        clearInterval(interval);
        interval = setInterval(() => {
            slotText.style.opacity = '0';
            slotText.style.transform = 'translateY(-8px)';
            setTimeout(() => {
                slotText.innerText = names[Math.floor(Math.random() * names.length)];
                slotText.style.opacity = '1';
                slotText.style.transform = 'translateY(0)';
            }, speed * 0.4);
            SoundEngine.tick();
        }, speed);
    }

    startSpin();
    setTimeout(() => { clearInterval(interval); speed = 130; startSpin(); }, 500);
    setTimeout(() => { clearInterval(interval); speed = 260; startSpin(); }, 950);

    // Gọi API song song với animation
    let reward = null;
    try {
        const res = await fetch('/api/gacha/roll', { method: 'POST' });
        if (!res.ok) {
            alert("Chưa có món quà nào! Hãy thêm quà từ trang chủ.");
            clearInterval(interval);
            resetMachine();
            return;
        }
        reward = await res.json();
    } catch(e) {
        clearInterval(interval);
        resetMachine();
        return;
    }

    // Dừng và reveal sau tổng 1.5s
    setTimeout(() => {
        clearInterval(interval);
        let count = 0;
        const finalInterval = setInterval(() => {
            slotText.innerText = names[Math.floor(Math.random() * names.length)];
            SoundEngine.tick();
            count++;
            if (count >= 5) {
                clearInterval(finalInterval);
                revealResult(reward);
            }
        }, 160);
    }, 1400);
}

function revealResult(reward) {
    const machine = document.getElementById('gachaMachine');
    const slot = document.getElementById('gachaSlot');
    const result = document.getElementById('rewardResult');
    const nameEl = document.getElementById('rewardName');

    slot.classList.add('hidden');
    machine.classList.remove('machine-spinning');
    machine.classList.add('machine-reveal');

    currentRewardName = reward.name;

    const isVip = reward.groupId >= 5;
    const isRare = reward.groupId >= 4;

    if (isVip) {
        nameEl.className = 'reward-name-vip reward-name-pop';
        nameEl.innerHTML = `<div style="font-size:1.8rem">👑</div>${reward.name}<br><span class="badge bg-danger mt-1">VIP Pro Max!</span>`;
        SoundEngine.vipWin();
    } else if (isRare) {
        nameEl.className = 'reward-name-rare reward-name-pop';
        nameEl.innerHTML = `<div style="font-size:1.8rem">🌟</div>${reward.name}<br><span class="badge bg-warning text-dark mt-1">Xịn Xò!</span>`;
        SoundEngine.win();
    } else {
        nameEl.className = 'reward-name-normal reward-name-pop';
        nameEl.innerHTML = reward.name;
        SoundEngine.win();
    }

    result.classList.remove('hidden');
    document.getElementById('rollBtn').classList.add('hidden');
    document.getElementById('confirmPanel').classList.remove('hidden');

    fireConfetti(isVip);
    isRolling = false;

    setTimeout(() => machine.classList.remove('machine-reveal'), 1000);
}

function resetMachine() {
    document.getElementById('gachaMachine').classList.remove('machine-spinning', 'machine-reveal');
    document.getElementById('gachaFx').classList.add('hidden');
    document.getElementById('gachaSlot').classList.add('hidden');
    document.getElementById('idleState').classList.remove('hidden');
    document.getElementById('rewardResult').classList.add('hidden');
    document.getElementById('sparkleRing').classList.add('hidden');
    document.getElementById('confirmPanel').classList.add('hidden');

    const btn = document.getElementById('rollBtn');
    btn.disabled = false;
    btn.classList.remove('hidden');
    btn.querySelector('.btn-text').innerText = 'QUAY LẦN NỮA';
    isRolling = false;
    loadRewardsList(); // Cập nhật lại danh sách
}

async function acceptReward(source) {
    try {
        await fetch('/api/history', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ RewardName: currentRewardName, Source: source })
        });
    } catch(e) { console.error(e); }
    resetMachine();
}

function declineReward() { resetMachine(); }

function fireConfetti(isVip = false) {
    const duration = isVip ? 5000 : 2500;
    const end = Date.now() + duration;
    const cfg = { startVelocity: isVip ? 45 : 30, spread: 360, ticks: isVip ? 100 : 60, zIndex: 999 };
    if (isVip) cfg.colors = ['#FFD700','#FF6B6B','#4ECDC4','#45B7D1','#fff'];

    const iv = setInterval(() => {
        if (Date.now() > end) return clearInterval(iv);
        const pc = 55 * ((end - Date.now()) / duration);
        confetti({ ...cfg, particleCount: pc, origin: { x: Math.random() * 0.6 + 0.2, y: Math.random() - 0.2 } });
        if (isVip) {
            confetti({ ...cfg, particleCount: pc, origin: { x: 0.1, y: 0.3 } });
            confetti({ ...cfg, particleCount: pc, origin: { x: 0.9, y: 0.3 } });
        }
    }, 250);
}
