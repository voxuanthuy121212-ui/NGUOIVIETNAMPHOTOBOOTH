// 1. Bảo vệ tác quyền
document.addEventListener('contextmenu', event => event.preventDefault());
document.addEventListener('dragstart', event => {
    if (event.target.tagName.toLowerCase() === 'img') event.preventDefault();
});

// 2. Biến số
const v1 = document.getElementById('webcam-1'), v2 = document.getElementById('webcam-2');
const r1 = document.getElementById('result-1'), r2 = document.getElementById('result-2');
const btnCap = document.getElementById('btn-capture');
const btnRe = document.getElementById('btn-retake');
const btnDown = document.getElementById('btn-download');
const countEl1 = document.getElementById('countdown-1');
const countEl2 = document.getElementById('countdown-2');
const canvas = document.createElement('canvas'); 
const mainBg = document.getElementById('main-bg');

let step = 1; 

// 3. Mở Camera tối ưu cho Mobile
async function startCamera() {
    const constraints = {
        video: { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: "user" },
        audio: false
    };
    try {
        const stream = await navigator.mediaDevices.getUserMedia(constraints);
        v1.srcObject = stream; v2.srcObject = stream;
    } catch (err) { alert("Hãy cho phép quyền truy cập Camera nhé!"); }
}
startCamera();

// 4. Logic chụp ảnh KHÔNG MÉO & KHÔNG ZOOM
btnCap.onclick = () => {
    if (step > 2) { step = 1; r1.style.display = 'none'; r2.style.display = 'none'; }
    
    const currentCountEl = step === 1 ? countEl1 : countEl2;
    currentCountEl.style.display = 'block';
    let count = 3; currentCountEl.innerText = count;

    let timer = setInterval(() => {
        count--;
        if (count > 0) currentCountEl.innerText = count;
        else {
            clearInterval(timer);
            currentCountEl.style.display = 'none';

            const currentV = step === 1 ? v1 : v2;
            const currentR = step === 1 ? r1 : r2;

            const ctx = canvas.getContext('2d');
            const vRect = currentV.getBoundingClientRect();
            const targetRatio = vRect.width / vRect.height;
            const videoW = currentV.videoWidth;
            const videoH = currentV.videoHeight;
            const videoRatio = videoW / videoH;

            let sw, sh, sx, sy;

            if (videoRatio > targetRatio) {
                sw = videoH * targetRatio; sh = videoH;
                sx = (videoW - sw) / 2; sy = 0;
            } else {
                sw = videoW; sh = videoW / targetRatio;
                sx = 0; sy = (videoH - sh) / 2;
            }

            canvas.width = sw;
            canvas.height = sh;
            ctx.translate(canvas.width, 0);
            ctx.scale(-1, 1);
            ctx.drawImage(currentV, sx, sy, sw, sh, 0, 0, sw, sh);

            currentR.src = canvas.toDataURL('image/png');
            currentR.style.display = 'block';

            step++;
            updateButtons();
        }
    }, 1000);
};

// 5. Cập nhật nút & Tải về
function updateButtons() {
    btnCap.style.opacity = '1'; btnCap.style.pointerEvents = 'auto';
    btnRe.style.opacity = (step > 1) ? '1' : '0.3';
    btnRe.style.pointerEvents = (step > 1) ? 'auto' : 'none';
    btnDown.style.opacity = (step > 2) ? '1' : '0.3';
    btnDown.style.pointerEvents = (step > 2) ? 'auto' : 'none';
}

btnRe.onclick = () => {
    if (step === 2) { step = 1; r1.style.display = 'none'; } 
    else if (step === 3) { step = 2; r2.style.display = 'none'; }
    updateButtons();
};

btnDown.onclick = () => {
    const booth = document.getElementById('booth-container');
    html2canvas(booth, { scale: 3, useCORS: true, backgroundColor: null, logging: false }).then(cv => {
        const link = document.createElement('a');
        link.download = 'NguoiVietNamdethuong_yuth.i.jpg';
        link.href = cv.toDataURL('image/jpeg', 0.95);
        link.click();
    });
};

// 6. Các hàm Sticker
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

// ĐÃ CHỈNH SỬA: Cho phép kéo thả sticker ngay từ đầu mà không cần đếm
function checkDraggableState() {
    decorList.forEach(id => {
        document.getElementById(`decor-${id}`).classList.add('decor-draggable');
    });
}
checkDraggableState(); // Gọi hàm này ngay khi tải trang

function toggleDecor(decorName, btn) {
    const item = document.getElementById(`decor-${decorName}`);
    item.style.display = (item.style.display === 'none' || item.style.display === '') ? 'block' : 'none';
    btn.classList.toggle('active-item');
    btn.classList.toggle('inactive-item');
}

// Logic Kéo thả & Zoom
let isDragging = false, currentDragEl = null, initialX, initialY, startX, startY, initialDistance = null, initialScale = 1;

decorList.forEach(id => {
    const el = document.getElementById(`decor-${id}`);
    el.addEventListener('mousedown', dragStart);
    el.addEventListener('touchstart', dragStart, {passive: false});
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

function dragStart(e) {
    if(!e.target.classList.contains('decor-draggable')) return;
    isDragging = true; currentDragEl = e.target;
    let clientX = e.type.includes('mouse') ? e.clientX : e.touches[0].clientX;
    let clientY = e.type.includes('mouse') ? e.clientY : e.touches[0].clientY;
    let style = window.getComputedStyle(currentDragEl);
    initialX = parseFloat(style.left); initialY = parseFloat(style.top);
    startX = clientX; startY = clientY;
    document.addEventListener('mousemove', dragging);
    document.addEventListener('touchmove', dragging, {passive: false});
    document.addEventListener('mouseup', dragEnd);
    document.addEventListener('touchend', dragEnd);
}

function dragging(e) {
    if(!currentDragEl) return;
    if(e.type === 'touchmove' && e.touches.length === 2) {
        let dist = Math.hypot(e.touches[0].clientX - e.touches[1].clientX, e.touches[0].clientY - e.touches[1].clientY);
        if (!initialDistance) { initialDistance = dist; initialScale = parseFloat(currentDragEl.getAttribute('data-scale')) || 1; }
        else {
            let scale = Math.min(Math.max(0.4, initialScale * (dist / initialDistance)), 3);
            currentDragEl.setAttribute('data-scale', scale);
            currentDragEl.style.transform = `scale(${scale})`;
        }
        return;
    }
    if(!isDragging) return;
    let clientX = e.type.includes('mouse') ? e.clientX : e.touches[0].clientX;
    let clientY = e.type.includes('mouse') ? e.clientY : e.touches[0].clientY;
    let parentRect = currentDragEl.parentElement.getBoundingClientRect();
    currentDragEl.style.left = ((initialX + (clientX - startX)) / parentRect.width * 100) + '%';
    currentDragEl.style.top = ((initialY + (clientY - startY)) / parentRect.height * 100) + '%';
}
function dragEnd() { isDragging = false; initialDistance = null; currentDragEl = null; }