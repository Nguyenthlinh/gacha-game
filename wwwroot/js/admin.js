let selectedRewardIds = new Set();
let allGroups = [];
let groupManagerModal;

document.addEventListener('DOMContentLoaded', () => {
    groupManagerModal = new bootstrap.Modal(document.getElementById('groupManagerModal'));
    loadRewards();
    loadHistory();
});

async function loadGroups() {
    try {
        const res = await fetch('/api/gacha/groups');
        if (res.ok) {
            allGroups = await res.json();
            // Cập nhật dropdown di chuyển quà
            const bulkSelect = document.getElementById('bulkMoveGroup');
            if (bulkSelect) {
                bulkSelect.innerHTML = allGroups.map(g => `<option value="${g.id}">${g.name}</option>`).join('');
            }
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

function buildItemRow(r) {
    const isChecked = selectedRewardIds.has(r.id) ? 'checked' : '';
    const outOfStock = r.quantity <= 0 ? '<span class="badge bg-secondary ms-1" style="font-size:0.6rem">Hết</span>' : '';
    return `
        <div class="d-flex align-items-center gap-2 py-2 px-2 rounded-2 mb-1 border bg-white reward-row" data-id="${r.id}" style="${r.quantity<=0?'opacity:0.6':''}">
            <input class="form-check-input flex-shrink-0 mt-0" type="checkbox"
                onchange="toggleSelection(${r.id}, this.checked)" ${isChecked}>
            <span class="drag-handle text-muted flex-shrink-0" style="cursor:grab;font-size:1rem;">&#9776;</span>
            <span class="flex-grow-1 fw-bold text-primary"
                style="min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;" title="${r.name}">
                ${r.name}${outOfStock}
            </span>
            <div class="d-flex align-items-center gap-1 flex-shrink-0">
                <input type="number" min="0" step="1"
                    class="form-control form-control-sm text-center p-1"
                    style="width:54px;border-radius:8px;" value="${r.quantity}"
                    onchange="updateQuantity(${r.id}, this.value)"
                    title="Số lượng">
                <span class="text-muted" style="font-size:0.75rem;">cái</span>
            </div>
            <div class="d-flex align-items-center gap-1 flex-shrink-0">
                <input type="number" min="0" step="1"
                    class="form-control form-control-sm text-center p-1 text-primary"
                    style="width:54px;border-radius:8px;" value="${r.dropRate}"
                    onchange="updateRate(${r.id}, this.value)"
                    title="Tỉ lệ rớt">
                <span class="text-muted" style="font-size:0.75rem;">%</span>
            </div>
            <button class="btn btn-sm btn-outline-danger rounded-pill px-2 flex-shrink-0"
                onclick="deleteReward(${r.id})" title="Xóa" style="font-size:1rem;line-height:1;">&times;</button>
        </div>`;
}

async function loadRewards() {
    await loadGroups();
    try {
        const res = await fetch('/api/gacha/rewards');
        const rewards = await res.json();
        const container = document.getElementById('groupsContainer');

        if (allGroups.length === 0) {
            container.innerHTML = `<div class="alert alert-warning">Hãy thêm ít nhất một nhóm quà để bắt đầu.</div>`;
            return;
        }

        // ---- Build Tab Nav ----
        let tabNav = `<ul class="nav nav-pills mb-2 gap-1 flex-wrap" id="groupTabs">`;
        allGroups.forEach((g, idx) => {
            const cnt = rewards.filter(r => r.groupId === g.id).length;
            const active = idx === 0 ? 'active' : '';
            const color = g.color || '#6c757d';
            tabNav += `
                <li class="nav-item">
                    <button class="nav-link fw-bold ${active}" id="tab-btn-${g.id}"
                        data-bs-toggle="pill" data-bs-target="#tab-pane-${g.id}"
                        style="${active ? `background:${color};color:#fff;border:2px solid ${color}` :
                                         `background:transparent;color:${color};border:2px solid ${color}`};border-radius:20px;font-size:0.85rem;padding:5px 14px;">
                        ${g.name}
                        <span class="badge rounded-pill ms-1" style="background:rgba(0,0,0,0.15);">${cnt}</span>
                    </button>
                </li>`;
        });
        tabNav += `</ul>`;

        // ---- Build Tab Panes ----
        let tabPanes = `<div class="tab-content">`;
        allGroups.forEach((g, idx) => {
            const groupRewards = rewards.filter(r => r.groupId === g.id);
            const active = idx === 0 ? 'show active' : '';
            const color = g.color || '#6c757d';

            let itemsHtml = groupRewards.length === 0
                ? `<div class="text-center text-muted py-4 rounded-3 border border-dashed my-2">
                    <div style="font-size:1.5rem;">&#x1F381;</div>
                    <div class="small">Chưa có quà nào trong nhóm này</div>
                   </div>`
                : groupRewards.map(r => buildItemRow(r)).join('');

            tabPanes += `
                <div class="tab-pane fade ${active}" id="tab-pane-${g.id}" role="tabpanel">
                    <div class="border rounded-3 overflow-hidden">
                        <div class="d-flex justify-content-between align-items-center px-3 py-2"
                            style="background:${color};color:#fff;">
                            <span class="fw-bold fs-6">${g.name} &nbsp;&middot;&nbsp;
                                <span class="fw-normal opacity-75" style="font-size:0.85rem;">${groupRewards.length} món</span>
                            </span>
                            <div class="d-flex align-items-center gap-1 bg-white bg-opacity-25 rounded-pill px-2 py-1">
                                <span style="font-size:0.75rem;opacity:0.9;">Tỉ lệ nhóm:</span>
                                <input type="number" min="0" max="100"
                                    class="text-center fw-bold border-0 p-0"
                                    style="width:42px;background:transparent;color:#fff;font-size:0.9rem;"
                                    value="${g.probability}"
                                    onchange="updateGroupProb(${g.id}, this.value)">
                                <span style="font-size:0.8rem;">%</span>
                            </div>
                        </div>
                        <div class="d-flex align-items-center gap-2 px-3 py-1 bg-light"
                            style="font-size:0.72rem;font-weight:700;color:#888;text-transform:uppercase;letter-spacing:0.04em;">
                            <span style="width:16px;"></span>
                            <span style="width:16px;"></span>
                            <span class="flex-grow-1">Tên quà</span>
                            <span style="width:54px;text-align:center;">Số lượng</span>
                            <span style="width:10px;"></span>
                            <span style="width:54px;text-align:center;">Tỉ lệ rớt</span>
                            <span style="width:10px;"></span>
                            <span style="width:28px;"></span>
                        </div>
                        <div id="group-list-${g.id}" data-group-id="${g.id}"
                            class="px-2 py-2" style="min-height:60px;">
                            ${itemsHtml}
                        </div>
                    </div>
                </div>`;
        });
        tabPanes += `</div>`;

        container.innerHTML = tabNav + tabPanes;
        updateBulkToolbar();

        if (window.Sortable) {
            allGroups.forEach(g => {
                const listEl = document.getElementById(`group-list-${g.id}`);
                Sortable.create(listEl, {
                    group: 'shared',
                    handle: '.drag-handle',
                    animation: 150,
                    onEnd: async function(evt) {
                        const itemId = parseInt(evt.item.getAttribute('data-id'));
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
                        allGroups.forEach(gi => {
                            const list = document.getElementById(`group-list-${gi.id}`);
                            if (list) {
                                list.querySelectorAll('[data-id]')
                                    .forEach(el => allIds.push(parseInt(el.getAttribute('data-id'))));
                            }
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
        let grp = allGroups.length > 0 ? allGroups[0].id : 1; 
        let qty = 10; 
        let rate = 10; 
        
        if (line.includes(':')) {
            const parts = line.split(':');
            name = parts[0].trim();
            if (parts.length >= 2) {
                // Thử tìm nhóm theo số thứ tự (1, 2, 3...) hoặc theo ID
                let groupInput = parseInt(parts[1]);
                if (!isNaN(groupInput)) {
                    // Nếu người dùng nhập 1, 2, 3... thì lấy nhóm tương ứng
                    if (groupInput >= 1 && groupInput <= allGroups.length) {
                        grp = allGroups[groupInput - 1].id;
                    } else {
                        grp = groupInput; // Nếu không thì dùng ID trực tiếp
                    }
                }
            }
            if (parts.length >= 3) qty = parseInt(parts[2]) || 10;
            if (parts.length >= 4) rate = parseFloat(parts[3]) || 10;
        }
        
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
    if (!tbody) return;
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

// ----- Group Management Functions -----

function openGroupManager() {
    renderGroupManagerList();
    groupManagerModal.show();
}

function renderGroupManagerList() {
    const list = document.getElementById('groupManagerList');
    list.innerHTML = allGroups.map(g => `
        <div class="d-flex align-items-center gap-2 mb-2 p-2 border rounded shadow-sm">
            <input type="text" class="form-control form-control-sm" value="${g.name}" onchange="updateGroupInfo(${g.id}, 'name', this.value)">
            <input type="color" class="form-control form-control-color" value="${g.color || '#6c757d'}" onchange="updateGroupInfo(${g.id}, 'color', this.value)">
            <button class="btn btn-sm btn-outline-danger" onclick="deleteGroup(${g.id})">🗑️</button>
        </div>
    `).join('');
}

async function addNewGroup() {
    const name = document.getElementById('newGroupName').value;
    const color = document.getElementById('newGroupColor').value;
    if (!name.trim()) return alert("Hãy nhập tên nhóm!");

    await fetch('/api/gacha/groups', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, color, probability: 0 })
    });
    document.getElementById('newGroupName').value = '';
    loadRewards();
    renderGroupManagerList();
}

async function deleteGroup(id) {
    if (!confirm("Xóa nhóm này? Toàn bộ quà trong nhóm sẽ được chuyển về nhóm đầu tiên.")) return;
    await fetch(`/api/gacha/groups/${id}`, { method: 'DELETE' });
    loadRewards();
    renderGroupManagerList();
}

async function updateGroupInfo(id, field, value) {
    const group = allGroups.find(g => g.id === id);
    if (!group) return;
    group[field] = value;

    await fetch(`/api/gacha/groups/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(group)
    });
    loadRewards();
}
