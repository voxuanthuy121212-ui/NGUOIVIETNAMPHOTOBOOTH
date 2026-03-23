// 1. Bảo vệ tác quyền
document.addEventListener('contextmenu', event => event.preventDefault());
document.addEventListener('dragstart', event => {
    if (event.target.tagName.toLowerCase() === 'img') event.preventDefault();
});

// 2. Biến số
const btnUpload = document.getElementById('btn-upload'); // Đã sửa tên biến thành Nút Ghep/Upload
const btnRe = document.getElementById('btn-retake');
const btnDown = document.getElementById('btn-download');
const mainBg = document.getElementById('main-bg');
const fileInput = document.getElementById('file-input');
const r1 = document.getElementById('result-1');
const r2 = document.getElementById('result-2');

// (Tải lại trang là mất camera rồi bạn nha, không còn dùng getUserMedia)

// 3. Logic Tải ảnh từ máy lên (Chọn 2 hình)
btnUpload.onclick = () => { fileInput.click(); };

fileInput.onchange = () => {
    if (fileInput.files.length !== 2) {
        alert("Vui lòng nhấn chọn đúng 2 tấm hình để ghép vào khung nhé!");
        return;
    }

    const reader1 = new FileReader();
    const reader2 = new FileReader();

    reader1.onload = () => {
        r1.src = reader1.result;
        r1.style.display = 'block';
        r1.style.left = '0%'; r1.style.top = '0%'; r1.style.transform = 'scale(1)'; // Reset vị trí cũ
        makeInteractiveImage(r1, document.getElementById('frame-1')); // Cho phép kéo thả, zoom
    };
    reader2.onload = () => {
        r2.src = reader2.result;
        r2.style.display = 'block';
        r2.style.left = '0%'; r2.style.top = '0%'; r2.style.transform = 'scale(1)'; // Reset vị trí cũ
        makeInteractiveImage(r2, document.getElementById('frame-2')); // Cho phép kéo thả, zoom
    };

    reader1.readAsDataURL(fileInput.files[0]);
    reader2.readAsDataURL(fileInput.files[1]);

    updateButtons();
};

// 4. Cập nhật nút & Tải về
function updateButtons() {
    btnRe.style.opacity = (r1.src && r2.src) ? '1' : '0.3';
    btnRe.style.pointerEvents = (r1.src && r2.src) ? 'auto' : 'none';
    btnDown.style.opacity = (r1.src && r2.src) ? '1' : '0.3';
    btnDown.style.pointerEvents = (r1.src && r2.src) ? 'auto' : 'none';
}

btnRe.onclick = () => {
    r1.src = ''; r2.src = ''; r1.style.display = 'none'; r2.style.display = 'none';
    fileInput.value = ''; // Reset ô tải file
    updateButtons();
};

btnDown.onclick = () => {
    const booth = document.getElementById('booth-container');
    html2canvas(booth, { scale: 3, useCORS: true, backgroundColor: null, logging: false }).then(cv => {
        const link = document.createElement('a');
        link.download = 'NguoiVietNam_Composition_yuth.i.jpg';
        link.href = cv.toDataURL('image/jpeg', 0.95);
        link.click();
    });
};

// 5. Các hàm Sticker
function setFood(foodName, btn) {
    document.querySelectorAll('[id^="food-"]').forEach(el => el.style.display = 'none');
    document.querySelectorAll('.item-l-bunbo, .item-l-bunrieu, .item-l-bundau, .item-l-pho, .item-l-caphe').forEach(el => el.classList.remove('active-item'));
    const foodEl = document.getElementById(`food-${foodName}`);
    if(foodEl) foodEl.style.display = 'block';
    if(foodName === 'bundau') document.getElementById('food-namtom').style.display = 'block';
    btn.classList.add('active-item');
}

function setText(textName, btn) {
    document.querySelectorAll('[id^="text-"]').forEach(el => el.style.display = 'none');
    document.querySelectorAll('.item-l-iubo, .item-l-iurieu, .item-l-iubundau, .item-l-iupho, .item-l-iucaphe').forEach(el => el.classList.remove('active-item'));
    const textEl = document.getElementById(`text-${textName}`);
    if(textEl) textEl.style.display = 'block';
    btn.classList.add('active-item');
}

function changeBg(newSrc, btn) {
    mainBg.src = newSrc;
    document.querySelectorAll('[class*="item-l-nen"]').forEach(el => el.classList.remove('active-item'));
    btn.classList.add('active-item');
}

const decorList = ['ghe', 'tuidicho', 'caosaovang', 'deplao', 'nonla', 'cotdien'];

// Cho phép kéo thả sticker ngay từ đầu mà không cần đếm
function checkDraggableState() {
    decorList.forEach(id => {
        document.getElementById(`decor-${id}`).classList.add('decor-draggable');
    });
}
checkDraggableState();

function toggleDecor(decorName, btn) {
    const item = document.getElementById(`decor-${decorName}`);
    item.style.display = (item.style.display === 'none' || item.style.display === '') ? 'block' : 'none';
    btn.classList.toggle('active-item');
    btn.classList.toggle('inactive-item');
}

// 6. Logic Kéo thả & Phóng to ảnh (Dành riêng cho 2 ảnh tải lên)
function makeInteractiveImage(el, parent) {
    el.style.transformOrigin = 'center center'; // Phóng to thu nhỏ từ tâm
    el.classList.add('decor-draggable'); // Tái sử dụng class này để bật cảm ứng

    let isDrag = false, initX, initY, sX, sY, initDist = null, initScale = 1;

    el.addEventListener('mousedown', dStart);
    el.addEventListener('touchstart', dStart, {passive: false});
    
    // Zoom bằng lăn chuột
    el.addEventListener('wheel', (e) => {
        e.preventDefault();
        let scale = parseFloat(el.getAttribute('data-scale')) || 1;
        scale += e.deltaY * -0.002;
        scale = Math.min(Math.max(0.4, scale), 3);
        el.setAttribute('data-scale', scale);
        el.style.transform = `scale(${scale})`;
    }, {passive: false});

    function dStart(e) {
        if(!e.target.classList.contains('decor-draggable')) return;
        isDrag = true;
        let cX = e.type.includes('mouse') ? e.clientX : e.touches[0].clientX;
        let cY = e.type.includes('mouse') ? e.clientY : e.touches[0].clientY;
        let style = window.getComputedStyle(el);
        initX = parseFloat(style.left); initY = parseFloat(style.top);
        sX = cX; sY = cY;
        document.addEventListener('mousemove', dMoving);
        document.addEventListener('touchmove', dMoving, {passive: false});
        document.addEventListener('mouseup', dEnd);
        document.addEventListener('touchend', dEnd);
    }

    function dMoving(e) {
        // Pinch-to-zoom (2 ngón trên điện thoại)
        if(e.type === 'touchmove' && e.touches.length === 2) {
            let dist = Math.hypot(e.touches[0].clientX - e.touches[1].clientX, e.touches[0].clientY - e.touches[1].clientY);
            if (!initDist) { initDist = dist; initScale = parseFloat(el.getAttribute('data-scale')) || 1; }
            else {
                let scale = Math.min(Math.max(0.4, initScale * (dist / initDist)), 3);
                el.setAttribute('data-scale', scale);
                el.style.transform = `scale(${scale})`;
            }
            return;
        }
        
        // Kéo thả
        if(!isDrag) return;
        let cX = e.type.includes('mouse') ? e.clientX : e.touches[0].clientX;
        let cY = e.type.includes('mouse') ? e.clientY : e.touches[0].clientY;
        let pRect = parent.getBoundingClientRect();
        
        // Cập nhật vị trí bằng %, không bị giới hạn trong khung, cho kéo ra ngoài một chút để người dùng dễ "canh chỉnh hình"
        el.style.left = ((initX + (cX - sX)) / pRect.width * 100) + '%';
        el.style.top = ((initY + (cY - sY)) / pRect.height * 100) + '%';
    }
    
    function dEnd() { isDrag = false; initDist = null; }
}

decorList.forEach(id => {
    const el = document.getElementById(`decor-${id}`);
    el.addEventListener('mousedown', dStart_Sticker);
    el.addEventListener('touchstart', dStart_Sticker, {passive: false});
    el.addEventListener('wheel', (e) => {
        if(!el.classList.contains('decor-draggable')) return;
        e.preventDefault();
        let scale = parseFloat(el.getAttribute('data-scale')) || 1;
        scale += e.deltaY * -0.002;
        scale = Math.min(Math.max(0.4, scale), 3);
        el.setAttribute('data-scale', scale);
        el.style.transform = `scale(${scale})`;
    }, {passive: false});
});

let isD_S = false, dragE_S = null, iX_S, iY_S, sX_S, sY_S, iDist_S = null, iScale_S = 1;

function dStart_Sticker(e) {
    if(!e.target.classList.contains('decor-draggable')) return;
    isD_S = true; dragE_S = e.target;
    let cX = e.type.includes('mouse') ? e.clientX : e.touches[0].clientX;
    let cY = e.type.includes('mouse') ? e.clientY : e.touches[0].clientY;
    let style = window.getComputedStyle(dragE_S);
    iX_S = parseFloat(style.left); iY_S = parseFloat(style.top);
    sX_S = cX; sY_S = cY;
    document.addEventListener('mousemove', dM_S);
    document.addEventListener('touchmove', dM_S, {passive: false});
    document.addEventListener('mouseup', dE_S);
    document.addEventListener('touchend', dE_S);
}

function dM_S(e) {
    if(!dragE_S) return;
    if(e.type === 'touchmove' && e.touches.length === 2) {
        let dist = Math.hypot(e.touches[0].clientX - e.touches[1].clientX, e.touches[0].clientY - e.touches[1].clientY);
        if (!iDist_S) { iDist_S = dist; iScale_S = parseFloat(dragE_S.getAttribute('data-scale')) || 1; }
        else {
            let scale = Math.min(Math.max(0.4, iScale_S * (dist / iDist_S)), 3);
            dragE_S.setAttribute('data-scale', scale);
            dragE_S.style.transform = `scale(${scale})`;
        }
        return;
    }
    if(!isD_S) return;
    let cX = e.type.includes('mouse') ? e.clientX : e.touches[0].clientX;
    let cY = e.type.includes('mouse') ? e.clientY : e.touches[0].clientY;
    let parentRect = dragE_S.parentElement.getBoundingClientRect();
    dragE_S.style.left = ((iX_S + (cX - sX_S)) / parentRect.width * 100) + '%';
    dragE_S.style.top = ((iY_S + (cY - sY_S)) / parentRect.height * 100) + '%';
}
function dE_S() { isD_S = false; iDist_S = null; dragE_S = null; }