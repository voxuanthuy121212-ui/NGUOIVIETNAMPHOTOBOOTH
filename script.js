// 1. Bảo vệ tác quyền
document.addEventListener('contextmenu', event => event.preventDefault());
document.addEventListener('dragstart', event => {
    if (event.target.tagName.toLowerCase() === 'img') event.preventDefault();
});

// 2. Biến số
const v1 = document.getElementById('webcam-1'), v2 = document.getElementById('webcam-2');
const r1 = document.getElementById('result-1'), r2 = document.getElementById('result-2');
const btnCap = document.getElementById('btn-capture');
const btnUpload = document.getElementById('btn-upload'); 
const fileInput = document.getElementById('file-input');
const btnRe = document.getElementById('btn-retake');
const btnDown = document.getElementById('btn-download');
const countEl1 = document.getElementById('countdown-1');
const countEl2 = document.getElementById('countdown-2');
const canvas = document.createElement('canvas'); 
const mainBg = document.getElementById('main-bg');

let step = 1; 

// 3. Mở Camera
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

// 4A. Logic CHỤP ẢNH TỪ CAMERA
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

            // THUẬT TOÁN CHỤP CHÍNH XÁC THEO KHUNG NHÌN (CHỐNG ZOOM)
            const ctx = canvas.getContext('2d');
            
            // Lấy kích thước thực tế của video đang hiển thị trên màn hình
            const displayWidth = currentV.offsetWidth;
            const displayHeight = currentV.offsetHeight;
            
            // Thiết lập canvas đúng bằng kích thước hiển thị
            canvas.width = displayWidth;
            canvas.height = displayHeight;

            // Tính toán cắt xén (giống object-fit: cover)
            const videoRatio = currentV.videoWidth / currentV.videoHeight;
            const displayRatio = displayWidth / displayHeight;
            
            let sw, sh, sx, sy;
            if (videoRatio > displayRatio) {
                sw = currentV.videoHeight * displayRatio;
                sh = currentV.videoHeight;
                sx = (currentV.videoWidth - sw) / 2;
                sy = 0;
            } else {
                sw = currentV.videoWidth;
                sh = currentV.videoWidth / displayRatio;
                sx = 0;
                sy = (currentV.videoHeight - sh) / 2;
            }

            // Vẽ ảnh lên canvas (có lật gương để giống camera trước)
            ctx.save();
            ctx.translate(canvas.width, 0);
            ctx.scale(-1, 1);
            ctx.drawImage(currentV, sx, sy, sw, sh, 0, 0, canvas.width, canvas.height);
            ctx.restore();

            currentR.src = canvas.toDataURL('image/png');
            currentR.style.display = 'block';
            
            // Khóa ảnh chụp cố định
            currentR.style.width = '100%'; 
            currentR.style.height = '100%';
            currentR.style.objectFit = 'cover';
            currentR.style.transform = 'none';
            currentR.classList.remove('decor-draggable');

            step++;
            updateButtons();
        }
    }, 1000);
};

// 4B. Logic TẢI ẢNH TỪ MÁY LÊN VÀ BẬT KÉO THẢ, ZOOM
btnUpload.onclick = () => { fileInput.click(); };

fileInput.onchange = () => {
    if (fileInput.files.length !== 2) {
        alert("Vui lòng chọn đúng 2 tấm hình để ghép vào khung nhé!");
        return;
    }

    const reader1 = new FileReader();
    const reader2 = new FileReader();

    reader1.onload = () => {
        r1.src = reader1.result;
        r1.style.display = 'block';
        r1.style.left = '0%'; r1.style.top = '0%'; 
        r1.style.transform = 'scale(1)'; 
        r1.setAttribute('data-scale', 1);
        r1.classList.add('decor-draggable'); // Kích hoạt kéo thả cho ảnh
    };
    reader2.onload = () => {
        r2.src = reader2.result;
        r2.style.display = 'block';
        r2.style.left = '0%'; r2.style.top = '0%'; 
        r2.style.transform = 'scale(1)'; 
        r2.setAttribute('data-scale', 1);
        r2.classList.add('decor-draggable'); // Kích hoạt kéo thả cho ảnh
    };

    reader1.readAsDataURL(fileInput.files[0]);
    reader2.readAsDataURL(fileInput.files[1]);

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
    fileInput.value = ''; 
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

// Bật kéo thả sticker
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

// 7. HỆ THỐNG KÉO THẢ & ZOOM (Chung cho cả Ảnh tải lên và Sticker)
const booth = document.getElementById('booth-container');
let isDrag = false, currentDragEl = null, initX = 0, initY = 0, sX = 0, sY = 0, initDist = null, initScale = 1;

// Lăn chuột để Zoom trên Máy tính
booth.addEventListener('wheel', (e) => {
    if (!e.target.classList.contains('decor-draggable')) return;
    e.preventDefault();
    let scale = parseFloat(e.target.getAttribute('data-scale')) || 1;
    scale += e.deltaY * -0.002;
    scale = Math.min(Math.max(0.2, scale), 5); // Cho phép zoom từ 0.2x đến 5x
    e.target.setAttribute('data-scale', scale);
    e.target.style.transform = `scale(${scale})`;
}, {passive: false});

// Bắt đầu kéo
booth.addEventListener('mousedown', dStart);
booth.addEventListener('touchstart', dStart, {passive: false});

function dStart(e) {
    if (!e.target.classList.contains('decor-draggable')) return;
    isDrag = true;
    currentDragEl = e.target;
    currentDragEl.style.transformOrigin = 'center center'; // Đảm bảo zoom từ tâm ảnh

    let cX = e.type.includes('mouse') ? e.clientX : e.touches[0].clientX;
    let cY = e.type.includes('mouse') ? e.clientY : e.touches[0].clientY;

    initX = currentDragEl.offsetLeft;
    initY = currentDragEl.offsetTop;
    sX = cX; sY = cY;

    document.addEventListener('mousemove', dMoving);
    document.addEventListener('touchmove', dMoving, {passive: false});
    document.addEventListener('mouseup', dEnd);
    document.addEventListener('touchend', dEnd);
}

function dMoving(e) {
    if (!currentDragEl) return;

    // Zoom 2 ngón tay trên Điện thoại (Pinch to Zoom)
    if(e.type === 'touchmove' && e.touches.length === 2) {
        e.preventDefault();
        let dist = Math.hypot(e.touches[0].clientX - e.touches[1].clientX, e.touches[0].clientY - e.touches[1].clientY);
        if (!initDist) {
            initDist = dist;
            initScale = parseFloat(currentDragEl.getAttribute('data-scale')) || 1;
        } else {
            let scale = Math.min(Math.max(0.2, initScale * (dist / initDist)), 5);
            currentDragEl.setAttribute('data-scale', scale);
            currentDragEl.style.transform = `scale(${scale})`;
        }
        return;
    }

    // Di chuyển ảnh
    if(!isDrag) return;
    e.preventDefault(); // Chống cuộn màn hình web khi đang kéo ảnh
    let cX = e.type.includes('mouse') ? e.clientX : e.touches[0].clientX;
    let cY = e.type.includes('mouse') ? e.clientY : e.touches[0].clientY;

    let parentRect = currentDragEl.parentElement.getBoundingClientRect();

    currentDragEl.style.left = (((initX + (cX - sX)) / parentRect.width) * 100) + '%';
    currentDragEl.style.top = (((initY + (cY - sY)) / parentRect.height) * 100) + '%';
}

function dEnd() {
    isDrag = false;
    initDist = null;
    currentDragEl = null;
    document.removeEventListener('mousemove', dMoving);
    document.removeEventListener('touchmove', dMoving);
    document.removeEventListener('mouseup', dEnd);
    document.removeEventListener('touchend', dEnd);
}
