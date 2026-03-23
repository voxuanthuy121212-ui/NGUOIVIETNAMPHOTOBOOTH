// 1. Bảo vệ tác quyền
document.addEventListener('contextmenu', event => event.preventDefault());
document.addEventListener('dragstart', event => {
    if (event.target.tagName.toLowerCase() === 'img') event.preventDefault();
});

// 2. Biến số
const v1 = document.getElementById('webcam-1'), v2 = document.getElementById('webcam-2');
const r1 = document.getElementById('result-1'), r2 = document.getElementById('result-2');
const btnCap = document.getElementById('btn-capture');
const btnUpload = document.getElementById('btn-upload'); // Nút tải ảnh lên
const fileInput = document.getElementById('file-input');
const btnRe = document.getElementById('btn-retake');
const btnDown = document.getElementById('btn-download');
const countEl1 = document.getElementById('countdown-1');
const countEl2 = document.getElementById('countdown-2');
const canvas = document.createElement('canvas'); 
const mainBg = document.getElementById('main-bg');

let step = 1; 

// 3. Mở Camera (Giữ nguyên)
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

// 4A. Logic CHỤP ẢNH TỪ CAMERA (Không bị méo/zoom)
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
            
            // Đảm bảo ảnh chụp từ camera không bị kéo thả
            currentR.classList.remove('decor-draggable');
            currentR.style.left = '0'; currentR.style.top = '0'; currentR.style.transform = 'none';

            step++;
            updateButtons();
        }
    }, 1000);
};

// 4B. Logic TẢI ẢNH TỪ MÁY (Cho phép kéo thả & zoom)
btnUpload.onclick = () => { fileInput.click(); };

fileInput.onchange = () => {
    if (fileInput.files.length !== 2) {
        alert("Vui lòng chọn đủ 2 tấm hình để ghép vào khung nhé!");
        return;
    }

    const reader1 = new FileReader();
    const reader2 = new FileReader();

    reader1.onload = () => {
        r1.src = reader1.result;
        r1.style.display = 'block';
        r1.style.left = '0%'; r1.style.top = '0%'; r1.style.transform = 'scale(1)'; 
        makeInteractiveImage(r1, document.getElementById('frame-1')); 
    };
    reader2.onload = () => {
        r2.src = reader2.result;
        r2.style.display = 'block';
        r2.style.left = '0%'; r2.style.top = '0%'; r2.style.transform = 'scale(1)'; 
        makeInteractiveImage(r2, document.getElementById('frame-2')); 
    };

    reader1.readAsDataURL(fileInput.files[0]);
    reader2.readAsDataURL(fileInput.files[1]);

    // Ép step = 3 để hiển thị luôn các nút Tải về / Chụp lại
    step = 3;
    updateButtons();
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
    fileInput.value = ''; // Reset ô tải file
    updateButtons();
};

btnDown.onclick = () => {
    const booth = document.getElementById('booth-container');
    html2canvas(booth, { scale: 3, useCORS: true, backgroundColor: null, logging: false }).then(cv => {
        const link = document.createElement('a');
        link.download = 'NguoiVietNam_Composition.jpg';
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

// Bật kéo thả sticker ngay từ đầu
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

// 7. Logic Kéo thả & Phóng to ảnh (Chung cho Sticker và Ảnh tải lên)
function makeInteractiveImage(el, parent) {
    el.style.transformOrigin = 'center center'; 
    el.classList.add('decor-draggable'); 

    let isDrag = false, initX, initY, sX, sY, initDist = null, initScale = 1;

    el.addEventListener('mousedown', dStart);
    el.addEventListener('touchstart', dStart, {passive: false});
    
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
        
        if(!isDrag) return;
        let cX = e.type.includes('mouse') ? e.clientX : e.touches[0].clientX;
        let cY = e.type.includes('mouse') ? e.clientY : e.touches[0].clientY;
        let pRect = parent.getBoundingClientRect();
        
        el.style.left = ((initX + (cX - sX)) / pRect.width * 100) + '%';
        el.style.top = ((initY + (cY - sY)) / pRect.height * 100) + '%';
    }
    
    function dEnd() { isDrag = false; initDist = null; }
}

// Gắn logic kéo thả cho Sticker
decorList.forEach(id => {
    const el = document.getElementById(`decor-${id}`);
    const parent = document.getElementById('booth-container'); // Sticker di chuyển trong toàn bộ photo-booth
    makeInteractiveImage(el, parent);
});