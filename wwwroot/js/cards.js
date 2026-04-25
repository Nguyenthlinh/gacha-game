let GROUPS = []; // Sẽ được load từ DB

let isGameActive = true;
let trueResultItem = null; // Tên món quà thực tế
let trueResultGroup = null; // Nhóm của món quà đó
let selectedCardIndex = -1;
let dbRewards = [];

document.addEventListener('DOMContentLoaded', initGame);

async function initGame() {
    try {
        // 1. Tải danh sách nhóm quà động
        const groupRes = await fetch('/api/gacha/groups');
        if (groupRes.ok) {
            GROUPS = await groupRes.json();
        }
        
        // 2. Tải danh sách quà
        const res = await fetch('/api/gacha/rewards');
        if (res.ok) {
            dbRewards = await res.json();
        } else {
            console.error("Không thể tải danh sách quà");
        }
    } catch(e) {
        console.error(e);
    }
    loadCards();
}

function getRandomGroup() {
    if (GROUPS.length === 0) return { id: 1, name: "Quà Bí Ẩn", color: "#6c757d" };
    
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
    if (totalWeight <= 0) {
        const randomIndex = Math.floor(Math.random() * items.length);
        return items[randomIndex].name;
    }
    
    let rand = Math.random() * totalWeight;
    let currentWeight = 0;
    
    for (let item of items) {
        currentWeight += (item.dropRate || 0);
        if (rand <= currentWeight) {
            return item.name;
        }
    }function getRandomItemFromGroup(groupId) {
    const availableItems = dbRewards.filter(r => r.groupId === groupId && r.quantity > 0);
    if (availableItems.length > 0) {
        return getWeightedRandomItem(availableItems);
    }
    const fallbackGroup = GROUPS.find(g => g.id === groupId);
    return fallbackGroup ? (fallbackGroup.name !== '?' ? fallbackGroup.name : "Món quà may mắn") : "Món quà may mắn";
}

function loadCards() {
    isGameActive = true;
    selectedCardIndex = -1;
    trueResultItem = null;
    trueResultGroup = null;
    
    document.getElementById('resetBtn').style.display = 'none';
    document.getElementById('confirmCardPanel').classList.add('hidden');
    document.getElementById('resultText').classList.add('hidden');
    document.getElementById('regretText').classList.add('hidden');
    document.getElementById('mainTitle').style.display = 'block';

    const board = document.getElementById('cardsBoard');
    board.innerHTML = '';

    for (let i = 0; i < 6; i++) {
        const colDiv = document.createElement('div');
        colDiv.className = 'col-6 col-sm-4 col-md-4'; 

        colDiv.innerHTML = `
            <div class="game-card" data-index="${i}" onclick="flipMainCard(${i})">
                <div class="card-inner shadow-sm rounded-4">
                    <div class="card-front bg-primary d-flex justify-content-center align-items-center">
                        <span style="font-size: 3.5rem; font-weight: 900; color: white;">${i + 1}</span>
                    </div>
                    <div class="card-back d-flex justify-content-center align-items-center bg-white" id="card-back-${i}">
                    </div>
                </div>
            </div>
        `;
        board.appendChild(colDiv);
    }
}

function flipMainCard(index) {
    if (!isGameActive) return;
    isGameActive = false;
    selectedCardIndex = index;

    trueResultGroup = getRandomGroup();
    trueResultItem = getRandomItemFromGroup(trueResultGroup.id);

    const allCards = document.querySelectorAll('.game-card');
    const targetCard = allCards[index];
    const cardBack = document.getElementById(`card-back-${index}`);
    
    // Kiểm tra nhóm dựa trên tên hoặc ID cho linh hoạt
    const isVip = trueResultGroup.id === 3 || trueResultGroup.name.toUpperCase().includes('VIP');
    const isBig = trueResultGroup.id === 2 || trueResultGroup.name.toUpperCase().includes('LỚN');
    const cardClass = isVip ? 'card-vip' : (isBig ? 'card-big' : 'card-small');
    const icon = isVip ? '👑' : (isBig ? '🎁' : '🍬');

    cardBack.className = `card-back d-flex flex-column align-items-center justify-content-center w-100 h-100 ${cardClass}`;
    cardBack.innerHTML = `
        <div class="card-icon" style="font-size: 3.5rem;">${icon}</div>
        <p class="m-0 fw-bold text-center reward-name-text" style="font-size: 1.2rem;">${trueResultItem}</p>
        <span class="badge rounded-pill mt-2 group-badge">${trueResultGroup.name}</span>
    `;
    
    if (isVip) {
        SoundEngine.cardReveal();
        setTimeout(() => SoundEngine.vipWin(), 400);
    } else if (isBig) {
        SoundEngine.cardReveal();
        setTimeout(() => SoundEngine.win(), 300);
    } else {
        SoundEngine.cardFlip();
    }

    targetCard.classList.add('flipped', 'shake-on-flip');

    document.getElementById('mainTitle').style.display = 'none';
    const resultText = document.getElementById('resultText');
    resultText.innerHTML = `🎉 Bạn nhận được: <span class="${cardClass}-text fw-900">${trueResultItem}</span>`;
    resultText.classList.remove('hidden');

    if (trueResultGroup.probability <= 15 || isVip) {
        confetti({ particleCount: 150, spread: 80, origin: { y: 0.6 } });
    }

    setTimeout(startRegretPhase, 1500);
}

function startRegretPhase() {
    const allCards = document.querySelectorAll('.game-card');
    let remainingIndices = [];
    for (let i = 0; i < 6; i++) {
        if (i !== selectedCardIndex) remainingIndices.push(i);
    }

    remainingIndices = remainingIndices.sort(() => Math.random() - 0.5);

    // Tìm nhóm theo tên để an toàn hơn
    const vipGrp = GROUPS.find(g => g.name.toUpperCase().includes('VIP')) || GROUPS[2] || GROUPS[0];
    const bigGrp = GROUPS.find(g => g.name.toUpperCase().includes('LỚN')) || GROUPS[1] || GROUPS[0];
    const smallGrp = GROUPS.find(g => g.name.toUpperCase().includes('NHỎ')) || GROUPS[0];

    let fakeGroups = [vipGrp, bigGrp, bigGrp, smallGrp, smallGrp];
    fakeGroups = fakeGroups.sort(() => Math.random() - 0.5);

    let precalculatedFakeItems = [];
    fakeGroups.forEach(fakeGroup => {
        const fakeItemName = getRandomItemFromGroup(fakeGroup.id);
        precalculatedFakeItems.push({ group: fakeGroup, name: fakeItemName });
    });

    let delay = 0;
    remainingIndices.forEach((cardIndex, i) => {
        setTimeout(() => {
            const card = allCards[cardIndex];
            const fakeData = precalculatedFakeItems[i];
            const fakeGroup = fakeData.group;
            const fakeItemName = fakeData.name;
            
            const cardBack = document.getElementById(`card-back-${cardIndex}`);
            const isVip = fakeGroup === vipGrp;
            const isBig = fakeGroup === bigGrp;
            
            const cardClass = isVip ? 'card-vip' : (isBig ? 'card-big' : 'card-small');
            const icon = isVip ? '👑' : (isBig ? '🎁' : '🍬');
            
            cardBack.className = `card-back d-flex flex-column align-items-center justify-content-center w-100 h-100 ${cardClass}`;
            cardBack.innerHTML = `
                <div class="card-icon" style="font-size: 3.5rem;">${icon}</div>
                <p class="m-0 fw-bold text-center reward-name-text" style="font-size: 1.2rem;">${fakeItemName}</p>
                <span class="badge rounded-pill mt-2 group-badge">${fakeGroup.name}</span>
            `;
            
            card.classList.add('flipped', 'unselected');
            SoundEngine.cardFlip();
        }, delay);
        delay += 600;
    });

    setTimeout(() => {
        const regretText = document.getElementById('regretText');
        
        if (trueResultGroup.id <= 2) {
            regretText.innerText = "Chọn thẻ kia là ngon rùi 😭";
            regretText.className = "text-danger mt-4 hidden";
        } else {
            const praiseMessages = ["Đỉnh nha! 🎉", "Hên lắm mới chọn được á! 😎"];
            const msg = praiseMessages[Math.floor(Math.random() * praiseMessages.length)];
            regretText.innerText = msg;
            regretText.className = "text-success mt-4 hidden";
        }
        
        regretText.classList.remove('hidden');
        document.getElementById('confirmCardPanel').classList.remove('hidden');
        if (trueResultGroup.id <= 2) SoundEngine.regret();
    }, delay + 500);
}

async function acceptCardReward() {
    try {
        await fetch('/api/history', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ rewardName: trueResultItem, source: 'Lật thẻ' })
        });
        
        // Cập nhật lại dbRewards để giảm số lượng ở frontend
        const itemInDb = dbRewards.find(r => r.name === trueResultItem);
        if (itemInDb && itemInDb.quantity > 0) itemInDb.quantity--;
        
    } catch(e) {
        console.error(e);
    }
    
    document.getElementById('confirmCardPanel').classList.add('hidden');
    document.getElementById('resetBtn').style.display = 'inline-block';
}

function declineCardReward() {
    document.getElementById('confirmCardPanel').classList.add('hidden');
    document.getElementById('resetBtn').style.display = 'inline-block';
}
}
