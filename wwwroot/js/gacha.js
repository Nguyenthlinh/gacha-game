let isRolling = false;
let currentRewardName = "";

async function rollGacha() {
    if(isRolling) return;
    isRolling = true;
    
    const machine = document.getElementById('gachaMachine');
    const idleState = document.getElementById('idleState');
    const resultState = document.getElementById('rewardResult');
    const rollBtn = document.getElementById('rollBtn');
    const fx = document.getElementById('gachaFx');
    const fxItem = document.getElementById('gachaItemFx');

    resultState.classList.add('hidden');
    idleState.classList.add('hidden');
    
    fx.classList.remove('hidden');
    fxItem.classList.remove('hidden');
    
    machine.classList.add('shake');
    rollBtn.innerText = "ĐANG LẮC...";

    try {
        const res = await fetch('/api/gacha/roll', { method: 'POST' });
        
        if (!res.ok) {
            alert("Chưa có món quà nào! Hãy quay lại trang chủ để thêm quà.");
            resetMachine();
            return;
        }

        const reward = await res.json();

        setTimeout(() => {
            machine.classList.remove('shake');
            fx.classList.add('hidden');
            fxItem.classList.add('hidden');
            
            const isRare = reward.dropRate <= 10;
            const nameEl = document.getElementById('rewardName');
            currentRewardName = reward.name;
            nameEl.innerText = reward.name;
            if (isRare) {
                nameEl.className = 'text-danger rare-pulse p-2 rounded';
                nameEl.innerText = `🌟 ${reward.name} 🌟\n(Cực Hiếm!)`;
            } else {
                nameEl.className = 'text-primary';
            }

            resultState.classList.remove('hidden');
            
            fireConfetti();

            // Show confirm panel
            document.getElementById('rollBtn').classList.add('hidden');
            document.getElementById('confirmPanel').classList.remove('hidden');
            isRolling = false;
        }, 1200);

    } catch (e) {
        console.error(e);
        resetMachine();
    }
}

function resetMachine() {
    document.getElementById('gachaMachine').classList.remove('shake');
    document.getElementById('gachaFx').classList.add('hidden');
    document.getElementById('gachaItemFx').classList.add('hidden');
    document.getElementById('idleState').classList.remove('hidden');
    document.getElementById('resultState') && document.getElementById('resultState').classList.add('hidden');
    document.getElementById('rewardResult').classList.add('hidden');
    
    document.getElementById('confirmPanel').classList.add('hidden');
    document.getElementById('rollBtn').classList.remove('hidden');
    document.getElementById('rollBtn').innerText = "QUAY LẦN NỮA";
    isRolling = false;
}

async function acceptReward(source) {
    try {
        await fetch('/api/history', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ rewardName: currentRewardName, source: source })
        });
    } catch(e) {
        console.error(e);
    }
    resetMachine();
}

function declineReward() {
    resetMachine();
}

function fireConfetti() {
    var duration = 3 * 1000;
    var animationEnd = Date.now() + duration;
    var defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 };

    function randomInRange(min, max) {
        return Math.random() * (max - min) + min;
    }

    var interval = setInterval(function() {
        var timeLeft = animationEnd - Date.now();

        if (timeLeft <= 0) {
            return clearInterval(interval);
        }

        var particleCount = 50 * (timeLeft / duration);
        confetti(Object.assign({}, defaults, { particleCount, origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 } }));
        confetti(Object.assign({}, defaults, { particleCount, origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 } }));
    }, 250);
}
