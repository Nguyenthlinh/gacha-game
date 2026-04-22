let GROUPS = [
    { id: 1, name: "Quà cơ bản", probability: 50, class: "group-1" },
    { id: 2, name: "Quà tạm ổn áp", probability: 25, class: "group-2" },
    { id: 3, name: "Quà khá ngon à nhen", probability: 15, class: "group-3" },
    { id: 4, name: "Quà Xịn xò", probability: 8, class: "group-4" },
    { id: 5, name: "Siêu cấp VIP Pro Max", probability: 2, class: "group-5", isVip: true }
];

let isGameActive = true;
let trueResultItem = null;
let trueResultGroup = null;
let selectedCardIndex = -1;
let dbRewards = [];

document.addEventListener('DOMContentLoaded', initGame);

async function initGame() {
    try {
        const groupRes = await fetch('/api/gacha/groups');
        if (groupRes.ok) {
            const groupData = await groupRes.json();
            groupData.forEach(gd => {
                const grp = GROUPS.find(g => g.id === gd.id);
                if (grp) grp.probability = gd.probability;
            });
        }
        const res = await fetch('/api/gacha/rewards');
        if (res.ok) {
            dbRewards = await res.json();
        }
    } catch(e) { console.error(e); }
    loadCards();
}

function getRandomGroup() {
    let rand = Math.random() * 100;
    let sum = 0;
    for (let group of GROUPS) {
        sum += group.probability;
        if (rand <= sum) return group;
    }
    return GROUPS[0];
}

function getWeightedRandomItem(items) {
    if (!items || items.length === 0) return null;
    const totalWeight = items.reduce((sum, item) => sum + (item.dropRate || 0), 0);
    if (totalWeight <= 0) return items[Math.floor(Math.random() * items.length)].name;
    let rand = Math.random() * totalWeight;
    let currentWeight = 0;
    for (let item of items) {
        currentWeight += (item.dropRate || 0);
        if (rand <= currentWeight) return item.name;
    }
    return items[items.length - 1].name;
}

function getRandomItemFromGroup(groupId) {
    const availableItems = dbRewards.filter(r => r.groupId === groupId && r.quantity > 0);
    if (availableItems.length > 0) return getWeightedRandomItem(availableItems);
    const fallbackGroup = GROUPS.find(g => g.id === groupId);
    return fallbackGroup ? fallbackGroup.name : "Quà Bí Ẩn";
}

function loadCards() {
    isGameActive = true;
    selectedCardIndex = -1;
    trueResultItem = null;
    trueResultGroup = null;
    
    document.getElementById('resetBtn').style.display = 'none';
    document.getElementById('resultText').classList.add('hidden');
    document.getElementById('teaseText').classList.add('hidden');
    document.getElementById('mainTitle').style.display = 'block';

    const board = document.getElementById('cardsBoard');
    board.innerHTML = '';

    for (let i = 0; i < 6; i++) {
        const colDiv = document.createElement('div');
        colDiv.className = 'col-6 col-sm-4 col-md-4';
        colDiv.innerHTML = `
            <div class="game-card" data-index="${i}" onclick="flipMysteryCard(${i})">
                <div class="card-inner shadow-sm rounded-4">
                    <div class="card-front d-flex justify-content-center align-items-center">
                        <span style="font-size: 3rem; font-weight: 900; color: white;">?</span>
                    </div>
                    <div class="card-back d-flex justify-content-center align-items-center bg-white" id="card-back-${i}">
                    </div>
                </div>
            </div>
        `;
        board.appendChild(colDiv);
    }
}

function flipMysteryCard(index) {
    if (!isGameActive) return;
    isGameActive = false;
    selectedCardIndex = index;

    trueResultGroup = getRandomGroup();
    trueResultItem = getRandomItemFromGroup(trueResultGroup.id);

    const allCards = document.querySelectorAll('.game-card');
    const targetCard = allCards[index];
    const cardBack = document.getElementById(`card-back-${index}`);
    
    // CHỈ HIỆN TÊN NHÓM
    cardBack.innerHTML = `
        <div class="d-flex flex-column align-items-center justify-content-center w-100 h-100 p-2">
            <span class="badge ${trueResultGroup.class} mystery-badge">🎁 ${trueResultGroup.name}</span>
        </div>
    `;
    
    if (trueResultGroup.isVip) {
        cardBack.classList.add('vip-glow');
        SoundEngine.cardReveal();
        setTimeout(() => SoundEngine.vipWin(), 400);
    } else if (trueResultGroup.id >= 3) {
        SoundEngine.cardReveal();
        setTimeout(() => SoundEngine.win(), 300);
    } else {
        SoundEngine.cardFlip();
    }

    targetCard.classList.add('flipped', 'shake-on-flip');

    document.getElementById('mainTitle').style.display = 'none';
    const resultText = document.getElementById('resultText');
    const groupReveal = document.getElementById('groupReveal');
    groupReveal.innerHTML = `<span class="badge ${trueResultGroup.class} mystery-badge" style="font-size: 2.5rem !important;">${trueResultGroup.name}</span>`;
    resultText.classList.remove('hidden');

    if (trueResultGroup.probability <= 15) {
        confetti({ particleCount: 150, spread: 80, origin: { y: 0.6 } });
    }

    // Bắt đầu giai đoạn 2: Lật các thẻ còn lại và TỰ ĐỘNG nhận quà
    setTimeout(() => {
        acceptCardReward(); // Tự động nhận quà
        startRegretPhase();
    }, 1500);
}

function startRegretPhase() {
    const allCards = document.querySelectorAll('.game-card');
    let remainingIndices = [];
    for (let i = 0; i < 6; i++) {
        if (i !== selectedCardIndex) remainingIndices.push(i);
    }
    remainingIndices = remainingIndices.sort(() => Math.random() - 0.5);

    // Chim mồi: Chỉ duy nhất 1 thẻ VIP Pro Max mồi nhử
    let otherGroups = [GROUPS[3], GROUPS[2], GROUPS[1], GROUPS[0]];
    let fakeGroupResults = [GROUPS[4]]; // 1 thẻ VIP duy nhất
    for(let i=0; i<4; i++) {
        fakeGroupResults.push(otherGroups[Math.floor(Math.random() * otherGroups.length)]);
    }
    fakeGroupResults = fakeGroupResults.sort(() => Math.random() - 0.5);

    let delay = 0;
    remainingIndices.forEach((cardIndex, i) => {
        setTimeout(() => {
            const card = allCards[cardIndex];
            const fakeGroup = fakeGroupResults[i];
            const cardBack = document.getElementById(`card-back-${cardIndex}`);
            
            cardBack.innerHTML = `
                <div class="d-flex flex-column align-items-center justify-content-center w-100 h-100 p-1">
                    <span class="badge ${fakeGroup.class} mystery-badge" style="font-size: 1rem !important; padding: 8px 12px !important;">🎁 ${fakeGroup.name}</span>
                </div>
            `;
            
            if (fakeGroup.isVip) cardBack.classList.add('vip-glow');
            card.classList.add('flipped', 'unselected');
            SoundEngine.cardFlip();
        }, delay);
        delay += 600;
    });

    setTimeout(() => {
        const teaseText = document.getElementById('teaseText');
        if (trueResultGroup.id <= 2) {
            teaseText.innerText = "Chọn thẻ kia là ngon rồi 🤦‍♂️";
            teaseText.style.color = "#ff4757";
            SoundEngine.regret();
        } else {
            const msgs = ["Đỉnh quá! 🎉", "Hên ghê! 😎"];
            teaseText.innerText = msgs[Math.floor(Math.random() * msgs.length)];
            teaseText.style.color = "#2ed573";
        }
        teaseText.classList.remove('hidden');
        document.getElementById('resetBtn').style.display = 'inline-block';
    }, delay + 500);
}

async function acceptCardReward() {
    try {
        await fetch('/api/history', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ rewardName: trueResultItem, source: 'Lật thẻ (Ẩn)' })
        });
        const itemInDb = dbRewards.find(r => r.name === trueResultItem);
        if (itemInDb && itemInDb.quantity > 0) itemInDb.quantity--;
    } catch(e) { console.error(e); }

    SoundEngine.win();
    confetti({ particleCount: 200, spread: 100, origin: { y: 0.5 } });

    document.getElementById('resultText').classList.add('hidden');
}


