const GROUPS_INFO = [
    { id: 1, name: "1. Quà cơ bản", class: "group-1", bg: "bg-light text-dark", badge: "Cơ bản", probability: 50 },
    { id: 2, name: "2. Tạm ổn áp", class: "group-2", bg: "bg-success text-white bg-opacity-75", badge: "Tạm ổn", probability: 25 },
    { id: 3, name: "3. Khá ngon à nhen", class: "group-3", bg: "bg-info text-white", badge: "Khá ngon", probability: 15 },
    { id: 4, name: "4. Quà Xịn xò", class: "group-4", bg: "bg-primary text-white", badge: "Xịn xò", probability: 8 },
    { id: 5, name: "5. Siêu cấp VIP Pro Max", class: "group-5", bg: "bg-danger text-white", badge: "VIP Pro", probability: 2 }
];

let selectedRewardIds = new Set();

document.addEventListener('DOMContentLoaded', () => {
    loadRewards();
    loadHistory();
});

async function loadGroups() {
    try {
        const res = await fetch('/api/gacha/groups');
        if (res.ok) {
            const data = await res.json();
            data.forEach(d => {
                const grp = GROUPS_INFO.find(g => g.id === d.id);
                if (grp) grp.probability = d.probability;
            });
        }
    } catch (e) {
        console.error("Lỗi lấy group:", e);
    }
}

async function updateGroupProb(id, val) {
    val = parseFloat(val);
    if (isNaN(val) || val < 0) val = 0;
    try {
        await fetch(`/api/gacha/groups/${id}/rate`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(val)
        });
        loadRewards();
    } catch (e) {
        console.error(e);
    }
}

function toggleSelection(id, isChecked) {
    if (isChecked) {
        selectedRewardIds.add(id);
    } else {
        selectedRewardIds.delete(id);
    }
    updateBulkToolbar();
}

function updateBulkToolbar() {
    const toolbar = document.getElementById('bulkActionsToolbar');
    const countSpan = document.getElementById('selectedCount');
    if(countSpan && toolbar) {
        countSpan.innerText = selectedRewardIds.size;
        if (selectedRewardIds.size > 0) {
            toolbar.classList.remove('d-none');
        } else {
            toolbar.classList.add('d-none');
        }
    }
}

async function bulkDelete() {
    if (selectedRewardIds.size === 0) return;
    if (!confirm(`Xóa ${selectedRewardIds.size} món quà đã chọn?`)) return;
    
    await fetch('/api/gacha/rewards/bulk-action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'delete', ids: Array.from(selectedRewardIds) })
    });
    selectedRewardIds.clear();
    loadRewards();
}

async function bulkMove() {
    if (selectedRewardIds.size === 0) return;
    const targetGroup = parseInt(document.getElementById('bulkMoveGroup').value);
    
    await fetch('/api/gacha/rewards/bulk-action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'move', targetGroupId: targetGroup, ids: Array.from(selectedRewardIds) })
    });
    selectedRewardIds.clear();
    loadRewards();
}

async function loadRewards() {
    await loadGroups();
    try {
        const res = await fetch('/api/gacha/rewards');
        const rewards = await res.json();
        
        const container = document.getElementById('groupsContainer');
        container.innerHTML = '';
        
        GROUPS_INFO.forEach(g => {
            let groupRewards;
            if (g.id === 1) {
                groupRewards = rewards.filter(r => r.groupId === 1 || r.groupId < 1 || r.groupId > 5);
            } else {
                groupRewards = rewards.filter(r => r.groupId === g.id);
            }
            
            let gridSpan = g.id === 5 ? 'style="grid-column: span 2;"' : '';
            
            let html = `
                <div class="border rounded-3 shadow-sm overflow-hidden bg-white d-flex flex-column" ${gridSpan}>
                    <div class="p-2 ${g.bg} fw-bold fs-5 text-center shadow-sm d-flex justify-content-between align-items-center">
                        <span>${g.name}</span>
                        <div class="d-flex align-items-center bg-white rounded p-1" style="width:145px; border: 1px solid rgba(0,0,0,0.1);">
                            <span class="text-dark fw-normal me-1" style="font-size:0.75rem; white-space:nowrap;">Tỉ lệ game:</span>
                            <input type="number" class="form-control form-control-sm text-center fw-bold p-0 text-primary" 
                                style="width: 45px; height: 22px; border: none; background: #e9ecef; border-radius:4px;" 
                                value="${g.probability}" 
                                onchange="updateGroupProb(${g.id}, this.value)">
                            <span class="text-dark ms-1" style="font-size:0.8rem;">%</span>
                        </div>
                    </div>
                    <div class="table-responsive">
                        <table class="table table-hover align-middle mb-0">
                            <thead class="table-light">
                                <tr>
                                    <th style="width: 30px;"></th>
                                    <th style="width: 30px;"></th>
                                    <th>Tên Quà</th>
                                    <th>Số Lượng</th>
                                    <th>Tỉ lệ rớt</th>
                                    <th class="text-end">Thao tác</th>
                                </tr>
                            </thead>
                            <tbody id="group-list-${g.id}" data-group-id="${g.id}" style="min-height: 50px; display: table-row-group;">
            `;
            
            if (groupRewards.length === 0) {
                 html += `<tr class="empty-placeholder"><td colspan="6" class="text-center text-muted small py-3">Kéo thả quà vào đây</td></tr>`;
            }

            groupRewards.forEach(r => {
                const isRare = r.groupId >= 4;
                const rareHtml = isRare ? `<span class="badge bg-danger ms-2 rare-pulse">VIP</span>` : '';
                const textColor = isRare ? 'text-danger' : 'text-primary';
                const isChecked = selectedRewardIds.has(r.id) ? 'checked' : '';
                
                html += `
                    <tr data-id="${r.id}" class="${isRare ? 'table-warning' : ''} ${r.quantity <= 0 ? 'opacity-50' : ''}">
                        <td><input class="form-check-input" type="checkbox" onchange="toggleSelection(${r.id}, this.checked)" ${isChecked}></td>
                        <td class="drag-handle text-muted" style="cursor: grab;">☰</td>
                        <td class="fw-bold fs-5 ${textColor}">
                            ${r.name} 
                            ${rareHtml}
                            ${r.quantity <= 0 ? '<span class="badge bg-secondary ms-2">Hết quà</span>' : ''}
                        </td>
                        <td>
                            <input type="number" class="form-control form-control-sm text-center fw-bold" 
                                style="width: 65px; border-radius: 10px;" 
                                value="${r.quantity}" 
                                onchange="updateQuantity(${r.id}, this.value)">
                        </td>
                        <td>
                            <div class="d-flex align-items-center">
                                <button class="btn btn-sm btn-outline-secondary border-0 fs-5 fw-bold px-2" onclick="updateRate(${r.id}, ${r.dropRate - 1})">-</button>
                                <input type="number" class="form-control form-control-sm text-center fw-bold ${isRare ? 'text-danger border-danger' : 'text-dark'} mx-1" 
                                    style="width: 65px; border-radius: 10px;" 
                                    value="${r.dropRate}" 
                                    onchange="updateRate(${r.id}, this.value)">
                                <span class="fw-bold text-muted ms-1">%</span>
                                <button class="btn btn-sm btn-outline-secondary border-0 fs-5 fw-bold px-2" onclick="updateRate(${r.id}, ${r.dropRate + 1})">+</button>
                            </div>
                        </td>
                        <td class="text-end">
                            <button class="btn btn-sm btn-danger rounded-pill px-3" onclick="deleteReward(${r.id})">Xóa</button>
                        </td>
                    </tr>
                `;
            });
            
            html += `</tbody></table></div></div>`;
            container.innerHTML += html;
        });
        
        updateBulkToolbar();

        if(window.Sortable) {
            GROUPS_INFO.forEach(g => {
                const tbody = document.getElementById(`group-list-${g.id}`);
                Sortable.create(tbody, {
                    group: 'shared',
                    handle: '.drag-handle',
                    animation: 150,
                    filter: '.empty-placeholder',
                    onEnd: async function (evt) {
                        const itemEl = evt.item;
                        const itemId = parseInt(itemEl.getAttribute('data-id'));
                        if (isNaN(itemId)) return;

                        const newGroupId = parseInt(evt.to.getAttribute('data-group-id'));
                        const oldGroupId = parseInt(evt.from.getAttribute('data-group-id'));
                        
                        if (newGroupId !== oldGroupId) {
                            await fetch(`/api/gacha/rewards/${itemId}/group`, {
                                method: 'PATCH',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify(newGroupId)
                            });
                        }
                        
                        const allIds = [];
                        GROUPS_INFO.forEach(gInfo => {
                            const rows = document.getElementById(`group-list-${gInfo.id}`).querySelectorAll('tr[data-id]');
                            rows.forEach(r => allIds.push(parseInt(r.getAttribute('data-id'))));
                        });
                        
                        await fetch('/api/gacha/rewards/reorder', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify(allIds)
                        });
                        
                        loadRewards();
                    }
                });
            });
        }
    } catch (e) {
        console.error('Lỗi khi tải danh sách:', e);
    }
}

async function addBulkRewards() {
    const text = document.getElementById('bulkGifts').value;
    if (!text.trim()) {
        alert("Vui lòng nhập danh sách quà!");
        return;
    }

    const lines = text.split('\n');
    const items = [];

    lines.forEach(line => {
        if (line.trim() === '') return;
        
        let name = line.trim();
        let grp = 1; 
        let qty = 10; 
        let rate = 10; 
        
        if (line.includes(':')) {
            const parts = line.split(':');
            name = parts[0].trim();
            if (parts.length === 2) {
                let val = parseInt(parts[1]) || 1;
                if (val > 5) {
                    qty = val;
                    grp = 1;
                } else {
                    grp = val;
                }
            } else if (parts.length === 3) {
                grp = parseInt(parts[1]) || 1;
                qty = parseInt(parts[2]) || 10;
            } else if (parts.length >= 4) {
                grp = parseInt(parts[1]) || 1;
                qty = parseInt(parts[2]) || 10;
                rate = parseFloat(parts[3]) || 10;
            }
        }
        
        if (grp < 1) grp = 1;
        if (grp > 5) grp = 5;

        if (name) {
            items.push({ name: name, quantity: qty, groupId: grp, dropRate: rate });
        }
    });

    if (items.length > 0) {
        try {
            await fetch('/api/gacha/rewards/bulk', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(items)
            });
            document.getElementById('bulkGifts').value = '';
            loadRewards();
            alert(`Đã thêm thành công ${items.length} món quà!`);
        } catch (e) {
            console.error(e);
            alert("Có lỗi xảy ra khi thêm quà.");
        }
    }
}

async function deleteReward(id) {
    if(confirm('Bạn có chắc chắn muốn xóa món quà này?')) {
        await fetch(`/api/gacha/rewards/${id}`, { method: 'DELETE' });
        selectedRewardIds.delete(id);
        loadRewards();
    }
}

async function clearRewards() {
    if(confirm('Hành động này sẽ XÓA SẠCH toàn bộ quà! Bạn có chắc không?')) {
        await fetch('/api/gacha/rewards/clear', { method: 'DELETE' });
        selectedRewardIds.clear();
        loadRewards();
    }
}

async function updateRate(id, newRate) {
    newRate = parseFloat(newRate);
    if (isNaN(newRate) || newRate < 0) newRate = 0;
    try {
        await fetch(`/api/gacha/rewards/${id}/rate`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(newRate)
        });
        loadRewards();
    } catch (e) {
        console.error(e);
    }
}

async function updateQuantity(id, newQty) {
    newQty = parseInt(newQty);
    if (isNaN(newQty) || newQty < 0) newQty = 0;
    try {
        await fetch(`/api/gacha/rewards/${id}/quantity`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(newQty)
        });
        loadRewards();
    } catch (e) {
        console.error(e);
    }
}

async function loadHistory() {
    const tbody = document.getElementById('historyList');
    tbody.innerHTML = '<tr><td colspan="3" class="text-center">Đang tải...</td></tr>';
    try {
        const res = await fetch('/api/history');
        const data = await res.json();
        
        tbody.innerHTML = '';
        if(data.length === 0) {
            tbody.innerHTML = '<tr><td colspan="3" class="text-center text-muted">Chưa có lịch sử nào.</td></tr>';
            return;
        }

        data.forEach(h => {
            const date = new Date(h.receivedAt).toLocaleString('vi-VN');
            tbody.innerHTML += `
                <tr>
                    <td class="text-muted small">${date}</td>
                    <td><span class="badge ${h.source === 'Gacha' ? 'bg-primary' : 'bg-info'}">${h.source}</span></td>
                    <td class="fw-bold text-success fs-5">${h.rewardName}</td>
                </tr>
            `;
        });
    } catch(e) {
        console.error(e);
        tbody.innerHTML = '<tr><td colspan="3" class="text-danger">Lỗi tải dữ liệu.</td></tr>';
    }
}

async function clearHistory() {
    if(confirm('Bạn có chắc chắn muốn xóa sạch lịch sử nhận quà?')) {
        await fetch('/api/history/clear', { method: 'DELETE' });
        loadHistory();
    }
}
