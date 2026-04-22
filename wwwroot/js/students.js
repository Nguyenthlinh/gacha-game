let students = [];
const redeemModal = new bootstrap.Modal(document.getElementById('redeemModal'));

document.addEventListener('DOMContentLoaded', loadStudents);

async function loadStudents() {
    try {
        const res = await fetch('/api/student');
        if (res.ok) {
            students = await res.json();
            renderStudents();
        }
    } catch(e) { console.error(e); }
}

function renderStudents() {
    const list = document.getElementById('studentList');
    list.innerHTML = '';

    students.forEach(s => {
        const col = document.createElement('div');
        col.className = 'col-md-6 col-lg-4';
        
        const milestone10 = s.stickers >= 10 ? `<span class="badge-milestone bg-milestone-10 clickable-milestone" onclick="manualRedeem(${s.id}, 10, 'Quà Nhỏ')">🎁 Đổi 10</span>` : '';
        const milestone20 = s.stickers >= 20 ? `<span class="badge-milestone bg-milestone-20 clickable-milestone" onclick="manualRedeem(${s.id}, 20, 'Quà Lớn')">🏆 Đổi 20</span>` : '';
        const milestone30 = s.stickers >= 30 ? `<span class="badge-milestone bg-danger text-white clickable-milestone" style="background: linear-gradient(45deg, #f1c40f, #d35400) !important;" onclick="manualRedeem(${s.id}, 30, 'Quà VIP')">👑 Đổi 30</span>` : '';

        col.innerHTML = `
            <div class="student-card d-flex align-items-center justify-content-between">
                <div>
                    <h4 class="mb-1 fw-bold">${s.name}</h4>
                    <div class="d-flex gap-1">${milestone10} ${milestone20} ${milestone30}</div>
                </div>
                <div class="text-end">
                    <div class="sticker-count clickable-milestone" title="Bấm để sửa số" onclick="editManual(${s.id}, ${s.stickers})">${s.stickers}</div>
                    <div class="d-flex gap-1 mt-2 align-items-center">
                        <button class="btn btn-sm btn-outline-danger btn-sticker" style="width:35px;height:35px;font-size:0.8rem" title="Trừ 1" onclick="updateStickers(${s.id}, -1)">-1</button>
                        <div class="vr mx-1"></div>
                        <button class="btn btn-sm btn-outline-primary btn-sticker" onclick="updateStickers(${s.id}, 1)">+1</button>
                        <button class="btn btn-sm btn-outline-success btn-sticker" onclick="updateStickers(${s.id}, 2)">+2</button>
                        <button class="btn btn-sm btn-outline-warning btn-sticker" onclick="updateStickers(${s.id}, 3)">+3</button>
                        <button class="btn btn-sm btn-outline-danger btn-sticker" onclick="deleteStudent(${s.id})">🗑️</button>
                    </div>
                </div>
            </div>
        `;
        list.appendChild(col);
    });
}

// ... existing addStudent ...

async function updateStickers(id, amount) {
    const student = students.find(x => x.id === id);
    if (!student) return;

    // 1. Cập nhật UI tức thì
    const oldStickers = student.stickers;
    student.stickers += amount;
    if (student.stickers < 0) student.stickers = 0;
    renderStudents(); // Vẽ lại local cực nhanh

    // 2. Kiểm tra mốc ngay
    if (oldStickers < 10 && student.stickers >= 10) showRedeemPrompt(student, 10, "Quà Nhỏ");
    else if (oldStickers < 20 && student.stickers >= 20) showRedeemPrompt(student, 20, "Quà Lớn");
    else if (oldStickers < 30 && student.stickers >= 30) showRedeemPrompt(student, 30, "Quà VIP");

    // 3. Gửi server ngầm
    try {
        await fetch(`/api/student/${id}/stickers`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: amount
        });
    } catch(e) { 
        console.error(e); 
        loadStudents(); // Sync lại nếu lỗi
    }
}

function manualRedeem(id, cost, prizeName) {
    const student = students.find(x => x.id === id);
    if (!student) return;
    showRedeemPrompt(student, cost, prizeName);
}

function showRedeemPrompt(student, cost, prizeName) {
    document.getElementById('redeemTitle').innerText = `Đổi quà cho ${student.name}`;
    document.getElementById('redeemMsg').innerText = `Em có muốn dùng ${cost} stickers để đổi lấy ${prizeName} không?`;
    
    const btn = document.getElementById('btnRedeemAction');
    btn.onclick = () => doRedeem(student.id, cost);
    
    redeemModal.show();
}

async function doRedeem(id, cost) {
    try {
        const res = await fetch(`/api/student/${id}/redeem`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: cost
        });
        if (res.ok) {
            redeemModal.hide();
            Swal.fire({
                title: 'Đã đổi quà!',
                text: 'Chúc mừng em nhé! Tiếp tục cố gắng nha.',
                icon: 'success',
                timer: 2000,
                showConfirmButton: false
            });
            loadStudents();
        }
    } catch(e) { console.error(e); }
}

async function editManual(id, currentVal) {
    const { value: newVal } = await Swal.fire({
        title: 'Sửa số Sticker',
        input: 'number',
        inputValue: currentVal,
        showCancelButton: true
    });
    if (newVal !== undefined) {
        const diff = newVal - currentVal;
        updateStickers(id, diff);
    }
}

async function deleteStudent(id) {
    if (!confirm("Xóa học sinh này?")) return;
    try {
        const res = await fetch(`/api/student/${id}`, { method: 'DELETE' });
        if (res.ok) loadStudents();
    } catch(e) { console.error(e); }
}
