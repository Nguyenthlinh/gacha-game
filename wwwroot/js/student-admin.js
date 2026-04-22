let allStudents = [];
let studentRedeemModal;

document.addEventListener('DOMContentLoaded', () => {
    studentRedeemModal = new bootstrap.Modal(document.getElementById('redeemModal'));
    loadStudentAdmin();
});

async function loadStudentAdmin() {
    try {
        const res = await fetch('/api/student');
        if (res.ok) {
            allStudents = await res.json();
            renderStudentAdmin();
        }
    } catch(e) { console.error(e); }
}

function renderStudentAdmin() {
    const list = document.getElementById('studentListContainer');
    if (!list) return;
    list.innerHTML = '';

    allStudents.forEach(s => {
        const col = document.createElement('div');
        col.className = 'col-md-6 col-lg-4';
        
        const milestone10 = s.stickers >= 10 ? `<span class="badge bg-warning text-dark me-1 clickable-milestone" onclick="promptRedeem(${s.id}, 10, 'Quà Nhỏ')" title="Bấm để đổi Quà Nhỏ">🎁 Đổi 10</span>` : '';
        const milestone20 = s.stickers >= 20 ? `<span class="badge bg-success me-1 clickable-milestone" onclick="promptRedeem(${s.id}, 20, 'Quà Lớn')" title="Bấm để đổi Quà Lớn">🏆 Đổi 20</span>` : '';
        const milestone30 = s.stickers >= 30 ? `<span class="badge bg-danger me-1 clickable-milestone" onclick="promptRedeem(${s.id}, 30, 'Quà VIP')" title="Bấm để đổi Quà VIP" style="background: linear-gradient(45deg, #f1c40f, #d35400) !important;">👑 Đổi 30</span>` : '';

        col.innerHTML = `
            <div class="p-3 bg-white border rounded-4 shadow-sm h-100 d-flex flex-column justify-content-between" style="border-left: 6px solid #facc15 !important;">
                <div>
                    <h5 class="fw-bold mb-1">${s.name}</h5>
                    <div class="mb-2 d-flex flex-wrap gap-1">${milestone10} ${milestone20} ${milestone30}</div>
                </div>
                <div class="d-flex align-items-center justify-content-between mt-2">
                    <span class="fs-2 fw-900 text-primary clickable-milestone" title="Bấm để sửa số" onclick="editStudentStickers(${s.id}, ${s.stickers})">${s.stickers}</span>
                    <div class="d-flex gap-1 align-items-center">
                        <button class="btn btn-sm btn-outline-danger rounded-circle" style="width:28px;height:28px;font-weight:800;font-size:0.6rem" title="Trừ 1" onclick="updateStudentStickers(${s.id}, -1)">-1</button>
                        <div class="vr mx-1"></div>
                        <button class="btn btn-sm btn-outline-primary rounded-circle" style="width:32px;height:32px;font-weight:800;font-size:0.7rem" onclick="updateStudentStickers(${s.id}, 1)">+1</button>
                        <button class="btn btn-sm btn-outline-success rounded-circle" style="width:32px;height:32px;font-weight:800;font-size:0.7rem" onclick="updateStudentStickers(${s.id}, 2)">+2</button>
                        <button class="btn btn-sm btn-outline-warning rounded-circle" style="width:32px;height:32px;font-weight:800;font-size:0.7rem" onclick="updateStudentStickers(${s.id}, 3)">+3</button>
                        <button class="btn btn-sm btn-link text-danger p-0 ms-1" onclick="deleteStudentAdmin(${s.id})">🗑️</button>
                    </div>
                </div>
            </div>
        `;
        list.appendChild(col);
    });
}

async function addBulkStudents() {
    const textarea = document.getElementById('bulkStudentsInput');
    const namesStr = textarea.value.trim();
    if (!namesStr) return;

    const names = namesStr.split('\n').map(n => n.trim()).filter(n => n);
    
    try {
        const res = await fetch('/api/student/bulk', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(names)
        });
        if (res.ok) {
            textarea.value = '';
            loadStudentAdmin();
        }
    } catch(e) { 
        console.error(e); 
        alert("Lỗi khi lưu danh sách. Hãy đảm bảo Server đang chạy!");
    }
}

async function updateStudentStickers(id, amount) {
    try {
        const res = await fetch(`/api/student/${id}/stickers`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: amount
        });
        if (res.ok) {
            const updated = await res.json();
            const old = allStudents.find(x => x.id === id);
            
            if (old.stickers < 10 && updated.stickers >= 10) {
                showStudentRedeemPrompt(updated, 10, "Quà Nhỏ");
            } else if (old.stickers < 20 && updated.stickers >= 20) {
                showStudentRedeemPrompt(updated, 20, "Quà Lớn");
            } else if (old.stickers < 30 && updated.stickers >= 30) {
                showStudentRedeemPrompt(updated, 30, "Quà VIP");
            }
            
            loadStudentAdmin();
        }
    } catch(e) { console.error(e); }
}

function promptRedeem(id, cost, prizeName) {
    const student = allStudents.find(x => x.id === id);
    if (!student) return;
    showStudentRedeemPrompt(student, cost, prizeName);
}

function showStudentRedeemPrompt(student, cost, prizeName) {
    document.getElementById('redeemTitle').innerText = `Đổi quà cho ${student.name}`;
    document.getElementById('redeemMsg').innerText = `Em có muốn dùng ${cost} stickers để đổi lấy ${prizeName} không?`;
    
    const btn = document.getElementById('btnRedeemAction');
    btn.onclick = () => doStudentRedeem(student.id, cost);
    
    studentRedeemModal.show();
}

async function doStudentRedeem(id, cost) {
    try {
        const res = await fetch(`/api/student/${id}/redeem`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: cost
        });
        if (res.ok) {
            studentRedeemModal.hide();
            loadStudentAdmin();
        }
    } catch(e) { console.error(e); }
}

async function editStudentStickers(id, currentVal) {
    const { value: newVal } = await Swal.fire({
        title: 'Sửa số Sticker',
        input: 'number',
        inputValue: currentVal,
        showCancelButton: true,
        inputValidator: (value) => {
            if (!value || value < 0) return 'Số không hợp lệ!';
        }
    });

    if (newVal !== undefined) {
        try {
            // Tính toán chênh lệch để dùng API Patch hiện tại hoặc dùng API Set (nếu có)
            const diff = newVal - currentVal;
            const res = await fetch(`/api/student/${id}/stickers`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: diff
            });
            if (res.ok) loadStudentAdmin();
        } catch(e) { console.error(e); }
    }
}
