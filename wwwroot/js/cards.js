let GROUPS = [
    { id: 1, name: "Quà cơ bản", probability: 50, class: "group-1" },
    { id: 2, name: "Quà tạm ổn áp", probability: 25, class: "group-2" },
    { id: 3, name: "Quà khá ngon à nhen", probability: 15, class: "group-3" },
    { id: 4, name: "Quà Xịn xò", probability: 8, class: "group-4" },
    { id: 5, name: "Siêu cấp VIP Pro Max", probability: 2, class: "group-5", isVip: true }
];

let isGameActive = true;
let trueResultItem = null; // Tên món quà thực tế
let trueResultGroup = null; // Nhóm của món quà đó
let selectedCardIndex = -1;
let dbRewards = [];

document.addEventListener('DOMContentLoaded', initGame);

async function initGame() {
    // Tải danh sách quà từ DB trước
    try {
        // Tải danh sách nhóm (kèm xác suất mới)
        const groupRes = await fetch('/api/gacha/groups');
        if (groupRes.ok) {
            const groupData = await groupRes.json();
            groupData.forEach(gd => {
                const grp = GROUPS.find(g => g.id === gd.id);
                if (grp) grp.probability = gd.probability;
            });
        }
        
        // Tải danh sách quà
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
        // Nếu tất cả món quà đều có tỉ lệ = 0, chia đều cơ hội
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
    }
    return items[items.length - 1].name;
}

function getRandomItemFromGroup(groupId) {
    // Lọc quà thuộc nhóm và còn số lượng
    const availableItems = dbRewards.filter(r => r.groupId === groupId && r.quantity > 0);
    if (availableItems.length > 0) {
        // Random dựa trên Tỉ lệ rớt của từng món (đồng bộ với Gacha)
        return getWeightedRandomItem(availableItems);
    }
    // Nếu hết quà trong nhóm, trả về tên nhóm mặc định
    const fallbackGroup = GROUPS.find(g => g.id === groupId);
    return fallbackGroup ? fallbackGroup.name : "Quà Bí Ẩn";
}

// Cho các thẻ lừa (Giai đoạn 2), lấy ưu tiên các món chưa xuất hiện
function getFakeItemFromGroupUnique(groupId, usedItemsSet) {
    const allItems = dbRewards.filter(r => r.groupId === groupId);
    
    // Lọc những món chưa bị trùng
    const availableItems = allItems.filter(r => !usedItemsSet.has(r.name));
    
    if (availableItems.length > 0) {
        // Random mồi nhử dựa trên Tỉ lệ rớt để chân thực nhất
        return getWeightedRandomItem(availableItems);
    }
    
    // Nếu không còn món nào unique trong nhóm này, đành lấy trùng
    if (allItems.length > 0) {
        return getWeightedRandomItem(allItems);
    }
    
    const fallbackGroup = GROUPS.find(g => g.id === groupId);
    return fallbackGroup ? fallbackGroup.name : "Quà Xịn";
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
        colDiv.className = 'col-6 col-sm-4 col-md-4'; // 2 cột ở mobile, 3 cột ở tablet+

        colDiv.innerHTML = `
            <div class="game-card" data-index="${i}" onclick="flipMainCard(${i})">
                <div class="card-inner shadow-sm rounded-4">
                    <div class="card-front bg-primary d-flex justify-content-center align-items-center">
                        <span style="font-size: 3rem; font-weight: 900; color: white;">${i + 1}</span>
                    </div>
                    <div class="card-back d-flex justify-content-center align-items-center bg-white" id="card-back-${i}">
                        <!-- content will be injected on flip -->
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

    // 1. Random Nhóm quà thật -> lấy tên quà thật
    trueResultGroup = getRandomGroup();
    trueResultItem = getRandomItemFromGroup(trueResultGroup.id);

    // 2. Lật thẻ và show kết quả
    const allCards = document.querySelectorAll('.game-card');
    const targetCard = allCards[index];
    const cardBack = document.getElementById(`card-back-${index}`);
    
    const badgeHtml = `<span class="badge bg-secondary mt-2 fs-6 border border-light"> ${trueResultGroup.name}</span>`;
    
    cardBack.innerHTML = `
        <div class="d-flex flex-column align-items-center justify-content-center w-100 h-100 p-2">
            <p class="m-0 fw-bold text-center ${trueResultGroup.class}" style="font-size:1.5rem;">${trueResultItem}</p>
            ${badgeHtml}
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

    // 3. Hiển thị text lớn
    document.getElementById('mainTitle').style.display = 'none';
    const resultText = document.getElementById('resultText');
    resultText.innerHTML = `🎉 Bạn nhận được: <span class="${trueResultGroup.class}">${trueResultItem}</span>`;
    resultText.classList.remove('hidden');

    if (trueResultGroup.probability <= 15) {
        confetti({ particleCount: 150, spread: 80, origin: { y: 0.6 } });
    }

    // 4. Bắt đầu giai đoạn 2
    setTimeout(startRegretPhase, 1500);
}



function startRegretPhase() {
    const allCards = document.querySelectorAll('.game-card');
    let remainingIndices = [];
    for (let i = 0; i < 6; i++) {
        if (i !== selectedCardIndex) remainingIndices.push(i);
    }

    remainingIndices = remainingIndices.sort(() => Math.random() - 0.5);

    let fakeGroupResults = [
        GROUPS[4], // VIP
        GROUPS[4], // VIP
        GROUPS[3], // Xịn xò
        GROUPS[2], // Khá ngon
        GROUPS[1]  // Tạm ổn
    ];
    fakeGroupResults = fakeGroupResults.sort(() => Math.random() - 0.5);

    // Tính toán trước 5 thẻ mồi nhử sao cho không trùng nhau (và không trùng thẻ thật)
    let usedItemNames = new Set([trueResultItem]);
    let precalculatedFakeItems = [];

    fakeGroupResults.forEach(fakeGroup => {
        const fakeItemName = getFakeItemFromGroupUnique(fakeGroup.id, usedItemNames);
        usedItemNames.add(fakeItemName);
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
            
            const fakeBadgeHtml = `<span class="badge bg-secondary mt-1" style="font-size: 0.75rem;"> ${fakeGroup.name}</span>`;
            
            cardBack.innerHTML = `
                <div class="d-flex flex-column align-items-center justify-content-center w-100 h-100 p-1">
                    <p class="m-0 fw-bold text-center ${fakeGroup.class}" style="font-size:1.2rem;">${fakeItemName}</p>
                    ${fakeBadgeHtml}
                </div>
            `;
            
            if (fakeGroup.isVip) {
                cardBack.classList.add('vip-glow');
            }
            
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
