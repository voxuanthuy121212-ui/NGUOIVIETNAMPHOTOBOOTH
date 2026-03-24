// 1. BẢO VỆ TÁC QUYỀN (Sửa lỗi liệt nút trên điện thoại)
document.addEventListener('contextmenu', event => {
    // Chỉ chặn nếu ảnh KHÔNG CÓ chữ 'allow-save'
    if (!event.target.classList.contains('allow-save')) {
        event.preventDefault();
    }
});
document.addEventListener('selectstart', event => event.preventDefault());
document.addEventListener('dragstart', event => {
    if (event.target.tagName.toLowerCase() === 'img') event.preventDefault();
});

document.addEventListener('DOMContentLoaded', () => {
    // Chỉ khóa cảm ứng của các lớp nền và khung (không khóa nút bấm)
    const disableTouchImages = document.querySelectorAll('.shelf-bg, .layer-nen, .khung-vien, #main-bg, #running-dog, .captured-img');
    disableTouchImages.forEach(img => {
        img.style.pointerEvents = 'none';
    });
    
    // Đã gỡ bỏ đoạn mã "hijack" touchstart gây liệt nút Ghép và Tải về tại đây
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
    const constraints = { video: { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: "user" }, audio: false };
    try {
        const stream = await navigator.mediaDevices.getUserMedia(constraints);
        v1.srcObject = stream; v2.srcObject = stream;
        v1.play(); v2.play(); 
    } catch (err) { alert("Hãy cho phép quyền truy cập Camera nhé!"); }
}
startCamera();

// 4A. Logic CHỤP ẢNH
btnCap.onclick = () => {
    if (step > 2) { 
        step = 1; 
        r1.style.display = 'none'; 
        r2.style.display = 'none'; 
        v1.style.display = 'block'; 
        v2.style.display = 'block'; 
        v1.play(); v2.play();
    }
    
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
            const rect = currentV.getBoundingClientRect();
            canvas.width = rect.width * 2; 
            canvas.height = rect.height * 2;

            const videoRatio = currentV.videoWidth / currentV.videoHeight;
            const canvasRatio = canvas.width / canvas.height;

            let sw, sh, sx, sy;
            if (videoRatio > canvasRatio) {
                sw = currentV.videoHeight * canvasRatio; sh = currentV.videoHeight;
                sx = (currentV.videoWidth - sw) / 2; sy = 0;
            } else {
                sw = currentV.videoWidth; sh = currentV.videoWidth / canvasRatio;
                sx = 0; sy = (currentV.videoHeight - sh) / 2;
            }

            ctx.save();
            ctx.translate(canvas.width, 0);
            ctx.scale(-1, 1);
            ctx.drawImage(currentV, sx, sy, sw, sh, 0, 0, canvas.width, canvas.height);
            ctx.restore();

            currentR.src = canvas.toDataURL('image/png');
            currentR.style.display = 'block';
            
            currentR.style.width = '100%'; currentR.style.height = '100%';
            currentR.style.top = '0'; currentR.style.left = '0';
            currentR.style.objectFit = 'fill'; 
            currentR.style.transform = 'none';
            currentR.style.pointerEvents = 'none'; // Khóa luôn cảm ứng của ảnh vừa chụp
            currentR.classList.remove('decor-draggable');

            currentV.style.display = 'none';

            step++; updateButtons();
        }
    }, 1000);
};

// 4B. TẢI ẢNH TỪ MÁY (Sửa lỗi tâm ảnh, thu nhỏ không bị bay mất)
btnUpload.onclick = () => { fileInput.click(); };
fileInput.onchange = () => {
    if (fileInput.files.length !== 2) { alert("Vui lòng chọn đủ 2 hình nhé!"); return; }
    
    const loadImg = (reader, target, videoTarget) => {
        reader.onload = () => {
            target.src = reader.result; 
            
            target.onload = () => {
                target.style.display = 'block';
                target.style.objectFit = 'unset'; 
                
                const container = target.parentElement;
                const cRatio = container.offsetWidth / container.offsetHeight;
                const iRatio = target.naturalWidth / target.naturalHeight;

                // THUẬT TOÁN MỚI: Tính toán % chính xác để ép tâm ảnh trùng khít với tâm khung
                if (iRatio > cRatio) {
                    // Ảnh nằm ngang (Rộng hơn khung)
                    let wPct = (iRatio / cRatio) * 100;
                    target.style.width = wPct + '%';
                    target.style.height = '100%';
                    target.style.left = ((100 - wPct) / 2) + '%'; // Căn giữa trục Ngang
                    target.style.top = '0%';
                } else {
                    // Ảnh nằm dọc (Cao hơn khung)
                    target.style.width = '100%';
                    let hPct = (cRatio / iRatio) * 100;
                    target.style.height = hPct + '%';
                    target.style.left = '0%';
                    target.style.top = ((100 - hPct) / 2) + '%'; // Căn giữa trục Dọc
                }

                // Khóa tâm thu phóng vào chính giữa ảnh
                target.style.transformOrigin = 'center center';
                target.style.transform = 'scale(1)';
                target.setAttribute('data-scale', '1');
                
                target.style.pointerEvents = 'auto'; 
                target.classList.add('decor-draggable');
                videoTarget.style.display = 'none'; 
                
                target.onload = null; 
            };
        };
    };
    
    const r1_read = new FileReader(); loadImg(r1_read, r1, v1); r1_read.readAsDataURL(fileInput.files[0]);
    const r2_read = new FileReader(); loadImg(r2_read, r2, v2); r2_read.readAsDataURL(fileInput.files[1]);
    step = 3; updateButtons();
};
// 5. Cập nhật nút & Tải về
function updateButtons() {
    btnRe.style.opacity = (step > 1) ? '1' : '0.3';
    btnRe.style.pointerEvents = (step > 1) ? 'auto' : 'none';
    btnDown.style.opacity = (step > 2) ? '1' : '0.3';
    btnDown.style.pointerEvents = (step > 2) ? 'auto' : 'none';
}

btnRe.onclick = () => {
    if (step === 2) { 
        step = 1; 
        r1.style.display = 'none'; 
        v1.style.display = 'block'; 
        v1.play(); 
    } 
    else if (step === 3) { 
        step = 2; 
        r2.style.display = 'none'; 
        v2.style.display = 'block'; 
        v2.play(); 
    }
    fileInput.value = ''; updateButtons();
};

// Tự động tạo CSS cho Popup ngay trong JS để không bị thiếu sót
if (!document.getElementById('popup-style')) {
    const style = document.createElement('style');
    style.id = 'popup-style';
    style.innerHTML = `
        .modal-overlay {
            position: fixed; top: 0; left: 0; width: 100vw; height: 100vh;
            background: rgba(0,0,0,0.85); z-index: 99999;
            display: flex; flex-direction: column; align-items: center; justify-content: center;
        }
        .modal-text { 
            color: white; font-size: 18px; margin-bottom: 15px; 
            text-align: center; padding: 0 20px; line-height: 1.5; font-weight: bold;
        }
        .modal-img { 
            max-width: 90%; max-height: 65vh; 
            border: 3px solid #fd7abc; border-radius: 10px; 
            /* CỰC KỲ QUAN TRỌNG: Mở khóa lưu ảnh trên điện thoại */
            -webkit-touch-callout: default !important;
            -webkit-user-select: auto !important;
            pointer-events: auto !important;
        }
        .modal-close { 
            margin-top: 20px; padding: 12px 40px; 
            background: #fd7abc; color: white; border: none; 
            border-radius: 25px; font-size: 16px; font-weight: bold; cursor: pointer; 
        }
    `;
    document.head.appendChild(style);
}

// Xử lý khi nhấn nút Tải Về
btnDown.onclick = function() {
    const booth = document.getElementById('booth-container');
    
    // Báo hiệu đang xử lý để tránh bấm nhiều lần
    const originalOpacity = this.style.opacity;
    this.style.opacity = '0.5';
    this.style.pointerEvents = 'none'; 
    
    // Dùng setTimeout để giao diện kịp mờ đi trước khi máy bị đơ do render ảnh
    setTimeout(() => {
        html2canvas(booth, { 
            scale: window.devicePixelRatio || 2, // Tối ưu tỷ lệ cho điện thoại đỡ lag
            useCORS: true, 
            backgroundColor: null
        }).then(cv => {
            this.style.opacity = originalOpacity;
            this.style.pointerEvents = 'auto'; // Mở khóa nút

            const dataUrl = cv.toDataURL('image/jpeg', 0.95);
            const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

            if (isMobile) {
                // ĐIỆN THOẠI: Mở Popup để nhấn giữ
                showDownloadModal(dataUrl);
            } else {
                // MÁY TÍNH: Ép tải thẳng file xuống
                const link = document.createElement('a');
                link.download = 'nguoiVietNamdethuong_yuth.i.jpg';
                link.href = dataUrl;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
            }
        }).catch(err => {
            alert("Có lỗi khi tạo ảnh, bạn thử lại nhé!");
            this.style.opacity = originalOpacity;
            this.style.pointerEvents = 'auto';
        });
    }, 100); // Trễ 0.1s
};

// Hàm hiển thị Popup trên điện thoại
function showDownloadModal(dataUrl) {
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    
    const text = document.createElement('div');
    text.className = 'modal-text';
    text.innerHTML = '✨ Ảnh đã sẵn sàng!<br>Vui lòng <span style="color:#fd7abc;">NHẤN GIỮ VÀO TẤM ẢNH</span> bên dưới<br>và chọn "Lưu hình ảnh"';
    
    const img = document.createElement('img');
    img.src = dataUrl;
    img.className = 'modal-img'; // Đã gắn sẵn CSS mở khóa ở phía trên
    
    const closeBtn = document.createElement('button');
    closeBtn.className = 'modal-close';
    closeBtn.innerText = 'Đóng lại';
    closeBtn.onclick = () => document.body.removeChild(overlay);
    
    overlay.appendChild(text);
    overlay.appendChild(img);
    overlay.appendChild(closeBtn);
    document.body.appendChild(overlay);
}

// 6. Sticker & Background
// 6. Sticker & Background
function setFood(n, b) { 
    // Ẩn tất cả các món ăn
    document.querySelectorAll('[id^="food-"]').forEach(e => e.style.display = 'none');
    document.querySelectorAll('.item-l-bunbo, .item-l-bunrieu, .item-l-bundau, .item-l-pho, .item-l-caphe').forEach(e => e.classList.remove('active-item'));
    
    // Bật món chính lên
    const el = document.getElementById(`food-${n}`); 
    if(el) el.style.display = 'block'; 
    
    // Thêm điều kiện: Nếu là bún đậu thì hiện thêm mắm tôm
    if (n === 'bundau') {
        const mamTom = document.getElementById('food-namtom'); // ID trong HTML của bạn đang là namtom
        if (mamTom) mamTom.style.display = 'block';
    }
    
    b.classList.add('active-item');
}
function setText(n, b) {
    document.querySelectorAll('[id^="text-"]').forEach(e => e.style.display = 'none');
    document.querySelectorAll('.item-l-iubo, .item-l-iurieu, .item-l-iubundau, .item-l-iupho, .item-l-iucaphe').forEach(e => e.classList.remove('active-item'));
    const el = document.getElementById(`text-${n}`); if(el) el.style.display = 'block'; b.classList.add('active-item');
}
function changeBg(s, b) {
    mainBg.src = s; document.querySelectorAll('[class*="item-l-nen"]').forEach(e => e.classList.remove('active-item')); b.classList.add('active-item');
}

const decorList = ['ghe', 'tuidicho', 'caosaovang', 'deplao', 'nonla', 'cotdien'];
function checkDraggableState() { decorList.forEach(id => { document.getElementById(`decor-${id}`).classList.add('decor-draggable'); }); }
checkDraggableState();

function toggleDecor(n, b) {
    const el = document.getElementById(`decor-${n}`);
    el.style.display = (el.style.display === 'none' || el.style.display === '') ? 'block' : 'none';
    b.classList.toggle('active-item'); b.classList.toggle('inactive-item');
}

// 7. ZOOM & DRAG
const boothArea = document.getElementById('booth-container');
let isD = false, curEl = null, iX, iY, sX, sY, iDist, iScale;

boothArea.addEventListener('wheel', (e) => {
    if (!e.target.classList.contains('decor-draggable')) return;
    e.preventDefault();
    let sc = parseFloat(e.target.getAttribute('data-scale')) || 1;
    sc += e.deltaY * -0.002; sc = Math.min(Math.max(0.2, sc), 5);
    e.target.setAttribute('data-scale', sc); e.target.style.transform = `scale(${sc})`;
}, {passive: false});

boothArea.addEventListener('mousedown', dS);
boothArea.addEventListener('touchstart', dS, {passive: false});

function dS(e) {
    if (!e.target.classList.contains('decor-draggable')) return;
    
    // Đòn kết liễu: Cấm trình duyệt nhận diện hành vi nhấn giữ khi tương tác với các sticker
    if (e.type === 'touchstart') {
        e.preventDefault(); 
    }
    
    isD = true; curEl = e.target;
    let cX = e.type.includes('mouse') ? e.clientX : e.touches[0].clientX;
    let cY = e.type.includes('mouse') ? e.clientY : e.touches[0].clientY;
    iX = curEl.offsetLeft; iY = curEl.offsetTop; sX = cX; sY = cY;
    document.addEventListener('mousemove', dM);
    document.addEventListener('touchmove', dM, {passive: false});
    document.addEventListener('mouseup', dE); document.addEventListener('touchend', dE);
}

function dM(e) {
    if (!curEl) return;
    if(e.type === 'touchmove' && e.touches.length === 2) {
        e.preventDefault();
        let dist = Math.hypot(e.touches[0].clientX - e.touches[1].clientX, e.touches[0].clientY - e.touches[1].clientY);
        if (!iDist) { iDist = dist; iScale = parseFloat(curEl.getAttribute('data-scale')) || 1; }
        else {
            let sc = Math.min(Math.max(0.2, iScale * (dist / iDist)), 5);
            curEl.setAttribute('data-scale', sc); curEl.style.transform = `scale(${sc})`;
        }
        return;
    }
    if(!isD) return;
    let cX = e.type.includes('mouse') ? e.clientX : e.touches[0].clientX;
    let cY = e.type.includes('mouse') ? e.clientY : e.touches[0].clientY;
    let pR = curEl.parentElement.getBoundingClientRect();
    curEl.style.left = (((iX + (cX - sX)) / pR.width) * 100) + '%';
    curEl.style.top = (((iY + (cY - sY)) / pR.height) * 100) + '%';
}
function dE() { isD = false; iDist = null; curEl = null; }
