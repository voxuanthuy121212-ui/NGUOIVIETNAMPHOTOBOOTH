// 1. BẢO VỆ TÁC QUYỀN (Khắc tinh của Google App & Trình duyệt nhúng)
document.addEventListener('contextmenu', event => event.preventDefault());
document.addEventListener('selectstart', event => event.preventDefault());
document.addEventListener('dragstart', event => {
    if (event.target.tagName.toLowerCase() === 'img') event.preventDefault();
});

// Biến các ảnh nền tĩnh thành "bóng ma", hoàn toàn vô hình với cảm ứng
document.addEventListener('DOMContentLoaded', () => {
    const disableTouchImages = document.querySelectorAll('.shelf-bg, .layer-nen, .khung-vien, #main-bg, #running-dog, .captured-img');
    disableTouchImages.forEach(img => {
        img.style.pointerEvents = 'none';
    });

    // Chặn luồng nhấn giữ trên các nút bấm nhưng vẫn cho phép nhấp (click)
    document.querySelectorAll('.btn-left').forEach(btn => {
        btn.addEventListener('touchstart', function(e) {
            e.preventDefault(); // Cắt đuôi menu "Lưu hình ảnh"
            this.click();       // Chủ động chạy lệnh của nút
        }, {passive: false});
    });
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

// 4B. TẢI ẢNH TỪ MÁY
btnUpload.onclick = () => { fileInput.click(); };
fileInput.onchange = () => {
    if (fileInput.files.length !== 2) { alert("Vui lòng chọn 2 hình!"); return; }
    const loadImg = (reader, target, videoTarget) => {
        reader.onload = () => {
            target.src = reader.result; target.style.display = 'block';
            target.style.left = '0%'; target.style.top = '0%'; target.style.transform = 'scale(1)';
            target.style.pointerEvents = 'auto'; // Cho phép cảm ứng để drag
            target.classList.add('decor-draggable');
            videoTarget.style.display = 'none'; 
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

btnDown.onclick = () => {
    const booth = document.getElementById('booth-container');
    
    html2canvas(booth, { scale: 3, useCORS: true, backgroundColor: null }).then(cv => {
        // Chuyển canvas thành dạng Blob (file thực) thay vì chuỗi ký tự base64
        cv.toBlob(blob => {
            const fileName = 'nguoiVietNamdethuong_yuth.i.jpg';
            const file = new File([blob], fileName, { type: 'image/jpeg' });

            // CÁCH 1: Dùng tính năng Chia sẻ của điện thoại (Vượt qua tường lửa của Google App, Zalo, FB)
            if (navigator.canShare && navigator.canShare({ files: [file] })) {
                navigator.share({
                    files: [file],
                    title: 'Ảnh Photo Booth',
                }).catch(err => {
                    // Nếu người dùng hủy chia sẻ hoặc lỗi, thử dùng cách tải thường
                    forceDownload(blob, fileName);
                });
            } else {
                // CÁCH 2: Dành cho máy tính (PC) hoặc trình duyệt cũ không hỗ trợ Share
                forceDownload(blob, fileName);
            }
        }, 'image/jpeg', 0.95);
    });
};

// Hàm ép tải xuống an toàn hơn bằng ObjectURL thay vì Base64
function forceDownload(blob, fileName) {
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.style.display = 'none';
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
}

// 6. Sticker & Background
function setFood(n, b) { 
    document.querySelectorAll('[id^="food-"]').forEach(e => e.style.display = 'none');
    document.querySelectorAll('.item-l-bunbo, .item-l-bunrieu, .item-l-bundau, .item-l-pho, .item-l-caphe').forEach(e => e.classList.remove('active-item'));
    const el = document.getElementById(`food-${n}`); if(el) el.style.display = 'block'; b.classList.add('active-item');
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
